// Eduvelto — Global Search (homepage redesign, 24 Nov 2026).
//
// The header magnifier used to be a plain link to /library and the
// mobile home box searched book titles only (audit 24 Nov 2026 §3 —
// the #1 finding). This module is the real cross-content search:
// library books + chapters are NOT searched by text (chapter/lesson
// text is login-gated and must never leak to signed-out users), but
// everything public and listable is:
//
//   - 609 library books (title, paper code, department, subject,
//     class level, education type) — loaded once per session via the
//     same cached list LibraryPage uses (getAllPublishedBooksCached)
//   - 14 job exam hubs + admissions hub + NU groups (static defs)
//   - 7 verified opportunity listings (seed = source of truth until
//     moderators publish to Firestore; same seed the hub falls back to)
//   - 9 Life Services tools + health pages
//   - public guide / learn pages (viva, career, CV, CV builder,
//     interview prep, entrepreneurship, income, BCS English practice,
//     sample lessons)
//
// Matching is a case-insensitive substring match over Bangla +
// English text, with Bengali digits normalised to ASCII so "৫" and
// "5" match each other. No index, no server round-trip beyond the
// book list the library already fetches. Results link only to routes
// that exist; nothing invented, no counts that are not real.

import { CLASS_LEVELS } from './classLevels';
import { getAllPublishedBooksCached, type Book } from './content';
import { JOB_EXAMS } from './jobExams';
import { seedOpportunities } from './opportunitySeed';

export type SearchKind = 'book' | 'job' | 'opportunity' | 'service' | 'page';

export interface SearchResult {
  id: string;
  kind: SearchKind;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  /** Route the result links to — always a route that exists. */
  to: string;
  /** Small honest meta line, e.g. "৬টি অধ্যায় · ১২০টি প্রশ্ন". */
  metaBn: string;
  metaEn: string;
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
function bnDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
function norm(s: string): string {
  let out = s.toLowerCase();
  for (let i = 0; i < 10; i++) out = out.split(BN_DIGITS[i]).join(String(i));
  return out.replace(/\s+/g, ' ').trim();
}

function matches(haystack: string, q: string): boolean {
  if (!q) return false;
  return norm(haystack).includes(q);
}

function hay(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const OPP_TYPE_BN: Record<string, string> = {
  job: 'চাকরি',
  remote: 'রিমোট কাজ',
  internship: 'ইন্টার্নশিপ',
  scholarship: 'স্কলারশিপ',
  skill: 'দক্ষতা উন্নয়ন',
  freelance: 'ফ্রিল্যান্সিং',
};
const OPP_TYPE_EN: Record<string, string> = {
  job: 'Job',
  remote: 'Remote work',
  internship: 'Internship',
  scholarship: 'Scholarship',
  skill: 'Skill development',
  freelance: 'Freelancing',
};

/** Life tools — titles mirror LifeHubPage.tsx TOOLS (the hub is the
 * source of truth for the list; this catalogue only repeats the
 * names/routes so search can find them). */
const LIFE_TOOLS: { to: string; bn: string; en: string; descBn: string; descEn: string }[] = [
  { to: '/life/budget', bn: 'বাজেট পরিকল্পনা', en: 'Budget Planner', descBn: 'মাসিক আয়-ব্যয়ের হিসাব ও সঞ্চয়ের লক্ষ্য', descEn: 'Monthly income, expenses and savings goals' },
  { to: '/life/calculators', bn: 'ক্যালকুলেটর', en: 'Calculators', descBn: 'দৈনন্দিন হিসাবের সহজ ক্যালকুলেটর — BMI, বয়স, একক রূপান্তরসহ', descEn: 'Everyday calculators — BMI, age, unit conversion and more' },
  { to: '/life/converters', bn: 'কনভার্টার', en: 'Converters', descBn: 'একক ও মুদ্রা রূপান্তর', descEn: 'Unit and currency conversion' },
  { to: '/life/planner', bn: 'দৈনন্দিন পরিকল্পনা', en: 'Daily Planner', descBn: 'দিনের কাজ ও সময়ের পরিকল্পনা', descEn: 'Plan your day and tasks' },
  { to: '/life/pdf-tools', bn: 'পিডিএফ টুলস', en: 'PDF Tools', descBn: 'পিডিএফ নিয়ে দরকারি কাজ', descEn: 'Handy PDF tools' },
  { to: '/life/health', bn: 'স্বাস্থ্য', en: 'Health', descBn: 'স্বাস্থ্য তথ্য ও সেবা', descEn: 'Health information and services' },
  { to: '/life/government', bn: 'সরকারি সেবা', en: 'Government Services', descBn: 'সরকারি সেবার তথ্য ও লিংক', descEn: 'Government service information and links' },
  { to: '/life/travel', bn: 'ভ্রমণ', en: 'Travel', descBn: 'ভ্রমণের পরিকল্পনা ও তথ্য', descEn: 'Travel planning and information' },
  { to: '/life/services', bn: 'সেবা নির্দেশিকা', en: 'Services Directory', descBn: 'প্রয়োজনীয় সেবার নির্দেশিকা', descEn: 'Directory of everyday services' },
];

const STATIC_PAGES: Omit<SearchResult, 'id'>[] = [
  { kind: 'job', titleBn: 'চাকরি প্রস্তুতি', titleEn: 'Job Preparation', descBn: 'BCS, ব্যাংক, শিক্ষক নিয়োগসহ ১৪টি পরীক্ষার প্রস্তুতির কাঠামো', descEn: 'Preparation structure for 14 exams including BCS, Bank and teacher recruitment', to: '/jobs', metaBn: 'চাকরি প্রস্তুতি', metaEn: 'Job Preparation' },
  { kind: 'job', titleBn: 'ভর্তি প্রস্তুতি', titleEn: 'Admission Preparation', descBn: 'বিশ্ববিদ্যালয়, মেডিকেল, ইঞ্জিনিয়ারিং ও জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি', descEn: 'University, medical, engineering and National University admission preparation', to: '/admissions', metaBn: 'ভর্তি প্রস্তুতি', metaEn: 'Admission Preparation' },
  { kind: 'job', titleBn: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি', titleEn: 'National University Admission', descBn: 'জাতীয় বিশ্ববিদ্যালয় অনার্স ভর্তি — মানবিক, বিজ্ঞান ও ব্যবসায় শিক্ষা', descEn: 'National University honours admission — humanities, science and business studies', to: '/admissions/national-university', metaBn: 'ভর্তি প্রস্তুতি', metaEn: 'Admission Preparation' },
  { kind: 'job', titleBn: 'মডেল টেস্ট', titleEn: 'Model Tests', descBn: 'MCQ পরীক্ষা — লগইন করে পরীক্ষা দিন', descEn: 'MCQ exams — sign in to take a test', to: '/exam', metaBn: 'পরীক্ষা', metaEn: 'Exam' },
  { kind: 'job', titleBn: 'বিসিএস ইংরেজি অনুশীলন', titleEn: 'BCS English Practice', descBn: '৩৫টি যাচাইকৃত বিসিএস ইংরেজি প্রশ্ন — বিনামূল্যে, লগইন ছাড়াই', descEn: '35 verified BCS English questions — free, no sign-in needed', to: '/jobs/bcs/practice/english', metaBn: '৩৫টি প্রশ্ন', metaEn: '35 questions' },
  { kind: 'job', titleBn: 'চাকরির বিজ্ঞপ্তি', titleEn: 'Job Circulars', descBn: 'যাচাইকৃত নিয়োগ বিজ্ঞপ্তি — নতুন বিজ্ঞপ্তি যাচাই হলে এখানে দেখাবে', descEn: 'Verified job circulars — new circulars appear here once verified', to: '/jobs/circulars', metaBn: 'বিজ্ঞপ্তি', metaEn: 'Circulars' },
  { kind: 'job', titleBn: 'ভাইভা প্রস্তুতি', titleEn: 'Viva Preparation', descBn: 'চাকরির ভাইভার প্রস্তুতি নির্দেশিকা', descEn: 'Job viva preparation guide', to: '/jobs/viva', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'job', titleBn: 'ক্যারিয়ার নির্দেশিকা', titleEn: 'Career Guide', descBn: 'ক্যারিয়ার পরিকল্পনার নির্দেশিকা', descEn: 'Career planning guide', to: '/jobs/career', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'job', titleBn: 'সিভি তৈরি', titleEn: 'CV Writing', descBn: 'সিভি লেখার নির্দেশিকা', descEn: 'CV writing guide', to: '/jobs/cv', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'page', titleBn: 'ডিজিটাল লাইব্রেরি', titleEn: 'Digital Library', descBn: '৬০৯টি বই, ২৩০৭টি অধ্যায় — বিনামূল্যে পড়ুন', descEn: '609 books, 2,307 chapters — read free', to: '/library', metaBn: 'লাইব্রেরি', metaEn: 'Library' },
  { kind: 'page', titleBn: 'শিক্ষা নির্দেশিকা', titleEn: 'Education Directory', descBn: 'শ্রেণি ও বিষয় অনুযায়ী বইয়ের নির্দেশিকা', descEn: 'Book directory by class and subject', to: '/directory', metaBn: 'নির্দেশিকা', metaEn: 'Directory' },
  { kind: 'page', titleBn: 'আমার অগ্রগতি', titleEn: 'My Progress', descBn: 'আপনার পড়াশোনার অগ্রগতি — লগইন প্রয়োজন', descEn: 'Your study progress — sign-in required', to: '/progress', metaBn: 'অগ্রগতি', metaEn: 'Progress' },
  { kind: 'page', titleBn: 'BCS ইংরেজি — Tense', titleEn: 'BCS English — Tense', descBn: 'বিনামূল্যে নমুনা পাঠ — Tense', descEn: 'Free sample lesson — Tense', to: '/learn/bcs-english-tense', metaBn: 'নমুনা পাঠ', metaEn: 'Sample lesson' },
  { kind: 'page', titleBn: 'BCS ইংরেজি — Preposition', titleEn: 'BCS English — Preposition', descBn: 'বিনামূল্যে নমুনা পাঠ — Preposition', descEn: 'Free sample lesson — Preposition', to: '/learn/bcs-english-preposition', metaBn: 'নমুনা পাঠ', metaEn: 'Sample lesson' },
  { kind: 'page', titleBn: 'Eduvelto সম্পর্কে', titleEn: 'About Eduvelto', descBn: 'Eduvelto কী, কেন বিনামূল্যে', descEn: 'What Eduvelto is and why it is free', to: '/about', metaBn: 'আমাদের সম্পর্কে', metaEn: 'About' },
  { kind: 'page', titleBn: 'প্রতিষ্ঠাতা', titleEn: 'Founder', descBn: 'আলী হাসান মোহাম্মদ মিজান — প্রতিষ্ঠাতা ও CEO', descEn: 'Ali Hasan Mohammed Mizan — Founder & CEO', to: '/founder', metaBn: 'প্রতিষ্ঠাতা', metaEn: 'Founder' },
  { kind: 'page', titleBn: 'যোগাযোগ', titleEn: 'Contact', descBn: 'Eduvelto-র সাথে যোগাযোগ করুন', descEn: 'Contact Eduvelto', to: '/contact', metaBn: 'যোগাযোগ', metaEn: 'Contact' },
  { kind: 'opportunity', titleBn: 'সুযোগ হাব', titleEn: 'Opportunity Hub', descBn: 'যাচাইকৃত চাকরি, স্কলারশিপ, ইন্টার্নশিপ ও ফ্রিল্যান্সিং সুযোগ', descEn: 'Verified jobs, scholarships, internships and freelancing opportunities', to: '/opportunities', metaBn: 'সুযোগ হাব', metaEn: 'Opportunity Hub' },
  { kind: 'opportunity', titleBn: 'সিভি ও কভার লেটার তৈরি', titleEn: 'CV & Cover Letter Builder', descBn: 'ফরম পূরণ করে প্রিন্ট করার মতো সিভি তৈরি করুন — বিনামূল্যে', descEn: 'Build a printable CV by filling a form — free', to: '/opportunities/cv-builder', metaBn: 'ফ্রি টুল', metaEn: 'Free tool' },
  { kind: 'opportunity', titleBn: 'ইন্টারভিউ প্রস্তুতি', titleEn: 'Interview Preparation', descBn: 'ইন্টারভিউয়ের প্রস্তুতি নির্দেশিকা', descEn: 'Interview preparation guide', to: '/opportunities/interview-prep', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'opportunity', titleBn: 'ক্যারিয়ার নির্দেশিকা', titleEn: 'Career Guidance', descBn: 'ক্যারিয়ার পরিকল্পনার নির্দেশিকা', descEn: 'Career planning guide', to: '/opportunities/career-guidance', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'opportunity', titleBn: 'উদ্যোক্তা নির্দেশিকা', titleEn: 'Entrepreneurship Guide', descBn: 'উদ্যোক্তা হওয়ার প্রাথমিক নির্দেশিকা', descEn: 'Introductory entrepreneurship guide', to: '/opportunities/entrepreneurship', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'opportunity', titleBn: 'আয়ের পথ', titleEn: 'Ways to Earn', descBn: 'অনলাইনে আয়ের বৈধ পথগুলোর নির্দেশিকা', descEn: 'Guide to legitimate ways to earn online', to: '/opportunities/income', metaBn: 'নির্দেশিকা', metaEn: 'Guide' },
  { kind: 'service', titleBn: 'স্বাস্থ্য তথ্য', titleEn: 'Health Information', descBn: 'স্বাস্থ্য বিষয়ক তথ্য — ঔষধ, রোগ, ডাক্তার ও হাসপাতাল', descEn: 'Health information — medicines, diseases, doctors and hospitals', to: '/health', metaBn: 'স্বাস্থ্য', metaEn: 'Health' },
  { kind: 'service', titleBn: 'দৈনন্দিন জীবনের সেবা', titleEn: 'Everyday Life Services', descBn: 'বাজেট, ক্যালকুলেটর, কনভার্টার, পিডিএফ টুলসসহ ৯টি সেবা', descEn: '9 services including budget, calculators, converters and PDF tools', to: '/life', metaBn: 'জীবন সেবা', metaEn: 'Life Services' },
];

/** The static catalogue: job exams + class levels + life tools +
 * opportunity seed + guide/static pages. Pure — unit-testable. */
export function buildStaticCatalogue(): SearchResult[] {
  const out: SearchResult[] = [];
  for (const e of JOB_EXAMS) {
    out.push({
      id: `job-${e.slug}`,
      kind: 'job',
      titleBn: `${e.bn} প্রস্তুতি`,
      titleEn: `${e.en} Preparation`,
      descBn: `${e.fullBn} — ${e.orgBn}`,
      descEn: `${e.fullEn} — ${e.orgEn}`,
      to: `/jobs/${e.slug}`,
      metaBn: 'চাকরি প্রস্তুতি',
      metaEn: 'Job Preparation',
    });
  }
  for (const c of CLASS_LEVELS) {
    out.push({
      id: `class-${c.slug}`,
      kind: 'page',
      titleBn: `${c.bn} — ${c.tagBn}`,
      titleEn: `${c.en} — ${c.tagEn}`,
      descBn: `${c.bn} শ্রেণির বই ও পাঠ`,
      descEn: `${c.en} books and lessons`,
      to: `/class/${c.slug}`,
      metaBn: 'শিক্ষা কার্যক্রম',
      metaEn: 'Academic Learning',
    });
  }
  for (const t of LIFE_TOOLS) {
    out.push({
      id: `life-${t.to.replace('/life/', '')}`,
      kind: 'service',
      titleBn: t.bn,
      titleEn: t.en,
      descBn: t.descBn,
      descEn: t.descEn,
      to: t.to,
      metaBn: 'জীবন সেবা',
      metaEn: 'Life Services',
    });
  }
  for (const o of seedOpportunities()) {
    out.push({
      id: `opp-${o.docId}`,
      kind: 'opportunity',
      titleBn: o.titleBn,
      titleEn: o.titleEn,
      descBn: `${o.organizationBn} — ${o.sourceName}`,
      descEn: `${o.organizationEn} — ${o.sourceName}`,
      to: `/opportunities/${o.docId}`,
      metaBn: OPP_TYPE_BN[o.type] ?? 'সুযোগ',
      metaEn: OPP_TYPE_EN[o.type] ?? 'Opportunity',
    });
  }
  for (const p of STATIC_PAGES) out.push({ id: `page-${p.to}`, ...p });
  return out;
}

/** Substring search over an already-loaded book list. Pure. */
export function searchBooks(books: Book[], rawQuery: string, max = 20): SearchResult[] {
  const q = norm(rawQuery);
  if (!q) return [];
  const hits: SearchResult[] = [];
  for (const b of books) {
    if (
      matches(
        hay(b.title, b.paperCode, b.department, b.subject, b.classLevel, b.educationType, b.program, b.board),
        q,
      )
    ) {
      hits.push({
        id: `book-${b.id}`,
        kind: 'book',
        titleBn: b.title,
        titleEn: b.title,
        descBn: [b.classLevel, b.department, b.subject].filter(Boolean).join(' · '),
        descEn: [b.classLevel, b.department, b.subject].filter(Boolean).join(' · '),
        to: `/library/${b.id}`,
        metaBn: `${bnDigits(b.chapterCount)}টি অধ্যায় · ${bnDigits(b.questionCount)}টি প্রশ্ন`,
        metaEn: `${b.chapterCount} chapters · ${b.questionCount} questions`,
      });
      if (hits.length >= max) break;
    }
  }
  return hits;
}

/** Substring search over the static catalogue. Pure. */
export function searchStatic(rawQuery: string): SearchResult[] {
  const q = norm(rawQuery);
  if (!q) return [];
  return buildStaticCatalogue().filter((r) =>
    matches(hay(r.titleBn, r.titleEn, r.descBn, r.descEn, r.metaBn, r.metaEn), q),
  );
}

export interface GlobalSearchResults {
  query: string;
  books: SearchResult[];
  jobs: SearchResult[];
  opportunities: SearchResult[];
  services: SearchResult[];
  pages: SearchResult[];
  total: number;
}

/** Full global search: static catalogue (sync) + books (one cached
 * Firestore read, same as LibraryPage). Empty query → empty result. */
export async function globalSearch(rawQuery: string): Promise<GlobalSearchResults> {
  const query = rawQuery.trim();
  const empty: GlobalSearchResults = { query, books: [], jobs: [], opportunities: [], services: [], pages: [], total: 0 };
  if (!query) return empty;
  const stat = searchStatic(query);
  let books: SearchResult[] = [];
  try {
    books = searchBooks(await getAllPublishedBooksCached(), query);
  } catch {
    // Firestore unreachable (preview/offline) — static results still
    // render; the page shows a note instead of failing the search.
    books = [];
  }
  const jobs = stat.filter((r) => r.kind === 'job');
  const opportunities = stat.filter((r) => r.kind === 'opportunity');
  const services = stat.filter((r) => r.kind === 'service');
  const pages = stat.filter((r) => r.kind === 'page');
  return { query, books, jobs, opportunities, services, pages, total: books.length + stat.length };
}
