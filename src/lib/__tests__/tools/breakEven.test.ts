// Break-even calculator — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/breakEven.ts.
import { describe, it, expect } from 'vitest';
import { calculateBreakEven, unitsForTargetProfit, profitAtUnits } from '../../tools/breakEven';

describe('calculateBreakEven', () => {
  it('fixed 50,000, variable 100, price 250 -> 334 units, revenue 83,500', () => {
    // Margin 150, ratio 60%, 50,000/150 = 333.33 -> 334 units.
    expect(calculateBreakEven({ fixedCosts: 50000, variableCostPerUnit: 100, sellingPricePerUnit: 250 })).toEqual({
      possible: true,
      contributionMarginPerUnit: 150,
      contributionMarginRatioPercent: 60,
      breakEvenUnits: 334,
      breakEvenRevenue: 83500,
    });
  });

  it('price at or below variable cost -> impossible', () => {
    const r = calculateBreakEven({ fixedCosts: 50000, variableCostPerUnit: 250, sellingPricePerUnit: 250 });
    expect(r.possible).toBe(false);
    expect(r.breakEvenUnits).toBeNull();
    expect(r.breakEvenRevenue).toBeNull();
  });
});

describe('unitsForTargetProfit', () => {
  it('target profit 30,000 -> 534 units', () => {
    // (50,000 + 30,000) / 150 = 533.33 -> 534.
    expect(
      unitsForTargetProfit({ fixedCosts: 50000, variableCostPerUnit: 100, sellingPricePerUnit: 250 }, 30000),
    ).toBe(534);
  });

  it('impossible margin -> null', () => {
    expect(
      unitsForTargetProfit({ fixedCosts: 50000, variableCostPerUnit: 250, sellingPricePerUnit: 250 }, 10000),
    ).toBeNull();
  });
});

describe('profitAtUnits', () => {
  it('500 units -> revenue 125,000, cost 100,000, profit 25,000', () => {
    expect(
      profitAtUnits({ fixedCosts: 50000, variableCostPerUnit: 100, sellingPricePerUnit: 250, units: 500 }),
    ).toEqual({ revenue: 125000, totalCost: 100000, profit: 25000 });
  });

  it('0 units -> loss equal to the fixed costs', () => {
    expect(
      profitAtUnits({ fixedCosts: 50000, variableCostPerUnit: 100, sellingPricePerUnit: 250, units: 0 }),
    ).toEqual({ revenue: 0, totalCost: 50000, profit: -50000 });
  });
});
