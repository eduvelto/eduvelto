// Background Remover (SIMPLE version) — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import {
  MAX_COLOR_DISTANCE,
  BACKGROUND_REMOVER_MAX_BYTES,
  parseHexColor,
  colorDistance,
  shouldRemovePixel,
  toleranceSliderToDistance,
  removeBackgroundPixels,
  flattenOnBackground,
  validateBackgroundImageFile,
} from '../../tools/backgroundRemover';

describe('parseHexColor', () => {
  it('"#ffffff" -> white', () => {
    expect(parseHexColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('"#0b7285" -> {11,114,133}', () => {
    expect(parseHexColor('#0b7285')).toEqual({ r: 11, g: 114, b: 133 });
  });

  it('3-digit "#fff" expands to white', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rejects non-hex input', () => {
    expect(() => parseHexColor('red')).toThrow(/#rrggbb/);
    expect(() => parseHexColor('#gggggg')).toThrow(/#rrggbb/);
  });
});

describe('colorDistance', () => {
  it('white vs (250,250,250) is sqrt(75) ≈ 8.660', () => {
    // dr=dg=db=5 -> sqrt(25+25+25) = sqrt(75) ≈ 8.660254.
    expect(
      colorDistance({ r: 255, g: 255, b: 255 }, { r: 250, g: 250, b: 250 }),
    ).toBeCloseTo(8.660254, 5);
  });

  it('white vs black is the maximum, sqrt(3 x 255^2) ≈ 441.673', () => {
    expect(
      colorDistance({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 }),
    ).toBeCloseTo(441.673, 2);
    expect(MAX_COLOR_DISTANCE).toBeCloseTo(441.673, 2);
  });

  it('identical colours are distance 0', () => {
    expect(
      colorDistance({ r: 10, g: 20, b: 30 }, { r: 10, g: 20, b: 30 }),
    ).toBe(0);
  });
});

describe('shouldRemovePixel', () => {
  it('a near-white pixel is removed at tolerance 10, black is kept', () => {
    const white = { r: 255, g: 255, b: 255 };
    expect(shouldRemovePixel({ r: 250, g: 250, b: 250 }, white, 10)).toBe(true);
    expect(shouldRemovePixel({ r: 0, g: 0, b: 0 }, white, 10)).toBe(false);
  });

  it('the boundary is inclusive: distance exactly equal to tolerance removes', () => {
    // (255,255,255) vs (250,255,255): dr=5 -> distance exactly 5.
    expect(
      shouldRemovePixel(
        { r: 250, g: 255, b: 255 },
        { r: 255, g: 255, b: 255 },
        5,
      ),
    ).toBe(true);
    expect(
      shouldRemovePixel(
        { r: 250, g: 255, b: 255 },
        { r: 255, g: 255, b: 255 },
        4.99,
      ),
    ).toBe(false);
  });

  it('rejects a negative tolerance', () => {
    expect(() =>
      shouldRemovePixel({ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, -1),
    ).toThrow(/tolerance/);
  });
});

describe('toleranceSliderToDistance', () => {
  it('0 -> 0, 50 -> ~220.84, 100 -> ~441.67', () => {
    expect(toleranceSliderToDistance(0)).toBe(0);
    expect(toleranceSliderToDistance(50)).toBeCloseTo(220.836, 2);
    expect(toleranceSliderToDistance(100)).toBeCloseTo(441.673, 2);
  });

  it('rejects out-of-range sliders', () => {
    expect(() => toleranceSliderToDistance(-1)).toThrow(/0–100/);
    expect(() => toleranceSliderToDistance(101)).toThrow(/0–100/);
  });
});

describe('removeBackgroundPixels', () => {
  it('2x1 image: white pixel goes transparent, black pixel stays opaque', () => {
    // px0 white (255,255,255,255), px1 black (0,0,0,255); target white, tolerance 10.
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    const out = removeBackgroundPixels(data, 2, 1, { r: 255, g: 255, b: 255 }, 10);
    expect([...out]).toEqual([255, 255, 255, 0, 0, 0, 0, 255]);
  });

  it('near-white (250,250,250) is removed at tolerance 10, mid-grey (128) is kept', () => {
    const data = new Uint8ClampedArray([250, 250, 250, 255, 128, 128, 128, 200]);
    const out = removeBackgroundPixels(data, 2, 1, { r: 255, g: 255, b: 255 }, 10);
    // px0 alpha 0; px1 alpha stays 200 (its original alpha, not forced to 255).
    expect([...out]).toEqual([250, 250, 250, 0, 128, 128, 128, 200]);
  });

  it('does not mutate the input array', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255]);
    const out = removeBackgroundPixels(data, 1, 1, { r: 255, g: 255, b: 255 }, 10);
    expect([...data]).toEqual([255, 255, 255, 255]);
    expect(out[3]).toBe(0);
  });

  it('rejects mismatched data length and bad dimensions', () => {
    expect(() =>
      removeBackgroundPixels(new Uint8ClampedArray([0, 0, 0]), 1, 1, {
        r: 0,
        g: 0,
        b: 0,
      }, 10),
    ).toThrow(/does not match/);
    expect(() =>
      removeBackgroundPixels(new Uint8ClampedArray(16), 0, 1, { r: 0, g: 0, b: 0 }, 10),
    ).toThrow(/dimensions/);
  });
});

describe('flattenOnBackground', () => {
  it('2x1 image over white: transparent pixel becomes white, half-red becomes (255,127,127)', () => {
    // px0 fully transparent red, px1 half-transparent red; bg white.
    const data = new Uint8ClampedArray([255, 0, 0, 0, 255, 0, 0, 128]);
    const out = flattenOnBackground(data, 2, 1, { r: 255, g: 255, b: 255 });
    // px0 -> (255,255,255,255); px1 -> (255, round(0*0.502+255*0.498)=127, 127, 255).
    expect([...out]).toEqual([255, 255, 255, 255, 255, 127, 127, 255]);
  });

  it('opaque pixels are unchanged and output is always fully opaque', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255, 200, 100, 50, 255]);
    const out = flattenOnBackground(data, 2, 1, { r: 0, g: 0, b: 0 });
    expect([...out]).toEqual([10, 20, 30, 255, 200, 100, 50, 255]);
  });

  it('transparent pixel over black becomes exactly black', () => {
    const data = new Uint8ClampedArray([123, 45, 67, 0]);
    const out = flattenOnBackground(data, 1, 1, { r: 0, g: 0, b: 0 });
    expect([...out]).toEqual([0, 0, 0, 255]);
  });

  it('does not mutate the input array', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 0]);
    const out = flattenOnBackground(data, 1, 1, { r: 255, g: 255, b: 255 });
    expect([...data]).toEqual([255, 0, 0, 0]);
    expect([...out]).toEqual([255, 255, 255, 255]);
  });

  it('rejects mismatched data length and bad dimensions', () => {
    expect(() =>
      flattenOnBackground(new Uint8ClampedArray([0, 0, 0]), 1, 1, { r: 0, g: 0, b: 0 }),
    ).toThrow(/does not match/);
    expect(() =>
      flattenOnBackground(new Uint8ClampedArray(16), 0, 1, { r: 0, g: 0, b: 0 }),
    ).toThrow(/dimensions/);
  });
});

describe('validateBackgroundImageFile', () => {
  it('accepts a small image file', () => {
    expect(
      validateBackgroundImageFile({ type: 'image/png', size: 1024 }),
    ).toBeNull();
  });

  it('rejects non-image files', () => {
    expect(
      validateBackgroundImageFile({ type: 'application/pdf', size: 1024 }),
    ).toBe('not-image');
    expect(validateBackgroundImageFile({ type: 'image/png', size: 0 })).toBe(
      'not-image',
    );
  });

  it('rejects files over the 10 MB limit', () => {
    expect(BACKGROUND_REMOVER_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(
      validateBackgroundImageFile({
        type: 'image/jpeg',
        size: BACKGROUND_REMOVER_MAX_BYTES + 1,
      }),
    ).toBe('too-large');
    expect(
      validateBackgroundImageFile({
        type: 'image/jpeg',
        size: BACKGROUND_REMOVER_MAX_BYTES,
      }),
    ).toBeNull();
  });
});
