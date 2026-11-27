// Eduvelto — class index (homepage redesign, 21 Nov 2026).
//
// /class: the Academic Learning landing page. The new homepage's
// "শিক্ষা কার্যক্রম" card links here; the seven class-level cards (with
// honest per-class book/subject counts) used to live on the homepage
// itself and now live here, so the homepage stays a 4-section overview
// as the owner-approved mockups show. Counts are counted from the live
// published library; levels with no books yet are hidden (28 Nov
// 2026 completeness audit) and reappear once books are published.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { ClassCard } from '../components/ClassCards';
import { Card, SkeletonCards } from '../components/ui';
import { listPublishedBooks, type Book } from '../lib/content';
import { getAllClassStats, type ClassStats } from '../lib/classStats';
import { takeClassIndexInitialData, type PayloadClassLevel } from '../lib/initialData';
import { CLASS_LEVELS, booksForClass, subjectsForClass } from '../lib/classLevels';
import { publicAcademicClassSubjects } from '../lib/publicAcademic';
import { QPG_GENERAL_CLASSES, qpgSubjectsFor } from '../lib/questionPaper';
import { useLanguage } from '../i18n/LanguageContext';

function toBnDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

/** Practice coverage, one line per class: subjects with verified
 *  practice + question total — derived from the verified pool and
 *  the QPG's class/subject names, never hardcoded. */
function academicPracticeSummary(lang: 'bn' | 'en'): string {
  const byClass = new Map<string, { className: string; subjects: string[]; total: number }>();
  for (const r of publicAcademicClassSubjects()) {
    const cls = QPG_GENERAL_CLASSES.find((x) => x.id === r.classId);
    const subj = qpgSubjectsFor('general', r.classId).find((x) => x.id === r.subjectId);
    const row = byClass.get(r.classId) ?? {
      className: lang === 'bn' ? cls?.nameBn ?? r.classId : cls?.nameEn ?? r.classId,
      subjects: [],
      total: 0,
    };
    row.subjects.push(
      lang === 'bn' ? subj?.nameBn ?? r.subjectId : subj?.nameEn ?? r.subjectId,
    );
    row.total += r.questionCount;
    byClass.set(r.classId, row);
  }
  return [...byClass.values()]
    .map((row) =>
      lang === 'bn'
        ? `${row.className} (${row.subjects.join(', ')} — ${toBnDigits(row.total)}টি প্রশ্ন)`
        : `${row.className} (${row.subjects.join(', ')} — ${row.total} questions)`,
    )
    .join(' • ');
}

export default function ClassIndexPage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [stats, setStats] = useState<ClassStats[] | null>(null);
  // __INITIAL_DATA__ (Phase 2b): a prerendered /class page carries
  // the per-level book/subject counts — zero Firestore reads.
  // Consumed once, on mount.
  const [initialLevels] = useState(() => takeClassIndexInitialData());
  const [levels, setLevels] = useState<PayloadClassLevel[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    if (initialLevels) {
      setLevels(initialLevels.levels);
      return;
    }
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

  const loaded = stats !== null || books !== null || levels !== null;
  const allBooks = books ?? [];
  const perClass = useMemo(() => {
    if (levels) {
      return CLASS_LEVELS.map((def) => {
        const l = levels.find((x) => x.slug === def.slug);
        return { def, books: l?.bookCount ?? 0, subjects: l?.subjectCount ?? 0 };
      });
    }
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
  }, [books, stats, levels]);
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
      {/* Chapter practice (Education Hub, 26 Nov 2026): the same
          verified bank as the Question Maker, chapter by chapter.
          Static — it shows even though Classes 3/5 have no books yet. */}
      {loaded ? (
        <Card style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>
            {t({ bn: 'অধ্যায়ভিত্তিক অনুশীলন', en: 'Chapter-wise Practice' })}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 12px' }}>
            {t({
              bn: `এই শ্রেণির যাচাইকৃত অনুশীলন প্রশ্ন দিয়ে অধ্যায়ভিত্তিক অনুশীলন করুন — উত্তর দিলেই সঠিক উত্তর ও ব্যাখ্যা দেখতে পাবেন। এখন আছে ${academicPracticeSummary('bn')}।`,
              en: `Practise chapter by chapter with this class's verified practice questions — see the correct answer and explanation as soon as you answer. Available now: ${academicPracticeSummary('en')}.`,
            })}
          </p>
          <Link to="/learn/practice" style={{ fontWeight: 600 }}>
            {t({ bn: 'অনুশীলন শুরু করুন →', en: 'Start practising →' })}
          </Link>
        </Card>
      ) : null}
    </PageShell>
  );
}
