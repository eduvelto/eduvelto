// Eduvelto — static prerender (Phase 1, SSG + bilingual, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// Builds static HTML for every public page into dist/ so Googlebot
// (and any no-JS visitor) sees real titles, meta, canonicals,
// hreflang and content without waiting for JavaScript.
//
// PIPELINE (run in this order; the `prerender` npm script does it):
//   1. `npm run build`            — client bundle -> dist/
//   2. `vite build --ssr src/entry-server.tsx --outDir dist-ssr`
//                                 — SSR bundle (src/entry-server.tsx)
//   3. `node scripts/prerender.mjs --books-file <fixture> | --live`
//                                 — this script (renders + writes files)
//
// HOW A PAGE IS BUILT:
// - The script imports dist-ssr/entry-server.js and calls render(url)
//   for each public URL. render() runs the REAL App (StaticRouter +
//   HelmetProvider), so the <head> comes from the same <SeoHead />
//   code the browser uses (src/components/SeoHead.tsx via RouteSeo)
//   — no duplicated title/description table to drift.
// - The rendered app HTML is injected into dist/index.html (the
//   client shell), replacing the first-paint loader; the shell's
//   static home SEO tags are replaced by the rendered helmet tags.
// - Internal hrefs in the rendered HTML are rewritten to their
//   /{lang}/... form (the app's own <Link>s still point at legacy
//   paths and rely on the client-side LegacyRedirect — the static
//   HTML must not).
//
// BOOK PAGES (609 books x 2 langs):
// - Book URLs use the Firestore document id — there is NO slug,
//   titleBn or titleEn field in the `books` collection (verified
//   against the 24 Nov 2026 backup: doc `id` + the single `title`
//   field). The canonical book URL is /{lang}/books/{id}.
// - render() cannot fetch Firestore (effects never run in
//   renderToString), so for book pages the script OVERRIDES the
//   head with buildBookHead() — the same formulas as bookSeoData()
//   in src/lib/seo.ts (title, description, canonical, reciprocal
//   hreflang, OG, Book + WebPage JSON-LD) — and PREPENDS a visible
//   summary block (real title / subject / class / counts from the
//   book doc) that crawlers and no-JS visitors see. Once JavaScript
//   loads, the app replaces it with the live BookPage.
// - NO book data is ever invented: every field comes from the
//   fixture or the live REST read; missing counts are omitted.
//
// BOOK DATA MODES (pick one — the script refuses to guess):
// - Fixture (verification while live Firestore is 429-limited):
//     node scripts/prerender.mjs --books-file ~/workspace/eduorbit/backups/eduvelto-backup-20261124-014508.json
//   or PRERENDER_BOOKS_FILE=<path>. Accepts the backup shape
//   {metadata, data:{books:[...]}}, {books:[...]}, or a bare array.
// - Live REST (Spark, no auth — books are public-read):
//     node scripts/prerender.mjs --live [--project eduvelto]
//   Reads the `books` collection via the Firestore REST API,
//   paged (pageSize 300). On HTTP 429 it FAILS FAST with a clear
//   message (quota — retry after the reset, or use --books-file);
//   it never writes partial book pages. NEVER run --live while
//   429s persist (quota warning, 25 Nov 2026).
//
// OUTPUT (dist/):
// - dist/{bn,en}/index.html + dist/{bn,en}/<path>/index.html for
//   every path in PRERENDER_STATIC_PATHS (both langs)
// - dist/{bn,en}/books/<id>/index.html for every book (both langs)
// - dist/index.html — a copy of the /bn home (the root / 301s to
//   /bn in firebase.json; this copy is the belt-and-braces shell)
// - dist/404.html — the NotFound page (noindex, from the fallback SEO)
// - dist/robots.txt — Allow /, Disallow /app/ + /login (+ the other
//   login-gated / noindex routes), Sitemap line. NOTE: /books/ is
//   deliberately NOT disallowed any more — book pages are public
//   prerendered content now (the old robots.txt blocked /books/
//   when chapter pages were login-gated).
// - dist/sitemap.xml — canonical /bn + /en URLs only, with
//   reciprocal hreflang (bn / en / x-default -> bn).
//
// PHASE 2 EXTENSION POINT — PRERENDER_STATIC_PATHS is the ONE list
// to extend: add legal pages and guide detail pages there when
// their routes exist. (/support has NO route yet, so it is NOT in
// the list — it 301s to /bn/contact instead; /founder is NOT
// prerendered — FounderPage owns its SEO client-side via useSeo,
// and prerendering it with the fallback noindex head would hide it
// from Google. Guide detail pages ARE covered: /learn/<slug> x41.)

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITE_URL = 'https://eduvelto.com';
export const LANGS = ['bn', 'en'];
export const DEFAULT_PROJECT_ID = 'eduvelto';

// ---------------------------------------------------------------------------
// THE list. Phase 2 extends this constant (see header). Sourced from
// the committed public/sitemap.xml (120 URLs) + '/books' (the new
// canonical library hub alias; /library keeps rendering as an alias
// and legacy /library 301s to /bn/books). '/founder' is deliberately
// NOT here (see header). '/ai-teacher' is not here either — it is
// noindexed + robots-disallowed by design.
// ---------------------------------------------------------------------------
export const PRERENDER_STATIC_PATHS = [
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
  '/learn/revision-strategy',
  '/learn/note-taking-guide',
  '/learn/time-management-students',
  '/learn/english-writing-basics',
  '/learn/online-safety-guide',
  '/learn/bangla-spelling-common-mistakes',
  '/learn/computer-basics-students',
  '/learn/exam-day-strategy',
  '/learn/mcq-answering-techniques',
  '/learn/memory-techniques-students',
  '/learn/study-routine-job-seekers',
  '/learn/healthy-habits-students',
  '/learn/digital-skills-basics',
  '/learn/exam-anxiety-management',
  '/learn/presentation-skills',
  '/learn/group-study-guide',
  '/learn/english-vocabulary-building',
  '/learn/effective-reading-habits',
  '/learn/self-motivation-students',
  '/learn/how-to-use-free-library',
  '/learn/how-to-use-job-practice',
  '/learn/how-to-use-ai-assistant',
  '/learn/how-to-use-opportunity-hub',
  '/learn/how-to-use-life-services',
  '/learn/spoken-english-practice',
  '/learn/goal-setting-students',
  '/learn/staying-focused-studying',
  '/learn/sleep-and-study',
  '/learn/reading-comprehension-strategies',
  '/learn/learning-with-phone',
  '/learn/asking-questions-class',
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
  '/books',
  '/class',
  '/class/class-9-10',
  '/class/hsc',
  '/class/honours-masters',
  '/class/technical',
  '/class/madrasa',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms',
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
  '/ai-assistant',
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
  '/jobs/viva',
  '/jobs/career',
  '/jobs/cv',
  '/install',
];

/** Top-level segments whose bare hrefs get rewritten to /{lang}/...
 *  in prerendered HTML (public routes + legacy aliases). Asset
 *  paths (/manifest.webmanifest, /favicon.svg, /og-image.jpg, …)
 *  are NOT in this list and are never rewritten. */
export const LINK_REWRITE_SEGMENTS = [
  'class',
  'skills',
  'admissions',
  'jobs',
  'learn',
  'opportunities',
  'library',
  'books',
  'lessons',
  'health',
  'life',
  'search',
  'about',
  'why-eduvelto',
  'founder',
  'contact',
  'privacy',
  'privacy-policy',
  'terms',
  'editorial-policy',
  'content-accuracy',
  'certificate-policy',
  'disclaimer',
  'install',
  'ai-teacher',
  'ai-assistant',
  'bcs',
  'bank',
  'primary',
  'ntrca',
  'admission',
  'guides',
  'support',
];

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests).
// ---------------------------------------------------------------------------

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Guide slugs from the PUBLIC_GUIDES source text. Correction (c):
 *  the regex reader returns m[1] — the slug string — never the
 *  whole match array. Used to verify PRERENDER_STATIC_PATHS covers
 *  every /learn/<slug> guide (warn on mismatch, never invent). */
export function getGuideSlugs(source) {
  const slugs = [];
  const re = /slug:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

/** Guide paths from the PUBLIC_GUIDES source text. Phase 2 (25 Nov
 *  2026): the 15 Study Guides live at /guides/<slug>, not
 *  /learn/<slug> — the coverage check must use each guide's own
 *  path, never assume /learn/. */
export function getGuidePaths(source) {
  const paths = [];
  const re = /path:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    paths.push(m[1]);
  }
  return paths;
}

export function withLangPrefix(path, lang) {
  const bare = path.replace(/\/+$/, '') || '/';
  const stripped = bare.replace(/^\/(bn|en)(?=\/|$)/, '') || '/';
  return stripped === '/' ? `/${lang}` : `/${lang}${stripped}`;
}

export function canonicalUrl(path, lang) {
  return `${SITE_URL}${withLangPrefix(path, lang)}`;
}

/** Normalise book docs from a fixture file. Accepts the 24 Nov
 *  backup shape {metadata, data:{books:[...]}}, {books:[...]}, or
 *  a bare array. Only doc `id` + the single `title` field exist —
 *  no slug/titleBn/titleEn. Docs without id or title are SKIPPED
 *  (counted, never invented). Returns { books, skipped }. */
export function normalizeBooksFixture(data) {
  const raw = Array.isArray(data) ? data : (data?.data?.books ?? data?.books ?? []);
  const books = [];
  let skipped = 0;
  for (const doc of raw) {
    if (!doc || typeof doc.id !== 'string' || !doc.id || typeof doc.title !== 'string' || !doc.title) {
      skipped += 1;
      continue;
    }
    books.push({
      id: doc.id,
      title: doc.title,
      subject: typeof doc.subject === 'string' ? doc.subject : undefined,
      classLevel: typeof doc.classLevel === 'string' ? doc.classLevel : undefined,
      board: typeof doc.board === 'string' ? doc.board : undefined,
      program: typeof doc.program === 'string' ? doc.program : undefined,
      department: typeof doc.department === 'string' ? doc.department : undefined,
      paperCode: typeof doc.paperCode === 'string' ? doc.paperCode : undefined,
      chapterCount: typeof doc.chapterCount === 'number' ? doc.chapterCount : undefined,
      questionCount: typeof doc.questionCount === 'number' ? doc.questionCount : undefined,
    });
  }
  books.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { books, skipped };
}

function restString(fields, key) {
  const v = fields?.[key];
  return v && typeof v.stringValue === 'string' ? v.stringValue : undefined;
}

function restInt(fields, key) {
  const v = fields?.[key];
  if (!v || typeof v.integerValue !== 'string') return undefined;
  const n = Number.parseInt(v.integerValue, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** One Firestore REST document -> BookDoc (same shape as the
 *  fixture normaliser). Throws on a doc without id/title. */
export function parseFirestoreRestDoc(doc) {
  const id = typeof doc?.name === 'string' ? doc.name.split('/').pop() : '';
  const fields = doc?.fields ?? {};
  const title = restString(fields, 'title');
  if (!id || !title) throw new Error(`REST book doc without id/title: ${doc?.name ?? '(no name)'}`);
  return {
    id,
    title,
    subject: restString(fields, 'subject'),
    classLevel: restString(fields, 'classLevel'),
    board: restString(fields, 'board'),
    program: restString(fields, 'program'),
    department: restString(fields, 'department'),
    paperCode: restString(fields, 'paperCode'),
    chapterCount: restInt(fields, 'chapterCount'),
    questionCount: restInt(fields, 'questionCount'),
  };
}

/** Live REST read of the `books` collection (Spark, public read).
 *  Paged (pageSize 300). 429 fails fast — quota, retry later or
 *  use --books-file. Returns books sorted by id. */
export async function fetchBooksFromRest(projectId, fetchImpl = fetch) {
  const books = [];
  let pageToken = '';
  for (;;) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/books` +
      `?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetchImpl(url);
    if (res.status === 429) {
      throw new Error(
        'Firestore REST returned 429 (quota exhausted — Spark 50k/day). ' +
          'Do NOT retry in a loop. Use --books-file with the 24 Nov backup, or retry after the quota reset (~14:00 Dhaka).',
      );
    }
    if (!res.ok) {
      throw new Error(`Firestore REST ${res.status} reading books (project ${projectId}). Check the books read rule / project id.`);
    }
    const body = await res.json();
    for (const doc of body.documents ?? []) books.push(parseFirestoreRestDoc(doc));
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }
  books.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return books;
}

// ---------------------------------------------------------------------------
// Book head + summary (mirrors bookSeoData() in src/lib/seo.ts).
// ---------------------------------------------------------------------------

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://eduvelto.com#organization',
  name: 'Eduvelto',
  alternateName: 'এডুভেল্টো',
  url: SITE_URL,
  logo: 'https://eduvelto.com/logo.png',
  slogan: 'Learn • Grow • Achieve',
  foundingDate: '2026',
  founder: { '@type': 'Person', '@id': 'https://eduvelto.com/founder#person', name: 'Ali Hasan Mohammed Mizan', jobTitle: 'Founder & CEO' },
  areaServed: { '@type': 'Country', name: 'Bangladesh' },
  sameAs: [
    'https://www.youtube.com/@EduveltoBD',
    'https://www.linkedin.com/company/eduvelto',
    'https://www.facebook.com/EduveltoBD',
  ],
};

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://eduvelto.com#website',
  name: 'Eduvelto',
  alternateName: 'এডুভেল্টো',
  url: SITE_URL,
  inLanguage: ['bn', 'en'],
  publisher: { '@id': 'https://eduvelto.com#organization' },
};

/** Head-tag HTML for a book page (title, description, canonical,
 *  reciprocal hreflang, OG, Twitter, Book + WebPage JSON-LD).
 *  Same formulas as bookSeoData() — the test asserts the two agree
 *  on the fixture's first book. */
export function buildBookHead(book, lang) {
  const path = `/books/${book.id}`;
  const canonical = canonicalUrl(path, lang);
  const title = `${book.title} | Eduvelto`;
  const parts = [];
  if (book.subject) parts.push(book.subject);
  if (book.classLevel) parts.push(book.classLevel);
  if (book.board) parts.push(book.board);
  if (book.program) parts.push(book.program);
  if (book.paperCode) parts.push(`Code ${book.paperCode}`);
  if (typeof book.chapterCount === 'number') parts.push(`Chapters ${book.chapterCount}`);
  if (typeof book.questionCount === 'number') parts.push(`Questions ${book.questionCount}`);
  const description =
    lang === 'bn'
      ? `${book.title} — ${parts.length > 0 ? `${parts.join(' · ')}। ` : ''}Eduvelto ডিজিটাল লাইব্রেরির বই — সম্পূর্ণ ফ্রি।`
      : `${book.title} — ${parts.length > 0 ? `${parts.join(' · ')}. ` : ''}A book in the Eduvelto digital library — completely free.`;
  const ogLocale = lang === 'bn' ? 'bn_BD' : 'en_US';
  const ogAlt = lang === 'bn' ? 'en_US' : 'bn_BD';
  const jsonLd = [
    ORGANIZATION_JSON_LD,
    WEBSITE_JSON_LD,
    {
      '@context': 'https://schema.org',
      '@type': 'Book',
      '@id': `${canonical}#book`,
      url: canonical,
      name: book.title,
      inLanguage: ['bn', 'en'],
      isPartOf: { '@id': 'https://eduvelto.com#website' },
      ...(book.subject ? { about: book.subject } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      inLanguage: [lang],
      isPartOf: { '@id': 'https://eduvelto.com#website' },
    },
  ];
  const e = escapeHtml;
  return [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="bn" href="${canonicalUrl(path, 'bn')}" />`,
    `<link rel="alternate" hreflang="en" href="${canonicalUrl(path, 'en')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${canonicalUrl(path, 'bn')}" />`,
    `<meta property="og:title" content="${e(title)}" />`,
    `<meta property="og:description" content="${e(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:locale" content="${ogLocale}" />`,
    `<meta property="og:locale:alternate" content="${ogAlt}" />`,
    `<meta property="og:image" content="https://eduvelto.com/og-image.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(title)}" />`,
    `<meta name="twitter:description" content="${e(description)}" />`,
    `<meta name="twitter:image" content="https://eduvelto.com/og-image.jpg" />`,
    ...jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`),
  ].join('\n    ');
}

/** Visible book summary prepended to the prerendered book page
 *  (crawlers + no-JS visitors see real content; the app replaces
 *  it once JavaScript loads). Only real doc fields are shown. */
export function buildBookSummaryHtml(book, lang) {
  const e = escapeHtml;
  const facts = [];
  if (book.subject) facts.push(e(book.subject));
  if (book.classLevel) facts.push(e(book.classLevel));
  if (book.board) facts.push(e(book.board));
  if (book.program) facts.push(e(book.program));
  if (book.department && book.department !== book.subject) facts.push(e(book.department));
  if (book.paperCode) facts.push(lang === 'bn' ? `কোড ${e(book.paperCode)}` : `Code ${e(book.paperCode)}`);
  if (typeof book.chapterCount === 'number')
    facts.push(lang === 'bn' ? `অধ্যায় ${book.chapterCount}` : `Chapters ${book.chapterCount}`);
  if (typeof book.questionCount === 'number')
    facts.push(lang === 'bn' ? `প্রশ্ন ${book.questionCount}` : `Questions ${book.questionCount}`);
  return (
    `<section data-prerender="book-summary" style="max-width:720px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif">` +
    `<h1>${e(book.title)}</h1>` +
    (facts.length > 0 ? `<p>${facts.join(' · ')}</p>` : '') +
    `<p><a href="/${lang}/books">${lang === 'bn' ? '← লাইব্রেরি' : '← Library'}</a></p>` +
    `</section>`
  );
}

/** Rewrite bare internal hrefs in rendered HTML to /{lang}/... .
 *  Only the segments in LINK_REWRITE_SEGMENTS are rewritten; asset
 *  paths and already-prefixed hrefs are untouched. */
export function rewriteInternalHrefs(html, lang) {
  const seg = LINK_REWRITE_SEGMENTS.join('|');
  return html
    .replace(new RegExp(`href="/(${seg})(?=/|")`, 'g'), `href="/${lang}/$1`)
    .replace(/href="\/"/g, `href="/${lang}"`);
}

/** Sitemap: canonical /bn + /en URLs only, reciprocal hreflang. */
export function buildSitemapXml(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
        `    <xhtml:link rel="alternate" hreflang="bn" href="${u.bn}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="en" href="${u.en}" />\n` +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${u.bn}" />\n  </url>`,
    )
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${entries}\n</urlset>\n`
  );
}

export function buildRobotsTxt() {
  return (
    `# Eduvelto robots.txt — GENERATED by scripts/prerender.mjs (Phase 1, 25 Nov 2026).\n` +
    `# Public pages are crawlable under /bn/ and /en/. /books/ is deliberately\n` +
    `# NOT disallowed any more — book pages are public prerendered content now.\n` +
    `# Login-gated, admin and noindex routes stay disallowed.\n` +
    `\nUser-agent: *\nAllow: /\n` +
    `Disallow: /app/\nDisallow: /login\nDisallow: /register\nDisallow: /admin\nDisallow: /ceo\n` +
    `Disallow: /profile\nDisallow: /dashboard\nDisallow: /student\nDisallow: /teacher\nDisallow: /guardian\n` +
    `Disallow: /jobs/dashboard\nDisallow: /admissions/dashboard\nDisallow: /social\nDisallow: /skills\n` +
    `Disallow: /exam\nDisallow: /routine\nDisallow: /progress\nDisallow: /directory\nDisallow: /quiz/\n` +
    `Disallow: /lessons/\nDisallow: /subjects/\nDisallow: /search\nDisallow: /bn/search\nDisallow: /en/search\n` +
    `Disallow: /ai-teacher\nDisallow: /bn/ai-teacher\nDisallow: /en/ai-teacher\n` +
    `\nSitemap: https://eduvelto.com/sitemap.xml\n`
  );
}

// ---------------------------------------------------------------------------
// Rendering.
// ---------------------------------------------------------------------------

/** Strip the shell's static SEO tags from <head> so the rendered
 *  helmet tags are the only title/meta/canonical/hreflang/OG tags.
 *  Static tags that are NOT SEO (charset, viewport, icons, fonts,
 *  theme-color, adsense-account, inline style) are kept. */
export function stripShellSeo(headInner) {
  return headInner
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta property="og:[^>]*>/g, '')
    .replace(/<meta name="twitter:[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>/g, '');
}

function writeFile(outDir, relPath, content) {
  const full = join(outDir, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
}

function parseArgs(argv) {
  const args = { booksFile: process.env.PRERENDER_BOOKS_FILE ?? null, live: false, project: DEFAULT_PROJECT_ID, dist: 'dist', distSsr: 'dist-ssr' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--books-file') args.booksFile = argv[++i];
    else if (argv[i] === '--live') args.live = true;
    else if (argv[i] === '--project') args.project = argv[++i];
    else if (argv[i] === '--dist') args.dist = argv[++i];
    else if (argv[i] === '--dist-ssr') args.distSsr = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const distDir = join(root, args.dist);
  const distSsrDir = join(root, args.distSsr);
  const templatePath = join(distDir, 'index.html');
  const ssrEntryPath = join(distSsrDir, 'entry-server.js');
  if (!existsSync(templatePath)) throw new Error(`dist template missing: ${templatePath} — run 'npm run build' first.`);
  if (!existsSync(ssrEntryPath)) throw new Error(`SSR bundle missing: ${ssrEntryPath} — run 'vite build --ssr src/entry-server.tsx --outDir dist-ssr' first.`);

  // --- Book data (exactly one source; the script refuses to guess) ---
  let books;
  let booksSource;
  if (args.booksFile) {
    const raw = JSON.parse(readFileSync(args.booksFile, 'utf8'));
    const { books: list, skipped } = normalizeBooksFixture(raw);
    books = list;
    booksSource = `fixture ${args.booksFile} (skipped ${skipped} docs without id/title)`;
  } else if (args.live) {
    books = await fetchBooksFromRest(args.project);
    booksSource = `live Firestore REST (project ${args.project})`;
  } else {
    throw new Error(
      'No book source given. Use --books-file <path> (local fixture — required while live Firestore is 429-limited) or --live (Firestore REST).',
    );
  }
  console.log(`Books: ${books.length} (${booksSource})`);

  // --- Guide coverage check (warn, never fail the build on it) ---
  try {
    const guideSource = readFileSync(join(root, 'src/lib/publicGuides.ts'), 'utf8');
    const guidePaths = getGuidePaths(guideSource);
    const missing = guidePaths.filter((p) => !PRERENDER_STATIC_PATHS.includes(p));
    if (missing.length > 0) console.warn(`WARN: ${missing.length} guide(s) not in PRERENDER_STATIC_PATHS: ${missing.join(', ')}`);
    else console.log(`Guides: ${guideSlugs.length} slugs, all covered by PRERENDER_STATIC_PATHS`);
  } catch (err) {
    console.warn(`WARN: could not verify guide coverage: ${err.message}`);
  }

  // --- SSR renderer ---
  const { render } = await import(pathToFileURL(ssrEntryPath).href);
  const template = readFileSync(templatePath, 'utf8');
  const rootMarker = '<div id="root">';
  const rootStart = template.indexOf(rootMarker);
  const rootCloseMarker = '</div>\n    <script>';
  const rootClose = template.indexOf(rootCloseMarker, rootStart);
  if (rootStart === -1 || rootClose === -1) throw new Error('dist/index.html template shape changed: cannot locate the #root loader block.');
  const headStart = template.indexOf('<head>');
  const headEnd = template.indexOf('</head>');
  if (headStart === -1 || headEnd === -1) throw new Error('dist/index.html template has no <head> block.');
  const shellHeadInner = template.slice(headStart + '<head>'.length, headEnd);

  let rendered = 0;
  let renderFallbacks = 0;
  const noindexWarnings = [];
  const sitemapUrls = [];

  function buildPage({ url, lang, headOverride, prependHtml }) {
    let appHtml = '';
    let helmetHtml = '';
    try {
      const { html, helmet } = render(url);
      appHtml = html;
      if (helmet) {
        helmetHtml = [helmet.title.toString(), helmet.meta.toString(), helmet.link.toString(), helmet.script.toString()].join('\n    ');
        // Helmet's server string keeps React's hrefLang casing; HTML
        // attribute names are case-insensitive, but static files
        // carry the textbook-lowercase form.
        helmetHtml = helmetHtml.replace(/hrefLang=/g, 'hreflang=');
      }
    } catch (err) {
      renderFallbacks += 1;
      console.warn(`WARN: SSR render failed for ${url}: ${err.message} — writing shell + head only.`);
    }
    const headTags = headOverride ?? helmetHtml;
    // Check the FINAL head: book pages override the fallback helmet
    // head (which carries noindex) with buildBookHead(), so testing
    // helmetHtml here false-positived all 1,218 book pages.
    if (/name="robots" content="noindex/.test(headTags)) noindexWarnings.push(url);
    // A failed render yields no helmet tags at all — then keep the
    // shell's static home head rather than shipping a title-less page.
    const headInner = headTags ? stripShellSeo(shellHeadInner) : shellHeadInner;
    let out = template.slice(0, headStart + '<head>'.length) + headInner + '\n    ' + headTags + '\n  ' + template.slice(headEnd);
    out = out.replace('<html lang="bn">', `<html lang="${lang}">`);
    const rewritten = rewriteInternalHrefs(appHtml, lang);
    const body = (prependHtml ?? '') + rewritten;
    const outRootStart = out.indexOf(rootMarker);
    const outRootClose = out.indexOf(rootCloseMarker, outRootStart);
    out = out.slice(0, outRootStart + rootMarker.length) + '\n' + body + '\n    ' + out.slice(outRootClose);
    return out;
  }

  function outPath(lang, barePath) {
    const clean = barePath.replace(/\/+$/, '') || '/';
    return clean === '/' ? `${lang}/index.html` : `${lang}${clean}/index.html`;
  }

  // --- Static pages (both langs) ---
  for (const barePath of PRERENDER_STATIC_PATHS) {
    for (const lang of LANGS) {
      const url = withLangPrefix(barePath, lang);
      const page = buildPage({ url, lang });
      writeFile(distDir, outPath(lang, barePath), page);
      rendered += 1;
    }
    sitemapUrls.push({ loc: canonicalUrl(barePath, 'bn'), bn: canonicalUrl(barePath, 'bn'), en: canonicalUrl(barePath, 'en') });
  }

  // --- Book pages (both langs) ---
  for (const book of books) {
    for (const lang of LANGS) {
      const url = withLangPrefix(`/books/${book.id}`, lang);
      const page = buildPage({
        url,
        lang,
        headOverride: buildBookHead(book, lang),
        prependHtml: buildBookSummaryHtml(book, lang),
      });
      writeFile(distDir, outPath(lang, `/books/${book.id}`), page);
      rendered += 1;
    }
    sitemapUrls.push({
      loc: canonicalUrl(`/books/${book.id}`, 'bn'),
      bn: canonicalUrl(`/books/${book.id}`, 'bn'),
      en: canonicalUrl(`/books/${book.id}`, 'en'),
    });
  }

  // --- 404 (noindex fallback head from the SSR render of a junk URL) ---
  const notFound = buildPage({ url: '/bn/__prerender_missing__', lang: 'bn' });
  writeFile(distDir, '404.html', notFound);

  // --- dist/index.html = the /bn home (root / 301s to /bn in firebase.json) ---
  copyFileSync(join(distDir, 'bn/index.html'), join(distDir, 'index.html'));

  // --- robots.txt + sitemap.xml ---
  writeFile(distDir, 'robots.txt', buildRobotsTxt());
  writeFile(distDir, 'sitemap.xml', buildSitemapXml(sitemapUrls));

  console.log(`Rendered pages: ${rendered} (${PRERENDER_STATIC_PATHS.length} static paths x 2 langs + ${books.length} books x 2 langs)`);
  console.log(`Sitemap URLs: ${sitemapUrls.length * 2} (bn + en variants)`);
  console.log(`SSR render fallbacks (shell + head only): ${renderFallbacks}`);
  if (noindexWarnings.length > 0) {
    console.log(`WARN: ${noindexWarnings.length} prerendered URL(s) carry a noindex head (fallback SEO — check whether they should be indexable):`);
    for (const u of noindexWarnings) console.log(`  noindex: ${u}`);
  }
  console.log('Prerender done.');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((err) => {
    console.error(`prerender FAILED: ${err.message}`);
    process.exit(1);
  });
}
