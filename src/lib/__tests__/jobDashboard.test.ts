// Eduvelto — Job Preparation dashboard helpers (Step 11).
//
// PURE-function tests only: every number here is computed from
// fabricated attempt summaries — no Firestore, no invented
// benchmarks. The thresholds under test are the Step 11 honesty
// rules (ChatGPT sample sizes; accuracy null, never 0%, with no
// data; streaks from real dates only).

import { describe, expect, it } from 'vitest';
import {
  accuracyOrNull,
  computeStreakDays,
  dashboardAchievements,
  dashboardWeakTopics,
  dayLabel,
  dayLabelBn,
  dhakaDayKey,
  perExamProgress,
  pickRecommendation,
  todayStats,
  weekActivity,
  wrongAnswerSummary,
  type PublishedBundleRef,
} from '../jobDashboard';
import type { JobAttemptSummary } from '../jobAnalysis';
import type { JobAttemptAnswer } from '../jobEngine';

const DAY = 24 * 60 * 60 * 1000;
/** 2026-11-22 14:00 Asia/Dhaka (08:00 UTC) — a Sunday. */
const NOW = Date.UTC(2026, 10, 22, 8, 0, 0);

function answer(
  n: number,
  topicId: string,
  correct: boolean,
  questionId = `q-${topicId}-${n}`,
): JobAttemptAnswer {
  return {
    n,
    questionId,
    topicId,
    subjectId: 'bcs__english',
    selected: correct ? 'A' : 'B',
    correct,
    marks: correct ? 1 : -0.5,
    correctText: 'correct',
    timeSpentSeconds: 45,
  };
}

function summary(overrides: Partial<JobAttemptSummary> & { docId: string }): JobAttemptSummary {
  return {
    kind: 'practice',
    examSlug: 'bcs',
    bundleId: 'topic__bcs__english__grammar__tense',
    mockId: null,
    score: 0,
    totalMarks: 3,
    percentage: 0,
    correctCount: 0,
    wrongCount: 0,
    unansweredCount: 0,
    negativeDeduction: 0,
    negativeMarkingUsed: 0.5,
    timeSpentSeconds: 135,
    submittedAtMillis: NOW,
    answers: [],
    ...overrides,
  };
}

describe('accuracyOrNull', () => {
  it('returns the percentage with one decimal', () => {
    expect(accuracyOrNull(7, 10)).toBe(70);
    expect(accuracyOrNull(1, 3)).toBe(33.3);
  });

  it('returns null — never 0% — when nothing was answered', () => {
    expect(accuracyOrNull(0, 0)).toBeNull();
  });
});

describe('Dhaka day keys', () => {
  it('maps UTC millis to the Dhaka calendar date', () => {
    // 08:00 UTC = 14:00 Dhaka on the same date.
    expect(dhakaDayKey(NOW)).toBe('2026-11-22');
    // 20:00 UTC on the 21st = 02:00 Dhaka on the 22nd.
    expect(dhakaDayKey(Date.UTC(2026, 10, 21, 20, 0, 0))).toBe('2026-11-22');
  });

  it('labels today and yesterday in Bangla', () => {
    expect(dayLabelBn('2026-11-22', NOW)).toBe('আজ');
    expect(dayLabelBn('2026-11-21', NOW)).toBe('গতকাল');
  });
});

describe('computeStreakDays', () => {
  it('counts consecutive days ending today', () => {
    const attempts = [
      summary({ docId: 'a1', submittedAtMillis: NOW }),
      summary({ docId: 'a2', submittedAtMillis: NOW - DAY }),
      summary({ docId: 'a3', submittedAtMillis: NOW - 2 * DAY }),
    ];
    expect(computeStreakDays(attempts, NOW)).toBe(3);
  });

  it('stays alive through yesterday when today is empty', () => {
    const attempts = [summary({ docId: 'a1', submittedAtMillis: NOW - DAY })];
    expect(computeStreakDays(attempts, NOW)).toBe(1);
  });

  it('breaks on a gap day', () => {
    const attempts = [
      summary({ docId: 'a1', submittedAtMillis: NOW }),
      summary({ docId: 'a2', submittedAtMillis: NOW - 3 * DAY }),
    ];
    expect(computeStreakDays(attempts, NOW)).toBe(1);
  });

  it('is 0 with no attempts', () => {
    expect(computeStreakDays([], NOW)).toBe(0);
  });
});

describe('todayStats + weekActivity', () => {
  it('counts today’s sessions and questions, and the 7-day week', () => {
    const attempts = [
      summary({ docId: 'a1', submittedAtMillis: NOW, answers: [answer(1, 't1', true), answer(2, 't1', false)] }),
      summary({ docId: 'a2', submittedAtMillis: NOW - DAY, answers: [answer(1, 't1', true)] }),
      summary({ docId: 'a3', submittedAtMillis: NOW - 8 * DAY, answers: [answer(1, 't1', true)] }),
    ];
    expect(todayStats(attempts, NOW)).toEqual({ sessionsToday: 1, questionsToday: 2 });
    const week = weekActivity(attempts, NOW);
    expect(week.days).toHaveLength(7);
    expect(week.totalSessions).toBe(2);
    expect(week.totalQuestions).toBe(3);
    expect(week.days[0]).toMatchObject({ labelBn: 'আজ', sessions: 1, questions: 2 });
    expect(week.days[1]).toMatchObject({ labelBn: 'গতকাল', sessions: 1, questions: 1 });
    expect(week.days[6]).toMatchObject({ sessions: 0, questions: 0 });
  });
});

describe('perExamProgress', () => {
  it('keeps exams separate and counts only still-published sets', () => {
    const attempts = [
      summary({
        docId: 'p1', kind: 'practice', examSlug: 'bcs',
        bundleId: 'topic__bcs__english__grammar__tense',
        answers: [answer(1, 't1', true), answer(2, 't1', false), answer(3, 't1', true)],
        correctCount: 2, submittedAtMillis: NOW,
      }),
      summary({
        docId: 'm1', kind: 'mock', examSlug: 'bcs',
        bundleId: 'mock__full__bcs__e2e',
        answers: [answer(1, 't1', true)],
        correctCount: 1, submittedAtMillis: NOW - DAY,
      }),
      summary({
        docId: 'p2', kind: 'practice', examSlug: 'bank',
        bundleId: 'topic__bank__bangla__grammar',
        answers: [answer(1, 't2', false)],
        correctCount: 0, submittedAtMillis: NOW - 2 * DAY,
      }),
    ];
    const published = new Map<string, PublishedBundleRef[]>([
      ['bcs', [
        { docId: 'topic__bcs__english__grammar__tense', topicId: 'bcs__english__grammar__tense', questionCount: 3 },
        { docId: 'mock__full__bcs__e2e', topicId: null, questionCount: 3 },
        { docId: 'topic__bcs__english__vocab', topicId: 'bcs__english__vocabulary', questionCount: 5 },
      ]],
      ['bank', []],
    ]);
    const progress = perExamProgress(attempts, published);
    expect(progress).toHaveLength(2);
    const bcs = progress[0];
    expect(bcs.examSlug).toBe('bcs');
    expect(bcs.attempts).toBe(2);
    expect(bcs.mocks).toBe(1);
    expect(bcs.practices).toBe(1);
    expect(bcs.questions).toBe(4);
    expect(bcs.correct).toBe(3);
    expect(bcs.accuracy).toBe(75);
    expect(bcs.setsCompleted).toBe(2);
    expect(bcs.setsAvailable).toBe(3);
    expect(bcs.topicsPracticed).toEqual(['t1']);
    const bank = progress[1];
    expect(bank.setsCompleted).toBe(0);
    expect(bank.setsAvailable).toBe(0);
    expect(bank.accuracy).toBe(0);
  });

  it('reports accuracy null when an exam has no answered questions', () => {
    const attempts = [summary({ docId: 'e1', examSlug: 'bcs', answers: [] })];
    const progress = perExamProgress(attempts, new Map());
    expect(progress[0].accuracy).toBeNull();
    expect(progress[0].questions).toBe(0);
  });
});

describe('dashboardWeakTopics', () => {
  function weakFixture(): JobAttemptSummary[] {
    // Tense: 12 answered, 3 correct (25%) — a signal.
    // Voice: 6 answered, 2 correct (33.3%) — early indication.
    // Articles: 4 answered, 0 correct — too small a sample, excluded.
    // Synonym: 12 answered, 9 correct (75%) — not weak, excluded.
    const tense = Array.from({ length: 12 }, (_, i) => answer(i + 1, 'bcs__english__grammar__tense', i < 3));
    const voice = Array.from({ length: 6 }, (_, i) => answer(i + 1, 'bcs__english__grammar__voice', i < 2));
    const articles = Array.from({ length: 4 }, (_, i) => answer(i + 1, 'bcs__english__grammar__articles', false));
    const synonym = Array.from({ length: 12 }, (_, i) => answer(i + 1, 'bcs__english__vocabulary__synonym', i < 9));
    return [summary({ docId: 'a1', answers: [...tense, ...voice, ...articles, ...synonym] })];
  }

  it('labels 10+ as a signal, 5–9 as early, and excludes tiny samples and strong topics', () => {
    const weak = dashboardWeakTopics(weakFixture());
    expect(weak).toHaveLength(2);
    expect(weak[0].topicId).toBe('bcs__english__grammar__tense');
    expect(weak[0].sample).toBe('signal');
    expect(weak[0].accuracy).toBe(25);
    expect(weak[1].topicId).toBe('bcs__english__grammar__voice');
    expect(weak[1].sample).toBe('early');
    expect(weak[1].accuracy).toBe(33.3);
  });

  it('never calls a topic weak from a single wrong answer', () => {
    const attempts = [summary({ docId: 'a1', answers: [answer(1, 't1', false)] })];
    expect(dashboardWeakTopics(attempts)).toEqual([]);
  });
});

describe('pickRecommendation', () => {
  const published = new Map<string, PublishedBundleRef[]>([
    ['bcs', [
      { docId: 'topic__bcs__english__grammar__tense', topicId: 'bcs__english__grammar__tense', questionCount: 3 },
    ]],
  ]);

  function weakTopics(): ReturnType<typeof dashboardWeakTopics> {
    const tense = Array.from({ length: 12 }, (_, i) => answer(i + 1, 'bcs__english__grammar__tense', i < 3));
    const voice = Array.from({ length: 12 }, (_, i) => answer(i + 1, 'bcs__english__grammar__voice', i < 2));
    return dashboardWeakTopics([summary({ docId: 'a1', answers: [...tense, ...voice], submittedAtMillis: NOW })]);
  }

  it('recommends the weakest topic that has a published bundle', () => {
    const rec = pickRecommendation({ weakTopics: weakTopics(), publishedByExam: published, targetExamSlug: 'bcs' });
    // Voice (2/12 = 16.7%) is weaker than tense (25%) but has no
    // bundle — so the recommendation is the tense bundle.
    expect(rec).not.toBeNull();
    expect(rec!.bundleDocId).toBe('topic__bcs__english__grammar__tense');
    expect(rec!.topicId).toBe('bcs__english__grammar__tense');
  });

  it('returns null when no weak topic has a published bundle', () => {
    const rec = pickRecommendation({
      weakTopics: weakTopics(),
      publishedByExam: new Map(),
      targetExamSlug: 'bcs',
    });
    expect(rec).toBeNull();
  });

  it('prefers the target exam’s topics', () => {
    const topics = weakTopics();
    const both = new Map<string, PublishedBundleRef[]>([
      ['bcs', [{ docId: 'topic__bcs__english__grammar__tense', topicId: 'bcs__english__grammar__tense', questionCount: 3 }]],
      ['bank', [{ docId: 'topic__bank__x', topicId: 'bcs__english__grammar__voice', questionCount: 3 }]],
    ]);
    const rec = pickRecommendation({ weakTopics: topics, publishedByExam: both, targetExamSlug: 'bcs' });
    expect(rec!.bundleDocId).toBe('topic__bcs__english__grammar__tense');
  });
});

describe('dashboardAchievements', () => {
  it('awards first-practice, first-mock and the 7-day streak from real work only', () => {
    const attempts = [
      summary({ docId: 'p1', kind: 'practice', submittedAtMillis: NOW }),
      summary({ docId: 'm1', kind: 'mock', submittedAtMillis: NOW - DAY }),
    ];
    expect(dashboardAchievements(attempts, 2).map((a) => a.key)).toEqual([
      'job_first-practice',
      'job_first-mock',
    ]);
    expect(dashboardAchievements(attempts, 7).map((a) => a.key)).toContain('job_7-day-streak');
    expect(dashboardAchievements([], 0)).toEqual([]);
  });
});

describe('wrongAnswerSummary', () => {
  it('dedupes by question and keeps the newest 3', () => {
    const attempts = [
      summary({
        docId: 'new', submittedAtMillis: NOW,
        answers: [answer(1, 't1', false, 'q-1'), answer(2, 't1', false, 'q-2')],
      }),
      summary({
        docId: 'old', submittedAtMillis: NOW - DAY,
        answers: [answer(1, 't1', false, 'q-1'), answer(2, 't1', false, 'q-3'), answer(3, 't1', false, 'q-4')],
      }),
    ];
    const s = wrongAnswerSummary(attempts);
    expect(s.distinctWrongQuestions).toBe(4);
    expect(s.recent.map((r) => r.questionId)).toEqual(['q-1', 'q-2', 'q-3']);
    expect(s.recent[0].attemptDocId).toBe('new');
  });
});

describe('language system (24 Nov 2026) — English day labels', () => {
  it('dayLabel renders Today/Yesterday/en-GB dates', () => {
    expect(dayLabel('2026-11-22', NOW, 'en')).toBe('Today');
    expect(dayLabel('2026-11-21', NOW, 'en')).toBe('Yesterday');
    expect(dayLabel('2026-11-19', NOW, 'en')).toBe('19 Nov');
    expect(dayLabel('2026-11-22', NOW, 'bn')).toBe('আজ');
  });

  it('weekActivity days carry labelEn', () => {
    const week = weekActivity([], NOW);
    expect(week.days[0].labelEn).toBe('Today');
    expect(week.days[0].labelBn).toBe('আজ');
  });

  it('dashboardAchievements carry English labels and rules', () => {
    const attempts = [
      summary({ docId: 'p1', kind: 'practice', submittedAtMillis: NOW }),
      summary({ docId: 'm1', kind: 'mock', submittedAtMillis: NOW - DAY }),
    ];
    const earned = dashboardAchievements(attempts, 7);
    const first = earned.find((a) => a.key === 'job_first-practice')!;
    expect(first.labelEn).toBe('First practice completed');
    expect(first.ruleEn).toContain('first practice');
    const streak = earned.find((a) => a.key === 'job_7-day-streak')!;
    expect(streak.labelEn).toBe('7-day streak');
  });
});
