// Eduvelto — Referral leaderboard query (28 Nov 2026, /free-quiz share).
//
// Reads the `quizReferrals` collection (owner/admin only under the
// rules) ordered by visitor count, highest first. The query itself
// does the ordering — Firestore sorts server-side — and
// sortReferralsByCount is the same ordering as a pure function so
// the unit test can prove the ranking without Firestore.
//
// HONESTY: counts are a guide, not fraud-proof. Anyone can open a
// referral link, and there is no CAPTCHA or rate-limit on the free
// Spark plan, so a count can be inflated by repeated visits. Winners
// are picked by count PLUS a sanity check, never by count alone.
// The leaderboard is owner-only, never public.

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';

export interface ReferralRow {
  code: string;
  name: string;
  count: number;
  /** Last visit; null when the doc has no lastSeen yet. */
  lastSeen: Timestamp | null;
}

export const REFERRAL_LEADERBOARD_LIMIT = 100;

/** Visitor count, highest first; ties break by most recent visit, then code. */
export function sortReferralsByCount(rows: ReferralRow[]): ReferralRow[] {
  const lastSeenMs = (r: ReferralRow): number => (r.lastSeen ? r.lastSeen.toMillis() : 0);
  return [...rows].sort(
    (a, b) =>
      b.count - a.count || lastSeenMs(b) - lastSeenMs(a) || a.code.localeCompare(b.code),
  );
}

/** The leaderboard query: quizReferrals ordered by count desc. */
export async function fetchReferralLeaderboard(db: Firestore): Promise<ReferralRow[]> {
  const snap = await getDocs(
    query(
      collection(db, 'quizReferrals'),
      orderBy('count', 'desc'),
      limit(REFERRAL_LEADERBOARD_LIMIT),
    ),
  );
  const rows: ReferralRow[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      code: d.id,
      name: typeof data.name === 'string' ? data.name : '—',
      count: typeof data.count === 'number' ? data.count : 0,
      lastSeen: (data.lastSeen as Timestamp | undefined) ?? null,
    };
  });
  return sortReferralsByCount(rows);
}
