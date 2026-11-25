// Eduvelto — job exam hub (master plan B-1.3, structure only).
//
// One hub per exam: /jobs/:exam with 8 tabs (Home, Subjects, Practice,
// Mock Tests, Previous Questions, Results, Progress, Current Affairs —
// design plan §1.4, same pattern as the class dashboards).
//
// STRUCTURE ONLY: the Home tab shows the exam's identity (recruiting
// body, stages, official-site link), the VERIFIED exam pattern for the
// 4 main exams (EXAM_PATTERNS — MCQ-stage subject breakdown, total,
// time, negative marking; source: job analysis 21 Nov 2026, with the
// "verify against the latest circular" caveat) and the 7 preparation
// elements link to live content where it exists (viva, BCS English
// practice, published mocks, subject lists) and carry an honest not-yet
// line otherwise — no Coming Soon chips (23 Nov 2026, AdSense cleanup).
// Content tabs show an honest empty state
// until their content is published — NO syllabus tables (B-2.1),
// NO live practice (B-2.2), NO live mocks (B-2.3), NO previous
// questions (B-6.1); the mocks and results tabs are data-driven
// (Step 9) and show real published mocks / real attempts when they
// exist. The first verified bank batch (35 BCS English questions)
// is already in the database. Age limits, fees and exam dates are
// never written
// here — they change with every circular. BCS viva marks are never
// written (200 vs 100 disputed); NTRCA 19th pattern is never written.
// No ads on this page: the hub is all practice / exam / result space
// (design plan §1.4).

import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import { JobNonAffiliationNote } from '../components/JobCards';
import JobPracticeTab from '../components/JobPracticeTab';
import JobMockTab from '../components/JobMockTab';
import JobModeSwitch from '../components/JobModeSwitch';
import JobGrade1120Hub from './JobGrade1120Hub';
import SuggestionPdfCard from '../components/SuggestionPdfCard';
import JobPreviousAnalysis from '../components/JobPreviousAnalysis';
import LoginWall from '../components/LoginWall';
import { useLanguage, T } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { useNotFoundMeta } from '../lib/useNotFoundMeta';
import { useJobMode } from '../lib/jobMode';
import { listMockAttempts, listPublishedMocks, type MockAttemptWithId } from '../lib/jobMock';
import type { JobMockWithId } from '../lib/jobMocks';
import { listPublishedPracticeBundles, type PracticeBundleWithId } from '../lib/jobPractice';
import {
  EXAM_PATTERNS,
  JOB_ELEMENTS,
  JOB_TABS,
  WEEKLY_MOCK_CYCLE,
  isJobTabSlug,
  jobExamBySlug,
  type JobExamDef,
  type JobTabSlug,
} from '../lib/jobExams';
import { jobSubjectsForExam } from '../lib/jobContent';

/** Honest empty copy per content tab — no fake readiness anywhere. */
const TAB_EMPTY: Record<Exclude<JobTabSlug, 'home'>, { bn: string; en: string; noteBn: string; noteEn: string }> = {
  subjects: {
    bn: 'বিষয় তালিকা তৈরি হচ্ছে',
    en: 'Subject list is being prepared',
    noteBn: 'অফিসিয়াল সিলেবাস থেকে যাচাই করে বিষয় ও টপিকের তালিকা প্রকাশিত হবে।',
    noteEn: 'The subject and topic list will be published after verification against the official syllabus.',
  },
  practice: {
    bn: 'অনুশীলন প্রশ্ন তৈরি হচ্ছে',
    en: 'Practice questions are being prepared',
    noteBn: 'টপিকভিত্তিক MCQ (উত্তর ও ব্যাখ্যাসহ) অনুশীলন চালু হলে এখানে আসবে।',
    noteEn: 'Topic-wise MCQs (with answer and explanation) will appear here once practice runs.',
  },
  mocks: {
    bn: 'মক টেস্ট তৈরি হচ্ছে',
    en: 'Mock tests are being prepared',
    noteBn: 'মক চালু হলে আসল ধরনে (নম্বর, সময়, নেগেটিভ মার্কিংসহ) মক দেওয়া যাবে।',
    noteEn: 'Once mocks run, they will follow the real pattern (marks, time, negative marking).',
  },
  previous: {
    bn: 'যাচাইকৃত বিগত প্রশ্ন এখনো সংগ্রহ হয়নি',
    en: 'No verified previous questions collected yet',
    noteBn: 'বিগত প্রশ্ন সংগ্রহ ও যাচাই চলছে। অযাচাইকৃত প্রশ্ন কখনো "বিগত প্রশ্ন" হিসেবে দেখানো হবে না।',
    noteEn: 'Previous questions are being collected and verified. Unverified questions are never shown as "previous questions".',
  },
  results: {
    bn: 'এখনো কোনো ফলাফল নেই',
    en: 'No results yet',
    noteBn: 'এখনো কোনো মক টেস্ট দেওয়া হয়নি — মক চালু হলে ফলাফল ও দুর্বল টপিকের বিশ্লেষণ এখানে দেখাবে।',
    noteEn: 'No mock test has been taken yet — once mocks run, results and weak-topic analysis will show here.',
  },
  progress: {
    bn: 'এখনো কোনো অগ্রগতি নেই',
    en: 'No progress yet',
    noteBn: 'অনুশীলন শুরু করলে বিষয়ভিত্তিক অগ্রগতি এখানে দেখাবে।',
    noteEn: 'Subject-wise progress will show here once you start practising.',
  },
  'current-affairs': {
    bn: 'সাম্প্রতিক ঘটনার আপডেট এখনো শুরু হয়নি',
    en: 'Current-affairs updates have not started yet',
    noteBn: 'মাসিক আপডেট আসবে — তারিখসহ। পুরোনো GK কখনো "সাম্প্রতিক" বলে দেখানো হবে না।',
    noteEn: 'Monthly updates will come — dated. Old GK is never shown as "current".',
  },
};

/** Bangla digits for marks / counts ("৩৫ নম্বর"). Same helper as JobCards. */
function bnNum(n: number): string {
  return String(n)
    .split('')
    .map((d) => '০১২৩৪৫৬৭৮৯'[Number(d)])
    .join('');
}

/**
 * Subjects tab (Step 6): the exam's verified subject list from the
 * canonical lib (jobContent.ts), as a card grid — one card per subject
 * with its Bangla name and verified marks. No topic line: the topic
 * count is 0 for every subject today — no topics exist yet — so no
 * topic count or Coming Soon chip is shown (23 Nov 2026, AdSense
 * cleanup). Each card links to the subject page
 * (/jobs/:exam/subjects/:subject).
 *
 * IT (scope undecided) gets the scope note instead of a subject list.
 * The other exams with no subjects are NOT rendered here — the hub
 * falls through to the generic TAB_EMPTY card below, which carries the
 * "বিষয় তালিকা তৈরি হচ্ছে" copy.
 */
function JobSubjectsTab({ def }: { def: JobExamDef }) {
  const { t, lang } = useLanguage();
  const subjects = jobSubjectsForExam(def.slug);
  const source = subjects[0]?.syllabusSource ?? null;

  if (def.slug === 'it-professional') {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'পরিসর ঠিক হচ্ছে', en: 'Scope being decided' })}</div>
          <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
            {t({ bn: 'কোন পদগুলো এর ভেতরে থাকবে, তা ঠিক হচ্ছে — সরকারি IT পদ, বেসরকারি IT চাকরি, নাকি পেশাগত সনদ? সিদ্ধান্ত হলে বিজ্ঞপ্তি যাচাই করে তবে বিষয় তালিকা লেখা হবে। এখানে কোনো বিষয় তালিকা লেখা হয়নি।', en: 'Which posts belong here is being decided — government IT posts, private IT jobs, or professional certificates? Once decided, the subject list will be written only after verification from the circular. No subject list is written here.' })}
          </p>
        </Card>
      </Reveal>
    );
  }

  return (
    <>
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'বিষয়', en: 'Subjects' })}</h2>
      </Reveal>
      {source ? (
        <p style={{ color: '#68747B', margin: '0 0 16px', fontSize: 13 }}>{t({ bn: `উৎস: ${source}`, en: `Source: ${source}` })}</p>
      ) : null}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {subjects.map((s, i) => (
          <Reveal key={s.slug} delayMs={Math.min(i, 5) * 60}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{lang === 'bn' ? s.nameBn : s.nameEn}</div>
              <p style={{ margin: '6px 0 10px', color: '#68747B', fontSize: 14 }}>
                {s.marks !== null ? t({ bn: `${bnNum(s.marks)} নম্বর`, en: `${s.marks} marks` }) : t({ bn: 'নম্বর যাচাই হয়নি', en: 'Marks not verified' })}
              </p>
              <p style={{ margin: 0 }}>
                <Link to={`/jobs/${def.slug}/subjects/${s.slug}`} style={{ fontWeight: 600 }}>
                  {t({ bn: 'বিষয়টি দেখুন →', en: 'See this subject →' })}
                </Link>
              </p>
            </Card>
          </Reveal>
        ))}
      </div>
    </>
  );
}

/** Hub results tab (Step 9 closure, D3): the student's mock
 * attempts for THIS exam, newest first — real history when they
 * have taken mocks; the honest empty note only when they truly
 * have taken none. Signed-out visitors get the login prompt. */
function JobHubResultsTab({ def }: { def: JobExamDef }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const [attempts, setAttempts] = useState<MockAttemptWithId[] | null>(null);
  useEffect(() => {
    if (!user) {
      setAttempts([]);
      return;
    }
    let alive = true;
    listMockAttempts(user.uid, 50)
      .then((list) => {
        if (alive) setAttempts(list.filter((a) => a.examSlug === def.slug).slice(0, 5));
      })
      .catch(() => {
        if (alive) setAttempts([]);
      });
    return () => {
      alive = false;
    };
  }, [user, def.slug]);

  if (!user) {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'ফলাফল দেখতে লগইন করুন', en: 'Log in to see results' })}</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'ফলাফল শুধু লগইন করা শিক্ষার্থীরা দেখতে পারে।', en: 'Results are only visible to logged-in students.' })}
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/login" state={back} style={{ fontWeight: 600 }}>
              {t({ bn: 'লগইন করুন →', en: 'Log in →' })}
            </Link>
          </p>
        </Card>
      </Reveal>
    );
  }

  if (attempts === null) {
    return (
      <Reveal>
        <Card>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
        </Card>
      </Reveal>
    );
  }

  if (attempts.length === 0) {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'এখনো কোনো ফলাফল নেই', en: 'No results yet' })}</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'এখনো কোনো মক টেস্ট দেওয়া হয়নি — মক দিলে ফলাফল ও দুর্বল টপিকের বিশ্লেষণ এখানে দেখাবে।', en: 'No mock test has been taken yet — once you take a mock, results and weak-topic analysis will show here.' })}
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/jobs/common" style={{ fontWeight: 600 }}>
              {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
            </Link>
          </p>
        </Card>
      </Reveal>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {attempts.map((a) => (
        <Reveal key={a.docId}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
              <span>
                {t({ bn: `${typeof a.score === 'number' ? a.score : 0} / ${typeof a.totalMarks === 'number' ? a.totalMarks : 0} নম্বর · ${typeof a.correctCount === 'number' ? a.correctCount : 0}টি সঠিক · ${typeof a.wrongCount === 'number' ? a.wrongCount : 0}টি ভুল`, en: `${typeof a.score === 'number' ? a.score : 0} / ${typeof a.totalMarks === 'number' ? a.totalMarks : 0} marks · ${typeof a.correctCount === 'number' ? a.correctCount : 0} correct · ${typeof a.wrongCount === 'number' ? a.wrongCount : 0} wrong` })}
              </span>
              <Link to={`/jobs/result/${a.docId}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'ফলাফল দেখুন →', en: 'See result →' })}
              </Link>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

export default function JobHubPage() {
  const { t, lang } = useLanguage();
  const { mode } = useJobMode();
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { exam = '', tab } = useParams<{ exam: string; tab?: string }>();
  const def = jobExamBySlug(exam);
  // Unknown exam slug: the honest "not found" card below must not be
  // indexed under the home fallback title — set a distinct title +
  // robots noindex while it shows (shared hook, restores on unmount).
  useNotFoundMeta(lang === 'bn' ? 'পরীক্ষা পাওয়া যায়নি — Eduvelto' : 'Exam not found — Eduvelto', !def);
  const activeTab: JobTabSlug = isJobTabSlug(tab) ? tab : 'home';
  const pattern = def ? EXAM_PATTERNS[def.slug] : undefined;
  // Step 6 — canonical subject list. Takes the raw param (not
  // def.slug): the lib returns [] — never throws — for unknown slugs,
  // and this line runs before the !def early return below.
  const subjects = jobSubjectsForExam(exam);
  // Step 9 closure (D3): the exam's published full mocks, for the
  // home-tab mock/model-test cards. Loads for everyone (published
  // definitions are readable signed-out); null = still loading.
  const [publishedMocks, setPublishedMocks] = useState<JobMockWithId[] | null>(null);
  useEffect(() => {
    if (!def) {
      setPublishedMocks([]);
      return;
    }
    let alive = true;
    listPublishedMocks({ examSlug: def.slug, kind: 'full' })
      .then((list) => {
        if (alive) setPublishedMocks(list);
      })
      .catch(() => {
        if (alive) setPublishedMocks([]);
      });
    return () => {
      alive = false;
    };
  }, [def?.slug]);
  // Audit m03 (24 Nov 2026): the hero "কনটেন্ট তৈরি হচ্ছে" badge
  // must not show on an exam that already has published content
  // (BCS has 13 published practice bundles and no mocks — the old
  // unconditional badge said "in preparation" anyway). Load the
  // published practice bundles the same way as the mocks above;
  // null = still loading, and the badge stays hidden until the
  // load settles so it never flashes on a loaded exam.
  const [publishedBundles, setPublishedBundles] = useState<PracticeBundleWithId[] | null>(null);
  useEffect(() => {
    if (!def) {
      setPublishedBundles([]);
      return;
    }
    let alive = true;
    listPublishedPracticeBundles(def.slug)
      .then((list) => {
        if (alive) setPublishedBundles(list);
      })
      .catch(() => {
        if (alive) setPublishedBundles([]);
      });
    return () => {
      alive = false;
    };
  }, [def?.slug]);
  const hasPublishedContent =
    (publishedMocks !== null && publishedMocks.length > 0) ||
    (publishedBundles !== null && publishedBundles.length > 0);
  const contentLoadSettled = publishedMocks !== null && publishedBundles !== null;

  if (!def) {
    return (
      <PageShell titleBn="পরীক্ষা পাওয়া যায়নি" titleEn="Exam not found" wide>
        <EmptyState bn="এই পরীক্ষাটি খুঁজে পাওয়া যায়নি।" en="This exam could not be found." />
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  // Unknown tab slug redirects to the hub home instead of silently
  // rendering Home (same behaviour as the NU hub).
  if (tab !== undefined && !isJobTabSlug(tab)) {
    return <Navigate to={`/jobs/${def.slug}`} replace />;
  }

  const tabHref = (s: JobTabSlug) => (s === 'home' ? `/jobs/${def.slug}` : `/jobs/${def.slug}/${s}`);

  return (
    <PageShell titleBn={def.bn} titleEn={def.en} wide hideTitle maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতি', en: '← Job Preparation' })}
        </Link>
      </p>

      {/* Exam header band — colour identity + recruiting body + stages. */}
      <section className="ev-class-hero" style={{ background: def.accent }} aria-label={t({ bn: def.bn, en: def.en })}>
        <div>
          <h1
            style={{
              fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
              fontSize: 26,
              lineHeight: 1.3,
              margin: '0 0 4px',
              color: '#fff',
            }}
          >
            {t({ bn: def.fullBn, en: def.fullEn })}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>
            {t({ bn: def.orgBn, en: def.orgEn })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: 600 }}>
            {t({ bn: def.stepsBn, en: def.stepsEn })}
          </p>
        </div>
        {/* Audit m03 (24 Nov 2026): show only when the load has
            settled AND this exam really has no published content
            (no mocks and no practice bundles). */}
        {contentLoadSettled && !hasPublishedContent ? (
          <p style={{ margin: '12px 0 0' }}>
            <span className="ev-class-hero-coming">{t({ bn: 'কনটেন্ট তৈরি হচ্ছে', en: 'Content in preparation' })}</span>
          </p>
        ) : null}
      </section>

      {/* Non-affiliation (Step 5): Eduvelto is not affiliated with any
          recruiting body — verify in the official circular. */}
      <JobNonAffiliationNote />

      {/* Tab bar — Home, Subjects, Practice, Mock Tests, Previous Questions, Results, Progress, Current Affairs. */}
      <nav className="ev-class-tabs" aria-label={t({ bn: `${def.bn} — ট্যাব`, en: `${def.en} — tabs` })}>
        {JOB_TABS.map((tb) => {
          const active = tb.slug === activeTab;
          return (
            <Link
              key={tb.slug}
              to={tabHref(tb.slug)}
              aria-current={active ? 'page' : undefined}
              className="ev-class-tab"
              style={{
                color: active ? 'var(--heading)' : 'var(--muted)',
                borderBottomColor: active ? def.accent : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              <T bn={tb.bn} en={tb.en} />
            </Link>
          );
        })}
      </nav>

      {/* Preparation mode — visible on every hub tab (owner decision
          22 Nov 2026). The home tab below renders the Beginner or the
          Advanced view for this exam. */}
      <div style={{ margin: '0 0 20px' }}>
        <JobModeSwitch />
      </div>

      {/* Phase 3 (25 Nov 2026): ৳149 suggestion-PDF card — UI-only
          until verified content exists (sales gate in lib/orders.ts). */}
      <SuggestionPdfCard examName={def.bn} />

      {activeTab === 'home' ? (
        def.slug === 'grade-11-20' ? (
          // Grades 11–20 hub (design §1.2): the same shell (hero +
          // non-affiliation + tab bar + mode switch above), with the
          // hub-specific sections — legend, directory, family cards —
          // instead of the generic pattern/elements body. The generic
          // body would duplicate the model-test / previous sections
          // the hub component already renders honestly.
          <JobGrade1120Hub />
        ) : (
        <>
          {/* Exam identity — official source; age limits, fees and exam
              dates are never written here. */}
          <Reveal>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                {t({ bn: 'পরীক্ষা সম্পর্কে', en: 'About this exam' })}
              </div>
              <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
                {t({
                  bn: 'নম্বর, সময়, বয়সসীমা ও ফি প্রতিটি বিজ্ঞপ্তিতে বদলাতে পারে। বয়সসীমা, ফি ও পরীক্ষার তারিখ এখানে কখনো লেখা হয় না — সর্বশেষ বিজ্ঞপ্তি অফিসিয়াল সাইটে দেখুন।',
                  en: 'Marks, time, age limit and fees change with every circular. Age limit, fees and exam dates are never written here — see the latest circular on the official site.',
                })}
              </p>
              {def.officialUrl ? (
                <p style={{ margin: '12px 0 0' }}>
                  <a href={def.officialUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                    {t({ bn: def.officialLinkBn ?? 'সর্বশেষ বিজ্ঞপ্তি দেখুন →', en: def.officialLinkEn ?? 'See the latest circular →' })}
                  </a>
                </p>
              ) : (
                <p style={{ margin: '12px 0 0', color: 'var(--muted-ivory)', fontSize: 14 }}>
                  {t({
                    bn: 'কোনো একক অফিসিয়াল সাইট নেই — প্রতিটি নিয়োগ বিজ্ঞপ্তি সংশ্লিষ্ট প্রতিষ্ঠানের নিজের সাইটে দেখুন।',
                    en: 'There is no single official site — see each recruitment circular on the hiring organisation’s own site.',
                  })}
                </p>
              )}
            </Card>
          </Reveal>

          {/* Step 5 — IT hub scope note (Step 2 §2.9/§13.8): the scope
              is UNDECIDED (owner decision), so this hub is structure +
              honest empty state only. No pattern, marks or post counts
              are guessed — the open question (government IT posts?
              private IT jobs? professional certificates?) is quoted
              as a question, not answered. */}
          {def.slug === 'it-professional' ? (
            <Reveal>
              <Card style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                  {t({ bn: 'পরিসর ঠিক হচ্ছে', en: 'Scope being decided' })}
                </div>
                <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
                  {t({
                    bn: 'কোন পদগুলো এর ভেতরে থাকবে, তা ঠিক হচ্ছে — সরকারি IT পদ, বেসরকারি IT চাকরি, নাকি পেশাগত সনদ? সিদ্ধান্ত হলে বিজ্ঞপ্তি যাচাই করে তবে ধরন লেখা হবে। এখানে কোনো ধরন, মানবণ্টন বা পদসংখ্যা অনুমান করে লেখা হয়নি।',
                    en: 'Which posts belong here is being decided — government IT posts, private IT jobs, or professional certificates? Once decided, the pattern will be written only after verification from the circular. No pattern, mark distribution or post count is guessed here.',
                  })}
                </p>
              </Card>
            </Reveal>
          ) : null}

          {/* Mode view — Beginner or Advanced (owner decision 22 Nov
              2026). The entries below are data-driven where Step 9
              ships (published mocks, real results) and honest empty
              states elsewhere — nothing here pretends a test can be
              taken before it is published. The first verified bank
              batch (35 BCS English questions) is in the database. */}
          {mode === 'beginner' ? (
            <>
              {/* Easy explanation — what this exam is, in plain words. */}
              <Reveal>
                <Card style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                    {t({ bn: 'সহজ ব্যাখ্যা — এই পরীক্ষাটি কী', en: 'Easy explanation — what this exam is' })}
                  </div>
                  <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
                    {t({
                      bn: `${def.fullBn} — ${def.orgBn} নেয়। ধাপগুলো হলো: ${def.stepsBn}। প্রথমে সহজ বিষয়গুলো দিয়ে শুরু করুন — এক ধাপ শেষ করে পরের ধাপে যান। তাড়াহুড়ো নেই, টাইমার নেই।`,
                      en: `${def.fullEn} — run by ${def.orgEn}. The stages are: ${def.stepsEn}. Start with the easy subjects — finish one step, then move to the next. No rush, no timer.`,
                    })}
                  </p>
                </Card>
              </Reveal>

              {/* Step-by-step basic practice path: subject → topic →
                  easy questions. Each step links to its tab, which shows
                  the honest empty state until content is published. */}
              <Reveal>
                <h2 className="ev-section-h2">{t({ bn: 'ধাপে ধাপে শুরু করুন', en: 'Start step by step' })}</h2>
              </Reveal>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                <Reveal delayMs={0}>
                  <Card>
                    <span className="ev-step-num" aria-hidden="true">{t({ bn: '১', en: '1' })}</span>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', marginTop: 10 }}>
                      {t({ bn: 'বিষয় দেখুন', en: 'See the subjects' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'এই পরীক্ষায় কোন কোন বিষয় আছে, তা আগে দেখে নিন।', en: 'First see which subjects this exam covers.' })}
                    </p>
                    <Link to={tabHref('subjects')} style={{ fontWeight: 600 }}>
                      {t({ bn: 'বিষয় দেখুন →', en: 'See subjects →' })}
                    </Link>
                  </Card>
                </Reveal>
                <Reveal delayMs={80}>
                  <Card>
                    <span className="ev-step-num" aria-hidden="true">{t({ bn: '২', en: '2' })}</span>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', marginTop: 10 }}>
                      {t({ bn: 'টপিক ধরে বেসিক অনুশীলন', en: 'Basic practice, topic by topic' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'একটি টপিক শেষ করে পরেরটিতে যান — সহজ প্রশ্ন দিয়ে শুরু হবে।', en: 'Finish one topic, then move to the next — starting with easy questions.' })}
                    </p>
                    <Link to={tabHref('practice')} style={{ fontWeight: 600 }}>
                      {t({ bn: 'অনুশীলন দেখুন →', en: 'See practice →' })}
                    </Link>
                  </Card>
                </Reveal>
                <Reveal delayMs={160}>
                  <Card>
                    <span className="ev-step-num" aria-hidden="true">{t({ bn: '৩', en: '3' })}</span>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', marginTop: 10 }}>
                      {t({ bn: 'সহজ প্রশ্ন দিয়ে শুরু', en: 'Start with easy questions' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {def.slug === 'bcs'
                        ? t({ bn: 'BCS English-এর বেসিক প্রশ্ন (উত্তর ও ব্যাখ্যাসহ) অনুশীলন চালু আছে — টপিক ধরে শুরু করুন।', en: 'Basic BCS English questions (with answer and explanation) are live — start topic by topic.' })
                        : t({ bn: 'বেসিক প্রশ্ন (উত্তর ও ব্যাখ্যাসহ) অনুশীলন চালু হলে এখানে আসবে।', en: 'Basic questions (with answer and explanation) will appear here once practice runs.' })}
                    </p>
                    {def.slug === 'bcs' ? (
                      <>
                        <Link to="/jobs/bcs/practice/english" style={{ fontWeight: 600 }}>
                          {t({ bn: 'BCS English অনুশীলন দেখুন →', en: 'See BCS English practice →' })}
                        </Link>
                        <br />
                        {/* Phase 4: Daily 5-Question Free Quiz lives on
                            the homepage (#daily-quiz) — no login, same
                            35 verified questions, practice only. */}
                        <Link to="/#daily-quiz" style={{ fontWeight: 600 }}>
                          {t({ bn: 'প্রতিদিনের ফ্রি কুইজ খেলুন →', en: 'Play the daily free quiz →' })}
                        </Link>
                      </>
                    ) : null}
                  </Card>
                </Reveal>
              </div>
            </>
          ) : (
            <>
              {/* Timed-mock entry — real pattern time + negative marking
                  where verified; circular-based note otherwise. The
                  cards below are data-driven (D3): published mocks
                  show their count, unpublished show the honest
                  not-yet state. */}
              <Reveal>
                <h2 className="ev-section-h2">{t({ bn: 'সময়ভিত্তিক প্রস্তুতি', en: 'Timed preparation' })}</h2>
              </Reveal>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
                <Reveal delayMs={0}>
                  <Card>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                      {t({ bn: 'সময়ভিত্তিক মক টেস্ট', en: 'Timed mock test' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {pattern
                        ? t({ bn: `${pattern.timeBn} · ${pattern.negativeBn}`, en: `${pattern.timeEn} · ${pattern.negativeEn}` })
                        : t({ bn: 'সময় ও নেগেটিভ মার্কিং বিজ্ঞপ্তি অনুযায়ী হবে।', en: 'Time and negative marking follow the circular.' })}
                    </p>
                    {/* D3: data-driven — the mocks tab lists published
                        mocks, so this card must not claim none exist. */}
                    <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {publishedMocks === null
                        ? t({ bn: 'মক তালিকা লোড হচ্ছে…', en: 'Loading the mock list…' })
                        : publishedMocks.length > 0
                          ? t({ bn: `${publishedMocks.length}টি মক প্রকাশিত হয়েছে — আসল ধরনে মক দেওয়া যাবে।`, en: `${publishedMocks.length} mock(s) published — take them in the real pattern.` })
                          : t({ bn: 'এখনো কোনো মক প্রকাশিত হয়নি — মক চালু হলে আসল ধরনে মক দেওয়া যাবে।', en: 'No mock is published yet — once mocks run, they will follow the real pattern.' })}                    </p>
                    <Link to={tabHref('mocks')} style={{ fontWeight: 600 }}>
                      {t({ bn: 'মক টেস্ট দেখুন →', en: 'See mock tests →' })}
                    </Link>
                  </Card>
                </Reveal>
                <Reveal delayMs={80}>
                  <Card>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                      {t({ bn: 'পূর্ণাঙ্গ মডেল টেস্ট', en: 'Full model test' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {pattern
                        ? t({ bn: `${pattern.totalBn} · ${pattern.timeBn} — আসল ধরনে পূর্ণ পরীক্ষা।`, en: `${pattern.totalEn} · ${pattern.timeEn} — a full exam in the real pattern.` })
                        : t({ bn: 'আসল ধরনে পূর্ণ পরীক্ষা — নম্বর ও সময় বিজ্ঞপ্তি অনুযায়ী।', en: 'A full exam in the real pattern — marks and time follow the circular.' })}
                    </p>
                    {/* D3: a full model test IS a published full mock —
                        same data as the card above. */}
                    <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {publishedMocks === null
                        ? t({ bn: 'মক তালিকা লোড হচ্ছে…', en: 'Loading the mock list…' })
                        : publishedMocks.length > 0
                          ? t({ bn: `${publishedMocks.length}টি পূর্ণ মক প্রকাশিত হয়েছে — আসল ধরনে দেওয়া যাবে।`, en: `${publishedMocks.length} full mock(s) published — take them in the real pattern.` })
                          : t({ bn: 'এখনো কোনো মডেল টেস্ট প্রকাশিত হয়নি।', en: 'No model test is published yet.' })}                    </p>
                    {publishedMocks !== null && publishedMocks.length > 0 ? (
                      <Link to={tabHref('mocks')} style={{ fontWeight: 600 }}>
                        {t({ bn: 'মক টেস্ট দেখুন →', en: 'See mock tests →' })}
                      </Link>
                    ) : null}
                  </Card>
                </Reveal>
                <Reveal delayMs={160}>
                  <Card>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                      {t({ bn: 'প্রতিযোগিতামূলক প্রস্তুতি', en: 'Competitive preparation' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'পরিকল্পনা: প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'Plan: one full mock every week — rotating:' })}                    </p>
                    <p style={{ margin: '0 0 10px', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.9 }}>
                      {WEEKLY_MOCK_CYCLE.map((s, i) => {
                        const cyc = jobExamBySlug(s);
                        if (!cyc) return null;
                        return (
                          <span key={cyc.slug}>
                            {i > 0 ? ' → ' : ''}
                            <Link to={`/jobs/${cyc.slug}`} style={{ fontWeight: 600 }}>
                              {t({ bn: cyc.bn, en: cyc.en })}
                            </Link>
                          </span>
                        );
                      })}
                    </p>
                    <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'মক চালু হলে ফলাফল ও দুর্বল টপিকের বিশ্লেষণ দেখাবে। কোনো র‍্যাংক বা লিডারবোর্ড নেই — সার্ভার-যাচাই ছাড়া প্রতিযোগিতার নম্বর দেখানো হয় না।', en: 'Once mocks run, results and weak-topic analysis will show. There is no rank or leaderboard — competitive scores are never shown without server-side verification.' })}
                    </p>
                    <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                      {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                    </Link>
                  </Card>
                </Reveal>
              </div>
              {/* Timed mocks and model tests run behind sign-in — guests
                  meet the login wall on the mocks tab, so this hint
                  tells them up front instead of letting the cards
                  promise a test they cannot take yet. */}
              {!user ? (
                <p style={{ margin: '0 0 20px', color: '#57616A', fontSize: 14 }}>
                  {t({
                    bn: 'সময়ভিত্তিক মক ও মডেল টেস্ট দিতে লগইন করতে হবে — ',
                    en: 'You need to sign in to take timed mocks and model tests — ',
                  })}
                  <Link to="/login" state={back} style={{ fontWeight: 600 }}>
                    {t({ bn: 'লগইন করুন →', en: 'Sign in →' })}
                  </Link>
                </p>
              ) : null}
            </>
          )}

          {/* Verified exam pattern (4 main exams) or an honest
              circular-based state (all other exams). */}
          <Reveal>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                {pattern
                  ? t({ bn: pattern.titleBn, en: pattern.titleEn })
                  : t({ bn: 'পরীক্ষার ধরন — বিজ্ঞপ্তি-ভিত্তিক', en: 'Exam pattern — circular-based' })}
              </div>
              {pattern ? (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 14 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '2px solid var(--heading)', color: 'var(--heading)' }}>
                          {t({ bn: 'বিষয়', en: 'Subject' })}
                        </th>
                        <th style={{ textAlign: 'right', padding: '8px 4px', borderBottom: '2px solid var(--heading)', color: 'var(--heading)' }}>
                          {t({ bn: 'নম্বর', en: 'Marks' })}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pattern.rows.map((r) => (
                        <tr key={r.subjectEn}>
                          <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
                            {t({ bn: r.subjectBn, en: r.subjectEn })}
                          </td>
                          <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--line)', color: 'var(--heading)', textAlign: 'right', fontWeight: 700 }}>
                            {r.marks}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: '8px 4px', color: 'var(--heading)', fontWeight: 700 }}>
                          {t({ bn: pattern.totalBn, en: pattern.totalEn })}
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', color: 'var(--muted)', fontWeight: 600 }}>
                          {t({ bn: pattern.timeBn, en: pattern.timeEn })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ margin: '12px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: pattern.negativeBn, en: pattern.negativeEn })}
                  </p>
                  {pattern.noteBn ? (
                    <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: pattern.noteBn, en: pattern.noteEn ?? '' })}
                    </p>
                  ) : null}
                </>
              ) : (
                <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
                  {t({
                    bn: 'এই পরীক্ষার নম্বর, সময় ও ধাপ প্রতিটি বিজ্ঞপ্তিতে বদলাতে পারে — এখানে কোনো ধরন লেখা হয়নি। প্রতিটি পদের ধরন তার বিজ্ঞপ্তি থেকে যাচাই করে লেখা হবে।',
                    en: 'This exam’s marks, time and stages change with every circular — no pattern is written here. Each post’s pattern will be written after verification from its circular.',
                  })}
                </p>
              )}
              <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {t({
                  bn: 'উৎস: চাকরির পরীক্ষা বিশ্লেষণ, ২১ নভেম্বর ২০২৬। সর্বশেষ বিজ্ঞপ্তি দিয়ে পুনঃযাচাই করুন।',
                  en: 'Source: job exam analysis, 21 November 2026. Verify against the latest circular.',
                })}
              </p>
            </Card>
          </Reveal>

          {/* The 7 "100% preparation" elements — no Coming Soon chips
              (23 Nov 2026, AdSense cleanup). Viva is live since Step 16
              (reading pages); BCS English practice is live (the MCQ Bank
              card links to /jobs/bcs/practice/english, scoped to English
              only); the mock card links to the mocks tab once a full mock
              is published; syllabus coverage links to the subjects tab
              where a verified subject list exists. The rest carry an
              honest "not running yet" line — never a live claim. */}
          <Reveal>
            <h2 className="ev-section-h2">{t({ bn: 'প্রস্তুতির ৭টি উপাদান', en: 'The 7 elements of preparation' })}</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
            {JOB_ELEMENTS.map((el, i) => (
              <Reveal key={el.bn} delayMs={Math.min(i, 5) * 60}>
                <Card>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>{t(el)}</div>
                  <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: el.descBn, en: el.descEn })}
                  </p>
                  {el.bn === 'ভাইভা প্রস্তুতি' ? (
                    <p style={{ margin: 0 }}>
                      <LinkButton to="/jobs/viva" variant="accent">
                        {t({ bn: 'ভাইভা প্রস্তুতি পড়ুন →', en: 'Read viva preparation →' })}
                      </LinkButton>
                    </p>
                  ) : el.bn === 'সিলেবাস কভারেজ' && subjects.length > 0 ? (
                    <p style={{ margin: 0 }}>
                      <Link to={tabHref('subjects')} style={{ fontWeight: 600 }}>
                        {t({ bn: 'বিষয় তালিকা দেখুন →', en: 'See the subject list →' })}
                      </Link>
                    </p>
                  ) : el.bn === 'টপিকভিত্তিক MCQ ব্যাংক' && def.slug === 'bcs' ? (
                    <>
                      <p style={{ margin: 0 }}>
                        <LinkButton to="/jobs/bcs/practice/english" variant="accent">
                          {t({ bn: 'BCS English অনুশীলন দেখুন →', en: 'See BCS English practice →' })}
                        </LinkButton>
                      </p>
                      <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                        {t({ bn: 'আপাতত শুধু BCS English — Grammar, Vocabulary, Reading।', en: 'BCS English only for now — Grammar, Vocabulary, Reading.' })}
                      </p>
                    </>
                  ) : el.bn === 'পূর্ণাঙ্গ মক টেস্ট' && publishedMocks !== null && publishedMocks.length > 0 ? (
                    <p style={{ margin: 0 }}>
                      <Link to={tabHref('mocks')} style={{ fontWeight: 600 }}>
                        {t({ bn: 'মক টেস্ট দেখুন →', en: 'See mock tests →' })}
                      </Link>
                    </p>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
                      {t({ bn: 'এখনো চালু হয়নি — চালু হলে এখানেই পাবেন।', en: 'Not running yet — you will find it here once it runs.' })}
                    </p>
                  )}
                  {el.bn === 'ভাইভা প্রস্তুতি' ? (
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      {t({ bn: 'প্রস্তুতির উপকরণ — অনলাইন পরীক্ষা নয়।', en: 'Preparation material — not an online exam.' })}
                    </p>
                  ) : null}
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <Card>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'এই পরীক্ষার সিলেবাস, অনুশীলন ও মক টেস্ট তৈরি হচ্ছে — চালু হলে এখানেই পাবেন। এখানে "পাশ করবেন / চাকরি পাবেন" — এমন কোনো গ্যারান্টি দেওয়া হয় না।',
                  en: 'This exam’s syllabus, practice and mock tests are being prepared — you will find them here once they run. No "you will pass / you will get the job" guarantee is given here.',
                })}
              </p>
              <p style={{ margin: '12px 0 0' }}>
                <LinkButton to="/jobs/common" variant="accent">
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </LinkButton>
              </p>
            </Card>
          </Reveal>
        </>
        )
      ) : !user && (activeTab === 'practice' || activeTab === 'mocks' || activeTab === 'results' || activeTab === 'progress') ? (
        // Exam data lives behind sign-in (auth-gating, live since
        // 22 Nov 2026): guests see the login wall here, never the
        // empty state — so the moment practice/mocks ship, guests
        // cannot reach them through these tabs.
        <LoginWall kind="exam" />
      ) : activeTab === 'practice' ? (
        <JobPracticeTab def={def} />
      ) : activeTab === 'mocks' ? (
        <JobMockTab def={def} />
      ) : activeTab === 'subjects' && (subjects.length > 0 || def.slug === 'it-professional') ? (
        <JobSubjectsTab def={def} />
      ) : activeTab === 'results' ? (
        <JobHubResultsTab def={def} />
      ) : activeTab === 'previous' ? (
        // Previous tab (design §3.1/§4.5): the existing TAB_EMPTY
        // copy, reused verbatim, plus the Level C analysis panel —
        // every exam is at Level C at 0 verified previous questions.
        <>
          <Reveal>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                {t({ bn: TAB_EMPTY.previous.bn, en: TAB_EMPTY.previous.en })}
              </div>
              <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: TAB_EMPTY.previous.noteBn, en: TAB_EMPTY.previous.noteEn })}
              </p>
              <p style={{ margin: 0 }}>
                <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                  {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
                </Link>
              </p>
            </Card>
          </Reveal>
          <JobPreviousAnalysis examSlug={def.slug} />
        </>
      ) : (
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: TAB_EMPTY[activeTab].bn, en: TAB_EMPTY[activeTab].en })}
            </div>
            <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: TAB_EMPTY[activeTab].noteBn, en: TAB_EMPTY[activeTab].noteEn })}
            </p>
            <p style={{ margin: 0 }}>
              <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
              </Link>
            </p>
          </Card>
        </Reveal>
      )}
    </PageShell>
  );
}
