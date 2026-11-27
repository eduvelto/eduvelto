// Eduvelto — server-rendered HTML evidence for ImageCompressorTool
// (100-Tools Project, Phase 2, Wave 3).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (image file input + quality slider + max-dimension input +
// format select + compress button) in bn AND en, and that the empty
// state shows no download link, no preview and no bogus result. The
// async compress logic is covered by the imageCompressor logic tests;
// this file covers the UI wiring only — plus a check that the real DOM
// deps degrade honestly (reject/throw) where there is no DOM, instead
// of faking a canvas encode as proof.

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
    import('../ImageCompressorTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { ImageCompressorTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(ImageCompressorTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('ImageCompressorTool rendered HTML', () => {
  it('renders the form in Bangla with quality 80% and max 1920 defaults', async () => {
    const html = await renderTool();
    expect(html).toContain('ছবি ছোট করুন');
    expect(html).toContain('ছবির ফাইল');
    expect(html).toContain('মান (quality)');
    // renderToString splits "80%" across JSX expressions ("80<!-- -->%"),
    // so pin the slider value instead of the joined label text.
    expect(html).toContain('value="0.8"');
    expect(html).toContain('সবচেয়ে বড় দিক');
    expect(html).toContain('id="img-compress-file"');
    expect(html).toContain('id="img-compress-quality"');
    expect(html).toContain('id="img-compress-maxdim"');
    expect(html).toContain('value="1920"');
    expect(html).toContain('আউটপুট ধরন');
    expect(html).toContain('ছোট করুন');
    expect(html).toContain('আপলোড হয় না');
  });

  it('empty state shows no download link, preview or result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('compressed.jpg');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('<img');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Compress image');
    expect(html).toContain('Image file');
    expect(html).toContain('Quality:');
    expect(html).toContain('Longest side');
    expect(html).toContain('Output format');
    expect(html).not.toContain('ছবি ছোট করুন');
  });
});

describe('realImageDeps — no-DOM behaviour', () => {
  it('exposes real DOM deps, which fail honestly without a DOM (no faked encode)', async () => {
    vi.resetModules();
    const mod = await import('../ImageCompressorTool');
    const deps = mod.realImageDeps();
    expect(typeof deps.loadImage).toBe('function');
    expect(typeof deps.createCanvas).toBe('function');
    // No Image / document in plain node: loading must reject, not resolve
    // a fake image, and canvas creation must throw, not return a stub.
    await expect(deps.loadImage!(new Blob(['x'], { type: 'image/png' }))).rejects.toThrow();
    expect(() => deps.createCanvas!(10, 10)).toThrow();
  });
});
