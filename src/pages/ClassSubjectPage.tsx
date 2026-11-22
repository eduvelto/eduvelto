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
import { AlertBox, Card, Chip, Reveal, SkeletonCards } from '../components/ui';
import { listPublishedBooks, type Book } from '../lib/content';
import { booksForClass, classLevelBySlug } from '../lib/classLevels';
import { useLanguage } from '../i18n/LanguageContext';

export default function ClassSubjectPage() {
  const { t } = useLanguage();
  const { slug = '', dept = '' } = useParams<{ slug: string; dept: string }>();
  const def = classLevelBySlug(slug);
  const subject = decodeURIComponent(dept);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    setBooks(null);
    listPublishedBooks()
      .then((b) => setBooks(b))
      .catch(() => setError(t({ bn: 'বইয়ের তালিকা লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the books — please try again.' })));
  }
  useEffect(load, []);

  if (!def) {
    return (
      <PageShell titleBn="শ্রেণি পাওয়া যায়নি" titleEn="Class not found" wide>
        <EmptyState bn="এই শ্রেণিটি খুঁজে পাওয়া যায়নি।" en="This class could not be found." />
        <p style={{ marginTop: 16 }}>
          <Link to="/#select-class" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব শ্রেণি দেখুন', en: '← See all classes' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  const classBooks = books ? booksForClass(books, def) : [];
  const subjectBooks = classBooks.filter((b) => b.department === subject);
  const totalChapters = subjectBooks.reduce((s, b) => s + (b.chapterCount ?? 0), 0);
  const totalQuestions = subjectBooks.reduce((s, b) => s + (b.questionCount ?? 0), 0);

  return (
    <PageShell titleBn={subject} titleEn={subject} wide>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={`/class/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${def.bn} — সব বিষয়`, en: `← ${def.en} — All subjects` })}
        </Link>
      </p>
      <h2 style={{ color: 'var(--heading)', fontSize: 24, margin: '0 0 4px' }}>{subject}</h2>
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
          bn="এই শ্রেণিতে এই বিষয়ের কোনো বই এখনো প্রকাশিত হয়নি।"
          en="No books for this subject in this class yet."
        />
      ) : null}
      {subjectBooks.length > 0 ? (
        <>
          <p style={{ color: 'var(--muted-ivory)', margin: '0 0 12px' }}>
            {t({ bn: `${subjectBooks.length}টি বই · ${totalChapters}টি পাঠ · ${totalQuestions}টি প্রশ্ন`, en: `${subjectBooks.length} books · ${totalChapters} lessons · ${totalQuestions} questions` })}
          </p>
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
        </>
      ) : null}
    </PageShell>
  );
}
