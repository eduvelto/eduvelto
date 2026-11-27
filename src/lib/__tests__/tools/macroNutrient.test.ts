// Macro Nutrient Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateMacros } from '../../tools/macroNutrient';

describe('calculateMacros', () => {
  it('2000 kcal maintain (30/40/30) -> protein 150 g, carbs 200 g, fat 66.7 g', () => {
    // Protein 600 kcal / 4 = 150; carbs 800 / 4 = 200; fat 600 / 9 = 66.7.
    expect(calculateMacros(2000, 'maintain')).toEqual({
      calories: 2000,
      proteinG: 150,
      carbsG: 200,
      fatG: 66.7,
      proteinKcal: 600,
      carbsKcal: 800,
      fatKcal: 600,
    });
  });

  it('2000 kcal lose (35/35/30) -> protein 175 g, carbs 175 g, fat 66.7 g', () => {
    expect(calculateMacros(2000, 'lose')).toEqual({
      calories: 2000,
      proteinG: 175,
      carbsG: 175,
      fatG: 66.7,
      proteinKcal: 700,
      carbsKcal: 700,
      fatKcal: 600,
    });
  });

  it('2000 kcal gain (25/45/30) -> protein 125 g, carbs 225 g, fat 66.7 g', () => {
    expect(calculateMacros(2000, 'gain')).toEqual({
      calories: 2000,
      proteinG: 125,
      carbsG: 225,
      fatG: 66.7,
      proteinKcal: 500,
      carbsKcal: 900,
      fatKcal: 600,
    });
  });

  it('rejects non-positive calories and unknown goals', () => {
    expect(() => calculateMacros(0, 'maintain')).toThrow(/tdeeKcal/);
    expect(() => calculateMacros(2000, 'bulk' as 'maintain')).toThrow(/goal/);
  });
});
