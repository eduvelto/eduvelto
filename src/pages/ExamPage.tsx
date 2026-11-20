// Eduvelto — Exam list (Phase 2, Step 4).
//
// Lists every Published quiz, grouped by book (one row per book with its
// MCQ + written quizzes), plus the signed-in student's own results.
// Quizzes are public data; results need sign-in.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import {
  bookTitleOf,
  listMyAttempts,
  listPublishedQuizzes,
  type Quiz,
  type QuizAttempt,
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
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    listPublishedQuizzes()
      .then((qs) => alive && setQuizzes(qs))
      .catch(() => alive && setError('পরীক্ষার তালিকা লোড করা যায়নি। / Could not load the exam list.'));
    return () => {
      alive = false;
    };
  }, []);

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

  const groups = quizzes ? groupByBook(quizzes) : [];
  const quizById = new Map((quizzes ?? []).map((q) => [q.id, q]));
  const totalQuestions = (quizzes ?? []).reduce((s, q) => s + q.questionCount, 0);

  return (
    <PageShell titleBn="পরীক্ষা" titleEn="Exam">
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {quizzes === null ? (
        <p>লোড হচ্ছে… / Loading…</p>
      ) : quizzes.length === 0 ? (
        <EmptyState bn="এখনো কোনো পরীক্ষা প্রকাশিত হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No exam has been published yet. Content will appear here once it is published." />
      ) : (
        <>
          <p style={{ color: '#555', marginTop: 0 }}>
            {groups.length}টি বই · {quizzes.length}টি পরীক্ষা · {totalQuestions}টি প্রশ্ন / {groups.length} books ·{' '}
            {quizzes.length} exams · {totalQuestions} questions
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
