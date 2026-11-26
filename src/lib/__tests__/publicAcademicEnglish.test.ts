// Eduvelto — Academic English verified pool tests (Education Hub,
// 26 Nov 2026).
//
// The English pool is the SINGLE verified source for English practice
// in both the Question Maker and the Education Hub chapter practice.
// These tests pin that it holds ONLY the 158 reviewed questions
// (150 VERIFIED + 8 NEEDS-FIX with fixes applied: Class 3 24V/4F,
// Class 4 26V/1F, Class 5 27V/1F, Class 6 27V/1F, Class 7 26V/1F,
// Class 8 20V/0F), in the right chapters, with
// exactly one correct answer each. The combined-pool helpers live in
// publicAcademic.test.ts.
import { describe, it, expect } from 'vitest';
import { PUBLIC_ACADEMIC_ENGLISH_QUESTIONS } from '../publicAcademicEnglish';

describe('Academic verified pool — English (Classes 3–8)', () => {
  it('holds exactly the 158 reviewed questions (150 VERIFIED + 8 fixed)', () => {
    expect(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS).toHaveLength(158);
    expect(new Set(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => q.id)).size).toBe(158);
  });

  it('every question is MCQ with 4 distinct options and one valid correct letter', () => {
    for (const q of PUBLIC_ACADEMIC_ENGLISH_QUESTIONS) {
      expect(q.subjectId).toBe('english');
      expect(['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8']).toContain(q.classId);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      expect(q.questionText.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(['easy', 'medium']).toContain(q.difficulty);
      expect(q.sourceNote).toContain('English');
      expect(q.sourceNote).toContain('NCTB');
    }
  });

  it('covers 93 NCTB units: Class 3 has 7 units x 4, Class 4 has 18 units, Class 5 has 20 units, Class 6 has 28 lessons x 1, Class 7 has 9 units, Class 8 has 11 units', () => {
    const byClass = (classId: string) =>
      PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.filter((q) => q.classId === classId);
    expect(byClass('class-3')).toHaveLength(28);
    expect(byClass('class-4')).toHaveLength(27);
    expect(byClass('class-5')).toHaveLength(28);
    expect(byClass('class-6')).toHaveLength(28);
    expect(byClass('class-7')).toHaveLength(27);
    expect(byClass('class-8')).toHaveLength(20);
    const chapters = new Set(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => q.chapterId));
    expect(chapters.size).toBe(93);
    for (const id of chapters) {
      // Classes 3–5 use "Unit N", Class 6 uses "Lesson N", Classes 7–8 use "Unit N".
      expect(id).toMatch(/^acad-class-[345]-eng-unit-\d+$|^acad-class-6-eng-lesson-\d+$|^acad-class-[78]-eng-unit-\d+$/);
    }
    const c3Chapters = new Set(byClass('class-3').map((q) => q.chapterId));
    expect(c3Chapters.size).toBe(7);
    for (const id of c3Chapters) {
      expect(byClass('class-3').filter((q) => q.chapterId === id)).toHaveLength(4);
    }
    expect(new Set(byClass('class-4').map((q) => q.chapterId)).size).toBe(18);
    expect(new Set(byClass('class-5').map((q) => q.chapterId)).size).toBe(20);
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
  });

  it('the 8 NEEDS-FIX items carry their fixed content', () => {
    const byId = new Map(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => [q.id, q]));
    const q010 = byId.get('ACAD-C3-ENG-010')!;
    expect(q010.options.map((o) => o.text)).toEqual([
      'I open my book.',
      'My book is open.',
      'Open your book.',
      'I close the door.',
    ]);
    expect(q010.correctLetter).toBe('C');
    expect(byId.get('ACAD-C3-ENG-014')!.questionText).toBe(
      "Which word starts with the same sound as 'bat'?",
    );
    expect(byId.get('ACAD-C3-ENG-017')!.correctLetter).toBe('B');
    expect(byId.get('ACAD-C3-ENG-017')!.options[1].text).toBe('Monday');
    const q023 = byId.get('ACAD-C3-ENG-023')!;
    expect(q023.correctLetter).toBe('A');
    expect(q023.explanation).toBe('We put rubbish in the bin to keep our classroom clean.');
    const q025 = byId.get('ACAD-C5-ENG-025')!;
    expect(q025.options.map((o) => o.text)).toContain('Penguin');
    expect(q025.options.map((o) => o.text)).not.toContain('Deer');
    expect(q025.correctLetter).toBe('C');
    // Class 4's one NEEDS-FIX: the clock explanation was misworded
    // ("both hands point to 7 and 12") — now short/long hand at 7:00.
    const q009 = byId.get('ACAD-C4-ENG-009')!;
    expect(q009.explanation).toContain('7:00');
    expect(q009.explanation).toContain('short (hour) hand');
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
      'class-3': { A: 7, B: 7, C: 7, D: 7 },
      'class-4': { A: 7, B: 7, C: 7, D: 6 },
      'class-5': { A: 7, B: 7, C: 7, D: 7 },
      'class-6': { A: 7, B: 7, C: 7, D: 7 },
      'class-7': { A: 7, B: 7, C: 7, D: 6 },
      'class-8': { A: 5, B: 5, C: 5, D: 5 },
    };
    for (const classId of ['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8'] as const) {
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of PUBLIC_ACADEMIC_ENGLISH_QUESTIONS) {
        if (q.classId === classId) counts[q.correctLetter] += 1;
      }
      expect(counts).toEqual(expected[classId]);
    }
  });
});
