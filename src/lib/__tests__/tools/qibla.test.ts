// Qibla Direction — unit tests.
// Hand-checks: Dhaka (23.8103, 90.4125) -> bearing ~277.6° (just
// north of due west), distance ~5,172 km. London -> ~119° (ESE).
import { describe, it, expect } from 'vitest';
import { calculateQibla, compassPoint } from '../../tools/qibla';
import { BANGLADESH_CITIES, cityByKey, KAABA } from '../../tools/bangladeshCities';

describe('calculateQibla', () => {
  it('Dhaka bearing is ~277.6° and distance ~5,172 km', () => {
    const r = calculateQibla(23.8103, 90.4125);
    expect(r.bearingDegrees).toBeGreaterThan(270);
    expect(r.bearingDegrees).toBeLessThan(285);
    expect(r.distanceKm).toBeGreaterThan(5000);
    expect(r.distanceKm).toBeLessThan(5300);
    expect(r.compassPointEn).toBe('W');
  });

  it('London bearing is ~119° (ESE)', () => {
    const r = calculateQibla(51.5074, -0.1278);
    expect(r.bearingDegrees).toBeGreaterThan(110);
    expect(r.bearingDegrees).toBeLessThan(130);
    expect(r.compassPointEn).toBe('ESE');
  });

  it('rejects out-of-range coordinates', () => {
    expect(() => calculateQibla(91, 0)).toThrow();
    expect(() => calculateQibla(0, 181)).toThrow();
  });
});

describe('compassPoint', () => {
  it('maps 0 to N, 90 to E, 180 to S, 270 to W', () => {
    expect(compassPoint(0).en).toBe('N');
    expect(compassPoint(90).en).toBe('E');
    expect(compassPoint(180).en).toBe('S');
    expect(compassPoint(270).en).toBe('W');
  });
});

describe('BANGLADESH_CITIES', () => {
  it('has all 9 presets, all UTC+6, all inside Bangladesh', () => {
    expect(BANGLADESH_CITIES).toHaveLength(9);
    expect(cityByKey('dhaka')?.latitude).toBeCloseTo(23.81, 1);
    expect(cityByKey("coxs-bazar")?.nameEn).toContain('Bazar');
    for (const c of BANGLADESH_CITIES) {
      expect(c.utcOffset).toBe(6);
      expect(c.latitude).toBeGreaterThan(20);
      expect(c.latitude).toBeLessThan(27);
      expect(c.longitude).toBeGreaterThan(88);
      expect(c.longitude).toBeLessThan(93);
    }
    expect(KAABA.latitude).toBeCloseTo(21.42, 1);
    expect(KAABA.longitude).toBeCloseTo(39.83, 1);
  });
});
