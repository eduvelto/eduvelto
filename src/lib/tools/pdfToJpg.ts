/**
 * PDF to JPG — pure logic + pdf.js rendering.
 *
 * Renders each page of a PDF to a JPG image, 100% in the browser.
 * Engine: pdf.js (Mozilla, `pdfjs-dist` 5.4.624, LEGACY build), loaded
 * with a dynamic `import()` INSIDE the functions only (never a static
 * import), so the library is lazy-loaded when the user picks a file.
 *
 * Version note (verified 27 Nov 2026): the current 6.x line (6.5.438)
 * needs ES2025 APIs (`Math.sumPrecise`, `Uint8Array.toHex`) that this
 * project's Node v24.22.1 does not have, and it dropped the legacy
 * build — so it cannot run in Node tests and would fail on older
 * browsers too. 5.4.624 (Nov 2025, same Mozilla repo) is the newest
 * line with a legacy build that runs in Node tests and all modern
 * browsers, so the legacy build is used here, in the browser as well.
 *
 * Pure functions (apart from the lazy library load): no network, no
 * storage. Canvas access goes through the injected `PdfDomDeps` so
 * Node tests can supply a fake canvas; the browser uses a real one.
 */

export const PDF_TO_JPG_MAX_MB = 10;
export const PDF_TO_JPG_MAX_PAGES = 50;

export interface PdfPageSize {
  width: number;
  height: number;
}

export interface PdfInfo {
  pageCount: number;
  pages: PdfPageSize[];
}

export interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  blob: Blob;
}

export interface PdfToJpgOptions {
  /** Render scale: 1 = 72 DPI, 2 = 144 DPI. */
  scale: number;
  /** JPEG quality 0.1–1. */
  quality: number;
  /** Max pages to render (default 50). */
  maxPages?: number;
  /** Called after each page renders: (done, total). */
  onProgress?: (done: number, total: number) => void;
}

export interface PdfCanvas {
  width: number;
  height: number;
  getContext(contextId: '2d'): CanvasRenderingContext2D | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

export interface PdfDomDeps {
  createCanvas(width: number, height: number): PdfCanvas;
}

export function defaultPdfDomDeps(): PdfDomDeps {
  return {
    createCanvas: (width: number, height: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas as unknown as PdfCanvas;
    },
  };
}

export function isPdfFile(file: Blob, name?: string): boolean {
  return (
    file.type === 'application/pdf' ||
    (typeof name === 'string' && name.toLowerCase().endsWith('.pdf'))
  );
}

/** Strip directories and the .pdf suffix: "a/b/c.PDF" -> "c". */
export function baseNameOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  return base.replace(/\.pdf$/i, '') || 'pdf-page';
}

/** "report.pdf" page 2 of 3 -> "report-p2.jpg"; single page -> "report.jpg". */
export function jpegFileName(baseName: string, pageNumber: number, totalPages: number): string {
  const safe = baseName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'pdf-page';
  return totalPages <= 1 ? `${safe}.jpg` : `${safe}-p${pageNumber}.jpg`;
}

export function validateRenderOptions(scale: number, quality: number): void {
  if (!Number.isFinite(scale) || scale < 0.5 || scale > 3) {
    throw new Error('Scale must be between 0.5 and 3');
  }
  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1) {
    throw new Error('JPEG quality must be between 0.1 and 1');
  }
}

/** Pixel size of a rendered page: PDF points (1/72 inch) x scale. */
export function computeRenderSize(page: PdfPageSize, scale: number): PdfPageSize {
  return {
    width: Math.max(1, Math.round(page.width * scale)),
    height: Math.max(1, Math.round(page.height * scale)),
  };
}

type PdfJsLib = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfDocumentProxy = Awaited<ReturnType<PdfJsLib['getDocument']>['promise']>;

async function loadPdfJs(): Promise<PdfJsLib> {
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsLib;
  // Browser only: point pdf.js at its worker (bundled as an asset URL).
  // In Node tests there is no window and pdf.js uses its fake worker.
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    const { default: workerUrl } = await import(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
    );
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  return pdfjs;
}

function isPasswordError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'PasswordException'
  );
}

function isInvalidPdfError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'InvalidPDFException'
  );
}

/**
 * Read a PDF's page count and each page's size (in PDF points).
 *
 * @param pdf the source PDF as a File/Blob.
 * @throws when the input is empty/not a PDF, or password-protected.
 */
export async function getPdfInfo(pdf: Blob): Promise<PdfInfo> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('getPdfInfo needs a non-empty PDF file');
  }
  const pdfjs = await loadPdfJs();
  let doc: PdfDocumentProxy;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise;
  } catch (e) {
    if (isPasswordError(e)) {
      throw new Error('This PDF is password-protected — remove the password first');
    }
    if (isInvalidPdfError(e)) {
      throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
    }
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  const pages: PdfPageSize[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    pages.push({ width: viewport.width, height: viewport.height });
  }
  return { pageCount: doc.numPages, pages };
}

/**
 * Render every page of a PDF to a JPG Blob (one per page).
 *
 * Loads the document once, then renders pages in order. The canvas
 * comes from `deps` (real browser canvas by default; inject a fake
 * one in Node tests — the real JPEG bytes are verified in a live
 * browser, where a real canvas exists).
 *
 * @throws on empty/non-PDF input, password-protected PDFs, more pages
 *   than `maxPages`, or bad scale/quality.
 */
export async function renderPdfToJpegs(
  pdf: Blob,
  options: PdfToJpgOptions,
  deps: PdfDomDeps = defaultPdfDomDeps(),
): Promise<RenderedPage[]> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('renderPdfToJpegs needs a non-empty PDF file');
  }
  validateRenderOptions(options.scale, options.quality);
  const maxPages = options.maxPages ?? PDF_TO_JPG_MAX_PAGES;
  const pdfjs = await loadPdfJs();
  let doc: PdfDocumentProxy;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise;
  } catch (e) {
    if (isPasswordError(e)) {
      throw new Error('This PDF is password-protected — remove the password first');
    }
    throw new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  if (doc.numPages > maxPages) {
    throw new Error(
      `This PDF has ${doc.numPages} pages — this tool converts up to ${maxPages} pages at a time`,
    );
  }
  const out: RenderedPage[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: options.scale });
    const width = Math.max(1, Math.round(viewport.width));
    const height = Math.max(1, Math.round(viewport.height));
    const canvas = deps.createCanvas(width, height);
    // pdf.js 5.4 takes the canvas element (it gets the 2d context
    // itself); passing canvasContext instead is ignored when canvas
    // is present, so pass the canvas.
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Could not encode this page as JPG'))),
        'image/jpeg',
        options.quality,
      );
    });
    out.push({ pageNumber: n, width, height, blob });
    options.onProgress?.(n, doc.numPages);
  }
  return out;
}
