// Eduvelto — AdSense Part 1 (integration): /learn hub.
//
// The breadcrumb target for the two public lesson pages. REVISED
// 24 Nov 2026 (brand-SEO wave 1): the hub now also lists the 10
// public guides (src/lib/publicGuides.ts) — same static-data,
// zero-Firestore pattern as the lessons. EXTENDED 24 Nov 2026
// (brand-SEO wave 2): 17 guides now. EXTENDED 24 Nov 2026
// (brand-SEO wave 3): 23 guides now. EXTENDED 24 Nov 2026
// (brand-SEO wave 4): 29 guides now. EXTENDED 24 Nov 2026
// (brand-SEO wave 5): 35 guides now. EXTENDED 24 Nov 2026
// (brand-SEO wave 10): 41 guides now. Static data only
// (publicLessons.ts + publicGuides.ts) — zero Firestore reads, no
// login. Present tense only (28 Nov 2026 AdSense cleanup): the hub no
// longer carries a draft label.
// REVISED 24 Nov 2026 (brand-SEO wave 8): hardcoded light text colours
// (#57616A / #142B3B / #68747B) replaced with design-system tokens
// (muted-ivory / heading / muted) — light values are identical, dark
// mode now keeps AA contrast (was 1.2:1–3.02:1).

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PUBLIC_LESSONS } from '../lib/publicLessons';
import { PUBLIC_GUIDES } from '../lib/publicGuides';

export default function LearnHubPage() {
  const { lang, t } = useLanguage();
  return (
    <PageShell titleBn="পাঠ ও গাইড" titleEn="Lessons and guides" wide maxWidth={1240}>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', fontSize: 15, lineHeight: 1.7 }}>
        {t({
          bn: 'বিনামূল্যে পাঠ ও গাইড — বিসিএস, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, ইংরেজি ব্যাকরণ, বৃত্তি, CV, বাজেট পরিকল্পনা, পুনরালোচনা, নোট, সময় ব্যবস্থাপনা, ইংরেজি লেখা, অনলাইন নিরাপত্তা, বাংলা বানান, কম্পিউটার, পরীক্ষার দিন, MCQ, মনে রাখা, চাকরিপ্রার্থীর রুটিন, সুস্থ অভ্যাস ও ডিজিটাল দক্ষতা, লক্ষ্য নির্ধারণ, মনোযোগ ধরে রাখা, ঘুম ও পড়াশোনা, পড়া বুঝে পড়া, ফোন দিয়ে পড়া ও ক্লাসে প্রশ্ন করা, আর Eduvelto ব্যবহারের গাইড (ফ্রি লাইব্রেরি, চাকরির অনুশীলন, AI অ্যাসিস্ট্যান্ট, অপরচুনিটি হাব, লাইফ সার্ভিস ও ইংরেজিতে কথা বলা)।',
          en: 'Free lessons and guides — BCS, bank, primary teacher, NTRCA and National University admission preparation, English grammar, scholarships, CV writing, budget planning, revision, note-taking, time management, English writing, online safety, Bangla spelling, computer basics, exam day, MCQ techniques, memory techniques, job-seeker routine, healthy habits and digital skills, goal setting, staying focused, sleep and study, reading comprehension, learning with your phone and asking questions in class, and guides to using Eduvelto (free library, job practice, AI assistant, opportunity hub, life services and spoken English).',
        })}
      </p>

      <h2 style={{ fontSize: 19, margin: '0 0 12px', color: 'var(--heading)' }}>
        {t({ bn: 'প্রস্তুতি গাইড', en: 'Preparation guides' })}
      </h2>
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {PUBLIC_GUIDES.map((guide) => (
          <Card key={guide.slug}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              <Link to={guide.path} style={{ fontWeight: 700 }}>
                {lang === 'bn' ? guide.titleBn : guide.titleEn}
              </Link>
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {lang === 'bn' ? guide.bodyBn[0] : (guide.bodyEn?.[0] ?? guide.bodyBn[0])}
            </p>
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 19, margin: '0 0 12px', color: 'var(--heading)' }}>
        {t({ bn: 'বিসিএস ইংরেজি পাঠ', en: 'BCS English lessons' })}
      </h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {PUBLIC_LESSONS.map((lesson) => (
          <Card key={lesson.slug}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              <Link to={lesson.path} style={{ fontWeight: 700 }}>
                {lesson.titleBn}
              </Link>
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {lesson.introBn[0]}
            </p>
          </Card>
        ))}

        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            <Link to="/jobs/bcs/practice/english" style={{ fontWeight: 700 }}>
              {t({
                bn: 'বিসিএস ইংরেজি অনুশীলন — ৩৫টি যাচাইকৃত প্রশ্ন',
                en: 'BCS English practice — 35 verified questions',
              })}
            </Link>
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'ব্যাকরণ, শব্দভান্ডার ও রিডিং — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন।',
              en: 'Grammar, vocabulary and reading — practise free with verified questions.',
            })}
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
