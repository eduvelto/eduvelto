// Eduvelto — Daily Walking-Goal Calculator tool logic (slug: daily-walking-goal).
//
// Pure logic only: no React, no network, no storage. All results are
// ESTIMATES — standard published approximations, labelled as estimates
// on the page, because real distance and calories vary by person,
// terrain, pace and fitness.
//
// Formulas:
//   - Stride length: user-entered (cm), or estimated from height:
//     stride ≈ height × 0.414.
//   - Distance (km) = steps × stride (m) / 1000.
//   - Time = distance / walking speed.
//   - Calories ≈ distance (km) × weight (kg) × 0.53 (kcal).

export const STRIDE_FROM_HEIGHT_FACTOR = 0.414;
export const CALORIES_PER_KM_PER_KG = 0.53;
export const DEFAULT_STEPS = 10000;
export const DEFAULT_STRIDE_CM = 76;
export const DEFAULT_WEIGHT_KG = 60;
export const DEFAULT_SPEED_KMH = 5;

/** Step goals shown in the comparison table. */
export const GOAL_STEPS = [5000, 7500, 10000, 12500] as const;

export interface WalkingInput {
  /** Daily steps. 0 is allowed and gives all-zero results. */
  steps: number;
  /** Stride length in cm. Must be > 0. */
  strideCm: number;
  /** Body weight in kg. Must be > 0. */
  weightKg: number;
  /** Walking speed in km/h. Must be > 0. */
  speedKmh: number;
}

export interface WalkingResult {
  steps: number;
  /** Distance in km, rounded to 2 decimals. */
  distanceKm: number;
  /** Calories in kcal, rounded to 2 decimals. */
  caloriesKcal: number;
  /** Total walking time in minutes (unrounded, for callers that need it). */
  timeMinutes: number;
  /** Walking time rounded to the nearest minute, split for display. */
  timeHours: number;
  timeRemainingMinutes: number;
}

export interface GoalRow {
  steps: number;
  distanceKm: number;
  caloriesKcal: number;
  timeMinutes: number;
  timeHours: number;
  timeRemainingMinutes: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function splitMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const rounded = Math.max(0, Math.round(totalMinutes));
  return { hours: Math.floor(rounded / 60), minutes: rounded % 60 };
}

/**
 * Estimate stride length (cm) from height (cm): stride ≈ height × 0.414.
 * Hand-check: 170 cm × 0.414 = 70.38 cm.
 */
export function estimateStrideCm(heightCm: number): number {
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error(`heightCm must be a finite number > 0, got ${heightCm}`);
  }
  return round2(heightCm * STRIDE_FROM_HEIGHT_FACTOR);
}

/**
 * Calculate distance, time and calories for one step count.
 * Hand-check: 10,000 steps × 0.76 m stride = 7.6 km;
 * 7.6 km × 60 kg × 0.53 = 241.68 kcal;
 * 7.6 km at 5 km/h = 1.52 h = 91.2 min ≈ 1 h 31 min.
 * Steps 0 gives all-zero results. Negative steps, or a stride, weight
 * or speed that is not a finite number > 0, throws.
 */
export function calculateWalking(input: WalkingInput): WalkingResult {
  const { steps, strideCm, weightKg, speedKmh } = input;
  if (!Number.isFinite(steps) || steps < 0) {
    throw new Error(`steps must be a finite number >= 0, got ${steps}`);
  }
  if (!Number.isFinite(strideCm) || strideCm <= 0) {
    throw new Error(`strideCm must be a finite number > 0, got ${strideCm}`);
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error(`weightKg must be a finite number > 0, got ${weightKg}`);
  }
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) {
    throw new Error(`speedKmh must be a finite number > 0, got ${speedKmh}`);
  }
  const distanceKm = round2((steps * (strideCm / 100)) / 1000);
  const caloriesKcal = round2(distanceKm * weightKg * CALORIES_PER_KM_PER_KG);
  const timeMinutes = speedKmh > 0 ? (distanceKm / speedKmh) * 60 : 0;
  const { hours, minutes } = splitMinutes(timeMinutes);
  return {
    steps,
    distanceKm,
    caloriesKcal,
    timeMinutes,
    timeHours: hours,
    timeRemainingMinutes: minutes,
  };
}

/**
 * Goal table: distance, time and calories for 5,000 / 7,500 / 10,000 /
 * 12,500 steps, using the user's stride, weight and speed.
 */
export function goalTable(input: Omit<WalkingInput, 'steps'>): GoalRow[] {
  return GOAL_STEPS.map((goalSteps) => {
    const row = calculateWalking({ ...input, steps: goalSteps });
    return {
      steps: goalSteps,
      distanceKm: row.distanceKm,
      caloriesKcal: row.caloriesKcal,
      timeMinutes: row.timeMinutes,
      timeHours: row.timeHours,
      timeRemainingMinutes: row.timeRemainingMinutes,
    };
  });
}

/**
 * Parse one raw text field. Returns the number, or null when the field
 * is empty, non-numeric, or (unless allowZero) zero or negative.
 * The UI uses null to show its inline error.
 */
export function parseWalkingField(raw: string, allowZero: boolean): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (allowZero ? value < 0 : value <= 0) return null;
  return value;
}
