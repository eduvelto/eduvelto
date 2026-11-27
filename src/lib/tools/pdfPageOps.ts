/**
 * PDF page operations — shared pdf-lib engine (Batch 3, 27 Nov 2026).
 *
 * Shared by pdf-page-extractor, pdf-page-reorder, pdf-page-remover,
 * pdf-watermark and (page-count only) pdf-to-jpg. `pdf-lib` is loaded
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
