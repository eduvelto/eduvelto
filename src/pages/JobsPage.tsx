// Eduvelto — Job Preparation index (master plan B-1.3, structure only).
//
// /jobs: the section's front door. Hero + exam cards grouped by the 10
// categories (Step 5 — Step 2 §0.4/§2.1; was tier-grouped before) +
// the common-preparation card + how to start. No question counts, no
// mock counts — the live hub has no practice UI yet (the first verified
// bank batch — 35 BCS English questions — is served once practice
// ships). Tier 2/3 cards honestly say "Coming soon".

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import { CommonPrepCard, JobCategoryGroups, JobNonAffiliationNote } from '../components/JobCards';
import JobModeSwitch from '../components/JobModeSwitch';
import JobOnboarding from '../components/JobOnboarding';
import SuggestionPdfCard from '../components/SuggestionPdfCard';
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
        <h1
          style={{
            fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
            fontSize: 26,
            lineHeight: 1.3,
            margin: '0 0 4px',
            color: '#fff',
          }}
        >
          {t({ bn: 'চাকরির প্রস্তুতি — এক জায়গায়', en: 'Job Preparation — in one place' })}
        </h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.7 }}>
          {t({
            bn: 'চাকরির পরীক্ষার সিলেবাস, MCQ ব্যাংক, মক টেস্ট, বিগত প্রশ্ন ও ভাইভা প্রস্তুতি — সব এক জায়গায়।',
            en: 'Syllabus, MCQ bank, mock tests, previous questions and viva preparation for job exams — all in one place.',
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
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--teal-text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
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

      {/* Job & Admission Prep (owner order 28 Nov 2026, 10:23): the
          free quiz IS the competition engine (10 unique shuffled
          questions, timer, instant result + certificate) — linked
          here alongside the Recent & Most Repeated collection and
          the syllabus-based mock engine. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
            {t({ bn: 'ফ্রি কুইজ প্রতিযোগিতা', en: 'Free Quiz Competition' })}
          </div>
          <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: '১০টি যাচাইকৃত প্রশ্ন, ৫ মিনিটের টাইমার, তাৎক্ষণিক ফল ও সার্টিফিকেট — লগইন ছাড়াই।', en: '10 verified questions, a 5-minute timer, instant results and a certificate — no login needed.' })}
          </p>
          <p style={{ margin: 0 }}>
            <LinkButton to="/free-quiz" variant="primary">
              {t({ bn: 'কুইজ খেলুন →', en: 'Play the quiz →' })}
            </LinkButton>
          </p>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
            {t({ bn: 'সাম্প্রতিক ও বারবার আসা প্রশ্ন', en: 'Recent & Most Repeated Questions' })}
          </div>
          <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: '৩৫টি যাচাইকৃত বিসিএস ইংরেজি প্রশ্ন — উত্তর ও ব্যাখ্যাসহ, বিষয় অনুযায়ী।', en: '35 verified BCS English questions — with answers and explanations, by topic.' })}
          </p>
          <p style={{ margin: 0 }}>
            <LinkButton to="/jobs/recent-repeated" variant="accent">
              {t({ bn: 'প্রশ্ন দেখুন →', en: 'See the questions →' })}
            </LinkButton>
          </p>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
            {t({ bn: 'সিলেবাস-ভিত্তিক মক টেস্ট', en: 'Syllabus-Based Mock Test' })}
          </div>
          <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'অফিসিয়াল ধরন, আসল সময় ও নেগেটিভ মার্কিং — শুধু যাচাইকৃত প্রশ্ন দিয়ে।', en: 'Official pattern, real timing and negative marking — verified questions only.' })}
          </p>
          <p style={{ margin: 0 }}>
            <LinkButton to="/jobs/syllabus-mock" variant="accent">
              {t({ bn: 'মক দিন →', en: 'Take the mock →' })}
            </LinkButton>
          </p>
        </Card>
      </div>

      {/* Phase 3 (25 Nov 2026): ৳149 suggestion-PDF card — UI-only
          until verified content exists (sales gate in lib/orders.ts). */}
      <SuggestionPdfCard />

      {/* Step 5 — exam cards grouped by the 10 categories (Step 2
          §0.4/§2.1), not by tier. Same groups as the homepage Jobs
          section (JobCategoryGroups, one source of truth). */}
      <JobCategoryGroups />

      <div style={grid}>
        <CommonPrepCard />
      </div>

      {/* Step 16 — viva / career / CV reading pages (reading material
          only; no quiz, mock, scoring or simulator). */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'ভাইভা, ক্যারিয়ার ও CV', en: 'Viva, Career & CV' })}</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'ভাইভা ও ইন্টারভিউ', en: 'Viva & Interview' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: '৬টি পাঠ — নিজের পরিচয়, সাধারণ প্রশ্ন, আচরণ ও শেষ প্রস্তুতি।', en: '6 lessons — self-introduction, common questions, conduct, and final preparation.' })}
            </p>
            <p style={{ margin: 0 }}>
              <LinkButton to="/jobs/viva" variant="accent">
                {t({ bn: 'পড়ুন →', en: 'Read →' })}
              </LinkButton>
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={60}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'ক্যারিয়ার গাইডলাইন', en: 'Career Guidance' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: '৫টি পাঠ — কোন পথে এগোবেন, দক্ষতা তৈরি, চাকরি খোঁজা ও আবেদন।', en: '5 lessons — which path to take, building skills, finding jobs, and applying.' })}
            </p>
            <p style={{ margin: 0 }}>
              <LinkButton to="/jobs/career" variant="accent">
                {t({ bn: 'পড়ুন →', en: 'Read →' })}
              </LinkButton>
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={120}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'সিভি ও রিজিউমে', en: 'CV & Resume' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: '৪টি পাঠ — সিভির কাঠামো, অভিজ্ঞতা লেখা, সাধারণ ভুল ও শেষ যাচাই।', en: '4 lessons — CV structure, writing experience, common mistakes, and the final check.' })}
            </p>
            <p style={{ margin: 0 }}>
              <LinkButton to="/jobs/cv" variant="accent">
                {t({ bn: 'পড়ুন →', en: 'Read →' })}
              </LinkButton>
            </p>
          </Card>
        </Reveal>
      </div>
      <p style={{ margin: '-12px 0 24px', color: 'var(--muted-ivory)', fontSize: 13 }}>
        {t({
          bn: 'সাধারণ প্রস্তুতিমূলক নির্দেশনা — অফিসিয়াল সিলেবাস, প্রশ্নপ্যাটার্ন বা বিজ্ঞপ্তির বিকল্প নয়।',
          en: 'General preparatory guidance — not a substitute for an official syllabus, question pattern, or circular.',
        })}
      </p>

      {/* How to start — honest about the state of the section. */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'কীভাবে শুরু করবেন', en: 'How to start' })}</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Reveal delayMs={0}>
          <Card>
            <span className="ev-step-num" aria-hidden="true">{t({ bn: '১', en: '1' })}</span>
            <div style={{ fontWeight: 700, color: 'var(--heading)', marginTop: 10 }}>
              {t({ bn: 'পরীক্ষা বেছে নিন', en: 'Pick your exam' })}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: 'যে পরীক্ষার প্রস্তুতি নিতে চান, তার কার্ডে চাপুন।', en: 'Tap the card of the exam you want to prepare for.' })}
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={80}>
          <Card>
            <span className="ev-step-num" aria-hidden="true">{t({ bn: '২', en: '2' })}</span>
            <div style={{ fontWeight: 700, color: 'var(--heading)', marginTop: 10 }}>
              {t({ bn: 'কাঠামো দেখুন', en: 'See the structure' })}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: 'প্রতিটি পরীক্ষার হাবে সিলেবাস, অনুশীলন, মক টেস্ট ও ভাইভা প্রস্তুতি দেখুন।', en: 'Each exam hub shows the syllabus, practice, mock tests and viva preparation.' })}
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={160}>
          <Card>
            <span className="ev-step-num" aria-hidden="true">{t({ bn: '৩', en: '3' })}</span>
            <div style={{ fontWeight: 700, color: 'var(--heading)', marginTop: 10 }}>
              {t({ bn: 'যাচাই করে প্রকাশ', en: 'Reviewed, then published' })}
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              {t({ bn: 'সিলেবাস, প্রশ্ন ও মক টেস্ট যাচাই করে প্রকাশ করা হয় — প্রকাশিত উপকরণ এখানেই অনুশীলন করতে পারবেন।', en: 'Syllabus, questions and mock tests are published after review — you can practise the published material right here.' })}
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
