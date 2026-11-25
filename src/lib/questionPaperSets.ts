// Eduvelto — Question Paper Generator: Auto Set Code Generator (Turn 32).
//
// One paper, four sets (ক, খ, গ, ঘ): the same questions in a different
// order per set, each with its own matching Answer Key. The shuffle is
// DETERMINISTIC for a given seed (mulberry32) — the same seed always
// rebuilds the same four sets, so a teacher can re-print Set খ a week
// later and get the identical paper + key. The seed lives on the paper
// (paper setup) and is shown on the paper itself.
//
// The per-set Answer Key is data on the paper (paper.answerKey). The
// separate printable Answer Key SHEET export stays Pro-gated (tier
// spec) — the key data itself is what the OMR evaluator consumes.

import type { QpgQuestion, QpgSetCode } from './questionPaper';
import { QPG_SET_CODES } from './questionPaper';

/** Deterministic PRNG (mulberry32) — same seed, same order. */
export function qpgSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with the seeded PRNG — pure, testable. */
export function qpgShuffleSeeded<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const rand = qpgSeededRandom(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface QpgQuestionSet {
  code: QpgSetCode;
  questions: QpgQuestion[];
  /** Correct letters in THIS set's order. */
  answerKey: Array<'A' | 'B' | 'C' | 'D'>;
}

/** Build the four sets from one question list. Set ক keeps the
 *  original order; খ/গ/ঘ shuffle with seed+1/+2/+3. */
export function buildQuestionSets(questions: QpgQuestion[], seed: number): QpgQuestionSet[] {
  return QPG_SET_CODES.map((code, i) => {
    const ordered = i === 0 ? [...questions] : qpgShuffleSeeded(questions, seed + i);
    return {
      code,
      questions: ordered,
      answerKey: ordered.map((q) => q.correctLetter),
    };
  });
}

/** The set a paper uses ('' = single-set paper, original order). */
export function questionsForSet(
  questions: QpgQuestion[],
  seed: number,
  setCode: '' | QpgSetCode,
): QpgQuestion[] {
  if (setCode === '') return [...questions];
  return buildQuestionSets(questions, seed).find((s) => s.code === setCode)?.questions ?? [...questions];
}
