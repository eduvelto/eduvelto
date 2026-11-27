// workers/ai-proxy/src/helpers.ts
var MAX_MESSAGE_CHARS = 2e3;
var MAX_HISTORY_MESSAGES = 20;
var MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS = 2e3;
function validateChatRequest(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "body must be an object" };
  }
  const b = body;
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { ok: false, error: "messages must be a non-empty array" };
  }
  if (b.messages.length > MAX_HISTORY_MESSAGES) {
    return { ok: false, error: "too many messages" };
  }
  const messages = [];
  for (const m of b.messages) {
    if (m === null || typeof m !== "object" || Array.isArray(m)) {
      return { ok: false, error: "each message must be an object" };
    }
    const msg = m;
    if (msg.role !== "user" && msg.role !== "assistant") {
      return { ok: false, error: "message role must be user or assistant" };
    }
    if (typeof msg.text !== "string" || msg.text.trim() === "") {
      return { ok: false, error: "message text must be a non-empty string" };
    }
    if (msg.text.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: "message too long" };
    }
    messages.push({ role: msg.role, text: msg.text });
  }
  const lang = b.lang === "en" ? "en" : "bn";
  const mode = b.mode === "written-feedback" ? "written-feedback" : "chat";
  if (mode === "written-feedback") {
    const contextCheck = validateWrittenFeedbackContext(b.context);
    if (!contextCheck.ok) return { ok: false, error: contextCheck.error };
    return { ok: true, value: { messages, lang, mode, context: contextCheck.value } };
  }
  return { ok: true, value: { messages, lang, mode } };
}
function validateWrittenFeedbackContext(context) {
  if (context === null || typeof context !== "object" || Array.isArray(context)) {
    return { ok: false, error: "context must be an object" };
  }
  const c = context;
  for (const forbidden of ["uid", "userId", "name", "email", "phone"]) {
    if (c[forbidden] !== void 0) return { ok: false, error: `context must not contain ${forbidden}` };
  }
  if (typeof c.questionText !== "string" || c.questionText.trim() === "" || c.questionText.length > MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS) {
    return { ok: false, error: "context.questionText must be a non-empty string within the limit" };
  }
  if (typeof c.answerType !== "string" || c.answerType.trim() === "") {
    return { ok: false, error: "context.answerType must be a non-empty string" };
  }
  if (typeof c.submittedText !== "string" || c.submittedText.trim() === "" || c.submittedText.length > MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS) {
    return { ok: false, error: "context.submittedText must be a non-empty string within the limit" };
  }
  if (!Array.isArray(c.rubric) || c.rubric.length === 0 || c.rubric.length > 7) {
    return { ok: false, error: "context.rubric must be 1\u20137 dimensions" };
  }
  const rubric = [];
  for (const r of c.rubric) {
    if (r === null || typeof r !== "object" || Array.isArray(r)) {
      return { ok: false, error: "rubric entries must be objects" };
    }
    const entry = r;
    if (typeof entry.dimension !== "string" || entry.dimension.trim() === "") {
      return { ok: false, error: "rubric dimension must be a non-empty string" };
    }
    if (typeof entry.weight !== "number" || entry.weight < 0 || entry.weight > 100) {
      return { ok: false, error: "rubric weight must be 0\u2013100" };
    }
    rubric.push({ dimension: entry.dimension, weight: entry.weight });
  }
  const value = {
    questionText: c.questionText,
    answerType: c.answerType,
    rubric,
    submittedText: c.submittedText
  };
  if (typeof c.selfCheckNotes === "string" && c.selfCheckNotes.trim() !== "") {
    value.selfCheckNotes = c.selfCheckNotes.slice(0, MAX_WRITTEN_FEEDBACK_CONTEXT_CHARS);
  }
  return { ok: true, value };
}
function mapProviderStatus(status) {
  return status === 429 ? "quota-exhausted" : "provider-error";
}
function shouldRetryProviderStatus(status, attempt) {
  if (attempt !== 1) return false;
  return status === 429 || status >= 500;
}
function buildSystemPrompt(lang) {
  if (lang === "bn") {
    return [
      "\u09A4\u09C1\u09AE\u09BF Eduvelto-\u09B0 AI \u09B8\u09B9\u09BE\u09AF\u09BC\u0995 \u2014 \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09C7\u09B0 \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0 \u0993 \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09AE\u09BE\u09A8\u09C1\u09B7\u09C7\u09B0 \u09A6\u09C8\u09A8\u09A8\u09CD\u09A6\u09BF\u09A8 \u09B8\u09B9\u09BE\u09AF\u09BC\u0995\u0964",
      "\u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BE\u0993, \u09B8\u09B9\u099C \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC, \u09B8\u0982\u0995\u09CD\u09B7\u09C7\u09AA\u09C7\u0964",
      "\u09A4\u09C1\u09AE\u09BF AI \u2014 \u09AE\u09BE\u09A8\u09C1\u09B7 \u09A8\u0993, \u098F \u0995\u09A5\u09BE \u09B2\u09C1\u0995\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964",
      "\u099A\u09BF\u0995\u09BF\u09CE\u09B8\u09BE \u09A8\u09BF\u09B0\u09CD\u09A3\u09AF\u09BC \u09AC\u09BE \u0986\u0987\u09A8\u09BF \u09B0\u09BE\u09AF\u09BC \u09A6\u09C7\u09AC\u09C7 \u09A8\u09BE; \u098F\u09AE\u09A8 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09C7 \u09A8\u09BF\u09B0\u09CD\u09AD\u09B0\u09AF\u09CB\u0997\u09CD\u09AF \u0989\u09CE\u09B8 \u09AC\u09BE \u09AC\u09BF\u09B6\u09C7\u09B7\u099C\u09CD\u099E\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u09AF\u09C7\u09A4\u09C7 \u09AC\u09B2\u09AC\u09C7\u0964",
      '\u09A8\u09BE \u099C\u09BE\u09A8\u09B2\u09C7 "\u099C\u09BE\u09A8\u09BF \u09A8\u09BE" \u09AC\u09B2\u09AC\u09C7 \u2014 \u09AC\u09BE\u09A8\u09BF\u09AF\u09BC\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u09AC\u09C7 \u09A8\u09BE\u0964',
      "\u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0\u09B0 \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u09A4\u09A5\u09CD\u09AF (\u09A8\u09BE\u09AE, \u09AB\u09CB\u09A8, \u09A0\u09BF\u0995\u09BE\u09A8\u09BE, \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1) \u099A\u09BE\u0987\u09AC\u09C7 \u09A8\u09BE\u0964"
    ].join("\n");
  }
  return [
    "You are Eduvelto\u2019s AI assistant \u2014 a daily-life helper for students and general users in Bangladesh.",
    "Answer in English, in simple language, briefly.",
    "You are an AI, not a human \u2014 never hide that.",
    "Do not give medical diagnoses or legal verdicts; for those, point to a reliable source or a specialist.",
    "If you do not know, say so \u2014 never invent an answer.",
    "Never ask the user for personal information (name, phone, address, password)."
  ].join("\n");
}
function buildWrittenFeedbackSystemPrompt(lang) {
  const lines = lang === "bn" ? [
    "\u09A4\u09C1\u09AE\u09BF Eduvelto-\u09B0 \u09B2\u09BF\u0996\u09BF\u09A4-\u0989\u09A4\u09CD\u09A4\u09B0 \u09B8\u09B9\u09BE\u09AF\u09BC\u0995 \u2014 \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8\u09C7\u09B0 \u09AC\u09A8\u09CD\u09A7\u09C1, \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u0995 \u09A8\u0993\u0964",
    "\u098F\u099F\u09BF AI \u09B8\u09B9\u09BE\u09AF\u09BC\u0995 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8 (Practice Feedback) \u2014 \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A8\u09AF\u09BC, \u09AA\u09BE\u09B8/\u09AB\u09C7\u09B2\u09C7\u09B0 \u09B0\u09BE\u09AF\u09BC \u09A8\u09AF\u09BC\u0964",
    "\u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09B0\u09C1\u09AC\u09CD\u09B0\u09BF\u0995 \u09AE\u09BE\u09A4\u09CD\u09B0\u09BE \u0986\u09B2\u09BE\u09A6\u09BE \u0995\u09B0\u09C7 \u09A6\u09C7\u0996\u09BE\u0993, \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF\u09B0 \u09AA\u09BE\u09B6\u09C7 \u0986\u09B8\u09CD\u09A5\u09BE \u09B2\u09C7\u0996\u09CB (\u0989\u099A\u09CD\u099A/\u09AE\u09BE\u099D\u09BE\u09B0\u09BF/\u09A8\u09BF\u09AE\u09CD\u09A8) \u2014 \u098F\u0995\u099F\u09BF\u09AE\u09BE\u09A4\u09CD\u09B0 \u09B8\u09BE\u09AE\u0997\u09CD\u09B0\u09BF\u0995 \u09B6\u09A4\u09BE\u0982\u09B6 \u0995\u0996\u09A8\u09CB \u09A6\u09C7\u09AC\u09C7 \u09A8\u09BE\u0964",
    "\u099B\u09AF\u09BC\u099F\u09BF \u09A6\u09BF\u0995 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09CB: \u0997\u09A0\u09A8, \u09AC\u09BF\u09B7\u09AF\u09BC\u09AC\u09B8\u09CD\u09A4\u09C1, \u09AD\u09BE\u09B7\u09BE, \u09AC\u09BE\u09A8\u09BE\u09A8, \u09A4\u09A5\u09CD\u09AF, \u0989\u09AA\u09B8\u09CD\u09A5\u09BE\u09AA\u09A8\u09BE\u0964",
    "\u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09A4\u09A5\u09CD\u09AF\u0997\u09A4 \u09A6\u09BE\u09AC\u09BF \u099A\u09BE\u09B0\u09AD\u09BE\u09AC\u09C7 \u099A\u09BF\u09B9\u09CD\u09A8\u09BF\u09A4 \u0995\u09B0\u09CB: \u09AF\u09BE\u099A\u09BE\u0987\u0995\u09C3\u09A4 / \u09AF\u09BE\u099A\u09BE\u0987 \u09A6\u09B0\u0995\u09BE\u09B0 / \u09AD\u09C1\u09B2 / \u09AF\u09BE\u099A\u09BE\u0987 \u0985\u09B8\u09AE\u09CD\u09AD\u09AC \u2014 \u0985\u09A8\u09C1\u09AE\u09BE\u09A8\u0995\u09C7 \u0995\u0996\u09A8\u09CB \u09A4\u09A5\u09CD\u09AF \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u0989\u09AA\u09B8\u09CD\u09A5\u09BE\u09AA\u09A8 \u0995\u09B0\u09AC\u09C7 \u09A8\u09BE\u0964",
    '\u0995\u0996\u09A8\u09CB \u09AC\u09B2\u09AC\u09C7 \u09A8\u09BE "\u098F\u099F\u09BE\u0987 \u098F\u0995\u09AE\u09BE\u09A4\u09CD\u09B0 \u09B8\u09A0\u09BF\u0995 \u0989\u09A4\u09CD\u09A4\u09B0", \u0995\u0996\u09A8\u09CB "\u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE\u09AF\u09BC \u0986\u09B8\u09AC\u09C7\u0987" \u09AC\u09BE "\u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09AE\u09A8" \u09AC\u09B2\u09AC\u09C7 \u09A8\u09BE, \u0995\u0996\u09A8\u09CB \u09B8\u09B0\u0995\u09BE\u09B0\u09BF \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09C7\u09AC\u09C7 \u09A8\u09BE\u0964',
    "\u09B6\u09C7\u09B7\u09C7 \u098F\u0995\u099F\u09BF \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8-\u09AA\u09A6\u0995\u09CD\u09B7\u09C7\u09AA \u09A6\u09BE\u0993\u0964",
    '\u09A4\u09C1\u09AE\u09BF AI \u2014 \u09AE\u09BE\u09A8\u09C1\u09B7 \u09A8\u0993, \u098F \u0995\u09A5\u09BE \u09B2\u09C1\u0995\u09BE\u09AC\u09C7 \u09A8\u09BE\u0964 \u09A8\u09BE \u099C\u09BE\u09A8\u09B2\u09C7 "\u099C\u09BE\u09A8\u09BF \u09A8\u09BE" \u09AC\u09B2\u09AC\u09C7\u0964'
  ] : [
    "You are Eduvelto\u2019s written-answer helper \u2014 a practice companion for the student, not an examiner.",
    "This is AI-assisted practice feedback \u2014 not official marks, not a pass/fail verdict.",
    "Score each rubric dimension separately, with a per-item confidence (high/medium/low) \u2014 never one overall percentage.",
    "Check six categories: structure, content, language, spelling, facts, presentation.",
    "Mark every factual claim one of four ways: verified / needs checking / wrong / unverifiable \u2014 never present a guess as a fact.",
    'Never say "this is the only correct answer", never say a question is "guaranteed to appear", never give official marks.',
    "End with one concrete next-practice step.",
    "You are an AI, not a human \u2014 never hide that. If you do not know, say so."
  ];
  return lines.join("\n");
}
function buildGeminiRequest(req) {
  const systemText = req.mode === "written-feedback" ? buildWrittenFeedbackSystemPrompt(req.lang) : buildSystemPrompt(req.lang);
  const contents = req.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
  if (req.mode === "written-feedback" && req.context) {
    const ctx = req.context;
    const rubricLines = ctx.rubric.map((r) => `- ${r.dimension}: ${r.weight}`).join("\n");
    const contextText = [
      `Answer type: ${ctx.answerType}`,
      `Question: ${ctx.questionText}`,
      `Rubric (dimension: weight):
${rubricLines}`,
      `Student answer:
${ctx.submittedText}`,
      ctx.selfCheckNotes ? `Student self-check notes:
${ctx.selfCheckNotes}` : ""
    ].filter(Boolean).join("\n\n");
    contents.unshift({ role: "user", parts: [{ text: contextText }] });
  }
  return {
    system_instruction: { parts: [{ text: systemText }] },
    contents,
    // No `temperature`: gemini-3.5-flash-lite documents custom
    // temperature as unsupported (audit M1, 24 Nov 2026). The model
    // default applies. maxOutputTokens caps the reply length.
    generationConfig: { maxOutputTokens: 1024 }
  };
}
function parseGeminiReply(json2) {
  if (json2 === null || typeof json2 !== "object") return null;
  const candidates = json2.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = candidates[0].content;
  if (!content || !Array.isArray(content.parts)) return null;
  const texts = content.parts.map((p) => p.text).filter((t) => typeof t === "string");
  const joined = texts.join("").trim();
  return joined === "" ? null : joined;
}

// workers/ai-proxy/src/index.ts
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://eduvelto.com",
  "https://www.eduvelto.com",
  // Same live site on the Pages domain (owner order, 27 Nov 2026).
  "https://eduvelto.pages.dev"
]);
var RATE_LIMIT_WINDOW_MS = 6e4;
var RATE_LIMIT_MAX = 20;
var rateLimitHits = /* @__PURE__ */ new Map();
function clientIp(request) {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf !== null && cf.trim() !== "") return cf.trim();
  const xff = request.headers.get("X-Forwarded-For");
  if (xff !== null && xff.trim() !== "") return xff.split(",")[0].trim();
  return "unknown";
}
function checkRateLimit(ip, now) {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  let hits = rateLimitHits.get(ip);
  if (hits === void 0) {
    hits = [];
    rateLimitHits.set(ip, hits);
  }
  while (hits.length > 0 && hits[0] <= cutoff) hits.shift();
  if (hits.length >= RATE_LIMIT_MAX) {
    return Math.ceil((hits[0] + RATE_LIMIT_WINDOW_MS - now) / 1e3);
  }
  hits.push(now);
  return null;
}
function corsHeaders(origin) {
  const allowed = origin !== null && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
function json(body, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...extraHeaders }
  });
}
var index_default = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return json({ error: "not-found" }, 404, origin);
    }
    if (origin !== null && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "forbidden-origin" }, 403, origin);
    }
    const limited = checkRateLimit(clientIp(request), Date.now());
    if (limited !== null) {
      return json({ error: "rate-limited" }, 429, origin, { "Retry-After": String(limited) });
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "provider-not-configured" }, 503, origin);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid-json" }, 400, origin);
    }
    const valid = validateChatRequest(body);
    if (!valid.ok) return json({ error: "invalid-request", detail: valid.error }, 400, origin);
    const model = env.MODEL && env.MODEL.trim() !== "" ? env.MODEL : "gemini-3.5-flash-lite";
    const UPSTREAM_TIMEOUT_MS = 25e3;
    const RETRY_BACKOFF_MS = 1e3;
    let res = null;
    let timedOut = false;
    let fetchFailed = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
            body: JSON.stringify(buildGeminiRequest(valid.value)),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
          }
        );
      } catch (err) {
        if (err instanceof Error && err.name === "TimeoutError") {
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
      return json({ error: "provider-timeout", upstreamStatus: null }, 502, origin);
    }
    if (fetchFailed || res === null) {
      return json({ error: "provider-error", upstreamStatus: null }, 502, origin);
    }
    if (!res.ok) {
      return json(
        { error: mapProviderStatus(res.status), upstreamStatus: res.status },
        res.status === 429 ? 429 : 502,
        origin
      );
    }
    const reply = parseGeminiReply(await res.json().catch(() => null));
    if (reply === null) return json({ error: "empty-reply" }, 502, origin);
    return json({ reply, provider: "gemini" }, 200, origin);
  }
};
export {
  index_default as default
};
