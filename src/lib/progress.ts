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
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { dedupeInFlight } from './rateLimit';

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
  const firestore = db;
  // Defence-in-depth against double-clicks / double-renders: identical
  // concurrent calls share one write (the UI already has a busy guard).
  await dedupeInFlight(`progress:${uid}:${subjectSlug(subject)}:${lessonId}:${attempted}:${correct}`, () =>
    setDoc(
      doc(firestore, 'progress', progressId(uid, subject)),
      {
        userId: uid,
        subject,
        lessonsRead: arrayUnion(lessonId),
        questionsAttempted: increment(attempted),
        questionsCorrect: increment(correct),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
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
  weakChapters: string[];
  strongChapters: string[];
  /** Last recompute time — used by recomputeQuizSummaries' freshness check. */
  updatedAt?: { toDate?: () => Date; seconds?: number } | Date | null;
}

/**
 * Weak-area threshold (plan Step 3: 60% — owner to confirm). A chapter
 * (question topic — see below) is "weak" when the student's own quiz
 * accuracy on it is below this, "strong" at or above it.
 */
export const WEAK_THRESHOLD = 60;

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
      weakChapters: (d.weakChapters as string[]) ?? [],
      strongChapters: (d.strongChapters as string[]) ?? [],
      updatedAt: (d.updatedAt as QuizSummary['updatedAt']) ?? null,
    };
  });
}

/** Milliseconds since epoch for a Firestore timestamp-ish value, or null when unparseable. */
function millisOf(v: { toDate?: () => Date; seconds?: number } | Date | null | undefined): number | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (v && typeof v.toDate === 'function') {
    const t = v.toDate().getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (v && typeof v.seconds === 'number') return v.seconds * 1000;
  return null;
}

/**
 * Newest quiz attempt of one student (one read). Returns { found, at }:
 * found=false means no attempts at all; at=null means the newest attempt
 * has no parseable createdAt (legacy data) — treat as "unknown, recompute".
 */
async function getLatestAttempt(uid: string): Promise<{ found: boolean; at: number | null }> {
  if (!db) return { found: false, at: null };
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'quizAttempts'), orderBy('createdAt', 'desc'), limit(1)),
  );
  if (snap.empty) return { found: false, at: null };
  const d = snap.docs[0].data();
  return { found: true, at: millisOf(d.createdAt as QuizSummary['updatedAt']) };
}

/**
 * One quiz attempt, as stored under users/{uid}/quizAttempts (rules test
 * (e)). CONTRACT for Step 4's submit code: each attempt MUST carry
 * `quizId` + `percentage`; it SHOULD carry `subject` and, for weak-area
 * detection, per-question results as `answers` entries with `topic` and
 * `correct`. Quiz questions carry a `topic` per question, so the topic is
 * the chapter proxy for weak/strong lists until attempts store a
 * chapterId directly.
 */
export interface QuizAttemptInput {
  quizId: string;
  subject?: string;
  percentage: number;
  createdAt?: { toDate?: () => Date; seconds?: number } | Date | null;
  answers?: { topic?: string; chapter?: string; correct?: boolean }[];
}

export interface MonthlySummary {
  subject: string;
  month: string;
  attemptsCount: number;
  averagePercentage: number;
  bestPercentage: number;
  weakChapters: string[];
  strongChapters: string[];
}

function monthOf(
  createdAt: QuizAttemptInput['createdAt'],
  now: Date,
): string {
  let d: Date | null = null;
  if (createdAt instanceof Date) d = createdAt;
  else if (createdAt && typeof createdAt.toDate === 'function') d = createdAt.toDate();
  else if (createdAt && typeof createdAt.seconds === 'number')
    d = new Date(createdAt.seconds * 1000);
  if (!d || Number.isNaN(d.getTime())) d = now;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Pure computation: group a student's own attempts by subject + month
 * and derive attempts / average / best / weak + strong chapter lists.
 * No Firestore access — unit-tested in emulator-tests/progress-summary.test.ts.
 */
export function computeMonthlySummaries(
  attempts: QuizAttemptInput[],
  now: Date = new Date(),
): MonthlySummary[] {
  const groups = new Map<string, { subject: string; month: string; list: QuizAttemptInput[] }>();
  for (const a of attempts) {
    if (!a || typeof a.percentage !== 'number' || !a.subject) continue;
    const month = monthOf(a.createdAt, now);
    const key = `${a.subject}__${month}`;
    const g = groups.get(key) ?? { subject: a.subject, month, list: [] };
    g.list.push(a);
    groups.set(key, g);
  }
  const out: MonthlySummary[] = [];
  for (const g of groups.values()) {
    const total = g.list.reduce((s, a) => s + a.percentage, 0);
    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const a of g.list) {
      for (const ans of a.answers ?? []) {
        const topic = (ans.chapter || ans.topic || '').trim();
        if (!topic || typeof ans.correct !== 'boolean') continue;
        const t = byTopic.get(topic) ?? { correct: 0, total: 0 };
        t.total += 1;
        if (ans.correct) t.correct += 1;
        byTopic.set(topic, t);
      }
    }
    const weakChapters: string[] = [];
    const strongChapters: string[] = [];
    for (const [topic, t] of byTopic) {
      const acc = (t.correct / t.total) * 100;
      (acc < WEAK_THRESHOLD ? weakChapters : strongChapters).push(topic);
    }
    weakChapters.sort();
    strongChapters.sort();
    out.push({
      subject: g.subject,
      month: g.month,
      attemptsCount: g.list.length,
      averagePercentage: Math.round(total / g.list.length),
      bestPercentage: Math.max(...g.list.map((a) => a.percentage)),
      weakChapters,
      strongChapters,
    });
  }
  out.sort((a, b) => a.subject.localeCompare(b.subject) || b.month.localeCompare(a.month));
  return out;
}

export function quizSummaryId(uid: string, subject: string, month: string): string {
  return `${uid}__${subjectSlug(subject)}__${month}`;
}

/** All of one student's quiz attempts (own sub-collection). */
export async function listQuizAttempts(uid: string): Promise<QuizAttemptInput[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'users', uid, 'quizAttempts')));
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      quizId: (d.quizId as string) ?? '',
      subject: (d.subject as string) ?? undefined,
      percentage: (d.percentage as number) ?? 0,
      createdAt: (d.createdAt as QuizAttemptInput['createdAt']) ?? null,
      answers: (d.answers as QuizAttemptInput['answers']) ?? [],
    };
  });
}

/**
 * Recompute the student's monthly quiz summaries from their OWN quiz
 * attempts and upsert one progressSummaries doc per subject per month
 * (one write per subject-month). Attempts without a subject are resolved
 * through their quiz document's department; attempts that cannot be
 * attributed to a subject are skipped (never guessed). Returns the fresh
 * summaries. Called from the Progress page so the summary is always
 * current when viewed; the plan's "take a quiz twice" test is exactly
 * this: a second attempt changes the stored summary.
 *
 * SCALE (10k users): the old code ran the full recompute — read ALL
 * attempts (full answer arrays) + one write per subject-month — on EVERY
 * Progress page view, even when nothing had changed. The freshness check
 * below reads the stored summaries + the single newest attempt first: when
 * the newest attempt predates the newest summary, nothing changed and the
 * stored summaries are returned with ZERO extra reads and ZERO writes.
 * A new attempt always forces a full recompute, so the numbers stay exact.
 */
export async function recomputeQuizSummaries(uid: string): Promise<QuizSummary[]> {
  if (!db) throw new Error('not-configured');
  const stored = await listQuizSummaries(uid);
  if (stored.length > 0) {
    const latest = await getLatestAttempt(uid);
    if (!latest.found) return stored;
    if (latest.at !== null) {
      const newestSummary = Math.max(
        ...stored.map((s) => millisOf(s.updatedAt) ?? 0),
      );
      if (latest.at <= newestSummary) return stored;
    }
    // latest.at === null (legacy attempt without a timestamp): fall
    // through to a full recompute rather than risk a stale summary.
  }
  const attempts = await listQuizAttempts(uid);
  const subjectCache = new Map<string, string>();
  for (const a of attempts) {
    if (a.subject || !a.quizId) continue;
    if (!subjectCache.has(a.quizId)) {
      try {
        const snap = await getDoc(doc(db, 'quizzes', a.quizId));
        subjectCache.set(
          a.quizId,
          snap.exists() ? ((snap.data().department as string) ?? '') : '',
        );
      } catch {
        subjectCache.set(a.quizId, '');
      }
    }
    const resolved = subjectCache.get(a.quizId) ?? '';
    if (resolved) a.subject = resolved;
  }
  const summaries = computeMonthlySummaries(attempts);
  for (const s of summaries) {
    await setDoc(
      doc(db, 'progressSummaries', quizSummaryId(uid, s.subject, s.month)),
      {
        userId: uid,
        subject: s.subject,
        month: s.month,
        attemptsCount: s.attemptsCount,
        averagePercentage: s.averagePercentage,
        bestPercentage: s.bestPercentage,
        weakChapters: s.weakChapters,
        strongChapters: s.strongChapters,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
  return summaries.map((s) => ({
    id: quizSummaryId(uid, s.subject, s.month),
    userId: uid,
    ...s,
  }));
}
