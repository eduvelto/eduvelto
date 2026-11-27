// Zakat Calculator (Tool #28) — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateZakat } from '../../tools/zakat';

const BASE = {
  cash: 100000,
  goldGrams: 10,
  silverGrams: 100,
  businessGoodsValue: 50000,
  debts: 20000,
  goldPricePerGram: 8000,
  silverPricePerGram: 120,
} as const;

// Net wealth for BASE: 100000 + 10x8000 + 100x120 + 50000 - 20000
//   = 100000 + 80000 + 12000 + 50000 - 20000 = 222000.

describe('calculateZakat', () => {
  it('gold basis below nisab: net 222000 < nisab 680000 -> zakat 0, not due', () => {
    // Nisab = 85 x 8000 = 680000.
    expect(calculateZakat({ ...BASE, nisabBasis: 'gold' })).toEqual({
      netWealth: 222000,
      nisab: 680000,
      zakat: 0,
      due: false,
    });
  });

  it('gold basis above nisab: net 1122000 -> zakat 2.5% = 28050', () => {
    // Cash 1000000: net = 1000000 + 80000 + 12000 + 50000 - 20000 = 1122000.
    // 1122000 x 0.025 = 28050.
    expect(calculateZakat({ ...BASE, cash: 1000000, nisabBasis: 'gold' })).toEqual({
      netWealth: 1122000,
      nisab: 680000,
      zakat: 28050,
      due: true,
    });
  });

  it('silver basis: same wealth, nisab 71400 -> zakat 2.5% of 222000 = 5550', () => {
    // Nisab = 595 x 120 = 71400; 222000 >= 71400; 222000 x 0.025 = 5550.
    expect(calculateZakat({ ...BASE, nisabBasis: 'silver' })).toEqual({
      netWealth: 222000,
      nisab: 71400,
      zakat: 5550,
      due: true,
    });
  });

  it('zakat is due exactly at the nisab: net 680000 = nisab 680000 -> 17000', () => {
    // Cash 680000, nothing else: net = 680000; 680000 x 0.025 = 17000.
    expect(
      calculateZakat({
        cash: 680000,
        goldGrams: 0,
        silverGrams: 0,
        businessGoodsValue: 0,
        debts: 0,
        goldPricePerGram: 8000,
        silverPricePerGram: 120,
        nisabBasis: 'gold',
      }),
    ).toEqual({ netWealth: 680000, nisab: 680000, zakat: 17000, due: true });
  });

  it('debts reduce net wealth below the nisab', () => {
    // Net = 222000 - 200000 extra debt = 22000 < 71400 (silver nisab).
    expect(calculateZakat({ ...BASE, debts: 220000, nisabBasis: 'silver' })).toEqual({
      netWealth: 22000,
      nisab: 71400,
      zakat: 0,
      due: false,
    });
  });

  it('zero wealth owes nothing', () => {
    expect(
      calculateZakat({
        cash: 0,
        goldGrams: 0,
        silverGrams: 0,
        businessGoodsValue: 0,
        debts: 0,
        goldPricePerGram: 8000,
        silverPricePerGram: 120,
        nisabBasis: 'gold',
      }),
    ).toEqual({ netWealth: 0, nisab: 680000, zakat: 0, due: false });
  });

  it('rejects negative amounts and non-positive prices', () => {
    expect(() => calculateZakat({ ...BASE, cash: -1, nisabBasis: 'gold' })).toThrow(/cash/);
    expect(() => calculateZakat({ ...BASE, goldPricePerGram: 0, nisabBasis: 'gold' })).toThrow(
      /goldPricePerGram/,
    );
    expect(() => calculateZakat({ ...BASE, silverPricePerGram: -5, nisabBasis: 'silver' })).toThrow(
      /silverPricePerGram/,
    );
  });

  it('rejects an unknown nisab basis', () => {
    expect(() =>
      calculateZakat({ ...BASE, nisabBasis: 'platinum' as 'gold' }),
    ).toThrow(/nisabBasis/);
  });
});
