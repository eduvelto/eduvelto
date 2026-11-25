// Smart Engine progress pacing (sprint Day 4, 26 Nov 2026).
//
// The progress screen must be visible for at least ~2 seconds total
// and every phase must actually be seen — the Day 2 version set
// 'selecting' then 'building' synchronously in the same handler, so
// React batched them and 'selecting' likely never painted, and a
// small paper could flash the whole screen away in under a second.
//
// Rule (binding): a phase advances ONLY after its real work is done
// AND its minimum dwell has elapsed — never on a timer alone. The
// helpers below only compute / wait out the *remaining* dwell after
// real work; the page awaits them between the real steps
// (ordering -> buildQpgPaper -> renderPaperCanvases callbacks).
// There is no fake animation here, and the screen label stays
// 'Smart Engine' only.

/** Minimum total time the progress screen stays visible (ms). */
export const GEN_PROGRESS_MIN_TOTAL_MS = 2000;

/** Minimum time each phase ('selecting' / 'building' / 'rendering')
//  stays visible once its real work has finished (ms). Three phases
//  x 600ms = 1800ms, so the 2000ms total gate always adds the rest. */
export const GEN_PROGRESS_MIN_PHASE_MS = 600;

/** ms still to wait before leaving a phase that started at
 *  `phaseStartedAtMs`, observed at `nowMs`. Never negative. */
export function genProgressPhaseWaitMs(
  phaseStartedAtMs: number,
  nowMs: number = Date.now(),
  minPhaseMs: number = GEN_PROGRESS_MIN_PHASE_MS,
): number {
  return Math.max(0, phaseStartedAtMs + minPhaseMs - nowMs);
}

/** ms still to wait before the progress screen may close, given the
 *  run started at `startedAtMs`, observed at `nowMs`. Never negative. */
export function genProgressTotalWaitMs(
  startedAtMs: number,
  nowMs: number = Date.now(),
  minTotalMs: number = GEN_PROGRESS_MIN_TOTAL_MS,
): number {
  return Math.max(0, startedAtMs + minTotalMs - nowMs);
}

/** Resolve after `ms` (immediately when `ms` is 0). */
export function sleepMs(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Wait out the remaining dwell of a phase whose real work is done.
//  Returns immediately when the dwell already elapsed (slow real
//  work) — the timer never extends real work, it only guarantees
//  the phase was visible long enough to be seen. */
export async function waitGenProgressPhase(
  phaseStartedAtMs: number,
  nowMs: number = Date.now(),
  minPhaseMs: number = GEN_PROGRESS_MIN_PHASE_MS,
): Promise<void> {
  await sleepMs(genProgressPhaseWaitMs(phaseStartedAtMs, nowMs, minPhaseMs));
}

/** Wait out the remaining time until the progress screen has been
 *  visible for at least the minimum total. Returns immediately when
 *  the run already took that long. */
export async function waitGenProgressTotal(
  startedAtMs: number,
  nowMs: number = Date.now(),
  minTotalMs: number = GEN_PROGRESS_MIN_TOTAL_MS,
): Promise<void> {
  await sleepMs(genProgressTotalWaitMs(startedAtMs, nowMs, minTotalMs));
}

/** Wait until BOTH the current phase's dwell AND the run's minimum
 *  total have elapsed (used when closing the screen, so a fast
 *  render still leaves the last phase visible). */
export async function waitGenProgressClose(
  phaseStartedAtMs: number,
  startedAtMs: number,
  nowMs: number = Date.now(),
): Promise<void> {
  await sleepMs(
    Math.max(
      genProgressPhaseWaitMs(phaseStartedAtMs, nowMs),
      genProgressTotalWaitMs(startedAtMs, nowMs),
    ),
  );
}
