// Eduvelto — National University admission mode switch (NU-4, 22 Nov 2026;
// design doc §6.3).
//
// Segmented Beginner / Advanced toggle for NU admission. The student
// can switch any time; the choice is stored on their own profile doc
// when signed in (admissionMode — a SEPARATE field from Job's jobMode,
// NU-Q5) and in anonymous localStorage when signed out (see
// lib/nuMode.ts). The toggle shows a one-line description of the
// active mode — Beginner: easy explanations, basic practice, step by
// step, no timers; Advanced: hard questions, timed exams, full model
// tests, competitive preparation. Switching mode NEVER deletes progress
// (design §6.3, BINDING).

import { useAdmissionMode } from '../lib/nuMode';
import type { AdmissionMode } from '../lib/nuProfile';
import { useLanguage } from '../i18n/LanguageContext';

export const NU_MODE_COPY: Record<
  AdmissionMode,
  { bn: string; en: string; descBn: string; descEn: string }
> = {
  beginner: {
    bn: 'শুরু থেকে প্রস্তুতি',
    en: 'Beginner',
    descBn: 'একেবারে নতুনদের জন্য — সহজ ব্যাখ্যা, বেসিক অনুশীলন, ধাপে ধাপে প্রস্তুতি। কোনো টাইমার বা প্রতিযোগিতা নেই।',
    descEn: 'For brand-new students — easy explanations, basic practice, step-by-step preparation. No timers, no competition.',
  },
  advanced: {
    bn: 'প্রতিযোগিতামূলক প্রস্তুতি',
    en: 'Advanced',
    descBn: 'অভিজ্ঞ পরীক্ষার্থীদের জন্য — কঠিন প্রশ্ন, সময়ভিত্তিক পরীক্ষা, পূর্ণাঙ্গ মডেল টেস্ট ও প্রতিযোগিতামূলক প্রস্তুতি।',
    descEn: 'For experienced candidates — hard questions, timed exams, full model tests and competitive preparation.',
  },
};

export default function AdmissionModeSwitch() {
  const { t } = useLanguage();
  const { mode, setMode } = useAdmissionMode();

  return (
    <div>
      <div
        role="group"
        aria-label={t({ bn: 'ভর্তি প্রস্তুতির মোড', en: 'Admission preparation mode' })}
        style={{
          display: 'inline-flex',
          border: '1px solid var(--heading)',
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
                background: active ? '#1E3A5F' : 'var(--card)',
                color: active ? '#fff' : 'var(--heading)',
                fontWeight: active ? 700 : 500,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
              }}
            >
              {t({ bn: NU_MODE_COPY[m].bn, en: NU_MODE_COPY[m].en })}
            </button>
          );
        })}
      </div>
      <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.7 }}>
        {t({ bn: NU_MODE_COPY[mode].descBn, en: NU_MODE_COPY[mode].descEn })}
      </p>
      <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
        {t({ bn: 'মোড যেকোনো সময় বদলানো যায় — অগ্রগতি মুছে যাবে না।', en: 'You can switch mode any time — your progress is kept.' })}
      </p>
    </div>
  );
}
