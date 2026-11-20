// Eduvelto — one book: its published chapters (Phase 2, Step 2 + Step 3).

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { getPublishedBook, listPublishedChapters, type Book, type Chapter } from '../lib/content';

export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookId) return;
    let live = true;
    Promise.all([getPublishedBook(bookId), listPublishedChapters(bookId)])
      .then(([b, ch]) => {
        if (!live) return;
        setBook(b);
        setChapters(ch);
        if (!b) setError('এই বইটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি। / This book was not found or is not published yet.');
      })
      .catch(() => {
        if (live) setError('বইটি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the book — please try again.');
      });
    return () => {
      live = false;
    };
  }, [bookId]);

  return (
    <PageShell titleBn={book ? book.title : 'বই'} titleEn={book ? 'Book' : 'Book'}>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/library">← লাইব্রেরি / Library</Link>
      </p>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {book === null && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {book ? (
        <>
          <p style={{ color: '#555', margin: '0 0 16px' }}>
            {book.department} · {book.classLevel} · কোড {book.paperCode}
            {book.credit ? ` · ক্রেডিট ${book.credit}` : ''}
            {book.marks ? ` · নম্বর ${book.marks}` : ''}
            {book.bilingual ? ' · বাংলা উত্তরসহ' : ''}
          </p>
          <h2 style={{ fontSize: 19, margin: '16px 0 8px' }}>
            পাঠসমূহ / Lessons ({chapters?.length ?? 0})
          </h2>
          {chapters === null ? <p>লোড হচ্ছে… / Loading…</p> : null}
          {chapters !== null && chapters.length === 0 ? (
            <p>এই বইয়ের কোনো পাঠ এখনো প্রকাশিত হয়নি। / No lessons from this book are published yet.</p>
          ) : null}
          <ol style={{ paddingLeft: 20 }}>
            {(chapters ?? []).map((c) => (
              <li key={c.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                <Link to={`/books/${book.id}/chapters/${c.id}`}>{c.title}</Link>
                <span style={{ color: '#555', fontSize: 13 }}> · {c.questionCount}টি প্রশ্ন</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </PageShell>
  );
}
