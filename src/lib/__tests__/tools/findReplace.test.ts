import { describe, it, expect } from 'vitest';
import { findReplace } from '../../tools/findReplace';

describe('findReplace', () => {
  it('replaces and counts', () => {
    expect(findReplace('aa bb aa', 'aa', 'cc')).toEqual({ result: 'cc bb cc', count: 2 });
  });
});
