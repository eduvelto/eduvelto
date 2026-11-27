/**
 * Electricity Bill Calculator — Bangladesh residential (LT-A) tariff.
 *
 * The slab RATES are USER-EDITABLE and labelled with their source
 * and date, because they change and because published sources
 * disagree on the higher slabs. The DEFAULT rates below are the
 * BERC residential tariff as reported for the June 2026 billing
 * month (lifeline ৳4.63 up to 50 units; 0–75 ৳5.26; 76–200 ৳8.50;
 * 201–300 ৳9.10; 301–400 ৳9.62; 401–600 ৳15.01; above 600 ৳17.35;
 * demand charge ৳42/kW; VAT 5%). Older published tables give lower
 * higher-slab rates (e.g. ৳7.20 / ৳12.67 / ৳14.61) — that
 * disagreement is exactly why the rates are editable and the result
 * is labelled আনুমানিক (approximate), never presented as the
 * official bill. DPDC / DESCO / BREB / NESCO / WZPDCL all use the
 * same BERC residential tariff; only the sanctioned load, meter
 * rent and VAT treatment on your own bill can differ.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface TariffSlab {
  /** First unit in this slab (inclusive), 0-based. */
  from: number;
  /** Last unit in this slab (inclusive), or null for "above". */
  to: number | null;
  /** Taka per unit. */
  rate: number;
}

export interface Tariff {
  /** Lifeline: when total use is at or below this many units, ALL units are charged at lifelineRate. */
  lifelineMaxUnits: number;
  lifelineRate: number;
  slabs: TariffSlab[];
  /** Demand charge, taka per kW of sanctioned load per month. */
  demandChargePerKw: number;
  /** VAT percent applied to (energy + demand + meter rent). */
  vatPercent: number;
  /** Meter rent per month (0 if your bill has none / prepaid). */
  meterRent: number;
  /** Human-readable source label shown in the UI. */
  sourceLabelBn: string;
  sourceLabelEn: string;
}

/** Default tariff — BERC residential tariff as reported for June 2026. See header. */
export const DEFAULT_TARIFF: Tariff = {
  lifelineMaxUnits: 50,
  lifelineRate: 4.63,
  slabs: [
    { from: 0, to: 75, rate: 5.26 },
    { from: 76, to: 200, rate: 8.5 },
    { from: 201, to: 300, rate: 9.1 },
    { from: 301, to: 400, rate: 9.62 },
    { from: 401, to: 600, rate: 15.01 },
    { from: 601, to: null, rate: 17.35 },
  ],
  demandChargePerKw: 42,
  vatPercent: 5,
  meterRent: 0,
  sourceLabelBn: 'BERC আবাসিক ট্যারিফ, জুন ২০২৬ বিলিং মাসের হিসাবে প্রকাশিত হার — আপনার বিলের সঙ্গে মিলিয়ে হার বদলে নিন',
  sourceLabelEn:
    'BERC residential tariff as reported for the June 2026 billing month — check against your own bill and edit the rates',
};

export interface SlabBreakdown {
  labelBn: string;
  labelEn: string;
  units: number;
  rate: number;
  amount: number;
}

export interface ElectricityBillResult {
  units: number;
  breakdown: SlabBreakdown[];
  energyCharge: number;
  demandCharge: number;
  meterRent: number;
  vat: number;
  total: number;
  averagePerUnit: number;
  lifelineApplied: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate an approximate monthly bill.
 *
 * Hand-check (default tariff): 200 units, 1 kW load, no meter rent.
 * Energy: 75×5.26 + 125×8.50 = 394.50 + 1,062.50 = ৳1,457.00.
 * Demand: ৳42. Subtotal ৳1,499. VAT 5% = ৳74.95. Total ৳1,573.95.
 * Lifeline check: 40 units -> 40×4.63 = ৳185.20 energy.
 */
export function calculateElectricityBill(
  units: number,
  sanctionedLoadKw: number,
  tariff: Tariff,
): ElectricityBillResult {
  if (!Number.isFinite(units) || units < 0) {
    throw new Error(`units must be a non-negative number, got ${units}`);
  }
  if (!Number.isFinite(sanctionedLoadKw) || sanctionedLoadKw < 0) {
    throw new Error(`sanctioned load must be a non-negative number, got ${sanctionedLoadKw}`);
  }
  const breakdown: SlabBreakdown[] = [];
  let energyCharge = 0;
  let lifelineApplied = false;
  if (units > 0 && units <= tariff.lifelineMaxUnits) {
    lifelineApplied = true;
    const amount = round2(units * tariff.lifelineRate);
    energyCharge = amount;
    breakdown.push({
      labelBn: `লাইফলাইন (০–${tariff.lifelineMaxUnits} ইউনিট)`,
      labelEn: `Lifeline (0–${tariff.lifelineMaxUnits} units)`,
      units,
      rate: tariff.lifelineRate,
      amount,
    });
  } else {
    for (const slab of tariff.slabs) {
      const slabStart = slab.from;
      const slabEnd = slab.to ?? Number.POSITIVE_INFINITY;
      // Slab `from` is the 1-based first unit (76 means units 76..200);
      // convert to a 0-based unit count inside the slab.
      const unitsInSlab = Math.max(0, Math.min(units, slabEnd) - (slabStart === 0 ? 0 : slabStart - 1));
      // For the first slab (from 0) the count above is min(units, 75).
      const count = slabStart === 0 ? Math.min(units, slabEnd) : unitsInSlab;
      if (count <= 0) continue;
      const amount = round2(count * slab.rate);
      energyCharge = round2(energyCharge + amount);
      breakdown.push({
        labelBn: slab.to === null ? `${slab.from}+ ইউনিট` : `${slab.from}–${slab.to} ইউনিট`,
        labelEn: slab.to === null ? `${slab.from}+ units` : `${slab.from}–${slab.to} units`,
        units: count,
        rate: slab.rate,
        amount,
      });
    }
  }
  const demandCharge = round2(sanctionedLoadKw * tariff.demandChargePerKw);
  const meterRent = round2(tariff.meterRent);
  const subtotal = round2(energyCharge + demandCharge + meterRent);
  const vat = round2((subtotal * tariff.vatPercent) / 100);
  const total = round2(subtotal + vat);
  return {
    units,
    breakdown,
    energyCharge,
    demandCharge,
    meterRent,
    vat,
    total,
    averagePerUnit: units > 0 ? round2(total / units) : 0,
    lifelineApplied,
  };
}
