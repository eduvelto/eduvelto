// Eduvelto — Job circulars unit tests (Step 14).
//
// Every expected value is computed from the fixture dates —
// nothing is invented. The reference timeline is ChatGPT's
// example: opens 1 Dec 2026, deadline 15 Dec 2026 23:59
// (Asia/Dhaka) → 30 Nov upcoming, 1–11 Dec open, 12–15 Dec
// closing soon, after the deadline closed. All "now" values
// are fixed Dhaka midday instants, never Date.now().

import { describe, expect, it } from 'vitest';
import {
  canShowApply,
  circularApplicationStatus,
  circularDaysLeft,
  circularDeadlineLine,
  CIRCULAR_ALLOWED_KEYS,
  filterCirculars,
  formatDhakaDate,
  isCircularVerified,
  sortCirculars,
  validateCircular,
  type JobCircular,
} from '../jobCirculars';

/** Dhaka wall-clock → millis (Dhaka is UTC+6, no DST). */
function dhaka(y: number, m: number, d: number, h = 12, min = 0): number {
  return Date.UTC(y, m - 1, d, h - 6, min, 0);
}

function makeCircular(overrides: Partial<JobCircular> = {}): JobCircular {
  return {
    docId: 'c-bcs-47',
    examSlug: 'bcs',
    postTitleBn: '৪৭তম বিসিএস — সাধারণ ক্যাডার',
    postTitleEn: '47th BCS — General Cadre',
    circularNumber: '৮০.০০.০০০০.১১০.১১.০০১.২৬-১২৩',
    publishedDateMillis: dhaka(2026, 11, 20),
    applicationDeadlineMillis: dhaka(2026, 12, 15, 23, 59),
    deadlinePrecision: 'datetime',
    totalPosts: 1500,
    eligibilitySummaryBn: 'স্নাতক বা সমমান।',
    eligibilitySummaryEn: 'Bachelor degree or equivalent.',
    officialUrl: 'https://bpsc.gov.bd/circular/47',
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
    ...overrides,
  };
}

describe('circularApplicationStatus — the ChatGPT reference timeline', () => {
  const c = makeCircular();
  it('30 Nov: upcoming (application has not opened yet)', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 11, 30))).toBe('upcoming');
  });
  it('1 Dec: open', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 1))).toBe('open');
  });
  it('11 Dec: still open (more than 3 days left)', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 11))).toBe('open');
  });
  it('12 Dec: closing soon (within 3 days)', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 12))).toBe('closing-soon');
  });
  it('15 Dec: closing soon on the deadline day', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 15))).toBe('closing-soon');
  });
  it('16 Dec: closed', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 16))).toBe('closed');
  });
  it('no deadline: unknown — never guessed', () => {
    expect(circularApplicationStatus(makeCircular({ applicationDeadlineMillis: null }), dhaka(2026, 12, 1))).toBe('unknown');
  });
});

describe('date-only deadlines never invent a closing time', () => {
  const c = makeCircular({ deadlinePrecision: 'date_only', applicationDeadlineMillis: dhaka(2026, 12, 15, 0, 0) });
  it('the whole deadline day counts as open (closing soon, not closed)', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 15, 18, 0))).toBe('closing-soon');
  });
  it('the day after the deadline date is closed', () => {
    expect(circularApplicationStatus(c, dhaka(2026, 12, 16, 0, 30))).toBe('closed');
  });
  it('days left on the deadline day is 0', () => {
    expect(circularDaysLeft(c, dhaka(2026, 12, 15, 9, 0))).toBe(0);
  });
  it('days left 3 days before is 3', () => {
    expect(circularDaysLeft(c, dhaka(2026, 12, 12, 9, 0))).toBe(3);
  });
});

describe('verification: published is not verified', () => {
  it('verifiedBy present → verified', () => {
    expect(isCircularVerified(makeCircular())).toBe(true);
  });
  it('published without verifiedBy → NOT verified', () => {
    expect(isCircularVerified(makeCircular({ verifiedBy: null, verifiedAtMillis: null }))).toBe(false);
  });
});

describe('canShowApply — non-negotiable #3', () => {
  const now = dhaka(2026, 12, 5);
  it('verified + applyUrl + open → Apply shown', () => {
    expect(canShowApply(makeCircular(), now)).toBe(true);
  });
  it('unverified → no Apply', () => {
    expect(canShowApply(makeCircular({ verifiedBy: null }), now)).toBe(false);
  });
  it('no applyUrl → no Apply (the PDF is not the portal)', () => {
    expect(canShowApply(makeCircular({ applyUrl: null }), now)).toBe(false);
  });
  it('closed → no Apply', () => {
    expect(canShowApply(makeCircular(), dhaka(2026, 12, 20))).toBe(false);
  });
  it('unknown deadline → no Apply', () => {
    expect(canShowApply(makeCircular({ applicationDeadlineMillis: null }), now)).toBe(false);
  });
  it('upcoming → no Apply yet', () => {
    expect(canShowApply(makeCircular(), dhaka(2026, 11, 25))).toBe(false);
  });
});

describe('circularDeadlineLine', () => {
  it('unknown deadline says the deadline could not be confirmed', () => {
    const line = circularDeadlineLine(makeCircular({ applicationDeadlineMillis: null }), dhaka(2026, 12, 1));
    expect(line.bn).toContain('তথ্য পাওয়া যায়নি');
  });
  it('deadline day says আজ শেষ দিন', () => {
    expect(circularDeadlineLine(makeCircular(), dhaka(2026, 12, 15)).bn).toBe('আজ শেষ দিন');
  });
  it('3 days left says আর ৩ দিন বাকি', () => {
    expect(circularDeadlineLine(makeCircular(), dhaka(2026, 12, 12)).bn).toBe('আর ৩ দিন বাকি');
  });
  it('closed says আবেদনের সময় শেষ', () => {
    expect(circularDeadlineLine(makeCircular(), dhaka(2026, 12, 20)).bn).toBe('আবেদনের সময় শেষ');
  });
});

describe('validateCircular mirrors the rules allowlist', () => {
  function storedDoc(): Record<string, unknown> {
    const c = makeCircular();
    return {
      examSlug: c.examSlug,
      postTitleBn: c.postTitleBn,
      postTitleEn: c.postTitleEn,
      circularNumber: c.circularNumber,
      publishedDate: new Date(c.publishedDateMillis!),
      applicationDeadline: new Date(c.applicationDeadlineMillis!),
      deadlinePrecision: c.deadlinePrecision,
      totalPosts: c.totalPosts,
      eligibilitySummaryBn: c.eligibilitySummaryBn,
      eligibilitySummaryEn: c.eligibilitySummaryEn,
      officialUrl: c.officialUrl,
      applyUrl: c.applyUrl,
      copyStatus: c.copyStatus,
      copyTextExcerpt: c.copyTextExcerpt,
      reviewStatus: c.reviewStatus,
      verifiedBy: c.verifiedBy,
      verifiedAt: new Date(c.verifiedAtMillis!),
      examDate: c.examDateMillis,
      applicationStartDate: new Date(c.applicationStartDateMillis!),
      authorId: c.authorId,
      createdAt: new Date(c.createdAtMillis!),
      updatedAt: new Date(c.updatedAtMillis!),
    };
  }
  it('a complete valid doc has no problems', () => {
    expect(validateCircular(storedDoc(), 'c-bcs-47')).toEqual([]);
  });
  it('every allowed key is in the allowlist (no drift)', () => {
    for (const k of Object.keys(storedDoc())) {
      expect(CIRCULAR_ALLOWED_KEYS).toContain(k);
    }
  });
  it('a bogus reviewStatus is a problem', () => {
    expect(validateCircular({ ...storedDoc(), reviewStatus: 'Published' }, 'x').length).toBeGreaterThan(0);
  });
  it('an unexpected key is a problem', () => {
    expect(validateCircular({ ...storedDoc(), applicationStatus: 'open' }, 'x').length).toBeGreaterThan(0);
  });
  it('a negative post count is a problem', () => {
    expect(validateCircular({ ...storedDoc(), totalPosts: -5 }, 'x').length).toBeGreaterThan(0);
  });
  it('an empty officialUrl is a problem', () => {
    expect(validateCircular({ ...storedDoc(), officialUrl: '' }, 'x').length).toBeGreaterThan(0);
  });
});

describe('sortCirculars + filterCirculars', () => {
  const verified = makeCircular({ docId: 'v1', publishedDateMillis: dhaka(2026, 11, 20) });
  const unverified = makeCircular({
    docId: 'u1',
    verifiedBy: null,
    verifiedAtMillis: null,
    publishedDateMillis: dhaka(2026, 11, 25),
  });
  const bank = makeCircular({ docId: 'b1', examSlug: 'bank', postTitleBn: 'ব্যাংক অফিসার', postTitleEn: 'Bank Officer' });
  it('verified sorts before unverified even when older', () => {
    expect(sortCirculars([unverified, verified]).map((c) => c.docId)).toEqual(['v1', 'u1']);
  });
  it('exam filter keeps only that exam', () => {
    expect(filterCirculars([verified, bank], { examSlug: 'bank', status: null, verifiedOnly: false, search: '' }).map((c) => c.docId)).toEqual(['b1']);
  });
  it('verifiedOnly drops unverified', () => {
    expect(filterCirculars([verified, unverified], { examSlug: null, status: null, verifiedOnly: true, search: '' }).map((c) => c.docId)).toEqual(['v1']);
  });
  it('status filter uses the computed status', () => {
    const now = dhaka(2026, 12, 20);
    expect(filterCirculars([verified], { examSlug: null, status: 'closed', verifiedOnly: false, search: '' }, now).length).toBe(1);
    expect(filterCirculars([verified], { examSlug: null, status: 'open', verifiedOnly: false, search: '' }, now).length).toBe(0);
  });
  it('search matches Bangla title', () => {
    expect(filterCirculars([verified, bank], { examSlug: null, status: null, verifiedOnly: false, search: 'ব্যাংক' }).map((c) => c.docId)).toEqual(['b1']);
  });
});

describe('formatDhakaDate always shows the year', () => {
  it('Bangla date includes ২০২৬', () => {
    expect(formatDhakaDate(dhaka(2026, 12, 15), 'bn', false)).toContain('২০২৬');
  });
  it('datetime includes the time', () => {
    expect(formatDhakaDate(dhaka(2026, 12, 15, 18, 0), 'bn', true)).toContain('৬:০০');
  });
});
