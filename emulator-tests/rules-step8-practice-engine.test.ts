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
 *    session with that ID must be 'submitted' AFTER the write
 *    (getAfter — the batched submit's own transition counts) for
 *    the same bundle (session gate), AND the attempt is bound to
 *    the session's identity (kind, examSlug, and
 *    questionRefs.size() == answers.size()); bundle must exist +
 *    be Published, with matching examSlug and fitting kind
 *    (practice -> topic/previous ONLY — Step 9 ChatGPT fold-in
 *    H.2: mock attempts live in jobExamAttempts, see the Step 9
 *    rules file); score == clientCalculatedScore;
 *    negativeDeduction == wrongCount * negativeMarkingUsed (the
 *    penalty the attempt declares, 0 / 0.25 / 0.5) and the attempt
 *    carries markingSchemeVersion + bundleVersion == the bundle's
 *    current generation; counts sum to answers.size(); answers
 *    non-empty and <= the bundle's questionCount; accuracy 0..100,
 *    percentage -100..100; resultLabel 'practice', trustLevel
 *    'unverified', resultType 'practice', markingStatus 'auto',
 *    status 'submitted'; submissionIntegrity 'client_calculated'
 *    (H.3 — immutable does not mean truthful);
 *    serverVerifiedScore absent-or-null (a student can never
 *    write it). Update/delete: NEVER, even Admin.
 *    HONEST RULE LIMITS (tested only as far as the rules go):
 *    per-answer shape (topicId/correct/marks per answer) CANNOT be
 *    validated by rules — no list indexing — so it is enforced by
 *    the engine lib validator, not here; the exact score formula
 *    needs the exam pattern, which the rules do not look up; float
 *    division (accuracy/percentage formulas) is range-checked only.
 *  jobSessions — PRACTICE ONLY (H.2). Created in-progress by the
 *    owner on a Published bundle (mockId always null; endsAt null
 *    ALWAYS — practice never has a timer; revision 1; answers
 *    exactly one entry per questionRef, currentQuestion inside
 *    the stored order); autosave while in-progress
 *    (answers/currentQuestion/lastSyncedAt/updatedAt/revision —
 *    revision exactly stored + 1, stale writes DENIED; answers
 *    never grows past the stored question list); exactly one
 *    terminal transition (submitted + submittedAt, or abandoned),
 *    then frozen; delete NEVER, even Admin (abandoned sessions
 *    are the audit trail). PAUSED is client-side only — NOT a
 *    session-doc status. The rules CANNOT rate-limit autosaves —
 *    throttling is client-side only (Step 2 §4.6).
 *  NOTE (Step 9 ChatGPT fold-in, H.2): the mock tests that used
 *    to live here (s2, s7, s22, s34, s35, s43, s45, s48, s49,
 *    s56) MOVED to emulator-tests/rules-step9-full-exam.test.ts
 *    as exam-collection tests — their numbers are intentionally
 *    left vacant here so the remaining numbers stay stable.
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
  writeBatch,
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

/** A valid FULL submitted attempt (Step 3 §2.11). Practice ONLY
 * (Step 9 ChatGPT fold-in, H.2 — mock attempts live in
 * jobExamAttempts). `overrides` replace top-level fields. */
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
  negativeMarkingUsed: 0.5,
  markingSchemeVersion: 'v1',
  bundleVersion: 1,
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
  // Step 9 (ChatGPT fold-in, H.3): the score is
  // client-calculated, and the attempt says so explicitly.
  submissionIntegrity: 'client_calculated',
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
  answers: { '1': { selected: null, markedForReview: false, timeSpentSeconds: 0 } },
  currentQuestion: 1,
  lastSyncedAt: TS,
  clientEndsAtMillis: null,
  submittedAt: null,
  createdAt: TS,
  updatedAt: TS,
  revision: 1,
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
  bundleVersion: 1,
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
      ['topic__bcs__bangla__grammar__samash', {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__samash',
        titleBn: 'সমাস — খসড়া', titleEn: 'Samash — Draft',
        status: 'draft', reviewStatus: 'Not Started',
      }],
      // Bank topic bundle (Step 8 fold-in: negative marking
      // DISABLED — attempts on it must declare used 0).
      ['topic__bank__math__arithmetic', {
        ...VALID_BUNDLE,
        examSlug: 'bank',
        topicId: 'bank__math__arithmetic',
        titleBn: 'পাটিগণিত — অনুশীলন', titleEn: 'Arithmetic — Practice',
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
      ['student-1', 'sess-deny', validSession({ status: 'submitted', submittedAt: TS })],
      ['student-1', 'sess-bank-ok', validSession({
        bundleId: 'topic__bank__math__arithmetic',
        examSlug: 'bank',
        status: 'submitted', submittedAt: TS,
        questionRefs: [{ bundleId: 'topic__bank__math__arithmetic', n: 1, questionId: 'q-published-b' }],
      })],
      // Reused by the DENIED Bank create (s70): a submitted Bank
      // session, so the session gate passes and the denial comes
      // from the deduction binding, not the gate.
      ['student-1', 'sess-bank-deny', validSession({
        bundleId: 'topic__bank__math__arithmetic',
        examSlug: 'bank',
        status: 'submitted', submittedAt: TS,
        questionRefs: [{ bundleId: 'topic__bank__math__arithmetic', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-inprogress', validSession()],
      ['student-1', 'sess-inprogress-2', validSession()],
      // Third in-progress session (Step 9 fold-in: the mock
      // in-progress session that s59/s60/s62 used to share is
      // gone with the H.2 split — these three tests share this
      // practice one instead; failed updates do not consume it).
      ['student-1', 'sess-inprogress-3', validSession()],
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
          negativeMarkingUsed: 0.25,
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
            // Q3 left unanswered — a well-formed attempt carries one
            // entry per stored question (fold-in count binding).
            THREE_ANSWERS[2],
          ],
          score: -0.5,
          totalMarks: 3,
          negativeDeduction: 0.5,
          negativeMarkingUsed: 0.25,
          correctCount: 0,
          wrongCount: 2,
          unansweredCount: 1,
          accuracy: 0,
          percentage: -16.67,
          timeSpentSeconds: 60,
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
  it('(s18) negativeDeduction != wrongCount * negativeMarkingUsed is DENIED (deduction must match the declared scheme)', async () => {
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
  it('(s79) submissionIntegrity "server_verified" is DENIED (H.3 — only a future server scorer could write that)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { submissionIntegrity: 'server_verified' })),
    );
  });
  it('(s80) submissionIntegrity MISSING is DENIED (the field is required — every attempt declares how it was graded)', async () => {
    const { submissionIntegrity: _dropped, ...withoutIntegrity } = validSubmittedAttempt('sess-deny');
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'), withoutIntegrity),
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
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-ok-1'),
        validSubmittedAttempt('sess-ok-1', {
          bundleId: 'topic__bcs__bangla__grammar__karok',
          topicId: 'bcs__bangla__grammar__karok',
        })),
    );
  });
  it('(s34) kind "mock" in jobAttempts is DENIED (mock attempts belong to jobExamAttempts — H.2)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', {
          kind: 'mock', mockId: 'full__bcs__1', bundleId: 'mock__full__bcs__1',
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
  it('(s44) session on a DRAFT bundle is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-new-draft'),
        validSession({
          bundleId: 'topic__bcs__bangla__grammar__samash',
          questionRefs: [{ bundleId: 'topic__bcs__bangla__grammar__samash', n: 1, questionId: 'q-published-b' }],
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
        revision: 2,
      }),
    );
  });
  it('(s55) changing an immutable field (bundleId) on an in-progress session is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress'), {
        bundleId: 'topic__bcs__bangla__grammar__karok',
      }),
    );
  });
  it('(s57) submit transition (in-progress -> submitted + submittedAt) SUCCEEDS, then the session is FROZEN', async () => {
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress'), {
        status: 'submitted', submittedAt: new Date(), updatedAt: new Date(),
        revision: 3,
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
        revision: 2,
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
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress-3'), {
        status: 'submitted',
        revision: 2,
      }),
    );
  });
  it('(s60) abandoning WITH a submittedAt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-inprogress-3'), {
        status: 'abandoned', submittedAt: new Date(),
        revision: 2,
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
      updateDoc(doc(asStudent2(), 'users', 'student-1', 'jobSessions', 'sess-inprogress-3'), {
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

/* ------------------------------------------------------------------ */
/* Step 8 fold-in (ChatGPT findings 2/5/9): marking-scheme + bundle   */
/* binding on attempts — the attempt must declare the penalty it     */
/* was scored under, and bind to the bundle's current generation.     */
/* ------------------------------------------------------------------ */
describe('jobAttempts — create: Step 8 fold-in marking/bundle binding', () => {
  it('(s65) Bank submit with negativeMarkingUsed 0 + deduction 0 SUCCEEDS (penalty disabled until verified)', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-bank-ok'),
        validSubmittedAttempt('sess-bank-ok', {
          bundleId: 'topic__bank__math__arithmetic',
          examSlug: 'bank',
          subjectId: 'bank__math',
          topicId: 'bank__math__arithmetic',
          answers: [{
            n: 1, questionId: 'q-published-b',
            topicId: 'bank__math__arithmetic', subjectId: 'bank__math',
            selected: 'A', correct: false, marks: 0,
            correctText: 'দুটি ধ্বনির মিলন', timeSpentSeconds: 30,
          }],
          score: 0,
          totalMarks: 1,
          negativeDeduction: 0,
          negativeMarkingUsed: 0,
          markingSchemeVersion: 'v0-provisional',
          correctCount: 0,
          wrongCount: 1,
          unansweredCount: 0,
          accuracy: 0,
          percentage: 0,
          clientCalculatedScore: 0,
        })),
    );
  });
  it('(s66) attempt with bundleVersion 2 (bundle is v1) is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { bundleVersion: 2 })),
    );
  });
  it('(s67) attempt with negativeMarkingUsed 0.3 is DENIED (only 0 / 0.25 / 0.5)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { negativeMarkingUsed: 0.3 })),
    );
  });
  it('(s68) attempt with an empty markingSchemeVersion is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'),
        validSubmittedAttempt('sess-deny', { markingSchemeVersion: '' })),
    );
  });
  it('(s69) attempt with bundleVersion MISSING is DENIED', async () => {
    const { bundleVersion: _dropped, ...withoutVersion } = validSubmittedAttempt('sess-deny');
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-deny'), withoutVersion),
    );
  });
  it('(s70) Bank attempt claiming a 0.25 deduction with used 0 is DENIED (provisional penalty is never scored)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-bank-deny'),
        validSubmittedAttempt('sess-bank-deny', {
          bundleId: 'topic__bank__math__arithmetic',
          examSlug: 'bank',
          subjectId: 'bank__math',
          topicId: 'bank__math__arithmetic',
          answers: [{
            n: 1, questionId: 'q-published-b',
            topicId: 'bank__math__arithmetic', subjectId: 'bank__math',
            selected: 'A', correct: false, marks: -0.25,
            correctText: 'দুটি ধ্বনির মিলন', timeSpentSeconds: 30,
          }],
          score: -0.25,
          totalMarks: 1,
          negativeDeduction: 0.25,
          negativeMarkingUsed: 0,
          markingSchemeVersion: 'v0-provisional',
          correctCount: 0,
          wrongCount: 1,
          unansweredCount: 0,
          accuracy: 0,
          percentage: -25,
          clientCalculatedScore: -0.25,
        })),
    );
  });
});

/* ------------------------------------------------------------------ */
/* Step 8 fold-in (ChatGPT findings 1/6/7): revision-based autosave  */
/* + getAfter session binding + atomic batched submit.                */
/* ------------------------------------------------------------------ */
describe('jobSessions — update: revision-based autosave (fold-in)', () => {
  it('(s71) autosave with revision exactly stored + 1 SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-ok'),
        validSession()),
    );
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-ok'), {
        answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 30 } },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 2,
      }),
    );
  });
  it('(s72) STALE autosave (same revision twice) is DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-stale'),
        validSession()),
    );
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-stale'), {
        answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 30 } },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 2,
      }),
    );
    // A second write built from the same base revision (a stale tab
    // retrying its old patch) must not land.
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-stale'), {
        answers: { '1': { selected: 'C', markedForReview: false, timeSpentSeconds: 40 } },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 2,
      }),
    );
  });
  it('(s73) autosave SKIPPING a revision (stored + 2) is DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-skip'),
        validSession()),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-skip'), {
        answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 30 } },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 3,
      }),
    );
  });
  it('(s74) autosave with MORE answers than stored questions is DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-big'),
        validSession()),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-big'), {
        answers: {
          '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 30 },
          '2': { selected: 'A', markedForReview: false, timeSpentSeconds: 10 },
        },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 2,
      }),
    );
  });
  it('(s75) autosave with currentQuestion outside the stored order is DENIED', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-cq'),
        validSession()),
    );
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-rev-cq'), {
        currentQuestion: 2,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 2,
      }),
    );
  });
});

describe('jobAttempts — create: getAfter session binding + atomic batch (fold-in)', () => {
  it('(s76) attempt with MORE answers than the session\'s stored order is DENIED (getAfter count binding)', async () => {
    // A submitted session on the 3-question karok bundle with only
    // ONE stored question ref; the attempt answers all 3. The
    // bundle allows 3 answers, so the ONLY failing check is the
    // session's stored order — the attempt cannot ride on a session
    // that did not ask those questions.
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-count-deny'),
        validSession({
          bundleId: 'topic__bcs__bangla__grammar__karok',
          questionRefs: [{ bundleId: 'topic__bcs__bangla__grammar__karok', n: 1, questionId: 'q-published-b' }],
        })),
    );
    await assertSucceeds(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobSessions', 'sess-count-deny'), {
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
        revision: 2,
      }),
    );
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-count-deny'),
        validSubmittedAttempt('sess-count-deny', {
          bundleId: 'topic__bcs__bangla__grammar__karok',
          topicId: 'bcs__bangla__grammar__karok',
          answers: THREE_ANSWERS,
          score: 0.75,
          totalMarks: 3,
          negativeDeduction: 0.25,
          negativeMarkingUsed: 0.25,
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
  it('(s77) BATCHED submit (session -> submitted + attempt create in ONE batch) SUCCEEDS', async () => {
    const db = asStudent1();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-batch-ok'),
        validSession()),
    );
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'student-1', 'jobSessions', 'sess-batch-ok'), {
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
      revision: 2,
    });
    batch.set(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-batch-ok'),
      validSubmittedAttempt('sess-batch-ok'));
    await assertSucceeds(batch.commit());
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-batch-ok')));
    if (!readBack.exists()) throw new Error('batched attempt was not created');
  });
  it('(s78) BATCHED submit with a STALE revision is DENIED atomically (no attempt is created)', async () => {
    const db = asStudent1();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-batch-stale'),
        validSession()),
    );
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'student-1', 'jobSessions', 'sess-batch-stale'), {
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
      revision: 1,
    });
    batch.set(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-batch-stale'),
      validSubmittedAttempt('sess-batch-stale'));
    await assertFails(batch.commit());
    // Atomicity: the failed batch must not have created the attempt.
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-batch-stale')));
    if (readBack.exists()) throw new Error('failed batch still created the attempt');
  });
});
