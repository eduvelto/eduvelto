// Eduvelto — server-rendered HTML evidence for SscHscGpaTool.
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (6 main-subject selects + 4th-subject select) in bn AND en,
// and that the empty initial state shows no result. Calculation
// correctness is covered by the pure-logic tests in
// src/lib/__tests__/tools/sscHscGpa.test.ts.
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
    import('../SscHscGpaTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { SscHscGpaTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(SscHscGpaTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('SscHscGpaTool rendered HTML', () => {
  it('renders 6 main-subject selects + 4th-subject select in Bangla', async () => {
    const html = await renderTool();
    for (let i = 1; i <= 6; i++) expect(html).toContain(`id="gpa-main-${i}"`);
    expect(html).toContain('id="gpa-fourth"');
    expect(html).toContain('মূল বিষয়');
    expect(html).toContain('চতুর্থ বিষয়');
    expect(html).toContain('গ্রেড বেছে নিন');
    expect(html).toContain('value="A+"');
    expect(html).toContain('5.00');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Main subject');
    expect(html).toContain('4th subject');
    expect(html).toContain('Choose a grade');
    expect(html).not.toContain('মূল বিষয়');
  });

  it('empty initial state shows no result and no error', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('জিপিএ:');
  });
});
