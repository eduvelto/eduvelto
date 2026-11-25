// Eduvelto — Question Paper Generator Phase 2: Sheet Builder model.
//
// Printable practice sheets built per EXERCISE (অনুশীলনী), not per
// chapter. A teacher picks a book → chapter → one or more exercises
// and gets a sheet of verified practice questions for exactly those
// exercises. The sheet is the smaller, exercise-grained sibling of
// the chapter paper.
//
// DATA STATE (honest): exercise lists come ONLY from Phase B
// extraction — chapter lists exist for only 8/264 books (Phase A
// inventory), and NO exercise list has been extracted yet. The
// registry below therefore starts EMPTY: every chapter shows the
// honest "not yet available" state until Phase B extracts its
// exercises from the book's own contents / chapter-end headings.
// Extracted, never invented. Never copy the book's exercise questions
// verbatim — sheets are assembled from Eduvelto's own verified
// practice questions mapped to the exercise (NCTB-first: the book is
// a reference only).
//
// Questions map to exercises via `exerciseId` (a future field on the
// verified question — set when a verified pack is mapped to its
// exercises). Today the verified pool holds 35 BCS English MCQs with
// no exercise mapping, so every exercise honestly reports 0 verified
// questions and sheet generation is gated — never a fake list, never
// a silent gap, never an empty sheet.
//
// Sheet downloads share the free tier's 3 papers/month quota
// (PROPOSAL §8.12 — shared quota; applies unless the owner objects)
// and reuse the generator's ProtectedContentWrapper + download dialog.

import type { QpgQuestion } from './questionPaper';

export interface QpgExercise {
  id: string;
  /** Exercise number as printed in the book, e.g. "২.১". */
  numberBn: string;
  /** Exercise title as printed in the book, if any. */
  titleBn?: string;
  /** Verified questions mapped to this exercise (0 = unavailable). */
  verifiedCount: number;
}

export interface QpgChapterExercises {
  chapterId: string;
  chapterNameBn: string;
  bookId: string;
  /** Where this list came from (Phase B extraction reference). */
  sourceNoteBn: string;
  exercises: QpgExercise[];
}

/** Exercise registry — filled ONLY by Phase B extraction. Empty
 *  today: no exercise list has been extracted yet (Phase B not
 *  started; chapter lists exist for only 8/264 books). Add an entry
 *  here only with its Phase B source note — never from memory. */
export const QPG_EXERCISE_REGISTRY: QpgChapterExercises[] = [];

/** Exercise list for one chapter, or null when Phase B has not
 *  extracted it yet (the UI shows the honest unavailable state). */
export function qpgExercisesFor(chapterId: string): QpgChapterExercises | null {
  return QPG_EXERCISE_REGISTRY.find((c) => c.chapterId === chapterId) ?? null;
}

/** An exercise is usable only when it has verified questions. */
export function qpgExerciseAvailable(exercise: QpgExercise): boolean {
  return exercise.verifiedCount > 0;
}

export const QPG_EXERCISE_UNAVAILABLE_BN = 'এই অনুশীলনীর যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি';
export const QPG_EXERCISE_UNAVAILABLE_EN = 'No verified questions exist for this exercise yet';

/** How many exercises in a chapter are usable today. */
export function qpgUsableExerciseCount(entry: QpgChapterExercises): number {
  return entry.exercises.filter(qpgExerciseAvailable).length;
}

// ---------------------------------------------------------------------
// Selection — per-exercise checkboxes + per-chapter select-all.
// ---------------------------------------------------------------------

export type QpgExerciseSelection = Record<string, string[]>; // chapterId -> exercise ids

export function toggleQpgExercise(
  selection: QpgExerciseSelection,
  chapterId: string,
  exerciseId: string,
): QpgExerciseSelection {
  const current = selection[chapterId] ?? [];
  const next = current.includes(exerciseId)
    ? current.filter((id) => id !== exerciseId)
    : [...current, exerciseId];
  if (next.length === 0) {
    const { [chapterId]: _removed, ...rest } = selection;
    return rest;
  }
  return { ...selection, [chapterId]: next };
}

export function selectAllQpgExercises(
  selection: QpgExerciseSelection,
  entry: QpgChapterExercises,
  /** Only usable exercises are selectable — unavailable ones stay out. */
  onlyUsable = true,
): QpgExerciseSelection {
  const ids = entry.exercises
    .filter((e) => !onlyUsable || qpgExerciseAvailable(e))
    .map((e) => e.id);
  if (ids.length === 0) return selection;
  return { ...selection, [entry.chapterId]: ids };
}

export function qpgSelectedExerciseCount(selection: QpgExerciseSelection): number {
  return Object.values(selection).reduce((a, ids) => a + ids.length, 0);
}

// ---------------------------------------------------------------------
// Sheet questions — verified questions mapped to the selected
// exercises. A question joins a sheet only when it carries the
// exercise's id (future `exerciseId` field, set at verification).
// Today no verified question carries one, so the result is honestly
// empty with the reason — never invented, never a silent gap.
// ---------------------------------------------------------------------

export interface QpgSheetQuestionsResult {
  questions: QpgQuestion[];
  available: number;
  requestedExercises: number;
  reasonsBn: string[];
  reasonsEn: string[];
}

export function qpgSheetQuestionsFor(
  selection: QpgExerciseSelection,
  pool: QpgQuestion[] = [],
): QpgSheetQuestionsResult {
  const requestedExercises = qpgSelectedExerciseCount(selection);
  if (requestedExercises === 0) {
    return {
      questions: [],
      available: 0,
      requestedExercises: 0,
      reasonsBn: ['অন্তত ১টি অনুশীলনী বেছে নিন।'],
      reasonsEn: ['Select at least 1 exercise.'],
    };
  }
  // exerciseId is a future field on verified questions (set when a
  // verified pack is mapped to its exercises). No verified question
  // carries it today — the pool below is therefore honestly empty.
  const questions = pool.filter(
    (q) =>
      (q as QpgQuestion & { exerciseId?: string }).exerciseId !== undefined &&
      Object.values(selection).flat().includes(
        (q as QpgQuestion & { exerciseId?: string }).exerciseId as string,
      ),
  );
  return {
    questions,
    available: questions.length,
    requestedExercises,
    reasonsBn:
      questions.length === 0
        ? [
            'নির্বাচিত অনুশীলনীগুলোর যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি — Phase B যাচাই শেষে এখানে যোগ হবে।',
          ]
        : [],
    reasonsEn:
      questions.length === 0
        ? [
            'No verified questions exist for the selected exercises yet — they join here once Phase B verification finishes.',
          ]
        : [],
  };
}
