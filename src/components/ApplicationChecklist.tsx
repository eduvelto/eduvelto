// Eduvelto — National University ApplicationChecklist (NU-5, 22 Nov
// 2026; design doc §5.2 Home tab, §6.7, §10.3).
//
// The application steps for the 2025-26 session, shown with their
// HISTORICAL state: the window CLOSED 31 Dec 2025, the fee deadline
// passed 04 Jan 2026. Nothing here tells the student to apply now —
// there is no open window to apply in. The next cycle's steps appear
// only after the 2026-27 circular is verified (Blocker A). The exam
// date and the Guideline have no dates because neither was announced.
// This is information only: Eduvelto never applies on a student's
// behalf (design §6.7).

import { useLanguage } from '../i18n/LanguageContext';
import { NU_CALENDAR_EVENTS, NU_EXAM_DATE_BN, NU_NEXT_CYCLE_BN, NU_VERIFIED_NOTICE } from '../lib/nuStructure';
import { Card, Chip } from './ui';

const steps: { bn: string; en: string; stateBn: string; stateEn: string; done: boolean }[] = [
  {
    bn: 'অনলাইনে প্রাথমিক আবেদন ফরম পূরণ',
    en: 'Fill in the primary application form online',
    stateBn: 'শেষ: ৩১ ডিসেম্বর ২০২৫ — আবেদন শেষ',
    stateEn: 'Ended: 31 Dec 2025 — application closed',
    done: true,
  },
  {
    bn: 'আবেদন ফি জমা (আবেদনকৃত কলেজে) — ১,০০০/- টাকা',
    en: 'Pay the application fee (at the applied college) — ৳1,000',
    stateBn: 'শেষ: ০৪ জানুয়ারি ২০২৬ — পেরিয়ে গেছে',
    stateEn: 'Ended: 04 Jan 2026 — passed',
    done: true,
  },
  {
    bn: 'কলেজ কর্তৃক আবেদন ফরম নিশ্চয়ন',
    en: 'College confirms the application form',
    stateBn: 'শেষ: ০৫ জানুয়ারি ২০২৬ — পেরিয়ে গেছে',
    stateEn: 'Ended: 05 Jan 2026 — passed',
    done: true,
  },
  {
    bn: 'ভর্তি পরীক্ষার Guideline প্রকাশ (পরীক্ষার ১৫ দিন আগে)',
    en: 'Admission exam Guideline published (15 days before the exam)',
    stateBn: 'এখনো প্রকাশিত হয়নি — পরীক্ষার তারিখ ঘোষণা হলে আসবে',
    stateEn: 'Not published yet — arrives once the exam date is announced',
    done: false,
  },
  {
    bn: 'প্রবেশপত্র ডাউনলোড (পরীক্ষার ৭ দিন আগে থেকে)',
    en: 'Download the admit card (from 7 days before the exam)',
    stateBn: NU_EXAM_DATE_BN,
    stateEn: 'The exam date has not been announced yet — it will come in a separate notice',
    done: false,
  },
];

export default function ApplicationChecklist() {
  const { t } = useLanguage();
  return (
    <Card>
      <h3 style={{ marginTop: 0, fontSize: 18, color: '#142B3B' }}>
        {t({ bn: 'আবেদনের ধাপ — ২০২৫-২০২৬ (ইতিহাস)', en: 'Application steps — 2025-26 (history)' })}
      </h3>
      <p style={{ color: '#444', lineHeight: 1.8, margin: '0 0 12px' }}>
        {t({ bn: NU_NEXT_CYCLE_BN, en: 'The latest verified circular is for the 2025–26 academic year. The new circular has not been verified yet — the information will be updated once the next circular is published.' })}
      </p>
      <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: '#3A444B' }}>
        {steps.map((s) => (
          <li key={s.bn} style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: '#142B3B' }}>{t({ bn: s.bn, en: s.en })}</span>
            <br />
            <span style={{ fontSize: 14, color: '#57616A' }}>{t({ bn: s.stateBn, en: s.stateEn })}</span>{' '}
            <Chip tone={s.done ? 'navy' : 'gold'}>
              {t({ bn: s.done ? 'শেষ' : 'অপেক্ষায়', en: s.done ? 'Done' : 'Waiting' })}
            </Chip>
          </li>
        ))}
      </ol>
      <p style={{ margin: '12px 0 0', color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
        {t({
          bn: `উৎস: ${NU_VERIFIED_NOTICE.memoNo} · ${NU_VERIFIED_NOTICE.publishedBn}। Eduvelto কারো পক্ষে আবেদন করে দেয় না — আবেদন করতে হয় অফিসিয়াল সাইটে (nu.ac.bd/admissions)।`,
          en: `Source: ${NU_VERIFIED_NOTICE.memoNo} · Published: 20 November 2025. Eduvelto never applies on anyone's behalf — applications go through the official site (nu.ac.bd/admissions).`,
        })}
      </p>
      <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 14 }}>
        {t({
          bn: 'নিশ্চিত তারিখের তালিকা:',
          en: 'List of confirmed dates:',
        })}
      </p>
      <ul style={{ margin: '4px 0 0', paddingLeft: 20, lineHeight: 1.9, color: '#3A444B', fontSize: 14 }}>
        {NU_CALENDAR_EVENTS.map((e) => (
          <li key={e.labelBn}>
            {e.labelBn}: {e.dateBn} — {e.stateBn}
          </li>
        ))}
        <li>
          {t({ bn: 'পরীক্ষার তারিখ: কোনো ঘটনা নেই', en: 'Exam date: no event' })} — {NU_EXAM_DATE_BN}
        </li>
      </ul>
    </Card>
  );
}
