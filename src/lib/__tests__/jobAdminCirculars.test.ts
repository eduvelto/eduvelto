// Eduvelto — Step 15 admin circular logic unit tests.
//
// Pure-logic coverage: dedupe keys, sensitive-field diffs, the
// no-self-approval guard, form validation, and the evidence-based
// verification checklist. Firestore-touching functions are covered
// by the emulator rules suite (rules-step15-admin.test.ts), not here.

import { describe, expect, it } from 'vitest';
import {
  canApproveCircular,
  circularDedupeKey,
  diffSensitiveCircularFields,
  findDuplicateCirculars,
  validateCircularForm,
  type CircularFormData,
} from '../jobAdminCirculars';
import {
  emptyVerificationChecklist,
  firstBlockingChecklistItem,
  isVerificationChecklistComplete,
  type JobCircular,
  type VerificationChecklist,
} from '../jobCirculars';

function dhaka(y: number, m: number, d: number, h = 12, min = 0): number {
  return Date.UTC(y, m - 1, d, h - 6, min, 0);
}

function makeCircular(overrides: Partial<JobCircular> = {}): JobCircular {
  return {
    docId: 'c1',
    examSlug: 'bcs',
    postTitleBn: 'বিসিএস পরীক্ষা',
    postTitleEn: 'BCS Examination',
    circularNumber: '47',
    publishedDateMillis: dhaka(2026, 11, 1),
    applicationStartDateMillis: dhaka(2026, 12, 1),
    applicationDeadlineMillis: dhaka(2026, 12, 15, 23, 59),
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক',
    eligibilitySummaryEn: 'Bachelor degree',
    officialUrl: 'https://bpsc.gov.bd/notice/47',
    applyUrl: 'https://bpsc.teletalk.com.bd/apply',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    examDateMillis: null,
    reviewStatus: 'in-review',
    authorId: 'editor-1',
    verifiedBy: null,
    verifiedAtMillis: null,
    updatedAtMillis: dhaka(2026, 11, 20),
    createdAtMillis: dhaka(2026, 11, 1),
    verificationChecklist: null,
    reviewNote: null,
    lastEditedBy: 'editor-1',
    ...overrides,
  };
}

function makeForm(overrides: Partial<CircularFormData> = {}): CircularFormData {
  return {
    examSlug: 'bcs',
    postTitleBn: 'বিসিএস পরীক্ষা',
    postTitleEn: 'BCS Examination',
    circularNumber: '47',
    publishedDateMillis: dhaka(2026, 11, 1),
    applicationStartDateMillis: dhaka(2026, 12, 1),
    applicationDeadlineMillis: dhaka(2026, 12, 15, 23, 59),
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক',
    eligibilitySummaryEn: 'Bachelor degree',
    officialUrl: 'https://bpsc.gov.bd/notice/47',
    applyUrl: 'https://bpsc.teletalk.com.bd/apply',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    examDateMillis: null,
    ...overrides,
  };
}

describe('circularDedupeKey', () => {
  it('normalises memo numbers (whitespace + case) and uses the published year', () => {
    const a = circularDedupeKey({ examSlug: 'bcs', circularNumber: ' 47 ', publishedDateMillis: dhaka(2026, 11, 1) });
    const b = circularDedupeKey({ examSlug: 'bcs', circularNumber: '47', publishedDateMillis: dhaka(2026, 6, 1) });
    expect(a).toBe(b);
    expect(a).toBe('bcs__47__2026');
  });

  it('returns null without a memo number — no key is invented', () => {
    expect(circularDedupeKey({ examSlug: 'bcs', circularNumber: null, publishedDateMillis: dhaka(2026, 11, 1) })).toBeNull();
    expect(circularDedupeKey({ examSlug: 'bcs', circularNumber: '   ', publishedDateMillis: null })).toBeNull();
  });

  it('uses "unknown" for the year when no published date is stored', () => {
    expect(circularDedupeKey({ examSlug: 'bcs', circularNumber: '47', publishedDateMillis: null })).toBe('bcs__47__unknown');
  });
});

describe('findDuplicateCirculars', () => {
  it('exact key match wins over similarity', () => {
    const target = makeCircular();
    const same = makeCircular({ docId: 'c2' });
    const other = makeCircular({
      docId: 'c3',
      circularNumber: '48',
      postTitleBn: 'প্রাথমিক শিক্ষক নিয়োগ',
      postTitleEn: 'Primary Teacher Recruitment',
      applicationDeadlineMillis: dhaka(2027, 2, 1, 23, 59),
    });
    const found = findDuplicateCirculars(target, [same, other]);
    expect(found).toHaveLength(1);
    expect(found[0].circular.docId).toBe('c2');
    expect(found[0].match).toBe('exact-key');
  });

  it('similar title + deadline within 7 days is a candidate; far deadline is not', () => {
    const target = makeCircular({ circularNumber: null });
    const near = makeCircular({
      docId: 'c2',
      circularNumber: null,
      postTitleBn: 'বিসিএস পরীক্ষা ২০২৬',
      applicationDeadlineMillis: dhaka(2026, 12, 18, 23, 59),
    });
    const far = makeCircular({
      docId: 'c3',
      circularNumber: null,
      postTitleBn: 'বিসিএস পরীক্ষা ২০২৬',
      applicationDeadlineMillis: dhaka(2027, 2, 1, 23, 59),
    });
    const found = findDuplicateCirculars(target, [near, far]);
    expect(found.map((f) => f.circular.docId)).toEqual(['c2']);
    expect(found[0].match).toBe('similar');
  });

  it('never returns the circular itself', () => {
    expect(findDuplicateCirculars(makeCircular(), [makeCircular()], 'c1')).toHaveLength(0);
  });
});

describe('diffSensitiveCircularFields', () => {
  it('reports only sensitive changes, old → new', () => {
    const before = makeCircular();
    const after = makeCircular({ totalPosts: 120, officialUrl: 'https://bpsc.gov.bd/notice/47b' });
    const diffs = diffSensitiveCircularFields(before, after);
    // SENSITIVE_CIRCULAR_FIELDS order: officialUrl before totalPosts.
    expect(diffs.map((d) => d.field)).toEqual(['officialUrl', 'totalPosts']);
    expect(diffs[1].previousValue).toBe('100');
    expect(diffs[1].newValue).toBe('120');
    expect(diffs[0].previousValue).toBe('https://bpsc.gov.bd/notice/47');
    expect(diffs[0].newValue).toBe('https://bpsc.gov.bd/notice/47b');
  });

  it('ignores non-sensitive edits (title, eligibility)', () => {
    const before = makeCircular();
    const after = makeCircular({ postTitleBn: 'বিসিএস পরীক্ষা ২০২৬', eligibilitySummaryBn: 'স্নাতক পাস' });
    expect(diffSensitiveCircularFields(before, after)).toHaveLength(0);
  });
});

describe('canApproveCircular — no self-approval', () => {
  it('a verifier who is not the author or last editor may approve', () => {
    const guard = canApproveCircular(makeCircular(), 'verifier-9', false, null);
    expect(guard.allowed).toBe(true);
    expect(guard.reasonBn).toBeNull();
  });

  it('the author may not approve their own circular', () => {
    const guard = canApproveCircular(makeCircular(), 'editor-1', false, null);
    expect(guard.allowed).toBe(false);
    expect(guard.reasonBn).toMatch(/নিজের/);
  });

  it('the last editor may not approve, even if they did not author it', () => {
    const guard = canApproveCircular(makeCircular({ authorId: 'editor-2' }), 'editor-1', false, null);
    expect(guard.allowed).toBe(false);
  });

  it('the owner may override with a reason of at least 10 characters', () => {
    const noReason = canApproveCircular(makeCircular(), 'editor-1', true, '');
    expect(noReason.allowed).toBe(false);
    const withReason = canApproveCircular(makeCircular(), 'editor-1', true, 'দ্বিতীয় যাচাইকারী দেখেছেন, উৎস সঠিক');
    expect(withReason.allowed).toBe(true);
  });
});

describe('validateCircularForm', () => {
  it('a complete form has no problems', () => {
    expect(validateCircularForm(makeForm())).toHaveLength(0);
  });

  it('rejects an invalid official URL', () => {
    const problems = validateCircularForm(makeForm({ officialUrl: 'not a url' }));
    expect(problems.some((p) => p.includes('অফিসিয়াল লিংক'))).toBe(true);
  });

  it('rejects a deadline before the start date and a negative post count', () => {
    const problems = validateCircularForm(
      makeForm({ applicationDeadlineMillis: dhaka(2026, 11, 15), totalPosts: -5 }),
    );
    expect(problems.some((p) => p.includes('শেষ তারিখ'))).toBe(true);
    expect(problems.some((p) => p.includes('পদসংখ্যা'))).toBe(true);
  });

  it('rejects a missing title / official link', () => {
    const problems = validateCircularForm(makeForm({ postTitleBn: '  ', officialUrl: '' }));
    expect(problems.length).toBeGreaterThanOrEqual(2);
  });
});

describe('verification checklist — evidence-based, never a bare checkbox', () => {
  it('empty checklist is incomplete and reports the first blocking item', () => {
    const c = emptyVerificationChecklist();
    expect(isVerificationChecklistComplete(c)).toBe(false);
    expect(firstBlockingChecklistItem(c)).toBe('orgConfirmed');
  });

  it('all pass is complete; all pass-or-na is complete', () => {
    const allPass: VerificationChecklist = {
      orgConfirmed: 'pass',
      sourceOpened: 'pass',
      postCountChecked: 'pass',
      openingDateChecked: 'pass',
      deadlineChecked: 'pass',
      applyLinkChecked: 'pass',
      amendmentsChecked: 'pass',
      notes: {},
      checkedBy: 'verifier-9',
      checkedAtMillis: dhaka(2026, 11, 20),
    };
    expect(isVerificationChecklistComplete(allPass)).toBe(true);
    const withNa: VerificationChecklist = { ...allPass, openingDateChecked: 'na', notes: { openingDateChecked: 'বিজ্ঞপ্তিতে শুরুর তারিখ নেই' } };
    expect(isVerificationChecklistComplete(withNa)).toBe(true);
  });

  it('one fail or one uncertain blocks approval', () => {
    const base: VerificationChecklist = {
      orgConfirmed: 'pass',
      sourceOpened: 'pass',
      postCountChecked: 'pass',
      openingDateChecked: 'pass',
      deadlineChecked: 'pass',
      applyLinkChecked: 'pass',
      amendmentsChecked: 'pass',
      notes: {},
      checkedBy: 'verifier-9',
      checkedAtMillis: dhaka(2026, 11, 20),
    };
    expect(isVerificationChecklistComplete({ ...base, deadlineChecked: 'fail' })).toBe(false);
    expect(firstBlockingChecklistItem({ ...base, applyLinkChecked: 'uncertain' })).toBe('applyLinkChecked');
  });
});
