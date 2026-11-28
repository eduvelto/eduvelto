// Eduvelto — phased 8-language dictionary tests (28 Nov 2026).
//
// The phased dictionary (src/i18n/phasedStrings.ts) translates short UI
// strings for hi/ar/es/pt/fr/id by exact English key. A miss falls back
// to English, then Bangla — never a raw key, never blank. These tests
// pin the dictionary's shape: identical key sets across all six
// languages, no empty strings, and the fallback chain.
import { describe, expect, it } from 'vitest';
import { PHASED_LANGS, PHASED_STRINGS, isPhasedLang, phasedString } from '../phasedStrings';

describe('phasedStrings — 6-language UI dictionary (28 Nov 2026)', () => {
  it('covers exactly the six new languages', () => {
    expect([...PHASED_LANGS]).toEqual(['hi', 'ar', 'es', 'pt', 'fr', 'id']);
    for (const lang of PHASED_LANGS) {
      expect(isPhasedLang(lang)).toBe(true);
    }
    expect(isPhasedLang('bn')).toBe(false);
    expect(isPhasedLang('en')).toBe(false);
    expect(isPhasedLang('de')).toBe(false);
    expect(isPhasedLang('ja')).toBe(false);
    expect(isPhasedLang('ko')).toBe(false);
  });

  it('has identical key sets in all six languages (216 keys)', () => {
    const keySets = PHASED_LANGS.map((lang) => Object.keys(PHASED_STRINGS[lang]).sort());
    expect(keySets[0].length).toBe(216);
    for (const keys of keySets.slice(1)) {
      expect(keys).toEqual(keySets[0]);
    }
  });

  it('has no empty or blank translations', () => {
    for (const lang of PHASED_LANGS) {
      for (const [key, value] of Object.entries(PHASED_STRINGS[lang])) {
        expect(value.trim().length, `${lang} — ${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('translates a known key in every language', () => {
    expect(phasedString('hi', 'Home', 'হোম')).toBe('होम');
    expect(phasedString('ar', 'Home', 'হোম')).toBe('الرئيسية');
    expect(phasedString('es', 'Home', 'হোম')).toBe('Inicio');
    expect(phasedString('pt', 'Home', 'হোম')).toBe('Início');
    expect(phasedString('fr', 'Home', 'হোম')).toBe('Accueil');
    expect(phasedString('id', 'Home', 'হোম')).toBe('Beranda');
  });

  it('falls back to English for an unknown key, then Bangla when English is empty', () => {
    expect(phasedString('hi', 'Not in the dictionary', 'হোম')).toBe('Not in the dictionary');
    expect(phasedString('ar', '', 'শুধু বাংলা')).toBe('শুধু বাংলা');
    expect(phasedString('es', 'Tools', 'টুলস')).toBe('Herramientas');
  });

  it('bn/en pass through unchanged (the dictionary is only for the six new languages)', () => {
    expect(phasedString('bn', 'Home', 'হোম')).toBe('হোম');
    expect(phasedString('en', 'Home', 'হোম')).toBe('Home');
  });
});
