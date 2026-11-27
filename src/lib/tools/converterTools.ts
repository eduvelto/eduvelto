/**
 * Converter engines — 20 converters (audit §4e #220–240).
 * Pure functions only: no React, no network, no storage.
 * Invalid input (non-finite value, unknown unit) returns null, never throws.
 *
 * Conventions (labelled honestly in the UI):
 * - Data storage: KB/MB/GB/TB are decimal (1000-based); KiB/MiB/GiB/TiB are
 *   binary (1024-based). Both are offered so the user sees the difference.
 * - Time months/years are labelled approximations (month = 30.44 days,
 *   year = 365.25 days, the Gregorian mean year).
 * - Fuel economy: mpg US uses the US gallon (3.78541 L), mpg UK the
 *   imperial gallon (4.54609 L).
 * - Shoe/clothing sizes are approximate — brands vary (UI says so).
 */

export interface UnitOption {
  id: string;
  bn: string;
  en: string;
}

export type UnitTable = Record<string, number>;

function isValidValue(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Generic linear conversion through a base unit. Returns null on bad input. */
export function convertLinear(
  value: number,
  from: string,
  to: string,
  table: UnitTable,
): number | null {
  if (!isValidValue(value)) return null;
  const fromFactor = table[from];
  const toFactor = table[to];
  if (fromFactor === undefined || toFactor === undefined) return null;
  if (fromFactor <= 0 || toFactor <= 0) return null;
  return (value * fromFactor) / toFactor;
}

/** Trim a result for display: up to 6 decimal places, no trailing noise. */
export function formatConverted(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) >= 1e9 || Math.abs(n) < 1e-6)) return n.toExponential(4);
  const rounded = Math.round(n * 1e6) / 1e6;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

// ---------------------------------------------------------------- volume
export const VOLUME_TABLE: UnitTable = {
  litre: 1,
  millilitre: 0.001,
  'cubic-metre': 1000,
  'cubic-centimetre': 0.001,
  gallon: 3.78541,
  quart: 0.946353,
  pint: 0.473176,
  cup: 0.236588,
  'fluid-ounce': 0.0295735,
  tablespoon: 0.0147868,
  teaspoon: 0.00492892,
};
export const VOLUME_UNITS: UnitOption[] = [
  { id: 'litre', bn: 'লিটার', en: 'Litre (L)' },
  { id: 'millilitre', bn: 'মিলিলিটার', en: 'Millilitre (mL)' },
  { id: 'cubic-metre', bn: 'ঘনমিটার', en: 'Cubic metre (m³)' },
  { id: 'cubic-centimetre', bn: 'ঘন সেন্টিমিটার', en: 'Cubic centimetre (cm³)' },
  { id: 'gallon', bn: 'গ্যালন (মার্কিন)', en: 'Gallon (US)' },
  { id: 'quart', bn: 'কোয়ার্ট (মার্কিন)', en: 'Quart (US)' },
  { id: 'pint', bn: 'পাইন্ট (মার্কিন)', en: 'Pint (US)' },
  { id: 'cup', bn: 'কাপ (মার্কিন)', en: 'Cup (US)' },
  { id: 'fluid-ounce', bn: 'ফ্লুইড আউন্স', en: 'Fluid ounce (US fl oz)' },
  { id: 'tablespoon', bn: 'টেবিল চামচ', en: 'Tablespoon (tbsp)' },
  { id: 'teaspoon', bn: 'চা চামচ', en: 'Teaspoon (tsp)' },
];
export function convertVolume(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, VOLUME_TABLE);
}

// ------------------------------------------------------------ data storage
export const DATA_STORAGE_TABLE: UnitTable = {
  bit: 0.125,
  byte: 1,
  kilobyte: 1000,
  megabyte: 1e6,
  gigabyte: 1e9,
  terabyte: 1e12,
  petabyte: 1e15,
  kibibyte: 1024,
  mebibyte: 1024 ** 2,
  gibibyte: 1024 ** 3,
  tebibyte: 1024 ** 4,
};
export const DATA_STORAGE_UNITS: UnitOption[] = [
  { id: 'bit', bn: 'বিট', en: 'Bit' },
  { id: 'byte', bn: 'বাইট', en: 'Byte' },
  { id: 'kilobyte', bn: 'কিলোবাইট (KB = ১০০০)', en: 'Kilobyte (KB = 1000)' },
  { id: 'megabyte', bn: 'মেগাবাইট (MB = ১০০০ KB)', en: 'Megabyte (MB)' },
  { id: 'gigabyte', bn: 'গিগাবাইট (GB)', en: 'Gigabyte (GB)' },
  { id: 'terabyte', bn: 'টেরাবাইট (TB)', en: 'Terabyte (TB)' },
  { id: 'petabyte', bn: 'পেটাবাইট (PB)', en: 'Petabyte (PB)' },
  { id: 'kibibyte', bn: 'কিবিবাইট (KiB = ১০২৪)', en: 'Kibibyte (KiB = 1024)' },
  { id: 'mebibyte', bn: 'মেবিবাইট (MiB)', en: 'Mebibyte (MiB)' },
  { id: 'gibibyte', bn: 'গিবিবাইট (GiB)', en: 'Gibibyte (GiB)' },
  { id: 'tebibyte', bn: 'টেবিবাইট (TiB)', en: 'Tebibyte (TiB)' },
];
export function convertDataStorage(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, DATA_STORAGE_TABLE);
}

// ------------------------------------------------------- data transfer speed
export const DATA_TRANSFER_TABLE: UnitTable = {
  bps: 1,
  kbps: 1000,
  mbps: 1e6,
  gbps: 1e9,
  'kilobyte-per-second': 8000,
  'megabyte-per-second': 8e6,
  'gigabyte-per-second': 8e9,
};
export const DATA_TRANSFER_UNITS: UnitOption[] = [
  { id: 'bps', bn: 'বিট/সেকেন্ড', en: 'Bits per second (bps)' },
  { id: 'kbps', bn: 'কিলোবিট/সেকেন্ড', en: 'Kilobits per second (Kbps)' },
  { id: 'mbps', bn: 'মেগাবিট/সেকেন্ড', en: 'Megabits per second (Mbps)' },
  { id: 'gbps', bn: 'গিগাবিট/সেকেন্ড', en: 'Gigabits per second (Gbps)' },
  { id: 'kilobyte-per-second', bn: 'কিলোবাইট/সেকেন্ড', en: 'Kilobytes per second (KB/s)' },
  { id: 'megabyte-per-second', bn: 'মেগাবাইট/সেকেন্ড', en: 'Megabytes per second (MB/s)' },
  { id: 'gigabyte-per-second', bn: 'গিগাবাইট/সেকেন্ড', en: 'Gigabytes per second (GB/s)' },
];
export function convertDataTransferSpeed(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, DATA_TRANSFER_TABLE);
}

// ----------------------------------------------------------------- pressure
export const PRESSURE_TABLE: UnitTable = {
  pascal: 1,
  kilopascal: 1000,
  bar: 100000,
  psi: 6894.757293168,
  atmosphere: 101325,
  mmhg: 133.322387415,
  torr: 133.322387415,
};
export const PRESSURE_UNITS: UnitOption[] = [
  { id: 'pascal', bn: 'প্যাসকেল', en: 'Pascal (Pa)' },
  { id: 'kilopascal', bn: 'কিলোপ্যাসকেল', en: 'Kilopascal (kPa)' },
  { id: 'bar', bn: 'বার', en: 'Bar' },
  { id: 'psi', bn: 'পিএসআই', en: 'Pounds per sq inch (psi)' },
  { id: 'atmosphere', bn: 'অ্যাটমোস্ফিয়ার', en: 'Atmosphere (atm)' },
  { id: 'mmhg', bn: 'মিমি পারদ', en: 'Millimetres of mercury (mmHg)' },
  { id: 'torr', bn: 'টর', en: 'Torr' },
];
export function convertPressure(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, PRESSURE_TABLE);
}

// ------------------------------------------------------------------- energy
export const ENERGY_TABLE: UnitTable = {
  joule: 1,
  kilojoule: 1000,
  kilowatthour: 3600000,
  calorie: 4.184,
  kilocalorie: 4184,
  btu: 1055.06,
  electronvolt: 1.602176634e-19,
};
export const ENERGY_UNITS: UnitOption[] = [
  { id: 'joule', bn: 'জুল', en: 'Joule (J)' },
  { id: 'kilojoule', bn: 'কিলোজুল', en: 'Kilojoule (kJ)' },
  { id: 'kilowatthour', bn: 'কিলোওয়াট-ঘণ্টা', en: 'Kilowatt-hour (kWh)' },
  { id: 'calorie', bn: 'ক্যালরি', en: 'Calorie (cal)' },
  { id: 'kilocalorie', bn: 'কিলোক্যালরি', en: 'Kilocalorie (kcal)' },
  { id: 'btu', bn: 'বিটিইউ', en: 'British thermal unit (BTU)' },
  { id: 'electronvolt', bn: 'ইলেকট্রনভোল্ট', en: 'Electronvolt (eV)' },
];
export function convertEnergy(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, ENERGY_TABLE);
}

// -------------------------------------------------------------------- power
export const POWER_TABLE: UnitTable = {
  watt: 1,
  kilowatt: 1000,
  megawatt: 1e6,
  horsepower: 745.7,
  'btu-per-hour': 0.29307107,
};
export const POWER_UNITS: UnitOption[] = [
  { id: 'watt', bn: 'ওয়াট', en: 'Watt (W)' },
  { id: 'kilowatt', bn: 'কিলোওয়াট', en: 'Kilowatt (kW)' },
  { id: 'megawatt', bn: 'মেগাওয়াট', en: 'Megawatt (MW)' },
  { id: 'horsepower', bn: 'অশ্বশক্তি', en: 'Horsepower (hp)' },
  { id: 'btu-per-hour', bn: 'বিটিইউ/ঘণ্টা', en: 'BTU per hour (BTU/h)' },
];
export function convertPower(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, POWER_TABLE);
}

// -------------------------------------------------------------------- angle
export const ANGLE_TABLE: UnitTable = {
  degree: 1,
  radian: 57.29577951308232,
  gradian: 0.9,
  turn: 360,
};
export const ANGLE_UNITS: UnitOption[] = [
  { id: 'degree', bn: 'ডিগ্রি', en: 'Degree (°)' },
  { id: 'radian', bn: 'রেডিয়ান', en: 'Radian (rad)' },
  { id: 'gradian', bn: 'গ্রেডিয়ান', en: 'Gradian (grad)' },
  { id: 'turn', bn: 'পূর্ণ ঘূর্ণন', en: 'Turn (revolution)' },
];
export function convertAngle(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, ANGLE_TABLE);
}

// --------------------------------------------------------------------- time
export const TIME_TABLE: UnitTable = {
  millisecond: 0.001,
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2629800, // 30.4375 days (365.25/12) — labelled approximate in the UI
  year: 31557600, // 365.25 days — labelled approximate in the UI
};
export const TIME_UNITS: UnitOption[] = [
  { id: 'millisecond', bn: 'মিলিসেকেন্ড', en: 'Millisecond (ms)' },
  { id: 'second', bn: 'সেকেন্ড', en: 'Second (s)' },
  { id: 'minute', bn: 'মিনিট', en: 'Minute (min)' },
  { id: 'hour', bn: 'ঘণ্টা', en: 'Hour (h)' },
  { id: 'day', bn: 'দিন', en: 'Day' },
  { id: 'week', bn: 'সপ্তাহ', en: 'Week' },
  { id: 'month', bn: 'মাস (≈৩০.৪৪ দিন)', en: 'Month (≈30.44 days)' },
  { id: 'year', bn: 'বছর (≈৩৬৫.২৫ দিন)', en: 'Year (≈365.25 days)' },
];
export function convertTime(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, TIME_TABLE);
}

// ---------------------------------------------------------------- frequency
export const FREQUENCY_TABLE: UnitTable = {
  hertz: 1,
  kilohertz: 1e3,
  megahertz: 1e6,
  gigahertz: 1e9,
  terahertz: 1e12,
};
export const FREQUENCY_UNITS: UnitOption[] = [
  { id: 'hertz', bn: 'হার্জ', en: 'Hertz (Hz)' },
  { id: 'kilohertz', bn: 'কিলোহার্জ', en: 'Kilohertz (kHz)' },
  { id: 'megahertz', bn: 'মেগাহার্জ', en: 'Megahertz (MHz)' },
  { id: 'gigahertz', bn: 'গিগাহার্জ', en: 'Gigahertz (GHz)' },
  { id: 'terahertz', bn: 'টেরাহার্জ', en: 'Terahertz (THz)' },
];
export function convertFrequency(value: number, from: string, to: string): number | null {
  return convertLinear(value, from, to, FREQUENCY_TABLE);
}

// ------------------------------------------------------------- fuel economy
// Base unit: kilometres per litre.
export const FUEL_ECONOMY_UNITS: UnitOption[] = [
  { id: 'km-per-litre', bn: 'কিমি/লিটার', en: 'Kilometres per litre (km/L)' },
  { id: 'litre-per-100km', bn: 'লিটার/১০০ কিমি', en: 'Litres per 100 km (L/100km)' },
  { id: 'mpg-us', bn: 'মাইল/গ্যালন (মার্কিন)', en: 'Miles per gallon (US)' },
  { id: 'mpg-uk', bn: 'মাইল/গ্যালন (ব্রিটিশ)', en: 'Miles per gallon (UK)' },
];
function fuelToKmPerLitre(value: number, from: string): number | null {
  if (!isValidValue(value) || value <= 0) return null;
  switch (from) {
    case 'km-per-litre':
      return value;
    case 'litre-per-100km':
      return 100 / value;
    case 'mpg-us':
      return value * 0.425143707; // 1.609344 km / 3.78541 L
    case 'mpg-uk':
      return value * 0.354006189; // 1.609344 km / 4.54609 L
    default:
      return null;
  }
}
export function convertFuelEconomy(value: number, from: string, to: string): number | null {
  const base = fuelToKmPerLitre(value, from);
  if (base === null) return null;
  switch (to) {
    case 'km-per-litre':
      return base;
    case 'litre-per-100km':
      return 100 / base;
    case 'mpg-us':
      return base / 0.425143707;
    case 'mpg-uk':
      return base / 0.354006189;
    default:
      return null;
  }
}

// -------------------------------------------------------- cooking measurement
// Volume base: millilitre. Grams convert through the ingredient's density.
export const COOKING_VOLUME_TABLE: UnitTable = {
  millilitre: 1,
  litre: 1000,
  cup: 236.588,
  tablespoon: 14.7868,
  teaspoon: 4.92892,
};
export const COOKING_UNITS: UnitOption[] = [
  { id: 'cup', bn: 'কাপ', en: 'Cup' },
  { id: 'tablespoon', bn: 'টেবিল চামচ', en: 'Tablespoon (tbsp)' },
  { id: 'teaspoon', bn: 'চা চামচ', en: 'Teaspoon (tsp)' },
  { id: 'millilitre', bn: 'মিলিলিটার', en: 'Millilitre (mL)' },
  { id: 'litre', bn: 'লিটার', en: 'Litre (L)' },
  { id: 'gram', bn: 'গ্রাম', en: 'Gram (g)' },
];
/** Approximate densities (g per mL) — labelled approximate in the UI. */
export const COOKING_DENSITIES: Record<string, { density: number; bn: string; en: string }> = {
  water: { density: 1, bn: 'পানি', en: 'Water' },
  milk: { density: 1.03, bn: 'দুধ', en: 'Milk' },
  flour: { density: 0.53, bn: 'ময়দা', en: 'Flour (all-purpose)' },
  sugar: { density: 0.85, bn: 'চিনি', en: 'Sugar (granulated)' },
  butter: { density: 0.96, bn: 'মাখন', en: 'Butter (melted)' },
  oil: { density: 0.92, bn: 'তেল', en: 'Cooking oil' },
  honey: { density: 1.42, bn: 'মধু', en: 'Honey' },
  rice: { density: 0.85, bn: 'চাল', en: 'Rice (uncooked)' },
};
export function convertCooking(
  value: number,
  from: string,
  to: string,
  ingredient = 'water',
): number | null {
  if (!isValidValue(value)) return null;
  const density = COOKING_DENSITIES[ingredient]?.density ?? 1;
  const toMl = (v: number, unit: string): number | null => {
    if (unit === 'gram') return v / density;
    const f = COOKING_VOLUME_TABLE[unit];
    return f === undefined ? null : v * f;
  };
  const fromMl = (ml: number, unit: string): number | null => {
    if (unit === 'gram') return ml * density;
    const f = COOKING_VOLUME_TABLE[unit];
    return f === undefined ? null : ml / f;
  };
  const ml = toMl(value, from);
  if (ml === null) return null;
  return fromMl(ml, to);
}

// ----------------------------------------------------------------- shoe size
// Standard size charts (foot length in cm is the shared base).
// Sources: common US/UK/EU/JP charts (e.g. Nike/Adidas size charts);
// sizes vary by brand — the UI labels every result approximate.
export interface ShoeSizeRow {
  us: number;
  uk: number;
  eu: number;
  jp: number;
  cm: number;
}
export const SHOE_SIZE_MEN: ShoeSizeRow[] = [
  { us: 6, uk: 5.5, eu: 38.5, jp: 24, cm: 24.1 },
  { us: 6.5, uk: 6, eu: 39, jp: 24.5, cm: 24.5 },
  { us: 7, uk: 6.5, eu: 40, jp: 25, cm: 24.8 },
  { us: 7.5, uk: 7, eu: 40.5, jp: 25.5, cm: 25.1 },
  { us: 8, uk: 7.5, eu: 41, jp: 26, cm: 25.4 },
  { us: 8.5, uk: 8, eu: 42, jp: 26.5, cm: 25.7 },
  { us: 9, uk: 8.5, eu: 42.5, jp: 27, cm: 26.0 },
  { us: 9.5, uk: 9, eu: 43, jp: 27.5, cm: 26.3 },
  { us: 10, uk: 9.5, eu: 44, jp: 28, cm: 26.7 },
  { us: 10.5, uk: 10, eu: 44.5, jp: 28.5, cm: 27.0 },
  { us: 11, uk: 10.5, eu: 45, jp: 29, cm: 27.3 },
  { us: 11.5, uk: 11, eu: 45.5, jp: 29.5, cm: 27.6 },
  { us: 12, uk: 11.5, eu: 46, jp: 30, cm: 28.0 },
  { us: 13, uk: 12.5, eu: 47.5, jp: 31, cm: 28.6 },
  { us: 14, uk: 13.5, eu: 48.5, jp: 32, cm: 29.2 },
];
export const SHOE_SIZE_WOMEN: ShoeSizeRow[] = [
  { us: 5, uk: 3, eu: 35.5, jp: 22, cm: 22.2 },
  { us: 5.5, uk: 3.5, eu: 36, jp: 22.5, cm: 22.5 },
  { us: 6, uk: 4, eu: 36.5, jp: 23, cm: 22.9 },
  { us: 6.5, uk: 4.5, eu: 37.5, jp: 23.5, cm: 23.2 },
  { us: 7, uk: 5, eu: 38, jp: 24, cm: 23.5 },
  { us: 7.5, uk: 5.5, eu: 38.5, jp: 24.5, cm: 23.8 },
  { us: 8, uk: 6, eu: 39, jp: 25, cm: 24.1 },
  { us: 8.5, uk: 6.5, eu: 40, jp: 25.5, cm: 24.5 },
  { us: 9, uk: 7, eu: 40.5, jp: 26, cm: 24.8 },
  { us: 9.5, uk: 7.5, eu: 41, jp: 26.5, cm: 25.1 },
  { us: 10, uk: 8, eu: 42, jp: 27, cm: 25.4 },
  { us: 10.5, uk: 8.5, eu: 42.5, jp: 27.5, cm: 25.7 },
  { us: 11, uk: 9, eu: 43, jp: 28, cm: 26.0 },
  { us: 12, uk: 10, eu: 44, jp: 29, cm: 26.7 },
];
export type ShoeGender = 'men' | 'women';
export type ShoeSystem = 'us' | 'uk' | 'eu' | 'jp';
export function convertShoeSize(
  size: number,
  from: ShoeSystem,
  to: ShoeSystem,
  gender: ShoeGender,
): number | null {
  if (!isValidValue(size)) return null;
  const table = gender === 'men' ? SHOE_SIZE_MEN : SHOE_SIZE_WOMEN;
  const row = table.find((r) => r[from] === size);
  if (!row) return null;
  return row[to];
}
export function shoeSizeRow(size: number, from: ShoeSystem, gender: ShoeGender): ShoeSizeRow | null {
  if (!isValidValue(size)) return null;
  const table = gender === 'men' ? SHOE_SIZE_MEN : SHOE_SIZE_WOMEN;
  return table.find((r) => r[from] === size) ?? null;
}

// ------------------------------------------------------------- clothing size
export interface ClothingSizeRow {
  label: string;
  labelBn: string;
  us: string;
  uk: string;
  eu: string;
}
export const CLOTHING_SIZE_MEN: ClothingSizeRow[] = [
  { label: 'XS', labelBn: 'এক্সএস', us: '34', uk: '34', eu: '44' },
  { label: 'S', labelBn: 'এস', us: '36', uk: '36', eu: '46' },
  { label: 'M', labelBn: 'এম', us: '38', uk: '38', eu: '48' },
  { label: 'L', labelBn: 'এল', us: '40', uk: '40', eu: '50' },
  { label: 'XL', labelBn: 'এক্সএল', us: '42', uk: '42', eu: '52' },
  { label: 'XXL', labelBn: 'ডাবল এক্সএল', us: '44', uk: '44', eu: '54' },
];
export const CLOTHING_SIZE_WOMEN: ClothingSizeRow[] = [
  { label: 'XS', labelBn: 'এক্সএস', us: '0–2', uk: '4–6', eu: '32' },
  { label: 'S', labelBn: 'এস', us: '4–6', uk: '8–10', eu: '36' },
  { label: 'M', labelBn: 'এম', us: '8–10', uk: '12–14', eu: '40' },
  { label: 'L', labelBn: 'এল', us: '12–14', uk: '16–18', eu: '44' },
  { label: 'XL', labelBn: 'এক্সএল', us: '16–18', uk: '20–22', eu: '48' },
  { label: 'XXL', labelBn: 'ডাবল এক্সএল', us: '20–22', uk: '24–26', eu: '52' },
];
export type ClothingSystem = 'label' | 'us' | 'uk' | 'eu';
export function clothingSizeRow(
  size: string,
  from: ClothingSystem,
  gender: ShoeGender,
): ClothingSizeRow | null {
  const table = gender === 'men' ? CLOTHING_SIZE_MEN : CLOTHING_SIZE_WOMEN;
  const needle = size.trim().toUpperCase();
  return table.find((r) => r[from].toUpperCase() === needle) ?? null;
}
export function convertClothingSize(
  size: string,
  from: ClothingSystem,
  to: ClothingSystem,
  gender: ShoeGender,
): string | null {
  const row = clothingSizeRow(size, from, gender);
  if (!row) return null;
  return row[to];
}

// ---------------------------------------------------------------- dpi / ppi
export function calculatePpi(widthPx: number, heightPx: number, diagonalInches: number): number | null {
  if (!isValidValue(widthPx) || !isValidValue(heightPx) || !isValidValue(diagonalInches)) return null;
  if (widthPx <= 0 || heightPx <= 0 || diagonalInches <= 0) return null;
  return Math.sqrt(widthPx * widthPx + heightPx * heightPx) / diagonalInches;
}
export function calculateDpiFromSize(
  widthPx: number,
  heightPx: number,
  widthInches: number,
  heightInches: number,
): number | null {
  if (!isValidValue(widthPx) || !isValidValue(heightPx) || !isValidValue(widthInches) || !isValidValue(heightInches)) return null;
  if (widthPx <= 0 || heightPx <= 0 || widthInches <= 0 || heightInches <= 0) return null;
  return Math.sqrt((widthPx / widthInches) ** 2 + (heightPx / heightInches) ** 2) / Math.SQRT2;
}

// -------------------------------------------------------------- aspect ratio
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}
export function simplifyAspectRatio(width: number, height: number): { w: number; h: number } | null {
  if (!isValidValue(width) || !isValidValue(height)) return null;
  if (width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) return null;
  const d = gcd(width, height);
  if (d === 0) return null;
  return { w: width / d, h: height / d };
}
export function aspectRatioString(width: number, height: number): string | null {
  const r = simplifyAspectRatio(width, height);
  return r ? `${r.w}:${r.h}` : null;
}
export function findMissingDimension(
  known: number,
  knownIsWidth: boolean,
  ratioW: number,
  ratioH: number,
): number | null {
  if (!isValidValue(known) || !isValidValue(ratioW) || !isValidValue(ratioH)) return null;
  if (known <= 0 || ratioW <= 0 || ratioH <= 0) return null;
  return knownIsWidth ? (known * ratioH) / ratioW : (known * ratioW) / ratioH;
}

// ------------------------------------------------------------------ px / rem
export function pxToRem(px: number, baseFontSize = 16): number | null {
  if (!isValidValue(px) || !isValidValue(baseFontSize)) return null;
  if (baseFontSize <= 0) return null;
  return px / baseFontSize;
}
export function remToPx(rem: number, baseFontSize = 16): number | null {
  if (!isValidValue(rem) || !isValidValue(baseFontSize)) return null;
  if (baseFontSize <= 0) return null;
  return rem * baseFontSize;
}

// --------------------------------------------------------------------- alarm
/** Milliseconds from `nowMs` until the next occurrence of hour:minute (local time). */
export function alarmDelayMs(nowMs: number, hour: number, minute: number): number | null {
  if (!isValidValue(nowMs)) return null;
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const now = new Date(nowMs);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  let delay = target.getTime() - nowMs;
  if (delay <= 0) delay += 24 * 60 * 60 * 1000;
  return delay;
}
export function formatCountdown(ms: number): string | null {
  if (!isValidValue(ms) || ms < 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// -------------------------------------------------------------- week number
/** ISO 8601 week number: { isoYear, week }. */
export function isoWeekNumber(year: number, month: number, day: number): { isoYear: number; week: number } | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== day) return null;
  // Thursday of this week decides the ISO year.
  const dayOfWeek = (date.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() - dayOfWeek + 3);
  const isoYear = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayOfWeek = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(4 - firstDayOfWeek);
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return { isoYear, week };
}

// ------------------------------------------------------------------ leap year
export function isLeapYear(year: number): boolean | null {
  if (!Number.isInteger(year)) return null;
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
export function leapYearExplanation(year: number): 'leap' | 'not-leap-divisible-100' | 'not-leap' | null {
  const leap = isLeapYear(year);
  if (leap === null) return null;
  if (leap) return 'leap';
  if (year % 100 === 0) return 'not-leap-divisible-100';
  return 'not-leap';
}

// --------------------------------------------------------------- julian date
/** Julian day number (integer, Fliegel–Van Flandern). 1 Jan 2000 = 2451545. */
export function gregorianToJulianDay(year: number, month: number, day: number): number | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}
/** Inverse of gregorianToJulianDay. */
export function julianDayToGregorian(jdn: number): { year: number; month: number; day: number } | null {
  if (!Number.isInteger(jdn)) return null;
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}
