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
import { getAllClassStats, type ClassStats } from '../lib/classStats';
import { CLASS_LEVELS, booksForClass, subjectsForClass } from '../lib/classLevels';
import { useLanguage } from '../i18n/LanguageContext';

export default function ClassIndexPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [stats, setStats] = useState<ClassStats[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    // READ BUDGET (fix/read-usage): per-class counts come from the five
    // stats docs (5 reads, cached per session) instead of the whole
    // 609-book list. When stats are not written yet, fall back to the
    // full list — same reads as before, never a zero.
    getAllClassStats()
      .then((allStats) => {
        if (!live) return;
        if (allStats.every((s) => s !== null)) {
          setStats(allStats as ClassStats[]);
          return;
        }
        return listPublishedBooks().then((all) => {
          if (live) setBooks(all);
        });
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

  const loaded = stats !== null || books !== null;
  const allBooks = books ?? [];
  const perClass = useMemo(() => {
    if (stats) {
      return CLASS_LEVELS.map((def) => {
        const s = stats.find((x) => x.slug === def.slug);
        return { def, books: s?.bookCount ?? 0, subjects: s?.subjects.length ?? 0 };
      });
    }
    return CLASS_LEVELS.map((def) => {
      const cb = booksForClass(allBooks, def);
      return { def, books: cb.length, subjects: subjectsForClass(allBooks, def).length };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, stats]);
  const totalBooks = perClass.reduce((s, c) => s + c.books, 0);

  return (
    <PageShell titleBn="শিক্ষা কার্যক্রম" titleEn="Academic Learning" maxWidth={1240}>
      <p style={{ color: 'var(--muted-ivory)', margin: '-8px 0 14px', fontSize: 15 }}>
        {t({ bn: 'প্রথমে আপনার শ্রেণি বেছে নিন, তারপর সেই শ্রেণির বই, বিষয়, পাঠ ও পরীক্ষা দেখুন।', en: 'First pick your class, then see its books, subjects, lessons and exams.' })}
      </p>
      {!loaded ? <SkeletonCards count={3} /> : null}
      {error ? (
        <p style={{ color: 'var(--error)', margin: '0 0 16px' }}>
          {t({ bn: 'বইয়ের তালিকা লোড করা যায়নি — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।', en: 'Could not load the book list — please refresh and try again.' })}
        </p>
      ) : null}
      {loaded && totalBooks === 0 && !error ? (
        <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
      ) : null}
      {loaded && totalBooks > 0 ? (
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
