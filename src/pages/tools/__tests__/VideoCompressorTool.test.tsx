// Eduvelto — server-rendered HTML evidence for VideoCompressorTool
// (100-Tools Project, second batch).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (video file input + SD/HD choice + compress action) in bn AND
// en, that the output is honestly labelled WebM (never MP4), and that
// the empty state shows no download link or result. The async compress
// logic is covered by the videoCompressor logic tests; in Node there
// is no MediaRecorder, so the honest unsupported message must show.

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
    import('../VideoCompressorTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { VideoCompressorTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(VideoCompressorTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('VideoCompressorTool rendered HTML', () => {
  it('renders the form in Bangla with SD selected and WebM labelled honestly', async () => {
    const html = await renderTool();
    expect(html).toContain('ভিডিও ছোট করুন');
    expect(html).toContain('ভিডিও ফাইল');
    expect(html).toContain('id="video-compress-file"');
    expect(html).toContain('SD — 480p, ফ্রি');
    expect(html).toContain('HD — 720p');
    expect(html).toContain('WebM');
    expect(html).not.toContain('MP4');
    expect(html).toContain('সর্বোচ্চ ফাইল সাইজ');
    expect(html).toContain('200 MB');
  });

  it('shows the honest MediaRecorder-unsupported message where there is no MediaRecorder', async () => {
    const html = await renderTool();
    expect(html).toContain('MediaRecorder');
    expect(html).toContain('অন্য ব্রাউজার ব্যবহার করুন');
  });

  it('empty state shows no download link or result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('.webm');
    expect(html).not.toContain('<video');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Compress video');
    expect(html).toContain('Video file');
    expect(html).toContain('SD — 480p, free');
    expect(html).toContain('HD — 720p');
    expect(html).toContain('WebM');
    expect(html).not.toContain('ভিডিও ছোট করুন');
  });
});
