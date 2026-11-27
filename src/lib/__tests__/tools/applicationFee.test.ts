import { describe, it, expect } from 'vitest';
import { DEFAULT_VAT_RATE, calculateApplicationFee } from '../../tools/applicationFee';

describe('calculateApplicationFee', () => {
  it('fee 500 x 2, VAT 15%, charge 50 -> base 1000, VAT 150, total 1200', () => {
    expect(calculateApplicationFee({ feePerApplication: 500, copies: 2, vatRate: 15, serviceCharge: 50 })).toEqual(
      { baseTotal: 1000, vat: 150, serviceCharge: 50, grandTotal: 1200 },
    );
  });
  it('default VAT rate is 15', () => expect(DEFAULT_VAT_RATE).toBe(15));
  it('throws on negative fee or zero copies', () => {
    expect(() => calculateApplicationFee({ feePerApplication: -1, copies: 1, vatRate: 15, serviceCharge: 0 })).toThrow();
    expect(() => calculateApplicationFee({ feePerApplication: 100, copies: 0, vatRate: 15, serviceCharge: 0 })).toThrow();
  });
});
