// Eduvelto — combined verified Academic pool tests (Education Hub,
// 26 Nov 2026).
//
// The combined pool (Classes 3–5, six subjects) is the SINGLE
// verified source for both the Question Maker and the Education Hub
// chapter practice. These tests pin that it holds ONLY the 477
// reviewed questions (Class 3: 160, Class 4: 152, Class 5: 165),
// that the two REJECTED items with no complete replacement recorded
// are absent, and that the derived chapters + helpers return honest
// empties for anything unverified.
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
};

describe('combined verified Academic pool (Classes 3–5, six subjects)', () => {
  it('holds exactly the 477 reviewed questions (160 + 152 + 165)', () => {
    expect(PUBLIC_ACADEMIC_QUESTIONS).toHaveLength(477);
    expect(new Set(PUBLIC_ACADEMIC_QUESTIONS.map((q) => q.id)).size).toBe(477);
    const byClass = (classId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.classId === classId);
    expect(byClass('class-3')).toHaveLength(160);
    expect(byClass('class-4')).toHaveLength(152);
    expect(byClass('class-5')).toHaveLength(165);
    const bySubject = (subjectId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.subjectId === subjectId);
    expect(bySubject('english')).toHaveLength(83);
    expect(bySubject('bangla')).toHaveLength(74);
    expect(bySubject('math')).toHaveLength(83);
    expect(bySubject('science')).toHaveLength(79);
    expect(bySubject('bgs')).toHaveLength(84);
    expect(bySubject('islam')).toHaveLength(74);
  });

  it('every question is MCQ with 4 distinct options, one valid correct letter, and an NCTB citation', () => {
    for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
      expect(['class-3', 'class-4', 'class-5']).toContain(q.classId);
      expect(['english', 'bangla', 'math', 'science', 'bgs', 'islam']).toContain(q.subjectId);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      expect(q.questionText.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
      expect(q.sourceNote).toContain('NCTB');
      expect(q.chapterId).toMatch(/^acad-class-[345]-(eng|ban|mat|sci|bgs|isl)-/);
    }
  });

  it('the two REJECTED items with no complete replacement are absent', () => {
    const ids = new Set(PUBLIC_ACADEMIC_QUESTIONS.map((q) => q.id));
    expect(ids.has('ACAD-C4-BAN-019')).toBe(false); // "লাল জামা" — needs teacher distractors
    expect(ids.has('ACAD-C5-BGS-011')).toBe(false); // tea gardens — needs teacher rebuild pick
  });

  it('the one hard question keeps its reviewed difficulty (never silently downgraded)', () => {
    const hard = PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.difficulty === 'hard');
    expect(hard).toHaveLength(1);
    expect(hard[0].id).toBe('ACAD-C3-MAT-017');
  });

  it('derives 247 chapters with the right per-class/subject counts', () => {
    expect(PUBLIC_ACADEMIC_CHAPTERS).toHaveLength(247);
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

  it('helpers: class/subject lists (18 rows) and honest empties', () => {
    const rows = publicAcademicClassSubjects();
    expect(rows).toHaveLength(18);
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
    expect(publicAcademicChaptersFor('class-6', 'math')).toEqual([]);
    expect(publicAcademicChaptersFor('class-3', 'ict')).toEqual([]);
    expect(publicAcademicChaptersFor('class-9', 'english')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('acad-class-3-mat-chapter-1')).toHaveLength(3);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-1')).toHaveLength(4);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-99')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('no-such-chapter')).toEqual([]);
  });

  it('correct answers stay balanced after the shuffles (no letter above 8 in any class/subject)', () => {
    for (const [key] of Object.entries(PER_CLASS_SUBJECT)) {
      const [classId, subjectId] = key.split('/');
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
        if (q.classId === classId && q.subjectId === subjectId) {
          counts[q.correctLetter] += 1;
        }
      }
      for (const letter of ['A', 'B', 'C', 'D']) {
        expect(counts[letter], `${key} ${letter}`).toBeLessThanOrEqual(8);
      }
    }
  });
});
