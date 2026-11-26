// Question Paper Generator — comparison fixes, 26 Nov 2026
// (Eduvelto vs Proshnobanai + eProshnoBank gap list):
// multi-section builder (G2+G3), subject-adaptive Q-kinds (A4),
// exercise-level selection (A3), swap-picker 5-cap lift (C),
// draft autosave (D), textbook-library link (G4), page numbers (F4).
// UX/feature patterns only — no competitor content, questions,
// branding or names anywhere.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  QPG_SECTION_TYPES,
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
  qpgDefaultSectionHeading,
  qpgMultiSectionTotalMarks,
  qpgPaperSections,
  qpgSectionTypeById,
  qpgSecondaryQKindsFor,
  qpgTypeForQKind,
  selectQpgQuestions,
  type QpgPaper,
  type QpgPaperSection,
  type QpgQuestion,
} from '../questionPaper';
import {
  QPG_DRAFT_KEY,
  clearQpgDraft,
  loadQpgDraft,
  saveQpgDraft,
  validateQpgDraft,
  type QpgDraft,
} from '../questionPaperDraft';
import { paginateQpgBlocks, qpgPaperPageItems } from '../questionPaperPdf';

const GENERATOR_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionPaperGeneratorPage.tsx'),
  'utf8',
);
const PDF_LIB_SRC = readFileSync(resolve(__dirname, '../questionPaperPdf.ts'), 'utf8');

function makeSetup(overrides: Partial<Parameters<typeof defaultPaperSetup>[0]> = {}) {
  return defaultPaperSetup({
    title: 'পরীক্ষা',
    subject: 'English',
    classLabel: 'শ্রেণি ৫',
    questionCount: 4,
    marksPerQuestion: 1,
    timeMinutes: 30,
    sectionHeading: 'ক-বিভাগ',
    ...overrides,
  });
}

function makePaper(overrides: Partial<QpgPaper> = {}): QpgPaper {
  const questions = QPG_VERIFIED_POOL.slice(0, 4);
  return buildQpgPaper({
    setup: makeSetup(),
    questions,
    isCustomVariant: false,
    kind: 'chapter-paper',
    patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র',
    patternLabelEn: 'Chapter-based paper',
    ...overrides,
  });
}

function makeDraft(overrides: Partial<QpgDraft> = {}): QpgDraft {
  return {
    version: 'v1',
    stream: 'general',
    classId: 'class-5',
    subjectId: 'english',
    chapterIds: ['ch-1'],
    topicIds: [],
    exerciseIds: [],
    term: 'first',
    examKind: 'half-yearly',
    qKind: 'mcq',
    sourceFilter: 'any',
    cognitiveFilter: 'any',
    natureFilter: 'any',
    selectedIds: ['q-1', 'q-2'],
    overrides: {},
    templateId: '',
    setCode: '',
    seed: 42,
    includeOmrSheet: false,
    savedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('multi-section builder (G2+G3)', () => {
  it('offers the primary-school section types, with the new ones included', () => {
    const ids = QPG_SECTION_TYPES.map((t) => t.id);
    expect(ids).toContain('mcq');
    expect(ids).toContain('short');
    expect(ids).toContain('fill-in-blanks');
    expect(ids).toContain('juktoborno');
    expect(ids).toContain('shobdartho');
    expect(ids).toContain('written');
    // Every type has a Bangla name, a question type, and a default heading.
    for (const t of QPG_SECTION_TYPES) {
      expect(t.nameBn.length).toBeGreaterThan(0);
      expect(qpgDefaultSectionHeading(t.id, 0).length).toBeGreaterThan(0);
      expect(qpgSectionTypeById(t.id)?.nameBn).toBe(t.nameBn);
    }
  });

  it('maps section types to question types honestly — no invented pool', () => {
    expect(qpgSectionTypeById('mcq')?.questionType).toBe('mcq');
    // Fill-in-blanks / যুক্তবর্ণ / শব্দার্থ draw from the verified
    // short-answer pool — there is no separate verified fill-in pool
    // today, so the section type is honest about its source.
    expect(qpgSectionTypeById('fill-in-blanks')?.questionType).toBe('short');
    expect(qpgSectionTypeById('juktoborno')?.questionType).toBe('short');
    expect(qpgSectionTypeById('shobdartho')?.questionType).toBe('short');
    expect(qpgSectionTypeById('written')?.questionType).toBe('written');
  });

  it('a single-section paper reads back as one synthetic section', () => {
    const paper = makePaper();
    const sections = qpgPaperSections(paper);
    expect(sections).toHaveLength(1);
    expect(sections[0].questionIds).toEqual(paper.questions.map((q) => q.id));
    expect(sections[0].marksPerQuestion).toBe(1);
    expect(sections[0].headingBn).toBe('ক-বিভাগ');
  });

  it('a multi-section paper reads back its own sections in order', () => {
    const pool = QPG_VERIFIED_POOL.slice(0, 4);
    const sections: QpgPaperSection[] = [
      {
        id: 'sec-mcq',
        headingBn: 'ক-বিভাগ',
        type: 'mcq',
        questionIds: pool.slice(0, 2).map((q) => q.id),
        marksPerQuestion: 1,
        answerCount: undefined,
      },
      {
        id: 'sec-short',
        headingBn: 'খ-বিভাগ',
        type: 'short',
        questionIds: pool.slice(2, 4).map((q) => q.id),
        marksPerQuestion: 2,
        answerCount: 1,
      },
    ];
    const paper = makePaper({ sections });
    expect(qpgPaperSections(paper)).toEqual(sections);
    // Total marks = 2×1 + 2×2 = 6.
    expect(qpgMultiSectionTotalMarks(sections)).toBe(6);
  });

  it('buildQpgPaper keeps its sections; the section total is computed by the editor', () => {
    const pool = QPG_VERIFIED_POOL.slice(0, 3);
    const sections: QpgPaperSection[] = [
      {
        id: 's1',
        headingBn: 'ক-বিভাগ',
        type: 'mcq',
        questionIds: pool.slice(0, 2).map((q) => q.id),
        marksPerQuestion: 1,
        answerCount: undefined,
      },
      {
        id: 's2',
        headingBn: 'খ-বিভাগ',
        type: 'short',
        questionIds: pool.slice(2).map((q) => q.id),
        marksPerQuestion: 5,
        answerCount: undefined,
      },
    ];
    const paper = buildQpgPaper({
      setup: makeSetup(),
      questions: pool,
      isCustomVariant: true,
      kind: 'chapter-paper',
      patternLabelBn: 'অধ্যায়ভিত্তিক প্রশ্নপত্র',
      patternLabelEn: 'Chapter-based paper',
      sections,
    });
    expect(paper.sections).toEqual(sections);
    // The editor (applyPaperEdits) owns the total: 2×1 + 1×5 = 7.
    expect(qpgMultiSectionTotalMarks(paper.sections ?? [])).toBe(7);
  });
});

describe('subject-adaptive question types (A4)', () => {
  it('adds রচনামূলক (written) for Bangla / English writing subjects', () => {
    for (const subjectId of ['bangla', 'english']) {
      const kinds = qpgSecondaryQKindsFor(subjectId).map((k) => k.id);
      expect(kinds).toContain('written');
    }
    const banglaKinds = qpgSecondaryQKindsFor('bangla');
    expect(banglaKinds.find((k) => k.id === 'written')?.nameBn).toContain('রচনামূলক');
  });

  it('does not offer written for Math / Science subjects', () => {
    for (const subjectId of ['math', 'general-science', 'physics']) {
      expect(qpgSecondaryQKindsFor(subjectId).map((k) => k.id)).not.toContain('written');
    }
  });

  it('written maps to the written question type', () => {
    expect(qpgTypeForQKind('written')).toBe('written');
  });

  it('selecting written with an empty verified pool is honestly 0 + a reason', () => {
    const result = selectQpgQuestions({
      chapterIds: [QPG_VERIFIED_POOL[0].chapterId],
      topicIds: [],
      type: 'written',
      difficulty: 'all',
      count: 5,
    });
    expect(result.questions).toHaveLength(0);
    expect(result.reasonsBn.join(' ')).toContain('রচনামূলক');
  });
});

describe('exercise-level selection (A3)', () => {
  it('filters a synthetic pool to the chosen exercise, and only it', () => {
    const base: QpgQuestion = {
      ...QPG_VERIFIED_POOL[0],
      id: 'ex-q-1',
      questionText: 'অনুশীলনী ১-এর প্রশ্ন',
      exerciseId: 'ex-1',
    };
    const other: QpgQuestion = {
      ...QPG_VERIFIED_POOL[0],
      id: 'ex-q-2',
      questionText: 'অনুশীলনী ২-এর প্রশ্ন',
      exerciseId: 'ex-2',
    };
    const noExercise: QpgQuestion = {
      ...QPG_VERIFIED_POOL[0],
      id: 'ex-q-3',
      questionText: 'অনুশীলনীবিহীন প্রশ্ন',
      exerciseId: undefined,
    };
    const pool = [base, other, noExercise];
    const result = selectQpgQuestions(
      {
        chapterIds: [base.chapterId],
        topicIds: [],
        exerciseIds: ['ex-1'],
        type: 'all',
        difficulty: 'all',
        count: 5,
      },
      pool,
    );
    expect(result.questions.map((q) => q.id)).toEqual(['ex-q-1']);
  });

  it('an exercise filter with no mapped questions is honestly 0 + a reason', () => {
    const result = selectQpgQuestions({
      chapterIds: [QPG_VERIFIED_POOL[0].chapterId],
      topicIds: [],
      exerciseIds: ['ex-1'],
      type: 'all',
      difficulty: 'all',
      count: 5,
    });
    expect(result.questions).toHaveLength(0);
    expect(result.reasonsBn.join(' ')).toContain('অনুশীলনী');
  });

  it('no exercise filter keeps the whole chapter (old behaviour)', () => {
    const result = selectQpgQuestions({
      chapterIds: [QPG_VERIFIED_POOL[0].chapterId],
      topicIds: [],
      type: 'all',
      difficulty: 'all',
      count: 100,
    });
    expect(result.questions.length).toBeGreaterThan(0);
  });
});

describe('draft autosave (D)', () => {
  /* Tests run under plain node (no jsdom): stub the global
   * localStorage the draft lib uses (same pattern as jobTaxonomy). */
  class MemoryStorage {
    private store = new Map<string, string>();
    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    setItem(key: string, value: string): void {
      this.store.set(key, value);
    }
    removeItem(key: string): void {
      this.store.delete(key);
    }
    clear(): void {
      this.store.clear();
    }
  }
  const storage = new MemoryStorage();
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;

  beforeEach(() => {
    storage.clear();
  });
  afterEach(() => {
    storage.clear();
  });

  it('round-trips a draft through localStorage', () => {
    const draft = makeDraft({ classId: 'class-6', seed: 7 });
    expect(saveQpgDraft(draft)).toBe(true);
    const loaded = loadQpgDraft();
    expect(loaded?.classId).toBe('class-6');
    expect(loaded?.seed).toBe(7);
    expect(loaded?.selectedIds).toEqual(['q-1', 'q-2']);
  });

  it('clearQpgDraft removes the draft', () => {
    saveQpgDraft(makeDraft());
    clearQpgDraft();
    expect(loadQpgDraft()).toBeNull();
    expect(storage.getItem(QPG_DRAFT_KEY)).toBeNull();
  });

  it('a corrupt or wrong-shaped draft is rejected, never thrown', () => {
    storage.setItem(QPG_DRAFT_KEY, '{not json');
    expect(loadQpgDraft()).toBeNull();
    expect(validateQpgDraft({ version: 'v0' })).toBeNull();
    expect(validateQpgDraft({ ...makeDraft(), stream: 'unknown' })).toBeNull();
    expect(validateQpgDraft({ ...makeDraft(), qKind: 'essay' })).toBeNull();
    expect(validateQpgDraft(makeDraft())).not.toBeNull();
  });
});

describe('page numbers + multi-section pagination (F4)', () => {
  it('qpgPaperPageItems orders questions under their section headings, empty sections included', () => {
    const pool = QPG_VERIFIED_POOL.slice(0, 3);
    const paper = makePaper({
      sections: [
        {
          id: 's1',
          headingBn: 'ক-বিভাগ',
          type: 'mcq',
          questionIds: pool.slice(0, 2).map((q) => q.id),
          marksPerQuestion: 1,
          answerCount: undefined,
        },
        {
          id: 's2',
          headingBn: 'খ-বিভাগ',
          type: 'short',
          questionIds: [],
          marksPerQuestion: 2,
          answerCount: undefined,
        },
      ],
    });
    const items = qpgPaperPageItems(paper);
    expect(items[0]).toEqual({ kind: 'question', index: 0 });
    expect(items[1]).toEqual({ kind: 'question', index: 1 });
    expect(items[2].kind).toBe('empty-section');
    if (items[2].kind === 'empty-section') {
      expect(items[2].section.id).toBe('s2');
      expect(items[2].section.headingBn).toBe('খ-বিভাগ');
    }
    expect(items).toHaveLength(3);
  });

  it('a single-section paper paginates as a plain question list (no section blocks)', () => {
    const paper = makePaper();
    const items = qpgPaperPageItems(paper);
    expect(items.every((i) => i.kind === 'question')).toBe(true);
    expect(items).toHaveLength(4);
    // paginateQpgBlocks takes block heights + page budgets, returns index pages.
    const pages = paginateQpgBlocks([120, 120, 120, 120], 500, 500);
    expect(pages).toEqual([[0, 1, 2, 3]]);
  });

  it('the PDF lib draws page numbers and the generator exposes the toggle', () => {
    expect(PDF_LIB_SRC).toContain('drawQpgPageNumber');
    expect(GENERATOR_SRC).toContain('pageNumbers');
    expect(GENERATOR_SRC).toContain('পাতার নম্বর');
  });
});

describe('swap-picker 5-cap lift (C) + library link (G4)', () => {
  it('no hard 5-cap remains on the swap / extras lists in the generator', () => {
    // The old code sliced both lists to 5; the new code shows 10 with a
    // load-more, or all when expanded.
    expect(GENERATOR_SRC).not.toContain('paperExtras.slice(0, 5)');
    expect(GENERATOR_SRC).not.toContain('.slice(0, 5)');
    expect(GENERATOR_SRC).toContain('আরও');
    expect(GENERATOR_SRC).toContain('দেখুন');
  });

  it('Step 4 links to the textbook library instead of a dead end', () => {
    expect(GENERATOR_SRC).toContain('বই দেখুন');
    expect(GENERATOR_SRC).toContain('to="/library"');
  });

  it('the multi-section editor exists in the generator', () => {
    expect(GENERATOR_SRC).toContain('বিভাগ যোগ করুন');
    expect(GENERATOR_SRC).toContain('editorSections');
    expect(GENERATOR_SRC).toContain('applyPaperEdits');
  });
});
