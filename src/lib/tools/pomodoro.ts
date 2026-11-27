/**
 * Pomodoro Study Timer — pure logic (wraps the shared timer engine).
 * Pure functions only: no network, no storage, no DOM.
 */
import {
  POMODORO_DEFAULTS,
  nextPomodoroPhase,
  pomodoroPhaseSeconds,
  type PomodoroPhase,
  type PomodoroSettings,
} from './timerEngine';

export { POMODORO_DEFAULTS, nextPomodoroPhase, pomodoroPhaseSeconds };
export type { PomodoroPhase, PomodoroSettings };

export function pomodoroPhaseLabel(phase: PomodoroPhase): { bn: string; en: string } {
  switch (phase) {
    case 'focus': return { bn: 'মনোযোগের সময়', en: 'Focus time' };
    case 'shortBreak': return { bn: 'ছোট বিরতি', en: 'Short break' };
    case 'longBreak': return { bn: 'লম্বা বিরতি', en: 'Long break' };
  }
}
