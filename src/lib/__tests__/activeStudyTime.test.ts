// Eduvelto — active study-time clock tests (Step 12).
//
// The clock is pure time math over caller-supplied millis, so
// every behaviour is tested without a DOM: basic accrual,
// hidden pause/resume, idle timeout (90s), interaction resume,
// suspension cap, and flush-restart semantics.

import { describe, expect, it } from 'vitest';
import { ACTIVE_IDLE_TIMEOUT_MS, createActiveClock } from '../activeStudyTime';

const T0 = 1_000_000;

describe('createActiveClock', () => {
  it('flushes the active seconds since start', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.interact(T0 + 10_000);
    expect(clock.flush(T0 + 45_000)).toBe(45);
    // Flush restarts the clock: the next flush counts only
    // new time.
    clock.interact(T0 + 50_000);
    expect(clock.flush(T0 + 55_000)).toBe(10);
  });

  it('is paused before start and reports 0 on flush', () => {
    const clock = createActiveClock();
    expect(clock.isPaused()).toBe(true);
    expect(clock.flush(T0)).toBe(0);
  });

  it('pauses immediately on hidden and resumes on visible', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.interact(T0 + 20_000);
    clock.pause(T0 + 30_000);
    expect(clock.isPaused()).toBe(true);
    // 10 hidden minutes add nothing.
    expect(clock.flush(T0 + 630_000)).toBe(30);
    clock.resume(T0 + 630_000);
    expect(clock.isPaused()).toBe(false);
    clock.interact(T0 + 640_000);
    expect(clock.flush(T0 + 645_000)).toBe(15);
  });

  it('resume is a no-op while the clock is running', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.resume(T0 + 5_000);
    expect(clock.isPaused()).toBe(false);
    expect(clock.flush(T0 + 10_000)).toBe(10);
  });

  it('parks after 90s without interaction and credits only up to the timeout', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.interact(T0 + 10_000);
    // Last interaction at T0+10s; flushed 5 minutes later.
    // The segment ends at lastInteraction + 90s = T0+100s.
    expect(clock.flush(T0 + 300_000)).toBe(100);
    expect(clock.isPaused()).toBe(true);
    // Still parked: further flushes add nothing.
    expect(clock.flush(T0 + 600_000)).toBe(0);
  });

  it('an interaction resumes an idle-parked clock', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.interact(T0 + 10_000);
    expect(clock.flush(T0 + 300_000)).toBe(100);
    expect(clock.isPaused()).toBe(true);
    clock.interact(T0 + 400_000);
    expect(clock.isPaused()).toBe(false);
    expect(clock.flush(T0 + 420_000)).toBe(20);
  });

  it('caps a suspended tab at lastInteraction + 90s (never hours)', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.interact(T0 + 5_000);
    // Laptop slept 8 hours; the student never interacted again.
    expect(clock.flush(T0 + 8 * 60 * 60 * 1000)).toBe(95);
  });

  it('a hidden pause banks the accrued time and a later flush returns it once', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.interact(T0 + 20_000);
    clock.pause(T0 + 25_000);
    // Flush while still hidden: the banked 25s come out once.
    expect(clock.flush(T0 + 100_000)).toBe(25);
    expect(clock.flush(T0 + 200_000)).toBe(0);
  });

  it('interaction while hidden-paused does not resume the clock', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.pause(T0 + 10_000);
    clock.interact(T0 + 20_000);
    expect(clock.isPaused()).toBe(true);
    // Only the pre-pause 10s are banked.
    expect(clock.flush(T0 + 30_000)).toBe(10);
  });

  it('discards negative deltas (clock skew)', () => {
    const clock = createActiveClock();
    clock.start(T0 + 10_000);
    expect(clock.flush(T0)).toBe(0);
    expect(clock.isPaused()).toBe(false);
  });

  it('start restarts a parked clock fresh', () => {
    const clock = createActiveClock();
    clock.start(T0);
    clock.pause(T0 + 10_000);
    clock.start(T0 + 100_000);
    expect(clock.isPaused()).toBe(false);
    clock.interact(T0 + 110_000);
    expect(clock.flush(T0 + 120_000)).toBe(20);
  });

  it('the idle timeout is 90 seconds (reconciled Step 12 value)', () => {
    expect(ACTIVE_IDLE_TIMEOUT_MS).toBe(90_000);
  });
});
