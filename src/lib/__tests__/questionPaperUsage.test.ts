// Question Paper Generator — usage stand-in, Pro orders, typo reports,
// chapter cache, logo budget. The demo quota is LOCAL (clearly
// labelled); the Firestore collections + rules are branch-only.
import { describe, it, expect } from 'vitest';
import {
  QPG_DEMO_USAGE_KEY,
  getDemoUsage,
  listDemoReports,
  qpgCurrentMonth,
  recordDemoFreeDownload,
  saveDemoReport,
  validateQpgProOrder,
  validateQpgReport,
} from '../questionPaperUsage';
import {
  QPG_CACHE_VERSION,
  getCachedChapterQuestions,
  invalidateQpgChapterCache,
  loadVerifiedChapterQuestions,
  qpgCacheKey,
  setCachedChapterQuestions,
} from '../questionPaperCache';
import { QPG_LOGO_MAX_BYTES, isLogoWithinBudget, logoDataUrlBytes } from '../questionPaperLogo';
import { QPG_VERIFIED_CHAPTER_ID } from '../questionPaper';

describe('demo usage stand-in (local, 3/month)', () => {
  it('starts at 0 used with 3 remaining and labels its enforcement', () => {
    const u = getDemoUsage('test-user-usage-1');
    expect(u.enforcement).toBe('DEMO (local)');
    expect(u.limit).toBe(3);
    expect(u.used).toBe(0);
    expect(u.remaining).toBe(3);
    expect(u.month).toBe(qpgCurrentMonth());
  });

  it('allows 3 downloads then refuses the 4th', () => {
    const uid = 'test-user-usage-2';
    for (let i = 0; i < 3; i++) {
      expect(recordDemoFreeDownload(uid).allowed).toBe(true);
    }
    const fourth = recordDemoFreeDownload(uid);
    expect(fourth.allowed).toBe(false);
    expect(fourth.usage.used).toBe(3);
    expect(fourth.usage.remaining).toBe(0);
  });

  it('rolls over to a new month', () => {
    const uid = 'test-user-usage-3';
    recordDemoFreeDownload(uid, new Date('2026-11-25T10:00:00+06:00'));
    const next = getDemoUsage(uid, new Date('2026-12-01T10:00:00+06:00'));
    expect(next.used).toBe(0);
    expect(next.month).toBe('2026-12');
  });

  it('uses a distinct demo key (never the Firestore collection name alone)', () => {
    expect(QPG_DEMO_USAGE_KEY).toContain('demo');
  });
});

describe('Pro order validation (branch-only Firestore shape)', () => {
  it('accepts a correct pending-review order', () => {
    expect(
      validateQpgProOrder({
        uid: 'u1', plan: 'monthly', amountBdt: 199,
        paymentMethod: 'bkash', trxId: 'ABC1234567', status: 'pending-review',
      }),
    ).toEqual([]);
  });

  it('rejects a wrong amount for the plan', () => {
    const problems = validateQpgProOrder({
      uid: 'u1', plan: 'monthly', amountBdt: 49,
      paymentMethod: 'bkash', trxId: 'ABC1234567', status: 'pending-review',
    });
    expect(problems.join(' ')).toContain('199');
  });

  it('rejects per-paper at the monthly price and short TrxIDs', () => {
    expect(
      validateQpgProOrder({
        uid: 'u1', plan: 'per-paper', amountBdt: 199,
        paymentMethod: 'nagad', trxId: 'ABC', status: 'pending-review',
      }).length,
    ).toBeGreaterThan(0);
  });

  it('accepts a correct pending-review order for a class tier', () => {
    expect(
      validateQpgProOrder({
        uid: 'u1', plan: 'class-3', amountBdt: 150,
        paymentMethod: 'bkash', trxId: 'ABC1234567', status: 'pending-review',
      }),
    ).toEqual([]);
    expect(
      validateQpgProOrder({
        uid: 'u1', plan: 'coaching-3-12', amountBdt: 1500,
        paymentMethod: 'nagad', trxId: 'ABC1234567', status: 'pending-review',
      }),
    ).toEqual([]);
  });

  it('rejects orders that do not start as pending-review', () => {
    expect(
      validateQpgProOrder({
        uid: 'u1', plan: 'class-3', amountBdt: 150,
        paymentMethod: 'bkash', trxId: 'ABC1234567', status: 'approved',
      }).length,
    ).toBeGreaterThan(0);
  });
});

describe('typo reports (never auto-publish)', () => {
  it('validates the report shape', () => {
    expect(
      validateQpgReport({
        reporterId: 'u1', questionId: 'bcs-eng-001', chapterId: QPG_VERIFIED_CHAPTER_ID,
        reason: 'typo', details: 'বানান ভুল', status: 'open',
      }),
    ).toEqual([]);
    expect(
      validateQpgReport({
        reporterId: 'u1', questionId: 'bcs-eng-001', chapterId: QPG_VERIFIED_CHAPTER_ID,
        reason: 'nonsense' as never, details: '', status: 'open',
      }).length,
    ).toBeGreaterThan(0);
  });

  it('demo reports save locally as open, never resolved', () => {
    const before = listDemoReports().length;
    const res = saveDemoReport({
      reporterId: 'u1', questionId: 'bcs-eng-002', chapterId: QPG_VERIFIED_CHAPTER_ID,
      reason: 'wrong-answer', details: 'উত্তর B হওয়া উচিত',
    });
    expect(res.saved).toBe(true);
    const after = listDemoReports();
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].status).toBe('open');
  });
});

describe('chapter cache (sessionStorage, versioned)', () => {
  it('keys are per chapter (stream/class/subject/chapter)', () => {
    expect(qpgCacheKey('general', 'honours', 'english', 'bcs-english-batch1')).toBe(
      `eduvelto-qpg-cache:${QPG_CACHE_VERSION}:general/honours/english/bcs-english-batch1`,
    );
  });

  it('cache-first loader returns the 35 verified questions and caches them', () => {
    invalidateQpgChapterCache();
    const first = loadVerifiedChapterQuestions({
      stream: 'general', classId: 'honours', subjectId: 'english', chapterId: QPG_VERIFIED_CHAPTER_ID,
    });
    expect(first).toHaveLength(35);
    const cached = getCachedChapterQuestions('general', 'honours', 'english', QPG_VERIFIED_CHAPTER_ID);
    expect(cached).toHaveLength(35);
    const second = loadVerifiedChapterQuestions({
      stream: 'general', classId: 'honours', subjectId: 'english', chapterId: QPG_VERIFIED_CHAPTER_ID,
    });
    expect(second).toEqual(first);
  });

  it('set/get round-trips and invalidation clears', () => {
    setCachedChapterQuestions('general', 'honours', 'english', 'tmp-ch', []);
    expect(getCachedChapterQuestions('general', 'honours', 'english', 'tmp-ch')).toEqual([]);
    invalidateQpgChapterCache('general', 'honours', 'english', 'tmp-ch');
    expect(getCachedChapterQuestions('general', 'honours', 'english', 'tmp-ch')).toBeNull();
  });
});

describe('logo budget (<50KB, client-side only)', () => {
  it('measures a data URL in bytes', () => {
    // 'aGVsbG8=' is base64 for 'hello' (5 bytes).
    expect(logoDataUrlBytes('data:image/png;base64,aGVsbG8=')).toBe(5);
  });

  it('a small data URL fits the 50KB budget, a huge one does not', () => {
    const small = `data:image/webp;base64,${'A'.repeat(1000)}`;
    expect(isLogoWithinBudget(small)).toBe(true);
    expect(QPG_LOGO_MAX_BYTES).toBe(50_000);
    const huge = `data:image/webp;base64,${'A'.repeat(100_000)}`;
    expect(isLogoWithinBudget(huge)).toBe(false);
  });
});
