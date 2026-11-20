// Eduvelto — per-user progress (Phase 2, Step 3).
//
// Collection: top-level `progress`, one document per student per
// subject: doc id `${uid}__${subjectSlug}`.
//   lessonsRead: lesson ids the student marked complete
//   questionsAttempted / questionsCorrect: from the lesson's own
//     practice questions (self-checked MCQ picks + revealed answers)
//     — labelled honestly in the UI as "from your practice attempts".
// Quiz-derived monthly summaries live in `progressSummaries` (plan
// Step 3/4) and are read separately on the Progress page when present.
//
// Rules (firestore.rules): only the owning student (or Admin) may
// read a progress doc; only the owner may create/update it, and the
// userId field can never be changed to someone else's.

import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface SubjectProgress {
  id: string;
  userId: string;
  subject: string;
  lessonsRead: string[];
  questionsAttempted: number;
  questionsCorrect: number;
}

export function subjectSlug(subject: string): string {
  return subject
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'subject';
}

export function progressId(uid: string, subject: string): string {
  return `${uid}__${subjectSlug(subject)}`;
}

/**
 * Mark one lesson complete for one subject. One write (merge).
 * `attempted` = practice questions the student tried in this lesson;
 * `correct` = MCQ picks that matched the key. Both are 0 when the
 * student only read the lesson.
 */
export async function markLessonComplete(
  uid: string,
  subject: string,
  lessonId: string,
  attempted: number,
  correct: number,
): Promise<void> {
  if (!db) throw new Error('not-configured');
  await setDoc(
    doc(db, 'progress', progressId(uid, subject)),
    {
      userId: uid,
      subject,
      lessonsRead: arrayUnion(lessonId),
      questionsAttempted: increment(attempted),
      questionsCorrect: increment(correct),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** All per-subject progress docs for one student. */
export async function listSubjectProgress(uid: string): Promise<SubjectProgress[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'progress'), where('userId', '==', uid)),
  );
  const rows = snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      userId: (d.userId as string) ?? '',
      subject: (d.subject as string) ?? '',
      lessonsRead: (d.lessonsRead as string[]) ?? [],
      questionsAttempted: (d.questionsAttempted as number) ?? 0,
      questionsCorrect: (d.questionsCorrect as number) ?? 0,
    };
  });
  rows.sort((a, b) => a.subject.localeCompare(b.subject));
  return rows;
}

/** Quiz-derived monthly summaries (plan Step 3/4), if any exist. */
export interface QuizSummary {
  id: string;
  userId: string;
  subject: string;
  month: string;
  attemptsCount: number;
  averagePercentage: number;
  bestPercentage: number;
}

export async function listQuizSummaries(uid: string): Promise<QuizSummary[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'progressSummaries'), where('userId', '==', uid)),
  );
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      userId: (d.userId as string) ?? '',
      subject: (d.subject as string) ?? '',
      month: (d.month as string) ?? '',
      attemptsCount: (d.attemptsCount as number) ?? 0,
      averagePercentage: (d.averagePercentage as number) ?? 0,
      bestPercentage: (d.bestPercentage as number) ?? 0,
    };
  });
}
