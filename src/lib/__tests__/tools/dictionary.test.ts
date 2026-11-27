// Dictionary (Bangla–English) — unit tests.
import { describe, it, expect } from 'vitest';
import { DICTIONARY_ENTRIES, searchDictionary } from '../../tools/dictionary';

describe('searchDictionary', () => {
  it('finds a known word in English', () => {
    const results = searchDictionary('book');
    expect(results).toContainEqual({ en: 'book', bn: 'বই' });
  });

  it('finds a known word in Bangla', () => {
    const results = searchDictionary('বই');
    expect(results).toContainEqual({ en: 'book', bn: 'বই' });
  });

  it('looks up words in both directions', () => {
    expect(searchDictionary('water')).toContainEqual({ en: 'water', bn: 'পানি' });
    expect(searchDictionary('পানি')).toContainEqual({ en: 'water', bn: 'পানি' });
    expect(searchDictionary('teacher')).toContainEqual({ en: 'teacher', bn: 'শিক্ষক' });
    expect(searchDictionary('শিক্ষক')).toContainEqual({ en: 'teacher', bn: 'শিক্ষক' });
  });

  it('returns exact matches before prefix matches', () => {
    // 'book' is exact; no other entry starts with 'book', so it is first.
    const results = searchDictionary('book');
    expect(results[0]).toEqual({ en: 'book', bn: 'বই' });
    // 'b' matches many entries by prefix; 'bad'/'big'/'bird'/'book' are among them.
    const bResults = searchDictionary('b');
    expect(bResults.length).toBeGreaterThan(3);
    expect(bResults.map((e) => e.en)).toContain('book');
  });

  it('prefix search works in Bangla too', () => {
    const results = searchDictionary('ব');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((e) => e.bn.startsWith('ব') || e.en.startsWith('ব'))).toBe(true);
  });

  it('an unknown word returns no results', () => {
    expect(searchDictionary('zebra')).toEqual([]);
    expect(searchDictionary('অজানাশব্দ')).toEqual([]);
  });

  it('empty or blank query returns no results', () => {
    expect(searchDictionary('')).toEqual([]);
    expect(searchDictionary('   ')).toEqual([]);
  });

  it('the built-in list has a useful size', () => {
    expect(DICTIONARY_ENTRIES.length).toBeGreaterThanOrEqual(60);
  });
});
