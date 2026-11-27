// Eduvelto — server-rendered HTML evidence for IncomeTaxTool.
//
// renderToString runs in plain node (no jsdom): it proves the income
// input and the editable slab table render in bn AND en, that the
// dated NBR source label is shown, and that the empty initial state
// shows no result. Calculation correctness is covered by the
// pure-logic tests in src/lib/__tests__/tools/incomeTax.test.ts.
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
    import('../IncomeTaxTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { IncomeTaxTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(IncomeTaxTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('IncomeTaxTool rendered HTML', () => {
  it('renders income input and the editable slab table in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="income-tax-income"');
    expect(html).toContain('বার্ষিক আয়');
    expect(html).toContain('করের ধাপ');
    expect(html).toContain('করমুক্ত');
    expect(html).toContain('উদাহরণ বসান');
    // Dated source label: slabs are editable starting values, never fact.
    expect(html).toContain('জাতীয় রাজস্ব বোর্ড');
    expect(html).toContain('২৭ নভেম্বর ২০২৬');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Annual income');
    expect(html).toContain('Tax slabs');
    expect(html).toContain('Tax-free');
    expect(html).toContain('National Board of Revenue');
    expect(html).toContain('Load example');
    expect(html).not.toContain('বার্ষিক আয়');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
