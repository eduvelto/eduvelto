// Eduvelto — server-rendered HTML evidence for BkashNagadTool.
//
// renderToString runs in plain node (no jsdom): it proves the amount,
// provider, method and user-entered rate inputs render in bn AND en,
// and that the empty initial state shows no result (no rate is ever
// stated as a fact). Calculation correctness is covered by the
// pure-logic tests in src/lib/__tests__/tools/bkashNagad.test.ts.
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
    import('../BkashNagadTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BkashNagadTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(BkashNagadTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BkashNagadTool rendered HTML', () => {
  it('renders amount, provider, method and rate inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="bkash-nagad-amount"');
    expect(html).toContain('id="bkash-nagad-provider"');
    expect(html).toContain('id="bkash-nagad-method"');
    expect(html).toContain('id="bkash-nagad-rate"');
    expect(html).toContain('টাকার পরিমাণ');
    expect(html).toContain('চার্জের হার');
    expect(html).toContain('বিকাশ');
    expect(html).toContain('নগদ');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Amount');
    expect(html).toContain('Charge rate');
    expect(html).toContain('bKash');
    expect(html).toContain('Nagad');
    expect(html).toContain('Provider');
    expect(html).toContain('Method');
    expect(html).not.toContain('টাকার পরিমাণ');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
