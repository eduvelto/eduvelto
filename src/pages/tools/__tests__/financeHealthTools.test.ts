// Finance & Health batch engines — unit tests (audit §4b #149–167).
// Every expected value is hand-computed; see the comments in
// src/lib/tools/financeHealthTools.ts.
import { describe, it, expect } from 'vitest';
import {
  calculateRoi,
  calculateGst,
  calculateStepsCalories,
  calculateWorkingDays,
  calculateDogAge,
  calculateCatAge,
  calculateLoveCompatibility,
  calculateDownPayment,
  calculateAutoLoan,
  calculateInflation,
  calculateCpm,
  calculateCtr,
  calculateEngagementRate,
  calculateYoutubeMoney,
  calculateAdsenseRevenue,
  emiMonthly,
} from '../../../lib/tools/financeHealthTools';

describe('emiMonthly', () => {
  it('800,000 at 12% for 60 months -> 17,795.56', () => {
    expect(emiMonthly(800000, 12, 60)).toBe(17795.56);
  });
  it('0% rate divides the principal evenly', () => {
    expect(emiMonthly(120000, 0, 12)).toBe(10000);
  });
  it('rejects zero months and negative amounts', () => {
    expect(emiMonthly(100000, 10, 0)).toBeNull();
    expect(emiMonthly(-1000, 10, 12)).toBeNull();
    expect(emiMonthly(100000, 10, 12.5)).toBeNull();
  });
});

describe('calculateRoi', () => {
  it('cost 10,000 gain 12,000 -> profit 2,000, ROI 20%', () => {
    expect(calculateRoi(10000, 12000)).toEqual({ profit: 2000, roiPercent: 20, annualizedRoiPercent: null });
  });
  it('annualized over 2 years: (1.2)^0.5 - 1 = 9.54%', () => {
    expect(calculateRoi(10000, 12000, 2)?.annualizedRoiPercent).toBe(9.54);
  });
  it('a loss gives a negative ROI', () => {
    expect(calculateRoi(5000, 4000)?.roiPercent).toBe(-20);
  });
  it('rejects zero cost, negative gain and bad years', () => {
    expect(calculateRoi(0, 12000)).toBeNull();
    expect(calculateRoi(10000, -5)).toBeNull();
    expect(calculateRoi(10000, 12000, 0)).toBeNull();
    expect(calculateRoi(10000, 0, 2)).toBeNull();
    expect(calculateRoi(NaN, 12000)).toBeNull();
  });
});

describe('calculateGst', () => {
  it('add: 1,000 + 15% -> tax 150, total 1,150', () => {
    expect(calculateGst(1000, 15, 'add')).toEqual({ base: 1000, tax: 150, total: 1150 });
  });
  it('remove: 1,150 incl. 15% -> base 1,000, tax 150', () => {
    expect(calculateGst(1150, 15, 'remove')).toEqual({ base: 1000, tax: 150, total: 1150 });
  });
  it('0% rate leaves the amount unchanged', () => {
    expect(calculateGst(500, 0, 'add')).toEqual({ base: 500, tax: 0, total: 500 });
  });
  it('rejects negative amounts and rates over 100', () => {
    expect(calculateGst(-100, 15, 'add')).toBeNull();
    expect(calculateGst(1000, 101, 'add')).toBeNull();
    expect(calculateGst(1000, 15, 'bogus' as never)).toBeNull();
  });
});

describe('calculateStepsCalories', () => {
  it('10,000 steps, 70 kg, default stride -> 7.62 km, 282.7 kcal', () => {
    expect(calculateStepsCalories(10000, 70)).toEqual({ calories: 282.7, distanceKm: 7.62, distanceM: 7620 });
  });
  it('10,000 steps, 70 kg, 0.8 m stride -> 8 km, 296.8 kcal', () => {
    expect(calculateStepsCalories(10000, 70, 0.8)).toEqual({ calories: 296.8, distanceKm: 8, distanceM: 8000 });
  });
  it('0 steps burns 0 calories', () => {
    expect(calculateStepsCalories(0, 70)?.calories).toBe(0);
  });
  it('rejects zero weight and impossible strides', () => {
    expect(calculateStepsCalories(10000, 0)).toBeNull();
    expect(calculateStepsCalories(10000, 70, 0)).toBeNull();
    expect(calculateStepsCalories(-5, 70)).toBeNull();
  });
});

describe('calculateWorkingDays', () => {
  it('2026-11-01 to 2026-11-07, Fri–Sat weekend -> 5 working, 2 weekend', () => {
    expect(calculateWorkingDays('2026-11-01', '2026-11-07', 'fri-sat')).toEqual({
      workingDays: 5,
      totalDays: 7,
      weekendDays: 2,
      holidayDays: 0,
    });
  });
  it('same week, Sat–Sun weekend -> 5 working, 2 weekend', () => {
    expect(calculateWorkingDays('2026-11-01', '2026-11-07', 'sat-sun')).toEqual({
      workingDays: 5,
      totalDays: 7,
      weekendDays: 2,
      holidayDays: 0,
    });
  });
  it('a weekday holiday is counted, not a working day', () => {
    expect(calculateWorkingDays('2026-11-01', '2026-11-07', 'fri-sat', ['2026-11-02'])).toEqual({
      workingDays: 4,
      totalDays: 7,
      weekendDays: 2,
      holidayDays: 1,
    });
  });
  it('a holiday falling on a weekend stays a weekend day', () => {
    expect(calculateWorkingDays('2026-11-01', '2026-11-07', 'fri-sat', ['2026-11-06'])?.holidayDays).toBe(0);
  });
  it('a single day counts as 1 working day', () => {
    expect(calculateWorkingDays('2026-11-02', '2026-11-02', 'fri-sat')?.workingDays).toBe(1);
  });
  it('rejects end before start and impossible dates', () => {
    expect(calculateWorkingDays('2026-11-07', '2026-11-01', 'fri-sat')).toBeNull();
    expect(calculateWorkingDays('2026-02-30', '2026-03-02', 'fri-sat')).toBeNull();
    expect(calculateWorkingDays('not-a-date', '2026-03-02', 'fri-sat')).toBeNull();
  });
});

describe('calculateDogAge', () => {
  it('1 dog year -> 10.5 human years', () => {
    expect(calculateDogAge(1, 'small')).toEqual({ humanYears: 10.5 });
  });
  it('2 dog years -> 21 human years, any size', () => {
    expect(calculateDogAge(2, 'large')).toEqual({ humanYears: 21 });
  });
  it('5 dog years: small 33, medium 36, large 42', () => {
    expect(calculateDogAge(5, 'small')).toEqual({ humanYears: 33 });
    expect(calculateDogAge(5, 'medium')).toEqual({ humanYears: 36 });
    expect(calculateDogAge(5, 'large')).toEqual({ humanYears: 42 });
  });
  it('rejects negative and absurd ages', () => {
    expect(calculateDogAge(-1, 'small')).toBeNull();
    expect(calculateDogAge(31, 'small')).toBeNull();
  });
});

describe('calculateCatAge', () => {
  it('1 -> 15, 2 -> 24, 5 -> 36, 10 -> 56 human years', () => {
    expect(calculateCatAge(1)).toEqual({ humanYears: 15 });
    expect(calculateCatAge(2)).toEqual({ humanYears: 24 });
    expect(calculateCatAge(5)).toEqual({ humanYears: 36 });
    expect(calculateCatAge(10)).toEqual({ humanYears: 56 });
  });
  it('half a year -> 7.5 human years', () => {
    expect(calculateCatAge(0.5)).toEqual({ humanYears: 7.5 });
  });
  it('rejects negative ages', () => {
    expect(calculateCatAge(-1)).toBeNull();
  });
});

describe('calculateLoveCompatibility', () => {
  it('is deterministic: same names, same result', () => {
    const a = calculateLoveCompatibility('Rahim', 'Karim');
    const b = calculateLoveCompatibility('Rahim', 'Karim');
    expect(a).toEqual(b);
    expect(a).toEqual({ percent: 65, band: 'good' });
  });
  it('percent is always in the 45–98 range', () => {
    for (const [x, y] of [['A', 'B'], ['Mizan', 'Priya'], ['John', 'Jane'], ['a', 'a']] as const) {
      const r = calculateLoveCompatibility(x, y);
      expect(r).not.toBeNull();
      expect(r!.percent).toBeGreaterThanOrEqual(45);
      expect(r!.percent).toBeLessThanOrEqual(98);
    }
  });
  it('rejects empty names', () => {
    expect(calculateLoveCompatibility('', 'Karim')).toBeNull();
    expect(calculateLoveCompatibility('  ', 'Karim')).toBeNull();
  });
});

describe('calculateDownPayment', () => {
  it('1,000,000 at 20% -> down 200,000, loan 800,000, no EMI without rate', () => {
    expect(calculateDownPayment(1000000, 20)).toEqual({ downPayment: 200000, loanAmount: 800000, monthlyEmi: null });
  });
  it('with 12% for 5 years -> EMI 17,795.56', () => {
    expect(calculateDownPayment(1000000, 20, 12, 5)?.monthlyEmi).toBe(17795.56);
  });
  it('rejects >100% and a half-supplied EMI preview', () => {
    expect(calculateDownPayment(1000000, 101)).toBeNull();
    expect(calculateDownPayment(1000000, 20, 12)).toBeNull();
    expect(calculateDownPayment(0, 20)).toBeNull();
  });
});

describe('calculateAutoLoan', () => {
  it('1,000,000 price, 100,000 down, 10% for 5y -> loan 900,000, EMI 19,122.34', () => {
    expect(calculateAutoLoan(1000000, 100000, 10, 5)).toEqual({
      loanAmount: 900000,
      monthlyPayment: 19122.34,
      totalPayment: 1147340.4,
      totalInterest: 247340.4,
    });
  });
  it('0% rate divides the loan evenly', () => {
    expect(calculateAutoLoan(600000, 0, 0, 1)?.monthlyPayment).toBe(50000);
  });
  it('rejects down payment >= price and negative rates', () => {
    expect(calculateAutoLoan(1000000, 1000000, 10, 5)).toBeNull();
    expect(calculateAutoLoan(1000000, 100000, -1, 5)).toBeNull();
    expect(calculateAutoLoan(1000000, 100000, 10, 0)).toBeNull();
  });
});

describe('calculateInflation', () => {
  it('future: 10,000 at 6% for 5 years -> 13,382.26', () => {
    expect(calculateInflation(10000, 6, 5, 'future')).toEqual({ result: 13382.26, changePercent: 33.82 });
  });
  it('past: 10,000 at 6% for 5 years ago -> 7,472.58', () => {
    expect(calculateInflation(10000, 6, 5, 'past')).toEqual({ result: 7472.58, changePercent: -25.27 });
  });
  it('0 years leaves the amount unchanged', () => {
    expect(calculateInflation(10000, 6, 0, 'future')).toEqual({ result: 10000, changePercent: 0 });
  });
  it('rejects negative rates and bad directions', () => {
    expect(calculateInflation(10000, -1, 5, 'future')).toBeNull();
    expect(calculateInflation(10000, 6, 5, 'sideways' as never)).toBeNull();
  });
});

describe('calculateCpm', () => {
  it('spend 500 for 100,000 impressions -> CPM 5', () => {
    expect(calculateCpm(500, 100000)).toEqual({ cpm: 5 });
  });
  it('rejects zero impressions', () => {
    expect(calculateCpm(500, 0)).toBeNull();
    expect(calculateCpm(-1, 1000)).toBeNull();
  });
});

describe('calculateCtr', () => {
  it('250 clicks / 10,000 impressions -> 2.5%', () => {
    expect(calculateCtr(250, 10000)).toEqual({ ctrPercent: 2.5 });
  });
  it('rejects clicks above impressions and zero impressions', () => {
    expect(calculateCtr(10001, 10000)).toBeNull();
    expect(calculateCtr(10, 0)).toBeNull();
  });
});

describe('calculateEngagementRate', () => {
  it('500 interactions / 10,000 reach -> 5%', () => {
    expect(calculateEngagementRate(500, 10000)).toEqual({ ratePercent: 5 });
  });
  it('rejects zero base', () => {
    expect(calculateEngagementRate(500, 0)).toBeNull();
    expect(calculateEngagementRate(-1, 10000)).toBeNull();
  });
});

describe('calculateYoutubeMoney', () => {
  it('100,000 views at $2 RPM -> $200', () => {
    expect(calculateYoutubeMoney(100000, 2)).toEqual({ estimatedEarnings: 200 });
  });
  it('rejects negative views and RPM', () => {
    expect(calculateYoutubeMoney(-1, 2)).toBeNull();
    expect(calculateYoutubeMoney(1000, -2)).toBeNull();
  });
});

describe('calculateAdsenseRevenue', () => {
  it('50,000 pageviews at $3 RPM -> $150', () => {
    expect(calculateAdsenseRevenue(50000, 3)).toEqual({ estimatedEarnings: 150 });
  });
  it('rejects negative inputs', () => {
    expect(calculateAdsenseRevenue(-1, 3)).toBeNull();
    expect(calculateAdsenseRevenue(50000, -3)).toBeNull();
  });
});
