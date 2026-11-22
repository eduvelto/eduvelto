// Eduvelto — per-page SEO (21 Nov 2026 founder-profile hook; extended
// 22 Nov 2026 for site-wide route SEO, feature/seo-visibility).
//
// A tiny hook, no new dependency. Sets document.title, the meta
// description, Open Graph tags and the canonical link on route change,
// and injects JSON-LD script tags. Everything is removed on cleanup so
// no stale tags leak between routes. The static index.html keeps its
// existing home fallback title/meta.
//
// Structured data rules followed (Google's general guidelines): the
// JSON-LD describes only information that is visible on the page —
// never hidden or unpublished facts — and no rich-result appearance
// is guaranteed.
//
// HONESTY (22 Nov 2026, owner order: "Bangladesh number 1 education
// channel" search must find Eduvelto):
//  - No title/description here claims a verified "#1" rank. The
//    framing is "সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম" (best free platform) —
//    an ambition, backed by the real free offer — never "১ নম্বর" as
//    a fact. A unit test enforces this (see __tests__/seo.test.ts).
//  - Only routes that really exist are listed. Auth/admin/app routes
//    resolve to null and keep the static home fallback.
//  - Content language is always Bangla (owner rule 22 Nov 2026), so
//    titles/descriptions are Bangla-only; the language toggle changes
//    navigation tab labels only.

import { useEffect } from 'react';
import { JOB_TABS, jobExamBySlug } from './jobExams';

export type SeoData = {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  /** JSON-LD objects, injected as separate script tags. */
  jsonLd?: unknown[];
};

export const SITE_URL = 'https://eduvelto.com';
export const LOGO_URL = 'https://eduvelto.com/logo.png';

/** Shared Organization structured data (visible on every public page).
 *  sameAs is EMPTY by design — no Eduvelto social profiles exist yet
 *  (20 Nov 2026 package). The founder's personal profiles
 *  (facebook.com/ahmmmizan etc.) belong to the Person, not to the
 *  Organization, so they are NOT listed here. */
export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://eduvelto.com#organization',
  name: 'Eduvelto',
  alternateName: 'এডুভেল্টো',
  url: SITE_URL,
  logo: LOGO_URL,
  slogan: 'Learn • Grow • Achieve',
  description:
    'A Smarter World of Learning — a free digital education platform from Bangladesh, in Bangla and English, for students from Class 1 to Honours.',
  foundingDate: '2026',
  foundingLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressCountry: 'BD', addressLocality: "Cox's Bazar" },
  },
  founder: { '@id': 'https://eduvelto.com/founder#person' },
  sameAs: [] as string[],
};

/** Shared WebSite structured data. No SearchAction — the site has no
 *  site-wide search index (the home search box filters local lists). */
export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://eduvelto.com#website',
  name: 'Eduvelto',
  alternateName: 'এডুভেল্টো',
  url: SITE_URL,
  description: 'A Smarter World of Learning — a free digital education platform from Bangladesh.',
  inLanguage: ['bn', 'en'],
  publisher: { '@id': 'https://eduvelto.com#organization' },
};

function setMetaByName(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo(seo: SeoData): void {
  useEffect(() => {
    document.title = seo.title;
    setMetaByName('description', seo.description);
    setMetaByProperty('og:title', seo.title);
    setMetaByProperty('og:description', seo.description);
    setMetaByProperty('og:type', seo.ogType ?? 'website');
    setMetaByProperty('og:url', seo.canonical);
    if (seo.ogImage) setMetaByProperty('og:image', seo.ogImage);
    setCanonical(seo.canonical);

    const scripts: HTMLScriptElement[] = [];
    for (const obj of seo.jsonLd ?? []) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-seo', 'eduvelto');
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
      scripts.push(s);
    }
    return () => {
      for (const s of scripts) s.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seo.title, seo.canonical]);
}

// ---------------------------------------------------------------------------
// Route → SEO map (22 Nov 2026, feature/seo-visibility).
// Only public routes that really exist. Auth (/login, /register),
// admin (/admin, /ceo), dashboards and app-internal routes
// (/quiz/, /books/, /lessons/, /exam, /progress, /directory, …)
// resolve to null — they are disallowed in robots.txt and keep the
// static home fallback, so they never present themselves as content.
// /founder also resolves to null: FounderPage owns its SEO (Person +
// ProfilePage JSON-LD) and must not be overwritten.
// ---------------------------------------------------------------------------

type RouteSeoEntry = { title: string; description: string; crumb: string };

const STATIC_ROUTES: Record<string, RouteSeoEntry> = {
  '/': {
    title: 'Eduvelto — বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম Eduvelto — BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'হোম',
  },
  '/why-eduvelto': {
    title: 'কেন Eduvelto — বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'কেন Eduvelto বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম হতে চায় — ১০০% বিনামূল্যে BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি।',
    crumb: 'কেন Eduvelto',
  },
  '/jobs': {
    title: 'চাকরি প্রস্তুতি — BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA | Eduvelto',
    description:
      'BCS, ব্যাংক, প্রাথমিক শিক্ষক ও NTRCA পরীক্ষার বিনামূল্যে প্রস্তুতি — MCQ অনুশীলন, মক টেস্ট ও প্রশ্নব্যাংক। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'চাকরি প্রস্তুতি',
  },
  '/jobs/common': {
    title: 'কমন বিষয় — চাকরি প্রস্তুতি | Eduvelto',
    description:
      'চাকরি পরীক্ষার কমন বিষয় — বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের বিনামূল্যে MCQ অনুশীলন। Eduvelto।',
    crumb: 'কমন বিষয়',
  },
  '/admissions': {
    title: 'ভর্তি প্রস্তুতি — বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিনামূল্যে প্রস্তুতি — জাতীয় বিশ্ববিদ্যালয় অনার্সসহ MCQ অনুশীলন, মক টেস্ট ও ফলাফল। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'ভর্তি প্রস্তুতি',
  },
  '/admissions/national-university': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি — অনার্স ১ম বর্ষ | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় অনার্স ১ম বর্ষ ভর্তি পরীক্ষার বিনামূল্যে প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও গ্রুপভিত্তিক MCQ অনুশীলন। Eduvelto।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয়',
  },
  '/admissions/national-university/humanities': {
    title: 'মানবিক শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার মানবিক শাখার বিনামূল্যে প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও মানবিক গ্রুপের MCQ অনুশীলন। Eduvelto।',
    crumb: 'মানবিক শাখা',
  },
  '/admissions/national-university/science': {
    title: 'বিজ্ঞান শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিজ্ঞান শাখার বিনামূল্যে প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও বিজ্ঞান গ্রুপের MCQ অনুশীলন। Eduvelto।',
    crumb: 'বিজ্ঞান শাখা',
  },
  '/admissions/national-university/business': {
    title: 'ব্যবসায় শিক্ষা শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ব্যবসায় শিক্ষা শাখার বিনামূল্যে প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও ব্যবসায় গ্রুপের MCQ অনুশীলন। Eduvelto।',
    crumb: 'ব্যবসায় শিক্ষা শাখা',
  },
  '/library': {
    title: 'ডিজিটাল লাইব্রেরি — বিনামূল্যে বই ও প্রশ্নব্যাংক | Eduvelto',
    description:
      'Eduvelto ডিজিটাল লাইব্রেরি — শ্রেণি ও বিষয়ভিত্তিক বই, পাঠ ও প্রশ্নোত্তর — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'লাইব্রেরি',
  },
  '/class': {
    title: 'শ্রেণিভিত্তিক পড়াশোনা — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'শ্রেণি অনুযায়ী বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম।',
    crumb: 'শ্রেণি',
  },
  '/about': {
    title: 'Eduvelto সম্পর্কে — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম — পাঠ, পরীক্ষা, ডিজিটাল লাইব্রেরি ও স্মার্ট পড়ার পরিকল্পনা এক জায়গায়।',
    crumb: 'আমাদের সম্পর্কে',
  },
  '/contact': {
    title: 'যোগাযোগ — Eduvelto',
    description:
      'Eduvelto-র সঙ্গে যোগাযোগ করুন — ahmmizan23@gmail.com। বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম সম্পর্কে জানতে লিখুন।',
    crumb: 'যোগাযোগ',
  },
  '/privacy': {
    title: 'গোপনীয়তা নীতি — Eduvelto',
    description: 'Eduvelto-র গোপনীয়তা নীতি — আপনার তথ্য কীভাবে ব্যবহার হয়, তা জানুন।',
    crumb: 'গোপনীয়তা নীতি',
  },
  '/health': {
    title: 'স্বাস্থ্য — সচেতনতামূলক তথ্য | Eduvelto',
    description:
      'স্বাস্থ্য সচেতনতামূলক তথ্য — ঔষধ, রোগ, চিকিৎসক ও হাসপাতালের তথ্য। Eduvelto।',
    crumb: 'স্বাস্থ্য',
  },
  '/ai-teacher': {
    title: 'AI শিক্ষক — শীঘ্রই আসছে | Eduvelto',
    description:
      'Eduvelto-র ব্যক্তিগত AI শিক্ষক শীঘ্রই আসছে। আপাতত বিনামূল্যে MCQ পরীক্ষা, লাইব্রেরি ও চাকরি-ভর্তি প্রস্তুতি ব্যবহার করুন।',
    crumb: 'AI শিক্ষক',
  },
};

function jobExamEntry(slug: string, tab?: string): RouteSeoEntry | null {
  const exam = jobExamBySlug(slug);
  if (!exam) return null;
  // Tab suffix uses the verified Bangla tab name; an unknown tab slug
  // falls back to the plain exam title (never a raw English slug).
  const tabBn = tab ? JOB_TABS.find((t) => t.slug === tab)?.bn : undefined;
  const tabSuffix = tabBn ? ` — ${tabBn}` : '';
  return {
    title: `${exam.bn} প্রস্তুতি — ${exam.fullBn}${tabSuffix} | Eduvelto`,
    description: `${exam.fullBn} পরীক্ষার বিনামূল্যে প্রস্তুতি — MCQ অনুশীলন, মক টেস্ট ও ফলাফল বিশ্লেষণ। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: exam.bn,
  };
}

/** Breadcrumb names for a static path, by walking its prefixes. */
function crumbsForStatic(path: string): string[] {
  const segs = path.split('/').filter(Boolean);
  const out: string[] = [];
  let acc = '';
  for (const seg of segs) {
    acc += `/${seg}`;
    out.push(STATIC_ROUTES[acc]?.crumb ?? seg);
  }
  return out;
}

function breadcrumbFor(path: string, crumbs: string[]): unknown {
  const items: unknown[] = [
    { '@type': 'ListItem', position: 1, name: 'হোম', item: `${SITE_URL}/` },
  ];
  const parts = path.split('/').filter(Boolean);
  let acc = '';
  crumbs.forEach((name, i) => {
    acc += `/${parts[i] ?? ''}`;
    items.push({ '@type': 'ListItem', position: i + 2, name, item: `${SITE_URL}${acc}` });
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

/**
 * Resolve SEO for a pathname. Returns null for routes that must not
 * present themselves as indexed content (/founder owns its own SEO;
 * auth/admin/app routes are not content pages).
 */
export function resolveRouteSeo(pathname: string): SeoData | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/founder') return null;

  let entry: RouteSeoEntry | null = STATIC_ROUTES[path] ?? null;
  let crumbs: string[] = [];

  if (!entry) {
    // /jobs/:exam and /jobs/:exam/:tab (dynamic, from the real exam list).
    const jobMatch = path.match(/^\/jobs\/([^/]+)(?:\/([^/]+))?$/);
    if (jobMatch) {
      const tab = jobMatch[2];
      entry = jobExamEntry(jobMatch[1], tab);
      if (!entry) return null;
      crumbs = ['চাকরি প্রস্তুতি', entry.crumb];
      const tabBn = tab ? JOB_TABS.find((t) => t.slug === tab)?.bn : undefined;
      if (tabBn) crumbs.push(tabBn);
    }
  }
  if (!entry && path.startsWith('/admissions/national-university/')) {
    // Hub tabs (/admissions/national-university/:tab) and group subject
    // pages share the hub/group SEO — never a 404-style fallback title.
    const groupMatch = path.match(
      /^\/admissions\/national-university\/(humanities|science|business)(?:\/|$)/,
    );
    if (groupMatch) {
      entry = STATIC_ROUTES[`/admissions/national-university/${groupMatch[1]}`] ?? null;
      crumbs = ['ভর্তি প্রস্তুতি', 'জাতীয় বিশ্ববিদ্যালয়', entry?.crumb ?? groupMatch[1]];
    } else {
      entry = STATIC_ROUTES['/admissions/national-university'];
      crumbs = ['ভর্তি প্রস্তুতি', entry.crumb];
    }
  }
  if (!entry) return null;
  if (crumbs.length === 0) crumbs = crumbsForStatic(path);

  const canonical = `${SITE_URL}${path === '/' ? '/' : path}`;
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: entry.title,
    description: entry.description,
    inLanguage: ['bn'],
    isPartOf: { '@id': 'https://eduvelto.com#website' },
  };
  return {
    title: entry.title,
    description: entry.description,
    canonical,
    ogType: 'website',
    ogImage: LOGO_URL,
    jsonLd: [ORGANIZATION_JSON_LD, WEBSITE_JSON_LD, webPage, breadcrumbFor(path, crumbs)],
  };
}
