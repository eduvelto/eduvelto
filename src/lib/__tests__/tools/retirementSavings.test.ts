// Retirement savings planner — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/retirementSavings.ts.
import { describe, it, expect } from 'vitest';
import { planRetirement, requiredMonthlySaving } from '../../tools/retirementSavings';

describe('planRetirement', () => {
  it('age 30 -> 60, 200,000 saved, 5,000/month, 8% -> 9,638,943.17', () => {
    const r = planRetirement({
      currentAge: 30,
      retirementAge: 60,
      currentSavings: 200000,
      monthlyContribution: 5000,
      annualRatePercent: 8,
    });
    expect(r.yearsToRetirement).toBe(30);
    expect(r.futureValue).toBe(9638943.17);
    expect(r.totalContributed).toBe(2000000);
    expect(r.interestEarned).toBe(7638943.17);
    expect(r.months).toBe(360);
  });

  it('rejects retirement age at or below current age', () => {
    expect(() =>
      planRetirement({ currentAge: 60, retirementAge: 60, currentSavings: 0, monthlyContribution: 1000, annualRatePercent: 8 }),
    ).toThrow(/retirementAge/);
  });
});

describe('requiredMonthlySaving', () => {
  it('target 5,000,000 from 200,000 at 8% in 30 years -> 1,887.37/month', () => {
    expect(
      requiredMonthlySaving({ targetAmount: 5000000, currentSavings: 200000, annualRatePercent: 8, years: 30 }),
    ).toBe(1887.37);
  });

  it('savings already above target -> 0', () => {
    expect(
      requiredMonthlySaving({ targetAmount: 100000, currentSavings: 200000, annualRatePercent: 8, years: 30 }),
    ).toBe(0);
  });
});
