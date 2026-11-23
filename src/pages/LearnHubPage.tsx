// Eduvelto — AdSense Part 1 (integration): /learn hub.
//
// The breadcrumb target for the two public lesson pages. Today /learn
// holds only the BCS English lessons, so the hub lists those two plus
// the BCS English practice hub. Static data only (publicLessons.ts) —
// zero Firestore reads, no login. The lessons are AI-drafted drafts
// awaiting teacher review — the hub says so plainly, and each lesson
// page carries its own draft label.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PUBLIC_LESSONS } from '../lib/publicLessons';

export default function LearnHubPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="পাঠ — বিসিএস ইংরেজি" titleEn="Lessons — BCS English" wide maxWidth={1240}>
      <p style={{ color: '#57616A', margin: '0 0 20px', fontSize: 15, lineHeight: 1.7 }}>
        {t({
          bn: 'বিসিএস ইংরেজি প্রস্তুতির পাঠ — বিনামূল্যে পড়ুন। পাঠগুলো খসড়া হিসেবে দেওয়া আছে; শিক্ষক যাচাইয়ের পর চূড়ান্ত হবে।',
          en: 'BCS English lessons — free to read. The lessons are drafts awaiting teacher review.',
        })}
      </p>

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
