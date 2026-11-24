// Live Exam config — design-live-exam-dashboard.md §1.6, §2.3,
// §3.8, §6 item 6. Pure (no Firestore).
import { describe, expect, it } from 'vitest';
import {
  BANK_POST_OPTIONS,
  LIVE_EXAM_SELECTION_PATH,
  PERSONALISED_SELECTION_GATES,
  isBankPostSlug,
  isLiveExamMock,
  isPersonalisedSelectionAvailable,
  liveExamEligibility,
  liveExamHonestGapBn,
  liveExamPassMarkLine,
  liveExamPatternLineBn,
  liveExamSetKindLabel,
  liveExamWindowForMock,
  liveExamWindowLabelBn,
  liveExamWindowState,
  partialMockLabelBn,
  resolveLiveExamPattern,
  validateLiveExamWindow,
  variantIdFromMock,
} from '../jobLiveExam';
import type { JobMockWithId } from '../jobMocks';

function mockDoc(overrides: Partial<JobMockWithId> = {}): JobMockWithId {
  return {
    docId: 'full__bank__1',
    examSlug: 'bank',
    titleBn: 'ব্যাংক পূর্ণ মক ১',
    titleEn: 'Bank full mock 1',
    kind: 'full',
    bundleId: 'mock__full__bank__1',
    questionSetId: 'full__bank__1_v1',
    rulesSnapshot: {
      questionCount: 100,
      timeMinutes: 60,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
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
  };
}

describe('Bank post selector (§0.1 decision)', () => {
  it('offers exactly the three verified Bank patterns (config choice, not new hubs)', () => {
    expect(BANK_POST_OPTIONS.map((o) => o.slug)).toEqual([
      'bank',
      'bank-senior-officer',
      'bank-assistant-director',
    ]);
    expect(isBankPostSlug('bank-senior-officer')).toBe(true);
    expect(isBankPostSlug('bcs')).toBe(false);
    expect(isBankPostSlug('grade_11_20')).toBe(false);
  });

  it('resolves the post pattern for bank, and the hub pattern otherwise', () => {
    const officer = resolveLiveExamPattern('bank', 'bank');
    expect(officer?.questionCount).toBe(100);
    expect(officer?.negativeMarking).toBe(0.25);
    const so = resolveLiveExamPattern('bank', 'bank-senior-officer')!;
    expect(so.questionCount).toBe(100);
    expect(so.timeMinutes).toBe(60);
    expect(so.negativeMarking).toBe(0.25);
    const ad = resolveLiveExamPattern('bank', 'bank-assistant-director')!;
    expect(ad.questionCount).toBe(100);
    // A non-Bank exam ignores the post slug entirely.
    expect(resolveLiveExamPattern('bcs', 'bank-senior-officer')?.questionCount).toBe(200);
    expect(resolveLiveExamPattern('bcs')?.questionCount).toBe(200);
    expect(resolveLiveExamPattern('dgfood')).toBeNull();
    expect(resolveLiveExamPattern('no-such-exam')).toBeNull();
  });

  it('formats the pattern line + pass-mark line honestly', () => {
    expect(liveExamPatternLineBn(resolveLiveExamPattern('bcs')!)).toBe('200টি MCQ · 120 মিনিট · ভুলে −০.৫০');
    expect(liveExamPatternLineBn(resolveLiveExamPattern('bank')!)).toBe('100টি MCQ · 60 মিনিট · ভুলে −০.২৫');
    expect(liveExamPassMarkLine(resolveLiveExamPattern('bcs')!)).toBeNull();
    expect(liveExamPassMarkLine(resolveLiveExamPattern('bank')!)).toBeNull();
    expect(liveExamPassMarkLine(resolveLiveExamPattern('primary-teacher')!)?.percent).toBe(50);
    expect(liveExamPassMarkLine(resolveLiveExamPattern('ntrca')!)?.percent).toBe(40);
  });
});

describe('scheduled window (§1.6)', () => {
  it('validates: end must be after start', () => {
    expect(validateLiveExamWindow(null)).toEqual([]);
    expect(validateLiveExamWindow({ startAtMillis: 1000, endAtMillis: 2000 })).toEqual([]);
    expect(validateLiveExamWindow({ startAtMillis: 2000, endAtMillis: 2000 }).length).toBeGreaterThan(0);
    expect(validateLiveExamWindow({ startAtMillis: 3000, endAtMillis: 2000 }).length).toBeGreaterThan(0);
    expect(validateLiveExamWindow({ startAtMillis: NaN, endAtMillis: 2000 }).length).toBeGreaterThan(0);
  });

  it('states: null window is on-demand; the window gates START only', () => {
    expect(liveExamWindowState(null, 1500)).toBe('on-demand');
    const w = { startAtMillis: 1000, endAtMillis: 2000 };
    expect(liveExamWindowState(w, 999)).toBe('not-started');
    expect(liveExamWindowState(w, 1000)).toBe('open');
    expect(liveExamWindowState(w, 2000)).toBe('open');
    expect(liveExamWindowState(w, 2001)).toBe('ended');
    expect(liveExamWindowLabelBn('on-demand', null)).toBe('যেকোনো সময় দেওয়া যাবে');
    expect(liveExamWindowLabelBn('not-started', w)).toContain('শুরু হয়নি');
    expect(liveExamWindowLabelBn('ended', w)).toContain('সময় শেষ');
  });

  it('no mock doc carries a window today (rules onlyKeys — see the module header)', () => {
    expect(liveExamWindowForMock(mockDoc())).toBeNull();
  });
});

describe('eligibility ladder (§2.3) — never a fake full mock', () => {
  it('full when every subject quota is met', () => {
    const el = liveExamEligibility({
      examSlug: 'bank',
      eligibleBySubject: new Map([
        ['bangla', 25],
        ['english', 25],
        ['math', 20],
        ['general-knowledge', 20],
        ['ict', 10],
      ]),
    })!;
    expect(el.level).toBe('full');
    expect(el.labelBn).toBe('পূর্ণাঙ্গ মক — 100 প্রশ্ন');
  });

  it('partial at ≥50% with every subject ≥1 (today’s live position is none, not partial)', () => {
    const el = liveExamEligibility({
      examSlug: 'bank',
      eligibleBySubject: new Map([
        ['bangla', 15],
        ['english', 15],
        ['math', 10],
        ['general-knowledge', 10],
        ['ict', 5],
      ]),
    })!;
    expect(el.level).toBe('partial');
    expect(el.eligibleTotal).toBe(55);
    expect(el.labelBn).toBe('আংশিক মক — 55/100 প্রশ্ন (ব্যাংকে প্রশ্ন কম)');
  });

  it('none below 50%, or when any subject has 0 eligible questions', () => {
    const belowHalf = liveExamEligibility({
      examSlug: 'bank',
      eligibleBySubject: new Map([
        ['bangla', 10],
        ['english', 10],
        ['math', 8],
        ['general-knowledge', 8],
        ['ict', 4],
      ]),
    })!;
    expect(belowHalf.level).toBe('none');
    expect(belowHalf.labelBn).toContain('মক এখনো তৈরি হয়নি');
    const zeroSubject = liveExamEligibility({
      examSlug: 'bank',
      eligibleBySubject: new Map([
        ['bangla', 60],
        ['english', 30],
        ['math', 20],
        ['general-knowledge', 20],
        ['ict', 0],
      ]),
    })!;
    expect(zeroSubject.level).toBe('none');
  });

  it('live position (35 BCS English only) is none for every exam', () => {
    const bcs = liveExamEligibility({
      examSlug: 'bcs',
      eligibleBySubject: new Map([['english', 35]]),
    })!;
    expect(bcs.level).toBe('none');
    expect(bcs.eligibleTotal).toBe(35);
    expect(liveExamHonestGapBn(35, 200)).toBe('এই পরীক্ষার মক এখনো তৈরি হয়নি — ব্যাংকে 35/200 প্রশ্ন আছে');
  });

  it('returns null for an exam with no verified selection rules', () => {
    expect(liveExamEligibility({ examSlug: 'grade_11_20', eligibleBySubject: new Map() })).toBeNull();
    expect(liveExamEligibility({ examSlug: 'no-such-exam', eligibleBySubject: new Map() })).toBeNull();
  });

  it('partial label carries exact numbers', () => {
    expect(partialMockLabelBn(100, 200)).toBe('আংশিক মক — 100/200 প্রশ্ন (ব্যাংকে প্রশ্ন কম)');
  });
});

describe('variant derivation + set kind', () => {
  it('derives the variant number from the mock doc-ID (no stored field)', () => {
    expect(variantIdFromMock(mockDoc({ docId: 'full__bank__3' }))).toBe(3);
    expect(variantIdFromMock(mockDoc({ docId: 'full__primary-teacher__12' }))).toBe(12);
    expect(variantIdFromMock(mockDoc({ docId: 'full__bank__x' }))).toBeNull();
    expect(variantIdFromMock(mockDoc({ kind: 'daily', docId: 'daily__2026-11-24' }))).toBeNull();
    expect(isLiveExamMock(mockDoc())).toBe(true);
    expect(isLiveExamMock(mockDoc({ kind: 'daily' }))).toBe(false);
  });

  it('labels the shared set honestly; personalised is defined but never offered', () => {
    expect(liveExamSetKindLabel('shared')).toBe('সাধারণ সেট — সব শিক্ষার্থীর জন্য একই সেট');
    expect(liveExamSetKindLabel('personalised')).toContain('ব্যক্তিগত সেট');
  });
});

describe('§3.8 gates — the verdict', () => {
  it('all three gates fail, so the variant pool ships and personalised selection does not', () => {
    expect(PERSONALISED_SELECTION_GATES.map((g) => g.gate)).toEqual([1, 2, 3]);
    expect(PERSONALISED_SELECTION_GATES.every((g) => g.verdict === 'fail')).toBe(true);
    expect(isPersonalisedSelectionAvailable()).toBe(false);
    expect(LIVE_EXAM_SELECTION_PATH).toBe('variant-pool');
  });
});
