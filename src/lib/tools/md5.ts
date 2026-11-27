/**
 * MD5 (RFC 1321) — small standard implementation, written here because
 * browsers have no MD5 API (Web Crypto only offers SHA-1/256/384/512).
 * Follows the RFC 1321 pseudocode: K[i] = floor(abs(sin(i+1)) * 2^32),
 * per-round shift amounts, little-endian block words.
 * Verified against the RFC test vectors in src/lib/__tests__/tools/md5.test.ts:
 * md5('') = d41d8cd98f00b204e9800998ecf8427e,
 * md5('abc') = 900150983cd24fb0d6963f7d28e17f72.
 * Pure functions, no DOM.
 */

const SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K: number[] = Array.from({ length: 64 }, (_, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0,
);

function rotl(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

function wordToHexLE(word: number): string {
  let out = '';
  for (let i = 0; i < 4; i++) out += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
  return out;
}

/** MD5 hex digest of a UTF-8 string. */
export function md5Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  // Padding: 0x80, then zeros until length ≡ 56 (mod 64), then the
  // 64-bit little-endian bit length.
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  padded[paddedLength - 8] = bitLen & 0xff;
  padded[paddedLength - 7] = (bitLen >>> 8) & 0xff;
  padded[paddedLength - 6] = (bitLen >>> 16) & 0xff;
  padded[paddedLength - 5] = (bitLen >>> 24) & 0xff;
  const high = Math.floor(bitLen / 4294967296);
  padded[paddedLength - 4] = high & 0xff;
  padded[paddedLength - 3] = (high >>> 8) & 0xff;
  padded[paddedLength - 2] = (high >>> 16) & 0xff;
  padded[paddedLength - 1] = (high >>> 24) & 0xff;

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const m: number[] = [];
    for (let j = 0; j < 16; j++) {
      const i = offset + j * 4;
      m.push(
        (padded[i] | (padded[i + 1] << 8) | (padded[i + 2] << 16) | (padded[i + 3] << 24)) >>> 0,
      );
    }
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      f = (f + a + K[i] + m[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotl(f, SHIFTS[i])) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  return wordToHexLE(a0) + wordToHexLE(b0) + wordToHexLE(c0) + wordToHexLE(d0);
}
