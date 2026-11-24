/**
 * Eduvelto Job Preparation — topic analytics unit tests
 * (design-grades-written-previous-admin.md §7 steps 11–12).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PRIORITY_WEIGHTS,
  EVIDENCE_THRESHOLDS,
  evidenceLevelForCounts,
  computeLevelCPriority,
  formatPriorityScore,
  PRIORITY_NOT_PROBABILITY,
  LEVEL_C_LABEL,
  ANALYSIS_NOTICE,
  MODEL_TEST_DISCLAIMER,
  evidenceLabelFor,
  topicCardLine,
  MODEL_TEST_KINDS,
  MODEL_TEST_KIND_LABEL,
  QUESTION_PROVENANCE_LABEL,
  MODEL_TEST_COMPOSITION,
  compositionCounts,
  isHonestModelTestTitle,
} from '../jobTopicAnalytics';

describe('priority score (§4.3 — a priority, NEVER a probability)', () => {
  it('weights are the design values and sum to 1', () => {
    expect(PRIORITY_WEIGHTS.frequency).toBe(0.35);
    expect(PRIORITY_WEIGHTS.recurrence).toBe(0.25);
    expect(PRIORITY_WEIGHTS.syllabus).toBe(0.25);
    expect(PRIORITY_WEIGHTS.currentPattern).toBe(0.15);
    const sum =
      PRIORITY_WEIGHTS.frequency +
      PRIORITY_WEIGHTS.recurrence +
      PRIORITY_WEIGHTS.syllabus +
      PRIORITY_WEIGHTS.currentPattern;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('88/100 is never an 88% chance — the label never carries "%"', () => {
    expect(formatPriorityScore(88, 'bn')).toBe('অগ্রাধিকার 88/১০০');
    expect(formatPriorityScore(88, 'en')).toBe('Priority 88/100');
    expect(formatPriorityScore(88, 'bn')).not.toContain('%');
    expect(formatPriorityScore(88, 'en')).not.toContain('%');
    expect(PRIORITY_NOT_PROBABILITY.bn).toContain('সম্ভাবনা নয়');
    expect(PRIORITY_NOT_PROBABILITY.en).toContain('not a probability');
  });

  it('Level C: F and R are 0 / not shown — never imputed (E-6)', () => {
    const r = computeLevelCPriority({
      examId: 'bcs',
      subjectId: 'english',
      topicId: 'tense',
      syllabusScore: 80,
      currentRelevanceScore: 100,
    });
    expect(r.evidenceLevel).toBe('C');
    expect(r.totalOccurrences).toBe(0);
    expect(r.yearCoverage).toBe(0);
    expect(r.frequencyScore).toBe(0);
    expect(r.recurrenceScore).toBe(0);
    // P comes from S + C only: 0.25*80 + 0.15*100 = 35.
    expect(r.preparationPriority).toBe(35);
  });

  it('a dropped-syllabus topic scores 0 on S and C', () => {
    const r = computeLevelCPriority({
      examId: 'bcs',
      subjectId: 'english',
      topicId: 'old-topic',
      syllabusScore: 0,
      currentRelevanceScore: 0,
    });
    expect(r.preparationPriority).toBe(0);
    expect(r.syllabusScore).toBe(0);
    expect(r.currentRelevanceScore).toBe(0);
  });
});

describe('evidence levels (§4.5)', () => {
  it('thresholds are the initial design choice', () => {
    expect(EVIDENCE_THRESHOLDS.levelAMinVerifiedPapers).toBe(3);
    expect(EVIDENCE_THRESHOLDS.levelAMinYearsCovered).toBe(3);
    expect(EVIDENCE_THRESHOLDS.levelBMinVerifiedPapers).toBe(1);
  });

  it('0 verified papers is Level C — every exam starts there', () => {
    expect(evidenceLevelForCounts({ verifiedPaperCount: 0, yearsCovered: 0 })).toBe('C');
    expect(evidenceLevelForCounts({ verifiedPaperCount: 1, yearsCovered: 1 })).toBe('B');
    expect(evidenceLevelForCounts({ verifiedPaperCount: 2, yearsCovered: 2 })).toBe('B');
    expect(evidenceLevelForCounts({ verifiedPaperCount: 3, yearsCovered: 2 })).toBe('B');
    expect(evidenceLevelForCounts({ verifiedPaperCount: 3, yearsCovered: 3 })).toBe('A');
    expect(evidenceLevelForCounts({ verifiedPaperCount: 5, yearsCovered: 4 })).toBe('A');
  });

  it('Level C label is exact', () => {
    expect(LEVEL_C_LABEL.bn).toBe('সিলেবাস-ভিত্তিক অগ্রাধিকার — বিগত প্রশ্নের তথ্য এখনো নেই');
    expect(LEVEL_C_LABEL.en).toBe('Syllabus-based priority — no previous-question data yet');
  });

  it('evidence labels are exact (§4.6)', () => {
    expect(evidenceLabelFor('A', 'bn')).toBe('প্রমাণের মান: শক্তিশালী');
    expect(evidenceLabelFor('B', 'bn')).toBe('প্রমাণের মান: সীমিত');
    expect(evidenceLabelFor('C', 'bn')).toBe('প্রমাণের মান: নেই');
    expect(evidenceLabelFor('A', 'en')).toBe('Evidence: strong');
    expect(evidenceLabelFor('C', 'en')).toBe('Evidence: none');
  });

  it('topic-card line is exact (§4.6)', () => {
    expect(topicCardLine({ totalOccurrences: 12, verifiedPaperCount: 5, yearsCovered: 4 }, 'bn')).toBe(
      'যাচাইকৃত উপস্থিতি: ১২ বার, ৫ বছরের ৪ বছরে',
    );
    expect(topicCardLine({ totalOccurrences: 12, verifiedPaperCount: 5, yearsCovered: 4 }, 'en')).toBe(
      'Verified occurrences: 12 times, in 4 of 5 years',
    );
  });

  it('analysis notice + model-test disclaimer are exact (§4.6)', () => {
    expect(ANALYSIS_NOTICE.bn).toContain('কোনো গ্যারান্টি বা সঠিক সম্ভাবনা নয়');
    expect(ANALYSIS_NOTICE.en).toContain('not a guarantee or an exact probability');
    expect(MODEL_TEST_DISCLAIMER.bn).toBe('এটি একটি অনুশীলন পরীক্ষা — আসল প্রশ্নপত্রের পূর্বাভাস নয়।');
    expect(MODEL_TEST_DISCLAIMER.en).toBe('This is a practice test — not a prediction of the actual paper.');
  });
});

describe('model tests (§4.4 — three types, never mixed)', () => {
  it('has exactly three test types with distinct titles', () => {
    expect(MODEL_TEST_KINDS).toEqual(['previous-practice', 'priority-practice', 'probable-pattern']);
    for (const kind of MODEL_TEST_KINDS) {
      expect(MODEL_TEST_KIND_LABEL[kind].bn.length).toBeGreaterThan(0);
      expect(MODEL_TEST_KIND_LABEL[kind].en.length).toBeGreaterThan(0);
    }
    expect(MODEL_TEST_KIND_LABEL['previous-practice'].descBn).toContain('যাচাইকৃত');
  });

  it('all three provenance tags exist', () => {
    expect(Object.keys(QUESTION_PROVENANCE_LABEL)).toEqual([
      'previously-asked',
      'new-about-tested-topic',
      'syllabus-gap',
    ]);
  });

  it('composition is 40/30/20/10 and counts always sum to the total', () => {
    expect(MODEL_TEST_COMPOSITION).toEqual({
      frequent: 0.4,
      moderate: 0.3,
      syllabusImportant: 0.2,
      newUnderrepresented: 0.1,
    });
    for (const total of [10, 20, 25, 50, 100, 200]) {
      const c = compositionCounts(total);
      expect(c.frequent + c.moderate + c.syllabusImportant + c.newUnderrepresented).toBe(total);
    }
    expect(compositionCounts(100)).toEqual({
      frequent: 40,
      moderate: 30,
      syllabusImportant: 20,
      newUnderrepresented: 10,
    });
    expect(compositionCounts(10)).toEqual({
      frequent: 4,
      moderate: 3,
      syllabusImportant: 2,
      newUnderrepresented: 1,
    });
  });

  it('honest titles pass; prediction titles fail', () => {
    expect(
      isHonestModelTestTitle('বিসিএস প্রিলিমিনারি — গুরুত্বপূর্ণ টপিক অনুশীলন টেস্ট', 'BCS Preliminary — High-Priority Practice Test'),
    ).toBe(true);
    expect(
      isHonestModelTestTitle('প্রাথমিক শিক্ষক — বিগত প্রশ্নের ধারা-ভিত্তিক মডেল টেস্ট', 'Primary Teacher — Historical Trend-Based Model Test'),
    ).toBe(true);
    expect(isHonestModelTestTitle('সম্ভাব্য প্রশ্ন — ৯০% কমন', 'Probable Questions — 90% Common')).toBe(false);
    expect(isHonestModelTestTitle('নিশ্চিত কমন প্রশ্ন', 'Guaranteed Common Questions')).toBe(false);
    expect(isHonestModelTestTitle('বিসিএস প্রশ্ন', 'BCS Questions')).toBe(false); // no practice wording
  });
});

describe('no numerical appearance probabilities anywhere in src/ (§4.6)', () => {
  it('no "% chance" / "% সম্ভাবনা" / "90% common" claim string exists in source', () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const bad: string[] = [];
    const scan = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
          scan(p);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        const src = readFileSync(p, 'utf8');
        const lines = src.split('\n');
        lines.forEach((line, i) => {
          // Test fixtures live in __tests__ (excluded above); a
          // prohibition stated in a comment is not a UI claim.
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
          if (/\d+\s*%\s*(chance|সম্ভাবনা)/i.test(line)) bad.push(`${p}:${i + 1}: ${line.trim()}`);
          if (/90\s*%\s*common/i.test(line)) bad.push(`${p}:${i + 1}: ${line.trim()}`);
          if (/guaranteed common/i.test(line)) bad.push(`${p}:${i + 1}: ${line.trim()}`);
        });
      }
    };
    scan(root);
    expect(bad).toEqual([]);
  });
});
