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
import { AlertBox, Button, Card, Chip, ProgressBar, Skeleton } from '../components/ui';
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
        <Skeleton lines={5} />
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
      <Card style={{ marginBottom: 20, borderTop: '4px solid #F1B308' }}>
        <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '0 0 10px' }}>{quiz.title}</h2>
        {attempt.kind === 'mcq' ? (
          <>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0A1F44', margin: '0 0 10px' }}>
              নম্বর: {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%)
            </p>
            <ProgressBar value={attempt.percentage} label={`Score ${attempt.percentage}%`} />
          </>
        ) : attempt.markingStatus === 'pending' ? (
          <p style={{ fontSize: 16, margin: 0 }}>
            উত্তর জমা হয়েছে — শিক্ষক মূল্যায়ন করবেন। মূল্যায়ন শেষ হলে এখানে নম্বর দেখা যাবে। / Answers
            submitted — a teacher will mark them. The score will appear here once marked.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0A1F44', margin: '0 0 10px' }}>
              নম্বর: {attempt.score}/{attempt.totalMarks} ({attempt.percentage}%) · শিক্ষক মূল্যায়ন করেছেন
            </p>
            <ProgressBar value={attempt.percentage} label={`Score ${attempt.percentage}%`} />
          </>
        )}
      </Card>

      {attempt.answers.map((a, i) => {
        const q = questionByN.get(a.n);
        return (
          <Card key={a.n} style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 16, color: '#0A1F44', margin: '0 0 8px' }}>
              {i + 1}. {q?.question ?? ''}
            </h3>
            {attempt.kind === 'mcq' ? (
              <>
                <p style={{ margin: '4px 0' }}>
                  আপনার উত্তর: <strong>{a.selected ?? '—'}</strong>{' '}
                  {a.correct ? (
                    <Chip>✓ সঠিক</Chip>
                  ) : (
                    <Chip tone="outline"><span style={{ color: '#B00020' }}>✗ ভুল</span></Chip>
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
                <p style={{ margin: '4px 0', color: '#5A6478', fontSize: 14 }}>
                  {attempt.markingStatus === 'marked'
                    ? `প্রাপ্ত নম্বর: ${a.marks ?? 0}/${q?.marks ?? 0}`
                    : `পূর্ণ নম্বর: ${q?.marks ?? 0}`}
                </p>
              </>
            )}
            {canMark ? (
              <label style={{ display: 'block', marginTop: 10 }}>
                নম্বর দিন (সর্বোচ্চ {q?.marks ?? 0}):{' '}
                <input
                  type="number"
                  min={0}
                  max={q?.marks ?? 0}
                  step="0.5"
                  value={marks[a.n] ?? ''}
                  onChange={(e) => setMarks((m) => ({ ...m, [a.n]: e.target.value }))}
                  className="ev-input"
                  style={{ width: 96, display: 'inline-block' }}
                />
              </label>
            ) : null}
          </Card>
        );
      })}

      {canMark ? (
        <div>
          {markError ? <AlertBox tone="error">{markError}</AlertBox> : null}
          <Button onClick={() => void doMark()} loading={marking} size="lg">
            মূল্যায়ন সংরক্ষণ করুন
          </Button>
        </div>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link to="/exam" style={{ fontWeight: 600 }}>← সব পরীক্ষা / All exams</Link>
      </p>
    </PageShell>
  );
}
