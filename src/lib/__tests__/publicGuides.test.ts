// Eduvelto — public guides unit tests (24 Nov 2026, brand-SEO wave 1).
//
// The 10 guides are static public data, so the tests guard what
// matters most: exactly 10 guides with unique slugs/paths, 400–700
// words each (pinned to the content pack's counts), every internal
// link pointing at a real route, the draft status never claimed as
// verified/approved, and nothing from the pack's "Unverified — do
// not publish" list sneaking in (no BPSC vacancy totals, no
// Commonwealth conditions beyond the verified deadline, no
// NU 2026–27 circular/dates/fees, no book/coaching names).

import { describe, expect, it } from 'vitest';
import { PUBLIC_GUIDES, publicGuideBySlug, publicGuideWordCount } from '../publicGuides';

const EXPECTED_WORD_COUNTS: Record<string, number> = {
  'bcs-preparation-guide': 441,
  'bank-job-preparation': 425,
  'primary-teacher-preparation': 409,
  'ntrca-preparation': 435,
  'nu-admission-guide': 454,
  'english-grammar-basics': 425,
  'scholarship-guide': 423,
  'what-is-ai': 412,
  'cv-writing-guide': 433,
  'budget-planner-guide': 400,
};

const REAL_ROUTES = new Set([
  '/jobs',
  '/learn',
  '/about',
  '/contact',
  '/opportunities',
  '/life',
  '/life/budget',
  '/jobs/bcs/practice/english',
  '/learn/bcs-english-tense',
  '/learn/bcs-english-preposition',
  '/learn/cv-writing-guide',
  '/learn/scholarship-guide',
  '/learn/english-grammar-basics',
]);

describe('public guides', () => {
  it('has exactly the 10 guides, with unique slugs, paths and titles', () => {
    expect(PUBLIC_GUIDES).toHaveLength(10);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.slug)).size).toBe(10);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.path)).size).toBe(10);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.titleBn)).size).toBe(10);
    for (const g of PUBLIC_GUIDES) {
      expect(g.path).toBe(`/learn/${g.slug}`);
      expect(publicGuideBySlug(g.slug)).toBe(g);
    }
    expect(publicGuideBySlug('not-a-guide')).toBeUndefined();
  });

  it('every guide is 400–700 words (pinned to the content pack counts)', () => {
    for (const g of PUBLIC_GUIDES) {
      const words = publicGuideWordCount(g);
      expect(words, `${g.slug} words`).toBeGreaterThanOrEqual(400);
      expect(words, `${g.slug} words`).toBeLessThanOrEqual(700);
      expect(words, `${g.slug} words`).toBe(EXPECTED_WORD_COUNTS[g.slug]);
    }
  });

  it('every internal link points at a real route', () => {
    for (const g of PUBLIC_GUIDES) {
      expect(g.links.length, `${g.slug} links`).toBeGreaterThan(0);
      for (const l of g.links) {
        expect(REAL_ROUTES.has(l.to), `${g.slug} links to ${l.to}`).toBe(true);
        expect(l.bn.length).toBeGreaterThan(0);
        expect(l.en.length).toBeGreaterThan(0);
      }
    }
  });

  it('no guide claims verification, approval, certificates, rank or "best"', () => {
    const FORBIDDEN = ['অনুমোদিত', 'সার্টিফিকেট', 'সেরা', '১ নম্বর', '#1', 'শূন্যপদ'];
    for (const g of PUBLIC_GUIDES) {
      const text = [...g.bodyBn, g.warningBn ?? ''].join(' ');
      for (const f of FORBIDDEN) {
        expect(text, `${g.slug} contains ${f}`).not.toContain(f);
      }
      expect(g.titleBn).not.toContain('যাচাইকৃত');
    }
  });

  it('NU guide carries the unpublished-circular warning, no 2026–27 dates/fees', () => {
    const nu = publicGuideBySlug('nu-admission-guide')!;
    expect(nu.warningBn).toContain('২০২৬–২৭ শিক্ষাবর্ষের ভর্তি বিজ্ঞপ্তি (সার্কুলার) এখনো প্রকাশিত হয়নি');
    expect(nu.warningBn).toContain('গত শিক্ষাবর্ষের (২০২৫–২৬) যাচাইকৃত নিয়মের ভিত্তিতে');
    const text = nu.bodyBn.join(' ');
    expect(text).toContain('১,০০০ টাকা');
    expect(text).not.toContain('২০২৬–২৭ শিক্ষাবর্ষের আবেদনের তারিখ');
  });

  it('bank guide says plainly that negative marking is unverified', () => {
    const bank = publicGuideBySlug('bank-job-preparation')!;
    expect(bank.bodyBn.join(' ')).toContain('নেগেটিভ মার্কিং (ভুল উত্তরে নম্বর কাটা) আছে কি না, তা এখনো যাচাই হয়নি');
  });

  it('scholarship guide claims only the verified Commonwealth deadline', () => {
    const s = publicGuideBySlug('scholarship-guide')!;
    const text = s.bodyBn.join(' ');
    expect(text).toContain('৮ ডিসেম্বর ২০২৬, বিকেল ৪টা (GMT)');
    expect(text).toContain('এই পৃষ্ঠায় তারিখ ছাড়া আর কোনো শর্ত দাবি করা হচ্ছে না');
  });

  it('only the NU guide has a warning box', () => {
    for (const g of PUBLIC_GUIDES) {
      if (g.slug === 'nu-admission-guide') expect(g.warningBn).toBeDefined();
      else expect(g.warningBn).toBeUndefined();
    }
  });
});
