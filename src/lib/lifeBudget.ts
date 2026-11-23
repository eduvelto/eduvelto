// Eduvelto — Life budget helpers (§3C, LifeHub).
//
// Pure functions only: no localStorage, no network, no login. The
// budget page keeps its data on the device (localStorage key
// `eduvelto.life.budget.v1`) and calls these helpers to summarise it.
// Amounts are in taka (BDT); every function tolerates bad input by
// treating non-finite / negative amounts as 0.

export type ExpenseCategory =
  | 'rent'
  | 'food'
  | 'transport'
  | 'education'
  | 'health'
  | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent',
  'food',
  'transport',
  'education',
  'health',
  'other',
];

export type BudgetEntryType = 'income' | 'expense';

export interface BudgetEntry {
  id: string;
  type: BudgetEntryType;
  /** Taka. Must be >= 0; anything else is treated as 0 by the helpers. */
  amount: number;
  /** Expense category; undefined for income entries. */
  category?: ExpenseCategory;
  note: string;
  /** Month the entry belongs to, 'YYYY-MM'. */
  month: string;
  /** Unix millis, for stable ordering. */
  createdAt: number;
}

export interface SavingsGoal {
  name: string;
  /** Target amount in taka. */
  targetAmount: number;
  /** Amount already set aside in taka. */
  savedAmount: number;
}

export interface SavingsProgress {
  name: string;
  target: number;
  saved: number;
  /** Taka still needed; never negative. */
  remaining: number;
  /** 0–100, capped at 100; 0 when the target is not positive. */
  percent: number;
  reached: boolean;
}

export interface MonthSummary {
  month: string;
  income: number;
  expenses: number;
  remaining: number;
  byCategory: Record<ExpenseCategory, number>;
}

function cleanAmount(amount: unknown): number {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function isMonthEntry(entry: BudgetEntry, month: string): boolean {
  return entry.month === month;
}

/** Total income for a month. */
export function totalIncome(entries: BudgetEntry[], month: string): number {
  return entries
    .filter((e) => e.type === 'income' && isMonthEntry(e, month))
    .reduce((sum, e) => sum + cleanAmount(e.amount), 0);
}

/** Total expenses for a month. */
export function totalExpenses(entries: BudgetEntry[], month: string): number {
  return entries
    .filter((e) => e.type === 'expense' && isMonthEntry(e, month))
    .reduce((sum, e) => sum + cleanAmount(e.amount), 0);
}

/** Expense totals per category for a month; every category is present. */
export function categoryTotals(
  entries: BudgetEntry[],
  month: string,
): Record<ExpenseCategory, number> {
  const totals: Record<ExpenseCategory, number> = {
    rent: 0,
    food: 0,
    transport: 0,
    education: 0,
    health: 0,
    other: 0,
  };
  for (const e of entries) {
    if (e.type !== 'expense' || !isMonthEntry(e, month)) continue;
    const cat: ExpenseCategory = e.category && EXPENSE_CATEGORIES.includes(e.category) ? e.category : 'other';
    totals[cat] += cleanAmount(e.amount);
  }
  return totals;
}

/** Income minus expenses. Negative means the month is over budget. */
export function remainingBalance(income: number, expenses: number): number {
  return cleanAmount(income) - cleanAmount(expenses);
}

/** Full monthly summary: income, expenses, remaining, per-category spend. */
export function monthlySummary(entries: BudgetEntry[], month: string): MonthSummary {
  const income = totalIncome(entries, month);
  const expenses = totalExpenses(entries, month);
  return {
    month,
    income,
    expenses,
    remaining: remainingBalance(income, expenses),
    byCategory: categoryTotals(entries, month),
  };
}

/** Savings-goal progress. Saved amounts above the target cap at 100%. */
export function savingsGoalProgress(goal: SavingsGoal): SavingsProgress {
  const target = cleanAmount(goal.targetAmount);
  const saved = cleanAmount(goal.savedAmount);
  if (target <= 0) {
    return { name: goal.name, target: 0, saved, remaining: 0, percent: 0, reached: false };
  }
  const remaining = Math.max(0, target - saved);
  return {
    name: goal.name,
    target,
    saved,
    remaining,
    percent: Math.min(100, (saved / target) * 100),
    reached: saved >= target,
  };
}
