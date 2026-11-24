# Eduvelto AI proxy — Cloudflare Worker (free tier)

The browser never calls Google directly and never holds an API key.
It calls this Worker; the Worker holds the Gemini API key as a
server-side secret and calls the Gemini API.

## Status

STAGED, not deployed. The code is complete; activation needs two
owner-side actions (below). Until then the site reports "AI not
connected yet" and the deterministic tools keep working.

## What the proxy does

- `POST /api/chat` with `{ messages, lang }` → `{ reply, provider }`.
- CORS allowlist: only `https://eduvelto.com` and
  `https://www.eduvelto.com` may call it.
- Validates every request (max 20 messages, max 2000 chars each).
- Never logs or stores message text. Never asks for personal data.
- Maps a Gemini 429 to HTTP 429 `{ error: "quota-exhausted" }` so the
  UI can say the free quota is used up, instead of inventing an answer.
- Model: `gemini-2.5-flash` (Gemini free tier, no card). Change it in
  `wrangler.toml` (`MODEL`) if the free-tier lineup changes.

## Owner steps to activate (owner only — Muse cannot do these)

1. **Gemini API key (free, no card):** go to Google AI Studio
   (aistudio.google.com), sign in with your Google account, open
   "Get API key" → "Create API key", copy the key. Do NOT paste the
   key in chat or in any file.
2. **Cloudflare account (free, no card):** sign up at
   dash.cloudflare.com, then install Wrangler once:
   `npm install -g wrangler` and run `wrangler login`.
3. **Set the secret (the key lives only here):**
   `cd workers/ai-proxy && wrangler secret put GEMINI_API_KEY`
   then paste the key when asked.
4. **Deploy:** `wrangler deploy` — note the Worker URL
   (e.g. `https://eduvelto-ai-proxy.<your-subdomain>.workers.dev`).
5. **Point the site at it:** build the site with
   `VITE_AI_PROXY_URL=<the Worker URL>` (Muse does the build step
   once you share the URL). The chat UI then switches from
   "not connected" to live.
6. **Test it:** ask 2–3 real questions in Bangla and 2–3 in English
   on the preview, check speed + correctness, and confirm the
   deterministic tools still work when the quota is exhausted.

## If the free quota ends

The Gemini free tier is per-day (about 1,500 requests/day on
2.5 Flash, varies by model). When it is used up, the Worker returns
429 and the site shows — in Bangla and English — that the free
quota for today is finished and to try again tomorrow. The tools
keep working. No payment is ever taken: there is no card on file
anywhere in this setup.

## Second provider (fallback, later)

Groq can be added the same way: a second secret
(`GROQ_API_KEY`) + one branch in `src/index.ts` that tries Groq
when Gemini returns 429. No UI change is needed — the client
already accepts a `provider` of `groq`. Do not add it until the
Gemini path is live and tested.

## Why not Firebase Cloud Functions?

Cloud Functions need the Blaze (pay-as-you-go) plan for new
deployments — Spark cannot deploy them, and Blaze needs a card the
owner does not have. Cloudflare Workers free tier needs no card,
which is why the proxy lives here, not in Firebase.
