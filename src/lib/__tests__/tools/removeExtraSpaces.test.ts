import { describe, it, expect } from 'vitest';
import { cleanExtraSpaces } from '../../tools/removeExtraSpaces';

describe('removeExtraSpaces', () => {
  it('cleans double spaces', () => {
    expect(cleanExtraSpaces('a   b')).toBe('a b');
  });
});
