// Eduvelto — server-rendered HTML evidence for VideoFormatConverterTool
// (100-Tools Project, second batch).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (video file input + output-format select + convert button)
// in bn AND en, and — the key honesty point — that the supported
// formats are stated BEFORE the user starts. In Node there is no
// MediaRecorder, so the page must report that nothing is supported
// here rather than offering a fake conversion. The detection logic
// itself is covered by the videoFormatConverter logic tests.

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
    import('../VideoFormatConverterTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { VideoFormatConverterTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(VideoFormatConverterTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('VideoFormatConverterTool rendered HTML', () => {
  it('renders the form in Bangla and states what this browser supports before starting', async () => {
    const html = await renderTool();
    expect(html).toContain('ভিডিওর ধরন বদলান');
    expect(html).toContain('ভিডিও ফাইল');
    expect(html).toContain('id="video-convert-file"');
    expect(html).toContain('আউটপুট ধরন');
    expect(html).toContain('id="video-convert-format"');
    expect(html).toContain('রূপান্তর করুন');
    expect(html).toContain('এই ব্রাউজারে যা করা যায়');
    expect(html).toContain('200 MB');
  });

  it('reports honestly that nothing is supported where there is no MediaRecorder', async () => {
    const html = await renderTool();
    expect(html).toContain('কিছুই না');
    expect(html).toContain('MediaRecorder');
    expect(html).toContain('কোনো ধরন নেই');
  });

  it('empty state shows no download link or converted result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('.webm');
    expect(html).not.toContain('<video');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Convert video format');
    expect(html).toContain('Video file');
    expect(html).toContain('Output format');
    expect(html).toContain('What this browser supports');
    expect(html).toContain('Nothing');
    expect(html).not.toContain('ভিডিওর ধরন বদলান');
  });
});
