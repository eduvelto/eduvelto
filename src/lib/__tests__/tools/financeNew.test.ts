import { describe, expect, it } from 'vitest';
import {
  BD_FUEL_PRICES,
  fuelCost,
  distanceForBudget,
  savingsGoalMonthly,
  monthsToReachTarget,
  savingsGoalProjection,
} from '../../tools/financeNew';

describe('BD fuel prices (verified 27 Nov 2026)', () => {
  it('matches the BPC November 2026 rates', () => {
    expect(BD_FUEL_PRICES.diesel.pricePerLitre).toBe(135);
    expect(BD_FUEL_PRICES.petrol.pricePerLitre).toBe(160);
    expect(BD_FUEL_PRICES.octane.pricePerLitre).toBe(165);
    expect(BD_FUEL_PRICES.kerosene.pricePerLitre).toBe(155);
    expect(BD_FUEL_PRICES.diesel.sourceKind).toBe('official');
    expect(BD_FUEL_PRICES.diesel.checkedOn).toBe('2026-11-27');
  });
});

describe('fuelCost', () => {
  it('100 km at 10 km/L on octane 165 = 10 L, 1650/trip, 16.50/km', () => {
    const r = fuelCost({ distanceKm: 100, mileageKmPerLitre: 10, pricePerLitre: 165 });
    expect(r.litres).toBe(10);
    expect(r.costPerTrip).toBe(1650);
    expect(r.costPerKm).toBe(16.5);
    expect(r.costPerMonth).toBe(1650 * 26);
  });
  it('rejects zero mileage', () => {
    expect(() => fuelCost({ distanceKm: 100, mileageKmPerLitre: 0, pricePerLitre: 165 })).toThrow(/more than 0/);
  });
  it('distanceForBudget inverts the cost', () => {
    expect(distanceForBudget(1650, 10, 165)).toBe(100);
  });
});

describe('savingsGoalMonthly', () => {
  it('120000 in 24 months at 0% = 5000/month exactly', () => {
    const r = savingsGoalMonthly({ target: 120000, months: 24, annualRatePercent: 0 });
    expect(r.monthlyNeeded).toBe(5000);
    expect(r.totalContributions).toBe(120000);
    expect(r.interestEarned).toBe(0);
  });
  it('with 12% interest the monthly amount drops below 5000', () => {
    const r = savingsGoalMonthly({ target: 120000, months: 24, annualRatePercent: 12 });
    expect(r.monthlyNeeded).toBeLessThan(5000);
    expect(r.monthlyNeeded).toBeGreaterThan(4000);
    expect(r.interestEarned).toBeGreaterThan(0);
  });
  it('already-saved reduces the monthly amount', () => {
    const a = savingsGoalMonthly({ target: 120000, months: 24, annualRatePercent: 0 });
    const b = savingsGoalMonthly({ target: 120000, months: 24, annualRatePercent: 0, alreadySaved: 24000 });
    expect(b.monthlyNeeded).toBe(a.monthlyNeeded - 1000);
  });
  it('goal already reached returns monthly 0', () => {
    const r = savingsGoalMonthly({ target: 10000, months: 12, alreadySaved: 12000 });
    expect(r.goalAlreadyReached).toBe(true);
    expect(r.monthlyNeeded).toBe(0);
  });
  it('projection ends at or above the target', () => {
    const r = savingsGoalMonthly({ target: 120000, months: 24, annualRatePercent: 12 });
    const rows = savingsGoalProjection({ target: 120000, months: 24, annualRatePercent: 12 }, r.monthlyNeeded);
    expect(rows).toHaveLength(24);
    expect(rows[23].balance).toBeGreaterThanOrEqual(120000);
  });
  it('monthsToReachTarget inverts the goal', () => {
    expect(monthsToReachTarget(120000, 5000, 0)).toBe(24);
    expect(monthsToReachTarget(120000, 5000, 12)).toBeLessThan(24);
    expect(monthsToReachTarget(10000, 5000, 0, 12000)).toBe(0);
  });
  it('rejects bad inputs', () => {
    expect(() => savingsGoalMonthly({ target: 0, months: 12 })).toThrow(/more than 0/);
    expect(() => savingsGoalMonthly({ target: 10000, months: 0 })).toThrow(/1 or more/);
  });
});
