import { describe, it, expect } from 'vitest';
import { convertTextCase, CASE_MODES } from '../../tools/textCase';

describe('textCase', () => {
  it('converts to upper case', () => {
    expect(convertTextCase('hello', 'upper')).toBe('HELLO');
  });
  it('offers 9 case modes', () => {
    expect(CASE_MODES).toHaveLength(9);
  });
});
