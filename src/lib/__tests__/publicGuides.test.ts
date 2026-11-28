// Eduvelto — public guides unit tests (24 Nov 2026, brand-SEO wave 1;
// EXTENDED 24 Nov 2026, brand-SEO wave 2: 17 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 3: 23 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 4: 29 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 5: 35 guides;
// EXTENDED 24 Nov 2026, brand-SEO wave 10: 41 guides;
// EXTENDED 25 Nov 2026, Phase 2: 56 guides — the 15 bilingual
// Study Guides at /guides/<slug>, 700+ words in Bangla AND English).
// EXTENDED 28 Nov 2026, trust/content batch (owner order): 66 guides
// EXTENDED 28 Nov 2026, eleventh guide (owner order 11:44): 67 guides
// EXTENDED 28 Nov 2026, finish batch A (owner order, code freeze
// lifted 21:10): 72 guides — 5 new tool-tied Study Guides at
// /guides/<slug>, 800+ words in Bangla AND English each, every
// formula grounded in the tools' logic.
// — 10 new tool-tied Study Guides at /guides/<slug>, 800+ words in
// Bangla AND English each, every formula grounded in the tools' logic.
//
// The 67 guides are static public data, so the tests guard what
// matters most: exactly 35 guides with unique slugs/paths, 400–700
// words each (pinned to the content pack's counts), every internal
// link pointing at a real route, the draft status never claimed as
// verified/approved, and nothing from the pack's "Unverified — do
// not publish" list sneaking in (no BPSC vacancy totals, no
// Commonwealth conditions beyond the verified deadline, no
// NU 2026–27 circular/dates/fees, no book/coaching names).

import { describe, expect, it } from 'vitest';
import {
  PHASE2_GUIDES,
  PUBLIC_GUIDES,
  publicGuideBySlug,
  publicGuideWordCount,
  publicGuideWordCountEn,
} from '../publicGuides';
import { PUBLIC_GUIDE_BODIES } from '../publicGuideBodies';
import { PUBLIC_GUIDE_META } from '../publicGuideMeta';

describe('public guides — meta/body split (25 Nov 2026, entry-chunk budget)', () => {
  it('meta + bodies cover the same 72 slugs as the joined PUBLIC_GUIDES', () => {
    expect(PUBLIC_GUIDE_META).toHaveLength(72);
    expect(Object.keys(PUBLIC_GUIDE_BODIES)).toHaveLength(72);
    const slugs = PUBLIC_GUIDES.map((g) => g.slug);
    expect(PUBLIC_GUIDE_META.map((m) => m.slug).sort()).toEqual([...slugs].sort());
    expect(Object.keys(PUBLIC_GUIDE_BODIES).sort()).toEqual([...slugs].sort());
    // The join is exact: every joined guide's meta fields equal the
    // meta file's, and its body fields equal the bodies file's.
    for (const g of PUBLIC_GUIDES) {
      const meta = PUBLIC_GUIDE_META.find((m) => m.slug === g.slug)!;
      expect({ slug: g.slug, path: g.path, titleBn: g.titleBn, titleEn: g.titleEn, updatedAt: g.updatedAt }).toEqual({
        slug: meta.slug,
        path: meta.path,
        titleBn: meta.titleBn,
        titleEn: meta.titleEn,
        updatedAt: meta.updatedAt,
      });
      const body = PUBLIC_GUIDE_BODIES[g.slug];
      expect(g.bodyBn).toEqual(body.bodyBn);
      expect(g.bodyEn).toEqual(body.bodyEn);
      expect(g.warningBn).toEqual(body.warningBn);
      expect(g.warningEn).toEqual(body.warningEn);
    }
  });

  it('the meta file carries NO body text (the split must stay split)', () => {
    // seo.ts imports the meta file into the entry chunk — a body
    // field here would silently re-inflate the entry past budget.
    for (const m of PUBLIC_GUIDE_META) {
      expect(m, m.slug).not.toHaveProperty('bodyBn');
      expect(m, m.slug).not.toHaveProperty('bodyEn');
      expect(m, m.slug).not.toHaveProperty('warningBn');
      expect(m, m.slug).not.toHaveProperty('warningEn');
    }
  });
});

const EXPECTED_WORD_COUNTS: Record<string, number> = {
  'bcs-preparation-guide': 441,
  'bank-job-preparation': 427,
  'primary-teacher-preparation': 409,
  'ntrca-preparation': 451,
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
  // Brand-SEO wave 13 (24 Nov 2026): the 7 wave-1 guide paths were
  // never added to this allowlist, so no earlier pass could link to
  // them (the routes are real — all 7 render and are in the sitemap).
  // Adding them here unblocks the exam/AI/budget guide links.
  '/learn/bcs-preparation-guide',
  '/learn/bank-job-preparation',
  '/learn/primary-teacher-preparation',
  '/learn/ntrca-preparation',
  '/learn/nu-admission-guide',
  '/learn/what-is-ai',
  '/learn/budget-planner-guide',
  '/ai-assistant',
  '/library',
  '/opportunities/cv-builder',
  '/opportunities/interview-prep',
  '/opportunities/career-guidance',
  '/life/calculators',
  '/life/converters',
  '/life/health',
  // Phase 2 (25 Nov 2026): the Study Guides hub + the 15 new guide
  // paths + the link targets the new articles use.
  '/guides',
  '/guides/bcs-bangla-preparation',
  '/guides/bcs-english-preparation',
  '/guides/bcs-math-mental-ability',
  '/guides/bcs-science-ict-preparation',
  '/guides/primary-bangla-english-preparation',
  '/guides/primary-math-gk-preparation',
  '/guides/primary-viva-preparation',
  '/guides/bank-math-preparation',
  '/guides/bank-english-gk-preparation',
  '/guides/ntrca-written-exam-preparation',
  '/guides/ntrca-viva-subject-preparation',
  '/guides/gst-admission-preparation',
  '/guides/du-admission-preparation',
  '/guides/nctb-books-study-method',
  '/guides/nctb-revision-before-exams',
  '/jobs/bcs',
  '/jobs/bank',
  '/jobs/primary-teacher',
  '/jobs/ntrca',
  '/jobs/viva',
  '/books',
  '/admissions',
  // Trust/content batch (28 Nov 2026): the 10 new guide paths + the
  // live tool routes the new articles link to.
  '/guides/ssc-hsc-gpa-calculation-guide',
  '/guides/nu-cgpa-calculation-guide',
  '/guides/land-measurement-bangladesh-guide',
  '/guides/govt-job-age-calculation-guide',
  '/guides/bcs-exam-pattern-strategy-guide',
  '/guides/safe-pdf-usage-guide',
  '/guides/loan-emi-calculation-guide',
  '/guides/bmi-healthy-weight-guide',
  '/guides/age-calculation-guide',
  '/guides/qr-code-image-tools-guide',
  // Eleventh guide (owner order 28 Nov 2026, 11:44): Negative
  // Sentences — Class 3.
  '/guides/negative-sentences-class-3',
  // FINISH BATCH 28 NOV — GUIDES A (1–5): the 5 new guide paths +
  // the live tool routes the new articles link to.
  '/guides/pdf-compress-guide',
  '/guides/cv-writing-freshers-guide',
  '/guides/cover-letter-writing-guide',
  '/guides/typing-speed-improve-guide',
  '/guides/compound-interest-calculation-guide',
  '/tools/cv-builder',
  '/tools/cover-letter-builder',
  '/tools/typing-speed-test',
  '/tools/ssc-hsc-gpa-calculator',
  '/tools/nu-cgpa-calculator',
  '/tools/cgpa-to-percentage-converter',
  '/tools/grade-analyzer',
  '/tools/international-gpa-calculator',
  '/tools/land-measurement',
  '/tools/area-calculator',
  '/tools/unit-converter',
  '/tools/govt-job-age-calculator',
  '/tools/age-calculator',
  '/tools/bcs-marks-calculator',
  '/tools/negative-marking-calculator',
  '/tools/pdf-password-protector',
  '/tools/pdf-splitter',
  '/tools/pdf-merger',
  '/tools/pdf-compressor',
  '/tools/image-to-pdf',
  '/tools/loan-emi-calculator',
  '/tools/mortgage-calculator',
  '/tools/bank-emi-dps-fdr-calculator',
  '/tools/compound-interest-calculator',
  '/tools/simple-interest-calculator',
  '/tools/bmi-calculator',
  '/tools/ideal-weight-calculator',
  '/tools/bmr-calculator',
  '/tools/calorie-tdee-calculator',
  '/tools/date-difference-calculator',
  '/tools/bangla-date-converter',
  '/tools/qr-code-generator',
  '/tools/qr-code-reader',
  '/tools/image-compressor',
  '/tools/barcode-generator',
]);

describe('public guides', () => {
  it('has exactly the 72 guides, with unique slugs, paths and titles', () => {
    expect(PUBLIC_GUIDES).toHaveLength(72);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.slug)).size).toBe(72);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.path)).size).toBe(72);
    expect(new Set(PUBLIC_GUIDES.map((g) => g.titleBn)).size).toBe(72);
    for (const g of PUBLIC_GUIDES) {
      // Old guides live at /learn/<slug>; Phase 2 Study Guides at /guides/<slug>.
      expect(g.path).toBe(
        PHASE2_GUIDES.includes(g) ? `/guides/${g.slug}` : `/learn/${g.slug}`,
      );
      expect(publicGuideBySlug(g.slug)).toBe(g);
    }
    expect(publicGuideBySlug('not-a-guide')).toBeUndefined();
  });

  it('every guide is 400–700 words (pinned to the content pack counts)', () => {
    for (const g of PUBLIC_GUIDES) {
      if (PHASE2_GUIDES.includes(g)) continue; // Phase 2 guides: 700+ in both languages (next test).
      const words = publicGuideWordCount(g);
      expect(words, `${g.slug} words`).toBeGreaterThanOrEqual(400);
      expect(words, `${g.slug} words`).toBeLessThanOrEqual(700);
      expect(words, `${g.slug} words`).toBe(EXPECTED_WORD_COUNTS[g.slug]);
    }
  });

  it('Phase 2 Study Guides are 700+ words in Bangla AND English', () => {
    expect(PHASE2_GUIDES).toHaveLength(31);
    for (const g of PHASE2_GUIDES) {
      expect(publicGuideWordCount(g), `${g.slug} Bn words`).toBeGreaterThanOrEqual(700);
      expect(publicGuideWordCountEn(g), `${g.slug} En words`).toBeGreaterThanOrEqual(700);
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

  it('bank guide says plainly that negative marking −0.25 is verified for 2025–26 circulars', () => {
    const bank = publicGuideBySlug('bank-job-preparation')!;
    expect(bank.bodyBn.join(' ')).toContain('নেগেটিভ মার্কিং −০.২৫ যাচাইকৃত — ২০২৫–২৬ সালের বিজ্ঞপ্তি অনুযায়ী');
    expect(bank.bodyBn.join(' ')).not.toContain('এখনো যাচাই হয়নি');
  });

  it('scholarship guide claims only the verified Commonwealth deadline', () => {
    const s = publicGuideBySlug('scholarship-guide')!;
    const text = s.bodyBn.join(' ');
    expect(text).toContain('৮ ডিসেম্বর ২০২৬, বিকেল ৪টা (GMT)');
    expect(text).toContain('এই পৃষ্ঠায় তারিখ ছাড়া আর কোনো শর্ত দাবি করা হচ্ছে না');
  });

  it('only the NU guide and the two admission guides have a warning box', () => {
    for (const g of PUBLIC_GUIDES) {
      if (
        g.slug === 'nu-admission-guide' ||
        g.slug === 'gst-admission-preparation' ||
        g.slug === 'du-admission-preparation'
      ) {
        expect(g.warningBn).toBeDefined();
      } else expect(g.warningBn).toBeUndefined();
    }
    // The admission warnings state plainly that no dates/fees/marks
    // split are given — anything specific must come from the official
    // circular.
    for (const slug of ['gst-admission-preparation', 'du-admission-preparation']) {
      const g = publicGuideBySlug(slug)!;
      expect(g.warningEn).toBeDefined();
      expect(g.warningBn).toContain('কোনো নির্দিষ্ট তারিখ, ফি বা নম্বর-বণ্টন দেওয়া হয়নি');
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

describe('Phase 2 Study Guides (25 Nov 2026)', () => {
  const BCS_SLUGS = [
    'bcs-bangla-preparation',
    'bcs-english-preparation',
    'bcs-math-mental-ability',
    'bcs-science-ict-preparation',
  ];

  it('has the planned distribution: BCS 5, Primary 3, Bank 2, NTRCA 2, Admission 4, NCTB 3, Tools 9, Finance 2, Health 1', () => {
    const counts = new Map<string, number>();
    for (const g of PHASE2_GUIDES) counts.set(g.category!, (counts.get(g.category!) ?? 0) + 1);
    expect(Object.fromEntries(counts)).toEqual({
      bcs: 5,
      primary: 3,
      bank: 2,
      ntrca: 2,
      admission: 4,
      nctb: 3,
      tools: 9,
      finance: 2,
      health: 1,
    });
  });

  it('every new article carries category, both-language copy, read time, updatedAt and a needsReview list', () => {
    for (const g of PHASE2_GUIDES) {
      expect(g.category).toBeDefined();
      expect(g.titleBn.length).toBeGreaterThan(0);
      expect(g.titleEn.length).toBeGreaterThan(0);
      expect(g.descriptionBn!.length).toBeGreaterThan(40);
      expect(g.descriptionEn!.length).toBeGreaterThan(40);
      expect(g.readTimeMinutes).toBe(6);
      // Phase 2 wave (25 Nov 2026) + trust/content batch (28 Nov 2026).
      expect(['2026-11-25', '2026-11-28']).toContain(g.updatedAt);
      expect(Array.isArray(g.needsReview)).toBe(true);
      // Only the GST/DU articles rest on a deliberate omission
      // (no verifiable dates/fees/marks split); the other 13 are
      // fully verified against the patterns in the Phase 2 brief.
      if (g.slug === 'gst-admission-preparation' || g.slug === 'du-admission-preparation') {
        expect(g.needsReview!.length).toBeGreaterThan(0);
      } else {
        expect(g.needsReview).toEqual([]);
      }
    }
  });

  it('no new article makes a forbidden claim', () => {
    const FORBIDDEN = ['আবেদন চলছে', '100% কমন', 'নিশ্চিত কমন'];
    for (const g of PHASE2_GUIDES) {
      const text = [
        g.titleBn,
        g.titleEn,
        g.descriptionBn ?? '',
        g.descriptionEn ?? '',
        ...g.bodyBn,
        ...(g.bodyEn ?? []),
        g.warningBn ?? '',
        g.warningEn ?? '',
      ].join(' ');
      for (const f of FORBIDDEN) {
        expect(text, `${g.slug} contains ${f}`).not.toContain(f);
      }
    }
  });

  it('BCS articles state the verified 50th-syllabus split (30/30/25/25/10/15/15/20/15/15 = 200)', () => {
    const BN_SPLIT =
      'বিষয়ভিত্তিক নম্বর-বণ্টন এরকম: বাংলা ৩০, ইংরেজি ৩০, বাংলাদেশ বিষয়াবলি ২৫, আন্তর্জাতিক বিষয়াবলি ২৫, ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা ১০, সাধারণ বিজ্ঞান ১৫, কম্পিউটার ও তথ্যপ্রযুক্তি ১৫, গাণিতিক যুক্তি ২০, মানসিক দক্ষতা ১৫, নৈতিকতা, মূল্যবোধ ও সুশাসন ১৫ — মোট ২০০ নম্বর।';
    const EN_SPLIT =
      'The subject-wise split is: Bangla 30, English 30, Bangladesh Affairs 25, International Affairs 25, Geography, Environment and Disaster Management 10, General Science 15, Computer and ICT 15, Mathematical Reasoning 20, Mental Ability 15, Ethics, Values and Good Governance 15 — 200 marks in total.';
    for (const slug of BCS_SLUGS) {
      const g = publicGuideBySlug(slug)!;
      expect(g.bodyBn.join(' '), `${slug} Bn split`).toContain(BN_SPLIT);
      expect(g.bodyEn!.join(' '), `${slug} En split`).toContain(EN_SPLIT);
      // The old (wrong) 35/35/30/20 split must not appear.
      expect(g.bodyBn.join(' ')).not.toContain('বাংলা ৩৫, ইংরেজি ৩৫');
      expect(g.bodyEn!.join(' ')).not.toContain('Bangla 35, English 35');
    }
  });

  it('Primary, Bank and NTRCA articles state their verified patterns', () => {
    const primary = publicGuideBySlug('primary-bangla-english-preparation')!;
    expect(primary.bodyBn.join(' ')).toContain('৯০টি প্রশ্ন থাকে, সময় ৯০ মিনিট');
    expect(primary.bodyEn!.join(' ')).toContain('90 questions in 90 minutes');
    const bank = publicGuideBySlug('bank-math-preparation')!;
    expect(bank.bodyBn.join(' ')).toContain('১০০টি প্রশ্ন থাকে, সময় ৬০ মিনিট');
    expect(bank.bodyEn!.join(' ')).toContain('100 questions in 60 minutes');
    const ntrca = publicGuideBySlug('ntrca-written-exam-preparation')!;
    expect(ntrca.bodyBn.join(' ')).toContain('লিখিত পরীক্ষা ১০০ নম্বরের, সময় ৩ ঘণ্টা');
    expect(ntrca.bodyEn!.join(' ')).toContain('written examination is 100 marks in 3 hours');
  });

  it('no new article duplicates an existing guide topic (slug + title)', () => {
    const oldSlugs = new Set(PUBLIC_GUIDES.filter((g) => !PHASE2_GUIDES.includes(g)).map((g) => g.slug));
    const oldTitles = new Set(
      PUBLIC_GUIDES.filter((g) => !PHASE2_GUIDES.includes(g)).map((g) => g.titleBn),
    );
    for (const g of PHASE2_GUIDES) {
      expect(oldSlugs.has(g.slug)).toBe(false);
      expect(oldTitles.has(g.titleBn)).toBe(false);
    }
  });

  it('trust/content batch (28 Nov 2026): the 10 tool-tied guides are 800+ words in Bn AND En', () => {
    // Owner order 28 Nov 2026 — every formula/rule grounded in the
    // tools' own logic (src/lib/tools/), never from memory.
    const TRUST_SLUGS = [
      'ssc-hsc-gpa-calculation-guide',
      'nu-cgpa-calculation-guide',
      'land-measurement-bangladesh-guide',
      'govt-job-age-calculation-guide',
      'bcs-exam-pattern-strategy-guide',
      'safe-pdf-usage-guide',
      'loan-emi-calculation-guide',
      'bmi-healthy-weight-guide',
      'age-calculation-guide',
      'qr-code-image-tools-guide',
    ];
    expect(TRUST_SLUGS).toHaveLength(10);
    for (const slug of TRUST_SLUGS) {
      const g = publicGuideBySlug(slug)!;
      expect(g, slug).toBeDefined();
      expect(g.updatedAt).toBe('2026-11-28');
      expect(publicGuideWordCount(g), `${slug} Bn words`).toBeGreaterThanOrEqual(800);
      expect(publicGuideWordCountEn(g), `${slug} En words`).toBeGreaterThanOrEqual(800);
      expect(g.links.some((l) => l.to.startsWith('/tools/')), `${slug} links a tool`).toBe(true);
    }
  });

  it('trust/content batch: the grounded facts match the tools exactly', () => {
    // GPA: grade points + worked example from sscHscGpa.ts.
    const gpa = publicGuideBySlug('ssc-hsc-gpa-calculation-guide')!;
    expect(gpa.bodyBn.join(' ')).toContain('২৪.৫ + ৩.০ = ২৭.৫');
    expect(gpa.bodyBn.join(' ')).toContain('৪.৫৮');
    expect(gpa.bodyEn!.join(' ')).toContain('24.5 + 3.0 = 27.5');
    expect(gpa.bodyEn!.join(' ')).toContain('4.58');
    // NU CGPA: credit-weighted example from nuCgpa.ts.
    const cgpa = publicGuideBySlug('nu-cgpa-calculation-guide')!;
    expect(cgpa.bodyBn.join(' ')).toContain('৩০.২৫ ÷ ৮ = ৩.৭৮');
    expect(cgpa.bodyEn!.join(' ')).toContain('30.25 ÷ 8 = 3.78');
    // Land: base units from landMeasurement.ts.
    const land = publicGuideBySlug('land-measurement-bangladesh-guide')!;
    expect(land.bodyBn.join(' ')).toContain('১ শতক মানে ৪৩৫.৬ বর্গফুট');
    expect(land.bodyBn.join(' ')).toContain('১ বিঘা মানে ২০ কাঠা');
    expect(land.bodyEn!.join(' ')).toContain('1 decimal means 435.6 square feet');
    // Govt job age: limits from govtJobAge.ts (verify vs the circular).
    const age = publicGuideBySlug('govt-job-age-calculation-guide')!;
    expect(age.bodyBn.join(' ')).toContain('সাধারণ সীমা ৩০ বছর');
    expect(age.bodyBn.join(' ')).toContain('মুক্তিযোদ্ধা কোটা ৩২ বছর');
    expect(age.bodyEn!.join(' ')).toContain('general 30-year limit');
    // BCS: ONLY the verified 50th-syllabus pattern; viva marks are
    // NEVER written (sources disagree 200 vs 100).
    const bcs = publicGuideBySlug('bcs-exam-pattern-strategy-guide')!;
    expect(bcs.bodyBn.join(' ')).toContain('বাংলা ভাষা ও সাহিত্য ৩০, ইংরেজি ভাষা ও সাহিত্য ৩০, বাংলাদেশ বিষয়াবলি ২৫, আন্তর্জাতিক বিষয়াবলি ২৫, ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা ১০, সাধারণ বিজ্ঞান ১৫, কম্পিউটার ও তথ্যপ্রযুক্তি ১৫, গাণিতিক যুক্তি ২০, মানসিক দক্ষতা ১৫, নৈতিকতা, মূল্যবোধ ও সুশাসন ১৫');
    expect(bcs.bodyBn.join(' ')).toContain('ভুল উত্তরের জন্য ০.৫০ নম্বর কাটা যায়');
    expect(bcs.bodyBn.join(' ')).toContain('সাধারণ ক্যাডারের জন্য লিখিত পরীক্ষা মোট ৯০০ নম্বরের');
    expect(bcs.bodyBn.join(' ')).toContain('মৌখিক পরীক্ষার নম্বর সম্পর্কে এই গাইডে কোনো সংখ্যা লেখা হয়নি');
    expect(bcs.bodyEn!.join(' ')).toContain('Bangla Language & Literature 30, English Language & Literature 30, Bangladesh Affairs 25, International Affairs 25, Geography, Environment and Disaster Management 10, General Science 15, Computer and ICT 15, Mathematical Reasoning 20, Mental Ability 15, Ethics, Values and Good Governance 15');
    expect(bcs.bodyEn!.join(' ')).toContain('No number for the Viva marks is written in this guide');
    // EMI: worked example from emiEngine.ts (verified by hand).
    const emi = publicGuideBySlug('loan-emi-calculation-guide')!;
    expect(emi.bodyBn.join(' ')).toContain('২৩,৫৩৭ টাকা');
    expect(emi.bodyEn!.join(' ')).toContain('23,537 taka');
    // BMI: WHO bands from bodyMetrics.ts.
    const bmi = publicGuideBySlug('bmi-healthy-weight-guide')!;
    expect(bmi.bodyBn.join(' ')).toContain('১৮.৫ থেকে ২৪.৯ হলে স্বাভাবিক ওজন');
    expect(bmi.bodyEn!.join(' ')).toContain('18.5 to 24.9 means normal weight');
    // Age: hand-check from ageEngine.ts.
    const ageCalc = publicGuideBySlug('age-calculation-guide')!;
    expect(ageCalc.bodyBn.join(' ')).toContain('২৬ বছর ১০ মাস ১২ দিন');
    expect(ageCalc.bodyEn!.join(' ')).toContain('26 years, 10 months and 12 days');
  });

  it('eleventh guide (28 Nov 2026, 11:44): Negative Sentences — Class 3, general version', () => {
    // Owner order 28 Nov 2026 — the site guide is the GENERAL
    // version: no personal name anywhere in it.
    const g = publicGuideBySlug('negative-sentences-class-3')!;
    expect(g.category).toBe('nctb');
    expect(g.updatedAt).toBe('2026-11-28');
    expect(g.path).toBe('/guides/negative-sentences-class-3');
    expect(publicGuideWordCount(g)).toBeGreaterThanOrEqual(700);
    expect(publicGuideWordCountEn(g)).toBeGreaterThanOrEqual(700);
    const bn = g.bodyBn.join(' ');
    const en = g.bodyEn!.join(' ');
    expect(bn).not.toContain('মিজান');
    expect(en).not.toContain('Mizan');
    // The briefed content, all present in both languages.
    expect(bn).toContain('The fisherman does not repair his net');
    expect(bn).toContain('The fisherman did not repair his net');
    expect(en).toContain('The fisherman does not repair his net');
    expect(en).toContain('The fisherman did not repair his net');
    expect(bn).toContain('সোনালি নিয়ম');
    expect(bn).toContain('মূল রূপে');
    expect(bn).toContain('cannot');
    expect(bn).toContain('never');
    expect(bn).toContain('উত্তরমালা');
    expect(en).toContain('golden rule');
    expect(en).toContain('base form');
    expect(en).toContain('Answer key');
    // The V1 rule: no -s/-es/-ed after do/does/did.
    expect(bn).toContain('He does not go');
    expect(bn).toContain('She did not play');
    expect(en).toContain('He does not go');
    expect(en).toContain('She did not play');
  });

  it('finish batch A (28 Nov 2026): the 5 tool-tied guides are 800+ words in Bn AND En', () => {
    // Owner order 28 Nov 2026 (code freeze lifted 21:10) — every
    // formula/rule grounded in the tools' own logic (src/lib/tools/),
    // never from memory.
    const FINISH_A_SLUGS = [
      'pdf-compress-guide',
      'cv-writing-freshers-guide',
      'cover-letter-writing-guide',
      'typing-speed-improve-guide',
      'compound-interest-calculation-guide',
    ];
    expect(FINISH_A_SLUGS).toHaveLength(5);
    for (const slug of FINISH_A_SLUGS) {
      const g = publicGuideBySlug(slug)!;
      expect(g, slug).toBeDefined();
      expect(g.updatedAt).toBe('2026-11-28');
      expect(publicGuideWordCount(g), `${slug} Bn words`).toBeGreaterThanOrEqual(800);
      expect(publicGuideWordCountEn(g), `${slug} En words`).toBeGreaterThanOrEqual(800);
      expect(g.links.some((l) => l.to.startsWith('/tools/')), `${slug} links a tool`).toBe(true);
    }
  });

  it('finish batch A: the grounded facts match the tools exactly', () => {
    // Compound interest: monthly formula + hand-check from
    // compoundEngine.ts / compoundInterest.ts (verified by hand:
    // 100,000 + 5,000/month at 10% for 1 year -> 173,299.15).
    const ci = publicGuideBySlug('compound-interest-calculation-guide')!;
    expect(ci.bodyBn.join(' ')).toContain('১,৭৩,২৯৯.১৫');
    expect(ci.bodyBn.join(' ')).toContain('১,১০,৪৭১.৩১');
    expect(ci.bodyBn.join(' ')).toContain('১,৬৪,৫৩০.৮৯');
    expect(ci.bodyEn!.join(' ')).toContain('173,299.15');
    expect(ci.bodyEn!.join(' ')).toContain('110,471.31');
    expect(ci.bodyEn!.join(' ')).toContain('164,530.89');
    expect(ci.bodyBn.join(' ')).toContain('A = P(1 + r/n)^(nt)');
    // PDF: levels + presets from pdfCompressor.ts.
    const pdf = publicGuideBySlug('pdf-compress-guide')!;
    expect(pdf.bodyBn.join(' ')).toContain('হালকা, মাঝারি আর শক্তিশালী');
    expect(pdf.bodyBn.join(' ')).toContain('ইমেইল, ওয়েব আর প্রিন্ট');
    expect(pdf.bodyEn!.join(' ')).toContain('light, balanced and strong');
    expect(pdf.bodyEn!.join(' ')).toContain('email, web and print');
    // Typing: the standard 5-character word + worked WPM example.
    const typing = publicGuideBySlug('typing-speed-improve-guide')!;
    expect(typing.bodyBn.join(' ')).toContain('৪০ WPM');
    expect(typing.bodyBn.join(' ')).toContain('৯৫ শতাংশ');
    expect(typing.bodyEn!.join(' ')).toContain('40 WPM');
    expect(typing.bodyEn!.join(' ')).toContain('95 percent');
    // CV: one page for freshers; cover letter: named greeting.
    const cv = publicGuideBySlug('cv-writing-freshers-guide')!;
    expect(cv.bodyBn.join(' ')).toContain('এক পাতায় হওয়া উচিত');
    expect(cv.bodyEn!.join(' ')).toContain('should be one page');
    const cl = publicGuideBySlug('cover-letter-writing-guide')!;
    expect(cl.bodyBn.join(' ')).toContain('Dear Mr. Rahman');
    expect(cl.bodyEn!.join(' ')).toContain('Dear Mr. Rahman');
  });
});
