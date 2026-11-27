import { describe, it, expect } from 'vitest';
import { analyzeMarks, parseMarksList } from '../../tools/gradeAnalyzer';

describe('parseMarksList', () => {
  it('parses commas and newlines', () => {
    expect(parseMarksList('85, 72\n65')).toEqual([85, 72, 65]);
  });
  it('throws on an out-of-range mark', () => {
    expect(() => parseMarksList('85, 101')).toThrow();
  });
});

describe('analyzeMarks', () => {
  it('[85,72,65,90,78,88] -> GPA 4.42, pass', () => {
    const a = analyzeMarks([85, 72, 65, 90, 78, 88]);
    expect(a.total).toBe(478);
    expect(a.gpa).toBe(4.42);
    expect(a.passed).toBe(true);
  });
});
