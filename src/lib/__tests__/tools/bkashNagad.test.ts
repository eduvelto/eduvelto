// bKash / Nagad Cash Out Charge Calculator — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateCashOutCharge } from '../../tools/bkashNagad';

describe('calculateCashOutCharge', () => {
  it('1000 at 1.49% -> charge 14.90, total 1014.90', () => {
    // 1000 x 1.49 / 100 = 14.90; 1000 + 14.90 = 1014.90.
    expect(calculateCashOutCharge({ amount: 1000, chargeRatePercent: 1.49 })).toEqual({
      charge: 14.9,
      total: 1014.9,
    });
  });

  it('5000 at 1.85% -> charge 92.50, total 5092.50', () => {
    // 5000 x 1.85 / 100 = 92.50; 5000 + 92.50 = 5092.50.
    expect(calculateCashOutCharge({ amount: 5000, chargeRatePercent: 1.85 })).toEqual({
      charge: 92.5,
      total: 5092.5,
    });
  });

  it('zero amount costs nothing', () => {
    expect(calculateCashOutCharge({ amount: 0, chargeRatePercent: 1.49 })).toEqual({
      charge: 0,
      total: 0,
    });
  });

  it('zero rate costs nothing', () => {
    expect(calculateCashOutCharge({ amount: 2000, chargeRatePercent: 0 })).toEqual({
      charge: 0,
      total: 2000,
    });
  });

  it('rounds to two decimals: 333 at 1.49% -> 4.96 charge', () => {
    // 333 x 1.49 / 100 = 4.9617 -> 4.96; total 337.96.
    expect(calculateCashOutCharge({ amount: 333, chargeRatePercent: 1.49 })).toEqual({
      charge: 4.96,
      total: 337.96,
    });
  });

  it('rejects negative amount and negative rate', () => {
    expect(() => calculateCashOutCharge({ amount: -1, chargeRatePercent: 1.49 })).toThrow(
      /amount/,
    );
    expect(() => calculateCashOutCharge({ amount: 1000, chargeRatePercent: -0.5 })).toThrow(
      /chargeRatePercent/,
    );
  });
});
