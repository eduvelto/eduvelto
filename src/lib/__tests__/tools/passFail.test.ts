import { describe, it, expect } from 'vitest';
import { analyzePassFail } from '../../tools/passFail';

describe('analyzePassFail', () => {
  it('splits pass/fail and reports the pass rate', () => {
    const r = analyzePassFail('Rahim, 85, 72\nSalma, 28, 81\nKarim, 90, 88');
    expect(r.passed.map((s) => s.name)).toEqual(['Karim', 'Rahim']);
    expect(r.failed.map((s) => s.name)).toEqual(['Salma']);
    expect(r.summary).toEqual({ total: 3, passed: 2, failed: 1, passRate: 66.7 });
  });
});
