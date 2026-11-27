// PDF Compressor (Tool #3) — unit tests.
// Best-effort by design: the test asserts the result is a valid PDF that
// is smaller than OR equal to the input (equal is fine when nothing can
// be saved), never a promised ratio.
import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { compressPdf } from '../../tools/pdfCompressor';

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
});
