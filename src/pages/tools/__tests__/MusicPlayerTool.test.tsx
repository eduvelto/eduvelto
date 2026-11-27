// Eduvelto — server-rendered HTML evidence for MusicPlayerTool
// (100-Tools Project, second batch).
//
// renderToString runs in plain node (no jsdom): it proves the player
// renders (multi audio file input + Play/Pause/Next/Previous + seek
// and volume sliders) in bn AND en, and that the empty state shows
// no playlist and no selected song. Playlist logic is covered by the
// musicPlayer logic tests.

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
    import('../MusicPlayerTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { MusicPlayerTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(MusicPlayerTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('MusicPlayerTool rendered HTML', () => {
  it('renders the player in Bangla with transport controls and sliders', async () => {
    const html = await renderTool();
    expect(html).toContain('গান শুনুন');
    expect(html).toContain('গানের ফাইল');
    expect(html).toContain('id="music-player-files"');
    expect(html).toContain('multiple');
    expect(html).toContain('আগেরটি');
    expect(html).toContain('চালান');
    expect(html).toContain('পরেরটি');
    expect(html).toContain('id="music-player-seek"');
    expect(html).toContain('id="music-player-volume"');
    expect(html).toContain('ভলিউম');
    expect(html).toContain('কোনো গান বাছা হয়নি');
    expect(html).toContain('আপলোড হয় না');
  });

  it('empty state shows no playlist', async () => {
    const html = await renderTool();
    expect(html).not.toContain('প্লেলিস্ট');
    expect(html).not.toContain('সব মুছুন');
    expect(html).not.toContain('<ul');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Music player');
    expect(html).toContain('Audio files');
    expect(html).toContain('Previous');
    expect(html).toContain('Play');
    expect(html).toContain('Next');
    expect(html).toContain('Volume');
    expect(html).toContain('No song selected');
    expect(html).not.toContain('গান শুনুন');
  });
});
