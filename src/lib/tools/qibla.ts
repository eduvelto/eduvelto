/**
 * Qibla Direction — great-circle bearing from any latitude/longitude
 * to the Kaaba (21.4225 N, 39.8262 E).
 *
 * Bearing formula (standard spherical trigonometry):
 *   θ = atan2( sin Δλ, cos φ1 · tan φ2 − sin φ1 · cos Δλ )
 * measured clockwise from true north. The compass display is a
 * GUIDE: a phone compass needs calibration and magnetic north is
 * not true north, so the UI says so plainly.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import { KAABA } from './bangladeshCities';

const DEG = Math.PI / 180;

export interface QiblaResult {
  /** Bearing in degrees clockwise from true north, 0-360. */
  bearingDegrees: number;
  /** Nearest compass point, e.g. "NW" / "পশ্চিম-উত্তর". */
  compassPointEn: string;
  compassPointBn: string;
  /** Great-circle distance to Makkah in kilometres. */
  distanceKm: number;
}

const COMPASS_EN = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];
const COMPASS_BN = [
  'উত্তর', 'উত্তর-উত্তরপূর্ব', 'উত্তরপূর্ব', 'পূর্ব-উত্তরপূর্ব',
  'পূর্ব', 'পূর্ব-দক্ষিণপূর্ব', 'দক্ষিণপূর্ব', 'দক্ষিণ-দক্ষিণপূর্ব',
  'দক্ষিণ', 'দক্ষিণ-দক্ষিণপশ্চিম', 'দক্ষিণপশ্চিম', 'পশ্চিম-দক্ষিণপশ্চিম',
  'পশ্চিম', 'পশ্চিম-উত্তরপশ্চিম', 'উত্তরপশ্চিম', 'উত্তর-উত্তরপশ্চিম',
];

export function compassPoint(bearingDegrees: number): { en: string; bn: string } {
  const idx = Math.round((((bearingDegrees % 360) + 360) % 360) / 22.5) % 16;
  return { en: COMPASS_EN[idx], bn: COMPASS_BN[idx] };
}

/**
 * Qibla bearing + distance from a place.
 *
 * Hand-check: from Dhaka (23.8103, 90.4125) the bearing is about
 * 277.6° (just north of due west) and the distance about 5,172 km.
 * From London it is about 119° (ESE).
 */
export function calculateQibla(latitude: number, longitude: number): QiblaResult {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`latitude must be between -90 and 90, got ${latitude}`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`longitude must be between -180 and 180, got ${longitude}`);
  }
  const phi1 = latitude * DEG;
  const phi2 = KAABA.latitude * DEG;
  const deltaLambda = (KAABA.longitude - longitude) * DEG;
  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
  const bearing = (Math.atan2(y, x) / DEG + 360) % 360;
  // Haversine distance.
  const dPhi = phi2 - phi1;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const distanceKm = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
  const point = compassPoint(bearing);
  return {
    bearingDegrees: Math.round(bearing * 10) / 10,
    compassPointEn: point.en,
    compassPointBn: point.bn,
    distanceKm: Math.round(distanceKm),
  };
}
