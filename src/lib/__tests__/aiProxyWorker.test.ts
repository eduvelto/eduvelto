// Unit tests — Cloudflare Worker request handler (workers/ai-proxy/src/index.ts).
// The handler uses only global fetch + AbortSignal, so it runs in plain
// Node under vitest with a stubbed fetch. No Worker runtime, no deploy,
// no Gemini key and no live call: every upstream response is stubbed.
//
// Covers audit M1 (24 Nov 2026): one retry with backoff on fast
// transient upstream failures, the upstream status surfaced in the
// error body, and a distinct error for an upstream timeout.

import { describe, it, expect, vi, afterEach } from 'vitest';
import worker from '../../../workers/ai-proxy/src/index';

const ORIGIN = 'https://eduvelto.com';
const ENV = { GEMINI_API_KEY: 'test-key-not-real' };

function chatRequest(body: unknown): Request {
  return new Request('https://eduvelto-ai-proxy.eduvelto.workers.dev/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = { messages: [{ role: 'user', text: 'What is 2 + 2?' }], lang: 'en' };

function geminiOk(reply: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: reply }] } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function geminiError(status: number): Response {
  return new Response(JSON.stringify({ error: { code: status, message: 'upstream failure' } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/chat — retry + upstream status (audit M1)', () => {
  it('retries once after a fast 503 and returns the second attempt’s reply', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(geminiError(503))
      .mockResolvedValueOnce(geminiOk('4'));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(chatRequest(VALID_BODY), ENV);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: '4', provider: 'gemini' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries once after a 429 and reports quota-exhausted when the retry also 429s', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiError(429));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(chatRequest(VALID_BODY), ENV);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'quota-exhausted', upstreamStatus: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 400 and surfaces the upstream status in the error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiError(400));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(chatRequest(VALID_BODY), ENV);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'provider-error', upstreamStatus: 400 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports a distinct provider-timeout (no retry) when the upstream stalls', async () => {
    const timeoutError = new Error('The operation timed out.');
    timeoutError.name = 'TimeoutError';
    const fetchImpl = vi.fn().mockRejectedValue(timeoutError);
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(chatRequest(VALID_BODY), ENV);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'provider-timeout', upstreamStatus: null });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('never echoes message text in an error body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiError(500));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(chatRequest(VALID_BODY), ENV);
    const body = JSON.stringify(await res.json());
    expect(body).not.toContain('2 + 2');
  });
});

// Origin allowlist + rate limit (owner order, 27 Nov 2026).
// Invalid body = { messages: [] } → 400 before any Gemini call, so the
// rate-limit tests burn no Gemini quota. Each test uses its own
// CF-Connecting-IP so the module-level buckets never leak across tests.
const INVALID_BODY = { messages: [] };

function requestWithIp(body: unknown, ip: string, origin: string | null): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'CF-Connecting-IP': ip,
  };
  if (origin !== null) headers.Origin = origin;
  return new Request('https://eduvelto-ai-proxy.eduvelto.workers.dev/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('origin allowlist + rate limit (owner order, 27 Nov 2026)', () => {
  it('allows the eduvelto.pages.dev origin', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiOk('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(
      requestWithIp(VALID_BODY, '203.0.113.1', 'https://eduvelto.pages.dev'),
      ENV,
    );
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects a foreign origin with 403 + CORS headers and no upstream call', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiOk('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(
      requestWithIp(VALID_BODY, '203.0.113.2', 'https://evil.example'),
      ENV,
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'forbidden-origin' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('allows a request with no Origin header (server client, pre-existing pattern)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiOk('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(requestWithIp(VALID_BODY, '203.0.113.3', null), ENV);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns 400 with CORS headers for an invalid body and makes no Gemini call', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiOk('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    const res = await worker.fetch(requestWithIp(INVALID_BODY, '203.0.113.4', ORIGIN), ENV);
    expect(res.status).toBe(400);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('answers preflight OPTIONS with 204 + CORS headers without consuming quota', async () => {
    const ip = '203.0.113.5';
    for (let i = 0; i < 5; i++) {
      const preflight = new Request('https://eduvelto-ai-proxy.eduvelto.workers.dev/api/chat', {
        method: 'OPTIONS',
        headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip },
      });
      const r = await worker.fetch(preflight, ENV);
      expect(r.status).toBe(204);
      expect(r.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    }
    // All 20 POSTs still allowed after the preflights.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiOk('ok')));
    for (let i = 0; i < 20; i++) {
      const r = await worker.fetch(requestWithIp(INVALID_BODY, ip, ORIGIN), ENV);
      expect(r.status).toBe(400);
    }
  });

  it('429s the 21st request inside one minute, with CORS headers + Retry-After, and no Gemini call', async () => {
    const ip = '203.0.113.6';
    const fetchImpl = vi.fn().mockResolvedValue(geminiOk('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    for (let i = 0; i < 20; i++) {
      const r = await worker.fetch(requestWithIp(INVALID_BODY, ip, ORIGIN), ENV);
      expect(r.status).toBe(400);
    }
    const over = await worker.fetch(requestWithIp(INVALID_BODY, ip, ORIGIN), ENV);
    expect(over.status).toBe(429);
    expect(await over.json()).toEqual({ error: 'rate-limited' });
    expect(over.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    const retryAfter = Number(over.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('limits per IP: exhausting one IP does not block another', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiOk('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    const ipA = '203.0.113.7';
    for (let i = 0; i < 21; i++) {
      await worker.fetch(requestWithIp(INVALID_BODY, ipA, ORIGIN), ENV);
    }
    const resB = await worker.fetch(requestWithIp(INVALID_BODY, '203.0.113.8', ORIGIN), ENV);
    expect(resB.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
