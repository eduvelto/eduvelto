/**
 * Eduvelto Job Preparation — Step 7 unit tests for the QUESTION BANK
 * seed importer (scripts/apply-job-question-seed.mjs).
 *
 * Covers the pure functions only (no Firestore access — the CLI's
 * emulator writes are exercised by hand, never in unit tests):
 *  (1) validateQuestionSeed — the real (EMPTY) seed passes; tampered
 *      seeds fail (Published question, verified question, question
 *      under it-professional, unknown subject, bad parent chain,
 *      3 options, missing explanation, previous-year without proof,
 *      bundle with correctLetter, bundle count mismatch, bundle
 *      referencing an unknown question, bundle with a wrong ID
 *      pattern, key with bundleId mismatch, key without its bundle,
 *      key referencing a question outside its bundle, missing
 *      _meta.version, configVersion drift/missing);
 *  (2) planQuestionSeedApply — empty DB + empty seed ⇒ 0/0/0; a
 *      one-question seed ⇒ 1 toCreate; exact DB ⇒ unchanged
 *      (idempotent); one changed doc ⇒ 1 toUpdate.
 *  (3) emulatorTargetProblem (shared, Step 6 fold-in P1-06) —
 *      loopback targets accepted; production hosts, LAN addresses
 *      and empty / malformed targets refused.
 *
 * Runs under plain node: `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  validateQuestionSeed,
  planQuestionSeedApply,
  JOB_QUESTION_CONFIG_VERSION,
  liveFlagProblem,
  productionCredentialsProblem,
} from '../../../scripts/apply-job-question-seed.mjs';
import { emulatorTargetProblem } from '../../../scripts/apply-job-seed.mjs';

const SEED_PATH = fileURLToPath(
  new URL('../../../team/job-question-seed.json', import.meta.url),
);
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as {
  _meta: Record<string, unknown>;
  jobQuestions: Record<string, Record<string, unknown>>;
  jobQuestionBundles: Record<string, Record<string, unknown>>;
  jobQuestionKeys: Record<string, Record<string, unknown>>;
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED)) as typeof SEED;
}

/** One valid draft question + its bundle + key, for plan tests. */
function oneQuestionSeed() {
  const seed = cloneSeed();
  const q = {
    examSlug: 'bcs',
    subjectId: 'bcs__bangla',
    chapterId: 'bcs__bangla__grammar',
    topicId: 'bcs__bangla__grammar__sandhi',
    questionText: 'সন্ধি কাকে বলে?',
    options: [
      { letter: 'A', text: 'দুটি স্বরের মিলন' },
      { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
      { letter: 'C', text: 'দুটি শব্দের মিলন' },
      { letter: 'D', text: 'দুটি বাক্যের মিলন' },
    ],
    correctLetter: 'B',
    explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
    whyWrong: null,
    difficulty: 'medium',
    isPreviousYear: false,
    examYear: null,
    source: 'BCS প্রিলিমিনারি সিলেবাস',
    sourceUrl: null,
    status: 'draft',
    reviewStatus: 'Not Started',
    reviewerId: null,
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: null,
    duplicateHash: 'abcdef0123456789',
    duplicateOf: null,
    bundleId: null,
    version: 1,
    configVersion: JOB_QUESTION_CONFIG_VERSION,
    authorId: null,
    createdBy: null,
    createdAt: '2026-11-22T08:00:00.000Z',
    updatedAt: '2026-11-22T08:00:00.000Z',
  };
  seed.jobQuestions['q-seed-1'] = q as unknown as Record<string, unknown>;
  seed.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'] = {
    kind: 'topic',
    examSlug: 'bcs',
    topicId: 'bcs__bangla__grammar__sandhi',
    mockId: null,
    year: null,
    titleBn: 'সন্ধি — অনুশীলন',
    titleEn: 'Sandhi — Practice',
    questions: [
      {
        n: 1,
        questionId: 'q-seed-1',
        topicId: 'bcs__bangla__grammar__sandhi',
        subjectId: 'bcs__bangla',
        questionText: 'সন্ধি কাকে বলে?',
        options: q.options,
      },
    ],
    questionCount: 1,
    status: 'draft',
    reviewStatus: 'Not Started',
    sourceQuestionIds: ['q-seed-1'],
    configVersion: JOB_QUESTION_CONFIG_VERSION,
    createdAt: '2026-11-22T08:00:00.000Z',
    updatedAt: '2026-11-22T08:00:00.000Z',
  };
  seed.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'] = {
    bundleId: 'topic__bcs__bangla__grammar__sandhi',
    answers: [
      {
        n: 1,
        questionId: 'q-seed-1',
        correctLetter: 'B',
        correctText: 'দুটি ধ্বনির মিলন',
        explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
        whyWrong: null,
      },
    ],
    // P1-06: the key carries the bundle's configVersion.
    configVersion: JOB_QUESTION_CONFIG_VERSION,
    createdAt: '2026-11-22T08:00:00.000Z',
    updatedAt: '2026-11-22T08:00:00.000Z',
  };
  return seed;
}

describe('validateQuestionSeed (Step 7)', () => {
  it('accepts the real (empty) seed', () => {
    expect(validateQuestionSeed(SEED)).toEqual([]);
  });

  it('accepts a one-question seed', () => {
    expect(validateQuestionSeed(oneQuestionSeed())).toEqual([]);
  });

  it('rejects a Published question (the seed must never publish)', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].status = 'published';
    s.jobQuestions['q-seed-1'].reviewStatus = 'Published';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a verified question', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].verifiedBy = 'moderator-1';
    s.jobQuestions['q-seed-1'].verifiedAt = '2026-11-22T09:00:00.000Z';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a question under it-professional', () => {
    const s = oneQuestionSeed();
    const q = s.jobQuestions['q-seed-1'];
    q.examSlug = 'it-professional';
    q.subjectId = 'it-professional__programming';
    q.chapterId = 'it-professional__programming__basics';
    q.topicId = 'it-professional__programming__basics__intro';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects an unknown subject', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].subjectId = 'bcs__no-such-subject';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a bad parent chain (topic does not extend chapter)', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].topicId = 'bcs__bangla__vocabulary__sandhi';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects 3 options', () => {
    const s = oneQuestionSeed();
    (s.jobQuestions['q-seed-1'].options as unknown[]).pop();
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a missing explanation', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].explanation = '';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a previous-year question without proof', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].isPreviousYear = true;
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a bundle carrying correctLetter (key leak)', () => {
    const s = oneQuestionSeed();
    const b = s.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'];
    (b.questions as Array<Record<string, unknown>>)[0].correctLetter = 'B';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a bundle with questionCount != questions.length', () => {
    const s = oneQuestionSeed();
    s.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'].questionCount = 5;
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a bundle referencing an unknown question', () => {
    const s = oneQuestionSeed();
    s.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'].sourceQuestionIds = ['q-nope'];
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a bundle with a wrong ID pattern', () => {
    const s = oneQuestionSeed();
    const b = s.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'];
    delete s.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'];
    s.jobQuestionBundles['wrong__id'] = b;
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a key with bundleId != doc id', () => {
    const s = oneQuestionSeed();
    s.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'].bundleId = 'mock__bcs-mock-01';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a key without its bundle (orphaned key)', () => {
    const s = oneQuestionSeed();
    delete s.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'];
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a key answering a question outside its bundle', () => {
    const s = oneQuestionSeed();
    const k = s.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'];
    (k.answers as Array<Record<string, unknown>>)[0].questionId = 'q-somewhere-else';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a missing _meta.version', () => {
    const s = oneQuestionSeed();
    delete (s._meta as Record<string, unknown>).version;
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects configVersion drift', () => {
    const s = oneQuestionSeed();
    s.jobQuestions['q-seed-1'].configVersion = '2026-11-21.9';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a key with configVersion drift (P1-06)', () => {
    const s = oneQuestionSeed();
    s.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'].configVersion = '2026-11-21.9';
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });

  it('rejects a key answering fewer questions than its bundle (P1-06)', () => {
    const s = oneQuestionSeed();
    const k = s.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'];
    (k.answers as unknown[]).push({
      n: 2,
      questionId: 'q-seed-1',
      correctLetter: 'B',
      correctText: 'দুটি ধ্বনির মিলন',
      explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
      whyWrong: null,
    });
    expect(validateQuestionSeed(s).length).toBeGreaterThan(0);
  });
});

describe('planQuestionSeedApply (Step 7)', () => {
  it('empty DB + empty seed ⇒ 0/0/0', () => {
    const plan = planQuestionSeedApply({}, SEED);
    expect(plan.toCreate).toEqual([]);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toEqual([]);
  });

  it('empty DB + one-question seed ⇒ 3 toCreate (question + bundle + key)', () => {
    const plan = planQuestionSeedApply({}, oneQuestionSeed());
    expect(plan.toCreate).toHaveLength(3);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toEqual([]);
  });

  it('exact DB ⇒ all unchanged (idempotent)', () => {
    const seed = oneQuestionSeed();
    const existing = {
      jobQuestions: { 'q-seed-1': seed.jobQuestions['q-seed-1'] },
      jobQuestionBundles: {
        'topic__bcs__bangla__grammar__sandhi': seed.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'],
      },
      jobQuestionKeys: {
        'topic__bcs__bangla__grammar__sandhi': seed.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'],
      },
    };
    const plan = planQuestionSeedApply(existing, seed);
    expect(plan.toCreate).toEqual([]);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.unchanged).toHaveLength(3);
  });

  it('one changed doc ⇒ 1 toUpdate', () => {
    const seed = oneQuestionSeed();
    const changed = JSON.parse(JSON.stringify(seed.jobQuestions['q-seed-1'])) as Record<string, unknown>;
    changed.questionText = 'সন্ধি কাকে বলে? (পুরনো)';
    const existing = {
      jobQuestions: { 'q-seed-1': changed },
      jobQuestionBundles: {
        'topic__bcs__bangla__grammar__sandhi': seed.jobQuestionBundles['topic__bcs__bangla__grammar__sandhi'],
      },
      jobQuestionKeys: {
        'topic__bcs__bangla__grammar__sandhi': seed.jobQuestionKeys['topic__bcs__bangla__grammar__sandhi'],
      },
    };
    const plan = planQuestionSeedApply(existing, seed);
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0].id).toBe('q-seed-1');
    expect(plan.unchanged).toHaveLength(2);
  });
});

describe('emulatorTargetProblem (shared guard, Step 6 fold-in P1-06)', () => {
  it('accepts loopback targets', () => {
    expect(emulatorTargetProblem('127.0.0.1:8085')).toBeNull();
    expect(emulatorTargetProblem('localhost:8085')).toBeNull();
    expect(emulatorTargetProblem('[::1]:8085')).toBeNull();
  });

  it('refuses production hosts, LAN addresses and empty targets', () => {
    expect(emulatorTargetProblem('firestore.googleapis.com:443')).not.toBeNull();
    expect(emulatorTargetProblem('192.168.1.5:8080')).not.toBeNull();
    expect(emulatorTargetProblem('')).not.toBeNull();
    expect(emulatorTargetProblem('eduvelto.firebaseapp.com:443')).not.toBeNull();
  });
});

describe('CLI fail-closed guards (Step 7 fold-in, P1-07)', () => {
  it('refuses --live / --prod / --production / --firestore flags', () => {
    expect(liveFlagProblem(['--apply', '--live'])).not.toBeNull();
    expect(liveFlagProblem(['--apply', '--prod'])).not.toBeNull();
    expect(liveFlagProblem(['--apply', '--production'])).not.toBeNull();
    expect(liveFlagProblem(['--apply', '--firestore'])).not.toBeNull();
  });

  it('accepts an emulator-only invocation (no live flag)', () => {
    expect(liveFlagProblem(['--dry-run', '--emulator', '127.0.0.1:8080'])).toBeNull();
  });

  it('refuses when production credentials are in the environment', () => {
    expect(
      productionCredentialsProblem({ GOOGLE_APPLICATION_CREDENTIALS: '/home/user/key.json' }),
    ).not.toBeNull();
    expect(productionCredentialsProblem({ FIREBASE_CONFIG: '{"projectId":"eduvelto"}' })).not.toBeNull();
  });

  it('accepts a clean environment (no production credentials)', () => {
    expect(productionCredentialsProblem({})).toBeNull();
  });
});
