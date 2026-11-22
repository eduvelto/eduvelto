// Eduvelto — National University exam scoring (NU-4, 22 Nov 2026;
// design doc §19.1.3, §19.4).
//
// ONE of three separate modules (never merged into a single
// `calculateResult()` — §18 (a)-3):
//   calculateExamScore()      — this file: the exam mark, 0–100.
//   calculateMeritEstimate()  — nuMerit.ts: the estimated merit, 0–200.
//   validateAdmissionEligibility() — nuEligibility.ts: meets /
//     does-not-meet / cannot-determine.
//
// Scoring (circular §3(a), verified): correct × 1; wrong = 0;
// unanswered = 0. There is NO negative-marking branch in this module
// at all — a Job penalty formula must never leak into the NU path
// (§18 (a)-1). The config is checked, not trusted: a config whose
// marking differs (negativeMarking true, correct != 1) throws instead
// of silently scoring with the wrong rule.
//
// HONEST LIMIT (§19.4): the score is CLIENT-COMPUTED. It is a
// practice/mock result and is NEVER shown as a "Verified" result —
// `verified: true` cannot be written by any client (firestore.rules),
// and a verified result exists only through a reviewer's separate,
// access-controlled process (Release 3+). The result class is carried
// on the attempt (`practice` | `mock`); there is no `verified` class
// in NU-4.

import type { NuExamConfig } from './nuExamConfig';

export interface NuExamAnswers {
  correct: number;
  incorrect: number;
  unanswered: number;
}

export interface NuExamScore {
  /** Exam mark, 0–100. */
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  totalQuestions: number;
  /** The config version that scored this attempt — recorded on the
   * attempt so a later circular can never silently re-interpret it. */
  configVersion: number;
  circularVersion: string;
}

function assertNuMarking(config: NuExamConfig): void {
  const m = config.marking;
  if (m.correct !== 1 || m.incorrect !== 0 || m.unanswered !== 0 || m.negativeMarking !== false) {
    throw new Error(
      'nu-config-marking-mismatch: NU scoring requires correct=1, incorrect=0, unanswered=0, negativeMarking=false',
    );
  }
  if (config.questionMode !== 'MCQ') {
    throw new Error('nu-config-not-mcq: NU exams are MCQ only');
  }
}

/**
 * Score an NU exam attempt from the NU config alone.
 * score = correct × 1. Wrong and unanswered answers add nothing and
 * subtract nothing. Counts must be non-negative integers and must sum
 * to the config's totalQuestions.
 */
export function calculateExamScore(answers: NuExamAnswers, config: NuExamConfig): NuExamScore {
  assertNuMarking(config);
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new Error(`nu-score-invalid-count: ${key} must be a non-negative integer`);
    }
  }
  const answered = answers.correct + answers.incorrect + answers.unanswered;
  if (answered !== config.totalQuestions) {
    throw new Error(
      `nu-score-count-mismatch: answered counts sum to ${answered} but the config has ${config.totalQuestions} questions`,
    );
  }
  return {
    score: answers.correct,
    correct: answers.correct,
    incorrect: answers.incorrect,
    unanswered: answers.unanswered,
    totalQuestions: config.totalQuestions,
    configVersion: config.configVersion,
    circularVersion: config.circularVersion,
  };
}

/** The three result classes (§19.4). `verified` does NOT exist in
 * NU-4 — it arrives only with the reviewer's process (Release 3+).
 * Any code that claims a verified NU result before then is wrong. */
export type NuResultClass = 'practice' | 'mock';

export const NU_RESULT_LABEL: Record<NuResultClass, { bn: string; en: string }> = {
  practice: {
    bn: 'অনুশীলন ফলাফল — ভর্তি পরীক্ষার ফল নয়',
    en: 'Practice result — not an admission exam result',
  },
  mock: {
    bn: 'মক ফলাফল (অনুশীলন) — অফিসিয়াল ফল নয়',
    en: 'Mock result (practice) — not an official result',
  },
};
