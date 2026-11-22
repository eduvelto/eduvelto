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
// "verify against the latest circular" caveat) and the 7 "100%
// preparation" elements as Coming Soon. Every content tab shows an
// honest empty state — NO syllabus tables (B-2.1), NO questions
// (B-2.2), NO mocks (B-2.3), NO previous questions (B-6.1) until
// teacher review. Age limits, fees and exam dates are never written
// here — they change with every circular. BCS viva marks are never
// written (200 vs 100 disputed); NTRCA 19th pattern is never written.
// No ads on this page: the hub is all practice / exam / result space
// (design plan §1.4).

import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal } from '../components/ui';
import { JobNonAffiliationNote } from '../components/JobCards';
import JobModeSwitch from '../components/JobModeSwitch';
import { useLanguage, T } from '../i18n/LanguageContext';
import { useJobMode } from '../lib/jobMode';
import {
  EXAM_PATTERNS,
  JOB_ELEMENTS,
  JOB_TABS,
  WEEKLY_MOCK_CYCLE,
  isJobTabSlug,
  jobExamBySlug,
  type JobTabSlug,
} from '../lib/jobExams';

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
    noteBn: 'টপিকভিত্তিক MCQ (উত্তর ও ব্যাখ্যাসহ) শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।',
    noteEn: 'Topic-wise MCQs (with answer and explanation) will be published after teacher review.',
  },
  mocks: {
    bn: 'মক টেস্ট তৈরি হচ্ছে',
    en: 'Mock tests are being prepared',
    noteBn: 'প্রশ্ন ব্যাংক প্রস্তুত হলে আসল ধরনে (নম্বর, সময়, নেগেটিভ মার্কিংসহ) মক দেওয়া যাবে।',
    noteEn: 'Once the question bank is ready, mocks will run in the real pattern (marks, time, negative marking).',
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

export default function JobHubPage() {
  const { t } = useLanguage();
  const { mode } = useJobMode();
  const { exam = '', tab } = useParams<{ exam: string; tab?: string }>();
  const def = jobExamBySlug(exam);
  const activeTab: JobTabSlug = isJobTabSlug(tab) ? tab : 'home';
  const pattern = def ? EXAM_PATTERNS[def.slug] : undefined;

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
          <h2
            style={{
              fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
              fontSize: 26,
              lineHeight: 1.3,
              margin: '0 0 4px',
              color: '#fff',
            }}
          >
            {t({ bn: def.fullBn, en: def.fullEn })}
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>
            {t({ bn: def.orgBn, en: def.orgEn })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: 600 }}>
            {t({ bn: def.stepsBn, en: def.stepsEn })}
          </p>
        </div>
        <p style={{ margin: '12px 0 0' }}>
          <span className="ev-class-hero-coming">{t({ bn: 'কনটেন্ট তৈরি হচ্ছে', en: 'Content in preparation' })}</span>
        </p>
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

      {activeTab === 'home' ? (
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
                    {t({ bn: 'সর্বশেষ বিজ্ঞপ্তি দেখুন →', en: 'See the latest circular →' })}
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
              2026). STRUCTURE ONLY: every practice/mock entry below is
              an honest empty state — 0 questions exist in the database,
              so nothing here pretends a test can be taken yet. */}
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
                <h3 className="ev-section-h2">{t({ bn: 'ধাপে ধাপে শুরু করুন', en: 'Start step by step' })}</h3>
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
                      {t({ bn: 'বেসিক প্রশ্ন (উত্তর ও ব্যাখ্যাসহ) শিক্ষক যাচাইয়ের পর এখানে আসবে — এখনো কোনো প্রশ্ন তৈরি হয়নি।', en: 'Basic questions (with answer and explanation) will come here after teacher review — no questions exist yet.' })}
                    </p>
                    <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
                  </Card>
                </Reveal>
              </div>
            </>
          ) : (
            <>
              {/* Timed-mock entry — real pattern time + negative marking
                  where verified; circular-based note otherwise. No mock
                  can run yet: the mocks tab shows the honest empty state. */}
              <Reveal>
                <h3 className="ev-section-h2">{t({ bn: 'সময়ভিত্তিক প্রস্তুতি', en: 'Timed preparation' })}</h3>
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
                    <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'এখনো কোনো মক তৈরি হয়নি — প্রশ্ন ব্যাংক প্রস্তুত হলে আসল ধরনে মক দেওয়া যাবে।', en: 'No mock exists yet — once the question bank is ready, mocks will run in the real pattern.' })}
                    </p>
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
                    <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'মডেল টেস্ট এখনো তৈরি হয়নি।', en: 'No model test has been prepared yet.' })}
                    </p>
                    <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
                  </Card>
                </Reveal>
                <Reveal delayMs={160}>
                  <Card>
                    <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                      {t({ bn: 'প্রতিযোগিতামূলক প্রস্তুতি', en: 'Competitive preparation' })}
                    </div>
                    <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {t({ bn: 'প্রতি সপ্তাহে ১টি পূর্ণ মক — চক্রাকারে:', en: 'One full mock every week — rotating:' })}
                    </p>
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

          {/* The 7 "100% preparation" elements — all Coming Soon for now. */}
          <Reveal>
            <h3 className="ev-section-h2">{t({ bn: '১০০% প্রস্তুতির ৭টি উপাদান', en: 'The 7 elements of 100% preparation' })}</h3>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
            {JOB_ELEMENTS.map((el, i) => (
              <Reveal key={el.bn} delayMs={Math.min(i, 5) * 60}>
                <Card>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>{t(el)}</div>
                  <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: el.descBn, en: el.descEn })}
                  </p>
                  <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
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
                  bn: 'এই পরীক্ষার সিলেবাস, প্রশ্ন ও মক টেস্ট এখন তৈরি হচ্ছে — যাচাইকৃত শিক্ষক যাচাই করলে তবেই প্রকাশিত হবে। এখানে "পাশ করবেন / চাকরি পাবেন" — এমন কোনো গ্যারান্টি দেওয়া হয় না।',
                  en: 'This exam’s syllabus, questions and mock tests are being prepared — they will be published only after verified-teacher review. No "you will pass / you will get the job" guarantee is given here.',
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
