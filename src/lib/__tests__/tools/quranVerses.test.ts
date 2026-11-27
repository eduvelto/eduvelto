// Daily Quran Verse — unit tests.
// The deck must stay modest, unique by reference, and complete:
// every verse has Arabic text, a reference, and a Bengali meaning.
import { describe, it, expect } from 'vitest';
import { QURAN_VERSES, verseForDate, verseByIndex, dayOfYear } from '../../tools/quranVerses';

describe('QURAN_VERSES deck', () => {
  it('has 30 verses, each with Arabic, reference and Bengali meaning', () => {
    expect(QURAN_VERSES).toHaveLength(30);
    for (const v of QURAN_VERSES) {
      expect(v.arabic.trim()).not.toBe('');
      expect(v.reference).toMatch(/^\d+:\d+(-\d+)?$/);
      expect(v.meaningBn.trim()).not.toBe('');
      expect(v.meaningEn.trim()).not.toBe('');
      expect(v.surahEn.trim()).not.toBe('');
    }
  });

  it('has no duplicate references', () => {
    const refs = QURAN_VERSES.map((v) => v.reference);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('includes Al-Fatiha 1:1, Ayat al-Kursi 2:255 and Surah Al-Ikhlas', () => {
    const refs = QURAN_VERSES.map((v) => v.reference);
    expect(refs).toContain('1:1');
    expect(refs).toContain('2:255');
    expect(refs).toContain('112:1');
    expect(refs).toContain('112:4');
  });
});

describe('verseForDate', () => {
  it('is deterministic for the same date and cycles every 30 days', () => {
    const a = verseForDate(new Date(2026, 10, 27));
    const b = verseForDate(new Date(2026, 10, 27));
    expect(a).toBe(b);
    const aPlus30 = verseForDate(new Date(2026, 11, 27));
    expect(aPlus30).toBe(a);
  });

  it('dayOfYear is 1 on 1 January', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
  });

  it('verseByIndex rejects out-of-range indexes', () => {
    expect(verseByIndex(-1)).toBeUndefined();
    expect(verseByIndex(30)).toBeUndefined();
    expect(verseByIndex(0)).toBe(QURAN_VERSES[0]);
  });
});
