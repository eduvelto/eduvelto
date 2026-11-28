// Eduvelto — Admission Score Calculator tool logic
// (slug: admission-score-calculator).
//
// GROUNDED FORMULAS (verified 28 Nov 2026 from the official circulars):
// - Dhaka University 2026-27: GPA score = SSC GPA x 2 + HSC GPA x 2
//   (max 20). Merit = admission test score (0-100) + GPA score, out of 120.
// - Medical MBBS/BDS 2026-27 (DGME circular 25 Nov 2026): GPA score =
//   SSC GPA x 8 (max 40) + HSC GPA x 12 (max 60) = max 100.
//   Merit = admission test score (0-100) + GPA score, out of 200.
//   Second-time candidates: -3 marks; candidates admitted in the last
//   session: -5 marks (both apply on top of each other if both are true).
// Formulas change every year and differ by university — the UI carries
// that caveat and shows only the DU and Medical formulas above.

/** The two admission systems this tool covers. */
export type AdmissionSystem = 'du' | 'medical';

export const MAX_GPA = 5;
export const MAX_TEST_SCORE = 100;

/** GPA-score ceiling and merit total per system. */
export const SYSTEM_LIMITS: Record<AdmissionSystem, { maxGpaScore: number; maxMerit: number }> = {
  du: { maxGpaScore: 20, maxMerit: 120 },
  medical: { maxGpaScore: 100, maxMerit: 200 },
};

/** GPA multipliers: [SSC multiplier, HSC multiplier]. */
export const SYSTEM_WEIGHTS: Record<AdmissionSystem, { ssc: number; hsc: number }> = {
  du: { ssc: 2, hsc: 2 },
  medical: { ssc: 8, hsc: 12 },
};

/** Medical penalty marks (DGME circular 25 Nov 2026). */
export const MEDICAL_SECOND_TIMER_PENALTY = 3;
export const MEDICAL_ADMITTED_LAST_SESSION_PENALTY = 5;

export interface AdmissionScoreInput {
  system: AdmissionSystem;
  sscGpa: number;
  hscGpa: number;
  /** Admission test score (0-100), or null when not entered yet. */
  testScore: number | null;
  /** Medical only: second-time candidate (-3). Ignored for DU. */
  secondTimer?: boolean;
  /** Medical only: admitted in the last session (-5). Ignored for DU. */
  admittedLastSession?: boolean;
}

/** Rough guidance band for a merit score — NOT an official cutoff. */
export type MeritBand = 'strong' | 'competitive' | 'needs-improvement';

export interface AdmissionScoreResult {
  sscPart: number;
  hscPart: number;
  gpaScore: number;
  maxGpaScore: number;
  /** Merit total, or null when no test score was entered. */
  meritScore: number | null;
  maxMerit: number;
  /** Total penalty applied (medical second-timer / admitted last session). */
  penalty: number;
  /** Merit as a percentage of the max, or null when no test score. */
  meritPercent: number | null;
  /** Rough guidance band, or null when no test score. */
  meritBand: MeritBand | null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function checkGpa(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > MAX_GPA) {
    throw new Error(`${name} must be between 0 and ${MAX_GPA}, got ${value}`);
  }
}

/**
 * Merit band from the merit percentage. These thresholds are rough
 * guidance only (80%+ strong, 60%+ competitive, below that the score
 * needs improvement) — they are NOT official cutoffs, which change
 * every year with the merit list.
 */
export function meritBandForPercent(meritPercent: number): MeritBand {
  if (meritPercent >= 80) return 'strong';
  if (meritPercent >= 60) return 'competitive';
  return 'needs-improvement';
}

/**
 * Calculate the GPA score and (when a test score is given) the merit
 * score for one admission system.
 *
 * Hand-checks:
 * - DU, SSC 5.00 + HSC 5.00: 5x2 + 5x2 = 20; test 75 -> merit 95/120.
 * - DU, SSC 4.50 + HSC 4.00: 4.5x2 + 4x2 = 17; test 80 -> merit 97/120.
 * - Medical, SSC 5.00 + HSC 5.00: 5x8 + 5x12 = 100; test 70 -> 170/200;
 *   second-timer -3 -> 167/200.
 */
export function calculateAdmissionScore(input: AdmissionScoreInput): AdmissionScoreResult {
  checkGpa(input.sscGpa, 'sscGpa');
  checkGpa(input.hscGpa, 'hscGpa');
  if (input.testScore !== null) {
    if (!Number.isFinite(input.testScore) || input.testScore < 0 || input.testScore > MAX_TEST_SCORE) {
      throw new Error(`testScore must be between 0 and ${MAX_TEST_SCORE}, got ${input.testScore}`);
    }
  }
  const { ssc, hsc } = SYSTEM_WEIGHTS[input.system];
  const { maxGpaScore, maxMerit } = SYSTEM_LIMITS[input.system];
  const sscPart = round2(input.sscGpa * ssc);
  const hscPart = round2(input.hscGpa * hsc);
  const gpaScore = round2(sscPart + hscPart);
  const penalty =
    input.system === 'medical'
      ? (input.secondTimer ? MEDICAL_SECOND_TIMER_PENALTY : 0) +
        (input.admittedLastSession ? MEDICAL_ADMITTED_LAST_SESSION_PENALTY : 0)
      : 0;
  const meritScore = input.testScore === null ? null : round2(gpaScore + input.testScore - penalty);
  const meritPercent = meritScore === null ? null : round2((meritScore / maxMerit) * 100);
  return {
    sscPart,
    hscPart,
    gpaScore,
    maxGpaScore,
    meritScore,
    maxMerit,
    penalty,
    meritPercent,
    meritBand: meritPercent === null ? null : meritBandForPercent(meritPercent),
  };
}

export interface ParsedNumber {
  /** Parsed value, or null when nothing usable was entered. */
  value: number | null;
  /** True when something was entered but it is not a usable number. */
  invalid: boolean;
}

/**
 * Parse a raw GPA field. Empty means "not entered yet" (null, not
 * invalid); non-numeric, negative, or above 5 is invalid.
 */
export function parseGpaInput(raw: string): ParsedNumber {
  if (raw.trim() === '') return { value: null, invalid: false };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_GPA) {
    return { value: null, invalid: true };
  }
  return { value, invalid: false };
}

/**
 * Parse the optional admission-test-score field. Empty means "not
 * entered yet" (null, not invalid); non-numeric, negative, or above
 * 100 is invalid.
 */
export function parseTestScoreInput(raw: string): ParsedNumber {
  if (raw.trim() === '') return { value: null, invalid: false };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_TEST_SCORE) {
    return { value: null, invalid: true };
  }
  return { value, invalid: false };
}
