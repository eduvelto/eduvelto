/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 9
 * (full exam + model test engine, ChatGPT fold-in, 22 Nov 2026).
 *
 * Covers the EXAM collections (H.2 — separate from practice):
 * jobExamDefinitions / jobQuestionSetManifests / jobExamSessions /
 * jobExamAttempts / jobExamUserLocks, plus the H.1 purpose
 * receipts (exam_review vs practice_review) and the exact
 * deadline (audit M1, tightened: endsAt == startedAt +
 * definition duration; submittedAt <= stored endsAt).
 *
 * Mock IDs are proper Step 9 keys (full__bcs__1,
 * daily__2026-11-22, weekly__2026-W47) — NOT the Step 8 fixture
 * IDs (bcs-mock-01).
 *
 * SHARED STATE — read before reordering tests: tests in this file
 * share one emulator namespace. The lock student-1_bcs is created
 * by e1 (sess-e1), denied-reused by e8, released by e20 (submit),
 * re-armed by e9, released by e10 (abandon), and its live state
 * is what e23 denies releasing alone. The receipt doc-ID is
 * {uid}_{bundleId} — one receipt per (user, bundle) — so e42
 * (student-1, mock__full__bcs__1) and e43 (student-1,
 * mock__full__bcs__2) use different bundles, e44/e45 use
 * student-2's receipts, and e47 uses student-3 (no receipt at
 * all). e46 must run BEFORE e43 creates student-1's receipt for
 * mock__full__bcs__2.
 *
 * Step 9 closure (e60–e72, appended last): e60–e66 operate on
 * student-1's BUNDLE_ID receipt (created by e37 with the session
 * anchor 'sess-rec-ok') — e60 re-issues it to the attempt anchor
 * 'sess-att-ok-1' (created by e24), e61–e65 deny bad re-issues
 * (each denied update leaves the doc unchanged, so order among
 * them does not matter), e66a–e66c create + re-issue the
 * practice_review receipt for the topic bundle. e67–e72 use fresh
 * audit-log docs under users/student-1/jobExamAuditLogs.
 *
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
  serverTimestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-step9-full-exam';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamSessions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamSessions match.`);
}

// Fixed seed times (2026-11-22 08:00Z start; the runner's clock
// is later the same day, so endsAt TS+120min (10:00Z) is in the
// PAST — the "after deadline" cases — while FUTURE_ENDS
// (now + 2h) is the "before deadline" case). Created docs use
// live timestamps (NOW/STARTED) so startedAt <= submittedAt <=
// request.time holds.
const TS = new Date('2026-11-22T08:00:00.000Z');
const TS_ENDS = new Date('2026-11-22T10:00:00.000Z');
const TS_SUBMITTED = new Date('2026-11-22T09:00:00.000Z');
const TS_ATTEMPT = new Date('2026-11-22T09:30:00.000Z');
const TS_LATE = new Date('2026-11-22T10:30:00.000Z');
const NOW = new Date();
const STARTED = new Date(Date.now() - 60 * 1000);
const FUTURE_ENDS = new Date(Date.now() + 2 * 60 * 60 * 1000);
const STALE_30M = new Date(Date.now() - 30 * 60 * 1000);
const STALE_3H = new Date(Date.now() - 3 * 60 * 60 * 1000);

const BUNDLE_ID = 'mock__full__bcs__1';
const BUNDLE_ID_2 = 'mock__full__bcs__2';
const BANK_BUNDLE_ID = 'mock__full__bank__1';
const TOPIC_BUNDLE_ID = 'topic__bcs__bangla__grammar__sandhi';
const DAILY_BUNDLE_ID = 'daily__2026-11-22';

const ONE_REF = { bundleId: BUNDLE_ID, n: 1, questionId: 'q-published-b' };
const ONE_REF_2 = { bundleId: BUNDLE_ID_2, n: 1, questionId: 'q-published-b' };
const BANK_REF = { bundleId: BANK_BUNDLE_ID, n: 1, questionId: 'q-bank-1' };

function dailyQuestion(n: number): Record<string, unknown> {
  return {
    n,
    questionId: `q-daily-${n}`,
    topicId: 'bcs__bangla__grammar__sandhi',
    subjectId: 'bcs__bangla',
    questionText: `দৈনিক প্রশ্ন ${n}?`,
    options: [
      { letter: 'A', text: 'ক' },
      { letter: 'B', text: 'খ' },
      { letter: 'C', text: 'গ' },
      { letter: 'D', text: 'ঘ' },
    ],
    difficulty: 'easy',
  };
}

const VALID_BUNDLE = {
  kind: 'mock',
  examSlug: 'bcs',
  topicId: null,
  mockId: 'full__bcs__1',
  year: null,
  titleBn: 'বিসিএস পূর্ণ মক ১',
  titleEn: 'BCS Full Mock 1',
  questions: [
    {
      n: 1,
      questionId: 'q-published-b',
      topicId: 'bcs__bangla__grammar__sandhi',
      subjectId: 'bcs__bangla',
      questionText: 'সন্ধি কাকে বলে?',
      options: [
        { letter: 'A', text: 'দুটি স্বরের মিলন' },
        { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
        { letter: 'C', text: 'দুটি শব্দের মিলন' },
        { letter: 'D', text: 'দুটি বাক্যের মিলন' },
      ],
      difficulty: 'easy',
    },
  ],
  questionCount: 1,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q-published-b'],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};

const VALID_KEY = {
  bundleId: BUNDLE_ID,
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
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};

const ONE_ATTEMPT_ANSWER = {
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

/** A valid exam session (Step 9, exam collections). `overrides`
 * replace top-level fields. */
const validExamSession = (overrides: Record<string, unknown> = {}) => ({
  kind: 'mock',
  mockId: 'full__bcs__1',
  bundleId: BUNDLE_ID,
  examSlug: 'bcs',
  definitionId: 'full__bcs__1',
  questionSetId: 'full__bcs__1_v1',
  bundleVersion: 1,
  status: 'in-progress',
  startedAt: TS,
  endsAt: null,
  questionRefs: [ONE_REF],
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

/** A valid submitted exam attempt (Step 9, Design G + H.3).
 * `attemptId` is the session ID (doc-ID == session ID). */
const validExamAttempt = (attemptId: string, overrides: Record<string, unknown> = {}) => ({
  userId: 'student-1',
  kind: 'mock',
  mockId: 'full__bcs__1',
  bundleId: BUNDLE_ID,
  examSlug: 'bcs',
  subjectId: null,
  topicId: null,
  questionSetId: 'full__bcs__1_v1',
  answers: [ONE_ATTEMPT_ANSWER],
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
  startedAt: TS,
  submittedAt: TS_ATTEMPT,
  status: 'submitted',
  markingStatus: 'auto',
  resultLabel: 'practice',
  clientCalculatedScore: 1,
  serverVerifiedScore: null,
  trustLevel: 'unverified',
  resultType: 'practice',
  sessionId: attemptId,
  audit: null,
  answerHashes: null,
  anomalyFlags: null,
  submissionIntegrity: 'client_calculated',
  ...overrides,
});

/** A valid exam-session create payload (serverTimestamp
 * startedAt — the rules require startedAt == request.time). */
function newExamSession(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'mock',
    mockId: 'full__bcs__1',
    bundleId: BUNDLE_ID,
    examSlug: 'bcs',
    definitionId: 'full__bcs__1',
    questionSetId: 'full__bcs__1_v1',
    bundleVersion: 1,
    status: 'in-progress',
    startedAt: serverTimestamp(),
    endsAt: null,
    questionRefs: [ONE_REF],
    answers: { '1': { selected: null, markedForReview: false, timeSpentSeconds: 0 } },
    currentQuestion: 1,
    lastSyncedAt: new Date(),
    clientEndsAtMillis: null,
    submittedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    revision: 1,
    ...overrides,
  };
}

function newExamLock(sessionId: string, overrides: Record<string, unknown> = {}) {
  return {
    uid: 'student-1',
    examSlug: 'bcs',
    mockId: 'full__bcs__1',
    definitionId: 'full__bcs__1',
    activeSessionId: sessionId,
    status: 'in_progress',
    durationSeconds: 7200,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['student-3', 'student'],
      ['moderator-1', 'moderator'],
      ['admin-1', 'admin'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    // Bundles + keys.
    await setDoc(doc(db, 'jobQuestionBundles', BUNDLE_ID), { ...VALID_BUNDLE });
    await setDoc(doc(db, 'jobQuestionBundles', BUNDLE_ID_2), {
      ...VALID_BUNDLE,
      mockId: 'full__bcs__2',
      titleBn: 'বিসিএস পূর্ণ মক ২',
      titleEn: 'BCS Full Mock 2',
    });
    await setDoc(doc(db, 'jobQuestionBundles', BANK_BUNDLE_ID), {
      ...VALID_BUNDLE,
      examSlug: 'bank',
      mockId: 'full__bank__1',
      titleBn: 'ব্যাংক পূর্ণ মক ১',
      titleEn: 'Bank Full Mock 1',
      questions: [
        {
          n: 1,
          questionId: 'q-bank-1',
          topicId: 'bank__bangla__grammar__sandhi',
          subjectId: 'bank__bangla',
          questionText: 'সন্ধি কাকে বলে?',
          options: [
            { letter: 'A', text: 'দুটি স্বরের মিলন' },
            { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
            { letter: 'C', text: 'দুটি শব্দের মিলন' },
            { letter: 'D', text: 'দুটি বাক্যের মিলন' },
          ],
          difficulty: 'easy',
        },
      ],
      sourceQuestionIds: ['q-bank-1'],
    });
    await setDoc(doc(db, 'jobQuestionBundles', TOPIC_BUNDLE_ID), {
      kind: 'topic',
      examSlug: 'bcs',
      topicId: 'bcs__bangla__grammar__sandhi',
      mockId: null,
      year: null,
      titleBn: 'সন্ধি — অনুশীলন',
      titleEn: 'Sandhi — Practice',
      questions: [VALID_BUNDLE.questions[0]],
      questionCount: 1,
      bundleVersion: 1,
      status: 'published',
      reviewStatus: 'Published',
      sourceQuestionIds: ['q-published-b'],
      configVersion: '1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionBundles', DAILY_BUNDLE_ID), {
      kind: 'daily',
      examSlug: 'bcs',
      topicId: null,
      mockId: '2026-11-22',
      year: null,
      titleBn: 'দৈনিক মক — ২০২৬-১১-২২',
      titleEn: 'Daily Mock — 2026-11-22',
      questions: Array.from({ length: 25 }, (_, i) => dailyQuestion(i + 1)),
      questionCount: 25,
      bundleVersion: 1,
      status: 'published',
      reviewStatus: 'Published',
      sourceQuestionIds: Array.from({ length: 25 }, (_, i) => `q-daily-${i + 1}`),
      configVersion: '1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionKeys', BUNDLE_ID), { ...VALID_KEY });
    await setDoc(doc(db, 'jobQuestionKeys', BUNDLE_ID_2), {
      ...VALID_KEY,
      bundleId: BUNDLE_ID_2,
    });
    // Definitions.
    await setDoc(doc(db, 'jobExamDefinitions', 'full__bcs__1'), {
      examSlug: 'bcs',
      titleBn: 'বিসিএস পূর্ণ মক ১',
      titleEn: 'BCS Full Mock 1',
      kind: 'full',
      bundleId: BUNDLE_ID,
      questionSetId: 'full__bcs__1_v1',
      rulesSnapshot: {
        questionCount: 1,
        timeMinutes: 120,
        marksPerQuestion: 1,
        negativeMarking: 0.5,
        negativeMarkingVerified: true,
        passPercent: null,
        scoringConfigVersion: 'v1',
      },
      scheduleDate: null,
      examSlugCycle: null,
      status: 'published',
      retakeAllowed: true,
      maxAttempts: null,
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobExamDefinitions', 'full__bcs__2'), {
      examSlug: 'bcs',
      titleBn: 'বিসিএস পূর্ণ মক ২',
      titleEn: 'BCS Full Mock 2',
      kind: 'full',
      bundleId: BUNDLE_ID_2,
      questionSetId: 'full__bcs__2_v1',
      rulesSnapshot: {
        questionCount: 1,
        timeMinutes: 120,
        marksPerQuestion: 1,
        negativeMarking: 0.5,
        negativeMarkingVerified: true,
        passPercent: null,
        scoringConfigVersion: 'v1',
      },
      scheduleDate: null,
      examSlugCycle: null,
      status: 'draft',
      retakeAllowed: true,
      maxAttempts: null,
      publishedAt: null,
      publishedBy: null,
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobExamDefinitions', 'full__bank__1'), {
      examSlug: 'bank',
      titleBn: 'ব্যাংক পূর্ণ মক ১',
      titleEn: 'Bank Full Mock 1',
      kind: 'full',
      bundleId: BANK_BUNDLE_ID,
      questionSetId: 'full__bank__1_v1',
      rulesSnapshot: {
        questionCount: 1,
        timeMinutes: 60,
        marksPerQuestion: 1,
        negativeMarking: null,
        negativeMarkingVerified: false,
        passPercent: null,
        scoringConfigVersion: 'v0-provisional',
      },
      scheduleDate: null,
      examSlugCycle: null,
      status: 'published',
      retakeAllowed: true,
      maxAttempts: null,
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobExamDefinitions', 'daily__2026-11-22'), {
      examSlug: 'bcs',
      titleBn: 'দৈনিক মক — ২০২৬-১১-২২',
      titleEn: 'Daily Mock — 2026-11-22',
      kind: 'daily',
      bundleId: DAILY_BUNDLE_ID,
      questionSetId: 'daily__2026-11-22_v1',
      rulesSnapshot: {
        questionCount: 25,
        timeMinutes: 25,
        marksPerQuestion: 1,
        negativeMarking: 0.5,
        negativeMarkingVerified: true,
        passPercent: null,
        scoringConfigVersion: 'v1',
      },
      scheduleDate: '2026-11-22',
      examSlugCycle: null,
      status: 'published',
      retakeAllowed: true,
      maxAttempts: null,
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobExamDefinitions', 'weekly__2026-W47'), {
      examSlug: 'primary-teacher',
      titleBn: 'সাপ্তাহিক পূর্ণ মক — ২০২৬-W47',
      titleEn: 'Weekly Full Mock — 2026-W47',
      kind: 'weekly',
      bundleId: 'weekly__2026-W47',
      questionSetId: 'weekly__2026-W47_v1',
      rulesSnapshot: {
        questionCount: 90,
        timeMinutes: 90,
        marksPerQuestion: 1,
        negativeMarking: 0.25,
        negativeMarkingVerified: true,
        passPercent: 50,
        scoringConfigVersion: 'v1',
      },
      scheduleDate: '2026-11-16',
      examSlugCycle: 'primary-teacher',
      status: 'published',
      retakeAllowed: true,
      maxAttempts: null,
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    // Manifests.
    await setDoc(doc(db, 'jobQuestionSetManifests', 'full__bcs__1_v1'), {
      examSlug: 'bcs',
      mockId: 'full__bcs__1',
      version: 1,
      questionCount: 1,
      questionRefs: [ONE_REF],
      markingSchemeVersion: 'v1',
      status: 'published',
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionSetManifests', 'full__bcs__2_v1'), {
      examSlug: 'bcs',
      mockId: 'full__bcs__2',
      version: 1,
      questionCount: 1,
      questionRefs: [ONE_REF_2],
      markingSchemeVersion: 'v1',
      status: 'published',
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionSetManifests', 'full__bank__1_v1'), {
      examSlug: 'bank',
      mockId: 'full__bank__1',
      version: 1,
      questionCount: 1,
      questionRefs: [BANK_REF],
      markingSchemeVersion: 'v0-provisional',
      status: 'published',
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionSetManifests', 'daily__2026-11-22_v1'), {
      examSlug: 'bcs',
      mockId: '2026-11-22',
      version: 1,
      questionCount: 25,
      questionRefs: Array.from({ length: 25 }, (_, i) => ({
        bundleId: DAILY_BUNDLE_ID,
        n: i + 1,
        questionId: `q-daily-${i + 1}`,
      })),
      markingSchemeVersion: 'v1',
      status: 'published',
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    // A published manifest reserved for the immutability test
    // (e52) — archiving it breaks nothing else.
    await setDoc(doc(db, 'jobQuestionSetManifests', 'full__bcs__1_v9'), {
      examSlug: 'bcs',
      mockId: 'full__bcs__1',
      version: 9,
      questionCount: 1,
      questionRefs: [ONE_REF],
      markingSchemeVersion: 'v1',
      status: 'published',
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    // Exam sessions (seeded states for the update/attempt tests).
    const examSessions: Array<[string, string, Record<string, unknown>]> = [
      ['student-1', 'sess-e13', validExamSession({ revision: 2 })],
      ['student-1', 'sess-e14', validExamSession({ revision: 2 })],
      ['student-1', 'sess-e15', validExamSession({ revision: 2 })],
      ['student-1', 'sess-e17', validExamSession({ endsAt: TS_ENDS, revision: 2 })],
      ['student-1', 'sess-e18', validExamSession({ endsAt: TS_ENDS, revision: 2 })],
      ['student-1', 'sess-e19', validExamSession({ endsAt: TS_ENDS, revision: 2 })],
      ['student-1', 'sess-e21', validExamSession({ endsAt: FUTURE_ENDS, revision: 2 })],
      ['student-2', 'sess-e22', validExamSession({ revision: 2 })],
      ['student-1', 'sess-att-ok-1', validExamSession({
        status: 'submitted', endsAt: TS_ENDS, submittedAt: TS_SUBMITTED, revision: 3,
      })],
      ['student-1', 'sess-att-late', validExamSession({
        status: 'submitted', endsAt: TS_ENDS, submittedAt: TS_SUBMITTED, revision: 3,
      })],
      ['student-1', 'sess-att-noends', validExamSession({
        status: 'submitted', endsAt: null, submittedAt: TS_SUBMITTED, revision: 3,
      })],
      ['student-1', 'sess-att-inprog', validExamSession({ endsAt: FUTURE_ENDS, revision: 2 })],
      ['student-1', 'sess-rec-ok', validExamSession({
        status: 'submitted', endsAt: FUTURE_ENDS, submittedAt: TS_SUBMITTED, revision: 3,
      })],
      ['student-1', 'sess-rec-inprog', validExamSession({ endsAt: FUTURE_ENDS, revision: 2 })],
      ['student-2', 'sess-rec-ok-2', validExamSession({
        mockId: 'full__bcs__2',
        bundleId: BUNDLE_ID_2,
        definitionId: 'full__bcs__2',
        questionSetId: 'full__bcs__2_v1',
        questionRefs: [ONE_REF_2],
        status: 'submitted',
        endsAt: FUTURE_ENDS,
        submittedAt: TS_SUBMITTED,
        revision: 3,
      })],
    ];
    for (const [uid, id, data] of examSessions) {
      await setDoc(doc(db, 'users', uid, 'jobExamSessions', id), data);
    }
    // The seeded submitted exam attempt for the attempt-anchor
    // receipt test (e43).
    await setDoc(
      doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-att-ok-2'),
      validExamAttempt('sess-att-ok-2', {
        mockId: 'full__bcs__2',
        bundleId: BUNDLE_ID_2,
        questionSetId: 'full__bcs__2_v1',
      }),
    );
    await setDoc(
      doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-att-ok-2'),
      validExamSession({
        mockId: 'full__bcs__2',
        bundleId: BUNDLE_ID_2,
        definitionId: 'full__bcs__2',
        questionSetId: 'full__bcs__2_v1',
        questionRefs: [ONE_REF_2],
        status: 'submitted',
        endsAt: FUTURE_ENDS,
        submittedAt: TS_SUBMITTED,
        revision: 3,
      }),
    );
    // Practice session + attempt (for the H.1 cross-checks:
    // an exam_review receipt must never anchor to practice).
    await setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-practice-1'), {
      kind: 'practice',
      mockId: null,
      bundleId: TOPIC_BUNDLE_ID,
      examSlug: 'bcs',
      status: 'submitted',
      startedAt: TS,
      endsAt: null,
      questionRefs: [{ bundleId: TOPIC_BUNDLE_ID, n: 1, questionId: 'q-published-b' }],
      answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 45 } },
      currentQuestion: 1,
      lastSyncedAt: TS,
      clientEndsAtMillis: null,
      submittedAt: TS_SUBMITTED,
      createdAt: TS,
      updatedAt: TS,
      revision: 2,
    });
    await setDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'attempt-practice-1'), {
      userId: 'student-1',
      kind: 'practice',
      mockId: null,
      bundleId: TOPIC_BUNDLE_ID,
      examSlug: 'bcs',
      subjectId: 'bcs__bangla',
      topicId: 'bcs__bangla__grammar__sandhi',
      answers: [ONE_ATTEMPT_ANSWER],
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
      sessionId: 'attempt-practice-1',
      audit: null,
      answerHashes: null,
      anomalyFlags: null,
      submissionIntegrity: 'client_calculated',
    });
    await setDoc(doc(db, 'users', 'student-2', 'jobAttempts', 'attempt-practice-2'), {
      userId: 'student-2',
      kind: 'practice',
      mockId: null,
      bundleId: TOPIC_BUNDLE_ID,
      examSlug: 'bcs',
      subjectId: 'bcs__bangla',
      topicId: 'bcs__bangla__grammar__sandhi',
      answers: [ONE_ATTEMPT_ANSWER],
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
      sessionId: 'attempt-practice-2',
      audit: null,
      answerHashes: null,
      anomalyFlags: null,
      submissionIntegrity: 'client_calculated',
    });
    // Locks: e22's abandon target (student-2, sess-e22) and the
    // stale bank lock for e11 (student-2, 3h old, duration 3600s
    // — stale = createdAt + 3600s + 15min is ~45min ago).
    await setDoc(doc(db, 'jobExamUserLocks', 'student-2_bcs'), {
      uid: 'student-2',
      examSlug: 'bcs',
      mockId: 'full__bcs__1',
      definitionId: 'full__bcs__1',
      activeSessionId: 'sess-e22',
      status: 'in_progress',
      durationSeconds: 7200,
      createdAt: NOW,
      updatedAt: NOW,
    });
    await setDoc(doc(db, 'jobExamUserLocks', 'student-2_bank'), {
      uid: 'student-2',
      examSlug: 'bank',
      mockId: 'full__bank__1',
      definitionId: 'full__bank__1',
      activeSessionId: 'sess-stale-old',
      status: 'in_progress',
      durationSeconds: 3600,
      createdAt: STALE_3H,
      updatedAt: STALE_3H,
    });
    // Seeded receipts (admin bypass — these could never be
    // minted through the rules): e44's practice receipt on an
    // exam bundle (student-2), e45's stale exam receipt
    // (student-2, bundle 2).
    await setDoc(doc(db, 'jobReceipts', `student-2_${BUNDLE_ID}`), {
      userId: 'student-2',
      bundleId: BUNDLE_ID,
      attemptId: 'attempt-practice-2',
      createdAt: NOW,
      purpose: 'practice_review',
      bundleVersion: 1,
    });
    await setDoc(doc(db, 'jobReceipts', `student-2_${BUNDLE_ID_2}`), {
      userId: 'student-2',
      bundleId: BUNDLE_ID_2,
      attemptId: 'sess-rec-ok-2',
      createdAt: STALE_30M,
      purpose: 'exam_review',
      bundleVersion: 1,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES_TEXT, host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 120000);

afterAll(async () => {
  await env?.clearFirestore();
  await env?.cleanup();
});

const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asStudent2 = () => env.authenticatedContext('student-2').firestore();
const asStudent3 = () => env.authenticatedContext('student-3').firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();

describe('Step 9 — exam session create (timer + manifest + lock)', () => {
  it('(e1) session + lock batch SUCCEEDS (startedAt == request.time)', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e1'), newExamSession() as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e1') as unknown as Record<string, unknown>);
    await assertSucceeds(batch.commit());
  });

  it('(e2) session WITHOUT its lock is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e2'),
      newExamSession() as unknown as Record<string, unknown>,
    ));
  });

  it('(e3) startedAt as a client Date (not request.time) is DENIED', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e3'), newExamSession({ startedAt: new Date() }) as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e3') as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });

  it('(e4) questionRefs that do not match the manifest are DENIED', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e4'), newExamSession({
      questionRefs: [{ bundleId: BUNDLE_ID, n: 1, questionId: 'q-someone-else' }],
    }) as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e4') as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });

  it('(e5) wrong bundleVersion is DENIED', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e5'), newExamSession({ bundleVersion: 2 }) as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e5') as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });

  it('(e6) session on a DRAFT definition is DENIED', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e6'), newExamSession({
      mockId: 'full__bcs__2',
      bundleId: BUNDLE_ID_2,
      definitionId: 'full__bcs__2',
      questionSetId: 'full__bcs__2_v1',
      questionRefs: [ONE_REF_2],
    }) as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e6', {
      mockId: 'full__bcs__2',
      definitionId: 'full__bcs__2',
    }) as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });

  it('(e7) kind practice in jobExamSessions is DENIED', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e7'), newExamSession({ kind: 'practice' }) as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e7') as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });

  it('(e8) a SECOND concurrent session for the pattern is DENIED (live lock)', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e8'), newExamSession() as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e8') as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });

  it('(e12) questionSetId that is not the definition\u2019s current manifest is DENIED', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e12'), newExamSession({ questionSetId: 'full__bcs__1_v2' }) as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e12') as unknown as Record<string, unknown>);
    await assertFails(batch.commit());
  });
});

describe('Step 9 — exact deadline (audit M1, tightened to exact)', () => {
  it('(e13) endsAt set to EXACTLY startedAt + 120min SUCCEEDS', async () => {
    await assertSucceeds(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e13'),
      { endsAt: TS_ENDS, updatedAt: new Date(), lastSyncedAt: new Date(), revision: 3 },
    ));
  });

  it('(e14) endsAt SHORTER than startedAt + duration is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e14'),
      { endsAt: new Date('2026-11-22T09:00:00.000Z'), updatedAt: new Date(), lastSyncedAt: new Date(), revision: 3 },
    ));
  });

  it('(e15) endsAt LONGER than startedAt + duration is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e15'),
      { endsAt: new Date('2026-11-22T11:00:00.000Z'), updatedAt: new Date(), lastSyncedAt: new Date(), revision: 3 },
    ));
  });

  it('(e16) endsAt changed AFTER it was set is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e13'),
      { endsAt: new Date('2026-11-22T10:01:00.000Z'), updatedAt: new Date(), lastSyncedAt: new Date(), revision: 4 },
    ));
  });
});

describe('Step 9 — submit paths (manual vs timeout) + autosave + abandon', () => {
  it('(e17) answers changed AFTER the deadline is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e17'),
      {
        answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 45 } },
        updatedAt: new Date(), lastSyncedAt: new Date(), revision: 3,
      },
    ));
  });

  it('(e18) timeout submit AFTER the deadline with UNCHANGED answers SUCCEEDS', async () => {
    await assertSucceeds(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e18'),
      { status: 'submitted', submittedAt: new Date(), updatedAt: new Date(), revision: 3 },
    ));
  });

  it('(e19) timeout submit AFTER the deadline WITH changed answers is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e19'),
      {
        status: 'submitted',
        submittedAt: new Date(),
        answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 45 } },
        updatedAt: new Date(), revision: 3,
      },
    ));
  });

  it('(e20) manual submit BEFORE the deadline (final snapshot + lock release) SUCCEEDS', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e1'), {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      answers: { '1': { selected: 'B', markedForReview: false, timeSpentSeconds: 45 } },
      updatedAt: serverTimestamp(),
      revision: 2,
    });
    batch.update(doc(db, 'jobExamUserLocks', 'student-1_bcs'), {
      status: 'terminal',
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it('(e9) a new session AFTER submit is ALLOWED (terminal lock re-armed)', async () => {
    const db = asStudent1();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e9'), newExamSession() as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e9') as unknown as Record<string, unknown>);
    await assertSucceeds(batch.commit());
  });

  it('(e10) abandon + lock release, then a new session, are ALLOWED', async () => {
    const db = asStudent1();
    const abandon = writeBatch(db);
    abandon.update(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e9'), {
      status: 'abandoned',
      updatedAt: serverTimestamp(),
      revision: 2,
    });
    abandon.update(doc(db, 'jobExamUserLocks', 'student-1_bcs'), {
      status: 'terminal',
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(abandon.commit());
    const restart = writeBatch(db);
    restart.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-e10'), newExamSession() as unknown as Record<string, unknown>);
    restart.set(doc(db, 'jobExamUserLocks', 'student-1_bcs'), newExamLock('sess-e10') as unknown as Record<string, unknown>);
    await assertSucceeds(restart.commit());
  });

  it('(e21) autosave BEFORE the deadline SUCCEEDS', async () => {
    await assertSucceeds(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamSessions', 'sess-e21'),
      {
        answers: { '1': { selected: 'A', markedForReview: false, timeSpentSeconds: 30 } },
        currentQuestion: 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
        revision: 3,
      },
    ));
  });

  it('(e22) abandon (student-2) releases the lock — the lock reads terminal', async () => {
    const db = asStudent2();
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'student-2', 'jobExamSessions', 'sess-e22'), {
      status: 'abandoned',
      updatedAt: serverTimestamp(),
      revision: 3,
    });
    batch.update(doc(db, 'jobExamUserLocks', 'student-2_bcs'), {
      status: 'terminal',
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    const lock = await assertSucceeds(getDoc(doc(db, 'jobExamUserLocks', 'student-2_bcs')));
    if ((lock.data() as Record<string, unknown>).status !== 'terminal') {
      throw new Error('lock was not released to terminal');
    }
  });

  it('(e11) a session on a STALE lock is ALLOWED (crash backstop)', async () => {
    const db = asStudent2();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-2', 'jobExamSessions', 'sess-e11'), {
      ...newExamSession(),
      mockId: 'full__bank__1',
      bundleId: BANK_BUNDLE_ID,
      examSlug: 'bank',
      definitionId: 'full__bank__1',
      questionSetId: 'full__bank__1_v1',
      questionRefs: [BANK_REF],
    } as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-2_bank'), {
      uid: 'student-2',
      examSlug: 'bank',
      mockId: 'full__bank__1',
      definitionId: 'full__bank__1',
      activeSessionId: 'sess-e11',
      status: 'in_progress',
      durationSeconds: 3600,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as unknown as Record<string, unknown>);
    await assertSucceeds(batch.commit());
  });

  it('(e23) releasing a lock WITHOUT its session transition is DENIED', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'jobExamUserLocks', 'student-1_bcs'),
      { status: 'terminal', updatedAt: new Date() },
    ));
  });
});

describe('Step 9 — exam attempt create (Design G + H.3 + M1-b)', () => {
  it('(e24) valid attempt on a submitted session SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-att-ok-1'),
      validExamAttempt('sess-att-ok-1') as unknown as Record<string, unknown>,
    ));
  });

  it('(e25) LATE submission (submittedAt > stored endsAt) is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-att-late'),
      validExamAttempt('sess-att-late', { submittedAt: TS_LATE }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e26) attempt on a session whose deadline was never stored is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-att-noends'),
      validExamAttempt('sess-att-noends') as unknown as Record<string, unknown>,
    ));
  });

  it('(e27) kind practice in jobExamAttempts is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', { kind: 'practice', mockId: null }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e28) wrong questionSetId is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', { questionSetId: 'full__bcs__1_v2' }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e29) wrong bundleVersion is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', { bundleVersion: 2 }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e30) submissionIntegrity other than client_calculated is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', { submissionIntegrity: 'server_verified' }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e31) negativeDeduction != wrongCount x penalty is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', {
        answers: [{ ...ONE_ATTEMPT_ANSWER, selected: 'A', correct: false, marks: -0.5 }],
        score: -0.5,
        negativeDeduction: 0,
        negativeMarkingUsed: 0.5,
        correctCount: 0,
        wrongCount: 1,
        unansweredCount: 0,
        accuracy: 0,
        percentage: -50,
        clientCalculatedScore: -0.5,
      }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e32) attempt on an IN-PROGRESS session is DENIED (session gate)', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-att-inprog'),
      validExamAttempt('sess-att-inprog') as unknown as Record<string, unknown>,
    ));
  });

  it('(e33) wrong mockId is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', { mockId: 'full__bcs__2' }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e34) negativeMarkingUsed 0.3 (not 0 / 0.25 / 0.5) is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', { negativeMarkingUsed: 0.3 }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e36) Bank penalty 0 (disabled) with a wrong answer SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAttempts', 'sess-rec-ok'),
      validExamAttempt('sess-rec-ok', {
        answers: [{ ...ONE_ATTEMPT_ANSWER, selected: 'A', correct: false, marks: 0 }],
        score: 0,
        negativeDeduction: 0,
        negativeMarkingUsed: 0,
        correctCount: 0,
        wrongCount: 1,
        unansweredCount: 0,
        accuracy: 0,
        percentage: 0,
        clientCalculatedScore: 0,
      }) as unknown as Record<string, unknown>,
    ));
  });

  it('(e35) a second setDoc on the same attempt (update) is DENIED', async () => {
    const db = asStudent1();
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-att-ok-1')));
    await assertFails(setDoc(
      doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-att-ok-1'),
      readBack.data() as Record<string, unknown>,
    ));
  });
});

describe('Step 9 — purpose receipts (H.1) + key reads', () => {
  it('(e40) practice_review receipt on an EXAM bundle is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'attempt-practice-1',
        createdAt: new Date(),
        purpose: 'practice_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e38) exam_review receipt on an IN-PROGRESS session is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-rec-inprog',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e39) exam_review receipt on a SUBMITTED PRACTICE session is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-practice-1',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e41) exam_review receipt on a PRACTICE bundle is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${TOPIC_BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: TOPIC_BUNDLE_ID,
        attemptId: 'sess-rec-ok',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e37) exam_review receipt on a SUBMITTED exam session SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-rec-ok',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e42) key read with a fresh exam_review receipt (SESSION anchor) SUCCEEDS', async () => {
    const key = await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionKeys', BUNDLE_ID)));
    if (!key.exists()) throw new Error('key doc missing');
  });

  it('(e46) key read with NO receipt for that bundle is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'jobQuestionKeys', BUNDLE_ID_2)));
  });

  it('(e43) key read with a fresh exam_review receipt (ATTEMPT anchor) SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID_2}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID_2,
        attemptId: 'sess-att-ok-2',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
    const key = await assertSucceeds(getDoc(doc(asStudent1(), 'jobQuestionKeys', BUNDLE_ID_2)));
    if (!key.exists()) throw new Error('key doc missing');
  });

  it('(e44) key read with a PRACTICE receipt on an exam bundle is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'jobQuestionKeys', BUNDLE_ID)));
  });

  it('(e45) key read with a STALE exam_review receipt is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'jobQuestionKeys', BUNDLE_ID_2)));
  });

  it('(e47) key read with NO receipt at all is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent3(), 'jobQuestionKeys', BUNDLE_ID)));
  });
});

describe('Step 9 — definitions, manifests, locks (H.8)', () => {
  it('(e48) a STUDENT cannot create a definition — DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobExamDefinitions', 'full__bcs__9'),
      {
        examSlug: 'bcs', titleBn: 'x', titleEn: 'x', kind: 'full',
        bundleId: BUNDLE_ID, questionSetId: 'full__bcs__1_v1',
        rulesSnapshot: {
          questionCount: 1, timeMinutes: 120, marksPerQuestion: 1,
          negativeMarking: 0.5, negativeMarkingVerified: true,
          passPercent: null, scoringConfigVersion: 'v1',
        },
        scheduleDate: null, examSlugCycle: null, status: 'draft',
        retakeAllowed: true, maxAttempts: null,
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e49) a MODERATOR can create a draft definition — SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asModerator(), 'jobExamDefinitions', 'full__bcs__3'),
      {
        examSlug: 'bcs', titleBn: 'বিসিএস পূর্ণ মক ৩', titleEn: 'BCS Full Mock 3', kind: 'full',
        bundleId: BUNDLE_ID, questionSetId: 'full__bcs__1_v1',
        rulesSnapshot: {
          questionCount: 1, timeMinutes: 120, marksPerQuestion: 1,
          negativeMarking: 0.5, negativeMarkingVerified: true,
          passPercent: null, scoringConfigVersion: 'v1',
        },
        scheduleDate: null, examSlugCycle: null, status: 'draft',
        retakeAllowed: true, maxAttempts: null,
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e50) a STUDENT cannot create a manifest — DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobQuestionSetManifests', 'full__bcs__1_v2'),
      {
        examSlug: 'bcs', mockId: 'full__bcs__1', version: 2, questionCount: 1,
        questionRefs: [ONE_REF], markingSchemeVersion: 'v1', status: 'draft',
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e51) a published definition reads for a student; a DRAFT one does not', async () => {
    const pub = await assertSucceeds(getDoc(doc(asStudent1(), 'jobExamDefinitions', 'full__bcs__1')));
    if (!pub.exists()) throw new Error('published definition missing');
    await assertFails(getDoc(doc(asStudent1(), 'jobExamDefinitions', 'full__bcs__2')));
  });

  it('(e52) a PUBLISHED manifest is immutable except status/publish metadata', async () => {
    const db = asModerator();
    await assertFails(updateDoc(
      doc(db, 'jobQuestionSetManifests', 'full__bcs__1_v9'),
      { questionRefs: [{ bundleId: BUNDLE_ID, n: 1, questionId: 'q-other' }] },
    ));
    await assertSucceeds(updateDoc(
      doc(db, 'jobQuestionSetManifests', 'full__bcs__1_v9'),
      { status: 'archived', updatedAt: new Date() },
    ));
  });

  it('(e53) a daily definition with a 10-question snapshot is DENIED', async () => {
    await assertFails(setDoc(
      doc(asModerator(), 'jobExamDefinitions', 'daily__2026-11-23'),
      {
        examSlug: 'bcs', titleBn: 'x', titleEn: 'x', kind: 'daily',
        bundleId: DAILY_BUNDLE_ID, questionSetId: 'daily__2026-11-22_v1',
        rulesSnapshot: {
          questionCount: 10, timeMinutes: 25, marksPerQuestion: 1,
          negativeMarking: 0.5, negativeMarkingVerified: true,
          passPercent: null, scoringConfigVersion: 'v1',
        },
        scheduleDate: '2026-11-23', examSlugCycle: null, status: 'draft',
        retakeAllowed: true, maxAttempts: null,
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e54) a weekly definition with a bad doc-ID is DENIED', async () => {
    await assertFails(setDoc(
      doc(asModerator(), 'jobExamDefinitions', 'weekly__not-a-week'),
      {
        examSlug: 'primary-teacher', titleBn: 'x', titleEn: 'x', kind: 'weekly',
        bundleId: 'weekly__2026-W47', questionSetId: 'weekly__2026-W47_v1',
        rulesSnapshot: {
          questionCount: 90, timeMinutes: 90, marksPerQuestion: 1,
          negativeMarking: 0.25, negativeMarkingVerified: true,
          passPercent: 50, scoringConfigVersion: 'v1',
        },
        scheduleDate: '2026-11-16', examSlugCycle: 'primary-teacher', status: 'draft',
        retakeAllowed: true, maxAttempts: null,
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e55) a lock with the WRONG duration (not definition timeMinutes x 60) is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent3(), 'jobExamUserLocks', 'student-3_bcs'),
      {
        uid: 'student-3', examSlug: 'bcs', mockId: 'full__bcs__1',
        definitionId: 'full__bcs__1', activeSessionId: 'sess-e55',
        status: 'in_progress', durationSeconds: 3600,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      },
    ));
  });

  it('(e56) a lock with a STALE createdAt (> 5min old) is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent3(), 'jobExamUserLocks', 'student-3_bank'),
      {
        uid: 'student-3', examSlug: 'bank', mockId: 'full__bank__1',
        definitionId: 'full__bank__1', activeSessionId: 'sess-e56',
        status: 'in_progress', durationSeconds: 3600,
        createdAt: STALE_30M, updatedAt: STALE_30M,
      },
    ));
  });

  it('(e57) a daily definition whose doc-ID != daily__ + scheduleDate is DENIED', async () => {
    await assertFails(setDoc(
      doc(asModerator(), 'jobExamDefinitions', 'daily__2026-11-23'),
      {
        examSlug: 'bcs', titleBn: 'x', titleEn: 'x', kind: 'daily',
        bundleId: DAILY_BUNDLE_ID, questionSetId: 'daily__2026-11-22_v1',
        rulesSnapshot: {
          questionCount: 25, timeMinutes: 25, marksPerQuestion: 1,
          negativeMarking: 0.5, negativeMarkingVerified: true,
          passPercent: null, scoringConfigVersion: 'v1',
        },
        scheduleDate: '2026-11-22', examSlugCycle: null, status: 'draft',
        retakeAllowed: true, maxAttempts: null,
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e58) a full definition with a non-null scheduleDate is DENIED', async () => {
    await assertFails(setDoc(
      doc(asModerator(), 'jobExamDefinitions', 'full__bcs__4'),
      {
        examSlug: 'bcs', titleBn: 'x', titleEn: 'x', kind: 'full',
        bundleId: BUNDLE_ID, questionSetId: 'full__bcs__1_v1',
        rulesSnapshot: {
          questionCount: 1, timeMinutes: 120, marksPerQuestion: 1,
          negativeMarking: 0.5, negativeMarkingVerified: true,
          passPercent: null, scoringConfigVersion: 'v1',
        },
        scheduleDate: '2026-11-22', examSlugCycle: null, status: 'draft',
        retakeAllowed: true, maxAttempts: null,
        publishedAt: null, publishedBy: null, createdAt: null, updatedAt: null,
      },
    ));
  });

  it('(e59) a DAILY session (25Q/25min, student-2, re-armed lock) SUCCEEDS', async () => {
    const db = asStudent2();
    const refs = Array.from({ length: 25 }, (_, i) => ({
      bundleId: DAILY_BUNDLE_ID,
      n: i + 1,
      questionId: `q-daily-${i + 1}`,
    }));
    const answers: Record<string, { selected: null; markedForReview: boolean; timeSpentSeconds: number }> = {};
    for (let i = 1; i <= 25; i++) {
      answers[String(i)] = { selected: null, markedForReview: false, timeSpentSeconds: 0 };
    }
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'student-2', 'jobExamSessions', 'sess-e59'), {
      kind: 'mock',
      mockId: '2026-11-22',
      bundleId: DAILY_BUNDLE_ID,
      examSlug: 'bcs',
      definitionId: 'daily__2026-11-22',
      questionSetId: 'daily__2026-11-22_v1',
      bundleVersion: 1,
      status: 'in-progress',
      startedAt: serverTimestamp(),
      endsAt: null,
      questionRefs: refs,
      answers,
      currentQuestion: 1,
      lastSyncedAt: new Date(),
      clientEndsAtMillis: null,
      submittedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      revision: 1,
    } as unknown as Record<string, unknown>);
    batch.set(doc(db, 'jobExamUserLocks', 'student-2_bcs'), {
      uid: 'student-2',
      examSlug: 'bcs',
      mockId: '2026-11-22',
      definitionId: 'daily__2026-11-22',
      activeSessionId: 'sess-e59',
      status: 'in_progress',
      durationSeconds: 1500,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as unknown as Record<string, unknown>);
    await assertSucceeds(batch.commit());
  });
});

describe('Step 9 closure — anchored receipt re-issue (open question 1)', () => {
  // e37 created student-1's BUNDLE_ID receipt (session anchor
  // 'sess-rec-ok'); e24 created the submitted attempt
  // 'sess-att-ok-1' for the same bundle. The re-issue tests below
  // all operate on that ONE receipt doc, in order: e60 re-issues
  // it to the attempt anchor, e61–e65 deny bad re-issues (each
  // denied update leaves the doc unchanged).
  it('(e60) re-issue to a NEWLY submitted attempt anchor SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-att-ok-1',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
    const readBack = await assertSucceeds(getDoc(doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`)));
    if ((readBack.data() as Record<string, unknown>).attemptId !== 'sess-att-ok-1') {
      throw new Error('receipt did not re-anchor to the new attempt');
    }
  });

  it('(e61) re-issue anchored to an IN-PROGRESS session is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-rec-inprog',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e62) re-issue that MOVES the receipt to another bundle is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID_2,
        attemptId: 'sess-att-ok-2',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e63) re-issue with a STALE createdAt is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-att-ok-1',
        createdAt: STALE_30M,
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e64) re-issue with a FUTURE createdAt is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-att-ok-1',
        createdAt: new Date(Date.now() + 60 * 60 * 1000),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e65) re-issue by ANOTHER student is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent2(), 'jobReceipts', `student-1_${BUNDLE_ID}`),
      {
        userId: 'student-2',
        bundleId: BUNDLE_ID,
        attemptId: 'sess-rec-ok-2',
        createdAt: new Date(),
        purpose: 'exam_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e66a) practice_review receipt CREATE still SUCCEEDS (refactor guard)', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${TOPIC_BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: TOPIC_BUNDLE_ID,
        attemptId: 'attempt-practice-1',
        createdAt: new Date(),
        purpose: 'practice_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e66b) practice_review receipt RE-ISSUE SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${TOPIC_BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: TOPIC_BUNDLE_ID,
        attemptId: 'attempt-practice-1',
        createdAt: new Date(),
        purpose: 'practice_review',
        bundleVersion: 1,
      },
    ));
  });

  it('(e66c) practice re-issue anchored to an EXAM session is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'jobReceipts', `student-1_${TOPIC_BUNDLE_ID}`),
      {
        userId: 'student-1',
        bundleId: TOPIC_BUNDLE_ID,
        attemptId: 'sess-rec-ok',
        createdAt: new Date(),
        purpose: 'practice_review',
        bundleVersion: 1,
      },
    ));
  });
});

describe('Step 9 closure — mock-exam audit log (checklist item 11)', () => {
  const validLog = (overrides: Record<string, unknown> = {}) => ({
    uid: 'student-1',
    event: 'mock_started',
    examSlug: 'bcs',
    mockId: 'full__bcs__1',
    sessionId: 'sess-rec-ok',
    bundleId: BUNDLE_ID,
    createdAt: new Date(),
    detail: null,
    ...overrides,
  });

  it('(e67) owner creates a valid audit entry — SUCCEEDS', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e67'),
      validLog(),
    ));
  });

  it('(e68) audit entry with an UNKNOWN event is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e68'),
      validLog({ event: 'exam_started' }),
    ));
  });

  it('(e69) audit entry with a >500-char detail is DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e69'),
      validLog({ detail: 'x'.repeat(501) }),
    ));
  });

  it('(e70) ANOTHER student cannot write into the owner’s audit log — DENIED', async () => {
    await assertFails(setDoc(
      doc(asStudent2(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e70'),
      validLog({ uid: 'student-2' }),
    ));
  });

  it('(e71) audit entry UPDATE is DENIED; ADMIN delete SUCCEEDS', async () => {
    await assertFails(updateDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e67'),
      { detail: 'tampered' },
    ));
    await assertFails(deleteDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e67'),
    ));
    await assertSucceeds(deleteDoc(
      doc(asAdmin(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e67'),
    ));
  });

  it('(e72) audit entry reads: owner + moderator SUCCEED, another student DENIED', async () => {
    await assertSucceeds(setDoc(
      doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e72'),
      validLog({ event: 'mock_submitted' }),
    ));
    await assertSucceeds(getDoc(doc(asStudent1(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e72')));
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e72')));
    await assertFails(getDoc(doc(asStudent2(), 'users', 'student-1', 'jobExamAuditLogs', 'log-e72')));
  });
});
