// BMI Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateBmi, weightForBmi } from '../../tools/bmi';

describe('calculateBmi', () => {
  it('70 kg, 175 cm -> BMI 22.86, normal, healthy 56.7-76.3 kg', () => {
    // 70 / 1.75^2 = 22.857 -> 22.86; 18.5 x 3.0625 = 56.7; 24.9 x 3.0625 = 76.3.
    expect(calculateBmi({ weightKg: 70, heightCm: 175 })).toEqual({
      bmi: 22.86,
      category: 'normal',
      healthyWeightMinKg: 56.7,
      healthyWeightMaxKg: 76.3,
    });
  });

  it('classifies WHO boundaries: 18.4 underweight, 25 overweight, 30 obese', () => {
    // 50 kg at 165 cm -> 50 / 2.7225 = 18.37 underweight.
    expect(calculateBmi({ weightKg: 50, heightCm: 165 }).category).toBe('underweight');
    // 80 kg at 175 cm -> 26.12 overweight.
    expect(calculateBmi({ weightKg: 80, heightCm: 175 }).category).toBe('overweight');
    // 95 kg at 175 cm -> 31.02 obese.
    expect(calculateBmi({ weightKg: 95, heightCm: 175 }).category).toBe('obese');
  });

  it('reverse: weight for BMI 22 at 175 cm is 67.4 kg', () => {
    // 22 x 1.75^2 = 67.375 -> 67.4.
    expect(weightForBmi(22, 175)).toBe(67.4);
  });

  it('rejects zero or negative inputs', () => {
    expect(() => calculateBmi({ weightKg: 0, heightCm: 175 })).toThrow(/weightKg/);
    expect(() => calculateBmi({ weightKg: 70, heightCm: -5 })).toThrow(/heightCm/);
  });
});
