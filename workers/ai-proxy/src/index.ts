// Eduvelto AI proxy — Cloudflare Worker (free tier).
//
// The Gemini API key lives HERE as a Worker secret (`wrangler secret
// put GEMINI_API_KEY`). It is NEVER in the frontend, NEVER in this
// repo, and NEVER in a client request. The browser only calls this
// worker; the worker calls Gemini.
//
// This file is DEPLOYED at https://eduvelto-ai-proxy.eduvelto.workers.dev
// (owner's Cloudflare account + his own Gemini API key — see README.md).
// Deploying a change needs `wrangler deploy` from that account; the
// site build must carry VITE_AI_PROXY_URL=<the Worker URL> for the
// chat UI to report "live".

import { validateChatRequest, mapProviderStatus, shouldRetryProviderStatus, buildGeminiRequest, parseGeminiReply } from './helpers';

interface Env {
  GEMINI_API_KEY: string;
  MODEL?: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://eduvelto.com',
  'https://www.eduvelto.com',
  // Same live site on the Pages domain (owner order, 27 Nov 2026).
  'https://eduvelto.pages.dev',
]);

// Rate limit (owner order, 27 Nov 2026): max 20 requests/minute per
// client IP. In-memory sliding window, per Worker isolate — the free
// tier has no shared store, so the limit is per isolate, not global:
// a burst spread across many isolates can exceed 20/min in total. It
// still stops one abusive client hammering a single isolate, at zero
// cost. Preflight OPTIONS never consumes quota (handled before this).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitHits = new Map<string, number[]>();

function clientIp(request: Request): string {
  const cf = request.headers.get('CF-Connecting-IP');
  if (cf !== null && cf.trim() !== '') return cf.trim();
  const xff = request.headers.get('X-Forwarded-For');
  if (xff !== null && xff.trim() !== '') return xff.split(',')[0].trim();
  return 'unknown';
}

/** Returns seconds to wait when limited, or null when the request may proceed. */
function checkRateLimit(ip: string, now: number): number | null {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  let hits = rateLimitHits.get(ip);
  if (hits === undefined) {
    hits = [];
    rateLimitHits.set(ip, hits);
  }
  while (hits.length > 0 && hits[0] <= cutoff) hits.shift();
  if (hits.length >= RATE_LIMIT_MAX) {
    return Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000);
  }
  hits.push(now);
  return null;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin !== null && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(
  body: unknown,
  status: number,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), ...extraHeaders },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (url.pathname !== '/api/chat' || request.method !== 'POST') {
      return json({ error: 'not-found' }, 404, origin);
    }
    // Missing Origin is allowed (pre-existing pattern): a browser
    // cross-origin POST always carries Origin, so a request with no
    // Origin is a server/curl client, not a browser bypass. Only a
    // present-but-foreign Origin is rejected.
    if (origin !== null && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: 'forbidden-origin' }, 403, origin);
    }
    // Bad origins never consume quota; invalid bodies DO count (the
    // limit sits before parsing, so flooding with junk is still cut off).
    const limited = checkRateLimit(clientIp(request), Date.now());
    if (limited !== null) {
      return json({ error: 'rate-limited' }, 429, origin, { 'Retry-After': String(limited) });
    }
    if (!env.GEMINI_API_KEY) {
      // Key not configured yet (owner step) — say so, do not fake.
      return json({ error: 'provider-not-configured' }, 503, origin);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid-json' }, 400, origin);
    }
    const valid = validateChatRequest(body);
    if (!valid.ok) return json({ error: 'invalid-request', detail: valid.error }, 400, origin);

    const model = env.MODEL && env.MODEL.trim() !== '' ? env.MODEL : 'gemini-3.5-flash-lite';
    // One retry with backoff on fast transient upstream failures
    // (audit M1, 24 Nov 2026): Gemini-side overload/quota returns a
    // 429/5xx quickly, and a single retry a second later often
    // succeeds. Timeouts are NOT retried (see shouldRetryProviderStatus).
    // The upstream status is surfaced as `upstreamStatus` so the
    // client — and the next diagnosis — can tell a 503 overload from
    // a 429 quota hit instead of guessing from a bare 502. Message
    // text is never logged or echoed anywhere in this file.
    const UPSTREAM_TIMEOUT_MS = 25000;
    const RETRY_BACKOFF_MS = 1000;
    let res: Response | null = null;
    let timedOut = false;
    let fetchFailed = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body: JSON.stringify(buildGeminiRequest(valid.value)),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          },
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') {
          timedOut = true;
        } else {
          fetchFailed = true;
        }
        break;
      }
      if (res.ok) break;
      if (!shouldRetryProviderStatus(res.status, attempt)) break;
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
      res = null;
    }
    if (timedOut) {
      return json({ error: 'provider-timeout', upstreamStatus: null }, 502, origin);
    }
    if (fetchFailed || res === null) {
      return json({ error: 'provider-error', upstreamStatus: null }, 502, origin);
    }
    if (!res.ok) {
      // Quota exhaustion is reported distinctly so the UI can say so.
      return json(
        { error: mapProviderStatus(res.status), upstreamStatus: res.status },
        res.status === 429 ? 429 : 502,
        origin,
      );
    }
    const reply = parseGeminiReply(await res.json().catch(() => null));
    if (reply === null) return json({ error: 'empty-reply' }, 502, origin);
    return json({ reply, provider: 'gemini' }, 200, origin);
  },
};
