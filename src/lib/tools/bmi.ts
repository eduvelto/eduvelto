// Eduvelto — BMI Calculator tool logic (slug: bmi-calculator).
//
// BMI = weight (kg) / height (m)^2. Categories: WHO (World Health
// Organization) BMI classification. Shared engine: ./bodyMetrics.
// All outputs are informational estimates, not medical advice.
//
// Height units (landing, 27 Nov 2026): the tool accepts height in
// cm, feet+inches, or metres, and converts to cm for the engine.
// Conversion rules:
//   - 1 inch = 2.54 cm exactly; 1 foot = 30.48 cm; 1 metre = 100 cm.
//   - cm -> ft/in rounds to the NEAREST WHOLE INCH (175 cm = 68.9 in
//     -> 69 in = 5 ft 9 in). The reverse (5 ft 9 in -> 175.26 cm) is
//     therefore NOT exactly 175 cm: BMI 22.79 vs 22.86, same category.
//     The conversion itself is exact (no rounding); only the
//     cm -> ft/in DISPLAY rounds, to whole inches.
//   - Inches must be 0–11; 12+ inches is invalid (use the next foot).
//   - Empty means "not entered yet" (heightCm null, invalid false);
//     non-numeric, zero, or negative input is invalid (invalid true),
//     matching the error path the page already showed for bad cm input.
export {
  calculateBmi,
  bmiCategory,
  weightForBmi,
  BMI_CATEGORY_LABELS,
  type BmiInput,
  type BmiResult,
  type BmiCategory,
} from './bodyMetrics';

/** Height units the BMI tool accepts. cm stays the default. */
export type HeightUnit = 'cm' | 'feet' | 'meter';

export const CM_PER_INCH = 2.54;
export const CM_PER_FOOT = 30.48;
export const CM_PER_METER = 100;

export interface FeetInches {
  feet: number;
  inches: number;
}

/**
 * cm -> whole feet + whole inches, rounded to the nearest inch.
 * Hand-check: 175 cm / 2.54 = 68.90 in -> 69 in = 5 ft 9 in;
 * 182.88 cm = 72 in exactly = 6 ft 0 in; 152.4 cm = 60 in = 5 ft 0 in.
 */
export function cmToFeetInches(heightCm: number): FeetInches {
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error(`heightCm must be a finite number > 0, got ${heightCm}`);
  }
  const totalInches = Math.round(heightCm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

/**
 * Feet + inches -> cm, exact (no rounding — the engine rounds BMI).
 * Hand-check: 5 ft 9 in = 69 in x 2.54 = 175.26 cm;
 * 6 ft 0 in = 72 x 2.54 = 182.88 cm.
 */
export function feetInchesToCm(feet: number, inches: number): number {
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
    throw new Error(`feet and inches must be finite numbers, got ${feet} ft ${inches} in`);
  }
  if (feet < 0 || inches < 0) {
    throw new Error(`feet and inches must be >= 0, got ${feet} ft ${inches} in`);
  }
  if (inches >= 12) {
    throw new Error(`inches must be below 12, got ${inches}`);
  }
  const totalInches = feet * 12 + inches;
  if (totalInches <= 0) {
    throw new Error('height must be greater than zero');
  }
  return totalInches * CM_PER_INCH;
}

/** Metres -> cm. Hand-check: 1.75 m = 175 cm exactly. */
export function meterToCm(heightM: number): number {
  if (!Number.isFinite(heightM) || heightM <= 0) {
    throw new Error(`heightM must be a finite number > 0, got ${heightM}`);
  }
  return heightM * CM_PER_METER;
}

export interface ParsedHeight {
  /** Height in cm, or null when nothing usable was entered. */
  heightCm: number | null;
  /** True when something was entered but it is not a usable height. */
  invalid: boolean;
}

/**
 * Parse the raw height field(s) for one unit into cm + an invalid flag.
 * `height` is the single field used by cm and meter mode; `feet` /
 * `inches` are the two fields used by feet mode (an empty side counts
 * as 0, so "9" in the inches box alone means 0 ft 9 in). Empty in all
 * fields means "not entered yet" (null, not invalid); non-numeric,
 * zero, negative, or >= 12 inches is invalid — the same error path
 * the page already showed for a bad cm value.
 */
export function parseHeightInput(
  unit: HeightUnit,
  height: string,
  feet: string,
  inches: string,
): ParsedHeight {
  if (unit === 'feet') {
    const feetEmpty = feet.trim() === '';
    const inchesEmpty = inches.trim() === '';
    if (feetEmpty && inchesEmpty) return { heightCm: null, invalid: false };
    const ft = feetEmpty ? 0 : Number(feet);
    const inch = inchesEmpty ? 0 : Number(inches);
    if (!Number.isFinite(ft) || !Number.isFinite(inch)) {
      return { heightCm: null, invalid: true };
    }
    if (ft < 0 || inch < 0 || inch >= 12) return { heightCm: null, invalid: true };
    const totalInches = ft * 12 + inch;
    if (totalInches <= 0) return { heightCm: null, invalid: true };
    return { heightCm: totalInches * CM_PER_INCH, invalid: false };
  }
  if (height.trim() === '') return { heightCm: null, invalid: false };
  const raw = Number(height);
  if (!Number.isFinite(raw) || raw <= 0) return { heightCm: null, invalid: true };
  return { heightCm: unit === 'meter' ? raw * CM_PER_METER : raw, invalid: false };
}

export type ExampleHeight =
  | { unit: 'cm'; height: string }
  | { unit: 'feet'; feet: string; inches: string }
  | { unit: 'meter'; height: string };

/**
 * The 70 kg example height per unit. The feet value is derived from
 * cmToFeetInches(175) — one source of truth, not a second literal:
 * 175 cm = 5 ft 9 in; meter mode shows 1.75 m.
 */
export function exampleHeightForUnit(unit: HeightUnit): ExampleHeight {
  if (unit === 'feet') {
    const { feet, inches } = cmToFeetInches(175);
    return { unit: 'feet', feet: String(feet), inches: String(inches) };
  }
  if (unit === 'meter') return { unit: 'meter', height: '1.75' };
  return { unit: 'cm', height: '175' };
}
