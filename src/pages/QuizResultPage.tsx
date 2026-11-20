// Eduvelto — Exam result (Phase 2, Step 4).
//
// MCQ: instant score + per-question review (your answer vs the correct
// answer — the correct text was stored in the attempt at submit time,
// so this page never re-reads the answer key).
// Written: shows the submitted answers and the marking status. While
// 'pending', a moderator/admin can mark it here (the attempt owner is
// passed as ?uid=…; the marker's own attempts load without it). Marked
// attempts show the score and per-question marks. Attempts are immutable
// for the student — marking is the only update the rules allow, and only
// on a pending written attempt.

import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import {
  getMyAttempt,
  getPublishedQuiz,
  markWrittenAttempt,
  type Quiz,
  type QuizAttempt,
} from '../lib/exams';

export default function QuizResultPage() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState('');

  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin' || profile?.role === 'owner';
  // A moderator marking someone else's attempt passes the owner uid.
  const ownerUid = searchParams.get('uid') || user?.uid || '';

  useEffect(() => {
    if (!quizId || !attemptId || !ownerUid) return;
    let alive = true;
    Promise.all([getPublishedQuiz(quizId), getMyAttempt(ownerUid, attemptId)])
      .then(([q, a]) => {
        if (!alive) return;
        if (!q || !a) setNotFound(true);
        else {
          setQuiz(q);
          setAttempt(a);
        }
      })
      .catch(() => alive && setNotFound(true));
    return () => {
      alive = false;
    };
  }, [quizId, attemptId, ownerUid]);

  if (!user) {
    return (
      <PageShell titleBn="কুইজের ফলাফল" titleEn="Quiz result">
        <p>
          ফলাফল দেখতে <Link to="/login">লগইন করুন</Link>। / Please <Link to="/login">sign in</Link> to
          see the result.
        </p>
      </PageShell>
    );
  }
  if (notFound) {
    return (
      <PageShell titleBn="কুইজের ফলাফল" titleEn="Quiz result">
        <EmptyState bn="এই ফলাফলটি পাওয়া যায়নি।" en="This result was not found." />
      </PageShell>
    );
  }
  if (!quiz || !attempt) {
    return (
      <PageShell titleBn="কুইজের ফলাফল" titleEn="Quiz result">
        <p>লোড হচ্ছে… / Loading…</p>
      </PageShell>
    );
  }

  const canMark = isModerator && attempt.kind === 'written' && attempt.markingStatus === 'pending';
  const questionByN = new Map(quiz.questions.map((q) => [q.n, q]));

  const doMark = async () => {
    if (!canMark || !user) return;
    setMarking(true);
    setMarkError('');
    try {
      const marksArr = attempt.answers.map((a) => {
        const raw = parseFloat(marks[a.n] ?? '');
        const max = questionByN.get(a.n)?.marks ?? 0;
        if (Number.isNaN(raw)) return 0;
        return Math.max(0, Math.min(max, raw));
      });
      await markWrittenAttempt(user.uid, ownerUid, attempt.id, attempt, marksArr);
      const fresh = await getMyAttempt(ownerUid, attempt.id);
      if (fresh) setAttempt(fresh);
    } catch (e) {
      setMarkError(`মূল্যায়ন সংরক্ষণ করা যায়নি। / Could not save the marking. (${e instanceof Error ? e.message : 'unknown'})`);
    } finally {
      setMarking(false);
    }
  };

  return (
    <PageShell titleBn="কুইজের ফলাফল" titleEn="Quiz result">
      <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>{quiz.title}</h2>
      {attempt.kind === 'mcq' ? (
        <p style={{ fontSize: 20, fontWeight: 700 }}>
          নম্বর: {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
        </p>
      ) : attempt.markingStatus === 'pending' ? (
        <p style={{ fontSize: 17 }}>
          উত্তর জমা হয়েছে — শিক্ষক মূল্যায়ন করবেন। মূল্যায়ন শেষ হলে এখানে নম্বর দেখা যাবে। / Answers
          submitted — a teacher will mark them. The score will appear here once marked.
        </p>
      ) : (
        <p style={{ fontSize: 20, fontWeight: 700 }}>
          নম্বর: {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%) · শিক্ষক মূল্যায়ন করেছেন
        </p>
      )}

      {attempt.answers.map((a, i) => {
        const q = questionByN.get(a.n);
        return (
          <section key={a.n} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>
              {i + 1}. {q?.question ?? ''}
            </h3>
            {attempt.kind === 'mcq' ? (
              <>
                <p style={{ margin: '4px 0' }}>
                  আপনার উত্তর: <strong>{a.selected ?? '—'}</strong>{' '}
                  {a.correct ? (
                    <span style={{ color: '#1a7a1a' }}>✓ সঠিক</span>
                  ) : (
                    <span style={{ color: '#b00020' }}>✗ ভুল</span>
                  )}
                </p>
                {!a.correct ? (
                  <p style={{ margin: '4px 0' }}>
                    সঠিক উত্তর: <strong>{a.correctText ?? '—'}</strong>
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{a.text || '—'}</p>
                <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
                  {attempt.markingStatus === 'marked'
                    ? `প্রাপ্ত নম্বর: ${a.marks ?? 0}/${q?.marks ?? 0}`
                    : `পূর্ণ নম্বর: ${q?.marks ?? 0}`}
                </p>
              </>
            )}
            {canMark ? (
              <label style={{ display: 'block', marginTop: 8 }}>
                নম্বর দিন (সর্বোচ্চ {q?.marks ?? 0}):{' '}
                <input
                  type="number"
                  min={0}
                  max={q?.marks ?? 0}
                  step="0.5"
                  value={marks[a.n] ?? ''}
                  onChange={(e) => setMarks((m) => ({ ...m, [a.n]: e.target.value }))}
                  style={{ width: 80, padding: '8px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }}
                />
              </label>
            ) : null}
          </section>
        );
      })}

      {canMark ? (
        <div>
          {markError ? <p style={{ color: '#b00020' }}>{markError}</p> : null}
          <button
            type="button"
            onClick={() => void doMark()}
            disabled={marking}
            style={{ padding: '12px 24px', minHeight: 48, fontSize: 16, borderRadius: 6, border: 'none', background: '#0A1F44', color: '#fff', cursor: 'pointer' }}
          >
            {marking ? 'সংরক্ষণ হচ্ছে…' : 'মূল্যায়ন সংরক্ষণ করুন'}
          </button>
        </div>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link to="/exam">← সব পরীক্ষা / All exams</Link>
      </p>
    </PageShell>
  );
}
