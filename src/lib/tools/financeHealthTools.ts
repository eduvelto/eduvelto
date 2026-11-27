// Eduvelto — Finance & Health batch engines (audit §4b #149–167).
// Pure functions only: no React, no network, no storage.
// Every function returns null on invalid input — never throws on user input.
// Money values are rounded to 2 decimals; percentages to 2 decimals.

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isValid(n: number): boolean {
  return typeof n === 'number' && Number.isFinite(n);
}

/** Standard EMI: monthly payment for a loan. ratePercent is annual. */
export function emiMonthly(loanAmount: number, annualRatePercent: number, months: number): number | null {
  if (!isValid(loanAmount) || !isValid(annualRatePercent) || !isValid(months)) return null;
  if (loanAmount < 0 || annualRatePercent < 0 || months <= 0) return null;
  if (!Number.isInteger(months)) return null;
  if (annualRatePercent === 0) return round2(loanAmount / months);
  const r = annualRatePercent / 100 / 12;
  const factor = Math.pow(1 + r, months);
  return round2((loanAmount * r * factor) / (factor - 1));
}

// ---------------------------------------------------------------- ROI (#149)
export interface RoiResult {
  profit: number;
  roiPercent: number;
  annualizedRoiPercent: number | null;
}

export function calculateRoi(cost: number, gain: number, years?: number): RoiResult | null {
  if (!isValid(cost) || !isValid(gain)) return null;
  if (cost <= 0 || gain < 0) return null;
  const profit = round2(gain - cost);
  const roiPercent = round2(((gain - cost) / cost) * 100);
  let annualizedRoiPercent: number | null = null;
  if (years !== undefined && years !== null) {
    if (!isValid(years) || years <= 0 || gain <= 0) return null;
    annualizedRoiPercent = round2((Math.pow(gain / cost, 1 / years) - 1) * 100);
  }
  return { profit, roiPercent, annualizedRoiPercent };
}

// ---------------------------------------------------------------- GST (#150)
// Bangladesh uses VAT, not GST — the maths is the same add/remove-tax job.
// mode 'add': amount is the base price, tax is added on top.
// mode 'remove': amount already includes the tax, split it out.
export interface GstResult {
  base: number;
  tax: number;
  total: number;
}

export function calculateGst(amount: number, ratePercent: number, mode: 'add' | 'remove'): GstResult | null {
  if (!isValid(amount) || !isValid(ratePercent)) return null;
  if (amount < 0 || ratePercent < 0 || ratePercent > 100) return null;
  if (mode !== 'add' && mode !== 'remove') return null;
  if (mode === 'add') {
    const tax = round2((amount * ratePercent) / 100);
    return { base: round2(amount), tax, total: round2(amount + tax) };
  }
  const base = round2(amount / (1 + ratePercent / 100));
  return { base, tax: round2(amount - base), total: round2(amount) };
}

// ------------------------------------------------- Steps to calories (#152)
// Estimate only. Distance = steps x stride; walking burns roughly
// 0.53 kcal per kg of body weight per km.
export interface StepsCaloriesResult {
  calories: number;
  distanceKm: number;
  distanceM: number;
}

export function calculateStepsCalories(steps: number, weightKg: number, strideM = 0.762): StepsCaloriesResult | null {
  if (!isValid(steps) || !isValid(weightKg) || !isValid(strideM)) return null;
  if (steps < 0 || weightKg <= 0 || weightKg > 500 || strideM <= 0 || strideM > 2) return null;
  const distanceM = round2(steps * strideM);
  const distanceKm = round2(distanceM / 1000);
  const calories = round2(distanceKm * weightKg * 0.53);
  return { calories, distanceKm, distanceM };
}

// ------------------------------------------------------ Working days (#154)
export type WeekendOption = 'fri-sat' | 'sat-sun';

export interface WorkingDaysResult {
  workingDays: number;
  totalDays: number;
  weekendDays: number;
  holidayDays: number;
}

function parseIsoDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject impossible dates like 2026-02-30 (Date rolls them over).
  if (d.toISOString().slice(0, 10) !== s) return null;
  return d;
}

export function calculateWorkingDays(
  start: string,
  end: string,
  weekend: WeekendOption = 'fri-sat',
  holidays: string[] = [],
): WorkingDaysResult | null {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return null;
  if (weekend !== 'fri-sat' && weekend !== 'sat-sun') return null;
  if (endDate.getTime() < startDate.getTime()) return null;
  const weekendDaysOfWeek = weekend === 'fri-sat' ? new Set([5, 6]) : new Set([0, 6]);
  const holidaySet = new Set<string>();
  for (const h of holidays) {
    const d = parseIsoDate(h.trim());
    if (d) holidaySet.add(d.toISOString().slice(0, 10));
  }
  let totalDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let workingDays = 0;
  const cursor = new Date(startDate.getTime());
  while (cursor.getTime() <= endDate.getTime()) {
    totalDays += 1;
    const key = cursor.toISOString().slice(0, 10);
    if (weekendDaysOfWeek.has(cursor.getUTCDay())) {
      weekendDays += 1;
    } else if (holidaySet.has(key)) {
      holidayDays += 1;
    } else {
      workingDays += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { workingDays, totalDays, weekendDays, holidayDays };
}

// ----------------------------------------------------------- Dog age (#156)
// Approximate rule, labelled as such in the UI: the first 2 dog years
// count ~10.5 human years each (21 by age 2); after that small breeds
// age ~4, medium ~5 and large ~7 human years per dog year.
export type DogSize = 'small' | 'medium' | 'large';

export interface DogAgeResult {
  humanYears: number;
}

export function calculateDogAge(dogYears: number, size: DogSize): DogAgeResult | null {
  if (!isValid(dogYears)) return null;
  if (dogYears < 0 || dogYears > 30) return null;
  if (size !== 'small' && size !== 'medium' && size !== 'large') return null;
  const afterTwo = size === 'small' ? 4 : size === 'medium' ? 5 : 7;
  const humanYears = dogYears <= 2 ? round2(dogYears * 10.5) : round2(21 + (dogYears - 2) * afterTwo);
  return { humanYears };
}

// ----------------------------------------------------------- Cat age (#157)
// Approximate rule, labelled as such in the UI: year 1 = 15 human years,
// year 2 = +9 (24 by age 2), then ~4 human years per cat year.
export interface CatAgeResult {
  humanYears: number;
}

export function calculateCatAge(catYears: number): CatAgeResult | null {
  if (!isValid(catYears)) return null;
  if (catYears < 0 || catYears > 30) return null;
  let humanYears: number;
  if (catYears <= 1) humanYears = catYears * 15;
  else if (catYears <= 2) humanYears = 15 + (catYears - 1) * 9;
  else humanYears = 24 + (catYears - 2) * 4;
  return { humanYears: round2(humanYears) };
}

// ------------------------------------------- Love compatibility (#158, fun)
// Entertainment only. Deterministic: the same two names always give the
// same percentage, so friends can compare. No real claim about a couple.
export interface LoveCompatibilityResult {
  percent: number;
  band: 'excellent' | 'good' | 'average' | 'friendship';
}

function hashNames(a: string, b: string): number {
  const s = `${a.trim().toLowerCase()}|${b.trim().toLowerCase()}`;
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function calculateLoveCompatibility(name1: string, name2: string): LoveCompatibilityResult | null {
  if (typeof name1 !== 'string' || typeof name2 !== 'string') return null;
  if (name1.trim() === '' || name2.trim() === '') return null;
  const percent = 45 + (hashNames(name1, name2) % 54); // 45–98
  const band: LoveCompatibilityResult['band'] =
    percent >= 85 ? 'excellent' : percent >= 65 ? 'good' : percent >= 50 ? 'average' : 'friendship';
  return { percent, band };
}

// ------------------------------------------------------ Down payment (#159)
export interface DownPaymentResult {
  downPayment: number;
  loanAmount: number;
  monthlyEmi: number | null;
}

export function calculateDownPayment(
  price: number,
  downPercent: number,
  annualRatePercent?: number,
  years?: number,
): DownPaymentResult | null {
  if (!isValid(price) || !isValid(downPercent)) return null;
  if (price <= 0 || downPercent < 0 || downPercent > 100) return null;
  const downPayment = round2((price * downPercent) / 100);
  const loanAmount = round2(price - downPayment);
  let monthlyEmi: number | null = null;
  if (annualRatePercent !== undefined || years !== undefined) {
    if (annualRatePercent === undefined || years === undefined) return null;
    if (!isValid(annualRatePercent) || !isValid(years)) return null;
    if (annualRatePercent < 0 || years <= 0) return null;
    monthlyEmi = emiMonthly(loanAmount, annualRatePercent, Math.round(years * 12));
  }
  return { downPayment, loanAmount, monthlyEmi };
}

// ---------------------------------------------------------- Auto loan (#160)
export interface AutoLoanResult {
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export function calculateAutoLoan(
  price: number,
  downPayment: number,
  annualRatePercent: number,
  years: number,
): AutoLoanResult | null {
  if (!isValid(price) || !isValid(downPayment) || !isValid(annualRatePercent) || !isValid(years)) return null;
  if (price <= 0 || downPayment < 0 || downPayment >= price || annualRatePercent < 0 || years <= 0) return null;
  const loanAmount = round2(price - downPayment);
  const months = Math.round(years * 12);
  const monthlyPayment = emiMonthly(loanAmount, annualRatePercent, months);
  if (monthlyPayment === null) return null;
  const totalPayment = round2(monthlyPayment * months);
  return { loanAmount, monthlyPayment, totalPayment, totalInterest: round2(totalPayment - loanAmount) };
}

// --------------------------------------------------------- Inflation (#162)
// User-entered inflation rate only — never a fetched or assumed live rate.
// 'future': what the amount will be worth; 'past': what it was worth.
export interface InflationResult {
  result: number;
  changePercent: number;
}

export function calculateInflation(
  amount: number,
  ratePercent: number,
  years: number,
  direction: 'future' | 'past',
): InflationResult | null {
  if (!isValid(amount) || !isValid(ratePercent) || !isValid(years)) return null;
  if (amount < 0 || ratePercent < 0 || ratePercent > 100 || years < 0) return null;
  if (direction !== 'future' && direction !== 'past') return null;
  const factor = Math.pow(1 + ratePercent / 100, years);
  const result = direction === 'future' ? round2(amount * factor) : round2(amount / factor);
  const changePercent = round2(((result - amount) / (amount === 0 ? 1 : amount)) * 100);
  return { result, changePercent: amount === 0 ? 0 : changePercent };
}

// -------------------------------------------------------------- CPM (#163)
export interface CpmResult {
  cpm: number;
}

export function calculateCpm(spend: number, impressions: number): CpmResult | null {
  if (!isValid(spend) || !isValid(impressions)) return null;
  if (spend < 0 || impressions <= 0) return null;
  return { cpm: round2((spend / impressions) * 1000) };
}

// -------------------------------------------------------------- CTR (#164)
export interface CtrResult {
  ctrPercent: number;
}

export function calculateCtr(clicks: number, impressions: number): CtrResult | null {
  if (!isValid(clicks) || !isValid(impressions)) return null;
  if (clicks < 0 || impressions <= 0 || clicks > impressions) return null;
  return { ctrPercent: round2((clicks / impressions) * 100) };
}

// ------------------------------------------------- Engagement rate (#165)
export interface EngagementRateResult {
  ratePercent: number;
}

export function calculateEngagementRate(interactions: number, base: number): EngagementRateResult | null {
  if (!isValid(interactions) || !isValid(base)) return null;
  if (interactions < 0 || base <= 0) return null;
  return { ratePercent: round2((interactions / base) * 100) };
}

// ----------------------------------------------------- YouTube money (#166)
// Estimate only — RPM is user-entered; real earnings vary by audience,
// niche, season and ads shown.
export interface YoutubeMoneyResult {
  estimatedEarnings: number;
}

export function calculateYoutubeMoney(views: number, rpm: number): YoutubeMoneyResult | null {
  if (!isValid(views) || !isValid(rpm)) return null;
  if (views < 0 || rpm < 0) return null;
  return { estimatedEarnings: round2((views / 1000) * rpm) };
}

// -------------------------------------------------- AdSense revenue (#167)
// Estimate only — RPM is user-entered; real earnings vary by traffic,
// niche, season and ads shown.
export interface AdsenseRevenueResult {
  estimatedEarnings: number;
}

export function calculateAdsenseRevenue(pageviews: number, rpm: number): AdsenseRevenueResult | null {
  if (!isValid(pageviews) || !isValid(rpm)) return null;
  if (pageviews < 0 || rpm < 0) return null;
  return { estimatedEarnings: round2((pageviews / 1000) * rpm) };
}
