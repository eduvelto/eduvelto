/**
 * Eduvelto Job Preparation — Step 9 unit tests (jobEngine.ts mock
 * surface + jobMocks scoring).
 *
 * Covers: mock session creation (bundle order, never mode order;
 * endsAt null at create, clientEndsAtMillis set now), deadline
 * helpers (stored endsAt wins, client fallback, expiry), the
 * deadline builder (startedAt + minutes, no guessing), the
 * submit/abandon update builders (exact fields, revision +1),
 * validateMockSession, scoreMockAttempt (snapshot is the
 * authority — BCS −0.50, Bank penalty 0, NTRCA version pin;
 * key null throws), weak-topic derivation, and rebuilding a
 * result from a stored attempt doc (round-trip + malformed → null).
 */
import { describe, it, expect } from 'vitest';
import {
  buildJobAttemptDoc,
  buildMockAutosavePatch,
  buildMockDeadlineUpdate,
  buildMockSessionAbandonUpdate,
  buildMockSessionSubmitUpdate,
  createMockSession,
  isMockExpired,
  jobAttemptResultFromStoredDoc,
  mockDeadlineForSession,
  mockDeadlineMillis,
  mockRemainingMillis,
  patternFromRulesSnapshot,
  scoreMockAttempt,
  validateAttemptResult,
  validateMockSession,
  weakTopicsFromAttemptAnswers,
  type JobAttemptAnswer,
  type JobMockSessionDoc,
} from '../jobEngine';
import type { JobQuestionBundle, JobQuestionKey } from '../jobQuestions';
import type { JobMockRulesSnapshot } from '../jobMocks';
import {
  buildExamLockDoc,
  buildMockReceiptDoc,
  examLockId,
  isExamLockLive,
  validateExamManifest,
} from '../jobMock';

/* Fixtures: a 3-question mock bundle + key. Correct letters A/B/A
 * so "all A" is 2 correct + 1 wrong. Topics t1 (2Q) + t2 (1Q). */
function makeMockBundle(): { bundle: JobQuestionBundle; key: JobQuestionKey } {
  const bundle: JobQuestionBundle = {
    kind: 'mock',
    examSlug: 'bcs',
    topicId: null,
    mockId: 'full__bcs__1',
    year: null,
    titleBn: 'বিসিএস পূর্ণ মক ১',
    titleEn: 'BCS Full Mock 1',
    questions: [
      {
        n: 1, questionId: 'q1', topicId: 't1', subjectId: 'bcs__bangla',
        difficulty: 'easy' as const,
        questionText: 'Q1?', options: [
          { letter: 'A' as const, text: 'a1' }, { letter: 'B' as const, text: 'b1' },
          { letter: 'C' as const, text: 'c1' }, { letter: 'D' as const, text: 'd1' },
        ],
      },
      {
        n: 2, questionId: 'q2', topicId: 't1', subjectId: 'bcs__bangla',
        difficulty: 'medium' as const,
        questionText: 'Q2?', options: [
          { letter: 'A' as const, text: 'a2' }, { letter: 'B' as const, text: 'b2' },
          { letter: 'C' as const, text: 'c2' }, { letter: 'D' as const, text: 'd2' },
        ],
      },
      {
        n: 3, questionId: 'q3', topicId: 't2', subjectId: 'bcs__english',
        difficulty: 'hard' as const,
        questionText: 'Q3?', options: [
          { letter: 'A' as const, text: 'a3' }, { letter: 'B' as const, text: 'b3' },
          { letter: 'C' as const, text: 'c3' }, { letter: 'D' as const, text: 'd3' },
        ],
      },
    ],
    questionCount: 3,
    bundleVersion: 1,
    status: 'published',
    reviewStatus: 'Published',
    sourceQuestionIds: ['q1', 'q2', 'q3'],
    configVersion: 'v1',
  };
  const key: JobQuestionKey = {
    bundleId: 'mock__full__bcs__1',
    answers: [
      { n: 1, questionId: 'q1', correctLetter: 'A', correctText: 'উত্তর ১', explanation: 'কারণ ১', whyWrong: null },
      { n: 2, questionId: 'q2', correctLetter: 'B', correctText: 'উত্তর ২', explanation: 'কারণ ২', whyWrong: null },
      { n: 3, questionId: 'q3', correctLetter: 'A', correctText: 'উত্তর ৩', explanation: 'কারণ ৩', whyWrong: null },
    ],
    configVersion: 'v1',
    createdAt: null,
    updatedAt: null,
  };
  return { bundle, key };
}

const BCS_SNAPSHOT: JobMockRulesSnapshot = {
  questionCount: 3, timeMinutes: 5, marksPerQuestion: 1,
  negativeMarking: 0.5, negativeMarkingVerified: true,
  passPercent: null, scoringConfigVersion: 'v1',
};
const BANK_SNAPSHOT: JobMockRulesSnapshot = {
  questionCount: 3, timeMinutes: 5, marksPerQuestion: 1,
  negativeMarking: null, negativeMarkingVerified: false,
  passPercent: null, scoringConfigVersion: 'v0-provisional',
};
const NTRCA_SNAPSHOT: JobMockRulesSnapshot = {
  questionCount: 3, timeMinutes: 5, marksPerQuestion: 1,
  negativeMarking: 0.25, negativeMarkingVerified: true,
  passPercent: 40, scoringConfigVersion: '18th-v1',
};

function makeSession(): JobMockSessionDoc {
  const { bundle } = makeMockBundle();
  return createMockSession({
    sessionId: 'sess-1',
    mockId: 'full__bcs__1',
    bundleId: 'mock__full__bcs__1',
    examSlug: 'bcs',
    definitionId: 'full__bcs__1',
    questionSetId: 'full__bcs__1_v1',
    bundleVersion: 1,
    questionRefs: bundle.questions.map((q) => ({ bundleId: 'mock__full__bcs__1', n: q.n, questionId: q.questionId })),
    timeMinutes: 5,
    clientNowMillis: 1_000_000,
  });
}

describe('mock session creation', () => {
  it('creates a mock session in bundle order, endsAt null, client deadline set now', () => {
    const s = makeSession();
    expect(s.kind).toBe('mock');
    expect(s.mockId).toBe('full__bcs__1');
    expect(s.status).toBe('in-progress');
    expect(s.endsAt).toBeNull();
    expect(s.clientEndsAtMillis).toBe(1_000_000 + 5 * 60 * 1000);
    expect(s.revision).toBe(1);
    expect(s.currentQuestion).toBe(1);
    expect(s.questionRefs.map((r) => r.n)).toEqual([1, 2, 3]);
    expect(s.answers[1]).toEqual({ selected: null, markedForReview: false, timeSpentSeconds: 0 });
    expect(s.submittedAt).toBeNull();
  });
});

describe('deadline helpers', () => {
  it('mockDeadlineMillis prefers the stored endsAt, else the client deadline, else null', () => {
    const s = makeSession();
    expect(mockDeadlineMillis(s)).toBe(1_000_000 + 5 * 60 * 1000);
    const withEnds = { ...s, endsAt: { toMillis: () => 2_000_000 } };
    expect(mockDeadlineMillis(withEnds)).toBe(2_000_000);
    const bare = { ...s, endsAt: null, clientEndsAtMillis: null };
    expect(mockDeadlineMillis(bare)).toBeNull();
  });

  it('mockRemainingMillis / isMockExpired use the stored deadline (negative when expired)', () => {
    const s = makeSession();
    expect(mockRemainingMillis(s, 1_100_000)).toBe(200_000);
    expect(isMockExpired(s, 1_100_000)).toBe(false);
    expect(mockRemainingMillis(s, 1_300_000)).toBe(0);
    expect(isMockExpired(s, 1_300_000)).toBe(true);
    expect(mockRemainingMillis(s, 1_400_000)).toBe(-100_000);
    expect(isMockExpired({ ...s, endsAt: null, clientEndsAtMillis: null }, 1_400_000)).toBe(false);
  });

  it('mockDeadlineForSession is startedAt + minutes, and throws on bad inputs', () => {
    expect(mockDeadlineForSession(1_000_000, 120)).toBe(1_000_000 + 120 * 60 * 1000);
    expect(() => mockDeadlineForSession(0, 120)).toThrow();
    expect(() => mockDeadlineForSession(1_000_000, 0)).toThrow();
    expect(() => mockDeadlineForSession(1_000_000, 601)).toThrow();
    expect(() => mockDeadlineForSession(1_000_000, 1.5)).toThrow();
  });
});

describe('mock update builders', () => {
  it('buildMockDeadlineUpdate carries endsAt + client deadline + revision stored+1', () => {
    const u = buildMockDeadlineUpdate(3, { toMillis: () => 2_000_000 }, 2_000_000);
    expect(u.endsAt).toEqual({ toMillis: expect.any(Function) });
    expect(u.clientEndsAtMillis).toBe(2_000_000);
    expect(u.revision).toBe(4);
    expect(u.lastSyncedAt).toBeDefined();
    expect(u.updatedAt).toBeDefined();
  });

  it('buildMockAutosavePatch carries only the five autosave fields', () => {
    const s = makeSession();
    const p = buildMockAutosavePatch(s);
    expect(Object.keys(p).sort()).toEqual(
      ['answers', 'currentQuestion', 'lastSyncedAt', 'revision', 'updatedAt'].sort(),
    );
    expect(p.revision).toBe(2);
  });

  it('submit update: status submitted + submittedAt + revision stored+1', () => {
    const u = buildMockSessionSubmitUpdate(7);
    expect(u.status).toBe('submitted');
    expect(u.submittedAt).toBeDefined();
    expect(u.updatedAt).toBeDefined();
    expect(u.revision).toBe(8);
  });

  it('abandon update: status abandoned, NO submittedAt field', () => {
    const u = buildMockSessionAbandonUpdate(2);
    expect(u.status).toBe('abandoned');
    expect('submittedAt' in u).toBe(false);
    expect(u.revision).toBe(3);
  });
});

describe('validateMockSession', () => {
  it('a created mock session validates (definition + manifest + bundle generation bound)', () => {
    expect(validateMockSession(makeSession())).toEqual([]);
    const s = makeSession();
    expect(s.definitionId).toBe('full__bcs__1');
    expect(s.questionSetId).toBe('full__bcs__1_v1');
    expect(s.bundleVersion).toBe(1);
  });

  it('rejects wrong kind, missing mockId, bad endsAt, bad currentQuestion, answers mismatch', () => {
    const s = makeSession();
    expect(validateMockSession({ ...s, kind: 'practice' }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, mockId: '' }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, definitionId: '' }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, questionSetId: '' }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, bundleVersion: 0 }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, endsAt: 'soon' }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, currentQuestion: 4 }).length).toBeGreaterThan(0);
    expect(validateMockSession({ ...s, answers: { '1': s.answers[1] } }).length).toBeGreaterThan(0);
    expect(validateMockSession(null).length).toBeGreaterThan(0);
  });
});

describe('patternFromRulesSnapshot', () => {
  it('Bank null penalty becomes 0 (disabled), never the provisional 0.25', () => {
    const p = patternFromRulesSnapshot('bank', BANK_SNAPSHOT);
    expect(p.negativeMarking).toBe(0);
    expect(p.negativeMarkingVerified).toBe(false);
    expect(p.scoringConfigVersion).toBe('v0-provisional');
  });

  it('throws on a bad snapshot (marks != 1, bad penalty, missing version)', () => {
    expect(() => patternFromRulesSnapshot('bcs', { ...BCS_SNAPSHOT, marksPerQuestion: 2 })).toThrow();
    expect(() => patternFromRulesSnapshot('bcs', { ...BCS_SNAPSHOT, negativeMarking: 0.3 })).toThrow();
    expect(() => patternFromRulesSnapshot('bcs', { ...BCS_SNAPSHOT, scoringConfigVersion: '' })).toThrow();
    expect(() => patternFromRulesSnapshot('bcs', { ...BCS_SNAPSHOT, questionCount: 0 })).toThrow();
  });
});

describe('scoreMockAttempt', () => {
  const given = [
    { n: 1, questionId: 'q1', selected: 'A' as const, timeSpentSeconds: 30 },
    { n: 2, questionId: 'q2', selected: 'A' as const, timeSpentSeconds: 20 },
    { n: 3, questionId: 'q3', selected: null, timeSpentSeconds: 0 },
  ];

  it('scores from the SNAPSHOT pattern: BCS −0.50 → 1 correct − 1 wrong = 0.5', () => {
    const { bundle, key } = makeMockBundle();
    const r = scoreMockAttempt({
      bundle, key, answers: given, rulesSnapshot: BCS_SNAPSHOT,
      examSlug: 'bcs', startedAtMillis: 1_000_000, submittedAtMillis: 1_050_000,
    });
    expect(r.score).toBe(0.5);
    expect(r.correctCount).toBe(1);
    expect(r.wrongCount).toBe(1);
    expect(r.unansweredCount).toBe(1);
    expect(r.negativeDeduction).toBe(0.5);
    expect(r.negativeMarkingUsed).toBe(0.5);
    expect(r.markingSchemeVersion).toBe('v1');
    expect(r.totalMarks).toBe(3);
    expect(r.timeSpentSeconds).toBe(50);
    expect(r.answers[0].correctText).toBe('উত্তর ১');
    expect(r.weakTopics).toEqual([
      { topicId: 't1', wrong: 1, total: 2 },
      { topicId: 't2', wrong: 0, total: 1 },
    ]);
  });

  it('Bank snapshot scores a wrong answer as 0 (penalty disabled)', () => {
    const { bundle, key } = makeMockBundle();
    const r = scoreMockAttempt({
      bundle, key, answers: given, rulesSnapshot: BANK_SNAPSHOT,
      examSlug: 'bank', startedAtMillis: 1_000_000, submittedAtMillis: 1_050_000,
    });
    expect(r.score).toBe(1);
    expect(r.negativeDeduction).toBe(0);
    expect(r.negativeMarkingUsed).toBe(0);
  });

  it('NTRCA snapshot pins markingSchemeVersion 18th-v1', () => {
    const { bundle, key } = makeMockBundle();
    const r = scoreMockAttempt({
      bundle, key, answers: given, rulesSnapshot: NTRCA_SNAPSHOT,
      examSlug: 'ntrca', startedAtMillis: 1_000_000, submittedAtMillis: 1_050_000,
    });
    expect(r.markingSchemeVersion).toBe('18th-v1');
    expect(r.negativeMarkingUsed).toBe(0.25);
  });

  it('key null throws — a mock is never scored by guessing', () => {
    const { bundle } = makeMockBundle();
    expect(() =>
      scoreMockAttempt({
        bundle, key: null, answers: given, rulesSnapshot: BCS_SNAPSHOT,
        examSlug: 'bcs', startedAtMillis: 1_000_000, submittedAtMillis: 1_050_000,
      }),
    ).toThrow(/key is null/);
  });
});

describe('weakTopicsFromAttemptAnswers', () => {
  it('counts wrong per topic, ignores unanswered, sorts wrong desc', () => {
    const answers: JobAttemptAnswer[] = [
      { n: 1, questionId: 'q1', topicId: 't2', subjectId: 's', selected: 'A', correct: false, marks: -0.5, correctText: 'x', timeSpentSeconds: 1 },
      { n: 2, questionId: 'q2', topicId: 't1', subjectId: 's', selected: null, correct: false, marks: 0, correctText: 'x', timeSpentSeconds: 0 },
      { n: 3, questionId: 'q3', topicId: 't1', subjectId: 's', selected: 'B', correct: true, marks: 1, correctText: 'x', timeSpentSeconds: 1 },
      { n: 4, questionId: 'q4', topicId: 't2', subjectId: 's', selected: 'C', correct: false, marks: -0.5, correctText: 'x', timeSpentSeconds: 1 },
    ];
    expect(weakTopicsFromAttemptAnswers(answers)).toEqual([
      { topicId: 't2', wrong: 2, total: 2 },
      { topicId: 't1', wrong: 0, total: 2 },
    ]);
  });
});

describe('jobAttemptResultFromStoredDoc', () => {
  it('round-trips a built mock attempt doc (incl. re-derived weak topics)', () => {
    const { bundle, key } = makeMockBundle();
    const result = scoreMockAttempt({
      bundle, key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A', timeSpentSeconds: 30 },
        { n: 2, questionId: 'q2', selected: 'A', timeSpentSeconds: 20 },
        { n: 3, questionId: 'q3', selected: null, timeSpentSeconds: 0 },
      ],
      rulesSnapshot: BCS_SNAPSHOT, examSlug: 'bcs',
      startedAtMillis: 1_000_000, submittedAtMillis: 1_050_000,
    });
    const session = makeSession();
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result,
      bundleId: 'mock__full__bcs__1', examSlug: 'bcs',
      subjectId: null, topicId: null, kind: 'mock', mockId: 'full__bcs__1',
      questionSetId: 'full__bcs__1_v1',
      bundleVersion: 1, userId: 'student-1',
    });
    expect(validateAttemptResult(doc)).toEqual([]);
    expect(doc.submissionIntegrity).toBe('client_calculated');
    expect(doc.questionSetId).toBe('full__bcs__1_v1');
    const rebuilt = jobAttemptResultFromStoredDoc(doc);
    expect(rebuilt).not.toBeNull();
    expect(rebuilt!.score).toBe(result.score);
    expect(rebuilt!.correctCount).toBe(result.correctCount);
    expect(rebuilt!.wrongCount).toBe(result.wrongCount);
    expect(rebuilt!.weakTopics).toEqual(result.weakTopics);
    expect(rebuilt!.wrongQuestionIds).toEqual(result.wrongQuestionIds);
    expect(rebuilt!.markingSchemeVersion).toBe('v1');
  });

  it('returns null for malformed docs (missing score, counts mismatch)', () => {
    expect(jobAttemptResultFromStoredDoc(null)).toBeNull();
    expect(jobAttemptResultFromStoredDoc({})).toBeNull();
    const { bundle, key } = makeMockBundle();
    const full = scoreMockAttempt({
      bundle, key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A', timeSpentSeconds: 1 },
        { n: 2, questionId: 'q2', selected: 'B', timeSpentSeconds: 1 },
        { n: 3, questionId: 'q3', selected: 'A', timeSpentSeconds: 1 },
      ],
      rulesSnapshot: BCS_SNAPSHOT, examSlug: 'bcs',
      startedAtMillis: 1_000_000, submittedAtMillis: 1_003_000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session: makeSession(), result: full,
      bundleId: 'mock__full__bcs__1', examSlug: 'bcs',
      subjectId: null, topicId: null, kind: 'mock', mockId: 'full__bcs__1',
      questionSetId: 'full__bcs__1_v1',
      bundleVersion: 1, userId: 'student-1',
    });
    expect(jobAttemptResultFromStoredDoc({ ...doc, score: undefined })).toBeNull();
    expect(jobAttemptResultFromStoredDoc({ ...doc, correctCount: 99 })).toBeNull();
    expect(jobAttemptResultFromStoredDoc({ ...doc, answers: [] })).toBeNull();
  });
});

describe('exam lock + receipt + manifest (jobMock.ts pure helpers)', () => {
  it('examLockId is {uid}_{examSlug}; buildExamLockDoc carries the frozen duration', () => {
    expect(examLockId('student-1', 'bcs')).toBe('student-1_bcs');
    const lock = buildExamLockDoc({
      uid: 'student-1', examSlug: 'bcs', mockId: 'full__bcs__1',
      definitionId: 'full__bcs__1', activeSessionId: 'sess-1', durationSeconds: 7200,
    });
    expect(lock.status).toBe('in_progress');
    expect(lock.durationSeconds).toBe(7200);
    expect(lock.activeSessionId).toBe('sess-1');
    expect(lock.createdAt).toBeDefined();
  });

  it('isExamLockLive: live while in_progress and fresh, dead when terminal or stale', () => {
    const base = buildExamLockDoc({
      uid: 'student-1', examSlug: 'bcs', mockId: 'full__bcs__1',
      definitionId: 'full__bcs__1', activeSessionId: 'sess-1', durationSeconds: 7200,
    });
    const live = { ...base, createdAt: { toMillis: () => 1_000_000 } };
    expect(isExamLockLive(live, 1_000_000 + 60 * 1000)).toBe(true);
    expect(isExamLockLive({ ...live, status: 'terminal' }, 1_000_000 + 60 * 1000)).toBe(false);
    // Stale: createdAt + 7200s + 15min grace = 1_000_000 + 8_100_000.
    expect(isExamLockLive(live, 1_000_000 + 8_100_000)).toBe(false);
    expect(isExamLockLive(live, 1_000_000 + 8_099_000)).toBe(true);
    expect(isExamLockLive(null)).toBe(false);
  });

  it('buildMockReceiptDoc carries purpose exam_review + the stored bundleVersion', () => {
    const r = buildMockReceiptDoc('student-1', 'mock__full__bcs__1', 'sess-1', 2);
    expect(r.purpose).toBe('exam_review');
    expect(r.bundleVersion).toBe(2);
    expect(r.attemptId).toBe('sess-1');
    expect(r.userId).toBe('student-1');
  });

  it('validateExamManifest: refs size must equal questionCount; version ≥ 1', () => {
    const good = {
      examSlug: 'bcs', mockId: 'full__bcs__1', version: 1, questionCount: 2,
      questionRefs: [
        { bundleId: 'mock__full__bcs__1', n: 1, questionId: 'q1' },
        { bundleId: 'mock__full__bcs__1', n: 2, questionId: 'q2' },
      ],
      markingSchemeVersion: 'v1', status: 'published',
    };
    expect(validateExamManifest(good)).toEqual([]);
    expect(validateExamManifest({ ...good, questionCount: 3 }).length).toBeGreaterThan(0);
    expect(validateExamManifest({ ...good, version: 0 }).length).toBeGreaterThan(0);
    expect(validateExamManifest({ ...good, questionRefs: [{ bundleId: 'x', n: 0, questionId: '' }] }).length).toBeGreaterThan(0);
    expect(validateExamManifest(null).length).toBeGreaterThan(0);
  });

  it('buildJobAttemptDoc throws without questionSetId for mock, and with it for practice', () => {
    const { bundle, key } = makeMockBundle();
    const result = scoreMockAttempt({
      bundle, key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A', timeSpentSeconds: 1 },
        { n: 2, questionId: 'q2', selected: 'B', timeSpentSeconds: 1 },
        { n: 3, questionId: 'q3', selected: 'A', timeSpentSeconds: 1 },
      ],
      rulesSnapshot: BCS_SNAPSHOT, examSlug: 'bcs',
      startedAtMillis: 1_000_000, submittedAtMillis: 1_003_000,
    });
    const session = makeSession();
    expect(() => buildJobAttemptDoc({
      sessionId: 'sess-1', session, result,
      bundleId: 'mock__full__bcs__1', examSlug: 'bcs',
      subjectId: null, topicId: null, kind: 'mock', mockId: 'full__bcs__1',
      bundleVersion: 1, userId: 'student-1',
    })).toThrow(/questionSetId/);
    expect(() => buildJobAttemptDoc({
      sessionId: 'sess-1', session, result,
      bundleId: 'mock__full__bcs__1', examSlug: 'bcs',
      subjectId: 'bcs__bangla', topicId: 't1', kind: 'practice',
      questionSetId: 'full__bcs__1_v1',
      bundleVersion: 1, userId: 'student-1',
    })).toThrow(/questionSetId/);
  });
});
