// Eduvelto — Question Paper Generator: chapter-question cache.
//
// FIRESTORE READ PROTECTION (owner 25 Nov 08:48, BINDING; 50k reads/day
// quota): chapter questions are cached in sessionStorage, keyed per
// chapter (stream/class/subject/chapter), session-scoped, with a
// version key for invalidation — so filtering, re-selecting or
// re-opening a chapter NEVER triggers a duplicate Firestore read.
//
// Caching design (report-back summary):
//   Key:    `eduvelto-qpg-cache:v1:{stream}/{classId}/{subjectId}/{chapterId}`
//   Scope:  sessionStorage (gone when the tab closes) + in-memory
//           fallback when sessionStorage is unavailable (vitest node).
//   Source: TODAY the loader reads the static verified pool
//           (QPG_VERIFIED_POOL — zero Firestore reads at all). When
//           Firestore becomes the source, the fetch plugs into the
//           `else` branch of loadVerifiedChapterQuestions() and the
//           cache-first check in front of it stays unchanged — a
//           chapter fetched once in a session is never fetched again.
//   Invalidation: CACHE_VERSION bump clears every cached chapter
//           (version key `eduvelto-qpg-cache-version`); individual
//           chapters can be cleared with invalidateQpgChapterCache().

import { QPG_VERIFIED_POOL, type QpgQuestion } from './questionPaper';

export const QPG_CACHE_VERSION = 'v1';
const QPG_CACHE_VERSION_KEY = 'eduvelto-qpg-cache-version';
const QPG_CACHE_PREFIX = `eduvelto-qpg-cache:${QPG_CACHE_VERSION}:`;

const memoryStore = new Map<string, string>();
function storageGet(key: string): string | null {
  try {
    if (typeof sessionStorage !== 'undefined') return sessionStorage.getItem(key);
  } catch {
    // fall through to memory
  }
  return memoryStore.get(key) ?? null;
}
function storageSet(key: string, value: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, value);
      return;
    }
  } catch {
    // fall through to memory
  }
  memoryStore.set(key, value);
}
function storageRemove(key: string): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
      return;
    }
  } catch {
    // fall through to memory
  }
  memoryStore.delete(key);
}
function storageKeys(): string[] {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i) ?? '');
    }
  } catch {
    // fall through to memory
  }
  return [...memoryStore.keys()];
}

/** Cache key for one chapter (stream/class/subject/chapter). */
export function qpgCacheKey(
  stream: string,
  classId: string,
  subjectId: string,
  chapterId: string,
): string {
  return `${QPG_CACHE_PREFIX}${stream}/${classId}/${subjectId}/${chapterId}`;
}

/** Version check — a version bump invalidates every cached chapter. */
export function ensureQpgCacheVersion(): void {
  if (storageGet(QPG_CACHE_VERSION_KEY) !== QPG_CACHE_VERSION) {
    for (const key of storageKeys()) {
      if (key.startsWith('eduvelto-qpg-cache:')) storageRemove(key);
    }
    storageSet(QPG_CACHE_VERSION_KEY, QPG_CACHE_VERSION);
  }
}

export function getCachedChapterQuestions(
  stream: string,
  classId: string,
  subjectId: string,
  chapterId: string,
): QpgQuestion[] | null {
  ensureQpgCacheVersion();
  const raw = storageGet(qpgCacheKey(stream, classId, subjectId, chapterId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as QpgQuestion[];
  } catch {
    return null;
  }
}

export function setCachedChapterQuestions(
  stream: string,
  classId: string,
  subjectId: string,
  chapterId: string,
  questions: QpgQuestion[],
): void {
  ensureQpgCacheVersion();
  storageSet(qpgCacheKey(stream, classId, subjectId, chapterId), JSON.stringify(questions));
}

export function invalidateQpgChapterCache(
  stream?: string,
  classId?: string,
  subjectId?: string,
  chapterId?: string,
): void {
  if (stream && classId && subjectId && chapterId) {
    storageRemove(qpgCacheKey(stream, classId, subjectId, chapterId));
    return;
  }
  for (const key of storageKeys()) {
    if (key.startsWith(QPG_CACHE_PREFIX)) storageRemove(key);
  }
}

/** Cache-first chapter loader. The page calls this (never the raw
 *  pool) when (re-)selecting chapters. TODAY the miss branch reads
 *  the static verified pool — zero Firestore reads. The Firestore
 *  fetch for verified chapters plugs into the miss branch later; the
 *  cache-first check in front of it means a chapter fetched once per
 *  session is never fetched again. */
export function loadVerifiedChapterQuestions(args: {
  stream: string;
  classId: string;
  subjectId: string;
  chapterId: string;
}): QpgQuestion[] {
  const cached = getCachedChapterQuestions(args.stream, args.classId, args.subjectId, args.chapterId);
  if (cached !== null) return cached;
  // MISS — source today: the static verified pool (no Firestore).
  // FUTURE: replace this filter with the Firestore chapter fetch
  // (verified-only query); the cache above stays in front of it.
  const fresh = QPG_VERIFIED_POOL.filter((q) => q.chapterId === args.chapterId);
  setCachedChapterQuestions(args.stream, args.classId, args.subjectId, args.chapterId, fresh);
  return fresh;
}
