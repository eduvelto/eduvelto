import { describe, it, expect } from 'vitest';
import { paperSpec } from '../../tools/printablePaper';

describe('paperSpec', () => {
  it('lined 8mm -> 33 lines per page', () => {
    const s = paperSpec('lined', 8, 1);
    expect(s.rowsPerPage).toBe(33);
    expect(s.colsPerPage).toBe(22);
    expect(s.pages).toBe(1);
  });
  it('throws on spacing outside 4-20mm or pages outside 1-50', () => {
    expect(() => paperSpec('lined', 3, 1)).toThrow();
    expect(() => paperSpec('lined', 8, 0)).toThrow();
    expect(() => paperSpec('lined', 8, 51)).toThrow();
  });
});
