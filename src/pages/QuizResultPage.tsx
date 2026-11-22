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
import LoginWall from '../components/LoginWall';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t } = useLanguage();
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

  // AUTH GATING (owner instruction 22 Nov 2026): results are
  // signed-in only. The fetch effect above already returns early for
  // guests (ownerUid is ''), so no attempt or quiz is fetched here.
  if (!user) {
    return (
      <PageShell titleBn="কুইজের ফলাফল" titleEn="Quiz result">
        <LoginWall kind="result" />
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
      setMarkError(t({ bn: `মূল্যায়ন সংরক্ষণ করা যায়নি। (${e instanceof Error ? e.message : 'unknown'})`, en: `Could not save the marking. (${e instanceof Error ? e.message : 'unknown'})` }));
    } finally {
      setMarking(false);
    }
  };

  return (
    <PageShell titleBn="কুইজের ফলাফল" titleEn="Quiz result">
      <Card style={{ marginBottom: 20, borderTop: '4px solid #F1B308' }}>
        <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '0 0 10px' }}>{quiz.title}</h2>
        {attempt.kind === 'mcq' ? (
          attempt.scored === false ? (
            <p style={{ fontSize: 16, margin: 0 }}>
              {t({ bn: 'উত্তর জমা হয়েছে, কিন্তু নম্বর গণনা সম্পূর্ণ হয়নি। পাতাটি রিফ্রেশ করুন — নম্বর না এলে আবার পরীক্ষা দিন।', en: 'Answers were submitted, but scoring did not finish. Refresh this page — if no score appears, take the quiz again.' })}
            </p>
          ) : (
            <>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#0A1F44', margin: '0 0 10px' }}>
                {t({ bn: `নম্বর: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)`, en: `Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%)` })}
              </p>
              <ProgressBar value={attempt.percentage} label={t({ bn: `নম্বর ${attempt.percentage}%`, en: `Score ${attempt.percentage}%` })} />
              <p style={{ fontSize: 13, color: '#5B6B8C', margin: '10px 0 0' }}>
                {t({ bn: 'অনুশীলন ফলাফল — এটি যাচাইকৃত বা সরকারি ফল নয়।', en: 'Practice result — this is not a verified or official result.' })}
              </p>
            </>
          )
        ) : attempt.markingStatus === 'pending' ? (
          <p style={{ fontSize: 16, margin: 0 }}>
            {t({ bn: 'উত্তর জমা হয়েছে — শিক্ষক মূল্যায়ন করবেন। মূল্যায়ন শেষ হলে এখানে নম্বর দেখা যাবে।', en: 'Answers submitted — a teacher will mark them. The score will appear here once marked.' })}
          </p>
        ) : (
          <>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0A1F44', margin: '0 0 10px' }}>
              {t({ bn: `নম্বর: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%) · শিক্ষক মূল্যায়ন করেছেন`, en: `Score: ${attempt.score}/${attempt.totalMarks} (${attempt.percentage}%) · Marked by a teacher` })}
            </p>
            <ProgressBar value={attempt.percentage} label={t({ bn: `নম্বর ${attempt.percentage}%`, en: `Score ${attempt.percentage}%` })} />
            <p style={{ fontSize: 13, color: '#5B6B8C', margin: '10px 0 0' }}>
              {t({ bn: 'অনুশীলন ফলাফল — এটি যাচাইকৃত বা সরকারি ফল নয়।', en: 'Practice result — this is not a verified or official result.' })}
            </p>
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
                  {t({ bn: 'আপনার উত্তর:', en: 'Your answer:' })} <strong>{a.selected ?? '—'}</strong>{' '}
                  {a.correct ? (
                    <Chip>{t({ bn: '✓ সঠিক', en: '✓ Correct' })}</Chip>
                  ) : (
                    <Chip tone="outline"><span style={{ color: '#B00020' }}>{t({ bn: '✗ ভুল', en: '✗ Incorrect' })}</span></Chip>
                  )}
                </p>
                {!a.correct ? (
                  <p style={{ margin: '4px 0' }}>
                    {t({ bn: 'সঠিক উত্তর:', en: 'Correct answer:' })} <strong>{a.correctText ?? '—'}</strong>
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{a.text || '—'}</p>
                <p style={{ margin: '4px 0', color: '#5A6478', fontSize: 14 }}>
                  {attempt.markingStatus === 'marked'
                    ? t({ bn: `প্রাপ্ত নম্বর: ${a.marks ?? 0}/${q?.marks ?? 0}`, en: `Marks obtained: ${a.marks ?? 0}/${q?.marks ?? 0}` })
                    : t({ bn: `পূর্ণ নম্বর: ${q?.marks ?? 0}`, en: `Full marks: ${q?.marks ?? 0}` })}
                </p>
              </>
            )}
            {canMark ? (
              <label style={{ display: 'block', marginTop: 10 }}>
                {t({ bn: `নম্বর দিন (সর্বোচ্চ ${q?.marks ?? 0}):`, en: `Enter marks (max ${q?.marks ?? 0}):` })}{' '}
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
            {t({ bn: 'মূল্যায়ন সংরক্ষণ করুন', en: 'Save marking' })}
          </Button>
        </div>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link to="/exam" style={{ fontWeight: 600 }}>{t({ bn: '← সব পরীক্ষা', en: '← All exams' })}</Link>
      </p>
    </PageShell>
  );
}
