// Eduvelto — CEO Panel data (owner-only, 21 Nov 2026).
//
// HONESTY RULES (binding — the CEO mockups are full of fake sample
// numbers: 1.28M users, 8.72M views, 520K tests, ৳2.48L revenue,
// 24 team members, 12,842 verified content, "Platform Rank #1").
// The real platform today: ~4 users, 609 books, 1014 exams, 23,259
// questions (effective after the 25 Nov 2026 NCTB crons — 23,346 in
// the 24 Nov backup minus the 87 questions the crons remove), ৳0 revenue, 1 staff account (the owner), 0 verified
// teachers, no view/engagement/retention tracking, no team system on
// main, no paid products. Every number on the CEO screens comes from
// a live count() attempt below, or from the LAST-VERIFIED constants
// (labelled with their check date in the UI). A failed live count
// NEVER falls back to a mockup number — it shows the last-verified
// value with its source, or hides the tile.

import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import type { CollectionReference, Firestore, Query, DocumentData } from 'firebase/firestore';

/** Last verified by the website audit against the 24 Nov 2026 pre-deploy snapshot (7,105 docs) + live /library check, 24 Nov 2026.
 * `questions` is the POST-CRON figure (23,259), effective after the
 * 25 Nov 2026 NCTB crons remove 87 questions from the 24 Nov backup
 * total of 23,346 — see the M8 prepared script in
 * full-site-audit-fixes-evidence/scripts/, which recomputes it from
 * live data after the 15:30 cron. */
export const LAST_VERIFIED_INVENTORY = {
  books: 609,
  exams: 1014,
  questions: 23259,
  /** Human-readable source shown under every fallback value. */
  checkedBn: '২৪ নভেম্বর ২০২৬ যাচাই করা',
  checkedEn: 'verified 24 Nov 2026',
} as const;

export interface CeoCounts {
  /** Live users count, or null when count() failed (quota). */
  users: number | null;
  /** Live Published books count, or the last-verified 609. */
  books: number;
  booksLive: boolean;
  /** Live Published quizzes count, or the last-verified 1014. */
  exams: number;
  examsLive: boolean;
  /** Questions are inside quiz documents — no live count exists. */
  questions: number;
  /** Live pending teacher applications, or null when count() failed. */
  pendingVerifications: number | null;
}

async function tryCount(
  q: Query<DocumentData, DocumentData> | CollectionReference<DocumentData, DocumentData>,
): Promise<number | null> {
  try {
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    // count() fails live when the Spark daily quota is exhausted
    // (audit H1) — the caller shows the fallback, never a fake number.
    return null;
  }
}

export async function getCeoCounts(db: Firestore): Promise<CeoCounts> {
  const [users, books, exams, pending] = await Promise.all([
    tryCount(collection(db, 'users')),
    tryCount(query(collection(db, 'books'), where('reviewStatus', '==', 'Published'))),
    tryCount(query(collection(db, 'quizzes'), where('reviewStatus', '==', 'Published'))),
    tryCount(query(collection(db, 'teacherVerifications'), where('status', '==', 'pending'))),
  ]);
  return {
    users,
    books: books ?? LAST_VERIFIED_INVENTORY.books,
    booksLive: books !== null,
    exams: exams ?? LAST_VERIFIED_INVENTORY.exams,
    examsLive: exams !== null,
    questions: LAST_VERIFIED_INVENTORY.questions,
    pendingVerifications: pending,
  };
}
