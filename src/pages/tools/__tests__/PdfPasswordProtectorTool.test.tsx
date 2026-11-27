// PdfPasswordProtectorTool — server-rendered HTML evidence.
//
// renderToString runs in plain node (no jsdom): it proves the form
// (PDF file input, password + confirm + owner fields, protect button)
// renders in bn AND en, and that the empty state shows no result and
// no download link. The QPDF logic is covered by
// src/lib/__tests__/tools/pdfPasswordProtector.test.ts; the real
// encryption is verified in a live browser (Playwright).
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
    import('../PdfPasswordProtectorTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { PdfPasswordProtectorTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(PdfPasswordProtectorTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('PdfPasswordProtectorTool rendered HTML', () => {
  it('renders the form in Bangla with password fields', async () => {
    const html = await renderTool();
    expect(html).toContain('id="pdf-protect-file"');
    expect(html).toContain('id="pdf-protect-password"');
    expect(html).toContain('id="pdf-protect-confirm"');
    expect(html).toContain('id="pdf-protect-owner"');
    expect(html).toContain('পিডিএফ পাসওয়ার্ড প্রোটেক্টর');
    expect(html).toContain('পাসওয়ার্ড (খুলতে লাগবে)');
    expect(html).toContain('পাসওয়ার্ড আবার লিখুন');
    expect(html).toContain('AES-256');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('PDF Password Protector');
    expect(html).toContain('Password (needed to open)');
    expect(html).toContain('Type the password again');
    expect(html).toContain('Protect PDF');
    expect(html).not.toContain('পিডিএফ পাসওয়ার্ড প্রোটেক্টর');
  });

  it('empty state shows no result or download link', async () => {
    const html = await renderTool();
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('protected.pdf');
    expect(html).not.toContain('Download the protected PDF');
  });
});
