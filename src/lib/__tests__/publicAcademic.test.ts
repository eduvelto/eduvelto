// Eduvelto — combined verified Academic pool tests (Education Hub,
// 26 Nov 2026).
//
// The combined pool (Classes 3–10, thirty-one subjects) is the SINGLE
// verified source for both the Question Maker and the Education Hub
// chapter practice. These tests pin that it holds ONLY the 1,944
// reviewed questions (Class 3: 160, Class 4: 152, Class 5: 165,
// Class 6: 333, Class 7: 325, Class 8: 252, Class 9: 557 — Class 10
// shares the Class 9 pool, so no questions are stored under class-10),
// that the REJECTED items with no complete replacement
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
  'class-9/accounting': { questions: 22, chapters: 12 },
  'class-9/bangla-1st': { questions: 21, chapters: 21 },
  'class-9/bangla-2nd': { questions: 18, chapters: 13 },
  'class-9/bgs': { questions: 21, chapters: 11 },
  'class-9/biology': { questions: 22, chapters: 11 },
  'class-9/biology-depth': { questions: 32, chapters: 13 },
  'class-9/business': { questions: 22, chapters: 15 },
  'class-9/chemistry': { questions: 23, chapters: 10 },
  'class-9/chemistry-depth': { questions: 35, chapters: 12 },
  'class-9/civics': { questions: 22, chapters: 13 },
  'class-9/economics': { questions: 22, chapters: 12 },
  'class-9/english-1st': { questions: 22, chapters: 18 },
  'class-9/english-2nd': { questions: 21, chapters: 13 },
  'class-9/finance': { questions: 22, chapters: 17 },
  'class-9/geography': { questions: 20, chapters: 12 },
  'class-9/higher-math': { questions: 18, chapters: 14 },
  'class-9/higher-math-depth': { questions: 19, chapters: 13 },
  'class-9/history': { questions: 21, chapters: 12 },
  'class-9/ict': { questions: 21, chapters: 14 },
  'class-9/islam': { questions: 22, chapters: 12 },
  'class-9/math': { questions: 22, chapters: 14 },
  'class-9/math-depth': { questions: 35, chapters: 17 },
  'class-9/physics': { questions: 23, chapters: 11 },
  'class-9/physics-depth': { questions: 31, chapters: 13 },
};

describe('combined verified Academic pool (Classes 3–10, thirty-one subjects)', () => {
  it('holds exactly the 1,944 reviewed questions (160 + 152 + 165 + 333 + 325 + 252 + 557)', () => {
    expect(PUBLIC_ACADEMIC_QUESTIONS).toHaveLength(1944);
    expect(new Set(PUBLIC_ACADEMIC_QUESTIONS.map((q) => q.id)).size).toBe(1944);
    const byClass = (classId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.classId === classId);
    expect(byClass('class-3')).toHaveLength(160);
    expect(byClass('class-4')).toHaveLength(152);
    expect(byClass('class-5')).toHaveLength(165);
    expect(byClass('class-6')).toHaveLength(333);
    expect(byClass('class-7')).toHaveLength(325);
    expect(byClass('class-8')).toHaveLength(252);
    expect(byClass('class-9')).toHaveLength(557);
    // Class 10 shares the Class 9 pool — no questions are stored
    // under class-10 (the lookup helpers map it to class-9).
    expect(byClass('class-10')).toHaveLength(0);
    const bySubject = (subjectId: string) =>
      PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.subjectId === subjectId);
    expect(bySubject('english')).toHaveLength(158);
    expect(bySubject('bangla')).toHaveLength(146);
    expect(bySubject('math')).toHaveLength(182);
    expect(bySubject('science')).toHaveLength(156);
    expect(bySubject('bgs')).toHaveLength(173);
    expect(bySubject('islam')).toHaveLength(164);
    expect(bySubject('bangla-grammar')).toHaveLength(62);
    expect(bySubject('math-depth')).toHaveLength(150);
    expect(bySubject('science-depth')).toHaveLength(104);
    expect(bySubject('ict')).toHaveLength(77);
    expect(bySubject('agriculture')).toHaveLength(62);
    expect(bySubject('home-science')).toHaveLength(74);
    expect(bySubject('accounting')).toHaveLength(22);
    expect(bySubject('bangla-1st')).toHaveLength(21);
    expect(bySubject('bangla-2nd')).toHaveLength(18);
    expect(bySubject('biology')).toHaveLength(22);
    expect(bySubject('biology-depth')).toHaveLength(32);
    expect(bySubject('business')).toHaveLength(22);
    expect(bySubject('finance')).toHaveLength(22);
    expect(bySubject('chemistry')).toHaveLength(23);
    expect(bySubject('chemistry-depth')).toHaveLength(35);
    expect(bySubject('civics')).toHaveLength(22);
    expect(bySubject('history')).toHaveLength(21);
    expect(bySubject('economics')).toHaveLength(22);
    expect(bySubject('geography')).toHaveLength(20);
    expect(bySubject('english-1st')).toHaveLength(22);
    expect(bySubject('english-2nd')).toHaveLength(21);
    expect(bySubject('higher-math')).toHaveLength(18);
    expect(bySubject('higher-math-depth')).toHaveLength(19);
    expect(bySubject('physics')).toHaveLength(23);
    expect(bySubject('physics-depth')).toHaveLength(31);
  });

  it('every question is MCQ with 4 distinct options, one valid correct letter, and an NCTB citation', () => {
    // Two Class 9 Bangla 1st questions are verified against standard
    // literary references, NOT the NCTB book (the works are not in the
    // current NCTB সহপাঠ) — their sourceNote honestly has no 'NCTB'.
    const NON_NCTB_SOURCE = new Set(['ACAD-5010', 'ACAD-5011']);
    for (const q of PUBLIC_ACADEMIC_QUESTIONS) {
      expect(['class-3', 'class-4', 'class-5', 'class-6', 'class-7', 'class-8', 'class-9']).toContain(q.classId);
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
        'accounting',
        'bangla-1st',
        'bangla-2nd',
        'biology',
        'biology-depth',
        'business',
        'finance',
        'chemistry',
        'chemistry-depth',
        'civics',
        'history',
        'economics',
        'geography',
        'english-1st',
        'english-2nd',
        'higher-math',
        'higher-math-depth',
        'physics',
        'physics-depth',
      ]).toContain(q.subjectId);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      expect(q.questionText.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
      if (NON_NCTB_SOURCE.has(q.id)) {
        expect(q.sourceNote).not.toContain('NCTB');
        expect(q.sourceNote).toContain('standard literary reference');
      } else {
        expect(q.sourceNote).toContain('NCTB');
      }
      expect(q.chapterId).toMatch(
        /^acad-class-[3456789]-(eng|ban|bgr|mat-depth|mat|sci-depth|sci|bgs|isl|ict|agr|hsc|acc|ban-1st|ban-2nd|bio-depth|bio|bus|fin|che-depth|che|civ|his|eco|geo|eng-1st|eng-2nd|hmat-depth|hmat|phy-depth|phy)-/,
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
    expect(ids.has('ACAD-5108')).toBe(false); // biology malaria — keep-as-WHO vs drop decision open
    expect(ids.has('ACAD-5096')).toBe(false); // chemistry — placeholder citation, teacher input needed
    expect(ids.has('C910P-018')).toBe(false); // physics-depth heat transfer — teacher decision needed
    expect(ids.has('ACAD-0018')).toBe(false); // bangla-2nd ণত্ব-ষত্ব — REJECTED, no replacement
    expect(ids.has('ACAD-0052')).toBe(false); // math coin-toss probability — REJECTED, no probability chapter
    expect(ids.has('ACAD-0053')).toBe(false); // higher-math matrix determinant — REJECTED, HSC-level
    expect(ids.has('ACAD-5061')).toBe(false); // higher-math matrix determinant — REJECTED, HSC-level
    expect(ids.has('ACAD-5068')).toBe(false); // higher-math midpoint formula — REJECTED, not in Ch 11
  });

  it('the twenty-six hard questions keep their reviewed difficulty (never silently downgraded)', () => {
    const hard = PUBLIC_ACADEMIC_QUESTIONS.filter((q) => q.difficulty === 'hard');
    expect(hard).toHaveLength(26);
    expect(hard.map((q) => q.id).sort()).toEqual([
      'ACAD-0036',
      'ACAD-0059',
      'ACAD-1040',
      'ACAD-1048',
      'ACAD-5042',
      'ACAD-5063',
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
      'C910HM-004',
      'C910HM-010',
      'C910M-006',
      'C910M-010',
      'C910M-021',
      'C910M-025',
      'C910M-033',
    ]);
  });

  it('derives 973 chapters with the right per-class/subject counts', () => {
    expect(PUBLIC_ACADEMIC_CHAPTERS).toHaveLength(973);
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

  it('helpers: class/subject lists (102 rows) and honest empties', () => {
    const rows = publicAcademicClassSubjects();
    expect(rows).toHaveLength(102);
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
    expect(rows).toContainEqual({
      classId: 'class-9',
      subjectId: 'math',
      questionCount: 22,
      chapterCount: 14,
    });
    expect(rows).toContainEqual({
      classId: 'class-9',
      subjectId: 'bangla-1st',
      questionCount: 21,
      chapterCount: 21,
    });
    expect(rows).toContainEqual({
      classId: 'class-9',
      subjectId: 'physics-depth',
      questionCount: 31,
      chapterCount: 13,
    });
    // Class 10 shares the Class 9 pool — same rows, same counts.
    expect(rows).toContainEqual({
      classId: 'class-10',
      subjectId: 'math',
      questionCount: 22,
      chapterCount: 14,
    });
    expect(rows).toContainEqual({
      classId: 'class-10',
      subjectId: 'bangla-1st',
      questionCount: 21,
      chapterCount: 21,
    });
    expect(rows).toContainEqual({
      classId: 'class-10',
      subjectId: 'physics-depth',
      questionCount: 31,
      chapterCount: 13,
    });
    // Class 7 Science has no chapter 3 in the regular pool — its only
    // two questions (SCI-005/006) are REJECTED with no complete
    // replacement — but the depth pool does have a chapter 3.
    expect(publicAcademicChaptersFor('class-7', 'science')).toHaveLength(13);
    expect(
      publicAcademicChaptersFor('class-7', 'science').map((c) => c.id),
    ).not.toContain('acad-class-7-sci-chapter-3');
    // Class 9 is live now — its subjects resolve, and Class 10 maps
    // to the same chapters (same chapter IDs, classId 'class-10').
    expect(publicAcademicChaptersFor('class-9', 'math')).toHaveLength(14);
    expect(publicAcademicChaptersFor('class-10', 'math')).toHaveLength(14);
    expect(publicAcademicChaptersFor('class-10', 'math').map((c) => c.id)).toEqual(
      publicAcademicChaptersFor('class-9', 'math').map((c) => c.id),
    );
    expect(publicAcademicChaptersFor('class-10', 'math')[0].classId).toBe('class-10');
    expect(publicAcademicChaptersFor('class-9', 'bangla-1st')).toHaveLength(21);
    expect(publicAcademicChaptersFor('class-10', 'bangla-1st')).toHaveLength(21);
    // The honest empty moved to Class 11 (no verified questions yet).
    expect(publicAcademicChaptersFor('class-11', 'math')).toEqual([]);
    expect(publicAcademicChaptersFor('class-11', 'english')).toEqual([]);
    expect(publicAcademicChaptersFor('class-3', 'ict')).toEqual([]);
    expect(publicAcademicChaptersFor('class-9', 'english')).toEqual([]);
    expect(publicAcademicChaptersFor('class-10', 'english')).toEqual([]);
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
    // Class 9 edge cases: the numbered chapter with a canonical title,
    // the topical ICT chapter (no canonical title for its unit), the
    // topical Bangla 1st chapter, and the no-title citations resolved
    // to their numbered chapters (accounting Ch1, economics Ch1).
    expect(publicAcademicQuestionsForChapter('acad-class-9-mat-chapter-1')).toHaveLength(2);
    expect(publicAcademicQuestionsForChapter('acad-class-9-ict-topic-1')).toHaveLength(1);
    expect(publicAcademicQuestionsForChapter('acad-class-9-ban-1st-topic-1')).toHaveLength(1);
    expect(publicAcademicQuestionsForChapter('acad-class-9-acc-chapter-1')).toHaveLength(2);
    expect(publicAcademicQuestionsForChapter('acad-class-9-eco-chapter-1')).toHaveLength(2);
    expect(publicAcademicQuestionsForChapter('acad-class-9-mat-depth-chapter-1')).toHaveLength(2);
    // Depth files keep their OWN titles (not the regular file's):
    // physics-depth Ch6 is 'তাপের প্রভাবে পদার্থের পরিবর্তন', not the
    // regular 'বস্তুর ওপর তাপের প্রভাব'.
    expect(
      publicAcademicChaptersFor('class-9', 'physics-depth').find(
        (c) => c.id === 'acad-class-9-phy-depth-chapter-6',
      )?.name,
    ).toBe('অধ্যায় ৬: তাপের প্রভাবে পদার্থের পরিবর্তন');
    expect(
      publicAcademicChaptersFor('class-9', 'physics').find(
        (c) => c.id === 'acad-class-9-phy-chapter-6',
      )?.name,
    ).toBe('অধ্যায় ৬: বস্তুর ওপর তাপের প্রভাব');
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
