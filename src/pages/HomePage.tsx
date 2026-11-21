// Eduvelto — home, class-wise (stage 3: class-wise homepage + mobile app).
//
// The homepage is a LONG SCROLLING page (owner 21 Nov 12:27: "niche baki
// gola takbe scroll korle"): the hero + "Select Your Class" cards come
// first, everything else sits below and appears on scroll.
//
// Order: Top Banner Ad (desktop) / Mobile Ad (mobile) → Hero → Select
// Your Class (5 level cards) → Feature strip → Our Learning Apps →
// Popular Books → Why Choose Eduvelto? + Be a Topper CTA → Real stats →
// New books → How to start → Future roadmap → Explore → Bottom Banner Ad.
// A Desktop Side Ad sits in a sticky right rail beside the hero + class
// section (≥1200px only).
//
// HONESTY: every number is counted from the live published library.
// Popular Books is ranked by question count (most questions first) — the
// criterion is stated under the heading, because no usage/popularity data
// exists. Class 1–5 and Class 6–8 have no books: their cards honestly say
// "শীঘ্রই আসছে / Coming soon". Games, Rewards, Community and AI Teacher
// are deferred — labelled "পরিকল্পনায় আছে / Roadmap", never shown as
// working. Planner (/routine) is a placeholder page — labelled
// "তৈরি হচ্ছে / In preparation". Ad slots are styled placeholders only
// (see components/AdPlaceholder.tsx): no AdSense, no SDK, no activation.
// The real AdSlot in-feed units below still render nothing until AdSense
// is configured.
//
// STAGING MERGE #3 NOTE: the homepage still uses the full
// listPublishedBooks() fetch (pagination 21 Nov 2026 changed it to the
// first page of 50, but the class-wise stats, Popular Books ranking and
// per-class counts all need the WHOLE published library — a 50-book page
// would make those numbers wrong). The 609-book homepage load is the
// known pre-existing issue (see the audit); fixing it needs a counts
// source (e.g. the precomputed stats doc), not a page fetch. Pagination
// still applies on Library / Directory / Exam / Subject pages. No exact
// total is shown anywhere: getCountFromServer fails on live Firestore
// right now (resource-exhausted); see team/pagination-test-report.md §5.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal, SkeletonCards, StatCard } from '../components/ui';
import AdSlot from '../components/AdSlot';
import AdPlaceholder from '../components/AdPlaceholder';
import { ClassCard } from '../components/ClassCards';
import { listPublishedBooks, type Book } from '../lib/content';
import { CLASS_LEVELS, booksForClass, subjectsForClass } from '../lib/classLevels';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function QuizIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 11l2 2 4-4" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 4 3 5-8" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v2a6 6 0 0 1-12 0V3z" />
      <path d="M6 5H3a3 3 0 0 0 3 5" />
      <path d="M18 5h3a3 3 0 0 1-3 5" />
      <path d="M12 13v4" />
      <path d="M8 21h8" />
    </svg>
  );
}
function GameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.6L2 15a3 3 0 0 0 5.6 1.5L9 14h6l1.4 2.5A3 3 0 0 0 22 15l-.7-6.4A4 4 0 0 0 17.32 5z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      <path d="M3.5 12h5l1.5-3 3 6 1.5-3h5.5" />
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12v10H4V12" />
      <rect x="2" y="7" width="20" height="5" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

const FEATURE_STRIP = [
  { icon: <BookIcon />, bn: 'Complete Study', en: 'Notes & Solutions' },
  { icon: <QuizIcon />, bn: 'Practice & Test', en: 'Be Exam Ready' },
  { icon: <ChartIcon />, bn: 'Track Progress', en: 'See Your Growth' },
  { icon: <GiftIcon />, bn: 'Free for All', en: 'Learn Without Cost' },
  { icon: <PhoneIcon />, bn: 'Mobile Friendly', en: 'Learn Anywhere' },
];

const WHY_CHOOSE = [
  { icon: <RocketIcon />, bn: 'Smart Learning', en: 'Anytime, Anywhere' },
  { icon: <TargetIcon />, bn: 'Exam Focused', en: 'Get Better Results' },
  { icon: <UsersIcon />, bn: 'For Every Student', en: 'From Class 1 to HSC' },
  { icon: <ShieldIcon />, bn: 'Trusted Platform', en: 'Safe & Secure' },
];

export default function HomePage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    listPublishedBooks()
      .then((all) => {
        if (!live) return;
        setBooks(all);
      })
      .catch(() => {
        if (live) {
          setBooks([]);
          setError(true);
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const allBooks = books ?? [];
  const subjects = useMemo(
    () => [...new Set(allBooks.map((b) => b.department).filter(Boolean))].sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books],
  );
  const totalQuestions = allBooks.reduce((s, b) => s + (b.questionCount ?? 0), 0);
  const featured = allBooks.slice(0, 6);
  const popular = useMemo(
    () => [...allBooks].sort((a, b) => (b.questionCount ?? 0) - (a.questionCount ?? 0)).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books],
  );
  const perClass = useMemo(
    () =>
      CLASS_LEVELS.map((def) => {
        const cb = booksForClass(allBooks, def);
        return { def, books: cb.length, subjects: subjectsForClass(allBooks, def).length };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books],
  );

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchText.trim();
    navigate(q ? `/library?q=${encodeURIComponent(q)}` : '/library');
  }

  return (
    <PageShell titleBn="হোম" titleEn="Home" wide hideHomeLink hideTitle maxWidth={1240}>
      {/* Top Banner Ad (desktop) / Mobile Ad (mobile) — placeholders only. */}
      <AdPlaceholder variant="top-banner" />
      <AdPlaceholder variant="mobile" />

      <div className="ev-rail-grid">
        <div>
          {/* Hero — deep forest navy + soft amber glow. */}
          <section
            className="ev-hero"
            style={{
              color: '#fff',
              borderRadius: 16,
              padding: '28px 22px',
              marginBottom: 20,
              boxShadow: '0 4px 12px rgba(13,30,41,0.10), 0 2px 4px rgba(13,30,41,0.08)',
            }}
          >
            <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.85)', fontSize: 15, position: 'relative', zIndex: 1 }}>
              Welcome to Eduvelto
            </p>
            <h2
              style={{
                fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
                fontSize: 28,
                lineHeight: 1.3,
                margin: '0 0 8px',
                color: '#fff',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Your <span style={{ color: '#D9A441' }}>Complete</span> Learning Partner
            </h2>
            <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
              শেখো, এগিয়ে যাও, <span style={{ color: '#D9A441' }}>স্বপ্ন গড়ো</span> — Study Smart.
              Practice More. Achieve Higher.
            </p>
            <p className="ev-hero-dream" style={{ position: 'relative', zIndex: 1 }}>
              Dream Big... Learn with Eduvelto!
            </p>
            <form className="ev-hero-search" onSubmit={runSearch} role="search">
              <label htmlFor="ev-hero-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                বই, বিষয় বা প্রশ্ন খুঁজুন / Search books, subjects or questions
              </label>
              <input
                id="ev-hero-search"
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="বই, বিষয় বা প্রশ্ন খুঁজুন… / Search books…"
              />
              <button type="submit" className="ev-btn ev-btn-accent" style={{ flex: 'none' }}>
                <SearchIcon /> খুঁজুন
              </button>
            </form>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, position: 'relative', zIndex: 1 }}>
              <a href="#select-class" className="ev-btn ev-btn-gold">
                Start Learning Now →
              </a>
              <LinkButton to="/library" variant="outline-light">
                লাইব্রেরি দেখুন / Browse library
              </LinkButton>
              <LinkButton to="/exam" variant="outline-light">
                পরীক্ষা দিন / Take an exam
              </LinkButton>
            </div>
          </section>

          {/* Select Your Class — the primary navigation. */}
          <section id="select-class" style={{ scrollMarginTop: 76 }}>
            <Reveal>
              <h2 className="ev-section-h2">আপনার শ্রেণি বেছে নিন / Select Your Class</h2>
            </Reveal>
            <p style={{ color: '#57616A', margin: '-8px 0 14px', fontSize: 14 }}>
              For Every Class, Every Student! — প্রথমে আপনার শ্রেণি বেছে নিন, তারপর সেই শ্রেণির বই,
              বিষয়, পাঠ ও পরীক্ষা দেখুন।
            </p>
            {books === null ? <SkeletonCards count={3} /> : null}
            {error ? (
              <p style={{ color: '#B00020', margin: '0 0 16px' }}>
                বইয়ের তালিকা লোড করা যায়নি — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন। / Could not load
                the book list — please refresh and try again.
              </p>
            ) : null}
            {books !== null ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {perClass.map(({ def, books: bc, subjects: sc }, i) => (
                  <ClassCard key={def.slug} def={def} bookCount={bc} subjectCount={sc} delayMs={Math.min(i, 4) * 60} />
                ))}
              </div>
            ) : null}
          </section>
        </div>

        {/* Desktop Side Ad — sticky right rail, ≥1200px only. Placeholder only. */}
        <AdPlaceholder variant="side" />
      </div>

      {books !== null && books.length === 0 && !error ? (
        <>
          <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
          <p style={{ marginTop: 16 }}>এখানে প্রকাশিত বিষয়, বই ও কুইজ দেখা যাবে। / Published subjects, books and quizzes will appear here.</p>
        </>
      ) : null}
      {books !== null && books.length > 0 ? (
        <>
          {/* Feature strip */}
          <Reveal>
            <div className="ev-feature-strip">
              {FEATURE_STRIP.map((f) => (
                <div key={f.bn} className="ev-feature-strip-item">
                  <span style={{ color: '#12766E' }}>{f.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 14 }}>{f.bn}</div>
                    <div style={{ color: '#68747B', fontSize: 13 }}>{f.en}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Our Learning Apps — working apps link to real pages; deferred
              ones are labelled Roadmap / In preparation, never as working. */}
          <Reveal>
            <h2 className="ev-section-h2">Our Learning Apps / আমাদের শেখার অ্যাপ</h2>
          </Reveal>
          <div className="ev-apps-grid">
            {[
              { icon: <BookIcon />, bn: 'Eduvelto Books', to: '/library', status: null as string | null },
              { icon: <QuizIcon />, bn: 'Eduvelto Quiz', to: '/exam', status: null },
              { icon: <ChartIcon />, bn: 'Eduvelto Progress', to: '/progress', status: null },
              { icon: <TrophyIcon />, bn: 'Eduvelto Exam', to: '/exam', status: null },
              { icon: <GameIcon />, bn: 'Eduvelto Games', to: null, status: 'পরিকল্পনায় আছে / Roadmap' },
              { icon: <CalendarIcon />, bn: 'Eduvelto Planner', to: '/routine', status: 'তৈরি হচ্ছে / In preparation' },
              { icon: <StarIcon />, bn: 'Eduvelto Rewards', to: null, status: 'পরিকল্পনায় আছে / Roadmap' },
              { icon: <UsersIcon />, bn: 'Eduvelto Community', to: '/social', status: 'পরিকল্পনায় আছে / Roadmap' },
            ].map((app) => (
              <div key={app.bn} className="ev-app-tile">
                <span className="ev-icon-tile" aria-hidden="true">
                  {app.icon}
                </span>
                {app.to ? (
                  <Link to={app.to} style={{ fontWeight: 700, color: '#142B3B', fontSize: 14, display: 'block', marginTop: 8 }}>
                    {app.bn}
                  </Link>
                ) : (
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 14, marginTop: 8 }}>{app.bn}</div>
                )}
                {app.status ? (
                  <p style={{ margin: '6px 0 0' }}>
                    <Chip tone="gold">{app.status}</Chip>
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Popular Books — ranked by question count (stated criterion);
              no usage data exists, so no "most viewed" claim is made. */}
          <Reveal>
            <h2 className="ev-section-h2">জনপ্রিয় বই / Popular Books</h2>
          </Reveal>
          <p style={{ color: '#57616A', margin: '-8px 0 14px', fontSize: 13 }}>
            প্রশ্নের সংখ্যা অনুযায়ী সাজানো / Ranked by question count
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 8 }}>
            {popular.map((b: Book, i: number) => (
              <Reveal key={b.id} delayMs={Math.min(i, 5) * 60}>
                <Card hover>
                  <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 15, color: '#142B3B', lineHeight: 1.5 }}>
                    {b.title}
                  </Link>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <Chip>{b.department}</Chip>
                    <Chip tone="outline">{b.classLevel}</Chip>
                  </div>
                  <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 13 }}>
                    {b.questionCount}টি প্রশ্ন · {b.chapterCount}টি পাঠ
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
          <p style={{ margin: '4px 0 24px' }}>
            <Link to="/library" style={{ fontWeight: 600 }}>
              সব বই দেখুন / See all books →
            </Link>
          </p>

          {/* Why Choose Eduvelto? + Be a Topper CTA */}
          <Reveal>
            <h2 className="ev-section-h2">Why Choose Eduvelto? / কেন Eduvelto?</h2>
          </Reveal>
          <div className="ev-why-grid">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {WHY_CHOOSE.map((w) => (
                <Card key={w.bn} hover>
                  <span className="ev-icon-tile" aria-hidden="true">
                    {w.icon}
                  </span>
                  <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>{w.bn}</div>
                  <p style={{ margin: '4px 0 0', color: '#68747B', fontSize: 14 }}>{w.en}</p>
                </Card>
              ))}
            </div>
            <div className="ev-topper-cta">
              <span aria-hidden="true" style={{ color: '#D9A441' }}>
                <TrophyIcon />
              </span>
              <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
                Be a <span style={{ color: '#D9A441' }}>Topper</span>
                <br />
                with Eduvelto!
              </div>
              <a href="#select-class" className="ev-btn ev-btn-gold" style={{ marginTop: 12 }}>
                Start Learning →
              </a>
            </div>
          </div>

          {/* Real statistics only — counted from the live published library. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 24,
              marginTop: 24,
            }}
          >
            <StatCard value={String(books.length)} numeric={books.length} labelBn="প্রকাশিত বই" labelEn="Published books" />
            <StatCard value={String(subjects.length)} numeric={subjects.length} labelBn="বিষয়" labelEn="Subjects" />
            <StatCard value={String(totalQuestions)} numeric={totalQuestions} labelBn="প্রশ্ন" labelEn="Questions" tone="gold" />
          </div>

          <Reveal>
            <h2 className="ev-section-h2">নতুন বই / New books</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 8 }}>
            {featured.map((b: Book, i: number) => (
              <Reveal key={b.id} delayMs={Math.min(i, 3) * 60}>
                <Card hover>
                  <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}>
                    {b.title}
                  </Link>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <Chip>{b.department}</Chip>
                    <Chip tone="outline">{b.classLevel}</Chip>
                    <Chip tone="gold">{b.questionCount}টি প্রশ্ন</Chip>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
          <p style={{ margin: '4px 0 24px' }}>
            <Link to="/library" style={{ fontWeight: 600 }}>
              সব বই দেখুন / See all books →
            </Link>
          </p>

          <Reveal>
            <h2 className="ev-section-h2">কীভাবে শুরু করবেন / How to start</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
            <Reveal delayMs={0}>
              <Card hover>
                <span className="ev-step-num" aria-hidden="true">১</span>
                <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>
                  <Link to="/register">ফ্রি রেজিস্টার করুন</Link>
                </div>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>ইমেইল বা Google দিয়ে — সম্পূর্ণ বিনামূল্যে।</p>
              </Card>
            </Reveal>
            <Reveal delayMs={80}>
              <Card hover>
                <span className="ev-step-num" aria-hidden="true">২</span>
                <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>
                  <Link to="/#select-class">আপনার শ্রেণি বেছে নিন</Link>
                </div>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>শ্রেণি অনুযায়ী বই, বিষয়, পাঠ ও পরীক্ষা।</p>
              </Card>
            </Reveal>
            <Reveal delayMs={160}>
              <Card hover>
                <span className="ev-step-num" aria-hidden="true">৩</span>
                <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>
                  <Link to="/exam">পরীক্ষা দিন</Link>
                </div>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>কুইজ দিয়ে নিজেকে যাচাই করুন, ফলাফল দেখুন।</p>
              </Card>
            </Reveal>
          </div>

          {/* AI Teacher + Community — honest previews, roadmap only. */}
          <Reveal>
            <h2 className="ev-section-h2">ভবিষ্যৎ পরিকল্পনা / Future roadmap</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
            <Reveal delayMs={0}>
              <Card hover>
                <span className="ev-icon-tile" aria-hidden="true"><ChatIcon /></span>
                <Link to="/ai-teacher" style={{ fontWeight: 700, color: '#142B3B', display: 'block' }}>
                  AI Teacher / এআই শিক্ষক
                </Link>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
                  বাংলায় ও ইংরেজিতে প্রশ্নের উত্তর — ভবিষ্যৎ পরিকল্পনায় আছে, এখন তৈরি হচ্ছে না।
                </p>
                <p style={{ margin: '8px 0 0' }}>
                  <Chip tone="gold">পরিকল্পনায় আছে / Roadmap</Chip>
                </p>
              </Card>
            </Reveal>
            <Reveal delayMs={80}>
              <Card hover>
                <span className="ev-icon-tile ev-icon-tile-amber" aria-hidden="true"><UsersIcon /></span>
                <Link to="/social" style={{ fontWeight: 700, color: '#142B3B', display: 'block' }}>
                  কমিউনিটি / Community
                </Link>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
                  শিক্ষার্থীদের আলোচনা ও প্রশ্নোত্তর — ভবিষ্যৎ পরিকল্পনায় আছে।
                </p>
                <p style={{ margin: '8px 0 0' }}>
                  <Chip tone="gold">পরিকল্পনায় আছে / Roadmap</Chip>
                </p>
              </Card>
            </Reveal>
          </div>

          <Reveal>
            <h2 className="ev-section-h2">আরও দেখুন / Explore</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            <Reveal delayMs={0}>
              <Card hover>
                <span className="ev-icon-tile" aria-hidden="true"><BookIcon /></span>
                <Link to="/directory" style={{ fontWeight: 700, color: '#142B3B', display: 'block' }}>
                  শিক্ষা নির্দেশিকা / Education Directory
                </Link>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
                  ধারা → বোর্ড → প্রোগ্রাম → শ্রেণি → বিষয়
                </p>
              </Card>
            </Reveal>
            <Reveal delayMs={80}>
              <Card hover>
                <span className="ev-icon-tile ev-icon-tile-amber" aria-hidden="true"><ChartIcon /></span>
                <Link to="/progress" style={{ fontWeight: 700, color: '#142B3B', display: 'block' }}>
                  আমার অগ্রগতি / My Progress
                </Link>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
                  পাঠ, প্রশ্ন ও কুইজের ফলাফল এক জায়গায়
                </p>
              </Card>
            </Reveal>
            <Reveal delayMs={160}>
              <Card hover>
                <span className="ev-icon-tile" aria-hidden="true"><HeartIcon /></span>
                <Link to="/health" style={{ fontWeight: 700, color: '#142B3B', display: 'block' }}>
                  স্বাস্থ্য / Health
                </Link>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
                  ঔষধ, রোগ ও স্বাস্থ্য তথ্য — যাচাইকৃত
                </p>
              </Card>
            </Reveal>
          </div>
        </>
      ) : null}

      {/* Bottom Banner Ad — in-flow, page bottom. Placeholder only. */}
      <AdPlaceholder variant="bottom-banner" />
      {/* First in-feed ad slot (home list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
