// Eduvelto — one book: its published chapters (Phase 2, Step 2 + Step 3).
// (ui/premium-polish: book hero card, chapter cards, skeletons, retry.)

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, Skeleton, SkeletonCards } from '../components/ui';
import { getPublishedBook, listPublishedChapters, type Book, type Chapter } from '../lib/content';
import { useLanguage } from '../i18n/LanguageContext';

export default function BookPage() {
  const { t } = useLanguage();
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    if (!bookId) return;
    setError('');
    setBook(null);
    setChapters(null);
    Promise.all([getPublishedBook(bookId), listPublishedChapters(bookId)])
      .then(([b, ch]) => {
        setBook(b);
        setChapters(ch);
        if (!b) setError(t({ bn: 'এই বইটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি।', en: 'This book was not found or is not published yet.' }));
      })
      .catch(() => {
        setError(t({ bn: 'বইটি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the book — please try again.' }));
      });
  }

  useEffect(load, [bookId]);

  return (
    <PageShell titleBn={book ? book.title : 'বই'} titleEn={book ? book.title : 'Book'}>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/library" style={{ fontWeight: 600 }}>
          {t({ bn: '← লাইব্রেরি', en: '← Library' })}
        </Link>
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={load}>
          {error}
        </AlertBox>
      ) : null}
      {book === null && !error ? <Skeleton lines={3} /> : null}
      {book ? (
        <>
          <Card style={{ marginBottom: 24, borderTop: '4px solid #F1B308' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Chip>{book.department}</Chip>
              <Chip tone="outline">{book.classLevel}</Chip>
              <Chip tone="outline">{t({ bn: `কোড ${book.paperCode}`, en: `Code ${book.paperCode}` })}</Chip>
              {book.credit ? <Chip tone="gold">{t({ bn: `ক্রেডিট ${book.credit}`, en: `Credit ${book.credit}` })}</Chip> : null}
              {book.marks ? <Chip tone="gold">{t({ bn: `নম্বর ${book.marks}`, en: `Marks ${book.marks}` })}</Chip> : null}
              {book.bilingual ? <Chip tone="gold">{t({ bn: 'বাংলা উত্তরসহ', en: 'With Bangla answers' })}</Chip> : null}
            </div>
            <p style={{ margin: '12px 0 0', color: '#5A6478' }}>
              {t({ bn: `${book.chapterCount}টি পাঠ · ${book.questionCount}টি প্রশ্ন`, en: `${book.chapterCount} lessons · ${book.questionCount} questions` })}
            </p>
          </Card>
          <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '0 0 12px' }}>
            {t({ bn: 'পাঠসমূহ', en: 'Lessons' })} ({chapters?.length ?? 0})
          </h2>
          {chapters === null ? <SkeletonCards count={3} /> : null}
          {chapters !== null && chapters.length === 0 ? (
            <p>{t({ bn: 'এই বইয়ের কোনো পাঠ এখনো প্রকাশিত হয়নি।', en: 'No lessons from this book are published yet.' })}</p>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {(chapters ?? []).map((c: Chapter, i: number) => (
              <Card key={c.id} hover>
                <Link to={`/books/${book.id}/chapters/${c.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
                  <span style={{ color: '#1E7CE8', marginRight: 6 }}>{i + 1}.</span>
                  {c.title}
                </Link>
                <p style={{ margin: '8px 0 0', color: '#5A6478', fontSize: 14 }}>{t({ bn: `${c.questionCount}টি প্রশ্ন`, en: `${c.questionCount} questions` })}</p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
