// Eduvelto — server-rendered HTML evidence for the hero-band
// greeting, v4 (owner revisions 24 Nov 2026 07:11 + 07:14).
//
// v4: a tight small pill (badge-sized) below the nav, Deep Navy #0A1F44
// + gold, TWO phases — Arabic, then the translation in the user's
// chosen language (header toggle's tabLang: Bangla by default, English
// when set to English). Arabic always stays; attribution follows the
// same language. No Bismillah anywhere in the band.
//
// renderToString runs in plain node (no jsdom): it proves what markup
// the band produces on first paint — the active Arabic line, the
// translation line in the current language, the attribution in that
// language, and ZERO Bismillah text. Effects do not run under
// renderToString, so the cycle timer never starts here; the live
// Arabic → translation switch and the language-toggle behaviour are
// verified by the Playwright probe on the preview host instead.
import { describe, expect, it } from 'vitest';
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
  getHeroGreetingTranslation,
  getNextHeroGreetingPhase,
} from '../HeroGreeting';
import { LanguageContext, type LanguageState } from '../../i18n/LanguageContext';

// The Bismillah in Arabic script (with diacritics) and in words.
// v4 must contain NONE of these anywhere in the band.
const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

function renderHero(): string {
  return renderToString(React.createElement(HeroGreeting));
}

function renderHeroAs(lang: 'bn' | 'en'): string {
  const value: LanguageState = {
    lang: 'bn',
    tabLang: lang,
    setLanguage: () => {},
    t: (entry) => entry.bn,
    tTab: (entry) => entry[lang],
  };
  return renderToString(
    React.createElement(
      LanguageContext.Provider,
      { value },
      React.createElement(HeroGreeting),
    ),
  );
}

describe('HeroGreeting v4 rendered HTML', () => {
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

  it('renders the Bangla translation by default (no stored language)', () => {
    const html = renderHero();
    expect(HERO_GREETING_BN).toBe('পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।');
    expect(html).toContain(HERO_GREETING_BN);
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-bn"',
    );
    expect(html).toContain('lang="bn"');
    // The English translation is NOT rendered when Bangla is the setting.
    expect(html).not.toContain(HERO_GREETING_EN);
    expect(html).not.toContain(HERO_GREETING_ATTR_EN);
    // Exactly one line is active; the other is hidden from AT.
    expect(html.match(/data-active="true"/g)).toHaveLength(1);
    expect(html.match(/data-active="false"/g)).toHaveLength(1);
    // aria-hidden="true" ×2: the inactive line + the sweep span.
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
  });

  it('renders the English translation when the language is set to English', () => {
    const html = renderHeroAs('en');
    expect(HERO_GREETING_EN).toBe('Read in the name of your Lord who created.');
    expect(html).toContain(HERO_GREETING_EN);
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-en"',
    );
    expect(html).toContain('lang="en"');
    expect(html).toContain(HERO_GREETING_ATTR_EN);
    // The Bangla translation is NOT rendered when English is the setting.
    expect(html).not.toContain(HERO_GREETING_BN);
    expect(html).not.toContain(HERO_GREETING_ATTR_BN);
  });

  it('carries the attribution in the same language as the translation', () => {
    expect(HERO_GREETING_ATTR_BN).toBe('সূরা আলাক, আয়াত ১।');
    expect(HERO_GREETING_ATTR_EN).toBe('Surah Al-Alaq, Ayah 1.');
    expect(HERO_GREETING_ATTR).toBe(HERO_GREETING_ATTR_BN);
    expect(renderHero()).toContain(HERO_GREETING_ATTR_BN);
    expect(renderHero()).toContain('ev-hero-greeting-attr');
    expect(renderHeroAs('en')).toContain(HERO_GREETING_ATTR_EN);
    // The attribution is hidden on mobile by CSS (display: none under
    // 640px) and shown inline on desktop — one line is the hard rule.
    // The live mobile/desktop split is verified by the Playwright probe.
  });

  it('selects the translation from the language setting (pure selector)', () => {
    expect(getHeroGreetingTranslation('bn')).toEqual({
      text: HERO_GREETING_BN,
      attr: HERO_GREETING_ATTR_BN,
      lang: 'bn',
      lineClass: 'ev-hero-greeting-line-bn',
    });
    expect(getHeroGreetingTranslation('en')).toEqual({
      text: HERO_GREETING_EN,
      attr: HERO_GREETING_ATTR_EN,
      lang: 'en',
      lineClass: 'ev-hero-greeting-line-en',
    });
  });

  it('renders the gold sweep underline element (decorative, aria-hidden)', () => {
    const html = renderHero();
    expect(html).toContain('ev-hero-greeting-sweep');
    // The sweep + the glow pulse + the flowing border gradient are CSS
    // animations on the pill; the live motion is verified by the
    // Playwright probe, and the reduced-motion kill-switch by the
    // reduced-motion render.
  });

  it('contains NO Bismillah anywhere in the band', () => {
    const html = renderHero();
    expect(html).not.toContain(BISMILLAH_AR);
    expect(html).not.toContain('Bismillah');
    expect(html).not.toContain('بِسْمِ');
    expect(renderHeroAs('en')).not.toContain(BISMILLAH_AR);
  });

  it('contains no Assalamu Alaikum and no rotating welcome lines', () => {
    const html = renderHero();
    expect(html).not.toContain('Assalamu Alaikum');
    expect(html).not.toContain('Welcome to Eduvelto');
    expect(html).not.toContain('Learn Something New');
    expect(html).not.toContain('Knowledge Without Boundaries');
  });

  it('is a single-line pill: two lines sharing one grid cell', () => {
    const html = renderHero();
    // Two <p> lines; the CSS stacks them in one grid cell
    // (grid-area 1/1) with white-space: nowrap, so the pill is one
    // line tall. The live 390px fit per phase is measured by the
    // Playwright probe (scrollWidth vs clientWidth), not here.
    expect(html.match(/ev-hero-greeting-line /g)).toHaveLength(2);
    expect(html).toContain('class="ev-hero-greeting"');
  });

  it('v4: the phase machine cycles ar → tr → ar, Arabic longest', () => {
    expect(getNextHeroGreetingPhase('ar')).toBe('tr');
    expect(getNextHeroGreetingPhase('tr')).toBe('ar');
    expect(HERO_GREETING_PHASE_MS).toEqual({ ar: 9000, tr: 6000 });
  });
});
