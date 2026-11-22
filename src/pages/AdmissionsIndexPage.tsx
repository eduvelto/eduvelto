// Eduvelto — Admission Preparation index (NU-5, 22 Nov 2026; design
// doc §5.1).
//
// /admissions is now the hub INDEX, not Coming Soon: National
// University first (the owner's priority — with the "অগ্রাধিকার"
// badge), the other institutions as honest "শীঘ্রই আসছে" cards. No
// card carries a question count — content is still being built, so
// the NU card says "কনটেন্ট তৈরি হচ্ছে" instead of a number. The
// dashboard button goes to /admissions/dashboard (NU-Q6, final).

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Chip, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import AdmissionModeSwitch from '../components/AdmissionModeSwitch';
import { NU_DASHBOARD_ROUTE, NU_HUB_ROUTE } from '../lib/nuStructure';

const COMING_SOON_INSTITUTIONS: { bn: string; en: string }[] = [
  { bn: 'ঢাকা বিশ্ববিদ্যালয়', en: 'University of Dhaka' },
  { bn: 'GST (গুচ্ছ)', en: 'GST (Cluster)' },
  { bn: 'মেডিকেল ও ডেন্টাল', en: 'Medical and Dental' },
  { bn: 'ইঞ্জিনিয়ারিং', en: 'Engineering' },
  { bn: 'কৃষি', en: 'Agriculture' },
  { bn: 'নার্সিং', en: 'Nursing' },
  { bn: 'প্রাইভেট বিশ্ববিদ্যালয়', en: 'Private universities' },
];

export default function AdmissionsIndexPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="ভর্তি প্রস্তুতি" titleEn="Admission Preparation" wide hideHomeLink>
      <div
        style={{
          background: '#1E3A5F',
          color: '#fff',
          borderRadius: 12,
          padding: '24px 20px',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>
          {t({ bn: 'ভর্তি প্রস্তুতি — এক জায়গায়', en: 'Admission preparation — in one place' })}
        </h2>
        <p style={{ margin: 0, lineHeight: 1.8, opacity: 0.92 }}>
          {t({
            bn: 'প্রতিষ্ঠান ও ইউনিট অনুযায়ী সিলেবাস, প্রশ্নব্যাংক ও মডেল টেস্ট — জাতীয় বিশ্ববিদ্যালয় দিয়ে শুরু।',
            en: 'Syllabus, question bank and model tests by institution and unit — starting with National University.',
          })}
        </p>
      </div>

      <AdmissionModeSwitch />

      <p style={{ marginTop: 20 }}>
        <LinkButton to={NU_DASHBOARD_ROUTE} variant="primary">
          {t({ bn: 'আমার ভর্তি ড্যাশবোর্ড', en: 'My admission dashboard' })} →
        </LinkButton>
      </p>

      <h2 style={{ fontSize: 19, color: 'var(--heading)', marginTop: 28 }}>
        {t({ bn: 'প্রতিষ্ঠান', en: 'Institutions' })}
      </h2>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Card>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <strong style={{ fontSize: 17, color: 'var(--heading)' }}>
              {t({ bn: 'জাতীয় বিশ্ববিদ্যালয়', en: 'National University' })}
            </strong>
            <Chip tone="gold">{t({ bn: 'অগ্রাধিকার', en: 'Priority' })}</Chip>
          </div>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8, margin: '8px 0' }}>
            {t({
              bn: 'অনার্স ১ম বর্ষ ভর্তি — ১০০ MCQ, ১ ঘণ্টা, নেগেটিভ মার্কিং নেই। কনটেন্ট তৈরি হচ্ছে — এখন যাচাইকৃত ভর্তি-তথ্য, আবেদনের ধাপ ও মেধা-হিসাব দেখুন।',
              en: 'Honours 1st year admission — 100 MCQ, 1 hour, no negative marking. Content is being built — for now, see the verified admission information, application steps and merit calculation.',
            })}
          </p>
          <LinkButton to={NU_HUB_ROUTE} variant="accent">
            {t({ bn: 'প্রস্তুতি শুরু করুন', en: 'Start preparing' })} →
          </LinkButton>
        </Card>
        {COMING_SOON_INSTITUTIONS.map((inst) => (
          <Card key={inst.bn} style={{ opacity: 0.85 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 16, color: 'var(--heading)' }}>{t({ bn: inst.bn, en: inst.en })}</strong>
              <Chip tone="outline">{t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}</Chip>
            </div>
            <p style={{ color: 'var(--muted-ivory)', lineHeight: 1.8, margin: '8px 0 0', fontSize: 14 }}>
              {t({
                bn: 'এই প্রতিষ্ঠানের প্রস্তুতি এখনো তৈরি হয়নি — জাতীয় বিশ্ববিদ্যালয় আগে।',
                en: 'Preparation for this institution is not built yet — National University comes first.',
              })}
            </p>
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 19, color: 'var(--heading)', marginTop: 28 }}>
        {t({ bn: 'কীভাবে শুরু করবেন', en: 'How to start' })}
      </h2>
      <ol style={{ lineHeight: 2, color: 'var(--ink-soft)', margin: 0, paddingLeft: 20 }}>
        <li>{t({ bn: 'জাতীয় বিশ্ববিদ্যালয় হাবে যান ও আপনার শাখা বেছে নিন।', en: 'Go to the National University hub and choose your group.' })}</li>
        <li>{t({ bn: 'ভর্তির তথ্য, আবেদনের ধাপ ও মেধা-হিসাব পড়ুন।', en: 'Read the admission information, application steps and merit calculation.' })}</li>
        <li>{t({ bn: 'প্রস্তুতির মোড বেছে নিন — যেকোনো সময় বদলাতে পারবেন, অগ্রগতি মুছবে না।', en: 'Choose a preparation mode — you can switch any time, progress is kept.' })}</li>
      </ol>

      <div style={{ marginTop: 24, border: '1px solid #D9A441', borderRadius: 10, padding: '14px 16px', background: 'var(--amber-soft)' }}>
        <p style={{ margin: 0, color: 'var(--amber-dark-text)', lineHeight: 1.8, fontSize: 14 }}>
          {t({
            bn: 'কোনো গ্যারান্টি নয়: এখানকার তথ্য ও অনুশীলন ভর্তির প্রস্তুতির জন্য — ভর্তি নিশ্চিত করা, মেধাতালিকায় আসা বা ১০০% কমন প্রশ্নের কোনো নিশ্চয়তা দেওয়া হয় না। ভর্তি হয় জাতীয় বিশ্ববিদ্যালয়ের অফিসিয়াল পরীক্ষা ও মেধাতালিকার ভিত্তিতে।',
            en: 'No guarantee: the information and practice here are for admission preparation — there is no guarantee of admission, of a merit-list place, or of 100% common questions. Admission is based on National University’s official exam and merit list.',
          })}
        </p>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link to="/" style={{ fontWeight: 600 }}>
          {t({ bn: '← হোমে ফিরুন', en: '← Back to home' })}
        </Link>
      </p>
    </PageShell>
  );
}
