// Ovulation Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { calculateOvulation } from '../../tools/ovulation';

describe('calculateOvulation', () => {
  it('LMP 2026-01-01, 28-day cycle -> ovulation 2026-01-15, fertile 01-10 to 01-16', () => {
    expect(calculateOvulation('2026-01-01', 28)).toEqual({
      ovulationDate: '2026-01-15',
      fertileWindowStart: '2026-01-10',
      fertileWindowEnd: '2026-01-16',
      nextPeriodDate: '2026-01-29',
    });
  });

  it('30-day cycle -> ovulation on day 16 (2026-01-17), next period 2026-01-31', () => {
    expect(calculateOvulation('2026-01-01', 30)).toEqual({
      ovulationDate: '2026-01-17',
      fertileWindowStart: '2026-01-12',
      fertileWindowEnd: '2026-01-18',
      nextPeriodDate: '2026-01-31',
    });
  });

  it('defaults to a 28-day cycle and rejects out-of-range cycles', () => {
    expect(calculateOvulation('2026-01-01').ovulationDate).toBe('2026-01-15');
    expect(() => calculateOvulation('2026-01-01', 15)).toThrow(/cycleLengthDays/);
    expect(() => calculateOvulation('2026-01-01', 40)).toThrow(/cycleLengthDays/);
  });
});
