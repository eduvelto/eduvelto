// Eduvelto — digital library (Phase 2, Step 2 + Step 3).
//
// Lists every Published book, with search + filters (education type,
// class/year, department) and 20 books per page. One-time read (one
// query); drafts are invisible by the rules. Search/filter/pagination
// run client-side over that one fetch, so no composite index is needed.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import { listPublishedBooks, type Book } from '../lib/content';

const PAGE_SIZE = 20;

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  minHeight: 44,
  fontSize: 15,
  border: '1px solid #999',
  borderRadius: 6,
  fontFamily: 'inherit',
  background: '#fff',
};

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let live = true;
    listPublishedBooks()
      .then((b) => {
        if (live) setBooks(b);
      })
      .catch(() => {
        if (live) setError('লাইব্রেরি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the library — please try again.');
      });
    return () => {
      live = false;
    };
  }, []);

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
    <PageShell titleBn="ডিজিটাল লাইব্রেরি" titleEn="Digital Library">
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {books === null && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {books !== null && books.length === 0 ? (
        <EmptyState bn="এখনো কোনো বই প্রকাশিত হয়নি। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No books published yet. Content will appear here once it is published." />
      ) : null}
      {books !== null && books.length > 0 ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="খুঁজুন — বইয়ের নাম, কোড বা বিষয় / Search title, code or subject"
              aria-label="বই খুঁজুন / Search books"
              style={{ ...selectStyle, flex: '1 1 240px' }}
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
              style={selectStyle}
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
              style={selectStyle}
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
              style={selectStyle}
            >
              <option value="">সব বিষয় / All subjects</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <p style={{ color: '#555', margin: '0 0 12px' }}>
            {filtered.length}টি বই পাওয়া গেছে / {filtered.length} books found
            {filtered.length !== books.length ? ` (মোট ${books.length}টি প্রকাশিত / of ${books.length} published)` : ''}
          </p>
          {filtered.length === 0 ? (
            <p>এই খোঁজে কোনো বই পাওয়া যায়নি — ফিল্টার বদলে আবার চেষ্টা করুন। / No books match — try different filters.</p>
          ) : null}
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {pageBooks.map((b) => (
              <li key={b.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                <Link to={`/library/${b.id}`}>{b.title}</Link>
                <span style={{ color: '#555', fontSize: 13 }}>
                  {' '}· {b.paperCode} · {b.department} · {b.classLevel} · {b.chapterCount}টি পাঠ · {b.questionCount}টি প্রশ্ন
                  {b.bilingual ? ' · বাংলা উত্তরসহ' : ''}
                </span>
              </li>
            ))}
          </ul>
          {pageCount > 1 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
              >
                ← আগের / Previous
              </button>
              <span>
                পাতা {safePage} / {pageCount} / Page {safePage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
              >
                পরের / Next →
              </button>
            </div>
          ) : null}
        </>
      ) : null}
      {/* First in-feed ad slot (library list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      <p style={{ marginTop: 16 }}>
        লাইব্রেরিতে বই, নোট ও প্রশ্নোত্তর যোগ করা হবে — নিচে স্ক্রল করলে আরও দেখা যাবে। / Books,
        notes and Q&A will be added to the library — scroll down to see more.
      </p>
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
