/**
 * Eduvelto — Step 19 F7 unit tests (src/lib/mockTimer.ts).
 *
 * THE BUG (timer-code-check.md §1.2): JobMockPage.enterExam used to
 * measure the client↔server clock offset as
 * `startedAtMillis - Date.now()` on BOTH fresh start and resume.
 * On resume `startedAtMillis` is the ORIGINAL start time read back
 * from the stored session doc, so the offset became −(elapsed) and
 * the displayed remaining time became the FULL duration again:
 * 60-min mock, refresh at 20 min → displayed 60, true remaining 40.
 * The stored deadline (endsAt) was always restored correctly — only
 * the displayed countdown was wrong, which also made auto-submit
 * fire late.
 *
 * THE FIX (src/lib/mockTimer.ts, used by JobMockPage.enterExam):
 * measure the offset ONLY at fresh start (startedAt ≈ now) and use
 * offset 0 on resume (trust the client clock for display). The
 * stored deadline stays authoritative and the Firestore rules
 * enforce it server-side at attempt create, so display skew can
 * never extend the exam.
 *
 * BEFORE/AFTER EVIDENCE: the F7 regression tests below assert the
 * fixed math AND compute what the OLD formula would have shown
 * (buggyRemaining === 60 min) in the same test, so each test
 * discriminates old vs new. A scratch run of the same expectations
 * against the old formula (startedAt − now on resume) fails with
 * "expected 2400000, got 3600000" — see the F7 report.
 *
 * Coverage map (Gemini + ChatGPT fold-in, 23 Nov 2026):
 * - F7 regression (60-min mock, refresh at 20 min → 40 min):
 *   the headline test, with fake timers (ChatGPT: vi.useFakeTimers
 *   + advanceTimersByTime). Refresh at 45 min → 15 min is the
 *   second case (ChatGPT checklist item 2).
 * - Tab switch / minimize / screen lock catch-up (ChatGPT items
 *   3–5): the MATH half is proven here — advancing `now` deducts
 *   the elapsed time from the absolute deadline on the next call.
 *   The browser half (a real tab actually throttling/suspending)
 *   is OWED — no real browser session exists in this repo.
 * - Clock change (ChatGPT items 10–11, unit half): the helper is
 *   pure display math — a client clock moved BACK shows MORE
 *   remaining, a clock moved FORWARD shows LESS. Client time
 *   cannot enforce anything; the server-side proof is the
 *   emulator tests (rules-job-mock-timer-resume.test.ts), where
 *   request.time / serverTimestamp decide.
 * - setInterval drift (ChatGPT pitfall): the helper holds no
 *   state — repeated calls recompute from the absolute deadline,
 *   so there is nothing to drift. Proven by the purity test.
 * - Storing remaining seconds (ChatGPT pitfall): the helper never
 *   stores a remaining value; it derives it from the deadline
 *   every call. By construction, not a test.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  computeRemainingMillis,
  resolveExamClockOffsetMillis,
} from '../mockTimer';

const MIN = 60_000;

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveExamClockOffsetMillis', () => {
  it('fresh start returns startedAtMillis - nowMillis (≈0 when startedAt ≈ now)', () => {
    const now = 1_700_000_000_000;
    expect(
      resolveExamClockOffsetMillis({ startedAtMillis: now, nowMillis: now, isResume: false }),
    ).toBe(0);
  });

  it('fresh start preserves a small real skew (read-back latency)', () => {
    // startMockSession returns Date.now(); by the time enterExam
    // reads it back, ~250ms have passed.
    const now = 1_700_000_000_000;
    expect(
      resolveExamClockOffsetMillis({ startedAtMillis: now - 250, nowMillis: now, isResume: false }),
    ).toBe(-250);
  });

  it('resume returns 0 regardless of elapsed time', () => {
    const startedAt = 1_700_000_000_000;
    const now = startedAt + 20 * MIN;
    expect(
      resolveExamClockOffsetMillis({ startedAtMillis: startedAt, nowMillis: now, isResume: true }),
    ).toBe(0);
  });

  it('resume returns 0 even when startedAt is far in the past', () => {
    const startedAt = 1_700_000_000_000;
    const now = startedAt + 59 * MIN;
    expect(
      resolveExamClockOffsetMillis({ startedAtMillis: startedAt, nowMillis: now, isResume: true }),
    ).toBe(0);
  });

  it('resume returns 0 even at the exact deadline (no negative-offset resurrection)', () => {
    const startedAt = 1_700_000_000_000;
    const now = startedAt + 60 * MIN;
    expect(
      resolveExamClockOffsetMillis({ startedAtMillis: startedAt, nowMillis: now, isResume: true }),
    ).toBe(0);
  });
});

describe('computeRemainingMillis', () => {
  it('null deadline → null', () => {
    expect(computeRemainingMillis(null, 1_700_000_000_000, 0)).toBeNull();
    expect(computeRemainingMillis(null, 1_700_000_000_000, -20 * MIN)).toBeNull();
  });

  it('computes deadline - (now + offset)', () => {
    const deadline = 1_700_000_000_000 + 60 * MIN;
    expect(computeRemainingMillis(deadline, 1_700_000_000_000, 0)).toBe(60 * MIN);
    // A fresh-start skew of −250ms shifts the displayed remaining
    // by +250ms — the offset is applied, not ignored.
    expect(computeRemainingMillis(deadline, 1_700_000_000_000, -250)).toBe(60 * MIN + 250);
  });

  it('expired (now past deadline) → negative, never clamped to 0', () => {
    const deadline = 1_700_000_000_000;
    expect(computeRemainingMillis(deadline, deadline + 5 * MIN, 0)).toBe(-5 * MIN);
  });

  it('exactly at the deadline → 0', () => {
    const deadline = 1_700_000_000_000;
    expect(computeRemainingMillis(deadline, deadline, 0)).toBe(0);
  });

  it('is pure: repeated calls with advancing now decrease linearly (no drift, no stored state)', () => {
    const deadline = 1_700_000_000_000 + 60 * MIN;
    const first = computeRemainingMillis(deadline, 1_700_000_000_000, 0);
    const second = computeRemainingMillis(deadline, 1_700_000_000_000 + 2 * MIN, 0);
    const third = computeRemainingMillis(deadline, 1_700_000_000_000 + 2 * MIN, 0);
    expect(first).toBe(60 * MIN);
    expect(second).toBe(58 * MIN);
    // Same inputs → same output: nothing accumulated between ticks.
    expect(third).toBe(second);
  });
});

describe('F7 regression: 60-min mock, refresh mid-exam shows REMAINING, not full duration', () => {
  it('refresh at 20 min → 40 min remaining, NOT 60 (fake timers)', () => {
    vi.useFakeTimers();
    const start = new Date('2026-11-23T08:00:00.000Z').getTime();
    vi.setSystemTime(start);
    const deadline = start + 60 * MIN;

    // The student refreshes 20 minutes into the mock.
    vi.advanceTimersByTime(20 * MIN);
    const now = Date.now();

    const offset = resolveExamClockOffsetMillis({
      startedAtMillis: start,
      nowMillis: now,
      isResume: true,
    });
    expect(offset).toBe(0);
    expect(computeRemainingMillis(deadline, now, offset)).toBe(40 * MIN);

    // BEFORE (the bug): the old formula derived the offset from the
    // historical startedAt, so the same inputs displayed the FULL
    // duration. This assertion pins the old value so the test would
    // have FAILED before the fix.
    const buggyOffset = start - now; // −20 min
    expect(computeRemainingMillis(deadline, now, buggyOffset)).toBe(60 * MIN);
  });

  it('refresh at 45 min → 15 min remaining, NOT 60 (ChatGPT item 2)', () => {
    vi.useFakeTimers();
    const start = new Date('2026-11-23T08:00:00.000Z').getTime();
    vi.setSystemTime(start);
    const deadline = start + 60 * MIN;

    vi.advanceTimersByTime(45 * MIN);
    const now = Date.now();

    const offset = resolveExamClockOffsetMillis({
      startedAtMillis: start,
      nowMillis: now,
      isResume: true,
    });
    expect(computeRemainingMillis(deadline, now, offset)).toBe(15 * MIN);

    const buggyOffset = start - now; // −45 min
    expect(computeRemainingMillis(deadline, now, buggyOffset)).toBe(60 * MIN);
  });

  it('refresh at 59 min → 1 min remaining (near-expiry resume)', () => {
    const start = 1_700_000_000_000;
    const deadline = start + 60 * MIN;
    const now = start + 59 * MIN;
    const offset = resolveExamClockOffsetMillis({
      startedAtMillis: start,
      nowMillis: now,
      isResume: true,
    });
    expect(computeRemainingMillis(deadline, now, offset)).toBe(1 * MIN);
  });

  it('tab switch / lock catch-up (ChatGPT items 3–5, math half): advancing now deducts elapsed time', () => {
    // The deadline never pauses: after a 2-min tab switch (or a
    // 5-min minimize / screen lock) the next recomputation from
    // the absolute deadline deducts the elapsed time. The browser
    // half (a real tab throttling) is OWED — see the file header.
    const start = 1_700_000_000_000;
    const deadline = start + 60 * MIN;
    const offset = resolveExamClockOffsetMillis({
      startedAtMillis: start,
      nowMillis: start,
      isResume: true,
    });
    expect(computeRemainingMillis(deadline, start + 2 * MIN, offset)).toBe(58 * MIN);
    expect(computeRemainingMillis(deadline, start + 5 * MIN, offset)).toBe(55 * MIN);
  });

  it('clock change (ChatGPT items 10–11, unit half): display follows the client clock — it cannot enforce', () => {
    // Normal: 15 min left.
    const deadline = 1_700_000_000_000 + 60 * MIN;
    expect(computeRemainingMillis(deadline, deadline - 15 * MIN, 0)).toBe(15 * MIN);
    // Clock moved BACK 10 min: the display shows 25 min — MORE
    // time, because the helper trusts the client clock. This is
    // EXPECTED at this layer: enforcement lives server-side
    // (rules M1-b + the session-submit deadline gate), proven by
    // the emulator tests. A unit test that claimed the helper
    // "rejects" a clock change would be false.
    expect(computeRemainingMillis(deadline, deadline - 25 * MIN, 0)).toBe(25 * MIN);
    // Clock moved FORWARD 10 min: the display shows 5 min — the
    // student loses display time, but the stored deadline (and
    // therefore the server's verdict) is unchanged.
    expect(computeRemainingMillis(deadline, deadline - 5 * MIN, 0)).toBe(5 * MIN);
  });
});
