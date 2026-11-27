// for the healthy range (BMI 18.5-24.9). All outputs are informational estimates,
// not medical advice — the UI must carry that disclaimer (same as BmiTool).

export interface IdealWeightInput {
  heightCm: number;
  sex: 'male' | 'female';
  currentWeightKg?: number;
}

export interface IdealWeightResult {
  /** Healthy range from BMI 18.5-24.9 for this height. */
  healthyRangeKg: { min: number; max: number };
  devineKg: number;
  robinsonKg: number;
  millerKg: number;
  hamwiKg: number;
  /** kg to lose (negative = gain) to reach BMI 25; null when no current weight. */
  toBmi25Kg: number | null;
  /** kg to lose/gain to reach BMI 22 (mid-healthy); null when no current weight. */
  toBmi22Kg: number | null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Ideal weight formulas. All take height in inches over 5 feet.
 * Devine (1974), Robinson (1983), Miller (1983), Hamwi (1964) — commonly
 * quoted clinical estimates. Present them as estimates, not prescriptions.
 * Hand-checks: male 175 cm (68.90 in, 8.90 over 5 ft) -> Devine 70.5 kg;
 * female 175 cm -> Devine 66.0 kg.
 */
export function idealWeight(input: IdealWeightInput): IdealWeightResult {
  const { heightCm, sex } = input;
  if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
    throw new Error(`Height must be between 1 and 300 cm, got ${heightCm}`);
  }
  const heightM = heightCm / 100;
  const healthyRangeKg = {
    min: round1(18.5 * heightM * heightM),
    max: round1(24.9 * heightM * heightM),
  };
  const inchesOver5Ft = heightCm / 2.54 - 60;
  const base = sex === 'male' ? 50 : 45.5;
  const devineKg = round1(base + 2.3 * inchesOver5Ft);
  const robinsonKg = round1(base + (sex === 'male' ? 1.7 : 1.6) * inchesOver5Ft);
  const millerKg = round1(sex === 'male' ? 56.2 + 1.41 * inchesOver5Ft : 53.1 + 1.36 * inchesOver5Ft);
  const hamwiKg = round1(sex === 'male' ? 48 + 2.7 * inchesOver5Ft : 45.5 + 2.2 * inchesOver5Ft);
  const toBmi = (targetBmi: number): number | null => {
    if (input.currentWeightKg === undefined || input.currentWeightKg === null) return null;
    if (!Number.isFinite(input.currentWeightKg) || input.currentWeightKg <= 0) {
      throw new Error(`Current weight must be more than 0, got ${input.currentWeightKg}`);
    }
    return round1(input.currentWeightKg - targetBmi * heightM * heightM);
  };
  return {
    healthyRangeKg,
    devineKg,
    robinsonKg,
    millerKg,
    hamwiKg,
    toBmi25Kg: toBmi(25),
    toBmi22Kg: toBmi(22),
  };
}

/** Asian cut-off note (WHO notes lower thresholds in Asian populations). */
export const ASIAN_BMI_NOTE_BN =
  'এশীয় জনগোষ্ঠীর জন্য WHO কম সীমা উল্লেখ করে — অতিরিক্ত ওজন BMI ২৩ থেকে, স্থূলতা BMI ২৭.৫ থেকে।';
export const ASIAN_BMI_NOTE_EN =
  'WHO notes lower thresholds for Asian populations — overweight from BMI 23, obese from 27.5.';
