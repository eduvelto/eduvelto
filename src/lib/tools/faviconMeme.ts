/**
 * Favicon + meme helpers — pure logic (Batch 3, 27 Nov 2026).
 *
 * FAVICON: PNG downloads are produced by canvas in the UI. The .ico
 * file is written HERE as real ICO bytes with the PNG data embedded
 * (the format Windows/browsers accept for PNG-compressed ICOs) — no
 * fake ICO claim: buildIco really writes the ICO container.
 *
 * MEME: text wrapping + font sizing are pure; the canvas drawing
 * (image + outlined top/bottom text) happens in the UI.
 */

export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;

export interface IcoEntry {
  /** Icon size in px (16, 32, 48 …). */
  size: number;
  /** The PNG bytes for that size. */
  png: ArrayBuffer;
}

/**
 * Write a real .ico file from PNG images (PNG-embedded ICO, the
 * format modern browsers accept). Header: 00 00 01 00, count, then
 * one 16-byte directory entry per image, then the PNG payloads.
 * Pure — works in Node and the browser.
 */
export function buildIco(entries: IcoEntry[]): Blob {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('buildIco needs at least one PNG image');
  }
  const seen = new Set<number>();
  for (const entry of entries) {
    if (!Number.isInteger(entry.size) || entry.size < 1 || entry.size > 256) {
      throw new Error(`ICO size must be an integer between 1 and 256, got ${entry.size}`);
    }
    if (seen.has(entry.size)) throw new Error(`Duplicate ICO size ${entry.size}`);
    seen.add(entry.size);
    if (!(entry.png instanceof ArrayBuffer) || entry.png.byteLength === 0) {
      throw new Error(`ICO entry ${entry.size} needs non-empty PNG bytes`);
    }
  }
  const headerSize = 6 + entries.length * 16;
  let total = headerSize;
  for (const entry of entries) total += entry.png.byteLength;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, entries.length, true);
  let offset = headerSize;
  entries.forEach((entry, i) => {
    const dir = 6 + i * 16;
    out[dir] = entry.size === 256 ? 0 : entry.size; // 0 means 256
    out[dir + 1] = entry.size === 256 ? 0 : entry.size;
    out[dir + 2] = 0; // colour count
    out[dir + 3] = 0; // reserved
    view.setUint16(dir + 4, 1, true); // colour planes
    view.setUint16(dir + 6, 32, true); // bits per pixel
    view.setUint32(dir + 8, entry.png.byteLength, true);
    view.setUint32(dir + 12, offset, true);
    out.set(new Uint8Array(entry.png), offset);
    offset += entry.png.byteLength;
  });
  return new Blob([out], { type: 'image/x-icon' });
}

/** Word-wrap meme text into lines of at most `maxChars` characters. Pure. */
export function wrapMemeText(text: string, maxChars: number): string[] {
  if (!Number.isInteger(maxChars) || maxChars < 4) {
    throw new Error(`maxChars must be an integer of at least 4, got ${maxChars}`);
  }
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') continue;
    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (word.length > maxChars) {
        if (current) { lines.push(current); current = ''; }
        for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
        continue;
      }
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** Meme font size for an image of `width` px (about 1/10th of the width). Pure. */
export function memeFontSize(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error(`Image width must be positive, got ${width}`);
  }
  return Math.max(20, Math.round(width / 10));
}

/** Max characters per meme line for an image of `width` px at the meme font size. Pure. */
export function memeMaxChars(width: number): number {
  return Math.max(8, Math.floor(width / (memeFontSize(width) * 0.55)));
}
