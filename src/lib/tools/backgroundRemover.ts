/**
 * Background Remover (SIMPLE version only) — pure logic.
 *
 * Canvas solid-colour removal, 100% in the browser, FREE. A pixel is
 * removed (alpha = 0) when its colour is within `tolerance` (Euclidean
 * distance in RGB space, 0–441.67) of the chosen background colour.
 *
 * The AI version (ONNX model ~40 MB) is a LATER batch — no model
 * dependency is added here, and nothing in this file loads one.
 *
 * Pure functions only: no network, no storage, no DOM. The canvas
 * read/write itself lives in the UI component; this file only decides
 * which pixels go transparent.
 */

/** Maximum possible RGB distance: sqrt(3 x 255^2) ≈ 441.67. */
export const MAX_COLOR_DISTANCE = Math.sqrt(3 * 255 * 255);

/** Hard file-size limit for uploads (10 MB). */
export const BACKGROUND_REMOVER_MAX_BYTES = 10 * 1024 * 1024;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a "#rrggbb" (or "#rgb") hex colour. Throws on anything else.
 * Hand-check: "#ffffff" -> {255,255,255}; "#0b7285" ->
 * {11,114,133}; "#fff" -> {255,255,255}.
 */
export function parseHexColor(hex: string): RgbColor {
  const clean = hex.trim().replace(/^#/, '');
  const expanded =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Expected a #rrggbb colour, got "${hex}"`);
  }
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/**
 * Euclidean distance between two RGB colours.
 * Hand-check: white (255,255,255) vs (250,250,250) ->
 * sqrt(3 x 25) = sqrt(75) ≈ 8.660; white vs black -> 441.673.
 */
export function colorDistance(a: RgbColor, b: RgbColor): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** True when the pixel colour is close enough to the target to remove. */
export function shouldRemovePixel(
  pixel: RgbColor,
  target: RgbColor,
  tolerance: number,
): boolean {
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error(`tolerance must be a number >= 0, got ${tolerance}`);
  }
  return colorDistance(pixel, target) <= tolerance;
}

/**
 * Map the 0–100 tolerance slider to an RGB distance (0–441.67).
 * Hand-check: 0 -> 0; 50 -> ~220.84; 100 -> ~441.67.
 */
export function toleranceSliderToDistance(slider: number): number {
  if (!Number.isFinite(slider) || slider < 0 || slider > 100) {
    throw new Error(`tolerance slider must be 0–100, got ${slider}`);
  }
  return (slider / 100) * MAX_COLOR_DISTANCE;
}

/**
 * Remove the background from raw RGBA pixel data: every pixel within
 * `tolerance` of `target` gets alpha 0, all other bytes are copied
 * unchanged. Returns a NEW array; the input is never mutated.
 * `data` must have length width * height * 4.
 *
 * Hand-check (target white, tolerance 10, 2x1 image):
 *   px0 (255,255,255,255) -> alpha 0 (distance 0);
 *   px1 (0,0,0,255) -> alpha 255 (distance 441.67).
 */
export function removeBackgroundPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  target: RgbColor,
  tolerance: number,
): Uint8ClampedArray {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`Image dimensions must be positive integers, got ${width}x${height}`);
  }
  if (data.length !== width * height * 4) {
    throw new Error(
      `Pixel data length ${data.length} does not match ${width}x${height}x4`,
    );
  }
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error(`tolerance must be a number >= 0, got ${tolerance}`);
  }
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < data.length; i += 4) {
    const pixel: RgbColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (colorDistance(pixel, target) <= tolerance) {
      out[i + 3] = 0;
    }
  }
  return out;
}

/**
 * Composite RGBA pixel data onto a solid background colour: every
 * pixel is alpha-blended over `bg` and the result is fully opaque.
 * Transparent pixels become exactly `bg`; opaque pixels are
 * unchanged. Returns a NEW array; the input is never mutated.
 * `data` must have length width * height * 4.
 *
 * This is what the "download with new background" buttons use: the
 * PNG keeps the solid background as real pixels, and the JPG is
 * flattened onto the same colour (JPEG has no alpha channel).
 *
 * Hand-check (bg white, 2x1 image):
 *   px0 (255,0,0,0)   -> (255,255,255,255) (fully transparent -> bg);
 *   px1 (255,0,0,128) -> (255,127,127,255) (half red over white).
 */
export function flattenOnBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bg: RgbColor,
): Uint8ClampedArray {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`Image dimensions must be positive integers, got ${width}x${height}`);
  }
  if (data.length !== width * height * 4) {
    throw new Error(
      `Pixel data length ${data.length} does not match ${width}x${height}x4`,
    );
  }
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    out[i] = Math.round(data[i] * a + bg.r * (1 - a));
    out[i + 1] = Math.round(data[i + 1] * a + bg.g * (1 - a));
    out[i + 2] = Math.round(data[i + 2] * a + bg.b * (1 - a));
    out[i + 3] = 255;
  }
  return out;
}

/**
 * Validate an uploaded file for this tool. Returns an error key
 * ('not-image' | 'too-large') or null when the file is acceptable.
 * The limit is 10 MB — larger images risk freezing a low-end phone.
 */
export function validateBackgroundImageFile(file: {
  type: string;
  size: number;
}): 'not-image' | 'too-large' | null {
  if (typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    return 'not-image';
  }
  if (file.size > BACKGROUND_REMOVER_MAX_BYTES) return 'too-large';
  if (file.size === 0) return 'not-image';
  return null;
}
