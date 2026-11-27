/**
 * PDF to Word — pure logic (Tool #142).
 *
 * Converts a PDF's text layer into an editable .docx, 100% in the
 * browser. The file never leaves the device.
 *
 * Pipeline: pdf.js (Mozilla, `pdfjs-dist` 5.4.624 legacy, same lazy
 * dynamic-import pattern as pdfToJpg.ts) extracts the text per page,
 * then `docx` ^9.16.0 (dynamic import inside the builder, like
 * questionPaperDocx.ts) generates the Word document, downloaded as a
 * blob. No Firestore, no login, no server.
 *
 * FONT SELECTION (owner requirement, 27 Nov 2026): the user picks one
 * Bangla font and one English font; each text run is set in the font
 * matching its script (Bengali Unicode block U+0980–U+09FF, plus the
 * Bangla danda U+0964/U+0965 and joiners U+200C/U+200D, = Bangla).
 * Mixed-script lines keep each run in its own font. The font NAME is
 * embedded in the document — if the reader's Word does not have that
 * font installed it falls back to another font, as with every
 * converter; the UI says so.
 *
 * SUTONNYMJ / BIJOY (critical): SutonnyMJ is a Bijoy (non-Unicode
 * ANSI) font — Unicode Bangla text styled as SutonnyMJ renders as
 * garbage unless the text is converted to Bijoy encoding first. When
 * SutonnyMJ is picked, Bangla runs go through the repo's tested Bijoy
 * engine (`unicodeToBijoy` from ./bijoy — do NOT write a new
 * converter). If any Bangla character survives conversion unmapped
 * (still a Bengali code point afterwards), that run is NOT shipped as
 * garbage: it falls back to SolaimanLipi (a Unicode font) with the
 * original text, and the fallback count is reported so the UI can warn
 * the user honestly.
 *
 * STANDARD FONTS (verified 27 Nov 2026): pdf.js text extraction
 * returns ZERO items for PDFs that use the standard 14 fonts
 * (Helvetica/Times/…) unless `standardFontDataUrl` is set — the
 * loader throws "Ensure that the standardFontDataUrl API parameter is
 * provided" and the page yields no text. The 16 Foxit standard-font
 * files (800 KB, shipped with pdfjs-dist) are therefore copied to
 * public/pdfjs-standard-fonts/ and served with the site; the browser
 * default points there. Node tests pass the node_modules path
 * explicitly. Embedded-font PDFs do not need them, but most real
 * PDFs do.
 *
 * HONEST LIMITS (surfaced in the UI + guide, never hidden):
 * - Complex layouts, tables and images do not convert perfectly —
 *   text content is preserved, layout is best-effort (line and
 *   paragraph breaks as extracted; page breaks between PDF pages).
 * - A PDF with no usable text layer (scanned / image PDF) is detected
 *   (near-zero extractable characters) and refused with a clear
 *   warning instead of an empty document.
 */

import { unicodeToBijoy } from './bijoy';
import { baseNameOf, isPdfFile } from './pdfToJpg';

export const PDF_TO_WORD_MAX_MB = 10;
export const PDF_TO_WORD_MAX_PAGES = 50;
/** Fewer readable characters than this in the whole PDF = no text layer. */
export const PDF_TO_WORD_MIN_TEXT_CHARS = 20;

export const BANGLA_FONTS = [
  'Noto Sans Bengali',
  'SolaimanLipi',
  'Siyam Rupali',
  'SutonnyMJ',
  'Nikosh',
  'Kalpurush',
] as const;
export type BanglaFont = (typeof BANGLA_FONTS)[number];
export const DEFAULT_BANGLA_FONT: BanglaFont = 'Noto Sans Bengali';
/** Unicode fallback font for Bangla runs whose Bijoy conversion is incomplete. */
export const SUTONNYMJ_FALLBACK_FONT: BanglaFont = 'SolaimanLipi';

export const ENGLISH_FONTS = ['Times New Roman', 'Calibri', 'Arial', 'Georgia'] as const;
export type EnglishFont = (typeof ENGLISH_FONTS)[number];
export const DEFAULT_ENGLISH_FONT: EnglishFont = 'Times New Roman';

export interface PdfToWordFontOptions {
  banglaFont: BanglaFont;
  englishFont: EnglishFont;
}

export interface PdfToWordOptions extends PdfToWordFontOptions {
  /** Max pages to convert (default 50). */
  maxPages?: number;
  /** Called after each page is extracted: (done, total). */
  onProgress?: (done: number, total: number) => void;
  /** Override for tests: where pdf.js finds its standard-font files. */
  standardFontDataUrl?: string;
}

export interface ExtractedPage {
  pageNumber: number;
  /** Lines in reading order; '' entries are paragraph gaps. */
  lines: string[];
}

export interface ExtractedPdfText {
  pageCount: number;
  pages: ExtractedPage[];
  /** Non-whitespace characters across all pages. */
  totalChars: number;
}

export interface WordBuildResult {
  document: import('docx').Document;
  /** Bangla runs that fell back to SolaimanLipi (incomplete Bijoy conversion). */
  fallbackRuns: number;
  /** Bangla runs converted to Bijoy encoding (SutonnyMJ only). */
  convertedRuns: number;
}

export interface ConvertedWord extends WordBuildResult {
  blob: Blob;
  fileName: string;
  pageCount: number;
  totalChars: number;
}

export type TextScript = 'bn' | 'en';

export interface TextRunSegment {
  text: string;
  script: TextScript;
}

/** Bengali Unicode block, plus the Bangla danda and joiners used inside Bangla words. */
export function isBengaliChar(ch: string): boolean {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x0980 && cp <= 0x09ff) ||
    cp === 0x0964 || // । danda — used as the Bangla full stop
    cp === 0x0965 || // ॥ double danda
    cp === 0x200c || // ZWNJ — inside Bangla words
    cp === 0x200d // ZWJ — inside Bangla words
  );
}

const isWhiteSpace = (ch: string): boolean =>
  ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

/**
 * Split one extracted line into maximal same-script runs. Whitespace
 * rides with the run before it (or the run after it at the start),
 * so a space between two Bangla words stays in the Bangla font and a
 * mixed line like "আমি 2026 সালে Dhaka যাবো" yields bn/en/bn/en/bn
 * runs, each in its own font.
 */
export function splitLineIntoRuns(line: string): TextRunSegment[] {
  const runs: TextRunSegment[] = [];
  let current: TextRunSegment | null = null;
  const flush = (): void => {
    if (current && current.text.length > 0) runs.push(current);
    current = null;
  };
  for (const ch of line) {
    if (isWhiteSpace(ch)) {
      if (current) current.text += ch;
      else runs.push({ text: ch, script: 'en' });
      continue;
    }
    const script: TextScript = isBengaliChar(ch) ? 'bn' : 'en';
    if (current && current.script === script) {
      current.text += ch;
    } else {
      flush();
      current = { text: ch, script };
    }
  }
  flush();
  // Merge a leading whitespace-only run into the run after it, so a
  // line starting with spaces does not open with a stray English run.
  if (runs.length >= 2 && runs[0].script === 'en' && runs[0].text.trim() === '') {
    runs[1].text = runs[0].text + runs[1].text;
    runs.shift();
  }
  return runs;
}

/** "report.pdf" -> "report.docx" (same safe-name rules as the JPG tool). */
export function docxFileName(baseName: string): string {
  const safe = baseName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
  return `${safe}.docx`;
}

type PdfJsLib = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfDocumentProxy = Awaited<ReturnType<PdfJsLib['getDocument']>['promise']>;
type PdfPageProxy = Awaited<ReturnType<PdfDocumentProxy['getPage']>>;
type PdfTextItem = Extract<
  Awaited<ReturnType<PdfPageProxy['getTextContent']>>['items'][number],
  { str: string }
>;

function defaultStandardFontDataUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser: the 16 Foxit standard-font files copied to public/.
    const base = (import.meta.env.BASE_URL as string | undefined) ?? '/';
    return `${base.replace(/\/$/, '')}/pdfjs-standard-fonts/`;
  }
  // Node (vitest): resolve from the working directory (project root).
  return 'node_modules/pdfjs-dist/standard_fonts/';
}

async function loadPdfJs(standardFontDataUrl?: string): Promise<{
  pdfjs: PdfJsLib;
  standardFontDataUrl: string;
}> {
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as PdfJsLib;
  // Browser only: point pdf.js at its worker (bundled as an asset URL).
  // In Node tests there is no window and pdf.js uses its fake worker.
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    const { default: workerUrl } = await import(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
    );
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  return {
    pdfjs,
    standardFontDataUrl: standardFontDataUrl ?? defaultStandardFontDataUrl(),
  };
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

function readPdfError(error: unknown): Error {
  if (isPasswordError(error)) {
    return new Error('This PDF is password-protected — remove the password first');
  }
  if (isInvalidPdfError(error)) {
    return new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
  }
  return new Error('Could not read this file as a PDF — it may be corrupt or not a PDF');
}

async function openPdfDocument(
  pdf: Blob,
  standardFontDataUrl?: string,
): Promise<{ doc: PdfDocumentProxy; standardFontDataUrl: string }> {
  if (!(pdf instanceof Blob) || pdf.size === 0) {
    throw new Error('extractPdfText needs a non-empty PDF file');
  }
  const { pdfjs, standardFontDataUrl: url } = await loadPdfJs(standardFontDataUrl);
  try {
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(await pdf.arrayBuffer()),
      standardFontDataUrl: url,
    }).promise;
    return { doc, standardFontDataUrl: url };
  } catch (e) {
    throw readPdfError(e);
  }
}

interface RawLine {
  text: string;
  /** Baseline y (PDF points, bottom-up) of the line's first item. */
  y: number;
  /** Height (font size) of the line's first item. */
  height: number;
}

/**
 * Group one page's getTextContent items into lines.
 *
 * pdf.js marks line ends with hasEOL (and emits an empty-string item
 * with hasEOL for the break); that is the primary signal. As a
 * backstop, a jump in baseline y larger than the font height also
 * starts a new line. Items on the same line are ordered by x so
 * multi-column fragments do not scramble the reading order.
 */
function groupItemsIntoLines(
  items: Array<{ str: string; transform: number[]; height: number; hasEOL: boolean }>,
): RawLine[] {
  const lines: RawLine[] = [];
  let current: { parts: Array<{ str: string; x: number }>; y: number; height: number } | null =
    null;
  const flush = (): void => {
    if (!current) return;
    const ordered = [...current.parts].sort((a, b) => a.x - b.x);
    const text = ordered.map((p) => p.str).join('');
    lines.push({ text, y: current.y, height: current.height });
    current = null;
  };
  for (const item of items) {
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    if (item.str === '' && item.hasEOL) {
      flush();
      continue;
    }
    if (current && Math.abs(y - current.y) > Math.max(2, current.height)) {
      flush();
    }
    if (!current) {
      current = { parts: [], y, height: Math.max(1, item.height) };
    }
    if (item.str !== '') current.parts.push({ str: item.str, x });
    if (item.hasEOL) flush();
  }
  flush();
  return lines;
}

/**
 * Insert blank lines where the vertical gap between consecutive lines
 * is much larger than the page's usual line gap — those are paragraph
 * breaks in the source. A page with a single gap (or none) gets no
 * inserted blanks.
 */
function insertParagraphGaps(rawLines: RawLine[]): string[] {
  const lines = rawLines.map((l) => l.text);
  if (rawLines.length < 2) return lines;
  const gaps: number[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const gap = rawLines[i - 1].y - rawLines[i].y;
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return lines;
  // The smallest gap is the page's usual line spacing; a gap much
  // larger than that is a paragraph break. (A median would be wrong
  // here: with gaps [40, 200] the median is 200 and the real break
  // would be missed.)
  const typical = Math.min(...gaps);
  if (typical <= 0) return lines;
  const out: string[] = [lines[0]];
  for (let i = 1; i < rawLines.length; i++) {
    const gap = rawLines[i - 1].y - rawLines[i].y;
    if (gap > typical * 1.8) out.push('');
    out.push(lines[i]);
  }
  return out;
}

/**
 * Extract the text layer of a PDF, page by page, as lines.
 *
 * @throws on empty/non-PDF input, password-protected PDFs, or more
 *   pages than `maxPages`.
 */
export async function extractPdfText(
  pdf: Blob,
  options?: {
    maxPages?: number;
    onProgress?: (done: number, total: number) => void;
    standardFontDataUrl?: string;
  },
): Promise<ExtractedPdfText> {
  if (!isPdfFile(pdf)) {
    throw new Error('extractPdfText needs a PDF file');
  }
  const maxPages = options?.maxPages ?? PDF_TO_WORD_MAX_PAGES;
  const { doc } = await openPdfDocument(pdf, options?.standardFontDataUrl);
  if (doc.numPages > maxPages) {
    throw new Error(
      `This PDF has ${doc.numPages} pages — this tool converts up to ${maxPages} pages at a time`,
    );
  }
  const pages: ExtractedPage[] = [];
  let totalChars = 0;
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    const items = tc.items.filter(
      (it): it is PdfTextItem => typeof (it as { str?: unknown }).str === 'string',
    );
    const rawLines = groupItemsIntoLines(items);
    const lines = insertParagraphGaps(rawLines);
    // Drop leading/trailing blank lines; keep internal ones.
    while (lines.length > 0 && lines[0] === '') lines.shift();
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    totalChars += lines.join('').replace(/\s+/g, '').length;
    pages.push({ pageNumber: n, lines });
    options?.onProgress?.(n, doc.numPages);
  }
  return { pageCount: doc.numPages, pages, totalChars };
}

/** True when the extracted text still holds a Bengali code point. */
const BENGALI_CODE_POINT = /[\u0980-\u09FF]/;

interface StyledRun {
  text: string;
  font: string;
}

/**
 * Style one extracted line's runs for the document. SutonnyMJ runs go
 * through the Bijoy engine; a run whose conversion leaves Bengali
 * characters unmapped falls back to SolaimanLipi with the original
 * Unicode text (never silent garbage) and counts as a fallback.
 */
export function styleLineRuns(
  line: string,
  fonts: PdfToWordFontOptions,
): { runs: StyledRun[]; fallbackRuns: number; convertedRuns: number } {
  const runs: StyledRun[] = [];
  let fallbackRuns = 0;
  let convertedRuns = 0;
  for (const segment of splitLineIntoRuns(line)) {
    if (segment.script === 'en') {
      runs.push({ text: segment.text, font: fonts.englishFont });
      continue;
    }
    if (fonts.banglaFont === 'SutonnyMJ') {
      const converted = unicodeToBijoy(segment.text);
      if (BENGALI_CODE_POINT.test(converted)) {
        // Incomplete conversion — some character has no Bijoy glyph.
        runs.push({ text: segment.text, font: SUTONNYMJ_FALLBACK_FONT });
        fallbackRuns += 1;
      } else {
        runs.push({ text: converted, font: 'SutonnyMJ' });
        convertedRuns += 1;
      }
    } else {
      runs.push({ text: segment.text, font: fonts.banglaFont });
    }
  }
  return { runs, fallbackRuns, convertedRuns };
}

/**
 * Build the Word document from already-extracted text. Dynamic-imports
 * `docx` internally (see the bundle rule in questionPaperDocx.ts).
 * One paragraph per extracted line; an empty line is an empty
 * paragraph; a page break separates PDF pages.
 */
export async function buildWordDocument(
  extracted: ExtractedPdfText,
  fonts: PdfToWordFontOptions,
): Promise<WordBuildResult> {
  const { Document, Paragraph, TextRun, PageBreak } = await import('docx');
  const children: import('docx').Paragraph[] = [];
  let fallbackRuns = 0;
  let convertedRuns = 0;
  extracted.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    for (const line of page.lines) {
      if (line === '') {
        children.push(new Paragraph({ text: '' }));
        continue;
      }
      const styled = styleLineRuns(line, fonts);
      fallbackRuns += styled.fallbackRuns;
      convertedRuns += styled.convertedRuns;
      children.push(
        new Paragraph({
          children: styled.runs.map((r) => new TextRun({ text: r.text, font: r.font })),
        }),
      );
    }
  });
  const document = new Document({ sections: [{ children }] });
  return { document, fallbackRuns, convertedRuns };
}

/** Pack a built document into a .docx Blob (browser download / tests). */
export async function packWordDocument(
  document: import('docx').Document,
): Promise<Blob> {
  const { Packer } = await import('docx');
  return Packer.toBlob(document);
}

/**
 * Trigger a browser download of an already-created blob URL.
 * Click-handler only (needs `document`): creates a temporary anchor,
 * clicks it, and removes it. The caller owns the object URL.
 */
export function triggerBlobDownload(url: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Full pipeline: extract the PDF's text, refuse scanned/image PDFs
 * (near-zero extractable text) instead of delivering an empty
 * document, then build and pack the .docx.
 */
export async function convertPdfToWord(
  pdf: Blob,
  options: PdfToWordOptions,
): Promise<ConvertedWord> {
  const extracted = await extractPdfText(pdf, {
    maxPages: options.maxPages,
    onProgress: options.onProgress,
    standardFontDataUrl: options.standardFontDataUrl,
  });
  if (extracted.totalChars < PDF_TO_WORD_MIN_TEXT_CHARS) {
    throw new Error(
      'This PDF has no readable text — it looks like a scanned or image PDF. Text cannot be extracted from pictures of pages.',
    );
  }
  const built = await buildWordDocument(extracted, {
    banglaFont: options.banglaFont,
    englishFont: options.englishFont,
  });
  const blob = await packWordDocument(built.document);
  return {
    ...built,
    blob,
    fileName: docxFileName(baseNameOf((pdf as File).name ?? 'document')),
    pageCount: extracted.pageCount,
    totalChars: extracted.totalChars,
  };
}
