/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 8
 * (MCQ Practice Engine core: full jobAttempts + jobSessions,
 * 22 Nov 2026).
 *
 * Rules under test (firestore.rules, Step 8): the REPLACED
 * users/{uid}/jobAttempts match (full submit-created attempt,
 * Step 3 §2.11) and the NEW users/{uid}/jobSessions match
 * (Step 3 §2.12). The Step 7 minimal anchor (create in-progress,
 * update once to submitted) is GONE — see the Step 8 report
 * (team/job-rules-step8.md) for the design decisions.
 *
 *  jobAttempts — created ONCE at submit, status 'submitted', full
 *    fields. Only the owner creates; doc-ID == sessionId; the
 *    session with that ID must already be 'submitted' for the same
 *    bundle (session gate); bundle must exist + be Published, with
 *    matching examSlug, fitting kind (practice -> topic/previous,
 *    mock -> mock/daily/weekly) and matching mockId for mocks;
 *    score == clientCalculatedScore; negativeDeduction ==
 *    wrongCount*0.25 OR wrongCount*0.5; counts sum to
 *    answers.size(); answers non-empty and <= the bundle's
 *    questionCount; accuracy 0..100, percentage -100..100;
 *    resultLabel 'practice', trustLevel 'unverified', resultType
 *    'practice', markingStatus 'auto', status 'submitted';
 *    serverVerifiedScore absent-or-null (a student can never write
 *    it). Update/delete: NEVER, even Admin.
 *    HONEST RULE LIMITS (tested only as far as the rules go):
 *    per-answer shape (topicId/correct/marks per answer) CANNOT be
 *    validated by rules — no list indexing — so it is enforced by
 *    the engine lib validator, not here; the exact score formula
 *    needs the exam pattern, which the rules do not look up; float
 *    division (accuracy/percentage formulas) is range-checked only.
 *  jobSessions — created in-progress by the owner on a Published
 *    bundle (mockId required iff mock; endsAt null at create;
 *    practice never has endsAt/clientEndsAtMillis); autosave while
 *    in-progress (answers/currentQuestion/lastSyncedAt/updatedAt
 *    + endsAt set ONCE from null); exactly one terminal transition
 *    (submitted + submittedAt, or abandoned), then frozen; delete
 *    NEVER, even Admin (abandoned sessions are the audit trail).
 *    PAUSED is client-side only — NOT a session-doc status.
 *
 * Same conventions as rules-step7-job-questions.test.ts (numbered
 * cases, VALID_* fixtures, seed via withSecurityRulesDisabled).
 * Run with `npm run test:rules` (whole emulator-tests/ directory).
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step8';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobSessions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 8 jobSessions match.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
// Live timestamps for CREATED attempts: startedAt a minute ago,
// submittedAt now — so startedAt <= submittedAt <= request.time
// holds against the emulator's wall clock (the fixed seed TS is
// AFTER the runner's clock in this session, so it cannot be used
// for created docs).
const NOW = new Date();
const STARTED = new Date(Date.now() - 60 * 1000);

const OPTIONS = [
  { letter: 'A', text: 'দুটি স্বরের মিলন' },
  { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
  { letter: 'C', text: 'দুটি শব্দের মিলন' },
  { letter: 'D', text: 'দুটি বাক্যের মিলন' },
];

const ONE_ANSWER = {
  n: 1,
  questionId: 'q-published-b',
  topicId: 'bcs__bangla__grammar__sandhi',
  subjectId: 'bcs__bangla',
  selected: 'B',
  correct: true,
  marks: 1,
  correctText: 'দুটি ধ্বনির মিলন',
  timeSpentSeconds: 45,
};

const THREE_ANSWERS = [
  { ...ONE_ANSWER },
  {
    n: 2,
    questionId: 'q-karok-2',
    topicId: 'bcs__bangla__grammar__karok',
    subjectId: 'bcs__bangla',
    selected: 'A',
    correct: false,
    marks: -0.25,
    correctText: 'সঠিক উত্তর',
    timeSpentSeconds: 30,
  },
  {
    n: 3,
    questionId: 'q-karok-3',
    topicId: 'bcs__bangla__grammar__karok',
    subjectId: 'bcs__bangla',
    selected: null,
    correct: false,
    marks: 0,
    correctText: 'সঠিক উত্তর',
    timeSpentSeconds: 0,
  },
];

/** A valid FULL submitted attempt (Step 3 §2.11). Practice by
 * default; pass kind 'mock' + mockId + a mock bundleId for a mock.
 * `overrides` replace top-level fields. */
const validSubmittedAttempt = (sessionId: string, overrides: Record<string, unknown> = {}) => ({
  userId: 'student-1',
  kind: 'practice',
  mockId: null,
  bundleId: 'topic__bcs__bangla__grammar__sandhi',
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  topicId: 'bcs__bangla__grammar__sandhi',
  answers: [ONE_ANSWER],
  score: 1,
  totalMarks: 1,
  negativeDeduction: 0,
  correctCount: 1,
  wrongCount: 0,
  unansweredCount: 0,
  accuracy: 100,
  percentage: 100,
  timeSpentSeconds: 45,
  startedAt: STARTED,
  submittedAt: NOW,
  status: 'submitted',
  markingStatus: 'auto',
  resultLabel: 'practice',
  clientCalculatedScore: 1,
  serverVerifiedScore: null,
  trustLevel: 'unverified',
  resultType: 'practice',
  sessionId,
  audit: null,
  answerHashes: null,
  anomalyFlags: null,
  ...overrides,
});

/** A valid session (Step 3 §2.12). Practice by default. */
const validSession = (overrides: Record<string, unknown> = {}) => ({
  kind: 'practice',
  mockId: null,
  bundleId: 'topic__bcs__bangla__grammar__sandhi',
  examSlug: 'bcs',
  status: 'in-progress',
  startedAt: TS,
  endsAt: null,
  questionRefs: [
    { bundleId: 'topic__bcs__bangla__grammar__sandhi', n: 1, questionId: 'q-published-b' },
  ],
  answers: {},
  currentQuestion: 1,
  lastSyncedAt: TS,
  clientEndsAtMillis: null,
  submittedAt: null,
  createdAt: TS,
  updatedAt: TS,
  ...overrides,
});

const VALID_BUNDLE = {
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
      questionId: 'q-published-b',
      topicId: 'bcs__bangla__grammar__sandhi',
      subjectId: 'bcs__bangla',
      questionText: 'সন্ধি কাকে বলে?',
      options: OPTIONS,
    },
  ],
  questionCount: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q-published-b'],
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
};

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
      ['moderator-1', 'moderator'],
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['student-3', 'student'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    // ---- jobQuestionBundles ----
    const bundles: Array<[string, Record<string, unknown>]> = [
      ['topic__bcs__bangla__grammar__sandhi', { ...VALID_BUNDLE }],
      // 3-question published topic bundle (multi-answer attempts).
      ['topic__bcs__bangla__grammar__karok', {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__karok',
        titleBn: 'কারক — অনুশীলন', titleEn: 'Karok — Practice',
        questions: [
          { ...VALID_BUNDLE.questions[0] },
          {
            n: 2, questionId: 'q-karok-2',
            topicId: 'bcs__bangla__grammar__karok', subjectId: 'bcs__bangla',
            questionText: 'কারক কাকে বলে?', options: OPTIONS,
          },
          {
            n: 3, questionId: 'q-karok-3',
            topicId: 'bcs__bangla__grammar__karok', subjectId: 'bcs__bangla',
            questionText: 'বিভক্তি কাকে বলে?', options: OPTIONS,
          },
        ],
        questionCount: 3,
        sourceQuestionIds: ['q-published-b', 'q-karok-2', 'q-karok-3'],
      }],
      ['mock__bcs-mock-01', {
        ...VALID_BUNDLE,
        kind: 'mock', topicId: null, mockId: 'bcs-mock-01',
        titleBn: 'বিসিএস মডেল টেস্ট ১', titleEn: 'BCS Model Test 1',
      }],
      ['mock__bcs-mock-02', {
        ...VALID_BUNDLE,
        kind: 'mock', topicId: null, mockId: 'bcs-mock-02',
        titleBn: 'বিসিএস মডেল টেস্ট ২', titleEn: 'BCS Model Test 2',
      }],
      ['topic__bcs__bangla__grammar__samash', {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__samash',
        titleBn: 'সমাস — খসড়া', titleEn: 'Samash — Draft',
        status: 'draft', reviewStatus: 'Not Started',
      }],
    ];
    for (const [id, data] of bundles) {
      await setDoc(doc(db, 'jobQuestionBundles', id), data);
    }
    // ---- users/{uid}/jobSessions ----
    // One submitted session per SUCCEEDING attempt create (the doc-ID
    // is consumed by the attempt); 'sess-deny' is reused by every
    // DENIED create (nothing is ever created under it).
    const sessions: Array<[string, string, Record<string, unknown>]> = [
      ['student-1', 'sess-ok-1', validSession({ status: 'submitted', submittedAt: TS })],
      ['student-1', 'sess-ok-2', validSession({ status: 'submitted', submittedAt: TS })],
      ['student-1', 'sess-ok-3', validSession({ status: 'submitted', submittedAt: TS })],
      ['student-1', 'sess-ok-3q', validSession({
        bundleId: 'topic__bcs__bangla__grammar__karok',
        status: 'submitted', submittedAt: TS,
        questionRefs: [
          { bundleId: 'topic__bcs__bangla__grammar__karok', n: 1, questionId: 'q-published-b' },
          { bundleId: 'topic__bcs__bangla__grammar__karok', n: 2, questionId: 'q-karok-2' },
          { bundleId: 'topic__bcs__bangla__grammar__karok', n: 3, questionId: 'q-karok-3' },
        ],
      })],
      ['student-1', 'sess-ok-3q-2', validSession({
        bundleId: 'topic__bcs__bangla__grammar__karok',
        status: 'submitted', submittedAt: TS,
        questionRefs: [
          { bundleId: 'topic__bcs__bangla__grammar__karok', n: 1, questionId: 'q-published-b' },
          { bundleId: 'topic__bcs__bangla__grammar__karok', n: 2, questionId: 'q-karok-2' },
          { bundleId: 'topic__bcs__bangla__grammar__karok', n: 3, questionId: 'q-karok-3' },
        ],
      })],
      ['student-1', 'sess-mock-ok-1', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: TS, endsAt: TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-mock-ok-2', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: TS, endsAt: TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-mock-ok-3', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: TS, endsAt: TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      // Reused by DENIED mock creates (s22/s34/s35): a submitted mock
      // session on mock-01, so the session gate passes and the denial
      // comes from the field under test, not the gate.
      ['student-1', 'sess-mock-deny', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: TS, endsAt: TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-deny', validSession({ status: 'submitted', submittedAt: TS })],
      ['student-1', 'sess-inprogress', validSession()],
      ['student-1', 'sess-inprogress-2', validSession()],
      ['student-1', 'sess-mock-inprogress', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-abandoned', validSession({ status: 'abandoned' })],
      ['student-1', 'sess-draft', validSession({
        bundleId: 'topic__bcs__bangla__grammar__samash',
        status: 'submitted', submittedAt: TS,
        questionRefs: [{ bundleId: 'topic__bcs__bangla__grammar__samash', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-2', 'sess-other-submitted', validSession({ status: 'submitted', submittedAt: TS })],
    ];
    for (const [uid, id, data] of sessions) {
      await setDoc(doc(db, 'users', uid, 'jobSessions', id), data);
    }
    // ---- users/{uid}/jobAttempts (seeded, for read/update/delete) ----
    await setDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'attempt-seed-practice'),
      validSubmittedAttempt('attempt-seed-practice'));
    await setDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'attempt-seed-mock'),
      validSubmittedAttempt('attempt-seed-mock', {
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        subjectId: null, topicId: null,
      }));
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

describe('jobAttempts — create: valid submits SUCCEED', () => {
  it('(s1) valid PRACTICE submit on a submitted session SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-ok-1'),
        validSubmittedAttempt('sess-ok-1')),
    );
  });
  it('(s2) valid MOCK submit on a submitted mock session SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-mock-ok-1'),
        validSubmittedAttempt('sess-mock-ok-1', {
          kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
          subjectId: null, topicId: null,
        })),
    );
  });
  it('(s3) submit with the optional audit-only fields (audit/answerHashes/anomalyFlags) SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-ok-2'),
        validSubmittedAttempt('sess-ok-2', {
          audit: { userAgent: 'test-agent', ipHash: 'abc123' },
          answerHashes: ['hash-1'],
          anomalyFlags: [],
        })),
    );
  });
  it('(s4) submit with serverVerifiedScore ABSENT (key omitted, not null) SUCCEEDS', async () => {
    const { serverVerifiedScore: _dropped, ...withoutSvs } = validSubmittedAttempt('sess-ok-3');
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-ok-3'), withoutSvs),
    );
  });
  it('(s5) 3-answer submit (1 correct, 1 wrong at -0.25, 1 unanswered) SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-ok-3q'),
        validSubmittedAttempt('sess-ok-3q', {
          bundleId: 'topic__bcs__bangla__grammar__karok',
          topicId: 'bcs__bangla__grammar__karok',
          answers: THREE_ANSWERS,
          score: 0.75,
          totalMarks: 3,
          negativeDeduction: 0.25,
          correctCount: 1,
          wrongCount: 1,
          unansweredCount: 1,
          accuracy: 50,
          percentage: 25,
          timeSpentSeconds: 120,
          clientCalculatedScore: 0.75,
        })),
    );
  });
  it('(s6) all-wrong submit with a NEGATIVE percentage SUCCEEDS (negative marking is real)', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-ok-3q-2'),
        validSubmittedAttempt('sess-ok-3q-2', {
          bundleId: 'topic__bcs__bangla__grammar__karok',
          topicId: 'bcs__bangla__grammar__karok',
          answers: [
            { ...THREE_ANSWERS[1], n: 1, questionId: 'q-published-b', topicId: 'bcs__bangla__grammar__sandhi' },
            THREE_ANSWERS[1],
          ],
          score: -0.5,
          totalMarks: 3,
          negativeDeduction: 0.5,
          correctCount: 0,
          wrongCount: 2,
          unansweredCount: 0,
          accuracy: 0,
          percentage: -16.67,
          timeSpentSeconds: 60,
          clientCalculatedScore: -0.5,
        })),
    );
  });
  it('(s7) mock submit with negativeDeduction 0.5 per wrong answer (BCS rate) SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-mock-ok-2'),
        validSubmittedAttempt('sess-mock-ok-2', {
          kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
          subjectId: null, topicId: null,
          answers: [{
            n: 1, questionId: 'q-published-b',
            topicId: 'bcs__bangla__grammar__sandhi', subjectId: 'bcs__bangla',
            selected: 'A', correct: false, marks: -0.5,
            correctText: 'দুটি ধ্বনির মিলন', timeSpentSeconds: 30,
          }],
          score: -0.5,
          totalMarks: 1,
          negativeDeduction: 0.5,
          correctCount: 0,
          wrongCount: 1,
          unansweredCount: 0,
          accuracy: 0,
          percentage: -50,
          timeSpentSeconds: 30,
          clientCalculatedScore: -0.5,
        })),
    );
  });
});

describe('jobAttempts — create: field/label validation DENIES', () => {
  it('(s8) kind "quiz" is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { kind: 'quiz' })),
    );
  });
  it('(s9) resultLabel "verified" is DENIED (results are never Verified)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { resultLabel: 'verified' })),
    );
  });
  it('(s10) trustLevel "verified" is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { trustLevel: 'verified' })),
    );
  });
  it('(s11) resultType "verified" is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { resultType: 'verified' })),
    );
  });
  it('(s12) status "in-progress" on create is DENIED (attempts are created submitted)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { status: 'in-progress' })),
    );
  });
  it('(s13) markingStatus "pending" is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { markingStatus: 'pending' })),
    );
  });
  it('(s14) student-written serverVerifiedScore is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { serverVerifiedScore: 95 })),
    );
  });
  it('(s15) counts NOT summing to answers.size() is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { correctCount: 2, wrongCount: 0, unansweredCount: 0 })),
    );
  });
  it('(s16) empty answers is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', {
          answers: [], score: 0, totalMarks: 1,
          correctCount: 0, wrongCount: 0, unansweredCount: 0,
          accuracy: 0, percentage: 0, timeSpentSeconds: 0,
          clientCalculatedScore: 0,
        })),
    );
  });
  it('(s17) more answers than the bundle has questions is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', {
          answers: [ONE_ANSWER, { ...ONE_ANSWER, n: 2, questionId: 'q-other' }],
          score: 2, totalMarks: 2,
          correctCount: 2, wrongCount: 0, unansweredCount: 0,
          accuracy: 100, percentage: 100, clientCalculatedScore: 2,
        })),
    );
  });
  it('(s18) negativeDeduction 0.30 for 1 wrong answer is DENIED (only 0.25 / 0.5)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', {
          answers: [{
            n: 1, questionId: 'q-published-b',
            topicId: 'bcs__bangla__grammar__sandhi', subjectId: 'bcs__bangla',
            selected: 'A', correct: false, marks: -0.25,
            correctText: 'দুটি ধ্বনির মিলন', timeSpentSeconds: 30,
          }],
          score: -0.25, totalMarks: 1, negativeDeduction: 0.30,
          correctCount: 0, wrongCount: 1, unansweredCount: 0,
          accuracy: 0, percentage: -25, timeSpentSeconds: 30,
          clientCalculatedScore: -0.25,
        })),
    );
  });
  it('(s19) score != clientCalculatedScore is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { clientCalculatedScore: 2 })),
    );
  });
  it('(s20) accuracy 101 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { accuracy: 101 })),
    );
  });
  it('(s21) percentage -101 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { percentage: -101 })),
    );
  });
  it('(s22) mockId null when kind is mock is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-mock-deny'),
        validSubmittedAttempt('sess-mock-deny', {
          kind: 'mock', mockId: null, bundleId: 'mock__bcs-mock-01',
          subjectId: null, topicId: null,
        })),
    );
  });
  it('(s23) mockId set when kind is practice is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { mockId: 'bcs-mock-01' })),
    );
  });
  it('(s24) an unexpected extra field is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { isVerified: true })),
    );
  });
});

describe('jobAttempts — create: bundle / exam / session gate DENIES', () => {
  it('(s25) attempt on a DRAFT bundle is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-draft'),
        validSubmittedAttempt('sess-draft', {
          bundleId: 'topic__bcs__bangla__grammar__samash',
          topicId: 'bcs__bangla__grammar__samash',
        })),
    );
  });
  it('(s26) attempt on a NONEXISTENT bundle is DENIED (the session gate would fail too — no session can exist on a bundle that does not exist — but the bundle check fails first)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', {
          bundleId: 'topic__bcs__bangla__grammar__nope',
          topicId: 'bcs__bangla__grammar__nope',
        })),
    );
  });
  it('(s27) unknown examSlug is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { examSlug: 'unknown-exam' })),
    );
  });
  it('(s28) examSlug "common" is DENIED — common is a cross-exam hub, not a canonical exam slug', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { examSlug: 'common' })),
    );
  });
  it('(s29) doc-ID != sessionId is DENIED (no session with the doc-ID exists)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 's29-other-id'),
        validSubmittedAttempt('sess-deny')),
    );
  });
  it('(s30) attempt on an IN-PROGRESS session is DENIED (session must be submitted first)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-inprogress'),
        validSubmittedAttempt('sess-inprogress')),
    );
  });
  it('(s31) attempt on an ABANDONED session is DENIED (abandoned sessions create no attempt)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-abandoned'),
        validSubmittedAttempt('sess-abandoned')),
    );
  });
  it('(s32) attempt with NO session at all is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 's32-no-session'),
        validSubmittedAttempt('s32-no-session')),
    );
  });
  it('(s33) attempt whose bundle differs from its session\'s bundle is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-mock-ok-3'),
        validSubmittedAttempt('sess-mock-ok-3', {
          kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-02',
          subjectId: null, topicId: null,
        })),
    );
  });
  it('(s34) practice attempt on a MOCK bundle is DENIED (kind/bundle mismatch)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-mock-deny'),
        validSubmittedAttempt('sess-mock-deny', {
          bundleId: 'mock__bcs-mock-01', topicId: null,
        })),
    );
  });
  it('(s35) mock attempt whose mockId differs from its bundle\'s mockId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-mock-deny'),
        validSubmittedAttempt('sess-mock-deny', {
          kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-01',
          subjectId: null, topicId: null,
        })),
    );
  });
  it('(s36) student creating an attempt under ANOTHER user\'s path is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-2', 'jobAttempts', 'sess-other-submitted'),
        validSubmittedAttempt('sess-other-submitted', { userId: 'student-2' })),
    );
  });
  it('(s37) signed-out creating an attempt is DENIED', async () => {
    await assertFails(
      setDoc(doc(asSignedOut(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny')),
    );
  });
});

describe('jobAttempts — read / update / delete', () => {
  it('(s38) second submit (update after submitted) is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-seed-practice'), {
        score: 0,
      }),
    );
  });
  it('(s39) delete is DENIED for the student AND for Admin', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-seed-practice')));
    await assertFails(deleteDoc(doc(asAdmin(), 'users', 'student-1', 'jobAttempts', 'attempt-seed-practice')));
  });
  it('(s40) moderator reading a student\'s attempt SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'jobAttempts', 'attempt-seed-practice')));
  });
  it('(s41) another student reading someone else\'s attempt is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'users', 'student-1', 'jobAttempts', 'attempt-seed-practice')));
  });
});

describe('jobSessions — create SUCCEEDS / DENIES', () => {
  it('(s42) valid PRACTICE session create SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-practice'),
        validSession()),
    );
  });
  it('(s43) valid MOCK session create SUCCEEDS (endsAt null at create — set once after read-back)', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-mock'),
        validSession({
          kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
          questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
        })),
    );
  });
  it('(s44) session on a DRAFT bundle is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-draft'),
        validSession({
          bundleId: 'topic__bcs__bangla__grammar__samash',
          questionRefs: [{ bundleId: 'topic__bcs__bangla__grammar__samash', n: 1, questionId: 'q-published-b' }],
        })),
    );
  });
  it('(s45) mock session WITHOUT mockId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-nomock'),
        validSession({
          kind: 'mock', bundleId: 'mock__bcs-mock-01',
          questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
        })),
    );
  });
  it('(s46) practice session with a non-null endsAt is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-endsat'),
        validSession({ endsAt: TS })),
    );
  });
  it('(s47) practice session with a non-null clientEndsAtMillis is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-clientends'),
        validSession({ clientEndsAtMillis: 1793123456789 })),
    );
  });
  it('(s48) mock session with endsAt set AT CREATE is DENIED (endsAt starts null)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-mockends'),
        validSession({
          kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
          endsAt: TS,
          questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
        })),
    );
  });
  it('(s49) mock session whose mockId differs from its bundle\'s mockId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-badmock'),
        validSession({
          kind: 'mock', mockId: 'other-mock', bundleId: 'mock__bcs-mock-01',
          questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
        })),
    );
  });
  it('(s50) session whose examSlug differs from its bundle\'s examSlug is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-badexam'),
        validSession({ examSlug: 'bank' })),
    );
  });
  it('(s51) session with empty questionRefs is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-noq'),
        validSession({ questionRefs: [] })),
    );
  });
  it('(s52) session with status "submitted" at create is DENIED (sessions start in-progress)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-submitted'),
        validSession({ status: 'submitted', submittedAt: TS })),
    );
  });
  it('(s53) session created under ANOTHER user\'s path is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-2', 'jobSessions', 'sess-new-other'),
        validSession()),
    );
  });
});

describe('jobSessions — update: autosave, endsAt-once, terminal transitions, frozen', () => {
  it('(s54) autosave update (answers/currentQuestion/lastSyncedAt) on an in-progress session SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress'), {
        answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 30 } },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });
  it('(s55) changing an immutable field (bundleId) on an in-progress session is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress'), {
        bundleId: 'mock__bcs-mock-01',
      }),
    );
  });
  it('(s56) endsAt set ONCE from null SUCCEEDS, then changing it is DENIED', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-mock-inprogress'), {
        endsAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-mock-inprogress'), {
        endsAt: new Date(Date.now() + 3600 * 1000),
        updatedAt: new Date(),
      }),
    );
  });
  it('(s57) submit transition (in-progress -> submitted + submittedAt) SUCCEEDS, then the session is FROZEN', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress'), {
        status: 'submitted', submittedAt: new Date(), updatedAt: new Date(),
      }),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress'), {
        currentQuestion: 2,
      }),
    );
  });
  it('(s58) abandoned transition (in-progress -> abandoned) SUCCEEDS, then the session is FROZEN', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress-2'), {
        status: 'abandoned', updatedAt: new Date(),
      }),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress-2'), {
        currentQuestion: 2,
      }),
    );
  });
  it('(s59) submitting WITHOUT submittedAt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-mock-inprogress'), {
        status: 'submitted',
      }),
    );
  });
  it('(s60) abandoning WITH a submittedAt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-mock-inprogress'), {
        status: 'abandoned', submittedAt: new Date(),
      }),
    );
  });
  it('(s61) autosave on an ALREADY-SUBMITTED session is DENIED (frozen)', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-ok-1'), {
        currentQuestion: 2,
      }),
    );
  });
  it('(s62) session update by ANOTHER student is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent2(), 'users', 'student-1', 'jobSessions', 'sess-mock-inprogress'), {
        currentQuestion: 2,
      }),
    );
  });
  it('(s63) session delete is DENIED for the student AND for Admin (audit trail)', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-abandoned')));
    await assertFails(deleteDoc(doc(asAdmin(), 'users', 'student-1', 'jobSessions', 'sess-abandoned')));
  });
  it('(s64) moderator reading a student\'s session SUCCEEDS; another student reading it is DENIED', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'jobSessions', 'sess-ok-1')));
    await assertFails(getDoc(doc(asStudent2(), 'users', 'student-1', 'jobSessions', 'sess-ok-1')));
  });
});
