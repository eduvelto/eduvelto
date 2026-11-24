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
    title: 'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম: BCS, ব্যাংক, প্রাথমিক শিক্ষক, NTRCA ও ভর্তি প্রস্তুতি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — সম্পূর্ণ ফ্রি।',
    crumb: 'হোম',
    titleEn: 'Eduvelto — Bangladesh\'s Free Education Platform',
    descriptionEn:
      'Eduvelto — Bangladesh\'s free education platform: BCS, Bank, Primary Teacher, NTRCA and university admission, MCQ exams and a digital library, completely free.',
    crumbEn: 'Home',
  },
  '/why-eduvelto': {
    title: 'কেন Eduvelto — বাংলাদেশের ফ্রি শিক্ষা প্ল্যাটফর্ম',
    description:
      'কেন Eduvelto — বাংলাদেশের আস্থার ফ্রি শিক্ষা প্ল্যাটফর্ম: BCS, ব্যাংক, NTRCA ও জাতীয় বিশ্ববিদ্যালয় ভর্তি, MCQ পরীক্ষা ও ডিজিটাল লাইব্রেরি — বিনামূল্যে।',
    crumb: 'কেন Eduvelto',
    titleEn: 'Why Eduvelto — Bangladesh\'s Free Education Platform',
    descriptionEn:
      'Why Eduvelto aims to be Bangladesh\'s trusted free education platform — BCS, Bank, NTRCA preparation, MCQ exams and a digital library, 100% free.',
    crumbEn: 'Why Eduvelto',
  },
  '/jobs': {
    title: 'চাকরি প্রস্তুতি — BCS, ব্যাংক, NTRCA | Eduvelto',
    description:
      'BCS, ব্যাংক ও NTRCA প্রস্তুতির কাঠামো — ধরন, সিলেবাস ও বিষয়ভিত্তিক প্রস্তুতি। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'চাকরি প্রস্তুতি',
    titleEn: 'Job Preparation — BCS, Bank, NTRCA | Eduvelto',
    descriptionEn:
      'BCS, Bank, Primary Teacher, NTRCA preparation — patterns, syllabuses, subject-wise study. BCS English is live; full mocks coming soon. Free on Eduvelto.',
    crumbEn: 'Job Preparation',
  },
  '/jobs/common': {
    title: 'কমন বিষয় — চাকরি প্রস্তুতি | Eduvelto',
    description:
      'চাকরি পরীক্ষার কমন বিষয় — বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের প্রস্তুতির কাঠামো। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'কমন বিষয়',
    titleEn: 'Common Subjects — Job Preparation | Eduvelto',
    descriptionEn:
      'Common job-exam subjects — Bangla, English, Mathematics and General Knowledge preparation. BCS English is live; full mocks are still being prepared.',
    crumbEn: 'Common Subjects',
  },
  '/jobs/circulars': {
    title: 'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার | Eduvelto',
    description:
      'চাকরির বিজ্ঞপ্তি — যাচাইকৃত সার্কুলার, আবেদনের তারিখ ও অফিসিয়াল উৎস। নতুন বিজ্ঞপ্তি যাচাই হলে এখানে দেখাবে; অযাচাইকৃত তারিখ কখনো দেখানো হয় না।',
    crumb: 'বিজ্ঞপ্তি',
    titleEn: 'Job Circulars — Verified Circulars & Application Dates | Eduvelto',
    descriptionEn:
      'Job circulars — verified circulars, application dates and official sources. New circulars appear here once verified; unverified or estimated dates are never shown. Eduvelto.',
    crumbEn: 'Circulars',
  },
  '/opportunities': {
    title: 'সুযোগ হাব — যাচাইকৃত চাকরি, স্কলারশিপ | Eduvelto',
    description:
      'যাচাইকৃত সুযোগ — চাকরি, ফ্রিল্যান্সিং, ইন্টার্নশিপ, স্কলারশিপ। প্রতিটি সুযোগ অফিসিয়াল উৎস থেকে যাচাই করা; শেষ তারিখ না জানা থাকলে অনুমান করা হয় না।',
    crumb: 'সুযোগ হাব',
    titleEn: 'Opportunity Hub — Jobs, Scholarships, Internships | Eduvelto',
    descriptionEn:
      'Verified opportunities — jobs, remote work, freelancing, internships, scholarships, all verified from official sources; unknown deadlines are never guessed.',
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
    titleEn: 'Interview Preparation — Questions & STAR Method | Eduvelto',
    descriptionEn:
      'Interview preparation — common questions, answering with the STAR method, and a checklist for interview day. General guidance, no job guarantee.',
    crumbEn: 'Interview Preparation',
  },
  '/opportunities/career-guidance': {
    title: 'ক্যারিয়ার গাইড — পেশা বেছে নেওয়া ও দক্ষতার পথ | Eduvelto',
    description:
      'ক্যারিয়ার গাইড — পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিংয়ের সৎ তুলনা। সাধারণ নির্দেশনা, কোনো অফিসিয়াল সিলেবাস নয়। Eduvelto।',
    crumb: 'ক্যারিয়ার গাইড',
    titleEn: 'Career Guide — Choosing a Profession | Eduvelto',
    descriptionEn:
      'Career guide — choosing a profession and skills, comparing government, private and freelancing work honestly. General guidance, not an official syllabus.',
    crumbEn: 'Career Guide',
  },
  '/opportunities/entrepreneurship': {
    title: 'উদ্যোক্তা গাইড — আইডিয়া যাচাই ও হিসাব রাখা | Eduvelto',
    description:
      'উদ্যোক্তা গাইড — আইডিয়া যাচাই, ছোট করে শুরু, লাভ-ক্ষতির হিসাব ও অনলাইনে সৎভাবে বিক্রি। সাধারণ নির্দেশনা, আয়ের কোনো প্রতিশ্রুতি নয়। Eduvelto।',
    crumb: 'উদ্যোক্তা গাইড',
    titleEn: 'Entrepreneurship Guide — Ideas & Accounts | Eduvelto',
    descriptionEn:
      'Entrepreneurship guide — validating an idea, starting small, tracking profit and loss, and selling honestly online. General guidance, no promise of income.',
    crumbEn: 'Entrepreneurship Guide',
  },
  '/opportunities/income': {
    title: 'বৈধ অনলাইন আয় — বাস্তব পথ ও প্রতারণা চেনা | Eduvelto',
    description:
      'বৈধ অনলাইন আয় — ফ্রিল্যান্সিং, ডিজিটাল পণ্য, কনটেন্ট ও অ্যাফিলিয়েটের বাস্তব চিত্র, প্রতারণা চেনার উপায় ও শুরুর ধাপ। আয়ের কোনো প্রতিশ্রুতি নয়। Eduvelto।',
    crumb: 'বৈধ অনলাইন আয়',
    titleEn: 'Legitimate Online Income — Real Paths & Scams | Eduvelto',
    descriptionEn:
      'Legitimate online income — freelancing, digital products, content and affiliate work, how to spot scams, and the first steps. No promise of income.',
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
      'Guide to job viva preparation — common questions, introducing yourself, body language and a checklist for viva day. General guidance, no job guarantee.',
    crumbEn: 'Viva Preparation',
  },
  '/jobs/career': {
    title: 'ক্যারিয়ার পরিকল্পনা — চাকরির পথ বেছে নেওয়া | Eduvelto',
    description:
      'ক্যারিয়ার পরিকল্পনা — পেশা বেছে নেওয়া, দক্ষতার পথ, সরকারি–বেসরকারি–ফ্রিল্যান্সিংয়ের সৎ তুলনা। সাধারণ নির্দেশনা, কোনো অফিসিয়াল সিলেবাস নয়। Eduvelto।',
    crumb: 'ক্যারিয়ার গাইড',
    titleEn: 'Career Planning — Choosing Your Job Path | Eduvelto',
    descriptionEn:
      'Career planning — choosing a profession and skills, comparing government, private and freelancing work honestly. General guidance, not an official syllabus.',
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
      'বিশ্ববিদ্যালয় ভর্তি প্রস্তুতির কাঠামো — জাতীয় বিশ্ববিদ্যালয় অনার্সসহ ধরন ও সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'ভর্তি প্রস্তুতি',
    titleEn: 'Admission Preparation — University Admission | Eduvelto',
    descriptionEn:
      'University admission preparation — patterns and syllabuses, including National University honours. BCS English is live; mocks coming soon. Free on Eduvelto.',
    crumbEn: 'Admission Preparation',
  },
  '/admissions/national-university': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি — অনার্স ১ম বর্ষ | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় অনার্স ১ম বর্ষ ভর্তি — ১০০ MCQ, ১ ঘণ্টা, নেগেটিভ মার্কিং নেই। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয়',
    titleEn: 'National University Admission — Honours 1st Year | Eduvelto',
    descriptionEn:
      'National University Honours admission: 100 MCQ, 1 hour, no negative marking. Bangla, English, General Knowledge. BCS English live; mocks coming soon.',
    crumbEn: 'National University',
  },
  '/admissions/national-university/humanities': {
    title: 'মানবিক শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তির মানবিক শাখা — বাংলা, ইংরেজি ও মানবিক সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'মানবিক শাখা',
    titleEn: 'Humanities — National University Admission | Eduvelto',
    descriptionEn:
      'Humanities group — National University admission: Bangla, English, General Knowledge and the Humanities syllabus. BCS English is live; mocks coming soon.',
    crumbEn: 'Humanities Group',
  },
  '/admissions/national-university/science': {
    title: 'বিজ্ঞান শাখা — জাতীয় বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তির বিজ্ঞান শাখা — বাংলা, ইংরেজি ও বিজ্ঞান সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'বিজ্ঞান শাখা',
    titleEn: 'Science — National University Admission | Eduvelto',
    descriptionEn:
      'Science group — National University admission: Bangla, English, General Knowledge and the Science syllabus. BCS English is live; mocks coming soon.',
    crumbEn: 'Science Group',
  },
  '/admissions/national-university/business': {
    title: 'ব্যবসায় শিক্ষা — জাতীয় বিশ্ববিদ্যালয় ভর্তি | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তির ব্যবসায় শিক্ষা শাখা — বাংলা, ইংরেজি ও ব্যবসায় সিলেবাস। বিসিএস ইংরেজি অনুশীলন এখন চালু; পূর্ণাঙ্গ মক পরীক্ষা এখনো প্রস্তুত হচ্ছে।',
    crumb: 'ব্যবসায় শিক্ষা শাখা',
    titleEn: 'Business Studies — National University Admission | Eduvelto',
    descriptionEn:
      'Business Studies group — National University admission: Bangla, English, General Knowledge and the Business syllabus. BCS English is live; mocks coming soon.',
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
  // Trust pages (24 Nov 2026, brand-SEO wave 1, F-08): the four
  // policy pages Google expects — editorial policy, content
  // accuracy, certificate policy (plain: no certificates of any
  // kind) and disclaimer. Each has a real page + footer link.
  '/editorial-policy': {
    title: 'সম্পাদকীয় নীতি | Eduvelto',
    description:
      'Eduvelto-র বিষয়বস্তু কীভাবে তৈরি, যাচাই ও সংশোধন করা হয় — তার নীতি।',
    crumb: 'সম্পাদকীয় নীতি',
    titleEn: 'Editorial Policy | Eduvelto',
    descriptionEn:
      'Eduvelto’s policy on how content is created, reviewed and corrected.',
    crumbEn: 'Editorial Policy',
  },
  '/content-accuracy': {
    title: 'বিষয়বস্তুর নির্ভুলতা নীতি | Eduvelto',
    description:
      'Eduvelto-র তথ্য কতটা নির্ভরযোগ্য, "যাচাইকৃত" মানে কী এবং গুরুত্বপূর্ণ তারিখ ও ফি কোথায় যাচাই করবেন।',
    crumb: 'বিষয়বস্তুর নির্ভুলতা',
    titleEn: 'Content Accuracy Policy | Eduvelto',
    descriptionEn:
      'How reliable Eduvelto’s information is, what “verified” means, and where to check important dates and fees.',
    crumbEn: 'Content Accuracy',
  },
  '/certificate-policy': {
    title: 'সার্টিফিকেট নীতি | Eduvelto',
    description:
      'Eduvelto কোনো সার্টিফিকেট দেয় না — অনুশীলন পরীক্ষার নম্বর শুধু নিজের মূল্যায়নের জন্য।',
    crumb: 'সার্টিফিকেট নীতি',
    titleEn: 'Certificate Policy | Eduvelto',
    descriptionEn:
      'Eduvelto issues no certificates — practice test scores are for self-assessment only.',
    crumbEn: 'Certificate Policy',
  },
  '/disclaimer': {
    title: 'দায়বর্জন | Eduvelto',
    description:
      'Eduvelto-র তথ্য শুধু শিক্ষামূলক — এটি পেশাদার পরামর্শ নয়। গুরুত্বপূর্ণ তথ্য অফিসিয়াল উৎস থেকে যাচাই করুন।',
    crumb: 'দায়বর্জন',
    titleEn: 'Disclaimer | Eduvelto',
    descriptionEn:
      'Eduvelto’s information is educational only — it is not professional advice. Verify important information against official sources.',
    crumbEn: 'Disclaimer',
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
    title: 'ঔষধ নির্দেশিকা — ব্যবহার ও সতর্কতা | Eduvelto',
    description:
      'সাধারণ ঔষধের ব্যবহার, ধরন, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা — শুধুমাত্র যাচাইকৃত উৎস থেকে। এখানে কোনো ডোজ দেওয়া হয় না; ডোজ শুধু ডাক্তারের পরামর্শে।',
    crumb: 'ঔষধ নির্দেশিকা',
    titleEn: 'Medicine Guide — Uses, Side Effects & Warnings | Eduvelto',
    descriptionEn:
      'Uses, types, side effects and warnings for common medicines — from verified sources only. No dosages are given here; dosages only on a doctor’s advice. Eduvelto.',
    crumbEn: 'Medicine Guide',
  },
  '/health/diseases': {
    title: 'রোগের তথ্য — লক্ষণ ও প্রতিরোধ | Eduvelto',
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
    titleEn: 'Everyday Life Services — Budget & Calculators | Eduvelto',
    descriptionEn:
      'Free everyday tools — budget, EMI and interest calculations, currency and unit conversion, planner, PDF tools, and health and government-service guides.',
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
    titleEn: 'EMI, Interest, Percentage, Age & BMI Calculators | Eduvelto',
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
      'General health awareness — balanced food, activity, sleep and handwashing, and when to see a doctor. General information, not a substitute for a doctor.',
    crumbEn: 'Health Awareness',
  },
  '/life/government': {
    title: 'সরকারি সেবা গাইড — NID, পাসপোর্ট, জন্ম নিবন্ধন | Eduvelto',
    description:
      'জাতীয় পরিচয়পত্র, ই-পাসপোর্ট, জন্ম নিবন্ধন ও ড্রাইভিং লাইসেন্স — আবেদনের ধাপ, প্রয়োজনীয় কাগজপত্র ও অফিসিয়াল পোর্টালের লিংক। Eduvelto।',
    crumb: 'সরকারি সেবা',
    titleEn: 'NID, Passport & Birth Registration Guide | Eduvelto',
    descriptionEn:
      'National ID card, e-passport, birth registration and driving licence — application steps, required documents and links to the official portals. Eduvelto.',
    crumbEn: 'Government Services',
  },
  '/life/travel': {
    title: 'ভ্রমণ তথ্য — জরুরি নম্বর ও দৈনন্দিন প্রয়োজন | Eduvelto',
    description:
      'জরুরি নম্বর ৯৯৯ সহ প্রয়োজনীয় যোগাযোগ, জরুরি অবস্থায় করণীয়, ট্রেন-বিমান-বাস ভ্রমণের তথ্য ও ভ্রমণের আগের চেকলিস্ট। Eduvelto।',
    crumb: 'ভ্রমণ তথ্য',
    titleEn: 'Travel Information — Emergency Numbers | Eduvelto',
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
    titleEn: 'AI Assistant — Everyday Calculations & Letters | Eduvelto',
    descriptionEn:
      'Eduvelto\'s AI Assistant — calculations, converters, budget, planning, letters, applications, CVs and phrases — free to use now. Live AI answers are coming soon.',
    crumbEn: 'AI Assistant',
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
  // for the two lesson pages. REVISED 24 Nov 2026 (brand-SEO wave 1):
  // the hub now also lists the 10 public guides, so the title/crumb
  // cover guides + lessons (the lesson breadcrumbs pinned by
  // seo.test.ts still start with 'বিসিএস ইংরেজি' via STATIC_CRUMBS).
  '/learn': {
    title: 'পাঠ ও গাইড — ফ্রি প্রস্তুতি | Eduvelto',
    description:
      'ফ্রি পাঠ ও গাইড — চাকরি ও ভর্তি প্রস্তুতি, ইংরেজি, CV, পড়ার কৌশল ও জীবনদক্ষতা। খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়; বিসিএস ইংরেজি — ৩৫টি যাচাইকৃত প্রশ্ন।',
    crumb: 'পাঠ',
    titleEn: 'Lessons & Guides — Free Preparation | Eduvelto',
    descriptionEn:
      'Free lessons and guides — job preparation, English, CV and study techniques. Draft lessons awaiting teacher review; BCS English — 35 verified questions.',
    crumbEn: 'Lessons',
  },
  // Public guides (24 Nov 2026, brand-SEO wave 1; EXTENDED wave 2
  // and wave 3: 23 original static guides, no login, zero Firestore
  // reads (see src/lib/publicGuides.ts). Every guide is a draft awaiting
  // teacher review — the description says so plainly, like the two
  // BCS English lessons above; never "যাচাইকৃত"/"অনুমোদিত".
  '/learn/bcs-preparation-guide': {
    title: 'বিসিএস প্রিলিমিনারি প্রস্তুতি গাইড | Eduvelto',
    description:
      'বিসিএস প্রিলিমিনারি প্রস্তুতি কীভাবে শুরু করবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'বিসিএস প্রস্তুতি',
    titleEn: 'BCS Preliminary Preparation Guide | Eduvelto',
    descriptionEn:
      'How to start preparing for the BCS Preliminary exam — the exam pattern and a study plan, in Eduvelto’s free guide. Draft lesson — awaiting teacher review.',
    crumbEn: 'BCS Preparation',
  },
  '/learn/bank-job-preparation': {
    title: 'ব্যাংক চাকরির প্রস্তুতি গাইড | Eduvelto',
    description:
      'ব্যাংকে চাকরির পরীক্ষার প্রস্তুতি কীভাবে নেবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ব্যাংক চাকরি',
    titleEn: 'Bank Job Preparation Guide | Eduvelto',
    descriptionEn:
      'How to prepare for bank job exams — the exam pattern, a study plan and common mistakes, in Eduvelto’s free guide. Draft lesson — awaiting teacher review.',
    crumbEn: 'Bank Jobs',
  },
  '/learn/primary-teacher-preparation': {
    title: 'প্রাথমিক সহকারী শিক্ষক নিয়োগ প্রস্তুতি গাইড | Eduvelto',
    description:
      'প্রাথমিক সহকারী শিক্ষক নিয়োগ প্রস্তুতি কীভাবে নেবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'প্রাথমিক শিক্ষক',
    titleEn: 'Primary Teacher Preparation Guide | Eduvelto',
    descriptionEn:
      'How to prepare for the primary assistant teacher exam — the exam pattern and a study plan, in Eduvelto’s free guide. Draft lesson — awaiting teacher review.',
    crumbEn: 'Primary Teacher',
  },
  '/learn/ntrca-preparation': {
    title: 'NTRCA শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি গাইড | Eduvelto',
    description:
      'NTRCA শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি কীভাবে নেবেন — পরীক্ষার ধরণ, পড়ার পরিকল্পনা ও সাধারণ ভুল। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'NTRCA প্রস্তুতি',
    titleEn: 'NTRCA Teacher Registration Exam Preparation Guide | Eduvelto',
    descriptionEn:
      'How to prepare for the NTRCA teacher registration exam — the exam pattern and a study plan, in Eduvelto’s free guide. Draft lesson — awaiting teacher review.',
    crumbEn: 'NTRCA Preparation',
  },
  '/learn/nu-admission-guide': {
    title: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি গাইড | Eduvelto',
    description:
      'জাতীয় বিশ্ববিদ্যালয় ভর্তি — ধরণ, মেধাতালিকা ও প্রস্তুতি। ২০২৬–২৭ শিক্ষাবর্ষের বিজ্ঞপ্তি এখনো প্রকাশিত হয়নি; খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি',
    titleEn: 'National University Admission Guide | Eduvelto',
    descriptionEn:
      'National University admission — pattern, merit list and preparation. The 2026–27 circular is not published yet. Draft lesson — awaiting teacher review.',
    crumbEn: 'National University Admission',
  },
  '/learn/english-grammar-basics': {
    title: 'ইংরেজি ব্যাকরণ — Parts of Speech ও Tense | Eduvelto',
    description:
      'ইংরেজি ব্যাকরণের মৌলিক বিষয় সহজ বাংলায় — Parts of Speech, Tense ও বাক্য গঠন। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ইংরেজি ব্যাকরণ',
    titleEn: 'English Grammar Basics — Parts of Speech & Tense | Eduvelto',
    descriptionEn:
      'English grammar basics in simple Bangla — Parts of Speech, Tense and sentence structure. Draft lesson — awaiting teacher review.',
    crumbEn: 'English Grammar',
  },
  '/learn/scholarship-guide': {
    title: 'বৃত্তি গাইড — আবেদন, কাগজপত্র ও সময়সীমা | Eduvelto',
    description:
      'স্কলারশিপ কীভাবে কাজ করে, আবেদন ও কাগজপত্র — Commonwealth Shared Scholarships-এর উদাহরণসহ Eduvelto-র ফ্রি গাইড। খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'বৃত্তি গাইড',
    titleEn: 'Scholarship Guide — Applications & Documents | Eduvelto',
    descriptionEn:
      'How scholarships work — applications and documents, with the Commonwealth Shared Scholarships as an example. Draft lesson — awaiting teacher review.',
    crumbEn: 'Scholarship Guide',
  },
  '/learn/what-is-ai': {
    title: 'AI কী? শিক্ষার্থীদের জন্য সহজ ব্যাখ্যা | Eduvelto',
    description:
      'AI বা কৃত্রিম বুদ্ধিমত্তা কী, পড়াশোনায় AI কীভাবে ব্যবহার করবেন, আর এর সীমা ও সততার নিয়ম — Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'AI কী?',
    titleEn: 'What Is AI? A Simple Explanation for Students | Eduvelto',
    descriptionEn:
      'What AI is, how to use it in your studies, and its limits and honesty rules. Draft lesson — awaiting teacher review.',
    crumbEn: 'What Is AI?',
  },
  '/learn/cv-writing-guide': {
    title: 'CV লেখার গাইড — বাংলাদেশি চাকরির জন্য | Eduvelto',
    description:
      'বাংলাদেশে চাকরির জন্য ভালো CV কীভাবে লিখবেন — গঠন, প্রয়োজনীয় তথ্য ও সাধারণ ভুল নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'CV লেখা',
    titleEn: 'CV Writing Guide — For Jobs in Bangladesh | Eduvelto',
    descriptionEn:
      'How to write a good CV for jobs in Bangladesh — structure and essential information. Draft lesson — awaiting teacher review.',
    crumbEn: 'CV Writing',
  },
  '/learn/budget-planner-guide': {
    title: 'শিক্ষার্থীর মাসিক বাজেট পরিকল্পনা গাইড | Eduvelto',
    description:
      'শিক্ষার্থী হিসেবে মাসের খরচ কীভাবে পরিকল্পনা করবেন — আয়, জরুরি খরচ ও সঞ্চয়ের সহজ নিয়ম নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'মাসিক বাজেট',
    titleEn: 'Student Monthly Budget Planning Guide | Eduvelto',
    descriptionEn:
      'How to plan a month’s expenses as a student — income, essential spending and saving. Draft lesson — awaiting teacher review.',
    crumbEn: 'Monthly Budget',
  },
  // Public guides, wave 2 (24 Nov 2026, brand-SEO wave 2): 7 more
  // original static guides — revision, note-taking, time
  // management, English writing, online safety, Bangla spelling
  // and computer basics. Same draft treatment as wave 1.
  '/learn/revision-strategy': {
    title: 'পরীক্ষার আগে পুনরালোচনার কৌশল | Eduvelto',
    description:
      'পরীক্ষার আগে পুনরালোচনা কীভাবে করবেন — পরিকল্পনা, নিজের নোট ও নিজেকে যাচাই নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'পুনরালোচনার কৌশল',
    titleEn: 'Revision Strategy Before Exams | Eduvelto',
    descriptionEn:
      'How to revise before an exam — planning, your own notes and self-testing. Draft lesson — awaiting teacher review.',
    crumbEn: 'Revision Strategy',
  },
  '/learn/note-taking-guide': {
    title: 'কার্যকর নোট নেওয়ার কৌশল | Eduvelto',
    description:
      'কার্যকর নোট কীভাবে নেবেন — নিজের ভাষায় লেখা, মূল ধারণা, চিহ্ন ও নিয়মিত ঝালিয়ে নেওয়া নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'নোট নেওয়ার কৌশল',
    titleEn: 'Effective Note-Taking Techniques | Eduvelto',
    descriptionEn:
      'How to take effective notes — writing in your own words, main ideas, marks and regular review, in Eduvelto’s free guide. Draft lesson — awaiting teacher review.',
    crumbEn: 'Note-Taking Techniques',
  },
  '/learn/time-management-students': {
    title: 'শিক্ষার্থীদের সময় ব্যবস্থাপনা | Eduvelto',
    description:
      'শিক্ষার্থী হিসেবে সময় কীভাবে ব্যবস্থাপনা করবেন — রুটিন, ছোট ভাগে পড়া ও বিশ্রাম নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'সময় ব্যবস্থাপনা',
    titleEn: 'Time Management for Students | Eduvelto',
    descriptionEn:
      'How to manage time as a student — a routine, short study blocks and rest. Draft lesson — awaiting teacher review.',
    crumbEn: 'Time Management',
  },
  '/learn/english-writing-basics': {
    title: 'ইংরেজি লেখার মৌলিক নিয়ম | Eduvelto',
    description:
      'ইংরেজি লেখার মৌলিক নিয়ম — ছোট বাক্য, Subject-Verb মিল ও যতিচিহ্ন, নিজের লেখা উদাহরণসহ। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ইংরেজি লেখা',
    titleEn: 'English Writing Basics | Eduvelto',
    descriptionEn:
      'English writing basics in simple Bangla — short sentences, subject-verb agreement and punctuation. Draft lesson — awaiting teacher review.',
    crumbEn: 'English Writing',
  },
  '/learn/online-safety-guide': {
    title: 'অনলাইনে নিরাপদ থাকার নিয়ম | Eduvelto',
    description:
      'অনলাইনে নিরাপদ থাকার নিয়ম — শক্তিশালী পাসওয়ার্ড, OTP না দেওয়া ও অচেনা লিংক নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'অনলাইন নিরাপত্তা',
    titleEn: 'Online Safety Guide for Students | Eduvelto',
    descriptionEn:
      'How to stay safe online — strong passwords, never sharing OTP codes and unknown links. Draft lesson — awaiting teacher review.',
    crumbEn: 'Online Safety',
  },
  '/learn/bangla-spelling-common-mistakes': {
    title: 'বাংলা বানানের সাধারণ ভুল | Eduvelto',
    description:
      'বাংলা বানানের সাধারণ ভুল — কি-কী, ণ-ন, ষ-স ও আধুনিক বানানের নিয়ম, নিজের লেখা উদাহরণসহ। Eduvelto-র ফ্রি গাইড — খসড়া পাঠ, শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'বাংলা বানান',
    titleEn: 'Common Bangla Spelling Mistakes | Eduvelto',
    descriptionEn:
      'Common Bangla spelling mistakes and the simple rules that prevent them. Draft lesson — awaiting teacher review.',
    crumbEn: 'Bangla Spelling',
  },
  '/learn/computer-basics-students': {
    title: 'কম্পিউটার ও ইন্টারনেটের মৌলিক ধারণা | Eduvelto',
    description:
      'কম্পিউটার ও ইন্টারনেটের মৌলিক ধারণা — ফাইল ও ফোল্ডার, লেখালেখি, ব্রাউজার ও ইমেইল নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'কম্পিউটারের মৌলিক ধারণা',
    titleEn: 'Computer and Internet Basics for Students | Eduvelto',
    descriptionEn:
      'Computer and internet basics for students — files and folders, word processing and browsers. Draft lesson — awaiting teacher review.',
    crumbEn: 'Computer Basics',
  },
  // Public guides, wave 3 (24 Nov 2026, brand-SEO wave 3): 6 more
  // original static guides — exam day, MCQ techniques, memory
  // techniques, job-seeker routine, healthy habits and digital
  // skills. Same draft treatment as waves 1–2. Money management
  // was SKIPPED: /learn/budget-planner-guide already covers student
  // budgeting and /life/budget is the budget tool.
  '/learn/exam-day-strategy': {
    title: 'পরীক্ষার দিনের কৌশল | Eduvelto',
    description:
      'পরীক্ষার দিন কী করবেন — আগের রাতের প্রস্তুতি, সকালের পরিকল্পনা ও উত্তর দেওয়ার নিয়ম নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'পরীক্ষার দিনের কৌশল',
    titleEn: 'Exam Day Strategy | Eduvelto',
    descriptionEn:
      'What to do on exam day — the night-before preparation, the morning plan and answering rules. Draft lesson — awaiting teacher review.',
    crumbEn: 'Exam Day Strategy',
  },
  '/learn/mcq-answering-techniques': {
    title: 'MCQ উত্তর দেওয়ার কৌশল | Eduvelto',
    description:
      'MCQ প্রশ্নের উত্তর দেওয়ার কৌশল — পুরো প্রশ্ন পড়া, ভুল অপশন বাদ দেওয়া ও সময়ের হিসাব নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'MCQ উত্তর দেওয়ার কৌশল',
    titleEn: 'MCQ Answering Techniques | Eduvelto',
    descriptionEn:
      'Techniques for answering MCQ questions — reading the full question, eliminating wrong options and managing time. Draft lesson — awaiting teacher review.',
    crumbEn: 'MCQ Answering Techniques',
  },
  '/learn/memory-techniques-students': {
    title: 'মনে রাখার কৌশল | Eduvelto',
    description:
      'পড়া মনে রাখার কৌশল — বুঝে পড়া, সংযোগ তৈরি করা ও নিজেকে যাচাই করা নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'মনে রাখার কৌশল',
    titleEn: 'Memory Techniques for Students | Eduvelto',
    descriptionEn:
      'Techniques for remembering what you study — understanding first, making connections and self-testing. Draft lesson — awaiting teacher review.',
    crumbEn: 'Memory Techniques',
  },
  '/learn/study-routine-job-seekers': {
    title: 'চাকরিপ্রার্থীদের পড়ার রুটিন | Eduvelto',
    description:
      'চাকরিপ্রার্থীদের পড়ার রুটিন — কাজের পাশে পড়ার সময় বের করা ও সপ্তাহের পরিকল্পনা নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'চাকরিপ্রার্থীদের রুটিন',
    titleEn: 'Study Routine for Job Seekers | Eduvelto',
    descriptionEn:
      'A study routine for job seekers — finding study time beside work and a weekly plan. Draft lesson — awaiting teacher review.',
    crumbEn: 'Job Seeker Routine',
  },
  '/learn/healthy-habits-students': {
    title: 'শিক্ষার্থীদের সুস্থ অভ্যাস | Eduvelto',
    description:
      'শিক্ষার্থীদের সুস্থ অভ্যাস — নিয়মিত ঘুম, খাওয়া, নড়াচড়া ও মনের চাপ সামলানো নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'সুস্থ অভ্যাস',
    titleEn: 'Healthy Habits for Students | Eduvelto',
    descriptionEn:
      'Healthy habits for students — regular sleep, meals, movement and handling stress. Draft lesson — awaiting teacher review.',
    crumbEn: 'Healthy Habits',
  },
  '/learn/digital-skills-basics': {
    title: 'ডিজিটাল দক্ষতার মৌলিক ধারণা | Eduvelto',
    description:
      'ডিজিটাল দক্ষতার মৌলিক ধারণা — টাইপ করা, লেখালেখি, স্প্রেডশিটে হিসাব ও তথ্য খোঁজা নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ডিজিটাল দক্ষতা',
    titleEn: 'Digital Skills Basics for Students | Eduvelto',
    descriptionEn:
      'Digital skills basics for students — typing, word processing, spreadsheets and searching for information. Draft lesson — awaiting teacher review.',
    crumbEn: 'Digital Skills',
  },
  '/learn/exam-anxiety-management': {
    title: 'পরীক্ষার উদ্বেগ সামলানো | Eduvelto',
    description:
      'পরীক্ষার উদ্বেগ সামলানো — কারণ চেনা, প্রস্তুতি শক্ত করা ও হলে শান্ত থাকার নিয়ম নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'পরীক্ষার উদ্বেগ',
    titleEn: 'Exam Anxiety Management | Eduvelto',
    descriptionEn:
      'Exam anxiety management — causes of worry, stronger preparation, breathing habits and staying calm in the exam hall. Draft lesson — awaiting teacher review.',
    crumbEn: 'Exam Anxiety',
  },
  '/learn/presentation-skills': {
    title: 'উপস্থাপনা দক্ষতা | Eduvelto',
    description:
      'উপস্থাপনা দক্ষতা — বিষয় জানা, গঠন সাজানো, অনুশীলন, শরীরের ভাষা ও প্রশ্নের উত্তর নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'উপস্থাপনা দক্ষতা',
    titleEn: 'Presentation Skills for Students | Eduvelto',
    descriptionEn:
      'Presentation skills for students — topic, structure, practice, body language and answering questions. Draft lesson — awaiting teacher review.',
    crumbEn: 'Presentation Skills',
  },
  '/learn/group-study-guide': {
    title: 'দলগত পড়াশোনা | Eduvelto',
    description:
      'দলগত পড়াশোনা — দল গঠন, নিয়ম, একে অন্যকে শেখানো, প্রশ্নোত্তর ও মনোযোগ নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'দলগত পড়াশোনা',
    titleEn: 'Group Study Guide | Eduvelto',
    descriptionEn:
      'Group study guide — forming a group, setting rules, teaching each other and staying focused. Draft lesson — awaiting teacher review.',
    crumbEn: 'Group Study',
  },
  '/learn/english-vocabulary-building': {
    title: 'ইংরেজি শব্দভান্ডার গড়া | Eduvelto',
    description:
      'ইংরেজি শব্দভান্ডার গড়া — প্রতিদিন নতুন শব্দ, বাক্যে ব্যবহার, শব্দের খাতা ও ঝালিয়ে নেওয়া নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ইংরেজি শব্দভান্ডার',
    titleEn: 'English Vocabulary Building | Eduvelto',
    descriptionEn:
      'English vocabulary building — a few new words daily, using them in sentences, a word notebook and revision. Draft lesson — awaiting teacher review.',
    crumbEn: 'English Vocabulary',
  },
  '/learn/effective-reading-habits': {
    title: 'কার্যকর পড়ার অভ্যাস | Eduvelto',
    description:
      'কার্যকর পড়ার অভ্যাস — উদ্দেশ্য, শান্ত পরিবেশ, নোট নেওয়া, প্রশ্ন করা ও ভাগে ভাগে পড়া নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'পড়ার অভ্যাস',
    titleEn: 'Effective Reading Habits | Eduvelto',
    descriptionEn:
      'Effective reading habits — purpose, quiet place, notes, quizzing yourself and reading in parts. Draft lesson — awaiting teacher review.',
    crumbEn: 'Reading Habits',
  },
  '/learn/self-motivation-students': {
    title: 'নিজেকে অনুপ্রাণিত রাখা | Eduvelto',
    description:
      'নিজেকে অনুপ্রাণিত রাখা — লক্ষ্য মনে রাখা, ছোট ধাপে ভাগ করা, রুটিন ও অগ্রগতি নিয়ে Eduvelto-র ফ্রি গাইড। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'নিজেকে অনুপ্রাণিত রাখা',
    titleEn: 'Self-Motivation for Students | Eduvelto',
    descriptionEn:
      'Self-motivation for students — your goal, small steps, a routine and tracking progress. Draft lesson — awaiting teacher review.',
    crumbEn: 'Self-Motivation',
  },
  '/learn/how-to-use-free-library': {
    title: 'ফ্রি লাইব্রেরি ব্যবহার করা | Eduvelto',
    description:
      'Eduvelto-র ফ্রি লাইব্রেরি কীভাবে ব্যবহার করবেন — বই খোঁজা, অধ্যায় পড়া, বুকমার্ক ও অগ্রগতি। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ফ্রি লাইব্রেরি',
    titleEn: 'How to Use the Free Library | Eduvelto',
    descriptionEn:
      'How to use Eduvelto’s free library — finding books, reading chapters, bookmarks and progress. Draft lesson — awaiting teacher review.',
    crumbEn: 'Free Library',
  },
  '/learn/how-to-use-job-practice': {
    title: 'চাকরির অনুশীলন ব্যবহার করা | Eduvelto',
    description:
      'Eduvelto-তে চাকরির অনুশীলন কীভাবে করবেন — বিষয়ভিত্তিক অনুশীলন, ভুল উত্তর দেখা ও পরিকল্পনা। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'চাকরির অনুশীলন',
    titleEn: 'How to Use Job Practice | Eduvelto',
    descriptionEn:
      'How to practise for job exams on Eduvelto — subject-wise practice, reviewing wrong answers and planning. Draft lesson — awaiting teacher review.',
    crumbEn: 'Job Practice',
  },
  '/learn/how-to-use-ai-assistant': {
    title: 'AI লাইফ অ্যাসিস্ট্যান্ট ব্যবহার করা | Eduvelto',
    description:
      'Eduvelto-র AI লাইফ অ্যাসিস্ট্যান্ট কীভাবে ব্যবহার করবেন — হিসাব, রূপান্তর, পরিকল্পনা ও চিঠি লেখার সরঞ্জাম। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'AI অ্যাসিস্ট্যান্ট',
    titleEn: 'How to Use the AI Life Assistant | Eduvelto',
    descriptionEn:
      'How to use Eduvelto’s AI Life Assistant — calculators, converters, planners and letter-writing tools. Draft lesson — awaiting teacher review.',
    crumbEn: 'AI Assistant',
  },
  '/learn/how-to-use-opportunity-hub': {
    title: 'অপরচুনিটি হাব ব্যবহার করা | Eduvelto',
    description:
      'Eduvelto-র অপরচুনিটি হাব কীভাবে ব্যবহার করবেন — সুযোগ খোঁজা, CV তৈরি ও সাক্ষাৎকারের প্রস্তুতি। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'অপরচুনিটি হাব',
    titleEn: 'How to Use the Opportunity Hub | Eduvelto',
    descriptionEn:
      'How to use Eduvelto’s Opportunity Hub — finding opportunities, building a CV and preparing for interviews. Draft lesson — awaiting teacher review.',
    crumbEn: 'Opportunity Hub',
  },
  '/learn/how-to-use-life-services': {
    title: 'লাইফ সার্ভিস ব্যবহার করা | Eduvelto',
    description:
      'Eduvelto-র লাইফ সার্ভিস কীভাবে ব্যবহার করবেন — বাজেট, হিসাব, রূপান্তর, পরিকল্পনা ও দরকারি তথ্য। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'লাইফ সার্ভিস',
    titleEn: 'How to Use Everyday Life Services | Eduvelto',
    descriptionEn:
      'How to use Eduvelto’s Everyday Life Services — budget, calculators, converters, planning and useful information. Draft lesson — awaiting teacher review.',
    crumbEn: 'Life Services',
  },
  '/learn/spoken-english-practice': {
    title: 'ইংরেজিতে কথা বলার অনুশীলন | Eduvelto',
    description:
      'ইংরেজিতে কথা বলার অনুশীলন কীভাবে করবেন — প্রতিদিন বলা, আয়নার সামনে অনুশীলন ও ভুলকে ভয় না পাওয়া। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ইংরেজিতে কথা বলা',
    titleEn: 'Spoken English Practice | Eduvelto',
    descriptionEn:
      'How to practise speaking English — speaking every day, mirror practice and not fearing mistakes. Draft lesson — awaiting teacher review.',
    crumbEn: 'Spoken English',
  },
  '/learn/goal-setting-students': {
    title: 'শিক্ষার্থীদের লক্ষ্য নির্ধারণ | Eduvelto',
    description:
      'শিক্ষার্থীদের লক্ষ্য নির্ধারণ কীভাবে করবেন — ছোট লক্ষ্য, পরিকল্পনা ও অগ্রগতি দেখা। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'লক্ষ্য নির্ধারণ',
    titleEn: 'Goal Setting for Students | Eduvelto',
    descriptionEn:
      'How students can set goals — small goals, planning and tracking progress. Draft lesson — awaiting teacher review.',
    crumbEn: 'Goal Setting',
  },
  '/learn/staying-focused-studying': {
    title: 'পড়ায় মনোযোগ ধরে রাখা | Eduvelto',
    description:
      'পড়ায় মনোযোগ ধরে রাখার উপায় — মনোযোগ নষ্ট হয় যেসব কারণে, সেগুলো সামলানো ও বিরতি নেওয়া। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'মনোযোগ ধরে রাখা',
    titleEn: 'Staying Focused While Studying | Eduvelto',
    descriptionEn:
      'How to stay focused while studying — handling distractions and taking breaks. Draft lesson — awaiting teacher review.',
    crumbEn: 'Staying Focused',
  },
  '/learn/sleep-and-study': {
    title: 'ঘুম ও পড়াশোনা | Eduvelto',
    description:
      'ঘুম ও পড়াশোনার সম্পর্ক — নিয়মিত ঘুমের অভ্যাস, পরীক্ষার আগের রাত ও বিশ্রাম। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ঘুম ও পড়াশোনা',
    titleEn: 'Sleep and Study | Eduvelto',
    descriptionEn:
      'Sleep and study — regular sleep habits, the night before an exam and rest. Draft lesson — awaiting teacher review.',
    crumbEn: 'Sleep and Study',
  },
  '/learn/reading-comprehension-strategies': {
    title: 'পড়া বুঝে পড়ার কৌশল | Eduvelto',
    description:
      'পড়া বুঝে পড়ার কৌশল — প্রশ্ন করা, সারাংশ লেখা ও নিজের ভাষায় বোঝানো। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'পড়া বুঝে পড়া',
    titleEn: 'Reading Comprehension Strategies | Eduvelto',
    descriptionEn:
      'Reading comprehension strategies — asking questions, summarising and explaining in your own words. Draft lesson — awaiting teacher review.',
    crumbEn: 'Reading Comprehension',
  },
  '/learn/learning-with-phone': {
    title: 'ফোন দিয়ে পড়াশোনা | Eduvelto',
    description:
      'ফোন দিয়ে পড়াশোনা — নোট, সময় ধরে পড়া, ভিডিও দেখা ও মনোযোগ নষ্ট না করা। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ফোন দিয়ে পড়া',
    titleEn: 'Learning with Your Phone | Eduvelto',
    descriptionEn:
      'Learning with your phone — notes, timed study, watching lessons and avoiding distractions. Draft lesson — awaiting teacher review.',
    crumbEn: 'Learning with Phone',
  },
  '/learn/asking-questions-class': {
    title: 'ক্লাসে প্রশ্ন করা | Eduvelto',
    description:
      'ক্লাসে প্রশ্ন করার উপায় — কখন প্রশ্ন করবেন, কীভাবে গুছিয়ে বলবেন ও ভয় কাটাবেন। খসড়া পাঠ — শিক্ষক যাচাইয়ের অপেক্ষায়।',
    crumb: 'ক্লাসে প্রশ্ন করা',
    titleEn: 'Asking Questions in Class | Eduvelto',
    descriptionEn:
      'How to ask questions in class — when to ask, how to phrase it and how to lose the fear. Draft lesson — awaiting teacher review.',
    crumbEn: 'Asking Questions',
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
  // Brand-SEO wave 12: descriptions must fit <=160 chars, so the body
  // no longer repeats the (already long) full exam name — the title
  // carries it. Verified facts stay: pattern, MCQ count, time,
  // negative marking, pass mark (pinned by seo.test.ts per exam).
  let body: string;
  if (slug === 'bank' && cfg && cfg.questionCount !== null && cfg.timeMinutes !== null) {
    // Subject pattern verified, penalty NOT verified (Step 5 closure):
    // the config as a whole is not authoritative for scoring.
    body = `ব্যাংক প্রিলিমিনারি — যাচাইকৃত বিষয়বণ্টন: ${bnDigits(cfg.questionCount)} MCQ, ${timeBn(cfg.timeMinutes)} (অফিসার, ক্যাশ); নেগেটিভ মার্কিং অযাচাইকৃত।`;
  } else if (
    cfg &&
    cfg.questionCount !== null &&
    cfg.timeMinutes !== null &&
    (status === 'verified' || status === 'last_verified')
  ) {
    const pattern =
      status === 'last_verified'
        ? 'শেষ যাচাইকৃত ধরন (১৮তম)'
        : 'যাচাইকৃত ধরন';
    const neg =
      cfg.negativeMarking === null || cfg.negativeMarking === undefined
        ? 'নেগেটিভ মার্কিং নেই'
        : `নেগেটিভ মার্কিং −${bnDigits(Math.abs(cfg.negativeMarking).toFixed(2))}`;
    const pass =
      cfg.passMark !== null && cfg.passMark !== undefined
        ? `, পাস ${bnDigits(cfg.passMark)} নম্বর`
        : '';
    body = `প্রস্তুতির কাঠামো — ${pattern}: ${bnDigits(cfg.questionCount)} MCQ, ${timeBn(cfg.timeMinutes)}, ${neg}${pass}।`;
  } else if (slug === 'it-professional') {
    // Scope undecided (owner decision 13.8) — Step 6 builds no syllabus.
    body = `প্রস্তুতির কাঠামো — পরিধি নির্ধারণ বাকি।`;
  } else {
    body = `প্রস্তুতির কাঠামো — পরীক্ষার ধরন যাচাই বাকি (সর্বশেষ বিজ্ঞপ্তি দেখে নিন)।`;
  }
  // English body — mirrors the Bangla chain above (same conditions,
  // same verified facts, Western digits).
  let bodyEn: string;
  if (slug === 'bank' && cfg && cfg.questionCount !== null && cfg.timeMinutes !== null) {
    bodyEn = `Bank Preliminary — verified split: ${cfg.questionCount} MCQ, ${timeEn(cfg.timeMinutes)} (Officer, Cash); negative marking unverified.`;
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
    bodyEn = `${patternEn}: ${cfg.questionCount} MCQ, ${timeEn(cfg.timeMinutes)}, ${negEn}${passEn}.`;
  } else if (slug === 'it-professional') {
    bodyEn = `Scope not yet decided.`;
  } else {
    bodyEn = `Exam pattern not yet verified (check the latest circular).`;
  }
  // AdSense Part 1 (integration): BCS English practice is live — say
  // so for the BCS hub only; every other exam keeps the honest
  // coming-soon wording. The "শীঘ্রই আসছে" phrase stays, pinned by
  // seo.test.ts ("never presents practice as live").
  const practiceNote =
    slug === 'bcs'
      ? 'BCS English অনুশীলন চালু; বাকি MCQ ও মক টেস্ট শীঘ্রই আসছে।'
      : 'MCQ ও মক টেস্ট শীঘ্রই আসছে।';
  const practiceNoteEn =
    slug === 'bcs'
      ? 'BCS English MCQ practice is live; other MCQ and mock tests coming soon.'
      : 'MCQ and mock tests coming soon.';
  // Brand-SEO wave 12: titles must fit search-result length (<=60).
  // Keep the full exam name when it fits (BCS/Bank keep their pinned
  // full names); otherwise drop the middle full-name segment, and if
  // still over (long exam + long tab), drop 'প্রস্তুতি' too.
  const titleBnCandidates = [
    `${exam.bn} প্রস্তুতি — ${exam.fullBn}${tabSuffix} | Eduvelto`,
    `${exam.bn} প্রস্তুতি${tabSuffix} | Eduvelto`,
    `${exam.bn}${tabSuffix} | Eduvelto`,
  ];
  const titleEnCandidates = [
    `${exam.en} Preparation — ${exam.fullEn}${tabSuffixEn} | Eduvelto`,
    `${exam.en} Preparation${tabSuffixEn} | Eduvelto`,
    `${exam.en}${tabSuffixEn} | Eduvelto`,
  ];
  const titleBn = titleBnCandidates.find((t) => t.length <= 60) ?? titleBnCandidates[2];
  const titleEn = titleEnCandidates.find((t) => t.length <= 60) ?? titleEnCandidates[2];
  return {
    title: titleBn,
    description: `${body} ${practiceNote} Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: exam.bn,
    titleEn,
    descriptionEn: `${bodyEn} ${practiceNoteEn} Free on Eduvelto.`,
    crumbEn: exam.en,
  };
}

/** Short <title> forms for the two subject names that cannot fit
 *  <=60 chars even without 'প্রস্তুতি/Preparation' (brand-SEO wave
 *  12). Page copy (heading, breadcrumb, description) keeps the
 *  full name. */
const SUBJECT_SEO_SHORT: Record<string, { bn: string; en: string }> = {
  'bcs/geography': { bn: 'ভূগোল ও পরিবেশ', en: 'Geography & Environment' },
  'primary-teacher/general-knowledge': { bn: 'সাধারণ জ্ঞান', en: 'General Knowledge' },
};

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
      description: `${subj.nameBn} — যাচাইকৃত সিলেবাসে ${bnDigits(subj.marks)} নম্বর। MCQ অনুশীলন চালু আছে; মক টেস্ট শীঘ্রই আসছে। Eduvelto-তে ফ্রি।`,
      crumb: subj.nameBn,
      titleEn: `${subj.nameEn} — ${exam.en} Preparation | Eduvelto`,
      descriptionEn: `${subj.nameEn} — ${subj.marks} marks in the verified syllabus. MCQ practice is live; mock tests coming soon. Free on Eduvelto.`,
      crumbEn: subj.nameEn,
    };
  }
  // Brand-SEO wave 12: titles must fit <=60. Long subject names
  // (BCS Geography, Primary General Knowledge) overflow with the
  // full 'প্রস্তুতি/Preparation' form, so pick the first fitting
  // candidate: full name + Preparation, full name without it, then
  // the short name (parenthetical stripped, or the map below) with
  // and without Preparation. The full name always stays in the
  // breadcrumb + description + page heading.
  const shortBn =
    SUBJECT_SEO_SHORT[`${examSlug}/${subjectSlug}`]?.bn ?? subj.nameBn.replace(/\s*\(.*\)\s*$/, '');
  const shortEn =
    SUBJECT_SEO_SHORT[`${examSlug}/${subjectSlug}`]?.en ?? subj.nameEn.replace(/\s*\(.*\)\s*$/, '');
  const titleBnCandidates = [
    `${subj.nameBn} — ${exam.bn} প্রস্তুতি | Eduvelto`,
    `${subj.nameBn} — ${exam.bn} | Eduvelto`,
    `${shortBn} — ${exam.bn} প্রস্তুতি | Eduvelto`,
    `${shortBn} — ${exam.bn} | Eduvelto`,
  ];
  const titleEnCandidates = [
    `${subj.nameEn} — ${exam.en} Preparation | Eduvelto`,
    `${subj.nameEn} — ${exam.en} | Eduvelto`,
    `${shortEn} — ${exam.en} Preparation | Eduvelto`,
    `${shortEn} — ${exam.en} | Eduvelto`,
  ];
  const titleBn = titleBnCandidates.find((t) => t.length <= 60) ?? titleBnCandidates[3];
  const titleEn = titleEnCandidates.find((t) => t.length <= 60) ?? titleEnCandidates[3];
  return {
    title: titleBn,
    description: `${subj.nameBn} — যাচাইকৃত সিলেবাসে ${bnDigits(subj.marks)} নম্বর। টপিক ও অনুশীলন শীঘ্রই আসছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: subj.nameBn,
    titleEn,
    descriptionEn: `${subj.nameEn} — ${subj.marks} marks in the verified syllabus. Topics and practice are coming soon. Free on Eduvelto.`,
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
  // Brand-SEO wave 12: titles must fit <=60. The old titles repeated
  // the full 'জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি' phrase (70–91
  // chars). The group name (pinned by seo.test.ts) and subject stay;
  // the university context lives in the breadcrumb + description.
  // English keeps the group in parentheses when it fits; the longest
  // subject (General Knowledge) drops it — the description still
  // names the group.
  const titleEnCandidates = [
    `${subj.nameEn} — National University (${group.en}) | Eduvelto`,
    `${subj.nameEn} — National University | Eduvelto`,
  ];
  const titleEn = titleEnCandidates.find((t) => t.length <= 60) ?? titleEnCandidates[1];
  return {
    title: `${subj.nameBn} — ${group.bn} | Eduvelto`,
    description: `${groupShort} শাখার ভর্তি পরীক্ষায় ${subj.nameBn} ${bnDigits(subj.marks)} নম্বর — বিজ্ঞপ্তি থেকে যাচাইকৃত। অধ্যায় ও টপিক খসড়া হিসেবে দেওয়া আছে। Eduvelto-তে সম্পূর্ণ ফ্রি।`,
    crumb: subj.nameBn,
    titleEn,
    descriptionEn: `In the ${group.en} admission test, ${subj.nameEn} carries ${subj.marks} marks — verified from the circular. Chapters and topics are drafts. Free on Eduvelto.`,
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

/** Short reworded titles for opportunity detail pages (brand-SEO wave
 *  12): the seed titles are long display titles for the page itself;
 *  only the <title> uses these short forms so it fits <=60 chars.
 *  Page copy (hub cards, detail h1) is untouched. */
const OPPORTUNITY_SEO_TITLES: Record<string, { bn: string; en: string }> = {
  'bpsc-non-cadre-2026': { bn: 'বিপিএসসি নন-ক্যাডার নিয়োগ ২০২৬', en: 'BPSC Non-Cadre Recruitment 2026' },
  'unicef-writer-editor-2026': { bn: 'রাইটার/এডিটর — ইউনিসেফ বাংলাদেশ', en: 'Writer/Editor — UNICEF Bangladesh' },
  'undrr-intern-pm-2026': { bn: 'ইন্টার্ন — UNDRR, জেনেভা', en: 'Intern — UNDRR, Geneva' },
  'commonwealth-shared-2027': { bn: 'কমনওয়েলথ শেয়ার্ড স্কলারশিপ ২০২৭/২৮', en: 'Commonwealth Shared Scholarships 2027/28' },
  'kaggle-learn': { bn: 'Kaggle Learn — ফ্রি মাইক্রো-কোর্স', en: 'Kaggle Learn — Free Micro-Courses' },
  'google-skillshop': { bn: 'Google Skillshop — ফ্রি প্রশিক্ষণ', en: 'Google Skillshop — Free Training' },
  upwork: { bn: 'Upwork — ফ্রিল্যান্স মার্কেটপ্লেস', en: 'Upwork — Freelance Marketplace' },
};

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
        // Brand-SEO wave 12: description budgets leave room for the
        // verification suffix — bn suffix is 37 chars (max body 123),
        // en suffix 46 (max body 114) — so the total stays <=160.
        const desc =
          seed.descriptionBn.length > 123 ? `${seed.descriptionBn.slice(0, 122)}…` : seed.descriptionBn;
        const descEn =
          seed.descriptionEn.length > 114 ? `${seed.descriptionEn.slice(0, 113)}…` : seed.descriptionEn;
        const short = OPPORTUNITY_SEO_TITLES[seed.docId];
        entry = {
          title: `${short?.bn ?? seed.titleBn} | Eduvelto`,
          description: `${desc} — অফিসিয়াল উৎসে যাচাইকৃত। Eduvelto।`,
          crumb: seed.titleBn,
          titleEn: `${short?.en ?? seed.titleEn} | Eduvelto`,
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
    // ItemList (24 Nov 2026, SEO pass; EXTENDED brand-SEO wave 1,
    // wave 2, wave 3, wave 4, wave 5 and wave 10): the hub lists the 41 public guides, the
    // two real lessons and the BCS English practice hub — the same
    // links the page renders, in the same order.
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'bn' ? 'পাঠ ও গাইড' : 'Lessons & Guides',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: lang === 'bn' ? 'বিসিএস প্রিলিমিনারি প্রস্তুতি গাইড' : 'BCS Preliminary Preparation Guide',
          url: `${SITE_URL}/learn/bcs-preparation-guide`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: lang === 'bn' ? 'ব্যাংক চাকরির প্রস্তুতি গাইড' : 'Bank Job Preparation Guide',
          url: `${SITE_URL}/learn/bank-job-preparation`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: lang === 'bn' ? 'প্রাথমিক সহকারী শিক্ষক নিয়োগ প্রস্তুতি গাইড' : 'Primary Assistant Teacher Recruitment Preparation Guide',
          url: `${SITE_URL}/learn/primary-teacher-preparation`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: lang === 'bn' ? 'NTRCA শিক্ষক নিবন্ধন পরীক্ষার প্রস্তুতি গাইড' : 'NTRCA Teacher Registration Exam Preparation Guide',
          url: `${SITE_URL}/learn/ntrca-preparation`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: lang === 'bn' ? 'জাতীয় বিশ্ববিদ্যালয় ভর্তি গাইড' : 'National University Admission Guide',
          url: `${SITE_URL}/learn/nu-admission-guide`,
        },
        {
          '@type': 'ListItem',
          position: 6,
          name: lang === 'bn' ? 'ইংরেজি ব্যাকরণের মৌলিক বিষয়' : 'English Grammar Basics',
          url: `${SITE_URL}/learn/english-grammar-basics`,
        },
        {
          '@type': 'ListItem',
          position: 7,
          name: lang === 'bn' ? 'বৃত্তি (স্কলারশিপ) গাইড' : 'Scholarship Guide',
          url: `${SITE_URL}/learn/scholarship-guide`,
        },
        {
          '@type': 'ListItem',
          position: 8,
          name: lang === 'bn' ? 'AI কী? শিক্ষার্থীরা কীভাবে AI ব্যবহার করবে' : 'What Is AI? How Students Should Use AI',
          url: `${SITE_URL}/learn/what-is-ai`,
        },
        {
          '@type': 'ListItem',
          position: 9,
          name: lang === 'bn' ? 'CV লেখার গাইড' : 'CV Writing Guide',
          url: `${SITE_URL}/learn/cv-writing-guide`,
        },
        {
          '@type': 'ListItem',
          position: 10,
          name: lang === 'bn' ? 'শিক্ষার্থী হিসেবে মাসিক বাজেট পরিকল্পনা' : 'Monthly Budget Planning as a Student',
          url: `${SITE_URL}/learn/budget-planner-guide`,
        },
        {
          '@type': 'ListItem',
          position: 11,
          name: lang === 'bn' ? 'পরীক্ষার আগে পুনরালোচনার কৌশল' : 'Revision Strategy Before Exams',
          url: `${SITE_URL}/learn/revision-strategy`,
        },
        {
          '@type': 'ListItem',
          position: 12,
          name: lang === 'bn' ? 'কার্যকর নোট নেওয়ার কৌশল' : 'Effective Note-Taking Techniques',
          url: `${SITE_URL}/learn/note-taking-guide`,
        },
        {
          '@type': 'ListItem',
          position: 13,
          name: lang === 'bn' ? 'শিক্ষার্থীদের সময় ব্যবস্থাপনা' : 'Time Management for Students',
          url: `${SITE_URL}/learn/time-management-students`,
        },
        {
          '@type': 'ListItem',
          position: 14,
          name: lang === 'bn' ? 'ইংরেজি লেখার মৌলিক নিয়ম' : 'English Writing Basics',
          url: `${SITE_URL}/learn/english-writing-basics`,
        },
        {
          '@type': 'ListItem',
          position: 15,
          name: lang === 'bn' ? 'অনলাইনে নিরাপদ থাকার নিয়ম' : 'Online Safety Guide for Students',
          url: `${SITE_URL}/learn/online-safety-guide`,
        },
        {
          '@type': 'ListItem',
          position: 16,
          name: lang === 'bn' ? 'বাংলা বানানের সাধারণ ভুল' : 'Common Bangla Spelling Mistakes',
          url: `${SITE_URL}/learn/bangla-spelling-common-mistakes`,
        },
        {
          '@type': 'ListItem',
          position: 17,
          name: lang === 'bn' ? 'কম্পিউটার ও ইন্টারনেটের মৌলিক ধারণা' : 'Computer and Internet Basics for Students',
          url: `${SITE_URL}/learn/computer-basics-students`,
        },
        {
          '@type': 'ListItem',
          position: 18,
          name: lang === 'bn' ? 'পরীক্ষার দিনের কৌশল' : 'Exam Day Strategy',
          url: `${SITE_URL}/learn/exam-day-strategy`,
        },
        {
          '@type': 'ListItem',
          position: 19,
          name: lang === 'bn' ? 'MCQ উত্তর দেওয়ার কৌশল' : 'MCQ Answering Techniques',
          url: `${SITE_URL}/learn/mcq-answering-techniques`,
        },
        {
          '@type': 'ListItem',
          position: 20,
          name: lang === 'bn' ? 'মনে রাখার কৌশল' : 'Memory Techniques for Students',
          url: `${SITE_URL}/learn/memory-techniques-students`,
        },
        {
          '@type': 'ListItem',
          position: 21,
          name: lang === 'bn' ? 'চাকরিপ্রার্থীদের পড়ার রুটিন' : 'Study Routine for Job Seekers',
          url: `${SITE_URL}/learn/study-routine-job-seekers`,
        },
        {
          '@type': 'ListItem',
          position: 22,
          name: lang === 'bn' ? 'শিক্ষার্থীদের সুস্থ অভ্যাস' : 'Healthy Habits for Students',
          url: `${SITE_URL}/learn/healthy-habits-students`,
        },
        {
          '@type': 'ListItem',
          position: 23,
          name: lang === 'bn' ? 'ডিজিটাল দক্ষতার মৌলিক ধারণা' : 'Digital Skills Basics for Students',
          url: `${SITE_URL}/learn/digital-skills-basics`,
        },
        {
          '@type': 'ListItem',
          position: 24,
          name: lang === 'bn' ? 'পরীক্ষার উদ্বেগ সামলানো' : 'Exam Anxiety Management',
          url: `${SITE_URL}/learn/exam-anxiety-management`,
        },
        {
          '@type': 'ListItem',
          position: 25,
          name: lang === 'bn' ? 'উপস্থাপনা দক্ষতা' : 'Presentation Skills for Students',
          url: `${SITE_URL}/learn/presentation-skills`,
        },
        {
          '@type': 'ListItem',
          position: 26,
          name: lang === 'bn' ? 'দলগত পড়াশোনা' : 'Group Study Guide',
          url: `${SITE_URL}/learn/group-study-guide`,
        },
        {
          '@type': 'ListItem',
          position: 27,
          name: lang === 'bn' ? 'ইংরেজি শব্দভান্ডার গড়া' : 'English Vocabulary Building',
          url: `${SITE_URL}/learn/english-vocabulary-building`,
        },
        {
          '@type': 'ListItem',
          position: 28,
          name: lang === 'bn' ? 'কার্যকর পড়ার অভ্যাস' : 'Effective Reading Habits',
          url: `${SITE_URL}/learn/effective-reading-habits`,
        },
        {
          '@type': 'ListItem',
          position: 29,
          name: lang === 'bn' ? 'নিজেকে অনুপ্রাণিত রাখা' : 'Self-Motivation for Students',
          url: `${SITE_URL}/learn/self-motivation-students`,
        },
        {
          '@type': 'ListItem',
          position: 30,
          name: lang === 'bn' ? 'ফ্রি লাইব্রেরি ব্যবহার করা' : 'How to Use the Free Library',
          url: `${SITE_URL}/learn/how-to-use-free-library`,
        },
        {
          '@type': 'ListItem',
          position: 31,
          name: lang === 'bn' ? 'চাকরির অনুশীলন ব্যবহার করা' : 'How to Use Job Practice',
          url: `${SITE_URL}/learn/how-to-use-job-practice`,
        },
        {
          '@type': 'ListItem',
          position: 32,
          name: lang === 'bn' ? 'AI লাইফ অ্যাসিস্ট্যান্ট ব্যবহার করা' : 'How to Use the AI Life Assistant',
          url: `${SITE_URL}/learn/how-to-use-ai-assistant`,
        },
        {
          '@type': 'ListItem',
          position: 33,
          name: lang === 'bn' ? 'অপরচুনিটি হাব ব্যবহার করা' : 'How to Use the Opportunity Hub',
          url: `${SITE_URL}/learn/how-to-use-opportunity-hub`,
        },
        {
          '@type': 'ListItem',
          position: 34,
          name: lang === 'bn' ? 'লাইফ সার্ভিস ব্যবহার করা' : 'How to Use Everyday Life Services',
          url: `${SITE_URL}/learn/how-to-use-life-services`,
        },
        {
          '@type': 'ListItem',
          position: 35,
          name: lang === 'bn' ? 'ইংরেজিতে কথা বলার অনুশীলন' : 'Spoken English Practice',
          url: `${SITE_URL}/learn/spoken-english-practice`,
        },
        {
          '@type': 'ListItem',
          position: 36,
          name: lang === 'bn' ? 'শিক্ষার্থীদের লক্ষ্য নির্ধারণ' : 'Goal Setting for Students',
          url: `${SITE_URL}/learn/goal-setting-students`,
        },
        {
          '@type': 'ListItem',
          position: 37,
          name: lang === 'bn' ? 'পড়ায় মনোযোগ ধরে রাখা' : 'Staying Focused While Studying',
          url: `${SITE_URL}/learn/staying-focused-studying`,
        },
        {
          '@type': 'ListItem',
          position: 38,
          name: lang === 'bn' ? 'ঘুম ও পড়াশোনা' : 'Sleep and Study',
          url: `${SITE_URL}/learn/sleep-and-study`,
        },
        {
          '@type': 'ListItem',
          position: 39,
          name: lang === 'bn' ? 'পড়া বুঝে পড়ার কৌশল' : 'Reading Comprehension Strategies',
          url: `${SITE_URL}/learn/reading-comprehension-strategies`,
        },
        {
          '@type': 'ListItem',
          position: 40,
          name: lang === 'bn' ? 'ফোন দিয়ে পড়াশোনা' : 'Learning with Your Phone',
          url: `${SITE_URL}/learn/learning-with-phone`,
        },
        {
          '@type': 'ListItem',
          position: 41,
          name: lang === 'bn' ? 'ক্লাসে প্রশ্ন করা' : 'Asking Questions in Class',
          url: `${SITE_URL}/learn/asking-questions-class`,
        },
        {
          '@type': 'ListItem',
          position: 42,
          name: lang === 'bn' ? 'টেন্স — পাঠ' : 'Tense — Lesson',
          url: `${SITE_URL}/learn/bcs-english-tense`,
        },
        {
          '@type': 'ListItem',
          position: 43,
          name: lang === 'bn' ? 'প্রিপোজিশন — পাঠ' : 'Preposition — Lesson',
          url: `${SITE_URL}/learn/bcs-english-preposition`,
        },
        {
          '@type': 'ListItem',
          position: 44,
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
  if (PUBLIC_GUIDES.some((g) => g.path === path)) {
    // Article (24 Nov 2026, brand-SEO wave 1; waves 2–5 keep the
    // same date — the 35 guides are article-length drafts awaiting
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
 * 200 (WEB-001), so a junk URL like /jobs/not-an-exam or /class/class-9
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
