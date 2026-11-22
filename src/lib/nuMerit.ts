// Eduvelto — National University merit estimate (NU-4, 22 Nov 2026;
// design doc §19.1.3, §19.7.3).
//
// ONE of three separate modules (never merged into a single
// `calculateResult()` — §18 (a)-3):
//   calculateExamScore()      — nuScoring.ts: the exam mark, 0–100.
//   calculateMeritEstimate()  — this file: the ESTIMATED merit, 0–200.
//   validateAdmissionEligibility() — nuEligibility.ts.
//
// Formula (circular §3(a)/§4(b), verified): merit = exam score (0–100)
// + SSC GPA × 8 (0–40) + HSC GPA × 12 (0–60). The three parts are
// shown SEPARATELY — never a single unexplained number.
//
// MeritExplainer safeguards (§19.7.3, BINDING):
//   * Input = the PUBLISHED GPA as on the certificate (4th subject
//     included) — the student is never asked to re-compute a combined
//     GPA; valid range 0.00–5.00, two decimals.
//   * The result is an ESTIMATE, labelled so everywhere:
//     "আনুমানিক হিসাব — অফিসিয়াল মেধাতালিকা নয়".
//   * Pass 35 is a comparison only: "৩৫ নম্বর হলো প্রকাশিত পরীক্ষার
//     পাস নম্বর। এটি কোনো কলেজে ভর্তির নিশ্চয়তা বা মেধাতালিকায়
//     নির্বাচিত হওয়ার নিশ্চয়তা নয়।"
//   * NEVER estimated: official merit position, college allotment,
//     subject allotment, quota selection, release-slip selection, or
//     admission probability. No tie-break simulation (the tie-break
//     order is explained as a process only, §19.7.3).
//   * Every estimate records `calculationVersion` + `circularVersion`
//     so a future circular can never silently change what an old
//     estimate meant.
//   * 2024-25 statistics (560,595 / 460,706 / 265,364) are history of
//     that session only — never a basis for next-cycle competition.

import { NU_CIRCULAR_VERSION, NU_MERIT_CALCULATION_VERSION } from './nuExamConfig';

/** The published exam pass mark (circular §4(a)) — comparison only,
 * never a pass/fail verdict on a practice/mock result. */
export const NU_PASS_MARK = 35;

export interface NuMeritEstimate {
  /** Estimated merit total, 0–200 (two decimals). */
  total: number;
  /** The three parts, shown separately. */
  examScore: number;
  sscPart: number;
  hscPart: number;
  /** Recorded on every estimate (§19.7.3). */
  calculationVersion: string;
  circularVersion: string;
}

function assertGpa(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 5) {
    throw new Error(`nu-merit-invalid-gpa: ${label} must be a number 0.00–5.00`);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Estimate the merit total from an exam score and the two published
 * GPAs (4th subject included, as on the certificate). The estimate is
 * valid ONLY for the circular version passed in — an unknown version
 * throws instead of silently applying 2025-26 rules to another cycle.
 */
export function calculateMeritEstimate(
  examScore: number,
  sscGpa: number,
  hscGpa: number,
  circularVersion: string = NU_CIRCULAR_VERSION,
): NuMeritEstimate {
  if (circularVersion !== NU_CIRCULAR_VERSION) {
    throw new Error(
      `nu-merit-unknown-circular: merit rules are known only for ${NU_CIRCULAR_VERSION}`,
    );
  }
  if (typeof examScore !== 'number' || !Number.isFinite(examScore) || examScore < 0 || examScore > 100) {
    throw new Error('nu-merit-invalid-score: examScore must be a number 0–100');
  }
  assertGpa(sscGpa, 'sscGpa');
  assertGpa(hscGpa, 'hscGpa');
  const sscPart = round2(sscGpa * 8);
  const hscPart = round2(hscGpa * 12);
  return {
    total: round2(examScore + sscPart + hscPart),
    examScore: round2(examScore),
    sscPart,
    hscPart,
    calculationVersion: NU_MERIT_CALCULATION_VERSION,
    circularVersion,
  };
}
