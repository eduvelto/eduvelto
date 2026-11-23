// Eduvelto — Everyday Life Services (§3C): pure calculator functions.
//
// All functions are pure and client-side; no network, no fake data.
// Inputs are validated and return null (or a typed error) instead of
// throwing on bad input, so page components can show a friendly message.

/** EMI (equated monthly instalment) for a loan. */
export interface EmiResult {
  /** Monthly payment. */
  emi: number;
  /** Total amount paid over the whole tenure. */
  totalPayment: number;
  /** Total interest paid over the whole tenure. */
  totalInterest: number;
}

export function calculateEmi(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number,
): EmiResult | null {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePercent) || !Number.isFinite(tenureMonths)) return null;
  if (principal <= 0 || tenureMonths <= 0 || annualRatePercent < 0) return null;
  if (tenureMonths > 600) return null; // 50 years is the sane cap
  const monthlyRate = annualRatePercent / 100 / 12;
  let emi: number;
  if (monthlyRate === 0) {
    emi = principal / tenureMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    emi = (principal * monthlyRate * factor) / (factor - 1);
  }
  if (!Number.isFinite(emi)) return null;
  const totalPayment = emi * tenureMonths;
  return { emi, totalPayment, totalInterest: totalPayment - principal };
}

/** Compound interest: A = P(1 + r/n)^(nt). */
export interface CompoundInterestResult {
  /** Maturity amount (principal + interest). */
  maturityAmount: number;
  /** Interest earned. */
  interest: number;
}

export function calculateCompoundInterest(
  principal: number,
  annualRatePercent: number,
  years: number,
  compoundingPerYear = 1,
): CompoundInterestResult | null {
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRatePercent) ||
    !Number.isFinite(years) ||
    !Number.isFinite(compoundingPerYear)
  ) {
    return null;
  }
  if (principal <= 0 || years <= 0 || annualRatePercent < 0) return null;
  if (compoundingPerYear < 1 || compoundingPerYear > 365) return null;
  const maturityAmount =
    principal * Math.pow(1 + annualRatePercent / 100 / compoundingPerYear, compoundingPerYear * years);
  if (!Number.isFinite(maturityAmount)) return null;
  return { maturityAmount, interest: maturityAmount - principal };
}

/** Simple interest: I = P × r × t. */
export interface SimpleInterestResult {
  /** Interest earned. */
  interest: number;
  /** Maturity amount (principal + interest). */
  maturityAmount: number;
}

export function calculateSimpleInterest(
  principal: number,
  annualRatePercent: number,
  years: number,
): SimpleInterestResult | null {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePercent) || !Number.isFinite(years)) return null;
  if (principal <= 0 || years <= 0 || annualRatePercent < 0) return null;
  const interest = (principal * annualRatePercent * years) / 100;
  if (!Number.isFinite(interest)) return null;
  return { interest, maturityAmount: principal + interest };
}

export type PercentageMode = 'of' | 'what-percent' | 'increase' | 'decrease';

/** Percentage calculations. */
export function calculatePercentage(mode: PercentageMode, a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  switch (mode) {
    case 'of':
      // "a% of b"
      return (a / 100) * b;
    case 'what-percent':
      // "a is what % of b"
      if (b === 0) return null;
      return (a / b) * 100;
    case 'increase':
      // "increase a by b%"
      return a * (1 + b / 100);
    case 'decrease':
      // "decrease a by b%"
      return a * (1 - b / 100);
    default:
      return null;
  }
}

/** Age from a date of birth, as of a reference date (defaults to today). */
export interface AgeResult {
  years: number;
  months: number;
  days: number;
  /** Total days lived. */
  totalDays: number;
}

export function calculateAge(dob: Date, asOf: Date = new Date()): AgeResult | null {
  if (!(dob instanceof Date) || Number.isNaN(dob.getTime())) return null;
  if (!(asOf instanceof Date) || Number.isNaN(asOf.getTime())) return null;
  // Compare calendar dates (ignore time of day).
  const birth = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  const ref = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  if (birth.getTime() > ref.getTime()) return null; // not born yet
  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  let days = ref.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    // Days in the month before the reference month.
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.floor((ref.getTime() - birth.getTime()) / 86_400_000);
  return { years, months, days, totalDays };
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

/** BMI = weight (kg) / height (m)². Category follows the WHO cut-offs. */
export interface BmiResult {
  bmi: number;
  category: BmiCategory;
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;
  if (weightKg > 500 || heightCm > 250) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi)) return null;
  const category: BmiCategory = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';
  return { bmi, category };
}

/** Bangla + English label for a BMI category. */
export function bmiCategoryLabel(category: BmiCategory): { bn: string; en: string } {
  switch (category) {
    case 'underweight':
      return { bn: 'ওজন কম', en: 'Underweight' };
    case 'normal':
      return { bn: 'স্বাভাবিক', en: 'Normal' };
    case 'overweight':
      return { bn: 'ওজন বেশি', en: 'Overweight' };
    case 'obese':
      return { bn: 'স্থূলতা', en: 'Obese' };
  }
}
