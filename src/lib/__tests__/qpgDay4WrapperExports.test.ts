// Question Paper Generator — Day 4 hardening (26 Nov 2026), items (5)+(6):
// ProtectedContentWrapper behaviour + the two export buttons (Free
// watermarked vs Pro clean) + the Answer Key sheet inside the Pro PDF.
//
// Source-level guards (same pattern as questionPaperFix.test.ts) plus
// pure-function checks where the behaviour is unit-testable. Rendered
// behaviour (preview + downloaded PDF) is covered by the Playwright
// probes, not here.
//
// NOTE — brief vs owner rule (25 Nov 19:03): the task brief asked for
// a "dense repeating diagonal" watermark, but the owner replaced that
// with ONE large centered watermark ("moddokane 1 ta boro kore takle
// hobe"). These tests guard the OWNER rule: a single centered mark in
// the wrapper overlay and on each PDF page canvas, never a diagonal
// grid. If the brief is re-issued, this file must change with it.
//
// NOTE — dialog wiring NOT covered here: the download dialog
// (QuestionPaperDownloadDialog.tsx) is outside this item's file scope.
// Two gaps found 26 Nov live there and are NOT fixed by this change:
//   (1) onCleanPdfDownload hardcodes includeAnswerKey: false and the
//       dialog has no Answer Key toggle — the Pro PDF never carries
//       the key even though the lib now appends it when asked;
//   (2) the Pro logo <input type="file"> has no onChange/state and
//       onCleanPdfDownload never passes customLogoDataUrl, so the
//       custom-logo path is dead. See day4-wrapper-exports-report.md.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const WRAPPER_SRC = read('../../components/ProtectedContentWrapper.tsx');
const PDF_LIB_SRC = read('../questionPaperPdf.ts');
const GENERATOR_SRC = read('../../pages/QuestionPaperGeneratorPage.tsx');
const DIALOG_SRC = read('../../components/QuestionPaperDownloadDialog.tsx');

describe('(5) ProtectedContentWrapper — single centered watermark, not a diagonal grid', () => {
  it('the overlay is exactly ONE watermark element, centered and rotated', () => {
    const marks = WRAPPER_SRC.match(/data-qpg-watermark="single"/g) ?? [];
    expect(marks).toHaveLength(1);
    expect(WRAPPER_SRC).toContain("left: '50%'");
    expect(WRAPPER_SRC).toContain("top: '50%'");
    expect(WRAPPER_SRC).toContain('translate(-50%, -50%) rotate(-28deg)');
    expect(WRAPPER_SRC).toContain('clamp(20px, 5vw, 44px)');
    // No diagonal-grid code: no repeated rows/cols, no diagonal helper.
    expect(WRAPPER_SRC).not.toContain('rows.flatMap');
    expect(WRAPPER_SRC).not.toContain('cols.map');
    expect(WRAPPER_SRC).not.toContain('drawQpgDiagonalWatermark');
    expect(WRAPPER_SRC).not.toMatch(/diagonal watermark/i);
  });

  it('the watermark carries eduvelto.com + the per-user label (traceability)', () => {
    expect(WRAPPER_SRC).toContain('QPG_WATERMARK_TEXT');
    expect(WRAPPER_SRC).toContain('`${QPG_WATERMARK_TEXT} • ${props.userLabel}`');
    // The page passes the real label: email, else uid, else 'guest'.
    expect(GENERATOR_SRC).toContain("const userLabel = user?.email ?? user?.uid ?? 'guest'");
    expect(GENERATOR_SRC).toContain('<ProtectedContentWrapper userLabel={userLabel}>');
  });

  it('right-click / copy / cut / drag / selection are blocked on the preview', () => {
    expect(WRAPPER_SRC).toContain('onContextMenu={(e) => e.preventDefault()}');
    expect(WRAPPER_SRC).toContain('onCopy={(e) => e.preventDefault()}');
    expect(WRAPPER_SRC).toContain('onCut={(e) => e.preventDefault()}');
    expect(WRAPPER_SRC).toContain('onDragStart={(e) => e.preventDefault()}');
    expect(WRAPPER_SRC).toContain("userSelect: 'none'");
  });

  it('PrintScreen / print / save / copy / DevTools shortcuts are intercepted', () => {
    expect(WRAPPER_SRC).toContain("document.addEventListener('keydown', onKeyDown, true)");
    expect(WRAPPER_SRC).toContain("e.key === 'PrintScreen'");
    expect(WRAPPER_SRC).toContain("e.key === 'F12'");
    expect(WRAPPER_SRC).toContain("e.key === 'p' || e.key === 'P'");
    expect(WRAPPER_SRC).toContain("e.key === 's' || e.key === 'S'");
    expect(WRAPPER_SRC).toContain("e.key === 'c' || e.key === 'C'");
    expect(WRAPPER_SRC).toContain('e.preventDefault()');
    // PrintScreen deterrence: best-effort clipboard clear + obscure.
    expect(WRAPPER_SRC).toContain("navigator.clipboard?.writeText('')");
    expect(WRAPPER_SRC).toContain('obscureNow()');
  });

  it('the preview blurs instantly (14px) on window blur / tab hide, and only the preview', () => {
    expect(WRAPPER_SRC).toContain("window.addEventListener('blur', onWindowBlur)");
    expect(WRAPPER_SRC).toContain("document.addEventListener('visibilitychange', onVisibility)");
    expect(WRAPPER_SRC).toContain("window.addEventListener('focus', onWindowFocus)");
    expect(WRAPPER_SRC).toContain("filter: obscured ? 'blur(14px)' : 'none'");
    // The blur is scoped to the content div (qpg-protected-content),
    // never the whole app — the root has no blur filter.
    expect(WRAPPER_SRC).toContain('className="qpg-protected-content"');
    expect(WRAPPER_SRC).toContain('প্রিভিউ লুকানো আছে');
  });

  it('the honest limit is stated in the UI — no screenshot-proof claim', () => {
    expect(WRAPPER_SRC).toContain('স্ক্রিনশট পুরোপুরি আটকানো যায় না');
    expect(WRAPPER_SRC).not.toContain('screenshot-proof');
    expect(WRAPPER_SRC).not.toContain('স্ক্রিনশট-প্রুফ');
  });
});

describe('(5) the preview shows ALL questions — nothing hidden', () => {
  it('the generator renders every page canvas into the wrapper, with no slicing', () => {
    expect(GENERATOR_SRC).toContain('renderPaperCanvases(built, {');
    expect(GENERATOR_SRC).toContain('watermarked: true,');
    expect(GENERATOR_SRC).toContain('userLabel,');
    expect(GENERATOR_SRC).toContain('previewUrls.map((url, i) => (');
    expect(GENERATOR_SRC).toContain('setPreviewUrls(canvases.map((c) => c.toDataURL');
    expect(GENERATOR_SRC).not.toContain('PREVIEW_QUESTIONS');
    expect(GENERATOR_SRC).not.toContain('hiddenCount');
    expect(GENERATOR_SRC).not.toContain('আংশিক প্রিভিউ');
    expect(WRAPPER_SRC).toContain('পুরো পেপার দেখা যায়');
    // The wrapper renders its children as-is — no hiding logic.
    expect(WRAPPER_SRC).toContain('{props.children}');
  });
});

describe('(6) Free export — rasterized, watermarked, dynamic imports only', () => {
  it('the dialog free button calls the watermarked export with the user label', () => {
    expect(DIALOG_SRC).toContain('downloadWatermarkedPaperPdf(props.paper, {');
    expect(DIALOG_SRC).toContain('userLabel: props.uid');
    expect(DIALOG_SRC).toContain('includeOmrSheet: props.includeOmrSheet');
  });

  it('the free path renders via html2canvas + jsPDF loaded ONLY by dynamic import()', () => {
    expect(PDF_LIB_SRC).toContain("await import('html2canvas')");
    expect(PDF_LIB_SRC).toContain("await import('jspdf')");
    expect(PDF_LIB_SRC).not.toContain("from 'html2canvas'");
    expect(PDF_LIB_SRC).not.toContain("from 'jspdf'");
    expect(DIALOG_SRC).not.toContain("from 'html2canvas'");
    expect(DIALOG_SRC).not.toContain("from 'jspdf'");
    // Rasterized: canvases embedded as PNG images, so PDF text is
    // not selectable/editable.
    expect(PDF_LIB_SRC).toContain("c.toDataURL('image/png')");
    expect(PDF_LIB_SRC).toContain("pdf.addImage(img, 'PNG'");
  });

  it('every free page carries the centered watermark + the border credit inside the question box', () => {
    // Comparison fixes (26 Nov): the call gained showPageNumbers —
    // the watermark contract is unchanged.
    expect(PDF_LIB_SRC).toContain(
      'renderPaperCanvases(paper, {\n    watermarked: true,\n    userLabel: opts.userLabel,\n    showPageNumbers: paper.setup.pageNumbers ?? false,',
    );
    expect(PDF_LIB_SRC).toContain('drawQpgCenteredWatermark(shot, opts.userLabel)');
    expect(PDF_LIB_SRC).toContain('QPG_BORDER_CREDIT');
    expect(PDF_LIB_SRC).toContain("'qpg-question-container'");
  });
});

describe('(6) Pro export — gating, clean PDF, logo plumbing, Answer Key in the SAME file', () => {
  it('the Pro buttons are disabled unless Pro is unlocked, and the lib throws when locked', () => {
    expect(DIALOG_SRC).toContain('disabled={!proUnlocked || cleanBusy}');
    expect(DIALOG_SRC).toContain('disabled={!proUnlocked}');
    expect(DIALOG_SRC).toContain('downloadCleanPaperPdf(props.paper, {');
    expect(DIALOG_SRC).toContain('proUnlocked,');
    expect(PDF_LIB_SRC).toContain('if (!opts.proUnlocked) {');
    expect(PDF_LIB_SRC).toContain('Pro export is locked in the MVP');
  });

  it('the clean path renders WITHOUT the watermark', () => {
    expect(PDF_LIB_SRC).toContain('renderPaperCanvases(paper, {');
    expect(PDF_LIB_SRC).toContain('watermarked: false,');
  });

  it('the lib accepts a custom institution logo and renders it in the header', () => {
    expect(PDF_LIB_SRC).toContain('logoDataUrl: opts.customLogoDataUrl ?? null');
    expect(PDF_LIB_SRC).toContain('if (opts.logoDataUrl) {');
    expect(PDF_LIB_SRC).toContain("height: '56px'");
  });

  it('the Answer Key is appended to the SAME Pro PDF — never a second file', () => {
    // One jsPDF instance per export: canvasPagesToPdf's + the clean
    // path's. The old code created a THIRD instance for the key and
    // saved '<title>-answer-key.pdf' separately.
    expect(PDF_LIB_SRC.match(/new jsPDF/g)?.length).toBe(2);
    expect(PDF_LIB_SRC).not.toContain("safeFileName(paper, 'answer-key')");
    expect(PDF_LIB_SRC).not.toContain('answer-key');
    expect(PDF_LIB_SRC).toContain('addAnswerKeyPagesToPdf(pdf, paper)');
    expect(PDF_LIB_SRC).toContain('pdf.save(safeFileName(paper, \'pro-clean\'))');
    // The key writer lives in the same save flow as the paper pages.
    expect(PDF_LIB_SRC).toContain('addCanvasPagesToPdf(pdf, [...pages, ...extra]);');
  });

  it('the Answer Key paginates — a long paper never runs off the page', () => {
    expect(PDF_LIB_SRC).toContain('if (y > 280) {');
    expect(PDF_LIB_SRC).toContain("pdf.text('Answer Key (continued)', 20, 20)");
    expect(PDF_LIB_SRC).toContain('pdf.text(`${i + 1}. ${q.correctLetter}`, 20, y)');
    expect(PDF_LIB_SRC).not.toContain('32 + i * 8');
  });
});
