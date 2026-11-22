// Eduvelto — Job notifications (Step 14): DERIVED feed, pure.
//
// There is NO jobNotifications collection in v1. The
// compiled-rules margin (~1,132 bytes) fits ONE minimal block
// (the circulars match block), and there is no Cloud Function /
// FCM on Spark free to send scheduled reminders. So the
// notification center is an IN-APP FEED, computed on visit from
// data the student already has:
//  - deadline reminders — verified published circulars whose
//    deadline is within 7 days (see the reconciled schedule
//    below), scoped to the student's enrolled/target exams;
//  - new mock availability — today's daily mock / this week's
//    weekly mock, when published;
//  - result ready — the student's latest submitted attempt
//    (last 7 days), with a deep link to its result page.
//
// RECONCILED REMINDER SCHEDULE (Gemini 3d + 24h vs ChatGPT
// 7d optional + 3d + 1d + deadline day): because nothing is
// SENT in v1 (no backend), the "schedule" is a set of
// visibility windows on visit — one item per circular, its
// urgency escalating as the deadline nears: ≤7 days early
// (normal), ≤3 days closing soon (high), ≤1 day final (high),
// deadline day itself "আজ শেষ দিন" (high). No duplicate
// reminders can ever be sent, because nothing is sent.
// Scheduled push reminders + FCM are Phase 2 (needs a trusted
// backend); the in-app feed is the delivery mechanism until
// then, and it is retained even if push ever arrives.
//
// HONESTY (both consultations):
// - A reminder exists ONLY for a VERIFIED deadline (verifiedBy
//   present) with the application period started and the
//   deadline not passed. Never for an unverified circular.
// - No spam / engagement nags ("Haven't studied today?"),
//   no unverified "Result Out!" / "Circular Coming Tomorrow!",
//   no alerts for closed circulars, no alarming language.
// - Scores are never put in a notification body (in-app only
//   in v1, but the rule holds for any future push preview).
// - Read / dismissed state lives in localStorage per user
//   (no collection to store it in); a cleared browser loses
//   read state, never the notifications themselves — the feed
//   re-derives on every visit.

import {
  circularApplicationStatus,
  circularDaysLeft,
  circularEffectiveDeadlineMillis,
  isCircularVerified,
  toBanglaDigits,
  type JobCircular,
} from './jobCirculars';
import type { JobAttemptSummary } from './jobAnalysis';
import type { JobMockWithId } from './jobMocks';

export type JobNotificationKind = 'circular-deadline' | 'new-mock' | 'result-ready';

export interface JobNotificationItem {
  /** Stable id: kind + source id (+ window for deadlines is
   * NOT part of the id — one item per circular, urgency
   * escalates in place). */
  id: string;
  kind: JobNotificationKind;
  priority: 'high' | 'normal';
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  link: string;
  examSlug: string;
  /** When the underlying event happened / will happen. */
  eventMillis: number | null;
}

/** Reminder windows (millis before the deadline). */
export const NOTIFICATION_EARLY_WINDOW_MILLIS = 7 * 24 * 60 * 60 * 1000;
export const NOTIFICATION_CLOSING_WINDOW_MILLIS = 3 * 24 * 60 * 60 * 1000;
export const NOTIFICATION_FINAL_WINDOW_MILLIS = 1 * 24 * 60 * 60 * 1000;
/** A result counts as "just ready" for 7 days after submit. */
export const NOTIFICATION_RESULT_FRESH_MILLIS = 7 * 24 * 60 * 60 * 1000;

export interface DeriveNotificationsInput {
  /** Published circulars (already filtered to published). */
  circulars: JobCircular[];
  todayDailyMock: JobMockWithId | null;
  thisWeekWeeklyMock: JobMockWithId | null;
  /** The student's attempts, newest first (dashboard order). */
  attempts: JobAttemptSummary[];
  /** The student's enrolled/target exam slugs. Empty = no
   * target exam set: circular reminders are then skipped
   * (they would be noise across all exams) while platform
   * mock notices still show. */
  examSlugs: string[];
  nowMs?: number;
}

function inExamScope(examSlug: string, examSlugs: string[]): boolean {
  return examSlugs.length === 0 || examSlugs.includes(examSlug);
}

export function deriveJobNotifications(input: DeriveNotificationsInput): JobNotificationItem[] {
  const nowMs = input.nowMs ?? Date.now();
  const items: JobNotificationItem[] = [];

  for (const c of input.circulars) {
    if (!isCircularVerified(c)) continue;
    if (!inExamScope(c.examSlug, input.examSlugs)) continue;
    // Circular reminders need a target exam: with no enrolled
    // exam the feed would spam every exam's deadlines.
    if (input.examSlugs.length === 0) continue;
    const status = circularApplicationStatus(c, nowMs);
    if (status !== 'open' && status !== 'closing-soon') continue;
    const deadline = circularEffectiveDeadlineMillis(c);
    if (deadline === null) continue;
    const days = circularDaysLeft(c, nowMs);
    if (days === null || days < 0 || days > 7) continue;
    const priority: 'high' | 'normal' = days <= 3 ? 'high' : 'normal';
    const bodyBn =
      days === 0
        ? 'আজ আবেদনের শেষ দিন — আবেদন করার আগে মূল বিজ্ঞপ্তিটি দেখুন।'
        : days === 1
          ? 'আগামীকাল আবেদনের শেষ দিন — আবেদন করার আগে মূল বিজ্ঞপ্তিটি দেখুন।'
          : `আবেদনের শেষ তারিখ আর ${toBanglaDigits(days)} দিন বাকি — আবেদন করার আগে মূল বিজ্ঞপ্তিটি দেখুন।`;
    const bodyEn =
      days === 0
        ? 'Today is the last day to apply — see the original circular before applying.'
        : days === 1
          ? 'Tomorrow is the last day to apply — see the original circular before applying.'
          : `${days} days left to apply — see the original circular before applying.`;
    items.push({
      id: `circular-deadline:${c.docId}`,
      kind: 'circular-deadline',
      priority,
      titleBn: `${c.postTitleBn} — আবেদনের সময় শেষের পথে`,
      titleEn: `${c.postTitleEn} — application deadline approaching`,
      bodyBn,
      bodyEn,
      link: `/jobs/circulars/${c.docId}`,
      examSlug: c.examSlug,
      eventMillis: deadline,
    });
  }

  for (const [mock, kindBn, kindEn] of [
    [input.todayDailyMock, 'আজকের দৈনিক মক', "Today's daily mock"],
    [input.thisWeekWeeklyMock, 'এই সপ্তাহের সাপ্তাহিক মক', "This week's weekly mock"],
  ] as Array<[JobMockWithId | null, string, string]>) {
    if (!mock) continue;
    if (!inExamScope(mock.examSlug, input.examSlugs)) continue;
    items.push({
      id: `new-mock:${mock.docId}`,
      kind: 'new-mock',
      priority: 'normal',
      titleBn: `${kindBn} প্রকাশিত হয়েছে`,
      titleEn: `${kindEn} is published`,
      bodyBn: `${mock.titleBn} — এখন অনুশীলন শুরু করতে পারেন।`,
      bodyEn: `${mock.titleEn} — you can start practising now.`,
      link: `/jobs/mock/${mock.docId}`,
      examSlug: mock.examSlug,
      eventMillis: null,
    });
  }

  const latest = input.attempts.find((a) => a.submittedAtMillis !== null);
  if (latest && latest.submittedAtMillis !== null && nowMs - latest.submittedAtMillis <= NOTIFICATION_RESULT_FRESH_MILLIS) {
    items.push({
      id: `result-ready:${latest.docId}`,
      kind: 'result-ready',
      priority: 'high',
      titleBn: 'ফলাফল প্রকাশিত',
      titleEn: 'Result ready',
      bodyBn: 'আপনার সর্বশেষ পরীক্ষার ফলাফল দেখুন।',
      bodyEn: 'See the result of your latest attempt.',
      link: `/jobs/result/${latest.docId}`,
      examSlug: latest.examSlug,
      eventMillis: latest.submittedAtMillis,
    });
  }

  // Soonest event first; the fresh result (a past event time)
  // naturally sorts first as the most recent news, and mock
  // notices (no event time) sort after dated deadlines.
  items.sort((a, b) => {
    if (a.eventMillis !== null && b.eventMillis !== null) return a.eventMillis - b.eventMillis;
    if (a.eventMillis !== null) return 1;
    if (b.eventMillis !== null) return -1;
    return a.id.localeCompare(b.id);
  });
  return items;
}

/* ------------------------------------------------------------------ */
/* Local read / dismissed state (no collection to store it in).        */
/* ------------------------------------------------------------------ */

export interface NotificationLocalState {
  read: string[];
  dismissed: string[];
}

export const EMPTY_NOTIFICATION_LOCAL_STATE: NotificationLocalState = { read: [], dismissed: [] };

export function parseNotificationLocalState(raw: string | null): NotificationLocalState {
  if (!raw) return { read: [], dismissed: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationLocalState>;
    return {
      read: Array.isArray(parsed.read) ? parsed.read.filter((x): x is string => typeof x === 'string') : [],
      dismissed: Array.isArray(parsed.dismissed)
        ? parsed.dismissed.filter((x): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return { read: [], dismissed: [] };
  }
}

export function markNotificationRead(state: NotificationLocalState, id: string): NotificationLocalState {
  if (state.read.includes(id)) return state;
  return { ...state, read: [...state.read, id] };
}

export function markAllNotificationsRead(state: NotificationLocalState, ids: string[]): NotificationLocalState {
  const read = new Set(state.read);
  for (const id of ids) read.add(id);
  return { ...state, read: [...read] };
}

export function dismissNotification(state: NotificationLocalState, id: string): NotificationLocalState {
  if (state.dismissed.includes(id)) return state;
  return { ...state, dismissed: [...state.dismissed, id] };
}

export function visibleNotifications(
  items: JobNotificationItem[],
  state: NotificationLocalState,
): JobNotificationItem[] {
  const dismissed = new Set(state.dismissed);
  return items.filter((i) => !dismissed.has(i.id));
}

export function unreadNotificationCount(
  items: JobNotificationItem[],
  state: NotificationLocalState,
): number {
  const read = new Set(state.read);
  return visibleNotifications(items, state).filter((i) => !read.has(i.id)).length;
}

export function isNotificationRead(state: NotificationLocalState, id: string): boolean {
  return state.read.includes(id);
}
