// Eduvelto — home (Phase 2, Step 2 + Step 3).
//
// Shows the real published library: counts + a first set of books.
// When nothing is published yet, the honest empty state stays.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import { listPublishedBooks, type Book } from '../lib/content';

export default function HomePage() {
  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    let live = true;
    listPublishedBooks()
      .then((b) => {
        if (live) setBooks(b);
      })
      .catch(() => {
        if (live) setBooks([]);
      });
    return () => {
      live = false;
    };
  }, []);

  const featured = (books ?? []).slice(0, 6);
  const subjects = [...new Set((books ?? []).map((b) => b.department))];

  return (
    <PageShell titleBn="হোম" titleEn="Home">
      {books === null ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {books !== null && books.length === 0 ? (
        <>
          <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
          <p style={{ marginTop: 16 }}>এখানে প্রকাশিত বিষয়, বই ও কুইজ দেখা যাবে। / Published subjects, books and quizzes will appear here.</p>
        </>
      ) : null}
      {books !== null && books.length > 0 ? (
        <>
          <p style={{ fontSize: 17 }}>
            <strong>{books.length}টি বই</strong> প্রকাশিত · {subjects.length}টি বিষয় ·{' '}
            <Link to="/library">সব বই দেখুন / See all books</Link>
          </p>
          <h2 style={{ fontSize: 19, margin: '16px 0 8px' }}>নতুন বই / New books</h2>
          <ul style={{ paddingLeft: 20 }}>
            {featured.map((b) => (
              <li key={b.id} style={{ marginBottom: 8, lineHeight: 1.5 }}>
                <Link to={`/library/${b.id}`}>{b.title}</Link>
                <span style={{ color: '#555', fontSize: 13 }}>
                  {' '}· {b.department} · {b.classLevel} · {b.questionCount}টি প্রশ্ন
                </span>
              </li>
            ))}
          </ul>
          <p>
            <Link to="/directory">শিক্ষা নির্দেশিকা / Education Directory</Link>
            {' · '}
            <Link to="/progress">আমার অগ্রগতি / My Progress</Link>
          </p>
        </>
      ) : null}
      {/* First in-feed ad slot (home list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      <p style={{ marginTop: 16 }}>
        নতুন পাঠ, বই ও পরীক্ষা নিয়মিত যোগ করা হবে — নিচে স্ক্রল করলে আরও দেখা যাবে। / New lessons,
        books and exams are added regularly — scroll down to see more.
      </p>
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
