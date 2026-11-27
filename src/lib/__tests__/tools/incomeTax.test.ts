// Income tax calculator — unit tests. Every expected value is
// hand-computed against the default slabs in src/lib/tools/incomeTax.ts.
// The slabs are editable data; these tests pin the DEFAULTS only.
import { describe, it, expect } from 'vitest';
import { calculateIncomeTax, DEFAULT_BD_TAX_SLABS_2025_26 } from '../../tools/incomeTax';

describe('calculateIncomeTax (default slabs)', () => {
  it('600,000 income -> tax 20,000 (5,000 + 15,000)', () => {
    // 350,000 at 0% = 0; 100,000 at 5% = 5,000; 150,000 at 10% = 15,000.
    const r = calculateIncomeTax({ annualIncome: 600000, slabs: DEFAULT_BD_TAX_SLABS_2025_26 });
    expect(r.tax).toBe(20000);
    expect(r.monthlyTax).toBe(1666.67);
    expect(r.effectiveRatePercent).toBe(3.33);
    expect(r.taxableIncome).toBe(250000);
    expect(r.breakdown[0]).toEqual({ upTo: 350000, ratePercent: 0, taxableInSlab: 350000, taxInSlab: 0 });
    expect(r.breakdown[1]).toEqual({ upTo: 450000, ratePercent: 5, taxableInSlab: 100000, taxInSlab: 5000 });
    expect(r.breakdown[2]).toEqual({ upTo: 850000, ratePercent: 10, taxableInSlab: 150000, taxInSlab: 15000 });
  });

  it('300,000 income -> no tax (inside the tax-free slab)', () => {
    const r = calculateIncomeTax({ annualIncome: 300000, slabs: DEFAULT_BD_TAX_SLABS_2025_26 });
    expect(r.tax).toBe(0);
    expect(r.effectiveRatePercent).toBe(0);
    expect(r.taxableIncome).toBe(0);
  });

  it('2,000,000 income -> tax 257,500', () => {
    // 0 + 5,000 + 40,000 + 75,000 + 100,000 + 37,500 (150,000 at 25%
    // above 1,850,000: 2,000,000 - 1,850,000 = 150,000) = 257,500.
    const r = calculateIncomeTax({ annualIncome: 2000000, slabs: DEFAULT_BD_TAX_SLABS_2025_26 });
    expect(r.tax).toBe(257500);
    expect(r.monthlyTax).toBe(21458.33);
    expect(r.effectiveRatePercent).toBe(12.88);
  });

  it('custom slabs are honoured (editable data)', () => {
    const r = calculateIncomeTax({
      annualIncome: 500000,
      slabs: [
        { upTo: 400000, ratePercent: 0 },
        { upTo: null, ratePercent: 10 },
      ],
    });
    expect(r.tax).toBe(10000);
  });

  it('rejects unsorted slabs and rates above 100', () => {
    expect(() =>
      calculateIncomeTax({
        annualIncome: 500000,
        slabs: [
          { upTo: 450000, ratePercent: 5 },
          { upTo: 350000, ratePercent: 0 },
        ],
      }),
    ).toThrow(/upTo/);
    expect(() =>
      calculateIncomeTax({ annualIncome: 500000, slabs: [{ upTo: null, ratePercent: 101 }] }),
    ).toThrow(/ratePercent/);
  });
});
