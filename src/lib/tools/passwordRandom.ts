// SECURITY RULE: all randomness for secrets uses crypto.getRandomValues.
// Math.random MUST NOT appear in this file (the test file greps for it).

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?';
const AMBIGUOUS = new Set(['0', 'O', '1', 'l', 'I', '|']);

function cryptoInt(bound: number): number {
  // Unbiased rejection sampling on crypto randomness.
  if (!Number.isInteger(bound) || bound <= 0) throw new Error('Bound must be a positive integer');
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('This browser does not provide secure random numbers — password generation is unavailable here');
  }
  const range = 0xffffffff;
  const limit = range - (range % bound);
  const buf = new Uint32Array(1);
  for (;;) {
    cryptoObj.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % bound;
  }
}

export interface PasswordOptions {
  length?: number; // default 16, range 8-64
  lower?: boolean; // default true
  upper?: boolean; // default true
  digits?: boolean; // default true
  symbols?: boolean; // default true
  avoidAmbiguous?: boolean; // default false
}

/** Generate a password. Guarantees >=1 char from every enabled set. */
export function generatePassword(options: PasswordOptions = {}): string {
  const length = options.length ?? 16;
  const useLower = options.lower ?? true;
  const useUpper = options.upper ?? true;
  const useDigits = options.digits ?? true;
  const useSymbols = options.symbols ?? true;
  if (!Number.isInteger(length) || length < 8 || length > 64) {
    throw new Error(`Password length must be 8-64, got ${length}`);
  }
  const sets: string[] = [];
  if (useLower) sets.push(LOWER);
  if (useUpper) sets.push(UPPER);
  if (useDigits) sets.push(DIGITS);
  if (useSymbols) sets.push(SYMBOLS);
  if (sets.length === 0) throw new Error('Turn on at least one character set');
  const clean = (s: string) =>
    options.avoidAmbiguous ? [...s].filter((c) => !AMBIGUOUS.has(c)).join('') : s;
  const cleaned = sets.map(clean);
  if (cleaned.some((s) => s === '')) throw new Error('A character set became empty after removing ambiguous characters');
  const pool = cleaned.join('');
  const chars: string[] = [];
  // One guaranteed char per enabled set, then fill, then shuffle (Fisher-Yates).
  for (const s of cleaned) chars.push(s[cryptoInt(s.length)]);
  while (chars.length < length) chars.push(pool[cryptoInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = cryptoInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/* ------------------------------------------------------- Password strength */

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  entropyBits: number;
  crackTimeText: string;
  issues: string[];
  suggestions: string[];
}

const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', '12345678', '12345', '1234567', 'qwerty',
  'abc123', '111111', '123123', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'sunshine', 'princess', 'football', 'charlie', 'bangladesh', 'dhaka123',
  'bangladesh123', 'password123', '1234', '000000', 'iloveyou', 'trustno1',
]);

function crackTimeText(bits: number): string {
  // Offline attack at 10 billion guesses/second. Online attacks are far slower.
  const guessesPerSecond = 1e10;
  const seconds = Math.pow(2, bits) / guessesPerSecond;
  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31557600) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31557600;
  if (years < 100) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`;
  return 'centuries';
}

/**
 * zxcvbn-STYLE estimate WITHOUT the zxcvbn dep (its frequency lists are heavy).
 * This is an estimate, not a guarantee — the UI must say so.
 */
export function passwordStrength(pw: string): PasswordStrength {
  const issues: string[] = [];
  const suggestions: string[] = [];
  if (pw === '') {
    return { score: 0, label: 'Very weak', entropyBits: 0, crackTimeText: 'instantly', issues: ['Type a password first'], suggestions: [] };
  }
  const lower = COMMON_PASSWORDS.has(pw.toLowerCase());
  if (lower) issues.push('This is one of the most common passwords');
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  const entropyBits = Math.round(pw.length * Math.log2(Math.max(pool, 2)) * 10) / 10;
  if (/(.)\1{2,}/.test(pw)) issues.push('Repeated characters (like "aaa") add little strength');
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i.test(pw)) {
    issues.push('Contains a simple sequence (like "1234" or "abcd")');
  }
  if (/^(19|20)\d{2}/.test(pw) || /(19|20)\d{2}$/.test(pw)) issues.push('Looks like it contains a year');
  if (pw.length < 8) {
    issues.push('Shorter than 8 characters');
    suggestions.push('Use at least 12 characters — length helps most');
  }
  if (pool <= 26) suggestions.push('Mix upper- and lower-case letters');
  if (!/[0-9]/.test(pw)) suggestions.push('Add some digits');
  if (!/[^A-Za-z0-9]/.test(pw)) suggestions.push('Add a symbol (!, @, #, …)');
  if (suggestions.length === 0) suggestions.push('This is a solid password — still, use a different one per site');
  let score: 0 | 1 | 2 | 3 | 4;
  if (lower || pw.length < 6) score = 0;
  else if (entropyBits < 28) score = 1;
  else if (entropyBits < 45) score = 2;
  else if (entropyBits < 65) score = 3;
  else score = 4;
  if (issues.length > 0 && score > 2) score = 2;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  return { score, label: labels[score], entropyBits, crackTimeText: crackTimeText(entropyBits), issues, suggestions };
}

/* ------------------------------------------------------------ Random numbers */

/** Unbiased crypto random integer in [min, max]. */
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error(`Min and max must be whole numbers — got ${min} and ${max}`);
  }
  if (min > max) throw new Error(`Min (${min}) is bigger than max (${max}) — swap them`);
  return min + cryptoInt(max - min + 1);
}

export function randomInts(count: number, min: number, max: number, unique = false): number[] {
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error(`Count must be 1-100, got ${count}`);
  }
  if (unique && max - min + 1 < count) {
    throw new Error(`Cannot pick ${count} unique numbers between ${min} and ${max} — only ${max - min + 1} exist`);
  }
  if (!unique) return Array.from({ length: count }, () => randomInt(min, max));
  const picked = new Set<number>();
  while (picked.size < count) picked.add(randomInt(min, max));
  return [...picked];
}

/** Fisher-Yates shuffle with crypto randomness. Unicode-safe (array of items, not code units). */
export function shuffleFair<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = cryptoInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Fair rotation picker: returns names in a shuffled order with no repeats
 * until everyone has had a turn. Caller stores the queue + index.
 */
export function makeFairQueue(names: readonly string[]): string[] {
  if (names.length === 0) throw new Error('Add at least one name first');
  return shuffleFair(names);
}
