// Eduvelto — education directory (Phase 2, Step 2 + Step 3; pagination 21 Nov 2026).
//
// Eduvelto — Education Directory (Phase 2, Step 2; pagination 21 Nov 2026; class-wise design 21 Nov 2026).
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
//
// Browse the cascade type → board → program → class → subject. Class
// options list EVERY class level — including Class 1–5 and Class 6–8,
// which have no entries yet (owner brief 21 Nov 13:20). A level with no
// entries shows an honest coming-soon card, never fake entries.
// (ui/premium-polish: filter card, result cards, skeletons, retry on error.)

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, SkeletonCards } from '../components/ui';
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
import {
  classFilterOptions,
  levelOfClassFilter,
} from '../lib/classLevels';

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

  // The level behind the selected class option, if any.
  const selectedLevel = levelOfClassFilter(classLevel);
  // Levels with no entries yet (Class 1–5, Class 6–8): no server query —
  // the coming-soon card is the whole result.
  const levelEmpty = !!selectedLevel && !selectedLevel.educationType;

  // Translate the class filter into server-side DirectoryFilters. A level
  // with one classLevel maps to that value; Honours & Masters (4 years)
  // maps to type only — every Higher row belongs to the level.
  const filters: DirectoryFilters = useMemo(() => {
    if (classLevel.startsWith('level:')) {
      const def = levelOfClassFilter(classLevel);
      if (!def || !def.educationType) {
        return { type: type || undefined, board: board || undefined, program: program || undefined, department: dept || undefined };
      }
      if (def.classLevels.length === 1) {
        return { type: def.educationType, board: board || undefined, program: program || undefined, classLevel: def.classLevels[0], department: dept || undefined };
      }
      return { type: def.educationType, board: board || undefined, program: program || undefined, department: dept || undefined };
    }
    return {
      type: type || undefined,
      board: board || undefined,
      program: program || undefined,
      classLevel: classLevel || undefined,
      department: dept || undefined,
    };
  }, [type, board, program, classLevel, dept]);

  const loadPage = useCallback(
    async (f: DirectoryFilters, cursor: PageResult<DirectoryRow>['lastDoc']) =>
      listPublishedDirectoryPage(f, cursor),
    [],
  );

  // Reload the first page — retry target for the error AlertBox.
  function reloadFirst() {
    setError('');
    setLoading(true);
    loadPage(filters, null)
      .then((first) => {
        setPages([first]);
        setPageIndex(0);
        setLoading(false);
      })
      .catch(() => {
        setError('নির্দেশিকা লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the directory — please try again.');
        setLoading(false);
      });
  }

  // (Re)load page 1 whenever the filters change.
  // NOTE: no exact total — getCountFromServer fails on live Firestore
  // right now (resource-exhausted); see pagination-test-report §5.
  useEffect(() => {
    if (levelEmpty) {
      setPages([]);
      setPageIndex(0);
      setLoading(false);
      setError('');
      return;
    }
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
  }, [filters.type, filters.board, filters.program, filters.classLevel, filters.department, levelEmpty]);

  const boards = directoryBoardOptions(type);
  const programs = directoryProgramOptions(type, board);
  // Class options list EVERY class level — including Class 1–5 and Class
  // 6–8, which have no entries yet (owner brief 21 Nov 13:20). Levels are
  // offered as `level:<slug>` options; extra classLevel values found in
  // live rows stay as raw options.
  const classes = classFilterOptions(directoryClassOptions(type, board, program), type || null);
  const departments = useMemo(() => {
    if (classLevel.startsWith('level:')) {
      const def = levelOfClassFilter(classLevel);
      if (!def || !def.educationType) return [];
      const out = new Set<string>();
      for (const cl of def.classLevels) {
        for (const d of directoryDepartmentOptions(def.educationType, board, program, cl)) out.add(d);
      }
      return [...out].sort();
    }
    return directoryDepartmentOptions(type, board, program, classLevel);
  }, [type, board, program, classLevel]);

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
    <PageShell titleBn="শিক্ষা নির্দেশিকা" titleEn="Education Directory" wide>
      {error ? (
        <AlertBox tone="error" onRetry={reloadFirst}>
          নির্দেশিকা লোড করা যায়নি — আবার চেষ্টা করুন। / Could not load the directory — please try again.
        </AlertBox>
      ) : null}
      {loading && pages.length === 0 && !error && !levelEmpty ? <SkeletonCards count={4} /> : null}
      {!loading && pages.length > 0 && pageRows.length === 0 && pageIndex === 0 && !levelEmpty ? (
        <EmptyState bn="এই বাছাইয়ে কিছু পাওয়া যায়নি। উপরের ধাপ বদলে আবার চেষ্টা করুন।" en="Nothing matches these filters. Try different steps above." />
      ) : null}
      {pages.length > 0 || levelEmpty ? (
        <>
          <p style={{ color: '#5A6478', margin: '0 0 12px' }}>
            ধাপে ধাপে বাছুন: ধারা → বোর্ড → প্রোগ্রাম → শ্রেণি → বিষয় / Pick step by step: type →
            board → program → class → subject.
          </p>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                className="ev-select"
                style={{ flex: '1 1 160px' }}
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
                className="ev-select"
                style={{ flex: '1 1 160px' }}
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
                className="ev-select"
                style={{ flex: '1 1 160px' }}
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
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">সব শ্রেণি / All classes</option>
                {classes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                }}
                aria-label="বিষয় / Subject"
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
          {levelEmpty && selectedLevel ? (
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>
                {selectedLevel.bn} — শীঘ্রই আসছে! / Coming soon
              </div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 15, lineHeight: 1.7 }}>
                {selectedLevel.bn}-এর কোনো নির্দেশিকা এন্ট্রি এখনো প্রকাশিত হয়নি — তথ্য তৈরি হচ্ছে।
                প্রকাশিত হলেই এখানে দেখতে পাবে। / No directory entries for {selectedLevel.en} yet
                — information is being prepared.
              </p>
              <p style={{ margin: 0 }}>
                <Link to={`/class/${selectedLevel.slug}`} style={{ fontWeight: 600 }}>
                  {selectedLevel.bn} ড্যাশবোর্ড →
                </Link>
              </p>
            </Card>
          ) : (
            <>
              <p style={{ color: '#555', margin: '0 0 12px' }}>
                দেখাচ্ছি {shownFrom}–{shownTo} / Showing {shownFrom}–{shownTo}
              </p>
              {pageRows.length === 0 && !loading ? (
                <p>এই বাছাইয়ে কিছু পাওয়া যায়নি — উপরের ধাপ বদলে আবার চেষ্টা করুন। / Nothing matches — try different steps above.</p>
              ) : null}
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {pageRows.map((r) => (
              <Card key={r.id} hover>
                <Link to={`/library/${r.bookId}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
                  {r.paperTitle}
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <Chip>{r.department}</Chip>
                  <Chip tone="outline">{r.classLevel}</Chip>
                  <Chip tone="outline">কোড {r.paperCode}</Chip>
                </div>
                <p style={{ margin: '10px 0 0', color: '#5A6478', fontSize: 14 }}>
                  {r.type} · {r.program}
                </p>
              </Card>
            ))}
          </div>
          {currentPage?.hasMore || pageIndex > 0 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <Button variant="outline" onClick={prevPage} disabled={pageIndex <= 0}>
                ← আগের / Previous
              </Button>
              <span>
                পাতা {pageIndex + 1} / Page {pageIndex + 1}
              </span>
              <Button variant="outline" onClick={nextPage} disabled={!currentPage?.hasMore || loading}>
                পরের / Next →
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}
