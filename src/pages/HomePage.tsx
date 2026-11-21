// Eduvelto — home (Phase 2, Step 2 + Step 3).
//
// Shows the real published library: counts + a first set of books.
// When nothing is published yet, the honest empty state stays.
// (Design system v2, stage 2: forest-navy hero with education search,
// real-data stats, subject + level chips from live data, honest
// AI Teacher / Community previews — both labelled roadmap-only, since
// neither is under development (owner strategy 21 Nov 10:01: deferred).
// No invented statistics anywhere.)

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal, SkeletonCards, StatCard } from '../components/ui';
import AdSlot from '../components/AdSlot';
import { listPublishedBooks, type Book } from '../lib/content';

/** Small line icons (inline SVG, currentColor) — no emoji as UI icons. */
function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      <path d="M3.5 12h5l1.5-3 3 6 1.5-3h5.5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
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

export default function HomePage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    listPublishedBooks()
      .then((b) => {
        if (live) setBooks(b);
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

  const featured = (books ?? []).slice(0, 6);
  const subjects = [...new Set((books ?? []).map((b) => b.department).filter(Boolean))].sort();
  const levels = [...new Set((books ?? []).map((b) => b.classLevel).filter(Boolean))].sort();
  const totalQuestions = (books ?? []).reduce((s, b) => s + (b.questionCount ?? 0), 0);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchText.trim();
    navigate(q ? `/library?q=${encodeURIComponent(q)}` : '/library');
  }

  return (
    <PageShell titleBn="হোম" titleEn="Home" wide hideHomeLink hideTitle>
      {/* Hero — deep forest navy + soft amber glow. First screen explains
          what Eduvelto offers, with the education search front and centre. */}
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
        <h2
          style={{
            fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
            fontSize: 26,
            lineHeight: 1.35,
            margin: '0 0 8px',
            color: '#fff',
            position: 'relative',
            zIndex: 1,
          }}
        >
          শেখো, এগিয়ে যাও, <span style={{ color: '#D9A441' }}>স্বপ্ন গড়ো</span>
        </h2>
        <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
          Learn, Grow, Achieve — বিনামূল্যে পাঠ, পরীক্ষা ও ডিজিটাল লাইব্রেরি, বাংলায় ও ইংরেজিতে।
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
          <LinkButton to="/library" variant="gold">
            লাইব্রেরি দেখুন / Browse library
          </LinkButton>
          <LinkButton to="/exam" variant="outline-light">
            পরীক্ষা দিন / Take an exam
          </LinkButton>
        </div>
      </section>

      {books === null ? <SkeletonCards count={3} /> : null}
      {error ? (
        <p style={{ color: '#B00020', margin: '0 0 16px' }}>
          বইয়ের তালিকা লোড করা যায়নি — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন। / Could not load the
          book list — please refresh and try again.
        </p>
      ) : null}
      {books !== null && books.length === 0 && !error ? (
        <>
          <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
          <p style={{ marginTop: 16 }}>এখানে প্রকাশিত বিষয়, বই ও কুইজ দেখা যাবে। / Published subjects, books and quizzes will appear here.</p>
        </>
      ) : null}
      {books !== null && books.length > 0 ? (
        <>
          {/* Real statistics only — counted from the live published library. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <StatCard value={String(books.length)} numeric={books.length} labelBn="প্রকাশিত বই" labelEn="Published books" />
            <StatCard value={String(subjects.length)} numeric={subjects.length} labelBn="বিষয়" labelEn="Subjects" />
            <StatCard value={String(totalQuestions)} numeric={totalQuestions} labelBn="প্রশ্ন" labelEn="Questions" tone="gold" />
          </div>

          {/* Learning categories — real departments from the live library. */}
          {subjects.length > 0 ? (
            <>
              <Reveal>
                <h2 className="ev-section-h2">বিষয়সমূহ / Subjects</h2>
              </Reveal>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {subjects.slice(0, 12).map((s) => (
                  <Link key={s} to={`/library?dept=${encodeURIComponent(s)}`} style={{ textDecoration: 'none' }}>
                    <Chip>{s}</Chip>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {/* Academic levels — real class levels from the live library. */}
          {levels.length > 0 ? (
            <>
              <Reveal>
                <h2 className="ev-section-h2">শ্রেণি ও স্তর / Levels</h2>
              </Reveal>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {levels.slice(0, 12).map((lv) => (
                  <Link key={lv} to={`/library?class=${encodeURIComponent(lv)}`} style={{ textDecoration: 'none' }}>
                    <Chip tone="outline">{lv}</Chip>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

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
                  <Link to="/library">আপনার বই খুঁজুন</Link>
                </div>
                <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>শ্রেণি ও বিষয় অনুযায়ী পাঠ ও প্রশ্নোত্তর।</p>
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

          {/* AI Teacher + Community — honest previews. Neither backend is
              live yet, so both are labelled coming soon, never as working. */}
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
      {/* First in-feed ad slot (home list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
