// Eduvelto — Life calculators unit tests (§3C).
// Expected values are hand-computed from the formulas, not copied from the code.

import { describe, expect, it } from 'vitest';
import {
  bmiCategoryLabel,
  calculateAge,
  calculateBmi,
  calculateCompoundInterest,
  calculateEmi,
  calculatePercentage,
  calculateSimpleInterest,
} from '../lifeCalculators';

describe('calculateEmi', () => {
  it('computes EMI for ৳100,000 at 12% for 12 months', () => {
    const r = calculateEmi(100_000, 12, 12);
    expect(r).not.toBeNull();
    // Monthly rate 1%: EMI = 100000 × 0.01 × 1.01^12 / (1.01^12 − 1) ≈ 8884.88
    expect(r!.emi).toBeCloseTo(8884.88, 1);
    expect(r!.totalPayment).toBeCloseTo(r!.emi * 12, 6);
    expect(r!.totalInterest).toBeCloseTo(r!.totalPayment - 100_000, 6);
  });

  it('zero interest splits the principal evenly', () => {
    const r = calculateEmi(120_000, 0, 12);
    expect(r).toEqual({ emi: 10_000, totalPayment: 120_000, totalInterest: 0 });
  });

  it('rejects non-positive principal, negative rate and zero tenure', () => {
    expect(calculateEmi(0, 10, 12)).toBeNull();
    expect(calculateEmi(-1000, 10, 12)).toBeNull();
    expect(calculateEmi(1000, -5, 12)).toBeNull();
    expect(calculateEmi(1000, 10, 0)).toBeNull();
    expect(calculateEmi(Number.NaN, 10, 12)).toBeNull();
  });
});

describe('calculateCompoundInterest', () => {
  it('1000 at 10% for 2 years, annual compounding → 1210', () => {
    const r = calculateCompoundInterest(1000, 10, 2, 1);
    expect(r!.maturityAmount).toBeCloseTo(1210, 9);
    expect(r!.interest).toBeCloseTo(210, 9);
  });

  it('monthly compounding beats annual compounding', () => {
    const annual = calculateCompoundInterest(1000, 12, 1, 1)!;
    const monthly = calculateCompoundInterest(1000, 12, 1, 12)!;
    expect(monthly.maturityAmount).toBeGreaterThan(annual.maturityAmount);
    // (1 + 0.12/12)^12 × 1000 ≈ 1126.83
    expect(monthly.maturityAmount).toBeCloseTo(1126.83, 1);
  });

  it('rejects bad input', () => {
    expect(calculateCompoundInterest(0, 10, 2)).toBeNull();
    expect(calculateCompoundInterest(1000, 10, 0)).toBeNull();
    expect(calculateCompoundInterest(1000, 10, 2, 0)).toBeNull();
    expect(calculateCompoundInterest(1000, -1, 2)).toBeNull();
  });
});

describe('calculateSimpleInterest', () => {
  it('1000 at 10% for 2 years → interest 200, maturity 1200', () => {
    expect(calculateSimpleInterest(1000, 10, 2)).toEqual({ interest: 200, maturityAmount: 1200 });
  });

  it('rejects bad input', () => {
    expect(calculateSimpleInterest(0, 10, 2)).toBeNull();
    expect(calculateSimpleInterest(1000, 10, -1)).toBeNull();
  });
});

describe('calculatePercentage', () => {
  it('20% of 150 is 30', () => {
    expect(calculatePercentage('of', 20, 150)).toBe(30);
  });
  it('30 is 20% of 150', () => {
    expect(calculatePercentage('what-percent', 30, 150)).toBe(20);
  });
  it('increase 100 by 25% is 125', () => {
    expect(calculatePercentage('increase', 100, 25)).toBe(125);
  });
  it('decrease 100 by 25% is 75', () => {
    expect(calculatePercentage('decrease', 100, 25)).toBe(75);
  });
  it('what-percent of zero is null', () => {
    expect(calculatePercentage('what-percent', 5, 0)).toBeNull();
  });
});

describe('calculateAge', () => {
  it('computes years/months/days', () => {
    const r = calculateAge(new Date(2000, 0, 15), new Date(2026, 10, 23));
    expect(r).toEqual({ years: 26, months: 10, days: 8, totalDays: 9809 });
  });

  it('handles a birthday that has not happened yet this year', () => {
    const r = calculateAge(new Date(2000, 11, 25), new Date(2026, 10, 23));
    expect(r!.years).toBe(25);
    expect(r!.months).toBe(10);
    expect(r!.days).toBe(29);
  });

  it('same day → zero age', () => {
    const r = calculateAge(new Date(2026, 10, 23), new Date(2026, 10, 23));
    expect(r).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
  });

  it('future birth date is null', () => {
    expect(calculateAge(new Date(2030, 0, 1), new Date(2026, 10, 23))).toBeNull();
  });

  it('leap-day birthday works', () => {
    const r = calculateAge(new Date(2000, 1, 29), new Date(2026, 2, 1));
    expect(r!.years).toBe(26);
    expect(r!.months).toBe(0);
    expect(r!.days).toBe(0);
  });
});

describe('calculateBmi', () => {
  it('70 kg / 170 cm → 24.22, normal', () => {
    const r = calculateBmi(70, 170);
    expect(r!.bmi).toBeCloseTo(24.22, 2);
    expect(r!.category).toBe('normal');
  });

  it('classifies the WHO bands', () => {
    expect(calculateBmi(45, 170)!.category).toBe('underweight');
    expect(calculateBmi(70, 170)!.category).toBe('normal');
    expect(calculateBmi(80, 170)!.category).toBe('overweight');
    expect(calculateBmi(95, 170)!.category).toBe('obese');
  });

  it('rejects bad input', () => {
    expect(calculateBmi(0, 170)).toBeNull();
    expect(calculateBmi(70, 0)).toBeNull();
    expect(calculateBmi(-70, 170)).toBeNull();
  });

  it('labels exist for every category', () => {
    for (const c of ['underweight', 'normal', 'overweight', 'obese'] as const) {
      const label = bmiCategoryLabel(c);
      expect(label.bn.length).toBeGreaterThan(0);
      expect(label.en.length).toBeGreaterThan(0);
    }
  });
});
