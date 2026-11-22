// Eduvelto — Job exam calendar (Step 14): pure derivation.
//
// Events are DERIVED from published records only — never from
// a separate collection, never guessed:
//  - a published circular's applicationDeadline → an
//    'application-deadline' event;
//  - a published circular's examDate → an 'exam-date' event;
//  - a published mock's scheduleDate → a 'weekly-mock' /
//    'daily-mock' event.
// Every derived event isConfirmed = true, because its date
// comes from a published circular / published mock (design
// §7.3: "নিশ্চিত (বিজ্ঞপ্তি থেকে)"). There are NO estimated
// events in v1: an estimated date is never shown as confirmed,
// and with no source there is no event at all. The page says
// so honestly ("এখানে শুধু বিজ্ঞপ্তি থেকে নিশ্চিত তারিখ
// দেখানো হয়").
//
// The Step 12 countdown deferral lands here: the "next
// confirmed date" countdown counts down to a REAL date from a
// verified published circular / published mock — never to a
// student guess and never to an estimated date.

import { dhakaDayKey } from './jobDashboard';
import {
  circularEffectiveDeadlineMillis,
  isCircularVerified,
  type JobCircular,
} from './jobCirculars';
import type { JobMockWithId } from './jobMocks';

export type JobCalendarEventType = 'application-deadline' | 'exam-date' | 'daily-mock' | 'weekly-mock';

export interface JobCalendarEvent {
  id: string;
  type: JobCalendarEventType;
  titleBn: string;
  titleEn: string;
  /** Event instant (millis). For a date-only deadline this is
   * the effective closing instant (end of day, Dhaka). */
  dateMillis: number;
  /** Always true in v1 — every event comes from a published
   * circular / published mock. False is reserved for a future
   * estimated event, which v1 never creates. */
  isConfirmed: boolean;
  /** Where the date comes from (shown on the event). */
  sourceBn: string;
  sourceEn: string;
  /** Deep link: the circular detail page or the mock page. */
  link: string;
  examSlug: string;
}

export const CALENDAR_EVENT_TYPE_BN: Record<JobCalendarEventType, string> = {
  'application-deadline': 'আবেদনের শেষ তারিখ',
  'exam-date': 'পরীক্ষার তারিখ',
  'daily-mock': 'দৈনিক মক',
  'weekly-mock': 'সাপ্তাহিক মক',
};

export const CALENDAR_EVENT_TYPE_EN: Record<JobCalendarEventType, string> = {
  'application-deadline': 'Application deadline',
  'exam-date': 'Exam date',
  'daily-mock': 'Daily mock',
  'weekly-mock': 'Weekly mock',
};

/** Build the event list from published circulars + published
 * mocks. Mocks arrive as JobMockWithId (kind daily/weekly/full
 * + scheduleDate 'YYYY-MM-DD' or null — full mocks have no
 * scheduleDate and contribute no event). Only VERIFIED
 * circulars contribute events: an unverified circular's dates
 * are not trusted enough to put on a student's calendar. */
export function buildCalendarEvents(args: {
  circulars: JobCircular[];
  mocks: JobMockWithId[];
}): JobCalendarEvent[] {
  const events: JobCalendarEvent[] = [];
  for (const c of args.circulars) {
    if (!isCircularVerified(c)) continue;
    const deadline = circularEffectiveDeadlineMillis(c);
    if (deadline !== null) {
      events.push({
        id: `circular-deadline:${c.docId}`,
        type: 'application-deadline',
        titleBn: `${c.postTitleBn} — আবেদনের শেষ তারিখ`,
        titleEn: `${c.postTitleEn} — application deadline`,
        dateMillis: deadline,
        isConfirmed: true,
        sourceBn: 'সরকারি বিজ্ঞপ্তি থেকে',
        sourceEn: 'From the official circular',
        link: `/jobs/circulars/${c.docId}`,
        examSlug: c.examSlug,
      });
    }
    if (c.examDateMillis !== null) {
      events.push({
        id: `circular-exam:${c.docId}`,
        type: 'exam-date',
        titleBn: `${c.postTitleBn} — পরীক্ষার তারিখ`,
        titleEn: `${c.postTitleEn} — exam date`,
        dateMillis: c.examDateMillis,
        isConfirmed: true,
        sourceBn: 'সরকারি বিজ্ঞপ্তি থেকে',
        sourceEn: 'From the official circular',
        link: `/jobs/circulars/${c.docId}`,
        examSlug: c.examSlug,
      });
    }
  }
  for (const m of args.mocks) {
    if (m.kind !== 'daily' && m.kind !== 'weekly') continue;
    if (typeof m.scheduleDate !== 'string' || m.scheduleDate.length === 0) continue;
    // scheduleDate is a Dhaka calendar date (YYYY-MM-DD); the
    // mock runs that day. Represent it as midday Dhaka so the
    // event sorts on its day and never flips a day early.
    const dateMillis = Date.parse(`${m.scheduleDate}T12:00:00.000+06:00`);
    if (!Number.isFinite(dateMillis)) continue;
    events.push({
      id: `mock:${m.docId}`,
      type: m.kind === 'daily' ? 'daily-mock' : 'weekly-mock',
      titleBn: m.titleBn,
      titleEn: m.titleEn,
      dateMillis,
      isConfirmed: true,
      sourceBn: 'প্রকাশিত মক',
      sourceEn: 'Published mock',
      link: `/jobs/mock/${m.docId}`,
      examSlug: m.examSlug,
    });
  }
  events.sort((a, b) => a.dateMillis - b.dateMillis || a.id.localeCompare(b.id));
  return events;
}

/** Dhaka calendar days from now until the event date (0 =
 * today). Day granularity, like the circulars countdown — so
 * the countdown always agrees with the displayed date. */
export function daysUntilEvent(event: JobCalendarEvent, nowMs: number): number {
  const nowDay = dhakaDayKey(nowMs);
  const eventDay = dhakaDayKey(event.dateMillis);
  return Math.round(
    (Date.parse(`${eventDay}T00:00:00Z`) - Date.parse(`${nowDay}T00:00:00Z`)) / 86_400_000,
  );
}

/** The next confirmed event at or after now (for the countdown
 * card). Null when nothing upcoming is known — the page then
 * shows the honest "no confirmed date yet" state. */
export function nextConfirmedEvent(events: JobCalendarEvent[], nowMs: number = Date.now()): JobCalendarEvent | null {
  for (const e of events) {
    if (e.dateMillis >= nowMs) return e;
  }
  return null;
}

/** Group events by Dhaka month key ('YYYY-MM') for the list
 * view, newest month first. */
export function groupEventsByMonth(events: JobCalendarEvent[]): Array<{ monthKey: string; events: JobCalendarEvent[] }> {
  const byMonth = new Map<string, JobCalendarEvent[]>();
  for (const e of events) {
    const key = dhakaDayKey(e.dateMillis).slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(e);
    byMonth.set(key, list);
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, list]) => ({ monthKey, events: list }));
}

/** Events on one Dhaka day ('YYYY-MM-DD') — for the month grid. */
export function eventsOnDay(events: JobCalendarEvent[], dayKey: string): JobCalendarEvent[] {
  return events.filter((e) => dhakaDayKey(e.dateMillis) === dayKey);
}
