// Budget Planner — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateBudget } from '../../tools/budgetPlanner';

const BASE = {
  income: 50000,
  housing: 15000,
  food: 10000,
  transport: 3000,
  utilities: 4000,
  other: 5000,
} as const;

// Total expenses: 15000 + 10000 + 3000 + 4000 + 5000 = 37000.

describe('calculateBudget', () => {
  it('income 50000, expenses 37000 -> remaining 13000, savings rate 26%', () => {
    const result = calculateBudget(BASE);
    expect(result.totalExpenses).toBe(37000);
    expect(result.remaining).toBe(13000);
    expect(result.savingsRate).toBe(26);
  });

  it('breakdown lists every category with its share of income', () => {
    const result = calculateBudget(BASE);
    expect(result.breakdown).toEqual([
      { category: 'housing', amount: 15000, percentOfIncome: 30 },
      { category: 'food', amount: 10000, percentOfIncome: 20 },
      { category: 'transport', amount: 3000, percentOfIncome: 6 },
      { category: 'utilities', amount: 4000, percentOfIncome: 8 },
      { category: 'other', amount: 5000, percentOfIncome: 10 },
    ]);
  });

  it('overspending gives a negative remaining and savings rate', () => {
    // Expenses 37000 + extra 20000 housing = 57000; remaining -7000; rate -14%.
    const result = calculateBudget({ ...BASE, housing: 35000 });
    expect(result.totalExpenses).toBe(57000);
    expect(result.remaining).toBe(-7000);
    expect(result.savingsRate).toBe(-14);
  });

  it('zero income gives a zero savings rate, not a division error', () => {
    const result = calculateBudget({ ...BASE, income: 0 });
    expect(result.totalExpenses).toBe(37000);
    expect(result.remaining).toBe(-37000);
    expect(result.savingsRate).toBe(0);
    expect(result.breakdown.every((row) => row.percentOfIncome === 0)).toBe(true);
  });

  it('zero expenses leaves the whole income remaining', () => {
    const result = calculateBudget({
      income: 20000,
      housing: 0,
      food: 0,
      transport: 0,
      utilities: 0,
      other: 0,
    });
    expect(result).toEqual({
      totalExpenses: 0,
      remaining: 20000,
      savingsRate: 100,
      breakdown: [
        { category: 'housing', amount: 0, percentOfIncome: 0 },
        { category: 'food', amount: 0, percentOfIncome: 0 },
        { category: 'transport', amount: 0, percentOfIncome: 0 },
        { category: 'utilities', amount: 0, percentOfIncome: 0 },
        { category: 'other', amount: 0, percentOfIncome: 0 },
      ],
    });
  });

  it('rejects negative amounts', () => {
    expect(() => calculateBudget({ ...BASE, income: -1 })).toThrow(/income/);
    expect(() => calculateBudget({ ...BASE, food: -100 })).toThrow(/food/);
  });
});
