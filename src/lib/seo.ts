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
// channel" search must find Eduvelto; REVISED 24 Nov 2026, brand-SEO
// wave 1, F-01 — the "সেরা" framing was itself quoted back by
// Google's AI Overview as self-promotion, so it is gone):
//  - No title/description here claims "সেরা" (best), "best", or a
//    verified "#1" rank. The homepage title/description state plainly
//    what Eduvelto is — a free Bangladeshi education and life-services
//    platform. /why-eduvelto keeps its ambition only as an explicit
//    goal ("আমাদের লক্ষ্য — …আস্থার প্ল্যাটফর্ম হওয়া"), never as a
//    rank. A unit test enforces this (see __tests__/seo.test.ts).
//  - Only routes that really exist are listed. Auth/admin/app routes
//    resolve to null and keep the static home fallback.
//  - Content language is always Bangla (owner rule 22 Nov 2026), so
//    titles/descriptions are Bangla-only; the language toggle changes
//    navigation tab labels only.
//  - Founder name in structured data (owner 22 Nov 18:24): the
//    Organization JSON-LD names Ali Hasan Mohammed Mizan, Founder &
//    CEO (the Person on /founder carries the full profile incl. the
//    approved DOB). No private detail (no DOB, address, phone) in the
//    homepage JSON-LD.
//  - Plans in SEO (owner 22 Nov 18:24): copy reflects the plans
//    running NOW (Job Preparation + University Admission, NU first).
//    Future plans enter the SEO only when they launch — never
//    described as live before then. Adding a plan = one STATIC_ROUTES
//    (or jobExamEntry) record + one sitemap <url> + one test line.

import { useEffect } from 'react';
import { JOB_EXAMS, JOB_TABS, jobExamBySlug, jobPatternStatus, jobRulesConfig } from './jobExams';
import { jobSubjectById } from './jobContent';
import { nuSyllabusSubjectBySlug } from './nuSyllabus';
import { NU_GROUPS } from './nuProfile';
import { OPPORTUNITY_SEED } from './opportunitySeed';
import { isPublished } from './opportunities';
import { PUBLIC_GUIDES } from './publicGuides';

export type SeoData = {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  /** 'noindex, nofollow' — only for pages that must not be indexed
   *  (unknown slugs, login-gated/empty states). Absent = indexable. */
  robots?: string;
  /** JSON-LD objects, injected as separate script tags. */
  jsonLd?: unknown[];
};

export const SITE_URL = 'https://eduvelto.com';
export const LOGO_URL = 'https://eduvelto.com/logo.png';
/** Purpose-built 1200x630 social preview image (23 Nov 2026,
 *  feature/seo-50-100-pages, SEO-009): navy + approved white logo +
 *  Bangla tagline + eduvelto.com. Replaces logo.png (2729x912,
 *  386 KB, no dimensions) as the og:image / twitter:image. The
 *  Organization logo stays LOGO_URL. */
export const OG_IMAGE_URL = 'https://eduvelto.com/og-image.jpg';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Shared Organization structured data (visible on every public page).
 *  sameAs lists the Eduvelto organization's own profiles ONLY:
 *  YouTube @EduveltoBD (created 22 Nov 2026), LinkedIn
 *  linkedin.com/company/eduvelto (created by the owner 22 Nov 2026),
 *  and Facebook facebook.com/EduveltoBD (verified to exist
 *  22 Nov 2026). The founder's personal profiles
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
    'A Smarter World of Learning — a free Bangladeshi digital education and life services platform: a digital library, job and admission preparation with MCQ practice, career guidance and everyday life services, for students from Class 9 to Honours (SSC, HSC and Honours, plus Madrasa and Technical streams).',
  foundingDate: '2026',
  foundingLocation: {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressCountry: 'BD', addressLocality: "Cox's Bazar" },
  },
  founder: {
    '@type': 'Person',
    '@id': 'https://eduvelto.com/founder#person',
    name: 'Ali Hasan Mohammed Mizan',
    jobTitle: 'Founder & CEO',
  },
  areaServed: { '@type': 'Country', name: 'Bangladesh' },
  knowsAbout: [
    'Free education in Bangladesh',
    'BCS preparation',
    'Bank job preparation',
    'Primary teacher recruitment preparation',
    'NTRCA teacher registration preparation',
    'National University admission preparation',
  ],
  sameAs: [
    'https://www.youtube.com/@EduveltoBD',
    'https://www.linkedin.com/company/eduvelto',
    'https://www.facebook.com/EduveltoBD',
  ],
};

/** Shared WebSite structured data. SearchAction added 24 Nov 2026
 * (homepage redesign): /search is now a real site-wide search over
 * books, jobs, opportunities, life services and guide pages, so the
 * search-box target is real. /search itself stays noindex (no
 * STATIC_ROUTES entry; robots.txt disallows it). */
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
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://eduvelto.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
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

function removeMetaByName(name: string): void {
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.remove();
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
    if (seo.ogImage) {
      setMetaByProperty('og:image', seo.ogImage);
      setMetaByProperty('og:image:width', String(OG_IMAGE_WIDTH));
      setMetaByProperty('og:image:height', String(OG_IMAGE_HEIGHT));
    }
    // Twitter cards were static home values before (23 Nov 2026):
    // on route change they stayed stale. Set them per route now.
    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', seo.title);
    setMetaByName('twitter:description', seo.description);
    if (seo.ogImage) setMetaByName('twitter:image', seo.ogImage);
    // Robots: set when the page must not be indexed; REMOVE on
    // route change when the next page is indexable — a stale
    // noindex leaking onto a real page would hide it from Google.
    if (seo.robots) setMetaByName('robots', seo.robots);
    else removeMetaByName('robots');
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
    title: 'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা ও জীবনসেবা প্ল্যাটফর্ম: BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'হোম',
  },
  '/why-eduvelto': {
    title: 'কেন Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'কেন Eduvelto — বাংলাদেশের আস্থার ফ্রি শিক্ষা প্ল্যাটফর্ম: BCS, ব্যাংক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — বিনামূল্যে।',
    crumb: 'কেন Eduvelto',
  },
  '/jobs': {
    title: 'চাকরি প্রস্তুতি — BCS, ব্যাংক, NTRCA | Eduvelto',
    description:
      'BCS, ব্যাংক ও NTRCA প্রস্তুতির কাঠামো — ধরন, সিলেবাস ও বিষয়ভিত্তিক প্রস্তুতি। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'চাকরি প্রস্তুতি',
  },
  '/jobs/common': {
    title: 'কমন বিষয় — চাকরি প্রস্তুতি | Eduvelto',
    description:
      'চাকরি পরীক্ষার কমন বিষয় — বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের প্রস্তুতির কাঠামো। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'কমন বিষয়',
  },
  '/jobs/circulars': {
    title: 'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার | Eduvelto',
    description:
      'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার, আবেদনের তারিখ ও অফিসিয়াল উৎস। নতুন বিজ্ঞপ্তি যাচাই হলে এখানে দেখাবে; অযাচাইকৃত তারিখ কখনো দেখানো হয় না।',
    crumb: 'বিজ্ঞপ্তি',
  },
  '/opportunities': {
    title: 'সুযোগ হাব — যাচাইকৃত চাকরি, স্কলারশিপ | Eduvelto',
    description:
      'যাচাইকৃত সুযোগ — চাকরি, ফ্রিল্যান্সিং, ইন্টার্নশিপ, স্কলারশিপ। প্রতিটি সুযোগ অফিসিয়াল উৎস থেকে যাচাই করা; শেষ তারিখ না জানা থাকলে অনুমান করা হয় না।',
    crumb: 'সুযোগ হাব',
  },
  '/opportunities/cv-builder': {
    title: 'সিভি ও কভার লেটার তৈরি — ফ্রি টুল | Eduvelto',
    description:
      'ফরম পূরণ করে প্রিন্ট করার মতো সিভি ও কভার লেটার তৈরি করুন — সম্পূর্ণ ফ্রি, আপনার তথ্য ব্রাউজারের বাইরে যায় না, কোথাও সংরক্ষণ হয় না। Eduvelto।',
    crumb: 'সিভি তৈরি',
  },
  '/opportunities/interview-prep': {
    title: 'ইন্টারভিউ প্রস্তুতি — সাধারণ প্রশ্ন ও STAR পদ্ধতি | Eduvelto',
    description:
      'ইন্টারভিউ প্রস্তুতির সাধারণ নির্দেশনা — আগের প্রস্তুতি, সাধারণ প্রশ্ন, STAR পদ্ধতিতে উত্তর ও ইন্টারভিউর দিনের চেকলিস্ট। কোনো চাকরির নিশ্চয়তা নয়। Eduvelto।',
    crumb: 'ইন্টারভিউ প্রস্তুতি',
  },
  '/opportunities/career-guidance': {
    title: 'ক্যারিয়ার গাইড — পেশা বেছে নেওয়া ও দক্ষতার পথ | Eduvelto',
    description:
      'ক্যারিয়ার গাইড — পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিংয়ের সৎ তুলনা। সাধারণ নির্দেশনা, কোনো অফিসিয়াল সিলেবাস নয়। Eduvelto।',
    crumb: 'ক্যারিয়ার গাইড',
  },
  '/opportunities/entrepreneurship': {
    title: 'উদ্যোক্তা গাইড — আইডিয়া যাচাই ও হিসাব রাখা | Eduvelto',
    description:
      'উদ্যোক্তা গাইড — আইডিয়া যাচাই, ছোট করে শুরু, লাভ-ক্ষতির হিসাব ও অনলাইনে সৎভাবে বিক্রি। সাধারণ নির্দেশনা, আয়ের কোনো প্রতিশ্রুতি নয়। Eduvelto।',
    crumb: 'উদ্যোক্তা গাইড',
  },
  '/opportunities/income': {
    title: 'বৈধ অনলাইন আয় — বাস্তব পথ ও প্রতারণা চেনা | Eduvelto',
    description:
      'বৈধ অনলাইন আয় — ফ্রিল্যান্সিং, ডিজিটাল পণ্য, কনটেন্ট ও অ্যাফিলিয়েটের বাস্তব চিত্র, প্রতারণা চেনার উপায় ও শুরুর ধাপ। আয়ের কোনো প্রতিশ্রুতি নয়। Eduvelto।',
    crumb: 'বৈধ অনলাইন আয়',
  },
  '/jobs/calendar': {
    title: 'চাকরির ক্যালেন্ডার — বিজ্ঞপ্তি ও পরীক্ষার তারিখ | Eduvelto',
    description:
      'যাচাইকৃত বিজ্ঞপ্তি ও মক পরীক্ষার তারিখের ক্যালেন্ডার — নিশ্চিত তারিখ এলে এখানে দেখাবে; অনুমান করা তারিখ কখনো দেখানো হয় না। Eduvelto।',
    crumb: 'ক্যালেন্ডার',
  },
  // Added 24 Nov 2026 (homepage redesign): the three Step 16 job
  // guides are real public pages on main, so they join the sitemap.
  '/jobs/viva': {
    title: 'ভাইভা প্রস্তুতি — চাকরির ভাইভার নির্দেশিকা | Eduvelto',
    description:
      'চাকরির ভাইভা প্রস্তুতির নির্দেশিকা — সাধারণ প্রশ্ন, নিজের পরিচয়, শরীরী ভাষা ও ভাইভার দিনের চেকলিস্ট। সাধারণ নির্দেশনা, কোনো চাকরির নিশ্চয়তা নয়। Eduvelto।',
    crumb: 'ভাইভা প্রস্তুতি',
  },
  '/jobs/career': {
    title: 'ক্যারিয়ার পরিকল্পনা — চাকরির পথ বেছে নেওয়া | Eduvelto',
    description:
      'ক্যারিয়ার পরিকল্পনা — পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিংয়ের সৎ তুলনা। সাধারণ নির্দেশনা, কোনো অফিসিয়াল সিলেবাস নয়। Eduvelto।',
    crumb: 'ক্যারিয়ার গাইড',
  },
  '/jobs/cv': {
    title: 'সিভি লেখা — চাকরির সিভির নির্দেশিকা | Eduvelto',
    description:
      'চাকরির সিভি লেখার নির্দেশিকা — কী লিখবেন, কী লিখবেন না, নমুনা কাঠামো। সাধারণ নির্দেশনা; আপনার তথ্য ব্রাউজারের বাইরে যায় না। Eduvelto।',
    crumb: 'সিভি লেখা',
  },
  '/install': {
    title: 'Eduvelto অ্যাপ ইনস্টল করুন — ফোনে পড়ুন | Eduvelto',
    description:
      'Eduvelto অ্যাপ ইনস্টল ও আপডেট করুন — ফোনের হোম স্ক্রিন থেকে সরাসরি পড়ুন। অনলাইন-ভিত্তিক; অফলাইন পড়া সমর্থিত নয়। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'অ্যাপ ইনস্টল',
  },
  '/admissions': {
    title: 'ভর্তি প্রস্তুতি — বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'বিশ্ববিদ্যালয় ভর্তি প্রস্তুতির কাঠামো — জাতীয় বিশ্ববিদ্যালয় অনার্সসহ ধরন ও সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'ভর্তি প্রস্তুতি',
  },
  '/admissions/national-university': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি — অনার্স ১ম বর্ষ | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় অনার্স ১ম বর্ষ ভর্তি — ১০০ MCQ, ১ ঘণ্টা, নেগেটিভ মার্কিং নেই। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয়',
  },
  '/admissions/national-university/humanities': {
    title: 'মানবিক শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তির মানবিক শাখা — বাংলা, ইংরেজি ও মানবিক সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'মানবিক শাখা',
  },
  '/admissions/national-university/science': {
    title: 'বিজ্ঞান শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তির বিজ্ঞান শাখা — বাংলা, ইংরেজি ও বিজ্ঞান সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'বিজ্ঞান শাখা',
  },
  '/admissions/national-university/business': {
    title: 'ব্যবসায় শিক্ষা — জাতীয় বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তির ব্যবসায় শিক্ষা শাখা — বাংলা, ইংরেজি ও ব্যবসায় সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
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
  // Class level pages (23 Nov 2026, feature/seo-50-100-pages). Slugs
  // and names mirror CLASS_LEVELS in lib/classLevels.ts (cross-checked
  // by unit test). HONESTY: Class 1–5 and Class 6–8 have NO books in
  // the library yet — their descriptions say so plainly instead of
  // implying content exists.
  '/class/class-1-5': {
    title: 'শ্রেণি ১–৫ — প্রাথমিক | Eduvelto',
    description:
      'শ্রেণি ১–৫ (প্রাথমিক) — বই, পাঠ ও পরীক্ষা এখনো লাইব্রেরিতে আসেনি, আসছে। Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম।',
    crumb: 'শ্রেণি ১–৫',
  },
  '/class/class-6-8': {
    title: 'শ্রেণি ৬–৮ — নিম্ন মাধ্যমিক | Eduvelto',
    description:
      'শ্রেণি ৬–৮ (নিম্ন মাধ্যমিক) — বই, পাঠ ও পরীক্ষা এখনো লাইব্রেরিতে আসেনি, আসছে। Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম।',
    crumb: 'শ্রেণি ৬–৮',
  },
  '/class/class-9-10': {
    title: 'শ্রেণি ৯–১০ (SSC) — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'শ্রেণি ৯–১০ (মাধ্যমিক, SSC) — শ্রেণিভিত্তিক বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'শ্রেণি ৯–১০',
  },
  '/class/hsc': {
    title: 'HSC — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'HSC (উচ্চ মাধ্যমিক) — শ্রেণিভিত্তিক বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'HSC',
  },
  '/class/honours-masters': {
    title: 'অনার্স ও মাস্টার্স — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'অনার্স ও মাস্টার্স (উচ্চশিক্ষা) — শ্রেণিভিত্তিক বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'অনার্স ও মাস্টার্স',
  },
  '/about': {
    title: 'Eduvelto সম্পর্কে — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম — পাঠ, পরীক্ষা ও ডিজিটাল লাইব্রেরি এক জায়গায়।',
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
  // APPROVED by the owner 23 Nov 2026 06:57 ("onomoti dilam"), after a
  // full parent check of the text for mistakes (none found). /terms
  // joins the sitemap at merge time (added to sitemap.xml +
  // SITEMAP_URLS in the same commit).
  '/terms': {
    title: 'শর্তাবলী — Eduvelto',
    description:
      'Eduvelto-র শর্তাবলী — সম্পূর্ণ বিনামূল্যের শিক্ষা প্ল্যাটফর্ম ব্যবহারের নিয়ম, অ্যাকাউন্ট ও লগইন, আর গোপনীয়তা।',
    crumb: 'শর্তাবলী',
  },
  // Trust pages (24 Nov 2026, brand-SEO wave 1, F-08): the four
  // policy pages Google expects — editorial policy, content
  // accuracy, certificate policy (plain: no certificates of any
  // kind) and disclaimer. Each has a real page + footer link.
  '/editorial-policy': {
    title: 'সম্পাদকীয় নীতি | Eduvelto',
    description:
      'Eduvelto-র বিষয়বস্তু কীভাবে তৈরি, যাচাই ও সংশোধন করা হয় — তার নীতি।',
    crumb: 'সম্পাদকীয় নীতি',
  },
  '/content-accuracy': {
    title: 'বিষয়বস্তুর নির্ভুলতা নীতি | Eduvelto',
    description:
      'Eduvelto-র তথ্য কতটা নির্ভরযোগ্য, "যাচাইকৃত" মানে কী এবং গুরুত্বপূর্ণ তারিখ ও ফি কোথায় যাচাই করবেন।',
    crumb: 'বিষয়বস্তুর নির্ভুলতা',
  },
  '/certificate-policy': {
    title: 'সার্টিফিকেট নীতি | Eduvelto',
    description:
      'Eduvelto কোনো সার্টিফিকেট দেয় না — অনুশীলন পরীক্ষার নম্বর শুধু নিজের মূল্যায়নের জন্য।',
    crumb: 'সার্টিফিকেট নীতি',
  },
  '/disclaimer': {
    title: 'দায়বর্জন | Eduvelto',
    description:
      'Eduvelto-র তথ্য শুধু শিক্ষামূলক — এটি পেশাদার পরামর্শ নয়। গুরুত্বপূর্ণ তথ্য অফিসিয়াল উৎস থেকে যাচাই করুন।',
    crumb: 'দায়বর্জন',
  },
  '/health': {
    title: 'স্বাস্থ্য — সচেতনতামূলক তথ্য | Eduvelto',
    description:
      'স্বাস্থ্য সচেতনতামূলক তথ্য — ঔষধ, রোগ ও হাসপাতালের তথ্য। Eduvelto।',
    crumb: 'স্বাস্থ্য',
  },
  '/health/medicines': {
    title: 'ঔষধ নির্দেশিকা — ব্যবহার ও সতর্কতা | Eduvelto',
    description:
      'সাধারণ ঔষধের ব্যবহার, ধরন, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা — শুধুমাত্র যাচাইকৃত উৎস থেকে। এখানে কোনো ডোজ দেওয়া হয় না; ডোজ শুধু ডাক্তারের পরামর্শে।',
    crumb: 'ঔষধ নির্দেশিকা',
  },
  '/health/diseases': {
    title: 'রোগের তথ্য — লক্ষণ ও প্রতিরোধ | Eduvelto',
    description:
      'সাধারণ রোগের লক্ষণ, প্রতিরোধ ও কখন ডাক্তার দেখাবেন — সাধারণ তথ্য, রোগ নির্ণয় নয়। Eduvelto।',
    crumb: 'রোগের তথ্য',
  },
  '/health/doctors': {
    title: 'ডাক্তার নির্দেশিকা — যাচাইকৃত ডাক্তার | Eduvelto',
    description:
      'যাচাইকৃত ডাক্তারদের তালিকা — এখনো কেউ তালিকাভুক্ত হয়নি; ডাক্তার যাচাই হলে এখানে দেখা যাবে। যাচাই ছাড়া কেউ "ভেরিফায়েড" হিসেবে দেখানো হয় না। Eduvelto।',
    crumb: 'ডাক্তার নির্দেশিকা',
  },
  '/health/hospitals': {
    title: 'হাসপাতাল ও ফার্মেসি — তথ্য | Eduvelto',
    description:
      'হাসপাতাল ও ফার্মেসির তথ্য — ঠিকানা ও যোগাযোগ। Eduvelto।',
    crumb: 'হাসপাতাল ও ফার্মেসি',
  },
  // Everyday Life Services (§3C, 23 Nov 2026): public tools, no login.
  // Personal entries (budget, planner) stay in the browser's
  // localStorage only — nothing is sent to a server.
  '/life': {
    // Title/description tightened 24 Nov 2026 (SEO pass): the old
    // title (68 chars) and description (180 chars) truncated in
    // search results; same meaning, shorter wording.
    title: 'দৈনন্দিন জীবন সেবা — বাজেট, ক্যালকুলেটর ও গাইড | Eduvelto',
    description:
      'প্রতিদিনের বিনামূল্যের টুল — বাজেট, EMI ও সুদের হিসাব, মুদ্রা ও একক রূপান্তর, প্ল্যানার, PDF টুলস, স্বাস্থ্য ও সরকারি সেবার গাইড। Eduvelto।',
    crumb: 'জীবন সেবা',
  },
  '/life/budget': {
    title: 'বাজেট প্ল্যানার — আয়-ব্যয়ের হিসাব | Eduvelto',
    description:
      'মাসিক আয়-ব্যয়ের হিসাব রাখুন — বাসা ভাড়া, খাবার, যাতায়াত, পড়াশোনা ও স্বাস্থ্য খরচের হিসাব, সঞ্চয়ের লক্ষ্য। আপনার তথ্য শুধু আপনার ডিভাইসেই থাকে। Eduvelto।',
    crumb: 'বাজেট প্ল্যানার',
  },
  '/life/calculators': {
    title: 'ক্যালকুলেটর — EMI, সুদ, শতাংশ, বয়স ও BMI | Eduvelto',
    description:
      'EMI, সরল ও চক্রবৃদ্ধি সুদ, শতাংশ, বয়স ও BMI ক্যালকুলেটর — সূত্রসহ ফলাফল, সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'ক্যালকুলেটর',
  },
  '/life/converters': {
    title: 'কনভার্টার — মুদ্রা ও একক রূপান্তর | Eduvelto',
    description:
      'মুদ্রা রূপান্তর (নির্দেশক হার) ও একক রূপান্তর — দৈর্ঘ্য, ওজন, তাপমাত্রা, আয়তন, ক্ষেত্রফল, মণ-সের-তোলা-কাঠা-বিঘা সহ। Eduvelto।',
    crumb: 'কনভার্টার',
  },
  '/life/planner': {
    title: 'দৈনিক প্ল্যানার — পড়াশোনা ও কাজের পরিকল্পনা | Eduvelto',
    description:
      'দিনের কাজ সাজান — পড়াশোনা, কাজ ও ব্যক্তিগত কাজের তালিকা, আজকের কাজ ও আগামী কাজ। আপনার তালিকা শুধু আপনার ডিভাইসেই থাকে। Eduvelto।',
    crumb: 'দৈনিক প্ল্যানার',
  },
  '/life/pdf-tools': {
    title: 'PDF টুলস — টেক্সট থেকে PDF ও PDF মার্জ | Eduvelto',
    description:
      'ব্রাউজারেই PDF তৈরি করুন — লেখা থেকে PDF, একাধিক PDF একসাথে মার্জ করুন। আপনার ফাইল ডিভাইস ছাড়ে না। Eduvelto।',
    crumb: 'PDF টুলস',
  },
  '/life/health': {
    title: 'স্বাস্থ্য সচেতনতা — খাবার, ব্যায়াম ও ঘুম | Eduvelto',
    description:
      'স্বাস্থ্য সচেতনতামূলক সাধারণ তথ্য — সুষম খাবার, শারীরিক পরিশ্রম, ঘুম ও হাত ধোয়া, কখন ডাক্তার দেখাবেন। সাধারণ তথ্য, চিকিৎসকের বিকল্প নয়। Eduvelto।',
    crumb: 'স্বাস্থ্য সচেতনতা',
  },
  '/life/government': {
    title: 'সরকারি সেবা গাইড — NID, পাসপোর্ট, জন্ম নিবন্ধন | Eduvelto',
    description:
      'জাতীয় পরিচয়পত্র, ই-পাসপোর্ট, জন্ম নিবন্ধন ও ড্রাইভিং লাইসেন্স — আবেদনের ধাপ, প্রয়োজনীয় কাগজপত্র ও অফিসিয়াল পোর্টালের লিংক। Eduvelto।',
    crumb: 'সরকারি সেবা',
  },
  '/life/travel': {
    title: 'ভ্রমণ তথ্য — জরুরি নম্বর ও দৈনন্দিন প্রয়োজন | Eduvelto',
    description:
      'জরুরি নম্বর ৯৯৯ সহ প্রয়োজনীয় যোগাযোগ, জরুরি অবস্থায় করণীয়, ট্রেন-বিমান-বাস ভ্রমণের তথ্য ও ভ্রমণের আগের চেকলিস্ট। Eduvelto।',
    crumb: 'ভ্রমণ তথ্য',
  },
  '/life/services': {
    title: 'সেবা নির্দেশিকা — প্রয়োজনীয় সেবা খুঁজুন | Eduvelto',
    description:
      'সরকারি সেবা, স্বাস্থ্য, শিক্ষা, চাকরি, অর্থ, ভ্রমণ ও দৈনন্দিন প্রয়োজন — অফিসিয়াল পোর্টাল ও Eduvelto-র টুল এক জায়গায়। Eduvelto।',
    crumb: 'সেবা নির্দেশিকা',
  },
  '/ai-teacher': {
    title: 'AI শিক্ষক — শীঘ্রই আসছে | Eduvelto',
    description:
      'Eduvelto-র ব্যক্তিগত AI শিক্ষক শীঘ্রই আসছে। আপাতত বিনামূল্যে MCQ পরীক্ষা, লাইব্রেরি ও চাকরি-ভর্তি প্রস্তুতি ব্যবহার করুন।',
    crumb: 'AI শিক্ষক',
  },
  '/ai-assistant': {
    title: 'AI সহায়ক — হিসাব, চিঠি ও দরকারি টুল | Eduvelto',
    description:
      'Eduvelto-র AI সহায়ক — হিসাব, রূপান্তর, বাজেট, দিনের পরিকল্পনা, চিঠি-আবেদন-সিভি ও দরকারি বাক্য — এখনই বিনামূল্যে ব্যবহার করুন। লাইভ AI উত্তর শীঘ্রই আসছে।',
    crumb: 'AI সহায়ক',
  },
  '/skills': {
    title: 'পেশাগত দক্ষতা — শীঘ্রই আসছে | Eduvelto',
    description:
      'Eduvelto-র পেশাগত দক্ষতা বিভাগ শীঘ্রই আসছে। আপাতত চাকরি ও ভর্তি প্রস্তুতি ব্যবহার করুন — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'পেশাগত দক্ষতা',
  },
  // BCS English practice + lessons (23 Nov 2026, AdSense Part 1):
  // the first live practice on the site — ৩৫টি যাচাইকৃত প্রশ্ন
  // (hub copy) — and the first two public BCS English lessons.
  // These stay INDEXABLE (no robots flag): they have real content,
  // unlike the other subject pages. Per-section question counts
  // are NOT claimed here — only the hub's verified total of ৩৫.
  // Full mocks are still in preparation — the hub says so plainly.
  '/jobs/bcs/practice/english': {
    title: 'বিসিএস ইংরেজি অনুশীলন — ৩৫টি যাচাইকৃত প্রশ্ন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলন — ৩৫টি যাচাইকৃত প্রশ্ন: ব্যাকরণ, শব্দভান্ডার ও রিডিং — সম্পূর্ণ বিনামূল্যে। পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto।',
    crumb: 'ইংরেজি',
  },
  '/jobs/bcs/practice/english/grammar': {
    title: 'বিসিএস ইংরেজি ব্যাকরণ অনুশীলন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলনের ব্যাকরণ অংশ — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন। Eduvelto।',
    crumb: 'ব্যাকরণ',
  },
  '/jobs/bcs/practice/english/vocabulary': {
    title: 'বিসিএস ইংরেজি শব্দভান্ডার অনুশীলন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলনের শব্দভান্ডার অংশ — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন। Eduvelto।',
    crumb: 'শব্দভান্ডার',
  },
  '/jobs/bcs/practice/english/reading': {
    title: 'বিসিএস ইংরেজি রিডিং অনুশীলন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলনের রিডিং অংশ — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন। Eduvelto।',
    crumb: 'রিডিং',
  },
  '/learn/bcs-english-tense': {
    title: 'বিসিএস ইংরেজি টেন্স — পাঠ | Eduvelto',
    description:
      'বিসিএস ইংরেজি প্রস্তুতির জন্য টেন্সের খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়। সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'টেন্স',
  },
  '/learn/bcs-english-preposition': {
    title: 'বিসিএস ইংরেজি প্রিপোজিশন — পাঠ | Eduvelto',
    description:
      'বিসিএস ইংরেজি প্রস্তুতির জন্য প্রিপোজিশনের খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়। সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'প্রিপোজিশন',
  },
  // AdSense Part 1 (integration): /learn hub — the breadcrumb target
  // for the two lesson pages. REVISED 24 Nov 2026 (brand-SEO wave 1):
  // the hub now also lists the 10 public guides, so the title/crumb
  // cover guides + lessons (the lesson breadcrumbs pinned by
  // seo.test.ts still start with 'বিসিএস ইংরেজি' via STATIC_CRUMBS).
  '/learn': {
    title: 'পাঠ ও গাইড — ফ্রি প্রস্তুতি | Eduvelto',
    description:
      'ফ্রি পাঠ ও গাইড — BCS, ব্যাংক, NTRCA, ভর্তি, ব্যাকরণ, বৃত্তি, CV ও বাজেট। খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়; বিসিএস ইংরেজি — ৩৫টি যাচাইকৃত প্রশ্ন।',
    crumb: 'পাঠ',
  },
  // Public guides (24 Nov 2026, brand-SEO wave 1): 10 original
  // static guides, no login, zero Firestore reads (see
  // src/lib/publicGuides.ts). Every guide is a draft awaiting
  // teacher review — the description says so plainly, like the two
  // BCS English lessons above; never "যাচাইকৃত"/"অনুমোদিত".
  '/learn/bcs-preparation-guide': {
    title: 'বিসিএস প্রিলিমিনারি প্রস্তুতি গাইড | Eduvelto',
    description:
      'বিসিএস প্রিলিমিনারি প্রস্তুতি কীভাবে শুরু করবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'বিসিএস প্রস্তুতি',
  },
  '/learn/bank-job-preparation': {
    title: 'ব্যাংক চাকরির প্রস্তুতি গাইড | Eduvelto',
    description:
      'ব্যাংকে চাকরির পরীক্ষার প্রস্তুতি কীভাবে নেবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ব্যাংক চাকরি',
  },
  '/learn/primary-teacher-preparation': {
    title: 'প্রাথমিক সহকারী শিক্ষক নিয়োগ প্রস্তুতি গাইড | Eduvelto',
    description:
      'প্রাথমিক সহকারী শিক্ষক নিয়োগ প্রস্তুতি কীভাবে নেবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'প্রাথমিক শিক্ষক',
  },
  '/learn/ntrca-preparation': {
    title: 'NTRCA শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি গাইড | Eduvelto',
    description:
      'NTRCA শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি কীভাবে নেবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'NTRCA প্রস্তুতি',
  },
  '/learn/nu-admission-guide': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি গাইড | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি — ধরণ, মেধাতালিকা ও প্রস্তুতি। ২০২৬–২৭ শিক্ষাবর্ষের বিজ্ঞপ্তি এখনো প্রকাশিত হয়নি; খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি',
  },
  '/learn/english-grammar-basics': {
    title: 'ইংরেজি ব্যাকরণ — Parts of Speech ও Tense | Eduvelto',
    description:
      'ইংরেজি ব্যাকরণের মৌলিক বিষয় সহজ বাংলায় — Parts of Speech, Tense ও বাক্য গঠন। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ইংরেজি ব্যাকরণ',
  },
  '/learn/scholarship-guide': {
    title: 'বৃত্তি গাইড — আবেদন, কাগজপত্র ও সময়সীমা | Eduvelto',
    description:
      'স্কলারশিপ কীভাবে কাজ করে, আবেদন ও কাগজপত্র — Commonwealth Shared Scholarships-এর উদাহরণসহ Eduvelto-র ফ্রি গাইড। খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'বৃত্তি গাইড',
  },
  '/learn/what-is-ai': {
    title: 'AI কী? শিক্ষার্থীদের জন্য সহজ ব্যাখ্যা | Eduvelto',
    description:
      'AI বা কৃত্রিম বুদ্ধিমত্তা কী, পড়াশোনায় AI কীভাবে ব্যবহার করবেন, আর এর সীমা ও সততার নিয়ম — Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'AI কী?',
  },
  '/learn/cv-writing-guide': {
    title: 'CV লেখার গাইড — বাংলাদেশি চাকরির জন্য | Eduvelto',
    description:
      'বাংলাদেশে চাকরির জন্য ভালো CV কীভাবে লিখবেন — গঠন, প্রয়োজনীয় তথ্য ও সাধারণ ভুল নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'CV লেখা',
  },
  '/learn/budget-planner-guide': {
    title: 'শিক্ষার্থীর মাসিক বাজেট পরিকল্পনা গাইড | Eduvelto',
    description:
      'শিক্ষার্থী হিসেবে মাসের খরচ কীভাবে পরিকল্পনা করবেন — আয়, জরুরি খরচ ও সঞ্চয়ের সহজ নিয়ম নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'মাসিক বাজেট',
  },
};

// ---------------------------------------------------------------------------
// Noindex (23 Nov 2026, AdSense Part 1) — pages with no real public
// content. They STAY LIVE for users (no deletion, no redirect) but
// carry robots 'noindex, nofollow' and leave the sitemap, so Google
// stops indexing thin/empty pages:
//  - every job subject page EXCEPT /jobs/bcs/subjects/english (the
//    one subject with live practice behind it);
//  - every NU subject page (draft content);
//  - /health + its 4 sub-pages (empty / unverified);
//  - /jobs/circulars (no published circular yet);
//  - /jobs/calendar — noindexed UNTIL a confirmed event exists; when
//    the first confirmed date lands, remove it from this set AND
//    put it back in the sitemap (it is a real page once it has one);
//  - /ai-teacher (92-word demo notice, no real teacher yet).
// /skills is NOT here: it is already robots-disallowed (robots.txt)
// and out of the sitemap, and resolveRouteSeo still returns its
// coming-soon entry for the in-app page.
// ---------------------------------------------------------------------------

const NOINDEX_STATIC = new Set([
  '/health',
  '/health/medicines',
  '/health/diseases',
  '/health/doctors',
  '/health/hospitals',
  '/jobs/circulars',
  '/jobs/calendar',
  '/ai-teacher',
  // Brand-SEO wave 1, F-06 (24 Nov 2026): /class/class-1-5 and
  // /class/class-6-8 are thin (~118 words, no books yet) — they stay
  // live for visitors with honest coming-soon content, but leave the
  // sitemap and carry noindex until Classes 1–8 have real books.
  // When books land, remove them from this set AND put them back in
  // the sitemap in the same commit.
  '/class/class-1-5',
  '/class/class-6-8',
]);

/** True for a subject page that must not be indexed: any job
 *  subject page except BCS English, and any NU subject page. */
function isNoindexedSubjectPage(path: string): boolean {
  if (/^\/jobs\/[^/]+\/subjects\/[^/]+$/.test(path)) {
    return path !== '/jobs/bcs/subjects/english';
  }
  if (
    /^\/admissions\/national-university\/(humanities|science|business)\/subjects\/[^/]+$/.test(
      path,
    )
  ) {
    return true;
  }
  return false;
}

/** Explicit breadcrumb trails for routes whose URL segments are
 *  not page names: crumbsForStatic would render the raw slugs
 *  ('bcs', 'practice', 'learn', 'bcs-english-tense').
 *  The /learn hub exists (AdSense Part 1 integration) — the first
 *  crumb ('বিসিএস ইংরেজি') points at it. */
const STATIC_CRUMBS: Record<string, string[]> = {
  '/jobs/bcs/practice/english': ['চাকরি প্রস্তুতি', 'বিসিএস', 'অনুশীলন', 'ইংরেজি'],
  '/jobs/bcs/practice/english/grammar': ['চাকরি প্রস্তুতি', 'বিসিএস', 'অনুশীলন', 'ইংরেজি', 'ব্যাকরণ'],
  '/jobs/bcs/practice/english/vocabulary': [
    'চাকরি প্রস্তুতি',
    'বিসিএস',
    'অনুশীলন',
    'ইংরেজি',
    'শব্দভান্ডার',
  ],
  '/jobs/bcs/practice/english/reading': ['চাকরি প্রস্তুতি', 'বিসিএস', 'অনুশীলন', 'ইংরেজি', 'রিডিং'],
  '/learn/bcs-english-tense': ['বিসিএস ইংরেজি', 'টেন্স'],
  '/learn/bcs-english-preposition': ['বিসিএস ইংরেজি', 'প্রিপোজিশন'],
};

// Bangla digits, e.g. 200 -> '২০০', 0.5 -> '০.৫'.
function bnDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

function timeBn(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return h === 1 ? '১ ঘণ্টা' : `${bnDigits(h)} ঘণ্টা`;
  }
  return `${bnDigits(minutes)} মিনিট`;
}

function jobExamEntry(slug: string, tab?: string): RouteSeoEntry | null {
  const exam = jobExamBySlug(slug);
  if (!exam) return null;
  // Tab suffix uses the verified Bangla tab name; an unknown tab slug
  // falls back to the plain exam title (never a raw English slug).
  const tabBn = tab ? JOB_TABS.find((t) => t.slug === tab)?.bn : undefined;
  const tabSuffix = tabBn ? ` — ${tabBn}` : '';

  // Honest per-exam description (22 Nov 2026, current plan): practice
  // and mocks are NOT live — the UI says "শীঘ্রই আসছে" — so no
  // description may present them as available. Verified pattern facts
  // come from jobRulesConfig; anything unverified says so plainly.
  const cfg = jobRulesConfig(slug);
  const status = jobPatternStatus(slug);
  // fullBn already ends with 'পরীক্ষা' for most exams ('…নিয়োগ
  // পরীক্ষা') and with 'প্রস্তুতি' for IT/private-ngo — strip that
  // trailing word before appending 'পরীক্ষার প্রস্তুতির কাঠামো', or
  // the description reads 'পরীক্ষা পরীক্ষার' / 'প্রস্তুতি প্রস্তুতির'
  // (copy nit found 23 Nov 2026 in the report audit).
  const examBase = exam.fullBn.replace(/ (পরীক্ষা|প্রস্তুতি)$/, '');
  let body: string;
  if (slug === 'bank' && cfg && cfg.questionCount !== null && cfg.timeMinutes !== null) {
    // Subject pattern verified, penalty NOT verified (Step 5 closure):
    // the config as a whole is not authoritative for scoring.
    body = `ব্যাংক প্রিলিমিনারি পরীক্ষার প্রস্তুতির কাঠামো — যাচাইকৃত বিষয়বণ্টন: ${bnDigits(cfg.questionCount)} MCQ, ${timeBn(cfg.timeMinutes)} (অফিসার, ক্যাশ); নেগেটিভ মার্কিং অযাচাইকৃত — বিজ্ঞপ্তি/প্রবেশপত্রে লেখা হারই চূড়ান্ত।`;
  } else if (
    cfg &&
    cfg.questionCount !== null &&
    cfg.timeMinutes !== null &&
    (status === 'verified' || status === 'last_verified')
  ) {
    const pattern =
      status === 'last_verified'
        ? 'শেষ যাচাইকৃত ধরন (১৮তম পরীক্ষা)'
        : 'যাচাইকৃত ধরন';
    const neg =
      cfg.negativeMarking === null || cfg.negativeMarking === undefined
        ? 'নেগেটিভ মার্কিং নেই'
        : `নেগেটিভ মার্কিং −${bnDigits(Math.abs(cfg.negativeMarking).toFixed(2))}`;
    const pass =
      cfg.passMark !== null && cfg.passMark !== undefined
        ? `, পাস ${bnDigits(cfg.passMark)} নম্বর`
        : '';
    body = `${examBase} পরীক্ষার প্রস্তুতির কাঠামো — ${pattern}: ${bnDigits(cfg.questionCount)} MCQ, ${timeBn(cfg.timeMinutes)}, ${neg}${pass}; বিষয়ভিত্তিক সিলেবাস।`;
  } else if (slug === 'it-professional') {
    // Scope undecided (owner decision 13.8) — Step 6 builds no syllabus.
    body = `${examBase} পরীক্ষার প্রস্তুতির কাঠামো — পরিধি নির্ধারণ বাকি।`;
  } else {
    body = `${examBase} পরীক্ষার প্রস্তুতির কাঠামো — পরীক্ষার ধরন যাচাই বাকি (সর্বশেষ বিজ্ঞপ্তি দেখে নিন)।`;
  }
  // AdSense Part 1 (integration): BCS English practice is live — say
  // so for the BCS hub only; every other exam keeps the honest
  // coming-soon wording. The "শীঘ্রই আসছে" phrase stays, pinned by
  // seo.test.ts ("never presents practice as live").
  const practiceNote =
    slug === 'bcs'
      ? 'BCS English MCQ অনুশীলন চালু আছে (Grammar, Vocabulary, Reading); অন্যান্য বিষয়ের MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে।'
      : 'MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে।';
  return {
    title: `${exam.bn} প্রস্তুতি — ${exam.fullBn}${tabSuffix} | Eduvelto`,
    description: `${body} ${practiceNote} Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: exam.bn,
  };
}

function jobSubjectEntry(examSlug: string, subjectSlug: string): RouteSeoEntry | null {
  const exam = jobExamBySlug(examSlug);
  if (!exam) return null;
  // Subjects exist ONLY for the 4 verified exams (jobContent.ts).
  // Anything else (incl. a subject from another exam) is not a page.
  const subj = jobSubjectById(`${examSlug}__${subjectSlug}`);
  if (!subj) return null;
  // marks is null only for a subject whose marks are not verified
  // (jobContent.ts) — the description's core claim IS the verified
  // mark count, so such a subject is not a page. All 23 subjects
  // today carry verified marks (pinned by seo.test.ts).
  if (subj.marks === null) return null;
  // AdSense Part 1 (integration): BCS English practice is live — the
  // subject description says so for this subject only. "৩৫ নম্বর"
  // (via bnDigits) and "শীঘ্রই আসছে" (mocks) stay, pinned by
  // seo.test.ts for all 23 subject pages.
  if (examSlug === 'bcs' && subjectSlug === 'english') {
    return {
      title: `${subj.nameBn} — ${exam.bn} প্রস্তুতি | Eduvelto`,
      description: `${exam.fullBn} ${subj.nameBn} — যাচাইকৃত সিলেবাসে ${bnDigits(subj.marks)} নম্বর। টপিকভিত্তিক MCQ অনুশীলন চালু আছে (Grammar, Vocabulary, Reading); মক টেস্ট শীঘ্রই আসছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
      crumb: subj.nameBn,
    };
  }
  return {
    title: `${subj.nameBn} — ${exam.bn} প্রস্তুতি | Eduvelto`,
    description: `${exam.fullBn} ${subj.nameBn} — যাচাইকৃত সিলেবাসে ${bnDigits(subj.marks)} নম্বর। টপিক ও অনুশীলন শীঘ্রই আসছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: subj.nameBn,
  };
}

function nuSubjectEntry(groupSlug: string, subjectSlug: string): RouteSeoEntry | null {
  const group = NU_GROUPS.find((g) => g.slug === groupSlug);
  if (!group) return null;
  const subj = nuSyllabusSubjectBySlug(subjectSlug);
  // Group-block subjects (group-*) render the not-found card by design
  // (NuSubjectPage) — they are not pages. Only the 3 common subjects
  // (bangla/english/general-knowledge, 20 marks each, verified from
  // the circular) have subject pages, per group.
  if (!subj || subj.isGroupBlock || !subj.groupIds.includes(group.slug)) return null;
  // group.bn is 'মানবিক শাখা' / 'বিজ্ঞান শাখা' / 'ব্যবসায় শিক্ষা
  // শাখা' — strip the trailing 'শাখা' before writing '…শাখার',
  // or the description reads 'শাখা শাখার' (copy nit, 23 Nov 2026).
  const groupShort = group.bn.replace(/ শাখা$/, '');
  return {
    title: `${subj.nameBn} — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি (${group.bn}) | Eduvelto`,
    description: `${groupShort} শাখার ভর্তি পরীক্ষায় ${subj.nameBn} ${bnDigits(subj.marks)} নম্বর — বিজ্ঞপ্তি থেকে যাচাইকৃত। অধ্যায় ও টপিক খসড়া হিসেবে দেওয়া আছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: subj.nameBn,
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
    // /jobs/:exam/subjects/:subject (Step 6 subject pages — ONLY the
    // 4 verified exams have subjects; anything else is not a page).
    const jobSubjectMatch = path.match(/^\/jobs\/([^/]+)\/subjects\/([^/]+)$/);
    if (jobSubjectMatch) {
      const exam = jobExamBySlug(jobSubjectMatch[1]);
      entry = jobSubjectEntry(jobSubjectMatch[1], jobSubjectMatch[2]);
      if (entry && exam) crumbs = ['চাকরি প্রস্তুতি', exam.bn, entry.crumb];
    }
  }

  if (!entry) {
    // /admissions/national-university/:group/subjects/:subject — ONLY
    // the 3 common subjects per group (bangla/english/general-
    // knowledge). Group-block slugs render the not-found card by
    // design and must not resolve. This branch MUST come before the
    // group-prefix branch below, whose regex would also match.
    const nuSubjectMatch = path.match(
      /^\/admissions\/national-university\/(humanities|science|business)\/subjects\/([^/]+)$/,
    );
    if (nuSubjectMatch) {
      const group = NU_GROUPS.find((g) => g.slug === nuSubjectMatch[1]);
      entry = nuSubjectEntry(nuSubjectMatch[1], nuSubjectMatch[2]);
      if (entry && group) {
        crumbs = ['ভর্তি প্রস্তুতি', 'জাতীয় বিশ্ববিদ্যালয়', group.bn, entry.crumb];
      }
    }
  }

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
  if (!entry) {
    // /opportunities/:oppId — ONLY the verified seed listings get
    // real SEO (23 Nov 2026, Global Opportunity Hub). The lookup is
    // synchronous over the static seed: a Firestore-only or
    // unpublished doc resolves to null here and falls back to the
    // noindex home SEO — an unknown/unpublished detail must never
    // look indexable.
    const oppMatch = path.match(/^\/opportunities\/([^/]+)$/);
    if (oppMatch) {
      const seed = OPPORTUNITY_SEED.find((o) => o.docId === oppMatch[1]);
      if (seed && isPublished(seed)) {
        const desc = seed.descriptionBn.length > 150 ? `${seed.descriptionBn.slice(0, 147)}…` : seed.descriptionBn;
        entry = {
          title: `${seed.titleBn} | Eduvelto`,
          description: `${desc} — অফিসিয়াল উৎসে যাচাইকৃত। Eduvelto।`,
          crumb: seed.titleBn,
        };
        crumbs = ['সুযোগ হাব', seed.titleBn];
      } else {
        return null;
      }
    }
  }
  if (!entry && path.startsWith('/admissions/national-university/')) {
    // Direct subject pages (/subjects/<slug>) were already decided by
    // the nuSubject branch above: null there means "not a page"
    // (group-block slug or unknown subject) — never resurrect it as
    // group SEO (23 Nov 2026, seo.test.ts guard). Deeper paths
    // (/subjects/<subject>/<topic>) still share the group SEO below.
    const directSubject =
      /^\/admissions\/national-university\/(?:humanities|science|business)\/subjects\/[^/]+$/.test(
        path,
      );
    if (directSubject) return null;
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
  if (crumbs.length === 0) crumbs = STATIC_CRUMBS[path] ?? crumbsForStatic(path);

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
  const jsonLd: unknown[] = [ORGANIZATION_JSON_LD, WEBSITE_JSON_LD, webPage, breadcrumbFor(path, crumbs)];
  if (path === '/jobs') {
    // ItemList (23 Nov 2026, Gemini fold-in): the hub renders a real
    // card grid of all 14 exam hubs — list them with their real URLs.
    // Only the jobs hub gets an ItemList; other hub lists are dynamic
    // (circulars — empty live) or login-gated, so no list is emitted.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'চাকরি প্রস্তুতি — পরীক্ষা',
      itemListElement: JOB_EXAMS.map((exam, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${exam.bn} প্রস্তুতি`,
        url: `${SITE_URL}/jobs/${exam.slug}`,
      })),
    });
  }
  if (path === '/jobs/bcs/practice/english') {
    // ItemList (23 Nov 2026, AdSense Part 1): the hub renders the
    // three real practice sections — list them with their real URLs,
    // like the /jobs ItemList above.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'বিসিএস ইংরেজি অনুশীলন',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ব্যাকরণ অনুশীলন',
          url: `${SITE_URL}/jobs/bcs/practice/english/grammar`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'শব্দভান্ডার অনুশীলন',
          url: `${SITE_URL}/jobs/bcs/practice/english/vocabulary`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'রিডিং অনুশীলন',
          url: `${SITE_URL}/jobs/bcs/practice/english/reading`,
        },
      ],
    });
  }
  if (path === '/learn') {
    // ItemList (24 Nov 2026, SEO pass; EXTENDED brand-SEO wave 1):
    // the hub lists the 10 public guides, the two real lessons and
    // the BCS English practice hub — the same links the page renders,
    // in the same order.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'পাঠ ও গাইড',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'বিসিএস প্রিলিমিনারি প্রস্তুতি গাইড',
          url: `${SITE_URL}/learn/bcs-preparation-guide`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'ব্যাংক চাকরির প্রস্তুতি গাইড',
          url: `${SITE_URL}/learn/bank-job-preparation`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'প্রাথমিক সহকারী শিক্ষক নিয়োগ প্রস্তুতি গাইড',
          url: `${SITE_URL}/learn/primary-teacher-preparation`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'NTRCA শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি গাইড',
          url: `${SITE_URL}/learn/ntrca-preparation`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি গাইড',
          url: `${SITE_URL}/learn/nu-admission-guide`,
        },
        {
          '@type': 'ListItem',
          position: 6,
          name: 'ইংরেজি ব্যাকরণের মৌলিক বিষয়',
          url: `${SITE_URL}/learn/english-grammar-basics`,
        },
        {
          '@type': 'ListItem',
          position: 7,
          name: 'বৃত্তি (স্কলারশিপ) গাইড',
          url: `${SITE_URL}/learn/scholarship-guide`,
        },
        {
          '@type': 'ListItem',
          position: 8,
          name: 'AI কী? শিক্ষার্থীরা কীভাবে AI ব্যবহার করবে',
          url: `${SITE_URL}/learn/what-is-ai`,
        },
        {
          '@type': 'ListItem',
          position: 9,
          name: 'CV লেখার গাইড',
          url: `${SITE_URL}/learn/cv-writing-guide`,
        },
        {
          '@type': 'ListItem',
          position: 10,
          name: 'শিক্ষার্থী হিসেবে মাসিক বাজেট পরিকল্পনা',
          url: `${SITE_URL}/learn/budget-planner-guide`,
        },
        {
          '@type': 'ListItem',
          position: 11,
          name: 'টেন্স — পাঠ',
          url: `${SITE_URL}/learn/bcs-english-tense`,
        },
        {
          '@type': 'ListItem',
          position: 12,
          name: 'প্রিপোজিশন — পাঠ',
          url: `${SITE_URL}/learn/bcs-english-preposition`,
        },
        {
          '@type': 'ListItem',
          position: 13,
          name: 'বিসিএস ইংরেজি অনুশীলন',
          url: `${SITE_URL}/jobs/bcs/practice/english`,
        },
      ],
    });
  }
  if (path === '/opportunities') {
    // ItemList (24 Nov 2026, SEO pass): the hub renders exactly the
    // published seed listings — build the list from the same seed
    // the detail resolver uses, so the JSON-LD never lists an
    // unpublished opportunity. (Firestore Published docs take
    // precedence on the page itself; the seed is the v1 source of
    // truth and the only list this resolver can see.)
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'যাচাইকৃত সুযোগ',
      itemListElement: OPPORTUNITY_SEED.filter((o) => isPublished(o)).map((o, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: o.titleBn,
        url: `${SITE_URL}/opportunities/${o.docId}`,
      })),
    });
  }
  if (path === '/learn/bcs-english-tense' || path === '/learn/bcs-english-preposition') {
    // Article (24 Nov 2026, SEO pass): the two lesson pages are real
    // article-length texts. datePublished is the real publish date
    // (AdSense Part 1 merged 23 Nov 2026). The pages themselves
    // label the lessons drafts awaiting teacher review, and the meta
    // description says so too — the markup never claims review.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      description: entry.description,
      inLanguage: 'bn',
      datePublished: '2026-11-23',
      author: { '@id': 'https://eduvelto.com#organization' },
      publisher: { '@id': 'https://eduvelto.com#organization' },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
    });
  }
  if (PUBLIC_GUIDES.some((g) => g.path === path)) {
    // Article (24 Nov 2026, brand-SEO wave 1): same treatment as the
    // lessons — the 10 guides are article-length drafts awaiting
    // teacher review, published 24 Nov 2026. Never claims review.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      description: entry.description,
      inLanguage: 'bn',
      datePublished: '2026-11-24',
      author: { '@id': 'https://eduvelto.com#organization' },
      publisher: { '@id': 'https://eduvelto.com#organization' },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
    });
  }
  return {
    title: entry.title,
    description: entry.description,
    canonical,
    ogType: 'website',
    ogImage: OG_IMAGE_URL,
    // Noindex (23 Nov 2026, AdSense Part 1): thin/empty pages stay
    // live but must not be indexed. Absent = indexable.
    ...(NOINDEX_STATIC.has(path) || isNoindexedSubjectPage(path)
      ? { robots: 'noindex, nofollow' as const }
      : {}),
    jsonLd,
  };
}

/**
 * Fallback SEO for paths that are NOT content pages (23 Nov 2026,
 * feature/seo-50-100-pages, Gemini fold-in — soft-404 handling).
 *
 * The SPA catch-all renders HomePage for ANY unknown path with HTTP
 * 200 (WEB-001), so a junk URL like /jobs/primary or /class/class-9
 * would otherwise keep the previous route's title/meta — or the
 * static home tags — and look indexable. This fallback gives such a
 * URL the HOME title/description/canonical (it IS rendering the
 * homepage) plus robots noindex, nofollow, so Google never indexes
 * the junk URL. RouteSeo applies it whenever resolveRouteSeo returns
 * null, EXCEPT /founder (FounderPage owns its own SEO and must not
 * be touched). It never changes what the user sees.
 */
export function resolveFallbackSeo(pathname: string): SeoData | null {
  if (pathname.replace(/\/+$/, '') === '/founder') return null;
  const home = STATIC_ROUTES['/'];
  return {
    title: home.title,
    description: home.description,
    canonical: `${SITE_URL}/`,
    ogType: 'website',
    ogImage: OG_IMAGE_URL,
    robots: 'noindex, nofollow',
    jsonLd: [],
  };
}
