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
  attemptTrend,
  buildWrongAnswerList,
  perTopicAccuracy,
  type AttemptTrend,
  type JobAttemptSummary,
} from './jobAnalysis';
import { jobExamPattern, jobTopicLabelBn, type JobAttemptAnswer } from './jobEngine';
import { canonicalSubjectFor, jobSubjectsForExam } from './jobContent';
import type { RevisionItem } from './jobPlanner';
import type { NotebookEntry } from './jobWrongAnswers';

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

/** Day label in the selected language: "Today" / "Yesterday" / "19 Nov"
 * in English, "আজ" / "গতকাল" / "১৯ নভে" in Bangla. */
export function dayLabel(dayKey: string, nowMs: number, lang: 'bn' | 'en'): string {
  if (lang === 'bn') return dayLabelBn(dayKey, nowMs);
  const today = dhakaDayKey(nowMs);
  if (dayKey === today) return 'Today';
  const yesterdayMs = nowMs - 24 * 60 * 60 * 1000;
  if (dayKey === dhakaDayKey(yesterdayMs)) return 'Yesterday';
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
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
  labelEn: string;
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
    days.push({ dayKey: key, labelBn: dayLabelBn(key, nowMs), labelEn: dayLabel(key, nowMs, 'en'), sessions: s.sessions, questions: s.questions });
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

export const JOB_ACHIEVEMENTS: Record<string, { labelBn: string; ruleBn: string; labelEn: string; ruleEn: string }> = {
  'job_first-practice': {
    labelBn: 'প্রথম অনুশীলন শেষ',
    ruleBn: 'প্রথম অনুশীলন জমা দিলে',
    labelEn: 'First practice completed',
    ruleEn: 'When you submit your first practice',
  },
  'job_first-mock': {
    labelBn: 'প্রথম মক শেষ',
    ruleBn: 'প্রথম মক জমা দিলে',
    labelEn: 'First mock completed',
    ruleEn: 'When you submit your first mock',
  },
  'job_7-day-streak': {
    labelBn: '৭ দিনের ধারাবাহিকতা',
    ruleBn: 'টানা ৭ দিন অনুশীলন বা মক দিলে',
    labelEn: '7-day streak',
    ruleEn: 'When you practise or take a mock for 7 days in a row',
  },
};

export interface DashboardAchievement {
  key: string;
  labelBn: string;
  ruleBn: string;
  labelEn: string;
  ruleEn: string;
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
    out.push({ key: 'job_first-practice', ...JOB_ACHIEVEMENTS['job_first-practice'] });
  }
  if (hasMock) {
    out.push({ key: 'job_first-mock', ...JOB_ACHIEVEMENTS['job_first-mock'] });
  }
  if (streakDays >= 7) {
    out.push({ key: 'job_7-day-streak', ...JOB_ACHIEVEMENTS['job_7-day-streak'] });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Wrong-answer notebook (Step 13 — count + recent only)         */
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
 * questionId keeping the newest). The full notebook +
 * re-practice flow is Step 13 (/jobs/wrong-answers) — this
 * card only counts and links to result pages + the notebook. */
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

/* ------------------------------------------------------------------ */
/* Subject health (§5.2) — the subject-level roll-up of the           */
/* topic-level weak/strong analysis. Same thresholds as topics        */
/* (≥5 answered = 'early' 5–9 / 'signal' 10+, accuracy <50%),        */
/* PLUS the subject rule: a subject is never called weak from a      */
/* single topic's data — it needs ≥5 answered across ≥2 topics.      */
/* ------------------------------------------------------------------ */

/** Bangla label for a canonical subject, resolved from the
 * verified pattern subjects (one source — never a second label
 * table). Falls back to the raw subjectId. */
const SUBJECT_LABEL_CACHE = new Map<string, string>();
export function jobSubjectLabelBn(subjectId: string): string {
  const cached = SUBJECT_LABEL_CACHE.get(subjectId);
  if (cached) return cached;
  for (const examSlug of ['bcs', 'bank', 'primary-teacher', 'ntrca']) {
    for (const s of jobSubjectsForExam(examSlug)) {
      if (canonicalSubjectFor(`${examSlug}__${s.slug}`) === subjectId) {
        SUBJECT_LABEL_CACHE.set(subjectId, s.nameBn);
        return s.nameBn;
      }
    }
  }
  return subjectId;
}

export interface DashboardSubjectHealth {
  subjectId: string;
  label: string;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  accuracy: number;
  /** Distinct topics that contributed answers. */
  topics: number;
  /** 'early' 5–9 answered, 'signal' 10+, 'not-enough-data' <5. */
  sample: WeakTopicSample | 'not-enough-data';
  mastery: 'weak' | 'moderate' | 'strong';
  /** True only when the subject may be CALLED weak: accuracy
   * <50% AND ≥5 answered AND ≥2 topics. A single-topic subject
   * is never weak, however low its accuracy. */
  isWeak: boolean;
}

/** Subject-level health across ALL of the student's attempts:
 * the same per-topic stats grouped by `subjectId` (answers
 * already carry it). Sorted weakest first (accuracy asc, then
 * most wrong, then subjectId for determinism). */
export function subjectHealth(attempts: JobAttemptSummary[]): DashboardSubjectHealth[] {
  const map = new Map<string, { correct: number; wrong: number; unanswered: number; topics: Set<string> }>();
  for (const a of attempts) {
    for (const ans of a.answers) {
      const s = map.get(ans.subjectId) ?? { correct: 0, wrong: 0, unanswered: 0, topics: new Set<string>() };
      if (ans.selected === null) s.unanswered += 1;
      else if (ans.correct) s.correct += 1;
      else s.wrong += 1;
      s.topics.add(ans.topicId);
      map.set(ans.subjectId, s);
    }
  }
  return [...map.entries()]
    .map(([subjectId, s]) => {
      const total = s.correct + s.wrong + s.unanswered;
      const accuracy = total > 0 ? Math.round((s.correct / total) * 1000) / 10 : 0;
      const sample: DashboardSubjectHealth['sample'] =
        total < 5 ? 'not-enough-data' : total >= 10 ? 'signal' : 'early';
      const mastery: DashboardSubjectHealth['mastery'] =
        accuracy < 50 ? 'weak' : accuracy < 80 ? 'moderate' : 'strong';
      return {
        subjectId,
        label: jobSubjectLabelBn(subjectId),
        correct: s.correct,
        wrong: s.wrong,
        unanswered: s.unanswered,
        total,
        accuracy,
        topics: s.topics.size,
        sample,
        mastery,
        isWeak: accuracy < 50 && total >= 5 && s.topics.size >= 2,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong || (a.subjectId < b.subjectId ? -1 : 1));
}

/* ------------------------------------------------------------------ */
/* Live Exam performance report (§5.6) — per exam, across full       */
/* mocks only. Cross-exam combined scores are FORBIDDEN (the        */
/* header rule): every number here is one exam's full mocks. A       */
/* partial mock (§2.3) is flagged so a 100Q partial score is never   */
/* silently compared with a 200Q full score.                         */
/* ------------------------------------------------------------------ */

export interface LiveExamReportSubject {
  subjectId: string;
  label: string;
  questions: number;
  correct: number;
  accuracy: number | null;
}

export interface LiveExamReport {
  examSlug: string;
  /** Full mocks of this exam in the loaded window. */
  attempts: number;
  /** True when the loader hit its 20-attempt cap (the page says so). */
  capped: boolean;
  bestScore: number | null;
  bestTotalMarks: number | null;
  bestPercentage: number | null;
  latestScore: number | null;
  latestTotalMarks: number | null;
  latestPercentage: number | null;
  trend: AttemptTrend;
  perSubject: LiveExamReportSubject[];
  weakestSubject: { subjectId: string; label: string; accuracy: number; total: number } | null;
  /** Practice pass mark, ONLY where the pattern defines one. */
  passPercent: number | null;
  /** Full-exam question total (the verified pattern). */
  fullTotal: number | null;
  /** Attempts whose totalMarks is below the full total (partial mocks). */
  partialAttempts: number;
}

/** Per-exam Live Exam report over STORED attempts (never
 * recomputed from a republished bundle). `attempts` must already
 * be the student's mock attempts (the data module loads them
 * bounded); the exam filter + the full-mock filter live here. */
export function liveExamReport(
  attempts: JobAttemptSummary[],
  examSlug: string,
): LiveExamReport {
  const hubSlug =
    examSlug === 'bank-senior-officer' || examSlug === 'bank-assistant-director' ? 'bank' : examSlug;
  const prefix = `full__${hubSlug}__`;
  const full = attempts
    .filter((a) => a.kind === 'mock' && a.examSlug === hubSlug && a.mockId !== null && a.mockId.startsWith(prefix))
    .sort((a, b) => (b.submittedAtMillis ?? 0) - (a.submittedAtMillis ?? 0));
  const pattern = jobExamPattern(examSlug) ?? jobExamPattern(hubSlug);
  const fullTotal = pattern?.questionCount ?? null;
  const partialAttempts = fullTotal === null ? 0 : full.filter((a) => a.totalMarks < fullTotal).length;
  const trend = attemptTrend(full, 'মক', 'bn');
  const best = full.length > 0 ? full.reduce((b, a) => (a.percentage > b.percentage ? a : b), full[0]) : null;
  const latest = full[0] ?? null;
  const subjectMap = new Map<string, { questions: number; correct: number; topics: Set<string> }>();
  for (const a of full) {
    for (const ans of a.answers) {
      const s = subjectMap.get(ans.subjectId) ?? { questions: 0, correct: 0, topics: new Set<string>() };
      s.questions += 1;
      if (ans.correct) s.correct += 1;
      s.topics.add(ans.topicId);
      subjectMap.set(ans.subjectId, s);
    }
  }
  const perSubject: LiveExamReportSubject[] = [...subjectMap.entries()]
    .map(([subjectId, s]) => ({
      subjectId,
      label: jobSubjectLabelBn(subjectId),
      questions: s.questions,
      correct: s.correct,
      accuracy: accuracyOrNull(s.correct, s.questions),
    }))
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || (a.subjectId < b.subjectId ? -1 : 1));
  const weakest = perSubject.find(
    (s) => s.accuracy !== null && s.accuracy < 50 && s.questions >= 5
      && (subjectMap.get(s.subjectId)?.topics.size ?? 0) >= 2,
  ) ?? null;
  return {
    examSlug: hubSlug,
    attempts: full.length,
    capped: full.length >= 20,
    bestScore: best?.score ?? null,
    bestTotalMarks: best?.totalMarks ?? null,
    bestPercentage: best ? Math.max(0, best.percentage) : null,
    latestScore: latest?.score ?? null,
    latestTotalMarks: latest?.totalMarks ?? null,
    latestPercentage: latest ? Math.max(0, latest.percentage) : null,
    trend,
    perSubject,
    weakestSubject: weakest
      ? { subjectId: weakest.subjectId, label: weakest.label, accuracy: weakest.accuracy ?? 0, total: weakest.questions }
      : null,
    passPercent: pattern?.passPercent ?? null,
    fullTotal,
    partialAttempts,
  };
}

/* ------------------------------------------------------------------ */
/* Re-practice + auto-arranged practice (§5.4)                         */
/* ------------------------------------------------------------------ */

/** Revision cap, mirroring `MAX_REVISION_PER_DAY` in
 * `jobPlanner.ts` (kept as a local const to avoid a runtime
 * import cycle — jobPlanner imports this module; the test
 * asserts the two stay equal). */
export const ARRANGE_MAX_REVISION_PER_DAY = 2;

export interface RePracticePick {
  topicId: string;
  label: string;
  /** Active notebook entries on this topic. */
  activeCount: number;
  oldestWrongAtMillis: number | null;
  /** The oldest entry is older than 7 days — a stale mistake
   * outranks a fresh revision (§5.4 step 2). */
  stale7Days: boolean;
}

/** The next re-practice target: the OLDEST active notebook
 * entry's topic (2-consecutive-correct removal already applied
 * by `deriveNotebook`). Null when nothing is active. */
export function pickRePractice(args: {
  notebook: NotebookEntry[];
  nowMs: number;
}): RePracticePick | null {
  const active = args.notebook.filter((e) => e.status === 'active');
  if (active.length === 0) return null;
  const sorted = [...active].sort(
    (a, b) => (a.lastWrongAtMillis ?? 0) - (b.lastWrongAtMillis ?? 0) || (a.questionId < b.questionId ? -1 : 1),
  );
  const oldest = sorted[0];
  const topicEntries = active.filter((e) => e.topicId === oldest.topicId);
  const oldestMillis = Math.min(...topicEntries.map((e) => e.lastWrongAtMillis ?? args.nowMs));
  return {
    topicId: oldest.topicId,
    label: jobTopicLabelBn(oldest.topicId),
    activeCount: topicEntries.length,
    oldestWrongAtMillis: oldestMillis,
    stale7Days: oldestMillis < args.nowMs - 7 * 24 * 60 * 60 * 1000,
  };
}

export type NextPracticeKind = 'revision' | 'wrong-answers' | 'weak-topic' | 'new-topic' | 'daily-mock' | 'live-exam';

export interface NextPracticeItem {
  kind: NextPracticeKind;
  titleBn: string;
  titleEn: string;
  detailBn: string | null;
  detailEn: string | null;
  /** Link, or null when the item shows WITHOUT a link (a
   * revision without a published set, or an info-only card). */
  to: string | null;
  ctaBn: string | null;
  ctaEn: string | null;
}

/**
 * Auto-arranged practice (§5.4) — the ordered queue that picks
 * what to practise next. Priority order, each step taking what
 * it needs and the rest falling through:
 *   1. due revision, weakest first (max 2/day);
 *   2. wrong-answer re-practice (when step 1 took <2, or the
 *      oldest mistake is >7 days old);
 *   3. weakest-topic practice;
 *   4. new-topic practice (only when 1–3 produced nothing);
 *   5. daily mock + Live Exam as dated cards (never as
 *      "practice this now" items);
 *   6. nothing eligible → [] (the page falls back honestly).
 * Tie-breaks (deterministic): target exam first, lower accuracy
 * first, older last-attempt first, topicId ascending last.
 * Sample-size rule throughout: <5 answered is "not enough
 * data" — such a topic appears in step 4 (new practice) but
 * NEVER in steps 1–3 as a "weak" topic.
 */
export function arrangeNextPractice(args: {
  revisionItems: RevisionItem[];
  notebook: NotebookEntry[];
  weakTopics: DashboardWeakTopic[];
  publishedByExam: Map<string, PublishedBundleRef[]>;
  targetExamSlug: string | null;
  attempts: JobAttemptSummary[];
  dailyMock: { docId: string } | null;
  liveExam: { examSlug: string } | null;
  nowMs: number;
}): NextPracticeItem[] {
  const { revisionItems, notebook, weakTopics, publishedByExam, targetExamSlug, attempts, dailyMock, liveExam, nowMs } = args;
  const items: NextPracticeItem[] = [];

  // 1. Due revision, weakest first (today + weak mastery only).
  const dueWeak = revisionItems
    .filter((r) => r.dueBucket === 'today' && r.mastery === 'weak')
    .sort((a, b) => {
      const aTarget = targetExamSlug !== null && a.examSlugs.includes(targetExamSlug) ? 0 : 1;
      const bTarget = targetExamSlug !== null && b.examSlugs.includes(targetExamSlug) ? 0 : 1;
      if (aTarget !== bTarget) return aTarget - bTarget;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      if (a.nextRevisionDay !== b.nextRevisionDay) return a.nextRevisionDay < b.nextRevisionDay ? -1 : 1;
      return a.topicId < b.topicId ? -1 : 1;
    })
    .slice(0, ARRANGE_MAX_REVISION_PER_DAY);
  for (const r of dueWeak) {
    items.push({
      kind: 'revision',
      titleBn: `পুনরালোচনা — ${r.label}`,
      titleEn: `Revision — ${r.labelEn}`,
      detailBn: `সঠিক উত্তরের হার ${r.accuracy}% (${r.total}টি প্রশ্ন) — আজ পুনরালোচনার দিন।`,
      detailEn: `Accuracy ${r.accuracy}% (${r.total} questions) — due for revision today.`,
      to: r.bundleDocId ? `/jobs/practice/${r.bundleDocId}` : null,
      ctaBn: r.bundleDocId ? 'পুনরালোচনা শুরু করুন →' : null,
      ctaEn: r.bundleDocId ? 'Start revising →' : null,
    });
  }

  // 2. Wrong-answer re-practice.
  const rePractice = pickRePractice({ notebook, nowMs });
  if (rePractice && (dueWeak.length < ARRANGE_MAX_REVISION_PER_DAY || rePractice.stale7Days)) {
    items.push({
      kind: 'wrong-answers',
      titleBn: `ভুল-উত্তর পুনরাভ্যাস — ${rePractice.label}`,
      titleEn: `Wrong-answer re-practice — ${rePractice.label}`,
      detailBn: `${rePractice.activeCount}টি ভুল প্রশ্ন এখনো সক্রিয় — সবচেয়ে পুরোনো ভুল ${rePractice.stale7Days ? '৭ দিনের বেশি পুরোনো' : 'সাম্প্রতিক'}।`,
      detailEn: `${rePractice.activeCount} wrong question(s) still active.`,
      to: '/jobs/wrong-answers',
      ctaBn: 'নোটবুক দেখুন →',
      ctaEn: 'See the notebook →',
    });
  }

  // 3. Weakest-topic practice (pickRecommendation as today).
  const recommendation = pickRecommendation({ weakTopics, publishedByExam, targetExamSlug });
  if (recommendation) {
    items.push({
      kind: 'weak-topic',
      titleBn: `দুর্বল টপিক — ${recommendation.topicLabel}`,
      titleEn: `Weakest topic — ${recommendation.topicLabel}`,
      detailBn: `সঠিক উত্তরের হার ${recommendation.topicAccuracy}% (${recommendation.topicTotal}টি প্রশ্ন${recommendation.sample === 'signal' ? ', ১০+ প্রশ্নের ভিত্তিতে' : ', প্রাথমিক ইঙ্গিত'})।`,
      detailEn: `Accuracy ${recommendation.topicAccuracy}% (${recommendation.topicTotal} questions).`,
      to: `/jobs/practice/${recommendation.bundleDocId}`,
      ctaBn: 'অনুশীলন শুরু করুন →',
      ctaEn: 'Start practising →',
    });
  }

  // 4. New-topic practice — only when 1–3 produced nothing.
  if (items.length === 0 && targetExamSlug !== null) {
    const attemptedTopics = new Set<string>();
    for (const a of attempts) for (const ans of a.answers) attemptedTopics.add(ans.topicId);
    const fresh = (publishedByExam.get(targetExamSlug) ?? [])
      .filter((b) => b.topicId !== null && b.questionCount > 0 && !attemptedTopics.has(b.topicId))
      .sort((a, b) => (a.topicId ?? '') < (b.topicId ?? '') ? -1 : 1);
    const first = fresh[0];
    if (first) {
      items.push({
        kind: 'new-topic',
        titleBn: `নতুন টপিক — ${first.titleBn ?? jobTopicLabelBn(first.topicId ?? '')}`,
        titleEn: `New topic — ${first.titleBn ?? first.topicId ?? ''}`,
        detailBn: 'এই টপিকটি এখনো অনুশীলন করা হয়নি।',
        detailEn: 'This topic has not been practised yet.',
        to: `/jobs/practice/${first.docId}`,
        ctaBn: 'অনুশীলন শুরু করুন →',
        ctaEn: 'Start practising →',
      });
    }
  }

  // 5. Daily mock + Live Exam as dated cards (never auto-assigned
  // as daily practice — a Live Exam is a dated event, not a drill).
  if (dailyMock) {
    items.push({
      kind: 'daily-mock',
      titleBn: 'আজকের দৈনিক মক',
      titleEn: "Today's daily mock",
      detailBn: 'আজকের মক — দৈনিক মক কার্ড থেকে শুরু করুন।',
      detailEn: "Today's mock — start from the daily mock card.",
      to: `/jobs/mock/${dailyMock.docId}`,
      ctaBn: 'আজকের মক দেখুন →',
      ctaEn: "See today's mock →",
    });
  }
  if (liveExam) {
    items.push({
      kind: 'live-exam',
      titleBn: 'লাইভ পরীক্ষা',
      titleEn: 'Live Exam',
      detailBn: 'লক্ষ্য পরীক্ষার লাইভ পরীক্ষার পাতা দেখুন — পূর্ণাঙ্গ/আংশিক মক ও ভ্যারিয়েন্ট এখানে।',
      detailEn: 'See the target exam’s Live Exam page — full/partial mocks and variants are there.',
      to: `/jobs/live-exam/${liveExam.examSlug}`,
      ctaBn: 'লাইভ পরীক্ষা দেখুন →',
      ctaEn: 'See the Live Exam →',
    });
  }
  return items;
}
