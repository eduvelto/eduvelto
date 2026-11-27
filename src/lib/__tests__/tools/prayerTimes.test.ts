// Prayer Times (Tool #91) — unit tests.
//
// Expected Dhaka values are hand-verified against PUBLISHED timetables for
// 26 Nov 2026 (prayertime.info, salaah-times.com MWL, themumin.com —
// Fajr 05:01, Sunrise 06:20, Dhuhr 11:46-11:47, Asr 14:50 with shadow
// factor 1, Maghrib 17:11, Isha 18:26-18:30). Methods disagree by a few
// minutes, so each time is asserted within +/-5 minutes of the published
// value, plus strict ordering. That is the honest check for an
// astronomical calculation: exact-minute agreement with one timetable
// would only prove the function agrees with that timetable's conventions.
import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes } from '../../tools/prayerTimes';

function toMinutes(hhmm: string | null): number {
  if (hhmm === null) throw new Error('expected a time string, got null');
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Assert a computed time is within `toleranceMinutes` of the expected HH:MM. */
function expectNear(actual: string | null, expected: string, toleranceMinutes = 5): void {
  const diff = Math.abs(toMinutes(actual) - toMinutes(expected));
  expect(diff).toBeLessThanOrEqual(toleranceMinutes);
}

const DHAKA = { latitude: 23.81, longitude: 90.41, timeZone: 6 };

describe('calculatePrayerTimes — Dhaka, 26 Nov 2026 (published timetable)', () => {
  const times = calculatePrayerTimes({ ...DHAKA, date: new Date(2026, 10, 26) });

  it('matches the published Fajr (05:01) within 5 minutes', () => {
    expectNear(times.fajr, '05:01');
  });

  it('matches the published Sunrise (06:20) within 5 minutes', () => {
    expectNear(times.sunrise, '06:20');
  });

  it('matches the published Dhuhr (11:47) within 5 minutes', () => {
    expectNear(times.dhuhr, '11:47');
  });

  it('matches the published Asr, shadow factor 1 (14:50), within 5 minutes', () => {
    expectNear(times.asr, '14:50');
  });

  it('matches the published Maghrib (17:11) within 5 minutes', () => {
    expectNear(times.maghrib, '17:11');
  });

  it('matches the published Isha (18:26-18:30) within 5 minutes of 18:28', () => {
    expectNear(times.isha, '18:28');
  });

  it('is strictly ordered: fajr < sunrise < dhuhr < asr < maghrib < isha', () => {
    const order = [times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha];
    const minutes = order.map(toMinutes);
    for (let i = 1; i < minutes.length; i++) {
      expect(minutes[i]).toBeGreaterThan(minutes[i - 1]);
    }
  });

  it('returns HH:MM 24-hour strings', () => {
    for (const value of Object.values(times)) {
      expect(value).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});

describe('calculatePrayerTimes — behaviour', () => {
  it('stays ordered on a summer day in Dhaka (15 Jun 2026)', () => {
    const times = calculatePrayerTimes({ ...DHAKA, date: new Date(2026, 5, 15) });
    const minutes = [times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha].map(
      toMinutes,
    );
    for (let i = 1; i < minutes.length; i++) {
      expect(minutes[i]).toBeGreaterThan(minutes[i - 1]);
    }
    // Summer days are longer: sunrise is earlier and maghrib later than in November.
    expect(toMinutes(times.sunrise)).toBeLessThan(toMinutes('06:20'));
    expect(toMinutes(times.maghrib)).toBeGreaterThan(toMinutes('17:11'));
  });

  it('Hanafi Asr (shadow factor 2) is later than Shafi\u2019i Asr (factor 1)', () => {
    const date = new Date(2026, 10, 26);
    const shafii = calculatePrayerTimes({ ...DHAKA, date, asrShadowFactor: 1 });
    const hanafi = calculatePrayerTimes({ ...DHAKA, date, asrShadowFactor: 2 });
    expect(toMinutes(hanafi.asr)).toBeGreaterThan(toMinutes(shafii.asr));
    // Published Hanafi Asr for Dhaka 26 Nov 2026 is 15:35.
    expectNear(hanafi.asr, '15:35');
  });

  it('a larger Fajr angle gives an earlier Fajr (18 deg vs 15 deg)', () => {
    const date = new Date(2026, 10, 26);
    const mwf = calculatePrayerTimes({ ...DHAKA, date, fajrAngle: 18 });
    const isna = calculatePrayerTimes({ ...DHAKA, date, fajrAngle: 15 });
    expect(toMinutes(mwf.fajr)).toBeLessThan(toMinutes(isna.fajr));
  });

  it('rejects invalid latitude, longitude and angles', () => {
    const date = new Date(2026, 10, 26);
    expect(() => calculatePrayerTimes({ ...DHAKA, latitude: 100, date })).toThrow(/latitude/);
    expect(() => calculatePrayerTimes({ ...DHAKA, longitude: 200, date })).toThrow(/longitude/);
    expect(() => calculatePrayerTimes({ ...DHAKA, date, fajrAngle: 0 })).toThrow(/fajrAngle/);
    expect(() => calculatePrayerTimes({ ...DHAKA, date, asrShadowFactor: 0 })).toThrow(
      /asrShadowFactor/,
    );
    expect(() =>
      calculatePrayerTimes({ ...DHAKA, date: new Date('not a date') }),
    ).toThrow(/valid Date/);
  });
});
