// Eduvelto AI proxy — pure helpers (no Cloudflare imports, so they
// are unit-testable in plain Node). The request handler lives in
// index.ts and uses only these helpers for validation + mapping.

export interface ValidChatRequest {
  messages: { role: 'user' | 'assistant'; text: string }[];
  lang: 'bn' | 'en';
  /** 'chat' is the default. 'written-feedback' routes the request
   * to the written-feedback system prompt (design §2.6) and
   * requires `context`. The client stub (jobWrittenFeedback.ts)
   * stays DISABLED until the env var + live Worker are verified —
   * this mode is Phase 2/Later code only, never a live claim. */
  mode: 'chat' | 'written-feedback';
  context?: WrittenFeedbackContext;
}

/**
 * Structured context for a written-feedback request. The client
 * sends the question + the student's own text + the rubric —
 * NEVER identity (no uid, no name, no email, no phone). The
 * Worker validates the shape and rejects anything else.
 */
export interface WrittenFeedbackContext {
  questionText: string;
  answerType: string;
  rubric: { dimension: string; weight: number }[];
  submittedText: string;
  selfCheckNotes?: string;
}

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS = 2000;

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
  const mode = b.mode === 'written-feedback' ? 'written-feedback' : 'chat';
  if (mode === 'written-feedback') {
    const contextCheck = validateWrittenFeedbackContext(b.context);
    if (!contextCheck.ok) return { ok: false, error: contextCheck.error };
    return { ok: true, value: { messages, lang, mode, context: contextCheck.value } };
  }
  return { ok: true, value: { messages, lang, mode } };
}

/**
 * Validate the structured written-feedback context. Rejects any
 * identity field (uid / name / email / phone) outright — the
 * client must never send who the student is, only what they
 * wrote. Rubric weights must be 1–7 dimensions, each 0–100.
 */
export function validateWrittenFeedbackContext(
  context: unknown,
): { ok: true; value: WrittenFeedbackContext } | { ok: false; error: string } {
  if (context === null || typeof context !== 'object' || Array.isArray(context)) {
    return { ok: false, error: 'context must be an object' };
  }
  const c = context as Record<string, unknown>;
  for (const forbidden of ['uid', 'userId', 'name', 'email', 'phone']) {
    if (c[forbidden] !== undefined) return { ok: false, error: `context must not contain ${forbidden}` };
  }
  if (typeof c.questionText !== 'string' || c.questionText.trim() === '' || c.questionText.length > MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS) {
    return { ok: false, error: 'context.questionText must be a non-empty string within the limit' };
  }
  if (typeof c.answerType !== 'string' || c.answerType.trim() === '') {
    return { ok: false, error: 'context.answerType must be a non-empty string' };
  }
  if (typeof c.submittedText !== 'string' || c.submittedText.trim() === '' || c.submittedText.length > MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS) {
    return { ok: false, error: 'context.submittedText must be a non-empty string within the limit' };
  }
  if (!Array.isArray(c.rubric) || c.rubric.length === 0 || c.rubric.length > 7) {
    return { ok: false, error: 'context.rubric must be 1–7 dimensions' };
  }
  const rubric: WrittenFeedbackContext['rubric'] = [];
  for (const r of c.rubric) {
    if (r === null || typeof r !== 'object' || Array.isArray(r)) {
      return { ok: false, error: 'rubric entries must be objects' };
    }
    const entry = r as Record<string, unknown>;
    if (typeof entry.dimension !== 'string' || entry.dimension.trim() === '') {
      return { ok: false, error: 'rubric dimension must be a non-empty string' };
    }
    if (typeof entry.weight !== 'number' || entry.weight < 0 || entry.weight > 100) {
      return { ok: false, error: 'rubric weight must be 0–100' };
    }
    rubric.push({ dimension: entry.dimension, weight: entry.weight });
  }
  const value: WrittenFeedbackContext = {
    questionText: c.questionText,
    answerType: c.answerType,
    rubric,
    submittedText: c.submittedText,
  };
  if (typeof c.selfCheckNotes === 'string' && c.selfCheckNotes.trim() !== '') {
    value.selfCheckNotes = c.selfCheckNotes.slice(0, MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS);
  }
  return { ok: true, value };
}

/** Map a Gemini HTTP status to the error the client understands. */
export function mapProviderStatus(status: number): 'quota-exhausted' | 'provider-error' {
  return status === 429 ? 'quota-exhausted' : 'provider-error';
}

/**
 * Is this upstream status worth ONE retry? Only transient failures:
 * 429 (quota/rate-limit — the next minute may succeed) and 5xx
 * (Gemini-side overload/temporary failure). 4xx other than 429 is a
 * bad request that retrying will not fix; a timeout abort is not
 * retried either — a 25 s upstream stall retried once would make the
 * guest wait ~50 s for the same stall.
 *
 * Diagnosis (full-site audit M1, 24 Nov 2026): the same Worker code
 * returned real replies at 18:50 on 24 Nov and then 502'd on all
 * 3 audit tries (EN ×2 at ~25.9 s, i.e. upstream-timeout aborts;
 * BN ×1 at 1.5 s, i.e. a fast upstream 5xx). The temperature
 * hypothesis is therefore weak — the failure is intermittent and
 * upstream-side — so the fix retries fast transient failures once
 * instead of assuming the request shape was wrong. Removing
 * `temperature` (below) is still correct: gemini-3.5-flash-lite
 * documents custom temperature as unsupported, so sending it can
 * only hurt.
 */
export function shouldRetryProviderStatus(status: number, attempt: number): boolean {
  if (attempt !== 1) return false;
  return status === 429 || status >= 500;
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

/**
 * Written-feedback system prompt (design §2.6). Supportive
 * practice feedback ONLY — never official marks, never a verdict
 * on the student's future. The model must:
 *  - score each rubric dimension separately, with a per-item
 *    confidence (high/medium/low) — NEVER one overall %;
 *  - check six categories: structure, content, language,
 *    spelling, facts, presentation;
 *  - mark every factual claim one of four ways: verified /
 *    needs-checking / wrong / unverifiable — never present a
 *    guess as a fact;
 *  - never claim the model answer is the only correct answer,
 *    never claim a question is "guaranteed common", never give
 *    an official mark or a pass/fail verdict;
 *  - end with one concrete next-practice step.
 */
export function buildWrittenFeedbackSystemPrompt(lang: 'bn' | 'en'): string {
  const lines =
    lang === 'bn'
      ? [
          'তুমি Eduvelto-র লিখিত-উত্তর সহায়ক — শিক্ষার্থীর অনুশীলনের বন্ধু, পরীক্ষক নও।',
          'এটি AI সহায়ক মূল্যায়ন (Practice Feedback) — সরকারি নম্বর নয়, পাস/ফেলের রায় নয়।',
          'প্রতিটি রুব্রিক মাত্রা আলাদা করে দেখাও, প্রতিটির পাশে আস্থা লেখো (উচ্চ/মাঝারি/নিম্ন) — একটিমাত্র সামগ্রিক শতাংশ কখনো দেবে না।',
          'ছয়টি দিক যাচাই করো: গঠন, বিষয়বস্তু, ভাষা, বানান, তথ্য, উপস্থাপনা।',
          'প্রতিটি তথ্যগত দাবি চারভাবে চিহ্নিত করো: যাচাইকৃত / যাচাই দরকার / ভুল / যাচাই অসম্ভব — অনুমানকে কখনো তথ্য হিসেবে উপস্থাপন করবে না।',
          'কখনো বলবে না "এটাই একমাত্র সঠিক উত্তর", কখনো "পরীক্ষায় আসবেই" বা "নিশ্চিত কমন" বলবে না, কখনো সরকারি নম্বর দেবে না।',
          'শেষে একটি নির্দিষ্ট পরবর্তী অনুশীলন-পদক্ষেপ দাও।',
          'তুমি AI — মানুষ নও, এ কথা লুকাবে না। না জানলে "জানি না" বলবে।',
        ]
      : [
          'You are Eduvelto’s written-answer helper — a practice companion for the student, not an examiner.',
          'This is AI-assisted practice feedback — not official marks, not a pass/fail verdict.',
          'Score each rubric dimension separately, with a per-item confidence (high/medium/low) — never one overall percentage.',
          'Check six categories: structure, content, language, spelling, facts, presentation.',
          'Mark every factual claim one of four ways: verified / needs checking / wrong / unverifiable — never present a guess as a fact.',
          'Never say "this is the only correct answer", never say a question is "guaranteed to appear", never give official marks.',
          'End with one concrete next-practice step.',
          'You are an AI, not a human — never hide that. If you do not know, say so.',
        ];
  return lines.join('\n');
}

/** Build the Gemini generateContent request body from a valid request. */
export function buildGeminiRequest(req: ValidChatRequest): Record<string, unknown> {
  const systemText =
    req.mode === 'written-feedback' ? buildWrittenFeedbackSystemPrompt(req.lang) : buildSystemPrompt(req.lang);
  const contents = req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));
  if (req.mode === 'written-feedback' && req.context) {
    // The structured context rides as the first user turn, so the
    // model sees the rubric + the student's text as data, not as
    // instructions from the student.
    const ctx = req.context;
    const rubricLines = ctx.rubric.map((r) => `- ${r.dimension}: ${r.weight}`).join('\n');
    const contextText = [
      `Answer type: ${ctx.answerType}`,
      `Question: ${ctx.questionText}`,
      `Rubric (dimension: weight):\n${rubricLines}`,
      `Student answer:\n${ctx.submittedText}`,
      ctx.selfCheckNotes ? `Student self-check notes:\n${ctx.selfCheckNotes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    contents.unshift({ role: 'user', parts: [{ text: contextText }] });
  }
  return {
    system_instruction: { parts: [{ text: systemText }] },
    contents,
    // No `temperature`: gemini-3.5-flash-lite documents custom
    // temperature as unsupported (audit M1, 24 Nov 2026). The model
    // default applies. maxOutputTokens caps the reply length.
    generationConfig: { maxOutputTokens: 1024 },
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
