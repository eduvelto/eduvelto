/**
 * Eduvelto Job Preparation — Step 6 unit tests for the CONTENT seed
 * importer (scripts/apply-job-content-seed.mjs).
 *
 * Covers the pure functions only (no Firestore access — the CLI's
 * emulator writes are exercised by hand, never in unit tests):
 *  (1) validateContentSeed — the real seed passes; tampered seeds
 *      fail (Published subject, verified subject, subject under
 *      it-professional, subject under a null-config exam, doc id
 *      mismatch, duplicate slug, marks sum mismatch, order gap,
 *      missing syllabusSource, non-empty chapters, missing
 *      _meta.version, configVersion drift/missing);
 *  (2) planContentSeedApply — empty DB ⇒ 23 toCreate; exact DB ⇒ 23
 *      unchanged (idempotent); one changed doc ⇒ 1 toUpdate; the
 *      empty collections contribute no docs.
 *  (3) emulatorTargetProblem (Step 6 fold-in, P1-06) — loopback
 *      targets accepted; production hosts, LAN addresses and empty /
 *      malformed targets refused.
 *
 * Runs under plain node: `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  validateContentSeed,
  planContentSeedApply,
} from '../../../scripts/apply-job-content-seed.mjs';
import { emulatorTargetProblem } from '../../../scripts/apply-job-seed.mjs';

const SEED_PATH = fileURLToPath(
  new URL('../../../team/job-content-seed.json', import.meta.url),
);
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as {
  jobSubjects: Record<string, Record<string, unknown>>;
  jobChapters: unknown[];
  jobTopics: unknown[];
  jobLessons: unknown[];
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED)) as typeof SEED;
}

describe('validateContentSeed (Step 6)', () => {
  it('accepts the real seed', () => {
    expect(validateContentSeed(SEED)).toEqual([]);
  });

  it('rejects a Published subject (the seed must never publish)', () => {
    const bad = cloneSeed();
    bad.jobSubjects['bcs__ethics'].status = 'published';
    bad.jobSubjects['bcs__ethics'].reviewStatus = 'Published';
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/jobSubjects\/bcs__ethics: status must be 'draft'/),
      ]),
    );
  });

  it('rejects a verified subject (0 verified teachers — nothing verified yet)', () => {
    const bad = cloneSeed();
    bad.jobSubjects['bank__math'].verifiedBy = 'teacher-1';
    bad.jobSubjects['bank__math'].verifiedAt = '2026-11-22T00:00:00.000Z';
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/verifiedBy must be null/),
        expect.stringMatching(/verifiedAt must be null/),
      ]),
    );
  });

  it('rejects a subject under it-professional (scope undecided, 13.8)', () => {
    const bad = cloneSeed();
    bad.jobSubjects['it-professional__bangla'] = {
      ...bad.jobSubjects['bcs__bangla'],
      examSlug: 'it-professional',
    };
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/it-professional.*no verified subject list/),
      ]),
    );
  });

  it('rejects a subject under a null-config exam', () => {
    const bad = cloneSeed();
    bad.jobSubjects['dgfood__bangla'] = {
      ...bad.jobSubjects['bcs__bangla'],
      examSlug: 'dgfood',
    };
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/dgfood.*no verified subject list/),
      ]),
    );
  });

  it('rejects a doc id that does not match examSlug__slug', () => {
    const bad = cloneSeed();
    bad.jobSubjects['bcs__bangla'].slug = 'bangla-sahitya';
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/doc id 'bcs__bangla' != examSlug__slug/),
      ]),
    );
  });

  it('rejects a duplicate slug within an exam', () => {
    const bad = cloneSeed();
    bad.jobSubjects['bank__bangla2'] = {
      ...bad.jobSubjects['bank__bangla'],
      slug: 'bangla',
    };
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/exam 'bank': duplicate subject slug/),
      ]),
    );
  });

  it('rejects a marks sum that differs from questionCount', () => {
    const bad = cloneSeed();
    bad.jobSubjects['ntrca__math'].marks = 26;
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/subject marks sum \(101\) != questionCount \(100\)/),
      ]),
    );
  });

  it('rejects an order gap', () => {
    const bad = cloneSeed();
    bad.jobSubjects['primary-teacher__general-knowledge'].order = 5;
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/orders are not exactly 1\.\.4/),
      ]),
    );
  });

  it('rejects a missing syllabusSource', () => {
    const bad = cloneSeed();
    bad.jobSubjects['bcs__geography'].syllabusSource = '';
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/syllabusSource missing/)]),
    );
  });

  it('rejects non-empty chapters / topics / lessons (nothing invented in Step 6)', () => {
    const bad = cloneSeed();
    bad.jobChapters = [{ id: 'x' }];
    bad.jobTopics = [{ id: 'y' }];
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/jobChapters must be empty in Step 6/),
        expect.stringMatching(/jobTopics must be empty in Step 6/),
      ]),
    );
  });

  it('rejects a wrong subject count', () => {
    const bad = cloneSeed();
    delete bad.jobSubjects['bcs__ethics'];
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/expected 23 jobSubjects, found 22/)]),
    );
  });

  // Step 6 fold-in, ChatGPT P2-02: the seed names the config version
  // it was derived from, and every subject doc must carry the same
  // version — drift is rejected before any write.
  it('rejects a seed with no _meta.version', () => {
    const bad = cloneSeed() as Record<string, unknown>;
    delete (bad._meta as Record<string, unknown>).version;
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/_meta\.version missing/)]),
    );
  });

  it('rejects a subject whose configVersion differs from the seed version', () => {
    const bad = cloneSeed();
    bad.jobSubjects['bcs__bangla'].configVersion = '2026-11-21.9';
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/bcs__bangla.*configVersion '2026-11-21\.9' != seed version '2026-11-22\.1'/),
      ]),
    );
  });

  it('rejects a subject with no configVersion at all', () => {
    const bad = cloneSeed();
    delete bad.jobSubjects['bank__math'].configVersion;
    expect(validateContentSeed(bad)).toEqual(
      expect.arrayContaining([expect.stringMatching(/bank__math.*configVersion 'undefined'/) ]),
    );
  });
});

describe('emulatorTargetProblem (Step 6 fold-in, ChatGPT P1-06)', () => {
  it('accepts the loopback forms', () => {
    expect(emulatorTargetProblem('127.0.0.1:8080')).toBeNull();
    expect(emulatorTargetProblem('127.0.0.1:8081')).toBeNull();
    expect(emulatorTargetProblem('localhost:8080')).toBeNull();
    expect(emulatorTargetProblem('[::1]:8080')).toBeNull();
    expect(emulatorTargetProblem('127.0.0.1')).toBeNull();
  });

  it('refuses a production Firestore host', () => {
    expect(emulatorTargetProblem('firestore.googleapis.com:443')).toMatch(/REFUSED.*production/);
    expect(emulatorTargetProblem('firestore.googleapis.com')).toMatch(/REFUSED/);
  });

  it('refuses any non-loopback address', () => {
    expect(emulatorTargetProblem('10.0.0.5:8080')).toMatch(/REFUSED.*not a loopback/);
    expect(emulatorTargetProblem('192.168.1.2:8080')).toMatch(/REFUSED.*not a loopback/);
    expect(emulatorTargetProblem('example.com:8080')).toMatch(/REFUSED.*not a loopback/);
  });

  it('refuses an empty or malformed target', () => {
    expect(emulatorTargetProblem('')).toMatch(/empty/);
    expect(emulatorTargetProblem('[::1:8080')).toMatch(/not a valid host:port/);
  });
});

describe('planContentSeedApply', () => {
  it('empty DB ⇒ 23 toCreate, nothing else', () => {
    const plan = planContentSeedApply(
      { jobSubjects: {}, jobChapters: {}, jobTopics: {}, jobLessons: {} },
      SEED,
    );
    expect(plan.toCreate).toHaveLength(23);
    expect(plan.toCreate.every((c) => c.collection === 'jobSubjects')).toBe(true);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toEqual([]);
  });

  it('exact DB ⇒ 23 unchanged (idempotent — a re-run writes nothing)', () => {
    const plan = planContentSeedApply(
      {
        jobSubjects: SEED.jobSubjects,
        jobChapters: {},
        jobTopics: {},
        jobLessons: {},
      },
      SEED,
    );
    expect(plan.toCreate).toEqual([]);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toHaveLength(23);
  });

  it('one changed doc ⇒ exactly 1 toUpdate', () => {
    const existing = cloneSeed();
    existing.jobSubjects['bank__computer'].nameBn = 'কম্পিউটার (পরিবর্তিত)';
    const plan = planContentSeedApply(
      {
        jobSubjects: existing.jobSubjects,
        jobChapters: {},
        jobTopics: {},
        jobLessons: {},
      },
      SEED,
    );
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0].collection).toBe('jobSubjects');
    expect(plan.toUpdate[0].id).toBe('bank__computer');
    expect(plan.unchanged).toHaveLength(22);
  });
});
