// Eduvelto — server-rendered HTML evidence for BudgetPlannerTool.
//
// renderToString runs in plain node (no jsdom): it proves the income
// and five expense-category inputs render in bn AND en, and that the
// empty initial state shows no result. Calculation correctness is
// covered by the pure-logic tests in
// src/lib/__tests__/tools/budgetPlanner.test.ts.
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
    import('../BudgetPlannerTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BudgetPlannerTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(BudgetPlannerTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BudgetPlannerTool rendered HTML', () => {
  it('renders income and all five category inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="budget-income"');
    expect(html).toContain('id="budget-housing"');
    expect(html).toContain('id="budget-food"');
    expect(html).toContain('id="budget-transport"');
    expect(html).toContain('id="budget-utilities"');
    expect(html).toContain('id="budget-other"');
    expect(html).toContain('মাসিক আয়');
    expect(html).toContain('বাসস্থান');
    expect(html).toContain('খাবার');
    expect(html).toContain('যাতায়াত');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Monthly income');
    expect(html).toContain('Housing');
    expect(html).toContain('Food');
    expect(html).toContain('Transport');
    expect(html).toContain('Utilities');
    expect(html).not.toContain('মাসিক আয়');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
