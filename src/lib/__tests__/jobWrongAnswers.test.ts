// Eduvelto — Job wrong-answer notebook (Step 13) unit tests.
//
// Pure derivation over hand-built attempt summaries — no
// Firestore, no invented question bank. Every expected value
// is computed from the fixture answers below.

import { describe, expect, it } from 'vitest';
import type { JobAttemptSummary } from '../jobAnalysis';
import type { JobAttemptAnswer } from '../jobEngine';
import {
  buildSubsetBundle,
  buildSubsetKey,
  deriveNotebook,
  filterNotebook,
  groupNotebookByTopic,
  planWrongAnswersSession,
  sortNotebookEntries,
  EMPTY_NOTEBOOK_FILTERS,
  type NotebookEntry,
} from '../jobWrongAnswers';
import type { JobQuestionBundle, JobQuestionKey } from '../jobQuestions';

const TENSE = 'bcs__english__grammar__tense';
const VOICE = 'bcs__english__grammar__voice';
const ENGLISH = 'bcs__english';

function answer(
  n: number,
  questionId: string,
  topicId: string,
  selected: 'A' | 'B' | 'C' | 'D' | null,
  correct: boolean,
): JobAttemptAnswer {
  return {
    n,
    questionId,
    topicId,
    subjectId: ENGLISH,
    selected,
    correct,
    marks: selected === null ? 0 : correct ? 1 : -0.5,
    correctText: 'He goes to school every day.',
    timeSpentSeconds: 30,
  };
}

function attempt(
  docId: string,
  kind: 'practice' | 'mock',
  examSlug: string,
  submittedAtMillis: number,
  answers: JobAttemptAnswer[],
): JobAttemptSummary {
  const correctCount = answers.filter((a) => a.selected !== null && a.correct).length;
  const wrongCount = answers.filter((a) => a.selected !== null && !a.correct).length;
  const unansweredCount = answers.filter((a) => a.selected === null).length;
  return {
    docId,
    kind,
    examSlug,
    bundleId: 'topic__bcs__english__grammar__tense',
    mockId: kind === 'mock' ? 'full__bcs__1' : null,
    score: correctCount - wrongCount * 0.5,
    totalMarks: answers.length,
    percentage: 0,
    correctCount,
    wrongCount,
    unansweredCount,
    negativeDeduction: wrongCount * 0.5,
    negativeMarkingUsed: 0.5,
    timeSpentSeconds: 90,
    submittedAtMillis,
    answers,
  };
}

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 10, 20, 8, 0, 0);

describe('deriveNotebook — the 0→1→2 removal rule', () => {
  it('a single wrong answer enters the notebook as নতুন ভুল (0/2)', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
    ]);
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.status).toBe('active');
    expect(e.learningState).toBe('new');
    expect(e.consecutiveCorrect).toBe(0);
    expect(e.wrongCount).toBe(1);
    expect(e.lastWrongAttemptId).toBe('a1');
    expect(e.clearedAtMillis).toBeNull();
  });

  it('one correct after the wrong moves it to আবার শিখছি (1/2), still active', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
      attempt('a2', 'practice', 'bcs', T0 + DAY, [answer(1, 'q1', TENSE, 'C', true)]),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('active');
    expect(entries[0].learningState).toBe('practising');
    expect(entries[0].consecutiveCorrect).toBe(1);
    expect(entries[0].clearedAtMillis).toBeNull();
  });

  it('a second consecutive correct clears it — শেখা হয়েছে, clearedAt is the 2nd correct', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
      attempt('a2', 'practice', 'bcs', T0 + DAY, [answer(1, 'q1', TENSE, 'C', true)]),
      attempt('a3', 'mock', 'bcs', T0 + 2 * DAY, [answer(1, 'q1', TENSE, 'C', true)]),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('learned');
    expect(entries[0].learningState).toBe('learned');
    expect(entries[0].consecutiveCorrect).toBe(2);
    expect(entries[0].clearedAtMillis).toBe(T0 + 2 * DAY);
  });

  it('a wrong answer resets the streak to 0 immediately (no partial forgiveness)', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
      attempt('a2', 'practice', 'bcs', T0 + DAY, [answer(1, 'q1', TENSE, 'C', true)]),
      attempt('a3', 'practice', 'bcs', T0 + 2 * DAY, [answer(1, 'q1', TENSE, 'B', false)]),
    ]);
    expect(entries[0].status).toBe('active');
    expect(entries[0].learningState).toBe('new');
    expect(entries[0].consecutiveCorrect).toBe(0);
    expect(entries[0].wrongCount).toBe(2);
    expect(entries[0].clearedAtMillis).toBeNull();
  });

  it('an unanswered entry is neutral — it neither advances nor resets the streak', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
      attempt('a2', 'mock', 'bcs', T0 + DAY, [answer(1, 'q1', TENSE, null, false)]),
      attempt('a3', 'practice', 'bcs', T0 + 2 * DAY, [answer(1, 'q1', TENSE, 'C', true)]),
      attempt('a4', 'practice', 'bcs', T0 + 3 * DAY, [answer(1, 'q1', TENSE, 'C', true)]),
    ]);
    expect(entries[0].status).toBe('learned');
    expect(entries[0].consecutiveCorrect).toBe(2);
    expect(entries[0].clearedAtMillis).toBe(T0 + 3 * DAY);
  });

  it('a later wrong answer re-opens a learned question', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
      attempt('a2', 'practice', 'bcs', T0 + DAY, [answer(1, 'q1', TENSE, 'C', true)]),
      attempt('a3', 'practice', 'bcs', T0 + 2 * DAY, [answer(1, 'q1', TENSE, 'C', true)]),
      attempt('a4', 'mock', 'bcs', T0 + 3 * DAY, [answer(1, 'q1', TENSE, 'D', false)]),
    ]);
    expect(entries[0].status).toBe('active');
    expect(entries[0].learningState).toBe('new');
    expect(entries[0].consecutiveCorrect).toBe(0);
    expect(entries[0].wrongCount).toBe(2);
    expect(entries[0].clearedAtMillis).toBeNull();
  });

  it('a question that was only ever unanswered never enters the notebook', () => {
    const entries = deriveNotebook([
      attempt('a1', 'mock', 'bcs', T0, [answer(1, 'q1', TENSE, null, false)]),
      attempt('a2', 'mock', 'bcs', T0 + DAY, [answer(1, 'q1', TENSE, null, false)]),
    ]);
    expect(entries).toHaveLength(0);
  });

  it('dedupes by questionId across exams — one entry, both exam contexts', () => {
    const entries = deriveNotebook([
      attempt('a1', 'practice', 'bcs', T0, [answer(1, 'q1', TENSE, 'A', false)]),
      attempt('a2', 'practice', 'bank', T0 + DAY, [answer(1, 'q1', TENSE, 'B', false)]),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0].examSlugs).toEqual(['bank', 'bcs']);
    expect(entries[0].wrongCount).toBe(2);
    expect(entries[0].sources).toEqual(['practice']);
  });

  it('sorts active by most-recent wrong first, learned after', () => {
    const entries = sortNotebookEntries(
      deriveNotebook([
        attempt('a1', 'practice', 'bcs', T0, [
          answer(1, 'q1', TENSE, 'A', false),
          answer(2, 'q2', VOICE, 'A', false),
        ]),
        attempt('a2', 'practice', 'bcs', T0 + DAY, [
          answer(1, 'q1', TENSE, 'C', true),
          answer(2, 'q2', VOICE, 'C', true),
        ]),
        attempt('a3', 'practice', 'bcs', T0 + 2 * DAY, [
          answer(1, 'q1', TENSE, 'C', true),
          answer(2, 'q2', VOICE, 'B', false),
        ]),
      ]),
    );
    // q1: W,C,C → learned. q2: W,C,W → active.
    expect(entries.map((e) => e.questionId)).toEqual(['q2', 'q1']);
    expect(entries[0].status).toBe('active');
    expect(entries[1].status).toBe('learned');
  });
});

describe('filterNotebook', () => {
  function threeEntries(): NotebookEntry[] {
    return sortNotebookEntries(
      deriveNotebook([
        attempt('a1', 'practice', 'bcs', T0, [
          answer(1, 'q1', TENSE, 'A', false),
          answer(2, 'q2', VOICE, 'A', false),
        ]),
        attempt('a2', 'mock', 'bank', T0 + DAY, [
          answer(1, 'q1', TENSE, 'C', true),
          answer(2, 'q2', VOICE, null, false),
        ]),
      ]),
    );
  }

  it('filters by exam, subject, topic, streak, source and latest outcome', () => {
    const entries = threeEntries();
    // q1: W then C → streak 1, lastOutcome correct, lastWrongKind practice.
    // q2: W then unanswered → streak 0, lastOutcome unanswered, lastWrongKind practice.
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, streak: '1' }).map((e) => e.questionId)).toEqual(['q1']);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, streak: '0' }).map((e) => e.questionId)).toEqual(['q2']);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, status: 'unanswered' }).map((e) => e.questionId)).toEqual(['q2']);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, status: 'wrong' })).toHaveLength(0);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, examSlug: 'bank' }).map((e) => e.questionId)).toEqual(['q1', 'q2']);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, topicId: VOICE }).map((e) => e.questionId)).toEqual(['q2']);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, source: 'mock' })).toHaveLength(0);
    expect(filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, source: 'practice' })).toHaveLength(2);
  });

  it('searches question text, topic label and questionId', () => {
    const entries = threeEntries();
    const texts = new Map([['q1', 'Choose the correct sentence about tense.']]);
    expect(
      filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, query: 'tense' }, texts).map((e) => e.questionId),
    ).toEqual(['q1']);
    expect(
      filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, query: 'q2' }, texts).map((e) => e.questionId),
    ).toEqual(['q2']);
    expect(
      filterNotebook(entries, { ...EMPTY_NOTEBOOK_FILTERS, query: 'voice' }, texts).map((e) => e.questionId),
    ).toEqual(['q2']);
  });

  it('groups active entries by topic', () => {
    const groups = groupNotebookByTopic(threeEntries().filter((e) => e.status === 'active'));
    expect(groups.map((g) => g.topicId)).toEqual([TENSE, VOICE]);
    expect(groups[0].entries).toHaveLength(1);
  });
});

describe('planWrongAnswersSession', () => {
  function bundleWith(ids: string[]): JobQuestionBundle {
    return {
      kind: 'topic',
      examSlug: 'bcs',
      topicId: TENSE,
      titleBn: 'Tense',
      titleEn: 'Tense',
      questions: ids.map((questionId, i) => ({
        n: i + 1,
        questionId,
        topicId: TENSE,
        subjectId: ENGLISH,
        questionText: `Question ${questionId}?`,
        options: [
          { letter: 'A' as const, text: 'a' },
          { letter: 'B' as const, text: 'b' },
          { letter: 'C' as const, text: 'c' },
          { letter: 'D' as const, text: 'd' },
        ],
        difficulty: 'easy' as const,
      })),
      questionCount: ids.length,
      bundleVersion: 1,
      status: 'published',
      reviewStatus: 'Published',
      sourceQuestionIds: ids,
    };
  }

  function entriesFor(ids: string[]): NotebookEntry[] {
    return ids.map((questionId) => ({
      questionId,
      topicId: TENSE,
      subjectId: ENGLISH,
      examSlugs: ['bcs'],
      sources: ['practice' as const],
      wrongCount: 2,
      firstWrongAtMillis: T0,
      lastWrongAtMillis: T0 + DAY,
      lastWrongAttemptId: 'a1',
      lastWrongKind: 'practice' as const,
      lastOutcome: 'wrong' as const,
      consecutiveCorrect: 0,
      clearedAtMillis: null,
      lastSelected: 'A',
      lastCorrectText: 'c',
      status: 'active' as const,
      learningState: 'new' as const,
    }));
  }

  it('mixes review questions first, then fresh never-attempted questions', () => {
    const bundle = bundleWith(['q1', 'q2', 'q3', 'q4', 'q5']);
    const planned = planWrongAnswersSession({
      topicEntries: entriesFor(['q1', 'q2']),
      bundle,
      answeredQuestionIds: new Set(['q1', 'q2', 'q3']),
    });
    expect(planned.items.map((i) => i.question.questionId).sort()).toEqual(['q1', 'q2', 'q4', 'q5']);
    expect(planned.items.filter((i) => i.isReview).map((i) => i.question.questionId).sort()).toEqual(['q1', 'q2']);
    expect(planned.items.filter((i) => !i.isReview).map((i) => i.question.questionId)).toEqual(['q4', 'q5']);
    // Review questions always come before fresh ones.
    const firstFresh = planned.items.findIndex((i) => !i.isReview);
    const lastReview = planned.items.map((i) => i.isReview).lastIndexOf(true);
    expect(firstFresh).toBeGreaterThan(lastReview);
    expect(planned.noFreshLeft).toBe(false);
    expect(planned.droppedMissing).toEqual([]);
    expect(planned.droppedCap).toEqual([]);
  });

  it('reports a wrong question the current bundle no longer contains', () => {
    const bundle = bundleWith(['q1']);
    const planned = planWrongAnswersSession({
      topicEntries: entriesFor(['q1', 'q-gone']),
      bundle,
      answeredQuestionIds: new Set(['q1']),
    });
    expect(planned.items.map((i) => i.question.questionId)).toEqual(['q1']);
    expect(planned.droppedMissing).toEqual(['q-gone']);
  });

  it('says so when no fresh question is left in the topic', () => {
    const bundle = bundleWith(['q1', 'q2']);
    const planned = planWrongAnswersSession({
      topicEntries: entriesFor(['q1']),
      bundle,
      answeredQuestionIds: new Set(['q1', 'q2']),
    });
    expect(planned.items).toHaveLength(1);
    expect(planned.noFreshLeft).toBe(true);
  });

  it('caps the session at maxTotal and reports the dropped wrong questions', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `q${i + 1}`);
    const bundle = bundleWith(ids);
    const planned = planWrongAnswersSession({
      topicEntries: entriesFor(ids),
      bundle,
      answeredQuestionIds: new Set(ids),
      maxTotal: 3,
      maxFresh: 0,
    });
    expect(planned.items).toHaveLength(3);
    expect(planned.droppedCap).toHaveLength(5);
  });

  it('builds a subset bundle + key with the original n values, and refuses a missing key entry', () => {
    const bundle = bundleWith(['q1', 'q2', 'q3']);
    const planned = planWrongAnswersSession({
      topicEntries: entriesFor(['q2']),
      bundle,
      answeredQuestionIds: new Set(['q1', 'q2']),
      maxFresh: 0,
    });
    const sub = buildSubsetBundle(bundle, planned.items);
    expect(sub.questions).toHaveLength(1);
    expect(sub.questions[0].n).toBe(2);
    expect(sub.questionCount).toBe(1);
    expect(sub.bundleVersion).toBe(1);
    const key: JobQuestionKey = {
      bundleId: 'topic__bcs__english__grammar__tense',
      answers: [
        { n: 1, questionId: 'q1', correctLetter: 'A', correctText: 'a', explanation: 'e1', whyWrong: null },
        { n: 2, questionId: 'q2', correctLetter: 'C', correctText: 'c', explanation: 'e2', whyWrong: { A: 'A ভুল কেন' } },
        { n: 3, questionId: 'q3', correctLetter: 'D', correctText: 'd', explanation: 'e3', whyWrong: null },
      ],
    };
    const subKey = buildSubsetKey(key, planned.items);
    expect(subKey.answers).toHaveLength(1);
    expect(subKey.answers[0].n).toBe(2);
    expect(subKey.answers[0].whyWrong).toEqual({ A: 'A ভুল কেন' });
    expect(() =>
      buildSubsetKey(
        { ...key, answers: key.answers.filter((a) => a.questionId !== 'q2') },
        planned.items,
      ),
    ).toThrow(/no entry for q2/);
  });
});
