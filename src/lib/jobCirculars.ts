// Eduvelto — Job circulars (Step 14): pure helpers, no Firestore.
//
// A circular is a government recruitment notice, stored in the
// `circulars` collection (architecture §2.18). The rules allow
// public read of PUBLISHED docs only; moderators create/update
// within the key allowlist (see firestore.rules). NOTHING here
// invents data: every field comes from the stored doc, and every
// derived value is computed from stored dates.
//
// HONESTY (binding, Steps 7–13 + both Step 14 consultations):
// - Verified ≠ published. A circular shows "সরকারি উৎসে
//   যাচাইকৃত" ONLY when verifiedBy is recorded; a merely
//   published circular shows "যাচাই করা হয়নি". A circular is
//   NEVER verified just because an admin added it, a Facebook
//   page shared it, or the apply link works.
// - Application status is NEVER stored and NEVER taken from a
//   manual field — it is computed here from the official dates
//   (ChatGPT: never use a manually entered status as the source
//   of truth). Verification and application status are TWO
//   separate dimensions (verified+open, verified+closed,
//   unverified+unknown, ...), never one status field.
// - Missing deadline = unknown, never guessed: no countdown,
//   no Open badge, no Apply promotion — "তথ্য পাওয়া যায়নি".
// - A date-only deadline never invents a closing time: the
//   circular closes at end of day, Asia/Dhaka (conservative).
// - All date math is Asia/Dhaka, never the device timezone.
// - No Apply button without a confirmed apply link: the Apply
//   action needs verified + a stored applyUrl + an open window.
//   The circular PDF/notice link and the apply-portal link are
//   SEPARATE (a PDF is not necessarily the apply destination).
// - Closed circulars stay listed and searchable (archived for
//   exam prep / history) — they are never deleted or hidden.

import { dhakaDayKey } from './jobDashboard';

export type CircularReviewStatus = 'draft' | 'in-review' | 'verified' | 'published' | 'rejected';
export type CircularCopyStatus = 'stored' | 'link-only';
export type CircularDeadlinePrecision = 'date_only' | 'datetime';

/** Application status — always COMPUTED, never stored. */
export type CircularApplicationStatus =
  | 'upcoming'
  | 'open'
  | 'closing-soon'
  | 'closed'
  | 'unknown';

export interface JobCircular {
  docId: string;
  examSlug: string;
  postTitleBn: string;
  postTitleEn: string;
  /** Circular number, or null when the notice gives none. */
  circularNumber: string | null;
  publishedDateMillis: number | null;
  applicationDeadlineMillis: number | null;
  deadlinePrecision: CircularDeadlinePrecision;
  /** Total posts — ONLY from the circular copy, null = not stated. */
  totalPosts: number | null;
  eligibilitySummaryBn: string;
  eligibilitySummaryEn: string;
  /** Official notice link (PDF / portal notice). */
  officialUrl: string;
  /** Official application-portal link, or null when not confirmed. */
  applyUrl: string | null;
  copyStatus: CircularCopyStatus;
  /** Stored excerpt of the circular text, or null (link-only). */
  copyTextExcerpt: string | null;
  reviewStatus: CircularReviewStatus;
  /** Verifier user-id, or null — presence is what makes a
   * circular "verified" in the UI (see isCircularVerified). */
  verifiedBy: string | null;
  verifiedAtMillis: number | null;
  examDateMillis: number | null;
  applicationStartDateMillis: number | null;
  authorId: string;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
  /** Verification checklist (Step 15): the 7 ticks the verifier
   * made before approving, + who checked and when. Null when the
   * circular has never been through the checklist. The checklist
   * is enforced in the admin UI at approve time; the rules allow
   * the key but do not re-check the ticks (compiled-rules margin
   * ≈ 100 bytes after the Step 15 delta — a rules-side checklist
   * check is a post-refactor follow-up). */
  verificationChecklist: VerificationChecklist | null;
  /** Verifier's return reason when a circular is sent back to
   * draft (needs-review). Shown to the editor on the admin page.
   * Lives on the doc because adminActions is owner-read-only. */
  reviewNote: string | null;
  /** UID of the last editor — the no-self-approval check needs
   * it (a verifier may not approve their own edit). */
  lastEditedBy: string | null;
}

/** Step 15 verification checklist — the 7 items from the Step 14
 * report (ChatGPT's checklist, adapted to our fields).
 *
 * Evidence-based, not bare checkboxes (ChatGPT): each item stores
 * a RESULT, not a boolean — 'pass' (checked and matches the
 * source), 'fail' (contradicts the source), 'uncertain' (cannot
 * be confirmed from the evidence), 'na' (the circular genuinely
 * does not state it — e.g. no opening date — with a note; never
 * invented). An unchecked item is NEVER a pass. Approval requires
 * every item 'pass' or 'na'; any 'fail'/'uncertain' blocks it.
 * Gemini's booleans are ADAPTED to this richer model (same 7
 * items, same blocking semantics, plus the na case Gemini did
 * not cover). */
export const VERIFICATION_CHECKLIST_ITEMS = [
  'orgConfirmed',
  'sourceOpened',
  'postCountChecked',
  'openingDateChecked',
  'deadlineChecked',
  'applyLinkChecked',
  'amendmentsChecked',
] as const;
export type VerificationChecklistItem = (typeof VERIFICATION_CHECKLIST_ITEMS)[number];

export type ChecklistResult = 'pass' | 'fail' | 'uncertain' | 'na';

export const CHECKLIST_RESULTS: ChecklistResult[] = ['pass', 'fail', 'uncertain', 'na'];

export const VERIFICATION_CHECKLIST_BN: Record<VerificationChecklistItem, string> = {
  orgConfirmed: 'প্রকাশক সংস্থা নিশ্চিত (অফিসিয়াল ডোমেইন মিলেছে)',
  sourceOpened: 'মূল বিজ্ঞপ্তি খুলে দেখা হয়েছে',
  postCountChecked: 'পদসংখ্যা যাচাই (না থাকলে “উল্লেখ নেই” বাছাই)',
  openingDateChecked: 'আবেদন শুরুর তারিখ যাচাই',
  deadlineChecked: 'আবেদনের শেষ তারিখ যাচাই (এশিয়া/ঢাকা)',
  applyLinkChecked: 'অফিসিয়াল আবেদন-লিংক যাচাই',
  amendmentsChecked: 'সংশোধনী / সময়-বৃদ্ধি যাচাই',
};

export const CHECKLIST_RESULT_BN: Record<ChecklistResult, string> = {
  pass: 'উত্তীর্ণ',
  fail: 'ব্যর্থ',
  uncertain: 'অনিশ্চিত',
  na: 'প্রযোজ্য নয়',
};

export const VERIFICATION_CHECKLIST_EN: Record<VerificationChecklistItem, string> = {
  orgConfirmed: 'Publishing organisation confirmed (official domain matches)',
  sourceOpened: 'Original circular opened and read',
  postCountChecked: 'Post count verified (choose “not mentioned” when absent)',
  openingDateChecked: 'Application start date verified',
  deadlineChecked: 'Application deadline verified (Asia/Dhaka)',
  applyLinkChecked: 'Official application link verified',
  amendmentsChecked: 'Amendments / deadline extensions verified',
};

export const CHECKLIST_RESULT_EN: Record<ChecklistResult, string> = {
  pass: 'Pass',
  fail: 'Fail',
  uncertain: 'Uncertain',
  na: 'Not applicable',
};

export interface VerificationChecklist {
  orgConfirmed: ChecklistResult | null;
  sourceOpened: ChecklistResult | null;
  postCountChecked: ChecklistResult | null;
  openingDateChecked: ChecklistResult | null;
  deadlineChecked: ChecklistResult | null;
  applyLinkChecked: ChecklistResult | null;
  amendmentsChecked: ChecklistResult | null;
  /** Per-item notes (why na / why uncertain / evidence hint). */
  notes: Partial<Record<VerificationChecklistItem, string>>;
  checkedBy: string | null;
  checkedAtMillis: number | null;
}

export function emptyVerificationChecklist(): VerificationChecklist {
  return {
    orgConfirmed: null,
    sourceOpened: null,
    postCountChecked: null,
    openingDateChecked: null,
    deadlineChecked: null,
    applyLinkChecked: null,
    amendmentsChecked: null,
    notes: {},
    checkedBy: null,
    checkedAtMillis: null,
  };
}

/** Approval-ready: every item is 'pass' or an explicitly
 * justified 'na'. Null / 'fail' / 'uncertain' block approval. */
export function isVerificationChecklistComplete(c: VerificationChecklist): boolean {
  return VERIFICATION_CHECKLIST_ITEMS.every((k) => c[k] === 'pass' || c[k] === 'na');
}

/** The first blocking item, if any (for the UI to explain why
 * Approve is disabled). */
export function firstBlockingChecklistItem(c: VerificationChecklist): VerificationChecklistItem | null {
  for (const k of VERIFICATION_CHECKLIST_ITEMS) {
    if (c[k] !== 'pass' && c[k] !== 'na') return k;
  }
  return null;
}

export function verificationChecklistFromStored(v: unknown): VerificationChecklist | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const out = emptyVerificationChecklist();
  for (const k of VERIFICATION_CHECKLIST_ITEMS) {
    const val = o[k];
    if (val === null || val === undefined) {
      out[k] = null;
    } else if (typeof val === 'string' && CHECKLIST_RESULTS.includes(val as ChecklistResult)) {
      out[k] = val as ChecklistResult;
    } else if (typeof val === 'boolean') {
      // Back-compat with the boolean draft written before the
      // ChatGPT fold-in (true = pass, false = unchecked).
      out[k] = val ? 'pass' : null;
    } else {
      return null;
    }
  }
  if (typeof o.notes === 'object' && o.notes !== null) {
    const notes = o.notes as Record<string, unknown>;
    for (const k of VERIFICATION_CHECKLIST_ITEMS) {
      if (typeof notes[k] === 'string') out.notes[k] = (notes[k] as string).slice(0, 500);
    }
  }
  out.checkedBy = typeof o.checkedBy === 'string' ? (o.checkedBy as string) : null;
  out.checkedAtMillis = circularTimestampToMillis(o.checkedAt);
  return out;
}

export const CIRCULAR_REVIEW_STATUSES: CircularReviewStatus[] = [
  'draft',
  'in-review',
  'verified',
  'published',
  'rejected',
];

export const CIRCULAR_COPY_STATUSES: CircularCopyStatus[] = ['stored', 'link-only'];

/** The rules allowlist (firestore.rules, match /circulars) —
 * kept here so the client validator and the rules can never
 * drift apart silently. */
export const CIRCULAR_ALLOWED_KEYS: string[] = [
  'examSlug',
  'postTitleBn',
  'postTitleEn',
  'circularNumber',
  'publishedDate',
  'applicationDeadline',
  'deadlinePrecision',
  'totalPosts',
  'eligibilitySummaryBn',
  'eligibilitySummaryEn',
  'officialUrl',
  'applyUrl',
  'copyStatus',
  'copyTextExcerpt',
  'reviewStatus',
  'verifiedBy',
  'verifiedAt',
  'examDate',
  'applicationStartDate',
  'authorId',
  'createdAt',
  'updatedAt',
  // Step 15: verification checklist map, verifier return note,
  // last editor (no-self-approval). Rules allow the keys; the
  // client validator below enforces the checklist shape.
  'verificationChecklist',
  'reviewNote',
  'lastEditedBy',
];

/** Closing-soon threshold: 3 Dhaka calendar days. Both AIs
 * agree on "3 days" (Gemini 72h, ChatGPT 3 days); day
 * granularity is used so the badge always agrees with the
 * displayed "আর X দিন বাকি" — e.g. ChatGPT's example (deadline
 * 15 Dec 11:59 PM) is closing-soon on 12, 13, 14 and 15 Dec. */

const DAY_MILLIS = 24 * 60 * 60 * 1000;

/** Firestore Timestamp / Date / number / null → millis or null.
 * Local copy of the pattern used in jobEngine/jobMock (the
 * helper is module-private there). */
export function circularTimestampToMillis(t: unknown): number | null {
  if (t === null || t === undefined) return null;
  if (typeof t === 'number' && Number.isFinite(t)) return t;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'object') {
    const o = t as { toMillis?: unknown; seconds?: unknown; nanoseconds?: unknown };
    if (typeof o.toMillis === 'function') {
      const v = (o as { toMillis(): unknown }).toMillis();
      return typeof v === 'number' ? v : null;
    }
    if (typeof o.seconds === 'number') {
      return o.seconds * 1000 + (typeof o.nanoseconds === 'number' ? Math.floor(o.nanoseconds / 1e6) : 0);
    }
  }
  return null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === 'string';
}

/** Client-side validator mirroring the rules allowlist + enums.
 * Returns problem strings (empty = valid). The rules are the
 * authority; this only fails fast in the client before a write
 * is attempted (moderator writes go through Step 15 admin or a
 * script — there is no student write path at all). */
export function validateCircular(data: Record<string, unknown>, docId: string): string[] {
  const label = `circulars/${docId}`;
  const problems: string[] = [];
  for (const k of Object.keys(data)) {
    if (!CIRCULAR_ALLOWED_KEYS.includes(k)) problems.push(`${label}: unexpected key '${k}'`);
  }
  if (!isNonEmptyString(data.examSlug)) problems.push(`${label}: examSlug must be a non-empty string`);
  if (!isNonEmptyString(data.postTitleBn)) problems.push(`${label}: postTitleBn must be a non-empty string`);
  if (!isNonEmptyString(data.postTitleEn)) problems.push(`${label}: postTitleEn must be a non-empty string`);
  if (!isNonEmptyString(data.officialUrl)) problems.push(`${label}: officialUrl must be a non-empty string`);
  if (!isNonEmptyString(data.eligibilitySummaryBn)) problems.push(`${label}: eligibilitySummaryBn must be a non-empty string`);
  if (!isNonEmptyString(data.eligibilitySummaryEn)) problems.push(`${label}: eligibilitySummaryEn must be a non-empty string`);
  if (!isNullableString(data.circularNumber)) problems.push(`${label}: circularNumber must be string or null`);
  if (!isNullableString(data.applyUrl)) problems.push(`${label}: applyUrl must be string or null`);
  if (!isNullableString(data.copyTextExcerpt)) problems.push(`${label}: copyTextExcerpt must be string or null`);
  if (!isNullableString(data.verifiedBy)) problems.push(`${label}: verifiedBy must be string or null`);
  if (typeof data.reviewStatus !== 'string' || !CIRCULAR_REVIEW_STATUSES.includes(data.reviewStatus as CircularReviewStatus)) {
    problems.push(`${label}: reviewStatus must be one of ${CIRCULAR_REVIEW_STATUSES.join(', ')}`);
  }
  if (typeof data.copyStatus !== 'string' || !CIRCULAR_COPY_STATUSES.includes(data.copyStatus as CircularCopyStatus)) {
    problems.push(`${label}: copyStatus must be one of ${CIRCULAR_COPY_STATUSES.join(', ')}`);
  }
  if (data.deadlinePrecision !== undefined && data.deadlinePrecision !== 'date_only' && data.deadlinePrecision !== 'datetime') {
    problems.push(`${label}: deadlinePrecision must be 'date_only' or 'datetime'`);
  }
  if (data.totalPosts !== null && (typeof data.totalPosts !== 'number' || !Number.isInteger(data.totalPosts) || (data.totalPosts as number) < 0)) {
    problems.push(`${label}: totalPosts must be a non-negative integer or null`);
  }
  for (const f of ['publishedDate', 'applicationDeadline', 'verifiedAt', 'examDate', 'applicationStartDate', 'createdAt', 'updatedAt']) {
    if (data[f] !== null && data[f] !== undefined && circularTimestampToMillis(data[f]) === null) {
      problems.push(`${label}: ${f} must be a timestamp or null`);
    }
  }
  if (!isNonEmptyString(data.authorId)) problems.push(`${label}: authorId must be a non-empty string`);
  if (data.verificationChecklist !== null && data.verificationChecklist !== undefined) {
    if (verificationChecklistFromStored(data.verificationChecklist) === null) {
      problems.push(`${label}: verificationChecklist must be a map of 7 booleans (+ checkedBy/checkedAt)`);
    }
  }
  if (data.reviewNote !== null && data.reviewNote !== undefined && typeof data.reviewNote !== 'string') {
    problems.push(`${label}: reviewNote must be a string or null`);
  }
  if (typeof data.reviewNote === 'string' && (data.reviewNote as string).length > 1000) {
    problems.push(`${label}: reviewNote must be at most 1000 characters`);
  }
  if (data.lastEditedBy !== null && data.lastEditedBy !== undefined && typeof data.lastEditedBy !== 'string') {
    problems.push(`${label}: lastEditedBy must be a string or null`);
  }
  return problems;
}

/** Normalise a stored doc into a JobCircular, or null when the
 * doc fails validation (never render a malformed circular). */
export function circularFromStored(docId: string, data: Record<string, unknown>): JobCircular | null {
  if (validateCircular(data, docId).length > 0) return null;
  return {
    docId,
    examSlug: data.examSlug as string,
    postTitleBn: data.postTitleBn as string,
    postTitleEn: data.postTitleEn as string,
    circularNumber: (data.circularNumber as string | null) ?? null,
    publishedDateMillis: circularTimestampToMillis(data.publishedDate),
    applicationDeadlineMillis: circularTimestampToMillis(data.applicationDeadline),
    deadlinePrecision: (data.deadlinePrecision as CircularDeadlinePrecision | undefined) ?? 'date_only',
    totalPosts: (data.totalPosts as number | null) ?? null,
    eligibilitySummaryBn: data.eligibilitySummaryBn as string,
    eligibilitySummaryEn: data.eligibilitySummaryEn as string,
    officialUrl: data.officialUrl as string,
    applyUrl: (data.applyUrl as string | null) ?? null,
    copyStatus: data.copyStatus as CircularCopyStatus,
    copyTextExcerpt: (data.copyTextExcerpt as string | null) ?? null,
    reviewStatus: data.reviewStatus as CircularReviewStatus,
    verifiedBy: (data.verifiedBy as string | null) ?? null,
    verifiedAtMillis: circularTimestampToMillis(data.verifiedAt),
    examDateMillis: circularTimestampToMillis(data.examDate),
    applicationStartDateMillis: circularTimestampToMillis(data.applicationStartDate),
    authorId: data.authorId as string,
    createdAtMillis: circularTimestampToMillis(data.createdAt),
    updatedAtMillis: circularTimestampToMillis(data.updatedAt),
    verificationChecklist: verificationChecklistFromStored(data.verificationChecklist),
    reviewNote: (data.reviewNote as string | null) ?? null,
    lastEditedBy: (data.lastEditedBy as string | null) ?? null,
  };
}

/** End of a Dhaka calendar day, as millis (23:59:59.999
 * Asia/Dhaka). A date-only deadline closes at the END of its
 * day — the notice gave a date, not a time, so the whole day
 * counts as open. */
export function endOfDhakaDayMillis(millis: number): number {
  const key = dhakaDayKey(millis);
  // 23:59:59.999 Dhaka = 17:59:59.999 UTC (UTC+6, no DST).
  return Date.parse(`${key}T23:59:59.999+06:00`);
}

/** The effective closing instant: the stored timestamp for
 * 'datetime' deadlines; end of the deadline day (Dhaka) for
 * 'date_only' ones. Null when no deadline is stored. */
export function circularEffectiveDeadlineMillis(c: JobCircular): number | null {
  if (c.applicationDeadlineMillis === null) return null;
  if (c.deadlinePrecision === 'datetime') return c.applicationDeadlineMillis;
  return endOfDhakaDayMillis(c.applicationDeadlineMillis);
}

/** Application status, computed from the official dates only.
 * Reference example (ChatGPT): opens 1 Dec, deadline 15 Dec —
 * 30 Nov upcoming, 1–11 Dec open, 12–15 Dec closing soon,
 * after the deadline closed. */
export function circularApplicationStatus(c: JobCircular, nowMs: number = Date.now()): CircularApplicationStatus {
  const deadline = circularEffectiveDeadlineMillis(c);
  if (deadline === null) return 'unknown';
  if (nowMs > deadline) return 'closed';
  if (c.applicationStartDateMillis !== null && nowMs < c.applicationStartDateMillis) return 'upcoming';
  // Day granularity (Dhaka calendar days), so the badge always
  // agrees with the displayed days-left count.
  const daysLeft = circularDaysLeft(c, nowMs);
  if (daysLeft !== null && daysLeft <= 3) return 'closing-soon';
  return 'open';
}

/** Verified ONLY when a verifier is recorded. A published
 * circular without verifiedBy is published, not verified. */
export function isCircularVerified(c: JobCircular): boolean {
  return typeof c.verifiedBy === 'string' && c.verifiedBy.trim().length > 0;
}

/** Whole Dhaka calendar days left until the effective deadline.
 * 0 = today is the last day. Null when there is no deadline. */
export function circularDaysLeft(c: JobCircular, nowMs: number = Date.now()): number | null {
  const deadline = circularEffectiveDeadlineMillis(c);
  if (deadline === null) return null;
  const todayKey = dhakaDayKey(nowMs);
  const deadlineKey = dhakaDayKey(deadline);
  const todayStart = Date.parse(`${todayKey}T00:00:00.000Z`);
  const deadlineStart = Date.parse(`${deadlineKey}T00:00:00.000Z`);
  return Math.round((deadlineStart - todayStart) / DAY_MILLIS);
}

/** Bangla status labels (ChatGPT glossary). */
export const CIRCULAR_STATUS_BN: Record<CircularApplicationStatus, string> = {
  upcoming: 'শীঘ্রই আবেদন শুরু',
  open: 'আবেদন চলছে',
  'closing-soon': 'আবেদনের সময় শেষের পথে',
  closed: 'আবেদন শেষ',
  unknown: 'অজানা',
};

export const CIRCULAR_STATUS_EN: Record<CircularApplicationStatus, string> = {
  upcoming: 'Applications open soon',
  open: 'Applications open',
  'closing-soon': 'Closing soon',
  closed: 'Applications closed',
  unknown: 'Unknown',
};

/** Latin digits → Bangla digits (Bangla UI always uses Bangla
 * numerals — the language rule). */
export function toBanglaDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

/** Deadline line for a card: countdown only for a confirmed
 * deadline (ChatGPT non-negotiable #2: no confirmed deadline,
 * no countdown). Day-granularity countdown is honest for both
 * precisions; hours are never shown for date-only deadlines
 * (the time was never specified). */
export function circularDeadlineLine(c: JobCircular, nowMs: number = Date.now()): { bn: string; en: string } {
  const status = circularApplicationStatus(c, nowMs);
  if (status === 'unknown') {
    return {
      bn: 'তথ্য পাওয়া যায়নি — সরকারি উৎসে আবেদনের শেষ তারিখ নিশ্চিত করা যায়নি। আবেদন করার আগে মূল বিজ্ঞপ্তিটি দেখুন।',
      en: 'Not available — the application deadline could not be confirmed from the official source. See the original circular before applying.',
    };
  }
  const days = circularDaysLeft(c, nowMs);
  if (status === 'closed') {
    return { bn: 'আবেদনের সময় শেষ', en: 'Application period ended' };
  }
  if (days === 0) {
    return { bn: 'আজ শেষ দিন', en: 'Last day today' };
  }
  if (days !== null && days > 0) {
    return { bn: `আর ${toBanglaDigits(days)} দিন বাকি`, en: `${days} day${days === 1 ? '' : 's'} left` };
  }
  return { bn: 'আবেদন চলছে', en: 'Applications open' };
}

/** Whether the Apply action may be shown (ChatGPT
 * non-negotiable #3: no confirmed application link, no Apply
 * Now). Requires verified + a stored apply link + an open
 * window. Unverified, unknown-deadline, upcoming and closed
 * circulars never get an Apply button. */
export function canShowApply(c: JobCircular, nowMs: number = Date.now()): boolean {
  if (!isCircularVerified(c)) return false;
  if (!isNonEmptyString(c.applyUrl)) return false;
  const status = circularApplicationStatus(c, nowMs);
  return status === 'open' || status === 'closing-soon';
}

/** Hostname of a URL for display ("bpsc.gov.bd") — students
 * must see WHERE an external link goes before tapping it.
 * Falls back to the raw string when it cannot be parsed. */
export function circularDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Sort for the list: verified first, then newest published
 * date first (ChatGPT: default sort newest verified first).
 * Docs without a published date sort last within their group. */
export function sortCirculars(list: JobCircular[]): JobCircular[] {
  return [...list].sort((a, b) => {
    const av = isCircularVerified(a) ? 0 : 1;
    const bv = isCircularVerified(b) ? 0 : 1;
    if (av !== bv) return av - bv;
    const ad = a.publishedDateMillis ?? -1;
    const bd = b.publishedDateMillis ?? -1;
    if (ad !== bd) return bd - ad;
    return a.docId.localeCompare(b.docId);
  });
}

export interface CircularFilters {
  examSlug: string | null;
  /** Application-status filter, or null for all. */
  status: CircularApplicationStatus | null;
  /** When true, only verified circulars. */
  verifiedOnly: boolean;
  /** Free-text search (Bangla + English org/title). */
  search: string;
}

export const EMPTY_CIRCULAR_FILTERS: CircularFilters = {
  examSlug: null,
  status: null,
  verifiedOnly: false,
  search: '',
};

/** Client-side filters over an already-fetched page (the
 * Firestore query already restricts to published docs, and to
 * one exam when an exam chip is active — see
 * listPublishedCirculars). Status is computed, so it can only
 * ever be a client-side filter. */
export function filterCirculars(
  list: JobCircular[],
  filters: CircularFilters,
  nowMs: number = Date.now(),
  examLabel: (slug: string) => string = (s) => s,
): JobCircular[] {
  const q = filters.search.trim().toLocaleLowerCase();
  return list.filter((c) => {
    if (filters.examSlug !== null && c.examSlug !== filters.examSlug) return false;
    if (filters.verifiedOnly && !isCircularVerified(c)) return false;
    if (filters.status !== null && circularApplicationStatus(c, nowMs) !== filters.status) return false;
    if (q.length > 0) {
      const hay = [
        c.postTitleBn,
        c.postTitleEn,
        c.circularNumber ?? '',
        examLabel(c.examSlug),
        c.examSlug,
      ]
        .join(' ')
        .toLocaleLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Format a millis timestamp as a Bangla/English date in
 * Asia/Dhaka, always WITH the year (ChatGPT mistake #2: never
 * show only the date without the year). Time is included only
 * for 'datetime' deadlines. */
export function formatDhakaDate(millis: number, lang: string, includeTime: boolean): string {
  const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';
  const date = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(millis));
  if (!includeTime) return date;
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(millis));
  return `${date}, ${time}`;
}
