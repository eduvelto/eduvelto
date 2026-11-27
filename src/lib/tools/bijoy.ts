/**
 * Bijoy <-> Unicode Bengali converters — pure logic (Tools #71, #72).
 *
 * Converts the classic Bijoy (SutonnyMJ) ASCII encoding — the text you get
 * when you copy Bangla out of an old Word/PDF file without the SutonnyMJ
 * font, e.g. `evsjv` (= বাংলা), `Avwg` (= আমি) — to real Unicode Bengali
 * and back. No network, no storage, no DOM; the mapping tables live in
 * `./bijoyMaps` (MIT-licensed reference data, attributed there).
 *
 * How Bijoy differs from Unicode (and why conversion needs reordering):
 * - The pre-posed vowel signs ি / ে / ৈ are typed BEFORE the consonant in
 *   Bijoy (`wK` = কি) but stored AFTER it in Unicode.
 * - ো / ৌ are split in Bijoy: `‡` in front, `v` (া) / `Š` (ৗ) behind.
 * - Reph (র্) is typed AFTER its consonant in Bijoy (`Kg©` = কর্ম) but
 *   stored BEFORE it in Unicode.
 * - Many conjuncts are single Bijoy glyphs (¶ = ক্ষ, Î = ত্র, Á = জ্ঞ).
 *
 * Unmapped characters are left unchanged, never dropped.
 * ASCII digits convert to Bengali digits (0 -> ০) unless
 * `convertDigits: false` is passed.
 */

import { BIJOY_TO_UNICODE_ENTRIES, UNICODE_TO_BIJOY_ENTRIES } from './bijoyMaps';

export interface BijoyConvertOptions {
  /** Convert ASCII digits to Bengali digits (forward) and back (reverse). Default true. */
  convertDigits?: boolean;
}

const HALANT = '্';
const REPH_LETTER = 'র';
const CHANDRABINDU = 'ঁ';

const PRE_KARS = new Set(['ি', 'ৈ', 'ে']);
const POST_KARS = new Set(['া', 'ো', 'ৌ', 'ৗ', 'ু', 'ূ', 'ী', 'ৃ']);
const KARS = new Set([...PRE_KARS, ...POST_KARS]);
/** ং / ঃ / ঁ — treated as nukta by the classic reorder algorithm. */
const NUKTAS = new Set(['ং', 'ঃ', 'ঁ']);
const CONSONANTS = new Set([
  'ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ',
  'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন',
  'প', 'ফ', 'ব', 'ভ', 'ম', 'শ', 'ষ', 'স', 'হ', 'য',
  'র', 'ল', 'য়', 'ং', 'ঃ', 'ঁ', 'ৎ',
]);

const isPreKar = (ch: string | undefined): boolean => ch !== undefined && PRE_KARS.has(ch);
const isPostKar = (ch: string | undefined): boolean => ch !== undefined && POST_KARS.has(ch);
const isKar = (ch: string | undefined): boolean => ch !== undefined && KARS.has(ch);
const isNukta = (ch: string | undefined): boolean => ch !== undefined && NUKTAS.has(ch);
const isConsonant = (ch: string | undefined): boolean =>
  ch !== undefined && CONSONANTS.has(ch);
const isHalant = (ch: string | undefined): boolean => ch === HALANT;
const isSpace = (ch: string | undefined): boolean =>
  ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

function buildLookup(
  entries: ReadonlyArray<readonly [string, string]>,
): { map: Map<string, string>; maxKeyLength: number } {
  const map = new Map<string, string>();
  let maxKeyLength = 0;
  for (const [key, value] of entries) {
    if (!map.has(key)) map.set(key, value);
    if (key.length > maxKeyLength) maxKeyLength = key.length;
  }
  return { map, maxKeyLength };
}

const BIJOY_TO_UNICODE = buildLookup(BIJOY_TO_UNICODE_ENTRIES);
const UNICODE_TO_BIJOY = buildLookup(UNICODE_TO_BIJOY_ENTRIES);

const ASCII_DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const BENGALI_DIGITS = new Set(['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']);

/**
 * Longest-match tokeniser over a lookup table. Characters with no mapping
 * pass through unchanged. Longest match matters: e.g. `K¡` must become ক্ব,
 * not ক + ¡, and `চ্ছ্ব` must stay one conjunct.
 */
function tokenise(
  input: string,
  lookup: { map: Map<string, string>; maxKeyLength: number },
  skipDigits: boolean,
  digitSet: ReadonlySet<string>,
): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    let matched = false;
    const maxLen = Math.min(lookup.maxKeyLength, input.length - i);
    for (let len = maxLen; len >= 1; len--) {
      const piece = input.slice(i, i + len);
      if (skipDigits && len === 1 && digitSet.has(piece)) break;
      const mapped = lookup.map.get(piece);
      if (mapped !== undefined) {
        out += mapped;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += input[i];
      i += 1;
    }
  }
  return out;
}

/**
 * Reorder pass for Bijoy -> Unicode: moves pre-posed vowel signs after
 * their consonant cluster, joins split ো / ৌ, and moves a trailing reph
 * (র্) in front of its cluster. Follows the classic reorder rules.
 */
function rearrangeBijoyToUnicode(text: string): string {
  let a = [...text];
  for (let i = 0; i < a.length; i++) {
    // Rule A: kar + halant + next -> halant + next + kar.
    if (
      i > 0 &&
      isHalant(a[i]) &&
      (isKar(a[i - 1]) || isNukta(a[i - 1])) &&
      i < a.length - 1
    ) {
      a = [...a.slice(0, i - 1), a[i], a[i + 1], a[i - 1], ...a.slice(i + 2)];
    }
    // Rule B: র + halant + kar -> kar + র + halant.
    if (
      i > 0 &&
      i < a.length - 1 &&
      isHalant(a[i]) &&
      a[i - 1] === REPH_LETTER &&
      !isHalant(a[i - 2]) &&
      isKar(a[i + 1])
    ) {
      a = [...a.slice(0, i - 1), a[i + 1], a[i - 1], a[i], ...a.slice(i + 2)];
    }
    // Rule C: reph — র + halant after a cluster moves in front of it.
    if (i < a.length - 1 && a[i] === REPH_LETTER && isHalant(a[i + 1]) && !isHalant(a[i - 1])) {
      let j = 1;
      while (true) {
        if (i - j < 0) break;
        if (isConsonant(a[i - j]) && isHalant(a[i - j - 1])) j += 2;
        else if (j === 1 && isKar(a[i - j])) j += 1;
        else break;
      }
      a = [
        ...a.slice(0, i - j),
        a[i],
        a[i + 1],
        ...a.slice(i - j, i),
        ...a.slice(i + 2),
      ];
      i += 1;
      continue;
    }
    // Rule D: pre-posed kar moves after the following consonant cluster;
    // ে + া joins into ো, ে + ৗ joins into ৌ.
    if (i < a.length - 1 && isPreKar(a[i]) && !isSpace(a[i + 1])) {
      let j = 1;
      while (isConsonant(a[i + j])) {
        if (isHalant(a[i + j + 1])) j += 2;
        else break;
      }
      let joined = a[i];
      let extra = 0;
      if (a[i] === 'ে' && a[i + j + 1] === 'া') {
        joined = 'ো';
        extra = 1;
      } else if (a[i] === 'ে' && a[i + j + 1] === 'ৗ') {
        joined = 'ৌ';
        extra = 1;
      }
      a = [
        ...a.slice(0, i),
        ...a.slice(i + 1, i + j + 1),
        joined,
        ...a.slice(i + j + extra + 1),
      ];
      i += j;
    }
    // Rule E: চন্দ্রবিন্দু before a post-kar swaps places with it.
    if (i < a.length - 1 && a[i] === CHANDRABINDU && isPostKar(a[i + 1])) {
      a = [...a.slice(0, i), a[i + 1], a[i], ...a.slice(i + 2)];
    }
  }
  return a.join('');
}

/**
 * Reorder pass for Unicode -> Bijoy: moves pre-posed vowel signs before
 * their consonant cluster, and moves a leading reph (র্) after its
 * cluster. Follows the classic reorder rules.
 */
function rearrangeUnicodeToBijoy(text: string): string {
  let a = [...text];
  let barrier = 0;
  for (let i = 0; i < a.length; i++) {
    // Rule A: a pre-kar moves before the consonant cluster in front of it.
    if (i < a.length && isPreKar(a[i])) {
      let j = 1;
      while (isConsonant(a[i - j])) {
        if (i - j < 0) break;
        if (i - j <= barrier) break;
        if (isHalant(a[i - j - 1])) j += 2;
        else break;
      }
      a = [...a.slice(0, i - j), a[i], ...a.slice(i - j, i), ...a.slice(i + 1)];
      barrier = i + 1;
      continue;
    }
    // Rule B: র + halant moves after the consonant cluster behind it.
    if (i < a.length - 1 && isHalant(a[i]) && a[i - 1] === REPH_LETTER && !isHalant(a[i - 2])) {
      let j = 1;
      let foundPreKar = 0;
      while (true) {
        if (isConsonant(a[i + j]) && isHalant(a[i + j + 1])) j += 2;
        else if (isConsonant(a[i + j]) && isPreKar(a[i + j + 1])) {
          foundPreKar = 1;
          break;
        } else break;
      }
      a = [
        ...a.slice(0, i - 1),
        ...a.slice(i + j + 1, i + j + foundPreKar + 1),
        ...a.slice(i + 1, i + j + 1),
        a[i - 1],
        a[i],
        ...a.slice(i + j + foundPreKar + 1),
      ];
      i += j + foundPreKar;
      barrier = i + 1;
      continue;
    }
  }
  return a.join('');
}

/**
 * Convert Bijoy (SutonnyMJ) ASCII text to Unicode Bengali.
 *
 * Verified examples: `Avwg` -> আমি, `evsjv` -> বাংলা, `wk¶K` -> শিক্ষক,
 * `Kg©` -> কর্ম, `‡Kv_vq` -> কোথায়, `cÖ_g` -> প্রথম, `K„lK` -> কৃষক,
 * `w¯’wZ` -> স্থিতি, `wb‡` + backtick + `©k` -> নির্দেশ (see tests).
 */
export function bijoyToUnicode(input: string, options?: BijoyConvertOptions): string {
  if (typeof input !== 'string') throw new Error('bijoyToUnicode input must be a string');
  const convertDigits = options?.convertDigits ?? true;
  const mapped = tokenise(input, BIJOY_TO_UNICODE, !convertDigits, ASCII_DIGITS);
  const reordered = rearrangeBijoyToUnicode(mapped);
  // Safety net: অ followed by া is আ (the table's `Av` entry normally
  // covers this, but a split replacement can still produce অা).
  return reordered.replace(/অা/g, 'আ');
}

/**
 * Convert Unicode Bengali to Bijoy (SutonnyMJ) ASCII text.
 *
 * Verified examples: আমি -> `Avwg`, বাংলা -> `evsjv`, শিক্ষক -> `wk¶K`,
 * কর্ম -> `Kg©`, স্থিতি -> `w¯’wZ`, নির্দেশ -> `wb‡` + backtick + `©k` (see tests).
 * Some characters have several Bijoy glyphs (e.g. ্র is Ö, ª and «);
 * the reverse direction always emits the table's canonical glyph, so a
 * round-trip may legitimately return a different-but-equal glyph.
 */
export function unicodeToBijoy(input: string, options?: BijoyConvertOptions): string {
  if (typeof input !== 'string') throw new Error('unicodeToBijoy input must be a string');
  const convertDigits = options?.convertDigits ?? true;
  // Split ো / ৌ into their two Bijoy halves before reordering.
  const split = input.replace(/ো/g, 'ো').replace(/ৌ/g, 'ৌ');
  const reordered = rearrangeUnicodeToBijoy(split);
  return tokenise(reordered, UNICODE_TO_BIJOY, !convertDigits, BENGALI_DIGITS);
}
