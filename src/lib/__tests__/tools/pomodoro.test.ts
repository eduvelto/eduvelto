import { describe, it, expect } from 'vitest';
import { POMODORO_DEFAULTS, nextPomodoroPhase, pomodoroPhaseLabel, pomodoroPhaseSeconds } from '../../tools/pomodoro';

describe('pomodoro logic', () => {
  it('defaults are 25/5/15 with a long break every 4 sessions', () => {
    expect(POMODORO_DEFAULTS).toEqual({ focusMin: 25, shortBreakMin: 5, longBreakMin: 15, sessionsBeforeLong: 4 });
  });
  it('focus seconds respect custom settings', () => {
    expect(pomodoroPhaseSeconds('focus', { ...POMODORO_DEFAULTS, focusMin: 50 })).toBe(3000);
  });
  it('labels exist for all phases', () => {
    expect(pomodoroPhaseLabel('focus').en).toBe('Focus time');
    expect(pomodoroPhaseLabel('longBreak').en).toBe('Long break');
  });
  it('next phase after focus 4 is long break', () => {
    expect(nextPomodoroPhase('focus', 4)).toBe('longBreak');
  });
});
