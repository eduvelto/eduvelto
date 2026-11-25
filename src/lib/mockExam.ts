// Eduvelto — General Mock Exam hub + runner library
// (7-day sprint, Day 5).
//
// The hub lives at /:lang/mock-exam (and bare /mock-exam).
// Three categories:
//   - job — DEEP-LINK ONLY to the Job mock engine
//     (/jobs/mock/:mockId, jobMock.ts / jobEngine.ts). This file
//     never rebuilds it.
//   - admission — general runner over verified bundles.
//   - academic — general runner over verified bundles.
//
// QUESTION SOURCE — ONLY VERIFIED QUESTIONS. A bundle counts
// as verified when status === 'published' AND reviewStatus ===
// 'Published' (deriveVerificationStatus in jobCentralBank.ts).
// The verified pool today is the 35 owner-verified BCS English
// questions (bcs-english-batch1) plus any other published
// bundle. The 6,349 Job + 977 Admission DRAFTS are NEEDS-REVIEW
// — they are never listed, never loaded, never presented as
// verified. A category with no verified bundle shows the honest
// empty state ("এই বিভাগে এখনো যাচাইকৃত প্রশ্ন নেই") and the
// runner refuses to start without a verified bundle.
//
// TRUST BOUNDARY (same as the Job engine): scores are
// CLIENT-CALCULATED — the result always carries
// JOB_PRACTICE_RESULT_LABEL ("অনুশীলন ফলাফল — নিয়োগ পরীক্ষার
// ফল নয়"), never "verified". The general runner writes NO
// Firestore docs (no session/attempt collections exist for it);
// an attempt lives in memory only, for the result view.
//
// KEYS — the answer key is loaded ONLY after submit
// (loadMockKeyAfterSubmit) and is NEVER cached (see
// mockExamCache.ts — the cache holds questions + options only).
// Only kind 'topic' / 'previous' bundles run here: their keys
// are readable by a signed-in student directly (jobPractice.ts
// header). Mock-kind bundles are receipt-gated to the Job
// engine and are excluded by isVerifiedBundle.

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { jobExamBySlug } from './jobExams';
import {
  JOB_PRACTICE_RESULT_LABEL,
  weakTopicsFromAttemptAnswers,
  type JobAttemptAnswer,
  type JobAttemptResult,
  type JobSessionAnswerSelection,
  type JobWeakTopic,
} from './jobEngine';
import {
  perSubjectTime,
  perTopicAccuracy,
  topicActionBadge,
  type SubjectTimeStat,
  type TopicActionBadge,
  type TopicStat,
} from './jobAnalysis';
import { loadBundleKey, loadPracticeBundle, type PracticeBundleWithId } from './jobPractice';
import type { JobQuestionBundle, JobQuestionKey } from './jobQuestions';
import {
  buildMockBundleCacheRecord,
  loadCachedMockBundle,
  saveMockBundle,
  type CachedMockBundle,
} from './mockExamCache';

export { JOB_PRACTICE_RESULT_LABEL };

/** Firestore not configured (gate G1) — pages show the honest
 * reason instead of crashing. */
function requireDb(): NonNullable<typeof db> {
  if (!db) throw new Error('Firebase কনফিগার করা হয়নি — মক পরীক্ষা এখন চালানো যাবে না।');
  return db;
}

export type MockCategory = 'job' | 'admission' | 'academic';

export const MOCK_CATEGORIES: Array<{
  category: MockCategory;
  nameBn: string;
  nameEn: string;
  emptyBn: string;
  emptyEn: string;
}> = [
  {
    category: 'job',
    nameBn: 'চাকরি',
    nameEn: 'Job',
    emptyBn: 'এই বিভাগে এখনো যাচাইকৃত প্রশ্ন নেই',
    emptyEn: 'No verified questions in this category yet',
  },
  {
    category: 'admission',
    nameBn: 'ভর্তি পরীক্ষা',
    nameEn: 'Admission',
    emptyBn: 'এই বিভাগে এখনো যাচাইকৃত প্রশ্ন নেই',
    emptyEn: 'No verified questions in this category yet',
  },
  {
    category: 'academic',
    nameBn: 'একাডেমিক',
    nameEn: 'Academic',
    emptyBn: 'এই বিভাগে এখনো যাচাইকৃত প্রশ্ন নেই',
    emptyEn: 'No verified questions in this category yet',
  },
];

/**
 * Admission exam slugs the hub recognises. This is a ROUTING
 * table only (which card a verified bundle lands on) — never a
 * claim that a bundle for the slug exists. Unknown slugs fall
 * to 'academic'; Job slugs are decided by jobExamBySlug().
 */
export const ADMISSION_EXAM_SLUGS: readonly string[] = [
  'nu-admission',
  'du-admission',
  'medical-admission',
  'engineering-admission',
  'gst-admission',
  'cu-admission',
  'ru-admission',
  'ju-admission',
  'buet-admission',
];

/** Which hub category a bundle's examSlug belongs to. */
export function categoryForExamSlug(examSlug: string): MockCategory {
  if (jobExamBySlug(examSlug)) return 'job';
  if (
    ADMISSION_EXAM_SLUGS.includes(examSlug)
    || examSlug === 'admission'
    || examSlug.startsWith('admission-')
    || examSlug.endsWith('-admission')
  ) {
    return 'admission';
  }
  return 'academic';
}

/** Negative-marking choices the student picks BEFORE starting.
 * 0 = no penalty; the others are the per-wrong-answer deduction. */
export const NEGATIVE_MARKING_OPTIONS = [0, 0.25, 0.5, 1] as const;
export type NegativeMarkingOption = (typeof NEGATIVE_MARKING_OPTIONS)[number];

export function isNegativeMarkingOption(v: unknown): v is NegativeMarkingOption {
  return v === 0 || v === 0.25 || v === 0.5 || v === 1;
}

/** One minute per question (self-paced timed mock). */
export function timeMinutesFor(questionCount: number): number {
  return Math.max(1, Math.floor(questionCount));
}

/* ------------------------------------------------------------------ */
/* Verified bundles — the ONLY question source                        */
/* ------------------------------------------------------------------ */

/** Metadata for one verified bundle (no questions — the hub
 * list never ships question content to the browser). */
export interface VerifiedMockBundle {
  docId: string;
  titleBn: string;
  titleEn: string;
  examSlug: string;
  category: MockCategory;
  kind: 'topic' | 'previous';
  questionCount: number;
  bundleVersion: number;
}

/**
 * True only for a VERIFIED runnable bundle: published +
 * reviewStatus Published, kind topic/previous (mock-kind
 * bundles are receipt-gated to the Job engine), at least one
 * usable question. DRAFTS (incl. the 6,349 Job + 977 Admission
 * NEEDS-REVIEW questions) fail here and are never listed.
 */
export function isVerifiedBundle(doc: Record<string, unknown>): boolean {
  if (doc.status !== 'published') return false;
  if (doc.reviewStatus !== 'Published') return false;
  if (doc.kind !== 'topic' && doc.kind !== 'previous') return false;
  if (!Array.isArray(doc.questions) || doc.questions.length === 0) return false;
  if (typeof doc.titleBn !== 'string' || doc.titleBn.length === 0) return false;
  if (typeof doc.examSlug !== 'string' || doc.examSlug.length === 0) return false;
  if (!Number.isInteger(doc.bundleVersion) || (doc.bundleVersion as number) < 1) return false;
  return true;
}

export function verifiedBundleFromDoc(docId: string, doc: Record<string, unknown>): VerifiedMockBundle | null {
  if (!isVerifiedBundle(doc)) return null;
  const questions = doc.questions as unknown[];
  return {
    docId,
    titleBn: doc.titleBn as string,
    titleEn: typeof doc.titleEn === 'string' ? (doc.titleEn as string) : (doc.titleBn as string),
    examSlug: doc.examSlug as string,
    category: categoryForExamSlug(doc.examSlug as string),
    kind: doc.kind as 'topic' | 'previous',
    questionCount: questions.length,
    bundleVersion: doc.bundleVersion as number,
  };
}

/** Group verified bundles by hub category (job first). */
export function groupBundlesByCategory(
  bundles: VerifiedMockBundle[],
): Record<MockCategory, VerifiedMockBundle[]> {
  const grouped: Record<MockCategory, VerifiedMockBundle[]> = { job: [], admission: [], academic: [] };
  for (const b of bundles) grouped[b.category].push(b);
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => a.titleBn.localeCompare(b.titleBn, 'bn'));
  }
  return grouped;
}

/**
 * List every VERIFIED bundle (status published + reviewStatus
 * Published, client-side filtered — one == filter, no composite
 * index). Drafts never appear. Returns metadata only.
 */
export async function listVerifiedMockBundles(): Promise<VerifiedMockBundle[]> {
  const firestore = requireDb();
  const snap = await getDocs(
    query(collection(firestore, 'jobQuestionBundles'), where('status', '==', 'published')),
  );
  const out: VerifiedMockBundle[] = [];
  for (const d of snap.docs) {
    const meta = verifiedBundleFromDoc(d.id, d.data() as Record<string, unknown>);
    if (meta) out.push(meta);
  }
  out.sort(
    (a, b) =>
      (a.category === b.category ? 0 : a.category === 'job' ? -1 : b.category === 'job' ? 1 : 0)
      || a.titleBn.localeCompare(b.titleBn, 'bn'),
  );
  return out;
}

/**
 * Load one verified bundle for a run. The cached generation
 * (same bundleId + bundleVersion) is reused with NO Firestore
 * read; a miss reads Firestore, verifies the bundle, then
 * caches the questions (never the key). Returns null when the
 * bundle is missing, unverified, or unusable.
 */
export async function loadMockBundleForRun(
  bundleId: string,
  bundleVersion: number,
): Promise<{ bundle: PracticeBundleWithId; cachedBundle: CachedMockBundle; fromCache: boolean } | null> {
  const cached = await loadCachedMockBundle(bundleId, bundleVersion);
  if (cached) {
    return {
      bundle: {
        kind: 'topic',
        examSlug: cached.examSlug,
        titleBn: cached.titleBn,
        titleEn: cached.titleEn,
        questions: cached.questions.map((q) => ({ ...q })),
        questionCount: cached.questionCount,
        bundleVersion: cached.bundleVersion,
        status: 'published',
        reviewStatus: 'Published',
        sourceQuestionIds: cached.questions.map((q) => q.questionId),
        docId: cached.bundleId,
      },
      cachedBundle: cached,
      fromCache: true,
    };
  }
  const bundle = await loadPracticeBundle(bundleId);
  if (!bundle) return null;
  if (!isVerifiedBundle(bundle as unknown as Record<string, unknown>)) return null;
  if (bundle.bundleVersion !== bundleVersion) return null;
  const record = buildMockBundleCacheRecord({
    docId: bundle.docId,
    bundleVersion: bundle.bundleVersion,
    titleBn: bundle.titleBn,
    titleEn: bundle.titleEn,
    examSlug: bundle.examSlug,
    questions: bundle.questions as unknown as Array<Record<string, unknown>>,
  });
  if (!record) return null;
  await saveMockBundle(record);
  return { bundle, cachedBundle: record, fromCache: false };
}

/**
 * Load the answer key for a bundle — AFTER SUBMIT ONLY. The
 * caller (the runner) calls this once the answers are frozen;
 * the key is held in memory for the result view and never
 * written to any cache. A read failure throws an honest error
 * (the runner turns it into "ফলাফল দেখা যাচ্ছে না — আবার চেষ্টা
 * করুন", never a guessed score).
 */
export async function loadMockKeyAfterSubmit(bundleId: string): Promise<JobQuestionKey> {
  const key = await loadBundleKey(bundleId);
  if (!key) throw new Error('উত্তরের চাবি পাওয়া যায়নি — ফলাফল হিসাব করা যায়নি।');
  return key;
}

/* ------------------------------------------------------------------ */
/* Shuffling — deterministic per attempt                              */
/* ------------------------------------------------------------------ */

/** mulberry32: small seeded PRNG (deterministic, testable). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed for one attempt: same bundle + version + attempt index
 * always shuffles the same way; a new attempt reshuffles. */
export function seedForAttempt(bundleId: string, bundleVersion: number, attemptIndex: number): number {
  let h = 2166136261;
  const s = `${bundleId}:v${bundleVersion}:attempt-${attemptIndex}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher–Yates shuffle with a seed — pure, deterministic. */
export function shuffleQuestions<T>(questions: readonly T[], seed: number): T[] {
  const out = [...questions];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Scoring — mirrors scorePracticeAttempt, with the student's     */
/* chosen negative marking (0 / 0.25 / 0.5 / 1.0). Pure.          */
/* ------------------------------------------------------------------ */

export interface ScoreGeneralMockInput {
  bundle: JobQuestionBundle;
  /** NULL IS AN ERROR — a mock is never scored by guessing. */
  key: JobQuestionKey | null;
  answers: Array<{
    n: number;
    questionId: string;
    selected: JobSessionAnswerSelection;
    timeSpentSeconds?: number;
  }>;
  negativeMarking: NegativeMarkingOption;
  startedAtMillis: number;
  submittedAtMillis: number;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Score a general mock attempt (pure). Rules: correct × 1 −
 * wrong × negativeMarking; unanswered = 0. Throws when the key
 * is null, when the key does not match the bundle, or when the
 * bundle is empty — exactly like scorePracticeAttempt. */
export function scoreGeneralMock(input: ScoreGeneralMockInput): JobAttemptResult {
  const { bundle, key } = input;
  if (key === null) {
    throw new Error('scoreGeneralMock: key is null — a mock is never scored by guessing');
  }
  if (bundle.questions.length === 0) {
    throw new Error('scoreGeneralMock: bundle has no questions');
  }
  if (key.answers.length !== bundle.questions.length) {
    throw new Error(
      `scoreGeneralMock: key answers (${key.answers.length}) != bundle questions (${bundle.questions.length})`,
    );
  }
  const keyByN = new Map(key.answers.map((a) => [a.n, a]));
  const givenByN = new Map(input.answers.map((a) => [a.n, a]));
  for (const given of input.answers) {
    if (!bundle.questions.some((q) => q.n === given.n && q.questionId === given.questionId)) {
      throw new Error(
        `scoreGeneralMock: answer n=${given.n} (${given.questionId}) is not in the bundle`,
      );
    }
  }
  const maxPerAnswer = timeMinutesFor(bundle.questions.length) * 60 + 60;
  const answers: JobAttemptAnswer[] = [];
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const wrongQuestionIds: string[] = [];
  for (const q of bundle.questions) {
    const keyAnswer = keyByN.get(q.n);
    if (!keyAnswer || keyAnswer.questionId !== q.questionId) {
      throw new Error(
        `scoreGeneralMock: key has no matching answer for bundle question n=${q.n} (${q.questionId})`,
      );
    }
    const given = givenByN.get(q.n);
    const selected = given?.selected ?? null;
    if (selected !== null && !['A', 'B', 'C', 'D'].includes(selected)) {
      throw new Error(`scoreGeneralMock: selected '${String(selected)}' is not A/B/C/D/null`);
    }
    const answered = selected !== null;
    const correct = answered && selected === keyAnswer.correctLetter;
    const marks = !answered ? 0 : correct ? 1 : -input.negativeMarking;
    if (correct) correctCount += 1;
    else if (answered) {
      wrongCount += 1;
      wrongQuestionIds.push(q.questionId);
    } else unansweredCount += 1;
    answers.push({
      n: q.n,
      questionId: q.questionId,
      topicId: q.topicId,
      subjectId: q.subjectId,
      selected,
      correct,
      marks,
      correctText: keyAnswer.correctText,
      timeSpentSeconds: Math.min(Math.max(0, given?.timeSpentSeconds ?? 0), maxPerAnswer),
    });
  }
  const negativeDeduction = round2(wrongCount * input.negativeMarking);
  const score = round2(correctCount - negativeDeduction);
  const totalMarks = bundle.questions.length;
  const answeredCount = correctCount + wrongCount;
  const accuracy = answeredCount === 0 ? 0 : round2((correctCount / answeredCount) * 100);
  const percentage = round2((score / totalMarks) * 100);
  const timeSpentSeconds = Math.max(0, Math.round((input.submittedAtMillis - input.startedAtMillis) / 1000));
  return {
    score,
    clientCalculatedScore: score,
    totalMarks,
    negativeDeduction,
    negativeMarkingUsed: input.negativeMarking,
    markingSchemeVersion: `general-mock-v1:neg-${input.negativeMarking}`,
    correctCount,
    wrongCount,
    unansweredCount,
    accuracy,
    percentage,
    timeSpentSeconds,
    answers,
    wrongQuestionIds,
    weakTopics: weakTopicsFromAttemptAnswers(answers),
  };
}

/* ------------------------------------------------------------------ */
/* Analytics — reuses the jobAnalysis patterns over the scored    */
/* answers: per-subject breakdown + time, per-topic accuracy +    */
/* action badges, weak areas. Pure.                               */
/* ------------------------------------------------------------------ */

export interface GeneralMockWeakArea {
  topicId: string;
  label: string;
  labelEn: string;
  wrong: number;
  total: number;
  accuracy: number;
  badge: TopicActionBadge | null;
}

export interface GeneralMockAnalytics {
  perSubject: SubjectTimeStat[];
  perTopic: TopicStat[];
  weakAreas: GeneralMockWeakArea[];
  weakTopics: JobWeakTopic[];
  /** Average seconds per question (attempt's own average). */
  avgTimeSeconds: number;
  accuracy: number;
  percentage: number;
}

export function analyseGeneralMockResult(result: JobAttemptResult): GeneralMockAnalytics {
  const perSubject = perSubjectTime(result.answers);
  const perTopic = perTopicAccuracy(result.answers);
  const total = result.answers.length;
  const totalTime = result.answers.reduce((s, a) => s + (a.timeSpentSeconds ?? 0), 0);
  const weakAreas: GeneralMockWeakArea[] = perTopic
    .filter((t) => t.wrong > 0)
    .map((t) => ({
      topicId: t.topicId,
      label: t.label,
      labelEn: t.labelEn,
      wrong: t.wrong,
      total: t.total,
      accuracy: t.accuracy,
      badge: topicActionBadge(t),
    }));
  return {
    perSubject,
    perTopic,
    weakAreas,
    weakTopics: result.weakTopics,
    avgTimeSeconds: total > 0 ? round2(totalTime / total) : 0,
    accuracy: result.accuracy,
    percentage: result.percentage,
  };
}
