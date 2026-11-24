// Eduvelto — Admin: written question + model-answer management
// (design §5.1 #8, §2.1).
//
// /admin/jobs/written — the §2.1 doc editor list: 8 teaching
// elements, template picker, model answer, marking guidelines,
// common mistakes, reference sources, version. Publish requires
// teacher review (English: owner; other subjects: verified
// teacher). The code-shaped first questions live in
// jobWrittenContent.ts until the Firestore collection is populated
// (Phase 4 rules); this list shows the Firestore docs when they
// exist, and the code-shaped count meanwhile — never a guessed
// number.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card, Chip } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import { listAdminWrittenQuestions, type AdminListItem } from '../lib/jobAdminJobs';
import { WRITTEN_QUESTIONS } from '../lib/jobWrittenContent';

export default function AdminJobWrittenPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<AdminListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(false);
    listAdminWrittenQuestions({})
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'লিখিত প্রশ্ন ব্যবস্থাপনা', en: 'Written Question Management' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'প্রকাশের আগে শিক্ষকের যাচাই বাধ্যতামূলক — ইংরেজি: মালিক; অন্য বিষয়: যাচাইকৃত শিক্ষক। যাচাইকৃত শিক্ষক না থাকলে অন্য বিষয়ের প্রশ্ন খসড়াই থাকে। মডেল উত্তর একটি নমুনা — একমাত্র সঠিক উত্তর নয়।',
          en: 'Teacher review is required before Publish — English: owner; other subjects: verified teacher. Without a verified teacher, other subjects stay Draft. The model answer is a sample — not the only correct answer.',
        })}
      </p>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>
        {t({
          bn: `কোড-আকৃতির প্রথম প্রশ্ন: ${WRITTEN_QUESTIONS.length}টি (সব খসড়া — মালিকের যাচাই বাকি)।`,
          en: `Code-shaped first questions: ${WRITTEN_QUESTIONS.length} (all Draft — owner verification pending).`,
        })}
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={() => setNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : items === null ? (
        <LoadingBox />
      ) : items.length === 0 ? (
        <EmptyAdminBox
          bn="Firestore-এ এখনো কোনো লিখিত প্রশ্ন নেই — প্রথম প্রশ্নগুলো কোড-আকৃতিতে আছে (উপরে দেখুন)।"
          en="No written questions in Firestore yet — the first questions are code-shaped (see above)."
          nextBn="নতুন প্রশ্ন যোগ করার আগে ৮টি শিক্ষণ উপাদান + টেমপ্লেট + উৎস ঠিক করুন।"
          nextEn="Before adding a new question, fix the 8 teaching elements + template + sources."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <Card key={item.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>{item.titleBn}</strong>
                <Chip tone={item.status === 'published' ? 'blue' : 'outline'}>{item.reviewStatus}</Chip>
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: 'var(--muted)' }}>{item.docId}</div>
            </Card>
          ))}
        </div>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs/approvals">{t({ bn: '← অনুমোদনের সারি', en: '← Approval queue' })}</Link>
      </p>
    </div>
  );
}
