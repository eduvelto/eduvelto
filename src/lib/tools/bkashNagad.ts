/**
 * bKash / Nagad Cash Out Charge Calculator — pure logic.
 *
 * charge = amount x chargeRatePercent / 100
 * total  = amount + charge
 *
 * The charge rate is a USER-ENTERED input with a sensible starting
 * value in the UI — it is NEVER hardcoded here as a fact, because
 * mobile-banking rates change over time. Always check the current
 * rate with the provider before sending money.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export type CashOutProvider = 'bkash' | 'nagad';
export type CashOutMethod = 'agent' | 'personal' | 'app';

export interface CashOutInput {
  /** Amount to cash out. */
  amount: number;
  /** Charge rate in percent, user-entered (e.g. 1.49 means 1.49%). */
  chargeRatePercent: number;
}

export interface CashOutResult {
  /** The charge on this amount. */
  charge: number;
  /** Amount + charge: what the sender pays in total. */
  total: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate the cash-out charge.
 *
 * Hand-check: amount 1000 at 1.49% -> charge = 1000 x 1.49 / 100
 * = 14.90; total = 1014.90.
 */
export function calculateCashOutCharge(input: CashOutInput): CashOutResult {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error(`amount must be a finite number >= 0, got ${input.amount}`);
  }
  if (!Number.isFinite(input.chargeRatePercent) || input.chargeRatePercent < 0) {
    throw new Error(
      `chargeRatePercent must be a finite number >= 0, got ${input.chargeRatePercent}`,
    );
  }
  const charge = roundMoney((input.amount * input.chargeRatePercent) / 100);
  return { charge, total: roundMoney(input.amount + charge) };
}
