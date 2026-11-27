import { describe, it, expect } from 'vitest';
import { calculateInternationalGpa, convertGpaScale } from '../../tools/internationalGpa';

describe('calculateInternationalGpa', () => {
  it('(12+9+7.4)/8 = 3.55 on the 4.0 scale', () => {
    expect(calculateInternationalGpa([{ gradePoint: 4.0, credit: 3 }, { gradePoint: 3.0, credit: 3 }, { gradePoint: 3.7, credit: 2 }], '4.0')).toEqual(
      { gpa: 3.55, totalCredits: 8, scale: '4.0' },
    );
  });
  it('5.0 scale: (5*3 + 4*3)/6 = 4.5', () => {
    expect(calculateInternationalGpa([{ gradePoint: 5.0, credit: 3 }, { gradePoint: 4.0, credit: 3 }], '5.0').gpa).toBe(4.5);
  });
  it('rejects a 5.0-scale point on the 4.0 scale', () => {
    expect(() => calculateInternationalGpa([{ gradePoint: 5.0, credit: 3 }], '4.0')).toThrow();
  });
});

describe('convertGpaScale', () => {
  it('3.0 on 4.0 -> 3.75 on 5.0', () => expect(convertGpaScale(3.0, '4.0', '5.0')).toBe(3.75));
  it('same scale is unchanged', () => expect(convertGpaScale(3.0, '4.0', '4.0')).toBe(3.0));
});
