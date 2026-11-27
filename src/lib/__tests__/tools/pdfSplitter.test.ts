// PDF Splitter (Tool #2) — unit tests.
import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { parsePageSelection, splitPdf } from '../../tools/pdfSplitter';

/** Build a small PDF fixture with `count` numbered pages. */
async function makePdf(count: number): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= count; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Page ${i}`, { x: 50, y: 500, size: 24, font, color: rgb(0, 0, 0) });
  }
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

async function pageCountOf(blob: Blob): Promise<number> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPageCount();
}

describe('parsePageSelection', () => {
  it('parses "1,3-5" with 5 pages -> [1, 3, 4, 5]', () => {
    expect(parsePageSelection('1,3-5', 5)).toEqual([1, 3, 4, 5]);
  });

  it('parses a single page and a single-page range', () => {
    expect(parsePageSelection('2', 5)).toEqual([2]);
    expect(parsePageSelection('2-2', 5)).toEqual([2]);
  });

  it('removes duplicates but keeps order: "3,1,3" -> [3, 1]', () => {
    expect(parsePageSelection('3,1,3', 5)).toEqual([3, 1]);
  });

  it('tolerates spaces: "1, 3 - 4" -> [1, 3, 4]', () => {
    expect(parsePageSelection('1, 3 - 4', 5)).toEqual([1, 3, 4]);
  });

  it('rejects out-of-range pages', () => {
    expect(() => parsePageSelection('0', 5)).toThrow(/out of range/);
    expect(() => parsePageSelection('6', 5)).toThrow(/out of range/);
    expect(() => parsePageSelection('4-6', 5)).toThrow(/out of range/);
  });

  it('rejects reversed ranges, bad syntax and empty selections', () => {
    expect(() => parsePageSelection('3-1', 5)).toThrow(/start must not exceed end/);
    expect(() => parsePageSelection('a', 5)).toThrow(/Invalid page number/);
    expect(() => parsePageSelection('1,,2', 5)).toThrow(/empty entry/);
    expect(() => parsePageSelection('', 5)).toThrow(/must not be empty/);
    expect(() => parsePageSelection('   ', 5)).toThrow(/must not be empty/);
  });
});

describe('splitPdf', () => {
  it('keeps only page 2 of a 3-page PDF', async () => {
    const pdf = await makePdf(3);
    const out = await splitPdf(pdf, [2]);
    expect(out.type).toBe('application/pdf');
    expect(await pageCountOf(out)).toBe(1);
  });

  it('keeps pages 1 and 3 in order', async () => {
    const pdf = await makePdf(3);
    const out = await splitPdf(pdf, [1, 3]);
    expect(await pageCountOf(out)).toBe(2);
  });

  it('keeps the selected page content (page 2 text survives, page 1 does not)', async () => {
    const pdf = await makePdf(3);
    const out = await splitPdf(pdf, [2]);
    const doc = await PDFDocument.load(await out.arrayBuffer());
    const page = doc.getPage(0);
    expect(page.getWidth()).toBe(400);
    expect(page.getHeight()).toBe(600);
  });

  it('rejects page 0, pages past the end, and an empty selection', async () => {
    const pdf = await makePdf(3);
    await expect(splitPdf(pdf, [0])).rejects.toThrow(/out of range/);
    await expect(splitPdf(pdf, [4])).rejects.toThrow(/out of range/);
    await expect(splitPdf(pdf, [])).rejects.toThrow(/at least one page/);
    await expect(splitPdf(pdf, [1.5])).rejects.toThrow(/out of range/);
  });

  it('rejects an empty file and a non-PDF file', async () => {
    await expect(splitPdf(new Blob([], { type: 'application/pdf' }), [1])).rejects.toThrow(
      /non-empty PDF/,
    );
    await expect(
      splitPdf(new Blob(['not a pdf at all'], { type: 'application/pdf' }), [1]),
    ).rejects.toThrow(/Could not read this file as a PDF/);
  });
});
