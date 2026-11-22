// Eduvelto — class dashboard (stage 3: class-wise homepage + mobile app).
//
// Navigation model (owner brief 21 Nov 12:28): Select Class → Class
// Dashboard → Tab → Subject → Book → Chapter. Subject-wise navigation
// lives INSIDE the selected class only.
//
// Tabs: Home, Books, Subjects, Practice, Tests, Results, Progress,
// Profile — one design system, each tab its own layout. Routes:
//   /class/:slug            → Home tab
//   /class/:slug/:tab       → tab (books, subjects, practice, tests,
//                             results, progress, profile)
//   /class/:slug/subjects/:dept → class-scoped subject view
// Book + Chapter levels are the existing working pages
// (/library/:bookId, /books/:bookId/chapters/:chapterId, /lessons/:id).
//
// HONESTY: all counts come from the live fetched books/quizzes; the
// signed-in user's own attempts/bookmarks/progress only. Class 1–5 and
// Class 6–8 have no books — their dashboards show an honest "not ready
// yet" state, never fake subjects, chapters or progress. (Class 5 গণিত
// অধ্যায় ৯ is a draft document, not a library book — it is mentioned as
// "তৈরি হচ্ছে", never as a live book.)
// Ads: Mobile Ad at the top (mobile only) + one In-App Ad on the Home tab
// (mobile only). No ads on Practice/Tests/Results tabs, never during an
// exam, never on Book/Chapter/Lesson/Quiz pages.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, ProgressBar, Reveal, SkeletonCards } from '../components/ui';
import AdPlaceholder from '../components/AdPlaceholder';
import { ComingSoonHero } from '../components/ComingSoon';
import { useAuth } from '../lib/auth';
import { useLanguage, T, TabT } from '../i18n/LanguageContext';
import { listPublishedBooks, type Book } from '../lib/content';
import { listMyAttempts, listPublishedQuizzes, type Quiz, type QuizAttempt } from '../lib/exams';
import { listBookmarks } from '../lib/bookmarks';
import {
  listQuizSummaries,
  listSubjectProgress,
  type QuizSummary,
  type SubjectProgress,
} from '../lib/progress';
import {
  booksForClass,
  classLevelBySlug,
  quizzesForClass,
  subjectsForClass,
} from '../lib/classLevels';
import {
  BooksTab,
  PracticeTab,
  ProfileTab,
  ProgressTab,
  ResultsTab,
  SubjectsTab,
  TestsTab,
  type ClassTabData,
} from './ClassDashboardTabs';

const TABS = [
  { slug: 'home', bn: 'হোম', en: 'Home' },
  { slug: 'books', bn: 'বই', en: 'Books' },
  { slug: 'subjects', bn: 'বিষয়', en: 'Subjects' },
  { slug: 'practice', bn: 'অনুশীলন', en: 'Practice' },
  { slug: 'tests', bn: 'পরীক্ষা', en: 'Tests' },
  { slug: 'results', bn: 'ফলাফল', en: 'Results' },
  { slug: 'progress', bn: 'অগ্রগতি', en: 'Progress' },
  { slug: 'profile', bn: 'প্রোফাইল', en: 'Profile' },
] as const;

type TabSlug = (typeof TABS)[number]['slug'];

function isTabSlug(s: string | undefined): s is TabSlug {
  return !!s && (TABS as readonly { slug: string }[]).some((t) => t.slug === s);
}

function TileIcon({ kind }: { kind: string }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;
  switch (kind) {
    case 'books':
      return (
        <svg {...p}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'tests':
      return (
        <svg {...p}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      );
    case 'practice':
      return (
        <svg {...p}>
          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    case 'results':
      return (
        <svg {...p}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <path d="M9 8l2 2 4-4" />
        </svg>
      );
    case 'progress':
      return (
        <svg {...p}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-6 4 3 5-8" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="12" r="2" />
        </svg>
      );
  }
}

export default function ClassDashboardPage() {
  const { t } = useLanguage();
  const { slug = '', tab } = useParams<{ slug: string; tab?: string }>();
  const def = classLevelBySlug(slug);
  const activeTab: TabSlug = isTabSlug(tab) ? tab : 'home';
  const { user, profile, signOut } = useAuth();

  const [books, setBooks] = useState<Book[] | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [bookmarkBookIds, setBookmarkBookIds] = useState<Set<string>>(new Set());
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [quizSummaries, setQuizSummaries] = useState<QuizSummary[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  function load() {
    setError(false);
    setBooks(null);
    setQuizzes(null);
    // AUTH GATING (owner instruction 22 Nov 2026): the quiz list embeds
    // questions, so it is fetched ONLY for a signed-in user. Guests get
    // an empty quiz list (books still load — the library is public).
    Promise.all([listPublishedBooks(), user ? listPublishedQuizzes() : Promise.resolve([] as Quiz[])])
      .then(([b, q]) => {
        setBooks(b);
        setQuizzes(q);
      })
      .catch(() => setError(true));
  }
  // Re-run when auth resolves: at mount the user is often still null
  // while the session restores; a signed-in user must not be stuck with
  // the guest's empty quiz list.
  useEffect(load, [user]);

  useEffect(() => {
    if (!user) {
      setAttempts([]);
      setBookmarkBookIds(new Set());
      setSubjectProgress([]);
      setQuizSummaries([]);
      return;
    }
    let live = true;
    setUserLoading(true);
    Promise.all([
      listMyAttempts(user.uid),
      listBookmarks(user.uid),
      listSubjectProgress(user.uid),
      listQuizSummaries(user.uid),
    ])
      .then(([at, bm, sp, qs]) => {
        if (!live) return;
        setAttempts(at);
        setBookmarkBookIds(new Set(bm.map((b) => b.bookId)));
        setSubjectProgress(sp);
        setQuizSummaries(qs);
      })
      .catch(() => {
        /* user data is optional — the dashboard still renders */
      })
      .finally(() => {
        if (live) setUserLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user]);

  const classBooks = useMemo(() => (def && books ? booksForClass(books, def) : []), [books, def]);
  const classQuizzes = useMemo(() => (def && quizzes ? quizzesForClass(quizzes, def) : []), [quizzes, def]);
  const classSubjects = useMemo(() => (books && def ? subjectsForClass(books, def) : []), [books, def]);
  const totalQuestions = useMemo(() => classBooks.reduce((s, b) => s + (b.questionCount ?? 0), 0), [classBooks]);
  const totalChapters = useMemo(() => classBooks.reduce((s, b) => s + (b.chapterCount ?? 0), 0), [classBooks]);

  const quizById = useMemo(() => new Map((quizzes ?? []).map((q) => [q.id, q])), [quizzes]);
  const classQuizIds = useMemo(() => new Set(classQuizzes.map((q) => q.id)), [classQuizzes]);
  const classAttempts = useMemo(() => attempts.filter((a) => classQuizIds.has(a.quizId)), [attempts, classQuizIds]);
  const myBooks = useMemo(() => classBooks.filter((b) => bookmarkBookIds.has(b.id)), [classBooks, bookmarkBookIds]);
  const subjectNames = useMemo(() => {
    const s = new Set(classSubjects);
    classBooks.forEach((b) => {
      if (b.subject) s.add(b.subject);
    });
    return s;
  }, [classSubjects, classBooks]);
  const classSubjectProgress = useMemo(
    () => subjectProgress.filter((r) => subjectNames.has(r.subject)),
    [subjectProgress, subjectNames],
  );
  const classQuizSummaries = useMemo(
    () => quizSummaries.filter((s) => subjectNames.has(s.subject)),
    [quizSummaries, subjectNames],
  );

  if (!def) {
    return (
      <PageShell titleBn="শ্রেণি পাওয়া যায়নি" titleEn="Class not found" wide>
        <EmptyState bn="এই শ্রেণিটি খুঁজে পাওয়া যায়নি।" en="This class could not be found." />
        <p style={{ marginTop: 16 }}>
          <Link to="/#select-class" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব শ্রেণি দেখুন', en: '← See all classes' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  const ready = classBooks.length > 0;
  const avgPct =
    classAttempts.length > 0
      ? Math.round(classAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / classAttempts.length)
      : null;

  const tabData: ClassTabData = {
    def,
    books: classBooks,
    quizzes: classQuizzes,
    subjects: classSubjects,
    totalQuestions,
    totalChapters,
    signedIn: !!user,
    attempts: classAttempts,
    quizById,
    myBooks,
    subjectProgress: classSubjectProgress,
    quizSummaries: classQuizSummaries,
  };

  const tabHref = (t: TabSlug) => (t === 'home' ? `/class/${def.slug}` : `/class/${def.slug}/${t}`);
  const quickTiles: Array<{ kind: string; bn: string; en: string; to: string }> = [
    { kind: 'books', bn: 'বই', en: 'Books', to: tabHref('books') },
    { kind: 'tests', bn: 'পরীক্ষা', en: 'Tests', to: tabHref('tests') },
    { kind: 'practice', bn: 'অনুশীলন', en: 'Practice', to: tabHref('practice') },
    { kind: 'results', bn: 'ফলাফল', en: 'Results', to: tabHref('results') },
    { kind: 'progress', bn: 'অগ্রগতি', en: 'Progress', to: tabHref('progress') },
    {
      kind: 'more',
      bn: 'আরও',
      en: 'More',
      to: def.educationType ? `/library?type=${encodeURIComponent(def.educationType)}` : '/library',
    },
  ];

  return (
    <PageShell titleBn={def.bn} titleEn={def.en} wide hideTitle maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/#select-class" style={{ fontWeight: 600 }}>
          {t({ bn: '← সব শ্রেণি', en: '← All classes' })}
        </Link>
      </p>

      {/* Mobile Ad — top of the dashboard on small screens only. */}
      <AdPlaceholder variant="mobile" />

      {/* Class header band — colour identity + real counts. */}
      <section
        className="ev-class-hero"
        style={{ background: def.accent }}
        aria-label={t(def)}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
              fontSize: 26,
              lineHeight: 1.3,
              margin: '0 0 4px',
              color: '#fff',
            }}
          >
            {t({ bn: `${def.bn} — চলো, একসাথে শিখি!`, en: `${def.en} — Let's Learn Together!` })}
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>
            {t({ bn: def.tagBn, en: def.tagEn })}
          </p>
        </div>
        {books === null || quizzes === null ? null : ready ? (
          <div className="ev-class-hero-stats">
            <span>
              <strong>{classBooks.length}</strong>{t({ bn: 'টি বই', en: ' books' })}
            </span>
            <span>
              <strong>{classSubjects.length}</strong>{t({ bn: 'টি বিষয়', en: ' subjects' })}
            </span>
            <span>
              <strong>{totalQuestions}</strong>{t({ bn: 'টি প্রশ্ন', en: ' questions' })}
            </span>
            <span>
              <strong>{classQuizzes.length}</strong>{t({ bn: 'টি পরীক্ষা', en: ' tests' })}
            </span>
          </div>
        ) : (
          <p style={{ margin: '12px 0 0' }}>
            <span className="ev-class-hero-coming">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</span>
          </p>
        )}
      </section>

      {/* Tab bar — Home, Books, Subjects, Practice, Tests, Results, Progress, Profile. */}
      <nav className="ev-class-tabs" aria-label={t({ bn: `${def.bn} — ট্যাব`, en: `${def.en} — tabs` })}>
        {TABS.map((t) => {
          const active = t.slug === activeTab;
          return (
            <Link
              key={t.slug}
              to={tabHref(t.slug)}
              aria-current={active ? 'page' : undefined}
              className="ev-class-tab"
              style={{
                color: active ? def.accentDeep : '#68747B',
                borderBottomColor: active ? def.accent : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              {/* Tab bar — labels follow the selected language (TabT);
                  everything else on the page stays Bangla. */}
              <TabT bn={t.bn} en={t.en} />
            </Link>
          );
        })}
      </nav>

      <div className="ev-rail-grid">
        <div>
          {books === null || quizzes === null ? <SkeletonCards count={3} /> : null}
          {error ? (
            <AlertBox tone="error" onRetry={load}>
              {t({ bn: 'শ্রেণির তথ্য লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load this class — please try again.' })}
            </AlertBox>
          ) : null}

          {books !== null && quizzes !== null ? (
            <>
          {activeTab === 'home' ? (
            <>
              {!ready ? (
                <ComingSoonHero def={def} />
              ) : (
                <>
                  {/* Continue learning — real attempts only, never a fake % */}
                  {user && classAttempts.length > 0 && avgPct !== null ? (
                    <Reveal>
                      <Card style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
                            {t({ bn: 'আপনার অগ্রগতি', en: 'Your progress' })}
                          </div>
                          <strong style={{ color: '#12766E', fontSize: 20 }}>{t({ bn: `${avgPct}% গড়`, en: `${avgPct}% average` })}</strong>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <ProgressBar value={avgPct} />
                        </div>
                        <p style={{ margin: '10px 0 12px', color: '#68747B', fontSize: 14 }}>
                          {t({ bn: `এই শ্রেণিতে ${classAttempts.length}টি পরীক্ষা দিয়েছেন।`, en: `You have taken ${classAttempts.length} tests in this class.` })}
                        </p>
                        <LinkButton to={tabHref('tests')} variant="accent">
                          {t({ bn: 'পড়া চালিয়ে যান →', en: 'Continue Learning →' })}
                        </LinkButton>
                      </Card>
                    </Reveal>
                  ) : user ? (
                    <Reveal>
                      <Card style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'শুরু করুন', en: 'Start learning' })}</div>
                        <p style={{ margin: '6px 0 12px', color: '#68747B', fontSize: 14 }}>
                          {t({ bn: 'এই শ্রেণিতে এখনো কোনো পরীক্ষা দেননি — বই দিয়ে শুরু করুন।', en: 'You have not taken any test in this class yet — start with a book.' })}
                        </p>
                        <LinkButton to={tabHref('books')} variant="accent">
                          {t({ bn: 'বই দেখুন →', en: 'See books →' })}
                        </LinkButton>
                      </Card>
                    </Reveal>
                  ) : (
                    <Reveal>
                      <Card style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'লগইন করে শিখুন', en: 'Log in to learn' })}</div>
                        <p style={{ margin: '6px 0 12px', color: '#68747B', fontSize: 14 }}>
                          {t({ bn: 'লগইন করলে আপনার পড়া, পরীক্ষা ও অগ্রগতি এখানে দেখাবে।', en: 'Log in and your lessons, tests and progress will show here.' })}
                        </p>
                        <LinkButton to="/login" variant="primary">
                          {t({ bn: 'লগইন', en: 'Log in' })}
                        </LinkButton>
                      </Card>
                    </Reveal>
                  )}

                  {/* Quick Access tiles */}
                  <Reveal>
                    <h3 className="ev-section-h2">{t({ bn: 'দ্রুত লিংক', en: 'Quick Access' })}</h3>
                  </Reveal>
                  <div className="ev-quick-tiles">
                    {quickTiles.map((t) => (
                      <Link key={t.kind} to={t.to} className="ev-quick-tile">
                        <span style={{ color: def.accentDeep }}>
                          <TileIcon kind={t.kind} />
                        </span>
                        <span>
                          <T bn={t.bn} en={t.en} />
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* In-App Ad — mobile only, Home tab. */}
                  <AdPlaceholder variant="in-app" />

                  {/* Books preview */}
                  <Reveal>
                    <h3 className="ev-section-h2">{t({ bn: 'বই', en: 'Books' })}</h3>
                  </Reveal>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {classBooks.slice(0, 6).map((b) => (
                      <Reveal key={b.id}>
                        <Card hover>
                          <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}>
                            {b.title}
                          </Link>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                            <Chip>{b.department}</Chip>
                            <Chip tone="outline">{b.classLevel}</Chip>
                            <Chip tone="gold">{t({ bn: `${b.questionCount}টি প্রশ্ন`, en: `${b.questionCount} questions` })}</Chip>
                          </div>
                          <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 14 }}>
                            {t({ bn: `${b.chapterCount}টি পাঠ`, en: `${b.chapterCount} lessons` })}
                          </p>
                        </Card>
                      </Reveal>
                    ))}
                  </div>
                  <p style={{ margin: '12px 0 24px' }}>
                    <Link to={tabHref('books')} style={{ fontWeight: 600 }}>
                      {t({ bn: `সব ${classBooks.length}টি বই দেখুন →`, en: `See all ${classBooks.length} books →` })}
                    </Link>
                  </p>

                  {/* Subjects preview */}
                  <Reveal>
                    <h3 className="ev-section-h2">{t({ bn: 'বিষয়সমূহ', en: 'Subjects' })}</h3>
                  </Reveal>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {classSubjects.map((s) => (
                      <Link key={s} to={`/class/${def.slug}/subjects/${encodeURIComponent(s)}`} style={{ textDecoration: 'none' }}>
                        <Chip>{s}</Chip>
                      </Link>
                    ))}
                  </div>

                  {/* My Books — the user's bookmarked books in this class only */}
                  {user ? (
                    <>
                      <Reveal>
                        <h3 className="ev-section-h2">{t({ bn: 'আমার বই', en: 'My Books' })}</h3>
                      </Reveal>
                      {userLoading ? (
                        <SkeletonCards count={2} />
                      ) : myBooks.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                          {myBooks.slice(0, 6).map((b) => (
                            <Card key={b.id} hover>
                              <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}>
                                {b.title}
                              </Link>
                              <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>
                                {t({ bn: `${b.chapterCount}টি পাঠ · ${b.questionCount}টি প্রশ্ন · সংরক্ষিত`, en: `${b.chapterCount} lessons · ${b.questionCount} questions · saved` })}
                              </p>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#68747B', margin: '0 0 8px' }}>
                          {t({ bn: 'এই শ্রেণিতে এখনো কোনো বই সংরক্ষণ করেননি — বই খুলে বুকমার্ক করুন, সেটি এখানে দেখাবে।', en: 'You have not saved any book in this class yet — open a book and bookmark it, and it will show here.' })}
                        </p>
                      )}
                    </>
                  ) : null}

                  {/* Complete Study Guide — honest status, never "complete" */}
                  <Reveal>
                    <h3 className="ev-section-h2">{t({ bn: 'সম্পূর্ণ গাইড', en: 'Complete Study Guide' })}</h3>
                  </Reveal>
                  <Card>
                    <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'এই শ্রেণির বইগুলো এখন প্রশ্ন ব্যাংক হিসেবে প্রকাশিত — কোনো বই এখনো সম্পূর্ণ গাইড মান (১৮টি আইটেম: ব্যাখ্যা, উদাহরণ, অনুশীলনী, পরীক্ষা, বিশ্লেষণ) পূরণ করেনি। সম্পূর্ণ গাইড তৈরি হচ্ছে; বই প্রকাশিত হলে এখানে আসবে।', en: 'This class’s books are published as question banks so far — no book yet meets the full guide standard (18 items: explanations, examples, exercises, tests, analysis). Complete guides are being prepared; they will appear here once published.' })}
                    </p>
                  </Card>
                </>
              )}
            </>
          ) : null}
          {activeTab === 'books' ? <BooksTab data={tabData} /> : null}
          {activeTab === 'subjects' ? <SubjectsTab data={tabData} /> : null}
          {activeTab === 'practice' ? <PracticeTab data={tabData} /> : null}
          {activeTab === 'tests' ? <TestsTab data={tabData} /> : null}
          {activeTab === 'results' ? <ResultsTab data={tabData} /> : null}
          {activeTab === 'progress' ? <ProgressTab data={tabData} /> : null}
          {activeTab === 'profile' ? <ProfileTab data={tabData} profile={profile} onSignOut={() => void signOut()} /> : null}
            </>
          ) : null}
        </div>
        <AdPlaceholder variant="side" />
      </div>
    </PageShell>
  );
}
