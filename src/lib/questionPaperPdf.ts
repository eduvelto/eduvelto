// Eduvelto — Question Paper Generator: rasterized PDF export.
//
// FREE PDF (the only download that works in the MVP): the paper DOM is
// rendered to canvas with html2canvas at 2x scale and embedded in
// jsPDF as IMAGES — so the PDF text cannot be selected or edited in a
// PDF editor. Every page carries ONE large centered `eduvelto.com`
// watermark (owner 25 Nov 19:03 — the old dense diagonal grid is
// gone), and the text "Powered by Eduvelto.com" sits INSIDE the main
// question container border (it cannot be cropped off without
// cutting the questions).
//
// PAGINATION (owner 25 Nov 19:03 — "moddokane arokom vanga kno?"):
// the old `canvasToPdf` sliced ONE tall canvas into fixed-height
// A4-ratio slices, a pure pixel split that cut Q10 in half (stem on
// page 1, options on page 2) and cut watermark glyphs at the seam.
// Papers are now paginated BETWEEN questions: each question block's
// height is measured from the real DOM, blocks are accumulated onto
// pages, and a whole question moves to the next page when it does not
// fit. Every PDF page is its own render (its own bordered container),
// so there is no slice seam at all. Each question block also carries
// `break-inside: avoid` for the browser print path.
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

/** Paper DOM width in CSS px (A4 at 96dpi ≈ 794px). */
export const QPG_PAPER_DOM_WIDTH = 794;

/** One A4 page height in paper-DOM CSS px. A page DOM taller than
 *  this overflows its PDF page, so pagination budgets against it. */
export const QPG_A4_PAGE_HEIGHT_PX = Math.floor(QPG_PAPER_DOM_WIDTH * QPG_A4_RATIO);

/** Pure helper — how many A4 pages a canvas of this size needs. */
export function qpgA4PageCount(canvasWidth: number, canvasHeight: number): number {
  if (canvasWidth <= 0 || canvasHeight <= 0) return 0;
  return Math.max(1, Math.ceil(canvasHeight / (canvasWidth * QPG_A4_RATIO)));
}

export interface QpgPaperDomOptions {
  /** Free export / preview: bake the single centered watermark into
   *  each page canvas. */
  watermarked: boolean;
  /** Per-user label drawn under the centered watermark (email/uid/
   *  guest) — traceability for a leaked screenshot/PDF. */
  userLabel?: string;
  /** Pro custom logo (client-compressed <50KB data URL, in-memory
   *  only — never uploaded). Rendered in the header of a CLEAN export. */
  logoDataUrl?: string | null;
  /** Question indices (into paper.questions) rendered on this page.
   *  Default: every question. Pagination passes one page's indices. */
  questionIndices?: number[];
  /** Continuation page (page 2+): compact header, no instructions,
   *  section heading or reading passage — those live on page 1. */
  continuation?: boolean;
  /** Footer line ("Eduvelto — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো").
   *  Default true; pagination shows it on the last page only. */
  showFooter?: boolean;
  /** Real render progress (Smart Generation Progress Screen, sprint
   *  27 Nov 2026): called with (done, total) after pagination knows
   *  the page count (done = 0) and after each page canvas is drawn.
   *  Never faked — only fires from the actual render loop. */
  onPageRendered?: (done: number, total: number) => void;
}

const FONT_STACK = "'Hind Siliguri','Noto Sans Bengali',system-ui,-apple-system,'Segoe UI',sans-serif";

function el(
  tag: string,
  text: string,
  style: Partial<CSSStyleDeclaration>,
  className?: string,
): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  Object.assign(node.style, style);
  if (className) node.className = className;
  return node;
}

/** Build one page of the printable paper DOM (A4-width, 794px).
 *  Used by BOTH the PDF export and the rasterized preview, so what
 *  the teacher previews is exactly what the PDF contains.
 *
 *  Pagination (owner 25 Nov 19:03): a page renders ONLY its own
 *  questions (`questionIndices`) inside its own bordered container —
 *  never a slice of a taller render — so a question can never split
 *  across pages. */
export function buildPaperDom(paper: QpgPaper, opts: QpgPaperDomOptions): HTMLElement {
  const { setup } = paper;
  const root = document.createElement('div');
  Object.assign(root.style, {
    width: `${QPG_PAPER_DOM_WIDTH}px`,
    background: '#ffffff',
    color: '#111111',
    fontFamily: FONT_STACK,
    padding: '40px 44px',
    boxSizing: 'border-box',
    position: 'relative',
  } as Partial<CSSStyleDeclaration>);

  // Header — institution name is FREE editable text (owner 25 Nov 08:41).
  // A Pro custom logo (in-memory data URL) renders above it when given.
  // Continuation pages get a compact header (title only).
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
  if (!opts.continuation) {
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
    // Seed (Day 4 hardening, 26 Nov 2026): printed only for set
    // papers (ক/খ/গ/ঘ) — re-entering it rebuilds the identical set.
    const seedPart = setup.setCode && setup.seed !== undefined ? `    •    Seed: ${setup.seed}` : '';
    const metaLine = `তারিখ: ${setup.examDate}    •    পূর্ণমান: ${setup.totalMarks}    •    সময়: ${setup.timeMinutes} মিনিট    •    বিষয় কোড: ${setup.subjectCode.trim() || '—'}    •    সেট: ${setup.setCode || '—'}${seedPart}`;
    header.appendChild(el('div', metaLine, { fontSize: '13px', marginTop: '4px' }));
    header.appendChild(
      el('div', paper.isCustomVariant ? 'কাস্টম ভ্যারিয়েন্ট — প্রকৃত পরীক্ষার প্যাটার্ন নয়' : paper.patternLabelBn, {
        fontSize: '12px', color: '#555555', marginTop: '4px',
      }),
    );
  } else {
    header.appendChild(el('div', setup.title, { fontSize: '16px', fontWeight: '700', marginTop: '4px' }));
    header.appendChild(
      el('div', `সেট: ${setup.setCode || '—'}${setup.setCode && setup.seed !== undefined ? `  •  Seed: ${setup.seed}` : ''}  •  বিষয় কোড: ${setup.subjectCode.trim() || '—'}  •  (চলমান)`, {
        fontSize: '12px', color: '#555555', marginTop: '2px',
      }),
    );
  }
  root.appendChild(header);

  const rule = document.createElement('hr');
  Object.assign(rule.style, { border: 'none', borderTop: '2px solid #111111', margin: '10px 0 12px' } as Partial<CSSStyleDeclaration>);
  root.appendChild(rule);

  if (!opts.continuation && setup.instructions.trim()) {
    const ins = document.createElement('div');
    Object.assign(ins.style, { fontSize: '13px', marginBottom: '14px', lineHeight: '1.6' } as Partial<CSSStyleDeclaration>);
    ins.appendChild(el('strong', 'নির্দেশনা: ', { fontSize: '13px' }));
    ins.appendChild(document.createTextNode(setup.instructions));
    root.appendChild(ins);
  }

  if (!opts.continuation) {
    // Keep the section heading with its first question (print rule).
    const heading = el('div', setup.sectionHeading, {
      fontSize: '15px', fontWeight: '700', marginBottom: '10px',
      breakAfter: 'avoid', pageBreakAfter: 'avoid',
    } as Partial<CSSStyleDeclaration>, 'qpg-section-heading');
    root.appendChild(heading);
    // মানবণ্টন (pattern 4): when the teacher says "answer X of Y",
    // the paper states it under the section heading — the questions
    // beyond X are the extra alternatives, printed on the paper.
    if (setup.answerCount && setup.answerCount > 0 && setup.answerCount < paper.questions.length) {
      root.appendChild(
        el('div', `এই বিভাগের ${setup.answerCount}টি প্রশ্নের উত্তর দিতে হবে (মোট ${paper.questions.length}টি প্রশ্ন দেওয়া আছে)।`, {
          fontSize: '13px', marginBottom: '10px',
        } as Partial<CSSStyleDeclaration>, 'qpg-answer-count'),
      );
    }
  }

  // Reading passage (BCS Batch 1 reading questions need it to be answerable).
  // Page 1 only — a reading question on a later page refers back to it.
  const hasReading = paper.questions.some((q) => q.topicId === 'reading');
  if (!opts.continuation && hasReading) {
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
  // One container PER PAGE: each page is a complete bordered box, so a
  // page break never cuts the container (or a question) in half.
  const container = document.createElement('div');
  container.className = 'qpg-question-container';
  Object.assign(container.style, {
    border: '2px solid #111111', padding: '16px 18px 10px', boxSizing: 'border-box',
  } as Partial<CSSStyleDeclaration>);
  container.appendChild(
    el('div', QPG_BORDER_CREDIT, {
      fontSize: '12px', fontWeight: '700', textAlign: 'center',
      borderBottom: '1px solid #999999', paddingBottom: '8px', marginBottom: '12px',
    }),
  );
  const indices = opts.questionIndices ?? paper.questions.map((_q, i) => i);
  indices.forEach((qi) => {
    const q = paper.questions[qi];
    if (!q) return;
    const qBlock = document.createElement('div');
    qBlock.className = 'qpg-question-block';
    qBlock.setAttribute('data-qpg-question', String(qi + 1));
    // Never split a question across pages (print path + pagination).
    Object.assign(qBlock.style, {
      marginBottom: '14px', fontSize: '14px', lineHeight: '1.6',
      breakInside: 'avoid', pageBreakInside: 'avoid',
    } as Partial<CSSStyleDeclaration>);
    qBlock.appendChild(el('div', `${qi + 1}. ${q.questionText}`, { fontWeight: '600' }));
    const qOpts = document.createElement('div');
    Object.assign(qOpts.style, {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 18px', marginTop: '4px', paddingLeft: '22px',
    } as Partial<CSSStyleDeclaration>);
    q.options.forEach((o) => {
      qOpts.appendChild(el('div', `(${o.letter}) ${o.text}`, { fontSize: '13px' }));
    });
    qBlock.appendChild(qOpts);
    container.appendChild(qBlock);
  });
  root.appendChild(container);

  if (opts.showFooter !== false) {
    root.appendChild(
      el('div', 'Eduvelto — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', {
        fontSize: '11px', color: '#777777', textAlign: 'center', marginTop: '14px',
      }, 'qpg-paper-footer'),
    );
  }

  // NO watermark is baked into the DOM anymore (owner 25 Nov 19:03):
  // the single centered watermark is drawn on each page CANVAS after
  // html2canvas (drawQpgCenteredWatermark, below), so preview and PDF
  // share exactly one watermark implementation — one big mark in the
  // middle of each page, never a dense diagonal grid.
  return root;
}

/** Pure pagination — group question-block heights onto A4 pages.
 *  `firstPageBudget` is the height available for questions on page 1
 *  (after header/instructions/passage/container overhead); later
 *  pages use `laterPageBudget` (compact header). A block is NEVER
 *  split: when the next block does not fit the remaining budget, the
 *  whole block moves to the next page. A single block taller than a
 *  whole page goes alone on its own page (unavoidable; MCQ blocks are
 *  ~60–200px against a ~700px budget, so this never triggers in
 *  practice). Returns pages as arrays of question indices, in order,
 *  each index appearing exactly once. */
export function paginateQpgBlocks(
  blockHeights: number[],
  firstPageBudget: number,
  laterPageBudget: number,
): number[][] {
  const pages: number[][] = [];
  let page: number[] = [];
  let budget = firstPageBudget;
  let used = 0;
  for (let i = 0; i < blockHeights.length; i++) {
    const h = blockHeights[i];
    if (page.length > 0 && used + h > budget) {
      pages.push(page);
      page = [];
      used = 0;
      budget = laterPageBudget;
    }
    page.push(i);
    used += h;
  }
  if (page.length > 0 || pages.length === 0) pages.push(page);
  return pages;
}

type PageDomBuilder = (indices: number[], pageIndex: number, isLast: boolean) => HTMLElement;

/** Build one DOM per page and VERIFY each fits a single A4 page
 *  (offsetHeight ≤ QPG_A4_PAGE_HEIGHT_PX). Measurement can drift from
 *  the probe (font rendering, wrapping), so an overflowing page has
 *  its last block moved to the next page and is rebuilt — up to 50
 *  repairs. A page holding a single block that still overflows is
 *  kept as-is (it cannot be split) and warned about. DOMs are left
 *  attached to `host`; the caller renders them, then removes `host`. */
function buildVerifiedPageDoms(
  host: HTMLElement,
  pages: number[][],
  buildFn: PageDomBuilder,
): HTMLElement[] {
  const remaining = pages.map((p) => [...p]);
  const doms: HTMLElement[] = [];
  let guard = 0;
  for (let k = 0; k < remaining.length; k++) {
    if (guard++ > 50) break;
    const isLast = k === remaining.length - 1;
    const dom = buildFn(remaining[k], k, isLast);
    host.appendChild(dom);
    if (dom.offsetHeight > QPG_A4_PAGE_HEIGHT_PX && remaining[k].length > 1) {
      // Move the last block to the next page and rebuild this one.
      const moved = remaining[k].pop() as number;
      if (k + 1 >= remaining.length) remaining.push([]);
      remaining[k + 1].unshift(moved);
      host.removeChild(dom);
      k--;
      continue;
    }
    if (dom.offsetHeight > QPG_A4_PAGE_HEIGHT_PX) {
      // Single-block page that still overflows — cannot split a
      // question; keep it and warn (unreachable for MCQ blocks).
      // eslint-disable-next-line no-console
      console.warn(
        `[qpg] single question ${remaining[k][0] + 1} alone exceeds one A4 page (${dom.offsetHeight}px) — kept whole`,
      );
    }
    doms.push(dom);
  }
  return doms;
}

/** Measure one probe DOM: question-block heights + the fixed heights
 *  a page's budget must reserve. Returns heights in DOM px. */
function measurePaperProbe(probe: HTMLElement): {
  blockHeights: number[];
  headHeight: number;
  containerTopOverhead: number;
  containerBottomOverhead: number;
  footerHeight: number;
} {
  const blocks = Array.from(probe.querySelectorAll('.qpg-question-block')) as HTMLElement[];
  const container = probe.querySelector('.qpg-question-container') as HTMLElement;
  const footer = probe.querySelector('.qpg-paper-footer') as HTMLElement | null;
  const blockHeights = blocks.map((b) => b.offsetHeight + 14); // + marginBottom
  const headHeight = container ? container.offsetTop : 0;
  let containerTopOverhead = 0;
  let containerBottomOverhead = 0;
  if (container && blocks.length > 0) {
    const cRect = container.getBoundingClientRect();
    const firstRect = blocks[0].getBoundingClientRect();
    const lastRect = blocks[blocks.length - 1].getBoundingClientRect();
    containerTopOverhead = Math.max(0, Math.round(firstRect.top - cRect.top));
    containerBottomOverhead = Math.max(0, Math.round(cRect.bottom - lastRect.bottom));
  } else if (container) {
    containerTopOverhead = container.offsetHeight;
  }
  const footerHeight = footer ? footer.offsetHeight + 14 : 0; // + marginTop
  return { blockHeights, headHeight, containerTopOverhead, containerBottomOverhead, footerHeight };
}

/** ONE large centered eduvelto.com watermark per page canvas
 *  (owner 25 Nov 19:03 — "moddokane 1 ta boro kore takle hobe").
 *  Replaces the old dense diagonal grid (35 marks). The per-user
 *  label, when given, is drawn smaller directly underneath — the
 *  watermark stays ONE mark in the middle of the page.
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
 *  identity BEFORE our own translate/rotate, so the mark lands on
 *  the canvas. Never drop this reset. */
export function drawQpgCenteredWatermark(canvas: HTMLCanvasElement, userLabel?: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  // Reset html2canvas's leftover transform (see comment above) —
  // translate/rotate below must compose on IDENTITY, not on the
  // renderer's offset matrix.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const big = Math.round(canvas.width / 13);
  ctx.font = `bold ${big}px sans-serif`;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-0.5);
  ctx.fillText(QPG_WATERMARK_TEXT, 0, 0);
  if (userLabel) {
    const small = Math.round(canvas.width / 32);
    ctx.font = `700 ${small}px sans-serif`;
    ctx.fillText(userLabel, 0, Math.round(big * 0.9));
  }
  ctx.restore();
}

/** Render the paper to ONE canvas per A4 page (2x scale), paginated
 *  BETWEEN questions — never mid-question. Each page canvas gets the
 *  single centered watermark when watermarked. The preview and the
 *  PDF both use this, so they can never disagree. */
export async function renderPaperCanvases(
  paper: QpgPaper,
  opts: QpgPaperDomOptions,
): Promise<HTMLCanvasElement[]> {
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed', left: '-10000px', top: '0', zIndex: '-1',
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(host);
  try {
    // Probe: measure the real block heights + fixed overheads.
    const probe = buildPaperDom(paper, { ...opts, questionIndices: paper.questions.map((_q, i) => i) });
    host.appendChild(probe);
    const m = measurePaperProbe(probe);
    // Continuation-page overhead: build a zero-question continuation
    // probe and measure where its container starts.
    const contProbe = buildPaperDom(paper, {
      ...opts,
      questionIndices: [],
      continuation: true,
      showFooter: false,
    });
    host.appendChild(contProbe);
    const contContainer = contProbe.querySelector('.qpg-question-container') as HTMLElement | null;
    const contHead = contContainer ? contContainer.offsetTop : m.headHeight;
    host.removeChild(contProbe);
    host.removeChild(probe);

    // Budgets reserve the footer on every page (it only prints on the
    // last one) — conservative, so a page never overflows by the
    // footer's height.
    const firstBudget =
      QPG_A4_PAGE_HEIGHT_PX - m.headHeight - m.containerTopOverhead - m.containerBottomOverhead - m.footerHeight;
    const laterBudget =
      QPG_A4_PAGE_HEIGHT_PX - contHead - m.containerTopOverhead - m.containerBottomOverhead - m.footerHeight;
    const pages = paginateQpgBlocks(m.blockHeights, firstBudget, laterBudget);
    const doms = buildVerifiedPageDoms(host, pages, (indices, pageIndex, isLast) =>
      buildPaperDom(paper, {
        ...opts,
        questionIndices: indices,
        continuation: pageIndex > 0,
        showFooter: isLast,
      }),
    );

    // Dynamic import ONLY — html2canvas must never enter the main
    // bundle (zero-bundle-bloat rule, owner 25 Nov 08:48).
    const { default: html2canvas } = await import('html2canvas');
    const canvases: HTMLCanvasElement[] = [];
    opts.onPageRendered?.(0, doms.length);
    for (const dom of doms) {
      const shot = await html2canvas(dom, { scale: 2, backgroundColor: '#ffffff' });
      if (opts.watermarked) drawQpgCenteredWatermark(shot, opts.userLabel);
      canvases.push(shot);
      opts.onPageRendered?.(canvases.length, doms.length);
    }
    return canvases;
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
export function buildOmrBubbleSheetDom(
  paper: QpgPaper,
  opts: { rowIndices?: number[]; continuation?: boolean } = {},
): HTMLElement {
  const root = document.createElement('div');
  Object.assign(root.style, {
    width: `${QPG_PAPER_DOM_WIDTH}px`,
    background: '#ffffff',
    color: '#111111',
    fontFamily: FONT_STACK,
    padding: '40px 44px',
    boxSizing: 'border-box',
    // position:relative (Day 4 fix, 26 Nov 2026): the continuation
    // probe measures grid.offsetTop to compute the later-page budget.
    // Without this, the grid's offsetParent is the shared off-screen
    // host (which already holds the full-sheet probe), so contHead
    // came back as ~1182px (probe height + header) instead of ~91px
    // and laterBudget went NEGATIVE (-95px) — every page after the
    // first held exactly ONE bubble row, so a 35-question sheet became
    // 17 pages (19 + 1x16) instead of 2. The paper DOM already sets
    // position:relative for the same reason; the OMR root was the only
    // one missing it. No visual change (no absolutely-positioned
    // children inside this root).
    position: 'relative',
  } as Partial<CSSStyleDeclaration>);
  root.appendChild(
    el('div', 'OMR উত্তরপত্র (Bubble Sheet)', { fontSize: '18px', fontWeight: '700', textAlign: 'center' }),
  );
  root.appendChild(
    el('div', `${paper.setup.title}  •  সেট: ${paper.setup.setCode || '—'}${paper.setup.setCode && paper.setup.seed !== undefined ? `  •  Seed: ${paper.setup.seed}` : ''}  •  বিষয় কোড: ${paper.setup.subjectCode.trim() || '—'}`, {
      fontSize: '13px', textAlign: 'center', marginTop: '6px',
    }),
  );
  if (!opts.continuation) {
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
  }
  const grid = document.createElement('div');
  grid.className = 'qpg-omr-grid';
  Object.assign(grid.style, {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 28px',
  } as Partial<CSSStyleDeclaration>);
  const indices = opts.rowIndices ?? paper.questions.map((_q, i) => i);
  indices.forEach((qi) => {
    const row = document.createElement('div');
    row.className = 'qpg-omr-row';
    Object.assign(row.style, {
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '14px', borderBottom: '1px solid #eeeeee', padding: '6px 0',
      breakInside: 'avoid', pageBreakInside: 'avoid',
    } as Partial<CSSStyleDeclaration>);
    row.appendChild(el('span', `${qi + 1}.`, { fontWeight: '700' }));
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
    }, 'qpg-omr-credit'),
  );
  return root;
}

/** Render the OMR Bubble Sheet to one canvas per A4 page (2x),
 *  paginated BETWEEN bubble rows — a row never splits across pages.
 *  Watermarked when the paper is free, clean when the paper is Pro
 *  (tier rule, owner 25 Nov 09:43 — the sheet is NOT Pro-only
 *  anymore). One centered watermark per page when watermarked. */
export async function renderOmrSheetCanvases(
  paper: QpgPaper,
  opts: { watermarked?: boolean; userLabel?: string } = {},
): Promise<HTMLCanvasElement[]> {
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed', left: '-10000px', top: '0', zIndex: '-1',
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(host);
  try {
    const probe = buildOmrBubbleSheetDom(paper);
    host.appendChild(probe);
    const rows = Array.from(probe.querySelectorAll('.qpg-omr-row')) as HTMLElement[];
    const grid = probe.querySelector('.qpg-omr-grid') as HTMLElement;
    const credit = probe.querySelector('.qpg-omr-credit') as HTMLElement | null;
    const rowHeights = rows.map((r) => r.offsetHeight + 8); // + grid row gap
    const headHeight = grid ? grid.offsetTop : 0;
    const creditHeight = credit ? credit.offsetHeight + 16 : 0; // + marginTop
    const contProbe = buildOmrBubbleSheetDom(paper, { rowIndices: [], continuation: true });
    host.appendChild(contProbe);
    const contGrid = contProbe.querySelector('.qpg-omr-grid') as HTMLElement | null;
    const contHead = contGrid ? contGrid.offsetTop : headHeight;
    host.removeChild(contProbe);
    host.removeChild(probe);

    const firstBudget = QPG_A4_PAGE_HEIGHT_PX - headHeight - creditHeight;
    const laterBudget = QPG_A4_PAGE_HEIGHT_PX - contHead - creditHeight;
    const pages = paginateQpgBlocks(rowHeights, firstBudget, laterBudget);
    const doms = buildVerifiedPageDoms(host, pages, (indices, pageIndex) =>
      buildOmrBubbleSheetDom(paper, { rowIndices: indices, continuation: pageIndex > 0 }),
    );
    const { default: html2canvas } = await import('html2canvas');
    const canvases: HTMLCanvasElement[] = [];
    for (const dom of doms) {
      const shot = await html2canvas(dom, { scale: 2, backgroundColor: '#ffffff' });
      if (opts.watermarked) drawQpgCenteredWatermark(shot, opts.userLabel);
      canvases.push(shot);
    }
    return canvases;
  } finally {
    host.remove();
  }
}

/** Write one canvas per PDF page via jsPDF. Each canvas IS one A4
 *  page — no slicing, so no seam can cut content in half. jsPDF is
 *  dynamically imported here — never in the main bundle. */
async function canvasPagesToPdf(
  canvases: HTMLCanvasElement[],
  fileName: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  addCanvasPagesToPdf(pdf, canvases);
  pdf.save(fileName);
}

/** Minimal structural type for the jsPDF instance the helpers below
 *  write into. Kept structural (not `import type { jsPDF }`) so the
 *  module has NO static jspdf import of any kind — the real class
 *  still arrives only via dynamic import(). */
type QpgPdfWriter = {
  addPage(): void;
  addImage(imageData: string, format: string, x: number, y: number, w: number, h: number): void;
  setFontSize(size: number): void;
  text(text: string, x: number, y: number): void;
  save(fileName: string): void;
};

/** Append one canvas per A4 page to an open jsPDF document. */
function addCanvasPagesToPdf(pdf: QpgPdfWriter, canvases: HTMLCanvasElement[]): void {
  const pageWidth = 210;
  canvases.forEach((c, i) => {
    if (i > 0) pdf.addPage();
    const img = c.toDataURL('image/png');
    pdf.addImage(img, 'PNG', 0, 0, pageWidth, (c.height / c.width) * pageWidth);
  });
}

/** Append the Answer Key as pages of the SAME PDF (Day 4 hardening,
 *  26 Nov 2026): the Pro download is ONE file — paper pages first,
 *  then the key. The old code created a SECOND jsPDF and saved the
 *  key as its own separate file, so the key was not "in" the Pro
 *  PDF at all. Paginated: a new page starts when the next line would
 *  pass y=280mm, so a 40+ question paper never runs off the page
 *  (the old code wrote 32 + i*8 with no pagination). */
function addAnswerKeyPagesToPdf(pdf: QpgPdfWriter, paper: QpgPaper): void {
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Answer Key', 20, 20);
  pdf.setFontSize(12);
  let y = 32;
  paper.questions.forEach((q, i) => {
    if (y > 280) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Answer Key (continued)', 20, 20);
      pdf.setFontSize(12);
      y = 32;
    }
    pdf.text(`${i + 1}. ${q.correctLetter}`, 20, y);
    y += 8;
  });
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
  opts: { includeOmrSheet?: boolean; userLabel?: string } = {},
): Promise<void> {
  const pages = await renderPaperCanvases(paper, { watermarked: true, userLabel: opts.userLabel });
  const extra: HTMLCanvasElement[] = [];
  if (opts.includeOmrSheet) {
    extra.push(...(await renderOmrSheetCanvases(paper, { watermarked: true, userLabel: opts.userLabel })));
  }
  await canvasPagesToPdf([...pages, ...extra], safeFileName(paper, 'free-watermarked'));
}

/** Clean Pro export — watermark-free, optional custom logo + Answer
 *  Key sheet + OMR Bubble Sheet (clean, per the tier rule). The
 *  Answer Key is pages INSIDE this one PDF (not a separate file).
 *  LOCKED in the MVP: throws unless proUnlocked is true, and nothing
 *  in the MVP ever passes true. */
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
  const pages = await renderPaperCanvases(paper, {
    watermarked: false,
    logoDataUrl: opts.customLogoDataUrl ?? null,
  });
  const extra: HTMLCanvasElement[] = [];
  if (opts.includeOmrSheet) {
    extra.push(...(await renderOmrSheetCanvases(paper)));
  }
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  addCanvasPagesToPdf(pdf, [...pages, ...extra]);
  if (opts.includeAnswerKey) {
    addAnswerKeyPagesToPdf(pdf, paper);
  }
  pdf.save(safeFileName(paper, 'pro-clean'));
}
