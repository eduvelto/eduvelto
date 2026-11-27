// Eduvelto — server-rendered HTML evidence for MortgageTool.
//
// renderToString runs in plain node (no jsdom): it proves the home
// price, down payment, rate, term and reverse-budget inputs render
// in bn AND en, and that the empty initial state shows no result.
// Calculation correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/mortgage.test.ts.
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
    import('../MortgageTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { MortgageTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(MortgageTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('MortgageTool rendered HTML', () => {
  it('renders price, down payment, rate, term and budget inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="mortgage-home-price"');
    expect(html).toContain('id="mortgage-down-payment"');
    expect(html).toContain('id="mortgage-rate"');
    expect(html).toContain('id="mortgage-years"');
    expect(html).toContain('id="mortgage-budget"');
    expect(html).toContain('বাড়ির দাম');
    expect(html).toContain('ডাউন পেমেন্ট');
    expect(html).toContain('সুদের হার');
    expect(html).toContain('মেয়াদ');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Home price');
    expect(html).toContain('Down payment');
    expect(html).toContain('Annual interest rate');
    expect(html).toContain('Term (years)');
    expect(html).toContain('Load example');
    expect(html).not.toContain('বাড়ির দাম');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
