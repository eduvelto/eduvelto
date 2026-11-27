import { describe, it, expect } from 'vitest';
import { calculateAge, formatAgeEn } from '../../tools/ageEngine';

describe('calculateAge', () => {
  it('computes 26y 10m 12d for DOB 2000-01-15 at 2026-11-27', () => {
    expect(calculateAge('2000-01-15', new Date(2026, 10, 27))).toEqual(
      expect.objectContaining({ years: 26, months: 10, days: 12 }),
    );
  });
  it('handles month-end borrowing: DOB 2000-01-31 at 2026-02-28 -> 26y 0m 28d', () => {
    const a = calculateAge('2000-01-31', new Date(2026, 1, 28));
    expect(a.years).toBe(26);
    expect(a.months).toBe(0);
    expect(a.days).toBe(28);
  });
  it('throws on a future DOB and on a bad format', () => {
    expect(() => calculateAge('2030-01-01', new Date(2026, 10, 27))).toThrow();
    expect(() => calculateAge('15-01-2000')).toThrow();
  });
  it('formats in English', () => {
    expect(formatAgeEn({ years: 26, months: 10, days: 12, totalDays: 0 })).toBe('26 years, 10 months, 12 days');
  });
});
