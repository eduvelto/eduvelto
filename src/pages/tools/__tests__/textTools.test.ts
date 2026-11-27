// Eduvelto — Text batch engine tests (27 Nov 2026).
// Known-answer cases for every engine function, incl. edge cases
// and invalid input -> null.
import { describe, it, expect } from 'vitest';
import {
  pickRandomWords,
  zalgoText,
  smallText,
  addPrefixSuffix,
  listToCsv,
  csvToList,
  textToBinary,
  binaryToText,
  textToMorse,
  morseToText,
  asciiArt,
  searchEmojis,
  EMOJI_CATEGORIES,
  INVISIBLE_CHARS,
  invisibleString,
  isPalindrome,
  palindromeInfo,
  isAnagram,
  findAnagrams,
  generateThesis,
  generateThesisBangla,
  keywordDensity,
  wordFrequencies,
  countWords,
  generateSlug,
  countSyllables,
  readabilityScore,
  generateUsernameIdeas,
  generateBioIdeas,
  generateHashtags,
  checkYoutubeTitleDescription,
  addLineNumbers,
  spinWheel,
  parseOptionList,
  flipCoin,
  rollDice,
  diceTotal,
  wordsToNumberEn,
  wordsToNumberBn,
  wordsToNumber,
} from '../../../lib/tools/textTools';
import { RANDOM_WORDS, ANAGRAM_WORDS } from '../../../lib/tools/textWordList';

describe('pickRandomWords', () => {
  it('returns the requested count, all from the list, no repeats', () => {
    const words = pickRandomWords(5, () => 0.5);
    expect(words).toHaveLength(5);
    for (const w of words) expect(RANDOM_WORDS.map((r) => r.word)).toContain(w.word);
    expect(new Set(words.map((w) => w.word)).size).toBe(5);
  });
  it('caps at 20 and returns [] for 0', () => {
    expect(pickRandomWords(50, () => 0.1)).toHaveLength(20);
    expect(pickRandomWords(0)).toEqual([]);
  });
  it('list has 100+ words with Bangla meanings', () => {
    expect(RANDOM_WORDS.length).toBeGreaterThanOrEqual(100);
    for (const w of RANDOM_WORDS) {
      expect(w.word).toMatch(/^[a-z]+$/);
      expect(w.meaningBn.length).toBeGreaterThan(0);
    }
  });
});

describe('zalgoText', () => {
  it('keeps the original letters and adds combining marks', () => {
    const out = zalgoText('Hi', 'light');
    expect(out.replace(/[\u0300-\u036f]/g, '')).toBe('Hi');
    expect(out.length).toBeGreaterThan(2);
  });
  it('heavy adds more marks than light', () => {
    expect(zalgoText('Hi', 'heavy').length).toBeGreaterThan(zalgoText('Hi', 'light').length);
  });
  it('empty stays empty', () => {
    expect(zalgoText('')).toBe('');
  });
});

describe('smallText', () => {
  it('maps letters and digits to superscript/small forms', () => {
    expect(smallText('abc')).toBe('ᵃᵇᶜ');
    expect(smallText('123')).toBe('¹²³');
    expect(smallText('Hello')).toBe('ᴴᵉˡˡᵒ');
  });
  it('leaves unknown characters alone', () => {
    expect(smallText('a b!')).toBe('ᵃ ᵇ!');
    expect(smallText('')).toBe('');
  });
});

describe('addPrefixSuffix', () => {
  it('adds prefix and suffix to every line', () => {
    expect(addPrefixSuffix('apple\nbanana', '>> ', ' <<')).toBe('>> apple <<\n>> banana <<');
  });
  it('empty input stays empty', () => {
    expect(addPrefixSuffix('', 'x', 'y')).toBe('');
  });
});

describe('listToCsv / csvToList', () => {
  it('joins lines with commas', () => {
    expect(listToCsv('apple\nbanana\nmango')).toBe('apple,banana,mango');
    expect(listToCsv('a\n\nb\n')).toBe('a,b');
  });
  it('quotes fields containing the delimiter', () => {
    expect(listToCsv('a,b\nc')).toBe('"a,b",c');
  });
  it('parses CSV back to a list, incl. quoted fields', () => {
    expect(csvToList('apple,banana,mango')).toEqual(['apple', 'banana', 'mango']);
    expect(csvToList('"a,b",c')).toEqual(['a,b', 'c']);
    expect(csvToList('')).toEqual([]);
  });
  it('returns null on unbalanced quotes', () => {
    expect(csvToList('"abc,def')).toBeNull();
  });
});

describe('textToBinary / binaryToText', () => {
  it('converts A to 01000001 and back', () => {
    expect(textToBinary('A')).toBe('01000001');
    expect(binaryToText('01000001')).toBe('A');
  });
  it('round-trips Hi', () => {
    expect(binaryToText(textToBinary('Hi'))).toBe('Hi');
  });
  it('rejects bad binary', () => {
    expect(binaryToText('0100000')).toBeNull();
    expect(binaryToText('0100000x')).toBeNull();
    expect(binaryToText('12345678')).toBeNull();
  });
  it('empty stays empty', () => {
    expect(textToBinary('')).toBe('');
    expect(binaryToText('')).toBe('');
  });
});

describe('textToMorse / morseToText', () => {
  it('converts SOS and back', () => {
    expect(textToMorse('SOS')).toBe('... --- ...');
    expect(morseToText('... --- ...')).toBe('SOS');
  });
  it('uses / between words', () => {
    expect(textToMorse('HI YOU')).toBe('.... .. / -.-- --- ..-');
    expect(morseToText('.... .. / -.-- --- ..-')).toBe('HI YOU');
  });
  it('handles digits', () => {
    expect(textToMorse('123')).toBe('.---- ..--- ...--');
  });
  it('returns null on unknown Morse tokens', () => {
    expect(morseToText('... --- ... ......')).toBeNull();
    expect(morseToText('hello')).toBeNull();
  });
});

describe('asciiArt', () => {
  it('renders 5 rows for HI', () => {
    const art = asciiArt('HI');
    expect(art.split('\n')).toHaveLength(5);
    expect(art).toContain('#');
  });
  it('renders digits', () => {
    expect(asciiArt('8').split('\n')).toHaveLength(5);
  });
  it('empty stays empty', () => {
    expect(asciiArt('')).toBe('');
  });
});

describe('emoji picker data', () => {
  it('has 8 categories with real emoji', () => {
    expect(EMOJI_CATEGORIES).toHaveLength(8);
    for (const c of EMOJI_CATEGORIES) {
      expect(c.emojis.length).toBeGreaterThan(10);
      for (const e of c.emojis) expect(e.length).toBeGreaterThan(0);
    }
  });
  it('search finds love and cat emojis', () => {
    expect(searchEmojis('love')).toContain('❤️');
    expect(searchEmojis('cat')).toContain('🐱');
    expect(searchEmojis('')).toHaveLength(EMOJI_CATEGORIES.flatMap((c) => c.emojis).length);
  });
});

describe('invisibleString', () => {
  it('repeats the zero-width space', () => {
    expect(invisibleString('zwsp', 3)).toBe('\u200B'.repeat(3));
    expect(invisibleString('zwsp', 3)?.length).toBe(3);
    expect(invisibleString('braille', 1)?.codePointAt(0)).toBe(0x2800);
  });
  it('returns null for unknown id or bad count', () => {
    expect(invisibleString('nope', 3)).toBeNull();
    expect(invisibleString('zwsp', 0)).toBeNull();
    expect(invisibleString('zwsp', 101)).toBeNull();
  });
  it('lists 10 invisible characters', () => {
    expect(INVISIBLE_CHARS).toHaveLength(10);
  });
});

describe('palindrome', () => {
  it('detects palindromes ignoring case, spaces and punctuation', () => {
    expect(isPalindrome('Madam')).toBe(true);
    expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(true);
    expect(isPalindrome('মামা')).toBe(true);
    expect(isPalindrome('hello')).toBe(false);
    expect(isPalindrome('')).toBe(false);
  });
  it('palindromeInfo shows cleaned and reversed', () => {
    expect(palindromeInfo('Madam')).toEqual({ cleaned: 'madam', reversed: 'madam', isPalindrome: true });
  });
});

describe('anagram', () => {
  it('isAnagram checks letter equality', () => {
    expect(isAnagram('listen', 'silent')).toBe(true);
    expect(isAnagram('Listen', 'Silent')).toBe(true);
    expect(isAnagram('hello', 'world')).toBe(false);
    expect(isAnagram('same', 'same')).toBe(false);
  });
  it('findAnagrams finds list words only', () => {
    expect(findAnagrams('listen')).toContain('silent');
    expect(findAnagrams('listen')).toContain('enlist');
    expect(findAnagrams('listen')).not.toContain('listen');
    expect(findAnagrams('xyz')).toEqual([]);
    expect(ANAGRAM_WORDS.length).toBeGreaterThan(50);
  });
});

describe('thesis generator', () => {
  it('builds an English thesis from topic, position and reasons', () => {
    expect(generateThesis('online learning', 'is better than classroom learning', ['it is flexible', 'it saves money']))
      .toBe('This essay argues that online learning is better than classroom learning, because it is flexible and it saves money.');
  });
  it('handles three reasons with Oxford comma', () => {
    expect(generateThesis('reading', 'improves the mind', ['a', 'b', 'c']))
      .toBe('This essay argues that reading improves the mind, because a, b, and c.');
  });
  it('builds a Bangla thesis', () => {
    expect(generateThesisBangla('বই পড়া', 'জ্ঞান বাড়ায়', ['এটি চিন্তা বাড়ায়']))
      .toBe('এই রচনায় যুক্তি দেওয়া হয়েছে যে বই পড়া জ্ঞান বাড়ায়, কারণ এটি চিন্তা বাড়ায়।');
  });
  it('returns null when topic, position or reasons are missing', () => {
    expect(generateThesis('', 'x', ['a'])).toBeNull();
    expect(generateThesis('t', '', ['a'])).toBeNull();
    expect(generateThesis('t', 'p', [])).toBeNull();
  });
});

describe('keywordDensity', () => {
  it('counts keyword occurrences as a percentage', () => {
    const r = keywordDensity('The cat sat on the mat. The cat slept.', 'cat');
    expect(r).toEqual({ keyword: 'cat', count: 2, totalWords: 9, density: 22.22 });
  });
  it('is case-insensitive and returns 0 when absent', () => {
    expect(keywordDensity('hello world', 'CAT')?.count).toBe(0);
  });
  it('returns null for empty keyword or text', () => {
    expect(keywordDensity('hello', '')).toBeNull();
    expect(keywordDensity('', 'cat')).toBeNull();
  });
  it('wordFrequencies ranks the most common word first', () => {
    const top = wordFrequencies('apple banana apple apple banana cherry', 2);
    expect(top[0]).toEqual({ word: 'apple', count: 3, density: 50 });
    expect(top[1].word).toBe('banana');
  });
  it('countWords counts whitespace-separated words', () => {
    expect(countWords('  one   two three ')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});

describe('generateSlug', () => {
  it('lowercases, hyphenates and drops punctuation', () => {
    expect(generateSlug('Hello World!')).toBe('hello-world');
    expect(generateSlug('  My  Blog   Post 2026 ')).toBe('my-blog-post-2026');
    expect(generateSlug('C++ Guide: Part 1')).toBe('c-guide-part-1');
  });
  it('keeps Bangla letters (Bangla-aware)', () => {
    expect(generateSlug('আমার ব্লগ পোস্ট')).toBe('আমার-ব্লগ-পোস্ট');
  });
  it('empty input gives empty slug', () => {
    expect(generateSlug('!!!')).toBe('');
  });
});

describe('readabilityScore', () => {
  it('counts syllables for known words', () => {
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('reading')).toBe(2);
    expect(countSyllables('beautiful')).toBe(3);
  });
  it('scores a simple English passage as easy', () => {
    const text = 'The cat sat on the mat. The dog ran to the park. The sun was warm and bright.';
    const r = readabilityScore(text);
    expect(r).not.toBeNull();
    expect(r?.words).toBe(18);
    expect(r?.sentences).toBe(3);
    expect(r?.fleschReadingEase).toBeGreaterThan(80);
  });
  it('returns null for too-short text', () => {
    expect(readabilityScore('Hello world.')).toBeNull();
    expect(readabilityScore('')).toBeNull();
  });
});

describe('bio / username generator', () => {
  it('builds username ideas from a keyword', () => {
    const ideas = generateUsernameIdeas('Rahim');
    expect(ideas).toContain('rahim_official');
    expect(ideas).toContain('rahim_bd');
    expect(ideas.length).toBeGreaterThan(5);
    expect(generateUsernameIdeas('!!!')).toEqual([]);
  });
  it('builds bio ideas mentioning the keyword', () => {
    const bios = generateBioIdeas('photography');
    expect(bios.length).toBeGreaterThan(0);
    expect(bios[0]).toContain('photography');
    expect(generateBioIdeas('')).toEqual([]);
  });
});

describe('generateHashtags', () => {
  it('turns keywords into hashtags', () => {
    expect(generateHashtags('bangladesh, cricket, world cup')).toEqual(['#bangladesh', '#cricket', '#worldCup']);
  });
  it('dedupes and caps at 30', () => {
    expect(generateHashtags('cat, Cat, CAT')).toEqual(['#cat']);
    expect(generateHashtags('')).toEqual([]);
  });
});

describe('checkYoutubeTitleDescription', () => {
  it('counts against the 100 / 5000 limits', () => {
    const r = checkYoutubeTitleDescription('My video', 'A short description.');
    expect(r.titleLength).toBe(8);
    expect(r.titleRemaining).toBe(92);
    expect(r.titleOk).toBe(true);
    expect(r.descriptionLimit).toBe(5000);
    expect(r.descriptionOk).toBe(true);
  });
  it('flags over-limit text', () => {
    const r = checkYoutubeTitleDescription('x'.repeat(101), 'y'.repeat(5001));
    expect(r.titleOk).toBe(false);
    expect(r.titleRemaining).toBe(-1);
    expect(r.descriptionOk).toBe(false);
    expect(r.descriptionRemaining).toBe(-1);
  });
});

describe('addLineNumbers', () => {
  it('numbers lines from 1 by default', () => {
    expect(addLineNumbers('a\nb')).toBe('1 | a\n2 | b');
  });
  it('supports a start number and dot format', () => {
    expect(addLineNumbers('a\nb', { start: 5 })).toBe('5 | a\n6 | b');
    expect(addLineNumbers('a\nb', { format: 'dot' })).toBe('1. a\n2. b');
  });
  it('padded format aligns numbers', () => {
    const out = addLineNumbers(Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n'), { format: 'padded' });
    expect(out.split('\n')[0]).toBe(' 1 | l0');
    expect(out.split('\n')[9]).toBe('10 | l9');
  });
});

describe('wheel spinner', () => {
  it('picks from the list and parses lines', () => {
    expect(parseOptionList('a\nb\n\nc\n')).toEqual(['a', 'b', 'c']);
    expect(spinWheel(['a', 'b', 'c'], () => 0)).toBe('a');
    expect(spinWheel(['a', 'b', 'c'], () => 0.99)).toBe('c');
  });
  it('returns null for an empty list', () => {
    expect(spinWheel([])).toBeNull();
    expect(spinWheel(['  ', ''])).toBeNull();
  });
});

describe('coin flip & dice', () => {
  it('flips heads/tails deterministically with a fixed random', () => {
    expect(flipCoin(() => 0.1)).toBe('heads');
    expect(flipCoin(() => 0.9)).toBe('tails');
  });
  it('rolls dice in range and totals them', () => {
    expect(rollDice(2, 6, () => 0)).toEqual([1, 1]);
    expect(rollDice(2, 6, () => 0.99)).toEqual([6, 6]);
    expect(diceTotal([3, 4])).toBe(7);
  });
  it('returns null for out-of-range dice', () => {
    expect(rollDice(0)).toBeNull();
    expect(rollDice(7)).toBeNull();
    expect(rollDice(1, 1)).toBeNull();
    expect(rollDice(1, 21)).toBeNull();
  });
});

describe('wordsToNumberEn', () => {
  it('converts plain English number words', () => {
    expect(wordsToNumberEn('one hundred twenty three')).toBe(123);
    expect(wordsToNumberEn('two thousand five hundred')).toBe(2500);
    expect(wordsToNumberEn('one million two hundred thousand')).toBe(1200000);
    expect(wordsToNumberEn('zero')).toBe(0);
    expect(wordsToNumberEn('nineteen')).toBe(19);
    expect(wordsToNumberEn('forty-two')).toBe(42);
    expect(wordsToNumberEn('negative five')).toBe(-5);
    expect(wordsToNumberEn('minus one hundred')).toBe(-100);
  });
  it('returns null for unknown words or bad order', () => {
    expect(wordsToNumberEn('hello')).toBeNull();
    expect(wordsToNumberEn('hundred')).toBeNull();
    expect(wordsToNumberEn('')).toBeNull();
    expect(wordsToNumberEn('two hundred hundred')).toBeNull();
  });
});

describe('wordsToNumberBn', () => {
  it('converts Bangla number words', () => {
    expect(wordsToNumberBn('একশত তেইশ')).toBe(123);
    expect(wordsToNumberBn('দুই হাজার পাঁচশত')).toBe(2500);
    expect(wordsToNumberBn('এক লক্ষ')).toBe(100000);
    expect(wordsToNumberBn('এক কোটি')).toBe(10000000);
    expect(wordsToNumberBn('শূন্য')).toBe(0);
    expect(wordsToNumberBn('বিয়াল্লিশ')).toBe(42);
    expect(wordsToNumberBn('মাইনাস পাঁচ')).toBe(-5);
  });
  it('returns null for unknown words', () => {
    expect(wordsToNumberBn('হ্যালো')).toBeNull();
    expect(wordsToNumberBn('')).toBeNull();
  });
});

describe('wordsToNumber', () => {
  it('tries English then Bangla', () => {
    expect(wordsToNumber('seven')).toBe(7);
    expect(wordsToNumber('সাত')).toBe(7);
    expect(wordsToNumber('nonsense')).toBeNull();
  });
});
