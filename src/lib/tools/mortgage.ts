/**
 * Mortgage & Home Loan Calculator — pure logic.
 *
 * Uses the shared EMI engine (src/lib/tools/emiEngine.ts): the loan
 * amount is home price minus down payment, and the EMI, total payment
 * and total interest come from that one formula. The reverse mode
 * ("what home price can I afford?") uses the engine's
 * affordablePrincipal.
 *
 * The interest rate is USER-ENTERED — no bank rate is hardcoded.
 * All money results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import { affordablePrincipal, calculateEmi, type EmiResult } from './emiEngine';

export interface MortgageInput {
  /** Full price of the home. */
  homePrice: number;
  /** Up-front payment (subtracted from the price to get the loan). */
  downPayment: number;
  /** Annual interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Loan term in whole years. */
  years: number;
}

export interface MortgageResult extends EmiResult {
  /** Amount borrowed: homePrice - downPayment. */
  loanAmount: number;
  /** Loan term in months. */
  months: number;
  /** Down payment as a share of the home price, in percent. */
  downPaymentPercent: number;
}

export interface AffordableHomeInput {
  /** Monthly payment the buyer can afford. */
  monthlyBudget: number;
  /** Down payment the buyer can put up. */
  downPayment: number;
  /** Annual interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Loan term in whole years. */
  years: number;
}

export interface AffordableHomeResult {
  /** Largest loan the monthly budget can service. */
  maxLoanAmount: number;
  /** Largest home price: max loan + down payment. */
  maxHomePrice: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate a home-loan EMI.
 *
 * Hand-check: home price 5,000,000, down payment 1,000,000,
 * 9% for 20 years -> loan 4,000,000, r = 0.0075, n = 240,
 * (1.0075)^240 = 6.009151; emi = 4000000 x 0.0075 x 6.009151
 * / 5.009151 = 35,989.04; total = 8,637,369.18; interest =
 * 4,637,369.18. (Exact figures come from the engine; the test
 * asserts the engine-consistent rounded values.)
 */
export function calculateMortgage(input: MortgageInput): MortgageResult {
  if (!Number.isFinite(input.homePrice) || input.homePrice < 0) {
    throw new Error(`homePrice must be a finite number >= 0, got ${input.homePrice}`);
  }
  if (!Number.isFinite(input.downPayment) || input.downPayment < 0) {
    throw new Error(`downPayment must be a finite number >= 0, got ${input.downPayment}`);
  }
  if (input.downPayment > input.homePrice) {
    throw new Error('downPayment cannot exceed homePrice');
  }
  if (!Number.isFinite(input.years) || input.years <= 0 || !Number.isInteger(input.years)) {
    throw new Error(`years must be a positive integer, got ${input.years}`);
  }
  const loanAmount = roundMoney(input.homePrice - input.downPayment);
  const months = input.years * 12;
  const emi = calculateEmi({ principal: loanAmount, annualRatePercent: input.annualRatePercent, months });
  return {
    ...emi,
    loanAmount,
    months,
    downPaymentPercent:
      input.homePrice === 0 ? 0 : Math.round((input.downPayment / input.homePrice) * 10000) / 100,
  };
}

/**
 * Reverse: the most expensive home a monthly budget can buy.
 *
 * Hand-check: budget 35,989.04/month, down payment 1,000,000, 9%,
 * 20 years -> max loan 4,000,000, max home price 5,000,000 (inverse
 * of the calculateMortgage hand-check above).
 */
export function affordableHomePrice(input: AffordableHomeInput): AffordableHomeResult {
  if (!Number.isFinite(input.downPayment) || input.downPayment < 0) {
    throw new Error(`downPayment must be a finite number >= 0, got ${input.downPayment}`);
  }
  if (!Number.isFinite(input.years) || input.years <= 0 || !Number.isInteger(input.years)) {
    throw new Error(`years must be a positive integer, got ${input.years}`);
  }
  const maxLoanAmount = affordablePrincipal({
    monthlyPayment: input.monthlyBudget,
    annualRatePercent: input.annualRatePercent,
    months: input.years * 12,
  });
  return { maxLoanAmount, maxHomePrice: roundMoney(maxLoanAmount + input.downPayment) };
}
