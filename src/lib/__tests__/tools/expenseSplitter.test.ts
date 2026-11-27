// Expense splitter — unit tests. Every expected value is
// hand-computed; see the comments in src/lib/tools/expenseSplitter.ts.
import { describe, it, expect } from 'vitest';
import { splitEqually, splitByShares, settleUp } from '../../tools/expenseSplitter';

describe('splitEqually', () => {
  it('3,000 among 4 people -> 750 each', () => {
    expect(splitEqually(3000, 4)).toEqual({ perPerson: 750, peopleCount: 4 });
  });

  it('rejects zero people', () => {
    expect(() => splitEqually(3000, 0)).toThrow(/peopleCount/);
  });
});

describe('splitByShares', () => {
  it('4,000 in shares [2, 1, 1] -> 2,000 / 1,000 / 1,000', () => {
    expect(splitByShares(4000, [2, 1, 1])).toEqual({ amounts: [2000, 1000, 1000] });
  });

  it('1,000 in equal thirds folds the 0.01 drift into the last share', () => {
    expect(splitByShares(1000, [1, 1, 1])).toEqual({ amounts: [333.33, 333.33, 333.34] });
  });

  it('rejects all-zero shares', () => {
    expect(() => splitByShares(1000, [0, 0])).toThrow(/shares/);
  });
});

describe('settleUp', () => {
  it('A 3,000, B 1,000, C 0 -> C pays A 1,333.33, B pays A 333.33', () => {
    const r = settleUp([
      { name: 'A', paid: 3000 },
      { name: 'B', paid: 1000 },
      { name: 'C', paid: 0 },
    ]);
    expect(r.total).toBe(4000);
    expect(r.sharePerPerson).toBe(1333.33);
    expect(r.balances).toEqual([
      { name: 'A', paid: 3000, share: 1333.33, net: 1666.67 },
      { name: 'B', paid: 1000, share: 1333.33, net: -333.33 },
      { name: 'C', paid: 0, share: 1333.33, net: -1333.33 },
    ]);
    expect(r.transfers).toEqual([
      { from: 'C', to: 'A', amount: 1333.33 },
      { from: 'B', to: 'A', amount: 333.33 },
    ]);
  });

  it('already even -> no transfers', () => {
    const r = settleUp([
      { name: 'A', paid: 1000 },
      { name: 'B', paid: 1000 },
    ]);
    expect(r.transfers).toEqual([]);
  });
});
