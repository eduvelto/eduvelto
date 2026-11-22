// Eduvelto — home, 4-section redesign (21 Nov 2026).
//
// Owner-approved mockups (desktop + mobile, "same arokom hobe"):
// a light homepage built around the FOUR main sections — চাকরি প্রস্তুতি
// (HIGHEST priority), ভর্তি প্রস্তুতি, শিক্ষা কার্যক্রম, দক্ষতা উন্নয়ন —
// with a light header (see components/HeaderNav.tsx), a hero, a feature
// strip / quick access, three panels (updates / progress / popular) and
// a footer banner.
//
// Layout (desktop ≥769px): hero → 4 section cards → feature strip →
// 3 panels (সাম্প্রতিক আপডেট / আপনার পড়াশোনার অগ্রগতি / জনপ্রিয় বিভাগ)
// → footer banner.
// Layout (mobile ≤768px): search bar → hero carousel (3 slides, dots,
// auto-advance) → 4 cards 2×2 → দ্রুত অ্যাক্সেস → progress panel →
// জনপ্রিয় পরীক্ষা → footer banner; bottom nav (HeaderNav + BottomNav).
//
// HONESTY — the mockups contain sample/fake content; NONE of it ships:
//  - Updates panel: NO news items at all until a real, verified circular
//    exists. It shows an honest empty state. The mockup's "BCS ৪৩তম" /
//    "ঢাবি ভর্তি তারিখ" items are unverified and never used.
//  - Progress ring: REAL signed-in user data only (lessons read + practice
//    questions + quiz attempts from Firestore). Signed out → login prompt.
//    Never a fake 78% / 85% / 90%.
//  - Hero: NO stock photos from the mockups — CSS gradients + the
//    Eduvelto wordmark only. No hotlinked images.
//  - "ভিডিও লেসন" and "সার্টিফিকেট" do not exist yet → rendered as
//    Coming Soon (disabled), not as working features. "র‍্যাংকিং" also
//    does not exist yet → Coming Soon.
//  - Section cards link to /jobs, /admissions, /class, /skills. /jobs
//    (Job Preparation) and /admissions (Admission Preparation) are real
//    sections, live since 22 Nov 2026; /class is real (class index);
//    only /skills still lands on the shared Coming Soon page until it
//    is built.
//  - One top-banner ad slot below the hero (ads placement plan 22 Nov
//    2026). It renders nothing until AdSense is configured; the global
//    bottom banner in App.tsx still applies. No invented counts anywhere.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import { useAuth } from '../lib/auth';
import { JobsSection } from '../components/JobCards';
import { useLanguage } from '../i18n/LanguageContext';
import { listQuizAttempts, listSubjectProgress } from '../lib/progress';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function BriefcaseIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function CapIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
      <path d="M22 10v6" />
    </svg>
  );
}
function BookIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function SkillsIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 4 3 5-8" />
    </svg>
  );
}
function VideoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="15" height="14" rx="2" />
      <path d="M17 10l5-3v10l-5-3" />
    </svg>
  );
}
function QuizIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 11l2 2 4-4" />
    </svg>
  );
}
function ChartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 4 3 5-8" />
    </svg>
  );
}
function TrophyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v2a6 6 0 0 1-12 0V3z" />
      <path d="M6 5H3a3 3 0 0 0 3 5" />
      <path d="M18 5h3a3 3 0 0 1-3 5" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
    </svg>
  );
}
function CalendarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// The four sections. Card tints follow the mockups (green/blue/purple/
// orange); button/text colours are darkened to AA contrast on white
// (see team/homepage-redesign-report.md for the deviations).
const SECTIONS = [
  {
    id: 'jobs',
    to: '/jobs',
    tint: 'ev-home-card-job',
    icon: <BriefcaseIcon />,
    badgeBn: 'সর্বোচ্চ অগ্রাধিকার',
    badgeEn: 'Highest priority',
    badgeMobileOnly: false,
    titleBn: 'চাকরি প্রস্তুতি',
    titleEn: 'Job Preparation',
    descBn: 'BCS, ব্যাংক, শিক্ষক নিয়োগ, সরকারি ও বেসরকারি চাকরি',
    descEn: 'BCS, Bank, Teacher Recruitment, Government & Private Jobs',
    ctaBn: 'প্রস্তুতি নিন',
    ctaEn: 'Start Preparing',
  },
  {
    id: 'admissions',
    to: '/admissions',
    tint: 'ev-home-card-admissions',
    icon: <CapIcon />,
    badgeBn: 'সর্বোচ্চ অগ্রাধিকার',
    badgeEn: 'Highest priority',
    // Mockup: the badge is on Job only on desktop, on Job AND Admission
    // on mobile. The CSS class hides this badge at ≥769px.
    badgeMobileOnly: true,
    titleBn: 'ভর্তি প্রস্তুতি',
    titleEn: 'Admission Preparation',
    descBn: 'বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং, কৃষি ও অন্যান্য',
    descEn: 'University, Medical, Engineering, Agriculture & More',
    ctaBn: 'ভর্তি প্রস্তুতি নিন',
    ctaEn: 'Prepare for Admission',
  },
  {
    id: 'academic',
    to: '/class',
    tint: 'ev-home-card-academic',
    icon: <BookIcon />,
    badgeBn: '',
    badgeEn: '',
    badgeMobileOnly: false,
    titleBn: 'শিক্ষা কার্যক্রম',
    titleEn: 'Academic Learning',
    descBn: 'Class 1–12, Madrasa, Technical, Honours & Masters',
    descEn: 'Class 1–12, Madrasa, Technical, Honours & Masters',
    ctaBn: 'পড়া শুরু করুন',
    ctaEn: 'Start Learning',
  },
  {
    id: 'skills',
    to: '/skills',
    tint: 'ev-home-card-skills',
    icon: <SkillsIcon />,
    badgeBn: '',
    badgeEn: '',
    badgeMobileOnly: false,
    titleBn: 'দক্ষতা উন্নয়ন',
    titleEn: 'Professional Skills',
    descBn: 'English, Computer, Digital Skills ও আরও অনেক কিছু',
    descEn: 'English, Computer, Digital Skills & More',
    ctaBn: 'দক্ষতা বাড়ান',
    ctaEn: 'Build Skills',
  },
];

// Feature strip (desktop) / quick access (mobile). "soon" items do not
// exist yet — they render disabled with a Coming Soon chip, never as
// working links.
const FEATURES = [
  { icon: <VideoIcon />, bn: 'ভিডিও লেসন', en: 'Video Lessons', to: null as string | null, soon: true },
  { icon: <BookIcon size={22} />, bn: 'প্রশ্নব্যাংক', en: 'Question Bank', to: '/library', soon: false },
  { icon: <QuizIcon />, bn: 'মডেল টেস্ট', en: 'Model Tests', to: '/exam', soon: false },
  { icon: <ChartIcon />, bn: 'ফলাফল বিশ্লেষণ', en: 'Result Analysis', to: '/progress', soon: false },
  { icon: <CalendarIcon />, bn: 'পড়ার রুটিন', en: 'Study Routine', to: '/routine', soon: true },
  { icon: <TrophyIcon />, bn: 'র‍্যাংকিং', en: 'Ranking', to: null, soon: true },
  { icon: <StarIcon />, bn: 'সার্টিফিকেট', en: 'Certificate', to: null, soon: true },
];

const POPULAR = [
  { bn: 'BCS', to: '/jobs' },
  { bn: 'DU ভর্তি', en: 'DU Admission', to: '/admissions' },
  { bn: 'মেডিকেল ভর্তি', en: 'Medical Admission', to: '/admissions' },
  { bn: 'ব্যাংক চাকরি', en: 'Bank Jobs', to: '/jobs' },
  { bn: 'NTRCA', to: '/jobs' },
  { bn: 'অন্যান্য ভর্তি', en: 'Other Admissions', to: '/admissions' },
];

const POPULAR_MOBILE = [
  { bn: 'BCS', to: '/jobs' },
  { bn: 'Bank', to: '/jobs' },
  { bn: 'DU ভর্তি', en: 'DU Admission', to: '/admissions' },
  { bn: 'Medical', to: '/admissions' },
  { bn: 'Engineering', to: '/admissions' },
  { bn: 'Agriculture', to: '/admissions' },
];

type ProgressData = {
  lessons: number;
  attempted: number;
  correct: number;
  quizAttempts: number;
  avgQuiz: number | null;
};

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${percent}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3E7EA" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#12766E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="22" fontWeight="800" fill="#142B3B">
          {percent}%
        </text>
      </svg>
      <div style={{ fontSize: 13, color: 'var(--muted-ivory)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(false);
  const navigate = useNavigate();

  // Real progress only — signed in, from Firestore (progress + quiz
  // attempts). Nothing is shown when there is no data; signed out shows
  // a login prompt instead of a fake ring.
  useEffect(() => {
    if (!user) {
      setProgress(null);
      setProgressError(false);
      setProgressLoading(false);
      return;
    }
    let live = true;
    setProgressLoading(true);
    Promise.all([listSubjectProgress(user.uid), listQuizAttempts(user.uid)])
      .then(([rows, attempts]) => {
        if (!live) return;
        const lessons = rows.reduce((s, r) => s + r.lessonsRead.length, 0);
        const attempted = rows.reduce((s, r) => s + r.questionsAttempted, 0);
        const correct = rows.reduce((s, r) => s + r.questionsCorrect, 0);
        const avgQuiz = attempts.length > 0 ? attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length : null;
        setProgress({ lessons, attempted, correct, quizAttempts: attempts.length, avgQuiz });
        setProgressLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setProgressError(true);
        setProgressLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user]);

  // Mobile hero carousel: 3 slides, auto-advance every 6s, pauses on
  // hover/touch. Slides reuse the real section copy.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setSlide((s) => (s + 1) % 3), 6000);
    return () => window.clearInterval(id);
  }, [paused]);

  const accuracy = progress && progress.attempted > 0 ? Math.round((progress.correct / progress.attempted) * 100) : null;
  const hasProgress = progress !== null && (progress.lessons > 0 || progress.attempted > 0 || progress.quizAttempts > 0);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchText.trim();
    navigate(q ? `/library?q=${encodeURIComponent(q)}` : '/library');
  }

  const heroSlides = [
    { tint: 'ev-home-slide-job', titleBn: 'স্বপ্ন পূরণের পথে Eduvelto', titleEn: 'Eduvelto on the path to your dreams', subBn: 'শেখো, প্রস্তুতি নাও, সফল হও...', subEn: 'Learn, prepare, succeed...', to: '/jobs', ctaBn: 'এখনই শুরু করুন →', ctaEn: 'Start now →' },
    { tint: 'ev-home-slide-admissions', titleBn: 'ভর্তি প্রস্তুতি', titleEn: 'Admission Preparation', subBn: 'বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং ও অন্যান্য', subEn: 'University, Medical, Engineering & more', to: '/admissions', ctaBn: 'ভর্তি প্রস্তুতি নিন →', ctaEn: 'Prepare for admission →' },
    { tint: 'ev-home-slide-academic', titleBn: 'শিক্ষা কার্যক্রম', titleEn: 'Academic Learning', subBn: 'Class 1–12, Madrasa, Technical, Honours & Masters', subEn: 'Class 1–12, Madrasa, Technical, Honours & Masters', to: '/class', ctaBn: 'পড়া শুরু করুন →', ctaEn: 'Start learning →' },
  ];

  return (
    <PageShell titleBn="হোম" titleEn="Home" wide hideHomeLink hideTitle maxWidth={1240}>
      {/* Mobile search bar (≤768px, mockup). Desktop search lives in the header. */}
      <form className="ev-home-msearch" onSubmit={runSearch} role="search">
        <label htmlFor="ev-home-msearch" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {t({ bn: 'খুঁজুন', en: 'Search' })}
        </label>
        <input
          id="ev-home-msearch"
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t({ bn: 'Search anything... (Ex: BCS, DU Admission, Math)', en: 'Search anything... (Ex: BCS, DU Admission, Math)' })}
        />
        <button type="submit" aria-label={t({ bn: 'খুঁজুন', en: 'Search' })}>
          <SearchIcon />
        </button>
      </form>

      {/* Desktop hero (≥769px): light gradient + wordmark, NO photos. */}
      <section className="ev-home-hero" aria-label={t({ bn: 'Eduvelto', en: 'Eduvelto' })}>
        <p className="ev-home-hero-eyebrow">
          <span>{t({ bn: 'সবার জন্য, সবসময়, সম্পূর্ণ শিক্ষা প্ল্যাটফর্ম', en: 'A complete education platform — for everyone, always' })}</span>
        </p>
        <h1 className="ev-home-wordmark" aria-label="Eduvelto — Learn • Grow • Achieve">
          <span className="ev-home-wordmark-edu">Edu</span>
          <span className="ev-home-wordmark-velto">velto</span>
          <span className="ev-home-wordmark-tag">Learn • Grow • Achieve</span>
        </h1>
        <p className="ev-home-hero-line">{t({ bn: 'শেখো, প্রস্তুতি নাও, সফল হও...', en: 'Learn, prepare, succeed...' })}</p>
        <p>
          <span className="ev-home-hero-badge">{t({ bn: 'স্বপ্ন পূরণের পথে Eduvelto সাথেই আছে!', en: 'Eduvelto is with you on the path to your dreams!' })}</span>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          <Link to={user ? '/dashboard' : '/register'} className="ev-btn ev-btn-gold" style={{ textDecoration: 'none' }}>
            {t({ bn: 'এখনই শুরু করুন →', en: 'Start now →' })}
          </Link>
          <Link to="/library" className="ev-btn" style={{ textDecoration: 'none', background: 'var(--card)', borderColor: 'var(--line-strong)' }}>
            {t({ bn: 'লাইব্রেরি দেখুন', en: 'Browse library' })}
          </Link>
        </div>
      </section>

      {/* Mobile hero carousel (≤768px): 3 slides, dots, auto-advance. */}
      <section
        className="ev-home-hero-mobile"
        aria-label={t({ bn: 'Eduvelto', en: 'Eduvelto' })}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
      >
        {heroSlides.map((s, i) => (
          <div key={s.to} className={`ev-home-slide ${s.tint}${i === slide ? ' ev-home-slide-active' : ''}`} aria-hidden={i !== slide}>
            <h2>{t({ bn: s.titleBn, en: s.titleEn })}</h2>
            <p>{t({ bn: s.subBn, en: s.subEn })}</p>
            <Link to={s.to} className="ev-btn ev-btn-sm ev-home-slide-cta" tabIndex={i === slide ? 0 : -1}>
              {t({ bn: s.ctaBn, en: s.ctaEn })}
            </Link>
          </div>
        ))}
        <div className="ev-home-dots" role="tablist" aria-label={t({ bn: 'স্লাইড', en: 'Slides' })}>
          {heroSlides.map((s, i) => (
            <button
              key={s.to}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={t({ bn: `স্লাইড ${i + 1}`, en: `Slide ${i + 1}` })}
              className={`ev-home-dot${i === slide ? ' ev-home-dot-active' : ''}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* Top banner ad — home only (ads placement plan 22 Nov 2026).
          Renders nothing until AdSense is configured; in preview it
          shows a labelled placeholder. */}
      <AdSlot placement="top-banner" />

      {/* Four section cards (mockup). */}
      <section aria-label={t({ bn: 'প্রধান বিভাগ', en: 'Main sections' })}>
        <div className="ev-home-sections">
          {SECTIONS.map((s) => (
            <article key={s.id} className={`ev-home-card ${s.tint}`}>
              {s.badgeBn ? (
                <span className={`ev-home-card-badge${s.badgeMobileOnly ? ' ev-home-card-badge-mobile' : ''}`}>
                  {t({ bn: s.badgeBn, en: s.badgeEn })}
                </span>
              ) : null}
              <span className="ev-home-card-icon" aria-hidden="true">
                {s.icon}
              </span>
              <h2>{t({ bn: s.titleBn, en: s.titleEn })}</h2>
              <p>{t({ bn: s.descBn, en: s.descEn })}</p>
              <Link to={s.to} className="ev-btn ev-home-card-cta">
                {t({ bn: s.ctaBn, en: s.ctaEn })}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Feature strip (desktop) / quick access (mobile). */}
      <section aria-label={t({ bn: 'ফিচার', en: 'Features' })}>
        <div className="ev-home-strip">
          {FEATURES.map((f) => (
            <div key={f.bn} className={`ev-home-strip-item${f.soon ? ' ev-home-strip-soon' : ''}`}>
              {f.to ? (
                <Link to={f.to} className="ev-home-strip-link">
                  <span aria-hidden="true">{f.icon}</span>
                  <span>{t({ bn: f.bn, en: f.en })}</span>
                </Link>
              ) : (
                <span className="ev-home-strip-link" aria-disabled="true">
                  <span aria-hidden="true">{f.icon}</span>
                  <span>{t({ bn: f.bn, en: f.en })}</span>
                  <span className="ev-home-soon-chip">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
                </span>
              )}
            </div>
          ))}
          <div className="ev-home-strip-item ev-home-strip-more">
            <Link to="/about" className="ev-home-strip-link">
              <span>{t({ bn: 'আরও ফিচার দেখুন →', en: 'See more features →' })}</span>
            </Link>
          </div>
        </div>

        <div className="ev-home-quick">
          <div className="ev-home-panel-head">
            <h2>{t({ bn: 'দ্রুত অ্যাক্সেস', en: 'Quick Access' })}</h2>
            <Link to="/about">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
          </div>
          <div className="ev-home-quick-grid">
            {FEATURES.slice(0, 6).map((f) => (
              <div key={f.bn} className={`ev-home-quick-tile${f.soon ? ' ev-home-quick-soon' : ''}`}>
                {f.to ? (
                  <Link to={f.to} className="ev-home-quick-link">
                    <span aria-hidden="true">{f.icon}</span>
                    <span>{t({ bn: f.bn, en: f.en })}</span>
                  </Link>
                ) : (
                  <span className="ev-home-quick-link" aria-disabled="true">
                    <span aria-hidden="true">{f.icon}</span>
                    <span>{t({ bn: f.bn, en: f.en })}</span>
                    <span className="ev-home-soon-chip">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Preparation — Step 5 regrouping (10 categories, tier
          grouping removed) ported onto the redesigned homepage:
          the old homepage's class-cards section is gone, so the
          Jobs section sits here, after the feature strip and
          before the panels. */}
      <JobsSection />

      {/* Three panels (desktop) / stacked panels (mobile). */}
      <section className="ev-home-panels" aria-label={t({ bn: 'আপডেট, অগ্রগতি ও জনপ্রিয়', en: 'Updates, progress and popular' })}>
        {/* সাম্প্রতিক আপডেট — honest empty state: no verified circular
            exists yet, so nothing is listed. */}
        <div className="ev-home-panel">
          <div className="ev-home-panel-head">
            <h2>
              <StarIcon size={18} /> {t({ bn: 'সাম্প্রতিক আপডেট', en: 'Recent Updates' })}
            </h2>
          </div>
          <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 0', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'এখনো কোনো আপডেট নেই। নতুন নিয়োগ ও ভর্তি বিজ্ঞপ্তি প্রকাশিত হলে এখানে দেখা যাবে।', en: 'No updates yet. New job and admission circulars will appear here once published.' })}
          </p>
        </div>

        {/* আপনার পড়াশোনার অগ্রগতি — real data only. */}
        <div className="ev-home-panel">
          <div className="ev-home-panel-head">
            <h2>{t({ bn: 'আপনার পড়াশোনার অগ্রগতি', en: 'Your Study Progress' })}</h2>
            {user && hasProgress ? <Link to="/progress">{t({ bn: 'বিস্তারিত →', en: 'Details →' })}</Link> : null}
          </div>
          {!user ? (
            <div>
              <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 12px', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'লগইন করলে আপনার পড়াশোনার অগ্রগতি এখানে দেখা যাবে।', en: 'Log in to see your study progress here.' })}
              </p>
              <Link to="/login" className="ev-btn ev-btn-primary ev-btn-sm">
                {t({ bn: 'লগইন করুন', en: 'Log in' })}
              </Link>
            </div>
          ) : progressLoading ? (
            <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 0', fontSize: 14 }}>{t({ bn: 'অগ্রগতি লোড হচ্ছে…', en: 'Loading progress…' })}</p>
          ) : progressError ? (
            <p style={{ color: 'var(--error)', margin: '6px 0 0', fontSize: 14 }}>
              {t({ bn: 'অগ্রগতি লোড করা যায়নি — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।', en: 'Could not load progress — please refresh and try again.' })}
            </p>
          ) : !hasProgress ? (
            <div>
              <p style={{ color: 'var(--muted-ivory)', margin: '6px 0 12px', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'এখনো কোনো অগ্রগতি নেই — পাঠ পড়ে বা কুইজ দিয়ে শুরু করুন।', en: 'No progress yet — start by reading a lesson or taking a quiz.' })}
              </p>
              <Link to="/library" className="ev-btn ev-btn-primary ev-btn-sm">
                {t({ bn: 'লাইব্রেরি দেখুন', en: 'Browse library' })}
              </Link>
            </div>
          ) : (
            <div className="ev-home-progress-body">
              {accuracy !== null ? (
                <ProgressRing percent={accuracy} label={t({ bn: 'অনুশীলন প্রশ্নের সঠিক হার', en: 'Practice accuracy' })} />
              ) : null}
              <ul className="ev-home-progress-rows">
                <li>
                  <span>{t({ bn: 'পাঠ সম্পন্ন', en: 'Lessons completed' })}</span>
                  <strong>
                    {lang === 'bn' ? `${progress.lessons}টি` : `${progress.lessons}`}
                  </strong>
                </li>
                <li>
                  <span>{t({ bn: 'প্রশ্নের উত্তর', en: 'Questions answered' })}</span>
                  <strong>
                    {lang === 'bn' ? `${progress.attempted}টি` : `${progress.attempted}`}
                    {progress.attempted > 0 ? ` (${t({ bn: 'সঠিক', en: 'correct' })} ${progress.correct})` : ''}
                  </strong>
                </li>
                <li>
                  <span>{t({ bn: 'কুইজ প্রচেষ্টা', en: 'Quiz attempts' })}</span>
                  <strong>
                    {lang === 'bn' ? `${progress.quizAttempts}টি` : `${progress.quizAttempts}`}
                    {progress.avgQuiz !== null ? ` · ${t({ bn: 'গড়', en: 'avg' })} ${Math.round(progress.avgQuiz)}%` : ''}
                  </strong>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* জনপ্রিয় বিভাগ (desktop) / জনপ্রিয় পরীক্ষা (mobile). */}
        <div className="ev-home-panel">
          <div className="ev-home-panel-head">
            <h2 className="ev-home-popular-desktop">{t({ bn: 'জনপ্রিয় বিভাগ', en: 'Popular Categories' })}</h2>
            <h2 className="ev-home-popular-mobile">{t({ bn: 'জনপ্রিয় পরীক্ষা', en: 'Popular Exams' })}</h2>
            <Link to="/exam">{t({ bn: 'সব দেখুন →', en: 'See all →' })}</Link>
          </div>
          <div className="ev-home-popular-grid">
            {POPULAR.map((p) => (
              <Link key={p.bn} to={p.to} className="ev-home-popular-tile">
                {t({ bn: p.bn, en: p.en ?? p.bn })}
              </Link>
            ))}
          </div>
          <div className="ev-home-popular-row">
            {POPULAR_MOBILE.map((p) => (
              <Link key={p.bn} to={p.to} className="ev-home-popular-tile">
                {t({ bn: p.bn, en: p.en ?? p.bn })}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer banner (mockup). */}
      <section className="ev-home-banner" aria-label={t({ bn: 'Eduvelto', en: 'Eduvelto' })}>
        <span aria-hidden="true" style={{ color: 'var(--amber)' }}>
          <TrophyIcon size={34} />
        </span>
        <div>
          <h2>{t({ bn: 'Eduvelto — একটি প্ল্যাটফর্ম, অসীম সম্ভাবনা!', en: 'Eduvelto — one platform, endless possibilities!' })}</h2>
          <p>{t({ bn: 'শিক্ষা হোক সহজ, প্রস্তুতি হোক স্মার্ট, সফলতা হোক নিশ্চিত।', en: 'Make learning easy, preparation smart, success certain.' })}</p>
        </div>
        <Link to={user ? '/dashboard' : '/register'} className="ev-btn ev-btn-gold ev-home-banner-cta">
          {t({ bn: 'এখনই শুরু করুন →', en: 'Start now →' })}
        </Link>
      </section>
    </PageShell>
  );
}
