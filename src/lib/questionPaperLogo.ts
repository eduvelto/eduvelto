// Eduvelto — Question Paper Generator: Pro institution-logo compression.
//
// ZERO SERVER STORAGE COST (owner 25 Nov 08:48, BINDING): a Pro
// institution logo is compressed CLIENT-SIDE to a <50KB WebP/JPEG data
// URL and lives ONLY in memory for the session (React state), used in
// the clean-PDF render only. User files are NEVER uploaded to Firebase
// Storage (or anywhere else) — there is no upload code path at all.
//
// The compressor steps down (max dimension, then quality, WebP then
// JPEG) until the data URL fits the 50KB budget, and returns null when
// even the smallest attempt does not fit — the caller then shows an
// honest "logo too large/complex" message instead of silently using a
// big file. Logo upload itself is Pro and LOCKED in the MVP; this
// module is the (tested) mechanism the Pro flow will call.

export const QPG_LOGO_MAX_BYTES = 50_000;

/** Approximate decoded byte size of a data URL (base64 ≈ 4/3). */
export function logoDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

export function isLogoWithinBudget(dataUrl: string, maxBytes = QPG_LOGO_MAX_BYTES): boolean {
  return logoDataUrlBytes(dataUrl) <= maxBytes;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('logo image could not be read'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('logo file could not be read'));
    reader.readAsDataURL(file);
  });
}

function renderScaled(
  img: HTMLImageElement,
  maxDim: number,
  mime: 'image/webp' | 'image/jpeg',
  quality: number,
): string | null {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  try {
    return canvas.toDataURL(mime, quality);
  } catch {
    return null;
  }
}

/** Compress a logo file to a <50KB data URL (in-memory only).
 *  Returns null when the file cannot be read or nothing fits. */
export async function compressLogoToDataUrl(
  file: File,
  maxBytes = QPG_LOGO_MAX_BYTES,
): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  let src: string;
  try {
    src = await readFileAsDataUrl(file);
  } catch {
    return null;
  }
  if (isLogoWithinBudget(src, maxBytes)) return src;
  let img: HTMLImageElement;
  try {
    img = await loadImage(src);
  } catch {
    return null;
  }
  const attempts: Array<{ maxDim: number; mime: 'image/webp' | 'image/jpeg'; quality: number }> = [
    { maxDim: 512, mime: 'image/webp', quality: 0.85 },
    { maxDim: 512, mime: 'image/webp', quality: 0.6 },
    { maxDim: 320, mime: 'image/webp', quality: 0.5 },
    { maxDim: 320, mime: 'image/jpeg', quality: 0.8 },
    { maxDim: 192, mime: 'image/webp', quality: 0.4 },
    { maxDim: 192, mime: 'image/jpeg', quality: 0.6 },
  ];
  let smallest: string | null = null;
  for (const a of attempts) {
    const out = renderScaled(img, a.maxDim, a.mime, a.quality);
    if (!out) continue;
    if (smallest === null || logoDataUrlBytes(out) < logoDataUrlBytes(smallest)) smallest = out;
    if (isLogoWithinBudget(out, maxBytes)) return out;
  }
  return null;
}
