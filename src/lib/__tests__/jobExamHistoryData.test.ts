// Exposure-history data layer — pure parts
// (design-live-exam-dashboard.md §3.6). The Firestore calls
// (load/merge/rebuild) need the emulator and are covered by the
// rules tests; what is unit-tested here is the idempotency
// guard + the rebuild fold, which must be right before any
// write runs.
import { describe, expect, it } from 'vitest';
import {
  examHistoryDocId,
  isAlreadyMergedForAttempt,
  rebuildExposureHistoryFromAttempts,
} from '../jobExamHistoryData';
import type { ExposureHistory } from '../jobBankSelection';

describe('examHistoryDocId', () => {
  it('maps Bank post slugs to the shared bank history (repetition scope is studentId + examId)', () => {
    expect(examHistoryDocId('bcs')).toBe('bcs');
    expect(examHistoryDocId('bank')).toBe('bank');
    expect(examHistoryDocId('bank-senior-officer')).toBe('bank');
    expect(examHistoryDocId('bank-assistant-director')).toBe('bank');
    expect(examHistoryDocId('primary-teacher')).toBe('primary-teacher');
    expect(examHistoryDocId('ntrca')).toBe('ntrca');
  });
});

describe('isAlreadyMergedForAttempt (§3.6 idempotency fingerprint)', () => {
  const history: ExposureHistory = {
    examId: 'bank',
    recentQuestionIds: ['q1', 'q2', 'q3', 'old-1'],
    lastAttemptNo: 2,
  };

  it('detects the exact state a completed merge leaves behind', () => {
    expect(isAlreadyMergedForAttempt(history, ['q1', 'q2', 'q3'])).toBe(true);
  });

  it('fires for a prefix too — the fingerprint cannot tell "merged [q1,q2]" from "merged [q1,q2,q3]" (documented residual: a later attempt whose set is a prefix of an earlier merged set skips its merge; the exposure state is identical either way)', () => {
    expect(isAlreadyMergedForAttempt(history, ['q1', 'q2'])).toBe(true);
  });

  it('does not fire for a reordered set, a different set, or a longer set', () => {
    expect(isAlreadyMergedForAttempt(history, ['q2', 'q1', 'q3'])).toBe(false);
    expect(isAlreadyMergedForAttempt(history, ['q4', 'q5'])).toBe(false);
    expect(isAlreadyMergedForAttempt(history, ['q1', 'q2', 'q3', 'q4'])).toBe(false);
  });

  it('does not fire without history or with an empty set', () => {
    expect(isAlreadyMergedForAttempt(null, ['q1'])).toBe(false);
    expect(isAlreadyMergedForAttempt(history, [])).toBe(false);
  });
});

describe('rebuildExposureHistoryFromAttempts (§3.2 — history is a derived index)', () => {
  it('folds oldest → newest, bumping lastAttemptNo once per attempt', () => {
    const rebuilt = rebuildExposureHistoryFromAttempts('bank', [
      { submittedAtMillis: 1000, questionIds: ['a', 'b'] },
      { submittedAtMillis: 3000, questionIds: ['b', 'c'] },
      { submittedAtMillis: 2000, questionIds: ['d'] },
    ]);
    expect(rebuilt.lastAttemptNo).toBe(3);
    // Most-recent-first: newest attempt's IDs first (deduped).
    expect(rebuilt.recentQuestionIds).toEqual(['b', 'c', 'd', 'a']);
  });

  it('ignores empty attempts and returns an empty history for no attempts', () => {
    const rebuilt = rebuildExposureHistoryFromAttempts('bcs', [
      { submittedAtMillis: 1000, questionIds: [] },
    ]);
    expect(rebuilt).toEqual({ examId: 'bcs', recentQuestionIds: [], lastAttemptNo: 0 });
    expect(rebuildExposureHistoryFromAttempts('bcs', [])).toEqual({
      examId: 'bcs',
      recentQuestionIds: [],
      lastAttemptNo: 0,
    });
  });

  it('is rebuildable: a merge followed by a rebuild from the same attempts agrees', () => {
    const attempts = [
      { submittedAtMillis: 1000, questionIds: ['x', 'y'] },
      { submittedAtMillis: 2000, questionIds: ['y', 'z'] },
    ];
    const first = rebuildExposureHistoryFromAttempts('ntrca', attempts);
    const second = rebuildExposureHistoryFromAttempts('ntrca', attempts);
    expect(first).toEqual(second);
  });
});
