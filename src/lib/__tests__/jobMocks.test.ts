/**
 * Eduvelto Job Preparation — Step 9 unit tests (jobMocks.ts).
 *
 * Covers: mock-ID scheme (daily / weekly / full) + doc-ID builders
 * and their inverse, Dhaka dates + ISO weeks (incl. year-boundary
 * weeks), the weekly cycle exam, the rules-snapshot builder (all
 * four verified patterns — Bank's penalty is the verified 0.25
 * since 24 Nov 2026; daily overrides), and validateJobMock (valid
 * docs + the doc-ID / cycle / snapshot failures).
 */
import { describe, it, expect } from 'vitest';
import {
  buildJobMockRulesSnapshot,
  jobDhakaDateString,
  jobIsoWeekOfDate,
  jobMockBundleId,
  jobMockDocId,
  jobMockIdForDaily,
  jobMockIdForFull,
  jobMockIdForWeekly,
  jobMockIdFromDocId,
  jobMockKindLabelBn,
  jobMockPatternSummaryBn,
  jobThisWeekCycleExam,
  jobThisWeekWeeklyMockId,
  jobTodayDailyMockId,
  jobWeeklyExamForWeek,
  validateJobMock,
  type JobMockDoc,
} from '../jobMocks';

function validMockDoc(overrides: Record<string, unknown> = {}): { doc: JobMockDoc; docId: string } {
  return {
    doc: {
      examSlug: 'bcs',
      titleBn: 'বিসিএস পূর্ণ মক ১',
      titleEn: 'BCS Full Mock 1',
      kind: 'full',
      bundleId: 'mock__full__bcs__1',
      questionSetId: 'full__bcs__1_v1',
      rulesSnapshot: {
        questionCount: 200,
        timeMinutes: 120,
        marksPerQuestion: 1,
        negativeMarking: 0.5,
        negativeMarkingVerified: true,
        passPercent: null,
        scoringConfigVersion: 'v1',
      },
      scheduleDate: null,
      examSlugCycle: null,
      status: 'published',
      retakeAllowed: true,
      maxAttempts: null,
      publishedAt: null,
      publishedBy: null,
      createdAt: null,
      updatedAt: null,
      ...overrides,
    } as JobMockDoc,
    docId: 'full__bcs__1',
  };
}

describe('mock-ID scheme', () => {
  it('daily mockId is the Dhaka date', () => {
    expect(jobMockIdForDaily('2026-11-22')).toBe('2026-11-22');
  });

  it('weekly mockId is the ISO week ID', () => {
    expect(jobMockIdForWeekly('2026-W47')).toBe('2026-W47');
  });

  it('full mockId is full__{examSlug}__{n}', () => {
    expect(jobMockIdForFull('bcs', 1)).toBe('full__bcs__1');
    expect(jobMockIdForFull('primary-teacher', 12)).toBe('full__primary-teacher__12');
  });

  it('doc-IDs: daily/weekly get a prefix, full IS the mockId', () => {
    expect(jobMockDocId('2026-11-22', 'daily')).toBe('daily__2026-11-22');
    expect(jobMockDocId('2026-W47', 'weekly')).toBe('weekly__2026-W47');
    expect(jobMockDocId('full__bcs__1', 'full')).toBe('full__bcs__1');
  });

  it('jobMockIdFromDocId inverts the doc-ID (and rejects wrong shapes)', () => {
    expect(jobMockIdFromDocId('daily__2026-11-22', 'daily')).toBe('2026-11-22');
    expect(jobMockIdFromDocId('weekly__2026-W47', 'weekly')).toBe('2026-W47');
    expect(jobMockIdFromDocId('full__bcs__1', 'full')).toBe('full__bcs__1');
    expect(jobMockIdFromDocId('full__bcs__1', 'daily')).toBeNull();
    expect(jobMockIdFromDocId('daily__2026-11-22', 'weekly')).toBeNull();
    expect(jobMockIdFromDocId('bcs-mock-01', 'full')).toBeNull();
    expect(jobMockIdFromDocId('daily__', 'daily')).toBeNull();
  });

  it('bundle doc-IDs follow the same bare key', () => {
    expect(jobMockBundleId('2026-11-22', 'daily')).toBe('daily__2026-11-22');
    expect(jobMockBundleId('2026-W47', 'weekly')).toBe('weekly__2026-W47');
    expect(jobMockBundleId('full__bcs__1', 'full')).toBe('mock__full__bcs__1');
  });
});

describe('Dhaka dates + ISO weeks', () => {
  it('jobDhakaDateString uses Asia/Dhaka (UTC+6)', () => {
    // 2026-11-21 20:00 UTC is 2026-11-22 02:00 in Dhaka.
    expect(jobDhakaDateString(Date.UTC(2026, 10, 21, 20, 0, 0))).toBe('2026-11-22');
    // 2026-11-21 17:00 UTC is 2026-11-21 23:00 in Dhaka.
    expect(jobDhakaDateString(Date.UTC(2026, 10, 21, 17, 0, 0))).toBe('2026-11-21');
  });

  it('jobTodayDailyMockId is today in Dhaka', () => {
    expect(jobTodayDailyMockId(Date.UTC(2026, 10, 21, 20, 0, 0))).toBe('2026-11-22');
  });

  it('ISO week of a mid-week date', () => {
    // 2026-11-22 is a Sunday in ISO week 47 (Mon 2026-11-16).
    const w = jobIsoWeekOfDate('2026-11-22');
    expect(w.isoYear).toBe(2026);
    expect(w.isoWeek).toBe(47);
    expect(w.weekId).toBe('2026-W47');
    expect(w.weekStartDate).toBe('2026-11-16');
  });

  it('ISO week at the year boundary (2026-01-01 is week 1 of 2026)', () => {
    const w = jobIsoWeekOfDate('2026-01-01');
    expect(w.weekId).toBe('2026-W01');
    expect(w.weekStartDate).toBe('2025-12-29');
  });

  it('jobThisWeekWeeklyMockId derives from the Dhaka date', () => {
    expect(jobThisWeekWeeklyMockId(Date.UTC(2026, 10, 21, 20, 0, 0))).toBe('2026-W47');
  });

  it('weekly cycle rotates BCS → Bank → Primary → NTRCA', () => {
    expect(jobWeeklyExamForWeek(1)).toBe('bcs');
    expect(jobWeeklyExamForWeek(2)).toBe('bank');
    expect(jobWeeklyExamForWeek(3)).toBe('primary-teacher');
    expect(jobWeeklyExamForWeek(4)).toBe('ntrca');
    expect(jobWeeklyExamForWeek(5)).toBe('bcs');
    expect(jobWeeklyExamForWeek(47)).toBe('primary-teacher');
  });

  it('jobThisWeekCycleExam follows the ISO week number', () => {
    // 2026-11-22 is week 47 → Primary (47 = 4×11+3).
    expect(jobThisWeekCycleExam(Date.UTC(2026, 10, 21, 20, 0, 0))).toBe('primary-teacher');
  });
});

describe('rules-snapshot builder', () => {
  it('BCS snapshot is the faithful 200Q/120min/−0.50 copy (50th syllabus, v2)', () => {
    expect(buildJobMockRulesSnapshot('bcs')).toEqual({
      questionCount: 200,
      timeMinutes: 120,
      marksPerQuestion: 1,
      negativeMarking: 0.5,
      negativeMarkingVerified: true,
      passPercent: null,
      scoringConfigVersion: 'v2',
    });
  });

  it('Bank snapshot carries the VERIFIED −0.25 penalty (24 Nov 2026 audit)', () => {
    const s = buildJobMockRulesSnapshot('bank');
    expect(s.negativeMarking).toBe(0.25);
    expect(s.negativeMarkingVerified).toBe(true);
    expect(s.questionCount).toBe(100);
    expect(s.timeMinutes).toBe(60);
    expect(s.scoringConfigVersion).toBe('v1');
  });

  it('Primary snapshot carries passPercent 50; NTRCA 40', () => {
    expect(buildJobMockRulesSnapshot('primary-teacher').passPercent).toBe(50);
    expect(buildJobMockRulesSnapshot('ntrca').passPercent).toBe(40);
    expect(buildJobMockRulesSnapshot('ntrca').scoringConfigVersion).toBe('18th-v1');
  });

  it('daily overrides shrink the set (25Q / 25min) without touching the penalty', () => {
    const s = buildJobMockRulesSnapshot('bcs', { questionCount: 25, timeMinutes: 25 });
    expect(s.questionCount).toBe(25);
    expect(s.timeMinutes).toBe(25);
    expect(s.negativeMarking).toBe(0.5);
  });

  it('throws for an unknown exam and for out-of-range overrides', () => {
    expect(() => buildJobMockRulesSnapshot('unknown-exam')).toThrow();
    expect(() => buildJobMockRulesSnapshot('bcs', { questionCount: 0 })).toThrow();
    expect(() => buildJobMockRulesSnapshot('bcs', { questionCount: 201 })).toThrow();
    expect(() => buildJobMockRulesSnapshot('bcs', { timeMinutes: 0 })).toThrow();
  });

  it('daily kind enforces 20–30Q / 20–30min (editorial standard 25/25)', () => {
    expect(buildJobMockRulesSnapshot('bcs', { questionCount: 25, timeMinutes: 25 }, 'daily').questionCount).toBe(25);
    expect(() => buildJobMockRulesSnapshot('bcs', { questionCount: 10, timeMinutes: 25 }, 'daily')).toThrow();
    expect(() => buildJobMockRulesSnapshot('bcs', { questionCount: 25, timeMinutes: 10 }, 'daily')).toThrow();
    expect(() => buildJobMockRulesSnapshot('bcs', { questionCount: 31, timeMinutes: 25 }, 'daily')).toThrow();
  });
});

describe('validateJobMock', () => {
  it('a valid full mock passes', () => {
    const { doc, docId } = validMockDoc();
    expect(validateJobMock(doc, docId)).toEqual([]);
  });

  it('a valid daily mock passes (doc-ID = daily__ + scheduleDate)', () => {
    const { doc } = validMockDoc({
      kind: 'daily',
      bundleId: 'daily__2026-11-22',
      scheduleDate: '2026-11-22',
      rulesSnapshot: {
        questionCount: 25, timeMinutes: 25, marksPerQuestion: 1,
        negativeMarking: 0.5, negativeMarkingVerified: true,
        passPercent: null, scoringConfigVersion: 'v1',
      },
    });
    expect(validateJobMock(doc, 'daily__2026-11-22')).toEqual([]);
  });

  it('a daily mock with a 10-question snapshot is rejected (daily is 20–30Q)', () => {
    const { doc } = validMockDoc({
      kind: 'daily',
      bundleId: 'daily__2026-11-22',
      scheduleDate: '2026-11-22',
      rulesSnapshot: {
        questionCount: 10, timeMinutes: 25, marksPerQuestion: 1,
        negativeMarking: 0.5, negativeMarkingVerified: true,
        passPercent: null, scoringConfigVersion: 'v1',
      },
    });
    expect(validateJobMock(doc, 'daily__2026-11-22').length).toBeGreaterThan(0);
  });

  it('a valid weekly mock passes (cycle exam required)', () => {
    const { doc } = validMockDoc({
      kind: 'weekly',
      bundleId: 'weekly__2026-W47',
      scheduleDate: '2026-11-16',
      examSlugCycle: 'primary-teacher',
      examSlug: 'primary-teacher',
      rulesSnapshot: {
        questionCount: 90, timeMinutes: 90, marksPerQuestion: 1,
        negativeMarking: 0.25, negativeMarkingVerified: true,
        passPercent: 50, scoringConfigVersion: 'v1',
      },
    });
    expect(validateJobMock(doc, 'weekly__2026-W47')).toEqual([]);
  });

  it('rejects: wrong full doc-ID, daily without scheduleDate, weekly without cycle exam, bad snapshot, it-professional', () => {
    const { doc } = validMockDoc();
    expect(validateJobMock(doc, 'full__bcs__x').length).toBeGreaterThan(0);
    expect(validateJobMock(doc, 'full__bank__1').length).toBeGreaterThan(0);
    expect(validateJobMock({ ...doc, questionSetId: '' }, 'full__bcs__1').length).toBeGreaterThan(0);
    expect(validateJobMock({ ...doc, questionSetId: undefined }, 'full__bcs__1').length).toBeGreaterThan(0);
    const daily = validMockDoc({ kind: 'daily', bundleId: 'daily__2026-11-22', scheduleDate: null }).doc;
    expect(validateJobMock(daily, 'daily__2026-11-22').length).toBeGreaterThan(0);
    const weekly = validMockDoc({
      kind: 'weekly', bundleId: 'weekly__2026-W47', scheduleDate: '2026-11-16', examSlugCycle: null,
    }).doc;
    expect(validateJobMock(weekly, 'weekly__2026-W47').length).toBeGreaterThan(0);
    const badSnap = validMockDoc({
      rulesSnapshot: {
        questionCount: 200, timeMinutes: 120, marksPerQuestion: 1,
        negativeMarking: 0.3, negativeMarkingVerified: true,
        passPercent: null, scoringConfigVersion: 'v1',
      },
    }).doc;
    expect(validateJobMock(badSnap, 'full__bcs__1').length).toBeGreaterThan(0);
    const it = validMockDoc({ examSlug: 'it-professional' }).doc;
    expect(validateJobMock(it, 'full__it-professional__1').length).toBeGreaterThan(0);
  });

  it('rejects unknown fields and non-object docs', () => {
    const { doc } = validMockDoc({ extraField: true });
    expect(validateJobMock(doc, 'full__bcs__1').length).toBeGreaterThan(0);
    expect(validateJobMock(null, 'full__bcs__1').length).toBeGreaterThan(0);
  });
});

describe('display helpers', () => {
  it('kind labels are Bangla', () => {
    expect(jobMockKindLabelBn('daily')).toBe('দৈনিক মক');
    expect(jobMockKindLabelBn('weekly')).toBe('সাপ্তাহিক পূর্ণ মক');
    expect(jobMockKindLabelBn('full')).toBe('পূর্ণ মক');
  });

  it('pattern summary shows the verified penalty for Bank (−০.২৫), and the disabled note only for a null penalty', () => {
    const bank = buildJobMockRulesSnapshot('bank');
    expect(jobMockPatternSummaryBn(bank)).toContain('−০.২৫');
    // Disabled note: synthetic null-penalty snapshot (no live exam
    // has one since 24 Nov 2026 — Bank is verified 0.25).
    const nullPenalty = { ...bank, negativeMarking: null, negativeMarkingVerified: false };
    expect(jobMockPatternSummaryBn(nullPenalty)).toContain('নেগেটিভ মার্কিং বন্ধ');
    const bcs = buildJobMockRulesSnapshot('bcs');
    expect(jobMockPatternSummaryBn(bcs)).toContain('200টি MCQ');
    expect(jobMockPatternSummaryBn(bcs)).toContain('−০.৫০');
  });
});
