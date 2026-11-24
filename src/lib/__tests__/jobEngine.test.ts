/**
 * Eduvelto Job Preparation — Step 8 unit tests (jobEngine.ts).
 *
 * Covers: exam patterns (all four verified exams + unknown slug),
 * session creation (practice shape, untimed), answer / mark-for-
 * review (the two never clear each other), autosave patch (only the
 * allowed fields), scoring (correct/wrong/unanswered, both negative
 * markings, negative percentage kept, accuracy denominator),
 * attempt doc (exact field set + forced values), timer boundaries,
 * anomaly flags, question ordering, and both validators.
 */
import { describe, it, expect } from 'vitest';
import {
  JOB_EXAM_PATTERNS,
  JOB_PRACTICE_RESULT_LABEL,
  JOB_TIMER_CRITICAL_MILLIS,
  JOB_TIMER_WARNING_MILLIS,
  anomalyFlags,
  answerSessionQuestion,
  buildAutosavePatch,
  buildJobAttemptDoc,
  createPracticeSession,
  goToQuestion,
  jobExamPattern,
  jobTopicLabel,
  jobTopicLabelBn,
  orderQuestionsForMode,
  patternFromRulesSnapshot,
  remainingMillis,
  scorePracticeAttempt,
  sessionProgress,
  timerWarning,
  toggleMarkForReview,
  validateAttemptResult,
  validatePracticeSession,
  type JobPracticeSessionDoc,
} from '../jobEngine';
import type { JobQuestionBundle, JobQuestionKey } from '../jobQuestions';

/* Fixtures: a small bundle + key. Correct letter alternates A (odd
 * n) / B (even n) so "all A" is neither all-correct nor all-wrong. */
function makeBundle(count: number, topics: string[]): { bundle: JobQuestionBundle; key: JobQuestionKey } {
  const bundle: JobQuestionBundle = {
    kind: 'topic',
    examSlug: 'bcs',
    topicId: 't1',
    mockId: null,
    year: null,
    titleBn: 'পরীক্ষা',
    titleEn: 'Test',
    questions: Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      questionId: `q${i + 1}`,
      topicId: topics[i % topics.length],
      subjectId: 'bcs__bangla',
      questionText: `Question ${i + 1}?`,
      options: [
        { letter: 'A' as const, text: 'opt A' },
        { letter: 'B' as const, text: 'opt B' },
        { letter: 'C' as const, text: 'opt C' },
        { letter: 'D' as const, text: 'opt D' },
      ],
      // Step 8 fold-in M3: mixed difficulties so mode-ordering
      // has material (n1 easy, n2 medium, n3 hard, then repeats).
      difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
    })),
    questionCount: count,
    bundleVersion: 1,
    status: 'published',
    reviewStatus: 'Published',
    sourceQuestionIds: Array.from({ length: count }, (_, i) => `q${i + 1}`),
    configVersion: '2026-11-22.1',
  };
  const key: JobQuestionKey = {
    bundleId: 'topic__t1',
    answers: Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      questionId: `q${i + 1}`,
      correctLetter: ((i + 1) % 2 === 1 ? 'A' : 'B') as 'A' | 'B',
      correctText: 'opt A',
      explanation: 'because',
      whyWrong: null,
    })),
    configVersion: '2026-11-22.1',
  };
  return { bundle, key };
}

function makeSession(count = 3): JobPracticeSessionDoc {
  return createPracticeSession({
    sessionId: 'sess-1',
    bundleId: 'topic__t1',
    examSlug: 'bcs',
    questionRefs: Array.from({ length: count }, (_, i) => ({
      bundleId: 'topic__t1',
      n: i + 1,
      questionId: `q${i + 1}`,
    })),
  });
}

/** All-correct answers for a bundle built by makeBundle. */
function allCorrect(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    questionId: `q${i + 1}`,
    selected: ((i + 1) % 2 === 1 ? 'A' : 'B') as 'A' | 'B',
  }));
}

describe('exam patterns', () => {
  it('p1: BCS is 200 MCQ / 2h / −0.50 verified, no fixed pass percent', () => {
    const p = jobExamPattern('bcs');
    expect(p).not.toBeNull();
    expect(p!.questionCount).toBe(200);
    expect(p!.timeMinutes).toBe(120);
    expect(p!.marksPerQuestion).toBe(1);
    expect(p!.negativeMarking).toBe(0.5);
    expect(p!.negativeMarkingVerified).toBe(true);
    expect(p!.passPercent).toBeNull();
    expect(p!.patternLabel).toBe('যাচাইকৃত ধরন');
  });

  it('p2: Bank is 100 MCQ / 1h / −0.25 VERIFIED, no pass percent', () => {
    const p = jobExamPattern('bank');
    expect(p).not.toBeNull();
    expect(p!.questionCount).toBe(100);
    expect(p!.timeMinutes).toBe(60);
    expect(p!.negativeMarking).toBe(0.25);
    expect(p!.negativeMarkingVerified).toBe(true);
    expect(p!.scoringConfigVersion).toBe('v1');
    expect(p!.passPercent).toBeNull();
    expect(p!.patternLabel).toBe('যাচাইকৃত ধরন');
  });

  it('p3: Primary is 90 MCQ / 90 min / −0.25 verified, pass 50%', () => {
    const p = jobExamPattern('primary-teacher');
    expect(p).not.toBeNull();
    expect(p!.questionCount).toBe(90);
    expect(p!.timeMinutes).toBe(90);
    expect(p!.negativeMarking).toBe(0.25);
    expect(p!.negativeMarkingVerified).toBe(true);
    expect(p!.passPercent).toBe(50);
  });

  it('p4: NTRCA is 100 MCQ / 1h / −0.25 verified, pass 40%, 18th label', () => {
    const p = jobExamPattern('ntrca');
    expect(p).not.toBeNull();
    expect(p!.questionCount).toBe(100);
    expect(p!.timeMinutes).toBe(60);
    expect(p!.negativeMarking).toBe(0.25);
    expect(p!.negativeMarkingVerified).toBe(true);
    expect(p!.passPercent).toBe(40);
    expect(p!.patternLabel).toBe('১৮তম ধরন — শেষ যাচাইকৃত ধরন');
  });

  it('p5: unknown slug returns null — never a guessed pattern', () => {
    expect(jobExamPattern('dgfood')).toBeNull();
    expect(jobExamPattern('it-professional')).toBeNull();
    expect(jobExamPattern('no-such-exam')).toBeNull();
  });

  it('p6: exactly the verified exams — four hubs + two post-level Bank configs, no common, no invented', () => {
    expect(Object.keys(JOB_EXAM_PATTERNS).sort()).toEqual([
      'bank',
      'bank-assistant-director',
      'bank-senior-officer',
      'bcs',
      'ntrca',
      'primary-teacher',
    ]);
  });

  it('p6b: Bank post-level patterns resolve (Live Exam §0.1 — separate SO/AD splits)', () => {
    const so = jobExamPattern('bank-senior-officer');
    expect(so).not.toBeNull();
    expect(so!.questionCount).toBe(100);
    expect(so!.timeMinutes).toBe(60);
    expect(so!.negativeMarking).toBe(0.25);
    expect(so!.negativeMarkingVerified).toBe(true);
    expect(so!.patternLabel).toBe('যাচাইকৃত ধরন');
    const ad = jobExamPattern('bank-assistant-director');
    expect(ad).not.toBeNull();
    expect(ad!.questionCount).toBe(100);
    expect(ad!.negativeMarking).toBe(0.25);
    expect(ad!.scoringConfigVersion).toBe('v1');
  });

  it('p7: the result label is the binding practice label', () => {
    expect(JOB_PRACTICE_RESULT_LABEL).toBe('অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়');
  });

  it('p8: patternFromRulesSnapshot defaults an unmapped slug to an honest unverified label', () => {
    // SF4 (22 Nov 2026): the old fallback claimed 'যাচাইকৃত ধরন'
    // for any slug missing from the label map — a future mock for
    // dgfood/cag/etc. would have been mislabelled. The fallback must
    // say the pattern is unverified.
    const p = patternFromRulesSnapshot('dgfood', {
      questionCount: 100,
      timeMinutes: 60,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      negativeMarkingVerified: false,
      passPercent: null,
      scoringConfigVersion: 'test-v1',
    });
    expect(p.patternLabel).toBe('ধরন যাচাই বাকি');
    expect(p.questionCount).toBe(100);
    expect(p.timeMinutes).toBe(60);
  });
});

describe('practice session creation', () => {
  it('s1: practice shape — kind, status, untimed, submittedAt null', () => {
    const s = makeSession();
    expect(s.kind).toBe('practice');
    expect(s.status).toBe('in-progress');
    expect(s.endsAt).toBeNull();
    expect(s.clientEndsAtMillis).toBeNull();
    expect(s.submittedAt).toBeNull();
    expect(s.mockId).toBeNull();
    expect(s.bundleId).toBe('topic__t1');
    expect(s.examSlug).toBe('bcs');
    // No scope fields on the session doc (§2.12; the Step 8 rules
    // allowlist has none) — scope lives on the attempt doc.
    expect('subjectId' in s).toBe(false);
    expect('topicId' in s).toBe(false);
  });

  it('s2: answers map initialised for every question ref', () => {
    const s = makeSession(3);
    expect(s.answers).toEqual({
      1: { selected: null, markedForReview: false, timeSpentSeconds: 0 },
      2: { selected: null, markedForReview: false, timeSpentSeconds: 0 },
      3: { selected: null, markedForReview: false, timeSpentSeconds: 0 },
    });
    expect(s.currentQuestion).toBe(1);
  });

  it('s3: timestamps are serverTimestamp sentinels (present, objects)', () => {
    const s = makeSession();
    for (const f of ['startedAt', 'lastSyncedAt', 'createdAt', 'updatedAt'] as const) {
      expect(s[f]).not.toBeNull();
      expect(typeof s[f]).toBe('object');
    }
  });

  it('s4: the created session passes its own validator', () => {
    expect(validatePracticeSession(makeSession())).toEqual([]);
  });

  it('s5: revision starts at 1 (Step 8 fold-in, finding 6)', () => {
    expect(makeSession().revision).toBe(1);
  });

  it('s6: currentQuestion is the FIRST ref\'s n when refs are mode-ordered (Step 8 fold-in, finding 3)', () => {
    const s = createPracticeSession({
      sessionId: 'sess-1',
      bundleId: 'topic__t1',
      examSlug: 'bcs',
      questionRefs: [
        { bundleId: 'topic__t1', n: 2, questionId: 'q2' },
        { bundleId: 'topic__t1', n: 3, questionId: 'q3' },
        { bundleId: 'topic__t1', n: 1, questionId: 'q1' },
      ],
    });
    expect(s.currentQuestion).toBe(2);
    expect(validatePracticeSession(s)).toEqual([]);
  });
});

describe('answer / mark-for-review / navigation', () => {
  it('a1: answering never clears markedForReview', () => {
    const s0 = toggleMarkForReview(makeSession(), 1);
    expect(s0.answers[1].markedForReview).toBe(true);
    const s1 = answerSessionQuestion(s0, 1, 'B');
    expect(s1.answers[1].selected).toBe('B');
    expect(s1.answers[1].markedForReview).toBe(true);
  });

  it('a2: marking for review never clears the selected answer', () => {
    const s0 = answerSessionQuestion(makeSession(), 2, 'C');
    const s1 = toggleMarkForReview(s0, 2);
    expect(s1.answers[2].selected).toBe('C');
    expect(s1.answers[2].markedForReview).toBe(true);
    const s2 = toggleMarkForReview(s1, 2);
    expect(s2.answers[2].selected).toBe('C');
    expect(s2.answers[2].markedForReview).toBe(false);
  });

  it('a3: pure functions — the input session is not mutated', () => {
    const s0 = makeSession();
    answerSessionQuestion(s0, 1, 'A');
    toggleMarkForReview(s0, 1);
    goToQuestion(s0, 2);
    expect(s0.answers[1].selected).toBeNull();
    expect(s0.answers[1].markedForReview).toBe(false);
    expect(s0.currentQuestion).toBe(1);
  });

  it('a4: goToQuestion moves the pointer; out of range throws', () => {
    expect(goToQuestion(makeSession(), 3).currentQuestion).toBe(3);
    expect(() => goToQuestion(makeSession(), 0)).toThrow();
    expect(() => goToQuestion(makeSession(), 4)).toThrow();
  });

  it('a5: answering an out-of-range question throws', () => {
    expect(() => answerSessionQuestion(makeSession(), 9, 'A')).toThrow();
    expect(() => answerSessionQuestion(makeSession(), 1, 'E' as never)).toThrow();
  });

  it('a6: sessionProgress counts answered / marked / total / current', () => {
    let s = makeSession(3);
    s = answerSessionQuestion(s, 1, 'A');
    s = toggleMarkForReview(s, 2);
    s = toggleMarkForReview(s, 1);
    s = goToQuestion(s, 2);
    expect(sessionProgress(s)).toEqual({ answered: 1, marked: 2, total: 3, current: 2 });
  });
});

describe('autosave patch', () => {
  it('u1: only the five allowed fields (four Step 8 fields + revision)', () => {
    const patch = buildAutosavePatch(makeSession());
    expect(Object.keys(patch).sort()).toEqual([
      'answers',
      'currentQuestion',
      'lastSyncedAt',
      'revision',
      'updatedAt',
    ]);
  });

  it('u2: patch carries the live answers + current question', () => {
    let s = makeSession();
    s = answerSessionQuestion(s, 2, 'D');
    s = goToQuestion(s, 2);
    const patch = buildAutosavePatch(s);
    expect(patch.answers[2].selected).toBe('D');
    expect(patch.currentQuestion).toBe(2);
    expect(patch.lastSyncedAt).not.toBeNull();
    expect(patch.updatedAt).not.toBeNull();
  });

  it('u3: patch revision is exactly session.revision + 1 (Step 8 fold-in, finding 6)', () => {
    const s = makeSession();
    expect(buildAutosavePatch(s).revision).toBe(2);
    expect(buildAutosavePatch({ ...s, revision: 4 }).revision).toBe(5);
  });
});

describe('scoring', () => {
  it('c1: all-correct — full score, accuracy 100, percentage 100', () => {
    const { bundle, key } = makeBundle(4, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: allCorrect(4),
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 1000,
      submittedAtMillis: 121000,
    });
    expect(r.score).toBe(4);
    expect(r.clientCalculatedScore).toBe(4);
    expect(r.totalMarks).toBe(4);
    expect(r.negativeDeduction).toBe(0);
    expect(r.correctCount).toBe(4);
    expect(r.wrongCount).toBe(0);
    expect(r.unansweredCount).toBe(0);
    expect(r.accuracy).toBe(100);
    expect(r.percentage).toBe(100);
    expect(r.timeSpentSeconds).toBe(120);
    expect(r.wrongQuestionIds).toEqual([]);
    expect(r.answers[0]).toMatchObject({ n: 1, selected: 'A', correct: true, marks: 1, correctText: 'opt A' });
  });

  it('c2: all-wrong with −0.25 (Primary, verified) — deduction, negative percentage kept', () => {
    const { bundle, key } = makeBundle(2, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'C' as const },
        { n: 2, questionId: 'q2', selected: 'C' as const },
      ],
      pattern: jobExamPattern('primary-teacher')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    expect(r.score).toBe(-0.5);
    expect(r.negativeDeduction).toBe(0.5);
    expect(r.negativeMarkingUsed).toBe(0.25);
    expect(r.markingSchemeVersion).toBe('v1');
    expect(r.correctCount).toBe(0);
    expect(r.wrongCount).toBe(2);
    expect(r.accuracy).toBe(0);
    expect(r.percentage).toBe(-25);
  });

  it('c2b: Bank all-wrong — −0.25 per wrong (verified 24 Nov 2026)', () => {
    const { bundle, key } = makeBundle(2, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'C' as const },
        { n: 2, questionId: 'q2', selected: 'C' as const },
      ],
      pattern: jobExamPattern('bank')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    expect(r.score).toBe(-0.5);
    expect(r.negativeDeduction).toBe(0.5);
    expect(r.negativeMarkingUsed).toBe(0.25);
    expect(r.markingSchemeVersion).toBe('v1');
    expect(r.wrongCount).toBe(2);
    expect(r.percentage).toBe(-25);
  });

  it('c3: all-wrong with −0.50 (BCS) — deduction is 0.5 per wrong', () => {
    const { bundle, key } = makeBundle(2, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'C' as const },
        { n: 2, questionId: 'q2', selected: 'C' as const },
      ],
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    expect(r.score).toBe(-1);
    expect(r.negativeDeduction).toBe(1);
    expect(r.percentage).toBe(-50);
  });

  it('c4: unanswered = 0 marks, not wrong (Bank −0.25 on the one wrong answer)', () => {
    const { bundle, key } = makeBundle(4, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A' as const },
        { n: 2, questionId: 'q2', selected: 'B' as const },
        { n: 3, questionId: 'q3', selected: 'C' as const },
        { n: 4, questionId: 'q4', selected: null },
      ],
      pattern: jobExamPattern('bank')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    expect(r.correctCount).toBe(2);
    expect(r.wrongCount).toBe(1);
    expect(r.unansweredCount).toBe(1);
    // 2 correct − 1 wrong × 0.25 (Bank penalty verified 24 Nov 2026).
    expect(r.score).toBe(1.75);
    expect(r.negativeDeduction).toBe(0.25);
    expect(r.negativeMarkingUsed).toBe(0.25);
    expect(r.answers[3]).toMatchObject({ selected: null, correct: false, marks: 0 });
  });

  it('c5: accuracy divides by ANSWERED only (unanswered excluded); percentage is after the Bank −0.25', () => {
    const { bundle, key } = makeBundle(4, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A' as const },
        { n: 2, questionId: 'q2', selected: 'B' as const },
        { n: 3, questionId: 'q3', selected: 'C' as const },
        { n: 4, questionId: 'q4', selected: null },
      ],
      pattern: jobExamPattern('bank')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    expect(r.accuracy).toBeCloseTo(66.67, 2);
    // Score 1.75 / 4 marks = 43.75% (2 correct − 1 wrong × 0.25).
    expect(r.percentage).toBe(43.75);
  });

  it('c6: wrongQuestionIds + weakTopics ordered by wrong desc', () => {
    const { bundle, key } = makeBundle(4, ['t1', 't2']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'C' as const },
        { n: 2, questionId: 'q2', selected: 'C' as const },
        { n: 3, questionId: 'q3', selected: 'C' as const },
        { n: 4, questionId: 'q4', selected: 'B' as const },
      ],
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    expect(r.wrongQuestionIds).toEqual(['q1', 'q2', 'q3']);
    expect(r.weakTopics).toEqual([
      { topicId: 't1', wrong: 2, total: 2 },
      { topicId: 't2', wrong: 1, total: 2 },
    ]);
  });

  it('c7: null key throws — practice never scores without a key', () => {
    const { bundle } = makeBundle(2, ['t1']);
    expect(() =>
      scorePracticeAttempt({
        bundle,
        key: null,
        answers: [],
        pattern: jobExamPattern('bcs')!,
        startedAtMillis: 0,
        submittedAtMillis: 1000,
      }),
    ).toThrow(/key is null/);
  });

  it('c8: key/bundle mismatch throws (count + questionId)', () => {
    const { bundle, key } = makeBundle(2, ['t1']);
    const shortKey: JobQuestionKey = { ...key, answers: key.answers.slice(0, 1) };
    expect(() =>
      scorePracticeAttempt({
        bundle,
        key: shortKey,
        answers: [],
        pattern: jobExamPattern('bcs')!,
        startedAtMillis: 0,
        submittedAtMillis: 1000,
      }),
    ).toThrow(/!= bundle questions/);
    const wrongIdKey: JobQuestionKey = {
      ...key,
      answers: [{ ...key.answers[0], questionId: 'qX' }, key.answers[1]],
    };
    expect(() =>
      scorePracticeAttempt({
        bundle,
        key: wrongIdKey,
        answers: [],
        pattern: jobExamPattern('bcs')!,
        startedAtMillis: 0,
        submittedAtMillis: 1000,
      }),
    ).toThrow(/no matching answer/);
  });

  it('c9: an answer outside the bundle throws', () => {
    const { bundle, key } = makeBundle(2, ['t1']);
    expect(() =>
      scorePracticeAttempt({
        bundle,
        key,
        answers: [{ n: 9, questionId: 'q9', selected: 'A' as const }],
        pattern: jobExamPattern('bcs')!,
        startedAtMillis: 0,
        submittedAtMillis: 1000,
      }),
    ).toThrow(/not in the bundle/);
  });

  it('c10: per-question time is carried into the result answers', () => {
    const { bundle, key } = makeBundle(1, ['t1']);
    const r = scorePracticeAttempt({
      bundle,
      key,
      answers: [{ n: 1, questionId: 'q1', selected: 'A' as const, timeSpentSeconds: 42 }],
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0,
      submittedAtMillis: 42000,
    });
    expect(r.answers[0].timeSpentSeconds).toBe(42);
    expect(r.timeSpentSeconds).toBe(42);
  });
});

describe('attempt doc', () => {
  function makeAttemptDoc() {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle,
      key,
      answers: allCorrect(2),
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0,
      submittedAtMillis: 60000,
    });
    return buildJobAttemptDoc({
      sessionId: 'sess-1',
      session,
      result,
      bundleId: 'topic__t1',
      examSlug: 'bcs',
      subjectId: 'bcs__bangla',
      topicId: 't1',
      kind: 'practice',
      bundleVersion: 1,
      userId: 'user-1',
    });
  }

  it('d1: exact field set (Step 3 §2.11 + userId + H.3 submissionIntegrity)', () => {
    expect(Object.keys(makeAttemptDoc()).sort()).toEqual(
      [
        'accuracy', 'anomalyFlags', 'answerHashes', 'answers', 'audit',
        'bundleId', 'bundleVersion', 'clientCalculatedScore', 'correctCount', 'examSlug',
        'markingSchemeVersion', 'markingStatus', 'mockId', 'negativeDeduction',
        'negativeMarkingUsed', 'percentage',
        'resultLabel', 'resultType', 'score', 'serverVerifiedScore',
        'sessionId', 'startedAt', 'status', 'subjectId', 'submittedAt',
        'submissionIntegrity',
        'timeSpentSeconds', 'topicId', 'totalMarks', 'trustLevel',
        'unansweredCount', 'userId', 'wrongCount', 'kind',
      ].sort(),
    );
    expect(makeAttemptDoc().submissionIntegrity).toBe('client_calculated');
  });

  it('d2: forced values — submitted / auto / practice / unverified', () => {
    const doc = makeAttemptDoc();
    expect(doc.status).toBe('submitted');
    expect(doc.markingStatus).toBe('auto');
    expect(doc.resultLabel).toBe('practice');
    expect(doc.trustLevel).toBe('unverified');
    expect(doc.resultType).toBe('practice');
    expect(doc.kind).toBe('practice');
    expect(doc.mockId).toBeNull();
  });

  it('d3: clientCalculatedScore == score; serverVerifiedScore null', () => {
    const doc = makeAttemptDoc();
    expect(doc.clientCalculatedScore).toBe(doc.score);
    expect(doc.score).toBe(2);
    expect(doc.serverVerifiedScore).toBeNull();
  });

  it('d4: sessionId == doc ID, userId + timestamps carried', () => {
    const doc = makeAttemptDoc();
    expect(doc.sessionId).toBe('sess-1');
    expect(doc.userId).toBe('user-1');
    expect(doc.startedAt).not.toBeNull();
    expect(doc.submittedAt).not.toBeNull();
  });

  it('d5: anomaly flags are computed into the doc (audit-only)', () => {
    const doc = makeAttemptDoc();
    expect(doc.anomalyFlags).toEqual(['too-fast']);
  });

  it('d6: the built doc passes its own validator', () => {
    expect(validateAttemptResult(makeAttemptDoc())).toEqual([]);
  });
});

describe('timer', () => {
  it('t1: untimed — remaining null, warning untimed', () => {
    expect(remainingMillis(null, 1000)).toBeNull();
    expect(timerWarning(null)).toBe('untimed');
  });

  it('t2: remaining is endsAt − now', () => {
    expect(remainingMillis(600000, 100000)).toBe(500000);
    expect(remainingMillis(100000, 200000)).toBe(-100000);
  });

  it('t3: warning boundary — 5 min is warning, just over is ok', () => {
    expect(JOB_TIMER_WARNING_MILLIS).toBe(5 * 60 * 1000);
    expect(timerWarning(300000)).toBe('warning');
    expect(timerWarning(300001)).toBe('ok');
  });

  it('t4: critical boundary — 1 min is critical, just over is warning', () => {
    expect(JOB_TIMER_CRITICAL_MILLIS).toBe(60 * 1000);
    expect(timerWarning(60000)).toBe('critical');
    expect(timerWarning(60001)).toBe('warning');
  });

  it('t5: expired at 0 and below', () => {
    expect(timerWarning(0)).toBe('expired');
    expect(timerWarning(-1)).toBe('expired');
  });

  it('t6: thresholds are configurable via options', () => {
    expect(timerWarning(120000, { warningMillis: 60000, criticalMillis: 30000 })).toBe('ok');
    expect(timerWarning(60000, { warningMillis: 60000, criticalMillis: 30000 })).toBe('warning');
    expect(timerWarning(30000, { warningMillis: 60000, criticalMillis: 30000 })).toBe('critical');
  });
});

describe('anomaly flags', () => {
  it('f1: 100% correct in under 2 minutes is too-fast', () => {
    expect(anomalyFlags({ correctCount: 10, totalQuestions: 10, timeSpentSeconds: 119 })).toEqual(['too-fast']);
    expect(anomalyFlags({ correctCount: 10, totalQuestions: 10, timeSpentSeconds: 120 })).toEqual([]);
  });

  it('f2: under 10 seconds per question on average', () => {
    expect(anomalyFlags({ correctCount: 5, totalQuestions: 10, timeSpentSeconds: 99 })).toEqual(['too-fast-per-question']);
    expect(anomalyFlags({ correctCount: 5, totalQuestions: 10, timeSpentSeconds: 100 })).toEqual([]);
  });

  it('f3: both flags can apply at once', () => {
    expect(anomalyFlags({ correctCount: 2, totalQuestions: 2, timeSpentSeconds: 10 })).toEqual([
      'too-fast',
      'too-fast-per-question',
    ]);
  });

  it('f4: ordinary attempts get no flags; zero questions get none', () => {
    expect(anomalyFlags({ correctCount: 5, totalQuestions: 10, timeSpentSeconds: 600 })).toEqual([]);
    expect(anomalyFlags({ correctCount: 0, totalQuestions: 0, timeSpentSeconds: 0 })).toEqual([]);
  });
});

describe('question ordering', () => {
  const qs = [
    { id: 'h1', difficulty: 'hard' as const },
    { id: 'e1', difficulty: 'easy' as const },
    { id: 'm1', difficulty: 'medium' as const },
    { id: 'e2', difficulty: 'easy' as const },
    { id: 'm2', difficulty: 'medium' as const },
  ];

  it('o1: beginner — Easy → Medium, Hard last', () => {
    expect(orderQuestionsForMode(qs, 'beginner').map((q) => q.id)).toEqual([
      'e1', 'e2', 'm1', 'm2', 'h1',
    ]);
  });

  it('o2: advanced — Medium → Hard, Easy last', () => {
    expect(orderQuestionsForMode(qs, 'advanced').map((q) => q.id)).toEqual([
      'm1', 'm2', 'h1', 'e1', 'e2',
    ]);
  });

  it('o3: stable within a band and does not mutate the input', () => {
    const before = qs.map((q) => q.id);
    orderQuestionsForMode(qs, 'beginner');
    expect(qs.map((q) => q.id)).toEqual(before);
  });
});

describe('validators', () => {
  it('v1: practice session with a real endsAt fails (practice is untimed)', () => {
    const bad = { ...makeSession(), endsAt: new Date() };
    expect(validatePracticeSession(bad)).toEqual(
      expect.arrayContaining([expect.stringContaining('endsAt must be null')]),
    );
  });

  it('v2: unknown field + answers-key mismatch both fail', () => {
    const bad = { ...makeSession(), extraField: 1 };
    expect(validatePracticeSession(bad)).toEqual(
      expect.arrayContaining([expect.stringContaining("unknown field 'extraField'")]),
    );
    const badAnswers = { ...makeSession(), answers: { 1: { selected: null, markedForReview: false, timeSpentSeconds: 0 } } };
    expect(validatePracticeSession(badAnswers)).toEqual(
      expect.arrayContaining([expect.stringContaining('answers keys must match')]),
    );
  });

  it('v3: session with a bad selected value fails', () => {
    const s = makeSession();
    const bad = { ...s, answers: { ...s.answers, 1: { selected: 'Z', markedForReview: false, timeSpentSeconds: 0 } } };
    expect(validatePracticeSession(bad)).toEqual(
      expect.arrayContaining([expect.stringContaining('selected must be A/B/C/D')]),
    );
  });

  it('v4: attempt with resultLabel verified fails', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key, answers: allCorrect(2), pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    expect(validateAttemptResult({ ...doc, resultLabel: 'verified' })).toEqual(
      expect.arrayContaining([expect.stringContaining("resultLabel must be 'practice'")]),
    );
  });

  it('v5: clientCalculatedScore != score fails; non-null serverVerifiedScore fails', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key, answers: allCorrect(2), pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    expect(validateAttemptResult({ ...doc, clientCalculatedScore: 99 })).toEqual(
      expect.arrayContaining([expect.stringContaining('clientCalculatedScore')]),
    );
    expect(validateAttemptResult({ ...doc, serverVerifiedScore: 2 })).toEqual(
      expect.arrayContaining([expect.stringContaining('serverVerifiedScore must be null')]),
    );
  });

  it('v6: count mismatch + unknown field fail', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key, answers: allCorrect(2), pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    expect(validateAttemptResult({ ...doc, correctCount: 1 })).toEqual(
      expect.arrayContaining([expect.stringContaining('correctCount')]),
    );
    expect(validateAttemptResult({ ...doc, verified: true })).toEqual(
      expect.arrayContaining([expect.stringContaining("unknown field 'verified'")]),
    );
  });

  it('v7: missing userId fails (receipt gate needs it)', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key, answers: allCorrect(2), pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1,
    });
    expect(validateAttemptResult(doc)).toEqual(
      expect.arrayContaining([expect.stringContaining('userId is required')]),
    );
  });

  it('v8: non-object inputs fail cleanly', () => {
    expect(validatePracticeSession(null)).toHaveLength(1);
    expect(validatePracticeSession('nope')).toHaveLength(1);
    expect(validateAttemptResult(null)).toHaveLength(1);
    expect(validateAttemptResult([])).toHaveLength(1);
  });

  // Step 8 fold-in (ChatGPT findings 2/5/9): the attempt's declared
  // marking scheme must be present, consistent, and bound to the
  // bundle generation.
  it('v9: missing negativeMarkingUsed / markingSchemeVersion / bundleVersion fail', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key, answers: allCorrect(2), pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    const { negativeMarkingUsed: _u, ...noUsed } = doc;
    expect(validateAttemptResult(noUsed)).toEqual(
      expect.arrayContaining([expect.stringContaining('negativeMarkingUsed')]),
    );
    const { markingSchemeVersion: _m, ...noScheme } = doc;
    expect(validateAttemptResult(noScheme)).toEqual(
      expect.arrayContaining([expect.stringContaining('markingSchemeVersion')]),
    );
    const { bundleVersion: _b, ...noBundle } = doc;
    expect(validateAttemptResult(noBundle)).toEqual(
      expect.arrayContaining([expect.stringContaining('bundleVersion')]),
    );
  });

  it('v10: negativeDeduction != wrongCount * negativeMarkingUsed fails', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A' as const },
        { n: 2, questionId: 'q2', selected: 'C' as const },
      ],
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    expect(validateAttemptResult(doc)).toEqual([]);
    // Bank-style fabrication: claim a 0.25 deduction on a 0.5 scheme.
    expect(validateAttemptResult({ ...doc, negativeDeduction: 0.25 })).toEqual(
      expect.arrayContaining([expect.stringContaining('negativeDeduction')]),
    );
  });

  it('v11: wrong-answer marks must equal -negativeMarkingUsed', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key,
      answers: [
        { n: 1, questionId: 'q1', selected: 'A' as const },
        { n: 2, questionId: 'q2', selected: 'C' as const },
      ],
      pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    const tampered = {
      ...doc,
      answers: (doc.answers as Array<Record<string, unknown>>).map((a) =>
        a.correct === false ? { ...a, marks: -0.25 } : a,
      ),
    };
    expect(validateAttemptResult(tampered)).toEqual(
      expect.arrayContaining([expect.stringContaining('marks == -negativeMarkingUsed')]),
    );
  });

  it('v12: bundleVersion 0 / empty markingSchemeVersion fail', () => {
    const session = makeSession(2);
    const { bundle, key } = makeBundle(2, ['t1']);
    const result = scorePracticeAttempt({
      bundle, key, answers: allCorrect(2), pattern: jobExamPattern('bcs')!,
      startedAtMillis: 0, submittedAtMillis: 60000,
    });
    const doc = buildJobAttemptDoc({
      sessionId: 'sess-1', session, result, bundleId: 'topic__t1',
      examSlug: 'bcs', subjectId: 'bcs__bangla', topicId: 't1',
      kind: 'practice', bundleVersion: 1, userId: 'user-1',
    });
    expect(validateAttemptResult({ ...doc, bundleVersion: 0 })).toEqual(
      expect.arrayContaining([expect.stringContaining('bundleVersion')]),
    );
    expect(validateAttemptResult({ ...doc, markingSchemeVersion: '' })).toEqual(
      expect.arrayContaining([expect.stringContaining('markingSchemeVersion')]),
    );
  });

  it('v13: session revision 0 / missing fails validation (Step 8 fold-in, finding 6)', () => {
    expect(validatePracticeSession({ ...makeSession(), revision: 0 })).toEqual(
      expect.arrayContaining([expect.stringContaining('revision must be an integer')]),
    );
    const { revision: _r, ...noRevision } = makeSession();
    expect(validatePracticeSession(noRevision)).toEqual(
      expect.arrayContaining([expect.stringContaining('revision must be an integer')]),
    );
    expect(validatePracticeSession({ ...makeSession(), revision: 3 })).toEqual([]);
  });
});

describe('jobTopicLabelBn (Step 9 closure, D7)', () => {
  it('humanizes a 4-segment topic ID into subject — chapter — topic', () => {
    expect(jobTopicLabelBn('bcs__english__grammar__tense')).toBe('English — Grammar — Tense');
    expect(jobTopicLabelBn('bank__math__arithmetic__percentage')).toBe('Math — Arithmetic — Percentage');
  });

  it('falls back gracefully for shorter IDs and never shows the raw slug', () => {
    expect(jobTopicLabelBn('bcs__english__grammar')).toBe('English — Grammar');
    expect(jobTopicLabelBn('bcs__english')).toBe('English');
    expect(jobTopicLabelBn('bcs')).toBe('Bcs');
    expect(jobTopicLabelBn('')).toBe('অজানা টপিক');
    expect(jobTopicLabelBn('____')).toBe('অজানা টপিক');
  });
});

describe('language system (24 Nov 2026) — jobTopicLabel', () => {
  it('renders the same humanized label in English, unknown-topic fallback in English', () => {
    expect(jobTopicLabel('bcs__english__grammar__tense', 'en')).toBe('English — Grammar — Tense');
    expect(jobTopicLabel('', 'en')).toBe('Unknown topic');
    expect(jobTopicLabel('', 'bn')).toBe('অজানা টপিক');
  });
});
