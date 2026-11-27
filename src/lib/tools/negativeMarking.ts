/**
 * Negative Marking Calculator — pure logic.
 * Final score = correct x marks each - wrong x negative each.
 * The 0.5-per-wrong-answer figure is the published BCS preliminary
 * rule (noted 27 Nov 2026) — the UI keeps it editable, because other
 * exams use different values. Pure functions only.
 */

export const BCS_PRELIM_NEGATIVE = 0.5;

export interface NegativeMarkingInput {
  totalQuestions: number;
  attempted: number;
  correct: number;
  marksPerQuestion: number;
  negativePerWrong: number;
}

export interface NegativeMarkingResult {
  wrong: number;
  unattempted: number;
  rawScore: number;
  deduction: number;
  finalScore: number;
  maxScore: number;
  accuracy: number;
}

/**
 * Hand-check: 200 Qs, attempted 180, correct 150, 1 mark each,
 * -0.5 wrong -> wrong 30, raw 150, deduction 15, final 135, max 200.
 */
export function calculateNegativeMarking(input: NegativeMarkingInput): NegativeMarkingResult {
  const { totalQuestions, attempted, correct, marksPerQuestion, negativePerWrong } = input;
  if (!Number.isInteger(totalQuestions) || totalQuestions <= 0) throw new Error('Total questions must be more than 0');
  if (!Number.isInteger(attempted) || attempted < 0 || attempted > totalQuestions) {
    throw new Error('Attempted must be between 0 and total questions');
  }
  if (!Number.isInteger(correct) || correct < 0 || correct > attempted) {
    throw new Error('Correct answers cannot exceed attempted');
  }
  if (marksPerQuestion <= 0) throw new Error('Marks per question must be positive');
  if (negativePerWrong < 0) throw new Error('Negative marking cannot be negative');
  const wrong = attempted - correct;
  const unattempted = totalQuestions - attempted;
  const rawScore = correct * marksPerQuestion;
  const deduction = Math.round(wrong * negativePerWrong * 100) / 100;
  const finalScore = Math.round((rawScore - deduction) * 100) / 100;
  const maxScore = totalQuestions * marksPerQuestion;
  const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 1000) / 10;
  return { wrong, unattempted, rawScore, deduction, finalScore, maxScore, accuracy };
}
