// Eduvelto — server-rendered HTML evidence for RetirementSavingsTool.
//
// renderToString runs in plain node (no jsdom): it proves the ages,
// savings, monthly contribution, rate and target inputs render in
// bn AND en, and that the empty initial state shows no result.
// Calculation correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/retirementSavings.test.ts.
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
    import('../RetirementSavingsTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { RetirementSavingsTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(RetirementSavingsTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('RetirementSavingsTool rendered HTML', () => {
  it('renders age, savings, monthly, rate and target inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="retirement-current-age"');
    expect(html).toContain('id="retirement-age"');
    expect(html).toContain('id="retirement-savings"');
    expect(html).toContain('id="retirement-monthly"');
    expect(html).toContain('id="retirement-rate"');
    expect(html).toContain('id="retirement-target"');
    expect(html).toContain('বর্তমান বয়স');
    expect(html).toContain('অবসরের বয়স');
    expect(html).toContain('বর্তমান সঞ্চয়');
    expect(html).toContain('মাসিক জমা');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Current age');
    expect(html).toContain('Retirement age');
    expect(html).toContain('Current savings');
    expect(html).toContain('Monthly contribution');
    expect(html).toContain('Load example');
    expect(html).not.toContain('বর্তমান বয়স');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
