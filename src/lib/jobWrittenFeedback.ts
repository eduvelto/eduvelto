/**
 * Eduvelto Job Preparation — written AI feedback, Phase 2 stub
 * (design-grades-written-previous-admin.md §2.8).
 *
 * SHIPS DISABLED. `askWrittenFeedback()` returns 'not-configured'
 * until ALL preconditions pass: the Worker URL is configured at
 * build time (VITE_AI_PROXY_URL) AND verified live, rate limits /
 * submission-size limits / abuse protection / data-retention are in
 * place, the per-item-confidence rendering is built, the
 * prohibited-strings content test passes, and a teacher-reviewed
 * rubric exists for at least the English templates. Until then the
 * self-check rubric (§2.5) is the only feedback that ships.
 *
 * No client-side key, ever: the key stays a Worker secret. The
 * Worker request carries only the answer text + question + rubric —
 * never name, email, UID or location (same privacy rule as
 * aiProviders.ts). No submission text is ever sent without the
 * student's explicit per-submission consent tap.
 */

import { askAssistant, getProviderStatus, type AskResult } from './aiProviders';
import { containsProhibitedClaim } from './jobWritten';
import type { RubricDimension, WrittenAnswerType } from './jobWritten';

export type FeedbackConfidence = 'high' | 'medium' | 'depends-on-source' | 'subjective' | 'not-provided';

export interface WrittenFeedbackCriterion {
  dimension: RubricDimension;
  score: number | null;
  max: number;
  comment: string;
  confidence: FeedbackConfidence;
}

export interface WrittenFeedback {
  feedbackId: string;
  submissionId: string;
  questionId: string;
  rubricVersion: string;
  evaluationType: 'self' | 'teacher' | 'ai';
  criteria: WrittenFeedbackCriterion[];
  corrections: Array<{ original: string; improved: string; note: string }>;
  strengths: string[];
  improvements: string[];
  factualWarnings: string[];
  /** Includes the next practice step. Never just a number (§2.6). */
  overallFeedback: string;
}

export const AI_FEEDBACK_LABEL = {
  bn: 'AI সহায়ক মূল্যায়ন (Practice Feedback)',
  en: 'AI-assisted evaluation (Practice Feedback)',
} as const;

export const AI_FEEDBACK_NOTICE = {
  bn: 'এই মূল্যায়ন AI-এর তৈরি, শুধু অনুশীলনের জন্য। এটি কোনো সরকারি পরীক্ষকের মূল্যায়ন বা চূড়ান্ত নম্বর নয়। AI তথ্য, ব্যাকরণ বা নম্বর সম্পর্কে ভুল করতে পারে।',
  en: 'This evaluation was made by AI, for practice only. It is not a government examiner’s evaluation or final marks. AI can be wrong about facts, grammar or marks.',
} as const;

/** Per-item confidence — never one overall AI confidence percentage (§2.6). */
export const FEEDBACK_CONFIDENCE_LABEL: Record<FeedbackConfidence, { bn: string; en: string }> = {
  high: { bn: 'উচ্চ', en: 'High' },
  medium: { bn: 'মাঝারি', en: 'Medium' },
  'depends-on-source': { bn: 'উৎস যাচাই সাপেক্ষ', en: 'Depends on source verification' },
  subjective: { bn: 'ব্যক্তিগত মত', en: 'Subjective' },
  'not-provided': { bn: 'দেওয়া হয়নি', en: 'Not provided' },
};

/** The 6 AI check categories (§2.6). */
export const AI_FEEDBACK_CHECK_CATEGORIES = [
  'spelling',
  'grammar',
  'facts',
  'relevance',
  'presentation',
  'structure',
] as const;

export type AiFeedbackResult =
  | { kind: 'ai'; feedback: WrittenFeedback }
  | { kind: 'not-configured' }
  | { kind: 'quota-exhausted' }
  | { kind: 'error'; messageBn: string; messageEn: string };

/** Max submission size sent to the Worker (same 2000-char discipline as chat). */
export const WRITTEN_FEEDBACK_MAX_CHARS = 2000;

export interface WrittenFeedbackRequest {
  questionId: string;
  answerType: WrittenAnswerType;
  questionTextBn: string;
  questionTextEn: string | null;
  answerText: string;
  rubricVersion: string;
  lang?: 'bn' | 'en';
  /** Test seam: unit tests pass a proxy URL here. Production never sets it. */
  proxyUrl?: string;
  /** Test seam: unit tests pass a stub fetch. Production passes none. */
  fetchImpl?: typeof fetch;
  /** The student's explicit per-submission consent tap (§2.7). */
  consented: boolean;
}

/**
 * Build the feedback prompt sent through askAssistant() (mode
 * 'written-feedback' on the Worker, Phase 5 step 18). The prompt
 * carries the rubric, the 6 check categories, the 4-way fact
 * distinction, the prohibited claims and per-item confidence — and
 * NOTHING personal.
 */
export function buildWrittenFeedbackPrompt(req: WrittenFeedbackRequest): string {
  const question = req.questionTextEn ?? req.questionTextBn;
  return [
    'You are giving practice feedback on a student’s written answer. This is practice only — never an official examiner’s evaluation or final marks.',
    `Question (${req.answerType}): ${question}`,
    `Student answer: ${req.answerText.slice(0, WRITTEN_FEEDBACK_MAX_CHARS)}`,
    'Check, in this order: relevance to the question, spelling, grammar, facts, presentation, structure.',
    'Facts — use exactly one of: verified-incorrect / appears-incorrect / could-not-verify / opinion-or-interpretation. Never mark a historical date wrong without reliable reference material. "Could-not-verify" is a legitimate, common outcome.',
    'Bangla variation: acceptable usage variations are not errors. Only clear errors are flagged; stylistic alternatives are noted as alternatives, never as mistakes.',
    'Different-but-correct arguments or examples are never penalised.',
    'Give: strengths (quoted from the answer), at most 3 areas to improve ordered by impact, correction examples (student sentence vs improved version), and one concrete next practice step. Never just a number.',
    'Give a confidence per feedback item (high / medium / depends-on-source / subjective / not-provided). Never one overall confidence percentage. Never give predicted examiner marks.',
  ].join('\n');
}

/**
 * Validate a feedback payload before it is shown. Returns problem
 * strings; empty = valid. A bare score is never shown alone: a
 * feedback without strengths + improvements + a next step is
 * invalid (§2.6).
 */
export function validateWrittenFeedback(feedback: WrittenFeedback): string[] {
  const problems: string[] = [];
  const label = `writtenFeedback/${feedback.feedbackId}`;
  if (feedback.evaluationType === 'ai') {
    // The AI card must never carry a prohibited claim.
    const copy = [
      feedback.overallFeedback,
      ...feedback.strengths,
      ...feedback.improvements,
      ...feedback.factualWarnings,
      ...feedback.corrections.map((c) => `${c.original} ${c.improved} ${c.note}`),
      ...feedback.criteria.map((c) => c.comment),
    ].join('\n');
    const hit = containsProhibitedClaim(copy);
    if (hit !== null) problems.push(`${label}: prohibited claim in AI feedback: '${hit}'`);
  }
  if (feedback.strengths.length === 0) {
    problems.push(`${label}: feedback must include strengths (never just a number)`);
  }
  if (feedback.improvements.length === 0) {
    problems.push(`${label}: feedback must include areas to improve`);
  }
  if (feedback.improvements.length > 3) {
    problems.push(`${label}: at most 3 areas to improve, ordered by impact`);
  }
  if (!feedback.overallFeedback.includes('পরের') && !feedback.overallFeedback.toLowerCase().includes('next')) {
    problems.push(`${label}: overall feedback must include the next practice step`);
  }
  for (const c of feedback.criteria) {
    if (c.score !== null && (c.score < 0 || c.score > c.max)) {
      problems.push(`${label}: criterion ${c.dimension} score out of range`);
    }
  }
  return problems;
}

/**
 * Ask for AI feedback on one written submission.
 *
 * STUB (Phase 2 — Later): returns 'not-configured' until the
 * §2.8 preconditions pass. The Worker prompt mode (step 18) is
 * implemented server-side, but this caller stays disabled here so
 * no unverified evaluator ever faces a student. Enabling is step
 * 19, gated on a live Worker verification.
 */
export async function askWrittenFeedback(req: WrittenFeedbackRequest): Promise<AiFeedbackResult> {
  if (!req.consented) {
    return {
      kind: 'error',
      messageBn: 'AI মূল্যায়নের জন্য আপনার সম্মতি দরকার — সম্মতি দিলে তবেই উত্তরটি পাঠানো হবে।',
      messageEn: 'Your consent is needed for AI evaluation — the answer is sent only after you consent.',
    };
  }
  if (getProviderStatus() === 'not-configured' && !req.proxyUrl) {
    return { kind: 'not-configured' };
  }
  const prompt = buildWrittenFeedbackPrompt(req);
  const result: AskResult = await askAssistant(
    [{ role: 'user', text: prompt }],
    { lang: req.lang ?? 'bn', proxyUrl: req.proxyUrl, fetchImpl: req.fetchImpl },
  );
  if (result.kind === 'not-configured') return { kind: 'not-configured' };
  if (result.kind === 'quota-exhausted') return { kind: 'quota-exhausted' };
  if (result.kind === 'error') return { kind: 'error', messageBn: result.messageBn, messageEn: result.messageEn };
  // The Worker returns free text in Phase 2; parsing it into the
  // structured WrittenFeedback shape is step 19 work, gated on the
  // live verification. Until then, never present raw model text as
  // structured feedback.
  return {
    kind: 'error',
    messageBn: 'AI মূল্যায়ন এখনো চালু হয়নি — স্ব-যাচাই তালিকাটি ব্যবহার করুন।',
    messageEn: 'AI evaluation is not on yet — use the self-check list.',
  };
}
