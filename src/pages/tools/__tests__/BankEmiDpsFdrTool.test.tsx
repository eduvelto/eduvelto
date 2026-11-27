// Eduvelto — server-rendered HTML evidence for BankEmiDpsFdrTool.
//
// renderToString runs in plain node (no jsdom): it proves the EMI,
// DPS and FDR inputs render in bn AND en, and that the empty
// initial state shows no result. Calculation correctness is covered
// by the pure-logic tests in src/lib/__tests__/tools/bankEmiDpsFdr.test.ts.
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
    import('../BankEmiDpsFdrTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BankEmiDpsFdrTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(BankEmiDpsFdrTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BankEmiDpsFdrTool rendered HTML', () => {
  it('renders the EMI inputs and mode tabs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="bank-loan-amount"');
    expect(html).toContain('id="bank-emi-rate"');
    expect(html).toContain('id="bank-emi-years"');
    expect(html).toContain('লোনের পরিমাণ');
    expect(html).toContain('বার্ষিক সুদের হার');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Loan amount');
    expect(html).toContain('Annual interest rate');
    expect(html).toContain('Load example');
    expect(html).not.toContain('লোনের পরিমাণ');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
