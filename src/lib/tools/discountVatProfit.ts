/**
 * Discount, VAT & Profit Calculator — pure logic.
 *
 * Three small calculations, one file:
 * - Discount: discountAmount = price x discount% / 100;
 *   finalPrice = price - discountAmount.
 * - VAT: when the price INCLUDES VAT, vatAmount = price x v / (100+v)
 *   and priceExVat = price - vatAmount; when it EXCLUDES VAT,
 *   vatAmount = price x v / 100 and priceIncVat = price + vatAmount.
 * - Profit: profit = sellingPrice - costPrice;
 *   margin = profit / sellingPrice x 100; markup = profit / costPrice
 *   x 100 (null markup when the cost price is 0).
 *
 * The VAT rate is USER-ENTERED (the UI offers 15% only as an
 * example starting value — Bangladesh VAT rates vary by item, so no
 * rate is stated here as a fact). All money results are estimates,
 * rounded to 2 decimals.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface DiscountInput {
  /** Price before discount. */
  originalPrice: number;
  /** Discount in percent. */
  discountPercent: number;
}

export interface DiscountResult {
  /** Money saved by the discount. */
  discountAmount: number;
  /** Price to pay after the discount. */
  finalPrice: number;
}

export interface VatInput {
  /** Price (including or excluding VAT, per `vatIncluded`). */
  price: number;
  /** VAT rate in percent (user-entered). */
  vatPercent: number;
  /** True when `price` already includes VAT. */
  vatIncluded: boolean;
}

export interface VatResult {
  /** VAT amount inside / on top of the price. */
  vatAmount: number;
  /** Price without VAT. */
  priceExVat: number;
  /** Price with VAT. */
  priceIncVat: number;
}

export interface ProfitInput {
  /** What the item cost. */
  costPrice: number;
  /** What the item sells for. */
  sellingPrice: number;
}

export interface ProfitResult {
  /** Selling price minus cost price (negative = a loss). */
  profit: number;
  /** Profit as a share of the selling price, in percent. */
  profitMarginPercent: number;
  /** Profit as a share of the cost price, in percent (null when cost is 0). */
  markupPercent: number | null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPct(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Discount.
 *
 * Hand-check: price 2,000 at 25% off -> discount 500, pay 1,500.
 */
export function calculateDiscount(input: DiscountInput): DiscountResult {
  if (!Number.isFinite(input.originalPrice) || input.originalPrice < 0) {
    throw new Error(`originalPrice must be a finite number >= 0, got ${input.originalPrice}`);
  }
  if (!Number.isFinite(input.discountPercent) || input.discountPercent < 0 || input.discountPercent > 100) {
    throw new Error(`discountPercent must be between 0 and 100, got ${input.discountPercent}`);
  }
  const discountAmount = roundMoney((input.originalPrice * input.discountPercent) / 100);
  return { discountAmount, finalPrice: roundMoney(input.originalPrice - discountAmount) };
}

/**
 * VAT.
 *
 * Hand-check (excluded): price 1,000 at 15% -> VAT 150, total 1,150.
 * Hand-check (included): price 1,150 at 15% -> VAT 150, ex-VAT 1,000.
 */
export function calculateVat(input: VatInput): VatResult {
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error(`price must be a finite number >= 0, got ${input.price}`);
  }
  if (!Number.isFinite(input.vatPercent) || input.vatPercent < 0) {
    throw new Error(`vatPercent must be a finite number >= 0, got ${input.vatPercent}`);
  }
  if (input.vatIncluded) {
    const vatAmount = roundMoney((input.price * input.vatPercent) / (100 + input.vatPercent));
    return { vatAmount, priceExVat: roundMoney(input.price - vatAmount), priceIncVat: roundMoney(input.price) };
  }
  const vatAmount = roundMoney((input.price * input.vatPercent) / 100);
  return { vatAmount, priceExVat: roundMoney(input.price), priceIncVat: roundMoney(input.price + vatAmount) };
}

/**
 * Profit / margin / markup.
 *
 * Hand-check: cost 800, sell 1,000 -> profit 200, margin 20%,
 * markup 25%. Loss case: cost 1,000, sell 800 -> profit -200,
 * margin -25%, markup -20%.
 */
export function calculateProfit(input: ProfitInput): ProfitResult {
  if (!Number.isFinite(input.costPrice) || input.costPrice < 0) {
    throw new Error(`costPrice must be a finite number >= 0, got ${input.costPrice}`);
  }
  if (!Number.isFinite(input.sellingPrice) || input.sellingPrice < 0) {
    throw new Error(`sellingPrice must be a finite number >= 0, got ${input.sellingPrice}`);
  }
  const profit = roundMoney(input.sellingPrice - input.costPrice);
  return {
    profit,
    profitMarginPercent:
      input.sellingPrice === 0 ? 0 : roundPct((profit / input.sellingPrice) * 100),
    markupPercent: input.costPrice === 0 ? null : roundPct((profit / input.costPrice) * 100),
  };
}

/**
 * Reverse modes for the Profit Margin tool (landed 27 Nov 2026, A-tools).
 * Hand-check: cost 800 + margin 20% -> selling 1000; selling 1000 + margin
 * 20% -> cost 800. Margin must be < 100% (at 100% no finite price exists).
 */
export function sellingPriceForMargin(costPrice: number, marginPercent: number): number {
  if (!Number.isFinite(costPrice) || costPrice < 0) {
    throw new Error(`costPrice must be a finite number >= 0, got ${costPrice}`);
  }
  if (!Number.isFinite(marginPercent) || marginPercent < 0 || marginPercent >= 100) {
    throw new Error(`marginPercent must be between 0 and 100 (exclusive), got ${marginPercent}`);
  }
  return roundMoney(costPrice / (1 - marginPercent / 100));
}

export function costForMargin(sellingPrice: number, marginPercent: number): number {
  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    throw new Error(`sellingPrice must be a finite number >= 0, got ${sellingPrice}`);
  }
  if (!Number.isFinite(marginPercent) || marginPercent < 0 || marginPercent >= 100) {
    throw new Error(`marginPercent must be between 0 and 100 (exclusive), got ${marginPercent}`);
  }
  return roundMoney(sellingPrice * (1 - marginPercent / 100));
}
