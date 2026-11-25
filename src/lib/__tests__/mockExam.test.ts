// Eduvelto — General Mock Exam library tests (7-day sprint, Day 5).
//
// Covers the verified-only gate (drafts are never verified),
// category routing, deterministic shuffling, scoring with the
// student-chosen negative marking (incl. -1.0, which the Job
// engine's pattern cannot express), and the analytics reuse
// (per-subject time, per-topic accuracy, weak areas). No
// Firestore is touched — every test here is pure.

import { describe, it, expect } from 'vitest';
import {
  ADMISSION_EXAM_SLUGS,
  NEGATIVE_MARKING_OPTIONS,
  analyseGeneralMockResult,
  categoryForExamSlug,
  groupBundlesByCategory,
  isNegativeMarkingOption,
  isVerifiedBundle,
  mulberry32,
  scoreGeneralMock,
  seedForAttempt,
  shuffleQuestions,
  timeMinutesFor,
  verifiedBundleFromDoc,
  type VerifiedMockBundle,
} from '../mockExam';
import type { JobQuestionBundle, JobQuestionKey } from '../jobQuestions';

function testBundle(): JobQuestionBundle {
  return {
    kind: 'topic',
    examSlug: 'bcs',
    titleBn: 'ইংরেজি',
    titleEn: 'English',
    questions: [
      { n: 1, questionId: 'bcs-eng-001', topicId: 'bcs__english__grammar__tense', subjectId: 'bcs__english', questionText: 'Q1?', options: [{ letter: 'A', text: 'a' }, { letter: 'B', text: 'b' }], difficulty: 'easy' },
      { n: 2, questionId: 'bcs-eng-002', topicId: 'bcs__english__grammar__tense', subjectId: 'bcs__english', questionText: 'Q2?', options: [{ letter: 'A', text: 'a' }, { letter: 'B', text: 'b' }], difficulty: 'medium' },
      { n: 3, questionId: 'bcs-eng-003', topicId: 'bcs__english__vocabulary__synonym', subjectId: 'bcs__english', questionText: 'Q3?', options: [{ letter: 'A', text: 'a' }, { letter: 'B', text: 'b' }], difficulty: 'hard' },
      { n: 4, questionId: 'bcs-eng-004', topicId: 'bcs__english__vocabulary__synonym', subjectId: 'bcs__english', questionText: 'Q4?', options: [{ letter: 'A', text: 'a' }, { letter: 'B', text: 'b' }], difficulty: 'easy' },
    ],
    questionCount: 4,
    bundleVersion: 1,
    status: 'published',
    reviewStatus: 'Published',
    sourceQuestionIds: ['bcs-eng-001', 'bcs-eng-002', 'bcs-eng-003', 'bcs-eng-004'],
  };
}

function testKey(): JobQuestionKey {
  return {
    bundleId: 'topic__bcs__english',
    answers: [
      { n: 1, questionId: 'bcs-eng-001', correctLetter: 'A', correctText: 'a', explanation: '' },
      { n: 2, questionId: 'bcs-eng-002', correctLetter: 'B', correctText: 'b', explanation: '' },
      { n: 3, questionId: 'bcs-eng-003', correctLetter: 'A', correctText: 'a', explanation: '' },
      { n: 4, questionId: 'bcs-eng-004', correctLetter: 'B', correctText: 'b', explanation: '' },
    ],
  };
}

describe('isVerifiedBundle — only verified questions', () => {
  const base = {
    status: 'published',
    reviewStatus: 'Published',
    kind: 'topic',
    titleBn: 'ইংরেজি',
    examSlug: 'bcs',
    bundleVersion: 1,
    questions: [{ n: 1 }],
  };
  it('accepts published + Published topic bundles', () => {
    expect(isVerifiedBundle(base)).toBe(true);
    expect(isVerifiedBundle({ ...base, kind: 'previous' })).toBe(true);
  });
  it('rejects drafts — the 6,349 Job + 977 Admission NEEDS-REVIEW pool', () => {
    expect(isVerifiedBundle({ ...base, status: 'draft' })).toBe(false);
    expect(isVerifiedBundle({ ...base, reviewStatus: 'Not Started' })).toBe(false);
    expect(isVerifiedBundle({ ...base, reviewStatus: 'Under Review' })).toBe(false);
    expect(isVerifiedBundle({ ...base, reviewStatus: 'Rejected' })).toBe(false);
  });
  it('rejects mock-kind bundles (receipt-gated to the Job engine)', () => {
    expect(isVerifiedBundle({ ...base, kind: 'mock' })).toBe(false);
    expect(isVerifiedBundle({ ...base, kind: 'daily' })).toBe(false);
  });
  it('rejects empty / malformed bundles', () => {
    expect(isVerifiedBundle({ ...base, questions: [] })).toBe(false);
    expect(isVerifiedBundle({ ...base, bundleVersion: 0 })).toBe(false);
    expect(isVerifiedBundle({ ...base, titleBn: '' })).toBe(false);
    expect(isVerifiedBundle({ ...base, examSlug: '' })).toBe(false);
  });
  it('verifiedBundleFromDoc returns null for a draft', () => {
    expect(verifiedBundleFromDoc('x', { ...base, status: 'draft' })).toBeNull();
    const meta = verifiedBundleFromDoc('topic__bcs__english', base);
    expect(meta?.category).toBe('job');
    expect(meta?.questionCount).toBe(1);
  });
});

describe('categoryForExamSlug', () => {
  it('routes known Job slugs to job', () => {
    expect(categoryForExamSlug('bcs')).toBe('job');
    expect(categoryForExamSlug('bank')).toBe('job');
    expect(categoryForExamSlug('ntrca')).toBe('job');
  });
  it('routes admission slugs to admission', () => {
    for (const slug of ADMISSION_EXAM_SLUGS) {
      expect(categoryForExamSlug(slug)).toBe('admission');
    }
    expect(categoryForExamSlug('admission-foo')).toBe('admission');
    expect(categoryForExamSlug('xyz-admission')).toBe('admission');
  });
  it('routes everything else to academic', () => {
    expect(categoryForExamSlug('class-9')).toBe('academic');
    expect(categoryForExamSlug('honours-english')).toBe('academic');
    expect(categoryForExamSlug('')).toBe('academic');
  });
});

describe('groupBundlesByCategory', () => {
  it('groups and sorts by Bangla title', () => {
    const bundles: VerifiedMockBundle[] = [
      { docId: 'a', titleBn: 'খ', titleEn: 'K', examSlug: 'nu-admission', category: 'admission', kind: 'topic', questionCount: 5, bundleVersion: 1 },
      { docId: 'b', titleBn: 'ক', titleEn: 'K', examSlug: 'class-9', category: 'academic', kind: 'topic', questionCount: 5, bundleVersion: 1 },
      { docId: 'c', titleBn: 'গ', titleEn: 'G', examSlug: 'bcs', category: 'job', kind: 'topic', questionCount: 5, bundleVersion: 1 },
    ];
    const grouped = groupBundlesByCategory(bundles);
    expect(grouped.job.map((b) => b.docId)).toEqual(['c']);
    expect(grouped.admission.map((b) => b.docId)).toEqual(['a']);
    expect(grouped.academic.map((b) => b.docId)).toEqual(['b']);
  });
  it('empty input gives three empty lists (honest empty states)', () => {
    const grouped = groupBundlesByCategory([]);
    expect(grouped).toEqual({ job: [], admission: [], academic: [] });
  });
});

describe('negative marking options', () => {
  it('offers exactly 0 / 0.25 / 0.5 / 1.0', () => {
    expect([...NEGATIVE_MARKING_OPTIONS]).toEqual([0, 0.25, 0.5, 1]);
    expect(isNegativeMarkingOption(1)).toBe(true);
    expect(isNegativeMarkingOption(0.75)).toBe(false);
    expect(isNegativeMarkingOption('0.25')).toBe(false);
  });
  it('time is one minute per question', () => {
    expect(timeMinutesFor(35)).toBe(35);
    expect(timeMinutesFor(1)).toBe(1);
    expect(timeMinutesFor(0)).toBe(1);
  });
});

describe('shuffleQuestions — deterministic per attempt', () => {
  const qs = [1, 2, 3, 4, 5, 6, 7, 8];
  it('same seed shuffles the same way, different seed differently', () => {
    expect(shuffleQuestions(qs, 42)).toEqual(shuffleQuestions(qs, 42));
    expect(shuffleQuestions(qs, 42)).not.toEqual(shuffleQuestions(qs, 43));
  });
  it('keeps the same set, does not mutate the input', () => {
    const out = shuffleQuestions(qs, 7);
    expect([...out].sort((a, b) => a - b)).toEqual(qs);
    expect(qs).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('mulberry32 is deterministic', () => {
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it('seedForAttempt changes with attempt index and version', () => {
    const a = seedForAttempt('b1', 1, 0);
    expect(seedForAttempt('b1', 1, 0)).toBe(a);
    expect(seedForAttempt('b1', 1, 1)).not.toBe(a);
    expect(seedForAttempt('b1', 2, 0)).not.toBe(a);
  });
});

describe('scoreGeneralMock', () => {
  const base = {
    bundle: testBundle(),
    key: testKey(),
    startedAtMillis: 1_000_000,
    submittedAtMillis: 1_000_000 + 240_000,
  };
  it('scores correct/wrong/unanswered with no penalty', () => {
    const r = scoreGeneralMock({
      ...base,
      negativeMarking: 0,
      answers: [
        { n: 1, questionId: 'bcs-eng-001', selected: 'A', timeSpentSeconds: 30 },
        { n: 2, questionId: 'bcs-eng-002', selected: 'A', timeSpentSeconds: 45 },
        { n: 3, questionId: 'bcs-eng-003', selected: null, timeSpentSeconds: 10 },
        { n: 4, questionId: 'bcs-eng-004', selected: 'B', timeSpentSeconds: 60 },
      ],
    });
    expect(r.correctCount).toBe(2);
    expect(r.wrongCount).toBe(1);
    expect(r.unansweredCount).toBe(1);
    expect(r.score).toBe(2);
    expect(r.totalMarks).toBe(4);
    expect(r.accuracy).toBeCloseTo(66.67, 1);
    expect(r.percentage).toBe(50);
    expect(r.timeSpentSeconds).toBe(240);
    expect(r.negativeMarkingUsed).toBe(0);
    expect(r.clientCalculatedScore).toBe(r.score);
  });
  it('applies -0.25 and -1.0 per wrong answer', () => {
    const answers: Array<{ n: number; questionId: string; selected: 'A' | 'B' | 'C' | 'D' | null; timeSpentSeconds: number }> = [
      { n: 1, questionId: 'bcs-eng-001', selected: 'A', timeSpentSeconds: 10 },
      { n: 2, questionId: 'bcs-eng-002', selected: 'A', timeSpentSeconds: 10 },
      { n: 3, questionId: 'bcs-eng-003', selected: 'B', timeSpentSeconds: 10 },
      { n: 4, questionId: 'bcs-eng-004', selected: 'A', timeSpentSeconds: 10 },
    ];
    // 1 correct, 3 wrong: 1 − 3×0.25 = 0.25; 1 − 3×1 = −2.
    expect(scoreGeneralMock({ ...base, negativeMarking: 0.25, answers }).score).toBe(0.25);
    expect(scoreGeneralMock({ ...base, negativeMarking: 0.25, answers }).negativeDeduction).toBe(0.75);
    expect(scoreGeneralMock({ ...base, negativeMarking: 1, answers }).score).toBe(-2);
    expect(scoreGeneralMock({ ...base, negativeMarking: 1, answers }).markingSchemeVersion).toBe(
      'general-mock-v1:neg-1',
    );
  });
  it('derives weak topics from wrong answers only', () => {
    const r = scoreGeneralMock({
      ...base,
      negativeMarking: 0,
      answers: [
        { n: 1, questionId: 'bcs-eng-001', selected: 'B' },
        { n: 2, questionId: 'bcs-eng-002', selected: 'B' },
        { n: 3, questionId: 'bcs-eng-003', selected: 'B' },
        { n: 4, questionId: 'bcs-eng-004', selected: 'B' },
      ],
    });
    // Wrong: tense 1, synonym 1 — tie broken by topicId asc.
    expect(r.weakTopics[0].topicId).toBe('bcs__english__grammar__tense');
    expect(r.weakTopics[0].wrong).toBe(1);
    expect(r.wrongQuestionIds).toEqual(['bcs-eng-001', 'bcs-eng-003']);
  });
  it('never scores without a key or with a mismatched key', () => {
    expect(() =>
      scoreGeneralMock({ ...base, key: null, negativeMarking: 0, answers: [] }),
    ).toThrow(/key is null/);
    expect(() =>
      scoreGeneralMock({
        ...base,
        negativeMarking: 0,
        key: { bundleId: 'x', answers: testKey().answers.slice(0, 2) },
        answers: [],
      }),
    ).toThrow(/!= bundle questions/);
    expect(() =>
      scoreGeneralMock({
        ...base,
        negativeMarking: 0,
        answers: [{ n: 9, questionId: 'nope', selected: 'A' }],
      }),
    ).toThrow(/not in the bundle/);
  });
});

describe('analyseGeneralMockResult', () => {
  it('gives per-subject time, per-topic accuracy and weak areas', () => {
    const result = scoreGeneralMock({
      bundle: testBundle(),
      key: testKey(),
      negativeMarking: 0.25,
      startedAtMillis: 0,
      submittedAtMillis: 120_000,
      answers: [
        { n: 1, questionId: 'bcs-eng-001', selected: 'A', timeSpentSeconds: 20 },
        { n: 2, questionId: 'bcs-eng-002', selected: 'A', timeSpentSeconds: 40 },
        { n: 3, questionId: 'bcs-eng-003', selected: 'A', timeSpentSeconds: 30 },
        { n: 4, questionId: 'bcs-eng-004', selected: 'A', timeSpentSeconds: 30 },
      ],
    });
    const a = analyseGeneralMockResult(result);
    expect(a.perSubject).toHaveLength(1);
    expect(a.perSubject[0].questions).toBe(4);
    expect(a.perSubject[0].avgTimeSeconds).toBe(30);
    expect(a.avgTimeSeconds).toBe(30);
    expect(a.perTopic).toHaveLength(2);
    expect(a.weakAreas.map((w) => w.topicId)).toContain('bcs__english__grammar__tense');
    expect(a.weakAreas[0].wrong).toBeGreaterThan(0);
    expect(a.weakTopics.length).toBeGreaterThan(0);
  });
  it('a perfect attempt has no weak areas', () => {
    const result = scoreGeneralMock({
      bundle: testBundle(),
      key: testKey(),
      negativeMarking: 0,
      startedAtMillis: 0,
      submittedAtMillis: 60_000,
      answers: [
        { n: 1, questionId: 'bcs-eng-001', selected: 'A', timeSpentSeconds: 10 },
        { n: 2, questionId: 'bcs-eng-002', selected: 'B', timeSpentSeconds: 10 },
        { n: 3, questionId: 'bcs-eng-003', selected: 'A', timeSpentSeconds: 10 },
        { n: 4, questionId: 'bcs-eng-004', selected: 'B', timeSpentSeconds: 10 },
      ],
    });
    expect(analyseGeneralMockResult(result).weakAreas).toEqual([]);
  });
});
