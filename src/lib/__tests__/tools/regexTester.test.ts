import { describe, it, expect } from 'vitest';
import { testRegex, replaceWithRegex } from '../../tools/regexTester';

describe('testRegex', () => {
  it('finds matches with groups', () => {
    const r = testRegex('(\\d+)-(\\d+)', 'g', 'call 017-1234 and 019-9999');
    expect(r.valid).toBe(true);
    expect(r.total).toBe(2);
    expect(r.matches[0].groups).toEqual(['017', '1234']);
  });
  it('reports an invalid pattern clearly', () => {
    const r = testRegex('(', 'g', 'text');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });
  it('replaces with regex', () => {
    expect(replaceWithRegex('\\d+', 'g', 'a1 b2', '#').result).toBe('a# b#');
  });
});
