// Time zones (shared engine) — unit tests.
// Hand-checks: 2026-11-27 15:00 in Dhaka is 09:00 in London and
// 04:00 in New York (winter offsets UTC+6 / UTC+0 / UTC-5).
import { describe, it, expect } from 'vitest';
import {
  COMMON_TIME_ZONES,
  formatInZone,
  hourInZone,
  isWorkingHour,
  planMeetingTime,
  convertBetweenZones,
  wallClockInZoneToDate,
} from '../../tools/timeZones';

describe('time-zone engine', () => {
  it('lists Dhaka first and includes the common zones', () => {
    expect(COMMON_TIME_ZONES[0].zone).toBe('Asia/Dhaka');
    const zones = COMMON_TIME_ZONES.map((z) => z.zone);
    expect(zones).toContain('Europe/London');
    expect(zones).toContain('America/New_York');
    expect(zones).toContain('Asia/Riyadh');
  });

  it('converts 15:00 Dhaka to 09:00 London on 27 Nov 2026', () => {
    const out = convertBetweenZones('2026-11-27', '15:00', 'Asia/Dhaka', 'Europe/London');
    expect(out).not.toBeNull();
    expect(out?.toLocal).toContain('09:00');
    expect(out?.fromLocal).toContain('15:00');
  });

  it('converts 15:00 Dhaka to 04:00 New York the same day', () => {
    const out = convertBetweenZones('2026-11-27', '15:00', 'Asia/Dhaka', 'America/New_York');
    expect(out?.toLocal).toContain('04:00');
  });

  it('15:00 Dhaka is a working hour in London but not in New York', () => {
    const instant = wallClockInZoneToDate('2026-11-27', '15:00', 'Asia/Dhaka');
    expect(instant).not.toBeNull();
    expect(hourInZone(instant as Date, 'Europe/London')).toBe(9);
    expect(isWorkingHour(instant as Date, 'Europe/London')).toBe(true);
    expect(isWorkingHour(instant as Date, 'America/New_York')).toBe(false);
  });

  it('planMeetingTime returns one row per zone', () => {
    const instant = wallClockInZoneToDate('2026-11-27', '15:00', 'Asia/Dhaka') as Date;
    const rows = planMeetingTime(instant, ['Asia/Dhaka', 'Europe/London']);
    expect(rows).toHaveLength(2);
    expect(rows[0].localTime).toContain('15:00');
    expect(rows[1].localTime).toContain('09:00');
  });

  it('rejects malformed date/time input', () => {
    expect(wallClockInZoneToDate('27-11-2026', '15:00', 'Asia/Dhaka')).toBeNull();
    expect(convertBetweenZones('2026-11-27', '25:00', 'Asia/Dhaka', 'Europe/London')).toBeNull();
  });

  it('formatInZone renders Bangla when asked', () => {
    const d = wallClockInZoneToDate('2026-11-27', '15:00', 'Asia/Dhaka') as Date;
    expect(formatInZone(d, 'Asia/Dhaka', 'bn')).toContain('২০২৬');
  });
});
