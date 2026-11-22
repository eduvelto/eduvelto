// Eduvelto — Job planner tests (Step 12).
//
// Pure helpers over stored attempt summaries: topic health
// bands + reconciled revision intervals, the sliding revision
// queue (never piles up, never "failed"), the 7-day plan
// (rotation through never-attempted sets, done/goal marks),
// today's plan per effort mode, and the neutral goal
// suggestion. All fixtures are synthetic attempts built from
// the JobAttemptSummary shape — no invented catalog numbers;
// the published-bundle maps in these tests are the guard
// inputs, not live data.

import { describe, expect, it } from 'vitest';
import type { JobAttemptSummary } from '../jobAnalysis';
import type { JobAttemptAnswer } from '../jobEngine';
import {
  goalSuggestion,
  revisionIntervalDays,
  revisionQueue,
  todaysPlan,
  topicHealth,
  weeklyPlan,
  MAX_REVISION_PER_DAY,
} from '../jobPlanner';
import type { PublishedBundleRef as Ref } from '../jobDashboard';

const DAY = 24 * 60 * 60 * 1000;
/** Fixed Dhaka midday anchor — never Date.now(), so the
 * day-boundary math is stable. */
const NOW_MS = Date.UTC(2026, 10, 22, 8, 0, 0);

function ans(topicId: string, n: number, correct: boolean): JobAttemptAnswer {
  return {
    n,
    questionId: `${topicId}-q${n}`,
    topicId,
    subjectId: 'bcs__english',
    selected: correct ? 'A' : 'B',
    correct,
    marks: correct ? 1 : -0.5,
    correctText: null,
    timeSpentSeconds: 45,
  };
}

/** One attempt with `correct` of `total` answers right on one
 * topic, submitted `daysAgo` days before NOW_MS. */
function attempt(args: {
  id: string;
  topicId: string;
  correct: number;
  total: number;
  daysAgo: number;
  bundleId?: string;
  kind?: 'practice' | 'mock';
}): JobAttemptSummary {
  const answers: JobAttemptAnswer[] = [];
  for (let i = 0; i < args.total; i += 1) {
    answers.push(ans(args.topicId, i + 1, i < args.correct));
  }
  const submittedAtMillis = NOW_MS - args.daysAgo * DAY;
  return {
    docId: args.id,
    kind: args.kind ?? 'practice',
    examSlug: 'bcs',
    bundleId: args.bundleId ?? `topic__${args.topicId}`,
    mockId: null,
    score: args.correct,
    totalMarks: args.total,
    percentage: (args.correct / args.total) * 100,
    correctCount: args.correct,
    wrongCount: args.total - args.correct,
    unansweredCount: 0,
    negativeDeduction: 0,
    negativeMarkingUsed: 0.5,
    timeSpentSeconds: args.total * 45,
    submittedAtMillis,
    answers,
  };
}

function bundle(docId: string, topicId: string | null, titleBn?: string): Ref {
  return { docId, topicId, questionCount: 3, titleBn };
}

const TENSE = 'bcs__english__grammar__tense';
const VOICE = 'bcs__english__grammar__voice';
const NARRATION = 'bcs__english__grammar__narration';

describe('revisionIntervalDays (reconciled)', () => {
  it('weak 1d, moderate 4d, strong 14d, retained 30d, no-data null', () => {
    expect(revisionIntervalDays('weak')).toBe(1);
    expect(revisionIntervalDays('moderate')).toBe(4);
    expect(revisionIntervalDays('strong')).toBe(14);
    expect(revisionIntervalDays('retained')).toBe(30);
    expect(revisionIntervalDays('not-enough-data')).toBeNull();
  });
  it('the daily cap is 2 revision items', () => {
    expect(MAX_REVISION_PER_DAY).toBe(2);
  });
});

describe('topicHealth', () => {
  it('weak below 50% with 5+ answered; under 5 is never weak', () => {
    const health = topicHealth(
      [attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 0 })],
      NOW_MS,
    );
    expect(health).toHaveLength(1);
    expect(health[0].mastery).toBe('weak');
    expect(health[0].accuracy).toBe(20);
    expect(health[0].reviseInDays).toBe(1);

    const thin = topicHealth(
      [attempt({ id: 'a2', topicId: TENSE, correct: 0, total: 4, daysAgo: 0 })],
      NOW_MS,
    );
    expect(thin[0].mastery).toBe('not-enough-data');
    expect(thin[0].reviseInDays).toBeNull();
  });

  it('moderate 50–80%, strong 80%+, retained 80%+ over 10+ across 2 days', () => {
    const moderate = topicHealth(
      [attempt({ id: 'm1', topicId: VOICE, correct: 6, total: 10, daysAgo: 1 })],
      NOW_MS,
    );
    expect(moderate[0].mastery).toBe('moderate');
    expect(moderate[0].reviseInDays).toBe(4);

    const strong = topicHealth(
      [attempt({ id: 's1', topicId: VOICE, correct: 9, total: 10, daysAgo: 1 })],
      NOW_MS,
    );
    expect(strong[0].mastery).toBe('strong');
    expect(strong[0].reviseInDays).toBe(14);

    const retained = topicHealth(
      [
        attempt({ id: 'r1', topicId: VOICE, correct: 9, total: 10, daysAgo: 5 }),
        attempt({ id: 'r2', topicId: VOICE, correct: 5, total: 5, daysAgo: 1 }),
      ],
      NOW_MS,
    );
    expect(retained[0].mastery).toBe('retained');
    expect(retained[0].reviseInDays).toBe(30);
    expect(retained[0].distinctDays).toBe(2);
  });

  it('next revision day is last attempt + interval (Dhaka day key)', () => {
    const health = topicHealth(
      [attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 3 })],
      NOW_MS,
    );
    // Last attempt 2026-11-19 (Dhaka) + 1 day = 2026-11-20.
    expect(health[0].nextRevisionDay).toBe('2026-11-20');
  });
});

describe('revisionQueue', () => {
  it('overdue items slide to today; weakest first; bundle guard prefers the target exam', () => {
    const attempts = [
      attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 3 }),
      attempt({ id: 'a2', topicId: VOICE, correct: 6, total: 10, daysAgo: 1 }),
    ];
    const health = topicHealth(attempts, NOW_MS);
    const publishedByExam = new Map<string, Ref[]>([
      ['bcs', [bundle('topic__bcs__english__grammar__tense', TENSE), bundle('topic__bcs__english__grammar__voice', VOICE)]],
    ]);
    const queue = revisionQueue({ health, publishedByExam, targetExamSlug: 'bcs', nowMs: NOW_MS });
    expect(queue).toHaveLength(2);
    // Tense was due 2026-11-20 (overdue) → today; voice due
    // 2026-11-25 → this-week. Overdue sorts first.
    expect(queue[0].topicId).toBe(TENSE);
    expect(queue[0].dueBucket).toBe('today');
    expect(queue[0].bundleDocId).toBe('topic__bcs__english__grammar__tense');
    expect(queue[1].topicId).toBe(VOICE);
    expect(queue[1].dueBucket).toBe('this-week');
  });

  it('a topic with no published set stays in the queue without a link', () => {
    const health = topicHealth(
      [attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 0 })],
      NOW_MS,
    );
    const queue = revisionQueue({ health, publishedByExam: new Map(), targetExamSlug: 'bcs', nowMs: NOW_MS });
    expect(queue).toHaveLength(1);
    expect(queue[0].bundleDocId).toBeNull();
  });

  it('not-enough-data topics never enter the queue', () => {
    const health = topicHealth(
      [attempt({ id: 'a1', topicId: TENSE, correct: 1, total: 2, daysAgo: 0 })],
      NOW_MS,
    );
    const queue = revisionQueue({ health, publishedByExam: new Map(), targetExamSlug: 'bcs', nowMs: NOW_MS });
    expect(queue).toHaveLength(0);
  });
});

describe('weeklyPlan', () => {
  function buildWeek() {
    const attempts = [
      attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 3 }),
      attempt({ id: 'a2', topicId: VOICE, correct: 2, total: 10, daysAgo: 2 }),
      attempt({ id: 'a3', topicId: NARRATION, correct: 1, total: 10, daysAgo: 2 }),
    ];
    const health = topicHealth(attempts, NOW_MS);
    const publishedByExam = new Map<string, Ref[]>([
      [
        'bcs',
        [
          bundle('topic__bcs__english__grammar__tense', TENSE, 'Tense'),
          bundle('topic__bcs__english__grammar__voice', VOICE, 'Voice'),
          bundle('topic__bcs__english__grammar__narration', NARRATION, 'Narration'),
          bundle('topic__bcs__english__grammar__articles', 'bcs__english__grammar__articles', 'Articles'),
        ],
      ],
    ]);
    const queue = revisionQueue({ health, publishedByExam, targetExamSlug: 'bcs', nowMs: NOW_MS });
    return weeklyPlan({
      attempts,
      health,
      queue,
      publishedByExam,
      targetExamSlug: 'bcs',
      dailyGoalQuestions: 10,
      dailyMockDocId: 'daily__2026-11-22',
      nowMs: NOW_MS,
    });
  }

  it('covers 7 days from today; today first', () => {
    const week = buildWeek();
    expect(week.days).toHaveLength(7);
    expect(week.days[0].isToday).toBe(true);
    expect(week.days[0].dayKey).toBe('2026-11-22');
    expect(week.days[6].dayKey).toBe('2026-11-28');
  });

  it('caps revision items at 2 per day and slides the overflow', () => {
    const week = buildWeek();
    const today = week.days[0];
    const revisions = today.items.filter((i) => i.kind === 'revision');
    expect(revisions.length).toBeLessThanOrEqual(2);
    // Three weak topics are due (tense + narration + voice,
    // all overdue): today takes 2, the third slides to
    // tomorrow.
    const tomorrow = week.days[1];
    expect(tomorrow.items.filter((i) => i.kind === 'revision')).toHaveLength(1);
    expect(tomorrow.items.find((i) => i.kind === 'revision')?.slid).toBe(true);
    expect(week.carriedOver).toBe(true);
  });

  it('rotates one never-attempted set per day; done marks come from real attempts', () => {
    const week = buildWeek();
    const today = week.days[0];
    const fresh = today.items.find((i) => i.kind === 'new-practice');
    // Articles is the only never-attempted set.
    expect(fresh?.topicId).toBe('bcs__english__grammar__articles');
    expect(fresh?.to).toBe('/jobs/practice/topic__bcs__english__grammar__articles');
    // Today has no attempts yet (the fixture attempts are
    // 2–3 days ago) — nothing is marked done.
    expect(today.questionsDone).toBe(0);
    expect(today.goalMet).toBe(false);
    // Future days carry no goal verdict.
    expect(week.days[3].goalMet).toBeNull();
  });

  it('marks today done + goal met from real attempts today (incl. the daily mock)', () => {
    const attempts = [
      attempt({ id: 't1', topicId: TENSE, correct: 8, total: 10, daysAgo: 0 }),
      attempt({ id: 't2', topicId: TENSE, correct: 3, total: 3, daysAgo: 0, kind: 'mock', bundleId: 'mock__full__bcs__e2e' }),
    ];
    const health = topicHealth(attempts, NOW_MS);
    const publishedByExam = new Map<string, Ref[]>([
      ['bcs', [bundle('topic__bcs__english__grammar__tense', TENSE, 'Tense')]],
    ]);
    const queue = revisionQueue({ health, publishedByExam, targetExamSlug: 'bcs', nowMs: NOW_MS });
    const week = weeklyPlan({
      attempts,
      health,
      queue,
      publishedByExam,
      targetExamSlug: 'bcs',
      dailyGoalQuestions: 10,
      dailyMockDocId: 'daily__2026-11-22',
      nowMs: NOW_MS,
    });
    expect(week.days[0].questionsDone).toBe(13);
    expect(week.days[0].sessionsDone).toBe(2);
    expect(week.days[0].goalMet).toBe(true);
    // The new-practice slot is empty (the only set was
    // attempted); the daily-mock row is done (a mock was
    // submitted today).
    expect(week.days[0].items.find((i) => i.kind === 'new-practice')).toBeUndefined();
    expect(week.days[0].items.find((i) => i.kind === 'daily-mock')?.done).toBe(true);
  });

  it('today links the live daily mock; future days point at /jobs/common', () => {
    const week = buildWeek();
    const mockToday = week.days[0].items.find((i) => i.kind === 'daily-mock');
    expect(mockToday?.to).toBe('/jobs/mock/daily__2026-11-22');
    const mockTomorrow = week.days[1].items.find((i) => i.kind === 'daily-mock');
    expect(mockTomorrow?.to).toBe('/jobs/common');
  });

  it('reports noNewSetsLeft when every set was attempted', () => {
    const attempts = [
      attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 0, bundleId: 'topic__bcs__english__grammar__tense' }),
    ];
    const health = topicHealth(attempts, NOW_MS);
    const publishedByExam = new Map<string, Ref[]>([
      ['bcs', [bundle('topic__bcs__english__grammar__tense', TENSE, 'Tense')]],
    ]);
    const queue = revisionQueue({ health, publishedByExam, targetExamSlug: 'bcs', nowMs: NOW_MS });
    const week = weeklyPlan({
      attempts,
      health,
      queue,
      publishedByExam,
      targetExamSlug: 'bcs',
      dailyGoalQuestions: 10,
      dailyMockDocId: null,
      nowMs: NOW_MS,
    });
    expect(week.noNewSetsLeft).toBe(true);
    expect(week.targetHasNoSets).toBe(false);
    expect(week.days[0].items.find((i) => i.kind === 'daily-mock')?.to).toBeNull();
  });

  it('reports targetHasNoSets when the target exam has no published sets', () => {
    const week = weeklyPlan({
      attempts: [],
      health: [],
      queue: [],
      publishedByExam: new Map(),
      targetExamSlug: 'bcs',
      dailyGoalQuestions: null,
      dailyMockDocId: null,
      nowMs: NOW_MS,
    });
    expect(week.targetHasNoSets).toBe(true);
    expect(week.noNewSetsLeft).toBe(false);
    expect(week.days[0].items).toHaveLength(1); // only the daily-mock row
  });
});

describe('todaysPlan (effort modes)', () => {
  function buildWeek() {
    const attempts = [
      attempt({ id: 'a1', topicId: TENSE, correct: 2, total: 10, daysAgo: 3 }),
      attempt({ id: 'a2', topicId: NARRATION, correct: 1, total: 10, daysAgo: 2 }),
    ];
    const health = topicHealth(attempts, NOW_MS);
    const publishedByExam = new Map<string, Ref[]>([
      [
        'bcs',
        [
          bundle('topic__bcs__english__grammar__tense', TENSE, 'Tense'),
          bundle('topic__bcs__english__grammar__narration', NARRATION, 'Narration'),
          bundle('topic__bcs__english__grammar__articles', 'bcs__english__grammar__articles', 'Articles'),
          bundle('topic__bcs__english__grammar__voice', VOICE, 'Voice'),
        ],
      ],
    ]);
    const queue = revisionQueue({ health, publishedByExam, targetExamSlug: 'bcs', nowMs: NOW_MS });
    return weeklyPlan({
      attempts,
      health,
      queue,
      publishedByExam,
      targetExamSlug: 'bcs',
      dailyGoalQuestions: 10,
      dailyMockDocId: 'daily__2026-11-22',
      nowMs: NOW_MS,
    });
  }

  it('light shows 1 item; standard shows revisions + new practice; deep adds one extra', () => {
    const week = buildWeek();
    const light = todaysPlan(week, 'light');
    expect(light.items).toHaveLength(1);
    expect(light.mockItem?.kind).toBe('daily-mock');

    const standard = todaysPlan(week, 'standard');
    // 2 revisions + 1 new practice.
    expect(standard.items).toHaveLength(3);
    expect(standard.items.filter((i) => i.kind === 'revision')).toHaveLength(2);
    expect(standard.items.filter((i) => i.kind === 'new-practice')).toHaveLength(1);

    const deep = todaysPlan(week, 'deep');
    expect(deep.items).toHaveLength(3);
    expect(deep.extraItem?.kind).toBe('new-practice');
    expect(deep.totalCount).toBe(5); // 3 + extra + mock
  });
});

describe('goalSuggestion', () => {
  it('returns null with too little history or a reachable goal', () => {
    // Only 1 active day — too little history.
    expect(
      goalSuggestion({
        attempts: [attempt({ id: 'a1', topicId: TENSE, correct: 5, total: 10, daysAgo: 0 })],
        dailyGoalQuestions: 30,
        nowMs: NOW_MS,
      }),
    ).toBeNull();
    // Goal within 1.5× the average (avg ~4.3/day, goal 6).
    const steady = [0, 1, 2].map((d) => attempt({ id: `s${d}`, topicId: TENSE, correct: 5, total: 10, daysAgo: d }));
    expect(goalSuggestion({ attempts: steady, dailyGoalQuestions: 6, nowMs: NOW_MS })).toBeNull();
  });

  it('suggests when the goal is far above the 7-day average', () => {
    const attempts = [0, 1, 2].map((d) =>
      attempt({ id: `s${d}`, topicId: TENSE, correct: 5, total: 10, daysAgo: d }),
    );
    // 30 questions over 7 days → avg ~4.3/day; goal 30 is > 1.5×.
    const s = goalSuggestion({ attempts, dailyGoalQuestions: 30, nowMs: NOW_MS });
    expect(s).not.toBeNull();
    expect(s!.goal).toBe(30);
    expect(s!.activeDays).toBe(3);
    expect(s!.avgQuestionsPerDay).toBeCloseTo(4.3, 1);
  });

  it('returns null without a goal', () => {
    expect(
      goalSuggestion({ attempts: [], dailyGoalQuestions: null, nowMs: NOW_MS }),
    ).toBeNull();
  });
});
