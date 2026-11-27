// Eduvelto — server-rendered HTML evidence for VideoTrimmerTool
// (100-Tools Project, second batch).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (video file input + start/end number inputs and sliders +
// trim button) in bn AND en, that the output is honestly labelled
// WebM, and that the empty state shows no download link or result.
// The async trim logic is covered by the videoTrimmer logic tests.

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
    import('../VideoTrimmerTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { VideoTrimmerTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(VideoTrimmerTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('VideoTrimmerTool rendered HTML', () => {
  it('renders the form in Bangla with start/end inputs and sliders', async () => {
    const html = await renderTool();
    expect(html).toContain('ভিডিও কাটুন');
    expect(html).toContain('ভিডিও ফাইল');
    expect(html).toContain('id="video-trim-file"');
    expect(html).toContain('শুরু (সেকেন্ড)');
    expect(html).toContain('শেষ (সেকেন্ড)');
    expect(html).toContain('id="video-trim-start"');
    expect(html).toContain('id="video-trim-end"');
    expect(html).toContain('id="video-trim-start-range"');
    expect(html).toContain('id="video-trim-end-range"');
    expect(html).toContain('কাটুন');
    expect(html).toContain('WebM');
    expect(html).toContain('200 MB');
  });

  it('empty state shows no download link or result, and start/end are disabled without a video', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('.webm');
    expect(html).not.toContain('<video');
    expect(html).toContain('disabled');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Trim video');
    expect(html).toContain('Video file');
    expect(html).toContain('Start (seconds)');
    expect(html).toContain('End (seconds)');
    expect(html).toContain('WebM');
    expect(html).not.toContain('ভিডিও কাটুন');
  });
});
