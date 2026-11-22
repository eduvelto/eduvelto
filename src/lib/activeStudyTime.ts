// Eduvelto — honest active study-time tracking (Step 12).
//
// WHY: the practice/mock engines used to record per-question
// time from wall-clock flushes (JobPracticePage / JobMockPage
// flushTime: Date.now() - startedAt) with NO pause — a tab left
// open for hours, or a student who walked away mid-question,
// had all that idle time stored as timeSpentSeconds. The
// dashboard therefore showed sessions + questions, never
// invented minutes (Step 11). This clock fixes the RECORDING
// going forward; it does NOT rewrite any historical stored
// value, and the result page's time display is NOT relabelled
// (a pre-fix attempt cannot be distinguished from a post-fix
// one, so no new claim is made about old data).
//
// WHAT COUNTS AS ACTIVE (reconciled from both Step 12
// consultations — see team/job-step12-planner-2026-11-23.md):
//   - the tab is visible (document.visibilitychange) AND the
//     window is focused, AND
//   - the student interacted recently (pointerdown / keydown /
//     scroll / touchstart).
// The clock pauses IMMEDIATELY when the tab hides or the window
// blurs (exact — zero grace), and pauses when no interaction
// has happened for ACTIVE_IDLE_TIMEOUT_MS. The timeout is 90
// seconds: the top of the Step 11 finding's 60–90s range.
// Gemini suggested 3–5 min (that would credit up to 5 idle
// minutes per question); ChatGPT suggested 2 min and noted
// reading-without-interacting IS studying — the 90s credit
// window plus scroll-as-interaction bounds that undercount:
// a reader scrolls, and a quiet stretch is still credited up
// to 90s. ChatGPT's "I'm reading" mode is a follow-up, not
// built here. The exam DEADLINE never pauses — only this
// informational per-question clock does (the mock's timer is
// server-authoritative, design §3.5 flow 7).
//
// HOW IT COUNTS: segments, never a running setInterval
// increment (ChatGPT: never trust a continuously running JS
// timer — termination, sleep and clock jumps break it). Each
// flush() returns the whole active seconds accrued since the
// last flush and restarts the clock. A segment is capped at
// lastInteraction + timeout, so a suspended laptop can add at
// most 90s to one question. Deltas < 0 (clock skew) are
// discarded. Multi-tab double-counting (Gemini's
// BroadcastChannel idea) is NOT built: the session autosave's
// revision guard already prevents two tabs writing the same
// session concurrently, and cross-tab coordination is an edge
// case beyond this step — recorded as a known limitation.
//
// STORAGE: the clock writes NOTHING itself. The pages keep
// calling flushTime() on navigation/submit exactly as before;
// the existing debounced session autosave (1200ms) is the
// checkpoint mechanism — no new collection, no new rule, no
// studyDays/studySessions subcollection (both consultations'
// new-collection ideas are DEFERRED — see the report; the
// compiled-rules margin on main is 1,138 bytes).

import { useEffect, useRef } from 'react';

/** Inactivity pause: no interaction for this long parks the
 * clock (reconciled — see the header). */
export const ACTIVE_IDLE_TIMEOUT_MS = 90_000;

/** The active clock: plain state + pure time math, no React,
 * so the behaviour is unit-testable without a DOM. All times
 * are Date.now() millis supplied by the caller. */
export interface ActiveClock {
  /** Start (or restart) the clock for a question. */
  start(nowMs: number): void;
  /** Record user interaction; resumes an idle-paused clock. */
  interact(nowMs: number): void;
  /** Pause immediately (tab hidden / window blurred). */
  pause(nowMs: number): void;
  /** Resume after a pause (tab visible / window focused). */
  resume(nowMs: number): void;
  /** Whole active seconds accrued since the last flush (0
   * when nothing accrued); restarts the clock when active. */
  flush(nowMs: number): number;
  /** True while the clock is parked (hidden or idle). */
  isPaused(): boolean;
}

type PauseReason = 'hidden' | 'idle' | null;

export function createActiveClock(): ActiveClock {
  let startedAt: number | null = null;
  let pendingMs = 0;
  let lastInteractionAt = 0;
  let pausedReason: PauseReason = null;

  /** Active millis from startedAt up to nowMs, capped at the
   * last interaction + timeout; 0 when parked. */
  function accrueUpTo(nowMs: number): number {
    if (startedAt === null) return 0;
    const end = Math.min(nowMs, lastInteractionAt + ACTIVE_IDLE_TIMEOUT_MS);
    return Math.max(0, end - startedAt);
  }

  return {
    start(nowMs: number): void {
      startedAt = nowMs;
      lastInteractionAt = nowMs;
      pendingMs = 0;
      pausedReason = null;
    },

    interact(nowMs: number): void {
      lastInteractionAt = nowMs;
      // Only an idle pause resumes on interaction: a
      // hidden-tab pause resumes on visibilitychange/focus.
      if (pausedReason === 'idle') {
        startedAt = nowMs;
        pausedReason = null;
      }
    },

    pause(nowMs: number): void {
      if (startedAt === null) return;
      pendingMs += accrueUpTo(nowMs);
      startedAt = null;
      pausedReason = 'hidden';
    },

    resume(nowMs: number): void {
      if (pausedReason === null) return;
      startedAt = nowMs;
      lastInteractionAt = nowMs;
      pausedReason = null;
    },

    flush(nowMs: number): number {
      let totalMs = pendingMs;
      if (startedAt !== null) {
        totalMs += accrueUpTo(nowMs);
        if (nowMs - lastInteractionAt > ACTIVE_IDLE_TIMEOUT_MS) {
          // Idle — the segment ended at lastInteraction +
          // timeout; park the clock until the student returns.
          startedAt = null;
          pausedReason = 'idle';
        } else {
          startedAt = nowMs;
        }
      }
      pendingMs = 0;
      return Math.max(0, Math.round(totalMs / 1000));
    },

    isPaused(): boolean {
      return startedAt === null;
    },
  };
}

/** React binding: one clock per page mount, with the
 * visibility / focus / interaction listeners attached once.
 * Safe under StrictMode (listeners are removed on cleanup). */
export function useActiveClock(): ActiveClock {
  const ref = useRef<ActiveClock | null>(null);
  if (ref.current === null) ref.current = createActiveClock();

  useEffect(() => {
    const clock = ref.current as ActiveClock;
    const onVisibility = (): void => {
      if (document.hidden) clock.pause(Date.now());
      else clock.resume(Date.now());
    };
    const onBlur = (): void => clock.pause(Date.now());
    const onFocus = (): void => clock.resume(Date.now());
    const onInteract = (): void => clock.interact(Date.now());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pointerdown', onInteract, { passive: true });
    window.addEventListener('keydown', onInteract);
    window.addEventListener('scroll', onInteract, { passive: true });
    window.addEventListener('touchstart', onInteract, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, []);

  return ref.current;
}
