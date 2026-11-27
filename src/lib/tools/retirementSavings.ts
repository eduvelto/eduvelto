/**
 * Retirement Savings Planner — pure logic.
 *
 * Thin wrapper over the shared compound engine
 * (src/lib/tools/compoundEngine.ts): current savings plus a fixed
 * monthly contribution, compounded monthly until retirement age.
 * The reverse mode ("how much must I save each month to reach my
 * target?") uses the engine's requiredMonthlyContribution.
 *
 * The return rate is USER-ENTERED — no fund rate is hardcoded, and
 * no future return is ever guaranteed. All money results are
 * estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import {
  futureValueWithContributions,
  requiredMonthlyContribution,
  type CompoundResult,
} from './compoundEngine';

export interface RetirementInput {
  /** Age today. */
  currentAge: number;
  /** Age at which saving stops. */
  retirementAge: number;
  /** Savings already set aside. */
  currentSavings: number;
  /** Fixed amount saved at the end of every month. */
  monthlyContribution: number;
  /** Annual return rate in percent (user-entered). */
  annualRatePercent: number;
}

export interface RetirementResult extends CompoundResult {
  /** Years left until retirement. */
  yearsToRetirement: number;
}

export interface RequiredSavingInput {
  /** Fund wanted at retirement. */
  targetAmount: number;
  /** Savings already set aside. */
  currentSavings: number;
  /** Annual return rate in percent (user-entered). */
  annualRatePercent: number;
  /** Years left until retirement. */
  years: number;
}

function validateAges(currentAge: number, retirementAge: number): number {
  if (!Number.isFinite(currentAge) || currentAge < 0 || currentAge >= 120) {
    throw new Error(`currentAge must be between 0 and 120, got ${currentAge}`);
  }
  if (!Number.isFinite(retirementAge) || retirementAge <= currentAge || retirementAge > 120) {
    throw new Error(`retirementAge must be above currentAge and <= 120, got ${retirementAge}`);
  }
  return retirementAge - currentAge;
}

/**
 * Project the retirement fund.
 *
 * Hand-check: age 30 -> 60, savings 200,000, contribution
 * 5,000/month, 8% for 30 years -> future value 9,638,943.17,
 * contributed 2,000,000, interest 7,638,943.17 (exact figures from
 * the engine; the test asserts the engine-consistent values).
 */
export function planRetirement(input: RetirementInput): RetirementResult {
  const years = validateAges(input.currentAge, input.retirementAge);
  const result = futureValueWithContributions({
    principal: input.currentSavings,
    monthlyContribution: input.monthlyContribution,
    annualRatePercent: input.annualRatePercent,
    years,
  });
  return { ...result, yearsToRetirement: years };
}

/**
 * Reverse: monthly saving needed to reach `targetAmount`.
 *
 * Hand-check: target 5,000,000, savings 200,000, 8%, 30 years ->
 * 1,887.37/month (exact figure from the engine; the test asserts
 * the computed value).
 */
export function requiredMonthlySaving(input: RequiredSavingInput): number {
  if (!Number.isFinite(input.years) || input.years <= 0) {
    throw new Error(`years must be a finite number > 0, got ${input.years}`);
  }
  return requiredMonthlyContribution({
    target: input.targetAmount,
    principal: input.currentSavings,
    annualRatePercent: input.annualRatePercent,
    years: input.years,
  });
}
