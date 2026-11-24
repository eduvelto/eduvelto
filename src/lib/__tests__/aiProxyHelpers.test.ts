// Unit tests — Cloudflare Worker pure helpers (../workers/ai-proxy/src/helpers.ts).
// No Worker runtime needed: these functions are pure.

import { describe, it, expect } from 'vitest';
import {
  validateChatRequest,
  mapProviderStatus,
  buildSystemPrompt,
  buildGeminiRequest,
  parseGeminiReply,
  buildWrittenFeedbackSystemPrompt,
  validateWrittenFeedbackContext,
} from '../../../workers/ai-proxy/src/helpers';

const FEEDBACK_CONTEXT = {
  questionText: 'Write a paragraph on "Your Aim in Life".',
  answerType: 'paragraph',
  rubric: [
    { dimension: 'structure', weight: 25 },
    { dimension: 'language', weight: 25 },
    { dimension: 'content', weight: 30 },
    { dimension: 'spelling', weight: 10 },
    { dimension: 'presentation', weight: 10 },
  ],
  submittedText: 'My aim in life is to become a teacher.',
};

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
      mode: 'chat',
    });
    const contents = req.contents as { role: string; parts: { text: string }[] }[];
    expect(contents[0].role).toBe('user');
    expect(contents[1].role).toBe('model');
    expect((req.system_instruction as { parts: { text: string }[] }).parts[0].text).toContain('Eduvelto');
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

describe('written-feedback mode (Phase 2/Later — code only, stub stays disabled)', () => {
  it('accepts mode written-feedback only with a valid structured context', () => {
    const ok = validateChatRequest({
      messages: [{ role: 'user', text: 'ফিডব্যাক দাও' }],
      mode: 'written-feedback',
      context: FEEDBACK_CONTEXT,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.mode).toBe('written-feedback');
      expect(ok.value.context?.answerType).toBe('paragraph');
    }
    expect(validateChatRequest({ messages: [{ role: 'user', text: 'x' }], mode: 'written-feedback' }).ok).toBe(false);
    expect(
      validateChatRequest({ messages: [{ role: 'user', text: 'x' }], mode: 'written-feedback', context: { ...FEEDBACK_CONTEXT, rubric: [] } }).ok,
    ).toBe(false);
  });

  it('rejects any identity field in the context (no uid/name/email/phone)', () => {
    for (const forbidden of ['uid', 'userId', 'name', 'email', 'phone']) {
      expect(validateWrittenFeedbackContext({ ...FEEDBACK_CONTEXT, [forbidden]: 'x' }).ok).toBe(false);
    }
    expect(validateWrittenFeedbackContext({ ...FEEDBACK_CONTEXT, submittedText: 'a'.repeat(2001) }).ok).toBe(false);
    expect(validateWrittenFeedbackContext({ ...FEEDBACK_CONTEXT, rubric: [{ dimension: 'x', weight: 101 }] }).ok).toBe(false);
  });

  it('routes written-feedback to the feedback system prompt with the rubric + student text as data', () => {
    const req = buildGeminiRequest({
      messages: [{ role: 'user', text: 'ফিডব্যাক দাও' }],
      lang: 'bn',
      mode: 'written-feedback',
      context: FEEDBACK_CONTEXT,
    });
    const system = (req.system_instruction as { parts: { text: string }[] }).parts[0].text;
    expect(system).toContain('AI সহায়ক মূল্যায়ন');
    expect(system).toContain('একটিমাত্র সামগ্রিক শতাংশ কখনো দেবে না');
    expect(system).toContain('যাচাইকৃত / যাচাই দরকার / ভুল / যাচাই অসম্ভব');
    expect(system).toContain('এটাই একমাত্র সঠিক উত্তর');
    const contents = req.contents as { role: string; parts: { text: string }[] }[];
    expect(contents[0].parts[0].text).toContain('My aim in life is to become a teacher.');
    expect(contents[0].parts[0].text).toContain('structure: 25');
  });

  it('feedback prompt (both languages) denies official marks and guaranteed questions', () => {
    const bn = buildWrittenFeedbackSystemPrompt('bn');
    expect(bn).toContain('সরকারি নম্বর নয়');
    expect(bn).toContain('নিশ্চিত কমন');
    const en = buildWrittenFeedbackSystemPrompt('en');
    expect(en).toContain('not official marks');
    expect(en).toContain('guaranteed to appear');
    expect(en).toContain('never one overall percentage');
  });
});
