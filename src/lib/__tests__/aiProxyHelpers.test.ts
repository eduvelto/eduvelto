// Unit tests — Cloudflare Worker pure helpers (../workers/ai-proxy/src/helpers.ts).
// No Worker runtime needed: these functions are pure.

import { describe, it, expect } from 'vitest';
import {
  validateChatRequest,
  mapProviderStatus,
  shouldRetryProviderStatus,
  buildSystemPrompt,
  buildGeminiRequest,
  parseGeminiReply,
} from '../../../workers/ai-proxy/src/helpers';

describe('validateChatRequest', () => {
  it('accepts a short Bangla question', () => {
    const r = validateChatRequest({ messages: [{ role: 'user', text: 'কেমন আছো?' }], lang: 'bn' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.lang).toBe('bn');
  });

  it('defaults lang to bn when omitted or unknown', () => {
    const r = validateChatRequest({ messages: [{ role: 'user', text: 'hi' }] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.lang).toBe('bn');
  });

  it('rejects empty messages, bad roles and overlong text', () => {
    expect(validateChatRequest({ messages: [] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: 'system', text: 'x' }] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: 'user', text: '   ' }] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: 'user', text: 'a'.repeat(2001) }] }).ok).toBe(false);
    expect(validateChatRequest({ messages: 'not-an-array' }).ok).toBe(false);
    expect(validateChatRequest(null).ok).toBe(false);
  });

  it('rejects more than 20 messages', () => {
    const messages = Array.from({ length: 21 }, () => ({ role: 'user' as const, text: 'hi' }));
    expect(validateChatRequest({ messages }).ok).toBe(false);
  });
});

describe('mapProviderStatus', () => {
  it('maps 429 to quota-exhausted and everything else to provider-error', () => {
    expect(mapProviderStatus(429)).toBe('quota-exhausted');
    expect(mapProviderStatus(500)).toBe('provider-error');
    expect(mapProviderStatus(400)).toBe('provider-error');
  });
});

describe('shouldRetryProviderStatus (audit M1)', () => {
  it('retries once on 429 and 5xx, never on 4xx or a second attempt', () => {
    expect(shouldRetryProviderStatus(429, 1)).toBe(true);
    expect(shouldRetryProviderStatus(500, 1)).toBe(true);
    expect(shouldRetryProviderStatus(503, 1)).toBe(true);
    expect(shouldRetryProviderStatus(400, 1)).toBe(false);
    expect(shouldRetryProviderStatus(404, 1)).toBe(false);
    expect(shouldRetryProviderStatus(429, 2)).toBe(false);
    expect(shouldRetryProviderStatus(503, 2)).toBe(false);
  });
});

describe('buildSystemPrompt', () => {
  it('says the assistant is an AI and must not invent answers (both languages)', () => {
    expect(buildSystemPrompt('bn')).toMatch(/তুমি AI/);
    expect(buildSystemPrompt('bn')).toMatch(/বানিয়ে উত্তর দেবে না/);
    expect(buildSystemPrompt('en')).toMatch(/You are an AI/);
    expect(buildSystemPrompt('en')).toMatch(/never invent an answer/);
  });
});

describe('buildGeminiRequest + parseGeminiReply', () => {
  it('maps user/assistant roles to Gemini user/model roles', () => {
    const req = buildGeminiRequest({
      messages: [
        { role: 'user', text: 'প্রশ্ন' },
        { role: 'assistant', text: 'উত্তর' },
      ],
      lang: 'bn',
    });
    const contents = req.contents as { role: string; parts: { text: string }[] }[];
    expect(contents[0].role).toBe('user');
    expect(contents[1].role).toBe('model');
    expect((req.system_instruction as { parts: { text: string }[] }).parts[0].text).toContain('Eduvelto');
  });

  it('sends no temperature — gemini-3.5-flash-lite does not support a custom temperature (audit M1)', () => {
    const req = buildGeminiRequest({ messages: [{ role: 'user', text: 'hi' }], lang: 'en' });
    const config = req.generationConfig as Record<string, unknown>;
    expect(config).not.toHaveProperty('temperature');
    expect(config.maxOutputTokens).toBe(1024);
  });

  it('extracts reply text and returns null for empty/malformed replies', () => {
    const good = {
      candidates: [{ content: { parts: [{ text: 'উত্তর।' }, { text: ' আরও।' }] } }],
    };
    expect(parseGeminiReply(good)).toBe('উত্তর। আরও।');
    expect(parseGeminiReply({ candidates: [] })).toBe(null);
    expect(parseGeminiReply({ candidates: [{ content: { parts: [{ text: '  ' }] } }] })).toBe(null);
    expect(parseGeminiReply(null)).toBe(null);
    expect(parseGeminiReply('string')).toBe(null);
  });
});
