// Eduvelto — ad placement placeholders (stage 3: class-wise homepage +
// mobile app preview).
//
// These are STYLED PLACEHOLDERS ONLY — they mark where ads will go. They
// are NOT real ads: no AdSense, no ad SDK, no ad network, no activation,
// no tracking, no personalised content. The real ad system (src/lib/ads.ts
// + AdSlot) is untouched and still renders nothing until AdSense IDs are
// configured (Launch step 6). Every placeholder is visibly labelled
// "বিজ্ঞাপনের স্থান · Ad space — placeholder" so it can never be mistaken
// for a live ad.
//
// Placement rules (owner brief 21 Nov 12:28, binding): ads must NEVER
// disrupt Reading, Chapter Learning, Practice, Exam, Result, or Login —
// and NO ads at all during an exam. So placeholders appear ONLY on:
// homepage (top banner, side rail, bottom banner), the class dashboard
// Home tab (mobile ad, in-app ad), and the Books tab (one limited
// in-content slot). They NEVER appear on BookPage / ChapterPage /
// LessonPage / QuizPage / ExamPage / LoginPage.
// The CTA links to /contact (advertise with us) — a real page.

import { Link } from 'react-router-dom';

export type AdSlotVariant =
  | 'top-banner'
  | 'side'
  | 'bottom-banner'
  | 'mobile'
  | 'in-app'
  | 'in-content';

const COPY: Record<AdSlotVariant, { title: string; sub: string; cta: string }> = {
  'top-banner': { title: 'Your Ad Here', sub: 'Grow Your Brand with Eduvelto', cta: 'Learn More →' },
  side: { title: 'Your Ad Here', sub: 'Reach Millions of Students', cta: 'Advertise with Us →' },
  'bottom-banner': { title: 'Your Ad Here', sub: 'চলো, এখনই শুরু করি তোমার স্বপ্নের পথচলা!', cta: 'Start Learning →' },
  mobile: { title: 'Your Ad Here', sub: 'Reach More Students', cta: 'Learn More →' },
  'in-app': { title: 'Your Ad Here', sub: 'Reach More Students', cta: 'Learn More →' },
  'in-content': { title: 'Your Ad Here', sub: 'শিক্ষার্থীদের কাছে পৌঁছান', cta: 'Advertise with Us →' },
};

function MegaphoneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

export default function AdPlaceholder({ variant }: { variant: AdSlotVariant }) {
  const copy = COPY[variant];
  const ctaTo = variant === 'bottom-banner' ? '/#select-class' : '/contact';
  return (
    <div className={`ev-ad ev-ad-${variant}`} role="complementary" aria-label="বিজ্ঞাপনের স্থান — placeholder / Ad space placeholder">
      <span className="ev-ad-label">বিজ্ঞাপন · Ad — placeholder</span>
      <div className="ev-ad-body">
        <span className="ev-ad-icon" aria-hidden="true">
          <MegaphoneIcon />
        </span>
        <div className="ev-ad-text">
          <strong>{copy.title}</strong>
          <span>{copy.sub}</span>
        </div>
        {variant === 'bottom-banner' ? (
          <a href={ctaTo} className="ev-ad-cta">
            {copy.cta}
          </a>
        ) : (
          <Link to={ctaTo} className="ev-ad-cta">
            {copy.cta}
          </Link>
        )}
      </div>
    </div>
  );
}
