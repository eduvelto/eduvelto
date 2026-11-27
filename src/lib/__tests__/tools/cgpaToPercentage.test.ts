import { describe, it, expect } from 'vitest';
import { convertCgpaToPercentage } from '../../tools/cgpaToPercentage';

describe('convertCgpaToPercentage', () => {
  it('3.5 on 4.0 proportional -> 87.5%', () => {
    expect(convertCgpaToPercentage(3.5, 4.0, 'proportional').percentage).toBe(87.5);
  });
  it('3.5 x9.5 -> 33.25%', () => {
    expect(convertCgpaToPercentage(3.5, 10, 'x9.5').percentage).toBe(33.25);
  });
  it('3.5 x10 -> 35%', () => {
    expect(convertCgpaToPercentage(3.5, 10, 'x10').percentage).toBe(35);
  });
  it('throws when CGPA exceeds the scale', () => {
    expect(() => convertCgpaToPercentage(4.5, 4.0, 'proportional')).toThrow();
  });
});
