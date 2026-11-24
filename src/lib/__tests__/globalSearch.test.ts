// Eduvelto — Global Search unit tests (homepage redesign, 24 Nov 2026).
//
// Pure functions only — no DOM, no Firebase, no network. The static
// catalogue is built from the same defs the pages use (JOB_EXAMS,
// CLASS_LEVELS, opportunity seed, life tools), so these tests also
// guard the honesty rules: every static result links to a route that
// exists, no invented courses, no fake counts.

import { describe, expect, it } from 'vitest';
import { buildStaticCatalogue, searchBooks, searchStatic } from '../globalSearch';
import type { Book } from '../content';

const BOOKS: Book[] = [
  {
    id: 'hons-231101',
    title: 'Elizabethan and Jacobean Drama',
    paperCode: '231101',
    educationType: 'Higher',
    board: 'National University',
    program: 'Honours',
    classLevel: '3rd Year',
    department: 'English',
    departments: ['English'],
    subject: 'English',
    sourceType: 'textbook',
    sourceUrl: '',
    language: 'en',
    bilingual: false,
    questionCount: 120,
    chapterCount: 12,
    reviewStatus: 'Published',
  },
  {
    id: 'mad-1',
    title: 'আল-ফিকহ',
    paperCode: '',
    educationType: 'Madrasa',
    board: 'Bangladesh Madrasa Education Board',
    program: 'Alim',
    classLevel: 'Alim',
    department: 'Madrasa',
    departments: ['Madrasa'],
    subject: 'ফিকহ',
    sourceType: 'textbook',
    sourceUrl: '',
    language: 'bn',
    bilingual: false,
    questionCount: 40,
    chapterCount: 5,
    reviewStatus: 'Published',
  },
];

describe('searchStatic', () => {
  it('finds a job exam hub by its Bangla name', () => {
    const hits = searchStatic('বিসিএস');
    expect(hits.some((h) => h.to === '/jobs/bcs')).toBe(true);
  });

  it('finds a job exam hub by its English name', () => {
    const hits = searchStatic('bank');
    expect(hits.some((h) => h.to === '/jobs/bank')).toBe(true);
  });

  it('finds the scholarship opportunity by type', () => {
    const hits = searchStatic('স্কলারশিপ');
    expect(hits.some((h) => h.to === '/opportunities/commonwealth-shared-2027')).toBe(true);
  });

  it('finds a life service by name', () => {
    const hits = searchStatic('ক্যালকুলেটর');
    expect(hits.some((h) => h.to === '/life/calculators')).toBe(true);
  });

  it('finds the class level pages', () => {
    const hits = searchStatic('অনার্স');
    expect(hits.some((h) => h.to === '/class/honours-masters')).toBe(true);
  });

  it('never links to a route that does not exist (no /courses, /blog, /help, /settings)', () => {
    const catalogue = buildStaticCatalogue();
    for (const r of catalogue) {
      expect(r.to).not.toMatch(/^\/(courses|blog|help|settings|notifications)/);
    }
    // And no result claims a live AI chat.
    for (const r of catalogue) {
      expect(`${r.titleBn} ${r.titleEn} ${r.descBn} ${r.descEn}`.toLowerCase()).not.toContain('ai chat');
    }
  });

  it('returns nothing for an empty query', () => {
    expect(searchStatic('')).toEqual([]);
    expect(searchStatic('   ')).toEqual([]);
  });
});

describe('searchBooks', () => {
  it('matches a book by title', () => {
    const hits = searchBooks(BOOKS, 'drama');
    expect(hits).toHaveLength(1);
    expect(hits[0].to).toBe('/library/hons-231101');
    expect(hits[0].metaBn).toContain('১২টি অধ্যায়');
  });

  it('matches a book by Bangla title', () => {
    const hits = searchBooks(BOOKS, 'ফিকহ');
    expect(hits).toHaveLength(1);
    expect(hits[0].to).toBe('/library/mad-1');
  });

  it('matches by department and paper code', () => {
    expect(searchBooks(BOOKS, 'English')).toHaveLength(1);
    expect(searchBooks(BOOKS, '231101')).toHaveLength(1);
  });

  it('normalises Bengali digits so "৩" matches "3"', () => {
    expect(searchBooks(BOOKS, '3rd')).toHaveLength(1);
    expect(searchBooks(BOOKS, '৩rd')).toHaveLength(1);
  });

  it('returns nothing for an empty query and for no match', () => {
    expect(searchBooks(BOOKS, '')).toEqual([]);
    expect(searchBooks(BOOKS, 'quantum physics xyz')).toEqual([]);
  });
});
