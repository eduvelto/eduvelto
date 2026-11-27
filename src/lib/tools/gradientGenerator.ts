/**
 * CSS Gradient Generator (+ box shadow) — pure functions.
 * Builds the CSS text from the user's colours; the UI previews it live.
 */
export interface GradientStop { color: string; position: number; }
export interface GradientOptions {
  type?: 'linear' | 'radial';
  angle?: number;
  stops: GradientStop[];
}
export interface GradientPreset { nameBn: string; nameEn: string; angle: number; stops: GradientStop[]; }

export const GRADIENT_PRESETS: GradientPreset[] = [
  { nameBn: 'বন সবুজ', nameEn: 'Forest', angle: 135, stops: [{ color: '#14532d', position: 0 }, { color: '#0d9488', position: 100 }] },
  { nameBn: 'সূর্যাস্ত', nameEn: 'Sunset', angle: 135, stops: [{ color: '#f59e0b', position: 0 }, { color: '#ef4444', position: 100 }] },
  { nameBn: 'সমুদ্র', nameEn: 'Ocean', angle: 135, stops: [{ color: '#0ea5e9', position: 0 }, { color: '#6366f1', position: 100 }] },
  { nameBn: 'গোলাপি', nameEn: 'Rose', angle: 135, stops: [{ color: '#f472b6', position: 0 }, { color: '#a855f7', position: 100 }] },
  { nameBn: 'সোনালি', nameEn: 'Amber', angle: 90, stops: [{ color: '#fde68a', position: 0 }, { color: '#f59e0b', position: 50 }, { color: '#b45309', position: 100 }] },
  { nameBn: 'মেঘ', nameEn: 'Cloud', angle: 180, stops: [{ color: '#f8fafc', position: 0 }, { color: '#cbd5e1', position: 100 }] },
];

export function buildGradientCss(options: GradientOptions): string {
  const stops = options.stops
    .map((s) => `${s.color} ${Math.max(0, Math.min(100, s.position))}%`)
    .join(', ');
  if (options.type === 'radial') return `background: radial-gradient(circle, ${stops});`;
  return `background: linear-gradient(${options.angle ?? 135}deg, ${stops});`;
}

export interface BoxShadowOptions { x: number; y: number; blur: number; spread: number; color: string; }

export function buildBoxShadowCss(o: BoxShadowOptions): string {
  return `box-shadow: ${o.x}px ${o.y}px ${o.blur}px ${o.spread}px ${o.color};`;
}
