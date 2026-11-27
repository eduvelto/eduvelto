// Eduvelto — server-rendered HTML evidence for LandMeasurementTool.
//
// renderToString runs in plain node (no jsdom): it proves the value +
// from/to unit selects and the plot-dimension helper render in bn AND
// en, and that the empty initial state shows no result. Conversion
// correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/landMeasurement.test.ts.
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
    import('../LandMeasurementTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { LandMeasurementTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(LandMeasurementTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('LandMeasurementTool rendered HTML', () => {
  it('renders value + from/to unit selects and the plot helper in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="land-value"');
    expect(html).toContain('id="land-from"');
    expect(html).toContain('id="land-to"');
    expect(html).toContain('id="land-length"');
    expect(html).toContain('id="land-width"');
    expect(html).toContain('জমির পরিমাণ');
    expect(html).toContain('থেকে (একক)');
    expect(html).toContain('এতে (একক)');
    expect(html).toContain('প্লটের মাপ থেকে ক্ষেত্রফল');
    expect(html).toContain('দৈর্ঘ্য (ফুট)');
    expect(html).toContain('প্রস্থ (ফুট)');
    expect(html).toContain('শতক');
    expect(html).toContain('কাঠা');
    expect(html).toContain('বিঘা');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Land area');
    expect(html).toContain('From (unit)');
    expect(html).toContain('To (unit)');
    expect(html).toContain('Plot area from dimensions');
    expect(html).toContain('Length (feet)');
    expect(html).toContain('Width (feet)');
    expect(html).toContain('Decimal');
    expect(html).toContain('Katha');
    expect(html).toContain('Bigha');
    expect(html).not.toContain('জমির পরিমাণ');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    // No all-units table renders before a value is entered.
    expect(html).not.toContain('<table');
  });
});
