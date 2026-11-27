// Eduvelto — server-rendered HTML evidence for BijoyToUnicodeTool.
//
// renderToString runs in plain node (no jsdom): it proves the
// textarea in/out, direction toggle and copy button render in bn AND
// en, with Bijoy -> Unicode as the initial direction. Conversion
// correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/bijoy.test.ts.
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
    import('../BijoyTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BijoyToUnicodeTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(BijoyToUnicodeTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BijoyToUnicodeTool rendered HTML', () => {
  it('renders input/output textareas, direction toggle and copy button in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="bijoy-input"');
    expect(html).toContain('id="bijoy-output"');
    expect(html).toContain('বিজয় লেখা');
    expect(html).toContain('ইউনিকোড লেখা');
    expect(html).toContain('বিজয় → ইউনিকোড');
    expect(html).toContain('ইউনিকোড → বিজয়');
    expect(html).toContain('ফল কপি করুন');
    expect(html).toContain('মুছুন');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Bijoy text');
    expect(html).toContain('Unicode text');
    expect(html).toContain('Bijoy → Unicode');
    expect(html).toContain('Copy result');
    expect(html).not.toContain('বিজয় লেখা');
  });

  it('empty input shows an empty output, not a bogus conversion', async () => {
    const html = await renderTool();
    expect(html).toContain('id="bijoy-output"');
    // The output textarea renders with no content between its tags.
    expect(html).toMatch(/id="bijoy-output"[^>]*><\/textarea>/);
    // The copy button is disabled while there is nothing to copy.
    expect(html).toContain('disabled');
  });
});
