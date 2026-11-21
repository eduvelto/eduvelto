// Eduvelto — Education Directory (cascading filters, 21 Nov 2026).
//
// 5 steps (General/Higher): Education Type → Program / Level → Class / Year /
// Semester → Group / Department / Trade → Search.
// 3 steps (Madrasa/Technical): Type → Program / Level → Search — their Class
// and Group values are IDENTICAL to the Level values, so steps 3–4 collapse.
// NO board step, NO book-type step, NO subject step, NO author search
// (owner 21 Nov 2026, binding). Every step has an All option. Step N+1
// enables after N; changing an earlier step resets the later ones.
// Search (step 5) stays usable on its own — it narrows within the current
// cascade selection, and with no selection it searches all books.
//
// Queries translate the cascade to the LEGACY fields live rows carry
// (cascadeToDirectoryFilters in src/lib/content.ts) — live rows do not yet
// have stream/level/group (live writes need separate owner approval).
// Server pagination 50/page, orderBy(documentId); each server page is
// re-sorted client-side (class, department, paper title). No exact total:
// getCountFromServer fails on live Firestore (resource-exhausted).
// Search loads the full Published list ONCE per session and searches it
// client-side (title + subject + paperCode only), 20/page — same pattern
// as LibraryPage; plain browsing/filtering never touches that cache.
//
// Deep links: ?stream= ?level= ?class= ?group= ?q=
// Legacy: ?type= maps to stream (+level when unambiguous: SSC/HSC/Higher),
// ?dept= is an alias for ?group=.
// Class 1–5 / 6–8 have ZERO books and are NOT cascade options (owner:
// "ja nai bad diba") — their Coming Soon state lives on the class
// dashboards and in the Library, not in this cascade; the old Directory
// `level:` coming-soon trigger (a class-dropdown option with no data)
// is removed with it.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, SkeletonCards } from '../components/ui';
import { CascadeSteps, type CascadeStep } from '../components/CascadeSteps';
import {
  cascadeToDirectoryFilters,
  compareDirectoryRows,
  getAllPublishedDirectoryCached,
  listPublishedDirectoryPage,
  PAGE_SIZE,
  type CascadeSelection,
  type DirectoryFilters,
  type DirectoryRow,
  type PageResult,
} from '../lib/content';
import {
  CASCADE_STREAMS,
  cascadeClasses,
  cascadeGroups,
  cascadeStreamDef,
} from '../lib/taxonomy';
import { T, useLanguage } from '../i18n/LanguageContext';

const SEARCH_PAGE_SIZE = 20;

type ErrorKind = '' | 'load' | 'next';

/** Client-side cascade match, for the search path (full list is cached). */
function rowMatchesCascade(row: DirectoryRow, f: DirectoryFilters): boolean {
  if (f.type && row.type !== f.type) return false;
  if (f.types && !f.types.includes(row.type)) return false;
  if (f.program && row.program !== f.program) return false;
  if (f.classLevel && row.classLevel !== f.classLevel) return false;
  if (f.department && row.department !== f.department) return false;
  return true;
}

export default function DirectoryPage() {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();

  // ---- cascade state (deep-link initialised, validated against the taxonomy) ----
  const [stream, setStream] = useState<CascadeSelection['stream']>(() => {
    const s = searchParams.get('stream') ?? '';
    if ((CASCADE_STREAMS as { stream: string }[]).some((d) => d.stream === s)) {
      return s as CascadeSelection['stream'];
    }
    const type = searchParams.get('type') ?? '';
    if (type === 'SSC' || type === 'HSC') return 'general';
    if (type === 'Higher') return 'higher';
    if (type === 'Madrasa') return 'madrasa';
    if (type === 'Technical') return 'technical';
    return '';
  });
  const [level, setLevel] = useState(() => {
    const s = stream;
    const l = searchParams.get('level') ?? '';
    if (s && l && cascadeStreamDef(s)?.levels.some((d) => d.value === l)) return l;
    const type = searchParams.get('type') ?? '';
    if (type === 'SSC') return 'Secondary';
    if (type === 'HSC') return 'Higher Secondary';
    if (type === 'Higher') return 'Honours';
    return '';
  });
  const [classLevel, setClassLevel] = useState(() => {
    const c = searchParams.get('class') ?? '';
    if (stream && level && c && cascadeClasses(stream, level).some((o) => o.value === c)) return c;
    return '';
  });
  const [group, setGroup] = useState(() => {
    const g = searchParams.get('group') ?? searchParams.get('dept') ?? '';
    if (stream && level && g && cascadeGroups(stream, level, classLevel).some((o) => o.value === g)) return g;
    return '';
  });
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');

  // ---- browsing state ----
  const [pages, setPages] = useState<PageResult<DirectoryRow>[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<ErrorKind>('');
  const [loading, setLoading] = useState(true);

  // ---- search state ----
  const searching = query.trim().length > 0;
  const [allRows, setAllRows] = useState<DirectoryRow[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(0);

  // The cascade, translated to the legacy fields live rows carry.
  const filters: DirectoryFilters = useMemo(
    () => cascadeToDirectoryFilters({ stream, level, classLevel, group }),
    [stream, level, classLevel, group],
  );
  const filterKey = [stream, level, classLevel, group].join('|');

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
        setError('load');
        setLoading(false);
      });
  }

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
        setError('load');
        setLoading(false);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Search path: load the full Published list ONCE per session, only when
  // the user actually searches (plain browsing never touches this cache).
  useEffect(() => {
    if (!searching || allRows) return;
    let live = true;
    setSearchLoading(true);
    getAllPublishedDirectoryCached()
      .then((rows) => {
        if (!live) return;
        setAllRows(rows);
        setSearchLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setSearchLoading(false);
      });
    return () => {
      live = false;
    };
  }, [searching, allRows]);

  // Reset the search page whenever the query or the cascade changes.
  useEffect(() => {
    setSearchPage(0);
  }, [query, filterKey]);

  // ---- cascade options + step-bar ----
  const streamDef = stream ? cascadeStreamDef(stream) : undefined;
  // Before a stream is picked, show the full 5-step shape (steps 2–4 disabled);
  // Madrasa/Technical collapse steps 3–4 once picked.
  const collapsed = stream === 'madrasa' || stream === 'technical';
  const showClassStep = !collapsed;
  const showGroupStep = !collapsed;
  const levelOptions = streamDef?.levels ?? [];
  const classOptions = stream && level ? cascadeClasses(stream, level) : [];
  const groupOptions = stream && level ? cascadeGroups(stream, level, classLevel) : [];
  const selectCount = collapsed ? 2 : 4;

  const steps: CascadeStep[] = [
    {
      labelBn: 'শিক্ষা ধারা',
      labelEn: 'Education Type',
      state: stream ? 'done' : 'active',
    },
    {
      labelBn: 'প্রোগ্রাম / স্তর',
      labelEn: 'Program / Level',
      state: !stream ? 'disabled' : level ? 'done' : 'active',
    },
    ...(showClassStep
      ? [
          {
            labelBn: 'শ্রেণি / বর্ষ / সেমিস্টার',
            labelEn: 'Class / Year / Semester',
            state: (!level ? 'disabled' : classLevel ? 'done' : 'active') as CascadeStep['state'],
          },
        ]
      : []),
    ...(showGroupStep
      ? [
          {
            labelBn: 'গ্রুপ / বিভাগ / ট্রেড',
            labelEn: 'Group / Department / Trade',
            state: (group
              ? 'done'
              : level && (stream !== 'higher' || classLevel)
                ? 'active'
                : 'disabled') as CascadeStep['state'],
          },
        ]
      : []),
    {
      labelBn: 'খুঁজুন',
      labelEn: 'Search',
      state: searching ? 'done' : 'active',
    },
  ];

  // ---- cascade change handlers (earlier change resets later steps) ----
  function onStream(v: string) {
    setStream(v as CascadeSelection['stream']);
    setLevel('');
    setClassLevel('');
    setGroup('');
  }
  function onLevel(v: string) {
    setLevel(v);
    setClassLevel('');
    setGroup('');
  }
  function onClass(v: string) {
    setClassLevel(v);
    setGroup('');
  }

  // ---- browsing page ----
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
      setError('next');
    } finally {
      setLoading(false);
    }
  }

  function prevPage() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  // ---- search results (cascade-narrowed, then text match) ----
  const searchResults = useMemo(() => {
    if (!searching || !allRows) return [];
    const q = query.trim().toLowerCase();
    return allRows
      .filter((r) => rowMatchesCascade(r, filters))
      .filter((r) => `${r.paperTitle} ${r.paperCode} ${r.subject}`.toLowerCase().includes(q))
      .sort(compareDirectoryRows);
  }, [searching, allRows, query, filters]);
  const searchPageRows = searchResults.slice(
    searchPage * SEARCH_PAGE_SIZE,
    searchPage * SEARCH_PAGE_SIZE + SEARCH_PAGE_SIZE,
  );
  const searchShownFrom = searchPageRows.length === 0 ? 0 : searchPage * SEARCH_PAGE_SIZE + 1;
  const searchShownTo = searchPage * SEARCH_PAGE_SIZE + searchPageRows.length;
  const searchHasMore = (searchPage + 1) * SEARCH_PAGE_SIZE < searchResults.length;

  return (
    <PageShell titleBn="শিক্ষা নির্দেশিকা" titleEn="Education Directory" wide>
      {error ? (
        <AlertBox tone="error" onRetry={reloadFirst}>
          {error === 'next' ? (
            <T bn="পরের পাতা লোড করা যায়নি — আবার চেষ্টা করুন।" en="Could not load the next page — please try again." />
          ) : (
            <T bn="নির্দেশিকা লোড করা যায়নি — আবার চেষ্টা করুন।" en="Could not load the directory — please try again." />
          )}
        </AlertBox>
      ) : null}
      {loading && pages.length === 0 && !error ? <SkeletonCards count={4} /> : null}

      <p style={{ color: '#5A6478', margin: '0 0 12px' }}>
        <T
          bn="প্রতিটি শিক্ষা ধারা, প্রোগ্রাম ও শ্রেণির বই এক জায়গায়। ধাপে ধাপে বেছে নাও — তারপর বইয়ের নাম, বিষয় বা কোড লিখে খুঁজো। বইয়ের বিস্তারিত দেখতে নামের উপর চাপ দাও।"
          en="Every stream, program and class in one place. Pick step by step — then search by book title, subject or code. Tap a title for the book's details."
        />
      </p>

      <CascadeSteps steps={steps} />

      <Card style={{ marginBottom: 16 }}>
        <div className="ev-cascade-grid" style={{ gridTemplateColumns: `repeat(${selectCount}, 1fr)` }}>
          <div className="ev-cascade-field">
            <label htmlFor="cascade-stream">
              <T bn="১. শিক্ষা ধারা" en="1. Education Type" />
            </label>
            <select
              id="cascade-stream"
              value={stream}
              onChange={(e) => onStream(e.target.value)}
              aria-label={t({ bn: 'শিক্ষা ধারা', en: 'Education Type' })}
              className="ev-select"
            >
              <option value="">
                <T bn="সব শিক্ষা ধারা" en="All education types" />
              </option>
              {CASCADE_STREAMS.map((s) => (
                <option key={s.stream} value={s.stream}>
                  {lang === 'bn' ? s.bn : s.en}
                </option>
              ))}
            </select>
          </div>

          <div className="ev-cascade-field">
            <label htmlFor="cascade-level">
              <T bn="২. প্রোগ্রাম / স্তর" en="2. Program / Level" />
            </label>
            <select
              id="cascade-level"
              value={level}
              onChange={(e) => onLevel(e.target.value)}
              disabled={!stream}
              aria-label={t({ bn: 'প্রোগ্রাম / স্তর', en: 'Program / Level' })}
              className="ev-select"
            >
              <option value="">
                <T bn="সব প্রোগ্রাম" en="All programs" />
              </option>
              {levelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === 'bn' ? o.bn : o.en}
                </option>
              ))}
            </select>
          </div>

          {showClassStep ? (
            <div className="ev-cascade-field">
              <label htmlFor="cascade-class">
                <T bn="৩. শ্রেণি / বর্ষ / সেমিস্টার" en="3. Class / Year / Semester" />
              </label>
              <select
                id="cascade-class"
                value={classLevel}
                onChange={(e) => onClass(e.target.value)}
                disabled={!level}
                aria-label={t({ bn: 'শ্রেণি / বর্ষ / সেমিস্টার', en: 'Class / Year / Semester' })}
                className="ev-select"
              >
                <option value="">
                  <T bn="সব শ্রেণি" en="All classes" />
                </option>
                {classOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === 'bn' ? o.bn : o.en}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {showGroupStep ? (
            <div className="ev-cascade-field">
              <label htmlFor="cascade-group">
                <T bn="৪. গ্রুপ / বিভাগ / ট্রেড" en="4. Group / Department / Trade" />
              </label>
              <select
                id="cascade-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                disabled={!level || (stream === 'higher' && !classLevel)}
                aria-label={t({ bn: 'গ্রুপ / বিভাগ / ট্রেড', en: 'Group / Department / Trade' })}
                className="ev-select"
              >
                <option value="">
                  <T bn="সব গ্রুপ" en="All groups" />
                </option>
                {groupOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === 'bn' ? o.bn : o.en}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="ev-cascade-field" style={{ marginTop: 12 }}>
          <label htmlFor="cascade-search">
            <T bn="৫. খুঁজুন" en="5. Search" />
          </label>
          <input
            id="cascade-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t({ bn: 'বইয়ের নাম, বিষয় বা কোড লিখুন…', en: 'Type a book title, subject or code…' })}
            aria-label={t({ bn: 'বই খুঁজুন', en: 'Search books' })}
            className="ev-input"
          />
        </div>
      </Card>

      {searching ? (
        <>
          <p style={{ color: '#555', margin: '0 0 12px' }}>
            <T
              bn={`খুঁজছি: “${query.trim()}” — দেখাচ্ছি ${searchShownFrom}–${searchShownTo}`}
              en={`Searching: “${query.trim()}” — showing ${searchShownFrom}–${searchShownTo}`}
            />
          </p>
          {searchLoading ? (
            <SkeletonCards count={4} />
          ) : searchResults.length === 0 ? (
            <EmptyState
              bn="খুঁজে কিছু পাওয়া যায়নি — অন্য শব্দে খুঁজে দেখুন।"
              en="No results — try different words."
            />
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {searchPageRows.map((r) => (
              <Card key={r.id} hover>
                <Link to={`/library/${r.bookId}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
                  {r.paperTitle}
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <Chip>{r.department}</Chip>
                  <Chip tone="outline">{r.classLevel}</Chip>
                  <Chip tone="outline">
                    <T bn={`কোড ${r.paperCode}`} en={`Code ${r.paperCode}`} />
                  </Chip>
                </div>
                <p style={{ margin: '10px 0 0', color: '#5A6478', fontSize: 14 }}>
                  {r.type} · {r.program}
                </p>
              </Card>
            ))}
          </div>
          {searchHasMore || searchPage > 0 ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <Button variant="outline" onClick={() => setSearchPage((p) => Math.max(0, p - 1))} disabled={searchPage <= 0}>
                <T bn="← আগের" en="← Previous" />
              </Button>
              <span>
                <T bn={`পাতা ${searchPage + 1}`} en={`Page ${searchPage + 1}`} />
              </span>
              <Button variant="outline" onClick={() => setSearchPage((p) => p + 1)} disabled={!searchHasMore || searchLoading}>
                <T bn="পরের →" en="Next →" />
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {!loading && pages.length > 0 && pageRows.length === 0 && pageIndex === 0 ? (
            <EmptyState
              bn="এই বাছাইয়ে কিছু পাওয়া যায়নি। উপরের ধাপ বদলে আবার চেষ্টা করুন।"
              en="Nothing matches these filters. Try different steps above."
            />
          ) : null}
          {pages.length > 0 ? (
            <p style={{ color: '#555', margin: '0 0 12px' }}>
              <T bn={`দেখাচ্ছি ${shownFrom}–${shownTo}`} en={`Showing ${shownFrom}–${shownTo}`} />
            </p>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {pageRows.map((r) => (
              <Card key={r.id} hover>
                <Link to={`/library/${r.bookId}`} style={{ fontWeight: 700, fontSize: 16, color: '#0A1F44', lineHeight: 1.5 }}>
                  {r.paperTitle}
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <Chip>{r.department}</Chip>
                  <Chip tone="outline">{r.classLevel}</Chip>
                  <Chip tone="outline">
                    <T bn={`কোড ${r.paperCode}`} en={`Code ${r.paperCode}`} />
                  </Chip>
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
                <T bn="← আগের" en="← Previous" />
              </Button>
              <span>
                <T bn={`পাতা ${pageIndex + 1}`} en={`Page ${pageIndex + 1}`} />
              </span>
              <Button variant="outline" onClick={nextPage} disabled={!currentPage?.hasMore || loading}>
                <T bn="পরের →" en="Next →" />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </PageShell>
  );
}
