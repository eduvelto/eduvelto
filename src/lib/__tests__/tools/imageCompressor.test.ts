// Image Compressor (Tool #11) — unit tests.
//
// The real canvas path needs a DOM, which the Node test run does not have,
// so the full pipeline is tested with injected fake DOM deps (verifying the
// wiring, the dimension math and the byte accounting), while the pure
// helpers are tested directly. A real-browser check of an actual JPEG
// encode is still owed before the UI ships — see the note in the module.
import { describe, it, expect } from 'vitest';
import {
  compressImage,
  computeTargetDimensions,
  assertImageFile,
  type ImageDomDeps,
  type MinimalCanvas,
} from '../../tools/imageCompressor';

function makeImageFile(size = 1000): Blob {
  return new Blob([new Uint8Array(size)], { type: 'image/jpeg' });
}

interface FakeDraw {
  width: number;
  height: number;
}

/**
 * Fake DOM deps: a pretend 4000x3000 (or given size) image, and a canvas
 * whose toBlob returns a blob of `outBytes` bytes.
 */
function fakeDeps(
  imageWidth: number,
  imageHeight: number,
  outBytes: number,
): {
  deps: ImageDomDeps;
  drawn: FakeDraw[];
  drawnImg: unknown[];
  fakeImg: HTMLImageElement;
  toBlobArgs: Array<{ type?: string; quality?: number }>;
} {
  const drawn: FakeDraw[] = [];
  const drawnImg: unknown[] = [];
  const toBlobArgs: Array<{ type?: string; quality?: number }> = [];
  // Fake element: a plain size object cast to HTMLImageElement — the
  // fake drawImage ignores the source, so only the size matters here.
  // (The real default resolves a true element; see the module.)
  const fakeImg = {
    naturalWidth: imageWidth,
    naturalHeight: imageHeight,
  } as unknown as HTMLImageElement;
  const deps: ImageDomDeps = {
    loadImage: () => Promise.resolve(fakeImg),
    createCanvas: (width: number, height: number): MinimalCanvas => ({
      width,
      height,
      getContext: () => ({
        drawImage: (img: unknown, _x: number, _y: number, w: number, h: number) => {
          drawnImg.push(img);
          drawn.push({ width: w, height: h });
        },
      }),
      toBlob: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => {
        toBlobArgs.push({ type, quality });
        callback(new Blob([new Uint8Array(outBytes)], { type: type ?? 'image/jpeg' }));
      },
    }),
  };
  return { deps, drawn, drawnImg, fakeImg, toBlobArgs };
}

describe('computeTargetDimensions', () => {
  it('downscales 4000x3000 to max 1920 -> 1920x1440', () => {
    expect(computeTargetDimensions(4000, 3000, 1920)).toEqual({ width: 1920, height: 1440 });
  });

  it('never upscales: 800x600 at max 1920 stays 800x600', () => {
    expect(computeTargetDimensions(800, 600, 1920)).toEqual({ width: 800, height: 600 });
  });

  it('scales a portrait image by its long side: 600x800 at max 300 -> 225x300', () => {
    expect(computeTargetDimensions(600, 800, 300)).toEqual({ width: 225, height: 300 });
  });

  it('rejects non-positive dimensions', () => {
    expect(() => computeTargetDimensions(0, 600, 1920)).toThrow(/positive numbers/);
    expect(() => computeTargetDimensions(800, 600, 0)).toThrow(/positive number/);
  });
});

describe('assertImageFile', () => {
  it('accepts an image blob and rejects anything else', () => {
    expect(() => assertImageFile(makeImageFile())).not.toThrow();
    expect(() => assertImageFile(new Blob(['x'], { type: 'text/plain' }))).toThrow(
      /Expected an image file/,
    );
    expect(() => assertImageFile(new Blob([], { type: 'image/jpeg' }))).toThrow(/empty or missing/);
  });
});

describe('compressImage (fake-DOM wiring)', () => {
  it('downscales, exports at the requested quality, and reports real byte counts', async () => {
    const { deps, drawn, toBlobArgs } = fakeDeps(4000, 3000, 400);
    const result = await compressImage(makeImageFile(1000), { maxDimension: 1920, quality: 0.8 }, deps);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1440);
    expect(drawn).toEqual([{ width: 1920, height: 1440 }]);
    expect(toBlobArgs).toEqual([{ type: 'image/jpeg', quality: 0.8 }]);
    expect(result.originalBytes).toBe(1000);
    expect(result.newBytes).toBe(400);
    // (1000 - 400) / 1000 * 100 = 60% saved.
    expect(result.savedPercent).toBe(60);
    expect(result.blob.size).toBe(400);
  });

  it('passes the loaded image element itself through to drawImage (not just its size)', async () => {
    const { deps, drawnImg, fakeImg } = fakeDeps(800, 600, 500);
    await compressImage(makeImageFile(1000), {}, deps);
    // drawImage needs a real image source; a plain {naturalWidth,
    // naturalHeight} object would throw in a browser (fixed 26 Nov 2026).
    expect(drawnImg).toHaveLength(1);
    expect(drawnImg[0]).toBe(fakeImg);
  });

  it('reports 0% saved when the output is not smaller', async () => {
    const { deps } = fakeDeps(800, 600, 1500);
    const result = await compressImage(makeImageFile(1000), {}, deps);
    expect(result.newBytes).toBe(1500);
    expect(result.savedPercent).toBe(0);
  });

  it('uses the defaults (max 1920, quality 0.8, JPEG) when no options are given', async () => {
    const { deps, toBlobArgs } = fakeDeps(800, 600, 500);
    const result = await compressImage(makeImageFile(1000), {}, deps);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(toBlobArgs).toEqual([{ type: 'image/jpeg', quality: 0.8 }]);
  });

  it('rejects a non-image file, a bad quality and a bad max dimension', async () => {
    const { deps } = fakeDeps(800, 600, 500);
    await expect(
      compressImage(new Blob(['x'], { type: 'text/plain' }), {}, deps),
    ).rejects.toThrow(/Expected an image file/);
    await expect(compressImage(makeImageFile(), { quality: 0 }, deps)).rejects.toThrow(/quality/);
    await expect(compressImage(makeImageFile(), { quality: 1.5 }, deps)).rejects.toThrow(/quality/);
    await expect(compressImage(makeImageFile(), { maxDimension: 0 }, deps)).rejects.toThrow(
      /maxDimension/,
    );
    await expect(
      compressImage(makeImageFile(), { outputType: 'image/gif' as 'image/jpeg' }, deps),
    ).rejects.toThrow(/outputType/);
  });
});
