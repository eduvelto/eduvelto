/**
 * Image Resizer — pure logic (Tool #12), canvas-based.
 *
 * Resizes an image to target width/height, optionally locking the aspect
 * ratio (fit inside the target box), plus presets for Bangladeshi job
 * applications. No new library: only the Canvas API. All processing is
 * 100% in the browser: the file never leaves the device.
 *
 * NOTE (follow-up, not built here): HEIC input is NOT supported — no
 * heic2any dependency was added per the Phase-2 brief. A HEIC file will
 * fail image decoding with a clear error; HEIC -> JPG conversion is a
 * later tool (#17).
 *
 * The DOM parts are injectable through `deps` (see imageCompressor.ts) so
 * the wiring stays testable in a Node test run without a DOM.
 */

import {
  assertImageFile,
  type ImageDomDeps,
  type MinimalCanvas,
} from './imageCompressor';

export interface ResizeOptions {
  /** Target width in px. */
  width?: number;
  /** Target height in px. */
  height?: number;
  /**
   * When true, the image keeps its aspect ratio and fits INSIDE the
   * width x height box instead of stretching to the exact size.
   * Default false (exact target size).
   */
  lockAspectRatio?: boolean;
  /** Output format (default image/jpeg). */
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png';
  /** JPEG/WebP quality 0–1 (default 0.9). Ignored for PNG output. */
  quality?: number;
}

/** Built-in size presets (width x height, px). */
export const IMAGE_RESIZE_PRESETS = {
  /** Teletalk job-application photo. */
  teletalkPhoto: { width: 300, height: 300 },
  /** Teletalk job-application signature. */
  teletalkSignature: { width: 300, height: 80 },
  /** Passport photo. */
  passport: { width: 600, height: 600 },
} as const;

export type ImageResizePresetName = keyof typeof IMAGE_RESIZE_PRESETS;

/**
 * Target dimensions for a resize. Pure.
 *
 * - Both width + height, no lock: exact size (may stretch).
 * - Both width + height, lock: fit inside the box, aspect kept.
 * - Only width (or only height): the other side follows the aspect ratio.
 * - Neither: throws.
 *
 * Hand-checks: 800x600 -> {width 400} = 400x300; 800x600 -> {width 400,
 * height 400, lock} = 400x300 (fits inside); 800x600 -> {width 400,
 * height 400} = 400x400 (exact stretch).
 */
export function computeResizeDimensions(
  sourceWidth: number,
  sourceHeight: number,
  options: ResizeOptions,
): { width: number; height: number } {
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0 || !Number.isFinite(sourceHeight) || sourceHeight <= 0) {
    throw new Error(`Image dimensions must be positive numbers, got ${sourceWidth}x${sourceHeight}`);
  }
  const { width, height, lockAspectRatio = false } = options;
  if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
    throw new Error(`width must be a positive number, got ${width}`);
  }
  if (height !== undefined && (!Number.isFinite(height) || height <= 0)) {
    throw new Error(`height must be a positive number, got ${height}`);
  }
  if (width === undefined && height === undefined) {
    throw new Error('resize needs a target width, a target height, or both');
  }
  if (width !== undefined && height === undefined) {
    return { width: Math.round(width), height: Math.round((sourceHeight * width) / sourceWidth) };
  }
  if (height !== undefined && width === undefined) {
    return { width: Math.round((sourceWidth * height) / sourceHeight), height: Math.round(height) };
  }
  // Both given (TS: width/height are defined here).
  const targetWidth = width as number;
  const targetHeight = height as number;
  if (!lockAspectRatio) {
    return { width: Math.round(targetWidth), height: Math.round(targetHeight) };
  }
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  };
}

/**
 * Resize an image via canvas.
 *
 * @param file the source image (File/Blob).
 * @param options target size, or a preset name ('teletalkPhoto' |
 *   'teletalkSignature' | 'passport').
 * @returns a Blob of the resized image.
 */
export async function resizeImage(
  file: Blob,
  options: ResizeOptions | ImageResizePresetName,
  deps: ImageDomDeps = {},
): Promise<Blob> {
  assertImageFile(file);
  const opts: ResizeOptions =
    typeof options === 'string' ? { ...IMAGE_RESIZE_PRESETS[options] } : options;
  const quality = opts.quality ?? 0.9;
  const outputType = opts.outputType ?? 'image/jpeg';
  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) {
    throw new Error(`quality must be between 0 (exclusive) and 1, got ${quality}`);
  }
  if (outputType !== 'image/jpeg' && outputType !== 'image/webp' && outputType !== 'image/png') {
    throw new Error(`outputType must be image/jpeg, image/webp or image/png, got ${outputType}`);
  }

  const loadImage =
    deps.loadImage ??
    ((input: Blob) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(input);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          // Resolve the element itself: drawImage needs a real image source.
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(
            new Error(
              'Could not decode this image — it may be corrupt, HEIC (not supported yet), or in an unsupported format',
            ),
          );
        };
        img.src = url;
      }));
  const createCanvas =
    deps.createCanvas ??
    ((width: number, height: number): MinimalCanvas => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas as unknown as MinimalCanvas;
    });

  const img = await loadImage(file);
  const { width, height } = computeResizeDimensions(img.naturalWidth, img.naturalHeight, opts);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2d canvas context to draw this image');
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error('Canvas export failed for this image')),
      outputType,
      quality,
    );
  });
}
