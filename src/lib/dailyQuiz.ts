// Eduvelto — Phase 4 (25 Nov 2026, feature/ssg-bilingual-support):
// "Daily 5-Question Free Quiz" — playable WITHOUT login.
//
// QUESTION-POOL AUDIT (done 25 Nov 2026, before building):
// - The ONLY genuinely public question set in the repo is the 35
//   BCS English MCQs in src/lib/publicBcsEnglish.ts
//   (PUBLIC_BCS_ENGLISH_QUESTIONS — owner-verified BCS English
//   Batch 1, published 22 Nov 2026, static data, zero Firestore
//   reads). The two public sample lessons (src/lib/publicLessons.ts)
//   contain prose + worked examples, NO quiz questions. The AdSense
//   mission sample pages (/learn/bcs-english-*) render those same
//   lessons. No other public sample-question set exists.
// - Lesson/question content in Firestore (books/chapters/lessons/
//   questions, job bank, NU bank) is LOGIN-GATED and must never
//   leak to signed-out users — this widget never reads it.
// - So the pool is EXACTLY 35 questions, and the UI says so
//   honestly ("৩৫টি যাচাইকৃত প্রশ্ন থেকে প্রতিদিন ৫টি"). The
//   widget rotates 5/day DETERMINISTICALLY by local date (seeded
//   shuffle — same 5 questions for everyone on the same date, a
//   new set the next day). It is a free practice quiz, NEVER a
//   real exam or a mock — the UI and the share text say so.
// - The 3 reading questions (bcs-eng-033..035) need the short
//   passage (PUBLIC_BCS_READING_PASSAGE) to be answerable; the
//   widget shows it whenever a reading question is in today's set.

import {
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_READING_PASSAGE,
  type PublicBcsQuestion,
} from './publicBcsEnglish';

/** The whole pool: the 35 verified public BCS English questions. */
export const DAILY_QUIZ_POOL: PublicBcsQuestion[] = PUBLIC_BCS_ENGLISH_QUESTIONS;
export const DAILY_QUIZ_POOL_SIZE = PUBLIC_BCS_ENGLISH_QUESTIONS.length; // 35
export const DAILY_QUIZ_COUNT = 5;
export const DAILY_QUIZ_SOURCE_BN =
  '৩৫টি যাচাইকৃত বিসিএস ইংরেজি প্রশ্ন থেকে প্রতিদিন ৫টি';
export const DAILY_QUIZ_SOURCE_EN =
  '5 questions a day from 35 verified BCS English questions';
export const DAILY_QUIZ_HOME_URL = 'https://eduvelto.com/';

export { PUBLIC_BCS_READING_PASSAGE };

/** Local date as YYYY-MM-DD (the rotation key). */
export function dailyQuizDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** FNV-1a hash — deterministic, no dependencies. */
export function hashDateSeed(dateStr: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 — small deterministic PRNG seeded from the date hash. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Today's 5 questions: a seeded shuffle of the public pool, first 5.
 * Deterministic per date — same date always gives the same 5, in
 * the same order; a different date gives a (very likely) different
 * set. Only ever draws from the public pool passed in (default:
 * the 35 verified questions) — gated content can never enter.
 */
export function selectDailyQuizQuestions(
  dateStr: string,
  pool: PublicBcsQuestion[] = DAILY_QUIZ_POOL,
): PublicBcsQuestion[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`daily quiz date must be YYYY-MM-DD, got: ${dateStr}`);
  }
  if (pool.length < DAILY_QUIZ_COUNT) {
    throw new Error(
      `daily quiz pool has ${pool.length} questions, needs ${DAILY_QUIZ_COUNT}`,
    );
  }
  const rand = mulberry32(hashDateSeed(dateStr));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, DAILY_QUIZ_COUNT);
}

/** True when today's set includes a reading question (passage needed). */
export function dailyQuizNeedsPassage(questions: PublicBcsQuestion[]): boolean {
  return questions.some((q) => q.topic === 'reading');
}

/** Bangla date for the share text, e.g. "২৫ নভেম্বর ২০২৬". */
export function dailyQuizDateBn(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Share text for the result card. States the score, the date and
 * the honest pool size. NEVER calls the quiz a real exam or a mock.
 */
export function buildDailyQuizShareText(score: number, dateStr: string): string {
  return (
    `আমি Eduvelto-র প্রতিদিনের ফ্রি কুইজে ৫-এর মধ্যে ${score} পেয়েছি ` +
    `(${dailyQuizDateBn(dateStr)})। ৩৫টি যাচাইকৃত বিসিএস ইংরেজি প্রশ্ন থেকে ` +
    `প্রতিদিন ৫টি — লগইন ছাড়াই খেলুন: eduvelto.com`
  );
}

/**
 * Facebook share dialog URL (standard sharer.php link — no SDK,
 * nothing invented). `u` is the homepage; `quote` carries the
 * result text.
 */
export function buildDailyQuizShareUrl(score: number, dateStr: string): string {
  const params = new URLSearchParams({
    u: DAILY_QUIZ_HOME_URL,
    quote: buildDailyQuizShareText(score, dateStr),
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}
