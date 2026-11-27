// Discount, VAT & Profit — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/discountVatProfit.ts.
import { describe, it, expect } from 'vitest';
import { calculateDiscount, calculateVat, calculateProfit } from '../../tools/discountVatProfit';

describe('calculateDiscount', () => {
  it('2,000 at 25% off -> discount 500, pay 1,500', () => {
    expect(calculateDiscount({ originalPrice: 2000, discountPercent: 25 })).toEqual({
      discountAmount: 500,
      finalPrice: 1500,
    });
  });

  it('0% discount changes nothing; 100% discount -> free', () => {
    expect(calculateDiscount({ originalPrice: 2000, discountPercent: 0 }).finalPrice).toBe(2000);
    expect(calculateDiscount({ originalPrice: 2000, discountPercent: 100 }).finalPrice).toBe(0);
  });

  it('rejects a discount above 100%', () => {
    expect(() => calculateDiscount({ originalPrice: 2000, discountPercent: 101 })).toThrow(
      /discountPercent/,
    );
  });
});

describe('calculateVat', () => {
  it('price excluding VAT: 1,000 at 15% -> VAT 150, total 1,150', () => {
    expect(calculateVat({ price: 1000, vatPercent: 15, vatIncluded: false })).toEqual({
      vatAmount: 150,
      priceExVat: 1000,
      priceIncVat: 1150,
    });
  });

  it('price including VAT: 1,150 at 15% -> VAT 150, ex-VAT 1,000', () => {
    expect(calculateVat({ price: 1150, vatPercent: 15, vatIncluded: true })).toEqual({
      vatAmount: 150,
      priceExVat: 1000,
      priceIncVat: 1150,
    });
  });
});

describe('calculateProfit', () => {
  it('cost 800, sell 1,000 -> profit 200, margin 20%, markup 25%', () => {
    expect(calculateProfit({ costPrice: 800, sellingPrice: 1000 })).toEqual({
      profit: 200,
      profitMarginPercent: 20,
      markupPercent: 25,
    });
  });

  it('loss: cost 1,000, sell 800 -> profit -200, margin -25%, markup -20%', () => {
    expect(calculateProfit({ costPrice: 1000, sellingPrice: 800 })).toEqual({
      profit: -200,
      profitMarginPercent: -25,
      markupPercent: -20,
    });
  });

  it('zero cost -> markup is null', () => {
    expect(calculateProfit({ costPrice: 0, sellingPrice: 1000 }).markupPercent).toBeNull();
  });
});
