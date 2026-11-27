// Daily Hadith — unit tests.
// Every hadith must carry a cited source collection; the deck must
// stay modest (30) with no duplicate text.
import { describe, it, expect } from 'vitest';
import { HADITHS, hadithForDate, hadithByIndex } from '../../tools/hadiths';

describe('HADITHS deck', () => {
  it('has 30 hadiths, each with Bengali + English text and a cited source', () => {
    expect(HADITHS).toHaveLength(30);
    for (const h of HADITHS) {
      expect(h.textBn.trim()).not.toBe('');
      expect(h.textEn.trim()).not.toBe('');
      expect(h.source.trim()).not.toBe('');
      expect(h.source).toMatch(/Bukhari|Muslim|Tirmidhi|Ibn Majah/);
      expect(h.topicBn.trim()).not.toBe('');
    }
  });

  it('has no duplicate Bengali text', () => {
    const texts = HADITHS.map((h) => h.textBn);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('includes the intentions hadith from Sahih al-Bukhari 1', () => {
    expect(HADITHS[0].source).toContain('Bukhari 1');
    expect(HADITHS[0].textBn).toContain('নিয়ত');
  });
});

describe('hadithForDate', () => {
  it('is deterministic and cycles every 30 days', () => {
    const a = hadithForDate(new Date(2026, 10, 27));
    expect(a).toBe(hadithForDate(new Date(2026, 10, 27)));
    expect(hadithForDate(new Date(2026, 11, 27))).toBe(a);
  });

  it('hadithByIndex rejects out-of-range indexes', () => {
    expect(hadithByIndex(-1)).toBeUndefined();
    expect(hadithByIndex(30)).toBeUndefined();
    expect(hadithByIndex(0)).toBe(HADITHS[0]);
  });
});
