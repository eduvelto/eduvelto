// Favicon ICO writer + meme layout — pure unit tests (Batch 3).
import { describe, it, expect } from 'vitest';
import { buildIco, FAVICON_SIZES, memeFontSize, memeMaxChars, wrapMemeText } from '../../tools/faviconMeme';

function fakePng(size: number): ArrayBuffer {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, size]);
  return bytes.buffer;
}

describe('buildIco', () => {
  it('writes a valid ICO header with two entries', () => {
    const ico = buildIco([
      { size: 16, png: fakePng(16) },
      { size: 32, png: fakePng(32) },
    ]);
    expect(ico.type).toBe('image/x-icon');
    return ico.arrayBuffer().then((buf) => {
      const view = new DataView(buf);
      expect(view.getUint16(0, true)).toBe(0); // reserved
      expect(view.getUint16(2, true)).toBe(1); // icon type
      expect(view.getUint16(4, true)).toBe(2); // count
      expect(view.getUint8(6)).toBe(16); // first entry width
      expect(view.getUint8(22)).toBe(32); // second entry width
      expect(view.getUint32(14, true)).toBe(5); // first PNG byte count
      // PNG payloads follow the 6 + 2*16 = 38-byte directory.
      expect(view.getUint8(38)).toBe(0x89);
    });
  });

  it('rejects an empty list, a duplicate size and a bad size', () => {
    expect(() => buildIco([])).toThrow(/at least one PNG/);
    expect(() =>
      buildIco([
        { size: 16, png: fakePng(16) },
        { size: 16, png: fakePng(16) },
      ]),
    ).toThrow(/Duplicate ICO size/);
    expect(() => buildIco([{ size: 300, png: fakePng(300) }])).toThrow(/between 1 and 256/);
  });
});

describe('FAVICON_SIZES', () => {
  it('includes the standard 16/32/48 presets', () => {
    expect(FAVICON_SIZES).toContain(16);
    expect(FAVICON_SIZES).toContain(32);
    expect(FAVICON_SIZES).toContain(48);
  });
});

describe('wrapMemeText', () => {
  it('wraps on word boundaries', () => {
    expect(wrapMemeText('WHEN THE EXAM IS TOMORROW', 10)).toEqual(['WHEN THE', 'EXAM IS', 'TOMORROW']);
  });

  it('returns no lines for empty text', () => {
    expect(wrapMemeText('', 10)).toEqual([]);
    expect(wrapMemeText('   ', 10)).toEqual([]);
  });

  it('splits an over-long word', () => {
    expect(wrapMemeText('ABCDEFGHIJ', 4)).toEqual(['ABCD', 'EFGH', 'IJ']);
  });
});

describe('memeFontSize / memeMaxChars', () => {
  it('scales with image width, with a floor', () => {
    expect(memeFontSize(1000)).toBe(100);
    expect(memeFontSize(100)).toBe(20); // floor
    expect(memeMaxChars(1000)).toBeGreaterThan(10);
  });

  it('rejects a non-positive width', () => {
    expect(() => memeFontSize(0)).toThrow(/positive/);
  });
});
