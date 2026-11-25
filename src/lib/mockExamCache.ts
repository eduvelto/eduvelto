// Eduvelto — General Mock Exam bundle cache (7-day sprint, Day 5).
//
// Question bundles for the general mock runner (/mock-exam) are
// cached client-side so a re-attempt reuses the bundle instead of
// re-reading Firestore. IndexedDB is primary; sessionStorage is
// the fallback; an in-memory Map is the last resort (node /
// private mode where neither storage exists).
//
// SECURITY — the cache holds QUESTION TEXT + OPTIONS ONLY. It
// NEVER holds an answer key: keys are loaded only after submit
// (loadMockKeyAfterSubmit in ./mockExam) and are never passed
// here — buildMockBundleCacheRecord() strips everything except
// the whitelisted display fields, so even a caller that hands
// over a key-bearing object cannot smuggle answers into the
// cache. A student opening DevTools sees the same questions
// they are already answering — never the answers.
//
// VERSIONING — the cache key includes the bundle version
// (`mock-exam-bundle:<bundleId>:v<bundleVersion>`). A lookup
// for a version that does not match the stored record returns
// null and drops the stale entry: a republished bundle is never
// served stale, and a re-attempt on the SAME version is a pure
// cache hit (no Firestore read).

export interface CachedMockBundleQuestion {
  n: number;
  questionId: string;
  topicId: string;
  subjectId: string;
  questionText: string;
  options: Array<{ letter: 'A' | 'B' | 'C' | 'D'; text: string }>;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CachedMockBundle {
  cacheKey: string;
  bundleId: string;
  bundleVersion: number;
  titleBn: string;
  titleEn: string;
  examSlug: string;
  questionCount: number;
  questions: CachedMockBundleQuestion[];
  cachedAt: number;
}

export const MOCK_EXAM_CACHE_DB = 'eduvelto-mock-exam';
export const MOCK_EXAM_CACHE_STORE = 'bundles';
export const MOCK_EXAM_CACHE_VERSION = 1;

/** Cache key for one bundle generation. */
export function mockBundleCacheKey(bundleId: string, bundleVersion: number): string {
  return `mock-exam-bundle:${bundleId}:v${bundleVersion}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Build the storable record from a bundle-like object. Only the
 * whitelisted display fields survive — `correctLetter`,
 * `correctText`, `explanation`, `key`, `answers` and anything
 * else key-like is dropped, never stored. Returns null when the
 * input has no usable questions.
 */
export function buildMockBundleCacheRecord(input: {
  docId: string;
  bundleVersion: number;
  titleBn: string;
  titleEn: string;
  examSlug: string;
  questions: Array<Record<string, unknown>>;
}): CachedMockBundle | null {
  const questions: CachedMockBundleQuestion[] = [];
  for (const q of input.questions) {
    if (!Number.isInteger(q.n) || typeof q.questionId !== 'string' || typeof q.questionText !== 'string') continue;
    if (!Array.isArray(q.options)) continue;
    const options: CachedMockBundleQuestion['options'] = [];
    let usable = true;
    for (const o of q.options as unknown[]) {
      if (!isRecord(o) || !['A', 'B', 'C', 'D'].includes(String(o.letter)) || typeof o.text !== 'string') {
        usable = false;
        break;
      }
      options.push({ letter: o.letter as 'A' | 'B' | 'C' | 'D', text: o.text });
    }
    if (!usable || options.length < 2) continue;
    questions.push({
      n: q.n as number,
      questionId: q.questionId as string,
      topicId: typeof q.topicId === 'string' ? q.topicId : '',
      subjectId: typeof q.subjectId === 'string' ? q.subjectId : '',
      questionText: q.questionText as string,
      options,
      difficulty: q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
        ? q.difficulty
        : 'medium',
    });
  }
  if (questions.length === 0) return null;
  return {
    cacheKey: mockBundleCacheKey(input.docId, input.bundleVersion),
    bundleId: input.docId,
    bundleVersion: input.bundleVersion,
    titleBn: input.titleBn,
    titleEn: input.titleEn,
    examSlug: input.examSlug,
    questionCount: questions.length,
    questions,
    cachedAt: Date.now(),
  };
}

function isCachedMockBundle(v: unknown): v is CachedMockBundle {
  if (!isRecord(v)) return false;
  return (
    typeof v.cacheKey === 'string'
    && typeof v.bundleId === 'string'
    && Number.isInteger(v.bundleVersion)
    && typeof v.titleBn === 'string'
    && Array.isArray(v.questions)
    && v.questions.length > 0
  );
}

/* ------------------------------------------------------------------ */
/* Backends: IndexedDB → sessionStorage → in-memory                  */
/* ------------------------------------------------------------------ */

const memoryFallback = new Map<string, CachedMockBundle>();

function sessionStore(): Storage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function indexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MOCK_EXAM_CACHE_DB, MOCK_EXAM_CACHE_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(MOCK_EXAM_CACHE_STORE)) {
        req.result.createObjectStore(MOCK_EXAM_CACHE_STORE, { keyPath: 'cacheKey' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function idbTx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(MOCK_EXAM_CACHE_STORE, mode);
        const req = run(tx.objectStore(MOCK_EXAM_CACHE_STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      }),
  );
}

async function idbGet(key: string): Promise<CachedMockBundle | null> {
  const v = await idbTx('readonly', (s) => s.get(key));
  return isCachedMockBundle(v) ? v : null;
}

async function idbPut(record: CachedMockBundle): Promise<void> {
  await idbTx('readwrite', (s) => s.put(record));
}

async function idbDelete(key: string): Promise<void> {
  await idbTx('readwrite', (s) => s.delete(key));
}

async function idbClear(): Promise<void> {
  await idbTx('readwrite', (s) => s.clear());
}

function sessionKey(cacheKey: string): string {
  return `eduvelto:${cacheKey}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Save a bundle (questions only, never keys) to the cache. */
export async function saveMockBundle(record: CachedMockBundle): Promise<void> {
  if (indexedDbAvailable()) {
    try {
      await idbPut(record);
      return;
    } catch {
      // Fall through to sessionStorage — a full/blocked IDB
      // must never block the exam.
    }
  }
  const store = sessionStore();
  if (store) {
    try {
      store.setItem(sessionKey(record.cacheKey), JSON.stringify(record));
      return;
    } catch {
      // Quota/full — fall through to memory.
    }
  }
  memoryFallback.set(record.cacheKey, record);
}

/**
 * Load a cached bundle for one exact generation. Returns null
 * when there is no entry OR the stored version differs (stale
 * cache is invalidated on read — the stale entry is dropped).
 * A hit means the runner reuses the bundle with NO Firestore read.
 */
export async function loadCachedMockBundle(
  bundleId: string,
  bundleVersion: number,
): Promise<CachedMockBundle | null> {
  const key = mockBundleCacheKey(bundleId, bundleVersion);
  let found: CachedMockBundle | null = null;
  if (indexedDbAvailable()) {
    try {
      found = await idbGet(key);
    } catch {
      found = null;
    }
  }
  if (!found) {
    const store = sessionStore();
    if (store) {
      try {
        const raw = store.getItem(sessionKey(key));
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          found = isCachedMockBundle(parsed) ? parsed : null;
        }
      } catch {
        found = null;
      }
    }
  }
  if (!found) found = memoryFallback.get(key) ?? null;
  if (!found) return null;
  if (found.bundleId !== bundleId || found.bundleVersion !== bundleVersion) {
    await invalidateMockBundle(bundleId, bundleVersion).catch(() => undefined);
    return null;
  }
  return found;
}

/** Drop one cached generation (best-effort, never throws). */
export async function invalidateMockBundle(bundleId: string, bundleVersion: number): Promise<void> {
  const key = mockBundleCacheKey(bundleId, bundleVersion);
  if (indexedDbAvailable()) {
    try {
      await idbDelete(key);
    } catch {
      // Fall through — the other backends are cleared below.
    }
  }
  const store = sessionStore();
  if (store) {
    try {
      store.removeItem(sessionKey(key));
    } catch {
      // Ignore — memory is cleared below.
    }
  }
  memoryFallback.delete(key);
}

/** Drop every cached mock bundle (best-effort, never throws). */
export async function clearMockExamCache(): Promise<void> {
  if (indexedDbAvailable()) {
    try {
      await idbClear();
    } catch {
      // Fall through.
    }
  }
  const store = sessionStore();
  if (store) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k && k.startsWith('eduvelto:mock-exam-bundle:')) doomed.push(k);
      }
      for (const k of doomed) store.removeItem(k);
    } catch {
      // Ignore.
    }
  }
  memoryFallback.clear();
}
