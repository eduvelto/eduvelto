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
  bilingual?: boolean;
  educationType?: string;
  credit?: number;
  marks?: number;
};

export type PrerenderChapter = {
  id: string;
  bookId: string;
  title: string;
  part?: string;
  set?: number;
  order?: number;
  questionCount?: number;
  reviewStatus?: string;
  isPreview: boolean;
};

export type PayloadClassLevel = {
  slug: string;
  bookCount: number;
  subjectCount: number;
};

export type PayloadHomePopularBook = {
  id: string;
  title: string;
  questionCount: number;
  classLevel?: string;
  department?: string;
  subject?: string;
  chapterCount?: number;
};

export type InitialDataPayload =
  | { kind: 'book'; path: string; book: PrerenderBook; chapters: PrerenderChapter[] }
  | { kind: 'library'; path: string; books: PrerenderBook[]; lastDocId: string | null; hasMore: boolean }
  | { kind: 'class-index'; path: string; levels: PayloadClassLevel[] }
  | {
      kind: 'home';
      path: string;
      countsByType: Record<string, number>;
      honoursCount: number;
      mastersCount: number;
      totalCount: number;
      popular: PayloadHomePopularBook[];
    };

export function escapeHtml(value: unknown): string;
export function getGuideSlugs(source: string): string[];
export function getGuidePaths(source: string): string[];
export function getAcademicPracticePaths(source: string): string[];
export function getToolPaths(source: string): string[];
export function withLangPrefix(path: string, lang: string): string;
export function canonicalUrl(path: string, lang: string): string;
export function normalizeBooksFixture(data: unknown): { books: PrerenderBook[]; skipped: number };
export function parseFirestoreRestDoc(doc: unknown): PrerenderBook;
export function normalizeChaptersFixture(data: unknown): { chapters: PrerenderChapter[]; skipped: number };
export function parseChapterRestDoc(doc: unknown): PrerenderChapter;
export const CLASS_LEVEL_BOOK_FILTERS: Array<{ slug: string; educationType: string | null; classLevels: string[] }>;
export function buildClassLevelCounts(books: PrerenderBook[]): PayloadClassLevel[];
export function fetchCollectionFromRest(
  projectId: string,
  collection: string,
  parseDoc: (doc: unknown) => unknown,
  fetchImpl?: (
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ) => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>,
  extraFieldFilters?: Array<{ fieldPath: string; op: string; value: unknown }>,
): Promise<unknown[]>;
export function fetchBooksFromRest(
  projectId: string,
  fetchImpl?: (
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ) => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>,
): Promise<PrerenderBook[]>;
export function fetchChaptersFromRest(
  projectId: string,
  fetchImpl?: (
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: string },
  ) => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }>,
): Promise<PrerenderChapter[]>;
export function safeJsonForInlineScript(value: unknown): string;
export function buildInitialDataScriptTag(payload: InitialDataPayload): string;
export function insertInitialDataScript(html: string, tag: string): string;
export function toPayloadBook(book: PrerenderBook): PrerenderBook;
export function toPayloadChapter(chapter: PrerenderChapter): PrerenderChapter;
export function buildBookPayload(path: string, book: PrerenderBook, previewChapters: PrerenderChapter[]): Extract<InitialDataPayload, { kind: 'book' }>;
export function buildLibraryPayload(path: string, books: PrerenderBook[]): Extract<InitialDataPayload, { kind: 'library' }>;
export function buildClassIndexPayload(path: string, books: PrerenderBook[]): Extract<InitialDataPayload, { kind: 'class-index' }>;
export function buildHomePayload(path: string, books: PrerenderBook[]): Extract<InitialDataPayload, { kind: 'home' }>;
export function buildBookHead(book: PrerenderBook, lang: string): string;
export function buildBookSummary(book: PrerenderBook, lang: string): string;
export function buildBookSummaryHtml(book: PrerenderBook, lang: string): string;
export function rewriteInternalHrefs(html: string, lang: string): string;
export function buildSitemapXml(urls: Array<{ loc: string; bn: string; en: string }>): string;
export function buildRobotsTxt(): string;
export function stripShellSeo(headInner: string): string;
