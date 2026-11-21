// Eduvelto — digital library (Phase 2, Step 2 + Step 3; pagination 21 Nov 2026).
//
// Server-side pagination: 50 books per page (limit + startAfter), filters
// run server-side — opening the Library no longer downloads all 609 books
// (was ~0.48 MiB + 609 reads; now one page of 50, ~0.04 MiB + 50 reads).
// No exact total is shown: getCountFromServer fails on live Firestore
// right now (resource-exhausted), so the page shows "showing X–Y" +
// Previous/Next only. Filter dropdowns come from the static taxonomy
// Substring search cannot run server-side, so searching loads the full
// Published list ONCE per session (module-level cache in lib/content.ts)
// and searches it client-side — exactly the old behaviour, but only when
// the user actually searches. Each server page is sorted client-side in
// the Library's usual order (class, department, title); the GLOBAL order
// across pages is document-ID order — restoring the old global order
// needs a composite index (owner follow-up, not built here).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';
import {
  getAllPublishedBooksCached,
  listPublishedBooksPage,
  PAGE_SIZE,
  type Book,
  type BookFilters,
  type PageResult,
} from '../lib/content';
import {
  EDUCATION_TYPES,
  libraryClassOptions,
  libraryDepartmentOptions,
} from '../lib/taxonomy';

const SEARCH_PAGE_SIZE = 20;

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
  const [pages, setPages] = useState<PageResult<Book>[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Search mode: substring search needs the whole list, loaded once per session.
  const [searchBooks, setSearchBooks] = useState<Book[] | null>(null);
  const [searchPage, setSearchPage] = useState(1);

  const filters: BookFilters = useMemo(
    () => ({
      educationType: typeFilter || undefined,
      classLevel: classFilter || undefined,
      department: deptFilter || undefined,
    }),
    [typeFilter, classFilter, deptFilter],
  );
  const searching = query.trim().length > 0;

  const loadPage = useCallback(
    async (f: BookFilters, cursor: PageResult<Book>['lastDoc']) => {
      const res = await listPublishedBooksPage(f, cursor);
      return res;
    },
    [],
  );

  // (Re)load page 1 whenever the filters change.
  // NOTE: no exact total is shown — getCountFromServer fails on live
  // Firestore right now (resource-exhausted), so the page shows
  // "showing X–Y" + Previous/Next only (see pagination-test-report §5).
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    setPages([]);
    setPageIndex(0);
    loadPage(filters, null)
      .then((first) => {
        if (!live) return;
        setPages([first]);
        setLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setError('লাইব্রেরি লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the library — please try again.');
        setLoading(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.educationType, filters.classLevel, filters.department]);

  // Load the full list once, only when the user starts searching.
  useEffect(() => {
    if (!searching) {
      setSearchBooks(null);
      return;
    }
    let live = true;
    getAllPublishedBooksCached()
      .then((b) => {
        if (live) setSearchBooks(b);
      })
      .catch(() => {
        if (live) setSearchBooks([]);
      });
    return () => {
      live = false;
    };
  }, [searching]);

  const classes = libraryClassOptions(typeFilter);
  const departments = libraryDepartmentOptions(typeFilter, classFilter);

  const currentPage = pages[pageIndex];
  const pageBooks = currentPage?.items ?? [];
  const shownFrom = pageBooks.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const shownTo = pageIndex * PAGE_SIZE + pageBooks.length;

  async function nextPage() {
    if (!currentPage || !currentPage.hasMore) return;
    setLoading(true);
    try {
      const res = await loadPage(filters, currentPage.lastDoc);
      setPages((p) => [...p, res]);
      setPageIndex((i) => i + 1);
    } catch {
      setError('পরের পাতা লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the next page — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function prevPage() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  const searchFiltered = useMemo(() => {
    if (!searching) return [];
    const q = query.trim().toLowerCase();
    return (searchBooks ?? []).filter((b) => {
      const hay = `${b.title} ${b.paperCode} ${b.department} ${b.subject}`.toLowerCase();
      return hay.includes(q);
    });
  }, [searching, searchBooks, query]);

  const searchPageCount = Math.max(1, Math.ceil(searchFiltered.length / SEARCH_PAGE_SIZE));
  const safeSearchPage = Math.min(searchPage, searchPageCount);
  const searchPageBooks = searchFiltered.slice((safeSearchPage - 1) * SEARCH_PAGE_SIZE, safeSearchPage * SEARCH_PAGE_SIZE);

  return (
    <PageShell titleBn="ডিজিটাল লাইব্রেরি" titleEn="Digital Library">
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {loading && pages.length === 0 && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {!loading && pages.length > 0 && pageBooks.length === 0 && pageIndex === 0 && !searching ? (
        <EmptyState bn="এই বাছাইয়ে কোনো বই পাওয়া যায়নি। ফিল্টার বদলে আবার চেষ্টা করুন।" en="No books match these filters. Try different filters." />
      ) : null}
      {pages.length > 0 ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchPage(1);
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
              }}
              aria-label="শিক্ষার ধারা / Education type"
              style={selectStyle}
            >
              <option value="">সব ধারা / All types</option>
              {EDUCATION_TYPES.map((t) => (
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
          {searching ? (
            <>
              <p style={{ color: '#555', margin: '0 0 12px' }}>
                খোঁজে {searchFiltered.length}টি বই পাওয়া গেছে / {searchFiltered.length} books found
                {searchBooks === null ? ' — খুঁজছি… / searching…' : ''}
              </p>
              {searchBooks !== null && searchFiltered.length === 0 ? (
                <p>এই খোঁজে কোনো বই পাওয়া যায়নি — ফিল্টার বদলে আবার চেষ্টা করুন। / No books match — try different filters.</p>
              ) : null}
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {searchPageBooks.map((b) => (
                  <li key={b.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                    <Link to={`/library/${b.id}`}>{b.title}</Link>
                    <span style={{ color: '#555', fontSize: 13 }}>
                      {' '}· {b.paperCode} · {b.department} · {b.classLevel} · {b.chapterCount}টি পাঠ · {b.questionCount}টি প্রশ্ন
                      {b.bilingual ? ' · বাংলা উত্তরসহ' : ''}
                    </span>
                  </li>
                ))}
              </ul>
              {searchPageCount > 1 ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                    disabled={safeSearchPage <= 1}
                    style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
                  >
                    ← আগের / Previous
                  </button>
                  <span>
                    পাতা {safeSearchPage} / {searchPageCount} / Page {safeSearchPage} of {searchPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchPage((p) => Math.min(searchPageCount, p + 1))}
                    disabled={safeSearchPage >= searchPageCount}
                    style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
                  >
                    পরের / Next →
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p style={{ color: '#555', margin: '0 0 12px' }}>
                দেখাচ্ছি {shownFrom}–{shownTo} / Showing {shownFrom}–{shownTo}
              </p>
              {pageBooks.length === 0 && !loading ? (
                <p>এই বাছাইয়ে কোনো বই পাওয়া যায়নি — ফিল্টার বদলে আবার চেষ্টা করুন। / No books match — try different filters.</p>
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
              {currentPage?.hasMore || pageIndex > 0 ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={prevPage}
                    disabled={pageIndex <= 0}
                    style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
                  >
                    ← আগের / Previous
                  </button>
                  <span>
                    পাতা {pageIndex + 1} / Page {pageIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={nextPage}
                    disabled={!currentPage?.hasMore || loading}
                    style={{ padding: '10px 16px', minHeight: 44, borderRadius: 6, border: '1px solid #0A1F44', background: '#fff', color: '#0A1F44', cursor: 'pointer' }}
                  >
                    পরের / Next →
                  </button>
                </div>
              ) : null}
            </>
          )}
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
