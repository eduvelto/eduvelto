/**
 * Bangla (Bengali) calendar — official Bangladesh revised calendar
 * (Bangladesh Gazette, 2019 revision, in force since 2019).
 *
 * - New year (1 Boishakh) is 14 April every year.
 * - Month lengths: Boishakh–Ashwin 31 days each; Kartik–Magh 30 days;
 *   Falgun 29 days, 30 days in a Gregorian leap year; Choitro 30 days.
 *   (Total 365 days, 366 in a leap year — the extra day is the 29 Feb
 *   inside Falgun, so Pohela Boishakh stays on 14 April every year.)
 *   NOTE: the pre-2019 rule had Falgun 30/31 days; the 2019 revision
 *   moved one day from Falgun to Ashwin (31 days). Verified against
 *   Wikipedia "Bangladeshi national calendar" and bangladatetoday.com:
 *   21 Feb is always 8 Falgun, 26 Mar always 12 Choitro, 16 Dec always
 *   1 Poush, 1 Jan 2026 = 17 Poush 1432.
 * - Bangla year = Gregorian year − 593 on/after 14 April, − 594 before.
 * - Falgun's leap-day year is the Gregorian year in which Falgun falls
 *   (Bangla year + 594): e.g. Falgun 1434 falls in Feb–Mar 2028, a leap
 *   year, so it has 31 days.
 *
 * This is the BANGLADESH calendar. West Bengal's traditional (unrevised)
 * Bengali calendar can differ by a day — the UI says so.
 *
 * Pure functions only: no React, no network, no storage.
 */

export interface BanglaDate {
  year: number;
  /** 1-12. */
  month: number;
  day: number;
}

export const BANGLA_MONTHS: readonly { bn: string; en: string }[] = [
  { bn: 'বৈশাখ', en: 'Boishakh' },
  { bn: 'জ্যৈষ্ঠ', en: 'Joishtho' },
  { bn: 'আষাঢ়', en: 'Asharh' },
  { bn: 'শ্রাবণ', en: 'Shrabon' },
  { bn: 'ভাদ্র', en: 'Bhadro' },
  { bn: 'আশ্বিন', en: 'Ashwin' },
  { bn: 'কার্তিক', en: 'Kartik' },
  { bn: 'অগ্রহায়ণ', en: 'Ogrohayon' },
  { bn: 'পৌষ', en: 'Poush' },
  { bn: 'মাঘ', en: 'Magh' },
  { bn: 'ফাল্গুন', en: 'Falgun' },
  { bn: 'চৈত্র', en: 'Choitro' },
];

export function banglaMonthName(month: number, lang: 'bn' | 'en'): string {
  if (month < 1 || month > 12) return '';
  return lang === 'bn' ? BANGLA_MONTHS[month - 1].bn : BANGLA_MONTHS[month - 1].en;
}

export function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** Days in a Bangla month of a given Bangla year. */
export function banglaMonthLength(banglaYear: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 10) return 30;
  if (month === 11) return isGregorianLeapYear(banglaYear + 594) ? 30 : 29;
  if (month === 12) return 30;
  return 0;
}

function gregorianDaysInMonth(year: number, month: number): number {
  if (month === 2) return isGregorianLeapYear(year) ? 29 : 28;
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isValidGregorian(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= gregorianDaysInMonth(year, month);
}

/** Days between two Gregorian dates (date2 − date1), computed by walking days. */
function gregorianDayDiff(
  y1: number,
  m1: number,
  d1: number,
  y2: number,
  m2: number,
  d2: number,
): number {
  // Both dates are within ~1 year of each other in our uses; a day walk is exact.
  let days = 0;
  let y = y1;
  let m = m1;
  let d = d1;
  // Forward walk only when date2 >= date1; callers guarantee that.
  while (!(y === y2 && m === m2 && d === d2)) {
    d += 1;
    if (d > gregorianDaysInMonth(y, m)) {
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    days += 1;
    if (days > 400) break; // safety; never reached for real inputs
  }
  return days;
}

function addGregorianDays(year: number, month: number, day: number, offset: number): { year: number; month: number; day: number } {
  let y = year;
  let m = month;
  let d = day;
  let left = offset;
  while (left > 0) {
    d += 1;
    if (d > gregorianDaysInMonth(y, m)) {
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    left -= 1;
  }
  return { year: y, month: m, day: d };
}

/** Gregorian date -> Bangla date (Bangladesh revised calendar). Null on bad input. */
export function gregorianToBangla(year: number, month: number, day: number): BanglaDate | null {
  if (!isValidGregorian(year, month, day)) return null;
  const onOrAfterNewYear = month > 4 || (month === 4 && day >= 14);
  const banglaYear = onOrAfterNewYear ? year - 593 : year - 594;
  const startYear = banglaYear + 593; // Gregorian year of 1 Boishakh
  const offset = gregorianDayDiff(startYear, 4, 14, year, month, day);
  let remaining = offset;
  let banglaMonth = 1;
  while (banglaMonth <= 12) {
    const len = banglaMonthLength(banglaYear, banglaMonth);
    if (remaining < len) break;
    remaining -= len;
    banglaMonth += 1;
  }
  return { year: banglaYear, month: banglaMonth, day: remaining + 1 };
}

/** Bangla date -> Gregorian date (Bangladesh revised calendar). Null on bad input. */
export function banglaToGregorian(b: BanglaDate): { year: number; month: number; day: number } | null {
  if (!b || !Number.isInteger(b.year) || !Number.isInteger(b.month) || !Number.isInteger(b.day)) return null;
  if (b.month < 1 || b.month > 12 || b.day < 1) return null;
  if (b.day > banglaMonthLength(b.year, b.month)) return null;
  let offset = b.day - 1;
  for (let m = 1; m < b.month; m++) offset += banglaMonthLength(b.year, m);
  return addGregorianDays(b.year + 593, 4, 14, offset);
}

/** "১ বৈশাখ ১৪৩৩" / "1 Boishakh 1433" style formatting. */
export function formatBangla(b: BanglaDate, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    const bnDigits = '০১২৩৪৫৬৭৮৯';
    const toBn = (n: number): string => String(n).replace(/\d/g, (d) => bnDigits[Number(d)]);
    return `${toBn(b.day)} ${banglaMonthName(b.month, 'bn')} ${toBn(b.year)}`;
  }
  return `${b.day} ${banglaMonthName(b.month, 'en')} ${b.year}`;
}
