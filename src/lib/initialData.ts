// Eduvelto — __INITIAL_DATA__ payload (Phase 2b, Firebase Spark
// Optimization, 25 Nov 2026).
//
// The prerender (scripts/prerender.mjs) embeds the data a public
// page needs in the prerendered HTML; the client reads it FIRST and
// renders with ZERO Firestore reads when it is present, falling back
// to the live fetch only when there is no payload (e.g. direct SPA
// navigation to a non-prerendered URL).
//
// CARRIER (CSP — read before changing this): the site's
// Content-Security-Policy (firebase.json) is script-src 'self' + ONE
// SHA-256 hash for the theme script — there is NO 'unsafe-inline',
// so a classic inline script `window.__INITIAL_DATA__ = {...}`
// would be BLOCKED in production (and a per-page hash is impossible:
// the bytes differ per page). The payload is therefore carried as a
// JSON data block —
//   <script id="__INITIAL_DATA__" type="application/json">{...}</script>
// — which the browser never executes and CSP script-src does not
// govern (the same exemption the application/ld+json blocks already
// rely on). The reader below parses that block (and also accepts a
// real window.__INITIAL_DATA__ if one is ever set) and returns the
// typed payload. NEVER expose login-gated lesson/question content
// through this payload — only data the page already renders publicly
// (book metadata + public preview chapters; the library's first page;
// class-level aggregate stats).
//
// CONSUME-ONCE: the payload belongs to the DOCUMENT (the prerendered
// page). The first read consumes it (DOM block removed, window key
// deleted, module flag set) so a later SPA navigation can never
// reuse stale data for a different route. A mismatched kind or path
// also consumes it — the payload was for another page.

import type { Book, Chapter } from './content';
import { CLASS_LEVELS } from './classLevels';

/** A book as carried in the payload: the fields the public pages
 *  render (title, subject, class, counts, bilingual flag). The rest
 *  of the Book shape is defaulted by hydrateBook() — the payload
 *  never carries source files, author lists or loader internals. */
export interface PayloadBook {
  id: string;
  title: string;
  subject?: string;
  classLevel?: string;
  board?: string;
  program?: string;
  department?: string;
  paperCode?: string;
  chapterCount?: number;
  questionCount?: number;
  bilingual?: boolean;
  educationType?: string;
  credit?: number | null;
  marks?: number | null;
}

/** A chapter as carried in the payload: the full Chapter shape
 *  minus nothing — chapters are small. The prerender only ever puts
 *  PUBLIC (Published + isPreview) chapters here; the full chapter
 *  list is login-gated and is always fetched live for signed-in users. */
export interface PayloadChapter {
  id: string;
  bookId: string;
  title: string;
  part?: string;
  set?: number;
  order?: number;
  questionCount?: number;
  reviewStatus?: string;
  isPreview?: boolean;
}

/** One class level's counts as carried in the payload: only what
 *  the /class index renders (book + subject counts per level).
 *  Computed from the same books the prerender renders (see
 *  buildClassLevelCounts in scripts/prerender.mjs) — NOT from the
 *  loader stats, which cover only 5 of 7 levels (Technical with 72
 *  books and Madrasa with 35 have no stats doc). */
export interface PayloadClassLevel {
  slug: string;
  bookCount: number;
  subjectCount: number;
}

export type InitialData =
  | { kind: 'book'; path: string; book: PayloadBook; chapters: PayloadChapter[] }
  | { kind: 'library'; path: string; books: PayloadBook[]; lastDocId: string | null; hasMore: boolean }
  | { kind: 'class-index'; path: string; levels: PayloadClassLevel[] };

declare global {
  interface Window {
    __INITIAL_DATA__?: unknown;
  }
}

function normalizePath(p: string): string {
  return p.replace(/\/+$/, '') || '/';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isPayloadBook(v: unknown): v is PayloadBook {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.title === 'string' &&
    v.title !== ''
  );
}

function isPayloadChapter(v: unknown): v is PayloadChapter {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.bookId === 'string' &&
    typeof v.title === 'string'
  );
}

function isPayloadClassLevel(v: unknown): v is PayloadClassLevel {
  return (
    isRecord(v) &&
    typeof v.slug === 'string' &&
    v.slug !== '' &&
    typeof v.bookCount === 'number' &&
    typeof v.subjectCount === 'number'
  );
}

/** Structural validation for a parsed payload — the single shape
 *  check both the prerender's output and the client's reader agree
 *  on (see initialData.test.ts, which feeds a real prerender-built
 *  payload through this reader). */
export function isInitialData(v: unknown): v is InitialData {
  if (!isRecord(v)) return false;
  if (typeof v.path !== 'string' || !v.path.startsWith('/')) return false;
  switch (v.kind) {
    case 'book':
      return (
        isPayloadBook(v.book) &&
        Array.isArray(v.chapters) &&
        v.chapters.every(isPayloadChapter)
      );
    case 'library':
      return (
        Array.isArray(v.books) &&
        v.books.every(isPayloadBook) &&
        (typeof v.lastDocId === 'string' || v.lastDocId === null) &&
        typeof v.hasMore === 'boolean'
      );
    case 'class-index':
      return Array.isArray(v.levels) && v.levels.every(isPayloadClassLevel);
    default:
      return false;
  }
}

let consumed = false;

/**
 * Read the page's __INITIAL_DATA__ payload, once. Returns null when
 * there is no payload, when it fails validation, or when its path
 * does not match this document's URL (stale payload after an SPA
 * navigation). The first call consumes the payload — a second call
 * always returns null. Server-side (no window) returns null.
 */
export function readInitialData(): InitialData | null {
  if (consumed) return null;
  if (typeof window === 'undefined') return null;
  consumed = true;
  let raw: unknown;
  // WINDOW BRANCH — read before changing this (probe-found bug,
  // 25 Nov 2026): an element with id="__INITIAL_DATA__" ALSO appears
  // as window.__INITIAL_DATA__ (the HTML "named access on the window
  // object" rule) — the <script> ELEMENT itself, not data. A bare
  // `!== undefined` check is therefore ALWAYS true while the block
  // is in the DOM, so the reader took the element as the payload,
  // failed validation, removed the block, and every page fell back
  // to the live fetch (which then failed offline). The window value
  // is only trusted when it is a structurally valid payload; anything
  // else (the named element, a malformed assignment) falls through
  // to the DOM block below. A real assignment (own property, valid
  // shape) still wins over the block.
  const winVal = window.__INITIAL_DATA__;
  if (isInitialData(winVal)) {
    raw = winVal;
  } else if (typeof document !== 'undefined') {
    const el = document.getElementById('__INITIAL_DATA__');
    const text = el?.textContent;
    if (text) {
      try {
        raw = JSON.parse(text);
      } catch {
        raw = undefined;
      }
    }
  }
  // Consume-once cleanup regardless of validity: remove both
  // carriers so no later code can reuse this document's payload.
  try {
    delete window.__INITIAL_DATA__;
  } catch {
    // Non-configurable in some hosts — the flag above is the real guard.
  }
  if (typeof document !== 'undefined') {
    document.getElementById('__INITIAL_DATA__')?.remove();
  }
  if (raw === undefined) return null;
  if (!isInitialData(raw)) return null;
  if (normalizePath(raw.path) !== normalizePath(window.location.pathname)) return null;
  return raw;
}

/** Payload book -> full Book (missing fields defaulted — the hub and
 *  book pages never render them). reviewStatus is always
 *  'Published': only published books are ever prerendered. */
export function hydrateBook(p: PayloadBook): Book {
  return {
    id: p.id,
    title: p.title,
    paperCode: p.paperCode ?? '',
    educationType: p.educationType ?? '',
    board: p.board ?? '',
    program: p.program ?? '',
    classLevel: p.classLevel ?? '',
    department: p.department ?? '',
    departments: [],
    subject: p.subject ?? '',
    sourceType: '',
    sourceUrl: '',
    language: '',
    bilingual: p.bilingual ?? false,
    questionCount: p.questionCount ?? 0,
    chapterCount: p.chapterCount ?? 0,
    reviewStatus: 'Published',
    credit: p.credit ?? null,
    marks: p.marks ?? null,
  };
}

/** Payload chapter -> full Chapter. */
export function hydrateChapter(p: PayloadChapter): Chapter {
  return {
    id: p.id,
    bookId: p.bookId,
    title: p.title,
    part: p.part ?? '',
    set: p.set ?? 1,
    order: p.order ?? 0,
    questionCount: p.questionCount ?? 0,
    reviewStatus: p.reviewStatus ?? 'Published',
    isPreview: p.isPreview === true,
  };
}

/**
 * Book-page seam: the payload for THIS book (id-checked), or null —
 * in which case the page must fetch live. Consumes the payload on
 * every call (even on mismatch — it belonged to another page).
 */
export function takeBookInitialData(bookId: string): { book: Book; chapters: Chapter[] } | null {
  const d = readInitialData();
  if (!d || d.kind !== 'book' || d.book.id !== bookId) return null;
  return { book: hydrateBook(d.book), chapters: d.chapters.map(hydrateChapter) };
}

/**
 * Library-hub seam: the payload's first page (50 books, default
 * filters), or null — in which case the page must fetch live.
 */
export function takeLibraryInitialData(): {
  books: Book[];
  lastDocId: string | null;
  hasMore: boolean;
} | null {
  const d = readInitialData();
  if (!d || d.kind !== 'library') return null;
  return { books: d.books.map(hydrateBook), lastDocId: d.lastDocId, hasMore: d.hasMore };
}

/**
 * Class-index seam: the payload's per-level counts, or null. Null
 * also when the payload does not cover EVERY class level — a partial
 * set would show honest-looking zeroes for the missing level, so the
 * page must fall back to the live stats fetch instead.
 */
export function takeClassIndexInitialData(): { levels: PayloadClassLevel[] } | null {
  const d = readInitialData();
  if (!d || d.kind !== 'class-index') return null;
  const slugs = new Set(d.levels.map((s) => s.slug));
  if (!CLASS_LEVELS.every((def) => slugs.has(def.slug))) return null;
  return { levels: d.levels };
}
