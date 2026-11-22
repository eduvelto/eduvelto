/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 10
 * (result detail + analysis).
 *
 * Two parts:
 *  (r1–r6) READ-PATH PROOF — the analysis page lists the student's
 *  OWN attempts (jobAttempts + jobExamAttempts). No new rule was
 *  added: both matches already allow owner read. These tests prove
 *  the owner list queries succeed and cross-user reads are denied,
 *  so the "only add a rule if a needed list query is actually
 *  denied" bar is met with NO rule change.
 *  (i11) REAL-CONTENT E2E — the Step 9 i10 fixture (3 VERBATIM BCS
 *  English questions bcs-eng-001/002/003) submitted twice as a mock
 *  (first C/A/B, retake C/A/D) plus once as practice, then the
 *  Step 10 analysis lib runs over the STORED attempts read back
 *  from the emulator: score breakdown, per-topic accuracy, trend
 *  (+50% vs the student's own previous mock), topic mastery
 *  (66.7% → 100%), wrong-answer list, and the negative-marking
 *  cost. No number here is invented — every expected value is
 *  computed from the verbatim fixture + the submitted answers.
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
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  attemptSummaryFromStored,
  attemptTrend,
  buildWrongAnswerList,
  groupAttemptsByExam,
  negativeMarkingExplanation,
  perTopicAccuracy,
  resultObservation,
  topicMasteryOverTime,
} from '../src/lib/jobAnalysis';
import {
  buildJobAttemptDoc,
  buildMockAutosavePatch,
  buildMockDeadlineUpdate,
  buildMockSessionSubmitUpdate,
  createMockSession,
  createPracticeSession,
  jobAttemptResultFromStoredDoc,
  jobExamPattern,
  scoreMockAttempt,
  scorePracticeAttempt,
  validateAttemptResult,
  type JobAttemptResult,
  type JobMockSessionDoc,
} from '../src/lib/jobEngine';
import {
  buildExamLockDoc,
  buildMockReceiptDoc,
  examLockId,
  normalizeMockSessionDoc,
} from '../src/lib/jobMock';
import type { JobQuestionBundle, JobQuestionKey } from '../src/lib/jobQuestions';

const PROJECT_ID = 'eduvelto-rules-test-step10-analysis';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamAttempts')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamAttempts match.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');

/* The REAL fixture — verbatim from the Step 9 i10 E2E (itself
 * verbatim from the live BCS English batch 1 draft,
 * team/job-questions-bcs-english-draft-2026-11-22.json).
 * Nothing is invented here. */
const REAL_BUNDLE_ID = 'mock__full__bcs__e2e';
const REAL_BUNDLE: JobQuestionBundle = {
  kind: 'mock',
  examSlug: 'bcs',
  topicId: null,
  mockId: 'full__bcs__e2e',
  titleBn: 'বিসিএস পূর্ণ মক (বাস্তব প্রশ্ন)',
  titleEn: 'BCS Full Mock (real questions)',
  questions: [
    {
      n: 1, questionId: 'bcs-eng-001', topicId: 'bcs__english__grammar__tense',
      subjectId: 'bcs__english', questionText: 'Choose the correct sentence.',
      options: [
        { letter: 'A', text: 'He go to school every day.' },
        { letter: 'B', text: 'He going to school every day.' },
        { letter: 'C', text: 'He goes to school every day.' },
        { letter: 'D', text: 'He gone to school every day.' },
      ],
      difficulty: 'easy',
    },
    {
      n: 2, questionId: 'bcs-eng-002', topicId: 'bcs__english__grammar__tense',
      subjectId: 'bcs__english', questionText: 'By the time you arrive, I ___ my homework.',
      options: [
        { letter: 'A', text: 'will have finished' },
        { letter: 'B', text: 'will finish' },
        { letter: 'C', text: 'finish' },
        { letter: 'D', text: 'have finished' },
      ],
      difficulty: 'medium',
    },
    {
      n: 3, questionId: 'bcs-eng-003', topicId: 'bcs__english__grammar__tense',
      subjectId: 'bcs__english', questionText: 'She ___ in Dhaka since 2015.',
      options: [
        { letter: 'A', text: 'lives' },
        { letter: 'B', text: 'is living' },
        { letter: 'C', text: 'lived' },
        { letter: 'D', text: 'has been living' },
      ],
      difficulty: 'medium',
    },
  ],
  questionCount: 3,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['bcs-eng-001', 'bcs-eng-002', 'bcs-eng-003'],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};
const REAL_KEY: JobQuestionKey = {
  bundleId: REAL_BUNDLE_ID,
  answers: [
    { n: 1, questionId: 'bcs-eng-001', correctLetter: 'C', correctText: 'He goes to school every day.', explanation: 'he third person singular, তাই present simple-এ verb-এর শেষে -s/-es বসে — goes সঠিক।', whyWrong: null },
    { n: 2, questionId: 'bcs-eng-002', correctLetter: 'A', correctText: 'will have finished', explanation: "'By the time you arrive' — ভবিষ্যতের একটা সময়ের আগেই কাজ শেষ হয়ে যাবে, তাই future perfect (will have + past participle) হয়।", whyWrong: null },
    { n: 3, questionId: 'bcs-eng-003', correctLetter: 'D', correctText: 'has been living', explanation: "'since 2015' — অতীত থেকে এখন পর্যন্ত চলছে, তাই present perfect continuous (has/have been + verb-ing) হয়।", whyWrong: null },
  ],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};
const REAL_SNAPSHOT = {
  questionCount: 3, timeMinutes: 120, marksPerQuestion: 1,
  negativeMarking: 0.5, negativeMarkingVerified: true,
  passPercent: null, scoringConfigVersion: 'v1',
};
const REAL_REFS = [1, 2, 3].map((n) => ({ bundleId: REAL_BUNDLE_ID, n, questionId: `bcs-eng-00${n}` }));

/* The same 3 verbatim questions as a PRACTICE (topic) bundle —
 * the practice attempt in the E2E answers the same questions
 * through the Step 8 practice flow. */
const PRACTICE_BUNDLE_ID = 'topic__bcs__english__grammar__tense';
const PRACTICE_BUNDLE: JobQuestionBundle = {
  ...REAL_BUNDLE,
  kind: 'topic',
  topicId: 'bcs__english__grammar__tense',
  mockId: null,
  titleBn: 'বিসিএস English — Grammar — Tense',
  titleEn: 'BCS English — Grammar — Tense',
};
const PRACTICE_KEY: JobQuestionKey = { ...REAL_KEY, bundleId: PRACTICE_BUNDLE_ID };

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['moderator-1', 'moderator'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'jobQuestionBundles', REAL_BUNDLE_ID), { ...REAL_BUNDLE });
    await setDoc(doc(db, 'jobQuestionKeys', REAL_BUNDLE_ID), { ...REAL_KEY });
    await setDoc(doc(db, 'jobExamDefinitions', 'full__bcs__e2e'), {
      examSlug: 'bcs',
      titleBn: REAL_BUNDLE.titleBn,
      titleEn: REAL_BUNDLE.titleEn,
      kind: 'full',
      bundleId: REAL_BUNDLE_ID,
      questionSetId: 'full__bcs__e2e_v1',
      rulesSnapshot: { ...REAL_SNAPSHOT },
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
    await setDoc(doc(db, 'jobQuestionSetManifests', 'full__bcs__e2e_v1'), {
      examSlug: 'bcs',
      mockId: 'full__bcs__e2e',
      version: 1,
      questionCount: 3,
      questionRefs: REAL_REFS,
      markingSchemeVersion: 'v1',
      status: 'published',
      publishedAt: TS,
      publishedBy: 'moderator-1',
      createdAt: TS,
      updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionBundles', PRACTICE_BUNDLE_ID), { ...PRACTICE_BUNDLE });
    await setDoc(doc(db, 'jobQuestionKeys', PRACTICE_BUNDLE_ID), { ...PRACTICE_KEY });
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

const asStudent = (uid = 'student-1') => env.authenticatedContext(uid).firestore();
const asModerator = () => env.authenticatedContext('moderator-1').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

function millisOf(t: unknown): number | null {
  const v = t as { toMillis?: () => number; seconds?: number } | null;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number') return v.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return null;
}

async function readMockSession(sessionId: string): Promise<JobMockSessionDoc> {
  const snap = await assertSucceeds(getDoc(doc(asStudent(), 'users', 'student-1', 'jobExamSessions', sessionId)));
  if (!snap.exists()) throw new Error(`session ${sessionId} missing`);
  return normalizeMockSessionDoc(snap.data() as Record<string, unknown>);
}

/** The mock submit flow (Design G), condensed from the Step 9
 * i10 E2E — same lib builders, same order. */
async function runMockSubmitFlow(
  sessionId: string,
  letters: Array<'A' | 'B' | 'C' | 'D' | null>,
): Promise<Record<string, unknown>> {
  const db = asStudent();
  const session = createMockSession({
    sessionId,
    mockId: 'full__bcs__e2e',
    bundleId: REAL_BUNDLE_ID,
    examSlug: 'bcs',
    definitionId: 'full__bcs__e2e',
    questionSetId: 'full__bcs__e2e_v1',
    bundleVersion: 1,
    questionRefs: REAL_REFS,
    timeMinutes: 120,
    clientNowMillis: Date.now(),
  });
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), session as unknown as Record<string, unknown>);
  batch.set(doc(db, 'jobExamUserLocks', examLockId('student-1', 'bcs')), buildExamLockDoc({
    uid: 'student-1',
    examSlug: 'bcs',
    mockId: 'full__bcs__e2e',
    definitionId: 'full__bcs__e2e',
    activeSessionId: sessionId,
    durationSeconds: 120 * 60,
  }) as unknown as Record<string, unknown>);
  await assertSucceeds(batch.commit());
  // Deadline: exactly startedAt + 120min (nanos preserved).
  const stored0 = await readMockSession(sessionId);
  const startedAt = stored0.startedAt as Timestamp;
  const startedAtMillis = millisOf(startedAt);
  if (startedAtMillis === null) throw new Error('no startedAt');
  const endsAt = new Timestamp(startedAt.seconds + 120 * 60, startedAt.nanoseconds);
  await assertSucceeds(updateDoc(
    doc(db, 'users', 'student-1', 'jobExamSessions', sessionId),
    buildMockDeadlineUpdate(stored0.revision, endsAt, startedAtMillis + 120 * 60 * 1000),
  ));
  // Autosave the answers.
  const storedForAutosave = await readMockSession(sessionId);
  const answersMap: Record<number, { selected: 'A' | 'B' | 'C' | 'D' | null; markedForReview: boolean; timeSpentSeconds: number }> = {};
  letters.forEach((sel, i) => {
    answersMap[i + 1] = { selected: sel, markedForReview: false, timeSpentSeconds: 45 };
  });
  await assertSucceeds(updateDoc(
    doc(db, 'users', 'student-1', 'jobExamSessions', sessionId),
    buildMockAutosavePatch({ ...storedForAutosave, answers: answersMap }),
  ));
  // Design G step 2: session → submitted + lock → terminal.
  const stored = await readMockSession(sessionId);
  const submitBatch = writeBatch(db);
  submitBatch.update(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), buildMockSessionSubmitUpdate(stored.revision));
  submitBatch.update(doc(db, 'jobExamUserLocks', examLockId('student-1', 'bcs')), {
    status: 'terminal',
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(submitBatch.commit());
  // Design G step 3: receipt (best-effort — a retake re-issues).
  try {
    await setDoc(
      doc(db, 'jobReceipts', `student-1_${REAL_BUNDLE_ID}`),
      buildMockReceiptDoc('student-1', REAL_BUNDLE_ID, sessionId, 1),
    );
  } catch {
    // Retake: the receipt already exists — proceed.
  }
  // Step 4: key read (receipt-gated). Step 5–6: score + build.
  const keySnap = await assertSucceeds(getDoc(doc(db, 'jobQuestionKeys', REAL_BUNDLE_ID)));
  if (!keySnap.exists()) throw new Error('key doc missing');
  const key = keySnap.data() as JobQuestionKey;
  const result: JobAttemptResult = scoreMockAttempt({
    bundle: REAL_BUNDLE,
    key,
    answers: REAL_BUNDLE.questions.map((q, i) => ({
      n: q.n, questionId: q.questionId, selected: letters[i] ?? null, timeSpentSeconds: 45,
    })),
    rulesSnapshot: REAL_SNAPSHOT,
    examSlug: 'bcs',
    startedAtMillis,
    submittedAtMillis: Date.now(),
  });
  const attemptDoc = buildJobAttemptDoc({
    sessionId,
    session: stored,
    result,
    bundleId: REAL_BUNDLE_ID,
    examSlug: 'bcs',
    subjectId: null,
    topicId: null,
    kind: 'mock',
    mockId: 'full__bcs__e2e',
    questionSetId: 'full__bcs__e2e_v1',
    bundleVersion: 1,
    userId: 'student-1',
  });
  const problems = validateAttemptResult(attemptDoc);
  if (problems.length > 0) throw new Error(`lib validator rejected its own doc: ${problems.join('; ')}`);
  await assertSucceeds(setDoc(
    doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId),
    attemptDoc as unknown as Record<string, unknown>,
  ));
  const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId)));
  return readBack.data() as Record<string, unknown>;
}

/** The practice submit flow (Step 8), condensed: session seeded
 * in-progress, then ONE batch (session → submitted + attempt
 * create) with the lib builders. */
async function runPracticeSubmitFlow(
  sessionId: string,
  letters: Array<'A' | 'B' | 'C' | 'D' | null>,
): Promise<Record<string, unknown>> {
  const db = asStudent();
  const pattern = jobExamPattern('bcs');
  if (!pattern) throw new Error('no BCS pattern');
  const session = createPracticeSession({
    sessionId,
    bundleId: PRACTICE_BUNDLE_ID,
    examSlug: 'bcs',
    questionRefs: REAL_REFS.map((r) => ({ ...r, bundleId: PRACTICE_BUNDLE_ID })),
  });
  // The session create goes through the rules (in-progress).
  await assertSucceeds(setDoc(
    doc(db, 'users', 'student-1', 'jobSessions', sessionId),
    session as unknown as Record<string, unknown>,
  ));
  const startedAtMillis = Date.now() - 135 * 1000;
  const result: JobAttemptResult = scorePracticeAttempt({
    bundle: PRACTICE_BUNDLE,
    key: PRACTICE_KEY,
    answers: PRACTICE_BUNDLE.questions.map((q, i) => ({
      n: q.n, questionId: q.questionId, selected: letters[i] ?? null, timeSpentSeconds: 45,
    })),
    pattern,
    startedAtMillis,
    submittedAtMillis: Date.now(),
  });
  const attemptDoc = buildJobAttemptDoc({
    sessionId,
    session,
    result,
    bundleId: PRACTICE_BUNDLE_ID,
    examSlug: 'bcs',
    subjectId: 'bcs__english',
    topicId: 'bcs__english__grammar__tense',
    kind: 'practice',
    bundleVersion: 1,
    userId: 'student-1',
  });
  const problems = validateAttemptResult(attemptDoc);
  if (problems.length > 0) throw new Error(`lib validator rejected its own doc: ${problems.join('; ')}`);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'student-1', 'jobSessions', sessionId), {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    revision: 2,
  });
  batch.set(doc(db, 'users', 'student-1', 'jobAttempts', sessionId), attemptDoc as unknown as Record<string, unknown>);
  await assertSucceeds(batch.commit());
  const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobAttempts', sessionId)));
  return readBack.data() as Record<string, unknown>;
}

describe('Step 10 read-path proof (r1–r6): owner lists, cross-user denies, NO new rule', () => {
  it('(r1) owner list of jobAttempts (kind + submittedAt desc) SUCCEEDS', async () => {
    // Seed one practice attempt with rules disabled, then list
    // with rules on — the query the analysis page runs.
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'seed-practice-1'), {
        userId: 'student-1', kind: 'practice', mockId: null, bundleId: PRACTICE_BUNDLE_ID,
        examSlug: 'bcs', subjectId: 'bcs__english', topicId: 'bcs__english__grammar__tense',
        answers: [], score: 1, totalMarks: 3, negativeDeduction: 0, negativeMarkingUsed: 0.5,
        markingSchemeVersion: 'v1', bundleVersion: 1, correctCount: 1, wrongCount: 0,
        unansweredCount: 2, accuracy: 100, percentage: 33.3, timeSpentSeconds: 60,
        startedAt: TS, submittedAt: TS, status: 'submitted', markingStatus: 'practice',
        resultLabel: 'practice', clientCalculatedScore: 1, trustLevel: 'unverified',
        resultType: 'practice', sessionId: 'seed-practice-1', submissionIntegrity: 'client_calculated',
      });
    });
    const snap = await assertSucceeds(getDocs(query(
      collection(asStudent(), 'users', 'student-1', 'jobAttempts'),
      where('kind', '==', 'practice'),
      orderBy('submittedAt', 'desc'),
      limit(50),
    )));
    if (snap.docs.length !== 1) throw new Error(`expected 1 practice attempt, got ${snap.docs.length}`);
  });

  it('(r2) owner list of jobExamAttempts (kind + submittedAt desc) SUCCEEDS', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', 'seed-mock-1'), {
        userId: 'student-1', kind: 'mock', mockId: 'full__bcs__e2e', bundleId: REAL_BUNDLE_ID,
        examSlug: 'bcs', subjectId: null, topicId: null,
        answers: [], score: 1, totalMarks: 3, negativeDeduction: 0, negativeMarkingUsed: 0.5,
        markingSchemeVersion: 'v1', bundleVersion: 1, correctCount: 1, wrongCount: 0,
        unansweredCount: 2, accuracy: 100, percentage: 33.3, timeSpentSeconds: 60,
        startedAt: TS, submittedAt: TS, status: 'submitted', markingStatus: 'practice',
        resultLabel: 'practice', clientCalculatedScore: 1, trustLevel: 'unverified',
        resultType: 'mock', sessionId: 'seed-mock-1', submissionIntegrity: 'client_calculated',
        questionSetId: 'full__bcs__e2e_v1',
      });
    });
    const snap = await assertSucceeds(getDocs(query(
      collection(asStudent(), 'users', 'student-1', 'jobExamAttempts'),
      where('kind', '==', 'mock'),
      orderBy('submittedAt', 'desc'),
      limit(50),
    )));
    if (snap.docs.length !== 1) throw new Error(`expected 1 mock attempt, got ${snap.docs.length}`);
  });

  it('(r3) another student listing the owner’s jobAttempts is DENIED', async () => {
    await assertFails(getDocs(query(
      collection(asStudent('student-2'), 'users', 'student-1', 'jobAttempts'),
      where('kind', '==', 'practice'),
      orderBy('submittedAt', 'desc'),
      limit(50),
    )));
  });

  it('(r4) another student reading one of the owner’s attempts is DENIED', async () => {
    await assertFails(getDoc(doc(asStudent('student-2'), 'users', 'student-1', 'jobAttempts', 'seed-practice-1')));
    await assertFails(getDoc(doc(asStudent('student-2'), 'users', 'student-1', 'jobExamAttempts', 'seed-mock-1')));
  });

  it('(r5) a moderator MAY read the owner’s attempts (existing rule)', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'jobAttempts', 'seed-practice-1')));
    await assertSucceeds(getDoc(doc(asModerator(), 'users', 'student-1', 'jobExamAttempts', 'seed-mock-1')));
  });

  it('(r6) a signed-out visitor listing attempts is DENIED', async () => {
    await assertFails(getDocs(query(
      collection(asSignedOut(), 'users', 'student-1', 'jobAttempts'),
      where('kind', '==', 'practice'),
      orderBy('submittedAt', 'desc'),
      limit(50),
    )));
  });
});

describe('Step 10 real-content E2E (i11): stored attempts → analysis computations', () => {
  it('(i11) two mocks + one practice on the verbatim BCS questions analyse end-to-end', async () => {
    // Mock 1: C/A/B — Q1 + Q2 correct, Q3 wrong (correct D).
    // BCS: 2 − 0.50 = 1.5, 50%.
    const mock1 = await runMockSubmitFlow('sess-i11-a', ['C', 'A', 'B']);
    if (mock1.score !== 1.5) throw new Error(`mock1 score ${mock1.score}, expected 1.5`);
    // Retake: C/A/D — all correct. 3, 100%.
    const mock2 = await runMockSubmitFlow('sess-i11-b', ['C', 'A', 'D']);
    if (mock2.score !== 3) throw new Error(`mock2 score ${mock2.score}, expected 3`);
    // Practice on the same verbatim questions: C/A/B → 1.5.
    const practice = await runPracticeSubmitFlow('sess-i11-p', ['C', 'A', 'B']);
    if (practice.score !== 1.5) throw new Error(`practice score ${practice.score}, expected 1.5`);

    // The analysis reads ONLY the stored attempts (never the key).
    const s1 = attemptSummaryFromStored('sess-i11-a', mock1);
    const s2 = attemptSummaryFromStored('sess-i11-b', mock2);
    const sp = attemptSummaryFromStored('sess-i11-p', practice);

    // Score breakdown: formula + what the wrong answers cost.
    const marking = negativeMarkingExplanation(s1);
    if (marking.disabled) throw new Error('BCS marking must not read as disabled');
    if (marking.formula !== '2টি সঠিক × 1 − 1টি ভুল × 0.5 = 1.5 নম্বর') {
      throw new Error(`formula wrong: ${marking.formula}`);
    }
    if (marking.costLine !== '1টি ভুল উত্তরে 0.5 নম্বর কাটা গেছে') {
      throw new Error(`cost line wrong: ${marking.costLine}`);
    }
    // Per-topic accuracy: the one tense topic, 2/3, 66.7%.
    const topics = perTopicAccuracy(s1.answers);
    if (topics.length !== 1 || topics[0].topicId !== 'bcs__english__grammar__tense') {
      throw new Error(`topics wrong: ${JSON.stringify(topics)}`);
    }
    if (topics[0].correct !== 2 || topics[0].total !== 3 || topics[0].accuracy !== 66.7) {
      throw new Error('topic accuracy wrong');
    }
    if (topics[0].label !== 'English — Grammar — Tense') throw new Error('topic label is a raw slug');
    // Wrong-answer list (Step 13 hook): exactly Q3.
    const wrong = buildWrongAnswerList(s1);
    if (wrong.length !== 1 || wrong[0].questionId !== 'bcs-eng-003' || wrong[0].status !== 'wrong') {
      throw new Error(`wrong list wrong: ${JSON.stringify(wrong)}`);
    }
    // The three-second observation names the weakest topic.
    const observation = resultObservation(s1);
    if (!observation.includes('English — Grammar — Tense') || !observation.includes('১ম অগ্রাধিকার')) {
      throw new Error(`observation wrong: ${observation}`);
    }
    // Trend: same exam only (BCS), own past only — 100 vs 50.
    const groups = groupAttemptsByExam([s2, s1]);
    if (groups.length !== 1 || groups[0].examSlug !== 'bcs') throw new Error('exam grouping wrong');
    const trend = attemptTrend(groups[0].attempts, 'মক');
    if (trend.latestPercent !== 100 || trend.previousPercent !== 50 || trend.deltaVsPrevious !== 50) {
      throw new Error(`trend wrong: ${JSON.stringify(trend)}`);
    }
    if (!trend.sentence.includes('আগের মকের চেয়ে +50%')) throw new Error(`trend sentence wrong: ${trend.sentence}`);
    // Topic mastery over time: 66.7% → 100%.
    const mastery = topicMasteryOverTime([s2, s1]);
    if (mastery.length !== 1 || mastery[0].firstAccuracy !== 66.7 || mastery[0].latestAccuracy !== 100) {
      throw new Error(`mastery wrong: ${JSON.stringify(mastery)}`);
    }
    // The practice attempt rebuilds from its stored doc (retake
    // / idempotent-retry shape) and analyses the same way.
    const rebuilt = jobAttemptResultFromStoredDoc(practice);
    if (rebuilt === null || rebuilt.score !== 1.5) throw new Error('practice attempt did not rebuild');
    const practiceTopics = perTopicAccuracy(sp.answers);
    if (practiceTopics.length !== 1 || practiceTopics[0].accuracy !== 66.7) {
      throw new Error('practice topic accuracy wrong');
    }
    // Labels stay practice/unverified on every stored attempt.
    for (const d of [mock1, mock2, practice]) {
      if (d.resultLabel !== 'practice' || d.trustLevel !== 'unverified') {
        throw new Error('result labels wrong');
      }
    }
  });
});
