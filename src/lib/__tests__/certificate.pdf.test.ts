
// PDF size (28 Nov 2026 shrink): the certificate PDF embeds the
// 2480×1754 canvas as JPEG, not PNG — ~13 MB → ~0.27 MB — while
// the PNG download path stays byte-identical and the QR still
// decodes to the verify URL. The real render needs a canvas
// implementation; @napi-rs/canvas is NOT a declared dependency
// (installed locally with `npm install --no-save`), so these
// tests skip where it is absent instead of failing the suite.
// The source-level pins below run everywhere.
import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  CERTIFICATE_PDF_JPEG_QUALITY,
  buildCertificatePdfBytes,
  buildQuizCertificateData,
  drawQuizCertificateCanvas,
} from '../certificate';
import { decodeCertificatePayload } from '../freeQuiz';
import { readFileSync } from 'node:fs';

// Non-literal specifier on purpose: tsc must not resolve it
// (the package is not declared), so the import stays a runtime
// attempt that rejects where the package is absent.
const NAPI_CANVAS_SPECIFIER = '@napi-rs/canvas';
let napiCanvas: typeof import('@napi-rs/canvas') | null = null;
try {
  napiCanvas = (await import(NAPI_CANVAS_SPECIFIER)) as typeof import('@napi-rs/canvas');
} catch {
  napiCanvas = null;
}

describe('certificate PDF (JPEG embed)', () => {
  it('embeds the canvas as JPEG at the pinned quality, never PNG', () => {
    expect(CERTIFICATE_PDF_JPEG_QUALITY).toBe(0.92);
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const pdfFn = src.slice(src.indexOf('function createCertificatePdfDoc'));
    expect(pdfFn).toContain("toDataURL('image/jpeg', CERTIFICATE_PDF_JPEG_QUALITY)");
    expect(pdfFn).toContain("'JPEG'");
    expect(pdfFn).not.toContain("toDataURL('image/png')");
    expect(pdfFn).not.toContain("'PNG'");
    // The PNG download path is untouched.
    const pngFn = src.slice(
      src.indexOf('export function downloadCanvasPng'),
      src.indexOf('/** Print-ready PDF'),
    );
    expect(pngFn).toContain("canvas.toDataURL('image/png')");
  });

  it('the download still saves via jsPDF and never draws jsPDF text', () => {
    const src = readFileSync(new URL('../certificate.ts', import.meta.url), 'utf8');
    const downloadFn = src.slice(src.indexOf('export async function downloadCertificatePdf'));
    expect(downloadFn).toContain('doc.save(filename)');
    expect(downloadFn).not.toContain('.text(');
  });
});

describe.skipIf(!napiCanvas)(
  'certificate PDF size (real render, needs @napi-rs/canvas)',
  () => {
    it('renders a Bangla-name quiz certificate to a PDF well under 2 MB', async () => {
      const canvasImpl = napiCanvas!;
      const g = globalThis as any;
      if (!g.document) {
        g.document = {
          createElement: (tag: string) =>
            tag === 'canvas' ? canvasImpl.createCanvas(1, 1) : {},
          fonts: { load: async () => [], ready: Promise.resolve() },
        };
      }
      if (!g.window) g.window = g;
      if (!g.Image) g.Image = canvasImpl.Image;

      const data = buildQuizCertificateData(
        'রহিম উদ্দিন',
        'Free Quiz — English',
        8,
        10,
        '2026-11-28',
      );
      const qrDataUrl: string = await QRCode.toDataURL(data.verifyUrl, {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      const canvas = (await drawQuizCertificateCanvas(data, qrDataUrl)) as any;
      expect(canvas.width).toBe(2480);
      expect(canvas.height).toBe(1754);

      // The QR decodes from the rendered canvas to the verify URL.
      const ctx = canvas.getContext('2d');
      const qrRegion = ctx.getImageData(2070, 1234, 210, 210);
      expect(jsQR(qrRegion.data, 210, 210)?.data).toBe(data.verifyUrl);

      // The verify payload round-trips (name / quiz / score / date / ID).
      const parsed = new URL(data.verifyUrl);
      expect(
        decodeCertificatePayload(
          parsed.searchParams.get('d'),
          parsed.pathname.split('/').pop() ?? '',
        ),
      ).toEqual({
        v: 1,
        id: data.verificationId,
        n: 'রহিম উদ্দিন',
        q: 'Free Quiz — English',
        s: 8,
        d: '2026-11-28',
      });

      const pdf = await buildCertificatePdfBytes(canvas);
      expect(pdf.slice(0, 5)).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])); // %PDF-
      const pdfText = Buffer.from(pdf).toString('latin1');
      expect(pdfText).toContain('/DCTDecode'); // JPEG image inside
      expect(pdfText).toContain('/Subtype /Image');
      // 28 Nov 2026 measured locally: 268,678 bytes (was 13,053,092
      // as PNG). The 2 MB bound leaves ample headroom for other
      // designs while pinning the shrink.
      expect(pdf.byteLength).toBeLessThan(2_000_000);
    });
  },
);
