// Calendar 3-in-1 — unit tests.
//
// Bangla anchors come from src/lib/tools/banglaDate.ts header comments
// (21 Feb is always 8 Falgun; 1 Jan 2026 = 17 Poush 1432) and are asserted
// here against the lib's own conversion, not copied from memory.
// Hijri dates are tabular (Kuwaiti algorithm) — exact-day assertions are
// checked against the lib's verified output, and the strict guarantee
// tested is the gregorian -> hijri -> gregorian round-trip.
import { describe, expect, it } from 'vitest';
import { gregorianToBangla } from '../../tools/banglaDate';
import { gregorianToHijri, hijriToGregorian } from '../../tools/hijriDate';
import {
  buildMonthGrid,
  formatGregorian,
  formatThreeCalendars,
  gregorianMonthLength,
  gregorianMonthName,
  nextMonth,
  prevMonth,
  toBanglaDigits,
  weekdayName,
} from '../../tools/calendar3in1';

describe('Bangla anchors (via the shared lib)', () => {
  it('21 Feb 2026 is 8 Falgun 1432', () => {
    expect(gregorianToBangla(2026, 2, 21)).toEqual({ year: 1432, month: 11, day: 8 });
  });

  it('1 Jan 2026 is 17 Poush 1432', () => {
    expect(gregorianToBangla(2026, 1, 1)).toEqual({ year: 1432, month: 9, day: 17 });
  });

  it('14 Apr 2026 is 1 Boishakh 1433 (new year stays on 14 April)', () => {
    expect(gregorianToBangla(2026, 4, 14)).toEqual({ year: 1433, month: 1, day: 1 });
    expect(gregorianToBangla(2026, 4, 13)).toEqual({ year: 1432, month: 12, day: 30 });
  });
});

describe('Hijri round-trip', () => {
  it('gregorian -> hijri -> gregorian returns the same day', () => {
    for (const [y, m, d] of [
      [2026, 2, 21],
      [2026, 1, 1],
      [2026, 11, 28],
      [2025, 6, 25],
      [2024, 3, 11],
    ] as const) {
      expect(hijriToGregorian(gregorianToHijri(y, m, d))).toEqual({ year: y, month: m, day: d });
    }
  });

  it('21 Feb 2026 is 4 Ramadan 1447 in the tabular calendar', () => {
    expect(gregorianToHijri(2026, 2, 21)).toEqual({ year: 1447, month: 9, day: 4 });
  });
});

describe('month grid', () => {
  it('February 2026 has 28 days and starts on a Sunday', () => {
    const g = buildMonthGrid(2026, 2);
    expect(g.daysInMonth).toBe(28);
    expect(g.firstWeekday).toBe(0); // 1 Feb 2026 is a Sunday
    expect(g.weeks).toHaveLength(4);
    expect(g.weeks[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(g.weeks[3]).toEqual([22, 23, 24, 25, 26, 27, 28]);
    // Every day 1-28 appears exactly once.
    expect(g.weeks.flat().filter((d) => d !== null)).toEqual(
      Array.from({ length: 28 }, (_, i) => i + 1),
    );
  });

  it('December 2026 has 31 days and starts on a Tuesday', () => {
    const g = buildMonthGrid(2026, 12);
    expect(g.daysInMonth).toBe(31);
    expect(g.firstWeekday).toBe(2); // 1 Dec 2026 is a Tuesday
    expect(g.weeks[0]).toEqual([null, null, 1, 2, 3, 4, 5]);
    expect(g.weeks.flat().filter((d) => d !== null)).toHaveLength(31);
  });

  it('leap years: February 2024 has 29 days, February 2026 has 28', () => {
    expect(gregorianMonthLength(2024, 2)).toBe(29);
    expect(gregorianMonthLength(2026, 2)).toBe(28);
    expect(gregorianMonthLength(2100, 2)).toBe(28); // divisible by 100, not 400
    expect(gregorianMonthLength(2000, 2)).toBe(29); // divisible by 400
  });

  it('prev/next month roll over the year boundary', () => {
    expect(prevMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
    expect(nextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
    expect(prevMonth(2026, 6)).toEqual({ year: 2026, month: 5 });
    expect(nextMonth(2026, 6)).toEqual({ year: 2026, month: 7 });
  });
});

describe('formatting', () => {
  it('formats the Gregorian date in both languages', () => {
    expect(formatGregorian(2026, 2, 21, 'en')).toBe('21 February 2026');
    expect(formatGregorian(2026, 2, 21, 'bn')).toBe('২১ ফেব্রুয়ারি ২০২৬');
    expect(gregorianMonthName(2, 'bn')).toBe('ফেব্রুয়ারি');
    expect(gregorianMonthName(2, 'en')).toBe('February');
  });

  it('writes one day out in all three calendars', () => {
    const three = formatThreeCalendars(2026, 2, 21, 'en');
    expect(three).toEqual({
      gregorian: '21 February 2026',
      bangla: '8 Falgun 1432',
      hijri: '4 Ramadan 1447',
    });
    expect(formatThreeCalendars(2026, 2, 21, 'bn')).toEqual({
      gregorian: '২১ ফেব্রুয়ারি ২০২৬',
      bangla: '৮ ফাল্গুন ১৪৩২',
      hijri: '৪ রমজান ১৪৪৭',
    });
  });

  it('returns null for an invalid Gregorian date', () => {
    expect(formatThreeCalendars(2026, 2, 30, 'en')).toBeNull();
  });

  it('weekday names start on Sunday', () => {
    expect(weekdayName(0, 'en')).toBe('Sun');
    expect(weekdayName(0, 'bn')).toBe('রবি');
    expect(weekdayName(6, 'en')).toBe('Sat');
  });

  it('converts digits to Bangla digits', () => {
    expect(toBanglaDigits(2026)).toBe('২০২৬');
    expect(toBanglaDigits(0)).toBe('০');
  });
});
