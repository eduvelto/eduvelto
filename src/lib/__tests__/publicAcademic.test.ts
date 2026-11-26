// Eduvelto — combined verified Academic pool tests (Education Hub,
// 26 Nov 2026).
//
// The combined pool (Classes 3–8, twelve subjects) is the SINGLE
// verified source for both the Question Maker and the Education Hub
// chapter practice. These tests pin that it holds ONLY the 1,387
// reviewed questions (Class 3: 160, Class 4: 152, Class 5: 165,
// Class 6: 333, Class 7: 325, Class 8: 252), that the REJECTED items with no complete replacement
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
  'class-7/agriculture': { questions: 24, chapters: 6 },
  'class-7/bangla': { questions: 26, chapters: 18 },
  'class-7/bangla-grammar': { questions: 23, chapters: 9 },
  'class-7/bgs': { questions: 26, chapters: 11 },
  'class-7/english': { questions: 27, chapters: 9 },
  'class-7/home-science': { questions: 30, chapters: 15 },
  'class-7/ict': { questions: 20, chapters: 5 },
  'class-7/islam': { questions: 25, chapters: 5 },
  'class-7/math': { questions: 27, chapters: 11 },
  'class-7/math-depth': { questions: 38, chapters: 11 },
  'class-7/science': { questions: 26, chapters: 13 },
  'class-7/science-depth': { questions: 33, chapters: 14 },
  'class-8/agriculture': { questions: 14, chapters: 7 },
  'class-8/bangla': { questions: 20, chapters: 17 },
  'class-8/bangla-grammar': { questions: 15, chapters: 13 },
  'class-8/bgs': { questions: 16, chapters: 10 },
  'class-8/english': { questions: 20, chapters: 11 },
  'class-8/home-science': { questions: 16, chapters: 14 },
  'class-8/ict': { questions: 15, chapters: 5 },
  'class-8/islam': { questions: 18, chapters: 5 },
  'class-8/math': { questions: 22, chapters: 11 },
  'class-8/math-depth': { questions: 38, chapters: 11 },
  'class-8/science': { questions: 24, chapters: 14 },
  'class-8/science-depth': { questions: 34, chapters: 14 },
};

describe('combined verified Academic pool (Classes 3–8, twelve subjects)', () => {
  it('holds exactly the 1,387 reviewed questions (160 + 152 + 165 + 333 + 325 + 252)', () => {
    expect(PUBLIC_ACADEMIC_QUESTIONS).toHaveLength(1387);
    expect(new Set(PUBLIC_ACADEMIC_QUESTIONS.map((q) => q.id)).size).toBe(1387);
    const byClass = (classId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.classId === classId);
    expect(byClass('class-3')).toHaveLength(160);
    expect(byClass('class-4')).toHaveLength(152);
    expect(byClass('class-5')).toHaveLength(165);
    expect(byClass('class-6')).toHaveLength(333);
    expect(byClass('class-7')).toHaveLength(325);
    expect(byClass('class-8')).toHaveLength(252);
    const bySubject = (subjectId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.subjectId === subjectId);
    expect(bySubject('english')).toHaveLength(158);
    expect(bySubject('bangla')).toHaveLength(146);
    expect(bySubject('math')).toHaveLength(160);
    expect(bySubject('science')).toHaveLength(156);
    expect(bySubject('bgs')).toHaveLength(152);
    expect(bySubject('islam')).toHaveLength(142);
    expect(bySubject('bangla-grammar')).toHaveLength(62);
    expect(bySubject('math-depth')).toHaveLength(115);
    expect(bySubject('science-depth')).toHaveLength(104);
    expect(bySubject('ict')).toHaveLength(56);
    expect(bySubject('agriculture')).toHaveLength(62);
    expect(bySubject('home-science')).toHaveLength(74);
  });

  it('every question is MCQ with 4 distinct options, one valid correct letter, and an NCTB citation', () => {
    for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
      expect(['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8']).toContain(q.classId);
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
        /^acad-class-[345678]-(eng|ban|bgr|mat-depth|mat|sci-depth|sci|bgs|isl|ict|agr|hsc)-/,
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
    expect(ids.has('ACAD-C7-ICT-010')).toBe(false); // ICT — rebuild has no options
    expect(ids.has('ACAD-C7-ICT-011')).toBe(false); // ICT — rebuild has no options
    expect(ids.has('ACAD-C7-ICT-015')).toBe(false); // ICT — rebuild has no options
    expect(ids.has('ACAD-C7-ICT-024')).toBe(false); // ICT — rebuild has no options
    expect(ids.has('ACAD-C7-ICT-025')).toBe(false); // ICT — rebuild has no options
    expect(ids.has('ACAD-C7-SCI-005')).toBe(false); // science — rebuild has no options
    expect(ids.has('ACAD-C7-SCI-006')).toBe(false); // science — rebuild has no options
    expect(ids.has('C7S-008')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C7S-024')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C7S-025')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C7S-028')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C7S-030')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('ACAD-C8-GRA-009')).toBe(false); // grammar — direction only, no replacement question
    expect(ids.has('ACAD-C8-BGS-003')).toBe(false); // BGS — example facts only, no replacement invented
    expect(ids.has('ACAD-C8-BGS-005')).toBe(false); // BGS — example facts only, no replacement invented
    expect(ids.has('ACAD-C8-BGS-019')).toBe(false); // BGS — example facts only, no replacement invented
    expect(ids.has('ACAD-C8-BGS-020')).toBe(false); // BGS — example facts only, no replacement invented
    expect(ids.has('ACAD-C8-ICT-005')).toBe(false); // ICT — example topics only, no replacement invented
    expect(ids.has('ACAD-C8-ICT-009')).toBe(false); // ICT — example topics only, no replacement invented
    expect(ids.has('ACAD-C8-ICT-013')).toBe(false); // ICT — direction only, no replacement invented
    expect(ids.has('C8S-015')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C8S-029')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C8S-031')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C8S-033')).toBe(false); // science-depth — rebuild has no explanation
    expect(ids.has('C8S-034')).toBe(false); // science-depth — rebuild has no explanation
  });

  it('the thirteen hard questions keep their reviewed difficulty (never silently downgraded)', () => {
    const hard = PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.difficulty === 'hard');
    expect(hard).toHaveLength(13);
    expect(hard.map((q) => q.id).sort()).toEqual([
      'ACAD-C3-MAT-017',
      'C6M-025',
      'C7M-004',
      'C7M-008',
      'C7M-016',
      'C7M-020',
      'C7M-024',
      'C7M-028',
      'C8M-008',
      'C8M-016',
      'C8M-020',
      'C8M-024',
      'C8M-028',
    ]);
  });

  it('derives 650 chapters with the right per-class/subject counts', () => {
    expect(PUBLIC_ACADEMIC_CHAPTERS).toHaveLength(650);
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

  it('helpers: class/subject lists (54 rows) and honest empties', () => {
    const rows = publicAcademicClassSubjects();
    expect(rows).toHaveLength(54);
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
    expect(rows).toContainEqual({
      classId: 'class-7',
      subjectId: 'math-depth',
      questionCount: 38,
      chapterCount: 11,
    });
    expect(rows).toContainEqual({
      classId: 'class-7',
      subjectId: 'science',
      questionCount: 26,
      chapterCount: 13,
    });
    expect(rows).toContainEqual({
      classId: 'class-8',
      subjectId: 'math-depth',
      questionCount: 38,
      chapterCount: 11,
    });
    expect(rows).toContainEqual({
      classId: 'class-8',
      subjectId: 'english',
      questionCount: 20,
      chapterCount: 11,
    });
    // Class 7 Science has no chapter 3 in the regular pool — its only
    // two questions (SCI-005/006) are REJECTED with no complete
    // replacement — but the depth pool does have a chapter 3.
    expect(publicAcademicChaptersFor('class-7', 'science')).toHaveLength(13);
    expect(
      publicAcademicChaptersFor('class-7', 'science').map((c) => c.id),
    ).not.toContain('acad-class-7-sci-chapter-3');
    expect(publicAcademicChaptersFor('class-9', 'math')).toEqual([]);
    expect(publicAcademicChaptersFor('class-3', 'ict')).toEqual([]);
    expect(publicAcademicChaptersFor('class-9', 'english')).toEqual([]);
    expect(publicAcademicQuestionsForChapter('acad-class-3-mat-chapter-1')).toHaveLength(3);
    expect(publicAcademicQuestionsForChapter('acad-class-3-eng-unit-1')).toHaveLength(4);
    expect(publicAcademicQuestionsForChapter('acad-class-6-mat-depth-chapter-1')).toHaveLength(5);
    expect(publicAcademicQuestionsForChapter('acad-class-6-eng-lesson-27')).toHaveLength(1);
    expect(publicAcademicQuestionsForChapter('acad-class-7-mat-depth-chapter-1')).toHaveLength(4);
    expect(publicAcademicQuestionsForChapter('acad-class-7-eng-unit-5')).toHaveLength(4);
    expect(publicAcademicQuestionsForChapter('acad-class-8-mat-depth-chapter-1')).toHaveLength(3);
    expect(publicAcademicQuestionsForChapter('acad-class-8-eng-unit-1')).toHaveLength(2);
    // Class 8 edge cases: the dotted grammar sub-number, the
    // Agriculture পাঠ-level chapter, and the unnumbered Bangla lesson.
    expect(publicAcademicQuestionsForChapter('acad-class-8-bgr-chapter-1-1')).toHaveLength(1);
    expect(publicAcademicQuestionsForChapter('acad-class-8-agr-chapter-3-lesson-6')).toHaveLength(1);
    expect(publicAcademicQuestionsForChapter('acad-class-8-ban-lesson-1')).toHaveLength(1);
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
