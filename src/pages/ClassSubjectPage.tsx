// Eduvelto — class-scoped subject view (stage 3: class-wise homepage +
// mobile app preview). Navigation model: Select Class → Class Dashboard →
// Tab → Subject → Book → Chapter. This page is the Subject step: it shows
// ONLY this subject's books inside THIS class — never another class's
// books. The Chapter step is the existing working book page
// (/library/:bookId), which lists the book's chapters; each chapter links
// to its lessons. No new chapter UI is built here.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, Reveal, SkeletonCards } from '../components/ui';
import { listPublishedBooks, listBooksForClassPage, type Book, type ClassListCursor } from '../lib/content';
import { getClassStats, type ClassStats } from '../lib/classStats';
import { booksForClass, classLevelBySlug } from '../lib/classLevels';
import { useLanguage } from '../i18n/LanguageContext';

export default function ClassSubjectPage() {
  const { t } = useLanguage();
  const { slug = '', dept = '' } = useParams<{ slug: string; dept: string }>();
  const def = classLevelBySlug(slug);
  const subject = decodeURIComponent(dept);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [stats, setStats] = useState<ClassStats | null | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState<Array<ClassListCursor | null>>([null]);
  const [error, setError] = useState('');

  // READ BUDGET (fix/read-usage): this page used to read ALL 609
  // Published books to show one subject. Now it reads the stats doc
  // (1 read, cached) for the totals + one server page (20 reads) of
  // this subject's books in this class. Fallback when stats are not
  // written yet: the old full-list fetch (same reads as before).
  async function load() {
    if (!def) return;
    setError('');
    setBooks(null);
    setPage(1);
    setCursors([null]);
    try {
      const s = await getClassStats(def.slug);
      setStats(s);
      if (s) {
        const res = await listBooksForClassPage(def.educationType, def.classLevels, {
          department: subject,
          pageSize: 20,
        });
        setBooks(res.items);
        if (res.nextCursor) setCursors([null, res.nextCursor]);
        return;
      }
      const b = await listPublishedBooks();
      setBooks(b);
    } catch {
      setError(t({ bn: 'বইয়ের তালিকা লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the books — please try again.' }));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subject]);

  async function goPage(next: number) {
    if (!def || !stats || next < 1) return;
    const res = await listBooksForClassPage(def.educationType, def.classLevels, {
      department: subject,
      cursor: cursors[next - 1] ?? null,
      pageSize: 20,
    });
    setBooks(res.items);
    setPage(next);
    if (res.nextCursor) {
      setCursors((prev) => {
        const nextCursors = [...prev];
        nextCursors[next] = res.nextCursor;
        return nextCursors;
      });
    }
  }

  if (!def) {
    return (
      <PageShell titleBn="শ্রেণি পাওয়া যায়নি" titleEn="Class not found" wide>
        <EmptyState bn="এই শ্রেণিটি খুঁজে পাওয়া যায়নি।" en="This class could not be found." />
        <p style={{ marginTop: 16 }}>
          <Link to="/class" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব শ্রেণি দেখুন', en: '← See all classes' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  // STATS mode: `books` is already this subject's current page (the
  // query filters by department + class); totals come from the stats
  // doc. FALLBACK mode: `books` is the full Published list — filter it
  // down, exactly as before.
  const statsMode = !!stats;
  const subjectStat = stats?.subjects.find((s) => s.name === subject);
  const classBooks = books ? booksForClass(books, def) : [];
  const subjectBooks = statsMode
    ? (books ?? [])
    : classBooks.filter((b) => b.department === subject);
  const totalBooks = statsMode ? (subjectStat?.bookCount ?? 0) : subjectBooks.length;
  const totalChapters = statsMode
    ? (subjectStat?.chapterCount ?? 0)
    : subjectBooks.reduce((s, b) => s + (b.chapterCount ?? 0), 0);
  const totalQuestions = statsMode
    ? (subjectStat?.questionCount ?? 0)
    : subjectBooks.reduce((s, b) => s + (b.questionCount ?? 0), 0);
  const pageCount = statsMode ? Math.max(1, Math.ceil(totalBooks / 20)) : 1;

  return (
    <PageShell titleBn={subject} titleEn={subject} wide>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={`/class/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${def.bn} — সব বিষয়`, en: `← ${def.en} — All subjects` })}
        </Link>
      </p>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px' }}>
        {t({ bn: `${def.bn} — এই বিষয়ের শুধুমাত্র এই শ্রেণির বই`, en: `${def.en} — only this class's books for this subject` })}
      </p>
      {books === null ? <SkeletonCards count={3} /> : null}
      {error ? (
        <AlertBox tone="error" onRetry={load}>
          {error}
        </AlertBox>
      ) : null}
      {books !== null && subjectBooks.length === 0 && !error ? (
        <EmptyState
          bn="এই শ্রেণিতে এই বিষয়ের কোনো বই নেই।"
          en="No books for this subject in this class."
        />
      ) : null}
      {subjectBooks.length > 0 ? (
        <>
          <p style={{ color: 'var(--muted-ivory)', margin: '0 0 12px' }}>
            {t({ bn: `${totalBooks}টি বই · ${totalChapters}টি পাঠ · ${totalQuestions}টি প্রশ্ন`, en: `${totalBooks} books · ${totalChapters} lessons · ${totalQuestions} questions` })}          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {subjectBooks.map((b, i) => (
              <Reveal key={b.id} delayMs={Math.min(i, 3) * 60}>
                <Card hover>
                  <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
                    {b.title}
                  </Link>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <Chip>{b.department}</Chip>
                    <Chip tone="outline">{b.classLevel}</Chip>
                    <Chip tone="gold">{t({ bn: `${b.questionCount}টি প্রশ্ন`, en: `${b.questionCount} questions` })}</Chip>
                  </div>
                  <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                    {t({ bn: `${b.chapterCount}টি পাঠ — বই খুলে অধ্যায় দেখুন`, en: `${b.chapterCount} lessons — open the book to see chapters` })}
                  </p>
                  <p style={{ margin: '10px 0 0' }}>
                    <Link to={`/library/${b.id}`} style={{ fontWeight: 600 }}>
                      {t({ bn: 'বইটি খুলুন →', en: 'Open the book →' })}
                    </Link>
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
          <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>
            {t({ bn: 'প্রতিটি বইয়ের ভেতরে অধ্যায়ভিত্তিক পাঠ আছে — বই খুলে অধ্যায় ও পাঠ দেখুন।', en: 'Each book contains chapter-wise lessons — open a book to see its chapters and lessons.' })}
          </p>
          {statsMode && pageCount > 1 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => void goPage(Math.max(1, page - 1))} disabled={page <= 1}>
                {t({ bn: '← আগের', en: '← Previous' })}
              </Button>
              <span>
                {t({ bn: `পাতা ${page} / ${pageCount}`, en: `Page ${page} of ${pageCount}` })}
              </span>
              <Button variant="outline" onClick={() => void goPage(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>
                {t({ bn: 'পরের →', en: 'Next →' })}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
