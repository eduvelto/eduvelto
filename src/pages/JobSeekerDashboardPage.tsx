// Eduvelto — Job Seeker Dashboard (four-section brief, 21 Nov 2026).
//
// /jobs/dashboard: the job seeker's own space — target exam, today's
// daily mock, this week's full mock, my results, weak topics, study
// routine and progress.
//
// Step 11 (22 Nov 2026): the 8-card structure expands to the 17
// items of the UI/UX design §5, in the P1–P5 priority order
// (P1 today's preparation → P2 summary numbers → P3 weak topics →
// P4 quick entry → P5 upcoming exams). Every card is data-driven
// from the student's OWN attempts (Step 10 analysis lib +
// jobDashboard helpers) or an honest empty / Coming Soon state.
// No number is invented: no readiness %, no pass probability,
// no peer comparison, no combined-across-exams score, no fake
// streak, no "syllabus %". Practice links go only to bundles
// that are verified published (jobDashboardData) — a weak topic
// with no published set shows no practice link. Time is shown
// as completed sessions + questions, never as invented "study
// minutes": the engine records wall-clock question-open time
// with no inactivity pause (see jobDashboard.ts). Step 12
// adds the active-time pause to the engines (src/lib/
// activeStudyTime.ts) — future recordings count active time
// only; historical values are untouched, and the dashboard
// still shows sessions + questions, never invented minutes.
//
// The dashboard is open to any signed-in user (a teacher can also
// prepare for BCS); signed-out visitors get the login prompt, same
// as the student dashboard. No ads on this page: it is all practice
// / exam / result space (design plan §1.4).
//
// Deferred, recorded honestly (see
// team/job-step11-dashboard-2026-11-22.md): the jobNotifications
// collection + rules (Step 14, with circulars — the compiled-rules
// margin on this branch is 1,138 bytes); the wrong-answer
// re-practice flow + favourites (Step 13); circulars + calendar
// (Step 14). Step 12 WIRED the planner + revision schedule
// cards to the real planner (/jobs/planner) — see the P4
// section below. Step 13 WIRED the wrong-answer notebook +
// re-practice flow (/jobs/wrong-answers); favourites is still
// a placeholder (its own step — it needs a storage decision).
// Step 14 WIRED the P5 circulars + calendar + notifications
// cards below: circulars from the published collection,
// the calendar from verified circular dates + published
// mocks, notifications derived in-app (no collection —
// Spark free has no Cloud Functions and the rules margin
// fits one minimal block only).

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal, Skeleton, SkeletonCards } from '../components/ui';
import JobModeSwitch from '../components/JobModeSwitch';
import JobOnboarding from '../components/JobOnboarding';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { useJobMode } from '../lib/jobMode';
import { useLanguage } from '../i18n/LanguageContext';
import { DAILY_MOCK, WEEKLY_MOCK_CYCLE, jobExamBySlug } from '../lib/jobExams';
import { JOB_CATEGORIES } from '../lib/jobProfile';
import { loadThisWeekWeeklyMock, loadTodayDailyMock } from '../lib/jobMock';
import { jobMockPatternSummary, type JobMockWithId } from '../lib/jobMocks';
import { jobTopicLabel } from '../lib/jobEngine';
import { attemptTrend, groupAttemptsByExam, type JobAttemptSummary } from '../lib/jobAnalysis';
import {
  accuracyOrNull,
  arrangeNextPractice,
  computeStreakDays,
  dashboardAchievements,
  dashboardWeakTopics,
  liveExamReport,
  perExamProgress,
  pickRecommendation,
  recentAttempts,
  subjectHealth,
  todayStats,
  weekActivity,
  wrongAnswerSummary,
  type PublishedBundleRef,
} from '../lib/jobDashboard';
import {
  awardMissingJobAchievements,
  loadDashboardAttempts,
  loadExamHistoryForDashboard,
  loadLiveExamAttempts,
  loadPublishedBundlesForExams,
  verifyMockRetry,
  verifyPracticeBundle,
} from '../lib/jobDashboardData';
import { deriveNotebook } from '../lib/jobWrongAnswers';
import { liveExamPatternLineBn, resolveLiveExamPattern } from '../lib/jobLiveExam';
import type { ExposureHistory } from '../lib/jobBankSelection';
import { revisionQueue, topicHealth, weeklyPlan } from '../lib/jobPlanner';
import {
  circularDeadlineLine,
  formatDhakaDate,
  sortCirculars,
  toBanglaDigits,
  type JobCircular,
} from '../lib/jobCirculars';
import { listPublishedCirculars } from '../lib/jobCircularsData';
import { buildCalendarEvents, daysUntilEvent, nextConfirmedEvent } from '../lib/jobCalendar';
import {
  deriveJobNotifications,
  EMPTY_NOTIFICATION_LOCAL_STATE,
  isNotificationRead,
  parseNotificationLocalState,
  unreadNotificationCount,
  visibleNotifications,
} from '../lib/jobNotifications';

function formatDateBn(millis: number | null): string {
  if (millis === null) return '—';
  return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(millis),
  );
}

export default function JobSeekerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { t, lang } = useLanguage();
  const { mode } = useJobMode();
  // Re-open the first-time mode-choice screen on demand (Step 2 §1.8).
  const [showOnboarding, setShowOnboarding] = useState(false);
  const cycle = WEEKLY_MOCK_CYCLE.map((s) => jobExamBySlug(s)!).filter(Boolean);
  // Step 4: the target exam now lives on the profile (targetExam).
  const targetExamDef = profile?.targetExam ? jobExamBySlug(profile.targetExam) : undefined;
  // Step 9 closure (D3/D4): live daily/weekly mocks + the student's
  // own mock attempts, for the data-driven cards below. null = not
  // loaded yet. (Hooks stay above the early returns below.)
  const [daily, setDaily] = useState<JobMockWithId | null>(null);
  const [weekly, setWeekly] = useState<JobMockWithId | null>(null);
  const [mocksLoaded, setMocksLoaded] = useState(false);
  // Step 11: the student's own attempts (practice + mock, newest
  // first, capped at 20 + 20) + the published bundles that guard
  // every practice link on this page.
  const [attempts, setAttempts] = useState<JobAttemptSummary[] | null>(null);
  const [capped, setCapped] = useState(false);
  const [publishedByExam, setPublishedByExam] = useState<Map<string, PublishedBundleRef[]>>(new Map());
  const [dataError, setDataError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  // "Continue learning" retry link, verified against the live
  // catalog (null = not checked yet; 'unavailable' = the set is
  // no longer published, so only the result link shows).
  const [continueRetry, setContinueRetry] = useState<{ to: string } | 'unavailable' | null>(null);
  // Step 14: published circulars (public read, newest first
  // after the client sort) — shared by the P5 circulars,
  // calendar and notifications cards (one query, 15 docs).
  const [circulars, setCirculars] = useState<JobCircular[] | null>(null);
  // Live Exam (design §6 item 18): the target exam's full-mock
  // attempts + exposure history — one extra read each, only for
  // the target exam, only when signed in. Null = not loaded yet.
  const [liveExamAttempts, setLiveExamAttempts] = useState<JobAttemptSummary[] | null>(null);
  const [liveExamHistory, setLiveExamHistory] = useState<ExposureHistory | null>(null);

  useEffect(() => {
    let alive = true;
    setDataError(false);
    setContinueRetry(null);
    Promise.all([loadTodayDailyMock(), loadThisWeekWeeklyMock()])
      .then(([d, w]) => {
        if (!alive) return;
        setDaily(d);
        setWeekly(w);
        setMocksLoaded(true);
      })
      .catch(() => {
        if (alive) setMocksLoaded(true);
      });
    // Step 14: published circulars — public, so this runs
    // whether or not the visitor is signed in.
    listPublishedCirculars({ pageSize: 15 })
      .then((page) => {
        if (alive) setCirculars(page.items);
      })
      .catch(() => {
        if (alive) setCirculars([]);
      });
    if (user) {
      (async () => {
        try {
          const { attempts: loaded, capped: wasCapped } = await loadDashboardAttempts(user.uid);
          if (!alive) return;
          setAttempts(loaded);
          setCapped(wasCapped);
          // Live Exam (design §6 item 18): the target exam's
          // full-mock attempts + exposure history, for the P1
          // Live Exam card. Best-effort — a failure leaves the
          // card in its honest empty state, never an error.
          if (profile?.targetExam) {
            loadLiveExamAttempts(user.uid, profile.targetExam)
              .then(({ attempts: live }) => {
                if (alive) setLiveExamAttempts(live);
              })
              .catch(() => {
                if (alive) setLiveExamAttempts([]);
              });
            loadExamHistoryForDashboard(user.uid, profile.targetExam)
              .then((h) => {
                if (alive) setLiveExamHistory(h);
              })
              .catch(() => {
                if (alive) setLiveExamHistory(null);
              });
          } else {
            setLiveExamAttempts([]);
            setLiveExamHistory(null);
          }
          // Bundles only for exams the student touches (attempts
          // + target exam) — never the whole catalog.
          const exams = [...new Set([...loaded.map((a) => a.examSlug), profile?.targetExam].filter(Boolean))] as string[];
          const bundles = await loadPublishedBundlesForExams(exams);
          if (!alive) return;
          setPublishedByExam(bundles);
          // Achievements: derive from the same attempts, persist
          // the missing ones (best-effort, never blocks the page).
          const streak = computeStreakDays(loaded, Date.now());
          const earned = dashboardAchievements(loaded, streak);
          if (earned.length > 0) {
            void awardMissingJobAchievements(
              user.uid,
              earned.map((a) => a.key),
            );
          }
          // "Continue learning": the newest attempt's own set,
          // verified still published before any retry link renders.
          const latest = loaded[0];
          if (latest) {
            if (latest.kind === 'practice' && latest.bundleId) {
              const ok = await verifyPracticeBundle(latest.bundleId);
              if (!alive) return;
              setContinueRetry(ok ? { to: `/jobs/practice/${latest.bundleId}` } : 'unavailable');
            } else if (latest.kind === 'mock' && latest.mockId) {
              const ok = await verifyMockRetry(latest.mockId);
              if (!alive) return;
              setContinueRetry(ok ? { to: `/jobs/mock/${ok.docId}` } : 'unavailable');
            } else {
              setContinueRetry('unavailable');
            }
          }
        } catch {
          if (alive) {
            setAttempts([]);
            setDataError(true);
          }
        }
      })();
    } else {
      setAttempts([]);
      setLiveExamAttempts([]);
      setLiveExamHistory(null);
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, profile?.targetExam, retryNonce]);

  // ---- Step 11 derived values (pure, from the loaded attempts) ----
  const nowMs = Date.now();
  const streakDays = useMemo(
    () => (attempts ? computeStreakDays(attempts, nowMs) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempts],
  );
  const today = useMemo(() => (attempts ? todayStats(attempts, nowMs) : null), [attempts, nowMs]);
  const week = useMemo(() => (attempts ? weekActivity(attempts, nowMs) : null), [attempts, nowMs]);
  const weakTopics = useMemo(() => (attempts ? dashboardWeakTopics(attempts) : []), [attempts]);
  const examProgress = useMemo(
    () => (attempts ? perExamProgress(attempts, publishedByExam) : []),
    [attempts, publishedByExam],
  );
  const recent = useMemo(() => (attempts ? recentAttempts(attempts, 5) : []), [attempts]);
  const wrongSummary = useMemo(() => (attempts ? wrongAnswerSummary(attempts) : null), [attempts]);
  const achievements = useMemo(
    () => (attempts ? dashboardAchievements(attempts, streakDays) : []),
    [attempts, streakDays],
  );
  const recommendation = useMemo(
    () =>
      pickRecommendation({
        weakTopics,
        publishedByExam,
        targetExamSlug: profile?.targetExam ?? null,
      }),
    [weakTopics, publishedByExam, profile?.targetExam],
  );
  const latestAttempt = attempts && attempts.length > 0 ? attempts[0] : null;
  // ---- Step 14 — P5 derived values (pure, from the loaded
  // circulars + mocks + attempts; no extra reads). ----
  const examSlugs = useMemo(() => {
    const slugs = new Set<string>();
    if (profile?.targetExam) slugs.add(profile.targetExam);
    for (const s of profile?.enrolledCategories ?? []) slugs.add(s);
    return [...slugs];
  }, [profile?.targetExam, profile?.enrolledCategories]);
  const topCirculars = useMemo(
    () => (circulars ? sortCirculars(circulars).slice(0, 3) : null),
    [circulars],
  );
  const calendarEvents = useMemo(
    () =>
      circulars
        ? buildCalendarEvents({
            circulars,
            mocks: [daily, weekly].filter((m): m is JobMockWithId => m !== null),
          })
        : [],
    [circulars, daily, weekly],
  );
  const nextEvent = useMemo(
    () => (circulars ? nextConfirmedEvent(calendarEvents, nowMs) : null),
    [circulars, calendarEvents, nowMs],
  );
  const dashboardNotifications = useMemo(
    () =>
      circulars && attempts
        ? deriveJobNotifications({
            circulars,
            todayDailyMock: daily,
            thisWeekWeeklyMock: weekly,
            attempts,
            examSlugs,
          })
        : [],
    [circulars, attempts, daily, weekly, examSlugs],
  );
  const notificationLocalState = useMemo(() => {
    if (!user) return EMPTY_NOTIFICATION_LOCAL_STATE;
    try {
      return parseNotificationLocalState(localStorage.getItem(`eduvelto:job-notifications:${user.uid}`));
    } catch {
      return EMPTY_NOTIFICATION_LOCAL_STATE;
    }
  }, [user, dashboardNotifications]);
  const unreadNotifications = useMemo(
    () => unreadNotificationCount(dashboardNotifications, notificationLocalState),
    [dashboardNotifications, notificationLocalState],
  );
  const topUnreadNotifications = useMemo(
    () =>
      visibleNotifications(dashboardNotifications, notificationLocalState)
        .filter((i) => !isNotificationRead(notificationLocalState, i.id))
        .slice(0, 3),
    [dashboardNotifications, notificationLocalState],
  );
  // Step 12 — the planner cards (P4) are wired to the real
  // planner now: the revision queue + the 7-day week, derived
  // from the SAME loaded attempts + published bundles (no
  // extra reads). The dashboard never invents a plan item.
  const plannerHealth = useMemo(() => (attempts ? topicHealth(attempts, nowMs) : []), [attempts]);
  const plannerQueue = useMemo(
    () =>
      revisionQueue({
        health: plannerHealth,
        publishedByExam,
        targetExamSlug: profile?.targetExam ?? null,
        nowMs,
      }),
    [plannerHealth, publishedByExam, profile?.targetExam],
  );
  const plannerWeek = useMemo(
    () =>
      weeklyPlan({
        attempts: attempts ?? [],
        health: plannerHealth,
        queue: plannerQueue,
        publishedByExam,
        targetExamSlug: profile?.targetExam ?? null,
        dailyGoalQuestions: profile?.dailyGoalQuestions ?? null,
        dailyMockDocId: daily?.docId ?? null,
        nowMs,
      }),
    [attempts, plannerHealth, plannerQueue, publishedByExam, profile?.targetExam, profile?.dailyGoalQuestions, daily],
  );
  const mockAttempts = useMemo(() => (attempts ?? []).filter((a) => a.kind === 'mock'), [attempts]);
  // Live Exam + dashboard (design §5): the target exam's
  // per-exam report (full mocks only), the subject roll-up of
  // the topic-level weak data, and the auto-arranged practice
  // queue (§5.4 priority order). All pure, all from the same
  // loaded attempts + published bundles.
  const targetPattern = useMemo(
    () => (profile?.targetExam ? resolveLiveExamPattern(profile.targetExam, null) : null),
    [profile?.targetExam],
  );
  const liveExamReportData = useMemo(
    () =>
      liveExamAttempts && profile?.targetExam
        ? liveExamReport(liveExamAttempts, profile.targetExam)
        : null,
    [liveExamAttempts, profile?.targetExam],
  );
  const subjectHealthRows = useMemo(() => (attempts ? subjectHealth(attempts) : []), [attempts]);
  const notebook = useMemo(() => (attempts ? deriveNotebook(attempts) : []), [attempts]);
  const arrangedPractice = useMemo(
    () =>
      attempts
        ? arrangeNextPractice({
            revisionItems: plannerQueue,
            notebook,
            weakTopics,
            publishedByExam,
            targetExamSlug: profile?.targetExam ?? null,
            attempts,
            dailyMock: daily ? { docId: daily.docId } : null,
            liveExam: profile?.targetExam ? { examSlug: profile.targetExam } : null,
            nowMs,
          })
        : [],
    [attempts, plannerQueue, notebook, weakTopics, publishedByExam, profile?.targetExam, daily, nowMs],
  );
  const mockTrends = useMemo(() => groupAttemptsByExam(mockAttempts), [mockAttempts]);
  const totalQuestions = (attempts ?? []).reduce((sum, a) => sum + a.answers.length, 0);
  const totalCorrect = (attempts ?? []).reduce((sum, a) => sum + a.correctCount, 0);
  const mockAccuracy = accuracyOrNull(
    mockAttempts.reduce((sum, a) => sum + a.correctCount, 0),
    mockAttempts.reduce((sum, a) => sum + a.answers.length, 0),
  );
  const topicsPracticedCount = useMemo(
    () => new Set((attempts ?? []).flatMap((a) => a.answers.map((ans) => ans.topicId))).size,
    [attempts],
  );
  // Published bundle for a weak topic (the ONLY practice link a
  // weak-topic row ever gets — no bundle, no link).
  const bundleForTopic = (topicId: string): PublishedBundleRef | undefined => {
    for (const bundles of publishedByExam.values()) {
      const found = bundles.find((b) => b.topicId === topicId && b.questionCount > 0);
      if (found) return found;
    }
    return undefined;
  };

  if (loading) {
    return (
      <PageShell titleBn="আমার চাকরির ড্যাশবোর্ড" titleEn="My Job Dashboard">
        <Skeleton lines={3} />
        <SkeletonCards count={3} />
      </PageShell>
    );
  }

  if (!user || !profile) {
    return (
      <PageShell titleBn="আমার চাকরির ড্যাশবোর্ড" titleEn="My Job Dashboard">
        <p>{t(strings.profile.notSignedIn)}</p>
        <p>
          <LinkButton to="/login" state={back} variant="outline">{t(strings.auth.loginTitle)}</LinkButton>
        </p>
      </PageShell>
    );
  }

  const name = profile.displayName?.trim();
  const enrolledDefs = (profile.enrolledCategories ?? [])
    .map((slug) => JOB_CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is (typeof JOB_CATEGORIES)[number] => Boolean(c));

  return (
    <PageShell titleBn="আমার চাকরির ড্যাশবোর্ড" titleEn="My Job Dashboard" wide hideTitle maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতি', en: '← Job Preparation' })}
        </Link>
      </p>

      {/* Hero — teal identity for the Jobs section. */}
      <section
        className="ev-class-hero"
        style={{ background: '#12766E' }}
        aria-label={t({ bn: 'আমার চাকরির ড্যাশবোর্ড', en: 'My Job Dashboard' })}
      >
        <h2
          style={{
            fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
            fontSize: 26,
            lineHeight: 1.3,
            margin: '0 0 4px',
            color: '#fff',
          }}
        >
          {name
            ? t({ bn: `স্বাগতম, ${name}`, en: `Welcome, ${name}` })
            : t({ bn: 'আমার চাকরির ড্যাশবোর্ড', en: 'My Job Dashboard' })}
        </h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.7 }}>
          {t({
            bn: 'আপনার লক্ষ্য পরীক্ষা, দৈনিক ও সাপ্তাহিক মক, ফলাফল, দুর্বল টপিক ও পড়ার রুটিন — সব এক জায়গায়।',
            en: 'Your target exam, daily and weekly mocks, results, weak topics and study routine — all in one place.',
          })}
        </p>
      </section>

      {/* First-time mode choice (Step 2 §1.8, Step 4): shown once to
          signed-in users who have not seen it; never blocks the page. */}
      <JobOnboarding forceOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Data-load error (Step 11): an error is shown as an error
          with a retry — never as a fake "no data" empty state. */}
      {dataError ? (
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'তথ্য লোড হয়নি', en: 'Data did not load' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'ড্যাশবোর্ডের তথ্য লোড করা যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।',
                en: 'The dashboard data could not be loaded — check your connection and try again.',
              })}
            </p>
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              style={{ background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', minHeight: 44 }}
            >
              {t({ bn: 'আবার চেষ্টা করুন', en: 'Try again' })}
            </button>
          </Card>
        </Reveal>
      ) : null}

      {/* ChatGPT Step 4 review (P2) — compact profile-completion
          prompts, not persistent banners: one small card listing only
          the preferences still unset, each with a link to /profile.
          Worded as preferences to complete — never as "content is
          ready" (0 verified teachers: picking a category does not
          imply verified questions exist yet). Hidden entirely once
          all three are set. */}
      {(!profile.enrolledCategories || profile.enrolledCategories.length === 0) ||
      !profile.targetExam ||
      (profile.dailyGoalQuestions == null && profile.dailyGoalMinutes == null) ? (
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'প্রোফাইল সম্পূর্ণ করুন', en: 'Complete your profile' })}
            </div>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 2 }}>
              {(!profile.enrolledCategories || profile.enrolledCategories.length === 0) ? (
                <li>
                  <Link to="/profile" style={{ fontWeight: 600 }}>
                    {t({ bn: 'পছন্দের প্রস্তুতির বিভাগ নির্বাচন করুন', en: 'Pick your preparation categories' })}
                  </Link>
                </li>
              ) : null}
              {!profile.targetExam ? (
                <li>
                  <Link to="/profile" style={{ fontWeight: 600 }}>
                    {t({ bn: 'লক্ষ্য পরীক্ষা বেছে নিন', en: 'Pick a target exam' })}
                  </Link>
                </li>
              ) : null}
              {profile.dailyGoalQuestions == null && profile.dailyGoalMinutes == null ? (
                <li>
                  <Link to="/profile" style={{ fontWeight: 600 }}>
                    {t({ bn: 'দৈনিক লক্ষ্য ঠিক করুন', en: 'Set a daily goal' })}
                  </Link>
                </li>
              ) : null}
            </ul>
          </Card>
        </Reveal>
      ) : null}

      {/* ============ P1 — আজকের প্রস্তুতি ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Next practice (Gemini #1 + ChatGPT #7): the weakest
            topic WITH a published set — or the honest fallback.
            The recommendation is never invented: pickRecommendation
            returns null unless a real published bundle exists. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'পরবর্তী অনুশীলন', en: 'Next practice' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : recommendation ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `${recommendation.topicLabel} — আপনার সঠিক উত্তরের হার ${recommendation.topicAccuracy}% (${recommendation.topicTotal}টি প্রশ্নের মধ্যে${recommendation.sample === 'signal' ? ', ১০+ প্রশ্নের ভিত্তিতে' : ', প্রাথমিক ইঙ্গিত — ৫–৯টি প্রশ্নের ভিত্তিতে'})।`,
                    en: `${recommendation.topicLabel} — your accuracy is ${recommendation.topicAccuracy}% (of ${recommendation.topicTotal} questions${recommendation.sample === 'signal' ? ', based on 10+ questions' : ', an early indication — based on 5–9 questions'}).`,
                  })}
                </p>
                <LinkButton to={`/jobs/practice/${recommendation.bundleDocId}`} variant="accent">
                  {t({ bn: 'অনুশীলন শুরু করুন →', en: 'Start practising →' })}
                </LinkButton>
              </>
            ) : attempts.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'আপনি এখনো কোনো অনুশীলন করেননি। আপনার প্রথম অনুশীলন শুরু করুন।',
                    en: 'You have not practised yet. Start your first practice.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="accent">
                  {t({ bn: 'প্রথম অনুশীলন শুরু করুন →', en: 'Start your first practice →' })}
                </LinkButton>
              </>
            ) : daily ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'দুর্বল টপিকের জন্য প্রকাশিত অনুশীলন সেট এখনো নেই — আজকের দৈনিক মক দিয়ে শুরু করুন।',
                    en: 'No published practice set exists for the weak topics yet — start with today’s daily mock.',
                  })}
                </p>
                <LinkButton to={`/jobs/mock/${daily.docId}`} variant="accent">
                  {t({ bn: 'আজকের মক শুরু করুন →', en: "Start today's mock →" })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'দুর্বল টপিকের জন্য প্রকাশিত অনুশীলন সেট এখনো নেই। কমন প্রস্তুতি থেকে শুরু করুন।',
                    en: 'No published practice set exists for the weak topics yet. Start from common preparation.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>

        {/* Continue learning (design #7, ChatGPT #3): the newest
            attempt's own set — the retry link renders only after
            the set is verified still published. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'চালিয়ে যান', en: 'Continue learning' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : !latestAttempt ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কিছু শুরু করা হয়নি — প্রথম অনুশীলন শুরু করলে সেটি এখানে দেখাবে।',
                    en: 'Nothing started yet — once you start your first practice, it will show here.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `সর্বশেষ: ${latestAttempt.kind === 'mock' ? 'মক' : 'অনুশীলন'} — ${jobExamBySlug(latestAttempt.examSlug)?.bn ?? latestAttempt.examSlug} · ${latestAttempt.score}/${latestAttempt.totalMarks} নম্বর · ${formatDateBn(latestAttempt.submittedAtMillis)}`,
                    en: `Latest: ${latestAttempt.kind === 'mock' ? 'mock' : 'practice'} — ${jobExamBySlug(latestAttempt.examSlug)?.en ?? latestAttempt.examSlug} · ${latestAttempt.score}/${latestAttempt.totalMarks} · ${formatDateBn(latestAttempt.submittedAtMillis)}`,
                  })}
                </p>
                <LinkButton to={`/jobs/result/${latestAttempt.docId}`} variant="outline">
                  {t({ bn: 'ফলাফল দেখুন →', en: 'See the result →' })}
                </LinkButton>
                {continueRetry === null ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
                ) : continueRetry === 'unavailable' ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({
                      bn: 'এই সেটটি এখন আর প্রকাশিত নেই, তাই আবার দেওয়া যাবে না।',
                      en: 'This set is no longer published, so it cannot be retaken.',
                    })}
                  </p>
                ) : (
                  <LinkButton to={continueRetry.to} variant="accent">
                    {t({ bn: 'আবার অনুশীলন করুন →', en: 'Practise again →' })}
                  </LinkButton>
                )}
              </>
            )}
          </Card>
        </Reveal>

        {/* Live Exam (design §6 item 18, P1): the target exam's
            timed full mock — pattern line, the per-exam report
            (full mocks only), and the link to the variant page.
            No target exam ⇒ the honest prompt to pick one. */}
        <Reveal delayMs={120}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'লাইভ পরীক্ষা', en: 'Live Exam' })}
            </div>
            {!targetExamDef ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'লক্ষ্য পরীক্ষা বেছে নিলে তার লাইভ পরীক্ষা (আসল ধরনে সময়ভিত্তিক পূর্ণ মক) এখানে দেখাবে।',
                    en: 'Pick a target exam and its Live Exam (a timed full mock in the real pattern) will show here.',
                  })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য পরীক্ষা বেছে নিন →', en: 'Pick a target exam →' })}
                </LinkButton>
              </>
            ) : liveExamAttempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {targetPattern ? liveExamPatternLineBn(targetPattern) : ''}
                  {liveExamReportData && liveExamReportData.attempts > 0 ? (
                    <>
                      {' · '}
                      {t({
                        bn: `${liveExamReportData.attempts}টি পূর্ণ মক · সেরা ${liveExamReportData.bestScore ?? 0}/${liveExamReportData.bestTotalMarks ?? 0}${liveExamReportData.partialAttempts > 0 ? ` · এর মধ্যে ${liveExamReportData.partialAttempts}টি আংশিক মক` : ''}`,
                        en: `${liveExamReportData.attempts} full mock(s) · best ${liveExamReportData.bestScore ?? 0}/${liveExamReportData.bestTotalMarks ?? 0}${liveExamReportData.partialAttempts > 0 ? ` · including ${liveExamReportData.partialAttempts} partial mock(s)` : ''}`,
                      })}
                    </>
                  ) : (
                    <>
                      {' · '}
                      {t({ bn: 'এখনো কোনো পূর্ণ মক দেওয়া হয়নি', en: 'No full mock taken yet' })}
                    </>
                  )}
                  {liveExamHistory ? (
                    <>
                      {' · '}
                      {t({ bn: `এ পর্যন্ত ${liveExamHistory.recentQuestionIds.length}টি ভিন্ন প্রশ্ন দেখেছেন`, en: `You have seen ${liveExamHistory.recentQuestionIds.length} different question(s) so far` })}
                    </>
                  ) : null}
                </p>
                <LinkButton to={`/jobs/live-exam/${targetExamDef.slug}`} variant="accent">
                  {t({ bn: 'লাইভ পরীক্ষা দেখুন →', en: 'See the Live Exam →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>

        {/* Re-practice queue (design §5.4, P1): the auto-arranged
            order — due weak revision (max 2/day) → stale
            wrong-answer re-practice → weakest-topic practice →
            new-topic rotation → daily mock / Live Exam cards.
            Items without a published set show WITHOUT a link —
            never a dead link. */}
        <Reveal delayMs={140}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আজকের অনুশীলন তালিকা', en: "Today's practice list" })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : arrangedPractice.length === 0 ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'আজকের অনুশীলন তালিকা খালি — অনুশীলন শুরু করলে দুর্বল টপিক, ভুল উত্তর আর নতুন টপিক এখানে সাজিয়ে দেখাবে।',
                  en: 'Today’s practice list is empty — once you start practising, weak topics, wrong answers and new topics will be arranged here.',
                })}
              </p>
            ) : (
              <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
                {arrangedPractice.map((item, i) => (
                  <li key={`${item.kind}-${i}`} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', padding: '8px 0' }}>
                    <div style={{ fontWeight: 700, color: 'var(--heading)' }}>{item.titleBn}</div>
                    {item.detailBn ? (
                      <div style={{ color: 'var(--muted-ivory)', fontSize: 13 }}>{item.detailBn}</div>
                    ) : null}
                    {item.to && item.ctaBn ? (
                      <LinkButton to={item.to} variant="outline">
                        {item.ctaBn} →
                      </LinkButton>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        {/* Daily goal (design #5): the student's own goal from
            /profile; progress from today's real attempts. No red
            mark, no punishment for missing it. A minutes-only goal
            cannot be measured reliably yet (see the activity card)
            — sessions are shown instead. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'দৈনিক লক্ষ্য', en: 'Daily goal' })}
            </div>
            {profile.dailyGoalQuestions == null && profile.dailyGoalMinutes == null ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'দৈনিক লক্ষ্য এখনো ঠিক করা হয়নি — প্রশ্নের সংখ্যা বা মিনিট ঠিক করুন।',
                    en: 'No daily goal set yet — set a question count or minutes.',
                  })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য ঠিক করুন →', en: 'Set a goal →' })}
                </LinkButton>
              </>
            ) : profile.dailyGoalQuestions != null ? (
              <>
                <p style={{ margin: '8px 0 6px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `আজ ${today?.questionsToday ?? 0}/${profile.dailyGoalQuestions}টি প্রশ্ন`,
                    en: `Today ${today?.questionsToday ?? 0}/${profile.dailyGoalQuestions} questions`,
                  })}
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={Math.min(100, Math.round(((today?.questionsToday ?? 0) / profile.dailyGoalQuestions) * 100))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t({ bn: 'দৈনিক লক্ষ্যের অগ্রগতি', en: 'Daily goal progress' })}
                  style={{ height: 8, borderRadius: 4, background: 'var(--surface-muted)', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((today?.questionsToday ?? 0) / profile.dailyGoalQuestions) * 100)}%`,
                      background: 'var(--teal)',
                    }}
                  />
                </div>
                <p style={{ margin: '10px 0 0' }}>
                  <Link to="/profile" style={{ fontWeight: 600, fontSize: 14 }}>
                    {t({ bn: 'লক্ষ্য বদলান →', en: 'Change goal →' })}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `মিনিটের লক্ষ্য: ${profile.dailyGoalMinutes} মিনিট। মিনিটের নির্ভরযোগ্য হিসাব এখনো নেই — আজ ${today?.sessionsToday ?? 0}টি সেশন সম্পন্ন হয়েছে।`,
                    en: `Minutes goal: ${profile.dailyGoalMinutes} minutes. Reliable minute tracking is not available yet — ${today?.sessionsToday ?? 0} session(s) completed today.`,
                  })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য বদলান →', en: 'Change goal →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>

        {/* Today's daily mock — LIVE (Step 9, D3): today's published
            mock with a start link, or the honest not-yet state. No
            "coming soon" claim while mocks can exist. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'দৈনিক মক', en: 'Daily mock' })}
            </div>
            <p style={{ margin: '8px 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: DAILY_MOCK.sizeBn, en: DAILY_MOCK.sizeEn })} · {t({ bn: DAILY_MOCK.timeBn, en: DAILY_MOCK.timeEn })}
            </p>
            {!mocksLoaded ? (
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : daily ? (
              <>
                <p style={{ margin: '0 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {lang === 'bn' ? daily.titleBn : daily.titleEn} · {jobMockPatternSummary(daily.rulesSnapshot, undefined, lang)}
                </p>
                <LinkButton to={`/jobs/mock/${daily.docId}`} variant="accent">
                  {t({ bn: 'আজকের মক শুরু করুন →', en: "Start today's mock →" })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'প্রতিদিন ভিন্ন কমন টপিক — আজকের মক এখনো প্রকাশিত হয়নি।',
                    en: 'A different common topic every day — today’s mock is not published yet.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            )}          </Card>
        </Reveal>

        {/* This week's full mock — LIVE (Step 9, D3), same pattern. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'সাপ্তাহিক পূর্ণ মক', en: 'Weekly full mock' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'পরিকল্পনা: প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'Plan: one full mock every week — rotating:' })}            </p>
            <p style={{ margin: '0 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
              {cycle.map((def, i) => (
                <span key={def.slug}>
                  {i > 0 ? ' → ' : ''}
                  <Link to={`/jobs/${def.slug}`} style={{ fontWeight: 600 }}>
                    {t({ bn: def.bn, en: def.en })}
                  </Link>
                </span>
              ))}
            </p>
            {!mocksLoaded ? (
              <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : weekly ? (
              <>
                <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {lang === 'bn' ? weekly.titleBn : weekly.titleEn} · {jobMockPatternSummary(weekly.rulesSnapshot, undefined, lang)}
                </p>
                <LinkButton to={`/jobs/mock/${weekly.docId}`} variant="accent">
                  {t({ bn: 'এই সপ্তাহের মক শুরু করুন →', en: "Start this week's mock →" })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এই সপ্তাহের মক এখনো প্রকাশিত হয়নি।',
                    en: 'This week’s mock is not published yet.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ============ P2 — সারাংশের সংখ্যা ============ */}
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'আমার অগ্রগতি — সাম্প্রতিক কার্যকলাপ', en: 'My progress — recent activity' })}
          </div>
          {attempts === null ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
          ) : attempts.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'এখনো কোনো অগ্রগতি নেই। অনুশীলন শুরু হলে এখানে আপনার অগ্রগতি দেখা যাবে।',
                en: 'No progress yet. Once you start practising, your progress will show here.',
              })}
            </p>
          ) : (
            <>
              <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
                {t({ bn: `মোট ${totalQuestions}টি প্রশ্ন · ${totalCorrect}টি সঠিক`, en: `${totalQuestions} questions · ${totalCorrect} correct` })}
                {' · '}
                {t({ bn: `মোট ${mockAttempts.length}টি মক`, en: `${mockAttempts.length} mock(s)` })}
                {' · '}
                {mockAccuracy === null
                  ? t({ bn: 'মকে সঠিক উত্তরের হার — তথ্য নেই', en: 'Mock accuracy — no data' })
                  : t({ bn: `মকে সঠিক উত্তরের হার ${mockAccuracy}%`, en: `Mock accuracy ${mockAccuracy}%` })}
                {' · '}
                {t({ bn: `${topicsPracticedCount}টি টপিকে অনুশীলন`, en: `${topicsPracticedCount} topic(s) practised` })}
              </p>
              {examProgress.map((p) => {
                const def = jobExamBySlug(p.examSlug);
                return (
                  <div key={p.examSlug} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 15 }}>
                      <Link to={`/jobs/${p.examSlug}`}>
                        {t({ bn: def?.bn ?? p.examSlug, en: def?.en ?? p.examSlug })}
                      </Link>
                    </div>
                    <p style={{ margin: '4px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
                      {t({ bn: `${p.questions}টি প্রশ্ন · ${p.correct}টি সঠিক`, en: `${p.questions} questions · ${p.correct} correct` })}
                      {' · '}
                      {p.accuracy === null
                        ? t({ bn: 'সঠিক উত্তরের হার — তথ্য নেই', en: 'Accuracy — no data' })
                        : t({ bn: `সঠিক উত্তরের হার ${p.accuracy}%`, en: `Accuracy ${p.accuracy}%` })}
                      {' · '}
                      {t({ bn: `${p.topicsPracticed.length}টি টপিকে অনুশীলন`, en: `${p.topicsPracticed.length} topic(s) practised` })}
                      {' · '}
                      {t({ bn: `সেট ${p.setsCompleted}/${p.setsAvailable}টি সম্পন্ন`, en: `Sets ${p.setsCompleted}/${p.setsAvailable} completed` })}
                      {' · '}
                      {t({ bn: `সর্বশেষ কার্যকলাপ ${formatDateBn(p.lastActivityMillis)}`, en: `Last activity ${formatDateBn(p.lastActivityMillis)}` })}
                    </p>
                  </div>
                );
              })}
              {capped ? (
                <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                  {t({
                    bn: 'সর্বশেষ ২০টি অনুশীলন ও ২০টি মকের ভিত্তিতে হিসাব করা হয়েছে — পুরো ইতিহাস দেখতে বিশ্লেষণ পাতা দেখুন।',
                    en: 'Calculated from the latest 20 practices and 20 mocks — see the analysis page for the full history.',
                  })}
                </p>
              ) : null}
              <p style={{ margin: '10px 0 0' }}>
                <LinkButton to="/jobs/analysis" variant="outline">
                  {t({ bn: 'বিস্তারিত বিশ্লেষণ দেখুন →', en: 'See detailed analysis →' })}
                </LinkButton>
              </p>
            </>
          )}
        </Card>
      </Reveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20, marginTop: 12 }}>
        {/* Recent attempts (ChatGPT #4, Gemini #4): the last 5,
            each with exam, kind, score/total, date and a link to
            its own result page. Never a placeholder row. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'সাম্প্রতিক অনুশীলন', en: 'Recent practice' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : recent.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কোনো অনুশীলন বা মক দেওয়া হয়নি — শুরু করলে সর্বশেষ ৫টি এখানে দেখাবে।',
                    en: 'No practice or mock taken yet — once you start, the latest 5 will show here.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            ) : (
              <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
                {recent.map((a) => (
                  <li key={a.docId} style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
                    <Link to={`/jobs/result/${a.docId}`} style={{ fontWeight: 600 }}>
                      {t({
                        bn: `${jobExamBySlug(a.examSlug)?.bn ?? a.examSlug} · ${a.kind === 'mock' ? 'মক' : 'অনুশীলন'} · ${a.score}/${a.totalMarks} নম্বর`,
                        en: `${jobExamBySlug(a.examSlug)?.en ?? a.examSlug} · ${a.kind === 'mock' ? 'mock' : 'practice'} · ${a.score}/${a.totalMarks}`,
                      })}
                    </Link>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {' · '}
                      {formatDateBn(a.submittedAtMillis)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        {/* My results — data-driven (D4): best vs latest per exam
            for mocks (never mixed, never averaged). */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আমার ফলাফল', en: 'My results' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : mockAttempts.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কোনো মক টেস্ট দেওয়া হয়নি — মক দিলে ফলাফল ও বিষয়ভিত্তিক নম্বর এখানে দেখাবে।',
                    en: 'No mock test has been taken yet — once you take a mock, results and subject-wise marks will show here.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            ) : (
              <>
                <ul style={{ margin: '8px 0 10px', paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
                  {mockTrends.map((g) => {
                    const trend = attemptTrend(g.attempts, 'মক', lang);
                    const def = jobExamBySlug(g.examSlug);
                    return (
                      <li key={g.examSlug} style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
                        <span style={{ fontWeight: 700, color: 'var(--heading)' }}>
                          {t({ bn: def?.bn ?? g.examSlug, en: def?.en ?? g.examSlug })}
                        </span>
                        {' — '}
                        <span style={{ color: 'var(--muted-ivory)' }}>
                          {trend.bestPercent === null || trend.latestPercent === null
                            ? t({ bn: 'ফলাফল — তথ্য নেই', en: 'Result — no data' })
                            : t({ bn: `সেরা ${trend.bestPercent}% · সর্বশেষ ${trend.latestPercent}%`, en: `Best ${trend.bestPercent}% · Latest ${trend.latestPercent}%` })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {latestAttempt && latestAttempt.kind === 'mock' ? (
                  <LinkButton to={`/jobs/result/${latestAttempt.docId}`} variant="accent">
                    {t({ bn: 'সর্বশেষ ফলাফল দেখুন →', en: 'See the latest result →' })}
                  </LinkButton>
                ) : null}
                {/* Step 10: the full analysis page — history,
                    trends, topic mastery and time, own attempts
                    only. */}
                <LinkButton to="/jobs/analysis" variant="outline">
                  {t({ bn: 'সব ফলাফল ও বিশ্লেষণ দেখুন →', en: 'See all results and analysis →' })}
                </LinkButton>
              </>
            )}          </Card>
        </Reveal>

        {/* Study activity (Gemini #5, ChatGPT #6, adapted): sessions
            + questions, never invented minutes — see jobDashboard.ts. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'পড়াশোনার কার্যকলাপ', en: 'Study activity' })}
            </div>
            {attempts === null || !week || !today ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : attempts.length === 0 ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'এখনো কোনো সেশন সম্পন্ন হয়নি — অনুশীলন বা মক শেষ করলে কার্যকলাপ এখানে দেখাবে।',
                  en: 'No session completed yet — once you finish a practice or mock, activity will show here.',
                })}
              </p>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
                  {t({ bn: `আজ: ${today.sessionsToday}টি সেশন · ${today.questionsToday}টি প্রশ্ন`, en: `Today: ${today.sessionsToday} session(s) · ${today.questionsToday} question(s)` })}
                  <br />
                  {t({ bn: `গত ৭ দিন: ${week.totalSessions}টি সেশন · ${week.totalQuestions}টি প্রশ্ন`, en: `Last 7 days: ${week.totalSessions} session(s) · ${week.totalQuestions} question(s)` })}
                  {streakDays >= 2 ? (
                    <>
                      <br />
                      {t({ bn: `টানা ${streakDays} দিন অনুশীলন — শুধু আপনার নিজের দেখার জন্য।`, en: `${streakDays}-day streak — for your own viewing only.` })}
                    </>
                  ) : null}
                </p>
                <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', fontSize: 13, lineHeight: 1.9, color: 'var(--muted-ivory)' }}>
                  {week.days.map((d) => (
                    <li key={d.dayKey} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', padding: '3px 0' }}>
                      <span>{t({ bn: d.labelBn, en: d.labelEn })}</span>
                      <span>{t({ bn: `${d.sessions}টি সেশন · ${d.questions}টি প্রশ্ন`, en: `${d.sessions} session(s) · ${d.questions} question(s)` })}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                  {t({
                    bn: 'মিনিটের হিসাব দেখানো হয় না — প্রশ্ন খোলা থাকা সময় টাইমারে ধরা হয়, ট্যাব বদলালে থামে না।',
                    en: 'Minutes are not shown — question-open time is counted by the timer, and it does not pause when you switch tabs.',
                  })}
                </p>
              </>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ============ P3 — দুর্বল টপিক ============ */}
      <Reveal>
        <Card>
          <div id="weak-topics" style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'দুর্বল টপিক', en: 'Weak topics' })}
          </div>
          {attempts === null ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
          ) : attempts.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'মক টেস্টের ফলাফল এলে কোন টপিকে দুর্বল, কী আবার পড়তে হবে — তা এখানে দেখাবে। এখনো কোনো তথ্য নেই।',
                en: 'Once mock results exist, this will show which topics are weak and what to revise. There is no data yet.',
              })}
            </p>
          ) : weakTopics.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'কোনো টপিকেই দুর্বলতার যথেষ্ট তথ্য নেই — কমপক্ষে ৫টি প্রশ্নের উত্তর দিলে টপিক এখানে আসবে।',
                en: 'No topic has enough data to call weak yet — answer at least 5 questions in a topic for it to appear here.',
              })}
            </p>
          ) : (
            <>
              <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                {t({
                  bn: 'নিয়ম: ৫–৯টি প্রশ্নে "প্রাথমিক ইঙ্গিত", ১০+ প্রশ্নে দুর্বলতার সংকেত। সঠিক উত্তরের হার ৫০%-এর নিচে হলেই টপিক এখানে আসে।',
                  en: 'Rule: 5–9 questions is an “early indication”, 10+ is a weakness signal. A topic appears here only when accuracy is below 50%.',
                })}
              </p>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
                {weakTopics.map((w) => {
                  const bundle = bundleForTopic(w.topicId);
                  return (
                    <li key={w.topicId} style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                      <div style={{ fontWeight: 700, color: 'var(--heading)' }}>
                        {jobTopicLabel(w.topicId, lang)}
                        {' — '}
                        <span style={{ fontWeight: 400, color: 'var(--muted-ivory)' }}>
                          {t({ bn: `${w.correct}/${w.total}টি সঠিক · ${w.accuracy}%`, en: `${w.correct}/${w.total} correct · ${w.accuracy}%` })}
                          {' · '}
                          {w.sample === 'signal'
                            ? t({ bn: 'দুর্বলতার সংকেত', en: 'Weakness signal' })
                            : t({ bn: 'প্রাথমিক ইঙ্গিত', en: 'Early indication' })}
                        </span>
                      </div>
                      {bundle ? (
                        <LinkButton to={`/jobs/practice/${bundle.docId}`} variant="outline">
                          {t({ bn: 'এই টপিকের অনুশীলন করুন →', en: 'Practise this topic →' })}
                        </LinkButton>
                      ) : (
                        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                          {t({
                            bn: 'এই টপিকের অনুশীলন সেট এখনো তৈরি হয়নি।',
                            en: 'No practice set exists for this topic yet.',
                          })}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>
      </Reveal>

      {/* Subject health (design §5.2, P3): the topic-level weak
          data rolled up by subject — same thresholds as topics
          (≥5 answered, accuracy <50%), and a subject is only
          "weak" when the evidence spans ≥2 topics. */}
      <Reveal>
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'দুর্বল বিষয়', en: 'Weak subjects' })}
          </div>
          {attempts === null ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
          ) : attempts.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'অনুশীলন শুরু হলে কোন বিষয়ে দুর্বল, তা এখানে দেখাবে। এখনো কোনো তথ্য নেই।',
                en: 'Once you start practising, which subjects are weak will show here. There is no data yet.',
              })}
            </p>
          ) : subjectHealthRows.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'কোনো বিষয়েই দুর্বলতার যথেষ্ট তথ্য নেই — একটি বিষয়ে কমপক্ষে ৫টি প্রশ্নের উত্তর দিলে বিষয় এখানে আসবে।',
                en: 'No subject has enough data to call weak yet — answer at least 5 questions in a subject for it to appear here.',
              })}
            </p>
          ) : (
            <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
              {subjectHealthRows.map((row) => (
                <li key={row.subjectId} style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                  <div style={{ fontWeight: 700, color: 'var(--heading)' }}>
                    {row.label}
                    {' — '}
                    <span style={{ fontWeight: 400, color: 'var(--muted-ivory)' }}>
                      {t({ bn: `${row.correct}/${row.total}টি সঠিক · ${row.accuracy ?? 0}% · ${row.topics}টি টপিক`, en: `${row.correct}/${row.total} correct · ${row.accuracy ?? 0}% · ${row.topics} topic(s)` })}
                      {' · '}
                      {row.isWeak
                        ? t({ bn: 'দুর্বল', en: 'Weak' })
                        : row.sample === 'signal'
                          ? t({ bn: 'দুর্বলতার সংকেত', en: 'Weakness signal' })
                          : row.sample === 'early'
                            ? t({ bn: 'প্রাথমিক ইঙ্গিত', en: 'Early indication' })
                            : t({ bn: 'যথেষ্ট তথ্য নেই', en: 'Not enough data' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Reveal>

      {/* Syllabus state (design §5.1, P3): syllabus completion
          is MISSING and unmeasurable today (0 subjects live) —
          the card says "আসছে" and never shows a %. */}
      <Reveal>
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'সিলেবাসের অগ্রগতি', en: 'Syllabus progress' })}
          </div>
          <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'সিলেবাসের তথ্য আসছে — কোনো বিষয়/টপিক এখনো যাচাই করে প্রকাশিত হয়নি, তাই অগ্রগতির শতাংশ দেখানো হচ্ছে না।',
              en: 'Syllabus information is coming — no subject/topic has been verified and published yet, so no progress percentage is shown.',
            })}
          </p>
          <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
        </Card>
      </Reveal>

      {/* ============ P4 — দ্রুত প্রবেশ ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20, marginTop: 12 }}>
        {/* Wrong-answer notebook (design #11; Step 13 built the
            notebook + its re-practice flow — this card counts +
            links to result pages and to the notebook). */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'ভুল-উত্তর নোটবুক', en: 'Wrong-answer notebook' })}
            </div>
            {attempts === null || !wrongSummary ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : wrongSummary.distinctWrongQuestions === 0 ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'কোনো ভুল উত্তর নেই — ভুল হলে প্রশ্নগুলো এখানে জমা হবে।',
                  en: 'No wrong answers — wrong questions will collect here.',
                })}
              </p>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: `${wrongSummary.distinctWrongQuestions}টি ভিন্ন প্রশ্নে ভুল হয়েছে।`, en: `${wrongSummary.distinctWrongQuestions} different question(s) answered wrong.` })}
                </p>
                <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.9 }}>
                  {wrongSummary.recent.map((r) => (
                    <li key={r.questionId} style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
                      <Link to={`/jobs/result/${r.attemptDocId}`} style={{ fontWeight: 600 }}>
                        {jobTopicLabel(r.topicId, lang)}
                      </Link>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {' · '}
                        {r.status === 'wrong'
                          ? t({ bn: 'ভুল উত্তর', en: 'Wrong answer' })
                          : t({ bn: 'উত্তর দেওয়া হয়নি', en: 'Unanswered' })}
                      </span>
                    </li>
                  ))}
                </ul>
                <p style={{ margin: '10px 0 0' }}>
                  <LinkButton to="/jobs/wrong-answers" variant="accent">
                    {t({ bn: 'ভুল-উত্তর নোটবুক দেখুন →', en: 'Open the wrong-answer notebook →' })}
                  </LinkButton>
                </p>
              </>
            )}
          </Card>
        </Reveal>

        {/* Favourites (design #12) — NOT built in Step 13 (the
            step built the notebook only); needs its own step +
            storage decision. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'ফেভারিট', en: 'Favourites' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'প্রশ্ন, টপিক ও মক ফেভারিট করে রাখা যাবে — শীঘ্রই আসছে।',
                en: 'You will be able to favourite questions, topics and mocks — coming soon.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* Written preparation (design §5.5, P4): written
            progress is MISSING — a placeholder card only, no
            counts, no %, no fake zero. */}
        <Reveal delayMs={120}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'লিখিত প্রস্তুতি', en: 'Written preparation' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'লিখিত প্রস্তুতি আসছে — লিখিত পরীক্ষার প্রস্তুতি (বাংলা রচনা, ইংরেজি লেখা, অনুবাদ, গণিত সমাধান) এখনো তৈরি হয়নি।',
                en: 'Written preparation is coming — written exam preparation (Bangla composition, English writing, translation, math solutions) is not built yet.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* Revision schedule (design #13) — Step 12 wires it to
            the real planner: the next due revision + the count
            due today, linked to /jobs/planner#revision. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'রিভিশন সময়সূচি', en: 'Revision schedule' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : plannerQueue.length === 0 ? (
              <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {attempts.length === 0
                  ? t({
                      bn: 'এখনো কোনো অনুশীলন করেননি — প্রথম অনুশীলনের পর রিভিশন তালিকা তৈরি হবে।',
                      en: 'You have not practised yet — the revision list will appear after your first practice.',
                    })
                  : t({
                      bn: 'রিভিশনের মতো দুর্বল টপিক এখন নেই — নতুন টপিকের অনুশীলন চালিয়ে যান।',
                      en: 'No weak topics need revision right now — keep practising new topics.',
                    })}
              </p>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `আজ ${plannerQueue.filter((q) => q.dueBucket === 'today').length}টি রিভিশন বাকি — পরেরটি: ${plannerQueue[0].label} (${t({ bn: `সঠিক উত্তরের হার ${plannerQueue[0].accuracy}%`, en: `accuracy ${plannerQueue[0].accuracy}%` })})।`,
                    en: `${plannerQueue.filter((q) => q.dueBucket === 'today').length} revision(s) due today — next: ${plannerQueue[0].label} (accuracy ${plannerQueue[0].accuracy}%).`,
                  })}
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  <Link to="/jobs/planner#revision" style={{ fontWeight: 600, fontSize: 14 }}>
                    {t({ bn: 'রিভিশন দেখুন →', en: 'See revision →' })}
                  </Link>
                </p>
              </>
            )}
            <p style={{ margin: 0 }}>
              <a href="#weak-topics" style={{ fontWeight: 600, fontSize: 14 }}>
                {t({ bn: 'দুর্বল টপিক দেখুন →', en: 'See weak topics →' })}
              </a>
            </p>
          </Card>
        </Reveal>

        {/* Planner (design #6) — Step 12 wires it to the real
            planner: today + the next 2 days, then the full
            planner page. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'প্ল্যানার', en: 'Planner' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: `আজ: ${plannerWeek.days[0]?.items.length ?? 0}টি কাজ · আগামীকাল: ${plannerWeek.days[1]?.items.length ?? 0}টি কাজ · পরশু: ${plannerWeek.days[2]?.items.length ?? 0}টি কাজ।`,
                    en: `Today: ${plannerWeek.days[0]?.items.length ?? 0} items · Tomorrow: ${plannerWeek.days[1]?.items.length ?? 0} items · Day after: ${plannerWeek.days[2]?.items.length ?? 0} items.`,
                  })}
                </p>
                <p style={{ margin: 0 }}>
                  <Link to="/jobs/planner" style={{ fontWeight: 600, fontSize: 14 }}>
                    {t({ bn: 'পূর্ণ প্ল্যানার দেখুন →', en: 'See the full planner →' })}
                  </Link>
                </p>
              </>
            )}
          </Card>
        </Reveal>

        {/* Achievements (design #14): only real work earns one;
            the rule is shown on the card. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'অর্জন', en: 'Achievements' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
            ) : achievements.length === 0 ? (
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'এখনো কোনো অর্জন নেই — প্রথম অনুশীলন বা মক শেষ করলে অর্জন এখানে দেখাবে। কোনো সার্টিফিকেট নয়।',
                  en: 'No achievements yet — finish your first practice or mock and it will show here. Not a certificate.',
                })}
              </p>
            ) : (
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: 'var(--heading)' }}>
                {achievements.map((a) => (
                  <li key={a.key}>
                    {t({ bn: a.labelBn, en: a.labelEn })}
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}> — {t({ bn: a.ruleBn, en: a.ruleEn })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ============ Supporting cards: profile, mode, target, enrolled ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Profile (design #1). */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আমার প্রোফাইল', en: 'My profile' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              <span
                aria-hidden
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: '50%', background: '#12766E',
                  color: '#fff', fontWeight: 700, fontSize: 18, marginRight: 8, verticalAlign: 'middle',
                }}
              >
                {name ? name.charAt(0) : 'শি'}
              </span>
              {name ?? t({ bn: 'শিক্ষার্থী', en: 'Student' })}
            </p>
            <LinkButton to="/profile" variant="outline">
              {t({ bn: 'প্রোফাইল দেখুন →', en: 'See profile →' })}
            </LinkButton>
          </Card>
        </Reveal>

        {/* My mode — Beginner / Advanced (owner decision 22 Nov 2026).
            Shows the current mode; the switch below changes it any time
            (stored on the user's own profile when signed in). */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আমার মোড', en: 'My mode' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: `বর্তমান মোড: ${mode === 'beginner' ? 'নতুনদের জন্য' : 'অভিজ্ঞদের জন্য'}`,
                en: `Current mode: ${mode === 'beginner' ? 'Beginner' : 'Advanced'}`,
              })}
            </p>
            <JobModeSwitch />
            <p style={{ margin: '8px 0 0' }}>
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--teal-text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {t({ bn: 'মোড পছন্দ আবার দেখুন', en: 'Show the mode choice again' })}
              </button>
            </p>
          </Card>
        </Reveal>

        {/* Target exam — read from the profile (Step 4: targetExam).
            Change it in /profile. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আমার লক্ষ্য পরীক্ষা', en: 'My target exam' })}
            </div>
            {targetExamDef ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  <Link to={`/jobs/${targetExamDef.slug}`} style={{ fontWeight: 700 }}>
                    {t({ bn: targetExamDef.bn, en: targetExamDef.en })}
                  </Link>
                  {' — '}
                  {t({ bn: targetExamDef.fullBn, en: targetExamDef.fullEn })}
                </p>
                {targetPattern ? (
                  <p style={{ margin: '0 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                    {liveExamPatternLineBn(targetPattern)}
                  </p>
                ) : null}
                <p style={{ margin: '0 0 10px' }}>
                  <LinkButton to={`/jobs/live-exam/${targetExamDef.slug}`} variant="accent">
                    {t({ bn: 'পরের লাইভ পরীক্ষা →', en: 'Next Live Exam →' })}
                  </LinkButton>
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য বদলান →', en: 'Change target →' })}
                </LinkButton>
              </>
            ) : profile?.targetExam ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                  {profile.targetExam}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য বদলান →', en: 'Change target →' })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কোনো লক্ষ্য পরীক্ষা বেছে নেওয়া হয়নি। যে পরীক্ষার প্রস্তুতি নিতে চান, সেটি বেছে নিন।',
                    en: 'No target exam has been picked yet. Pick the exam you want to prepare for.',
                  })}
                </p>
                <LinkButton to="/profile" variant="accent">
                  {t({ bn: 'লক্ষ্য পরীক্ষা বেছে নিন →', en: 'Pick a target exam →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>

        {/* Enrolled categories (design #3): the categories the
            student added in /profile. "Enrolled" means "added to
            my preparation list" — not a course enrolment. Removing
            one never deletes progress. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'আমার প্রস্তুতির বিভাগ', en: 'My preparation categories' })}
            </div>
            {enrolledDefs.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কোনো বিভাগ যোগ করা হয়নি — পছন্দের পরীক্ষার বিভাগ যোগ করুন।',
                    en: 'No category added yet — add the exam categories you want to prepare for.',
                  })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'বিভাগ যোগ করুন →', en: 'Add categories →' })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {enrolledDefs.map((c) => (
                    <Link key={c.slug} to={`/jobs/${c.hubSlugs[0]}`}>
                      <Chip tone="gold">{t({ bn: c.bn, en: c.en })}</Chip>
                    </Link>
                  ))}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'বিভাগ বদলান →', en: 'Change categories →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ============ P5 — আসন্ন পরীক্ষা ============ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Circulars (design #15) — Step 14: the latest 3
            published circulars (verified first, then newest).
            No circular is ever shown without its official
            source; when none is published, the honest empty
            state + the target exam's official site stay. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'সার্কুলার', en: 'Circulars' })}
            </div>
            {topCirculars === null ? (
              <Skeleton height={72} />
            ) : topCirculars.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'এখনো কোনো বিজ্ঞপ্তি সংরক্ষিত হয়নি — অফিসিয়াল বিজ্ঞপ্তি এলে এখানে আসবে।',
                    en: 'No circular is saved yet — when an official circular arrives, it will appear here.',
                  })}
                </p>
                {targetExamDef?.officialUrl ? (
                  <p style={{ margin: 0 }}>
                    <a href={targetExamDef.officialUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>
                      {t({ bn: targetExamDef.officialLinkBn ?? 'সর্বশেষ বিজ্ঞপ্তি দেখুন →', en: targetExamDef.officialLinkEn ?? 'See the latest circular →' })}
                    </a>
                  </p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({
                      bn: 'লক্ষ্য পরীক্ষা বেছে নিলে তার সর্বশেষ বিজ্ঞপ্তির লিংক এখানে দেখাবে।',
                      en: 'Pick a target exam and its latest circular link will show here.',
                    })}
                  </p>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {topCirculars.map((c) => (
                    <div key={c.docId} style={{ fontSize: 14, lineHeight: 1.6 }}>
                      <Link to={`/jobs/circulars/${c.docId}`} style={{ fontWeight: 700 }}>
                        {t({ bn: c.postTitleBn, en: c.postTitleEn })}
                      </Link>
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                        {t({ bn: circularDeadlineLine(c, nowMs).bn, en: circularDeadlineLine(c, nowMs).en })}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ margin: '10px 0 0' }}>
                  <LinkButton to="/jobs/circulars" variant="outline">
                    {t({ bn: 'সব বিজ্ঞপ্তি দেখুন →', en: 'See all circulars →' })}
                  </LinkButton>
                </p>
              </>
            )}
          </Card>
        </Reveal>

        {/* Calendar (design #16) — Step 14: the next CONFIRMED
            date from verified circulars + published mocks.
            No date is ever shown as confirmed until a circular
            verifies it. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'পরীক্ষার ক্যালেন্ডার', en: 'Exam calendar' })}
            </div>
            {circulars === null ? (
              <Skeleton height={72} />
            ) : nextEvent === null ? (
              <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'এখনো কোনো নিশ্চিত তারিখ নেই — সরকারি বিজ্ঞপ্তি প্রকাশিত হলে এখানে আসবে।',
                  en: 'No confirmed date yet — when an official circular is published, it will appear here.',
                })}
              </p>
            ) : (
              <>
                <p style={{ margin: '8px 0 4px', fontSize: 14, lineHeight: 1.6 }}>
                  <Link to={nextEvent.link} style={{ fontWeight: 700 }}>
                    {t({ bn: nextEvent.titleBn, en: nextEvent.titleEn })}
                  </Link>
                </p>
                <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14 }}>
                  {formatDhakaDate(nextEvent.dateMillis, lang, nextEvent.type === 'application-deadline' || nextEvent.type === 'exam-date')}
                  {' · '}
                  {daysUntilEvent(nextEvent, nowMs) === 0
                    ? t({ bn: 'আজ', en: 'Today' })
                    : t({
                        bn: `আর ${toBanglaDigits(daysUntilEvent(nextEvent, nowMs))} দিন বাকি`,
                        en: `${daysUntilEvent(nextEvent, nowMs)} day${daysUntilEvent(nextEvent, nowMs) === 1 ? '' : 's'} left`,
                      })}
                </p>
              </>
            )}
            <LinkButton to="/jobs/calendar" variant="outline">
              {t({ bn: 'ক্যালেন্ডার দেখুন →', en: 'See the calendar →' })}
            </LinkButton>
          </Card>
        </Reveal>

        {/* Notifications (design #17) — Step 14: derived in-app
            (deadline reminders, new mocks, result-ready) from
            published records + the student's own attempts.
            No collection, no push — Spark free. Read state is
            local per device. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
              {t({ bn: 'নোটিফিকেশন', en: 'Notifications' })}
              {unreadNotifications > 0 && <Chip tone="blue">{t({ bn: `${unreadNotifications}টি নতুন`, en: `${unreadNotifications} new` })}</Chip>}
            </div>
            {circulars === null || attempts === null ? (
              <Skeleton height={72} />
            ) : topUnreadNotifications.length === 0 ? (
              <p style={{ margin: '8px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'কোনো নতুন নোটিফিকেশন নেই। যাচাই করা সার্কুলারের সময়সীমা এগিয়ে এলে, নতুন মক প্রকাশিত হলে বা ফলাফল তৈরি হলে এখানে আসবে।',
                  en: 'No new notifications. When a verified circular deadline approaches, a new mock is published, or a result is ready, it will appear here.',
                })}
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {topUnreadNotifications.map((n) => (
                  <div key={n.id} style={{ fontSize: 14, lineHeight: 1.6 }}>
                    <Link to={n.link} style={{ fontWeight: 700 }}>
                      {t({ bn: n.titleBn, en: n.titleEn })}
                    </Link>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {t({ bn: n.bodyBn, en: n.bodyEn })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ margin: '10px 0 0' }}>
              <LinkButton to="/jobs/notifications" variant="outline">
                {t({ bn: 'সব নোটিফিকেশন দেখুন →', en: 'See all notifications →' })}
              </LinkButton>
            </p>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'এখানে "পাশ করবেন / চাকরি পাবেন" — এমন কোনো গ্যারান্টি দেওয়া হয় না। প্রস্তুতির উপকরণ দেওয়া হয়; ফল নির্ভর করে আপনার পড়াশোনা ও পরীক্ষার ওপর।',
              en: 'No "you will pass / you will get the job" guarantee is given here. Preparation material is provided; the result depends on your study and the exam.',
            })}
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
