/**
 * Break-Even Calculator — pure logic.
 *
 *   contributionMarginPerUnit = sellingPrice - variableCostPerUnit
 *   breakEvenUnits = fixedCosts / contributionMarginPerUnit (rounded UP
 *     — you cannot sell a fraction of a unit to break even)
 *   breakEvenRevenue = breakEvenUnits x sellingPrice
 *   contributionMarginRatio = marginPerUnit / sellingPrice x 100
 *
 * When the selling price does not cover the variable cost per unit,
 * the margin is zero or negative and breaking even is impossible —
 * the result says so (possible: false) instead of returning a
 * meaningless negative unit count. The what-if mode answers "how
 * many units must I sell to make a target profit?":
 *   units = (fixedCosts + targetProfit) / marginPerUnit (rounded up).
 *
 * No figures are hardcoded — every number is the user's own. All
 * money results are estimates, rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface BreakEvenInput {
  /** Costs that do not change with sales (rent, salaries, ...). */
  fixedCosts: number;
  /** Cost of making / buying one unit. */
  variableCostPerUnit: number;
  /** Price one unit sells for. */
  sellingPricePerUnit: number;
}

export interface BreakEvenResult {
  /** False when the selling price is at or below the variable cost. */
  possible: boolean;
  /** Profit on one unit (selling price minus variable cost). */
  contributionMarginPerUnit: number;
  /** Margin as a share of the selling price, in percent. */
  contributionMarginRatioPercent: number;
  /** Whole units to sell before profit starts (null when impossible). */
  breakEvenUnits: number | null;
  /** Revenue at the break-even point (null when impossible). */
  breakEvenRevenue: number | null;
}

export interface ProfitAtUnitsInput extends BreakEvenInput {
  /** Units sold. */
  units: number;
}

export interface ProfitAtUnitsResult {
  /** Revenue at this volume. */
  revenue: number;
  /** Fixed + variable costs at this volume. */
  totalCost: number;
  /** Revenue minus total cost (negative = a loss). */
  profit: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateBreakEven(input: BreakEvenInput): void {
  if (!Number.isFinite(input.fixedCosts) || input.fixedCosts < 0) {
    throw new Error(`fixedCosts must be a finite number >= 0, got ${input.fixedCosts}`);
  }
  if (!Number.isFinite(input.variableCostPerUnit) || input.variableCostPerUnit < 0) {
    throw new Error(`variableCostPerUnit must be a finite number >= 0, got ${input.variableCostPerUnit}`);
  }
  if (!Number.isFinite(input.sellingPricePerUnit) || input.sellingPricePerUnit < 0) {
    throw new Error(`sellingPricePerUnit must be a finite number >= 0, got ${input.sellingPricePerUnit}`);
  }
}

/**
 * Break-even point.
 *
 * Hand-check: fixed 50,000, variable 100/unit, price 250/unit ->
 * margin 150, ratio 60%, break-even 334 units (50,000/150 = 333.33,
 * rounded up), revenue 83,500.
 * Impossible case: variable 250, price 250 -> margin 0, possible false.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  validateBreakEven(input);
  const margin = roundMoney(input.sellingPricePerUnit - input.variableCostPerUnit);
  const ratio =
    input.sellingPricePerUnit === 0
      ? 0
      : Math.round((margin / input.sellingPricePerUnit) * 10000) / 100;
  if (margin <= 0) {
    return {
      possible: false,
      contributionMarginPerUnit: margin,
      contributionMarginRatioPercent: ratio,
      breakEvenUnits: null,
      breakEvenRevenue: null,
    };
  }
  const units = Math.ceil(input.fixedCosts / margin);
  return {
    possible: true,
    contributionMarginPerUnit: margin,
    contributionMarginRatioPercent: ratio,
    breakEvenUnits: units,
    breakEvenRevenue: roundMoney(units * input.sellingPricePerUnit),
  };
}

/**
 * What-if: units needed to earn a target profit.
 *
 * Hand-check: fixed 50,000, variable 100, price 250, target profit
 * 30,000 -> (50,000 + 30,000) / 150 = 533.33 -> 534 units.
 * Returns null when breaking even itself is impossible.
 */
export function unitsForTargetProfit(input: BreakEvenInput, targetProfit: number): number | null {
  validateBreakEven(input);
  if (!Number.isFinite(targetProfit) || targetProfit < 0) {
    throw new Error(`targetProfit must be a finite number >= 0, got ${targetProfit}`);
  }
  const margin = input.sellingPricePerUnit - input.variableCostPerUnit;
  if (margin <= 0) return null;
  return Math.ceil((input.fixedCosts + targetProfit) / margin);
}

/**
 * Profit at a given sales volume.
 *
 * Hand-check: fixed 50,000, variable 100, price 250, 500 units ->
 * revenue 125,000, total cost 100,000, profit 25,000.
 */
export function profitAtUnits(input: ProfitAtUnitsInput): ProfitAtUnitsResult {
  validateBreakEven(input);
  if (!Number.isFinite(input.units) || input.units < 0 || !Number.isInteger(input.units)) {
    throw new Error(`units must be a non-negative integer, got ${input.units}`);
  }
  const revenue = roundMoney(input.units * input.sellingPricePerUnit);
  const totalCost = roundMoney(input.fixedCosts + input.units * input.variableCostPerUnit);
  return { revenue, totalCost, profit: roundMoney(revenue - totalCost) };
}
