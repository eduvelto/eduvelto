// Eduvelto — progress page (Phase 2, Step 3).
//
// Reads ONE document per subject from `progress` (not a live query over
// all attempts), plus the student's bookmarks. Numbers are labelled
// honestly: "from your practice attempts" — lesson reads and
// self-checked practice questions. Quiz-derived monthly summaries
// (`progressSummaries`, plan Step 3/4) are shown separately when present.
// (ui/premium-polish: stat cards, progress bars, summary cards, skeletons.)

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, ProgressBar, Reveal, SkeletonCards, StatCard } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
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
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { lang, t } = useLanguage();
  const [progress, setProgress] = useState<SubjectProgress[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);
  const [summaries, setSummaries] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState(false);

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
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [user]);

  const totalLessons = (progress ?? []).reduce((s, p) => s + p.lessonsRead.length, 0);
  const totalAttempted = (progress ?? []).reduce((s, p) => s + p.questionsAttempted, 0);
  const totalCorrect = (progress ?? []).reduce((s, p) => s + p.questionsCorrect, 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <PageShell titleBn="অগ্রগতি" titleEn="Progress" wide>
      {loading ? <SkeletonCards count={3} /> : null}
      {!loading && !user ? (
        <Card>
          <p style={{ margin: '0 0 14px' }}>
            {lang === 'bn' ? (
              <>আপনার অগ্রগতি দেখতে <Link to="/login" state={back} style={{ fontWeight: 600 }}>লগইন করুন</Link>।</>
            ) : (
              <><Link to="/login" state={back} style={{ fontWeight: 600 }}>Log in</Link> to see your progress.</>
            )}
          </p>
          <LinkButton to="/login" state={back} variant="accent">
            {t({ bn: 'লগইন করুন', en: 'Log in' })}
          </LinkButton>
        </Card>
      ) : null}
      {error ? (
        <AlertBox tone="error">
          {t({ bn: 'অগ্রগতি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load progress — please try again.' })}
        </AlertBox>
      ) : null}
      {user && progress !== null ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <StatCard value={String(totalLessons)} numeric={totalLessons} labelBn="পাঠ পড়া হয়েছে" labelEn="Lessons read" />
            <StatCard value={String(totalAttempted)} numeric={totalAttempted} labelBn="প্রশ্ন চেষ্টা" labelEn="Questions attempted" />
            <StatCard value={`${accuracy}%`} numeric={accuracy} suffix="%" labelBn="সঠিক উত্তর" labelEn="Correct answers" tone="gold" />
            <StatCard value={String(bookmarks?.length ?? 0)} numeric={bookmarks?.length ?? 0} labelBn="বুকমার্ক" labelEn="Bookmarks" />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {t({ bn: 'এই সংখ্যাগুলো আপনার নিজের অনুশীলনের ভিত্তিতে — পাঠ পড়া ও নিজে যাচাই করা প্রশ্ন।', en: 'These numbers come from your own practice — lessons read and self-checked questions.' })}
          </p>

          {/* Continue learning — quick actions to the real Library / Exam / Routine. */}
          <Reveal>
            <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '24px 0 12px' }}>{t({ bn: 'শেখা চালিয়ে যান', en: 'Continue learning' })}</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 8 }}>
            <Reveal delayMs={0}>
              <Card hover>
                <Link to="/library" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'লাইব্রেরি', en: 'Library' })}</Link>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'নতুন পাঠ পড়ুন ও প্রশ্নের অনুশীলন করুন।', en: 'Read new lessons and practise questions.' })}</p>
              </Card>
            </Reveal>
            <Reveal delayMs={80}>
              <Card hover>
                <Link to="/exam" style={{ fontWeight: 700, color: 'var(--heading)' }}>{t({ bn: 'পরীক্ষা', en: 'Exams' })}</Link>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'কুইজ দিন — ফলাফল এখানে যোগ হবে।', en: 'Take quizzes — results will appear here.' })}</p>
              </Card>
            </Reveal>
            {/* 28 Nov 2026 (completeness audit): the Routine card is
                hidden — the study-plan feature is not built yet and the
                card only showed a "coming soon" note. It returns when
                the feature exists. The /routine route itself stays
                (linked from the header nav) with honest wording. */}
          </div>

          <Reveal>
            <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '24px 0 12px' }}>{t({ bn: 'বিষয় অনুযায়ী', en: 'By subject' })}</h2>
          </Reveal>
          {progress.length === 0 ? (
            <p>{t({ bn: 'এখনো কোনো পাঠ শেষ করেননি — লাইব্রেরি থেকে একটি পাঠ পড়ে “পড়া শেষ করেছি” চাপুন।', en: 'You have not finished a lesson yet — read one from the library and press “Mark lesson complete”.' })}</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {progress.map((p, i) => {
                const pct = p.questionsAttempted > 0 ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100) : 0;
                return (
                  <Reveal key={p.id} delayMs={Math.min(i, 3) * 60}>
                    <Card>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 16, color: 'var(--heading)' }}>{p.subject}</strong>
                        <Chip tone={pct >= 60 ? 'blue' : 'gold'}>
                          {p.questionsAttempted > 0 ? t({ bn: `${pct}% সঠিক`, en: `${pct}% correct` }) : t({ bn: 'এখনো প্রশ্ন করা হয়নি', en: 'No questions attempted yet' })}
                        </Chip>
                      </div>
                      <p style={{ margin: '8px 0', color: 'var(--muted)', fontSize: 14 }}>
                        {t({ bn: `${p.lessonsRead.length}টি পাঠ · ${p.questionsAttempted}টি প্রশ্ন চেষ্টা · ${p.questionsCorrect}টি সঠিক`, en: `${p.lessonsRead.length} lessons · ${p.questionsAttempted} questions attempted · ${p.questionsCorrect} correct` })}
                      </p>
                      {p.questionsAttempted > 0 ? <ProgressBar value={pct} label={t({ bn: `${p.subject}: ${pct}% সঠিক`, en: `${p.subject}: ${pct}% correct` })} /> : null}
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          )}

          {summaries !== null && summaries.length > 0 ? (
            <>
              <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '24px 0 12px' }}>{t({ bn: 'কুইজের ফলাফল', en: 'Quiz results' })}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
                {t({ bn: 'দুর্বল/শক্ত জায়গা আপনার নিজের কুইজ চেষ্টার ভিত্তিতে (৬০%-এর নিচে দুর্বল)।', en: 'Weak/strong areas are based on your own quiz attempts (below 60% is weak).' })}
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {summaries.map((s, i) => (
                  <Reveal key={s.id} delayMs={Math.min(i, 3) * 60}>
                    <Card>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: 16, color: 'var(--heading)' }}>
                          {s.subject} {s.month ? `· ${s.month}` : ''}
                        </strong>
                        <Chip tone="gold">{t({ bn: `গড় ${s.averagePercentage}% · সেরা ${s.bestPercentage}%`, en: `Average ${s.averagePercentage}% · Best ${s.bestPercentage}%` })}</Chip>
                      </div>
                      <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: `${s.attemptsCount}টি চেষ্টা`, en: `${s.attemptsCount} attempts` })}</p>
                      <ProgressBar value={s.averagePercentage} label={t({ bn: `${s.subject} গড় ${s.averagePercentage}%`, en: `${s.subject} average ${s.averagePercentage}%` })} />
                      {s.weakChapters.length > 0 ? (
                        <p style={{ margin: '10px 0 0', fontSize: 14 }}>{t({ bn: 'দুর্বল জায়গা:', en: 'Weak areas:' })} {s.weakChapters.join(', ')}</p>
                      ) : null}
                      {s.strongChapters.length > 0 ? (
                        <p style={{ margin: '6px 0 0', fontSize: 14 }}>{t({ bn: 'শক্ত জায়গা:', en: 'Strong areas:' })} {s.strongChapters.join(', ')}</p>
                      ) : null}
                    </Card>
                  </Reveal>
                ))}
              </div>
            </>
          ) : null}

          <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '24px 0 12px' }}>{t({ bn: `বুকমার্ক (${bookmarks?.length ?? 0})`, en: `Bookmarks (${bookmarks?.length ?? 0})` })}</h2>
          {bookmarks === null ? <SkeletonCards count={2} /> : null}
          {bookmarks !== null && bookmarks.length === 0 ? (
            <p>{t({ bn: 'এখনো কোনো বুকমার্ক নেই — পাঠের পাতায় ☆ বোতাম চাপুন।', en: 'No bookmarks yet — press the ☆ button on a lesson page.' })}</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {(bookmarks ?? []).map((b) => (
                <Card key={b.id} hover>
                  <Link to={`/lessons/${b.lessonId}`} style={{ fontWeight: 600, color: 'var(--heading)' }}>
                    {b.title}
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}
    </PageShell>
  );
}
