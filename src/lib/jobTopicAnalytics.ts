/**
 * Eduvelto Job Preparation — topic analytics + probable-question
 * model tests (design-grades-written-previous-admin.md §4).
 *
 * REUSE (R-11/R-12): the Ft/Rt/P computation lives in
 * jobBankStats.ts (computeTopicAnalytics) — this file does NOT
 * build a second engine. It adds the configurable thresholds, the
 * model-test composition, the provenance tags, the Level C
 * syllabus-only path (E-6), and the exact UI wording (§4.6).
 *
 * The three concepts are kept apart (§4.1): previous-question
 * analysis / high-priority topics / probable-question model test.
 * A Preparation Priority Score P is a PRIORITY, never a
 * probability: 88/100 does NOT mean an 88% chance. No numerical
 * appearance probabilities exist in the initial release.
 */

import { computeTopicAnalytics, evidenceLevelFor, type TopicAnalyticsResult } from './jobBankStats';
import type { HistoricalQuestion } from './jobHistory';

export type { TopicAnalyticsResult };

/** P-weights (illustrative initial values, §4.3 — configurable,
 * validated against historical data once verified years exist). */
export const PRIORITY_WEIGHTS = {
  frequency: 0.35,
  recurrence: 0.25,
  syllabus: 0.25,
  currentPattern: 0.15,
  version: '2026-11-24.1',
} as const;

/** Evidence-level thresholds (§4.5 — configurable fold-in points).
 * A = multiple verified years + sufficient topic coverage;
 * B = few verified papers / incomplete coverage; C = no verified
 * historical data. The values below are the initial design choice;
 * they are re-set without a schema change once verified years exist. */
export const EVIDENCE_THRESHOLDS = {
  /** Verified papers needed for Level A. */
  levelAMinVerifiedPapers: 3,
  /** Distinct years covered needed for Level A. */
  levelAMinYearsCovered: 3,
  /** Verified papers needed for Level B (below this is Level C). */
  levelBMinVerifiedPapers: 1,
} as const;

export function evidenceLevelForCounts(args: {
  verifiedPaperCount: number;
  yearsCovered: number;
}): 'A' | 'B' | 'C' {
  if (
    args.verifiedPaperCount >= EVIDENCE_THRESHOLDS.levelAMinVerifiedPapers &&
    args.yearsCovered >= EVIDENCE_THRESHOLDS.levelAMinYearsCovered
  ) {
    return 'A';
  }
  if (args.verifiedPaperCount >= EVIDENCE_THRESHOLDS.levelBMinVerifiedPapers) return 'B';
  return 'C';
}

/** Re-export of the shared classifier (same thresholds). */
export { evidenceLevelFor };

/** Level C syllabus-only priority (§4.5, E-6): with 0 verified
 * historical data, F and R are 0 / not shown — never imputed. The
 * priority comes from teacher-set S + C only, and the page is
 * labelled as syllabus-based. */
export function computeLevelCPriority(args: {
  examId: string;
  subjectId: string;
  topicId: string;
  syllabusScore: number;
  currentRelevanceScore: number;
  calculatedAt?: string;
  analyticsVersion?: string;
}): TopicAnalyticsResult {
  return computeTopicAnalytics({
    examId: args.examId,
    subjectId: args.subjectId,
    topicId: args.topicId,
    verifiedRecords: [] as HistoricalQuestion[],
    verifiedPaperCount: 0,
    syllabusScore: args.syllabusScore,
    currentRelevanceScore: args.currentRelevanceScore,
    calculatedAt: args.calculatedAt,
    analyticsVersion: args.analyticsVersion,
  });
}

/** Format a priority score — NEVER with a "%" sign, never as a
 * probability (§4.3). */
export function formatPriorityScore(priority: number, lang: 'bn' | 'en'): string {
  const n = Math.round(priority);
  return lang === 'bn' ? `অগ্রাধিকার ${n}/১০০` : `Priority ${n}/100`;
}

export const PRIORITY_NOT_PROBABILITY = {
  bn: 'এই স্কোর একটি প্রস্তুতির অগ্রাধিকার — পরীক্ষায় আসার সম্ভাবনা নয়।',
  en: 'This score is a preparation priority — not a probability of appearing.',
} as const;

export const LEVEL_C_LABEL = {
  bn: 'সিলেবাস-ভিত্তিক অগ্রাধিকার — বিগত প্রশ্নের তথ্য এখনো নেই',
  en: 'Syllabus-based priority — no previous-question data yet',
} as const;

export const ANALYSIS_NOTICE = {
  bn: 'এই অগ্রাধিকার বিগত প্রশ্ন ও বর্তমান সিলেবাস থেকে নির্ধারণ করা হয়েছে। এটি সম্ভাব্য অনুশীলনের বিষয় — কোনো গ্যারান্টি বা সঠিক সম্ভাবনা নয়। প্রশ্নপত্র বদলাতে পারে।',
  en: 'These priorities were set from previous questions and the current syllabus. They are probable practice topics — not a guarantee or an exact probability. Papers can change.',
} as const;

export const MODEL_TEST_DISCLAIMER = {
  bn: 'এটি একটি অনুশীলন পরীক্ষা — আসল প্রশ্নপত্রের পূর্বাভাস নয়।',
  en: 'This is a practice test — not a prediction of the actual paper.',
} as const;

/** Evidence label for a topic card (§4.6). */
export function evidenceLabelFor(level: 'A' | 'B' | 'C', lang: 'bn' | 'en'): string {
  if (level === 'A') return lang === 'bn' ? 'প্রমাণের মান: শক্তিশালী' : 'Evidence: strong';
  if (level === 'B') return lang === 'bn' ? 'প্রমাণের মান: সীমিত' : 'Evidence: limited';
  return lang === 'bn' ? 'প্রমাণের মান: নেই' : 'Evidence: none';
}

function bnNum(n: number): string {
  return String(n)
    .split('')
    .map((d) => '০১২৩৪৫৬৭৮৯'[Number(d)] ?? d)
    .join('');
}

/** Topic-card line (§4.6, exact wording). */
export function topicCardLine(
  args: { totalOccurrences: number; verifiedPaperCount: number; yearsCovered: number },
  lang: 'bn' | 'en',
): string {
  return lang === 'bn'
    ? `যাচাইকৃত উপস্থিতি: ${bnNum(args.totalOccurrences)} বার, ${bnNum(args.verifiedPaperCount)} বছরের ${bnNum(args.yearsCovered)} বছরে`
    : `Verified occurrences: ${args.totalOccurrences} times, in ${args.yearsCovered} of ${args.verifiedPaperCount} years`;
}

/* ------------------------------------------------------------------ */
/* Probable-question model tests (§4.4)                                */
/* ------------------------------------------------------------------ */

export type ModelTestKind = 'previous-practice' | 'priority-practice' | 'probable-pattern';

export const MODEL_TEST_KINDS: ModelTestKind[] = [
  'previous-practice',
  'priority-practice',
  'probable-pattern',
];

export const MODEL_TEST_KIND_LABEL: Record<ModelTestKind, { bn: string; en: string; descBn: string; descEn: string }> = {
  'previous-practice': {
    bn: 'বিগত প্রশ্নের অনুশীলন',
    en: 'Previous-question practice',
    descBn: 'যা আসলে এসেছে — প্রতিটি প্রশ্নে পরীক্ষা ও বছর লেখা থাকে। শুধু যাচাইকৃত বিগত প্রশ্ন দিয়ে তৈরি।',
    descEn: 'Questions that actually appeared — each shows its exam and year. Built only from verified previous questions.',
  },
  'priority-practice': {
    bn: 'গুরুত্বপূর্ণ টপিকের অনুশীলন',
    en: 'High-priority topic practice',
    descBn: 'যে টপিকগুলো বেশি গুরুত্ব দিয়ে পড়তে হবে — আগে আসা প্রশ্ন ও নতুন প্রশ্ন মিলিয়ে।',
    descEn: 'Topics deserving more preparation — previously-asked and new questions mixed.',
  },
  'probable-pattern': {
    bn: 'ধারা-ভিত্তিক মডেল টেস্ট',
    en: 'Trend-based model test',
    descBn: 'পরীক্ষার সিলেবাস, নম্বর ও বিগত ধারা অনুযায়ী পূর্ণাঙ্গ অনুশীলন পরীক্ষা — আসল প্রশ্নপত্রের পূর্বাভাস নয়।',
    descEn: 'A full-length practice test following the exam’s syllabus, marks and historical patterns — not a prediction of the actual paper.',
  },
};

/** Provenance tag on every question in a model test (§4.4). */
export type QuestionProvenance = 'previously-asked' | 'new-about-tested-topic' | 'syllabus-gap';

export const QUESTION_PROVENANCE_LABEL: Record<QuestionProvenance, { bn: string; en: string }> = {
  'previously-asked': { bn: 'আগে আসা প্রশ্ন', en: 'Previously asked' },
  'new-about-tested-topic': { bn: 'পরীক্ষিত টপিকের নতুন প্রশ্ন', en: 'New question about a tested topic' },
  'syllabus-gap': { bn: 'সিলেবাসের ঘাটতি পূরণের প্রশ্ন', en: 'Syllabus-gap question' },
};

/**
 * Anti-overfitting composition (§4.4 — illustrative settings, not
 * statistical predictions): frequent topics 40%, moderate 30%,
 * other syllabus-important 20%, new/underrepresented 10%.
 */
export const MODEL_TEST_COMPOSITION = {
  frequent: 0.4,
  moderate: 0.3,
  syllabusImportant: 0.2,
  newUnderrepresented: 0.1,
} as const;

/** Split a question count by the composition (largest-remainder
 * rounding; the parts always sum to the total). */
export function compositionCounts(total: number): {
  frequent: number;
  moderate: number;
  syllabusImportant: number;
  newUnderrepresented: number;
} {
  const raw = {
    frequent: total * MODEL_TEST_COMPOSITION.frequent,
    moderate: total * MODEL_TEST_COMPOSITION.moderate,
    syllabusImportant: total * MODEL_TEST_COMPOSITION.syllabusImportant,
    newUnderrepresented: total * MODEL_TEST_COMPOSITION.newUnderrepresented,
  };
  const base = {
    frequent: Math.floor(raw.frequent),
    moderate: Math.floor(raw.moderate),
    syllabusImportant: Math.floor(raw.syllabusImportant),
    newUnderrepresented: Math.floor(raw.newUnderrepresented),
  };
  let remaining = total - (base.frequent + base.moderate + base.syllabusImportant + base.newUnderrepresented);
  const order = (Object.keys(raw) as Array<keyof typeof raw>).sort(
    (a, b) => raw[b] - Math.floor(raw[b]) - (raw[a] - Math.floor(raw[a])),
  );
  let i = 0;
  while (remaining > 0) {
    base[order[i % order.length]]++;
    remaining--;
    i++;
  }
  return base;
}

/** A model-test title must contain the practice wording (§4.4) —
 * never a prediction title. */
export function isHonestModelTestTitle(titleBn: string, titleEn: string): boolean {
  const banned = [/90%\s*common/i, /guaranteed/i, /নিশ্চিত.*কমন/i, /probable questions/i];
  if (banned.some((re) => re.test(titleBn) || re.test(titleEn))) return false;
  return (
    /অনুশীলন|মডেল টেস্ট/.test(titleBn) &&
    /practice|model test/i.test(titleEn)
  );
}
