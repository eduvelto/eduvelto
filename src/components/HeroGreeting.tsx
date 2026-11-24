// Eduvelto — homepage hero-band greeting, v5 (owner revision 24 Nov 2026
// 08:31 — SUPERSEDES v4).
//
// v5 replaces the v4 pill: the owner rejected the pill ("sundor
// dekacce na", the border "sundor lagtece na") and asked for NO
// border and NO decoration — just the translation, in Bangla when
// Bangla is the setting, in English when English, written stylishly.
// So v5 is a clean FULL-WIDTH strip directly below the nav:
// no pill, no rounded corners, no border, no gradient, no glow,
// no sweep, no animation, no timer, no cycling, NO Arabic phase.
// One static line: the translation in the user's chosen language
// (the header toggle's tabLang: Bangla by default, English when
// set to English), with the attribution in the same language.
// It changes instantly when the toggle changes (React re-render,
// no timer). Kept from v4: home-only (only HomePage mounts it),
// NO Bismillah, app brand colours, dark mode correct.
//
// Strings (brief 00:29 — verbatim, never re-translate):
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/strings';

export const HERO_GREETING_EN = 'Read in the name of your Lord who created.';
export const HERO_GREETING_BN = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
export const HERO_GREETING_ATTR_BN = 'সূরা আলাক, আয়াত ১।';
export const HERO_GREETING_ATTR_EN = 'Surah Al-Alaq, Ayah 1.';
// Back-compat: the Bangla attribution (default language).
export const HERO_GREETING_ATTR = HERO_GREETING_ATTR_BN;

export type HeroGreetingTranslation = {
  text: string;
  attr: string;
  lang: Lang;
  lineClass: string;
};

/**
 * Pure selector: the line shows the user's chosen language — the
 * same `tabLang` the header language toggle reads and writes
 * (localStorage `eduvelto-language`, account preference
 * `users.language`; default 'bn' when nothing is stored).
 */
export function getHeroGreetingTranslation(
  tabLang: Lang,
): HeroGreetingTranslation {
  if (tabLang === 'en') {
    return {
      text: HERO_GREETING_EN,
      attr: HERO_GREETING_ATTR_EN,
      lang: 'en',
      lineClass: 'ev-hero-greeting-line-en',
    };
  }
  return {
    text: HERO_GREETING_BN,
    attr: HERO_GREETING_ATTR_BN,
    lang: 'bn',
    lineClass: 'ev-hero-greeting-line-bn',
  };
}

export default function HeroGreeting() {
  // The line follows the app's language setting (header toggle);
  // changing the toggle re-renders this instantly — no timer.
  const { tabLang } = useLanguage();
  const tr = getHeroGreetingTranslation(tabLang);

  return (
    <section
      className="ev-hero-greeting"
      aria-label="Surah Al-Alaq, verse 1 — translation in your language"
    >
      <p className={`ev-hero-greeting-line ${tr.lineClass}`} lang={tr.lang}>
        <span className="ev-hero-greeting-text">{tr.text}</span>
        <span className="ev-hero-greeting-attr"> — {tr.attr}</span>
      </p>
    </section>
  );
}
