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
    'A Smarter World of Learning — a free digital education platform from Bangladesh, in Bangla and English, for students from Class 1 to Honours.',
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
      'BCS, ব্যাংক, প্রাথমিক শিক্ষক ও NTRCA পরীক্ষার প্রস্তুতির কাঠামো — পরীক্ষার ধরন, সিলেবাস ও বিষয়ভিত্তিক প্রস্তুতি। MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'চাকরি প্রস্তুতি',
  },
  '/jobs/common': {
    title: 'কমন বিষয় — চাকরি প্রস্তুতি | Eduvelto',
    description:
      'চাকরি পরীক্ষার কমন বিষয় — বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের প্রস্তুতির কাঠামো। MCQ অনুশীলন শীঘ্রই আসছে। Eduvelto।',
    crumb: 'কমন বিষয়',
  },
  '/jobs/circulars': {
    title: 'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার ও আবেদনের তারিখ | Eduvelto',
    description:
      'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার, আবেদনের তারিখ ও অফিসিয়াল উৎস। নতুন বিজ্ঞপ্তি যাচাই হলে এখানে দেখাবে; অযাচাইকৃত বা অনুমান করা তারিখ কখনো দেখানো হয় না। Eduvelto।',
    crumb: 'বিজ্ঞপ্তি',
  },
  '/opportunities': {
    title: 'সুযোগ হাব — যাচাইকৃত চাকরি, স্কলারশিপ, ইন্টার্নশিপ | Eduvelto',
    description:
      'যাচাইকৃত সুযোগ — চাকরি, রিমোট কাজ, ফ্রিল্যান্সিং, ইন্টার্নশিপ, স্কলারশিপ ও বিনামূল্যে দক্ষতা উন্নয়ন। প্রতিটি সুযোগ অফিসিয়াল উৎস থেকে যাচাই করা; শেষ তারিখ না জানা থাকলে অনুমান করে দেখানো হয় না। Eduvelto।',
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
  '/admissions': {
    title: 'ভর্তি প্রস্তুতি — বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার প্রস্তুতির কাঠামো — জাতীয় বিশ্ববিদ্যালয় অনার্সসহ পরীক্ষার ধরন ও সিলেবাস। MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'ভর্তি প্রস্তুতি',
  },
  '/admissions/national-university': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি — অনার্স ১ম বর্ষ | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় অনার্স ১ম বর্ষ ভর্তি পরীক্ষার প্রস্তুতির কাঠামো — ধরন: ১০০ MCQ, ১ ঘণ্টা, নেগেটিভ মার্কিং নেই; বাংলা, ইংরেজি, সাধারণ জ্ঞান ও গ্রুপভিত্তিক সিলেবাস। MCQ অনুশীলন শীঘ্রই আসছে। Eduvelto।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয়',
  },
  '/admissions/national-university/humanities': {
    title: 'মানবিক শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার মানবিক শাখার প্রস্তুতির কাঠামো — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও মানবিক গ্রুপের সিলেবাস। MCQ অনুশীলন শীঘ্রই আসছে। Eduvelto।',
    crumb: 'মানবিক শাখা',
  },
  '/admissions/national-university/science': {
    title: 'বিজ্ঞান শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিজ্ঞান শাখার প্রস্তুতির কাঠামো — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও বিজ্ঞান গ্রুপের সিলেবাস। MCQ অনুশীলন শীঘ্রই আসছে। Eduvelto।',
    crumb: 'বিজ্ঞান শাখা',
  },
  '/admissions/national-university/business': {
    title: 'ব্যবসায় শিক্ষা শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ব্যবসায় শিক্ষা শাখার প্রস্তুতির কাঠামো — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও ব্যবসায় গ্রুপের সিলেবাস। MCQ অনুশীলন শীঘ্রই আসছে। Eduvelto।',
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
  '/health': {
    title: 'স্বাস্থ্য — সচেতনতামূলক তথ্য | Eduvelto',
    description:
      'স্বাস্থ্য সচেতনতামূলক তথ্য — ঔষধ, রোগ ও হাসপাতালের তথ্য। Eduvelto।',
    crumb: 'স্বাস্থ্য',
  },
  '/health/medicines': {
    title: 'ঔষধ নির্দেশিকা — ব্যবহার, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা | Eduvelto',
    description:
      'সাধারণ ঔষধের ব্যবহার, ধরন, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা — শুধুমাত্র যাচাইকৃত উৎস থেকে। এখানে কোনো ডোজ দেওয়া হয় না; ডোজ শুধুমাত্র ডাক্তারের পরামর্শ অনুযায়ী। Eduvelto।',
    crumb: 'ঔষধ নির্দেশিকা',
  },
  '/health/diseases': {
    title: 'রোগের তথ্য — লক্ষণ, প্রতিরোধ ও কখন ডাক্তার দেখাবেন | Eduvelto',
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
  '/ai-teacher': {
    title: 'AI শিক্ষক — শীঘ্রই আসছে | Eduvelto',
    description:
      'Eduvelto-র ব্যক্তিগত AI শিক্ষক শীঘ্রই আসছে। আপাতত বিনামূল্যে MCQ পরীক্ষা, লাইব্রেরি ও চাকরি-ভর্তি প্রস্তুতি ব্যবহার করুন।',
    crumb: 'AI শিক্ষক',
  },
  '/skills': {
    title: 'পেশাগত দক্ষতা — শীঘ্রই আসছে | Eduvelto',
    description:
      'Eduvelto-র পেশাগত দক্ষতা বিভাগ শীঘ্রই আসছে। আপাতত চাকরি ও ভর্তি প্রস্তুতি ব্যবহার করুন — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'পেশাগত দক্ষতা',
  },
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
  return {
    title: `${exam.bn} প্রস্তুতি — ${exam.fullBn}${tabSuffix} | Eduvelto`,
    description: `${body} MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
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
  return {
    title: entry.title,
    description: entry.description,
    canonical,
    ogType: 'website',
    ogImage: OG_IMAGE_URL,
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
