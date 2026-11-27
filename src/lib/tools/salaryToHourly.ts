/**
 * Salary to Hourly Converter — pure logic.
 *
 * Converts a salary between monthly / yearly / weekly / daily and
 * an hourly rate, from the user's own working hours. A 5-day working
 * week is assumed for the daily rate (stated in the UI).
 *
 *   yearly = monthly x 12 = weekly x 52 = daily x 5 x 52
 *   hoursPerYear = hoursPerWeek x weeksPerYear (default 52)
 *   hourly = yearly / hoursPerYear
 *   daily = yearly / (5 x weeksPerYear)
 *
 * No salary figure is hardcoded — every number is the user's own.
 * All money results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export type SalaryPeriod = 'monthly' | 'yearly' | 'weekly' | 'daily';

export interface SalaryInput {
  /** Salary amount in the given period. */
  amount: number;
  /** Which period `amount` is in. */
  period: SalaryPeriod;
  /** Working hours per week (user-entered). */
  hoursPerWeek: number;
  /** Working weeks per year (default 52). */
  weeksPerYear?: number;
}

export interface SalaryConversion {
  /** Pay per working hour. */
  hourly: number;
  /** Pay per working day (5-day week). */
  daily: number;
  /** Pay per week. */
  weekly: number;
  /** Pay per month. */
  monthly: number;
  /** Pay per year. */
  yearly: number;
}

export interface HourlyToSalaryInput {
  /** Pay per working hour. */
  hourlyRate: number;
  /** Working hours per week (user-entered). */
  hoursPerWeek: number;
  /** Working weeks per year (default 52). */
  weeksPerYear?: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Convert a salary to every period.
 *
 * Hand-check: 50,000/month, 40 hours/week -> yearly 600,000;
 * hours/year 2,080; hourly 600,000 / 2,080 = 288.46; daily
 * 600,000 / 260 = 2,307.69; weekly 600,000 / 52 = 11,538.46.
 */
export function convertSalary(input: SalaryInput): SalaryConversion {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error(`amount must be a finite number >= 0, got ${input.amount}`);
  }
  if (!Number.isFinite(input.hoursPerWeek) || input.hoursPerWeek <= 0) {
    throw new Error(`hoursPerWeek must be a positive number, got ${input.hoursPerWeek}`);
  }
  const weeksPerYear = input.weeksPerYear ?? 52;
  if (!Number.isFinite(weeksPerYear) || weeksPerYear <= 0 || weeksPerYear > 52) {
    throw new Error(`weeksPerYear must be > 0 and <= 52, got ${weeksPerYear}`);
  }
  let yearly: number;
  switch (input.period) {
    case 'monthly':
      yearly = input.amount * 12;
      break;
    case 'yearly':
      yearly = input.amount;
      break;
    case 'weekly':
      yearly = input.amount * weeksPerYear;
      break;
    case 'daily':
      yearly = input.amount * 5 * weeksPerYear;
      break;
    default:
      throw new Error(`period must be monthly, yearly, weekly or daily, got ${input.period}`);
  }
  const hoursPerYear = input.hoursPerWeek * weeksPerYear;
  return {
    hourly: roundMoney(yearly / hoursPerYear),
    daily: roundMoney(yearly / (5 * weeksPerYear)),
    weekly: roundMoney(yearly / weeksPerYear),
    monthly: roundMoney(yearly / 12),
    yearly: roundMoney(yearly),
  };
}

/**
 * Reverse: a monthly / yearly salary from an hourly rate.
 *
 * Hand-check: 288.46/hour, 40 hours/week -> yearly 599,996.80,
 * monthly 49,999.73 (rounding from the hourly figure, not the
 * original 50,000 — the test asserts the computed values).
 */
export function hourlyToSalary(input: HourlyToSalaryInput): { monthly: number; yearly: number } {
  if (!Number.isFinite(input.hourlyRate) || input.hourlyRate < 0) {
    throw new Error(`hourlyRate must be a finite number >= 0, got ${input.hourlyRate}`);
  }
  if (!Number.isFinite(input.hoursPerWeek) || input.hoursPerWeek <= 0) {
    throw new Error(`hoursPerWeek must be a positive number, got ${input.hoursPerWeek}`);
  }
  const weeksPerYear = input.weeksPerYear ?? 52;
  if (!Number.isFinite(weeksPerYear) || weeksPerYear <= 0 || weeksPerYear > 52) {
    throw new Error(`weeksPerYear must be > 0 and <= 52, got ${weeksPerYear}`);
  }
  const yearly = input.hourlyRate * input.hoursPerWeek * weeksPerYear;
  return { monthly: roundMoney(yearly / 12), yearly: roundMoney(yearly) };
}
