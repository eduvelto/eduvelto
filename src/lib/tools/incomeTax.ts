/**
 * Income Tax Calculator — pure logic.
 *
 * The tax slabs are EDITABLE DATA, never hardcoded as fact: the
 * caller passes the slabs, and the UI lets the user change every
 * limit and rate. The default below is a STARTING VALUE ONLY, taken
 * from the general individual slabs of the Finance Act 2025
 * (assessment year 2025-26, National Board of Revenue) — rates
 * change with every budget, so the tool labels the result
 * "আনুমানিক" (estimated) and tells the user to check the current
 * NBR slabs before filing. It is NOT tax advice.
 *
 *   slab upTo = cumulative upper limit of the slab (null = no limit)
 *   tax = sum over slabs of (income inside the slab x slab rate)
 *
 * Pure functions only: no network, no storage, no DOM.
 */

/** Dated source label for the default slabs (shown in the UI). */
export const BD_TAX_SOURCE_BN =
  'উৎস: জাতীয় রাজস্ব বোর্ড (NBR), অর্থ আইন ২০২৫ (করবর্ষ ২০২৫-২৬) — ২৭ নভেম্বর ২০২৬-এ দেখা শুরুর মান। হার প্রতি বাজেটে বদলাতে পারে; দাখিলের আগে NBR-এ যাচাই করুন।';
export const BD_TAX_SOURCE_EN =
  'Source: National Board of Revenue (NBR), Finance Act 2025 (assessment year 2025-26) — starting values as seen 27 Nov 2026. Rates change with every budget; check the current NBR slabs before filing.';

export interface TaxSlab {
  /** Cumulative upper income limit of this slab; null = no upper limit. */
  upTo: number | null;
  /** Tax rate for this slab, in percent. */
  ratePercent: number;
}

/**
 * Default slabs (STARTING VALUES ONLY — editable in the UI).
 * General individual taxpayer: first ৳350,000 tax-free, then 5% up
 * to ৳450,000, 10% up to ৳850,000, 15% up to ৳1,350,000, 20% up to
 * ৳1,850,000, 25% above. Different categories (women, senior
 * citizens, third gender, persons with disabilities, gazetted
 * freedom fighters) have different tax-free limits — the UI's
 * editable first slab covers that.
 */
export const DEFAULT_BD_TAX_SLABS_2025_26: TaxSlab[] = [
  { upTo: 350000, ratePercent: 0 },
  { upTo: 450000, ratePercent: 5 },
  { upTo: 850000, ratePercent: 10 },
  { upTo: 1350000, ratePercent: 15 },
  { upTo: 1850000, ratePercent: 20 },
  { upTo: null, ratePercent: 25 },
];

export interface IncomeTaxInput {
  /** Total annual income. */
  annualIncome: number;
  /** Slabs to apply, in order (editable data — see above). */
  slabs: TaxSlab[];
}

export interface SlabBreakdown {
  /** Human-readable slab range, e.g. "৳350,001 – ৳450,000" (labels built by the caller/UI). */
  upTo: number | null;
  ratePercent: number;
  /** Income falling inside this slab. */
  taxableInSlab: number;
  /** Tax from this slab. */
  taxInSlab: number;
}

export interface IncomeTaxResult {
  /** Total estimated annual tax. */
  tax: number;
  /** Same tax spread over 12 months. */
  monthlyTax: number;
  /** Effective rate: tax / income x 100 (0 when income is 0). */
  effectiveRatePercent: number;
  /** Income above the tax-free (0%-rate) slabs. */
  taxableIncome: number;
  /** Per-slab breakdown. */
  breakdown: SlabBreakdown[];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateSlabs(slabs: TaxSlab[]): void {
  if (!Array.isArray(slabs) || slabs.length === 0) {
    throw new Error('slabs must be a non-empty array');
  }
  let prevUpTo = 0;
  slabs.forEach((slab, i) => {
    if (!Number.isFinite(slab.ratePercent) || slab.ratePercent < 0 || slab.ratePercent > 100) {
      throw new Error(`slabs[${i}].ratePercent must be between 0 and 100, got ${slab.ratePercent}`);
    }
    if (slab.upTo !== null) {
      if (!Number.isFinite(slab.upTo) || slab.upTo <= prevUpTo) {
        throw new Error(`slabs[${i}].upTo must be above the previous slab limit, got ${slab.upTo}`);
      }
      prevUpTo = slab.upTo;
    } else if (i !== slabs.length - 1) {
      throw new Error('only the last slab may have upTo null');
    }
  });
}

/**
 * Calculate estimated income tax from editable slabs.
 *
 * Hand-check (default slabs): income 600,000 -> first 350,000 at
 * 0% = 0; next 100,000 at 5% = 5,000; remaining 150,000 at 10% =
 * 15,000; total tax 20,000; monthly 1,666.67; effective rate 3.33%.
 * Income 300,000 -> tax 0 (inside the tax-free slab).
 */
export function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  if (!Number.isFinite(input.annualIncome) || input.annualIncome < 0) {
    throw new Error(`annualIncome must be a finite number >= 0, got ${input.annualIncome}`);
  }
  validateSlabs(input.slabs);
  let lower = 0;
  let tax = 0;
  let taxableIncome = 0;
  const breakdown: SlabBreakdown[] = input.slabs.map((slab) => {
    const upper = slab.upTo ?? Number.POSITIVE_INFINITY;
    const inSlab = Math.max(0, Math.min(input.annualIncome, upper) - lower);
    const taxInSlab = (inSlab * slab.ratePercent) / 100;
    if (slab.ratePercent > 0) taxableIncome += inSlab;
    tax += taxInSlab;
    lower = upper;
    return {
      upTo: slab.upTo,
      ratePercent: slab.ratePercent,
      taxableInSlab: roundMoney(inSlab),
      taxInSlab: roundMoney(taxInSlab),
    };
  });
  return {
    tax: roundMoney(tax),
    monthlyTax: roundMoney(tax / 12),
    effectiveRatePercent:
      input.annualIncome === 0 ? 0 : Math.round((tax / input.annualIncome) * 10000) / 100,
    taxableIncome: roundMoney(taxableIncome),
    breakdown,
  };
}
