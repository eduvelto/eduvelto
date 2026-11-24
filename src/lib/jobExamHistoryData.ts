/**
 * Eduvelto Job Preparation — per-student, per-exam exposure
 * history (design-live-exam-dashboard.md §3.6).
 *
 * Firestore layer for `users/{uid}/examHistory/{examId}` — the
 * collection agent A already landed (rules + backup coverage).
 * ONE doc per student per exam: `recentQuestionIds`
 * (most-recent-first, bounded) + `lastAttemptNo` (only ever
 * increases). The doc carries IDs + attempt numbers ONLY — never
 * answers, scores, or question text (§4).
 *
 * COLLECTION NAME (deliberate reuse, not a second history):
 * the design doc §3.7 proposed `jobExamHistory`, but agent A
 * already shipped `examHistory` with rules + backup coverage
 * for the same purpose. Creating a parallel `jobExamHistory`
 * collection would leave two collections meaning the same
 * thing and would need a rules match block the compiled-rules
 * budget cannot afford. This module reads/writes `examHistory`.
 *
 * IDEMPOTENCY (§3.6): the design wants `lastMergedAttemptId`
 * on the history doc, but the committed rules allow ONLY the
 * keys `recentQuestionIds` / `lastAttemptNo` / `updatedAt` —
 * the marker field cannot be stored without a rules change
 * the budget forbids. The merge is therefore idempotent by
 * CONSTRUCTION + fingerprint:
 *   1. the ID list merge is a deduped prepend — merging the
 *      same set twice yields the same list;
 *   2. `isAlreadyMergedForAttempt()` skips the write when the
 *      history's front already equals the attempt's ordered
 *      IDs (the state a completed merge leaves behind), so the
 *      `lastAttemptNo` clock is not bumped twice;
 *   3. an in-memory set of merged session IDs guards the same
 *      tab's double-submit path.
 * Residual (documented): a student who retakes the SAME frozen
 * variant twice in a row produces the same fingerprint, so the
 * second merge is skipped and `lastAttemptNo` stalls by one —
 * the exposure state is identical either way (the same IDs are
 * already most-recent), so repetition avoidance is unaffected.
 *
 * The merge NEVER blocks an exam: `recordExamExposure()` is
 * best-effort (submit/abandon catch and ignore failures), and
 * NO history write happens at START (§3.6(1) — a history
 * failure must never block an exam start).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  mergeExposureHistory,
  type ExposureHistory,
} from './jobBankSelection';
import { JOB_EXAM_HISTORY_MAX_EXPOSURES } from './jobRepetition';

/** Firestore not configured (gate G1) — callers show the honest
 * reason instead of crashing. */
function requireDb(): NonNullable<typeof db> {
  if (!db) throw new Error('Firebase কনফিগার করা হয়নি।');
  return db;
}

/** Doc-ID for one student's history on one exam (the exam slug
 * IS the doc ID — Bank post slugs share the 'bank' history:
 * repetition avoidance is scoped to studentId + examId, and a
 * post is a config of the Bank exam, not a separate exam). */
export function examHistoryDocId(examSlug: string): string {
  return examSlug === 'bank-senior-officer' || examSlug === 'bank-assistant-director'
    ? 'bank'
    : examSlug;
}

function isValidHistoryDoc(data: unknown): data is ExposureHistory & { examId: string } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.examId === 'string'
    && Array.isArray(d.recentQuestionIds)
    && d.recentQuestionIds.every((id) => typeof id === 'string')
    && Number.isInteger(d.lastAttemptNo)
    && (d.lastAttemptNo as number) >= 0
  );
}

/** Load one student's exposure history for an exam. Null when
 * there is none yet (first attempt — every candidate is unseen)
 * or when the stored doc is malformed (defensive: a corrupt
 * history must never block an exam start). */
export async function loadExamHistory(
  uid: string,
  examSlug: string,
): Promise<ExposureHistory | null> {
  const firestore = requireDb();
  const snap = await getDoc(doc(firestore, 'users', uid, 'examHistory', examHistoryDocId(examSlug)));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (!isValidHistoryDoc(data)) return null;
  return {
    examId: data.examId,
    recentQuestionIds: [...(data.recentQuestionIds as string[])].slice(0, JOB_EXAM_HISTORY_MAX_EXPOSURES),
    lastAttemptNo: data.lastAttemptNo as number,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * Fingerprint guard (§3.6 idempotency, rules-shaped): true when
 * the history's front already equals the attempt's ordered IDs
 * — the exact state a completed merge of THIS attempt leaves
 * behind. Pure (unit-tested); the transaction calls it before
 * writing.
 */
export function isAlreadyMergedForAttempt(
  history: ExposureHistory | null,
  questionIds: string[],
): boolean {
  if (!history || questionIds.length === 0) return false;
  const front = history.recentQuestionIds.slice(0, questionIds.length);
  if (front.length !== questionIds.length) return false;
  return front.every((id, i) => id === questionIds[i]);
}

/** Session IDs merged in this tab (same-tab double-submit guard).
 * Process-local only — the Firestore fingerprint above is the
 * cross-tab/device guard. */
const MERGED_SESSION_IDS = new Set<string>();

/**
 * Merge one completed attempt's question IDs into the exposure
 * history, transactionally (§3.6(2)). Runs at COMPLETION —
 * submit OR abandon (an abandoned session still exposed the
 * student to the questions, §3.6(3)). A session created but
 * never opened still merges: the set was committed and
 * delivered to the client, so the questions count as seen.
 *
 * Returns `{ merged: true }` when the write landed,
 * `{ merged: false, reason }` when it was skipped (already
 * merged / empty set). Throws only on a transaction failure —
 * callers treat that as best-effort (the exam result is already
 * stored; history is a derived index, rebuildable — see
 * `rebuildExamHistory`).
 */
export async function mergeExamHistory(
  uid: string,
  examSlug: string,
  attemptId: string,
  questionIds: string[],
): Promise<{ merged: boolean; reason?: string }> {
  if (questionIds.length === 0) return { merged: false, reason: 'empty-set' };
  if (MERGED_SESSION_IDS.has(attemptId)) return { merged: false, reason: 'already-merged' };
  const firestore = requireDb();
  const ref = doc(firestore, 'users', uid, 'examHistory', examHistoryDocId(examSlug));
  const result = await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(ref);
    const current: ExposureHistory = snap.exists() && isValidHistoryDoc(snap.data())
      ? {
          examId: (snap.data() as Record<string, unknown>).examId as string,
          recentQuestionIds: (snap.data() as Record<string, unknown>).recentQuestionIds as string[],
          lastAttemptNo: (snap.data() as Record<string, unknown>).lastAttemptNo as number,
        }
      : { examId: examHistoryDocId(examSlug), recentQuestionIds: [], lastAttemptNo: 0 };
    if (isAlreadyMergedForAttempt(current, questionIds)) {
      return { merged: false, reason: 'already-merged' } as const;
    }
    const merged = mergeExposureHistory(current, questionIds, JOB_EXAM_HISTORY_MAX_EXPOSURES);
    tx.set(ref, {
      recentQuestionIds: merged.recentQuestionIds,
      lastAttemptNo: merged.lastAttemptNo,
      updatedAt: serverTimestamp(),
    });
    return { merged: true } as const;
  });
  if (result.merged) MERGED_SESSION_IDS.add(attemptId);
  return result;
}

/**
 * Best-effort exposure recording for the submit/abandon paths:
 * never throws, never blocks the exam flow. The history is a
 * DERIVED index — a missed merge is recoverable via
 * `rebuildExamHistory`.
 */
export async function recordExamExposure(
  uid: string,
  examSlug: string,
  attemptId: string,
  questionIds: string[],
): Promise<void> {
  try {
    await mergeExamHistory(uid, examSlug, attemptId, questionIds);
  } catch {
    // Best-effort only (see the header): the exam result is
    // already stored; history can be rebuilt from attempts.
  }
}

/* ------------------------------------------------------------------ */
/* Rebuild (recovery only — no write)                                  */
/* ------------------------------------------------------------------ */

/** One attempt's contribution to a rebuild (oldest → newest
 * order is the caller's job — the fold bumps `lastAttemptNo`
 * once per attempt, in order). */
export interface RebuildAttemptInput {
  submittedAtMillis: number | null;
  questionIds: string[];
}

/**
 * Rebuild an exposure history from stored attempts (pure).
 * The history doc is a DERIVED index over `jobExamAttempts`:
 * if it is ever lost, it is rebuildable from the student's
 * attempts without destroying anything. Attempts are folded
 * oldest → newest; each attempt bumps `lastAttemptNo` once and
 * prepends its IDs (most-recent-first, deduped, bounded).
 */
export function rebuildExposureHistoryFromAttempts(
  examSlug: string,
  attempts: RebuildAttemptInput[],
): ExposureHistory {
  const ordered = [...attempts].sort(
    (a, b) => (a.submittedAtMillis ?? 0) - (b.submittedAtMillis ?? 0),
  );
  let history: ExposureHistory = { examId: examHistoryDocId(examSlug), recentQuestionIds: [], lastAttemptNo: 0 };
  for (const a of ordered) {
    if (a.questionIds.length === 0) continue;
    history = mergeExposureHistory(history, a.questionIds, JOB_EXAM_HISTORY_MAX_EXPOSURES);
  }
  return history;
}

/**
 * Rebuild one student's exposure history for an exam from
 * their STORED mock attempts (recovery only — returns the
 * rebuilt history, writes nothing). Reads at most 50 mock
 * attempts, newest first, then folds oldest → newest.
 */
export async function rebuildExamHistory(
  uid: string,
  examSlug: string,
): Promise<ExposureHistory> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(
      collection(firestore, 'users', uid, 'jobExamAttempts'),
      where('kind', '==', 'mock'),
      orderBy('submittedAt', 'desc'),
      limit(50),
    ),
  );
  const prefix = `full__${examHistoryDocId(examSlug)}__`;
  const inputs: RebuildAttemptInput[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const mockId = typeof data.mockId === 'string' ? data.mockId : '';
    if (!mockId.startsWith(prefix)) continue;
    const answers = Array.isArray(data.answers) ? (data.answers as Array<Record<string, unknown>>) : [];
    const questionIds = answers
      .map((a) => (typeof a.questionId === 'string' ? a.questionId : ''))
      .filter((id) => id.length > 0);
    const submittedAt = data.submittedAt as { toMillis?: () => number; seconds?: number } | null;
    const submittedAtMillis =
      submittedAt && typeof submittedAt.toMillis === 'function'
        ? submittedAt.toMillis()
        : typeof submittedAt?.seconds === 'number'
          ? submittedAt.seconds * 1000
          : null;
    inputs.push({ submittedAtMillis, questionIds });
  }
  return rebuildExposureHistoryFromAttempts(examSlug, inputs);
}
