// Eduvelto — Job Seeker Dashboard (four-section brief, 21 Nov 2026).
//
// /jobs/dashboard: the job seeker's own space — target exam, today's
// daily mock, this week's full mock, my results, weak topics, study
// routine and progress.
//
// Step 9 closure (D3/D4): the daily/weekly mock cards and the
// results/weak-topics cards are DATA-DRIVEN (published mocks +
// the student's own attempts) — the honest empty / Coming Soon copy
// shows only when the data is truly empty. The study routine and
// progress sections are still Coming Soon (Steps 11–12 own them).
// The dashboard is open to any signed-in user (a teacher can also
// prepare for BCS); signed-out visitors get the login prompt, same
// as the student dashboard. No ads on this page: it is all practice
// / exam / result space (design plan §1.4).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal, Skeleton, SkeletonCards } from '../components/ui';
import JobModeSwitch from '../components/JobModeSwitch';
import JobOnboarding from '../components/JobOnboarding';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { useJobMode } from '../lib/jobMode';
import { useLanguage } from '../i18n/LanguageContext';
import { DAILY_MOCK, WEEKLY_MOCK_CYCLE, jobExamBySlug } from '../lib/jobExams';
import { listMockAttempts, loadThisWeekWeeklyMock, loadTodayDailyMock, type MockAttemptWithId } from '../lib/jobMock';
import { jobMockPatternSummaryBn, type JobMockWithId } from '../lib/jobMocks';
import { jobTopicLabelBn, weakTopicsFromAttemptAnswers, type JobAttemptAnswer } from '../lib/jobEngine';

export default function JobSeekerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
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
  const [attempts, setAttempts] = useState<MockAttemptWithId[] | null>(null);
  useEffect(() => {
    let alive = true;
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
    if (user) {
      listMockAttempts(user.uid, 10)
        .then((list) => {
          if (alive) setAttempts(list);
        })
        .catch(() => {
          if (alive) setAttempts([]);
        });
    } else {
      setAttempts([]);
    }
    return () => {
      alive = false;
    };
  }, [user?.uid]);
  // Weak topics aggregated across the student's mock attempts
  // (same resolver as the result page, D7).
  const dashAnswers: JobAttemptAnswer[] =
    attempts?.flatMap((a) => (Array.isArray(a.answers) ? (a.answers as JobAttemptAnswer[]) : [])) ?? [];
  const dashWeakTopics = weakTopicsFromAttemptAnswers(dashAnswers).slice(0, 3);
  const dashLatest = attempts && attempts.length > 0 ? attempts[0] : null;

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
          <LinkButton to="/login" variant="outline">{t(strings.auth.loginTitle)}</LinkButton>
        </p>
      </PageShell>
    );
  }

  const name = profile.displayName?.trim();

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
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>
              {t({ bn: 'প্রোফাইল সম্পূর্ণ করুন', en: 'Complete your profile' })}
            </div>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: '#57616A', fontSize: 14, lineHeight: 2 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* My mode — Beginner / Advanced (owner decision 22 Nov 2026).
            Shows the current mode; the switch below changes it any time
            (stored on the user's own profile when signed in). */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার মোড', en: 'My mode' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
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
                style={{ background: 'none', border: 'none', padding: 0, color: '#12766E', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {t({ bn: 'মোড পছন্দ আবার দেখুন', en: 'Show the mode choice again' })}
              </button>
            </p>
          </Card>
        </Reveal>

        {/* Target exam — read from the profile (Step 4: targetExam).
            Change it in /profile. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার লক্ষ্য পরীক্ষা', en: 'My target exam' })}
            </div>
            {targetExamDef ? (
              <>
                <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  <Link to={`/jobs/${targetExamDef.slug}`} style={{ fontWeight: 700 }}>
                    {t({ bn: targetExamDef.bn, en: targetExamDef.en })}
                  </Link>
                  {' — '}
                  {t({ bn: targetExamDef.fullBn, en: targetExamDef.fullEn })}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য বদলান →', en: 'Change target →' })}
                </LinkButton>
              </>
            ) : profile?.targetExam ? (
              <>
                <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {profile.targetExam}
                </p>
                <LinkButton to="/profile" variant="outline">
                  {t({ bn: 'লক্ষ্য বদলান →', en: 'Change target →' })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
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

        {/* Today's daily mock — LIVE (Step 9, D3): today's published
            mock with a start link, or the honest not-yet state. No
            "coming soon" claim while mocks can exist. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'দৈনিক মক', en: 'Daily mock' })}
            </div>
            <p style={{ margin: '8px 0', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: DAILY_MOCK.sizeBn, en: DAILY_MOCK.sizeEn })} · {t({ bn: DAILY_MOCK.timeBn, en: DAILY_MOCK.timeEn })}
            </p>
            {!mocksLoaded ? (
              <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : daily ? (
              <>
                <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {daily.titleBn} · {jobMockPatternSummaryBn(daily.rulesSnapshot)}
                </p>
                <LinkButton to={`/jobs/mock/${daily.docId}`} variant="accent">
                  {t({ bn: 'আজকের মক শুরু করুন →', en: "Start today's mock →" })}
                </LinkButton>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'প্রতিদিন ভিন্ন কমন টপিক — আজকের মক এখনো প্রকাশিত হয়নি।',
                    en: 'A different common topic every day — today’s mock is not published yet.',
                  })}
                </p>
                <LinkButton to="/jobs/common" variant="outline">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </>
            )}
          </Card>
        </Reveal>

        {/* This week's full mock — LIVE (Step 9, D3), same pattern. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'সাপ্তাহিক পূর্ণ মক', en: 'Weekly full mock' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'পরিকল্পনা: প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'Plan: one full mock every week — rotating:' })}
            </p>
            <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.9 }}>
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
              <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : weekly ? (
              <>
                <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {weekly.titleBn} · {jobMockPatternSummaryBn(weekly.rulesSnapshot)}
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

        {/* My results — data-driven (D4): real history when the
            student has taken mocks; the "no mock taken yet" copy
            only when they truly have taken none. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার ফলাফল', en: 'My results' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : attempts.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
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
                <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                  {t({ bn: `মোট ${attempts.length}টি মক দেওয়া হয়েছে`, en: `${attempts.length} mock(s) taken` })}
                  {dashLatest && typeof dashLatest.score === 'number' && typeof dashLatest.totalMarks === 'number'
                    ? t({ bn: ` · সর্বশেষ: ${dashLatest.score}/${dashLatest.totalMarks} নম্বর`, en: ` · Latest: ${dashLatest.score}/${dashLatest.totalMarks}` })
                    : ''}
                </p>
                {dashLatest ? (
                  <LinkButton to={`/jobs/result/${dashLatest.docId}`} variant="accent">
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
            )}
          </Card>
        </Reveal>

        {/* Weak topics — data-driven (D4, same staleness class):
            real weak topics from the student's attempts; the empty
            copy only when no attempt exists. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'দুর্বল টপিক', en: 'Weak topics' })}
            </div>
            {attempts === null ? (
              <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
            ) : attempts.length === 0 ? (
              <>
                <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                  {t({
                    bn: 'মক টেস্টের ফলাফল এলে কোন টপিকে দুর্বল, কী আবার পড়তে হবে — তা এখানে দেখাবে। এখনো কোনো তথ্য নেই।',
                    en: 'Once mock results exist, this will show which topics are weak and what to revise. There is no data yet.',
                  })}
                </p>
                <Chip tone="gold">{t({ bn: 'মকের পরে দেখাবে', en: 'Shows after mocks' })}</Chip>
              </>
            ) : dashWeakTopics.length === 0 ? (
              <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'কোনো ভুল উত্তর নেই — দুর্বল টপিক পাওয়া যায়নি।',
                  en: 'No wrong answers — no weak topics found.',
                })}
              </p>
            ) : (
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.9, color: '#142B3B' }}>
                {dashWeakTopics.map((w) => (
                  <li key={w.topicId}>
                    {jobTopicLabelBn(w.topicId)} — {w.wrong}/{w.total}টি ভুল
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>

        {/* Study routine — Coming Soon. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার পড়ার রুটিন', en: 'My study routine' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'লক্ষ্য পরীক্ষার সিলেবাস অনুযায়ী ব্যক্তিগত পড়ার রুটিন এখানে থাকবে — পরীক্ষা ও মক চালু হলে।',
                en: 'A personal study routine based on your target exam’s syllabus will live here — once exams and mocks run.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* My progress — empty until practice starts. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার অগ্রগতি', en: 'My progress' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'অনুশীলন ও মক শুরু করলে পরীক্ষার ইতিহাস ও বিষয়ভিত্তিক অগ্রগতি এখানে দেখাবে। এখনো কোনো অগ্রগতি নেই।',
                en: 'Once you start practising and taking mocks, exam history and subject-wise progress will show here. There is no progress yet.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
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
