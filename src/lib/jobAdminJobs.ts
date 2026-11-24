/**
 * Eduvelto Job Preparation — admin data for the Job Preparation
 * System (design-grades-written-previous-admin.md §5).
 *
 * Same pattern as jobAdminCirculars.ts: ONE capped query (limit
 * 100), client-side grouping/sort — no composite index, no
 * unbounded admin reads (Spark: 50k reads/day). Counts are exact
 * up to the cap; beyond it the tile says "100+" (never a guessed
 * number). AdminGuard already limits /admin/* to the owner in v1.
 *
 * Workflow rules (§5.3): no self-approval ever (author ≠ verifier
 * ≠ publisher); every publish / reject / return / config change
 * writes an audit entry (on the doc's own auditTrail — the
 * adminActions log is owner-read-only); correction requests are
 * first-class (a question with an open correction is blocked from
 * new bundles until resolved).
 */

import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export const ADMIN_JOBS_COUNT_CAP = 100;
export const ADMIN_JOBS_PAGE_SIZE = 25;

export interface AdminJobsCounts {
  questionsDraft: number;
  questionsUnderReview: number;
  questionsPublished: number;
  writtenDraft: number;
  writtenUnderReview: number;
  writtenPublished: number;
  historicalVerified: number;
  historicalPartiallyVerified: number;
  historicalUnverified: number;
  approvalsPending: number;
  capped: boolean;
}

const ZERO_COUNTS: AdminJobsCounts = {
  questionsDraft: 0,
  questionsUnderReview: 0,
  questionsPublished: 0,
  writtenDraft: 0,
  writtenUnderReview: 0,
  writtenPublished: 0,
  historicalVerified: 0,
  historicalPartiallyVerified: 0,
  historicalUnverified: 0,
  approvalsPending: 0,
  capped: false,
};

/** Queue counts for the new admin hub tiles (§5.1). */
export async function loadAdminJobsCounts(): Promise<AdminJobsCounts> {
  const counts = { ...ZERO_COUNTS };
  if (!db) return counts;
  const [questions, written, historical] = await Promise.all([
    getDocs(query(collection(db, 'jobQuestions'), limit(ADMIN_JOBS_COUNT_CAP))),
    getDocs(query(collection(db, 'writtenQuestions'), limit(ADMIN_JOBS_COUNT_CAP))),
    getDocs(query(collection(db, 'historicalQuestions'), limit(ADMIN_JOBS_COUNT_CAP))),
  ]);
  counts.capped =
    questions.docs.length >= ADMIN_JOBS_COUNT_CAP ||
    written.docs.length >= ADMIN_JOBS_COUNT_CAP ||
    historical.docs.length >= ADMIN_JOBS_COUNT_CAP;
  for (const d of questions.docs) {
    const data = d.data() as Record<string, unknown>;
    const review = String(data.reviewStatus ?? '');
    const status = String(data.status ?? '');
    if (review === 'Under Review') counts.questionsUnderReview++;
    if (status === 'published') counts.questionsPublished++;
    if (status === 'draft') counts.questionsDraft++;
  }
  for (const d of written.docs) {
    const data = d.data() as Record<string, unknown>;
    const review = String(data.reviewStatus ?? '');
    const status = String(data.status ?? '');
    if (review === 'Under Review') counts.writtenUnderReview++;
    if (status === 'published') counts.writtenPublished++;
    if (status === 'draft') counts.writtenDraft++;
  }
  for (const d of historical.docs) {
    const data = d.data() as Record<string, unknown>;
    const v = String(data.verificationStatus ?? '');
    if (v === 'Verified') counts.historicalVerified++;
    else if (v === 'Partially verified') counts.historicalPartiallyVerified++;
    else counts.historicalUnverified++;
  }
  // Approval queue (§5.1 #9): MCQ + written questions sitting in
  // 'Under Review' — the three-level publication model (Level 1
  // Verified for scored mocks / Level 2 Reviewed for practice only
  // / Level 3 Draft, not scored).
  counts.approvalsPending = counts.questionsUnderReview + counts.writtenUnderReview;
  return counts;
}

export interface AdminListItem {
  docId: string;
  titleBn: string;
  titleEn: string;
  status: string;
  reviewStatus: string;
  updatedAtMillis: number | null;
}

/** One page of jobQuestions for the admin questions list (§5.1 #1).
 * The duplicate flag surfaces from `duplicateCandidates` (§5.1 #2 —
 * the lib hash exists; this list shows the flag before save). */
export async function listAdminJobQuestions(args?: {
  reviewStatus?: string | null;
  pageSize?: number;
}): Promise<AdminListItem[]> {
  if (!db) return [];
  const size = args?.pageSize ?? ADMIN_JOBS_PAGE_SIZE;
  const constraints = [];
  if (args?.reviewStatus) constraints.push(where('reviewStatus', '==', args.reviewStatus));
  const snap = await getDocs(query(collection(db, 'jobQuestions'), ...constraints, limit(size)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const candidates = Array.isArray(data.duplicateCandidates) ? data.duplicateCandidates.length : 0;
    return {
      docId: d.id,
      titleBn: typeof data.question === 'string' ? data.question.slice(0, 120) : d.id,
      titleEn: typeof data.question === 'string' ? data.question.slice(0, 120) : d.id,
      status: String(data.status ?? ''),
      reviewStatus:
        candidates > 0
          ? `${String(data.reviewStatus ?? '')} · ${candidates} duplicate candidate(s)`
          : String(data.reviewStatus ?? ''),
      updatedAtMillis: null,
    };
  });
}

/** One page of writtenQuestions for the admin written list (§5.1 #8). */
export async function listAdminWrittenQuestions(args?: {
  reviewStatus?: string | null;
  pageSize?: number;
}): Promise<AdminListItem[]> {
  if (!db) return [];
  const size = args?.pageSize ?? ADMIN_JOBS_PAGE_SIZE;
  const constraints = [];
  if (args?.reviewStatus) constraints.push(where('reviewStatus', '==', args.reviewStatus));
  const snap = await getDocs(query(collection(db, 'writtenQuestions'), ...constraints, limit(size)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      docId: d.id,
      titleBn: typeof data.questionTextBn === 'string' ? data.questionTextBn.slice(0, 120) : d.id,
      titleEn: typeof data.questionTextEn === 'string' ? data.questionTextEn.slice(0, 120) : d.id,
      status: String(data.status ?? ''),
      reviewStatus: String(data.reviewStatus ?? ''),
      updatedAtMillis: null,
    };
  });
}

/** One page of historicalQuestions for the admin previous-question list (§5.1 #7). */
export async function listAdminHistoricalQuestions(args?: {
  verificationStatus?: string | null;
  pageSize?: number;
}): Promise<AdminListItem[]> {
  if (!db) return [];
  const size = args?.pageSize ?? ADMIN_JOBS_PAGE_SIZE;
  const constraints = [];
  if (args?.verificationStatus) constraints.push(where('verificationStatus', '==', args.verificationStatus));
  const snap = await getDocs(query(collection(db, 'historicalQuestions'), ...constraints, limit(size)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      docId: d.id,
      titleBn: typeof data.sourceReference === 'string' ? data.sourceReference.slice(0, 120) : d.id,
      titleEn: typeof data.sourceReference === 'string' ? data.sourceReference.slice(0, 120) : d.id,
      status: String(data.verificationStatus ?? ''),
      reviewStatus: `${String(data.examId ?? '')} ${String(data.examYear ?? '')}`,
      updatedAtMillis: null,
    };
  });
}

/** No-self-approval guard (§5.3): the publisher/verifier is never
 * the author. Returns the problem, or null when the approval is
 * allowed. */
export function canApprove(args: { authorUid: string | null; lastEditedBy: string | null; approverUid: string }): string | null {
  if (args.approverUid === args.authorUid) return 'no-self-approval: the approver must not be the author';
  if (args.approverUid === args.lastEditedBy) return 'no-self-approval: the approver must not be the last editor';
  return null;
}
