// Eduvelto AI proxy — pure helpers (no Cloudflare imports, so they
// are unit-testable in plain Node). The request handler lives in
// index.ts and uses only these helpers for validation + mapping.

export interface ValidChatRequest {
  messages: { role: 'user' | 'assistant'; text: string }[];
  lang: 'bn' | 'en';
}

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 20;

/**
 * Validate an incoming /api/chat body. Rejects anything that is not
 * a short list of short user/assistant messages. No personal data is
 * ever expected or accepted here — the client sends message text only.
 */
export function validateChatRequest(body: unknown): { ok: true; value: ValidChatRequest } | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'body must be an object' };
  }
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { ok: false, error: 'messages must be a non-empty array' };
  }
  if (b.messages.length > MAX_HISTORY_MESSAGES) {
    return { ok: false, error: 'too many messages' };
  }
  const messages: ValidChatRequest['messages'] = [];
  for (const m of b.messages) {
    if (m === null || typeof m !== 'object' || Array.isArray(m)) {
      return { ok: false, error: 'each message must be an object' };
    }
    const msg = m as Record<string, unknown>;
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      return { ok: false, error: 'message role must be user or assistant' };
    }
    if (typeof msg.text !== 'string' || msg.text.trim() === '') {
      return { ok: false, error: 'message text must be a non-empty string' };
    }
    if (msg.text.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: 'message too long' };
    }
    messages.push({ role: msg.role, text: msg.text });
  }
  const lang = b.lang === 'en' ? 'en' : 'bn';
  return { ok: true, value: { messages, lang } };
}

/** Map a Gemini HTTP status to the error the client understands. */
export function mapProviderStatus(status: number): 'quota-exhausted' | 'provider-error' {
  return status === 429 ? 'quota-exhausted' : 'provider-error';
}

/**
 * System prompt: short, honest, Bangla-first. The model must not
 * claim to be human, must not give medical diagnoses or legal
 * verdicts, and must say when it does not know. No personal data is
 * requested from the user.
 */
export function buildSystemPrompt(lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    return [
      'তুমি Eduvelto-র AI সহায়ক — বাংলাদেশের শিক্ষার্থী ও সাধারণ মানুষের দৈনন্দিন সহায়ক।',
      'বাংলায় উত্তর দাও, সহজ ভাষায়, সংক্ষেপে।',
      'তুমি AI — মানুষ নও, এ কথা লুকাবে না।',
      'চিকিৎসা নির্ণয় বা আইনি রায় দেবে না; এমন প্রশ্নে নির্ভরযোগ্য উৎস বা বিশেষজ্ঞের কাছে যেতে বলবে।',
      'না জানলে "জানি না" বলবে — বানিয়ে উত্তর দেবে না।',
      'ব্যবহারকারীর ব্যক্তিগত তথ্য (নাম, ফোন, ঠিকানা, পাসওয়ার্ড) চাইবে না।',
    ].join('\n');
  }
  return [
    'You are Eduvelto’s AI assistant — a daily-life helper for students and general users in Bangladesh.',
    'Answer in English, in simple language, briefly.',
    'You are an AI, not a human — never hide that.',
    'Do not give medical diagnoses or legal verdicts; for those, point to a reliable source or a specialist.',
    'If you do not know, say so — never invent an answer.',
    'Never ask the user for personal information (name, phone, address, password).',
  ].join('\n');
}

/** Build the Gemini generateContent request body from a valid request. */
export function buildGeminiRequest(req: ValidChatRequest): Record<string, unknown> {
  return {
    system_instruction: { parts: [{ text: buildSystemPrompt(req.lang) }] },
    contents: req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };
}

/** Extract the reply text from a Gemini generateContent response. */
export function parseGeminiReply(json: unknown): string | null {
  if (json === null || typeof json !== 'object') return null;
  const candidates = (json as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = (candidates[0] as Record<string, unknown>).content as Record<string, unknown> | undefined;
  if (!content || !Array.isArray(content.parts)) return null;
  const texts = (content.parts as unknown[])
    .map((p) => (p as Record<string, unknown>).text)
    .filter((t): t is string => typeof t === 'string');
  const joined = texts.join('').trim();
  return joined === '' ? null : joined;
}
