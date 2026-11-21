// Eduvelto — job exam hub (master plan B-1.3, structure only).
//
// One hub per exam: /jobs/:exam with 8 tabs (Home, Subjects, Practice,
// Mock Tests, Previous Questions, Results, Progress, Current Affairs —
// design plan §1.4, same pattern as the class dashboards).
//
// STRUCTURE ONLY: the Home tab shows the exam's identity (recruiting
// body, stages, official-site link) and the 7 "100% preparation"
// elements as Coming Soon. Every content tab shows an honest empty
// state — NO syllabus tables (B-2.1), NO questions (B-2.2), NO mocks
// (B-2.3), NO previous questions (B-6.1) until teacher review.
// Marks, times, age limits and fees are never written here — they
// change with every circular; the hub links to the official site.
// No ads on this page: the hub is all practice / exam / result space
// (design plan §1.4).

import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, Chip, LinkButton, Reveal } from '../components/ui';
import { useLanguage, T } from '../i18n/LanguageContext';
import {
  JOB_ELEMENTS,
  JOB_TABS,
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
  const { exam = '', tab } = useParams<{ exam: string; tab?: string }>();
  const def = jobExamBySlug(exam);
  const activeTab: JobTabSlug = isJobTabSlug(tab) ? tab : 'home';

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
                color: active ? def.accentDeep : '#68747B',
                borderBottomColor: active ? def.accent : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              <T bn={tb.bn} en={tb.en} />
            </Link>
          );
        })}
      </nav>

      {activeTab === 'home' ? (
        <>
          {/* Exam identity — official source, never hard-coded numbers. */}
          <Reveal>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
                {t({ bn: 'পরীক্ষা সম্পর্কে', en: 'About this exam' })}
              </div>
              <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
                {t({
                  bn: 'নম্বর, সময়, বয়সসীমা ও ফি প্রতিটি বিজ্ঞপ্তিতে বদলাতে পারে — এখানে স্থায়ী সংখ্যা লেখা হয় না। সর্বশেষ বিজ্ঞপ্তি অফিসিয়াল সাইটে দেখুন।',
                  en: 'Marks, time, age limit and fees change with every circular — no fixed numbers are written here. See the latest circular on the official site.',
                })}
              </p>
              <p style={{ margin: '12px 0 0' }}>
                <a href={def.officialUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                  {t({ bn: 'সর্বশেষ বিজ্ঞপ্তি দেখুন →', en: 'See the latest circular →' })}
                </a>
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
                  <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{t(el)}</div>
                  <p style={{ margin: '6px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                    {t({ bn: el.descBn, en: el.descEn })}
                  </p>
                  <Chip tone="gold">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
                  {el.bn === 'ভাইভা প্রস্তুতি' ? (
                    <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 13 }}>
                      {t({ bn: 'প্রস্তুতির উপকরণ — অনলাইন পরীক্ষা নয়।', en: 'Preparation material — not an online exam.' })}
                    </p>
                  ) : null}
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <Card>
              <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
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
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              {t({ bn: TAB_EMPTY[activeTab].bn, en: TAB_EMPTY[activeTab].en })}
            </div>
            <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
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
