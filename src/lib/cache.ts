// Eduvelto — client-side session cache + request dedupe (Scale/10k).
//
// Why: the app's reference data (books, directory rows, quiz lists) is
// stable within a session — it changes only when the loader publishes
// new content, not while a student browses. Re-reading the full list on
// every navigation (Home -> Library -> Home, or Subject -> Subject) burns
// hundreds of Firestore reads per visit for identical data.
//
// What this does:
// - In-memory cache with a TTL (default 10 minutes) per key. Data older
//   than the TTL is refetched, so a newly published book appears within
//   minutes, never hours.
// - In-flight dedupe: two identical calls made while the first is still
//   running share ONE promise (one Firestore read, not two).
// - Explicit invalidation: callers that change the underlying data
//   (admin publish flows) call `invalidateCache(key)` afterwards.
//
// What this does NOT do:
// - It never caches per-user data (progress, attempts, bookmarks, profile)
//   — that data changes on every action and must always be fresh.
// - It never persists to localStorage/sessionStorage: a stale cache must
//   not survive a reload, and reference data is cheap to refetch once.
// - It never hides a failed fetch: on error the entry is dropped, so the
//   next call retries instead of serving an error forever.

export interface CacheEntry<T> {
  value: T;
  at: number;
}

const entries = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const DEFAULT_TTL_MS = 10 * 60 * 1000;

function isFresh<T>(entry: CacheEntry<T> | undefined, ttlMs: number): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.at < ttlMs;
}

/**
 * Return the cached value for `key` when fresh, otherwise run `fetcher`
 * once (concurrent callers share the same in-flight promise) and cache
 * the result. A failed fetch is never cached.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = entries.get(key) as CacheEntry<T> | undefined;
  if (isFresh(hit, ttlMs)) return hit.value;
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const promise = (async () => {
    try {
      const value = await fetcher();
      entries.set(key, { value, at: Date.now() });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

/** Drop one cached key (e.g. after an admin publishes new content). */
export function invalidateCache(key: string): void {
  entries.delete(key);
  inflight.delete(key);
}

/** Drop everything (e.g. on sign-out, so the next user never sees the last user's lists). */
export function clearCache(): void {
  entries.clear();
  inflight.clear();
}

// Stable keys for the reference lists the app re-reads on navigation.
export const CACHE_KEYS = {
  publishedBooks: 'books:published',
  publishedDirectory: 'directory:published',
  publishedQuizzes: 'quizzes:published',
} as const;
