// Eduvelto — Phase 4 tests (25 Nov 2026, feature/ssg-bilingual-support).
//
// Guards the four Phase 4 parts:
// - homepage live search: pure filtering over title / subject /
//   classLevel (case-insensitive, Bengali digits, Latin diacritics),
//   minimum query length, result cap — no I/O, so no login and no
//   Firestore read is involved by construction;
// - daily quiz: deterministic 5/day from the 35-question public
//   pool ONLY (no gated lesson/question id can ever appear), share
//   URL is the standard facebook sharer.php link;
// - marketing kit: the forbidden strings appear in NO kit file,
//   and the counts are exact (30 posts, 15 scripts, 5 gig texts
//   with the website gig marked DRAFT);
// - the generated search index file: 609 entries, compact shape.

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BOOK_SEARCH_INDEX_URL,
  BOOK_SEARCH_MAX_RESULTS,
  __clearBookSearchIndexCache,
  buildBookSearchIndex,
  filterBookSearchIndex,
  filterBooksForLiveSearch,
  loadBookSearchIndex,
  normalizeSearchText,
  type Book,
  type BookSearchEntry,
} from '../bookSearchIndex';
import {
  DAILY_QUIZ_COUNT,
  DAILY_QUIZ_POOL_SIZE,
  buildDailyQuizShareText,
  buildDailyQuizShareUrl,
  dailyQuizDateString,
  selectDailyQuizQuestions,
} from '../dailyQuiz';
import {
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_READING_PASSAGE,
} from '../publicBcsEnglish';

const KIT = resolve(__dirname, '../../../marketing-kit');
const PUBLIC = resolve(__dirname, '../../../public');

function kitFiles(): string[] {
  return readdirSync(KIT)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(resolve(KIT, f), 'utf8'));
}

function book(over: Partial<Book>): Book {
  return {
    id: 'x1',
    title: 'History of Bangla Language',
    paperCode: '211003',
    educationType: 'Higher',
    board: '',
    program: 'Honours',
    classLevel: '1st Year',
    department: 'Bangla',
    departments: ['Bangla'],
    subject: 'Bangla',
    sourceType: '',
    sourceUrl: '',
    language: 'bn',
    bilingual: false,
    questionCount: 120,
    chapterCount: 8,
    reviewStatus: 'Published',
    ...over,
  };
}

const SAMPLE_INDEX: BookSearchEntry[] = [
  { id: 'hons-211001', title: 'History and Culture of Bangladesh and Bengalees', subject: 'Bangla', classLevel: '1st Year' },
  { id: 'hsc-phy-1', title: 'Physics First Paper', subject: 'Physics', classLevel: 'HSC 1st Year' },
  { id: 'class9-math', title: 'General Mathematics', subject: 'Mathematics', classLevel: 'Class 9' },
];

describe('book search index (Phase 4, Part 1)', () => {
  it('normalises case, Bengali digits and Latin diacritics', () => {
    expect(normalizeSearchText('HISTORY')).toBe('history');
    expect(normalizeSearchText('৫ম')).toBe('5ম');
    expect(normalizeSearchText('café')).toBe('cafe');
    expect(normalizeSearchText('  Physics   First ')).toBe('physics first');
  });

  it('matches title, subject and classLevel', () => {
    expect(filterBookSearchIndex(SAMPLE_INDEX, 'History').map((e) => e.id)).toEqual([
      'hons-211001',
    ]);
    expect(filterBookSearchIndex(SAMPLE_INDEX, 'Physics').map((e) => e.id)).toEqual([
      'hsc-phy-1',
    ]);
    expect(filterBookSearchIndex(SAMPLE_INDEX, 'Class 9').map((e) => e.id)).toEqual([
      'class9-math',
    ]);
    // Subject match: 'Bangla' is the subject of the history book.
    expect(filterBookSearchIndex(SAMPLE_INDEX, 'bangla').map((e) => e.id)).toEqual([
      'hons-211001',
    ]);
  });

  it('Bengali digit in the query matches the ASCII digit in the entry', () => {
    expect(filterBookSearchIndex(SAMPLE_INDEX, '৯').length).toBe(0); // below min length
    expect(filterBookSearchIndex(SAMPLE_INDEX, 'Class ৯').map((e) => e.id)).toEqual([
      'class9-math',
    ]);
  });

  it('returns nothing below the minimum query length and caps results', () => {
    expect(filterBookSearchIndex(SAMPLE_INDEX, 'H')).toEqual([]);
    expect(filterBookSearchIndex(SAMPLE_INDEX, '  ')).toEqual([]);
    const many: BookSearchEntry[] = Array.from({ length: 30 }, (_, i) => ({
      id: `b${i}`,
      title: `Test Book ${i}`,
      subject: 'Test',
      classLevel: 'Class 9',
    }));
    expect(filterBookSearchIndex(many, 'Test')).toHaveLength(BOOK_SEARCH_MAX_RESULTS);
  });

  it('buildBookSearchIndex keeps Published books only, compact shape', () => {
    const entries = buildBookSearchIndex([
      book({ id: 'a', reviewStatus: 'Published' }),
      book({ id: 'b', reviewStatus: 'Draft' }),
    ]);
    expect(entries).toEqual([
      { id: 'a', title: 'History of Bangla Language', subject: 'Bangla', classLevel: '1st Year' },
    ]);
  });

  it('filterBooksForLiveSearch (cached-list fallback) matches the index path', () => {
    const books = SAMPLE_INDEX.map((e) =>
      book({ id: e.id, title: e.title, subject: e.subject, classLevel: e.classLevel }),
    );
    expect(filterBooksForLiveSearch(books, 'History').map((e) => e.id)).toEqual([
      'hons-211001',
    ]);
  });

  it('the generated index file has 609 compact entries', () => {
    const data = JSON.parse(readFileSync(resolve(PUBLIC, 'book-search-index.json'), 'utf8'));
    expect(data.version).toBe(1);
    expect(data.count).toBe(609);
    expect(data.entries).toHaveLength(609);
    for (const e of data.entries) {
      expect(Object.keys(e).sort()).toEqual(['classLevel', 'id', 'subject', 'title']);
      expect(e.id).not.toBe('');
      expect(e.title).not.toBe('');
    }
  });

  it('loadBookSearchIndex fetches once and caches; a failure clears the cache', async () => {
    __clearBookSearchIndexCache();
    let calls = 0;
    const okFetch = (async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({ version: 1, generatedAt: 'x', count: 1, entries: SAMPLE_INDEX }),
      };
    }) as unknown as typeof fetch;
    const first = await loadBookSearchIndex(okFetch);
    const second = await loadBookSearchIndex(okFetch);
    expect(first).toEqual(SAMPLE_INDEX);
    expect(second).toBe(first);
    expect(calls).toBe(1);
    expect(BOOK_SEARCH_INDEX_URL).toBe('/book-search-index.json');

    __clearBookSearchIndexCache();
    const badFetch = (async () => ({ ok: false, status: 404 })) as unknown as typeof fetch;
    await expect(loadBookSearchIndex(badFetch)).rejects.toThrow();
    // Cache cleared on failure: a retry re-fetches instead of
    // replaying the rejection.
    const retried = await loadBookSearchIndex(okFetch);
    expect(retried).toEqual(SAMPLE_INDEX);
    expect(calls).toBe(2);
    __clearBookSearchIndexCache();
  });
});

describe('daily quiz (Phase 4, Part 2)', () => {
  it('pool is exactly the 35 verified public BCS English questions', () => {
    expect(DAILY_QUIZ_POOL_SIZE).toBe(35);
    expect(PUBLIC_BCS_ENGLISH_QUESTIONS).toHaveLength(35);
    expect(DAILY_QUIZ_COUNT).toBe(5);
  });

  it('selection is deterministic per date', () => {
    const a = selectDailyQuizQuestions('2026-11-25').map((q) => q.id);
    const b = selectDailyQuizQuestions('2026-11-25').map((q) => q.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
    expect(new Set(a).size).toBe(5);
  });

  it('different dates rotate the set', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 14; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      seen.add(selectDailyQuizQuestions(date).map((q) => q.id).join(','));
    }
    // 14 days must not all produce the same 5 questions.
    expect(seen.size).toBeGreaterThan(1);
  });

  it('draws only from the public pool — no gated content id can appear', () => {
    const poolIds = new Set(PUBLIC_BCS_ENGLISH_QUESTIONS.map((q) => q.id));
    for (let d = 1; d <= 31; d++) {
      const date = `2026-12-${String(d).padStart(2, '0')}`;
      for (const q of selectDailyQuizQuestions(date)) {
        expect(poolIds.has(q.id)).toBe(true);
        expect(q.id.startsWith('bcs-eng-')).toBe(true);
      }
    }
    // The reading passage is the public batch's own passage.
    expect(PUBLIC_BCS_READING_PASSAGE.usedBy).toEqual(['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035']);
  });

  it('rejects a bad date and a too-small pool', () => {
    expect(() => selectDailyQuizQuestions('25-11-2026')).toThrow();
    expect(() =>
      selectDailyQuizQuestions('2026-11-25', PUBLIC_BCS_ENGLISH_QUESTIONS.slice(0, 3)),
    ).toThrow();
  });

  it('today’s date string is local YYYY-MM-DD', () => {
    expect(dailyQuizDateString(new Date(2026, 10, 25))).toBe('2026-11-25');
  });

  it('share URL is the standard Facebook sharer.php link', () => {
    const url = buildDailyQuizShareUrl(4, '2026-11-25');
    expect(url.startsWith('https://www.facebook.com/sharer/sharer.php?')).toBe(true);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('u')).toBe('https://eduvelto.com/');
    const quote = parsed.searchParams.get('quote') ?? '';
    expect(quote).toContain('৫-এর মধ্যে 4');
    expect(quote).toContain('৩৫টি যাচাইকৃত');
    // Never a real exam or a mock.
    expect(quote).not.toMatch(/মক|আসল পরীক্ষা/);
    expect(buildDailyQuizShareText(5, '2026-11-25')).toContain('৫-এর মধ্যে 5');
  });
});

describe('marketing kit (Phase 4, Parts 3–4)', () => {
  const FORBIDDEN = ['আবেদন চলছে', '100% কমন', 'নিশ্চিত কমন', 'প্রথম শ্রেণি'];

  it('no forbidden claim string appears in any kit file', () => {
    for (const text of kitFiles()) {
      for (const s of FORBIDDEN) {
        expect(text).not.toContain(s);
      }
      // No guaranteed-outcome claim in English either.
      expect(text).not.toContain('100% common');
      expect(text).not.toContain('guaranteed');
    }
  });

  it('has exactly 30 Facebook posts and 15 video scripts', () => {
    const posts = kitFiles().join('\n').match(/^## পোস্ট /gm) ?? [];
    const scripts = kitFiles().join('\n').match(/^## স্ক্রিপ্ট /gm) ?? [];
    expect(posts).toHaveLength(30);
    expect(scripts).toHaveLength(15);
  });

  it('every post and script links Eduvelto and states no false class range', () => {
    const all = kitFiles().join('\n');
    expect(all).toContain('eduvelto.com');
    expect(all).not.toContain('Class 1–12');
    expect(all).not.toContain('শ্রেণি ১–১২');
  });

  it('Fiverr gig file has the 4 live gigs and the website gig marked DRAFT', () => {
    const gigs = readFileSync(resolve(KIT, 'fiverr-gig-descriptions.md'), 'utf8');
    expect(gigs).toContain('I will create a faceless youtube video with script, ai voiceover, editing and thumbnail');
    expect(gigs).toContain('I will edit your reels, youtube shorts and tiktoks with captions and hooks');
    expect(gigs).toContain('I will be your monthly facebook and instagram page manager');
    expect(gigs).toContain('I will create an ai video ad for your small business with voiceover and captions');
    expect(gigs).toContain('I will build a modern responsive business website');
    expect(gigs).toContain('## Gig 5 — Business Website (DRAFT — NOT YET LIVE)');
    expect(gigs).toContain('NOT yet live');
    // Live prices as approved.
    expect(gigs).toContain('Basic — $15');
    expect(gigs).toContain('Basic — $10');
    expect(gigs).toContain('Basic — $30/month');
    expect(gigs).toContain('Basic — $50');
  });

  it('outreach templates and portfolio showcase exist and use only true numbers', () => {
    const showcase = readFileSync(resolve(KIT, 'portfolio-showcase.md'), 'utf8');
    expect(showcase).toContain('609 books');
    expect(showcase).toContain('2,307 chapters');
    expect(showcase).toContain('23,259 questions');
    expect(showcase).toContain('1,014 exams');
    for (const f of [
      'outreach-coaching-centres-bn.md',
      'outreach-coaching-centres-en.md',
      'outreach-saas-founders-en.md',
      'fiverr-proposals.md',
    ]) {
      expect(readFileSync(resolve(KIT, f), 'utf8')).toContain('eduvelto.com');
    }
  });
});
