import { describe, it, expect } from 'vitest';
import { buildMeritSheet } from '../../tools/meritRank';

describe('buildMeritSheet', () => {
  it('ranks, finds the topper and summarises', () => {
    const sheet = buildMeritSheet('Rahim, 85, 72\nKarim, 90, 88\nSalma, 28, 81');
    expect(sheet.topper?.name).toBe('Karim');
    expect(sheet.ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(sheet.summary).toEqual({ total: 3, passed: 2, failed: 1, passRate: 66.7 });
  });
});
