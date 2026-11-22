// Eduvelto — National University NoticeCard (NU-5, 22 Nov 2026;
// design doc §10.1 — the notice's 10 fields, NU form).
//
// One verified notice exists today (circular 20/11/2025). Field 10
// (exam date) is ABSENT by design: the circular has no exam date, so
// the row does not render at all — never an empty "শীঘ্রই" row.
// Field 4 shows the closed window with a grey "আবেদন শেষ" chip
// (§10.2: past deadlines are history, never "X days left").

import { useLanguage } from '../i18n/LanguageContext';
import type { NuVerifiedNotice } from '../lib/nuStructure';
import { Card, Chip } from './ui';

export default function NuNoticeCard(props: { notice: NuVerifiedNotice }) {
  const { t } = useLanguage();
  const n = props.notice;
  return (
    <Card>
      <h3 style={{ marginTop: 0, fontSize: 17, color: 'var(--heading)', lineHeight: 1.5 }}>{n.institutionBn}</h3>
      <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--heading)' }}>{n.titleBn}</p>
      <dl style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: 'var(--ink-soft)' }}>
        <div>
          <dt style={{ display: 'inline', fontWeight: 700 }}>{t({ bn: 'বিজ্ঞপ্তি নম্বর: ', en: 'Notice no.: ' })}</dt>
          <dd style={{ display: 'inline', margin: 0 }}>{n.memoNo}</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 700 }}>{t({ bn: 'প্রকাশ: ', en: 'Published: ' })}</dt>
          <dd style={{ display: 'inline', margin: 0 }}>{n.publishedBn}</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 700 }}>{t({ bn: 'আবেদনের শেষ তারিখ: ', en: 'Application deadline: ' })}</dt>
          <dd style={{ display: 'inline', margin: 0 }}>
            {n.applicationEndBn} <Chip tone="navy">{n.applicationStatusBn}</Chip>
          </dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 700 }}>{t({ bn: 'আবেদন ফি: ', en: 'Application fee: ' })}</dt>
          <dd style={{ display: 'inline', margin: 0 }}>{n.feeBn}</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 700 }}>{t({ bn: 'যোগ্যতার সারাংশ: ', en: 'Eligibility summary: ' })}</dt>
          <dd style={{ display: 'inline', margin: 0 }}>{n.eligibilitySummaryBn}</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', fontWeight: 700 }}>{t({ bn: 'যাচাই: ', en: 'Verification: ' })}</dt>
          <dd style={{ display: 'inline', margin: 0 }}>{n.verifiedBn}</dd>
        </div>
      </dl>
      <p style={{ margin: '12px 0 0', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <a href={n.officialPdfUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
          {t({ bn: 'অফিসিয়াল বিজ্ঞপ্তি দেখুন →', en: 'View the official notice →' })}
        </a>
        <a href={n.officialUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
          {t({ bn: 'ভর্তি-বিষয়ক ওয়েবসাইট →', en: 'Admissions website →' })}
        </a>
      </p>
      <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 13 }}>
        {t({
          bn: 'বিজ্ঞপ্তির কপি সংরক্ষিত আছে — অফিসিয়াল PDF-এর লিংক উপরে। পরীক্ষার তারিখ বিজ্ঞপ্তিতে নেই বলে এখানে কোনো তারিখ লেখা হয়নি।',
          en: 'The notice copy is preserved — the official PDF link is above. No exam date is written here because the circular has none.',
        })}
      </p>
    </Card>
  );
}
