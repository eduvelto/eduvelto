// Eduvelto — server-rendered HTML evidence for VideoToAudioTool
// (100-Tools Project, second batch).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (video file input + extract button) in bn AND en, that the
// output is honestly labelled WAV (never MP3), and that the empty
// state shows no download link or result. The WAV encoder is covered
// byte-for-byte by the videoToAudio logic tests; in Node there is no
// AudioContext, so the honest unsupported message must show.

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(storedLang?: string): Promise<string> {
  const store: Record<string, string> = {};
  if (storedLang) store['eduvelto-language'] = storedLang;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', search: '', href: 'https://eduvelto.web.app/' },
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
    import('../VideoToAudioTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { VideoToAudioTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(VideoToAudioTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('VideoToAudioTool rendered HTML', () => {
  it('renders the form in Bangla with the output honestly labelled WAV', async () => {
    const html = await renderTool();
    expect(html).toContain('ভিডিও থেকে অডিও নিন');
    expect(html).toContain('ভিডিও ফাইল');
    expect(html).toContain('id="video-to-audio-file"');
    expect(html).toContain('অডিও বের করুন (WAV)');
    expect(html).toContain('WAV');
    expect(html).not.toContain('MP3');
    expect(html).toContain('200 MB');
  });

  it('shows the honest Web Audio-unsupported message where there is no AudioContext', async () => {
    const html = await renderTool();
    expect(html).toContain('Web Audio');
    expect(html).toContain('অন্য ব্রাউজার ব্যবহার করুন');
  });

  it('empty state shows no download link or result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('.wav');
    expect(html).not.toContain('<video');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Extract audio from video');
    expect(html).toContain('Video file');
    expect(html).toContain('Extract audio (WAV)');
    expect(html).toContain('WAV');
    expect(html).not.toContain('MP3');
    expect(html).not.toContain('ভিডিও থেকে অডিও নিন');
  });
});
