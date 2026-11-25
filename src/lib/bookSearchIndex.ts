// Eduvelto — Phase 4 (25 Nov 2026, feature/ssg-bilingual-support):
// homepage instant live book search.
//
// DESIGN (decided for Phase 4, documented — not guessed):
// - The homepage ALREADY does one cached Firestore read per session
//   for Popular Books / stats (getAllPublishedBooksCached in
//   content.ts — a module-level promise cache; a rejected first
//   attempt clears itself so a retry re-reads). That list is 609 full
//   Book rows. Re-filtering it per keystroke would add ZERO extra
//   reads — but it still means the search only works after that
//   609-doc read resolves, and it keeps the search coupled to the
//   Popular Books load.
// - So the PRIMARY source is a compact STATIC index file,
//   /book-search-index.json (~78 KB for all 609 books: id + title +
//   subject + classLevel ONLY — no chapter/question payloads, no
//   lesson text, nothing login-gated). It is generated at build /
//   prerender time from the same book list the prerender already
//   loads (scripts/build-book-search-index.mjs + scripts/prerender.mjs
//   regenerate it into dist/; the committed copy in public/ is the
//   fallback so `npm run build` alone still ships one). It is fetched
//   LAZILY — only on first focus/typing in the homepage search box —
//   and cached in memory for the session (plus normal HTTP caching).
//   Read count per search: 0 Firestore reads, 0 fetches after the
//   first (one static-file fetch per session, at most).
// - FALLBACK: if the index file cannot be fetched (e.g. an old deploy
//   without it), the search filters the already-loaded cached book
//   list (filterBooksForLiveSearch) — again zero additional reads,
//   because that list is the same promise HomePage already awaits.
// - Either way the search NEVER queries Firestore per keystroke and
//   NEVER embeds the library on the homepage: the index is a
//   separate lazy file, and results link only to the book pages
//   (/library/:id) — lesson/question content stays login-gated.
// - The Phase 2b zero-read behaviour of the book/hub pages is
//   untouched: this module is only used by the homepage search box.

import { type Book } from './content';

export type { Book } from './content';

/** One index row: the only fields the search needs. */
export interface BookSearchEntry {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
}

export const BOOK_SEARCH_INDEX_URL = '/book-search-index.json';
/** Minimum query length before results are shown. */
export const BOOK_SEARCH_MIN_QUERY = 2;
/** Results shown in the homepage dropdown. */
export const BOOK_SEARCH_MAX_RESULTS = 8;

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/**
 * Normalise for matching: lowercase, Bengali digits -> ASCII (so
 * "৫" and "5" match each other), Latin diacritics stripped (so
 * "café" matches "cafe"), whitespace collapsed. Bangla text has no
 * case and no Latin-style diacritics, so it passes through
 * unchanged apart from digit/whitespace normalisation.
 */
export function normalizeSearchText(s: string): string {
  let out = s.toLowerCase();
  out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (let i = 0; i < 10; i++) out = out.split(BN_DIGITS[i]).join(String(i));
  return out.replace(/\s+/g, ' ').trim();
}

function matchesHaystack(haystack: string, q: string): boolean {
  if (!q) return false;
  return normalizeSearchText(haystack).includes(q);
}

/** Build the compact index from full Book rows (Published only). */
export function buildBookSearchIndex(books: Book[]): BookSearchEntry[] {
  return books
    .filter((b) => b.reviewStatus === 'Published')
    .map((b) => ({
      id: b.id,
      title: b.title,
      subject: b.subject,
      classLevel: b.classLevel,
    }));
}

/**
 * Pure filter over an already-loaded index. Matches title, subject
 * or classLevel (substring). Returns [] for queries shorter than
 * BOOK_SEARCH_MIN_QUERY. Pure — unit-testable, no I/O.
 */
export function filterBookSearchIndex(
  entries: BookSearchEntry[],
  rawQuery: string,
  max = BOOK_SEARCH_MAX_RESULTS,
): BookSearchEntry[] {
  const q = normalizeSearchText(rawQuery);
  if (q.length < BOOK_SEARCH_MIN_QUERY) return [];
  const out: BookSearchEntry[] = [];
  for (const e of entries) {
    if (matchesHaystack(`${e.title} ${e.subject} ${e.classLevel}`, q)) {
      out.push(e);
      if (out.length >= max) break;
    }
  }
  return out;
}

/**
 * Fallback filter over full Book rows (the cached list HomePage
 * already loads). Same matcher, same fields — title, subject,
 * classLevel — so results are identical in shape to the index path.
 */
export function filterBooksForLiveSearch(
  books: Book[],
  rawQuery: string,
  max = BOOK_SEARCH_MAX_RESULTS,
): BookSearchEntry[] {
  return filterBookSearchIndex(buildBookSearchIndex(books), rawQuery, max);
}

/** Shape of the generated JSON file (see scripts/build-book-search-index.mjs). */
export interface BookSearchIndexFile {
  version: 1;
  generatedAt: string;
  count: number;
  entries: BookSearchEntry[];
}

let indexCache: Promise<BookSearchEntry[]> | null = null;

function isValidEntry(e: unknown): e is BookSearchEntry {
  if (!e || typeof e !== 'object') return false;
  const r = e as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    typeof r.subject === 'string' &&
    typeof r.classLevel === 'string'
  );
}

/**
 * Lazy-load the static index (one fetch per session, at most).
 * A failed fetch clears the cache so a later retry re-fetches
 * instead of replaying the same rejection. The caller falls back
 * to filterBooksForLiveSearch on rejection.
 */
export function loadBookSearchIndex(
  fetchFn: typeof fetch = fetch,
): Promise<BookSearchEntry[]> {
  if (!indexCache) {
    indexCache = (async () => {
      const res = await fetchFn(BOOK_SEARCH_INDEX_URL);
      if (!res.ok) throw new Error(`book search index HTTP ${res.status}`);
      const data: unknown = await res.json();
      const entries: unknown = Array.isArray(data)
        ? data
        : (data as BookSearchIndexFile)?.entries;
      if (!Array.isArray(entries) || !entries.every(isValidEntry)) {
        throw new Error('book search index has an unexpected shape');
      }
      return entries as BookSearchEntry[];
    })().catch((err: unknown) => {
      indexCache = null;
      throw err;
    });
  }
  return indexCache;
}

/** Test helper: clear the module-level index cache. */
export function __clearBookSearchIndexCache(): void {
  indexCache = null;
}
