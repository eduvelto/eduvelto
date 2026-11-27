// Bank EMI / DPS / FDR — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/bankEmiDpsFdr.ts.
import { describe, it, expect } from 'vitest';
import { calculateBankEmi, calculateDps, calculateFdr } from '../../tools/bankEmiDpsFdr';

describe('calculateBankEmi', () => {
  it('500,000 at 12% for 1 year -> emi 44,424.39', () => {
    expect(calculateBankEmi({ loanAmount: 500000, annualRatePercent: 12, years: 1 })).toEqual({
      emi: 44424.39,
      totalPayment: 533092.73,
      totalInterest: 33092.73,
      monthlyRate: 0.01,
    });
  });
});

describe('calculateDps', () => {
  it('5,000/month at 10% for 12 months -> maturity 62,827.84', () => {
    // (1 + 0.10/12)^12 = 1.104713; maturity = 5000 x (0.104713 /
    // 0.0083333) = 62,827.84; deposited 60,000; profit 2,827.84.
    expect(calculateDps({ monthlyDeposit: 5000, annualRatePercent: 10, months: 12 })).toEqual({
      maturityValue: 62827.84,
      totalDeposited: 60000,
      interestEarned: 2827.84,
    });
  });

  it('0% rate -> deposited amount only', () => {
    expect(calculateDps({ monthlyDeposit: 5000, annualRatePercent: 0, months: 12 })).toEqual({
      maturityValue: 60000,
      totalDeposited: 60000,
      interestEarned: 0,
    });
  });
});

describe('calculateFdr', () => {
  it('100,000 at 8% for 1 year, quarterly -> maturity 108,243.22', () => {
    // FV = 100000 x (1.02)^4 = 108,243.22; profit 8,243.22.
    expect(calculateFdr({ principal: 100000, annualRatePercent: 8, years: 1 })).toEqual({
      maturityValue: 108243.22,
      interestEarned: 8243.22,
    });
  });

  it('0% rate -> principal back exactly', () => {
    expect(calculateFdr({ principal: 100000, annualRatePercent: 0, years: 3 })).toEqual({
      maturityValue: 100000,
      interestEarned: 0,
    });
  });
});
