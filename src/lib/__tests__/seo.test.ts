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
 *
 * Runs under plain node: resolveRouteSeo is pure (jobExams.ts has no
 * imports). Run with `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveRouteSeo, ORGANIZATION_JSON_LD, SITE_URL } from '../seo';
import { jobPatternStatus } from '../jobExams';

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
  '/admissions',
  '/admissions/national-university',
  '/admissions/national-university/humanities',
  '/admissions/national-university/science',
  '/admissions/national-university/business',
  '/library',
  '/class',
  '/about',
  '/founder',
  '/contact',
  '/privacy',
  '/terms',
  '/health',
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
      expect(seo!.ogImage).toBe(`${SITE_URL}/logo.png`);
    }
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

  it('/terms resolves to the honest Terms entry (23 Nov 2026, Master Plan quick-wins)', () => {
    // /terms joined SITEMAP_URLS at merge prep (owner approved the
    // text 23 Nov 2026 06:57); sitemap.xml lists it too — the
    // sitemap-drift test enforces the two stay in sync.
    const seo = resolveRouteSeo('/terms');
    expect(seo).not.toBeNull();
    expect(seo!.title).toBe('শর্তাবলী — Eduvelto');
    expect(seo!.canonical).toBe(`${SITE_URL}/terms`);
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
