// NU CGPA Calculator (Tool #42) — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateNuCgpa, NU_GRADE_POINTS } from '../../tools/nuCgpa';

describe('calculateNuCgpa', () => {
  it('computes the credit-weighted CGPA: (11.25 + 12 + 7) / 8 = 3.78, 8 credits', () => {
    // 3.75x3 = 11.25; 4.00x3 = 12.00; 3.50x2 = 7.00; total 30.25 / 8 = 3.78125 -> 3.78.
    const result = calculateNuCgpa([
      { gradePoint: 3.75, credit: 3 },
      { gradePoint: 4.0, credit: 3 },
      { gradePoint: 3.5, credit: 2 },
    ]);
    expect(result).toEqual({ cgpa: 3.78, totalCredits: 8 });
  });

  it('weights by credit: a 4-credit A (3.75) counts more than a 2-credit B (3.0)', () => {
    // (3.75x4 + 3.0x2) / 6 = (15 + 6) / 6 = 3.5.
    expect(
      calculateNuCgpa([
        { gradePoint: 3.75, credit: 4 },
        { gradePoint: 3.0, credit: 2 },
      ]),
    ).toEqual({ cgpa: 3.5, totalCredits: 6 });
  });

  it('handles a single course', () => {
    expect(calculateNuCgpa([{ gradePoint: 2.25, credit: 3 }])).toEqual({
      cgpa: 2.25,
      totalCredits: 3,
    });
  });

  it('handles an F (0.00): (0x3 + 4x3) / 6 = 2.0', () => {
    expect(
      calculateNuCgpa([
        { gradePoint: 0, credit: 3 },
        { gradePoint: 4, credit: 3 },
      ]),
    ).toEqual({ cgpa: 2.0, totalCredits: 6 });
  });

  it('uses the published NU scale', () => {
    expect(NU_GRADE_POINTS).toEqual({
      'A+': 4.0,
      A: 3.75,
      'A-': 3.5,
      'B+': 3.25,
      B: 3.0,
      'B-': 2.75,
      'C+': 2.5,
      C: 2.25,
      D: 2.0,
      F: 0.0,
    });
  });

  it('rejects an empty course list', () => {
    expect(() => calculateNuCgpa([])).toThrow(/At least one course/);
  });

  it('rejects grade points not on the NU scale', () => {
    expect(() => calculateNuCgpa([{ gradePoint: 4.5, credit: 3 }])).toThrow(/valid NU grade point/);
    expect(() => calculateNuCgpa([{ gradePoint: 3.8, credit: 3 }])).toThrow(/valid NU grade point/);
  });

  it('rejects non-positive credits', () => {
    expect(() => calculateNuCgpa([{ gradePoint: 4, credit: 0 }])).toThrow(/positive number/);
    expect(() => calculateNuCgpa([{ gradePoint: 4, credit: -2 }])).toThrow(/positive number/);
  });
});
