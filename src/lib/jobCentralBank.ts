/**
 * Eduvelto Job Preparation — Central Question Bank (24 Nov 2026).
 *
 * Canonical schema for `jobQuestions` (design-central-bank.md §1):
 * one question lives ONCE, under a stable ID, with exam-neutral
 * subject/topic keys and a per-exam mapping (`examMappings` +
 * `syllabusMappings`). Exams never own copies of questions.
 *
 * This file is the app-side source of truth for the v2 shape:
 * types, the question-ID scheme, the v2 duplicate hash (§4.2),
 * `verificationStatus` derivation from the existing two-field state
 * machine (§1.5), the §8 transparency labels (one shared rendering
 * function — reuse R-10), and `validateCentralBankQuestion()` (the
 * lib mirror of `validJobQuestion` in firestore.rules).
 *
 * The OLD v1 validator (`validateJobQuestion` in jobQuestions.ts)
 * is kept until the migration completes — this file never validates
 * v1 docs. The migration itself lives in
 * scripts/migrate-central-bank-v2.mjs (pure JS, backup-driven).
 *
 * Hard rules inherited from the design doc:
 * - NCTB-first: never write content from memory, never label
 *   unverified content as verified. 0 previous-year questions
 *   exist — none is invented here.
 * - No question is Published without quality verification.
 * - `correctAnswer` is the LETTER; `correctText` is derived at
 *   bundle/key build time, never stored on the question.
 */

import { EXAM_KEYS } from './jobExams';
import { JOB_BANK_SUBJECTS } from './jobContent';

/** Schema version stamped on migrated / new v2 docs. */
export const CENTRAL_BANK_SCHEMA_VERSION = 2;

/** Bank config version (same value as JOB_QUESTION_CONFIG_VERSION —
 * kept as its own constant so this module does not import
 * jobQuestions.ts; the unit test asserts the two stay equal). */
export const CENTRAL_BANK_CONFIG_VERSION = '2026-11-22.1';

/** Syllabus version for the verified 50th BCS pattern (§3.1). */
export const BCS_SYLLABUS_VERSION = '50th-bcs-2025-12-09';

/** Owner UID — the English verifier (live `verifiedBy` on all 35). */
export const CENTRAL_BANK_OWNER_VERIFIER_UID = 'nczNklmktsVrxg43UzcgdSm6v0j2';

/* ------------------------------------------------------------------ */
/* Types (§1.1)                                                        */
/* ------------------------------------------------------------------ */

export type CentralBankVerificationStatus = 'draft' | 'reviewed' | 'verified';

export type CentralBankOrigin =
  | 'verified-previous'
  | 'admin-practice'
  | 'ai-generated-practice'
  | 'official-fact';

export type CentralBankSourceType =
  | 'original-practice'
  | 'previous-year'
  | 'ai-generated'
  | 'official-syllabus'
  | 'official-circular';

export interface CentralBankSource {
  type: CentralBankSourceType;
  reference: string;
  url?: string | null;
}

export interface CentralBankSyllabusMapping {
  /** Exam-scoped subject, e.g. 'bcs__english'. */
  subjectId: string;
  /** Exam-scoped chapter, e.g. 'bcs__english__grammar'. Omitted
   * when the exam has no verified chapter split (Bank). */
  chapterId?: string | null;
  /** Exam-scoped topic, e.g. 'bcs__english__grammar__tense'. */
  topicId: string;
  /** Syllabus version the placement was verified against. */
  syllabusVersion: string;
  /** Exam-neutral canonical topic (§2) — how the system knows the
   * BCS and Bank entries for one question are the SAME topic. */
  syllabusTopicId: string;
  /** Per-exam verified flag: only mappings with verified:true feed
   * scored selection for that exam. */
  verified: boolean;
}

export type DuplicateCandidateClass = 'exact' | 'near-stem' | 'near-options';

export interface DuplicateCandidate {
  questionId: string;
  class: DuplicateCandidateClass;
  /** 0–1 heuristic overlap score (see classifyDuplicateCandidate). */
  score: number;
}

export interface DuplicateReview {
  decision: 'keep' | 'merge';
  reason: string;
  reviewerId: string;
  reviewedAt?: unknown;
}

export interface CentralBankQuestion {
  questionId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'mcq';
  question: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  whyWrong?: Record<string, string> | null;
  examMappings: string[];
  syllabusMappings: Record<string, CentralBankSyllabusMapping>;
  verificationStatus: CentralBankVerificationStatus;
  isActive: boolean;
  origin: CentralBankOrigin;
  source: CentralBankSource;
  /** `examYear` is null unless origin == 'verified-previous'. */
  examYear?: number | null;
  tags: string[];
  passageId?: string | null;
  /** Legacy v1 hash, kept for continuity. */
  duplicateHash: string;
  /** v2 hash (§4.2). Computed on every create/update. */
  duplicateHashV2: string;
  /** Stem hash (§4.2) — near-duplicate candidate lookup. */
  stemHash?: string | null;
  duplicateOf?: string | null;
  duplicateCandidates?: DuplicateCandidate[] | null;
  duplicateReview?: DuplicateReview | null;
  authorId?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: unknown;
  reviewerId?: string | null;
  /** Set by the Moderator when the content check passes; gates the
   * `reviewed` level (§1.5). */
  reviewContentPassed?: boolean;
  version: number;
  configVersion: string;
  schemaVersion?: number;
  status: 'draft' | 'published';
  reviewStatus:
    | 'Not Started'
    | 'In Progress'
    | 'Under Review'
    | 'Published'
    | 'Rejected'
    | 'Archived';
  createdBy?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  legacyId?: string | null;
  rejectionReason?: string | null;
}

export interface JobPassage {
  text: string;
  usedBy: string[];
  language: string;
  source: string;
  version: number;
}

/* ------------------------------------------------------------------ */
/* Question ID scheme (§1.2)                                          */
/* ------------------------------------------------------------------ */

/** `bcs-eng-NNN` (the 35, kept verbatim) or `q_<subject>_<seq4>`. */
export const CENTRAL_BANK_QUESTION_ID_PATTERN =
  /^(bcs-eng-[0-9]{3}|q_[a-z-]+_[0-9]{4})$/;

export function isValidCentralBankQuestionId(id: unknown): id is string {
  return typeof id === 'string' && CENTRAL_BANK_QUESTION_ID_PATTERN.test(id);
}

/** Issue a new question ID: `q_<subject>_<seq4>` (per-subject
 * zero-padded sequence, issued by the import script, never by
 * clients). The subject must be a canonical bank subject key. */
export function newQuestionIdFor(subject: string, seq: number): string {
  if (!(JOB_BANK_SUBJECTS as readonly string[]).includes(subject)) {
    throw new Error(`newQuestionIdFor: '${subject}' is not a canonical bank subject`);
  }
  if (!Number.isInteger(seq) || seq < 1 || seq > 9999) {
    throw new Error(`newQuestionIdFor: seq must be an integer 1–9999, got ${String(seq)}`);
  }
  return `q_${subject}_${String(seq).padStart(4, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Verification status — derived from the two-field machine (§1.5)    */
/* ------------------------------------------------------------------ */

/**
 * Derive the public-facing level from the existing two-field state
 * machine — `verificationStatus` is DERIVED, never a second machine:
 * - verified: status published + reviewStatus Published.
 * - reviewed: reviewStatus 'Under Review' AND the reviewer recorded
 *   a content pass (`reviewContentPassed`). Without the flag,
 *   'Under Review' is plain draft.
 * - draft: everything else.
 */
export function deriveVerificationStatus(
  status: string,
  reviewStatus: string,
  reviewContentPassed = false,
): CentralBankVerificationStatus {
  if (status === 'published' && reviewStatus === 'Published') return 'verified';
  if (reviewStatus === 'Under Review' && reviewContentPassed === true) return 'reviewed';
  return 'draft';
}

/* ------------------------------------------------------------------ */
/* Duplicate hash v2 (§4.2)                                            */
/* ------------------------------------------------------------------ */

/** Synchronous 53-bit hash (cyrb53) as 16 hex chars — the same
 * algorithm as the v1 `jobQuestionDuplicateHash`; only the INPUT
 * string changes in v2. */
export function cyrb53Hex(str: string): string {
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

/** Bangla digits ০–৯ → Latin 0–9 (v1 did not fold them — "২০২৫"
 * and "2025" are the same token in v2). */
const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';
export function foldBanglaDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

/** v2 normalisation (§4.2): NFKC → lowercase (Latin) → Bangla-digit
 * folding → strip ALL whitespace, punctuation and symbols. */
export function normalizeCentralBankText(text: string): string {
  return foldBanglaDigits(text.normalize('NFKC'))
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

/** Stem hash — near-duplicate candidate lookup (1 indexed read). */
export function stemHashFor(stem: string): string {
  return cyrb53Hex(normalizeCentralBankText(stem));
}

/** The correct option's TEXT (derived, never stored). */
export function correctTextFor(question: {
  options: Array<{ letter: string; text: string }>;
  correctAnswer: string;
}): string {
  return question.options.find((o) => o.letter === question.correctAnswer)?.text ?? '';
}

/**
 * Hash v2: cyrb53(normalisedStem + '|' + canonicalSubjectId + '|' +
 * sortedOptions.join('|') + '|' + normalisedCorrectText).
 * Options are compared as a SET (sorted), so option order never
 * hides a duplicate; the correct answer enters as TEXT, not the
 * letter (v1 used the letter — order-dependent).
 */
export function duplicateHashV2For(args: {
  question: string;
  subjectId: string;
  options: Array<{ letter: string; text: string }>;
  correctAnswer: string;
}): string {
  const sortedOptions = args.options
    .map((o) => normalizeCentralBankText(o.text))
    .sort();
  const correctText = correctTextFor(args);
  const input =
    `${normalizeCentralBankText(args.question)}|${args.subjectId}|${sortedOptions.join('|')}|${normalizeCentralBankText(correctText)}`;
  return cyrb53Hex(input);
}

/* ------------------------------------------------------------------ */
/* Duplicate classification (§4.1)                                     */
/* ------------------------------------------------------------------ */

export interface DuplicateClassification {
  class: DuplicateCandidateClass | 'none';
  /** 0–1 heuristic overlap score. Exact = 1. */
  score: number;
}

function sortedNormalisedOptions(
  options: Array<{ letter: string; text: string }>,
): string[] {
  return options.map((o) => normalizeCentralBankText(o.text)).sort();
}

function optionOverlap(
  a: Array<{ letter: string; text: string }>,
  b: Array<{ letter: string; text: string }>,
): number {
  const setA = new Set(sortedNormalisedOptions(a));
  const setB = new Set(sortedNormalisedOptions(b));
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared += 1;
  return shared;
}

/**
 * Classify a candidate pair (§4.1):
 * - exact: same normalised stem + same option SET + same correct TEXT → BLOCK.
 * - near-stem: same stem, options/answer differ → FLAG for review.
 * - near-options: ≥3 identical options but stems differ → FLAG.
 * - none: anything else.
 * Cross-subject copies are distinct by construction (the subject is
 * in the v2 hash); a same-stem/same-options pair under a DIFFERENT
 * canonical subject/topic is 'none' here — the validator requires
 * the author to justify the second placement instead.
 */
export function classifyDuplicateCandidate(
  candidate: {
    question: string;
    subjectId: string;
    options: Array<{ letter: string; text: string }>;
    correctAnswer: string;
  },
  existing: {
    question: string;
    subjectId: string;
    options: Array<{ letter: string; text: string }>;
    correctAnswer: string;
  },
): DuplicateClassification {
  if (candidate.subjectId !== existing.subjectId) {
    return { class: 'none', score: 0 };
  }
  const sameStem =
    normalizeCentralBankText(candidate.question) ===
    normalizeCentralBankText(existing.question);
  const overlap = optionOverlap(candidate.options, existing.options);
  const sameOptionSet =
    overlap === 4 &&
    sortedNormalisedOptions(candidate.options).join('|') ===
      sortedNormalisedOptions(existing.options).join('|');
  const sameCorrectText =
    normalizeCentralBankText(correctTextFor(candidate)) ===
    normalizeCentralBankText(correctTextFor(existing));
  if (sameStem && sameOptionSet && sameCorrectText) {
    return { class: 'exact', score: 1 };
  }
  if (sameStem) {
    return { class: 'near-stem', score: overlap >= 3 ? 0.8 : 0.6 };
  }
  if (overlap >= 3) {
    return { class: 'near-options', score: 0.7 };
  }
  return { class: 'none', score: 0 };
}

/* ------------------------------------------------------------------ */
/* Transparency labels (§8) — ONE shared rendering function (R-10)    */
/* ------------------------------------------------------------------ */

export interface QuestionTransparencyLabel {
  bn: string;
  en: string;
  /** True when the label must carry the "practice only" qualifier. */
  practiceOnly: boolean;
}

/**
 * The label is rendered from the doc fields, never hard-coded in the
 * UI, so it cannot drift from the truth. The label set is
 * exhaustive — there is no question state with no label. The AI
 * label is NEVER dropped on verification.
 */
export function questionTransparencyLabel(
  origin: CentralBankOrigin,
  verificationStatus: CentralBankVerificationStatus,
): QuestionTransparencyLabel {
  switch (origin) {
    case 'verified-previous':
      return {
        bn: 'যাচাইকৃত বিগত বছরের প্রশ্ন',
        en: 'Verified previous question',
        practiceOnly: false,
      };
    case 'admin-practice':
      return verificationStatus === 'reviewed'
        ? {
            bn: 'অনুশীলনী প্রশ্ন — পর্যালোচনাধীন, অনুশীলনের জন্য',
            en: 'Practice question — under review, practice only',
            practiceOnly: true,
          }
        : {
            bn: 'অনুশীলনী প্রশ্ন',
            en: 'Practice question',
            practiceOnly: false,
          };
    case 'ai-generated-practice':
      return {
        bn: 'AI-সহায়তায় তৈরি অনুশীলনী',
        en: 'AI-generated practice',
        practiceOnly: verificationStatus !== 'verified',
      };
    case 'official-fact':
      return {
        bn: 'সরকারি তথ্য',
        en: 'Officially sourced fact',
        practiceOnly: false,
      };
    default:
      return {
        bn: 'অনুশীলনী প্রশ্ন',
        en: 'Practice question',
        practiceOnly: true,
      };
  }
}

/* ------------------------------------------------------------------ */
/* Passage de-inlining (§1.4)                                          */
/* ------------------------------------------------------------------ */

/**
 * The live Firestore reading questions inline the passage as:
 * `Read the following passage and answer the question:\n\n"<passage>"\n\n<stem>`.
 * Returns the stem when the text matches that shape for the given
 * passage, else null (the text is already stem-only, or the shape
 * is unrecognised — never guess). The migration uses this to
 * de-inline bcs-eng-033…035; the on-disk source
 * (publicBcsEnglish.ts) already holds the stems.
 */
export function extractPassageStem(
  questionText: string,
  passageText: string,
): string | null {
  const prefix = `Read the following passage and answer the question:\n\n"${passageText}"\n\n`;
  if (!questionText.startsWith(prefix)) return null;
  const stem = questionText.slice(prefix.length);
  return stem.length > 0 ? stem : null;
}

/* ------------------------------------------------------------------ */
/* Validation (mirrors validJobQuestion in firestore.rules)            */
/* ------------------------------------------------------------------ */

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function isOptString(v: unknown, max: number): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.length <= max);
}

const REVIEW_STATES = [
  'Not Started',
  'In Progress',
  'Under Review',
  'Published',
  'Rejected',
  'Archived',
] as const;

/** origin ⟺ source.type consistency (§1.6). */
const ORIGIN_SOURCE_TYPES: Record<CentralBankOrigin, CentralBankSourceType[]> = {
  'verified-previous': ['previous-year'],
  'admin-practice': ['original-practice'],
  'ai-generated-practice': ['ai-generated'],
  'official-fact': ['official-syllabus', 'official-circular'],
};

/** Validate a v2 bank question doc. Returns problem strings;
 * empty = valid. Mirrors `validJobQuestion()` (v2 branch) in
 * firestore.rules. Legacy v1 docs are NOT accepted here — use
 * `validateJobQuestion` in jobQuestions.ts for those until the
 * migration completes. */
export function validateCentralBankQuestion(doc: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const label = 'jobQuestions(v2)';
  if (!isValidCentralBankQuestionId(doc.questionId)) {
    problems.push(`${label}: questionId '${String(doc.questionId)}' must match bcs-eng-NNN or q_<subject>_<seq4>`);
  }
  // The v2 renames are enforced: legacy top-level fields must be gone.
  for (const legacy of ['examSlug', 'chapterId', 'bundleId', 'isPreviousYear', 'sourceUrl', 'questionText', 'correctLetter']) {
    if (legacy in doc) {
      problems.push(`${label}: legacy field '${legacy}' must not be present on a v2 doc`);
    }
  }
  if (typeof doc.subjectId !== 'string' || !(JOB_BANK_SUBJECTS as readonly string[]).includes(doc.subjectId)) {
    problems.push(`${label}: subjectId '${String(doc.subjectId)}' is not a canonical bank subject`);
  }
  if (typeof doc.topicId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/.test(doc.topicId)) {
    problems.push(`${label}: topicId must look like {subject}__{chapter}__{topic}`);
  } else if (typeof doc.subjectId === 'string' && !doc.topicId.startsWith(`${doc.subjectId}__`)) {
    problems.push(`${label}: topicId '${doc.topicId}' must start with subjectId '${doc.subjectId}__'`);
  }
  if (doc.subtopicId !== null && !isNonEmptyString(doc.subtopicId, 200)) {
    problems.push(`${label}: subtopicId must be a non-empty string ≤200 or null`);
  }
  if (!['easy', 'medium', 'hard'].includes(String(doc.difficulty))) {
    problems.push(`${label}: difficulty must be easy/medium/hard`);
  }
  if (doc.questionType !== 'mcq') {
    problems.push(`${label}: questionType must be 'mcq' (this bank is MCQ-only)`);
  }
  if (!isNonEmptyString(doc.question, 2000)) {
    problems.push(`${label}: question must be a non-empty string ≤2000 chars`);
  }
  if (!Array.isArray(doc.options) || doc.options.length !== 4) {
    problems.push(`${label}: options must be exactly 4`);
  } else {
    const letters = ['A', 'B', 'C', 'D'];
    const seenTexts = new Set<string>();
    doc.options.forEach((o, i) => {
      if (typeof o !== 'object' || o === null || (o as Record<string, unknown>).letter !== letters[i]) {
        problems.push(`${label}: options[${i}].letter must be '${letters[i]}'`);
      }
      if (!isNonEmptyString((o as Record<string, unknown>).text, 1000)) {
        problems.push(`${label}: options[${i}].text must be a non-empty string ≤1000 chars`);
      } else {
        const norm = normalizeCentralBankText((o as Record<string, unknown>).text as string);
        if (seenTexts.has(norm)) {
          problems.push(`${label}: options[${i}].text duplicates another option`);
        }
        seenTexts.add(norm);
      }
    });
  }
  if (!['A', 'B', 'C', 'D'].includes(String(doc.correctAnswer))) {
    problems.push(`${label}: correctAnswer must be one of A/B/C/D`);
  }
  if (!isNonEmptyString(doc.explanation, 2000)) {
    problems.push(`${label}: explanation is required (≤2000 chars) — no explanation, no publication`);
  }
  if (doc.whyWrong !== null && doc.whyWrong !== undefined && typeof doc.whyWrong !== 'object') {
    problems.push(`${label}: whyWrong must be a map or null`);
  }
  // examMappings ⟺ syllabusMappings keys must agree exactly (§3.1).
  if (!Array.isArray(doc.examMappings)) {
    problems.push(`${label}: examMappings must be a list`);
  } else {
    const seen = new Set<string>();
    for (const key of doc.examMappings as unknown[]) {
      if (typeof key !== 'string' || !(EXAM_KEYS as readonly string[]).includes(key)) {
        problems.push(`${label}: examMappings contains '${String(key)}', not an allowed exam key`);
      }
      if (typeof key === 'string') {
        if (seen.has(key)) problems.push(`${label}: examMappings repeats '${key}'`);
        seen.add(key);
      }
    }
    if (typeof doc.syllabusMappings !== 'object' || doc.syllabusMappings === null || Array.isArray(doc.syllabusMappings)) {
      problems.push(`${label}: syllabusMappings must be a map`);
    } else {
      const mapKeys = Object.keys(doc.syllabusMappings as Record<string, unknown>).sort();
      const mappingKeys = [...seen].sort();
      if (mapKeys.join(',') !== mappingKeys.join(',')) {
        problems.push(`${label}: examMappings keys (${mappingKeys.join(',')}) != syllabusMappings keys (${mapKeys.join(',')})`);
      }
      for (const [examKey, entry] of Object.entries(doc.syllabusMappings as Record<string, unknown>)) {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
          problems.push(`${label}: syllabusMappings.${examKey} must be a map`);
          continue;
        }
        const e = entry as Record<string, unknown>;
        if (!isNonEmptyString(e.subjectId, 200)) {
          problems.push(`${label}: syllabusMappings.${examKey}.subjectId is required`);
        }
        if (e.chapterId !== undefined && e.chapterId !== null && !isNonEmptyString(e.chapterId, 200)) {
          problems.push(`${label}: syllabusMappings.${examKey}.chapterId must be a string or null`);
        }
        if (!isNonEmptyString(e.topicId, 200)) {
          problems.push(`${label}: syllabusMappings.${examKey}.topicId is required`);
        }
        if (!isNonEmptyString(e.syllabusVersion, 200)) {
          problems.push(`${label}: syllabusMappings.${examKey}.syllabusVersion is required`);
        }
        if (e.syllabusTopicId !== doc.topicId) {
          problems.push(`${label}: syllabusMappings.${examKey}.syllabusTopicId must equal the canonical topicId`);
        }
        if (typeof e.verified !== 'boolean') {
          problems.push(`${label}: syllabusMappings.${examKey}.verified must be a boolean`);
        }
      }
    }
  }
  // verificationStatus is derived from the two-field machine (§1.5).
  const derived = deriveVerificationStatus(
    String(doc.status ?? ''),
    String(doc.reviewStatus ?? ''),
    doc.reviewContentPassed === true,
  );
  if (!['draft', 'reviewed', 'verified'].includes(String(doc.verificationStatus))) {
    problems.push(`${label}: verificationStatus must be draft/reviewed/verified`);
  } else if (doc.verificationStatus !== derived) {
    problems.push(`${label}: verificationStatus '${String(doc.verificationStatus)}' != derived '${derived}' from status/reviewStatus/reviewContentPassed`);
  }
  if (typeof doc.isActive !== 'boolean') {
    problems.push(`${label}: isActive must be a boolean`);
  }
  if (!['verified-previous', 'admin-practice', 'ai-generated-practice', 'official-fact'].includes(String(doc.origin))) {
    problems.push(`${label}: origin '${String(doc.origin)}' is not a known origin`);
  }
  if (typeof doc.source !== 'object' || doc.source === null || Array.isArray(doc.source)) {
    problems.push(`${label}: source must be an object {type, reference, url?}`);
  } else {
    const s = doc.source as Record<string, unknown>;
    if (!['original-practice', 'previous-year', 'ai-generated', 'official-syllabus', 'official-circular'].includes(String(s.type))) {
      problems.push(`${label}: source.type '${String(s.type)}' is not a known source type`);
    }
    if (!isNonEmptyString(s.reference, 500)) {
      problems.push(`${label}: source.reference is required (≤500 chars)`);
    }
    if (!isOptString(s.url, 2000)) {
      problems.push(`${label}: source.url must be a string ≤2000 or null`);
    }
    const origin = String(doc.origin) as CentralBankOrigin;
    if (
      origin in ORIGIN_SOURCE_TYPES &&
      !ORIGIN_SOURCE_TYPES[origin].includes(String(s.type) as CentralBankSourceType)
    ) {
      problems.push(`${label}: origin '${origin}' does not allow source.type '${String(s.type)}'`);
    }
  }
  // Previous-year proof (§1.6): examYear + source.url required.
  if (doc.origin === 'verified-previous') {
    if (!Number.isInteger(doc.examYear) || (doc.examYear as number) < 1900 || (doc.examYear as number) > 2100) {
      problems.push(`${label}: origin verified-previous needs examYear (1900–2100)`);
    }
    const s = doc.source as Record<string, unknown> | null;
    if (!s || !isNonEmptyString(s.url, 2000)) {
      problems.push(`${label}: origin verified-previous needs source.url (proof — no proof, no publication)`);
    }
  } else if (doc.examYear !== null && doc.examYear !== undefined) {
    problems.push(`${label}: examYear must be null unless origin is verified-previous`);
  }
  // Tags — controlled vocabulary only (§2.4).
  if (!Array.isArray(doc.tags)) {
    problems.push(`${label}: tags must be a list`);
  } else {
    for (const tag of doc.tags as unknown[]) {
      if (typeof tag !== 'string') {
        problems.push(`${label}: tags must be strings`);
        continue;
      }
      const ok =
        (JOB_BANK_SUBJECTS as readonly string[]).includes(tag) ||
        tag === doc.topicId ||
        (EXAM_KEYS as readonly string[]).includes(tag) ||
        /^batch:[a-z0-9-]+$/.test(tag) ||
        tag === 'general-practice' ||
        tag === 'previous-year' ||
        tag === 'disputed' ||
        tag === 'outdated';
      if (!ok) problems.push(`${label}: tag '${tag}' is not in the controlled vocabulary`);
      if (tag === 'previous-year' && doc.origin !== 'verified-previous') {
        problems.push(`${label}: tag 'previous-year' requires origin verified-previous`);
      }
    }
  }
  if (doc.passageId !== null && doc.passageId !== undefined && !isNonEmptyString(doc.passageId, 200)) {
    problems.push(`${label}: passageId must be a non-empty string ≤200 or null`);
  }
  if (!isNonEmptyString(doc.duplicateHash, 200)) {
    problems.push(`${label}: duplicateHash is required (≤200 chars)`);
  }
  if (typeof doc.duplicateHashV2 !== 'string' || !/^[0-9a-f]{16}$/.test(doc.duplicateHashV2)) {
    problems.push(`${label}: duplicateHashV2 must be 16 hex chars`);
  }
  if (doc.stemHash !== null && doc.stemHash !== undefined
    && (typeof doc.stemHash !== 'string' || !/^[0-9a-f]{16}$/.test(doc.stemHash))) {
    problems.push(`${label}: stemHash must be 16 hex chars or null`);
  }
  if (doc.duplicateOf !== null && doc.duplicateOf !== undefined && typeof doc.duplicateOf !== 'string') {
    problems.push(`${label}: duplicateOf must be a string or null`);
  }
  // Publish gate (§4.3 gate 3): no unreviewed duplicate candidates on a verified question.
  if (Array.isArray(doc.duplicateCandidates) && doc.duplicateCandidates.length > 0
    && doc.verificationStatus === 'verified') {
    problems.push(`${label}: verified questions must have no unreviewed duplicateCandidates`);
  }
  if (doc.duplicateCandidates !== null && doc.duplicateCandidates !== undefined && !Array.isArray(doc.duplicateCandidates)) {
    problems.push(`${label}: duplicateCandidates must be a list or null`);
  }
  // Second eye: the verifier is never the author (§1.5).
  if (doc.verificationStatus === 'verified') {
    if (typeof doc.verifiedBy !== 'string' || doc.verifiedBy.length === 0) {
      problems.push(`${label}: verified questions need verifiedBy`);
    }
    if (doc.verifiedAt === null || doc.verifiedAt === undefined) {
      problems.push(`${label}: verified questions need verifiedAt`);
    }
    if (
      typeof doc.verifiedBy === 'string' && typeof doc.authorId === 'string'
      && doc.verifiedBy === doc.authorId
    ) {
      problems.push(`${label}: verifiedBy must not be the author (second eye)`);
    }
  }
  if (doc.verificationStatus === 'reviewed' && (doc.reviewerId === null || doc.reviewerId === undefined)) {
    problems.push(`${label}: reviewed questions need reviewerId`);
  }
  if (!Number.isInteger(doc.version) || (doc.version as number) < 1) {
    problems.push(`${label}: version must be an integer ≥1`);
  }
  if (!isNonEmptyString(doc.configVersion, 100)) {
    problems.push(`${label}: configVersion is required (≤100 chars)`);
  }
  if (doc.schemaVersion !== undefined && doc.schemaVersion !== null
    && (!Number.isInteger(doc.schemaVersion) || (doc.schemaVersion as number) < 1)) {
    problems.push(`${label}: schemaVersion must be an integer ≥1`);
  }
  if (doc.status !== 'draft' && doc.status !== 'published') {
    problems.push(`${label}: status must be draft/published`);
  }
  if (!REVIEW_STATES.includes(String(doc.reviewStatus) as (typeof REVIEW_STATES)[number])) {
    problems.push(`${label}: reviewStatus '${String(doc.reviewStatus)}' is not a question review state`);
  }
  if ((doc.status === 'published') !== (doc.reviewStatus === 'Published')) {
    problems.push(`${label}: status published ⟺ reviewStatus Published`);
  }
  if (doc.reviewStatus === 'Rejected'
    && (!isNonEmptyString(doc.rejectionReason, 1000) || (doc.rejectionReason as string).length < 10)) {
    problems.push(`${label}: rejectionReason must be ≥10 chars when rejected`);
  } else if (doc.rejectionReason !== null && doc.rejectionReason !== undefined
    && !isNonEmptyString(doc.rejectionReason, 1000)) {
    problems.push(`${label}: rejectionReason must be a string ≤1000 or null`);
  }
  return problems;
}
