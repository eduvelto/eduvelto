/**
 * Shared age engine — ONE age calculation for every tool that needs it.
 * Pure functions only: no network, no storage, no DOM.
 */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  /** Total days lived (whole days). */
  totalDays: number;
}

/**
 * Age in years/months/days from an ISO date of birth to `asOf`
 * (default: today, local time). Throws on an invalid or future DOB.
 * Hand-check: DOB 2000-01-15, asOf 2026-11-27 -> 26y 10m 12d.
 */
export function calculateAge(dobIso: string, asOf: Date = new Date()): AgeResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobIso)) {
    throw new Error(`Date of birth must be YYYY-MM-DD, got ${dobIso}`);
  }
  const dob = new Date(dobIso + 'T00:00:00');
  if (Number.isNaN(dob.getTime())) throw new Error(`Invalid date of birth: ${dobIso}`);
  const ref = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const birth = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  if (birth.getTime() > ref.getTime()) throw new Error('Date of birth is in the future');
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.floor((ref.getTime() - birth.getTime()) / 86400000);
  return { years, months, days, totalDays };
}

/** "26 years, 10 months, 12 days" — Latin-script form for PDFs/copies. */
export function formatAgeEn(age: AgeResult): string {
  return `${age.years} years, ${age.months} months, ${age.days} days`;
}
