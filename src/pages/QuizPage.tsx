// Eduvelto — Take an exam (Phase 2, Step 4).
//
// MCQ: pick one option per question. Written: type the answer.
// A countdown runs from the quiz time limit and auto-submits at zero.
// Submit is two-step (confirm) so an accidental tap cannot end an exam.
// The answer key is never fetched before submission — submitMcqAttempt
// creates the receipt, reads the key, scores, writes the immutable
// attempt and deletes the receipt (see src/lib/exams.ts).

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import {
  getPublishedQuiz,
  submitMcqAttempt,
  submitWrittenAttempt,
  type Quiz,
} from '../lib/exams';

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!quizId) return;
    let alive = true;
    getPublishedQuiz(quizId)
      .then((q) => {
        if (!alive) return;
        if (!q) setNotFound(true);
        else {
          setQuiz(q);
          setSecondsLeft(q.timeLimitMinutes > 0 ? q.timeLimitMinutes * 60 : null);
        }
      })
      .catch(() => alive && setNotFound(true));
    return () => {
      alive = false;
    };
  }, [quizId]);

  const doSubmit = async () => {
    if (!quiz || !user || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const attemptId =
        quiz.kind === 'mcq'
          ? await submitMcqAttempt(user.uid, quiz, selected)
          : await submitWrittenAttempt(user.uid, quiz, texts);
      navigate(`/quiz/${quiz.id}/result/${attemptId}`);
    } catch (e) {
      setSubmitting(false);
      setConfirming(false);
      setError(`জমা দেওয়া যায়নি — আবার চেষ্টা করুন। / Could not submit — please try again. (${e instanceof Error ? e.message : 'unknown'})`);
    }
  };
  submitRef.current = doSubmit;

  // Countdown: auto-submit once at zero (MCQ + written alike).
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submitRef.current?.();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  if (notFound) {
    return (
      <PageShell titleBn="কুইজ" titleEn="Quiz">
        <EmptyState bn="এই পরীক্ষাটি পাওয়া যায়নি।" en="This exam was not found." />
      </PageShell>
    );
  }
  if (!quiz) {
    return (
      <PageShell titleBn="কুইজ" titleEn="Quiz">
        <p>লোড হচ্ছে… / Loading…</p>
      </PageShell>
    );
  }
  if (!user) {
    return (
      <PageShell titleBn={quiz.title} titleEn="Quiz">
        <p>
          পরীক্ষা দিতে প্রথমে <Link to="/login">লগইন করুন</Link>। / Please{' '}
          <Link to="/login">sign in</Link> to take this exam.
        </p>
      </PageShell>
    );
  }

  const answeredCount =
    quiz.kind === 'mcq'
      ? quiz.questions.filter((q) => selected[q.n]).length
      : quiz.questions.filter((q) => (texts[q.n] ?? '').trim()).length;
  const lowTime = secondsLeft !== null && secondsLeft <= 300;

  return (
    <PageShell titleBn={quiz.title} titleEn={quiz.kind === 'mcq' ? 'MCQ exam' : 'Written exam'}>
      <p style={{ color: '#555', marginTop: 0 }}>
        {quiz.questionCount}টি প্রশ্ন · {quiz.totalMarks} নম্বর · সময় {quiz.timeLimitMinutes} মিনিট
      </p>
      {secondsLeft !== null ? (
        <p style={{ fontSize: 18, fontWeight: 700, color: lowTime ? '#b00020' : '#0A1F44' }}>
          বাকি সময়: {formatTime(secondsLeft)} / Time left: {formatTime(secondsLeft)}
        </p>
      ) : null}
      <p style={{ color: '#555' }}>
        উত্তর দেওয়া হয়েছে: {answeredCount}/{quiz.questionCount} / Answered: {answeredCount}/{quiz.questionCount}
      </p>

      {quiz.questions.map((q, i) => (
        <section key={q.n} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, margin: '0 0 4px' }}>
            {i + 1}. {q.question}
          </h2>
          <p style={{ margin: '0 0 12px', color: '#555', fontSize: 14 }}>
            {q.marks} নম্বর
            {q.topic ? ` · ${q.topic}` : ''}
          </p>
          {quiz.kind === 'mcq' && q.options ? (
            <div role="radiogroup" aria-label={`প্রশ্ন ${i + 1}`}>
              {q.options.map((o) => (
                <label
                  key={o.letter}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    marginBottom: 8,
                    border: selected[q.n] === o.letter ? '2px solid #0A1F44' : '1px solid #ccc',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: selected[q.n] === o.letter ? '#eef3fb' : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${q.n}`}
                    value={o.letter}
                    checked={selected[q.n] === o.letter}
                    onChange={() => setSelected((s) => ({ ...s, [q.n]: o.letter }))}
                    style={{ marginRight: 8 }}
                  />
                  <strong>{o.letter})</strong> {o.text}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={texts[q.n] ?? ''}
              onChange={(e) => setTexts((t) => ({ ...t, [q.n]: e.target.value }))}
              rows={5}
              placeholder="আপনার উত্তর এখানে লিখুন… / Write your answer here…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', fontFamily: 'inherit' }}
            />
          )}
        </section>
      ))}

      {quiz.kind === 'written' ? (
        <p style={{ color: '#555' }}>
          লিখিত উত্তর শিক্ষক মূল্যায়ন করবেন — জমা দেওয়ার পর তাৎক্ষণিক নম্বর দেখানো হবে না। / Written
          answers are marked by a teacher — no instant score after submitting.
        </p>
      ) : null}
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={submitting}
          style={{ padding: '12px 24px', minHeight: 48, fontSize: 16, borderRadius: 6, border: 'none', background: '#0A1F44', color: '#fff', cursor: 'pointer' }}
        >
          জমা দিন / Submit
        </button>
      ) : (
        <div style={{ border: '1px solid #b00020', borderRadius: 8, padding: '16px', background: '#fdf0f0' }}>
          <p style={{ marginTop: 0 }}>
            নিশ্চিত করুন — জমা দেওয়ার পর উত্তর বদলানো যাবে না। / Confirm — answers cannot be changed after
            submitting.
          </p>
          <button
            type="button"
            onClick={() => void doSubmit()}
            disabled={submitting}
            style={{ padding: '12px 24px', minHeight: 48, fontSize: 16, borderRadius: 6, border: 'none', background: '#b00020', color: '#fff', cursor: 'pointer', marginRight: 8 }}
          >
            {submitting ? 'জমা হচ্ছে…' : 'হ্যাঁ, জমা দিন'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={submitting}
            style={{ padding: '12px 24px', minHeight: 48, fontSize: 16, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
          >
            ফিরে যান
          </button>
        </div>
      )}
    </PageShell>
  );
}
