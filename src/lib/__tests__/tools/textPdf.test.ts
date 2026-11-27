// Text to PDF + Images to PDF — jsPDF engine unit tests (Batch 3).
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  buildImagesPdf,
  buildTextPdf,
  fitImageToPage,
  sanitizeForPdf,
  splitTextToLines,
} from '../../tools/textPdf';

describe('sanitizeForPdf', () => {
  it('keeps Latin text untouched', () => {
    expect(sanitizeForPdf('Hello 2026!')).toEqual({ clean: 'Hello 2026!', replaced: 0, hadBangla: false });
  });

  it('replaces Bangla letters with ? and flags them', () => {
    const out = sanitizeForPdf('আমি Eduvelto');
    expect(out.replaced).toBe(3);
    expect(out.hadBangla).toBe(true);
    expect(out.clean).toBe('??? Eduvelto');
  });
});

describe('splitTextToLines', () => {
  it('wraps on word boundaries', () => {
    expect(splitTextToLines('one two three four', 10)).toEqual(['one two', 'three four']);
  });

  it('splits an over-long word and keeps blank lines', () => {
    expect(splitTextToLines('abcdefghijklmno', 10)).toEqual(['abcdefghij', 'klmno']);
    expect(splitTextToLines('a\n\nb', 10)).toEqual(['a', '', 'b']);
  });

  it('rejects a tiny maxChars', () => {
    expect(() => splitTextToLines('x', 5)).toThrow(/at least 10/);
  });
});

describe('fitImageToPage', () => {
  it('fits a wide image inside A4 margins, centred', () => {
    const out = fitImageToPage(1200, 600, 595, 842, 36);
    expect(out.w).toBeCloseTo(523);
    expect(out.h).toBeCloseTo(261.5);
    expect(out.x).toBeCloseTo(36);
  });

  it('never upscales a small image', () => {
    const out = fitImageToPage(100, 100, 595, 842, 36);
    expect(out.w).toBe(100);
    expect(out.h).toBe(100);
  });

  it('rejects a margin larger than the page', () => {
    expect(() => fitImageToPage(100, 100, 100, 100, 60)).toThrow(/too large/);
  });
});

describe('buildTextPdf', () => {
  it('builds a readable 1-page PDF from English text', async () => {
    const blob = await buildTextPdf('Hello Eduvelto\nSecond line', { title: 'Notes' });
    expect(blob.type).toBe('application/pdf');
    const doc = await PDFDocument.load(await blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });

  it('rejects empty text and a bad font size', async () => {
    await expect(buildTextPdf('   ')).rejects.toThrow(/must not be empty/);
    await expect(buildTextPdf('x', { fontSize: 100 })).rejects.toThrow(/between 8 and 24/);
  });
});

describe('buildImagesPdf', () => {
  const tinyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('builds one page per image', async () => {
    const blob = await buildImagesPdf([
      { dataUrl: tinyPng, width: 1, height: 1 },
      { dataUrl: tinyPng, width: 1, height: 1 },
    ]);
    expect(blob.type).toBe('application/pdf');
    const doc = await PDFDocument.load(await blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(2);
  });

  it('rejects an empty image list', async () => {
    await expect(buildImagesPdf([])).rejects.toThrow(/At least one image/);
  });
});
