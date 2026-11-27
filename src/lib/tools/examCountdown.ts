/**
 * Exam Countdown Timer — pure logic (wraps the shared timer engine).
 * Pure functions only: no network, no storage, no DOM.
 */
import { countdownParts, type CountdownParts } from './timerEngine';

export function examCountdown(targetIso: string, now: Date = new Date()): CountdownParts {
  return countdownParts(targetIso, now);
}

/** ISO date N days from `now` (local) — used by the preset buttons. */
export function isoDateDaysFromNow(days: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Whole weeks + leftover days, for the supporting tiles. */
export function weeksAndDays(totalDays: number): { weeks: number; days: number } {
  const d = Math.max(0, totalDays);
  return { weeks: Math.floor(d / 7), days: d % 7 };
}
