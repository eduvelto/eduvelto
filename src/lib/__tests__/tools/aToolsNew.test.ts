// Landed 27 Nov 2026 (A-tools): world clock formatting + profit-margin
// reverse modes + ONNX mask math + languages registry.
import { describe, expect, it } from 'vitest';
import { formatLiveClock, WORLD_CLOCK_PRESETS } from '../../tools/worldClock';
import { costForMargin, sellingPriceForMargin } from '../../tools/discountVatProfit';
import { applyMaskToImage, featherMask, fitWithin } from '../../tools/bgRemoverOnnx';
import { isRtl, isSupportedLang, languageDef, LIVE_LANGS, SUPPORTED_LANGS } from '../../../i18n/languages';

describe('formatLiveClock', () => {
  it('shows Dhaka at UTC+06:00 with no DST', () => {
    const now = new Date('2026-11-27T09:00:00Z');
    const r = formatLiveClock(now, 'Asia/Dhaka');
    expect(r.time).toBe('15:00:00');
    expect(r.offset).toBe('UTC+06:00');
    expect(r.isDaytime).toBe(true);
  });
  it('handles a DST zone (London in November is GMT)', () => {
    const now = new Date('2026-11-27T09:00:00Z');
    const r = formatLiveClock(now, 'Europe/London');
    expect(r.time).toBe('09:00:00');
    expect(r.offset).toBe('UTC+00:00');
  });
  it('lists Dhaka first in the presets', () => {
    expect(WORLD_CLOCK_PRESETS[0].zone).toBe('Asia/Dhaka');
    expect(WORLD_CLOCK_PRESETS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('profit margin reverse modes', () => {
  it('cost 800 + margin 20% -> selling 1000', () => {
    expect(sellingPriceForMargin(800, 20)).toBe(1000);
  });
  it('selling 1000 + margin 20% -> cost 800', () => {
    expect(costForMargin(1000, 20)).toBe(800);
  });
  it('rejects margin 100% (no finite price)', () => {
    expect(() => sellingPriceForMargin(800, 100)).toThrow(/0 and 100/);
    expect(() => costForMargin(1000, 100)).toThrow(/0 and 100/);
  });
});

describe('bgRemoverOnnx pure math', () => {
  it('fitWithin caps the long edge', () => {
    expect(fitWithin(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
  });
  it('applyMaskToImage thresholds the alpha channel', () => {
    const image = {
      data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]),
      width: 2,
      height: 1,
    };
    applyMaskToImage(image, new Uint8ClampedArray([255, 10]), 128, 0);
    expect(image.data[3]).toBe(255);
    expect(image.data[7]).toBe(0);
  });
  it('featherMask with radius 0 returns the same mask', () => {
    const mask = new Uint8ClampedArray([0, 255, 128, 64]);
    expect(featherMask(mask, 2, 2, 0)).toBe(mask);
  });
});

describe('languages registry (spec-09 architecture)', () => {
  it('lists 10 languages with bn+en live and the other 8 not ready', () => {
    expect(SUPPORTED_LANGS).toHaveLength(10);
    expect(LIVE_LANGS).toEqual(['bn', 'en']);
    expect(isSupportedLang('es')).toBe(true);
    expect(isSupportedLang('ko')).toBe(false);
  });
  it('marks Arabic RTL and the rest LTR', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('bn')).toBe(false);
    expect(languageDef('ja').locale).toBe('ja-JP');
  });
});
