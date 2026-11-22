// Eduvelto — National University admission: question bank (NU-7,
// 22 Nov 2026; design doc §11, §15 NU-7, §19.2.4–§19.2.6,
// §19.3.2–§19.3.3, §19.6).
//
// PURE module (no Firestore I/O — the Firestore flows live in
// lib/nuQuestionFlow.ts; the Firestore rules mirror these validators).
// Two-tier bank, Job Step 3 / Step 5 pattern, NU config layer:
//   tier 1  `nuQuestions` — the bank record. Students can NEVER read
//           it. The correct answer is NEVER in this document.
//   tier 2  `nuQuestionBundles` — the student-facing layer (questions
//           + options only, no answers, no explanations). Published
//           bundles only; built at bundle-publish time (NU-8/NU-9),
//           never by a student.
//   tier 2b `nuQuestionKeys` — the answer key, receipt-gated
//           (practice bundles readable by a signed-in student without
//           a receipt; mock bundles only with a fresh receipt).
//   draft   `nuQuestionDraftKeys` — NEW in NU-7. A draft question's
//           correct answer has to live SOMEWHERE a reviewer can read
//           before publish, and §19.3.2 forbids it in `nuQuestions`
//           while §19.2.6 keys are per-bundle (a draft has no bundle
//           yet). So the draft key is its own doc, keyed by
//           questionId: readable by Admin + verified teachers only,
//           never by students, frozen once the question leaves draft.
//
// CONTENT (BINDING): the bank starts EMPTY — 0 questions, 0 verified
// teachers (NU-Q4). Nothing is invented here: no questions, no
// bundles, no keys are seeded (see team/nu-question-bank-seed-
// 2026-11-22.json — empty arrays + a schema example marked as an
// example, never to be applied). Every question is written by a
// verified teacher or Admin and published only after review
// (draft → submitted_for_review → under_review → approved →
// published; §19.6.1). Students can NEVER create/submit/edit/
// publish questions or answers.
//
// GROUP-40 (Blocker B): questions may ONLY use the 3 common subjects
// (bangla / english / general-knowledge) — the group-40 block has no
// chapters/topics until the Guideline split arrives (NU-Q2), so a
// `group-*` subjectId is rejected by the validator below.
//
// AUTH-GATING (owner instruction 22 Nov 10:33, BINDING — design-doc
// addendum): bundles and keys (practice included) are signed-in-only;
// the rules enforce it, this module never hands a bundle/key to a
// signed-out caller (the flow functions take a signed-in uid).

import type { Timestamp } from 'firebase/firestore';
import { NU_CIRCULAR_VERSION } from './nuExamConfig';
import {
  nuSyllabusChapters,
  nuSyllabusSubjectBySlug,
  nuSyllabusSubjects,
  nuSyllabusTopics,
  type NuSyllabusChapterDoc,
  type NuSyllabusTopicDoc,
} from './nuSyllabus';
import type { NuGroupSlug } from './nuProfile';

/** The 3 common subjects a question may belong to (Blocker B:
 * group-40 block subjects have no chapters — see module header). */
export const NU_QUESTION_SUBJECT_IDS = ['bangla', 'english', 'general-knowledge'] as const;
export type NuQuestionSubjectId = (typeof NU_QUESTION_SUBJECT_IDS)[number];

export const NU_QUESTION_STATUSES = [
  'draft',
  'submitted_for_review',
  'under_review',
  'approved',
  'published',
  'rejected',
  'changes_requested',
  'withdrawn',
] as const;
export type NuQuestionStatus = (typeof NU_QUESTION_STATUSES)[number];

export const NU_QUESTION_SOURCE_TYPES = [
  'official_previous_year',
  'original_practice',
  'adapted_hsc',
  'unverified_source',
  'imported_academic',
] as const;
export type NuQuestionSourceType = (typeof NU_QUESTION_SOURCE_TYPES)[number];

export const NU_QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type NuQuestionDifficulty = (typeof NU_QUESTION_DIFFICULTIES)[number];

export type NuReviewDecision = 'approved' | 'rejected' | 'changes_requested';

/** Publication state machine (§19.6.1, BINDING). `rejected` and
 * `withdrawn` are terminal. `draft → withdrawn` (Admin only) lets an
 * Admin abandon a draft without deleting it (deletes are forbidden). */
export const NU_QUESTION_TRANSITIONS: Record<NuQuestionStatus, readonly NuQuestionStatus[]> = {
  draft: ['submitted_for_review', 'withdrawn'],
  submitted_for_review: ['under_review'],
  under_review: ['approved', 'rejected', 'changes_requested'],
  approved: ['published'],
  published: ['withdrawn'],
  rejected: [],
  changes_requested: ['submitted_for_review'],
  withdrawn: [],
};

export function canTransitionQuestion(from: NuQuestionStatus, to: NuQuestionStatus): boolean {
  return (NU_QUESTION_TRANSITIONS[from] as readonly NuQuestionStatus[]).includes(to);
}

/** Who may drive each edge (UI gating — the rules enforce it too).
 * `reviewer` = Admin, or a verified teacher who did NOT write the
 * question (self-review is forbidden, NU-T18). */
export type NuQuestionTransitionActor = 'authorOrAdmin' | 'reviewerOrAdmin' | 'adminOnly';
export function nuQuestionTransitionActor(from: NuQuestionStatus, to: NuQuestionStatus): NuQuestionTransitionActor | null {
  if (!canTransitionQuestion(from, to)) return null;
  if (to === 'published' || to === 'withdrawn') return 'adminOnly';
  if (from === 'draft' || from === 'changes_requested') return 'authorOrAdmin';
  return 'reviewerOrAdmin';
}

/** The bank record (§19.2.4). `questionId` is the Firestore doc id —
 * it is NOT a required field (NU-4 seeds omit it); when present it
 * must be a non-empty string. `createdAt` is set by the flow as a
 * serverTimestamp at write time (the lib validator only checks it
 * when it is a real Timestamp — see validateNuQuestionDoc). */
export interface NuQuestionDoc {
  questionId?: string;
  version: number;
  status: NuQuestionStatus;
  sourceType: NuQuestionSourceType;
  provenance: string;
  groupIds: NuGroupSlug[];
  subjectId: string;
  chapterId: string;
  topicId: string;
  questionText: string;
  questionLang: 'bn' | 'en';
  /** Exactly 4 option texts — NO correct-answer mark in this doc. */
  options: string[];
  difficulty: NuQuestionDifficulty;
  /** Mandatory — a question is never Published without one (§11.4). */
  explanation: string;
  /** Only for `official_previous_year` questions. */
  examYear?: number | null;
  createdBy: string;
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | null;
  publishedAt?: Timestamp | null;
  circularVersion: string;
  /** Set when this doc was flagged as a suspected duplicate of
   * another question (§11.4 — warning card, not an auto-block). */
  duplicateOf?: string | null;
  /** Correction lineage (§19.6.2): a new version is a NEW doc with
   * version + 1 pointing back at the doc it corrects. */
  previousQuestionId?: string | null;
  createdAt?: Timestamp | null;
}

/** The draft answer key (NEW in NU-7 — see module header). One per
 * question, keyed by questionId; `version` must equal the question's
 * version. Frozen once the question leaves draft. */
export interface NuQuestionDraftKeyDoc {
  questionId: string;
  version: number;
  /** 0–3. The ONLY place the correct answer lives before publish. */
  correctOptionIndex: number;
  createdBy: string;
  subjectId: string;
  groupIds: NuGroupSlug[];
  createdAt?: Timestamp | null;
}

/** One question inside a bundle (§19.2.5) — text + options only. */
export interface NuBundleQuestion {
  questionId: string;
  version: number;
  questionText: string;
  options: string[];
}

/** The exam-config snapshot a bundle carries (§19.2.5). Practice
 * (topic) bundles are untimed: durationSeconds + passMark are null. */
export interface NuBundleConfigSnapshot {
  totalQuestions: number;
  durationSeconds: number | null;
  marking: { correct: number; incorrect: number; unanswered: number; negativeMarking: boolean };
  passMark: number | null;
  circularVersion: string;
  configVersion: number;
}

export type NuBundleKind = 'topic' | 'mock' | 'daily';

export interface NuQuestionBundleDoc {
  bundleId: string;
  kind: NuBundleKind;
  groupId: NuGroupSlug;
  subjectId?: string | null;
  topicId?: string | null;
  mockId?: string | null;
  questions: NuBundleQuestion[];
  questionCount: number;
  configSnapshot: NuBundleConfigSnapshot;
  /** Audit trail — which question docs this bundle was built from. */
  sourceQuestionIds: string[];
  status: 'draft' | 'published' | 'withdrawn';
  version: number;
  publishedAt?: Timestamp | null;
  publishedBy?: string | null;
}

export interface NuQuestionKeyEntry {
  questionId: string;
  version: number;
  correctOptionIndex: number;
  explanation: string;
}

export interface NuQuestionKeyDoc {
  bundleId: string;
  keys: NuQuestionKeyEntry[];
  /** Must equal the bundle's `version` (§19.2.6). */
  questionVersion: number;
  createdAt?: Timestamp | null;
}

/** One immutable review record (§19.2.11). `checks` records the four
 * things a reviewer must verify; `reason` (≥10 chars) is required
 * for `rejected` / `changes_requested`. */
export interface NuReviewChecks {
  questionCorrect: boolean;
  correctAnswerCorrect: boolean;
  explanationCorrect: boolean;
  sourceCorrect: boolean;
}

export interface NuReviewDoc {
  questionId: string;
  questionVersion: number;
  reviewerId: string;
  decision: NuReviewDecision;
  reason?: string | null;
  checks: NuReviewChecks;
  reviewedAt?: Timestamp | null;
}

/** One immutable publication record (§19.2.11, append-only). */
export interface NuPublicationDoc {
  questionId?: string | null;
  bundleId?: string | null;
  noticeId?: string | null;
  questionVersion?: number | null;
  action: 'published' | 'withdrawn';
  actorId: string;
  reason?: string | null;
  createdAt?: Timestamp | null;
}

// ---------- validators (rules-mirror — the Firestore rules enforce
// the same shape; the lib adds the deep checks the rules cannot do:
// syllabus references, option distinctness, text similarity) ----------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export const NU_GROUP_IDS: readonly NuGroupSlug[] = ['humanities', 'science', 'business'];

function validGroupIds(v: unknown): v is NuGroupSlug[] {
  return (
    Array.isArray(v) &&
    v.length >= 1 &&
    v.length <= 3 &&
    v.every((g) => typeof g === 'string' && (NU_GROUP_IDS as readonly string[]).includes(g))
  );
}

/** The 3 common subjects, from the code-backed syllabus (NU-6).
 * Group-block slugs are NOT valid question subjects (Blocker B). */
export function nuQuestionValidSubjectIds(): readonly string[] {
  return nuSyllabusSubjects()
    .filter((s) => !s.isGroupBlock)
    .map((s) => s.slug);
}

/** The syllabus docs carry `subjectId` = the subject DOC id
 * (`nu-sub-bangla`), while a question's `subjectId` is the SLUG
 * (`bangla` — NU-4 seed + routes). Map slug → doc id first. */
function syllabusSubjectIdForSlug(slug: string): string | undefined {
  return nuSyllabusSubjectBySlug(slug)?.id;
}

function chapterFor(subjectSlug: string, chapterId: string): NuSyllabusChapterDoc | undefined {
  const sid = syllabusSubjectIdForSlug(subjectSlug);
  if (!sid) return undefined;
  return nuSyllabusChapters().find((c) => c.id === chapterId && c.subjectId === sid);
}

function topicFor(subjectSlug: string, chapterId: string, topicId: string): NuSyllabusTopicDoc | undefined {
  const sid = syllabusSubjectIdForSlug(subjectSlug);
  if (!sid) return undefined;
  return nuSyllabusTopics().find(
    (tp) => tp.id === topicId && tp.subjectId === sid && tp.chapterId === chapterId,
  );
}

/** Full shape + deep checks for a bank record. Returns every problem
 * — empty means valid. `questionId` (when present) must be a
 * non-empty string; `createdAt` (when present) must be a Timestamp. */
export function validateNuQuestionDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(doc)) return ['প্রশ্নটি একটি ডকুমেন্ট হতে হবে'];
  if (doc.questionId !== undefined && !isNonEmptyString(doc.questionId)) {
    problems.push('questionId খালি হতে পারবে না');
  }
  if (typeof doc.version !== 'number' || !Number.isInteger(doc.version) || doc.version < 1) {
    problems.push('version ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে');
  }
  if (typeof doc.status !== 'string' || !(NU_QUESTION_STATUSES as readonly string[]).includes(doc.status)) {
    problems.push(`status হতে হবে: ${NU_QUESTION_STATUSES.join(', ')}`);
  }
  if (typeof doc.sourceType !== 'string' || !(NU_QUESTION_SOURCE_TYPES as readonly string[]).includes(doc.sourceType)) {
    problems.push(`sourceType হতে হবে: ${NU_QUESTION_SOURCE_TYPES.join(', ')}`);
  }
  if (!isNonEmptyString(doc.provenance)) problems.push('provenance (উৎসের বিবরণ) বাধ্যতামূলক');
  if (!validGroupIds(doc.groupIds)) problems.push('groupIds-এ ১–৩টি বৈধ শাখা (humanities/science/business) থাকতে হবে');
  if (!isNonEmptyString(doc.subjectId)) {
    problems.push('subjectId বাধ্যতামূলক');
  } else if (!nuQuestionValidSubjectIds().includes(doc.subjectId)) {
    problems.push('subjectId হতে হবে বাংলা / ইংরেজি / সাধারণ জ্ঞান — শাখা-৪০ ব্লকের প্রশ্ন এখনো লেখা যাবে না (Blocker B)');
  }
  if (!isNonEmptyString(doc.chapterId)) problems.push('chapterId বাধ্যতামূলক');
  if (!isNonEmptyString(doc.topicId)) problems.push('topicId বাধ্যতামূলক');
  if (
    isNonEmptyString(doc.subjectId) &&
    isNonEmptyString(doc.chapterId) &&
    nuQuestionValidSubjectIds().includes(doc.subjectId) &&
    !chapterFor(doc.subjectId, doc.chapterId)
  ) {
    problems.push('chapterId এই বিষয়ের কোনো অধ্যায়ের সঙ্গে মেলে না');
  }
  if (
    isNonEmptyString(doc.subjectId) &&
    isNonEmptyString(doc.chapterId) &&
    isNonEmptyString(doc.topicId) &&
    chapterFor(doc.subjectId, doc.chapterId) &&
    !topicFor(doc.subjectId, doc.chapterId, doc.topicId)
  ) {
    problems.push('topicId এই অধ্যায়ের কোনো টপিকের সঙ্গে মেলে না');
  }
  if (!isNonEmptyString(doc.questionText)) problems.push('questionText বাধ্যতামূলক');
  if (doc.questionLang !== 'bn' && doc.questionLang !== 'en') {
    problems.push("questionLang হতে হবে 'bn' বা 'en'");
  }
  if (!Array.isArray(doc.options) || doc.options.length !== 4) {
    problems.push('options-এ ঠিক ৪টি অপশন থাকতে হবে');
  } else {
    const texts = doc.options as unknown[];
    if (texts.some((o) => !isNonEmptyString(o))) problems.push('প্রতিটি অপশনে লেখা থাকতে হবে');
    if (new Set(texts.map((o) => String(o).trim())).size !== 4) {
      problems.push('৪টি অপশন আলাদা হতে হবে — একই লেখা দুবার নয়');
    }
  }
  if (typeof doc.difficulty !== 'string' || !(NU_QUESTION_DIFFICULTIES as readonly string[]).includes(doc.difficulty)) {
    problems.push(`difficulty হতে হবে: ${NU_QUESTION_DIFFICULTIES.join(', ')}`);
  }
  if (!isNonEmptyString(doc.explanation)) problems.push('explanation বাধ্যতামূলক — ব্যাখ্যা ছাড়া প্রশ্ন Published হবে না');
  if (doc.sourceType === 'official_previous_year') {
    if (typeof doc.examYear !== 'number' || !Number.isInteger(doc.examYear)) {
      problems.push('বিগত প্রশ্নে examYear (পরীক্ষার সাল) বাধ্যতামূলক');
    }
  } else if (doc.examYear !== undefined && doc.examYear !== null) {
    problems.push('examYear শুধু বিগত প্রশ্নে থাকে');
  }
  if (!isNonEmptyString(doc.createdBy)) problems.push('createdBy বাধ্যতামূলক');
  if (!isNonEmptyString(doc.circularVersion)) problems.push('circularVersion বাধ্যতামূলক');
  if ('correctOptionIndex' in doc) {
    problems.push('সঠিক উত্তর এই ডকে থাকবে না — তা draft key-তে থাকে');
  }
  if (doc.duplicateOf !== undefined && doc.duplicateOf !== null && !isNonEmptyString(doc.duplicateOf)) {
    problems.push('duplicateOf থাকলে প্রশ্নের আইডি হতে হবে');
  }
  if (doc.previousQuestionId !== undefined && doc.previousQuestionId !== null && !isNonEmptyString(doc.previousQuestionId)) {
    problems.push('previousQuestionId থাকলে প্রশ্নের আইডি হতে হবে');
  }
  return problems;
}

/** Draft-key shape. The key must name the question it belongs to and
 * carry the same version. */
export function validateNuQuestionDraftKey(doc: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(doc)) return ['খসড়া কি একটি ডকুমেন্ট হতে হবে'];
  if (!isNonEmptyString(doc.questionId)) problems.push('questionId বাধ্যতামূলক');
  if (typeof doc.version !== 'number' || !Number.isInteger(doc.version) || doc.version < 1) {
    problems.push('version ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে');
  }
  if (typeof doc.correctOptionIndex !== 'number' || !Number.isInteger(doc.correctOptionIndex) || doc.correctOptionIndex < 0 || doc.correctOptionIndex > 3) {
    problems.push('correctOptionIndex ০–৩ হতে হবে');
  }
  if (!isNonEmptyString(doc.createdBy)) problems.push('createdBy বাধ্যতামূলক');
  if (!isNonEmptyString(doc.subjectId)) problems.push('subjectId বাধ্যতামূলক');
  if (!validGroupIds(doc.groupIds)) problems.push('groupIds-এ ১–৩টি বৈধ শাখা থাকতে হবে');
  return problems;
}

/** Review shape (§19.2.11). */
export function validateNuReviewDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(doc)) return ['পর্যালোচনা একটি ডকুমেন্ট হতে হবে'];
  if (!isNonEmptyString(doc.questionId)) problems.push('questionId বাধ্যতামূলক');
  if (typeof doc.questionVersion !== 'number' || !Number.isInteger(doc.questionVersion) || doc.questionVersion < 1) {
    problems.push('questionVersion ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে');
  }
  if (!isNonEmptyString(doc.reviewerId)) problems.push('reviewerId বাধ্যতামূলক');
  if (typeof doc.decision !== 'string' || !(['approved', 'rejected', 'changes_requested'] as const).includes(doc.decision as never)) {
    problems.push("decision হতে হবে: approved / rejected / changes_requested");
  }
  if (doc.decision !== 'approved') {
    if (!isNonEmptyString(doc.reason) || (doc.reason as string).trim().length < 10) {
      problems.push('প্রত্যাখ্যান / ফেরতের কারণ কমপক্ষে ১০ অক্ষরের হতে হবে');
    }
  }
  if (!isRecord(doc.checks)) {
    problems.push('checks-এ ৪টি যাচাই (প্রশ্ন / সঠিক উত্তর / ব্যাখ্যা / উৎস) থাকতে হবে');
  } else {
    for (const k of ['questionCorrect', 'correctAnswerCorrect', 'explanationCorrect', 'sourceCorrect']) {
      if (typeof doc.checks[k] !== 'boolean') problems.push(`checks.${k} true/false হতে হবে`);
    }
  }
  return problems;
}

/** Bundle shape (§19.2.5). The builder below guarantees it; this
 * validator is the rules-mirror + the admin page's pre-write check. */
export function validateNuQuestionBundleDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(doc)) return ['বান্ডেল একটি ডকুমেন্ট হতে হবে'];
  if (!isNonEmptyString(doc.bundleId)) problems.push('bundleId বাধ্যতামূলক');
  if (doc.kind !== 'topic' && doc.kind !== 'mock' && doc.kind !== 'daily') {
    problems.push("kind হতে হবে: topic / mock / daily");
  }
  if (typeof doc.groupId !== 'string' || !(NU_GROUP_IDS as readonly string[]).includes(doc.groupId)) {
    problems.push('groupId হতে হবে: humanities / science / business');
  }
  if (!Array.isArray(doc.questions) || doc.questions.length === 0) {
    problems.push('questions-এ কমপক্ষে ১টি প্রশ্ন থাকতে হবে');
  } else {
    for (const [i, q] of (doc.questions as unknown[]).entries()) {
      if (!isRecord(q)) { problems.push(`questions[${i}] ডকুমেন্ট নয়`); continue; }
      if (!isNonEmptyString(q.questionId)) problems.push(`questions[${i}].questionId বাধ্যতামূলক`);
      if (typeof q.version !== 'number' || !Number.isInteger(q.version) || q.version < 1) {
        problems.push(`questions[${i}].version ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে`);
      }
      if (!isNonEmptyString(q.questionText)) problems.push(`questions[${i}].questionText বাধ্যতামূলক`);
      if (!Array.isArray(q.options) || q.options.length !== 4 || (q.options as unknown[]).some((o) => !isNonEmptyString(o))) {
        problems.push(`questions[${i}].options-এ ঠিক ৪টি লেখা থাকতে হবে`);
      }
      if ('correctOptionIndex' in q || 'explanation' in q) {
        problems.push(`questions[${i}]-এ সঠিক উত্তর / ব্যাখ্যা থাকবে না — তা key-তে থাকে`);
      }
    }
    if (doc.questionCount !== doc.questions.length) {
      problems.push('questionCount questions-এর সংখ্যার সঙ্গে মিলতে হবে');
    }
  }
  if (doc.kind === 'mock' && (doc.questions as unknown[]).length !== 100) {
    problems.push('মক বান্ডেলে ঠিক ১০০টি প্রশ্ন থাকতে হবে');
  }
  if (
    doc.kind === 'daily' &&
    ((doc.questions as unknown[]).length < 20 || (doc.questions as unknown[]).length > 30)
  ) {
    problems.push('দৈনিক বান্ডেলে ২০–৩০টি প্রশ্ন থাকতে হবে');
  }
  if (!isRecord(doc.configSnapshot)) {
    problems.push('configSnapshot বাধ্যতামূলক');
  } else {
    const s = doc.configSnapshot as Record<string, unknown>;
    if (doc.kind === 'mock' && (s.totalQuestions !== 100 || s.durationSeconds !== 3600)) {
      problems.push('মক বান্ডেলে totalQuestions ১০০ ও durationSeconds ৩৬০০ হতে হবে');
    }
    if (doc.kind === 'topic' && (s.totalQuestions !== (doc.questions as unknown[]).length || s.durationSeconds !== null)) {
      problems.push('অনুশীলনী বান্ডেলে totalQuestions প্রশ্নের সংখ্যা ও durationSeconds null হতে হবে');
    }
    if (doc.kind === 'daily' && (typeof s.totalQuestions !== 'number' || s.totalQuestions < 20 || s.totalQuestions > 30)) {
      problems.push('দৈনিক বান্ডেলে totalQuestions ২০–৩০ হতে হবে');
    }
    const m = s.marking;
    if (!isRecord(m) || m.correct !== 1 || m.incorrect !== 0 || m.unanswered !== 0 || m.negativeMarking !== false) {
      problems.push('marking হতে হবে: সঠিক ১, ভুল ০, উত্তর-না-দেওয়া ০, নেগেটিভ মার্কিং নেই');
    }
    if (!isNonEmptyString(s.circularVersion)) problems.push('configSnapshot.circularVersion বাধ্যতামূলক');
    if (typeof s.configVersion !== 'number' || !Number.isInteger(s.configVersion) || s.configVersion < 1) {
      problems.push('configSnapshot.configVersion ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে');
    }
  }
  if (!Array.isArray(doc.sourceQuestionIds)) problems.push('sourceQuestionIds তালিকা বাধ্যতামূলক');
  if (doc.status !== 'draft' && doc.status !== 'published' && doc.status !== 'withdrawn') {
    problems.push("status হতে হবে: draft / published / withdrawn");
  }
  if (typeof doc.version !== 'number' || !Number.isInteger(doc.version) || doc.version < 1) {
    problems.push('version ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে');
  }
  return problems;
}

/** Key-doc shape (§19.2.6). */
export function validateNuQuestionKeyDoc(doc: unknown): string[] {
  const problems: string[] = [];
  if (!isRecord(doc)) return ['কি একটি ডকুমেন্ট হতে হবে'];
  if (!isNonEmptyString(doc.bundleId)) problems.push('bundleId বাধ্যতামূলক');
  if (!Array.isArray(doc.keys) || doc.keys.length === 0) {
    problems.push('keys-এ কমপক্ষে ১টি উত্তর থাকতে হবে');
  } else {
    for (const [i, k] of (doc.keys as unknown[]).entries()) {
      if (!isRecord(k)) { problems.push(`keys[${i}] ডকুমেন্ট নয়`); continue; }
      if (!isNonEmptyString(k.questionId)) problems.push(`keys[${i}].questionId বাধ্যতামূলক`);
      if (typeof k.version !== 'number' || !Number.isInteger(k.version) || k.version < 1) {
        problems.push(`keys[${i}].version ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে`);
      }
      if (typeof k.correctOptionIndex !== 'number' || !Number.isInteger(k.correctOptionIndex) || k.correctOptionIndex < 0 || k.correctOptionIndex > 3) {
        problems.push(`keys[${i}].correctOptionIndex ০–৩ হতে হবে`);
      }
      if (!isNonEmptyString(k.explanation)) problems.push(`keys[${i}].explanation বাধ্যতামূলক`);
    }
  }
  if (typeof doc.questionVersion !== 'number' || !Number.isInteger(doc.questionVersion) || doc.questionVersion < 1) {
    problems.push('questionVersion ১ থেকে শুরু হওয়া পূর্ণসংখ্যা হতে হবে');
  }
  return problems;
}

// ---------- publish gate (§19.6.1 — every item mandatory) ----------

/** Returns the missing gate items (Bangla labels) — empty means the
 * question may be published. */
export function publishGateCheck(doc: NuQuestionDoc): string[] {
  const missing: string[] = [];
  if (!isNonEmptyString(doc.explanation)) missing.push('ব্যাখ্যা');
  if (!isNonEmptyString(doc.questionText)) missing.push('প্রশ্নের লেখা');
  if (!Array.isArray(doc.options) || doc.options.length !== 4) missing.push('৪টি অপশন');
  if (!isNonEmptyString(doc.subjectId)) missing.push('বিষয়');
  if (!isNonEmptyString(doc.chapterId)) missing.push('অধ্যায়');
  if (!isNonEmptyString(doc.topicId)) missing.push('টপিক');
  if (!Array.isArray(doc.groupIds) || doc.groupIds.length === 0) missing.push('শাখা-প্রযোজ্যতা');
  if (!isNonEmptyString(doc.difficulty)) missing.push('অসুবিধা');
  if (!isNonEmptyString(doc.sourceType) || !isNonEmptyString(doc.provenance)) missing.push('উৎস / উৎস-ইতিহাস');
  if (!isNonEmptyString(doc.reviewedBy)) missing.push('পর্যালোচকের পরিচয়');
  if (doc.reviewedAt == null) missing.push('পর্যালোচনার সময়');
  if (!isNonEmptyString(doc.circularVersion)) missing.push('বিজ্ঞপ্তির সংস্করণ');
  if (typeof doc.version !== 'number' || doc.version < 1) missing.push('প্রশ্নের সংস্করণ');
  return missing;
}

// ---------- builders (bundle + key assembly — NU-8/NU-9 publish
// bundles from these; NU-7 proves the assembly + its rules) ----------

/** Build a student-facing bundle from PUBLISHED questions only.
 * Throws if any input carries a correct answer / explanation (the
 * bundle must never contain them), if the list is empty, or if the
 * config snapshot disagrees with the kind. */
export function buildNuQuestionBundle(input: {
  bundleId: string;
  kind: NuBundleKind;
  groupId: NuGroupSlug;
  subjectId?: string | null;
  topicId?: string | null;
  mockId?: string | null;
  questions: Array<NuQuestionDoc & { questionId: string }>;
  configSnapshot: NuBundleConfigSnapshot;
  publishedBy: string;
}): NuQuestionBundleDoc {
  if (input.questions.length === 0) throw new Error('nu-bundle-empty: বান্ডেলে কমপক্ষে ১টি প্রশ্ন থাকতে হবে');
  for (const q of input.questions) {
    if (q.status !== 'published') {
      throw new Error(`nu-bundle-unpublished: ${q.questionId} এখনো published নয় — বান্ডেলে শুধু Published প্রশ্ন যায়`);
    }
    if ('correctOptionIndex' in q) {
      throw new Error('nu-bundle-leak: প্রশ্নে সঠিক-উত্তরের ক্ষেত্র আছে — বান্ডেলে যাবে না');
    }
  }
  const questions: NuBundleQuestion[] = input.questions.map((q) => ({
    questionId: q.questionId,
    version: q.version,
    questionText: q.questionText,
    options: [...q.options],
  }));
  const doc: NuQuestionBundleDoc = {
    bundleId: input.bundleId,
    kind: input.kind,
    groupId: input.groupId,
    subjectId: input.subjectId ?? null,
    topicId: input.topicId ?? null,
    mockId: input.mockId ?? null,
    questions,
    questionCount: questions.length,
    configSnapshot: input.configSnapshot,
    sourceQuestionIds: input.questions.map((q) => q.questionId),
    status: 'draft',
    version: 1,
    publishedBy: input.publishedBy,
  };
  const problems = validateNuQuestionBundleDoc(doc);
  if (problems.length > 0) throw new Error(`nu-bundle-invalid: ${problems.join(' | ')}`);
  return doc;
}

/** Build the answer key for a bundle. `questionVersion` must equal
 * the bundle's `version` — the caller passes the bundle's version. */
export function buildNuQuestionKeys(input: {
  bundleId: string;
  entries: NuQuestionKeyEntry[];
  questionVersion: number;
}): NuQuestionKeyDoc {
  const doc: NuQuestionKeyDoc = {
    bundleId: input.bundleId,
    keys: input.entries.map((e) => ({ ...e })),
    questionVersion: input.questionVersion,
  };
  const problems = validateNuQuestionKeyDoc(doc);
  if (problems.length > 0) throw new Error(`nu-keys-invalid: ${problems.join(' | ')}`);
  return doc;
}

/** Topic-practice config snapshot (untimed, no pass mark). */
export function nuTopicBundleConfigSnapshot(questionCount: number): NuBundleConfigSnapshot {
  return {
    totalQuestions: questionCount,
    durationSeconds: null,
    marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
    passMark: null,
    circularVersion: NU_CIRCULAR_VERSION,
    configVersion: 1,
  };
}

/** Full-mock config snapshot (100 Q / 60 min / pass 35 display-only). */
export function nuMockBundleConfigSnapshot(): NuBundleConfigSnapshot {
  return {
    totalQuestions: 100,
    durationSeconds: 3600,
    marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
    passMark: 35,
    circularVersion: NU_CIRCULAR_VERSION,
    configVersion: 1,
  };
}

// ---------- duplicate detection (§11.4 — warning card, NOT a block) ----------

/** Normalize for comparison: trim, collapse whitespace, drop common
 * punctuation. Bangla text has no case — Latin is lowercased. */
export function normalizeNuQuestionText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[।?!.,;:()""''\-–—]/g, '')
    .toLowerCase();
}

export function nuQuestionSimilarity(a: string, b: string): number {
  const wa = new Set(normalizeNuQuestionText(a).split(' ').filter(Boolean));
  const wb = new Set(normalizeNuQuestionText(b).split(' ').filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter += 1;
  return inter / new Set([...wa, ...wb]).size;
}

/** Candidates whose text is (near-)identical to the candidate text.
 * Similarity ≥ 0.8, or an exact normalized match. Warning only — the
 * reviewer decides; nothing is auto-blocked. */
export function findNuDuplicateCandidates(
  existing: Array<{ questionId: string; questionText: string }>,
  candidateText: string,
): Array<{ questionId: string; similarity: number }> {
  const out: Array<{ questionId: string; similarity: number }> = [];
  for (const q of existing) {
    const s = nuQuestionSimilarity(q.questionText, candidateText);
    if (s >= 0.8) out.push({ questionId: q.questionId, similarity: s });
  }
  return out.sort((a, b) => b.similarity - a.similarity);
}

// ---------- versioning (§19.6.2 — a correction is a NEW doc) ----------

/** A corrected version of a published/approved question: a NEW draft
 * doc with version + 1, pointing back at the doc it corrects. Review
 * fields are cleared — the new version needs its own review. The old
 * doc stays as history until the new version publishes (then the old
 * one is withdrawn by the Admin). */
export function newNuQuestionVersion(
  oldDoc: NuQuestionDoc & { questionId: string },
  newQuestionId: string,
  correctorUid: string,
): NuQuestionDoc {
  return {
    ...oldDoc,
    questionId: newQuestionId,
    version: oldDoc.version + 1,
    status: 'draft',
    previousQuestionId: oldDoc.questionId,
    createdBy: correctorUid,
    reviewedBy: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: null,
  };
}
