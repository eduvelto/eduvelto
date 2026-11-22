// Eduvelto — shared Coming Soon placeholder (homepage redesign, 21 Nov 2026).
//
// ONE minimal page for /jobs, /admissions and /skills so the new homepage
// cards never 404. These sections are NOT built yet (the jobs branch is
// separate, stopped work; the roadmap agent decides the build order) —
// this page says so honestly and points at what DOES work today
// (library, exams, routine). Do not add content here that implies the
// section exists.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';

type Section = 'jobs' | 'admissions' | 'skills';

const CONTENT: Record<Section, { titleBn: string; titleEn: string; bodyBn: string; bodyEn: string; items: { bn: string; en: string }[] }> = {
  jobs: {
    titleBn: 'চাকরি প্রস্তুতি',
    titleEn: 'Job Preparation',
    bodyBn: 'চাকরি প্রস্তুতি বিভাগটি এখন তৈরি হচ্ছে। BCS, ব্যাংক, প্রাইমারি শিক্ষক, NTRCA ও অন্যান্য সরকারি-বেসরকারি চাকরির প্রস্তুতি — সিলেবাস, প্রশ্নব্যাংক, মডেল টেস্ট ও ফলাফল বিশ্লেষণসহ — এখানে আসবে।',
    bodyEn: 'The Job Preparation section is being built. BCS, Bank, Primary Teacher, NTRCA and other government and private job preparation — syllabus, question bank, model tests and result analysis — will appear here.',
    items: [
      { bn: 'BCS ও অন্যান্য BPSC পরীক্ষা', en: 'BCS and other BPSC exams' },
      { bn: 'ব্যাংক চাকরি (বাংলাদেশ ব্যাংক, সরকারি ও বেসরকারি)', en: 'Bank jobs (Bangladesh Bank, government and private)' },
      { bn: 'প্রাইমারি শিক্ষক ও NTRCA', en: 'Primary Teacher and NTRCA' },
      { bn: 'প্রতিরক্ষা, স্বায়ত্তশাসিত ও অন্যান্য', en: 'Defence, autonomous and other jobs' },
    ],
  },
  admissions: {
    titleBn: 'ভর্তি প্রস্তুতি',
    titleEn: 'Admission Preparation',
    bodyBn: 'ভর্তি প্রস্তুতি বিভাগটি এখন তৈরি হচ্ছে। বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং, কৃষি, নার্সিং ও অন্যান্য ভর্তি পরীক্ষার প্রস্তুতি — প্রতিষ্ঠান ও ইউনিট অনুযায়ী সিলেবাস, প্রশ্নব্যাংক ও মডেল টেস্টসহ — এখানে আসবে।',
    bodyEn: 'The Admission Preparation section is being built. University, Medical, Engineering, Agriculture, Nursing and other admission preparation — syllabus, question bank and model tests by institution and unit — will appear here.',
    items: [
      { bn: 'বিশ্ববিদ্যালয় ভর্তি', en: 'University admission' },
      { bn: 'মেডিকেল ও ডেন্টাল ভর্তি', en: 'Medical and Dental admission' },
      { bn: 'ইঞ্জিনিয়ারিং ভর্তি', en: 'Engineering admission' },
      { bn: 'কৃষি, নার্সিং ও অন্যান্য ভর্তি', en: 'Agriculture, Nursing and other admissions' },
    ],
  },
  skills: {
    titleBn: 'দক্ষতা উন্নয়ন',
    titleEn: 'Professional Skills',
    bodyBn: 'দক্ষতা উন্নয়ন বিভাগটি এখন তৈরি হচ্ছে। English, Computer, Digital Skills ও Career Development কোর্স — ধাপে ধাপে শেখার পাঠ ও অনুশীলনসহ — এখানে আসবে।',
    bodyEn: 'The Professional Skills section is being built. English, Computer, Digital Skills and Career Development courses — with step-by-step lessons and practice — will appear here.',
    items: [
      { bn: 'English', en: 'English' },
      { bn: 'Computer', en: 'Computer' },
      { bn: 'Digital Skills', en: 'Digital Skills' },
      { bn: 'Career Development', en: 'Career Development' },
    ],
  },
};

export default function ComingSoonPage(props: { section: Section }) {
  const { t } = useLanguage();
  const c = CONTENT[props.section];
  return (
    <PageShell titleBn={c.titleBn} titleEn={c.titleEn} maxWidth={760} hideHomeLink>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: '#3A444B' }}>{t({ bn: c.bodyBn, en: c.bodyEn })}</p>
      <ul style={{ lineHeight: 1.9, color: '#3A444B' }}>
        {c.items.map((item) => (
          <li key={item.bn}>{t({ bn: item.bn, en: item.en })}</li>
        ))}
      </ul>
      <p style={{ marginTop: 20 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 999,
            background: '#FDF3D7',
            color: '#8A6100',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
        </span>
      </p>
      <p style={{ marginTop: 20, color: '#57616A' }}>
        {t({ bn: 'এই সময়ে যা করতে পারেন —', en: 'What you can do in the meantime —' })}
      </p>
      {/* NU-5: NuOnboarding moved to the NU hub Home tab
          (/admissions/national-university). /admissions is now the hub
          index, so this page no longer serves admissions at all. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
        <LinkButton to="/library" variant="primary">
          {t({ bn: 'লাইব্রেরি দেখুন', en: 'Browse library' })}
        </LinkButton>
        <LinkButton to="/exam" variant="outline">
          {t({ bn: 'মডেল টেস্ট দিন', en: 'Take a model test' })}
        </LinkButton>
        <LinkButton to="/class" variant="outline">
          {t({ bn: 'শিক্ষা কার্যক্রম দেখুন', en: 'See academic learning' })}
        </LinkButton>
        <Link to="/" style={{ alignSelf: 'center', fontWeight: 600 }}>
          {t({ bn: '← হোমে ফিরুন', en: '← Back to home' })}
        </Link>
      </div>
    </PageShell>
  );
}
