# AI Life Assistant — Free AI Provider Evaluation

Date: 23 Nov 2026. Branch: `feature/ai-life-assistant` (worktree
`~/workspace/eduorbit/phase2-project-ai-assistant/`).
Scope: item 1 of the owner's 22:16 update — which free AI integrations
are real, what they cost after the free tier, and what the owner must
do himself to enable live AI.

## Verdict in one paragraph

**Gemini (Google AI Studio) free tier is the only primary worth wiring
in today**: no card, no expiry, ~1,500 requests/day on Gemini 2.5
Flash, and the key can live server-side in a free Cloudflare Worker
proxy. **Groq is the fallback** (also free, no card, 1,000 req/day on
gpt-oss-120b). **OpenAI and Claude have no free API tier** — both
need a prepaid purchase, so they are not wired in. OpenRouter's free
models exist but rotate fast and cap at 50 requests/day unfunded, so
it is a standby only. **No live AI call has been made or tested yet**
— the proxy is built and staged, but activation needs the owner's own
Gemini API key + Cloudflare account (see §5). The site's chat UI says
"not connected yet" until that happens, and the 10 deterministic tools
work meanwhile.

## 1. Comparison table (checked 23 Nov 2026)

| Provider | Free API? | Card for free? | Free quota (headline) | Cost after free tier | Privacy note | Role |
|---|---|---|---|---|---|---|
| **Gemini (AI Studio)** | Yes | No | 2.5 Flash ~1,500 RPD (some sources say 250 RPD / 10 RPM — varies by model; verify at deploy) | Pay-as-you-go per token, only with billing enabled | Free-tier data may be used for training | **Primary** |
| **Groq** | Yes | No | gpt-oss-120b: 30 RPM, 1,000 RPD, 8k TPM, 200k TPD | Pay-as-you-go | Standard API terms; open models only | **Fallback** |
| **OpenRouter (:free)** | Yes, selected models | No | 20 RPM, 50 RPD unfunded; 1,000 RPD after $10 lifetime purchases | Per-token per model | Depends on the underlying model provider | Standby |
| **OpenAI (ChatGPT API)** | **No** | — | None — prepaid only, $5 minimum purchase; free trial credits ended ~Mar 2024 | Per-token (e.g. GPT-4o-mini input $0.15/1M tokens) | API data not used for training by default | Not free — not wired |
| **Anthropic Claude (API)** | **No** | — | Small one-time new-account trial credit only, then prepaid | Per-token | API data not used for training by default | Not free — not wired |

Notes on limits: free-tier quotas are set by the provider, change
without notice, and differ by model and account age. The numbers above
are the published headline figures as of 23 Nov 2026; the proxy
reports a 429 distinctly so the UI can say "free limit finished for
today" instead of guessing.

## 2. Why Gemini first, Groq second

- **Gemini**: the only free tier with a daily quota large enough for a
  small education site (~1,500/day is ~50× the expected early use),
  no card, no expiry, and a stable model name (gemini-2.5-flash).
  Bangla quality on Gemini 2.5 Flash is good for everyday questions.
  Downside: free-tier data may be used for training — the UI therefore
  warns users not to paste personal information, and the client sends
  only the message text + language, never identity.
- **Groq**: very fast inference, genuinely free, no card. Downside:
  the model lineup changed on 16 Aug 2026 (Llama 3.1 8B / 3.3 70B
  shut down for free accounts, replaced by gpt-oss models), so the
  fallback model name must be re-checked at wiring time. Bangla
  quality on gpt-oss models is weaker than Gemini — acceptable as a
  fallback, not as the primary.
- **OpenRouter**: useful as a third option because it aggregates many
  free models, but the free list rotates and the 50 RPD unfunded cap
  is too small to rely on. Not wired in the MVP.
- **OpenAI / Claude**: honest answer — they are the best-known
  models, but there is no $0 way to call their APIs. Any "free
  ChatGPT API" claim is false. They stay in the provider registry as
  `not-free` so a future paid decision is a one-line change, not a
  rewrite.

## 3. Open-source / self-hosted models

Running an open model ourselves (e.g. a small Qwen/Llama on a free
host) was considered and **rejected for the MVP**:

- Free hosting that can run an LLM (Hugging Face Spaces free CPU,
  Railway/Render free tiers) is too slow for chat (tens of seconds
  per reply on CPU, or sleeps after inactivity) and has no SLA.
- A GPU host costs money from day one.
- Quality in Bangla on small open models is below Gemini 2.5 Flash.
- The modular architecture means an open model can be added later as
  a provider if a genuinely usable free host appears — nothing in the
  UI or tools assumes Gemini.

## 4. Architecture (built, staged)

```
Browser (no key, ever)
  → POST /api/chat { messages, lang }          (VITE_AI_PROXY_URL)
  → Cloudflare Worker (free tier, 100k req/day)
      · CORS allowlist: eduvelto.com + www only
      · validates: ≤20 messages, ≤2000 chars each
      · key = Worker secret GEMINI_API_KEY (server-side only)
      · calls Gemini generateContent (model gemini-2.5-flash)
      · 429 → { error: "quota-exhausted" } (UI says so plainly)
      · never logs or stores message text
  → Gemini API (free tier)
```

- **Firebase Cloud Functions are NOT a $0 path**: new deployments
  need the Blaze plan, which needs a billing account/card the owner
  does not have. That is why the proxy is a Cloudflare Worker, not a
  Firebase function.
- The client (`src/lib/aiProviders.ts`) holds no key, sends no
  identity, and treats quota exhaustion as a first-class result.
  Adding a provider = one descriptor + one Worker branch; the chat UI
  and the deterministic tools never change.
- Code: `workers/ai-proxy/` (handler + pure helpers + wrangler.toml +
  README with the exact owner steps). Helper unit tests:
  `src/lib/__tests__/aiProxyHelpers.test.ts` (8 tests).

## 5. What the owner must do himself (BLOCKER — Muse cannot do this)

1. **Gemini API key (free, no card):** Google AI Studio
   (aistudio.google.com) → sign in with his Google account → "Get
   API key" → "Create API key". Copy it. **Do NOT paste it in chat
   or in any file.**
2. **Cloudflare account (free, no card):** sign up at
   dash.cloudflare.com; install Wrangler once (`npm install -g
   wrangler`), run `wrangler login`.
3. **Set the secret:** `cd workers/ai-proxy && wrangler secret put
   GEMINI_API_KEY`, paste the key when asked. The key then lives
   only in Cloudflare.
4. **Deploy:** `wrangler deploy`; note the Worker URL.
5. **Point the site at it:** share the Worker URL with Muse; Muse
   builds with `VITE_AI_PROXY_URL=<url>` and the chat switches from
   "not connected" to live.
6. **Test it:** ask 2–3 real questions in Bangla and 2–3 in English
   on the preview; check speed + correctness; confirm the tools
   still work when the quota is exhausted.

Estimated owner time: ~15 minutes (plus waiting on two sign-ups).
No payment, no card, no purchase anywhere in these steps.

## 6. What is NOT done / not tested (honest)

- **No live AI call has been made.** The provider client is tested
  with a stubbed fetch (success / 429 / 500 / network failure /
  empty reply / empty question — all in
  `src/lib/__tests__/aiProviders.test.ts`); the Worker helpers are
  unit-tested; but no request has ever reached Gemini, because no key
  exists. Item 5 (real user testing) is therefore **blocked on the
  owner steps above** and must be done the day the proxy goes live:
  real Bangla + English questions, timed, with the answers recorded
  as evidence.
- Quota figures must be re-verified at deploy time (they change).
- Groq fallback is designed, not wired: one Worker branch + one
  secret (`GROQ_API_KEY`) — add it only after Gemini is live and
  tested.

## 7. Cost after the free tier

- Gemini: if the free tier is ever outgrown, billing is per-token
  and requires the owner to enable billing himself — **the code
  never enables billing, and no card is on file anywhere**. The UI
  tells the user the free limit is finished for the day; it never
  silently switches to paid usage.
- Groq / OpenRouter: same rule — no paid usage without the owner's
  explicit, separate decision.
