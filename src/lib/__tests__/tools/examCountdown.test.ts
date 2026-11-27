import { describe, it, expect } from 'vitest';
import { examCountdown, isoDateDaysFromNow, weeksAndDays } from '../../tools/examCountdown';

describe('examCountdown', () => {
  it('counts down to a date', () => {
    const c = examCountdown('2026-12-01', new Date(2026, 10, 27));
    expect(c.days).toBe(4);
  });
  it('isoDateDaysFromNow(30) from 2026-11-27 is 2026-12-27', () => {
    expect(isoDateDaysFromNow(30, new Date(2026, 10, 27))).toBe('2026-12-27');
  });
  it('weeksAndDays(10) = 1 week 3 days', () => {
    expect(weeksAndDays(10)).toEqual({ weeks: 1, days: 3 });
  });
});
