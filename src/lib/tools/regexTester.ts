/**
 * Regex Tester — native JS RegExp with try/catch. NEVER evals user code.
 * Pure functions, no DOM.
 */
export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

export interface RegexTestResult {
  valid: boolean;
  error?: string;
  matches: RegexMatch[];
  total: number;
}

const VALID_FLAGS = new Set(['g', 'i', 'm', 's', 'u', 'y']);

export function testRegex(pattern: string, flags: string, text: string): RegexTestResult {
  for (const flag of flags) {
    if (!VALID_FLAGS.has(flag)) {
      return { valid: false, error: `Invalid flag "${flag}". Allowed flags: g i m s u y.`, matches: [], total: 0 };
    }
  }
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Invalid regular expression.', matches: [], total: 0 };
  }
  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(text)) !== null && guard < 500) {
    guard += 1;
    matches.push({ match: m[0], index: m.index, groups: m.slice(1).map((g) => g ?? '') });
    if (m[0] === '') re.lastIndex += 1;
  }
  return { valid: true, matches, total: matches.length };
}

export function replaceWithRegex(pattern: string, flags: string, text: string, replacement: string): { result: string; error?: string } {
  try {
    const re = new RegExp(pattern, flags);
    return { result: text.replace(re, replacement) };
  } catch (err) {
    return { result: text, error: err instanceof Error ? err.message : 'Invalid regular expression.' };
  }
}
