/**
 * PDF page operations — shared pdf-lib engine (Batch 3, 27 Nov 2026).
 *
 * Shared by pdf-page-extractor, pdf-page-reorder, pdf-page-remover,
 * pdf-watermark, pdf-merger, pdf-rotate and pdf-page-number-adder
 * (page-count only) pdf-to-jpg. `pdf-lib` is loaded
 * with a dynamic `import()` INSIDE each function only (never a static
 * import), so the library stays out of the main bundle. All processing
 * is 100% in the browser: the file never leaves the device.
 *
 * NOTE: pdf-lib cannot rasterize pages to images and cannot encrypt
 * PDFs — pdf-to-jpg and pdf-password-protector are therefore NOT built
 * on this engine (see their tool UIs for the honest explanation).
 */

export { parsePageSelection } from './pdfSplitter';

export type WatermarkPosition =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface WatermarkOptions {
  text: string;
  /** 0–1 (default 0.3). */
  opacity?: number;
  /** Font size in points (default 48). */
  fontSize?: number;
  /** Diagonal angle in degrees (default 45 for center, 0 otherwise). */
  angleDeg?: number;
  position?: WatermarkPosition;
  /** Greyscale 0 (black) – 1 (white), default 0.5. */
  gray?: number;
}

async function loadSource(pdf: Blob) {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('A non-empty PDF file is required');
  }
  const { PDFDocument } = await import('pdf-lib');
  try {
    return await PDFDocument.load(await pdf.arrayBuffer());
  } catch {
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
}

async function saveDoc(doc: Awaited<ReturnType<typeof import('pdf-lib').PDFDocument.create>>): Promise<Blob> {
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

function checkPages(pages: number[], pageCount: number): void {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('At least one page number is required');
  }
  pages.forEach((page, i) => {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new Error(
        `Page ${page} (entry ${i + 1}) is out of range: this PDF has ${pageCount} page(s), use pages 1-${pageCount}`,
      );
    }
  });
}

/** Read the real page count of a PDF. */
export async function getPdfPageCount(pdf: Blob): Promise<number> {
  const source = await loadSource(pdf);
  return source.getPageCount();
}

/** Keep only the given 1-based pages, in the given order. */
export async function extractPdfPages(pdf: Blob, pages: number[]): Promise<Blob> {
  const source = await loadSource(pdf);
  checkPages(pages, source.getPageCount());
  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, pages.map((p) => p - 1));
  copied.forEach((page) => output.addPage(page));
  return saveDoc(output);
}

/** Remove the given 1-based pages; the rest stay in order. */
export async function removePdfPages(pdf: Blob, pagesToRemove: number[]): Promise<Blob> {
  const source = await loadSource(pdf);
  const pageCount = source.getPageCount();
  checkPages(pagesToRemove, pageCount);
  const remove = new Set(pagesToRemove);
  const keep: number[] = [];
  for (let p = 1; p <= pageCount; p++) if (!remove.has(p)) keep.push(p);
  if (keep.length === 0) {
    throw new Error('Removing these pages would leave an empty PDF — keep at least one page');
  }
  return extractPdfPages(pdf, keep);
}

/**
 * Reorder pages into the given 1-based order (must list every page
 * exactly once) and optionally rotate pages: rotations maps a 1-based
 * page number to 0 / 90 / 180 / 270 degrees clockwise.
 */
export async function reorderPdfPages(
  pdf: Blob,
  order: number[],
  rotations?: Record<number, number>,
): Promise<Blob> {
  const source = await loadSource(pdf);
  const pageCount = source.getPageCount();
  checkPages(order, pageCount);
  if (order.length !== pageCount || new Set(order).size !== pageCount) {
    throw new Error(
      `Reorder needs every page exactly once: this PDF has ${pageCount} page(s) but the order lists ${order.length}`,
    );
  }
  const { PDFDocument, degrees } = await import('pdf-lib');
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, order.map((p) => p - 1));
  copied.forEach((page, i) => {
    const rot = rotations?.[order[i]] ?? 0;
    if (rot !== 0) {
      if (![90, 180, 270].includes(rot)) {
        throw new Error(`Rotation for page ${order[i]} must be 90, 180 or 270 degrees, got ${rot}`);
      }
      page.setRotation(degrees(rot));
    }
    output.addPage(page);
  });
  return saveDoc(output);
}

/**
 * Stamp a text watermark on every page. The text is drawn with the
 * built-in Helvetica font (Latin letters and digits only — Bangla
 * glyphs are not available in pdf-lib's standard fonts, so non-Latin
 * characters are replaced with '?'; the UI states this plainly).
 */
export async function stampPdfWatermark(pdf: Blob, options: WatermarkOptions): Promise<Blob> {
  const text = (options.text ?? '').trim();
  if (!text) throw new Error('Watermark text must not be empty');
  if (text.length > 60) throw new Error('Watermark text must be 60 characters or fewer');
  const opacity = options.opacity ?? 0.3;
  if (!Number.isFinite(opacity) || opacity <= 0 || opacity > 1) {
    throw new Error(`Watermark opacity must be between 0 and 1, got ${opacity}`);
  }
  const fontSize = options.fontSize ?? 48;
  if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 200) {
    throw new Error(`Watermark font size must be between 8 and 200, got ${fontSize}`);
  }
  const gray = options.gray ?? 0.5;
  const position = options.position ?? 'center';
  const source = await loadSource(pdf);
  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib');
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, source.getPages().map((_, i) => i));
  const font = await output.embedFont(StandardFonts.Helvetica);
  const safeText = text.replace(/[^\x20-\x7E]/g, '?');
  copied.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(safeText, fontSize);
    const angleDeg = options.angleDeg ?? (position === 'center' ? 45 : 0);
    const angle = degrees(angleDeg);
    let x = (width - textWidth) / 2;
    let y = height / 2;
    if (position === 'top-left') { x = 36; y = height - 36 - fontSize; }
    if (position === 'top-right') { x = width - 36 - textWidth; y = height - 36 - fontSize; }
    if (position === 'bottom-left') { x = 36; y = 36; }
    if (position === 'bottom-right') { x = width - 36 - textWidth; y = 36; }
    page.drawText(safeText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(gray, gray, gray),
      opacity,
      rotate: angle,
    });
    output.addPage(page);
  });
  return saveDoc(output);
}

/** Latin-safe version of a watermark string (what actually lands in the PDF). */
export function latinSafeText(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '?');
}

/* ------------------------------------------------- Landed 27 Nov 2026 (A-tools) */
// loadSource/saveDoc/checkPages and the dynamic-import pdf-lib pattern).
// These functions follow that file's conventions exactly. Do not copy this
// file into the repo as-is: merge the three exports into pdfPageOps.ts and
// delete this draft. pdf-merger extraction: LifePdfToolsPage.tsx:227-235
// (hub merge) becomes mergePdfs() below; the hub then calls mergePdfs() too.

export type RotationDeg = 90 | 180 | 270;

export interface MergeFileInput {
  blob: Blob;
  name: string;
  /** 1-based pages to take from this file; default = all pages. */
  pages?: number[];
  /** 1-based page -> rotation for this file. */
  rotations?: Record<number, number>;
}

export interface MergeResult {
  blob: Blob;
  totalPages: number;
  perFilePages: number[];
}

/**
 * Merge 2+ PDFs into one, in the given order. Per-file page ranges and
 * rotations are supported (same semantics as extractPdfPages /
 * reorderPdfPages). Password-protected or corrupt files throw.
 * Hand-check: merge(2-page, 3-page) -> 5 pages, order preserved.
 */
export async function mergePdfs(files: MergeFileInput[]): Promise<MergeResult> {
  if (!Array.isArray(files) || files.length < 2) {
    throw new Error('Merging needs at least 2 PDF files');
  }
  const { PDFDocument, degrees } = await import('pdf-lib');
  const output = await PDFDocument.create();
  const perFilePages: number[] = [];
  for (const file of files) {
    if (!(file.blob instanceof Blob) || file.blob.size === 0) {
      throw new Error(`"${file.name}" is empty or not a file`);
    }
    let src: Awaited<ReturnType<typeof PDFDocument.load>>;
    try {
      src = await PDFDocument.load(await file.blob.arrayBuffer());
    } catch {
      throw new Error(
        `"${file.name}" could not be read as a PDF — it may be corrupt or password-protected`,
      );
    }
    const pageCount = src.getPageCount();
    const wanted = file.pages ?? src.getPageIndices().map((i) => i + 1);
    wanted.forEach((p) => {
      if (!Number.isInteger(p) || p < 1 || p > pageCount) {
        throw new Error(
          `"${file.name}" has ${pageCount} page(s) but page ${p} was requested`,
        );
      }
    });
    const copied = await output.copyPages(src, wanted.map((p) => p - 1));
    copied.forEach((page, i) => {
      const rot = file.rotations?.[wanted[i]] ?? 0;
      if (rot !== 0) {
        if (![90, 180, 270].includes(rot)) {
          throw new Error(`Rotation for page ${wanted[i]} must be 90, 180 or 270 degrees, got ${rot}`);
        }
        page.setRotation(degrees(rot));
      }
      output.addPage(page);
    });
    perFilePages.push(wanted.length);
  }
  const bytes = await output.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    totalPages: perFilePages.reduce((a, b) => a + b, 0),
    perFilePages,
  };
}

/**
 * Rotate pages of one PDF without reordering. rotations maps a 1-based page
 * number to 90 | 180 | 270. Pages not listed are left alone.
 * Hand-check: rotate {2: 90} on a 3-page PDF -> page 2 rotated, 1 and 3 untouched.
 */
export async function rotatePdfPages(
  pdf: Blob,
  rotations: Record<number, number>,
): Promise<Blob> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('A non-empty PDF file is required');
  }
  const entries = Object.entries(rotations);
  if (entries.length === 0) {
    throw new Error('Choose at least one page and a rotation');
  }
  const { PDFDocument, degrees } = await import('pdf-lib');
  let src: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    src = await PDFDocument.load(await pdf.arrayBuffer());
  } catch {
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  const pageCount = src.getPageCount();
  for (const [key, rot] of entries) {
    const p = Number(key);
    if (!Number.isInteger(p) || p < 1 || p > pageCount) {
      throw new Error(`Page ${key} is out of range: this PDF has ${pageCount} page(s)`);
    }
    if (![90, 180, 270].includes(rot)) {
      throw new Error(`Rotation for page ${key} must be 90, 180 or 270 degrees, got ${rot}`);
    }
  }
  const output = await PDFDocument.create();
  const copied = await output.copyPages(src, src.getPageIndices());
  copied.forEach((page, i) => {
    const rot = rotations[i + 1] ?? 0;
    if (rot !== 0) {
      if (![90, 180, 270].includes(rot)) {
        throw new Error(`Rotation for page ${i + 1} must be 90, 180 or 270 degrees, got ${rot}`);
      }
      page.setRotation(degrees(rot));
    }
    output.addPage(page);
  });
  const bytes = await output.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

export type PageNumberPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type PageNumberFormat = 'n' | 'page-n' | 'page-n-of-p' | 'n-of-p' | 'custom';

export interface PageNumberOptions {
  position?: PageNumberPosition; // default 'bottom-center'
  format?: PageNumberFormat; // default 'n'
  customFormat?: string; // must contain {n} when format is 'custom'
  startAt?: number; // default 1
  skipFirstPage?: boolean; // cover gets no number and consumes no number
  pages?: number[]; // default: all pages
  facingPages?: boolean; // odd pages right, even pages left (outer edges)
  fontSize?: number; // default 14, range 8-24
  gray?: number; // 0 black - 1 white, default 0
  margin?: number; // points from edge, default 36
  headerText?: string; // Latin only in phase 1 (see latinSafeText)
  footerText?: string; // Latin only in phase 1
}


function formatPageNumber(
  format: PageNumberFormat,
  customFormat: string | undefined,
  n: number,
  total: number,
): string {
  switch (format) {
    case 'n':
      return String(n);
    case 'page-n':
      return `Page ${n}`;
    case 'page-n-of-p':
      return `Page ${n} of ${total}`;
    case 'n-of-p':
      return `${n}/${total}`;
    case 'custom':
      return (customFormat ?? '').split('{n}').join(String(n)).split('{p}').join(String(total));
    default:
      return String(n);
  }
}

/**
 * Stamp page numbers on a PDF. Numbers use the built-in Helvetica font
 * (Latin letters and digits only — Bangla digits need an embedded Bangla font,
 * phase 2; the UI must say so). Cover exclusion: the first page gets no number
 * and does not consume one (page 2 shows startAt).
 * Hand-check: 5 pages, startAt 3, skipFirst -> pages 2-5 show 3,4,5,6.
 */
export async function stampPdfPageNumbers(pdf: Blob, options: PageNumberOptions): Promise<Blob> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('A non-empty PDF file is required');
  }
  const format = options.format ?? 'n';
  if (format === 'custom' && !(options.customFormat ?? '').includes('{n}')) {
    throw new Error('Custom format must contain {n} for the page number');
  }
  const startAt = options.startAt ?? 1;
  if (!Number.isInteger(startAt) || startAt < 1) {
    throw new Error(`Starting number must be a whole number of 1 or more, got ${startAt}`);
  }
  const fontSize = options.fontSize ?? 14;
  if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 24) {
    throw new Error(`Font size must be between 8 and 24, got ${fontSize}`);
  }
  const margin = options.margin ?? 36;
  const gray = options.gray ?? 0;
  const position = options.position ?? 'bottom-center';
  const skipFirst = options.skipFirstPage ?? false;

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  let src: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    src = await PDFDocument.load(await pdf.arrayBuffer());
  } catch {
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  const pageCount = src.getPageCount();
  const wanted = options.pages ?? src.getPageIndices().map((i) => i + 1);
  wanted.forEach((p) => {
    if (!Number.isInteger(p) || p < 1 || p > pageCount) {
      throw new Error(`Page ${p} is out of range: this PDF has ${pageCount} page(s)`);
    }
  });
  const wantedSet = new Set(wanted);
  const output = await PDFDocument.create();
  const copied = await output.copyPages(src, src.getPageIndices());
  const font = await output.embedFont(StandardFonts.Helvetica);
  const header = options.headerText ? latinSafeText(options.headerText) : '';
  const footer = options.footerText ? latinSafeText(options.footerText) : '';
  copied.forEach((page, i) => {
    const pageNo = i + 1;
    if (!wantedSet.has(pageNo)) {
      output.addPage(page);
      return;
    }
    if (skipFirst && pageNo === 1) {
      output.addPage(page);
      return;
    }
    // Display number: cover does not consume a number.
    const n = startAt + pageNo - 1 - (skipFirst ? 1 : 0);
    const label = formatPageNumber(format, options.customFormat, n, pageCount);
    const { width, height } = page.getSize();
    const isTop = position.startsWith('top');
    let pos = position;
    if (options.facingPages) {
      const isOdd = pageNo % 2 === 1;
      pos = isTop
        ? isOdd ? 'top-right' : 'top-left'
        : isOdd ? 'bottom-right' : 'bottom-left';
    }
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    let x = (width - textWidth) / 2;
    if (pos.endsWith('left')) x = margin;
    if (pos.endsWith('right')) x = width - margin - textWidth;
    const y = isTop ? height - margin - fontSize : margin;
    page.drawText(label, { x, y, size: fontSize, font, color: rgb(gray, gray, gray) });
    if (header) {
      const hw = font.widthOfTextAtSize(header, fontSize);
      page.drawText(header, { x: (width - hw) / 2, y: height - margin - fontSize, size: fontSize, font, color: rgb(gray, gray, gray) });
    }
    if (footer && pos !== 'bottom-center') {
      const fw = font.widthOfTextAtSize(footer, fontSize);
      page.drawText(footer, { x: (width - fw) / 2, y: margin, size: fontSize, font, color: rgb(gray, gray, gray) });
    }
    output.addPage(page);
  });
  const bytes = await output.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
