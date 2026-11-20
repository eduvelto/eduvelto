// Eduvelto — exams + results (Phase 2, Step 4).
//
// Collections:
//   quizzes/{quizId}              — student projection: questions + options
//                                   only. NEVER carries the answer key.
//   quizKeys/{quizId}             — the key; student read is receipt-gated
//                                   (firestore.rules: fresh quizReceipts doc).
//   users/{uid}/quizAttempts/{id} — one write per attempt, immutable after
//                                   submit (except moderator marking of a
//                                   PENDING written attempt — see rules).
//   quizReceipts/{uid}_{quizId}   — single-use submit receipt, created at
//                                   submit time, deleted right after scoring.
//
// Submit flow (MCQ): create receipt -> read key -> score client-side ->
// write attempt (with per-question correct flags + correct text, so the
// result page never needs the key again) -> delete receipt.
// Written exams: no key exists; the attempt stores typed answers with
// markingStatus 'pending' until a moderator marks it (plan: no free
// auto-marking of written answers — do not promise instant written results).
//
// Attempt shape honours the Step 3 contract (src/lib/progress.ts):
// every attempt carries `quizId` + `percentage`, and `answers` entries
// carry `topic` + `correct` so monthly summaries + weak-area detection
// can use them. Written answers carry correct: null until marked.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface QuizOption {
  letter: string;
  text: string;
}

export interface QuizQuestion {
  n: number;
  topic: string;
  question: string;
  options?: QuizOption[];
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  bookId: string;
  subject: string;
  department: string;
  classLevel: string;
  educationType: string;
  kind: 'mcq' | 'written';
  questions: QuizQuestion[];
  questionCount: number;
  totalMarks: number;
  timeLimitMinutes: number;
  reviewStatus: string;
}

/** Book title without the " — MCQ পরীক্ষা / — লিখিত পরীক্ষা" suffix. */
export function bookTitleOf(quiz: Quiz): string {
  return quiz.title.replace(/\s+—\s+(MCQ পরীক্ষা|লিখিত পরীক্ষা)\s*$/, '');
}

export interface AttemptAnswer {
  n: number;
  topic: string;
  /** MCQ: the letter the student picked. Written: undefined. */
  selected?: string | null;
  /** Written: the typed answer. MCQ: undefined. */
  text?: string | null;
  /** MCQ: true/false. Written: null until marked, then true/false. */
  correct: boolean | null;
  /** Marks earned for this question (MCQ: set at submit; written: set when marked). */
  marks: number | null;
  /** MCQ only: the correct answer text, stored so the result page can show it without re-reading the key. */
  correctText?: string | null;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  kind: 'mcq' | 'written';
  subject: string;
  department: string;
  answers: AttemptAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  markingStatus: 'auto' | 'pending' | 'marked';
  createdAt: { toDate?: () => Date; seconds?: number } | Date | null;
  markedBy?: string | null;
}

function toQuiz(id: string, d: Record<string, unknown>): Quiz {
  return {
    id,
    title: (d.title as string) ?? '',
    bookId: (d.bookId as string) ?? '',
    subject: (d.subject as string) ?? '',
    department: (d.department as string) ?? '',
    classLevel: (d.classLevel as string) ?? '',
    educationType: (d.educationType as string) ?? '',
    kind: (d.kind as 'mcq' | 'written') ?? 'written',
    questions: (d.questions as QuizQuestion[]) ?? [],
    questionCount: (d.questionCount as number) ?? 0,
    totalMarks: (d.totalMarks as number) ?? 0,
    timeLimitMinutes: (d.timeLimitMinutes as number) ?? 0,
    reviewStatus: (d.reviewStatus as string) ?? '',
  };
}

function toAttempt(id: string, d: Record<string, unknown>): QuizAttempt {
  return {
    id,
    quizId: (d.quizId as string) ?? '',
    kind: (d.kind as 'mcq' | 'written') ?? 'written',
    subject: (d.subject as string) ?? '',
    department: (d.department as string) ?? '',
    answers: (d.answers as AttemptAnswer[]) ?? [],
    score: (d.score as number) ?? 0,
    totalMarks: (d.totalMarks as number) ?? 0,
    percentage: (d.percentage as number) ?? 0,
    markingStatus: (d.markingStatus as QuizAttempt['markingStatus']) ?? 'pending',
    createdAt: (d.createdAt as QuizAttempt['createdAt']) ?? null,
    markedBy: (d.markedBy as string) ?? null,
  };
}

/** All Published quizzes (one-time read; drafts stay invisible via rules). */
export async function listPublishedQuizzes(): Promise<Quiz[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'quizzes'), where('reviewStatus', '==', 'Published')),
  );
  const quizzes = snap.docs.map((s) => toQuiz(s.id, s.data()));
  quizzes.sort(
    (a, b) =>
      a.classLevel.localeCompare(b.classLevel) ||
      a.department.localeCompare(b.department) ||
      a.title.localeCompare(b.title),
  );
  return quizzes;
}

/** One Published quiz by id; null when missing or not Published. */
export async function getPublishedQuiz(quizId: string): Promise<Quiz | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'quizzes', quizId));
  if (!snap.exists()) return null;
  const quiz = toQuiz(snap.id, snap.data());
  return quiz.reviewStatus === 'Published' ? quiz : null;
}

/** One attempt of the signed-in student. */
export async function getMyAttempt(uid: string, attemptId: string): Promise<QuizAttempt | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'quizAttempts', attemptId));
  return snap.exists() ? toAttempt(snap.id, snap.data()) : null;
}

/** All attempts of the signed-in student, newest first. */
export async function listMyAttempts(uid: string): Promise<QuizAttempt[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'users', uid, 'quizAttempts'));
  const attempts = snap.docs.map((s) => toAttempt(s.id, s.data()));
  const timeOf = (a: QuizAttempt): number => {
    const c = a.createdAt;
    if (c instanceof Date) return c.getTime();
    if (c && typeof c.toDate === 'function') return c.toDate().getTime();
    if (c && typeof c.seconds === 'number') return c.seconds * 1000;
    return 0;
  };
  attempts.sort((a, b) => timeOf(b) - timeOf(a));
  return attempts;
}

interface KeyAnswer {
  n: number;
  correctLetter: string;
  correctText: string;
}

/**
 * Submit an MCQ exam. Creates the submission receipt, reads the key
 * (allowed only while the receipt is fresh), scores, writes the
 * immutable attempt, then deletes the receipt. Returns the attempt id.
 */
export async function submitMcqAttempt(
  uid: string,
  quiz: Quiz,
  selected: Record<number, string>,
): Promise<string> {
  if (!db) throw new Error('not-configured');
  const attemptRef = doc(collection(db, 'users', uid, 'quizAttempts'));
  const receiptRef = doc(db, 'quizReceipts', `${uid}_${quiz.id}`);
  // A crashed earlier submit may have left a receipt behind; remove it
  // first (receipts are single-use and update is denied by the rules).
  await deleteDoc(receiptRef).catch(() => undefined);
  await setDoc(receiptRef, {
    userId: uid,
    quizId: quiz.id,
    attemptId: attemptRef.id,
    createdAt: serverTimestamp(),
  });
  let key: KeyAnswer[] = [];
  try {
    const keySnap = await getDoc(doc(db, 'quizKeys', quiz.id));
    if (keySnap.exists()) key = (keySnap.data().answers as KeyAnswer[]) ?? [];
  } finally {
    // The receipt has served its purpose; remove it either way (it
    // also expires after 10 minutes by rule if this delete fails).
    await deleteDoc(receiptRef).catch(() => undefined);
  }
  const keyByN = new Map(key.map((k) => [k.n, k]));
  let score = 0;
  const answers: AttemptAnswer[] = quiz.questions.map((q) => {
    const picked = selected[q.n] ?? null;
    const k = keyByN.get(q.n);
    const correct = !!k && picked !== null && picked === k.correctLetter;
    if (correct) score += q.marks;
    return {
      n: q.n,
      topic: q.topic,
      selected: picked,
      correct,
      marks: correct ? q.marks : 0,
      correctText: k?.correctText ?? null,
    };
  });
  const totalMarks = quiz.totalMarks || quiz.questions.reduce((s, q) => s + q.marks, 0);
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  await setDoc(attemptRef, {
    quizId: quiz.id,
    kind: 'mcq',
    subject: quiz.subject || quiz.department,
    department: quiz.department,
    answers,
    score,
    totalMarks,
    percentage,
    markingStatus: 'auto',
    createdAt: serverTimestamp(),
  });
  return attemptRef.id;
}

/**
 * Submit a written exam. No key exists: typed answers are stored with
 * markingStatus 'pending'. The result page says so honestly — written
 * answers are marked by a teacher/moderator, there is no instant score.
 */
export async function submitWrittenAttempt(
  uid: string,
  quiz: Quiz,
  texts: Record<number, string>,
): Promise<string> {
  if (!db) throw new Error('not-configured');
  const attemptRef = doc(collection(db, 'users', uid, 'quizAttempts'));
  const totalMarks = quiz.totalMarks || quiz.questions.reduce((s, q) => s + q.marks, 0);
  const answers: AttemptAnswer[] = quiz.questions.map((q) => ({
    n: q.n,
    topic: q.topic,
    text: (texts[q.n] ?? '').trim(),
    correct: null,
    marks: null,
  }));
  await setDoc(attemptRef, {
    quizId: quiz.id,
    kind: 'written',
    subject: quiz.subject || quiz.department,
    department: quiz.department,
    answers,
    score: 0,
    totalMarks,
    percentage: 0,
    markingStatus: 'pending',
    createdAt: serverTimestamp(),
  });
  return attemptRef.id;
}

/**
 * Mark a PENDING written attempt (moderator/admin only — the rules allow
 * updating marking fields of a pending attempt and nothing else).
 * `marks` is one number per question, in question order.
 */
export async function markWrittenAttempt(
  markerUid: string,
  ownerUid: string,
  attemptId: string,
  attempt: QuizAttempt,
  marks: number[],
): Promise<void> {
  if (!db) throw new Error('not-configured');
  if (attempt.markingStatus !== 'pending') throw new Error('attempt-not-pending');
  const score = marks.reduce((s, m) => s + (m || 0), 0);
  const totalMarks = attempt.totalMarks || 1;
  const answers: AttemptAnswer[] = attempt.answers.map((a, i) => ({
    ...a,
    correct: (marks[i] ?? 0) > 0,
    marks: marks[i] ?? 0,
  }));
  await updateDoc(doc(db, 'users', ownerUid, 'quizAttempts', attemptId), {
    marks,
    answers,
    score,
    percentage: Math.round((score / totalMarks) * 100),
    markingStatus: 'marked',
    markedBy: markerUid,
    markedAt: serverTimestamp(),
  });
}
