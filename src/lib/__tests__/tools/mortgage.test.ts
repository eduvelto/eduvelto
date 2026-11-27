// Mortgage calculator — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/mortgage.ts.
import { describe, it, expect } from 'vitest';
import { calculateMortgage, affordableHomePrice } from '../../tools/mortgage';

describe('calculateMortgage', () => {
  it('5,000,000 home, 1,000,000 down, 9%, 20 years -> emi 35,989.04', () => {
    // Loan 4,000,000, r = 0.0075, n = 240 -> emi 35,989.04.
    const r = calculateMortgage({
      homePrice: 5000000,
      downPayment: 1000000,
      annualRatePercent: 9,
      years: 20,
    });
    expect(r.loanAmount).toBe(4000000);
    expect(r.emi).toBe(35989.04);
    expect(r.months).toBe(240);
    expect(r.totalPayment).toBe(8637369.18);
    expect(r.totalInterest).toBe(4637369.18);
    expect(r.downPaymentPercent).toBe(20);
  });

  it('zero down payment borrows the full price', () => {
    const r = calculateMortgage({ homePrice: 1000000, downPayment: 0, annualRatePercent: 0, years: 10 });
    expect(r.loanAmount).toBe(1000000);
    expect(r.emi).toBe(8333.33);
    expect(r.totalInterest).toBe(0);
  });

  it('rejects down payment above the home price', () => {
    expect(() =>
      calculateMortgage({ homePrice: 1000000, downPayment: 1000001, annualRatePercent: 9, years: 20 }),
    ).toThrow(/downPayment/);
  });
});

describe('affordableHomePrice', () => {
  it('35,989.04/month, 1,000,000 down, 9%, 20 years -> about 5,000,000 home', () => {
    // The rounded EMI (35,989.04) inverts to a 4,000,000.20 loan —
    // within ৳1 of the exact 4,000,000.
    const r = affordableHomePrice({ monthlyBudget: 35989.04, downPayment: 1000000, annualRatePercent: 9, years: 20 });
    expect(r.maxLoanAmount).toBeCloseTo(4000000, 0);
    expect(r.maxHomePrice).toBeCloseTo(5000000, 0);
  });
});
