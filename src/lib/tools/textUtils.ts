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
