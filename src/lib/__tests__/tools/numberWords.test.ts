import { describe, it, expect } from 'vitest';
import { numberToEnglishWords, numberToBanglaWords, parseNumberInput } from '../../tools/numberWords';

describe('numberToEnglishWords', () => {
  it.each([
    [0, 'zero'], [5, 'five'], [21, 'twenty-one'], [100, 'one hundred'],
    [1000, 'one thousand'], [123456, 'one hundred twenty-three thousand four hundred fifty-six'],
    [1000000, 'one million'], [-7, 'negative seven'],
  ])('%s -> %s', (n, words) => {
    expect(numberToEnglishWords(n)).toBe(words);
  });
});

describe('numberToBanglaWords', () => {
  it.each([
    [0, 'শূন্য'], [5, 'পাঁচ'], [21, 'একুশ'], [100, 'এক শত'],
    [1000, 'এক হাজার'], [100000, 'এক লক্ষ'], [10000000, 'এক কোটি'],
    [123, 'এক শত তেইশ'],
  ])('%s -> %s', (n, words) => {
    expect(numberToBanglaWords(n)).toBe(words);
  });
});

describe('parseNumberInput', () => {
  it('accepts commas and Bangla digits', () => {
    expect(parseNumberInput('1,234')).toBe(1234);
    expect(parseNumberInput('১২৩')).toBe(123);
    expect(parseNumberInput('abc')).toBeNull();
  });
});
