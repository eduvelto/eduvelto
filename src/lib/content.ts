// Eduvelto — content fetchers (Phase 2, Step 2 + Step 3).
//
// One-time reads only (getDoc / getDocs, no realtime listeners) —
// plan §5 write/read budget discipline. Students see only
// reviewStatus == "Published" rows; drafts stay invisible because the
// security rules deny the read (and we also filter client-side).

import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
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
  if (filters.board) cs.push(where('board', '==', filters.board));
  if (filters.program) cs.push(where('program', '==', filters.program));
  if (filters.classLevel) cs.push(where('classLevel', '==', filters.classLevel));
  if (filters.department) cs.push(where('department', '==', filters.department));
  return cs;
}

/**
 * One page of Published books, server-side (50 reads at most).
 *
 * The query orders by `reviewStatus` — the same field the equality filter
 * constrains — so it needs NO composite index (equality filters on several
 * fields + orderBy on an equality-constrained field are served by
 * Firestore's single-field indexes; verified against LIVE Firestore,
 * read-only, 21 Nov 2026 — see team/pagination-test-report.md §2).
 * NOTE: the emulator does NOT enforce composite-index requirements, so
 * an emulator run cannot prove this — the live read-only check is the
 * proof. All Published books share that value, so the effective order is document
 * ID order; each page is re-sorted client-side with compareBooks so the
 * books ON a page appear in the Library's usual order. The GLOBAL order
 * across pages is document-ID order, not the old class/department/title
 * order — restoring the old global order needs a composite index
 * (books: reviewStatus, classLevel, department, title), which is a
 * follow-up for the owner's approval, not built here.
 */
export async function listPublishedBooksPage(
  filters: BookFilters,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<PageResult<Book>> {
  if (!db) return { items: [], lastDoc: null, hasMore: false };
  const constraints: QueryConstraint[] = [
    ...bookConstraints(filters),
    orderBy('reviewStatus'),
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

/** How many Published books match the filters (count aggregation: 1 read per 1000 docs). */
export async function countPublishedBooks(filters: BookFilters): Promise<number> {
  if (!db) return 0;
  const snap = await getCountFromServer(query(collection(db, 'books'), ...bookConstraints(filters)));
  return snap.data().count;
}

/** One page of Published directory rows, server-side (50 reads at most). Same index note as listPublishedBooksPage. */
export async function listPublishedDirectoryPage(
  filters: DirectoryFilters,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<PageResult<DirectoryRow>> {
  if (!db) return { items: [], lastDoc: null, hasMore: false };
  const constraints: QueryConstraint[] = [
    ...directoryConstraints(filters),
    orderBy('reviewStatus'),
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

/** How many Published directory rows match the filters. */
export async function countPublishedDirectory(filters: DirectoryFilters): Promise<number> {
  if (!db) return 0;
  const snap = await getCountFromServer(query(collection(db, 'educationDirectory'), ...directoryConstraints(filters)));
  return snap.data().count;
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

/** Published chapters of one book, in part order (A, B, C, then set 2…). */
export async function listPublishedChapters(bookId: string): Promise<Chapter[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'chapters'), where('bookId', '==', bookId)),
  );
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
