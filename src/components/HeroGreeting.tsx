// Eduvelto — homepage hero-band greeting, v4 (owner revisions 24 Nov 2026
// 07:11 + 07:14 — SUPERSEDES v3).
//
// v4 changes vs v3:
// - SHAPE: a tight small pill like the red "সর্বোচ্চ অগ্রাধিকার" badge on
//   the home cards (badge: padding 3px 9px, radius 999px) — the text
//   FILLS the pill; NOT a big rectangle. The pill hugs the widest line
//   (width: fit-content, centred) and sits flush directly below the nav
//   — mounted OUTSIDE PageShell (HomePage returns it before the shell,
//   whose 28px top padding made the white gap above the band).
// - COLOUR: app BRAND palette (brand guide §2 — NO green anywhere):
//   Deep Navy #0A1F44 base, gold #F5A623 accents. Dark mode matches.
// - LANGUAGE: TWO phases — Arabic, then the translation in the user's
//   chosen language (the header toggle's tabLang: Bangla by default,
//   English when set to English). Arabic always stays, exact, harakat
//   never distorted. The attribution follows the same language.
// - BORDER ANIMATIONS (owner 07:14 — varied, dignified, never flashing
//   or bouncing): slowly flowing gold gradient border + soft outer glow
//   pulse + the shimmer sweep; the text glow is kept.
// - Kept from v3: ONE band only, below the nav; NO Bismillah; exactly
//   one language at a time, ONE LINE, never clipped; smooth fade/slide
//   on change; reduced-motion static Arabic; responsive; Page Speed /
//   SEO / Navigation / AdSense unharmed.
//
// Strings (brief 00:29 — verbatim, never re-translate or alter the
// Arabic):
import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/strings';

export const HERO_GREETING_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';
export const HERO_GREETING_EN = 'Read in the name of your Lord who created.';
export const HERO_GREETING_BN = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
export const HERO_GREETING_ATTR_BN = 'সূরা আলাক, আয়াত ১।';
export const HERO_GREETING_ATTR_EN = 'Surah Al-Alaq, Ayah 1.';
// Back-compat: the Bangla attribution (default language).
export const HERO_GREETING_ATTR = HERO_GREETING_ATTR_BN;

export type HeroGreetingPhase = 'ar' | 'tr';

/**
 * Dwell time per phase (ms). Arabic stays longest (8–10s) so the
 * verse can be read comfortably; the translation ~6s. Slow gentle
 * fades only (1.2s) — the Arabic letters and harakat are never
 * distorted, bent, or broken.
 */
export const HERO_GREETING_PHASE_MS: Record<HeroGreetingPhase, number> = {
  ar: 9000,
  tr: 6000,
};

export function getNextHeroGreetingPhase(
  current: HeroGreetingPhase,
): HeroGreetingPhase {
  if (current === 'ar') return 'tr';
  return 'ar';
}

export type HeroGreetingTranslation = {
  text: string;
  attr: string;
  lang: Lang;
  lineClass: string;
};

/**
 * Pure selector: the translation phase shows the user's chosen
 * language — the same `tabLang` the header language toggle reads and
 * writes (localStorage `eduvelto-language`, account preference
 * `users.language`; default 'bn' when nothing is stored). Arabic is
 * untouched by this choice and always stays the first phase.
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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Two-phase machine: Arabic → translation → Arabic …
 * Under reduced motion there is no timer: the phase is 'ar' forever,
 * so the Arabic line is shown statically and nothing cycles.
 */
export function useHeroGreetingCycle(): { phase: HeroGreetingPhase } {
  const [phase, setPhase] = useState<HeroGreetingPhase>('ar');

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setTimeout(() => {
      setPhase(getNextHeroGreetingPhase(phase));
    }, HERO_GREETING_PHASE_MS[phase]);
    return () => window.clearTimeout(id);
  }, [phase]);

  return { phase };
}

export default function HeroGreeting() {
  const { phase } = useHeroGreetingCycle();
  // The translation follows the app's language setting (header toggle).
  const { tabLang } = useLanguage();
  const tr = getHeroGreetingTranslation(tabLang);

  return (
    <section
      className="ev-hero-greeting"
      aria-label="Al-Alaq, verse 1 — in Arabic and your language"
    >
      {/* Both lines stay in the DOM; CSS shows only the active
          phase (opacity + visibility), so the switch is a pure fade
          and the pill never changes height or reflows. The inactive
          line is aria-hidden. */}
      <p
        className="ev-hero-greeting-line ev-hero-greeting-line-ar"
        data-active={phase === 'ar'}
        aria-hidden={phase !== 'ar'}
        lang="ar"
        dir="rtl"
      >
        <span className="ev-hero-greeting-text">{HERO_GREETING_AR}</span>
      </p>
      <p
        className={`ev-hero-greeting-line ${tr.lineClass}`}
        data-active={phase === 'tr'}
        aria-hidden={phase !== 'tr'}
        lang={tr.lang}
      >
        <span className="ev-hero-greeting-text">{tr.text}</span>
        <span className="ev-hero-greeting-attr"> — {tr.attr}</span>
      </p>
      {/* Shimmer sweep along the bottom edge — decorative only. */}
      <span className="ev-hero-greeting-sweep" aria-hidden="true" />
    </section>
  );
}
