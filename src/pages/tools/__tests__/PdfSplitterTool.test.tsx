// Eduvelto — server-rendered HTML evidence for PdfSplitterTool
// (100-Tools Project, Phase 2, Wave 3).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (PDF file input + page-selection input + split button) in bn
// AND en, and that the empty state shows no download link and no
// bogus result. The async split logic is covered by the pdfSplitter
// logic tests; this file covers the UI wiring only.

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(storedLang?: string): Promise<string> {
  const store: Record<string, string> = {};
  if (storedLang) store['eduvelto-language'] = storedLang;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', search: '', href: 'https://eduvelto.web.app/' },
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
    import('../PdfSplitterTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { PdfSplitterTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(PdfSplitterTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('PdfSplitterTool rendered HTML', () => {
  it('renders the form in Bangla with the selection hint', async () => {
    const html = await renderTool();
    expect(html).toContain('পিডিএফ ভাগ করুন');
    expect(html).toContain('পিডিএফ ফাইল');
    expect(html).toContain('পাতা বাছাই');
    expect(html).toContain('1,3-5');
    expect(html).toContain('id="pdf-split-file"');
    expect(html).toContain('id="pdf-split-selection"');
    expect(html).toContain('ভাগ করুন');
    expect(html).toContain('আপলোড হয় না');
  });

  it('empty state shows no download link and no result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('split-pages.pdf');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Split PDF');
    expect(html).toContain('PDF file');
    expect(html).toContain('Page selection');
    expect(html).not.toContain('পিডিএফ ভাগ করুন');
  });
});
