import { describe, it, expect } from 'vitest';
import { reverseTextContent } from '../../tools/reverseText';

describe('reverseText', () => {
  it('reverses characters', () => {
    expect(reverseTextContent('abc', 'characters')).toBe('cba');
  });
});
