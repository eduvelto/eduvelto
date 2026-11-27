import { describe, it, expect } from 'vitest';
import { buildGradientCss, buildBoxShadowCss, GRADIENT_PRESETS } from '../../tools/gradientGenerator';

describe('gradientGenerator', () => {
  it('builds a linear gradient', () => {
    expect(buildGradientCss({ angle: 135, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }))
      .toBe('background: linear-gradient(135deg, #ff0000 0%, #0000ff 100%);');
  });
  it('builds a radial gradient and a box shadow', () => {
    expect(buildGradientCss({ type: 'radial', stops: [{ color: '#fff', position: 0 }] })).toContain('radial-gradient');
    expect(buildBoxShadowCss({ x: 0, y: 4, blur: 12, spread: 0, color: '#00000033' })).toBe('box-shadow: 0px 4px 12px 0px #00000033;');
  });
  it('ships presets', () => {
    expect(GRADIENT_PRESETS.length).toBeGreaterThan(3);
  });
});
