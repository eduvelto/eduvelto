// Eduvelto — class-wise cards (stage 3: class-wise homepage + mobile app).
//
// One card per level (Class 1–5, Class 6–8, Class 9–10, HSC, Honours &
// Masters). Each card carries its class-wise colour identity (see
// lib/classLevels.ts for the AA-checked accents), a CSS/SVG illustration
// only — no photos, no paid assets — the class name, the REAL live book
// count (or an honest "coming soon" state for levels with no books), and
// an Explore button to that level's dashboard (/class/<slug>).
// No "Most Popular" badge: the dream reference marks Class 6–8 as most
// popular, but no usage data supports it — and Class 6–8 has zero books —
// so no popularity claim is shown anywhere.

import { Link } from 'react-router-dom';
import { Reveal } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import type { ClassLevelDef } from '../lib/classLevels';

/** Small line icon per level (inline SVG, currentColor) — no emoji. */
function LevelIcon({ slug }: { slug: string }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;
  switch (slug) {
    case 'class-1-5': // pencil — primary
      return (
        <svg {...common}>
          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          <path d="M15 5l4 4" />
        </svg>
      );
    case 'class-6-8': // compass — lower secondary
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'class-9-10': // flask — secondary science
      return (
        <svg {...common}>
          <path d="M9 3h6" />
          <path d="M10 3v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3" />
          <path d="M7.5 14h9" />
        </svg>
      );
    case 'hsc': // target — higher secondary
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    default: // graduation cap — honours & masters
      return (
        <svg {...common}>
          <path d="M22 10L12 5 2 10l10 5 10-5z" />
          <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
          <path d="M22 10v6" />
        </svg>
      );
  }
}

/** Open-book illustration (decorative SVG, white line-art). */
function BookArt() {
  return (
    <svg
      width="86"
      height="62"
      viewBox="0 0 86 62"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M43 12C38 6 28 4 16 6c-4 .7-8 2-11 4v42c3-2 7-3.3 11-4 12-2 22 0 27 6 5-6 15-8 27-6 4 .7 8 2 11 4V10c-3-2-7-3.3-11-4-12-2-22 0-27 6z" />
      <path d="M43 12v42" />
      <path d="M24 20c5-1 10-.8 14 1" opacity="0.7" />
      <path d="M24 28c5-1 10-.8 14 1" opacity="0.7" />
      <path d="M48 21c4-1.8 9-2 14-1" opacity="0.7" />
      <path d="M48 29c4-1.8 9-2 14-1" opacity="0.7" />
    </svg>
  );
}

export function ClassCard({
  def,
  bookCount,
  subjectCount,
  delayMs = 0,
}: {
  def: ClassLevelDef;
  /** Live Published book count for this level (0 when none exist yet). */
  bookCount: number;
  /** Live distinct-subject count for this level (0 when none exist yet). */
  subjectCount: number;
  delayMs?: number;
}) {
  const ready = bookCount > 0;
  const { lang, t } = useLanguage();
  return (
    <Reveal delayMs={delayMs}>
      <Link
        to={`/class/${def.slug}`}
        className="ev-class-card"
        style={{ background: def.accent, textDecoration: 'none' }}
        aria-label={t({ bn: `${def.bn}. ${ready ? `${bookCount}টি বই` : 'শীঘ্রই আসছে'}`, en: `${def.en}. ${ready ? `${bookCount} books` : 'Coming soon'}` })}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: '#fff' }}>
              {lang === 'bn' ? def.bn : def.en}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {lang === 'bn' ? def.tagBn : def.tagEn}
            </div>
          </div>
          <span
            aria-hidden="true"
            style={{
              flex: 'none',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <LevelIcon slug={def.slug} />
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.92)', margin: '10px 0 12px' }} aria-hidden="true">
          <BookArt />
        </div>
        <div style={{ marginTop: 'auto' }}>
          {ready ? (
            <p style={{ margin: '0 0 10px', fontSize: 14, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
              {t({ bn: `${bookCount}টি বই · ${subjectCount}টি বিষয়`, en: `${bookCount} books · ${subjectCount} subjects` })}
            </p>
          ) : (
            <p style={{ margin: '0 0 10px' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.22)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
              </span>
            </p>
          )}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--card)',
              color: 'var(--heading)',
              fontWeight: 700,
              fontSize: 14,
              padding: '9px 16px',
              borderRadius: 999,
              minHeight: 40,
            }}
          >
            {t({ bn: 'ঘুরে দেখুন →', en: 'Explore →' })}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
