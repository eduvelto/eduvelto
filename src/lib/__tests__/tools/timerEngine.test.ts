import { describe, it, expect } from 'vitest';
import { countdownParts, formatHMS, formatStopwatch, lapDurations, nextPomodoroPhase, pomodoroPhaseSeconds } from '../../tools/timerEngine';

describe('countdownParts', () => {
  it('4 days to 2026-12-01 from 2026-11-27', () => {
    const c = countdownParts('2026-12-01T00:00:00', new Date(2026, 10, 27));
    expect(c).toEqual(expect.objectContaining({ days: 4, hours: 0, minutes: 0, seconds: 0, past: false }));
  });
  it('marks past dates', () => {
    expect(countdownParts('2020-01-01', new Date(2026, 10, 27)).past).toBe(true);
  });
});

describe('formatters', () => {
  it('formatHMS(3661) = 01:01:01', () => expect(formatHMS(3661)).toBe('01:01:01'));
  it('formatStopwatch(61500) = 01:01.5', () => expect(formatStopwatch(61500)).toBe('01:01.5'));
});

describe('pomodoro', () => {
  it('focus is 1500s, short break 300s, long break 900s by default', () => {
    expect(pomodoroPhaseSeconds('focus')).toBe(1500);
    expect(pomodoroPhaseSeconds('shortBreak')).toBe(300);
    expect(pomodoroPhaseSeconds('longBreak')).toBe(900);
  });
  it('long break after the 4th focus session, short break otherwise', () => {
    expect(nextPomodoroPhase('focus', 4)).toBe('longBreak');
    expect(nextPomodoroPhase('focus', 3)).toBe('shortBreak');
    expect(nextPomodoroPhase('shortBreak', 1)).toBe('focus');
  });
});

describe('lapDurations', () => {
  it('splits [1000, 2500, 4000] -> laps [1000, 1500, 1500]', () => {
    expect(lapDurations([1000, 2500, 4000])).toEqual([1000, 1500, 1500]);
  });
  it('throws on backwards splits', () => {
    expect(() => lapDurations([2000, 1000])).toThrow();
  });
});
