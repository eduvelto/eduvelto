// Daily Walking-Goal Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import {
  calculateWalking,
  estimateStrideCm,
  goalTable,
  parseWalkingField,
  GOAL_STEPS,
} from '../../tools/walkingGoal';

const DEFAULTS = { strideCm: 76, weightKg: 60, speedKmh: 5 };

describe('calculateWalking — the spec examples', () => {
  it('10,000 steps × 0.76 m stride -> 7.6 km', () => {
    // 10,000 × 0.76 / 1000 = 7.6.
    expect(calculateWalking({ steps: 10000, ...DEFAULTS }).distanceKm).toBe(7.6);
  });

  it('10,000 steps, 60 kg -> calories ≈ 7.6 × 60 × 0.53 = 241.68 kcal', () => {
    expect(calculateWalking({ steps: 10000, ...DEFAULTS }).caloriesKcal).toBe(241.68);
  });

  it('7.6 km at 5 km/h -> 1 h 31 min (91.2 min)', () => {
    // 7.6 / 5 = 1.52 h = 91.2 min -> rounds to 91 min = 1 h 31 min.
    const result = calculateWalking({ steps: 10000, ...DEFAULTS });
    expect(result.timeMinutes).toBeCloseTo(91.2, 10);
    expect(result.timeHours).toBe(1);
    expect(result.timeRemainingMinutes).toBe(31);
  });
});

describe('estimateStrideCm — stride ≈ height × 0.414', () => {
  it('height 170 cm -> stride ≈ 70.38 cm', () => {
    // 170 × 0.414 = 70.38.
    expect(estimateStrideCm(170)).toBe(70.38);
  });

  it('height 180 cm -> stride ≈ 74.52 cm', () => {
    // 180 × 0.414 = 74.52.
    expect(estimateStrideCm(180)).toBe(74.52);
  });

  it('rejects zero, negative or non-finite height', () => {
    expect(() => estimateStrideCm(0)).toThrow(/heightCm/);
    expect(() => estimateStrideCm(-170)).toThrow(/heightCm/);
    expect(() => estimateStrideCm(Number.NaN)).toThrow(/heightCm/);
  });
});

describe('calculateWalking — edge cases', () => {
  it('steps 0 -> all zero', () => {
    expect(calculateWalking({ steps: 0, ...DEFAULTS })).toEqual({
      steps: 0,
      distanceKm: 0,
      caloriesKcal: 0,
      timeMinutes: 0,
      timeHours: 0,
      timeRemainingMinutes: 0,
    });
  });

  it('negative steps rejected', () => {
    expect(() => calculateWalking({ steps: -1, ...DEFAULTS })).toThrow(/steps/);
  });

  it('zero or negative stride, weight or speed rejected', () => {
    expect(() => calculateWalking({ steps: 1000, strideCm: 0, weightKg: 60, speedKmh: 5 })).toThrow(/strideCm/);
    expect(() => calculateWalking({ steps: 1000, strideCm: -76, weightKg: 60, speedKmh: 5 })).toThrow(/strideCm/);
    expect(() => calculateWalking({ steps: 1000, strideCm: 76, weightKg: 0, speedKmh: 5 })).toThrow(/weightKg/);
    expect(() => calculateWalking({ steps: 1000, strideCm: 76, weightKg: 60, speedKmh: 0 })).toThrow(/speedKmh/);
    expect(() => calculateWalking({ steps: 1000, strideCm: 76, weightKg: 60, speedKmh: -5 })).toThrow(/speedKmh/);
  });

  it('non-finite inputs rejected', () => {
    expect(() => calculateWalking({ steps: Number.NaN, ...DEFAULTS })).toThrow(/steps/);
    expect(() => calculateWalking({ steps: 1000, strideCm: Number.NaN, weightKg: 60, speedKmh: 5 })).toThrow(/strideCm/);
  });

  it('5,000 steps -> half the 10,000-step result', () => {
    // 5,000 × 0.76 / 1000 = 3.8 km; 3.8 × 60 × 0.53 = 120.84 kcal;
    // 3.8 / 5 = 0.76 h = 45.6 min -> 46 min.
    const result = calculateWalking({ steps: 5000, ...DEFAULTS });
    expect(result.distanceKm).toBe(3.8);
    expect(result.caloriesKcal).toBe(120.84);
    expect(result.timeHours).toBe(0);
    expect(result.timeRemainingMinutes).toBe(46);
  });
});

describe('goalTable — 5,000 / 7,500 / 10,000 / 12,500 steps', () => {
  it('covers exactly the four goal step counts', () => {
    expect(GOAL_STEPS).toEqual([5000, 7500, 10000, 12500]);
    expect(goalTable(DEFAULTS).map((row) => row.steps)).toEqual([5000, 7500, 10000, 12500]);
  });

  it('7,500 steps -> 5.7 km, 181.26 kcal; 12,500 steps -> 9.5 km, 302.1 kcal', () => {
    // 7,500 × 0.76 / 1000 = 5.7 km; 5.7 × 60 × 0.53 = 181.26 kcal.
    // 12,500 × 0.76 / 1000 = 9.5 km; 9.5 × 60 × 0.53 = 302.1 kcal.
    const rows = goalTable(DEFAULTS);
    expect(rows[1].distanceKm).toBe(5.7);
    expect(rows[1].caloriesKcal).toBe(181.26);
    expect(rows[3].distanceKm).toBe(9.5);
    expect(rows[3].caloriesKcal).toBe(302.1);
  });
});

describe('parseWalkingField — raw text input parsing', () => {
  it('empty or non-numeric input returns null', () => {
    expect(parseWalkingField('', false)).toBeNull();
    expect(parseWalkingField('   ', false)).toBeNull();
    expect(parseWalkingField('abc', false)).toBeNull();
  });

  it('zero is allowed only when allowZero is true', () => {
    expect(parseWalkingField('0', true)).toBe(0);
    expect(parseWalkingField('0', false)).toBeNull();
  });

  it('negative input always returns null', () => {
    expect(parseWalkingField('-5', true)).toBeNull();
    expect(parseWalkingField('-5', false)).toBeNull();
  });

  it('valid numbers parse through', () => {
    expect(parseWalkingField('10000', true)).toBe(10000);
    expect(parseWalkingField('76', false)).toBe(76);
    expect(parseWalkingField('5.5', false)).toBe(5.5);
  });
});
