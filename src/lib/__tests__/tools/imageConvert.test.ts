// Image conversion — shared engine unit tests (Batch 3).
import { describe, it, expect } from 'vitest';
import {
  computeCropRect,
  computeRotatedDimensions,
  convertImage,
  dataUrlToBlob,
  fileToDataUrl,
  hexToRgb,
  IMAGE_FILTERS,
  looksLikeBase64,
  rgbToHex,
  rgbToHsl,
  type ImageDomDeps,
} from '../../tools/imageConvert';

function fakeDeps(): ImageDomDeps {
  const calls: string[] = [];
  return {
    loadImage: async () =>
      ({ naturalWidth: 800, naturalHeight: 600 }) as unknown as HTMLImageElement,
    createCanvas: (width: number, height: number) => {
      const ctx = {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        translate: () => calls.push('translate'),
        rotate: () => calls.push('rotate'),
        scale: () => calls.push('scale'),
        drawImage: () => calls.push('drawImage'),
        fillRect: () => calls.push('fillRect'),
        filter: 'none',
      };
      return {
        width,
        height,
        getContext: () => ctx,
        toBlob: (cb: (b: Blob | null) => void, type?: string) => {
          cb(new Blob([new Uint8Array([1, 2, 3])], { type: type ?? 'image/png' }));
        },
      } as unknown as ReturnType<NonNullable<ImageDomDeps['createCanvas']>>;
    },
  };
}

describe('computeRotatedDimensions', () => {
  it('swaps w/h at 90 and 270, keeps at 0 and 180', () => {
    expect(computeRotatedDimensions(800, 600, 90)).toEqual({ width: 600, height: 800 });
    expect(computeRotatedDimensions(800, 600, 270)).toEqual({ width: 600, height: 800 });
    expect(computeRotatedDimensions(800, 600, 180)).toEqual({ width: 800, height: 600 });
    expect(computeRotatedDimensions(800, 600, 0)).toEqual({ width: 800, height: 600 });
  });

  it('rejects 45 degrees and non-positive sizes', () => {
    expect(() => computeRotatedDimensions(800, 600, 45)).toThrow(/0, 90, 180 or 270/);
    expect(() => computeRotatedDimensions(0, 600, 90)).toThrow(/positive/);
  });
});

describe('computeCropRect', () => {
  it('converts fractions to source pixels', () => {
    expect(computeCropRect(800, 600, { x: 0.25, y: 0.25, w: 0.5, h: 0.5 })).toEqual({ x: 200, y: 150, w: 400, h: 300 });
  });

  it('rejects a crop that leaves the image', () => {
    expect(() => computeCropRect(800, 600, { x: 0.8, y: 0, w: 0.5, h: 0.5 })).toThrow(/inside the image/);
    expect(() => computeCropRect(800, 600, { x: 0, y: 0, w: 0, h: 0.5 })).toThrow(/greater than 0/);
  });
});

describe('convertImage (fake canvas)', () => {
  const file = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });

  it('converts to PNG at the rotated size', async () => {
    const out = await convertImage(file, { format: 'image/png', rotateDeg: 90 }, fakeDeps());
    expect(out.format).toBe('image/png');
    expect(out.width).toBe(600);
    expect(out.height).toBe(800);
    expect(out.blob.type).toBe('image/png');
  });

  it('rejects a bad format, bad quality and unknown filter', async () => {
    await expect(convertImage(file, { format: 'image/gif' as never }, fakeDeps())).rejects.toThrow(/format must be/);
    await expect(convertImage(file, { quality: 2 }, fakeDeps())).rejects.toThrow(/quality must be/);
    await expect(convertImage(file, { filter: 'nope' }, fakeDeps())).rejects.toThrow(/Unknown filter/);
  });

  it('rejects non-image input', async () => {
    await expect(convertImage(new Blob(['x'], { type: 'text/plain' }), {}, fakeDeps())).rejects.toThrow(/Expected an image/);
  });
});

describe('IMAGE_FILTERS', () => {
  it('has a none entry and the advertised filters', () => {
    expect(IMAGE_FILTERS.none).toBe('none');
    for (const key of ['grayscale', 'sepia', 'invert', 'blur', 'vintage']) {
      expect(typeof IMAGE_FILTERS[key]).toBe('string');
    }
  });
});

describe('colour helpers', () => {
  it('rgbToHex / hexToRgb round-trip', () => {
    expect(rgbToHex(11, 114, 133)).toBe('#0b7285');
    expect(hexToRgb('#0b7285')).toEqual({ r: 11, g: 114, b: 133 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rejects bad hex and out-of-range channels', () => {
    expect(() => hexToRgb('red')).toThrow(/valid hex/);
    expect(() => rgbToHex(300, 0, 0)).toThrow(/between 0 and 255/);
  });

  it('rgbToHsl: red is 0/100/50, grey has 0 saturation', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('base64 helpers', () => {
  it('fileToDataUrl + dataUrlToBlob round-trip', async () => {
    const file = new Blob([new Uint8Array([104, 105])], { type: 'image/png' });
    const url = await fileToDataUrl(file);
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    const back = dataUrlToBlob(url);
    expect(back.type).toBe('image/png');
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(new Uint8Array([104, 105]));
  });

  it('dataUrlToBlob rejects a non-data URL', () => {
    expect(() => dataUrlToBlob('https://example.com/x.png')).toThrow(/data URL/);
  });

  it('looksLikeBase64 accepts padded base64 and rejects plain words', () => {
    expect(looksLikeBase64('aGVsbG8=')).toBe(true);
    expect(looksLikeBase64('hello world!')).toBe(false);
  });
});
