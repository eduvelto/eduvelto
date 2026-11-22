// Eduvelto — auth gating for exams + reading (owner instruction
// 22 Nov 2026 ~10:33, BINDING).
//
// THE GUEST RULE (decided by the owner; details below are Muse's,
// recorded here so the owner can correct them):
//   1. NO EXAM without login/registration. A signed-out visitor NEVER
//      sees questions and NEVER submits — not even a demo or guest
//      attempt. The exam entry shows the Bangla login wall.
//   2. READING IS LIMITED for guests. Guests may see titles,
//      descriptions and book info, and ONE preview chapter/lesson per
//      book. Every other chapter/lesson requires login (same wall).
//      DECISION (recorded, owner can correct): the preview chapter is
//      the FIRST chapter of each book (the loader marks it
//      `isPreview: true`; see scripts/load-library-content.mjs).
//      Guests see ONLY the preview chapter in a book's chapter list —
//      other chapter titles are not shown to signed-out browsers.
//      A stricter reading was chosen deliberately: the alternative
//      (show every title with a lock) would still be honest, but the
//      brief's rules-level instruction is "chapter/lesson content
//      readable by authenticated users, EXCEPT chapters flagged
//      isPreview: true (public)" — so non-preview chapters are not
//      readable at all for guests, list included.
//   3. Books + directory metadata stay public (titles, descriptions,
//      book info) — guests browse the library and see what exists.
//   4. The academic exam LIST is also login-gated for guests. This is
//      a data-model consequence, not a separate owner choice: a quiz
//      document EMBEDS its questions, so any list read would send
//      questions to a signed-out browser — which rule 1 forbids. (Job
//      exam metadata stays public: jobExams docs carry no questions;
//      see the Step 5 addendum for the Job/NU side.)
//
// ENFORCEMENT IS TWO LAYERS, and the rules are the real one:
//   - firestore.rules denies the reads (quizzes: signed-in only;
//     chapters/lessons: signed-in, or Published + isPreview for guests).
//   - the pages check auth BEFORE fetching, so a signed-out browser
//     never even asks for the content (no fetch-then-hide).
// A denied read must render the wall, never a generic error —
// isPermissionDeniedError() tells the pages which is which.
//
// This module is PURE (no Firebase imports) so it is unit-testable
// without an emulator (src/lib/gating.test.ts).

export type LoginWallKind = 'exam' | 'result' | 'chapter' | 'lesson';

export interface LoginWallCopy {
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
}

/** The wall copy, Bangla-first. One source so every exam/reading wall says the same thing. */
export function loginWallCopy(kind: LoginWallKind): LoginWallCopy {
  switch (kind) {
    case 'exam':
      return {
        titleBn: 'পরীক্ষা দিতে লগইন করুন',
        titleEn: 'Sign in to take the exam',
        bodyBn: 'পরীক্ষা দিতে হলে লগইন বা রেজিস্ট্রেশন করতে হবে। লগইন ছাড়া পরীক্ষা দেওয়া যায় না — অতিথি হিসেবে পরীক্ষা দেওয়ার ব্যবস্থা নেই।',
        bodyEn: 'You need to sign in or register to take an exam. Exams cannot be taken without signing in — there is no guest exam.',
      };
    case 'result':
      return {
        titleBn: 'ফলাফল দেখতে লগইন করুন',
        titleEn: 'Sign in to see the result',
        bodyBn: 'আপনার পরীক্ষার ফলাফল দেখতে লগইন করুন।',
        bodyEn: 'Sign in to see your exam result.',
      };
    case 'chapter':
    case 'lesson':
      return {
        titleBn: 'এই পাঠটি পড়তে লগইন করুন',
        titleEn: 'Sign in to read this lesson',
        bodyBn: 'এই পাঠটি পড়তে হলে লগইন বা রেজিস্ট্রেশন করতে হবে। প্রতিটি বইয়ের প্রথম পাঠটি অতিথি হিসেবে পড়া যায়।',
        bodyEn: 'You need to sign in or register to read this lesson. The first lesson of each book can be read as a guest.',
      };
  }
}

/** Strict preview check: only an explicit `isPreview === true` counts.
 * A missing field (every live chapter/lesson today) is NOT a preview —
 * live data gains previews only when the loader re-runs with the
 * isPreview marking (separate owner approval). */
export function isPreviewDoc(data: { isPreview?: unknown } | null | undefined): boolean {
  return data != null && data.isPreview === true;
}

/** A guest may read a chapter only when it is the book's preview chapter. */
export function canGuestReadChapter(chapter: { isPreview?: unknown } | null | undefined): boolean {
  return isPreviewDoc(chapter);
}

/** A guest may read a lesson only when it belongs to a preview chapter
 * (lesson id == chapter id in the loader's model, and the loader marks
 * both docs with the same isPreview value). */
export function canGuestReadLesson(lesson: { isPreview?: unknown } | null | undefined): boolean {
  return isPreviewDoc(lesson);
}

/** True when a Firestore failure is a rules denial (code
 * 'permission-denied'). Pages use this to show the login wall instead
 * of a generic load error when a signed-out visitor hits gated content. */
export function isPermissionDeniedError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: unknown }).code === 'permission-denied'
  );
}
