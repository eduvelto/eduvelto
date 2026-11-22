// Eduvelto — Job Preparation full exam + model tests: Firestore
// operations (Step 9, ChatGPT fold-in).
//
// Thin Firestore layer for the mock engine UI. Pure scoring /
// session-shape logic lives in ./jobEngine.ts; mock definitions
// live in ./jobMocks.ts; this file only talks to Firestore
// (definition + manifest + bundle + key reads, exam session
// create/deadline/autosave/abandon/submit, exam attempt +
// history reads). No lib in this file guesses answers — scoring
// always goes through scoreMockAttempt (key required).
//
// COLLECTIONS (H.2 — practice and exam are SEPARATE, never
// interchangeable): exam sessions live in
// users/{uid}/jobExamSessions, exam attempts in
// users/{uid}/jobExamAttempts, definitions in
// jobExamDefinitions, frozen question sets in
// jobQuestionSetManifests, one-active-session locks in
// jobExamUserLocks. The old jobSessions / jobAttempts / jobMocks
// paths are PRACTICE-only now — this file never touches them.
//
// START FLOW (H.7 + §1(f)): the session is created ATOMICALLY
// with its lock (one batch: exam session + jobExamUserLocks
// {uid}_{examSlug}); the session's questionRefs come from the
// MANIFEST (the frozen set), never from the bundle's current
// order — resume reads the same manifest. startedAt is a
// serverTimestamp (the rules require startedAt == request.time);
// endsAt is set ONCE after read-back to EXACTLY startedAt +
// definition duration (audit M1, tightened to exact).
//
// SUBMIT FLOW — Design G (Step 3 §4.2, adapted to the Step 7
// receipt gate, P0-06, + H.1 purpose receipts): the key is
// receipt-gated behind a SUBMITTED record, so the receipt can
// never be created BEFORE the answers are frozen. The order is:
//   1. fresh-read the exam session (local state may be stale),
//   2. session → 'submitted' + lock → 'terminal' in ONE batch
//      (answers frozen; the receipt can only anchor to this now),
//   3. receipt create/re-issue (jobReceipts/{uid}_{bundleId},
//      attemptId = sessionId, purpose 'exam_review', bundleVersion =
//      the session's stored generation — best-effort: a retake
//      RE-ISSUES the receipt (Step 9 closure, open question 1 —
//      the rules allow an anchored re-issue, so a new submission
//      opens a new 10-minute window; the old window is replaced,
//      never silently extended),
//   4. key read (rules: fresh exam_review receipt + SUBMITTED
//      exam session/attempt anchor for this bundle),
//   5. score from the mock's rulesSnapshot (never live config),
//   6. build + validate the attempt doc (lib mirror of the rules
//      — questionSetId from the STORED session, never the
//      definition's current pointer),
//   7. IDEMPOTENT RECOVERY: an already-existing exam attempt is
//      returned (its STORED result — never a recomputation that
//      could come from a republished bundle),
//   8. attempt create (same doc-ID as the session).
// The receipt is NOT deleted by the student (rules: Admin-only
// delete) — it expires by rule after 10 minutes. A crash between
// steps 2 and 8 strands the session as submitted-without-attempt:
// the retry re-runs from step 3 inside the receipt window; after
// the window closes the student starts a NEW session (retake).
// Side-writes (§4.2 step 6: progress / wrong answers) are NOT
// here — Step 8's submit does not do them either; Steps 10/12/13
// own them.
//
// TIMER (audit M1, exact): the stored deadline (endsAt) is set
// ONCE after read-back to startedAt + rulesSnapshot.timeMinutes,
// and the rules bound it to EXACTLY that and deny any attempt
// with submittedAt > endsAt. The client timer runs on endsAt
// when known, else clientEndsAtMillis (set at creation).
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
  writeBatch,
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
import { loadBundleKey, loadPracticeBundle, type PracticeBundleWithId } from './jobPractice';
import { logMockAuditEvent } from './jobExamAudit';
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

/* ------------------------------------------------------------------ */
/* Exam manifests (jobQuestionSetManifests) — the frozen set          */
/* ------------------------------------------------------------------ */

/** A jobQuestionSetManifests doc (ChatGPT §1(f)): the frozen
 * question references for one mock generation — question IDs +
 * order + count + marking scheme + version. The bundle holds
 * the question text/options for display; the MANIFEST is the
 * rules' authority for what the exam contains. */
export interface JobExamManifest {
  examSlug: string;
  mockId: string;
  version: number;
  questionCount: number;
  questionRefs: Array<{ bundleId: string; n: number; questionId: string }>;
  markingSchemeVersion: string;
  status: 'draft' | 'published' | 'archived';
}

/** Light lib-side validation of a manifest (mirrors
 * validJobQuestionSetManifest in the rules — the rules are the
 * authority; this only keeps malformed docs from crashing the
 * page). Returns problem strings; empty = valid. */
export function validateExamManifest(doc: unknown): string[] {
  const problems: string[] = [];
  const label = 'jobQuestionSetManifests';
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return [`${label}: doc must be an object`];
  }
  const d = doc as Record<string, unknown>;
  if (typeof d.examSlug !== 'string' || d.examSlug.length === 0) {
    problems.push(`${label}: examSlug must be a non-empty string`);
  }
  if (typeof d.mockId !== 'string' || d.mockId.length === 0) {
    problems.push(`${label}: mockId must be a non-empty string`);
  }
  if (!Number.isInteger(d.version) || (d.version as number) < 1) {
    problems.push(`${label}: version must be an integer ≥1`);
  }
  if (!Number.isInteger(d.questionCount) || (d.questionCount as number) < 1 || (d.questionCount as number) > 200) {
    problems.push(`${label}: questionCount must be an integer 1–200`);
  }
  if (!Array.isArray(d.questionRefs)) {
    problems.push(`${label}: questionRefs must be a list`);
  } else if (d.questionRefs.length !== d.questionCount) {
    problems.push(`${label}: questionRefs size must equal questionCount`);
  } else {
    d.questionRefs.forEach((r, i) => {
      const ref = r as Record<string, unknown>;
      if (typeof ref !== 'object' || ref === null
        || typeof ref.bundleId !== 'string' || ref.bundleId.length === 0
        || !Number.isInteger(ref.n) || (ref.n as number) < 1
        || typeof ref.questionId !== 'string' || ref.questionId.length === 0) {
        problems.push(`${label}: questionRefs[${i}] is malformed (bundleId/n/questionId required)`);
      }
    });
  }
  if (typeof d.markingSchemeVersion !== 'string' || d.markingSchemeVersion.length === 0) {
    problems.push(`${label}: markingSchemeVersion must be a non-empty string`);
  }
  if (d.status !== 'draft' && d.status !== 'published' && d.status !== 'archived') {
    problems.push(`${label}: status must be draft/published/archived`);
  }
  return problems;
}

/** Load one manifest by questionSetId (any status — the caller
 * checks .status). Returns null when missing or invalid. */
export async function loadExamManifest(questionSetId: string): Promise<JobExamManifest | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'jobQuestionSetManifests', questionSetId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (validateExamManifest(data).length > 0) return null;
  return data as unknown as JobExamManifest;
}

/** Load one PUBLISHED manifest. Returns null when missing,
 * invalid, or not published (a draft manifest never starts). */
export async function loadPublishedExamManifest(questionSetId: string): Promise<JobExamManifest | null> {
  const manifest = await loadExamManifest(questionSetId);
  if (!manifest || manifest.status !== 'published') return null;
  return manifest;
}

/* ------------------------------------------------------------------ */
/* Exam user locks (jobExamUserLocks) — one active session per exam   */
/* ------------------------------------------------------------------ */

/** Lock doc-ID: `{uid}_{examSlug}` (H.7). */
export function examLockId(uid: string, examSlug: string): string {
  return `${uid}_${examSlug}`;
}

/** A jobExamUserLocks doc. */
export interface JobExamLock {
  uid: string;
  examSlug: string;
  mockId: string;
  definitionId: string;
  activeSessionId: string;
  status: 'in_progress' | 'terminal';
  durationSeconds: number;
  createdAt: unknown;
  updatedAt: unknown;
}

/** Build a fresh lock doc for a new exam session (H.7): the lock
 * is created ATOMICALLY with the session (one batch) and
 * released ATOMICALLY with the session's terminal transition.
 * durationSeconds is the definition's frozen duration — a client
 * cannot shorten its own lock to go stale early. */
export function buildExamLockDoc(input: {
  uid: string;
  examSlug: string;
  mockId: string;
  definitionId: string;
  activeSessionId: string;
  durationSeconds: number;
}): JobExamLock {
  return {
    uid: input.uid,
    examSlug: input.examSlug,
    mockId: input.mockId,
    definitionId: input.definitionId,
    activeSessionId: input.activeSessionId,
    status: 'in_progress',
    durationSeconds: input.durationSeconds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Read the student's lock for an exam pattern. Returns null
 * when there is none (no exam ever started for the pattern). */
export async function loadExamLock(uid: string, examSlug: string): Promise<JobExamLock | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'jobExamUserLocks', examLockId(uid, examSlug)));
  if (!snap.exists()) return null;
  return snap.data() as unknown as JobExamLock;
}

/** True when a stored lock is STILL LIVE (in_progress and not
 * yet stale: createdAt + duration + 15 min grace — the crash
 * backstop). A live lock means another exam session is running
 * for this pattern; a stale/terminal lock does not block a new
 * session (the rules re-arm it). `nowMillis` defaults to
 * Date.now(); pass the read-back createdAt when the lock was
 * just written (serverTimestamp sentinel → null → not live). */
export function isExamLockLive(lock: JobExamLock | null, nowMillis: number = Date.now()): boolean {
  if (!lock || lock.status !== 'in_progress') return false;
  const createdAtMillis = timestampToMillis(lock.createdAt);
  if (createdAtMillis === null) return false;
  if (!Number.isInteger(lock.durationSeconds) || lock.durationSeconds < 60) return false;
  return nowMillis < createdAtMillis + lock.durationSeconds * 1000 + 15 * 60 * 1000;
}

/* ------------------------------------------------------------------ */
/* Session normalization                                               */
/* ------------------------------------------------------------------ */

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
    definitionId: String(data.definitionId ?? ''),
    questionSetId: String(data.questionSetId ?? ''),
    bundleVersion: typeof data.bundleVersion === 'number' && data.bundleVersion >= 1 ? data.bundleVersion : 1,
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

/** The receipt doc for a mock submit (Design G step 3): the
 * attemptId is the SESSION id (the attempt doc will carry the
 * same ID when it is created in step 8). createdAt is a server
 * timestamp — the rules require it to be ≤ now and < 5 minutes
 * old (P0-03 trusted timestamp). purpose is 'exam_review' (H.1)
 * and bundleVersion binds the receipt to the session's stored
 * bundle generation. */
export function buildMockReceiptDoc(
  uid: string,
  bundleId: string,
  sessionId: string,
  bundleVersion: number,
): JobReceipt {
  return {
    userId: uid,
    bundleId,
    attemptId: sessionId,
    createdAt: serverTimestamp(),
    purpose: 'exam_review',
    bundleVersion,
  };
}

/* ------------------------------------------------------------------ */
/* Mock definition + bundle + key reads                                */
/* ------------------------------------------------------------------ */

/** Load one mock definition by doc-ID (any status — the caller
 * checks .status). Returns null when missing or failing
 * validation. */
export async function loadMock(mockDocId: string): Promise<JobMockWithId | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'jobExamDefinitions', mockDocId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (validateJobMock(data, snap.id).length > 0) return null;
  return { ...(data as unknown as JobMockWithId), docId: snap.id };
}

/** Load one PUBLISHED mock definition by doc-ID. Returns null
 * when missing, invalid, or not published (draft/archived mocks
 * never start). */
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

/** Published mock definitions, optionally filtered by exam and/or
 * kind. One == filter (status) + client-side filtering — no
 * composite index needed. Sorted daily → weekly → full, then
 * Bangla title. */
export async function listPublishedMocks(filters?: {
  examSlug?: string;
  kind?: JobMockKind;
}): Promise<JobMockWithId[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, 'jobExamDefinitions'), where('status', '==', 'published')),
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
 * session-anchored exam_review receipt after submit; a read
 * before that throws permission-denied, which the caller turns
 * into the honest "not yet" state — see submitMockAttempt). */
export async function loadMockKey(bundleId: string): Promise<JobQuestionKey | null> {
  return loadBundleKey(bundleId);
}

/* ------------------------------------------------------------------ */
/* Mock sessions: start / resume / deadline / autosave / abandon      */
/* ------------------------------------------------------------------ */

/** True when a stored mock session's deadline has already passed
 * (Step 9 closure, N4): an expired in-progress session can never
 * resume into a submittable exam — the rules deny any submit after
 * endsAt — so offering it for resume is a dead end. The deadline is
 * the stored endsAt, else the client-side estimate; a session with
 * neither is kept (its deadline is unknown, not necessarily past).
 * Pure and unit-tested; `nowMillis` defaults to Date.now(). */
export function isMockSessionExpired(
  session: JobMockSessionDoc,
  nowMillis: number = Date.now(),
): boolean {
  const deadlineMillis =
    timestampToMillis(session.endsAt) ?? session.clientEndsAtMillis ?? null;
  if (deadlineMillis === null) return false;
  return deadlineMillis <= nowMillis;
}

/** Find the student's latest in-progress mock session for a
 * bundle (refresh-restore). Two == filters — no composite index;
 * the latest is picked client-side. Returns null when there is
 * none. EXPIRED sessions are skipped (N4 — see
 * isMockSessionExpired): their deadline has passed, so resume
 * would land in the honest expired state instead of an exam. */
export async function findResumableMockSession(
  uid: string,
  bundleId: string,
  nowMillis: number = Date.now(),
): Promise<{ sessionId: string; session: JobMockSessionDoc; startedAtMillis: number } | null> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'jobExamSessions'),
      where('bundleId', '==', bundleId),
      where('status', '==', 'in-progress'),
    ),
  );
  let best: { sessionId: string; session: JobMockSessionDoc; startedAtMillis: number } | null = null;
  for (const d of snap.docs) {
    const session = normalizeMockSessionDoc(d.data() as Record<string, unknown>);
    if (session.kind !== 'mock') continue;
    if (validateMockSession(session).length > 0) continue;
    if (isMockSessionExpired(session, nowMillis)) continue;
    const startedAtMillis = timestampToMillis(session.startedAt) ?? 0;
    if (!best || startedAtMillis > best.startedAtMillis) {
      best = { sessionId: d.id, session, startedAtMillis };
    }
  }
  return best;
}

/** Start a new mock session: auto-ID, engine-built doc (MANIFEST
 * order — a timed mock never runs in mode order, and never in
 * the bundle's current order when the manifest differs), one
 * atomic batch (exam session + its lock). The deadline is NOT
 * set here (startedAt is a server timestamp the client cannot
 * know yet) — call ensureMockDeadline right after, which sets
 * endsAt ONCE from the read-back. The timer runs on
 * clientEndsAtMillis until then. Throws an honest error when
 * another exam session is already live for this pattern (the
 * rules deny the batch too — this pre-check only makes the
 * message readable). Returns the session ID + the local session
 * + the client-side start time. */
export async function startMockSession(
  uid: string,
  mock: JobMockWithId,
  bundle: PracticeBundleWithId,
): Promise<{ sessionId: string; session: JobMockSessionDoc; startedAtMillis: number }> {
  const firestore = requireDb();
  const mockId = jobMockIdFromDocId(mock.docId, mock.kind);
  if (mockId === null) {
    throw new Error('মকের পরিচয় (mockId) পাওয়া যায়নি — মক শুরু করা যাবে না।');
  }
  // The manifest is the frozen set: the session runs ITS refs,
  // and every ref must exist in the bundle (the bundle holds the
  // question text/options). A manifest/bundle mismatch is an
  // admin data error — never start a half-built exam.
  const manifest = await loadPublishedExamManifest(mock.questionSetId);
  if (!manifest) {
    throw new Error('এই মকের প্রশ্নসেট (manifest) প্রকাশিত হয়নি — মক শুরু করা যাবে না।');
  }
  if (manifest.mockId !== mockId || manifest.examSlug !== mock.examSlug) {
    throw new Error('এই মকের প্রশ্নসেট মকের সঙ্গে মিলছে না — মক শুরু করা যাবে না।');
  }
  // Step 9 closure (open question 4 — definition vs manifest
  // questionCount): the definition's snapshot count and the frozen
  // manifest's count must agree, or the intro would promise N
  // questions and the exam would run M. The rules do NOT
  // cross-check this (definition and manifest are created in either
  // order by a Moderator, so neither create can demand the other
  // exists) — the check lives here, at start time, and fails fast
  // with an honest error instead of starting a half-built exam.
  if (manifest.questionCount !== mock.rulesSnapshot.questionCount) {
    throw new Error('এই মকের প্রশ্ন-সংখ্যা মকের বিবরণের সঙ্গে মিলছে না — মক শুরু করা যাবে না।');
  }
  const bundleByKey = new Map(bundle.questions.map((q) => [`${q.n}:${q.questionId}`, q]));
  for (const ref of manifest.questionRefs) {
    if (ref.bundleId !== bundle.docId || !bundleByKey.has(`${ref.n}:${ref.questionId}`)) {
      throw new Error('এই মকের প্রশ্নসেট বান্ডেলের সঙ্গে মিলছে না — মক শুরু করা যাবে না।');
    }
  }
  // One live exam per pattern (H.7): a live lock means another
  // session is running — the rules deny the batch too; this
  // pre-check only makes the message readable.
  const existingLock = await loadExamLock(uid, mock.examSlug);
  if (isExamLockLive(existingLock)) {
    throw new Error('এই পরীক্ষার আরেকটি মক ইতিমধ্যে চলছে — আগেরটি শেষ করে আবার শুরু করুন।');
  }
  const sessionRef = doc(collection(firestore, 'users', uid, 'jobExamSessions'));
  const questionRefs = manifest.questionRefs.map((r) => ({
    bundleId: r.bundleId,
    n: r.n,
    questionId: r.questionId,
  }));
  const session = createMockSession({
    sessionId: sessionRef.id,
    mockId,
    bundleId: bundle.docId,
    examSlug: mock.examSlug,
    definitionId: mock.docId,
    questionSetId: mock.questionSetId,
    bundleVersion: bundle.bundleVersion,
    questionRefs,
    timeMinutes: mock.rulesSnapshot.timeMinutes,
    clientNowMillis: Date.now(),
  });
  const batch = writeBatch(firestore);
  batch.set(sessionRef, session as unknown as Record<string, unknown>);
  batch.set(
    doc(firestore, 'jobExamUserLocks', examLockId(uid, mock.examSlug)),
    buildExamLockDoc({
      uid,
      examSlug: mock.examSlug,
      mockId,
      definitionId: mock.docId,
      activeSessionId: sessionRef.id,
      durationSeconds: mock.rulesSnapshot.timeMinutes * 60,
    }) as unknown as Record<string, unknown>,
  );
  await batch.commit();
  // Audit (Step 9 closure, item 11): best-effort, never blocks.
  void logMockAuditEvent(uid, {
    event: 'mock_started',
    examSlug: mock.examSlug,
    mockId,
    sessionId: sessionRef.id,
    bundleId: bundle.docId,
  });
  return { sessionId: sessionRef.id, session, startedAtMillis: Date.now() };
}

/** Set the stored deadline ONCE (audit M1, exact): endsAt =
 * startedAt (server time, from the read-back) + the mock's
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
  const sessionRef = doc(firestore, 'users', uid, 'jobExamSessions', sessionId);
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
  // EXACTNESS (Step 9, production): the rules require endsAt ==
  // startedAt + duration to the NANOSECOND. startedAt is a
  // server timestamp and carries sub-millisecond nanos, which
  // toMillis() drops — Timestamp.fromMillis(deadlineMillis)
  // would then miss the stored startedAt by those nanos and the
  // rules would DENY the write in production (the emulator's
  // serverTimestamp is millis-precise, so the fromMillis form
  // passes here and hides the bug). Build endsAt from the
  // stored startedAt's own seconds + nanoseconds instead, so
  // the equality holds at any server precision. The millis form
  // stays as the fallback for Date/seconds-only values, and
  // deadlineMillis (millis) is what the UI timer displays.
  const startedAtTs = session.startedAt as FirestoreTimestamp | null;
  const endsAt =
    startedAtTs !== null
    && typeof startedAtTs.seconds === 'number'
    && typeof startedAtTs.nanoseconds === 'number'
      ? new Timestamp(startedAtTs.seconds + timeMinutes * 60, startedAtTs.nanoseconds)
      : Timestamp.fromMillis(deadlineMillis);
  try {
    await updateDoc(
      sessionRef,
      buildMockDeadlineUpdate(session.revision, endsAt, deadlineMillis),
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
  const snap = await getDoc(doc(firestore, 'users', uid, 'jobExamSessions', sessionId));
  if (!snap.exists()) return null;
  return normalizeMockSessionDoc(snap.data() as Record<string, unknown>);
}

/** Autosave one mock session (debounced by the caller): only the
 * fields the rules allow to change while in-progress — answers,
 * currentQuestion, lastSyncedAt, updatedAt, revision (exactly
 * stored + 1; a stale patch is rejected by the rules and the
 * caller reloads). Same field shape as practice, but the EXAM
 * collection (jobExamSessions — the practice helper writes to
 * jobSessions and must never be used here). */
export async function autosaveMockSession(
  uid: string,
  sessionId: string,
  patch: { answers: Record<number, unknown>; currentQuestion: number; lastSyncedAt: unknown; updatedAt: unknown; revision: number },
): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'users', uid, 'jobExamSessions', sessionId), {
    answers: patch.answers,
    currentQuestion: patch.currentQuestion,
    lastSyncedAt: patch.lastSyncedAt,
    updatedAt: patch.updatedAt,
    revision: patch.revision,
  });
}

/** Abandon a mock session (time expired, or the student quits):
 * in-progress → 'abandoned' (terminal, frozen — the audit trail
 * of an unfinished mock) + the lock → 'terminal' in ONE batch,
 * so a new exam can start for the pattern. Returns the final
 * status: 'abandoned', or 'submitted' when another tab already
 * submitted it. */
export async function abandonMockSession(
  uid: string,
  sessionId: string,
): Promise<'abandoned' | 'submitted'> {
  const firestore = requireDb();
  const sessionRef = doc(firestore, 'users', uid, 'jobExamSessions', sessionId);
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
  const batch = writeBatch(firestore);
  batch.update(sessionRef, buildMockSessionAbandonUpdate(storedRevision));
  // Release the lock with the session (the rules require the
  // post-batch session to be submitted/abandoned — this batch
  // makes it abandoned). A missing lock (never happens for a
  // session created by this lib — start is atomic) is skipped,
  // never fatal.
  const examSlug = String(stored.examSlug ?? '');
  if (examSlug.length > 0) {
    const lockSnap = await getDoc(doc(firestore, 'jobExamUserLocks', examLockId(uid, examSlug)));
    if (lockSnap.exists() && (lockSnap.data() as Record<string, unknown>).status === 'in_progress') {
      batch.update(doc(firestore, 'jobExamUserLocks', examLockId(uid, examSlug)), {
        status: 'terminal',
        updatedAt: serverTimestamp(),
      });
    }
  }
  await batch.commit();
  // Audit (Step 9 closure, item 11): best-effort, never blocks.
  void logMockAuditEvent(uid, {
    event: 'mock_abandoned',
    examSlug,
    mockId: String(stored.mockId ?? ''),
    sessionId,
    bundleId: String(stored.bundleId ?? ''),
  });
  return 'abandoned';
}

/* ------------------------------------------------------------------ */
/* Mock submit — Design G (§4.2 adapted to the P0-06 receipt gate)    */
/* ------------------------------------------------------------------ */

export interface SubmitMockInput {
  uid: string;
  sessionId: string;
  /** Local session (answers come from here — the fresh-read only
   * supplies the revision + server startedAt + stored
   * questionSetId/bundleVersion). */
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
 * Submit a mock attempt — Design G, exam collections:
 *   1. fresh-read the exam session (local state may be stale);
 *      it must be in-progress (or already submitted → orphan
 *      recovery),
 *   2. session → 'submitted' + lock → 'terminal' in ONE batch
 *      (answers frozen; the receipt can only anchor to this now),
 *   3. receipt create, best-effort (purpose 'exam_review',
 *      bundleVersion = the session's STORED generation — a
 *      retake's receipt may already exist; the old fresh receipt
 *      is then reused; a failure here never blocks the key read,
 *      the rules decide),
 *   4. key read (fresh exam_review receipt + submitted exam
 *      session anchor),
 *   5. score from the mock's rulesSnapshot (never live config),
 *   6. build + validate the attempt doc (lib mirror of the rules
 *      — questionSetId + bundleVersion from the STORED session,
 *      never the definition's current pointer),
 *   7. IDEMPOTENT RECOVERY: an already-existing exam attempt is
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
  const sessionRef = doc(firestore, 'users', input.uid, 'jobExamSessions', input.sessionId);
  const attemptRef = doc(firestore, 'users', input.uid, 'jobExamAttempts', input.sessionId);
  const bundleId = input.bundle.docId;

  // 1. Fresh-read the session: the stored revision is the only safe
  // base for the submit transition (local state may lag autosaves);
  // the stored questionSetId/bundleVersion are the freeze values
  // the attempt is bound to.
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
  const storedQuestionSetId = typeof stored.questionSetId === 'string' && stored.questionSetId.length > 0
    ? stored.questionSetId
    : input.mock.questionSetId;
  const storedBundleVersion = typeof stored.bundleVersion === 'number' && stored.bundleVersion >= 1
    ? stored.bundleVersion
    : input.bundle.bundleVersion;

  // Helper: score + build + validate + create-or-recover the attempt.
  // Used both for the fresh submit and for the orphan recovery
  // (session already submitted, attempt missing).
  const scoreAndCreateAttempt = async (): Promise<{ attemptId: string; result: JobAttemptResult }> => {
    // 3. Receipt (best-effort — see header). A retake RE-ISSUES
    // the receipt (Step 9 closure, open question 1): the receipt
    // doc-ID is {uid}_{bundleId}, so setDoc on an existing receipt
    // is an UPDATE — allowed only as an anchored re-issue (new
    // submitted session, fresh createdAt). The old window is
    // replaced, never extended silently.
    try {
      await setDoc(
        doc(firestore, 'jobReceipts', `${input.uid}_${bundleId}`),
        buildMockReceiptDoc(input.uid, bundleId, input.sessionId, storedBundleVersion),
      );
    } catch {
      // The re-issue was denied (anchor not submitted, or stale
      // data) — the key read below uses whatever fresh receipt the
      // rules accept; if none is fresh, it throws the honest error.
    }
    // 4. Key read (the rules gate it on the fresh receipt).
    let key: JobQuestionKey | null;
    try {
      key = await loadMockKey(bundleId);
    } catch {
      void logMockAuditEvent(input.uid, {
        event: 'mock_submit_failed',
        examSlug: input.mock.examSlug,
        mockId,
        sessionId: input.sessionId,
        bundleId,
        detail: 'key-unreadable',
      });
      throw new Error('উত্তরের চাবি পড়া যায়নি — জমার অনুমতির মেয়াদ শেষ হতে পারে। নতুন করে মক শুরু করুন।');
    }
    if (key === null) {
      void logMockAuditEvent(input.uid, {
        event: 'mock_submit_failed',
        examSlug: input.mock.examSlug,
        mockId,
        sessionId: input.sessionId,
        bundleId,
        detail: 'key-missing',
      });
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
      questionSetId: storedQuestionSetId,
      bundleVersion: storedBundleVersion,
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
      questionSetId: storedQuestionSetId,
      bundleVersion: storedBundleVersion,
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

  // 2. Session → 'submitted' + lock → 'terminal' in ONE batch
  // (skip when already submitted — orphan recovery: the attempt
  // is created alone, and the lock is already terminal).
  if (stored.status === 'in-progress') {
    const batch = writeBatch(firestore);
    batch.update(sessionRef, buildMockSessionSubmitUpdate(storedRevision));
    const examSlug = String(stored.examSlug ?? '');
    if (examSlug.length > 0) {
      const lockSnap = await getDoc(doc(firestore, 'jobExamUserLocks', examLockId(input.uid, examSlug)));
      if (lockSnap.exists() && (lockSnap.data() as Record<string, unknown>).status === 'in_progress') {
        batch.update(doc(firestore, 'jobExamUserLocks', examLockId(input.uid, examSlug)), {
          status: 'terminal',
          updatedAt: serverTimestamp(),
        });
      }
    }
    try {
      await batch.commit();
    } catch {
      const retry = await getDoc(sessionRef);
      if (!retry.exists() || (retry.data() as Record<string, unknown>).status !== 'submitted') {
        throw new Error('জমা দেওয়া যায়নি — সেশন জমা করা যায়নি। আবার চেষ্টা করুন।');
      }
    }
  }
  const submitted = await scoreAndCreateAttempt();
  // Audit (Step 9 closure, item 11): best-effort, never blocks.
  void logMockAuditEvent(input.uid, {
    event: 'mock_submitted',
    examSlug: input.mock.examSlug,
    mockId,
    sessionId: input.sessionId,
    bundleId,
  });
  return submitted;
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
 * submittedAt desc — the M1 history index, now on
 * jobExamAttempts). The mockId filter is client-side: a second
 * composite index is not worth it for a per-student history list. */
export async function listMockAttempts(
  uid: string,
  maxResults = 20,
): Promise<MockAttemptWithId[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'jobExamAttempts'),
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
  const snap = await getDoc(doc(firestore, 'users', uid, 'jobExamAttempts', attemptId));
  if (!snap.exists()) return null;
  return snap.data() as Record<string, unknown>;
}
