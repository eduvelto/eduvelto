import { describe, expect, it } from 'vitest';
import {
  parseUnixInput,
  unixToDate,
  dateToUnix,
  dateDifference,
  addDays,
  parseDuration,
  formatDuration,
  durationBetween,
} from '../../tools/dateTimeTools';

describe('unix timestamps', () => {
  it('epoch 0 is 1970-01-01 00:00 UTC and 06:00 in Dhaka', () => {
    const r = unixToDate(0);
    expect(r.isoUtc).toBe('1970-01-01T00:00:00.000Z');
    expect(r.dhaka).toContain('01/01/1970');
    expect(r.dhaka).toContain('06:00:00');
  });
  it('auto-detects seconds vs milliseconds', () => {
    expect(parseUnixInput('1700000000')).toEqual({ seconds: 1700000000, millis: false });
    expect(parseUnixInput('1700000000000')).toEqual({ seconds: 1700000000, millis: true });
    expect(() => parseUnixInput('abc')).toThrow(/digits only/);
  });
  it('round-trips Dhaka local time', () => {
    const seconds = dateToUnix('2026-11-27', '14:22', 'Asia/Dhaka');
    const back = unixToDate(seconds);
    expect(back.dhaka).toContain('27/11/2026');
    expect(back.dhaka).toContain('14:22:00');
    // Dhaka is UTC+6: 14:22 Dhaka = 08:22 UTC.
    expect(back.utc).toContain('08:22:00');
  });
});

describe('dateDifference', () => {
  it('counts 30 days for Nov 1 -> Dec 1 2026', () => {
    const r = dateDifference('2026-11-01', '2026-12-01');
    expect(r.days).toBe(30);
    expect(r.calendar).toEqual({ years: 0, months: 1, days: 0 });
  });
  it('same date is 0 days, not 1', () => {
    expect(dateDifference('2026-11-27', '2026-11-27').days).toBe(0);
  });
  it('reversed dates go negative with a clear sign', () => {
    expect(dateDifference('2026-12-01', '2026-11-01').days).toBe(-30);
  });
  it('Fri 27 -> Mon 30 Nov 2026: end date excluded, so the span is Fri/Sat/Sun — 1 working day, 2 weekend days', () => {
    const r = dateDifference('2026-11-27', '2026-11-30');
    expect(r.days).toBe(3);
    expect(r.workingDays).toBe(1);
    expect(r.weekends).toBe(2);
  });
  it('handles leap years', () => {
    expect(dateDifference('2024-02-28', '2024-03-01').days).toBe(2);
  });
  it('addDays crosses month boundaries', () => {
    expect(addDays('2026-11-27', 5)).toBe('2026-12-02');
  });
});

describe('durations', () => {
  it('parses all accepted forms', () => {
    expect(parseDuration('1:30:00')).toBe(5400 * 1000);
    expect(parseDuration('90m')).toBe(5400 * 1000);
    expect(parseDuration('1h 30m')).toBe(5400 * 1000);
    expect(parseDuration('5400s')).toBe(5400 * 1000);
    expect(parseDuration('1.5h')).toBe(5400 * 1000);
    expect(parseDuration('45')).toBe(45 * 60 * 1000); // bare number = minutes
  });
  it('adds and formats', () => {
    expect(formatDuration(parseDuration('1:30:00') + parseDuration('0:45:30'))).toBe('2h 15m 30s');
    expect(formatDuration(parseDuration('90m'))).toBe('1h 30m 0s');
  });
  it('computes time-of-day differences and overnight', () => {
    expect(durationBetween('09:30', '17:45')).toBe(8 * 3600 * 1000 + 15 * 60 * 1000);
    expect(() => durationBetween('22:00', '06:00')).toThrow(/overnight/);
    expect(durationBetween('22:00', '06:00', true)).toBe(8 * 3600 * 1000);
  });
  it('rejects garbage', () => {
    expect(() => parseDuration('abc')).toThrow(/Could not read/);
    expect(() => parseDuration('1:70:00')).toThrow(/60 or more/);
  });
});
