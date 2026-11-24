// Eduvelto — AdSense Part 1 (integration): /learn hub.
//
// The breadcrumb target for the two public lesson pages. REVISED
// 24 Nov 2026 (brand-SEO wave 1): the hub now also lists the 10
// public guides (src/lib/publicGuides.ts) — same static-data,
// zero-Firestore pattern as the lessons. EXTENDED 24 Nov 2026
// (brand-SEO wave 2): 17 guides now. EXTENDED 24 Nov 2026
// (brand-SEO wave 3): 23 guides now. EXTENDED 24 Nov 2026
// (brand-SEO wave 4): 29 guides now. Static data only
// (publicLessons.ts + publicGuides.ts) — zero Firestore reads, no
// login. The lessons and guides are drafts awaiting teacher review —
// the hub says so plainly, and each page carries its own draft label.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PUBLIC_LESSONS } from '../lib/publicLessons';
import { PUBLIC_GUIDES } from '../lib/publicGuides';

export default function LearnHubPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="পাঠ ও গাইড" titleEn="Lessons and guides" wide maxWidth={1240}>
      <p style={{ color: '#57616A', margin: '0 0 20px', fontSize: 15, lineHeight: 1.7 }}>
        {t({
          bn: 'বিনামূল্যে পাঠ ও গাইড — বিসিএস, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, ইংরেজি ব্যাকরণ, বৃত্তি, CV, বাজেট পরিকল্পনা, পুনরালোচনা, নোট, সময় ব্যবস্থাপনা, ইংরেজি লেখা, অনলাইন নিরাপত্তা, বাংলা বানান, কম্পিউটার, পরীক্ষার দিন, MCQ, মনে রাখা, চাকরিপ্রার্থীর রুটিন, সুস্থ অভ্যাস ও ডিজিটাল দক্ষতা। পাঠ ও গাইডগুলো খসড়া হিসেবে দেওয়া আছে; শিক্ষক যাচাইয়ের পর চূড়ান্ত হবে।',
          en: 'Free lessons and guides — BCS, bank, primary teacher, NTRCA and National University admission preparation, English grammar, scholarships, CV writing, budget planning, revision, note-taking, time management, English writing, online safety, Bangla spelling, computer basics, exam day, MCQ techniques, memory techniques, job-seeker routine, healthy habits and digital skills. The lessons and guides are drafts awaiting teacher review.',
        })}
      </p>

      <h2 style={{ fontSize: 19, margin: '0 0 12px', color: '#142B3B' }}>
        {t({ bn: 'প্রস্তুতি গাইড', en: 'Preparation guides' })}
      </h2>
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {PUBLIC_GUIDES.map((guide) => (
          <Card key={guide.slug}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              <Link to={guide.path} style={{ fontWeight: 700 }}>
                {guide.titleBn}
              </Link>
            </div>
            <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {guide.bodyBn[0]}
            </p>
            <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 13 }}>
              {t({
                bn: 'খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়',
                en: 'Draft lesson — awaiting teacher review',
              })}
            </p>
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 19, margin: '0 0 12px', color: '#142B3B' }}>
        {t({ bn: 'বিসিএস ইংরেজি পাঠ', en: 'BCS English lessons' })}
      </h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {PUBLIC_LESSONS.map((lesson) => (
          <Card key={lesson.slug}>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
              <Link to={lesson.path} style={{ fontWeight: 700 }}>
                {lesson.titleBn}
              </Link>
            </div>
            <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {lesson.introBn[0]}
            </p>
            <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 13 }}>
              {t({
                bn: 'খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়',
                en: 'Draft lesson — awaiting teacher review',
              })}
            </p>
          </Card>
        ))}

        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
            <Link to="/jobs/bcs/practice/english" style={{ fontWeight: 700 }}>
              {t({
                bn: 'বিসিএস ইংরেজি অনুশীলন — ৩৫টি যাচাইকৃত প্রশ্ন',
                en: 'BCS English practice — 35 verified questions',
              })}
            </Link>
          </div>
          <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
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
