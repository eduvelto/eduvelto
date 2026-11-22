// Eduvelto — Job calendar unit tests (Step 14).
//
// Events derive ONLY from published records. Expected values
// are computed from the fixtures — nothing is invented.

import { describe, expect, it } from 'vitest';
import {
  buildCalendarEvents,
  daysUntilEvent,
  eventsOnDay,
  groupEventsByMonth,
  nextConfirmedEvent,
} from '../jobCalendar';
import type { JobCircular } from '../jobCirculars';
import type { JobMockWithId } from '../jobMocks';

/** Dhaka wall-clock → millis (Dhaka is UTC+6, no DST). */
function dhaka(y: number, m: number, d: number, h = 12, min = 0): number {
  return Date.UTC(y, m - 1, d, h - 6, min, 0);
}

function makeCircular(overrides: Partial<JobCircular> = {}): JobCircular {
  return {
    docId: 'c-bcs-47',
    examSlug: 'bcs',
    postTitleBn: '৪৭তম বিসিএস',
    postTitleEn: '47th BCS',
    circularNumber: '১২৩',
    publishedDateMillis: dhaka(2026, 11, 20),
    applicationDeadlineMillis: dhaka(2026, 12, 15, 18, 0),
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক।',
    eligibilitySummaryEn: 'Bachelor.',
    officialUrl: 'https://bpsc.gov.bd/c/47',
    applyUrl: 'https://bpsc.teletalk.com.bd',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    reviewStatus: 'published',
    verifiedBy: 'moderator-1',
    verifiedAtMillis: dhaka(2026, 11, 21),
    examDateMillis: dhaka(2027, 1, 10, 10, 0),
    applicationStartDateMillis: dhaka(2026, 12, 1, 0, 0),
    authorId: 'moderator-1',
    createdAtMillis: dhaka(2026, 11, 20),
    updatedAtMillis: dhaka(2026, 11, 21),
    ...overrides,
  };
}

function makeMock(overrides: Partial<JobMockWithId> = {}): JobMockWithId {
  return {
    docId: 'daily__2026-12-05',
    examSlug: 'bcs',
    kind: 'daily',
    titleBn: 'দৈনিক মক — ৫ ডিসেম্বর',
    titleEn: 'Daily mock — 5 December',
    scheduleDate: '2026-12-05',
    status: 'published',
    ...overrides,
  } as JobMockWithId;
}

describe('buildCalendarEvents', () => {
  it('a verified circular contributes a deadline + an exam-date event', () => {
    const events = buildCalendarEvents({ circulars: [makeCircular()], mocks: [] });
    expect(events.map((e) => e.type)).toEqual(['application-deadline', 'exam-date']);
    expect(events.every((e) => e.isConfirmed)).toBe(true);
  });
  it('an UNVERIFIED circular contributes no events', () => {
    const events = buildCalendarEvents({
      circulars: [makeCircular({ verifiedBy: null, verifiedAtMillis: null })],
      mocks: [],
    });
    expect(events).toEqual([]);
  });
  it('a circular without an exam date contributes only the deadline', () => {
    const events = buildCalendarEvents({ circulars: [makeCircular({ examDateMillis: null })], mocks: [] });
    expect(events.map((e) => e.type)).toEqual(['application-deadline']);
  });
  it('a published daily mock contributes a daily-mock event on its date', () => {
    const events = buildCalendarEvents({ circulars: [], mocks: [makeMock()] });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('daily-mock');
    expect(events[0].link).toBe('/jobs/mock/daily__2026-12-05');
  });
  it('a full mock (no scheduleDate) contributes no event', () => {
    const events = buildCalendarEvents({
      circulars: [],
      mocks: [makeMock({ kind: 'full', scheduleDate: null, docId: 'full__bcs__1' })],
    });
    expect(events).toEqual([]);
  });
  it('events sort by date, earliest first', () => {
    const events = buildCalendarEvents({ circulars: [makeCircular()], mocks: [makeMock()] });
    expect(events.map((e) => e.type)).toEqual(['daily-mock', 'application-deadline', 'exam-date']);
  });
});

describe('nextConfirmedEvent', () => {
  const events = buildCalendarEvents({ circulars: [makeCircular()], mocks: [makeMock()] });
  it('returns the nearest upcoming event', () => {
    const next = nextConfirmedEvent(events, dhaka(2026, 12, 1));
    expect(next?.type).toBe('daily-mock');
  });
  it('returns null when nothing upcoming is known', () => {
    expect(nextConfirmedEvent(events, dhaka(2027, 2, 1))).toBeNull();
  });
  it('daysUntilEvent is day-granular (today=0, tomorrow=1)', () => {
    const next = nextConfirmedEvent(events, dhaka(2026, 12, 5));
    expect(next).not.toBeNull();
    expect(daysUntilEvent(next!, dhaka(2026, 12, 5))).toBe(0);
    expect(daysUntilEvent(next!, dhaka(2026, 12, 4))).toBe(1);
    expect(daysUntilEvent(next!, dhaka(2026, 12, 6))).toBe(-1);
  });
});

describe('groupEventsByMonth + eventsOnDay', () => {
  const events = buildCalendarEvents({ circulars: [makeCircular()], mocks: [makeMock()] });
  it('groups into 2026-12 and 2027-01', () => {
    expect(groupEventsByMonth(events).map((g) => g.monthKey)).toEqual(['2026-12', '2027-01']);
  });
  it('eventsOnDay finds the mock on its Dhaka day', () => {
    expect(eventsOnDay(events, '2026-12-05')).toHaveLength(1);
    expect(eventsOnDay(events, '2026-12-06')).toHaveLength(0);
  });
});
