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
