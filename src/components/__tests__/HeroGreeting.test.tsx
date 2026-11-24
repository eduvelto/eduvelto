// Eduvelto — server-rendered HTML evidence for the hero-band
// greeting, v6 (owner revision 24 Nov 2026 11:31 — SUPERSEDES the
// v5 translation-only mechanism).
//
// v6 restores the v3 cycle on top of the 09:35 wrap fix: Surah
// Al-Alaq's first ayah in Arabic first, then English, then Bangla,
// in rotation (9s / 6s / 6s), exactly ONE Welcome Bar, borderless
// strip, no decoration, no sweep, no Bismillah. The line WRAPS on
// narrow screens (never ellipsis); the full sentence is always
// visible.
//
// renderToString runs in plain node (no jsdom): effects do not run,
// so it proves the FIRST paint — the Arabic phase. The cycle order
// and dwell times are pure functions (tested directly); the live
// ar → en → bn rotation is verified by the Playwright probe on the
// preview host (it samples the bar over a full 21s cycle).
import { afterEach, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import HeroGreeting, {
  HERO_GREETING_AR,
  HERO_GREETING_ATTR,
  HERO_GREETING_ATTR_BN,
  HERO_GREETING_ATTR_EN,
  HERO_GREETING_BN,
  HERO_GREETING_EN,
  HERO_GREETING_PHASE_MS,
  getNextHeroGreetingPhase,
  heroGreetingPrefersReducedMotion,
} from '../HeroGreeting';

// The Bismillah in Arabic script (with diacritics) and in words.
const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

type GlobalWindow = { window?: unknown };

function setWindow(win: unknown) {
  (globalThis as unknown as GlobalWindow).window = win;
}

afterEach(() => {
  delete (globalThis as unknown as GlobalWindow).window;
});

function renderHero(): string {
  return renderToString(React.createElement(HeroGreeting));
}

describe('HeroGreeting v6 rendered HTML (first paint)', () => {
  it('renders the Arabic ayah FIRST (effects do not run under renderToString)', () => {
    const html = renderHero();
    expect(HERO_GREETING_AR).toBe('اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ');
    expect(html).toContain(HERO_GREETING_AR);
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-ar"',
    );
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    // Only the Arabic phase is in the DOM on first paint — the
    // English/Bangla phases render when the cycle reaches them.
    expect(html).not.toContain(HERO_GREETING_EN);
    expect(html).not.toContain(HERO_GREETING_BN);
  });

  it('renders exactly ONE line and ONE bar: no sweep, no decoration', () => {
    const html = renderHero();
    expect(html.match(/ev-hero-greeting-line /g)).toHaveLength(1);
    expect(html).toContain('class="ev-hero-greeting"');
    expect(html).not.toContain('ev-hero-greeting-sweep');
    expect(html).not.toContain('data-active');
  });

  it('contains NO Bismillah anywhere in the band', () => {
    const html = renderHero();
    expect(html).not.toContain(BISMILLAH_AR);
    expect(html).not.toContain('Bismillah');
    expect(html).not.toContain('بِسْمِ');
  });

  it('contains no Assalamu Alaikum and no rotating welcome lines', () => {
    const html = renderHero();
    expect(html).not.toContain('Assalamu Alaikum');
    expect(html).not.toContain('Welcome to Eduvelto');
    expect(html).not.toContain('Learn Something New');
    expect(html).not.toContain('Knowledge Without Boundaries');
  });

  it('keeps the verbatim translation strings + attributions', () => {
    expect(HERO_GREETING_EN).toBe('Read in the name of your Lord who created.');
    expect(HERO_GREETING_BN).toBe('পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।');
    expect(HERO_GREETING_ATTR_BN).toBe('সূরা আলাক, আয়াত ১।');
    expect(HERO_GREETING_ATTR_EN).toBe('Surah Al-Alaq, Ayah 1.');
    expect(HERO_GREETING_ATTR).toBe(HERO_GREETING_ATTR_BN);
  });
});

describe('HeroGreeting v6 cycle (pure phase machine)', () => {
  it('cycles Arabic → English → Bangla → Arabic', () => {
    expect(getNextHeroGreetingPhase('ar')).toBe('en');
    expect(getNextHeroGreetingPhase('en')).toBe('bn');
    expect(getNextHeroGreetingPhase('bn')).toBe('ar');
  });

  it('dwells longest on Arabic (9s), 6s each on English/Bangla', () => {
    expect(HERO_GREETING_PHASE_MS).toEqual({ ar: 9000, en: 6000, bn: 6000 });
  });

  it('reduced motion freezes the cycle (static Arabic)', () => {
    setWindow({ matchMedia: () => ({ matches: true }) });
    expect(heroGreetingPrefersReducedMotion()).toBe(true);
    setWindow({ matchMedia: () => ({ matches: false }) });
    expect(heroGreetingPrefersReducedMotion()).toBe(false);
    setWindow({});
    expect(heroGreetingPrefersReducedMotion()).toBe(false);
  });
});
