// Eduvelto — Currency & Remittance Calculator logic (28 Nov 2026).
//
// USER-ENTERED RATE ONLY (owner's binding FOREVER-AUTO rule): this tool
// fetches NO rates from any API — free or otherwise — and the UI never
// calls a rate "live". The user types the rate (1 FROM = X TO, e.g. from
// their bank or money changer) and the tool does the arithmetic.
// Pure logic: no React, no network, no storage.
//
// Inward remittance (foreign currency -> BDT):
//   converted  = amount x rate
//   incentive  = 2.5% of converted (Bangladesh Bank cash incentive on
//                inward remittance through banking channels), before fee
//   received   = converted - fee + incentive
//   fee is charged in the TO currency.
// Outward (BDT -> foreign currency):
//   converted  = amount / rate
//   received   = converted - fee (no incentive — it applies to inward
//                remittance only)
// The fee must never make the result negative: a fee that eats the whole
// converted amount (or more) is rejected.

export const GOVERNMENT_INCENTIVE_RATE_PERCENT = 2.5;

export interface RemittanceInput {
  /** Amount in the FROM currency. Must be finite and >= 0. */
  amount: number;
  /** User-entered rate: 1 FROM = rate TO. Must be finite and > 0. */
  rate: number;
  /** Transfer fee, in the TO currency. Optional, default 0. Must be >= 0. */
  fee?: number;
  /** Add the 2.5% government incentive (inward remittance only). Default false. */
  includeIncentive?: boolean;
}

export interface RemittanceResult {
  /** amount x rate, in the TO currency. */
  converted: number;
  /** 2.5% of converted when the incentive is on, otherwise 0. */
  incentive: number;
  /** The fee, in the TO currency. */
  fee: number;
  /** What is received, in the TO currency: converted - fee + incentive. */
  received: number;
  /** Reverse rate: 1 TO = reverseRate FROM. */
  reverseRate: number;
}

export interface OutwardRemittanceInput {
  /** Amount in the TO currency (e.g. BDT) being sent out. Must be finite and >= 0. */
  amount: number;
  /** User-entered rate: 1 FROM = rate TO. Must be finite and > 0. */
  rate: number;
  /** Transfer fee, in the FROM currency. Optional, default 0. Must be >= 0. */
  fee?: number;
}

export interface OutwardRemittanceResult {
  /** amount / rate, in the FROM currency. */
  converted: number;
  /** The fee, in the FROM currency. */
  fee: number;
  /** What is received, in the FROM currency: converted - fee. */
  received: number;
  /** Reverse rate: 1 TO = reverseRate FROM. */
  reverseRate: number;
}

/** Round money to two decimals (half away from zero via Math.round). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateCommon(amount: number, rate: number, fee: number): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('amount must be a number of 0 or more');
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('rate must be a number greater than 0');
  }
  if (!Number.isFinite(fee) || fee < 0) {
    throw new Error('fee must be a number of 0 or more');
  }
}

export function calculateRemittance(input: RemittanceInput): RemittanceResult {
  const fee = input.fee ?? 0;
  const includeIncentive = input.includeIncentive ?? false;
  validateCommon(input.amount, input.rate, fee);

  const converted = roundMoney(input.amount * input.rate);
  const incentive = includeIncentive
    ? roundMoney((converted * GOVERNMENT_INCENTIVE_RATE_PERCENT) / 100)
    : 0;
  if (fee > 0 && fee >= converted) {
    throw new Error('fee must be less than the converted amount');
  }
  const received = roundMoney(converted - fee + incentive);
  return { converted, incentive, fee: roundMoney(fee), received, reverseRate: 1 / input.rate };
}

export function calculateOutwardRemittance(input: OutwardRemittanceInput): OutwardRemittanceResult {
  const fee = input.fee ?? 0;
  validateCommon(input.amount, input.rate, fee);

  const converted = roundMoney(input.amount / input.rate);
  if (fee > 0 && fee >= converted) {
    throw new Error('fee must be less than the converted amount');
  }
  const received = roundMoney(converted - fee);
  return { converted, fee: roundMoney(fee), received, reverseRate: 1 / input.rate };
}
