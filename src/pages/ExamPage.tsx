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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import {
  bookTitleOf,
  countPublishedQuizzes,
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

function formatDate(a: QuizAttempt): string {
  const c = a.createdAt;
  let d: Date | null = null;
  if (c instanceof Date) d = c;
  else if (c && typeof c.toDate === 'function') d = c.toDate();
  else if (c && typeof c.seconds === 'number') d = new Date(c.seconds * 1000);
  return d ? d.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export default function ExamPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState<QuizPageResult[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([loadPage(null), countPublishedQuizzes({})])
      .then(([first, count]) => {
        if (!alive) return;
        for (const q of first.items) quizByIdRef.current.set(q.id, q);
        setPages([first]);
        setTotal(count);
        setTitlesVersion((v) => v + 1);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError('পরীক্ষার তালিকা লোড করা যায়নি। / Could not load the exam list.');
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loadPage]);

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
  const shownFrom = total === 0 ? 0 : pageIndex * QUIZ_PAGE_SIZE + 1;
  const shownTo = pageIndex * QUIZ_PAGE_SIZE + pageQuizzes.length;

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
      setError('পরের পাতা লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the next page — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function prevPage() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  return (
    <PageShell titleBn="পরীক্ষা" titleEn="Exam">
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {loading && pages.length === 0 ? (
        <p>লোড হচ্ছে… / Loading…</p>
      ) : total === 0 ? (
        <EmptyState bn="এখনো কোনো পরীক্ষা প্রকাশিত হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No exam has been published yet. Content will appear here once it is published." />
      ) : (
        <>
          <p style={{ color: '#555', marginTop: 0 }}>
            {total}টি পরীক্ষা প্রকাশিত / {total} exams published
            {pageQuizzes.length > 0
              ? ` — এই পাতায় ${groups.length}টি বই · ${pageQuizzes.length}টি পরীক্ষা · ${pageQuestions}টি প্রশ্ন (দেখাচ্ছি ${shownFrom}–${shownTo}) / this page: ${groups.length} books · ${pageQuizzes.length} exams · ${pageQuestions} questions (showing ${shownFrom}–${shownTo})`
              : ''}
          </p>
          {groups.map((g) => (
            <section key={g.bookId} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{g.title}</h2>
              <p style={{ margin: '0 0 12px', color: '#555', fontSize: 14 }}>
                {[g.subject, g.department, g.classLevel].filter(Boolean).join(' · ')}
              </p>
              {g.quizzes.map((q) => (
                <div
                  key={q.id}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #eee' }}
                >
                  <div>
                    <strong>{q.kind === 'mcq' ? 'MCQ পরীক্ষা' : 'লিখিত পরীক্ষা'}</strong>
                    <span style={{ color: '#555', fontSize: 14 }}>
                      {' '}
                      · {q.questionCount}টি প্রশ্ন · {q.totalMarks} নম্বর · {q.timeLimitMinutes} মিনিট
                    </span>
                    {q.kind === 'written' ? (
                      <span style={{ color: '#555', fontSize: 14 }}> · শিক্ষক মূল্যায়ন করবেন</span>
                    ) : null}
                  </div>
                  {user ? (
                    <Link
                      to={`/quiz/${q.id}`}
                      style={{ background: '#0A1F44', color: '#fff', borderRadius: 6, padding: '10px 18px', textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
                    >
                      পরীক্ষা দিন
                    </Link>
                  ) : (
                    <Link to="/login" style={{ color: '#0A1F44' }}>
                      পরীক্ষা দিতে লগইন করুন
                    </Link>
                  )}
                </div>
              ))}
            </section>
          ))}
          {total !== null && (total > QUIZ_PAGE_SIZE || pageIndex > 0) ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
              <button
                type="button"
                onClick={prevPage}
                disabled={pageIndex <= 0}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
              >
                ← আগের / Previous
              </button>
              <span>
                পাতা {pageIndex + 1} / Page {pageIndex + 1}
                {total > 0 ? ` — মোট ${total}টি পরীক্ষা / ${total} exams total` : ''}
              </span>
              <button
                type="button"
                onClick={nextPage}
                disabled={!currentPage?.hasMore || loading}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
              >
                পরের / Next →
              </button>
            </div>
          ) : null}
        </>
      )}

      <h2 style={{ fontSize: 20, marginTop: 32 }}>আমার ফলাফল / My results</h2>
      {!user ? (
        <p>
          ফলাফল দেখতে <Link to="/login">লগইন করুন</Link>। / Sign in to see your results.
        </p>
      ) : attempts === null ? (
        <p>লোড হচ্ছে… / Loading…</p>
      ) : attempts.length === 0 ? (
        <p style={{ color: '#555' }}>এখনো কোনো পরীক্ষা দেননি। / You have not taken any exam yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {attempts.slice(0, 20).map((a) => {
            const q = quizById.get(a.quizId);
            return (
              <li key={a.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                <Link to={`/quiz/${a.quizId}/result/${a.id}`}>
                  {q ? bookTitleOf(q) : a.quizId} — {a.kind === 'mcq' ? 'MCQ' : 'লিখিত'}
                </Link>
                <span style={{ color: '#555', fontSize: 14 }}>
                  {' '}
                  ·{' '}
                  {a.markingStatus === 'pending'
                    ? 'মূল্যায়নের অপেক্ষায়'
                    : `${a.score}/${a.totalMarks} (${a.percentage}%)`}
                  {' · '}
                  {formatDate(a)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
