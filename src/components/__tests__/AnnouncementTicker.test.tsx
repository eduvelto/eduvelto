// Eduvelto — AnnouncementTicker tests (owner 25 Nov 2026 10:03:
// the ticker REPLACES the ayah bar on the homepage, directly below
// the Navigation Menu).
//
// renderToString runs in plain node (no jsdom — the repo has none),
// so window/document are faked per scenario, exactly like
// LanguageContext.test.tsx. Asserts: the exact ayat strings, our
// offers only (never their stats), the links, the 4-copy seamless
// track, and the respectful-display CSS (slow marquee, reduced
// motion stops it).
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ANNOUNCEMENT_TICKER_ITEMS,
  TICKER_AYAT_AR,
  TICKER_AYAT_ATTR_BN,
  TICKER_AYAT_ATTR_EN,
  TICKER_AYAT_BN,
  TICKER_AYAT_EN,
  TICKER_TRACK_COPIES,
} from '../AnnouncementTicker';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const CSS_SRC = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

function setupWindow(stored: string | null) {
  const store: Record<string, string> = {};
  if (stored) store['eduvelto-language'] = stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: { search: '', href: 'https://eduvelto.com/' },
    localStorage: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    },
    history: { replaceState: () => undefined },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
}

async function renderTicker(stored: string | null): Promise<string> {
  setupWindow(stored);
  vi.resetModules();
  const { LanguageProvider } = await import('../../i18n/LanguageContext');
  const { default: AnnouncementTicker } = await import('../AnnouncementTicker');
  return renderToString(
    React.createElement(LanguageProvider, null, React.createElement(AnnouncementTicker)),
  );
}

describe('AnnouncementTicker content (owner 25 Nov 10:03)', () => {
  it('shows the exact Al-Alaq ayah 1 (Arabic + Bangla + attribution) in Bangla mode', async () => {
    const html = await renderTicker('bn');
    expect(html).toContain(TICKER_AYAT_AR);
    expect(html).toContain(TICKER_AYAT_BN);
    expect(html).toContain(TICKER_AYAT_ATTR_BN);
    // The Arabic runs in its own rtl span — never reshaped by the LTR flow.
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });

  it('shows the English ayat + attribution in English mode', async () => {
    const html = await renderTicker('en');
    expect(html).toContain(TICKER_AYAT_AR);
    expect(html).toContain(TICKER_AYAT_EN);
    expect(html).toContain(TICKER_AYAT_ATTR_EN);
  });

  it('rotates OUR offers only, linked to our pages', async () => {
    const html = await renderTicker('bn');
    expect(html).toContain('সব প্রশ্নপত্রে ৭০% ছাড়ে');
    expect(html).toContain('মাসে ৩টা ফ্রি প্রশ্নপত্র');
    expect(html).toContain('OMR চেক সম্পূর্ণ ফ্রি');
    expect(html).toContain('href="/pricing"');
    expect(html).toContain('href="/question-maker"');
    expect(html).toContain('href="/omr-evaluator"');
    // English mode: the same offer, still with no competitor named.
    const htmlEn = await renderTicker('en');
    expect(htmlEn).toContain('70% off all question papers');
  });

  it('never shows their stats, their brand, or any WhatsApp number', async () => {
    const html = await renderTicker('bn');
    for (const banned of [
      '১২,০০০',
      '12,000',
      '৫ লক্ষ',
      '500,000',
      'Proshnobanai',
      'proshnobanai',
      'Eproshnobank',
      'eproshnobank',
      '8801538264070',
      '8801754267001',
      '8801518926854',
      'wa.me',
    ]) {
      expect(html).not.toContain(banned);
    }
    // The data module itself carries no banned content either.
    expect(JSON.stringify(ANNOUNCEMENT_TICKER_ITEMS)).not.toMatch(
      /১২,০০০|12,000|৫ লক্ষ|Proshnobanai|Eproshnobank|wa\.me|8801/,
    );
  });

  it('renders 4 identical track copies for a seamless loop (only the first is exposed)', async () => {
    expect(TICKER_TRACK_COPIES).toBe(4);
    const html = await renderTicker('bn');
    expect(html.match(/ev-ticker-copy/g)?.length).toBe(4);
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

describe('AnnouncementTicker respectful display (CSS)', () => {
  it('scrolls SLOW (80s loop), pauses on hover, and stops under reduced motion', () => {
    expect(CSS_SRC).toContain('ev-ticker-scroll 80s linear infinite');
    expect(CSS_SRC).toContain('.ev-announcement-ticker:hover .ev-ticker-track');
    expect(CSS_SRC).toContain('animation-play-state: paused');
    expect(CSS_SRC).toContain('translateX(-25%)');
    // Reduced motion: no animation, single static copy.
    const reduced = CSS_SRC.split('prefers-reduced-motion: reduce').slice(1).join('');
    expect(reduced).toContain('.ev-ticker-track');
    expect(reduced).toContain('animation: none');
  });

  it('never distorts the Arabic: no skew/scale/rotate on ticker text', () => {
    // Slice ONLY the ticker block (the file continues with the landing
    // page CSS, whose paper mockup legitimately rotates its Latin
    // watermark — no Arabic lives there).
    const tickerCss = CSS_SRC.slice(
      CSS_SRC.indexOf('.ev-announcement-ticker'),
      CSS_SRC.indexOf('/* Question Maker landing page'),
    );
    expect(tickerCss).not.toMatch(/skew|scale\(|rotate\(/);
  });
});
