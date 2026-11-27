/**
 * Quiz Stopwatch Timer — pure logic (wraps the shared timer engine).
 * Pure functions only: no network, no storage, no DOM.
 */
import { formatStopwatch, lapDurations } from './timerEngine';

export { formatStopwatch, lapDurations };

/** A recorded lap: cumulative split + lap duration, both formatted. */
export function describeLaps(splitsMs: number[]): { lap: number; split: string; duration: string }[] {
  const durations = lapDurations(splitsMs);
  return splitsMs.map((split, i) => ({
    lap: i + 1,
    split: formatStopwatch(split),
    duration: formatStopwatch(durations[i]),
  }));
}
