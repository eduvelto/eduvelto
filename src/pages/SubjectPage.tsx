// Eduvelto — one subject: its published books (Phase 2, Step 2 + Step 3; pagination 21 Nov 2026).
//
// :subjectId is the department name (URL-encoded), matching the
// educationDirectory `subject`/`department` fields.
//
// Server-side pagination with the department filter + "load more": pages
// of 50 are appended as the user asks, so a subject page never downloads
// all 609 directory rows at once (the old behaviour). Rows are filtered
// client-side by subject OR department exactly as before, over the pages
// loaded so far.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import {
  listPublishedDirectoryPage,
  type DirectoryRow,
  type PageResult,
} from '../lib/content';

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = subjectId ? decodeURIComponent(subjectId) : '';
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [lastDoc, setLastDoc] = useState<PageResult<DirectoryRow>['lastDoc']>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setRows([]);
    setLastDoc(null);
    setHasMore(false);
    setLoaded(false);
    setError('');
    listPublishedDirectoryPage({ department: subject }, null)
      .then((res) => {
        if (!live) return;
        setRows(res.items);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setLoaded(true);
      })
      .catch(() => {
        if (!live) return;
        setError('বিষয়টি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the subject — please try again.');
        setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, [subject]);

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listPublishedDirectoryPage({ department: subject }, lastDoc);
      setRows((r) => [...r, ...res.items]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch {
      setError('আরও লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load more — please try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  const shown = rows.filter((r) => r.subject === subject || r.department === subject);

  return (
    <PageShell titleBn={subject || 'বিষয়'} titleEn={subject || 'Subject'}>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/directory">← শিক্ষা নির্দেশিকা / Directory</Link>
        {' · '}
        <Link to="/library">লাইব্রেরি / Library</Link>
      </p>
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {!loaded && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {loaded && shown.length === 0 && !hasMore ? (
        <p>এই বিষয়ে এখনো কোনো বই প্রকাশিত হয়নি। / No books from this subject are published yet.</p>
      ) : null}
      <ul style={{ paddingLeft: 20 }}>
        {shown.map((r) => (
          <li key={r.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
            <Link to={`/library/${r.bookId}`}>{r.paperTitle}</Link>
            <span style={{ color: '#555', fontSize: 13 }}>
              {' '}· {r.classLevel} · কোড {r.paperCode}
            </span>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer', marginTop: 8 }}
        >
          {loadingMore ? 'লোড হচ্ছে… / Loading…' : 'আরও দেখুন / Load more'}
        </button>
      ) : null}
    </PageShell>
  );
}
