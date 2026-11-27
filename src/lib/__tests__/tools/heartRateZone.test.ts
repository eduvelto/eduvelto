// Heart Rate Zone Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateHeartRateZones } from '../../tools/heartRateZone';

describe('calculateHeartRateZones', () => {
  it('age 30, resting 60 -> HRmax 190, Z2 138-151 bpm (Karvonen)', () => {
    // HRmax = 220 - 30 = 190; reserve = 130.
    // Z2 = 60 + 130 x 0.60 = 138 to 60 + 130 x 0.70 = 151.
    const result = calculateHeartRateZones(30, 60);
    expect(result.maxHr).toBe(190);
    expect(result.restingBpm).toBe(60);
    expect(result.zones).toHaveLength(5);
    expect(result.zones[0]).toEqual({ zone: 'Z1', nameBn: 'খুব হালকা', nameEn: 'Very light', lowBpm: 125, highBpm: 138 });
    expect(result.zones[1]).toEqual({ zone: 'Z2', nameBn: 'হালকা', nameEn: 'Light', lowBpm: 138, highBpm: 151 });
    expect(result.zones[4]).toEqual({ zone: 'Z5', nameBn: 'সর্বোচ্চ', nameEn: 'Maximum', lowBpm: 177, highBpm: 190 });
  });

  it('rejects resting heart rate at or above the maximum', () => {
    expect(() => calculateHeartRateZones(30, 190)).toThrow(/restingBpm/);
    expect(() => calculateHeartRateZones(0, 60)).toThrow(/ageYears/);
  });
});
