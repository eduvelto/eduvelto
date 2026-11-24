/**
 * Eduvelto Job Preparation — Step 5 closure unit tests for the seed
 * importer (scripts/apply-job-seed.mjs, ChatGPT review P1-2).
 *
 * Covers the pure functions only (no Firestore access — the CLI's
 * emulator writes are exercised by hand, never in unit tests):
 *  (1) validateSeed — the real seed passes; tampered seeds fail
 *      (Published exam, unknown category, hub in two categories,
 *      duplicate order, unverified penalty in negativeMarking,
 *      verified patternStatus with an unverified penalty, missing
 *      patternStatus, subject-sum mismatch);
 *  (2) planSeedApply — empty DB ⇒ 24 toCreate; exact DB ⇒ 24
 *      unchanged (idempotent); one changed doc ⇒ 1 toUpdate;
 *  (3) compareDoc — timestamp-only differences are 'unchanged';
 *  (4) seedDocFields — ISO createdAt preserved as a Date, updatedAt
 *      set to now, never overwrites createdAt on reseed;
 *  (5) seedHistoryEntry — the appended entry links before→after and
 *      names the importer as the actor.
 *
 * Runs under plain node: `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  validateSeed,
  validateRulesConfig,
  planSeedApply,
  compareDoc,
  seedDocFields,
  seedHistoryEntry,
} from '../../../scripts/apply-job-seed.mjs';

const SEED_PATH = fileURLToPath(
  new URL('../../../team/job-categories-exams-seed.json', import.meta.url),
);
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as {
  jobCategories: Record<string, Record<string, unknown>>;
  jobExams: Record<string, Record<string, unknown>>;
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED)) as typeof SEED;
}

describe('validateSeed (P1-2)', () => {
  it('accepts the real seed', () => {
    expect(validateSeed(SEED)).toEqual([]);
  });

  it('rejects a Published exam (the seed must never publish)', () => {
    const bad = cloneSeed();
    bad.jobExams.bcs.status = 'published';
    bad.jobExams.bcs.reviewStatus = 'Published';
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/jobExams\/bcs: status must be 'draft'/)]),
    );
  });

  it('rejects an unknown categoryId', () => {
    const bad = cloneSeed();
    bad.jobExams.bcs.categoryId = 'nasa';
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/categoryId 'nasa' is not a known category/)]),
    );
  });

  it('rejects a hub in two categories', () => {
    const bad = cloneSeed();
    (bad.jobCategories.govt.hubSlugs as string[]).push('bank');
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/exam 'bank' belongs to 2 categories/)]),
    );
  });

  it('rejects duplicate category orders', () => {
    const bad = cloneSeed();
    bad.jobCategories.govt.order = 1;
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/duplicate order values/)]),
    );
  });

  it('rejects an unverified penalty sitting in negativeMarking (P1-4)', () => {
    const bad = cloneSeed();
    const bank = bad.jobExams.bank.rulesConfig as Record<string, unknown>;
    bank.negativeMarking = 0.25;
    bank.negativeMarkingVerified = false;
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/unverified penalty must not sit in negativeMarking/),
      ]),
    );
  });

  it('rejects patternStatus verified with an unverified penalty', () => {
    const bad = cloneSeed();
    const bank = bad.jobExams.bank.rulesConfig as Record<string, unknown>;
    // Bank's live seed is now verified on both fields, so the bad
    // case must re-introduce the unverified penalty explicitly.
    bank.patternStatus = 'verified';
    bank.negativeMarkingVerified = false;
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/patternStatus 'verified' cannot carry an unverified penalty/),
      ]),
    );
  });

  it('rejects a missing patternStatus', () => {
    const bad = cloneSeed();
    delete bad.jobExams.bcs.patternStatus;
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/patternStatus 'undefined' is not a known value/)]),
    );
  });

  it('rejects a subject list that does not sum to questionCount', () => {
    const bad = cloneSeed();
    const bcs = bad.jobExams.bcs.rulesConfig as Record<string, unknown>;
    (bcs.subjects as { marks: number }[])[0].marks = 36;
    expect(validateSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/subject marks sum \(206\) != questionCount \(200\)/)]),
    );
  });
});

describe('validateRulesConfig (P1-2/P1-4)', () => {
  it('accepts null (no config) and the real Bank config', () => {
    expect(validateRulesConfig(null, 'x')).toEqual([]);
    expect(validateRulesConfig(SEED.jobExams.bank.rulesConfig, 'bank')).toEqual([]);
  });

  it('rejects a bad patternLabel and a penalty >= marksPerQuestion', () => {
    const bcsConfig = SEED.jobExams.bcs.rulesConfig as Record<string, unknown>;
    expect(
      validateRulesConfig({ ...bcsConfig, patternLabel: 'maybe' }, 'bcs'),
    ).toEqual(
      expect.arrayContaining([expect.stringMatching(/patternLabel 'maybe' is not a known value/)]),
    );
    expect(
      validateRulesConfig({ ...bcsConfig, negativeMarking: 1 }, 'bcs'),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/negativeMarking must be smaller than marksPerQuestion/),
      ]),
    );
  });
});

describe('planSeedApply + compareDoc (P1-2)', () => {
  it('empty DB ⇒ 24 toCreate, nothing else', () => {
    const plan = planSeedApply({ jobCategories: {}, jobExams: {} }, SEED);
    expect(plan.toCreate).toHaveLength(24);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toEqual([]);
  });

  it('exact DB ⇒ 24 unchanged (idempotent — a re-run writes nothing)', () => {
    const plan = planSeedApply(
      { jobCategories: SEED.jobCategories, jobExams: SEED.jobExams },
      SEED,
    );
    expect(plan.toCreate).toEqual([]);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toHaveLength(24);
  });

  it('one changed doc ⇒ exactly 1 toUpdate', () => {
    const existing = cloneSeed();
    existing.jobExams.bcs.nameBn = 'বিসিএস (পরিবর্তিত)';
    const plan = planSeedApply(
      { jobCategories: existing.jobCategories, jobExams: existing.jobExams },
      SEED,
    );
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0].collection).toBe('jobExams');
    expect(plan.toUpdate[0].id).toBe('bcs');
    expect(plan.unchanged).toHaveLength(23);
  });

  it('compareDoc ignores timestamp-only differences', () => {
    const a = { ...SEED.jobExams.bcs };
    const b = {
      ...SEED.jobExams.bcs,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };
    expect(compareDoc(a, b)).toBe('unchanged');
    expect(compareDoc(a, { ...a, nameBn: 'অন্য' })).toBe('modified');
  });
});

describe('seedDocFields + seedHistoryEntry (P1-2)', () => {
  it('preserves the seed createdAt as a Date and sets updatedAt to now', () => {
    const now = new Date('2026-11-22T12:00:00.000Z');
    const fields = seedDocFields(SEED.jobExams.bcs, now);
    expect(fields.createdAt).toEqual(new Date('2026-11-22T00:00:00.000Z'));
    expect(fields.updatedAt).toEqual(now);
  });

  it('uses now for createdAt when the seed carries none', () => {
    const now = new Date('2026-11-22T12:00:00.000Z');
    const { createdAt: _dropped, ...noCreated } = SEED.jobExams.bcs;
    const fields = seedDocFields(noCreated, now);
    expect(fields.createdAt).toEqual(now);
  });

  it('seedHistoryEntry links before→after and names the importer', () => {
    const now = new Date('2026-11-22T12:00:00.000Z');
    const entry = seedHistoryEntry({ before: null, after: { a: 1 }, now });
    expect(entry).toMatchObject({
      changedAt: now,
      changedBy: 'seed-import',
      reason: expect.stringMatching(/Seed re-apply/),
      before: null,
      after: { a: 1 },
      sourceCircular: null,
    });
  });
});
