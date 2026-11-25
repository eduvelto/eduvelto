// Question Paper Generator Phase 2 — Sheet Builder (exercises) tests.
// Registry state, selection, and the honest empty sheet result.
import { describe, it, expect } from 'vitest';
import {
  QPG_EXERCISE_REGISTRY,
  qpgExercisesFor,
  qpgExerciseAvailable,
  qpgSelectedExerciseCount,
  qpgSheetQuestionsFor,
  selectAllQpgExercises,
  toggleQpgExercise,
} from '../qpgExercises';

describe('exercise registry (Phase B not started)', () => {
  it('starts empty — no exercise list has been extracted yet', () => {
    expect(QPG_EXERCISE_REGISTRY).toEqual([]);
    expect(qpgExercisesFor('any-chapter')).toBeNull();
  });
});

describe('exercise selection', () => {
  const entry = {
    chapterId: 'ch-2',
    chapterNameBn: 'সেট ও ফাংশন',
    bookId: 'dakhil-math-9-10',
    sourceNoteBn: 'Phase B extraction (not yet done)',
    exercises: [
      { id: 'ex-2-1', numberBn: '২.১', verifiedCount: 0 },
      { id: 'ex-2-2', numberBn: '২.২', verifiedCount: 3 },
      { id: 'ex-2-3', numberBn: '২.৩', verifiedCount: 0 },
    ],
  };

  it('an exercise is usable only with verified questions', () => {
    expect(qpgExerciseAvailable(entry.exercises[0])).toBe(false);
    expect(qpgExerciseAvailable(entry.exercises[1])).toBe(true);
  });

  it('toggle adds/removes one exercise', () => {
    let sel = {};
    sel = toggleQpgExercise(sel, 'ch-2', 'ex-2-2');
    expect(qpgSelectedExerciseCount(sel)).toBe(1);
    sel = toggleQpgExercise(sel, 'ch-2', 'ex-2-2');
    expect(qpgSelectedExerciseCount(sel)).toBe(0);
    expect(sel).toEqual({});
  });

  it('select-all picks only usable exercises', () => {
    const sel = selectAllQpgExercises({}, entry);
    expect(sel).toEqual({ 'ch-2': ['ex-2-2'] });
  });
});

describe('sheet questions (honest empty state)', () => {
  it('refuses to build a sheet from zero selected exercises', () => {
    const r = qpgSheetQuestionsFor({});
    expect(r.questions).toEqual([]);
    expect(r.reasonsBn.length).toBeGreaterThan(0);
  });

  it('reports honestly when no verified question maps to the exercises', () => {
    const r = qpgSheetQuestionsFor({ 'ch-2': ['ex-2-2'] }, []);
    expect(r.questions).toEqual([]);
    expect(r.available).toBe(0);
    expect(r.reasonsBn.join(' ')).toContain('যাচাইকৃত প্রশ্ন এখনো তৈরি হয়নি');
  });
});
