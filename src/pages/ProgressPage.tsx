// Eduvelto — progress page (Phase 2, Step 3).
//
// Reads ONE document per subject from `progress` (not a live query over
// all attempts), plus the student's bookmarks. Numbers are labelled
// honestly: "from your practice attempts" — lesson reads and
// self-checked practice questions. Quiz-derived monthly summaries
// (`progressSummaries`, plan Step 3/4) are shown separately when present.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import { listBookmarks, type Bookmark } from '../lib/bookmarks';
import {
  listQuizSummaries,
  listSubjectProgress,
  recomputeQuizSummaries,
  type QuizSummary,
  type SubjectProgress,
} from '../lib/progress';

export default function ProgressPage() {
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState<SubjectProgress[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [summaries, setSummaries] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setBookmarks(null);
      setSummaries(null);
      return;
    }
    let live = true;
    Promise.all([listSubjectProgress(user.uid), listBookmarks(user.uid)])
      .then(async ([p, b]) => {
        if (!live) return;
        setProgress(p);
        setBookmarks(b);
        // Recompute the monthly quiz summaries from the student's OWN quiz
        // attempts so the page always shows the current summary (a second
        // quiz attempt updates the stored summary). If the recompute fails
        // for any reason, fall back to reading the stored summaries.
        try {
          const s = await recomputeQuizSummaries(user.uid);
          if (live) setSummaries(s);
        } catch {
          try {
            const s = await listQuizSummaries(user.uid);
            if (live) setSummaries(s);
          } catch {
            if (live) setSummaries([]);
          }
        }
      })
      .catch(() => {
        if (live) setError('অগ্রগতি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load progress — please try again.');
      });
    return () => {
      live = false;
    };
  }, [user]);

  const totalLessons = (progress ?? []).reduce((s, p) => s + p.lessonsRead.length, 0);
  const totalAttempted = (progress ?? []).reduce((s, p) => s + p.questionsAttempted, 0);
  const totalCorrect = (progress ?? []).reduce((s, p) => s + p.questionsCorrect, 0);

  return (
    <PageShell titleBn="অগ্রগতি" titleEn="Progress">
      {loading ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {!loading && !user ? (
        <p>
          আপনার অগ্রগতি দেখতে <Link to="/login">লগইন করুন</Link>। /{' '}
          <Link to="/login">Log in</Link> to see your progress.
        </p>
      ) : null}
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {user && progress !== null ? (
        <>
          <p style={{ color: '#555' }}>
            মোট {totalLessons}টি পাঠ পড়া হয়েছে · {totalAttempted}টি প্রশ্ন চেষ্টা করা হয়েছে
            {totalAttempted > 0 ? ` · ${totalCorrect}টি সঠিক (${Math.round((totalCorrect / totalAttempted) * 100)}%)` : ''}
          </p>
          <p style={{ color: '#555', fontSize: 14 }}>
            এই সংখ্যাগুলো আপনার নিজের অনুশীলনের ভিত্তিতে — পাঠ পড়া ও নিজে যাচাই করা প্রশ্ন।
            / These numbers come from your own practice — lessons read and self-checked questions.
          </p>

          <h2 style={{ fontSize: 19, margin: '20px 0 8px' }}>বিষয় অনুযায়ী / By subject</h2>
          {progress.length === 0 ? (
            <p>এখনো কোনো পাঠ শেষ করেননি — লাইব্রেরি থেকে একটি পাঠ পড়ে &quot;পড়া শেষ করেছি&quot; চাপুন। / You have not finished a lesson yet — read one from the library and press “Mark lesson complete”.</p>
          ) : (
            <ul style={{ paddingLeft: 20 }}>
              {progress.map((p) => (
                <li key={p.id} style={{ marginBottom: 10, lineHeight: 1.6 }}>
                  <strong>{p.subject}</strong> — {p.lessonsRead.length}টি পাঠ ·{' '}
                  {p.questionsAttempted}টি প্রশ্ন চেষ্টা
                  {p.questionsAttempted > 0
                    ? ` · ${p.questionsCorrect}টি সঠিক (${Math.round((p.questionsCorrect / p.questionsAttempted) * 100)}%)`
                    : ''}
                </li>
              ))}
            </ul>
          )}

          {summaries !== null && summaries.length > 0 ? (
            <>
              <h2 style={{ fontSize: 19, margin: '20px 0 8px' }}>কুইজের ফলাফল / Quiz results</h2>
              <p style={{ color: '#555', fontSize: 14, margin: '0 0 12px' }}>
                দুর্বল/শক্ত জায়গা আপনার নিজের কুইজ চেষ্টার ভিত্তিতে (৬০%-এর নিচে দুর্বল)। /
                Weak/strong areas are based on your own quiz attempts (below 60% is weak).
              </p>
              <ul style={{ paddingLeft: 20 }}>
                {summaries.map((s) => (
                  <li key={s.id} style={{ marginBottom: 8 }}>
                    {s.subject} {s.month ? `· ${s.month}` : ''} — {s.attemptsCount}টি চেষ্টা · গড়{' '}
                    {s.averagePercentage}% · সেরা {s.bestPercentage}%
                    {s.weakChapters.length > 0 ? (
                      <span style={{ display: 'block' }}>দুর্বল জায়গা / Weak: {s.weakChapters.join(', ')}</span>
                    ) : null}
                    {s.strongChapters.length > 0 ? (
                      <span style={{ display: 'block' }}>শক্ত জায়গা / Strong: {s.strongChapters.join(', ')}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h2 style={{ fontSize: 19, margin: '20px 0 8px' }}>বুকমার্ক / Bookmarks ({bookmarks?.length ?? 0})</h2>
          {bookmarks === null ? <p>লোড হচ্ছে… / Loading…</p> : null}
          {bookmarks !== null && bookmarks.length === 0 ? (
            <p>এখনো কোনো বুকমার্ক নেই — পাঠের পাতায় ☆ বোতাম চাপুন। / No bookmarks yet — press the ☆ button on a lesson page.</p>
          ) : (
            <ul style={{ paddingLeft: 20 }}>
              {(bookmarks ?? []).map((b) => (
                <li key={b.id} style={{ marginBottom: 8 }}>
                  <Link to={`/lessons/${b.lessonId}`}>{b.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </PageShell>
  );
}
