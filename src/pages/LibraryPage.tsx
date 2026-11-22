// Eduvelto — digital library (Phase 2, Step 2 + Step 3; pagination 21 Nov 2026).
//
// Eduvelto — Digital Library (Phase 2, Step 2; pagination 21 Nov 2026; class-wise design 21 Nov 2026).
//
// Server-side pagination: 50 books per page (limit + startAfter), filters
// run server-side — opening the Library no longer downloads all 609 books
// (was ~0.48 MiB + 609 reads; now one page of 50, ~0.04 MiB + 50 reads).
// No exact total is shown: getCountFromServer fails on live Firestore
// right now (resource-exhausted), so the page shows "showing X–Y" +
// Previous/Next only. Filter dropdowns come from the static taxonomy.
// Substring search cannot run server-side, so searching loads the full
// Published list ONCE per session (module-level cache in lib/content.ts)
// and searches it client-side — exactly the old behaviour, but only when
// the user actually searches. Each server page is sorted client-side in
// the Library's usual order (class, department, title); the GLOBAL order
// across pages is document-ID order — restoring the old global order
// needs a composite index (owner follow-up, not built here).
//
// Class filter (owner brief 21 Nov 13:20): the dropdown lists EVERY class
// level first (level:<slug> options from lib/classLevels, including
// Class 1–5 and Class 6–8 with zero books) plus raw extras found in live
// data. A level with no books shows an honest coming-soon card, never
// fake books. Deep links (?q=, ?type=, ?class=, ?dept=) from the homepage
// and class dashboards initialise the filters.
// (ui/premium-polish: filter card, book cards, skeletons, retry on error.)

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, SkeletonCards } from '../components/ui';
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
  ALL_CLASS_LEVELS,
  EDUCATION_TYPES,
  LIBRARY_DEPARTMENTS,
  libraryDepartmentOptions,
} from '../lib/taxonomy';
import {
  classFilterFromParam,
  classFilterOptions,
  levelOfClassFilter,
} from '../lib/classLevels';

const SEARCH_PAGE_SIZE = 20;

export default function LibraryPage() {
  const { t } = useLanguage();
  // Deep links from the homepage (search box, subject + level chips) and
  // from class dashboards (?type= education type):
  // ?q= text search, ?type= education type, ?class= class/level, ?dept= department. Absent
  // params behave exactly as before (empty filters).
  const [params] = useSearchParams();
  const [pages, setPages] = useState<PageResult<Book>[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [typeFilter, setTypeFilter] = useState(() => params.get('type') ?? '');
  // `?class=` accepts a level slug (class-1-5, hsc, …) or a raw classLevel
  // value (SSC, 1st Year, …) — see lib/classLevels.
  const [classFilter, setClassFilter] = useState(() => classFilterFromParam(params.get('class')));
  const [deptFilter, setDeptFilter] = useState(() => params.get('dept') ?? '');

  // Search mode: substring search needs the whole list, loaded once per session.
  const [searchBooks, setSearchBooks] = useState<Book[] | null>(null);
  const [searchPage, setSearchPage] = useState(1);

  // The level behind the selected class option, if any — used for the
  // honest coming-soon empty state (never fake books).
  const selectedLevel = levelOfClassFilter(classFilter);
  // Levels with no books yet (Class 1–5, Class 6–8): no server query —
  // the coming-soon card is the whole result.
  const levelEmpty = !!selectedLevel && !selectedLevel.educationType;

  // Translate the class filter into server-side BookFilters. A level with
  // one classLevel maps to that value; Honours & Masters (4 years) maps to
  // educationType only — every Higher book belongs to the level.
  const filters: BookFilters = useMemo(() => {
    if (classFilter.startsWith('level:')) {
      const def = levelOfClassFilter(classFilter);
      if (!def || !def.educationType) {
        return { educationType: typeFilter || undefined, department: deptFilter || undefined };
      }
      if (def.classLevels.length === 1) {
        return { educationType: def.educationType, classLevel: def.classLevels[0], department: deptFilter || undefined };
      }
      return { educationType: def.educationType, department: deptFilter || undefined };
    }
    return {
      educationType: typeFilter || undefined,
      classLevel: classFilter || undefined,
      department: deptFilter || undefined,
    };
  }, [typeFilter, classFilter, deptFilter]);
  const searching = query.trim().length > 0;

  const loadPage = useCallback(
    async (f: BookFilters, cursor: PageResult<Book>['lastDoc']) => {
      const res = await listPublishedBooksPage(f, cursor);
      return res;
    },
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
        setError(t({ bn: 'লাইব্রেরি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the library — please try again.' }));
        setLoading(false);
      });
  }

  // (Re)load page 1 whenever the filters change.
  // NOTE: no exact total is shown — getCountFromServer fails on live
  // Firestore right now (resource-exhausted), so the page shows
  // "showing X–Y" + Previous/Next only (see pagination-test-report §5).
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
        setError(t({ bn: 'লাইব্রেরি লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the library — please try again.' }));
        setLoading(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.educationType, filters.classLevel, filters.department, levelEmpty]);

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

  // Class options list EVERY class level — including Class 1–5 and Class
  // 6–8, which have zero books (owner brief 21 Nov 13:20). Levels are
  // offered as `level:<slug>` options; any extra classLevel found in live
  // data that no level covers stays as a raw option.
  const classes = classFilterOptions(ALL_CLASS_LEVELS, typeFilter || null);
  const departments = useMemo(() => {
    if (classFilter.startsWith('level:')) {
      const def = levelOfClassFilter(classFilter);
      if (!def || !def.educationType) return [];
      const out = new Set<string>();
      for (const cl of def.classLevels) {
        for (const d of LIBRARY_DEPARTMENTS[def.educationType]?.[cl] ?? []) out.add(d);
      }
      return [...out].sort();
    }
    return libraryDepartmentOptions(typeFilter, classFilter);
  }, [typeFilter, classFilter]);

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
      setError(t({ bn: 'পরের পাতা লোড করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not load the next page — please try again.' }));
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
    <PageShell titleBn="ডিজিটাল লাইব্রেরি" titleEn="Digital Library" wide>
      {error ? (
        <AlertBox tone="error" onRetry={reloadFirst}>
          {error}
        </AlertBox>
      ) : null}
      {loading && pages.length === 0 && !error && !levelEmpty ? <SkeletonCards count={4} /> : null}
      {!loading && pages.length > 0 && pageBooks.length === 0 && pageIndex === 0 && !searching && !levelEmpty ? (
        <EmptyState bn="এই বাছাইয়ে কোনো বই পাওয়া যায়নি। ফিল্টার বদলে আবার চেষ্টা করুন।" en="No books match these filters. Try different filters." />
      ) : null}
      {pages.length > 0 || levelEmpty ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchPage(1);
                }}
                placeholder={t({ bn: 'খুঁজুন — বইয়ের নাম, কোড বা বিষয়', en: 'Search title, code or subject' })}
                aria-label={t({ bn: 'বই খুঁজুন', en: 'Search books' })}
                className="ev-input"
                style={{ flex: '1 1 240px' }}
              />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setClassFilter('');
                  setDeptFilter('');
                }}
                aria-label={t({ bn: 'শিক্ষার ধারা', en: 'Education type' })}
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">{t({ bn: 'সব ধারা', en: 'All types' })}</option>
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
                aria-label={t({ bn: 'শ্রেণি', en: 'Class' })}
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">{t({ bn: 'সব শ্রেণি', en: 'All classes' })}</option>
                {classes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value.startsWith('level:')
                      ? t(levelOfClassFilter(c.value) ?? { bn: c.labelBn, en: c.labelEn })
                      : t({ bn: c.labelBn, en: c.labelEn })}
                  </option>
                ))}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                }}
                aria-label={t({ bn: 'বিষয়', en: 'Department' })}
                className="ev-select"
                style={{ flex: '1 1 160px' }}
              >
                <option value="">{t({ bn: 'সব বিষয়', en: 'All subjects' })}</option>
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
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                {t({ bn: `${selectedLevel.bn} — শীঘ্রই আসছে!`, en: `${selectedLevel.en} — Coming soon!` })}
              </div>
              <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>
                {t({ bn: `${selectedLevel.bn}-এর বই এখনো লাইব্রেরিতে প্রকাশিত হয়নি — বই, পাঠ ও প্রশ্ন তৈরি হচ্ছে। প্রকাশিত হলেই এখানে দেখতে পাবে।`, en: `No books for ${selectedLevel.en} are published yet — books, lessons and questions are being prepared.` })}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to={`/class/${selectedLevel.slug}`} style={{ fontWeight: 600 }}>
                  {t({ bn: `${selectedLevel.bn} ড্যাশবোর্ড →`, en: `${selectedLevel.en} dashboard →` })}
                </Link>
                <Link
                  to="/library"
                  onClick={() => {
                    setTypeFilter('');
                    setClassFilter('');
                    setDeptFilter('');
                  }}
                  style={{ fontWeight: 600 }}
                >
                  {t({ bn: 'সব বই দেখুন →', en: 'See all books →' })}
                </Link>
              </div>
            </Card>
          ) : searching ? (
            <>
              <p style={{ color: 'var(--ink-soft)', margin: '0 0 12px' }}>
                {t({ bn: `খোঁজে ${searchFiltered.length}টি বই পাওয়া গেছে${searchBooks === null ? ' — খুঁজছি…' : ''}`, en: `${searchFiltered.length} books found${searchBooks === null ? ' — searching…' : ''}` })}
              </p>
              {searchBooks !== null && searchFiltered.length === 0 ? (
                <p>{t({ bn: 'এই খোঁজে কোনো বই পাওয়া যায়নি — ফিল্টার বদলে আবার চেষ্টা করুন।', en: 'No books match — try different filters.' })}</p>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {searchPageBooks.map((b) => (
                  <Card key={b.id} hover>
                    <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
                      {b.title}
                    </Link>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      <Chip>{b.department}</Chip>
                      <Chip tone="outline">{b.classLevel}</Chip>
                      {b.paperCode ? <Chip tone="outline">{t({ bn: `কোড ${b.paperCode}`, en: `Code ${b.paperCode}` })}</Chip> : null}
                    </div>
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                      {t({ bn: `${b.chapterCount}টি পাঠ · ${b.questionCount}টি প্রশ্ন${b.bilingual ? ' · বাংলা উত্তরসহ' : ''}`, en: `${b.chapterCount} lessons · ${b.questionCount} questions${b.bilingual ? ' · with Bangla answers' : ''}` })}
                    </p>
                  </Card>
                ))}
              </div>
              {searchPageCount > 1 ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
                  <Button variant="outline" onClick={() => setSearchPage((p) => Math.max(1, p - 1))} disabled={safeSearchPage <= 1}>
                    {t({ bn: '← আগের', en: '← Previous' })}
                  </Button>
                  <span>
                    {t({ bn: `পাতা ${safeSearchPage} / ${searchPageCount}`, en: `Page ${safeSearchPage} of ${searchPageCount}` })}
                  </span>
                  <Button variant="outline" onClick={() => setSearchPage((p) => Math.min(searchPageCount, p + 1))} disabled={safeSearchPage >= searchPageCount}>
                    {t({ bn: 'পরের →', en: 'Next →' })}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p style={{ color: 'var(--ink-soft)', margin: '0 0 12px' }}>
                {t({ bn: `দেখাচ্ছি ${shownFrom}–${shownTo}`, en: `Showing ${shownFrom}–${shownTo}` })}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {pageBooks.map((b) => (
                  <Card key={b.id} hover>
                    <Link to={`/library/${b.id}`} style={{ fontWeight: 700, fontSize: 16, color: 'var(--heading)', lineHeight: 1.5 }}>
                      {b.title}
                    </Link>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      <Chip>{b.department}</Chip>
                      <Chip tone="outline">{b.classLevel}</Chip>
                      {b.paperCode ? <Chip tone="outline">{t({ bn: `কোড ${b.paperCode}`, en: `Code ${b.paperCode}` })}</Chip> : null}
                    </div>
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                      {t({ bn: `${b.chapterCount}টি পাঠ · ${b.questionCount}টি প্রশ্ন${b.bilingual ? ' · বাংলা উত্তরসহ' : ''}`, en: `${b.chapterCount} lessons · ${b.questionCount} questions${b.bilingual ? ' · with Bangla answers' : ''}` })}
                    </p>
                  </Card>
                ))}
              </div>
              {currentPage?.hasMore || pageIndex > 0 ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
                  <Button variant="outline" onClick={prevPage} disabled={pageIndex <= 0}>
                    {t({ bn: '← আগের', en: '← Previous' })}
                  </Button>
                  <span>
                    {t({ bn: `পাতা ${pageIndex + 1}`, en: `Page ${pageIndex + 1}` })}
                  </span>
                  <Button variant="outline" onClick={nextPage} disabled={!currentPage?.hasMore || loading}>
                    {t({ bn: 'পরের →', en: 'Next →' })}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : null}
      {/* First in-feed ad slot (library list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>
        {t({ bn: 'লাইব্রেরিতে বই, নোট ও প্রশ্নোত্তর যোগ করা হবে — নিচে স্ক্রল করলে আরও দেখা যাবে।', en: 'Books, notes and Q&A will be added to the library — scroll down to see more.' })}
      </p>
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
