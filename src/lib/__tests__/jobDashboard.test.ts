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

/* ------------------------------------------------------------------ */
/* Live Exam additions (design-live-exam-dashboard.md §5) —          */
/* subjectHealth, liveExamReport, arrangeNextPractice.                */
/* ------------------------------------------------------------------ */

import {
  ARRANGE_MAX_REVISION_PER_DAY,
  arrangeNextPractice,
  liveExamReport,
  subjectHealth,
  type DashboardWeakTopic,
} from '../jobDashboard';
import { MAX_REVISION_PER_DAY } from '../jobPlanner';
import type { RevisionItem } from '../jobPlanner';
import type { NotebookEntry } from '../jobWrongAnswers';

function subjAnswer(
  n: number,
  subjectId: string,
  topicId: string,
  correct: boolean,
  questionId = `q-${subjectId}-${topicId}-${n}`,
): JobAttemptAnswer {
  return {
    n,
    questionId,
    topicId,
    subjectId,
    selected: correct ? 'A' : 'B',
    correct,
    marks: correct ? 1 : -0.5,
    correctText: 'correct',
    timeSpentSeconds: 45,
  };
}

describe('subjectHealth (§5.2)', () => {
  it('rolls topics up by subject with the same thresholds as topics', () => {
    // English: 10 answered across 2 topics, 4 correct (40%) → weak signal.
    const answers = [
      ...[1, 2, 3, 4, 5].map((n) => subjAnswer(n, 'english', 'tense', n <= 2)),
      ...[6, 7, 8, 9, 10].map((n) => subjAnswer(n, 'english', 'voice', n <= 7)),
    ];
    const [row] = subjectHealth([summary({ docId: 's1', answers })]);
    expect(row.subjectId).toBe('english');
    expect(row.label).toBe('ইংরেজি ভাষা ও সাহিত্য');
    expect(row.total).toBe(10);
    expect(row.accuracy).toBe(40);
    expect(row.topics).toBe(2);
    expect(row.sample).toBe('signal');
    expect(row.mastery).toBe('weak');
    expect(row.isWeak).toBe(true);
  });

  it('never calls a subject weak from a single topic’s data', () => {
    const answers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => subjAnswer(n, 'english', 'tense', n <= 3));
    const [row] = subjectHealth([summary({ docId: 's1', answers })]);
    expect(row.accuracy).toBe(30);
    expect(row.topics).toBe(1);
    expect(row.mastery).toBe('weak');
    expect(row.isWeak).toBe(false);
  });

  it('never calls a subject weak below 5 answered', () => {
    const answers = [1, 2, 3, 4].map((n) => subjAnswer(n, 'english', n % 2 === 0 ? 'tense' : 'voice', false));
    const [row] = subjectHealth([summary({ docId: 's1', answers })]);
    expect(row.total).toBe(4);
    expect(row.sample).toBe('not-enough-data');
    expect(row.isWeak).toBe(false);
  });

  it('sorts weakest first and returns [] with no attempts', () => {
    const answers = [
      ...[1, 2, 3, 4, 5, 6].map((n) => subjAnswer(n, 'bangla', 't1', n <= 5)),
      ...[7, 8, 9, 10, 11, 12].map((n) => subjAnswer(n, 'english', 't2', n <= 8)),
    ];
    const rows = subjectHealth([summary({ docId: 's1', answers })]);
    expect(rows.map((r) => r.subjectId)).toEqual(['english', 'bangla']);
    expect(subjectHealth([])).toEqual([]);
  });
});

describe('liveExamReport (§5.6)', () => {
  function mockAttempt(overrides: Partial<JobAttemptSummary> & { docId: string }): JobAttemptSummary {
    return summary({
      kind: 'mock',
      examSlug: 'bcs',
      bundleId: 'mock__full__bcs__1',
      mockId: 'full__bcs__1',
      score: 120,
      totalMarks: 200,
      percentage: 60,
      correctCount: 130,
      wrongCount: 20,
      unansweredCount: 50,
      ...overrides,
    });
  }

  it('reports one exam’s full mocks only — no cross-exam mixing', () => {
    const attempts = [
      mockAttempt({ docId: 'm1', submittedAtMillis: NOW, score: 120, percentage: 60 }),
      mockAttempt({ docId: 'm2', submittedAtMillis: NOW - DAY, score: 100, percentage: 50 }),
      // A Bank full mock + a BCS practice attempt must not leak in.
      mockAttempt({ docId: 'm3', examSlug: 'bank', mockId: 'full__bank__1', bundleId: 'mock__full__bank__1' }),
      mockAttempt({ docId: 'm4', kind: 'practice', mockId: null, bundleId: 'topic__bcs__english__tense' }),
      // A BCS daily mock must not leak in either.
      mockAttempt({ docId: 'm5', mockId: '2026-11-22', bundleId: 'daily__2026-11-22' }),
    ];
    const report = liveExamReport(attempts, 'bcs');
    expect(report.attempts).toBe(2);
    expect(report.latestScore).toBe(120);
    expect(report.bestScore).toBe(120);
    expect(report.latestPercentage).toBe(60);
    expect(report.fullTotal).toBe(200);
    expect(report.partialAttempts).toBe(0);
    expect(report.passPercent).toBeNull(); // BCS has no pass mark
    expect(report.trend.count).toBe(2);
  });

  it('flags partial mocks so a 100Q score is never silently compared with a 200Q score', () => {
    const attempts = [
      mockAttempt({ docId: 'm1', totalMarks: 100, score: 60, percentage: 60, correctCount: 65, wrongCount: 10, unansweredCount: 25 }),
      mockAttempt({ docId: 'm2', submittedAtMillis: NOW - DAY, totalMarks: 200, score: 120, percentage: 60 }),
    ];
    const report = liveExamReport(attempts, 'bcs');
    expect(report.attempts).toBe(2);
    expect(report.partialAttempts).toBe(1);
    expect(report.latestTotalMarks).toBe(100);
  });

  it('shows the pattern pass mark only where the pattern defines one', () => {
    const primary = liveExamReport(
      [summary({ docId: 'p1', kind: 'mock', examSlug: 'primary-teacher', mockId: 'full__primary-teacher__1', bundleId: 'mock__full__primary-teacher__1', totalMarks: 90, score: 50, percentage: 55.6 })],
      'primary-teacher',
    );
    expect(primary.passPercent).toBe(50);
    expect(primary.fullTotal).toBe(90);
  });

  it('is empty-honest with no full mocks', () => {
    const report = liveExamReport([], 'bcs');
    expect(report.attempts).toBe(0);
    expect(report.bestScore).toBeNull();
    expect(report.latestScore).toBeNull();
    expect(report.trend.count).toBe(0);
  });
});

describe('arrangeNextPractice (§5.4)', () => {
  const published = new Map<string, PublishedBundleRef[]>([
    ['bcs', [
      { docId: 'topic__tense', topicId: 'tense', questionCount: 10, titleBn: 'Tense' },
      { docId: 'topic__voice', topicId: 'voice', questionCount: 10, titleBn: 'Voice' },
      { docId: 'topic__narration', topicId: 'narration', questionCount: 10, titleBn: 'Narration' },
    ]],
  ]);

  function revisionItem(overrides: Partial<RevisionItem> & { topicId: string }): RevisionItem {
    return {
      label: overrides.topicId,
      labelEn: overrides.topicId,
      mastery: 'weak',
      accuracy: 30,
      total: 10,
      nextRevisionDay: '2026-11-22',
      dueBucket: 'today',
      examSlugs: ['bcs'],
      bundleDocId: `topic__${overrides.topicId}`,
      bundleExamSlug: 'bcs',
      ...overrides,
    };
  }

  function notebookEntry(overrides: Partial<NotebookEntry> & { questionId: string; topicId: string }): NotebookEntry {
    return {
      subjectId: 'bcs__english',
      examSlugs: ['bcs'],
      sources: ['practice'],
      wrongCount: 1,
      firstWrongAtMillis: NOW - 10 * DAY,
      lastWrongAtMillis: NOW - 10 * DAY,
      lastWrongAttemptId: 'a1',
      lastWrongKind: 'practice',
      lastOutcome: 'wrong',
      consecutiveCorrect: 0,
      clearedAtMillis: null,
      lastSelected: 'B',
      lastCorrectText: 'correct',
      status: 'active',
      learningState: 'new',
      ...overrides,
    } as NotebookEntry;
  }

  function weakTopic(overrides: Partial<DashboardWeakTopic> & { topicId: string }): DashboardWeakTopic {
    return {
      label: overrides.topicId,
      correct: 2,
      wrong: 8,
      total: 10,
      accuracy: 20,
      sample: 'signal',
      examSlugs: ['bcs'],
      lastAttemptMillis: NOW - DAY,
      ...overrides,
    };
  }

  const baseArgs = {
    revisionItems: [] as RevisionItem[],
    notebook: [] as NotebookEntry[],
    weakTopics: [] as DashboardWeakTopic[],
    publishedByExam: published,
    targetExamSlug: 'bcs',
    attempts: [] as JobAttemptSummary[],
    dailyMock: null,
    liveExam: null,
    nowMs: NOW,
  };

  it('orders due revision (max 2) → wrong answers → weakest topic', () => {
    const items = arrangeNextPractice({
      ...baseArgs,
      revisionItems: [
        revisionItem({ topicId: 'tense', accuracy: 20 }),
        revisionItem({ topicId: 'voice', accuracy: 40 }),
        revisionItem({ topicId: 'narration', accuracy: 10 }),
      ],
      notebook: [notebookEntry({ questionId: 'q1', topicId: 'tense', lastWrongAtMillis: NOW - DAY })],
      weakTopics: [weakTopic({ topicId: 'voice' })],
    });
    const kinds = items.map((i) => i.kind);
    expect(kinds[0]).toBe('revision');
    expect(kinds[1]).toBe('revision');
    expect(kinds).not.toContain('wrong-answers'); // step 1 took 2 → step 2 skipped (not stale)
    expect(kinds).toContain('weak-topic');
    expect(items.filter((i) => i.kind === 'revision').length).toBe(2);
    // Weakest revision first (narration 10%, then tense 20%).
    expect(items[0].titleBn).toContain('narration');
    expect(items[1].titleBn).toContain('tense');
  });

  it('adds wrong-answer re-practice when step 1 took fewer than 2, or the mistake is stale', () => {
    const stale = arrangeNextPractice({
      ...baseArgs,
      revisionItems: [
        revisionItem({ topicId: 'tense', accuracy: 20 }),
        revisionItem({ topicId: 'voice', accuracy: 40 }),
        revisionItem({ topicId: 'narration', accuracy: 10 }),
      ],
      notebook: [notebookEntry({ questionId: 'q1', topicId: 'tense', lastWrongAtMillis: NOW - 8 * DAY })],
    });
    expect(stale.map((i) => i.kind)).toContain('wrong-answers'); // stale >7d outranks
    const oneRevision = arrangeNextPractice({
      ...baseArgs,
      revisionItems: [revisionItem({ topicId: 'tense', accuracy: 20 })],
      notebook: [notebookEntry({ questionId: 'q1', topicId: 'tense', lastWrongAtMillis: NOW - DAY })],
    });
    expect(oneRevision.map((i) => i.kind)).toEqual(['revision', 'wrong-answers']);
  });

  it('shows a revision WITHOUT a link when no published set exists (never a dead link)', () => {
    const items = arrangeNextPractice({
      ...baseArgs,
      revisionItems: [revisionItem({ topicId: 'tense', bundleDocId: null, bundleExamSlug: null })],
    });
    expect(items[0].to).toBeNull();
    expect(items[0].ctaBn).toBeNull();
  });

  it('falls to new-topic practice only when steps 1–3 produced nothing', () => {
    const items = arrangeNextPractice({ ...baseArgs });
    expect(items.map((i) => i.kind)).toEqual(['new-topic']);
    expect(items[0].to).toBe('/jobs/practice/topic__narration'); // topicId ascending
    // A weak topic with no published bundle does not invent a link.
    const noFresh = arrangeNextPractice({
      ...baseArgs,
      attempts: [
        summary({
          docId: 'a1',
          answers: [
            answer(1, 'tense', true),
            answer(2, 'voice', true),
            answer(3, 'narration', true),
          ],
        }),
      ],
    });
    expect(noFresh).toEqual([]);
  });

  it('appends daily mock + Live Exam as dated cards, and returns [] when nothing is eligible', () => {
    const items = arrangeNextPractice({
      ...baseArgs,
      dailyMock: { docId: 'daily__2026-11-22' },
      liveExam: { examSlug: 'bcs' },
    });
    expect(items.map((i) => i.kind)).toEqual(['new-topic', 'daily-mock', 'live-exam']);
    expect(items[2].to).toBe('/jobs/live-exam/bcs');
    const empty = arrangeNextPractice({
      ...baseArgs,
      targetExamSlug: null,
      attempts: [
        summary({
          docId: 'a1',
          answers: [answer(1, 'tense', true), answer(2, 'voice', true), answer(3, 'narration', true)],
        }),
      ],
    });
    expect(empty).toEqual([]);
  });

  it('the revision cap mirrors the planner constant', () => {
    expect(ARRANGE_MAX_REVISION_PER_DAY).toBe(MAX_REVISION_PER_DAY);
    expect(ARRANGE_MAX_REVISION_PER_DAY).toBe(2);
  });
});
