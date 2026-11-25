// Eduvelto — Question Paper Generator Phase 2: Question Contribution.
//
// Teachers submit their own questions; an admin reviews each one;
// approved questions enter the verified pool (with contributor
// attribution); contributors earn points and discount coupons. The
// verified bank grows with the community — without ever letting
// unverified content into the pool.
//
// NEVER auto-publish, never auto-verify, never auto-award. Approval
// is a human admin action, every time. A submission claiming to be a
// board question without a verifiable source is rejected (the bank
// holds 0 verified board questions). NCTB book text reproduced
// verbatim is rejected (the book is a reference only).
//
// Points / coupon / level values are PROPOSALS (spec §3, §8.8–§8.11 —
// owner confirms): 10 points per approved question, সক্রিয় at 50
// points, ৳10-off coupon per approved question, max 3 per order,
// valid 30 days. They live here as NAMED constants so the values can
// change in one place when the owner decides — no value is hidden in
// UI copy.

import type {
  QpgCognitiveLevel,
  QpgDifficulty,
  QpgQuestionNature,
  QpgQuestionType,
} from './questionPaper';

/** Submission status. DRAFT = pending_review — never in the pool. */
export type QpgContributionStatus = 'pending_review' | 'approved' | 'rejected';

export type QpgContributionRejectReason =
  | 'wrong-answer'
  | 'copied-verbatim'
  | 'already-exists'
  | 'off-syllabus'
  | 'low-quality'
  | 'board-claim-unverified';

export const QPG_CONTRIBUTION_REJECT_REASONS: Array<{
  id: QpgContributionRejectReason;
  nameBn: string;
  nameEn: string;
}> = [
  { id: 'wrong-answer', nameBn: 'ভুল উত্তর', nameEn: 'Wrong answer' },
  { id: 'copied-verbatim', nameBn: 'বইয়ের লেখা হুবহু কপি', nameEn: 'Copied verbatim from a book' },
  { id: 'already-exists', nameBn: 'আগে থেকেই আছে', nameEn: 'Already exists' },
  { id: 'off-syllabus', nameBn: 'সিলেবাসের বাইরে', nameEn: 'Off syllabus' },
  { id: 'low-quality', nameBn: 'নিম্ন মান', nameEn: 'Low quality' },
  {
    id: 'board-claim-unverified',
    nameBn: 'বোর্ড প্রশ্ন দাবি — যাচাইযোগ্য উৎস নেই',
    nameEn: 'Claims to be a board question without a verifiable source',
  },
];

export interface QpgContributionDoc {
  contributorUid: string;
  contributorName: string;
  institution: string;
  stream: 'general' | 'madrasah';
  classId: string;
  subjectId: string;
  chapterId: string;
  topic: string;
  type: QpgQuestionType;
  questionText: string;
  /** MCQ: exactly 4 options. CQ / Short: empty. */
  options: string[];
  /** MCQ: index 0–3 into options. CQ / Short: the model answer text. */
  correctAnswer: number | string;
  explanation: string;
  source: string;
  difficulty: Exclude<QpgDifficulty, 'all'>;
  cognitiveLevel: QpgCognitiveLevel;
  nature: QpgQuestionNature;
  /** The teacher confirms this is their own wording, not a verbatim
   *  copy of book text. */
  ownWordingConfirmed: boolean;
  status: QpgContributionStatus;
  rejectReason?: QpgContributionRejectReason;
  rejectNote?: string;
  reviewedByUid?: string;
  reviewedAt?: string;
  pointsAwarded?: number;
  couponCode?: string;
  couponExpiresAt?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Points / coupons / levels — PROPOSALS (spec §8.8–§8.11). The owner
// has NOT confirmed these values yet. The build uses them as named
// constants and the UI labels them as proposals where they surface;
// nothing is presented as a decided reward until he confirms.
// ---------------------------------------------------------------------

/** PROPOSAL (§8.8): points per approved question. */
export const QPG_CONTRIBUTION_POINTS_PER_APPROVAL = 10;
/** PROPOSAL (§8.8): points at which a contributor becomes সক্রিয়
 *  (5 approved questions at 10 points each). */
export const QPG_CONTRIBUTOR_ACTIVE_POINTS = 50;
/** PROPOSAL (§8.9): ৳ off Pro per approved question. */
export const QPG_CONTRIBUTION_COUPON_BDT = 10;
/** PROPOSAL (§8.9): max coupons stackable on one order (max ৳30 off). */
export const QPG_CONTRIBUTION_COUPON_MAX_PER_ORDER = 3;
/** PROPOSAL (§8.9): coupon validity in days from approval. */
export const QPG_CONTRIBUTION_COUPON_VALID_DAYS = 30;
/** PROPOSAL (§3 abuse prevention): max submissions per teacher per day. */
export const QPG_CONTRIBUTION_MAX_PER_DAY = 20;

export type QpgContributorLevel = 'নবীন' | 'সক্রিয়';

export function contributorLevelFor(points: number): QpgContributorLevel {
  return points >= QPG_CONTRIBUTOR_ACTIVE_POINTS ? 'সক্রিয়' : 'নবীন';
}

export interface QpgContributorStatsDoc {
  uid: string;
  displayName: string;
  institution: string;
  totalSubmitted: number;
  approved: number;
  rejected: number;
  points: number;
  level: QpgContributorLevel;
  /** Names + institutions only — never phone/email in stats docs. */
  updatedAt: string;
}

export function validateQpgContribution(doc: Partial<QpgContributionDoc>): string[] {
  const problems: string[] = [];
  if (!doc.contributorUid || typeof doc.contributorUid !== 'string') {
    problems.push('contributorUid is required');
  }
  if (!doc.contributorName || typeof doc.contributorName !== 'string') {
    problems.push('contributorName is required');
  }
  if (doc.stream !== 'general' && doc.stream !== 'madrasah') {
    problems.push('stream must be general or madrasah');
  }
  if (!doc.classId || !doc.subjectId || !doc.chapterId) {
    problems.push('classId, subjectId and chapterId are required');
  }
  if (!doc.topic || typeof doc.topic !== 'string') problems.push('topic is required');
  if (!doc.type || !['mcq', 'cq', 'short', 'multi-completion', 'situation-set', 'picture-based'].includes(doc.type)) {
    problems.push('type must be a known question type');
  }
  if (!doc.questionText || doc.questionText.trim().length < 10) {
    problems.push('questionText must be at least 10 characters');
  }
  if (doc.type === 'mcq') {
    if (!Array.isArray(doc.options) || doc.options.length !== 4) {
      problems.push('MCQ needs exactly 4 options');
    } else if (doc.options.some((o) => typeof o !== 'string' || o.trim().length === 0)) {
      problems.push('every MCQ option must be non-empty text');
    }
    if (typeof doc.correctAnswer !== 'number' || doc.correctAnswer < 0 || doc.correctAnswer > 3) {
      problems.push('MCQ needs exactly one correct option (index 0–3)');
    }
  } else if (typeof doc.correctAnswer !== 'string' || doc.correctAnswer.trim().length === 0) {
    problems.push('a model answer is required for non-MCQ questions');
  }
  if (!doc.explanation || doc.explanation.trim().length < 10) {
    problems.push('explanation is required (at least 10 characters)');
  }
  if (!doc.ownWordingConfirmed) {
    problems.push('confirm the question is your own wording, not a verbatim book copy');
  }
  if (doc.status !== 'pending_review') {
    problems.push('a new submission must start as pending_review');
  }
  // A submission claiming board provenance without a verifiable
  // source is rejected at review — but it must never even be
  // SUBMITTED as a board question: the source field may name a
  // book/chapter, never "board question" without a citation.
  if (
    typeof doc.source === 'string' &&
    /বোর্ড/i.test(doc.source) &&
    doc.source.trim().length < 20
  ) {
    problems.push('a board-question claim needs a verifiable source (board + year + paper)');
  }
  return problems;
}

// ---------------------------------------------------------------------
// Duplicate detection (review queue). Normalized-text match: lowercase,
// strip punctuation + whitespace, fold Bangla digits to Latin. The
// admin decides — a flag is a hint, never an auto-reject.
// ---------------------------------------------------------------------

const BANGLA_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function normalizeQuestionText(text: string): string {
  return text
    .split('')
    .map((ch) => BANGLA_DIGITS[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Possible duplicates of `text` in `pool` (question texts). An exact
 *  normalized match always counts. A containment match (one text
 *  containing the other — a submission that adds/removes a clause)
 *  counts only for longer texts (≥10 chars), so short math questions
 *  like "৩ + ৪ = কত?" do not false-positive on every pool entry.
 *  Returns the matching pool entries (up to `limit`). */
export function findPossibleDuplicates(
  text: string,
  pool: Array<{ id: string; questionText: string }>,
  limit = 5,
): Array<{ id: string; questionText: string }> {
  const norm = normalizeQuestionText(text);
  if (norm.length < 4) return [];
  const hits: Array<{ id: string; questionText: string }> = [];
  for (const item of pool) {
    const other = normalizeQuestionText(item.questionText);
    if (!other) continue;
    if (other === norm) {
      hits.push(item);
    } else if (
      norm.length >= 10 &&
      other.length >= 10 &&
      (other.includes(norm) || norm.includes(other))
    ) {
      hits.push(item);
    }
    if (hits.length >= limit) break;
  }
  return hits;
}

// ---------------------------------------------------------------------
// Approval outcome (pure): what the admin's batched write applies.
// Coupon codes are random and not guessable.
// ---------------------------------------------------------------------

/** Random coupon code (12 chars, unambiguous alphabet — no 0/O/1/I). */
export function generateCouponCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `EDU-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}

export interface ContributionApproval {
  pointsAwarded: number;
  couponCode: string;
  couponExpiresAt: string;
  newStats: Pick<QpgContributorStatsDoc, 'approved' | 'points' | 'level'>;
}

/** Compute the approval outcome for one contribution. The caller
 *  (admin batched write) applies it to the contribution + the
 *  contributor stats in one batch — no Cloud Functions. Coupons are
 *  issued ONLY here, never on submit. */
export function contributionApprovalFor(
  stats: Pick<QpgContributorStatsDoc, 'approved' | 'points'>,
  now = new Date(),
): ContributionApproval {
  const pointsAwarded = QPG_CONTRIBUTION_POINTS_PER_APPROVAL;
  const approved = stats.approved + 1;
  const points = stats.points + pointsAwarded;
  const expires = new Date(now.getTime() + QPG_CONTRIBUTION_COUPON_VALID_DAYS * 24 * 60 * 60 * 1000);
  return {
    pointsAwarded,
    couponCode: generateCouponCode(),
    couponExpiresAt: expires.toISOString(),
    newStats: { approved, points, level: contributorLevelFor(points) },
  };
}

/** Leaderboard: top contributors by points (public read, top 20 —
 *  no personal contact info in stats docs). Pure sort. */
export function topContributors(
  stats: QpgContributorStatsDoc[],
  limit = 20,
): QpgContributorStatsDoc[] {
  return [...stats].sort((a, b) => b.points - a.points || b.approved - a.approved).slice(0, limit);
}
