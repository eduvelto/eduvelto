// Eduvelto — Job Preparation dashboard (Step 11).
//
// PURE helpers over STORED attempt summaries (JobAttemptSummary,
// Step 10). Nothing here touches Firestore, re-reads an answer
// key, or writes — the page's data module (jobDashboardData.ts)
// loads, this file computes. Every number comes from the
// student's OWN attempts only: no percentiles, no ranks, no
// peer comparison, no "readiness %", no pass probability, no
// combined-across-exams score.
//
// HONESTY (Steps 7–10, binding):
//  - accuracyOrNull() returns null — never 0% — when nothing was
//    answered (ChatGPT: zero accuracy ≠ no attempts).
//  - A topic is NEVER called weak from a tiny sample: fewer than
//    5 answered questions is "not enough data" and is not shown
//    as weak at all; 5–9 is only an "early indication"; only 10+
//    answered is a weakness signal (ChatGPT thresholds, stricter
//    than the design doc's 3+ rule — one wrong answer must never
//    label a topic weak; both AIs + the design agree in spirit).
//  - Per-exam progress is separate metrics, never one combined %
//    (ChatGPT): questions attempted, correct, topics practiced,
//    practice sets completed of the sets that actually exist, last
//    activity. Without a defensible completion formula it is
//    called "Practice activity", never "exam preparation %".
//  - Time is NOT summed into "study minutes" here: the engine
//    used to record per-question time from wall-clock flushes
//    with no inactivity pause (JobPracticePage/JobMockPage
//    flushTime), so stored timeSpentSeconds includes idle-tab
//    time. The page shows completed sessions + questions
//    instead of invented time (ChatGPT fallback). Step 12
//    fixed the recording going forward (src/lib/
//    activeStudyTime.ts — visibility + 90s idle pause); the
//    historical values are untouched, so the page keeps
//    showing sessions + questions, never minutes.
//  - A streak is computed from real attempt dates only, shown
//    only when it is at least 2 days, and only for the student's
//    own viewing — never a competition, never invented.
//
// GEMINI + CHATGPT FOLD-IN (Step 11, see
// team/job-step11-dashboard-2026-11-22.md): the recommendation
// picks the weakest topic first, then verifies a PUBLISHED
// practice set exists for that exact topic before any link is
// rendered; the dashboard never constructs a practice link from
// a topicId alone.

import {
  buildWrongAnswerList,
  perTopicAccuracy,
  type JobAttemptSummary,
} from './jobAnalysis';
import { jobTopicLabelBn, type JobAttemptAnswer } from './jobEngine';

/** Accuracy as a percentage (1 decimal), or null when nothing
 * was answered — null is not 0%. */
export function accuracyOrNull(correct: number, answered: number): number | null {
  if (answered <= 0) return null;
  return Math.round((correct / answered) * 1000) / 10;
}

/** A calendar day in Asia/Dhaka as YYYY-MM-DD. */
export function dhakaDayKey(millis: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(millis));
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Short Bangla label for a day key: "আজ", "গতকাল", or the date
 * in Bangla digits (e.g. "১৯ নভে"). */
export function dayLabelBn(dayKey: string, nowMs: number): string {
  const today = dhakaDayKey(nowMs);
  if (dayKey === today) return 'আজ';
  const yesterdayMs = nowMs - 24 * 60 * 60 * 1000;
  if (dayKey === dhakaDayKey(yesterdayMs)) return 'গতকাল';
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Consecutive days with at least one attempt, counting back
 * from today — or from yesterday when today has none yet (the
 * streak is still alive through yesterday). 0 when the student
 * has no attempt on either day. */
export function computeStreakDays(attempts: JobAttemptSummary[], nowMs: number): number {
  const days = new Set<string>();
  for (const a of attempts) {
    if (a.submittedAtMillis !== null) days.add(dhakaDayKey(a.submittedAtMillis));
  }
  if (days.size === 0) return 0;
  let cursor = new Date(dhakaDayKey(nowMs) + 'T00:00:00Z').getTime();
  // Start from today; if today is empty, start from yesterday.
  if (!days.has(dhakaDayKey(nowMs))) cursor -= 24 * 60 * 60 * 1000;
  let streak = 0;
  for (;;) {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date(cursor));
    if (!days.has(key)) break;
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }
  return streak;
}

export interface TodayStats {
  sessionsToday: number;
  questionsToday: number;
}

/** Today's activity: attempts submitted today (Dhaka) + the
 * questions they contain (answered + unanswered — every
 * question the student faced). */
export function todayStats(attempts: JobAttemptSummary[], nowMs: number): TodayStats {
  const today = dhakaDayKey(nowMs);
  let sessionsToday = 0;
  let questionsToday = 0;
  for (const a of attempts) {
    if (a.submittedAtMillis !== null && dhakaDayKey(a.submittedAtMillis) === today) {
      sessionsToday += 1;
      questionsToday += a.answers.length;
    }
  }
  return { sessionsToday, questionsToday };
}

export interface DayActivity {
  dayKey: string;
  labelBn: string;
  sessions: number;
  questions: number;
}

export interface WeekActivity {
  days: DayActivity[];
  totalSessions: number;
  totalQuestions: number;
}

/** Last 7 Dhaka days, newest first: sessions + questions per
 * day. Days with no activity still appear (sessions 0) so the
 * week reads honestly. */
export function weekActivity(attempts: JobAttemptSummary[], nowMs: number): WeekActivity {
  const byDay = new Map<string, { sessions: number; questions: number }>();
  for (const a of attempts) {
    if (a.submittedAtMillis === null) continue;
    const key = dhakaDayKey(a.submittedAtMillis);
    const s = byDay.get(key) ?? { sessions: 0, questions: 0 };
    s.sessions += 1;
    s.questions += a.answers.length;
    byDay.set(key, s);
  }
  const days: DayActivity[] = [];
  let totalSessions = 0;
  let totalQuestions = 0;
  for (let i = 0; i < 7; i += 1) {
    const key = dhakaDayKey(nowMs - i * 24 * 60 * 60 * 1000);
    const s = byDay.get(key) ?? { sessions: 0, questions: 0 };
    days.push({ dayKey: key, labelBn: dayLabelBn(key, nowMs), sessions: s.sessions, questions: s.questions });
    totalSessions += s.sessions;
    totalQuestions += s.questions;
  }
  return { days, totalSessions, totalQuestions };
}

/** A published practice bundle, reduced to what the dashboard
 * needs to guard a link (Gemini: published === true and
 * questionCount > 0 — the loader already filters to published,
 * this is the shape the page passes in). */
export interface PublishedBundleRef {
  docId: string;
  topicId: string | null;
  questionCount: number;
  /** Bundle title (Step 12: the planner's new-practice items
   * show it; absent in older callers — the topic label is the
   * fallback). */
  titleBn?: string;
}

export interface ExamProgress {
  examSlug: string;
  attempts: number;
  mocks: number;
  practices: number;
  questions: number;
  correct: number;
  /** correct ÷ answered, null when nothing was answered. */
  accuracy: number | null;
  /** Distinct topicIds touched by this exam's attempts. */
  topicsPracticed: string[];
  /** Distinct attempted bundleIds that are still published. */
  setsCompleted: number;
  /** Published sets that exist for this exam right now. */
  setsAvailable: number;
  lastActivityMillis: number | null;
}

/** Per-exam progress, one exam at a time — never mixed, never
 * one combined % (ChatGPT). "Sets completed" counts only
 * attempted bundles that are STILL published; a bundle that
 * was later unpublished does not count. Sorted by last
 * activity, newest first. */
export function perExamProgress(
  attempts: JobAttemptSummary[],
  publishedByExam: Map<string, PublishedBundleRef[]>,
): ExamProgress[] {
  const map = new Map<
    string,
    {
      attempts: number;
      mocks: number;
      practices: number;
      questions: number;
      correct: number;
      topics: Set<string>;
      bundles: Set<string>;
      last: number | null;
    }
  >();
  for (const a of attempts) {
    if (!a.examSlug) continue;
    const s = map.get(a.examSlug) ?? {
      attempts: 0,
      mocks: 0,
      practices: 0,
      questions: 0,
      correct: 0,
      topics: new Set<string>(),
      bundles: new Set<string>(),
      last: null,
    };
    s.attempts += 1;
    if (a.kind === 'mock') s.mocks += 1;
    else s.practices += 1;
    s.questions += a.answers.length;
    s.correct += a.correctCount;
    for (const ans of a.answers) s.topics.add(ans.topicId);
    if (a.bundleId) s.bundles.add(a.bundleId);
    if (a.submittedAtMillis !== null && (s.last === null || a.submittedAtMillis > s.last)) {
      s.last = a.submittedAtMillis;
    }
    map.set(a.examSlug, s);
  }
  return [...map.entries()]
    .map(([examSlug, s]) => {
      const published = publishedByExam.get(examSlug) ?? [];
      const publishedIds = new Set(published.map((b) => b.docId));
      const setsCompleted = [...s.bundles].filter((id) => publishedIds.has(id)).length;
      return {
        examSlug,
        attempts: s.attempts,
        mocks: s.mocks,
        practices: s.practices,
        questions: s.questions,
        correct: s.correct,
        accuracy: accuracyOrNull(s.correct, s.questions),
        topicsPracticed: [...s.topics].sort(),
        setsCompleted,
        setsAvailable: published.length,
        lastActivityMillis: s.last,
      };
    })
    .sort((a, b) => (b.lastActivityMillis ?? 0) - (a.lastActivityMillis ?? 0));
}

/** The newest N attempts (the loader already returns newest
 * first — this is only the cap). */
export function recentAttempts(attempts: JobAttemptSummary[], n = 5): JobAttemptSummary[] {
  return attempts.slice(0, n);
}

/** Sample-size label for a weak topic (ChatGPT thresholds):
 *  - 'early': 5–9 answered, accuracy below 50% — an early
 *    indication only, not a verdict.
 *  - 'signal': 10+ answered, accuracy below 50% — eligible as
 *    a weakness signal.
 * Topics with fewer than 5 answered are never returned here. */
export type WeakTopicSample = 'early' | 'signal';

export interface DashboardWeakTopic {
  topicId: string;
  label: string;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
  sample: WeakTopicSample;
  /** Exams whose attempts touched this topic. */
  examSlugs: string[];
  /** Newest attempt touching this topic (for the
   * "prefer not recently completed" ordering). */
  lastAttemptMillis: number | null;
}

/** Weak topics across ALL of the student's attempts: only
 * topics with at least 5 answered questions and accuracy
 * below 50%. Sorted weakest first (accuracy asc, then most
 * wrong). A topic with no practice is never weak. */
export function dashboardWeakTopics(attempts: JobAttemptSummary[]): DashboardWeakTopic[] {
  const allAnswers: JobAttemptAnswer[] = attempts.flatMap((a) => a.answers);
  const stats = perTopicAccuracy(allAnswers);
  const lastByTopic = new Map<string, number | null>();
  const examsByTopic = new Map<string, Set<string>>();
  for (const a of attempts) {
    for (const ans of a.answers) {
      const prev = lastByTopic.get(ans.topicId);
      if (a.submittedAtMillis !== null && (prev === undefined || prev === null || a.submittedAtMillis > prev)) {
        lastByTopic.set(ans.topicId, a.submittedAtMillis);
      }
      const set = examsByTopic.get(ans.topicId) ?? new Set<string>();
      if (a.examSlug) set.add(a.examSlug);
      examsByTopic.set(ans.topicId, set);
    }
  }
  return stats
    .filter((s) => s.total >= 5 && s.accuracy < 50)
    .map((s) => ({
      topicId: s.topicId,
      label: s.label,
      correct: s.correct,
      wrong: s.wrong,
      total: s.total,
      accuracy: s.accuracy,
      sample: (s.total >= 10 ? 'signal' : 'early') as WeakTopicSample,
      examSlugs: [...(examsByTopic.get(s.topicId) ?? new Set<string>())].sort(),
      lastAttemptMillis: lastByTopic.get(s.topicId) ?? null,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong);
}

export interface DashboardRecommendation {
  bundleDocId: string;
  topicId: string;
  topicLabel: string;
  examSlug: string;
  /** 'signal' (10+ answered) or 'early' (5–9 answered). */
  sample: WeakTopicSample;
  topicAccuracy: number;
  topicTotal: number;
}

/** Pick the next practice set (Gemini #1 + ChatGPT #7 priority
 * rules): weakest topics first, the student's selected exam
 * first, not-recently-attempted topics preferred — and only a
 * topic whose PUBLISHED bundle (questionCount > 0) actually
 * exists is ever recommended. Returns null when nothing is
 * eligible: the page then falls back honestly (today's daily
 * mock, or the start card) instead of inventing a
 * recommendation. */
export function pickRecommendation(args: {
  weakTopics: DashboardWeakTopic[];
  publishedByExam: Map<string, PublishedBundleRef[]>;
  targetExamSlug: string | null;
}): DashboardRecommendation | null {
  const { weakTopics, publishedByExam, targetExamSlug } = args;
  const ordered = [...weakTopics].sort((a, b) => {
    const aTarget = targetExamSlug !== null && a.examSlugs.includes(targetExamSlug) ? 0 : 1;
    const bTarget = targetExamSlug !== null && b.examSlugs.includes(targetExamSlug) ? 0 : 1;
    if (aTarget !== bTarget) return aTarget - bTarget;
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return (a.lastAttemptMillis ?? 0) - (b.lastAttemptMillis ?? 0);
  });
  for (const topic of ordered) {
    for (const examSlug of topic.examSlugs) {
      const bundles = publishedByExam.get(examSlug) ?? [];
      const bundle = bundles.find((b) => b.topicId === topic.topicId && b.questionCount > 0);
      if (bundle) {
        return {
          bundleDocId: bundle.docId,
          topicId: topic.topicId,
          topicLabel: topic.label,
          examSlug,
          sample: topic.sample,
          topicAccuracy: topic.accuracy,
          topicTotal: topic.total,
        };
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Achievements — the EXISTING collections (architecture §2.23):      */
/* definitions in `achievements/{key}` (Admin-written, not read      */
/* here — no job_* definition docs exist yet) and the student's own   */
/* earned docs in `users/{uid}/userAchievements/{key}` (owner       */
/* create, never update/delete — the rules already allow this, no    */
/* new rule is needed). Only real work earns one; the rule is shown  */
/* on the card, and "a subject completed" is NOT awarded — no       */
/* topic-completion data exists to judge it by.                       */
/* ------------------------------------------------------------------ */

export const JOB_ACHIEVEMENT_BN: Record<string, { labelBn: string; ruleBn: string }> = {
  'job_first-practice': {
    labelBn: 'প্রথম অনুশীলন শেষ',
    ruleBn: 'প্রথম অনুশীলন জমা দিলে',
  },
  'job_first-mock': {
    labelBn: 'প্রথম মক শেষ',
    ruleBn: 'প্রথম মক জমা দিলে',
  },
  'job_7-day-streak': {
    labelBn: '৭ দিনের ধারাবাহিকতা',
    ruleBn: 'টানা ৭ দিন অনুশীলন বা মক দিলে',
  },
};

export interface DashboardAchievement {
  key: string;
  labelBn: string;
  ruleBn: string;
}

/** Achievements earned from the student's own attempts. Pure
 * derivation — the data module persists the missing ones. */
export function dashboardAchievements(
  attempts: JobAttemptSummary[],
  streakDays: number,
): DashboardAchievement[] {
  const out: DashboardAchievement[] = [];
  const hasPractice = attempts.some((a) => a.kind === 'practice');
  const hasMock = attempts.some((a) => a.kind === 'mock');
  if (hasPractice) {
    out.push({ key: 'job_first-practice', ...JOB_ACHIEVEMENT_BN['job_first-practice'] });
  }
  if (hasMock) {
    out.push({ key: 'job_first-mock', ...JOB_ACHIEVEMENT_BN['job_first-mock'] });
  }
  if (streakDays >= 7) {
    out.push({ key: 'job_7-day-streak', ...JOB_ACHIEVEMENT_BN['job_7-day-streak'] });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Wrong-answer notebook (Step 13 preview — count + recent only)      */
/* ------------------------------------------------------------------ */

export interface WrongAnswerSummary {
  /** Distinct questionIds the student got wrong or skipped. */
  distinctWrongQuestions: number;
  /** Most recent 3, newest attempt first, each linking to its
   * own attempt's result page (a real page that exists). */
  recent: Array<{
    questionId: string;
    topicId: string;
    label: string;
    status: 'wrong' | 'unanswered';
    attemptDocId: string;
    examSlug: string;
    kind: 'practice' | 'mock';
  }>;
}

/** Wrong + unanswered questions across the loaded attempts
 * (Step 10's buildWrongAnswerList, newest first, deduped by
 * questionId keeping the newest). The full re-practice flow is
 * Step 13 — this card only counts and links to result pages. */
export function wrongAnswerSummary(attempts: JobAttemptSummary[]): WrongAnswerSummary {
  const seen = new Set<string>();
  const recent: WrongAnswerSummary['recent'] = [];
  for (const a of attempts) {
    for (const entry of buildWrongAnswerList(a)) {
      if (seen.has(entry.questionId)) continue;
      seen.add(entry.questionId);
      if (recent.length < 3) {
        recent.push({
          questionId: entry.questionId,
          topicId: entry.topicId,
          label: jobTopicLabelBn(entry.topicId),
          status: entry.status,
          attemptDocId: a.docId,
          examSlug: a.examSlug,
          kind: a.kind,
        });
      }
    }
  }
  return { distinctWrongQuestions: seen.size, recent };
}
