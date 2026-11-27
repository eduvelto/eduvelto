// EMI engine — unit tests. Every expected value is hand-computed;
// see the comments in src/lib/tools/emiEngine.ts.
import { describe, it, expect } from 'vitest';
import { calculateEmi, affordablePrincipal } from '../../tools/emiEngine';

describe('calculateEmi', () => {
  it('1,000,000 at 12% for 12 months -> emi 88,848.79', () => {
    // r = 0.01, (1.01)^12 = 1.126825; emi = 1000000 x 0.01 x 1.126825
    // / 0.126825 = 88,848.79; total = 1,066,185.46; interest = 66,185.46.
    expect(calculateEmi({ principal: 1000000, annualRatePercent: 12, months: 12 })).toEqual({
      emi: 88848.79,
      totalPayment: 1066185.46,
      totalInterest: 66185.46,
      monthlyRate: 0.01,
    });
  });

  it('0% rate -> straight split, no interest', () => {
    expect(calculateEmi({ principal: 120000, annualRatePercent: 0, months: 12 })).toEqual({
      emi: 10000,
      totalPayment: 120000,
      totalInterest: 0,
      monthlyRate: 0,
    });
  });

  it('rejects negative principal, negative rate and non-positive months', () => {
    expect(() => calculateEmi({ principal: -1, annualRatePercent: 12, months: 12 })).toThrow(/principal/);
    expect(() => calculateEmi({ principal: 1000, annualRatePercent: -1, months: 12 })).toThrow(
      /annualRatePercent/,
    );
    expect(() => calculateEmi({ principal: 1000, annualRatePercent: 12, months: 0 })).toThrow(/months/);
    expect(() => calculateEmi({ principal: 1000, annualRatePercent: 12, months: 12.5 })).toThrow(
      /months/,
    );
  });
});

describe('affordablePrincipal', () => {
  it('88,848.79/month at 12% for 12 months -> about 1,000,000 principal', () => {
    // The rounded EMI (88,848.79) inverts to 1,000,000.01 — within 1
    // paisa-level rounding of the exact 1,000,000.
    expect(affordablePrincipal({ monthlyPayment: 88848.79, annualRatePercent: 12, months: 12 })).toBeCloseTo(
      1000000,
      0,
    );
  });

  it('0% rate -> payment x months', () => {
    expect(affordablePrincipal({ monthlyPayment: 10000, annualRatePercent: 0, months: 12 })).toBe(
      120000,
    );
  });
});
