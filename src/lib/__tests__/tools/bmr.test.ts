// BMR Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateBmr } from '../../tools/bmr';

describe('calculateBmr', () => {
  it('man, 70 kg, 175 cm, 30 y -> 1649 kcal/day (Mifflin-St Jeor)', () => {
    // 10x70 + 6.25x175 - 5x30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 -> 1649.
    expect(calculateBmr({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 30 })).toBe(1649);
  });

  it('woman, 60 kg, 165 cm, 30 y -> 1320 kcal/day', () => {
    // 10x60 + 6.25x165 - 5x30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320.
    expect(calculateBmr({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 30 })).toBe(1320);
  });

  it('rejects invalid sex and non-positive inputs', () => {
    expect(() =>
      calculateBmr({ sex: 'other' as 'male', weightKg: 70, heightCm: 175, ageYears: 30 }),
    ).toThrow(/sex/);
    expect(() =>
      calculateBmr({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 0 }),
    ).toThrow(/ageYears/);
  });
});
