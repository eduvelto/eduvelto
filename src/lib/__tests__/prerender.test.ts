// Eduvelto — prerender script tests (Phase 1, SSG + bilingual,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Tests the script against the LOCAL fixture (the 24 Nov 2026
// backup — real data, never invented) and against stubbed
// Firestore REST responses. The live-REST prerender run itself is
// pending the quota reset and is NOT exercised here.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRERENDER_STATIC_PATHS,
  buildBookHead,
  buildBookSummary,
  buildBookSummaryHtml,
  buildClassIndexPayload,
  buildClassLevelCounts,
  buildInitialDataScriptTag,
  buildLibraryPayload,
  buildBookPayload,
  buildRobotsTxt,
  buildSitemapXml,
  fetchBooksFromRest,
  fetchChaptersFromRest,
  getGuidePaths,
  getGuideSlugs,
  insertInitialDataScript,
  normalizeBooksFixture,
  normalizeChaptersFixture,
  parseChapterRestDoc,
  parseFirestoreRestDoc,
  rewriteInternalHrefs,
  safeJsonForInlineScript,
} from '../../../scripts/prerender.mjs';
import { CLASS_LEVELS, booksForClass, subjectsForClass } from '../classLevels';
import type { Book } from '../content';
import { bookSeoData, buildBookSummary as buildBookSummaryTs } from '../seo';

const BACKUP_PATH = join(process.cwd(), '..', 'backups', 'eduvelto-backup-20261124-014508.json');

function readSitemapPaths(): string[] {
  const xml = readFileSync(join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>https:\/\/eduvelto\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
}

describe('PRERENDER_STATIC_PATHS', () => {
  it('covers every committed-sitemap URL, plus the new /books hub', () => {
    const sitemapPaths = readSitemapPaths();
    expect(sitemapPaths.length).toBe(137);
    for (const p of sitemapPaths) {
      expect(PRERENDER_STATIC_PATHS, `sitemap path missing from prerender list: ${p}`).toContain(p);
    }
    expect(PRERENDER_STATIC_PATHS).toContain('/books');
    // /founder IS prerendered since Phase 2 (25 Nov 2026): its SEO
    // moved from FounderPage's client-side useSeo into seo.ts.
    expect(PRERENDER_STATIC_PATHS).toContain('/founder');
    // /support IS prerendered since Phase 3 (25 Nov 2026): it is a
    // real route now (/bn/support) with its SEO in src/lib/seo.ts.
    expect(PRERENDER_STATIC_PATHS).toContain('/support');
    expect(PRERENDER_STATIC_PATHS).not.toContain('/ai-teacher'); // noindexed by design
    expect(new Set(PRERENDER_STATIC_PATHS).size).toBe(PRERENDER_STATIC_PATHS.length);
  });

  it('covers every guide path from PUBLIC_GUIDES (regex returns m[1])', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'lib', 'publicGuides.ts'), 'utf8');
    const slugs = getGuideSlugs(source);
    expect(slugs.length).toBe(56);
    for (const slug of slugs) expect(typeof slug).toBe('string');
    // Phase 2 (25 Nov 2026): the 15 Study Guides live at
    // /guides/<slug>, not /learn/<slug> — the coverage check uses
    // each guide's own path.
    const paths = getGuidePaths(source);
    expect(paths.length).toBe(56);
    expect(new Set(paths).size).toBe(56);
    for (const p of paths) {
      expect(PRERENDER_STATIC_PATHS, `guide not prerendered: ${p}`).toContain(p);
    }
  });
});

describe('normalizeBooksFixture (24 Nov backup)', () => {
  it('loads all 609 real books, skips none, uses doc id + single title', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books, skipped } = normalizeBooksFixture(raw);
    expect(books.length).toBe(609);
    expect(skipped).toBe(0);
    const first = books.find((b) => b.id === 'hons-211001');
    expect(first?.title).toBe('History and Culture of Bangladesh and Bengalees (From Ancients to 2000 AD)');
    expect(first?.subject).toBe('Bangla');
    expect(first?.chapterCount).toBe(3);
    expect(first?.questionCount).toBe(26);
    for (const b of books) {
      expect(b.id).toBeTruthy();
      expect(b.title).toBeTruthy();
      expect(b).not.toHaveProperty('slug');
      expect(b).not.toHaveProperty('titleBn');
    }
  });

  it('skips docs without id/title instead of inventing them', () => {
    const { books, skipped } = normalizeBooksFixture([
      { id: 'ok-1', title: 'Real Book' },
      { id: 'no-title' },
      { title: 'No id' },
      null,
    ]);
    expect(books).toEqual([{ id: 'ok-1', title: 'Real Book' }]);
    expect(skipped).toBe(3);
  });
});

describe('buildBookHead agrees with bookSeoData', () => {
  it('produces the same title, description and canonical as src/lib/seo.ts', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const book = books.find((b) => b.id === 'hons-211001');
    expect(book).toBeDefined();
    for (const lang of ['bn', 'en'] as const) {
      const expected = bookSeoData(book!, lang);
      const head = buildBookHead(book!, lang);
      expect(head).toContain(`<title>${expected.title}</title>`);
      expect(head).toContain(`content="${expected.description}"`);
      expect(head).toContain(`rel="canonical" href="${expected.canonical}"`);
      expect(head).toContain('hreflang="bn" href="https://eduvelto.com/bn/books/hons-211001"');
      expect(head).toContain('hreflang="en" href="https://eduvelto.com/en/books/hons-211001"');
      expect(head).toContain('hreflang="x-default" href="https://eduvelto.com/bn/books/hons-211001"');
      expect(head).toContain('"@type":"Book"');
      expect(head).toContain('"isAccessibleForFree":true');
      expect(head).toContain('History and Culture of Bangladesh and Bengalees');
    }
  });

  it('prerendered summary HTML carries the same paragraph as lib/seo.ts', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const book = books.find((b) => b.id === 'hons-211001');
    expect(book).toBeDefined();
    for (const lang of ['bn', 'en'] as const) {
      const html = buildBookSummaryHtml(book!, lang);
      expect(html).toContain('data-prerender="book-summary"');
      // The prerendered paragraph IS the client-side paragraph:
      // same formula in src/lib/seo.ts (buildBookSummary) and here.
      expect(html).toContain(buildBookSummaryTs(book!, lang));
      expect(html).toContain(buildBookSummary(book!, lang));
    }
  });

  it('buildBookSummary (mjs) agrees with buildBookSummary (seo.ts)', () => {
    const book = { id: 'x-1', title: 'Bare Book', chapterCount: 5 };
    expect(buildBookSummary(book, 'bn')).toBe(buildBookSummaryTs(book, 'bn'));
    expect(buildBookSummary(book, 'en')).toBe(buildBookSummaryTs(book, 'en'));
    expect(buildBookSummary({ id: 'x-2', title: 'No Counts' }, 'bn')).toBe(
      buildBookSummaryTs({ id: 'x-2', title: 'No Counts' }, 'bn'),
    );
  });

  it('omits counts it does not have', () => {
    const head = buildBookHead({ id: 'x-1', title: 'Bare Book' }, 'bn');
    expect(head).not.toContain('Chapters');
    expect(head).not.toContain('Questions');
  });
});

describe('Firestore REST parsing', () => {
  it('parses a REST book document (doc id from the resource name)', () => {
    const doc = {
      name: 'projects/eduvelto/databases/(default)/documents/books/hons-211001',
      fields: {
        title: { stringValue: 'Some Title' },
        subject: { stringValue: 'Bangla' },
        chapterCount: { integerValue: '3' },
        questionCount: { integerValue: '26' },
      },
    };
    expect(parseFirestoreRestDoc(doc)).toEqual({
      id: 'hons-211001',
      title: 'Some Title',
      subject: 'Bangla',
      chapterCount: 3,
      questionCount: 26,
    });
  });

  it('fails fast on 429 instead of retrying into the quota', async () => {
    const stubFetch = async () => ({ status: 429, ok: false, json: async () => ({}) });
    await expect(fetchBooksFromRest('eduvelto', stubFetch)).rejects.toThrow(/429/);
  });

  it('pages through REST results', async () => {
    const page1 = {
      documents: [
        { name: 'projects/p/databases/(default)/documents/books/b-2', fields: { title: { stringValue: 'B2' } } },
      ],
      nextPageToken: 'tok',
    };
    const page2 = {
      documents: [
        { name: 'projects/p/databases/(default)/documents/books/b-1', fields: { title: { stringValue: 'B1' } } },
      ],
    };
    const calls: string[] = [];
    const stubFetch = async (url: string) => {
      calls.push(url);
      return { status: 200, ok: true, json: async () => (calls.length === 1 ? page1 : page2) };
    };
    const books = await fetchBooksFromRest('eduvelto', stubFetch);
    expect(books.map((b) => b.id)).toEqual(['b-1', 'b-2']);
    expect(calls[1]).toContain('pageToken=tok');
  });
});

describe('rewriteInternalHrefs', () => {
  it('prefixes public hrefs, leaves assets and prefixed hrefs alone', () => {
    const html = '<a href="/jobs/bcs">x</a><a href="/library">y</a><a href="/">h</a><link href="/manifest.webmanifest"><img src="/og-image.jpg">';
    const out = rewriteInternalHrefs(html, 'bn');
    expect(out).toContain('href="/bn/jobs/bcs"');
    expect(out).toContain('href="/bn/library"');
    expect(out).toContain('href="/bn"');
    expect(out).toContain('href="/manifest.webmanifest"');
    expect(out).toContain('src="/og-image.jpg"');
    expect(rewriteInternalHrefs('<a href="/en/jobs">x</a>', 'bn')).toContain('href="/en/jobs"');
  });
});

describe('buildSitemapXml / buildRobotsTxt', () => {
  it('emits canonical bn + en URLs only, with reciprocal hreflang', () => {
    const xml = buildSitemapXml([
      { loc: 'https://eduvelto.com/bn/jobs/bcs', bn: 'https://eduvelto.com/bn/jobs/bcs', en: 'https://eduvelto.com/en/jobs/bcs' },
      { loc: 'https://eduvelto.com/bn/books/hons-211001', bn: 'https://eduvelto.com/bn/books/hons-211001', en: 'https://eduvelto.com/en/books/hons-211001' },
    ]);
    expect(xml.match(/<loc>/g)?.length).toBe(2);
    expect(xml).not.toMatch(/<loc>https:\/\/eduvelto\.com\/(jobs|books)\//);
    expect(xml).toContain('hreflang="x-default" href="https://eduvelto.com/bn/jobs/bcs"');
  });

  it('allows / and disallows /app/ + /login, with a Sitemap line, and does not block /books/', () => {
    const robots = buildRobotsTxt();
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /app/');
    expect(robots).toContain('Disallow: /login');
    expect(robots).toContain('Sitemap: https://eduvelto.com/sitemap.xml');
    expect(robots).not.toContain('Disallow: /books/');
  });
});

// ---------------------------------------------------------------------------
// Phase 2b — __INITIAL_DATA__ payload (25 Nov 2026).
// ---------------------------------------------------------------------------

describe('normalizeBooksFixture carries the payload fields', () => {
  it('hons-211001 carries bilingual/educationType/credit/marks', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const first = books.find((b) => b.id === 'hons-211001');
    expect(first?.bilingual).toBe(false);
    expect(first?.educationType).toBe('Higher');
    expect(first?.credit).toBe(4);
    expect(first?.marks).toBe(100);
    expect(books.filter((b) => b.bilingual === true).length).toBe(64);
  });
});

describe('normalizeChaptersFixture (24 Nov backup)', () => {
  it('loads all 2,307 real chapters, skips none', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { chapters, skipped } = normalizeChaptersFixture(raw);
    expect(chapters.length).toBe(2307);
    expect(skipped).toBe(0);
    expect(chapters.filter((c) => c.reviewStatus === 'Published').length).toBe(2305);
    expect(chapters.filter((c) => c.reviewStatus === 'Under Review').length).toBe(2);
    // The fixture carries NO isPreview flags (verified 25 Nov 2026):
    // guest payloads honestly carry zero chapters until the loader
    // sets isPreview on live rows.
    expect(chapters.filter((c) => c.isPreview === true).length).toBe(0);
    const hons = chapters.filter((c) => c.bookId === 'hons-211001');
    expect(hons.map((c) => c.id)).toEqual(['hons-211001--part-a', 'hons-211001--part-b', 'hons-211001--part-c']);
    expect(hons.map((c) => c.order)).toEqual([1, 2, 3]);
  });

  it('skips docs without id/bookId/title instead of inventing them', () => {
    const { chapters, skipped } = normalizeChaptersFixture([
      { id: 'c-1', bookId: 'b-1', title: 'Real Chapter' },
      { id: 'no-book' },
      { bookId: 'b-1', title: 'No id' },
      null,
    ]);
    expect(chapters).toEqual([
      { id: 'c-1', bookId: 'b-1', title: 'Real Chapter', isPreview: false },
    ]);
    expect(skipped).toBe(3);
  });
});

describe('parseChapterRestDoc / fetchChaptersFromRest', () => {
  it('parses a REST chapter document', () => {
    const doc = {
      name: 'projects/eduvelto/databases/(default)/documents/chapters/hons-211001--part-a',
      fields: {
        bookId: { stringValue: 'hons-211001' },
        title: { stringValue: '10 Short Questions (1 mark each)' },
        part: { stringValue: 'A' },
        set: { integerValue: '1' },
        order: { integerValue: '1' },
        questionCount: { integerValue: '10' },
        reviewStatus: { stringValue: 'Published' },
        isPreview: { booleanValue: true },
      },
    };
    expect(parseChapterRestDoc(doc)).toEqual({
      id: 'hons-211001--part-a',
      bookId: 'hons-211001',
      title: '10 Short Questions (1 mark each)',
      part: 'A',
      set: 1,
      order: 1,
      questionCount: 10,
      reviewStatus: 'Published',
      isPreview: true,
    });
  });

  it('fails fast on 429 instead of retrying into the quota', async () => {
    const stubFetch = async () => ({ status: 429, ok: false, json: async () => ({}) });
    await expect(fetchChaptersFromRest('eduvelto', stubFetch)).rejects.toThrow(/429/);
  });
});

describe('buildClassLevelCounts (24 Nov backup)', () => {
  it('counts all seven levels from the books (loader stats cover only five)', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const counts = buildClassLevelCounts(books);
    expect(counts).toEqual([
      { slug: 'class-1-5', bookCount: 0, subjectCount: 0 },
      { slug: 'class-6-8', bookCount: 0, subjectCount: 0 },
      { slug: 'class-9-10', bookCount: 26, subjectCount: 3 },
      { slug: 'hsc', bookCount: 37, subjectCount: 3 },
      { slug: 'honours-masters', bookCount: 439, subjectCount: 15 },
      { slug: 'technical', bookCount: 72, subjectCount: 3 },
      { slug: 'madrasa', bookCount: 35, subjectCount: 1 },
    ]);
    // The loader stats cover only 5 of 7 levels — Technical (72) and
    // Madrasa (35) have no stats doc, so a stats-based payload would
    // show a false zero for them. The book-derived counts cover all.
    expect(counts.reduce((s, c) => s + c.bookCount, 0)).toBe(609);
  });

  it('agrees with the TS booksForClass / subjectsForClass formulas', () => {
    // The .mjs mirror table (CLASS_LEVEL_BOOK_FILTERS) must stay in
    // sync with CLASS_LEVELS — this cross-check fails the suite on
    // drift instead of shipping wrong counts.
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const counts = buildClassLevelCounts(books);
    const tsBooks = books as unknown as Book[];
    expect(CLASS_LEVELS.map((d) => d.slug)).toEqual(counts.map((c) => c.slug));
    for (const def of CLASS_LEVELS) {
      const c = counts.find((x) => x.slug === def.slug);
      expect(c?.bookCount, `${def.slug} bookCount`).toBe(booksForClass(tsBooks, def).length);
      expect(c?.subjectCount, `${def.slug} subjectCount`).toBe(subjectsForClass(tsBooks, def).length);
    }
  });
});

describe('__INITIAL_DATA__ payload builders', () => {
  it('buildBookPayload carries the book + preview chapters only', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const { chapters } = normalizeChaptersFixture(raw);
    const book = books.find((b) => b.id === 'hons-211001');
    const preview = chapters.filter(
      (c) => c.bookId === 'hons-211001' && c.reviewStatus === 'Published' && c.isPreview === true,
    );
    expect(book).toBeDefined();
    if (!book) throw new Error('fixture book hons-211001 missing');
    const payload = buildBookPayload('/bn/books/hons-211001', book, preview);
    expect(payload.kind).toBe('book');
    expect(payload.path).toBe('/bn/books/hons-211001');
    expect(payload.book.title).toBe(book?.title);
    expect(payload.book.credit).toBe(4);
    expect(payload.chapters).toEqual([]);
    // No lesson/question content ever rides in a payload.
    expect(JSON.stringify(payload)).not.toContain('questions');
  });

  it('buildLibraryPayload carries page 1 (50 books) + the id cursor', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const payload = buildLibraryPayload('/bn/books', books);
    expect(payload.kind).toBe('library');
    expect(payload.books).toHaveLength(50);
    expect(payload.hasMore).toBe(true);
    // Document-ID order: the 50th book by id is the cursor.
    expect(payload.lastDocId).toBe('hons-212609');
    // Never the whole library on one page.
    expect(payload.books.length).toBeLessThan(books.length);
  });

  it('buildClassIndexPayload carries all seven levels', () => {
    const raw = JSON.parse(readFileSync(BACKUP_PATH, 'utf8'));
    const { books } = normalizeBooksFixture(raw);
    const payload = buildClassIndexPayload('/bn/class', books);
    expect(payload?.kind).toBe('class-index');
    expect(payload?.levels).toHaveLength(7);
    expect(payload?.levels.reduce((s, l) => s + l.bookCount, 0)).toBe(609);
  });
});

describe('__INITIAL_DATA__ script tag (CSP-safe carrier)', () => {
  it('safeJsonForInlineScript escapes </script> and U+2028/2029', () => {
    const out = safeJsonForInlineScript({ t: 'a</script>b c d' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script\\u003e');
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    expect(JSON.parse(out)).toEqual({ t: 'a</script>b c d' });
  });

  it('the tag is a JSON data block, never an executable inline script', () => {
    const tag = buildInitialDataScriptTag({
      kind: 'book',
      path: '/bn/books/hons-211001',
      book: { id: 'hons-211001', title: 'T' },
      chapters: [],
    });
    expect(tag).toContain('id="__INITIAL_DATA__"');
    expect(tag).toContain('type="application/json"');
    // No executable assignment: the hash-only script-src CSP would
    // block `window.__INITIAL_DATA__ = ...` in production.
    expect(tag).not.toContain('window.__INITIAL_DATA__ =');
    expect(tag).toContain('hons-211001');
  });

  it('insertInitialDataScript places the tag after #root, before the bundle script', () => {
    const html =
      '<html><body><div id="root">\napp\n    </div>\n    <script>\ntheme\n</script>\n    <script type="module" src="/assets/index-abc.js"></script></body></html>';
    const out = insertInitialDataScript(html, '<script id="__INITIAL_DATA__" type="application/json">{}</script>');
    expect(out.indexOf('__INITIAL_DATA__')).toBeGreaterThan(out.indexOf('</div>'));
    expect(out.indexOf('__INITIAL_DATA__')).toBeLessThan(out.indexOf('type="module"'));
    expect(out).toContain('app');
  });

  it('insertInitialDataScript leaves unknown template shapes unchanged', () => {
    expect(insertInitialDataScript('<html>no root here</html>', '<script id="x"></script>')).toBe(
      '<html>no root here</html>',
    );
  });
});
