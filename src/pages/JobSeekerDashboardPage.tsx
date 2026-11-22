// Eduvelto — Job Seeker Dashboard (four-section brief, 21 Nov 2026).
//
// /jobs/dashboard: the job seeker's own space — target exam, today's
// daily mock, this week's full mock, my results, weak topics, study
// routine and progress.
//
// STRUCTURE ONLY. No job-progress data store exists yet and no mock
// has ever run, so every section is an honest empty / Coming Soon
// state — NO invented counts, scores, streaks or ranks. The dashboard
// is open to any signed-in user (a teacher can also prepare for BCS);
// signed-out visitors get the login prompt, same as the student
// dashboard. No ads on this page: it is all practice / exam / result
// space (design plan §1.4).

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal, Skeleton, SkeletonCards } from '../components/ui';
import JobModeSwitch from '../components/JobModeSwitch';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { useJobMode } from '../lib/jobMode';
import { useLanguage } from '../i18n/LanguageContext';
import { DAILY_MOCK, WEEKLY_MOCK_CYCLE, jobExamBySlug } from '../lib/jobExams';

export default function JobSeekerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const { mode } = useJobMode();
  const cycle = WEEKLY_MOCK_CYCLE.map((s) => jobExamBySlug(s)!).filter(Boolean);

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
          </Card>
        </Reveal>

        {/* Target exam — no target is stored yet (no such field exists). */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার লক্ষ্য পরীক্ষা', en: 'My target exam' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'এখনো কোনো লক্ষ্য পরীক্ষা বেছে নেওয়া হয়নি। যে পরীক্ষার প্রস্তুতি নিতে চান, সেটি বেছে নিন।',
                en: 'No target exam has been picked yet. Pick the exam you want to prepare for.',
              })}
            </p>
            <LinkButton to="/jobs" variant="accent">
              {t({ bn: 'পরীক্ষা বেছে নিন →', en: 'Pick an exam →' })}
            </LinkButton>
          </Card>
        </Reveal>

        {/* Today's daily mock — Coming Soon. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আজকের দৈনিক মক', en: "Today's daily mock" })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: DAILY_MOCK.sizeBn, en: DAILY_MOCK.sizeEn })} · {t({ bn: DAILY_MOCK.timeBn, en: DAILY_MOCK.timeEn })}
            </p>
            <p style={{ margin: '0 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'প্রতিদিন ভিন্ন কমন টপিক — দৈনিক মক চালু হলে এখানেই দিতে পারবেন।',
                en: 'A different common topic every day — once the daily mock runs, you can take it right here.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* This week's full mock — weekly cycle, Coming Soon. */}
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'এই সপ্তাহের পূর্ণ মক', en: "This week's full mock" })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'One full mock every week — rotating:' })}
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
            <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
          </Card>
        </Reveal>

        {/* My results — empty until a mock is taken. */}
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'আমার ফলাফল', en: 'My results' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'এখনো কোনো মক টেস্ট দেওয়া হয়নি — মক চালু হলে ফলাফল ও বিষয়ভিত্তিক নম্বর এখানে দেখাবে।',
                en: 'No mock test has been taken yet — once mocks run, results and subject-wise marks will show here.',
              })}
            </p>
            <LinkButton to="/jobs/common" variant="outline">
              {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
            </LinkButton>
          </Card>
        </Reveal>

        {/* Weak topics — empty until mocks run. */}
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: 'দুর্বল টপিক', en: 'Weak topics' })}
            </div>
            <p style={{ margin: '8px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'মক টেস্টের ফলাফল এলে কোন টপিকে দুর্বল, কী আবার পড়তে হবে — তা এখানে দেখাবে। এখনো কোনো তথ্য নেই।',
                en: 'Once mock results exist, this will show which topics are weak and what to revise. There is no data yet.',
              })}
            </p>
            <Chip tone="gold">{t({ bn: 'মকের পরে দেখাবে', en: 'Shows after mocks' })}</Chip>
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
