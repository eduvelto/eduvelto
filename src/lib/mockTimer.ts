// Eduvelto — timed-mock countdown helpers (Step 19 F7 fix).
//
// Pure functions only — no Firestore, no React, no Date.now()
// inside, so the resume math is unit-testable in isolation.
//
// THE BUG THEY FIX: JobMockPage.enterExam used to measure the
// client↔server clock offset as `startedAtMillis - Date.now()` on
// BOTH fresh start and resume. On resume `startedAtMillis` is the
// ORIGINAL start time read back from the stored session doc, so
// the offset became −(elapsed time) and the displayed remaining
// time became the FULL duration again (60-min mock, refresh at
// 20 min → displayed 60, true remaining 40). A past startedAt
// cannot measure the CURRENT clock skew. The stored deadline
// (endsAt) was always restored correctly — only the displayed
// countdown was wrong, which also made auto-submit fire late.
//
// THE FIX: measure the offset ONLY at fresh start, when
// startedAt ≈ now (startMockSession returns Date.now()), and use
// offset 0 on resume (trust the client clock for display). The
// stored deadline stays authoritative and the Firestore rules
// enforce it server-side at attempt create, so display skew can
// never extend the exam.

/**
 * Resolve the client↔server clock offset (ms) for an exam entry.
 *
 * - Fresh start (`isResume: false`): `startedAtMillis` was just
 *   produced on this client (~now), so `startedAtMillis -
 *   nowMillis` (≈ 0, minus read-back latency) is a valid skew
 *   measurement.
 * - Resume (`isResume: true`): `startedAtMillis` is the historical
 *   session start (minutes ago). It says nothing about the current
 *   clock skew, so the offset is 0 — the countdown runs on the
 *   client clock against the stored deadline.
 */
export function resolveExamClockOffsetMillis(args: {
  startedAtMillis: number;
  nowMillis: number;
  isResume: boolean;
}): number {
  if (args.isResume) return 0;
  return args.startedAtMillis - args.nowMillis;
}

/**
 * Remaining time (ms) against an absolute deadline, adjusted for
 * the measured clock offset. Returns `null` when no deadline is
 * known yet (the caller then shows '—' / falls back).
 */
export function computeRemainingMillis(
  deadlineMillis: number | null,
  nowMillis: number,
  offsetMillis: number,
): number | null {
  if (deadlineMillis === null) return null;
  return deadlineMillis - (nowMillis + offsetMillis);
}
