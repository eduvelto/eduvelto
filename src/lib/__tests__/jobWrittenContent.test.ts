/**
 * Eduvelto Job Preparation — written content unit tests
 * (design-grades-written-previous-admin.md §7 step 7).
 */
import { describe, it, expect } from 'vitest';
import {
  WRITTEN_QUESTIONS,
  writtenQuestionById,
  writtenQuestionsForExam,
  writtenQuestionsForPostFamily,
  validateWrittenQuestion,
} from '../jobWrittenContent';
import { containsProhibitedClaim } from '../jobWritten';

function allCopy(q: (typeof WRITTEN_QUESTIONS)[number]): string {
  const s = q.structure;
  return [
    q.questionTextBn,
    q.questionTextEn ?? '',
    q.instructionsBn,
    q.instructionsEn ?? '',
    s.questionAnalysisBn,
    s.questionAnalysisEn,
    ...s.structureBn,
    ...s.structureEn,
    s.introductionBn,
    s.introductionEn,
    ...s.mainPointsBn,
    ...s.mainPointsEn,
    ...s.factsBn.map((f) => f.text),
    ...s.factsEn.map((f) => f.text),
    s.conclusionBn,
    s.conclusionEn,
    s.modelAnswerBn,
    s.modelAnswerEn ?? '',
    s.submissionPromptBn,
    s.submissionPromptEn,
    q.markingGuidelines,
    ...q.commonMistakes,
    ...q.referenceSources,
  ].join('\n');
}

describe('first written questions (§2.7 — code-shaped, English first)', () => {
  it('has 6 questions: 5 English + 1 Bangla DRAFT', () => {
    expect(WRITTEN_QUESTIONS).toHaveLength(6);
    expect(WRITTEN_QUESTIONS.filter((q) => q.questionId.startsWith('wq-en-'))).toHaveLength(5);
    expect(WRITTEN_QUESTIONS.filter((q) => q.questionId.startsWith('wq-bn-'))).toHaveLength(1);
  });

  it('every question is DRAFT, Not Started, unverified — nothing is Published', () => {
    for (const q of WRITTEN_QUESTIONS) {
      expect(q.status).toBe('draft');
      expect(q.reviewStatus).toBe('Not Started');
      expect(q.verifiedBy).toBeNull();
      expect(q.verifiedAt).toBeNull();
    }
  });

  it('every question has all 8 teaching elements (§2.3)', () => {
    for (const q of WRITTEN_QUESTIONS) {
      const s = q.structure;
      expect(s.questionAnalysisBn.length, q.questionId).toBeGreaterThan(0);
      expect(s.structureBn.length, q.questionId).toBeGreaterThanOrEqual(3);
      expect(s.introductionBn.length, q.questionId).toBeGreaterThan(0);
      expect(s.mainPointsBn.length, q.questionId).toBeGreaterThanOrEqual(3);
      expect(s.factsBn.length, q.questionId).toBeGreaterThanOrEqual(1);
      expect(s.conclusionBn.length, q.questionId).toBeGreaterThan(0);
      expect(
        s.modelAnswerBn.length > 0 || (s.modelAnswerEn ?? '').length > 0,
        q.questionId,
      ).toBe(true);
      expect(s.submissionPromptBn.length, q.questionId).toBeGreaterThan(0);
    }
  });

  it('every fact has a source or is explicitly sourceless (renders "যাচাই হয়নি")', () => {
    for (const q of WRITTEN_QUESTIONS) {
      for (const f of [...q.structure.factsBn, ...q.structure.factsEn]) {
        expect(typeof f.text).toBe('string');
        expect(f.text.length).toBeGreaterThan(0);
        // source is string | null — null is the honest "unverified" state.
        expect(f.source === null || typeof f.source === 'string').toBe(true);
      }
    }
  });

  it('marks are null (unverified pattern) — never guessed', () => {
    for (const q of WRITTEN_QUESTIONS) {
      expect(q.marks).toBeNull();
    }
  });

  it('no prohibited strings in any question copy', () => {
    for (const q of WRITTEN_QUESTIONS) {
      expect(containsProhibitedClaim(allCopy(q)), q.questionId).toBeNull();
    }
  });

  it('the Bangla question is explicitly DRAFT/UNVERIFIED (0 verified Bangla teachers)', () => {
    const q = writtenQuestionById('wq-bn-paragraph-001');
    expect(q?.markingGuidelines).toContain('DRAFT/UNVERIFIED');
    expect(q?.questionTextEn).toBeNull();
  });

  it('validator passes every shipped question and catches a published-without-verifier one', () => {
    for (const q of WRITTEN_QUESTIONS) {
      expect(validateWrittenQuestion(q)).toEqual([]);
    }
    const bad = { ...WRITTEN_QUESTIONS[0], status: 'published' as const, reviewStatus: 'Published' as const };
    expect(validateWrittenQuestion(bad)).toContain(
      `writtenQuestions/${bad.questionId}: published requires a verifier (second-eye rule)`,
    );
  });

  it('lookups work', () => {
    expect(writtenQuestionById('wq-en-essay-001')?.answerType).toBe('english-essay');
    expect(writtenQuestionById('no-such')).toBeUndefined();
    expect(writtenQuestionsForExam('bcs')).toHaveLength(6);
    expect(writtenQuestionsForExam('bank')).toHaveLength(0);
    expect(writtenQuestionsForPostFamily('office-assistant-typist')).toHaveLength(0);
  });
});
