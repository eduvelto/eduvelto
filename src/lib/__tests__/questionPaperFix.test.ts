// Question Paper Generator — paper fix, owner feedback 25 Nov 19:03:
// (a) no question may ever split across pages, (b) the preview shows
// ALL questions, (c) ONE large centered watermark, not the dense
// diagonal grid. Rendered behaviour (preview + downloaded PDF) is
// covered by the Playwright probe in
// deploy-verify-2026-11-25/paper-fix/; these are the source-level +
// pure-function guards.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  drawQpgCenteredWatermark,
  paginateQpgBlocks,
  QPG_A4_PAGE_HEIGHT_PX,
} from '../questionPaperPdf';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const PDF_LIB_SRC = read('../questionPaperPdf.ts');
const GENERATOR_SRC = read('../../pages/QuestionPaperGeneratorPage.tsx');
const SHEET_SRC = read('../../pages/SheetBuilderPage.tsx');
const WRAPPER_SRC = read('../../components/ProtectedContentWrapper.tsx');
const PRINT_CSS = read('../../components/question-paper-print.css');
const DIALOG_SRC = read('../../components/QuestionPaperDownloadDialog.tsx');

describe('(a) pagination between questions — never mid-question', () => {
  it('paginateQpgBlocks never exceeds a page budget and keeps order', () => {
    const heights = [90, 120, 80, 200, 95, 110, 85, 130, 100, 90];
    const pages = paginateQpgBlocks(heights, 700, 650);
    // Every question exactly once, in order.
    expect(pages.flat()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // No page exceeds its budget (page 1: 700, later: 650).
    pages.forEach((page, i) => {
      const used = page.reduce((sum, qi) => sum + heights[qi], 0);
      expect(used).toBeLessThanOrEqual(i === 0 ? 700 : 650);
    });
    expect(pages.length).toBeGreaterThan(1);
  });

  it('a question that does not fit moves WHOLE to the next page', () => {
    // 600 + 200 does not fit 700 → the 200px block starts page 2.
    const pages = paginateQpgBlocks([600, 200, 100], 700, 700);
    expect(pages).toEqual([[0], [1, 2]]);
  });

  it('a single block taller than a page goes alone (never split)', () => {
    const pages = paginateQpgBlocks([900, 100], 700, 700);
    expect(pages).toEqual([[0], [1]]);
  });

  it('empty paper paginates to one empty page', () => {
    expect(paginateQpgBlocks([], 700, 700)).toEqual([[]]);
  });

  it('one A4 page is 1122 DOM px at 794px width', () => {
    expect(QPG_A4_PAGE_HEIGHT_PX).toBe(1122);
  });

  it('the PDF writer has no fixed-height slicing left', () => {
    expect(PDF_LIB_SRC).not.toContain('sliceHeightPx');
    expect(PDF_LIB_SRC).not.toContain('async function canvasToPdf');
    expect(PDF_LIB_SRC).not.toContain('qpgA4PageCount(c.width');
    expect(PDF_LIB_SRC).toContain('canvasPagesToPdf');
    expect(PDF_LIB_SRC).toContain('renderPaperCanvases');
    expect(PDF_LIB_SRC).toContain('paginateQpgBlocks');
    expect(PDF_LIB_SRC).toContain('buildVerifiedPageDoms');
  });

  it('each question block carries break-inside: avoid; the section heading stays with its first question', () => {
    expect(PDF_LIB_SRC).toContain("'qpg-question-block'");
    expect(PDF_LIB_SRC).toContain("breakInside: 'avoid'");
    expect(PDF_LIB_SRC).toContain("pageBreakInside: 'avoid'");
    expect(PDF_LIB_SRC).toContain("'qpg-section-heading'");
    expect(PDF_LIB_SRC).toContain("breakAfter: 'avoid'");
    expect(PDF_LIB_SRC).toContain("pageBreakAfter: 'avoid'");
    // OMR rows are paginated the same way.
    expect(PDF_LIB_SRC).toContain("'qpg-omr-row'");
    expect(PDF_LIB_SRC).toContain('renderOmrSheetCanvases');
  });

  it('the print CSS keeps questions whole too', () => {
    expect(PRINT_CSS).toContain('.qpg-question-block');
    expect(PRINT_CSS).toContain('.qpg-preview-page');
    expect(PRINT_CSS).toContain('break-inside: avoid');
  });
});

describe('(b) the preview shows ALL questions — nothing hidden', () => {
  it('the generator renders the full built paper, with no slicing', () => {
    expect(GENERATOR_SRC).toContain('renderPaperCanvases(built, {');
    expect(GENERATOR_SRC).not.toContain('renderPaperCanvas(');
    expect(GENERATOR_SRC).not.toContain('PREVIEW_QUESTIONS');
    expect(GENERATOR_SRC).not.toContain('slice(0, PREVIEW_QUESTIONS)');
    expect(GENERATOR_SRC).not.toContain('previewMode');
    expect(GENERATOR_SRC).not.toContain('hiddenCount');
    expect(GENERATOR_SRC).not.toContain('সুরক্ষিত — আংশিক');
    expect(GENERATOR_SRC).not.toContain('আংশিক প্রিভিউ');
    expect(GENERATOR_SRC).toContain('৮. প্রিভিউ (সুরক্ষিত — পুরো পেপার)');
    expect(GENERATOR_SRC).toContain('qpg-preview-page');
    expect(GENERATOR_SRC).toContain('প্রিন্ট করুন (পুরো পেপার');
  });

  it('the sheet builder shows its full sheet too (it never sliced, only its copy claimed it did)', () => {
    expect(SHEET_SRC).toContain('renderPaperCanvases(built, { watermarked: true })');
    expect(SHEET_SRC).not.toContain('PREVIEW_QUESTIONS');
    expect(SHEET_SRC).not.toContain('আংশিক প্রিভিউ');
    expect(SHEET_SRC).toContain('প্রিভিউ — সব');
  });

  it('the paper DOM has no locked-remainder box left', () => {
    expect(PDF_LIB_SRC).not.toContain('hiddenCount');
    expect(PDF_LIB_SRC).not.toContain('previewMode');
    expect(PDF_LIB_SRC).not.toContain('লক করা আছে');
  });

  it('the wrapper copy no longer says only part is shown', () => {
    expect(WRAPPER_SRC).not.toContain('আংশিক দেখা যায়');
    expect(WRAPPER_SRC).toContain('পুরো পেপার দেখা যায়');
  });
});

describe('(c) ONE large centered watermark — not the dense diagonal', () => {
  it('the canvas watermark paints exactly one eduvelto.com mark (plus the user label line)', () => {
    const calls: string[] = [];
    const fonts: string[] = [];
    const ctx = {
      save: () => undefined,
      restore: () => undefined,
      setTransform: (...args: number[]) => {
        calls.push(`setTransform(${args.join(',')})`);
      },
      translate: () => undefined,
      rotate: () => undefined,
      fillText: (text: string) => {
        calls.push(`fillText:${text}`);
      },
      globalAlpha: 1,
      fillStyle: '',
      set font(v: string) {
        fonts.push(v);
      },
      get font() {
        return fonts[fonts.length - 1] ?? '';
      },
      textAlign: '',
      textBaseline: '',
    };
    const canvas = {
      width: 1588,
      height: 2244,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    drawQpgCenteredWatermark(canvas, 'guest');
    const fills = calls.filter((c) => c.startsWith('fillText:'));
    expect(fills).toEqual(['fillText:eduvelto.com', 'fillText:guest']);
    // The one mark is BIG: font is canvas width / 13 (~122px at 2x),
    // with the user label smaller underneath.
    expect(fonts[0]).toContain('122px');
    expect(fonts[1]).toContain('50px');
  });

  it('no diagonal watermark code remains anywhere in the paper path', () => {
    for (const src of [PDF_LIB_SRC, WRAPPER_SRC, DIALOG_SRC, GENERATOR_SRC, SHEET_SRC]) {
      expect(src).not.toContain('drawQpgDiagonalWatermark');
      expect(src).not.toMatch(/diagonal watermark/i);
    }
    expect(PDF_LIB_SRC).toContain('drawQpgCenteredWatermark');
    expect(WRAPPER_SRC).toContain('qpg-watermark-single');
  });

  it('the preview overlay is exactly ONE watermark element', () => {
    const marks = WRAPPER_SRC.match(/data-qpg-watermark="single"/g) ?? [];
    expect(marks).toHaveLength(1);
    expect(WRAPPER_SRC).not.toContain('rows.flatMap');
    expect(WRAPPER_SRC).not.toContain('cols.map');
    // One big mark: large font, centered, rotated.
    expect(WRAPPER_SRC).toContain('translate(-50%, -50%) rotate(-28deg)');
    expect(WRAPPER_SRC).toContain('clamp(20px, 5vw, 44px)');
    expect(WRAPPER_SRC).toContain('left: \'50%\'');
    expect(WRAPPER_SRC).toContain('top: \'50%\'');
  });

  it('copy-protection stays: blur on focus loss, right-click/copy blocked', () => {
    expect(WRAPPER_SRC).toContain('blur(14px)');
    expect(WRAPPER_SRC).toContain('onContextMenu');
    expect(WRAPPER_SRC).toContain('onCopy');
    expect(WRAPPER_SRC).toContain('visibilitychange');
  });

  it('the free PDF still watermarks per page; the Pro PDF stays clean', () => {
    // Comparison fixes (26 Nov): the calls gained showPageNumbers —
    // the watermark contract is unchanged (free = watermarked, Pro = clean).
    expect(PDF_LIB_SRC).toContain(
      'renderPaperCanvases(paper, {\n    watermarked: true,\n    userLabel: opts.userLabel,\n    showPageNumbers: paper.setup.pageNumbers ?? false,',
    );
    expect(PDF_LIB_SRC).toContain('renderPaperCanvases(paper, {\n    watermarked: false,');
    expect(PDF_LIB_SRC).toContain('Powered by Eduvelto.com');
  });
});
