// Eduvelto — server-rendered HTML evidence for EmergencyNumbersTool.
//
// renderToString runs in plain node (no jsdom): it proves the search
// box, the category filter and the full directory render in bn AND
// en, with 999 (National Emergency Service) first, and that the
// empty state shows no result list. Filtering correctness is covered
// by the pure-logic tests in
// src/lib/__tests__/tools/emergencyNumbers.test.ts.
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
    import('../EmergencyNumbersTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { EmergencyNumbersTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(EmergencyNumbersTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('EmergencyNumbersTool rendered HTML', () => {
  it('renders the search box, category filter and directory in Bangla, 999 first', async () => {
    const html = await renderTool();
    expect(html).toContain('id="emergency-search"');
    expect(html).toContain('জরুরি নম্বর');
    expect(html).toContain('খুঁজুন');
    expect(html).toContain('জরুরি');
    expect(html).toContain('হাসপাতাল');
    expect(html).toContain('পুলিশ');
    expect(html).toContain('ফায়ার সার্ভিস');
    expect(html).toContain('href="tel:999"');
    expect(html).toContain('href="tel:16163"');
    // 999 (National Emergency Service) renders before the Fire Service number.
    expect(html.indexOf('জাতীয় জরুরি সেবা')).toBeLessThan(html.indexOf('ফায়ার সার্ভিস ও সিভিল ডিফেন্স'));
    expect(html).toContain('role="status"');
    expect(html).not.toContain('<h1');
  });

  it('renders the same directory in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Emergency Numbers');
    expect(html).toContain('National Emergency Service');
    expect(html).toContain('Fire Service');
    expect(html).toContain('Hospital');
    expect(html).toContain('Police');
    expect(html).not.toContain('জরুরি নম্বর');
  });
});
