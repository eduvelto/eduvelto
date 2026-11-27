/**
 * Expense Splitter — pure logic.
 *
 * - Equal split: perPerson = total / people.
 * - Split by shares: each share gets total x share / sum(shares),
 *   rounded to 2 decimals, with the rounding drift (at most a few
 *   paisa) folded into the last share so the parts always add up
 *   to the total exactly.
 * - Settle up: everyone owes an equal share of the total; whoever
 *   paid more is owed money, whoever paid less owes money. A greedy
 *   match pairs the biggest debtors with the biggest creditors, so
 *   the transfer list is minimal.
 *
 * No amounts are hardcoded — every number is the user's own. All
 * money results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface EqualSplitResult {
  /** What each person pays. */
  perPerson: number;
  /** Number of people. */
  peopleCount: number;
}

export interface ShareSplitResult {
  /** Amount per share, in the same order as the input shares. */
  amounts: number[];
}

export interface PersonPayment {
  /** Person's name (any label the user typed). */
  name: string;
  /** What this person already paid towards the shared expense. */
  paid: number;
}

export interface PersonBalance {
  name: string;
  paid: number;
  /** Equal share of the total. */
  share: number;
  /** paid - share: positive = is owed money, negative = owes money. */
  net: number;
}

export interface Transfer {
  /** Who pays. */
  from: string;
  /** Who receives. */
  to: string;
  /** Amount to transfer. */
  amount: number;
}

export interface SettleUpResult {
  /** Total of everything paid. */
  total: number;
  /** Equal share per person. */
  sharePerPerson: number;
  /** Per-person balances. */
  balances: PersonBalance[];
  /** Minimal transfers that settle everyone. */
  transfers: Transfer[];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Equal split.
 *
 * Hand-check: total 3,000 among 4 people -> 750 each.
 */
export function splitEqually(total: number, peopleCount: number): EqualSplitResult {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error(`total must be a finite number >= 0, got ${total}`);
  }
  if (!Number.isFinite(peopleCount) || peopleCount <= 0 || !Number.isInteger(peopleCount)) {
    throw new Error(`peopleCount must be a positive integer, got ${peopleCount}`);
  }
  return { perPerson: roundMoney(total / peopleCount), peopleCount };
}

/**
 * Split by shares (e.g. shares [2, 1, 1] on 4,000 -> 2,000 / 1,000 / 1,000).
 *
 * Hand-check: total 1,000, shares [1, 1, 1] -> 333.33 / 333.33 /
 * 333.34 (the 0.01 rounding drift goes to the last share; the parts
 * add up to 1,000 exactly).
 */
export function splitByShares(total: number, shares: number[]): ShareSplitResult {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error(`total must be a finite number >= 0, got ${total}`);
  }
  if (!Array.isArray(shares) || shares.length === 0) {
    throw new Error('shares must be a non-empty array');
  }
  shares.forEach((s, i) => {
    if (!Number.isFinite(s) || s < 0) {
      throw new Error(`shares[${i}] must be a finite number >= 0, got ${s}`);
    }
  });
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum <= 0) throw new Error('shares must add up to more than 0');
  const amounts = shares.map((s) => roundMoney((total * s) / sum));
  // Fold rounding drift into the last share so parts sum to total.
  const drift = roundMoney(total - amounts.reduce((a, b) => a + b, 0));
  amounts[amounts.length - 1] = roundMoney(amounts[amounts.length - 1] + drift);
  return { amounts };
}

/**
 * Settle up.
 *
 * Hand-check: A paid 3,000, B paid 1,000, C paid 0; total 4,000,
 * share 1,333.33 each. Nets: A +1,666.67, B -333.33, C -1,333.33.
 * Transfers: C -> A 1,333.33, B -> A 333.33 (A ends whole).
 * Already-even case: everyone paid their share -> no transfers.
 */
export function settleUp(payments: PersonPayment[]): SettleUpResult {
  if (!Array.isArray(payments) || payments.length === 0) {
    throw new Error('payments must be a non-empty array');
  }
  payments.forEach((p, i) => {
    if (!Number.isFinite(p.paid) || p.paid < 0) {
      throw new Error(`payments[${i}].paid must be a finite number >= 0, got ${p.paid}`);
    }
    if (typeof p.name !== 'string' || p.name.trim() === '') {
      throw new Error(`payments[${i}].name must be a non-empty string`);
    }
  });
  const total = roundMoney(payments.reduce((a, p) => a + p.paid, 0));
  const sharePerPerson = roundMoney(total / payments.length);
  const balances: PersonBalance[] = payments.map((p) => ({
    name: p.name,
    paid: roundMoney(p.paid),
    share: sharePerPerson,
    net: roundMoney(p.paid - sharePerPerson),
  }));
  // Greedy settle: debtors (net < 0) pay creditors (net > 0).
  const debtors = balances
    .filter((b) => b.net < -0.004)
    .map((b) => ({ name: b.name, owes: -b.net }))
    .sort((a, b) => b.owes - a.owes);
  const creditors = balances
    .filter((b) => b.net > 0.004)
    .map((b) => ({ name: b.name, owed: b.net }))
    .sort((a, b) => b.owed - a.owed);
  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const amount = roundMoney(Math.min(debtors[di].owes, creditors[ci].owed));
    if (amount <= 0) break;
    transfers.push({ from: debtors[di].name, to: creditors[ci].name, amount });
    debtors[di].owes = roundMoney(debtors[di].owes - amount);
    creditors[ci].owed = roundMoney(creditors[ci].owed - amount);
    if (debtors[di].owes <= 0.004) di += 1;
    if (creditors[ci].owed <= 0.004) ci += 1;
  }
  return { total, sharePerPerson, balances, transfers };
}
