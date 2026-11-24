// Eduvelto — homepage hero-band greeting, v6 (owner revision 24 Nov 2026
// 11:31 — SUPERSEDES the v5 translation-only mechanism).
//
// v6 restores the v3 cycle (ar → en → bn, in rotation) on top of the
// 09:35 fix: Surah Al-Alaq's first ayah, Arabic first, then English,
// then Bangla, then back to Arabic. Exactly ONE Welcome Bar (only
// HomePage mounts this component; the old top GreetingBar was deleted
// in v3 and never came back). NEVER more than one language at once.
//
// Kept from v5: the clean FULL-WIDTH borderless strip directly below
// the nav — no pill, no rounded corners, no border, no gradient, no
// glow, no sweep, no decoration. Kept from the 09:35 fix: the line
// WRAPS on narrow screens — never nowrap/ellipsis; the full sentence
// is always visible (the v5 one-line rule truncated the Bangla
// sentence on the owner's phone). The phase switch is a gentle fade
// only (0.6s, CSS); the Arabic letters and harakat are never
// distorted. No Bismillah anywhere in the band.
//
// Strings (brief 00:29 — verbatim, never re-translate or alter the
// Arabic):
import { useEffect, useState } from 'react';

export const HERO_GREETING_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';
export const HERO_GREETING_EN = 'Read in the name of your Lord who created.';
export const HERO_GREETING_BN = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
export const HERO_GREETING_ATTR_BN = 'সূরা আলাক, আয়াত ১।';
export const HERO_GREETING_ATTR_EN = 'Surah Al-Alaq, Ayah 1.';
// Back-compat: the Bangla attribution (default language).
export const HERO_GREETING_ATTR = HERO_GREETING_ATTR_BN;

export type HeroGreetingPhase = 'ar' | 'en' | 'bn';

/**
 * Dwell time per phase (ms). Arabic stays longest (9s) so the verse
 * can be read comfortably; English/Bangla ~6s each. (v3 values, kept.)
 */
export const HERO_GREETING_PHASE_MS: Record<HeroGreetingPhase, number> = {
  ar: 9000,
  en: 6000,
  bn: 6000,
};

export function getNextHeroGreetingPhase(
  current: HeroGreetingPhase,
): HeroGreetingPhase {
  if (current === 'ar') return 'en';
  if (current === 'en') return 'bn';
  return 'ar';
}

/** Test seam: true when the user asked for reduced motion. */
export function heroGreetingPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Three-phase machine: Arabic → English → Bangla → Arabic …
 * Under reduced motion there is no timer: the phase is 'ar' forever,
 * so the Arabic line is shown statically and nothing cycles.
 */
export function useHeroGreetingCycle(): { phase: HeroGreetingPhase } {
  const [phase, setPhase] = useState<HeroGreetingPhase>('ar');

  useEffect(() => {
    if (heroGreetingPrefersReducedMotion()) return;
    const id = window.setTimeout(() => {
      setPhase(getNextHeroGreetingPhase(phase));
    }, HERO_GREETING_PHASE_MS[phase]);
    return () => window.clearTimeout(id);
  }, [phase]);

  return { phase };
}

export default function HeroGreeting() {
  const { phase } = useHeroGreetingCycle();

  // Only the active phase renders (key={phase} re-mounts the line, so
  // the CSS fade-in replays on every switch). The band height adapts
  // per phase: a wrapped second line is always better than a cut
  // sentence (owner 24 Nov 09:35).
  return (
    <section
      className="ev-hero-greeting"
      aria-label="Surah Al-Alaq, verse 1 — in Arabic, English and Bangla"
    >
      {phase === 'ar' && (
        <p
          key="ar"
          className="ev-hero-greeting-line ev-hero-greeting-line-ar"
          lang="ar"
          dir="rtl"
        >
          <span className="ev-hero-greeting-text">{HERO_GREETING_AR}</span>
        </p>
      )}
      {phase === 'en' && (
        <p
          key="en"
          className="ev-hero-greeting-line ev-hero-greeting-line-en"
          lang="en"
        >
          <span className="ev-hero-greeting-text">{HERO_GREETING_EN}</span>
          <span className="ev-hero-greeting-attr"> — {HERO_GREETING_ATTR_EN}</span>
        </p>
      )}
      {phase === 'bn' && (
        <p
          key="bn"
          className="ev-hero-greeting-line ev-hero-greeting-line-bn"
          lang="bn"
        >
          <span className="ev-hero-greeting-text">{HERO_GREETING_BN}</span>
          <span className="ev-hero-greeting-attr"> — {HERO_GREETING_ATTR_BN}</span>
        </p>
      )}
    </section>
  );
}
