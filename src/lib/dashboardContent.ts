// Eduvelto — dashboard content queries (Step 5/7/8).
//
// Profile-filtered, paginated reads for the three role dashboards.
// MERGE POINT with the pagination work (branch
// `pagination/library-directory`, agent b48159cc): that branch owns
// `src/lib/content.ts` (listPublishedBooks / listPublishedDirectory) and
// is adding server-side limit(50)+startAfter there. This module does NOT
// touch content.ts — it implements the same pagination discipline
// (limit 50 + startAfter, equality filters only, NO orderBy, so NO
// composite index is needed) in its own file, for the profile-filtered
// queries the dashboards need. When both branches land, the shared
// paginated interface in content.ts should replace the local query
// builders here (same constraints, same page size) — the dashboards
// call only the functions exported below, so the swap is one file.
//
// READ DISCIPLINE: every query here filters by the academic profile
// FIRST (see lib/academicProfile.ts) and reads at most 50 documents per
// page. A full unfiltered library load (609 reads) never happens from a
// dashboard. Read counts in the test report are document counts
// returned (1 doc = 1 read).

import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  where,
  type CollectionReference,
  type DocumentData,
  type DocumentSnapshot,
  type Query,
  type QueryConstraint,
} from 'firebase/firestore';

/** Build a paginated query: collection first, constraints after. */
function pagedQuery(
  coll: CollectionReference<DocumentData, DocumentData>,
  constraints: QueryConstraint[],
  cursor?: DocumentSnapshot | null,
  pageSize: number = DASHBOARD_PAGE_SIZE,
): Query<DocumentData, DocumentData> {
  return query(coll, ...constraints, ...(cursor ? [startAfter(cursor)] : []), limit(pageSize));
}
import { db } from '../firebase';
import {
  bookConstraintsForProfile,
  bookConstraintsForTeacher,
  type BookConstraint,
} from './academicProfile';
import type { Book, Chapter, DirectoryRow } from './content';
import type { UserProfile } from './profile';

export const DASHBOARD_PAGE_SIZE = 50;

export interface Page<T> {
  items: T[];
  /** Opaque cursor for the next page (null when no more pages). */
  cursor: DocumentSnapshot | null;
  hasMore: boolean;
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
  };
}

function constraintToQuery(c: BookConstraint): QueryConstraint {
  return c.op === 'in' ? where(c.field, 'in', c.value) : where(c.field, '==', c.value);
}

/** Sort one page client-side (<=50 docs — no server orderBy, no index). */
function sortBooks(books: Book[]): Book[] {
  return [...books].sort(
    (a, b) =>
      a.classLevel.localeCompare(b.classLevel) ||
      a.department.localeCompare(b.department) ||
      a.title.localeCompare(b.title),
  );
}

/**
 * One page of Published books for a student's academic profile.
 * Returns { items: [], cursor: null, hasMore: false } when the profile
 * has no usable academic fields — the caller shows the "complete your
 * profile" empty state. NEVER returns an unfiltered list.
 */
export async function listBooksForStudent(
  profile: UserProfile,
  cursor?: DocumentSnapshot | null,
  pageSize: number = DASHBOARD_PAGE_SIZE,
): Promise<Page<Book>> {
  if (!db) return { items: [], cursor: null, hasMore: false };
  const constraints = bookConstraintsForProfile(profile);
  if (constraints.length === 0) return { items: [], cursor: null, hasMore: false };
  const snap = await getDocs(
    pagedQuery(
      collection(db, 'books'),
      [where('reviewStatus', '==', 'Published'), ...constraints.map(constraintToQuery)],
      cursor,
      pageSize,
    ),
  );
  const books = sortBooks(snap.docs.map((s) => toBook(s.id, s.data())));
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items: books, cursor: last, hasMore: snap.docs.length === pageSize };
}

/**
 * One page of Published books for a teacher's APPROVED subjects/classes.
 * Empty approved lists => empty page (pending banner in the UI).
 */
export async function listBooksForTeacher(
  profile: UserProfile,
  approvedSubjects: string[],
  approvedClasses: string[],
  cursor?: DocumentSnapshot | null,
  pageSize: number = DASHBOARD_PAGE_SIZE,
): Promise<Page<Book>> {
  if (!db) return { items: [], cursor: null, hasMore: false };
  const constraints = bookConstraintsForTeacher(approvedSubjects, approvedClasses, profile.educationType ?? null);
  if (constraints.length === 0) return { items: [], cursor: null, hasMore: false };
  const snap = await getDocs(
    pagedQuery(
      collection(db, 'books'),
      [where('reviewStatus', '==', 'Published'), ...constraints.map(constraintToQuery)],
      cursor,
      pageSize,
    ),
  );
  const books = sortBooks(snap.docs.map((s) => toBook(s.id, s.data())));
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items: books, cursor: last, hasMore: snap.docs.length === pageSize };
}

/** Published chapters of one book, paginated (a book has few chapters — one page normally). */
export async function listChaptersForBook(
  bookId: string,
  cursor?: DocumentSnapshot | null,
  pageSize: number = DASHBOARD_PAGE_SIZE,
): Promise<Page<Chapter>> {
  if (!db) return { items: [], cursor: null, hasMore: false };
  const snap = await getDocs(
    pagedQuery(
      collection(db, 'chapters'),
      [where('bookId', '==', bookId), where('reviewStatus', '==', 'Published')],
      cursor,
      pageSize,
    ),
  );
  const chapters = snap.docs
    .map((s) => toChapter(s.id, s.data()))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items: chapters, cursor: last, hasMore: snap.docs.length === pageSize };
}

/**
 * Directory rows for a profile (same constraints as books, mapped to
 * the directory's `type` field: directory `type` holds the same values
 * as books `educationType` — 'Higher', 'Madrasa', 'SSC', 'HSC',
 * 'Technical').
 */
export async function listDirectoryForStudent(
  profile: UserProfile,
  cursor?: DocumentSnapshot | null,
  pageSize: number = DASHBOARD_PAGE_SIZE,
): Promise<Page<DirectoryRow>> {
  if (!db) return { items: [], cursor: null, hasMore: false };
  const constraints = bookConstraintsForProfile(profile).filter((c) => c.field !== 'board');
  if (constraints.length === 0) return { items: [], cursor: null, hasMore: false };
  // Directory rows store the type in `type`, not `educationType`.
  const rebuilt: QueryConstraint[] = [where('reviewStatus', '==', 'Published')];
  for (const c of constraints) {
    if (c.field === 'educationType') {
      rebuilt.push(c.op === 'in' ? where('type', 'in', c.value) : where('type', '==', c.value));
    } else {
      rebuilt.push(constraintToQuery(c));
    }
  }
  const snap = await getDocs(pagedQuery(collection(db, 'educationDirectory'), rebuilt, cursor, pageSize));
  const rows = snap.docs.map((s) => toDirectoryRow(s.id, s.data()));
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items: rows, cursor: last, hasMore: snap.docs.length === pageSize };
}

// ---------- guardian reads (child data, link-gated) ----------

export interface ChildProgress {
  id: string;
  userId: string;
  subject: string;
  lessonsRead?: number;
  questionsAttempted?: number;
  [key: string]: unknown;
}

export interface ChildBookmark {
  id: string;
  userId: string;
  lessonId: string;
  title: string;
}

/**
 * A guardian reads a linked child's progress/bookmarks ONLY through
 * these helpers, which the caller must gate on a verified parentLink.
 * The rules enforce the same gate server-side (progress/bookmarks read
 * allows a guardian with a verified link); the client never reads a
 * child without checking the link first.
 */
export async function listChildProgress(childUid: string): Promise<ChildProgress[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'progress'), where('userId', '==', childUid), limit(50)));
  return snap.docs.map((s) => ({ id: s.id, userId: childUid, subject: '', ...(s.data() as Record<string, unknown>) }) as ChildProgress);
}

export async function listChildBookmarks(childUid: string): Promise<ChildBookmark[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'bookmarks'), where('userId', '==', childUid), limit(50)));
  return snap.docs.map((s) => {
    const d = s.data() as Record<string, unknown>;
    return {
      id: s.id,
      userId: childUid,
      lessonId: typeof d.lessonId === 'string' ? d.lessonId : '',
      title: typeof d.title === 'string' ? d.title : '',
    };
  });
}

export async function listChildProgressSummaries(childUid: string): Promise<Record<string, unknown>[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'progressSummaries'), where('userId', '==', childUid), limit(50)),
  );
  return snap.docs.map((s) => ({ id: s.id, ...(s.data() as Record<string, unknown>) }));
}

// NOTE — deliberately absent: a "getChildProfile" helper. A guardian
// must NEVER read a child's `users/{uid}` document — it holds the
// child's email (rules deny it, and the rules test proves it). The
// guardian dashboard gets the child's display name + academic snapshot
// from the parentLinks document itself (see lib/guardian.ts), which the
// child keeps in sync. That is the whole point of the denormalized
// snapshot: guardian visibility without users-doc access.
