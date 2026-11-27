// Hijri Date Converter — unit tests.
// The tabular (Kuwaiti) calendar is an approximation of moon-sighting,
// so date assertions allow ±1 day; the strict checks are round-trip
// identity and month/year sanity.
import { describe, it, expect } from 'vitest';
import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijri,
  hijriMonthName,
  HIJRI_MONTHS,
} from '../../tools/hijriDate';

describe('gregorianToHijri', () => {
  it('converts 25 Jun 2025 to 1 Muharram 1447 (tabular; observed was 26 Jun, ±1 day)', () => {
    const h = gregorianToHijri(2025, 6, 25);
    expect(h).toEqual({ year: 1447, month: 1, day: 1 });
    // And 26 Jun 2025 is 2 Muharram 1447 in the tabular calendar.
    expect(gregorianToHijri(2025, 6, 26)).toEqual({ year: 1447, month: 1, day: 2 });
  });

  it('converts 27 Nov 2026 into Hijri year 1448', () => {
    const h = gregorianToHijri(2026, 11, 27);
    expect(h.year).toBe(1448);
    expect(h.month).toBeGreaterThanOrEqual(1);
    expect(h.month).toBeLessThanOrEqual(12);
    expect(h.day).toBeGreaterThanOrEqual(1);
    expect(h.day).toBeLessThanOrEqual(30);
  });

  it('rejects an invalid month', () => {
    expect(() => gregorianToHijri(2026, 13, 1)).toThrow();
  });
});

describe('hijriToGregorian round-trip', () => {
  it('returns the same Gregorian day for several dates', () => {
    for (const [y, m, d] of [
      [2026, 11, 27],
      [2026, 2, 19],
      [2025, 6, 26],
      [2024, 3, 11],
    ] as const) {
      const h = gregorianToHijri(y, m, d);
      expect(hijriToGregorian(h)).toEqual({ year: y, month: m, day: d });
    }
  });

  it('rejects an invalid Hijri month', () => {
    expect(() => hijriToGregorian({ year: 1447, month: 13, day: 1 })).toThrow();
  });
});

describe('formatting', () => {
  it('has 12 month names and formats 1 Ramadan 1447', () => {
    expect(HIJRI_MONTHS).toHaveLength(12);
    expect(hijriMonthName(9, 'en')).toBe('Ramadan');
    expect(formatHijri({ year: 1447, month: 9, day: 1 }, 'en')).toBe('1 Ramadan 1447');
  });
});
