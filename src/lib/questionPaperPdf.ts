// Eduvelto — Question Paper Generator: rasterized PDF export.
//
// FREE PDF (the only download that works in the MVP): the paper DOM is
// rendered to canvas with html2canvas at 2x scale and embedded in
// jsPDF as IMAGES — so the PDF text cannot be selected or edited in a
// PDF editor. Every page carries a baked-in diagonal `eduvelto.com`
// watermark, and the text "Powered by Eduvelto.com" sits INSIDE the
// main question container border (it cannot be cropped off without
// cutting the questions).
//
// ZERO-BUNDLE BLOAT (owner 25 Nov 08:48, BINDING): html2canvas and
// jspdf are loaded ONLY via dynamic import() inside functions invoked
// from click handlers (Generate / Download) — NEVER statically
// imported — so they land in a separate lazy chunk and public pages
// stay fast on 4G mobile. (Pre-existing static jspdf import in
// src/pages/LifePdfToolsPage.tsx is out of scope for this workstream;
// the generator's usage is dynamic regardless.)
//
// CLEAN PDF (Pro): same render WITHOUT the watermark, plus the
// institution's custom logo and an optional Answer Key sheet. The
// builder exists here, but the MVP UI never calls it — Pro is LOCKED
// (see QuestionPaperDownloadDialog). `exportCleanPaperPdf` throws
// unless `proUnlocked` is true; nothing in the MVP passes true.
//
// ZERO SERVER STORAGE (owner 25 Nov 08:48): PDF generation stays
// 100% client-side. A Pro logo is compressed client-side to <50KB
// (see ./questionPaperLogo) and lives only as an in-memory data URL
// for the session — NEVER uploaded to Firebase Storage.
//
// No server cost: everything runs client-side (Spark plan, no Blaze).

import { PUBLIC_BCS_READING_PASSAGE } from './publicBcsEnglish';
import {
  QPG_BORDER_CREDIT,
  QPG_WATERMARK_TEXT,
  type QpgPaper,
} from './questionPaper';

/** A4 portrait ratio (height / width). */
export const QPG_A4_RATIO = 297 / 210;

/** Pure helper — how many A4 pages a canvas of this size needs. */
export function qpgA4PageCount(canvasWidth: number, canvasHeight: number): number {
  if (canvasWidth <= 0 || canvasHeight <= 0) return 0;
  return Math.max(1, Math.ceil(canvasHeight / (canvasWidth * QPG_A4_RATIO)));
}

export interface QpgPaperDomOptions {
  /** Free export / preview: bake the diagonal watermark into the canvas. */
  watermarked: boolean;
  /** Per-user label baked into the PREVIEW only (email/uid/guest). */
  userLabel?: string;
  /** Preview mode: show the "locked remainder" box instead of the rest. */
  previewMode?: boolean;
  /** Questions hidden behind the preview lock (preview mode only). */
  hiddenCount?: number;
  /** Pro custom logo (client-compressed <50KB data URL, in-memory
   *  only — never uploaded). Rendered in the header of a CLEAN export. */
  logoDataUrl?: string | null;
}

const FONT_STACK = "'Hind Siliguri','Noto Sans Bengali',system-ui,-apple-system,'Segoe UI',sans-serif";

function el(tag: string, text: string, style: Partial<CSSStyleDeclaration>): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  Object.assign(node.style, style);
  return node;
}

/** Build the printable paper DOM (A4-width, 794px). Used by BOTH the
 *  PDF export and the rasterized preview, so what the teacher previews
 *  is exactly what the PDF contains. */
export function buildPaperDom(paper: QpgPaper, opts: QpgPaperDomOptions): HTMLElement {
  const { setup } = paper;
  const root = document.createElement('div');
  Object.assign(root.style, {
    width: '794px',
    background: '#ffffff',
    color: '#111111',
    fontFamily: FONT_STACK,
    padding: '40px 44px',
    boxSizing: 'border-box',
    position: 'relative',
  } as Partial<CSSStyleDeclaration>);

  // Header — institution name is FREE editable text (owner 25 Nov 08:41).
  // A Pro custom logo (in-memory data URL) renders above it when given.
  const header = document.createElement('div');
  Object.assign(header.style, { textAlign: 'center', marginBottom: '8px' } as Partial<CSSStyleDeclaration>);
  if (opts.logoDataUrl) {
    const logo = document.createElement('img');
    logo.src = opts.logoDataUrl;
    logo.alt = '';
    Object.assign(logo.style, { height: '56px', width: 'auto', marginBottom: '6px' } as Partial<CSSStyleDeclaration>);
    header.appendChild(logo);
  }
  header.appendChild(
    el('div', setup.institutionName.trim() || '________________________', {
      fontSize: '20px', fontWeight: '700',
    }),
  );
  // Auto-fields (25 Nov 09:19): institution address + motto, free text.
  if (setup.institutionAddress.trim()) {
    header.appendChild(el('div', setup.institutionAddress, { fontSize: '13px', marginTop: '2px' }));
  }
  if (setup.institutionMotto.trim()) {
    header.appendChild(el('div', setup.institutionMotto, { fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }));
  }
  header.appendChild(el('div', setup.title, { fontSize: '18px', fontWeight: '700', marginTop: '6px' }));
  // Restored 8-field exam header (Turn 32): Exam Name (title above),
  // Class, Subject, Chapter, Time, Full Marks, Subject Code, Set Code.
  header.appendChild(
    el('div', `বিষয়: ${setup.subject}  •  শ্রেণি: ${setup.classLabel}  •  অধ্যায়: ${paper.chapterNameBn}`, { fontSize: '14px', marginTop: '4px' }),
  );
  const metaLine = `তারিখ: ${setup.examDate}    •    পূর্ণমান: ${setup.totalMarks}    •    সময়: ${setup.timeMinutes} মিনিট    •    বিষয় কোড: ${setup.subjectCode.trim() || '—'}    •    সেট: ${setup.setCode || '—'}`;
  header.appendChild(el('div', metaLine, { fontSize: '13px', marginTop: '4px' }));
  header.appendChild(
    el('div', paper.isCustomVariant ? 'কাস্টম ভ্যারিয়েন্ট — প্রকৃত পরীক্ষার প্যাটার্ন নয়' : paper.patternLabelBn, {
      fontSize: '12px', color: '#555555', marginTop: '4px',
    }),
  );
  root.appendChild(header);

  const rule = document.createElement('hr');
  Object.assign(rule.style, { border: 'none', borderTop: '2px solid #111111', margin: '10px 0 12px' } as Partial<CSSStyleDeclaration>);
  root.appendChild(rule);

  if (setup.instructions.trim()) {
    const ins = document.createElement('div');
    Object.assign(ins.style, { fontSize: '13px', marginBottom: '14px', lineHeight: '1.6' } as Partial<CSSStyleDeclaration>);
    ins.appendChild(el('strong', 'নির্দেশনা: ', { fontSize: '13px' }));
    ins.appendChild(document.createTextNode(setup.instructions));
    root.appendChild(ins);
  }

  root.appendChild(
    el('div', setup.sectionHeading, { fontSize: '15px', fontWeight: '700', marginBottom: '10px' }),
  );

  // Reading passage (BCS Batch 1 reading questions need it to be answerable).
  const hasReading = paper.questions.some((q) => q.topicId === 'reading');
  if (hasReading) {
    const passage = document.createElement('div');
    Object.assign(passage.style, {
      fontSize: '13px', lineHeight: '1.7', background: '#f7f7f7',
      border: '1px solid #dddddd', padding: '10px 12px', marginBottom: '14px',
    } as Partial<CSSStyleDeclaration>);
    passage.appendChild(el('strong', 'Passage: ', { fontSize: '13px' }));
    passage.appendChild(document.createTextNode(PUBLIC_BCS_READING_PASSAGE.text));
    root.appendChild(passage);
  }

  // Main question container — the border carries the credit INSIDE it.
  const container = document.createElement('div');
  Object.assign(container.style, {
    border: '2px solid #111111', padding: '16px 18px 10px', boxSizing: 'border-box',
  } as Partial<CSSStyleDeclaration>);
  container.appendChild(
    el('div', QPG_BORDER_CREDIT, {
      fontSize: '12px', fontWeight: '700', textAlign: 'center',
      borderBottom: '1px solid #999999', paddingBottom: '8px', marginBottom: '12px',
    }),
  );
  paper.questions.forEach((q, i) => {
    const qBlock = document.createElement('div');
    Object.assign(qBlock.style, { marginBottom: '14px', fontSize: '14px', lineHeight: '1.6' } as Partial<CSSStyleDeclaration>);
    qBlock.appendChild(el('div', `${i + 1}. ${q.questionText}`, { fontWeight: '600' }));
    const opts = document.createElement('div');
    Object.assign(opts.style, {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 18px', marginTop: '4px', paddingLeft: '22px',
    } as Partial<CSSStyleDeclaration>);
    q.options.forEach((o) => {
      opts.appendChild(el('div', `(${o.letter}) ${o.text}`, { fontSize: '13px' }));
    });
    qBlock.appendChild(opts);
    container.appendChild(qBlock);
  });
  if (opts.previewMode && (opts.hiddenCount ?? 0) > 0) {
    const locked = document.createElement('div');
    Object.assign(locked.style, {
      border: '2px dashed #999999', padding: '18px', textAlign: 'center',
      fontSize: '14px', fontWeight: '700', marginTop: '6px', background: '#f7f7f7',
    } as Partial<CSSStyleDeclaration>);
    locked.textContent = `আরও ${opts.hiddenCount}টি প্রশ্ন লক করা আছে — ডাউনলোডের পর পুরো পেপার দেখা যাবে।`;
    container.appendChild(locked);
  }
  root.appendChild(container);

  root.appendChild(
    el('div', 'Eduvelto — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', {
      fontSize: '11px', color: '#777777', textAlign: 'center', marginTop: '14px',
    }),
  );

  // Per-user watermark baked into the PREVIEW canvas (traceability).
  // The PDF uses the eduvelto.com diagonal watermark instead (drawn
  // on the canvas in renderPaperCanvas, below).
  if (opts.watermarked && opts.userLabel) {
    const mark = document.createElement('div');
    Object.assign(mark.style, {
      position: 'absolute', inset: '0', overflow: 'hidden',
      pointerEvents: 'none', zIndex: '5',
    } as Partial<CSSStyleDeclaration>);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 3; c++) {
        const span = document.createElement('div');
        span.textContent = `${QPG_WATERMARK_TEXT} • ${opts.userLabel}`;
        Object.assign(span.style, {
          position: 'absolute',
          left: `${c * 280 - 40}px`,
          top: `${r * 150 + 60}px`,
          transform: 'rotate(-28deg)',
          fontSize: '13px', fontWeight: '700', color: 'rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap',
        } as Partial<CSSStyleDeclaration>);
        mark.appendChild(span);
      }
    }
    root.appendChild(mark);
  }
  return root;
}

/** Diagonal eduvelto.com watermark drawn across a rendered canvas.
 *  Shared by the paper and the OMR sheet: free exports are watermarked,
 *  Pro exports are clean. Alpha 0.13: subtle yet readable on screen
 *  and in print.
 *
 *  TRANSFORM RESET (verified 25 Nov 2026 — the real cause of the
 *  "invisible watermark" on every free PDF until today): html2canvas
 *  leaves its 2d context with a leftover transform (measured on a live
 *  render: a=1.755, b=-0.959, c=0.959, d=1.755, e=21588, f=-10282 —
 *  scale 2 plus the -10000px host offset). fillText was called 35x
 *  with the right text/font/alpha, but the text painted at x≈21588,
 *  y≈-10282 — far off-canvas — so the PDF carried no watermark at
 *  all (exact-222px count on page 1: 335 of 3.5M px, i.e. noise).
 *  The earlier "0.08 proved invisible" reading was confounded by
 *  this bug, not by the alpha. setTransform(1,0,0,1,0,0) resets to
 *  identity BEFORE our own translate/rotate, so the grid lands on
 *  the canvas. Never drop this reset. */
export function drawQpgDiagonalWatermark(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  // Reset html2canvas's leftover transform (see comment above) —
  // translate/rotate below must compose on IDENTITY, not on the
  // renderer's offset matrix.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(canvas.width / 16)}px sans-serif`;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-0.5);
  const stepX = canvas.width / 2.2;
  const stepY = canvas.height / 5;
  for (let r = -3; r <= 3; r++) {
    for (let c = -2; c <= 2; c++) {
      ctx.fillText(QPG_WATERMARK_TEXT, c * stepX, r * stepY);
    }
  }
  ctx.restore();
}

/** Render the paper DOM to a canvas (2x scale), then draw the diagonal
 *  eduvelto.com watermark across the whole canvas when watermarked. */
export async function renderPaperCanvas(
  paper: QpgPaper,
  opts: QpgPaperDomOptions,
): Promise<HTMLCanvasElement> {
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed', left: '-10000px', top: '0', zIndex: '-1',
  } as Partial<CSSStyleDeclaration>);
  const dom = buildPaperDom(paper, opts);
  host.appendChild(dom);
  document.body.appendChild(host);
  try {
    // Dynamic import ONLY — html2canvas must never enter the main
    // bundle (zero-bundle-bloat rule, owner 25 Nov 08:48).
    const { default: html2canvas } = await import('html2canvas');
    const shot = await html2canvas(dom, { scale: 2, backgroundColor: '#ffffff' });
    if (!opts.watermarked) return shot;
    drawQpgDiagonalWatermark(shot);
    return shot;
  } finally {
    host.remove();
  }
}

/** Printable OMR Bubble Sheet — attached inside/at the end of the
 *  paper. One bubble row per MCQ: ○ A ○ B ○ C ○ D. The teacher prints
 *  it with the paper; students darken one bubble per question.
 *  Multiple darkened bubbles = multiple-mark (the OMR evaluator flags
 *  it as wrong). TIER RULE (owner 25 Nov 09:43): the sheet follows the
 *  paper's tier — watermarked on free papers, clean on Pro papers. No
 *  separate OMR price; checking itself is FREE for everyone. */
export function buildOmrBubbleSheetDom(paper: QpgPaper): HTMLElement {
  const root = document.createElement('div');
  Object.assign(root.style, {
    width: '794px',
    background: '#ffffff',
    color: '#111111',
    fontFamily: FONT_STACK,
    padding: '40px 44px',
    boxSizing: 'border-box',
  } as Partial<CSSStyleDeclaration>);
  root.appendChild(
    el('div', 'OMR উত্তরপত্র (Bubble Sheet)', { fontSize: '18px', fontWeight: '700', textAlign: 'center' }),
  );
  root.appendChild(
    el('div', `${paper.setup.title}  •  সেট: ${paper.setup.setCode || '—'}  •  বিষয় কোড: ${paper.setup.subjectCode.trim() || '—'}`, {
      fontSize: '13px', textAlign: 'center', marginTop: '6px',
    }),
  );
  root.appendChild(
    el('div', 'নাম: ______________________    রোল: ______________    শ্রেণি: ______________', {
      fontSize: '13px', marginTop: '14px',
    }),
  );
  root.appendChild(
    el('div', 'প্রতিটি প্রশ্নের জন্য একটি বৃত্ত ভরাট করুন। একাধিক বৃত্ত ভরাট করলে উত্তরটি ভুল ধরা হবে।', {
      fontSize: '13px', marginTop: '8px', marginBottom: '14px',
    }),
  );
  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px',
  } as Partial<CSSStyleDeclaration>);
  paper.questions.forEach((_q, i) => {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', borderBottom: '1px solid #eeeeee', padding: '6px 0',
    } as Partial<CSSStyleDeclaration>);
    row.appendChild(el('span', `${i + 1}.`, { fontWeight: '700' }));
    (['A', 'B', 'C', 'D'] as const).forEach((letter) => {
      const bubble = document.createElement('span');
      Object.assign(bubble.style, {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '26px', height: '26px', borderRadius: '50%',
        border: '2px solid #111111', fontSize: '13px', fontWeight: '700',
      } as Partial<CSSStyleDeclaration>);
      bubble.textContent = letter;
      row.appendChild(bubble);
    });
    grid.appendChild(row);
  });
  root.appendChild(grid);
  root.appendChild(
    el('div', QPG_BORDER_CREDIT, {
      fontSize: '12px', fontWeight: '700', textAlign: 'center', marginTop: '16px',
    }),
  );
  return root;
}

/** Slice a rendered canvas into A4 pages and save via jsPDF.
 *  jsPDF is dynamically imported here — never in the main bundle. */
async function canvasToPdf(
  canvas: HTMLCanvasElement,
  fileName: string,
  extraCanvases: HTMLCanvasElement[] = [],
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = 210;
  const addCanvas = (c: HTMLCanvasElement, first: boolean) => {
    const pages = qpgA4PageCount(c.width, c.height);
    const sliceHeightPx = Math.floor(c.width * QPG_A4_RATIO);
    for (let p = 0; p < pages; p++) {
      const slice = document.createElement('canvas');
      slice.width = c.width;
      slice.height = Math.min(sliceHeightPx, c.height - p * sliceHeightPx);
      const sctx = slice.getContext('2d');
      if (!sctx) continue;
      sctx.drawImage(c, 0, p * sliceHeightPx, c.width, slice.height, 0, 0, c.width, slice.height);
      const img = slice.toDataURL('image/png');
      if (!first || p > 0) pdf.addPage();
      pdf.addImage(img, 'PNG', 0, 0, pageWidth, (slice.height / c.width) * pageWidth);
    }
  };
  addCanvas(canvas, true);
  for (const extra of extraCanvases) addCanvas(extra, false);
  pdf.save(fileName);
}

function safeFileName(paper: QpgPaper, suffix: string): string {
  const base = paper.setup.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'question-paper';
  return `${base}-${suffix}.pdf`;
}

/** Free download — watermarked rasterized PDF. The only download the
 *  MVP performs. The OMR Bubble Sheet, when attached, is watermarked
 *  exactly like the paper (tier rule, owner 25 Nov 09:43). */
export async function downloadWatermarkedPaperPdf(
  paper: QpgPaper,
  opts: { includeOmrSheet?: boolean } = {},
): Promise<void> {
  const canvas = await renderPaperCanvas(paper, { watermarked: true });
  const extra: HTMLCanvasElement[] = [];
  if (opts.includeOmrSheet) {
    extra.push(await renderOmrSheetCanvas(paper, { watermarked: true }));
  }
  await canvasToPdf(canvas, safeFileName(paper, 'free-watermarked'), extra);
}

/** Clean Pro export — watermark-free, optional custom logo + Answer
 *  Key sheet + OMR Bubble Sheet (clean, per the tier rule). LOCKED in
 *  the MVP: throws unless proUnlocked is true, and nothing in the MVP
 *  ever passes true. */
export async function downloadCleanPaperPdf(
  paper: QpgPaper,
  opts: {
    proUnlocked: boolean;
    customLogoDataUrl?: string | null;
    includeAnswerKey?: boolean;
    includeOmrSheet?: boolean;
  },
): Promise<void> {
  if (!opts.proUnlocked) {
    throw new Error('Pro export is locked in the MVP — clean PDF requires an approved Pro order.');
  }
  const canvas = await renderPaperCanvas(paper, {
    watermarked: false,
    logoDataUrl: opts.customLogoDataUrl ?? null,
  });
  const extra: HTMLCanvasElement[] = [];
  if (opts.includeOmrSheet) {
    extra.push(await renderOmrSheetCanvas(paper));
  }
  await canvasToPdf(canvas, safeFileName(paper, 'pro-clean'), extra);
  if (opts.includeAnswerKey) {
    const { jsPDF } = await import('jspdf');
    const key = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    key.setFontSize(16);
    key.text('Answer Key', 20, 20);
    key.setFontSize(12);
    paper.questions.forEach((q, i) => {
      key.text(`${i + 1}. ${q.correctLetter}`, 20, 32 + i * 8);
    });
    key.save(safeFileName(paper, 'answer-key'));
  }
}

/** Render the OMR Bubble Sheet DOM to a canvas (2x). Watermarked when
 *  the paper is free, clean when the paper is Pro (tier rule, owner
 *  25 Nov 09:43 — the sheet is NOT Pro-only anymore). */
export async function renderOmrSheetCanvas(
  paper: QpgPaper,
  opts: { watermarked?: boolean } = {},
): Promise<HTMLCanvasElement> {
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed', left: '-10000px', top: '0', zIndex: '-1',
  } as Partial<CSSStyleDeclaration>);
  const dom = buildOmrBubbleSheetDom(paper);
  host.appendChild(dom);
  document.body.appendChild(host);
  try {
    const { default: html2canvas } = await import('html2canvas');
    const shot = await html2canvas(dom, { scale: 2, backgroundColor: '#ffffff' });
    if (opts.watermarked) drawQpgDiagonalWatermark(shot);
    return shot;
  } finally {
    host.remove();
  }
}
