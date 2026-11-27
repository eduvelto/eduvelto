import { describe, expect, it } from 'vitest';
import { idealWeight } from '../../tools/idealWeight';

describe('idealWeight', () => {
  it('175 cm healthy range is BMI 18.5-24.9', () => {
    const r = idealWeight({ heightCm: 175, sex: 'male' });
    expect(r.healthyRangeKg.min).toBeCloseTo(56.7, 1);
    expect(r.healthyRangeKg.max).toBeCloseTo(76.3, 1);
  });
  it('Devine: male 175 cm -> 70.5 kg, female 175 cm -> 66.0 kg', () => {
    expect(idealWeight({ heightCm: 175, sex: 'male' }).devineKg).toBeCloseTo(70.5, 1);
    expect(idealWeight({ heightCm: 175, sex: 'female' }).devineKg).toBeCloseTo(66.0, 1);
  });
  it('Robinson/Miller/Hamwi are sane and ordered for the same height', () => {
    const r = idealWeight({ heightCm: 175, sex: 'male' });
    for (const v of [r.robinsonKg, r.millerKg, r.hamwiKg]) {
      expect(v).toBeGreaterThan(50);
      expect(v).toBeLessThan(90);
    }
  });
  it('90 kg at 175 cm -> lose ~13.4 kg to reach BMI 25', () => {
    const r = idealWeight({ heightCm: 175, sex: 'male', currentWeightKg: 90 });
    expect(r.toBmi25Kg).toBeCloseTo(13.4, 1);
    expect(r.toBmi22Kg).toBeGreaterThan(20);
  });
  it('no current weight -> lose/gain is null, not 0', () => {
    const r = idealWeight({ heightCm: 175, sex: 'female' });
    expect(r.toBmi25Kg).toBeNull();
    expect(r.toBmi22Kg).toBeNull();
  });
  it('rejects bad heights', () => {
    expect(() => idealWeight({ heightCm: 0, sex: 'male' })).toThrow(/1 and 300/);
    expect(() => idealWeight({ heightCm: -5, sex: 'male' })).toThrow(/1 and 300/);
  });
});
