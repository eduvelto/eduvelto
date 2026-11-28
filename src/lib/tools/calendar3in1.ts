// Eduvelto — Calendar 3-in-1 (English + Bangla + Hijri) month-grid logic.
//
// Pure functions only: no React, no network, no storage. The Bangla and
// Hijri conversions themselves live in ./banglaDate.ts (Bangladesh revised
// 2019 calendar) and ./hijriDate.ts (Kuwaiti tabular algorithm) — this
// file only adds the Gregorian month grid and the display formatting that
// joins the three calendars together.

import { formatBangla, gregorianToBangla } from './banglaDate';
import { formatHijri, gregorianToHijri } from './hijriDate';

export const GREGORIAN_MONTHS: readonly { bn: string; en: string }[] = [
  { bn: 'জানুয়ারি', en: 'January' },
  { bn: 'ফেব্রুয়ারি', en: 'February' },
  { bn: 'মার্চ', en: 'March' },
  { bn: 'এপ্রিল', en: 'April' },
  { bn: 'মে', en: 'May' },
  { bn: 'জুন', en: 'June' },
  { bn: 'জুলাই', en: 'July' },
  { bn: 'আগস্ট', en: 'August' },
  { bn: 'সেপ্টেম্বর', en: 'September' },
  { bn: 'অক্টোবর', en: 'October' },
  { bn: 'নভেম্বর', en: 'November' },
  { bn: 'ডিসেম্বর', en: 'December' },
];

export const WEEKDAYS: readonly { bn: string; en: string }[] = [
  { bn: 'রবি', en: 'Sun' },
  { bn: 'সোম', en: 'Mon' },
  { bn: 'মঙ্গল', en: 'Tue' },
  { bn: 'বুধ', en: 'Wed' },
  { bn: 'বৃহস্পতি', en: 'Thu' },
  { bn: 'শুক্র', en: 'Fri' },
  { bn: 'শনি', en: 'Sat' },
];

export function gregorianMonthName(month: number, lang: 'bn' | 'en'): string {
  if (month < 1 || month > 12) return '';
  return lang === 'bn' ? GREGORIAN_MONTHS[month - 1].bn : GREGORIAN_MONTHS[month - 1].en;
}

export function weekdayName(weekday: number, lang: 'bn' | 'en'): string {
  if (weekday < 0 || weekday > 6) return '';
  return lang === 'bn' ? WEEKDAYS[weekday].bn : WEEKDAYS[weekday].en;
}

export function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Days in a Gregorian month (month 1-12). Returns 0 for an invalid month. */
export function gregorianMonthLength(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isGregorianLeapYear(year) ? 29 : 28;
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Weekday of the 1st of the month, 0 = Sunday … 6 = Saturday. */
export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export interface MonthGrid {
  year: number;
  /** 1-12. */
  month: number;
  daysInMonth: number;
  /** Weekday of the 1st, 0 = Sunday. */
  firstWeekday: number;
  /** Rows of 7 cells; null = blank cell before the 1st / after the last day. */
  weeks: (number | null)[][];
}

/** Build the month grid for a Gregorian month/year. Weeks start on Sunday. */
export function buildMonthGrid(year: number, month: number): MonthGrid {
  const daysInMonth = gregorianMonthLength(year, month);
  const firstWeekday = firstWeekdayOfMonth(year, month);
  const weeks: (number | null)[][] = [];
  let day = 1;
  while (day <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let w = 0; w < 7; w++) {
      if (weeks.length === 0 && w < firstWeekday) {
        week.push(null);
      } else if (day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day);
        day += 1;
      }
    }
    weeks.push(week);
  }
  return { year, month, daysInMonth, firstWeekday, weeks };
}

/** Previous month, rolling back to December of the previous year. */
export function prevMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/** Next month, rolling forward to January of the next year. */
export function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Convert Latin digits in a number/string to Bangla digits. */
export function toBanglaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** "14 February 2026" / "১৪ ফেব্রুয়ারি ২০২৬" style formatting. */
export function formatGregorian(year: number, month: number, day: number, lang: 'bn' | 'en'): string {
  const name = gregorianMonthName(month, lang);
  if (lang === 'bn') return `${toBanglaDigits(day)} ${name} ${toBanglaDigits(year)}`;
  return `${day} ${name} ${year}`;
}

export interface ThreeCalendarDate {
  gregorian: string;
  bangla: string;
  hijri: string;
}

/**
 * One Gregorian day written out in all three calendars, each in full.
 * Bangla/Hijri come from the shared libs (never reimplemented here);
 * the Hijri part is the tabular date — see the UI note about ±1 day.
 */
export function formatThreeCalendars(
  year: number,
  month: number,
  day: number,
  lang: 'bn' | 'en',
): ThreeCalendarDate | null {
  const bangla = gregorianToBangla(year, month, day);
  if (!bangla) return null;
  const hijri = formatHijri(gregorianToHijri(year, month, day), lang);
  return {
    gregorian: formatGregorian(year, month, day, lang),
    bangla: formatBangla(bangla, lang),
    // formatHijri leaves Latin digits even in Bangla mode; convert them
    // so the Bangla summary reads fully in Bangla digits.
    hijri: lang === 'bn' ? toBanglaDigits(hijri) : hijri,
  };
}
