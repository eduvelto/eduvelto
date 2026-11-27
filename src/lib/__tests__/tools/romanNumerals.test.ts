import { describe, it, expect } from 'vitest';
import { toRoman, fromRoman } from '../../tools/romanNumerals';

describe('romanNumerals', () => {
  it.each([[1, 'I'], [4, 'IV'], [9, 'IX'], [58, 'LVIII'], [1994, 'MCMXCIV'], [3999, 'MMMCMXCIX']])(
    '%s -> %s', (n, roman) => {
      expect(toRoman(n)).toBe(roman);
      expect(fromRoman(roman)).toBe(n);
    },
  );
  it('rejects out-of-range and invalid input', () => {
    expect(() => toRoman(0)).toThrow('1 to 3999');
    expect(() => toRoman(4000)).toThrow('1 to 3999');
    expect(() => fromRoman('IIII')).toThrow('Not a valid Roman numeral');
  });
});
