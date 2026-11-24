/**
 * Eduvelto Job Preparation — syllabus coverage matrix unit tests
 * (design-grades-written-previous-admin.md §7 step 16).
 */
import { describe, it, expect } from 'vitest';
import {
  COMMON_TOPIC_QUESTION_TARGET,
  buildCoverageCell,
  coverageGaps,
  coveragePctFor,
  subjectCoverageSummary,
  buildAdminResultsAggregate,
} from '../jobCoverage';

describe('coverage cells (§5.2)', () => {
  it('default target is 50 per common topic', () => {
    expect(COMMON_TOPIC_QUESTION_TARGET).toBe(50);
  });

  it('coveragePct is verified/target, capped at 100', () => {
    expect(coveragePctFor(25, 50)).toBe(50);
    expect(coveragePctFor(60, 50)).toBe(100);
    expect(coveragePctFor(0, 50)).toBe(0);
    expect(coveragePctFor(5, 0)).toBeNull();
  });

  it('a cell without a verified topic list has coveragePct null — not 0', () => {
    const cell = buildCoverageCell({
      examId: 'bank',
      subjectId: 'bank__english',
      topicId: 'tense',
      verified: 0,
      hasVerifiedTopicList: false,
    });
    expect(cell.coveragePct).toBeNull();
    expect(cell.needsExpansion).toBe(false);
  });

  it('a thin verified cell is flagged Needs expansion', () => {
    const cell = buildCoverageCell({
      examId: 'bcs',
      subjectId: 'bcs__english',
      topicId: 'tense',
      verified: 10,
      hasVerifiedTopicList: true,
    });
    expect(cell.coveragePct).toBe(20);
    expect(cell.needsExpansion).toBe(true);
    const full = buildCoverageCell({
      examId: 'bcs',
      subjectId: 'bcs__english',
      topicId: 'tense',
      verified: 50,
      hasVerifiedTopicList: true,
    });
    expect(full.needsExpansion).toBe(false);
  });

  it('coverageGaps returns thin cells, thinnest first', () => {
    const cells = [
      buildCoverageCell({ examId: 'bcs', subjectId: 'bcs__english', topicId: 'a', verified: 40, hasVerifiedTopicList: true }),
      buildCoverageCell({ examId: 'bcs', subjectId: 'bcs__english', topicId: 'b', verified: 5, hasVerifiedTopicList: true }),
      buildCoverageCell({ examId: 'bcs', subjectId: 'bcs__english', topicId: 'c', verified: 50, hasVerifiedTopicList: true }),
      buildCoverageCell({ examId: 'bank', subjectId: 'bank__english', topicId: 'd', verified: 0, hasVerifiedTopicList: false }),
    ];
    const gaps = coverageGaps(cells);
    expect(gaps.map((g) => g.topicId)).toEqual(['b', 'a']);
  });

  it('subject rollup sums verified vs target', () => {
    const cells = [
      buildCoverageCell({ examId: 'bcs', subjectId: 'bcs__english', topicId: 'a', verified: 10, hasVerifiedTopicList: true }),
      buildCoverageCell({ examId: 'bcs', subjectId: 'bcs__english', topicId: 'b', verified: 20, hasVerifiedTopicList: true }),
    ];
    const summary = subjectCoverageSummary(cells);
    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({ examId: 'bcs', subjectId: 'bcs__english', topics: 2, verified: 30, target: 100, coveragePct: 30, needsExpansion: true });
  });
});

describe('admin results aggregates (§5.1 #12 — aggregates only)', () => {
  it('computes per-topic cohort accuracy and weak topics', () => {
    const attempts = [
      ...Array.from({ length: 10 }, () => ({ topicId: 'tense', correct: true })),
      ...Array.from({ length: 10 }, () => ({ topicId: 'tense', correct: false })),
      ...Array.from({ length: 6 }, () => ({ topicId: 'voice', correct: false })),
    ];
    const agg = buildAdminResultsAggregate({ examId: 'bcs', attempts });
    expect(agg.attemptCount).toBe(26);
    expect(agg.topicAccuracy.tense).toBe(50);
    expect(agg.topicAccuracy.voice).toBe(0);
    // Weak = accuracy < 50% AND ≥ 5 answered (same threshold as the dashboard).
    expect(agg.weakTopics).toEqual(['voice']);
  });

  it('never carries individual answers or ranks', () => {
    const agg = buildAdminResultsAggregate({ examId: 'bcs', attempts: [] });
    expect(Object.keys(agg).sort()).toEqual(['attemptCount', 'examId', 'topicAccuracy', 'weakTopics']);
    expect(agg.attemptCount).toBe(0);
    expect(agg.weakTopics).toEqual([]);
  });
});
