// BD DATA RULE: prices/rates are EDITABLE DATA with dated sources, never
// hard-coded as fact. Re-verify fuel prices monthly (government notification).

/* ------------------------------------------------------------ BD fuel prices */

export interface BdFuelPrice {
  pricePerLitre: number;
  /** 'official' = BPC / Energy Division notification; 'secondary' = listing site. */
  sourceKind: 'official' | 'secondary';
  sourceLabelBn: string;
  sourceLabelEn: string;
  checkedOn: string; // YYYY-MM-DD
}

/**
 * VERIFIED 27 Nov 2026: Energy and Mineral Resources Division notification
 * 29 Oct 2026 (reported by The Business Standard) — prices UNCHANGED for
 * November 2026; rates set 21 Sep 2026 (+Tk 20/L on every fuel).
 * Next check: first week of Dec 2026 (monthly notification).
 * CNG/LPG are secondary listings only (carhubbd, updated 27 Nov 2026).
 */
export const BD_FUEL_PRICES: Record<'diesel' | 'petrol' | 'octane' | 'kerosene' | 'cng' | 'lpg', BdFuelPrice> = {
  diesel: {
    pricePerLitre: 135,
    sourceKind: 'official',
    sourceLabelBn: 'উৎস: বিপিসি / জ্বালানি ও খনিজ সম্পদ বিভাগ, ২৯ অক্টোবর ২০২৬ বিজ্ঞপ্তি — নভেম্বর ২০২৬-এ অপরিবর্তিত (২১ সেপ্টেম্বর ২০২৬ থেকে কার্যকর)',
    sourceLabelEn: 'Source: BPC / Energy and Mineral Resources Division, notification 29 Oct 2026 — unchanged for Nov 2026 (in force since 21 Sep 2026)',
    checkedOn: '2026-11-27',
  },
  petrol: {
    pricePerLitre: 160,
    sourceKind: 'official',
    sourceLabelBn: 'উৎস: বিপিসি / জ্বালানি ও খনিজ সম্পদ বিভাগ, ২৯ অক্টোবর ২০২৬ বিজ্ঞপ্তি — নভেম্বর ২০২৬-এ অপরিবর্তিত (২১ সেপ্টেম্বর ২০২৬ থেকে কার্যকর)',
    sourceLabelEn: 'Source: BPC / Energy and Mineral Resources Division, notification 29 Oct 2026 — unchanged for Nov 2026 (in force since 21 Sep 2026)',
    checkedOn: '2026-11-27',
  },
  octane: {
    pricePerLitre: 165,
    sourceKind: 'official',
    sourceLabelBn: 'উৎস: বিপিসি / জ্বালানি ও খনিজ সম্পদ বিভাগ, ২৯ অক্টোবর ২০২৬ বিজ্ঞপ্তি — নভেম্বর ২০২৬-এ অপরিবর্তিত (২১ সেপ্টেম্বর ২০২৬ থেকে কার্যকর)',
    sourceLabelEn: 'Source: BPC / Energy and Mineral Resources Division, notification 29 Oct 2026 — unchanged for Nov 2026 (in force since 21 Sep 2026)',
    checkedOn: '2026-11-27',
  },
  kerosene: {
    pricePerLitre: 155,
    sourceKind: 'official',
    sourceLabelBn: 'উৎস: বিপিসি / জ্বালানি ও খনিজ সম্পদ বিভাগ, ২৯ অক্টোবর ২০২৬ বিজ্ঞপ্তি — নভেম্বর ২০২৬-এ অপরিবর্তিত (২১ সেপ্টেম্বর ২০২৬ থেকে কার্যকর)',
    sourceLabelEn: 'Source: BPC / Energy and Mineral Resources Division, notification 29 Oct 2026 — unchanged for Nov 2026 (in force since 21 Sep 2026)',
    checkedOn: '2026-11-27',
  },
  cng: {
    pricePerLitre: 43,
    sourceKind: 'secondary',
    sourceLabelBn: 'সিএনজি ৳৪৩/ঘনমিটার — তালিকাভুক্ত মূল্য (পাম্পে যাচাই করুন)',
    sourceLabelEn: 'CNG Tk 43/m³ — secondary listing (check at the pump)',
    checkedOn: '2026-11-27',
  },
  lpg: {
    pricePerLitre: 91.95,
    sourceKind: 'secondary',
    sourceLabelBn: 'এলপিজি (অটোগ্যাস) ৳৯১.৯৫/লিটার — তালিকাভুক্ত মূল্য (পাম্পে যাচাই করুন)',
    sourceLabelEn: 'LPG (autogas) Tk 91.95/L — secondary listing (check at the pump)',
    checkedOn: '2026-11-27',
  },
};

export interface FuelCostInput {
  distanceKm: number;
  mileageKmPerLitre: number;
  pricePerLitre: number;
  tripsPerMonth?: number; // default 26 (working days)
}

export interface FuelCostResult {
  litres: number;
  costPerTrip: number;
  costPerKm: number;
  costPerMonth: number;
  litresPerMonth: number;
}

export function fuelCost(input: FuelCostInput): FuelCostResult {
  const { distanceKm, mileageKmPerLitre, pricePerLitre } = input;
  const trips = input.tripsPerMonth ?? 26;
  if (!(distanceKm >= 0)) throw new Error(`Distance must be 0 or more, got ${distanceKm}`);
  if (!(mileageKmPerLitre > 0)) throw new Error(`Mileage must be more than 0 km/L, got ${mileageKmPerLitre}`);
  if (!(pricePerLitre >= 0)) throw new Error(`Price must be 0 or more, got ${pricePerLitre}`);
  if (!(trips >= 0)) throw new Error(`Trips per month must be 0 or more, got ${trips}`);
  const litres = distanceKm / mileageKmPerLitre;
  const costPerTrip = litres * pricePerLitre;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    litres: round2(litres),
    costPerTrip: round2(costPerTrip),
    costPerKm: round2(pricePerLitre / mileageKmPerLitre),
    costPerMonth: round2(costPerTrip * trips),
    litresPerMonth: round2(litres * trips),
  };
}

/** Max distance (km) a monthly fuel budget buys. */
export function distanceForBudget(budgetPerMonth: number, mileageKmPerLitre: number, pricePerLitre: number): number {
  if (!(budgetPerMonth >= 0)) throw new Error(`Budget must be 0 or more, got ${budgetPerMonth}`);
  if (!(mileageKmPerLitre > 0)) throw new Error(`Mileage must be more than 0 km/L, got ${mileageKmPerLitre}`);
  if (!(pricePerLitre > 0)) throw new Error(`Price must be more than 0, got ${pricePerLitre}`);
  return Math.round((budgetPerMonth / pricePerLitre) * mileageKmPerLitre * 10) / 10;
}

/* ------------------------------------------------------------ Savings goal */

export interface SavingsGoalInput {
  target: number;
  months: number;
  annualRatePercent?: number; // default 0 — NO hard-coded DPS/bank rate
  alreadySaved?: number; // default 0
}

export interface SavingsGoalResult {
  monthlyNeeded: number; // rounded UP to the next taka
  totalContributions: number;
  interestEarned: number;
  goalAlreadyReached: boolean;
}

/**
 * Monthly deposit needed to reach `target` in `months` months.
 * Future value of a monthly annuity, end-of-month deposits:
 *   monthly = (target - saved*(1+r)^n) * r / ((1+r)^n - 1), r = annual/12/100.
 * Rate 0 -> (target - saved)/n. Rounded UP: you cannot save a fraction short.
 * Hand-check: target 120000, 24 months, 0% -> 5000/month exactly.
 */
export function savingsGoalMonthly(input: SavingsGoalInput): SavingsGoalResult {
  const { target, months } = input;
  const rate = input.annualRatePercent ?? 0;
  const saved = input.alreadySaved ?? 0;
  if (!(target > 0)) throw new Error(`Target must be more than 0, got ${target}`);
  if (!Number.isInteger(months) || months < 1) throw new Error(`Months must be a whole number of 1 or more, got ${months}`);
  if (!(rate >= 0)) throw new Error(`Annual rate must be 0 or more, got ${rate}`);
  if (!(saved >= 0)) throw new Error(`Already saved must be 0 or more, got ${saved}`);
  if (saved >= target) {
    return { monthlyNeeded: 0, totalContributions: 0, interestEarned: 0, goalAlreadyReached: true };
  }
  const r = rate / 12 / 100;
  let monthly: number;
  if (r === 0) {
    monthly = (target - saved) / months;
  } else {
    const growth = Math.pow(1 + r, months);
    monthly = ((target - saved * growth) * r) / (growth - 1);
  }
  monthly = Math.ceil(monthly);
  const totalContributions = monthly * months;
  // Interest earned = final balance - already saved - contributions.
  let balance = saved;
  for (let m = 0; m < months; m += 1) {
    balance = balance * (1 + r) + monthly;
  }
  const interest = Math.max(0, Math.round((balance - saved - totalContributions) * 100) / 100);
  return { monthlyNeeded: monthly, totalContributions, interestEarned: interest, goalAlreadyReached: false };
}

export interface SavingsProjectionRow {
  month: number;
  balance: number;
}

/** Month-by-month balance for the chart/table (same math as savingsGoalMonthly). */
export function savingsGoalProjection(input: SavingsGoalInput, monthly: number): SavingsProjectionRow[] {
  const r = (input.annualRatePercent ?? 0) / 12 / 100;
  const rows: SavingsProjectionRow[] = [];
  let balance = input.alreadySaved ?? 0;
  for (let m = 1; m <= input.months; m += 1) {
    balance = balance * (1 + r) + monthly;
    rows.push({ month: m, balance: Math.round(balance * 100) / 100 });
  }
  return rows;
}

/** Reverse: "I can save X/month — how many months to reach the target?" */
export function monthsToReachTarget(target: number, monthly: number, annualRatePercent = 0, alreadySaved = 0): number {
  if (!(target > 0)) throw new Error(`Target must be more than 0, got ${target}`);
  if (!(monthly > 0)) throw new Error(`Monthly saving must be more than 0, got ${monthly}`);
  if (alreadySaved >= target) return 0;
  const r = annualRatePercent / 12 / 100;
  if (r === 0) return Math.ceil((target - alreadySaved) / monthly);
  // n = ln((target*r + monthly) / (saved*r + monthly)) / ln(1+r)
  const n = Math.log((target * r + monthly) / (alreadySaved * r + monthly)) / Math.log(1 + r);
  return Math.ceil(n);
}
