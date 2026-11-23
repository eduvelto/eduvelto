// Eduvelto — server-rendered HTML evidence for the hero-band
// greeting, v3 (owner's FORMAL revised brief 24 Nov 2026 00:29).
//
// v3: the top sticky greeting bar is DELETED (the Bismillah/ayah
// appeared twice on the homepage) and this hero band, directly below
// the Navigation Menu, is the ONLY Welcome Bar. It carries Surah
// Al-Alaq's first ayah in THREE languages — Arabic → English →
// Bangla → Arabic — exactly one language and ONE LINE at a time.
// No Bismillah anywhere in the bar, no extra Arabic text, no
// "Assalamu Alaikum", no rotating welcome lines.
//
// renderToString runs in plain node (no jsdom): it proves what markup
// the band produces on first paint — all three lines present (the
// inactive ones aria-hidden), the exact Arabic + English + Bangla
// strings, the attribution inside the Bangla line, and ZERO Bismillah
// text. Effects do not run under renderToString, so the cycle timer
// never starts here; the live Arabic → English → Bangla switch is
// verified by the Playwright probe on the preview host instead.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import HeroGreeting, {
  HERO_GREETING_AR,
  HERO_GREETING_ATTR,
  HERO_GREETING_BN,
  HERO_GREETING_EN,
  HERO_GREETING_PHASE_MS,
  getNextHeroGreetingPhase,
} from '../HeroGreeting';

// The Bismillah in Arabic script (with diacritics) and in words.
// v3 must contain NONE of these anywhere in the band.
const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

function renderHero(): string {
  return renderToString(React.createElement(HeroGreeting));
}

describe('HeroGreeting v3 rendered HTML', () => {
  it('renders the exact Arabic ayah as the active first phase', () => {
    const html = renderHero();
    expect(HERO_GREETING_AR).toBe('اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ');
    expect(html).toContain(HERO_GREETING_AR);
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-ar"',
    );
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('data-active="true"');
  });

  it('renders the exact English and Bangla lines (inactive, aria-hidden)', () => {
    const html = renderHero();
    expect(HERO_GREETING_EN).toBe('Read in the name of your Lord who created.');
    expect(HERO_GREETING_BN).toBe('পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।');
    expect(html).toContain(HERO_GREETING_EN);
    expect(html).toContain(HERO_GREETING_BN);
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-en"',
    );
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-bn"',
    );
    expect(html).toContain('lang="en"');
    expect(html).toContain('lang="bn"');
    // Exactly one line is active; the other two are hidden from AT.
    expect(html.match(/data-active="true"/g)).toHaveLength(1);
    expect(html.match(/data-active="false"/g)).toHaveLength(2);
    // aria-hidden="true" ×3: the two inactive lines + the sweep span.
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(3);
  });

  it('carries the attribution inside the Bangla line', () => {
    const html = renderHero();
    expect(HERO_GREETING_ATTR).toBe('সূরা আলাক, আয়াত ১।');
    expect(html).toContain(HERO_GREETING_ATTR);
    expect(html).toContain('ev-hero-greeting-attr');
    // The attribution is hidden on mobile by CSS (display: none under
    // 640px) and shown inline on desktop — one line is the hard rule.
    // The live mobile/desktop split is verified by the Playwright probe.
  });

  it('renders the gold sweep underline element (decorative, aria-hidden)', () => {
    const html = renderHero();
    expect(html).toContain('ev-hero-greeting-sweep');
    // The sweep + the glow pulse are CSS animations on the band; the
    // live motion is verified by the Playwright probe, and the
    // reduced-motion kill-switch by the reduced-motion render.
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

  it('is a single-line band: three lines sharing one grid cell', () => {
    const html = renderHero();
    // Three <p> lines; the CSS stacks them in one grid cell
    // (grid-area 1/1) with white-space: nowrap, so the band is one
    // line tall. The live 390px fit per phase is measured by the
    // Playwright probe (scrollWidth vs clientWidth), not here.
    expect(html.match(/ev-hero-greeting-line /g)).toHaveLength(3);
    expect(html).toContain('class="ev-hero-greeting"');
  });

  it('v3: the phase machine cycles ar → en → bn → ar, Arabic longest', () => {
    expect(getNextHeroGreetingPhase('ar')).toBe('en');
    expect(getNextHeroGreetingPhase('en')).toBe('bn');
    expect(getNextHeroGreetingPhase('bn')).toBe('ar');
    expect(HERO_GREETING_PHASE_MS).toEqual({ ar: 9000, en: 6000, bn: 6000 });
  });
});
