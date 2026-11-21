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
import { useLanguage } from '../i18n/LanguageContext';

export type AdSlotVariant =
  | 'top-banner'
  | 'side'
  | 'bottom-banner'
  | 'mobile'
  | 'in-app'
  | 'in-content';

type AdCopy = { title: { bn: string; en: string }; sub: { bn: string; en: string }; cta: { bn: string; en: string } };

const COPY: Record<AdSlotVariant, AdCopy> = {
  'top-banner': {
    title: { bn: 'আপনার বিজ্ঞাপন এখানে', en: 'Your Ad Here' },
    sub: { bn: 'Eduvelto-র সাথে আপনার ব্র্যান্ড বাড়ান', en: 'Grow Your Brand with Eduvelto' },
    cta: { bn: 'আরও জানুন →', en: 'Learn More →' },
  },
  side: {
    title: { bn: 'আপনার বিজ্ঞাপন এখানে', en: 'Your Ad Here' },
    sub: { bn: 'লাখো শিক্ষার্থীর কাছে পৌঁছান', en: 'Reach Millions of Students' },
    cta: { bn: 'আমাদের সাথে বিজ্ঞাপন দিন →', en: 'Advertise with Us →' },
  },
  'bottom-banner': {
    title: { bn: 'আপনার বিজ্ঞাপন এখানে', en: 'Your Ad Here' },
    sub: { bn: 'চলো, এখনই শুরু করি তোমার স্বপ্নের পথচলা!', en: 'Start your dream journey today!' },
    cta: { bn: 'শেখা শুরু করুন →', en: 'Start Learning →' },
  },
  mobile: {
    title: { bn: 'আপনার বিজ্ঞাপন এখানে', en: 'Your Ad Here' },
    sub: { bn: 'আরও শিক্ষার্থীর কাছে পৌঁছান', en: 'Reach More Students' },
    cta: { bn: 'আরও জানুন →', en: 'Learn More →' },
  },
  'in-app': {
    title: { bn: 'আপনার বিজ্ঞাপন এখানে', en: 'Your Ad Here' },
    sub: { bn: 'আরও শিক্ষার্থীর কাছে পৌঁছান', en: 'Reach More Students' },
    cta: { bn: 'আরও জানুন →', en: 'Learn More →' },
  },
  'in-content': {
    title: { bn: 'আপনার বিজ্ঞাপন এখানে', en: 'Your Ad Here' },
    sub: { bn: 'শিক্ষার্থীদের কাছে পৌঁছান', en: 'Reach students' },
    cta: { bn: 'আমাদের সাথে বিজ্ঞাপন দিন →', en: 'Advertise with Us →' },
  },
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
  const { t } = useLanguage();
  const ctaTo = variant === 'bottom-banner' ? '/#select-class' : '/contact';
  return (
    <div className={`ev-ad ev-ad-${variant}`} role="complementary" aria-label={t({ bn: 'বিজ্ঞাপনের স্থান — নমুনা', en: 'Ad space placeholder' })}>
      <span className="ev-ad-label">{t({ bn: 'বিজ্ঞাপন · নমুনা', en: 'Ad · placeholder' })}</span>
      <div className="ev-ad-body">
        <span className="ev-ad-icon" aria-hidden="true">
          <MegaphoneIcon />
        </span>
        <div className="ev-ad-text">
          <strong>{t(copy.title)}</strong>
          <span>{t(copy.sub)}</span>
        </div>
        {variant === 'bottom-banner' ? (
          <a href={ctaTo} className="ev-ad-cta">
            {t(copy.cta)}
          </a>
        ) : (
          <Link to={ctaTo} className="ev-ad-cta">
            {t(copy.cta)}
          </Link>
        )}
      </div>
    </div>
  );
}
