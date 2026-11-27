/**
 * Eduvelto — shared body-metrics engine (Health tools, Batch 3).
 *
 * ONE chain, written once and reused by the BMR, TDEE and Macro tools:
 *   BMR (Mifflin-St Jeor, 1990) -> TDEE (BMR x activity factor)
 *   -> Macro split (protein / carbs / fat from TDEE).
 * The TDEE page shows the BMR intermediate value from this engine.
 *
 * Also in this file, so no formula is ever written twice: BMI
 * (WHO ranges), body fat (U.S. Navy method), heart-rate zones
 * (Karvonen), pace / speed conversions, and daily water intake.
 *
 * Sources are named on every tool page that uses them. All outputs
 * are informational estimates, not medical advice.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { bn: string; en: string }> = {
  sedentary: { bn: 'বসে থাকা (খুব কম ব্যায়াম)', en: 'Sedentary (little or no exercise)' },
  light: { bn: 'হালকা (সপ্তাহে ১–৩ দিন)', en: 'Light (1–3 days/week)' },
  moderate: { bn: 'মাঝারি (সপ্তাহে ৩–৫ দিন)', en: 'Moderate (3–5 days/week)' },
  active: { bn: 'সক্রিয় (সপ্তাহে ৬–৭ দিন)', en: 'Active (6–7 days/week)' },
  veryActive: { bn: 'খুব সক্রিয় (কঠোর ব্যায়াম / শারীরিক কাজ)', en: 'Very active (hard exercise / physical job)' },
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function requirePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number > 0, got ${value}`);
  }
}

function requireNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite number >= 0, got ${value}`);
  }
}

// ---------------------------------------------------------------------------
// BMI — weight (kg) / height (m)^2. Categories: WHO (World Health
// Organization) BMI classification.
// ---------------------------------------------------------------------------

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const BMI_CATEGORY_LABELS: Record<BmiCategory, { bn: string; en: string }> = {
  underweight: { bn: 'কম ওজন (১৮.৫-এর নিচে)', en: 'Underweight (below 18.5)' },
  normal: { bn: 'স্বাভাবিক (১৮.৫–২৪.৯)', en: 'Normal (18.5–24.9)' },
  overweight: { bn: 'বেশি ওজন (২৫–২৯.৯)', en: 'Overweight (25–29.9)' },
  obese: { bn: 'স্থূলতা (৩০ বা বেশি)', en: 'Obese (30 or above)' },
};

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export interface BmiInput {
  weightKg: number;
  heightCm: number;
}

export interface BmiResult {
  bmi: number;
  category: BmiCategory;
  /** Healthy weight range (WHO 18.5–24.9) for this height, in kg. */
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
}

/**
 * Hand-check: 70 kg, 175 cm -> 70 / 1.75^2 = 22.86 (normal);
 * healthy range 18.5 x 3.0625 = 56.7 kg to 24.9 x 3.0625 = 76.3 kg.
 */
export function calculateBmi(input: BmiInput): BmiResult {
  requirePositive(input.weightKg, 'weightKg');
  requirePositive(input.heightCm, 'heightCm');
  const heightM = input.heightCm / 100;
  const bmi = round2(input.weightKg / (heightM * heightM));
  return {
    bmi,
    category: bmiCategory(bmi),
    healthyWeightMinKg: round1(18.5 * heightM * heightM),
    healthyWeightMaxKg: round1(24.9 * heightM * heightM),
  };
}

/** Reverse mode: what weight gives a target BMI at this height? */
export function weightForBmi(targetBmi: number, heightCm: number): number {
  requirePositive(targetBmi, 'targetBmi');
  requirePositive(heightCm, 'heightCm');
  const heightM = heightCm / 100;
  return round1(targetBmi * heightM * heightM);
}

// ---------------------------------------------------------------------------
// BMR — Mifflin-St Jeor equation (Mifflin et al., American Journal of
// Clinical Nutrition, 1990).
//   Men:   10 x weight(kg) + 6.25 x height(cm) - 5 x age + 5
//   Women: 10 x weight(kg) + 6.25 x height(cm) - 5 x age - 161
// ---------------------------------------------------------------------------

export interface BmrInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}

export function calculateBmr(input: BmrInput): number {
  requirePositive(input.weightKg, 'weightKg');
  requirePositive(input.heightCm, 'heightCm');
  requirePositive(input.ageYears, 'ageYears');
  if (input.sex !== 'male' && input.sex !== 'female') {
    throw new Error(`sex must be 'male' or 'female', got ${input.sex}`);
  }
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return Math.round(base + (input.sex === 'male' ? 5 : -161));
}

// ---------------------------------------------------------------------------
// TDEE — BMR x activity factor (Harris-Benedict activity multipliers,
// as published with the Mifflin-St Jeor equation).
// ---------------------------------------------------------------------------

export interface TdeeInput extends BmrInput {
  activity: ActivityLevel;
}

export interface TdeeResult {
  bmr: number;
  activityFactor: number;
  tdee: number;
}

/**
 * Hand-check: man, 70 kg, 175 cm, 30 y -> BMR = 700 + 1093.75 - 150 + 5
 * = 1649 (rounded); moderate activity x 1.55 -> TDEE = 2556.
 */
export function calculateTdee(input: TdeeInput): TdeeResult {
  const bmr = calculateBmr(input);
  const factor = ACTIVITY_FACTORS[input.activity];
  if (factor === undefined) {
    throw new Error(`activity must be a known level, got ${input.activity}`);
  }
  return { bmr, activityFactor: factor, tdee: Math.round(bmr * factor) };
}

// ---------------------------------------------------------------------------
// Macros — daily protein / carbohydrate / fat from TDEE.
// Protein and carbohydrate = 4 kcal/g, fat = 9 kcal/g.
// Splits (share of calories): maintain 30/40/30, lose 35/35/30,
// gain 25/45/30. These are common published starting splits, shown
// on the page as editable presets — not a prescription.
// ---------------------------------------------------------------------------

export type MacroGoal = 'maintain' | 'lose' | 'gain';

export const MACRO_SPLITS: Record<MacroGoal, { protein: number; carbs: number; fat: number }> = {
  maintain: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  lose: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  gain: { protein: 0.25, carbs: 0.45, fat: 0.3 },
};

export interface MacroResult {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
}

/**
 * Hand-check: 2000 kcal, maintain (30/40/30) -> protein 600 kcal = 150 g,
 * carbs 800 kcal = 200 g, fat 600 kcal = 67 g (600/9 = 66.7).
 */
export function calculateMacros(tdeeKcal: number, goal: MacroGoal): MacroResult {
  requirePositive(tdeeKcal, 'tdeeKcal');
  const split = MACRO_SPLITS[goal];
  if (split === undefined) {
    throw new Error(`goal must be 'maintain', 'lose' or 'gain', got ${goal}`);
  }
  const proteinKcal = Math.round(tdeeKcal * split.protein);
  const carbsKcal = Math.round(tdeeKcal * split.carbs);
  const fatKcal = Math.round(tdeeKcal * split.fat);
  return {
    calories: Math.round(tdeeKcal),
    proteinG: round1(proteinKcal / 4),
    carbsG: round1(carbsKcal / 4),
    fatG: round1(fatKcal / 9),
    proteinKcal,
    carbsKcal,
    fatKcal,
  };
}

// ---------------------------------------------------------------------------
// Body fat — U.S. Navy method (Hodgdon & Beckett, Naval Health
// Research Center, 1984). The published constants were fitted with
// all measurements in CENTIMETRES — do not convert to inches.
//   Men:   495 / (1.0324 - 0.19077*log10(waist-neck) + 0.15456*log10(height)) - 450
//   Women: 495 / (1.29579 - 0.35004*log10(waist+hip-neck) + 0.22100*log10(height)) - 450
// Categories: American Council on Exercise (ACE) body-fat ranges.
// ---------------------------------------------------------------------------

export type BodyFatCategory = 'essential' | 'athlete' | 'fitness' | 'average' | 'obese';

export const BODY_FAT_LABELS: Record<BodyFatCategory, { bn: string; en: string }> = {
  essential: { bn: 'অত্যাবশ্যকীয় চর্বি', en: 'Essential fat' },
  athlete: { bn: 'খেলোয়াড়', en: 'Athlete' },
  fitness: { bn: 'ফিটনেস', en: 'Fitness' },
  average: { bn: 'গড়', en: 'Average' },
  obese: { bn: 'স্থূলতা', en: 'Obese' },
};

export function bodyFatCategory(sex: Sex, percent: number): BodyFatCategory {
  if (sex === 'male') {
    if (percent < 6) return 'essential';
    if (percent < 14) return 'athlete';
    if (percent < 18) return 'fitness';
    if (percent < 25) return 'average';
    return 'obese';
  }
  if (percent < 14) return 'essential';
  if (percent < 21) return 'athlete';
  if (percent < 25) return 'fitness';
  if (percent < 32) return 'average';
  return 'obese';
}

export interface BodyFatInput {
  sex: Sex;
  heightCm: number;
  neckCm: number;
  waistCm: number;
  /** Required for women, unused for men. */
  hipCm?: number;
}

export interface BodyFatResult {
  bodyFatPercent: number;
  category: BodyFatCategory;
  /** Fat mass in kg (needs weight). Null when weight is not given. */
  fatMassKg: number | null;
  leanMassKg: number | null;
}

/**
 * Hand-check (all measurements in centimetres, as fitted):
 * man, height 175, neck 38, waist 85 -> waist-neck = 47;
 * 495 / (1.0324 - 0.19077*log10(47) + 0.15456*log10(175)) - 450 = 16.9%.
 * Woman, height 165, neck 33, waist 75, hip 100:
 * 495 / (1.29579 - 0.35004*log10(142) + 0.221*log10(165)) - 450 = 29.4%.
 */
export function calculateBodyFat(input: BodyFatInput): BodyFatResult {
  requirePositive(input.heightCm, 'heightCm');
  requirePositive(input.neckCm, 'neckCm');
  requirePositive(input.waistCm, 'waistCm');
  if (input.sex !== 'male' && input.sex !== 'female') {
    throw new Error(`sex must be 'male' or 'female', got ${input.sex}`);
  }
  const height = input.heightCm;
  const neck = input.neckCm;
  const waist = input.waistCm;
  let denominator: number;
  if (input.sex === 'male') {
    if (waist <= neck) {
      throw new Error('waistCm must be greater than neckCm for men');
    }
    denominator =
      1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height);
  } else {
    if (input.hipCm === undefined || !Number.isFinite(input.hipCm) || input.hipCm <= 0) {
      throw new Error('hipCm is required for women');
    }
    const hip = input.hipCm;
    if (waist + hip <= neck) {
      throw new Error('waistCm + hipCm must be greater than neckCm for women');
    }
    denominator =
      1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height);
  }
  const percent = round1(495 / denominator - 450);
  return { bodyFatPercent: percent, category: bodyFatCategory(input.sex, percent), fatMassKg: null, leanMassKg: null };
}

/** Body fat with fat/lean mass split when weight is known. */
export function calculateBodyFatWithWeight(
  input: BodyFatInput & { weightKg: number },
): BodyFatResult {
  requirePositive(input.weightKg, 'weightKg');
  const base = calculateBodyFat(input);
  const fatMassKg = round1((input.weightKg * base.bodyFatPercent) / 100);
  return { ...base, fatMassKg, leanMassKg: round1(input.weightKg - fatMassKg) };
}

// ---------------------------------------------------------------------------
// Heart-rate zones — Karvonen formula (Karvonen et al., 1957).
// HRmax = 220 - age (Fox et al. estimate); target = (HRmax - resting)
// x intensity + resting. Zones: Z1 50–60%, Z2 60–70%, Z3 70–80%,
// Z4 80–90%, Z5 90–100% of heart-rate reserve.
// ---------------------------------------------------------------------------

export interface HeartRateZone {
  zone: string;
  nameBn: string;
  nameEn: string;
  lowBpm: number;
  highBpm: number;
}

export interface HeartRateResult {
  maxHr: number;
  restingBpm: number;
  zones: HeartRateZone[];
}

const ZONE_DEFS: { zone: string; bn: string; en: string; low: number; high: number }[] = [
  { zone: 'Z1', bn: 'খুব হালকা', en: 'Very light', low: 0.5, high: 0.6 },
  { zone: 'Z2', bn: 'হালকা', en: 'Light', low: 0.6, high: 0.7 },
  { zone: 'Z3', bn: 'মাঝারি', en: 'Moderate', low: 0.7, high: 0.8 },
  { zone: 'Z4', bn: 'কঠোর', en: 'Hard', low: 0.8, high: 0.9 },
  { zone: 'Z5', bn: 'সর্বোচ্চ', en: 'Maximum', low: 0.9, high: 1.0 },
];

/**
 * Hand-check: age 30, resting 60 -> HRmax 190, reserve 130.
 * Z2 = 60 + 130 x 0.60 = 138 to 60 + 130 x 0.70 = 151 bpm.
 */
export function calculateHeartRateZones(ageYears: number, restingBpm: number): HeartRateResult {
  requirePositive(ageYears, 'ageYears');
  requirePositive(restingBpm, 'restingBpm');
  if (ageYears >= 220) throw new Error('ageYears must be below 220');
  const maxHr = 220 - ageYears;
  const reserve = maxHr - restingBpm;
  if (reserve <= 0) throw new Error('restingBpm must be below maximum heart rate');
  return {
    maxHr,
    restingBpm,
    zones: ZONE_DEFS.map((z) => ({
      zone: z.zone,
      nameBn: z.bn,
      nameEn: z.en,
      lowBpm: Math.round(restingBpm + reserve * z.low),
      highBpm: Math.round(restingBpm + reserve * z.high),
    })),
  };
}

// ---------------------------------------------------------------------------
// Pace & speed — pace (min/km) = time / distance; speed (km/h) =
// distance / time in hours.
// ---------------------------------------------------------------------------

export interface PaceInput {
  distanceKm: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface PaceResult {
  totalMinutes: number;
  paceMinPerKm: number;
  paceFormatted: string;
  speedKmh: number;
  speedMs: number;
}

export function formatPace(paceMinPerKm: number): string {
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Hand-check: 5 km in 30:00 -> pace 6:00 /km, speed 10 km/h.
 */
export function calculatePace(input: PaceInput): PaceResult {
  requirePositive(input.distanceKm, 'distanceKm');
  requireNonNegative(input.hours, 'hours');
  requireNonNegative(input.minutes, 'minutes');
  requireNonNegative(input.seconds, 'seconds');
  const totalMinutes = input.hours * 60 + input.minutes + input.seconds / 60;
  if (totalMinutes <= 0) throw new Error('time must be greater than zero');
  const paceMinPerKm = round2(totalMinutes / input.distanceKm);
  const speedKmh = round2(input.distanceKm / (totalMinutes / 60));
  return {
    totalMinutes: round2(totalMinutes),
    paceMinPerKm,
    paceFormatted: formatPace(paceMinPerKm),
    speedKmh,
    speedMs: round2(speedKmh / 3.6),
  };
}

/** Reverse mode: what pace is needed to cover a distance in a target time? */
export function paceForTarget(distanceKm: number, targetMinutes: number): PaceResult {
  return calculatePace({ distanceKm, hours: 0, minutes: Math.floor(targetMinutes), seconds: Math.round((targetMinutes % 1) * 60) });
}

/** What-if mode: how long will a distance take at a given pace (min/km)? */
export function timeForPace(distanceKm: number, paceMinPerKm: number): number {
  requirePositive(distanceKm, 'distanceKm');
  requirePositive(paceMinPerKm, 'paceMinPerKm');
  return round1(distanceKm * paceMinPerKm);
}

// ---------------------------------------------------------------------------
// Water intake — weight-based guidance: 30–40 ml per kg per day
// (common published guidance; EFSA adequate intake is about 2.5 L
// for men and 2.0 L for women from all sources). Recommended here:
// 35 ml/kg, plus about 350 ml per 30 minutes of exercise
// (12 ml/min) and 500 ml extra on hot days.
// ---------------------------------------------------------------------------

export interface WaterInput {
  weightKg: number;
  exerciseMinutes?: number;
  hotClimate?: boolean;
}

export interface WaterResult {
  recommendedMl: number;
  recommendedLitres: number;
  lowMl: number;
  highMl: number;
  glasses: number;
}

/**
 * Hand-check: 70 kg, no exercise, not hot -> 35 x 70 = 2450 ml
 * (range 2100–2800 ml), about 10 glasses of 250 ml.
 */
export function calculateWaterIntake(input: WaterInput): WaterResult {
  requirePositive(input.weightKg, 'weightKg');
  const exerciseMinutes = input.exerciseMinutes ?? 0;
  requireNonNegative(exerciseMinutes, 'exerciseMinutes');
  const lowMl = Math.round(30 * input.weightKg);
  const highMl = Math.round(40 * input.weightKg);
  const recommendedMl = Math.round(
    35 * input.weightKg + exerciseMinutes * 12 + (input.hotClimate ? 500 : 0),
  );
  return {
    recommendedMl,
    recommendedLitres: round1(recommendedMl / 1000),
    lowMl,
    highMl,
    glasses: Math.round(recommendedMl / 250),
  };
}
