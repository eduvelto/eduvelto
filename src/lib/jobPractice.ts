// Eduvelto — Job Preparation practice: Firestore operations (Step 8).
//
// Thin Firestore layer for the practice engine UI. Pure scoring /
// session-shape logic lives in ./jobEngine.ts; this file only talks
// to Firestore (bundle + key reads, session create/autosave/submit,
// attempt create/read). No lib in this file guesses answers —
// scoring always goes through scorePracticeAttempt (key required).
//
// RULES CONTRACT (Step 8, team/job-rules-step8.md):
//   session create (in-progress, endsAt null) → autosave while
//   in-progress (answers/currentQuestion/lastSyncedAt/updatedAt
//   only) → session submitted FIRST → attempt create (same doc-ID,
//   status 'submitted', full fields) → receipt (mock keys, Step 9).
// Practice (topic/previous) bundle keys are readable by a signed-in
// student directly — no receipt is needed for practice results
// (the attempt stores correctText, so the result page never
// re-reads the key). The submit flow below therefore does NOT
// create a receipt — that is the Step 9 mock path, not practice.
//
// LANGUAGE: all UI-facing messages are Bangla (one-language rule).

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  buildJobAttemptDoc,
  createPracticeSession,
  jobExamPattern,
  scorePracticeAttempt,
  validateAttemptResult,
  validatePracticeSession,
  type JobAttemptResult,
  type JobPracticeSessionDoc,
} from './jobEngine';
import type { JobQuestionBundle, JobQuestionKey } from './jobQuestions';

/** Firestore not configured (gate G1) — pages show the honest
 * reason instead of crashing. */
function requireDb(): NonNullable<typeof db> {
  if (!db) throw new Error('Firebase কনফিগার করা হয়নি — অনুশীলন এখন চালানো যাবে না।');
  return db;
}

/** Minimal shape-check for a key doc read from Firestore (the
 * importer validates the full shape at seed time; here we only
 * need the answers array to be usable for scoring). */
function isUsableKey(data: Record<string, unknown>): boolean {
  if (!Array.isArray(data.answers)) return false;
  return (data.answers as unknown[]).every((a) => {
    const r = a as Record<string, unknown>;
    return (
      typeof r === 'object'
      && r !== null
      && Number.isInteger(r.n)
      && typeof r.questionId === 'string'
      && typeof r.correctLetter === 'string'
      && (r.correctText === null || typeof r.correctText === 'string')
    );
  });
}

function isUsableBundle(data: Record<string, unknown>): boolean {
  return (
    typeof data.titleBn === 'string'
    && typeof data.examSlug === 'string'
    && typeof data.status === 'string'
    && typeof data.kind === 'string'
    && Array.isArray(data.questions)
  );
}

/** A bundle with its Firestore doc ID attached (the deterministic
 * topic__/mock__ ID — the page loads by this ID, and the session /
 * attempt / receipt all reference it). */
export type PracticeBundleWithId = JobQuestionBundle & { docId: string };

/** Load one bundle by ID. Returns null when missing or unusable
 * (the page shows the honest not-found state). */
export async function loadPracticeBundle(bundleId: string): Promise<PracticeBundleWithId | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'jobQuestionBundles', bundleId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (!isUsableBundle(data)) return null;
  return { ...(data as unknown as JobQuestionBundle), docId: snap.id };
}

/** Load the answer key for a bundle. Returns null when missing or
 * unusable — practice cannot run without a key (scoring refuses
 * to guess), so the page shows an honest error. */
export async function loadBundleKey(bundleId: string): Promise<JobQuestionKey | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'jobQuestionKeys', bundleId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (!isUsableKey(data)) return null;
  return data as unknown as JobQuestionKey;
}

/** Published practice bundles for one exam (kind topic/previous).
 * Two == filters only (examSlug + status) — no composite index
 * needed; kind is filtered client-side. Empty bank ⇒ []. */
export async function listPublishedPracticeBundles(examSlug: string): Promise<PracticeBundleWithId[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'jobQuestionBundles'),
      where('examSlug', '==', examSlug),
      where('status', '==', 'published'),
    ),
  );
  const out: PracticeBundleWithId[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    if (!isUsableBundle(data)) continue;
    if (data.kind !== 'topic' && data.kind !== 'previous') continue;
    out.push({ ...(data as unknown as JobQuestionBundle), docId: d.id });
  }
  out.sort((a, b) => a.titleBn.localeCompare(b.titleBn, 'bn'));
  return out;
}

/** Normalize a session doc read back from Firestore: answers-map
 * keys arrive as strings ('1','2'); the engine works with numeric
 * question numbers. Missing answer fields are filled honestly. */
export function normalizeSessionDoc(data: Record<string, unknown>): JobPracticeSessionDoc {
  const rawAnswers = (data.answers ?? {}) as Record<string, Record<string, unknown>>;
  const answers: Record<number, { selected: 'A' | 'B' | 'C' | 'D' | null; markedForReview: boolean; timeSpentSeconds: number }> = {};
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
    kind: 'practice',
    mockId: null,
    bundleId: String(data.bundleId ?? ''),
    examSlug: String(data.examSlug ?? ''),
    status: data.status === 'submitted' || data.status === 'abandoned' ? data.status : 'in-progress',
    startedAt: data.startedAt ?? null,
    endsAt: null,
    questionRefs: Array.isArray(data.questionRefs)
      ? (data.questionRefs as { bundleId: string; n: number; questionId: string }[])
      : [],
    answers,
    currentQuestion: typeof data.currentQuestion === 'number' && data.currentQuestion >= 1 ? data.currentQuestion : 1,
    lastSyncedAt: data.lastSyncedAt ?? null,
    clientEndsAtMillis: null,
    submittedAt: data.submittedAt ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function timestampToMillis(t: unknown): number | null {
  if (t === null || t === undefined) return null;
  const v = t as Timestamp;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  return null;
}

/** Find the student's latest in-progress session for a bundle
 * (refresh-restore, Step 2 §4.6). Two == filters — no composite
 * index; the latest is picked client-side. Returns null when
 * there is none. */
export async function findResumableSession(
  uid: string,
  bundleId: string,
): Promise<{ sessionId: string; session: JobPracticeSessionDoc; startedAtMillis: number } | null> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'jobSessions'),
      where('bundleId', '==', bundleId),
      where('status', '==', 'in-progress'),
    ),
  );
  let best: { sessionId: string; session: JobPracticeSessionDoc; startedAtMillis: number } | null = null;
  for (const d of snap.docs) {
    const session = normalizeSessionDoc(d.data() as Record<string, unknown>);
    if (session.kind !== 'practice') continue;
    if (validatePracticeSession(session).length > 0) continue;
    const startedAtMillis = timestampToMillis(session.startedAt) ?? 0;
    if (!best || startedAtMillis > best.startedAtMillis) {
      best = { sessionId: d.id, session, startedAtMillis };
    }
  }
  return best;
}

/** Start a new practice session: auto-ID, engine-built doc, one
 * setDoc. Returns the session ID + the local session object +
 * the client-side start time (Date.now at creation). */
export async function startPracticeSession(
  uid: string,
  bundle: PracticeBundleWithId,
): Promise<{ sessionId: string; session: JobPracticeSessionDoc; startedAtMillis: number }> {
  const firestore = requireDb();
  const ref = doc(collection(firestore, 'users', uid, 'jobSessions'));
  const questionRefs = bundle.questions.map((q) => ({ bundleId: bundle.docId, n: q.n, questionId: q.questionId }));
  const session = createPracticeSession({
    sessionId: ref.id,
    bundleId: bundle.docId,
    examSlug: bundle.examSlug,
    questionRefs,
  });
  await setDoc(ref, session as unknown as Record<string, unknown>);
  return { sessionId: ref.id, session, startedAtMillis: Date.now() };
}

/** Autosave one session (debounced by the caller): only the four
 * fields the rules allow to change while in-progress. */
export async function autosaveSession(
  uid: string,
  sessionId: string,
  patch: { answers: Record<number, unknown>; currentQuestion: number; lastSyncedAt: unknown; updatedAt: unknown },
): Promise<void> {
  const firestore = requireDb();
  await updateDoc(doc(firestore, 'users', uid, 'jobSessions', sessionId), {
    answers: patch.answers,
    currentQuestion: patch.currentQuestion,
    lastSyncedAt: patch.lastSyncedAt,
    updatedAt: patch.updatedAt,
  });
}

export interface SubmitPracticeInput {
  uid: string;
  sessionId: string;
  session: JobPracticeSessionDoc;
  bundle: PracticeBundleWithId;
  bundleId: string;
  key: JobQuestionKey;
  /** Per-question answers from the session (n, questionId,
   * selected, timeSpentSeconds). */
  answers: Array<{ n: number; questionId: string; selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSeconds?: number }>;
  startedAtMillis: number;
  submittedAtMillis: number;
}

/**
 * Submit a practice attempt — the full Step 8 flow in the order
 * the rules enforce:
 *   1. score (key required — never guessed),
 *   2. build + validate the attempt doc (lib mirror of the rules),
 *   3. session → 'submitted' FIRST (session gate),
 *   4. attempt create (same doc-ID, status 'submitted').
 * No receipt is created (practice keys need none — see header).
 * Returns the attempt ID (= session ID) + the result.
 */
export async function submitPracticeAttempt(
  input: SubmitPracticeInput,
): Promise<{ attemptId: string; result: JobAttemptResult }> {
  const firestore = requireDb();
  const pattern = jobExamPattern(input.bundle.examSlug);
  if (!pattern) {
    throw new Error(`এই পরীক্ষার ধরন (pattern) পাওয়া যায়নি — জমা দেওয়া যাবে না।`);
  }
  const result = scorePracticeAttempt({
    bundle: input.bundle,
    key: input.key,
    answers: input.answers,
    pattern,
    startedAtMillis: input.startedAtMillis,
    submittedAtMillis: input.submittedAtMillis,
  });
  const subjectId = input.bundle.questions[0]?.subjectId ?? null;
  const attemptDoc = buildJobAttemptDoc({
    sessionId: input.sessionId,
    session: input.session,
    result,
    bundleId: input.bundleId,
    examSlug: input.bundle.examSlug,
    subjectId,
    topicId: input.bundle.topicId ?? null,
    kind: 'practice',
    bundleVersion: input.bundle.bundleVersion,
    userId: input.uid,
  });
  const problems = validateAttemptResult(attemptDoc);
  if (problems.length > 0) {
    throw new Error(`জমা দেওয়া যায়নি — ${problems[0]}`);
  }
  // Session gate: the session must be 'submitted' BEFORE the
  // attempt is created (rules enforce this order).
  await updateDoc(doc(firestore, 'users', input.uid, 'jobSessions', input.sessionId), {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(
    doc(firestore, 'users', input.uid, 'jobAttempts', input.sessionId),
    attemptDoc as unknown as Record<string, unknown>,
  );
  return { attemptId: input.sessionId, result };
}

/** Load one submitted attempt (owner or Moderator via ?uid).
 * Returns null when missing. The stored answers carry
 * correctText, so the result page never re-reads the key. */
export async function loadJobAttempt(
  ownerUid: string,
  attemptId: string,
): Promise<Record<string, unknown> | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'users', ownerUid, 'jobAttempts', attemptId));
  if (!snap.exists()) return null;
  return snap.data() as Record<string, unknown>;
}

/** Load one session (same ID as its attempt) — for the result
 * page's "marked for review" filter. Returns null when missing. */
export async function loadJobSession(
  ownerUid: string,
  sessionId: string,
): Promise<JobPracticeSessionDoc | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'users', ownerUid, 'jobSessions', sessionId));
  if (!snap.exists()) return null;
  return normalizeSessionDoc(snap.data() as Record<string, unknown>);
}
