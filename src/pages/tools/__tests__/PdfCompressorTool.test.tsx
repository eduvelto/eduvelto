// Eduvelto — server-rendered HTML evidence for PdfCompressorTool
// (100-Tools Project, Phase 2, Wave 3).
//
// renderToString runs in plain node (no jsdom): it proves the form
// renders (PDF file input + compress button) in bn AND en, and that
// the empty state shows no download link and no bogus before/after
// sizes. The async compress logic is covered by the pdfCompressor
// logic tests; this file covers the UI wiring only — including the
// "Custom size" chip (owner order, 27 Nov 2026): it renders visibly
// alongside the presets in both languages, the target inputs stay
// hidden until it is picked, and the target-visible state (the exact
// state the chip's click handler sets, rendered here via the
// component's initialTargetEnabled entry point) shows the number
// field + KB/MB selector. There is no jsdom in this repo, so the
// click itself is not simulated; the engine's honest target-met /
// target-missed states are covered by pdfCompressor.test.ts.

import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(storedLang?: string, initialTargetEnabled = false): Promise<string> {
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
    import('../PdfCompressorTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { PdfCompressorTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    // JSX (not React.createElement): createElement's overloads do not
    // accept props on a component whose props parameter has a default
    // value, while JSX checks the same component fine.
    return renderToString(
      <LanguageProvider>
        <PdfCompressorTool initialTargetEnabled={initialTargetEnabled} />
      </LanguageProvider>,
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('PdfCompressorTool rendered HTML', () => {
  it('renders the form in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('পিডিএফ ছোট করুন');
    expect(html).toContain('পিডিএফ ফাইল');
    expect(html).toContain('id="pdf-compress-file"');
    expect(html).toContain('ছোট করুন');
    expect(html).toContain('আপলোড হয় না');
    // Customizable options (owner order, 27 Nov 2026): presets, level,
    // image quality, DPI and target-size mode render with the form.
    // Defaults are Balanced / Web (quality 70, DPI 150).
    expect(html).toContain('প্রিসেট');
    expect(html).toContain('কমপ্রেশন লেভেল');
    expect(html).toContain('id="pdf-compress-quality"');
    expect(html).toContain('id="pdf-compress-dpi"');
    // "Custom size" sits visibly alongside the presets — not behind a
    // toggle — and the target inputs stay hidden until it is picked.
    expect(html).toContain('ইমেইল (সবচেয়ে ছোট)');
    expect(html).toContain('ওয়েব');
    expect(html).toContain('প্রিন্ট মান');
    expect(html).toContain('কাস্টম সাইজ');
    expect(html).not.toContain('id="pdf-compress-target"');
    expect(html).toContain('লক্ষ্য দিলে টুলটি মান ধাপে ধাপে কমিয়ে');
    expect(html).toContain('value="70"');
    expect(html).toContain('value="150"');
  });

  it('shows the target number + unit inputs in the Custom-size state (Bangla)', async () => {
    const html = await renderTool(undefined, true);
    expect(html).toContain('কাস্টম সাইজ');
    expect(html).toContain('id="pdf-compress-target"');
    expect(html).toContain('type="number"');
    expect(html).toContain('placeholder="500"');
    expect(html).toContain('>KB<');
    expect(html).toContain('>MB<');
    expect(html).toContain('লক্ষ্য আকার');
  });

  it('shows the target number + unit inputs in the Custom-size state (English)', async () => {
    const html = await renderTool('en', true);
    expect(html).toContain('Custom size');
    expect(html).toContain('id="pdf-compress-target"');
    expect(html).toContain('type="number"');
    expect(html).toContain('placeholder="500"');
    expect(html).toContain('>KB<');
    expect(html).toContain('>MB<');
    expect(html).toContain('Target size');
  });

  it('empty state shows no download link and no result', async () => {
    const html = await renderTool();
    expect(html).not.toContain('compressed.pdf');
    expect(html).not.toContain('ডাউনলোড করুন');
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });

  it('follows the selected language (English)', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Compress PDF');
    expect(html).toContain('PDF file');
    expect(html).not.toContain('পিডিএফ ছোট করুন');
    expect(html).toContain('Presets');
    expect(html).toContain('Compression level');
    expect(html).toContain('Image quality');
    expect(html).toContain('Max image resolution');
    // "Custom size" sits visibly alongside the presets — not behind a
    // toggle — and the target inputs stay hidden until it is picked.
    expect(html).toContain('Email (smallest)');
    expect(html).toContain('Web');
    expect(html).toContain('Print quality');
    expect(html).toContain('Custom size');
    expect(html).not.toContain('id="pdf-compress-target"');
  });
});
