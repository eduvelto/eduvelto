// Eduvelto — Admission unit page (owner order 28 Nov 2026, 10:23).
//
// /admissions/<institution>/<unit> — structure only. The unit's
// subjects are NAVIGATION labels; no marks, no timing, no questions
// and no dates are written for any unit, because no unit's pattern
// has been verified against its official circular yet. The page says
// so plainly and points at the official circular, the free quiz and
// the study guides instead of inventing content. (National
// University keeps its own verified hub and has no page here.)

import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { admissionUnitByRoute } from '../lib/jobAdmissionPrep';

export default function AdmissionUnitPage() {
  const { t } = useLanguage();
  const { institution, unit } = useParams<{ institution: string; unit: string }>();
  const found = institution && unit ? admissionUnitByRoute(institution, unit) : null;

  if (!found) {
    return (
      <PageShell titleBn="ভর্তি প্রস্তুতি" titleEn="Admission Preparation" wide>
        <AlertBox tone="info">
          {t({
            bn: 'এই ইউনিটের পাতা এখনো তৈরি হয়নি। ভর্তি প্রস্তুতির তালিকা থেকে একটি প্রতিষ্ঠান বেছে নিন।',
            en: 'This unit’s page is not built yet. Choose an institution from the admission preparation list.',
          })}
        </AlertBox>
        <p style={{ marginTop: 16 }}>
          <Link to="/admissions" style={{ fontWeight: 600 }}>
            {t({ bn: '← ভর্তি প্রস্তুতিতে ফিরুন', en: '← Back to admission preparation' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  const { institution: inst, unit: u } = found;
  return (
    <PageShell titleBn={`${inst.bn} — ${u.bn}`} titleEn={`${inst.en} — ${u.en}`} wide>
      <AlertBox tone="info">
        {t({
          bn: 'এই ইউনিটের সিলেবাস, নম্বর-বণ্টন, সময় ও নেগেটিভ মার্কিং এখনো যাচাই হয়নি — অফিসিয়াল সার্কুলার দেখুন। নিচের বিষয়গুলো শুধু ইউনিটের বিষয়-তালিকা, প্রশ্ন বা নম্বর নয়।',
          en: 'This unit’s syllabus, mark distribution, timing and negative marking are not verified yet — see the official circular. The subjects below are only the unit’s subject list, not questions or marks.',
        })}
      </AlertBox>

      <h2 style={{ fontSize: 19, color: 'var(--heading)', marginTop: 20 }}>
        {t({ bn: 'বিষয়', en: 'Subjects' })}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {u.subjectsBn.map((s, i) => (
          <Chip key={s}>{t({ bn: s, en: u.subjectsEn[i] })}</Chip>
        ))}
      </div>

      <Card style={{ marginTop: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>
          {t({ bn: 'এখন যা করা যায়', en: 'What you can do now' })}
        </h2>
        <p style={{ margin: '0 0 10px', lineHeight: 1.8 }}>
          {t({
            bn: 'যাচাইকৃত প্রশ্ন দিয়ে ফ্রি কুইজ খেলুন, আর সিলেবাস-ভিত্তিক মক ও সাম্প্রতিক প্রশ্ন দেখুন — সবই চাকরির প্রস্তুতির পাতায়।',
            en: 'Play the free quiz with verified questions, and see the syllabus-based mock and recent questions — all on the job preparation pages.',
          })}
        </p>
        <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <LinkButton to="/free-quiz" variant="primary">
            {t({ bn: 'ফ্রি কুইজ প্রতিযোগিতা →', en: 'Free quiz competition →' })}
          </LinkButton>
          <LinkButton to="/jobs/syllabus-mock/bcs" variant="accent">
            {t({ bn: 'সিলেবাস-ভিত্তিক মক →', en: 'Syllabus-based mock →' })}
          </LinkButton>
          <LinkButton to="/jobs/recent-repeated" variant="accent">
            {t({ bn: 'সাম্প্রতিক ও বারবার আসা প্রশ্ন →', en: 'Recent & most repeated questions →' })}
          </LinkButton>
          <LinkButton to="/guides" variant="outline">
            {t({ bn: 'স্টাডি গাইড →', en: 'Study guides →' })}
          </LinkButton>
        </p>
      </Card>

      <p style={{ marginTop: 20 }}>
        <Link to="/admissions" style={{ fontWeight: 600 }}>
          {t({ bn: '← ভর্তি প্রস্তুতিতে ফিরুন', en: '← Back to admission preparation' })}
        </Link>
      </p>
    </PageShell>
  );
}
