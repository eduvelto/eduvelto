// Eduvelto — class index (homepage redesign, 21 Nov 2026).
//
// /class: the Academic Learning landing page. The new homepage's
// "শিক্ষা কার্যক্রম" card links here; the five class-level cards (with
// honest per-class book/subject counts) used to live on the homepage
// itself and now live here, so the homepage stays a 4-section overview
// as the owner-approved mockups show. Counts are counted from the live
// published library; empty classes show "শীঘ্রই আসছে" honestly.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { ClassCard } from '../components/ClassCards';
import { SkeletonCards } from '../components/ui';
import { listPublishedBooks, type Book } from '../lib/content';
import { CLASS_LEVELS, booksForClass, subjectsForClass } from '../lib/classLevels';
import { useLanguage } from '../i18n/LanguageContext';

export default function ClassIndexPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    listPublishedBooks()
      .then((all) => {
        if (live) setBooks(all);
      })
      .catch(() => {
        if (live) {
          setBooks([]);
          setError(true);
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const allBooks = books ?? [];
  const perClass = useMemo(
    () =>
      CLASS_LEVELS.map((def) => {
        const cb = booksForClass(allBooks, def);
        return { def, books: cb.length, subjects: subjectsForClass(allBooks, def).length };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books],
  );

  return (
    <PageShell titleBn="শিক্ষা কার্যক্রম" titleEn="Academic Learning" maxWidth={1240}>
      <p style={{ color: '#57616A', margin: '-8px 0 14px', fontSize: 15 }}>
        {t({ bn: 'প্রথমে আপনার শ্রেণি বেছে নিন, তারপর সেই শ্রেণির বই, বিষয়, পাঠ ও পরীক্ষা দেখুন।', en: 'First pick your class, then see its books, subjects, lessons and exams.' })}
      </p>
      {books === null ? <SkeletonCards count={3} /> : null}
      {error ? (
        <p style={{ color: '#B00020', margin: '0 0 16px' }}>
          {t({ bn: 'বইয়ের তালিকা লোড করা যায়নি — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।', en: 'Could not load the book list — please refresh and try again.' })}
        </p>
      ) : null}
      {books !== null && books.length === 0 && !error ? (
        <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
      ) : null}
      {books !== null && books.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {perClass.map(({ def, books: bc, subjects: sc }, i) => (
              <ClassCard key={def.slug} def={def} bookCount={bc} subjectCount={sc} delayMs={Math.min(i, 4) * 60} />
            ))}
          </div>
          <p style={{ margin: '4px 0 0' }}>
            <Link to="/directory" style={{ fontWeight: 600 }}>
              {t({ bn: 'শিক্ষা নির্দেশিকায় সব বিষয় দেখুন →', en: 'See all subjects in the directory →' })}
            </Link>
          </p>
        </>
      ) : null}
    </PageShell>
  );
}
