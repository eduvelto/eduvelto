// Eduvelto — AnnouncementTicker tests (owner 25 Nov 2026 10:03:
// the ticker REPLACES the ayah bar on the homepage, directly below
// the Navigation Menu; owner 25 Nov 18:01: ALL real features in the
// banner, and the ayat in Arabic ONLY).
//
// renderToString runs in plain node (no jsdom — the repo has none),
// so window/document are faked per scenario, exactly like
// LanguageContext.test.tsx. Asserts: the exact Arabic-only ayat,
// ALL our real features + our offers, the links, the 4-copy seamless
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
  TICKER_TRACK_COPIES,
  type AnnouncementTickerItem,
} from '../AnnouncementTicker';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const CSS_SRC = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

// Removed 25 Nov 18:01 (Arabic-only ayat rule) — these strings must
// appear NOWHERE in the rendered ticker, in either language.
const REMOVED_AYAT_BN = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
const REMOVED_AYAT_EN = 'Read in the name of your Lord who created.';
const REMOVED_ATTR_BN = 'সূরা আলাক, আয়াত ১।';
const REMOVED_ATTR_EN = 'Surah Al-Alaq, Ayah 1.';
const REMOVED_AYAT_STRINGS = [REMOVED_AYAT_BN, REMOVED_AYAT_EN, REMOVED_ATTR_BN, REMOVED_ATTR_EN];

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

function featureItems(): Extract<AnnouncementTickerItem, { kind: 'feature' }>[] {
  return ANNOUNCEMENT_TICKER_ITEMS.filter(
    (i): i is Extract<AnnouncementTickerItem, { kind: 'feature' }> => i.kind === 'feature',
  );
}

/** renderToString escapes & as &amp; — several tool titles contain
 *  & ("Mortgage & Home Loan Calculator", "Calorie & TDEE ..."),
 *  so compare against the escaped form. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;');
}

describe('AnnouncementTicker content (owner 25 Nov 10:03 + 18:01)', () => {
  it('shows the Al-Alaq ayah 1 in Arabic ONLY — no translation, no attribution', async () => {
    const html = await renderTicker('bn');
    expect(html).toContain(TICKER_AYAT_AR);
    // The Arabic runs in its own rtl span — never reshaped by the LTR flow.
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    // One ayat item per track copy, and its ONLY span is the Arabic one.
    expect(html.match(/ev-ticker-item-ayat/g)?.length).toBe(TICKER_TRACK_COPIES);
    expect(html).not.toContain('ev-ticker-ayat-text');
    expect(html).not.toContain('ev-ticker-ayat-attr');
    // No Bangla/English translation or attribution anywhere in the ticker.
    for (const removed of REMOVED_AYAT_STRINGS) {
      expect(html).not.toContain(removed);
    }
  });

  it('is Arabic-only in English mode too', async () => {
    const html = await renderTicker('en');
    expect(html).toContain(TICKER_AYAT_AR);
    for (const removed of REMOVED_AYAT_STRINGS) {
      expect(html).not.toContain(removed);
    }
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

  it('rotates ALL our real features, each linked to its page', async () => {
    const features = featureItems();
    // 12 core features + 275 live tools (owner 27 Nov 2026: every
    // feature in the banner, one by one; Lab Test Checker joined at
    // the 27 Nov deploy — owner lifted the MBBS-review gate 12:13;
    // 30 A-tools landed 27 Nov 2026; PDF to Word joined 27 Nov 2026;
    // Math 25 + Text 24 + Converters 21 + Finance/Health 15 + Main 10 batches landed 27 Nov 2026; 28 Nov 2026: the 2 owner-approved
    // duplicate tools (pdf-page-extractor, jpg-to-pdf) were removed, 267 -> 265)
    // = 287 feature items.
    expect(features.length).toBe(287);
    // The 12 core features (first 12, in rotation order).
    const core = features.slice(0, 12);
    expect(core.map((f) => f.id)).toEqual([
      'library',
      'generator',
      'jobs',
      'admissions',
      'daily-quiz',
      'book-search',
      'exams',
      'ai-chat',
      'custom-paper',
      'opportunities',
      'life-services',
      'progress',
    ]);
    const html = await renderTicker('bn');
    for (const f of features) {
      expect(html).toContain(esc(f.bn));
      expect(html).toContain(`href="${f.href}"`);
    }
    // English mode: the same features in English.
    const htmlEn = await renderTicker('en');
    for (const f of features) {
      expect(htmlEn).toContain(esc(f.en));
    }
    // The library item carries the live counts (real numbers only).
    expect(html).toContain('৬০৯টি বই');
    expect(html).toContain('২,৩০৭টি অধ্যায়');
    expect(html).toContain('২৩,২৫৯টি প্রশ্ন');
    expect(htmlEn).toContain('609 books');
    expect(htmlEn).toContain('23,259 questions');
  });

  it('rotates all 275 live tools, one item each — including the Lab Test Checker (owner lifted the MBBS-review gate 27 Nov 12:13)', async () => {
    const { TICKER_TOOL_ITEMS } = await import('../AnnouncementTicker');
    expect(TICKER_TOOL_ITEMS.length).toBe(275);
    // Every tool item links to its real /tools/<slug> page.
    const { TOOLS_META } = await import('../../lib/toolsMeta');
    const liveSlugs = TOOLS_META.map((t) => t.slug);
    expect(liveSlugs.length).toBe(275);
    expect(TICKER_TOOL_ITEMS.map((t) => t.href)).toEqual(
      liveSlugs.map((s) => `/tools/${s}`),
    );
    expect(TICKER_TOOL_ITEMS.map((t) => t.id)).toEqual(
      liveSlugs.map((s) => `tool-${s}`),
    );
    // The Lab Test Checker joined the banner at the 27 Nov deploy
    // (owner lifted the MBBS-review gate 12:13) — it must appear.
    const html = await renderTicker('bn');
    expect(html).toContain('lab-test-result-checker');
    expect(html).toContain('ল্যাব টেস্ট রেজাল্ট চেকার');
    // Spot-check tool items render in both languages.
    expect(html).toContain('পিডিএফ মার্জার');
    expect(html).toContain('href="/tools/pdf-merger"');
    expect(html).toContain('যাকাত ক্যালকুলেটর');
    expect(html).toContain('href="/tools/zakat-calculator"');
    const htmlEn = await renderTicker('en');
    expect(htmlEn).toContain('PDF Merger');
    expect(htmlEn).toContain('Zakat Calculator');
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
  it('scrolls SLOW (480s loop — slowed from 80s when the 140 tools joined, same px/s pace), pauses on hover, and stops under reduced motion', () => {
    expect(CSS_SRC).toContain('ev-ticker-scroll 480s linear infinite');
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
