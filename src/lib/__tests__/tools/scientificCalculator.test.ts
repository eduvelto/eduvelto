import { describe, it, expect } from 'vitest';
import { evaluateExpression, formatCalcResult } from '../../tools/scientificCalculator';

describe('evaluateExpression', () => {
  it('2+3*4 = 14 (precedence)', () => expect(evaluateExpression('2+3*4')).toBe(14));
  it('(2+3)*4 = 20', () => expect(evaluateExpression('(2+3)*4')).toBe(20));
  it('2^3 = 8', () => expect(evaluateExpression('2^3')).toBe(8));
  it('sin(30) = 0.5 in degrees', () => expect(evaluateExpression('sin(30)')).toBeCloseTo(0.5, 10));
  it('sin(pi/2) = 1 in radians', () => expect(evaluateExpression('sin(pi/2)', 'rad')).toBeCloseTo(1, 10));
  it('sqrt(16)+log(100) = 6', () => expect(evaluateExpression('sqrt(16)+log(100)')).toBe(6));
  it('ln(e) = 1', () => expect(evaluateExpression('ln(e)')).toBeCloseTo(1, 10));
  it('10%3 = 1', () => expect(evaluateExpression('10%3')).toBe(1));
  it('throws on division by zero, unknown names and bad syntax', () => {
    expect(() => evaluateExpression('1/0')).toThrow();
    expect(() => evaluateExpression('foo(2)')).toThrow();
    expect(() => evaluateExpression('2+')).toThrow();
    expect(() => evaluateExpression('(2+3')).toThrow();
  });
});

describe('formatCalcResult', () => {
  it('trims float noise: 0.1+0.2 style values', () => {
    expect(formatCalcResult(0.30000000000000004)).toBe('0.3');
  });
});
