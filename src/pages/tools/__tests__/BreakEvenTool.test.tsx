// Eduvelto — server-rendered HTML evidence for BreakEvenTool.
//
// renderToString runs in plain node (no jsdom): it proves the fixed
// costs, variable cost, selling price and what-if inputs render in
// bn AND en, and that the empty initial state shows no result.
// Calculation correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/breakEven.test.ts.
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
    import('../BreakEvenTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BreakEvenTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(BreakEvenTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BreakEvenTool rendered HTML', () => {
  it('renders fixed, variable, price and what-if inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="breakeven-fixed"');
    expect(html).toContain('id="breakeven-variable"');
    expect(html).toContain('id="breakeven-price"');
    expect(html).toContain('id="breakeven-target"');
    expect(html).toContain('id="breakeven-units"');
    expect(html).toContain('স্থায়ী খরচ');
    expect(html).toContain('প্রতি ইউনিটের খরচ');
    expect(html).toContain('বিক্রির দাম');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Fixed costs');
    expect(html).toContain('Variable cost per unit');
    expect(html).toContain('Selling price per unit');
    expect(html).toContain('Load example');
    expect(html).not.toContain('স্থায়ী খরচ');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
