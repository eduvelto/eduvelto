/**
 * Eduvelto SEO — route resolver unit tests (22 Nov 2026,
 * feature/seo-visibility).
 *
 * Guards the owner's order ("Bangladesh number 1 education channel"
 * search must find Eduvelto) WITHOUT letting a false claim slip in:
 *  (1) no title/description ever presents "#1" / "১ নম্বর" /
 *      "number 1" as a fact — the honest framing is "সেরা ফ্রি";
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
 *      title/description/canonical, and is null for /founder;
 *      resolveRouteSeo still returns null for unknown slugs.
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
  ORGANIZATION_JSON_LD,
  SITE_URL,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from '../seo';
import { JOB_EXAMS, jobExamBySlug, jobPatternStatus } from '../jobExams';
import { JOB_SUBJECTS, jobSubjectsForExam } from '../jobContent';
import { NU_SYLLABUS_COMMON_SLUGS, nuSyllabusSubjectBySlug } from '../nuSyllabus';
import { NU_GROUPS } from '../nuProfile';
import { CLASS_LEVELS } from '../classLevels';

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
  '/jobs/circulars',
  '/jobs/calendar',
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
  '/jobs/bcs/subjects/bangla',
  '/jobs/bcs/subjects/english',
  '/jobs/bcs/subjects/bangladesh-affairs',
  '/jobs/bcs/subjects/international-affairs',
  '/jobs/bcs/subjects/geography',
  '/jobs/bcs/subjects/general-science',
  '/jobs/bcs/subjects/computer-ict',
  '/jobs/bcs/subjects/mathematical-reasoning',
  '/jobs/bcs/subjects/mental-ability',
  '/jobs/bcs/subjects/ethics',
  '/jobs/bank/subjects/bangla',
  '/jobs/bank/subjects/english',
  '/jobs/bank/subjects/math',
  '/jobs/bank/subjects/general-knowledge',
  '/jobs/bank/subjects/computer',
  '/jobs/primary-teacher/subjects/bangla',
  '/jobs/primary-teacher/subjects/english',
  '/jobs/primary-teacher/subjects/math-science',
  '/jobs/primary-teacher/subjects/general-knowledge',
  '/jobs/ntrca/subjects/bangla',
  '/jobs/ntrca/subjects/english',
  '/jobs/ntrca/subjects/math',
  '/jobs/ntrca/subjects/general-knowledge',
  '/admissions',
  '/admissions/national-university',
  '/admissions/national-university/humanities',
  '/admissions/national-university/science',
  '/admissions/national-university/business',
  '/admissions/national-university/humanities/subjects/bangla',
  '/admissions/national-university/humanities/subjects/english',
  '/admissions/national-university/humanities/subjects/general-knowledge',
  '/admissions/national-university/science/subjects/bangla',
  '/admissions/national-university/science/subjects/english',
  '/admissions/national-university/science/subjects/general-knowledge',
  '/admissions/national-university/business/subjects/bangla',
  '/admissions/national-university/business/subjects/english',
  '/admissions/national-university/business/subjects/general-knowledge',
  '/library',
  '/class',
  '/class/class-1-5',
  '/class/class-6-8',
  '/class/class-9-10',
  '/class/hsc',
  '/class/honours-masters',
  '/about',
  '/founder',
  '/contact',
  '/privacy',
  '/health',
  '/health/medicines',
  '/health/diseases',
  '/health/doctors',
  '/health/hospitals',
  '/ai-teacher',
];

describe('resolveRouteSeo — public routes', () => {
  it('home targets the owner phrase without a false #1 claim', () => {
    const seo = resolveRouteSeo('/');
    expect(seo).not.toBeNull();
    expect(seo!.title).toContain('সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম');
    expect(seo!.description).toContain('BCS');
    expect(seo!.canonical).toBe(`${SITE_URL}/`);
  });

  it('every sitemap URL except /founder resolves to real SEO', () => {
    for (const path of SITEMAP_URLS) {
      if (path === '/founder') continue;
      const seo = resolveRouteSeo(path);
      expect(seo, `no SEO for sitemap URL ${path}`).not.toBeNull();
      expect(seo!.canonical).toBe(`${SITE_URL}${path === '/' ? '/' : path}`);
      expect(seo!.title.length).toBeGreaterThan(10);
      expect(seo!.description.length).toBeGreaterThan(40);
      expect(seo!.ogImage).toBe(`${SITE_URL}/og-image.jpg`);
    }
  });

  it('every sitemap title is unique', () => {
    const titles = new Map<string, string>();
    for (const path of SITEMAP_URLS) {
      if (path === '/founder') continue;
      const seo = resolveRouteSeo(path)!;
      expect(titles.has(seo.title), `duplicate title "${seo.title}" at ${path}`).toBe(false);
      titles.set(seo.title, path);
    }
    expect(titles.size).toBe(SITEMAP_URLS.length - 1);
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
    expect(bank.description).toContain('অযাচাইকৃত');
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
    // 'verified' (BCS, Primary Teacher) or 'last_verified' (NTRCA,
    // always with the "শেষ" qualifier). Anything else — Bank
    // (not_verified as a whole config), the circular-based exams,
    // IT (scope pending) — must not carry it.
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

  it('sitemap.xml lists exactly the SITEMAP_URLS (no drift)', () => {
    const xml = readFileSync(
      fileURLToPath(new URL('../../../public/sitemap.xml', import.meta.url)),
      'utf8',
    );
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = SITEMAP_URLS.map((p) => `${SITE_URL}${p === '/' ? '/' : p}`);
    expect(locs.sort()).toEqual(expected.sort());
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
      expect(seo!.title, path).toContain(subject.nameBn);
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

  it('all 5 class pages resolve and their slugs match CLASS_LEVELS exactly', () => {
    expect(CLASS_LEVELS.length).toBe(5);
    const sitemapClassSlugs = SITEMAP_URLS.filter((p) => p.startsWith('/class/')).map((p) =>
      p.replace('/class/', ''),
    );
    expect(sitemapClassSlugs.sort()).toEqual(CLASS_LEVELS.map((c) => c.slug).sort());
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

  it('resolveFallbackSeo noindexes junk URLs with the home canonical, never /founder', () => {
    const home = resolveRouteSeo('/')!;
    const junk = resolveFallbackSeo('/jobs/primary');
    expect(junk).not.toBeNull();
    expect(junk!.robots).toBe('noindex, nofollow');
    expect(junk!.canonical).toBe(`${SITE_URL}/`);
    expect(junk!.title).toBe(home.title);
    expect(junk!.description).toBe(home.description);
    expect(resolveFallbackSeo('/founder')).toBeNull();
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
      expect(block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1], loc).toBe('2026-11-23');
    }
  });

  it('forbidden-claim sweep over every sitemap URL + all 23 job + 9 NU subject pages', () => {
    const swept = new Set([
      ...SITEMAP_URLS.filter((p) => p !== '/founder'),
      ...allJobSubjectPaths().map((p) => p.path),
      ...allNuSubjectPaths(),
    ]);
    // Every subject page is already in the sitemap — the sweep covers
    // exactly the sitemap minus /founder, no more, no less.
    expect(swept.size).toBe(SITEMAP_URLS.length - 1);
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

  it('/jobs emits an ItemList of exactly the 14 exam hubs; /jobs/bcs does not', () => {
    expect(JOB_EXAMS.length).toBe(14);
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
    expect(items.length).toBe(14);
    expect(items.map((i) => i['url'])).toEqual(
      JOB_EXAMS.map((e) => `${SITE_URL}/jobs/${e.slug}`),
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
  it('founder is owned by FounderPage', () => {
    expect(resolveRouteSeo('/founder')).toBeNull();
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
    for (const path of [
      '/exam',
      '/routine',
      '/progress',
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
