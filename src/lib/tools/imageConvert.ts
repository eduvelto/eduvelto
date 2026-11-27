/**
 * Image conversion — shared canvas engine (Batch 3, 27 Nov 2026).
 *
 * Shared by jpg-to-png, png-to-jpg, webp-converter, image-rotate-flip,
 * image-filter, image-to-base64, image-color-picker, image-cropper,
 * image-watermark-maker, favicon-generator, meme-generator and
 * exif-viewer-remover. Only the Canvas / FileReader browser APIs are
 * used — no new library. All processing is 100% in the browser.
 *
 * The DOM parts (Image loading, canvas) are injectable through `deps`
 * so the pure geometry stays testable in Node without a DOM.
 */

import type { ImageDomDeps, MinimalCanvas } from './imageCompressor';

export type { ImageDomDeps, MinimalCanvas };

export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export const IMAGE_FILTERS: Record<string, string> = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  invert: 'invert(100%)',
  blur: 'blur(3px)',
  brightness: 'brightness(130%)',
  contrast: 'contrast(150%)',
  saturate: 'saturate(180%)',
  'hue-rotate': 'hue-rotate(90deg)',
  vintage: 'sepia(60%) contrast(110%) brightness(105%)',
  cold: 'hue-rotate(180deg) saturate(120%)',
  warm: 'sepia(30%) saturate(140%) brightness(105%)',
};

export const FILTER_LABELS: Record<string, { bn: string; en: string }> = {
  none: { bn: 'কোনো ফিল্টার নয়', en: 'No filter' },
  grayscale: { bn: 'সাদা-কালো', en: 'Black & white' },
  sepia: { bn: 'সেপিয়া', en: 'Sepia' },
  invert: { bn: 'উল্টো রং', en: 'Invert' },
  blur: { bn: 'ঝাপসা', en: 'Blur' },
  brightness: { bn: 'উজ্জ্বল', en: 'Brighter' },
  contrast: { bn: 'বিপরীততা বেশি', en: 'High contrast' },
  saturate: { bn: 'রং গাঢ়', en: 'Saturated' },
  'hue-rotate': { bn: 'রং ঘোরানো', en: 'Hue shift' },
  vintage: { bn: 'পুরোনো ছবি', en: 'Vintage' },
  cold: { bn: 'ঠান্ডা রং', en: 'Cold' },
  warm: { bn: 'উষ্ণ রং', en: 'Warm' },
};

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

/** Real browser DOM deps: loadImage resolves the actual Image element. */
export function realImageDeps(): ImageDomDeps {
  return {
    loadImage: (file: Blob) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Could not decode this image — it may be corrupt or in an unsupported format'));
        };
        img.src = url;
      }),
    createCanvas: (width: number, height: number): MinimalCanvas => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas as unknown as MinimalCanvas;
    },
  };
}

/** Output canvas size after rotating w×h by a multiple of 90°. Pure. */
export function computeRotatedDimensions(
  width: number,
  height: number,
  rotateDeg: number,
): { width: number; height: number } {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Image dimensions must be positive numbers, got ${width}x${height}`);
  }
  const norm = ((rotateDeg % 360) + 360) % 360;
  if (![0, 90, 180, 270].includes(norm)) {
    throw new Error(`Rotation must be 0, 90, 180 or 270 degrees, got ${rotateDeg}`);
  }
  return norm === 90 || norm === 270 ? { width: height, height: width } : { width, height };
}

/** Crop rectangle (source pixels) from fractional sliders 0..1. Pure. */
export function computeCropRect(
  width: number,
  height: number,
  crop: { x: number; y: number; w: number; h: number },
): { x: number; y: number; w: number; h: number } {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error(`Image dimensions must be positive numbers, got ${width}x${height}`);
  }
  for (const [k, v] of Object.entries(crop)) {
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new Error(`Crop ${k} must be between 0 and 1, got ${v}`);
    }
  }
  if (crop.w <= 0 || crop.h <= 0) throw new Error('Crop width and height must be greater than 0');
  if (crop.x + crop.w > 1 || crop.y + crop.h > 1) {
    throw new Error('Crop area must stay inside the image');
  }
  return {
    x: Math.round(crop.x * width),
    y: Math.round(crop.y * height),
    w: Math.max(1, Math.round(crop.w * width)),
    h: Math.max(1, Math.round(crop.h * height)),
  };
}

export interface ConvertOptions {
  format?: ImageMime;
  /** 0–1 (default 0.92). Ignored for PNG. */
  quality?: number;
  /** 0 / 90 / 180 / 270 clockwise (default 0). */
  rotateDeg?: number;
  flipH?: boolean;
  flipV?: boolean;
  /** Key of IMAGE_FILTERS (default 'none'). */
  filter?: string;
  /** Crop in fractions 0..1, applied before rotate/flip. */
  crop?: { x: number; y: number; w: number; h: number };
  /** Longest side cap in px (never upscales). */
  maxDimension?: number;
}

export interface ConvertResult {
  blob: Blob;
  width: number;
  height: number;
  format: ImageMime;
}

/**
 * Convert / rotate / flip / filter / crop an image via canvas.
 * The drawing itself needs a real 2d context, so `deps` must supply a
 * real canvas in the browser (realImageDeps()); in tests a fake canvas
 * records the calls.
 */
export async function convertImage(
  file: Blob,
  options: ConvertOptions = {},
  deps: ImageDomDeps = {},
): Promise<ConvertResult> {
  assertImageFile(file);
  const format = options.format ?? 'image/png';
  if (!(['image/jpeg', 'image/png', 'image/webp'] as string[]).includes(format)) {
    throw new Error(`format must be image/jpeg, image/png or image/webp, got ${format}`);
  }
  const quality = options.quality ?? 0.92;
  if (!Number.isFinite(quality) || quality <= 0 || quality > 1) {
    throw new Error(`quality must be between 0 (exclusive) and 1, got ${quality}`);
  }
  const rotateDeg = options.rotateDeg ?? 0;
  const filterKey = options.filter ?? 'none';
  const filter = IMAGE_FILTERS[filterKey];
  if (filter === undefined) throw new Error(`Unknown filter "${filterKey}"`);
  const loadImage = deps.loadImage ?? realImageDeps().loadImage!;
  const createCanvas = deps.createCanvas ?? realImageDeps().createCanvas!;
  const img = await loadImage(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;
  if (options.crop) {
    const r = computeCropRect(srcW, srcH, options.crop);
    sx = r.x; sy = r.y; sw = r.w; sh = r.h;
  }
  let { width, height } = computeRotatedDimensions(sw, sh, rotateDeg);
  if (options.maxDimension) {
    const scale = Math.min(1, options.maxDimension / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d') as unknown as {
    save: () => void;
    restore: () => void;
    translate: (x: number, y: number) => void;
    rotate: (r: number) => void;
    scale: (x: number, y: number) => void;
    drawImage: (img: unknown, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => void;
    filter?: string;
    fillStyle?: string;
    fillRect?: (x: number, y: number, w: number, h: number) => void;
  } | null;
  if (!ctx) throw new Error('Could not get a 2d canvas context to draw this image');
  // JPEG has no transparency — paint white behind it.
  if (format === 'image/jpeg' && ctx.fillRect) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.save();
  if (filter !== 'none') ctx.filter = filter;
  ctx.translate(width / 2, height / 2);
  if (rotateDeg) ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
  ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Canvas export failed for this image'))),
      format,
      quality,
    );
  });
  return { blob, width, height, format };
}

/** File -> data URL (data:image/...;base64,...). Works in browser and Node. */
export async function fileToDataUrl(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${file.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

/** Parse a data URL back into a Blob. Pure. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl.trim());
  if (!match) throw new Error('Not a valid data URL — it must start with "data:"');
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const data = match[3];
  if (isBase64) {
    if (!/^[A-Za-z0-9+/=\s]*$/.test(data)) throw new Error('Not valid Base64 data');
    const binary = atob(data.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(data)], { type: mime });
}

/** Is this string plausible Base64 (ignoring whitespace)? Pure. */
export function looksLikeBase64(text: string): boolean {
  const clean = text.trim().replace(/\s/g, '');
  return clean.length > 0 && clean.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(clean);
}

// ---- Colour helpers (image-color-picker) ----

/** [r,g,b] 0–255 -> "#rrggbb". Pure. */
export function rgbToHex(r: number, g: number, b: number): string {
  for (const [name, v] of [['r', r], ['g', g], ['b', b]] as const) {
    if (!Number.isInteger(v) || v < 0 || v > 255) {
      throw new Error(`${name} must be an integer between 0 and 255, got ${v}`);
    }
  }
  const hex = (v: number): string => v.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** "#rrggbb" (or "#rgb") -> {r,g,b}. Pure. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$/.test(clean) && !/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Not a valid hex colour: "${hex}" (use #rrggbb)`);
  }
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** [r,g,b] -> {h 0–360, s 0–100, l 0–100}. Pure. */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
