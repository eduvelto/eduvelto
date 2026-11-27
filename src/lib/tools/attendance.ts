/**
 * Attendance Calculator — pure logic.
 * Target default 75% (the usual minimum); the user can change it.
 * Pure functions only: no network, no storage, no DOM.
 */

export interface AttendanceResult {
  attended: number;
  total: number;
  percentage: number;
  /** Consecutive future classes to attend to reach the target. */
  classesNeeded: number;
  /** Future classes that may be missed while staying at/above target. */
  classesCanMiss: number;
  target: number;
}

/**
 * Hand-check: 60/80 = 75%, target 75 -> needed 0, can miss 0.
 * 70/100 = 70%, target 75 -> needed (0.75*100-70)/0.25 = 20 classes.
 */
export function calculateAttendance(attended: number, total: number, target: number = 75): AttendanceResult {
  if (!Number.isInteger(attended) || attended < 0) throw new Error('Attended classes must be 0 or more');
  if (!Number.isInteger(total) || total <= 0) throw new Error('Total classes must be more than 0');
  if (attended > total) throw new Error('Attended classes cannot exceed total classes');
  if (target <= 0 || target >= 100) throw new Error('Target must be between 1 and 99');
  const percentage = Math.round((attended / total) * 1000) / 10;
  const p = target / 100;
  const classesNeeded = percentage >= target ? 0 : Math.ceil((p * total - attended) / (1 - p));
  const classesCanMiss = percentage < target ? 0 : Math.max(0, Math.floor(attended / p - total));
  return { attended, total, percentage, classesNeeded, classesCanMiss, target };
}
