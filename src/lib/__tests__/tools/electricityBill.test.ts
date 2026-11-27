// Electricity Bill Calculator — unit tests.
// Hand-checks against the default (June 2026 reported) tariff:
// 200 units, 1 kW, no meter rent -> energy 75×5.26 + 125×8.50 =
// ৳1,457.00; demand ৳42; VAT 5% of ৳1,499 = ৳74.95; total ৳1,573.95.
// 40 units -> lifeline 40×4.63 = ৳185.20 energy.
import { describe, it, expect } from 'vitest';
import { calculateElectricityBill, DEFAULT_TARIFF } from '../../tools/electricityBill';

describe('calculateElectricityBill', () => {
  it('200 units / 1 kW totals ৳1,573.95', () => {
    const r = calculateElectricityBill(200, 1, DEFAULT_TARIFF);
    expect(r.energyCharge).toBeCloseTo(1457, 2);
    expect(r.demandCharge).toBe(42);
    expect(r.vat).toBeCloseTo(74.95, 2);
    expect(r.total).toBeCloseTo(1573.95, 2);
    expect(r.lifelineApplied).toBe(false);
    expect(r.breakdown).toHaveLength(2);
  });

  it('40 units uses the lifeline rate on all units', () => {
    const r = calculateElectricityBill(40, 1, DEFAULT_TARIFF);
    expect(r.lifelineApplied).toBe(true);
    expect(r.energyCharge).toBeCloseTo(185.2, 2);
  });

  it('51 units does NOT get the lifeline rate', () => {
    const r = calculateElectricityBill(51, 0, DEFAULT_TARIFF);
    expect(r.lifelineApplied).toBe(false);
    expect(r.energyCharge).toBeCloseTo(51 * 5.26, 2);
  });

  it('0 units costs only demand + VAT on demand', () => {
    const r = calculateElectricityBill(0, 1, DEFAULT_TARIFF);
    expect(r.energyCharge).toBe(0);
    expect(r.total).toBeCloseTo(44.1, 2);
    expect(r.averagePerUnit).toBe(0);
  });

  it('custom rates change the result (rates are user-editable)', () => {
    const custom = { ...DEFAULT_TARIFF, slabs: [{ from: 0, to: null, rate: 10 }] };
    const r = calculateElectricityBill(100, 0, custom);
    expect(r.energyCharge).toBe(1000);
  });

  it('rejects negative units or load', () => {
    expect(() => calculateElectricityBill(-1, 1, DEFAULT_TARIFF)).toThrow();
    expect(() => calculateElectricityBill(100, -1, DEFAULT_TARIFF)).toThrow();
  });
});
