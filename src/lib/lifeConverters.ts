// Eduvelto — Everyday Life Services (§3C): unit + currency conversion.
//
// Unit conversions are exact constant-based conversions, computed
// client-side. Currency conversion uses a STATIC indicative rates table
// (BDT per 1 unit), verified against public mid-market sources on
// 23 Nov 2026 — it is NOT a live rate feed. The page must show the
// as-of date and the indicative-rate disclaimer next to any result.
//
// Sources (23 Nov 2026): travelx.xitbd.com/currency,
// exchangerates.org.uk (Bangladesh Taka table), forexinvestors.com
// (BDT exchange rates), Finnhub USD/BDT + SAR/BDT.

/** As-of date of the static rates table (ISO). */
export const CURRENCY_RATES_AS_OF = '2026-11-23';

/** BDT per 1 unit of the currency (mid-market, indicative). */
export const CURRENCY_RATES_BDT: Record<string, number> = {
  BDT: 1,
  USD: 124.42,
  EUR: 136.35,
  GBP: 162.91,
  INR: 1.34,
  SAR: 33.2,
  AED: 33.87,
  MYR: 30.24,
  SGD: 96.4,
  AUD: 82.46,
  CAD: 86.71,
  CNY: 18.65,
  JPY: 0.7836,
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_RATES_BDT);

/** Bangla + English names for the supported currencies. */
export const CURRENCY_NAMES: Record<string, { bn: string; en: string }> = {
  BDT: { bn: 'বাংলাদেশি টাকা', en: 'Bangladeshi Taka' },
  USD: { bn: 'মার্কিন ডলার', en: 'US Dollar' },
  EUR: { bn: 'ইউরো', en: 'Euro' },
  GBP: { bn: 'ব্রিটিশ পাউন্ড', en: 'British Pound' },
  INR: { bn: 'ভারতীয় রুপি', en: 'Indian Rupee' },
  SAR: { bn: 'সৌদি রিয়াল', en: 'Saudi Riyal' },
  AED: { bn: 'আমিরাতি দিরহাম', en: 'UAE Dirham' },
  MYR: { bn: 'মালয়েশিয়ান রিঙ্গিত', en: 'Malaysian Ringgit' },
  SGD: { bn: 'সিঙ্গাপুর ডলার', en: 'Singapore Dollar' },
  AUD: { bn: 'অস্ট্রেলিয়ান ডলার', en: 'Australian Dollar' },
  CAD: { bn: 'কানাডিয়ান ডলার', en: 'Canadian Dollar' },
  CNY: { bn: 'চীনা ইউয়ান', en: 'Chinese Yuan' },
  JPY: { bn: 'জাপানি ইয়েন', en: 'Japanese Yen' },
};

/**
 * Convert an amount from one currency to another via the static BDT table.
 * Returns null for unknown currencies or invalid amounts.
 */
export function convertCurrency(amount: number, from: string, to: string): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const fromRate = CURRENCY_RATES_BDT[from];
  const toRate = CURRENCY_RATES_BDT[to];
  if (fromRate === undefined || toRate === undefined) return null;
  const result = (amount * fromRate) / toRate;
  return Number.isFinite(result) ? result : null;
}

export type UnitCategory = 'length' | 'weight' | 'temperature' | 'volume' | 'area';

/** Every unit is defined by its factor to the category's base unit. */
export interface UnitDef {
  id: string;
  bn: string;
  en: string;
  /** Multiply by this to get the base unit (length: metre, weight: kg, volume: litre, area: m²). */
  toBase: number;
}

export const UNIT_CATEGORIES: Record<Exclude<UnitCategory, 'temperature'>, UnitDef[]> = {
  length: [
    { id: 'mm', bn: 'মিলিমিটার', en: 'Millimetre', toBase: 0.001 },
    { id: 'cm', bn: 'সেন্টিমিটার', en: 'Centimetre', toBase: 0.01 },
    { id: 'm', bn: 'মিটার', en: 'Metre', toBase: 1 },
    { id: 'km', bn: 'কিলোমিটার', en: 'Kilometre', toBase: 1000 },
    { id: 'in', bn: 'ইঞ্চি', en: 'Inch', toBase: 0.0254 },
    { id: 'ft', bn: 'ফুট', en: 'Foot', toBase: 0.3048 },
    { id: 'yd', bn: 'গজ', en: 'Yard', toBase: 0.9144 },
    { id: 'mi', bn: 'মাইল', en: 'Mile', toBase: 1609.344 },
  ],
  weight: [
    { id: 'g', bn: 'গ্রাম', en: 'Gram', toBase: 0.001 },
    { id: 'kg', bn: 'কিলোগ্রাম', en: 'Kilogram', toBase: 1 },
    { id: 'mg', bn: 'মিলিগ্রাম', en: 'Milligram', toBase: 0.000001 },
    { id: 't', bn: 'টন', en: 'Tonne', toBase: 1000 },
    { id: 'oz', bn: 'আউন্স', en: 'Ounce', toBase: 0.028349523125 },
    { id: 'lb', bn: 'পাউন্ড', en: 'Pound', toBase: 0.45359237 },
    { id: 'mon', bn: 'মণ', en: 'Maund', toBase: 37.3242 },
    { id: 'ser', bn: 'সের', en: 'Ser', toBase: 0.9331 },
    { id: 'tola', bn: 'তোলা', en: 'Tola', toBase: 0.0116638 },
  ],
  volume: [
    { id: 'ml', bn: 'মিলিলিটার', en: 'Millilitre', toBase: 0.001 },
    { id: 'l', bn: 'লিটার', en: 'Litre', toBase: 1 },
    { id: 'm3', bn: 'ঘনমিটার', en: 'Cubic metre', toBase: 1000 },
    { id: 'tsp', bn: 'চা চামচ', en: 'Teaspoon', toBase: 0.00492892159375 },
    { id: 'tbsp', bn: 'টেবিল চামচ', en: 'Tablespoon', toBase: 0.01478676478125 },
    { id: 'cup', bn: 'কাপ', en: 'Cup', toBase: 0.2365882365 },
    { id: 'gal', bn: 'গ্যালন', en: 'Gallon (US)', toBase: 3.785411784 },
  ],
  area: [
    { id: 'm2', bn: 'বর্গমিটার', en: 'Square metre', toBase: 1 },
    { id: 'km2', bn: 'বর্গকিলোমিটার', en: 'Square kilometre', toBase: 1_000_000 },
    { id: 'ft2', bn: 'বর্গফুট', en: 'Square foot', toBase: 0.09290304 },
    { id: 'acre', bn: 'একর', en: 'Acre', toBase: 4046.8564224 },
    { id: 'ha', bn: 'হেক্টর', en: 'Hectare', toBase: 10_000 },
    { id: 'decimal', bn: 'শতাংশ', en: 'Decimal', toBase: 40.468564224 },
    { id: 'katha', bn: 'কাঠা', en: 'Katha', toBase: 66.89025444 },
    { id: 'bigha', bn: 'বিঘা', en: 'Bigha', toBase: 1337.8050888 },
  ],
};

export const TEMPERATURE_UNITS: UnitDef[] = [
  { id: 'c', bn: 'সেলসিয়াস (°C)', en: 'Celsius (°C)', toBase: 1 },
  { id: 'f', bn: 'ফারেনহাইট (°F)', en: 'Fahrenheit (°F)', toBase: 1 },
  { id: 'k', bn: 'কেলভিন (K)', en: 'Kelvin (K)', toBase: 1 },
];

/** Units available for a category (temperature handled separately). */
export function unitsForCategory(category: UnitCategory): UnitDef[] {
  return category === 'temperature' ? TEMPERATURE_UNITS : UNIT_CATEGORIES[category];
}

function findUnit(category: UnitCategory, unitId: string): UnitDef | undefined {
  return unitsForCategory(category).find((u) => u.id === unitId);
}

function convertTemperature(value: number, from: string, to: string): number | null {
  let celsius: number;
  if (from === 'c') celsius = value;
  else if (from === 'f') celsius = ((value - 32) * 5) / 9;
  else if (from === 'k') celsius = value - 273.15;
  else return null;
  if (to === 'c') return celsius;
  if (to === 'f') return celsius * (9 / 5) + 32;
  if (to === 'k') return celsius + 273.15;
  return null;
}

/**
 * Convert a value between two units in the same category.
 * Returns null for unknown units or invalid values.
 */
export function convertUnit(category: UnitCategory, value: number, from: string, to: string): number | null {
  if (!Number.isFinite(value)) return null;
  if (category === 'temperature') return convertTemperature(value, from, to);
  const fromDef = findUnit(category, from);
  const toDef = findUnit(category, to);
  if (!fromDef || !toDef) return null;
  const result = (value * fromDef.toBase) / toDef.toBase;
  return Number.isFinite(result) ? result : null;
}
