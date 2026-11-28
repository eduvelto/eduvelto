// Eduvelto — General Mock Exam hub + runner (7-day sprint, Day 5).
//
// /:lang/mock-exam (and bare /mock-exam).
//
// HUB: three category cards — Job, Admission, Academic.
//   - Job deep-links to the Job mock engine (/jobs) — this page
//     never rebuilds it.
//   - Admission / Academic list VERIFIED bundles only
//     (status published + reviewStatus Published, see mockExam.ts).
//     A category with no verified bundle says so honestly
//     ("এই বিভাগে এখনো যাচাইকৃত প্রশ্ন নেই") — drafts are never
//     shown and no question is ever invented.
//
// RUNNER (?bundle=<docId>&v=<version>): self-paced TIMED mock
// over one verified bundle. The student picks the negative
// marking (0 / −0.25 / −0.50 / −1.0) BEFORE starting. The timer
// reuses mockTimer.ts (deadline = startedAt + 1 min/question;
// auto-submit at 0). The answer key is loaded ONLY after submit
// (loadMockKeyAfterSubmit) and is never cached — the bundle
// cache (mockExamCache.ts) holds questions + options only.
// Scores are CLIENT-CALCULATED (JOB_PRACTICE_RESULT_LABEL on
// every result view) and the attempt is NOT saved to Firestore
// — the result lives on this page only.
//
// LOGIN: exam-taking requires login (standing rule). Signed-out
// visitors see the login wall; the hub list itself is only
// fetched after sign-in (the bundle read is signed-in-only in
// the rules, so a guest never even asks for it).
//
// LANGUAGE: bilingual Bangla + English (useLanguage).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import LoginWall from '../components/LoginWall';
import { AlertBox, Button, Card, Chip, LinkButton, ProgressBar, SkeletonCards } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import {
  JOB_PRACTICE_RESULT_LABEL,
  MOCK_CATEGORIES,
  NEGATIVE_MARKING_OPTIONS,
  analyseGeneralMockResult,
  groupBundlesByCategory,
  listVerifiedMockBundles,
  loadMockBundleForRun,
  loadMockKeyAfterSubmit,
  scoreGeneralMock,
  seedForAttempt,
  shuffleQuestions,
  timeMinutesFor,
  type NegativeMarkingOption,
  type VerifiedMockBundle,
} from '../lib/mockExam';
import { TOPIC_ACTION_BADGE_BN, TOPIC_ACTION_BADGE_EN } from '../lib/jobAnalysis';
import { computeRemainingMillis, resolveExamClockOffsetMillis } from '../lib/mockTimer';
import { JOB_PRACTICE_RESULT_LABEL_EN } from '../lib/jobEngine';
import type { JobAttemptResult } from '../lib/jobEngine';
import type { PracticeBundleWithId } from '../lib/jobPractice';

type Phase = 'loading' | 'hub' | 'intro' | 'running' | 'result' | 'error';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSeconds(total: number): string {
  const s = Math.round(total);
  if (s < 60) return `${s} সেকেন্ড`;
  const m = Math.floor(s / 60);
  return `${m} মিনিট ${s % 60} সেকেন্ড`;
}

export default function MockExamPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const bundleId = searchParams.get('bundle') ?? '';
  const bundleVersion = Number(searchParams.get('v') ?? '0');

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [bundles, setBundles] = useState<VerifiedMockBundle[]>([]);
  const [meta, setMeta] = useState<VerifiedMockBundle | null>(null);
  const [bundle, setBundle] = useState<PracticeBundleWithId | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState<NegativeMarkingOption>(0);
  const [attemptIndex, setAttemptIndex] = useState(0);

  // Running state.
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | null>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [startedAtMillis, setStartedAtMillis] = useState(0);
  const [deadlineMillis, setDeadlineMillis] = useState<number | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<JobAttemptResult | null>(null);

  const questionStartRef = useRef<number>(0);
  const timeMapRef = useRef<Record<number, number>>({});
  const autoSubmittedRef = useRef(false);
  const submittingRef = useRef(false);

  const grouped = groupBundlesByCategory(bundles);

  // Load the hub list (signed-in only — the bundle read is
  // signed-in-only in the rules).
  useEffect(() => {
    if (bundleId) return;
    if (!user) {
      setPhase('hub');
      return;
    }
    let cancelled = false;
    setPhase('loading');
    listVerifiedMockBundles()
      .then((list) => {
        if (cancelled) return;
        setBundles(list);
        setPhase('hub');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'তালিকা পড়া যায়নি।');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [bundleId, user]);

  // Load one bundle for the runner.
  useEffect(() => {
    if (!bundleId || !user) return;
    if (!Number.isInteger(bundleVersion) || bundleVersion < 1) {
      setError('মকের সংস্করণ (version) পাওয়া যায়নি — হাব থেকে আবার শুরু করুন।');
      setPhase('error');
      return;
    }
    let cancelled = false;
    setPhase('loading');
    loadMockBundleForRun(bundleId, bundleVersion)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setError('এই মকের যাচাইকৃত প্রশ্ন পাওয়া যায়নি — হয়তো প্রশ্নসেটটি আর প্রকাশিত নেই।');
          setPhase('error');
          return;
        }
        const metaFound = bundles.find((b) => b.docId === bundleId) ?? null;
        setMeta(
          metaFound ?? {
            docId: bundleId,
            titleBn: loaded.bundle.titleBn,
            titleEn: loaded.bundle.titleEn,
            examSlug: loaded.bundle.examSlug,
            category: 'academic',
            kind: 'topic',
            questionCount: loaded.bundle.questions.length,
            bundleVersion: loaded.bundle.bundleVersion,
          },
        );
        setBundle(loaded.bundle);
        setFromCache(loaded.fromCache);
        setPhase('intro');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'মক লোড করা যায়নি।');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
    // bundles is intentionally not a dep: the runner must work
    // from a direct link too (meta falls back to the bundle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundleId, bundleVersion, user]);

  // 1-second ticker while running.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const remaining = phase === 'running'
    ? computeRemainingMillis(deadlineMillis, now, clockOffset)
    : null;

  const flushQuestionTime = useCallback((uptoMillis: number) => {
    const q = bundle?.questions[current];
    if (!q) return;
    const spent = Math.max(0, Math.round((uptoMillis - questionStartRef.current) / 1000));
    const next = { ...timeMapRef.current, [q.n]: (timeMapRef.current[q.n] ?? 0) + spent };
    timeMapRef.current = next;
    questionStartRef.current = uptoMillis;
  }, [bundle, current]);

  const goToQuestion = useCallback((index: number) => {
    const nowMillis = Date.now();
    flushQuestionTime(nowMillis);
    setCurrent(index);
    setNow(nowMillis);
  }, [flushQuestionTime]);

  const startMock = useCallback(() => {
    if (!bundle || !meta) return;
    const seed = seedForAttempt(bundle.docId, bundle.bundleVersion, attemptIndex);
    const shuffled = shuffleQuestions(bundle.questions, seed);
    const started = Date.now();
    const minutes = timeMinutesFor(shuffled.length);
    setBundle({ ...bundle, questions: shuffled });
    setSelected({});
    setMarked(new Set());
    timeMapRef.current = {};
    setCurrent(0);
    setResult(null);
    setSubmitError('');
    setStartedAtMillis(started);
    setDeadlineMillis(started + minutes * 60 * 1000);
    // Fresh start: startedAt ≈ now, so the offset is a valid
    // skew measurement (mockTimer.ts).
    setClockOffset(resolveExamClockOffsetMillis({ startedAtMillis: started, nowMillis: started, isResume: false }));
    questionStartRef.current = started;
    autoSubmittedRef.current = false;
    submittingRef.current = false;
    setNow(started);
    setPhase('running');
  }, [bundle, meta, attemptIndex]);

  const submitMock = useCallback(async () => {
    if (!bundle || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    const submitMillis = Date.now();
    flushQuestionTime(submitMillis);
    const finalTimes = { ...timeMapRef.current };
    try {
      // KEY — loaded ONLY after submit, held in memory, never cached.
      const key = await loadMockKeyAfterSubmit(bundle.docId);
      const scored = scoreGeneralMock({
        bundle,
        key,
        answers: bundle.questions.map((q) => ({
          n: q.n,
          questionId: q.questionId,
          selected: selected[q.n] ?? null,
          timeSpentSeconds: finalTimes[q.n] ?? 0,
        })),
        negativeMarking,
        startedAtMillis,
        submittedAtMillis: submitMillis,
      });
      setResult(scored);
      setPhase('result');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'ফলাফল হিসাব করা যায়নি — আবার চেষ্টা করুন।');
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [bundle, selected, negativeMarking, startedAtMillis, flushQuestionTime]);

  // Auto-submit at the deadline (once).
  useEffect(() => {
    if (phase === 'running' && remaining !== null && remaining <= 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      void submitMock();
    }
  }, [phase, remaining, submitMock]);

  const backToHub = useCallback(() => {
    setSearchParams({}, { replace: true });
    setBundle(null);
    setMeta(null);
    setResult(null);
    setPhase(user ? 'loading' : 'hub');
    if (user) {
      listVerifiedMockBundles()
        .then((list) => {
          setBundles(list);
          setPhase('hub');
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'তালিকা পড়া যায়নি।');
          setPhase('error');
        });
    }
  }, [setSearchParams, user]);

  const analytics = result ? analyseGeneralMockResult(result) : null;

  return (
    <PageShell
      titleBn="মক পরীক্ষা"
      titleEn="Mock Exam"
      wide
    >
      <p style={{ color: '#5A6478', margin: '0 0 20px' }}>
        {t({
          bn: 'যাচাইকৃত অনুশীলন প্রশ্নে নিজের গতিতে মক পরীক্ষা দিন — সময় শেষ হলে উত্তর জমা হয়ে যাবে।',
          en: 'Take a self-paced mock exam on verified practice questions — answers submit when the time ends.',
        })}
      </p>

      {phase === 'loading' ? <SkeletonCards count={3} /> : null}

      {phase === 'error' ? (
        <AlertBox tone="error" onRetry={backToHub}>
          {error}
        </AlertBox>
      ) : null}

      {!user && phase !== 'loading' && phase !== 'error' ? (
        <LoginWall kind="exam" contextTitle={t({ bn: 'মক পরীক্ষা', en: 'Mock Exam' })} />
      ) : null}

      {/* ------------------------- HUB ------------------------- */}
      {user && phase === 'hub' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Job — deep-link to the Job mock engine. */}
          <Card>
            <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>
              {t({ bn: 'চাকরি', en: 'Job' })}
            </h2>
            <p style={{ margin: '0 0 12px', color: '#5A6478' }}>
              {t({
                bn: 'বিসিএস, ব্যাংক, প্রাইমারি, এনটিআরসিএ — চাকরির মক চলে চাকরি প্রস্তুতির নিজস্ব ইঞ্জিনে।',
                en: 'BCS, Bank, Primary, NTRCA — job mocks run on the Job Preparation engine.',
              })}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <LinkButton to={`/${lang}/jobs`}>
                {t({ bn: 'চাকরি প্রস্তুতি খুলুন', en: 'Open Job Preparation' })}
              </LinkButton>
              <LinkButton to={`/${lang}/jobs/mock/full__bcs__1`} variant="outline">
                {t({ bn: 'বিসিএস পূর্ণাঙ্গ মক', en: 'BCS full mock' })}
              </LinkButton>
            </div>
            {grouped.job.length > 0 ? (
              <p style={{ margin: '12px 0 0', color: '#5A6478' }}>
                {t({
                  bn: `যাচাইকৃত চাকরির বান্ডেল: ${grouped.job.length}টি — এগুলো চাকরি প্রস্তুতির মক ইঞ্জিনেই চলে।`,
                  en: `Verified job bundles: ${grouped.job.length} — these run on the Job mock engine.`,
                })}
              </p>
            ) : null}
          </Card>

          {MOCK_CATEGORIES.filter((c) => c.category !== 'job').map((cat) => {
            const list = grouped[cat.category];
            return (
              <Card key={cat.category}>
                <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>
                  {t({ bn: cat.nameBn, en: cat.nameEn })}
                </h2>
                {list.length === 0 ? (
                  <>
                    <p style={{ margin: '0 0 4px', color: '#5A6478' }}>
                      {t({ bn: cat.emptyBn, en: cat.emptyEn })}
                    </p>
                    <p style={{ margin: 0, color: '#5A6478', fontSize: 14 }}>
                      {t({
                        bn: cat.category === 'admission'
                          ? '৯৭৭টি ভর্তির খসড়া প্রশ্ন যাচাইয়ের অপেক্ষায় আছে — এখানে শুধু যাচাইকৃত প্রশ্ন দেখানো হয়।'
                          : 'খসড়া প্রশ্ন যাচাইয়ের অপেক্ষায় আছে — এখানে শুধু যাচাইকৃত প্রশ্ন দেখানো হয়।',
                        en: cat.category === 'admission'
                          ? '977 admission draft questions are awaiting review — only verified questions are shown here.'
                          : 'Draft questions are awaiting review — only verified questions are shown here.',
                      })}
                    </p>
                  </>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {list.map((b) => (
                      <div
                        key={b.docId}
                        style={{
                          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
                          justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{lang === 'bn' ? b.titleBn : b.titleEn}</div>
                          <div style={{ color: '#5A6478', fontSize: 14 }}>
                            {t({ bn: `${b.questionCount}টি প্রশ্ন · ${timeMinutesFor(b.questionCount)} মিনিট`, en: `${b.questionCount} questions · ${timeMinutesFor(b.questionCount)} min` })}
                            {' '}
                            {cat.category === 'academic' ? (
                              <Chip tone="outline">
                                {t({ bn: 'যাচাইকৃত অনুশীলন প্রশ্ন', en: 'Verified practice questions' })}
                              </Chip>
                            ) : null}
                          </div>
                        </div>
                        <LinkButton
                          to={`${location.pathname}?bundle=${encodeURIComponent(b.docId)}&v=${b.bundleVersion}`}
                        >
                          {t({ bn: 'মক শুরু করুন', en: 'Start mock' })}
                        </LinkButton>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* ------------------------- INTRO ------------------------- */}
      {user && phase === 'intro' && bundle && meta ? (
        <Card>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{lang === 'bn' ? meta.titleBn : meta.titleEn}</h2>
          <p style={{ margin: '0 0 6px', color: '#5A6478' }}>
            {t({
              bn: `${bundle.questions.length}টি যাচাইকৃত অনুশীলন প্রশ্ন · ${timeMinutesFor(bundle.questions.length)} মিনিট · প্রতি প্রশ্নে ১ নম্বর`,
              en: `${bundle.questions.length} verified practice questions · ${timeMinutesFor(bundle.questions.length)} minutes · 1 mark per question`,
            })}
          </p>
          {fromCache ? (
            <p style={{ margin: '0 0 12px', color: '#5A6478', fontSize: 14 }}>
              {t({
                bn: 'প্রশ্নগুলো আপনার ডিভাইসের ক্যাশ থেকে লোড হয়েছে — নতুন করে পড়া হয়নি।',
                en: 'Questions were loaded from your device cache — not re-read.',
              })}
            </p>
          ) : null}
          <h3 style={{ margin: '16px 0 8px', fontSize: 16 }}>
            {t({ bn: 'নেগেটিভ মার্কিং বেছে নিন', en: 'Choose negative marking' })}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {NEGATIVE_MARKING_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant={negativeMarking === opt ? 'primary' : 'outline'}
                onClick={() => setNegativeMarking(opt)}
              >
                {opt === 0
                  ? t({ bn: 'নেই (০)', en: 'None (0)' })
                  : `−${opt}`}
              </Button>
            ))}
          </div>
          <p style={{ margin: '0 0 16px', color: '#5A6478', fontSize: 14 }}>
            {t({
              bn: negativeMarking === 0
                ? 'ভুল উত্তরে কোনো নম্বর কাটা যাবে না।'
                : `প্রতি ভুল উত্তরে ${negativeMarking} নম্বর কাটা যাবে। উত্তর না দিলে নম্বর কাটা যাবে না।`,
              en: negativeMarking === 0
                ? 'No marks will be deducted for wrong answers.'
                : `${negativeMarking} mark will be deducted per wrong answer. Unanswered questions cost nothing.`,
            })}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Button onClick={startMock}>
              {t({ bn: 'মক শুরু করুন', en: 'Start mock' })}
            </Button>
            <Button variant="outline" onClick={backToHub}>
              {t({ bn: 'হাবে ফিরুন', en: 'Back to hub' })}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* ------------------------- RUNNING ------------------------- */}
      {user && phase === 'running' && bundle ? (
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <strong>
                {t({ bn: 'বাকি সময়', en: 'Time left' })}: {remaining === null ? '—' : formatRemaining(remaining)}
              </strong>
              <span style={{ color: '#5A6478' }}>
                {t({ bn: `প্রশ্ন ${current + 1} / ${bundle.questions.length}`, en: `Question ${current + 1} / ${bundle.questions.length}` })}
              </span>
            </div>
            <ProgressBar value={((current + 1) / bundle.questions.length) * 100} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {bundle.questions.map((q, i) => {
                const answered = selected[q.n] !== null && selected[q.n] !== undefined;
                const isMarked = marked.has(q.n);
                return (
                  <button
                    key={q.n}
                    type="button"
                    onClick={() => goToQuestion(i)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                      border: i === current ? '2px solid #0A1F44' : '1px solid var(--line)',
                      background: answered ? '#0A1F44' : isMarked ? '#F1B308' : 'var(--hatch-widget-surface, #fff)',
                      color: answered ? '#fff' : '#0A1F44',
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            {(() => {
              const q = bundle.questions[current];
              const sel = selected[q.n] ?? null;
              return (
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
                    {current + 1}. {q.questionText}
                  </p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {q.options.map((opt) => (
                      <button
                        key={opt.letter}
                        type="button"
                        onClick={() => setSelected((prev) => ({ ...prev, [q.n]: opt.letter }))}
                        style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          border: sel === opt.letter ? '2px solid #0A1F44' : '1px solid var(--line)',
                          background: sel === opt.letter ? '#EAF0FA' : 'transparent',
                          fontSize: 16,
                        }}
                      >
                        <strong>{opt.letter}.</strong> {opt.text}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                    <Button variant="outline" disabled={current === 0} onClick={() => goToQuestion(current - 1)}>
                      {t({ bn: '← আগেরটি', en: '← Previous' })}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMarked((prev) => {
                          const next = new Set(prev);
                          if (next.has(q.n)) next.delete(q.n);
                          else next.add(q.n);
                          return next;
                        });
                      }}
                    >
                      {marked.has(q.n)
                        ? t({ bn: 'চিহ্ন তুলুন', en: 'Unmark' })
                        : t({ bn: 'পরে দেখার জন্য চিহ্ন দিন', en: 'Mark for review' })}
                    </Button>
                    {current < bundle.questions.length - 1 ? (
                      <Button onClick={() => goToQuestion(current + 1)}>
                        {t({ bn: 'পরেরটি →', en: 'Next →' })}
                      </Button>
                    ) : (
                      <Button loading={submitting} onClick={() => void submitMock()}>
                        {t({ bn: 'জমা দিন', en: 'Submit' })}
                      </Button>
                    )}
                  </div>
                  {submitError ? (
                    <div style={{ marginTop: 12 }}>
                      <AlertBox tone="error">{submitError}</AlertBox>
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </Card>
          <p style={{ color: '#5A6478', fontSize: 14 }}>
            {t({
              bn: 'উত্তরের চাবি জমা দেওয়ার পরেই পড়া হয় — পরীক্ষা চলাকালীন সঠিক/ভুল দেখানো হয় না।',
              en: 'The answer key is only read after you submit — no correct/wrong is shown during the exam.',
            })}
          </p>
        </div>
      ) : null}

      {/* ------------------------- RESULT ------------------------- */}
      {user && phase === 'result' && result && analytics && bundle ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <Card>
            <p style={{ margin: '0 0 4px', color: '#5A6478', fontSize: 14 }}>
              {lang === 'bn' ? JOB_PRACTICE_RESULT_LABEL : JOB_PRACTICE_RESULT_LABEL_EN}
            </p>
            <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>
              {t({ bn: `স্কোর: ${result.score} / ${result.totalMarks}`, en: `Score: ${result.score} / ${result.totalMarks}` })}
            </h2>
            <p style={{ margin: '0 0 4px' }}>
              {t({
                bn: `সঠিক ${result.correctCount}টি · ভুল ${result.wrongCount}টি · উত্তর হয়নি ${result.unansweredCount}টি`,
                en: `Correct ${result.correctCount} · Wrong ${result.wrongCount} · Unanswered ${result.unansweredCount}`,
              })}
            </p>
            <p style={{ margin: '0 0 4px' }}>
              {t({
                bn: `নির্ভুলতা ${result.accuracy}% · নেগেটিভ মার্কিংয়ে কাটা ${result.negativeDeduction} · মোট সময় ${formatSeconds(result.timeSpentSeconds)} · প্রতি প্রশ্নে গড় ${analytics.avgTimeSeconds} সেকেন্ড`,
                en: `Accuracy ${result.accuracy}% · Negative deduction ${result.negativeDeduction} · Total time ${result.timeSpentSeconds}s · Avg ${analytics.avgTimeSeconds}s per question`,
              })}
            </p>
            <p style={{ margin: '8px 0 0', color: '#5A6478', fontSize: 14 }}>
              {t({
                bn: 'এই ফলাফল শুধু এই পাতায় দেখা যাবে — সংরক্ষণ করা হয়নি।',
                en: 'This result is shown on this page only — it is not saved.',
              })}
            </p>
          </Card>

          {analytics.perSubject.length > 0 ? (
            <Card>
              <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>
                {t({ bn: 'বিষয়ভিত্তিক বিশ্লেষণ', en: 'Per-subject breakdown' })}
              </h3>
              {analytics.perSubject.map((s) => (
                <div key={s.subjectId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                  <span>{lang === 'bn' ? s.label : s.labelEn}</span>
                  <span style={{ color: '#5A6478' }}>
                    {t({ bn: `${s.questions}টি প্রশ্ন · গড় ${Math.round(s.avgTimeSeconds)} সেকেন্ড`, en: `${s.questions} questions · avg ${Math.round(s.avgTimeSeconds)}s` })}
                  </span>
                </div>
              ))}
              {analytics.perTopic.map((tp) => (
                <div key={tp.topicId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: '1px solid var(--line)' }}>
                  <span>{lang === 'bn' ? tp.label : tp.labelEn}</span>
                  <span style={{ color: '#5A6478' }}>
                    {t({ bn: `${tp.correct}/${tp.total} সঠিক (${tp.accuracy}%)`, en: `${tp.correct}/${tp.total} correct (${tp.accuracy}%)` })}
                  </span>
                </div>
              ))}
            </Card>
          ) : null}

          {analytics.weakAreas.length > 0 ? (
            <Card>
              <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>
                {t({ bn: 'দুর্বল জায়গা', en: 'Weak areas' })}
              </h3>
              {analytics.weakAreas.map((w) => (
                <div key={w.topicId} style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontWeight: 700 }}>{lang === 'bn' ? w.label : w.labelEn}</div>
                  <div style={{ color: '#5A6478', fontSize: 14 }}>
                    {t({ bn: `${w.wrong}/${w.total} ভুল · নির্ভুলতা ${w.accuracy}%`, en: `${w.wrong}/${w.total} wrong · accuracy ${w.accuracy}%` })}
                  </div>
                  {w.badge ? (
                    <div style={{ marginTop: 4, fontSize: 14 }}>
                      {lang === 'bn' ? TOPIC_ACTION_BADGE_BN[w.badge] : TOPIC_ACTION_BADGE_EN[w.badge]}
                    </div>
                  ) : null}
                </div>
              ))}
            </Card>
          ) : (
            <Card>
              <p style={{ margin: 0 }}>
                {t({ bn: 'কোনো দুর্বল জায়গা পাওয়া যায়নি — সব প্রশ্নের উত্তর সঠিক হয়েছে।', en: 'No weak areas found — every answered question was correct.' })}
              </p>
            </Card>
          )}

          <Card>
            <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>
              {t({ bn: 'উত্তর পর্যালোচনা', en: 'Answer review' })}
            </h3>
            {result.answers.map((a) => {
              const q = bundle.questions.find((qq) => qq.n === a.n);
              if (!q) return null;
              return (
                <div key={a.n} style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontWeight: 700 }}>
                    {a.n}. {q.questionText}
                  </div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    {t({ bn: `আপনার উত্তর: ${a.selected ?? '—'}`, en: `Your answer: ${a.selected ?? '—'}` })}
                    {' · '}
                    <span style={{ color: a.correct ? '#1B7A3D' : '#B3261E', fontWeight: 700 }}>
                      {a.correct
                        ? t({ bn: 'সঠিক', en: 'Correct' })
                        : a.selected === null
                          ? t({ bn: 'উত্তর হয়নি', en: 'Unanswered' })
                          : t({ bn: 'ভুল', en: 'Wrong' })}
                    </span>
                    {a.correctText ? ` · ${t({ bn: `সঠিক উত্তর: ${a.correctText}`, en: `Correct answer: ${a.correctText}` })}` : null}
                  </div>
                </div>
              );
            })}
          </Card>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Button
              onClick={() => {
                setAttemptIndex((i) => i + 1);
                setPhase('intro');
              }}
            >
              {t({ bn: 'আবার মক দিন', en: 'Retake mock' })}
            </Button>
            <Button variant="outline" onClick={backToHub}>
              {t({ bn: 'হাবে ফিরুন', en: 'Back to hub' })}
            </Button>
          </div>
        </div>
      ) : null}

      {user && (phase === 'hub' || phase === 'intro' || phase === 'result') ? (
        <p style={{ marginTop: 20 }}>
          <Link to={`/${lang}/jobs`}>
            {t({ bn: '← চাকরি প্রস্তুতি', en: '← Job Preparation' })}
          </Link>
        </p>
      ) : null}
    </PageShell>
  );
}
