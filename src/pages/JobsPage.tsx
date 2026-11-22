// Eduvelto — Job Preparation index (master plan B-1.3, structure only).
//
// /jobs: the section's front door. Hero + exam cards grouped by the 10
// categories (Step 5 — Step 2 §0.4/§2.1; was tier-grouped before) +
// the common-preparation card + how to start. No question counts, no
// mock counts — no content is published yet. Tier 2/3 cards honestly
// say "Coming soon".

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import { CommonPrepCard, JobCategoryGroups, JobNonAffiliationNote } from '../components/JobCards';
import JobModeSwitch from '../components/JobModeSwitch';
import JobOnboarding from '../components/JobOnboarding';
import { useLanguage } from '../i18n/LanguageContext';

export default function JobsPage() {
  const { t } = useLanguage();
  // Re-open the first-time mode-choice screen on demand (Step 2 §1.8:
  // reachable again from /jobs after it was dismissed once).
  const [showOnboarding, setShowOnboarding] = useState(false);
  const grid: React.CSSProperties = {
    display: 'grid',
    // auto-fit: the single common-preparation card fills its row.
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 12,
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
            bn: 'চাকরির পরীক্ষার সিলেবাস, MCQ ব্যাংক, মক টেস্ট, বিগত প্রশ্ন ও ভাইভা প্রস্তুতি — সব এক জায়গায়। কনটেন্ট যাচাইকৃত শিক্ষকের যাচাইয়ের পর প্রকাশিত হবে।',
            en: 'Syllabus, MCQ bank, mock tests, previous questions and viva preparation for job exams — all in one place. Content is published only after verified-teacher review.',
          })}
        </p>
      </section>

      {/* Non-affiliation (Step 5): Eduvelto is not affiliated with any
          recruiting body — verify in the official circular. */}
      <JobNonAffiliationNote />

      {/* First-time mode choice (Step 2 §1.8, Step 4): shown once to
          signed-in users who have not seen it; never blocks the page. */}
      <JobOnboarding forceOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Preparation mode — Beginner / Advanced, switchable any time
          (owner decision 22 Nov 2026). Stored on the user's own profile
          when signed in, localStorage fallback when signed out. */}
      <div style={{ margin: '0 0 20px' }}>
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
      </div>

      <p style={{ margin: '0 0 20px' }}>
        <LinkButton to="/jobs/dashboard" variant="accent">
          {t({ bn: 'আমার চাকরির ড্যাশবোর্ড →', en: 'My Job Dashboard →' })}
        </LinkButton>
      </p>

      {/* Step 5 — exam cards grouped by the 10 categories (Step 2
          §0.4/§2.1), not by tier. Same groups as the homepage Jobs
          section (JobCategoryGroups, one source of truth). */}
      <JobCategoryGroups />

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
