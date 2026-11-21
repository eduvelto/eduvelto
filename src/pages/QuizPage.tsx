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
import { AlertBox, Button, Card, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { lang, t } = useLanguage();
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
      setError(t({ bn: `জমা দেওয়া যায়নি — আবার চেষ্টা করুন। (${e instanceof Error ? e.message : 'unknown'})`, en: `Could not submit — please try again. (${e instanceof Error ? e.message : 'unknown'})` }));
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
        <Skeleton lines={5} />
      </PageShell>
    );
  }
  if (!user) {
    return (
      <PageShell titleBn={quiz.title} titleEn="Quiz">
        <p>
          {lang === 'bn' ? (
            <>পরীক্ষা দিতে প্রথমে <Link to="/login">লগইন করুন</Link>।</>
          ) : (
            <>Please <Link to="/login">sign in</Link> to take this exam.</>
          )}
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
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: '#5A6478', margin: 0 }}>
            {t({ bn: `${quiz.questionCount}টি প্রশ্ন · ${quiz.totalMarks} নম্বর · সময় ${quiz.timeLimitMinutes} মিনিট`, en: `${quiz.questionCount} questions · ${quiz.totalMarks} marks · ${quiz.timeLimitMinutes} minutes` })}
          </p>
          {secondsLeft !== null ? (
            <p style={{ fontSize: 18, fontWeight: 700, color: lowTime ? '#B00020' : '#0A1F44', margin: 0 }}>
              {t({ bn: `বাকি সময়: ${formatTime(secondsLeft)}`, en: `Time left: ${formatTime(secondsLeft)}` })}
            </p>
          ) : null}
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={(answeredCount / quiz.questionCount) * 100} label={t({ bn: `উত্তর দেওয়া হয়েছে ${answeredCount}/${quiz.questionCount}`, en: `Answered ${answeredCount} of ${quiz.questionCount}` })} />
          <p style={{ color: '#5A6478', margin: '6px 0 0', fontSize: 14 }}>
            {t({ bn: `উত্তর দেওয়া হয়েছে: ${answeredCount}/${quiz.questionCount}`, en: `Answered: ${answeredCount}/${quiz.questionCount}` })}
          </p>
        </div>
      </Card>

      {quiz.questions.map((q, i) => (
        <Card key={q.n} style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 17, color: '#0A1F44', margin: '0 0 4px' }}>
            {i + 1}. {q.question}
          </h2>
          <p style={{ margin: '0 0 12px', color: '#5A6478', fontSize: 14 }}>
            {t({ bn: `${q.marks} নম্বর`, en: `${q.marks} marks` })}
            {q.topic ? ` · ${q.topic}` : ''}
          </p>
          {quiz.kind === 'mcq' && q.options ? (
            <div role="radiogroup" aria-label={t({ bn: `প্রশ্ন ${i + 1}`, en: `Question ${i + 1}` })}>
              {q.options.map((o) => (
                <label
                  key={o.letter}
                  style={{
                    display: 'block',
                    padding: '12px',
                    marginBottom: 8,
                    border: selected[q.n] === o.letter ? '2px solid #0A1F44' : '1px solid #C9D2E0',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: selected[q.n] === o.letter ? '#E8EFFA' : '#fff',
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
              placeholder={t({ bn: 'আপনার উত্তর এখানে লিখুন…', en: 'Write your answer here…' })}
              className="ev-textarea"
            />
          )}
        </Card>
      ))}

      {quiz.kind === 'written' ? (
        <p style={{ color: '#5A6478' }}>
          {t({ bn: 'লিখিত উত্তর শিক্ষক মূল্যায়ন করবেন — জমা দেওয়ার পর তাৎক্ষণিক নম্বর দেখানো হবে না।', en: 'Written answers are marked by a teacher — no instant score after submitting.' })}
        </p>
      ) : null}
      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {!confirming ? (
        <Button onClick={() => setConfirming(true)} disabled={submitting} size="lg">
          {t({ bn: 'জমা দিন', en: 'Submit' })}
        </Button>
      ) : (
        <div className="ev-card" style={{ background: '#FDF0F0', borderColor: '#F3C1C8' }}>
          <p style={{ marginTop: 0 }}>
            {t({ bn: 'নিশ্চিত করুন — জমা দেওয়ার পর উত্তর বদলানো যাবে না।', en: 'Confirm — answers cannot be changed after submitting.' })}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button variant="danger" onClick={() => void doSubmit()} loading={submitting}>
              {t({ bn: 'হ্যাঁ, জমা দিন', en: 'Yes, submit' })}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>
              {t({ bn: 'ফিরে যান', en: 'Go back' })}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
