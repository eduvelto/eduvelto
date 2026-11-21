// Eduvelto — education directory (Phase 2, Step 2 + Step 3; pagination 21 Nov 2026).
//
// Server-side pagination: 50 rows per page (limit + startAfter), cascade
// filters run server-side — opening the Directory no longer downloads all
// 609 rows. No exact total is shown: getCountFromServer fails on live
// Firestore right now (resource-exhausted). Filter dropdowns come from
// the static taxonomy (src/lib/taxonomy.ts) because Firestore has no
// DISTINCT query. Each server page is sorted client-side in the
// Directory's usual order (class, department, paper title); the GLOBAL
// order across pages is document-ID order — restoring the old global
// order needs a composite index (owner follow-up, not built here).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import {
  listPublishedDirectoryPage,
  PAGE_SIZE,
  type DirectoryFilters,
  type DirectoryRow,
  type PageResult,
} from '../lib/content';
import {
  EDUCATION_TYPES,
  directoryBoardOptions,
  directoryClassOptions,
  directoryDepartmentOptions,
  directoryProgramOptions,
} from '../lib/taxonomy';

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  minHeight: 44,
  fontSize: 15,
  border: '1px solid #999',
  borderRadius: 6,
  fontFamily: 'inherit',
  background: '#fff',
};

export default function DirectoryPage() {
  const [pages, setPages] = useState<PageResult<DirectoryRow>[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [board, setBoard] = useState('');
  const [program, setProgram] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [dept, setDept] = useState('');

  const filters: DirectoryFilters = useMemo(
    () => ({
      type: type || undefined,
      board: board || undefined,
      program: program || undefined,
      classLevel: classLevel || undefined,
      department: dept || undefined,
    }),
    [type, board, program, classLevel, dept],
  );

  const loadPage = useCallback(
    async (f: DirectoryFilters, cursor: PageResult<DirectoryRow>['lastDoc']) =>
      listPublishedDirectoryPage(f, cursor),
    [],
  );

  // (Re)load page 1 whenever the filters change.
  // NOTE: no exact total — getCountFromServer fails on live Firestore
  // right now (resource-exhausted); see pagination-test-report §5.
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
        setError('নির্দেশিকা লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the directory — please try again.');
        setLoading(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.board, filters.program, filters.classLevel, filters.department]);

  const boards = directoryBoardOptions(type);
  const programs = directoryProgramOptions(type, board);
  const classes = directoryClassOptions(type, board, program);
  const departments = directoryDepartmentOptions(type, board, program, classLevel);

  const currentPage = pages[pageIndex];
  const pageRows = currentPage?.items ?? [];
  const shownFrom = pageRows.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const shownTo = pageIndex * PAGE_SIZE + pageRows.length;

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

  return (
    <PageShell titleBn="শিক্ষা নির্দেশিকা" titleEn="Education Directory">
      {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
      {loading && pages.length === 0 && !error ? <p>লোড হচ্ছে… / Loading…</p> : null}
      {!loading && pages.length > 0 && pageRows.length === 0 && pageIndex === 0 ? (
        <EmptyState bn="এই বাছাইয়ে কিছু পাওয়া যায়নি। উপরের ধাপ বদলে আবার চেষ্টা করুন।" en="Nothing matches these filters. Try different steps above." />
      ) : null}
      {pages.length > 0 && pageRows.length > 0 ? (
        <>
          <p style={{ color: '#555', margin: '0 0 12px' }}>
            ধাপে ধাপে বাছুন: ধারা → বোর্ড → প্রোগ্রাম → শ্রেণি → বিষয় / Pick step by step: type →
            board → program → class → subject.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setBoard('');
                setProgram('');
                setClassLevel('');
                setDept('');
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
              value={board}
              onChange={(e) => {
                setBoard(e.target.value);
                setProgram('');
                setClassLevel('');
                setDept('');
              }}
              aria-label="বোর্ড / Board"
              style={selectStyle}
            >
              <option value="">সব বোর্ড / All boards</option>
              {boards.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                setClassLevel('');
                setDept('');
              }}
              aria-label="প্রোগ্রাম / Program"
              style={selectStyle}
            >
              <option value="">সব প্রোগ্রাম / All programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={classLevel}
              onChange={(e) => {
                setClassLevel(e.target.value);
                setDept('');
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
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
              }}
              aria-label="বিষয় / Subject"
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
            দেখাচ্ছি {shownFrom}–{shownTo} / Showing {shownFrom}–{shownTo}
          </p>
          {pageRows.length === 0 && !loading ? (
            <p>এই বাছাইয়ে কিছু পাওয়া যায়নি — উপরের ধাপ বদলে আবার চেষ্টা করুন। / Nothing matches — try different steps above.</p>
          ) : null}
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {pageRows.map((r) => (
              <li key={r.id} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                <Link to={`/library/${r.bookId}`}>{r.paperTitle}</Link>
                <span style={{ color: '#555', fontSize: 13 }}>
                  {' '}· {r.type} · {r.program} · {r.classLevel} · {r.department} · কোড {r.paperCode}
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
      ) : null}
    </PageShell>
  );
}
