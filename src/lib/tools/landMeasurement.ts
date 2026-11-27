/**
 * Land Measurement — pure logic (Tool #97).
 *
 * Bangladesh land units, all converted through square feet as the common
 * base so every pair of units stays consistent:
 *
 * - 1 decimal (শতক) = 435.6 sq ft
 * - 1 katha (কাঠা) = 1.65 decimal = 718.74 sq ft
 * - 1 bigha (বিঘা) = 20 katha = 33 decimal = 14,374.8 sq ft
 * - 1 acre (একর) = 100 decimal = 43,560 sq ft
 * - 1 hectare (হেক্টর) = 2.471 acre = 107,636.76 sq ft
 * - 1 sq m = 10.7639 sq ft
 *
 * NOTE on the textbook figure "1 acre = 3.025 bigha": that figure and the
 * "1 bigha = 33 decimal" figure cannot both be exact (100 / 33 = 3.0303).
 * This module uses the internally consistent 33-decimal bigha (with 20
 * katha per bigha and 1.65 decimal per katha), so 1 acre = 3.0303 bigha —
 * 0.17% off the rounded 3.025 figure. Every conversion here goes through
 * the square-foot base above, so convert(a -> b) and convert(b -> a) are
 * exact inverses of each other.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export type LandUnit = 'decimal' | 'katha' | 'bigha' | 'acre' | 'hectare' | 'sqft' | 'sqm';

/** Square feet in one unit of each land unit. */
export const LAND_SQFT_PER_UNIT: Record<LandUnit, number> = {
  decimal: 435.6,
  katha: 718.74, // 1.65 x 435.6
  bigha: 14374.8, // 33 x 435.6
  acre: 43560, // 100 x 435.6
  hectare: 107636.76, // 2.471 x 43560
  sqft: 1,
  sqm: 10.7639,
};

/** Bengali name of each unit (for UI labels). */
export const LAND_UNIT_BENGALI: Record<LandUnit, string> = {
  decimal: 'শতক',
  katha: 'কাঠা',
  bigha: 'বিঘা',
  acre: 'একর',
  hectare: 'হেক্টর',
  sqft: 'বর্গফুট',
  sqm: 'বর্গমিটার',
};

const LAND_UNITS: ReadonlySet<string> = new Set(Object.keys(LAND_SQFT_PER_UNIT));

function validateLandValue(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Land area must be a finite number >= 0, got ${value}`);
  }
}

function validateLandUnit(unit: string, label: string): asserts unit is LandUnit {
  if (!LAND_UNITS.has(unit)) {
    throw new Error(
      `${label} must be one of decimal, katha, bigha, acre, hectare, sqft, sqm — got ${unit}`,
    );
  }
}

/**
 * Convert a land area from one unit to another.
 *
 * Hand-checks: 1 acre -> 100 decimal; 1 bigha -> 20 katha; 1 katha ->
 * 1.65 decimal; 1 hectare -> 2.471 acre; 1 decimal -> 435.6 sq ft;
 * 1 sq m -> 10.7639 sq ft.
 */
export function convertLandArea(value: number, fromUnit: LandUnit, toUnit: LandUnit): number {
  validateLandValue(value);
  validateLandUnit(fromUnit, 'fromUnit');
  validateLandUnit(toUnit, 'toUnit');
  if (fromUnit === toUnit) return value;
  const sqft = value * LAND_SQFT_PER_UNIT[fromUnit];
  return Math.round((sqft / LAND_SQFT_PER_UNIT[toUnit]) * 1e6) / 1e6;
}

export interface PlotArea {
  /** Area in square feet (lengthFt x widthFt). */
  sqft: number;
  /** Area in square metres. */
  sqm: number;
  /** Area in decimal (শতক). */
  decimal: number;
  /** Area in katha (কাঠা). */
  katha: number;
  /** Area in bigha (বিঘা). */
  bigha: number;
  /** Area in acre (একর). */
  acre: number;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Area of a rectangular plot from its length and width in feet, expressed
 * in every common Bangladesh unit.
 *
 * Hand-check: 66 ft x 33 ft = 2,178 sq ft = 2,178 / 435.6 = 5 decimal
 * exactly; 5 / 1.65 = 3.0303 katha; 5 / 33 = 0.1515 bigha; 0.05 acre.
 */
export function plotAreaFromDimensions(lengthFt: number, widthFt: number): PlotArea {
  validateLandValue(lengthFt);
  validateLandValue(widthFt);
  const sqft = lengthFt * widthFt;
  return {
    sqft: round4(sqft),
    sqm: round4(sqft / LAND_SQFT_PER_UNIT.sqm),
    decimal: round4(sqft / LAND_SQFT_PER_UNIT.decimal),
    katha: round4(sqft / LAND_SQFT_PER_UNIT.katha),
    bigha: round4(sqft / LAND_SQFT_PER_UNIT.bigha),
    acre: round4(sqft / LAND_SQFT_PER_UNIT.acre),
  };
}
