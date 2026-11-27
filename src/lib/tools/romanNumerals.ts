/**
 * Roman Numeral Converter — pure functions. Range 1–3999 (standard
 * Roman numerals); outside that range an error is thrown, not guessed.
 */
const ROMAN_TABLE: Array<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new Error('Roman numerals cover whole numbers from 1 to 3999 only.');
  }
  let rest = value;
  let out = '';
  for (const [num, symbol] of ROMAN_TABLE) {
    while (rest >= num) { out += symbol; rest -= num; }
  }
  return out;
}

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

export function fromRoman(input: string): number {
  const roman = input.trim().toUpperCase();
  if (!/^(M{0,3})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(roman) || roman === '') {
    throw new Error('Not a valid Roman numeral (use I, V, X, L, C, D, M in the standard order).');
  }
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = ROMAN_VALUES[roman[i]];
    const next = ROMAN_VALUES[roman[i + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

export function isValidRoman(input: string): boolean {
  try { fromRoman(input); return true; } catch { return false; }
}
