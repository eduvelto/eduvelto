/**
 * Eduvelto Firestore security-rules tests — Job Preparation Step 8
 * (engine↔rules INTEGRATION: the lib builders produce docs the
 * rules accept, 22 Nov 2026).
 *
 * The rules tests (rules-step8-practice-engine.test.ts) build docs
 * by hand; the unit tests (jobEngine.test.ts) never touch
 * Firestore. This file closes the gap: it runs the REAL UI flow
 * through the emulator using the REAL lib functions —
 * createPracticeSession, answerSessionQuestion,
 * buildAutosavePatch, scorePracticeAttempt, buildJobAttemptDoc,
 * validateAttemptResult — against the REAL rules:
 *   session create → autosave → score → validate → session
 *   submitted FIRST → attempt create (same doc-ID) → read back.
 * A tampered attempt must fail the lib validator AND the rules.
 *
 * Seed: one Published 1-question topic bundle (bcs) + user docs.
 * No key doc is seeded — scoring takes the key as a JS object
 * (the UI reads it from Firestore; the read path is covered by
 * the Step 7 key tests q63–q72).
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
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  answerSessionQuestion,
  buildAutosavePatch,
  buildJobAttemptDoc,
  createPracticeSession,
  jobExamPattern,
  scorePracticeAttempt,
  validateAttemptResult,
  type JobPracticeSessionDoc,
} from '../src/lib/jobEngine';
import type { JobQuestionBundle, JobQuestionKey } from '../src/lib/jobQuestions';

const PROJECT_ID = 'eduvelto-rules-test-step8-integration';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobSessions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 8 jobSessions match.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
const OPTIONS = [
  { letter: 'A', text: 'দুটি স্বরের মিলন' },
  { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
  { letter: 'C', text: 'দুটি শব্দের মিলন' },
  { letter: 'D', text: 'দুটি বাক্যের মিলন' },
];

const BUNDLE_ID = 'topic__bcs__bangla__grammar__sandhi';
const BUNDLE: JobQuestionBundle = {
  kind: 'topic',
  examSlug: 'bcs',
  topicId: 'bcs__bangla__grammar__sandhi',
  mockId: null,
  titleBn: 'সন্ধি — অনুশীলন',
  titleEn: 'Sandhi — Practice',
  questions: [
    {
      n: 1,
      questionId: 'q-seed-1',
      topicId: 'bcs__bangla__grammar__sandhi',
      subjectId: 'bcs__bangla',
      questionText: 'সন্ধি কাকে বলে?',
      options: OPTIONS,
    },
  ],
  questionCount: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q-seed-1'],
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
};

const KEY: JobQuestionKey = {
  bundleId: BUNDLE_ID,
  answers: [
    {
      n: 1,
      questionId: 'q-seed-1',
      correctLetter: 'B',
      correctText: 'দুটি ধ্বনির মিলন',
      explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।',
    },
  ],
  configVersion: '2026-11-22.1',
  createdAt: TS,
  updatedAt: TS,
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
    await setDoc(doc(db, 'jobQuestionBundles', BUNDLE_ID), { ...BUNDLE });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES_TEXT, host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 60000);

afterAll(async () => {
  await env?.clearFirestore();
  await env?.cleanup();
});

const asStudent = () => env.authenticatedContext('student-1').firestore();

/** Run the full UI submit flow with the lib builders, answering
 * `letter` to question 1. Returns the attempt doc read back. */
async function runSubmitFlow(sessionId: string, letter: 'A' | 'B' | 'C' | 'D' | null) {
  const db = asStudent();
  const startedAtMillis = Date.now();
  const session: JobPracticeSessionDoc = createPracticeSession({
    sessionId,
    bundleId: BUNDLE_ID,
    examSlug: 'bcs',
    questionRefs: [{ bundleId: BUNDLE_ID, n: 1, questionId: 'q-seed-1' }],
  });
  await assertSucceeds(setDoc(doc(db, 'users', 'student-1', 'jobSessions', sessionId), session as unknown as Record<string, unknown>));
  const answered = answerSessionQuestion(session, 1, letter);
  await assertSucceeds(updateDoc(doc(db, 'users', 'student-1', 'jobSessions', sessionId), buildAutosavePatch(answered)));
  const pattern = jobExamPattern('bcs');
  if (!pattern) throw new Error('BCS pattern missing');
  const result = scorePracticeAttempt({
    bundle: BUNDLE,
    key: KEY,
    answers: [{ n: 1, questionId: 'q-seed-1', selected: letter, timeSpentSeconds: 45 }],
    pattern,
    startedAtMillis,
    submittedAtMillis: Date.now(),
  });
  const attemptDoc = buildJobAttemptDoc({
    sessionId,
    session: answered,
    result,
    bundleId: BUNDLE_ID,
    examSlug: 'bcs',
    subjectId: 'bcs__bangla',
    topicId: 'bcs__bangla__grammar__sandhi',
    kind: 'practice',
    userId: 'student-1',
  });
  const problems = validateAttemptResult(attemptDoc);
  if (problems.length > 0) throw new Error(`lib validator rejected its own doc: ${problems.join('; ')}`);
  await assertSucceeds(updateDoc(doc(db, 'users', 'student-1', 'jobSessions', sessionId), {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  await assertSucceeds(setDoc(doc(db, 'users', 'student-1', 'jobAttempts', sessionId), attemptDoc as unknown as Record<string, unknown>));
  const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobAttempts', sessionId)));
  return readBack.data() as Record<string, unknown>;
}

describe('Step 8 engine↔rules integration (lib builders → emulator)', () => {
  it('(i1) lib-built session create SUCCEEDS', async () => {
    const db = asStudent();
    const session = createPracticeSession({
      sessionId: 'sess-i1',
      bundleId: BUNDLE_ID,
      examSlug: 'bcs',
      questionRefs: [{ bundleId: BUNDLE_ID, n: 1, questionId: 'q-seed-1' }],
    });
    await assertSucceeds(setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-i1'), session as unknown as Record<string, unknown>));
  });

  it('(i2) lib-built autosave patch SUCCEEDS', async () => {
    const db = asStudent();
    const session = createPracticeSession({
      sessionId: 'sess-i2',
      bundleId: BUNDLE_ID,
      examSlug: 'bcs',
      questionRefs: [{ bundleId: BUNDLE_ID, n: 1, questionId: 'q-seed-1' }],
    });
    await assertSucceeds(setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-i2'), session as unknown as Record<string, unknown>));
    const answered = answerSessionQuestion(session, 1, 'B');
    await assertSucceeds(updateDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-i2'), buildAutosavePatch(answered)));
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-i2')));
    const data = readBack.data() as Record<string, unknown>;
    const answers = data.answers as Record<string, { selected: string | null }>;
    if (answers['1']?.selected !== 'B') throw new Error('autosaved answer did not persist');
  });

  it('(i3) full flow, correct answer: score 1, attempt readable', async () => {
    const data = await runSubmitFlow('sess-i3', 'B');
    if (data.score !== 1) throw new Error(`expected score 1, got ${String(data.score)}`);
    if (data.correctCount !== 1 || data.wrongCount !== 0) throw new Error('counts wrong');
    if (data.resultLabel !== 'practice' || data.trustLevel !== 'unverified') {
      throw new Error('result labels wrong');
    }
    if (data.sessionId !== 'sess-i3') throw new Error('sessionId != doc-ID');
  });

  it('(i4) full flow, wrong answer: negative marking −0.50 (BCS)', async () => {
    const data = await runSubmitFlow('sess-i4', 'A');
    if (data.score !== -0.5) throw new Error(`expected score -0.5, got ${String(data.score)}`);
    if (data.negativeDeduction !== 0.5) throw new Error(`expected deduction 0.5, got ${String(data.negativeDeduction)}`);
    if (data.percentage !== -50) throw new Error(`expected percentage -50, got ${String(data.percentage)}`);
  });

  it('(i5) tampered attempt: lib validator AND rules both refuse', async () => {
    const db = asStudent();
    const startedAtMillis = Date.now();
    const session: JobPracticeSessionDoc = createPracticeSession({
      sessionId: 'sess-i5',
      bundleId: BUNDLE_ID,
      examSlug: 'bcs',
      questionRefs: [{ bundleId: BUNDLE_ID, n: 1, questionId: 'q-seed-1' }],
    });
    await assertSucceeds(setDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-i5'), session as unknown as Record<string, unknown>));
    const pattern = jobExamPattern('bcs');
    if (!pattern) throw new Error('BCS pattern missing');
    const result = scorePracticeAttempt({
      bundle: BUNDLE,
      key: KEY,
      answers: [{ n: 1, questionId: 'q-seed-1', selected: 'B', timeSpentSeconds: 45 }],
      pattern,
      startedAtMillis,
      submittedAtMillis: Date.now(),
    });
    const attemptDoc = buildJobAttemptDoc({
      sessionId: 'sess-i5',
      session,
      result,
      bundleId: BUNDLE_ID,
      examSlug: 'bcs',
      subjectId: 'bcs__bangla',
      topicId: 'bcs__bangla__grammar__sandhi',
      kind: 'practice',
      userId: 'student-1',
    });
    // Tamper: claim a perfect score the answers do not support.
    (attemptDoc as Record<string, unknown>).score = 99;
    (attemptDoc as Record<string, unknown>).clientCalculatedScore = 99;
    const problems = validateAttemptResult(attemptDoc);
    if (problems.length === 0) throw new Error('lib validator ACCEPTED a tampered doc');
    await assertSucceeds(updateDoc(doc(db, 'users', 'student-1', 'jobSessions', 'sess-i5'), {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await assertFails(setDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-i5'), attemptDoc as unknown as Record<string, unknown>));
  });

  it('(i6) double submit DENIED (second setDoc = update)', async () => {
    const db = asStudent();
    await runSubmitFlow('sess-i6', 'B');
    const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-i6')));
    const data = readBack.data() as Record<string, unknown>;
    await assertFails(setDoc(doc(db, 'users', 'student-1', 'jobAttempts', 'sess-i6'), data));
  });
});
