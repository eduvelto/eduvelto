// Eduvelto — shared book card for the role dashboards (Student / Teacher /
// Guardian). Same visual language as the class dashboard BookCard
// (ClassDashboardTabs.tsx): title link, chips, chapter + question counts.
// Visual-only — no data logic lives here.

import { Link } from 'react-router-dom';
import { Card, Chip } from './ui';
import type { Book } from '../lib/content';

export function DashboardBookCard({ book }: { book: Book }) {
  return (
    <Card hover>
      <Link
        to={`/library/${book.id}`}
        style={{ fontWeight: 700, fontSize: 16, color: '#142B3B', lineHeight: 1.5 }}
      >
        {book.title}
      </Link>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {book.paperCode ? <Chip>{book.paperCode}</Chip> : null}
        {book.department ? <Chip tone="outline">{book.department}</Chip> : null}
        {book.classLevel ? <Chip tone="gold">{book.classLevel}</Chip> : null}
      </div>
      <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 14 }}>
        {book.chapterCount}টি পাঠ · {book.questionCount}টি প্রশ্ন
      </p>
    </Card>
  );
}
