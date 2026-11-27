// Eduvelto — server-rendered HTML evidence for TipCalculatorTool.
//
// renderToString runs in plain node (no jsdom): it proves the bill,
// tip percent (with 5/10/15/20 preset buttons) and people inputs
// render in bn AND en, and that the empty initial state shows no
// result. Calculation correctness is covered by the pure-logic tests
// in src/lib/__tests__/tools/tipCalculator.test.ts.
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
    import('../TipCalculatorTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { TipCalculatorTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(TipCalculatorTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('TipCalculatorTool rendered HTML', () => {
  it('renders bill, tip percent presets and people inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="tip-bill"');
    expect(html).toContain('id="tip-percent"');
    expect(html).toContain('id="tip-people"');
    expect(html).toContain('বিলের পরিমাণ');
    expect(html).toContain('টিপ (%)');
    expect(html).toContain('কতজন ভাগ করবে');
    expect(html).toContain('5<!-- -->%');
    expect(html).toContain('10<!-- -->%');
    expect(html).toContain('15<!-- -->%');
    expect(html).toContain('20<!-- -->%');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Bill amount');
    expect(html).toContain('Tip (%)');
    expect(html).toContain('Number of people');
    expect(html).not.toContain('বিলের পরিমাণ');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
