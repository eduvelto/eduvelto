// Question Paper Generator — Day 4 (sprint): Auto Set Shuffler +
// OMR Evaluator attach, end-to-end verification.
//
// Covers what the Turn 32 master tests do not: the four sets are
// pairwise different (not just "খ differs from ক"), the per-set key
// follows the SHUFFLED order (never the original order), a paper
// built from a set carries that set's key, the header auto-fills
// from the setup, the OMR toggle reaches the PREVIEW (not just the
// PDF downloads), and the evaluator loads the paper key from the
// same sessionStorage key the generator writes — with no Pro gate.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  QPG_VERIFIED_POOL,
  buildQpgPaper,
  defaultPaperSetup,
} from '../questionPaper';
import { buildQuestionSets, questionsForSet } from '../questionPaperSets';
import { QPG_A4_PAGE_HEIGHT_PX, paginateQpgBlocks } from '../questionPaperPdf';

const GENERATOR_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionPaperGeneratorPage.tsx'),
  'utf8',
);
const OMR_PAGE_SRC = readFileSync(resolve(__dirname, '../../pages/OmrEvaluatorPage.tsx'), 'utf8');
const PDF_LIB_SRC = readFileSync(resolve(__dirname, '../questionPaperPdf.ts'), 'utf8');
const APP_SRC = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');

const QS = QPG_VERIFIED_POOL.slice(0, 10);
const ORIGINAL_IDS = QS.map((q) => q.id);
const ORIGINAL_KEY = QS.map((q) => q.correctLetter);

describe('set shuffler end-to-end (Day 4)', () => {
  it('all four sets have pairwise different orders', () => {
    const sets = buildQuestionSets(QS, 42);
    const orders = sets.map((s) => s.questions.map((q) => q.id).join(','));
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        expect(orders[i]).not.toBe(orders[j]);
      }
    }
    // Every set is the same questions, only reordered.
    for (const s of sets) {
      expect([...s.questions.map((q) => q.id)].sort()).toEqual([...ORIGINAL_IDS].sort());
    }
  });

  it('the same seed reproduces the same four sets, twice', () => {
    const a = buildQuestionSets(QS, 12345);
    const b = buildQuestionSets(QS, 12345);
    expect(a.map((s) => s.questions.map((q) => q.id))).toEqual(
      b.map((s) => s.questions.map((q) => q.id)),
    );
    expect(a.map((s) => s.answerKey)).toEqual(b.map((s) => s.answerKey));
    const c = buildQuestionSets(QS, 12346);
    expect(c[1].questions.map((q) => q.id)).not.toEqual(a[1].questions.map((q) => q.id));
  });

  it('every per-set key lists answers in THAT set order, not the original order', () => {
    const sets = buildQuestionSets(QS, 42);
    for (const s of sets) {
      expect(s.answerKey).toEqual(s.questions.map((q) => q.correctLetter));
    }
    // The shuffled sets' keys genuinely differ from the original key
    // (otherwise the "matching key" would be the unshuffled one).
    expect(sets[1].answerKey).not.toEqual(ORIGINAL_KEY);
    expect(sets[2].answerKey).not.toEqual(ORIGINAL_KEY);
    expect(sets[3].answerKey).not.toEqual(ORIGINAL_KEY);
  });

  it('questionsForSet agrees with buildQuestionSets for every code', () => {
    const sets = buildQuestionSets(QS, 77);
    for (const s of sets) {
      expect(questionsForSet(QS, 77, s.code).map((q) => q.id)).toEqual(
        s.questions.map((q) => q.id),
      );
    }
    expect(questionsForSet(QS, 77, '').map((q) => q.id)).toEqual(ORIGINAL_IDS);
  });

  it('a paper built from a set carries that set key (set order, not original)', () => {
    const setKha = buildQuestionSets(QS, 42)[1];
    const setup = defaultPaperSetup({
      title: 'বার্ষিক পরীক্ষা ২০২৬',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 10,
      marksPerQuestion: 1,
      timeMinutes: 30,
      sectionHeading: 'ক-বিভাগ',
      subjectCode: '101',
      setCode: 'খ',
    });
    const paper = buildQpgPaper({
      setup,
      questions: setKha.questions,
      isCustomVariant: false,
      kind: 'chapter-paper',
      patternLabelBn: 'x',
      patternLabelEn: 'x',
    });
    expect(paper.answerKey).toEqual(setKha.answerKey);
    expect(paper.answerKey).toEqual(paper.questions.map((q) => q.correctLetter));
    expect(paper.answerKey).not.toEqual(ORIGINAL_KEY);
    expect(paper.setup.setCode).toBe('খ');
  });

  it('the seed is editable in the generator so a noted seed rebuilds the same set', () => {
    expect(GENERATOR_SRC).toContain('const [seed, setSeed] = useState');
    expect(GENERATOR_SRC).toContain('সিড (Seed');
    // The seed field is a clearable number input wired to setSeed (26 Nov
    // 2026 fix: the old snap-back onChange `setSeed(Math.max(0, ...))`
    // could not be cleared to empty and re-typed).
    expect(GENERATOR_SRC).toContain('onCommit={setSeed}');
  });
});

describe('Auto Exam Header (Day 4)', () => {
  it('auto-fills exam name / class / subject / marks / time from the setup', () => {
    const setup = defaultPaperSetup({
      title: 'অর্ধবার্ষিক পরীক্ষা — English (অনার্স)',
      subject: 'English',
      classLabel: 'অনার্স',
      questionCount: 10,
      marksPerQuestion: 2,
      timeMinutes: 60,
      sectionHeading: 'ক-বিভাগ',
      subjectCode: '101',
      setCode: 'গ',
    });
    expect(setup.title).toBe('অর্ধবার্ষিক পরীক্ষা — English (অনার্স)');
    expect(setup.subject).toBe('English');
    expect(setup.classLabel).toBe('অনার্স');
    expect(setup.totalMarks).toBe(20); // 10 × 2 — auto, not typed
    expect(setup.timeMinutes).toBe(60);
    expect(setup.examDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // today, auto
    expect(setup.subjectCode).toBe('101');
    expect(setup.setCode).toBe('গ');
  });

  it('the rendered paper header shows those fields (never blank)', () => {
    // Header lines in the PDF renderer: title, subject/class/chapter,
    // date + full marks + time + subject code + set.
    expect(PDF_LIB_SRC).toContain('বিষয়: ${setup.subject}');
    expect(PDF_LIB_SRC).toContain('শ্রেণি: ${setup.classLabel}');
    expect(PDF_LIB_SRC).toContain('পূর্ণমান: ${setup.totalMarks}');
    expect(PDF_LIB_SRC).toContain('সময়: ${setup.timeMinutes} মিনিট');
    expect(PDF_LIB_SRC).toContain('সেট: ${setup.setCode');
    // Every header field has an editable input in the generator form.
    for (const label of [
      'পরীক্ষার শিরোনাম',
      'প্রতিষ্ঠানের নাম',
      'বিষয়',
      'শ্রেণি / পরীক্ষা',
      'তারিখ',
      'পূর্ণমান',
      'সময় (মিনিট)',
    ]) {
      expect(GENERATOR_SRC).toContain(label);
    }
  });
});

describe('OMR attach end-to-end (Day 4)', () => {
  it('the toggle includes the bubble sheet in the paper PREVIEW, not just the PDF', () => {
    expect(GENERATOR_SRC).toContain('renderOmrSheetCanvases');
    expect(GENERATOR_SRC).toContain(
      'renderOmrSheetCanvases(built, { watermarked: true, userLabel })',
    );
    // Flipping the toggle after a paper exists re-renders the preview.
    expect(GENERATOR_SRC).toContain('}, [includeOmrSheet]);');
  });

  it('the OMR sheet itself carries the paper title + set code, one row per question', () => {
    expect(PDF_LIB_SRC).toContain('OMR উত্তরপত্র (Bubble Sheet)');
    expect(PDF_LIB_SRC).toContain('সেট: ${paper.setup.setCode');
    expect(PDF_LIB_SRC).toContain("paper.questions.map((_q, i) => i)");
  });

  it('the evaluator loads the paper key from the same sessionStorage key the generator writes', () => {
    expect(GENERATOR_SRC).toContain("'eduvelto-qpg-last-key'");
    expect(OMR_PAGE_SRC).toContain("'eduvelto-qpg-last-key'");
    expect(OMR_PAGE_SRC).toContain('শেষ তৈরি পেপারের Key লোড করুন');
    expect(GENERATOR_SRC).toContain('answerKey: built.answerKey');
  });

  it('checking is FREE — no Pro gate on the evaluator page or its route', () => {
    expect(OMR_PAGE_SRC).toContain('সম্পূর্ণ ফ্রি');
    expect(OMR_PAGE_SRC).toContain('কোনো Pro লাগে না');
    expect(OMR_PAGE_SRC).not.toContain('proStatus');
    expect(OMR_PAGE_SRC).not.toContain('ProtectedContentWrapper');
    expect(OMR_PAGE_SRC).not.toContain('QPG_PRO_LOCKED');
    expect(OMR_PAGE_SRC).not.toContain('🔒');
    expect(APP_SRC).toContain('<Route path="omr-evaluator" element={<OmrEvaluatorPage />} />');
  });
});

describe('OMR sheet pagination — continuation-header measurement (Day 4 fix, 26 Nov 2026)', () => {
  // Live-measured values (26 Nov 2026, 35-question BCS English sheet):
  // row 47px, first-page header 173px, credit 35px, continuation header ~91px.
  // The continuation probe's grid.offsetTop MUST be measured inside its own
  // root. Before the fix the OMR root had no position, so the grid's
  // offsetParent was the shared off-screen host (which already held the
  // 1086px full-sheet probe) and contHead came back as 1182px — making
  // laterBudget NEGATIVE (-95px) and every page after the first hold
  // exactly one bubble row: a 35-question sheet became 17 pages.
  const ROW_H = 47;
  const HEAD_H = 173;
  const CREDIT_H = 35;
  const CONT_HEAD_FIXED = 91;
  const CONT_HEAD_BUGGY = 1182;
  const rows = Array.from({ length: 35 }, () => ROW_H);

  it('the OMR sheet root is position:relative, like the paper DOM', () => {
    const fnStart = PDF_LIB_SRC.indexOf('export function buildOmrBubbleSheetDom');
    expect(fnStart).toBeGreaterThan(-1);
    const fnBody = PDF_LIB_SRC.slice(fnStart, PDF_LIB_SRC.indexOf('export async function renderOmrSheetCanvases', fnStart));
    expect(fnBody).toContain("position: 'relative'");
  });

  it('with the corrected continuation budget a 35-question sheet is 2 pages (19 + 16)', () => {
    const firstBudget = QPG_A4_PAGE_HEIGHT_PX - HEAD_H - CREDIT_H;
    const laterBudget = QPG_A4_PAGE_HEIGHT_PX - CONT_HEAD_FIXED - CREDIT_H;
    expect(firstBudget).toBeGreaterThan(0);
    expect(laterBudget).toBeGreaterThan(0);
    const pages = paginateQpgBlocks(rows, firstBudget, laterBudget);
    expect(pages.length).toBe(2);
    expect(pages[0].length).toBe(19);
    expect(pages[1].length).toBe(16);
  });

  it('documents the bug: a negative later budget puts one row per page (17 pages)', () => {
    const firstBudget = QPG_A4_PAGE_HEIGHT_PX - HEAD_H - CREDIT_H;
    const laterBudget = QPG_A4_PAGE_HEIGHT_PX - CONT_HEAD_BUGGY - CREDIT_H;
    expect(laterBudget).toBeLessThan(0);
    const pages = paginateQpgBlocks(rows, firstBudget, laterBudget);
    expect(pages.length).toBe(17);
    expect(pages[0].length).toBe(19);
    expect(pages.slice(1).every((p) => p.length === 1)).toBe(true);
  });
});
