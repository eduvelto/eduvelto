/**
 * Sehri & Iftar Time — reuses the Prayer Times engine exactly
 * (src/lib/tools/prayerTimes.ts). Sehri ends at Fajr, Iftar is at
 * Maghrib: ONE calculation, no duplicate solar code.
 *
 * Honesty note (shown in the UI): different methods and local
 * mosques differ by a few minutes, and many timetables keep a
 * small precautionary margin before Fajr for Sehri. Check the
 * local mosque timetable.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import { calculatePrayerTimes, type PrayerTimesInput } from './prayerTimes';

export interface SehriIftarResult {
  /** Sehri ends at Fajr. */
  sehri: string | null;
  /** Iftar is at Maghrib. */
  iftar: string | null;
  fajr: string | null;
  sunrise: string | null;
  maghrib: string | null;
  isha: string | null;
}

export function getSehriIftar(input: PrayerTimesInput): SehriIftarResult {
  const times = calculatePrayerTimes(input);
  return {
    sehri: times.fajr,
    iftar: times.maghrib,
    fajr: times.fajr,
    sunrise: times.sunrise,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

/**
 * Fasting duration in minutes between Sehri (Fajr) and Iftar
 * (Maghrib), or null when either time is unavailable (polar day).
 * Hand-check: Dhaka 26 Nov 2026 — Fajr ~05:01, Maghrib ~17:11,
 * so about 12 h 10 min (730 minutes, ±5).
 */
export function fastingMinutes(result: SehriIftarResult): number | null {
  if (!result.sehri || !result.iftar) return null;
  const toMin = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  return toMin(result.iftar) - toMin(result.sehri);
}
