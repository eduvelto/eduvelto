/**
 * Color Converter — HEX / RGB / HSL / CMYK. Pure functions, no DOM.
 * Values are rounded to whole numbers except HSL saturation/lightness
 * (one decimal) — the UI shows the exact formulas.
 */
export interface Rgb { r: number; g: number; b: number; }
export interface Hsl { h: number; s: number; l: number; }
export interface Cmyk { c: number; m: number; y: number; k: number; }
export interface ColorAll { hex: string; rgb: Rgb; hsl: Hsl; cmyk: Cmyk; }

export function parseHex(input: string): Rgb | null {
  const hex = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 1000) / 10 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h: Math.round(h), s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rn = 0;
  let gn = 0;
  let bn = 0;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];
  return { r: Math.round((rn + m) * 255), g: Math.round((gn + m) * 255), b: Math.round((bn + m) * 255) };
}

export function rgbToCmyk({ r, g, b }: Rgb): Cmyk {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const round = (v: number) => Math.round(v * 100);
  return {
    c: round((1 - rn - k) / (1 - k)),
    m: round((1 - gn - k) / (1 - k)),
    y: round((1 - bn - k) / (1 - k)),
    k: round(k),
  };
}

export function cmykToRgb({ c, m, y, k }: Cmyk): Rgb {
  return {
    r: Math.round(255 * (1 - c / 100) * (1 - k / 100)),
    g: Math.round(255 * (1 - m / 100) * (1 - k / 100)),
    b: Math.round(255 * (1 - y / 100) * (1 - k / 100)),
  };
}

export function parseColorInput(input: string): Rgb | null {
  const trimmed = input.trim();
  const hex = parseHex(trimmed);
  if (hex) return hex;
  const rgbMatch = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(trimmed);
  if (rgbMatch) {
    const [r, g, b] = [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    if ([r, g, b].every((v) => v >= 0 && v <= 255)) return { r, g, b };
    return null;
  }
  const hslMatch = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i.exec(trimmed);
  if (hslMatch) {
    const [h, s, l] = [Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3])];
    if (h <= 360 && s <= 100 && l <= 100) return hslToRgb({ h, s, l });
  }
  return null;
}

export function convertColor(input: string): ColorAll | null {
  const rgb = parseColorInput(input);
  if (!rgb) return null;
  return { hex: rgbToHex(rgb), rgb, hsl: rgbToHsl(rgb), cmyk: rgbToCmyk(rgb) };
}

export function rgbString(rgb: Rgb): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
export function hslString(hsl: Hsl): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
export function cmykString(cmyk: Cmyk): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}
