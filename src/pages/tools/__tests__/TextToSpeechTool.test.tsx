// Eduvelto — server-rendered HTML evidence for TextToSpeechTool.
//
// renderToString runs in plain node (no jsdom, no speechSynthesis):
// it proves the textarea, voice select, rate/pitch sliders and
// Speak/Stop buttons render in bn AND en, and that the missing
// speechSynthesis is handled with honest copy instead of a crash.
// Voice filtering is covered by the pure-logic tests in
// src/lib/__tests__/tools/textToSpeech.test.ts.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(stored?: string | null): Promise<string> {
  const store: Record<string, string> = {};
  if (stored) store['eduvelto-language'] = stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', pathname: '/', search: '', href: 'https://eduvelto.web.app/' },
    localStorage: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    },
    history: { replaceState: () => {} },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
  vi.resetModules();
  const [toolMod, ctxMod] = await Promise.all([
    import('../TextToSpeechTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { TextToSpeechTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(TextToSpeechTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('TextToSpeechTool rendered HTML', () => {
  it('renders textarea, voice select and sliders in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="tts-text"');
    expect(html).toContain('id="tts-voice"');
    expect(html).toContain('id="tts-rate"');
    expect(html).toContain('id="tts-pitch"');
    expect(html).toContain('যা শুনতে চান লিখুন');
    expect(html).toContain('ভয়েস');
    expect(html).toContain('শুনুন');
    expect(html).toContain('থামান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Text to speak');
    expect(html).toContain('Voice');
    expect(html).toContain('Speak');
    expect(html).toContain('Stop');
    expect(html).not.toContain('যা শুনতে চান লিখুন');
  });

  it('says honestly that voice is unavailable when speechSynthesis is missing', async () => {
    const html = await renderTool();
    expect(html).toContain('role="alert"');
    expect(html).toContain('ভয়েস সুবিধা নেই');
  });
});
