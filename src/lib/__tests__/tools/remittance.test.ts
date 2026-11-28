// Currency & Remittance Calculator — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import {
  GOVERNMENT_INCENTIVE_RATE_PERCENT,
  calculateOutwardRemittance,
  calculateRemittance,
} from '../../tools/remittance';

describe('calculateRemittance (inward: foreign currency -> BDT)', () => {
  it('100 USD x 121.50, no fee, no incentive -> 12,150 BDT', () => {
    // 100 x 121.50 = 12,150.00.
    expect(calculateRemittance({ amount: 100, rate: 121.5 })).toEqual({
      converted: 12150,
      incentive: 0,
      fee: 0,
      received: 12150,
      reverseRate: 1 / 121.5,
    });
  });

  it('100 USD x 121.50 with 2.5% incentive -> 12,150 + 303.75 = 12,453.75 BDT', () => {
    // 12,150 x 2.5 / 100 = 303.75; 12,150 + 303.75 = 12,453.75.
    expect(calculateRemittance({ amount: 100, rate: 121.5, includeIncentive: true })).toEqual({
      converted: 12150,
      incentive: 303.75,
      fee: 0,
      received: 12453.75,
      reverseRate: 1 / 121.5,
    });
  });

  it('100 USD x 121.50 with 2.5% incentive and 200 BDT fee -> 12,253.75 BDT', () => {
    // 12,150 + 303.75 - 200 = 12,253.75 (incentive is on converted, before fee).
    expect(
      calculateRemittance({ amount: 100, rate: 121.5, fee: 200, includeIncentive: true }),
    ).toEqual({
      converted: 12150,
      incentive: 303.75,
      fee: 200,
      received: 12253.75,
      reverseRate: 1 / 121.5,
    });
  });

  it('fee without incentive subtracts from converted only', () => {
    // 100 x 121.50 = 12,150; 12,150 - 200 = 11,950.
    expect(calculateRemittance({ amount: 100, rate: 121.5, fee: 200 })).toEqual({
      converted: 12150,
      incentive: 0,
      fee: 200,
      received: 11950,
      reverseRate: 1 / 121.5,
    });
  });

  it('incentive rate constant is 2.5%', () => {
    expect(GOVERNMENT_INCENTIVE_RATE_PERCENT).toBe(2.5);
  });

  it('rounds to two decimals: 33 USD x 121.555 with incentive', () => {
    // 33 x 121.555 = 4,011.315 -> 4,011.32 (rounded); 4,011.32 x 2.5% = 100.283 -> 100.28.
    const r = calculateRemittance({ amount: 33, rate: 121.555, includeIncentive: true });
    expect(r.converted).toBe(4011.32);
    expect(r.incentive).toBe(100.28);
    expect(r.received).toBe(4111.6);
  });

  it('zero amount receives zero', () => {
    expect(calculateRemittance({ amount: 0, rate: 121.5, includeIncentive: true })).toEqual({
      converted: 0,
      incentive: 0,
      fee: 0,
      received: 0,
      reverseRate: 1 / 121.5,
    });
  });

  it('rejects rate <= 0', () => {
    expect(() => calculateRemittance({ amount: 100, rate: 0 })).toThrow(/rate/);
    expect(() => calculateRemittance({ amount: 100, rate: -5 })).toThrow(/rate/);
    expect(() => calculateRemittance({ amount: 100, rate: Number.NaN })).toThrow(/rate/);
  });

  it('rejects negative amount and negative fee', () => {
    expect(() => calculateRemittance({ amount: -1, rate: 121.5 })).toThrow(/amount/);
    expect(() => calculateRemittance({ amount: 100, rate: 121.5, fee: -1 })).toThrow(/fee/);
  });

  it('fee equal to or greater than the converted amount is rejected, never negative', () => {
    // 100 x 121.50 = 12,150; a 12,150 fee would leave 0 before incentive, a bigger
    // fee would go negative — both are rejected instead of returning a negative.
    expect(() => calculateRemittance({ amount: 100, rate: 121.5, fee: 12150 })).toThrow(/fee/);
    expect(() => calculateRemittance({ amount: 100, rate: 121.5, fee: 13000 })).toThrow(/fee/);
    expect(() =>
      calculateRemittance({ amount: 100, rate: 121.5, fee: 13000, includeIncentive: true }),
    ).toThrow(/fee/);
  });

  it('any fee on a zero amount is rejected', () => {
    expect(() => calculateRemittance({ amount: 0, rate: 121.5, fee: 10 })).toThrow(/fee/);
  });
});

describe('calculateOutwardRemittance (BDT -> foreign currency)', () => {
  it('12,150 BDT at 121.50 -> 100 USD', () => {
    // 12,150 / 121.50 = 100.
    expect(calculateOutwardRemittance({ amount: 12150, rate: 121.5 })).toEqual({
      converted: 100,
      fee: 0,
      received: 100,
      reverseRate: 1 / 121.5,
    });
  });

  it('12,150 BDT at 121.50 with 2 USD fee -> 98 USD', () => {
    expect(calculateOutwardRemittance({ amount: 12150, rate: 121.5, fee: 2 })).toEqual({
      converted: 100,
      fee: 2,
      received: 98,
      reverseRate: 1 / 121.5,
    });
  });

  it('rejects rate <= 0 and a fee that eats the converted amount', () => {
    expect(() => calculateOutwardRemittance({ amount: 12150, rate: 0 })).toThrow(/rate/);
    expect(() => calculateOutwardRemittance({ amount: 12150, rate: 121.5, fee: 100 })).toThrow(/fee/);
    expect(() => calculateOutwardRemittance({ amount: 12150, rate: 121.5, fee: 150 })).toThrow(/fee/);
  });
});
