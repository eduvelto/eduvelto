// Credit card payoff — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/creditCardPayoff.ts.
import { describe, it, expect } from 'vitest';
import { calculateCreditCardPayoff, requiredMonthlyPayment } from '../../tools/creditCardPayoff';

describe('calculateCreditCardPayoff', () => {
  it('100,000 at 24% APR, 5,000/month -> 26 months, interest 28,987.28', () => {
    const r = calculateCreditCardPayoff({ balance: 100000, annualRatePercent: 24, monthlyPayment: 5000 });
    expect(r.payoffPossible).toBe(true);
    expect(r.months).toBe(26);
    expect(r.totalPaid).toBe(128987.28);
    expect(r.totalInterest).toBe(28987.28);
    expect(r.firstMonthInterest).toBe(2000);
  });

  it('payment below one month of interest -> impossible', () => {
    const r = calculateCreditCardPayoff({ balance: 100000, annualRatePercent: 24, monthlyPayment: 1500 });
    expect(r.payoffPossible).toBe(false);
    expect(r.months).toBeNull();
  });

  it('0% APR -> balance / payment months, no interest', () => {
    const r = calculateCreditCardPayoff({ balance: 60000, annualRatePercent: 0, monthlyPayment: 5000 });
    expect(r).toEqual({
      payoffPossible: true,
      months: 12,
      totalPaid: 60000,
      totalInterest: 0,
      firstMonthInterest: 0,
    });
  });

  it('zero balance -> 0 months, nothing to pay', () => {
    expect(calculateCreditCardPayoff({ balance: 0, annualRatePercent: 24, monthlyPayment: 5000 }).months).toBe(0);
  });
});

describe('requiredMonthlyPayment', () => {
  it('100,000 at 24% in 12 months -> 9,455.96/month', () => {
    expect(requiredMonthlyPayment({ balance: 100000, annualRatePercent: 24, months: 12 })).toBe(9455.96);
  });

  it('0% rate -> balance / months', () => {
    expect(requiredMonthlyPayment({ balance: 60000, annualRatePercent: 0, months: 12 })).toBe(5000);
  });
});
