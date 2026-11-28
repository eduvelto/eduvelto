// Eduvelto — Gemini free-tier protection (owner safety rule 3, 28 Nov 2026).
//
// The Gemini free tier is 1,500 requests/day TOTAL, shared by every
// visitor — so the 4 AI tools protect it in the browser, before any
// call reaches the proxy:
//
// (a) PER-USER DAILY LIMIT: 10 AI questions/day, shared across all
//     4 AI tools, kept in localStorage. The limit is checked BEFORE
//     askAssistant() is called, so an over-limit user never burns
//     proxy quota. One "question" = one user action (one summary, one
//     grammar check, one maths problem, one tailored resume, one Q&A
//     question) — a long PDF summary still makes several chunk calls
//     internally, but it costs the user one question.
// (b) RESPONSE CACHING: an identical prompt returns the cached
//     answer with no new API call, and a cache hit does NOT consume
//     the daily budget. Cache lives in the same localStorage blob,
//     capped at the last 20 entries so storage never bloats.
// (c) QUOTA EXHAUSTED — never a red error: the tools show the
//     owner's exact friendly Bangla message (tool count from the
//     LIVE registry, never hardcoded) instead of an error box.
//
// No API key, no secret, no personal data here — the cache holds
// only the user's own prompts and the AI's replies, on their device.
import { askAssistant, type AskOptions, type AskResult, type ProviderId } from './aiProviders';
import { TOOLS_META } from './toolsMeta';

/** Free AI questions per user per day (owner rule 3a). */
export const AI_DAILY_LIMIT = 10;
/** Max cached prompt->reply pairs (owner rule 3b). */
export const AI_CACHE_MAX_ENTRIES = 20;
/** Single localStorage blob for budget + cache. */
export const AI_QUOTA_STORAGE_KEY = 'eduvelto-ai-quota-v1';

export interface AiQuotaCacheEntry {
  hash: string;
  prompt: string;
  reply: string;
  provider: ProviderId;
}

export interface AiQuotaState {
  /** Local YYYY-MM-DD the `used` count belongs to. */
  date: string;
  /** Questions consumed on that date. */
  used: number;
  /** Newest-first is NOT kept — entries are oldest-first, evicted from the front. */
  cache: AiQuotaCacheEntry[];
}

export interface AiQuotaStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 275 -> '২৭৫'. Local copy (other files keep their own). */
export function toBnDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)] ?? d);
}

/** Local calendar date (the user's day, not UTC). */
export function aiTodayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** FNV-1a 32-bit hash, hex — a cache key, not a security hash. */
export function aiPromptHash(prompt: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function emptyAiQuotaState(today: string): AiQuotaState {
  return { date: today, used: 0, cache: [] };
}

function isValidState(value: unknown): value is AiQuotaState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<AiQuotaState>;
  return (
    typeof s.date === 'string' &&
    typeof s.used === 'number' &&
    Number.isFinite(s.used) &&
    s.used >= 0 &&
    Array.isArray(s.cache)
  );
}

/** In-memory fallback when localStorage is unavailable (SSR, tests, blocked storage). */
const memoryQuotaBacking = new Map<string, string>();
const memoryQuotaStore: AiQuotaStore = {
  getItem: (key) => memoryQuotaBacking.get(key) ?? null,
  setItem: (key, value) => {
    memoryQuotaBacking.set(key, value);
  },
};

/** localStorage when available, otherwise the in-memory fallback (never null). */
export function getAiQuotaStore(): AiQuotaStore {
  try {
    const ls = (globalThis as unknown as { localStorage?: AiQuotaStore }).localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
      // Probe: some browsers expose localStorage but throw on access.
      ls.getItem(AI_QUOTA_STORAGE_KEY);
      return ls;
    }
  } catch {
    // Fall through to the in-memory store.
  }
  return memoryQuotaStore;
}

export function loadAiQuotaState(
  store: AiQuotaStore | null = getAiQuotaStore(),
  now: Date = new Date(),
): AiQuotaState {
  const today = aiTodayKey(now);
  if (store === null) return emptyAiQuotaState(today);
  try {
    const raw = store.getItem(AI_QUOTA_STORAGE_KEY);
    if (raw === null) return emptyAiQuotaState(today);
    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return emptyAiQuotaState(today);
    // A new day resets the budget but keeps the cache (replies don't expire).
    if (parsed.date !== today) {
      return { date: today, used: 0, cache: parsed.cache.filter((e) => typeof e?.prompt === 'string') };
    }
    return {
      date: parsed.date,
      used: Math.min(Math.floor(parsed.used), AI_DAILY_LIMIT),
      cache: parsed.cache.filter((e) => typeof e?.prompt === 'string'),
    };
  } catch {
    return emptyAiQuotaState(today);
  }
}

export function saveAiQuotaState(
  state: AiQuotaState,
  store: AiQuotaStore | null = getAiQuotaStore(),
): void {
  if (store === null) return;
  try {
    store.setItem(AI_QUOTA_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — the budget simply isn't persisted;
    // the call still happened, the next check just sees the old count.
  }
}

/** Questions left today (0 when the daily limit is reached). */
export function aiQuotaRemaining(
  store: AiQuotaStore | null = getAiQuotaStore(),
  now: Date = new Date(),
): number {
  const state = loadAiQuotaState(store, now);
  return Math.max(0, AI_DAILY_LIMIT - state.used);
}

/**
 * Spend one daily question. Returns false (and spends nothing) when
 * the day's budget is already used up — callers show the friendly
 * quota message instead of calling the AI.
 */
export function aiConsumeQuestion(
  store: AiQuotaStore | null = getAiQuotaStore(),
  now: Date = new Date(),
): boolean {
  const state = loadAiQuotaState(store, now);
  if (state.used >= AI_DAILY_LIMIT) return false;
  saveAiQuotaState({ ...state, used: state.used + 1 }, store);
  return true;
}

export function aiCacheLookup(
  state: AiQuotaState,
  prompt: string,
): AiQuotaCacheEntry | null {
  const hash = aiPromptHash(prompt);
  for (const entry of state.cache) {
    if (entry.hash === hash && entry.prompt === prompt) return entry;
  }
  return null;
}

/** Store a reply, evicting the oldest entries past the cap. Pure. */
export function aiCacheStore(
  state: AiQuotaState,
  prompt: string,
  reply: string,
  provider: ProviderId,
): AiQuotaState {
  const hash = aiPromptHash(prompt);
  const cache = state.cache.filter((e) => !(e.hash === hash && e.prompt === prompt));
  cache.push({ hash, prompt, reply, provider });
  while (cache.length > AI_CACHE_MAX_ENTRIES) cache.shift();
  return { ...state, cache };
}

export interface AskAiOptions {
  store?: AiQuotaStore | null;
  /** Test seam: passed through to askAssistant. */
  askOpts?: AskOptions;
  now?: Date;
}

export type AskAiCachedResult = AskResult & { cached: boolean };

/**
 * One AI call with CACHE but NO budget charge (for internal calls
 * inside a single user action, e.g. the PDF summariser's chunk
 * calls — the action itself already spent one question via
 * aiConsumeQuestion()). Identical prompt -> cached reply, no API
 * call. Anything other than a successful AI reply is returned
 * as-is and never cached.
 */
export async function askAiCached(
  prompt: string,
  lang: 'bn' | 'en',
  opts: AskAiOptions = {},
): Promise<AskAiCachedResult> {
  const store = opts.store ?? getAiQuotaStore();
  const state = loadAiQuotaState(store, opts.now);
  const hit = aiCacheLookup(state, prompt);
  if (hit !== null) {
    return { kind: 'ai', text: hit.reply, provider: hit.provider, cached: true };
  }
  const result = await askAssistant([{ role: 'user', text: prompt }], {
    lang,
    ...opts.askOpts,
  });
  if (result.kind === 'ai') {
    saveAiQuotaState(aiCacheStore(state, prompt, result.text, result.provider), store);
  }
  return { ...result, cached: false };
}

/**
 * One user question: cache first (free), then the daily budget,
 * then the API. Returns { result, cached }. A cache hit never
 * consumes budget; an over-limit user never reaches the proxy.
 */
export async function askAiQuestion(
  prompt: string,
  lang: 'bn' | 'en',
  opts: AskAiOptions = {},
): Promise<{ result: AskResult; cached: boolean }> {
  const store = opts.store ?? getAiQuotaStore();
  const state = loadAiQuotaState(store, opts.now);
  if (aiCacheLookup(state, prompt) !== null) {
    const cached = await askAiCached(prompt, lang, opts);
    return { result: cached, cached: true };
  }
  if (!aiConsumeQuestion(store, opts.now)) {
    return { result: { kind: 'quota-exhausted' }, cached: false };
  }
  const called = await askAiCached(prompt, lang, opts);
  return { result: called, cached: called.cached };
}

/**
 * Owner's EXACT quota message (28 Nov 2026, rule 3c) — the tool
 * count comes from the LIVE registry so it stays correct as tools
 * are added. Never shown as a red error.
 */
export function aiQuotaExhaustedMessageBn(): string {
  return `আজকের ফ্রি AI কোটা পূর্ণ হয়েছে, আগামীকাল আবার চেষ্টা করুন বা আমাদের ${toBnDigits(TOOLS_META.length)}টি অফলাইন টুল ব্যবহার করুন।`;
}

/** Short English gloss for the English UI (shown UNDER the Bangla message). */
export function aiQuotaExhaustedMessageEn(): string {
  return `Today's free AI quota is used up — try again tomorrow, or use our ${TOOLS_META.length} offline tools.`;
}
