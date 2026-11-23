// Eduvelto — Global Opportunity Hub (directive §3B, 23 Nov 2026): pure helpers, no Firestore.
//
// An opportunity is a job, remote job, freelancing platform, internship,
// scholarship or skill-development listing, stored in the `opportunities`
// collection. The Firestore rules (Phase 4, already live) allow public
// read of reviewStatus == 'Published' docs only; moderators create/update,
// Admin deletes. NOTE the capital-'Published' convention: unlike
// `circulars` (lowercase 'published'), opportunities use isPublished(),
// which checks 'Published' — the loader and the seed must use the
// capital form, or public reads silently return nothing.
//
// HONESTY (binding — same rules as jobCirculars.ts, adapted):
// - Verified ≠ published. A listing shows "অফিসিয়াল উৎসে যাচাইকৃত"
//   ONLY when verifiedBy is recorded AND verificationLevel is set.
//   A merely published listing shows "যাচাই করা হয়নি".
// - Verification LEVEL is shown, not hidden: 'official' = the official
//   page text was fetched and read; 'official-indexed' = the official
//   site's own indexed record / homepage corroborated the details but
//   the full notice text did not render in the fetch — the detail page
//   says exactly that, and the parent re-checks it in a live browser
//   before the live deploy.
// - Application status is NEVER stored and NEVER taken from a manual
//   field — it is computed here from the official dates. Verification
//   and application status are TWO separate dimensions.
// - Missing deadline = unknown, never guessed: no countdown, no Open
//   badge, no Apply promotion — "তথ্য পাওয়া যায়নি". The one
//   exception is a rolling platform/course listing (isPlatform):
//   continuously open, shown as "সবসময় খোলা", never as a dated
//   deadline.
// - A date-only deadline never invents a closing time: the listing
//   closes at end of day, Asia/Dhaka (conservative).
// - All date math is Asia/Dhaka, never the device timezone.
// - No Apply button without a confirmed apply link: the Apply action
//   needs verified + a stored applyUrl + an open/rolling window.
// - Expired listings stay listed and searchable (marked "আবেদন শেষ")
//   — they are never deleted or hidden, so users can see what closed
//   and moderators can re-verify an extension.
// - No income is ever promised: freelancing platforms are described
//   as platforms, never with earnings claims; scholarships state
//   what they cover, never what a reader "will get".

import { dhakaDayKey } from './jobDashboard';
import { endOfDhakaDayMillis, formatDhakaDate, toBanglaDigits } from './jobCirculars';

export type OpportunityType =
  | 'job'
  | 'remote'
  | 'freelance'
  | 'internship'
  | 'scholarship'
  | 'skill';

export const OPPORTUNITY_TYPES: OpportunityType[] = [
  'job',
  'remote',
  'freelance',
  'internship',
  'scholarship',
  'skill',
];

export const OPPORTUNITY_TYPE_BN: Record<OpportunityType, string> = {
  job: 'চাকরি',
  remote: 'রিমোট চাকরি',
  freelance: 'ফ্রিল্যান্সিং',
  internship: 'ইন্টার্নশিপ',
  scholarship: 'স্কলারশিপ',
  skill: 'দক্ষতা উন্নয়ন',
};

export const OPPORTUNITY_TYPE_EN: Record<OpportunityType, string> = {
  job: 'Jobs',
  remote: 'Remote Jobs',
  freelance: 'Freelancing',
  internship: 'Internships',
  scholarship: 'Scholarships',
  skill: 'Skill Development',
};

/** Review status — capital-'Published' is what the rules'
 * isPublished() checks. Draft states match isDraftStatus(). */
export type OpportunityReviewStatus =
  | 'Published'
  | 'Not Started'
  | 'In Progress'
  | 'Under Review'
  | 'Rejected';

export const OPPORTUNITY_REVIEW_STATUSES: OpportunityReviewStatus[] = [
  'Published',
  'Not Started',
  'In Progress',
  'Under Review',
  'Rejected',
];

/** How the listing was verified. 'official-indexed' is NOT a
 * weaker claim to hide — the detail page states the method. */
export type OpportunityVerificationLevel = 'official' | 'official-indexed';

export type OpportunityDeadlinePrecision = 'date_only' | 'datetime';

/** Application status — always COMPUTED, never stored. */
export type OpportunityStatus =
  | 'upcoming'
  | 'open'
  | 'closing-soon'
  | 'closed'
  | 'rolling'
  | 'unknown';

export interface Opportunity {
  docId: string;
  type: OpportunityType;
  titleBn: string;
  titleEn: string;
  organizationBn: string;
  organizationEn: string;
  countryBn: string;
  countryEn: string;
  /** Who may apply — from the official source, or "মূল বিজ্ঞপ্তিতে দেখুন". */
  eligibilityBn: string;
  eligibilityEn: string;
  descriptionBn: string;
  descriptionEn: string;
  /** Official source name, e.g. "বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)". */
  sourceName: string;
  /** Official source URL (the page that was verified). */
  sourceUrl: string;
  /** Official application link, or null when not confirmed. */
  applyUrl: string | null;
  publishedDateMillis: number | null;
  deadlineMillis: number | null;
  deadlinePrecision: OpportunityDeadlinePrecision;
  /** True for continuously-open platforms/courses with no deadline. */
  isPlatform: boolean;
  verificationLevel: OpportunityVerificationLevel;
  /** Caveats from the verification (e.g. "পদসংখ্যা নিশ্চিত না
   * হওয়ায় প্রকাশ করা হয়নি") — shown on the detail page. */
  verificationNoteBn: string | null;
  verificationNoteEn: string | null;
  /** Verifier id, or null — presence is what makes a listing
   * "verified" in the UI (see isOpportunityVerified). */
  verifiedBy: string | null;
  verifiedAtMillis: number | null;
  reviewStatus: OpportunityReviewStatus;
  authorId: string;
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
}

/** The rules allowlist for /opportunities docs — kept here so the
 * client validator and the seed script can never drift apart
 * silently. (The Phase 4 rules do not enforce a key allowlist on
 * update; this list is what moderators and the seed script write.) */
export const OPPORTUNITY_ALLOWED_KEYS: string[] = [
  'type',
  'titleBn',
  'titleEn',
  'organizationBn',
  'organizationEn',
  'countryBn',
  'countryEn',
  'eligibilityBn',
  'eligibilityEn',
  'descriptionBn',
  'descriptionEn',
  'sourceName',
  'sourceUrl',
  'applyUrl',
  'publishedDate',
  'applicationDeadline',
  'deadlinePrecision',
  'isPlatform',
  'verificationLevel',
  'verificationNoteBn',
  'verificationNoteEn',
  'reviewStatus',
  'verifiedBy',
  'verifiedAt',
  'authorId',
  'createdAt',
  'updatedAt',
];

const DAY_MILLIS = 24 * 60 * 60 * 1000;

/** Firestore Timestamp / Date / number / null → millis or null. */
export function opportunityTimestampToMillis(t: unknown): number | null {
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

function isHttpUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Client-side validator mirroring the data model. Returns
 * problem strings (empty = valid). The rules are the authority;
 * this only fails fast before a write is attempted. */
export function validateOpportunity(data: Record<string, unknown>, docId: string): string[] {
  const label = `opportunities/${docId}`;
  const problems: string[] = [];
  for (const k of Object.keys(data)) {
    if (!OPPORTUNITY_ALLOWED_KEYS.includes(k)) problems.push(`${label}: unexpected key '${k}'`);
  }
  if (typeof data.type !== 'string' || !OPPORTUNITY_TYPES.includes(data.type as OpportunityType)) {
    problems.push(`${label}: type must be one of ${OPPORTUNITY_TYPES.join(', ')}`);
  }
  for (const f of ['titleBn', 'titleEn', 'organizationBn', 'organizationEn', 'countryBn', 'countryEn', 'eligibilityBn', 'eligibilityEn', 'descriptionBn', 'descriptionEn', 'sourceName', 'authorId']) {
    if (!isNonEmptyString(data[f])) problems.push(`${label}: ${f} must be a non-empty string`);
  }
  if (!isHttpUrl(data.sourceUrl)) problems.push(`${label}: sourceUrl must be an http(s) URL`);
  if (data.applyUrl !== null && data.applyUrl !== undefined && !isHttpUrl(data.applyUrl)) {
    problems.push(`${label}: applyUrl must be an http(s) URL or null`);
  }
  if (typeof data.isPlatform !== 'boolean') problems.push(`${label}: isPlatform must be a boolean`);
  if (data.verificationLevel !== 'official' && data.verificationLevel !== 'official-indexed') {
    problems.push(`${label}: verificationLevel must be 'official' or 'official-indexed'`);
  }
  if (!isNullableString(data.verificationNoteBn)) problems.push(`${label}: verificationNoteBn must be string or null`);
  if (!isNullableString(data.verificationNoteEn)) problems.push(`${label}: verificationNoteEn must be string or null`);
  if (!isNullableString(data.verifiedBy)) problems.push(`${label}: verifiedBy must be string or null`);
  if (typeof data.reviewStatus !== 'string' || !OPPORTUNITY_REVIEW_STATUSES.includes(data.reviewStatus as OpportunityReviewStatus)) {
    problems.push(`${label}: reviewStatus must be one of ${OPPORTUNITY_REVIEW_STATUSES.join(', ')}`);
  }
  if (data.deadlinePrecision !== undefined && data.deadlinePrecision !== 'date_only' && data.deadlinePrecision !== 'datetime') {
    problems.push(`${label}: deadlinePrecision must be 'date_only' or 'datetime'`);
  }
  if (data.isPlatform === true && data.applicationDeadline !== null && data.applicationDeadline !== undefined) {
    problems.push(`${label}: a platform listing must not carry a deadline`);
  }
  for (const f of ['publishedDate', 'applicationDeadline', 'verifiedAt', 'createdAt', 'updatedAt']) {
    if (data[f] !== null && data[f] !== undefined && opportunityTimestampToMillis(data[f]) === null) {
      problems.push(`${label}: ${f} must be a timestamp or null`);
    }
  }
  return problems;
}

/** Normalise a stored doc into an Opportunity, or null when the
 * doc fails validation (never render a malformed listing). */
export function opportunityFromStored(docId: string, data: Record<string, unknown>): Opportunity | null {
  if (validateOpportunity(data, docId).length > 0) return null;
  return {
    docId,
    type: data.type as OpportunityType,
    titleBn: data.titleBn as string,
    titleEn: data.titleEn as string,
    organizationBn: data.organizationBn as string,
    organizationEn: data.organizationEn as string,
    countryBn: data.countryBn as string,
    countryEn: data.countryEn as string,
    eligibilityBn: data.eligibilityBn as string,
    eligibilityEn: data.eligibilityEn as string,
    descriptionBn: data.descriptionBn as string,
    descriptionEn: data.descriptionEn as string,
    sourceName: data.sourceName as string,
    sourceUrl: data.sourceUrl as string,
    applyUrl: (data.applyUrl as string | null) ?? null,
    publishedDateMillis: opportunityTimestampToMillis(data.publishedDate),
    deadlineMillis: opportunityTimestampToMillis(data.applicationDeadline),
    deadlinePrecision: (data.deadlinePrecision as OpportunityDeadlinePrecision | undefined) ?? 'date_only',
    isPlatform: data.isPlatform as boolean,
    verificationLevel: data.verificationLevel as OpportunityVerificationLevel,
    verificationNoteBn: (data.verificationNoteBn as string | null) ?? null,
    verificationNoteEn: (data.verificationNoteEn as string | null) ?? null,
    verifiedBy: (data.verifiedBy as string | null) ?? null,
    verifiedAtMillis: opportunityTimestampToMillis(data.verifiedAt),
    reviewStatus: data.reviewStatus as OpportunityReviewStatus,
    authorId: data.authorId as string,
    createdAtMillis: opportunityTimestampToMillis(data.createdAt),
    updatedAtMillis: opportunityTimestampToMillis(data.updatedAt),
  };
}

/** The effective closing instant: the stored timestamp for
 * 'datetime' deadlines; end of the deadline day (Dhaka) for
 * 'date_only' ones. Null when no deadline is stored. */
export function opportunityEffectiveDeadlineMillis(o: Opportunity): number | null {
  if (o.deadlineMillis === null) return null;
  if (o.deadlinePrecision === 'datetime') return o.deadlineMillis;
  return endOfDhakaDayMillis(o.deadlineMillis);
}

/** Application status, computed from the official dates only.
 * Rolling platforms are 'rolling'; a dated listing with no
 * deadline and no platform flag is 'unknown'. */
export function opportunityStatus(o: Opportunity, nowMs: number = Date.now()): OpportunityStatus {
  if (o.isPlatform) return 'rolling';
  const deadline = opportunityEffectiveDeadlineMillis(o);
  if (deadline === null) return 'unknown';
  if (nowMs > deadline) return 'closed';
  const daysLeft = opportunityDaysLeft(o, nowMs);
  if (daysLeft !== null && daysLeft <= 3) return 'closing-soon';
  return 'open';
}

/** Published — mirrors the Firestore rules isPublished():
 * reviewStatus is exactly capital-'Published'. Verified is a
 * separate dimension (see isOpportunityVerified). */
export function isPublished(o: Opportunity): boolean {
  return o.reviewStatus === 'Published';
}

/** Verified ONLY when a verifier is recorded. A published
 * listing without verifiedBy is published, not verified. */
export function isOpportunityVerified(o: Opportunity): boolean {
  return typeof o.verifiedBy === 'string' && o.verifiedBy.trim().length > 0;
}

/** Whole Dhaka calendar days left until the effective deadline.
 * 0 = today is the last day. Null when there is no deadline. */
export function opportunityDaysLeft(o: Opportunity, nowMs: number = Date.now()): number | null {
  const deadline = opportunityEffectiveDeadlineMillis(o);
  if (deadline === null) return null;
  const todayKey = dhakaDayKey(nowMs);
  const deadlineKey = dhakaDayKey(deadline);
  const todayStart = Date.parse(`${todayKey}T00:00:00.000Z`);
  const deadlineStart = Date.parse(`${deadlineKey}T00:00:00.000Z`);
  return Math.round((deadlineStart - todayStart) / DAY_MILLIS);
}

/** Bangla status labels. */
export const OPPORTUNITY_STATUS_BN: Record<OpportunityStatus, string> = {
  upcoming: 'শীঘ্রই আবেদন শুরু',
  open: 'আবেদন চলছে',
  'closing-soon': 'আবেদনের সময় শেষের পথে',
  closed: 'আবেদন শেষ',
  rolling: 'সবসময় খোলা',
  unknown: 'অজানা',
};

export const OPPORTUNITY_STATUS_EN: Record<OpportunityStatus, string> = {
  upcoming: 'Applications open soon',
  open: 'Applications open',
  'closing-soon': 'Closing soon',
  closed: 'Applications closed',
  rolling: 'Always open',
  unknown: 'Unknown',
};

/** Deadline line for a card: countdown only for a confirmed
 * deadline. Rolling listings never show a countdown; unknown
 * deadlines show the honest "not available" line. */
export function opportunityDeadlineLine(o: Opportunity, nowMs: number = Date.now()): { bn: string; en: string } {
  const status = opportunityStatus(o, nowMs);
  if (status === 'rolling') {
    return { bn: 'সবসময় খোলা — নিজের সময়ে শুরু করুন', en: 'Always open — start at your own pace' };
  }
  if (status === 'unknown') {
    return {
      bn: 'তথ্য পাওয়া যায়নি — অফিসিয়াল উৎসে আবেদনের শেষ তারিখ নিশ্চিত করা যায়নি। আবেদন করার আগে মূল বিজ্ঞপ্তিটি দেখুন।',
      en: 'Not available — the application deadline could not be confirmed from the official source. See the original notice before applying.',
    };
  }
  const days = opportunityDaysLeft(o, nowMs);
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

/** Whether the Apply action may be shown: verified + a stored
 * apply link + an open/rolling window. Unverified, unknown,
 * upcoming and closed listings never get an Apply button. */
export function canShowApply(o: Opportunity, nowMs: number = Date.now()): boolean {
  if (!isOpportunityVerified(o)) return false;
  if (!isNonEmptyString(o.applyUrl)) return false;
  const status = opportunityStatus(o, nowMs);
  return status === 'open' || status === 'closing-soon' || status === 'rolling';
}

/** Hostname of a URL for display ("bpsc.gov.bd") — users must
 * see WHERE an external link goes before tapping it. */
export function opportunityDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Format a millis timestamp as a Bangla/English date in
 * Asia/Dhaka, always WITH the year. Re-exported from the
 * circulars helper so callers have one date formatter. */
export const formatOpportunityDate = formatDhakaDate;

/** Verification-level label for the detail page. */
export function verificationLevelLine(o: Opportunity): { bn: string; en: string } {
  if (o.verificationLevel === 'official') {
    return {
      bn: 'অফিসিয়াল পাতা খুলে পড়ে যাচাই করা হয়েছে',
      en: 'Verified by reading the official page',
    };
  }
  return {
    bn: 'অফিসিয়াল সাইটের নিজস্ব তথ্য থেকে যাচাই করা হয়েছে — মূল নোটিশটি আবার খুলে দেখা বাকি',
    en: 'Verified from the official site\u2019s own records — the original notice still needs a full re-check',
  };
}

/** Sort for the list: open/closing-soon first (nearest deadline
 * first), then upcoming, rolling, unknown, closed last. Docs
 * without a deadline sort last within their group. */
export function sortOpportunities(list: Opportunity[], nowMs: number = Date.now()): Opportunity[] {
  const group = (o: Opportunity): number => {
    switch (opportunityStatus(o, nowMs)) {
      case 'open':
      case 'closing-soon':
        return 0;
      case 'upcoming':
        return 1;
      case 'rolling':
        return 2;
      case 'unknown':
        return 3;
      case 'closed':
        return 4;
    }
  };
  return [...list].sort((a, b) => {
    const ga = group(a);
    const gb = group(b);
    if (ga !== gb) return ga - gb;
    const ad = opportunityEffectiveDeadlineMillis(a) ?? Number.POSITIVE_INFINITY;
    const bd = opportunityEffectiveDeadlineMillis(b) ?? Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;
    const ap = a.publishedDateMillis ?? -1;
    const bp = b.publishedDateMillis ?? -1;
    if (ap !== bp) return bp - ap;
    return a.docId.localeCompare(b.docId);
  });
}

export interface OpportunityFilters {
  type: OpportunityType | null;
  /** Application-status filter, or null for all. */
  status: OpportunityStatus | null;
  /** When true, only verified listings. */
  verifiedOnly: boolean;
  /** Free-text search (Bangla + English title/org/country). */
  search: string;
}

export const EMPTY_OPPORTUNITY_FILTERS: OpportunityFilters = {
  type: null,
  status: null,
  verifiedOnly: false,
  search: '',
};

/** Client-side filters over an already-fetched page (the
 * Firestore query already restricts to Published docs, and to
 * one type when a chip is active — see listPublishedOpportunities).
 * Status is computed, so it can only ever be a client-side filter. */
export function filterOpportunities(
  list: Opportunity[],
  filters: OpportunityFilters,
  nowMs: number = Date.now(),
): Opportunity[] {
  const q = filters.search.trim().toLocaleLowerCase();
  return list.filter((o) => {
    if (filters.type !== null && o.type !== filters.type) return false;
    if (filters.verifiedOnly && !isOpportunityVerified(o)) return false;
    if (filters.status !== null && opportunityStatus(o, nowMs) !== filters.status) return false;
    if (q.length > 0) {
      const hay = [o.titleBn, o.titleEn, o.organizationBn, o.organizationEn, o.countryBn, o.countryEn]
        .join(' ')
        .toLocaleLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
