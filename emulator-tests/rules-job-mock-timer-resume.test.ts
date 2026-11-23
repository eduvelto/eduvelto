/**
 * Eduvelto Firestore security-rules tests — Step 19 F7 (timed-mock
 * resume bug + session-submit deadline gate).
 *
 * TWO defects, one file:
 *  (A) DISPLAY (client): on resume the countdown showed the FULL
 *      duration (60-min mock, refresh at 20 min → displayed 60,
 *      true 40). Fixed in src/lib/mockTimer.ts (offset 0 on resume)
 *      + JobMockPage.enterExam — unit-tested in
 *      src/lib/__tests__/mockTimer.test.ts. THIS file proves the
 *      server side of the same scenario: the STORED deadline is
 *      restored on resume (ensureMockDeadline semantics) and the
 *      helper math on it gives 40 min, while the OLD formula would
 *      give exactly 60 min.
 *  (B) SERVER (rules): the session in-progress → submitted
 *      transition was NOT deadline-checked, so a late client could
 *      flip the session with no attempt created (orphan). Fixed in
 *      firestore.rules (validJobExamSessionUpdate, F7 23 Nov 2026):
 *      the submit is allowed only while `request.time <` the stored
 *      endsAt (STRICT `<`), folded into the answers clause.
 *      Boundary: session gate strict `< endsAt`, matching the
 *      answer-write gate in the same function; M1-b uses
 *      `submittedAt <= endsAt` on the attempt's server timestamp
 *      (different quantity — in the batched submit the session gate
 *      binds first, so the effective boundary for the whole submit
 *      is strict `<`). NU `request.time <= deadlineAt` is a
 *      different system and deliberately NOT aligned.
 *
 * B'S 11 CASES (60-min mock, started 10:00, endsAt 11:00) — each
 * mapped to a test below (exact clock times are approximated: the
 * emulator's request.time is the host clock, so "10:59" is "endsAt
 * minutes in the future" and "11:05" is "endsAt minutes in the
 * past"; the exact-equality boundary, request.time == endsAt, is
 * NOT hittable to the millisecond in the emulator and is recorded
 * as boundary-by-code, not by test):
 *   1. Submit 10:59 → session ALLOWED, attempt ALLOWED (f7-e2).
 *   2. Submit exactly 11:00:00 → session DENIED (strict <); no
 *      orphan (f7-e3; exact-equality itself OWED — see above).
 *   3. Submit 11:00:01 → DENIED at session; attempt would also
 *      fail M1-b (f7-e3).
 *   4. Autosave answer change 10:30 ALLOWED; 11:05 DENIED (f7-e4).
 *   5. Autosave NO answer change 11:05 ALLOWED (f7-e5).
 *   6. Abandon 11:05 ALLOWED (f7-e6).
 *   7. endsAt-setting update (null → exact) ALLOWED (f7-e7).
 *   8. Orphan recovery → attempt create ALLOWED, M1-b only (f7-e8).
 *   9. Submit with endsAt null → session flip ALLOWED (documented
 *      residual); attempt DENIED by M1-b (f7-e9).
 *  10. Double submit (second batch) → DENIED by revision + 1 (f7-e10).
 *  11. Clock games irrelevant (server timestamps) — clock back at
 *      11:05 real → server 11:05 → DENIED; clock forward at 10:30
 *      real → server 10:30 → ALLOWED (f7-e11; the device-clock half
 *      is OWED — the emulator cannot move the device clock).
 *
 * KNOWN GAP FOUND BY PROBE (23 Nov, emulator-verified, NOT fixed
 * in F7): a HAND-CRAFTED attempt create with a literal past
 * submittedAt (1 min before endsAt) on an already-submitted
 * expired session SUCCEEDS — M1-b checks `submittedAt <=
 * sessAfter.endsAt` and `submittedAt <= request.time`, and a
 * backdated literal satisfies both; nothing binds the attempt's
 * submittedAt to the session's server submittedAt. The REAL app
 * flow cannot exploit this (buildJobAttemptDoc always sets
 * submittedAt: serverTimestamp()), and a late session can no
 * longer become submitted via the client (case 3), so the hole
 * needs a hand-crafted write against a session that was submitted
 * on time. Recorded here as test f7-e11c asserting CURRENT
 * behavior — hardening (bind attempt.submittedAt to the session's
 * submittedAt) is a follow-up, not F7 scope.
 *
 * HONEST LIMITS (emulator ≠ production): emulator `request.time`
 * runs against the emulator/host clock; offline-persistence /
 * disconnect-reconnect choreography and real device-clock changes
 * are NOT provable here — the rules-denial halves are tested, the
 * choreography halves are OWED (see the completion report).
 *
 * Seed: one Published 1-question BCS full mock, 60 MINUTES (the
 * F7 scenario), with definition + manifest + bundle + key.
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
  scoreMockAttempt,
  type JobAttemptResult,
  type JobMockSessionDoc,
} from '../src/lib/jobEngine';
import {
  buildExamLockDoc,
  buildMockReceiptDoc,
  examLockId,
  normalizeMockSessionDoc,
} from '../src/lib/jobMock';
import {
  computeRemainingMillis,
  resolveExamClockOffsetMillis,
} from '../src/lib/mockTimer';
import type { JobQuestionBundle, JobQuestionKey, JobQuestionOption } from '../src/lib/jobQuestions';

const PROJECT_ID = 'eduvelto-rules-test-f7-timer-resume';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('jobExamSessions')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not contain the Step 9 jobExamSessions match.`);
}

const TS = new Date('2026-11-22T08:00:00.000Z');
const MIN = 60 * 1000;
const OPTIONS: JobQuestionOption[] = [
  { letter: 'A', text: 'দুটি স্বরের মিলন' },
  { letter: 'B', text: 'দুটি ধ্বনির মিলন' },
  { letter: 'C', text: 'দুটি শব্দের মিলন' },
  { letter: 'D', text: 'দুটি বাক্যের মিলন' },
];

const BUNDLE_ID = 'mock__full__bcs__f7';
const BUNDLE: JobQuestionBundle = {
  kind: 'mock',
  examSlug: 'bcs',
  topicId: null,
  mockId: 'full__bcs__f7',
  titleBn: 'বিসিএস পূর্ণ মক ১',
  titleEn: 'BCS Full Mock 1',
  questions: [
    {
      n: 1, questionId: 'q-f7-1', topicId: 'bcs__bangla__grammar__sandhi',
      subjectId: 'bcs__bangla', questionText: 'সন্ধি কাকে বলে?',
      options: OPTIONS, difficulty: 'easy',
    },
  ],
  questionCount: 1,
  bundleVersion: 1,
  status: 'published',
  reviewStatus: 'Published',
  sourceQuestionIds: ['q-f7-1'],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};
const KEY: JobQuestionKey = {
  bundleId: BUNDLE_ID,
  answers: [
    {
      n: 1, questionId: 'q-f7-1', correctLetter: 'B',
      correctText: 'দুটি ধ্বনির মিলন',
      explanation: 'সন্ধি হলো দুটি ধ্বনির মিলন।', whyWrong: null,
    },
  ],
  configVersion: '1',
  createdAt: TS,
  updatedAt: TS,
};
const SNAPSHOT = {
  questionCount: 1, timeMinutes: 60, marksPerQuestion: 1,
  negativeMarking: 0.5, negativeMarkingVerified: true,
  passPercent: null, scoringConfigVersion: 'v1',
};
const SETUP = {
  examSlug: 'bcs',
  mockId: 'full__bcs__f7',
  bundleId: BUNDLE_ID,
  definitionId: 'full__bcs__f7',
  questionSetId: 'full__bcs__f7_v1',
  bundle: BUNDLE,
  key: KEY,
  snapshot: SNAPSHOT,
  ref: { bundleId: BUNDLE_ID, n: 1, questionId: 'q-f7-1' },
};

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const uid of ['student-1', 'student-2']) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid, email: `${uid}@example.com`,
        role: 'student', language: 'bn', isActive: true,
      });
    }
    await setDoc(doc(db, 'jobQuestionBundles', BUNDLE_ID), { ...BUNDLE });
    await setDoc(doc(db, 'jobQuestionKeys', BUNDLE_ID), { ...KEY });
    await setDoc(doc(db, 'jobExamDefinitions', SETUP.definitionId), {
      examSlug: 'bcs', titleBn: BUNDLE.titleBn, titleEn: BUNDLE.titleEn,
      kind: 'full', bundleId: BUNDLE_ID, questionSetId: SETUP.questionSetId,
      rulesSnapshot: { ...SNAPSHOT }, scheduleDate: null, examSlugCycle: null,
      status: 'published', retakeAllowed: true, maxAttempts: null,
      publishedAt: TS, publishedBy: 'moderator-1', createdAt: TS, updatedAt: TS,
    });
    await setDoc(doc(db, 'jobQuestionSetManifests', SETUP.questionSetId), {
      examSlug: 'bcs', mockId: 'full__bcs__f7', version: 1, questionCount: 1,
      questionRefs: [SETUP.ref],
      markingSchemeVersion: 'v1', status: 'published',
      publishedAt: TS, publishedBy: 'moderator-1', createdAt: TS, updatedAt: TS,
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

const asStudent = (uid = 'student-1') => env.authenticatedContext(uid).firestore();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function millisOf(t: unknown): number | null {
  const v = t as { toMillis?: () => number; seconds?: number } | null;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number') return v.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return null;
}

async function readSession(sessionId: string, uid = 'student-1'): Promise<JobMockSessionDoc> {
  const snap = await assertSucceeds(getDoc(doc(asStudent(uid), 'users', uid, 'jobExamSessions', sessionId)));
  if (!snap.exists()) throw new Error(`session ${sessionId} missing`);
  return normalizeMockSessionDoc(snap.data() as Record<string, unknown>);
}

/** Create a mock session + lock (ONE batch, lib builders). */
async function createSession(sessionId: string): Promise<JobMockSessionDoc> {
  const db = asStudent();
  const session = createMockSession({
    sessionId,
    mockId: SETUP.mockId,
    bundleId: SETUP.bundleId,
    examSlug: SETUP.examSlug,
    definitionId: SETUP.definitionId,
    questionSetId: SETUP.questionSetId,
    bundleVersion: SETUP.bundle.bundleVersion,
    questionRefs: [SETUP.ref],
    timeMinutes: SETUP.snapshot.timeMinutes,
    clientNowMillis: Date.now(),
  });
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), session as unknown as Record<string, unknown>);
  batch.set(doc(db, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), buildExamLockDoc({
    uid: 'student-1',
    examSlug: SETUP.examSlug,
    mockId: SETUP.mockId,
    definitionId: SETUP.definitionId,
    activeSessionId: sessionId,
    durationSeconds: SETUP.snapshot.timeMinutes * 60,
  }) as unknown as Record<string, unknown>);
  await assertSucceeds(batch.commit());
  return session;
}

/** The deadline write exactly as ensureMockDeadline does it. */
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

/**
 * Seed a session directly (rules disabled) with a PAST start, so
 * the test controls the elapsed time exactly. Session create via
 * the rules requires startedAt == request.time, so a 20-min-old
 * session cannot be created through the front door. The doc shape
 * mirrors createMockSession, with explicit Timestamps.
 */
async function seedPastSession(
  sessionId: string,
  startedAgoMillis: number,
  opts: { status?: 'in-progress' | 'submitted'; submittedAtMillis?: number } = {},
): Promise<{ startedAtMillis: number; endsAtMillis: number }> {
  const now = Date.now();
  const startedAtMillis = now - startedAgoMillis;
  const endsAtMillis = startedAtMillis + 60 * MIN;
  const status = opts.status ?? 'in-progress';
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), {
      kind: 'mock', mockId: SETUP.mockId, bundleId: SETUP.bundleId,
      examSlug: SETUP.examSlug, definitionId: SETUP.definitionId,
      questionSetId: SETUP.questionSetId, bundleVersion: 1,
      status,
      startedAt: Timestamp.fromMillis(startedAtMillis),
      endsAt: Timestamp.fromMillis(endsAtMillis),
      questionRefs: [SETUP.ref],
      answers: { 1: { selected: null, markedForReview: false, timeSpentSeconds: 0 } },
      currentQuestion: 1,
      lastSyncedAt: Timestamp.fromMillis(startedAtMillis),
      clientEndsAtMillis: endsAtMillis,
      submittedAt: status === 'submitted'
        ? Timestamp.fromMillis(opts.submittedAtMillis ?? now)
        : null,
      createdAt: Timestamp.fromMillis(startedAtMillis),
      updatedAt: Timestamp.fromMillis(now),
      revision: status === 'submitted' ? 2 : 1,
    });
  });
  return { startedAtMillis, endsAtMillis };
}

/** Standalone session → submitted update (no lock batch — the
 * past-seeded sessions have no lock doc, and the transition is
 * what is under test). Returns the promise for assertSucceeds /
 * assertFails at the call site. */
async function submitSessionStandalone(sessionId: string) {
  const stored = await readSession(sessionId);
  return updateDoc(
    doc(asStudent(), 'users', 'student-1', 'jobExamSessions', sessionId),
    buildMockSessionSubmitUpdate(stored.revision),
  );
}

/** Standalone abandon update (same shape as the lib's abandon). */
async function abandonSessionStandalone(sessionId: string) {
  const stored = await readSession(sessionId);
  return updateDoc(
    doc(asStudent(), 'users', 'student-1', 'jobExamSessions', sessionId),
    { status: 'abandoned', updatedAt: serverTimestamp(), revision: stored.revision + 1 },
  );
}

/**
 * Abandon a session AND release its lock (ONE batch, exactly like
 * the Step 9 integration test's abandonSession). REQUIRED hygiene
 * in this file: the lock rules never let a LIVE in_progress lock
 * be re-armed for a new session — a later createSession in the
 * same file is DENIED while an earlier session's lock is still
 * live. Every test that leaves an in-progress session + live lock
 * must call this (or releaseLock, when the session is already
 * submitted) before the next createSession.
 */
async function abandonSessionWithLock(sessionId: string): Promise<void> {
  const db = asStudent();
  const stored = await readSession(sessionId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), {
    status: 'abandoned',
    updatedAt: serverTimestamp(),
    revision: stored.revision + 1,
  });
  batch.update(doc(db, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), {
    status: 'terminal',
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
}

/**
 * Release the lock on its own (in_progress → terminal). Allowed
 * ONLY when the lock's session is already submitted/abandoned
 * (the rules check the stored session) — use
 * abandonSessionWithLock for sessions still in progress.
 */
async function releaseLock(): Promise<void> {
  await assertSucceeds(updateDoc(
    doc(asStudent(), 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)),
    { status: 'terminal', updatedAt: serverTimestamp() },
  ));
}

function scoreAndBuildAttempt(
  sessionId: string,
  session: JobMockSessionDoc,
  startedAtMillis: number,
): Record<string, unknown> {
  const result: JobAttemptResult = scoreMockAttempt({
    bundle: BUNDLE, key: KEY,
    answers: [{ n: 1, questionId: 'q-f7-1', selected: 'B', timeSpentSeconds: 45 }],
    rulesSnapshot: SNAPSHOT, examSlug: 'bcs',
    startedAtMillis, submittedAtMillis: Date.now(),
  });
  return buildJobAttemptDoc({
    sessionId, session, result, bundleId: BUNDLE_ID, examSlug: 'bcs',
    subjectId: null, topicId: null, kind: 'mock', mockId: SETUP.mockId,
    questionSetId: SETUP.questionSetId, bundleVersion: 1, userId: 'student-1',
  }) as Record<string, unknown>;
}

async function attemptExists(sessionId: string): Promise<boolean> {
  const snap = await assertSucceeds(getDoc(doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', sessionId)));
  return snap.exists();
}

/** Full Design G submit flow (lib builders, mirrors the Step 9
 * integration test): session + lock → deadline → autosave →
 * session submitted + lock terminal (ONE batch) → receipt →
 * key read → score → attempt create (same doc-ID) → read back. */
async function runF7SubmitFlow(sessionId: string): Promise<Record<string, unknown>> {
  const db = asStudent();
  await createSession(sessionId);
  const startedAtMillis = await setDeadline(sessionId, 60);
  const storedForAutosave = await readSession(sessionId);
  const answered: JobMockSessionDoc = {
    ...storedForAutosave,
    answers: { 1: { selected: 'B', markedForReview: false, timeSpentSeconds: 45 } },
  };
  await assertSucceeds(updateDoc(
    doc(db, 'users', 'student-1', 'jobExamSessions', sessionId),
    buildMockAutosavePatch(answered),
  ));
  const stored = await readSession(sessionId);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', sessionId), buildMockSessionSubmitUpdate(stored.revision));
  batch.update(doc(db, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), {
    status: 'terminal', updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  try {
    await setDoc(
      doc(db, 'jobReceipts', `student-1_${SETUP.bundleId}`),
      buildMockReceiptDoc('student-1', SETUP.bundleId, sessionId, SETUP.bundle.bundleVersion),
    );
  } catch {
    // Retake: receipt already exists — proceed.
  }
  const keySnap = await assertSucceeds(getDoc(doc(db, 'jobQuestionKeys', SETUP.bundleId)));
  if (!keySnap.exists()) throw new Error('key doc missing');
  const attemptDoc = scoreAndBuildAttempt(sessionId, stored, startedAtMillis);
  await assertSucceeds(setDoc(
    doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId),
    attemptDoc,
  ));
  const readBack = await assertSucceeds(getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', sessionId)));
  return readBack.data() as Record<string, unknown>;
}

describe('F7 timed-mock resume + session-submit deadline gate', () => {
  it('(f7-e1) RESUME: 60-min mock, refresh at 20 min → stored deadline restores, remaining ≈40 min (NOT 60)', async () => {
    const { startedAtMillis, endsAtMillis } = await seedPastSession('sess-f7-e1a', 20 * MIN);
    // ensureMockDeadline semantics: when endsAt is stored, it is
    // returned as-is (never recomputed from startedAt + duration
    // on the client — the read-back IS the deadline).
    const stored = await readSession('sess-f7-e1a');
    const storedEndsAt = millisOf(stored.endsAt);
    if (storedEndsAt !== endsAtMillis) throw new Error('stored endsAt is not startedAt + 60min');
    if (storedEndsAt !== startedAtMillis + 60 * MIN) throw new Error('stored deadline is not exact');
    // The display math on the restored deadline (offset 0 on resume).
    const now = Date.now();
    const offset = resolveExamClockOffsetMillis({ startedAtMillis, nowMillis: now, isResume: true });
    if (offset !== 0) throw new Error(`resume offset ${offset}, expected 0`);
    const remaining = computeRemainingMillis(storedEndsAt, now, offset);
    if (remaining === null) throw new Error('remaining is null with a stored deadline');
    // Elapsed is 20 min + the seconds this test took to read back;
    // remaining is 40 min minus that overhead — strictly inside
    // (39, 40] min, never near 60.
    if (!(remaining > 39 * MIN && remaining <= 40 * MIN)) {
      throw new Error(`remaining ${remaining}ms is not ≈40 min`);
    }
    // BEFORE (the bug): the old formula derived the offset from the
    // historical startedAt, so the same stored deadline displayed
    // the FULL duration — exactly 60 min, by construction.
    const buggyOffset = startedAtMillis - now;
    const buggyRemaining = computeRemainingMillis(storedEndsAt, now, buggyOffset);
    if (buggyRemaining !== 60 * MIN) throw new Error(`buggy math gave ${buggyRemaining}, expected exactly 60 min`);
  });

  it('(f7-e1b) RESUME at 45 min → ≈15 min remaining, NOT 60 (ChatGPT item 2)', async () => {
    const { startedAtMillis, endsAtMillis } = await seedPastSession('sess-f7-e1b', 45 * MIN);
    const stored = await readSession('sess-f7-e1b');
    if (millisOf(stored.endsAt) !== endsAtMillis) throw new Error('stored endsAt wrong');
    const now = Date.now();
    const offset = resolveExamClockOffsetMillis({ startedAtMillis, nowMillis: now, isResume: true });
    const remaining = computeRemainingMillis(endsAtMillis, now, offset);
    if (remaining === null || !(remaining > 14 * MIN && remaining <= 15 * MIN)) {
      throw new Error(`remaining ${remaining}ms is not ≈15 min`);
    }
    const buggyRemaining = computeRemainingMillis(endsAtMillis, now, startedAtMillis - now);
    if (buggyRemaining !== 60 * MIN) throw new Error(`buggy math gave ${buggyRemaining}, expected exactly 60 min`);
  });

  it('(f7-e2) B case 1: submit BEFORE the deadline → session ALLOWED, attempt ALLOWED', async () => {
    const data = await runF7SubmitFlow('sess-f7-e2');
    if (data.score !== 1) throw new Error(`expected score 1, got ${String(data.score)}`);
    if (data.sessionId !== 'sess-f7-e2') throw new Error('attempt is not the submitted session');
    const session = await readSession('sess-f7-e2');
    if (session.status !== 'submitted') throw new Error('session is not submitted');
  });

  it('(f7-e3) B cases 2–3: submit AFTER the deadline → session DENIED, attempt DENIED, NO orphan', async () => {
    // Expired 10 min ago (started 70 min ago, 60-min mock).
    await seedPastSession('sess-f7-e3', 70 * MIN);
    // Session transition after endsAt: DENIED (strict < endsAt).
    await assertFails(submitSessionStandalone('sess-f7-e3'));
    // The session is still in-progress — NOT flipped to submitted.
    const session = await readSession('sess-f7-e3');
    if (session.status !== 'in-progress') {
      throw new Error(`session status ${session.status}, expected in-progress (late flip must fail)`);
    }
    // And the attempt create is denied too (session not submitted,
    // and M1-b would fail on the server timestamp as well).
    const stored = await readSession('sess-f7-e3');
    const attemptDoc = scoreAndBuildAttempt('sess-f7-e3', stored, millisOf(stored.startedAt) ?? Date.now());
    await assertFails(setDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e3'),
      attemptDoc,
    ));
    if (await attemptExists('sess-f7-e3')) throw new Error('late attempt doc exists');
    // NOTE (B case 2): the exact-equality boundary (request.time ==
    // endsAt) is NOT hittable to the millisecond in the emulator —
    // the strict `<` is proven by code + B's report, and by this
    // test's "just after endsAt" denial paired with f7-e2's
    // "before endsAt" allowance.
  });

  it('(f7-e4) B case 4: autosave answer change BEFORE deadline ALLOWED, AFTER deadline DENIED', async () => {
    // Before: fresh session, answer change succeeds.
    await createSession('sess-f7-e4a');
    await setDeadline('sess-f7-e4a', 60);
    const fresh = await readSession('sess-f7-e4a');
    const changedFresh: JobMockSessionDoc = {
      ...fresh,
      answers: { 1: { selected: 'A', markedForReview: false, timeSpentSeconds: 30 } },
    };
    await assertSucceeds(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e4a'),
      buildMockAutosavePatch(changedFresh),
    ));
    // After: expired session, same answer change is denied.
    await seedPastSession('sess-f7-e4b', 70 * MIN);
    const expired = await readSession('sess-f7-e4b');
    const changedExpired: JobMockSessionDoc = {
      ...expired,
      answers: { 1: { selected: 'A', markedForReview: false, timeSpentSeconds: 30 } },
    };
    await assertFails(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e4b'),
      buildMockAutosavePatch(changedExpired),
    ));
    // The stored answers are unchanged by the denied write.
    const after = await readSession('sess-f7-e4b');
    const storedAnswers = after.answers as unknown as Record<string, { selected: string | null }>;
    if (storedAnswers['1']?.selected !== null) throw new Error('denied autosave still changed the stored answer');
    // Lock hygiene: the fresh session's lock is still live — release
    // it so later tests can create sessions.
    await abandonSessionWithLock('sess-f7-e4a');
  });

  it('(f7-e5) B case 5: autosave with NO answer change AFTER deadline ALLOWED', async () => {
    await seedPastSession('sess-f7-e5', 70 * MIN);
    const stored = await readSession('sess-f7-e5');
    // Same answers, only sync timestamps + revision move.
    await assertSucceeds(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e5'),
      buildMockAutosavePatch(stored),
    ));
  });

  it('(f7-e6) B case 6: abandon AFTER deadline ALLOWED', async () => {
    await seedPastSession('sess-f7-e6', 70 * MIN);
    await assertSucceeds(abandonSessionStandalone('sess-f7-e6'));
    const after = await readSession('sess-f7-e6');
    if (after.status !== 'abandoned') throw new Error('abandon did not land');
  });

  it('(f7-e7a) B case 7: endsAt-setting (null → exact startedAt + duration) ALLOWED', async () => {
    await createSession('sess-f7-e7a');
    await setDeadline('sess-f7-e7a', 60);
    await abandonSessionWithLock('sess-f7-e7a');
  });

  it('(f7-e7b) ChatGPT item 12: client cannot move the deadline — longer or shorter endsAt DENIED', async () => {
    await createSession('sess-f7-e7b');
    const storedB = await readSession('sess-f7-e7b');
    const startedB = storedB.startedAt as Timestamp;
    const startedBMillis = millisOf(startedB);
    if (startedBMillis === null) throw new Error('no startedAt millis');
    // Longer (startedAt + 120 min): denied — not exact.
    await assertFails(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e7b'),
      buildMockDeadlineUpdate(storedB.revision, new Timestamp(startedB.seconds + 120 * 60, startedB.nanoseconds), startedBMillis + 120 * MIN),
    ));
    // Shorter (startedAt + 30 min): denied — not exact.
    await assertFails(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e7b'),
      buildMockDeadlineUpdate(storedB.revision, new Timestamp(startedB.seconds + 30 * 60, startedB.nanoseconds), startedBMillis + 30 * MIN),
    ));
    // endsAt is still null after the denied writes.
    const after = await readSession('sess-f7-e7b');
    if (after.endsAt !== null) throw new Error('denied deadline write still moved endsAt');
    await abandonSessionWithLock('sess-f7-e7b');
  });

  it('(f7-e7c) ChatGPT item 12 (continued): second endsAt set to a DIFFERENT value DENIED; startedAt immutable', async () => {
    await createSession('sess-f7-e7c');
    await setDeadline('sess-f7-e7c', 60);
    const storedA = await readSession('sess-f7-e7c');
    const startedA = storedA.startedAt as Timestamp;
    const startedAMillis = millisOf(startedA);
    if (startedAMillis === null) throw new Error('no startedAt millis');
    // Second set to a DIFFERENT value (startedAt + 61 min): denied
    // — endsAt moves once. (Re-setting the IDENTICAL value is an
    // idempotent no-op the rules allow; only a changed value is
    // the attack, and it is denied.)
    await assertFails(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e7c'),
      buildMockDeadlineUpdate(storedA.revision, new Timestamp(startedA.seconds + 61 * 60, startedA.nanoseconds), startedAMillis + 61 * MIN),
    ));
    // startedAt itself is immutable (not in affectedKeys): denied.
    await assertFails(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e7c'),
      { startedAt: Timestamp.fromMillis(Date.now()), updatedAt: serverTimestamp(), revision: storedA.revision + 1 },
    ));
    await abandonSessionWithLock('sess-f7-e7c');
  });

  it('(f7-e8) B case 8: orphan recovery — session submitted on time + attempt missing → attempt create ALLOWED (M1-b only)', async () => {
    await createSession('sess-f7-e8');
    const startedAtMillis = await setDeadline('sess-f7-e8', 60);
    const stored = await readSession('sess-f7-e8');
    // Session submit only (no attempt yet — the "orphan" state).
    const db8 = asStudent();
    const batch = writeBatch(db8);
    batch.update(doc(db8, 'users', 'student-1', 'jobExamSessions', 'sess-f7-e8'), buildMockSessionSubmitUpdate(stored.revision));
    batch.update(doc(db8, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), {
      status: 'terminal', updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    if (await attemptExists('sess-f7-e8')) throw new Error('attempt already exists before recovery');
    // Recovery: the attempt create now succeeds on M1-b alone.
    const fresh = await readSession('sess-f7-e8');
    const attemptDoc = scoreAndBuildAttempt('sess-f7-e8', fresh, startedAtMillis);
    await assertSucceeds(setDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e8'),
      attemptDoc,
    ));
    const readBack = await assertSucceeds(getDoc(doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e8')));
    if ((readBack.data() as Record<string, unknown>).score !== 1) throw new Error('recovered attempt score wrong');
  });

  it('(f7-e9) B case 9: submit with endsAt NULL → session flip ALLOWED (documented residual); attempt DENIED by M1-b', async () => {
    await createSession('sess-f7-e9');
    // No deadline set — endsAt is still null.
    const before = await readSession('sess-f7-e9');
    if (before.endsAt !== null) throw new Error('endsAt is not null before the test');
    // Session flip is allowed (second disjunct: endsAt == null).
    await assertSucceeds(submitSessionStandalone('sess-f7-e9'));
    const after = await readSession('sess-f7-e9');
    if (after.status !== 'submitted') throw new Error('session flip did not land');
    // But the attempt create is denied: endsAt null makes the
    // M1-b comparison error, so no late attempt can ever exist.
    const attemptDoc = scoreAndBuildAttempt('sess-f7-e9', after, millisOf(after.startedAt) ?? Date.now());
    await assertFails(setDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e9'),
      attemptDoc,
    ));
    if (await attemptExists('sess-f7-e9')) throw new Error('attempt exists for a null-deadline session');
    // Lock hygiene: the standalone submit left the lock live (the
    // session is submitted, so a standalone release is allowed).
    await releaseLock();
  });

  it('(f7-e10) B case 10 + double-submit: two concurrent submits → exactly ONE attempt doc', async () => {
    // (a) Two concurrent session-submit batches → exactly one wins
    // (revision + 1); the loser fails the revision check (or the
    // in-progress match once the winner has flipped the status).
    await createSession('sess-f7-e10a');
    await setDeadline('sess-f7-e10a', 60);
    const submitOnce = async () => {
      const stored = await readSession('sess-f7-e10a');
      return updateDoc(
        doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e10a'),
        buildMockSessionSubmitUpdate(stored.revision),
      );
    };
    const batchResults = await Promise.allSettled([submitOnce(), submitOnce()]);
    const batchWins = batchResults.filter((r) => r.status === 'fulfilled').length;
    if (batchWins !== 1) throw new Error(`expected exactly 1 session-submit winner, got ${batchWins}`);
    const sessionA = await readSession('sess-f7-e10a');
    if (sessionA.status !== 'submitted') throw new Error('session not submitted after the race');
    // Lock hygiene: the standalone submit left the lock live (the
    // session is submitted, so a standalone release is allowed).
    await releaseLock();

    // (b) Two concurrent attempt creates → exactly one wins
    // (allow update: false); exactly one doc exists.
    await createSession('sess-f7-e10b');
    const startedB = await setDeadline('sess-f7-e10b', 60);
    const storedB = await readSession('sess-f7-e10b');
    const dbB = asStudent();
    const batchB = writeBatch(dbB);
    batchB.update(doc(dbB, 'users', 'student-1', 'jobExamSessions', 'sess-f7-e10b'), buildMockSessionSubmitUpdate(storedB.revision));
    batchB.update(doc(dbB, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), {
      status: 'terminal', updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batchB.commit());
    const freshB = await readSession('sess-f7-e10b');
    const attemptB = scoreAndBuildAttempt('sess-f7-e10b', freshB, startedB);
    const createResults = await Promise.allSettled([
      setDoc(doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e10b'), attemptB),
      setDoc(doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e10b'), attemptB),
    ]);
    const createWins = createResults.filter((r) => r.status === 'fulfilled').length;
    if (createWins !== 1) throw new Error(`expected exactly 1 attempt-create winner, got ${createWins}`);
    if (!(await attemptExists('sess-f7-e10b'))) throw new Error('attempt missing after the race');
    const readB = await assertSucceeds(getDoc(doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e10b')));
    if ((readB.data() as Record<string, unknown>).score !== 1) throw new Error('raced attempt score wrong');

    // (c) Full-flow race: two concurrent Design G submits on one
    // session. Each loser falls back to reading the stored attempt
    // (the lib's step-7 recovery). Both callers must resolve to
    // the SAME single attempt.
    await createSession('sess-f7-e10c');
    const startedC = await setDeadline('sess-f7-e10c', 60);
    const fullSubmit = async (): Promise<{ wonSession: boolean; wonAttempt: boolean; attempt: Record<string, unknown> | null }> => {
      const db = asStudent();
      let wonSession = false;
      try {
        const stored = await readSession('sess-f7-e10c');
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-f7-e10c'), buildMockSessionSubmitUpdate(stored.revision));
        batch.update(doc(db, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), {
          status: 'terminal', updatedAt: serverTimestamp(),
        });
        await batch.commit();
        wonSession = true;
      } catch {
        // Lost the session race — recover below.
      }
      try {
        await setDoc(
          doc(db, 'jobReceipts', `student-1_${SETUP.bundleId}`),
          buildMockReceiptDoc('student-1', SETUP.bundleId, 'sess-f7-e10c', SETUP.bundle.bundleVersion),
        );
      } catch {
        // Receipt already exists — proceed.
      }
      let wonAttempt = false;
      try {
        const keySnap = await getDoc(doc(db, 'jobQuestionKeys', SETUP.bundleId));
        if (!keySnap.exists()) throw new Error('key missing');
        const stored = await readSession('sess-f7-e10c');
        const attemptDoc = scoreAndBuildAttempt('sess-f7-e10c', stored, startedC);
        await setDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e10c'), attemptDoc);
        wonAttempt = true;
      } catch {
        // Lost the attempt race (or the key read) — recover below.
      }
      for (let i = 0; i < 12; i++) {
        const snap = await getDoc(doc(db, 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e10c'));
        if (snap.exists()) {
          return { wonSession, wonAttempt, attempt: snap.data() as Record<string, unknown> };
        }
        await sleep(250);
      }
      return { wonSession, wonAttempt, attempt: null };
    };
    const [first, second] = await Promise.all([fullSubmit(), fullSubmit()]);
    if (first.attempt === null || second.attempt === null) {
      throw new Error('a racer never recovered the stored attempt');
    }
    if (first.attempt.sessionId !== 'sess-f7-e10c' || second.attempt.sessionId !== 'sess-f7-e10c') {
      throw new Error('racers resolved to different attempts');
    }
    if (first.attempt.score !== 1 || second.attempt.score !== 1) {
      throw new Error('raced attempt scores differ from 1');
    }
    // Exactly one session-submit winner and one attempt winner
    // across the two racers (the other recovered the stored doc).
    if (Number(first.wonSession) + Number(second.wonSession) !== 1) {
      throw new Error('session-submit race did not produce exactly one winner');
    }
    if (Number(first.wonAttempt) + Number(second.wonAttempt) !== 1) {
      throw new Error('attempt-create race did not produce exactly one winner');
    }
  });

  it('(f7-e11) B case 11 + ChatGPT items 10–11: clock games — server time decides, client clock cannot extend', async () => {
    // (a) Future submittedAt forgery → DENIED (submittedAt <=
    // request.time). A client clock set FORWARD cannot buy time:
    // the server timestamp is what counts.
    await createSession('sess-f7-e11a');
    const startedA = await setDeadline('sess-f7-e11a', 60);
    const storedA = await readSession('sess-f7-e11a');
    const dbA = asStudent();
    const batchA = writeBatch(dbA);
    batchA.update(doc(dbA, 'users', 'student-1', 'jobExamSessions', 'sess-f7-e11a'), buildMockSessionSubmitUpdate(storedA.revision));
    batchA.update(doc(dbA, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), {
      status: 'terminal', updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batchA.commit());
    const freshA = await readSession('sess-f7-e11a');
    const futureAttempt = scoreAndBuildAttempt('sess-f7-e11a', freshA, startedA);
    futureAttempt.submittedAt = Timestamp.fromMillis(Date.now() + 60 * MIN);
    await assertFails(setDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e11a'),
      futureAttempt,
    ));
    // (b) Session create with a forged future startedAt → DENIED
    // (startedAt == request.time).
    const db = asStudent();
    const forged = createMockSession({
      sessionId: 'sess-f7-e11b',
      mockId: SETUP.mockId, bundleId: SETUP.bundleId, examSlug: SETUP.examSlug,
      definitionId: SETUP.definitionId, questionSetId: SETUP.questionSetId,
      bundleVersion: 1, questionRefs: [SETUP.ref], timeMinutes: 60,
      clientNowMillis: Date.now(),
    });
    (forged as unknown as Record<string, unknown>).startedAt = Timestamp.fromMillis(Date.now() + 60 * MIN);
    const batchB = writeBatch(db);
    batchB.set(doc(db, 'users', 'student-1', 'jobExamSessions', 'sess-f7-e11b'), forged as unknown as Record<string, unknown>);
    batchB.set(doc(db, 'jobExamUserLocks', examLockId('student-1', SETUP.examSlug)), buildExamLockDoc({
      uid: 'student-1', examSlug: SETUP.examSlug, mockId: SETUP.mockId,
      definitionId: SETUP.definitionId, activeSessionId: 'sess-f7-e11b',
      durationSeconds: 60 * 60,
    }) as unknown as Record<string, unknown>);
    await assertFails(batchB.commit());
  });

  it('(f7-e11c) KNOWN GAP (probe-verified): hand-crafted BACKDATED submittedAt passes M1-b', async () => {
    // Faithful premise: the session was submitted ON TIME
    // (submittedAt 5 min before endsAt), the clock has since run
    // past endsAt, and a hand-crafted attempt backdates
    // submittedAt to 1 min before endsAt. M1-b checks
    // submittedAt <= endsAt and <= request.time — the forgery
    // satisfies both, and nothing binds the attempt's submittedAt
    // to the session's server submittedAt. The REAL app flow
    // cannot do this (buildJobAttemptDoc uses serverTimestamp()),
    // so this is a hardening follow-up, not a live exploit — but
    // it IS the current behavior, asserted here so a future
    // hardening lands as a visible test change.
    const { startedAtMillis, endsAtMillis } = await seedPastSession('sess-f7-e11c', 70 * MIN, {
      status: 'submitted',
      submittedAtMillis: Date.now() - 15 * MIN, // on-time submit (5 min before endsAt)
    });
    const stored = await readSession('sess-f7-e11c');
    if (stored.status !== 'submitted') throw new Error('seeded session is not submitted');
    const attemptDoc = scoreAndBuildAttempt('sess-f7-e11c', stored, startedAtMillis);
    attemptDoc.submittedAt = Timestamp.fromMillis(endsAtMillis - MIN);
    await assertSucceeds(setDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e11c'),
      attemptDoc,
    ));
    if (!(await attemptExists('sess-f7-e11c'))) throw new Error('forged attempt did not land');
  });

  it('(f7-e12) ChatGPT item 13: another student cannot read or modify the attempt/session', async () => {
    await createSession('sess-f7-e12');
    await setDeadline('sess-f7-e12', 60);
    // Student-2 cannot read student-1's session…
    await assertFails(getDoc(doc(asStudent('student-2'), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e12')));
    // …cannot autosave to it…
    const stored = await readSession('sess-f7-e12');
    const changed: JobMockSessionDoc = {
      ...stored,
      answers: { 1: { selected: 'A', markedForReview: false, timeSpentSeconds: 30 } },
    };
    await assertFails(updateDoc(
      doc(asStudent('student-2'), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e12'),
      buildMockAutosavePatch(changed),
    ));
    // …and cannot create an attempt under student-1's ID.
    const attemptDoc = scoreAndBuildAttempt('sess-f7-e12', stored, millisOf(stored.startedAt) ?? Date.now());
    await assertFails(setDoc(
      doc(asStudent('student-2'), 'users', 'student-1', 'jobExamAttempts', 'sess-f7-e12'),
      attemptDoc,
    ));
    // Lock hygiene for the next (past-seeded) tests: abandon the
    // session and release its lock.
    await abandonSessionWithLock('sess-f7-e12');
  });

  it('(f7-e13) ChatGPT items 6/15 (emulator half): reconnect-after-expiry writes change nothing', async () => {
    // The offline-queue/reconnect choreography itself is OWED
    // (no offline queue exists in the emulator). What the
    // emulator CAN prove: writes arriving after expiry are denied
    // AND leave the stored docs untouched — no extension, no
    // modification of the expired attempt/session.
    await seedPastSession('sess-f7-e13', 70 * MIN);
    const before = await readSession('sess-f7-e13');
    const changed: JobMockSessionDoc = {
      ...before,
      answers: { 1: { selected: 'A', markedForReview: false, timeSpentSeconds: 30 } },
    };
    await assertFails(updateDoc(
      doc(asStudent(), 'users', 'student-1', 'jobExamSessions', 'sess-f7-e13'),
      buildMockAutosavePatch(changed),
    ));
    await assertFails(submitSessionStandalone('sess-f7-e13'));
    const after = await readSession('sess-f7-e13');
    if (millisOf(after.endsAt) !== millisOf(before.endsAt)) throw new Error('endsAt moved after expiry');
    if (after.status !== 'in-progress') throw new Error('status moved after expiry');
    const afterAnswers = after.answers as unknown as Record<string, { selected: string | null }>;
    if (afterAnswers['1']?.selected !== null) throw new Error('answers moved after expiry');
    if (after.revision !== before.revision) throw new Error('revision moved after expiry');
    if (await attemptExists('sess-f7-e13')) throw new Error('attempt appeared after expiry');
  });
});
