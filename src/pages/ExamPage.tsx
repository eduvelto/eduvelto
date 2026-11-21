// Eduvelto — Exam list (Phase 2, Step 4).
//
// Lists every Published quiz, grouped by book (one row per book with its
// MCQ + written quizzes), plus the signed-in student's own results.
// Quizzes are public data; results need sign-in.
// (ui/premium-polish: stat strip, group cards, result cards, skeletons, retry.)

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, SkeletonCards, StatCard } from '../components/ui';
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
  const [error, setError] = useState(false);

  function loadQuizzes() {
    setError(false);
    setQuizzes(null);
    listPublishedQuizzes()
      .then((qs) => setQuizzes(qs))
      .catch(() => setError(true));
  }

  useEffect(loadQuizzes, []);

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
  const quizCount = (quizzes ?? []).length;

  return (
    <PageShell titleBn="পরীক্ষা" titleEn="Exam" wide>
      {error ? (
        <AlertBox tone="error" onRetry={loadQuizzes}>
          পরীক্ষার তালিকা লোড করা যায়নি। / Could not load the exam list.
        </AlertBox>
      ) : null}
      {quizzes === null && !error ? (
        <SkeletonCards count={3} />
      ) : quizCount === 0 ? (
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
            <StatCard value={String(quizCount)} labelBn="পরীক্ষা" labelEn="Exams" />
            <StatCard value={String(totalQuestions)} labelBn="প্রশ্ন" labelEn="Questions" tone="gold" />
          </div>
          {groups.map((g) => (
            <Card key={g.bookId} style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", margin: '0 0 6px', fontSize: 18, color: '#0A1F44' }}>{g.title}</h2>
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
                    <strong>{q.kind === 'mcq' ? 'MCQ পরীক্ষা' : 'লিখিত পরীক্ষা'}</strong>
                    <span style={{ color: '#5A6478', fontSize: 14 }}>
                      {' '}
                      · {q.questionCount}টি প্রশ্ন · {q.totalMarks} নম্বর · {q.timeLimitMinutes} মিনিট
                    </span>
                    {q.kind === 'written' ? (
                      <span style={{ color: '#5A6478', fontSize: 14 }}> · শিক্ষক মূল্যায়ন করবেন</span>
                    ) : null}
                  </div>
                  {user ? (
                    <LinkButton to={`/quiz/${q.id}`} size="sm">
                      পরীক্ষা দিন
                    </LinkButton>
                  ) : (
                    <Link to="/login" style={{ fontWeight: 600 }}>
                      পরীক্ষা দিতে লগইন করুন
                    </Link>
                  )}
                </div>
              ))}
            </Card>
          ))}
        </>
      )}

      <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '28px 0 12px' }}>আমার ফলাফল / My results</h2>
      {!user ? (
        <p>
          ফলাফল দেখতে <Link to="/login" style={{ fontWeight: 600 }}>লগইন করুন</Link>। / Sign in to see your results.
        </p>
      ) : attempts === null ? (
        <SkeletonCards count={2} />
      ) : attempts.length === 0 ? (
        <p style={{ color: '#5A6478' }}>এখনো কোনো পরীক্ষা দেননি। / You have not taken any exam yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {attempts.slice(0, 20).map((a) => {
            const q = quizById.get(a.quizId);
            const pending = a.markingStatus === 'pending';
            return (
              <Card key={a.id} hover>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link to={`/quiz/${a.quizId}/result/${a.id}`} style={{ fontWeight: 700, color: '#0A1F44' }}>
                    {q ? bookTitleOf(q) : a.quizId} — {a.kind === 'mcq' ? 'MCQ' : 'লিখিত'}
                  </Link>
                  <Chip tone={pending ? 'gold' : 'blue'}>
                    {pending ? 'মূল্যায়নের অপেক্ষায়' : `${a.score}/${a.totalMarks} (${a.percentage}%)`}
                  </Chip>
                </div>
                <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>{formatDate(a)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
