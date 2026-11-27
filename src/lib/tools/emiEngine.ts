/**
 * EMI engine — ONE EMI formula shared by every loan tool.
 *
 * Used by mortgage-calculator AND bank-emi-dps-fdr-calculator (EMI mode).
 * Never write the EMI formula twice: import this.
 *
 * EMI = P x r x (1+r)^n / ((1+r)^n - 1), where r is the monthly rate
 * (annual rate / 100 / 12) and n is the number of monthly payments.
 * With a 0% rate the EMI is simply P / n.
 *
 * All rates are USER-ENTERED — no bank rate is ever hardcoded here.
 * All money results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface EmiInput {
  /** Loan principal (amount borrowed). */
  principal: number;
  /** Annual interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Number of monthly payments. */
  months: number;
}

export interface EmiResult {
  /** Monthly instalment. */
  emi: number;
  /** Total paid over the whole term (emi x months). */
  totalPayment: number;
  /** Total interest paid (totalPayment - principal). */
  totalInterest: number;
  /** Monthly interest rate as a decimal. */
  monthlyRate: number;
}

export interface AffordablePrincipalInput {
  /** Monthly payment the borrower can afford. */
  monthlyPayment: number;
  /** Annual interest rate in percent (user-entered). */
  annualRatePercent: number;
  /** Number of monthly payments. */
  months: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateEmiArgs(principal: number, annualRatePercent: number, months: number): void {
  if (!Number.isFinite(principal) || principal < 0) {
    throw new Error(`principal must be a finite number >= 0, got ${principal}`);
  }
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) {
    throw new Error(`annualRatePercent must be a finite number >= 0, got ${annualRatePercent}`);
  }
  if (!Number.isFinite(months) || months <= 0 || !Number.isInteger(months)) {
    throw new Error(`months must be a positive integer, got ${months}`);
  }
}

/**
 * Calculate the EMI for a loan.
 *
 * Hand-check: principal 1,000,000 at 12% for 12 months ->
 * r = 0.01, (1.01)^12 = 1.126825; emi = 1000000 x 0.01 x 1.126825
 * / 0.126825 = 88,848.79; total = 1,066,185.46; interest = 66,185.46.
 * At 0%: principal 120,000 / 12 months -> emi 10,000, interest 0.
 */
export function calculateEmi(input: EmiInput): EmiResult {
  validateEmiArgs(input.principal, input.annualRatePercent, input.months);
  const monthlyRate = input.annualRatePercent / 100 / 12;
  let emi: number;
  if (monthlyRate === 0) {
    emi = input.principal / input.months;
  } else {
    const factor = Math.pow(1 + monthlyRate, input.months);
    emi = (input.principal * monthlyRate * factor) / (factor - 1);
  }
  const totalPayment = emi * input.months;
  return {
    emi: roundMoney(emi),
    totalPayment: roundMoney(totalPayment),
    totalInterest: roundMoney(totalPayment - input.principal),
    monthlyRate,
  };
}

/**
 * Reverse EMI: the largest loan principal a given monthly payment can
 * service over `months` at `annualRatePercent`.
 *
 * Hand-check: payment 88,848.79 at 12% for 12 months -> principal
 * 1,000,000 (inverse of the calculateEmi hand-check above).
 * At 0%: payment 10,000 x 12 months -> principal 120,000.
 */
export function affordablePrincipal(input: AffordablePrincipalInput): number {
  validateEmiArgs(input.monthlyPayment, input.annualRatePercent, input.months);
  const monthlyRate = input.annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return roundMoney(input.monthlyPayment * input.months);
  const factor = Math.pow(1 + monthlyRate, input.months);
  return roundMoney((input.monthlyPayment * (factor - 1)) / (monthlyRate * factor));
}
