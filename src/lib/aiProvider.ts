// Eduvelto AI provider layer — ONE interface for every AI model.
//
// DESIGN (architecture doc §8 + costing plan §2.1):
// The Model Adapter hides the provider behind a single interface
// (chat / vision / voice), so the model can change without rewriting
// lessons, retrieval or UI. No architecture lock-in to an expensive
// provider. The provider NEVER sees personal data — only the UID, class,
// subject/chapter, mastery score, learning goals, retrieved curriculum
// text and the current question (costing plan §6.3). Names, phones,
// emails, addresses, birth dates, school names and guardian details
// are NEVER sent to a model.
//
// CURRENT STATE — READ THIS FIRST:
// Only the NOT-CONNECTED stub exists. There is NO API key, NO paid
// service and NO model call anywhere in this codebase. `aiProvider`
// below is the stub, and it ALWAYS returns `AI_NOT_CONNECTED` — it
// never generates, invents or paraphrases an answer. A fake AI answer
// presented as real would violate the owner's directive (21 Nov 2026)
// and the platform's honesty rules, so the stub is deliberately unable
// to produce one.
//
// ACTIVATION (owner decision, NOT authorised now):
// 1. Owner approves a provider + model (recommended: Gemini 3.5
//    Flash-Lite — see team/ai-teacher-approval-package.md) and a
//    monthly budget cap.
// 2. Firebase Blaze upgrade + Cloud Function gateway (`aiGateway`),
//    with the API key in Secret Manager — NEVER in the client, NEVER
//    in the repo. The free-tier interim path (browser-side key) is
//    documented in the approval package with its honest limitations
//    (key can be extracted from DevTools; client-side quota can be
//    bypassed) and needs its own explicit approval for a pilot.
// 3. A real provider implementation of `AiProvider` is added here and
//    wired in ONLY behind the gateway. Until then, `aiProvider` stays
//    the stub and the UI shows the honest not-connected state.

export type AiLanguage = 'bn' | 'en';

/** What the UI asks the provider to answer. Personal data is NEVER here. */
export interface AiChatRequest {
  conversationId: string;
  /** The student's question, as typed (1–4000 chars, validated in aiChat.ts). */
  text: string;
  language: AiLanguage;
  /** Class/level from the student's profile (e.g. 'Class 8', 'HSC 1st Year'). */
  classLevel?: string;
  /** Subject / chapter the question is about, when known. */
  subject?: string;
  chapter?: string;
  /** Mastery score 0–100 for the topic, when known (adaptive teaching). */
  masteryScore?: number;
}

/** A real model answer. The stub NEVER returns this. */
export interface AiChatSuccess {
  ok: true;
  /** The model's answer text (Bangla or English, per request language). */
  answer: string;
  /** Sources the answer was grounded in (book/chapter/topic references). */
  sources: string[];
  /** Tokens used, for cost monitoring (0 when unknown). */
  inputTokens: number;
  outputTokens: number;
}

/** Every failure is explicit — the UI shows the honest reason. */
export interface AiChatFailure {
  ok: false;
  code: 'AI_NOT_CONNECTED' | 'AI_QUOTA_EXCEEDED' | 'AI_ERROR';
  messageBn: string;
  messageEn: string;
}

export type AiChatResponse = AiChatSuccess | AiChatFailure;

/**
 * The single provider interface. A future Gemini provider, or any other
 * model, implements exactly this — the UI and the data layer never talk
 * to a model directly.
 *
 * `status` is the ONLY thing the UI uses to decide what to show:
 * 'not-connected' → the honest "AI is not live yet" state;
 * 'connected' → real answers flow (only after owner approval + gateway).
 */
export interface AiProvider {
  readonly id: string;
  readonly displayNameBn: string;
  readonly displayNameEn: string;
  readonly status: 'not-connected' | 'connected';
  sendMessage(request: AiChatRequest): Promise<AiChatResponse>;
}

/**
 * The not-connected stub. `sendMessage` ALWAYS fails with
 * AI_NOT_CONNECTED and NEVER returns an answer. This is deliberate:
 * there is no model, no key and no paid service, so there is nothing
 * to answer with — and inventing one would be fake AI.
 */
export const notConnectedProvider: AiProvider = {
  id: 'not-connected',
  displayNameBn: 'Eduvelto AI (এখনো যুক্ত হয়নি)',
  displayNameEn: 'Eduvelto AI (not connected yet)',
  status: 'not-connected',
  async sendMessage(_request: AiChatRequest): Promise<AiChatResponse> {
    return {
      ok: false,
      code: 'AI_NOT_CONNECTED',
      messageBn:
        'AI শিক্ষক এখনো চালু হয়নি — মালিকের অনুমোদনের অপেক্ষায় আছে। আপনার প্রশ্নটি সংরক্ষিত হয়েছে।',
      messageEn:
        'The AI teacher is not live yet — awaiting the owner’s approval. Your question has been saved.',
    };
  },
};

/** The active provider. Today: always the stub. Swap ONLY after owner approval + gateway. */
export const aiProvider: AiProvider = notConnectedProvider;

/**
 * Future Gemini gateway provider — NOT IMPLEMENTED, and it must NOT be
 * implemented as a direct browser call with an embedded key. The real
 * implementation lives behind the Cloud Function gateway (`aiGateway`,
 * Blaze only): the client sends {conversationId, text, language, …} to
 * the function, the function checks the server-side daily cap, builds
 * the prompt (personal data stripped), calls Gemini with the key from
 * Secret Manager, and returns the answer. See the approval package
 * (team/ai-teacher-approval-package.md §2) for the full design.
 *
 * Calling this function today throws — it exists only so the shape of
 * the future config is written down in one place.
 */
export interface GeminiGatewayConfig {
  /** Cloud Function URL — set only after the Blaze gateway is built. */
  gatewayUrl: string;
  /** Model id, e.g. 'gemini-3.5-flash-lite'. Chosen by the owner after the Bangla quality test. */
  model: string;
}

export function createGeminiGatewayProvider(_config: GeminiGatewayConfig): AiProvider {
  throw new Error(
    'Gemini gateway provider is not implemented: no paid AI API is activated, ' +
      'no API key exists, and the owner has not approved the Blaze gateway. ' +
      'See team/ai-teacher-approval-package.md.',
  );
}
