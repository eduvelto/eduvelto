// Eduvelto — client-side abuse guards (Scale/10k).
//
// Server-side rate limiting needs Cloud Functions, which needs Blaze —
// that is a follow-up needing the owner's approval (see the scalability
// report). What CAN be done for free, on Spark, is client-side:
//
// 1. dedupeInFlight — two identical concurrent calls share one promise,
//    so a double-click or a double-render can never issue the same write
//    twice. Same key + same arguments = the same effect, so sharing the
//    promise cannot change the result. (The UI buttons already have busy
//    guards; this is defence-in-depth at the lib layer.)
// 2. throttle — a minimum interval between repeated calls of the same
//    action; calls inside the interval resolve with the last result
//    instead of firing another write. Only for actions that are safe to
//    coalesce (never for quiz submits or payments).
//
// These guards never drop a DISTINCT action: different keys, different
// arguments, or calls after the interval always run.

const inflight = new Map<string, Promise<unknown>>();

/**
 * Run `fn` once per key while it is in flight; concurrent callers with
 * the same key get the same promise. A failed call is not remembered.
 */
export async function dedupeInFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const promise = (async () => {
    try {
      return await fn();
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

interface ThrottleState {
  lastRun: number;
  lastResult: unknown;
}

/**
 * Return a throttled version of `fn`: calls within `intervalMs` of the
 * last run return the last result without calling `fn` again.
 */
export function throttle<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  intervalMs: number,
): T {
  const state: ThrottleState = { lastRun: 0, lastResult: undefined };
  return (async (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - state.lastRun < intervalMs) return state.lastResult;
    state.lastRun = now;
    state.lastResult = await fn(...args);
    return state.lastResult;
  }) as T;
}
