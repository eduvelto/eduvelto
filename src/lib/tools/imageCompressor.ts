/**
 * Image Compressor — pure logic (Tool #11), canvas-based.
 *
 * Draws the image onto a canvas at a chosen max dimension and exports it
 * as JPEG/WebP at a chosen quality. No new library: only the Canvas API.
 * All processing is 100% in the browser: the file never leaves the device.
 *
 * The DOM parts (Image loading, canvas) are injectable through `deps` so
 * the wiring stays testable in a Node test run without a DOM; in the app
 * the defaults use `document` / `URL.createObjectURL`.
 */

export interface ImageCompressionOptions {
  /** Longest side is scaled down to this many px (default 1920). No upscale. */
  maxDimension?: number;
  /** JPEG/WebP quality 0–1 (default 0.8). Ignored for PNG output. */
  quality?: number;
  /** Output format (default image/jpeg). */
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface ImageCompressionResult {
  /** The compressed image. */
  blob: Blob;
  /** Input size in bytes. */
  originalBytes: number;
  /** Output size in bytes. */
  newBytes: number;
  /** Percent saved: (original - new) / original * 100 (0 when nothing saved). */
  savedPercent: number;
  /** Output width in px. */
  width: number;
  /** Output height in px. */
  height: number;
}

/** Minimal canvas surface the image tools need (structural, injectable). */
export interface MinimalCanvas {
  width: number;
  height: number;
  getContext: (
    kind: '2d',
  ) => { drawImage: (img: unknown, x: number, y: number, w: number, h: number) => void } | null;
  toBlob: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => void;
}

/** Minimal DOM surface the image tools need (injectable for tests). */
export interface ImageDomDeps {
  /**
   * Load an image file and resolve with the decoded element.
   * The element itself (not just its size) is required: it is the
   * drawImage source, so resolving a plain {naturalWidth,
   * naturalHeight} object would throw at drawImage in a real browser
   * (fixed 26 Nov 2026 — the default used to resolve the plain object).
   */
  loadImage?: (file: Blob) => Promise<HTMLImageElement>;
  /** Create a blank canvas of the given size. */
  createCanvas?: (width: number, height: number) => MinimalCanvas;
}

const SUPPORTED_OUTPUT_TYPES = new Set(['image/jpeg', 'image/webp', 'image/png']);

/** Throw unless the file is an image. */
export function assertImageFile(file: unknown): asserts file is Blob {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('An image file is required (got an empty or missing file)');
  }
  if (typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error(
      `Expected an image file, got "${(file as Blob).type || 'unknown type'}" — choose a JPG, PNG, WebP or similar image`,
    );
  }
}

/**
 * Target dimensions for a max-dimension downscale (never upscales).
 * Pure: hand-check 4000x3000 @ 1920 -> 1920x1440; 800x600 @ 1920 -> 800x600.
 */
export function computeTargetDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Image dimensions must be positive numbers, got ${width}x${height}`);
  }
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new Error(`maxDimension must be a positive number, got ${maxDimension}`);
  }
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function defaultLoadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Resolve the element itself: drawImage needs a real image
      // source, not a {naturalWidth, naturalHeight} plain object.
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode this image — it may be corrupt or in an unsupported format'));
    };
    img.src = url;
  });
}

function defaultCreateCanvas(width: number, height: number): MinimalCanvas {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // The real canvas has the full Canvas API; MinimalCanvas is the small
  // structural subset these tools use.
  return canvas as unknown as MinimalCanvas;
}

/**
 * Compress an image via canvas: downscale to `maxDimension` and export at
 * `quality`. Returns the real byte counts — no ratio is promised.
 */
export async function compressImage(
  file: Blob,
  options: ImageCompressionOptions = {},
  deps: ImageDomDeps = {},
): Promise<ImageCompressionResult> {
  assertImageFile(file);
  const maxDimension = options.maxDimension ?? 1920;
  const quality = options.quality ?? 0.8;
  const outputType = options.outputType ?? 'image/jpeg';
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
    throw new Error(`maxDimension must be a positive number, got ${maxDimension}`);
  }
  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) {
    throw new Error(`quality must be between 0 (exclusive) and 1, got ${quality}`);
  }
  if (!SUPPORTED_OUTPUT_TYPES.has(outputType)) {
    throw new Error(`outputType must be image/jpeg, image/webp or image/png, got ${outputType}`);
  }

  const loadImage = deps.loadImage ?? defaultLoadImage;
  const createCanvas = deps.createCanvas ?? defaultCreateCanvas;
  const img = await loadImage(file);
  const { width, height } = computeTargetDimensions(img.naturalWidth, img.naturalHeight, maxDimension);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2d canvas context to draw this image');
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error('Canvas export failed for this image')),
      outputType,
      quality,
    );
  });
  const originalBytes = file.size;
  const newBytes = blob.size;
  return {
    blob,
    originalBytes,
    newBytes,
    savedPercent:
      newBytes >= originalBytes
        ? 0
        : Math.round(((originalBytes - newBytes) / originalBytes) * 1000) / 10,
    width,
    height,
  };
}
