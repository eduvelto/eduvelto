// Eduvelto — server-rendered HTML evidence for the hero-band
// greeting, v5 (owner revision 24 Nov 2026 08:31).
//
// v5: a clean FULL-WIDTH borderless strip below the nav — NO pill,
// NO border, NO decoration, NO animation, NO timer, NO Arabic
// phase. One static line: the translation in the user's chosen
// language (header toggle's tabLang: Bangla by default, English
// when set to English). Attribution follows the same language.
// No Bismillah anywhere in the band.
//
// renderToString runs in plain node (no jsdom): it proves what markup
// the strip produces on first paint — the translation in the current
// language, the attribution in that language, and ZERO Arabic,
// ZERO Bismillah, ZERO decoration elements. Effects do not run under
// renderToString, but v5 has no timer at all — the language-toggle
// behaviour is verified by the Playwright probe on the preview host
// instead.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import HeroGreeting, {
  HERO_GREETING_ATTR,
  HERO_GREETING_ATTR_BN,
  HERO_GREETING_ATTR_EN,
  HERO_GREETING_BN,
  HERO_GREETING_EN,
  getHeroGreetingTranslation,
} from '../HeroGreeting';
import { LanguageContext, type LanguageState } from '../../i18n/LanguageContext';

// The Bismillah in Arabic script (with diacritics) and in words.
// v5 must contain NONE of these anywhere in the band.
const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
// The Arabic ayah itself (v3/v4 first phase) — v5 has NO Arabic phase.
const AYAH_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';

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

describe('HeroGreeting v5 rendered HTML', () => {
  it('renders the Bangla translation by default (no stored language)', () => {
    const html = renderHero();
    expect(HERO_GREETING_BN).toBe('পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।');
    expect(html).toContain(HERO_GREETING_BN);
    expect(html).toContain(
      'class="ev-hero-greeting-line ev-hero-greeting-line-bn"',
    );
    expect(html).toContain('lang="bn"');
    expect(html).toContain(HERO_GREETING_ATTR_BN);
    // The English translation is NOT rendered when Bangla is the setting.
    expect(html).not.toContain(HERO_GREETING_EN);
    expect(html).not.toContain(HERO_GREETING_ATTR_EN);
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
    // 641px) and shown inline on desktop — one line is the hard rule.
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

  it('renders exactly ONE line: no Arabic phase, no cycling, no decoration', () => {
    const html = renderHero();
    expect(html.match(/ev-hero-greeting-line /g)).toHaveLength(1);
    expect(html).toContain('class="ev-hero-greeting"');
    // No phase machinery in the markup.
    expect(html).not.toContain('data-active');
    expect(html).not.toContain('ev-hero-greeting-sweep');
    expect(html).not.toContain('ev-hero-greeting-line-ar');
    expect(html).not.toContain('lang="ar"');
    expect(html).not.toContain('dir="rtl"');
    expect(html).not.toContain(AYAH_AR);
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
});
