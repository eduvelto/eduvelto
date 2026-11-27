// Eduvelto — server-rendered HTML evidence for NuCgpaTool.
//
// renderToString runs in plain node (no jsdom): it proves the course
// rows (grade select + credit input), add/remove controls and the
// result region render in bn AND en. Calculation correctness is
// covered by the pure-logic tests in src/lib/__tests__/tools/nuCgpa.test.ts.
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
    import('../NuCgpaTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { NuCgpaTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(NuCgpaTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('NuCgpaTool rendered HTML', () => {
  it('renders 3 course rows with grade selects + credit inputs in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="cgpa-grade-1"');
    expect(html).toContain('id="cgpa-credit-1"');
    expect(html).toContain('id="cgpa-grade-3"');
    expect(html).toContain('id="cgpa-credit-3"');
    expect(html).toContain('ক্রেডিট');
    expect(html).toContain('কোর্স যোগ করুন');
    expect(html).toContain('মুছুন');
    expect(html).toContain('value="A+"');
    expect(html).toContain('4.00');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Credit');
    expect(html).toContain('Add course');
    expect(html).toContain('Remove');
    expect(html).not.toContain('ক্রেডিট');
  });

  it('initial rows are valid, so the result region shows CGPA 3.75 over 9 credits', async () => {
    // 3 rows x grade A (3.75) x 3 credits -> CGPA 3.75, total credits 9.
    const html = await renderTool();
    expect(html).toContain('role="status"');
    expect(html).toContain('সিজিপিএ:');
    expect(html).toContain('3.75');
    expect(html).toContain('মোট ক্রেডিট:');
    const htmlEn = await renderTool('en');
    expect(htmlEn).toContain('CGPA:');
    expect(htmlEn).toContain('Total credits:');
  });
});
