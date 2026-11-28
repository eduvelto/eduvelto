/**
 * Time-zone helpers — shared engine for Meeting Time Planner and
 * World Date Converter. Uses only the browser's Intl API: no live
 * data, no network, no dependency. DST is handled by Intl itself,
 * so conversions stay correct across DST changes.
 *
 * Pure functions only: no storage, no DOM.
 */

import type { Lang } from '../../i18n/strings';
export interface TimeZoneOption {
  /** IANA time-zone identifier. */
  zone: string;
  nameBn: string;
  nameEn: string;
}

/** Common zones for a Bangladesh audience, in a sensible order. */
export const COMMON_TIME_ZONES: readonly TimeZoneOption[] = [
  { zone: 'Asia/Dhaka', nameBn: 'ঢাকা (বাংলাদেশ)', nameEn: 'Dhaka (Bangladesh)' },
  { zone: 'Asia/Kolkata', nameBn: 'কলকাতা (ভারত)', nameEn: 'Kolkata (India)' },
  { zone: 'Asia/Kathmandu', nameBn: 'কাঠমান্ডু (নেপাল)', nameEn: 'Kathmandu (Nepal)' },
  { zone: 'Asia/Karachi', nameBn: 'করাচি (পাকিস্তান)', nameEn: 'Karachi (Pakistan)' },
  { zone: 'Asia/Dubai', nameBn: 'দুবাই (সংযুক্ত আরব আমিরাত)', nameEn: 'Dubai (UAE)' },
  { zone: 'Asia/Riyadh', nameBn: 'রিয়াদ (সৌদি আরব)', nameEn: 'Riyadh (Saudi Arabia)' },
  { zone: 'Asia/Qatar', nameBn: 'দোহা (কাতার)', nameEn: 'Doha (Qatar)' },
  { zone: 'Asia/Kuala_Lumpur', nameBn: 'কুয়ালালামপুর (মালয়েশিয়া)', nameEn: 'Kuala Lumpur (Malaysia)' },
  { zone: 'Asia/Singapore', nameBn: 'সিঙ্গাপুর', nameEn: 'Singapore' },
  { zone: 'Asia/Tokyo', nameBn: 'টোকিও (জাপান)', nameEn: 'Tokyo (Japan)' },
  { zone: 'Asia/Seoul', nameBn: 'সিউল (দক্ষিণ কোরিয়া)', nameEn: 'Seoul (South Korea)' },
  { zone: 'Australia/Sydney', nameBn: 'সিডনি (অস্ট্রেলিয়া)', nameEn: 'Sydney (Australia)' },
  { zone: 'Europe/London', nameBn: 'লন্ডন (যুক্তরাজ্য)', nameEn: 'London (UK)' },
  { zone: 'Europe/Paris', nameBn: 'প্যারিস (ফ্রান্স)', nameEn: 'Paris (France)' },
  { zone: 'Europe/Berlin', nameBn: 'বার্লিন (জার্মানি)', nameEn: 'Berlin (Germany)' },
  { zone: 'America/New_York', nameBn: 'নিউ ইয়র্ক (যুক্তরাষ্ট্র)', nameEn: 'New York (USA)' },
  { zone: 'America/Chicago', nameBn: 'শিকাগো (যুক্তরাষ্ট্র)', nameEn: 'Chicago (USA)' },
  { zone: 'America/Los_Angeles', nameBn: 'লস অ্যাঞ্জেলেস (যুক্তরাষ্ট্র)', nameEn: 'Los Angeles (USA)' },
  { zone: 'America/Toronto', nameBn: 'টরন্টো (কানাডা)', nameEn: 'Toronto (Canada)' },
  { zone: 'UTC', nameBn: 'ইউটিসি', nameEn: 'UTC' },
];

export function isKnownZone(zone: string): boolean {
  return COMMON_TIME_ZONES.some((z) => z.zone === zone);
}

/**
 * Format an instant in a time zone, e.g. "27 Nov 2026, 11:02".
 * `locale` is 'bn' for Bangla digits/months or 'en'. Falls back to
 * UTC formatting if the zone is unknown to this browser.
 */
export function formatInZone(date: Date, zone: string, locale: Lang = 'en'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      timeZone: zone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}

/** Local hour (0-23) of an instant in a zone — for working-hours checks. */
export function hourInZone(date: Date, zone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour');
    if (!hour) return null;
    const h = Number(hour.value);
    return h === 24 ? 0 : h;
  } catch {
    return null;
  }
}

/** True when the local hour in `zone` falls inside 09:00–17:00. */
export function isWorkingHour(date: Date, zone: string): boolean {
  const h = hourInZone(date, zone);
  return h !== null && h >= 9 && h < 17;
}

/**
 * UTC offset label of a zone at an instant, e.g. "UTC+06:00".
 * Derived from Intl so DST is reflected.
 */
export function utcOffsetLabel(date: Date, zone: string): string {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
      hour: 'numeric',
    });
    const part = dtf.formatToParts(date).find((p) => p.type === 'timeZoneName');
    return part ? part.value.replace('GMT', 'UTC') : 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Interpret a wall-clock date/time (YYYY-MM-DD + HH:MM) as being in
 * `zone` and return the corresponding instant (Date). The offset is
 * found by iterating: guess UTC, read the zone offset at that guess,
 * correct once — accurate to the minute for every real zone
 * (offsets change only at DST transitions, handled by the iteration).
 */
export function wallClockInZoneToDate(dateStr: string, timeStr: string, zone: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!dateMatch || !timeMatch) return null;
  const [, y, mo, d] = dateMatch.map(Number);
  const [, hh, mm] = timeMatch.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return null;
  // Offset of `zone` at the guessed instant, in minutes.
  const offsetMinutesAt = (instant: Date): number | null => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(instant);
      const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? 0);
      let hour = get('hour');
      if (hour === 24) hour = 0;
      const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
      return (asUTC - instant.getTime()) / 60000;
    } catch {
      return null;
    }
  };
  const naiveUtc = Date.UTC(y, mo - 1, d, hh, mm);
  const off1 = offsetMinutesAt(new Date(naiveUtc));
  if (off1 === null) return null;
  const corrected = new Date(naiveUtc - off1 * 60000);
  const off2 = offsetMinutesAt(corrected);
  if (off2 === null) return null;
  return new Date(naiveUtc - off2 * 60000);
}

/** One row of a meeting-time plan: a zone and the local time there. */
export interface MeetingRow {
  zone: string;
  localTime: string;
  offsetLabel: string;
  workingHour: boolean;
}

/**
 * Plan a meeting: given an instant, list the local time in each
 * chosen zone with a working-hours flag. Pure: hand-check — 2026-11-27
 * 15:00 Dhaka (UTC+6) is 09:00 in London (UTC+0, winter) and 04:00
 * in New York (UTC-5, winter).
 */
export function planMeetingTime(instant: Date, zones: readonly string[]): MeetingRow[] {
  return zones.map((zone) => ({
    zone,
    localTime: formatInZone(instant, zone, 'en'),
    offsetLabel: utcOffsetLabel(instant, zone),
    workingHour: isWorkingHour(instant, zone),
  }));
}

/**
 * Convert a wall-clock time from one zone to another. Returns null
 * for an unparsable input. Pure: hand-check — 15:00 in Dhaka on
 * 2026-11-27 is 09:00 the same day in London.
 */
export function convertBetweenZones(
  dateStr: string,
  timeStr: string,
  fromZone: string,
  toZone: string,
): { instant: Date; fromLocal: string; toLocal: string } | null {
  const instant = wallClockInZoneToDate(dateStr, timeStr, fromZone);
  if (!instant) return null;
  return {
    instant,
    fromLocal: formatInZone(instant, fromZone, 'en'),
    toLocal: formatInZone(instant, toZone, 'en'),
  };
}
