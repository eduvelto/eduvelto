/**
 * Tip Calculator — pure logic.
 *
 * tip       = bill x tipPercent / 100
 * total     = bill + tip
 * perPerson = total / people
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface TipInput {
  /** Bill amount before tip. */
  bill: number;
  /** Tip in percent (e.g. 10 means 10%). */
  tipPercent: number;
  /** Number of people splitting the bill (whole number, >= 1). */
  people: number;
}

export interface TipResult {
  /** Tip amount. */
  tip: number;
  /** Bill + tip. */
  total: number;
  /** Total split evenly per person. */
  perPerson: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate tip, total and per-person share.
 *
 * Hand-check: bill 1000, tip 10%, 4 people -> tip = 100;
 * total = 1100; per person = 275.
 */
export function calculateTip(input: TipInput): TipResult {
  if (!Number.isFinite(input.bill) || input.bill < 0) {
    throw new Error(`bill must be a finite number >= 0, got ${input.bill}`);
  }
  if (!Number.isFinite(input.tipPercent) || input.tipPercent < 0) {
    throw new Error(`tipPercent must be a finite number >= 0, got ${input.tipPercent}`);
  }
  if (!Number.isInteger(input.people) || input.people < 1) {
    throw new Error(`people must be a whole number >= 1, got ${input.people}`);
  }
  const tip = roundMoney((input.bill * input.tipPercent) / 100);
  const total = roundMoney(input.bill + tip);
  return { tip, total, perPerson: roundMoney(total / input.people) };
}
