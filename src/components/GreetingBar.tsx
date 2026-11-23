// Eduvelto — premium Islamic Greeting Bar (owner brief 23 Nov 2026 ~22:23).
//
// A permanent brand signature at the very top of the public site: deep
// Islamic green + champagne gold, Bismillah in Amiri calligraphy, the
// English greeting, and a slowly rotating welcome line. It is a REUSABLE
// global component mounted once in App.tsx, above HeaderNav, in normal
// flow — never a fixed overlay, so it can never cover page content.
//
// RESPECT RULES (owner brief, binding):
// - The sacred Arabic Bismillah text is STATIC: no animation, no
//   movement, no transform of any kind on .ev-greeting-bismillah.
// - All motion is CSS-only, slow and gentle: a golden light sweep, a
//   soft crescent/star glow, a slowly breathing golden border, a fade
//   between welcome messages (7.5s), very light sparkles. No flashing,
//   no aggressive animation, no fast blinking.
// - prefers-reduced-motion: the rotation timer never starts AND every
//   bar animation is switched off in CSS, so the bar is fully static.
// - No layout shift: the bar's height comes from fixed padding +
//   fixed line-heights; the rotating line is a single nowrap line, so
//   a longer/shorter message never changes the bar's height.
// - No ads, no tracking, no network calls, no personal data. The only
//   new network cost is the Amiri font (already allowed by the CSP:
//   fonts.googleapis.com / fonts.gstatic.com), with system serif
//   fallbacks so the Bismillah still renders if the font CDN fails.

import { useEffect, useState } from 'react';

export const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

export const GREETING_MESSAGES = [
  'Welcome to Eduvelto • Learn, Create & Grow',
  'Learn Something New Today',
  'Explore. Learn. Grow.',
  'Your World of Possibilities',
  'Knowledge Without Boundaries',
] as const;

export const GREETING_ROTATION_MS = 7500;

export function getNextGreetingIndex(current: number): number {
  return (current + 1) % GREETING_MESSAGES.length;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function CrescentStar() {
  return (
    <svg
      width="22"
      height="22"
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

export default function GreetingBar() {
  const [index, setIndex] = useState(0);

  // Rotate the welcome line every 7.5s. Never under reduced motion,
  // and never on the server (effects do not run in renderToString).
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(
      () => setIndex((i) => getNextGreetingIndex(i)),
      GREETING_ROTATION_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="ev-greeting-bar"
      role="note"
      aria-label="Islamic greeting — Assalamu Alaikum, welcome to Eduvelto"
    >
      <span className="ev-greeting-sweep" aria-hidden="true" />
      <span className="ev-greeting-spark ev-greeting-spark-1" aria-hidden="true" />
      <span className="ev-greeting-spark ev-greeting-spark-2" aria-hidden="true" />
      <span className="ev-greeting-spark ev-greeting-spark-3" aria-hidden="true" />
      <div className="ev-greeting-inner">
        <span className="ev-greeting-mark" aria-hidden="true">
          <CrescentStar />
        </span>
        {/* The Bismillah is sacred text: it carries NO animation class
            and no motion of any kind — it is rendered exactly as-is. */}
        <span className="ev-greeting-bismillah" lang="ar" dir="rtl">
          {BISMILLAH}
        </span>
        <span className="ev-greeting-dot" aria-hidden="true" />
        <span className="ev-greeting-salam">Assalamu Alaikum</span>
      </div>
      <div className="ev-greeting-tagline" aria-live="polite">
        <span key={index} className="ev-greeting-message">
          {GREETING_MESSAGES[index]}
        </span>
      </div>
    </div>
  );
}
