import { describe, it, expect } from 'vitest';
import { calculateNegativeMarking } from '../../tools/negativeMarking';

describe('calculateNegativeMarking', () => {
  it('200 Qs, 180 attempted, 150 correct, -0.5 -> final 135/200', () => {
    const r = calculateNegativeMarking({ totalQuestions: 200, attempted: 180, correct: 150, marksPerQuestion: 1, negativePerWrong: 0.5 });
    expect(r).toEqual(
      { wrong: 30, unattempted: 20, rawScore: 150, deduction: 15, finalScore: 135, maxScore: 200, accuracy: 83.3 },
    );
  });
  it('no attempt -> accuracy 0, final 0', () => {
    const r = calculateNegativeMarking({ totalQuestions: 100, attempted: 0, correct: 0, marksPerQuestion: 1, negativePerWrong: 0.5 });
    expect(r.finalScore).toBe(0);
    expect(r.accuracy).toBe(0);
  });
  it('throws when correct exceeds attempted', () => {
    expect(() => calculateNegativeMarking({ totalQuestions: 100, attempted: 50, correct: 60, marksPerQuestion: 1, negativePerWrong: 0.5 })).toThrow();
  });
});
