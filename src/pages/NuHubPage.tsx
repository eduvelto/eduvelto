// Eduvelto — National University hub (NU-5, 22 Nov 2026; design doc
// §5.2).
//
// `/admissions/national-university` + 8 tabs (Home · Groups ·
// Practice · Mock Tests · Previous Questions · Results · Progress ·
// Notices). Route: hub home = Home tab; `/admissions/national-
// university/:tab` for the rest. An unknown tab slug redirects to
// the hub home. (The three group pages are STATIC routes —
// `/admissions/national-university/humanities` etc. — so they rank
// above the `:tab` route and never collide with it.)
//
// Honest states everywhere: 0 questions / 0 mocks / 0 results —
// honest empty states, never fake counts. The Home tab carries the
// verified information (about card, ApplicationChecklist,
// MeritExplainer, distribution table) and NuOnboarding, moved here
// from /admissions in NU-5. Signed-out visitors see all public
// information; practice / mock / results / progress ask them to sign
// in. No rank, no leaderboard, no "verified" result class, no exam
// date, no prohibited wording (§15.1).

import { Link, Navigate, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, LinkButton } from '../components/ui';
import { useLanguage, T } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import AdmissionModeSwitch from '../components/AdmissionModeSwitch';
import NuOnboarding from '../components/NuOnboarding';
import MeritExplainer from '../components/MeritExplainer';
import ApplicationChecklist from '../components/ApplicationChecklist';
import NuNoticeCard from '../components/NuNoticeCard';
import {
  NU_DASHBOARD_ROUTE,
  NU_EXAM_DATE_BN,
  NU_HUB_ROUTE,
  NU_HUB_TABS,
  NU_HUB_TAB_LABELS,
  NU_NEXT_CYCLE_BN,
  NU_VERIFIED_NOTICE,
  NU_WINDOW_STATUS_BN,
  isNuHubTab,
  nuExamPattern,
  type NuHubTab,
} from '../lib/nuStructure';
import { NU_GROUPS, resolveAdmissionMode } from '../lib/nuProfile';

function LoginPrompt() {
  const { t } = useLanguage();
  return (
    <p style={{ marginTop: 12 }}>
      <LinkButton to="/login" variant="primary">
        {t({ bn: 'লগইন করুন', en: 'Sign in' })}
      </LinkButton>{' '}
      <span style={{ color: 'var(--muted-ivory)', fontSize: 14 }}>
        {t({
          bn: 'অনুশীলন, মক, ফলাফল ও অগ্রগতি দেখতে লগইন করুন।',
          en: 'Sign in to see practice, mocks, results and progress.',
        })}
      </span>
    </p>
  );
}

export default function NuHubPage() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const activeTab: NuHubTab = tab === undefined ? 'home' : isNuHubTab(tab) ? tab : 'home';
  if (tab !== undefined && !isNuHubTab(tab)) {
    return <Navigate to={NU_HUB_ROUTE} replace />;
  }
  const pattern = nuExamPattern();
  const mode = resolveAdmissionMode(profile?.admissionMode);
  const tabHref = (tb: NuHubTab) => (tb === 'home' ? NU_HUB_ROUTE : `${NU_HUB_ROUTE}/${tb}`);

  return (
    <PageShell titleBn="জাতীয় বিশ্ববিদ্যালয় ভর্তি" titleEn="National University Admission" wide hideHomeLink>
      <p style={{ marginTop: 0 }}>
        <Link to="/admissions" style={{ fontWeight: 600 }}>
          {t({ bn: '← ভর্তি প্রস্তুতি', en: '← Admission Preparation' })}
        </Link>
      </p>
      <div style={{ background: '#1E3A5F', color: '#fff', borderRadius: 12, padding: '24px 20px', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>
          {t({ bn: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি', en: 'National University Admission' })}
        </h2>
        <p style={{ margin: '0 0 10px', opacity: 0.92, lineHeight: 1.7 }}>
          {t({ bn: 'অনার্স ১ম বর্ষ — সর্বশেষ যাচাইকৃত বিজ্ঞপ্তি: সেশন ২০২৫-২০২৬ (সমাপ্ত)', en: 'Honours 1st year — latest verified circular: session 2025-2026 (complete)' })}
        </p>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--soon-bg)',
            color: 'var(--amber-deep)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {NU_WINDOW_STATUS_BN}
        </span>
      </div>

      <nav className="ev-class-tabs" aria-label={t({ bn: 'জাতীয় বিশ্ববিদ্যালয় — ট্যাব', en: 'National University — tabs' })}>
        {NU_HUB_TABS.map((tb) => {
          const active = tb === activeTab;
          return (
            <Link
              key={tb}
              to={tabHref(tb)}
              aria-current={active ? 'page' : undefined}
              className="ev-class-tab"
              style={{
                color: active ? '#1E3A5F' : '#68747B',
                borderBottomColor: active ? '#1E3A5F' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              <T bn={NU_HUB_TAB_LABELS[tb].bn} en={NU_HUB_TAB_LABELS[tb].en} />
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 16 }}>
        <AdmissionModeSwitch />
      </div>

      {activeTab === 'home' ? (
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <NuOnboarding />
          <Card>
            <h3 style={{ marginTop: 0, fontSize: 18, color: 'var(--heading)' }}>
              {t({ bn: 'ভর্তি সম্পর্কে', en: 'About admission' })}
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: 'var(--ink-soft)' }}>
              <li>{t({ bn: 'পরীক্ষার ধরন: ১০০ নম্বরের MCQ — ১০০টি প্রশ্ন, প্রতিটি ১ নম্বর।', en: 'Exam type: 100-mark MCQ — 100 questions, 1 mark each.' })}</li>
              <li>{t({ bn: 'সময়: ১ ঘণ্টা। ভুল উত্তরে নম্বর কাটা হয় না।', en: 'Time: 1 hour. No marks are cut for wrong answers.' })}</li>
              <li>{t({ bn: 'পাস নম্বর ৩৫ — তুলনার জন্য মাত্র, ফলাফলের রায় নয়।', en: 'Pass mark 35 — for comparison only, not a verdict on a result.' })}</li>
              <li>{t({ bn: 'মেধা মোট ২০০ = পরীক্ষা ১০০ + SSC GPA ৪০ + HSC GPA ৬০।', en: 'Merit total 200 = exam 100 + SSC GPA 40 + HSC GPA 60.' })}</li>
              <li>
                {NU_EXAM_DATE_BN}
              </li>
              <li>
                {t({ bn: 'যোগ্যতার সারাংশ: ', en: 'Eligibility summary: ' })}
                {NU_VERIFIED_NOTICE.eligibilitySummaryBn}
              </li>
            </ul>
            <p style={{ margin: '12px 0 0' }}>
              <a href={NU_VERIFIED_NOTICE.officialUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                {t({ bn: 'সর্বশেষ বিজ্ঞপ্তি দেখুন →', en: 'See the latest notice →' })}
              </a>{' '}
              <span style={{ color: 'var(--muted-ivory)', fontSize: 14 }}>(nu.ac.bd/admissions)</span>
            </p>
          </Card>

          <ApplicationChecklist />

          {mode === 'beginner' ? (
            <Card>
              <h3 style={{ marginTop: 0, fontSize: 18, color: 'var(--heading)' }}>
                {t({ bn: 'শুরু থেকে প্রস্তুতি — ৩ ধাপের পথ', en: 'Beginner preparation — a 3-step path' })}
              </h3>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: 'var(--ink-soft)' }}>
                <li>{t({ bn: 'আপনার শাখা বেছে নিন — মানবিক, বিজ্ঞান বা ব্যবসায় শিক্ষা।', en: 'Choose your group — Humanities, Science or Business Studies.' })}</li>
                <li>{t({ bn: 'সহজ ব্যাখ্যাসহ বিষয়ভিত্তিক অনুশীলন দিয়ে শুরু করুন।', en: 'Start with subject-wise practice with easy explanations.' })}</li>
                <li>{t({ bn: 'প্রস্তুতি এগোলে পূর্ণ মক দিন — সময়ভিত্তিক, ১০০ প্রশ্নের।', en: 'When ready, take a full mock — timed, 100 questions.' })}</li>
              </ol>
            </Card>
          ) : (
            <Card>
              <h3 style={{ marginTop: 0, fontSize: 18, color: 'var(--heading)' }}>
                {t({ bn: 'প্রতিযোগিতামূলক প্রস্তুতি', en: 'Competitive preparation' })}
              </h3>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
                {t({
                  bn: 'সময়ভিত্তিক পূর্ণ মক (১০০ প্রশ্ন, ১ ঘণ্টা) ও দৈনিক ছোট মক — প্রশ্ন তৈরি হলে এখানেই আসবে। কোনো র‍্যাংক বা লিডারবোর্ড নেই — ফলাফল শুধু আপনার নিজের অগ্রগতির জন্য।',
                  en: 'Timed full mocks (100 questions, 1 hour) and daily short mocks — they will appear here once the questions are ready. There is no rank or leaderboard — results are only for your own progress.',
                })}
              </p>
            </Card>
          )}

          <Card>
            <h3 style={{ marginTop: 0, fontSize: 18, color: 'var(--heading)' }}>
              {t({ bn: 'মানবণ্টন — যাচাইকৃত (বিজ্ঞপ্তি থেকে)', en: 'Marks distribution — verified (from the circular)' })}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--line)' }}>
                  <th style={{ padding: '8px 4px' }}>{t({ bn: 'অংশ', en: 'Part' })}</th>
                  <th style={{ padding: '8px 4px' }}>{t({ bn: 'নম্বর', en: 'Marks' })}</th>
                </tr>
              </thead>
              <tbody>
                {pattern.sections.map((s) => (
                  <tr key={s.bn} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '8px 4px' }}>{t({ bn: s.bn, en: s.en })}</td>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>{s.marks}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '8px 4px', fontWeight: 700 }}>{t({ bn: 'মোট', en: 'Total' })}</td>
                  <td style={{ padding: '8px 4px', fontWeight: 700 }}>{pattern.totalQuestions}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ margin: '10px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'শাখা-ভিত্তিক ৪০ নম্বরের ভেতরের বিভাজন Guideline-এ নিশ্চিত হলে এখানে আসবে — এখন শুধু ৪০ নম্বরের ব্লক হিসেবেই দেখানো হয়।',
                en: 'The inner split of the 40 group-subject marks will appear here once the Guideline confirms it — for now it is shown only as a 40-mark block.',
              })}
            </p>
          </Card>

          <MeritExplainer />

          <div style={{ border: '1px solid #D9A441', borderRadius: 10, padding: '14px 16px', background: 'var(--amber-soft)' }}>
            <p style={{ margin: 0, color: 'var(--amber-dark-text)', lineHeight: 1.8, fontSize: 14 }}>
              {t({
                bn: 'কোনো গ্যারান্টি নয়: "১০০% প্রস্তুতি" মানে সিলেবাস কভারেজ + অনুশীলন + মক — ভর্তির নিশ্চয়তা নয়। মেধাতালিকার অবস্থান অনুমান করে দেখানো হয় না।',
                en: 'No guarantee: "100% preparation" means syllabus coverage + practice + mocks — not a guarantee of admission. Merit-list position is never estimated.',
              })}
            </p>
          </div>
        </div>
      ) : null}

      {activeTab === 'groups' ? (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 16 }}>
          {NU_GROUPS.map((g) => (
            <Card key={g.slug}>
              <div style={{ borderLeft: `5px solid ${g.accent}`, paddingLeft: 12 }}>
                <strong style={{ fontSize: 17, color: 'var(--heading)' }}>{t({ bn: g.bn, en: g.en })}</strong>
                <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8, margin: '8px 0', fontSize: 14 }}>
                  {t({ bn: g.descriptionBn, en: g.descriptionEn })}
                </p>
                <p style={{ color: 'var(--muted-ivory)', fontSize: 14, margin: '0 0 8px' }}>
                  {t({ bn: 'মানবণ্টন: বাংলা ২০, ইংরেজি ২০, সাধারণ জ্ঞান ২০, শাখা-ভিত্তিক ৪০', en: 'Distribution: Bangla 20, English 20, General Knowledge 20, Group subjects 40' })}
                </p>
                <p style={{ color: 'var(--muted-ivory)', fontSize: 14, margin: '0 0 12px' }}>
                  {t({ bn: 'যোগ্যতা: ', en: 'Eligibility: ' })}
                  {g.slug === 'science'
                    ? 'SSC GPA ২.২৫+, HSC GPA ২.০+, মোট GPA ৪.৭৫+'
                    : 'SSC GPA ২.০+, HSC GPA ২.০+, মোট GPA ৪.৫+'}
                </p>
                <LinkButton to={`${NU_HUB_ROUTE}/${g.slug}`} variant="accent">
                  {t({ bn: 'প্রস্তুতি শুরু করুন', en: 'Start preparing' })} →
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {activeTab === 'practice' ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            bn="এখনো কোনো অনুশীলন প্রশ্ন নেই। প্রশ্ন তৈরি হচ্ছে — যাচাইকৃত শিক্ষকের যাচাই ছাড়া কোনো প্রশ্ন প্রকাশ করা হবে না।"
            en="No practice questions yet. Questions are being prepared — no question is published without a verified teacher's review."
          />
          {!user ? <LoginPrompt /> : null}
          <p style={{ color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({
              bn: 'বিষয়ভিত্তিক অনুশীলন শাখার পাতা থেকে শুরু হবে — প্রথমে আপনার শাখা বেছে নিন।',
              en: 'Subject-wise practice will start from the group pages — choose your group first.',
            })}
          </p>
          <p>
            <LinkButton to={`${NU_HUB_ROUTE}/groups`} variant="outline">
              {t({ bn: 'শাখা দেখুন', en: 'See groups' })} →
            </LinkButton>
          </p>
        </div>
      ) : null}

      {activeTab === 'mock-tests' ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            bn="এখনো কোনো মক নেই। সাপ্তাহিক পূর্ণ মক (১০০ MCQ, ১ ঘণ্টা) ও দৈনিক ছোট মক (২০–৩০ MCQ, ২০–৩০ মিনিট) প্রশ্ন তৈরি হলে এখানে আসবে।"
            en="No mocks yet. The weekly full mock (100 MCQ, 1 hour) and the daily short mock (20–30 MCQ, 20–30 minutes) will appear here once the questions are ready."
          />
          {!user ? <LoginPrompt /> : null}
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 12 }}>
            <Card>
              <strong>{t({ bn: 'সাপ্তাহিক পূর্ণ মক', en: 'Weekly full mock' })}</strong>
              <p style={{ color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8, margin: '8px 0 0' }}>                {t({ bn: '১০০ MCQ · ১ ঘণ্টা · নেগেটিভ মার্কিং নেই · পাস ৩৫ (তুলনার জন্য) — শীঘ্রই আসছে।', en: '100 MCQ · 1 hour · no negative marking · pass 35 (for comparison) — coming soon.' })}
              </p>
            </Card>
            <Card>
              <strong>{t({ bn: 'দৈনিক মক', en: 'Daily mock' })}</strong>
              <p style={{ color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8, margin: '8px 0 0' }}>                {t({ bn: '২০–৩০ MCQ · ২০–৩০ মিনিট — প্রকাশের সময় এখনো ঠিক হয়নি।', en: '20–30 MCQ · 20–30 minutes — the publish time is not decided yet.' })}
              </p>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'previous-questions' ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            bn="বিগত প্রশ্ন সংগ্রহ চলছে — NU প্রশ্নপত্র আনুষ্ঠানিকভাবে প্রকাশ করে কি না, তা যাচাই করা হচ্ছে।"
            en="Previous questions are being collected — it is being verified whether NU officially publishes the question paper."
          />
          <p style={{ color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({
              bn: 'দুটি বিগত পরীক্ষা আছে — ৩১ মে ২০২৫ (২০২৪-২৫ সেশন) ও ২৫ এপ্রিল ২০২৬ (২০২৫-২৬ সেশন)। যাচাইকৃত প্রশ্নপত্র পাওয়া গেলে এখানে আসবে — শাখা + সাল + উৎসসহ। HSC প্যাকের অনুশীলনী প্রশ্ন কখনো "বিগত প্রশ্ন" নয়।',
              en: 'There are two previous exams — 31 May 2025 (2024-25 session) and 25 April 2026 (2025-26 session). Their verified question papers will appear here — with group + year + source — once verified copies are found. HSC-pack practice questions are never "previous questions".',
            })}
          </p>
        </div>
      ) : null}

      {activeTab === 'results' ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            bn="এখনো কোনো ফলাফল নেই। মক দিলে ফলাফল এখানে দেখাবে।"
            en="No results yet. Results will appear here once you take a mock."
          />
          <p style={{ color: 'var(--muted-ivory)', fontSize: 14 }}>
            {t({ bn: 'অনুশীলন ফলাফল — ভর্তি পরীক্ষার ফল নয়।', en: 'Practice results — not admission exam results.' })}
          </p>
          {!user ? <LoginPrompt /> : null}
        </div>
      ) : null}

      {activeTab === 'progress' ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            bn="অনুশীলন শুরু করলে অগ্রগতি এখানে দেখাবে।"
            en="Progress will appear here once you start practising."
          />
          {!user ? <LoginPrompt /> : null}
        </div>
      ) : null}

      {activeTab === 'notices' ? (
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <NuNoticeCard notice={NU_VERIFIED_NOTICE} />
          <p style={{ color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
            {t({
              bn: 'নতুন বিজ্ঞপ্তি এলে এখানে আসবে। পরবর্তী বিজ্ঞপ্তি (২০২৬-২৭) এখনো যাচাই হয়নি — ' + NU_NEXT_CYCLE_BN,
              en: 'New notices will appear here. The next circular (2026-27) has not been verified yet — the latest verified circular is for the 2025–26 academic year.',
            })}
          </p>
        </div>
      ) : null}

      <p style={{ marginTop: 28 }}>
        <Link to={NU_DASHBOARD_ROUTE} style={{ fontWeight: 600 }}>
          {t({ bn: 'আমার ভর্তি ড্যাশবোর্ড →', en: 'My admission dashboard →' })}
        </Link>
      </p>
    </PageShell>
  );
}
