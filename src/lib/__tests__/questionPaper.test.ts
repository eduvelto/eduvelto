// Question Paper Generator (Milestone 2.5 MVP) — unit tests.
// Verified-only pool, chapter-first selection, verified exam patterns
// (Track 3), free-vs-Pro customization split, and the honest limits
// (no invented questions, no full mock from 35 questions).
import { describe, it, expect } from 'vitest';
import {
  QPG_BORDER_CREDIT,
  QPG_CHEAPEST_ANNUAL_BDT,
  QPG_FREE_MONTHLY_LIMIT,
  QPG_PRICE_TIERS,
  QPG_PRO_MONTHLY_BDT,
  QPG_PRO_PER_PAPER_BDT,
  QPG_PRO_PLAN_AMOUNTS,
  QPG_VERIFIED_CHAPTER_ID,
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  clearQpgFlowPrefill,
  defaultPaperSetup,
  loadQpgFlowPrefill,
  qpgChaptersFor,
  qpgLevelFor,
  qpgModelSectionQuestions,
  qpgModelTests,
  qpgTypeForQKind,
  qpgVerifiedChapter,
  saveQpgFlowPrefill,
  selectQpgQuestions,
} from '../questionPaper';

describe('verified pool (MVP content)', () => {
  it('holds exactly the 35 owner-verified BCS English questions', () => {
    expect(QPG_VERIFIED_POOL).toHaveLength(35);
    expect(new Set(QPG_VERIFIED_POOL.map((q) => q.id)).size).toBe(35);
  });

  it('every question is verified, MCQ, and linked to the chapter', () => {
    for (const q of QPG_VERIFIED_POOL) {
      expect(q.verified).toBe(true);
      expect(q.type).toBe('mcq');
      expect(q.chapterId).toBe(QPG_VERIFIED_CHAPTER_ID);
      expect(q.options).toHaveLength(4);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
    }
  });

  it('topics stay topics — the chapter is one unit, not 13 relabelled topics', () => {
    const chapter = qpgVerifiedChapter();
    expect(chapter.topics).toHaveLength(13);
    expect(chapter.verifiedCount).toBe(35);
    expect(chapter.topics.reduce((a, t) => a + t.verifiedCount, 0)).toBe(35);
  });

  it('no other class/subject has verified chapters yet (honest empty state)', () => {
    expect(qpgChaptersFor('general', 'class-9', 'english')).toEqual([]);
    expect(qpgChaptersFor('general', 'class-5', 'math')).toEqual([]);
    expect(qpgChaptersFor('madrasah', 'dakhil', 'arabic')).toEqual([]);
    expect(qpgChaptersFor('general', 'honours', 'english')).toHaveLength(1);
  });
});

describe('chapter-first selection', () => {
  const base = {
    chapterIds: [QPG_VERIFIED_CHAPTER_ID],
    topicIds: [] as string[],
    type: 'mcq' as const,
    difficulty: 'all' as const,
    count: 10,
  };

  it('selects the first N verified questions in batch order', () => {
    const r = selectQpgQuestions(base);
    expect(r.questions).toHaveLength(10);
    expect(r.available).toBe(35);
    expect(r.shortfall).toBe(0);
    expect(r.questions[0].id).toBe('bcs-eng-001');
  });

  it('reports a shortfall instead of inventing questions', () => {
    const r = selectQpgQuestions({ ...base, count: 50 });
    expect(r.questions).toHaveLength(35);
    expect(r.shortfall).toBe(15);
    expect(r.reasonsBn.join(' ')).toContain('ঘাটতি');
  });

  it('topic filters work inside the chapter', () => {
    const r = selectQpgQuestions({ ...base, topicIds: ['tense'], count: 100 });
    expect(r.available).toBe(3);
    expect(r.questions.every((q) => q.topicId === 'tense')).toBe(true);
  });

  it('multiple chapters select (single-chapter pool today)', () => {
    const r = selectQpgQuestions({ ...base, chapterIds: [QPG_VERIFIED_CHAPTER_ID, 'missing-chapter'] });
    expect(r.available).toBe(35);
  });

  it('CQ / short types honestly return zero (verified pool is MCQ-only)', () => {
    expect(selectQpgQuestions({ ...base, type: 'cq' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, type: 'short' }).available).toBe(0);
    expect(selectQpgQuestions({ ...base, type: 'cq' }).reasonsBn.join(' ')).toContain('MCQ');
  });

  it('a specific difficulty honestly returns zero (no difficulty tags yet)', () => {
    const r = selectQpgQuestions({ ...base, difficulty: 'medium' });
    expect(r.available).toBe(0);
    expect(r.reasonsBn.join(' ')).toContain('কাঠিন্য');
  });

  it('an unknown chapter honestly returns zero with the empty-state reason', () => {
    const r = selectQpgQuestions({ ...base, chapterIds: ['no-such-chapter'] });
    expect(r.available).toBe(0);
    expect(r.reasonsBn.join(' ')).toContain('এখনো তৈরি হয়নি');
  });
});

describe('Track 3 — verified exam patterns only', () => {
  it('BCS is 200Q / 120min with the 50th split summing to 200', () => {
    const bcs = qpgModelTests().find((t) => t.examSlug === 'bcs');
    expect(bcs?.questionCount).toBe(200);
    expect(bcs?.timeMinutes).toBe(120);
    expect(bcs?.subjects.map((s) => s.marks)).toEqual([30, 30, 25, 25, 10, 15, 15, 20, 15, 15]);
    expect(bcs?.subjects.reduce((a, s) => a + s.marks, 0)).toBe(200);
    expect(bcs?.negativeMarking).toBe(0.5);
  });

  it('Bank is 100Q / 60min, Primary defaults to 90Q / 90min, NTRCA 100Q / 60min', () => {
    const tests = qpgModelTests();
    const bank = tests.find((t) => t.examSlug === 'bank');
    expect(bank?.questionCount).toBe(100);
    expect(bank?.timeMinutes).toBe(60);
    const primary = tests.find((t) => t.examSlug === 'primary-teacher');
    expect(primary?.questionCount).toBe(90);
    expect(primary?.timeMinutes).toBe(90);
    const ntrca = tests.find((t) => t.examSlug === 'ntrca');
    expect(ntrca?.questionCount).toBe(100);
    expect(ntrca?.timeMinutes).toBe(60);
    expect(ntrca?.patternStatus).toBe('last-verified-18th');
  });

  it('NU Admission is 100 MCQ / 100 marks / 1h, sections 20+20+20+40, no negative marking', () => {
    const nu = qpgModelTests().find((t) => t.examSlug === 'nu-admission');
    expect(nu?.questionCount).toBe(100);
    expect(nu?.timeMinutes).toBe(60);
    expect(nu?.subjects.map((s) => s.marks)).toEqual([20, 20, 20, 40]);
    expect(nu?.negativeMarking).toBeNull();
  });

  it('no full mock is possible today — 35 verified vs 200/100/90 needed', () => {
    for (const t of qpgModelTests()) {
      expect(t.fullMockPossible).toBe(false);
      expect(t.totalVerifiedAvailable).toBeLessThan(t.questionCount);
    }
    const bcs = qpgModelTests().find((t) => t.examSlug === 'bcs');
    expect(bcs?.totalVerifiedAvailable).toBe(35);
  });

  it('only BCS English has verified questions; other exams/subjects have zero', () => {
    expect(qpgModelSectionQuestions('bcs', 'English Language & Literature')).toHaveLength(35);
    expect(qpgModelSectionQuestions('bank', 'English')).toHaveLength(0);
    expect(qpgModelSectionQuestions('primary-teacher', 'English')).toHaveLength(0);
    expect(qpgModelSectionQuestions('nu-admission', 'English')).toHaveLength(0);
  });
});

describe('paper setup — free text, Pro layout', () => {
  it('default setup pre-fills marks from the question count', () => {
    const setup = defaultPaperSetup({
      title: 'প্রশ্নপত্র — English (অনার্স)',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 10,
      marksPerQuestion: 1,
      timeMinutes: 30,
      sectionHeading: 'ক-বিভাগ: MCQ',
    });
    expect(setup.totalMarks).toBe(10);
    expect(setup.title).toContain('প্রশ্নপত্র');
    // Every paper-text field exists and is a plain editable value.
    for (const key of ['title', 'institutionName', 'subject', 'classLabel', 'examDate', 'instructions', 'sectionHeading'] as const) {
      expect(typeof setup[key]).toBe('string');
    }
  });

  it('a built paper keeps its (edited) setup verbatim', () => {
    const setup = defaultPaperSetup({
      title: 'বার্ষিক পরীক্ষা ২০২৬',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 5,
      marksPerQuestion: 1,
      timeMinutes: 30,
      sectionHeading: 'ক-বিভাগ',
    });
    const paper = buildQpgPaper({
      setup,
      questions: QPG_VERIFIED_POOL.slice(0, 5),
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র',
      patternLabelEn: 'Chapter-based paper',
    });
    expect(paper.setup.title).toBe('বার্ষিক পরীক্ষা ২০২৬');
    expect(paper.questions).toHaveLength(5);
    expect(paper.isCustomVariant).toBe(false);
  });

  it('freemium prices are the owner-final ones (PRICING FINAL, 25 Nov 09:34)', () => {
    expect(QPG_FREE_MONTHLY_LIMIT).toBe(3);
    expect(QPG_PRO_PER_PAPER_BDT).toBe(49);
    expect(QPG_PRO_MONTHLY_BDT).toBe(199);
    // No single all-in-one yearly tier anymore — the table IS the pricing.
    expect(QPG_PRICE_TIERS).toHaveLength(18);
    expect(QPG_CHEAPEST_ANNUAL_BDT).toBe(150);
    expect(QPG_PRO_PLAN_AMOUNTS['class-3']).toBe(150);
    expect(QPG_PRO_PLAN_AMOUNTS['class-9-10']).toBe(450);
    expect(QPG_PRO_PLAN_AMOUNTS['bundle-3-10']).toBe(1200);
    expect(QPG_PRO_PLAN_AMOUNTS['coaching-3-12']).toBe(1500);
  });

  it('every tier is exactly 30% of the market price (70% off) — the owner table, pair by pair', () => {
    // The owner's table is authoritative (brief 25 Nov 09:34, arithmetic
    // verified there). NOTE: the brief says "nearest ৳10", but 249×0.3 =
    // 74.7 → ৳75 in the table — the table follows nearest ৳5 (74.7→75,
    // while nearest ৳10 would give 70). The table value ৳75 stands;
    // the rounding wording gap is flagged in the MVP report.
    const expected: Record<string, [number, number]> = {
      'class-3': [150, 499],
      'class-4': [180, 599],
      'class-5': [210, 699],
      'class-6-8': [300, 999],
      'class-9-10': [450, 1499],
      'class-11-12': [390, 1299],
      'per-subject': [75, 249],
      'subject-teacher': [210, 699],
      'bundle-3-5': [450, 1499],
      'bundle-6-8': [750, 2499],
      'bundle-3-8': [900, 2999],
      'bundle-6-10': [1050, 3499],
      'bundle-3-10': [1200, 3999],
      'coaching-5-8': [810, 2699],
      'coaching-5-10': [1110, 3699],
      'coaching-3-10': [1200, 3999],
      'coaching-6-12': [1350, 4499],
      'coaching-3-12': [1500, 4999],
    };
    expect(QPG_PRICE_TIERS).toHaveLength(Object.keys(expected).length);
    for (const t of QPG_PRICE_TIERS) {
      expect([t.eduveltoBdt, t.marketBdt]).toEqual(expected[t.id]);
      // Effective rule the table follows: 30%, nearest ৳5.
      expect(t.eduveltoBdt).toBe(Math.round((t.marketBdt * 0.3) / 5) * 5);
    }
  });

  it('the FINAL border wording is used — the old phrase appears nowhere in this module', () => {
    expect(QPG_BORDER_CREDIT).toBe('Powered by Eduvelto.com');
  });
});

describe('level-aware step 2 (pattern 3, sprint 26 Nov 2026)', () => {
  it('primary is Class 3–5 + Ebtedayi, secondary is 6–12 + Dakhil/Alim, Honours is tertiary', () => {
    expect(qpgLevelFor('general', 'class-3')).toBe('primary');
    expect(qpgLevelFor('general', 'class-5')).toBe('primary');
    expect(qpgLevelFor('madrasah', 'ebtedayi')).toBe('primary');
    expect(qpgLevelFor('general', 'class-6')).toBe('secondary');
    expect(qpgLevelFor('general', 'class-12')).toBe('secondary');
    expect(qpgLevelFor('madrasah', 'dakhil')).toBe('secondary');
    expect(qpgLevelFor('madrasah', 'alim')).toBe('secondary');
    expect(qpgLevelFor('general', 'honours')).toBe('tertiary');
    expect(qpgLevelFor('job_admission', 'bcs')).toBe('job');
  });

  it('question-kind mapping: mcq -> mcq, creative -> cq, combined -> all (no type filter)', () => {
    expect(qpgTypeForQKind('mcq')).toBe('mcq');
    expect(qpgTypeForQKind('creative')).toBe('cq');
    expect(qpgTypeForQKind('combined')).toBe('all');
  });

  it("combined ('all') selects the verified MCQs without the non-MCQ warning", () => {
    const r = selectQpgQuestions({
      chapterIds: [QPG_VERIFIED_CHAPTER_ID],
      topicIds: [],
      type: 'all',
      difficulty: 'all',
      count: 35,
    });
    expect(r.available).toBe(35);
    expect(r.questions).toHaveLength(35);
    expect(r.reasonsBn.join(' ')).not.toContain('শুধু MCQ আছে');
  });
});

describe('two-flow prefill (pattern 2, sprint 26 Nov 2026)', () => {
  it('prefill helpers are safe with no sessionStorage (node) — no throw, null/false', () => {
    expect(
      saveQpgFlowPrefill({
        stream: 'general',
        classId: 'honours',
        subjectId: 'english',
        chapterIds: [QPG_VERIFIED_CHAPTER_ID],
      }),
    ).toBe(false);
    expect(loadQpgFlowPrefill()).toBeNull();
    expect(() => clearQpgFlowPrefill()).not.toThrow();
  });
});
