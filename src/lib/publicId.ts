// Eduvelto — public user IDs (owner order 22 Nov 2026: "sobar id hobe
// eduvelto0001 thake" — everyone's ID runs sequentially from eduvelto0001).
//
// A public ID is a SEQUENTIAL DISPLAY / LOOKUP NUMBER only:
//   eduvelto0001, eduvelto0002, ...
// It is NOT a security identity. The Firebase Auth UID stays the real
// identity (the users/{uid} document ID, the rules' isOwner() check,
// every permission decision). Firestore rules must NEVER trust the
// public ID for permissions — it is a label, not a credential.
//
// STORAGE: one int field on the user doc, `publicIdNumber` (1, 2, ...).
// The display string is derived from it (formatPublicId) — there is a
// single source of truth, never two fields that can disagree.
//
// ALLOCATION (on signup): a Firestore transaction against the counter
// document `counters/publicUserIds` ({ next: int, updatedAt }). The
// transaction reads the counter, creates the users/{uid} doc carrying
// publicIdNumber = next, and increments the counter to next + 1 —
// atomically. Two simultaneous signups get different numbers: the
// second transaction aborts on contention and retries with the new
// counter value. Numbers are never reused.
//
// FALLBACK: if the counter document is missing or invalid, or the
// transaction fails (e.g. the rules change has not deployed yet), the
// profile is created WITHOUT a number and the backfill script
// (scripts/backfill-public-ids.mjs) assigns it later, in registration
// order. Signup NEVER breaks because of the public ID.
//
// HONEST LIMITS (no server on the free Spark plan):
// - Rules cannot prove the counter increment and the user-doc create
//   happened in one transaction — they evaluate each write against the
//   pre-transaction state. A deliberately malicious client could claim
//   the current `next` number without incrementing the counter, or
//   increment the counter alone and burn numbers. The rules binding
//   (publicIdNumber must equal the counter's current `next`) stops a
//   client claiming a STALE or FUTURE number, but not these two.
//   Duplicates from such abuse are detectable (admin query for a
//   duplicate publicIdNumber) and fixable by the owner; the honest
//   path (this module's transaction) can never produce one.
// - The counter value is not secret (it is only "the next number").
//   Any signed-in user may read it; that is by design.

import {
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

/** Display prefix for every public ID. */
export const PUBLIC_ID_PREFIX = 'eduvelto';
/** Zero-padded width of the numeric part (eduvelto0001). Past 9999 the
 * string grows naturally (eduvelto10000) — the width is a minimum. */
export const PUBLIC_ID_DIGITS = 4;
/** Counter document: `counters/publicUserIds` { next, updatedAt }. */
export const PUBLIC_ID_COUNTER_COLLECTION = 'counters';
export const PUBLIC_ID_COUNTER_DOC_ID = 'publicUserIds';

/** Display form of a public ID number: 1 -> 'eduvelto0001'. */
export function formatPublicId(n: number): string {
  return PUBLIC_ID_PREFIX + String(Math.trunc(n)).padStart(PUBLIC_ID_DIGITS, '0');
}

/**
 * Parse a display public ID back to its number. Returns null for
 * anything that is not the canonical display form (round-trip check:
 * formatPublicId(n) must reproduce the string exactly, so
 * 'eduvelto01', 'eduvelto00001' and 'EDUVELTO0001' all fail).
 */
export function parsePublicId(s: string): number | null {
  if (typeof s !== 'string') return null;
  const m = /^eduvelto(\d+)$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 1) return null;
  return formatPublicId(n) === s ? n : null;
}

/**
 * Atomically create a user profile doc WITH its public ID, in one
 * transaction with the counter increment. Returns the allocated
 * number, or null when no allocation happened (counter doc missing or
 * invalid, or the user doc already existed). Never throws for a
 * missing/invalid counter — the caller falls back to a plain profile
 * create and the backfill assigns the number later. Other failures
 * (e.g. permission-denied when the rules change has not deployed)
 * throw, and the caller falls back the same way.
 *
 * RETRY: when two signups race, the loser reads the old `next`,
 * claims it, and the rules deny the stale write (the number must
 * equal the counter's CURRENT next, and the counter must move by
 * exactly +1). In production the loser usually aborts (ABORTED —
 * auto-retried by the SDK); the emulator surfaces the same race as
 * PERMISSION_DENIED, which the SDK does NOT retry. So this function
 * retries the transaction itself (up to 3 attempts, re-reading the
 * counter each time) on permission-denied / aborted / unavailable;
 * a persistent failure still throws and the caller falls back.
 */
export async function createProfileWithPublicId(
  db: Firestore,
  uid: string,
  data: Record<string, unknown>,
): Promise<number | null> {
  const counterRef = doc(db, PUBLIC_ID_COUNTER_COLLECTION, PUBLIC_ID_COUNTER_DOC_ID);
  const userRef = doc(db, 'users', uid);
  // Retry on a stale claim (see docstring): re-read the counter each
  // attempt. A null return (no counter / user already exists) is a
  // successful outcome and is returned at once, never retried.
  const RETRYABLE_CODES = new Set(['permission-denied', 'aborted', 'unavailable']);
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await runTransaction(db, async (tx) => {
        const counterSnap = await tx.get(counterRef);
        if (!counterSnap.exists()) return null;
        const next = counterSnap.data().next;
        if (typeof next !== 'number' || !Number.isInteger(next) || next < 1) return null;
        const userSnap = await tx.get(userRef);
        if (userSnap.exists()) {
          const existing = userSnap.data().publicIdNumber;
          return typeof existing === 'number' && Number.isInteger(existing) && existing >= 1
            ? existing
            : null;
        }
        tx.set(userRef, { ...data, publicIdNumber: next });
        tx.update(counterRef, { next: next + 1, updatedAt: serverTimestamp() });
        return next;
      });
    } catch (e) {
      lastError = e;
      const code = (e as { code?: unknown } | null)?.code;
      if (typeof code !== 'string' || !RETRYABLE_CODES.has(code)) throw e;
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Backfill assignment (pure — used by scripts/backfill-public-ids.mjs and
// unit-tested here). Existing users get numbers in REGISTRATION order
// (createdAt ascending; users without a createdAt go last, uid order
// for determinism). Users that already have a valid number keep it;
// the missing ones get the SMALLEST unused positive integers, in
// order. `next` is the counter value to seed afterwards: one past the
// highest number in use, so no number is ever reused.
// ---------------------------------------------------------------------------

export interface BackfillUserInput {
  uid: string;
  /** Registration time in epoch millis, or null when unknown. */
  createdAtMillis: number | null;
  publicIdNumber?: number | null;
}

export interface BackfillAssignment {
  uid: string;
  publicIdNumber: number;
}

export function assignMissingPublicIds(users: BackfillUserInput[]): {
  assignments: BackfillAssignment[];
  /** Counter `next` value to seed: max assigned number + 1. */
  next: number;
} {
  const used = new Set<number>();
  for (const u of users) {
    if (typeof u.publicIdNumber === 'number' && Number.isInteger(u.publicIdNumber) && u.publicIdNumber >= 1) {
      used.add(u.publicIdNumber);
    }
  }
  const missing = users.filter(
    (u) =>
      !(
        typeof u.publicIdNumber === 'number' &&
        Number.isInteger(u.publicIdNumber) &&
        u.publicIdNumber >= 1
      ),
  );
  missing.sort((a, b) => {
    if (a.createdAtMillis == null && b.createdAtMillis == null) {
      return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0;
    }
    if (a.createdAtMillis == null) return 1;
    if (b.createdAtMillis == null) return -1;
    if (a.createdAtMillis !== b.createdAtMillis) return a.createdAtMillis - b.createdAtMillis;
    return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0;
  });
  const assignments: BackfillAssignment[] = [];
  let candidate = 1;
  for (const u of missing) {
    while (used.has(candidate)) candidate += 1;
    assignments.push({ uid: u.uid, publicIdNumber: candidate });
    used.add(candidate);
    candidate += 1;
  }
  let max = 0;
  for (const n of used) if (n > max) max = n;
  return { assignments, next: max + 1 };
}
