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
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

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

/** All Published books, sorted by year then department then title. */
export async function listPublishedBooks(): Promise<Book[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'books'), where('reviewStatus', '==', 'Published')),
  );
  const books = snap.docs.map((s) => toBook(s.id, s.data()));
  books.sort(
    (a, b) =>
      a.classLevel.localeCompare(b.classLevel) ||
      a.department.localeCompare(b.department) ||
      a.title.localeCompare(b.title),
  );
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
// The reviewStatus filter is REQUIRED, not just cosmetic: live Firestore
// rules allow public reads only where reviewStatus == "Published", and a
// query without that constraint is rejected (permission-denied) whenever
// the book has any non-Published chapter — which is why /library/:id
// failed to load at all. Every other public list query (books, directory,
// quizzes) already carries this filter; chapters was the only one missing
// it (found by the phase-2 probe, 21 Nov 2026). Two equality filters need
// no composite index (zigzag merge join). The client-side filter stays as
// a second layer.
export async function listPublishedChapters(bookId: string): Promise<Chapter[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(
      collection(db, 'chapters'),
      where('bookId', '==', bookId),
      where('reviewStatus', '==', 'Published'),
    ),
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
