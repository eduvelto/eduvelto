// Eduvelto — homepage hero-band greeting, v3 (owner's FORMAL revised
// brief 24 Nov 2026 00:29 — SUPERSEDES both the 23:01 brief and the
// 00:22 no-Arabic reading; Arabic IS included).
//
// The top sticky greeting bar is DELETED (App.tsx no longer mounts
// GreetingBar; the component + CSS + tests are removed). This band,
// directly below the Navigation Menu, is the ONLY Welcome Bar.
//
// The bar carries Surah Al-Alaq's first ayah in THREE languages, in
// sequence — Arabic first, then English, then Bangla, then back to
// Arabic. NEVER more than one language at once; exactly one language
// and ONE LINE at a time. No Bismillah anywhere in the bar, no extra
// Arabic text, no "Assalamu Alaikum", no rotating welcome lines.
//
// Strings (brief 00:29 — verbatim, never re-translate or alter the
// Arabic):
import { useEffect, useState } from 'react';

export const HERO_GREETING_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';
export const HERO_GREETING_EN = 'Read in the name of your Lord who created.';
export const HERO_GREETING_BN = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
export const HERO_GREETING_ATTR = 'সূরা আলাক, আয়াত ১।';

// Attribution: rendered inside the Bangla line (see the component).
// It fits on desktop beside the Bangla sentence; on mobile (390px)
// the Bangla sentence alone already fills the line, so the
// attribution span is hidden there by CSS (display: none under
// 640px) — one line is the hard requirement, and a second line is
// never allowed. See the deploy report for the measured fit.

export type HeroGreetingPhase = 'ar' | 'en' | 'bn';

/**
 * Dwell time per phase (ms). Arabic stays longest (8–10s) so the
 * verse can be read comfortably; English/Bangla ~6s each. Slow
 * gentle fades only (1.2s) — the Arabic letters and harakat are
 * never distorted, bent, or broken.
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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
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

  return (
    <section
      className="ev-hero-greeting"
      aria-label="Al-Alaq, verse 1 — in Arabic, English and Bangla"
    >
      {/* All three lines stay in the DOM; CSS shows only the active
          phase (opacity + visibility), so the switch is a pure fade
          and the band never changes height or reflows. The inactive
          lines are aria-hidden. */}
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
        className="ev-hero-greeting-line ev-hero-greeting-line-en"
        data-active={phase === 'en'}
        aria-hidden={phase !== 'en'}
        lang="en"
      >
        <span className="ev-hero-greeting-text">{HERO_GREETING_EN}</span>
      </p>
      <p
        className="ev-hero-greeting-line ev-hero-greeting-line-bn"
        data-active={phase === 'bn'}
        aria-hidden={phase !== 'bn'}
        lang="bn"
      >
        <span className="ev-hero-greeting-text">{HERO_GREETING_BN}</span>
        <span className="ev-hero-greeting-attr"> — {HERO_GREETING_ATTR}</span>
      </p>
      {/* (c) Thin gold line along the bottom edge, sweeping slowly
          side to side — the eye-catcher that never touches the ayah
          text itself. Decorative only. */}
      <span className="ev-hero-greeting-sweep" aria-hidden="true" />
    </section>
  );
}
