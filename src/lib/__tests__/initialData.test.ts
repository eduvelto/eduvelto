// Eduvelto — __INITIAL_DATA__ payload reader tests (Phase 2b,
// 25 Nov 2026).
//
// Runs in plain node (no jsdom — the repo has none): window and
// document are faked per scenario, and the module is re-imported
// after vi.resetModules() so the consume-once flag starts fresh
// (mirrors the legalPages.test.ts pattern). Also feeds a REAL
// prerender-built payload (scripts/prerender.mjs builders, 24 Nov
// fixture data) through the reader — the two sides of the shared
// shape must agree, or the zero-read path silently never fires.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildBookPayload,
  buildClassIndexPayload,
  buildLibraryPayload,
  normalizeBooksFixture,
  normalizeChaptersFixture,
} from '../../../scripts/prerender.mjs';

const BACKUP_PATH = join(process.cwd(), '..', 'backups', 'eduvelto-backup-20261124-014508.json');

type InitialDataModule = typeof import('../initialData');

function fakeElement(text: string | null) {
  return {
    textContent: text,
    remove: vi.fn(),
  };
}

/** Fake window + document. `jsonText` is the __INITIAL_DATA__ JSON
 *  block's text (null = no block). `windowPayload` sets a real
 *  window.__INITIAL_DATA__ instead. `pathname` is the document URL. */
function setupDom(opts: {
  pathname: string;
  jsonText?: string | null;
  windowPayload?: unknown;
  blockPresent?: boolean;
}) {
  const el = opts.blockPresent === false ? null : fakeElement(opts.jsonText ?? null);
  const removed: unknown[] = [];
  const element = el
    ? {
        ...el,
        remove: () => {
          removed.push(el);
          el.remove();
        },
      }
    : null;
  (globalThis as unknown as { window: unknown }).window = {
    location: { pathname: opts.pathname, search: '', href: `https://eduvelto.com${opts.pathname}` },
    __INITIAL_DATA__: opts.windowPayload,
  };
  (globalThis as unknown as { document: unknown }).document = {
    getElementById: (id: string) => (id === '__INITIAL_DATA__' ? element : null),
  };
  return { removed };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { document?: unknown }).document;
  vi.resetModules();
});

async function loadReader(): Promise<InitialDataModule> {
  vi.resetModules();
  return import('../initialData');
}

const BOOK_PAYLOAD = {
  kind: 'book',
  path: '/bn/books/hons-211001',
  book: {
    id: 'hons-211001',
    title: 'History and Culture of Bangladesh and Bengalees (From Ancients to 2000 AD)',
    subject: 'Bangla',
    classLevel: '1st Year',
    chapterCount: 3,
    questionCount: 26,
    bilingual: false,
    educationType: 'Higher',
    credit: 4,
    marks: 100,
  },
  chapters: [],
} as const;

describe('readInitialData', () => {
  it('reads the JSON data block when the path matches', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    const data = mod.readInitialData();
    expect(data?.kind).toBe('book');
    if (data?.kind === 'book') {
      expect(data.book.id).toBe('hons-211001');
      expect(data.book.title).toContain('History and Culture');
    }
  });

  it('reads a real window.__INITIAL_DATA__ when one is set', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', windowPayload: BOOK_PAYLOAD, blockPresent: false });
    const mod = await loadReader();
    const data = mod.readInitialData();
    expect(data?.kind).toBe('book');
  });

  it('ignores a non-payload window.__INITIAL_DATA__ and reads the DOM block (named-property trap)', async () => {
    // PROBE-FOUND BUG (25 Nov 2026): in a real browser, an element
    // with id="__INITIAL_DATA__" ALSO appears as window.__INITIAL_DATA__
    // (the HTML "named access on the window object" rule) — the
    // <script> element itself, not data. A bare `!== undefined` check
    // took the element as the payload, failed validation, and destroyed
    // the block unread — every page fell back to the live fetch. The
    // reader must only trust a structurally valid window value; a
    // non-payload window value must fall through to the DOM block.
    const fakeScriptElement = { tagName: 'SCRIPT', id: '__INITIAL_DATA__' };
    setupDom({
      pathname: '/bn/books/hons-211001',
      jsonText: JSON.stringify(BOOK_PAYLOAD),
      windowPayload: fakeScriptElement,
    });
    const mod = await loadReader();
    const data = mod.readInitialData();
    expect(data?.kind).toBe('book');
    if (data?.kind === 'book') expect(data.book.id).toBe('hons-211001');
  });

  it('a valid window payload wins over the DOM block', async () => {
    setupDom({
      pathname: '/bn/books/hons-211001',
      jsonText: JSON.stringify({ ...BOOK_PAYLOAD, book: { ...BOOK_PAYLOAD.book, id: 'hons-211003' } }),
      windowPayload: BOOK_PAYLOAD,
    });
    const mod = await loadReader();
    const data = mod.readInitialData();
    if (data?.kind === 'book') expect(data.book.id).toBe('hons-211001');
    else throw new Error('expected a book payload');
  });

  it('returns null when the path does not match (stale payload)', async () => {
    setupDom({ pathname: '/bn/books/hons-211003', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    expect(mod.readInitialData()).toBeNull();
  });

  it('returns null when the path matches except for a trailing slash', async () => {
    // The static host may serve /bn/books/<id>/ with a trailing
    // slash; the payload path has none — both must match.
    setupDom({ pathname: '/bn/books/hons-211001/', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    expect(mod.readInitialData()?.kind).toBe('book');
  });

  it('returns null when there is no payload at all', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: null });
    const mod = await loadReader();
    expect(mod.readInitialData()).toBeNull();
  });

  it('returns null for malformed JSON and for a wrong-shaped payload', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: '{not json' });
    expect((await loadReader()).readInitialData()).toBeNull();
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify({ kind: 'book', path: '/bn/books/hons-211001' }) });
    expect((await loadReader()).readInitialData()).toBeNull();
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify({ kind: 'nope', path: '/bn/books/hons-211001' }) });
    expect((await loadReader()).readInitialData()).toBeNull();
  });

  it('is consume-once: the second read returns null', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    expect(mod.readInitialData()?.kind).toBe('book');
    expect(mod.readInitialData()).toBeNull();
    // The window key is deleted on consume.
    expect((globalThis as unknown as { window: { __INITIAL_DATA__?: unknown } }).window.__INITIAL_DATA__).toBeUndefined();
  });

  it('returns null server-side (no window)', async () => {
    const mod = await loadReader();
    expect(mod.readInitialData()).toBeNull();
  });
});

describe('take* seams', () => {
  it('takeBookInitialData returns the hydrated book only for its own id', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    const got = mod.takeBookInitialData('hons-211001');
    expect(got?.book.title).toContain('History and Culture');
    expect(got?.book.reviewStatus).toBe('Published');
    expect(got?.book.credit).toBe(4);
    expect(got?.chapters).toEqual([]);
    // A second taker call sees nothing (consumed).
    expect(mod.takeBookInitialData('hons-211001')).toBeNull();
  });

  it('takeBookInitialData rejects a payload for another book', async () => {
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    expect(mod.takeBookInitialData('hons-211003')).toBeNull();
  });

  it('takeLibraryInitialData returns hydrated books + cursor', async () => {
    const lib = {
      kind: 'library',
      path: '/bn/books',
      books: [BOOK_PAYLOAD.book],
      lastDocId: 'hons-211001',
      hasMore: true,
    };
    setupDom({ pathname: '/bn/books', jsonText: JSON.stringify(lib) });
    const mod = await loadReader();
    const got = mod.takeLibraryInitialData();
    expect(got?.books).toHaveLength(1);
    expect(got?.books[0].reviewStatus).toBe('Published');
    expect(got?.lastDocId).toBe('hons-211001');
    expect(got?.hasMore).toBe(true);
  });

  it('takeLibraryInitialData rejects a book payload', async () => {
    setupDom({ pathname: '/bn/books', jsonText: JSON.stringify(BOOK_PAYLOAD) });
    const mod = await loadReader();
    expect(mod.takeLibraryInitialData()).toBeNull();
  });

  it('takeClassIndexInitialData requires all seven class levels', async () => {
    const levels = {
      kind: 'class-index',
      path: '/bn/class',
      levels: [
        { slug: 'class-9-10', bookCount: 26, subjectCount: 3 },
        { slug: 'hsc', bookCount: 37, subjectCount: 3 },
      ],
    };
    setupDom({ pathname: '/bn/class', jsonText: JSON.stringify(levels) });
    const mod = await loadReader();
    // Incomplete (2 of 7 levels) — must fall back to the live fetch,
    // never show honest-looking zeroes for the missing levels.
    expect(mod.takeClassIndexInitialData()).toBeNull();
  });

  it('takeClassIndexInitialData accepts a complete seven-level payload', async () => {
    const levels = {
      kind: 'class-index',
      path: '/bn/class',
      levels: ['class-1-5', 'class-6-8', 'class-9-10', 'hsc', 'honours-masters', 'technical', 'madrasa'].map((slug) => ({
        slug,
        bookCount: 1,
        subjectCount: 1,
      })),
    };
    setupDom({ pathname: '/bn/class', jsonText: JSON.stringify(levels) });
    const mod = await loadReader();
    const got = mod.takeClassIndexInitialData();
    expect(got?.levels).toHaveLength(7);
  });
});

describe('prerender-built payloads pass the reader (shared shape)', () => {
  it('a real book payload from the 24 Nov fixture validates', async () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const { chapters } = normalizeChaptersFixture(raw);
    const book = books.find((b) => b.id === 'hons-211001');
    expect(book).toBeDefined();
    if (!book) throw new Error('fixture book hons-211001 missing');
    const preview = chapters.filter(
      (c) => c.bookId === 'hons-211001' && c.reviewStatus === 'Published' && c.isPreview === true,
    );
    // The fixture carries NO isPreview flags (verified 25 Nov 2026):
    // the guest payload honestly carries zero chapters until the
    // loader sets isPreview on live rows.
    expect(preview).toHaveLength(0);
    const payload = buildBookPayload('/bn/books/hons-211001', book, preview);
    setupDom({ pathname: '/bn/books/hons-211001', jsonText: JSON.stringify(payload) });
    const mod = await loadReader();
    const got = mod.takeBookInitialData('hons-211001');
    expect(got?.book.title).toBe(book?.title);
    expect(got?.book.chapterCount).toBe(3);
    expect(got?.chapters).toEqual([]);
  });

  it('a real library payload (first 50 by id) validates', async () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const payload = buildLibraryPayload('/bn/books', books);
    expect(payload.books).toHaveLength(50);
    expect(payload.hasMore).toBe(true);
    expect(typeof payload.lastDocId).toBe('string');
    setupDom({ pathname: '/bn/books', jsonText: JSON.stringify(payload) });
    const mod = await loadReader();
    const got = mod.takeLibraryInitialData();
    expect(got?.books).toHaveLength(50);
    expect(got?.lastDocId).toBe(payload.lastDocId);
  });

  it('a real class-index payload (seven levels, book-derived) validates', async () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const payload = buildClassIndexPayload('/bn/class', books);
    expect(payload.levels).toHaveLength(7);
    // The loader stats cover only 5 of 7 levels (Technical 72 and
    // Madrasa 35 have no stats doc) — the book-derived payload
    // covers all seven, so the page never shows a false zero.
    const bySlug = new Map(payload.levels.map((l) => [l.slug, l]));
    expect(bySlug.get('hsc')).toEqual({ slug: 'hsc', bookCount: 37, subjectCount: 3 });
    expect(bySlug.get('technical')).toEqual({ slug: 'technical', bookCount: 72, subjectCount: 3 });
    expect(bySlug.get('madrasa')).toEqual({ slug: 'madrasa', bookCount: 35, subjectCount: 1 });
    expect(bySlug.get('honours-masters')).toEqual({ slug: 'honours-masters', bookCount: 439, subjectCount: 15 });
    setupDom({ pathname: '/bn/class', jsonText: JSON.stringify(payload) });
    const mod = await loadReader();
    const got = mod.takeClassIndexInitialData();
    expect(got?.levels).toHaveLength(7);
    expect(got?.levels.find((l) => l.slug === 'hsc')?.bookCount).toBe(37);
  });
});
