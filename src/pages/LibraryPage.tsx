// Eduvelto — digital library (Phase 2, Step 2 + Step 3).
//
// Lists every Published book, with search + filters (education type,
// class/year, department) and 20 books per page. One-time read (one
// query); drafts are invisible by the rules. Search/filter/pagination
// run client-side over that one fetch, so no composite index is needed.
// (ui/premium-polish: filter card, book cards, skeletons, retry on error.)

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, SkeletonCards } from '../components/ui';
import AdSlot from '../components/AdSlot';
import { listPublishedBooks, type Book } from '../lib/content';

const PAGE_SIZE = 20;

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState(false);
  // Deep links from the homepage (search box, subject + level chips):
  // ?q= text search, ?class= class/level, ?dept= department. Absent
  // params behave exactly as before (empty filters).
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState(() => params.get('class') ?? '');
  const [deptFilter, setDeptFilter] = useState(() => params.get('dept') ?? '');
  const [page, setPage] = useState(1);

  function load() {
    setError(false);
    setBooks(null);
    listPublishedBooks()
      .then((b) => setBooks(b))
      .catch(() => setError(true));
  }

  useEffect(load, []);

  const types = useMemo(
    () => [...new Set((books ?? []).map((b) => b.educationType).filter(Boolean))].sort(),
    [books],
  );
  const classes = useMemo(
    () =>
      [...new Set((books ?? []).filter((b) => !typeFilter || b.educationType === typeFilter).map((b) => b.classLevel).filter(Boolean))].sort(),
    [books, typeFilter],
  );
  const departments = useMemo(
    () =>
      [...new Set((books ?? []).filter((b) => (!typeFilter || b.educationType === typeFilter) && (!classFilter || b.classLevel === classFilter)).map((b) => b.department).filter(Boolean))].sort(),
    [books, typeFilter, classFilter],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (books ?? []).filter((b) => {
      if (typeFilter && b.educationType !== typeFilter) return false;
      if (classFilter && b.classLevel !== classFilter) return false;
      if (deptFilter && b.department !== deptFilter) return false;
      if (q) {
        const hay = `${b.title} ${b.paperCode} ${b.department} ${b.subject}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [books, query, typeFilter, classFilter, deptFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageBooks = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  return (
    <PageShell titleBn="ডিজিটাল লাইব্রেরি" titleEn="Digital Library" wide>
      {error ? (
        <AlertBox tone="error" onRetry={load}>
          লাইব্রেরি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the library — please try again.
        </AlertBox>
      ) : null}
      {books === null && !error ? <SkeletonCards count={4} /> : null}
      {books !== null && books.length === 0 ? (
        <EmptyState bn="এখনো কোনো বই প্রকাশিত হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No books published yet. Content will appear here once it is published." />
      ) : null}
      {books !== null && books.length > 0 ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder="খুঁজুন — বইয়ের নাম, কোড বা বিষয় / Search title, code or subject"
                aria-label="বই খুঁজুন / Search books"
                className="ev-input"
                style={{ flex: '1 1 240px' }}
              />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setClassFilter('');
                  setDeptFilter('');
                  resetPage();
                }}
                aria-label="শিক্ষার ধারা / Education type"
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">সব ধারা / All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setDeptFilter('');
                  resetPage();
                }}
                aria-label="শ্রেণি / Class"
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">সব শ্রেণি / All classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  resetPage();
                }}
                aria-label="বিষয় / Department"
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">সব বিষয় / All subjects</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </Card>
          <p style={{ color: '#5A6478', margin: '0 0 12px' }}>
            {filtered.length}টি বই পাওয়া গেছে / {filtered.length} books found
            {filtered.length !== books.length ? ` (মোট ${books.length}টি প্রকাশিত / of ${books.length} published)` : ''}
          </p>
          {filtered.length === 0 ? (
            <p>এই খোঁজে কোনো বই পাওয়া যায়নি — ফিল্টার বদলে আবার চেষ্টা করুন। / No books match — try different filters.</p>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {pageBooks.map((b) => (
              <Card key={b.id} hover>
                <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
                  {b.title}
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <Chip>{b.department}</Chip>
                  <Chip tone="outline">{b.classLevel}</Chip>
                  {b.paperCode ? <Chip tone="outline">কোড {b.paperCode}</Chip> : null}
                </div>
                <p style={{ margin: '10px 0 0', color: '#5A6478', fontSize: 14 }}>
                  {b.chapterCount}টি পাঠ · {b.questionCount}টি প্রশ্ন
                  {b.bilingual ? ' · বাংলা উত্তরসহ' : ''}
                </p>
              </Card>
            ))}
          </div>
          {pageCount > 1 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
                ← আগের / Previous
              </Button>
              <span>
                পাতা {safePage} / {pageCount} / Page {safePage} of {pageCount}
              </span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage >= pageCount}>
                পরের / Next →
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      {/* First in-feed ad slot (library list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      <p style={{ marginTop: 16, color: '#5A6478', fontSize: 14 }}>
        লাইব্রেরিতে বই, নোট ও প্রশ্নোত্তর যোগ করা হবে — নিচে স্ক্রল করলে আরও দেখা যাবে। / Books,
        notes and Q&A will be added to the library — scroll down to see more.
      </p>
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
