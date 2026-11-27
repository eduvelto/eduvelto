// Eduvelto — server-rendered HTML evidence for ImageResizerTool
// (100-Tools Project, Phase 2, Wave 3).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (image file input + width/height inputs + aspect-lock toggle
// + the three presets + resize button) in bn AND en, and that the
// empty state shows no download link, no preview and no bogus result.
// The async resize logic is covered by the imageResizer logic tests;
// this file covers the UI wiring only.

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
    import('../ImageResizerTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { ImageResizerTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(ImageResizerTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('ImageResizerTool rendered HTML', () => {
  it('renders the form in Bangla with presets and 300×300 defaults', async () => {
    const html = await renderTool();
    expect(html).toContain('ছবির আকার বদলান');
    expect(html).toContain('ছবির ফাইল');
    expect(html).toContain('প্রস্থ (পিক্সেল)');
    expect(html).toContain('উচ্চতা (পিক্সেল)');
    expect(html).toContain('অনুপাত ঠিক রাখুন');
    expect(html).toContain('টেলিটক ছবি (৩০০×৩০০)');
    expect(html).toContain('টেলিটক স্বাক্ষর (৩০০×৮০)');
    expect(html).toContain('পাসপোর্ট ছবি (৬০০×৬০০)');
    expect(html).toContain('id="img-resize-file"');
    expect(html).toContain('id="img-resize-width"');
    expect(html).toContain('id="img-resize-height"');
    expect(html).toContain('value="300"');
    expect(html).toContain('আকার বদলান');
    expect(html).toContain('আপলোড হয় না');
  });

  it('empty state shows no download link, preview or result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('resized.jpg');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('<img');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Resize image');
    expect(html).toContain('Image file');
    expect(html).toContain('Width (pixels)');
    expect(html).toContain('Height (pixels)');
    expect(html).toContain('Keep aspect ratio');
    expect(html).toContain('Teletalk photo (300×300)');
    expect(html).toContain('Teletalk signature (300×80)');
    expect(html).toContain('Passport photo (600×600)');
    expect(html).not.toContain('ছবির আকার বদলান');
  });
});
