/**
 * Study Routine Maker — pure logic.
 * Distributes each subject's weekly hours across the chosen study
 * days, starting at the chosen hour. Pure functions only.
 */

export interface RoutineSubject {
  name: string;
  hoursPerWeek: number;
}

export interface RoutineSlot {
  day: string;
  subject: string;
  startHour: number;
  durationMin: number;
}

export const ROUTINE_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface RoutineResult {
  slots: RoutineSlot[];
  totalHoursPerWeek: number;
  totalMinutesPerDay: number;
}

/**
 * Round-robin distribution: each subject gets one block per study day
 * until its weekly minutes are used up. Hand-check: 2 subjects x 3h,
 * 3 days, start 16:00 -> 6 slots, 60 min each, total 6h/week.
 */
export function buildRoutine(
  subjects: RoutineSubject[],
  days: string[],
  startHour: number,
): RoutineResult {
  const clean = subjects.filter((s) => s.name.trim() !== '' && s.hoursPerWeek > 0);
  if (clean.length === 0) throw new Error('Add at least one subject with weekly hours');
  if (days.length === 0) throw new Error('Choose at least one study day');
  if (!Number.isFinite(startHour) || startHour < 0 || startHour > 23) {
    throw new Error('Start hour must be between 0 and 23');
  }
  const remaining = new Map(clean.map((s) => [s.name.trim(), Math.round(s.hoursPerWeek * 60)]));
  // One fixed block per subject per day, from the ORIGINAL weekly minutes.
  const perDay = new Map(
    clean.map((s) => [s.name.trim(), Math.max(30, Math.round((s.hoursPerWeek * 60) / days.length / 30) * 30)]),
  );
  const slots: RoutineSlot[] = [];
  let hour = startHour;
  for (const day of days) {
    hour = startHour;
    for (const s of clean) {
      const name = s.name.trim();
      const left = remaining.get(name) ?? 0;
      if (left <= 0) continue;
      const block = Math.min(left, perDay.get(name) ?? 30);
      slots.push({ day, subject: name, startHour: hour, durationMin: block });
      remaining.set(name, left - block);
      hour += block / 60;
    }
  }
  // Any leftover minutes (rounding) go on the first day as extra blocks.
  for (const s of clean) {
    const name = s.name.trim();
    const left = remaining.get(name) ?? 0;
    if (left > 0) {
      slots.push({ day: days[0], subject: name, startHour: hour, durationMin: left });
      remaining.set(name, 0);
    }
  }
  const totalHoursPerWeek = clean.reduce((s, x) => s + x.hoursPerWeek, 0);
  const totalMinutesPerDay = Math.round((totalHoursPerWeek * 60) / days.length);
  return { slots, totalHoursPerWeek, totalMinutesPerDay };
}

/** "16:00" from an hour number (supports halves, e.g. 16.5 -> 16:30). */
export function formatRoutineHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
