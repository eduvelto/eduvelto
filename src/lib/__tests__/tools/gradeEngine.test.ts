import { describe, it, expect } from 'vitest';
import { analyzeMarks, gradeForMarks, parseStudentRows, passFailSummary, rankStudents } from '../../tools/gradeEngine';

describe('gradeForMarks', () => {
  it('maps the BD scale: 85 A+, 72 A, 65 A-, 50 B, 40 C, 33 D, 32 F', () => {
    expect(gradeForMarks(85).gradeLetter).toBe('A+');
    expect(gradeForMarks(72).gradeLetter).toBe('A');
    expect(gradeForMarks(65).gradeLetter).toBe('A-');
    expect(gradeForMarks(50).gradeLetter).toBe('B');
    expect(gradeForMarks(40).gradeLetter).toBe('C');
    expect(gradeForMarks(33).gradeLetter).toBe('D');
    expect(gradeForMarks(32).gradeLetter).toBe('F');
  });
  it('throws outside 0-100', () => {
    expect(() => gradeForMarks(101)).toThrow();
  });
});

describe('analyzeMarks', () => {
  it('[85,72,65] -> total 222, GPA 4.17, pass', () => {
    const a = analyzeMarks([85, 72, 65]);
    expect(a.total).toBe(222);
    expect(a.gpa).toBe(4.17);
    expect(a.passed).toBe(true);
  });
  it('any F fails the set', () => {
    expect(analyzeMarks([85, 20]).passed).toBe(false);
  });
});

describe('parseStudentRows + rankStudents', () => {
  it('parses comma rows and ranks with shared ranks for ties', () => {
    const rows = parseStudentRows('Rahim, 85, 72\nKarim, 90, 88\nSalma, 90, 88\nTanvir, 60, 60');
    const ranked = rankStudents(rows);
    expect(ranked.map((r) => [r.name, r.total, r.rank])).toEqual([
      ['Karim', 178, 1],
      ['Salma', 178, 1],
      ['Rahim', 157, 3],
      ['Tanvir', 120, 4],
    ]);
  });
  it('throws when nothing parses', () => {
    expect(() => parseStudentRows('hello')).toThrow();
  });
});

describe('passFailSummary', () => {
  it('counts pass rate', () => {
    expect(passFailSummary([{ passed: true }, { passed: false }, { passed: true }])).toEqual(
      { total: 3, passed: 2, failed: 1, passRate: 66.7 },
    );
  });
});
