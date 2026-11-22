/**
 * Eduvelto Job Preparation — Step 10 unit tests (jobAnalysis.ts).
 *
 * Covers: negative-marking explanation (penalty applied + the
 * penalty-disabled case — never a "−0"), per-topic accuracy +
 * per-subject time, action badges (concept / speed / careless),
 * slow-answer + time×accuracy buckets, trends (own past only),
 * topic mastery over time, time-management summary, the Step 13
 * wrong-answer list builder, and the weak-topic practice link.
 * The Firestore read paths (list loaders) are covered by the
 * rules tests (emulator-tests/rules-step10-result-analysis.test.ts).
 */
import { describe, it, expect } from 'vitest';
import {
  attemptSummaryFromStored,
  buildWrongAnswerList,
  classifyAnswerTime,
  correctVsWrongTime,
  displayPercentage,
  formatDurationBn,
  groupAttemptsByExam,
  isSlowAnswer,
  marksPerQuestion,
  negativeMarkingExplanation,
  perSubjectTime,
  perTopicAccuracy,
  resultObservation,
  timeManagementSummary,
  topicActionBadge,
  topicLevel,
  topicMasteryOverTime,
  attemptTrend,
  weakTopicPracticeLink,
  type JobAttemptSummary,
} from '../jobAnalysis';
import type { JobAttemptAnswer } from '../jobEngine';

function answer(
  n: number,
  overrides: Partial<JobAttemptAnswer> = {},
): JobAttemptAnswer {
  return {
    n,
    questionId: `q-${n}`,
    topicId: 'bcs__english__grammar__tense',
    subjectId: 'bcs__english',
    selected: 'A',
    correct: true,
    marks: 1,
    correctText: 'A',
    timeSpentSeconds: 45,
    ...overrides,
  };
}

function attempt(overrides: Partial<JobAttemptSummary> = {}): JobAttemptSummary {
  return {
    docId: 'sess-1',
    kind: 'mock',
    examSlug: 'bcs',
    bundleId: 'mock__full__bcs__1',
    mockId: 'full__bcs__1',
    score: 1.5,
    totalMarks: 3,
    percentage: 50,
    correctCount: 2,
    wrongCount: 1,
    unansweredCount: 0,
    negativeDeduction: 0.5,
    negativeMarkingUsed: 0.5,
    timeSpentSeconds: 135,
    submittedAtMillis: 1763800000000,
    answers: [answer(1, { selected: 'C', correct: true }), answer(2, { selected: 'A', correct: true }), answer(3, { selected: 'B', correct: false, correctText: 'D' })],
    ...overrides,
  };
}

describe('displayPercentage', () => {
  it('clamps a negative stored percentage at 0', () => {
    expect(displayPercentage(-50)).toBe(0);
    expect(displayPercentage(62.5)).toBe(62.5);
  });
});

describe('formatDurationBn', () => {
  it('renders seconds-only, minutes-only and mixed durations', () => {
    expect(formatDurationBn(45)).toBe('45 সেকেন্ড');
    expect(formatDurationBn(120)).toBe('2 মিনিট');
    expect(formatDurationBn(135)).toBe('2 মিনিট 15 সেকেন্ড');
    expect(formatDurationBn(0)).toBe('0 সেকেন্ড');
  });
});

describe('negativeMarkingExplanation', () => {
  it('shows the formula and the cost of wrong answers (BCS −0.50)', () => {
    const e = negativeMarkingExplanation(attempt());
    expect(e.disabled).toBe(false);
    expect(e.penaltyPerWrong).toBe(0.5);
    expect(e.formula).toBe('2টি সঠিক × 1 − 1টি ভুল × 0.5 = 1.5 নম্বর');
    expect(e.costLine).toBe('1টি ভুল উত্তরে 0.5 নম্বর কাটা গেছে');
  });

  it('penalty disabled (Bank): never shows a "−0", says the penalty is off', () => {
    const e = negativeMarkingExplanation(
      attempt({ negativeMarkingUsed: 0, negativeDeduction: 0, score: 2, correctCount: 2, wrongCount: 1 }),
    );
    expect(e.disabled).toBe(true);
    expect(e.penaltyPerWrong).toBe(0);
    expect(e.formula).toContain('নেগেটিভ মার্কিং বন্ধ');
    expect(e.formula).not.toContain('− 1টি ভুল');
    expect(e.costLine).toBe('');
  });

  it('no wrong answers: no cost line', () => {
    const e = negativeMarkingExplanation(
      attempt({ wrongCount: 0, negativeDeduction: 0, score: 3, correctCount: 3 }),
    );
    expect(e.costLine).toBe('');
  });
});

describe('marksPerQuestion', () => {
  it('reads the per-question mark from a correct answer', () => {
    expect(marksPerQuestion(attempt())).toBe(1);
    expect(marksPerQuestion(attempt({ answers: [answer(1, { marks: 2 })] }))).toBe(2);
  });

  it('falls back to 1 when nothing is correct', () => {
    expect(marksPerQuestion(attempt({ answers: [answer(1, { correct: false })] }))).toBe(1);
  });
});

describe('perTopicAccuracy', () => {
  it('aggregates correct/total, accuracy % and time per topic', () => {
    const stats = perTopicAccuracy([
      answer(1, { correct: true, timeSpentSeconds: 30 }),
      answer(2, { correct: true, timeSpentSeconds: 60 }),
      answer(3, { correct: false, timeSpentSeconds: 45 }),
      answer(4, { topicId: 'bcs__bangla__grammar__sandhi', subjectId: 'bcs__bangla', selected: null, correct: false, timeSpentSeconds: 10 }),
    ]);
    expect(stats).toHaveLength(2);
    const tense = stats.find((s) => s.topicId === 'bcs__english__grammar__tense')!;
    expect(tense.correct).toBe(2);
    expect(tense.wrong).toBe(1);
    expect(tense.total).toBe(3);
    expect(tense.accuracy).toBe(66.7);
    expect(tense.timeSeconds).toBe(135);
    expect(tense.avgWrongTimeSeconds).toBe(45);
    expect(stats[0].topicId).toBe('bcs__english__grammar__tense');
  });

  it('labels topics with jobTopicLabelBn, never raw slugs', () => {
    const stats = perTopicAccuracy([answer(1)]);
    expect(stats[0].label).toBe('English — Grammar — Tense');
    expect(stats[0].label).not.toContain('bcs__');
  });
});

describe('perSubjectTime', () => {
  it('aggregates time by subjectId', () => {
    const stats = perSubjectTime([
      answer(1, { timeSpentSeconds: 30 }),
      answer(2, { timeSpentSeconds: 60 }),
      answer(3, { topicId: 'bcs__bangla__grammar__sandhi', subjectId: 'bcs__bangla', timeSpentSeconds: 90 }),
    ]);
    expect(stats).toHaveLength(2);
    expect(stats[0].subjectId).toBe('bcs__bangla');
    expect(stats[0].timeSeconds).toBe(90);
    expect(stats[1].avgTimeSeconds).toBe(45);
  });
});

describe('topicActionBadge', () => {
  it('careless: fast wrong answers leak marks', () => {
    const [stat] = perTopicAccuracy([
      answer(1, { correct: true, timeSpentSeconds: 40 }),
      answer(2, { correct: false, timeSpentSeconds: 12 }),
      answer(3, { correct: false, timeSpentSeconds: 18 }),
    ]);
    expect(topicActionBadge(stat)).toBe('careless');
  });

  it('speed trap: slow wrong answers while correct ones are quick', () => {
    const [stat] = perTopicAccuracy([
      answer(1, { correct: true, timeSpentSeconds: 30 }),
      answer(2, { correct: true, timeSpentSeconds: 40 }),
      answer(3, { correct: false, timeSpentSeconds: 120 }),
      answer(4, { correct: false, timeSpentSeconds: 150 }),
    ]);
    expect(topicActionBadge(stat)).toBe('speed');
  });

  it('concept gap: low accuracy with neither fast-wrong nor slow-wrong pattern', () => {
    const [stat] = perTopicAccuracy([
      answer(1, { correct: false, timeSpentSeconds: 50 }),
      answer(2, { correct: false, timeSpentSeconds: 55 }),
      answer(3, { correct: false, timeSpentSeconds: 60 }),
      answer(4, { correct: true, timeSpentSeconds: 50 }),
    ]);
    expect(topicActionBadge(stat)).toBe('concept');
  });

  it('no badge when nothing is wrong, or accuracy is high', () => {
    const [clean] = perTopicAccuracy([answer(1, { correct: true })]);
    expect(topicActionBadge(clean)).toBeNull();
    const [high] = perTopicAccuracy([
      answer(1, { correct: true, timeSpentSeconds: 40 }),
      answer(2, { correct: true, timeSpentSeconds: 40 }),
      answer(3, { correct: true, timeSpentSeconds: 40 }),
      answer(4, { correct: false, timeSpentSeconds: 50 }),
    ]);
    expect(topicActionBadge(high)).toBeNull();
  });
});

describe('isSlowAnswer + classifyAnswerTime', () => {
  it('slow means more than 1.5× the attempt average', () => {
    expect(isSlowAnswer(68, 45)).toBe(true);
    expect(isSlowAnswer(67, 45)).toBe(false);
    expect(isSlowAnswer(45, 45)).toBe(false);
    expect(isSlowAnswer(100, 0)).toBe(true);
  });

  it('classifies the four buckets + unanswered', () => {
    const avg = 45;
    expect(classifyAnswerTime(answer(1, { correct: true, timeSpentSeconds: 30 }), avg)).toBe('mastered');
    expect(classifyAnswerTime(answer(2, { correct: true, timeSpentSeconds: 120 }), avg)).toBe('slow-sure');
    expect(classifyAnswerTime(answer(3, { correct: false, timeSpentSeconds: 120 }), avg)).toBe('time-trap');
    expect(classifyAnswerTime(answer(4, { correct: false, timeSpentSeconds: 20 }), avg)).toBe('guessing');
    expect(classifyAnswerTime(answer(5, { selected: null, correct: false }), avg)).toBe('unanswered');
  });
});

describe('attemptTrend', () => {
  it('empty: honest empty sentence, no numbers invented', () => {
    const t = attemptTrend([], 'মক');
    expect(t.count).toBe(0);
    expect(t.latestPercent).toBeNull();
    expect(t.sentence).toContain('এখনো কোনো মক দেওয়া হয়নি');
  });

  it('single attempt: first-attempt sentence, no delta', () => {
    const t = attemptTrend([attempt({ percentage: 50 })], 'মক');
    expect(t.count).toBe(1);
    expect(t.deltaVsPrevious).toBeNull();
    expect(t.sentence).toContain('প্রথম মক');
  });

  it('two attempts: delta vs the student’s own previous attempt only', () => {
    const t = attemptTrend(
      [attempt({ docId: 'sess-2', percentage: 100 }), attempt({ docId: 'sess-1', percentage: 50 })],
      'মক',
    );
    expect(t.latestPercent).toBe(100);
    expect(t.bestPercent).toBe(100);
    expect(t.previousPercent).toBe(50);
    expect(t.deltaVsPrevious).toBe(50);
    expect(t.sentence).toContain('আগের মকের চেয়ে +50%');
    expect(t.sentence).not.toContain('percentile');
    expect(t.sentence).not.toContain('rank');
  });

  it('negative stored percentage is clamped before the delta', () => {
    const t = attemptTrend(
      [attempt({ percentage: -50 }), attempt({ percentage: 20 })],
      'মক',
    );
    expect(t.latestPercent).toBe(0);
    expect(t.deltaVsPrevious).toBe(-20);
  });
});

describe('topicMasteryOverTime', () => {
  it('first vs latest accuracy per topic across attempts', () => {
    const first = attempt({
      docId: 'sess-1',
      answers: [
        answer(1, { correct: false }),
        answer(2, { correct: false }),
        answer(3, { correct: true }),
      ],
    });
    const latest = attempt({
      docId: 'sess-2',
      answers: [
        answer(1, { correct: true }),
        answer(2, { correct: true }),
        answer(3, { correct: true }),
      ],
    });
    const m = topicMasteryOverTime([latest, first]);
    expect(m).toHaveLength(1);
    expect(m[0].firstAccuracy).toBe(33.3);
    expect(m[0].latestAccuracy).toBe(100);
    expect(m[0].delta).toBe(66.7);
    expect(m[0].attemptsTouched).toBe(2);
  });
});

describe('timeManagementSummary', () => {
  it('average time, slowest/fastest topics, unanswered trend', () => {
    const a1 = attempt({
      docId: 'sess-1',
      unansweredCount: 2,
      answers: [
        answer(1, { timeSpentSeconds: 30 }),
        answer(2, { timeSpentSeconds: 30 }),
        answer(3, { topicId: 'bcs__bangla__grammar__sandhi', subjectId: 'bcs__bangla', timeSpentSeconds: 120 }),
        answer(4, { topicId: 'bcs__bangla__grammar__sandhi', subjectId: 'bcs__bangla', timeSpentSeconds: 120 }),
      ],
    });
    const a2 = attempt({
      docId: 'sess-2',
      unansweredCount: 0,
      answers: [answer(1, { timeSpentSeconds: 30 }), answer(2, { timeSpentSeconds: 30 })],
    });
    const s = timeManagementSummary([a2, a1]);
    expect(s.totalQuestions).toBe(6);
    expect(s.avgTimePerQuestion).toBe(60);
    expect(s.slowestTopic?.topicId).toBe('bcs__bangla__grammar__sandhi');
    expect(s.fastestTopic?.topicId).toBe('bcs__english__grammar__tense');
    expect(s.unansweredTrend).toEqual([0, 2]);
    expect(s.unansweredSentence).toContain('কমছে');
  });

  it('empty: honest empty sentence', () => {
    const s = timeManagementSummary([]);
    expect(s.avgTimePerQuestion).toBe(0);
    expect(s.slowestTopic).toBeNull();
    expect(s.unansweredSentence).toContain('এখনো কোনো মক/অনুশীলন দেওয়া হয়নি');
  });
});

describe('buildWrongAnswerList (Step 13 hook)', () => {
  it('returns wrong + unanswered, keeps them separate, sorted by n', () => {
    const list = buildWrongAnswerList(
      attempt({
        answers: [
          answer(1, { correct: true }),
          answer(2, { selected: 'B', correct: false, correctText: 'A', timeSpentSeconds: 20 }),
          answer(3, { selected: null, correct: false, correctText: 'D', timeSpentSeconds: 0 }),
        ],
      }),
    );
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ n: 2, status: 'wrong', selected: 'B', correctText: 'A' });
    expect(list[1]).toMatchObject({ n: 3, status: 'unanswered', selected: null });
  });

  it('empty when everything is correct', () => {
    expect(buildWrongAnswerList(attempt({ answers: [answer(1, { correct: true })] }))).toEqual([]);
  });
});

describe('weakTopicPracticeLink', () => {
  it('practice attempt: links to its own (existing) bundle', () => {
    const link = weakTopicPracticeLink(
      attempt({ kind: 'practice', bundleId: 'topic__bcs__english__grammar__tense' }),
      'bcs__english__grammar__tense',
    );
    expect(link).toEqual({ to: '/jobs/practice/topic__bcs__english__grammar__tense', kind: 'practice-bundle' });
  });

  it('mock attempt: links to the topic page derived from the answers', () => {
    const link = weakTopicPracticeLink(attempt(), 'bcs__english__grammar__tense');
    expect(link).toEqual({ to: '/jobs/bcs/subjects/english/grammar__tense', kind: 'topic-page' });
  });

  it('never invents a bundle id for an underivable topic', () => {
    const link = weakTopicPracticeLink(
      attempt({ kind: 'mock', bundleId: '', answers: [] }),
      '???',
    );
    expect(link.to).toBe('/jobs');
    expect(link.to).not.toContain('topic__');
  });
});

describe('topicLevel (ChatGPT §2A/§3)', () => {
  it('three text levels, never a permanent ability label', () => {
    expect(topicLevel(85, 10)).toBe('good');
    expect(topicLevel(55, 10)).toBe('medium');
    expect(topicLevel(20, 10)).toBe('weak');
    expect(topicLevel(70, 10)).toBe('good');
    expect(topicLevel(40, 10)).toBe('medium');
  });

  it('a tiny sample is never judged (1/2 = 50% is not 10/20 = 50%)', () => {
    expect(topicLevel(50, 2)).toBe('small-sample');
    expect(topicLevel(100, 1)).toBe('small-sample');
    expect(topicLevel(50, 3)).toBe('medium');
  });
});

describe('correctVsWrongTime (ChatGPT §2B)', () => {
  it('averages time separately for correct and wrong answers', () => {
    const s = correctVsWrongTime([
      answer(1, { correct: true, timeSpentSeconds: 30 }),
      answer(2, { correct: true, timeSpentSeconds: 50 }),
      answer(3, { correct: false, timeSpentSeconds: 90 }),
      answer(4, { correct: false, timeSpentSeconds: 110 }),
      answer(5, { selected: null, correct: false, timeSpentSeconds: 0 }),
    ]);
    expect(s.avgCorrectSeconds).toBe(40);
    expect(s.avgWrongSeconds).toBe(100);
    expect(s.correctCount).toBe(2);
    expect(s.wrongCount).toBe(2);
  });

  it('zero counts give zero averages, never NaN', () => {
    const s = correctVsWrongTime([answer(1, { correct: true, timeSpentSeconds: 30 })]);
    expect(s.avgWrongSeconds).toBe(0);
    expect(s.wrongCount).toBe(0);
  });
});

describe('resultObservation (ChatGPT §3)', () => {
  it('names the weakest topic + the marking cost, from real data only', () => {
    const o = resultObservation(attempt());
    expect(o).toContain('English — Grammar — Tense');
    expect(o).toContain('2/3 সঠিক');
    expect(o).toContain('১ম অগ্রাধিকার');
    expect(o).toContain('0.5 নম্বর কাটা গেছে');
  });

  it('all-correct and all-unanswered have their own honest lines', () => {
    expect(resultObservation(attempt({ wrongCount: 0, answers: [answer(1, { correct: true })] }))).toContain('কোনো ভুল উত্তর নেই');
    expect(
      resultObservation(attempt({ unansweredCount: 2, wrongCount: 0, answers: [answer(1, { selected: null, correct: false }), answer(2, { selected: null, correct: false })] })),
    ).toContain('কোনো প্রশ্নের উত্তর দেওয়া হয়নি');
  });
});

describe('groupAttemptsByExam (ChatGPT §2D)', () => {
  it('groups by exam so unlike tests are never trended together', () => {
    const groups = groupAttemptsByExam([
      attempt({ docId: 'a', examSlug: 'bcs' }),
      attempt({ docId: 'b', examSlug: 'bank' }),
      attempt({ docId: 'c', examSlug: 'bcs' }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].examSlug).toBe('bcs');
    expect(groups[0].attempts).toHaveLength(2);
    expect(groups[1].examSlug).toBe('bank');
  });
});

describe('attemptSummaryFromStored', () => {
  it('normalizes a stored doc defensively', () => {
    const s = attemptSummaryFromStored('sess-9', {
      kind: 'mock',
      examSlug: 'bcs',
      bundleId: 'mock__x',
      score: 1.5,
      percentage: -50,
      answers: [{ n: 1, questionId: 'q', topicId: 't', subjectId: 's', selected: 'A', correct: true, marks: 1, correctText: 'A', timeSpentSeconds: 45 }],
    });
    expect(s.docId).toBe('sess-9');
    expect(s.kind).toBe('mock');
    expect(s.percentage).toBe(-50);
    expect(s.correctCount).toBe(0);
    expect(s.answers).toHaveLength(1);
  });

  it('missing fields fall back instead of throwing', () => {
    const s = attemptSummaryFromStored('sess-0', {});
    expect(s.kind).toBe('practice');
    expect(s.answers).toEqual([]);
    expect(s.negativeMarkingUsed).toBeNull();
    expect(s.submittedAtMillis).toBeNull();
  });
});
