// Eduvelto — content fetchers (Phase 2, Step 2 + Step 3).
//
// One-time reads only (getDoc / getDocs, no realtime listeners) —
// plan §5 write/read budget discipline. Students see only
// reviewStatus == "Published" rows; drafts stay invisible because the
// security rules deny the read (and we also filter client-side).

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  documentId,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

/** Books shown per page (owner decision, 21 Nov 2026). */
export const PAGE_SIZE = 50;

export interface Book {
  id: string;
  title: string;
  paperCode: string;
  educationType: string;
  board: string;
  program: string;
  classLevel: string;
  department: string;
  departments: string[];
  subject: string;
  sourceType: string;
  sourceUrl: string;
  language: string;
  bilingual: boolean;
  questionCount: number;
  chapterCount: number;
  reviewStatus: string;
  credit?: number | null;
  marks?: number | null;
  /**
   * Cascading-filter fields (loader-stored; see scripts/load-library-content.mjs
   * deriveCascadeFields). OPTIONAL: live rows do not carry them yet (live
   * writes need separate owner approval), so readers must not require them —
   * the Directory queries translate cascade selections to the legacy fields
   * above instead (cascadeToDirectoryFilters).
   */
  stream?: 'general' | 'madrasa' | 'technical' | 'higher';
  level?: string;
  group?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  part: string;
  set: number;
  order: number;
  questionCount: number;
  reviewStatus: string;
  /**
   * Auth gating (owner instruction 22 Nov 2026): the FIRST chapter of
   * each book is the guest preview (`isPreview: true`, set by the
   * loader). Guests may read preview chapters only; every other
   * chapter requires login. Missing on live rows until the loader
   * re-runs — missing means NOT a preview.
   */
  isPreview: boolean;
}

export interface LessonQuestion {
  n: number;
  kind: string;
  label: string;
  question: string;
  topic: string;
  options: { letter: string; text: string }[];
  correctLetter: string;
  correctText: string;
  answer: string;
  answerBn: string;
  explanation: string;
}

export interface Lesson {
  id: string;
  bookId: string;
  chapterId: string;
  title: string;
  part: string;
  set: number;
  body: string;
  questions: LessonQuestion[];
  questionCount: number;
  reviewStatus: string;
  /**
   * Auth gating (owner instruction 22 Nov 2026): mirrors its chapter's
   * isPreview — a lesson is guest-readable only when its chapter is the
   * book's preview chapter. Missing on live rows until the loader
   * re-runs — missing means NOT a preview.
   */
  isPreview: boolean;
}

export interface DirectoryRow {
  id: string;
  type: string;
  board: string;
  program: string;
  classLevel: string;
  department: string;
  subject: string;
  paperCode: string;
  paperTitle: string;
  bookId: string;
  title: string;
  reviewStatus: string;
  /** Cascading-filter fields — loader-stored, optional; see Book.stream. */
  stream?: 'general' | 'madrasa' | 'technical' | 'higher';
  level?: string;
  group?: string;
}

function toBook(id: string, d: Record<string, unknown>): Book {
  return {
    id,
    title: (d.title as string) ?? '',
    paperCode: (d.paperCode as string) ?? '',
    educationType: (d.educationType as string) ?? '',
    board: (d.board as string) ?? '',
    program: (d.program as string) ?? '',
    classLevel: (d.classLevel as string) ?? '',
    department: (d.department as string) ?? '',
    departments: (d.departments as string[]) ?? [],
    subject: (d.subject as string) ?? '',
    sourceType: (d.sourceType as string) ?? '',
    sourceUrl: (d.sourceUrl as string) ?? '',
    language: (d.language as string) ?? '',
    bilingual: (d.bilingual as boolean) ?? false,
    questionCount: (d.questionCount as number) ?? 0,
    chapterCount: (d.chapterCount as number) ?? 0,
    reviewStatus: (d.reviewStatus as string) ?? '',
    credit: (d.credit as number) ?? null,
    marks: (d.marks as number) ?? null,
    stream: typeof d.stream === 'string' ? (d.stream as Book['stream']) : undefined,
    level: typeof d.level === 'string' ? d.level : undefined,
    group: typeof d.group === 'string' ? d.group : undefined,
  };
}

function toChapter(id: string, d: Record<string, unknown>): Chapter {
  return {
    id,
    bookId: (d.bookId as string) ?? '',
    title: (d.title as string) ?? '',
    part: (d.part as string) ?? '',
    set: (d.set as number) ?? 1,
    order: (d.order as number) ?? 0,
    questionCount: (d.questionCount as number) ?? 0,
    reviewStatus: (d.reviewStatus as string) ?? '',
    // Strict: only an explicit true counts (live rows lack the field
    // until the loader re-runs — they are NOT previews).
    isPreview: d.isPreview === true,
  };
}

function toLesson(id: string, d: Record<string, unknown>): Lesson {
  return {
    id,
    bookId: (d.bookId as string) ?? '',
    chapterId: (d.chapterId as string) ?? '',
    title: (d.title as string) ?? '',
    part: (d.part as string) ?? '',
    set: (d.set as number) ?? 1,
    body: (d.body as string) ?? '',
    questions: (d.questions as LessonQuestion[]) ?? [],
    questionCount: (d.questionCount as number) ?? 0,
    reviewStatus: (d.reviewStatus as string) ?? '',
    // Strict: only an explicit true counts (see toChapter).
    isPreview: d.isPreview === true,
  };
}

function toDirectoryRow(id: string, d: Record<string, unknown>): DirectoryRow {
  return {
    id,
    type: (d.type as string) ?? '',
    board: (d.board as string) ?? '',
    program: (d.program as string) ?? '',
    classLevel: (d.classLevel as string) ?? '',
    department: (d.department as string) ?? '',
    subject: (d.subject as string) ?? '',
    paperCode: (d.paperCode as string) ?? '',
    paperTitle: (d.paperTitle as string) ?? '',
    bookId: (d.bookId as string) ?? '',
    title: (d.title as string) ?? '',
    reviewStatus: (d.reviewStatus as string) ?? '',
    stream: typeof d.stream === 'string' ? (d.stream as DirectoryRow['stream']) : undefined,
    level: typeof d.level === 'string' ? d.level : undefined,
    group: typeof d.group === 'string' ? d.group : undefined,
  };
}

/** The Library list's sort order (class, then department, then title). */
export function compareBooks(a: Book, b: Book): number {
  return (
    a.classLevel.localeCompare(b.classLevel) ||
    a.department.localeCompare(b.department) ||
    a.title.localeCompare(b.title)
  );
}

export function sortBooks(books: Book[]): Book[] {
  return [...books].sort(compareBooks);
}

/** The Directory list's sort order (class, then department, then paper title). */
export function compareDirectoryRows(a: DirectoryRow, b: DirectoryRow): number {
  return (
    a.classLevel.localeCompare(b.classLevel) ||
    a.department.localeCompare(b.department) ||
    a.paperTitle.localeCompare(b.paperTitle)
  );
}

export function sortDirectoryRows(rows: DirectoryRow[]): DirectoryRow[] {
  return [...rows].sort(compareDirectoryRows);
}

export interface BookFilters {
  educationType?: string;
  classLevel?: string;
  department?: string;
}

export interface DirectoryFilters {
  type?: string;
  /** `in` list for `type` — used only for stream=general with level=All
   * (SSC + HSC). Mutually exclusive with `type`; never set both. */
  types?: string[];
  board?: string;
  program?: string;
  classLevel?: string;
  department?: string;
}

export interface PageResult<T> {
  items: T[];
  /** Last document snapshot of this page — the cursor for the next page. Null on an empty page. */
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  /** True when this page was full, so a next page may exist. */
  hasMore: boolean;
}

function bookConstraints(filters: BookFilters): QueryConstraint[] {
  const cs: QueryConstraint[] = [where('reviewStatus', '==', 'Published')];
  if (filters.educationType) cs.push(where('educationType', '==', filters.educationType));
  if (filters.classLevel) cs.push(where('classLevel', '==', filters.classLevel));
  if (filters.department) cs.push(where('department', '==', filters.department));
  return cs;
}

function directoryConstraints(filters: DirectoryFilters): QueryConstraint[] {
  const cs: QueryConstraint[] = [where('reviewStatus', '==', 'Published')];
  if (filters.type) cs.push(where('type', '==', filters.type));
  else if (filters.types?.length) cs.push(where('type', 'in', filters.types));
  if (filters.board) cs.push(where('board', '==', filters.board));
  if (filters.program) cs.push(where('program', '==', filters.program));
  if (filters.classLevel) cs.push(where('classLevel', '==', filters.classLevel));
  if (filters.department) cs.push(where('department', '==', filters.department));
  return cs;
}

// ---------------------------------------------------------------------------
// Cascading filters → legacy directory fields.
//
// The cascade (src/lib/taxonomy.ts CASCADE_STREAMS) selects stream / level /
// class / group, but live `educationDirectory` rows do NOT yet carry the
// stream/level/group fields — live writes need separate owner approval, and
// the loader stores them only in the emulator / future loads. So the
// cascade queries MUST translate to the legacy fields the live rows DO
// carry (type / program / classLevel / department), which is what this
// function does. It is the single translation point: the DirectoryPage
// never builds DirectoryFilters by hand.
//
// Translation table (verified against the live inventory, 609 books):
//   general + level Secondary        -> type 'SSC'
//   general + level Higher Secondary -> type 'HSC'
//   general + level All              -> type IN ['SSC','HSC']  (needs the V-1 probe)
//   general + class 'SSC'/'HSC'      -> classLevel 'SSC'/'HSC' (also fixes type)
//   general + group                  -> program 'Science'/'Commerce'/'Humanities'
//   madrasa + level                  -> type 'Madrasa', program == classLevel == level
//                                      (group == level for madrasa; NOT department,
//                                      whose live value is 'Madrasa')
//   technical + level                -> type 'Technical', program == classLevel == level
//                                      (group == level; department == level too)
//   higher + level 'Honours'         -> type 'Higher', program 'Honours'
//   higher + class 'Nth Year'        -> classLevel 'Nth Year'
//   higher + group                   -> department '<department>'
//
// ONE-LINE SWITCH (when live rows carry stream/level/group): replace this
// function with a direct mapping —
//   { ...(stream && { stream }), ...(level && { level }),
//     ...(classLevel && { group: classLevel }), ...(group && { group }) }
// — and add where('stream'/'level'/'group', '==', …) to directoryConstraints.
// Do NOT flip it before the live re-run is approved and verified.
// ---------------------------------------------------------------------------

export interface CascadeSelection {
  /** '' = All streams (no stream filter). */
  stream: '' | 'general' | 'madrasa' | 'technical' | 'higher';
  /** Program / Level value; '' = All. */
  level: string;
  /** Class / Year / Semester value; '' = All. */
  classLevel: string;
  /** Group / Department / Trade value; '' = All. */
  group: string;
}

export function cascadeToDirectoryFilters(sel: CascadeSelection): DirectoryFilters {
  const f: DirectoryFilters = {};
  if (!sel.stream) return f;
  switch (sel.stream) {
    case 'general': {
      if (sel.classLevel === 'SSC' || sel.classLevel === 'HSC') {
        // A class selection fixes the type exactly — no `in` needed.
        f.type = sel.classLevel;
        f.classLevel = sel.classLevel;
      } else if (sel.level === 'Secondary') {
        f.type = 'SSC';
      } else if (sel.level === 'Higher Secondary') {
        f.type = 'HSC';
      } else {
        // Stream chosen, level All: both general types.
        f.types = ['SSC', 'HSC'];
      }
      if (sel.group) f.program = sel.group;
      break;
    }
    case 'madrasa': {
      f.type = 'Madrasa';
      if (sel.level) {
        f.program = sel.level;
        f.classLevel = sel.level;
      }
      break;
    }
    case 'technical': {
      f.type = 'Technical';
      if (sel.level) {
        f.program = sel.level;
        f.classLevel = sel.level;
      }
      break;
    }
    case 'higher': {
      f.type = 'Higher';
      if (sel.level) f.program = sel.level;
      if (sel.classLevel) f.classLevel = sel.classLevel;
      if (sel.group) f.department = sel.group;
      break;
    }
  }
  return f;
}

/**
 * One page of Published books, server-side (50 reads at most).
 *
 * The query orders by DOCUMENT ID — the only orderBy shape that works
 * with the equality filters on live Firestore WITHOUT a composite index.
 * Verified against LIVE Firestore, read-only, 21 Nov 2026 (scripts
 * probe-live-queries.mjs + the inline F1–F4 probes): equality filters
 * (up to 3) + orderBy(documentId()) + limit(50) + startAfter all pass.
 * The shape the first draft used — orderBy('reviewStatus') with filters
 * — FAILS live with failed-precondition (composite index required);
 * the emulator does NOT enforce that, so the emulator run hid it.
 * All Published books share reviewStatus, so the effective order is
 * document ID order; each page is re-sorted client-side with
 * compareBooks so the books ON a page appear in the Library's usual
 * order. The GLOBAL order across pages is document-ID order, not the
 * old class/department/title order — restoring the old global order
 * needs a composite index (books: reviewStatus, classLevel, department,
 * title), which is a follow-up for the owner's approval, not built here.
 *
 * NO count() here: getCountFromServer FAILS on live Firestore right now
 * (resource-exhausted / Quota exceeded, reproducible 21 Nov 2026 even
 * as the first call of the day — see team/pagination-test-report.md
 * §5). The pages therefore show no exact total, only "showing X–Y"
 * and Previous/Next. Restoring totals needs either the count quota
 * fixed or a loader-maintained stats doc (owner follow-up).
 */
export async function listPublishedBooksPage(
  filters: BookFilters,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<PageResult<Book>> {
  if (!db) return { items: [], lastDoc: null, hasMore: false };
  const constraints: QueryConstraint[] = [
    ...bookConstraints(filters),
    orderBy(documentId()),
    limit(PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(collection(db, 'books'), ...constraints));
  const books = snap.docs.map((s) => toBook(s.id, s.data()));
  books.sort(compareBooks);
  return {
    items: books,
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.size === PAGE_SIZE,
  };
}

/**
 * All Published books for ONE class (educationType + its classLevels),
 * fetched through the paginated lister one classLevel at a time.
 *
 * H3 (security audit 22 Nov 2026): the class dashboard used to call the
 * unbounded listPublishedBooks() — every visit read ALL 609 Published
 * books. This reads only this class's rows (Honours 439, HSC 37, SSC 26,
 * Classes 1–8 0). Same index-safe shape as listPublishedBooksPage
 * (equality filters + orderBy(documentId())), so no composite index is
 * needed. Full pages are walked because the dashboard shows exact counts
 * and client-side pagination over the class's whole list.
 */
export async function listBooksForClass(
  educationType: string | null,
  classLevels: string[],
): Promise<Book[]> {
  // Classes 1–5 / 6–8 have no books or quizzes (educationType null) —
  // no query at all, not even an empty one.
  if (!educationType || classLevels.length === 0) return [];
  const all: Book[] = [];
  for (const classLevel of classLevels) {
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
    for (;;) {
      const page = await listPublishedBooksPage({ educationType, classLevel }, cursor);
      all.push(...page.items);
      if (!page.hasMore || !page.lastDoc) break;
      cursor = page.lastDoc;
    }
  }
  all.sort(compareBooks);
  return all;
}

/** One page of Published directory rows, server-side (50 reads at most). Same index note as listPublishedBooksPage. */
export async function listPublishedDirectoryPage(
  filters: DirectoryFilters,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<PageResult<DirectoryRow>> {
  if (!db) return { items: [], lastDoc: null, hasMore: false };
  const constraints: QueryConstraint[] = [
    ...directoryConstraints(filters),
    orderBy(documentId()),
    limit(PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(collection(db, 'educationDirectory'), ...constraints));
  const rows = snap.docs.map((s) => toDirectoryRow(s.id, s.data()));
  rows.sort(compareDirectoryRows);
  return {
    items: rows,
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.size === PAGE_SIZE,
  };
}

// ---- session caches for the search path only ---------------------------------
// Substring search cannot run server-side in Firestore, so a search loads the
// full Published list ONCE per session and searches it client-side (exactly
// the old behaviour, but only when the user actually searches — plain
// browsing and filtering never touch this cache). The cache is module-level
// so navigating away and back does not re-pay the 609 reads.
let allBooksCache: Promise<Book[]> | null = null;
export function getAllPublishedBooksCached(): Promise<Book[]> {
  if (!allBooksCache) allBooksCache = listPublishedBooks();
  return allBooksCache;
}

let allDirectoryCache: Promise<DirectoryRow[]> | null = null;
export function getAllPublishedDirectoryCached(): Promise<DirectoryRow[]> {
  if (!allDirectoryCache) allDirectoryCache = listPublishedDirectory();
  return allDirectoryCache;
}

/** All Published books, sorted by year then department then title. */
export async function listPublishedBooks(): Promise<Book[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'books'), where('reviewStatus', '==', 'Published')),
  );
  const books = snap.docs.map((s) => toBook(s.id, s.data()));
  books.sort(compareBooks);
  return books;
}

/** One book by id; null when missing or not Published (rules deny drafts). */
export async function getPublishedBook(bookId: string): Promise<Book | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'books', bookId));
  if (!snap.exists()) return null;
  const book = toBook(snap.id, snap.data());
  return book.reviewStatus === 'Published' ? book : null;
}

/** Published chapters of one book, in part order (A, B, C, then set 2…).
 *
 * Auth gating (owner instruction 22 Nov 2026): a signed-out visitor may
 * read ONLY the book's preview chapter. Pass `previewOnly: true` for
 * guests — the query then filters `isPreview == true`, so the rules can
 * allow it (a query without that filter would be denied outright
 * whenever the book has a non-preview chapter, because rules never
 * filter — they allow or deny the whole query). Three equality filters
 * need no composite index (zigzag merge join), same as the existing
 * two-filter shape. */
// The reviewStatus filter is REQUIRED, not just cosmetic: live Firestore
// rules allow public reads only where reviewStatus == "Published", and a
// query without that constraint is rejected (permission-denied) whenever
// the book has any non-Published chapter — which is why /library/:id
// failed to load at all. Every other public list query (books, directory,
// quizzes) already carries this filter; chapters was the only one missing
// it (found by the phase-2 probe, 21 Nov 2026). Equality filters need
// no composite index (zigzag merge join). The client-side filter stays as
// a second layer.
export async function listPublishedChapters(
  bookId: string,
  opts?: { previewOnly?: boolean },
): Promise<Chapter[]> {
  if (!db) return [];
  const constraints = [
    where('bookId', '==', bookId),
    where('reviewStatus', '==', 'Published'),
  ];
  if (opts?.previewOnly) constraints.push(where('isPreview', '==', true));
  const snap = await getDocs(query(collection(db, 'chapters'), ...constraints));
  const chapters = snap.docs
    .map((s) => toChapter(s.id, s.data()))
    .filter((c) => c.reviewStatus === 'Published');
  chapters.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return chapters;
}

/** One lesson by id (lesson id == chapter id in the loader's model). */
export async function getPublishedLesson(lessonId: string): Promise<Lesson | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'lessons', lessonId));
  if (!snap.exists()) return null;
  const lesson = toLesson(snap.id, snap.data());
  return lesson.reviewStatus === 'Published' ? lesson : null;
}

/** One chapter by id; null when missing or not Published. */
export async function getPublishedChapter(chapterId: string): Promise<Chapter | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'chapters', chapterId));
  if (!snap.exists()) return null;
  const chapter = toChapter(snap.id, snap.data());
  return chapter.reviewStatus === 'Published' ? chapter : null;
}

/** All Published directory rows (one per book). */
export async function listPublishedDirectory(): Promise<DirectoryRow[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'educationDirectory'), where('reviewStatus', '==', 'Published')),
  );
  const rows = snap.docs.map((s) => toDirectoryRow(s.id, s.data()));
  rows.sort(
    (a, b) =>
      a.classLevel.localeCompare(b.classLevel) ||
      a.department.localeCompare(b.department) ||
      a.paperTitle.localeCompare(b.paperTitle),
  );
  return rows;
}
