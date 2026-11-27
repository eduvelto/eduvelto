// Pregnancy Due Date Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateDueDate, gestationalAge } from '../../tools/pregnancyDueDate';

describe('calculateDueDate', () => {
  it('LMP 2026-01-01 -> due 2026-10-08 (Naegele, +280 days)', () => {
    expect(calculateDueDate('2026-01-01')).toEqual({
      dueDate: '2026-10-08',
      conceptionDate: '2026-01-15',
      secondTrimesterStart: '2026-04-09',
      thirdTrimesterStart: '2026-07-16',
    });
  });

  it('gestational age on 2026-04-09 is 14 weeks, 0 days', () => {
    // 98 days after 2026-01-01 = 14 weeks exactly.
    expect(gestationalAge('2026-01-01', '2026-04-09')).toEqual({ weeks: 14, days: 0 });
  });

  it('rejects an invalid date', () => {
    expect(() => calculateDueDate('2026-02-30')).toThrow(/date/);
    expect(() => calculateDueDate('01/01/2026')).toThrow(/date/);
  });
});
