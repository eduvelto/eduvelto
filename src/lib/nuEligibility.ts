// Eduvelto — National University admission eligibility check (NU-4,
// 22 Nov 2026; design doc §2.2, §19.1.3, §19.7.3).
//
// ONE of three separate modules (never merged into a single
// `calculateResult()` — §18 (a)-3):
//   calculateExamScore()      — nuScoring.ts: the exam mark, 0–100.
//   calculateMeritEstimate()  — nuMerit.ts: the estimated merit, 0–200.
//   validateAdmissionEligibility() — this file.
//
// Rules (circular 20/11/2025 §1, VERIFIED — memo
// 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348):
//   * Humanities / Business Studies: SSC 2022/2023 with GPA ≥ 2.0,
//     HSC 2024/2025 with GPA ≥ 2.0, combined (SSC + HSC, 4th subject
//     included) ≥ 4.50.
//   * Science: SSC 2022/2023 with GPA ≥ 2.25, HSC 2024/2025 with
//     GPA ≥ 2.0, combined ≥ 4.75.
//   * Subject eligibility (HSC subjects read, 200-mark subject GPA ≥
//     2.0) is NOT checked here — the subject list is unverified (§3 #4)
//     and needs the Prospectus/Guideline first.
//
// THREE STATES (§19.7.3, BINDING) — there is NO unconditional green
// "যোগ্য" badge:
//   * 'meets' — every checked rule passes for this circular version.
//   * 'does-not-meet' — at least one checked rule fails.
//   * 'cannot-determine' — a year is outside the circular's range, a
//     GPA is missing/out of range, or the circular version is unknown.
//     The UI shows "নির্ধারণ করা যায়নি" with the reason, never a guess.
// Input GPAs are the PUBLISHED GPAs as on the certificate (4th subject
// included) — the student is never asked to re-compute a combined GPA
// (§18 (c)-1, ADAPTED: the year check is enforced here in code, not
// only as a UI message).

import { NU_CIRCULAR_VERSION } from './nuExamConfig';
import type { NuGroupSlug } from './nuProfile';

export type NuEligibilityStatus = 'meets' | 'does-not-meet' | 'cannot-determine';

export interface NuEligibilityInput {
  group: NuGroupSlug;
  sscYear: number | null;
  sscGpa: number | null;
  hscYear: number | null;
  hscGpa: number | null;
  circularVersion?: string;
}

export interface NuEligibilityResult {
  status: NuEligibilityStatus;
  /** Bangla reasons, in check order — shown to the student. */
  reasons: string[];
  circularVersion: string;
}

const SSC_YEARS = [2022, 2023];
const HSC_YEARS = [2024, 2025];

function combinedThreshold(group: NuGroupSlug): number {
  return group === 'science' ? 4.75 : 4.5;
}

function sscMinimum(group: NuGroupSlug): number {
  return group === 'science' ? 2.25 : 2.0;
}

export function validateAdmissionEligibility(input: NuEligibilityInput): NuEligibilityResult {
  const circularVersion = input.circularVersion ?? NU_CIRCULAR_VERSION;
  const reasons: string[] = [];
  if (circularVersion !== NU_CIRCULAR_VERSION) {
    return {
      status: 'cannot-determine',
      reasons: ['এই বিজ্ঞপ্তি-সংস্করণের যোগ্যতার নিয়ম যাচাই করা হয়নি।'],
      circularVersion,
    };
  }
  let cannotDetermine = false;
  let fails = false;

  if (input.sscYear == null || !SSC_YEARS.includes(input.sscYear)) {
    cannotDetermine = true;
    reasons.push('SSC/সমমান পরীক্ষার বছর বিজ্ঞপ্তির সীমার (২০২২/২০২৩) বাইরে — নির্ধারণ করা যায়নি।');
  }
  if (input.hscYear == null || !HSC_YEARS.includes(input.hscYear)) {
    cannotDetermine = true;
    reasons.push('HSC/সমমান পরীক্ষার বছর বিজ্ঞপ্তির সীমার (২০২৪/২০২৫) বাইরে — নির্ধারণ করা যায়নি।');
  }
  const gpaOk = (v: number | null): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 5;
  if (!gpaOk(input.sscGpa)) {
    cannotDetermine = true;
    reasons.push('SSC GPA দেওয়া হয়নি বা সীমার (০.০০–৫.০০) বাইরে — নির্ধারণ করা যায়নি।');
  }
  if (!gpaOk(input.hscGpa)) {
    cannotDetermine = true;
    reasons.push('HSC GPA দেওয়া হয়নি বা সীমার (০.০০–৫.০০) বাইরে — নির্ধারণ করা যায়নি।');
  }
  if (cannotDetermine) {
    return { status: 'cannot-determine', reasons, circularVersion };
  }

  const sscGpa = input.sscGpa as number;
  const hscGpa = input.hscGpa as number;
  const sscMin = sscMinimum(input.group);
  if (sscGpa < sscMin) {
    fails = true;
    reasons.push(`SSC GPA ${sscMin}-এর নিচে (আপনার ${sscGpa}) — এই শাখার ন্যূনতম যোগ্যতা পূরণ হয়নি।`);
  }
  if (hscGpa < 2.0) {
    fails = true;
    reasons.push(`HSC GPA ২.০-এর নিচে (আপনার ${hscGpa}) — ন্যূনতম যোগ্যতা পূরণ হয়নি।`);
  }
  const combined = Math.round((sscGpa + hscGpa) * 100) / 100;
  const threshold = combinedThreshold(input.group);
  if (combined < threshold) {
    fails = true;
    reasons.push(
      `মোট GPA ${threshold}-এর নিচে (আপনার ${combined}) — এই শাখার মোট যোগ্যতা পূরণ হয়নি।`,
    );
  }
  if (fails) {
    return { status: 'does-not-meet', reasons, circularVersion };
  }
  return {
    status: 'meets',
    reasons: [
      `বিজ্ঞপ্তি ২০/১১/২০২৫ অনুযায়ী যোগ্যতার শর্ত পূরণ হয়েছে (মোট GPA ${combined}, প্রয়োজন ${threshold})। বিষয়-যোগ্যতা আলাদাভাবে যাচাই করতে হবে — এটি ভর্তির নিশ্চয়তা নয়।`,
    ],
    circularVersion,
  };
}
