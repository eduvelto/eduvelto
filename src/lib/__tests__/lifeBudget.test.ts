// Eduvelto — life budget unit tests (§3C).
//
// Expected values are computed from the fixtures — nothing is invented.

import { describe, expect, it } from 'vitest';
import {
  categoryTotals,
  monthlySummary,
  remainingBalance,
  savingsGoalProgress,
  totalExpenses,
  totalIncome,
  type BudgetEntry,
} from '../lifeBudget';

function entry(overrides: Partial<BudgetEntry> & { id: string }): BudgetEntry {
  return {
    type: 'expense',
    amount: 0,
    note: '',
    month: '2026-11',
    createdAt: 1,
    ...overrides,
  };
}

const FIXTURES: BudgetEntry[] = [
  entry({ id: 'i1', type: 'income', amount: 30000, note: 'বেতন' }),
  entry({ id: 'i2', type: 'income', amount: 5000, note: 'টিউশন' }),
  entry({ id: 'i3', type: 'income', amount: 2000, month: '2026-10', note: 'গত মাস' }),
  entry({ id: 'e1', type: 'expense', amount: 8000, category: 'rent', note: 'বাসা ভাড়া' }),
  entry({ id: 'e2', type: 'expense', amount: 6000, category: 'food', note: 'বাজার' }),
  entry({ id: 'e3', type: 'expense', amount: 1500, category: 'transport', note: 'যাতায়াত' }),
  entry({ id: 'e4', type: 'expense', amount: 2000, category: 'education', note: 'বই' }),
  entry({ id: 'e5', type: 'expense', amount: 1000, category: 'health', note: 'ঔষধ' }),
  entry({ id: 'e6', type: 'expense', amount: 500, note: 'বিবিধ' }),
  entry({ id: 'e7', type: 'expense', amount: 4000, category: 'food', month: '2026-10', note: 'গত মাস' }),
];

describe('totalIncome', () => {
  it('sums only income entries of the given month', () => {
    expect(totalIncome(FIXTURES, '2026-11')).toBe(35000);
    expect(totalIncome(FIXTURES, '2026-10')).toBe(2000);
    expect(totalIncome(FIXTURES, '2026-09')).toBe(0);
    expect(totalIncome([], '2026-11')).toBe(0);
  });
});

describe('totalExpenses', () => {
  it('sums only expense entries of the given month', () => {
    expect(totalExpenses(FIXTURES, '2026-11')).toBe(19000);
    expect(totalExpenses(FIXTURES, '2026-10')).toBe(4000);
  });
});

describe('categoryTotals', () => {
  it('splits expenses per category and defaults uncategorised to other', () => {
    expect(categoryTotals(FIXTURES, '2026-11')).toEqual({
      rent: 8000,
      food: 6000,
      transport: 1500,
      education: 2000,
      health: 1000,
      other: 500,
    });
  });

  it('returns all-zero totals for an empty month', () => {
    expect(categoryTotals(FIXTURES, '2026-09')).toEqual({
      rent: 0,
      food: 0,
      transport: 0,
      education: 0,
      health: 0,
      other: 0,
    });
  });
});

describe('remainingBalance', () => {
  it('is income minus expenses, and can go negative', () => {
    expect(remainingBalance(35000, 19000)).toBe(16000);
    expect(remainingBalance(10000, 15000)).toBe(-5000);
    expect(remainingBalance(0, 0)).toBe(0);
  });
});

describe('monthlySummary', () => {
  it('combines income, expenses, remaining and category totals', () => {
    const s = monthlySummary(FIXTURES, '2026-11');
    expect(s).toEqual({
      month: '2026-11',
      income: 35000,
      expenses: 19000,
      remaining: 16000,
      byCategory: {
        rent: 8000,
        food: 6000,
        transport: 1500,
        education: 2000,
        health: 1000,
        other: 500,
      },
    });
  });
});

describe('savingsGoalProgress', () => {
  it('reports percent and remaining for a partial goal', () => {
    expect(savingsGoalProgress({ name: 'ল্যাপটপ', targetAmount: 50000, savedAmount: 12500 })).toEqual({
      name: 'ল্যাপটপ',
      target: 50000,
      saved: 12500,
      remaining: 37500,
      percent: 25,
      reached: false,
    });
  });

  it('caps at 100% and marks reached when saved meets or beats the target', () => {
    const p = savingsGoalProgress({ name: 'জরুরি তহবিল', targetAmount: 10000, savedAmount: 12000 });
    expect(p.percent).toBe(100);
    expect(p.remaining).toBe(0);
    expect(p.reached).toBe(true);
  });

  it('returns 0% when the target is not positive', () => {
    const p = savingsGoalProgress({ name: 'খালি', targetAmount: 0, savedAmount: 500 });
    expect(p.percent).toBe(0);
    expect(p.reached).toBe(false);
  });
});

describe('bad input', () => {
  it('treats negative and non-finite amounts as 0', () => {
    const bad: BudgetEntry[] = [
      entry({ id: 'b1', type: 'income', amount: -1000 }),
      entry({ id: 'b2', type: 'income', amount: Number.NaN }),
      entry({ id: 'b3', type: 'expense', amount: -500, category: 'food' }),
    ];
    expect(totalIncome(bad, '2026-11')).toBe(0);
    expect(totalExpenses(bad, '2026-11')).toBe(0);
    expect(remainingBalance(-100, -50)).toBe(0);
  });
});
