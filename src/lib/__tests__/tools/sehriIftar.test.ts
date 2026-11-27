// Sehri & Iftar Time — unit tests.
// Reuses calculatePrayerTimes, so the checks pin the mapping
// (Sehri = Fajr, Iftar = Maghrib) against the published Dhaka
// timetable for 26 Nov 2026 (Fajr ~05:01, Maghrib ~17:11, ±5 min).
import { describe, it, expect } from 'vitest';
import { getSehriIftar, fastingMinutes } from '../../tools/sehriIftar';

const DHAKA = { latitude: 23.81, longitude: 90.41, timeZone: 6, date: new Date(2026, 10, 26) };

function toMinutes(hhmm: string | null): number {
  if (!hhmm) throw new Error('expected a time string');
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

describe('getSehriIftar', () => {
  it('Sehri is Fajr (~05:01) and Iftar is Maghrib (~17:11) in Dhaka', () => {
    const r = getSehriIftar(DHAKA);
    expect(r.sehri).toBe(r.fajr);
    expect(r.iftar).toBe(r.maghrib);
    expect(Math.abs(toMinutes(r.sehri) - toMinutes('05:01'))).toBeLessThanOrEqual(5);
    expect(Math.abs(toMinutes(r.iftar) - toMinutes('17:11'))).toBeLessThanOrEqual(5);
  });

  it('fasting lasts about 12 h 10 min that day', () => {
    const r = getSehriIftar(DHAKA);
    const mins = fastingMinutes(r);
    expect(mins).not.toBeNull();
    expect(Math.abs((mins as number) - 730)).toBeLessThanOrEqual(10);
  });

  it('summer days fast longer than winter days', () => {
    const summer = fastingMinutes(getSehriIftar({ ...DHAKA, date: new Date(2026, 5, 15) }));
    const winter = fastingMinutes(getSehriIftar(DHAKA));
    expect(summer as number).toBeGreaterThan(winter as number);
  });
});
