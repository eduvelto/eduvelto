// Eduvelto — Step 15 student reports + corrections unit tests.
//
// Covers the validators and the stored-shape parsers (the
// Firestore writes themselves are covered by the emulator rules
// suite, rules-step15-admin.test.ts). A report is a SIGNAL —
// deciding one never writes the student's suggestion into the
// circular; that guarantee is enforced by the decide* functions'
// shape (they only update the report/correction doc) and by the
// rules suite.

import { describe, expect, it } from 'vitest';
import {
  JOB_REPORT_REASONS,
  jobCorrectionFromStored,
  jobReportFromStored,
  validateJobReport,
} from '../jobReports';

function validReportRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    reporterId: 'student-1',
    targetType: 'jobCircular',
    targetId: 'c1',
    targetAuthorId: 'editor-1',
    reason: 'wrong-deadline',
    details: 'শেষ তারিখ ২০ ডিসেম্বর, ১৫ নয়',
    suggestedValue: '2026-12-20',
    evidenceUrl: 'https://bpsc.gov.bd/notice/47',
    status: 'open',
    priority: 'normal',
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe('validateJobReport', () => {
  it('a complete wrong-deadline report is valid', () => {
    expect(validateJobReport(validReportRecord())).toHaveLength(0);
  });

  it('rejects an unknown reason and a missing reporter', () => {
    const problems = validateJobReport(validReportRecord({ reason: 'made-up', reporterId: '' }));
    expect(problems.length).toBe(2);
  });

  it('rejects details over 2000 characters and an unexpected key', () => {
    const problems = validateJobReport(validReportRecord({ details: 'x'.repeat(2001), circularId: 'c1' }));
    expect(problems.length).toBe(2);
    expect(problems.some((p) => p.includes('2000'))).toBe(true);
    expect(problems.some((p) => p.includes('circularId'))).toBe(true);
  });

  it('the reason enum is the hyphenated set the rules enforce', () => {
    expect(JOB_REPORT_REASONS).toContain('wrong-deadline');
    expect(JOB_REPORT_REASONS).toContain('wrong-post-count');
    expect(JOB_REPORT_REASONS).toContain('broken-link');
    expect(JOB_REPORT_REASONS).toContain('new-extension');
    expect(JOB_REPORT_REASONS).toContain('wrong-organization');
    expect(JOB_REPORT_REASONS).toContain('duplicate');
    expect(JOB_REPORT_REASONS).not.toContain('wrong_deadline');
  });
});

describe('jobReportFromStored', () => {
  it('parses a stored report, defaulting status to open', () => {
    const r = jobReportFromStored('r1', validReportRecord());
    expect(r).not.toBeNull();
    expect(r?.docId).toBe('r1');
    expect(r?.reporterId).toBe('student-1');
    expect(r?.targetType).toBe('jobCircular');
    expect(r?.status).toBe('open');
    expect(r?.details).toBe('শেষ তারিখ ২০ ডিসেম্বর, ১৫ নয়');
  });

  it('returns null for a report with no reporter or an unknown reason', () => {
    expect(jobReportFromStored('r1', validReportRecord({ reporterId: '' }))).toBeNull();
    expect(jobReportFromStored('r1', validReportRecord({ reason: 'made-up' }))).toBeNull();
  });
});

describe('jobCorrectionFromStored', () => {
  it('parses a stored correction', () => {
    const c = jobCorrectionFromStored('k1', {
      requesterId: 'student-1',
      targetType: 'jobCircular',
      targetId: 'c1',
      whatsWrong: 'শেষ তারিখ ভুল লেখা হয়েছে',
      proposedFix: 'শেষ তারিখ ২০ ডিসেম্বর ২০২৬',
      source: 'https://bpsc.gov.bd/notice/47',
      status: 'pending',
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
      createdAt: null,
      updatedAt: null,
    });
    expect(c).not.toBeNull();
    expect(c?.status).toBe('pending');
    expect(c?.source).toBe('https://bpsc.gov.bd/notice/47');
  });

  it('returns null when the source is missing — a correction needs evidence', () => {
    expect(
      jobCorrectionFromStored('k1', {
        requesterId: 'student-1',
        targetType: 'jobCircular',
        targetId: 'c1',
        whatsWrong: 'শেষ তারিখ ভুল',
        proposedFix: '২০ ডিসেম্বর',
        source: '',
        status: 'pending',
      }),
    ).toBeNull();
  });
});
