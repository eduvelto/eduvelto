// Eduvelto — server-rendered HTML evidence for CreditCardPayoffTool.
//
// renderToString runs in plain node (no jsdom): it proves the
// balance, APR, payment and target-months inputs render in bn AND
// en, and that the empty initial state shows no result. Calculation
// correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/creditCardPayoff.test.ts.
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
    import('../CreditCardPayoffTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { CreditCardPayoffTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(CreditCardPayoffTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('CreditCardPayoffTool rendered HTML', () => {
  it('renders balance, APR, payment and target-months inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="credit-card-balance"');
    expect(html).toContain('id="credit-card-apr"');
    expect(html).toContain('id="credit-card-payment"');
    expect(html).toContain('id="credit-card-target-months"');
    expect(html).toContain('বকেয়া');
    expect(html).toContain('মাসিক পরিশোধ');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Card balance');
    expect(html).toContain('Monthly payment');
    expect(html).toContain('Load example');
    expect(html).not.toContain('বকেয়া');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
