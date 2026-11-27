// HEIC to JPG — unit tests.
//
// heic2any needs a browser (`window` at import time), so the real
// conversion cannot run in Node — it is verified in a live browser
// (Playwright), where a real HEIC sample becomes a real JPG. What
// Node CAN verify, and does here: file-type detection, quality
// validation, output naming, and that the bundled test fixture is a
// genuine HEIC file (ISO-BMFF `ftyp` box, major brand `heic`).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  heicJpegFileName, isHeicFile, validateHeicQuality,
} from '../../tools/heicToJpg';

const SAMPLE_HEIC = fileURLToPath(
  new URL('./fixtures/sample.heic', import.meta.url),
);

describe('isHeicFile', () => {
  it('accepts HEIC by MIME type or extension', () => {
    expect(isHeicFile(new Blob([], { type: 'image/heic' }), 'x.heic')).toBe(true);
    expect(isHeicFile(new Blob([], { type: 'image/heif' }), 'x.heif')).toBe(true);
    expect(isHeicFile(new Blob([]), 'photo.HEIC')).toBe(true);
    expect(isHeicFile(new Blob([]), 'photo.heif')).toBe(true);
    expect(isHeicFile(new Blob([]), 'photo.jpg')).toBe(false);
    expect(isHeicFile(new Blob([], { type: 'image/jpeg' }), 'photo.jpg')).toBe(false);
    expect(isHeicFile(new Blob([], { type: 'application/pdf' }), 'doc.pdf')).toBe(false);
  });
});

describe('validateHeicQuality / heicJpegFileName', () => {
  it('accepts quality 0.1–1', () => {
    expect(() => validateHeicQuality(0.92)).not.toThrow();
    expect(() => validateHeicQuality(0.05)).toThrow(/quality/);
    expect(() => validateHeicQuality(1.5)).toThrow(/quality/);
    expect(() => validateHeicQuality(Number.NaN)).toThrow(/quality/);
  });

  it('names the JPG from the HEIC name', () => {
    expect(heicJpegFileName('IMG_1234.HEIC')).toBe('IMG_1234.jpg');
    expect(heicJpegFileName('a/b/photo.heif')).toBe('photo.jpg');
    expect(heicJpegFileName('plain')).toBe('plain.jpg');
  });
});

describe('sample.heic fixture (real HEIC file)', () => {
  it('is a genuine HEIC: ISO-BMFF ftyp box, major brand "heic"', () => {
    const bytes = readFileSync(SAMPLE_HEIC);
    expect(bytes.length).toBeGreaterThan(0);
    // Box size (4 bytes) + box type "ftyp" + major brand (4 bytes).
    expect(Buffer.from(bytes.subarray(4, 8)).toString('latin1')).toBe('ftyp');
    const brand = Buffer.from(bytes.subarray(8, 12)).toString('latin1');
    expect(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1']).toContain(brand);
    // Compatible brands include the HEIF base brand.
    const compat = Buffer.from(bytes.subarray(16, 28)).toString('latin1');
    expect(compat).toContain('mif1');
  });
});
