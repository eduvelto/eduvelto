import { describe, it, expect } from 'vitest';
import { lineDiff } from '../../tools/textDiff';

describe('lineDiff', () => {
  it('finds added and removed lines', () => {
    const r = lineDiff('a\nb\nc', 'a\nx\nc\nd');
    expect(r.added).toBe(2);
    expect(r.removed).toBe(1);
    expect(r.unchanged).toBe(2);
    expect(r.ops.map((o) => o.type)).toEqual(['same', 'remove', 'add', 'same', 'add']);
  });
  it('identical texts have no changes', () => {
    const r = lineDiff('a\nb', 'a\nb');
    expect(r.added).toBe(0);
    expect(r.removed).toBe(0);
  });
});
