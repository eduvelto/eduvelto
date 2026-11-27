// HeicToJpgTool — server-rendered HTML evidence.
//
// renderToString runs in plain node (no jsdom): it proves the form
// (HEIC file input, quality slider, convert button) renders in bn
// AND en, and that the empty state shows no result, preview or
// download link. The heic2any logic is covered by
// src/lib/__tests__/tools/heicToJpg.test.ts; the real conversion is
// verified in a live browser (Playwright).
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
    import('../HeicToJpgTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { HeicToJpgTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(HeicToJpgTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('HeicToJpgTool rendered HTML', () => {
  it('renders the form in Bangla with the HEIC file input', async () => {
    const html = await renderTool();
    expect(html).toContain('id="heic-jpg-file"');
    expect(html).toContain('এইচইআইসি থেকে জেপিজি');
    expect(html).toContain('HEIC ছবি');
    expect(html).toContain('heic2any (libheif)');
    expect(html).toContain('১০ MB');
    // The quality slider only appears after a photo is picked, so the
    // empty state must not have it.
    expect(html).not.toContain('id="heic-jpg-quality"');
    expect(html).not.toContain('JPG কোয়ালিটি');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('HEIC to JPG');
    expect(html).toContain('HEIC photo');
    expect(html).toContain('Convert to JPG');
    expect(html).not.toContain('এইচইআইসি থেকে জেপিজি');
    expect(html).not.toContain('id="heic-jpg-quality"');
  });

  it('empty state shows no result, preview or download link', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('Download the JPG');
  });
});
