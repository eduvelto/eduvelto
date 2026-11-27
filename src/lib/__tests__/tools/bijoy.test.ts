// Bijoy <-> Unicode converters (Tools #71, #72) — unit tests.
//
// Expected values are the published examples from the Bijoy reference
// implementation (bijoy-unicode-converter, MIT) and the public Bijoy
// converter guides: `Avwg` = আমি, `evsjv` = বাংলা, `wk¶K` = শিক্ষক,
// `Kg©` = কর্ম, `‡Kv_vq` = কোথায়, `cÖ_g` = প্রথম, `K„lK` = কৃষক,
// `w¯’wZ` = স্থিতি, `wb‡` + backtick + `©k` = নির্দেশ.
//
// NOTE on নুক্তা letters: the reference outputs PRECOMPOSED code points
// (ড় U+09DC, ঢ় U+09DD, য় U+09DF). Expectations below spell those out
// with \u escapes so the test cannot pass by accident on the visually
// identical decomposed form (letter + U+09BC nukta).
import { describe, it, expect } from 'vitest';
import { bijoyToUnicode, unicodeToBijoy } from '../../tools/bijoy';

// Precomposed য় is U+09DF. Wherever an expected value contains য় it is
// spelled out with the '\u09DF' escape, because a literal য় typed in
// source can silently be the decomposed form (য + U+09BC nukta), which
// looks identical but is a different string.
describe('bijoyToUnicode', () => {
  it.each([
    ['Avwg', 'আমি'],
    ['evsjv', 'বাংলা'],
    ['wk¶K', 'শিক্ষক'],
    ['Kg©', 'কর্ম'],
    ['cÖ_g', 'প্রথম'],
    ['K„lK', 'কৃষক'],
    ['w¯’wZ', 'স্থিতি'],
    ['Mvb', 'গান'],
    ['Avwg evsjvq Mvb MvB', 'আমি বাংলা' + '\u09DF' + ' গান গাই'],
  ])('converts %s -> %s', (bijoy, unicode) => {
    expect(bijoyToUnicode(bijoy)).toBe(unicode);
  });

  it('converts কোথায় with precomposed য় (U+09DF)', () => {
    expect(bijoyToUnicode('‡Kv_vq')).toBe('কোথা' + '\u09DF');
    expect([...bijoyToUnicode('‡Kv_vq')].pop()).toBe('\u09DF');
  });

  it('converts নির্দেশ (i-kar + e-kar + reph all move)', () => {
    // Bijoy: w=ি, b=ন, ‡=ে, `=দ, ©=reph, k=শ.
    expect(bijoyToUnicode('wb‡`©k')).toBe('নির্দেশ');
  });

  it('converts the reference package\u2019s own example sentence', () => {
    const bijoy =
      'm~‡h©i DbœwZ †KvY  n‡j,  wgUvi ˆ`‡N©¨i GKwU LyuwUi Qvqvi ˆ`N©¨ KZ n‡e?';
    expect(bijoyToUnicode(bijoy)).toBe(
      'সূর্যের উন্নতি কোণ  হলে,  মিটার দৈর্ঘ্যরে একটি খুঁটির ছা' +
        '\u09DF' +
        'ার দৈর্ঘ্য কত হবে?',
    );
  });

  it('converts digits: 2026 -> ২০২৬', () => {
    expect(bijoyToUnicode('2026')).toBe('২০২৬');
  });

  it('leaves digits alone when convertDigits is false', () => {
    expect(bijoyToUnicode('2026', { convertDigits: false })).toBe('2026');
  });

  it('leaves unmapped characters unchanged, never drops them', () => {
    // ! @ # $ % ^ * ( ) and friends have no Bijoy mapping (verified
    // against the table); mapped letters around them still convert.
    expect(bijoyToUnicode('!@#$% ^*()')).toBe('!@#$% ^*()');
    expect(bijoyToUnicode('K!e?')).toBe('ক!ব?');
    expect(bijoyToUnicode('.,;:?')).toBe('.,;:?');
  });

  it('maps & to the hasant ্ (it is a real Bijoy glyph, not punctuation)', () => {
    expect(bijoyToUnicode('K&')).toBe('ক্');
  });

  it('rejects a non-string input', () => {
    expect(() => bijoyToUnicode(42 as unknown as string)).toThrow(/must be a string/);
  });
});

describe('unicodeToBijoy', () => {
  it.each([
    ['আমি', 'Avwg'],
    ['বাংলা', 'evsjv'],
    ['শিক্ষক', 'wk¶K'],
    ['কর্ম', 'Kg©'],
    ['স্থিতি', 'w¯’wZ'],
    ['গান', 'Mvb'],
    ['আমি বাংলা' + '\u09DF' + ' গান গাই', 'Avwg evsjvq Mvb MvB'],
  ])('converts %s -> %s', (unicode, bijoy) => {
    expect(unicodeToBijoy(unicode)).toBe(bijoy);
  });

  it('converts নির্দেশ (reph + pre-kars move to Bijoy order)', () => {
    expect(unicodeToBijoy('নির্দেশ')).toBe('wb‡`©k');
  });

  it('converts digits back: ২০২৬ -> 2026', () => {
    expect(unicodeToBijoy('২০২৬')).toBe('2026');
  });

  it('leaves digits alone when convertDigits is false', () => {
    expect(unicodeToBijoy('২০২৬', { convertDigits: false })).toBe('২০২৬');
  });

  it('leaves unmapped characters unchanged, never drops them', () => {
    expect(unicodeToBijoy('.,;:?')).toBe('.,;:?');
    expect(unicodeToBijoy('Hello')).toBe('Hello');
  });

  it('rejects a non-string input', () => {
    expect(() => unicodeToBijoy(42 as unknown as string)).toThrow(/must be a string/);
  });
});

describe('round-trips (Bijoy -> Unicode -> Bijoy)', () => {
  it.each([
    'Avwg',
    'evsjv',
    'wk¶K',
    'Kg©',
    'w¯’wZ',
    'wb‡`©k',
    'Mvb',
    'Avwg evsjvq Mvb MvB',
  ])('round-trips %s exactly', (bijoy) => {
    expect(unicodeToBijoy(bijoyToUnicode(bijoy))).toBe(bijoy);
  });

  it('round-trips through Unicode for প্রথম and কৃষক (canonical-glyph form)', () => {
    // ্র has three Bijoy glyphs (Ö, ª, «) and ৃ has two („, …); the
    // reverse direction emits the table's canonical glyph (« and …), so
    // the round-trip lands on the canonical form, not the original glyph.
    // What must hold: forward(reverse(x)) == x for the Unicode text.
    expect(bijoyToUnicode(unicodeToBijoy('প্রথম'))).toBe('প্রথম');
    expect(bijoyToUnicode(unicodeToBijoy('কৃষক'))).toBe('কৃষক');
    expect(unicodeToBijoy('প্রথম')).toBe('c«_g');
    expect(unicodeToBijoy('কৃষক')).toBe('K…lK');
  });
});
