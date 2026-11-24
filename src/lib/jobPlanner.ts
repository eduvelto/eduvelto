// Eduvelto — Job Preparation planner (Step 12).
//
// PURE helpers over STORED attempt summaries (JobAttemptSummary,
// Step 10) + the published catalog (PublishedBundleRef, Step 11).
// Nothing here touches Firestore, writes, or re-reads an answer
// key — the page's data module (jobPlannerData.ts) loads, this
// file computes. Every number comes from the student's OWN
// attempts and the REAL published catalog: no invented numbers,
// no readiness % / pass probability / peer comparison / ranks,
// no "verified" claims, no exam countdown (no real exam date
// exists yet — Step 14, circulars), no fake streaks.
//
// THE PLANNER IS ADVISORY (design §2.8, §3.9; roadmap §3.3
// #15): it suggests what to do next, never a mandatory
// timetable. A skipped day is never punished — overdue items
// slide forward, never pile up, never read "Failed".
//
// REVISION INTERVALS (reconciled from BOTH Step 12
// consultations — Gemini + ChatGPT — see
// team/job-step12-planner-2026-11-23.md):
//   weak <50% (≥5 answered)      → 1 day   (both AIs agree)
//   moderate 50–80% (≥5)         → 4 days  (Gemini 4–7d, ChatGPT 3d)
//   strong 80%+ (≥5)             → 14 days (both agree)
//   retained 80%+ (≥10, ≥2 days) → 30 days (ChatGPT; sustained)
// The mastery bands reuse the Step 11 weak rule (<50%, ≥5
// answered; 5–9 early, 10+ signal) so a topic is never "weak"
// on the dashboard and "moderate" here. Topics with fewer than
// 5 answered are "not enough data" — they are NEVER scheduled
// as revision (ChatGPT: one wrong answer can be a careless
// mistake); unattempted topics belong in Available/Upcoming
// (new practice), never in an overdue backlog (Gemini).
// Incorrect-QUESTION revision (same/next day, ChatGPT) is the
// Step 13 wrong-answer notebook, not this topic-level queue —
// its data hook (buildWrongAnswerList) already exists.
//
// SLIDING CATCH-UP (both AIs): an item due on a day with no
// free revision slot slides to the next day with capacity (max
// 2 revision items per day — Gemini). Overdue items land on
// "today", never marked failed, never all piled onto Monday.
// A missed day is shown neutrally ("গতকালের পরিকল্পনা শেষ
// হয়নি — বাকি আইটেমগুলো আজকের তালিকায় চলে এসেছে"), never
// with red warnings or "You missed your goal!" copy.
//
// DAILY GOALS are TASK-based, not time-based (ChatGPT):
// "complete one practice set / revise the tense topic", never
// "study English for 2 hours". The goal itself lives on the
// profile (dailyGoalQuestions / dailyGoalMinutes, Step 3) and
// is edited on /profile — the planner never auto-changes it.
// When recent behaviour diverges from the goal, the planner
// shows ONE neutral suggestion line (goalSuggestion); the
// student decides. A minutes-only goal cannot be measured in
// minutes yet — the page shows sessions instead (Step 11
// honesty, unchanged: the engine fix improves future
// recordings, it does not rewrite history).
//
// WEEKLY PLAN: 7 Dhaka days (today + 6). Each day: revision
// items due that day (sliding, max 2), ONE new-practice item
// (the next never-attempted published bundle for the target
// exam, catalog order, cycling — a topic the student has never
// touched is "upcoming", never "overdue"), and the daily-mock
// row (today's live mock when published, else the honest
// not-yet state; future days point at /jobs/common where that
// day's mock will appear — no promise it will exist). Done
// marks come from real attempts that day; future days carry no
// mark. No hour-by-hour timetable (both AIs: hourly schedules
// fail on mobile in days) — sessions/topics, not minute blocks.

import { perTopicAccuracy, type JobAttemptSummary } from './jobAnalysis';
import {
  accuracyOrNull,
  dayLabel,
  dayLabelBn,
  dhakaDayKey,
  weekActivity,
  type PublishedBundleRef,
} from './jobDashboard';
import { jobTopicLabel, jobTopicLabelBn } from './jobEngine';

const DAY_MS = 24 * 60 * 60 * 1000;
/** At most this many revision items the plan asks of one day. */
export const MAX_REVISION_PER_DAY = 2;

export type TopicMastery = 'weak' | 'moderate' | 'strong' | 'retained' | 'not-enough-data';

/** Revision interval in days per mastery band (reconciled —
 * see the header). Null when no revision is scheduled. */
export function revisionIntervalDays(mastery: TopicMastery): number | null {
  switch (mastery) {
    case 'weak':
      return 1;
    case 'moderate':
      return 4;
    case 'strong':
      return 14;
    case 'retained':
      return 30;
    case 'not-enough-data':
      return null;
  }
}

export interface PlannerTopicHealth {
  topicId: string;
  label: string;
  labelEn: string;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
  mastery: TopicMastery;
  /** Exams whose attempts touched this topic. */
  examSlugs: string[];
  /** Newest attempt touching this topic, or null. */
  lastAttemptMillis: number | null;
  /** Distinct Dhaka days with an attempt on this topic. */
  distinctDays: number;
  /** Days from the last attempt to the next revision. */
  reviseInDays: number | null;
  /** Dhaka day key of the next revision, or null. */
  nextRevisionDay: string | null;
}

/** Per-topic health from the student's own attempts. Mastery
 * uses the Step 11 weak rule so the dashboard and the planner
 * never disagree about a topic. */
export function topicHealth(attempts: JobAttemptSummary[], nowMs: number): PlannerTopicHealth[] {
  const stats = perTopicAccuracy(attempts.flatMap((a) => a.answers));
  const lastByTopic = new Map<string, number | null>();
  const daysByTopic = new Map<string, Set<string>>();
  const examsByTopic = new Map<string, Set<string>>();
  for (const a of attempts) {
    for (const ans of a.answers) {
      const prev = lastByTopic.get(ans.topicId);
      if (a.submittedAtMillis !== null && (prev === undefined || prev === null || a.submittedAtMillis > prev)) {
        lastByTopic.set(ans.topicId, a.submittedAtMillis);
      }
      const days = daysByTopic.get(ans.topicId) ?? new Set<string>();
      if (a.submittedAtMillis !== null) days.add(dhakaDayKey(a.submittedAtMillis));
      daysByTopic.set(ans.topicId, days);
      const set = examsByTopic.get(ans.topicId) ?? new Set<string>();
      if (a.examSlug) set.add(a.examSlug);
      examsByTopic.set(ans.topicId, set);
    }
  }
  return stats
    .map((s) => {
      const distinctDays = daysByTopic.get(s.topicId)?.size ?? 0;
      let mastery: TopicMastery;
      if (s.total < 5) mastery = 'not-enough-data';
      else if (s.accuracy < 50) mastery = 'weak';
      else if (s.accuracy < 80) mastery = 'moderate';
      else if (s.total >= 10 && distinctDays >= 2) mastery = 'retained';
      else mastery = 'strong';
      const reviseInDays = revisionIntervalDays(mastery);
      const last = lastByTopic.get(s.topicId) ?? null;
      const nextRevisionDay =
        reviseInDays === null ? null : dhakaDayKey((last ?? nowMs) + reviseInDays * DAY_MS);
      return {
        topicId: s.topicId,
        label: s.label,
        labelEn: s.labelEn,
        correct: s.correct,
        wrong: s.wrong,
        total: s.total,
        accuracy: s.accuracy,
        mastery,
        examSlugs: [...(examsByTopic.get(s.topicId) ?? new Set<string>())].sort(),
        lastAttemptMillis: last,
        distinctDays,
        reviseInDays,
        nextRevisionDay,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
}

export type DueBucket = 'today' | 'tomorrow' | 'this-week' | 'later';

export interface RevisionItem {
  topicId: string;
  label: string;
  labelEn: string;
  mastery: Exclude<TopicMastery, 'not-enough-data'>;
  accuracy: number;
  total: number;
  nextRevisionDay: string;
  dueBucket: DueBucket;
  examSlugs: string[];
  /** Published bundle for this exact topic, if one exists
   * (guard — a revision item without a published set shows
   * without a practice link, never a dead one). */
  bundleDocId: string | null;
  bundleExamSlug: string | null;
}

/** The revision queue: every topic with a scheduled revision,
 * weakest first. Overdue items (nextRevisionDay before today)
 * slide into 'today' — never "failed", never piled. The
 * bundle guard prefers the student's target exam. */
export function revisionQueue(args: {
  health: PlannerTopicHealth[];
  publishedByExam: Map<string, PublishedBundleRef[]>;
  targetExamSlug: string | null;
  nowMs: number;
}): RevisionItem[] {
  const { health, publishedByExam, targetExamSlug, nowMs } = args;
  const todayKey = dhakaDayKey(nowMs);
  const tomorrowKey = dhakaDayKey(nowMs + DAY_MS);
  const weekEndKey = dhakaDayKey(nowMs + 6 * DAY_MS);
  const masteryRank: Record<string, number> = { weak: 0, moderate: 1, strong: 2, retained: 3 };
  const items: RevisionItem[] = [];
  for (const h of health) {
    if (h.mastery === 'not-enough-data' || h.nextRevisionDay === null) continue;
    const due = h.nextRevisionDay <= todayKey ? 'today' : h.nextRevisionDay === tomorrowKey ? 'tomorrow' : h.nextRevisionDay <= weekEndKey ? 'this-week' : 'later';
    // Bundle guard: the target exam's set first, then any exam
    // that touched the topic.
    const orderedExams = [...h.examSlugs].sort((a, b) => {
      if (a === targetExamSlug) return -1;
      if (b === targetExamSlug) return 1;
      return a.localeCompare(b);
    });
    let bundleDocId: string | null = null;
    let bundleExamSlug: string | null = null;
    for (const examSlug of orderedExams) {
      const bundle = (publishedByExam.get(examSlug) ?? []).find(
        (b) => b.topicId === h.topicId && b.questionCount > 0,
      );
      if (bundle) {
        bundleDocId = bundle.docId;
        bundleExamSlug = examSlug;
        break;
      }
    }
    items.push({
      topicId: h.topicId,
      label: h.label,
      labelEn: h.labelEn,
      mastery: h.mastery,
      accuracy: h.accuracy,
      total: h.total,
      nextRevisionDay: h.nextRevisionDay,
      dueBucket: due,
      examSlugs: h.examSlugs,
      bundleDocId,
      bundleExamSlug,
    });
  }
  const bucketRank: Record<DueBucket, number> = { today: 0, tomorrow: 1, 'this-week': 2, later: 3 };
  return items.sort(
    (a, b) =>
      bucketRank[a.dueBucket] - bucketRank[b.dueBucket] ||
      masteryRank[a.mastery] - masteryRank[b.mastery] ||
      a.accuracy - b.accuracy,
  );
}

/* ------------------------------------------------------------------ */
/* Weekly plan                                                         */
/* ------------------------------------------------------------------ */

export type PlanItemKind = 'revision' | 'new-practice' | 'daily-mock';

export interface PlanDayItem {
  kind: PlanItemKind;
  topicId: string | null;
  /** Display label (topic / bundle title / "দৈনিক মক"). */
  label: string;
  /** Display label in English. */
  labelEn: string;
  /** Why this item is here, in plain Bangla. */
  reasonBn: string;
  /** Why this item is here, in English. */
  reasonEn: string;
  /** Practice link, guarded — null when no published set
   * exists (revision) or the mock is not published yet. */
  to: string | null;
  /** True when the student actually did this item that day. */
  done: boolean;
  /** True when this item slid here from an earlier due day. */
  slid: boolean;
}

export interface PlanDay {
  dayKey: string;
  labelBn: string;
  labelEn: string;
  isToday: boolean;
  items: PlanDayItem[];
  questionsDone: number;
  sessionsDone: number;
  /** True when the day's question goal was met; null when no
   * goal is set or the day is in the future. */
  goalMet: boolean | null;
}

export interface WeeklyPlan {
  days: PlanDay[];
  targetExamSlug: string | null;
  /** Revision items due beyond this week (still scheduled). */
  laterRevisions: RevisionItem[];
  /** True when yesterday's plan was unfinished AND at least
   * one of its items slid into today. */
  carriedOver: boolean;
  /** True when the target exam has no never-attempted
   * published set left (the student tried them all). */
  noNewSetsLeft: boolean;
  /** True when the target exam has no published practice set
   * at all (nothing to rotate). */
  targetHasNoSets: boolean;
}

/** Build the 7-day plan (today + 6). Revision items are
 * assigned to the earliest day from their due day onward with
 * a free revision slot (max 2/day); the rest stay in
 * laterRevisions. New practice rotates through the target
 * exam's never-attempted published sets, one per day. */
export function weeklyPlan(args: {
  attempts: JobAttemptSummary[];
  health: PlannerTopicHealth[];
  queue: RevisionItem[];
  publishedByExam: Map<string, PublishedBundleRef[]>;
  targetExamSlug: string | null;
  dailyGoalQuestions: number | null;
  /** Today's published daily mock doc ID, or null. */
  dailyMockDocId: string | null;
  nowMs: number;
}): WeeklyPlan {
  const { attempts, queue, publishedByExam, targetExamSlug, dailyGoalQuestions, dailyMockDocId, nowMs } = args;
  const todayKey = dhakaDayKey(nowMs);

  // Attempts grouped by Dhaka day, for done marks + goal checks.
  const byDay = new Map<string, JobAttemptSummary[]>();
  for (const a of attempts) {
    if (a.submittedAtMillis === null) continue;
    const key = dhakaDayKey(a.submittedAtMillis);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }
  const attemptedBundleIds = new Set(attempts.map((a) => a.bundleId).filter(Boolean));

  // New-practice rotation: never-attempted published sets for
  // the target exam, catalog order, cycling one per day.
  const targetBundles = (targetExamSlug ? publishedByExam.get(targetExamSlug) ?? [] : []).filter(
    (b) => b.questionCount > 0 && b.topicId !== null && !attemptedBundleIds.has(b.docId),
  );
  const targetAvailable = (targetExamSlug ? publishedByExam.get(targetExamSlug) ?? [] : []).filter(
    (b) => b.questionCount > 0 && b.topicId !== null,
  );
  /** The target exam has published sets, and the student has
   * attempted every one at least once. */
  const noNewSetsLeft =
    targetExamSlug !== null && targetAvailable.length > 0 && targetBundles.length === 0;
  /** The target exam has no published practice set at all. */
  const targetHasNoSets = targetExamSlug !== null && targetAvailable.length === 0;

  // Revision assignment with the sliding cap: items due today
  // or earlier are eligible from today onward; an item takes
  // the earliest day with a free revision slot.
  const revisionSlots = new Map<string, RevisionItem[]>();
  const laterRevisions: RevisionItem[] = [];
  const dayKeys: string[] = [];
  for (let i = 0; i < 7; i += 1) dayKeys.push(dhakaDayKey(nowMs + i * DAY_MS));
  for (const item of queue) {
    if (item.dueBucket === 'later') {
      laterRevisions.push(item);
      continue;
    }
    const dueIdx = Math.max(0, dayKeys.indexOf(item.nextRevisionDay));
    let placed = false;
    for (let i = dueIdx; i < 7; i += 1) {
      const slot = revisionSlots.get(dayKeys[i]) ?? [];
      if (slot.length < MAX_REVISION_PER_DAY) {
        slot.push(item);
        revisionSlots.set(dayKeys[i], slot);
        placed = true;
        break;
      }
    }
    if (!placed) laterRevisions.push(item);
  }

  const days: PlanDay[] = dayKeys.map((dayKey, dayIdx) => {
    const isToday = dayKey === todayKey;
    const dayAttempts = byDay.get(dayKey) ?? [];
    const questionsDone = dayAttempts.reduce((n, a) => n + a.answers.length, 0);
    const sessionsDone = dayAttempts.length;
    // Goal met is judged only for today, and only when a goal
    // is set — future days carry no verdict. (The week is
    // forward-looking: today + 6; past performance lives in
    // the dashboard's week activity + the goal suggestion.)
    const goalMet =
      dailyGoalQuestions === null || dayIdx > 0 ? null : questionsDone >= dailyGoalQuestions;
    const items: PlanDayItem[] = [];

    for (const rev of revisionSlots.get(dayKey) ?? []) {
      const done = dayAttempts.some((a) => a.answers.some((ans) => ans.topicId === rev.topicId));
      items.push({
        kind: 'revision',
        topicId: rev.topicId,
        label: rev.label,
        labelEn: rev.labelEn,
        reasonBn:
          rev.mastery === 'weak'
            ? `সঠিক উত্তরের হার ${rev.accuracy}% — আবার দেখে নিন`
            : rev.mastery === 'moderate'
              ? `সঠিক উত্তরের হার ${rev.accuracy}% — ঝালিয়ে নিন`
              : `ধরে রাখার রিভিশন — সঠিক উত্তরের হার ${rev.accuracy}%`,
        reasonEn:
          rev.mastery === 'weak'
            ? `Accuracy ${rev.accuracy}% — review again`
            : rev.mastery === 'moderate'
              ? `Accuracy ${rev.accuracy}% — brush up`
              : `Retention revision — accuracy ${rev.accuracy}%`,
        to: rev.bundleDocId ? `/jobs/practice/${rev.bundleDocId}` : null,
        done,
        slid: rev.nextRevisionDay < dayKey,
      });
    }

    // One new-practice item per day, rotating the catalog.
    const newBundle = targetBundles.length > 0 ? targetBundles[dayIdx % targetBundles.length] : null;
    if (newBundle) {
      const done = dayAttempts.some((a) => a.bundleId === newBundle.docId);
      items.push({
        kind: 'new-practice',
        topicId: newBundle.topicId,
        label: newBundle.titleBn ?? jobTopicLabelBn(newBundle.topicId ?? ''),
        labelEn: jobTopicLabel(newBundle.topicId ?? '', 'en'),
        reasonBn: 'এখনো চেষ্টা করা হয়নি — নতুন টপিক',
        reasonEn: 'Not attempted yet — new topic',
        to: `/jobs/practice/${newBundle.docId}`,
        done,
        slid: false,
      });
    }

    // Daily-mock row: today links to the live mock when it
    // exists; future days point at /jobs/common (that day's
    // mock appears there — no promise it will exist).
    if (isToday) {
      const mockDone = dayAttempts.some((a) => a.kind === 'mock');
      items.push({
        kind: 'daily-mock',
        topicId: null,
        label: 'দৈনিক মক',
        labelEn: 'Daily mock',
        reasonBn: dailyMockDocId ? 'আজকের দৈনিক মক' : 'আজকের মক এখনো প্রকাশিত হয়নি',
        reasonEn: dailyMockDocId ? "Today's daily mock" : "Today's mock is not published yet",
        to: dailyMockDocId ? `/jobs/mock/${dailyMockDocId}` : null,
        done: mockDone,
        slid: false,
      });
    } else {
      items.push({
        kind: 'daily-mock',
        topicId: null,
        label: 'দৈনিক মক',
        labelEn: 'Daily mock',
        reasonBn: 'সেদিনের মক সেদিন দেখাবে',
        reasonEn: "That day's mock will appear that day",
        to: '/jobs/common',
        done: false,
        slid: false,
      });
    }

    return {
      dayKey,
      labelBn: dayLabelBn(dayKey, nowMs),
      labelEn: dayLabel(dayKey, nowMs, 'en'),
      isToday,
      items,
      questionsDone,
      sessionsDone,
      goalMet,
    };
  });

  // Carried over: at least one revision item slid into today
  // from an earlier due day — yesterday's plan was unfinished.
  // Shown neutrally, never as a failure.
  const todayItems = days[0]?.items ?? [];
  const carriedOver = todayItems.some((i) => i.slid);

  return { days, targetExamSlug, laterRevisions, carriedOver, noNewSetsLeft, targetHasNoSets };
}

/* ------------------------------------------------------------------ */
/* Today's plan + effort modes                                         */
/* ------------------------------------------------------------------ */

export type EffortMode = 'light' | 'standard' | 'deep';

export interface TodayPlan {
  /** Practice items for the chosen mode (revisions + new
   * practice; the daily mock is separate). */
  items: PlanDayItem[];
  /** Today's daily-mock row (standing item, not counted in
   * the 2–3). */
  mockItem: PlanDayItem | null;
  /** Extra item Deep mode adds, if one exists. */
  extraItem: PlanDayItem | null;
  doneCount: number;
  totalCount: number;
}

/** Today's plan from the built week. Light = 1 item only (the
 * top undone one); Standard = today's revisions (max 2) + the
 * new-practice item; Deep = Standard + 1 extra (the next
 * never-attempted set, else the next due revision). Items
 * already done today stay visible, marked done — never hidden
 * or re-assigned. */
export function todaysPlan(week: WeeklyPlan, mode: EffortMode): TodayPlan {
  const today = week.days[0];
  if (!today) return { items: [], mockItem: null, extraItem: null, doneCount: 0, totalCount: 0 };
  const mockItem = today.items.find((i) => i.kind === 'daily-mock') ?? null;
  const practice = today.items.filter((i) => i.kind !== 'daily-mock');
  const undone = practice.filter((i) => !i.done);
  let items: PlanDayItem[];
  let extraItem: PlanDayItem | null = null;
  if (mode === 'light') {
    items = undone.length > 0 ? [undone[0]] : practice.slice(0, 1);
  } else if (mode === 'standard') {
    items = practice;
  } else {
    items = practice;
    // Deep adds one more: the next practice item from the
    // coming days that is NOT already in today's plan (same
    // set twice would be a duplicate, not extra work) —
    // prefer a new topic, else the next due revision.
    const todayTos = new Set(practice.map((i) => i.to).filter(Boolean));
    const upcoming = week.days
      .slice(1)
      .flatMap((d) => d.items)
      .filter((i) => i.kind !== 'daily-mock' && i.to !== null && !todayTos.has(i.to));
    extraItem =
      upcoming.find((i) => i.kind === 'new-practice') ??
      upcoming.find((i) => i.kind === 'revision') ??
      null;
  }
  const all = [...items, ...(extraItem ? [extraItem] : []), ...(mockItem ? [mockItem] : [])];
  return {
    items,
    mockItem,
    extraItem,
    doneCount: all.filter((i) => i.done).length,
    totalCount: all.length,
  };
}

/* ------------------------------------------------------------------ */
/* Goal suggestion (adaptive workload — suggestion only)               */
/* ------------------------------------------------------------------ */

export interface GoalSuggestion {
  avgQuestionsPerDay: number;
  goal: number;
  activeDays: number;
}

/** When the student's set goal is far above what they
 * realistically did in the last 7 days (goal > 1.5× the
 * 7-day average, with at least 3 active days of history),
 * return the numbers so the page can suggest — never enforce
 * — a lower goal. Null otherwise (including no goal set, or
 * too little history to judge). */
export function goalSuggestion(args: {
  attempts: JobAttemptSummary[];
  dailyGoalQuestions: number | null;
  nowMs: number;
}): GoalSuggestion | null {
  const { attempts, dailyGoalQuestions, nowMs } = args;
  if (dailyGoalQuestions === null || dailyGoalQuestions <= 0) return null;
  const week = weekActivity(attempts, nowMs);
  const activeDays = week.days.filter((d) => d.sessions > 0).length;
  if (activeDays < 3) return null;
  const avg = Math.round((week.totalQuestions / 7) * 10) / 10;
  if (avg <= 0) return null;
  if (dailyGoalQuestions <= avg * 1.5) return null;
  return { avgQuestionsPerDay: avg, goal: dailyGoalQuestions, activeDays };
}

/** Accuracy helper re-exported for the page's weak-topic
 * counts (single import surface for the planner page). */
export { accuracyOrNull };
