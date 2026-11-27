// Eduvelto — server-rendered HTML evidence for DictionaryTool.
//
// renderToString runs in plain node (no jsdom): it proves the search
// input renders in bn AND en, and that the empty initial state shows
// no result list. Lookup correctness is covered by the pure-logic
// tests in src/lib/__tests__/tools/dictionary.test.ts.
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
    import('../DictionaryTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { DictionaryTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(DictionaryTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('DictionaryTool rendered HTML', () => {
  it('renders the search input in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="dictionary-query"');
    expect(html).toContain('শব্দ খুঁজুন');
    expect(html).toContain('অভিধান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Search a word');
    expect(html).toContain('Dictionary (Bangla–English)');
    expect(html).not.toContain('শব্দ খুঁজুন');
  });

  it('empty initial state shows no result list', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
  });
});
