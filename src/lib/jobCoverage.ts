/**
 * Eduvelto Job Preparation — syllabus coverage matrix
 * (design-grades-written-previous-admin.md §5.2).
 *
 * A matrix of exam / subject / topic / target / verified-count,
 * rendered from real data. Each question carries a
 * `syllabusTopicId`; the matrix shows verified vs target per cell
 * and flags "Needs expansion" where a subject is thin — coverage
 * identifies content gaps so new questions are written where
 * needed, not where the bank is already thick. Targets are
 * admin-set per cell (default: COMMON_TOPIC_QUESTION_TARGET = 50
 * per common topic — a target, never a count). The matrix is also
 * the Level A/B evidence input for §4.5 (topic coverage per exam).
 *
 * Pure lib: no Firestore here. The recompute script
 * (scripts/recompute-job-coverage.mjs) is local + dry-run.
 */

export const COMMON_TOPIC_QUESTION_TARGET = 50;

export interface CoverageCell {
  examId: string;
  subjectId: string;
  topicId: string;
  /** Admin-set target (default COMMON_TOPIC_QUESTION_TARGET). */
  target: number;
  verified: number;
  reviewed: number;
  draft: number;
  coveragePct: number | null;
  /** True when the cell is thin and needs expansion. */
  needsExpansion: boolean;
  /** True when the exam has no verified topic list for this subject. */
  hasVerifiedTopicList: boolean;
}

export interface CoverageMatrix {
  cells: CoverageCell[];
  calculatedAt: string;
  matrixVersion: string;
}

export function coveragePctFor(verified: number, target: number): number | null {
  if (target <= 0) return null;
  return Math.min(100, Math.round((verified / target) * 1000) / 10);
}

/**
 * Build one cell from counts. `hasVerifiedTopicList` false means
 * the subject has no verified topic list — coveragePct is null,
 * NOT 0 (same rule as jobBankStats §7.2).
 */
export function buildCoverageCell(args: {
  examId: string;
  subjectId: string;
  topicId: string;
  target?: number;
  verified: number;
  reviewed?: number;
  draft?: number;
  hasVerifiedTopicList: boolean;
}): CoverageCell {
  const target = args.target ?? COMMON_TOPIC_QUESTION_TARGET;
  const coveragePct = args.hasVerifiedTopicList ? coveragePctFor(args.verified, target) : null;
  return {
    examId: args.examId,
    subjectId: args.subjectId,
    topicId: args.topicId,
    target,
    verified: args.verified,
    reviewed: args.reviewed ?? 0,
    draft: args.draft ?? 0,
    coveragePct,
    needsExpansion:
      args.hasVerifiedTopicList && args.verified < target,
    hasVerifiedTopicList: args.hasVerifiedTopicList,
  };
}

/** Cells that need expansion, thinnest first. */
export function coverageGaps(cells: CoverageCell[]): CoverageCell[] {
  return cells
    .filter((c) => c.needsExpansion)
    .sort((a, b) => (a.coveragePct ?? 0) - (b.coveragePct ?? 0));
}

/** Per-subject rollup: verified vs target across its topics. */
export function subjectCoverageSummary(cells: CoverageCell[]): Array<{
  examId: string;
  subjectId: string;
  topics: number;
  verified: number;
  target: number;
  coveragePct: number | null;
  needsExpansion: boolean;
}> {
  const bySubject = new Map<string, CoverageCell[]>();
  for (const c of cells) {
    const key = `${c.examId}__${c.subjectId}`;
    const list = bySubject.get(key) ?? [];
    list.push(c);
    bySubject.set(key, list);
  }
  return [...bySubject.entries()]
    .map(([key, list]) => {
      const sep = key.indexOf('__');
      const examId = key.slice(0, sep);
      const subjectId = key.slice(sep + 2);
      const verified = list.reduce((a, c) => a + c.verified, 0);
      const target = list.reduce((a, c) => a + c.target, 0);
      const hasList = list.some((c) => c.hasVerifiedTopicList);
      return {
        examId,
        subjectId,
        topics: list.length,
        verified,
        target,
        coveragePct: hasList ? coveragePctFor(verified, target) : null,
        needsExpansion: hasList && verified < target,
      };
    })
    .sort((a, b) => (a.coveragePct ?? 0) - (b.coveragePct ?? 0));
}

/** Admin aggregates for /admin/jobs/results (§5.1 #12) — aggregates
 * ONLY (per-exam attempt counts, per-topic accuracy across the
 * cohort, coverage gaps). Never individual students' answers or
 * rankings. No percentiles, no leaderboards. */
export interface AdminResultsAggregate {
  examId: string;
  attemptCount: number;
  /** Cohort accuracy per topic (0–100), from stored attempts only. */
  topicAccuracy: Record<string, number>;
  /** Topics with cohort accuracy below 50% (weak topics, cohort-wide). */
  weakTopics: string[];
}

export function buildAdminResultsAggregate(args: {
  examId: string;
  attempts: Array<{ topicId: string; correct: boolean }>;
}): AdminResultsAggregate {
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const a of args.attempts) {
    const entry = byTopic.get(a.topicId) ?? { correct: 0, total: 0 };
    entry.total++;
    if (a.correct) entry.correct++;
    byTopic.set(a.topicId, entry);
  }
  const topicAccuracy: Record<string, number> = {};
  const weakTopics: string[] = [];
  for (const [topicId, entry] of byTopic) {
    const pct = Math.round((entry.correct / entry.total) * 1000) / 10;
    topicAccuracy[topicId] = pct;
    if (pct < 50 && entry.total >= 5) weakTopics.push(topicId);
  }
  return {
    examId: args.examId,
    attemptCount: args.attempts.length,
    topicAccuracy,
    weakTopics: weakTopics.sort(),
  };
}
