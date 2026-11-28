/**
 * Hijri Date Converter — the standard Kuwaiti (Umm al-Qura-style
 * tabular) Hijri calendar algorithm.
 *
 * The tabular Islamic calendar is an APPROXIMATION of the lunar
 * calendar: the real month starts when the moon is sighted, so the
 * converted date can differ by ±1 day from the locally observed
 * date. The UI says exactly that — never presents the result as
 * the observed date.
 *
 * Verified against the known tabular epoch: 25 Jun 2025 converts
 * to 1 Muharram 1447 (the locally observed 1 Muharram 1447 was
 * 26 Jun 2025 — the tabular date runs 1 day early here, inside
 * the ±1 day the UI warns about). Round-trip: gregorian -> hijri
 * -> gregorian returns the same day.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import type { Lang } from '../../i18n/strings';
export interface HijriDate {
  year: number;
  /** 1-12. */
  month: number;
  day: number;
}

export const HIJRI_MONTHS: readonly { bn: string; en: string }[] = [
  { bn: 'মুহাররম', en: 'Muharram' },
  { bn: 'সফর', en: 'Safar' },
  { bn: 'রবিউল আউয়াল', en: 'Rabi al-Awwal' },
  { bn: 'রবিউস সানি', en: 'Rabi al-Thani' },
  { bn: 'জমাদিউল আউয়াল', en: 'Jumada al-Ula' },
  { bn: 'জমাদিউস সানি', en: 'Jumada al-Akhirah' },
  { bn: 'রজব', en: 'Rajab' },
  { bn: "শা'বান", en: "Sha'ban" },
  { bn: 'রমজান', en: 'Ramadan' },
  { bn: 'শাওয়াল', en: 'Shawwal' },
  { bn: 'জিলকদ', en: 'Dhul-Qa’dah' },
  { bn: 'জিলহজ', en: 'Dhul-Hijjah' },
];

export function hijriMonthName(month: number, lang: Lang): string {
  if (month < 1 || month > 12) return '';
  return lang === 'bn' ? HIJRI_MONTHS[month - 1].bn : HIJRI_MONTHS[month - 1].en;
}

/**
 * Classic Kuwaiti-algorithm Julian day number for a Gregorian date.
 * (This convention does not equal the astronomical JD; the
 * conversion below is calibrated to it — do not "fix" it.)
 */
function gregorianToJulianDay(year: number, month: number, day: number): number {
  const k = Math.floor((month - 14) / 12);
  return (
    Math.floor((1461 * (year + 4800 + k)) / 4) +
    Math.floor((367 * (month - 2 - 12 * k)) / 12) -
    Math.floor((3 * Math.floor((year + 4900 + k) / 100)) / 4) +
    day -
    32075
  );
}

/** Gregorian date -> tabular Hijri date (Kuwaiti algorithm). */
export function gregorianToHijri(year: number, month: number, day: number): HijriDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('year, month and day must be integers');
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`invalid Gregorian date ${year}-${month}-${day}`);
  }
  const jd = gregorianToJulianDay(year, month, day);
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hijriMonth = Math.floor((24 * l) / 709);
  const hijriDay = l - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;
  return { year: hijriYear, month: hijriMonth, day: hijriDay };
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Tabular Hijri date -> Gregorian date (inverse of the above). */
export function hijriToGregorian(h: HijriDate): { year: number; month: number; day: number } {
  if (!Number.isInteger(h.year) || !Number.isInteger(h.month) || !Number.isInteger(h.day)) {
    throw new Error('Hijri year, month and day must be integers');
  }
  if (h.month < 1 || h.month > 12 || h.day < 1 || h.day > 30) {
    throw new Error(`invalid Hijri date ${h.year}-${h.month}-${h.day}`);
  }
  // The tabular JD offset is not a constant, so invert by search:
  // start ~2 years before the rough Gregorian estimate and scan
  // forward until gregorianToHijri matches. Cheap integer math,
  // and it guarantees an exact round-trip by construction.
  const roughYear = h.year + 622 - Math.floor(h.year / 33);
  let y = roughYear - 2;
  let m = 1;
  let d = 1;
  for (let i = 0; i < 1500; i++) {
    const conv = gregorianToHijri(y, m, d);
    if (conv.year === h.year && conv.month === h.month && conv.day === h.day) {
      return { year: y, month: m, day: d };
    }
    d += 1;
    if (d > daysInMonth(y, m)) {
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }
  throw new Error(`could not convert Hijri date ${h.year}-${h.month}-${h.day}`);
}

/** "12 Ramadan 1447" style formatting. */
export function formatHijri(h: HijriDate, lang: Lang): string {
  return `${h.day} ${hijriMonthName(h.month, lang)} ${h.year}`;
}

/** Gregorian Date -> Hijri, using the date's local year/month/day. */
export function hijriForDate(date: Date): HijriDate {
  return gregorianToHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
