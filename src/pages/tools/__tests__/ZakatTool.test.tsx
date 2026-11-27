// Eduvelto — server-rendered HTML evidence for ZakatTool.
//
// renderToString runs in plain node (no jsdom): it proves the cash /
// gold / silver / business / debts inputs, the user-entered price
// inputs and the nisab-basis selector render in bn AND en, and that
// the empty initial state shows no result (no price is ever
// prefilled). Calculation correctness is covered by the pure-logic
// tests in src/lib/__tests__/tools/zakat.test.ts.
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
    import('../ZakatTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { ZakatTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(ZakatTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('ZakatTool rendered HTML', () => {
  it('renders all asset, price and nisab inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="zakat-cash"');
    expect(html).toContain('id="zakat-gold-grams"');
    expect(html).toContain('id="zakat-gold-price"');
    expect(html).toContain('id="zakat-silver-grams"');
    expect(html).toContain('id="zakat-silver-price"');
    expect(html).toContain('id="zakat-business"');
    expect(html).toContain('id="zakat-debts"');
    expect(html).toContain('id="zakat-nisab"');
    expect(html).toContain('নগদ টাকা');
    expect(html).toContain('সোনার দাম');
    expect(html).toContain('রুপার দাম');
    expect(html).toContain('নিসাবের ভিত্তি');
    expect(html).toContain('সোনা (৮৫ গ্রাম)');
    expect(html).toContain('রুপা (৫৯৫ গ্রাম)');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Cash in hand / bank');
    expect(html).toContain('Gold price (per gram)');
    expect(html).toContain('Silver price (per gram)');
    expect(html).toContain('Nisab basis');
    expect(html).toContain('Gold (85 grams)');
    expect(html).toContain('Silver (595 grams)');
    expect(html).not.toContain('নগদ টাকা');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('যাকাত দিতে হবে');
  });
});
