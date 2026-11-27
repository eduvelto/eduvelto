/**
 * Prayer Times — pure LOCAL astronomical calculation (Tool #91).
 *
 * No API (no AlAdhan), no dependency, no network: the times are computed
 * in the browser from latitude / longitude / date with the standard solar
 * position algorithm (mean anomaly + mean longitude -> ecliptic longitude
 * -> declination + equation of time, then hour angles).
 *
 * Defaults (Muslim World League): Fajr 18 degrees below the horizon,
 * Isha 17 degrees, Asr with shadow factor 1 (Shafi'i). Sunrise/sunset use
 * the standard -0.833 degree solar altitude (refraction + solar radius).
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface PrayerTimesInput {
  /** Latitude in degrees, -90 to 90 (Dhaka: 23.81). */
  latitude: number;
  /** Longitude in degrees, -180 to 180, east positive (Dhaka: 90.41). */
  longitude: number;
  /** The calendar date (local year/month/day are used; time is ignored). */
  date: Date;
  /**
   * UTC offset in hours for the location (Dhaka: +6). Defaults to the
   * date's own local offset when omitted.
   */
  timeZone?: number;
  /** Solar depression angle for Fajr in degrees (default 18, MWL). */
  fajrAngle?: number;
  /** Solar depression angle for Isha in degrees (default 17, MWL). */
  ishaAngle?: number;
  /** Asr shadow factor: 1 = Shafi'i (default), 2 = Hanafi. */
  asrShadowFactor?: number;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

/**
 * Same as {@link PrayerTimes}, but a field is `null` when the Sun never
 * reaches that prayer's altitude on the given day (polar day/night).
 */
export type PrayerTimesResult = { [K in keyof PrayerTimes]: string | null };

/** Solar altitude used for sunrise / sunset (refraction + solar radius). */
const SUNRISE_SUNSET_ALTITUDE_DEG = -0.833;

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function sinDeg(deg: number): number {
  return Math.sin(deg * DEG_TO_RAD);
}

function cosDeg(deg: number): number {
  return Math.cos(deg * DEG_TO_RAD);
}

function tanDeg(deg: number): number {
  return Math.tan(deg * DEG_TO_RAD);
}

function asinDeg(value: number): number {
  return Math.asin(Math.min(1, Math.max(-1, value))) * RAD_TO_DEG;
}

function acosDeg(value: number): number {
  return Math.acos(Math.min(1, Math.max(-1, value))) * RAD_TO_DEG;
}

function atanDeg(value: number): number {
  return Math.atan(value) * RAD_TO_DEG;
}

/** Wrap an angle in degrees to [0, 360). */
function fixAngle(angle: number): number {
  const fixed = angle - 360 * Math.floor(angle / 360);
  return fixed === 360 ? 0 : fixed;
}

/** Wrap hours to [0, 24). */
function fixHour(hour: number): number {
  const fixed = hour - 24 * Math.floor(hour / 24);
  return fixed === 24 ? 0 : fixed;
}

interface SolarPosition {
  /** Solar declination in degrees. */
  declination: number;
  /** Equation of time in hours (apparent - mean solar time). */
  equationOfTime: number;
}

/**
 * Solar declination + equation of time for a Julian day.
 * Standard NOAA-style computation from the day count since J2000.0.
 */
function solarPosition(julianDay: number): SolarPosition {
  const d = julianDay - 2451545.0;
  const meanAnomaly = fixAngle(357.529 + 0.98560028 * d);
  const meanLongitude = fixAngle(280.459 + 0.98564736 * d);
  const eclipticLongitude = fixAngle(
    meanLongitude + 1.915 * sinDeg(meanAnomaly) + 0.02 * sinDeg(2 * meanAnomaly),
  );
  const obliquity = 23.439 - 0.00000036 * d;
  const rightAscension = fixAngle(
    Math.atan2(cosDeg(obliquity) * sinDeg(eclipticLongitude), cosDeg(eclipticLongitude)) *
      RAD_TO_DEG,
  );
  const declination = asinDeg(sinDeg(obliquity) * sinDeg(eclipticLongitude));
  // Equation of time, wrapped to [-12, 12) hours so it stays the small
  // (~+/- 0.27 h) value instead of jumping by 24 h near 0/360 degrees.
  let equationOfTime = (meanLongitude - rightAscension) / 15;
  if (equationOfTime > 12) equationOfTime -= 24;
  if (equationOfTime < -12) equationOfTime += 24;
  return { declination, equationOfTime };
}

/** Julian day number for a calendar date at 0h UT. */
function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5
  );
}

/**
 * Hour angle (in hours) for a given solar altitude at this latitude and
 * declination. Returns null at polar day/night (the Sun never reaches the
 * altitude that day).
 */
function hourAngleForAltitude(
  altitudeDeg: number,
  latitude: number,
  declination: number,
): number | null {
  const cosH =
    (sinDeg(altitudeDeg) - sinDeg(latitude) * sinDeg(declination)) /
    (cosDeg(latitude) * cosDeg(declination));
  if (cosH > 1 || cosH < -1) return null;
  return acosDeg(cosH) / 15;
}

function formatTime(hours: number): string {
  const fixed = fixHour(hours);
  const totalMinutes = Math.round(fixed * 60);
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function validatePrayerInput(input: PrayerTimesInput): {
  fajrAngle: number;
  ishaAngle: number;
  asrShadowFactor: number;
  timeZone: number;
} {
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
    throw new Error(`latitude must be between -90 and 90, got ${input.latitude}`);
  }
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    throw new Error(`longitude must be between -180 and 180, got ${input.longitude}`);
  }
  if (!(input.date instanceof Date) || Number.isNaN(input.date.getTime())) {
    throw new Error('date must be a valid Date');
  }
  const fajrAngle = input.fajrAngle ?? 18;
  const ishaAngle = input.ishaAngle ?? 17;
  const asrShadowFactor = input.asrShadowFactor ?? 1;
  if (!Number.isFinite(fajrAngle) || fajrAngle <= 0 || fajrAngle > 30) {
    throw new Error(`fajrAngle must be between 0 and 30 degrees, got ${fajrAngle}`);
  }
  if (!Number.isFinite(ishaAngle) || ishaAngle <= 0 || ishaAngle > 30) {
    throw new Error(`ishaAngle must be between 0 and 30 degrees, got ${ishaAngle}`);
  }
  if (!Number.isFinite(asrShadowFactor) || asrShadowFactor <= 0) {
    throw new Error(`asrShadowFactor must be a positive number, got ${asrShadowFactor}`);
  }
  const timeZone =
    input.timeZone ?? -input.date.getTimezoneOffset() / 60;
  if (!Number.isFinite(timeZone) || timeZone < -12 || timeZone > 14) {
    throw new Error(`timeZone must be a UTC offset between -12 and +14, got ${timeZone}`);
  }
  return { fajrAngle, ishaAngle, asrShadowFactor, timeZone };
}

/**
 * Calculate the six prayer times for a place and date, as HH:MM strings
 * (24-hour clock, local time at `timeZone`).
 *
 * Hand-verified against published Dhaka timetables for 26 Nov 2026
 * (lat 23.81, lon 90.41, UTC+6; MWL angles, Asr shadow factor 1):
 * Fajr ~05:01, Sunrise ~06:20, Dhuhr ~11:47, Asr ~14:50, Maghrib
 * ~17:11, Isha ~18:26-18:30. Different methods disagree by a few minutes
 * (e.g. Karachi vs MWL Isha), so tests assert within +/-5 minutes of
 * those published values plus strict ordering — not an exact minute match
 * to any single timetable.
 *
 * Returns null for a prayer the Sun never reaches that day (polar
 * day/night) — the HH:MM string is replaced by null in that case.
 */
export function calculatePrayerTimes(input: PrayerTimesInput): PrayerTimesResult {
  const { fajrAngle, ishaAngle, asrShadowFactor, timeZone } = validatePrayerInput(input);
  const year = input.date.getFullYear();
  const month = input.date.getMonth() + 1;
  const day = input.date.getDate();

  const { declination, equationOfTime } = solarPosition(julianDay(year, month, day));

  // Solar noon (Dhuhr) in local clock time.
  const dhuhr = 12 + timeZone - input.longitude / 15 - equationOfTime;

  const sunriseAngle = hourAngleForAltitude(
    SUNRISE_SUNSET_ALTITUDE_DEG,
    input.latitude,
    declination,
  );
  const fajrAngleHours = hourAngleForAltitude(-fajrAngle, input.latitude, declination);
  const ishaAngleHours = hourAngleForAltitude(-ishaAngle, input.latitude, declination);

  // Asr: the Sun's altitude when the shadow of a vertical stick equals the
  // stick's shadow at noon plus `asrShadowFactor` stick-lengths.
  const asrAltitude = atanDeg(
    1 / (asrShadowFactor + tanDeg(Math.abs(input.latitude - declination))),
  );
  const asrAngleHours = hourAngleForAltitude(asrAltitude, input.latitude, declination);

  const timeOrNull = (base: number | null, offset: number | null): string | null =>
    base === null || offset === null ? null : formatTime(base + offset);

  return {
    fajr: timeOrNull(dhuhr, fajrAngleHours === null ? null : -fajrAngleHours),
    sunrise: timeOrNull(dhuhr, sunriseAngle === null ? null : -sunriseAngle),
    dhuhr: formatTime(dhuhr),
    asr: timeOrNull(dhuhr, asrAngleHours),
    maghrib: timeOrNull(dhuhr, sunriseAngle),
    isha: timeOrNull(dhuhr, ishaAngleHours),
  };
}
