// Eduvelto — one subject: its published books (Phase 2, Step 2 + Step 3).
//
// :subjectId is the department name (URL-encoded), matching the
// educationDirectory `subject` field.
// (ui/premium-polish: book cards, skeletons, retry on error.)

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, SkeletonCards } from '../components/ui';
import { listPublishedDirectory, type DirectoryRow } from '../lib/content';

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = subjectId ? decodeURIComponent(subjectId) : '';
  const [rows, setRows] = useState<DirectoryRow[] | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setRows(null);
    listPublishedDirectory()
      .then((all) => setRows(all.filter((r) => r.subject === subject || r.department === subject)))
      .catch(() => setError(true));
  }

  useEffect(load, [subject]);

  return (
    <PageShell titleBn={subject || 'বিষয়'} titleEn={subject || 'Subject'} wide>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/directory" style={{ fontWeight: 600 }}>
          ← শিক্ষা নির্দেশিকা / Directory
        </Link>
        {' · '}
        <Link to="/library" style={{ fontWeight: 600 }}>
          লাইব্রেরি / Library
        </Link>
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={load}>
          বিষয়টি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the subject — please try again.
        </AlertBox>
      ) : null}
      {rows === null && !error ? <SkeletonCards count={3} /> : null}
      {rows !== null && rows.length === 0 ? (
        <p>এই বিষয়ে এখনো কোনো বই প্রকাশিত হয়নি। / No books from this subject are published yet.</p>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {(rows ?? []).map((r: DirectoryRow) => (
          <Card key={r.id} hover>
            <Link to={`/library/${r.bookId}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
              {r.paperTitle}
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <Chip tone="outline">{r.classLevel}</Chip>
              <Chip tone="outline">কোড {r.paperCode}</Chip>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
