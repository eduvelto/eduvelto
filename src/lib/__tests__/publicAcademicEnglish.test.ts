// Eduvelto — Academic English verified pool tests (Education Hub,
// 26 Nov 2026).
//
// The pool is the SINGLE verified source for both the Question Maker
// and the Education Hub chapter practice. These tests pin that it
// holds ONLY the 56 reviewed questions (51 VERIFIED + 5 NEEDS-FIX
// with fixes applied), in the right chapters, with exactly one
// correct answer each — and that the helpers return honest empties
// for anything unverified.
import { describe, it, expect } from 'vitest';
import {
  PUBLIC_ACADEMIC_CHAPTERS,
  PUBLIC_ACADEMIC_ENGLISH_QUESTIONS,
  publicAcademicChaptersFor,
  publicAcademicClassSubjects,
  publicAcademicQuestionsForChapter,
} from '../publicAcademicEnglish';

describe('Academic verified pool (Class 3 + Class 5 English)', () => {
  it('holds exactly the 56 reviewed questions (51 VERIFIED + 5 fixed)', () => {
    expect(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS).toHaveLength(56);
    expect(new Set(PUBLIC_ACADEMIC_ENGLISH_QUESTIONS.map((q) => q.id)).size).toBe(56);
  });

  it('every question is MCQ with 4 distinct options and one valid correct letter', () => {
    for (const q of PUBLIC_ACADEMIC_ENGLISH_QUESTIONS) {
      expect(q.subjectId).toBe('english');
      expect(['class-3', 'class-5']).toContain(q.classId);
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

  it('covers 27 NCTB units: Class 3 has 7 units x 4, Class 5 has 20 units', () => {
    expect(PUBLIC_ACADEMIC_CHAPTERS).toHaveLength(27);
    const c3 = PUBLIC_ACADEMIC_CHAPTERS.filter((c) => c.classId === 'class-3');
    const c5 = PUBLIC_ACADEMIC_CHAPTERS.filter((c) => c.classId === 'class-5');
    expect(c3).toHaveLength(7);
    expect(c5).toHaveLength(20);
    for (const c of c3) expect(c.questionCount).toBe(4);
    expect(c5.reduce((a, c) => a + c.questionCount, 0)).toBe(28);
    // Chapter ids are unit slugs; topics are the draft's topical tags.
    for (const c of PUBLIC_ACADEMIC_CHAPTERS) {
      expect(c.id).toMatch(/^acad-class-[35]-eng-unit-\d+$/);
      expect(c.topics.length).toBeGreaterThan(0);
      expect(c.topics.reduce((a, t) => a + t.count, 0)).toBe(c.questionCount);
    }
  });

  it('the 5 NEEDS-FIX items carry their fixed content', () => {
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
  });

  it('correct answers are balanced after the shuffle (7 per letter, per class)', () => {
    for (const classId of ['class-3', 'class-5'] as const) {
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of PUBLIC_ACADEMIC_ENGLISH_QUESTIONS) {
        if (q.classId === classId) counts[q.correctLetter] += 1;
      }
      expect(counts).toEqual({ A: 7, B: 7, C: 7, D: 7 });
    }
  });

  it('helpers: class/subject lists and honest empties', () => {
    expect(publicAcademicClassSubjects()).toEqual([
      { classId: 'class-3', subjectId: 'english', questionCount: 28, chapterCount: 7 },
      { classId: 'class-5', subjectId: 'english', questionCount: 28, chapterCount: 20 },
    ]);
    expect(publicAcademicChaptersFor('class-3', 'english')).toHaveLength(7);
    expect(publicAcademicChaptersFor('class-5', 'english')).toHaveLength(20);
    expect(publicAcademicChaptersFor('class-4', 'english')).toEqual([]);
    expect(publicAcademicChaptersFor('class-3', 'math')).toEqual([]);
    expect(publicAcademicChaptersFor('class-3', 'bangla')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-1')).toHaveLength(4);
    expect(publicAcademicQuestionsForChapter('acad-class-5-eng-unit-7')).toHaveLength(2);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-99')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('no-such-chapter')).toEqual([]);
  });
});
