// Eduvelto — Job Preparation full exam + model tests: Firestore
// operations (Step 9).
//
// Thin Firestore layer for the mock engine UI. Pure scoring /
// session-shape logic lives in ./jobEngine.ts; mock definitions
// live in ./jobMocks.ts; this file only talks to Firestore
// (mock + bundle + key reads, session create/deadline/autosave/
// abandon/submit, attempt + history reads). No lib in this file
// guesses answers — scoring always goes through scoreMockAttempt
// (key required).
//
// SUBMIT FLOW — Design G (Step 3 §4.2, adapted to the Step 7
// receipt gate, P0-06): the key is receipt-gated behind a
// SUBMITTED record, so the receipt can never be created BEFORE
// the answers are frozen. The order is therefore:
//   1. session → 'submitted' (standalone update — answers frozen,
//      terminal; the receipt can only anchor to this now),
//   2. receipt create (jobReceipts/{uid}_{bundleId}, attemptId =
//      sessionId — best-effort: a retake's receipt may already
//      exist, in which case the old fresh receipt is reused),
//   3. key read (rules: fresh receipt + SUBMITTED session anchor
//      for this bundle — the Step 9 rules extension),
//   4. score from the mock's rulesSnapshot (never live config),
//   5. attempt create (same doc-ID as the session; idempotent —
//      an existing attempt is returned, never re-written).
// The receipt is NOT deleted by the student (rules: Admin-only
// delete) — it expires by rule after 10 minutes. A crash between
// steps 1 and 5 strands the session as submitted-without-attempt:
// the retry re-runs from step 2 inside the receipt window; after
// the window closes the student starts a NEW session (retake).
// Side-writes (§4.2 step 6: progress / wrong answers) are NOT
// here — Step 8's submit does not do them either; Steps 10/12/13
// own them.
//
// TIMER (audit M1): the stored deadline (endsAt) is set ONCE
// after read-back to startedAt + rulesSnapshot.timeMinutes, and
// the rules bound it to exactly that and deny any attempt with
// submittedAt > endsAt. The client timer runs on endsAt when
// known, else clientEndsAtMillis (set at creation).
//
// LANGUAGE: all UI-facing messages are Bangla (one-language rule).

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  serverTimestamp,
  type Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  buildJobAttemptDoc,
  buildMockDeadlineUpdate,
  buildMockSessionAbandonUpdate,
  buildMockSessionSubmitUpdate,
  createMockSession,
  jobAttemptResultFromStoredDoc,
  mockDeadlineForSession,
  scoreMockAttempt,
  validateAttemptResult,
  validateMockSession,
  type JobAttemptResult,
  type JobMockSessionDoc,
  type JobSessionAnswer,
} from './jobEngine';
import {
  jobMockBundleId,
  jobMockIdFromDocId,
  jobThisWeekWeeklyMockId,
  jobTodayDailyMockId,
  validateJobMock,
  type JobMockKind,
  type JobMockWithId,
} from './jobMocks';
import { autosaveSession, loadBundleKey, loadPracticeBundle, type PracticeBundleWithId } from './jobPractice';
import type { JobQuestionKey, JobReceipt } from './jobQuestions';

/** Firestore not configured (gate G1) — pages show the honest
 * reason instead of crashing. */
function requireDb(): NonNullable<typeof db> {
  if (!db) throw new Error('Firebase কনফিগার করা হয়নি — মক টেস্ট এখন চালানো যাবে না।');
  return db;
}

function timestampToMillis(t: unknown): number | null {
  if (t === null || t === undefined) return null;
  const v = t as FirestoreTimestamp;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return null;
}

/** Normalize a mock session doc read back from Firestore: answers-map
 * keys arrive as strings ('1','2'); the engine works with numeric
 * question numbers. Unlike the practice normalizer, endsAt and
 * clientEndsAtMillis are PRESERVED — the timer runs on them. */
export function normalizeMockSessionDoc(data: Record<string, unknown>): JobMockSessionDoc {
  const rawAnswers = (data.answers ?? {}) as Record<string, Record<string, unknown>>;
  const answers: Record<number, JobSessionAnswer> = {};
  for (const [k, v] of Object.entries(rawAnswers)) {
    const n = Number(k);
    if (!Number.isInteger(n) || n < 1) continue;
    answers[n] = {
      selected: v.selected === 'A' || v.selected === 'B' || v.selected === 'C' || v.selected === 'D' ? v.selected : null,
      markedForReview: v.markedForReview === true,
      timeSpentSeconds: typeof v.timeSpentSeconds === 'number' && v.timeSpentSeconds >= 0 ? v.timeSpentSeconds : 0,
    };
  }
  return {
    kind: 'mock',
    mockId: String(data.mockId ?? ''),
    bundleId: String(data.bundleId ?? ''),
    examSlug: String(data.examSlug ?? ''),
    status: data.status === 'submitted' || data.status === 'abandoned' ? data.status : 'in-progress',
    startedAt: data.startedAt ?? null,
    endsAt: data.endsAt ?? null,
    questionRefs: Array.isArray(data.questionRefs)
      ? (data.questionRefs as { bundleId: string; n: number; questionId: string }[])
      : [],
    answers,
    currentQuestion: typeof data.currentQuestion === 'number' && data.currentQuestion >= 1 ? data.currentQuestion : 1,
    lastSyncedAt: data.lastSyncedAt ?? null,
    clientEndsAtMillis: typeof data.clientEndsAtMillis === 'number' ? data.clientEndsAtMillis : null,
    submittedAt: data.submittedAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    revision: typeof data.revision === 'number' && data.revision >= 1 ? data.revision : 1,
  };
}

/** The receipt doc for a mock submit (Design G step 2): the
 * attemptId is the SESSION id (the attempt doc will carry the
 * same ID when it is created in step 5). createdAt is a server
 * timestamp — the rules require it to be ≤ now and < 5 minutes
 * old (P0-03 trusted timestamp). */
export function buildMockReceiptDoc(uid: string, bundleId: string, sessionId: string): JobReceipt {
  return {
    userId: uid,
    bundleId,
    attemptId: sessionId,
    createdAt: serverTimestamp(),
  };
}

/* ------------------------------------------------------------------ */
/* Mock + bundle + key reads                                           */
/* ------------------------------------------------------------------ */

/** Load one mock by doc-ID (any status — the caller checks
 * .status). Returns null when missing or failing validation. */
export async function loadMock(mockDocId: string): Promise<JobMockWithId | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'jobMocks', mockDocId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (validateJobMock(data, snap.id).length > 0) return null;
  return { ...(data as unknown as JobMockWithId), docId: snap.id };
}

/** Load one PUBLISHED mock by doc-ID. Returns null when missing,
 * invalid, or not published (draft/archived mocks never start). */
export async function loadPublishedMock(mockDocId: string): Promise<JobMockWithId | null> {
  const mock = await loadMock(mockDocId);
  if (!mock || mock.status !== 'published') return null;
  return mock;
}

/** Today's daily mock (Dhaka date) — null when it was never
 * published (the card shows the honest "not yet" state, never a
 * fabricated mock). */
export async function loadTodayDailyMock(nowMs: number = Date.now()): Promise<JobMockWithId | null> {
  return loadPublishedMock(`daily__${jobTodayDailyMockId(nowMs)}`);
}

/** This week's weekly mock (ISO week) — null when never published. */
export async function loadThisWeekWeeklyMock(nowMs: number = Date.now()): Promise<JobMockWithId | null> {
  return loadPublishedMock(`weekly__${jobThisWeekWeeklyMockId(nowMs)}`);
}

/** Published mocks, optionally filtered by exam and/or kind.
 * One == filter (status) + client-side filtering — no composite
 * index needed. Sorted daily → weekly → full, then Bangla title. */
export async function listPublishedMocks(filters?: {
  examSlug?: string;
  kind?: JobMockKind;
}): Promise<JobMockWithId[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, 'jobMocks'), where('status', '==', 'published')),
  );
  const out: JobMockWithId[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    if (validateJobMock(data, d.id).length > 0) continue;
    const mock = { ...(data as unknown as JobMockWithId), docId: d.id };
    if (filters?.examSlug && mock.examSlug !== filters.examSlug) continue;
    if (filters?.kind && mock.kind !== filters.kind) continue;
    out.push(mock);
  }
  const kindOrder: Record<JobMockKind, number> = { daily: 0, weekly: 1, full: 2 };
  out.sort(
    (a, b) =>
      kindOrder[a.kind] - kindOrder[b.kind] || a.titleBn.localeCompare(b.titleBn, 'bn'),
  );
  return out;
}

/** Load a mock's bundle (the question set). The bundle doc-ID
 * follows the mock's bare key (jobMockBundleId); the caller
 * passes the bundleId stored on the mock doc. */
export async function loadMockBundle(bundleId: string): Promise<PracticeBundleWithId | null> {
  return loadPracticeBundle(bundleId);
}

/** Bundle doc-ID for a mock (re-exported for the pages: the
 * mock doc stores bundleId already, so this is only needed
 * when deriving it from a mockId + kind). */
export function mockBundleIdFor(mockId: string, kind: JobMockKind): string {
  return jobMockBundleId(mockId, kind);
}

/** Load the answer key for a mock bundle. Returns null when
 * missing or unusable — the rules decide readability (fresh
 * session-anchored receipt after submit; a read before that
 * throws permission-denied, which the caller turns into the
 * honest "not yet" state — see submitMockAttempt). */
export async function loadMockKey(bundleId: string): Promise<JobQuestionKey | null> {
  return loadBundleKey(bundleId);
}

/* ------------------------------------------------------------------ */
/* Mock sessions: start / resume / deadline / autosave / abandon      */
/* ------------------------------------------------------------------ */

/** Find the student's latest in-progress mock session for a
 * bundle (refresh-restore). Two == filters — no composite index;
 * the latest is picked client-side. Returns null when there is
 * none. */
export async function findResumableMockSession(
  uid: string,
  bundleId: string,
): Promise<{ sessionId: string; session: JobMockSessionDoc; startedAtMillis: number } | null> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'jobSessions'),
      where('bundleId', '==', bundleId),
      where('status', '==', 'in-progress'),
    ),
  );
  let best: { sessionId: string; session: JobMockSessionDoc; startedAtMillis: number } | null = null;
  for (const d of snap.docs) {
    const session = normalizeMockSessionDoc(d.data() as Record<string, unknown>);
    if (session.kind !== 'mock') continue;
    if (validateMockSession(session).length > 0) continue;
    const startedAtMillis = timestampToMillis(session.startedAt) ?? 0;
    if (!best || startedAtMillis > best.startedAtMillis) {
      best = { sessionId: d.id, session, startedAtMillis };
    }
  }
  return best;
}

/** Start a new mock session: auto-ID, engine-built doc (bundle
 * order — a timed mock never runs in mode order), one setDoc.
 * The deadline is NOT set here (startedAt is a server timestamp
 * the client cannot know yet) — call ensureMockDeadline right
 * after, which sets endsAt ONCE from the read-back. The timer
 * runs on clientEndsAtMillis until then. Returns the session ID
 * + the local session + the client-side start time. */
export async function startMockSession(
  uid: string,
  mock: JobMockWithId,
  bundle: PracticeBundleWithId,
): Promise<{ sessionId: string; session: JobMockSessionDoc; startedAtMillis: number }> {
  const firestore = requireDb();
  const ref = doc(collection(firestore, 'users', uid, 'jobSessions'));
  const mockId = jobMockIdFromDocId(mock.docId, mock.kind);
  if (mockId === null) {
    throw new Error('মকের পরিচয় (mockId) পাওয়া যায়নি — মক শুরু করা যাবে না।');
  }
  const questionRefs = bundle.questions.map((q) => ({ bundleId: bundle.docId, n: q.n, questionId: q.questionId }));
  const session = createMockSession({
    sessionId: ref.id,
    mockId,
    bundleId: bundle.docId,
    examSlug: mock.examSlug,
    questionRefs,
    timeMinutes: mock.rulesSnapshot.timeMinutes,
    clientNowMillis: Date.now(),
  });
  await setDoc(ref, session as unknown as Record<string, unknown>);
  return { sessionId: ref.id, session, startedAtMillis: Date.now() };
}

/** Set the stored deadline ONCE (audit M1): endsAt = startedAt
 * (server time, from the read-back) + the mock's
 * rulesSnapshot.timeMinutes. Safe to call after start AND on
 * every resume while endsAt is still null — it fresh-reads first
 * and returns the stored deadline when it already exists.
 * Returns the deadline in millis + whether it is stored
 * server-side (false = the read-back had no resolvable startedAt
 * yet — the timer runs on clientEndsAtMillis and the caller
 * retries this on the next autosave tick). */
export async function ensureMockDeadline(
  uid: string,
  sessionId: string,
  timeMinutes: number,
): Promise<{ deadlineMillis: number | null; stored: boolean }> {
  const firestore = requireDb();
  const sessionRef = doc(firestore, 'users', uid, 'jobSessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) {
    throw new Error('সেশন পাওয়া যায়নি — আবার মক শুরু করুন।');
  }
  const session = normalizeMockSessionDoc(snap.data() as Record<string, unknown>);
  const storedEndsAt = timestampToMillis(session.endsAt);
  if (storedEndsAt !== null) {
    return { deadlineMillis: storedEndsAt, stored: true };
  }
  const startedAtMillis = timestampToMillis(session.startedAt);
  if (startedAtMillis === null) {
    return { deadlineMillis: session.clientEndsAtMillis, stored: false };
  }
  const deadlineMillis = mockDeadlineForSession(startedAtMillis, timeMinutes);
  try {
    await updateDoc(
      sessionRef,
      buildMockDeadlineUpdate(session.revision, Timestamp.fromMillis(deadlineMillis), deadlineMillis),
    );
  } catch (err) {
    // Another tab may have set it first (stale revision) — re-read
    // before giving up: a stored deadline now means success.
    const retry = await getDoc(sessionRef);
    if (retry.exists()) {
      const retryEndsAt = timestampToMillis(
        normalizeMockSessionDoc(retry.data() as Record<string, unknown>).endsAt,
      );
      if (retryEndsAt !== null) return { deadlineMillis: retryEndsAt, stored: true };
    }
    throw err;
  }
  return { deadlineMillis, stored: true };
}

/** Load one mock session (same ID as its attempt) — for the
 * result page and the resume flow. Returns null when missing. */
export async function loadMockSession(
  uid: string,
  sessionId: string,
): Promise<JobMockSessionDoc | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'users', uid, 'jobSessions', sessionId));
  if (!snap.exists()) return null;
  return normalizeMockSessionDoc(snap.data() as Record<string, unknown>);
}

/** Autosave one mock session (debounced by the caller): only the
 * fields the rules allow to change while in-progress — answers,
 * currentQuestion, lastSyncedAt, updatedAt, revision (exactly
 * stored + 1; a stale patch is rejected by the rules and the
 * caller reloads). Same shape as practice (shared helper). */
export async function autosaveMockSession(
  uid: string,
  sessionId: string,
  patch: { answers: Record<number, unknown>; currentQuestion: number; lastSyncedAt: unknown; updatedAt: unknown; revision: number },
): Promise<void> {
  await autosaveSession(uid, sessionId, patch);
}

/** Abandon a mock session (time expired, or the student quits):
 * in-progress → 'abandoned' (terminal, frozen — the audit trail
 * of an unfinished mock). Returns the final status: 'abandoned',
 * or 'submitted' when another tab already submitted it. */
export async function abandonMockSession(
  uid: string,
  sessionId: string,
): Promise<'abandoned' | 'submitted'> {
  const firestore = requireDb();
  const sessionRef = doc(firestore, 'users', uid, 'jobSessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) {
    throw new Error('সেশন পাওয়া যায়নি।');
  }
  const stored = snap.data() as Record<string, unknown>;
  if (stored.status === 'submitted') return 'submitted';
  if (stored.status === 'abandoned') return 'abandoned';
  if (stored.status !== 'in-progress') {
    throw new Error('এই সেশনটি আর বাতিল করা যাবে না।');
  }
  const storedRevision = typeof stored.revision === 'number' && stored.revision >= 1 ? stored.revision : 1;
  await updateDoc(sessionRef, buildMockSessionAbandonUpdate(storedRevision));
  return 'abandoned';
}

/* ------------------------------------------------------------------ */
/* Mock submit — Design G (§4.2 adapted to the P0-06 receipt gate)    */
/* ------------------------------------------------------------------ */

export interface SubmitMockInput {
  uid: string;
  sessionId: string;
  /** Local session (answers come from here — the fresh-read only
   * supplies the revision + server startedAt). */
  session: JobMockSessionDoc;
  mock: JobMockWithId;
  bundle: PracticeBundleWithId;
  /** Per-question answers from the session (n, questionId,
   * selected, timeSpentSeconds). */
  answers: Array<{ n: number; questionId: string; selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSeconds?: number }>;
  startedAtMillis: number;
  submittedAtMillis: number;
}

/**
 * Submit a mock attempt — Design G:
 *   1. fresh-read the session (local state may be stale); it must
 *      be in-progress (or already submitted → orphan recovery),
 *   2. session → 'submitted' (standalone update — answers frozen;
 *      the receipt can only anchor to this now),
 *   3. receipt create, best-effort (a retake's receipt may already
 *      exist — the old fresh receipt is then reused; a failure
 *      here never blocks the key read, the rules decide),
 *   4. key read (fresh session-anchored receipt),
 *   5. score from the mock's rulesSnapshot (never live config),
 *   6. build + validate the attempt doc (lib mirror of the rules),
 *   7. IDEMPOTENT RECOVERY: an already-existing attempt is
 *      returned (its STORED result — never a recomputation that
 *      could come from a republished bundle),
 *   8. attempt create (same doc-ID as the session).
 * The receipt is NOT deleted (rules: Admin-only delete — it
 * expires by rule after 10 minutes). No progress / wrong-answer
 * side-writes (Steps 10/12/13 own them, as in Step 8).
 * Returns the attempt ID (= session ID) + the result.
 */
export async function submitMockAttempt(
  input: SubmitMockInput,
): Promise<{ attemptId: string; result: JobAttemptResult }> {
  const firestore = requireDb();
  const mockId = jobMockIdFromDocId(input.mock.docId, input.mock.kind);
  if (mockId === null) {
    throw new Error('মকের পরিচয় (mockId) পাওয়া যায়নি — জমা দেওয়া যাবে না।');
  }
  const sessionRef = doc(firestore, 'users', input.uid, 'jobSessions', input.sessionId);
  const attemptRef = doc(firestore, 'users', input.uid, 'jobAttempts', input.sessionId);
  const bundleId = input.bundle.docId;

  // 1. Fresh-read the session: the stored revision is the only safe
  // base for the submit transition (local state may lag autosaves).
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) {
    throw new Error('সেশন পাওয়া যায়নি — আবার মক শুরু করুন।');
  }
  const stored = sessionSnap.data() as Record<string, unknown>;
  if (stored.status === 'abandoned') {
    throw new Error('এই সেশনটি বাতিল করা হয়েছে — জমা দেওয়া যাবে না।');
  }
  if (stored.status !== 'in-progress' && stored.status !== 'submitted') {
    throw new Error('এই সেশনটি আর জমা দেওয়া যাবে না।');
  }
  const storedRevision = typeof stored.revision === 'number' && stored.revision >= 1 ? stored.revision : 1;
  const startedAtMillis = timestampToMillis(stored.startedAt) ?? input.startedAtMillis;

  // Helper: score + build + validate + create-or-recover the attempt.
  // Used both for the fresh submit and for the orphan recovery
  // (session already submitted, attempt missing).
  const scoreAndCreateAttempt = async (): Promise<{ attemptId: string; result: JobAttemptResult }> => {
    // 3. Receipt (best-effort — see header).
    try {
      await setDoc(
        doc(firestore, 'jobReceipts', `${input.uid}_${bundleId}`),
        buildMockReceiptDoc(input.uid, bundleId, input.sessionId),
      );
    } catch {
      // A retake's receipt already exists, or the create was denied
      // — the key read below uses whatever fresh receipt the rules
      // accept; if none is fresh, it throws the honest error.
    }
    // 4. Key read (the rules gate it on the fresh receipt).
    let key: JobQuestionKey | null;
    try {
      key = await loadMockKey(bundleId);
    } catch {
      throw new Error('উত্তরের চাবি পড়া যায়নি — জমার অনুমতির মেয়াদ শেষ হতে পারে। নতুন করে মক শুরু করুন।');
    }
    if (key === null) {
      throw new Error('উত্তরের চাবি পাওয়া যায়নি — জমা দেওয়া যায়নি।');
    }
    // 5. Score from the snapshot.
    const result = scoreMockAttempt({
      bundle: input.bundle,
      key,
      answers: input.answers,
      rulesSnapshot: input.mock.rulesSnapshot,
      examSlug: input.mock.examSlug,
      startedAtMillis,
      submittedAtMillis: input.submittedAtMillis,
    });
    // 6. Build + validate the attempt doc. The session passed in
    // carries the FRESH-READ startedAt (a real server timestamp) —
    // never the local creation sentinel, which would resolve to
    // the SUBMIT time if it were written into the attempt.
    const sessionForAttempt: JobMockSessionDoc = {
      ...input.session,
      startedAt: stored.startedAt ?? input.session.startedAt,
    };
    const attemptDoc = buildJobAttemptDoc({
      sessionId: input.sessionId,
      session: sessionForAttempt,
      result,
      bundleId,
      examSlug: input.mock.examSlug,
      subjectId: null,
      topicId: null,
      kind: 'mock',
      mockId,
      bundleVersion: input.bundle.bundleVersion,
      userId: input.uid,
    });
    const problems = validateAttemptResult(attemptDoc);
    if (problems.length > 0) {
      throw new Error(`জমা দেওয়া যায়নি — ${problems[0]}`);
    }
    // 7. Idempotent recovery — the attempt already exists.
    const existingAttempt = await getDoc(attemptRef);
    if (existingAttempt.exists()) {
      const storedResult = jobAttemptResultFromStoredDoc(existingAttempt.data() as Record<string, unknown>);
      return { attemptId: input.sessionId, result: storedResult ?? result };
    }
    // 8. Attempt create (the session is already submitted, so the
    // rules' session gate passes on the stored doc).
    try {
      await setDoc(attemptRef, attemptDoc as unknown as Record<string, unknown>);
    } catch {
      // Two tabs submitting at once: the second setDoc is an update
      // and the rules deny it — re-read, and return the attempt
      // that did land.
      const raced = await getDoc(attemptRef);
      if (raced.exists()) {
        const storedResult = jobAttemptResultFromStoredDoc(raced.data() as Record<string, unknown>);
        return { attemptId: input.sessionId, result: storedResult ?? result };
      }
      throw new Error('জমা দেওয়া যায়নি — আবার চেষ্টা করুন।');
    }
    return { attemptId: input.sessionId, result };
  };

  // 2. Session → 'submitted' (skip when already submitted —
  // orphan recovery: the attempt is created alone).
  if (stored.status === 'in-progress') {
    try {
      await updateDoc(sessionRef, buildMockSessionSubmitUpdate(storedRevision));
    } catch {
      const retry = await getDoc(sessionRef);
      if (!retry.exists() || (retry.data() as Record<string, unknown>).status !== 'submitted') {
        throw new Error('জমা দেওয়া যায়নি — সেশন জমা করা যায়নি। আবার চেষ্টা করুন।');
      }
    }
  }
  return scoreAndCreateAttempt();
}

/* ------------------------------------------------------------------ */
/* Exam history                                                        */
/* ------------------------------------------------------------------ */

/** A stored attempt with its doc ID attached (the result page
 * loads by this ID; the history list renders from these fields —
 * the score is the stored client-calculated one, always labelled
 * "অনুশীলন ফলাফল"). */
export type MockAttemptWithId = Record<string, unknown> & { docId: string };

/** The student's mock attempts, newest first (kind 'mock' +
 * submittedAt desc — the M1 history index). The mockId filter
 * is client-side: a second composite index is not worth it for
 * a per-student history list. */
export async function listMockAttempts(
  uid: string,
  maxResults = 20,
): Promise<MockAttemptWithId[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'jobAttempts'),
      where('kind', '==', 'mock'),
      orderBy('submittedAt', 'desc'),
      limit(maxResults),
    ),
  );
  return snap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), docId: d.id }));
}

/** The student's attempts for ONE mock (retake history), newest
 * first. Client-side mockId filter (see listMockAttempts). */
export async function listMockAttemptsForMock(
  uid: string,
  mockId: string,
  maxResults = 20,
): Promise<MockAttemptWithId[]> {
  const all = await listMockAttempts(uid, Math.max(maxResults, 50));
  return all.filter((a) => a.mockId === mockId).slice(0, maxResults);
}

/** Load one submitted mock attempt (owner). Returns null when
 * missing. The stored answers carry correctText, so the result
 * page never re-reads the key. */
export async function loadMockAttempt(
  uid: string,
  attemptId: string,
): Promise<Record<string, unknown> | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'users', uid, 'jobAttempts', attemptId));
  if (!snap.exists()) return null;
  return snap.data() as Record<string, unknown>;
}
