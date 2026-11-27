// Eduvelto — server-rendered HTML evidence for SalaryToHourlyTool.
//
// renderToString runs in plain node (no jsdom): it proves the
// amount, period, hours and reverse hourly-rate inputs render in bn
// AND en, and that the empty initial state shows no result.
// Calculation correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/salaryToHourly.test.ts.
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
    import('../SalaryToHourlyTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { SalaryToHourlyTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(SalaryToHourlyTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('SalaryToHourlyTool rendered HTML', () => {
  it('renders amount, period, hours and reverse inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="salary-amount"');
    expect(html).toContain('id="salary-period"');
    expect(html).toContain('id="salary-hours"');
    expect(html).toContain('id="salary-hourly-reverse"');
    expect(html).toContain('বেতনের পরিমাণ');
    expect(html).toContain('বেতনের সময়কাল');
    expect(html).toContain('সপ্তাহে কাজের ঘণ্টা');
    expect(html).toContain('উদাহরণ বসান');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Salary amount');
    expect(html).toContain('Salary period');
    expect(html).toContain('Working hours per week');
    expect(html).toContain('Load example');
    expect(html).not.toContain('বেতনের পরিমাণ');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
