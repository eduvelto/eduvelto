/**
 * Eduvelto — shared date engine for the pregnancy, ovulation and
 * sleep health tools (Batch 3).
 *
 * - Pregnancy due date: Naegele's rule — last menstrual period
 *   + 280 days (40 weeks). Standard obstetric estimate.
 * - Ovulation: ovulation about 14 days before the next period,
 *   fertile window 5 days before ovulation to 1 day after.
 * - Sleep cycles: one cycle is about 90 minutes, plus about
 *   15 minutes to fall asleep (common sleep-cycle guidance).
 *
 * All dates are handled in UTC so the result never shifts with
 * the device timezone. All outputs are estimates, not medical
 * advice — the tool pages carry that disclaimer in bn+en.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

/** Parse a YYYY-MM-DD date as UTC midnight; throws on bad input. */
export function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error(`date must be YYYY-MM-DD, got ${value}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    throw new Error(`invalid calendar date, got ${value}`);
  }
  return date;
}

/** Format a Date as YYYY-MM-DD (UTC). */
export function formatIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(dateIso: string, days: number): string {
  const date = parseIsoDate(dateIso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

/** Whole days from `fromIso` to `toIso` (negative when to is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime();
  return Math.round(ms / 86400000);
}

// ---------------------------------------------------------------------------
// Pregnancy due date — Naegele's rule.
// ---------------------------------------------------------------------------

export interface DueDateResult {
  dueDate: string;
  /** Approximate conception date: LMP + 14 days. */
  conceptionDate: string;
  /** Start of the 2nd trimester: LMP + 14 weeks. */
  secondTrimesterStart: string;
  /** Start of the 3rd trimester: LMP + 28 weeks. */
  thirdTrimesterStart: string;
}

/**
 * Hand-check: LMP 2026-01-01 -> due 2026-10-08 (280 days),
 * conception 2026-01-15, 2nd trimester 2026-04-09, 3rd 2026-07-16.
 */
export function calculateDueDate(lmpIso: string): DueDateResult {
  parseIsoDate(lmpIso);
  return {
    dueDate: addDaysIso(lmpIso, 280),
    conceptionDate: addDaysIso(lmpIso, 14),
    secondTrimesterStart: addDaysIso(lmpIso, 98),
    thirdTrimesterStart: addDaysIso(lmpIso, 196),
  };
}

/** Gestational age on a reference date: { weeks, days }. */
export function gestationalAge(lmpIso: string, referenceIso: string): { weeks: number; days: number } {
  const total = daysBetween(lmpIso, referenceIso);
  if (total < 0) throw new Error('reference date is before the last menstrual period');
  return { weeks: Math.floor(total / 7), days: total % 7 };
}

// ---------------------------------------------------------------------------
// Ovulation — cycle math.
// ---------------------------------------------------------------------------

export interface OvulationResult {
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  nextPeriodDate: string;
}

/**
 * Hand-check: LMP 2026-01-01, 28-day cycle -> ovulation 2026-01-15
 * (day 14), fertile window 2026-01-10 to 2026-01-16, next period
 * 2026-01-29.
 */
export function calculateOvulation(lmpIso: string, cycleLengthDays = 28): OvulationResult {
  parseIsoDate(lmpIso);
  if (!Number.isFinite(cycleLengthDays) || cycleLengthDays < 21 || cycleLengthDays > 35) {
    throw new Error(`cycleLengthDays must be between 21 and 35, got ${cycleLengthDays}`);
  }
  const ovulationDay = cycleLengthDays - 14;
  const ovulationDate = addDaysIso(lmpIso, ovulationDay);
  return {
    ovulationDate,
    fertileWindowStart: addDaysIso(ovulationDate, -5),
    fertileWindowEnd: addDaysIso(ovulationDate, 1),
    nextPeriodDate: addDaysIso(lmpIso, cycleLengthDays),
  };
}

// ---------------------------------------------------------------------------
// Sleep cycles — 90 minutes per cycle + ~15 minutes to fall asleep.
// ---------------------------------------------------------------------------

export interface SleepOption {
  cycles: number;
  hours: number;
  /** Clock time HH:MM (24-hour). */
  time: string;
}

export function parseClockTime(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) throw new Error(`time must be HH:MM (24-hour), got ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatClockTime(totalMinutes: number): string {
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const SLEEP_CYCLES = [4, 5, 6];

/**
 * Hand-check: wake at 06:00 -> bedtimes 23:45 (4 cycles, 6 h),
 * 22:15 (5 cycles, 7.5 h), 20:45 (6 cycles, 9 h), each 15 min
 * fall-asleep time included.
 */
export function bedtimesForWake(wakeTime: string): SleepOption[] {
  const wake = parseClockTime(wakeTime);
  return SLEEP_CYCLES.map((cycles) => ({
    cycles,
    hours: (cycles * 90) / 60,
    time: formatClockTime(wake - 15 - cycles * 90),
  }));
}

/**
 * Hand-check: bed at 22:30 -> wake times 04:45 (4 cycles),
 * 06:15 (5 cycles), 07:45 (6 cycles).
 */
export function wakeTimesForBed(bedTime: string): SleepOption[] {
  const bed = parseClockTime(bedTime);
  return SLEEP_CYCLES.map((cycles) => ({
    cycles,
    hours: (cycles * 90) / 60,
    time: formatClockTime(bed + 15 + cycles * 90),
  }));
}
