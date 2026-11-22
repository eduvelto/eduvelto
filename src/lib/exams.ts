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
// Submit flow (MCQ — C1, security audit 22 Nov 2026): the attempt is
// WRITTEN FIRST, unscored (scored == false, score 0) — only then is the
// receipt created (the rules require a submitted attempt to exist before
// a receipt may be created) -> read key -> score client-side -> update
// the attempt to scored (the rules allow the owner ONLY this
// unscored → scored transition) -> delete receipt. Written exams: no key
// exists; the attempt stores typed answers with markingStatus 'pending'
// until a moderator marks it (plan: no free auto-marking of written
// answers — do not promise instant written results).
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
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  documentId,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

/** Quizzes shown per page (owner decision, 21 Nov 2026 — same as books). */
export const QUIZ_PAGE_SIZE = 50;

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
  // C1 (security audit 22 Nov 2026): an MCQ attempt is first written
  // UNSCORED (scored == false) and scored only after the key is read
  // with a fresh receipt; a written attempt is created scored (the
  // moderator marks it later). Old attempts carry no `scored` field and
  // read as scored (they were written with their final score).
  scored?: boolean;
  status?: string;
  userId?: string;
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
    scored: (d.scored as boolean) ?? true,
    status: (d.status as string) ?? undefined,
    userId: (d.userId as string) ?? undefined,
  };
}

/** All Published quizzes (one-time read; drafts stay invisible via rules).
 *
 * WARNING — unbounded: loads every Published quiz WITH its full questions
 * array (live: 212 quizzes, ~0.91 MiB; full inventory: 902 quizzes,
 * ~3.4 MiB). List pages MUST use listPublishedQuizzesPage instead.
 * Kept only for callers that genuinely need the whole set (none in the
 * app at the moment — ExamPage uses the paginated version). */
export async function listPublishedQuizzes(): Promise<Quiz[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'quizzes'), where('reviewStatus', '==', 'Published')),
  );
  const quizzes = snap.docs.map((s) => toQuiz(s.id, s.data()));
  quizzes.sort(compareQuizzes);
  return quizzes;
}

/** The Exam list's sort order (class, then department, then title). */
export function compareQuizzes(a: Quiz, b: Quiz): number {
  return (
    a.classLevel.localeCompare(b.classLevel) ||
    a.department.localeCompare(b.department) ||
    a.title.localeCompare(b.title)
  );
}

export interface QuizFilters {
  educationType?: string;
  classLevel?: string;
  department?: string;
  kind?: 'mcq' | 'written';
}

export interface QuizPageResult {
  items: Quiz[];
  /** Last document snapshot of this page — the cursor for the next page. Null on an empty page. */
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  /** True when this page was full, so a next page may exist. */
  hasMore: boolean;
}

function quizConstraints(filters: QuizFilters): QueryConstraint[] {
  const cs: QueryConstraint[] = [where('reviewStatus', '==', 'Published')];
  if (filters.educationType) cs.push(where('educationType', '==', filters.educationType));
  if (filters.classLevel) cs.push(where('classLevel', '==', filters.classLevel));
  if (filters.department) cs.push(where('department', '==', filters.department));
  if (filters.kind) cs.push(where('kind', '==', filters.kind));
  return cs;
}

/**
 * One page of Published quizzes, server-side (50 reads at most).
 *
 * Orders by DOCUMENT ID — the only orderBy shape that works with the
 * equality filters on live Firestore WITHOUT a composite index
 * (verified against LIVE Firestore, read-only, 21 Nov 2026). The first
 * draft's orderBy('reviewStatus') with filters FAILS live with
 * failed-precondition (composite index required); the emulator hid it
 * because it does not enforce index requirements. Each page is re-sorted
 * client-side with compareQuizzes; the GLOBAL order across pages is
 * document-ID order — restoring the old global order needs a composite
 * index (quizzes: reviewStatus, classLevel, department, title), an
 * owner follow-up, not built here.
 *
 * NOTE on size: each quiz doc carries its full `questions` array, so one
 * page of 50 is still ~0.21 MiB live (full inventory: ~0.21 MiB). The
 * full list (0.91 MiB live) is never downloaded at once any more. Making
 * a page lighter still would need a metadata-only quiz collection — a
 * data-model change for the owner to approve, not built here.
 *
 * NO count() here: getCountFromServer FAILS on live Firestore right now
 * (resource-exhausted / Quota exceeded — see team/pagination-test-report.md
 * §5). The Exam page therefore shows no exact total.
 */
export async function listPublishedQuizzesPage(
  filters: QuizFilters,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
): Promise<QuizPageResult> {
  if (!db) return { items: [], lastDoc: null, hasMore: false };
  const constraints: QueryConstraint[] = [
    ...quizConstraints(filters),
    orderBy(documentId()),
    limit(QUIZ_PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(collection(db, 'quizzes'), ...constraints));
  const quizzes = snap.docs.map((s) => toQuiz(s.id, s.data()));
  quizzes.sort(compareQuizzes);
  return {
    items: quizzes,
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.size === QUIZ_PAGE_SIZE,
  };
}

/**
 * All Published quizzes for ONE class (educationType + its classLevels),
 * fetched through the paginated lister one classLevel at a time.
 *
 * H3 (security audit 22 Nov 2026): the class dashboard used to call the
 * unbounded listPublishedQuizzes() — every visit read ALL 994 Published
 * quizzes (~1,600 reads with books). This reads only this class's rows
 * (Honours 199, HSC 47, SSC 55, Classes 1–8 0). Same index-safe shape as
 * listPublishedQuizzesPage (equality filters + orderBy(documentId())),
 * so no composite index is needed. Full pages are walked because the
 * dashboard shows exact counts and client-side pagination over the
 * class's whole list.
 */
export async function listQuizzesForClass(
  educationType: string | null,
  classLevels: string[],
): Promise<Quiz[]> {
  // Classes 1–5 / 6–8 have no books or quizzes (educationType null) —
  // no query at all, not even an empty one.
  if (!educationType || classLevels.length === 0) return [];
  const all: Quiz[] = [];
  for (const classLevel of classLevels) {
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
    for (;;) {
      const page = await listPublishedQuizzesPage({ educationType, classLevel }, cursor);
      all.push(...page.items);
      if (!page.hasMore || !page.lastDoc) break;
      cursor = page.lastDoc;
    }
  }
  all.sort(compareQuizzes);
  return all;
}

/**
 * One page of Published quizzes for ONE class, server-side
 * (fix/read-usage). Same cursor + session-cache design as
 * listBooksForClassPage in lib/content.ts (level walk, document-ID
 * cursor). Same order note as books: global order across pages is
 * document-ID order; within a page the docs are re-sorted with
 * compareQuizzes.
 *
 * NOTE on size: each quiz doc still carries its full `questions` array
 * — one page of 20 is ~85 KB live. Reads are what the quota counts,
 * and this cuts the Tests tab from 199 reads to 20. A metadata-only
 * quiz collection (no `questions` array) would cut the BYTES too — a
 * data-model follow-up, not built here.
 */
export interface ClassQuizPageResult {
  items: Quiz[];
  nextCursor: ClassListCursor | null;
  hasMore: boolean;
}

export interface ClassListCursor {
  levelIdx: number;
  lastDocId: string | null;
}

export async function listPublishedQuizzesPageById(
  filters: QuizFilters,
  lastDocId: string | null,
  pageSize: number,
): Promise<{ items: Quiz[]; lastDocId: string | null }> {
  if (!db) return { items: [], lastDocId: null };
  const constraints: QueryConstraint[] = [
    ...quizConstraints(filters),
    orderBy(documentId()),
    limit(pageSize),
  ];
  if (lastDocId) constraints.push(startAfter(lastDocId));
  const snap = await getDocs(query(collection(db, 'quizzes'), ...constraints));
  const quizzes = snap.docs.map((s) => toQuiz(s.id, s.data()));
  quizzes.sort(compareQuizzes);
  return {
    items: quizzes,
    lastDocId: snap.docs[snap.docs.length - 1]?.id ?? null,
  };
}

const classQuizzesPageCache = new Map<string, Promise<ClassQuizPageResult>>();

export function listQuizzesForClassPage(
  educationType: string | null,
  classLevels: string[],
  opts?: { cursor?: ClassListCursor | null; pageSize?: number },
): Promise<ClassQuizPageResult> {
  if (!educationType || classLevels.length === 0) {
    return Promise.resolve({ items: [], nextCursor: null, hasMore: false });
  }
  const pageSize = opts?.pageSize ?? 20;
  const key = JSON.stringify({
    c: 'quizzes',
    educationType,
    classLevels,
    cursor: opts?.cursor ?? null,
    pageSize,
  });
  const cached = classQuizzesPageCache.get(key);
  if (cached) return cached;
  const p = (async (): Promise<ClassQuizPageResult> => {
    const items: Quiz[] = [];
    let levelIdx = opts?.cursor?.levelIdx ?? 0;
    let lastDocId: string | null = opts?.cursor?.lastDocId ?? null;
    while (items.length < pageSize && levelIdx < classLevels.length) {
      const remaining = pageSize - items.length;
      const page = await listPublishedQuizzesPageById(
        { educationType, classLevel: classLevels[levelIdx] },
        lastDocId,
        remaining,
      );
      items.push(...page.items);
      if (page.items.length === remaining) {
        return { items, nextCursor: { levelIdx, lastDocId: page.lastDocId }, hasMore: true };
      }
      levelIdx += 1;
      lastDocId = null;
    }
    return { items, nextCursor: null, hasMore: false };
  })();
  classQuizzesPageCache.set(key, p);
  return p;
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
  const totalMarks = quiz.totalMarks || quiz.questions.reduce((s, q) => s + q.marks, 0);
  // C1 (security audit 22 Nov 2026): the attempt MUST be written
  // (submitted) BEFORE the key is read — the receipt rules require a
  // submitted attempt to exist, and the key rules require the attempt
  // to be submitted. So: write the attempt UNSCORED first (score 0,
  // answers carry only the student's picks, no correctness yet).
  await setDoc(attemptRef, {
    quizId: quiz.id,
    kind: 'mcq',
    subject: quiz.subject || quiz.department,
    department: quiz.department,
    answers: quiz.questions.map((q) => ({
      n: q.n,
      topic: q.topic,
      selected: selected[q.n] ?? null,
      correct: false,
      marks: 0,
      correctText: null,
    })),
    score: 0,
    totalMarks,
    percentage: 0,
    markingStatus: 'auto',
    scored: false,
    status: 'submitted',
    userId: uid,
    createdAt: serverTimestamp(),
  });
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
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  // Score the attempt: the rules allow the owner ONLY this unscored →
  // scored transition (answers/score/percentage/scored, nothing else).
  // If this update fails the attempt stays unscored (score 0) in the
  // student's history — the result page shows it as unscored.
  await updateDoc(attemptRef, {
    answers,
    score,
    percentage,
    scored: true,
    updatedAt: serverTimestamp(),
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
    // C1 (security audit 22 Nov 2026): the create rule requires the
    // attempt to carry its owner + status, and a written attempt is
    // created scored (the moderator marks it later).
    scored: true,
    status: 'submitted',
    userId: uid,
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
