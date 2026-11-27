// Body Fat Calculator — unit tests. Every expected value is hand-computed
// from the U.S. Navy formula (centimetres, log10).
import { describe, it, expect } from 'vitest';
import { calculateBodyFat, calculateBodyFatWithWeight } from '../../tools/bodyFat';

describe('calculateBodyFat', () => {
  it('man 175/38/85 cm -> 16.9% (fitness)', () => {
    // 495 / (1.0324 - 0.19077*log10(47) + 0.15456*log10(175)) - 450 = 16.9.
    expect(calculateBodyFat({ sex: 'male', heightCm: 175, neckCm: 38, waistCm: 85 })).toEqual({
      bodyFatPercent: 16.9,
      category: 'fitness',
      fatMassKg: null,
      leanMassKg: null,
    });
  });

  it('woman 165/33/75/100 cm -> 29.4% (average)', () => {
    // 495 / (1.29579 - 0.35004*log10(142) + 0.221*log10(165)) - 450 = 29.4.
    expect(
      calculateBodyFat({ sex: 'female', heightCm: 165, neckCm: 33, waistCm: 75, hipCm: 100 }),
    ).toEqual({
      bodyFatPercent: 29.4,
      category: 'average',
      fatMassKg: null,
      leanMassKg: null,
    });
  });

  it('with weight 70 kg, man 16.9% -> fat 11.8 kg, lean 58.2 kg', () => {
    // 70 x 16.9 / 100 = 11.83 -> 11.8; 70 - 11.8 = 58.2.
    expect(
      calculateBodyFatWithWeight({ sex: 'male', heightCm: 175, neckCm: 38, waistCm: 85, weightKg: 70 }),
    ).toEqual({
      bodyFatPercent: 16.9,
      category: 'fitness',
      fatMassKg: 11.8,
      leanMassKg: 58.2,
    });
  });

  it('rejects waist <= neck for men and missing hip for women', () => {
    expect(() =>
      calculateBodyFat({ sex: 'male', heightCm: 175, neckCm: 40, waistCm: 38 }),
    ).toThrow(/waistCm/);
    expect(() =>
      calculateBodyFat({ sex: 'female', heightCm: 165, neckCm: 33, waistCm: 75 }),
    ).toThrow(/hipCm/);
  });
});
