/**
 * Bangladesh cities — shared location presets for the Islamic tools.
 *
 * Coordinates are the widely published city-centre values (decimal
 * degrees). They are used only to pre-fill latitude / longitude /
 * time-zone fields; the user can always type their own coordinates.
 * Kaaba coordinates (21.4225 N, 39.8262 E) are the standard values
 * used by qibla calculators worldwide.
 *
 * Pure data + tiny helpers only: no network, no storage, no DOM.
 */

export interface BangladeshCity {
  /** City key used in <select> values. */
  key: string;
  nameBn: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  /** UTC offset in hours (whole Bangladesh: +6). */
  utcOffset: number;
}

export const BANGLADESH_CITIES: readonly BangladeshCity[] = [
  { key: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', latitude: 23.8103, longitude: 90.4125, utcOffset: 6 },
  { key: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', latitude: 22.3569, longitude: 91.7832, utcOffset: 6 },
  { key: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', latitude: 24.8949, longitude: 91.8687, utcOffset: 6 },
  { key: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', latitude: 22.8456, longitude: 89.5403, utcOffset: 6 },
  { key: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', latitude: 24.3745, longitude: 88.6042, utcOffset: 6 },
  { key: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal', latitude: 22.701, longitude: 90.3535, utcOffset: 6 },
  { key: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', latitude: 25.7439, longitude: 89.2752, utcOffset: 6 },
  { key: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', latitude: 24.7471, longitude: 90.4203, utcOffset: 6 },
  { key: 'coxs-bazar', nameBn: "কক্সবাজার", nameEn: "Cox's Bazar", latitude: 21.4272, longitude: 92.0058, utcOffset: 6 },
];

/** Kaaba, Makkah — the direction every qibla calculation points to. */
export const KAABA = { latitude: 21.4225, longitude: 39.8262 } as const;

export function cityByKey(key: string): BangladeshCity | undefined {
  return BANGLADESH_CITIES.find((c) => c.key === key);
}
