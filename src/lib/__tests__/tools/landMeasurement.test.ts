// Land Measurement (Tool #97) — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { convertLandArea, plotAreaFromDimensions } from '../../tools/landMeasurement';

describe('convertLandArea', () => {
  it('1 acre = 100 decimal', () => {
    expect(convertLandArea(1, 'acre', 'decimal')).toBe(100);
  });

  it('1 bigha = 20 katha = 33 decimal', () => {
    expect(convertLandArea(1, 'bigha', 'katha')).toBe(20);
    expect(convertLandArea(1, 'bigha', 'decimal')).toBe(33);
  });

  it('1 katha = 1.65 decimal', () => {
    expect(convertLandArea(1, 'katha', 'decimal')).toBe(1.65);
  });

  it('1 hectare = 2.471 acre', () => {
    expect(convertLandArea(1, 'hectare', 'acre')).toBeCloseTo(2.471, 6);
  });

  it('1 decimal = 435.6 sq ft', () => {
    expect(convertLandArea(1, 'decimal', 'sqft')).toBe(435.6);
  });

  it('1 sq m = 10.7639 sq ft', () => {
    expect(convertLandArea(1, 'sqm', 'sqft')).toBe(10.7639);
  });

  it('converts both ways consistently: 2 bigha = 66 decimal, 66 decimal = 2 bigha', () => {
    expect(convertLandArea(2, 'bigha', 'decimal')).toBe(66);
    expect(convertLandArea(66, 'decimal', 'bigha')).toBe(2);
  });

  it('1 acre = 100/33 = 3.0303 bigha (note: the rounded textbook 3.025 differs, see module docs)', () => {
    expect(convertLandArea(1, 'acre', 'bigha')).toBeCloseTo(3.0303, 4);
  });

  it('same-unit conversion returns the value unchanged', () => {
    expect(convertLandArea(7.5, 'katha', 'katha')).toBe(7.5);
  });

  it('rejects negative areas and unknown units', () => {
    expect(() => convertLandArea(-1, 'acre', 'decimal')).toThrow(/>= 0/);
    expect(() => convertLandArea(1, 'marla' as 'acre', 'decimal')).toThrow(/fromUnit/);
    expect(() => convertLandArea(1, 'acre', 'marla' as 'decimal')).toThrow(/toUnit/);
  });
});

describe('plotAreaFromDimensions', () => {
  it('66 ft x 33 ft = 2178 sq ft = 5 decimal exactly', () => {
    // 66 x 33 = 2178; 2178 / 435.6 = 5 decimal; 5 / 1.65 = 3.0303 katha;
    // 5 / 33 = 0.1515 bigha; 5 / 100 = 0.05 acre; 2178 / 10.7639 = 202.343 sq m.
    const area = plotAreaFromDimensions(66, 33);
    expect(area.sqft).toBe(2178);
    expect(area.decimal).toBe(5);
    expect(area.katha).toBeCloseTo(3.0303, 4);
    expect(area.bigha).toBeCloseTo(0.1515, 4);
    expect(area.acre).toBe(0.05);
    expect(area.sqm).toBeCloseTo(202.343, 3);
  });

  it('1 acre plot: 208.71 ft x 208.71 ft is ~43560 sq ft', () => {
    const area = plotAreaFromDimensions(208.71, 208.71);
    expect(area.sqft).toBeCloseTo(43560, 0);
    expect(area.acre).toBeCloseTo(1, 2);
    expect(area.decimal).toBeCloseTo(100, 2);
  });

  it('rejects negative dimensions', () => {
    expect(() => plotAreaFromDimensions(-10, 33)).toThrow(/>= 0/);
  });
});
