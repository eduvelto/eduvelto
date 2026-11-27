// PDF Password Protector — unit tests (real QPDF WASM + real PDF fixtures).
//
// The protection is verified with QPDF itself: --check exits 2 with
// no password and with a wrong password, and 0 with the right user
// and owner passwords; --show-encryption reports AESv3. If a
// regression ever shipped an unprotected file, these tests fail.
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  checkProtectedPdf, isPdfFile, protectPdf, validateProtectOptions,
} from '../../tools/pdfPasswordProtector';

/** Filesystem path to the qpdf.wasm binary (Node tests pass it explicitly). */
const WASM_PATH = fileURLToPath(
  new URL(
    '../../../../node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm',
    import.meta.url,
  ),
);

/** Build a small 1-page PDF fixture. */
async function makePdf(): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([400, 600]);
  page.drawText('Secret page', { x: 50, y: 500, size: 24, font, color: rgb(0, 0, 0) });
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

describe('isPdfFile / validateProtectOptions', () => {
  it('accepts .pdf by type or extension', () => {
    expect(isPdfFile(new Blob([], { type: 'application/pdf' }), 'x.pdf')).toBe(true);
    expect(isPdfFile(new Blob([]), 'report.PDF')).toBe(true);
    expect(isPdfFile(new Blob([]), 'photo.jpg')).toBe(false);
  });

  it('requires a password of at least 4 characters', () => {
    expect(() => validateProtectOptions('abc', '')).toThrow(/at least 4/);
    expect(() => validateProtectOptions('', '')).toThrow(/at least 4/);
    expect(() => validateProtectOptions('secret123', '')).not.toThrow();
    expect(() => validateProtectOptions('secret123', 'ab')).toThrow(/at least 4/);
    expect(() => validateProtectOptions('secret123', 'owner456')).not.toThrow();
  });
});

describe('protectPdf + checkProtectedPdf (real qpdf-wasm)', () => {
  it('encrypts a real PDF: no password fails, right passwords open it', async () => {
    const pdf = await makePdf();
    const out = await protectPdf(pdf, 'secret123', 'owner456', { wasmUrl: WASM_PATH });
    expect(out.type).toBe('application/pdf');
    expect(out.size).toBeGreaterThan(0);
    const head = new Uint8Array(await out.slice(0, 5).arrayBuffer());
    expect(Buffer.from(head).toString('latin1')).toBe('%PDF-');

    // The original is not encrypted; the output is.
    expect(await checkProtectedPdf(pdf, 'secret123', { wasmUrl: WASM_PATH })).toBe(
      'not-encrypted',
    );
    expect(await checkProtectedPdf(out, 'secret123', { wasmUrl: WASM_PATH })).toBe('ok');
    expect(await checkProtectedPdf(out, 'owner456', { wasmUrl: WASM_PATH })).toBe('ok');
    expect(await checkProtectedPdf(out, 'wrong-password', { wasmUrl: WASM_PATH })).toBe(
      'wrong-password',
    );
  });

  it('owner password defaults to the user password', async () => {
    const pdf = await makePdf();
    const out = await protectPdf(pdf, 'onlypass', '', { wasmUrl: WASM_PATH });
    expect(await checkProtectedPdf(out, 'onlypass', { wasmUrl: WASM_PATH })).toBe('ok');
    expect(await checkProtectedPdf(out, 'otherpass', { wasmUrl: WASM_PATH })).toBe(
      'wrong-password',
    );
  });

  it('rejects short passwords and empty input', async () => {
    const pdf = await makePdf();
    await expect(protectPdf(pdf, 'ab', '', { wasmUrl: WASM_PATH })).rejects.toThrow(
      /at least 4/,
    );
    await expect(protectPdf(new Blob([]), 'secret123', '', { wasmUrl: WASM_PATH })).rejects.toThrow(
      /non-empty/,
    );
  });
});
