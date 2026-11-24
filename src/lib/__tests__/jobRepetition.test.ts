// Live Exam repetition control — design-live-exam-dashboard.md
// §3 + §6 items 1–2. Pure selection tests (no Firestore).
import { describe, expect, it } from 'vitest';
import {
  JOB_EXAM_HISTORY_MAX_EXPOSURES,
  JOB_EXPOSURE_WEIGHTS,
  chooseLiveExamVariant,
  cryptoRandom,
  exactHistoryView,
  examDifficultyTargets,
  forcedRepeatNotice,
  proportionalTopicSplit,
  scoreCandidate,
  scoreCandidateByRank,
  selectLiveExamSet,
  variantOverlap,
  type ExposureHistory,
  type SelectionPoolGroup,
} from '../jobRepetition';
import { selectForQuota } from '../jobBankSelection';

/** Deterministic RNG for tests (mulberry32). */
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pool groups for the Bank exam (25/25/20/20/10 = 100Q):
 * `perDifficulty` IDs per (subject, difficulty), one topic per
 * subject (topic split only where the syllabus requires it). */
function bankPoolGroups(perDifficulty: number): SelectionPoolGroup[] {
  const subjects = ['bangla', 'english', 'math', 'general-knowledge', 'ict'];
  const groups: SelectionPoolGroup[] = [];
  for (const subject of subjects) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const ids: string[] = [];
      for (let i = 0; i < perDifficulty; i += 1) {
        ids.push(`q-bank-${subject}-${difficulty}-${String(i + 1).padStart(3, '0')}`);
      }
      groups.push({ subjectId: subject, topicId: `${subject}-topic`, difficulty, questionIds: ids });
    }
  }
  return groups;
}

const EMPTY_HISTORY: ExposureHistory = { examId: 'bank', recentQuestionIds: [], lastAttemptNo: 0 };

describe('JOB_EXPOSURE_WEIGHTS (§3.3 step C)', () => {
  it('adopts ChatGPT illustrative values as v1 defaults', () => {
    expect(JOB_EXPOSURE_WEIGHTS).toEqual({
      neverSeen: 10,
      overTenAgo: 6,
      sixToTenAgo: 4,
      twoToFiveAgo: 2,
      previousAttempt: 0.5,
    });
  });

  it('scores from the ACTUAL last-seen attempt number — a weight-table change needs no history rewrite', () => {
    // Same history doc, two different attempt-number clocks:
    // the weight follows the attempt numbers, not a stored bucket.
    expect(scoreCandidate(null, 5)).toBe(10); // never seen
    expect(scoreCandidate(4, 5)).toBe(0.5); // previous attempt (g=1)
    expect(scoreCandidate(3, 5)).toBe(2); // g=2
    expect(scoreCandidate(0, 5)).toBe(2); // g=5
    expect(scoreCandidate(0, 7)).toBe(4); // g=7
    expect(scoreCandidate(0, 10)).toBe(4); // g=10 — still the 6–10 band
    expect(scoreCandidate(0, 11)).toBe(6); // g=11 — seen >10 attempts ago
    expect(scoreCandidate(0, 12)).toBe(6); // g=12 → 6
  });

  it('rank proxy matches the table order (most recent = lowest weight)', () => {
    expect(scoreCandidateByRank(null)).toBe(10);
    expect(scoreCandidateByRank(0)).toBe(0.5);
    expect(scoreCandidateByRank(4)).toBe(2);
    expect(scoreCandidateByRank(9)).toBe(4);
    expect(scoreCandidateByRank(10)).toBe(6);
    expect(scoreCandidateByRank(400)).toBe(6);
  });

  it('history cap is 400 (ChatGPT 300–500 range)', () => {
    expect(JOB_EXAM_HISTORY_MAX_EXPOSURES).toBe(400);
  });
});

describe('selectLiveExamSet — no-duplicate invariant (§8 item 1)', () => {
  it('never repeats a question ID within an attempt (100 seeded draws)', () => {
    const groups = bankPoolGroups(16);
    for (let seed = 1; seed <= 100; seed += 1) {
      const sel = selectLiveExamSet({
        examSlug: 'bank',
        poolGroups: groups,
        history: EMPTY_HISTORY,
        random: seededRandom(seed),
      });
      expect(new Set(sel.selectedIds).size).toBe(sel.selectedIds.length);
      expect(sel.selectedIds.length).toBe(100);
      expect(sel.shortfall).toBe(0);
      expect(sel.smallBankNotice).toBe(false);
    }
  });

  it('cryptoRandom returns values in [0, 1)', () => {
    for (let i = 0; i < 20; i += 1) {
      const v = cryptoRandom();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('selectLiveExamSet — blueprint strictness (§3.1 rule 4, §8 item 4)', () => {
  it('matches subject quotas exactly and the difficulty mix exactly', () => {
    const sel = selectLiveExamSet({
      examSlug: 'bank',
      poolGroups: bankPoolGroups(16),
      history: EMPTY_HISTORY,
      random: seededRandom(7),
    });
    expect(sel.perSubject.map((f) => [f.subjectId, f.quota, f.selected])).toEqual([
      ['bangla', 25, 25],
      ['english', 25, 25],
      ['math', 20, 20],
      ['general-knowledge', 20, 20],
      ['ict', 10, 10],
    ]);
    // Configured mix 30/55/15 over 100Q — exact after the
    // cross-subject adjustment (per-subject rounding alone
    // drifts to 31/56/13).
    expect(sel.difficultyCounts).toEqual({ easy: 30, medium: 55, hard: 15 });
    expect(examDifficultyTargets(100)).toEqual({ easy: 30, medium: 55, hard: 15 });
    expect(examDifficultyTargets(200)).toEqual({ easy: 60, medium: 110, hard: 30 });
    expect(examDifficultyTargets(90)).toEqual({ easy: 27, medium: 50, hard: 13 });
  });

  it('fills a short unseen pool from oldest-seen, never borrows across subjects', () => {
    // Bangla: only 10 unseen of 25 wanted; the other 15 must come
    // from Bangla's seen pool — English (fully unseen) must stay
    // exactly at its own quota.
    const groups = bankPoolGroups(16);
    const seenBangla = groups
      .filter((g) => g.subjectId === 'bangla')
      .flatMap((g) => g.questionIds)
      .slice(0, 26);
    const history: ExposureHistory = {
      examId: 'bank',
      recentQuestionIds: seenBangla,
      lastAttemptNo: 3,
    };
    const sel = selectLiveExamSet({ examSlug: 'bank', poolGroups: groups, history, random: seededRandom(3) });
    const bangla = sel.perSubject.find((f) => f.subjectId === 'bangla')!;
    const english = sel.perSubject.find((f) => f.subjectId === 'english')!;
    expect(bangla.selected).toBe(25);
    expect(bangla.repeated).toBeGreaterThan(0);
    expect(english.selected).toBe(25);
    expect(english.repeated).toBe(0);
    expect(sel.smallBankNotice).toBe(true);
  });

  it('reports a shortfall instead of padding with duplicates when the pool is too small', () => {
    const groups = bankPoolGroups(2); // 2 per (subject, difficulty) = 6 per subject
    const sel = selectLiveExamSet({ examSlug: 'bank', poolGroups: groups, history: EMPTY_HISTORY, random: seededRandom(1) });
    expect(new Set(sel.selectedIds).size).toBe(sel.selectedIds.length);
    expect(sel.selectedIds.length).toBe(29); // 6 per subject × 4 + 5 (ICT hard quota is 1)
    expect(sel.shortfall).toBe(71);
    expect(sel.smallBankNotice).toBe(true);
    expect(sel.perSubject.every((f) => f.shortfall > 0)).toBe(true);
  });
});

describe('selectLiveExamSet — forced-repeat arithmetic (§3.3 worked example)', () => {
  it('35 eligible / 30 seen / 25 required → at least 20 must repeat + notice', () => {
    // One-subject slice of the arithmetic: a 25Q quota drawn
    // from 35 eligible IDs of which 30 are seen.
    const eligible = Array.from({ length: 35 }, (_, i) => `q-${String(i + 1).padStart(2, '0')}`);
    const seen = eligible.slice(0, 30);
    const history: ExposureHistory = { examId: 'bank', recentQuestionIds: [...seen].reverse(), lastAttemptNo: 4 };
    const picked = selectForQuota(eligible, history, 25, seededRandom(11));
    expect(picked.selected.length).toBe(25);
    expect(new Set(picked.selected).size).toBe(25);
    expect(picked.repeatedCount).toBeGreaterThanOrEqual(20);
    expect(picked.needsSmallBankNotice).toBe(true);
    expect(picked.shortfall).toBe(0);
  });

  it('unseen-first ordering: with a full unseen pool, no repeats are picked', () => {
    const sel = selectLiveExamSet({
      examSlug: 'bank',
      poolGroups: bankPoolGroups(16),
      history: { examId: 'bank', recentQuestionIds: ['q-bank-bangla-easy-001'], lastAttemptNo: 1 },
      random: seededRandom(5),
    });
    // Only 1 seen ID exists in the whole bank; the draw is
    // weighted, so the seen ID is unlikely but possible — the
    // invariant is the COUNT: repeats stay tiny, never forced.
    expect(sel.repeatedCount).toBeLessThanOrEqual(1);
    expect(sel.smallBankNotice).toBe(false);
  });
});

describe('proportionalTopicSplit (§2.1)', () => {
  it('splits by eligible share with largest-remainder rounding', () => {
    expect(
      proportionalTopicSplit(
        [
          { topicId: 'a', eligible: 10 },
          { topicId: 'b', eligible: 10 },
          { topicId: 'c', eligible: 5 },
        ],
        10,
      ),
    ).toEqual([
      { topicId: 'a', questions: 4 },
      { topicId: 'b', questions: 4 },
      { topicId: 'c', questions: 2 },
    ]);
    expect(
      proportionalTopicSplit(
        [
          { topicId: 'a', eligible: 3 },
          { topicId: 'b', eligible: 1 },
        ],
        3,
      ),
    ).toEqual([
      { topicId: 'a', questions: 2 },
      { topicId: 'b', questions: 1 },
    ]);
  });

  it('returns zeros when nothing is eligible', () => {
    expect(proportionalTopicSplit([{ topicId: 'a', eligible: 0 }], 5)).toEqual([{ topicId: 'a', questions: 0 }]);
  });
});

describe('exactHistoryView (§3.2 forward-compat)', () => {
  it('orders IDs by attempts-ago ascending (previous attempt first)', () => {
    const history: ExposureHistory = { examId: 'bank', recentQuestionIds: ['q3', 'q1'], lastAttemptNo: 10 };
    const view = exactHistoryView(
      history,
      new Map([
        ['q1', 9], // g=1 — previous attempt
        ['q2', 2], // g=8
        ['q3', 5], // g=5
      ]),
    );
    expect(view.recentQuestionIds).toEqual(['q1', 'q3', 'q2']);
  });
});

describe('variant-pool assignment (§3.9)', () => {
  const variants = [
    { mockId: 'full__bank__1', docId: 'full__bank__1', variantNo: 1, questionIds: ['a', 'b', 'c'] },
    { mockId: 'full__bank__2', docId: 'full__bank__2', variantNo: 2, questionIds: ['d', 'e', 'f'] },
    { mockId: 'full__bank__3', docId: 'full__bank__3', variantNo: 3, questionIds: ['a', 'd', 'g'] },
  ];

  it('picks the lowest-overlap variant; ties go to the lowest variant number', () => {
    const history: ExposureHistory = { examId: 'bank', recentQuestionIds: ['a', 'b'], lastAttemptNo: 2 };
    const picked = chooseLiveExamVariant(variants, history)!;
    expect(picked.variant.variantNo).toBe(2); // overlap 0
    expect(picked.overlap).toBe(0);
    expect(picked.overlaps).toEqual([
      { variantNo: 1, overlap: 2 },
      { variantNo: 2, overlap: 0 },
      { variantNo: 3, overlap: 1 },
    ]);
  });

  it('a student who just ran variant 2 is not offered it again unless all overlap equally', () => {
    const history: ExposureHistory = { examId: 'bank', recentQuestionIds: ['d', 'e', 'f'], lastAttemptNo: 1 };
    const picked = chooseLiveExamVariant(variants, history)!;
    expect(picked.variant.variantNo).toBe(1); // overlap 0; variant 2 overlaps 3
    expect(picked.overlap).toBe(0);
  });

  it('first attempt (no history) picks variant 1', () => {
    const picked = chooseLiveExamVariant(variants, null)!;
    expect(picked.variant.variantNo).toBe(1);
    expect(picked.overlap).toBe(0);
  });

  it('returns null when there are no variants', () => {
    expect(chooseLiveExamVariant([], EMPTY_HISTORY)).toBeNull();
  });

  it('variantOverlap counts seen IDs; forcedRepeatNotice fires only when every variant overlaps', () => {
    expect(variantOverlap(['a', 'x'], { examId: 'bank', recentQuestionIds: ['a'], lastAttemptNo: 1 })).toBe(1);
    expect(variantOverlap(['a', 'x'], null)).toBe(0);
    expect(forcedRepeatNotice([0, 2, 1])).toBe(false);
    expect(forcedRepeatNotice([1, 2, 3])).toBe(true);
    expect(forcedRepeatNotice([])).toBe(false);
  });

  it('cross-exam independence: the same question can appear in a BCS attempt and a Bank attempt (§3.1 rule 3)', () => {
    // History is scoped to studentId + examId: a BCS history
    // never penalises a Bank draw.
    const bcsHistory: ExposureHistory = { examId: 'bcs', recentQuestionIds: ['q-shared-001'], lastAttemptNo: 2 };
    const bankHistory: ExposureHistory = { examId: 'bank', recentQuestionIds: [], lastAttemptNo: 0 };
    expect(variantOverlap(['q-shared-001'], bcsHistory)).toBe(1);
    expect(variantOverlap(['q-shared-001'], bankHistory)).toBe(0);
    const picked = chooseLiveExamVariant(
      [{ mockId: 'full__bank__1', docId: 'full__bank__1', variantNo: 1, questionIds: ['q-shared-001'] }],
      bankHistory,
    )!;
    expect(picked.overlap).toBe(0);
  });
});
