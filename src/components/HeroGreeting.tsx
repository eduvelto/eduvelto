// Eduvelto — homepage hero-band greeting display (owner brief 22:55 +
// formal brief 23:01).
//
// Replaces the auto-sliding mobile hero carousel in the band between
// the desktop hero and the four section cards. Same Bismillah → ayah →
// salam cycle as the top greeting bar (shared useGreetingCycle hook),
// same Deep Navy #0A1F44 + champagne gold, shown on ALL screen sizes,
// centred. The Bismillah here is display-size and static — no
// animation on the letters, exactly like the bar's. Fixed-height
// stage, so the section cards below never shift when phases change.
// Under reduced motion the timer never starts and the band shows
// Bismillah + the full ayah block statically.
import {
  AyahBlock,
  BISMILLAH,
  GREETING_MESSAGES,
  useGreetingCycle,
} from './GreetingBar';

function CrescentStar({ size = 32 }: { size?: number }) {
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

export default function HeroGreeting() {
  const { phase, welcomeIndex } = useGreetingCycle();

  return (
    <section
      className="ev-hero-greeting"
      aria-label="Bismillah — Surah Al-Alaq, verse 1"
    >
      <div className="ev-hero-greeting-stage" data-phase={phase}>
        {/* Bismillah row — visible in phases (a) and (b); glides up
            when the ayah block expands below it. No animation and no
            transform on the Bismillah letters themselves. */}
        <div
          className="ev-hero-greeting-bismillah-row"
          aria-hidden={phase === 'salam'}
        >
          <span className="ev-hero-greeting-mark" aria-hidden="true">
            <CrescentStar />
          </span>
          <span className="ev-hero-greeting-bismillah" lang="ar" dir="rtl">
            {BISMILLAH}
          </span>
        </div>
        {/* Ayah block — visible in phase (b) only. */}
        <div
          className="ev-hero-greeting-ayah-wrap"
          aria-hidden={phase !== 'ayah'}
        >
          <AyahBlock prefix="ev-hero-greeting" />
        </div>
        {/* Salam + rotating welcome — visible in phase (c) only. */}
        <div
          className="ev-hero-greeting-salam-block"
          aria-hidden={phase !== 'salam'}
        >
          <p className="ev-hero-greeting-salam">Assalamu Alaikum</p>
          <p className="ev-hero-greeting-tagline" aria-live="polite">
            <span key={welcomeIndex} className="ev-hero-greeting-message">
              {GREETING_MESSAGES[welcomeIndex]}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
