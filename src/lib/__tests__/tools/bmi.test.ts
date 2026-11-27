// BMI Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import {
  calculateBmi,
  weightForBmi,
  cmToFeetInches,
  feetInchesToCm,
  meterToCm,
  parseHeightInput,
  exampleHeightForUnit,
} from '../../tools/bmi';

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

describe('height unit conversion (1 in = 2.54 cm, 1 ft = 30.48 cm, 1 m = 100 cm)', () => {
  it('feet+inches -> cm: 5 ft 9 in = 175.26 cm, 6 ft 0 in = 182.88 cm', () => {
    // 69 x 2.54 = 175.26; 72 x 2.54 = 182.88.
    expect(feetInchesToCm(5, 9)).toBeCloseTo(175.26, 10);
    expect(feetInchesToCm(6, 0)).toBeCloseTo(182.88, 10);
    expect(feetInchesToCm(0, 9)).toBeCloseTo(22.86, 10);
  });

  it('metre -> cm: 1.75 m = 175 cm exactly', () => {
    expect(meterToCm(1.75)).toBe(175);
    expect(meterToCm(1.8)).toBe(180);
  });

  it('cm identity through the parse path: 175 cm stays 175 cm', () => {
    expect(parseHeightInput('cm', '175', '', '')).toEqual({ heightCm: 175, invalid: false });
    expect(parseHeightInput('meter', '1.75', '', '')).toEqual({ heightCm: 175, invalid: false });
  });

  it('cm -> ft/in rounds to the nearest inch: 175 cm = 5 ft 9 in', () => {
    // 175 / 2.54 = 68.90 in -> 69 in = 5 ft 9 in.
    expect(cmToFeetInches(175)).toEqual({ feet: 5, inches: 9 });
    expect(cmToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 });
    expect(cmToFeetInches(152.4)).toEqual({ feet: 5, inches: 0 });
    // 170 / 2.54 = 66.93 in -> 67 in = 5 ft 7 in.
    expect(cmToFeetInches(170)).toEqual({ feet: 5, inches: 7 });
  });

  it('example height per unit: 175 cm = 5 ft 9 in = 1.75 m', () => {
    expect(exampleHeightForUnit('cm')).toEqual({ unit: 'cm', height: '175' });
    expect(exampleHeightForUnit('feet')).toEqual({ unit: 'feet', feet: '5', inches: '9' });
    expect(exampleHeightForUnit('meter')).toEqual({ unit: 'meter', height: '1.75' });
  });

  it('same physical height gives the same BMI across units (within rounding)', () => {
    // Meter mode is exact: 1.75 m = 175 cm -> identical BMI 22.86.
    expect(calculateBmi({ weightKg: 70, heightCm: meterToCm(1.75) }).bmi).toBe(22.86);
    // Feet mode rounds to the nearest inch: 5 ft 9 in = 175.26 cm,
    // BMI 70 / 1.7526^2 = 22.79 — 0.07 below the cm value, same category.
    const viaFeet = calculateBmi({ weightKg: 70, heightCm: feetInchesToCm(5, 9) });
    expect(viaFeet.bmi).toBe(22.79);
    expect(viaFeet.category).toBe('normal');
    expect(Math.abs(viaFeet.bmi - 22.86)).toBeLessThanOrEqual(0.1);
    // Reverse mode agrees too: 67.4 kg (cm) vs 67.6 kg (ft/in).
    expect(weightForBmi(22, feetInchesToCm(5, 9))).toBe(67.6);
  });

  it('rejects bad conversion inputs', () => {
    expect(() => feetInchesToCm(0, 0)).toThrow(/greater than zero/);
    expect(() => feetInchesToCm(-1, 0)).toThrow(/>= 0/);
    expect(() => feetInchesToCm(5, -1)).toThrow(/>= 0/);
    expect(() => feetInchesToCm(5, 12)).toThrow(/below 12/);
    expect(() => feetInchesToCm(Number.NaN, 9)).toThrow(/finite/);
    expect(() => meterToCm(0)).toThrow(/> 0/);
    expect(() => meterToCm(-1.75)).toThrow(/> 0/);
    expect(() => cmToFeetInches(0)).toThrow(/> 0/);
    expect(() => cmToFeetInches(-175)).toThrow(/> 0/);
  });
});

describe('parseHeightInput — empty / non-numeric / zero / negative take the error path', () => {
  it('empty means "not entered yet": null height, not invalid', () => {
    expect(parseHeightInput('cm', '', '', '')).toEqual({ heightCm: null, invalid: false });
    expect(parseHeightInput('meter', '', '', '')).toEqual({ heightCm: null, invalid: false });
    expect(parseHeightInput('feet', '', '', '')).toEqual({ heightCm: null, invalid: false });
  });

  it('non-numeric input is invalid in every unit', () => {
    expect(parseHeightInput('cm', 'abc', '', '')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('meter', 'abc', '', '')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('feet', '', 'abc', '9')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('feet', '', '5', 'xyz')).toEqual({ heightCm: null, invalid: true });
  });

  it('zero or negative height is invalid in every unit', () => {
    expect(parseHeightInput('cm', '0', '', '')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('cm', '-175', '', '')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('meter', '0', '', '')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('meter', '-1.75', '', '')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('feet', '', '0', '0')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('feet', '', '-5', '9')).toEqual({ heightCm: null, invalid: true });
    expect(parseHeightInput('feet', '', '5', '-9')).toEqual({ heightCm: null, invalid: true });
  });

  it('12+ inches is invalid — use the next foot', () => {
    expect(parseHeightInput('feet', '', '5', '12')).toEqual({ heightCm: null, invalid: true });
  });

  it('an empty side counts as 0 in feet mode', () => {
    // 0 ft 9 in = 22.86 cm; 5 ft 0 in = 152.4 cm.
    expect(parseHeightInput('feet', '', '', '9')).toEqual({ heightCm: 22.86, invalid: false });
    expect(parseHeightInput('feet', '', '5', '')).toEqual({ heightCm: 152.4, invalid: false });
    expect(parseHeightInput('feet', '', '5', '9')).toEqual({ heightCm: 175.26, invalid: false });
  });
});
