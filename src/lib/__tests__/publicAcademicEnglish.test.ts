// Eduvelto — Academic English verified pool tests (Education Hub,
// 26 Nov 2026).
//
// The English pool is the SINGLE verified source for English practice
// in both the Question Maker and the Education Hub chapter practice.
// These tests pin that it holds ONLY the 95 reviewed questions
// (88 VERIFIED + 7 NEEDS-FIX with fixes applied: Class 6 27V/1F,
// Class 7 26V/1F, Class 8 20V/0F, Class 11 15V/5F), in the right
// chapters, with
// exactly one correct answer each. The combined-pool helpers live in
// publicAcademic.test.ts.
import { describe, it, expect } from 'vitest';
import { PUBLIC_ACADEMIC_ENGLISH_QUESTIONS } from '../publicAcademicEnglish';

describe('Academic verified pool — English (Classes 6–8 and 11)', () => {
  it('holds exactly the 95 reviewed questions (88 VERIFIED + 7 fixed)', () => {
    expect(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS).toHaveLength(95);
    expect(new Set(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => q.id)).size).toBe(95);
  });

  it('every question is MCQ with 4 distinct options and one valid correct letter', () => {
    // One Class 11 English question is a general-knowledge item, NOT
    // an English For Today lesson fact — its sourceNote honestly has
    // no 'NCTB'.
    for (const q of PUBLIC_ACADEMIC_ENGLISH_QUESTIONS) {
      expect(q.subjectId).toBe('english');
      expect(['class-6', 'class-7', 'class-8', 'class-11']).toContain(q.classId);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      expect(q.questionText.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
      expect(q.sourceNote).toContain('English');
      if (q.id === 'ACAD-7014') {
        expect(q.sourceNote).not.toContain('NCTB');
        expect(q.sourceNote).toContain('Standard nutrition reference');
      } else {
        expect(q.sourceNote).toContain('NCTB');
      }
    }
  });

  it('covers 63 NCTB units: Class 6 has 28 lessons x 1, Class 7 has 9 units, Class 8 has 11 units, Class 11 has 3 units + 12 topical chapters', () => {
    const byClass = (classId: string) =>
      PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.filter((q) => q.classId === classId);
    expect(byClass('class-6')).toHaveLength(28);
    expect(byClass('class-7')).toHaveLength(27);
    expect(byClass('class-8')).toHaveLength(20);
    expect(byClass('class-11')).toHaveLength(20);
    const chapters = new Set(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => q.chapterId));
    expect(chapters.size).toBe(63);
    for (const id of chapters) {
      // Class 6 uses "Lesson N", Classes 7–8 use "Unit N".
      // Class 11 uses "Unit N" for the three NCTB units and "Topic N" for topical chapters.
      expect(id).toMatch(/^acad-class-6-eng-lesson-\d+$|^acad-class-[78]-eng-unit-\d+$|^acad-class-11-eng-unit-\d+$|^acad-class-11-eng-topic-\d+$/);
    }
    const c6Chapters = new Set(byClass('class-6').map((q) => q.chapterId));
    expect(c6Chapters.size).toBe(28);
    for (const id of c6Chapters) {
      expect(byClass('class-6').filter((q) => q.chapterId === id)).toHaveLength(1);
    }
    // Class 7: 9 units; Unit 4 has 2 (ENG-011 moved to Unit 5), Unit 5 has 4, the rest 3.
    const c7Chapters = new Set(byClass('class-7').map((q) => q.chapterId));
    expect(c7Chapters.size).toBe(9);
    expect(byClass('class-7').filter((q) => q.chapterId === 'acad-class-7-eng-unit-4')).toHaveLength(2);
    expect(byClass('class-7').filter((q) => q.chapterId === 'acad-class-7-eng-unit-5')).toHaveLength(4);
    // Class 8: 11 units; Units 1–9 have 2 each, Units 10–11 have 1 each.
    const c8Chapters = new Set(byClass('class-8').map((q) => q.chapterId));
    expect(c8Chapters.size).toBe(11);
    for (let u = 1; u <= 9; u += 1) {
      expect(byClass('class-8').filter((q) => q.chapterId === `acad-class-8-eng-unit-${u}`)).toHaveLength(2);
    }
    expect(byClass('class-8').filter((q) => q.chapterId === 'acad-class-8-eng-unit-10')).toHaveLength(1);
    expect(byClass('class-8').filter((q) => q.chapterId === 'acad-class-8-eng-unit-11')).toHaveLength(1);
    // Class 11: 15 chapters — 3 NCTB units (Unit 1, 6, 12, one
    // question each) + 12 topical chapters (17 questions).
    const c11Chapters = new Set(byClass('class-11').map((q) => q.chapterId));
    expect(c11Chapters.size).toBe(15);
    expect(c11Chapters.has('acad-class-11-eng-unit-1')).toBe(true);
    expect(c11Chapters.has('acad-class-11-eng-unit-6')).toBe(true);
    expect(c11Chapters.has('acad-class-11-eng-unit-12')).toBe(true);
    expect([...c11Chapters].filter((id) => id.includes('-topic-'))).toHaveLength(12);
  });

  it('the 2 NEEDS-FIX items carry their fixed content', () => {
    const byId = new Map(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => [q.id, q]));
    // Class 6's one NEEDS-FIX: 'Andre' is a POEM (Gwendolyn Brooks),
    // not a story — the option and explanation now say poem.
    const q024 = byId.get('ACAD-C6-ENG-024')!;
    expect(q024.options.map((o) => o.text)).toContain(
      'A poem about a boy who dreams of choosing his parents',
    );
    expect(q024.options.map((o) => o.text)).not.toContain('A story about a boy');
    expect(q024.explanation).toContain('poem by Gwendolyn Brooks');
    expect(q024.correctLetter).toBe('D');
    // Class 7's one NEEDS-FIX: Florence Nightingale is in Unit 5
    // (Great Women to Remember), not Unit 4 — the chapter and source
    // moved; the correct answer (founder of modern nursing) is
    // unchanged (letter A after the shuffle).
    const q011 = byId.get('ACAD-C7-ENG-011')!;
    expect(q011.chapterId).toBe('acad-class-7-eng-unit-5');
    expect(q011.chapterName).toBe('Unit 5: Great Women to Remember');
    expect(q011.sourceNote).toBe('English for Today, Class 7 (NCTB), Unit 5: Great Women to Remember');
    expect(q011.options.map((o) => o.text)).toContain('The founder of modern nursing');
    expect(q011.correctLetter).toBe('A');
  });

  it('correct answers are balanced after the shuffle (no letter above 7 per class)', () => {
    const expected: Record<string, Record<string, number>> = {
      'class-6': { A: 7, B: 7, C: 7, D: 7 },
      'class-7': { A: 7, B: 7, C: 7, D: 6 },
      'class-8': { A: 5, B: 5, C: 5, D: 5 },
      'class-11': { A: 5, B: 5, C: 5, D: 5 },
    };
    for (const classId of ['class-6', 'class-7', 'class-8', 'class-11'] as const) {
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of PUBLIC_ACADEMIC_ENGLISH_QUESTIONS) {
        if (q.classId === classId) counts[q.correctLetter] += 1;
      }
      expect(counts).toEqual(expected[classId]);
    }
  });
});
