// Unit tests — AI provider abstraction (./aiProviders.ts).
// The client contract is tested with a stub fetch against a test-only
// proxy URL passed through AskOptions. No real AI is called, no key
// exists anywhere in these tests, and no live provider is contacted.

import { describe, it, expect, vi } from 'vitest';
import {
  PROVIDER_DESCRIPTORS,
  PRIMARY_PROVIDER_ID,
  FALLBACK_PROVIDER_ID,
  getProviderStatus,
  askAssistant,
  type ChatMessage,
} from '../aiProviders';

const TEST_PROXY = 'https://proxy.example.test';

function stubFetch(response: { status: number; body: unknown }): typeof fetch {
  return vi.fn(async () => {
    const body = response.body;
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => body,
    } as Response;
  }) as unknown as typeof fetch;
}

describe('provider descriptors', () => {
  it('lists Gemini as primary and Groq as fallback, both free with no card', () => {
    const gemini = PROVIDER_DESCRIPTORS.find((p) => p.id === 'gemini');
    const groq = PROVIDER_DESCRIPTORS.find((p) => p.id === 'groq');
    expect(gemini?.role).toBe('primary');
    expect(gemini?.freeTier).toBe(true);
    expect(gemini?.needsCardForFree).toBe(false);
    expect(groq?.role).toBe('fallback');
    expect(groq?.freeTier).toBe(true);
    expect(PRIMARY_PROVIDER_ID).toBe('gemini');
    expect(FALLBACK_PROVIDER_ID).toBe('groq');
  });

  it('marks OpenAI and Claude as not-free', () => {
    for (const id of ['openai', 'anthropic'] as const) {
      const p = PROVIDER_DESCRIPTORS.find((d) => d.id === id);
      expect(p?.freeTier).toBe(false);
      expect(p?.role).toBe('not-free');
    }
  });
});

describe('getProviderStatus', () => {
  it('is not-configured with no proxy URL in this build', () => {
    // VITE_AI_PROXY_URL is unset in tests, as in every build today.
    expect(getProviderStatus()).toBe('not-configured');
  });
});

describe('askAssistant', () => {
  const messages: ChatMessage[] = [{ role: 'user', text: 'আমাকে একটি চিঠি লিখতে সাহায্য করুন।' }];

  it('returns not-configured when no proxy URL is set and never calls fetch', async () => {
    const fetchImpl = stubFetch({ status: 200, body: { reply: 'x', provider: 'gemini' } });
    const r = await askAssistant(messages, { fetchImpl });
    expect(r.kind).toBe('not-configured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns the AI text on a 200 with a reply (stubbed proxy)', async () => {
    // This proves the CLIENT parses a proxy response. It does not
    // call any real AI — a live call needs the owner's proxy + key.
    const fetchImpl = stubFetch({ status: 200, body: { reply: 'নমুনা উত্তর।', provider: 'gemini' } });
    const r = await askAssistant(messages, { fetchImpl, proxyUrl: TEST_PROXY });
    expect(r).toEqual({ kind: 'ai', text: 'নমুনা উত্তর।', provider: 'gemini' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const url = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as string;
    expect(url).toBe(`${TEST_PROXY}/api/chat`);
  });

  it('maps HTTP 429 to quota-exhausted (never a fake answer)', async () => {
    const fetchImpl = stubFetch({ status: 429, body: { error: 'quota-exhausted' } });
    const r = await askAssistant(messages, { fetchImpl, proxyUrl: TEST_PROXY });
    expect(r.kind).toBe('quota-exhausted');
  });

  it('maps a 500 to error (caller falls back to the tools)', async () => {
    const fetchImpl = stubFetch({ status: 500, body: { error: 'provider-error' } });
    const r = await askAssistant(messages, { fetchImpl, proxyUrl: TEST_PROXY });
    expect(r.kind).toBe('error');
  });

  it('maps a network failure to error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const r = await askAssistant(messages, { fetchImpl, proxyUrl: TEST_PROXY });
    expect(r.kind).toBe('error');
  });

  it('rejects an empty reply body instead of showing it', async () => {
    const fetchImpl = stubFetch({ status: 200, body: { reply: '   ' } });
    const r = await askAssistant(messages, { fetchImpl, proxyUrl: TEST_PROXY });
    expect(r.kind).toBe('error');
  });

  it('rejects an empty question with an error, not a fake answer', async () => {
    const fetchImpl = stubFetch({ status: 200, body: { reply: 'x' } });
    const r = await askAssistant([{ role: 'user', text: '   ' }], { fetchImpl, proxyUrl: TEST_PROXY });
    expect(r.kind).toBe('error');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends only message text + language, never identity or keys', async () => {
    const fetchImpl = stubFetch({ status: 200, body: { reply: 'ok', provider: 'gemini' } });
    await askAssistant(messages, { fetchImpl, proxyUrl: TEST_PROXY, lang: 'bn' });
    const init = (fetchImpl as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as {
      body: string;
      headers: Record<string, string>;
    };
    const body = JSON.parse(init.body) as { messages: unknown; lang: string };
    expect(body.lang).toBe('bn');
    expect(JSON.stringify(body)).not.toMatch(/api[_-]?key|password|token|email|phone/i);
    expect(init.headers['Content-Type']).toBe('application/json');
  });
});
