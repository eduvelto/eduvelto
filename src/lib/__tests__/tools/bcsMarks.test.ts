import { describe, it, expect } from 'vitest';
import { BCS_STRUCTURE, calculateBcsMarks } from '../../tools/bcsMarks';

describe('calculateBcsMarks', () => {
  it('prelim 150 correct/30 wrong -> 135; full written + viva 80 -> 1115/1200', () => {
    const r = calculateBcsMarks({
      prelimCorrect: 150,
      prelimWrong: 30,
      written: { bangla: 200, english: 200, bangladeshAffairs: 200, internationalAffairs: 100, mathMental: 100, scienceTech: 100 },
      viva: 80,
    });
    expect(r.prelimScore).toBe(135);
    expect(r.writtenTotal).toBe(900);
    expect(r.grandTotal).toBe(1115);
    expect(r.overallPct).toBe(92.9);
  });
  it('structure totals: prelim 200, written 900, viva 100, grand 1200', () => {
    expect(BCS_STRUCTURE.prelimTotal).toBe(200);
    expect(BCS_STRUCTURE.writtenTotal).toBe(900);
    expect(BCS_STRUCTURE.vivaTotal).toBe(100);
    expect(BCS_STRUCTURE.grandTotal).toBe(1200);
    expect(BCS_STRUCTURE.writtenSubjects.reduce((s, x) => s + x.max, 0)).toBe(900);
  });
  it('throws when prelim correct+wrong exceeds 200', () => {
    expect(() => calculateBcsMarks({ prelimCorrect: 180, prelimWrong: 30, written: {}, viva: 0 })).toThrow();
  });
});
