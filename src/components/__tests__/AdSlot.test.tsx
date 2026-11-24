// Eduvelto — server-rendered HTML evidence for AdSlot (Hybrid Ad
// Strategy, owner brief 23 Nov 2026 21:52).
//
// renderToString runs in plain node (no jsdom): it proves what markup
// each slot produces — the exam small banner's 50px cap (retained code
// path only — no route returns it since the 23 Nov exam rule), the
// labelled preview placeholder, and that production renders NOTHING
// while the master switch is off. The window hostname is swapped per
// scenario with a fresh module import (the component reads it at render
// time). The slot follows the selected language (24 Nov 2026 language
// system), so renders are wrapped in LanguageProvider with a faked
// window (same pattern as LanguageContext.test.tsx).
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import type { AdPlacement } from '../../lib/ads';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const PREVIEW_HOST = 'eduvelto--ads-placements-abc123.web.app';
const PRODUCTION_HOST = 'eduvelto.web.app';

async function renderSlot(
  hostname: string,
  placement: AdPlacement,
  opts: { stored?: string | null } = {},
): Promise<string> {
  const store: Record<string, string> = {};
  if (opts.stored) store['eduvelto-language'] = opts.stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname, search: '', href: `https://${hostname}/` },
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
  const [slotMod, ctxMod] = await Promise.all([
    import('../AdSlot'),
    import('../../i18n/LanguageContext'),
  ]);
  const AdSlot = slotMod.default;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(AdSlot, { placement })),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('AdSlot rendered HTML', () => {
  it('exam small banner: labelled placeholder, capped at 50px, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'bottom-banner-small');
    expect(html).toContain('data-ad-placement="bottom-banner-small"');
    expect(html).toContain('বিজ্ঞাপনের স্থান');
    expect(html).toContain('৫০px');
    expect(html).toContain('max-height:50px');
    expect(html).not.toContain('adsbygoogle');
  });

  it('full banner: labelled placeholder, NOT capped at 50px, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'bottom-banner');
    expect(html).toContain('data-ad-placement="bottom-banner"');
    expect(html).toContain('বিজ্ঞাপনের স্থান');
    expect(html).not.toContain('max-height:50px');
    expect(html).not.toContain('adsbygoogle');
  });

  it('top banner: labelled placeholder with the 728×90 size, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'top-banner');
    expect(html).toContain('data-ad-placement="top-banner"');
    expect(html).toContain('৭২৮×৯০');
    expect(html).not.toContain('adsbygoogle');
  });

  it('sidebar: placeholder inside the desktop-only wrapper, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'sidebar');
    expect(html).toContain('ev-ad-slot-sidebar');
    expect(html).toContain('৩০০×২৫০');
    expect(html).not.toContain('adsbygoogle');
  });

  it('in-content-2: labelled placeholder with the 300×250 size, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'in-content-2');
    expect(html).toContain('data-ad-placement="in-content-2"');
    expect(html).toContain('বিজ্ঞাপনের স্থান');
    expect(html).toContain('ইন-কনটেন্ট ২');
    expect(html).toContain('৩০০×২৫০');
    expect(html).not.toContain('adsbygoogle');
  });

  it('placeholder labels follow the selected language (English)', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'top-banner', { stored: 'en' });
    expect(html).toContain('Ad space');
    expect(html).toContain('Top banner');
    expect(html).toContain('728×90');
    expect(html).not.toContain('বিজ্ঞাপনের স্থান');
  });

  it('renders NOTHING on the production host while the master switch is off', async () => {
    const html = await renderSlot(PRODUCTION_HOST, 'bottom-banner');
    expect(html).toBe('');
    const examHtml = await renderSlot(PRODUCTION_HOST, 'bottom-banner-small');
    expect(examHtml).toBe('');
    const topHtml = await renderSlot(PRODUCTION_HOST, 'top-banner');
    expect(topHtml).toBe('');
  });

  it('accepts an onUnfilled callback without changing the rendered markup', async () => {
    // Effects never run under renderToString, so the callback is never
    // invoked here — this proves the prop is accepted and the markup
    // is unchanged. The live collapse → callback → nav-drop behaviour
    // is verified by the Playwright probe (local preview: real AdSense
    // answers unfilled; live after deploy).
    (globalThis as unknown as { window: unknown }).window = {
      location: { hostname: PREVIEW_HOST },
    };
    vi.resetModules();
    const mod = await import('../AdSlot');
    const AdSlot = mod.default;
    try {
      const html = renderToString(
        React.createElement(AdSlot, {
          placement: 'bottom-banner' as AdPlacement,
          onUnfilled: () => {},
        }),
      );
      expect(html).toContain('data-ad-placement="bottom-banner"');
      expect(html).toContain('বিজ্ঞাপনের স্থান');
    } finally {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });
});
