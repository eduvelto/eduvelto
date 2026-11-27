// Eduvelto — server-rendered HTML evidence for BackgroundRemoverTool.
//
// renderToString runs in plain node (no jsdom): it proves the form
// (image file input, background colour picker, tolerance slider,
// remove button) renders in bn AND en, and that the empty state shows
// no preview, no result and no download link. The pixel logic is
// covered by src/lib/__tests__/tools/backgroundRemover.test.ts; the
// canvas work itself needs a real browser.
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
    import('../BackgroundRemoverTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BackgroundRemoverTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(BackgroundRemoverTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BackgroundRemoverTool rendered HTML', () => {
  it('renders the form in Bangla with white default colour and tolerance 20', async () => {
    const html = await renderTool();
    expect(html).toContain('id="bg-file"');
    expect(html).toContain('id="bg-color"');
    expect(html).toContain('id="bg-tolerance"');
    expect(html).toContain('ব্যাকগ্রাউন্ড সরান');
    expect(html).toContain('ছবির ফাইল');
    expect(html).toContain('ব্যাকগ্রাউন্ডের রং');
    expect(html).toContain('সহনশীলতা');
    expect(html).toContain('value="#ffffff"');
    expect(html).toContain('value="20"');
    expect(html).toContain('১০ MB');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Background Remover');
    expect(html).toContain('Image file');
    expect(html).toContain('Background colour');
    expect(html).toContain('Tolerance');
    expect(html).toContain('Remove background');
    expect(html).not.toContain('ব্যাকগ্রাউন্ড সরান');
  });

  it('empty state shows no preview, result or download link', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('background-removed.png');
    expect(html).not.toContain('Download PNG');
  });
});
