/**
 * Budget Planner — pure logic.
 *
 * totalExpenses = housing + food + transport + utilities + other
 * remaining     = income - totalExpenses
 * savingsRate   = remaining / income x 100 (0 when income is 0)
 * breakdown     = each category's amount and share of income
 *
 * All amounts are USER-ENTERED. Pure functions only: no network,
 * no storage, no DOM.
 */

export interface BudgetInput {
  /** Monthly income. */
  income: number;
  /** Monthly housing cost (rent, etc.). */
  housing: number;
  /** Monthly food cost. */
  food: number;
  /** Monthly transport cost. */
  transport: number;
  /** Monthly utilities (electricity, gas, water, internet). */
  utilities: number;
  /** All other monthly expenses. */
  other: number;
}

export interface BudgetCategoryBreakdown {
  category: 'housing' | 'food' | 'transport' | 'utilities' | 'other';
  amount: number;
  /** Share of income in percent (0 when income is 0). */
  percentOfIncome: number;
}

export interface BudgetResult {
  totalExpenses: number;
  remaining: number;
  /** Remaining as a percent of income (0 when income is 0). */
  savingsRate: number;
  breakdown: BudgetCategoryBreakdown[];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

const CATEGORIES = ['housing', 'food', 'transport', 'utilities', 'other'] as const;

/**
 * Calculate a monthly budget summary.
 *
 * Hand-check: income 50000; housing 15000, food 10000, transport 3000,
 * utilities 4000, other 5000 -> total expenses 37000; remaining 13000;
 * savings rate = 13000 / 50000 x 100 = 26%.
 */
export function calculateBudget(input: BudgetInput): BudgetResult {
  for (const key of ['income', ...CATEGORIES] as const) {
    const value = input[key];
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${key} must be a finite number >= 0, got ${value}`);
    }
  }
  const totalExpenses = roundMoney(
    input.housing + input.food + input.transport + input.utilities + input.other,
  );
  const remaining = roundMoney(input.income - totalExpenses);
  const savingsRate = input.income > 0 ? roundPercent((remaining / input.income) * 100) : 0;
  return {
    totalExpenses,
    remaining,
    savingsRate,
    breakdown: CATEGORIES.map((category) => ({
      category,
      amount: roundMoney(input[category]),
      percentOfIncome:
        input.income > 0 ? roundPercent((input[category] / input.income) * 100) : 0,
    })),
  };
}
