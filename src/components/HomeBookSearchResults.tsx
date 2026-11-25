// Eduvelto — Phase 4 (25 Nov 2026, feature/ssg-bilingual-support):
// homepage instant live book search results.
//
// Behaviour:
// - Inactive until the user types ≥ 2 characters (BOOK_SEARCH_MIN_QUERY).
// - On first qualifying keystroke the compact static index
//   (/book-search-index.json — id/title/subject/classLevel only) is
//   fetched ONCE and cached for the session (loadBookSearchIndex).
// - If the index fetch fails, falls back to filtering the
//   already-loaded cached book list (the same promise HomePage
//   already awaits for Popular Books) — zero additional Firestore
//   reads either way. Filtering itself is pure and in-memory.
// - Results link only to the book pages (/library/:id); lesson /
//   question content stays login-gated. A "see all results" link
//   goes to the full /search page for the same query.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import {
  BOOK_SEARCH_MAX_RESULTS,
  BOOK_SEARCH_MIN_QUERY,
  filterBooksForLiveSearch,
  filterBookSearchIndex,
  loadBookSearchIndex,
  normalizeSearchText,
  type Book,
  type BookSearchEntry,
} from '../lib/bookSearchIndex';

export default function HomeBookSearchResults({
  query,
  books,
}: {
  query: string;
  books: Book[] | null;
}) {
  const { t } = useLanguage();
  const [index, setIndex] = useState<BookSearchEntry[] | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);
  const startedRef = useRef(false);

  const trimmed = query.trim();
  const active = normalizeSearchText(trimmed).length >= BOOK_SEARCH_MIN_QUERY;

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    let live = true;
    loadBookSearchIndex()
      .then((entries) => {
        if (live) setIndex(entries);
      })
      .catch(() => {
        if (live) setIndexFailed(true);
      });
    return () => {
      live = false;
    };
  }, [active]);

  if (!active) return null;

  // Index path first; the cached book list is the fallback (and
  // the only path while the index is still loading).
  const results: BookSearchEntry[] =
    index !== null
      ? filterBookSearchIndex(index, trimmed)
      : books
        ? filterBooksForLiveSearch(books, trimmed)
        : [];
  const loading = index === null && !indexFailed && books === null;

  return (
    <div
      id="home-live-search-results"
      role="listbox"
      aria-label={t({ bn: 'বইয়ের ফলাফল', en: 'Book results' })}
      style={{
        marginTop: 8,
        border: '1px solid var(--line-strong)',
        borderRadius: 10,
        background: 'var(--card)',
        padding: '6px 0',
        textAlign: 'start',
      }}
    >
      {loading ? (
        <p style={{ margin: '6px 14px', fontSize: 14, color: 'var(--muted-ivory)' }}>
          {t({ bn: 'খুঁজছি…', en: 'Searching…' })}
        </p>
      ) : results.length === 0 ? (
        <p style={{ margin: '6px 14px', fontSize: 14, color: 'var(--muted-ivory)' }}>
          {t({
            bn: 'এই নামে কোনো বই পাওয়া যায়নি — বানান দেখে আবার চেষ্টা করুন।',
            en: 'No book found by that name — check the spelling and try again.',
          })}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {results.map((r) => (
            <li key={r.id} role="option" aria-selected="false">
              <Link
                to={`/library/${r.id}`}
                style={{
                  display: 'block',
                  padding: '8px 14px',
                  textDecoration: 'none',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ fontSize: 15 }}>{r.title}</strong>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--muted-ivory)' }}>
                  {[r.classLevel, r.subject].filter(Boolean).join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div style={{ borderTop: '1px solid var(--line-strong)', padding: '8px 14px 4px' }}>
        <Link
          to={`/search?q=${encodeURIComponent(trimmed)}`}
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          {t({
            bn: `“${trimmed}”-এর সব ফলাফল দেখুন →`,
            en: `See all results for “${trimmed}” →`,
          })}
        </Link>
        {indexFailed ? (
          <span style={{ display: 'block', fontSize: 12, color: 'var(--muted-ivory)', marginTop: 2 }}>
            {t({
              bn: 'দ্রুত সূচক লোড হয়নি — লাইব্রেরির তালিকা থেকে খোঁজা হয়েছে।',
              en: 'The fast index did not load — searched the library list instead.',
            })}
          </span>
        ) : null}
      </div>
      <span style={{ display: 'none' }}>
        {`live-search-count:${results.length} max:${BOOK_SEARCH_MAX_RESULTS}`}
      </span>
    </div>
  );
}
