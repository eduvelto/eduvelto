import { describe, it, expect } from 'vitest';
import { convertColor, rgbToHex, hslToRgb, rgbToCmyk } from '../../tools/colorConverter';

describe('colorConverter', () => {
  it('converts a hex colour to all formats', () => {
    const c = convertColor('#0d9488');
    expect(c?.rgb).toEqual({ r: 13, g: 148, b: 136 });
    expect(c?.hex).toBe('#0d9488');
    expect(c?.hsl.h).toBe(175);
  });
  it('parses rgb() input', () => {
    expect(convertColor('rgb(255, 0, 0)')?.hex).toBe('#ff0000');
  });
  it('returns null for bad input', () => {
    expect(convertColor('not-a-color')).toBeNull();
  });
  it('round-trips hsl and cmyk', () => {
    expect(rgbToHex(hslToRgb({ h: 0, s: 100, l: 50 }))).toBe('#ff0000');
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });
});
