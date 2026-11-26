// Eduvelto — feedback unit tests (Day 3, unified 26 Nov 2026).
//
// Covers the pure pieces: the 200-char question snapshot, the
// submit payload (status 'pending', no reward fields), the
// validator, and the admin approve/reject transitions. The
// Firestore writes themselves are covered by the emulator rules
// suite (emulator-tests/rules-feedback.test.ts). Deciding
// a report never touches a question — the transition returns
// only report-doc fields, and approving is the only path that
// sets flaggedForCorrection.

import { describe, expect, it } from 'vitest';
import {
  QUESTION_REPORT_ERROR_TYPES,
  buildContactMessageDoc,
  buildQuestionReportDoc,
  buildReportDoc,
  decideQuestionReportTransition,
  questionReportFromStored,
  questionTextSnapshot,
  validateContactMessage,
  validateQuestionReport,
  validateReport,
  type QuestionReport,
} from '../feedback';

const FIXED_TS = { __fixed: 'ts' };

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    questionId: 'bank-q-123',
    questionText: 'বাংলাদেশের রাজধানী কোনটি?',
    errorType: 'wrong-answer' as const,
    description: 'সঠিক উত্তর ঢাকা, কিন্তু (খ) দেওয়া আছে।',
    reporterUid: 'student-1',
    ...overrides,
  };
}

function validReport(overrides: Partial<QuestionReport> = {}): QuestionReport {
  return {
    docId: 'rep-1',
    type: 'question-error',
    questionId: 'bank-q-123',
    questionText: 'বাংলাদেশের রাজধানী কোনটি?',
    errorType: 'wrong-answer',
    description: 'সঠিক উত্তর ঢাকা।',
    reporterUid: 'student-1',
    status: 'pending',
    flaggedForCorrection: false,
    decidedBy: null,
    decidedAtMillis: null,
    decisionNote: null,
    createdAtMillis: 1795000000000,
    updatedAtMillis: 1795000000000,
    ...overrides,
  };
}

describe('questionTextSnapshot', () => {
  it('keeps a short question whole', () => {
    expect(questionTextSnapshot('কোনটি সঠিক?')).toBe('কোনটি সঠিক?');
  });

  it('truncates a long question to exactly the first 200 characters', () => {
    const long = 'অ'.repeat(250);
    const snap = questionTextSnapshot(long);
    expect(snap).toHaveLength(200);
    expect(snap).toBe('অ'.repeat(200));
  });
});

describe('buildQuestionReportDoc (submit payload)', () => {
  it('a valid report is built with status pending and no reward fields', () => {
    const doc = buildQuestionReportDoc(validInput(), FIXED_TS);
    expect(doc.type).toBe('question-error');
    expect(doc.status).toBe('pending');
    expect(doc.questionId).toBe('bank-q-123');
    expect(doc.questionText).toBe('বাংলাদেশের রাজধানী কোনটি?');
    expect(doc.errorType).toBe('wrong-answer');
    expect(doc.description).toBe('সঠিক উত্তর ঢাকা, কিন্তু (খ) দেওয়া আছে।');
    expect(doc.reporterUid).toBe('student-1');
    expect(doc.flaggedForCorrection).toBe(false);
    expect(doc.decidedBy).toBeNull();
    expect(doc.decidedAt).toBeNull();
    expect(doc.decisionNote).toBeNull();
    expect(doc.createdAt).toBe(FIXED_TS);
    expect(doc.updatedAt).toBe(FIXED_TS);
    // No Pro reward anywhere in this flow.
    expect('rewardStatus' in doc).toBe(false);
    expect('rewardDays' in doc).toBe(false);
    expect(validateQuestionReport(doc)).toHaveLength(0);
  });

  it('snapshots a long question to 200 chars in the payload', () => {
    const doc = buildQuestionReportDoc(validInput({ questionText: 'ব'.repeat(500) }), FIXED_TS);
    expect((doc.questionText as string)).toHaveLength(200);
  });

  it('rejects an unknown error type and an empty description', () => {
    expect(() => buildQuestionReportDoc(validInput({ errorType: 'made-up' }), FIXED_TS)).toThrow(/errorType/);
    expect(() => buildQuestionReportDoc(validInput({ description: '   ' }), FIXED_TS)).toThrow(/description/);
  });

  it('rejects a description over 1000 characters and a missing questionId', () => {
    expect(() => buildQuestionReportDoc(validInput({ description: 'x'.repeat(1001) }), FIXED_TS)).toThrow(/1000/);
    expect(() => buildQuestionReportDoc(validInput({ questionId: '' }), FIXED_TS)).toThrow(/questionId/);
  });

  it('the error-type enum is the five types the form offers', () => {
    expect(QUESTION_REPORT_ERROR_TYPES).toEqual([
      'wrong-answer',
      'wrong-explanation',
      'typo',
      'out-of-syllabus',
      'other',
    ]);
  });
});

describe('validateQuestionReport', () => {
  it('rejects an unexpected key', () => {
    const doc = { ...buildQuestionReportDoc(validInput(), FIXED_TS), rewardDays: 7 };
    const problems = validateQuestionReport(doc);
    expect(problems.some((p) => p.includes('rewardDays'))).toBe(true);
  });

  it('rejects a non-pending status in a stored doc shape', () => {
    const doc = buildQuestionReportDoc(validInput(), FIXED_TS);
    expect(validateQuestionReport({ ...doc, status: 'open' }).length).toBeGreaterThan(0);
  });
});

describe('questionReportFromStored', () => {
  it('parses a stored report and drops a malformed one', () => {
    const parsed = questionReportFromStored('rep-1', {
      ...buildQuestionReportDoc(validInput(), null),
      createdAt: { seconds: 1795000000 },
    });
    expect(parsed?.docId).toBe('rep-1');
    expect(parsed?.status).toBe('pending');
    expect(parsed?.createdAtMillis).toBe(1795000000000);
    expect(questionReportFromStored('rep-2', { questionId: '', errorType: 'typo' })).toBeNull();
  });
});

describe('decideQuestionReportTransition (admin approve / reject)', () => {
  it("approve marks the report valid and flags the question for correction", () => {
    const next = decideQuestionReportTransition(validReport(), 'valid');
    expect(next).toEqual({ status: 'valid', flaggedForCorrection: true });
  });

  it('reject marks the report invalid and does NOT flag the question', () => {
    const next = decideQuestionReportTransition(validReport(), 'invalid');
    expect(next).toEqual({ status: 'invalid', flaggedForCorrection: false });
  });

  it('a decided report cannot be decided again', () => {
    expect(() => decideQuestionReportTransition(validReport({ status: 'valid' }), 'invalid')).toThrow(/ইতিমধ্যে/);
    expect(() => decideQuestionReportTransition(validReport({ status: 'invalid' }), 'valid')).toThrow(/ইতিমধ্যে/);
  });

  it('the transition touches only report fields — no question fields', () => {
    const next = decideQuestionReportTransition(validReport(), 'valid');
    expect(Object.keys(next).sort()).toEqual(['flaggedForCorrection', 'status']);
  });
});

function validContactInput(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Student One',
    email: 'student1@example.com',
    message: 'Hello, I need help.',
    reporterUid: 'student-1',
    ...overrides,
  };
}

function validGenReportInput(overrides: Record<string, unknown> = {}) {
  return {
    targetId: 'post-1',
    targetType: 'post' as const,
    targetAuthorId: 'student-2',
    reason: 'spam' as const,
    details: 'It looks like spam.',
    reporterUid: 'student-1',
    ...overrides,
  };
}

describe('buildContactMessageDoc (contact type)', () => {
  it('a valid contact message is built with type contact and status pending', () => {
    const doc = buildContactMessageDoc(validContactInput(), FIXED_TS);
    expect(doc.type).toBe('contact');
    expect(doc.status).toBe('pending');
    expect(doc.reporterUid).toBe('student-1');
    expect(doc.name).toBe('Student One');
    expect(doc.createdAt).toBe(FIXED_TS);
    expect(doc.updatedAt).toBe(FIXED_TS);
    expect(validateContactMessage(doc)).toHaveLength(0);
  });

  it('rejects an empty message and a missing name', () => {
    expect(() =>
      buildContactMessageDoc(validContactInput({ message: '   ' }), FIXED_TS),
    ).toThrow(/message/);
    expect(() =>
      buildContactMessageDoc(validContactInput({ name: '  ' }), FIXED_TS),
    ).toThrow(/name/);
  });
});

describe('buildReportDoc (general report type)', () => {
  it('a valid report is built with type report and status open', () => {
    const doc = buildReportDoc(validGenReportInput(), FIXED_TS);
    expect(doc.type).toBe('report');
    expect(doc.status).toBe('open');
    expect(doc.targetId).toBe('post-1');
    expect(doc.createdAt).toBe(FIXED_TS);
    expect(validateReport(doc)).toHaveLength(0);
  });

  it('rejects a missing targetId and a bad targetType', () => {
    expect(() =>
      buildReportDoc(validGenReportInput({ targetId: '' }), FIXED_TS),
    ).toThrow(/targetId/);
    expect(() =>
      buildReportDoc(validGenReportInput({ targetType: 'made-up' }), FIXED_TS),
    ).toThrow(/targetType/);
  });
});

describe('questionReportFromStored ignores other feedback types', () => {
  it('a type contact doc is not a question-error report', () => {
    expect(
      questionReportFromStored('fb-x', {
        type: 'contact',
        reporterUid: 'student-1',
        status: 'pending',
        name: 'A',
        message: 'Hi',
      }),
    ).toBeNull();
  });
});
