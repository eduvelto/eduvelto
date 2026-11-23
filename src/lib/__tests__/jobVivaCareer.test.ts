// Eduvelto — Job Step 16 (viva / career / CV) unit tests.
//
// The 15 reading items are code content, so the tests guard what
// matters most: the count and shape (10–15 items), the lessonType
// mapping, and the HONESTY denylist — no viva marks, no NTRCA 19th
// pattern, no age limits, no fees, no dates, no "Verified" claim,
// no pass guarantee anywhere in the text.

import { describe, expect, it } from 'vitest';
import {
  JOB_CAREER_ITEMS,
  JOB_CV_ITEMS,
  JOB_GUIDE_ITEMS,
  JOB_GUIDE_KINDS,
  JOB_VIVA_ITEMS,
  VIVA_DOCUMENT_ITEMS,
  jobGuideItemsFor,
  loadVivaIntroDraft,
  parseVivaChecklist,
  saveVivaIntroDraft,
  toggleVivaChecklistItem,
} from '../jobVivaCareer';
import { isJobGuideLessonType, JOB_STEP16_LESSON_TYPES } from '../jobContent';

/** Every string of every item, for the honesty scan. */
function allItemStrings(): string[] {
  const out: string[] = [];
  for (const item of JOB_GUIDE_ITEMS) {
    out.push(item.titleBn, item.titleEn, item.introBn, item.summaryBn);
    for (const s of item.sections) {
      out.push(s.headingBn, ...s.bulletsBn);
    }
  }
  return out;
}

/**
 * Prohibited patterns — any match is a content bug, not a test
 * nitpick. The patterns are VALUE-based, not concept-based: telling
 * a student to check the circular's age limit / fee / deadline is
 * guidance ("বিজ্ঞপ্তিতে দেখে নিন"), but stating a value as fact is
 * forbidden. So "বয়সসীমা" alone is allowed, "বয়সসীমা ৩০ বছর" is
 * not; "শেষ তারিখ দেখে নিন" is allowed, "শেষ তারিখ ১৫ ডিসেম্বর" is
 * not. "ফোন নম্বর" (CV checklist) is fine, so bare "নম্বর" is never
 * banned — only viva/exam mark phrasings are.
 */
const PROHIBITED: Array<{ re: RegExp; why: string }> = [
  { re: /ভাইভার নম্বর/, why: 'BCS viva marks must never be written' },
  { re: /ভাইভায় .*নম্বর|নম্বর.*ভাইভা/, why: 'viva marks must never be written' },
  { re: /মোট নম্বর|পাস নম্বর|পাস মার্ক|পাশ নম্বর/, why: 'exam marks must never be written' },
  { re: /বয়সসীমা.{0,12}[০-৯0-9]|বয়স.{0,5}\d+\s*বছর/, why: 'age limits must never be written as facts' },
  { re: /আবেদন ফি.{0,12}[০-৯0-9]|ফি.{0,5}[০-৯0-9]+\s*টাকা/, why: 'fees must never be written as facts' },
  { re: /১৯তম|19th|২০তম|20th/, why: 'specific exam-cycle patterns must never be written' },
  { re: /যাচাইকৃত|Verified|verified/, why: 'no Verified badge on Step 16 reading items' },
  { re: /নিশ্চিত|গ্যারান্টি|guarantee/i, why: 'no pass/job guarantee' },
  { re: /শেষ তারিখ.{0,12}[০-৯0-9]|(?:^|[\s,।:;()\-"'])(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)(?=[\s,।:;()\-"']|[০-৯0-9]|$)/, why: 'no deadline dates' },
  { re: /২০২\d|202\d/, why: 'no year/date claims' },
  { re: /সিমুলেটর|simulator|AI.*সাক্ষাৎকার|মক ইন্টারভিউ/, why: 'no fake interactive engine is promised' },
  { re: /অবশ্যই.*আসে|আসবেই/, why: 'never claim a question will definitely appear' },
];

describe('Step 16 content set', () => {
  it('has 15 items in range 10–15: viva 6, career 5, cv 4', () => {
    expect(JOB_GUIDE_ITEMS).toHaveLength(15);
    expect(JOB_VIVA_ITEMS).toHaveLength(6);
    expect(JOB_CAREER_ITEMS).toHaveLength(5);
    expect(JOB_CV_ITEMS).toHaveLength(4);
    expect(jobGuideItemsFor('viva')).toBe(JOB_VIVA_ITEMS);
    expect(jobGuideItemsFor('career')).toBe(JOB_CAREER_ITEMS);
    expect(jobGuideItemsFor('cv')).toBe(JOB_CV_ITEMS);
  });

  it('has unique kebab-case slugs', () => {
    const slugs = JOB_GUIDE_ITEMS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('uses only the four Step 16 lesson types, in the right places', () => {
    expect(JOB_STEP16_LESSON_TYPES).toEqual([
      'viva-question',
      'viva-guide',
      'career-guide',
      'cv-guide',
    ]);
    for (const item of JOB_VIVA_ITEMS) {
      expect(['viva-question', 'viva-guide']).toContain(item.type);
    }
    for (const item of JOB_CAREER_ITEMS) expect(item.type).toBe('career-guide');
    for (const item of JOB_CV_ITEMS) expect(item.type).toBe('cv-guide');
    for (const item of JOB_GUIDE_ITEMS) {
      expect(isJobGuideLessonType(item.type)).toBe(true);
    }
    expect(isJobGuideLessonType('lesson')).toBe(false);
    expect(isJobGuideLessonType('viva-question')).toBe(true);
    expect(isJobGuideLessonType(null)).toBe(false);
  });

  it('every item has a title, intro, 3–4 sections, summary and a 3–5 min read', () => {
    for (const item of JOB_GUIDE_ITEMS) {
      expect(item.titleBn.length, item.slug).toBeGreaterThan(0);
      expect(item.titleEn.length, item.slug).toBeGreaterThan(0);
      expect(item.introBn.length, item.slug).toBeGreaterThan(40);
      expect(item.sections.length, item.slug).toBeGreaterThanOrEqual(3);
      expect(item.sections.length, item.slug).toBeLessThanOrEqual(4);
      for (const s of item.sections) {
        expect(s.headingBn.length, item.slug).toBeGreaterThan(0);
        expect(s.bulletsBn.length, item.slug).toBeGreaterThanOrEqual(2);
        for (const b of s.bulletsBn) expect(b.length, item.slug).toBeGreaterThan(10);
      }
      expect(item.summaryBn.length, item.slug).toBeGreaterThan(20);
      expect(item.readMinutes, item.slug).toBeGreaterThanOrEqual(3);
      expect(item.readMinutes, item.slug).toBeLessThanOrEqual(5);
    }
  });

  it('no prohibited claim anywhere in the content', () => {
    const strings = allItemStrings();
    expect(strings.length).toBeGreaterThan(100);
    for (const { re, why } of PROHIBITED) {
      for (const s of strings) {
        expect(s, `${why} — found in: ${s.slice(0, 80)}`).not.toMatch(re);
      }
    }
  });

  it('the three guide kinds have the right paths', () => {
    expect(JOB_GUIDE_KINDS.map((k) => k.path)).toEqual([
      '/jobs/viva',
      '/jobs/career',
      '/jobs/cv',
    ]);
  });
});

describe('viva document checklist (local state)', () => {
  it('lists the design §8.1 documents', () => {
    const ids = VIVA_DOCUMENT_ITEMS.map((i) => i.id);
    expect(ids).toContain('certificates');
    expect(ids).toContain('nid');
    expect(ids).toContain('photos');
    expect(ids).toContain('circular-copy');
    expect(ids).toHaveLength(6);
  });

  it('parses stored ticks, dropping unknown ids and bad JSON', () => {
    expect(parseVivaChecklist(null)).toEqual([]);
    expect(parseVivaChecklist('')).toEqual([]);
    expect(parseVivaChecklist('not json')).toEqual([]);
    expect(parseVivaChecklist('{"a":1}')).toEqual([]);
    expect(parseVivaChecklist('["nid","nope",42]')).toEqual(['nid']);
    expect(parseVivaChecklist('["nid","photos"]')).toEqual(['nid', 'photos']);
  });

  it('toggles one item at a time and ignores unknown ids', () => {
    expect(toggleVivaChecklistItem([], 'nid')).toEqual(['nid']);
    expect(toggleVivaChecklistItem(['nid'], 'nid')).toEqual([]);
    expect(toggleVivaChecklistItem(['nid'], 'photos')).toEqual(['nid', 'photos']);
    expect(toggleVivaChecklistItem([], 'nope')).toEqual([]);
  });
});

describe('viva intro draft (local state)', () => {
  it('round-trips through a storage-like object and tolerates a missing one', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    expect(loadVivaIntroDraft(storage)).toBe('');
    saveVivaIntroDraft(storage, 'আমার নাম …');
    expect(loadVivaIntroDraft(storage)).toBe('আমার নাম …');
    expect(loadVivaIntroDraft(null)).toBe('');
    expect(() => saveVivaIntroDraft(null, 'x')).not.toThrow();
  });
});
