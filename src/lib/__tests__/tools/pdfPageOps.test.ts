// PDF page operations — shared engine unit tests (Batch 3).
import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  extractPdfPages,
  getPdfPageCount,
  latinSafeText,
  parsePageSelection,
  removePdfPages,
  reorderPdfPages,
  stampPdfWatermark,
} from '../../tools/pdfPageOps';

/** Build a PDF with `widths[i]`-wide pages, labelled "Page i". */
async function makePdf(widths: number[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  widths.forEach((w, i) => {
    const page = doc.addPage([w, 600]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 500, size: 24, font, color: rgb(0, 0, 0) });
  });
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

async function pageWidths(blob: Blob): Promise<number[]> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPages().map((p) => p.getWidth());
}

describe('getPdfPageCount', () => {
  it('counts pages of a 3-page PDF', async () => {
    expect(await getPdfPageCount(await makePdf([400, 500, 600]))).toBe(3);
  });

  it('throws on a non-PDF blob', async () => {
    await expect(getPdfPageCount(new Blob(['hello'], { type: 'text/plain' }))).rejects.toThrow(/Could not read/);
  });
});

describe('extractPdfPages', () => {
  it('keeps pages 1 and 3, in order, with their widths', async () => {
    const out = await extractPdfPages(await makePdf([400, 500, 600]), [1, 3]);
    expect(out.type).toBe('application/pdf');
    expect(await pageWidths(out)).toEqual([400, 600]);
  });

  it('reorders when given [3, 1]', async () => {
    const out = await extractPdfPages(await makePdf([400, 500, 600]), [3, 1]);
    expect(await pageWidths(out)).toEqual([600, 400]);
  });

  it('rejects out-of-range pages', async () => {
    await expect(extractPdfPages(await makePdf([400, 500]), [3])).rejects.toThrow(/out of range/);
  });
});

describe('removePdfPages', () => {
  it('removes page 2 of 3', async () => {
    const out = await removePdfPages(await makePdf([400, 500, 600]), [2]);
    expect(await pageWidths(out)).toEqual([400, 600]);
  });

  it('refuses to remove every page', async () => {
    await expect(removePdfPages(await makePdf([400, 500]), [1, 2])).rejects.toThrow(/empty PDF/);
  });
});

describe('reorderPdfPages', () => {
  it('reverses [3, 2, 1]', async () => {
    const out = await reorderPdfPages(await makePdf([400, 500, 600]), [3, 2, 1]);
    expect(await pageWidths(out)).toEqual([600, 500, 400]);
  });

  it('rotates page 2 by 90 degrees (width/height swap)', async () => {
    const out = await reorderPdfPages(await makePdf([400, 500, 600]), [1, 2, 3], { 2: 90 });
    const doc = await PDFDocument.load(await out.arrayBuffer());
    expect(doc.getPage(1).getRotation().angle).toBe(90);
  });

  it('rejects an order that misses a page', async () => {
    await expect(reorderPdfPages(await makePdf([400, 500]), [1, 1])).rejects.toThrow(/exactly once/);
  });

  it('rejects a bad rotation', async () => {
    await expect(reorderPdfPages(await makePdf([400, 500]), [1, 2], { 1: 45 })).rejects.toThrow(/90, 180 or 270/);
  });
});

describe('stampPdfWatermark', () => {
  it('stamps every page and keeps the page count', async () => {
    const out = await stampPdfWatermark(await makePdf([400, 500]), { text: 'Eduvelto' });
    expect(out.type).toBe('application/pdf');
    expect(await getPdfPageCount(out)).toBe(2);
  });

  it('rejects empty text and bad opacity', async () => {
    await expect(stampPdfWatermark(await makePdf([400]), { text: '  ' })).rejects.toThrow(/must not be empty/);
    await expect(stampPdfWatermark(await makePdf([400]), { text: 'x', opacity: 2 })).rejects.toThrow(/between 0 and 1/);
  });
});

describe('latinSafeText', () => {
  it('keeps Latin text and replaces Bangla with ?', () => {
    expect(latinSafeText('Eduvelto 2026')).toBe('Eduvelto 2026');
    expect(latinSafeText('আমার')).toBe('????');
  });
});

describe('parsePageSelection (re-exported)', () => {
  it('parses "1,3-5"', () => {
    expect(parsePageSelection('1,3-5', 5)).toEqual([1, 3, 4, 5]);
  });
});
