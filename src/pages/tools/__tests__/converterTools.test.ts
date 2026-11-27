import { describe, expect, it } from 'vitest';
import {
  convertVolume,
  convertDataStorage,
  convertDataTransferSpeed,
  convertPressure,
  convertEnergy,
  convertPower,
  convertAngle,
  convertTime,
  convertFrequency,
  convertFuelEconomy,
  convertCooking,
  convertShoeSize,
  convertClothingSize,
  calculatePpi,
  simplifyAspectRatio,
  aspectRatioString,
  findMissingDimension,
  pxToRem,
  remToPx,
  alarmDelayMs,
  formatCountdown,
  isoWeekNumber,
  isLeapYear,
  gregorianToJulianDay,
  julianDayToGregorian,
  convertLinear,
  VOLUME_TABLE,
} from '../../../lib/tools/converterTools';
import {
  gregorianToBangla,
  banglaToGregorian,
  banglaMonthLength,
  isGregorianLeapYear,
} from '../../../lib/tools/banglaDate';

const close = (a: number | null, b: number, tol = 1e-6): boolean =>
  a !== null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

describe('generic linear conversion', () => {
  it('converts and round-trips', () => {
    expect(close(convertVolume(1, 'gallon', 'litre'), 3.78541, 1e-5)).toBe(true);
    const there = convertVolume(2, 'litre', 'cup');
    const back = there === null ? null : convertVolume(there, 'cup', 'litre');
    expect(close(back, 2)).toBe(true);
  });
  it('returns null for invalid input', () => {
    expect(convertVolume(Number.NaN, 'litre', 'cup')).toBeNull();
    expect(convertVolume(1, 'litre', 'nope')).toBeNull();
    expect(convertVolume(1, 'nope', 'litre')).toBeNull();
    expect(convertLinear(1, 'litre', 'litre', VOLUME_TABLE)).toBe(1);
  });
});

describe('volume', () => {
  it('known answers', () => {
    expect(close(convertVolume(1, 'litre', 'millilitre'), 1000)).toBe(true);
    expect(close(convertVolume(1, 'cup', 'millilitre'), 236.588, 1e-4)).toBe(true);
    expect(close(convertVolume(1, 'gallon', 'cup'), 16, 1e-3)).toBe(true);
    expect(close(convertVolume(1, 'cubic-metre', 'litre'), 1000)).toBe(true);
    expect(close(convertVolume(3, 'teaspoon', 'tablespoon'), 1, 1e-5)).toBe(true);
  });
});

describe('data storage', () => {
  it('decimal vs binary is honest', () => {
    expect(convertDataStorage(1, 'kilobyte', 'byte')).toBe(1000);
    expect(convertDataStorage(1, 'kibibyte', 'byte')).toBe(1024);
    expect(convertDataStorage(1, 'gigabyte', 'megabyte')).toBe(1000);
    expect(convertDataStorage(1, 'gibibyte', 'mebibyte')).toBe(1024);
    expect(convertDataStorage(8, 'bit', 'byte')).toBe(1);
    expect(close(convertDataStorage(1, 'terabyte', 'gigabyte'), 1000)).toBe(true);
  });
});

describe('data transfer speed', () => {
  it('bits vs bytes', () => {
    expect(convertDataTransferSpeed(1, 'megabyte-per-second', 'mbps')).toBe(8);
    expect(convertDataTransferSpeed(100, 'mbps', 'megabyte-per-second')).toBe(12.5);
    expect(convertDataTransferSpeed(1, 'gbps', 'mbps')).toBe(1000);
  });
});

describe('pressure', () => {
  it('known answers', () => {
    expect(close(convertPressure(1, 'atmosphere', 'pascal'), 101325)).toBe(true);
    expect(close(convertPressure(1, 'bar', 'pascal'), 100000)).toBe(true);
    expect(close(convertPressure(1, 'psi', 'kilopascal'), 6.894757, 1e-5)).toBe(true);
    expect(close(convertPressure(760, 'mmhg', 'atmosphere'), 1, 1e-4)).toBe(true);
    expect(close(convertPressure(1, 'torr', 'mmhg'), 1)).toBe(true);
  });
});

describe('energy', () => {
  it('known answers', () => {
    expect(convertEnergy(1, 'kilowatthour', 'joule')).toBe(3600000);
    expect(close(convertEnergy(1, 'kilocalorie', 'joule'), 4184)).toBe(true);
    expect(close(convertEnergy(1, 'btu', 'joule'), 1055.06, 1e-4)).toBe(true);
    expect(close(convertEnergy(1000, 'calorie', 'kilocalorie'), 1)).toBe(true);
  });
});

describe('power', () => {
  it('known answers', () => {
    expect(convertPower(1, 'kilowatt', 'watt')).toBe(1000);
    expect(close(convertPower(1, 'horsepower', 'watt'), 745.7)).toBe(true);
    expect(close(convertPower(1, 'btu-per-hour', 'watt'), 0.29307107, 1e-5)).toBe(true);
  });
});

describe('angle', () => {
  it('known answers', () => {
    expect(close(convertAngle(180, 'degree', 'radian'), Math.PI)).toBe(true);
    expect(close(convertAngle(Math.PI, 'radian', 'degree'), 180)).toBe(true);
    expect(convertAngle(100, 'gradian', 'degree')).toBe(90);
    expect(convertAngle(1, 'turn', 'degree')).toBe(360);
    expect(close(convertAngle(90, 'degree', 'turn'), 0.25)).toBe(true);
  });
});

describe('time', () => {
  it('known answers', () => {
    expect(convertTime(1, 'day', 'hour')).toBe(24);
    expect(convertTime(1, 'week', 'day')).toBe(7);
    expect(convertTime(60, 'minute', 'hour')).toBe(1);
    expect(close(convertTime(1, 'year', 'day'), 365.25)).toBe(true);
    expect(close(convertTime(1, 'month', 'day'), 30.4375)).toBe(true); // ≈30.44 days
    expect(convertTime(1000, 'millisecond', 'second')).toBe(1);
  });
});

describe('frequency', () => {
  it('known answers', () => {
    expect(convertFrequency(1, 'gigahertz', 'megahertz')).toBe(1000);
    expect(convertFrequency(2.4, 'gigahertz', 'hertz')).toBe(2400000000);
    expect(convertFrequency(1, 'terahertz', 'gigahertz')).toBe(1000);
  });
});

describe('fuel economy', () => {
  it('known answers and round-trip', () => {
    // 10 km/L = 10 L/100km; 10 km/L ≈ 23.52 mpg US
    expect(close(convertFuelEconomy(10, 'km-per-litre', 'litre-per-100km'), 10)).toBe(true);
    expect(close(convertFuelEconomy(10, 'km-per-litre', 'mpg-us'), 23.5215, 1e-4)).toBe(true);
    expect(close(convertFuelEconomy(30, 'mpg-us', 'km-per-litre'), 12.7543, 1e-4)).toBe(true);
    expect(close(convertFuelEconomy(40, 'mpg-uk', 'mpg-us'), 33.306, 1e-3)).toBe(true);
    const back = convertFuelEconomy(
      convertFuelEconomy(15, 'km-per-litre', 'mpg-uk') ?? Number.NaN,
      'mpg-uk',
      'km-per-litre',
    );
    expect(close(back, 15)).toBe(true);
    expect(convertFuelEconomy(0, 'km-per-litre', 'mpg-us')).toBeNull();
    expect(convertFuelEconomy(-5, 'km-per-litre', 'mpg-us')).toBeNull();
  });
});

describe('cooking measurement', () => {
  it('known answers', () => {
    expect(close(convertCooking(1, 'cup', 'millilitre'), 236.588, 1e-4)).toBe(true);
    expect(close(convertCooking(1, 'cup', 'tablespoon'), 16, 1e-3)).toBe(true);
    expect(close(convertCooking(100, 'gram', 'millilitre', 'water'), 100)).toBe(true);
    // 1 cup flour ≈ 236.588 × 0.53 ≈ 125.4 g
    expect(close(convertCooking(1, 'cup', 'gram', 'flour'), 125.39, 1e-3)).toBe(true);
    expect(close(convertCooking(1, 'cup', 'gram', 'honey'), 335.95, 1e-3)).toBe(true);
    expect(convertCooking(1, 'cup', 'nope')).toBeNull();
  });
});

describe('shoe size', () => {
  it('known chart answers', () => {
    expect(convertShoeSize(9, 'us', 'uk', 'men')).toBe(8.5);
    expect(convertShoeSize(9, 'us', 'eu', 'men')).toBe(42.5);
    expect(convertShoeSize(9, 'us', 'jp', 'men')).toBe(27);
    expect(convertShoeSize(8, 'us', 'uk', 'women')).toBe(6);
    expect(convertShoeSize(8, 'us', 'eu', 'women')).toBe(39);
    expect(convertShoeSize(8, 'us', 'jp', 'women')).toBe(25);
    expect(convertShoeSize(99, 'us', 'eu', 'men')).toBeNull();
  });
});

describe('clothing size', () => {
  it('known chart answers', () => {
    expect(convertClothingSize('M', 'label', 'us', 'men')).toBe('38');
    expect(convertClothingSize('M', 'label', 'eu', 'men')).toBe('48');
    expect(convertClothingSize('L', 'label', 'uk', 'women')).toBe('16–18');
    expect(convertClothingSize('40', 'eu', 'label', 'women')).toBe('M');
    expect(convertClothingSize('XXXL', 'label', 'eu', 'men')).toBeNull();
  });
});

describe('dpi / ppi', () => {
  it('known answers', () => {
    // 1920×1080 on a 24" screen ≈ 91.79 ppi
    expect(close(calculatePpi(1920, 1080, 24), 91.79, 1e-3)).toBe(true);
    expect(calculatePpi(1920, 1080, 0)).toBeNull();
    expect(calculatePpi(-1, 1080, 24)).toBeNull();
  });
});

describe('aspect ratio', () => {
  it('simplifies and finds missing dimensions', () => {
    expect(simplifyAspectRatio(1920, 1080)).toEqual({ w: 16, h: 9 });
    expect(aspectRatioString(1280, 720)).toBe('16:9');
    expect(aspectRatioString(100, 100)).toBe('1:1');
    expect(findMissingDimension(1920, true, 16, 9)).toBe(1080);
    expect(findMissingDimension(1080, false, 16, 9)).toBe(1920);
    expect(simplifyAspectRatio(0, 100)).toBeNull();
    expect(findMissingDimension(0, true, 16, 9)).toBeNull();
  });
});

describe('px to rem', () => {
  it('known answers', () => {
    expect(pxToRem(32, 16)).toBe(2);
    expect(pxToRem(24)).toBe(1.5);
    expect(remToPx(2, 16)).toBe(32);
    expect(pxToRem(16, 0)).toBeNull();
    expect(remToPx(Number.NaN)).toBeNull();
  });
});

describe('alarm', () => {
  it('delay until next occurrence', () => {
    // 2026-11-27 10:00 local -> alarm 11:00 same day = 1h
    const now = new Date(2026, 10, 27, 10, 0, 0).getTime();
    expect(alarmDelayMs(now, 11, 0)).toBe(60 * 60 * 1000);
    // alarm 09:00 already passed -> tomorrow, 23h later
    expect(alarmDelayMs(now, 9, 0)).toBe(23 * 60 * 60 * 1000);
    expect(alarmDelayMs(now, 25, 0)).toBeNull();
    expect(formatCountdown(3661000)).toBe('1h 1m 1s');
    expect(formatCountdown(90000)).toBe('1m 30s');
    expect(formatCountdown(45000)).toBe('45s');
  });
});

describe('ISO week number', () => {
  it('known answers (ISO 8601)', () => {
    // 2026-01-01 (Thu) is week 1 of 2026; 2025-12-29 (Mon) is week 1 of 2026
    expect(isoWeekNumber(2026, 1, 1)).toEqual({ isoYear: 2026, week: 1 });
    expect(isoWeekNumber(2025, 12, 29)).toEqual({ isoYear: 2026, week: 1 });
    expect(isoWeekNumber(2026, 1, 5)).toEqual({ isoYear: 2026, week: 2 });
    expect(isoWeekNumber(2020, 12, 31)).toEqual({ isoYear: 2020, week: 53 });
    expect(isoWeekNumber(2021, 1, 1)).toEqual({ isoYear: 2020, week: 53 });
    expect(isoWeekNumber(2026, 2, 30)).toBeNull();
  });
});

describe('leap year', () => {
  it('Gregorian rule', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2024.5)).toBeNull();
  });
});

describe('Julian date', () => {
  it('known day number and round-trip', () => {
    expect(gregorianToJulianDay(2000, 1, 1)).toBe(2451545);
    expect(julianDayToGregorian(2451545)).toEqual({ year: 2000, month: 1, day: 1 });
    const jd = gregorianToJulianDay(2026, 11, 27);
    expect(jd).not.toBeNull();
    expect(julianDayToGregorian(jd as number)).toEqual({ year: 2026, month: 11, day: 27 });
    expect(gregorianToJulianDay(2026, 13, 1)).toBeNull();
    expect(julianDayToGregorian(2451545.5)).toBeNull();
  });
});

describe('Bangla date (Bangladesh revised calendar)', () => {
  it('known dates, computed from the rule', () => {
    // 14 Apr 2026 is 1 Boishakh 1433 (new year; 2026 − 593)
    expect(gregorianToBangla(2026, 4, 14)).toEqual({ year: 1433, month: 1, day: 1 });
    // 1 Jan 2026: Bangla year 1432 (before 14 Apr); Poush starts 16 Dec 2025,
    // so 1 Jan is day 17 of Poush (16 Dec = day 1, +16 days).
    expect(gregorianToBangla(2026, 1, 1)).toEqual({ year: 1432, month: 9, day: 17 });
    // 13 Apr 2026 is the last day of 1432: 30 Choitro
    expect(gregorianToBangla(2026, 4, 13)).toEqual({ year: 1432, month: 12, day: 30 });
    // 14 Apr 2025 = 1 Boishakh 1432
    expect(gregorianToBangla(2025, 4, 14)).toEqual({ year: 1432, month: 1, day: 1 });
  });
  it('Falgun leap rule (2019 revision: 29 days, 30 in a leap year)', () => {
    // Falgun 1434 falls in Feb–Mar 2028 (leap year) -> 30 days
    expect(banglaMonthLength(1434, 11)).toBe(30);
    // Falgun 1432 falls in Feb–Mar 2026 (not leap) -> 29 days
    expect(banglaMonthLength(1432, 11)).toBe(29);
    expect(isGregorianLeapYear(2028)).toBe(true);
    expect(isGregorianLeapYear(2026)).toBe(false);
    // Fixed national-day anchors: 21 Feb = 8 Falgun, 26 Mar = 12 Choitro,
    // 16 Dec = 1 Poush, every year.
    expect(gregorianToBangla(2026, 2, 21)).toEqual({ year: 1432, month: 11, day: 8 });
    expect(gregorianToBangla(2026, 3, 26)).toEqual({ year: 1432, month: 12, day: 12 });
    expect(gregorianToBangla(2025, 12, 16)).toEqual({ year: 1432, month: 9, day: 1 });
  });
  it('round-trips both directions', () => {
    const cases: Array<[number, number, number]> = [
      [2026, 4, 14],
      [2026, 1, 1],
      [2028, 2, 29],
      [2027, 3, 15],
      [2025, 12, 31],
    ];
    for (const [y, m, d] of cases) {
      const b = gregorianToBangla(y, m, d);
      expect(b).not.toBeNull();
      expect(banglaToGregorian(b as { year: number; month: number; day: number })).toEqual({ year: y, month: m, day: d });
    }
    // Leap-day Falgun: 29 Feb 2028 is in Falgun 1434; reverse must land back.
    expect(gregorianToBangla(2028, 2, 29)).toEqual({ year: 1434, month: 11, day: 16 });
    expect(banglaToGregorian({ year: 1434, month: 11, day: 30 })).toEqual({ year: 2028, month: 3, day: 14 });
    expect(gregorianToBangla(2026, 2, 30)).toBeNull();
    expect(banglaToGregorian({ year: 1432, month: 11, day: 30 })).toBeNull();
  });
});
