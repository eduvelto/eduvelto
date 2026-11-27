/**
 * Bank EMI, DPS & FDR Calculator — pure logic.
 *
 * Three modes, one file, shared engines — no formula is written twice:
 * - EMI mode uses the shared EMI engine (emiEngine.ts).
 * - DPS mode uses the shared compound engine (compoundEngine.ts):
 *   a fixed monthly deposit, compounded monthly.
 * - FDR mode is a lump-sum fixed deposit: FV = P x (1 + r/n)^(n x t).
 *
 * All rates are USER-ENTERED with example defaults in the UI only —
 * no bank rate is hardcoded here. All money results are estimates,
 * rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import { calculateEmi, type EmiResult } from './emiEngine';
import { futureValueWithContributions } from './compoundEngine';

export interface BankEmiInput {
  /** Loan amount from the bank. */
  loanAmount: number;
  /** Annual interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Loan term in whole years. */
  years: number;
}

export type BankEmiResult = EmiResult;

export interface DpsInput {
  /** Fixed deposit paid every month. */
  monthlyDeposit: number;
  /** Annual profit/interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Deposit term in whole months. */
  months: number;
}

export interface DpsResult {
  /** Value at maturity. */
  maturityValue: number;
  /** Total deposited (monthlyDeposit x months). */
  totalDeposited: number;
  /** Profit earned: maturity - deposited. */
  interestEarned: number;
}

export interface FdrInput {
  /** Lump sum deposited. */
  principal: number;
  /** Annual interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Term in years (may be fractional). */
  years: number;
  /** Compounding periods per year (default 4 = quarterly). */
  compoundingPerYear?: number;
}

export interface FdrResult {
  /** Value at maturity. */
  maturityValue: number;
  /** Profit earned: maturity - principal. */
  interestEarned: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Bank loan EMI (shared engine).
 *
 * Hand-check: loan 500,000 at 12% for 1 year -> emi 44,424.39,
 * total 533,092.73, interest 33,092.73 (same arithmetic as the
 * EMI engine's 1,000,000 / 12-month hand-check, halved).
 */
export function calculateBankEmi(input: BankEmiInput): BankEmiResult {
  if (!Number.isFinite(input.years) || input.years <= 0 || !Number.isInteger(input.years)) {
    throw new Error(`years must be a positive integer, got ${input.years}`);
  }
  return calculateEmi({
    principal: input.loanAmount,
    annualRatePercent: input.annualRatePercent,
    months: input.years * 12,
  });
}

/**
 * DPS maturity (shared compound engine, no starting lump sum).
 *
 * Hand-check: deposit 5,000/month at 10% for 12 months ->
 * (1 + 0.10/12)^12 = 1.104713; maturity = 5000 x (0.104713 /
 * 0.0083333) = 62,827.84; deposited 60,000; profit 2,827.84.
 */
export function calculateDps(input: DpsInput): DpsResult {
  if (!Number.isFinite(input.monthlyDeposit) || input.monthlyDeposit < 0) {
    throw new Error(`monthlyDeposit must be a finite number >= 0, got ${input.monthlyDeposit}`);
  }
  if (!Number.isFinite(input.months) || input.months <= 0 || !Number.isInteger(input.months)) {
    throw new Error(`months must be a positive integer, got ${input.months}`);
  }
  const result = futureValueWithContributions({
    principal: 0,
    monthlyContribution: input.monthlyDeposit,
    annualRatePercent: input.annualRatePercent,
    years: input.months / 12,
  });
  return {
    maturityValue: result.futureValue,
    totalDeposited: result.totalContributed,
    interestEarned: result.interestEarned,
  };
}

/**
 * FDR maturity (lump sum, periodic compounding).
 *
 * Hand-check: principal 100,000 at 8% for 1 year, quarterly (n=4)
 * -> FV = 100000 x (1.02)^4 = 108,243.22; profit 8,243.22.
 * At 0%: maturity = principal exactly.
 */
export function calculateFdr(input: FdrInput): FdrResult {
  if (!Number.isFinite(input.principal) || input.principal < 0) {
    throw new Error(`principal must be a finite number >= 0, got ${input.principal}`);
  }
  if (!Number.isFinite(input.annualRatePercent) || input.annualRatePercent < 0) {
    throw new Error(`annualRatePercent must be a finite number >= 0, got ${input.annualRatePercent}`);
  }
  if (!Number.isFinite(input.years) || input.years <= 0) {
    throw new Error(`years must be a finite number > 0, got ${input.years}`);
  }
  const n = input.compoundingPerYear ?? 4;
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error(`compoundingPerYear must be a positive integer, got ${n}`);
  }
  const maturity = input.principal * Math.pow(1 + input.annualRatePercent / 100 / n, n * input.years);
  return { maturityValue: roundMoney(maturity), interestEarned: roundMoney(maturity - input.principal) };
}
