// Sleep Cycle Calculator — unit tests. Every expected value is hand-computed.
import { describe, it, expect } from 'vitest';
import { bedtimesForWake, wakeTimesForBed } from '../../tools/sleepCycle';

describe('sleep cycles', () => {
  it('wake at 06:00 -> bedtimes 23:45, 22:15, 20:45 (4/5/6 cycles)', () => {
    // 06:00 - 15 min - 4x90 = 23:45; - 5x90 = 22:15; - 6x90 = 20:45.
    expect(bedtimesForWake('06:00')).toEqual([
      { cycles: 4, hours: 6, time: '23:45' },
      { cycles: 5, hours: 7.5, time: '22:15' },
      { cycles: 6, hours: 9, time: '20:45' },
    ]);
  });

  it('bed at 22:30 -> wake times 04:45, 06:15, 07:45', () => {
    // 22:30 + 15 min + 4x90 = 04:45; + 5x90 = 06:15; + 6x90 = 07:45.
    expect(wakeTimesForBed('22:30')).toEqual([
      { cycles: 4, hours: 6, time: '04:45' },
      { cycles: 5, hours: 7.5, time: '06:15' },
      { cycles: 6, hours: 9, time: '07:45' },
    ]);
  });

  it('rejects a bad clock time', () => {
    expect(() => bedtimesForWake('25:00')).toThrow(/time/);
    expect(() => wakeTimesForBed('6pm')).toThrow(/time/);
  });
});
