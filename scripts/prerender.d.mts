// Type declarations for scripts/prerender.mjs (Phase 1, SSG +
// bilingual, 25 Nov 2026). The script itself is plain JS (it runs
// under node); this file types its exported API for the vitest
// suite + `tsc -b`. Keep the two in sync.

export const SITE_URL: string;
export const LANGS: string[];
export const DEFAULT_PROJECT_ID: string;
export const PRERENDER_STATIC_PATHS: string[];
export const LINK_REWRITE_SEGMENTS: string[];

export type PrerenderBook = {
  id: string;
  title: string;
  subject?: string;
  classLevel?: string;
  board?: string;
  program?: string;
  department?: string;
  paperCode?: string;
  chapterCount?: number;
  questionCount?: number;
};

export function escapeHtml(value: unknown): string;
export function getGuideSlugs(source: string): string[];
export function getGuidePaths(source: string): string[];
export function withLangPrefix(path: string, lang: string): string;
export function canonicalUrl(path: string, lang: string): string;
export function normalizeBooksFixture(data: unknown): { books: PrerenderBook[]; skipped: number };
export function parseFirestoreRestDoc(doc: unknown): PrerenderBook;
export function fetchBooksFromRest(
  projectId: string,
  fetchImpl?: (url: string) => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>,
): Promise<PrerenderBook[]>;
export function buildBookHead(book: PrerenderBook, lang: string): string;
export function buildBookSummaryHtml(book: PrerenderBook, lang: string): string;
export function rewriteInternalHrefs(html: string, lang: string): string;
export function buildSitemapXml(urls: Array<{ loc: string; bn: string; en: string }>): string;
export function buildRobotsTxt(): string;
export function stripShellSeo(headInner: string): string;
