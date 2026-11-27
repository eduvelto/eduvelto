// PDF to JPG — unit tests (real pdf.js legacy build + real pdf-lib fixtures).
//
// getPdfInfo runs the REAL pdf.js parser on a REAL PDF built with
// pdf-lib (page count, page sizes, invalid-PDF rejection). The render
// path runs through real pdf.js too, with an injected fake canvas —
// the fake canvas only stands in for the browser's 2D context (Node
// has none); the real JPEG bytes are verified in a live browser
// (Playwright), where a real canvas exists.
import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  baseNameOf, computeRenderSize, getPdfInfo, isPdfFile, jpegFileName,
  renderPdfToJpegs, validateRenderOptions, type PdfCanvas, type PdfDomDeps,
} from '../../tools/pdfToJpg';

/** Build a small PDF fixture with `count` numbered pages (400x600pt). */
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

/**
 * Fake canvas for Node: pdf.js's CanvasGraphics calls 2D-context
 * methods on it; every method is a no-op except the ones whose return
 * value pdf.js reads (measureText width, gradients, canvas itself).
 * toBlob returns a minimal JPEG header so the pipeline completes.
 */
function fakeDeps(): PdfDomDeps {
  return {
    createCanvas: (width: number, height: number) => {
      const gradient = { addColorStop: () => {} };
      const ctx = new Proxy(
        {},
        {
          get: (_target, prop: string | symbol) => {
            if (prop === 'canvas') return canvas;
            if (prop === 'measureText') return () => ({ width: 0 });
            if (prop === 'getTransform') {
              return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
            }
            if (
              prop === 'createLinearGradient' ||
              prop === 'createRadialGradient' ||
              prop === 'createPattern'
            ) {
              return () => gradient;
            }
            if (prop === 'getImageData') {
              return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
            }
            if (prop === 'getLineDash') return () => [];
            return () => {};
          },
          set: () => true,
        },
      );
      const canvas = {
        width,
        height,
        getContext: () => ctx,
        toBlob: (cb: (b: Blob | null) => void, type?: string) => {
          cb(
            new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], {
              type: type ?? 'image/jpeg',
            }),
          );
        },
      };
      return canvas as unknown as PdfCanvas;
    },
  };
}

describe('isPdfFile / baseNameOf / jpegFileName', () => {
  it('accepts .pdf by type or extension', () => {
    expect(isPdfFile(new Blob([], { type: 'application/pdf' }), 'x.pdf')).toBe(true);
    expect(isPdfFile(new Blob([]), 'report.PDF')).toBe(true);
    expect(isPdfFile(new Blob([]), 'photo.jpg')).toBe(false);
    expect(isPdfFile(new Blob([], { type: 'image/jpeg' }), 'photo.jpg')).toBe(false);
  });

  it('strips directories and the .pdf suffix', () => {
    expect(baseNameOf('a/b/report.PDF')).toBe('report');
    expect(baseNameOf('plain.pdf')).toBe('plain');
    expect(baseNameOf('noext')).toBe('noext');
  });

  it('names single-page and multi-page JPGs', () => {
    expect(jpegFileName('report', 1, 1)).toBe('report.jpg');
    expect(jpegFileName('report', 2, 3)).toBe('report-p2.jpg');
    expect(jpegFileName('a/b:c', 1, 2)).toBe('a_b_c-p1.jpg');
  });
});

describe('validateRenderOptions / computeRenderSize', () => {
  it('accepts scale 0.5–3 and quality 0.1–1', () => {
    expect(() => validateRenderOptions(1.5, 0.9)).not.toThrow();
    expect(() => validateRenderOptions(0.4, 0.9)).toThrow(/Scale/);
    expect(() => validateRenderOptions(3.1, 0.9)).toThrow(/Scale/);
    expect(() => validateRenderOptions(1, 0.05)).toThrow(/quality/);
    expect(() => validateRenderOptions(1, 1.5)).toThrow(/quality/);
  });

  it('scales PDF points to pixels', () => {
    expect(computeRenderSize({ width: 400, height: 600 }, 2)).toEqual({ width: 800, height: 1200 });
    expect(computeRenderSize({ width: 400, height: 600 }, 1.5)).toEqual({ width: 600, height: 900 });
  });
});

describe('getPdfInfo (real pdf.js)', () => {
  it('reads page count and sizes from a real 3-page PDF', async () => {
    const pdf = await makePdf(3);
    const info = await getPdfInfo(pdf);
    expect(info.pageCount).toBe(3);
    expect(info.pages).toHaveLength(3);
    expect(info.pages[0]).toEqual({ width: 400, height: 600 });
  });

  it('rejects an empty blob and a non-PDF', async () => {
    await expect(getPdfInfo(new Blob([]))).rejects.toThrow(/non-empty/);
    await expect(getPdfInfo(new Blob([new Uint8Array([1, 2, 3])]))).rejects.toThrow(
      /Could not read/,
    );
  });
});

describe('renderPdfToJpegs (real pdf.js + fake canvas)', () => {
  it('renders 2 pages at 2x through the real parser', async () => {
    const pdf = await makePdf(2);
    const seen: Array<[number, number]> = [];
    const out = await renderPdfToJpegs(
      pdf,
      {
        scale: 2,
        quality: 0.9,
        onProgress: (done, total) => seen.push([done, total]),
      },
      fakeDeps(),
    );
    expect(out).toHaveLength(2);
    expect(out[0].pageNumber).toBe(1);
    expect(out[0].width).toBe(800);
    expect(out[0].height).toBe(1200);
    expect(out[0].blob.type).toBe('image/jpeg');
    expect(seen).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('rejects more pages than maxPages and bad options', async () => {
    const pdf = await makePdf(3);
    await expect(
      renderPdfToJpegs(pdf, { scale: 1, quality: 0.9, maxPages: 2 }, fakeDeps()),
    ).rejects.toThrow(/up to 2 pages/);
    await expect(
      renderPdfToJpegs(pdf, { scale: 9, quality: 0.9 }, fakeDeps()),
    ).rejects.toThrow(/Scale/);
  });
});
