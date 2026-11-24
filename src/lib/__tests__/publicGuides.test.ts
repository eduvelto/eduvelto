// Eduvelto — public guides unit tests (24 Nov 2026, brand-SEO wave 1;
// EXTENDED 24 Nov 2026, brand-SEO wave 2: 17 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 3: 23 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 4: 29 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 5: 35 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 10: 41 guides).
//
// The 41 guides are static public data, so the tests guard what
// matters most: exactly 35 guides with unique slugs/paths, 400–700
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
  // Brand-SEO wave 2 (24 Nov 2026): 7 new guides.
  'revision-strategy': 411,
  'note-taking-guide': 417,
  'time-management-students': 446,
  'english-writing-basics': 440,
  'online-safety-guide': 413,
  'bangla-spelling-common-mistakes': 406,
  'computer-basics-students': 420,
  // Brand-SEO wave 3 (24 Nov 2026): 6 new guides.
  'exam-day-strategy': 543,
  'mcq-answering-techniques': 487,
  'memory-techniques-students': 511,
  'study-routine-job-seekers': 470,
  'healthy-habits-students': 445,
  'digital-skills-basics': 486,
  // Brand-SEO wave 4 (24 Nov 2026): 6 new guides.
  'exam-anxiety-management': 509,
  'presentation-skills': 412,
  'group-study-guide': 401,
  'english-vocabulary-building': 433,
  'effective-reading-habits': 435,
  'self-motivation-students': 431,
  // Brand-SEO wave 5 (24 Nov 2026): 6 new guides.
  'how-to-use-free-library': 418,
  'how-to-use-job-practice': 401,
  'how-to-use-ai-assistant': 406,
  'how-to-use-opportunity-hub': 402,
  'how-to-use-life-services': 409,
  'spoken-english-practice': 404,
  // Brand-SEO wave 10 (24 Nov 2026): 6 new guides.
  'goal-setting-students': 462,
  'staying-focused-studying': 453,
  'sleep-and-study': 428,
  'reading-comprehension-strategies': 414,
  'learning-with-phone': 413,
  'asking-questions-class': 408,
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
  // Brand-SEO wave 2 (24 Nov 2026): new guide paths + /life/planner
  // (linked from the time-management guide).
  '/learn/revision-strategy',
  '/learn/note-taking-guide',
  '/learn/time-management-students',
  '/learn/english-writing-basics',
  '/learn/online-safety-guide',
  '/learn/bangla-spelling-common-mistakes',
  '/learn/computer-basics-students',
  '/life/planner',
  // Brand-SEO wave 3 (24 Nov 2026): 6 new guide paths.
  '/learn/exam-day-strategy',
  '/learn/mcq-answering-techniques',
  '/learn/memory-techniques-students',
  '/learn/study-routine-job-seekers',
  '/learn/healthy-habits-students',
  '/learn/digital-skills-basics',
  // Brand-SEO wave 4 (24 Nov 2026): 6 new guide paths.
  '/learn/exam-anxiety-management',
  '/learn/presentation-skills',
  '/learn/group-study-guide',
  '/learn/english-vocabulary-building',
  '/learn/effective-reading-habits',
  '/learn/self-motivation-students',
  // Brand-SEO wave 5 (24 Nov 2026): 6 new guide paths + the new
  // link targets the wave-5 guides use.
  '/learn/how-to-use-free-library',
  '/learn/how-to-use-job-practice',
  '/learn/how-to-use-ai-assistant',
  '/learn/how-to-use-opportunity-hub',
  '/learn/how-to-use-life-services',
  '/learn/spoken-english-practice',
  // Brand-SEO wave 10 (24 Nov 2026): 6 new guide paths.
  '/learn/goal-setting-students',
  '/learn/staying-focused-studying',
  '/learn/sleep-and-study',
  '/learn/reading-comprehension-strategies',
  '/learn/learning-with-phone',
  '/learn/asking-questions-class',
  '/ai-assistant',
  '/library',
  '/opportunities/cv-builder',
  '/opportunities/interview-prep',
  '/opportunities/career-guidance',
  '/life/calculators',
  '/life/converters',
  '/life/health',
]);

describe('public guides', () => {
  it('has exactly the 41 guides, with unique slugs, paths and titles', () => {
    expect(PUBLIC_GUIDES).toHaveLength(41);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.slug)).size).toBe(41);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.path)).size).toBe(41);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.titleBn)).size).toBe(41);
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

  it('wave-2 guides are general advice — no invented dates, years or fees', () => {
    // Brand-SEO wave 2 (24 Nov 2026): the 7 new guides were written
    // as general advice with no verifiable-facts claims, so they must
    // contain no year (২০২x), no money (টাকা) and no superlative.
    // The viva-preparation candidate was skipped, not written: /jobs/viva
    // already covers viva preparation.
    const wave2 = [
      'revision-strategy',
      'note-taking-guide',
      'time-management-students',
      'english-writing-basics',
      'online-safety-guide',
      'bangla-spelling-common-mistakes',
      'computer-basics-students',
    ];
    expect(wave2.length).toBe(7);
    for (const slug of wave2) {
      const g = publicGuideBySlug(slug)!;
      const text = g.bodyBn.join(' ');
      expect(text, `${slug} year`).not.toMatch(/২০২\d/);
      expect(text, `${slug} fee`).not.toContain('টাকা');
      expect(text, `${slug} superlative`).not.toContain('সেরা');
      expect(g.titleEn, slug).not.toMatch(/best/i);
    }
    expect(publicGuideBySlug('viva-preparation-guide')).toBeUndefined();
  });

  it('wave-3 guides are general advice — no invented dates, years or fees', () => {
    // Brand-SEO wave 3 (24 Nov 2026): the 6 new guides were written
    // as general advice with no verifiable-facts claims, so they must
    // contain no year (২০২x), no money (টাকা) and no superlative.
    // Money management was SKIPPED, not written: /learn/budget-planner-guide
    // already covers student budgeting and /life/budget is the budget tool.
    const wave3 = [
      'exam-day-strategy',
      'mcq-answering-techniques',
      'memory-techniques-students',
      'study-routine-job-seekers',
      'healthy-habits-students',
      'digital-skills-basics',
    ];
    expect(wave3.length).toBe(6);
    for (const slug of wave3) {
      const g = publicGuideBySlug(slug)!;
      const text = g.bodyBn.join(' ');
      expect(text, `${slug} year`).not.toMatch(/২০২\d/);
      expect(text, `${slug} fee`).not.toContain('টাকা');
      expect(text, `${slug} superlative`).not.toContain('সেরা');
      expect(g.titleEn, slug).not.toMatch(/best/i);
    }
    expect(publicGuideBySlug('money-management-students')).toBeUndefined();
  });

  it('wave-4 guides are general advice — no invented dates, years or fees', () => {
    // Brand-SEO wave 4 (24 Nov 2026): the 6 new guides were written
    // as general advice with no verifiable-facts claims, so they must
    // contain no year (২০২x), no money (টাকা) and no superlative.
    // Career planning basics was SKIPPED, not written:
    // /opportunities/career-guidance already covers it. Freelancing
    // basics for students was SKIPPED, not written:
    // /opportunities/income already covers legit online income.
    const wave4 = [
      'exam-anxiety-management',
      'presentation-skills',
      'group-study-guide',
      'english-vocabulary-building',
      'effective-reading-habits',
      'self-motivation-students',
    ];
    expect(wave4.length).toBe(6);
    for (const slug of wave4) {
      const g = publicGuideBySlug(slug)!;
      const text = g.bodyBn.join(' ');
      expect(text, `${slug} year`).not.toMatch(/২০২\d/);
      expect(text, `${slug} fee`).not.toContain('টাকা');
      expect(text, `${slug} superlative`).not.toContain('সেরা');
      expect(g.titleEn, slug).not.toMatch(/best/i);
    }
    expect(publicGuideBySlug('career-planning-basics')).toBeUndefined();
    expect(publicGuideBySlug('freelancing-basics-students')).toBeUndefined();
  });

  it('wave-5 guides are general advice — no invented dates, years or fees', () => {
    // Brand-SEO wave 5 (24 Nov 2026): the 6 new guides were written
    // as general advice with no verifiable-facts claims, so they must
    // contain no year (২০২x), no money (টাকা) and no superlative.
    // Nothing was skipped: all 6 briefed topics are new — no existing
    // page covers how to use the library, job practice, AI assistant,
    // opportunity hub or life services, and no guide covers spoken
    // English practice (the writing/vocabulary guides differ).
    const wave5 = [
      'how-to-use-free-library',
      'how-to-use-job-practice',
      'how-to-use-ai-assistant',
      'how-to-use-opportunity-hub',
      'how-to-use-life-services',
      'spoken-english-practice',
    ];
    expect(wave5.length).toBe(6);
    for (const slug of wave5) {
      const g = publicGuideBySlug(slug)!;
      const text = g.bodyBn.join(' ');
      expect(text, `${slug} year`).not.toMatch(/২০২\d/);
      expect(text, `${slug} fee`).not.toContain('টাকা');
      expect(text, `${slug} superlative`).not.toContain('সেরা');
      expect(g.titleEn, slug).not.toMatch(/best/i);
    }
  });

  it('wave-10 guides are general advice — no invented dates, years or fees', () => {
    // Brand-SEO wave 10 (24 Nov 2026): the 6 new guides were written
    // as general advice with no verifiable-facts claims, so they must
    // contain no year (২০২x), no money (টাকা) and no superlative.
    // Four candidates were SKIPPED, not written:
    // viva-preparation-from-home (/jobs/viva + /opportunities/interview-prep
    // already cover it); time-management-working-students (duplicates
    // time-management-students + study-routine-job-seekers);
    // exam-in-one-week (duplicates revision-strategy + exam-day-strategy
    // + time-management-students); application-letter-guide (the AI
    // Assistant letter builder covers it).
    const wave10 = [
      'goal-setting-students',
      'staying-focused-studying',
      'sleep-and-study',
      'reading-comprehension-strategies',
      'learning-with-phone',
      'asking-questions-class',
    ];
    expect(wave10.length).toBe(6);
    for (const slug of wave10) {
      const g = publicGuideBySlug(slug)!;
      const text = g.bodyBn.join(' ');
      expect(text, `${slug} year`).not.toMatch(/২০২\d/);
      expect(text, `${slug} fee`).not.toContain('টাকা');
      expect(text, `${slug} superlative`).not.toContain('সেরা');
      expect(g.titleEn, slug).not.toMatch(/best/i);
    }
    expect(publicGuideBySlug('viva-preparation-from-home')).toBeUndefined();
    expect(publicGuideBySlug('time-management-working-students')).toBeUndefined();
    expect(publicGuideBySlug('exam-in-one-week')).toBeUndefined();
    expect(publicGuideBySlug('application-letter-guide')).toBeUndefined();
  });
});
