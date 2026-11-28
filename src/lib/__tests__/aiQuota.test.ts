// Eduvelto — Gemini free-tier protection tests (owner rule 3, 28 Nov 2026).
import { describe, expect, it } from 'vitest';
import {
  AI_CACHE_MAX_ENTRIES,
  AI_DAILY_LIMIT,
  aiCacheLookup,
  aiCacheStore,
  aiConsumeQuestion,
  aiPromptHash,
  aiQuotaExhaustedMessageBn,
  aiQuotaExhaustedMessageEn,
  aiQuotaRemaining,
  aiTodayKey,
  askAiCached,
  askAiQuestion,
  emptyAiQuotaState,
  loadAiQuotaState,
  saveAiQuotaState,
  toBnDigits,
  type AiQuotaStore,
} from '../aiQuota';
import { TOOLS_META } from '../toolsMeta';

function makeStore(): AiQuotaStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

/** Stub fetch counting calls; always answers like the Gemini proxy. */
function stubFetch(reply: string, counter: { calls: number }) {
  return (async () => {
    counter.calls += 1;
    return {
      status: 200,
      ok: true,
      json: async () => ({ reply, provider: 'gemini' }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

describe('aiPromptHash + toBnDigits', () => {
  it('hashes deterministically and differs per prompt', () => {
    expect(aiPromptHash('hello')).toBe(aiPromptHash('hello'));
    expect(aiPromptHash('hello')).not.toBe(aiPromptHash('hello!'));
    expect(aiPromptHash('hello')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('converts digits to Bangla', () => {
    expect(toBnDigits(275)).toBe('২৭৫');
    expect(toBnDigits(10)).toBe('১০');
  });
});

describe('budget (10/day, shared)', () => {
  it('starts at 10, spends one per consume, refuses the 11th', () => {
    const store = makeStore();
    expect(aiQuotaRemaining(store)).toBe(10);
    for (let i = 0; i < 10; i++) expect(aiConsumeQuestion(store)).toBe(true);
    expect(aiQuotaRemaining(store)).toBe(0);
    expect(aiConsumeQuestion(store)).toBe(false);
    expect(aiQuotaRemaining(store)).toBe(0);
  });

  it('resets on a new day but keeps the cache', () => {
    const store = makeStore();
    const today = new Date(2026, 10, 28);
    const tomorrow = new Date(2026, 10, 29);
    for (let i = 0; i < 10; i++) expect(aiConsumeQuestion(store, today)).toBe(true);
    expect(aiQuotaRemaining(store, today)).toBe(0);
    expect(aiQuotaRemaining(store, tomorrow)).toBe(10);
    expect(loadAiQuotaState(store, tomorrow).date).toBe('2026-11-29');
  });

  it('recovers from corrupt stored JSON', () => {
    const store = makeStore();
    store.setItem('eduvelto-ai-quota-v1', 'not json{');
    expect(aiQuotaRemaining(store)).toBe(10);
    expect(loadAiQuotaState(store).used).toBe(0);
  });
});

describe('cache (last 20, prompt-keyed)', () => {
  it('stores and finds a reply, and ignores a different prompt', () => {
    const state = emptyAiQuotaState(aiTodayKey());
    const stored = aiCacheStore(state, 'prompt A', 'reply A', 'gemini');
    expect(aiCacheLookup(stored, 'prompt A')?.reply).toBe('reply A');
    expect(aiCacheLookup(stored, 'prompt B')).toBeNull();
  });

  it('evicts the oldest entry past 20', () => {
    let state = emptyAiQuotaState(aiTodayKey());
    for (let i = 0; i < AI_CACHE_MAX_ENTRIES + 1; i++) {
      state = aiCacheStore(state, `prompt ${i}`, `reply ${i}`, 'gemini');
    }
    expect(state.cache).toHaveLength(20);
    expect(aiCacheLookup(state, 'prompt 0')).toBeNull();
    expect(aiCacheLookup(state, `prompt ${AI_CACHE_MAX_ENTRIES}`)?.reply).toBe(
      `reply ${AI_CACHE_MAX_ENTRIES}`,
    );
  });

  it('round-trips through save/load', () => {
    const store = makeStore();
    const state = aiCacheStore(emptyAiQuotaState(aiTodayKey()), 'p', 'r', 'gemini');
    saveAiQuotaState({ ...state, used: 3 }, store);
    const loaded = loadAiQuotaState(store);
    expect(loaded.used).toBe(3);
    expect(aiCacheLookup(loaded, 'p')?.reply).toBe('r');
  });
});

describe('askAiCached (cache-first, no budget)', () => {
  it('calls the API once for a prompt, then serves the cache without a second call', async () => {
    const store = makeStore();
    const counter = { calls: 0 };
    const askOpts = { proxyUrl: 'https://proxy.test', fetchImpl: stubFetch('cached reply', counter) };
    const first = await askAiCached('same prompt', 'en', { store, askOpts });
    expect(first.kind).toBe('ai');
    expect(first.cached).toBe(false);
    expect(counter.calls).toBe(1);
    expect(aiQuotaRemaining(store)).toBe(10); // cache path never spends budget
    const second = await askAiCached('same prompt', 'en', { store, askOpts });
    expect(second.cached).toBe(true);
    if (second.kind === 'ai') expect(second.text).toBe('cached reply');
    expect(counter.calls).toBe(1);
    expect(aiQuotaRemaining(store)).toBe(10);
  });
});

describe('askAiQuestion (cache -> budget -> API)', () => {
  it('spends one question per new prompt and zero for a cached repeat', async () => {
    const store = makeStore();
    const counter = { calls: 0 };
    const askOpts = { proxyUrl: 'https://proxy.test', fetchImpl: stubFetch('answer', counter) };
    const first = await askAiQuestion('q1', 'en', { store, askOpts });
    expect(first.result.kind).toBe('ai');
    expect(first.cached).toBe(false);
    expect(aiQuotaRemaining(store)).toBe(9);
    const repeat = await askAiQuestion('q1', 'en', { store, askOpts });
    expect(repeat.cached).toBe(true);
    expect(counter.calls).toBe(1);
    expect(aiQuotaRemaining(store)).toBe(9);
  });

  it('returns quota-exhausted without calling the API once the day is spent', async () => {
    const store = makeStore();
    const counter = { calls: 0 };
    const askOpts = { proxyUrl: 'https://proxy.test', fetchImpl: stubFetch('answer', counter) };
    for (let i = 0; i < AI_DAILY_LIMIT; i++) {
      const r = await askAiQuestion(`distinct prompt ${i}`, 'en', { store, askOpts });
      expect(r.result.kind).toBe('ai');
    }
    expect(counter.calls).toBe(10);
    const over = await askAiQuestion('one more question', 'en', { store, askOpts });
    expect(over.result.kind).toBe('quota-exhausted');
    expect(counter.calls).toBe(10); // no 11th API call
  });
});

describe('quota message (owner exact wording, live registry count)', () => {
  it('uses the exact Bangla message with the live tool count', () => {
    const expected = `আজকের ফ্রি AI কোটা পূর্ণ হয়েছে, আগামীকাল আবার চেষ্টা করুন বা আমাদের ${toBnDigits(TOOLS_META.length)}টি অফলাইন টুল ব্যবহার করুন।`;
    expect(aiQuotaExhaustedMessageBn()).toBe(expected);
    // The count is never hardcoded — it follows the live registry.
    expect(aiQuotaExhaustedMessageBn()).toContain(`${toBnDigits(TOOLS_META.length)}টি অফলাইন টুল`);
  });

  it('adds a short English gloss with the same live count', () => {
    expect(aiQuotaExhaustedMessageEn()).toContain(`${TOOLS_META.length} offline tools`);
    expect(aiQuotaExhaustedMessageEn()).toContain("Today's free AI quota is used up");
  });
});
