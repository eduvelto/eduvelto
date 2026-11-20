// Eduvelto — bookmarks (Phase 2, Step 3).
//
// One bookmark = one write; unbookmark = one delete (plan Step 3).
// Collection: top-level `bookmarks`, doc id `${uid}__${lessonId}`.
// Rules (firestore.rules): only the owning student (or Admin) may
// read/write a bookmark; userId can never be spoofed.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Bookmark {
  id: string;
  userId: string;
  lessonId: string;
  bookId: string;
  title: string;
}

export function bookmarkId(uid: string, lessonId: string): string {
  return `${uid}__${lessonId}`;
}

export async function isBookmarked(uid: string, lessonId: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'bookmarks', bookmarkId(uid, lessonId)));
  return snap.exists();
}

export async function addBookmark(
  uid: string,
  lessonId: string,
  bookId: string,
  title: string,
): Promise<void> {
  if (!db) throw new Error('not-configured');
  await setDoc(doc(db, 'bookmarks', bookmarkId(uid, lessonId)), {
    userId: uid,
    lessonId,
    bookId,
    title,
    createdAt: serverTimestamp(),
  });
}

export async function removeBookmark(uid: string, lessonId: string): Promise<void> {
  if (!db) throw new Error('not-configured');
  await deleteDoc(doc(db, 'bookmarks', bookmarkId(uid, lessonId)));
}

export async function listBookmarks(uid: string): Promise<Bookmark[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'bookmarks'), where('userId', '==', uid)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      userId: (d.userId as string) ?? '',
      lessonId: (d.lessonId as string) ?? '',
      bookId: (d.bookId as string) ?? '',
      title: (d.title as string) ?? '',
    };
  });
}
