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
// (ui/premium-polish: book cards, skeletons, retry on error.)

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card, Chip, SkeletonCards } from '../components/ui';
import {
  listPublishedDirectoryPage,
  type DirectoryRow,
  type PageResult,
} from '../lib/content';

export default function SubjectPage() {
  const { t } = useLanguage();
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = subjectId ? decodeURIComponent(subjectId) : '';
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [lastDoc, setLastDoc] = useState<PageResult<DirectoryRow>['lastDoc']>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // First-page load — also the retry target for the error AlertBox.
  function loadFirst() {
    setRows([]);
    setLastDoc(null);
    setHasMore(false);
    setLoaded(false);
    setError('');
    listPublishedDirectoryPage({ department: subject }, null)
      .then((res) => {
        setRows(res.items);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setLoaded(true);
      })
      .catch(() => {
        setError(t({ bn: 'বিষয়টি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the subject — please try again.' }));
        setLoaded(true);
      });
  }

  useEffect(loadFirst, [subject]);

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listPublishedDirectoryPage({ department: subject }, lastDoc);
      setRows((r) => [...r, ...res.items]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch {
      setError(t({ bn: 'আরও লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load more — please try again.' }));
    } finally {
      setLoadingMore(false);
    }
  }

  const shown = rows.filter((r) => r.subject === subject || r.department === subject);

  return (
    <PageShell titleBn={subject || 'বিষয়'} titleEn={subject || 'Subject'} wide>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/directory" style={{ fontWeight: 600 }}>
          {t({ bn: '← শিক্ষা নির্দেশিকা', en: '← Education Directory' })}
        </Link>
        {' · '}
        <Link to="/library" style={{ fontWeight: 600 }}>
          {t({ bn: 'লাইব্রেরি', en: 'Library' })}
        </Link>
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={loadFirst}>
          {error}
        </AlertBox>
      ) : null}
      {!loaded && !error ? <SkeletonCards count={3} /> : null}
      {loaded && shown.length === 0 && !hasMore ? (
        <p>{t({ bn: 'এই বিষয়ে এখনো কোনো বই প্রকাশিত হয়নি।', en: 'No books from this subject are published yet.' })}</p>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {shown.map((r) => (
          <Card key={r.id} hover>
            <Link to={`/library/${r.bookId}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
              {r.paperTitle}
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <Chip tone="outline">{r.classLevel}</Chip>
              <Chip tone="outline">{t({ bn: `কোড ${r.paperCode}`, en: `Code ${r.paperCode}` })}</Chip>
            </div>
          </Card>
        ))}
      </div>
      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer', marginTop: 8 }}
        >
          {loadingMore ? t({ bn: 'লোড হচ্ছে…', en: 'Loading…' }) : t({ bn: 'আরও দেখুন', en: 'Load more' })}
        </button>
      ) : null}
    </PageShell>
  );
}
