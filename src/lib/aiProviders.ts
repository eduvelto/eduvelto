// Eduvelto AI Life Assistant — provider abstraction (modular, multi-provider).
//
// This file is the ONLY place the app talks about live AI providers.
// It holds NO API key, NO secret and NO credentials of any kind.
//
// How live AI will work (once the owner enables it):
//   Browser --(no key)--> Cloudflare Worker proxy (key lives there,
//   as a server-side secret) --> Gemini API (free tier).
// The client only ever calls OUR proxy URL (VITE_AI_PROXY_URL). With
// no proxy URL configured, getProviderStatus() is 'not-configured'
// and the chat UI honestly says AI is not connected yet.
//
// Providers are swappable: adding a provider means adding one
// descriptor below + one branch in the Worker, never touching the
// chat UI or the deterministic tools (./aiAssistant.ts).
//
// Privacy: the client sends only the user's message text and the
// language. It never sends names, emails, account IDs, location or
// any other personal data. The chat UI warns users not to paste
// personal or sensitive information.

export type ProviderId = 'gemini' | 'groq' | 'openrouter' | 'openai' | 'anthropic';

export interface ProviderDescriptor {
  id: ProviderId;
  displayName: string;
  /** Is there a genuinely $0 way to call this provider's API? */
  freeTier: boolean;
  /** Does the free route need a credit card? */
  needsCardForFree: boolean;
  /** Short free-tier facts (checked 23 Nov 2026 — see team/ai-assistant-provider-evaluation-2026-11-23.md). */
  freeFactsBn: string;
  freeFactsEn: string;
  /** Role in the modular plan. */
  role: 'primary' | 'fallback' | 'not-free' | 'standby';
}

export const PROVIDER_DESCRIPTORS: ProviderDescriptor[] = [
  {
    id: 'gemini',
    displayName: 'Google Gemini (AI Studio)',
    freeTier: true,
    needsCardForFree: false,
    freeFactsBn: 'বিনামূল্যের স্তর আছে — কার্ড লাগে না; Gemini 2.5 Flash-এ দিনে প্রায় ১,৫০০ অনুরোধ (মডেলভেদে বদলায়)। বিনামূল্যের স্তরের তথ্য Google প্রশিক্ষণে ব্যবহার করতে পারে।',
    freeFactsEn: 'Free tier exists — no card; Gemini 2.5 Flash allows about 1,500 requests/day (varies by model). Free-tier data may be used by Google for training.',
    role: 'primary',
  },
  {
    id: 'groq',
    displayName: 'Groq',
    freeTier: true,
    needsCardForFree: false,
    freeFactsBn: 'বিনামূল্যের স্তর আছে — কার্ড লাগে না; gpt-oss-120b-এ দিনে ১,০০০ অনুরোধ, মিনিটে ৩০টি। শুধু ওপেন মডেল চলে।',
    freeFactsEn: 'Free tier exists — no card; gpt-oss-120b allows 1,000 requests/day, 30/minute. Open models only.',
    role: 'fallback',
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter (:free models)',
    freeTier: true,
    needsCardForFree: false,
    freeFactsBn: 'বিনামূল্যের মডেল আছে — কার্ড লাগে না; মিনিটে ২০টি, দিনে ৫০টি অনুরোধ (ক্রেডিট না কিনলে)। মডেলের তালিকা প্রায়ই বদলায়।',
    freeFactsEn: 'Free models exist — no card; 20/minute, 50/day without any credit purchase. The free model list changes often.',
    role: 'fallback',
  },
  {
    id: 'openai',
    displayName: 'OpenAI (ChatGPT API)',
    freeTier: false,
    needsCardForFree: true,
    freeFactsBn: 'বিনামূল্যের API স্তর নেই — নতুন অ্যাকাউন্টে অন্তত $৫ ক্রেডিট কিনতে হয়; ছোট পরীক্ষা ছাড়া সব অনুরোধের টাকা কাটে।',
    freeFactsEn: 'No free API tier — a new account must buy at least $5 of credit; every real request is billed.',
    role: 'not-free',
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic Claude (API)',
    freeTier: false,
    needsCardForFree: true,
    freeFactsBn: 'বিনামূল্যের API স্তর নেই — নতুন অ্যাকাউন্টে একবারের ছোট ট্রায়াল ক্রেডিট মেলে, তারপর প্রিপেইড।',
    freeFactsEn: 'No free API tier — a new account gets a small one-time trial credit, then it is prepaid.',
    role: 'not-free',
  },
];

/** The provider the proxy is configured to use first (code-level plan;
 *  the proxy itself picks the model — see workers/ai-proxy). */
export const PRIMARY_PROVIDER_ID: ProviderId = 'gemini';
export const FALLBACK_PROVIDER_ID: ProviderId = 'groq';

export type ProviderStatus = 'not-configured' | 'ready' | 'quota-exhausted' | 'error';

/** The proxy URL comes from the build environment, never from code.
 *  Empty in every build today — the proxy is not deployed yet. */
export function getProxyUrl(): string {
  try {
    const url = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_AI_PROXY_URL;
    return typeof url === 'string' ? url.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Connection status of live AI. 'ready' only means "a proxy URL is
 * configured" — the first real call can still fail (quota, network),
 * and askAssistant() reports that per call. There is no way for this
 * function to claim AI works when it does not.
 */
export function getProviderStatus(): ProviderStatus {
  return getProxyUrl() === '' ? 'not-configured' : 'ready';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** Hard client-side guards: no giant prompts, no endless history. */
export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 20;
export const CHAT_TIMEOUT_MS = 30000;

export type AskResult =
  | { kind: 'ai'; text: string; provider: ProviderId }
  | { kind: 'not-configured' }
  | { kind: 'quota-exhausted' }
  | { kind: 'error'; messageBn: string; messageEn: string };

export interface AskOptions {
  lang?: 'bn' | 'en';
  /** Test seam: unit tests pass a proxy URL here. Production never
   *  sets it — the URL comes from the build environment only. */
  proxyUrl?: string;
  /** Test seam: unit tests pass a stub fetch. Production passes none. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Send one chat turn through the server-side proxy.
 *
 * - No API key is ever attached here (the key lives in the proxy).
 * - Only the message text + language are sent. No identity, no
 *   personal data, no location.
 * - Quota exhaustion is a FIRST-CLASS result ('quota-exhausted'), so
 *   the UI can say so plainly instead of inventing an answer.
 * - Any other failure is 'error' — the caller falls back to the
 *   deterministic tools, which keep working.
 */
export async function askAssistant(messages: ChatMessage[], opts: AskOptions = {}): Promise<AskResult> {
  const proxyUrl = opts.proxyUrl ?? getProxyUrl();
  if (proxyUrl === '') return { kind: 'not-configured' };
  const lang = opts.lang ?? 'bn';
  const trimmed = messages
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_HISTORY_MESSAGES);
  if (trimmed.length === 0 || trimmed.every((m) => m.text.trim() === '')) {
    return {
      kind: 'error',
      messageBn: 'প্রশ্ন লিখুন।',
      messageEn: 'Please write a question.',
    };
  }
  const fetchImpl = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? CHAT_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${proxyUrl.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: trimmed, lang }),
      signal: controller.signal,
    });
    if (res.status === 429) return { kind: 'quota-exhausted' };
    if (!res.ok) {
      return {
        kind: 'error',
        messageBn: 'AI সেবা এখন সাড়া দিচ্ছে না। নিচের টুলগুলো ব্যবহার করুন — সেগুলো সবসময় কাজ করে।',
        messageEn: 'The AI service is not responding right now. Use the tools below — they always work.',
      };
    }
    const data = (await res.json()) as { reply?: unknown; provider?: unknown };
    if (typeof data.reply !== 'string' || data.reply.trim() === '') {
      return {
        kind: 'error',
        messageBn: 'AI সেবা খালি উত্তর দিয়েছে। আবার চেষ্টা করুন।',
        messageEn: 'The AI service returned an empty answer. Please try again.',
      };
    }
    const provider =
      data.provider === 'groq' || data.provider === 'openrouter' ? (data.provider as ProviderId) : 'gemini';
    return { kind: 'ai', text: data.reply, provider };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        kind: 'error',
        messageBn: 'উত্তর আসতে দেরি হচ্ছে — সময় শেষ হয়েছে। আবার চেষ্টা করুন।',
        messageEn: 'The answer took too long. Please try again.',
      };
    }
    // Audit m02 (24 Nov 2026): only a genuine network failure
    // (fetch itself throwing a TypeError) may blame the guest's
    // connection. Anything else thrown here — e.g. an unreadable
    // response body after an HTTP 200 — is a server-side failure,
    // so it gets the server-error wording, never the internet one.
    if (err instanceof TypeError) {
      return {
        kind: 'error',
        messageBn: 'ইন্টারনেট সংযোগে সমস্যা হয়েছে। নিচের টুলগুলো ব্যবহার করুন — সেগুলো অফলাইনেও কাজ করে।',
        messageEn: 'There is a connection problem. Use the tools below — they work offline too.',
      };
    }
    return {
      kind: 'error',
      messageBn: 'AI সেবা এখন সাড়া দিচ্ছে না। নিচের টুলগুলো ব্যবহার করুন — সেগুলো সবসময় কাজ করে।',
      messageEn: 'The AI service is not responding right now. Use the tools below — they always work.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
