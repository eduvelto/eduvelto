// Eduvelto — one book: its published chapters (Phase 2, Step 2 + Step 3).
// (ui/premium-polish: book hero card, chapter cards, skeletons, retry.)

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, Skeleton, SkeletonCards } from '../components/ui';
import { getPublishedBook, listPublishedChapters, type Book, type Chapter } from '../lib/content';

export default function BookPage() {
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
        if (!b) setError('এই বইটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি। / This book was not found or is not published yet.');
      })
      .catch(() => {
        setError('বইটি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the book — please try again.');
      });
  }

  useEffect(load, [bookId]);

  return (
    <PageShell titleBn={book ? book.title : 'বই'} titleEn={book ? 'Book' : 'Book'}>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/library" style={{ fontWeight: 600 }}>
          ← লাইব্রেরি / Library
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
              <Chip tone="outline">কোড {book.paperCode}</Chip>
              {book.credit ? <Chip tone="gold">ক্রেডিট {book.credit}</Chip> : null}
              {book.marks ? <Chip tone="gold">নম্বর {book.marks}</Chip> : null}
              {book.bilingual ? <Chip tone="gold">বাংলা উত্তরসহ</Chip> : null}
            </div>
            <p style={{ margin: '12px 0 0', color: '#5A6478' }}>
              {book.chapterCount}টি পাঠ · {book.questionCount}টি প্রশ্ন / {book.chapterCount} lessons ·{' '}
              {book.questionCount} questions
            </p>
          </Card>
          <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '0 0 12px' }}>
            পাঠসমূহ / Lessons ({chapters?.length ?? 0})
          </h2>
          {chapters === null ? <SkeletonCards count={3} /> : null}
          {chapters !== null && chapters.length === 0 ? (
            <p>এই বইয়ের কোনো পাঠ এখনো প্রকাশিত হয়নি। / No lessons from this book are published yet.</p>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {(chapters ?? []).map((c: Chapter, i: number) => (
              <Card key={c.id} hover>
                <Link to={`/books/${book.id}/chapters/${c.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
                  <span style={{ color: '#1E7CE8', marginRight: 6 }}>{i + 1}.</span>
                  {c.title}
                </Link>
                <p style={{ margin: '8px 0 0', color: '#5A6478', fontSize: 14 }}>{c.questionCount}টি প্রশ্ন</p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
