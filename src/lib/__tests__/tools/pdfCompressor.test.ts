// PDF Compressor (Tool #3) — unit tests.
// Best-effort by design: the test asserts the result is a valid PDF that
// is smaller than OR equal to the input (equal is fine when nothing can
// be saved), never a promised ratio.
import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  PDF_COMPRESSION_LEVELS,
  PDF_COMPRESS_PRESETS,
  DEFAULT_COMPRESS_SETTINGS,
  clampDpi,
  clampQuality,
  compressPdf,
  fitWithin,
  maxImageEdgePx,
  presetSettings,
  resolveCompressSettings,
  targetQualitySteps,
} from '../../tools/pdfCompressor';

/** Build a PDF fixture with text on several pages. */
async function makePdf(pages: number): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Compressor fixture page ${i} — some repeated text to compress. `.repeat(10), {
      x: 40,
      y: 500,
      size: 11,
      font,
      color: rgb(0, 0, 0),
    });
  }
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

describe('compressPdf', () => {
  it('returns a valid PDF no larger than the input, with honest byte counts', async () => {
    const pdf = await makePdf(5);
    const result = await compressPdf(pdf);
    expect(result.originalBytes).toBe(pdf.size);
    expect(result.newBytes).toBeLessThanOrEqual(result.originalBytes);
    expect(result.newBytes).toBe(result.blob.size);
    expect(result.blob.type).toBe('application/pdf');
    expect(result.savedPercent).toBeGreaterThanOrEqual(0);
    expect(result.savedPercent).toBeLessThan(100);
    // The output is still a readable PDF with the same page count.
    const outDoc = await PDFDocument.load(await result.blob.arrayBuffer());
    expect(outDoc.getPageCount()).toBe(5);
  });

  it('reports savedPercent consistently with the byte counts', async () => {
    const pdf = await makePdf(3);
    const result = await compressPdf(pdf);
    const expected =
      result.newBytes >= result.originalBytes
        ? 0
        : Math.round(((result.originalBytes - result.newBytes) / result.originalBytes) * 1000) / 10;
    expect(result.savedPercent).toBe(expected);
  });

  it('rejects an empty file and a non-PDF file', async () => {
    await expect(compressPdf(new Blob([], { type: 'application/pdf' }))).rejects.toThrow(
      /non-empty PDF/,
    );
    await expect(
      compressPdf(new Blob(['not a pdf at all'], { type: 'application/pdf' })),
    ).rejects.toThrow(/Could not read this file as a PDF/);
  });

  it('default is Balanced, one attempt, no target, no images touched (node has no canvas)', async () => {
    const pdf = await makePdf(3);
    const result = await compressPdf(pdf);
    expect(result.level).toBe('balanced');
    expect(result.attempts).toBe(1);
    expect(result.targetMet).toBeNull();
    expect(result.targetBytes).toBeNull();
    expect(result.imagesProcessed).toBe(0);
    expect(result.imagesSkipped).toBe(0);
  });

  it('reports the chosen level and never delivers a bigger file', async () => {
    const pdf = await makePdf(3);
    const result = await compressPdf(pdf, { level: 'strong' });
    expect(result.level).toBe('strong');
    expect(result.newBytes).toBeLessThanOrEqual(result.originalBytes);
    expect(result.blob.size).toBe(result.newBytes);
  });

  it('target-size mode: an unreachable target is reported honestly, never faked', async () => {
    // The text-only fixture is a few KB; 100 bytes is unreachable.
    const pdf = await makePdf(3);
    const result = await compressPdf(pdf, { targetBytes: 100 });
    expect(result.targetBytes).toBe(100);
    expect(result.targetMet).toBe(false);
    expect(result.attempts).toBeGreaterThan(1);
    expect(result.newBytes).toBeLessThanOrEqual(result.originalBytes);
  });

  it('target-size mode: a generous target is met on the first attempt', async () => {
    const pdf = await makePdf(3);
    const result = await compressPdf(pdf, { targetBytes: 10 * 1024 * 1024 });
    expect(result.targetMet).toBe(true);
    expect(result.attempts).toBe(1);
  });

  it('an invalid target (0 / negative) is treated as no target', async () => {
    const pdf = await makePdf(3);
    const zero = await compressPdf(pdf, { targetBytes: 0 });
    expect(zero.targetMet).toBeNull();
    expect(zero.targetBytes).toBeNull();
    const negative = await compressPdf(pdf, { targetBytes: -500 });
    expect(negative.targetMet).toBeNull();
  });
});

describe('compression levels and presets (pure)', () => {
  it('levels are light 0.85/300, balanced 0.7/150, strong 0.5/72', () => {
    expect(PDF_COMPRESSION_LEVELS.light).toEqual(
      expect.objectContaining({ imageQuality: 0.85, maxDpi: 300 }),
    );
    expect(PDF_COMPRESSION_LEVELS.balanced).toEqual(
      expect.objectContaining({ imageQuality: 0.7, maxDpi: 150 }),
    );
    expect(PDF_COMPRESSION_LEVELS.strong).toEqual(
      expect.objectContaining({ imageQuality: 0.5, maxDpi: 72 }),
    );
    expect(DEFAULT_COMPRESS_SETTINGS.level).toBe('balanced');
  });

  it('presets map to levels: email=strong, web=balanced, print=light', () => {
    expect(PDF_COMPRESS_PRESETS.email.level).toBe('strong');
    expect(PDF_COMPRESS_PRESETS.web.level).toBe('balanced');
    expect(PDF_COMPRESS_PRESETS.print.level).toBe('light');
    expect(presetSettings('email')).toEqual(
      expect.objectContaining({ level: 'strong', imageQuality: 0.5, maxDpi: 72 }),
    );
    expect(presetSettings('web')).toEqual(
      expect.objectContaining({ level: 'balanced', imageQuality: 0.7, maxDpi: 150 }),
    );
    expect(presetSettings('print')).toEqual(
      expect.objectContaining({ level: 'light', imageQuality: 0.85, maxDpi: 300 }),
    );
  });

  it('resolveCompressSettings: level defaults, overrides win, garbage is clamped', () => {
    expect(resolveCompressSettings('light')).toEqual({
      level: 'light',
      imageQuality: 0.85,
      maxDpi: 300,
    });
    expect(resolveCompressSettings('strong', { imageQuality: 0.9 })).toEqual({
      level: 'strong',
      imageQuality: 0.9,
      maxDpi: 72,
    });
    // Out-of-range values are clamped, not rejected.
    expect(resolveCompressSettings('balanced', { imageQuality: 2, maxDpi: 5000 })).toEqual({
      level: 'balanced',
      imageQuality: 1,
      maxDpi: 600,
    });
  });

  it('clampQuality clamps to 0.1–1, clampDpi to 36–600', () => {
    expect(clampQuality(0)).toBe(0.1);
    expect(clampQuality(2)).toBe(1);
    expect(clampQuality(0.7)).toBe(0.7);
    expect(clampDpi(10)).toBe(36);
    expect(clampDpi(1000)).toBe(600);
    expect(clampDpi(150)).toBe(150);
  });

  it('targetQualitySteps starts at the requested quality, then steps down, max 4', () => {
    expect(targetQualitySteps(0.7)).toEqual([0.7, 0.6, 0.45, 0.3]);
    expect(targetQualitySteps(0.85)).toEqual([0.85, 0.6, 0.45, 0.3]);
    expect(targetQualitySteps(0.5)).toEqual([0.5, 0.45, 0.3, 0.2]);
    expect(targetQualitySteps(0.1)).toEqual([0.1]);
  });

  it('maxImageEdgePx and fitWithin size images by the longest page edge', () => {
    // A4 portrait (595x842 pt) at 150 DPI: long edge 842/72*150 = 1754 px.
    expect(maxImageEdgePx(595, 842, 150)).toBe(1754);
    expect(maxImageEdgePx(842, 595, 150)).toBe(1754);
    expect(fitWithin(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 });
    // Already small enough: unchanged.
    expect(fitWithin(800, 600, 1000)).toEqual({ width: 800, height: 600 });
  });
});
