// Salary to hourly converter — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/salaryToHourly.ts.
import { describe, it, expect } from 'vitest';
import { convertSalary, hourlyToSalary } from '../../tools/salaryToHourly';

describe('convertSalary', () => {
  it('50,000/month, 40 hours/week -> hourly 288.46', () => {
    // Yearly 600,000; hours/year 2,080; hourly 288.46; daily 2,307.69;
    // weekly 11,538.46.
    expect(convertSalary({ amount: 50000, period: 'monthly', hoursPerWeek: 40 })).toEqual({
      hourly: 288.46,
      daily: 2307.69,
      weekly: 11538.46,
      monthly: 50000,
      yearly: 600000,
    });
  });

  it('yearly input gives the same hourly rate', () => {
    const r = convertSalary({ amount: 600000, period: 'yearly', hoursPerWeek: 40 });
    expect(r.hourly).toBe(288.46);
    expect(r.monthly).toBe(50000);
  });

  it('weekly and daily inputs annualise correctly', () => {
    expect(convertSalary({ amount: 11538.46, period: 'weekly', hoursPerWeek: 40 }).yearly).toBe(599999.92);
    expect(convertSalary({ amount: 2307.69, period: 'daily', hoursPerWeek: 40 }).yearly).toBe(599999.4);
  });

  it('rejects zero hours per week', () => {
    expect(() => convertSalary({ amount: 50000, period: 'monthly', hoursPerWeek: 0 })).toThrow(
      /hoursPerWeek/,
    );
  });
});

describe('hourlyToSalary', () => {
  it('288.46/hour, 40 hours/week -> yearly 599,996.80, monthly 49,999.73', () => {
    expect(hourlyToSalary({ hourlyRate: 288.46, hoursPerWeek: 40 })).toEqual({
      monthly: 49999.73,
      yearly: 599996.8,
    });
  });
});
