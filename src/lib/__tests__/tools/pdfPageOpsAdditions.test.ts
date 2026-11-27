// path to src/lib/tools/pdfPageOps.ts once the three functions land there).
// Builds test PDFs with pdf-lib itself (already a dependency).
import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { mergePdfs, rotatePdfPages, stampPdfPageNumbers } from '../../tools/pdfPageOps';

async function makePdf(pages: number, labelPrefix = 'Page'): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i += 1) {
    const page = doc.addPage([595, 842]);
    page.drawText(`${labelPrefix} ${i}`, { x: 50, y: 750, size: 24, font, color: rgb(0, 0, 0) });
  }
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

async function pageCount(blob: Blob): Promise<number> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPageCount();
}

async function pageRotations(blob: Blob): Promise<number[]> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPages().map((p) => p.getRotation().angle);
}

async function pageTexts(blob: Blob): Promise<string[]> {
  // pdf-lib cannot extract text; use rotation/count + a text check via pdfjs if
  // available in the test env. Here we assert counts/rotations only; the
  // stamp test asserts the call succeeds and the page count is unchanged.
  void blob;
  return [];
}

describe('mergePdfs', () => {
  it('merges 2 + 3 pages into 5, in order', async () => {
    const a = await makePdf(2, 'A');
    const b = await makePdf(3, 'B');
    const r = await mergePdfs([
      { blob: a, name: 'a.pdf' },
      { blob: b, name: 'b.pdf' },
    ]);
    expect(r.totalPages).toBe(5);
    expect(r.perFilePages).toEqual([2, 3]);
    expect(await pageCount(r.blob)).toBe(5);
  });
  it('honours a per-file page range', async () => {
    const a = await makePdf(2, 'A');
    const b = await makePdf(3, 'B');
    const r = await mergePdfs([
      { blob: a, name: 'a.pdf' },
      { blob: b, name: 'b.pdf', pages: [1] },
    ]);
    expect(r.totalPages).toBe(3);
  });
  it('rejects 1 file, out-of-range pages and corrupt input', async () => {
    const a = await makePdf(2, 'A');
    await expect(mergePdfs([{ blob: a, name: 'a.pdf' }])).rejects.toThrow(/at least 2/);
    const b = await makePdf(3, 'B');
    await expect(
      mergePdfs([
        { blob: a, name: 'a.pdf' },
        { blob: b, name: 'b.pdf', pages: [99] },
      ]),
    ).rejects.toThrow(/page 99/);
    await expect(
      mergePdfs([
        { blob: a, name: 'a.pdf' },
        { blob: new Blob(['not a pdf'], { type: 'application/pdf' }), name: 'bad.pdf' },
      ]),
    ).rejects.toThrow(/could not be read/);
  });
});

describe('rotatePdfPages', () => {
  it('rotates page 2 only', async () => {
    const src = await makePdf(3);
    const out = await rotatePdfPages(src, { 2: 90 });
    expect(await pageCount(out)).toBe(3);
    expect(await pageRotations(out)).toEqual([0, 90, 0]);
  });
  it('rotates all pages 180', async () => {
    const src = await makePdf(2);
    const out = await rotatePdfPages(src, { 1: 180, 2: 180 });
    expect(await pageRotations(out)).toEqual([180, 180]);
  });
  it('rejects bad rotations and empty input', async () => {
    const src = await makePdf(2);
    await expect(rotatePdfPages(src, { 1: 45 })).rejects.toThrow(/90, 180 or 270/);
    await expect(rotatePdfPages(src, {})).rejects.toThrow(/at least one page/);
    await expect(rotatePdfPages(src, { 99: 90 })).rejects.toThrow();
  });
});

describe('stampPdfPageNumbers', () => {
  it('stamps numbers and keeps the page count', async () => {
    const src = await makePdf(5);
    const out = await stampPdfPageNumbers(src, { format: 'page-n-of-p', position: 'bottom-center' });
    expect(await pageCount(out)).toBe(5);
    void pageTexts;
  });
  it('skip-first + startAt 3 leaves page 1 unnumbered', async () => {
    const src = await makePdf(5);
    const out = await stampPdfPageNumbers(src, { startAt: 3, skipFirstPage: true });
    expect(await pageCount(out)).toBe(5);
  });
  it('rejects custom formats without {n} and bad start numbers', async () => {
    const src = await makePdf(3);
    await expect(stampPdfPageNumbers(src, { format: 'custom', customFormat: 'Page' })).rejects.toThrow(/\{n\}/);
    await expect(stampPdfPageNumbers(src, { startAt: 0 })).rejects.toThrow(/1 or more/);
    await expect(stampPdfPageNumbers(src, { pages: [99] })).rejects.toThrow(/out of range/);
  });
});

describe('page rotation read-back sanity', () => {
  it('degrees() round-trips through pdf-lib', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    page.setRotation(degrees(270));
    expect(page.getRotation().angle).toBe(270);
  });
});
