// Tip Calculator — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateTip } from '../../tools/tipCalculator';

describe('calculateTip', () => {
  it('bill 1000, tip 10%, 4 people -> tip 100, total 1100, per person 275', () => {
    expect(calculateTip({ bill: 1000, tipPercent: 10, people: 4 })).toEqual({
      tip: 100,
      total: 1100,
      perPerson: 275,
    });
  });

  it('bill 850, tip 15%, 2 people -> tip 127.50, total 977.50, per person 488.75', () => {
    // 850 x 0.15 = 127.50; 850 + 127.50 = 977.50; 977.50 / 2 = 488.75.
    expect(calculateTip({ bill: 850, tipPercent: 15, people: 2 })).toEqual({
      tip: 127.5,
      total: 977.5,
      perPerson: 488.75,
    });
  });

  it('one person pays the whole total', () => {
    // 500 x 0.20 = 100; total 600; per person 600.
    expect(calculateTip({ bill: 500, tipPercent: 20, people: 1 })).toEqual({
      tip: 100,
      total: 600,
      perPerson: 600,
    });
  });

  it('zero tip leaves the bill unchanged', () => {
    expect(calculateTip({ bill: 700, tipPercent: 0, people: 3 })).toEqual({
      tip: 0,
      total: 700,
      perPerson: 233.33,
    });
  });

  it('rejects negative bill, negative tip and people below 1', () => {
    expect(() => calculateTip({ bill: -1, tipPercent: 10, people: 2 })).toThrow(/bill/);
    expect(() => calculateTip({ bill: 100, tipPercent: -5, people: 2 })).toThrow(/tipPercent/);
    expect(() => calculateTip({ bill: 100, tipPercent: 10, people: 0 })).toThrow(/people/);
    expect(() => calculateTip({ bill: 100, tipPercent: 10, people: 2.5 })).toThrow(/people/);
  });
});
