// Eduvelto — premium Islamic Greeting Bar (owner brief 23 Nov 2026 ~22:23,
// formal brief 23:01 + parent design decisions).
//
// A permanent brand signature at the very top of the public site: Deep
// Navy #0A1F44 gradient + champagne gold (owner-decided 22:54 — the
// Eduvelto brand kit). It is a REUSABLE global component mounted once in
// App.tsx, above HeaderNav. v2 is STICKY (position: sticky, top: 0 in
// CSS — in-flow, never a fixed overlay, so it can never cover page
// content; the header below scrolls away while the bar stays pinned)
// and its text is markedly larger + heavier so it reads clearly from a
// distance, on mobile above all.
//
// THE CYCLE (formal brief 23:01 — supersedes the earlier rotation
// sketch): the bar cycles gently through three phases, slow fades only,
// whole lines fading/sliding as units, never letter-level animation.
//   (a) Bismillah alone, large, centered, static (~4s)
//   (b) Bismillah shifts slightly UP (the whole line moves as one —
//       allowed by the brief) and the Surah Al-Alaq ayah block fades in
//       below it: Arabic + Bangla pronunciation + meaning + attribution
//       (~10s)
//   (c) gentle fade to "Assalamu Alaikum" + one rotating welcome line
//       (~6s; the welcome advances one message per cycle)
//   then back to (a).
// The bar has a FIXED height (the tallest phase) so the content below
// never shifts when phases change.
//
// RESPECT RULES (owner brief, binding):
// - The sacred Arabic (Bismillah + Quran ayah) is NEVER distorted,
//   bent, broken, or excessively animated. The Bismillah span itself
//   carries NO animation of any kind (no animation class, no transform
//   on the letters); only the whole line moves, as the brief specifies.
// - All motion is CSS-only, slow and gentle (1.2s fades). No flashing,
//   no aggressive animation, no fast blinking.
// - prefers-reduced-motion: NO transitions and NO cycling — the bar
//   shows Bismillah + the full ayah block statically (the most
//   important content), always readable. The rotation timer never
//   starts under this setting (see useGreetingCycle).
// - Exact strings (brief 23:01 — do not re-translate or alter):
//   ayah Arabic, pronunciation, meaning, attribution below.
// - No ads, no tracking, no network calls, no personal data. The only
//   new network cost is the Amiri font (already allowed by the CSP:
//   fonts.googleapis.com / fonts.gstatic.com), with system serif
//   fallbacks so the Arabic still renders if the font CDN fails.

import { useEffect, useState } from 'react';

export const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

// Surah Al-Alaq (96), ayah 1 — exact strings from the owner brief 23:01.
export const IQRA_AYAH_AR = 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ';
export const IQRA_PRONUNCIATION = 'ইকরা বিসমি রাব্বিকাল্লাযী খালাক।';
export const IQRA_MEANING = 'পড়ো তোমার রবের নামে, যিনি সৃষ্টি করেছেন।';
export const IQRA_ATTRIBUTION = 'সূরা আলাক, আয়াত ১।';

export const GREETING_MESSAGES = [
  'Welcome to Eduvelto • Learn, Create & Grow',
  'Learn Something New Today',
  'Explore. Learn. Grow.',
  'Your World of Possibilities',
  'Knowledge Without Boundaries',
] as const;

export type GreetingPhase = 'bismillah' | 'ayah' | 'salam';

/** Dwell time per phase (ms). Slow by design — see the brief. */
export const GREETING_PHASE_MS: Record<GreetingPhase, number> = {
  bismillah: 4000,
  ayah: 10000,
  salam: 6000,
};

export function getNextGreetingPhase(current: GreetingPhase): GreetingPhase {
  if (current === 'bismillah') return 'ayah';
  if (current === 'ayah') return 'salam';
  return 'bismillah';
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Shared phase machine for the greeting bar AND the hero-band greeting
 * display — both run the same Bismillah → ayah → salam cycle on
 * independent timers. Under reduced motion there is no timer: the
 * phase is 'ayah' forever, so Bismillah + the full ayah block are
 * always shown statically.
 */
export function useGreetingCycle(): { phase: GreetingPhase; welcomeIndex: number } {
  const [phase, setPhase] = useState<GreetingPhase>(() =>
    prefersReducedMotion() ? 'ayah' : 'bismillah',
  );
  const [welcomeIndex, setWelcomeIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setTimeout(() => {
      if (phase === 'salam') {
        setWelcomeIndex((i) => (i + 1) % GREETING_MESSAGES.length);
      }
      setPhase(getNextGreetingPhase(phase));
    }, GREETING_PHASE_MS[phase]);
    return () => window.clearTimeout(id);
  }, [phase]);

  return { phase, welcomeIndex };
}

function CrescentStar({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"
        fill="#e9cf7e"
      />
      <path
        d="M18.6 3.2l.72 1.86 1.86.72-1.86.72-.72 1.86-.72-1.86-1.86-.72 1.86-.72z"
        fill="#f7e9b8"
      />
    </svg>
  );
}

/**
 * The ayah block (phase b): Arabic + Bangla pronunciation + meaning +
 * attribution. Shared by the bar and the hero band; the class prefix
 * differs so each can size it for its own stage.
 */
export function AyahBlock({ prefix }: { prefix: string }) {
  return (
    <div className={`${prefix}-ayah`}>
      <p className={`${prefix}-ayah-ar`} lang="ar" dir="rtl">
        {IQRA_AYAH_AR}
      </p>
      <p className={`${prefix}-ayah-bn`}>{IQRA_PRONUNCIATION}</p>
      <p className={`${prefix}-ayah-meaning`}>{IQRA_MEANING}</p>
      <p className={`${prefix}-ayah-ref`}>{IQRA_ATTRIBUTION}</p>
    </div>
  );
}

export default function GreetingBar() {
  const { phase, welcomeIndex } = useGreetingCycle();

  return (
    <div
      className="ev-greeting-bar"
      role="note"
      aria-label="Islamic greeting — Bismillah, Surah Al-Alaq verse 1, Assalamu Alaikum, welcome to Eduvelto"
    >
      <span className="ev-greeting-sweep" aria-hidden="true" />
      <span className="ev-greeting-spark ev-greeting-spark-1" aria-hidden="true" />
      <span className="ev-greeting-spark ev-greeting-spark-2" aria-hidden="true" />
      <span className="ev-greeting-spark ev-greeting-spark-3" aria-hidden="true" />
      {/* Fixed-height stage: the bar never changes height, so the page
          below never shifts when phases change. The visible phase is
          the only one with opacity 1; the rest are hidden. */}
      <div className="ev-greeting-stage" data-phase={phase}>
        {/* Bismillah row — visible in phases (a) and (b). In (b) the
            ayah block expands below it, so the flex column re-centres
            and this whole line glides slightly upward — the transition
            the brief specifies. The Bismillah span itself has NO
            animation and NO transform, ever. */}
        <div
          className="ev-greeting-bismillah-row"
          aria-hidden={phase === 'salam'}
        >
          <span className="ev-greeting-mark" aria-hidden="true">
            <CrescentStar />
          </span>
          <span className="ev-greeting-bismillah" lang="ar" dir="rtl">
            {BISMILLAH}
          </span>
        </div>
        {/* Ayah block — visible in phase (b) only. */}
        <div className="ev-greeting-ayah-wrap" aria-hidden={phase !== 'ayah'}>
          <AyahBlock prefix="ev-greeting" />
        </div>
        {/* Salam + rotating welcome — visible in phase (c) only. */}
        <div
          className="ev-greeting-salam-block"
          aria-hidden={phase !== 'salam'}
        >
          <p className="ev-greeting-salam">Assalamu Alaikum</p>
          <p className="ev-greeting-tagline" aria-live="polite">
            <span key={welcomeIndex} className="ev-greeting-message">
              {GREETING_MESSAGES[welcomeIndex]}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
