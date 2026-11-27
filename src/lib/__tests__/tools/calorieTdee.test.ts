// Calorie & TDEE Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateTdee } from '../../tools/calorieTdee';

describe('calculateTdee', () => {
  it('man 70/175/30, moderate activity -> BMR 1649, TDEE 2556', () => {
    // BMR 1649 (see bmr.test.ts); 1649 x 1.55 = 2555.95 -> 2556.
    expect(
      calculateTdee({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 30, activity: 'moderate' }),
    ).toEqual({ bmr: 1649, activityFactor: 1.55, tdee: 2556 });
  });

  it('same man, sedentary -> TDEE 1979', () => {
    // 1649 x 1.2 = 1978.8 -> 1979.
    expect(
      calculateTdee({ sex: 'male', weightKg: 70, heightCm: 175, ageYears: 30, activity: 'sedentary' }),
    ).toEqual({ bmr: 1649, activityFactor: 1.2, tdee: 1979 });
  });

  it('rejects an unknown activity level', () => {
    expect(() =>
      calculateTdee({
        sex: 'male', weightKg: 70, heightCm: 175, ageYears: 30, activity: 'extreme' as 'moderate',
      }),
    ).toThrow(/activity/);
  });
});
