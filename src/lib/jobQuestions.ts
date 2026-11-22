/**
 * Eduvelto Job Preparation — Question Bank + Verification (Step 7).
 *
 * Two-tier bank (Step 3 §0.3 #1, §2.7–§2.9, §4):
 *   (a) `jobQuestions` — the bank record, one doc per question, with
 *       the correct answer + explanation + verification history.
 *       Students can NEVER read it (no `allow read` for students in
 *       the rules — a UI bug cannot leak it).
 *   (b) `jobQuestionBundles` — the student-reading tier: one doc per
 *       topic/mock, questions + options ONLY (no correct answer, no
 *       explanation — enforced in the rules by a field ban).
 *   (c) `jobQuestionKeys` — the answer key, one doc per bundle,
 *       receipt-gated (§4.2): a student reads a mock key only with a
 *       fresh (≤10 min) receipt anchored to a SUBMITTED attempt
 *       (Step 6 fold-in P0-06 gate — a receipt is never proof on its
 *       own; it must reference a real submission); a topic
 *       (practice) bundle's key is readable signed-in for immediate
 *       feedback. Scores are client-computed and NEVER shown as
 *       "Verified" (Step 3 §4.4 BINDING).
 *
 * TRUST BOUNDARY (Step 7 fold-in, ChatGPT P0-01/P0-02 — read this
 * before touching receipts or attempts):
 *   (1) A receipt is a TEN-MINUTE, ATTEMPT-BOUND AUTHORIZATION
 *       WINDOW, not one-use. Firestore read rules cannot consume a
 *       receipt as a side effect of a read, so repeat reads inside
 *       the window are possible BY DESIGN. Never claim one-use.
 *       The window cannot be refreshed (receipts are never updated
 *       and only an Admin deletes one) — one window per student per
 *       bundle.
 *   (2) A "submitted" attempt is CLIENT-ATTESTED, not verified.
 *       The student controls the browser, so a determined student
 *       can create an in-progress attempt, submit it without
 *       answering, mint a receipt and read a mock key — the rules
 *       CANNOT distinguish that from a genuine attempt. "Submitted"
 *       means "a client submitted an attempt record"; it is never
 *       proof of genuine completion and never produces a "Verified"
 *       score. Server-side verification would need a trusted
 *       backend (Blaze — no approval, ৳0 budget). The rules +
 *       tests document this limitation instead of pretending it
 *       away (see the a5 documented-limitation test).
 *
 * State machine (Step 3 §2.7, ADAPTED to the Step 5/6 two-field
 * model — status + reviewStatus — instead of the draft's single
 * `reviewStatus` enum; see the Step 7 report §Decisions):
 *   Not Started → In Progress → Under Review → Published
 *   (verifiedBy/verifiedAt, set by a non-author, IS the "verified"
 *   step — publishing requires a real verifier + timestamp)
 *   any non-published state → Rejected (reason ≥10 chars)
 *   any state → Archived (withdrawn — never in a bundle)
 *   Published → Not Started (return for correction, version +1)
 *   NEVER draft → published directly.
 *
 * 0 verified teachers today — the bank is EMPTY by policy. No
 * question is invented here; the seed is empty (disk-only) and the
 * verification queue is empty until a verified teacher writes.
 */

import { JOB_SUBJECTS } from './jobContent';
import { JOB_RULES_CONFIGS } from './jobExams';

/** Config version the Step 7 seed + docs were derived from (Step 6
 * P2-02 pattern — same version as the Step 6 content seed). */
export const JOB_QUESTION_CONFIG_VERSION = '2026-11-22.1';

/** Fresh-receipt window (Step 3 §2.13/§4.2): a receipt older than
 * this does not open a key. */
export const JOB_RECEIPT_WINDOW_MINUTES = 10;

/** Question review states (two-field model — see header). 'Rejected'
 * and 'Archived' extend the Step 5/6 vocabulary for the bank. */
export const JOB_QUESTION_REVIEW_STATES = [
  'Not Started',
  'In Progress',
  'Under Review',
  'Published',
  'Rejected',
  'Archived',
] as const;
export type JobQuestionReviewState = (typeof JOB_QUESTION_REVIEW_STATES)[number];

export const JOB_QUESTION_DRAFT_REVIEW_STATES = [
  'Not Started',
  'In Progress',
  'Under Review',
] as const;

export const JOB_QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type JobQuestionDifficulty = (typeof JOB_QUESTION_DIFFICULTIES)[number];

export const JOB_BUNDLE_KINDS = ['topic', 'mock', 'daily', 'weekly', 'previous'] as const;
export type JobBundleKind = (typeof JOB_BUNDLE_KINDS)[number];

export const JOB_ATTEMPT_STATUSES = ['in-progress', 'submitted'] as const;

export interface JobQuestionOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface JobQuestion {
  examSlug: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  questionText: string;
  options: JobQuestionOption[];
  correctLetter: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  whyWrong?: Record<string, string> | null;
  difficulty: JobQuestionDifficulty;
  isPreviousYear: boolean;
  examYear?: number | null;
  source: string;
  sourceUrl?: string | null;
  status: 'draft' | 'published';
  reviewStatus: JobQuestionReviewState;
  reviewerId?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: unknown;
  rejectionReason?: string | null;
  duplicateHash: string;
  duplicateOf?: string | null;
  bundleId?: string | null;
  version: number;
  configVersion?: string | null;
  authorId?: string | null;
  createdBy?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JobBundleQuestion {
  n: number;
  questionId: string;
  topicId: string;
  subjectId: string;
  questionText: string;
  options: JobQuestionOption[];
  // Step 8 fold-in (finding 3): difficulty DENORMALIZED into the
  // bundle at build time — the practice engine orders questions by
  // difficulty (beginner easy→hard, advanced hard-first) without
  // ever reading the bank. Minimal metadata only.
  difficulty: 'easy' | 'medium' | 'hard';
}

/** Find one bundle question by its bank questionId — the result
 * page uses this (attempt snapshot's own questionId), never the
 * bundle position, so a mode-ordered session still shows the
 * right text for each answer. */
export function jobBundleQuestionById(
  questions: JobBundleQuestion[],
  questionId: string,
): JobBundleQuestion | undefined {
  return questions.find((q) => q.questionId === questionId);
}

export interface JobQuestionBundle {
  kind: JobBundleKind;
  examSlug: string;
  topicId?: string | null;
  mockId?: string | null;
  /** Calendar year — required only for kind 'previous'. */
  year?: number | null;
  titleBn: string;
  titleEn: string;
  questions: JobBundleQuestion[];
  questionCount: number;
  /** Bundle generation (Step 8 fold-in, finding 5): 1 for the
   * first generation; an attempt stores the bundleVersion it was
   * scored against (rules: attempt.bundleVersion ==
   * bundle.bundleVersion), so a republished bundle can never
   * silently reinterpret an old attempt. Bumped when the question
   * set changes (republish from corrected questions). */
  bundleVersion: number;
  status: 'draft' | 'published';
  reviewStatus: JobQuestionReviewState;
  publishedAt?: unknown;
  publishedBy?: string | null;
  sourceQuestionIds: string[];
  configVersion?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JobQuestionKeyAnswer {
  n: number;
  questionId: string;
  correctLetter: 'A' | 'B' | 'C' | 'D';
  correctText: string;
  explanation: string;
  whyWrong?: Record<string, string> | null;
}

export interface JobQuestionKey {
  bundleId: string;
  answers: JobQuestionKeyAnswer[];
  /** Must equal the bundle's configVersion (P1-06) — a stale key
   * from an older config cannot score a newer bundle. */
  configVersion?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** A jobReceipts doc (Step 7 P0-03/P0-06 + Step 9 fold-in H.1):
 * a 10-minute, attempt-bound key-read grant. `purpose` separates
 * exam review from practice review — an exam_review receipt
 * anchors to a SUBMITTED exam session/attempt, a practice_review
 * receipt to a SUBMITTED practice attempt; the purpose is bound
 * at CREATE and the key read checks it against the bundle kind,
 * so a practice receipt can never unlock an exam key.
 * `bundleVersion` binds the receipt to the exact bundle
 * generation its anchor ran. */
export interface JobReceipt {
  userId: string;
  bundleId: string;
  attemptId: string;
  createdAt: unknown;
  /** 'practice_review' | 'exam_review' (Step 9 H.1). */
  purpose: 'practice_review' | 'exam_review';
  /** The bundle generation the anchor ran. */
  bundleVersion: number;
}

/** Minimal attempt anchor (Step 7 only — the receipt anchor).
 * The full attempt (answers, timing, scoring) is Steps 8/9, which
 * EXTEND this shape, never replace it. */
export interface JobAttemptAnchor {
  userId: string;
  bundleId: string;
  kind: JobBundleKind;
  status: 'in-progress' | 'submitted';
  startedAt: unknown;
  submittedAt?: unknown;
  updatedAt?: unknown;
}

/* ------------------------------------------------------------------ */
/* Duplicate hash (detection only — NOT a security proof)              */
/* ------------------------------------------------------------------ */

/** Normalise question text for duplicate detection: strip
 * punctuation + whitespace, fold case. Bangla + Latin both. */
export function normalizeJobQuestionText(text: string): string {
  return text
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

/** Synchronous 53-bit hash (cyrb53) of the normalised text, as hex.
 * This is a DUPLICATE-DETECTION heuristic, not a cryptographic
 * commitment: the admin verification queue is the real duplicate
 * gate (Step 3 §2.7 asked for SHA-based hashing — adapted: SHA-256
 * needs async subtle-crypto in the browser form flow, so the sync
 * hash is used here; the queue check is unchanged).
 *
 * `context` (Step 7 fold-in, ChatGPT P2-01): the same wording in a
 * different subject/chapter/topic, or with a different correct
 * answer, is a DIFFERENT question for duplicate purposes — pass
 * the context when it is known so those do not collide. Without a
 * context the hash covers the text alone (backwards compatible). */
export function jobQuestionDuplicateHash(
  questionText: string,
  context?: {
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
    correctLetter?: string;
  },
): string {
  const str = normalizeJobQuestionText(questionText)
    + (context
      ? `|${context.subjectId ?? ''}|${context.chapterId ?? ''}|${context.topicId ?? ''}|${context.correctLetter ?? ''}`
      : '');
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/* ------------------------------------------------------------------ */
/* Validation (mirrors the rules — lib-side, for the admin UI + tests) */
/* ------------------------------------------------------------------ */

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function isOptString(v: unknown, max: number): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.length <= max);
}

/** Validate a bank question doc. Returns problem strings; empty =
 * valid. Mirrors `validJobQuestion()` in firestore.rules. */
export function validateJobQuestion(doc: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const label = 'jobQuestions';
  if (typeof doc.examSlug !== 'string' || !(doc.examSlug in JOB_RULES_CONFIGS)) {
    problems.push(`${label}: examSlug '${String(doc.examSlug)}' has no rulesConfig`);
  } else if (doc.examSlug === 'it-professional') {
    problems.push(`${label}: it-professional has scope_pending (owner decision 13.8) — no questions yet`);
  }
  // Parent refs must be well-formed doc IDs (Step 6 4-segment topic).
  if (typeof doc.subjectId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+$/.test(doc.subjectId)) {
    problems.push(`${label}: subjectId must look like {exam}__{subject}`);
  }
  if (typeof doc.chapterId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/.test(doc.chapterId)) {
    problems.push(`${label}: chapterId must look like {exam}__{subject}__{chapter}`);
  }
  if (typeof doc.topicId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/.test(doc.topicId)) {
    problems.push(`${label}: topicId must look like {exam}__{subject}__{chapter}__{topic}`);
  }
  // The subject must be one of the 23 canonical subjects.
  if (typeof doc.examSlug === 'string' && typeof doc.subjectId === 'string') {
    const known = (JOB_SUBJECTS[doc.examSlug] ?? []).some(
      (s) => `${doc.examSlug}__${s.slug}` === doc.subjectId,
    );
    if (!known) problems.push(`${label}: subjectId '${doc.subjectId}' is not a canonical subject of '${doc.examSlug}'`);
  }
  if (!isNonEmptyString(doc.questionText, 2000)) {
    problems.push(`${label}: questionText must be a non-empty string ≤2000 chars`);
  }
  if (!Array.isArray(doc.options) || doc.options.length !== 4) {
    problems.push(`${label}: options must be exactly 4`);
  } else {
    const letters = ['A', 'B', 'C', 'D'];
    doc.options.forEach((o, i) => {
      if (typeof o !== 'object' || o === null || (o as Record<string, unknown>).letter !== letters[i]) {
        problems.push(`${label}: options[${i}].letter must be '${letters[i]}'`);
      }
      if (!isNonEmptyString((o as Record<string, unknown>).text, 1000)) {
        problems.push(`${label}: options[${i}].text must be a non-empty string ≤1000 chars`);
      }
    });
  }
  if (!['A', 'B', 'C', 'D'].includes(String(doc.correctLetter))) {
    problems.push(`${label}: correctLetter must be one of A/B/C/D`);
  }
  // Explanation is REQUIRED — a question without one is never Published.
  if (!isNonEmptyString(doc.explanation, 2000)) {
    problems.push(`${label}: explanation is required (≤2000 chars) — no explanation, no publication`);
  }
  if (doc.whyWrong !== null && doc.whyWrong !== undefined && typeof doc.whyWrong !== 'object') {
    problems.push(`${label}: whyWrong must be a map or null`);
  }
  if (!JOB_QUESTION_DIFFICULTIES.includes(String(doc.difficulty) as JobQuestionDifficulty)) {
    problems.push(`${label}: difficulty must be easy/medium/hard`);
  }
  if (typeof doc.isPreviousYear !== 'boolean') {
    problems.push(`${label}: isPreviousYear must be a boolean`);
  } else if (doc.isPreviousYear === true) {
    // Previous-year questions need exam + year + source proof.
    if (!Number.isInteger(doc.examYear) || (doc.examYear as number) < 1900 || (doc.examYear as number) > 2100) {
      problems.push(`${label}: isPreviousYear needs examYear (1900–2100)`);
    }
    if (!isNonEmptyString(doc.sourceUrl, 2000)) {
      problems.push(`${label}: isPreviousYear needs sourceUrl (proof — no proof, no publication)`);
    }
  }
  if (!isNonEmptyString(doc.source, 500)) {
    problems.push(`${label}: source is required (≤500 chars)`);
  }
  if (!isOptString(doc.sourceUrl, 2000)) problems.push(`${label}: sourceUrl must be a string ≤2000 or null`);
  if (doc.status !== 'draft' && doc.status !== 'published') {
    problems.push(`${label}: status must be draft/published`);
  }
  if (!JOB_QUESTION_REVIEW_STATES.includes(String(doc.reviewStatus) as JobQuestionReviewState)) {
    problems.push(`${label}: reviewStatus '${String(doc.reviewStatus)}' is not a question review state`);
  }
  if ((doc.status === 'published') !== (doc.reviewStatus === 'Published')) {
    problems.push(`${label}: status published ⟺ reviewStatus Published`);
  }
  if (!isNonEmptyString(doc.duplicateHash, 200)) {
    problems.push(`${label}: duplicateHash is required (≤200 chars)`);
  }
  if (!Number.isInteger(doc.version) || (doc.version as number) < 1) {
    problems.push(`${label}: version must be an integer ≥1`);
  }
  if (doc.rejectionReason !== null && doc.rejectionReason !== undefined
    && (!isNonEmptyString(doc.rejectionReason, 1000))) {
    problems.push(`${label}: rejectionReason must be a string ≤1000 or null`);
  }
  return problems;
}

/** Validate a bundle doc (student tier — must contain NO key
 * material). Mirrors `validJobQuestionBundle()` in the rules. */
export function validateJobQuestionBundle(doc: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const label = 'jobQuestionBundles';
  if (!JOB_BUNDLE_KINDS.includes(String(doc.kind) as JobBundleKind)) {
    problems.push(`${label}: kind must be topic/mock/daily/weekly/previous`);
  }
  if (typeof doc.examSlug !== 'string' || !(doc.examSlug in JOB_RULES_CONFIGS) || doc.examSlug === 'it-professional') {
    problems.push(`${label}: examSlug '${String(doc.examSlug)}' has no verified subject list`);
  }
  if (doc.kind === 'topic' && typeof doc.topicId !== 'string') {
    problems.push(`${label}: kind topic needs topicId`);
  }
  if ((doc.kind === 'mock' || doc.kind === 'daily' || doc.kind === 'weekly') && typeof doc.mockId !== 'string') {
    problems.push(`${label}: kind ${String(doc.kind)} needs mockId`);
  }
  if (doc.kind === 'previous' && (!Number.isInteger(doc.year) || (doc.year as number) < 1900 || (doc.year as number) > 2100)) {
    problems.push(`${label}: kind previous needs year (1900–2100)`);
  }
  if (!isNonEmptyString(doc.titleBn, 200) || !isNonEmptyString(doc.titleEn, 200)) {
    problems.push(`${label}: titleBn/titleEn required (≤200 chars)`);
  }
  if (!Array.isArray(doc.questions)) {
    problems.push(`${label}: questions must be a list`);
  } else {
    if (doc.questionCount !== doc.questions.length) {
      problems.push(`${label}: questionCount (${String(doc.questionCount)}) != questions.length (${doc.questions.length})`);
    }
    if (!Number.isInteger(doc.questionCount) || (doc.questionCount as number) < 1 || (doc.questionCount as number) > 200) {
      problems.push(`${label}: questionCount must be 1–200 (largest verified exam: BCS 200)`);
    }
    // Step 8 fold-in (finding 5): the bundle generation an attempt
    // binds to — required on every bundle the constructor builds.
    if (!Number.isInteger(doc.bundleVersion) || (doc.bundleVersion as number) < 1) {
      problems.push(`${label}: bundleVersion must be an integer ≥1`);
    }
    // The key-leak ban: no answer material anywhere in the bundle.
    const flat = JSON.stringify(doc.questions);
    for (const banned of ['correctLetter', 'explanation', 'correctText']) {
      if (flat.includes(`"${banned}"`)) problems.push(`${label}: banned key field '${banned}' inside questions`);
    }
    doc.questions.forEach((q, i) => {
      const r = q as Record<string, unknown>;
      if (!Number.isInteger(r.n) || typeof r.questionId !== 'string' || typeof r.questionText !== 'string'
        || !Array.isArray(r.options) || r.options.length !== 4
        || (r.difficulty !== 'easy' && r.difficulty !== 'medium' && r.difficulty !== 'hard')) {
        problems.push(`${label}: questions[${i}] is malformed (n/questionId/questionText/4 options/difficulty easy|medium|hard required)`);
      }
    });
  }
  if (!Array.isArray(doc.sourceQuestionIds)) {
    problems.push(`${label}: sourceQuestionIds must be a list`);
  }
  if (doc.status !== 'draft' && doc.status !== 'published') {
    problems.push(`${label}: status must be draft/published`);
  }
  if ((doc.status === 'published') !== (doc.reviewStatus === 'Published')) {
    problems.push(`${label}: status published ⟺ reviewStatus Published`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* State machine (pure — for the admin UI + tests)                     */
/* ------------------------------------------------------------------ */

export type JobQuestionActor = 'author' | 'moderator' | 'admin';

/** Allowed reviewStatus moves from `from`, for `actor`. 'Published'
 * here means status published + reviewStatus Published together. */
export function jobQuestionAllowedMoves(
  from: JobQuestionReviewState,
  actor: JobQuestionActor,
): JobQuestionReviewState[] {
  if (actor === 'author') {
    if (from === 'Not Started') return ['In Progress', 'Under Review'];
    if (from === 'In Progress') return ['Not Started', 'Under Review'];
    return [];
  }
  // Moderator / Admin (verification + publication).
  switch (from) {
    case 'Not Started':
    case 'In Progress':
      return ['Under Review', 'Rejected', 'Archived'];
    case 'Under Review':
      return ['Published', 'Rejected', 'Archived', 'Not Started'];
    case 'Published':
      return ['Not Started', 'Archived'];
    case 'Rejected':
      return ['Not Started', 'Archived'];
    case 'Archived':
      return ['Not Started'];
    default:
      return [];
  }
}

/* ------------------------------------------------------------------ */
/* Bundle builder (pure — publish-time, Admin/Moderator client code)  */
/* ------------------------------------------------------------------ */

/** Build a student bundle + its key from Published bank questions.
 * Throws unless EVERY question is Published (status + reviewStatus)
 * and carries a real explanation + 4 options. The bundle NEVER
 * contains correctLetter/explanation/correctText — the key doc holds
 * them. `meta` supplies kind/examSlug/topicId/mockId/titles. */
export function buildJobBundle(
  questions: Array<JobQuestion & { id: string }>,
  meta: {
    bundleId: string;
    kind: JobBundleKind;
    examSlug: string;
    topicId?: string | null;
    mockId?: string | null;
    year?: number | null;
    titleBn: string;
    titleEn: string;
  },
): { bundle: JobQuestionBundle; key: JobQuestionKey } {
  for (const q of questions) {
    if (q.status !== 'published' || q.reviewStatus !== 'Published') {
      throw new Error(`buildJobBundle: question ${q.id} is not Published`);
    }
    if (!q.explanation || q.options.length !== 4) {
      throw new Error(`buildJobBundle: question ${q.id} is incomplete (explanation + 4 options required)`);
    }
  }
  const bundleQuestions: JobBundleQuestion[] = questions.map((q, i) => ({
    n: i + 1,
    questionId: q.id,
    topicId: q.topicId,
    subjectId: q.subjectId,
    questionText: q.questionText,
    options: q.options.map((o) => ({ letter: o.letter, text: o.text })),
    difficulty: q.difficulty,
  }));
  const bundle: JobQuestionBundle = {
    kind: meta.kind,
    examSlug: meta.examSlug,
    topicId: meta.topicId ?? null,
    mockId: meta.mockId ?? null,
    year: meta.year ?? null,
    titleBn: meta.titleBn,
    titleEn: meta.titleEn,
    questions: bundleQuestions,
    questionCount: bundleQuestions.length,
    bundleVersion: 1,
    status: 'published',
    reviewStatus: 'Published',
    sourceQuestionIds: questions.map((q) => q.id),
    configVersion: JOB_QUESTION_CONFIG_VERSION,
  };
  const key: JobQuestionKey = {
    bundleId: meta.bundleId,
    answers: questions.map((q, i) => ({
      n: i + 1,
      questionId: q.id,
      correctLetter: q.correctLetter,
      correctText: q.options.find((o) => o.letter === q.correctLetter)?.text ?? '',
      explanation: q.explanation,
      whyWrong: q.whyWrong ?? null,
    })),
    configVersion: JOB_QUESTION_CONFIG_VERSION,
  };
  return { bundle, key };
}

/** Deterministic bundle IDs (Step 3 §2.8). */
export function jobBundleIdForTopic(topicId: string): string {
  return `topic__${topicId}`;
}
export function jobBundleIdForMock(mockId: string): string {
  return `mock__${mockId}`;
}
export function jobBundleIdForDaily(dateYYYYMMDD: string): string {
  return `daily__${dateYYYYMMDD}`;
}
export function jobBundleIdForWeekly(weekId: string): string {
  return `weekly__${weekId}`;
}
export function jobBundleIdForPrevious(examSlug: string, year: number): string {
  return `previous__${examSlug}__${year}`;
}

/** Receipt freshness (Step 3 §4.2): created within the last 10
 * minutes of `nowMs` (default: now). `createdAtMs` is epoch ms.
 * This is a WINDOW check, not one-use: a fresh receipt may be
 * used for repeat reads inside the window (Step 7 fold-in,
 * ChatGPT P0-01 Option A). */
export function isJobReceiptFresh(createdAtMs: number, nowMs: number = Date.now()): boolean {
  return nowMs - createdAtMs <= JOB_RECEIPT_WINDOW_MINUTES * 60 * 1000 && nowMs >= createdAtMs;
}

/** Admin verification queue: the questions awaiting a second eye
 * (reviewStatus 'Under Review'), oldest first. Returns the Firestore
 * query constraints for the admin UI (Step 15) — the queue itself is
 * a query, not a collection. */
export function jobReviewQueueConstraints(): Array<{ field: string; op: string; value: unknown }> {
  return [{ field: 'reviewStatus', op: '==', value: 'Under Review' }];
}
