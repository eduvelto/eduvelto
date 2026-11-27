// Invoice Generator — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateInvoice, lineTotal } from '../../tools/invoice';

describe('calculateInvoice', () => {
  it('2 x 500 + 3 x 200 at 5% tax -> subtotal 1600, tax 80, total 1680', () => {
    // Line totals: 1000 + 600 = 1600; tax 1600 x 0.05 = 80; total 1680.
    expect(
      calculateInvoice({
        items: [
          { description: 'Design', quantity: 2, unitPrice: 500 },
          { description: 'Hosting', quantity: 3, unitPrice: 200 },
        ],
        taxPercent: 5,
      }),
    ).toEqual({ subtotal: 1600, tax: 80, grandTotal: 1680, lineTotals: [1000, 600] });
  });

  it('zero tax leaves the subtotal as the grand total', () => {
    expect(
      calculateInvoice({
        items: [{ description: 'Work', quantity: 1, unitPrice: 999.99 }],
        taxPercent: 0,
      }),
    ).toEqual({ subtotal: 999.99, tax: 0, grandTotal: 999.99, lineTotals: [999.99] });
  });

  it('empty items give zero totals', () => {
    expect(calculateInvoice({ items: [], taxPercent: 10 })).toEqual({
      subtotal: 0,
      tax: 0,
      grandTotal: 0,
      lineTotals: [],
    });
  });

  it('lineTotal multiplies quantity by unit price', () => {
    expect(lineTotal({ description: 'X', quantity: 4, unitPrice: 12.5 })).toBe(50);
  });

  it('rejects negative quantity, negative price and negative tax', () => {
    expect(() =>
      calculateInvoice({
        items: [{ description: 'X', quantity: -1, unitPrice: 10 }],
        taxPercent: 5,
      }),
    ).toThrow(/quantity/);
    expect(() =>
      calculateInvoice({
        items: [{ description: 'X', quantity: 1, unitPrice: -10 }],
        taxPercent: 5,
      }),
    ).toThrow(/unitPrice/);
    expect(() =>
      calculateInvoice({
        items: [{ description: 'X', quantity: 1, unitPrice: 10 }],
        taxPercent: -1,
      }),
    ).toThrow(/taxPercent/);
  });
});
