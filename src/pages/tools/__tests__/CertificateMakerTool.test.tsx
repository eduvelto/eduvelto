// Eduvelto — server-rendered HTML evidence for CertificateMakerTool.
//
// renderToString runs in plain node (no jsdom): it proves the form
// (recipient / course / date / occasion — issuer is FIXED to Eduvelto
// since 28 Nov 2026, corrected spec: no issuer-name input, no
// person's name, no signature) renders in bn AND en, that the empty
// state shows no preview, and that the download path is the
// <RewardedAdButton> (Free Download live, Unlock disabled). The
// certificate is drawn by the SHARED renderer in
// src/lib/certificate.ts — one premium design, no template selector
// (templates removed 28 Nov 2026). Pure shaping / validation /
// date logic is covered by src/lib/__tests__/tools/certificateMaker.test.ts.
// Rendering is covered only by source smoke checks: the component
// must load qrcode via dynamic import() and never import jspdf
// statically (the PDF comes from the shared downloadCertificatePdf).
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
    // Corrected spec (28 Nov 2026): no issuer input at all.
    expect(html).not.toContain('id="cert-issuer"');
    expect(html).not.toContain('প্রদানকারী প্রতিষ্ঠান');
    expect(html).toContain('id="cert-date"');
    expect(html).toContain('id="cert-occasion"');
    // Customization panel (28 Nov 2026): achievement line + theme.
    expect(html).toContain('id="cert-achievement"');
    expect(html).toContain('id="cert-theme"');
    expect(html).toContain('অর্জনের লাইন');
    expect(html).toContain('সোনালি ও নেভি');
    expect(html).toContain('টিল ও সোনালি');
    expect(html).toContain('মেরুন ও সোনালি');
    // One premium design only (28 Nov 2026): no template selector.
    expect(html).not.toContain('id="cert-template"');
    expect(html).not.toContain('ক্লাসিক');
    expect(html).not.toContain('মডার্ন');
    expect(html).not.toContain('মিনিমাল');
    expect(html).toContain('প্রাপকের নাম');
    expect(html).toContain('কোর্স / অনুষ্ঠানের নাম');
    expect(html).toContain('প্রদানকারী: Eduvelto');
    expect(html).toContain('তারিখ');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Recipient name');
    expect(html).toContain('Course / event title');
    expect(html).not.toContain('Issuer name');
    expect(html).toContain('Issued by: Eduvelto');
    expect(html).toContain('Achievement line');
    // '&' is HTML-escaped in the serialized option text.
    expect(html).toContain('Gold &amp; Navy');
    expect(html).toContain('Teal &amp; Gold');
    expect(html).toContain('Maroon &amp; Gold');
    expect(html).not.toContain('Classic');
    expect(html).not.toContain('Modern');
    expect(html).not.toContain('Minimal');
    expect(html).not.toContain('প্রাপকের নাম');
  });

  it('empty initial state shows no preview and no download button', async () => {
    const html = await renderTool();
    expect(html).not.toContain('প্রিভিউ');
    // The intro copy mentions "ফ্রি ডাউনলোড" in prose, so pin the
    // absence of the actual button instead of the phrase.
    expect(html).not.toContain('<button');
  });

  it('uses the shared certificate renderer with a dynamic QR import, never a static jspdf import', () => {
    const src = readFileSync(
      new URL('../CertificateMakerTool.tsx', import.meta.url),
      'utf8',
    );
    expect(src).toContain('drawQuizCertificateCanvas');
    expect(src).toContain('buildMakerCertificateData');
    expect(src).toContain('downloadCertificatePdf');
    expect(src).toContain('downloadCanvasPng');
    expect(src).toContain("await import('qrcode')");
    expect(src).not.toMatch(/from\s+'jspdf'/);
    expect(src).not.toMatch(/import\s+.*\s+from\s+'jspdf'/);
    expect(src).toContain('RewardedAdButton');
    // Customizations flow into the shared renderer (preview canvas
    // and download are the same canvas): the achievement line and
    // the theme are passed to buildMakerCertificateData and the
    // preview re-renders when either changes.
    expect(src).toContain('achievementLine');
    expect(src).toContain('CERTIFICATE_THEMES');
    expect(src).toContain("{ achievementLine: achievementLine.trim(), theme }");
    expect(src).toContain('achievementLine, theme]);');
    // One design only: no template selector, no old 2338×1654 canvas.
    expect(src).not.toContain('cert-template');
    expect(src).not.toContain('CertificateTemplate');
    expect(src).not.toContain('2338');
    expect(src).not.toContain('getCertificateTemplateStyle');
  });

  it('offers a PDF / PNG format choice with 30s / 15s rewarded durations', () => {
    const src = readFileSync(
      new URL('../CertificateMakerTool.tsx', import.meta.url),
      'utf8',
    );
    expect(src).toContain('id="cert-format-pdf"');
    expect(src).toContain('id="cert-format-png"');
    expect(src).toContain("durationSeconds={format === 'pdf' ? 30 : 15}");
  });
});
