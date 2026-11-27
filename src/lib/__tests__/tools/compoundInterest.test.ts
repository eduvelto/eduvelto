// Compound interest calculator — unit tests. Every expected value
// is hand-computed; see src/lib/tools/compoundInterest.ts and the
// shared engine in src/lib/tools/compoundEngine.ts.
import { describe, it, expect } from 'vitest';
import { calculateCompoundInterest } from '../../tools/compoundInterest';

describe('calculateCompoundInterest', () => {
  it('100,000 + 5,000/month at 10% for 1 year -> 173,299.15', () => {
    const r = calculateCompoundInterest({
      principal: 100000,
      monthlyContribution: 5000,
      annualRatePercent: 10,
      years: 1,
    });
    expect(r.futureValue).toBe(173299.15);
    expect(r.totalContributed).toBe(160000);
    expect(r.interestEarned).toBe(13299.15);
  });

  it('lump sum only: 100,000 at 10% for 1 year -> 110,471.31', () => {
    // 100000 x (1 + 0.10/12)^12 = 110,471.31.
    const r = calculateCompoundInterest({
      principal: 100000,
      monthlyContribution: 0,
      annualRatePercent: 10,
      years: 1,
    });
    expect(r.futureValue).toBe(110471.31);
    expect(r.totalContributed).toBe(100000);
    expect(r.interestEarned).toBe(10471.31);
  });

  it('0% rate -> no growth', () => {
    const r = calculateCompoundInterest({
      principal: 50000,
      monthlyContribution: 2000,
      annualRatePercent: 0,
      years: 2,
    });
    expect(r.futureValue).toBe(98000);
    expect(r.interestEarned).toBe(0);
  });

  it('yearly balances grow year by year over 2 years', () => {
    const r = calculateCompoundInterest({
      principal: 100000,
      monthlyContribution: 0,
      annualRatePercent: 12,
      years: 2,
    });
    expect(r.yearlyBalances).toHaveLength(2);
    expect(r.yearlyBalances[0].year).toBe(1);
    expect(r.yearlyBalances[1].balance).toBeGreaterThan(r.yearlyBalances[0].balance);
    expect(r.yearlyBalances[1].balance).toBe(r.futureValue);
  });
});
