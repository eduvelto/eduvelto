// Question Paper Generator — CQ (creative / সৃজনশীল) wiring tests.
// Covers the reviewed CQ pool (359 usable, Classes 9–12), chapter
// mapping (shared vs CQ-only chapters), CQ / Combined selection,
// section + marks math, and the MCQ-only answer key.
import { describe, it, expect } from 'vitest';
import { PUBLIC_ACADEMIC_CQ_QUESTIONS } from '../publicAcademicCq';
import {
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
  qpgChaptersFor,
  qpgCqQuestions,
  qpgMcqAnswerKey,
  qpgMcqQuestions,
  qpgQuestionsTimeMinutes,
  qpgQuestionsTotalMarks,
  qpgSectionsForQuestions,
  qpgSubjectsFor,
  selectQpgQuestions,
} from '../questionPaper';

/** Total CQ across every subject of a class (sums the per-chapter cq counts). */
const cqTotalForClass = (classId: string) =>
  qpgSubjectsFor('general', classId).reduce(
    (sum, s) =>
      sum +
      qpgChaptersFor('general', classId, s.id).reduce((a, c) => a + (c.cqVerifiedCount ?? 0), 0),
    0,
  );

const CQ = PUBLIC_ACADEMIC_CQ_QUESTIONS;

describe('CQ pool (reviewed, Classes 9–12)', () => {
  it('holds 359 usable CQ: 190 Class 9–10 + 169 Class 11–12, unique ids', () => {
    expect(CQ).toHaveLength(359);
    expect(new Set(CQ.map((q) => q.id)).size).toBe(359);
    expect(CQ.filter((q) => q.classId === 'class-9')).toHaveLength(190);
    expect(CQ.filter((q) => q.classId === 'class-11')).toHaveLength(169);
    // No CQ for Classes 3–8 — never claim coverage that does not exist.
    for (const q of CQ) expect(['class-9', 'class-11']).toContain(q.classId);
  });

  it('every CQ is one stimulus + 4 parts (ক 1, খ 2, গ 3, ঘ 4 = 10) with a marking outline per part', () => {
    for (const q of CQ) {
      expect(q.stimulus.trim().length).toBeGreaterThan(0);
      expect(q.parts).toHaveLength(4);
      expect(q.parts.map((p) => p.label)).toEqual(['ক', 'খ', 'গ', 'ঘ']);
      expect(q.parts.map((p) => p.marks)).toEqual([1, 2, 3, 4]);
      expect(q.parts.reduce((a, p) => a + p.marks, 0)).toBe(10);
      for (const p of q.parts) {
        expect(p.question.trim().length).toBeGreaterThan(0);
        // Raw CQ pool field is snake_case (answer_outline); the QPG
        // mapper renames it to answerOutline.
        expect(p.answer_outline.trim().length).toBeGreaterThan(0);
      }
      expect(q.topicId).toBe('cq');
      expect(q.chapterId.startsWith('acad-class-')).toBe(true);
    }
  });

  it('the HELD question CQ-1112-020 (English graph — no bar graph supplied) is NOT in the pool', () => {
    expect(CQ.some((q) => q.id === 'CQ-1112-020')).toBe(false);
    expect(QPG_VERIFIED_POOL.some((q) => q.id === 'CQ-1112-020')).toBe(false);
  });

  it('the first CQ maps to its chapter (spot check: CQ-910-151, Accounting Ch.1)', () => {
    const q = CQ.find((x) => x.id === 'CQ-910-151');
    expect(q).toBeDefined();
    expect(q!.chapterId).toBe('acad-class-9-acc-chapter-1');
    expect(q!.subjectId).toBe('accounting');
  });
});

describe('CQ chapter mapping', () => {
  it('CQ-only chapters appear with verifiedCount 0 and a CQ count; merged chapters carry a cq topic', () => {
    // Class 9 Math: 1 CQ-only chapter + 11 merged chapters (12 CQ).
    const ch9mat = qpgChaptersFor('general', 'class-9', 'math');
    const cqOnly = ch9mat.filter((c) => c.verifiedCount === 0 && (c.cqVerifiedCount ?? 0) > 0);
    expect(cqOnly.length).toBe(1);
    for (const c of cqOnly) {
      expect(c.cqVerifiedCount).toBeGreaterThan(0);
      expect(c.topics.map((t) => t.id)).toEqual(['cq']);
    }
    const merged = ch9mat.filter((c) => c.verifiedCount > 0 && (c.cqVerifiedCount ?? 0) > 0);
    expect(merged.length).toBe(11);
    for (const c of merged) {
      expect(c.topics.some((t) => t.id === 'cq' && t.verifiedCount === c.cqVerifiedCount)).toBe(true);
    }
    // Class 9 CQ total across chapters = 190; Class 11 = 169.
    expect(cqTotalForClass('class-9')).toBe(190);
    expect(cqTotalForClass('class-11')).toBe(169);
    // Classes 3–8 have no CQ at all.
    expect(cqTotalForClass('class-6')).toBe(0);
  });
});

describe('CQ / Combined selection', () => {
  // A chapter holding BOTH MCQ and CQ (Class 9 Math — 11 merged
  // chapters), derived from the pool so the test survives a re-map.
  const mixedChapterId = (() => {
    const cqChapters = new Set(CQ.map((q) => q.chapterId));
    const mcq = QPG_VERIFIED_POOL.find(
      (q) => q.type === 'mcq' && cqChapters.has(q.chapterId) && q.chapterId.startsWith('acad-class-9-'),
    );
    return mcq!.chapterId;
  })();
  const cqOnlyChapterId = CQ.find(
    (q) => !QPG_VERIFIED_POOL.some((m) => m.type === 'mcq' && m.chapterId === q.chapterId),
  )!.chapterId;

  it('type cq returns only CQ from a mixed chapter; type mcq returns only MCQ', () => {
    const cq = selectQpgQuestions({ chapterIds: [mixedChapterId], topicIds: [], type: 'cq', difficulty: 'all', count: 100 });
    expect(cq.available).toBeGreaterThan(0);
    expect(cq.questions.every((q) => q.type === 'cq')).toBe(true);
    const mcq = selectQpgQuestions({ chapterIds: [mixedChapterId], topicIds: [], type: 'mcq', difficulty: 'all', count: 100 });
    expect(mcq.available).toBeGreaterThan(0);
    expect(mcq.questions.every((q) => q.type === 'mcq')).toBe(true);
  });

  it("type all returns MCQ + CQ from a mixed chapter; topic 'cq' selects CQ only", () => {
    const all = selectQpgQuestions({ chapterIds: [mixedChapterId], topicIds: [], type: 'all', difficulty: 'all', count: 100 });
    expect(all.questions.some((q) => q.type === 'mcq')).toBe(true);
    expect(all.questions.some((q) => q.type === 'cq')).toBe(true);
    const cqTopic = selectQpgQuestions({ chapterIds: [mixedChapterId], topicIds: ['cq'], type: 'all', difficulty: 'all', count: 100 });
    expect(cqTopic.available).toBeGreaterThan(0);
    expect(cqTopic.questions.every((q) => q.type === 'cq')).toBe(true);
  });

  it('a CQ-only chapter selects CQ but honestly reports zero MCQ', () => {
    const cq = selectQpgQuestions({ chapterIds: [cqOnlyChapterId], topicIds: [], type: 'cq', difficulty: 'all', count: 100 });
    expect(cq.available).toBeGreaterThan(0);
    const mcq = selectQpgQuestions({ chapterIds: [cqOnlyChapterId], topicIds: [], type: 'mcq', difficulty: 'all', count: 100 });
    expect(mcq.available).toBe(0);
    expect(mcq.reasonsBn.join(' ')).toContain('MCQ');
  });
});

describe('CQ sections, marks and answer key', () => {
  it('sections split a mixed list into MCQ (1 mark) then CQ (10 marks); totals follow the mix', () => {
    const mcq = QPG_VERIFIED_POOL.filter((q) => q.type === 'mcq').slice(0, 3);
    const cq = QPG_VERIFIED_POOL.filter((q) => q.type === 'cq').slice(0, 2);
    const mixed = [...mcq, ...cq];
    const sections = qpgSectionsForQuestions(mixed);
    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe('mcq');
    expect(sections[0].marksPerQuestion).toBe(1);
    expect(sections[0].questionIds).toHaveLength(3);
    expect(sections[1].type).toBe('cq');
    expect(sections[1].marksPerQuestion).toBe(10);
    expect(sections[1].questionIds).toHaveLength(2);
    expect(qpgQuestionsTotalMarks(mixed)).toBe(3 * 1 + 2 * 10);
    expect(qpgQuestionsTimeMinutes(mixed)).toBe(3 * 1 + 2 * 20);
    expect(qpgSectionsForQuestions(cq)).toHaveLength(1);
    expect(qpgSectionsForQuestions(cq)[0].type).toBe('cq');
    expect(qpgSectionsForQuestions(mcq)).toHaveLength(1);
    expect(qpgSectionsForQuestions(mcq)[0].type).toBe('mcq');
  });

  it('a Combined paper answer key is MCQ-only (paper numbering preserved); a CQ-only paper has no key', () => {
    const mcq = QPG_VERIFIED_POOL.filter((q) => q.type === 'mcq').slice(0, 2);
    const cq = QPG_VERIFIED_POOL.filter((q) => q.type === 'cq').slice(0, 2);
    const setup = defaultPaperSetup({
      title: 'Test',
      subject: 'Test',
      classLabel: 'Class 9',
      questionCount: 4,
      marksPerQuestion: 1,
      timeMinutes: 60,
      sectionHeading: 'Test',
      totalMarks: qpgQuestionsTotalMarks([...mcq, ...cq]),
    });
    const paper = buildQpgPaper({
      setup,
      questions: [...mcq, ...cq],
      sections: qpgSectionsForQuestions([...mcq, ...cq]),
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'Test',
      patternLabelEn: 'Test',
    });
    expect(paper.answerKey).toEqual([mcq[0].correctLetter, mcq[1].correctLetter]);
    expect(paper.answerKey).toHaveLength(2);
    expect(qpgMcqAnswerKey([...mcq, ...cq])).toEqual(paper.answerKey);
    expect(qpgMcqQuestions([...mcq, ...cq])).toHaveLength(2);
    expect(qpgCqQuestions([...mcq, ...cq])).toHaveLength(2);
    const cqOnly = buildQpgPaper({
      setup,
      questions: cq,
      sections: qpgSectionsForQuestions(cq),
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'Test',
      patternLabelEn: 'Test',
    });
    expect(cqOnly.answerKey).toEqual([]);
  });
});
