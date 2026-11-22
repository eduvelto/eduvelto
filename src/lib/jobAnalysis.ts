// Eduvelto — Job Preparation result + analysis (Step 10).
//
// PURE helpers over STORED attempt docs (users/{uid}/jobAttempts
// for practice, users/{uid}/jobExamAttempts for mocks). Nothing
// here touches Firestore, re-reads an answer key, or writes —
// the analysis is READ-ONLY over data the Step 8/9 engines
// already stored. All percentages shown to the student are the
// DISPLAY values (stored percentage clamped at 0, the Step 8
// rule); the stored value is never changed.
//
// HONESTY (Steps 7–9, binding): every number here comes from the
// student's OWN attempts only. There are no percentiles, no ranks,
// no comparisons with other students, no official pass — a mock
// "pass" is only ever the "(অনুশীলন হিসাব)" line the result page
// already carries, and every analysis view carries
// JOB_PRACTICE_RESULT_LABEL.
//
// GEMINI FOLD-IN (Step 10, see team/job-step10-result-analysis-2026-11-22.md):
//  - "Negative Marking Cost" — the marks wrong answers actually
//    cost, in plain Bangla (negativeMarkingExplanation).
//  - Action badges per weak topic: Concept Gap / Speed Trap /
//    Careless Leak, from accuracy + per-answer time — ADAPTED:
//    thresholds are fixed and documented below (no exam-weight
//    data exists to rank "high-yield" topics, so priority stays
//    wrong-count first, the Step 9 order).
//  - Time×accuracy buckets per question (Mastered / Slow but
//    Sure / Time Trap / Guessing) — ADAPTED to the stored
//    per-answer times; "slow" is defined against the attempt's
//    own average, never an invented benchmark.
//  - "Targeted Micro-Drill" (10-question drill per subtopic) is
//    NOT built here: a drill needs a Moderator-built bundle per
//    topic and only the 13 BCS English topic bundles exist live.
//    weakTopicPracticeLink() links to the bundle that DOES exist
//    (the practice attempt's own bundle) or to the topic page —
//    it never invents a bundle or presents a drill as available
//    when it is not.

import { jobTopicLabelBn, type JobAttemptAnswer } from './jobEngine';

/** The fields the analysis reads from a stored attempt doc.
/// Defensive: a missing/odd field falls back honestly (0 / ''
/// / null) instead of throwing — an old attempt must still
/// analyse, just with less detail. */
export interface JobAttemptSummary {
  docId: string;
  kind: 'practice' | 'mock';
  examSlug: string;
  bundleId: string;
  score: number;
  totalMarks: number;
  /** Stored percentage (may be negative); display clamps at 0. */
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  negativeDeduction: number;
  /** Penalty actually applied per wrong answer; null when the
   * attempt predates the field. */
  negativeMarkingUsed: number | null;
  timeSpentSeconds: number;
  /** submittedAt as millis, or null when the doc has none. */
  submittedAtMillis: number | null;
  answers: JobAttemptAnswer[];
}

/** Display percentage: the stored value clamped at 0 (Step 8
 * rule — a negative score never shows as a negative %). */
export function displayPercentage(percentage: number): number {
  return Math.max(0, percentage);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function timestampToMillis(t: unknown): number | null {
  if (t === null || t === undefined) return null;
  const v = t as { toMillis?: () => number; seconds?: number };
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return null;
}

/** Normalize one stored attempt doc (plain object from
 * Firestore) into the summary the analysis functions take. */
export function attemptSummaryFromStored(
  docId: string,
  data: Record<string, unknown>,
): JobAttemptSummary {
  const answers = Array.isArray(data.answers)
    ? (data.answers as JobAttemptAnswer[]).filter(
        (a) => a && typeof a === 'object' && typeof a.n === 'number',
      )
    : [];
  return {
    docId,
    kind: data.kind === 'mock' ? 'mock' : 'practice',
    examSlug: typeof data.examSlug === 'string' ? data.examSlug : '',
    bundleId: typeof data.bundleId === 'string' ? data.bundleId : '',
    score: num(data.score),
    totalMarks: num(data.totalMarks),
    percentage: num(data.percentage),
    correctCount: num(data.correctCount),
    wrongCount: num(data.wrongCount),
    unansweredCount: num(data.unansweredCount),
    negativeDeduction: num(data.negativeDeduction),
    negativeMarkingUsed:
      typeof data.negativeMarkingUsed === 'number' ? data.negativeMarkingUsed : null,
    timeSpentSeconds: num(data.timeSpentSeconds),
    submittedAtMillis: timestampToMillis(data.submittedAt),
    answers,
  };
}

/** "১ মিনিট ৩০ সেকেন্ড" / "৪৫ সেকেন্ড" — the existing
 * result-page convention (Western digits, Bangla words). */
export function formatDurationBn(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest} সেকেন্ড`;
  if (rest === 0) return `${m} মিনিট`;
  return `${m} মিনিট ${rest} সেকেন্ড`;
}

/* ------------------------------------------------------------------ */
/* 1. Negative-marking explanation                                     */
/* ------------------------------------------------------------------ */

export interface NegativeMarkingExplanation {
  /** True when the penalty was disabled for this attempt. */
  disabled: boolean;
  /** Marks actually applied per wrong answer (0 when disabled). */
  penaltyPerWrong: number;
  /** The formula in plain Bangla, e.g.
   * "২টি সঠিক × ১ − ১টি ভুল × ০.৫ = ১.৫" — Western digits, the
   * existing result-page convention. */
  formula: string;
  /** The cost line, e.g. "১টি ভুল উত্তরে ০.৫ নম্বর কাটা গেছে" —
   * empty when nothing was deducted. */
  costLine: string;
}

/** Marks per question, from the stored answers (a correct
 * answer's marks field IS the per-question mark); 1 when no
 * correct answer exists to read it from. */
export function marksPerQuestion(attempt: JobAttemptSummary): number {
  const correct = attempt.answers.find((a) => a.selected !== null && a.correct);
  return correct && correct.marks > 0 ? correct.marks : 1;
}

export function negativeMarkingExplanation(
  attempt: JobAttemptSummary,
): NegativeMarkingExplanation {
  const penalty = attempt.negativeMarkingUsed ?? null;
  const mpq = marksPerQuestion(attempt);
  if (penalty === 0) {
    // Step 8 fold-in (finding 2): NEVER show a "−0" as if a
    // penalty had applied.
    return {
      disabled: true,
      penaltyPerWrong: 0,
      formula: `${attempt.correctCount}টি সঠিক × ${mpq} = ${attempt.score} নম্বর (নেগেটিভ মার্কিং বন্ধ)`,
      costLine: '',
    };
  }
  const p = penalty ?? 0;
  return {
    disabled: false,
    penaltyPerWrong: p,
    formula:
      `${attempt.correctCount}টি সঠিক × ${mpq} − ` +
      `${attempt.wrongCount}টি ভুল × ${p} = ${attempt.score} নম্বর`,
    costLine:
      attempt.wrongCount > 0 && attempt.negativeDeduction > 0
        ? `${attempt.wrongCount}টি ভুল উত্তরে ${attempt.negativeDeduction} নম্বর কাটা গেছে`
        : '',
  };
}

/* ------------------------------------------------------------------ */
/* 2. Per-topic accuracy + per-subject time                            */
/* ------------------------------------------------------------------ */

export interface TopicStat {
  topicId: string;
  label: string;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  /** correct ÷ total × 100 (0 when the topic has no questions). */
  accuracy: number;
  timeSeconds: number;
  avgTimeSeconds: number;
  avgCorrectTimeSeconds: number;
  avgWrongTimeSeconds: number;
}

/** Per-topic accuracy, time spent on that topic, and the
 * correct/wrong split of that time (the badge inputs). Sorted by
 * total desc, then wrong desc, then topicId — deterministic. */
export function perTopicAccuracy(answers: JobAttemptAnswer[]): TopicStat[] {
  const map = new Map<
    string,
    {
      correct: number;
      wrong: number;
      unanswered: number;
      timeSeconds: number;
      correctTime: number;
      wrongTime: number;
    }
  >();
  for (const a of answers) {
    const s = map.get(a.topicId) ?? {
      correct: 0,
      wrong: 0,
      unanswered: 0,
      timeSeconds: 0,
      correctTime: 0,
      wrongTime: 0,
    };
    const t = typeof a.timeSpentSeconds === 'number' && a.timeSpentSeconds >= 0 ? a.timeSpentSeconds : 0;
    s.timeSeconds += t;
    if (a.selected === null) {
      s.unanswered += 1;
    } else if (a.correct) {
      s.correct += 1;
      s.correctTime += t;
    } else {
      s.wrong += 1;
      s.wrongTime += t;
    }
    map.set(a.topicId, s);
  }
  return [...map.entries()]
    .map(([topicId, s]) => {
      const total = s.correct + s.wrong + s.unanswered;
      return {
        topicId,
        label: jobTopicLabelBn(topicId),
        correct: s.correct,
        wrong: s.wrong,
        unanswered: s.unanswered,
        total,
        accuracy: total > 0 ? Math.round((s.correct / total) * 1000) / 10 : 0,
        timeSeconds: s.timeSeconds,
        avgTimeSeconds: total > 0 ? s.timeSeconds / total : 0,
        avgCorrectTimeSeconds: s.correct > 0 ? s.correctTime / s.correct : 0,
        avgWrongTimeSeconds: s.wrong > 0 ? s.wrongTime / s.wrong : 0,
      };
    })
    .sort((a, b) => b.total - a.total || b.wrong - a.wrong || (a.topicId < b.topicId ? -1 : 1));
}

export interface SubjectTimeStat {
  subjectId: string;
  label: string;
  questions: number;
  timeSeconds: number;
  avgTimeSeconds: number;
}

/** Time per section/subject, aggregated by subjectId. */
export function perSubjectTime(answers: JobAttemptAnswer[]): SubjectTimeStat[] {
  const map = new Map<string, { questions: number; timeSeconds: number }>();
  for (const a of answers) {
    const s = map.get(a.subjectId) ?? { questions: 0, timeSeconds: 0 };
    s.questions += 1;
    s.timeSeconds +=
      typeof a.timeSpentSeconds === 'number' && a.timeSpentSeconds >= 0 ? a.timeSpentSeconds : 0;
    map.set(a.subjectId, s);
  }
  return [...map.entries()]
    .map(([subjectId, s]) => ({
      subjectId,
      label: jobTopicLabelBn(subjectId),
      questions: s.questions,
      timeSeconds: s.timeSeconds,
      avgTimeSeconds: s.questions > 0 ? s.timeSeconds / s.questions : 0,
    }))
    .sort((a, b) => b.timeSeconds - a.timeSeconds || (a.subjectId < b.subjectId ? -1 : 1));
}

/* ------------------------------------------------------------------ */
/* 3. Action badges (Gemini #1, adapted) + time×accuracy buckets     */
/* ------------------------------------------------------------------ */

/** The badge thresholds are FIXED and documented (no
 * exam-weight data exists to rank "high-yield" topics):
 *  - careless: wrong answers answered fast (avg < 30s) — the
 *    marks leak to rushing, not to not knowing.
 *  - speed: wrong answers took long (avg ≥ 90s) while correct
 *    ones were quick (avg < 60s) — a pressure trap, not a
 *    concept gap.
 *  - concept: accuracy below 50% with neither of the above —
 *    the topic needs study, not speed work.
 * Only topics with at least one wrong answer get a badge. */
export type TopicActionBadge = 'concept' | 'speed' | 'careless';

export const TOPIC_ACTION_BADGE_BN: Record<TopicActionBadge, string> = {
  concept: 'ধারণার ঘাটতি — এই টপিকটি আবার পড়ুন',
  speed: 'সময়ের ফাঁদ — ধীর প্রশ্নে ভুল হচ্ছে',
  careless: 'তাড়াহুড়ো — দ্রুত ভুলে নম্বর কাটা যাচ্ছে',
};

export function topicActionBadge(stat: TopicStat): TopicActionBadge | null {
  if (stat.wrong === 0) return null;
  if (stat.avgWrongTimeSeconds < 30) return 'careless';
  if (stat.avgWrongTimeSeconds >= 90 && stat.correct > 0 && stat.avgCorrectTimeSeconds < 60) {
    return 'speed';
  }
  if (stat.accuracy < 50) return 'concept';
  return null;
}

/** "Slow" is defined against the attempt's OWN average time per
 * question (never an invented benchmark): a question is slow
 * when it took more than 1.5× the attempt average. */
export function isSlowAnswer(timeSpentSeconds: number, avgSeconds: number): boolean {
  if (avgSeconds <= 0) return timeSpentSeconds >= 90;
  return timeSpentSeconds > avgSeconds * 1.5;
}

export type AnswerTimeBucket = 'mastered' | 'slow-sure' | 'time-trap' | 'guessing' | 'unanswered';

export const ANSWER_TIME_BUCKET_BN: Record<AnswerTimeBucket, string> = {
  mastered: 'আয়ত্ত — দ্রুত ও সঠিক',
  'slow-sure': 'ধীর কিন্তু নিশ্চিত',
  'time-trap': 'সময়ের ফাঁদ — ধীর, তবু ভুল',
  guessing: 'অনুমান / ধারণার ঘাটতি — দ্রুত, তবু ভুল',
  unanswered: 'উত্তর দেওয়া হয়নি',
};

/** Classify one answer by correctness × time (Gemini #1,
 * adapted). Unanswered answers are their own bucket. */
export function classifyAnswerTime(
  answer: JobAttemptAnswer,
  avgSeconds: number,
): AnswerTimeBucket {
  if (answer.selected === null) return 'unanswered';
  const slow = isSlowAnswer(answer.timeSpentSeconds ?? 0, avgSeconds);
  if (answer.correct) return slow ? 'slow-sure' : 'mastered';
  return slow ? 'time-trap' : 'guessing';
}

/* ------------------------------------------------------------------ */
/* 4. Trends — the student's OWN past attempts only                    */
/* ------------------------------------------------------------------ */

export interface AttemptTrend {
  /** Attempts considered (same kind when a kind filter was
   * applied by the caller — this function never mixes kinds
   * unless the caller passes a mixed list). */
  count: number;
  latestPercent: number | null;
  bestPercent: number | null;
  previousPercent: number | null;
  /** latest − previous, in display-% points; null with < 2. */
  deltaVsPrevious: number | null;
  /** Plain-Bangla sentence, own-past only, e.g.
   * "আগের মকের চেয়ে +৫%". Uses Western digits, the existing
   * convention. */
  sentence: string;
}

/** Trend over a list of attempts of ONE kind, newest first
 * (the list order the loaders return). Percentages are the
 * DISPLAY values (clamped at 0). */
export function attemptTrend(
  attempts: JobAttemptSummary[],
  kindLabel: 'মক' | 'অনুশীলন',
): AttemptTrend {
  if (attempts.length === 0) {
    return {
      count: 0,
      latestPercent: null,
      bestPercent: null,
      previousPercent: null,
      deltaVsPrevious: null,
      sentence: `এখনো কোনো ${kindLabel} দেওয়া হয়নি — ${kindLabel} দিলে এখানে আপনার অগ্রগতি দেখাবে।`,
    };
  }
  const percents = attempts.map((a) => displayPercentage(a.percentage));
  const latest = percents[0];
  const best = Math.max(...percents);
  if (attempts.length === 1) {
    return {
      count: 1,
      latestPercent: latest,
      bestPercent: best,
      previousPercent: null,
      deltaVsPrevious: null,
      sentence: `এটাই আপনার প্রথম ${kindLabel} — পরের ${kindLabel} দিলে তার সঙ্গে তুলনা এখানে দেখাবে।`,
    };
  }
  const previous = percents[1];
  const delta = Math.round((latest - previous) * 10) / 10;
  const sign = delta > 0 ? '+' : '';
  return {
    count: attempts.length,
    latestPercent: latest,
    bestPercent: best,
    previousPercent: previous,
    deltaVsPrevious: delta,
    sentence:
      delta === 0
        ? `আগের ${kindLabel}ের সমান — ${latest}%।`
        : `আগের ${kindLabel}ের চেয়ে ${sign}${delta}% — সর্বশেষ ${latest}%, আগেরটি ${previous}%।`,
  };
}

/* ------------------------------------------------------------------ */
/* 5. Topic mastery over time                                          */
/* ------------------------------------------------------------------ */

export interface TopicMastery {
  topicId: string;
  label: string;
  /** Accuracy on the FIRST attempt that touched this topic. */
  firstAccuracy: number;
  /** Accuracy on the LATEST attempt that touched this topic. */
  latestAccuracy: number;
  attemptsTouched: number;
  delta: number;
}

/** Per-topic accuracy, first attempt vs latest attempt (attempts
 * newest first). Labelled practice data only by the caller. */
export function topicMasteryOverTime(attempts: JobAttemptSummary[]): TopicMastery[] {
  const map = new Map<string, { first: number; latest: number; touched: number }>();
  // Walk oldest → newest so "first" sticks and "latest" ends up
  // the newest attempt touching the topic.
  const oldestFirst = [...attempts].reverse();
  for (const attempt of oldestFirst) {
    for (const stat of perTopicAccuracy(attempt.answers)) {
      const s = map.get(stat.topicId);
      if (!s) {
        map.set(stat.topicId, { first: stat.accuracy, latest: stat.accuracy, touched: 1 });
      } else {
        s.latest = stat.accuracy;
        s.touched += 1;
      }
    }
  }
  return [...map.entries()]
    .map(([topicId, s]) => ({
      topicId,
      label: jobTopicLabelBn(topicId),
      firstAccuracy: s.first,
      latestAccuracy: s.latest,
      attemptsTouched: s.touched,
      delta: Math.round((s.latest - s.first) * 10) / 10,
    }))
    .sort((a, b) => b.attemptsTouched - a.attemptsTouched || (a.topicId < b.topicId ? -1 : 1));
}

/* ------------------------------------------------------------------ */
/* 6. Time-management summary                                          */
/* ------------------------------------------------------------------ */

export interface TimeManagementSummary {
  /** Average seconds per question across all attempts. */
  avgTimePerQuestion: number;
  /** Total questions answered across all attempts. */
  totalQuestions: number;
  slowestTopic: { topicId: string; label: string; avgTimeSeconds: number } | null;
  fastestTopic: { topicId: string; label: string; avgTimeSeconds: number } | null;
  /** Unanswered counts, newest first (one per attempt). */
  unansweredTrend: number[];
  /** Plain-Bangla sentence about the unanswered trend. */
  unansweredSentence: string;
}

/** Time summary across attempts. Slowest/fastest topics need at
 * least 2 questions in the aggregated pool, so a single odd
 * question cannot crown a topic. */
export function timeManagementSummary(attempts: JobAttemptSummary[]): TimeManagementSummary {
  const allAnswers = attempts.flatMap((a) => a.answers);
  const totalQuestions = allAnswers.length;
  const totalTime = allAnswers.reduce(
    (sum, a) => sum + (typeof a.timeSpentSeconds === 'number' && a.timeSpentSeconds >= 0 ? a.timeSpentSeconds : 0),
    0,
  );
  const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
  const topicStats = perTopicAccuracy(allAnswers).filter((s) => s.total >= 2);
  const slowest = topicStats.length > 0 ? [...topicStats].sort((a, b) => b.avgTimeSeconds - a.avgTimeSeconds)[0] : null;
  const fastest = topicStats.length > 0 ? [...topicStats].sort((a, b) => a.avgTimeSeconds - b.avgTimeSeconds)[0] : null;
  const unansweredTrend = attempts.map((a) => a.unansweredCount);
  let unansweredSentence: string;
  if (attempts.length === 0) {
    unansweredSentence = 'এখনো কোনো মক/অনুশীলন দেওয়া হয়নি — সময়ের বিশ্লেষণ এখানে দেখাবে।';
  } else if (attempts.length === 1) {
    unansweredSentence = `এই ${attempts[0].kind === 'mock' ? 'মকে' : 'অনুশীলনে'} ${attempts[0].unansweredCount}টি প্রশ্নের উত্তর দেওয়া হয়নি।`;
  } else {
    const latest = unansweredTrend[0];
    const previous = unansweredTrend[1];
    if (latest < previous) {
      unansweredSentence = `উত্তর না-দেওয়া প্রশ্ন কমছে — আগেরটিতে ${previous}টি, সর্বশেষে ${latest}টি।`;
    } else if (latest > previous) {
      unansweredSentence = `উত্তর না-দেওয়া প্রশ্ন বাড়ছে — আগেরটিতে ${previous}টি, সর্বশেষে ${latest}টি।`;
    } else {
      unansweredSentence = `উত্তর না-দেওয়া প্রশ্ন আগের মতোই — ${latest}টি।`;
    }
  }
  return {
    avgTimePerQuestion,
    totalQuestions,
    slowestTopic: slowest
      ? { topicId: slowest.topicId, label: slowest.label, avgTimeSeconds: slowest.avgTimeSeconds }
      : null,
    fastestTopic: fastest
      ? { topicId: fastest.topicId, label: fastest.label, avgTimeSeconds: fastest.avgTimeSeconds }
      : null,
    unansweredTrend,
    unansweredSentence,
  };
}

/* ------------------------------------------------------------------ */
/* 7. Wrong-answer notebook hook (Step 13 — PREPARE ONLY)             */
/* ------------------------------------------------------------------ */

/** Step 13 hook — PREPARE ONLY. Derives the wrong + unanswered
 * answers from a STORED attempt so a future notebook can offer
 * them for re-practice. No UI, no new collection, no write path:
 * Step 13 builds the notebook on top of this list. "Wrong" and
 * "unanswered" stay separate — they need different fixes (a
 * rushed wrong vs a skipped question are not the same weakness;
 * Gemini #2). */
export interface WrongAnswerEntry {
  n: number;
  questionId: string;
  topicId: string;
  subjectId: string;
  selected: string | null;
  correctText: string | null;
  timeSpentSeconds: number;
  status: 'wrong' | 'unanswered';
}

export function buildWrongAnswerList(attempt: JobAttemptSummary): WrongAnswerEntry[] {
  return attempt.answers
    .filter((a) => a.selected === null || !a.correct)
    .map((a) => ({
      n: a.n,
      questionId: a.questionId,
      topicId: a.topicId,
      subjectId: a.subjectId,
      selected: a.selected,
      correctText: a.correctText,
      timeSpentSeconds: typeof a.timeSpentSeconds === 'number' ? a.timeSpentSeconds : 0,
      status: (a.selected === null ? 'unanswered' : 'wrong') as 'wrong' | 'unanswered',
    }))
    .sort((a, b) => a.n - b.n);
}

/* ------------------------------------------------------------------ */
/* 9. ChatGPT fold-in (Step 10): topic levels, correct-vs-wrong     */
/*    time, the three-second observation, per-exam grouping          */
/* ------------------------------------------------------------------ */

/** Topic level for the result table (ChatGPT §2A/§3): three
 * text levels — never colour alone, and never a permanent
 * ability label ("এই পরীক্ষায় দুর্বল", not "আপনি গণিতে
 * দুর্বল"). A topic with fewer than 3 questions is too small
 * a sample to judge (ChatGPT §4: ১/২ = ৫০% ≠ ১০/২০ = ৫০%). */
export type TopicLevel = 'good' | 'medium' | 'weak' | 'small-sample';

export const TOPIC_LEVEL_BN: Record<TopicLevel, string> = {
  good: 'ভালো',
  medium: 'মাঝারি',
  weak: 'এই পরীক্ষায় দুর্বল',
  'small-sample': 'নমুনা ছোট — সিদ্ধান্ত নয়',
};

export function topicLevel(accuracy: number, total: number): TopicLevel {
  if (total < 3) return 'small-sample';
  if (accuracy >= 70) return 'good';
  if (accuracy >= 40) return 'medium';
  return 'weak';
}

/** Average time on correct vs wrong answers (ChatGPT §2B).
 * The insight pattern is "ভুল উত্তরে গড়ে X সেকেন্ড, সঠিক
 * উত্তরে Y সেকেন্ড" — but time alone is never a judgement:
 * a hard question honestly takes longer than an easy one, so
 * the page pairs the numbers with that caveat. */
export interface CorrectVsWrongTime {
  avgCorrectSeconds: number;
  avgWrongSeconds: number;
  correctCount: number;
  wrongCount: number;
}

export function correctVsWrongTime(answers: JobAttemptAnswer[]): CorrectVsWrongTime {
  let correctTime = 0;
  let wrongTime = 0;
  let correctCount = 0;
  let wrongCount = 0;
  for (const a of answers) {
    if (a.selected === null) continue;
    const t = typeof a.timeSpentSeconds === 'number' && a.timeSpentSeconds >= 0 ? a.timeSpentSeconds : 0;
    if (a.correct) {
      correctCount += 1;
      correctTime += t;
    } else {
      wrongCount += 1;
      wrongTime += t;
    }
  }
  return {
    avgCorrectSeconds: correctCount > 0 ? correctTime / correctCount : 0,
    avgWrongSeconds: wrongCount > 0 ? wrongTime / wrongCount : 0,
    correctCount,
    wrongCount,
  };
}

/** The three-second summary (ChatGPT §3): one personalized
 * observation generated from THIS attempt's actual data — the
 * weakest topic + what the wrong answers cost. Never a generic
 * motivational template, never an invented benchmark. */
export function resultObservation(attempt: JobAttemptSummary): string {
  if (attempt.answers.length === 0 || attempt.unansweredCount === attempt.answers.length) {
    return 'কোনো প্রশ্নের উত্তর দেওয়া হয়নি — পরেরবার অন্তত কিছু প্রশ্নের উত্তর দেওয়ার চেষ্টা করুন।';
  }
  if (attempt.wrongCount === 0) {
    return 'কোনো ভুল উত্তর নেই — সব প্রশ্নের উত্তর সঠিক হয়েছে।';
  }
  const stats = perTopicAccuracy(attempt.answers).filter((s) => s.wrong > 0 && s.total >= 2);
  const weakest = stats.length > 0
    ? [...stats].sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong)[0]
    : null;
  const cost = attempt.negativeDeduction > 0
    ? ` ভুল উত্তরে ${attempt.negativeDeduction} নম্বর কাটা গেছে।`
    : '';
  if (!weakest) {
    return `মোট ${attempt.wrongCount}টি ভুল উত্তর।${cost}`;
  }
  return `সবচেয়ে দুর্বল টপিক ${weakest.label} (${weakest.correct}/${weakest.total} সঠিক) — এটাই ১ম অগ্রাধিকার।${cost}`;
}

/** Group attempts by exam (ChatGPT §2D): progress is only ever
 * compared between SIMILAR tests — a 100-question BCS mock is
 * never trended against a 20-question practice bundle. Groups
 * are sorted by attempt count desc, then exam slug. */
export function groupAttemptsByExam(
  attempts: JobAttemptSummary[],
): Array<{ examSlug: string; attempts: JobAttemptSummary[] }> {
  const map = new Map<string, JobAttemptSummary[]>();
  for (const a of attempts) {
    const list = map.get(a.examSlug) ?? [];
    list.push(a);
    map.set(a.examSlug, list);
  }
  return [...map.entries()]
    .map(([examSlug, list]) => ({ examSlug, attempts: list }))
    .sort((a, b) => b.attempts.length - a.attempts.length || (a.examSlug < b.examSlug ? -1 : 1));
}

/* ------------------------------------------------------------------ */
/* 8. Weak-topic practice link                                         */
/* ------------------------------------------------------------------ */

/** Where a weak topic's "আবার অনুশীলন করুন" goes (Gemini #1
 * micro-drill, adapted — see the file header):
 *  - a PRACTICE attempt's own bundle IS its topic bundle, so the
 *    link re-runs that bundle (/jobs/practice/:bundleId) — a
 *    drill that really exists;
 *  - otherwise the topic page (/jobs/:exam/subjects/:subject/:topic),
 *    derived from the answer's subjectId/topicId — the topic page
 *    honestly says "not yet built" when no bundle exists there.
 * Never invents a bundle ID. */
export function weakTopicPracticeLink(
  attempt: JobAttemptSummary,
  topicId: string,
): { to: string; kind: 'practice-bundle' | 'topic-page' } {
  if (attempt.kind === 'practice' && attempt.bundleId) {
    return { to: `/jobs/practice/${attempt.bundleId}`, kind: 'practice-bundle' };
  }
  const answer = attempt.answers.find((a) => a.topicId === topicId);
  const subjectId = answer?.subjectId ?? '';
  const parts = topicId.split('__').filter((p) => p.length > 0);
  const examSlug = attempt.examSlug;
  if (examSlug && parts.length >= 3 && subjectId) {
    const subjectSeg = parts[1];
    const topicSeg = parts.slice(2).join('__');
    return { to: `/jobs/${examSlug}/subjects/${subjectSeg}/${topicSeg}`, kind: 'topic-page' };
  }
  if (attempt.bundleId) {
    return { to: `/jobs/practice/${attempt.bundleId}`, kind: 'practice-bundle' };
  }
  return { to: '/jobs', kind: 'topic-page' };
}
