// Eduvelto — bilingual routing helpers (Phase 1, SSG + bilingual,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Pure functions, no DOM / router imports, so they are unit-testable
// and reusable from App.tsx, LanguageContext, seo.ts, adsConfig and
// the prerender script's test-suite (the script itself is plain JS
// and mirrors these formulas — see scripts/prerender.mjs).
//
// URL model:
// - Public content lives under /:lang — /bn/... (default, x-default)
//   and /en/... . The lang segment is the source of truth for the
//   page language; LanguageProvider follows it (see LangLayout in
//   App.tsx + syncLanguageFromPath).
// - /app/* protected routes stay OUTSIDE /:lang (client-only,
//   login-gated) by decision — as do /admin, /ceo, /login,
//   /register, /profile, /dashboard, /student, /teacher, /guardian,
//   /directory, /subjects, /quiz. /exam, /routine, /progress,
//   /social are the same (bare canonical, never redirect) AND also
//   render under /:lang as duplicate routes (App.tsx, 8fdd9d1) so
//   /bn/exam etc. work instead of falling through to NotFound.
// - Legacy public URLs (e.g. /jobs/bcs, /library/<id>) 301-redirect
//   to /bn/... — in the browser via the LegacyRedirect routes in
//   App.tsx, and on the server via firebase.json redirects (which
//   evaluate BEFORE rewrites). legacyRedirectTarget() is the single
//   mapping both layers implement; the firebase.json test asserts
//   the two agree on the sampled routes.

export type SupportedLang = 'bn' | 'en';

export const SUPPORTED_LANGS: readonly SupportedLang[] = ['bn', 'en'];
export const DEFAULT_LANG: SupportedLang = 'bn';

/** Canonical site origin. seo.ts re-exports this (single source). */
export const SITE_URL = 'https://eduvelto.com';

export function isSupportedLang(value: unknown): value is SupportedLang {
  return value === 'bn' || value === 'en';
}

/** First path segment when it is a supported language, else null. */
export function parseLangSegment(pathname: string): SupportedLang | null {
  const first = pathname.split('/').filter(Boolean)[0];
  return isSupportedLang(first) ? first : null;
}

export type StrippedPath = { lang: SupportedLang | null; path: string };

/** Split a pathname into its /:lang prefix (if any) and the bare path.
//  '/' stays '/'; '/bn' -> { lang: 'bn', path: '/' };
//  '/bn/jobs/bcs/' -> { lang: 'bn', path: '/jobs/bcs' } (trailing
//  slash normalised away, as resolveRouteSeo does). */
export function stripLangPrefix(pathname: string): StrippedPath {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const lang = parseLangSegment(clean);
  if (!lang) return { lang: null, path: clean };
  const rest = clean.slice(lang.length + 1) || '/';
  return { lang, path: rest.startsWith('/') ? rest : `/${rest}` };
}

/** Prefix a bare (or already-prefixed) path with /{lang}.
//  withLangPrefix('/jobs/bcs', 'en') -> '/en/jobs/bcs';
//  withLangPrefix('/bn/jobs/bcs', 'en') -> '/en/jobs/bcs';
//  withLangPrefix('/', 'bn') -> '/bn'. */
export function withLangPrefix(path: string, lang: SupportedLang): string {
  const { path: bare } = stripLangPrefix(path.replace(/\/+$/, '') || '/');
  return bare === '/' ? `/${lang}` : `/${lang}${bare}`;
}

/** Alias kept for call sites that read better as "the lang URL". */
export const langUrl = withLangPrefix;

/** Absolute canonical URL for a (bare or prefixed) path in a language. */
export function canonicalUrl(path: string, lang: SupportedLang): string {
  return `${SITE_URL}${withLangPrefix(path, lang)}`;
}

/** Reciprocal hreflang set for a page: bn + en variants and
//  x-default, which always points at the Bangla URL. Accepts a bare
//  path or an absolute canonical URL. */
export function hreflangUrls(
  pathOrCanonical: string,
  _lang: SupportedLang,
): { bn: string; en: string; xDefault: string } {
  const bare = pathOrCanonical.startsWith('http')
    ? stripLangPrefix(new URL(pathOrCanonical).pathname).path
    : stripLangPrefix(pathOrCanonical).path;
  const bn = canonicalUrl(bare, 'bn');
  const en = canonicalUrl(bare, 'en');
  return { bn, en, xDefault: bn };
}

/** Swap (or add) the /:lang segment of an absolute canonical URL. */
export function alternateLangUrl(canonical: string, target: SupportedLang): string {
  try {
    const url = new URL(canonical);
    const { path } = stripLangPrefix(url.pathname);
    url.pathname = withLangPrefix(path, target);
    return url.toString().replace(/\/+$/, '') || url.toString();
  } catch {
    return canonicalUrl('/', target);
  }
}

/** Remove the legacy `lang` query param from a search string.
//  withoutLangParam('?lang=en') -> ''; withoutLangParam('?lang=en&a=1')
//  -> '?a=1'; withoutLangParam('?a=1') -> '?a=1'. The `?lang=` param
//  is legacy-only (25 Nov 2026 ?lang= fix): the /:lang path segment
//  is the only language carrier, and old ?lang= URLs redirect to
//  clean paths (see LanguageContext + LegacyRedirect + LangLayout). */
export function withoutLangParam(search: string): string {
  try {
    const params = new URLSearchParams(search);
    if (!params.has('lang')) return search;
    params.delete('lang');
    const rest = params.toString();
    return rest ? `?${rest}` : '';
  } catch {
    return search;
  }
}

/** Root '/' redirect language. Priority (owner order for the root
//  redirect): ?lang > localStorage > user profile, default 'bn'.
//  NOTE: this differs deliberately from LanguageProvider's runtime
//  priority (?lang > profile > localStorage) — at first landing the
//  profile is not loaded yet, so the stored device choice is the
//  only synchronous signal after ?lang; once signed in, the
//  provider adopts the profile language. */
export function resolveRootLang(opts: {
  queryLang?: string | null;
  storedLang?: string | null;
  profileLang?: string | null;
}): SupportedLang {
  if (isSupportedLang(opts.queryLang)) return opts.queryLang;
  if (isSupportedLang(opts.storedLang)) return opts.storedLang;
  if (isSupportedLang(opts.profileLang)) return opts.profileLang;
  return DEFAULT_LANG;
}

// ---------------------------------------------------------------------------
// Legacy redirects
// ---------------------------------------------------------------------------

/** Top-level segments of legacy public URLs. Anything under one of
//  these redirects to /{lang}/<same rest>. /books and /library are
//  special-cased below (book pages canonicalise to /books/:id). */
export const LEGACY_PUBLIC_SEGMENTS: readonly string[] = [
  'class',
  'skills',
  'admissions',
  'jobs',
  'learn',
  'guides',
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
  // Phase 3 (25 Nov 2026): /support is a real lang-prefixed route
  // now (/bn/support), so 'support' lives here instead of in
  // LEGACY_ALIASES below — same pattern as 'guides' in Phase 2.
  'support',
  // 7-day sprint, Day 6 (26 Nov 2026): /suggestions is a real
  // lang-prefixed route now (/bn/suggestions, the Suggestion PDF
  // Store) — same pattern as 'support' above.
  'suggestions',
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
  // 23:00 check (25 Nov 2026): the generator/pricing/OMR pages are
  // real lang-prefixed routes (/bn/...) whose BARE URLs are linked
  // from the homepage — firebase.json 301s them, and this list is
  // the client-side half of the same contract (see the
  // firebaseHosting agreement test).
  'question-maker',
  'question-paper-generator',
  'pricing',
  'omr-evaluator',
  'custom-paper',
];

/** Short legacy aliases that never existed as routes but were used
//  in copy / bookmarks: they map to the real lang-prefixed page. */
// /support is NOT an alias any more (Phase 3, 25 Nov 2026): it is a
// real lang-prefixed route (/bn/support, the Support Eduvelto
// page), so 'support' lives in LEGACY_PUBLIC_SEGMENTS above.
export const LEGACY_ALIASES: Readonly<Record<string, string>> = {
  '/bcs': '/jobs/bcs',
  '/bank': '/jobs/bank',
  '/primary': '/jobs/primary-teacher',
  '/ntrca': '/jobs/ntrca',
  '/admission': '/admissions',
};
// /guides is NOT an alias any more (Phase 2, 25 Nov 2026): it is a
// real lang-prefixed route (/bn/guides, the Study Guides hub), so
// 'guides' lives in LEGACY_PUBLIC_SEGMENTS above instead.

/** First segments that NEVER redirect: app / auth / admin routes
//  stay exactly where they are. */
const NON_REDIRECT_SEGMENTS: readonly string[] = [
  'admin',
  'ceo',
  'login',
  'register',
  'profile',
  'dashboard',
  'student',
  'teacher',
  'guardian',
  'directory',
  'subjects',
  'quiz',
  'exam',
  'routine',
  'progress',
  'social',
  'app',
];

/** Map a legacy public pathname to its /{lang}/... target, or null
//  when the path must not redirect (already lang-prefixed, or a
//  private/app route, or '/').
//  Special cases:
//  - '/jobs/primary' (+ trailing slash) -> '/{lang}/jobs/primary-teacher'
//    (the pre-existing firebase.json 301, kept as a redirect, now
//    pointing at the lang-prefixed target).
//  - '/library' -> '/{lang}/books' and '/library/:id' ->
//    '/{lang}/books/:id' (book pages canonicalise to /books/:id;
//    /:lang/library/:id keeps rendering BookPage as an alias, but
//    the redirect + canonical both point at /books/:id). */
export function legacyRedirectTarget(
  pathname: string,
  lang: SupportedLang = DEFAULT_LANG,
): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return null;
  if (parseLangSegment(clean)) return null; // already lang-prefixed
  const alias = LEGACY_ALIASES[clean];
  if (alias) return withLangPrefix(alias, lang);
  const seg = clean.split('/').filter(Boolean)[0] ?? '';
  if (NON_REDIRECT_SEGMENTS.includes(seg)) return null;
  if (!LEGACY_PUBLIC_SEGMENTS.includes(seg)) return null;
  if (clean === '/jobs/primary') return withLangPrefix('/jobs/primary-teacher', lang);
  // Phase 2 (25 Nov 2026): the privacy policy's canonical URL is
  // /:lang/privacy-policy — the old /privacy URL 301s to it.
  if (clean === '/privacy') return withLangPrefix('/privacy-policy', lang);
  if (clean === '/library') return withLangPrefix('/books', lang);
  const libBook = clean.match(/^\/library\/([^/]+)(\/.*)?$/);
  if (libBook) return withLangPrefix(`/books/${libBook[1]}${libBook[2] ?? ''}`, lang);
  return withLangPrefix(clean, lang);
}

/** Where the language toggle should navigate for a language switch:
 *  the same page under the new /:lang prefix — for public pages
 *  (already prefixed, or legacy public). Private/app routes have no
 *  lang prefix, so the toggle only changes state there (no
 *  navigation) and the URL is left alone. Returns null when there
 *  is no lang-prefixed target for this path. */
export function langSwitchTarget(pathname: string, lang: SupportedLang): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (parseLangSegment(clean)) return withLangPrefix(clean, lang);
  if (legacyRedirectTarget(clean, lang)) return withLangPrefix(clean, lang);
  return null;
}

// ---------------------------------------------------------------------------
// Guide slugs (correction (c): a regex reader returns m[1], the slug
// string — never the whole match array).
// ---------------------------------------------------------------------------

/** Extract `slug: '...'` values from the PUBLIC_GUIDES source text
//  (src/lib/publicGuides.ts). The prerender script mirrors this
//  regex in plain JS; both are tested to return the slug strings. */
export function getGuideSlugs(source: string): string[] {
  const slugs: string[] = [];
  const re = /slug:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}
