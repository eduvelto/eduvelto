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

import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
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

// ---------------------------------------------------------------------------
// Owner Summary (Worker G, 27 Nov 2026) — section inside CeoDashboardPage
// (/ceo/dashboard), NOT a new page or route.
//
// HONESTY RULES (same as above, binding):
// - A failed live read returns null and the tile shows "— (not loaded)",
//   NEVER ৳0 and NEVER a stale number without its check date.
// - ৳0 is shown ONLY when the read succeeded and the sum is 0.
// - A metric with no source shows "not wired", never a guessed number.
// - No "verified" wording unless verified; use "last checked <date>".
// - Reads only. No writes, no secrets, no new collection created here.
//   No `backupRuns` collection exists (Decision D3) — backup is a dated
//   snapshot until D3 ships.
//
// PRICES (from questionPaper.ts / firestore.rules — the rules enforce
// them, this file only sums them):
//   qpgProOrders amountBdt: per-paper 49 / monthly 199 / annual tiers
//   75–1350 (coaching-6-12 = 1350). qpgCustomOrders priceBdt = 49.
//   orders amount = 149 (sales gate CLOSED — gap G1, no fulfilment
//   status exists, so ৳149 income is NOT recognisable).
//
// DECISION GATES (SPEC §6 — do not guess these):
// - D1 (institution definition): NOT confirmed — activeInstitutions is
//   hard-gated to null below, so the tile shows "— (definition not
//   decided)". The proposed proxy (approved coaching-6-12 buyer,
//   proEnd > now) is NOT counted until the owner confirms it.
// - D4 (stuck thresholds): 12h review / 7d custom are PROPOSALS, not
//   owner-confirmed — the UI labels them as such.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Source badges — every tile carries one (SPEC §4).
// ---------------------------------------------------------------------------
export type SourceBadge =
  | { kind: 'live' }
  | { kind: 'last-checked'; checkedBn: string; checkedEn: string }
  | { kind: 'not-wired' };

export const LIVE: SourceBadge = { kind: 'live' };
export const NOT_WIRED: SourceBadge = { kind: 'not-wired' };

// ---------------------------------------------------------------------------
// Last-verified backup snapshot (SPEC §1.5). The backup run log lives only
// as local files (backup-automation/runs/*/summary.txt) — NOT in Firestore
// — so until Decision D3 (a `backupRuns` collection) ships, the section
// shows these dated facts. Update the date + values when a newer run is
// verified; if they age past 7 days the UI adds "snapshot stale".
// Grounded in runs/2026-11-26-20261126-142756/summary.txt and the
// 24–26 Nov failure summaries. Restore has NEVER been tested.
// ---------------------------------------------------------------------------
export const LAST_VERIFIED_BACKUP = {
  lastSuccessAtDhaka: '2026-11-26 14:27',
  lastSuccessDocs: 7120,
  lastSuccessBytes: 57_006_419,
  lastSuccessVerify: 'metadata-ok, download-sha-ok, decrypt-check-ok',
  lastSuccessDriveFolderId: '1z3AYkQu1Ng32hy4KZD0qqt6ldogSWrOh',
  /** Failures since the previous success, newest first. */
  failuresSince: [
    { atDhaka: '2026-11-26 00:05:53', error: 'HTTP 429 (:runAggregationQuery, first count query)' },
    { atDhaka: '2026-11-26 00:01:14', error: 'HTTP 429 (:runAggregationQuery, first count query)' },
    { atDhaka: '2026-11-25 23:59:15', error: 'HTTP 429 (:runAggregationQuery, first count query)' },
    { atDhaka: '2026-11-25 23:21', error: 'HTTP 429 (:runAggregationQuery, first count query)' },
    { atDhaka: '2026-11-25 23:15', error: 'HTTP 429 (:runAggregationQuery, first count query)' },
    { atDhaka: '2026-11-24 23:59', error: 'HTTP 429 (:runAggregationQuery, first count query)' },
  ],
  previousSuccessAtDhaka: '2026-11-24 08:11',
  previousSuccessDocs: 7105,
  restoreTested: false,
  checkedBn: '২৬ নভেম্বর ২০২৬ যাচাই করা',
  checkedEn: 'verified 26 Nov 2026',
} as const;

/** Stale rule (SPEC §1.5): daily 14:30 Dhaka schedule + retry window. */
export function backupStaleness(hoursSinceSuccess: number): 'ok' | 'due' | 'overdue' {
  if (hoursSinceSuccess > 36) return 'overdue';
  if (hoursSinceSuccess >= 24) return 'due';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Month window — Dhaka calendar month (SPEC §1). All income is recognised
// in the month of the deciding event (approval / delivery), never on order.
// ---------------------------------------------------------------------------
export function dhakaMonthWindow(now = new Date()): { start: Date; end: Date; labelBn: string; labelEn: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit',
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  // Month boundaries computed in Dhaka wall time; Firestore Timestamps
  // compare as instants, so convert via the fixed +06:00 offset.
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0) - 6 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0) - 6 * 60 * 60 * 1000);
  const monthBn = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', month: 'long', year: 'numeric' }).format(now);
  const monthEn = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', month: 'long', year: 'numeric' }).format(now);
  return { start, end, labelBn: monthBn, labelEn: monthEn };
}

// ---------------------------------------------------------------------------
// Result shape. Every numeric field is `number | null`: null = the read
// failed (quota / offline) and the tile must show "— (not loaded)".
// ---------------------------------------------------------------------------
export interface OwnerSummary {
  month: { labelBn: string; labelEn: string };
  /** §1.1 — Decision D1 NOT confirmed: always null for now, so the tile
   *  shows "— (definition not decided)". Proposed definition (approved
   *  coaching-6-12 buyer, proEnd > now) is NOT counted until the owner
   *  confirms it. */
  activeInstitutions: number | null;
  institutionsSource: SourceBadge;
  institutionsNoteBn: string;
  institutionsNoteEn: string;
  /** §1.2 — recognised sales this month. */
  incomeProBdt: number | null;
  incomeCustomBdt: number | null;
  incomeSalesBdt: number | null; // pro + custom, when both loaded
  incomeSource: SourceBadge;
  /** Suggestion PDFs: count only — income NOT recognisable (gap G1). */
  suggestionPendingCount: number | null;
  /** Donations: separate line, never inside sales. */
  donationsBdt: number | null;
  donationsSource: SourceBadge;
  /** §1.4 — payment errors, last 30 days unless noted. P3 (12h) and P4
   *  (7d) thresholds are PROPOSALS pending owner confirm (D4). */
  errorsRejectedPro: number | null;
  errorsDuplicateTrxId: number | null;
  errorsStuckReview: number | null;
  errorsStuckCustom: number | null;
  errorsSource: SourceBadge;
  /** Latest error rows for the table (max 5, TrxID truncated to last 4). */
  latestErrors: Array<{ typeBn: string; typeEn: string; ref: string; ageBn: string; ageEn: string }>;
  /** §1.3 — static by design: no live billing API on Spark. */
  serverCost: { planBn: string; planEn: string; usdPerMonth: 0; blazeEnabled: false };
  /** §1.5 — snapshot until D3; live `backupRuns` rows after D3. */
  backup: typeof LAST_VERIFIED_BACKUP;
  backupSource: SourceBadge;
}

// --- Internal helpers: same tryCount pattern as ceo.ts. -------------------
async function tryDocs(q: Query<DocumentData, DocumentData>): Promise<DocumentData[] | null> {
  try {
    return (await getDocs(q)).docs.map((d) => d.data());
  } catch {
    return null;
  }
}

function ageLabelBnEn(ts: { toDate?: () => Date } | null | undefined): { bn: string; en: string } {
  if (!ts || typeof ts.toDate !== 'function') return { bn: '—', en: '—' };
  const hours = Math.max(0, (Date.now() - ts.toDate().getTime()) / 3_600_000);
  if (hours < 1) return { bn: '১ ঘণ্টার কম আগে', en: 'less than an hour ago' };
  if (hours < 24) return { bn: `${Math.floor(hours)} ঘণ্টা আগে`, en: `${Math.floor(hours)}h ago` };
  return { bn: `${Math.floor(hours / 24)} দিন আগে`, en: `${Math.floor(hours / 24)}d ago` };
}

// ---------------------------------------------------------------------------
// getOwnerSummary — one loader for the section. Shares the dashboard's
// mount loader; the Refresh button re-runs this only (SPEC §4).
// Read budget per load: ~7 counts + ≤3 bounded getDocs (limit ≤ 100).
// At scale the income sums need monthly rollup docs (see SPEC §2.1);
// with 0 orders today the bounded reads cost ~0.
// ---------------------------------------------------------------------------
export async function getOwnerSummary(db: Firestore): Promise<OwnerSummary> {
  const { start, end, labelBn, labelEn } = dhakaMonthWindow();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3_600_000);
  const twelveHoursAgo = new Date(now.getTime() - 12 * 3_600_000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3_600_000);

  // --- Monthly income: Pro (recognised on approval). ----------------------
  const proDocs = await tryDocs(
    query(
      collection(db, 'qpgProOrders'),
      where('status', '==', 'approved'),
      where('decidedAt', '>=', start),
      where('decidedAt', '<', end),
      limit(100),
    ),
  );
  const incomeProBdt =
    proDocs === null ? null : proDocs.reduce((s, d) => s + (typeof d.amountBdt === 'number' ? d.amountBdt : 0), 0);

  // --- Monthly income: custom papers (recognised on delivery). ------------
  const customDocs = await tryDocs(
    query(
      collection(db, 'qpgCustomOrders'),
      where('status', '==', 'delivered'),
      where('deliveredAt', '>=', start),
      where('deliveredAt', '<', end),
      limit(100),
    ),
  );
  const incomeCustomBdt =
    customDocs === null ? null : customDocs.reduce((s, d) => s + (typeof d.priceBdt === 'number' ? d.priceBdt : 0), 0);

  // --- Suggestion PDFs: count only (G1 — no fulfilment status exists). -----
  const suggestionPendingCount = await tryCount(
    query(collection(db, 'orders'), where('status', '==', 'pending')),
  );

  // --- Donations this month (separate line, never inside sales). ----------
  const donationDocs = await tryDocs(
    query(collection(db, 'donations'), where('createdAt', '>=', start), where('createdAt', '<', end), limit(100)),
  );
  const donationsBdt =
    donationDocs === null ? null : donationDocs.reduce((s, d) => s + (typeof d.amount === 'number' ? d.amount : 0), 0);

  // --- Payment errors P1–P4 (last 30 days, except P3/P4 age rules). -------
  const errorsRejectedPro = await tryCount(
    query(collection(db, 'qpgProOrders'), where('status', '==', 'rejected'), where('decidedAt', '>=', thirtyDaysAgo)),
  );
  const pendingReviewDocs = await tryDocs(
    query(collection(db, 'qpgProOrders'), where('status', '==', 'pending-review'), limit(100)),
  );
  const errorsStuckReview =
    pendingReviewDocs === null
      ? null
      : pendingReviewDocs.filter((d) => {
          const c = d.createdAt as { toDate?: () => Date } | undefined;
          return c && typeof c.toDate === 'function' && c.toDate() < twelveHoursAgo;
        }).length;
  // P2 duplicate TrxID — over the bounded pending-review set only; the
  // UI label says so. Warning, not auto-reject — admin decides.
  const errorsDuplicateTrxId =
    pendingReviewDocs === null
      ? null
      : (() => {
          const seen = new Set<string>();
          let dups = 0;
          for (const d of pendingReviewDocs) {
            const t = String(d.trxId ?? '').trim().toUpperCase();
            if (!t) continue;
            if (seen.has(t)) dups += 1;
            else seen.add(t);
          }
          return dups;
        })();
  const customDocsAll = await tryDocs(query(collection(db, 'qpgCustomOrders'), limit(100)));
  const errorsStuckCustom =
    customDocsAll === null
      ? null
      : customDocsAll.filter((d) => {
          const sub = (d.submittedAt ?? d.createdAt) as { toDate?: () => Date } | undefined;
          const paidAt = d.paidAt as { toDate?: () => Date } | undefined;
          const at = (x?: { toDate?: () => Date }) => (x && typeof x.toDate === 'function' ? x.toDate() : null);
          if (d.status === 'pending_payment' && !d.trxId) return at(sub) !== null && (at(sub) as Date) < sevenDaysAgo;
          if (d.status === 'paid') return at(paidAt) !== null && (at(paidAt) as Date) < sevenDaysAgo;
          return false;
        }).length;

  // --- Latest-error table (max 5; TrxID truncated — never full). -----------
  const latestErrors: OwnerSummary['latestErrors'] = [];
  const rejectedDocs = await tryDocs(
    query(collection(db, 'qpgProOrders'), where('status', '==', 'rejected'), orderBy('decidedAt', 'desc'), limit(5)),
  );
  for (const d of rejectedDocs ?? []) {
    const age = ageLabelBnEn(d.decidedAt);
    latestErrors.push({
      typeBn: 'বাতিল Pro অর্ডার',
      typeEn: 'Rejected Pro order',
      ref: `…${String(d.trxId ?? '').slice(-4)}`,
      ageBn: age.bn,
      ageEn: age.en,
    });
  }

  return {
    month: { labelBn, labelEn },
    // D1 NOT confirmed by the owner: hard gate — null, never a guessed
    // proxy count. One-line change (return the computed proxy) once D1
    // is confirmed.
    activeInstitutions: null,
    institutionsSource: NOT_WIRED,
    institutionsNoteBn: 'সংজ্ঞা নির্ধারিত হয়নি — মালিকের সিদ্ধান্ত অপেক্ষমাণ (D1)',
    institutionsNoteEn: 'Definition not decided — owner decision pending (D1)',
    incomeProBdt,
    incomeCustomBdt,
    incomeSalesBdt: incomeProBdt === null || incomeCustomBdt === null ? null : incomeProBdt + incomeCustomBdt,
    incomeSource: LIVE,
    suggestionPendingCount,
    donationsBdt,
    donationsSource: LIVE,
    errorsRejectedPro,
    errorsDuplicateTrxId,
    errorsStuckReview,
    errorsStuckCustom,
    errorsSource: LIVE,
    latestErrors: latestErrors.slice(0, 5),
    serverCost: { planBn: 'Spark (ফ্রি)', planEn: 'Spark (free)', usdPerMonth: 0, blazeEnabled: false },
    backup: LAST_VERIFIED_BACKUP,
    backupSource: { kind: 'last-checked', checkedBn: LAST_VERIFIED_BACKUP.checkedBn, checkedEn: LAST_VERIFIED_BACKUP.checkedEn },
  };
}
