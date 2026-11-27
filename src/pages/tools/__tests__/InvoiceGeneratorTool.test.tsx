// Eduvelto — server-rendered HTML evidence for InvoiceGeneratorTool.
//
// renderToString runs in plain node (no jsdom): it proves the business
// / client / tax inputs and the first line-item row render in bn AND
// en, and that the empty initial state shows no result. Totals logic
// is covered by the pure-logic tests in
// src/lib/__tests__/tools/invoice.test.ts.
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
    import('../InvoiceGeneratorTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { InvoiceGeneratorTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(InvoiceGeneratorTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('InvoiceGeneratorTool rendered HTML', () => {
  it('renders business, client, tax and line-item inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="invoice-business"');
    expect(html).toContain('id="invoice-client"');
    expect(html).toContain('id="invoice-tax"');
    expect(html).toContain('id="invoice-item-desc-0"');
    expect(html).toContain('id="invoice-item-qty-0"');
    expect(html).toContain('id="invoice-item-price-0"');
    expect(html).toContain('প্রতিষ্ঠানের নাম');
    expect(html).toContain('গ্রাহকের নাম');
    expect(html).toContain('কর / ভ্যাট');
    expect(html).toContain('আরেকটি আইটেম যোগ করুন');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Business name');
    expect(html).toContain('Client name');
    expect(html).toContain('Tax / VAT');
    expect(html).toContain('Add another item');
    expect(html).not.toContain('প্রতিষ্ঠানের নাম');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
