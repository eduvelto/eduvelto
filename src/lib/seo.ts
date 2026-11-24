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
//  - SEO is per language (language system, 24 Nov 2026): every
//    static route carries titleEn/descriptionEn/crumbEn; useSeo()
//    emits the title/meta/canonical/hreflang for the selected
//    language. Lesson/question/guide BODIES stay in their source
//    language (content data, not UI chrome).
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

function setLink(rel: string, hreflang: string, href: string): void {
  let el = document.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"][hreflang="${hreflang}"]`,
  );
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo(seo: SeoData, lang: 'bn' | 'en' = 'bn'): void {
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
    // hreflang (24 Nov 2026, language system): the same page in
    // each language, plus x-default. Canonical stays the clean
    // URL — the ?lang= variants are alternate versions of it.
    setLink('alternate', 'bn', `${seo.canonical}?lang=bn`);
    setLink('alternate', 'en', `${seo.canonical}?lang=en`);
    setLink('alternate', 'x-default', seo.canonical);

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
  }, [seo.title, seo.canonical, lang]);
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

type RouteSeoEntry = {
  title: string;
  description: string;
  crumb: string;
  titleEn: string;
  descriptionEn: string;
  crumbEn: string;
};

const STATIC_ROUTES: Record<string, RouteSeoEntry> = {
  '/': {
    title: 'Eduvelto — বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম Eduvelto — BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'হোম',
    titleEn: 'Eduvelto — Bangladesh\'s Best Free Education Platform',
    descriptionEn:
      'Eduvelto, Bangladesh\'s best free education platform — BCS, Bank, Primary Teacher, NTRCA and National University admission preparation, MCQ exams and a digital library — completely free.',
    crumbEn: 'Home',
  },
  '/why-eduvelto': {
    title: 'কেন Eduvelto — বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'কেন Eduvelto বাংলাদেশের সেরা ফ্রি শিক্ষা প্ল্যাটফর্ম হতে চায় — ১০০% বিনামূল্যে BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি।',
    crumb: 'কেন Eduvelto',
    titleEn: 'Why Eduvelto — Bangladesh\'s Best Free Education Platform',
    descriptionEn:
      'Why Eduvelto aims to be Bangladesh\'s best free education platform — 100% free BCS, Bank, Primary Teacher, NTRCA and National University admission preparation, MCQ exams and a digital library.',
    crumbEn: 'Why Eduvelto',
  },
  '/jobs': {
    title: 'চাকরি প্রস্তুতি — BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA | Eduvelto',
    description:
      'BCS, ব্যাংক, প্রাথমিক শিক্ষক ও NTRCA পরীক্ষার প্রস্তুতির কাঠামো — পরীক্ষার ধরন, সিলেবাস ও বিষয়ভিত্তিক প্রস্তুতি। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'চাকরি প্রস্তুতি',
    titleEn: 'Job Preparation — BCS, Bank, Primary Teacher, NTRCA | Eduvelto',
    descriptionEn:
      'The structure for BCS, Bank, Primary Teacher and NTRCA exam preparation — exam patterns, syllabuses and subject-wise preparation. BCS English practice is live now; full mock exams are still being prepared. Eduvelto — completely free.',
    crumbEn: 'Job Preparation',
  },
  '/jobs/common': {
    title: 'কমন বিষয় — চাকরি প্রস্তুতি | Eduvelto',
    description:
      'চাকরি পরীক্ষার কমন বিষয় — বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের প্রস্তুতির কাঠামো। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto।',
    crumb: 'কমন বিষয়',
    titleEn: 'Common Subjects — Job Preparation | Eduvelto',
    descriptionEn:
      'Common subjects for job exams — the preparation structure for Bangla, English, Mathematics and General Knowledge. BCS English practice is live now; full mock exams are still being prepared. Eduvelto.',
    crumbEn: 'Common Subjects',
  },
  '/jobs/circulars': {
    title: 'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার ও আবেদনের তারিখ | Eduvelto',
    description:
      'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার, আবেদনের তারিখ ও অফিসিয়াল উৎস। নতুন বিজ্ঞপ্তি যাচাই হলে এখানে দেখাবে; অযাচাইকৃত বা অনুমান করা তারিখ কখনো দেখানো হয় না। Eduvelto।',
    crumb: 'বিজ্ঞপ্তি',
    titleEn: 'Job Circulars — Verified Circulars & Application Dates | Eduvelto',
    descriptionEn:
      'Job circulars — verified circulars, application dates and official sources. New circulars appear here once verified; unverified or estimated dates are never shown. Eduvelto.',
    crumbEn: 'Circulars',
  },
  '/opportunities': {
    title: 'সুযোগ হাব — যাচাইকৃত চাকরি, স্কলারশিপ, ইন্টার্নশিপ | Eduvelto',
    description:
      'যাচাইকৃত সুযোগ — চাকরি, রিমোট কাজ, ফ্রিল্যান্সিং, ইন্টার্নশিপ, স্কলারশিপ ও বিনামূল্যে দক্ষতা উন্নয়ন। প্রতিটি সুযোগ অফিসিয়াল উৎস থেকে যাচাই করা; শেষ তারিখ না জানা থাকলে অনুমান করে দেখানো হয় না। Eduvelto।',
    crumb: 'সুযোগ হাব',
    titleEn: 'Opportunity Hub — Verified Jobs, Scholarships, Internships | Eduvelto',
    descriptionEn:
      'Verified opportunities — jobs, remote work, freelancing, internships, scholarships and free skill development. Every opportunity is verified from an official source; when a deadline is unknown it is never guessed. Eduvelto.',
    crumbEn: 'Opportunity Hub',
  },
  '/opportunities/cv-builder': {
    title: 'সিভি ও কভার লেটার তৈরি — ফ্রি টুল | Eduvelto',
    description:
      'ফরম পূরণ করে প্রিন্ট করার মতো সিভি ও কভার লেটার তৈরি করুন — সম্পূর্ণ ফ্রি, আপনার তথ্য ব্রাউজারের বাইরে যায় না, কোথাও সংরক্ষণ হয় না। Eduvelto।',
    crumb: 'সিভি তৈরি',
    titleEn: 'Build a CV & Cover Letter — Free Tool | Eduvelto',
    descriptionEn:
      'Fill in a form and create a printable CV and cover letter — completely free; your information never leaves your browser and is not stored anywhere. Eduvelto.',
    crumbEn: 'Build a CV',
  },
  '/opportunities/interview-prep': {
    title: 'ইন্টারভিউ প্রস্তুতি — সাধারণ প্রশ্ন ও STAR পদ্ধতি | Eduvelto',
    description:
      'ইন্টারভিউ প্রস্তুতির সাধারণ নির্দেশনা — আগের প্রস্তুতি, সাধারণ প্রশ্ন, STAR পদ্ধতিতে উত্তর ও ইন্টারভিউর দিনের চেকলিস্ট। কোনো চাকরির নিশ্চয়তা নয়। Eduvelto।',
    crumb: 'ইন্টারভিউ প্রস্তুতি',
    titleEn: 'Interview Preparation — Common Questions & the STAR Method | Eduvelto',
    descriptionEn:
      'General guidance for interview preparation — preparation beforehand, common questions, answering with the STAR method, and a checklist for interview day. No job guarantee. Eduvelto.',
    crumbEn: 'Interview Preparation',
  },
  '/opportunities/career-guidance': {
    title: 'ক্যারিয়ার গাইড — পেশা বেছে নেওয়া ও দক্ষতার পথ | Eduvelto',
    description:
      'ক্যারিয়ার গাইড — পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিংয়ের সৎ তুলনা। সাধারণ নির্দেশনা, কোনো অফিসিয়াল সিলেবাস নয়। Eduvelto।',
    crumb: 'ক্যারিয়ার গাইড',
    titleEn: 'Career Guide — Choosing a Profession & Skill Paths | Eduvelto',
    descriptionEn:
      'Career guide — choosing a profession, skill paths, and an honest comparison of government, private-sector and freelancing work. General guidance, not an official syllabus. Eduvelto.',
    crumbEn: 'Career Guide',
  },
  '/opportunities/entrepreneurship': {
    title: 'উদ্যোক্তা গাইড — আইডিয়া যাচাই ও হিসাব রাখা | Eduvelto',
    description:
      'উদ্যোক্তা গাইড — আইডিয়া যাচাই, ছোট করে শুরু, লাভ-ক্ষতির হিসাব ও অনলাইনে সৎভাবে বিক্রি। সাধারণ নির্দেশনা, আয়ের কোনো প্রতিশ্রুতি নয়। Eduvelto।',
    crumb: 'উদ্যোক্তা গাইড',
    titleEn: 'Entrepreneurship Guide — Validating Ideas & Keeping Accounts | Eduvelto',
    descriptionEn:
      'Entrepreneurship guide — validating an idea, starting small, tracking profit and loss, and selling honestly online. General guidance, no promise of income. Eduvelto.',
    crumbEn: 'Entrepreneurship Guide',
  },
  '/opportunities/income': {
    title: 'বৈধ অনলাইন আয় — বাস্তব পথ ও প্রতারণা চেনা | Eduvelto',
    description:
      'বৈধ অনলাইন আয় — ফ্রিল্যান্সিং, ডিজিটাল পণ্য, কনটেন্ট ও অ্যাফিলিয়েটের বাস্তব চিত্র, প্রতারণা চেনার উপায় ও শুরুর ধাপ। আয়ের কোনো প্রতিশ্রুতি নয়। Eduvelto।',
    crumb: 'বৈধ অনলাইন আয়',
    titleEn: 'Legitimate Online Income — Real Paths & Spotting Scams | Eduvelto',
    descriptionEn:
      'Legitimate online income — the real picture of freelancing, digital products, content and affiliate work, how to spot scams, and the first steps. No promise of income. Eduvelto.',
    crumbEn: 'Legitimate Online Income',
  },
  '/jobs/calendar': {
    title: 'চাকরির ক্যালেন্ডার — বিজ্ঞপ্তি ও পরীক্ষার তারিখ | Eduvelto',
    description:
      'যাচাইকৃত বিজ্ঞপ্তি ও মক পরীক্ষার তারিখের ক্যালেন্ডার — নিশ্চিত তারিখ এলে এখানে দেখাবে; অনুমান করা তারিখ কখনো দেখানো হয় না। Eduvelto।',
    crumb: 'ক্যালেন্ডার',
    titleEn: 'Job Calendar — Circular & Exam Dates | Eduvelto',
    descriptionEn:
      'Calendar of verified circular and mock-exam dates — confirmed dates appear here when they arrive; estimated dates are never shown. Eduvelto.',
    crumbEn: 'Calendar',
  },
  // Added 24 Nov 2026 (homepage redesign): the three Step 16 job
  // guides are real public pages on main, so they join the sitemap.
  '/jobs/viva': {
    title: 'ভাইভা প্রস্তুতি — চাকরির ভাইভার নির্দেশিকা | Eduvelto',
    description:
      'চাকরির ভাইভা প্রস্তুতির নির্দেশিকা — সাধারণ প্রশ্ন, নিজের পরিচয়, শরীরী ভাষা ও ভাইভার দিনের চেকলিস্ট। সাধারণ নির্দেশনা, কোনো চাকরির নিশ্চয়তা নয়। Eduvelto।',
    crumb: 'ভাইভা প্রস্তুতি',
    titleEn: 'Viva Preparation — Job Viva Guide | Eduvelto',
    descriptionEn:
      'Guide to job viva preparation — common questions, introducing yourself, body language and a checklist for viva day. General guidance, no job guarantee. Eduvelto.',
    crumbEn: 'Viva Preparation',
  },
  '/jobs/career': {
    title: 'ক্যারিয়ার পরিকল্পনা — চাকরির পথ বেছে নেওয়া | Eduvelto',
    description:
      'ক্যারিয়ার পরিকল্পনা — পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিংয়ের সৎ তুলনা। সাধারণ নির্দেশনা, কোনো অফিসিয়াল সিলেবাস নয়। Eduvelto।',
    crumb: 'ক্যারিয়ার গাইড',
    titleEn: 'Career Planning — Choosing Your Job Path | Eduvelto',
    descriptionEn:
      'Career planning — choosing a profession, skill paths, and an honest comparison of government, private-sector and freelancing work. General guidance, not an official syllabus. Eduvelto.',
    crumbEn: 'Career Guide',
  },
  '/jobs/cv': {
    title: 'সিভি লেখা — চাকরির সিভির নির্দেশিকা | Eduvelto',
    description:
      'চাকরির সিভি লেখার নির্দেশিকা — কী লিখবেন, কী লিখবেন না, নমুনা কাঠামো। সাধারণ নির্দেশনা; আপনার তথ্য ব্রাউজারের বাইরে যায় না। Eduvelto।',
    crumb: 'সিভি লেখা',
    titleEn: 'Writing a CV — Job CV Guide | Eduvelto',
    descriptionEn:
      'Guide to writing a job CV — what to write, what not to write, and a sample structure. General guidance; your information never leaves your browser. Eduvelto.',
    crumbEn: 'Writing a CV',
  },
  '/install': {
    title: 'Eduvelto অ্যাপ ইনস্টল করুন — ফোনে পড়ুন | Eduvelto',
    description:
      'Eduvelto অ্যাপ ইনস্টল ও আপডেট করুন — ফোনের হোম স্ক্রিন থেকে সরাসরি পড়ুন। অনলাইন-ভিত্তিক; অফলাইন পড়া সমর্থিত নয়। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'অ্যাপ ইনস্টল',
    titleEn: 'Install the Eduvelto App — Study on Your Phone | Eduvelto',
    descriptionEn:
      'Install and update the Eduvelto app — study straight from your phone home screen. Online-based; offline study is not supported. Eduvelto — completely free.',
    crumbEn: 'Install App',
  },
  '/admissions': {
    title: 'ভর্তি প্রস্তুতি — বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'বিশ্ববিদ্যালয় ভর্তি পরীক্ষার প্রস্তুতির কাঠামো — জাতীয় বিশ্ববিদ্যালয় অনার্সসহ পরীক্ষার ধরন ও সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto — সম্পূর্ণ ফ্রি।',
    crumb: 'ভর্তি প্রস্তুতি',
    titleEn: 'Admission Preparation — University Admission | Eduvelto',
    descriptionEn:
      'The structure for university admission exam preparation — exam patterns and syllabuses, including National University honours. BCS English practice is live now; full mock exams are still being prepared. Eduvelto — completely free.',
    crumbEn: 'Admission Preparation',
  },
  '/admissions/national-university': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি — অনার্স ১ম বর্ষ | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় অনার্স ১ম বর্ষ ভর্তি পরীক্ষার প্রস্তুতির কাঠামো — ধরন: ১০০ MCQ, ১ ঘণ্টা, নেগেটিভ মার্কিং নেই; বাংলা, ইংরেজি, সাধারণ জ্ঞান ও গ্রুপভিত্তিক সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয়',
    titleEn: 'National University Admission Preparation — Honours 1st Year | Eduvelto',
    descriptionEn:
      'Preparation structure for the National University Honours 1st Year admission test — format: 100 MCQ, 1 hour, no negative marking; Bangla, English, General Knowledge and group-based syllabus. BCS English practice is live now; full mock exams are still being prepared. Eduvelto.',
    crumbEn: 'National University',
  },
  '/admissions/national-university/humanities': {
    title: 'মানবিক শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার মানবিক শাখার প্রস্তুতির কাঠামো — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও মানবিক গ্রুপের সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto।',
    crumb: 'মানবিক শাখা',
    titleEn: 'Humanities Group — National University Admission Preparation | Eduvelto',
    descriptionEn:
      'Preparation structure for the Humanities group of the National University admission test — Bangla, English, General Knowledge and the Humanities group syllabus. BCS English practice is live now; full mock exams are still being prepared. Eduvelto.',
    crumbEn: 'Humanities Group',
  },
  '/admissions/national-university/science': {
    title: 'বিজ্ঞান শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিজ্ঞান শাখার প্রস্তুতির কাঠামো — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও বিজ্ঞান গ্রুপের সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto।',
    crumb: 'বিজ্ঞান শাখা',
    titleEn: 'Science Group — National University Admission Preparation | Eduvelto',
    descriptionEn:
      'Preparation structure for the Science group of the National University admission test — Bangla, English, General Knowledge and the Science group syllabus. BCS English practice is live now; full mock exams are still being prepared. Eduvelto.',
    crumbEn: 'Science Group',
  },
  '/admissions/national-university/business': {
    title: 'ব্যবসায় শিক্ষা শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ব্যবসায় শিক্ষা শাখার প্রস্তুতির কাঠামো — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও ব্যবসায় গ্রুপের সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে। Eduvelto।',
    crumb: 'ব্যবসায় শিক্ষা শাখা',
    titleEn: 'Business Studies Group — National University Admission Preparation | Eduvelto',
    descriptionEn:
      'Preparation structure for the Business Studies group of the National University admission test — Bangla, English, General Knowledge and the Business group syllabus. BCS English practice is live now; full mock exams are still being prepared. Eduvelto.',
    crumbEn: 'Business Studies Group',
  },
  '/library': {
    title: 'ডিজিটাল লাইব্রেরি — বিনামূল্যে বই ও প্রশ্নব্যাংক | Eduvelto',
    description:
      'Eduvelto ডিজিটাল লাইব্রেরি — শ্রেণি ও বিষয়ভিত্তিক বই, পাঠ ও প্রশ্নোত্তর — সম্পূর্ণ বিনামূল্যে।',
    crumb: 'লাইব্রেরি',
    titleEn: 'Digital Library — Free Books & Question Bank | Eduvelto',
    descriptionEn: 'The Eduvelto digital library — books, lessons and Q&A by class and subject — completely free.',
    crumbEn: 'Library',
  },
  '/class': {
    title: 'শ্রেণিভিত্তিক পড়াশোনা — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'শ্রেণি অনুযায়ী বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম।',
    crumb: 'শ্রেণি',
    titleEn: 'Study by Class — Books, Lessons & Exams | Eduvelto',
    descriptionEn:
      'Books, lessons and MCQ exams by class — completely free. Eduvelto — the free education platform of Bangladesh.',
    crumbEn: 'Classes',
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
    titleEn: 'Classes 1–5 — Primary | Eduvelto',
    descriptionEn:
      'Classes 1–5 (Primary) — books, lessons and exams have not reached the library yet; coming soon. Eduvelto — the free education platform of Bangladesh.',
    crumbEn: 'Classes 1–5',
  },
  '/class/class-6-8': {
    title: 'শ্রেণি ৬–৮ — নিম্ন মাধ্যমিক | Eduvelto',
    description:
      'শ্রেণি ৬–৮ (নিম্ন মাধ্যমিক) — বই, পাঠ ও পরীক্ষা এখনো লাইব্রেরিতে আসেনি, আসছে। Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম।',
    crumb: 'শ্রেণি ৬–৮',
    titleEn: 'Classes 6–8 — Lower Secondary | Eduvelto',
    descriptionEn:
      'Classes 6–8 (Lower Secondary) — books, lessons and exams have not reached the library yet; coming soon. Eduvelto — the free education platform of Bangladesh.',
    crumbEn: 'Classes 6–8',
  },
  '/class/class-9-10': {
    title: 'শ্রেণি ৯–১০ (SSC) — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'শ্রেণি ৯–১০ (মাধ্যমিক, SSC) — শ্রেণিভিত্তিক বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'শ্রেণি ৯–১০',
    titleEn: 'Classes 9–10 (SSC) — Books, Lessons & Exams | Eduvelto',
    descriptionEn: 'Classes 9–10 (Secondary, SSC) — class-wise books, lessons and MCQ exams — completely free. Eduvelto.',
    crumbEn: 'Classes 9–10',
  },
  '/class/hsc': {
    title: 'HSC — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'HSC (উচ্চ মাধ্যমিক) — শ্রেণিভিত্তিক বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'HSC',
    titleEn: 'HSC — Books, Lessons & Exams | Eduvelto',
    descriptionEn: 'HSC (Higher Secondary) — class-wise books, lessons and MCQ exams — completely free. Eduvelto.',
    crumbEn: 'HSC',
  },
  '/class/honours-masters': {
    title: 'অনার্স ও মাস্টার্স — বই, পাঠ ও পরীক্ষা | Eduvelto',
    description:
      'অনার্স ও মাস্টার্স (উচ্চশিক্ষা) — শ্রেণিভিত্তিক বই, পাঠ ও MCQ পরীক্ষা — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'অনার্স ও মাস্টার্স',
    titleEn: 'Honours & Masters — Books, Lessons & Exams | Eduvelto',
    descriptionEn:
      'Honours & Masters (higher education) — class-wise books, lessons and MCQ exams — completely free. Eduvelto.',
    crumbEn: 'Honours & Masters',
  },
  '/about': {
    title: 'Eduvelto সম্পর্কে — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'Eduvelto বাংলাদেশের শিক্ষার্থীদের জন্য একটি বিনামূল্যের ডিজিটাল শিক্ষা প্ল্যাটফর্ম — পাঠ, পরীক্ষা ও ডিজিটাল লাইব্রেরি এক জায়গায়।',
    crumb: 'আমাদের সম্পর্কে',
    titleEn: 'About Eduvelto — the Free Education Platform of Bangladesh',
    descriptionEn:
      'Eduvelto is a free digital education platform for the students of Bangladesh — lessons, exams and a digital library in one place.',
    crumbEn: 'About Us',
  },
  '/contact': {
    title: 'যোগাযোগ — Eduvelto',
    description:
      'Eduvelto-র সঙ্গে যোগাযোগ করুন — ahmmizan23@gmail.com। বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম সম্পর্কে জানতে লিখুন।',
    crumb: 'যোগাযোগ',
    titleEn: 'Contact — Eduvelto',
    descriptionEn:
      'Contact Eduvelto — ahmmizan23@gmail.com. Write to learn more about the free education platform of Bangladesh.',
    crumbEn: 'Contact',
  },
  '/privacy': {
    title: 'গোপনীয়তা নীতি — Eduvelto',
    description: 'Eduvelto-র গোপনীয়তা নীতি — আপনার তথ্য কীভাবে ব্যবহার হয়, তা জানুন।',
    crumb: 'গোপনীয়তা নীতি',
    titleEn: 'Privacy Policy — Eduvelto',
    descriptionEn: 'Eduvelto\'s privacy policy — learn how your information is used.',
    crumbEn: 'Privacy Policy',
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
    titleEn: 'Terms — Eduvelto',
    descriptionEn:
      'Eduvelto\'s terms — the rules for using the completely free education platform: accounts, login and privacy.',
    crumbEn: 'Terms',
  },
  '/health': {
    title: 'স্বাস্থ্য — সচেতনতামূলক তথ্য | Eduvelto',
    description:
      'স্বাস্থ্য সচেতনতামূলক তথ্য — ঔষধ, রোগ ও হাসপাতালের তথ্য। Eduvelto।',
    crumb: 'স্বাস্থ্য',
    titleEn: 'Health — Awareness Information | Eduvelto',
    descriptionEn: 'Health awareness information — medicines, diseases and hospital information. Eduvelto.',
    crumbEn: 'Health',
  },
  '/health/medicines': {
    title: 'ঔষধ নির্দেশিকা — ব্যবহার, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা | Eduvelto',
    description:
      'সাধারণ ঔষধের ব্যবহার, ধরন, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা — শুধুমাত্র যাচাইকৃত উৎস থেকে। এখানে কোনো ডোজ দেওয়া হয় না; ডোজ শুধুমাত্র ডাক্তারের পরামর্শ অনুযায়ী। Eduvelto।',
    crumb: 'ঔষধ নির্দেশিকা',
    titleEn: 'Medicine Guide — Uses, Side Effects & Warnings | Eduvelto',
    descriptionEn:
      'Uses, types, side effects and warnings for common medicines — from verified sources only. No dosages are given here; dosages only on a doctor’s advice. Eduvelto.',
    crumbEn: 'Medicine Guide',
  },
  '/health/diseases': {
    title: 'রোগের তথ্য — লক্ষণ, প্রতিরোধ ও কখন ডাক্তার দেখাবেন | Eduvelto',
    description:
      'সাধারণ রোগের লক্ষণ, প্রতিরোধ ও কখন ডাক্তার দেখাবেন — সাধারণ তথ্য, রোগ নির্ণয় নয়। Eduvelto।',
    crumb: 'রোগের তথ্য',
    titleEn: 'Disease Information — Symptoms, Prevention & When to See a Doctor | Eduvelto',
    descriptionEn:
      'Symptoms, prevention and when to see a doctor for common diseases — general information, not a diagnosis. Eduvelto.',
    crumbEn: 'Disease Information',
  },
  '/health/doctors': {
    title: 'ডাক্তার নির্দেশিকা — যাচাইকৃত ডাক্তার | Eduvelto',
    description:
      'যাচাইকৃত ডাক্তারদের তালিকা — এখনো কেউ তালিকাভুক্ত হয়নি; ডাক্তার যাচাই হলে এখানে দেখা যাবে। যাচাই ছাড়া কেউ "ভেরিফায়েড" হিসেবে দেখানো হয় না। Eduvelto।',
    crumb: 'ডাক্তার নির্দেশিকা',
    titleEn: 'Doctor Directory — Verified Doctors | Eduvelto',
    descriptionEn:
      'List of verified doctors — nobody is listed yet; doctors will appear here once verified. Nobody is shown as “verified” without verification. Eduvelto.',
    crumbEn: 'Doctor Directory',
  },
  '/health/hospitals': {
    title: 'হাসপাতাল ও ফার্মেসি — তথ্য | Eduvelto',
    description:
      'হাসপাতাল ও ফার্মেসির তথ্য — ঠিকানা ও যোগাযোগ। Eduvelto।',
    crumb: 'হাসপাতাল ও ফার্মেসি',
    titleEn: 'Hospitals & Pharmacies — Information | Eduvelto',
    descriptionEn: 'Hospital and pharmacy information — addresses and contact details. Eduvelto.',
    crumbEn: 'Hospitals & Pharmacies',
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
    titleEn: 'Everyday Life Services — Budget, Calculators & Guides | Eduvelto',
    descriptionEn:
      'Free everyday tools — budget, EMI and interest calculations, currency and unit conversion, planner, PDF tools, and health and government-service guides. Eduvelto.',
    crumbEn: 'Life Services',
  },
  '/life/budget': {
    title: 'বাজেট প্ল্যানার — আয়-ব্যয়ের হিসাব | Eduvelto',
    description:
      'মাসিক আয়-ব্যয়ের হিসাব রাখুন — বাসা ভাড়া, খাবার, যাতায়াত, পড়াশোনা ও স্বাস্থ্য খরচের হিসাব, সঞ্চয়ের লক্ষ্য। আপনার তথ্য শুধু আপনার ডিভাইসেই থাকে। Eduvelto।',
    crumb: 'বাজেট প্ল্যানার',
    titleEn: 'Budget Planner — Income & Expense Tracking | Eduvelto',
    descriptionEn:
      'Track monthly income and expenses — rent, food, transport, study and health costs, plus savings goals. Your information stays only on your device. Eduvelto.',
    crumbEn: 'Budget Planner',
  },
  '/life/calculators': {
    title: 'ক্যালকুলেটর — EMI, সুদ, শতাংশ, বয়স ও BMI | Eduvelto',
    description:
      'EMI, সরল ও চক্রবৃদ্ধি সুদ, শতাংশ, বয়স ও BMI ক্যালকুলেটর — সূত্রসহ ফলাফল, সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'ক্যালকুলেটর',
    titleEn: 'Calculators — EMI, Interest, Percentage, Age & BMI | Eduvelto',
    descriptionEn:
      'EMI, simple and compound interest, percentage, age and BMI calculators — results with formulas, completely free. Eduvelto.',
    crumbEn: 'Calculators',
  },
  '/life/converters': {
    title: 'কনভার্টার — মুদ্রা ও একক রূপান্তর | Eduvelto',
    description:
      'মুদ্রা রূপান্তর (নির্দেশক হার) ও একক রূপান্তর — দৈর্ঘ্য, ওজন, তাপমাত্রা, আয়তন, ক্ষেত্রফল, মণ-সের-তোলা-কাঠা-বিঘা সহ। Eduvelto।',
    crumb: 'কনভার্টার',
    titleEn: 'Converters — Currency & Unit Conversion | Eduvelto',
    descriptionEn:
      'Currency conversion (indicative rates) and unit conversion — length, weight, temperature, volume, area, including mon-ser-tola-katha-bigha. Eduvelto.',
    crumbEn: 'Converters',
  },
  '/life/planner': {
    title: 'দৈনিক প্ল্যানার — পড়াশোনা ও কাজের পরিকল্পনা | Eduvelto',
    description:
      'দিনের কাজ সাজান — পড়াশোনা, কাজ ও ব্যক্তিগত কাজের তালিকা, আজকের কাজ ও আগামী কাজ। আপনার তালিকা শুধু আপনার ডিভাইসেই থাকে। Eduvelto।',
    crumb: 'দৈনিক প্ল্যানার',
    titleEn: 'Daily Planner — Study & Work Planning | Eduvelto',
    descriptionEn:
      'Plan your day — study, work and personal task lists, today’s tasks and upcoming tasks. Your list stays only on your device. Eduvelto.',
    crumbEn: 'Daily Planner',
  },
  '/life/pdf-tools': {
    title: 'PDF টুলস — টেক্সট থেকে PDF ও PDF মার্জ | Eduvelto',
    description:
      'ব্রাউজারেই PDF তৈরি করুন — লেখা থেকে PDF, একাধিক PDF একসাথে মার্জ করুন। আপনার ফাইল ডিভাইস ছাড়ে না। Eduvelto।',
    crumb: 'PDF টুলস',
    titleEn: 'PDF Tools — Text to PDF & PDF Merge | Eduvelto',
    descriptionEn:
      'Create PDFs in your browser — from text to PDF, and merge several PDFs into one. Your files never leave your device. Eduvelto.',
    crumbEn: 'PDF Tools',
  },
  '/life/health': {
    title: 'স্বাস্থ্য সচেতনতা — খাবার, ব্যায়াম ও ঘুম | Eduvelto',
    description:
      'স্বাস্থ্য সচেতনতামূলক সাধারণ তথ্য — সুষম খাবার, শারীরিক পরিশ্রম, ঘুম ও হাত ধোয়া, কখন ডাক্তার দেখাবেন। সাধারণ তথ্য, চিকিৎসকের বিকল্প নয়। Eduvelto।',
    crumb: 'স্বাস্থ্য সচেতনতা',
    titleEn: 'Health Awareness — Food, Exercise & Sleep | Eduvelto',
    descriptionEn:
      'General health awareness information — balanced food, physical activity, sleep and handwashing, and when to see a doctor. General information, not a substitute for a doctor. Eduvelto.',
    crumbEn: 'Health Awareness',
  },
  '/life/government': {
    title: 'সরকারি সেবা গাইড — NID, পাসপোর্ট, জন্ম নিবন্ধন | Eduvelto',
    description:
      'জাতীয় পরিচয়পত্র, ই-পাসপোর্ট, জন্ম নিবন্ধন ও ড্রাইভিং লাইসেন্স — আবেদনের ধাপ, প্রয়োজনীয় কাগজপত্র ও অফিসিয়াল পোর্টালের লিংক। Eduvelto।',
    crumb: 'সরকারি সেবা',
    titleEn: 'Government Services Guide — NID, Passport, Birth Registration | Eduvelto',
    descriptionEn:
      'National ID card, e-passport, birth registration and driving licence — application steps, required documents and links to the official portals. Eduvelto.',
    crumbEn: 'Government Services',
  },
  '/life/travel': {
    title: 'ভ্রমণ তথ্য — জরুরি নম্বর ও দৈনন্দিন প্রয়োজন | Eduvelto',
    description:
      'জরুরি নম্বর ৯৯৯ সহ প্রয়োজনীয় যোগাযোগ, জরুরি অবস্থায় করণীয়, ট্রেন-বিমান-বাস ভ্রমণের তথ্য ও ভ্রমণের আগের চেকলিস্ট। Eduvelto।',
    crumb: 'ভ্রমণ তথ্য',
    titleEn: 'Travel Information — Emergency Numbers & Everyday Needs | Eduvelto',
    descriptionEn:
      'Essential contacts including emergency number 999, what to do in an emergency, train, flight and bus travel information, and a pre-travel checklist. Eduvelto.',
    crumbEn: 'Travel Information',
  },
  '/life/services': {
    title: 'সেবা নির্দেশিকা — প্রয়োজনীয় সেবা খুঁজুন | Eduvelto',
    description:
      'সরকারি সেবা, স্বাস্থ্য, শিক্ষা, চাকরি, অর্থ, ভ্রমণ ও দৈনন্দিন প্রয়োজন — অফিসিয়াল পোর্টাল ও Eduvelto-র টুল এক জায়গায়। Eduvelto।',
    crumb: 'সেবা নির্দেশিকা',
    titleEn: 'Services Directory — Find the Service You Need | Eduvelto',
    descriptionEn:
      'Government services, health, education, jobs, finance, travel and everyday needs — official portals and Eduvelto’s tools in one place. Eduvelto.',
    crumbEn: 'Services Directory',
  },
  '/ai-teacher': {
    title: 'AI শিক্ষক — শীঘ্রই আসছে | Eduvelto',
    description:
      'Eduvelto-র ব্যক্তিগত AI শিক্ষক শীঘ্রই আসছে। আপাতত বিনামূল্যে MCQ পরীক্ষা, লাইব্রেরি ও চাকরি-ভর্তি প্রস্তুতি ব্যবহার করুন।',
    crumb: 'AI শিক্ষক',
    titleEn: 'AI Teacher — Coming Soon | Eduvelto',
    descriptionEn:
      'Eduvelto’s personal AI teacher is coming soon. Until then, use the free MCQ exams, library and job and admission preparation.',
    crumbEn: 'AI Teacher',
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
    titleEn: 'Professional Skills — Coming Soon | Eduvelto',
    descriptionEn:
      'Eduvelto’s professional skills section is coming soon. Until then, use the job and admission preparation — completely free.',
    crumbEn: 'Professional Skills',
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
    titleEn: 'BCS English Practice — 35 Verified Questions | Eduvelto',
    descriptionEn:
      'BCS English practice — 35 verified questions: grammar, vocabulary and reading — completely free. Full mock exams are still being prepared. Eduvelto.',
    crumbEn: 'English',
  },
  '/jobs/bcs/practice/english/grammar': {
    title: 'বিসিএস ইংরেজি ব্যাকরণ অনুশীলন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলনের ব্যাকরণ অংশ — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন। Eduvelto।',
    crumb: 'ব্যাকরণ',
    titleEn: 'BCS English Grammar Practice | Eduvelto',
    descriptionEn: 'The grammar part of BCS English practice — practise free with verified questions. Eduvelto.',
    crumbEn: 'Grammar',
  },
  '/jobs/bcs/practice/english/vocabulary': {
    title: 'বিসিএস ইংরেজি শব্দভান্ডার অনুশীলন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলনের শব্দভান্ডার অংশ — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন। Eduvelto।',
    crumb: 'শব্দভান্ডার',
    titleEn: 'BCS English Vocabulary Practice | Eduvelto',
    descriptionEn: 'The vocabulary part of BCS English practice — practise free with verified questions. Eduvelto.',
    crumbEn: 'Vocabulary',
  },
  '/jobs/bcs/practice/english/reading': {
    title: 'বিসিএস ইংরেজি রিডিং অনুশীলন | Eduvelto',
    description:
      'বিসিএস ইংরেজি অনুশীলনের রিডিং অংশ — যাচাইকৃত প্রশ্ন দিয়ে বিনামূল্যে অনুশীলন করুন। Eduvelto।',
    crumb: 'রিডিং',
    titleEn: 'BCS English Reading Practice | Eduvelto',
    descriptionEn: 'The reading part of BCS English practice — practise free with verified questions. Eduvelto.',
    crumbEn: 'Reading',
  },
  '/learn/bcs-english-tense': {
    title: 'বিসিএস ইংরেজি টেন্স — পাঠ | Eduvelto',
    description:
      'বিসিএস ইংরেজি প্রস্তুতির জন্য টেন্সের খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়। সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'টেন্স',
    titleEn: 'BCS English Tense — Lesson | Eduvelto',
    descriptionEn:
      'A draft lesson on tense for BCS English preparation — awaiting teacher review. Completely free. Eduvelto.',
    crumbEn: 'Tense',
  },
  '/learn/bcs-english-preposition': {
    title: 'বিসিএস ইংরেজি প্রিপোজিশন — পাঠ | Eduvelto',
    description:
      'বিসিএস ইংরেজি প্রস্তুতির জন্য প্রিপোজিশনের খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়। সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'প্রিপোজিশন',
    titleEn: 'BCS English Preposition — Lesson | Eduvelto',
    descriptionEn:
      'A draft lesson on prepositions for BCS English preparation — awaiting teacher review. Completely free. Eduvelto.',
    crumbEn: 'Preposition',
  },
  // AdSense Part 1 (integration): /learn hub — the breadcrumb target
  // for the two lesson pages. Today /learn holds only the BCS English
  // lessons, so the crumb is 'বিসিএস ইংরেজি' (matches the lesson
  // breadcrumbs pinned by seo.test.ts); revisit when more subjects land.
  '/learn': {
    title: 'পাঠ — বিসিএস ইংরেজি | Eduvelto',
    description:
      'বিসিএস ইংরেজি পাঠ — টেন্স ও প্রিপোজিশনের খসড়া পাঠ এবং ৩৫টি যাচাইকৃত প্রশ্নের অনুশীলন — সম্পূর্ণ বিনামূল্যে। Eduvelto।',
    crumb: 'বিসিএস ইংরেজি',
    titleEn: 'Lessons — BCS English | Eduvelto',
    descriptionEn:
      'BCS English lessons — draft lessons on tense and prepositions, plus practice with 35 verified questions — completely free. Eduvelto.',
    crumbEn: 'BCS English',
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

/** English trails for STATIC_CRUMBS (24 Nov 2026, language system). */
const STATIC_CRUMBS_EN: Record<string, string[]> = {
  '/jobs/bcs/practice/english': ['Job Preparation', 'BCS', 'Practice', 'English'],
  '/jobs/bcs/practice/english/grammar': ['Job Preparation', 'BCS', 'Practice', 'English', 'Grammar'],
  '/jobs/bcs/practice/english/vocabulary': [
    'Job Preparation',
    'BCS',
    'Practice',
    'English',
    'Vocabulary',
  ],
  '/jobs/bcs/practice/english/reading': ['Job Preparation', 'BCS', 'Practice', 'English', 'Reading'],
  '/learn/bcs-english-tense': ['BCS English', 'Tense'],
  '/learn/bcs-english-preposition': ['BCS English', 'Preposition'],
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

function timeEn(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return h === 1 ? '1 hour' : `${h} hours`;
  }
  return `${minutes} minutes`;
}

function jobExamEntry(slug: string, tab?: string): RouteSeoEntry | null {
  const exam = jobExamBySlug(slug);
  if (!exam) return null;
  // Tab suffix uses the verified Bangla tab name; an unknown tab slug
  // falls back to the plain exam title (never a raw English slug).
  const tabBn = tab ? JOB_TABS.find((t) => t.slug === tab)?.bn : undefined;
  const tabEn = tab ? JOB_TABS.find((t) => t.slug === tab)?.en : undefined;
  const tabSuffix = tabBn ? ` — ${tabBn}` : '';
  const tabSuffixEn = tabEn ? ` — ${tabEn}` : '';

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
  const examBaseEn = exam.fullEn.replace(/ Exam$/, '');
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
  // English body — mirrors the Bangla chain above (same conditions,
  // same verified facts, Western digits).
  let bodyEn: string;
  if (slug === 'bank' && cfg && cfg.questionCount !== null && cfg.timeMinutes !== null) {
    bodyEn = `Preparation structure for the Bank Preliminary exam — verified subject split: ${cfg.questionCount} MCQ, ${timeEn(cfg.timeMinutes)} (Officer, Cash); negative marking unverified — the rate in the circular/admit card is final.`;
  } else if (
    cfg &&
    cfg.questionCount !== null &&
    cfg.timeMinutes !== null &&
    (status === 'verified' || status === 'last_verified')
  ) {
    const patternEn =
      status === 'last_verified'
        ? 'Last verified pattern (18th exam)'
        : 'Verified pattern';
    const negEn =
      cfg.negativeMarking === null || cfg.negativeMarking === undefined
        ? 'No negative marking'
        : `Negative marking −${Math.abs(cfg.negativeMarking).toFixed(2)}`;
    const passEn =
      cfg.passMark !== null && cfg.passMark !== undefined
        ? `, pass ${cfg.passMark} marks`
        : '';
    bodyEn = `${examBaseEn} exam preparation structure — ${patternEn}: ${cfg.questionCount} MCQ, ${timeEn(cfg.timeMinutes)}, ${negEn}${passEn}; subject-wise syllabus.`;
  } else if (slug === 'it-professional') {
    bodyEn = `${examBaseEn} exam preparation structure — scope not yet decided.`;
  } else {
    bodyEn = `${examBaseEn} exam preparation structure — exam pattern not yet verified (check the latest circular).`;
  }
  // AdSense Part 1 (integration): BCS English practice is live — say
  // so for the BCS hub only; every other exam keeps the honest
  // coming-soon wording. The "শীঘ্রই আসছে" phrase stays, pinned by
  // seo.test.ts ("never presents practice as live").
  const practiceNote =
    slug === 'bcs'
      ? 'BCS English MCQ অনুশীলন চালু আছে (Grammar, Vocabulary, Reading); অন্যান্য বিষয়ের MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে।'
      : 'MCQ অনুশীলন ও মক টেস্ট শীঘ্রই আসছে।';
  const practiceNoteEn =
    slug === 'bcs'
      ? 'BCS English MCQ practice is live (Grammar, Vocabulary, Reading); MCQ practice and mock tests for other subjects are coming soon.'
      : 'MCQ practice and mock tests are coming soon.';
  return {
    title: `${exam.bn} প্রস্তুতি — ${exam.fullBn}${tabSuffix} | Eduvelto`,
    description: `${body} ${practiceNote} Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: exam.bn,
    titleEn: `${exam.en} Preparation — ${exam.fullEn}${tabSuffixEn} | Eduvelto`,
    descriptionEn: `${bodyEn} ${practiceNoteEn} Completely free on Eduvelto.`,
    crumbEn: exam.en,
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
      titleEn: `${subj.nameEn} — ${exam.en} Preparation | Eduvelto`,
      descriptionEn: `${exam.fullEn} ${subj.nameEn} — ${subj.marks} marks in the verified syllabus. Topic-wise MCQ practice is live (Grammar, Vocabulary, Reading); mock tests are coming soon. Completely free on Eduvelto.`,
      crumbEn: subj.nameEn,
    };
  }
  return {
    title: `${subj.nameBn} — ${exam.bn} প্রস্তুতি | Eduvelto`,
    description: `${exam.fullBn} ${subj.nameBn} — যাচাইকৃত সিলেবাসে ${bnDigits(subj.marks)} নম্বর। টপিক ও অনুশীলন শীঘ্রই আসছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: subj.nameBn,
    titleEn: `${subj.nameEn} — ${exam.en} Preparation | Eduvelto`,
    descriptionEn: `${exam.fullEn} ${subj.nameEn} — ${subj.marks} marks in the verified syllabus. Topics and practice are coming soon. Completely free on Eduvelto.`,
    crumbEn: subj.nameEn,
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
    titleEn: `${subj.nameEn} — National University Admission Preparation (${group.en}) | Eduvelto`,
    descriptionEn: `In the ${group.en} group's admission test, ${subj.nameEn} carries ${subj.marks} marks — verified from the circular. Chapters and topics are given as drafts. Completely free on Eduvelto.`,
    crumbEn: subj.nameEn,
  };
}

/** Breadcrumb names for a static path, by walking its prefixes. */
function crumbsForStatic(path: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const segs = path.split('/').filter(Boolean);
  const out: string[] = [];
  let acc = '';
  for (const seg of segs) {
    acc += `/${seg}`;
    const entry = STATIC_ROUTES[acc];
    out.push(entry ? (lang === 'bn' ? entry.crumb : entry.crumbEn) : seg);
  }
  return out;
}

function breadcrumbFor(path: string, crumbs: string[], lang: 'bn' | 'en' = 'bn'): unknown {
  const items: unknown[] = [
    { '@type': 'ListItem', position: 1, name: lang === 'bn' ? 'হোম' : 'Home', item: `${SITE_URL}/` },
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
export function resolveRouteSeo(pathname: string, lang: 'bn' | 'en' = 'bn'): SeoData | null {
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
      if (entry && exam)
        crumbs =
          lang === 'bn' ? ['চাকরি প্রস্তুতি', exam.bn, entry.crumb] : ['Job Preparation', exam.en, entry.crumbEn];
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
        crumbs =
          lang === 'bn'
            ? ['ভর্তি প্রস্তুতি', 'জাতীয় বিশ্ববিদ্যালয়', group.bn, entry.crumb]
            : ['Admission Preparation', 'National University', group.en, entry.crumbEn];
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
      crumbs = lang === 'bn' ? ['চাকরি প্রস্তুতি', entry.crumb] : ['Job Preparation', entry.crumbEn];
      const tabName = tab ? JOB_TABS.find((t) => t.slug === tab)?.[lang] : undefined;
      if (tabName) crumbs.push(tabName);
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
        const descEn = seed.descriptionEn.length > 150 ? `${seed.descriptionEn.slice(0, 147)}…` : seed.descriptionEn;
        entry = {
          title: `${seed.titleBn} | Eduvelto`,
          description: `${desc} — অফিসিয়াল উৎসে যাচাইকৃত। Eduvelto।`,
          crumb: seed.titleBn,
          titleEn: `${seed.titleEn} | Eduvelto`,
          descriptionEn: `${descEn} — verified from an official source. Eduvelto.`,
          crumbEn: seed.titleEn,
        };
        crumbs = lang === 'bn' ? ['সুযোগ হাব', seed.titleBn] : ['Opportunity Hub', seed.titleEn];
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
      crumbs =
        lang === 'bn'
          ? ['ভর্তি প্রস্তুতি', 'জাতীয় বিশ্ববিদ্যালয়', entry?.crumb ?? groupMatch[1]]
          : ['Admission Preparation', 'National University', entry?.crumbEn ?? groupMatch[1]];
    } else {
      entry = STATIC_ROUTES['/admissions/national-university'];
      crumbs = lang === 'bn' ? ['ভর্তি প্রস্তুতি', entry.crumb] : ['Admission Preparation', entry.crumbEn];
    }
  }
  if (!entry) return null;
  if (crumbs.length === 0)
    crumbs = (lang === 'bn' ? STATIC_CRUMBS[path] : STATIC_CRUMBS_EN[path]) ?? crumbsForStatic(path, lang);

  const canonical = `${SITE_URL}${path === '/' ? '/' : path}`;
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: lang === 'bn' ? entry.title : entry.titleEn,
    description: lang === 'bn' ? entry.description : entry.descriptionEn,
    inLanguage: [lang],
    isPartOf: { '@id': 'https://eduvelto.com#website' },
  };
  const jsonLd: unknown[] = [ORGANIZATION_JSON_LD, WEBSITE_JSON_LD, webPage, breadcrumbFor(path, crumbs, lang)];
  if (path === '/jobs') {
    // ItemList (23 Nov 2026, Gemini fold-in): the hub renders a real
    // card grid of all 14 exam hubs — list them with their real URLs.
    // Only the jobs hub gets an ItemList; other hub lists are dynamic
    // (circulars — empty live) or login-gated, so no list is emitted.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'bn' ? 'চাকরি প্রস্তুতি — পরীক্ষা' : 'Job Preparation — Exams',
      itemListElement: JOB_EXAMS.map((exam, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: lang === 'bn' ? `${exam.bn} প্রস্তুতি` : `${exam.en} Preparation`,
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
      name: lang === 'bn' ? 'বিসিএস ইংরেজি অনুশীলন' : 'BCS English Practice',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: lang === 'bn' ? 'ব্যাকরণ অনুশীলন' : 'Grammar Practice',
          url: `${SITE_URL}/jobs/bcs/practice/english/grammar`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: lang === 'bn' ? 'শব্দভান্ডার অনুশীলন' : 'Vocabulary Practice',
          url: `${SITE_URL}/jobs/bcs/practice/english/vocabulary`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: lang === 'bn' ? 'রিডিং অনুশীলন' : 'Reading Practice',
          url: `${SITE_URL}/jobs/bcs/practice/english/reading`,
        },
      ],
    });
  }
  if (path === '/learn') {
    // ItemList (24 Nov 2026, SEO pass): the hub lists the two real
    // lessons plus the BCS English practice hub — the same three
    // links the page renders, in the same order.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'bn' ? 'বিসিএস ইংরেজি পাঠ' : 'BCS English Lessons',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: lang === 'bn' ? 'টেন্স — পাঠ' : 'Tense — Lesson',
          url: `${SITE_URL}/learn/bcs-english-tense`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: lang === 'bn' ? 'প্রিপোজিশন — পাঠ' : 'Preposition — Lesson',
          url: `${SITE_URL}/learn/bcs-english-preposition`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: lang === 'bn' ? 'বিসিএস ইংরেজি অনুশীলন' : 'BCS English Practice',
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
      name: lang === 'bn' ? 'যাচাইকৃত সুযোগ' : 'Verified Opportunities',
      itemListElement: OPPORTUNITY_SEED.filter((o) => isPublished(o)).map((o, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: lang === 'bn' ? o.titleBn : o.titleEn,
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
      headline: lang === 'bn' ? entry.title : entry.titleEn,
      description: lang === 'bn' ? entry.description : entry.descriptionEn,
      inLanguage: lang,
      datePublished: '2026-11-23',
      author: { '@id': 'https://eduvelto.com#organization' },
      publisher: { '@id': 'https://eduvelto.com#organization' },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
    });
  }
  return {
    title: lang === 'bn' ? entry.title : entry.titleEn,
    description: lang === 'bn' ? entry.description : entry.descriptionEn,
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
export function resolveFallbackSeo(pathname: string, lang: 'bn' | 'en' = 'bn'): SeoData | null {
  if (pathname.replace(/\/+$/, '') === '/founder') return null;
  const home = STATIC_ROUTES['/'];
  return {
    title: lang === 'bn' ? home.title : home.titleEn,
    description: lang === 'bn' ? home.description : home.descriptionEn,
    canonical: `${SITE_URL}/`,
    ogType: 'website',
    ogImage: OG_IMAGE_URL,
    robots: 'noindex, nofollow',
    jsonLd: [],
  };
}
