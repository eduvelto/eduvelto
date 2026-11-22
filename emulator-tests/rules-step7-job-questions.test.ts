/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 7
 * (Question Bank + Verification, 22 Nov 2026).
 *
 * Rules under test (firestore.rules, Step 7): jobQuestions,
 * jobQuestionBundles, jobQuestionKeys, jobReceipts,
 * users/{uid}/jobAttempts (minimal anchor only).
 *
 *  READ jobQuestions — students NEVER read the bank (no student
 *    read rule at all — a UI bug cannot leak answers). A verified
 *    teacher reads only their OWN questions; Moderator/Admin read
 *    all. The verification queue is a query (reviewStatus ==
 *    'Under Review') — Moderator-only.
 *  CREATE jobQuestions — isVerifiedTeacher() only (Step 3 §2.7:
 *    Owner + approved Admin/Verified Teacher; a PENDING teacher is
 *    DENIED); draft-only (status 'draft' + reviewStatus
 *    'Not Started'); authorId/createdBy pinned to the caller or
 *    absent; no verifier, no rejection, no publish fields;
 *    explanation REQUIRED; exactly 4 options; correctLetter A–D;
 *    parent refs well-formed + prefix-chained; previous-year
 *    questions need examYear + sourceUrl; 'it-professional'
 *    excluded (scope pending, owner decision 13.8).
 *  UPDATE, author — own draft only, content fields only, may
 *    submit (Not Started/In Progress -> Under Review). Never
 *    publish, never verify, never touch a Published doc, version
 *    pinned.
 *  UPDATE, Moderator/Admin — under the SECOND-EYE rule + the
 *    transition guard: publish only from 'Under Review' (no direct
 *    draft -> published); verifiedBy is never the author; publishing
 *    needs a real verifier + timestamp; reject needs a reason
 *    >= 10 chars; version +1 exactly on Published -> draft return;
 *    content frozen on a doc that stays Published.
 *  DELETE jobQuestions — Admin only.
 *  jobQuestionBundles — student tier, questions + options ONLY:
 *    any key field (correctLetter/explanation/correctText) in the
 *    doc is refused outright; bundle IDs deterministic
 *    (topic__/mock__/daily__/weekly__ enforced in rules,
 *    previous__ in the lib); questionCount == questions.length;
 *    read Published when signed in, Moderator any time.
 *  jobQuestionKeys — Moderator any time; a student only with a
 *    FRESH (<=10 min) receipt ANCHORED to a real SUBMITTED attempt
 *    (P0-06 gate), or for a Published practice (topic) bundle.
 *    Mock keys are NEVER readable before submission.
 *  jobReceipts — ID `{uid}_{bundleId}`; only the owning student
 *    creates their own receipt, anchored to a SUBMITTED attempt for
 *    that bundle on a PUBLISHED bundle, with a trusted creation
 *    timestamp; nobody updates one; only an Admin deletes one
 *    (Step 7 fold-in: a student delete + recreate would mint a
 *    fresh window forever). A receipt is a 10-minute window, NOT
 *    one-use — repeat reads inside the window succeed by design.
 *  jobAttempts (full submit-created attempt, Step 8) — created
 *    ONCE at submit with status 'submitted' and the full fields
 *    (Step 3 §2.11); the in-progress lifecycle lives in jobSessions.
 *    The Step 7 minimal anchor (create in-progress, update once to
 *    submitted) is REPLACED: a second submit is an update and is
 *    denied, deletes are denied even for Admin. An attempt may only
 *    be created when its session is already 'submitted'.
 *
 * Same conventions as rules-step6-job-content.test.ts (numbered
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
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step7';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobQuestions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 7 collections.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
const VERIFY_TS = new Date('2026-11-22T09:00:00.000Z');
// Receipt freshness is judged against the emulator's wall clock,
// so the fresh receipt is stamped at seed time and the stale one
// 20 minutes earlier (window = 10 minutes).
const FRESH_TS = new Date();
const STALE_TS = new Date(Date.now() - 20 * 60 * 1000);

const OPTIONS = [
  { letter: 'A', text: 'দুটি স্বরের মিলন' },
  { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
  { letter: 'C', text: 'দুটি শব্দের মিলন' },
  { letter: 'D', text: 'দুটি বাক্যের মিলন' },
];

const VALID_QUESTION = {
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  chapterId: 'bcs__bangla__grammar',
  topicId: 'bcs__bangla__grammar__sandhi',
  questionText: 'সন্ধি কাকে বলে?',
  options: OPTIONS,
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
  configVersion: '2026-11-22.1',
  authorId: 'teacher-v',
  createdBy: 'teacher-v',
  createdAt: TS,
  updatedAt: TS,
};

const BUNDLE_QUESTIONS = [
  {
    n: 1,
    questionId: 'q-published-b',
    topicId: 'bcs__bangla__grammar__sandhi',
    subjectId: 'bcs__bangla',
    questionText: 'সন্ধি কাকে বলে?',
    options: OPTIONS,
  },
];

const VALID_BUNDLE = {
  kind: 'topic',
  examSlug: 'bcs',
  topicId: 'bcs__bangla__grammar__sandhi',
  mockId: null,
  year: null,
  titleBn: 'সন্ধি — অনুশীলন',
  titleEn: 'Sandhi — Practice',
  questions: BUNDLE_QUESTIONS,
  questionCount: 1,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q-published-b'],
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
};

const VALID_KEY = {
  bundleId: 'topic__bcs__bangla__grammar__sandhi',
  answers: [
    {
      n: 1,
      questionId: 'q-published-b',
      correctLetter: 'B',
      correctText: 'দুটি ধ্বনির মিলন',
      explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
      whyWrong: null,
    },
  ],
  // P1-06: the key carries the bundle's configVersion — a stale
  // key from an older config cannot score a newer bundle.
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
};

/** Payload for a publish write by `verifier` (second eye).
 * verifiedAt is stamped at write time (Step 7 fold-in, P1-01: a
 * verification timestamp must be no later than now and no older
 * than 5 minutes when it changes — a fixed past/future timestamp
 * is refused). */
const publishPayload = (verifier: string) => ({
  status: 'published',
  reviewStatus: 'Published',
  verifiedBy: verifier,
  verifiedAt: new Date(),
});

/** Step 8 — a valid FULL submitted attempt (Step 3 §2.11). The doc
 * ID is the session ID: the caller passes the same `sessionId` the
 * doc is stored under. `overrides` replace top-level fields (use
 * `answers` + counts + score together — they must stay consistent).
 * Practice by default (1 correct answer on the published topic
 * bundle); pass kind 'mock' + mockId + a mock bundleId for a mock. */
const validSubmittedAttempt = (sessionId: string, overrides: Record<string, unknown> = {}) => ({
  userId: 'student-1',
  kind: 'practice',
  mockId: null,
  bundleId: 'topic__bcs__bangla__grammar__sandhi',
  examSlug: 'bcs',
  subjectId: 'bcs__bangla',
  topicId: 'bcs__bangla__grammar__sandhi',
  answers: [
    {
      n: 1,
      questionId: 'q-published-b',
      topicId: 'bcs__bangla__grammar__sandhi',
      subjectId: 'bcs__bangla',
      selected: 'B',
      correct: true,
      marks: 1,
      correctText: 'দুটি ধ্বনির মিলন',
      timeSpentSeconds: 45,
    },
  ],
  score: 1,
  totalMarks: 1,
  negativeDeduction: 0,
  correctCount: 1,
  wrongCount: 0,
  unansweredCount: 0,
  accuracy: 100,
  percentage: 100,
  timeSpentSeconds: 45,
  startedAt: TS,
  submittedAt: VERIFY_TS,
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

/** Step 8 — a valid session (Step 3 §2.12). `overrides` replace
 * top-level fields. Practice by default (no timer: endsAt and
 * clientEndsAtMillis null, submittedAt null while in-progress). */
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

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['owner-1', 'owner', {}],
      ['moderator-1', 'moderator', {}],
      // teacher-v IS verified; teacher-1 is still pending.
      ['teacher-v', 'teacher', { verificationStatus: 'verified' }],
      ['teacher-1', 'teacher', { verificationStatus: 'pending' }],
      ['student-1', 'student', {}],
      ['student-2', 'student', {}],
      ['student-3', 'student', {}],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
        ...extra,
      });
    }
    // ---- jobQuestions ----
    const questions: Array<[string, Record<string, unknown>]> = [
      ['q-published-a', {
        ...VALID_QUESTION,
        reviewStatus: 'Published', status: 'published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }],
      ['q-published-b', {
        ...VALID_QUESTION,
        reviewStatus: 'Published', status: 'published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }],
      ['q-published-c', {
        ...VALID_QUESTION,
        reviewStatus: 'Published', status: 'published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }],
      ['q-draft-v', { ...VALID_QUESTION }],
      ['q-submit-me', { ...VALID_QUESTION, questionText: 'জমা দেওয়ার প্রশ্ন?' }],
      ['q-draft-pending', { ...VALID_QUESTION, authorId: 'teacher-1', createdBy: 'teacher-1', questionText: 'অপেক্ষমাণ শিক্ষকের প্রশ্ন?' }],
      ['q-under-review', { ...VALID_QUESTION, reviewStatus: 'Under Review', questionText: 'যাচাইয়ের প্রশ্ন?' }],
      ['q-under-review-verified', {
        ...VALID_QUESTION, reviewStatus: 'Under Review',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
        questionText: 'যাচাইকৃত প্রশ্ন?',
      }],
      ['q-under-review-noverify', { ...VALID_QUESTION, reviewStatus: 'Under Review', questionText: 'যাচাই ছাড়া প্রশ্ন?' }],
      ['q-mod-authored', {
        ...VALID_QUESTION, reviewStatus: 'Under Review',
        authorId: 'moderator-1', createdBy: 'moderator-1',
        questionText: 'মডারেটরের নিজের প্রশ্ন?',
      }],
      ['q-reject-me', { ...VALID_QUESTION, reviewStatus: 'Under Review', questionText: 'বাতিলের প্রশ্ন?' }],
      ['q-reject-short', { ...VALID_QUESTION, reviewStatus: 'Under Review', questionText: 'ছোট কারণের প্রশ্ন?' }],
      ['q-rejected', {
        ...VALID_QUESTION, reviewStatus: 'Rejected',
        rejectionReason: 'ব্যাখ্যা ভুল, উৎস নেই।',
        questionText: 'বাতিল হওয়া প্রশ্ন?',
      }],
      ['q-archived', { ...VALID_QUESTION, reviewStatus: 'Archived', questionText: 'সংরক্ষিত প্রশ্ন?' }],
      ['q-delete-me', { ...VALID_QUESTION, questionText: 'মুছে ফেলার প্রশ্ন?' }],
    ];
    for (const [id, data] of questions) {
      await setDoc(doc(db, 'jobQuestions', id), data);
    }
    // ---- jobQuestionBundles ----
    const bundles: Array<[string, Record<string, unknown>]> = [
      ['topic__bcs__bangla__grammar__sandhi', { ...VALID_BUNDLE }],
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
      ['mock__bcs-mock-03', {
        ...VALID_BUNDLE,
        kind: 'mock', topicId: null, mockId: 'bcs-mock-03',
        titleBn: 'বিসিএস মডেল টেস্ট ৩', titleEn: 'BCS Model Test 3',
      }],
      ['topic__bcs__bangla__grammar__samash', {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__samash',
        titleBn: 'সমাস — খসড়া', titleEn: 'Samash — Draft',
        status: 'draft', reviewStatus: 'Not Started',
      }],
      ['topic__bcs__bangla__grammar__karok', {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__karok',
        titleBn: 'কারক — মুছে ফেলা', titleEn: 'Karok — Delete',
        status: 'draft', reviewStatus: 'Not Started',
      }],
    ];
    for (const [id, data] of bundles) {
      await setDoc(doc(db, 'jobQuestionBundles', id), data);
    }
    // ---- jobQuestionKeys ----
    const keys: Array<[string, Record<string, unknown>]> = [
      ['topic__bcs__bangla__grammar__sandhi', { ...VALID_KEY }],
      ['mock__bcs-mock-01', { ...VALID_KEY, bundleId: 'mock__bcs-mock-01' }],
      ['mock__bcs-mock-02', { ...VALID_KEY, bundleId: 'mock__bcs-mock-02' }],
      ['topic__bcs__bangla__grammar__samash', { ...VALID_KEY, bundleId: 'topic__bcs__bangla__grammar__samash' }],
    ];
    for (const [id, data] of keys) {
      await setDoc(doc(db, 'jobQuestionKeys', id), data);
    }
    // ---- users/{uid}/jobAttempts (FULL submitted attempts, Step 8) ----
    // Every seeded attempt is a full valid submitted attempt (built
    // by validSubmittedAttempt); the in-progress lifecycle lives in
    // jobSessions below — there is NO in-progress jobAttempts doc in
    // the Step 8 model (such a doc can never be created through the
    // rules). The session gate is create-only, so seeded attempts do
    // not need a matching session for the receipt/key reads — but the
    // submitted attempts that anchor receipts DO have matching
    // submitted sessions seeded, to mirror the real submit flow.
    const attempts: Array<[string, string, Record<string, unknown>]> = [
      ['student-1', 'attempt-submitted', validSubmittedAttempt('attempt-submitted', {
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        subjectId: null, topicId: null,
      })],
      ['student-1', 'attempt-submitted-2', validSubmittedAttempt('attempt-submitted-2', {
        kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-02',
        subjectId: null, topicId: null,
      })],
      ['student-2', 'attempt-submitted', validSubmittedAttempt('attempt-submitted', {
        userId: 'student-2', kind: 'mock', mockId: 'bcs-mock-01',
        bundleId: 'mock__bcs-mock-01', subjectId: null, topicId: null,
      })],
      ['student-2', 'attempt-other-2', validSubmittedAttempt('attempt-other-2', {
        userId: 'student-2', kind: 'mock', mockId: 'bcs-mock-02',
        bundleId: 'mock__bcs-mock-02', subjectId: null, topicId: null,
      })],
      ['student-2', 'attempt-other-3', validSubmittedAttempt('attempt-other-3', {
        userId: 'student-2', kind: 'mock', mockId: 'bcs-mock-03',
        bundleId: 'mock__bcs-mock-03', subjectId: null, topicId: null,
      })],
    ];
    for (const [uid, id, data] of attempts) {
      await setDoc(doc(db, 'users', uid, 'jobAttempts', id), data);
    }
    // ---- users/{uid}/jobSessions (Step 8) ----
    // Submitted sessions that back the seeded submitted attempts
    // above (same doc-ID, same bundle/kind), plus the in-progress
    // sessions the rewritten q66/q75/q88 tests anchor to. There is
    // deliberately NO in-progress jobAttempts doc anywhere: the
    // in-progress state lives ONLY here.
    const sessions: Array<[string, string, Record<string, unknown>]> = [
      ['student-1', 'attempt-submitted', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'attempt-submitted-2', validSession({
        kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-02',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-02', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-2', 'attempt-submitted', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-2', 'attempt-other-2', validSession({
        kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-02',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-02', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-2', 'attempt-other-3', validSession({
        kind: 'mock', mockId: 'bcs-mock-03', bundleId: 'mock__bcs-mock-03',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-03', n: 1, questionId: 'q-published-b' }],
      })],
      // In-progress sessions (no attempt exists for these IDs).
      ['student-2', 'sess-inprogress-2b', validSession({
        kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-02',
        questionRefs: [{ bundleId: 'mock__bcs-mock-02', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-inprogress-3', validSession({
        kind: 'mock', mockId: 'bcs-mock-03', bundleId: 'mock__bcs-mock-03',
        questionRefs: [{ bundleId: 'mock__bcs-mock-03', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-q80', validSession({
        status: 'submitted', submittedAt: VERIFY_TS,
      })],
      ['student-1', 'sess-q81', validSession({
        bundleId: 'topic__bcs__bangla__grammar__samash',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'topic__bcs__bangla__grammar__samash', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-q85', validSession({
        kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
        status: 'submitted', submittedAt: VERIFY_TS,
        questionRefs: [{ bundleId: 'mock__bcs-mock-01', n: 1, questionId: 'q-published-b' }],
      })],
      ['student-1', 'sess-q88', validSession()],
    ];
    for (const [uid, id, data] of sessions) {
      await setDoc(doc(db, 'users', uid, 'jobSessions', id), data);
    }
    // ---- jobReceipts ----
    const receipts: Array<[string, Record<string, unknown>]> = [
      // Fresh receipt, anchored to a real SUBMITTED attempt.
      ['student-1_mock__bcs-mock-01', {
        userId: 'student-1', bundleId: 'mock__bcs-mock-01',
        attemptId: 'attempt-submitted', createdAt: FRESH_TS,
      }],
      // Stale receipt (>10 min old), submitted anchor.
      ['student-2_mock__bcs-mock-01', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-01',
        attemptId: 'attempt-submitted', createdAt: STALE_TS,
      }],
      // Fresh receipt, but anchored to an IN-PROGRESS SESSION id —
      // no submitted attempt exists for it (Step 8: the in-progress
      // state lives in jobSessions, not in jobAttempts, so a receipt
      // pointing at a live session is not a submission — P0-06).
      ['student-2_mock__bcs-mock-02', {
        userId: 'student-2', bundleId: 'mock__bcs-mock-02',
        attemptId: 'sess-inprogress-2b', createdAt: FRESH_TS,
      }],
    ];
    for (const [id, data] of receipts) {
      await setDoc(doc(db, 'jobReceipts', id), data);
    }
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
const asTeacherV = () => env.authenticatedContext('teacher-v').firestore();
const asTeacher1 = () => env.authenticatedContext('teacher-1').firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asStudent3 = () => env.authenticatedContext('student-3').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

describe('Read jobQuestions — the bank is never student-readable', () => {
  it('(q1) student reading a Published question is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestions', 'q-published-a')));
  });
  it('(q2) student reading a draft question is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestions', 'q-draft-v')));
  });
  it('(q3) signed-out reading a Published question is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobQuestions', 'q-published-a')));
  });
  it('(q4) verified teacher (author) reading own draft SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v')));
  });
  it('(q5) pending teacher reading someone else\'s draft is DENIED', async () => {
    await assertFails(getDoc(doc(asTeacher1(), 'jobQuestions', 'q-draft-v')));
  });
  it('(q6) moderator reading any question SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'jobQuestions', 'q-draft-v')));
  });
  it('(q7) admin reading any question SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asAdmin(), 'jobQuestions', 'q-published-a')));
  });
  it('(q8) student querying the verification queue is DENIED', async () => {
    await assertFails(
      getDocs(query(collection(asStudent1(), 'jobQuestions'), where('reviewStatus', '==', 'Under Review'))),
    );
  });
  it('(q9) moderator querying the verification queue SUCCEEDS', async () => {
    await assertSucceeds(
      getDocs(query(collection(asModerator(), 'jobQuestions'), where('reviewStatus', '==', 'Under Review'))),
    );
  });
});

describe('Create jobQuestions', () => {
  it('(q10) verified teacher creating a draft SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q10-new'), VALID_QUESTION),
    );
  });
  it('(q11) pending teacher creating is DENIED (verified-teacher gate)', async () => {
    await assertFails(
      setDoc(doc(asTeacher1(), 'jobQuestions', 'q11-new'), {
        ...VALID_QUESTION, authorId: 'teacher-1', createdBy: 'teacher-1',
      }),
    );
  });
  it('(q12) student creating is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobQuestions', 'q12-new'), VALID_QUESTION),
    );
  });
  it('(q13) signed-out creating is DENIED', async () => {
    await assertFails(
      setDoc(doc(asSignedOut(), 'jobQuestions', 'q13-new'), VALID_QUESTION),
    );
  });
  it('(q14) creating with status published is DENIED (draft-only)', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q14-new'), {
        ...VALID_QUESTION, status: 'published', reviewStatus: 'Published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }),
    );
  });
  it('(q15) creating with reviewStatus Under Review is DENIED (must start Not Started)', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q15-new'), {
        ...VALID_QUESTION, reviewStatus: 'Under Review',
      }),
    );
  });
  it('(q16) creating with verifiedBy already set is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q16-new'), {
        ...VALID_QUESTION, verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }),
    );
  });
  it('(q17) creating with another authorId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q17-new'), {
        ...VALID_QUESTION, authorId: 'teacher-1',
      }),
    );
  });
  it('(q18) previous-year question without examYear/sourceUrl is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q18-new'), {
        ...VALID_QUESTION, isPreviousYear: true,
      }),
    );
  });
  it('(q19) previous-year question with examYear + sourceUrl SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q19-new'), {
        ...VALID_QUESTION, isPreviousYear: true, examYear: 2024,
        sourceUrl: 'https://example.gov.bd/circular-2024',
      }),
    );
  });
  it('(q20) creating without an explanation is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q20-new'), {
        ...VALID_QUESTION, explanation: '',
      }),
    );
  });
  it('(q21) creating with 3 options is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q21-new'), {
        ...VALID_QUESTION, options: OPTIONS.slice(0, 3),
      }),
    );
  });
  it('(q22) creating with correctLetter E is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q22-new'), {
        ...VALID_QUESTION, correctLetter: 'E',
      }),
    );
  });
  it('(q23) creating under it-professional is DENIED (scope pending)', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q23-new'), {
        ...VALID_QUESTION, examSlug: 'it-professional',
        subjectId: 'it-professional__programming',
        chapterId: 'it-professional__programming__basics',
        topicId: 'it-professional__programming__basics__intro',
      }),
    );
  });
  it('(q24) creating with a cross-exam parent chain is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q24-new'), {
        ...VALID_QUESTION, subjectId: 'bank__bangla',
      }),
    );
  });
  it('(q25) creating with a 3-segment topicId is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q25-new'), {
        ...VALID_QUESTION, topicId: 'bcs__bangla__sandhi',
      }),
    );
  });
  it('(q26) creating without duplicateHash is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q26-new'), {
        ...VALID_QUESTION, duplicateHash: '',
      }),
    );
  });
  it('(q27) creating with version 0 is DENIED', async () => {
    await assertFails(
      setDoc(doc(asTeacherV(), 'jobQuestions', 'q27-new'), {
        ...VALID_QUESTION, version: 0,
      }),
    );
  });
});

describe('Update jobQuestions — author', () => {
  it('(q28) author editing own draft questionText SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v'), {
        questionText: 'সন্ধি কাকে বলে? (সংশোধিত)',
      }),
    );
  });
  it('(q29) author submitting own draft (→ Under Review) SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-submit-me'), {
        reviewStatus: 'Under Review',
      }),
    );
  });
  it('(q30) author publishing own draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v'), {
        status: 'published', reviewStatus: 'Published',
        verifiedBy: 'moderator-1', verifiedAt: VERIFY_TS,
      }),
    );
  });
  it('(q31) author editing someone else\'s draft is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-pending'), {
        questionText: 'অন্যের প্রশ্ন বদলানো?',
      }),
    );
  });
  it('(q32) pending teacher editing own draft is DENIED (verified gate)', async () => {
    await assertFails(
      updateDoc(doc(asTeacher1(), 'jobQuestions', 'q-draft-pending'), {
        questionText: 'অপেক্ষমাণ শিক্ষকের সম্পাদনা?',
      }),
    );
  });
  it('(q33) author editing a Published doc is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-published-b'), {
        questionText: 'প্রকাশিত প্রশ্ন বদলানো?',
      }),
    );
  });
  it('(q34) author changing version is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v'), { version: 2 }),
    );
  });
  it('(q35) author setting verifiedBy is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v'), {
        verifiedBy: 'teacher-v', verifiedAt: VERIFY_TS,
      }),
    );
  });
});

describe('Update jobQuestions — Moderator/Admin (second eye + transition)', () => {
  it('(q36) moderator verifying an Under Review doc SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-under-review'), {
        verifiedBy: 'moderator-1', verifiedAt: new Date(),
      }),
    );
  });
  it('(q37) moderator publishing a verified Under Review doc SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-under-review-verified'), publishPayload('moderator-1')),
    );
  });
  it('(q38) moderator publishing a draft directly is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-draft-v'), publishPayload('moderator-1')),
    );
  });
  it('(q39) moderator publishing without a verifier is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-under-review-noverify'), {
        status: 'published', reviewStatus: 'Published',
      }),
    );
  });
  it('(q40) moderator publishing their OWN authored doc is DENIED (second eye)', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-mod-authored'), publishPayload('moderator-1')),
    );
  });
  it('(q41) moderator rejecting with a short reason is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-reject-short'), {
        reviewStatus: 'Rejected', rejectionReason: 'ভুল।',
      }),
    );
  });
  it('(q42) moderator rejecting with a proper reason SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-reject-me'), {
        reviewStatus: 'Rejected', rejectionReason: 'ব্যাখ্যা ভুল, উৎস নেই।',
      }),
    );
  });
  it('(q43) moderator returning Published → Not Started with version +1 SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-published-a'), {
        status: 'draft', reviewStatus: 'Not Started', version: 2,
      }),
    );
  });
  it('(q44) moderator returning Published → Not Started WITHOUT version bump is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-published-b'), {
        status: 'draft', reviewStatus: 'Not Started',
      }),
    );
  });
  it('(q45) moderator editing content of a Published doc is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-published-b'), {
        questionText: 'প্রকাশিত প্রশ্নের বিষয়বস্তু বদলানো?',
      }),
    );
  });
  it('(q46) moderator archiving a Published doc SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-published-c'), {
        status: 'draft', reviewStatus: 'Archived', version: 2,
      }),
    );
  });
  it('(q47) moderator changing authorId is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asModerator(), 'jobQuestions', 'q-draft-v'), {
        authorId: 'moderator-1',
      }),
    );
  });
  it('(q48) student updating a question is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobQuestions', 'q-draft-v'), {
        questionText: 'ছাত্রের সম্পাদনা?',
      }),
    );
  });
});

describe('Delete jobQuestions', () => {
  it('(q49) admin deleting a draft SUCCEEDS', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobQuestions', 'q-delete-me')));
  });
  it('(q50) moderator deleting is DENIED', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'jobQuestions', 'q-draft-v')));
  });
  it('(q51) teacher deleting is DENIED', async () => {
    await assertFails(deleteDoc(doc(asTeacherV(), 'jobQuestions', 'q-draft-v')));
  });
});

describe('jobQuestionBundles — student tier, no key material', () => {
  it('(q52) student reading a Published bundle SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__sandhi')));
  });
  it('(q53) student reading a draft bundle is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__samash')));
  });
  it('(q54) signed-out reading a Published bundle is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__sandhi')));
  });
  it('(q55) moderator creating a clean bundle SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__samash'), {
        ...VALID_BUNDLE,
        topicId: 'bcs__bangla__grammar__samash',
        titleBn: 'সমাস — অনুশীলন', titleEn: 'Samash — Practice',
        status: 'draft', reviewStatus: 'Not Started',
      }),
    );
  });
  it('(q56) moderator creating a bundle with a top-level correctLetter is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__q56'), {
        ...VALID_BUNDLE, correctLetter: 'B',
      }),
    );
  });
  it('(q57) moderator creating a bundle with a top-level explanation is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__q57'), {
        ...VALID_BUNDLE, explanation: 'leaked',
      }),
    );
  });
  it('(q58) moderator creating a bundle with a wrong ID pattern is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionBundles', 'wrong__id'), {
        ...VALID_BUNDLE,
      }),
    );
  });
  it('(q59) moderator creating a bundle with questionCount != questions.length is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__q59'), {
        ...VALID_BUNDLE, questionCount: 5,
      }),
    );
  });
  it('(q60) student creating a bundle is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__q60'), {
        ...VALID_BUNDLE,
      }),
    );
  });
  it('(q61) moderator updating a bundle title SUCCEEDS', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__sandhi'), {
        titleBn: 'সন্ধি — অনুশীলন (সংশোধিত)',
      }),
    );
  });
  it('(q62a) moderator deleting a bundle is DENIED', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__karok')));
  });
  it('(q62b) admin deleting a bundle SUCCEEDS', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobQuestionBundles', 'topic__bcs__bangla__grammar__karok')));
  });
});

describe('jobQuestionKeys — receipt-gated, practice open', () => {
  it('(q63) moderator reading a mock key SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
  it('(q64) student with a FRESH receipt + SUBMITTED attempt reads a mock key SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
  it('(q65) student with a STALE receipt reads a mock key is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
  it('(q66) student with a receipt anchored to an IN-PROGRESS SESSION (no submitted attempt) is DENIED (P0-06)', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'jobQuestionKeys', 'mock__bcs-mock-02')));
  });
  it('(q67) student with NO receipt reads a mock key is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent3(), 'jobQuestionKeys', 'mock__bcs-mock-01')));
  });
  it('(q68) student reads a Published PRACTICE (topic) key signed-in SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'topic__bcs__bangla__grammar__sandhi')));
  });
  it('(q69) signed-out reading a practice key is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'jobQuestionKeys', 'topic__bcs__bangla__grammar__sandhi')));
  });
  it('(q70) student reading a DRAFT bundle\'s practice key is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestionKeys', 'topic__bcs__bangla__grammar__samash')));
  });
  it('(q71a) moderator creating a key for an existing bundle SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'jobQuestionKeys', 'mock__bcs-mock-03'), {
        ...VALID_KEY, bundleId: 'mock__bcs-mock-03',
      }),
    );
  });
  it('(q71b) student creating a key is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobQuestionKeys', 'mock__bcs-mock-01-x'), {
        ...VALID_KEY, bundleId: 'mock__bcs-mock-01-x',
      }),
    );
  });
  it('(q72) moderator creating a key with bundleId != doc ID is DENIED', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'jobQuestionKeys', 'mock__bcs-mock-99'), {
        ...VALID_KEY, bundleId: 'mock__bcs-mock-01',
      }),
    );
  });
});

describe('jobReceipts — access grants, attempt-anchored (P0-06)', () => {
  it('(q73) student creating a receipt anchored to their SUBMITTED attempt SUCCEEDS', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-02'), {
        userId: 'student-1', bundleId: 'mock__bcs-mock-02',
        attemptId: 'attempt-submitted-2', createdAt: new Date(),
      }),
    );
  });
  it('(q74) student creating a receipt for another UID is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-2_mock__bcs-mock-02'), {
        userId: 'student-2', bundleId: 'mock__bcs-mock-02',
        attemptId: 'attempt-other-2', createdAt: new Date(),
      }),
    );
  });
  it('(q75) student creating a receipt anchored to an IN-PROGRESS SESSION id (no submitted attempt) is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-03'), {
        userId: 'student-1', bundleId: 'mock__bcs-mock-03',
        attemptId: 'sess-inprogress-3', createdAt: new Date(),
      }),
    );
  });
  it('(q76) student creating a receipt anchored to ANOTHER student\'s attempt is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-03'), {
        userId: 'student-1', bundleId: 'mock__bcs-mock-03',
        attemptId: 'attempt-other-3', createdAt: new Date(),
      }),
    );
  });
  it('(q77) student updating their receipt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'jobReceipts', 'student-1_mock__bcs-mock-01'), {
        attemptId: 'attempt-inprogress',
      }),
    );
  });
  it('(q78) student deleting their own receipt is DENIED (Step 7 fold-in, P0-03/P1-04: a student delete + recreate would mint a fresh 10-minute window forever — only an Admin deletes receipts)', async () => {
    await assertFails(deleteDoc(doc(asStudent2(), 'jobReceipts', 'student-2_mock__bcs-mock-01')));
  });
  it('(q78b) admin deleting a receipt SUCCEEDS (cleanup)', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'jobReceipts', 'student-2_mock__bcs-mock-01')));
  });
  it('(q79) student deleting someone else\'s receipt is DENIED', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'jobReceipts', 'student-2_mock__bcs-mock-02')));
  });
});

describe('jobAttempts — FULL submit-created attempt (Step 8, Step 3 §2.11)', () => {
  it('(q80) student creating a valid SUBMITTED practice attempt on a submitted session SUCCEEDS', async () => {
    // startedAt must be <= submittedAt (<= now): the fixed seed TS
    // (08:00Z) is AFTER the runner's wall clock in this session, so
    // the created attempt stamps startedAt a minute in the past.
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-q80'),
        validSubmittedAttempt('sess-q80', {
          startedAt: new Date(Date.now() - 60 * 1000),
          submittedAt: new Date(),
        })),
    );
  });
  it('(q81) student creating an attempt on a DRAFT bundle is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-q81'),
        validSubmittedAttempt('sess-q81', {
          bundleId: 'topic__bcs__bangla__grammar__samash',
          topicId: 'bcs__bangla__grammar__samash',
          submittedAt: new Date(),
        })),
    );
  });
  it('(q82) student creating an attempt over an ALREADY-SUBMITTED doc id is DENIED (second submit is an update)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted'),
        validSubmittedAttempt('attempt-submitted', {
          kind: 'mock', mockId: 'bcs-mock-01', bundleId: 'mock__bcs-mock-01',
          subjectId: null, topicId: null, submittedAt: new Date(),
        })),
    );
  });
  it('(q83) student creating an attempt for another user is DENIED', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-2', 'jobAttempts', 'q83-attempt'),
        validSubmittedAttempt('q83-attempt', { userId: 'student-2', submittedAt: new Date() })),
    );
  });
  it('(q84) signed-out creating an attempt is DENIED', async () => {
    await assertFails(
      setDoc(doc(asSignedOut(), 'users', 'student-1', 'jobAttempts', 'q84-attempt'),
        validSubmittedAttempt('q84-attempt', { submittedAt: new Date() })),
    );
  });
  it('(q85) student creating an attempt whose bundle differs from its session\'s bundle is DENIED (session gate)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-q85'),
        validSubmittedAttempt('sess-q85', {
          kind: 'mock', mockId: 'bcs-mock-02', bundleId: 'mock__bcs-mock-02',
          subjectId: null, topicId: null, submittedAt: new Date(),
        })),
    );
  });
  it('(q86) student re-submitting an already-submitted attempt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted'), {
        status: 'submitted', submittedAt: new Date(),
      }),
    );
  });
  it('(q87) student editing a submitted attempt is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted'), {
        bundleId: 'mock__bcs-mock-02',
      }),
    );
  });
  it('(q88) student creating an attempt on an IN-PROGRESS session is DENIED (session must be submitted first)', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'sess-q88'),
        validSubmittedAttempt('sess-q88', { submittedAt: new Date() })),
    );
  });
  it('(q89) moderator reading a student\'s attempt SUCCEEDS', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
  });
  it('(q90) another student reading someone else\'s attempt is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
  });
  it('(q91) student deleting an attempt is DENIED', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
  });
  it('(q92) admin deleting an attempt is DENIED (submitted attempts are immutable)', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'users', 'student-1', 'jobAttempts', 'attempt-submitted')));
  });
});
