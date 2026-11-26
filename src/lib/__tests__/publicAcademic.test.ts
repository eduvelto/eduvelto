// Eduvelto — combined verified Academic pool tests (Education Hub,
// 26 Nov 2026).
//
// The combined pool (Classes 3–6, twelve subjects) is the SINGLE
// verified source for both the Question Maker and the Education Hub
// chapter practice. These tests pin that it holds ONLY the 810
// reviewed questions (Class 3: 160, Class 4: 152, Class 5: 165,
// Class 6: 333), that the REJECTED items with no complete replacement
// recorded are absent, and that the derived chapters + helpers return
// honest empties for anything unverified.
import { describe, it, expect } from 'vitest';
import {
  PUBLIC_ACADEMIC_CHAPTERS,
  PUBLIC_ACADEMIC_QUESTIONS,
  publicAcademicChaptersFor,
  publicAcademicClassSubjects,
  publicAcademicQuestionsForChapter,
} from '../publicAcademic';

const PER_CLASS_SUBJECT: Record<string, { questions: number; chapters: number }> = {
  'class-3/bangla': { questions: 29, chapters: 29 },
  'class-3/bgs': { questions: 26, chapters: 13 },
  'class-3/english': { questions: 28, chapters: 7 },
  'class-3/islam': { questions: 24, chapters: 5 },
  'class-3/math': { questions: 28, chapters: 13 },
  'class-3/science': { questions: 25, chapters: 11 },
  'class-4/bangla': { questions: 22, chapters: 22 },
  'class-4/bgs': { questions: 27, chapters: 14 },
  'class-4/english': { questions: 27, chapters: 18 },
  'class-4/islam': { questions: 25, chapters: 5 },
  'class-4/math': { questions: 25, chapters: 11 },
  'class-4/science': { questions: 26, chapters: 11 },
  'class-5/bangla': { questions: 23, chapters: 23 },
  'class-5/bgs': { questions: 31, chapters: 17 },
  'class-5/english': { questions: 28, chapters: 20 },
  'class-5/islam': { questions: 25, chapters: 5 },
  'class-5/math': { questions: 30, chapters: 10 },
  'class-5/science': { questions: 28, chapters: 13 },
  'class-6/agriculture': { questions: 24, chapters: 6 },
  'class-6/bangla': { questions: 26, chapters: 18 },
  'class-6/bangla-grammar': { questions: 24, chapters: 14 },
  'class-6/bgs': { questions: 26, chapters: 9 },
  'class-6/english': { questions: 28, chapters: 28 },
  'class-6/home-science': { questions: 28, chapters: 15 },
  'class-6/ict': { questions: 21, chapters: 5 },
  'class-6/islam': { questions: 25, chapters: 5 },
  'class-6/math': { questions: 28, chapters: 8 },
  'class-6/math-depth': { questions: 39, chapters: 8 },
  'class-6/science': { questions: 27, chapters: 14 },
  'class-6/science-depth': { questions: 37, chapters: 14 },
};

describe('combined verified Academic pool (Classes 3–6, twelve subjects)', () => {
  it('holds exactly the 810 reviewed questions (160 + 152 + 165 + 333)', () => {
    expect(PUBLIC_ACADEMIC_QUESTIONS).toHaveLength(810);
    expect(new Set(PUBLIC_ACADEMIC_QUESTIONS.map((q) => q.id)).size).toBe(810);
    const byClass = (classId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.classId === classId);
    expect(byClass('class-3')).toHaveLength(160);
    expect(byClass('class-4')).toHaveLength(152);
    expect(byClass('class-5')).toHaveLength(165);
    expect(byClass('class-6')).toHaveLength(333);
    const bySubject = (subjectId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.subjectId === subjectId);
    expect(bySubject('english')).toHaveLength(111);
    expect(bySubject('bangla')).toHaveLength(100);
    expect(bySubject('math')).toHaveLength(111);
    expect(bySubject('science')).toHaveLength(106);
    expect(bySubject('bgs')).toHaveLength(110);
    expect(bySubject('islam')).toHaveLength(99);
    expect(bySubject('bangla-grammar')).toHaveLength(24);
    expect(bySubject('math-depth')).toHaveLength(39);
    expect(bySubject('science-depth')).toHaveLength(37);
    expect(bySubject('ict')).toHaveLength(21);
    expect(bySubject('agriculture')).toHaveLength(24);
    expect(bySubject('home-science')).toHaveLength(28);
  });

  it('every question is MCQ with 4 distinct options, one valid correct letter, and an NCTB citation', () => {
    for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
      expect(['class-3', 'class-4', 'class-5', 'class-6']).toContain(q.classId);
      expect([
        'english',
        'bangla',
        'bangla-grammar',
        'math',
        'math-depth',
        'science',
        'science-depth',
        'bgs',
        'islam',
        'ict',
        'agriculture',
        'home-science',
      ]).toContain(q.subjectId);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      expect(q.questionText.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
      expect(q.sourceNote).toContain('NCTB');
      expect(q.chapterId).toMatch(
        /^acad-class-[3456]-(eng|ban|bgr|mat-depth|mat|sci-depth|sci|bgs|isl|ict|agr|hsc)-/,
      );
    }
  });

  it('the REJECTED items with no complete replacement are absent', () => {
    const ids = new Set(PUBLIC_ACADEMIC_QUESTIONS.map((q) => q.id));
    expect(ids.has('ACAD-C4-BAN-019')).toBe(false); // "লাল জামা" — needs teacher distractors
    expect(ids.has('ACAD-C5-BGS-011')).toBe(false); // tea gardens — needs teacher rebuild pick
    expect(ids.has('ACAD-C6-ICT-009')).toBe(false); // ICT password — rebuild has no options
    expect(ids.has('ACAD-C6-ICT-010')).toBe(false); // ICT personal info — rebuild has no options
    expect(ids.has('ACAD-C6-ICT-012')).toBe(false); // ICT password — rebuild has no options
    expect(ids.has('ACAD-C6-ICT-024')).toBe(false); // ICT — rebuild has no options
    expect(ids.has('C6S-025')).toBe(false); // science-depth শোষণ — rebuild has no options
  });

  it('the two hard questions keep their reviewed difficulty (never silently downgraded)', () => {
    const hard = PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.difficulty === 'hard');
    expect(hard).toHaveLength(2);
    expect(hard.map((q) => q.id).sort()).toEqual(['ACAD-C3-MAT-017', 'C6M-025']);
  });

  it('derives 391 chapters with the right per-class/subject counts', () => {
    expect(PUBLIC_ACADEMIC_CHAPTERS).toHaveLength(391);
    for (const [key, want] of Object.entries(PER_CLASS_SUBJECT)) {
      const [classId, subjectId] = key.split('/');
      const chapters = publicAcademicChaptersFor(classId, subjectId);
      expect(chapters, key).toHaveLength(want.chapters);
      expect(
        chapters.reduce((a, c) => a + c.questionCount, 0),
        key,
      ).toBe(want.questions);
      for (const c of chapters) {
        expect(c.topics.length).toBeGreaterThan(0);
        expect(c.topics.reduce((a, t) => a + t.count, 0)).toBe(c.questionCount);
      }
    }
    // Chapter ids are unique and every chapter's questions resolve.
    const ids = PUBLIC_ACADEMIC_CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of PUBLIC_ACADEMIC_CHAPTERS) {
      expect(publicAcademicQuestionsForChapter(c.id)).toHaveLength(c.questionCount);
    }
  });

  it('helpers: class/subject lists (30 rows) and honest empties', () => {
    const rows = publicAcademicClassSubjects();
    expect(rows).toHaveLength(30);
    expect(rows).toContainEqual({
      classId: 'class-3',
      subjectId: 'bangla',
      questionCount: 29,
      chapterCount: 29,
    });
    expect(rows).toContainEqual({
      classId: 'class-4',
      subjectId: 'english',
      questionCount: 27,
      chapterCount: 18,
    });
    expect(rows).toContainEqual({
      classId: 'class-5',
      subjectId: 'math',
      questionCount: 30,
      chapterCount: 10,
    });
    expect(rows).toContainEqual({
      classId: 'class-6',
      subjectId: 'math-depth',
      questionCount: 39,
      chapterCount: 8,
    });
    expect(rows).toContainEqual({
      classId: 'class-6',
      subjectId: 'bangla-grammar',
      questionCount: 24,
      chapterCount: 14,
    });
    expect(publicAcademicChaptersFor('class-7', 'math')).toEqual([]);
    expect(publicAcademicChaptersFor('class-3', 'ict')).toEqual([]);
    expect(publicAcademicChaptersFor('class-9', 'english')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('acad-class-3-mat-chapter-1')).toHaveLength(3);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-1')).toHaveLength(4);
    expect(publicAcademicQuestionsForChapter('acad-class-6-mat-depth-chapter-1')).toHaveLength(5);
    expect(publicAcademicQuestionsForChapter('acad-class-6-eng-lesson-27')).toHaveLength(1);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-99')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('no-such-chapter')).toEqual([]);
  });

  it('correct answers stay balanced after the shuffles (no letter above a quarter + 1 in any class/subject)', () => {
    for (const [key, want] of Object.entries(PER_CLASS_SUBJECT)) {
      const [classId, subjectId] = key.split('/');
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
        if (q.classId === classId && q.subjectId === subjectId) {
          counts[q.correctLetter] += 1;
        }
      }
      // The seeded shuffles balance each file to within one per
      // letter; the bound allows a quarter of the file + 1.
      const bound = Math.ceil(want.questions / 4) + 1;
      for (const letter of ['A', 'B', 'C', 'D']) {
        expect(counts[letter], `${key} ${letter}`).toBeLessThanOrEqual(bound);
      }
    }
  });
});
