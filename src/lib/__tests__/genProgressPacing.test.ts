// Smart Engine progress pacing — unit tests (sprint Day 4).
// The pacing helpers only wait out a *remaining* dwell after real
// work; they must never invent a wait, never go negative, and the
// constants must guarantee >= 2s total with every phase visible.
import { describe, it, expect } from 'vitest';
import {
  GEN_PROGRESS_MIN_PHASE_MS,
  GEN_PROGRESS_MIN_TOTAL_MS,
  genProgressPhaseWaitMs,
  genProgressTotalWaitMs,
  sleepMs,
  waitGenProgressClose,
  waitGenProgressPhase,
  waitGenProgressTotal,
} from '../genProgressPacing';

describe('Smart Engine progress pacing constants', () => {
  it('requires a ~2-second progress screen', () => {
    expect(GEN_PROGRESS_MIN_TOTAL_MS).toBe(2000);
  });

  it('gives every phase a visible dwell, and three dwells fit inside the total', () => {
    expect(GEN_PROGRESS_MIN_PHASE_MS).toBeGreaterThanOrEqual(500);
    expect(3 * GEN_PROGRESS_MIN_PHASE_MS).toBeLessThanOrEqual(GEN_PROGRESS_MIN_TOTAL_MS);
  });
});

describe('genProgressPhaseWaitMs', () => {
  it('returns the remaining dwell when the phase just started', () => {
    expect(genProgressPhaseWaitMs(1000, 1100)).toBe(500);
    expect(genProgressPhaseWaitMs(1000, 1000, 600)).toBe(600);
  });

  it('returns 0 once the dwell has elapsed — slow real work is never extended', () => {
    expect(genProgressPhaseWaitMs(1000, 1600)).toBe(0);
    expect(genProgressPhaseWaitMs(1000, 5000)).toBe(0);
  });

  it('never returns a negative wait', () => {
    expect(genProgressPhaseWaitMs(0, 1_000_000)).toBeGreaterThanOrEqual(0);
  });
});

describe('genProgressTotalWaitMs', () => {
  it('returns the remaining time until the 2-second minimum', () => {
    expect(genProgressTotalWaitMs(1000, 1500)).toBe(1500);
    expect(genProgressTotalWaitMs(1000, 1000)).toBe(2000);
  });

  it('returns 0 once the run already lasted 2 seconds or more', () => {
    expect(genProgressTotalWaitMs(1000, 3000)).toBe(0);
    expect(genProgressTotalWaitMs(1000, 9000)).toBe(0);
  });
});

describe('wait helpers (real short waits)', () => {
  it('sleepMs(0) resolves without waiting', async () => {
    const start = Date.now();
    await sleepMs(0);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('waitGenProgressPhase waits the remaining dwell, not the full dwell', async () => {
    // Phase started 40ms ago with a 60ms dwell: ~20ms left to wait.
    const startedAt = Date.now() - 40;
    const start = Date.now();
    await waitGenProgressPhase(startedAt, Date.now(), 60);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(10);
    expect(elapsed).toBeLessThan(300);
  });

  it('waitGenProgressPhase returns at once when the dwell already elapsed', async () => {
    const start = Date.now();
    await waitGenProgressPhase(Date.now() - 5000, Date.now(), 600);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('waitGenProgressTotal waits only the remaining time to 2s', async () => {
    // Run started 1970ms ago: ~30ms left, not a fresh 2s wait.
    const startedAt = Date.now() - 1970;
    const start = Date.now();
    await waitGenProgressTotal(startedAt, Date.now(), 2000);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(15);
    expect(elapsed).toBeLessThan(300);
  });

  it('waitGenProgressClose waits the longer of phase dwell and total', async () => {
    // Phase fresh (600ms dwell) but run almost 2s old (~30ms total
    // left): the close must wait the phase dwell, ~600ms.
    const now = Date.now();
    const start = Date.now();
    await waitGenProgressClose(now, now - 1970, now);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(500);
    expect(elapsed).toBeLessThan(1500);
  });

  it('waitGenProgressClose returns at once when both gates already passed', async () => {
    const start = Date.now();
    await waitGenProgressClose(Date.now() - 5000, Date.now() - 5000, Date.now());
    expect(Date.now() - start).toBeLessThan(100);
  });
});
