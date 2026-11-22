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
 *
 * Runs under plain node: resolveRouteSeo is pure (jobExams.ts has no
 * imports). Run with `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { resolveRouteSeo, SITE_URL } from '../seo';

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
    for (const slug of ['bcs', 'bank', 'primary-teacher', 'ntrca', 'dgfood']) {
      const seo = resolveRouteSeo(`/jobs/${slug}`);
      expect(seo, `/jobs/${slug}`).not.toBeNull();
      expect(seo!.title).not.toMatch(FORBIDDEN_RANK_CLAIM);
      expect(seo!.description).not.toMatch(FORBIDDEN_RANK_CLAIM);
    }
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
    expect(org['sameAs']).toEqual([]);
    const crumb = seo!.jsonLd![3] as Record<string, unknown>;
    const items = crumb['itemListElement'] as Array<Record<string, unknown>>;
    expect(items.map((i) => i['name'])).toEqual(['হোম', 'চাকরি প্রস্তুতি', 'বিসিএস']);
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
      '/skills',
      '/social',
    ]) {
      expect(resolveRouteSeo(path), path).toBeNull();
    }
  });
});
