// Eduvelto — server-rendered HTML evidence for CompoundInterestTool.
//
// renderToString runs in plain node (no jsdom): it proves the
// principal, monthly contribution, rate, term and target inputs
// render in bn AND en, and that the empty initial state shows no
// result. Calculation correctness is covered by the pure-logic
// tests in src/lib/__tests__/tools/compoundInterest.test.ts.
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
    import('../CompoundInterestTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { CompoundInterestTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(CompoundInterestTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('CompoundInterestTool rendered HTML', () => {
  it('renders principal, monthly, rate, term and target inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="compound-principal"');
    expect(html).toContain('id="compound-monthly"');
    expect(html).toContain('id="compound-rate"');
    expect(html).toContain('id="compound-years"');
    expect(html).toContain('id="compound-target"');
    expect(html).toContain('শুরুর টাকা');
    expect(html).toContain('মাসিক জমা');
    expect(html).toContain('বার্ষিক হার');
    expect(html).toContain('মেয়াদ');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Starting amount');
    expect(html).toContain('Monthly contribution');
    expect(html).toContain('Annual rate');
    expect(html).toContain('Term (years)');
    expect(html).toContain('Load example');
    expect(html).not.toContain('শুরুর টাকা');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
