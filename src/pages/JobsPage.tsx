// Eduvelto — Job Preparation index (master plan B-1.3, structure only).
//
// /jobs: the section's front door. Hero + exam cards by tier (Tier 1
// first: BCS, Bank, Primary Teacher; Tier 2: NTRCA, DGFood, BPSC
// Non-Cadre; Tier 3: CAG, BFSA, Others) + the common-preparation
// card + how to start. No question counts, no mock counts — no
// content is published yet. Tier 2/3 cards honestly say "Coming soon".

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import { CommonPrepCard, JobCard } from '../components/JobCards';
import { useLanguage } from '../i18n/LanguageContext';
import { JOB_EXAMS } from '../lib/jobExams';

export default function JobsPage() {
  const { t } = useLanguage();
  const tier1 = JOB_EXAMS.filter((e) => e.tier === 1);
  const tier2 = JOB_EXAMS.filter((e) => e.tier === 2);
  const tier3 = JOB_EXAMS.filter((e) => e.tier === 3);
  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 24,
  };
  const groupLabel: React.CSSProperties = {
    color: '#57616A',
    margin: '0 0 10px',
    fontSize: 14,
    fontWeight: 600,
  };

  return (
    <PageShell titleBn="চাকরির প্রস্তুতি" titleEn="Job Preparation" wide hideTitle maxWidth={1240}>
      {/* Hero — teal identity for the Jobs section. */}
      <section
        className="ev-class-hero"
        style={{ background: '#12766E' }}
        aria-label={t({ bn: 'চাকরির প্রস্তুতি', en: 'Job Preparation' })}
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
          {t({ bn: 'চাকরির প্রস্তুতি — এক জায়গায়', en: 'Job Preparation — in one place' })}
        </h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.7 }}>
          {t({
            bn: 'সরকারি চাকরির পরীক্ষার সিলেবাস, MCQ ব্যাংক, মক টেস্ট, বিগত প্রশ্ন ও ভাইভা প্রস্তুতি — সব এক জায়গায়। কনটেন্ট যাচাইকৃত শিক্ষকের যাচাইয়ের পর প্রকাশিত হবে।',
            en: 'Syllabus, MCQ bank, mock tests, previous questions and viva preparation for government job exams — all in one place. Content is published only after verified-teacher review.',
          })}
        </p>
      </section>

      <p style={groupLabel}>{t({ bn: 'প্রধান পরীক্ষা', en: 'Main exams' })}</p>
      <div style={grid}>
        {tier1.map((def, i) => (
          <JobCard key={def.slug} def={def} delayMs={Math.min(i, 4) * 60} />
        ))}
      </div>

      <p style={groupLabel}>{t({ bn: 'আরও পরীক্ষা — কনটেন্ট আসছে', en: 'More exams — content coming' })}</p>
      <div style={grid}>
        {tier2.map((def, i) => (
          <JobCard key={def.slug} def={def} delayMs={Math.min(i, 4) * 60} />
        ))}
        {tier3.map((def, i) => (
          <JobCard key={def.slug} def={def} delayMs={Math.min(i + 3, 4) * 60} />
        ))}
      </div>

      <div style={grid}>
        <CommonPrepCard />
      </div>

      {/* How to start — honest about the state of the section. */}
      <Reveal>
        <h3 className="ev-section-h2">{t({ bn: 'কীভাবে শুরু করবেন', en: 'How to start' })}</h3>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Reveal delayMs={0}>
          <Card>
            <span className="ev-step-num" aria-hidden="true">{t({ bn: '১', en: '1' })}</span>
            <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>
              {t({ bn: 'পরীক্ষা বেছে নিন', en: 'Pick your exam' })}
            </div>
            <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
              {t({ bn: 'যে পরীক্ষার প্রস্তুতি নিতে চান, তার কার্ডে চাপুন।', en: 'Tap the card of the exam you want to prepare for.' })}
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={80}>
          <Card>
            <span className="ev-step-num" aria-hidden="true">{t({ bn: '২', en: '2' })}</span>
            <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>
              {t({ bn: 'কাঠামো দেখুন', en: 'See the structure' })}
            </div>
            <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
              {t({ bn: 'প্রতিটি পরীক্ষার হাবে সিলেবাস, অনুশীলন, মক টেস্ট ও ভাইভা প্রস্তুতির জায়গা দেখুন।', en: 'Each exam hub shows where the syllabus, practice, mock tests and viva preparation will live.' })}
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={160}>
          <Card>
            <span className="ev-step-num" aria-hidden="true">{t({ bn: '৩', en: '3' })}</span>
            <div style={{ fontWeight: 700, color: '#142B3B', marginTop: 10 }}>
              {t({ bn: 'কনটেন্ট আসছে', en: 'Content is coming' })}
            </div>
            <p style={{ margin: '6px 0 0', color: '#68747B', fontSize: 14 }}>
              {t({ bn: 'সিলেবাস, প্রশ্ন ও মক টেস্ট শিক্ষক যাচাইয়ের পর প্রকাশিত হবে — তখন এখানেই অনুশীলন করতে পারবেন।', en: 'Syllabus, questions and mock tests will be published after teacher review — then you can practise right here.' })}
            </p>
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
          <p style={{ margin: '12px 0 0' }}>
            <Link to="/jobs/common" style={{ fontWeight: 600 }}>
              {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
            </Link>
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
