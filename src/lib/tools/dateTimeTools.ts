// no network. Timezone work uses Intl only — never hand-rolled DST math.
// Dhaka is UTC+6 year-round (no DST); the code never assumes that for other zones.

/* ---------------------------------------------------------- Unix timestamp */

export interface UnixConverted {
  seconds: number;
  isMillisInput: boolean;
  isoUtc: string;
  utc: string;
  dhaka: string;
  local: string;
}

/** Auto-detect seconds (10 digits) vs milliseconds (13 digits). */
export function parseUnixInput(raw: string): { seconds: number; millis: boolean } {
  const clean = raw.trim().replace(/,/g, '');
  if (!/^-?\d+$/.test(clean)) {
    throw new Error(`"${raw}" is not a Unix timestamp — a timestamp is digits only (10 digits = seconds, 13 = milliseconds)`);
  }
  const digits = clean.replace(/^-/, '').length;
  if (digits <= 10) return { seconds: Number(clean), millis: false };
  if (digits <= 13) return { seconds: Math.floor(Number(clean) / 1000), millis: true };
  throw new Error(`"${raw}" has ${digits} digits — Unix timestamps are 10 digits (seconds) or 13 (milliseconds)`);
}

function formatInZone(date: Date, zone: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function unixToDate(seconds: number): UnixConverted {
  if (!Number.isFinite(seconds)) throw new Error('Timestamp must be a number');
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) throw new Error(`Timestamp ${seconds} is out of range`);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    seconds,
    isMillisInput: false,
    isoUtc: date.toISOString(),
    utc: formatInZone(date, 'UTC'),
    dhaka: formatInZone(date, 'Asia/Dhaka'),
    local: formatInZone(date, localZone),
  };
}

/** Date + time in a named zone -> Unix seconds. Throws on bad input. */
export function dateToUnix(dateText: string, timeText: string, zone: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error(`Date must look like 2026-11-27, got "${dateText}"`);
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeText)) {
    throw new Error(`Time must look like 14:22, got "${timeText}"`);
  }
  const [y, m, d] = dateText.split('-').map(Number);
  const [hh, mm, ss = 0] = timeText.split(':').map(Number);
  // Guess UTC, then correct by the zone offset at that instant (two passes
  // converge because offsets change by at most 1-2 h at DST boundaries).
  let guess = Date.UTC(y, m - 1, d, hh, mm, ss);
  for (let pass = 0; pass < 2; pass += 1) {
    const offsetMs = zoneOffsetMs(new Date(guess), zone);
    guess = Date.UTC(y, m - 1, d, hh, mm, ss) - offsetMs;
  }
  return Math.floor(guess / 1000);
}

function zoneOffsetMs(date: Date, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/* ---------------------------------------------------------- Date difference */

export interface DateDiff {
  days: number; // signed: negative when the end is before the start
  weeks: number;
  hours: number;
  calendar: { years: number; months: number; days: number };
  workingDays: number;
  weekends: number;
}

/** Bangladesh government weekend: Friday + Saturday (default, editable). */
export const BD_WEEKEND_DAYS = [5, 6]; // JS getDay(): 5 = Friday, 6 = Saturday

export function dateDifference(fromISO: string, toISO: string, weekendDays: number[] = BD_WEEKEND_DAYS): DateDiff {
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error(`Dates must look like 2026-11-27 — got "${fromISO}" and "${toISO}"`);
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((to.getTime() - from.getTime()) / msPerDay);
  // Calendar breakdown on the absolute span.
  const start = days >= 0 ? from : to;
  const end = days >= 0 ? to : from;
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    d += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  // Working days over the absolute span (end date excluded, matching `days`).
  let workingDays = 0;
  let weekends = 0;
  const step = days >= 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(days); i += 1) {
    const cur = new Date(from.getTime() + step * i * msPerDay);
    if (weekendDays.includes(cur.getDay())) weekends += 1;
    else workingDays += 1;
  }
  return {
    days,
    weeks: Math.floor(Math.abs(days) / 7) * Math.sign(days || 1),
    hours: days * 24,
    calendar: { years, months, days: d },
    workingDays: days >= 0 ? workingDays : -workingDays,
    weekends: days >= 0 ? weekends : -weekends,
  };
}

export function addDays(iso: string, n: number): string {
  const base = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(base.getTime())) throw new Error(`Date must look like 2026-11-27, got "${iso}"`);
  const out = new Date(base.getTime() + n * 24 * 60 * 60 * 1000);
  return `${out.getFullYear()}-${String(out.getMonth() + 1).padStart(2, '0')}-${String(out.getDate()).padStart(2, '0')}`;
}

/* ------------------------------------------------------------ Durations */

/** Accepts "1:30:00", "90m", "1h 30m", "5400s", "1.5h". Returns milliseconds. */
export function parseDuration(raw: string): number {
  const s = raw.trim().toLowerCase();
  if (s === '') throw new Error('Type a duration first');
  const colon = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (colon) {
    const h = Number(colon[1]);
    const m = Number(colon[2]);
    const sec = Number(colon[3] ?? 0);
    if (m >= 60 || sec >= 60) throw new Error(`"${raw}" has minutes/seconds of 60 or more — use hours instead`);
    return ((h * 60 + m) * 60 + sec) * 1000;
  }
  const unitRe = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/g;
  let total = 0;
  let matched = false;
  let match: RegExpExecArray | null;
  while ((match = unitRe.exec(s)) !== null) {
    matched = true;
    const v = Number(match[1]);
    const u = match[2];
    if (u.startsWith('h')) total += v * 3600 * 1000;
    else if (u.startsWith('m')) total += v * 60 * 1000;
    else total += v * 1000;
  }
  if (!matched) {
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s) * 60 * 1000; // bare number = minutes
    throw new Error(`Could not read "${raw}" as a duration — try 1:30:00, 90m or 1h 30m`);
  }
  return total;
}

export function formatDuration(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  if (h > 0) return `${sign}${h}h ${m}m ${sec}s`;
  if (m > 0) return `${sign}${m}m ${sec}s`;
  return `${sign}${sec}s`;
}

/** "09:30" -> "17:45" in ms. overnight=true allows crossing midnight. */
export function durationBetween(start: string, end: string, overnight = false): number {
  const parse = (t: string): number => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) throw new Error(`Time must look like 09:30, got "${t}"`);
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh > 23 || mm > 59) throw new Error(`"${t}" is not a valid time of day`);
    return (hh * 60 + mm) * 60 * 1000;
  };
  const a = parse(start);
  const b = parse(end);
  if (b < a && !overnight) {
    throw new Error('End time is before start time — turn on "overnight" for shifts crossing midnight');
  }
  return b >= a ? b - a : b + 24 * 3600 * 1000 - a;
}

export function addDurations(list: readonly number[]): number {
  return list.reduce((a, b) => a + b, 0);
}
