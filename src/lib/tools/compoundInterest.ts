/**
 * Compound Interest Calculator — pure logic.
 *
 * Thin wrapper over the shared compound engine
 * (src/lib/tools/compoundEngine.ts): a lump sum plus a fixed monthly
 * contribution, compounded monthly. The yearly balance table comes
 * from the engine too.
 *
 * The rate is USER-ENTERED — no bank or fund rate is hardcoded.
 * All money results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

import { futureValueWithContributions, type CompoundResult } from './compoundEngine';

export interface CompoundInterestInput {
  /** Lump sum invested at the start. */
  principal: number;
  /** Fixed amount added at the end of every month (0 for lump-sum only). */
  monthlyContribution: number;
  /** Annual interest/return rate in percent (user-entered). */
  annualRatePercent: number;
  /** Investment horizon in years (may be fractional). */
  years: number;
}

export type CompoundInterestResult = CompoundResult;

/**
 * Calculate compound growth.
 *
 * Hand-check: principal 100,000, contribution 5,000/month, 10% for
 * 1 year -> future value 173,299.15, contributed 160,000, interest
 * 13,299.15 (see compoundEngine for the arithmetic).
 */
export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  return futureValueWithContributions(input);
}
