// Eduvelto AI proxy — Cloudflare Worker (free tier).
//
// The Gemini API key lives HERE as a Worker secret (`wrangler secret
// put GEMINI_API_KEY`). It is NEVER in the frontend, NEVER in this
// repo, and NEVER in a client request. The browser only calls this
// worker; the worker calls Gemini.
//
// This file is STAGED, not deployed: deploying needs the owner's
// Cloudflare account + his own Gemini API key (see README.md).
// Until then the site's chat UI reports "AI not connected yet" and
// the deterministic tools keep working.

import { validateChatRequest, mapProviderStatus, buildGeminiRequest, parseGeminiReply } from './helpers';

interface Env {
  GEMINI_API_KEY: string;
  MODEL?: string;
}

const ALLOWED_ORIGINS = new Set(['https://eduvelto.com', 'https://www.eduvelto.com']);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin !== null && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
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
    if (origin !== null && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: 'forbidden-origin' }, 403, origin);
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

    const model = env.MODEL && env.MODEL.trim() !== '' ? env.MODEL : 'gemini-2.5-flash';
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildGeminiRequest(valid.value)),
          signal: AbortSignal.timeout(25000),
        },
      );
    } catch {
      return json({ error: 'provider-error' }, 502, origin);
    }
    if (!res.ok) {
      // Quota exhaustion is reported distinctly so the UI can say so.
      return json({ error: mapProviderStatus(res.status) }, res.status === 429 ? 429 : 502, origin);
    }
    const reply = parseGeminiReply(await res.json().catch(() => null));
    if (reply === null) return json({ error: 'empty-reply' }, 502, origin);
    return json({ reply, provider: 'gemini' }, 200, origin);
  },
};
