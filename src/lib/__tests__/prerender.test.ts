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
  buildRobotsTxt,
  buildSitemapXml,
  fetchBooksFromRest,
  getGuidePaths,
  getGuideSlugs,
  normalizeBooksFixture,
  parseFirestoreRestDoc,
  rewriteInternalHrefs,
} from '../../../scripts/prerender.mjs';
import { bookSeoData } from '../seo';

const BACKUP_PATH = join(process.cwd(), '..', 'backups', 'eduvelto-backup-20261124-014508.json');

function readSitemapPaths(): string[] {
  const xml = readFileSync(join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>https:\/\/eduvelto\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
}

describe('PRERENDER_STATIC_PATHS', () => {
  it('covers every committed-sitemap URL except /founder, plus the new /books hub', () => {
    const sitemapPaths = readSitemapPaths();
    expect(sitemapPaths.length).toBe(136);
    for (const p of sitemapPaths) {
      if (p === '/founder') continue; // FounderPage owns its SEO client-side; not prerendered.
      expect(PRERENDER_STATIC_PATHS, `sitemap path missing from prerender list: ${p}`).toContain(p);
    }
    expect(PRERENDER_STATIC_PATHS).toContain('/books');
    expect(PRERENDER_STATIC_PATHS).not.toContain('/founder');
    expect(PRERENDER_STATIC_PATHS).not.toContain('/support'); // no route yet (Phase 2)
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
      expect(head).toContain('History and Culture of Bangladesh and Bengalees');
    }
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
