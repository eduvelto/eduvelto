import { describe, it, expect } from 'vitest';
import {
  INTERVIEW_CATEGORIES,
  INTERVIEW_INTRO,
  INTERVIEW_QUESTIONS,
  interviewCategoryById,
  interviewQuestionsByCategory,
} from '../../tools/interviewQuestions';

const CATEGORY_IDS = ['general', 'strengths', 'career', 'salary'] as const;

// A digit (Latin or Bengali) directly followed by a currency marker
// means a quoted salary figure — guides must never contain one.
const SALARY_FIGURE = /[0-9০-৯]\s*(?:৳|\$|টাকা)/;

describe('INTERVIEW_QUESTIONS', () => {
  it('has exactly 12 questions', () => {
    expect(INTERVIEW_QUESTIONS).toHaveLength(12);
  });

  it('has unique ids', () => {
    const ids = INTERVIEW_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it('has exactly the 4 listed categories, each with bn+en labels', () => {
    expect(INTERVIEW_CATEGORIES.map((c) => c.id)).toEqual([...CATEGORY_IDS]);
    for (const c of INTERVIEW_CATEGORIES) {
      expect(c.bn.trim().length).toBeGreaterThan(0);
      expect(c.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses only the 4 listed categories', () => {
    for (const q of INTERVIEW_QUESTIONS) {
      expect(CATEGORY_IDS).toContain(q.category);
    }
  });

  it('every question has a non-empty bn+en question and guide', () => {
    for (const q of INTERVIEW_QUESTIONS) {
      expect(q.questionBn.trim().length, `${q.id} questionBn`).toBeGreaterThan(0);
      expect(q.questionEn.trim().length, `${q.id} questionEn`).toBeGreaterThan(0);
      expect(q.guideBn.trim().length, `${q.id} guideBn`).toBeGreaterThan(0);
      expect(q.guideEn.trim().length, `${q.id} guideEn`).toBeGreaterThan(0);
    }
  });

  it('every guide is practical advice (2+ sentences), not a one-liner', () => {
    for (const q of INTERVIEW_QUESTIONS) {
      expect(q.guideBn.split('।').filter((s) => s.trim()).length, `${q.id} guideBn`).toBeGreaterThanOrEqual(2);
      expect(q.guideEn.split('.').filter((s) => s.trim()).length, `${q.id} guideEn`).toBeGreaterThanOrEqual(2);
    }
  });

  it('no guide quotes a salary figure (no digit before ৳ / $ / টাকা)', () => {
    for (const q of INTERVIEW_QUESTIONS) {
      expect(q.guideBn, `${q.id} guideBn`).not.toMatch(SALARY_FIGURE);
      expect(q.guideEn, `${q.id} guideEn`).not.toMatch(SALARY_FIGURE);
    }
  });

  it('the salary question guide talks about researching the market, not quoting a number', () => {
    const salary = INTERVIEW_QUESTIONS.find((q) => q.id === 'salary-expectation');
    expect(salary).toBeDefined();
    expect(salary!.guideBn).toMatch(/গবেষণা/);
    expect(salary!.guideEn.toLowerCase()).toContain('research');
    expect(salary!.guideBn).not.toMatch(SALARY_FIGURE);
    expect(salary!.guideEn).not.toMatch(SALARY_FIGURE);
  });

  it('covers all 12 required questions', () => {
    const ids = INTERVIEW_QUESTIONS.map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining([
      'about-yourself',
      'greatest-strength',
      'greatest-weakness',
      'why-this-job',
      'why-hire-you',
      'where-in-five-years',
      'working-under-pressure',
      'teamwork-experience',
      'why-leaving-previous-job',
      'salary-expectation',
      'what-know-about-us',
      'any-questions-for-us',
    ]));
  });
});

describe('interviewQuestionsByCategory / interviewCategoryById', () => {
  it('returns all 12 for "all" and only matching ones per category', () => {
    expect(interviewQuestionsByCategory('all')).toHaveLength(12);
    for (const id of CATEGORY_IDS) {
      const list = interviewQuestionsByCategory(id);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((q) => q.category === id)).toBe(true);
    }
  });

  it('resolves each category label and rejects unknown ids', () => {
    for (const c of INTERVIEW_CATEGORIES) {
      expect(interviewCategoryById(c.id)).toBe(c);
    }
    expect(() => interviewCategoryById('honours' as never)).toThrow();
  });
});

describe('INTERVIEW_INTRO', () => {
  it('says the guides are preparation, not memorized scripts', () => {
    expect(INTERVIEW_INTRO.bn).toMatch(/মুখস্থ/);
    expect(INTERVIEW_INTRO.en.toLowerCase()).toContain('memorize');
    expect(INTERVIEW_INTRO.bn.trim().length).toBeGreaterThan(0);
    expect(INTERVIEW_INTRO.en.trim().length).toBeGreaterThan(0);
  });
});
