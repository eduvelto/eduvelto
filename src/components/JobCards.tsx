// Eduvelto — Job Preparation cards (master plan B-1.3, structure only).
//
// One card per job exam (same visual language as the class cards:
// colour identity, inline SVG icon only — no photos, no paid assets —
// exam name, recruiting body, exam stages). Tier 1 cards get a
// "Start preparation" button; Tier 2/3 cards carry an honest
// "Coming soon" chip and a "View structure" button — the hub exists
// as structure, but no content is ready yet, so nothing is shown as
// working. The common-preparation card links to /jobs/common.
//
// HONESTY: no question counts, no mock counts, no "most popular"
// badge — no usage data exists and no content is published yet.

import { Link } from 'react-router-dom';
import { Reveal } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import { JOB_EXAMS, type JobExamDef } from '../lib/jobExams';

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
  // Tier 1 hubs have their structure ready to explore; Tier 2/3 hubs
  // exist as structure too, but their content is not ready — the chip
  // says so plainly instead of a fake "start" promise.
  const tier1 = def.tier === 1;
  return (
    <Reveal delayMs={delayMs}>
      <Link
        to={`/jobs/${def.slug}`}
        className="ev-class-card"
        style={{ background: def.accent, textDecoration: 'none' }}
        aria-label={t({ bn: `${def.bn}. ${tier1 ? 'প্রস্তুতি শুরু করুন' : 'শীঘ্রই আসছে'}`, en: `${def.en}. ${tier1 ? 'Start preparation' : 'Coming soon'}` })}
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
          {!tier1 ? (
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
          ) : null}
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
            {tier1
              ? t({ bn: 'প্রস্তুতি শুরু করুন →', en: 'Start preparation →' })
              : t({ bn: 'কাঠামো দেখুন →', en: 'View structure →' })}
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
 * Tier 1 first (BCS, Bank, Primary Teacher), then Tier 2 (NTRCA,
 * DGFood, BPSC Non-Cadre), then Tier 3 (CAG, BFSA, Others), then the
 * common-preparation card.
 */
export function JobsSection() {
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
    <section id="jobs" style={{ scrollMarginTop: 76 }}>
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'চাকরির প্রস্তুতি', en: 'Job Preparation' })}</h2>
      </Reveal>
      <p style={{ color: '#57616A', margin: '-8px 0 14px', fontSize: 14 }}>
        {t({ bn: 'সরকারি চাকরির পরীক্ষার প্রস্তুতি — সিলেবাস, MCQ ব্যাংক, মক টেস্ট ও ভাইভা প্রস্তুতি এক জায়গায়। কনটেন্ট শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।', en: 'Preparation for government job exams — syllabus, MCQ bank, mock tests and viva preparation in one place. Content is published only after teacher review.' })}
      </p>
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
    </section>
  );
}
