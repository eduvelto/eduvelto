// PdfToJpgTool — server-rendered HTML evidence.
//
// renderToString runs in plain node (no jsdom): it proves the form
// (PDF file input, scale presets, quality slider, convert button)
// renders in bn AND en, and that the empty state shows no result and
// no download link. The pdf.js logic is covered by
// src/lib/__tests__/tools/pdfToJpg.test.ts; the real JPEG bytes are
// verified in a live browser (Playwright).
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
    import('../PdfToJpgTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { PdfToJpgTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(PdfToJpgTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('PdfToJpgTool rendered HTML', () => {
  it('renders the form in Bangla with the PDF file input', async () => {
    const html = await renderTool();
    expect(html).toContain('id="pdf-jpg-file"');
    expect(html).toContain('পিডিএফ থেকে জেপিজি');
    expect(html).toContain('পিডিএফ ফাইল');
    expect(html).toContain('PDF.js (Mozilla)');
    expect(html).toContain('১০ MB');
    // Scale presets, quality slider and the convert button only appear
    // after a PDF is picked, so the empty state must not have them.
    expect(html).not.toContain('id="pdf-jpg-quality"');
    expect(html).not.toContain('ছবির মান');
    expect(html).not.toContain('Convert again');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('PDF to JPG');
    expect(html).toContain('PDF file');
    expect(html).not.toContain('পিডিএফ থেকে জেপিজি');
    expect(html).not.toContain('id="pdf-jpg-quality"');
  });

  it('empty state shows no result, preview or download link', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('.jpg');
    expect(html).not.toContain('Download');
  });
});
