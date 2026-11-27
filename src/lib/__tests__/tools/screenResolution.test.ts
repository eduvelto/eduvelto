import { describe, it, expect } from 'vitest';
import { screenSummary, isCommonResolution, type ScreenInfo } from '../../tools/screenResolution';

describe('screenResolution', () => {
  const info: ScreenInfo = { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1, orientation: 'landscape-primary' };
  it('summarises the resolution', () => {
    expect(screenSummary(info)).toBe('1920 × 1080');
    expect(isCommonResolution(info)).toBe(true);
    expect(isCommonResolution({ ...info, width: 1234, height: 567 })).toBe(false);
  });
});
