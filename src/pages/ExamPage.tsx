// Eduvelto — Exam list (Phase 2, Step 4; pagination 21 Nov 2026).
//
// Server-side pagination: 50 quizzes per page (limit + startAfter), total
// from a count aggregation — opening /exam no longer downloads every
// Published quiz WITH its full questions array (live: 212 quizzes,
// ~0.91 MiB; full inventory: 902 quizzes, ~3.4 MiB). One page of 50 is
// ~0.21 MiB. The quizzes on a page are grouped by book exactly as before.
// The exam-taking path is unchanged: QuizPage still reads ONE quiz doc by
// ID. The "My results" section resolves quiz titles from every page the
// user has visited this session, plus a single-doc fetch for any attempt
// whose quiz is not in that set yet.
//
// Each server page is sorted client-side in the Exam list's usual order
// (class, department, title); the GLOBAL order across pages is document-ID
// order — restoring the old global order needs a composite index (owner
// follow-up, not built here).
// (ui/premium-polish: stat strip, group cards, result cards, skeletons, retry.)

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, SkeletonCards, StatCard } from '../components/ui';
import LoginWall from '../components/LoginWall';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  bookTitleOf,
  getPublishedQuiz,
  listMyAttempts,
  listPublishedQuizzesPage,
  QUIZ_PAGE_SIZE,
  type Quiz,
  type QuizAttempt,
  type QuizPageResult,
} from '../lib/exams';

interface BookGroup {
  bookId: string;
  title: string;
  subject: string;
  department: string;
  classLevel: string;
  quizzes: Quiz[];
}

function groupByBook(quizzes: Quiz[]): BookGroup[] {
  const map = new Map<string, BookGroup>();
  for (const q of quizzes) {
    const g = map.get(q.bookId) ?? {
      bookId: q.bookId,
      title: bookTitleOf(q),
      subject: q.subject,
      department: q.department,
      classLevel: q.classLevel,
      quizzes: [],
    };
    g.quizzes.push(q);
    map.set(q.bookId, g);
  }
  const groups = [...map.values()];
  groups.sort(
    (a, b) =>
      a.classLevel.localeCompare(b.classLevel) ||
      a.department.localeCompare(b.department) ||
      a.title.localeCompare(b.title),
  );
  for (const g of groups) {
    g.quizzes.sort((a, b) => (a.kind === 'mcq' ? -1 : 1) - (b.kind === 'mcq' ? -1 : 1) || a.id.localeCompare(b.id));
  }
  return groups;
}

function formatDate(a: QuizAttempt, lang: 'bn' | 'en'): string {
  const c = a.createdAt;
  let d: Date | null = null;
  if (c instanceof Date) d = c;
  else if (c && typeof c.toDate === 'function') d = c.toDate();
  else if (c && typeof c.seconds === 'number') d = new Date(c.seconds * 1000);
  return d ? d.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export default function ExamPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const [pages, setPages] = useState<QuizPageResult[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // Quiz titles seen on any page visited this session (for the results list).
  const quizByIdRef = useRef(new Map<string, Quiz>());
  const [titlesVersion, setTitlesVersion] = useState(0);

  const loadPage = useCallback(
    async (cursor: QuizPageResult['lastDoc']) => listPublishedQuizzesPage({}, cursor),
    [],
  );

  // AUTH GATING (owner instruction 22 Nov 2026): the exam list is
  // fetched ONLY for a signed-in user. A quiz document embeds its
  // questions, so loading the list for a guest would send questions to
  // a signed-out browser. While auth is loading, the skeleton shows
  // (never flash the wall at a signed-in user whose session is
  // restoring).
  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    setLoading(true);
    loadPage(null)
      .then((first) => {
        if (!alive) return;
        for (const q of first.items) quizByIdRef.current.set(q.id, q);
        setPages([first]);
        setTitlesVersion((v) => v + 1);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(t({ bn: 'পরীক্ষার তালিকা লোড করা যায়নি।', en: 'Could not load the exam list.' }));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loadPage, authLoading, user]);

  useEffect(() => {
    if (!user) {
      setAttempts(null);
      return;
    }
    let alive = true;
    listMyAttempts(user.uid)
      .then((rows) => alive && setAttempts(rows))
      .catch(() => alive && setAttempts([]));
    return () => {
      alive = false;
    };
  }, [user]);

  // Resolve titles for results whose quiz is not on a visited page yet.
  useEffect(() => {
    if (!attempts) return;
    const missing = attempts.slice(0, 20).filter((a) => !quizByIdRef.current.has(a.quizId));
    if (missing.length === 0) return;
    let alive = true;
    (async () => {
      for (const a of missing) {
        try {
          const q = await getPublishedQuiz(a.quizId);
          if (q) quizByIdRef.current.set(q.id, q);
        } catch {
          // Title stays the raw quiz id — the result link still works.
        }
      }
      if (alive) setTitlesVersion((v) => v + 1);
    })();
    return () => {
      alive = false;
    };
  }, [attempts]);

  const currentPage = pages[pageIndex];
  const pageQuizzes = currentPage?.items ?? [];
  const groups = groupByBook(pageQuizzes);
  // titlesVersion is read so the results list re-renders when titles resolve.
  void titlesVersion;
  const quizById = quizByIdRef.current;
  const pageQuestions = pageQuizzes.reduce((s, q) => s + q.questionCount, 0);
  const shownFrom = pageQuizzes.length === 0 ? 0 : pageIndex * QUIZ_PAGE_SIZE + 1;
  const shownTo = pageIndex * QUIZ_PAGE_SIZE + pageQuizzes.length;

  // Reload the first page — retry target for the error AlertBox.
  function reload() {
    setError('');
    setLoading(true);
    loadPage(null)
      .then((first) => {
        for (const q of first.items) quizByIdRef.current.set(q.id, q);
        setPages([first]);
        setPageIndex(0);
        setTitlesVersion((v) => v + 1);
        setLoading(false);
      })
      .catch(() => {
        setError(t({ bn: 'পরীক্ষার তালিকা লোড করা যায়নি।', en: 'Could not load the exam list.' }));
        setLoading(false);
      });
  }

  async function nextPage() {
    if (!currentPage || !currentPage.hasMore) return;
    setLoading(true);
    try {
      const res = await loadPage(currentPage.lastDoc);
      for (const q of res.items) quizByIdRef.current.set(q.id, q);
      setPages((p) => [...p, res]);
      setPageIndex((i) => i + 1);
      setTitlesVersion((v) => v + 1);
    } catch {
      setError(t({ bn: 'পরের পাতা লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the next page — please try again.' }));
    } finally {
      setLoading(false);
    }
  }

  function prevPage() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  // Signed out (auth settled): the wall — the list was never fetched,
  // so no questions reached the browser.
  if (!authLoading && !user) {
    return (
      <PageShell titleBn="পরীক্ষা" titleEn="Exam" wide>
        <LoginWall kind="exam" />
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="পরীক্ষা" titleEn="Exam" wide>
      {error ? (
        <AlertBox tone="error" onRetry={reload}>
          {error}
        </AlertBox>
      ) : null}
      {loading && pages.length === 0 && !error ? (
        <SkeletonCards count={3} />
      ) : pageQuizzes.length === 0 && pageIndex === 0 ? (
        <EmptyState bn="এখনো কোনো পরীক্ষা প্রকাশিত হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No exam has been published yet. Content will appear here once it is published." />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <StatCard value={String(groups.length)} labelBn="বই" labelEn="Books" />
            <StatCard value={String(pageQuizzes.length)} labelBn="পরীক্ষা" labelEn="Exams" />
            <StatCard value={String(pageQuestions)} labelBn="প্রশ্ন" labelEn="Questions" tone="gold" />
          </div>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
            {t({ bn: `এই পাতায় ${groups.length}টি বই · ${pageQuizzes.length}টি পরীক্ষা · ${pageQuestions}টি প্রশ্ন (দেখাচ্ছি ${shownFrom}–${shownTo})`, en: `This page: ${groups.length} books · ${pageQuizzes.length} exams · ${pageQuestions} questions (showing ${shownFrom}–${shownTo})` })}
          </p>
          {groups.map((g) => (
            <Card key={g.bookId} style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", margin: '0 0 6px', fontSize: 18, color: 'var(--heading)' }}>{g.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {[g.subject, g.department, g.classLevel].filter(Boolean).map((t) => (
                  <Chip key={t} tone="outline">{t}</Chip>
                ))}
              </div>
              {g.quizzes.map((q) => (
                <div
                  key={q.id}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #E3E8F0' }}
                >
                  <div>
                    <strong>{q.kind === 'mcq' ? t({ bn: 'MCQ পরীক্ষা', en: 'MCQ exam' }) : t({ bn: 'লিখিত পরীক্ষা', en: 'Written exam' })}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                      {' '}
                      {t({ bn: `· ${q.questionCount}টি প্রশ্ন · ${q.totalMarks} নম্বর · ${q.timeLimitMinutes} মিনিট`, en: `· ${q.questionCount} questions · ${q.totalMarks} marks · ${q.timeLimitMinutes} minutes` })}
                    </span>
                    {q.kind === 'written' ? (
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}> {t({ bn: '· শিক্ষক মূল্যায়ন করবেন', en: '· Marked by a teacher' })}</span>
                    ) : null}
                  </div>
                  {user ? (
                    <LinkButton to={`/quiz/${q.id}`} size="sm">
                      {t({ bn: 'পরীক্ষা দিন', en: 'Take exam' })}
                    </LinkButton>
                  ) : (
                    <Link to="/login" style={{ fontWeight: 600 }}>
                      {t({ bn: 'পরীক্ষা দিতে লগইন করুন', en: 'Log in to take the exam' })}
                    </Link>
                  )}
                </div>
              ))}
            </Card>
          ))}
          {currentPage?.hasMore || pageIndex > 0 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
              <button
                type="button"
                onClick={prevPage}
                disabled={pageIndex <= 0}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid var(--heading)', background: 'var(--card)', color: 'var(--heading)', cursor: 'pointer' }}
              >
                {t({ bn: '← আগের', en: '← Previous' })}
              </button>
              <span>
                {t({ bn: `পাতা ${pageIndex + 1}`, en: `Page ${pageIndex + 1}` })}
              </span>
              <button
                type="button"
                onClick={nextPage}
                disabled={!currentPage?.hasMore || loading}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid var(--heading)', background: 'var(--card)', color: 'var(--heading)', cursor: 'pointer' }}
              >
                {t({ bn: 'পরের →', en: 'Next →' })}
              </button>
            </div>
          ) : null}
        </>
      )}

      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '28px 0 12px' }}>{t({ bn: 'আমার ফলাফল', en: 'My results' })}</h2>
      {!user ? (
        <p>
          {lang === 'bn' ? (
            <>ফলাফল দেখতে <Link to="/login" style={{ fontWeight: 600 }}>লগইন করুন</Link>।</>
          ) : (
            <><Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link> to see your results.</>
          )}
        </p>
      ) : attempts === null ? (
        <SkeletonCards count={2} />
      ) : attempts.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{t({ bn: 'এখনো কোনো পরীক্ষা দেননি।', en: 'You have not taken any exam yet.' })}</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {attempts.slice(0, 20).map((a) => {
            const q = quizById.get(a.quizId);
            const pending = a.markingStatus === 'pending';
            return (
              <Card key={a.id} hover>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link to={`/quiz/${a.quizId}/result/${a.id}`} style={{ fontWeight: 700, color: 'var(--heading)' }}>
                    {q ? bookTitleOf(q) : a.quizId} — {a.kind === 'mcq' ? 'MCQ' : t({ bn: 'লিখিত', en: 'Written' })}
                  </Link>
                  <Chip tone={pending ? 'gold' : 'blue'}>
                    {pending ? t({ bn: 'মূল্যায়নের অপেক্ষায়', en: 'Awaiting marking' }) : `${a.score}/${a.totalMarks} (${a.percentage}%)`}
                  </Chip>
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{formatDate(a, lang)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
