/**
 * Eduvelto Job Preparation — Central Bank quality measurement
 * (design-central-bank.md §7 + §6.3 analytics).
 *
 * Pure aggregations over arrays — NO Firestore in this file.
 * Quality is MEASURED, not asserted: counts, coverage and
 * difficulty distribution live in precomputed aggregate docs
 * (`jobQuestionBankStats` / `jobBankCoverage`); the dashboard NEVER
 * queries the bank. Rule (§7.2): 500 verified, well-distributed
 * questions beat 2,000 poorly categorised ones — no batch counts
 * toward a mock total unless its questions are verified + mapped +
 * distributed per the matrix.
 */

import type { CentralBankQuestion } from './jobCentralBank';
import type { JobExamSelectionRule } from './jobBankSelection';
import type { HistoricalQuestion } from './jobHistory';

/* ------------------------------------------------------------------ */
/* jobQuestionBankStats (§7.1)                                         */
/* ------------------------------------------------------------------ */

export interface BankStatsByExam {
  verified: number;
  reviewed: number;
  draft: number;
}

export interface JobQuestionBankStats {
  total: number;
  verified: number;
  reviewed: number;
  draft: number;
  active: number;
  inactive: number;
  perExam: Record<string, BankStatsByExam>;
  perSubject: Record<string, { total: number; verified: number }>;
  perTopic: Record<string, { total: number; verified: number }>;
  difficulty: { easy: number; medium: number; hard: number };
  difficultyBySubject: Record<string, { easy: number; medium: number; hard: number }>;
  /** Questions mapped to ≥2 exams — the reuse proof (§7.1). */
  multiExamCount: number;
  multiExamShare: number;
  disputedCount: number;
  outdatedCount: number;
  aiGeneratedCount: number;
  aiGeneratedVerifiedCount: number;
  previousYearCount: number;
  previousYearWithProofCount: number;
  calculatedAt: string;
  bankVersion: string;
}

function emptyDifficulty(): { easy: number; medium: number; hard: number } {
  return { easy: 0, medium: 0, hard: 0 };
}

/** Compute every §7.1 metric from a question array. */
export function computeBankStats(
  questions: CentralBankQuestion[],
  opts?: { calculatedAt?: string; bankVersion?: string },
): JobQuestionBankStats {
  const stats: JobQuestionBankStats = {
    total: questions.length,
    verified: 0,
    reviewed: 0,
    draft: 0,
    active: 0,
    inactive: 0,
    perExam: {},
    perSubject: {},
    perTopic: {},
    difficulty: emptyDifficulty(),
    difficultyBySubject: {},
    multiExamCount: 0,
    multiExamShare: 0,
    disputedCount: 0,
    outdatedCount: 0,
    aiGeneratedCount: 0,
    aiGeneratedVerifiedCount: 0,
    previousYearCount: 0,
    previousYearWithProofCount: 0,
    calculatedAt: opts?.calculatedAt ?? new Date().toISOString(),
    bankVersion: opts?.bankVersion ?? '2026-11-24.1',
  };
  for (const q of questions) {
    if (q.verificationStatus === 'verified') stats.verified += 1;
    else if (q.verificationStatus === 'reviewed') stats.reviewed += 1;
    else stats.draft += 1;
    if (q.isActive) stats.active += 1;
    else stats.inactive += 1;
    for (const exam of q.examMappings) {
      const row = stats.perExam[exam] ?? { verified: 0, reviewed: 0, draft: 0 };
      if (q.verificationStatus === 'verified') row.verified += 1;
      else if (q.verificationStatus === 'reviewed') row.reviewed += 1;
      else row.draft += 1;
      stats.perExam[exam] = row;
    }
    const subj = stats.perSubject[q.subjectId] ?? { total: 0, verified: 0 };
    subj.total += 1;
    if (q.verificationStatus === 'verified') subj.verified += 1;
    stats.perSubject[q.subjectId] = subj;
    const topic = stats.perTopic[q.topicId] ?? { total: 0, verified: 0 };
    topic.total += 1;
    if (q.verificationStatus === 'verified') topic.verified += 1;
    stats.perTopic[q.topicId] = topic;
    stats.difficulty[q.difficulty] += 1;
    const diffSubj = stats.difficultyBySubject[q.subjectId] ?? emptyDifficulty();
    diffSubj[q.difficulty] += 1;
    stats.difficultyBySubject[q.subjectId] = diffSubj;
    if (q.examMappings.length >= 2) stats.multiExamCount += 1;
    if (q.tags.includes('disputed')) stats.disputedCount += 1;
    if (!q.isActive) stats.outdatedCount += 1;
    if (q.origin === 'ai-generated-practice') {
      stats.aiGeneratedCount += 1;
      if (q.verificationStatus === 'verified') stats.aiGeneratedVerifiedCount += 1;
    }
    if (q.origin === 'verified-previous') {
      stats.previousYearCount += 1;
      if (q.source.url) stats.previousYearWithProofCount += 1;
    }
  }
  stats.multiExamShare =
    stats.total > 0 ? Math.round((stats.multiExamCount / stats.total) * 1000) / 10 : 0;
  return stats;
}

/* ------------------------------------------------------------------ */
/* jobBankCoverage (§7.2)                                              */
/* ------------------------------------------------------------------ */

export interface JobBankCoverageRow {
  examId: string;
  subjectId: string;
  /** Target questions from the verified pattern. */
  target: number;
  verified: number;
  reviewed: number;
  draft: number;
  /** Topics with ≥1 verified question / topics in the verified
   * list. null when the subject has NO verified topic list yet
   * (coverage is undefined, not 0 — never manufacture it). */
  coveragePct: number | null;
  missingTopics: string[];
  /** Topics with only 1–2 verified questions ("covered, thin"). */
  thinTopics: string[];
  hasVerifiedTopicList: boolean;
  lastCalculated: string;
}

/**
 * Coverage matrix rows for one exam: one row per subject in the
 * selection rules. `verifiedTopics` maps canonical subject → the
 * verified topic list for that subject (English: the 13 topics;
 * every other subject: absent until a verified list exists).
 * Coverage % AND depth are shown together — a topic with 1
 * question is "covered, thin", never just "covered".
 */
export function computeCoverage(
  questions: CentralBankQuestion[],
  rules: JobExamSelectionRule,
  verifiedTopics: Record<string, string[]>,
  opts?: { lastCalculated?: string },
): JobBankCoverageRow[] {
  const lastCalculated = opts?.lastCalculated ?? new Date().toISOString();
  return rules.subjectWeights.map((w) => {
    const inScope = questions.filter(
      (q) => q.subjectId === w.subjectId && q.examMappings.includes(rules.examId),
    );
    const verified = inScope.filter((q) => q.verificationStatus === 'verified');
    const reviewed = inScope.filter((q) => q.verificationStatus === 'reviewed');
    const draft = inScope.filter((q) => q.verificationStatus === 'draft');
    const topics = verifiedTopics[w.subjectId];
    const hasVerifiedTopicList = Array.isArray(topics);
    const perTopicVerified = new Map<string, number>();
    for (const q of verified) {
      perTopicVerified.set(q.topicId, (perTopicVerified.get(q.topicId) ?? 0) + 1);
    }
    const missingTopics: string[] = [];
    const thinTopics: string[] = [];
    let coveragePct: number | null = null;
    if (hasVerifiedTopicList) {
      let covered = 0;
      for (const topicId of topics as string[]) {
        const n = perTopicVerified.get(topicId) ?? 0;
        if (n === 0) missingTopics.push(topicId);
        else {
          covered += 1;
          if (n <= 2) thinTopics.push(topicId);
        }
      }
      coveragePct =
        (topics as string[]).length > 0
          ? Math.round((covered / (topics as string[]).length) * 1000) / 10
          : null;
    }
    return {
      examId: rules.examId,
      subjectId: w.subjectId,
      target: w.questions,
      verified: verified.length,
      reviewed: reviewed.length,
      draft: draft.length,
      coveragePct,
      missingTopics,
      thinTopics,
      hasVerifiedTopicList,
      lastCalculated,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Previous-question analytics (§6.3) — priority, NOT probability     */
/* ------------------------------------------------------------------ */

export type AnalyticsEvidenceLevel = 'A' | 'B' | 'C';

export interface TopicAnalyticsResult {
  examId: string;
  subjectId: string;
  topicId: string;
  /** Total occurrence frequency Ft (verified occurrences). */
  totalOccurrences: number;
  /** Year coverage Rt: years appeared / years with verified papers × 100. */
  yearCoverage: number;
  verifiedPaperCount: number;
  yearsCovered: number;
  /** Normalised 0–100 component scores (see computeTopicAnalytics). */
  frequencyScore: number;
  recurrenceScore: number;
  syllabusScore: number;
  currentRelevanceScore: number;
  /** Preparation Priority Score P = 0.35F + 0.25R + 0.25S + 0.15C.
   * A PRIORITY, not a probability: 88/100 does NOT mean an 88%
   * chance of appearing. Never shown as one. */
  preparationPriority: number;
  evidenceLevel: AnalyticsEvidenceLevel;
  /** The disclaimer that must accompany any display of this score. */
  disclaimer: string;
  calculatedAt: string;
  analyticsVersion: string;
}

export const TOPIC_ANALYTICS_DISCLAIMER =
  'আগের প্রশ্ন ও বর্তমান সিলেবাস থেকে নির্ধারিত প্রস্তুতির অগ্রাধিকার — নিশ্চয়তা বা সঠিক সম্ভাবনা নয়।';

/** Evidence level (§6.3): A Strong = multiple verified years +
 * sufficient coverage; B Limited = few verified papers / incomplete
 * coverage; C None = no verified data (no rankings, no
 * probabilities — build practice from the verified syllabus). */
export function evidenceLevelFor(args: {
  verifiedPaperCount: number;
  yearsCovered: number;
}): AnalyticsEvidenceLevel {
  if (args.verifiedPaperCount >= 3 && args.yearsCovered >= 3) return 'A';
  if (args.verifiedPaperCount >= 1) return 'B';
  return 'C';
}

/**
 * Compute one topic's analytics from its VERIFIED historical
 * records only (Partially verified records are shown separately
 * and never influence the scores; Unverified records are not
 * shown at all — §6.3).
 *
 * Component normalisation (illustrative — the design's formula is
 * illustrative and its weights are validated against historical
 * data before freezing):
 * - F: occurrences per verified paper × 100, capped at 100.
 * - R: year coverage Rt directly (0–100).
 * - S: syllabus importance 0–100, supplied by the caller (e.g.
 *   the topic's marks share of its subject).
 * - C: current-pattern relevance 0–100, supplied by the caller
 *   (100 = in the current syllabus, 0 = dropped).
 */
export function computeTopicAnalytics(args: {
  examId: string;
  subjectId: string;
  topicId: string;
  /** Verified historical records for this topic (already filtered
   * to verificationStatus 'Verified'). */
  verifiedRecords: HistoricalQuestion[];
  /** Years with verified papers for this exam (denominator of Rt). */
  verifiedPaperCount: number;
  syllabusScore: number;
  currentRelevanceScore: number;
  calculatedAt?: string;
  analyticsVersion?: string;
}): TopicAnalyticsResult {
  const totalOccurrences = args.verifiedRecords.length;
  const years = new Set(args.verifiedRecords.map((r) => r.examYear));
  const yearsCovered = years.size;
  const yearCoverage =
    args.verifiedPaperCount > 0
      ? Math.round((yearsCovered / args.verifiedPaperCount) * 1000) / 10
      : 0;
  const frequencyScore =
    args.verifiedPaperCount > 0
      ? Math.min(100, Math.round((totalOccurrences / args.verifiedPaperCount) * 1000) / 10)
      : 0;
  const recurrenceScore = yearCoverage;
  const syllabusScore = Math.max(0, Math.min(100, args.syllabusScore));
  const currentRelevanceScore = Math.max(0, Math.min(100, args.currentRelevanceScore));
  const preparationPriority =
    Math.round(
      (0.35 * frequencyScore +
        0.25 * recurrenceScore +
        0.25 * syllabusScore +
        0.15 * currentRelevanceScore) *
        10,
    ) / 10;
  return {
    examId: args.examId,
    subjectId: args.subjectId,
    topicId: args.topicId,
    totalOccurrences,
    yearCoverage,
    verifiedPaperCount: args.verifiedPaperCount,
    yearsCovered,
    frequencyScore,
    recurrenceScore,
    syllabusScore,
    currentRelevanceScore,
    preparationPriority,
    evidenceLevel: evidenceLevelFor({
      verifiedPaperCount: args.verifiedPaperCount,
      yearsCovered,
    }),
    disclaimer: TOPIC_ANALYTICS_DISCLAIMER,
    calculatedAt: args.calculatedAt ?? new Date().toISOString(),
    analyticsVersion: args.analyticsVersion ?? '2026-11-24.1',
  };
}
