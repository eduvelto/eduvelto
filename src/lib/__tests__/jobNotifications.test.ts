// Eduvelto — Job notifications unit tests (Step 14).
//
// The feed is DERIVED on visit — nothing is sent. Expected
// items are computed from the fixtures; all "now" values are
// fixed Dhaka instants, never Date.now().

import { describe, expect, it } from 'vitest';
import {
  deriveJobNotifications,
  dismissNotification,
  EMPTY_NOTIFICATION_LOCAL_STATE,
  isNotificationRead,
  markAllNotificationsRead,
  markNotificationRead,
  parseNotificationLocalState,
  unreadNotificationCount,
  visibleNotifications,
} from '../jobNotifications';
import type { JobCircular } from '../jobCirculars';
import type { JobAttemptSummary } from '../jobAnalysis';
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
    examDateMillis: null,
    applicationStartDateMillis: dhaka(2026, 12, 1, 0, 0),
    authorId: 'moderator-1',
    createdAtMillis: dhaka(2026, 11, 20),
    updatedAtMillis: dhaka(2026, 11, 21),
    verificationChecklist: null,
    reviewNote: null,
    lastEditedBy: 'moderator-1',
    ...overrides,
  };
}

function makeMock(docId: string, examSlug = 'bcs'): JobMockWithId {
  return {
    docId,
    examSlug,
    kind: docId.startsWith('daily') ? 'daily' : 'weekly',
    titleBn: 'মক',
    titleEn: 'Mock',
    scheduleDate: '2026-12-05',
    status: 'published',
  } as JobMockWithId;
}

function makeAttempt(overrides: Partial<JobAttemptSummary> = {}): JobAttemptSummary {
  return {
    docId: 'attempt-1',
    kind: 'mock',
    examSlug: 'bcs',
    bundleId: 'mock__full__bcs__1',
    mockId: 'full__bcs__1',
    score: 80,
    totalMarks: 100,
    percentage: 80,
    correctCount: 80,
    wrongCount: 20,
    unansweredCount: 0,
    negativeDeduction: 0,
    negativeMarkingUsed: 0.5,
    timeSpentSeconds: 3600,
    submittedAtMillis: dhaka(2026, 12, 4, 10, 0),
    answers: [],
    ...overrides,
  };
}

const NOW = dhaka(2026, 12, 10);

describe('deadline reminders — the reconciled 7d / 3d / 1d / today windows', () => {
  it('deadline in 5 days (early window) → normal-priority reminder', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular()],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW,
    });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('circular-deadline');
    expect(items[0].priority).toBe('normal');
  });
  it('deadline in 2 days → high-priority reminder', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular({ applicationDeadlineMillis: dhaka(2026, 12, 12, 18, 0) })],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW,
    });
    expect(items[0].priority).toBe('high');
  });
  it('deadline in 10 days → no reminder yet', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular({ applicationDeadlineMillis: dhaka(2026, 12, 20, 18, 0) })],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW,
    });
    expect(items).toHaveLength(0);
  });
  it('UNVERIFIED circular → never a reminder', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular({ verifiedBy: null, verifiedAtMillis: null })],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW,
    });
    expect(items).toHaveLength(0);
  });
  it('closed circular → no reminder', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular()],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: dhaka(2026, 12, 20),
    });
    expect(items).toHaveLength(0);
  });
  it('circular for another exam → no reminder (exam-scoped)', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular()],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bank'],
      nowMs: NOW,
    });
    expect(items).toHaveLength(0);
  });
  it('no target exam set → no circular reminders (would be noise)', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular()],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: [],
      nowMs: NOW,
    });
    expect(items).toHaveLength(0);
  });
  it('not-yet-open application → no reminder', () => {
    const items = deriveJobNotifications({
      circulars: [makeCircular()],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: dhaka(2026, 11, 25),
    });
    expect(items).toHaveLength(0);
  });
});

describe('new-mock + result-ready items', () => {
  it("today's daily mock → a new-mock item", () => {
    const items = deriveJobNotifications({
      circulars: [],
      todayDailyMock: makeMock('daily__2026-12-10'),
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW,
    });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('new-mock');
    expect(items[0].link).toBe('/jobs/mock/daily__2026-12-10');
  });
  it('a mock for another exam is skipped when a target is set', () => {
    const items = deriveJobNotifications({
      circulars: [],
      todayDailyMock: makeMock('daily__2026-12-10', 'bank'),
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW,
    });
    expect(items).toHaveLength(0);
  });
  it('latest attempt within 7 days → result-ready item (no score in the body)', () => {
    const items = deriveJobNotifications({
      circulars: [],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [makeAttempt()],
      examSlugs: ['bcs'],
      nowMs: dhaka(2026, 12, 5),
    });
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('result-ready');
    expect(items[0].link).toBe('/jobs/result/attempt-1');
    expect(items[0].bodyBn).not.toContain('৮০');
    expect(items[0].bodyEn).not.toContain('80');
  });
  it('an attempt older than 7 days is history, not news', () => {
    const items = deriveJobNotifications({
      circulars: [],
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [makeAttempt()],
      examSlugs: ['bcs'],
      nowMs: dhaka(2026, 12, 20),
    });
    expect(items).toHaveLength(0);
  });
});

describe('local read / dismissed state', () => {
  const items = deriveJobNotifications({
    circulars: [makeCircular()],
    todayDailyMock: makeMock('daily__2026-12-10'),
    thisWeekWeeklyMock: null,
    attempts: [],
    examSlugs: ['bcs'],
    nowMs: NOW,
  });
  it('all items start unread', () => {
    expect(unreadNotificationCount(items, EMPTY_NOTIFICATION_LOCAL_STATE)).toBe(2);
  });
  it('marking one read drops the unread count', () => {
    const state = markNotificationRead(EMPTY_NOTIFICATION_LOCAL_STATE, items[0].id);
    expect(isNotificationRead(state, items[0].id)).toBe(true);
    expect(unreadNotificationCount(items, state)).toBe(1);
  });
  it('mark-all-read clears the count', () => {
    const state = markAllNotificationsRead(EMPTY_NOTIFICATION_LOCAL_STATE, items.map((i) => i.id));
    expect(unreadNotificationCount(items, state)).toBe(0);
  });
  it('dismissing hides the item entirely', () => {
    const state = dismissNotification(EMPTY_NOTIFICATION_LOCAL_STATE, items[0].id);
    expect(visibleNotifications(items, state)).toHaveLength(1);
  });
  it('corrupt stored state parses to empty (never crashes)', () => {
    expect(parseNotificationLocalState('not json{{')).toEqual({ read: [], dismissed: [] });
    expect(parseNotificationLocalState(null)).toEqual({ read: [], dismissed: [] });
  });
});
