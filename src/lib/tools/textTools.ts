// Eduvelto — Text batch engine (27 Nov 2026).
// Pure functions for all 24 text/writing tools. No React, no network.
// Invalid input returns null (never throws on user input).

import { RANDOM_WORDS, ANAGRAM_WORDS, type RandomWord } from './textWordList';

export type { RandomWord };

// ---------------------------------------------------------------------------
// Random Word Generator
// ---------------------------------------------------------------------------

export function pickRandomWords(count: number, random: () => number = Math.random): RandomWord[] {
  if (!Number.isFinite(count) || count < 1) return [];
  const n = Math.min(Math.floor(count), 20);
  const pool = [...RANDOM_WORDS];
  const out: RandomWord[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Zalgo / Glitch Text Generator
// ---------------------------------------------------------------------------

const ZALGO_UP = ['\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0313', '\u0314', '\u0315', '\u031a', '\u031b', '\u034f', '\u035a', '\u035b', '\u035c', '\u035d', '\u035e', '\u035f', '\u0360', '\u0361', '\u0362'];
const ZALGO_MID = ['\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327', '\u0328', '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e', '\u0360', '\u0361'];
const ZALGO_DOWN = ['\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333'];

export type ZalgoIntensity = 'light' | 'medium' | 'heavy';

const ZALGO_COUNTS: Record<ZalgoIntensity, { up: number; mid: number; down: number }> = {
  light: { up: 1, mid: 0, down: 1 },
  medium: { up: 2, mid: 1, down: 2 },
  heavy: { up: 4, mid: 2, down: 4 },
};

/** Deterministic decoration (index-based) so output is stable and testable. */
export function zalgoText(text: string, intensity: ZalgoIntensity = 'medium'): string {
  if (text === '') return '';
  const counts = ZALGO_COUNTS[intensity] ?? ZALGO_COUNTS.medium;
  let out = '';
  let idx = 0;
  for (const ch of text) {
    out += ch;
    if (ch === ' ') continue;
    for (let k = 0; k < counts.up; k++) out += ZALGO_UP[(idx * 7 + k * 3) % ZALGO_UP.length];
    for (let k = 0; k < counts.mid; k++) out += ZALGO_MID[(idx * 5 + k * 2) % ZALGO_MID.length];
    for (let k = 0; k < counts.down; k++) out += ZALGO_DOWN[(idx * 11 + k * 5) % ZALGO_DOWN.length];
    idx++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Small Text / Superscript Generator
// ---------------------------------------------------------------------------

const SMALL_MAP: Record<string, string> = {
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
  n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', q: 'ᑫ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  A: 'ᴬ', B: 'ᴮ', C: 'ᶜ', D: 'ᴰ', E: 'ᴱ', F: 'ᶠ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ', M: 'ᴹ',
  N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', Q: 'ᵠ', R: 'ᴿ', S: 'ˢ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ', X: 'ˣ', Y: 'ʸ', Z: 'ᶻ',
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
};

export function smallText(text: string): string {
  if (text === '') return '';
  return [...text].map((ch) => SMALL_MAP[ch] ?? ch).join('');
}

// ---------------------------------------------------------------------------
// Prefix & Suffix Adder
// ---------------------------------------------------------------------------

export function addPrefixSuffix(text: string, prefix: string, suffix: string): string {
  if (text === '') return '';
  return text
    .split('\n')
    .map((line) => `${prefix}${line}${suffix}`)
    .join('\n');
}

// ---------------------------------------------------------------------------
// List ↔ CSV Converter
// ---------------------------------------------------------------------------

export function listToCsv(text: string, delimiter = ','): string {
  if (text === '') return '';
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  const quote = (field: string): string =>
    field.includes(delimiter) || field.includes('"') || field.includes('\n')
      ? `"${field.replace(/"/g, '""')}"`
      : field;
  return lines.map(quote).join(delimiter);
}

/** Parses one CSV line (or several lines) into a list of fields. Null on unbalanced quotes. */
export function csvToList(csv: string, delimiter = ','): string[] | null {
  if (csv.trim() === '') return [];
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && csv[i + 1] === '\n') i++;
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  if (inQuotes) return null;
  fields.push(field);
  return fields.map((f) => f.trim()).filter((f) => f !== '');
}

// ---------------------------------------------------------------------------
// Text ↔ Binary Converters
// ---------------------------------------------------------------------------

export function textToBinary(text: string): string {
  if (text === '') return '';
  const bytes = new TextEncoder().encode(text);
  return [...bytes].map((b) => b.toString(2).padStart(8, '0')).join(' ');
}

/** Null when the input is not valid 8-bit binary groups. */
export function binaryToText(binary: string): string | null {
  const cleaned = binary.trim().replace(/\s+/g, ' ');
  if (cleaned === '') return '';
  const groups = cleaned.split(' ');
  if (groups.some((g) => !/^[01]{8}$/.test(g))) return null;
  try {
    const bytes = new Uint8Array(groups.map((g) => parseInt(g, 2)));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Morse Code Converter (bidirectional)
// ---------------------------------------------------------------------------

export const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.', $: '...-..-', '@': '.--.-.',
};

const MORSE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([ch, code]) => [code, ch]),
);

export function textToMorse(text: string): string {
  if (text === '') return '';
  return text
    .toUpperCase()
    .split(' ')
    .map((word) =>
      [...word]
        .map((ch) => MORSE_MAP[ch] ?? '')
        .filter((c) => c !== '')
        .join(' '),
    )
    .filter((w) => w !== '')
    .join(' / ');
}

/** Null when any Morse token is unknown. */
export function morseToText(morse: string): string | null {
  const cleaned = morse.trim();
  if (cleaned === '') return '';
  if (/[^.\-/\s]/.test(cleaned)) return null;
  const words = cleaned.split(/\s*\/\s*/);
  const out: string[] = [];
  for (const word of words) {
    const letters = word.trim().split(/\s+/).filter((t) => t !== '');
    let decoded = '';
    for (const token of letters) {
      const ch = MORSE_REVERSE[token];
      if (!ch) return null;
      decoded += ch;
    }
    out.push(decoded);
  }
  return out.join(' ');
}

// ---------------------------------------------------------------------------
// ASCII Art Generator (built-in 5-row block font)
// ---------------------------------------------------------------------------
// Covered characters: A–Z, 0–9, space and . , ! ? : ; ' - + = / ( ) & %
// Any other character renders as a blank 5-wide block.

const ASCII_FONT: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '#  ##', '#   #', ' ####'],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['  ###', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  '0': [' ### ', '#  ##', '# # #', '##  #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '   # ', '  #  ', '#####'],
  '3': ['#### ', '    #', ' ### ', '    #', '#### '],
  '4': ['#   #', '#   #', '#####', '    #', '    #'],
  '5': ['#####', '#    ', '#### ', '    #', '#### '],
  '6': [' ### ', '#    ', '#### ', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', '  #  '],
  '8': [' ### ', '#   #', ' ### ', '#   #', ' ### '],
  '9': [' ### ', '#   #', ' ####', '    #', ' ### '],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '.': ['     ', '     ', '     ', '     ', '  #  '],
  ',': ['     ', '     ', '     ', '  #  ', ' #   '],
  '!': ['  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '   # ', '     ', '  #  '],
  ':': ['     ', '  #  ', '     ', '  #  ', '     '],
  ';': ['     ', '  #  ', '     ', '  #  ', ' #   '],
  "'": ['  #  ', '  #  ', '     ', '     ', '     '],
  '-': ['     ', '     ', '#####', '     ', '     '],
  '+': ['     ', '  #  ', '#####', '  #  ', '     '],
  '=': ['     ', '#####', '     ', '#####', '     '],
  '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
  '(': ['   # ', '  #  ', '  #  ', '  #  ', '   # '],
  ')': [' #   ', '  #  ', '  #  ', '  #  ', ' #   '],
  '&': [' ##  ', '#  # ', ' # # ', ' # # ', '  ## '],
  '%': ['#   #', '    #', '   # ', '  #  ', '#   #'],
};

export const ASCII_ART_COVERED = 'A–Z, 0–9, space and . , ! ? : ; \' - + = / ( ) & %';

export function asciiArt(text: string): string {
  if (text === '') return '';
  const upper = text.toUpperCase();
  const glyphs = [...upper].map((ch) => ASCII_FONT[ch] ?? ASCII_FONT[' ']);
  const rows: string[] = [];
  for (let r = 0; r < 5; r++) {
    rows.push(glyphs.map((g) => g[r]).join(' '));
  }
  return rows.join('\n');
}

// ---------------------------------------------------------------------------
// Emoji Picker (real Unicode emoji, by category + search)
// ---------------------------------------------------------------------------

export interface EmojiCategory {
  id: string;
  nameBn: string;
  nameEn: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: 'smileys', nameBn: 'মুখের ভাব', nameEn: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😴', '😢', '😭', '😡', '🥳', '😇', '🤩', '😜', '😝', '🙂', '🙃', '😉', '🥺', '😤', '🤯', '🥶', '🤗'] },
  { id: 'people', nameBn: 'মানুষ', nameEn: 'People', emojis: ['👋', '👍', '👏', '🙏', '💪', '🙌', '👀', '🧑', '👨', '👩', '👦', '👧', '👶', '👴', '👵', '🧕', '👮', '👷', '🧑‍🎓', '🧑‍⚕️', '🧑‍🍳', '🧑‍🌾', '🧑‍🏫', '🤝', '🫶', '👨‍👩‍👧', '🕺', '💃', '🏃', '🚶'] },
  { id: 'animals', nameBn: 'প্রাণী', nameEn: 'Animals', emojis: ['🐶', '🐱', '🦁', '🐯', '🐼', '🐨', '🐸', '🐵', '🐔', '🐧', '🦄', '🐝', '🦋', '🐢', '🐍', '🐘', '🦒', '🐄', '🐷', '🐰', '🐹', '🦊', '🐺', '🐴', '🦅', '🦉', '🐬', '🐳', '🦈', '🐙'] },
  { id: 'food', nameBn: 'খাবার', nameEn: 'Food', emojis: ['🍎', '🍌', '🍇', '🍓', '🍒', '🥭', '🍑', '🍍', '🥥', '🍕', '🍔', '🍟', '🌮', '🍜', '🍚', '🍞', '🧀', '🍰', '🎂', '🍩', '🍪', '🍫', '🍿', '☕', '🥤', '🍵', '🍺', '🥛', '🍯', '🌶️'] },
  { id: 'activities', nameBn: 'খেলা ও কাজ', nameEn: 'Activities', emojis: ['⚽', '🏏', '🏸', '🎾', '🏀', '🏐', '🏈', '🎮', '🎲', '♟️', '🎯', '🎸', '🎵', '🎤', '🎧', '🎬', '📚', '✏️', '🎨', '🧩', '🚲', '🏊', '🧘', '🏋️', '🎪', '🎡', '🎢', '🚀', '✈️', '🚗'] },
  { id: 'nature', nameBn: 'প্রকৃতি', nameEn: 'Nature', emojis: ['🌞', '🌙', '⭐', '🌟', '🌈', '🔥', '💧', '🌊', '🍀', '🌹', '🌻', '🌸', '🌵', '🌴', '🍂', '❄️', '⛄', '🌍', '🌏', '🌎', '🏔️', '🏖️', '🌋', '🌌', '☁️', '🌧️', '⚡', '🌪️', '💨', '🍁'] },
  { id: 'objects', nameBn: 'জিনিসপত্র', nameEn: 'Objects', emojis: ['📱', '💻', '⌚', '📷', '🎁', '💡', '🔑', '🔒', '💰', '💎', '👑', '🎓', '📖', '🖊️', '✂️', '📌', '📎', '🔔', '⏰', '🧲', '🔋', '💊', '🩺', '🚪', '🪑', '🛏️', '🚿', '🧴', '🪥', '🧸'] },
  { id: 'symbols', nameBn: 'চিহ্ন', nameEn: 'Symbols', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💯', '✅', '❌', '⭐', '✨', '💥', '🎉', '🎊', '🎈', '🏆', '🥇', '🥈', '🥉', '⚠️', '🚫', '♻️', '☮️', '🕉️', '☪️', '✝️', '☯️'] },
];

export function searchEmojis(query: string): string[] {
  const q = query.trim().toLowerCase();
  const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  if (q === '') return all;
  const byName: Record<string, string[]> = {
    love: ['❤️', '😍', '😘', '🥰', '💕', '💖', '💗', '💓', '💞', '😻'],
    happy: ['😀', '😃', '😄', '😁', '😆', '😊', '🤣', '😂', '🥳', '😇'],
    sad: ['😢', '😭', '😞', '😔', '🥺', '😿'],
    cat: ['🐱', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
    dog: ['🐶', '🐕', '🦮', '🐩'],
    food: EMOJI_CATEGORIES.find((c) => c.id === 'food')?.emojis ?? [],
    fire: ['🔥', '🧨', '💥'],
    star: ['⭐', '🌟', '✨', '💫'],
    bangladesh: ['🇧🇩'],
    flag: ['🇧🇩', '🇮🇳', '🇵🇰', '🇬🇧', '🇺🇸', '🇸🇦', '🇦🇪', '🇲🇾'],
  };
  const hits = byName[q] ?? [];
  const named = hits.length > 0 ? hits : all.filter((e) => e === q);
  return [...new Set([...named, ...all.filter((e) => e.includes(q))])];
}

// ---------------------------------------------------------------------------
// Invisible Character Generator
// ---------------------------------------------------------------------------

export interface InvisibleChar {
  id: string;
  nameBn: string;
  nameEn: string;
  codePoint: string;
  char: string;
}

export const INVISIBLE_CHARS: InvisibleChar[] = [
  { id: 'zwsp', nameBn: 'জিরো উইডথ স্পেস', nameEn: 'Zero Width Space', codePoint: 'U+200B', char: '\u200B' },
  { id: 'zwnj', nameBn: 'জিরো উইডথ নন-জয়েনার', nameEn: 'Zero Width Non-Joiner', codePoint: 'U+200C', char: '\u200C' },
  { id: 'zwj', nameBn: 'জিরো উইডথ জয়েনার', nameEn: 'Zero Width Joiner', codePoint: 'U+200D', char: '\u200D' },
  { id: 'wjoiner', nameBn: 'ওয়ার্ড জয়েনার', nameEn: 'Word Joiner', codePoint: 'U+2060', char: '\u2060' },
  { id: 'bom', nameBn: 'বাইট অর্ডার মার্ক', nameEn: 'Byte Order Mark', codePoint: 'U+FEFF', char: '\uFEFF' },
  { id: 'nbsp', nameBn: 'নন-ব্রেকিং স্পেস', nameEn: 'Non-Breaking Space', codePoint: 'U+00A0', char: '\u00A0' },
  { id: 'braille', nameBn: 'ব্রেইল ফাঁকা', nameEn: 'Braille Pattern Blank', codePoint: 'U+2800', char: '\u2800' },
  { id: 'hangul', nameBn: 'হাঙ্গুল ফিলার', nameEn: 'Hangul Filler', codePoint: 'U+3164', char: '\u3164' },
  { id: 'mongolian', nameBn: 'মঙ্গোলিয়ান ভাওয়েল সেপারেটর', nameEn: 'Mongolian Vowel Separator', codePoint: 'U+180E', char: '\u180E' },
  { id: 'hangul-choseong', nameBn: 'হাঙ্গুল চোসং ফিলার', nameEn: 'Hangul Choseong Filler', codePoint: 'U+115F', char: '\u115F' },
];

/** Repeats an invisible character count times (1–100). Null for unknown id or bad count. */
export function invisibleString(id: string, count: number): string | null {
  const entry = INVISIBLE_CHARS.find((c) => c.id === id);
  if (!entry || !Number.isFinite(count)) return null;
  const n = Math.floor(count);
  if (n < 1 || n > 100) return null;
  return entry.char.repeat(n);
}

// ---------------------------------------------------------------------------
// Palindrome Checker
// ---------------------------------------------------------------------------

function graphemes(text: string): string[] {
  try {
    const IntlWithSegmenter = Intl as unknown as {
      Segmenter?: new (locale: string, opts: { granularity: string }) => {
        segment(s: string): Iterable<{ segment: string }>;
      };
    };
    const Segmenter = IntlWithSegmenter.Segmenter;
    if (!Segmenter) return [...text];
    const segmenter = new Segmenter('en', { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map((s) => s.segment);
  } catch {
    return [...text];
  }
}

export function palindromeInfo(text: string): { cleaned: string; reversed: string; isPalindrome: boolean } {
  const cleaned = graphemes(text.toLowerCase()).filter((ch) => /[\p{L}\p{N}]/u.test(ch)).join('');
  const reversed = graphemes(cleaned).reverse().join('');
  return { cleaned, reversed, isPalindrome: cleaned.length > 0 && cleaned === reversed };
}

export function isPalindrome(text: string): boolean {
  return palindromeInfo(text).isPalindrome;
}

// ---------------------------------------------------------------------------
// Anagram Solver / Checker
// ---------------------------------------------------------------------------

function sortedLetters(word: string): string {
  return [...word.toLowerCase()].filter((ch) => /[a-z]/.test(ch)).sort().join('');
}

export function isAnagram(a: string, b: string): boolean {
  const sa = sortedLetters(a);
  const sb = sortedLetters(b);
  return sa.length > 0 && sa === sb && a.toLowerCase().trim() !== b.toLowerCase().trim();
}

/** All words in the built-in list that are anagrams of the given word (excluding itself). */
export function findAnagrams(word: string): string[] {
  const key = sortedLetters(word);
  if (key.length < 2) return [];
  const lower = word.toLowerCase().trim();
  return ANAGRAM_WORDS.filter((w) => w !== lower && sortedLetters(w) === key);
}

// ---------------------------------------------------------------------------
// Essay / Thesis Statement Generator (template-based)
// ---------------------------------------------------------------------------

export function generateThesis(topic: string, position: string, reasons: string[]): string | null {
  const t = topic.trim();
  const p = position.trim();
  const rs = reasons.map((r) => r.trim()).filter((r) => r !== '');
  if (t === '' || p === '' || rs.length === 0) return null;
  const reasonText = rs.length === 1 ? rs[0] : rs.length === 2 ? `${rs[0]} and ${rs[1]}` : `${rs.slice(0, -1).join(', ')}, and ${rs[rs.length - 1]}`;
  return `This essay argues that ${t} ${p}, because ${reasonText}.`;
}

export function generateThesisBangla(topic: string, position: string, reasons: string[]): string | null {
  const t = topic.trim();
  const p = position.trim();
  const rs = reasons.map((r) => r.trim()).filter((r) => r !== '');
  if (t === '' || p === '' || rs.length === 0) return null;
  const reasonText = rs.length === 1 ? rs[0] : `${rs.slice(0, -1).join(', ')} এবং ${rs[rs.length - 1]}`;
  return `এই রচনায় যুক্তি দেওয়া হয়েছে যে ${t} ${p}, কারণ ${reasonText}।`;
}

// ---------------------------------------------------------------------------
// Keyword Density Checker
// ---------------------------------------------------------------------------

export interface KeywordDensity {
  keyword: string;
  count: number;
  totalWords: number;
  density: number;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w !== '').length;
}

export function keywordDensity(text: string, keyword: string): KeywordDensity | null {
  const kw = keyword.trim().toLowerCase();
  if (kw === '' || text.trim() === '') return null;
  const total = countWords(text);
  if (total === 0) return null;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.toLowerCase().match(new RegExp(`\\b${escaped}\\b`, 'g'));
  const count = matches ? matches.length : 0;
  return { keyword: kw, count, totalWords: total, density: Math.round((count / total) * 10000) / 100 };
}

export function wordFrequencies(text: string, limit = 10): Array<{ word: string; count: number; density: number }> {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  if (words.length === 0) return [];
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(1, limit))
    .map(([word, count]) => ({ word, count, density: Math.round((count / words.length) * 10000) / 100 }));
}

// ---------------------------------------------------------------------------
// Slug Generator
// ---------------------------------------------------------------------------

/**
 * Title → URL-friendly slug. Bangla-aware: Bangla letters are kept
 * (valid in URLs, percent-encoded by browsers); Latin letters are
 * lowercased; spaces become hyphens; punctuation is dropped.
 */
export function generateSlug(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug;
}

// ---------------------------------------------------------------------------
// Readability Score Checker (Flesch — calibrated for English text)
// ---------------------------------------------------------------------------

export interface ReadabilityResult {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  words: number;
  sentences: number;
  syllables: number;
  level: string;
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/e$/, '').match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  if (w.endsWith('le') && w.length > 2 && !/[aeiouy]/.test(w[w.length - 3])) count += 1;
  return Math.max(1, count);
}

export function readabilityScore(text: string): ReadabilityResult | null {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s !== '');
  const words = text.match(/[\p{L}\p{N}']+/gu) ?? [];
  if (sentences.length === 0 || words.length < 10) return null;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const wps = words.length / sentences.length;
  const spw = syllables / words.length;
  const ease = Math.round((206.835 - 1.015 * wps - 84.6 * spw) * 10) / 10;
  const grade = Math.round((0.39 * wps + 11.8 * spw - 15.59) * 10) / 10;
  const level = ease >= 90 ? 'Very easy' : ease >= 80 ? 'Easy' : ease >= 70 ? 'Fairly easy' : ease >= 60 ? 'Standard' : ease >= 50 ? 'Fairly difficult' : ease >= 30 ? 'Difficult' : 'Very difficult';
  return { fleschReadingEase: ease, fleschKincaidGrade: Math.max(0, grade), words: words.length, sentences: sentences.length, syllables, level };
}

// ---------------------------------------------------------------------------
// Bio / Username Generator
// ---------------------------------------------------------------------------

export function generateUsernameIdeas(keyword: string): string[] {
  const base = keyword.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (base === '') return [];
  const clean = base.replace(/_/g, '');
  const ideas = [
    `${clean}_official`, `${clean}.daily`, `the_real_${clean}`, `${clean}_bd`, `i_am_${clean}`,
    `${clean}123`, `mr_${clean}`, `its_${clean}`, `${clean}_world`, `real_${clean}_`,
    `${clean}x`, `${clean}_hub`, `official_${clean}`, `${clean}.life`, `hey_${clean}`,
  ];
  return [...new Set(ideas)].slice(0, 12);
}

export function generateBioIdeas(keyword: string): string[] {
  const kw = keyword.trim();
  if (kw === '') return [];
  return [
    `✨ ${kw} lover | Sharing what I love, every day`,
    `${kw} • Learning, growing & sharing ✨`,
    `Welcome to my world of ${kw} 🌍`,
    `${kw} enthusiast 📚 | DM for collabs`,
    `Daily dose of ${kw} 💫 | Follow for more`,
    `I talk about ${kw} — and I love it ❤️`,
  ];
}

// ---------------------------------------------------------------------------
// Hashtag Generator (keyword → hashtag; never scrapes any site)
// ---------------------------------------------------------------------------

export function generateHashtags(keywords: string): string[] {
  const parts = keywords.split(/[,\n]+/).map((p) => p.trim()).filter((p) => p !== '');
  const tags: string[] = [];
  for (const part of parts) {
    const words = part.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')).filter((w) => w !== '');
    if (words.length === 0) continue;
    const tag = `#${words.map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('')}`;
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 30);
}

// ---------------------------------------------------------------------------
// YouTube Title & Description Character Checker
// ---------------------------------------------------------------------------

export interface YoutubeLimits {
  titleLength: number;
  titleLimit: number;
  titleRemaining: number;
  titleOk: boolean;
  descriptionLength: number;
  descriptionLimit: number;
  descriptionRemaining: number;
  descriptionOk: boolean;
}

export function checkYoutubeTitleDescription(title: string, description: string): YoutubeLimits {
  const titleLength = [...title].length;
  const descriptionLength = [...description].length;
  return {
    titleLength,
    titleLimit: 100,
    titleRemaining: 100 - titleLength,
    titleOk: titleLength <= 100,
    descriptionLength,
    descriptionLimit: 5000,
    descriptionRemaining: 5000 - descriptionLength,
    descriptionOk: descriptionLength <= 5000,
  };
}

// ---------------------------------------------------------------------------
// Line Number Adder
// ---------------------------------------------------------------------------

export type LineNumberFormat = 'plain' | 'padded' | 'dot';

export function addLineNumbers(
  text: string,
  options: { start?: number; format?: LineNumberFormat } = {},
): string {
  if (text === '') return '';
  const start = Number.isFinite(options.start) ? Math.floor(options.start as number) : 1;
  const format = options.format ?? 'plain';
  const lines = text.split('\n');
  const maxNum = start + lines.length - 1;
  const width = format === 'padded' ? String(Math.max(0, maxNum)).length : 0;
  return lines
    .map((line, i) => {
      const n = start + i;
      if (format === 'dot') return `${n}. ${line}`;
      if (format === 'padded') return `${String(n).padStart(width, ' ')} | ${line}`;
      return `${n} | ${line}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Wheel Spinner / Random Decision Maker
// ---------------------------------------------------------------------------

/** Null when the option list is empty. */
export function spinWheel(options: string[], random: () => number = Math.random): string | null {
  const clean = options.map((o) => o.trim()).filter((o) => o !== '');
  if (clean.length === 0) return null;
  return clean[Math.floor(random() * clean.length)];
}

export function parseOptionList(text: string): string[] {
  return text.split('\n').map((o) => o.trim()).filter((o) => o !== '');
}

// ---------------------------------------------------------------------------
// Coin Flip & Dice Roller
// ---------------------------------------------------------------------------

export function flipCoin(random: () => number = Math.random): 'heads' | 'tails' {
  return random() < 0.5 ? 'heads' : 'tails';
}

/** Rolls `count` dice with `sides` faces. Null for out-of-range counts/sides. */
export function rollDice(count: number, sides = 6, random: () => number = Math.random): number[] | null {
  if (!Number.isFinite(count) || !Number.isFinite(sides)) return null;
  const c = Math.floor(count);
  const s = Math.floor(sides);
  if (c < 1 || c > 6 || s < 2 || s > 20) return null;
  return Array.from({ length: c }, () => Math.floor(random() * s) + 1);
}

export function diceTotal(rolls: number[]): number {
  return rolls.reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------------------
// Words to Number Converter (English words AND Bangla words → number)
// ---------------------------------------------------------------------------

const EN_ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const EN_SCALES: Record<string, number> = { hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000 };

/** English words → number. Null on unknown words or broken order. */
export function wordsToNumberEn(text: string): number | null {
  const cleaned = text.trim().toLowerCase().replace(/-/g, ' ');
  if (cleaned === '') return null;
  const tokens = cleaned.split(/\s+/).filter((t) => t !== '');
  let negative = false;
  let total = 0;
  let current = 0;
  let seenAny = false;
  let seenScale = false;
  for (const token of tokens) {
    if (token === 'minus' || token === 'negative') {
      if (seenAny) return null;
      negative = true;
      continue;
    }
    if (token === 'and') continue;
    if (token in EN_ONES) {
      current += EN_ONES[token];
      seenAny = true;
    } else if (token in EN_TENS) {
      current += EN_TENS[token];
      seenAny = true;
    } else if (token === 'hundred') {
      if (current === 0 || seenScale) return null;
      current *= 100;
      seenScale = true;
      seenAny = true;
    } else if (token in EN_SCALES) {
      if (current === 0) return null;
      total += current * EN_SCALES[token];
      current = 0;
      seenScale = false;
      seenAny = true;
    } else {
      return null;
    }
  }
  if (!seenAny) return null;
  const value = total + current;
  return negative ? -value : value;
}

const BN_ONES: Record<string, number> = {
  শূন্য: 0, এক: 1, দুই: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9,
  দশ: 10, এগারো: 11, বারো: 12, তেরো: 13, চৌদ্দ: 14, পনেরো: 15, ষোলো: 16, সতেরো: 17,
  আঠারো: 18, উনিশ: 19, বিশ: 20, একুশ: 21, বাইশ: 22, তেইশ: 23, চব্বিশ: 24, পঁচিশ: 25,
  ছাব্বিশ: 26, সাতাশ: 27, আটাশ: 28, ঊনত্রিশ: 29, ত্রিশ: 30, একত্রিশ: 31, বত্রিশ: 32,
  তেত্রিশ: 33, চৌত্রিশ: 34, পঁয়ত্রিশ: 35, ছত্রিশ: 36, সাঁইত্রিশ: 37, আটত্রিশ: 38,
  ঊনচল্লিশ: 39, চল্লিশ: 40, একচল্লিশ: 41, বিয়াল্লিশ: 42, তেতাল্লিশ: 43, চুয়াল্লিশ: 44,
  পঁয়তাল্লিশ: 45, ছেচল্লিশ: 46, সাতচল্লিশ: 47, আটচল্লিশ: 48, ঊনপঞ্চাশ: 49, পঞ্চাশ: 50,
  একান্ন: 51, বায়ান্ন: 52, তিপ্পান্ন: 53, চুয়ান্ন: 54, পঞ্চান্ন: 55, ছাপ্পান্ন: 56,
  সাতান্ন: 57, আটান্ন: 58, ঊনষাট: 59, ষাট: 60, একষট্টি: 61, বাষট্টি: 62, তেষট্টি: 63,
  চৌষট্টি: 64, পঁয়ষট্টি: 65, ছেষট্টি: 66, সাতষট্টি: 67, আটষট্টি: 68, ঊনসত্তর: 69,
  সত্তর: 70, একাত্তর: 71, বাহাত্তর: 72, তিয়াত্তর: 73, চুয়াত্তর: 74, পঁচাত্তর: 75,
  ছিয়াত্তর: 76, সাতাত্তর: 77, আটাত্তর: 78, ঊনআশি: 79, আশি: 80, একাশি: 81, বিরাশি: 82,
  তিরাশি: 83, চুরাশি: 84, পঁচাশি: 85, ছিয়াশি: 86, সাতাশি: 87, আটাশি: 88, ঊননব্বই: 89,
  নব্বই: 90, একানব্বই: 91, বিরানব্বই: 92, তিরানব্বই: 93, চুরানব্বই: 94, পঁচানব্বই: 95,
  ছিয়ানব্বই: 96, সাতানব্বই: 97, আটানব্বই: 98, নিরানব্বই: 99,
};
const BN_SCALES: Record<string, number> = { শত: 100, একশত: 100, হাজার: 1000, লক্ষ: 100000, কোটি: 10000000 };

/** Bangla words → number. Null on unknown words or broken order. */
export function wordsToNumberBn(text: string): number | null {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned === '') return null;
  const tokens = cleaned.split(' ').filter((t) => t !== '');
  let negative = false;
  let total = 0;
  let current = 0;
  let seenAny = false;
  for (const token of tokens) {
    if (token === 'মাইনাস' || token === 'ঋণাত্মক') {
      if (seenAny) return null;
      negative = true;
      continue;
    }
    if (token in BN_ONES) {
      current += BN_ONES[token];
      seenAny = true;
    } else if (token in BN_SCALES) {
      const scale = BN_SCALES[token];
      if (scale === 100) {
        if (current === 0) current = 1;
        current *= 100;
      } else {
        if (current === 0) return null;
        total += current * scale;
        current = 0;
      }
      seenAny = true;
    } else if (token.length > 2 && token.endsWith('শত')) {
      // Compound like পাঁচশত (= 500), দুইশত (= 200) — one token.
      const prefix = token.slice(0, -2);
      if (!(prefix in BN_ONES) || BN_ONES[prefix] < 1 || BN_ONES[prefix] > 9) return null;
      current += BN_ONES[prefix] * 100;
      seenAny = true;
    } else {
      return null;
    }
  }
  if (!seenAny) return null;
  const value = total + current;
  return negative ? -value : value;
}

/** Tries English first, then Bangla. Null when neither parses. */
export function wordsToNumber(text: string): number | null {
  if (text.trim() === '') return null;
  const en = wordsToNumberEn(text);
  if (en !== null) return en;
  return wordsToNumberBn(text);
}
