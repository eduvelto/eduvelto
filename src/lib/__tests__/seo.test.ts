/**
 * Eduvelto SEO — route resolver unit tests (22 Nov 2026,
 * feature/seo-visibility).
 *
 * Guards the owner's order ("Bangladesh number 1 education channel"
 * search must find Eduvelto) WITHOUT letting a false claim slip in:
 *  (1) no title/description ever presents a superlative or rank
 *      as a fact — no "সেরা" / "best" / "#1" / "১ নম্বর" /
 *      "number 1" anywhere in any title or description, in either
 *      language (brand-SEO wave 1, F-01; wave 2 drops the last
 *      "Best" from the English home and /why-eduvelto titles).
 *      Ambition survives only as an explicitly-labelled goal
 *      ("আমাদের লক্ষ্য…", "aims to be…"), never as a rank;
 *  (2) every sitemap URL resolves to real SEO (route exists);
 *  (3) auth/admin/app routes resolve to null (never indexed content);
 *  (4) /founder resolves to null (FounderPage owns its SEO);
 *  (5) canonicals are eduvelto.com, JSON-LD is Organization +
 *      WebSite + WebPage + BreadcrumbList.
 *  (6) Job/Admission copy never presents practice or mocks as live —
 *      any mention must carry "শীঘ্রই আসছে" (22 Nov 2026, current
 *      plan: no practice UI on live); per-exam descriptions state the
 *      verified pattern honestly (Bank penalty unverified, NTRCA
 *      last-verified 18th, Primary verified per Recruitment Rules
 *      2025, the rest unverified / scope pending).
 *  (7) Organization JSON-LD names the founder (owner 22 Nov 18:24)
 *      with no private details (no DOB/address/phone).
 *  (8) sitemap.xml lists exactly the SITEMAP_URLS (no drift).
 *  (9) A "যাচাইকৃত ধরন" claim is gated on patternStatus (SF1/SF2/
 *      SF3, 22 Nov 2026): a per-exam description may say it only when
 *      jobPatternStatus(slug) is 'verified' (BCS, Primary Teacher —
 *      the latter per Recruitment Rules 2025, 28 Aug 2025) or
 *      'last_verified' (NTRCA, always with the "শেষ" qualifier);
 *      collective descriptions (/jobs, /admissions,
 *      /admissions/national-university) never claim a verified
 *      pattern, because they also cover Bank (not_verified) and NU.
 *  (10) SEO 50–100 pages (23 Nov 2026, feature/seo-50-100-pages):
 *      all 23 job subject pages resolve (BCS 10, Bank 5, Primary
 *      Teacher 4, NTRCA 4) with verified marks in Bangla digits and
 *      "শীঘ্রই আসছে"; cross-exam / unknown slugs resolve to null.
 *  (11) all 9 NU subject pages resolve (3 common subjects × 3
 *      groups) with the group name in the title and "বিজ্ঞপ্তি থেকে
 *      যাচাইকৃত" + "খসড়া" in the description; group-block slugs
 *      (group-*) and unknown subjects resolve to null.
 *  (12) all 5 class pages resolve with slugs matching CLASS_LEVELS
 *      exactly; Class 1–5 / 6–8 honestly say content has not arrived
 *      yet, the other three never claim that.
 *  (13) resolveFallbackSeo noindexes junk URLs with the home
 *      title/description/canonical; resolveRouteSeo still returns
 *      null for unknown slugs. /founder resolves since Phase 2
 *      (25 Nov 2026) — its SEO moved into SeoHead data.
 *  (14) every sitemap <url> carries a <lastmod> (audit SEO-007).
 *  (15) forbidden-claim sweep over every sitemap URL + all 23 job +
 *      9 NU subject pages: no "#1" claim; practice/mock mentions
 *      carry "শীঘ্রই আসছে"; no live "প্রশ্নব্যাংক" / "AI শিক্ষক";
 *      "যাচাইকৃত ধরন" only for a verified pattern — subject pages
 *      may say "যাচাইকৃত সিলেবাসে", never "যাচাইকৃত ধরন".
 *  (16) /jobs emits an ItemList of exactly the 14 exam hubs;
 *      /jobs/bcs keeps the 4 JSON-LD types without an ItemList.
 *  (17) OG constants are the 1200×630 social image
 *      (OG_IMAGE_URL / WIDTH / HEIGHT).
 *  (18) AdSense Part 1 (23 Nov 2026): thin pages are noindexed and
 *      out of the sitemap — all job subject pages except BCS
 *      English, all 9 NU subject pages, the 5 health pages,
 *      /jobs/circulars, /jobs/calendar (until a confirmed event
 *      exists), /ai-teacher — while the 6 live BCS English practice
 *      + lesson routes are indexable and in the sitemap. The (6) /
 *      (15) "শীঘ্রই আসছে" guards are phrase-scoped to "MCQ
 *      অনুশীলন" / "মক টেস্ট": the new honest copy says BCS English
 *      practice is live with different words ("অনুশীলন এখন চালু",
 *      "মক পরীক্ষা … প্রস্তুত হচ্ছে"), so the guards stay green
 *      while the copy stays honest. The guards themselves are stale
 *      for BCS English and need a coordinated update before any
 *      other practice goes live.
 *
 * Runs under plain node: resolveRouteSeo is pure (jobExams.ts has no
 * imports). Run with `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  resolveRouteSeo,
  resolveFallbackSeo,
  bookSeoData,
  buildBookSummary,
  ORGANIZATION_JSON_LD,
  WEBSITE_JSON_LD,
  ogLocaleForLang,
  SITE_URL,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from '../seo';
import { JOB_EXAMS, JOB_TABS, jobExamBySlug, jobPatternStatus } from '../jobExams';
import { JOB_SUBJECTS, jobSubjectsForExam } from '../jobContent';
import { NU_SYLLABUS_COMMON_SLUGS, nuSyllabusSubjectBySlug } from '../nuSyllabus';
import { NU_GROUPS } from '../nuProfile';
import { CLASS_LEVELS } from '../classLevels';
import { OPPORTUNITY_SEED } from '../opportunitySeed';
import { isPublished } from '../opportunities';
import { PUBLIC_GUIDES } from '../publicGuides';

const FORBIDDEN_RANK_CLAIM = /(^|[^ক])১ নম্বর|#1|number 1|নম্বর ১|নাম্বার ১|নাম্বার ওয়ান/i;

const SITEMAP_URLS = [
  '/',
  '/why-eduvelto',
  '/jobs',
  '/jobs/bcs',
  '/jobs/bank',
  '/jobs/primary-teacher',
  '/jobs/ntrca',
  '/jobs/common',
  '/jobs/dgfood',
  '/jobs/bpsc-non-cadre',
  '/jobs/cag',
  '/jobs/bfsa',
  '/jobs/others',
  '/jobs/ministries',
  '/jobs/defence',
  '/jobs/autonomous',
  '/jobs/private-ngo',
  '/jobs/it-professional',
  '/jobs/bcs/subjects',
  '/jobs/bank/subjects',
  '/jobs/primary-teacher/subjects',
  '/jobs/ntrca/subjects',
  '/jobs/bcs/subjects/english',
  '/jobs/bcs/practice/english',
  '/jobs/bcs/practice/english/grammar',
  '/jobs/bcs/practice/english/vocabulary',
  '/jobs/bcs/practice/english/reading',
  '/learn/bcs-english-tense',
  '/learn/bcs-english-preposition',
  // Brand-SEO wave 1 (24 Nov 2026): 10 public guides.
  '/learn/bcs-preparation-guide',
  '/learn/bank-job-preparation',
  '/learn/primary-teacher-preparation',
  '/learn/ntrca-preparation',
  '/learn/nu-admission-guide',
  '/learn/english-grammar-basics',
  '/learn/scholarship-guide',
  '/learn/what-is-ai',
  '/learn/cv-writing-guide',
  '/learn/budget-planner-guide',
  // Brand-SEO wave 2 (24 Nov 2026): 7 more public guides.
  '/learn/revision-strategy',
  '/learn/note-taking-guide',
  '/learn/time-management-students',
  '/learn/english-writing-basics',
  '/learn/online-safety-guide',
  '/learn/bangla-spelling-common-mistakes',
  '/learn/computer-basics-students',
  // Brand-SEO wave 3 (24 Nov 2026): 6 more public guides.
  '/learn/exam-day-strategy',
  '/learn/mcq-answering-techniques',
  '/learn/memory-techniques-students',
  '/learn/study-routine-job-seekers',
  '/learn/healthy-habits-students',
  '/learn/digital-skills-basics',
  // Brand-SEO wave 4 (24 Nov 2026): 6 more public guides.
  '/learn/exam-anxiety-management',
  '/learn/presentation-skills',
  '/learn/group-study-guide',
  '/learn/english-vocabulary-building',
  '/learn/effective-reading-habits',
  '/learn/self-motivation-students',
  // Brand-SEO wave 5 (24 Nov 2026): 6 more public guides.
  '/learn/how-to-use-free-library',
  '/learn/how-to-use-job-practice',
  '/learn/how-to-use-ai-assistant',
  '/learn/how-to-use-opportunity-hub',
  '/learn/how-to-use-life-services',
  '/learn/spoken-english-practice',
  // Brand-SEO wave 10 (24 Nov 2026): 6 more public guides.
  '/learn/goal-setting-students',
  '/learn/staying-focused-studying',
  '/learn/sleep-and-study',
  '/learn/reading-comprehension-strategies',
  '/learn/learning-with-phone',
  '/learn/asking-questions-class',
  // Phase 2 (25 Nov 2026): Study Guides blog — hub + 15 articles.
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
  '/learn',
  '/admissions',
  '/admissions/national-university',
  '/admissions/national-university/humanities',
  '/admissions/national-university/science',
  '/admissions/national-university/business',
  '/library',
  '/class',
  // Brand-SEO wave 1, F-06 (24 Nov 2026): /class/class-1-5 and
  // /class/class-6-8 are OUT of the sitemap (thin, no books yet —
  // noindexed until Classes 1–8 have real books).
  '/class/class-9-10',
  '/class/hsc',
  '/class/honours-masters',
  // Audit M12 (24 Nov 2026): Technical + Madrasa have live books.
  '/class/technical',
  '/class/madrasa',
  '/about',
  '/founder',
  '/contact',
  // Phase 3 (25 Nov 2026): real /:lang/support page.
  '/support',
  // 7-day sprint, Day 6 (26 Nov 2026): real /:lang/suggestions
  // page — the Suggestion PDF Store (coming soon, no PDF for
  // sale yet). Sitemap grows 143 -> 144 URLs.
  '/suggestions',
  '/privacy-policy',
  '/terms',
  // Brand-SEO wave 1, F-08 (24 Nov 2026): 4 new trust pages.
  '/editorial-policy',
  '/content-accuracy',
  '/certificate-policy',
  '/disclaimer',
  '/life',
  '/life/budget',
  '/life/calculators',
  '/life/converters',
  '/life/planner',
  '/life/pdf-tools',
  '/life/health',
  '/life/government',
  '/life/travel',
  '/life/services',
  '/opportunities',
  '/opportunities/cv-builder',
  '/opportunities/interview-prep',
  '/opportunities/career-guidance',
  '/opportunities/entrepreneurship',
  '/opportunities/income',
  '/opportunities/bpsc-non-cadre-2026',
  '/opportunities/unicef-writer-editor-2026',
  '/opportunities/undrr-intern-pm-2026',
  '/opportunities/commonwealth-shared-2027',
  '/opportunities/kaggle-learn',
  '/opportunities/google-skillshop',
  '/opportunities/upwork',
  // Added 24 Nov 2026 (homepage redesign): Step 16 job guides + /install
  // are real public pages on main — see sitemap.xml.
  '/jobs/viva',
  '/jobs/career',
  '/jobs/cv',
  '/install',
  // Added 24 Nov 2026 (AI Life Assistant rebase): /ai-assistant resolves
  // to real SEO in seo.ts and is listed in sitemap.xml. The health pages
  // and /ai-teacher are NOT listed here — they are noindexed thin pages
  // (AdSense F2) and the noindex test below asserts they stay OUT.
  '/ai-assistant',
  // Added 26 Nov 2026 (Day 1 audit fix): /books (library hub) + the 5
  // Question Paper Generator pages — all real public pages with SEO in
  // seo.ts, now listed in public/sitemap.xml (137 -> 143 URLs;
  // Day 6 adds /suggestions below, 143 -> 144).
  '/books',
  '/question-maker',
  '/question-paper-generator',
  '/pricing',
  '/omr-evaluator',
  '/custom-paper',
];

describe('resolveRouteSeo — public routes', () => {
  it('home title/description state plainly what Eduvelto is — no superlative, no #1 claim', () => {
    const seo = resolveRouteSeo('/');
    expect(seo).not.toBeNull();
    // Exact strings (24 Nov 2026, brand-SEO wave 1, F-01): "সেরা"
    // was removed — Google's AI Overview quoted it back as
    // self-promotion. Description reworded in brand-SEO wave 12
    // (189 → 150 chars) to fit the <=160 limit; "জাতীয়
    // বিশ্ববিদ্যালয়" and "জীবনসেবা" dropped, the rest kept.
    expect(seo!.title).toBe('Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম');
    expect(seo!.description).toBe(
      'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম: BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — সম্পূর্ণ ফ্রি।',
    );
    expect(seo!.title).not.toContain('সেরা');
    expect(seo!.description).not.toContain('সেরা');
    expect(seo!.canonical).toBe(`${SITE_URL}/bn`);
  });

  it('practice hub SEO states the UNIQUE question total, not the summed rows (26 Nov 2026)', () => {
    // Class 10 shares the Class 9 pool and Class 12 shares the
    // Class 11 pool, so publicAcademicClassSubjects() repeats the same
    // 557 + 374 questions under class-10 and class-12; summing the
    // rows claims 3,249. The hub meta description must state the unique
    // pool total (2,318) — the number the hub itself renders.
    const seo = resolveRouteSeo('/learn/practice');
    expect(seo).not.toBeNull();
    expect(seo!.description).toContain('2318টি প্রশ্ন');
    expect(seo!.description).not.toContain('3249টি প্রশ্ন');
    const seoEn = resolveRouteSeo('/en/learn/practice', 'en');
    expect(seoEn).not.toBeNull();
    expect(seoEn!.description).toContain('2318 questions');
    expect(seoEn!.description).not.toContain('3249 questions');
  });

  it('every sitemap URL resolves to real SEO', () => {
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for sitemap URL ${path}`).not.toBeNull();
      // Bare-canonical app routes (23:00 check, 25 Nov 2026):
      // /exam + /progress canonicalise to the bare URL, not /bn/... .
      const expectedCanonical =
        path === '/exam' || path === '/progress'
          ? `${SITE_URL}${path}`
          : `${SITE_URL}/bn${path === '/' ? '' : path}`;
      expect(seo!.canonical).toBe(expectedCanonical);
      expect(seo!.title.length).toBeGreaterThan(10);
      expect(seo!.description.length).toBeGreaterThan(40);
      expect(seo!.ogImage).toBe(
        // /founder is the one exception: its og:image is the
        // approved founder photo (was hardcoded in useSeo).
        path === '/founder' ? `${SITE_URL}/founder-photo.jpg` : `${SITE_URL}/og-image.jpg`,
      );
    }
  });

  it('bare-canonical app routes: /exam + /progress canonicalise bare, with no BreadcrumbList', () => {
    // 23:00 check (25 Nov 2026): /bn/exam + /bn/progress redirect
    // to the bare routes, so the bare URL is the canonical — never
    // /bn/... — and there is no BreadcrumbList (its crumb item would
    // point at the redirecting /bn/... URL). Both the bare and the
    // lang-prefixed spellings resolve to the same entry.
    for (const path of ['/exam', '/progress']) {
      for (const spelling of [path, `/bn${path}`, `/en${path}`]) {
        const seo = resolveRouteSeo(spelling);
        expect(seo, `no SEO for ${spelling}`).not.toBeNull();
        expect(seo!.canonical).toBe(`${SITE_URL}${path}`);
        const types = (seo!.jsonLd ?? []).map((o) => (o as { '@type'?: string })['@type']);
        expect(types).not.toContain('BreadcrumbList');
      }
    }
  });

  it('every sitemap title is unique', () => {
    const titles = new Map<string, string>();
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path)!;
      expect(titles.has(seo.title), `duplicate title "${seo.title}" at ${path}`).toBe(false);
      titles.set(seo.title, path);
    }
    expect(titles.size).toBe(SITEMAP_URLS.length);
  });

  it('no title or description claims a verified #1 rank', () => {
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path);
      if (!seo) continue;
      expect(seo.title, `title ${path}`).not.toMatch(FORBIDDEN_RANK_CLAIM);
      expect(seo.description, `description ${path}`).not.toMatch(FORBIDDEN_RANK_CLAIM);
    }
    for (const slug of [
      'bcs',
      'bank',
      'primary-teacher',
      'ntrca',
      'dgfood',
      'bpsc-non-cadre',
      'cag',
      'bfsa',
      'others',
      'ministries',
      'defence',
      'autonomous',
      'private-ngo',
      'it-professional',
    ]) {
      const seo = resolveRouteSeo(`/jobs/${slug}`);
      expect(seo, `/jobs/${slug}`).not.toBeNull();
      expect(seo!.title).not.toMatch(FORBIDDEN_RANK_CLAIM);
      expect(seo!.description).not.toMatch(FORBIDDEN_RANK_CLAIM);
    }
  });

  it('Job/Admission copy never presents practice or mocks as live', () => {
    // Live state (22 Nov 2026): no practice UI is wired to the bank on
    // live; the UI says "শীঘ্রই আসছে". Any Job/Admission description
    // mentioning MCQ practice or mock tests must qualify it with
    // "শীঘ্রই আসছে" — never as an available feature. The question
    // bank exists in Firestore but has no live UI, so "প্রশ্নব্যাংক"
    // must not appear as an offer either.
    const paths = [
      '/jobs',
      '/jobs/common',
      '/admissions',
      '/admissions/national-university',
      '/admissions/national-university/humanities',
      '/admissions/national-university/science',
      '/admissions/national-university/business',
    ];
    const slugs = [
      'bcs',
      'bank',
      'primary-teacher',
      'ntrca',
      'dgfood',
      'bpsc-non-cadre',
      'cag',
      'bfsa',
      'others',
      'ministries',
      'defence',
      'autonomous',
      'private-ngo',
      'it-professional',
    ];
    for (const slug of slugs) {
      paths.push(`/jobs/${slug}`, `/jobs/${slug}/practice`, `/jobs/${slug}/mocks`);
    }
    for (const path of paths) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      const d = seo!.description;
      if (d.includes('MCQ অনুশীলন') || d.includes('মক টেস্ট')) {
        expect(d, `unqualified live-practice claim in ${path}`).toContain('শীঘ্রই আসছে');
      }
      expect(d, `প্রশ্নব্যাংক offered as live in ${path}`).not.toContain('প্রশ্নব্যাংক');
    }
  });

  it('per-exam descriptions state the verified pattern honestly', () => {
    const bcs = resolveRouteSeo('/jobs/bcs')!;
    expect(bcs.description).toContain('যাচাইকৃত ধরন');
    expect(bcs.description).toContain('২০০ MCQ');
    const bank = resolveRouteSeo('/jobs/bank')!;
    // 24 Nov 2026 audit: Bank −0.25 VERIFIED (Combined 11 Bank
    // Officer Circular 115/2025 + BB AD Notice HRD-1 No. 38/2026) —
    // the generic verified branch now renders it.
    expect(bank.description).toContain('যাচাইকৃত ধরন');
    expect(bank.description).toContain('১০০ MCQ');
    expect(bank.description).toContain('−০.২৫');
    const ntrca = resolveRouteSeo('/jobs/ntrca')!;
    expect(ntrca.description).toContain('১৮তম');
    const primary = resolveRouteSeo('/jobs/primary-teacher')!;
    expect(primary.description).toContain('৯০ MCQ');
    // SF3 (22 Nov 2026): Primary KEEPS the verified label — its
    // pattern is verified against the Recruitment Rules 2025
    // (jobExams.ts patternStatus 'verified', negativeMarkingVerified).
    expect(primary.description).toContain('যাচাইকৃত ধরন');
    const dgfood = resolveRouteSeo('/jobs/dgfood')!;
    expect(dgfood.description).toContain('যাচাই বাকি');
    const it = resolveRouteSeo('/jobs/it-professional')!;
    expect(it.description).toContain('পরিধি নির্ধারণ বাকি');
  });

  it('a "যাচাইকৃত ধরন" claim appears only for a verified pattern', () => {
    // SF1/SF2 (22 Nov 2026): the collective /jobs description once
    // claimed a verified pattern for Bank too, and the NU
    // descriptions claimed one for admissions. Collective copy covers
    // exams whose patterns are NOT verified, so it may never use the
    // word "যাচাইকৃত" at all.
    for (const path of ['/jobs', '/admissions', '/admissions/national-university']) {
      const seo = resolveRouteSeo(path)!;
      expect(seo.description, path).not.toContain('যাচাইকৃত');
    }
    // Per-exam copy: "যাচাইকৃত ধরন" only when the patternStatus is
    // 'verified' (BCS, Bank, Primary Teacher) or 'last_verified'
    // (NTRCA, always with the "শেষ" qualifier). Anything else — the
    // circular-based exams, IT (scope pending) — must not carry it.
    for (const slug of [
      'bcs',
      'bank',
      'primary-teacher',
      'ntrca',
      'dgfood',
      'bpsc-non-cadre',
      'cag',
      'bfsa',
      'others',
      'ministries',
      'defence',
      'autonomous',
      'private-ngo',
      'it-professional',
    ]) {
      const seo = resolveRouteSeo(`/jobs/${slug}`)!;
      const status = jobPatternStatus(slug);
      if (status === 'verified' || status === 'last_verified') {
        if (status === 'last_verified') {
          expect(seo.description, slug).toContain('শেষ যাচাইকৃত');
        }
      } else {
        expect(seo.description, slug).not.toContain('যাচাইকৃত ধরন');
      }
    }
  });

  it('/skills resolves to an honest coming-soon entry', () => {
    const seo = resolveRouteSeo('/skills');
    expect(seo).not.toBeNull();
    expect(seo!.title).toContain('শীঘ্রই আসছে');
    expect(seo!.description).toContain('শীঘ্রই আসছে');
  });

  it('/terms resolves to the honest Terms entry (23 Nov 2026, Master Plan quick-wins)', () => {
    // /terms joined SITEMAP_URLS at merge prep (owner approved the
    // text 23 Nov 2026 06:57); sitemap.xml lists it too — the
    // sitemap-drift test enforces the two stay in sync.
    const seo = resolveRouteSeo('/terms');
    expect(seo).not.toBeNull();
    expect(seo!.title).toBe('শর্তাবলী — Eduvelto');
    expect(seo!.canonical).toBe(`${SITE_URL}/bn/terms`);
    expect(seo!.description).toContain('বিনামূল্যের');
    expect(seo!.title).not.toMatch(FORBIDDEN_RANK_CLAIM);
    expect(seo!.description).not.toMatch(FORBIDDEN_RANK_CLAIM);
  });

  it('sitemap.xml lists exactly the SITEMAP_URLS (no drift)', () => {
    const xml = readFileSync(
      fileURLToPath(new URL('../../../public/sitemap.xml', import.meta.url)),
      'utf8',
    );
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = SITEMAP_URLS.map((p) => `${SITE_URL}${p === '/' ? '/' : p}`);
    expect(locs.sort()).toEqual(expected.sort());
  });

  it('every sitemap URL is covered by a firebase.json hosting rewrite (24 Nov 2026)', () => {
    // Caught live 24 Nov 2026: the 4 new policy pages were in the sitemap
    // and in App.tsx but NOT in firebase.json rewrites, so Hosting served
    // 404 for them while /learn/** guides (covered by a glob) worked.
    // A sitemap URL that no rewrite covers is a live 404 for crawlers.
    const raw = readFileSync(
      fileURLToPath(new URL('../../../firebase.json', import.meta.url)),
      'utf8',
    );
    const rewrites = (JSON.parse(raw).hosting.rewrites ?? []) as {
      source: string;
      destination: string;
    }[];
    const covered = (path: string) =>
      rewrites.some(({ source }) =>
        source.endsWith('/**')
          ? path === source.slice(0, -3) || path.startsWith(`${source.slice(0, -3)}/`)
          : path === source,
      );
    const uncovered = SITEMAP_URLS.filter((p) => p !== '/' && !covered(p));
    expect(uncovered).toEqual([]);
  });

  it('WEB-001: /jobs/primary 301-redirects to /jobs/primary-teacher in firebase.json (24 Nov 2026)', () => {
    // /jobs/primary is the plausible shorthand for the Primary teacher
    // section, but the exam key is "primary-teacher" — JobHubPage renders
    // NotFound for :exam=primary (soft 404, HTTP 200). A hosting-level
    // 301 is the fix: crawlers and users land on the real page.
    const raw = readFileSync(
      fileURLToPath(new URL('../../../firebase.json', import.meta.url)),
      'utf8',
    );
    const redirects = (JSON.parse(raw).hosting.redirects ?? []) as {
      source: string;
      destination: string;
      type: number;
    }[];
    const hit = redirects.find((r) => r.source === '/jobs/primary');
    expect(hit).toBeDefined();
    expect(hit!.destination).toBe('/bn/jobs/primary-teacher');
    expect(hit!.type).toBe(301);
  });

  it('job hub tabs resolve with Bangla tab names, unknown tabs fall back', () => {
    const mocks = resolveRouteSeo('/jobs/bcs/mocks');
    expect(mocks).not.toBeNull();
    expect(mocks!.title).toContain('মক টেস্ট');
    expect(mocks!.title).not.toContain('mocks');
    const unknownTab = resolveRouteSeo('/jobs/bcs/not-a-tab');
    expect(unknownTab).not.toBeNull();
    expect(unknownTab!.title).toContain('বিসিএস');
    expect(unknownTab!.title).not.toContain('not-a-tab');
  });

  it('unknown job exam slugs resolve to null (no invented page)', () => {
    expect(resolveRouteSeo('/jobs/not-an-exam')).toBeNull();
  });

  it('NU hub tabs and group subject pages share hub/group SEO', () => {
    const tab = resolveRouteSeo('/admissions/national-university/subjects');
    expect(tab).not.toBeNull();
    expect(tab!.title).toContain('জাতীয় বিশ্ববিদ্যালয়');
    const subject = resolveRouteSeo(
      '/admissions/national-university/science/subjects/physics/ami-kingbodontir-kotha-bolchhi',
    );
    expect(subject).not.toBeNull();
    expect(subject!.title).toContain('বিজ্ঞান শাখা');
  });

  it('JSON-LD is Organization + WebSite + WebPage + BreadcrumbList', () => {
    const seo = resolveRouteSeo('/jobs/bcs');
    expect(seo).not.toBeNull();
    const types = (seo!.jsonLd as Array<Record<string, unknown>>).map((o) => o['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'WebPage', 'BreadcrumbList']);
    const org = seo!.jsonLd![0] as Record<string, unknown>;
    expect(org['sameAs']).toEqual([
      'https://www.youtube.com/@EduveltoBD',
      'https://www.linkedin.com/company/eduvelto',
      'https://www.facebook.com/EduveltoBD',
    ]);
    const crumb = seo!.jsonLd![3] as Record<string, unknown>;
    const items = crumb['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i['name'])).toEqual(['হোম', 'চাকরি প্রস্তুতি', 'বিসিএস']);
  });

  it('Organization JSON-LD names the founder, with no private details', () => {
    // Owner 22 Nov 18:24: his name belongs in the SEO. The founder is
    // named inline (name + jobTitle) and linked to the full Person on
    // /founder, which already carries the approved DOB. No DOB, address
    // or phone may appear in the homepage JSON-LD.
    const org = ORGANIZATION_JSON_LD as unknown as Record<string, unknown>;
    const founder = org['founder'] as Record<string, unknown>;
    expect(founder['name']).toBe('Ali Hasan Mohammed Mizan');
    expect(founder['jobTitle']).toBe('Founder & CEO');
    expect(founder['@id']).toBe('https://eduvelto.com/founder#person');
    expect(org['sameAs']).toEqual([
      'https://www.youtube.com/@EduveltoBD',
      'https://www.linkedin.com/company/eduvelto',
      'https://www.facebook.com/EduveltoBD',
    ]);
    expect((org['areaServed'] as Record<string, unknown>)['name']).toBe('Bangladesh');
    const flat = JSON.stringify(ORGANIZATION_JSON_LD);
    expect(flat).not.toContain('2005');
    expect(flat).not.toContain('birthDate');
    expect(flat).not.toContain('streetAddress');
    expect(flat).not.toContain('postalCode');
    expect(flat).not.toContain('telephone');
    // foundingLocation (city-level, Cox's Bazar) stays: it shipped with
    // the 22 Nov SEO deploy and is the organisation's location, not a
    // personal address. No street address is ever added here.
  });
});

/** Bangla digits, e.g. 200 -> '২০০' (mirrors bnDigits in seo.ts). */
function bnDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

type ResolvedSeo = NonNullable<ReturnType<typeof resolveRouteSeo>>;

function jsonLdTypes(seo: ResolvedSeo): unknown[] {
  return (seo.jsonLd as Array<Record<string, unknown>>).map((o) => o['@type']);
}

function breadcrumbNames(seo: ResolvedSeo): string[] {
  const crumb = (seo.jsonLd as Array<Record<string, unknown>>).find(
    (o) => o['@type'] === 'BreadcrumbList',
  ) as Record<string, unknown> | undefined;
  expect(crumb, 'no BreadcrumbList in JSON-LD').toBeDefined();
  const items = crumb!['itemListElement'] as Array<Record<string, unknown>>;
  return items.map((i) => i['name'] as string);
}

/** The 23 job subject pages, derived from the canonical lib lists. */
function allJobSubjectPaths(): Array<{ examSlug: string; subjectSlug: string; path: string }> {
  return Object.entries(JOB_SUBJECTS).flatMap(([examSlug, subjects]) =>
    subjects.map((s) => ({
      examSlug,
      subjectSlug: s.slug,
      path: `/jobs/${examSlug}/subjects/${s.slug}`,
    })),
  );
}

/** The 9 NU subject pages: 3 common subjects × 3 groups. */
function allNuSubjectPaths(): string[] {
  return NU_GROUPS.flatMap((g) =>
    NU_SYLLABUS_COMMON_SLUGS.map((s) => `/admissions/national-university/${g.slug}/subjects/${s}`),
  );
}

describe('resolveRouteSeo — SEO 50–100 pages (23 Nov 2026)', () => {
  it('all 23 job subject pages resolve with subject + exam names, verified marks, coming-soon', () => {
    // Per-exam counts pinned to the verified Step 6 lists.
    expect(jobSubjectsForExam('bcs').length).toBe(10);
    expect(jobSubjectsForExam('bank').length).toBe(5);
    expect(jobSubjectsForExam('primary-teacher').length).toBe(4);
    expect(jobSubjectsForExam('ntrca').length).toBe(4);
    const all = allJobSubjectPaths();
    expect(all.length).toBe(23);
    for (const { examSlug, subjectSlug, path } of all) {
      const exam = jobExamBySlug(examSlug)!;
      const subject = JOB_SUBJECTS[examSlug].find((s) => s.slug === subjectSlug)!;
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      // Brand-SEO wave 12: the title keeps the full subject name
      // whenever it fits <=60; the two names that cannot fit even
      // without 'প্রস্তুতি' use the short form (parenthetical
      // stripped, or the wave-12 map) — the full name still stands
      // in the breadcrumb, description and page heading.
      const shortBn = subject.nameBn.replace(/\s*\(.*\)\s*$/, '');
      expect(
        seo!.title.includes(subject.nameBn) || seo!.title.includes(shortBn),
        `${path} title lacks the subject name`,
      ).toBe(true);
      expect(seo!.title, path).toContain(exam.bn);
      expect(subject.marks, `${path} marks must be verified`).not.toBeNull();
      expect(seo!.description, path).toContain(`${bnDigits(subject.marks!)} নম্বর`);
      expect(seo!.description, path).toContain('শীঘ্রই আসছে');
      expect(breadcrumbNames(seo!), path).toEqual([
        'হোম',
        'চাকরি প্রস্তুতি',
        exam.bn,
        subject.nameBn,
      ]);
    }
  });

  it('job subject pages reject cross-exam, unknown-exam and unknown-subject slugs', () => {
    // Ethics is a BCS subject, not a Bank one.
    expect(resolveRouteSeo('/jobs/bank/subjects/ethics')).toBeNull();
    // DG Food has no verified subjects at all.
    expect(resolveRouteSeo('/jobs/dgfood/subjects/bangla')).toBeNull();
    expect(resolveRouteSeo('/jobs/bcs/subjects/not-a-subject')).toBeNull();
  });

  it('all 9 NU subject pages resolve with group name, verified circular wording and draft wording', () => {
    expect(NU_SYLLABUS_COMMON_SLUGS).toEqual(['bangla', 'english', 'general-knowledge']);
    expect(NU_GROUPS.length).toBe(3);
    const paths = allNuSubjectPaths();
    expect(paths.length).toBe(9);
    for (const path of paths) {
      // '/admissions/national-university/<group>/subjects/<subject>'
      const [, , , groupSlug, , subjectSlug] = path.split('/');
      const group = NU_GROUPS.find((g) => g.slug === groupSlug)!;
      const subj = nuSyllabusSubjectBySlug(subjectSlug)!;
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.title, path).toContain(group.bn);
      expect(seo!.title, path).toContain(subj.nameBn);
      expect(seo!.description, path).toContain('বিজ্ঞপ্তি থেকে যাচাইকৃত');
      expect(seo!.description, path).toContain('খসড়া');
    }
  });

  it('NU group-block slugs and unknown subjects resolve to null', () => {
    // Group-40 blocks render the not-found card by design — not pages.
    expect(
      resolveRouteSeo('/admissions/national-university/science/subjects/group-science'),
    ).toBeNull();
    expect(
      resolveRouteSeo('/admissions/national-university/humanities/subjects/group-humanities'),
    ).toBeNull();
    expect(
      resolveRouteSeo('/admissions/national-university/business/subjects/group-business'),
    ).toBeNull();
    expect(
      resolveRouteSeo('/admissions/national-university/science/subjects/not-a-subject'),
    ).toBeNull();
  });

  it('all 7 class pages resolve; only the 5 with books are in the sitemap', () => {
    expect(CLASS_LEVELS.length).toBe(7);
    // Brand-SEO wave 1, F-06: class-1-5 / class-6-8 have no books
    // yet, so they are out of the sitemap (and noindexed) until
    // Classes 1–8 have real books — but they still resolve, live
    // for visitors with honest coming-soon content.
    const sitemapClassSlugs = SITEMAP_URLS.filter((p) => p.startsWith('/class/')).map((p) =>
      p.replace('/class/', ''),
    );
    expect(sitemapClassSlugs.sort()).toEqual([
      'class-9-10',
      'honours-masters',
      'hsc',
      'madrasa',
      'technical',
    ]);
    for (const level of CLASS_LEVELS) {
      const seo = resolveRouteSeo(`/class/${level.slug}`);
      expect(seo, `/class/${level.slug}`).not.toBeNull();
      expect(seo!.title, level.slug).toContain(level.bn);
    }
  });

  it('class 1–5 / 6–8 say content has not arrived; 9–10 / HSC / honours-masters do not', () => {
    for (const slug of ['class-1-5', 'class-6-8']) {
      const seo = resolveRouteSeo(`/class/${slug}`)!;
      expect(seo.description, slug).toContain('আসেনি');
      expect(seo.description, slug).toContain('আসছে');
      // The lib agrees: these levels have no books yet.
      expect(CLASS_LEVELS.find((c) => c.slug === slug)!.educationType, slug).toBeNull();
    }
    for (const slug of ['class-9-10', 'hsc', 'honours-masters']) {
      const seo = resolveRouteSeo(`/class/${slug}`)!;
      expect(seo.description, slug).not.toContain('আসেনি');
      expect(seo.description, slug).not.toContain('আসছে');
    }
  });

  it('resolveFallbackSeo noindexes junk URLs with the home canonical', () => {
    const home = resolveRouteSeo('/')!;
    const junk = resolveFallbackSeo('/jobs/primary');
    expect(junk).not.toBeNull();
    expect(junk!.robots).toBe('noindex, nofollow');
    expect(junk!.canonical).toBe(`${SITE_URL}/bn/`);
    expect(junk!.title).toBe(home.title);
    expect(junk!.description).toBe(home.description);
    // /founder resolves in resolveRouteSeo since Phase 2, so the
    // fallback is never applied to it — but the function itself no
    // longer special-cases it either.
    expect(resolveFallbackSeo('/founder')!.robots).toBe('noindex, nofollow');
    const login = resolveFallbackSeo('/login');
    expect(login).not.toBeNull();
    expect(login!.robots).toBe('noindex, nofollow');
    // Fallback is a separate function — resolveRouteSeo still returns
    // null for unknown slugs; do not change that behaviour.
    expect(resolveRouteSeo('/jobs/not-an-exam')).toBeNull();
    expect(resolveRouteSeo('/jobs/primary')).toBeNull();
  });

  it('every sitemap <url> has a <lastmod> (audit SEO-007)', () => {
    const xml = readFileSync(
      fileURLToPath(new URL('../../../public/sitemap.xml', import.meta.url)),
      'utf8',
    );
    const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    expect(blocks.length).toBe(SITEMAP_URLS.length);
    for (const block of blocks) {
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      expect(block, `no <lastmod> for ${loc}`).toContain('<lastmod>');
      // lastmod is the sitemap's revision date for that URL: 2026-11-23
      // for the 23 Nov revision, 2026-11-24 for URLs added by the
      // 24 Nov 2026 homepage redesign, 2026-11-25 for URLs added or
      // changed by the 25 Nov 2026 Phase 2 build, 2026-11-26 for URLs
      // added by the 26 Nov 2026 Day 1 audit fix. (Was a single
      // pinned date before this revision added new URLs.)
      expect(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26']).toContain(
        block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
      );
    }
  });

  it('forbidden-claim sweep over every sitemap URL + all 23 job + 9 NU subject pages + 8 noindexed pages', () => {
    const swept = new Set([
      ...SITEMAP_URLS,
      ...allJobSubjectPaths().map((p) => p.path),
      ...allNuSubjectPaths(),
      // MERGE 23 Nov 2026 (AdSense Part 1 onto main 9a65524): the 8
      // noindexed public pages (5 health, /ai-teacher, /jobs/circulars,
      // /jobs/calendar) are out of the sitemap but STILL swept — their
      // copy must pass the same claim gates as sitemap pages.
      '/health',
      '/health/medicines',
      '/health/diseases',
      '/health/doctors',
      '/health/hospitals',
      '/ai-teacher',
      '/jobs/circulars',
      '/jobs/calendar',
      // Brand-SEO wave 1, F-06 (24 Nov 2026): the 2 thin class pages
      // are out of the sitemap now but STILL swept — their copy must
      // pass the same claim gates as sitemap pages.
      '/class/class-1-5',
      '/class/class-6-8',
    ]);
    // AdSense Part 1 (23 Nov 2026): subject pages are mostly OUT of
    // the sitemap now (noindexed thin pages) but are STILL swept —
    // the sweep is the sitemap, plus the 22 job
    // subject pages and 9 NU subject pages not in the sitemap
    // (BCS English is in both, counted once), plus the 8 noindexed
    // public pages above (none is in the sitemap or a subject path),
    // plus the 2 thin class pages.
    expect(swept.size).toBe(SITEMAP_URLS.length + 41);
    for (const path of swept) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for swept path ${path}`).not.toBeNull();
      expect(seo!.title, `title ${path}`).not.toMatch(FORBIDDEN_RANK_CLAIM);
      expect(seo!.description, `description ${path}`).not.toMatch(FORBIDDEN_RANK_CLAIM);
      const d = seo!.description;
      if (d.includes('মক টেস্ট') || d.includes('MCQ অনুশীলন')) {
        expect(d, `unqualified live-practice claim in ${path}`).toContain('শীঘ্রই আসছে');
      }
      expect(d, `প্রশ্নব্যাংক offered as live in ${path}`).not.toContain('প্রশ্নব্যাংক');
      if (d.includes('AI শিক্ষক')) {
        // The /ai-teacher page may only say it is coming soon.
        expect(d, `AI teacher presented as live in ${path}`).toContain('শীঘ্রই আসছে');
      }
      // "যাচাইকৃত ধরন" gate, extended to subject pages: it may appear
      // only on a per-exam page whose pattern is verified /
      // last_verified (with "শেষ" for the latter). Subject pages use
      // "যাচাইকৃত সিলেবাসে" instead — never "যাচাইকৃত ধরন".
      if (path.includes('/subjects/')) {
        expect(d, path).not.toContain('যাচাইকৃত ধরন');
      }
      if (d.includes('যাচাইকৃত ধরন')) {
        // Per-exam pages AND their tab pages (/jobs/bcs/subjects,
        // /jobs/bcs/mocks, …) share the exam description, so the gate
        // allows one optional tab segment after the exam slug.
        const m = path.match(/^\/jobs\/([^/]+)(?:\/[^/]+)?$/);
        expect(m, `'যাচাইকৃত ধরন' outside a per-exam page: ${path}`).not.toBeNull();
        const status = jobPatternStatus(m![1]);
        expect(['verified', 'last_verified']).toContain(status);
        if (status === 'last_verified') expect(d, path).toContain('শেষ');
      }
    }
  });

  it('/jobs emits an ItemList of exactly the 15 exam hubs; /jobs/bcs does not', () => {
    expect(JOB_EXAMS.length).toBe(15);
    const jobs = resolveRouteSeo('/jobs')!;
    expect(jsonLdTypes(jobs)).toEqual([
      'Organization',
      'WebSite',
      'WebPage',
      'BreadcrumbList',
      'ItemList',
    ]);
    const itemList = (jobs.jsonLd as Array<Record<string, unknown>>)[4];
    const items = itemList['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.length).toBe(15);
    expect(items.map((i) => i['url'])).toEqual(
      JOB_EXAMS.map((e) => `${SITE_URL}/bn/jobs/${e.slug}`),
    );
    const bcs = resolveRouteSeo('/jobs/bcs')!;
    expect(jsonLdTypes(bcs)).toEqual(['Organization', 'WebSite', 'WebPage', 'BreadcrumbList']);
  });

  it('OG constants are the 1200x630 social image', () => {
    expect(OG_IMAGE_URL).toBe('https://eduvelto.com/og-image.jpg');
    expect(OG_IMAGE_URL).toBe(`${SITE_URL}/og-image.jpg`);
    expect(OG_IMAGE_WIDTH).toBe(1200);
    expect(OG_IMAGE_HEIGHT).toBe(630);
  });
});

describe('resolveRouteSeo — non-content routes resolve to null', () => {
  it('/founder resolves since Phase 2 (SEO moved into SeoHead data)', () => {
    // FounderPage no longer owns its SEO client-side via useSeo.
    expect(resolveRouteSeo('/founder')).not.toBeNull();
  });

  it('auth, admin, CEO and dashboards are not content', () => {
    for (const path of [
      '/login',
      '/register',
      '/register/role',
      '/admin',
      '/admin/jobs',
      '/ceo',
      '/ceo/approvals',
      '/profile',
      '/dashboard',
      '/student',
      '/teacher',
      '/guardian',
      '/jobs/dashboard',
      '/admissions/dashboard',
    ]) {
      expect(resolveRouteSeo(path), path).toBeNull();
    }
  });

  it('app-internal routes are not content', () => {
    // /exam + /progress are NOT here any more (23:00 check, 25 Nov
    // 2026): they are public pages in the sitemap now, with real SEO
    // in seo.ts — see the bare-canonical test above.
    for (const path of [
      '/routine',
      '/directory',
      '/quiz/abc',
      '/books/abc/chapters/def',
      '/lessons/abc',
      '/subjects/abc',
      '/library/some-book',
      '/class/class-9',
      '/social',
    ]) {
      expect(resolveRouteSeo(path), path).toBeNull();
    }
  });
});

describe('resolveRouteSeo — AdSense Part 1 noindex + BCS English practice (23 Nov 2026)', () => {
  it('thin pages are noindexed but still resolve (live for users, not deleted)', () => {
    const noindexed = [
      // Every job subject page except BCS English.
      ...allJobSubjectPaths()
        .map((p) => p.path)
        .filter((p) => p !== '/jobs/bcs/subjects/english'),
      // Every NU subject page.
      ...allNuSubjectPaths(),
      '/health',
      '/health/medicines',
      '/health/diseases',
      '/health/doctors',
      '/health/hospitals',
      '/jobs/circulars',
      '/jobs/calendar',
      '/ai-teacher',
    ];
    expect(noindexed.length).toBe(22 + 9 + 5 + 2 + 1);
    for (const path of noindexed) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.robots, path).toBe('noindex, nofollow');
      expect(SITEMAP_URLS, path).not.toContain(path);
    }
  });

  it('BCS English subject page stays indexable and in the sitemap', () => {
    const seo = resolveRouteSeo('/jobs/bcs/subjects/english')!;
    expect(seo.robots).toBeUndefined();
    expect(SITEMAP_URLS).toContain('/jobs/bcs/subjects/english');
  });

  it('the 6 new BCS English routes resolve, are indexable, and are in the sitemap', () => {
    const paths = [
      '/jobs/bcs/practice/english',
      '/jobs/bcs/practice/english/grammar',
      '/jobs/bcs/practice/english/vocabulary',
      '/jobs/bcs/practice/english/reading',
      '/learn/bcs-english-tense',
      '/learn/bcs-english-preposition',
    ];
    for (const path of paths) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.robots, path).toBeUndefined();
      expect(seo!.title.length, path).toBeGreaterThan(10);
      expect(seo!.description.length, path).toBeGreaterThan(40);
      expect(seo!.canonical, path).toBe(`${SITE_URL}/bn${path}`);
      expect(SITEMAP_URLS, path).toContain(path);
    }
  });

  it('practice hub says practice is live (35 verified questions); mocks still in preparation', () => {
    const hub = resolveRouteSeo('/jobs/bcs/practice/english')!;
    expect(hub.description).toContain('৩৫টি যাচাইকৃত প্রশ্ন');
    expect(hub.description).toContain('প্রস্তুত হচ্ছে');
  });

  it('practice hub emits an ItemList of exactly its 3 child sections', () => {
    const hub = resolveRouteSeo('/jobs/bcs/practice/english')!;
    expect(jsonLdTypes(hub)).toEqual([
      'Organization',
      'WebSite',
      'WebPage',
      'BreadcrumbList',
      'ItemList',
    ]);
    const itemList = (hub.jsonLd as Array<Record<string, unknown>>)[4];
    const items = itemList['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i['url'])).toEqual([
      `${SITE_URL}/bn/jobs/bcs/practice/english/grammar`,
      `${SITE_URL}/bn/jobs/bcs/practice/english/vocabulary`,
      `${SITE_URL}/bn/jobs/bcs/practice/english/reading`,
    ]);
  });

  it('new routes carry real Bangla breadcrumbs, never raw slugs', () => {
    expect(breadcrumbNames(resolveRouteSeo('/jobs/bcs/practice/english')!)).toEqual([
      'হোম',
      'চাকরি প্রস্তুতি',
      'বিসিএস',
      'অনুশীলন',
      'ইংরেজি',
    ]);
    expect(breadcrumbNames(resolveRouteSeo('/jobs/bcs/practice/english/grammar')!)).toEqual([
      'হোম',
      'চাকরি প্রস্তুতি',
      'বিসিএস',
      'অনুশীলন',
      'ইংরেজি',
      'ব্যাকরণ',
    ]);
    expect(breadcrumbNames(resolveRouteSeo('/learn/bcs-english-tense')!)).toEqual([
      'হোম',
      'বিসিএস ইংরেজি',
      'টেন্স',
    ]);
  });

  it('/jobs copy now says BCS English practice is live; mocks still in preparation', () => {
    for (const path of ['/jobs', '/jobs/common']) {
      const seo = resolveRouteSeo(path)!;
      expect(seo.description, path).toContain('বিসিএস ইংরেজি অনুশীলন এখন চালু');
      expect(seo.description, path).toContain('মক পরীক্ষা এখনো প্রস্তুত হচ্ছে');
    }
    // Audit m22 (24 Nov 2026): the BCS sentence was irrelevant on
    // admission pages — it must NOT appear there any more; the
    // admission pages carry admission-specific live facts instead.
    for (const path of [
      '/admissions',
      '/admissions/national-university',
      '/admissions/national-university/humanities',
      '/admissions/national-university/science',
      '/admissions/national-university/business',
    ]) {
      expect(resolveRouteSeo(path)!.description, path).not.toContain('বিসিএস ইংরেজি');
    }
    // And the collective pages still never claim a verified pattern.
    for (const path of ['/jobs', '/admissions', '/admissions/national-university']) {
      expect(resolveRouteSeo(path)!.description, path).not.toContain('যাচাইকৃত');
    }
  });
});

describe('resolveRouteSeo — SEO pass 24 Nov 2026 (owner order "SEO korba ajk 100")', () => {
  function itemListOf(seo: ResolvedSeo): Record<string, unknown> {
    const list = (seo.jsonLd as Array<Record<string, unknown>>).find(
      (o) => o['@type'] === 'ItemList',
    );
    expect(list, 'no ItemList in JSON-LD').toBeDefined();
    return list!;
  }

  it('lesson pages say plainly they are drafts awaiting teacher review, and carry Article JSON-LD', () => {
    for (const path of ['/learn/bcs-english-tense', '/learn/bcs-english-preposition']) {
      const seo = resolveRouteSeo(path)!;
      expect(seo.description, path).toContain('খসড়া পাঠ');
      expect(seo.description, path).toContain('শিক্ষক যাচাইয়ের অপেক্ষায়');
      expect(seo.description, path).not.toContain('যাচাইকৃত');
      expect(jsonLdTypes(seo)).toContain('Article');
      const article = (seo.jsonLd as Array<Record<string, unknown>>).find(
        (o) => o['@type'] === 'Article',
      )!;
      expect(article['headline']).toBe(seo.title);
      expect(article['datePublished']).toBe('2026-11-23');
      expect(article['inLanguage']).toBe('bn');
    }
  });

  it('/learn hub emits an ItemList of its 56 guides + 2 lessons + the practice hub', () => {
    const seo = resolveRouteSeo('/learn')!;
    const items = itemListOf(seo)['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i['url'])).toEqual([
      `${SITE_URL}/bn/learn/bcs-preparation-guide`,
      `${SITE_URL}/bn/learn/bank-job-preparation`,
      `${SITE_URL}/bn/learn/primary-teacher-preparation`,
      `${SITE_URL}/bn/learn/ntrca-preparation`,
      `${SITE_URL}/bn/learn/nu-admission-guide`,
      `${SITE_URL}/bn/learn/english-grammar-basics`,
      `${SITE_URL}/bn/learn/scholarship-guide`,
      `${SITE_URL}/bn/learn/what-is-ai`,
      `${SITE_URL}/bn/learn/cv-writing-guide`,
      `${SITE_URL}/bn/learn/budget-planner-guide`,
      `${SITE_URL}/bn/learn/revision-strategy`,
      `${SITE_URL}/bn/learn/note-taking-guide`,
      `${SITE_URL}/bn/learn/time-management-students`,
      `${SITE_URL}/bn/learn/english-writing-basics`,
      `${SITE_URL}/bn/learn/online-safety-guide`,
      `${SITE_URL}/bn/learn/bangla-spelling-common-mistakes`,
      `${SITE_URL}/bn/learn/computer-basics-students`,
      `${SITE_URL}/bn/learn/exam-day-strategy`,
      `${SITE_URL}/bn/learn/mcq-answering-techniques`,
      `${SITE_URL}/bn/learn/memory-techniques-students`,
      `${SITE_URL}/bn/learn/study-routine-job-seekers`,
      `${SITE_URL}/bn/learn/healthy-habits-students`,
      `${SITE_URL}/bn/learn/digital-skills-basics`,
      `${SITE_URL}/bn/learn/exam-anxiety-management`,
      `${SITE_URL}/bn/learn/presentation-skills`,
      `${SITE_URL}/bn/learn/group-study-guide`,
      `${SITE_URL}/bn/learn/english-vocabulary-building`,
      `${SITE_URL}/bn/learn/effective-reading-habits`,
      `${SITE_URL}/bn/learn/self-motivation-students`,
      `${SITE_URL}/bn/learn/how-to-use-free-library`,
      `${SITE_URL}/bn/learn/how-to-use-job-practice`,
      `${SITE_URL}/bn/learn/how-to-use-ai-assistant`,
      `${SITE_URL}/bn/learn/how-to-use-opportunity-hub`,
      `${SITE_URL}/bn/learn/how-to-use-life-services`,
      `${SITE_URL}/bn/learn/spoken-english-practice`,
      `${SITE_URL}/bn/learn/goal-setting-students`,
      `${SITE_URL}/bn/learn/staying-focused-studying`,
      `${SITE_URL}/bn/learn/sleep-and-study`,
      `${SITE_URL}/bn/learn/reading-comprehension-strategies`,
      `${SITE_URL}/bn/learn/learning-with-phone`,
      `${SITE_URL}/bn/learn/asking-questions-class`,
      `${SITE_URL}/bn/guides/bcs-bangla-preparation`,
      `${SITE_URL}/bn/guides/bcs-english-preparation`,
      `${SITE_URL}/bn/guides/bcs-math-mental-ability`,
      `${SITE_URL}/bn/guides/bcs-science-ict-preparation`,
      `${SITE_URL}/bn/guides/primary-bangla-english-preparation`,
      `${SITE_URL}/bn/guides/primary-math-gk-preparation`,
      `${SITE_URL}/bn/guides/primary-viva-preparation`,
      `${SITE_URL}/bn/guides/bank-math-preparation`,
      `${SITE_URL}/bn/guides/bank-english-gk-preparation`,
      `${SITE_URL}/bn/guides/ntrca-written-exam-preparation`,
      `${SITE_URL}/bn/guides/ntrca-viva-subject-preparation`,
      `${SITE_URL}/bn/guides/gst-admission-preparation`,
      `${SITE_URL}/bn/guides/du-admission-preparation`,
      `${SITE_URL}/bn/guides/nctb-books-study-method`,
      `${SITE_URL}/bn/guides/nctb-revision-before-exams`,
      `${SITE_URL}/bn/learn/bcs-english-tense`,
      `${SITE_URL}/bn/learn/bcs-english-preposition`,
      `${SITE_URL}/bn/jobs/bcs/practice/english`,
    ]);
  });

  it('/opportunities hub emits an ItemList of exactly the published seed listings', () => {
    const published = OPPORTUNITY_SEED.filter((o) => isPublished(o));
    expect(published.length).toBe(7);
    const seo = resolveRouteSeo('/opportunities')!;
    const items = itemListOf(seo)['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i['url'])).toEqual(
      published.map((o) => `${SITE_URL}/opportunities/${o.docId}`),
    );
    expect(items.map((i) => i['name'])).toEqual(published.map((o) => o.titleBn));
  });

  it('all 7 opportunity detail pages + 5 guide pages resolve with real Bangla breadcrumbs', () => {
    for (const o of OPPORTUNITY_SEED.filter((x) => isPublished(x))) {
      const seo = resolveRouteSeo(`/opportunities/${o.docId}`);
      expect(seo, o.docId).not.toBeNull();
      expect(seo!.robots, o.docId).toBeUndefined();
      expect(breadcrumbNames(seo!)).toEqual(['হোম', 'সুযোগ হাব', o.titleBn]);
    }
    expect(breadcrumbNames(resolveRouteSeo('/opportunities/cv-builder')!)).toEqual([
      'হোম',
      'সুযোগ হাব',
      'সিভি তৈরি',
    ]);
    expect(breadcrumbNames(resolveRouteSeo('/opportunities/interview-prep')!)).toEqual([
      'হোম',
      'সুযোগ হাব',
      'ইন্টারভিউ প্রস্তুতি',
    ]);
    expect(breadcrumbNames(resolveRouteSeo('/opportunities/income')!)).toEqual([
      'হোম',
      'সুযোগ হাব',
      'বৈধ অনলাইন আয়',
    ]);
  });

  it('unpublished/unknown opportunity details resolve to null (never indexable)', () => {
    expect(resolveRouteSeo('/opportunities/not-a-listing')).toBeNull();
  });

  it('/life hub + long life titles fit search-result length (title <= 60, description <= 160)', () => {
    const hub = resolveRouteSeo('/life')!;
    expect(hub.title.length).toBeLessThanOrEqual(60);
    expect(hub.description.length).toBeLessThanOrEqual(160);
    expect(hub.description).toContain('Eduvelto');
    for (const path of ['/life/health', '/life/government']) {
      expect(resolveRouteSeo(path)!.title.length, path).toBeLessThanOrEqual(60);
    }
  });

  it('new-section breadcrumbs never use raw slugs', () => {
    for (const path of [
      '/life/budget',
      '/life/calculators',
      '/life/converters',
      '/life/planner',
      '/life/pdf-tools',
      '/life/health',
      '/life/government',
      '/life/travel',
      '/life/services',
      '/opportunities',
      '/opportunities/cv-builder',
      '/opportunities/interview-prep',
      '/opportunities/career-guidance',
      '/opportunities/entrepreneurship',
      '/opportunities/income',
    ]) {
      const names = breadcrumbNames(resolveRouteSeo(path)!);
      expect(names[0]).toBe('হোম');
      for (const name of names) {
        expect(name, path).not.toMatch(/^[a-z-]+$/);
      }
    }
  });
});

describe('resolveRouteSeo — brand-SEO wave 1 (24 Nov 2026)', () => {
  it('Organization JSON-LD no longer promises Class 1–8', () => {
    const org = ORGANIZATION_JSON_LD as unknown as Record<string, unknown>;
    const desc = org['description'] as string;
    expect(desc).not.toContain('Class 1');
    expect(desc).toContain('Class 9');
    expect(desc).toContain('Madrasa');
    expect(desc).toContain('free Bangladeshi digital education and life services platform');
    expect(org['sameAs']).toEqual([
      'https://www.youtube.com/@EduveltoBD',
      'https://www.linkedin.com/company/eduvelto',
      'https://www.facebook.com/EduveltoBD',
    ]);
  });

  it('class 1–5 / 6–8 are noindexed but still resolve, with honest copy', () => {
    for (const slug of ['class-1-5', 'class-6-8']) {
      const seo = resolveRouteSeo(`/class/${slug}`)!;
      expect(seo.robots, slug).toBe('noindex, nofollow');
      expect(seo.description, slug).toContain('আসেনি');
      expect(seo.description, slug).toContain('আসছে');
    }
    for (const slug of ['class-9-10', 'hsc', 'honours-masters']) {
      expect(resolveRouteSeo(`/class/${slug}`)!.robots, slug).toBeUndefined();
    }
  });

  it('all 56 guides resolve with draft wording and Article JSON-LD', () => {
    expect(PUBLIC_GUIDES).toHaveLength(56);
    for (const guide of PUBLIC_GUIDES) {
      const seo = resolveRouteSeo(guide.path);
      expect(seo, `no SEO for ${guide.path}`).not.toBeNull();
      expect(seo!.description, guide.path).toContain('খসড়া পাঠ');
      expect(seo!.description, guide.path).toContain('শিক্ষক যাচাইয়ের অপেক্ষায়');
      expect(seo!.description, guide.path).not.toContain('যাচাইকৃত');
      expect(seo!.robots, guide.path).toBeUndefined();
      expect(jsonLdTypes(seo!)).toContain('Article');
      const article = (seo!.jsonLd as Array<Record<string, unknown>>).find(
        (o) => o['@type'] === 'Article',
      )!;
      expect(article['headline']).toBe(seo!.title);
      expect(article['inLanguage']).toBe('bn');
      // Phase 2 (25 Nov 2026): the 15 Study Guides are free and
      // carry their own updatedAt as datePublished/dateModified;
      // the 41 older guides keep 2026-11-24 and no dateModified.
      expect(article['isAccessibleForFree']).toBe(true);
      expect(article['datePublished']).toBe(guide.updatedAt ?? '2026-11-24');
      if (guide.updatedAt) expect(article['dateModified']).toBe(guide.updatedAt);
      else expect(article).not.toHaveProperty('dateModified');
      const hub = guide.path.startsWith('/guides/') ? 'গাইড' : 'পাঠ';
      expect(breadcrumbNames(seo!)).toEqual(['হোম', hub, guide.crumbBn]);
    }
  });

  it('/guides hub emits an ItemList of its 15 Study Guides', () => {
    const seo = resolveRouteSeo('/guides')!;
    const list = (seo.jsonLd as Array<Record<string, unknown>>).find(
      (o) => o['@type'] === 'ItemList',
    )!;
    expect(list, 'no ItemList in JSON-LD').toBeDefined();
    const items = list['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i['url'])).toEqual(
      PUBLIC_GUIDES.filter((g) => g.path.startsWith('/guides/')).map(
        (g) => `${SITE_URL}/bn${g.path}`,
      ),
    );
    expect(items).toHaveLength(15);
  });

describe('/founder SEO (Phase 2, 25 Nov 2026)', () => {
  it('resolves in both languages with profile ogType + founder photo', () => {
    const bn = resolveRouteSeo('/founder')!;
    expect(bn.title).toBe('আলী হাসান মোহাম্মদ মিজান — প্রতিষ্ঠাতা ও সিইও, Eduvelto');
    expect(bn.canonical).toBe('https://eduvelto.com/bn/founder');
    expect(bn.ogType).toBe('profile');
    expect(bn.ogImage).toBe('https://eduvelto.com/founder-photo.jpg');
    expect(bn.robots).toBeUndefined();
    const en = resolveRouteSeo('/founder', 'en')!;
    expect(en.title).toBe('Ali Hasan Mohammed Mizan — Founder & CEO, Eduvelto');
    expect(en.canonical).toBe('https://eduvelto.com/en/founder');
    expect(en.ogType).toBe('profile');
    expect(en.ogImage).toBe('https://eduvelto.com/founder-photo.jpg');
  });

  it('carries ProfilePage + Person JSON-LD, no generic WebPage, no duplicate #webpage @id', () => {
    for (const lang of ['bn', 'en'] as const) {
      const seo = resolveRouteSeo('/founder', lang)!;
      const types = jsonLdTypes(seo);
      expect(types).toContain('ProfilePage');
      expect(types).toContain('Person');
      expect(types).not.toContain('WebPage');
      const ld = seo.jsonLd as Array<Record<string, unknown>>;
      const ids = ld.map((o) => o['@id']).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
      const profile = ld.find((o) => o['@type'] === 'ProfilePage')!;
      expect(profile['@id']).toBe(`${seo.canonical}#webpage`);
      expect(profile['mainEntity']).toEqual({ '@id': 'https://eduvelto.com/founder#person' });
      expect(profile['inLanguage']).toEqual([lang]);
      expect(profile['name']).toBe(seo.title);
      expect(profile['description']).toBe(seo.description);
      const person = ld.find((o) => o['@type'] === 'Person')!;
      expect(person['name']).toBe('Ali Hasan Mohammed Mizan');
      expect(person['birthDate']).toBe('2005-02-21');
      expect(person['sameAs']).not.toContain('https://www.instagram.com/ahmmmizan');
    }
  });

  it('breadcrumb is Home > Founder in both languages', () => {
    expect(breadcrumbNames(resolveRouteSeo('/founder')!)).toEqual(['হোম', 'প্রতিষ্ঠাতা']);
    expect(breadcrumbNames(resolveRouteSeo('/founder', 'en')!)).toEqual(['Home', 'Founder']);
  });
});

describe('buildBookSummary (Phase 2, 25 Nov 2026)', () => {
  const BOOK = {
    id: 'hons-211001',
    title: 'History and Culture of Bangladesh and Bengalees (From Ancients to 2000 AD)',
    subject: 'Bangla',
    chapterCount: 3,
    questionCount: 26,
  };

  it('builds the rich paragraph in both languages from real metadata', () => {
    expect(buildBookSummary(BOOK, 'bn')).toBe(
      'History and Culture of Bangladesh and Bengalees (From Ancients to 2000 AD) — Bangla। এই বইটি Eduvelto ডিজিটাল লাইব্রেরিতে সম্পূর্ণ ফ্রিতে পড়ুন। এই বইটিতে মোট 3টি অধ্যায় এবং অনুশীলনের জন্য 26টি প্রশ্ন রয়েছে।',
    );
    expect(buildBookSummary(BOOK, 'en')).toBe(
      'History and Culture of Bangladesh and Bengalees (From Ancients to 2000 AD) — Bangla. Read this book completely free in the Eduvelto digital library. This book has 3 chapters and 26 practice questions in total.',
    );
  });

  it('omits counts it does not have, never invents them', () => {
    const bare = { id: 'x-1', title: 'Bare Book' };
    expect(buildBookSummary(bare, 'bn')).toBe(
      'Bare Book। এই বইটি Eduvelto ডিজিটাল লাইব্রেরিতে সম্পূর্ণ ফ্রিতে পড়ুন।',
    );
    expect(buildBookSummary(bare, 'en')).toBe(
      'Bare Book. Read this book completely free in the Eduvelto digital library.',
    );
    const chaptersOnly = { ...bare, chapterCount: 5 };
    expect(buildBookSummary(chaptersOnly, 'bn')).toContain('মোট 5টি অধ্যায় রয়েছে।');
    expect(buildBookSummary(chaptersOnly, 'bn')).not.toContain('প্রশ্ন');
    const questionsOnly = { ...bare, questionCount: 40 };
    expect(buildBookSummary(questionsOnly, 'en')).toContain('40 practice questions in total.');
    expect(buildBookSummary(questionsOnly, 'en')).not.toContain('chapters');
  });

  it('bookSeoData Book JSON-LD marks the book free', () => {
    const ld = bookSeoData(BOOK, 'bn').jsonLd as Array<Record<string, unknown>>;
    const book = ld.find((o) => o['@type'] === 'Book')!;
    expect(book['isAccessibleForFree']).toBe(true);
  });
});

  it('the 4 trust pages resolve with the draft titles', () => {
    const expected: Record<string, { title: string; crumb: string }> = {
      '/editorial-policy': { title: 'সম্পাদকীয় নীতি | Eduvelto', crumb: 'সম্পাদকীয় নীতি' },
      '/content-accuracy': { title: 'বিষয়বস্তুর নির্ভুলতা নীতি | Eduvelto', crumb: 'বিষয়বস্তুর নির্ভুলতা' },
      '/certificate-policy': { title: 'সার্টিফিকেট নীতি | Eduvelto', crumb: 'সার্টিফিকেট নীতি' },
      '/disclaimer': { title: 'দায়বর্জন | Eduvelto', crumb: 'দায়বর্জন' },
    };
    for (const [path, { title, crumb }] of Object.entries(expected)) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.title).toBe(title);
      expect(seo!.robots, path).toBeUndefined();
      expect(breadcrumbNames(seo!)).toEqual(['হোম', crumb]);
    }
  });

  it('/why-eduvelto keeps its ambition as a goal only — no rank wording', () => {
    const seo = resolveRouteSeo('/why-eduvelto')!;
    expect(seo.title).toBe('কেন Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম');
    expect(seo.title).not.toContain('সেরা');
    expect(seo.description).not.toContain('সেরা');
    expect(seo.description).not.toMatch(FORBIDDEN_RANK_CLAIM);
  });

  it('no sitemap title or description contains "সেরা" or "best"', () => {
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path)!;
      expect(seo.title, `title ${path}`).not.toContain('সেরা');
      expect(seo.description, `description ${path}`).not.toContain('সেরা');
      expect(seo.title, `title ${path}`).not.toMatch(/best/i);
      expect(seo.description, `description ${path}`).not.toMatch(/best/i);
    }
  });
});

describe('resolveRouteSeo — English SEO (24 Nov 2026, language system)', () => {
  // Bangla block EXCEPT U+09F3 (৳, the Taka sign): English pricing
  // copy uses ৳ too ('৳49/paper'), and it is a currency sign, not a
  // Bangla word — the intent here is "no Bangla words in English SEO".
  const BN = /[\u0980-\u09F2\u09F4-\u09FF]/;

  it('every sitemap URL resolves in English with no Bangla in title/description and a clean canonical', () => {
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path, 'en');
      expect(seo, path).not.toBeNull();
      expect(seo!.title, path).not.toMatch(BN);
      expect(seo!.description, path).not.toMatch(BN);
      // Bare-canonical app routes (23:00 check, 25 Nov 2026): the
      // canonical is the bare URL in English too, not /en/... .
      const expectedCanonical =
        path === '/exam' || path === '/progress'
          ? `${SITE_URL}${path}`
          : `${SITE_URL}/en${path === '/' ? '' : path}`;
      expect(seo!.canonical, path).toBe(expectedCanonical);
      expect(seo!.canonical, path).not.toContain('?lang=');
    }
  });

  it('English titles are unique across sitemap URLs', () => {
    const titles = new Set<string>();
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path, 'en')!;
      expect(titles.has(seo.title), `${path} duplicates title "${seo.title}"`).toBe(false);
      titles.add(seo.title);
    }
  });

  it('English copy keeps the honest caveats (no content for 1–5/6–8, drafts, coming soon)', () => {
    expect(resolveRouteSeo('/class/class-1-5', 'en')!.description).toContain(
      'have not reached the library yet',
    );
    expect(resolveRouteSeo('/class/class-6-8', 'en')!.description).toContain(
      'have not reached the library yet',
    );
    expect(resolveRouteSeo('/learn/bcs-english-tense', 'en')!.description).toContain(
      'awaiting teacher review',
    );
    expect(resolveRouteSeo('/ai-teacher', 'en')!.description).toContain('coming soon');
    expect(resolveRouteSeo('/health/doctors', 'en')!.description).toContain('nobody is listed yet');
  });

  it('English copy never claims a #1 rank', () => {
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path, 'en')!;
      expect(seo.title, path).not.toMatch(FORBIDDEN_RANK_CLAIM);
      expect(seo.description, path).not.toMatch(FORBIDDEN_RANK_CLAIM);
    }
  });

  it('dynamic pages resolve in English: exam, subject, NU subject, opportunity', () => {
    const bcs = resolveRouteSeo('/jobs/bcs', 'en')!;
    expect(bcs.title).toContain('BCS Preparation');
    expect(bcs.title).toContain('Bangladesh Civil Service');
    expect(bcs.description).toContain('BCS English MCQ practice is live');
    const subj = resolveRouteSeo('/jobs/bcs/subjects/english', 'en')!;
    expect(subj.title).toContain('English Language & Literature — BCS Preparation');
    expect(subj.description).toContain('marks in the verified syllabus');
    const nu = resolveRouteSeo('/admissions/national-university/science/subjects/english', 'en')!;
    // Brand-SEO wave 12: the old pin ('English — National University
    // Admission Preparation (Science)') was 61 chars before the
    // ' | Eduvelto' suffix — itself over the <=60 title limit — so
    // the title now keeps the university + group in short form.
    expect(nu.title).toContain('English — National University (Science)');
    expect(nu.description).toContain('verified from the circular');
    const opp = resolveRouteSeo('/opportunities/bpsc-non-cadre-2026', 'en')!;
    expect(opp.title).not.toMatch(BN);
    expect(opp.description).toContain('verified from an official source');
  });

  it('English breadcrumbs start with Home and carry no Bangla', () => {
    for (const path of [
      '/jobs/bcs/practice/english',
      '/jobs/bcs/practice/english/grammar',
      '/learn/bcs-english-tense',
      '/opportunities',
      '/jobs/bcs/subjects/english',
    ]) {
      const names = breadcrumbNames(resolveRouteSeo(path, 'en')!);
      expect(names[0], path).toBe('Home');
      for (const name of names) expect(name, path).not.toMatch(BN);
    }
    expect(breadcrumbNames(resolveRouteSeo('/jobs/bcs/practice/english', 'en')!)).toEqual([
      'Home',
      'Job Preparation',
      'BCS',
      'Practice',
      'English',
    ]);
  });

  it('English ItemLists name exams and sections in English', () => {
    const jobs = resolveRouteSeo('/jobs', 'en')!;
    const list = (jobs.jsonLd as Array<Record<string, unknown>>).find(
      (o) => o['@type'] === 'ItemList',
    ) as Record<string, unknown>;
    expect(list['name']).toBe('Job Preparation — Exams');
    const items = list['itemListElement'] as Array<Record<string, unknown>>;
    expect(items[0]['name']).toBe('BCS Preparation');
    const practice = resolveRouteSeo('/jobs/bcs/practice/english', 'en')!;
    const plist = (practice.jsonLd as Array<Record<string, unknown>>).find(
      (o) => o['@type'] === 'ItemList',
    ) as Record<string, unknown>;
    expect(plist['name']).toBe('BCS English Practice');
  });

  it('resolveFallbackSeo returns the English home title with noindex', () => {
    const fb = resolveFallbackSeo('/jobs/primary', 'en')!;
    expect(fb.title).toBe("Eduvelto — Bangladesh's Free Education Platform");
    expect(fb.title).not.toMatch(BN);
    expect(fb.canonical).toBe(`${SITE_URL}/en/`);
    expect(fb.robots).toBe('noindex, nofollow');
    expect(resolveFallbackSeo('/founder', 'en')!.robots).toBe('noindex, nofollow');
  });

  it('WebPage JSON-LD inLanguage follows the language', () => {
    const webPage = (s: ResolvedSeo) =>
      (s.jsonLd as Array<Record<string, unknown>>).find(
        (o) => o['@type'] === 'WebPage',
      ) as Record<string, unknown>;
    const bn = resolveRouteSeo('/jobs', 'bn')!;
    const en = resolveRouteSeo('/jobs', 'en')!;
    expect(webPage(bn)['inLanguage']).toEqual(['bn']);
    expect(webPage(en)['inLanguage']).toEqual(['en']);
    expect(webPage(en)['name']).toBe(en.title);
  });
});

describe('resolveRouteSeo — brand-SEO wave 2 (24 Nov 2026)', () => {
  it('sitemap has 144 URLs (120 wave-9/10 + audit-M12 + 16 Phase 2 guides + /support, Phase 3 + 6 Day 1 audit fix, 26 Nov 2026 + 1 Day 6 /suggestions store)', () => {
    expect(SITEMAP_URLS.length).toBe(144);
  });

  it('English home title drops "Best"; Bangla title is unchanged', () => {
    const en = resolveRouteSeo('/', 'en')!;
    expect(en.title).toBe("Eduvelto — Bangladesh's Free Education Platform");
    expect(en.title).not.toMatch(/best/i);
    expect(en.description).not.toMatch(/best/i);
    const bn = resolveRouteSeo('/')!;
    expect(bn.title).toBe('Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম');
  });

  it('/why-eduvelto English title drops "Best" — its Bangla counterpart has no superlative', () => {
    // The Bangla title/description carry no superlative ("আস্থার"
    // = trusted, not "সেরা"), so the English title is fixed to
    // match its strength instead of out-claiming it; the English
    // description keeps the ambition only as a goal ("aims to be").
    const bn = resolveRouteSeo('/why-eduvelto')!;
    expect(bn.title).not.toContain('সেরা');
    expect(bn.description).not.toContain('সেরা');
    const en = resolveRouteSeo('/why-eduvelto', 'en')!;
    expect(en.title).toBe("Why Eduvelto — Bangladesh's Free Education Platform");
    expect(en.title).not.toMatch(/best/i);
    expect(en.description).not.toMatch(/best/i);
    expect(en.description).toContain('aims to be');
  });

  it('no English sitemap title or description contains "best" or "সেরা"', () => {
    for (const path of SITEMAP_URLS) {
      const seo = resolveRouteSeo(path, 'en')!;
      expect(seo.title, `title ${path}`).not.toMatch(/best/i);
      expect(seo.description, `description ${path}`).not.toMatch(/best/i);
      expect(seo.title, `title ${path}`).not.toContain('সেরা');
      expect(seo.description, `description ${path}`).not.toContain('সেরা');
    }
  });

  it('the not-found hook restores the live home titles, with no superlative', () => {
    // Brand-SEO wave 2 catch: useNotFoundMeta.ts hardcoded the old
    // "সেরা"/"Best" home titles as its cleanup restore values, so
    // leaving a not-found page put the superlative back into
    // document.title. The restore values must equal the live home
    // titles in both languages.
    const src = readFileSync(
      fileURLToPath(new URL('../useNotFoundMeta.ts', import.meta.url)),
      'utf8',
    );
    const bn = src.match(/HOME_FALLBACK_TITLE_BN = '([^']+)'/)?.[1];
    const en = src.match(/HOME_FALLBACK_TITLE_EN = "([^"]+)"/)?.[1];
    expect(bn).toBe(resolveRouteSeo('/')!.title);
    expect(en).toBe(resolveRouteSeo('/', 'en')!.title);
    expect(bn).not.toContain('সেরা');
    expect(en).not.toMatch(/best/i);
  });

  it('the 7 wave-2 guides resolve with draft wording, Article JSON-LD and real breadcrumbs', () => {
    const wave2: Array<{ path: string; crumbBn: string; crumbEn: string }> = [
      { path: '/learn/revision-strategy', crumbBn: 'পুনরালোচনার কৌশল', crumbEn: 'Revision Strategy' },
      { path: '/learn/note-taking-guide', crumbBn: 'নোট নেওয়ার কৌশল', crumbEn: 'Note-Taking Techniques' },
      { path: '/learn/time-management-students', crumbBn: 'সময় ব্যবস্থাপনা', crumbEn: 'Time Management' },
      { path: '/learn/english-writing-basics', crumbBn: 'ইংরেজি লেখা', crumbEn: 'English Writing' },
      { path: '/learn/online-safety-guide', crumbBn: 'অনলাইন নিরাপত্তা', crumbEn: 'Online Safety' },
      { path: '/learn/bangla-spelling-common-mistakes', crumbBn: 'বাংলা বানান', crumbEn: 'Bangla Spelling' },
      { path: '/learn/computer-basics-students', crumbBn: 'কম্পিউটারের মৌলিক ধারণা', crumbEn: 'Computer Basics' },
    ];
    for (const { path, crumbBn, crumbEn } of wave2) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.description, path).toContain('খসড়া পাঠ');
      expect(seo!.description, path).toContain('শিক্ষক যাচাইয়ের অপেক্ষায়');
      expect(seo!.description, path).not.toContain('যাচাইকৃত');
      expect(seo!.robots, path).toBeUndefined();
      expect(jsonLdTypes(seo!)).toContain('Article');
      const article = (seo!.jsonLd as Array<Record<string, unknown>>).find(
        (o) => o['@type'] === 'Article',
      )!;
      expect(article['headline']).toBe(seo!.title);
      expect(article['datePublished']).toBe('2026-11-24');
      expect(article['inLanguage']).toBe('bn');
      expect(breadcrumbNames(seo!)).toEqual(['হোম', 'পাঠ', crumbBn]);
      const en = resolveRouteSeo(path, 'en')!;
      expect(en.title, path).not.toMatch(/best/i);
      expect(en.description, path).toContain('awaiting teacher review');
      expect(breadcrumbNames(en)).toEqual(['Home', 'Lessons', crumbEn]);
    }
  });
});

describe('resolveRouteSeo — brand-SEO wave 3 (24 Nov 2026)', () => {
  it('all 6 wave-3 guide URLs are in the sitemap list', () => {
    for (const path of [
      '/learn/exam-day-strategy',
      '/learn/mcq-answering-techniques',
      '/learn/memory-techniques-students',
      '/learn/study-routine-job-seekers',
      '/learn/healthy-habits-students',
      '/learn/digital-skills-basics',
    ]) {
      expect(SITEMAP_URLS, path).toContain(path);
    }
  });

  it('the 6 wave-3 guides resolve with draft wording, Article JSON-LD and real breadcrumbs', () => {
    const wave3: Array<{ path: string; crumbBn: string; crumbEn: string }> = [
      { path: '/learn/exam-day-strategy', crumbBn: 'পরীক্ষার দিনের কৌশল', crumbEn: 'Exam Day Strategy' },
      { path: '/learn/mcq-answering-techniques', crumbBn: 'MCQ উত্তর দেওয়ার কৌশল', crumbEn: 'MCQ Answering Techniques' },
      { path: '/learn/memory-techniques-students', crumbBn: 'মনে রাখার কৌশল', crumbEn: 'Memory Techniques' },
      { path: '/learn/study-routine-job-seekers', crumbBn: 'চাকরিপ্রার্থীদের রুটিন', crumbEn: 'Job Seeker Routine' },
      { path: '/learn/healthy-habits-students', crumbBn: 'সুস্থ অভ্যাস', crumbEn: 'Healthy Habits' },
      { path: '/learn/digital-skills-basics', crumbBn: 'ডিজিটাল দক্ষতা', crumbEn: 'Digital Skills' },
    ];
    for (const { path, crumbBn, crumbEn } of wave3) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.description, path).toContain('খসড়া পাঠ');
      expect(seo!.description, path).toContain('শিক্ষক যাচাইয়ের অপেক্ষায়');
      expect(seo!.description, path).not.toContain('যাচাইকৃত');
      expect(seo!.robots, path).toBeUndefined();
      expect(jsonLdTypes(seo!)).toContain('Article');
      const article = (seo!.jsonLd as Array<Record<string, unknown>>).find(
        (o) => o['@type'] === 'Article',
      )!;
      expect(article['headline']).toBe(seo!.title);
      expect(article['datePublished']).toBe('2026-11-24');
      expect(article['inLanguage']).toBe('bn');
      expect(breadcrumbNames(seo!)).toEqual(['হোম', 'পাঠ', crumbBn]);
      const en = resolveRouteSeo(path, 'en')!;
      expect(en.title, path).not.toMatch(/best/i);
      expect(en.description, path).toContain('awaiting teacher review');
      expect(breadcrumbNames(en)).toEqual(['Home', 'Lessons', crumbEn]);
    }
  });
});

describe('resolveRouteSeo — brand-SEO wave 4 (24 Nov 2026)', () => {
  it('all 6 wave-4 guide URLs are in the sitemap list', () => {
    for (const path of [
      '/learn/exam-anxiety-management',
      '/learn/presentation-skills',
      '/learn/group-study-guide',
      '/learn/english-vocabulary-building',
      '/learn/effective-reading-habits',
      '/learn/self-motivation-students',
    ]) {
      expect(SITEMAP_URLS, path).toContain(path);
    }
  });

  it('the 6 wave-4 guides resolve with draft wording, Article JSON-LD and real breadcrumbs', () => {
    const wave4: Array<{ path: string; crumbBn: string; crumbEn: string }> = [
      { path: '/learn/exam-anxiety-management', crumbBn: 'পরীক্ষার উদ্বেগ', crumbEn: 'Exam Anxiety' },
      { path: '/learn/presentation-skills', crumbBn: 'উপস্থাপনা দক্ষতা', crumbEn: 'Presentation Skills' },
      { path: '/learn/group-study-guide', crumbBn: 'দলগত পড়াশোনা', crumbEn: 'Group Study' },
      { path: '/learn/english-vocabulary-building', crumbBn: 'ইংরেজি শব্দভান্ডার', crumbEn: 'English Vocabulary' },
      { path: '/learn/effective-reading-habits', crumbBn: 'পড়ার অভ্যাস', crumbEn: 'Reading Habits' },
      { path: '/learn/self-motivation-students', crumbBn: 'নিজেকে অনুপ্রাণিত রাখা', crumbEn: 'Self-Motivation' },
    ];
    for (const { path, crumbBn, crumbEn } of wave4) {
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for ${path}`).not.toBeNull();
      expect(seo!.description, path).toContain('খসড়া পাঠ');
      expect(seo!.description, path).toContain('শিক্ষক যাচাইয়ের অপেক্ষায়');
      expect(seo!.description, path).not.toContain('যাচাইকৃত');
      expect(seo!.robots, path).toBeUndefined();
      expect(jsonLdTypes(seo!)).toContain('Article');
      const article = (seo!.jsonLd as Array<Record<string, unknown>>).find(
        (o) => o['@type'] === 'Article',
      )!;
      expect(article['headline']).toBe(seo!.title);
      expect(article['datePublished']).toBe('2026-11-24');
      expect(article['inLanguage']).toBe('bn');
      expect(breadcrumbNames(seo!)).toEqual(['হোম', 'পাঠ', crumbBn]);
      const en = resolveRouteSeo(path, 'en')!;
      expect(en.title, path).not.toMatch(/best/i);
      expect(en.description, path).toContain('awaiting teacher review');
      expect(breadcrumbNames(en)).toEqual(['Home', 'Lessons', crumbEn]);
    }
  });
});


describe('brand-SEO wave 12: search-result length limits, all routes', () => {
  // Wave 5 closed the trim for the 37 guide blocks; wave 12 closed it
  // for every other route. This test enforces both, so a future copy
  // change can never silently push a title past 60 chars or a
  // description past 160 in either language. Path set mirrors the
  // wave-12 scan: sitemap URLs + job exam tabs + job subjects +
  // NU subjects + opportunity detail pages for published seeds.
  // /founder is included since Phase 2 (25 Nov 2026) — it resolves
  // in SeoHead data now, so its title/description must fit too.
  function allTrimPaths(): string[] {
    const paths = new Set<string>();
    for (const p of SITEMAP_URLS) {
      paths.add(p);
    }
    for (const exam of JOB_EXAMS) {
      paths.add(`/jobs/${exam.slug}`);
      for (const tab of JOB_TABS) paths.add(`/jobs/${exam.slug}/${tab.slug}`);
    }
    for (const { path } of allJobSubjectPaths()) paths.add(path);
    for (const p of allNuSubjectPaths()) paths.add(p);
    for (const seed of OPPORTUNITY_SEED) {
      if (isPublished(seed)) paths.add(`/opportunities/${seed.docId}`);
    }
    return [...paths];
  }

  it('every route resolves with title <= 60 and description <= 160, bn + en', () => {
    const paths = allTrimPaths();
    expect(paths.length).toBeGreaterThan(200);
    for (const path of paths) {
      for (const lang of ['bn', 'en'] as const) {
        const seo = resolveRouteSeo(path, lang);
        expect(seo, `no SEO for ${path} (${lang})`).not.toBeNull();
        expect(seo!.title.length, `${path} (${lang}) title ${seo!.title.length}: ${seo!.title}`).toBeLessThanOrEqual(
          60,
        );
        expect(seo!.description.length, `${path} (${lang}) desc ${seo!.description.length}: ${seo!.description}`).toBeLessThanOrEqual(
          160,
        );
      }
    }
  });
});

describe('SEO review (24 Nov 2026, owner order "SEO korco j sob review koro")', () => {
  it('WebSite JSON-LD carries no SearchAction (IMP-32)', () => {
    // Google deprecated the sitelinks search box (Nov 2024) and
    // /search is robots-disallowed + noindex by design — the markup
    // must not advertise a URL crawlers may not fetch.
    expect(WEBSITE_JSON_LD).not.toHaveProperty('potentialAction');
    expect(WEBSITE_JSON_LD['@type']).toBe('WebSite');
    expect(WEBSITE_JSON_LD.url).toBe(SITE_URL);
  });

  it('og:locale follows the page language, with the other as alternate (IMP-34)', () => {
    expect(ogLocaleForLang('bn')).toEqual({ locale: 'bn_BD', alternate: 'en_US' });
    expect(ogLocaleForLang('en')).toEqual({ locale: 'en_US', alternate: 'bn_BD' });
  });
});

describe('resolveRouteSeo — bilingual /:lang canonicals (Phase 1, 25 Nov 2026)', () => {
  it('canonicals are lang-prefixed; a /:lang prefix is the language source of truth', () => {
    const bn = resolveRouteSeo('/bn/jobs/bcs', 'bn')!;
    expect(bn.canonical).toBe('https://eduvelto.com/bn/jobs/bcs');
    const en = resolveRouteSeo('/en/jobs/bcs', 'bn')!;
    expect(en.canonical).toBe('https://eduvelto.com/en/jobs/bcs');
    expect(en.title).not.toMatch(/[\u0980-\u09FF]/);
    // Home in each language.
    expect(resolveRouteSeo('/bn', 'en')!.canonical).toBe('https://eduvelto.com/bn');
    expect(resolveRouteSeo('/en', 'bn')!.canonical).toBe('https://eduvelto.com/en');
  });

  it('/books (canonical library hub) resolves with its own library-hub SEO', () => {
    const seo = resolveRouteSeo('/bn/books', 'bn')!;
    expect(seo.canonical).toBe('https://eduvelto.com/bn/books');
    // /books has its OWN title since the 26 Nov 2026 Day 1 audit fix:
    // the sitemap lists both /books and /library, and titles must be
    // unique per URL — it no longer shares /library's title.
    expect(seo.title).toBe('সব বই — ডিজিটাল লাইব্রেরি | Eduvelto');
    expect(seo.title).not.toBe(resolveRouteSeo('/bn/library', 'bn')!.title);
    expect(seo.robots).toBeUndefined();
  });

  it('bare legacy paths still resolve, with the /bn canonical', () => {
    const seo = resolveRouteSeo('/jobs/bcs')!;
    expect(seo.canonical).toBe('https://eduvelto.com/bn/jobs/bcs');
    expect(resolveRouteSeo('/learn')!.canonical).toBe('https://eduvelto.com/bn/learn');
  });

  it('/founder resolves under /:lang with lang-prefixed canonicals', () => {
    expect(resolveRouteSeo('/bn/founder')!.canonical).toBe('https://eduvelto.com/bn/founder');
    expect(resolveRouteSeo('/en/founder')!.canonical).toBe('https://eduvelto.com/en/founder');
    expect(resolveFallbackSeo('/bn/founder')!.robots).toBe('noindex, nofollow');
  });

  it('fallback SEO on a lang-prefixed junk URL keeps the lang + noindex', () => {
    const fb = resolveFallbackSeo('/en/jobs/not-an-exam', 'en')!;
    expect(fb.canonical).toBe('https://eduvelto.com/en/');
    expect(fb.robots).toBe('noindex, nofollow');
  });
});

describe('bookSeoData (Phase 1, 25 Nov 2026)', () => {
  const book = {
    id: 'hons-211001',
    title: 'History and Culture of Bangladesh and Bengalees (From Ancients to 2000 AD)',
    subject: 'Bangla',
    classLevel: '1st Year',
    board: 'National University',
    program: 'Honours',
    paperCode: '211001',
    chapterCount: 3,
    questionCount: 26,
  };

  it('canonical is /{lang}/books/{doc id}; title is the book title, never translated', () => {
    const bn = bookSeoData(book, 'bn');
    expect(bn.canonical).toBe('https://eduvelto.com/bn/books/hons-211001');
    expect(bn.path).toBe('/books/hons-211001');
    expect(bn.title).toBe(`${book.title} | Eduvelto`);
    expect(bookSeoData(book, 'en').canonical).toBe('https://eduvelto.com/en/books/hons-211001');
  });

  it('emits Book + WebPage JSON-LD with only real fields', () => {
    const { jsonLd } = bookSeoData(book, 'bn');
    const types = (jsonLd as Array<Record<string, unknown>>).map((o) => o['@type']);
    expect(types).toContain('Book');
    expect(types).toContain('WebPage');
    const bookLd = (jsonLd as Array<Record<string, unknown>>).find((o) => o['@type'] === 'Book')!;
    expect(bookLd['name']).toBe(book.title);
    expect(bookLd['about']).toBe('Bangla');
  });

  it('omits counts it does not have — never invents them', () => {
    const bare = bookSeoData({ id: 'x-1', title: 'Bare Book' }, 'bn');
    expect(bare.description).not.toContain('Chapters');
    expect(bare.description).not.toContain('Questions');
    expect(bare.canonical).toBe('https://eduvelto.com/bn/books/x-1');
  });
});
