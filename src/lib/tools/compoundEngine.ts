/**
 * Compound-interest engine — ONE future-value formula shared by
 * compound-interest-calculator, retirement-savings-planner and the
 * DPS mode of bank-emi-dps-fdr-calculator. Never write it twice.
 *
 * Monthly compounding, contributions at the END of each month:
 *   FV = P x (1+r)^n + C x ((1+r)^n - 1) / r
 * where r is the monthly rate (annual rate / 100 / 12) and n is the
 * number of months. With a 0% rate, FV = P + C x n.
 *
 * All rates are USER-ENTERED — no bank or fund rate is ever
 * hardcoded here. All money results are estimates, rounded to
 * 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface CompoundInput {
  /** Lump sum invested at the start. */
  principal: number;
  /** Fixed amount added at the end of every month. */
  monthlyContribution: number;
  /** Annual interest/return rate in percent (user-entered). */
  annualRatePercent: number;
  /** Investment horizon in years (may be fractional). */
  years: number;
}

export interface CompoundResult {
  /** Value at the end of the horizon. */
  futureValue: number;
  /** Everything paid in: principal + contributions. */
  totalContributed: number;
  /** Growth: futureValue - totalContributed. */
  interestEarned: number;
  /** Number of monthly contributions. */
  months: number;
  /** Balance at the end of each whole year (year 1..floor(years)). */
  yearlyBalances: { year: number; balance: number }[];
}

export interface RequiredMonthlyInput {
  /** Amount wanted at the end. */
  target: number;
  /** Lump sum already invested at the start. */
  principal: number;
  /** Annual interest/return rate in percent (user-entered). */
  annualRatePercent: number;
  /** Years left to reach the target. */
  years: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateCompoundArgs(
  principal: number,
  annualRatePercent: number,
  years: number,
  extra?: number,
  extraLabel?: string,
): void {
  if (!Number.isFinite(principal) || principal < 0) {
    throw new Error(`principal must be a finite number >= 0, got ${principal}`);
  }
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) {
    throw new Error(`annualRatePercent must be a finite number >= 0, got ${annualRatePercent}`);
  }
  if (!Number.isFinite(years) || years <= 0) {
    throw new Error(`years must be a finite number > 0, got ${years}`);
  }
  if (extra !== undefined && (!Number.isFinite(extra) || extra < 0)) {
    throw new Error(`${extraLabel ?? 'value'} must be a finite number >= 0, got ${extra}`);
  }
}

/**
 * Future value with regular monthly contributions.
 *
 * Hand-check: principal 100,000, contribution 5,000/month, 10% for
 * 1 year -> r = 0.10/12 = 0.0083333, n = 12, (1+r)^12 = 1.104713;
 * FV = 100000 x 1.104713 + 5000 x (0.104713 / 0.0083333)
 *    = 110,471.31 + 62,827.84 = 173,299.15;
 * contributed = 100000 + 60000 = 160,000; interest = 13,299.15.
 * At 0%: principal 50,000 + 2,000 x 24 months -> 98,000 exactly.
 */
export function futureValueWithContributions(input: CompoundInput): CompoundResult {
  validateCompoundArgs(
    input.principal,
    input.annualRatePercent,
    input.years,
    input.monthlyContribution,
    'monthlyContribution',
  );
  const months = Math.round(input.years * 12);
  const r = input.annualRatePercent / 100 / 12;
  let futureValue: number;
  if (r === 0) {
    futureValue = input.principal + input.monthlyContribution * months;
  } else {
    const factor = Math.pow(1 + r, months);
    futureValue = input.principal * factor + input.monthlyContribution * ((factor - 1) / r);
  }
  const totalContributed = input.principal + input.monthlyContribution * months;
  const yearlyBalances: { year: number; balance: number }[] = [];
  const wholeYears = Math.floor(input.years);
  for (let y = 1; y <= wholeYears; y += 1) {
    const n = y * 12;
    let balance: number;
    if (r === 0) {
      balance = input.principal + input.monthlyContribution * n;
    } else {
      const factor = Math.pow(1 + r, n);
      balance = input.principal * factor + input.monthlyContribution * ((factor - 1) / r);
    }
    yearlyBalances.push({ year: y, balance: roundMoney(balance) });
  }
  return {
    futureValue: roundMoney(futureValue),
    totalContributed: roundMoney(totalContributed),
    interestEarned: roundMoney(futureValue - totalContributed),
    months,
    yearlyBalances,
  };
}

/**
 * Reverse: monthly contribution needed to reach `target` in `years`
 * from `principal` at `annualRatePercent`.
 *
 * Hand-check: target 173,299.15, principal 100,000, 10%, 1 year ->
 * 5,000/month (inverse of the futureValue hand-check above).
 * When the principal alone already reaches the target, returns 0.
 * At 0%: target 98,000, principal 50,000, 2 years ->
 * (98000 - 50000) / 24 = 2,000/month.
 */
export function requiredMonthlyContribution(input: RequiredMonthlyInput): number {
  validateCompoundArgs(input.principal, input.annualRatePercent, input.years, input.target, 'target');
  const months = Math.round(input.years * 12);
  const r = input.annualRatePercent / 100 / 12;
  if (r === 0) {
    return roundMoney(Math.max(0, (input.target - input.principal) / months));
  }
  const factor = Math.pow(1 + r, months);
  const needed = ((input.target - input.principal * factor) * r) / (factor - 1);
  return roundMoney(Math.max(0, needed));
}
