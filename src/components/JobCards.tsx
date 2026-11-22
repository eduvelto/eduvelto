// Eduvelto — Job Preparation cards (master plan B-1.3, structure only).
//
// One card per job exam (same visual language as the class cards:
// colour identity, inline SVG icon only — no photos, no paid assets —
// exam name, recruiting body, exam stages). Every card carries an
// honest "Coming soon" chip and a "View structure" button — no exam
// has runnable practice/mock on live yet, so nothing is shown as
// working. The common-preparation card links to /jobs/common.
//
// HONESTY: no question counts, no mock counts, no "most popular"
// badge — no usage data exists, and the live hub has no practice UI
// yet (the first verified bank batch — 35 BCS English questions —
// sits in the database, served once practice ships).

import { Link } from 'react-router-dom';
import { Reveal } from './ui';
import { T, useLanguage } from '../i18n/LanguageContext';
import { type JobExamDef } from '../lib/jobExams';
import { jobCategoryGroups } from '../lib/jobProfile';

/** Bangla digits for group numbers ("১ · BCS ও BPSC"). */
function bnNum(n: number): string {
  return String(n)
    .split('')
    .map((d) => '০১২৩৪৫৬৭৮৯'[Number(d)])
    .join('');
}

/**
 * Non-affiliation disclaimer (Step 5 — research lesson: explicit
 * non-affiliation). Shown on /jobs and on every hub page. One line,
 * Bangla-first: Eduvelto is not affiliated with any recruiting body.
 */
export function JobNonAffiliationNote() {
  const { t } = useLanguage();
  return (
    <p style={{ margin: '0 0 20px', color: '#57616A', fontSize: 13, lineHeight: 1.7 }}>
      {t({
        bn: 'Eduvelto BPSC, বাংলাদেশ ব্যাংক, DPE বা NTRCA-র সঙ্গে যুক্ত নয়। সর্বশেষ তথ্য সবসময় অফিসিয়াল সাইটের বিজ্ঞপ্তিতে যাচাই করুন।',
        en: 'Eduvelto is not affiliated with BPSC, Bangladesh Bank, DPE or NTRCA. Always verify the latest information in the official circular.',
      })}
    </p>
  );
}

/**
 * The 10 category groups (Step 5 — Step 2 §0.4/§2.1): /jobs and the
 * homepage Jobs section group exam cards BY CATEGORY (1–10), not by
 * tier. Driven by the canonical jobCategoryGroups() — one source of
 * truth; the cards themselves still carry the tier-2/3 "Coming soon"
 * chip. Group headings use the canonical category name with its
 * number ("১ · BCS ও BPSC").
 */
export function JobCategoryGroups() {
  const groups = jobCategoryGroups();
  // auto-fit (not auto-fill): empty tracks collapse, so a group with a
  // single exam (Bank, Primary Teacher, NTRCA…) fills its row instead
  // of leaving a blank area beside one narrow card (22 Nov 2026).
  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 24,
  };
  return (
    <>
      {groups.map((g, gi) => (
        <div key={g.category.slug}>
          <p style={{ color: '#142B3B', margin: '0 0 10px', fontSize: 16, fontWeight: 700 }}>
            <span style={{ color: g.category.accent }}>{bnNum(gi + 1)}</span>
            {' · '}
            <T bn={g.category.bn} en={g.category.en} />
          </p>
          <div style={grid}>
            {g.exams.map((def, i) => (
              <JobCard key={def.slug} def={def} delayMs={Math.min(i, 4) * 60} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** Small line icon per exam (inline SVG, currentColor) — no emoji. */
function ExamIcon({ slug }: { slug: string }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;
  switch (slug) {
    case 'bcs': // briefcase
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'bank': // bank building
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21v-8M9 21v-8M15 21v-8M19 21v-8" />
          <path d="M2 10l10-6 10 6H2z" />
        </svg>
      );
    case 'primary-teacher': // pencil
      return (
        <svg {...common}>
          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          <path d="M15 5l4 4" />
        </svg>
      );
    case 'ntrca': // graduation cap
      return (
        <svg {...common}>
          <path d="M22 10L12 5 2 10l10 5 10-5z" />
          <path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5" />
          <path d="M22 10v6" />
        </svg>
      );
    case 'dgfood': // wheat
      return (
        <svg {...common}>
          <path d="M12 22V8" />
          <path d="M12 8C12 4 9 2 5 2c0 4 3 6 7 6z" />
          <path d="M12 8c0-4 3-6 7-6 0 4-3 6-7 6z" />
          <path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z" />
          <path d="M12 14c0-3 2.5-5 6-5 0 3-2.5 5-6 5z" />
        </svg>
      );
    case 'bpsc-non-cadre': // clipboard
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      );
    case 'cag': // calculator
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8" />
          <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
        </svg>
      );
    case 'bfsa': // shield
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'ministries': // government building
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21v-9M9.5 21v-9M14.5 21v-9M19 21v-9" />
          <path d="M2 12l10-7 10 7H2z" />
          <path d="M12 2v3" />
        </svg>
      );
    case 'defence': // star
      return (
        <svg {...common}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'autonomous': // layers
      return (
        <svg {...common}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'private-ngo': // people
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'it-professional': // laptop
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
          <path d="M9 9h.01M13 9h.01M9 12h6" />
        </svg>
      );
    default: // dots — other govt jobs
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="12" r="2" />
        </svg>
      );
  }
}

export function JobCard({ def, delayMs = 0 }: { def: JobExamDef; delayMs?: number }) {
  const { lang, t } = useLanguage();
  // No exam has runnable practice/mock on live yet, so every card
  // says "View structure" + "Coming soon" instead of a fake "start"
  // promise. Restore "প্রস্তুতি শুরু করুন" per exam once that exam
  // has runnable practice/mock.
  return (
    <Reveal delayMs={delayMs}>
      <Link
        to={`/jobs/${def.slug}`}
        className="ev-class-card"
        style={{ background: def.accent, textDecoration: 'none' }}
        aria-label={t({ bn: `${def.bn}. কাঠামো দেখুন`, en: `${def.en}. View structure` })}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: '#fff' }}>
              {lang === 'bn' ? def.bn : def.en}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {lang === 'bn' ? def.orgBn : def.orgEn}
            </div>
          </div>
          <span
            aria-hidden="true"
            style={{
              flex: 'none',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ExamIcon slug={def.slug} />
          </span>
        </div>
        <p style={{ margin: '14px 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
          {lang === 'bn' ? def.stepsBn : def.stepsEn}
        </p>
        <div style={{ marginTop: 'auto' }}>
          <p style={{ margin: '0 0 10px' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.22)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
            </span>
          </p>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              color: def.accentDeep,
              fontWeight: 700,
              fontSize: 14,
              padding: '9px 16px',
              borderRadius: 999,
              minHeight: 40,
            }}
          >
            {t({ bn: 'কাঠামো দেখুন →', en: 'View structure →' })}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/** Common-preparation card — daily common mock + weekly full mock (/jobs/common). */
export function CommonPrepCard({ delayMs = 0 }: { delayMs?: number }) {
  const { t } = useLanguage();
  return (
    <Reveal delayMs={delayMs}>
      <Link
        to="/jobs/common"
        className="ev-class-card"
        style={{ background: '#8A6100', textDecoration: 'none' }}
        aria-label={t({ bn: 'কমন প্রস্তুতি — প্রতিদিনের কমন মক', en: 'Common preparation — daily common mock' })}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: '#fff' }}>
              {t({ bn: 'কমন প্রস্তুতি', en: 'Common Preparation' })}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {t({ bn: 'সব জব পরীক্ষার কমন টপিক', en: 'Topics common to all job exams' })}
            </div>
          </div>
          <span
            aria-hidden="true"
            style={{
              flex: 'none',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </span>
        </div>
        <p style={{ margin: '14px 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
          {t({ bn: 'প্রতিদিনের ছোট মক + সাপ্তাহিক পূর্ণ মক', en: 'Daily short mock + weekly full mock' })}
        </p>
        <div style={{ marginTop: 'auto' }}>
          <p style={{ margin: '0 0 10px' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.22)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
            </span>
          </p>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              color: '#8A6100',
              fontWeight: 700,
              fontSize: 14,
              padding: '9px 16px',
              borderRadius: 999,
              minHeight: 40,
            }}
          >
            {t({ bn: 'কাঠামো দেখুন →', en: 'View structure →' })}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * The homepage "চাকরির প্রস্তুতি" section — directly AFTER the class
 * cards (design plan §1.3, proposed default for open question §7.1).
 * Step 5: grouped by the 10 categories (same JobCategoryGroups as
 * /jobs), then the common-preparation card.
 */
export function JobsSection() {
  const { t } = useLanguage();
  // auto-fit: the single common-preparation card fills its row (see
  // JobCategoryGroups above — auto-fill left a blank area beside it).
  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 24,
  };
  return (
    <section id="jobs" style={{ scrollMarginTop: 76 }}>
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'চাকরির প্রস্তুতি', en: 'Job Preparation' })}</h2>
      </Reveal>
      <p style={{ color: '#57616A', margin: '-8px 0 14px', fontSize: 14 }}>
        {t({ bn: 'চাকরির পরীক্ষার প্রস্তুতি — সিলেবাস, MCQ ব্যাংক, মক টেস্ট ও ভাইভা প্রস্তুতি এক জায়গায় থাকবে। কনটেন্ট শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।', en: 'Preparation for job exams — syllabus, MCQ bank, mock tests and viva preparation will be in one place. Content is published only after teacher review.' })}
      </p>
      <JobCategoryGroups />
      <div style={grid}>
        <CommonPrepCard />
      </div>
    </section>
  );
}
