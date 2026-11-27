/**
 * Scientific Calculator — safe expression parser (tokenizer +
 * recursive-descent). NEVER eval() / new Function(). Supports
 * + - * / ^ % ( ) and sin cos tan asin acos atan log ln sqrt abs,
 * constants pi and e. Trig uses degrees by default (radians optional).
 * Pure functions only: no network, no storage, no DOM.
 */

export type AngleMode = 'deg' | 'rad';

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'fn'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i += 1; }
      const value = Number(num);
      if (!Number.isFinite(value) || num.split('.').length > 2) throw new Error(`Invalid number: ${num}`);
      tokens.push({ kind: 'num', value });
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      while (i < expr.length && /[a-zA-Z]/.test(expr[i])) { word += expr[i]; i += 1; }
      const lower = word.toLowerCase();
      if (lower === 'pi') { tokens.push({ kind: 'num', value: Math.PI }); continue; }
      if (lower === 'e') { tokens.push({ kind: 'num', value: Math.E }); continue; }
      if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'abs'].includes(lower)) {
        tokens.push({ kind: 'fn', value: lower });
        continue;
      }
      throw new Error(`Unknown name: ${word}`);
    }
    if ('+-*/^%'.includes(ch)) { tokens.push({ kind: 'op', value: ch }); i += 1; continue; }
    if (ch === '(') { tokens.push({ kind: 'lparen' }); i += 1; continue; }
    if (ch === ')') { tokens.push({ kind: 'rparen' }); i += 1; continue; }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

/** Evaluate an expression string. Hand-check: "2+3*4"=14, "sin(30)"=0.5 (deg), "2^3"=8. */
export function evaluateExpression(input: string, angleMode: AngleMode = 'deg'): number {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error('Enter an expression');
  let pos = 0;
  const peek = (): Token | undefined => tokens[pos];
  const toRad = (x: number): number => (angleMode === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number): number => (angleMode === 'deg' ? (x * 180) / Math.PI : x);

  function applyFn(name: string, x: number): number {
    switch (name) {
      case 'sin': return Math.sin(toRad(x));
      case 'cos': return Math.cos(toRad(x));
      case 'tan': return Math.tan(toRad(x));
      case 'asin': return fromRad(Math.asin(x));
      case 'acos': return fromRad(Math.acos(x));
      case 'atan': return fromRad(Math.atan(x));
      case 'log': return Math.log10(x);
      case 'ln': return Math.log(x);
      case 'sqrt': return Math.sqrt(x);
      case 'abs': return Math.abs(x);
      default: throw new Error(`Unknown function: ${name}`);
    }
  }

  function parseExpr(): number {
    let value = parseTerm();
    for (;;) {
      const t = peek();
      if (t && t.kind === 'op' && (t.value === '+' || t.value === '-')) {
        pos += 1;
        const rhs = parseTerm();
        value = t.value === '+' ? value + rhs : value - rhs;
      } else break;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    for (;;) {
      const t = peek();
      if (t && t.kind === 'op' && (t.value === '*' || t.value === '/' || t.value === '%')) {
        pos += 1;
        const rhs = parseFactor();
        if (t.value === '*') value *= rhs;
        else if (t.value === '/') {
          if (rhs === 0) throw new Error('Cannot divide by zero');
          value /= rhs;
        } else value %= rhs;
      } else break;
    }
    return value;
  }

  function parseFactor(): number {
    const t = peek();
    if (t && t.kind === 'op' && (t.value === '+' || t.value === '-')) {
      pos += 1;
      const v = parseFactor();
      return t.value === '-' ? -v : v;
    }
    let base = parsePrimary();
    const next = peek();
    if (next && next.kind === 'op' && next.value === '^') {
      pos += 1;
      const exp = parseFactor();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary(): number {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.kind === 'num') { pos += 1; return t.value; }
    if (t.kind === 'fn') {
      pos += 1;
      const open = peek();
      if (!open || open.kind !== 'lparen') throw new Error(`Expected ( after ${t.value}`);
      pos += 1;
      const arg = parseExpr();
      const close = peek();
      if (!close || close.kind !== 'rparen') throw new Error(`Missing ) after ${t.value}(`);
      pos += 1;
      return applyFn(t.value, arg);
    }
    if (t.kind === 'lparen') {
      pos += 1;
      const v = parseExpr();
      const close = peek();
      if (!close || close.kind !== 'rparen') throw new Error('Missing closing )');
      pos += 1;
      return v;
    }
    throw new Error(`Unexpected token: ${t.kind === 'op' ? t.value : t.kind}`);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error('Unexpected extra input after the expression');
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number');
  return result;
}

/** Round for display (12 significant digits, trims float noise). */
export function formatCalcResult(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  return String(Math.round(value * 1e12) / 1e12);
}
