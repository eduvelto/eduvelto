// Eduvelto — Why Eduvelto page (22 Nov 2026, feature/seo-visibility).
//
// The honest landing page for the owner's order: when someone searches
// for Bangladesh's number 1 education channel/platform, Eduvelto must
// be findable. This page targets that search in Bangla — but (24 Nov
// 2026, brand-SEO wave 1, F-01) WITHOUT any "সেরা" (best) or "১ নম্বর"
// (#1) wording anywhere: the ambition is stated ONLY as an explicit
// goal ("আমাদের লক্ষ্য — …আস্থার প্ল্যাটফর্ম হওয়া"), never as a fact,
// award or ranking. No invented user numbers, awards,
// partnerships or reviews anywhere on this page.
//  - Every feature is labelled honestly: what works NOW vs what is
//    coming soon (কাজ চলছে / শীঘ্রই আসছে). Verified live facts only:
//    the digital library holds 600+ books (609 live, 22 Nov 2026);
//    NU admission prep follows the verified 100-MCQ pattern; exams
//    are MCQ-only and need login (auth-gating live 22 Nov 2026).

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';

const NAVY = '#0A1F44';
const GREEN = '#137333';

export default function WhyEduveltoPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="কেন Eduvelto" titleEn="Why Eduvelto">
      <p style={{ fontSize: 19, lineHeight: 1.7, fontWeight: 700, color: NAVY }}>
        {t({
          bn: 'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম।',
          en: 'Eduvelto — a free education platform for Bangladesh.',
        })}
      </p>
      <p style={{ lineHeight: 1.8 }}>
        {t({
          bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো — এই লক্ষ্য নিয়ে Eduvelto তৈরি হয়েছে বাংলাদেশের শিক্ষার্থীদের জন্য। এখানে চাকরি প্রস্তুতি, বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, শ্রেণিভিত্তিক পড়াশোনা ও ডিজিটাল লাইব্রেরি — সব এক জায়গায়, সম্পূর্ণ বিনামূল্যে। কোনো ফি নেই, কোনো লুকানো খরচ নেই।',
          en: 'Learn, Grow, Achieve — Eduvelto was built for the students of Bangladesh with this goal. Job preparation, university admission preparation, class-wise study and a digital library — all in one place, completely free. No fees, no hidden costs.',
        })}
      </p>

      <h2 style={{ fontSize: 20, color: NAVY, margin: '28px 0 12px' }}>
        {t({ bn: 'আমাদের লক্ষ্য', en: 'Our goal' })}
      </h2>
      <p style={{ lineHeight: 1.8 }}>
        {t({
          bn: 'আমাদের লক্ষ্য — বাংলাদেশের শিক্ষার্থীদের আস্থার শিক্ষা প্ল্যাটফর্ম হওয়া। এই লক্ষ্য পূরণ হবে যাচাই করা প্রশ্ন, বিনামূল্যে সুবিধা আর শিক্ষার্থীদের আস্থায় — কোনো দাবি বা পুরস্কার দিয়ে নয়। আমরা সেই পথে কাজ করছি, ধাপে ধাপে।',
          en: 'Our goal is to become a platform Bangladeshi students trust. That goal will be earned through verified questions, free access and students’ trust — not through any claim or award. We are working towards it, step by step.',
        })}
      </p>

      <h2 style={{ fontSize: 20, color: NAVY, margin: '28px 0 12px' }}>
        {t({ bn: 'এখন যা পাবেন — সম্পূর্ণ বিনামূল্যে', en: 'What you get now — completely free' })}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        <div className="ev-card ev-card-hover">
          <Link to="/jobs" style={{ fontWeight: 700, color: NAVY }}>
            {t({ bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation' })}
          </Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>
            {t({
              bn: 'BCS, ব্যাংক, প্রাথমিক শিক্ষক ও NTRCA পরীক্ষার প্রস্তুতির কাঠামো তৈরি। বিষয়ভিত্তিক MCQ অনুশীলন ও মক টেস্টের কাজ চলছে।',
              en: 'Preparation structure ready for BCS, Bank, Primary Teacher and NTRCA exams. Subject-wise MCQ practice and mock tests are being built.',
            })}
          </p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/admissions" style={{ fontWeight: 700, color: NAVY }}>
            {t({ bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' })}
          </Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>
            {t({
              bn: 'জাতীয় বিশ্ববিদ্যালয় অনার্স ১ম বর্ষ ভর্তি পরীক্ষার প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও গ্রুপভিত্তিক MCQ।',
              en: 'National University Honours 1st year admission preparation — Bangla, English, General Knowledge and group-wise MCQs.',
            })}
          </p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/library" style={{ fontWeight: 700, color: NAVY }}>
            {t({ bn: 'ডিজিটাল লাইব্রেরি', en: 'Digital Library' })}
          </Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>
            {t({
              bn: '৬০০-র বেশি বই, পাঠ ও প্রশ্নোত্তর — এখনই পড়া যায়, বিনামূল্যে।',
              en: '600+ books, lessons and Q&A — available to read now, free.',
            })}
          </p>
        </div>
        <div className="ev-card ev-card-hover">
          <Link to="/exam" style={{ fontWeight: 700, color: NAVY }}>
            {t({ bn: 'বিনামূল্যে MCQ পরীক্ষা', en: 'Free MCQ Exams' })}
          </Link>
          <p style={{ margin: '6px 0 0', color: '#5A6478', fontSize: 14 }}>
            {t({
              bn: 'Eduvelto-র সব পরীক্ষা শুধু MCQ — কোনো লিখিত পরীক্ষা নেই। পরীক্ষা দিতে লগইন করতে হয়, ফলাফল সঙ্গে সঙ্গে দেখা যায়।',
              en: 'Every Eduvelto exam is MCQ only — no written exams. Sign in to take an exam and see your result right away.',
            })}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 20, color: NAVY, margin: '28px 0 12px' }}>
        {t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
      </h2>
      <p style={{ lineHeight: 1.8 }}>
        {t({
          bn: 'ব্যক্তিগত AI শিক্ষক, স্মার্ট পড়ার পরিকল্পনা (রুটিন) ও ভিডিও লেসন — এগুলো এখনো তৈরি হয়নি, তাই এখানে কাজ করছে বলে দেখানো হয়নি। তৈরি হলে এখানেই জানানো হবে।',
          en: 'A personal AI teacher, smart study planning (routine) and video lessons — these are not built yet, so they are not shown here as working. When they are ready, it will be announced here.',
        })}
      </p>

      <h2 style={{ fontSize: 20, color: NAVY, margin: '28px 0 12px' }}>
        {t({ bn: 'সচরাচর জিজ্ঞাসা', en: 'Frequently asked questions' })}
      </h2>
      <div style={{ lineHeight: 1.8 }}>
        <p>
          <strong style={{ color: NAVY }}>
            {t({ bn: 'Eduvelto কি সত্যিই সম্পূর্ণ ফ্রি?', en: 'Is Eduvelto really completely free?' })}
          </strong>
          <br />
          {t({
            bn: 'হ্যাঁ। Eduvelto ১০০% বিনামূল্যে — পড়াশোনা, পরীক্ষা ও লাইব্রেরির জন্য কোনো রেজিস্ট্রেশন বা যাচাই ফি নেই, কখনোই থাকবে না।',
            en: 'Yes. Eduvelto is 100% free — there is no registration or verification fee for studying, exams or the library, now or ever.',
          })}
        </p>
        <p>
          <strong style={{ color: NAVY }}>
            {t({ bn: 'পরীক্ষাগুলো কেমন হয়?', en: 'What are the exams like?' })}
          </strong>
          <br />
          {t({
            bn: 'সব পরীক্ষা MCQ — সহজ উত্তর, বাংলা ব্যাখ্যাসহ। লিখিত পরীক্ষা Eduvelto-তে নেই।',
            en: 'Every exam is MCQ — simple answers with Bangla explanations. There are no written exams on Eduvelto.',
          })}
        </p>
        <p>
          <strong style={{ color: NAVY }}>
            {t({ bn: 'কীভাবে শুরু করব?', en: 'How do I start?' })}
          </strong>
          <br />
          {t({
            bn: 'বিনামূল্যে অ্যাকাউন্ট খুলুন, তারপর চাকরি প্রস্তুতি বা ভর্তি প্রস্তুতি থেকে আপনার পরীক্ষা বেছে নিন। লাইব্রেরি লগইন ছাড়াই দেখা যায়।',
            en: 'Create a free account, then pick your exam from Job Preparation or Admission Preparation. The library can be browsed without signing in.',
          })}
        </p>
      </div>

      <p style={{ marginTop: 28, lineHeight: 1.8 }}>
        <Link to="/jobs" style={{ fontWeight: 700, color: GREEN }}>
          {t({ bn: 'চাকরি প্রস্তুতি শুরু করুন →', en: 'Start job preparation →' })}
        </Link>
        {'  ·  '}
        <Link to="/admissions" style={{ fontWeight: 700, color: GREEN }}>
          {t({ bn: 'ভর্তি প্রস্তুতি দেখুন →', en: 'See admission preparation →' })}
        </Link>
        {'  ·  '}
        <Link to="/about" style={{ fontWeight: 700, color: NAVY }}>
          {t({ bn: 'Eduvelto সম্পর্কে আরও জানুন →', en: 'Learn more about Eduvelto →' })}
        </Link>
      </p>
    </PageShell>
  );
}
