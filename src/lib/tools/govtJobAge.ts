/**
 * Govt Job Age Calculator — pure logic (wraps the shared age engine).
 *
 * The age limit is USER-ENTERED. The standard limits below are
 * editable data with a source + date, never hard-coded as fact:
 * general 30 years, freedom-fighter quota 32 years (Bangladesh
 * government job circulars; noted 27 Nov 2026 — always verify against
 * the circular for the post you apply to). Pure functions only.
 */
import { calculateAge, type AgeResult } from './ageEngine';

export { calculateAge };
export type { AgeResult };

export const GOVT_JOB_AGE_REFERENCE = {
  general: 30,
  freedomFighterQuota: 32,
  sourceBn: 'সরকারি চাকরির বিজ্ঞপ্তি (বিপিএসসি/সরকারি নিয়োগ বিধি) — ২৭ নভেম্বর ২০২৬ তারিখে লেখা; আবেদনের বিজ্ঞপ্তি দেখে যাচাই করুন।',
  sourceEn: 'Bangladesh government job circulars (BPSC / government recruitment rules) — noted 27 Nov 2026; verify against the circular for the post you apply to.',
  notedDate: '2026-11-27',
} as const;

export interface GovtJobAgeResult {
  age: AgeResult;
  limit: number;
  eligible: boolean;
  /** Whole years of eligibility left (0 when over the limit). */
  yearsLeft: number;
}

/**
 * Hand-check: DOB 2000-01-15, asOf 2026-11-27, limit 30 -> age 26y,
 * eligible, 3 full years left (turns 30 on 2030-01-15).
 */
export function checkGovtJobAge(dobIso: string, limit: number, asOf: Date = new Date()): GovtJobAgeResult {
  if (!Number.isFinite(limit) || limit <= 0 || limit > 65) {
    throw new Error(`Age limit must be between 1 and 65, got ${limit}`);
  }
  const age = calculateAge(dobIso, asOf);
  const eligible = age.years < limit || (age.years === limit && age.months === 0 && age.days === 0);
  return { age, limit, eligible, yearsLeft: eligible ? Math.max(0, limit - age.years) : 0 };
}
