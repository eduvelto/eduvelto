// Eduvelto — server-rendered HTML evidence for PdfToWordTool.
//
// renderToString runs in plain node (no jsdom): it proves the file
// input, both font selectors (6 Bangla + 4 English options), the
// SutonnyMJ note, the honest font/layout notes and the privacy note
// render in bn AND en. Conversion correctness is covered by the
// pure-logic tests in src/lib/__tests__/tools/pdfToWord.test.ts.
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
    import('../PdfToWordTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { PdfToWordTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(PdfToWordTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

/** Render any element inside the LanguageProvider (same window mock). */
async function renderWithProvider(
  element: React.ReactElement,
  stored?: string | null,
): Promise<string> {
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
  // No vi.resetModules() here: the component under test was imported
  // by the caller AFTER its own reset, and LanguageContext must come
  // from that same module registry — resetting again would give the
  // Provider a different context instance than the component's
  // useLanguage reads, and the render would silently fall back to bn.
  const ctxMod = await import('../../../i18n/LanguageContext');
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(React.createElement(LanguageProvider, null, element));
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

const FAKE_EXTRACTED = {
  pageCount: 1,
  pages: [{ pageNumber: 1, lines: ['আমি বাংলা শিখছি।', 'ক্ষ জ্ঞ স্ত ষ্ট ন্ত', 'Hello World 2026'] }],
  totalChars: 42,
};
const FAKE_RESULT = { url: 'blob:fake-docx', name: 'report', bytes: 12345 };

describe('PdfToWordTool rendered HTML', () => {
  it('renders the file input and both font selectors in Bangla', async () => {
    const html = await renderTool();
    expect(html).toContain('id="pdf-word-file"');
    expect(html).toContain('id="pdf-word-bn-font"');
    expect(html).toContain('id="pdf-word-en-font"');
    expect(html).toContain('পিডিএফ থেকে ওয়ার্ড');
    expect(html).toContain('বাংলা ফন্ট');
    expect(html).toContain('ইংরেজি ফন্ট');
    // All 6 Bangla font options.
    for (const font of ['Noto Sans Bengali', 'SolaimanLipi', 'Siyam Rupali', 'SutonnyMJ', 'Nikosh', 'Kalpurush']) {
      expect(html).toContain(`value="${font}"`);
    }
    // All 4 English font options.
    for (const font of ['Times New Roman', 'Calibri', 'Arial', 'Georgia']) {
      expect(html).toContain(`value="${font}"`);
    }
    // Honest notes: on-device processing + font-name fallback + layout best-effort.
    expect(html).toContain('আপনার ডিভাইসেই প্রক্রিয়া হয়');
    expect(html).toContain('ফন্টের নাম লেখা থাকে');
    expect(html).toContain('হুবহু আসবে না');
    expect(html).not.toContain('<h1');
  });

  it('renders the same selectors and honest notes in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('id="pdf-word-file"');
    expect(html).toContain('id="pdf-word-bn-font"');
    expect(html).toContain('id="pdf-word-en-font"');
    expect(html).toContain('PDF to Word');
    expect(html).toContain('Bangla font');
    expect(html).toContain('English font');
    expect(html).toContain('Processed on your device');
    expect(html).toContain('the font name is stored in the file');
    expect(html).toContain('will not convert exactly');
    expect(html).not.toContain('<h1');
  });

  it('defaults to Noto Sans Bengali + Times New Roman', async () => {
    const html = await renderTool();
    // The select's current value renders as the selected option.
    expect(html).toContain('value="Noto Sans Bengali" selected');
    expect(html).toContain('value="Times New Roman" selected');
  });

  it('says conversion is free and the download is free while ads cannot load', async () => {
    const html = await renderTool();
    expect(html).toContain('রূপান্তর সম্পূর্ণ বিনামূল্যে');
    expect(html).toContain('AdSense এখনো review-এ আছে');
    const htmlEn = await renderTool('en');
    expect(htmlEn).toContain('Conversion is completely free');
    expect(htmlEn).toContain('AdSense is still in review');
  });
});

describe('PdfToWordPreview (watermarked)', () => {
  it('shows the real converted text under a diagonal Eduvelto watermark, unselectable', async () => {
    vi.resetModules();
    const { PdfToWordPreview } = await import('../PdfToWordPreview');
    const html = await renderWithProvider(
      React.createElement(PdfToWordPreview, {
        lines: ['আমি বাংলা শিখছি।', 'Hello World 2026'],
        totalLines: 2,
        banglaFont: 'Noto Sans Bengali',
        englishFont: 'Times New Roman',
      }),
    );
    // Real converted content is visible for verification…
    expect(html).toContain('আমি বাংলা শিখছি।');
    expect(html).toContain('Hello World 2026');
    // …under the watermark overlay…
    expect(html).toContain('data-preview-watermark="eduvelto"');
    expect(html).toContain('Eduvelto');
    // …with selection disabled on the preview container.
    expect(html).toContain('data-preview="pdf-to-word"');
    expect(html).toContain('user-select:none');
    // The download is clean — the preview says so.
    expect(html).toContain('ডাউনলোড করা ফাইলে কোনো ওয়াটারমার্ক থাকে না');
  });

  it('notes the remaining lines and the SutonnyMJ Unicode preview', async () => {
    vi.resetModules();
    const { PdfToWordPreview } = await import('../PdfToWordPreview');
    const lines = Array.from({ length: 15 }, (_, i) => `লাইন ${i + 1}`);
    const html = await renderWithProvider(
      React.createElement(PdfToWordPreview, {
        lines,
        totalLines: 15,
        banglaFont: 'SutonnyMJ',
        englishFont: 'Times New Roman',
      }),
      'en',
    );
    expect(html).toContain('3 more line(s)');
    expect(html).toContain('The preview shows Unicode text');
    expect(html).toContain('converts it to Bijoy encoding for SutonnyMJ');
  });
});

describe('PdfToWordResult (download flow)', () => {
  it('no-fill path: free download live, unlock disabled, honest note — bn', async () => {
    vi.resetModules();
    const { PdfToWordResult } = await import('../PdfToWordTool');
    const html = await renderWithProvider(
      React.createElement(PdfToWordResult, {
        extracted: FAKE_EXTRACTED,
        result: FAKE_RESULT,
        banglaFont: 'Noto Sans Bengali',
        englishFont: 'Times New Roman',
        convertedRuns: 0,
        onDownload: () => {},
      }),
    );
    // Headline + tiles + watermarked preview render.
    expect(html).toContain('Word ফাইল তৈরি হয়েছে');
    expect(html).toContain('data-preview-watermark="eduvelto"');
    // Free Download is the live action…
    expect(html).toContain('ফ্রি ডাউনলোড');
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>ফ্রি ডাউনলোড/);
    // …the 30s-ad unlock is present but disabled, with honest copy…
    expect(html).toContain('আনলক করুন (৩০ সেকেন্ডের বিজ্ঞাপন দেখুন)');
    expect(html).toMatch(/<button[^>]*disabled[^>]*>আনলক করুন/);
    expect(html).toContain('AdSense review-এ আছে');
    // …and the note says the download is free for now, no fake timer.
    expect(html).toContain('বিজ্ঞাপন এখনো চালু হয়নি');
    expect(html).toContain('কোনো ভুয়া টাইমার নেই');
  });

  it('no-fill path: same download flow in English', async () => {
    vi.resetModules();
    const { PdfToWordResult } = await import('../PdfToWordTool');
    const html = await renderWithProvider(
      React.createElement(PdfToWordResult, {
        extracted: FAKE_EXTRACTED,
        result: FAKE_RESULT,
        banglaFont: 'Noto Sans Bengali',
        englishFont: 'Times New Roman',
        convertedRuns: 0,
        onDownload: () => {},
      }),
      'en',
    );
    expect(html).toContain('Word file created');
    expect(html).toContain('Free Download');
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>Free Download/);
    expect(html).toContain('Unlock (Watch 30s Ad)');
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Unlock \(Watch 30s Ad\)/);
    expect(html).toContain('AdSense is under review');
    expect(html).toContain('no fake timer');
  });
});
