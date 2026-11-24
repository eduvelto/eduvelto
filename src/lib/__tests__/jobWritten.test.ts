/**
 * Eduvelto Job Preparation — written system unit tests
 * (design-grades-written-previous-admin.md §7 step 6).
 */
import { describe, it, expect } from 'vitest';
import {
  WRITTEN_ANSWER_TYPES,
  WRITTEN_TEMPLATES,
  RUBRIC_DIMENSIONS,
  RUBRIC_WEIGHT_PROFILES,
  WRITTEN_LENGTH_BY_MARKS,
  lengthGuidanceForMarks,
  lengthStatusFor,
  countWords,
  selfCheckChecklist,
  writtenTemplateForKind,
  containsProhibitedClaim,
  MODEL_ANSWER_LABEL,
  MODEL_ANSWER_COPY_WARNING,
  writtenTemplate,
} from '../jobWritten';

describe('written templates (§2.2 — 8 templates, write once)', () => {
  it('has exactly 8 answer types', () => {
    expect(WRITTEN_ANSWER_TYPES).toHaveLength(8);
    expect(WRITTEN_ANSWER_TYPES).toEqual([
      'bangla-essay',
      'english-essay',
      'paragraph',
      'bangla-letter',
      'application',
      'english-letter',
      'translation',
      'math-solution',
    ]);
  });

  it('every template has a skeleton, rubric profile and checklist', () => {
    for (const type of WRITTEN_ANSWER_TYPES) {
      const t = WRITTEN_TEMPLATES[type];
      expect(t.skeletonBn.length).toBeGreaterThanOrEqual(3);
      expect(t.skeletonEn.length).toBe(t.skeletonBn.length);
      expect(Object.keys(t.checklistBn).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(t.checklistEn).length).toBeGreaterThanOrEqual(2);
      expect(t.commonMistakesSlotBn.length).toBeGreaterThan(0);
    }
  });

  it('math template has NO intro/discussion/conclusion (E-4)', () => {
    const math = writtenTemplate('math-solution');
    expect(math.shape).toBe('method-steps');
    expect(math.skeletonBn).toEqual([
      'প্রদত্ত তথ্য',
      'সূত্র/পদ্ধতি',
      'ধাপে ধাপে সমাধান',
      'একক',
      'উত্তর যাচাই',
    ]);
    expect(math.skeletonBn.join(' ')).not.toContain('ভূমিকা');
    expect(math.skeletonBn.join(' ')).not.toContain('উপসংহার');
    expect(math.skeletonEn.join(' ')).not.toContain('Introduction');
    expect(math.skeletonEn.join(' ')).not.toContain('Conclusion');
  });

  it('gk-written / explanatory reuse the essay skeleton (E-3 — not separate templates)', () => {
    expect(writtenTemplateForKind('gk-written')).toBe('bangla-essay');
    expect(writtenTemplateForKind('explanatory')).toBe('bangla-essay');
    expect(writtenTemplateForKind('translation')).toBe('translation');
  });

  it('letters and applications use the format-block shape', () => {
    expect(writtenTemplate('bangla-letter').shape).toBe('format-block');
    expect(writtenTemplate('application').shape).toBe('format-block');
    expect(writtenTemplate('english-letter').shape).toBe('format-block');
    expect(writtenTemplate('application').skeletonEn).toContain('Subject line');
  });
});

describe('rubric (§2.5 — 7 dimensions, per-type weight profiles)', () => {
  it('has 7 dimensions with default weights summing to 100', () => {
    expect(RUBRIC_DIMENSIONS).toHaveLength(7);
    const sum = RUBRIC_DIMENSIONS.reduce((a, d) => a + d.defaultWeight, 0);
    expect(sum).toBe(100);
  });

  it('every weight profile sums to 100', () => {
    for (const type of WRITTEN_ANSWER_TYPES) {
      const profile = RUBRIC_WEIGHT_PROFILES[type];
      const sum = Object.values(profile).reduce((a, b) => a + b, 0);
      expect(sum, type).toBe(100);
    }
  });

  it('translation weights meaning first, structure last', () => {
    const p = RUBRIC_WEIGHT_PROFILES.translation;
    expect(p.relevance).toBeGreaterThanOrEqual(p.structure);
    expect(p.structure).toBe(5);
    expect(p.language).toBe(25);
  });

  it('math weights content/structure, not language/examples', () => {
    const p = RUBRIC_WEIGHT_PROFILES['math-solution'];
    expect(p.content).toBe(40);
    expect(p.examples).toBe(0);
    expect(p.language).toBe(5);
  });

  it('application weights format (structure) highest', () => {
    const p = RUBRIC_WEIGHT_PROFILES.application;
    expect(p.structure).toBe(25);
    expect(p.structure).toBeGreaterThanOrEqual(p.content);
  });
});

describe('length by marks (§2.4)', () => {
  it('covers 2 / 5 / 10 / 15 / 20 marks with the design defaults', () => {
    expect(WRITTEN_LENGTH_BY_MARKS.map((g) => g.marks)).toEqual([2, 5, 10, 15, 20]);
    expect(lengthGuidanceForMarks(2)).toMatchObject({ wordsMin: 30, wordsMax: 50 });
    expect(lengthGuidanceForMarks(5)).toMatchObject({ wordsMin: 80, wordsMax: 120 });
    expect(lengthGuidanceForMarks(10)).toMatchObject({ wordsMin: 150, wordsMax: 220 });
    expect(lengthGuidanceForMarks(15)).toMatchObject({ wordsMin: 250, wordsMax: 350 });
    expect(lengthGuidanceForMarks(20)).toMatchObject({ wordsMin: 350, wordsMax: 500 });
  });

  it('Bangla guidance says "প্রায়" (approximate) — never a false precision', () => {
    for (const g of WRITTEN_LENGTH_BY_MARKS) {
      expect(g.banglaBn).toContain('প্রায়');
      expect(g.banglaBn).not.toMatch(/ঠিক \d+ শব্দ/);
    }
  });

  it('math length is counted in steps, not words', () => {
    for (const g of WRITTEN_LENGTH_BY_MARKS) {
      expect(g.mathSteps).toContain('ধাপ');
    }
  });

  it('lengthStatusFor is guidance, never a gate', () => {
    expect(lengthStatusFor(10, 100)).toBe('below');
    expect(lengthStatusFor(10, 180)).toBe('within');
    expect(lengthStatusFor(10, 300)).toBe('above');
    expect(lengthStatusFor(7, 100)).toBe('within'); // nearest lower default (5m: 80–120)
    expect(lengthStatusFor(1, 10)).toBe('no-guidance');
  });

  it('countWords splits on whitespace; empty text is 0', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  ')).toBe(0);
    expect(countWords('one two  three')).toBe(3);
  });
});

describe('self-check checklist (§2.5 — ships first, no AI)', () => {
  it('every template yields at least 2 checklist dimensions', () => {
    for (const type of WRITTEN_ANSWER_TYPES) {
      const list = selfCheckChecklist(type);
      expect(list.length, type).toBeGreaterThanOrEqual(2);
      for (const item of list) {
        expect(item.questionsBn.length).toBeGreaterThanOrEqual(1);
        expect(item.questionsEn.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('the first checklist question asks what the question actually asks', () => {
    const essay = selfCheckChecklist('bangla-essay');
    expect(essay[0].dimension).toBe('relevance');
    expect(essay[0].questionsBn[0]).toContain('প্রশ্নে যা চাওয়া হয়েছে');
  });
});

describe('prohibited claims (§2.6)', () => {
  it('detects the prohibited claims', () => {
    expect(containsProhibitedClaim('Your Official Exam Result is 72')).not.toBeNull();
    expect(containsProhibitedClaim('This is the only correct answer')).not.toBeNull();
    expect(containsProhibitedClaim('Guaranteed Marks: 90')).not.toBeNull();
    expect(containsProhibitedClaim('চূড়ান্ত নম্বর ৮০')).not.toBeNull();
  });

  it('does not flag ordinary teaching copy', () => {
    expect(containsProhibitedClaim('Write your answer in your own words.')).toBeNull();
    expect(containsProhibitedClaim('This is a sample answer.')).toBeNull();
  });

  it('no template copy contains a prohibited claim', () => {
    for (const type of WRITTEN_ANSWER_TYPES) {
      const t = WRITTEN_TEMPLATES[type];
      const copy = [
        t.nameBn,
        t.nameEn,
        ...t.skeletonBn,
        ...t.skeletonEn,
        t.commonMistakesSlotBn,
        t.commonMistakesSlotEn,
        ...Object.values(t.checklistBn).flat(),
        ...Object.values(t.checklistEn).flat(),
      ].join('\n');
      expect(containsProhibitedClaim(copy), type).toBeNull();
    }
  });

  it('model-answer label + copy warning are exact', () => {
    expect(MODEL_ANSWER_LABEL.bn).toContain('একমাত্র সঠিক উত্তর নয়');
    expect(MODEL_ANSWER_LABEL.en).toContain('not the only correct answer');
    expect(MODEL_ANSWER_COPY_WARNING.bn).toContain('নিজের ভাষায় লিখুন');
  });
});
