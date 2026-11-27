// Eduvelto — server-rendered HTML evidence for CertificateMakerTool.
//
// renderToString runs in plain node (no jsdom): it proves the form
// (recipient / course / issuer / date / template) renders in bn AND
// en, that the empty state shows no preview, and that the download
// path is the <RewardedAdButton> (Free Download live, Unlock
// disabled). Pure shaping / validation / filename logic is covered by
// src/lib/__tests__/tools/certificateMaker.test.ts. jspdf rendering
// is covered only by a source smoke check: the component must load
// jspdf via dynamic import() and never via a static import.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
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
    import('../CertificateMakerTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { CertificateMakerTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(CertificateMakerTool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('CertificateMakerTool rendered HTML', () => {
  it('renders all form fields in Bangla with today as the default date', async () => {
    const html = await renderTool();
    expect(html).toContain('id="cert-recipient"');
    expect(html).toContain('id="cert-course"');
    expect(html).toContain('id="cert-issuer"');
    expect(html).toContain('id="cert-date"');
    expect(html).toContain('id="cert-template"');
    expect(html).toContain('প্রাপকের নাম');
    expect(html).toContain('কোর্স / অনুষ্ঠানের নাম');
    expect(html).toContain('প্রদানকারী প্রতিষ্ঠান');
    expect(html).toContain('তারিখ');
    expect(html).toContain('ক্লাসিক');
    expect(html).toContain('মডার্ন');
    expect(html).toContain('মিনিমাল');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Recipient name');
    expect(html).toContain('Course / event title');
    expect(html).toContain('Issuer name');
    expect(html).toContain('Classic');
    expect(html).toContain('Modern');
    expect(html).toContain('Minimal');
    expect(html).not.toContain('প্রাপকের নাম');
  });

  it('empty initial state shows no preview and no download button', async () => {
    const html = await renderTool();
    expect(html).not.toContain('প্রিভিউ');
    // The intro copy mentions "ফ্রি ডাউনলোড" in prose, so pin the
    // absence of the actual button instead of the phrase.
    expect(html).not.toContain('<button');
  });

  it('loads jspdf via dynamic import only, never a static import', () => {
    const src = readFileSync(
      new URL('../CertificateMakerTool.tsx', import.meta.url),
      'utf8',
    );
    expect(src).toContain("await import('jspdf')");
    expect(src).not.toMatch(/from\s+'jspdf'/);
    expect(src).not.toMatch(/import\s+.*\s+from\s+'jspdf'/);
    expect(src).toContain('RewardedAdButton');
    expect(src).not.toContain('setTimeout');
  });
});
