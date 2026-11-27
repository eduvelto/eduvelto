// Eduvelto — Math tools engine (25 tools, batch Math, 27 Nov 2026).
// Pure functions only: no React, no network, no storage.
// Every function returns null on invalid user input — never throws.
// Limits are honest: they exist where a plain double would overflow
// or a loop would run too long, and the UI states them.

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

export function lcmTwo(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
}

/** Parse a pasted list of numbers (commas, spaces or new lines). */
export function parseNumberList(text: string): number[] | null {
  const parts = text.split(/[\s,;]+/).filter((p) => p.length > 0);
  if (parts.length === 0) return null;
  const nums: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n)) return null;
    nums.push(n);
  }
  return nums;
}

function isInt(n: number): boolean {
  return Number.isInteger(n);
}

function round6(n: number): number {
  const r = Math.round(n * 1e6) / 1e6;
  return r === 0 ? 0 : r;
}

// ---------------------------------------------------------------- fractions
export interface FractionResult {
  num: number;
  den: number;
  /** e.g. "3/4" or "1 1/2" for improper results. */
  text: string;
  decimal: number;
}

function simplifyFraction(num: number, den: number): FractionResult | null {
  if (!isInt(num) || !isInt(den) || den === 0) return null;
  if (num === 0) return { num: 0, den: 1, text: '0', decimal: 0 };
  const g = gcd(num, den);
  let n = num / g;
  let d = den / g;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const whole = Math.trunc(n / d);
  const rem = Math.abs(n % d);
  const text = d === 1 ? `${n}` : whole !== 0 ? `${whole} ${rem}/${d}` : `${n}/${d}`;
  return { num: n, den: d, text, decimal: round6(n / d) };
}

export function fractionAdd(aNum: number, aDen: number, bNum: number, bDen: number): FractionResult | null {
  if (!isInt(aNum) || !isInt(aDen) || !isInt(bNum) || !isInt(bDen) || aDen === 0 || bDen === 0) return null;
  return simplifyFraction(aNum * bDen + bNum * aDen, aDen * bDen);
}

export function fractionSubtract(aNum: number, aDen: number, bNum: number, bDen: number): FractionResult | null {
  if (!isInt(aNum) || !isInt(aDen) || !isInt(bNum) || !isInt(bDen) || aDen === 0 || bDen === 0) return null;
  return simplifyFraction(aNum * bDen - bNum * aDen, aDen * bDen);
}

export function fractionMultiply(aNum: number, aDen: number, bNum: number, bDen: number): FractionResult | null {
  if (!isInt(aNum) || !isInt(aDen) || !isInt(bNum) || !isInt(bDen) || aDen === 0 || bDen === 0) return null;
  return simplifyFraction(aNum * bNum, aDen * bDen);
}

export function fractionDivide(aNum: number, aDen: number, bNum: number, bDen: number): FractionResult | null {
  if (!isInt(aNum) || !isInt(aDen) || !isInt(bNum) || !isInt(bDen) || aDen === 0 || bDen === 0 || bNum === 0) return null;
  return simplifyFraction(aNum * bDen, aDen * bNum);
}

// ---------------------------------------------------------------- statistics
export interface AverageResult {
  mean: number;
  sum: number;
  count: number;
  min: number;
  max: number;
}

export function averageOf(values: number[]): AverageResult | null {
  if (values.length === 0 || values.some((v) => !Number.isFinite(v))) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return { mean: round6(sum / values.length), sum: round6(sum), count: values.length, min: Math.min(...values), max: Math.max(...values) };
}

export interface MedianModeResult {
  median: number;
  modes: number[];
  count: number;
  sorted: number[];
}

export function medianModeOf(values: number[]): MedianModeResult | null {
  if (values.length === 0 || values.some((v) => !Number.isFinite(v))) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 === 1 ? sorted[(n - 1) / 2] : round6((sorted[n / 2 - 1] + sorted[n / 2]) / 2);
  const freq = new Map<number, number>();
  for (const v of sorted) freq.set(v, (freq.get(v) ?? 0) + 1);
  const top = Math.max(...freq.values());
  const modes = top > 1 ? [...freq.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b) : [];
  return { median, modes, count: n, sorted };
}

export interface StdDevResult {
  mean: number;
  count: number;
  populationVariance: number;
  populationSd: number;
  /** null when fewer than 2 values — sample SD needs n ≥ 2. */
  sampleVariance: number | null;
  sampleSd: number | null;
}

export function standardDeviationOf(values: number[]): StdDevResult | null {
  if (values.length === 0 || values.some((v) => !Number.isFinite(v))) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  const popVar = sq / values.length;
  const n = values.length;
  return {
    mean: round6(mean),
    count: n,
    populationVariance: round6(popVar),
    populationSd: round6(Math.sqrt(popVar)),
    sampleVariance: n >= 2 ? round6(sq / (n - 1)) : null,
    sampleSd: n >= 2 ? round6(Math.sqrt(sq / (n - 1))) : null,
  };
}

// ---------------------------------------------------------------- ratio / proportion
export interface RatioResult {
  a: number;
  b: number;
  text: string;
}

export function simplifyRatio(a: number, b: number): RatioResult | null {
  if (!isInt(a) || !isInt(b) || a === 0 || b === 0) return null;
  const g = gcd(a, b);
  const x = a / g;
  const y = b / g;
  const sign = x * y < 0 ? '-' : '';
  return { a: Math.abs(x), b: Math.abs(y), text: `${sign}${Math.abs(x)} : ${Math.abs(y)}` };
}

/** Solve a/b = c/x for x. */
export function solveRatio(a: number, b: number, c: number): number | null {
  if (![a, b, c].every((v) => Number.isFinite(v)) || a === 0) return null;
  const x = (b * c) / a;
  return Number.isFinite(x) ? round6(x) : null;
}

/** Solve a/b = c/x for x (proportion form). */
export function solveProportion(a: number, b: number, c: number): number | null {
  return solveRatio(a, b, c);
}

// ---------------------------------------------------------------- percentage change
export interface PercentageChangeResult {
  change: number;
  percent: number;
  direction: 'increase' | 'decrease' | 'same';
}

export function percentageChange(oldValue: number, newValue: number): PercentageChangeResult | null {
  if (!Number.isFinite(oldValue) || !Number.isFinite(newValue) || oldValue === 0) return null;
  const change = round6(newValue - oldValue);
  const percent = round6(((newValue - oldValue) / Math.abs(oldValue)) * 100);
  return { change, percent, direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same' };
}

// ---------------------------------------------------------------- roots / powers / logs
export interface RootsResult {
  /** null for a negative input — no real square root. */
  sqrt: number | null;
  cbrt: number;
}

export function sqrtCbrt(x: number): RootsResult | null {
  if (!Number.isFinite(x)) return null;
  return { sqrt: x < 0 ? null : round6(Math.sqrt(x)), cbrt: round6(Math.cbrt(x)) };
}

export interface PowerResult {
  result: number;
  steps: string[];
}

export function powerOf(base: number, exponent: number): PowerResult | null {
  if (!Number.isFinite(base) || !Number.isFinite(exponent) || Math.abs(exponent) > 1000) return null;
  const result = base ** exponent;
  if (!Number.isFinite(result)) return null;
  const steps: string[] = [];
  if (isInt(exponent) && exponent >= 0 && exponent <= 10 && Math.abs(base) <= 1000) {
    if (exponent === 0) steps.push(`${base}⁰ = 1`);
    else {
      const expanded = Array.from({ length: exponent }, () => `${base}`).join(' × ');
      steps.push(`${base}^${exponent} = ${expanded} = ${round6(result)}`);
    }
  } else if (isInt(exponent) && exponent < 0 && exponent >= -10) {
    steps.push(`${base}^${exponent} = 1 ÷ ${base}^${Math.abs(exponent)} = ${round6(result)}`);
  } else {
    steps.push(`${base}^${exponent} = ${round6(result)}`);
  }
  return { result: round6(result), steps };
}

export interface LogResult {
  log: number;
  ln: number;
  log10: number;
}

export function logarithmOf(value: number, base: number): LogResult | null {
  if (!Number.isFinite(value) || !Number.isFinite(base) || value <= 0 || base <= 0 || base === 1) return null;
  return { log: round6(Math.log(value) / Math.log(base)), ln: round6(Math.log(value)), log10: round6(Math.log10(value)) };
}

// ---------------------------------------------------------------- equations
export interface QuadraticResult {
  discriminant: number;
  nature: 'two-real' | 'one-real' | 'complex';
  /** [root1, root2]; for complex roots the imaginary part is in `im`. */
  roots: Array<{ re: number; im: number }>;
  steps: string[];
}

export function solveQuadratic(a: number, b: number, c: number): QuadraticResult | null {
  if (![a, b, c].every((v) => Number.isFinite(v)) || a === 0) return null;
  const d = round6(b * b - 4 * a * c);
  const stepsBn: string[] = [
    `D = b² − 4ac = ${b}² − 4 × ${a} × ${c} = ${d}`,
  ];
  if (d > 0) {
    const s = Math.sqrt(d);
    const r1 = round6((-b + s) / (2 * a));
    const r2 = round6((-b - s) / (2 * a));
    stepsBn.push(`x = (−b ± √D) ÷ 2a = (${-b} ± ${round6(s)}) ÷ ${2 * a}`);
    return { discriminant: d, nature: 'two-real', roots: [{ re: r1, im: 0 }, { re: r2, im: 0 }], steps: stepsBn };
  }
  if (d === 0) {
    const r = round6(-b / (2 * a));
    stepsBn.push(`x = −b ÷ 2a = ${-b} ÷ ${2 * a} = ${r}`);
    return { discriminant: d, nature: 'one-real', roots: [{ re: r, im: 0 }, { re: r, im: 0 }], steps: stepsBn };
  }
  const re = round6(-b / (2 * a));
  const im = round6(Math.sqrt(-d) / (2 * a));
  stepsBn.push(`D < 0, তাই বাস্তব মূল নেই — জটিল মূল: x = ${re} ± ${im}i`);
  return { discriminant: d, nature: 'complex', roots: [{ re, im }, { re, im: -im }], steps: stepsBn };
}

export interface LinearResult {
  kind: 'unique' | 'none' | 'infinite';
  x: number | null;
  steps: string[];
}

export function solveLinear(a: number, b: number, c: number, d: number): LinearResult | null {
  if (![a, b, c, d].every((v) => Number.isFinite(v))) return null;
  const steps = [`${a}x + ${b} = ${c}x + ${d}`];
  if (a === c) {
    if (b === d) {
      steps.push('দুই পাশের x-এর সহগ সমান ও ধ্রুবক সমান — অসংখ্য সমাধান।');
      return { kind: 'infinite', x: null, steps };
    }
    steps.push('দুই পাশের x-এর সহগ সমান কিন্তু ধ্রুবক আলাদা — কোনো সমাধান নেই।');
    return { kind: 'none', x: null, steps };
  }
  const x = round6((d - b) / (a - c));
  steps.push(`x = (${d} − ${b}) ÷ (${a} − ${c}) = ${x}`);
  return { kind: 'unique', x, steps };
}

// ---------------------------------------------------------------- geometry
export type AreaShape = 'rectangle' | 'circle' | 'triangle' | 'square' | 'parallelogram' | 'trapezium' | 'ellipse';

export interface AreaResult {
  area: number;
  formula: string;
}

export function areaOf(shape: AreaShape, dims: { length?: number; width?: number; radius?: number; base?: number; height?: number; side?: number; a?: number; b?: number }): AreaResult | null {
  const pos = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  switch (shape) {
    case 'rectangle':
      if (!pos(dims.length) || !pos(dims.width)) return null;
      return { area: round6(dims.length * dims.width), formula: `দৈর্ঘ্য × প্রস্থ = ${dims.length} × ${dims.width}` };
    case 'circle':
      if (!pos(dims.radius)) return null;
      return { area: round6(Math.PI * dims.radius * dims.radius), formula: `π × r² = π × ${dims.radius}²` };
    case 'triangle':
      if (!pos(dims.base) || !pos(dims.height)) return null;
      return { area: round6((dims.base * dims.height) / 2), formula: `½ × ভূমি × উচ্চতা = ½ × ${dims.base} × ${dims.height}` };
    case 'square':
      if (!pos(dims.side)) return null;
      return { area: round6(dims.side * dims.side), formula: `বাহু² = ${dims.side}²` };
    case 'parallelogram':
      if (!pos(dims.base) || !pos(dims.height)) return null;
      return { area: round6(dims.base * dims.height), formula: `ভূমি × উচ্চতা = ${dims.base} × ${dims.height}` };
    case 'trapezium':
      if (!pos(dims.a) || !pos(dims.b) || !pos(dims.height)) return null;
      return { area: round6(((dims.a + dims.b) / 2) * dims.height), formula: `½ × (a + b) × উচ্চতা = ½ × (${dims.a} + ${dims.b}) × ${dims.height}` };
    case 'ellipse':
      if (!pos(dims.a) || !pos(dims.b)) return null;
      return { area: round6(Math.PI * dims.a * dims.b), formula: `π × a × b = π × ${dims.a} × ${dims.b}` };
    default:
      return null;
  }
}

export type VolumeShape = 'cube' | 'cuboid' | 'cylinder' | 'sphere' | 'cone' | 'pyramid';

export interface VolumeResult {
  volume: number;
  formula: string;
}

export function volumeOf(shape: VolumeShape, dims: { side?: number; length?: number; width?: number; height?: number; radius?: number }): VolumeResult | null {
  const pos = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  switch (shape) {
    case 'cube':
      if (!pos(dims.side)) return null;
      return { volume: round6(dims.side ** 3), formula: `বাহু³ = ${dims.side}³` };
    case 'cuboid':
      if (!pos(dims.length) || !pos(dims.width) || !pos(dims.height)) return null;
      return { volume: round6(dims.length * dims.width * dims.height), formula: `দৈর্ঘ্য × প্রস্থ × উচ্চতা = ${dims.length} × ${dims.width} × ${dims.height}` };
    case 'cylinder':
      if (!pos(dims.radius) || !pos(dims.height)) return null;
      return { volume: round6(Math.PI * dims.radius * dims.radius * dims.height), formula: `π × r² × h = π × ${dims.radius}² × ${dims.height}` };
    case 'sphere':
      if (!pos(dims.radius)) return null;
      return { volume: round6((4 / 3) * Math.PI * dims.radius ** 3), formula: `(4/3) × π × r³ = (4/3) × π × ${dims.radius}³` };
    case 'cone':
      if (!pos(dims.radius) || !pos(dims.height)) return null;
      return { volume: round6((1 / 3) * Math.PI * dims.radius * dims.radius * dims.height), formula: `(1/3) × π × r² × h = (1/3) × π × ${dims.radius}² × ${dims.height}` };
    case 'pyramid':
      if (!pos(dims.length) || !pos(dims.width) || !pos(dims.height)) return null;
      return { volume: round6((dims.length * dims.width * dims.height) / 3), formula: `(1/3) × ভূমির ক্ষেত্রফল × উচ্চতা = (1/3) × ${dims.length} × ${dims.width} × ${dims.height}` };
    default:
      return null;
  }
}

export interface PythagorasResult {
  missing: 'a' | 'b' | 'c';
  value: number;
  formula: string;
}

/** Exactly one of a, b, c must be null (the missing side). c is the hypotenuse. */
export function pythagoras(a: number | null, b: number | null, c: number | null): PythagorasResult | null {
  const known = [a, b, c].filter((v) => v !== null).length;
  if (known !== 2) return null;
  const pos = (v: number | null): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  if (c === null) {
    if (!pos(a) || !pos(b)) return null;
    return { missing: 'c', value: round6(Math.sqrt(a * a + b * b)), formula: `c = √(a² + b²) = √(${a}² + ${b}²)` };
  }
  if (a === null) {
    if (!pos(b) || !pos(c) || c <= b) return null;
    return { missing: 'a', value: round6(Math.sqrt(c * c - b * b)), formula: `a = √(c² − b²) = √(${c}² − ${b}²)` };
  }
  if (!pos(a) || !pos(c) || c <= a) return null;
  return { missing: 'b', value: round6(Math.sqrt(c * c - a * a)), formula: `b = √(c² − a²) = √(${c}² − ${a}²)` };
}

export interface TriangleSides {
  a?: number;
  b?: number;
  c?: number;
  A?: number;
  B?: number;
  C?: number;
}

export interface TriangleResult {
  a: number;
  b: number;
  c: number;
  A: number;
  B: number;
  C: number;
}

const deg = (r: number): number => (r * 180) / Math.PI;
const rad = (d: number): number => (d * Math.PI) / 180;

/** Solve a triangle from SSS, SAS (two sides + included angle) or ASA/AAS. Angles in degrees. */
export function solveTriangle(input: TriangleSides): TriangleResult | null {
  const num = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  const ang = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 180;
  const a = num(input.a) ? input.a : undefined;
  const b = num(input.b) ? input.b : undefined;
  const c = num(input.c) ? input.c : undefined;
  const A = ang(input.A) ? input.A : undefined;
  const B = ang(input.B) ? input.B : undefined;
  const C = ang(input.C) ? input.C : undefined;

  const finish = (r: TriangleResult): TriangleResult | null => {
    const sides = [r.a, r.b, r.c];
    const angles = [r.A, r.B, r.C];
    if (sides.some((v) => !Number.isFinite(v) || v <= 0)) return null;
    if (angles.some((v) => !Number.isFinite(v) || v <= 0 || v >= 180)) return null;
    if (Math.abs(angles[0] + angles[1] + angles[2] - 180) > 0.01) return null;
    if (!(r.a + r.b > r.c && r.a + r.c > r.b && r.b + r.c > r.a)) return null;
    return { a: round6(r.a), b: round6(r.b), c: round6(r.c), A: round6(r.A), B: round6(r.B), C: round6(r.C) };
  };

  // SSS
  if (a !== undefined && b !== undefined && c !== undefined) {
    if (!(a + b > c && a + c > b && b + c > a)) return null;
    const A2 = deg(Math.acos(Math.min(1, Math.max(-1, (b * b + c * c - a * a) / (2 * b * c)))));
    const B2 = deg(Math.acos(Math.min(1, Math.max(-1, (a * a + c * c - b * b) / (2 * a * c)))));
    return finish({ a, b, c, A: A2, B: B2, C: 180 - A2 - B2 });
  }
  // SAS: two sides + included angle
  if (a !== undefined && b !== undefined && C !== undefined) {
    const c2 = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(C)));
    const A2 = deg(Math.asin(Math.min(1, (a * Math.sin(rad(C))) / c2)));
    return finish({ a, b, c: c2, A: A2, B: 180 - C - A2, C });
  }
  if (a !== undefined && c !== undefined && B !== undefined) {
    const b2 = Math.sqrt(a * a + c * c - 2 * a * c * Math.cos(rad(B)));
    const A2 = deg(Math.asin(Math.min(1, (a * Math.sin(rad(B))) / b2)));
    return finish({ a, b: b2, c, A: A2, B, C: 180 - B - A2 });
  }
  if (b !== undefined && c !== undefined && A !== undefined) {
    const a2 = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(rad(A)));
    const B2 = deg(Math.asin(Math.min(1, (b * Math.sin(rad(A))) / a2)));
    return finish({ a: a2, b, c, A, B: B2, C: 180 - A - B2 });
  }
  // ASA / AAS: two angles + one side (law of sines)
  if (A !== undefined && B !== undefined && c !== undefined) {
    const C2 = 180 - A - B;
    if (C2 <= 0) return null;
    const k = c / Math.sin(rad(C2));
    return finish({ a: k * Math.sin(rad(A)), b: k * Math.sin(rad(B)), c, A, B, C: C2 });
  }
  if (A !== undefined && C !== undefined && b !== undefined) {
    const B2 = 180 - A - C;
    if (B2 <= 0) return null;
    const k = b / Math.sin(rad(B2));
    return finish({ a: k * Math.sin(rad(A)), b, c: k * Math.sin(rad(C)), A, B: B2, C });
  }
  if (B !== undefined && C !== undefined && a !== undefined) {
    const A2 = 180 - B - C;
    if (A2 <= 0) return null;
    const k = a / Math.sin(rad(A2));
    return finish({ a, b: k * Math.sin(rad(B)), c: k * Math.sin(rad(C)), A: A2, B, C });
  }
  if (A !== undefined && B !== undefined && a !== undefined) {
    const C2 = 180 - A - B;
    if (C2 <= 0) return null;
    const k = a / Math.sin(rad(A));
    return finish({ a, b: k * Math.sin(rad(B)), c: k * Math.sin(rad(C2)), A, B, C: C2 });
  }
  if (A !== undefined && C !== undefined && a !== undefined) {
    const B2 = 180 - A - C;
    if (B2 <= 0) return null;
    const k = a / Math.sin(rad(A));
    return finish({ a, b: k * Math.sin(rad(B2)), c: k * Math.sin(rad(C)), A, B: B2, C });
  }
  if (B !== undefined && C !== undefined && b !== undefined) {
    const A2 = 180 - B - C;
    if (A2 <= 0) return null;
    const k = b / Math.sin(rad(B));
    return finish({ a: k * Math.sin(rad(A2)), b, c: k * Math.sin(rad(C)), A: A2, B, C });
  }
  return null;
}

export interface CircleResult {
  radius: number;
  diameter: number;
  circumference: number;
  area: number;
}

export function circleFromRadius(radius: number): CircleResult | null {
  if (!Number.isFinite(radius) || radius <= 0) return null;
  return {
    radius: round6(radius),
    diameter: round6(2 * radius),
    circumference: round6(2 * Math.PI * radius),
    area: round6(Math.PI * radius * radius),
  };
}

export function circleFromDiameter(diameter: number): CircleResult | null {
  if (!Number.isFinite(diameter) || diameter <= 0) return null;
  return circleFromRadius(diameter / 2);
}

export function circleFromCircumference(circumference: number): CircleResult | null {
  if (!Number.isFinite(circumference) || circumference <= 0) return null;
  return circleFromRadius(circumference / (2 * Math.PI));
}

// ---------------------------------------------------------------- primes / factors
export const PRIME_LIMIT = 1_000_000_000_000;

export function isPrime(n: number): boolean {
  if (!isInt(n) || n < 2 || n > PRIME_LIMIT) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export interface PrimeCheckResult {
  value: number;
  isPrime: boolean;
  /** null when there is no smaller prime (n ≤ 2). */
  prevPrime: number | null;
  nextPrime: number;
}

export function primeCheck(n: number): PrimeCheckResult | null {
  if (!isInt(n) || n < 0 || n > PRIME_LIMIT) return null;
  let prev: number | null = null;
  for (let v = n - 1; v >= 2; v--) {
    if (isPrime(v)) {
      prev = v;
      break;
    }
  }
  let next = n + 1;
  if (n < 2) next = 2;
  while (!isPrime(next)) next++;
  return { value: n, isPrime: isPrime(n), prevPrime: prev, nextPrime: next };
}

export interface FactorResult {
  value: number;
  factors: number[];
  /** Prime factorization as [prime, exponent] pairs. */
  primeFactorization: Array<{ prime: number; exponent: number }>;
}

export function factorOf(n: number): FactorResult | null {
  if (!isInt(n) || n < 1 || n > PRIME_LIMIT) return null;
  const factors: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      factors.push(i);
      if (i !== n / i) factors.push(n / i);
    }
  }
  factors.sort((x, y) => x - y);
  const primeFactorization: Array<{ prime: number; exponent: number }> = [];
  let rest = n;
  for (let p = 2; p * p <= rest; p++) {
    if (rest % p === 0) {
      let e = 0;
      while (rest % p === 0) {
        rest /= p;
        e++;
      }
      primeFactorization.push({ prime: p, exponent: e });
    }
  }
  if (rest > 1) primeFactorization.push({ prime: rest, exponent: 1 });
  return { value: n, factors, primeFactorization };
}

export interface LcmHcfResult {
  lcm: number;
  hcf: number;
  count: number;
}

export function lcmHcfOf(values: number[]): LcmHcfResult | null {
  if (values.length < 2 || values.length > 10) return null;
  if (values.some((v) => !isInt(v) || v === 0 || Math.abs(v) > 1_000_000_000)) return null;
  let h = Math.abs(values[0]);
  let l = Math.abs(values[0]);
  for (let i = 1; i < values.length; i++) {
    const v = Math.abs(values[i]);
    h = gcd(h, v);
    l = lcmTwo(l, v);
    if (!Number.isFinite(l) || l > 1e15) return null;
  }
  return { lcm: l, hcf: h, count: values.length };
}

// ---------------------------------------------------------------- factorial / perm-comb
export const FACTORIAL_LIMIT = 170;

export function factorialOf(n: number): number | null {
  if (!isInt(n) || n < 0 || n > FACTORIAL_LIMIT) return null;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export interface PermCombResult {
  nPr: number;
  nCr: number;
}

export function permComb(n: number, r: number): PermCombResult | null {
  if (!isInt(n) || !isInt(r) || n < 0 || r < 0 || r > n || n > FACTORIAL_LIMIT) return null;
  const nPr = factorialOf(n)! / factorialOf(n - r)!;
  const nCr = nPr / factorialOf(r)!;
  if (!Number.isFinite(nPr) || !Number.isFinite(nCr)) return null;
  return { nPr: round6(nPr), nCr: round6(nCr) };
}

// ---------------------------------------------------------------- probability
export interface ProbabilityResult {
  probability: number;
  percent: number;
  complement: number;
}

export function probabilityOf(favourable: number, total: number): ProbabilityResult | null {
  if (!isInt(favourable) || !isInt(total) || total <= 0 || favourable < 0 || favourable > total) return null;
  const p = favourable / total;
  return { probability: round6(p), percent: round6(p * 100), complement: round6(1 - p) };
}

/** P(A and B) for two independent events, each 0–1. */
export function probabilityAnd(p1: number, p2: number): number | null {
  if (![p1, p2].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) return null;
  return round6(p1 * p2);
}

/** P(A or B) for two independent events, each 0–1. */
export function probabilityOr(p1: number, p2: number): number | null {
  if (![p1, p2].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) return null;
  return round6(p1 + p2 - p1 * p2);
}

// ---------------------------------------------------------------- bases
export interface BaseResult {
  decimal: number;
  binary: string;
  octal: string;
  hex: string;
}

const BASE_DIGITS: Record<number, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^\d+$/,
  16: /^[0-9a-fA-F]+$/,
};

export function convertBase(value: string, fromBase: 2 | 8 | 10 | 16): BaseResult | null {
  const v = value.trim();
  if (v === '' || !BASE_DIGITS[fromBase].test(v)) return null;
  const dec = parseInt(v, fromBase);
  if (!Number.isSafeInteger(dec)) return null;
  return { decimal: dec, binary: dec.toString(2), octal: dec.toString(8), hex: dec.toString(16).toUpperCase() };
}

export function baseArithmetic(a: string, b: string, op: 'add' | 'subtract', base: 2 | 8 | 10 | 16): BaseResult | null {
  const x = convertBase(a, base);
  const y = convertBase(b, base);
  if (!x || !y) return null;
  const dec = op === 'add' ? x.decimal + y.decimal : x.decimal - y.decimal;
  if (dec < 0 || !Number.isSafeInteger(dec)) return null;
  return { decimal: dec, binary: dec.toString(2), octal: dec.toString(8), hex: dec.toString(16).toUpperCase() };
}

// ---------------------------------------------------------------- matrices
export type Matrix = number[][];

function validMatrix(m: Matrix, size: 2 | 3): boolean {
  if (!Array.isArray(m) || m.length !== size) return false;
  return m.every((row) => Array.isArray(row) && row.length === size && row.every((v) => Number.isFinite(v)));
}

export function matrixAdd(a: Matrix, b: Matrix): Matrix | null {
  const size = a.length as 2 | 3;
  if (!validMatrix(a, size) || !validMatrix(b, size) || a.length !== b.length) return null;
  return a.map((row, i) => row.map((v, j) => round6(v + b[i][j])));
}

export function matrixSubtract(a: Matrix, b: Matrix): Matrix | null {
  const size = a.length as 2 | 3;
  if (!validMatrix(a, size) || !validMatrix(b, size) || a.length !== b.length) return null;
  return a.map((row, i) => row.map((v, j) => round6(v - b[i][j])));
}

export function matrixMultiply(a: Matrix, b: Matrix): Matrix | null {
  const size = a.length as 2 | 3;
  if (!validMatrix(a, size) || !validMatrix(b, size) || a.length !== b.length) return null;
  const n = size;
  const out: Matrix = [];
  for (let i = 0; i < n; i++) {
    out.push([]);
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += a[i][k] * b[k][j];
      out[i].push(round6(s));
    }
  }
  return out;
}

export function matrixDeterminant(m: Matrix): number | null {
  if (m.length === 2 && validMatrix(m, 2)) {
    return round6(m[0][0] * m[1][1] - m[0][1] * m[1][0]);
  }
  if (m.length === 3 && validMatrix(m, 3)) {
    const [a, b, c] = m[0];
    const [d, e, f] = m[1];
    const [g, h, i] = m[2];
    return round6(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g));
  }
  return null;
}

export function matrixInverse(m: Matrix): Matrix | null {
  const det = matrixDeterminant(m);
  if (det === null || det === 0) return null;
  if (m.length === 2) {
    const [[a, b], [c, d]] = m;
    return [
      [round6(d / det), round6(-b / det)],
      [round6(-c / det), round6(a / det)],
    ];
  }
  const cof = (r: number, col: number): number => {
    const minor = (m: Matrix, rr: number, cc: number): number => {
      const rows = m.filter((_, x) => x !== rr).map((row) => row.filter((_, y) => y !== cc));
      return rows[0][0] * rows[1][1] - rows[0][1] * rows[1][0];
    };
    const sign = (r + col) % 2 === 0 ? 1 : -1;
    return sign * minor(m, r, col);
  };
  const adj: Matrix = [];
  for (let r = 0; r < 3; r++) {
    adj.push([]);
    for (let col = 0; col < 3; col++) adj[r].push(round6(cof(col, r) / det));
  }
  return adj;
}
