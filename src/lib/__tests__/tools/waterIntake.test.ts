// Water Intake Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateWaterIntake } from '../../tools/waterIntake';

describe('calculateWaterIntake', () => {
  it('70 kg, no exercise, not hot -> 2450 ml (range 2100-2800), 10 glasses', () => {
    // 35 x 70 = 2450; 30 x 70 = 2100; 40 x 70 = 2800; 2450 / 250 = 9.8 -> 10.
    expect(calculateWaterIntake({ weightKg: 70 })).toEqual({
      recommendedMl: 2450,
      recommendedLitres: 2.5,
      lowMl: 2100,
      highMl: 2800,
      glasses: 10,
    });
  });

  it('70 kg + 30 min exercise + hot day -> 2450 + 360 + 500 = 3310 ml', () => {
    expect(calculateWaterIntake({ weightKg: 70, exerciseMinutes: 30, hotClimate: true }).recommendedMl).toBe(3310);
  });

  it('rejects zero weight and negative exercise', () => {
    expect(() => calculateWaterIntake({ weightKg: 0 })).toThrow(/weightKg/);
    expect(() => calculateWaterIntake({ weightKg: 70, exerciseMinutes: -10 })).toThrow(/exerciseMinutes/);
  });
});
