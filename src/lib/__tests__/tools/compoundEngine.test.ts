// Compound-interest engine — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/compoundEngine.ts.
import { describe, it, expect } from 'vitest';
import { futureValueWithContributions, requiredMonthlyContribution } from '../../tools/compoundEngine';

describe('futureValueWithContributions', () => {
  it('100,000 + 5,000/month at 10% for 1 year -> 173,299.15', () => {
    // r = 0.10/12, n = 12, (1+r)^12 = 1.104713;
    // FV = 100000 x 1.104713 + 5000 x (0.104713 / 0.0083333) = 173,299.15.
    const r = futureValueWithContributions({
      principal: 100000,
      monthlyContribution: 5000,
      annualRatePercent: 10,
      years: 1,
    });
    expect(r.futureValue).toBe(173299.15);
    expect(r.totalContributed).toBe(160000);
    expect(r.interestEarned).toBe(13299.15);
    expect(r.months).toBe(12);
    expect(r.yearlyBalances).toEqual([{ year: 1, balance: 173299.15 }]);
  });

  it('0% rate -> principal + contributions, no interest', () => {
    const r = futureValueWithContributions({
      principal: 50000,
      monthlyContribution: 2000,
      annualRatePercent: 0,
      years: 2,
    });
    expect(r.futureValue).toBe(98000);
    expect(r.totalContributed).toBe(98000);
    expect(r.interestEarned).toBe(0);
  });

  it('rejects negative principal, negative rate and non-positive years', () => {
    expect(() =>
      futureValueWithContributions({ principal: -1, monthlyContribution: 0, annualRatePercent: 10, years: 1 }),
    ).toThrow(/principal/);
    expect(() =>
      futureValueWithContributions({ principal: 0, monthlyContribution: 0, annualRatePercent: -1, years: 1 }),
    ).toThrow(/annualRatePercent/);
    expect(() =>
      futureValueWithContributions({ principal: 0, monthlyContribution: 0, annualRatePercent: 10, years: 0 }),
    ).toThrow(/years/);
  });
});

describe('requiredMonthlyContribution', () => {
  it('target 173,299.15 from 100,000 at 10% in 1 year -> 5,000/month', () => {
    expect(
      requiredMonthlyContribution({ target: 173299.15, principal: 100000, annualRatePercent: 10, years: 1 }),
    ).toBe(5000);
  });

  it('principal alone reaching the target -> 0', () => {
    expect(
      requiredMonthlyContribution({ target: 50000, principal: 100000, annualRatePercent: 10, years: 1 }),
    ).toBe(0);
  });

  it('0% rate -> (target - principal) / months', () => {
    expect(
      requiredMonthlyContribution({ target: 98000, principal: 50000, annualRatePercent: 0, years: 2 }),
    ).toBe(2000);
  });
});
