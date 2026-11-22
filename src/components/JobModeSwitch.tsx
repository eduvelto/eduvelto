// Eduvelto — Job Preparation mode switch (owner decision 22 Nov 2026).
//
// Segmented Beginner / Advanced toggle, visible on /jobs, on every exam
// hub page and on /jobs/dashboard. The student can switch any time; the
// choice is stored on their own profile doc when signed in (jobMode) and
// in localStorage when signed out (see lib/jobMode.ts). The toggle shows
// a one-line description of the active mode — Beginner: easy
// explanations, basic practice, step by step, no timers; Advanced: hard
// questions, timed exams, full model tests, competitive preparation —
// all coming soon (no live practice/mock yet).

import { useJobMode, type JobMode } from '../lib/jobMode';
import { useLanguage } from '../i18n/LanguageContext';

export const MODE_COPY: Record<JobMode, { bn: string; en: string; descBn: string; descEn: string }> = {
  beginner: {
    bn: 'নতুনদের জন্য',
    en: 'Beginner',
    descBn: 'একেবারে নতুনদের জন্য — সহজ ব্যাখ্যা, বেসিক অনুশীলন, ধাপে ধাপে প্রস্তুতি। কোনো টাইমার বা প্রতিযোগিতা নেই।',
    descEn: 'For brand-new students — easy explanations, basic practice, step-by-step preparation. No timers, no competition.',
  },
  advanced: {
    bn: 'অভিজ্ঞদের জন্য',
    en: 'Advanced',
    descBn: 'অভিজ্ঞ পরীক্ষার্থীদের জন্য — আসছে: কঠিন প্রশ্ন, সময়ভিত্তিক পরীক্ষা, পূর্ণাঙ্গ মডেল টেস্ট ও প্রতিযোগিতামূলক প্রস্তুতি।',
    descEn: 'For experienced candidates — coming soon: hard questions, timed exams, full model tests and competitive preparation.',
  },
};

export default function JobModeSwitch() {
  const { t } = useLanguage();
  const { mode, setMode } = useJobMode();

  return (
    <div>
      <div
        role="group"
        aria-label={t({ bn: 'প্রস্তুতির মোড', en: 'Preparation mode' })}
        style={{
          display: 'inline-flex',
          border: '1px solid var(--teal-text)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {(['beginner', 'advanced'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={active}
              style={{
                padding: '10px 18px',
                minHeight: 44,
                border: 'none',
                background: active ? '#12766E' : 'var(--card)',
                color: active ? '#fff' : 'var(--teal-text)',
                fontWeight: active ? 700 : 500,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
              }}
            >
              {t({ bn: MODE_COPY[m].bn, en: MODE_COPY[m].en })}
            </button>
          );
        })}
      </div>
      <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
        {t({ bn: MODE_COPY[mode].descBn, en: MODE_COPY[mode].descEn })}
      </p>
      <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
        {t({ bn: 'মোড যেকোনো সময় বদলানো যায়।', en: 'You can switch mode any time.' })}
      </p>
    </div>
  );
}
