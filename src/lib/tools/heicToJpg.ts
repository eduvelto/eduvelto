/**
 * HEIC to JPG — `heic2any` 0.0.4 (libheif compiled to WebAssembly,
 * wrapped for the browser).
 *
 * Converts an iPhone HEIC/HEIF photo to a JPG, 100% in the browser.
 * The library is loaded with a dynamic `import()` INSIDE the function
 * only (never a static import), so it is lazy-loaded when the user
 * picks a file.
 *
 * Browser-only note (verified 27 Nov 2026): heic2any accesses
 * `window` at import time, so it cannot run in Node — the vitest
 * suite below covers validation and the real-HEIC fixture only, and
 * the real conversion is verified in a live browser (Playwright),
 * where a real HEIC sample becomes a real JPG.
 *
 * Pure functions (apart from the lazy library load): no network, no
 * storage. The file never leaves the device.
 */

export const HEIC_MAX_MB = 10;

export function isHeicFile(file: Blob, name?: string): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true;
  return typeof name === 'string' && /\.hei[cf]$/i.test(name);
}

export function validateHeicQuality(quality: number): void {
  if (!Number.isFinite(quality) || quality < 0.1 || quality > 1) {
    throw new Error('JPEG quality must be between 0.1 and 1');
  }
}

/** "photo.HEIC" -> "photo.jpg"; strips directories too. */
export function heicJpegFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName;
  const stem = base.replace(/\.hei[cf]$/i, '') || 'heic-photo';
  return `${stem.replace(/[\\/:*?"<>|]/g, '_')}.jpg`;
}

/**
 * Convert a HEIC/HEIF photo to a JPG Blob.
 *
 * @param blob the HEIC file as a File/Blob.
 * @param quality JPEG quality 0.1–1 (default 0.92).
 * @throws on empty/non-HEIC input, bad quality, or a decode failure.
 */
export async function convertHeicToJpg(blob: Blob, quality = 0.92): Promise<Blob> {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('convertHeicToJpg needs a non-empty HEIC file');
  }
  validateHeicQuality(quality);
  const { default: heic2any } = await import('heic2any');
  let out: Blob | Blob[];
  try {
    out = await heic2any({ blob, toType: 'image/jpeg', quality });
  } catch {
    throw new Error('Could not decode this HEIC photo — it may be corrupt or not a HEIC file');
  }
  const first = Array.isArray(out) ? out[0] : out;
  if (!first || first.size === 0) {
    throw new Error('Could not decode this HEIC photo — the output was empty');
  }
  return first;
}
