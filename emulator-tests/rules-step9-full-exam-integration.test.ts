/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 9
 * (engine↔rules INTEGRATION: the lib builders produce docs the
 * rules accept, 22 Nov 2026).
 *
 * The rules tests (rules-step9-full-exam.test.ts) build docs by
 * hand; the unit tests (jobMockEngine.test.ts) never touch
 * Firestore. This file closes the gap: it runs the REAL UI flow
 * through the emulator using the REAL lib builders —
 * createMockSession, buildMockDeadlineUpdate,
 * buildMockAutosavePatch, buildMockSessionSubmitUpdate,
 * buildMockReceiptDoc, scoreMockAttempt, buildJobAttemptDoc,
 * validateAttemptResult, jobAttemptResultFromStoredDoc — against
 * the REAL rules:
 *   session + lock batch → deadline set (EXACT, nanos-preserved)
 *   → autosave → session submitted + lock released (ONE batch)
 *   → receipt → key read → score → attempt create (same doc-ID)
 *   → read back.
 * A tampered attempt must fail the lib validator AND the rules.
 *
 * NOTE: the Firestore-touching functions in jobMock.ts
 * (startMockSession / ensureMockDeadline / submitMockAttempt)
 * use the app's db (requireDb), not the test env's — so this
 * file mirrors their steps with the pure builders + the test
 * env's db, exactly like the Step 8 integration test does for
 * the practice engine.
 *
 * Seed: one Published 1-question BCS full mock + one Published
 * 1-question Bank full mock (negative marking DISABLED — the
 * snapshot carries null), each with definition + manifest +
 * bundle + key. No real questions are fabricated beyond the
 * single seeded fixture question per mock.
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
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildJobAttemptDoc,
  buildMockAutosavePatch,
  buildMockDeadlineUpdate,
  buildMockSessionSubmitUpdate,
  createMockSession,
  jobAttemptResultFromStoredDoc,
  scoreMockAttempt,
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
import type { JobQuestionBundle, JobQuestionKey, JobQuestionOption } from '../src/lib/jobQuestions';

const PROJECT_ID = 'eduvelto-rules-test-step9-integration';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamSessions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamSessions match.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
const OPTIONS: JobQuestionOption[] = [
  { letter: 'A', text: 'দুটি স্বরের মিলন' },
  { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
  { letter: 'C', text: 'দুটি শব্দের মিলন' },
  { letter: 'D', text: 'দুটি বাক্যের মিলন' },
];

function makeBundle(mockId: string, examSlug: string, questionId: string): JobQuestionBundle {
  return {
    kind: 'mock',
    examSlug,
    topicId: null,
    mockId,
    titleBn: `${examSlug} পূর্ণ মক ১`,
    titleEn: `${examSlug} Full Mock 1`,
    questions: [
      {
        n: 1,
        questionId,
        topicId: `${examSlug}__bangla__grammar__sandhi`,
        subjectId: `${examSlug}__bangla`,
        questionText: 'সন্ধি কাকে বলে?',
        options: OPTIONS,
        difficulty: 'easy',
      },
    ],
    questionCount: 1,
    bundleVersion: 1,
    status: 'published',
    reviewStatus: 'Published',
    sourceQuestionIds: [questionId],
    configVersion: '1',
    createdAt: TS,
    updatedAt: TS,
  };
}

function makeKey(bundleId: string, questionId: string): JobQuestionKey {
  return {
    bundleId,
    answers: [
      {
        n: 1,
        questionId,
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
}

const BCS_BUNDLE_ID = 'mock__full__bcs__1';
const BANK_BUNDLE_ID = 'mock__full__bank__1';
const BCS_BUNDLE = makeBundle('full__bcs__1', 'bcs', 'q-seed-1');
const BANK_BUNDLE = makeBundle('full__bank__1', 'bank', 'q-bank-1');
const BCS_KEY = makeKey(BCS_BUNDLE_ID, 'q-seed-1');
const BANK_KEY = makeKey(BANK_BUNDLE_ID, 'q-bank-1');

const BCS_SNAPSHOT: MockSnapshot = {
  questionCount: 1,
  timeMinutes: 120,
  marksPerQuestion: 1,
  negativeMarking: 0.5,
  negativeMarkingVerified: true,
  passPercent: null,
  scoringConfigVersion: 'v1',
};
const BANK_SNAPSHOT: MockSnapshot = {
  questionCount: 1,
  timeMinutes: 60,
  marksPerQuestion: 1,
  negativeMarking: null,
  negativeMarkingVerified: false,
  passPercent: null,
  scoringConfigVersion: 'v0-provisional',
};

interface MockSnapshot {
  questionCount: number;
  timeMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number | null;
  negativeMarkingVerified: boolean;
  passPercent: number | null;
  scoringConfigVersion: string;
}

interface MockSetup {
  examSlug: string;
  mockId: string;
  bundleId: string;
  definitionId: string;
  questionSetId: string;
  bundle: JobQuestionBundle;
  key: JobQuestionKey;
  snapshot: MockSnapshot;
  ref: { bundleId: string; n: number; questionId: string };
  /** Multi-question setups list every ref here; single-question
   * setups keep using `ref`. */
  refs?: Array<{ bundleId: string; n: number; questionId: string }>;
}

const BCS: MockSetup = {
  examSlug: 'bcs',
  mockId: 'full__bcs__1',
  bundleId: BCS_BUNDLE_ID,
  definitionId: 'full__bcs__1',
  questionSetId: 'full__bcs__1_v1',
  bundle: BCS_BUNDLE,
  key: BCS_KEY,
  snapshot: BCS_SNAPSHOT,
  ref: { bundleId: BCS_BUNDLE_ID, n: 1, questionId: 'q-seed-1' },
};
const BANK: MockSetup = {
  examSlug: 'bank',
  mockId: 'full__bank__1',
  bundleId: BANK_BUNDLE_ID,
  definitionId: 'full__bank__1',
  questionSetId: 'full__bank__1_v1',
  bundle: BANK_BUNDLE,
  key: BANK_KEY,
  snapshot: BANK_SNAPSHOT,
  ref: { bundleId: BANK_BUNDLE_ID, n: 1, questionId: 'q-bank-1' },
};

/* Real-content E2E (Step 9 closure, Step 8 finding #8): three
 * VERBATIM questions from the live BCS English batch 1 —
 * team/job-questions-bcs-english-draft-2026-11-22.json
 * (bcs-eng-001/002/003, all Published live 22 Nov, audit
 * team/bcs-english-batch1-import-audit-2026-11-22.json). No
 * question is invented here: question text, options, correct
 * letters and explanations are copied from that draft. The
 * bundle/key/definition/manifest are the TEST FIXTURE (a 3-question
 * mock) — live has no published mock definition/manifest yet, so
 * a real student mock still cannot run on production; this is the
 * closest E2E the engine↔rules path allows. */
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
const REAL_SNAPSHOT: MockSnapshot = {
  questionCount: 3, timeMinutes: 120, marksPerQuestion: 1,
  negativeMarking: 0.5, negativeMarkingVerified: true,
  passPercent: null, scoringConfigVersion: 'v1',
};
const REAL: MockSetup = {
  examSlug: 'bcs', mockId: 'full__bcs__e2e', bundleId: REAL_BUNDLE_ID,
  definitionId: 'full__bcs__e2e', questionSetId: 'full__bcs__e2e_v1',
  bundle: REAL_BUNDLE, key: REAL_KEY, snapshot: REAL_SNAPSHOT,
  ref: { bundleId: REAL_BUNDLE_ID, n: 1, questionId: 'bcs-eng-001' },
  refs: [1, 2, 3].map((n) => ({ bundleId: REAL_BUNDLE_ID, n, questionId: `bcs-eng-00${n}` })),
};

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'student-1'), {
      displayName: 'student-1',
      email: 'student-1@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    for (const setup of [BCS, BANK, REAL]) {
      await setDoc(doc(db, 'jobQuestionBundles', setup.bundleId), { ...setup.bundle });
      await setDoc(doc(db, 'jobQuestionKeys', setup.bundleId), { ...setup.key });
      await setDoc(doc(db, 'jobExamDefinitions', setup.definitionId), {
        examSlug: setup.examSlug,
        titleBn: setup.bundle.titleBn,
        titleEn: setup.bundle.titleEn,
        kind: 'full',
        bundleId: setup.bundleId,
        questionSetId: setup.questionSetId,
        rulesSnapshot: { ...setup.snapshot },
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
      await setDoc(doc(db, 'jobQuestionSetManifests', setup.questionSetId), {
        examSlug: setup.examSlug,
        mockId: setup.mockId,
        version: 1,
        questionCount: setup.snapshot.questionCount,
        questionRefs: setup.refs ?? [setup.ref],
        markingSchemeVersion: setup.snapshot.scoringConfigVersion,
        status: 'published',
        publishedAt: TS,
        publishedBy: 'moderator-1',
        createdAt: TS,
        updatedAt: TS,
      });
    }
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

const asStudent = () => env.authenticatedContext('student-1').firestore();

/** Read a session back and normalize it (the lib's own
 * normalizer — the source of truth for stored fields). */
async function readSession(sessionId: string): Promise<JobMockSessionDoc> {
  const snap = await assertSucceeds(getDoc(doc(asStudent(), 'users', 'student-1', 'jobExamSessions', sessionId)));
  if (!snap.exists()) throw new Error(`session ${sessionId} missing`);
  return normalizeMockSessionDoc(snap.data() as Record<string, unknown>);
}

function millisOf(t: unknown): number | null {
  const v = t as { toMillis?: () => number; seconds?: number } | null;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number') return v.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return null;
}

/** The deadline write exactly as ensureMockDeadline does it:
 * endsAt built from the stored startedAt's own seconds +
 * nanoseconds (exact equality in the rules), never from
 * truncated millis. */
async function setDeadline(sessionId: string, timeMinutes: number): Promise<number> {
  const stored = await readSession(sessionId);
  const startedAt = stored.startedAt as Timestamp | null;
  if (!startedAt || typeof startedAt.seconds !== 'number') {
    throw new Error('stored startedAt is not a Timestamp');
  }
  const startedAtMillis = millisOf(startedAt);
  if (startedAtMillis === null) throw new Error('no startedAt millis');
  const endsAt = new Timestamp(startedAt.seconds + timeMinutes * 60, startedAt.nanoseconds);
  const deadlineMillis = startedAtMillis + timeMinutes * 60 * 1000;
  await assertSucceeds(updateDoc(
    doc(asStudent(), 'users', 'student-1', 'jobExamSessions', sessionId),
    buildMockDeadlineUpdate(stored.revision, endsAt, deadlineMillis),
  ));
  const after = await readSession(sessionId);
  if (millisOf(after.endsAt) !== deadlineMillis) {
    throw new Error('endsAt did not land on startedAt + duration');
  }
  return startedAtMillis;
}

/** Create a mock session + lock (ONE batch, lib builders). */
async function createSession(sessionId: string, setup: MockSetup): Promise<JobMockSessionDoc> {
  const db = asStudent();
  const session = createMockSession({
    sessionId,
    mockId: setup.mockId,
    bundleId: setup.bundleId,
    examSlug: setup.examSlug,
    definitionId: setup.definitionId,
    questionSetId: setup.questionSetId,
    bundleVersion: setup.bundle.bundleVersion,
    questionRefs: setup.refs ?? [setup.ref],
    timeMinutes: setup.snapshot.timeMinutes,
    clientNowMillis: Date.now(),
  });
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), session as unknown as Record<string, unknown>);
  batch.set(doc(db, 'jobExamUserLocks', examLockId('student-1', setup.examSlug)), buildExamLockDoc({
    uid: 'student-1',
    examSlug: setup.examSlug,
    mockId: setup.mockId,
    definitionId: setup.definitionId,
    activeSessionId: sessionId,
    durationSeconds: setup.snapshot.timeMinutes * 60,
  }) as unknown as Record<string, unknown>);
  await assertSucceeds(batch.commit());
  return session;
}

/** Abandon a session + release its lock (ONE batch). */
async function abandonSession(sessionId: string, setup: MockSetup): Promise<void> {
  const db = asStudent();
  const stored = await readSession(sessionId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), {
    status: 'abandoned',
    updatedAt: serverTimestamp(),
    revision: stored.revision + 1,
  });
  batch.update(doc(db, 'jobExamUserLocks', examLockId('student-1', setup.examSlug)), {
    status: 'terminal',
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
}

/** Run the full Design G submit flow with the lib builders,
 * answering `letter` (one letter, or one per question for a
 * multi-question mock) to every question. Returns the attempt doc
 * read back. */
async function runMockSubmitFlow(
  sessionId: string,
  letter: 'A' | 'B' | 'C' | 'D' | null | Array<'A' | 'B' | 'C' | 'D' | null>,
  setup: MockSetup,
): Promise<Record<string, unknown>> {
  const letters = (Array.isArray(letter) ? letter : [letter]) as Array<'A' | 'B' | 'C' | 'D' | null>;
  const db = asStudent();
  await createSession(sessionId, setup);
  const startedAtMillis = await setDeadline(sessionId, setup.snapshot.timeMinutes);
  // Autosave the answers (fresh-read first — the local session
  // lags the deadline write).
  const storedForAutosave = await readSession(sessionId);
  const answersMap: Record<number, { selected: 'A' | 'B' | 'C' | 'D' | null; markedForReview: boolean; timeSpentSeconds: number }> = {};
  letters.forEach((sel, i) => {
    answersMap[i + 1] = { selected: sel, markedForReview: false, timeSpentSeconds: 45 };
  });
  const answered: JobMockSessionDoc = {
    ...storedForAutosave,
    answers: answersMap,
  };
  await assertSucceeds(updateDoc(
    doc(db, 'users', 'student-1', 'jobExamSessions', sessionId),
    buildMockAutosavePatch(answered),
  ));
  // Design G step 2: session → submitted + lock → terminal,
  // ONE batch (fresh-read revision).
  const stored = await readSession(sessionId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), buildMockSessionSubmitUpdate(stored.revision));
  batch.update(doc(db, 'jobExamUserLocks', examLockId('student-1', setup.examSlug)), {
    status: 'terminal',
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  // Design G step 3: receipt — BEST-EFFORT, exactly like the
  // lib's submitMockAttempt. The receipt doc-ID is
  // {uid}_{bundleId}. Step 9 closure (open question 1): a retake
  // on the same bundle RE-ISSUES the receipt — the setDoc is an
  // UPDATE, allowed only as an anchored re-issue to the NEWLY
  // submitted session with a fresh createdAt — so the second
  // submit opens a NEW 10-minute window and the key read below
  // works on the retake. (Before the closure fix this create was
  // DENIED and a retake could never score after the first window
  // closed; see i9.)
  try {
    await setDoc(
      doc(db, 'jobReceipts', `student-1_${setup.bundleId}`),
      buildMockReceiptDoc('student-1', setup.bundleId, sessionId, setup.bundle.bundleVersion),
    );
  } catch {
    // Retake: the receipt already exists — proceed; the key
    // read uses whatever fresh receipt the rules accept.
  }
  // Step 4: key read (rules gate it on the fresh receipt).
  const keySnap = await assertSucceeds(getDoc(doc(db, 'jobQuestionKeys', setup.bundleId)));
  if (!keySnap.exists()) throw new Error('key doc missing');
  const key = keySnap.data() as JobQuestionKey;
  // Step 5–6: score + build + validate the attempt.
  const result: JobAttemptResult = scoreMockAttempt({
    bundle: setup.bundle,
    key,
    answers: setup.bundle.questions.map((q, i) => ({
      n: q.n, questionId: q.questionId, selected: letters[i] ?? null, timeSpentSeconds: 45,
    })),
    rulesSnapshot: setup.snapshot,
    examSlug: setup.examSlug,
    startedAtMillis,
    submittedAtMillis: Date.now(),
  });
  const attemptDoc = buildJobAttemptDoc({
    sessionId,
    session: stored,
    result,
    bundleId: setup.bundleId,
    examSlug: setup.examSlug,
    subjectId: null,
    topicId: null,
    kind: 'mock',
    mockId: setup.mockId,
    questionSetId: setup.questionSetId,
    bundleVersion: setup.bundle.bundleVersion,
    userId: 'student-1',
  });
  const problems = validateAttemptResult(attemptDoc);
  if (problems.length > 0) throw new Error(`lib validator rejected its own doc: ${problems.join('; ')}`);
  // Step 8: attempt create (same doc-ID as the session).
  await assertSucceeds(setDoc(
    doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId),
    attemptDoc as unknown as Record<string, unknown>,
  ));
  const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId)));
  return readBack.data() as Record<string, unknown>;
}

describe('Step 9 engine↔rules integration (lib builders → emulator)', () => {
  it('(i1) lib-built session + lock batch SUCCEEDS; abandon releases the lock', async () => {
    const db = asStudent();
    await createSession('sess-i1', BCS);
    const lock = await assertSucceeds(getDoc(doc(db, 'jobExamUserLocks', 'student-1_bcs')));
    if ((lock.data() as Record<string, unknown>).status !== 'in_progress') {
      throw new Error('lock not in_progress after create');
    }
    await abandonSession('sess-i1', BCS);
    const released = await assertSucceeds(getDoc(doc(db, 'jobExamUserLocks', 'student-1_bcs')));
    if ((released.data() as Record<string, unknown>).status !== 'terminal') {
      throw new Error('lock not terminal after abandon');
    }
  });

  it('(i2) lib-built deadline lands EXACTLY on startedAt + 120min', async () => {
    await createSession('sess-i2', BCS);
    const startedAtMillis = await setDeadline('sess-i2', 120);
    const stored = await readSession('sess-i2');
    const endsAtMillis = millisOf(stored.endsAt);
    if (endsAtMillis !== startedAtMillis + 120 * 60 * 1000) {
      throw new Error(`endsAt ${endsAtMillis} != startedAt + 120min`);
    }
    await abandonSession('sess-i2', BCS);
  });

  it('(i3) full flow, correct answer: score 1, attempt readable, labels practice/unverified', async () => {
    const data = await runMockSubmitFlow('sess-i3', 'B', BCS);
    if (data.score !== 1) throw new Error(`expected score 1, got ${String(data.score)}`);
    if (data.correctCount !== 1 || data.wrongCount !== 0) throw new Error('counts wrong');
    if (data.resultLabel !== 'practice' || data.trustLevel !== 'unverified') {
      throw new Error('result labels wrong');
    }
    if (data.submissionIntegrity !== 'client_calculated') throw new Error('submissionIntegrity wrong');
    if (data.questionSetId !== 'full__bcs__1_v1') throw new Error('questionSetId wrong');
    if (data.sessionId !== 'sess-i3') throw new Error('sessionId != doc-ID');
  });

  it('(i4) full flow, wrong answer: negative marking −0.50 (BCS)', async () => {
    const data = await runMockSubmitFlow('sess-i4', 'A', BCS);
    if (data.score !== -0.5) throw new Error(`expected score -0.5, got ${String(data.score)}`);
    if (data.negativeDeduction !== 0.5) throw new Error(`expected deduction 0.5, got ${String(data.negativeDeduction)}`);
    if (data.percentage !== -50) throw new Error(`expected percentage -50, got ${String(data.percentage)}`);
  });

  it('(i5) tampered attempt: lib validator AND rules both refuse', async () => {
    const db = asStudent();
    const sessionId = 'sess-i5';
    await createSession(sessionId, BCS);
    const startedAtMillis = await setDeadline(sessionId, 120);
    const stored = await readSession(sessionId);
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), buildMockSessionSubmitUpdate(stored.revision));
    batch.update(doc(db, 'jobExamUserLocks', 'student-1_bcs'), {
      status: 'terminal',
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    const result = scoreMockAttempt({
      bundle: BCS_BUNDLE,
      key: BCS_KEY,
      answers: [{ n: 1, questionId: 'q-seed-1', selected: 'B', timeSpentSeconds: 45 }],
      rulesSnapshot: BCS_SNAPSHOT,
      examSlug: 'bcs',
      startedAtMillis,
      submittedAtMillis: Date.now(),
    });
    const attemptDoc = buildJobAttemptDoc({
      sessionId,
      session: stored,
      result,
      bundleId: BCS_BUNDLE_ID,
      examSlug: 'bcs',
      subjectId: null,
      topicId: null,
      kind: 'mock',
      mockId: 'full__bcs__1',
      questionSetId: 'full__bcs__1_v1',
      bundleVersion: 1,
      userId: 'student-1',
    });
    // Tamper: claim a perfect score the answers do not support.
    (attemptDoc as Record<string, unknown>).score = 99;
    (attemptDoc as Record<string, unknown>).clientCalculatedScore = 99;
    const problems = validateAttemptResult(attemptDoc);
    if (problems.length === 0) throw new Error('lib validator ACCEPTED a tampered doc');
    await assertFails(setDoc(
      doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId),
      attemptDoc as unknown as Record<string, unknown>,
    ));
  });

  it('(i6) double submit DENIED (second setDoc = update)', async () => {
    const db = asStudent();
    await runMockSubmitFlow('sess-i6', 'B', BCS);
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-i6')));
    await assertFails(setDoc(
      doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-i6'),
      readBack.data() as Record<string, unknown>,
    ));
  });

  it('(i7) idempotent retry returns the STORED attempt (never a recomputation)', async () => {
    const db = asStudent();
    const first = await runMockSubmitFlow('sess-i7', 'B', BCS);
    // The retry path (submitMockAttempt step 7): read the existing
    // attempt first and rebuild the result from the STORED doc.
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-i7')));
    const recovered = jobAttemptResultFromStoredDoc(readBack.data());
    if (recovered === null) throw new Error('stored attempt did not rebuild');
    if (recovered.score !== 1 || recovered.correctCount !== 1) {
      throw new Error('recovered result differs from the stored attempt');
    }
    if (recovered.score !== first.score) throw new Error('retry result != first result');
  });

  it('(i8) Bank flow, wrong answer: negative marking DISABLED (score 0)', async () => {
    const data = await runMockSubmitFlow('sess-i8', 'A', BANK);
    if (data.score !== 0) throw new Error(`expected score 0, got ${String(data.score)}`);
    if (data.negativeDeduction !== 0) throw new Error(`expected deduction 0, got ${String(data.negativeDeduction)}`);
    if (data.negativeMarkingUsed !== 0) throw new Error(`expected penalty 0, got ${String(data.negativeMarkingUsed)}`);
    if (data.wrongCount !== 1) throw new Error('wrongCount wrong');
  });

  it('(i9) RETAKE on the same bundle: the second submit re-issues the receipt and scores', async () => {
    // First mock: full flow, correct answer.
    const first = await runMockSubmitFlow('sess-i9-a', 'B', BCS);
    if (first.score !== 1) throw new Error(`first mock score ${first.score}, expected 1`);
    // Retake: a NEW session on the same bundle. The receipt setDoc
    // inside the flow is now an ANCHORED RE-ISSUE (Step 9 closure,
    // open question 1) — it must SUCCEED, and the key read +
    // scoring must work on the new session.
    const second = await runMockSubmitFlow('sess-i9-b', 'B', BCS);
    if (second.score !== 1) throw new Error(`retake mock score ${second.score}, expected 1`);
    if (second.sessionId !== 'sess-i9-b') throw new Error('retake attempt is not the new session');
    // The receipt now anchors to the RETAKE session (not the first).
    const receipt = await assertSucceeds(getDoc(doc(asStudent(), 'jobReceipts', `student-1_${BCS.bundleId}`)));
    if ((receipt.data() as Record<string, unknown>).attemptId !== 'sess-i9-b') {
      throw new Error('receipt did not re-anchor to the retake session');
    }
  });

  it('(i10) REAL-CONTENT E2E: 3 verbatim BCS English questions score end-to-end', async () => {
    // Answers: Q1 C (correct), Q2 A (correct), Q3 B (wrong —
    // correct is D). BCS pattern: 2 − 0.50 = 1.5.
    const data = await runMockSubmitFlow('sess-i10', ['C', 'A', 'B'], REAL);
    if (data.score !== 1.5) throw new Error(`expected score 1.5, got ${String(data.score)}`);
    if (data.correctCount !== 2 || data.wrongCount !== 1) throw new Error('counts wrong');
    if (data.negativeDeduction !== 0.5) throw new Error('deduction wrong');
    if (data.resultLabel !== 'practice' || data.trustLevel !== 'unverified') {
      throw new Error('result labels wrong');
    }
    if (data.questionSetId !== 'full__bcs__e2e_v1') throw new Error('questionSetId wrong');
    if (data.sessionId !== 'sess-i10') throw new Error('sessionId != doc-ID');
    // weakTopics are NOT stored on the attempt — they are
    // re-derived from the stored answers (same derivation as the
    // scorer); rebuild the result from the stored doc first.
    const rebuilt = jobAttemptResultFromStoredDoc(data);
    if (rebuilt === null) throw new Error('stored attempt did not rebuild');
    if (rebuilt.score !== 1.5) throw new Error('rebuilt score wrong');
    const weak = rebuilt.weakTopics;
    if (weak.length !== 1 || weak[0].topicId !== 'bcs__english__grammar__tense' || weak[0].wrong !== 1 || weak[0].total !== 3) {
      throw new Error(`weak topics wrong: ${JSON.stringify(weak)}`);
    }
    const storedAnswers = data.answers as Array<{ questionId: string; selected: string | null; correct: boolean }>;
    if (storedAnswers.length !== 3) throw new Error('stored answers wrong');
    if (storedAnswers[0].questionId !== 'bcs-eng-001' || storedAnswers[0].correct !== true) throw new Error('Q1 answer wrong');
    if (storedAnswers[2].questionId !== 'bcs-eng-003' || storedAnswers[2].correct !== false) throw new Error('Q3 answer wrong');
  });
});
