// Eduvelto — one subject: its published books (Phase 2, Step 2 + Step 3).
//
// :subjectId is the department name (URL-encoded), matching the
// educationDirectory `subject` field.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { listPublishedDirectory, type DirectoryRow } from '../lib/content';
import { cachedFetch, CACHE_KEYS } from '../lib/cache';

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = subjectId ? decodeURIComponent(subjectId) : '';
  const [rows, setRows] = useState<DirectoryRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    // Same session cache as the Directory page: one 609-row read per
    // session, not one per subject visited.
    cachedFetch(CACHE_KEYS.publishedDirectory, listPublishedDirectory)
      .then((all) => {
        if (live) setRows(all.filter((r) => r.subject === subject || r.department === subject));
      })
      .catch(() => {
        if (live) setError('বিষয়টি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the subject — please try again.');
      });
    return () => {
      live = false;
    };
  }, [subject]);

  return (
    <PageShell titleBn={subject || 'বিষয়'} titleEn={subject || 'Subject'}>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/directory">← শিক্ষা নির্দেশিকা / Directory</Link>
        {' · '}
        <Link to="/library">লাইব্রেরি / Library</Link>
      </p>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {rows === null && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {rows !== null && rows.length === 0 ? (
        <p>এই বিষয়ে এখনো কোনো বই প্রকাশিত হয়নি। / No books from this subject are published yet.</p>
      ) : null}
      <ul style={{ paddingLeft: 20 }}>
        {(rows ?? []).map((r) => (
          <li key={r.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
            <Link to={`/library/${r.bookId}`}>{r.paperTitle}</Link>
            <span style={{ color: '#555', fontSize: 13 }}>
              {' '}· {r.classLevel} · কোড {r.paperCode}
            </span>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
