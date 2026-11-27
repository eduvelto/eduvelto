// Eduvelto — Main-tables batch engines (27 Nov 2026).
// Pure functions only: HTML entities, CSV→JSON, SQL formatting and the
// worked-example calculators behind the Math & Physics Formulas tool.
// No React, no DOM, no network.

/* ---------------- HTML entities ---------------- */

const NAMED_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

const NAMED_DECODE: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  times: '×',
  divide: '÷',
  plusmn: '±',
  deg: '°',
  micro: 'µ',
  para: '¶',
  sect: '§',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  curren: '¤',
  brvbar: '¦',
  uml: '¨',
  ordf: 'ª',
  ordm: 'º',
  iexcl: '¡',
  iquest: '¿',
  szlig: 'ß',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  yuml: 'ÿ',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  pi: 'π',
  sigma: 'σ',
  omega: 'ω',
  infin: '∞',
  ne: '≠',
  le: '≤',
  ge: '≥',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
};

export function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => NAMED_ENTITIES[ch] ?? ch);
}

export function encodeHtmlEntitiesNumeric(text: string): string {
  let out = '';
  for (const ch of text) {
    if (NAMED_ENTITIES[ch]) out += NAMED_ENTITIES[ch];
    else if (ch.codePointAt(0)! > 127) out += `&#${ch.codePointAt(0)};`;
    else out += ch;
  }
  return out;
}

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_DECODE[body] ?? match;
  });
}

/* ---------------- CSV → JSON ---------------- */

/** Split one CSV line respecting double-quoted fields ("" = literal "). */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

export interface CsvToJsonResult {
  json: string | null;
  rows: number;
  error: string | null;
}

export function csvToJson(csv: string, pretty = true): CsvToJsonResult {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return { json: null, rows: 0, error: 'Empty input — paste CSV text first.' };
  if (lines.length === 1) return { json: null, rows: 0, error: 'Only a header row was found — add at least one data row.' };
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  if (headers.some((h) => h === '')) {
    return { json: null, rows: 0, error: 'The header row has an empty column name.' };
  }
  const seen = new Set<string>();
  for (const h of headers) {
    if (seen.has(h)) return { json: null, rows: 0, error: `Duplicate header name: "${h}".` };
    seen.add(h);
  }
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length !== headers.length) {
      return {
        json: null,
        rows: 0,
        error: `Row ${i + 1} has ${fields.length} fields but the header has ${headers.length}. Check commas and quotes.`,
      };
    }
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => {
      obj[h] = fields[j];
    });
    rows.push(obj);
  }
  return { json: pretty ? JSON.stringify(rows, null, 2) : JSON.stringify(rows), rows: rows.length, error: null };
}

/* ---------------- SQL formatter ---------------- */

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'BY', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP',
  'ALTER', 'ADD', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
  'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN', 'AS', 'DISTINCT', 'ALL',
  'UNION', 'EXCEPT', 'INTERSECT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'INDEX', 'IF', 'EXISTS',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
]);

const CLAUSE_STARTERS = new Set(['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON']);

/** Tokenize SQL, keeping quoted strings and comments intact. */
export function tokenizeSql(sql: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i);
      tokens.push(sql.slice(i, end === -1 ? sql.length : end));
      i = end === -1 ? sql.length : end;
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      tokens.push(sql.slice(i, end === -1 ? sql.length : end + 2));
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) j += 2;
          else break;
        } else j++;
      }
      tokens.push(sql.slice(i, Math.min(j + 1, sql.length)));
      i = Math.min(j + 1, sql.length);
      continue;
    }
    if (/[(),;.*=<>!+\/-]/.test(ch)) {
      // Two-char operators.
      const two = sql.slice(i, i + 2);
      if (['<=', '>=', '<>', '!=', '||'].includes(two)) {
        tokens.push(two);
        i += 2;
      } else {
        tokens.push(ch);
        i++;
      }
      continue;
    }
    let j = i;
    while (j < sql.length && /[A-Za-z0-9_.$#@]/.test(sql[j])) j++;
    if (j === i) {
      tokens.push(ch);
      i++;
    } else {
      tokens.push(sql.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

/** Small tokenizer-based SQL formatter: uppercase keywords, one clause per line, indent. */
export function formatSql(sql: string): string {
  const trimmed = sql.trim();
  if (!trimmed) return '';
  const tokens = tokenizeSql(trimmed);
  // Merge multi-word clause starters (GROUP BY, ORDER BY, LEFT JOIN, ...).
  const merged: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const upper = tokens[i].toUpperCase();
    const next = tokens[i + 1]?.toUpperCase() ?? '';
    const pair = `${upper} ${next}`;
    if (CLAUSE_STARTERS.has(pair)) {
      merged.push(pair);
      i++;
    } else {
      merged.push(tokens[i]);
    }
  }
  const lines: string[] = [];
  let current = '';
  let depth = 0;
  const flush = () => {
    if (current.trim() !== '') lines.push('  '.repeat(depth) + current.trim());
    current = '';
  };
  for (const raw of merged) {
    const upper = raw.toUpperCase();
    if (raw === '(') {
      current += current === '' ? '(' : ' (';
      depth++;
      flush();
      continue;
    }
    if (raw === ')') {
      depth = Math.max(0, depth - 1);
      flush();
      current = ')';
      continue;
    }
    if (raw === ',') {
      current += ',';
      flush();
      continue;
    }
    if (raw === ';') {
      current += ';';
      flush();
      continue;
    }
    if (CLAUSE_STARTERS.has(upper)) {
      flush();
      current = upper;
      continue;
    }
    if (SQL_KEYWORDS.has(upper) && /^[A-Za-z]+$/.test(raw)) {
      current += (current === '' ? '' : ' ') + upper;
      continue;
    }
    if (raw === '*') {
      current += current === '' ? '*' : ' *';
      continue;
    }
    current += (current === '' ? '' : ' ') + raw;
  }
  flush();
  return lines.join('\n');
}

/* ---------------- Formula worked-example calculators ---------------- */

export type FormulaId =
  | 'pythagoras'
  | 'circle-area'
  | 'triangle-area'
  | 'rectangle-area'
  | 'speed'
  | 'force'
  | 'kinetic-energy'
  | 'potential-energy'
  | 'work'
  | 'power'
  | 'ohms-law'
  | 'quadratic'
  | 'trig-identity';

export function computeFormula(id: FormulaId, v: Record<string, number>): { value: number; unit: string; steps: string } | null {
  const n = (k: string) => v[k];
  switch (id) {
    case 'pythagoras': {
      const a = n('a');
      const b = n('b');
      if (!(a > 0 && b > 0)) return null;
      const c = Math.sqrt(a * a + b * b);
      return { value: c, unit: '', steps: `c = √(${a}² + ${b}²) = √${(a * a + b * b).toFixed(2)}` };
    }
    case 'circle-area': {
      const r = n('r');
      if (!(r > 0)) return null;
      return { value: Math.PI * r * r, unit: '²', steps: `A = π × ${r}²` };
    }
    case 'triangle-area': {
      const base = n('base');
      const h = n('height');
      if (!(base > 0 && h > 0)) return null;
      return { value: 0.5 * base * h, unit: '²', steps: `A = ½ × ${base} × ${h}` };
    }
    case 'rectangle-area': {
      const l = n('length');
      const w = n('width');
      if (!(l > 0 && w > 0)) return null;
      return { value: l * w, unit: '²', steps: `A = ${l} × ${w}` };
    }
    case 'speed': {
      const d = n('distance');
      const t = n('time');
      if (!(d >= 0 && t > 0)) return null;
      return { value: d / t, unit: 'm/s', steps: `v = ${d} ÷ ${t}` };
    }
    case 'force': {
      const m = n('mass');
      const a = n('acceleration');
      if (!(m >= 0 && a >= 0)) return null;
      return { value: m * a, unit: 'N', steps: `F = ${m} × ${a}` };
    }
    case 'kinetic-energy': {
      const m = n('mass');
      const vel = n('velocity');
      if (!(m >= 0 && vel >= 0)) return null;
      return { value: 0.5 * m * vel * vel, unit: 'J', steps: `KE = ½ × ${m} × ${vel}²` };
    }
    case 'potential-energy': {
      const m = n('mass');
      const h = n('height');
      if (!(m >= 0 && h >= 0)) return null;
      return { value: m * 9.8 * h, unit: 'J', steps: `PE = ${m} × 9.8 × ${h}` };
    }
    case 'work': {
      const f = n('force');
      const d = n('distance');
      if (!(f >= 0 && d >= 0)) return null;
      return { value: f * d, unit: 'J', steps: `W = ${f} × ${d}` };
    }
    case 'power': {
      const w = n('work');
      const t = n('time');
      if (!(w >= 0 && t > 0)) return null;
      return { value: w / t, unit: 'W', steps: `P = ${w} ÷ ${t}` };
    }
    case 'ohms-law': {
      const i = n('current');
      const r = n('resistance');
      if (!(i >= 0 && r >= 0)) return null;
      return { value: i * r, unit: 'V', steps: `V = ${i} × ${r}` };
    }
    case 'trig-identity': {
      const deg = n('angle');
      if (!Number.isFinite(deg)) return null;
      const rad = (deg * Math.PI) / 180;
      const val = Math.sin(rad) ** 2 + Math.cos(rad) ** 2;
      return { value: val, unit: '', steps: `sin²${deg}° + cos²${deg}° = ${val.toFixed(6)} ≈ 1` };
    }
    case 'quadratic': {
      const a = n('a');
      const b = n('b');
      const c = n('c');
      if (a === 0 || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return null;
      const disc = b * b - 4 * a * c;
      if (disc < 0) return { value: Number.NaN, unit: '', steps: `D = ${b}² − 4×${a}×${c} = ${disc} < 0 — no real roots` };
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      return { value: r1, unit: '', steps: `D = ${disc}; x₁ = ${r1.toFixed(4)}, x₂ = ${r2.toFixed(4)}` };
    }
    default:
      return null;
  }
}

/** Day-of-year index (1-based) for the daily-quote rotation. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}
