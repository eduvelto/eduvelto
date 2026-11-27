// SSC/HSC GPA Calculator (Tool #41) — unit tests.
// Every expected value below is hand-computed; see the comments.
import { describe, it, expect } from 'vitest';
import { calculateSscHscGpa, sscHscGradeLetterForGpa } from '../../tools/sscHscGpa';

describe('calculateSscHscGpa', () => {
  it('computes GPA with a 4th subject: (24.5 + 3) / 6 = 4.58, grade A', () => {
    // Main sum: 5+5+4+4+3.5+3 = 24.5; 4th A+ adds max(0, 5-2) = 3 (capped at 3).
    const result = calculateSscHscGpa([5, 5, 4, 4, 3.5, 3], 5);
    expect(result).toEqual({ gpa: 4.58, passed: true, gradeLetter: 'A' });
  });

  it('caps GPA at 5.0: all A+ plus 4th A+ would be (30 + 3) / 6 = 5.5 -> 5.0, A+', () => {
    const result = calculateSscHscGpa([5, 5, 5, 5, 5, 5], 5);
    expect(result).toEqual({ gpa: 5.0, passed: true, gradeLetter: 'A+' });
  });

  it('fails when any main subject is F: GPA 0, passed false, grade F', () => {
    const result = calculateSscHscGpa([5, 5, 5, 5, 5, 0], 5);
    expect(result).toEqual({ gpa: 0, passed: false, gradeLetter: 'F' });
  });

  it('works without a 4th subject: six 4.0s -> 24 / 6 = 4.0, grade A', () => {
    expect(calculateSscHscGpa([4, 4, 4, 4, 4, 4])).toEqual({
      gpa: 4.0,
      passed: true,
      gradeLetter: 'A',
    });
  });

  it('adds only the 4th-subject points above 2: six 3.0s + 4th 4.0 -> (18 + 2) / 6 = 3.33, grade B', () => {
    expect(calculateSscHscGpa([3, 3, 3, 3, 3, 3], 4)).toEqual({
      gpa: 3.33,
      passed: true,
      gradeLetter: 'B',
    });
  });

  it('adds nothing when the 4th subject is 2.0 or below: six 3.0s + 4th 2.0 -> 18 / 6 = 3.0, grade B', () => {
    expect(calculateSscHscGpa([3, 3, 3, 3, 3, 3], 2)).toEqual({
      gpa: 3.0,
      passed: true,
      gradeLetter: 'B',
    });
  });

  it('caps the 4th-subject extra at 3.0 (4th 5.0 adds 3, not more)', () => {
    // (12 + 3) / 6 = 2.5 -> grade C.
    expect(calculateSscHscGpa([2, 2, 2, 2, 2, 2], 5)).toEqual({
      gpa: 2.5,
      passed: true,
      gradeLetter: 'C',
    });
  });

  it('rejects the wrong number of main subjects', () => {
    expect(() => calculateSscHscGpa([5, 5, 5, 5, 5])).toThrow(/Exactly 6/);
    expect(() => calculateSscHscGpa([5, 5, 5, 5, 5, 5, 5])).toThrow(/Exactly 6/);
  });

  it('rejects grade points that are not on the SSC/HSC scale', () => {
    expect(() => calculateSscHscGpa([5, 5, 5, 5, 5, 4.5])).toThrow(/valid SSC\/HSC grade point/);
    expect(() => calculateSscHscGpa([5, 5, 5, 5, 5, 6])).toThrow(/valid SSC\/HSC grade point/);
    expect(() => calculateSscHscGpa([5, 5, 5, 5, 5, 5], 4.5)).toThrow(/valid SSC\/HSC grade point/);
  });
});

describe('sscHscGradeLetterForGpa', () => {
  it('maps GPA boundaries to letters', () => {
    expect(sscHscGradeLetterForGpa(5)).toBe('A+');
    expect(sscHscGradeLetterForGpa(4.99)).toBe('A');
    expect(sscHscGradeLetterForGpa(3.5)).toBe('A-');
    expect(sscHscGradeLetterForGpa(3.49)).toBe('B');
    expect(sscHscGradeLetterForGpa(2)).toBe('C');
    expect(sscHscGradeLetterForGpa(1)).toBe('D');
    expect(sscHscGradeLetterForGpa(0.99)).toBe('F');
  });
});
