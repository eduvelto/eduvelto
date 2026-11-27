/**
 * Shared text helpers for the text tools — pure functions, no DOM.
 * Used by word-counter, text-case-converter, duplicate-line-remover,
 * remove-extra-spaces, find-and-replace and reverse-text-generator.
 */

export interface TextCounts {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** Reading time in minutes at ~200 words per minute. */
  readingMinutes: number;
  /** Reading time in seconds (rounded). */
  readingSeconds: number;
}

export function countText(text: string): TextCounts {
  const characters = [...text].length;
  const charactersNoSpaces = [...text.replace(/\s/g, '')].length;
  const trimmed = text.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const sentences = trimmed === '' ? 0 : trimmed.split(/[.!?।]+/).filter((s) => s.trim() !== '').length;
  const paragraphs = trimmed === '' ? 0 : trimmed.split(/\n\s*\n/).filter((p) => p.trim() !== '').length;
  const lines = text === '' ? 0 : text.split('\n').length;
  const readingMinutes = words / 200;
  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingMinutes,
    readingSeconds: Math.round(readingMinutes * 60),
  };
}

export type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'capitalized'
  | 'toggle'
  | 'camel'
  | 'snake'
  | 'kebab';

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.toLowerCase().replace(/\b[\p{L}\p{N}]/gu, (c) => c.toUpperCase());
    case 'sentence': {
      const lower = text.toLowerCase();
      return lower.replace(/(^\s*[\p{L}])|([.!?।]\s+[\p{L}])/gu, (c) => c.toUpperCase());
    }
    case 'capitalized':
      return text.replace(/\b[\p{L}]/gu, (c) => c.toUpperCase());
    case 'toggle':
      return [...text].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
    case 'camel':
    case 'snake':
    case 'kebab': {
      const words = text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map((word) => word.toLowerCase());
      if (mode === 'camel') {
        return words.map((word, i) => (i === 0 ? word : word[0].toUpperCase() + word.slice(1))).join('');
      }
      if (mode === 'snake') return words.join('_');
      return words.join('-');
    }
    default:
      return text;
  }
}

export interface DedupeOptions {
  ignoreCase?: boolean;
  trimLines?: boolean;
  sort?: boolean;
}

export interface DedupeResult {
  result: string;
  originalCount: number;
  uniqueCount: number;
  removed: number;
}

export function dedupeLines(text: string, options?: DedupeOptions): DedupeResult {
  const ignoreCase = options?.ignoreCase ?? false;
  const trimLines = options?.trimLines ?? true;
  const lines = text.split('\n').map((line) => (trimLines ? line.trim() : line));
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    const key = ignoreCase ? line.toLowerCase() : line;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }
  if (options?.sort) unique.sort((a, b) => a.localeCompare(b));
  return {
    result: unique.join('\n'),
    originalCount: lines.length,
    uniqueCount: unique.length,
    removed: lines.length - unique.length,
  };
}

export function removeExtraSpaces(text: string, removeBlankLines = false): string {
  let out = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');
  if (removeBlankLines) out = out.split('\n').filter((line) => line !== '').join('\n');
  return out;
}

export interface FindReplaceOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export interface FindReplaceResult {
  result: string;
  count: number;
}

export function findAndReplace(
  text: string,
  find: string,
  replace: string,
  options?: FindReplaceOptions,
): FindReplaceResult {
  if (find === '') return { result: text, count: 0 };
  let pattern: RegExp;
  if (options?.useRegex) {
    try {
      pattern = new RegExp(find, options?.caseSensitive ? 'g' : 'gi');
    } catch (err) {
      throw new Error(`Invalid regular expression: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const body = options?.wholeWord ? `\\b${escaped}\\b` : escaped;
    pattern = new RegExp(body, options?.caseSensitive ? 'g' : 'gi');
  }
  const matches = text.match(pattern);
  return { result: text.replace(pattern, replace), count: matches ? matches.length : 0 };
}

export type ReverseMode = 'characters' | 'words' | 'lines';

export function reverseText(text: string, mode: ReverseMode): string {
  if (mode === 'words') return text.split(/(\s+)/).reverse().join('');
  if (mode === 'lines') return text.split('\n').reverse().join('\n');
  return [...text].reverse().join('');
}

/* ------------------------------------------------------------ Text sorting */

export type SortMode = 'az' | 'za' | 'numeric' | 'length' | 'length-desc' | 'reverse' | 'shuffle';

export interface SortLinesOptions {
  mode: SortMode;
  dedupe?: 'none' | 'first' | 'last';
  ignoreCase?: boolean;
  trim?: boolean;
  blanks?: 'keep' | 'remove' | 'one';
}

export interface SortedLines {
  lines: string[];
  totalLines: number;
  nonBlank: number;
  distinct: number;
  duplicateOccurrences: number;
  duplicateGroups: number;
}

function banglaAwareCompare(a: string, b: string): number {
  // Bangla-aware collation: Intl.Collator('bn') orders Bangla correctly;
  // falls back gracefully for mixed text. Never sort Bangla with English collation.
  return new Intl.Collator('bn').compare(a, b);
}

/**
 * Sort/dedupe lines. `shuffle` uses crypto randomness when available
 * (falls back to Math.random only for ordering, never for secrets).
 * Hand-check: ["10","2","1"] numeric -> ["1","2","10"].
 */
export function sortTextLines(text: string, options: SortLinesOptions): SortedLines {
  const { mode, dedupe = 'none', ignoreCase = false, trim = false, blanks = 'keep' } = options;
  let lines = text.split('\n');
  const totalLines = lines.length;
  if (trim) lines = lines.map((l) => l.trim());
  const key = (l: string) => (ignoreCase ? l.toLowerCase() : l);
  const counts = new Map<string, number>();
  for (const l of lines) counts.set(key(l), (counts.get(key(l)) ?? 0) + 1);
  const nonBlank = lines.filter((l) => l.trim() !== '').length;
  const distinct = new Set(lines.filter((l) => l.trim() !== '').map(key)).size;
  let duplicateOccurrences = 0;
  let duplicateGroups = 0;
  counts.forEach((c) => {
    if (c > 1) {
      duplicateGroups += 1;
      duplicateOccurrences += c - 1;
    }
  });
  if (dedupe !== 'none') {
    const seen = new Set<string>();
    const kept: string[] = [];
    const order = dedupe === 'last' ? [...lines].reverse() : lines;
    for (const l of order) {
      const k = key(l);
      if (l.trim() === '' || !seen.has(k)) {
        seen.add(k);
        kept.push(l);
      }
    }
    lines = dedupe === 'last' ? kept.reverse() : kept;
  }
  if (blanks === 'remove') lines = lines.filter((l) => l.trim() !== '');
  else if (blanks === 'one') {
    const out: string[] = [];
    let prevBlank = false;
    for (const l of lines) {
      const blank = l.trim() === '';
      if (blank && prevBlank) continue;
      out.push(l);
      prevBlank = blank;
    }
    lines = out;
  }
  const numericAware = (a: string, b: string): number => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return banglaAwareCompare(a, b);
  };
  switch (mode) {
    case 'az':
      lines = [...lines].sort(banglaAwareCompare);
      break;
    case 'za':
      lines = [...lines].sort((a, b) => banglaAwareCompare(b, a));
      break;
    case 'numeric':
      lines = [...lines].sort(numericAware);
      break;
    case 'length':
      lines = [...lines].sort((a, b) => a.length - b.length || banglaAwareCompare(a, b));
      break;
    case 'length-desc':
      lines = [...lines].sort((a, b) => b.length - a.length || banglaAwareCompare(a, b));
      break;
    case 'reverse':
      lines = [...lines].reverse();
      break;
    case 'shuffle': {
      lines = [...lines];
      const cryptoObj = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : null;
      for (let idx = lines.length - 1; idx > 0; idx -= 1) {
        let j: number;
        if (cryptoObj) {
          const buf = new Uint32Array(1);
          cryptoObj.getRandomValues(buf);
          j = buf[0] % (idx + 1);
        } else {
          j = Math.floor(Math.random() * (idx + 1));
        }
        [lines[idx], lines[j]] = [lines[j], lines[idx]];
      }
      break;
    }
    default:
      break;
  }
  return { lines, totalLines, nonBlank, distinct, duplicateOccurrences, duplicateGroups };
}
