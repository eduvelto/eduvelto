import { describe, it, expect } from 'vitest';
import { countText, convertCase, dedupeLines, removeExtraSpaces, findAndReplace, reverseText } from '../../tools/textUtils';

describe('countText', () => {
  it('counts words, characters and reading time', () => {
    const c = countText('Hello world. This is a test.');
    expect(c.words).toBe(6);
    expect(c.characters).toBe(28);
    expect(c.sentences).toBe(2);
    expect(c.readingSeconds).toBe(2);
  });
  it('returns zeros for empty text', () => {
    expect(countText('').words).toBe(0);
    expect(countText('   ').words).toBe(0);
  });
});

describe('convertCase', () => {
  it('upper / lower / title / sentence', () => {
    expect(convertCase('hello world', 'upper')).toBe('HELLO WORLD');
    expect(convertCase('HELLO WORLD', 'lower')).toBe('hello world');
    expect(convertCase('hello world', 'title')).toBe('Hello World');
    expect(convertCase('hello. world', 'sentence')).toBe('Hello. World');
  });
  it('camel / snake / kebab', () => {
    expect(convertCase('hello world test', 'camel')).toBe('helloWorldTest');
    expect(convertCase('hello world test', 'snake')).toBe('hello_world_test');
    expect(convertCase('hello world test', 'kebab')).toBe('hello-world-test');
  });
  it('toggles case', () => {
    expect(convertCase('AbC', 'toggle')).toBe('aBc');
  });
});

describe('dedupeLines', () => {
  it('removes repeated lines and reports counts', () => {
    const r = dedupeLines('a\nb\na\nc\nb');
    expect(r.result).toBe('a\nb\nc');
    expect(r.removed).toBe(2);
    expect(r.uniqueCount).toBe(3);
  });
  it('sorts when asked', () => {
    expect(dedupeLines('b\na\nb', { sort: true }).result).toBe('a\nb');
  });
});

describe('removeExtraSpaces', () => {
  it('collapses spaces and trims lines', () => {
    expect(removeExtraSpaces('hello   world \n\n  foo  ')).toBe('hello world\n\nfoo');
  });
  it('removes blank lines when asked', () => {
    expect(removeExtraSpaces('a\n\nb', true)).toBe('a\nb');
  });
});

describe('findAndReplace', () => {
  it('replaces all occurrences and counts them', () => {
    const r = findAndReplace('cat and cat', 'cat', 'dog');
    expect(r.result).toBe('dog and dog');
    expect(r.count).toBe(2);
  });
  it('throws a clear error for an invalid regex', () => {
    expect(() => findAndReplace('x', '(', 'y', { useRegex: true })).toThrow('Invalid regular expression');
  });
});

describe('reverseText', () => {
  it('reverses characters, words and lines', () => {
    expect(reverseText('abc', 'characters')).toBe('cba');
    expect(reverseText('one two three', 'words')).toBe('three two one');
    expect(reverseText('a\nb\nc', 'lines')).toBe('c\nb\na');
  });
});
