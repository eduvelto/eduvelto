/**
 * Shared timer engine — countdown / stopwatch helpers for
 * exam-countdown-timer, pomodoro-timer and quiz-stopwatch-timer.
 * Pure functions only: no network, no storage, no DOM.
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Total remaining milliseconds (negative when the date has passed). */
  totalMs: number;
  past: boolean;
}

/**
 * Split the gap between now and a target ISO date/datetime into
 * days/hours/minutes/seconds. Hand-check: target 2026-12-01T00:00,
 * now 2026-11-27T00:00 -> 4 days, 0h 0m 0s.
 */
export function countdownParts(targetIso: string, now: Date = new Date()): CountdownParts {
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) throw new Error(`Invalid target date: ${targetIso}`);
  const totalMs = target.getTime() - now.getTime();
  const abs = Math.max(0, totalMs);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  return { days, hours, minutes, seconds, totalMs, past: totalMs <= 0 };
}

/** "04:23:11" from a seconds count (hours may exceed 24). */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Stopwatch display "MM:SS.t" from milliseconds. */
export function formatStopwatch(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const t = Math.floor((total % 1000) / 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${t}`;
}

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsBeforeLong: number;
}

export const POMODORO_DEFAULTS: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsBeforeLong: 4,
};

/** Duration in seconds of a pomodoro phase. */
export function pomodoroPhaseSeconds(phase: PomodoroPhase, settings: PomodoroSettings = POMODORO_DEFAULTS): number {
  switch (phase) {
    case 'focus': return settings.focusMin * 60;
    case 'shortBreak': return settings.shortBreakMin * 60;
    case 'longBreak': return settings.longBreakMin * 60;
  }
}

/**
 * Next phase after a focus session finishes: a long break after every
 * Nth focus session, otherwise a short break; after any break, focus.
 */
export function nextPomodoroPhase(phase: PomodoroPhase, completedFocus: number, settings: PomodoroSettings = POMODORO_DEFAULTS): PomodoroPhase {
  if (phase === 'focus') {
    return completedFocus % settings.sessionsBeforeLong === 0 ? 'longBreak' : 'shortBreak';
  }
  return 'focus';
}

/** Lap durations (ms) from cumulative stopwatch split times. */
export function lapDurations(splitsMs: number[]): number[] {
  const laps: number[] = [];
  let prev = 0;
  for (const split of splitsMs) {
    if (split < prev) throw new Error('Split times must not go backwards');
    laps.push(split - prev);
    prev = split;
  }
  return laps;
}
