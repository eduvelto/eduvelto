/**
 * Zakat Calculator — pure logic (Tool #28).
 *
 * Zakat is 2.5% of zakatable wealth, due only when net wealth reaches the
 * nisab (minimum threshold).
 *
 * - Nisab (gold basis): value of 85 g of gold.
 * - Nisab (silver basis): value of 595 g of silver.
 * - Net wealth = cash + goldGrams x goldPricePerGram
 *   + silverGrams x silverPricePerGram + businessGoodsValue - debts.
 * - If net wealth >= nisab, zakat = 2.5% of net wealth, else 0.
 *
 * Gold/silver prices are USER-ENTERED inputs — they are never hardcoded
 * here, because market prices change daily.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export const ZAKAT_RATE = 0.025;
export const ZAKAT_NISAB_GOLD_GRAMS = 85;
export const ZAKAT_NISAB_SILVER_GRAMS = 595;

export type NisabBasis = 'gold' | 'silver';

export interface ZakatInput {
  /** Cash in hand / in bank (same currency as the prices). */
  cash: number;
  /** Gold owned, in grams. */
  goldGrams: number;
  /** Silver owned, in grams. */
  silverGrams: number;
  /** Value of business/trade goods. */
  businessGoodsValue: number;
  /** Debts / liabilities to subtract. */
  debts: number;
  /** Current gold price per gram (user-entered). */
  goldPricePerGram: number;
  /** Current silver price per gram (user-entered). */
  silverPricePerGram: number;
  /** Which metal the nisab is measured in. */
  nisabBasis: NisabBasis;
}

export interface ZakatResult {
  /** Net zakatable wealth (may be negative when debts exceed assets). */
  netWealth: number;
  /** Nisab threshold in the same currency. */
  nisab: number;
  /** Zakat due (0 when below nisab). */
  zakat: number;
  /** True when net wealth reaches the nisab. */
  due: boolean;
}

function validateNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite number >= 0, got ${value}`);
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate zakat due.
 *
 * Hand-check (gold basis, below nisab): cash 100000, gold 10 g @ 8000,
 * silver 100 g @ 120, business goods 50000, debts 20000 ->
 * net = 100000 + 80000 + 12000 + 50000 - 20000 = 222000;
 * nisab = 85 x 8000 = 680000; 222000 < 680000 -> zakat 0, due false.
 * Same figures on the silver basis: nisab = 595 x 120 = 71400;
 * 222000 >= 71400 -> zakat = 222000 x 2.5% = 5550, due true.
 */
export function calculateZakat(input: ZakatInput): ZakatResult {
  validateNonNegative(input.cash, 'cash');
  validateNonNegative(input.goldGrams, 'goldGrams');
  validateNonNegative(input.silverGrams, 'silverGrams');
  validateNonNegative(input.businessGoodsValue, 'businessGoodsValue');
  validateNonNegative(input.debts, 'debts');
  if (!Number.isFinite(input.goldPricePerGram) || input.goldPricePerGram <= 0) {
    throw new Error(`goldPricePerGram must be a positive number, got ${input.goldPricePerGram}`);
  }
  if (!Number.isFinite(input.silverPricePerGram) || input.silverPricePerGram <= 0) {
    throw new Error(
      `silverPricePerGram must be a positive number, got ${input.silverPricePerGram}`,
    );
  }
  if (input.nisabBasis !== 'gold' && input.nisabBasis !== 'silver') {
    throw new Error(`nisabBasis must be 'gold' or 'silver', got ${input.nisabBasis}`);
  }

  const nisab =
    input.nisabBasis === 'gold'
      ? ZAKAT_NISAB_GOLD_GRAMS * input.goldPricePerGram
      : ZAKAT_NISAB_SILVER_GRAMS * input.silverPricePerGram;

  const netWealth =
    input.cash +
    input.goldGrams * input.goldPricePerGram +
    input.silverGrams * input.silverPricePerGram +
    input.businessGoodsValue -
    input.debts;

  const due = netWealth >= nisab;
  return {
    netWealth: roundMoney(netWealth),
    nisab: roundMoney(nisab),
    zakat: due ? roundMoney(netWealth * ZAKAT_RATE) : 0,
    due,
  };
}
