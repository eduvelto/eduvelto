// Image Resizer (Tool #12) — unit tests.
//
// Same DOM note as the compressor tests: the pipeline is tested with
// injected fake DOM deps (wiring + math), the pure dimension helper
// directly. A real-browser check of an actual resize is still owed
// before the UI ships.
import { describe, it, expect } from 'vitest';
import {
  resizeImage,
  computeResizeDimensions,
  IMAGE_RESIZE_PRESETS,
} from '../../tools/imageResizer';
import type { ImageDomDeps, MinimalCanvas } from '../../tools/imageCompressor';

function makeImageFile(size = 1000): Blob {
  return new Blob([new Uint8Array(size)], { type: 'image/jpeg' });
}

function fakeDeps(
  imageWidth: number,
  imageHeight: number,
): {
  deps: ImageDomDeps;
  drawn: Array<{ width: number; height: number }>;
  drawnImg: unknown[];
  fakeImg: HTMLImageElement;
  canvasSize: { width: number; height: number };
} {
  const drawn: Array<{ width: number; height: number }> = [];
  const drawnImg: unknown[] = [];
  const canvasSize = { width: 0, height: 0 };
  // Fake element: a plain size object cast to HTMLImageElement — the
  // fake drawImage ignores the source, so only the size matters here.
  // (The real default resolves a true element; see the module.)
  const fakeImg = {
    naturalWidth: imageWidth,
    naturalHeight: imageHeight,
  } as unknown as HTMLImageElement;
  const deps: ImageDomDeps = {
    loadImage: () => Promise.resolve(fakeImg),
    createCanvas: (width: number, height: number): MinimalCanvas => {
      canvasSize.width = width;
      canvasSize.height = height;
      return {
        width,
        height,
        getContext: () => ({
          drawImage: (img: unknown, _x: number, _y: number, w: number, h: number) => {
            drawnImg.push(img);
            drawn.push({ width: w, height: h });
          },
        }),
        toBlob: (callback: (blob: Blob | null) => void, type?: string) => {
          callback(new Blob([new Uint8Array(500)], { type: type ?? 'image/jpeg' }));
        },
      };
    },
  };
  return { deps, drawn, drawnImg, fakeImg, canvasSize };
}

describe('computeResizeDimensions', () => {
  it('width only keeps aspect: 800x600 -> width 400 = 400x300', () => {
    expect(computeResizeDimensions(800, 600, { width: 400 })).toEqual({ width: 400, height: 300 });
  });

  it('height only keeps aspect: 800x600 -> height 300 = 400x300', () => {
    expect(computeResizeDimensions(800, 600, { height: 300 })).toEqual({ width: 400, height: 300 });
  });

  it('both dims without lock give the exact size (stretch): 800x600 -> 400x400', () => {
    expect(computeResizeDimensions(800, 600, { width: 400, height: 400 })).toEqual({
      width: 400,
      height: 400,
    });
  });

  it('both dims WITH lock fit inside the box: 800x600 -> 400x400 box = 400x300', () => {
    expect(
      computeResizeDimensions(800, 600, { width: 400, height: 400, lockAspectRatio: true }),
    ).toEqual({ width: 400, height: 300 });
  });

  it('lock fits a portrait image by height: 600x800 -> 400x400 box = 300x400', () => {
    expect(
      computeResizeDimensions(600, 800, { width: 400, height: 400, lockAspectRatio: true }),
    ).toEqual({ width: 300, height: 400 });
  });

  it('rejects missing targets and non-positive values', () => {
    expect(() => computeResizeDimensions(800, 600, {})).toThrow(/width, a target height/);
    expect(() => computeResizeDimensions(800, 600, { width: 0 })).toThrow(/positive number/);
    expect(() => computeResizeDimensions(800, 600, { height: -10 })).toThrow(/positive number/);
    expect(() => computeResizeDimensions(0, 600, { width: 100 })).toThrow(/positive numbers/);
  });
});

describe('IMAGE_RESIZE_PRESETS', () => {
  it('has the Teletalk and passport sizes from the spec', () => {
    expect(IMAGE_RESIZE_PRESETS.teletalkPhoto).toEqual({ width: 300, height: 300 });
    expect(IMAGE_RESIZE_PRESETS.teletalkSignature).toEqual({ width: 300, height: 80 });
    expect(IMAGE_RESIZE_PRESETS.passport).toEqual({ width: 600, height: 600 });
  });
});

describe('resizeImage (fake-DOM wiring)', () => {
  it('resizes to the Teletalk photo preset: 800x600 -> 300x300 canvas', async () => {
    const { deps, drawn, canvasSize } = fakeDeps(800, 600);
    const blob = await resizeImage(makeImageFile(), 'teletalkPhoto', deps);
    expect(canvasSize).toEqual({ width: 300, height: 300 });
    expect(drawn).toEqual([{ width: 300, height: 300 }]);
    expect(blob.size).toBe(500);
  });

  it('passes the loaded image element itself through to drawImage (not just its size)', async () => {
    const { deps, drawnImg, fakeImg } = fakeDeps(800, 600);
    await resizeImage(makeImageFile(), 'teletalkPhoto', deps);
    // drawImage needs a real image source; a plain {naturalWidth,
    // naturalHeight} object would throw in a browser (fixed 26 Nov 2026).
    expect(drawnImg).toHaveLength(1);
    expect(drawnImg[0]).toBe(fakeImg);
  });

  it('resizes to the passport preset: 800x600 -> 600x600 canvas', async () => {
    const { deps, canvasSize } = fakeDeps(800, 600);
    await resizeImage(makeImageFile(), 'passport', deps);
    expect(canvasSize).toEqual({ width: 600, height: 600 });
  });

  it('honours aspect lock with explicit options: 800x600 -> 400x400 box = 400x300', async () => {
    const { deps, canvasSize } = fakeDeps(800, 600);
    await resizeImage(makeImageFile(), { width: 400, height: 400, lockAspectRatio: true }, deps);
    expect(canvasSize).toEqual({ width: 400, height: 300 });
  });

  it('rejects a non-image file and an empty target', async () => {
    const { deps } = fakeDeps(800, 600);
    await expect(
      resizeImage(new Blob(['x'], { type: 'text/plain' }), 'passport', deps),
    ).rejects.toThrow(/Expected an image file/);
    await expect(resizeImage(makeImageFile(), {}, deps)).rejects.toThrow(/width, a target height/);
  });
});
