// Eduvelto — OMR Evaluator (Turn 32): browser-based scoring, pure logic.
//
// 10–100 MCQs. Configurable negative marking (0, -0.25, -0.50, -1.0).
// Instant score + answered / correct / wrong / blank breakdown +
// multiple-mark detection (a question marked twice counts as wrong
// AND is flagged — it is never silently counted as an answer).
//
// Mobile-camera OMR scanning is PHASE 2 — NOT built here, recorded as
// a Phase 2 item (see the MVP report). This module scores answers the
// teacher enters by hand (bubble grid in the evaluator page).

export type QpgOmrMark = 'A' | 'B' | 'C' | 'D' | '' | 'MULTI';

export type QpgNegativeMarking = 0 | -0.25 | -0.5 | -1;

export const QPG_NEGATIVE_MARKING_OPTIONS: QpgNegativeMarking[] = [0, -0.25, -0.5, -1];

export const QPG_OMR_MIN_QUESTIONS = 10;
export const QPG_OMR_MAX_QUESTIONS = 100;

export interface QpgOmrResult {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  blank: number;
  /** Questions with more than one mark (counted wrong + flagged). */
  multipleMarked: number;
  /** Question numbers (1-based) with multiple marks. */
  multipleMarkedNumbers: number[];
  /** Score after negative marking (may be negative; never rounded away). */
  score: number;
  maxScore: number;
  percent: number;
  perQuestion: Array<{
    number: number;
    mark: QpgOmrMark;
    correctLetter: 'A' | 'B' | 'C' | 'D';
    state: 'correct' | 'wrong' | 'blank' | 'multi';
  }>;
}

export function evaluateOmr(args: {
  answerKey: Array<'A' | 'B' | 'C' | 'D'>;
  marks: QpgOmrMark[];
  negativeMarking: QpgNegativeMarking;
  marksPerQuestion?: number;
}): QpgOmrResult {
  const total = args.answerKey.length;
  const marksPerQuestion = args.marksPerQuestion ?? 1;
  let answered = 0;
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let multipleMarked = 0;
  const multipleMarkedNumbers: number[] = [];
  const perQuestion: QpgOmrResult['perQuestion'] = args.answerKey.map((correctLetter, i) => {
    const mark = args.marks[i] ?? '';
    if (mark === '') {
      blank++;
      return { number: i + 1, mark, correctLetter, state: 'blank' as const };
    }
    if (mark === 'MULTI') {
      answered++;
      wrong++;
      multipleMarked++;
      multipleMarkedNumbers.push(i + 1);
      return { number: i + 1, mark, correctLetter, state: 'multi' as const };
    }
    answered++;
    if (mark === correctLetter) {
      correct++;
      return { number: i + 1, mark, correctLetter, state: 'correct' as const };
    }
    wrong++;
    return { number: i + 1, mark, correctLetter, state: 'wrong' as const };
  });
  const score = correct * marksPerQuestion + wrong * args.negativeMarking * marksPerQuestion;
  const maxScore = total * marksPerQuestion;
  return {
    total,
    answered,
    correct,
    wrong,
    blank,
    multipleMarked,
    multipleMarkedNumbers,
    score,
    maxScore,
    percent: maxScore > 0 ? (score / maxScore) * 100 : 0,
    perQuestion,
  };
}

/** Validate an OMR run before scoring (10–100 MCQs, key/marks aligned). */
export function validateOmrRun(
  answerKey: Array<'A' | 'B' | 'C' | 'D'>,
  marks: QpgOmrMark[],
): string[] {
  const problems: string[] = [];
  if (answerKey.length < QPG_OMR_MIN_QUESTIONS) {
    problems.push(`কমপক্ষে ${QPG_OMR_MIN_QUESTIONS}টি প্রশ্ন দরকার (এখন ${answerKey.length}টি)।`);
  }
  if (answerKey.length > QPG_OMR_MAX_QUESTIONS) {
    problems.push(`সর্বোচ্চ ${QPG_OMR_MAX_QUESTIONS}টি প্রশ্ন (এখন ${answerKey.length}টি)।`);
  }
  if (marks.length !== answerKey.length) {
    problems.push('উত্তরপত্রের দৈর্ঘ্য প্রশ্নের সংখ্যার সমান হতে হবে।');
  }
  return problems;
}

/** Parse a pasted key ("C A B D ..." or "CABD...") into letters. */
export function parseOmrKey(text: string): Array<'A' | 'B' | 'C' | 'D'> {
  const letters = text.toUpperCase().replace(/[^ABCD]/g, '');
  return [...letters] as Array<'A' | 'B' | 'C' | 'D'>;
}
