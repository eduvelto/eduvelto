// Eduvelto — Math tools engine tests (batch Math, 27 Nov 2026).
// Known-answer tests for every function in src/lib/tools/mathTools.ts,
// including edge cases: 0, negatives where valid, invalid → null.
import { describe, it, expect } from 'vitest';
import {
  gcd,
  parseNumberList,
  fractionAdd,
  fractionSubtract,
  fractionMultiply,
  fractionDivide,
  averageOf,
  medianModeOf,
  standardDeviationOf,
  simplifyRatio,
  solveRatio,
  solveProportion,
  percentageChange,
  sqrtCbrt,
  powerOf,
  logarithmOf,
  solveQuadratic,
  solveLinear,
  areaOf,
  volumeOf,
  pythagoras,
  solveTriangle,
  circleFromRadius,
  circleFromDiameter,
  circleFromCircumference,
  isPrime,
  primeCheck,
  factorOf,
  lcmHcfOf,
  factorialOf,
  permComb,
  probabilityOf,
  probabilityAnd,
  probabilityOr,
  convertBase,
  baseArithmetic,
  matrixAdd,
  matrixSubtract,
  matrixMultiply,
  matrixDeterminant,
  matrixInverse,
} from '../../../lib/tools/mathTools';

describe('gcd / parseNumberList', () => {
  it('gcd(12, 18) = 6; gcd handles 0 and negatives', () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(-12, 18)).toBe(6);
  });
  it('parses comma/space/newline lists and rejects junk', () => {
    expect(parseNumberList('10, 20 30\n40')).toEqual([10, 20, 30, 40]);
    expect(parseNumberList('')).toBeNull();
    expect(parseNumberList('1, two, 3')).toBeNull();
    expect(parseNumberList('-5, 0, 2.5')).toEqual([-5, 0, 2.5]);
  });
});

describe('fractions', () => {
  it('1/2 + 1/3 = 5/6', () => {
    expect(fractionAdd(1, 2, 1, 3)).toEqual({ num: 5, den: 6, text: '5/6', decimal: 0.833333 });
  });
  it('1/2 - 1/3 = 1/6', () => {
    expect(fractionSubtract(1, 2, 1, 3)?.text).toBe('1/6');
  });
  it('2/3 × 3/4 = 1/2 (simplified)', () => {
    expect(fractionMultiply(2, 3, 3, 4)).toEqual({ num: 1, den: 2, text: '1/2', decimal: 0.5 });
  });
  it('1/2 ÷ 1/4 = 2', () => {
    expect(fractionDivide(1, 2, 1, 4)?.text).toBe('2');
  });
  it('3/2 + 1/2 = 2/1 shown as mixed-free whole 2; 5/4 shows mixed 1 1/4', () => {
    expect(fractionAdd(3, 2, 1, 2)?.text).toBe('2');
    expect(fractionAdd(3, 4, 1, 2)?.text).toBe('1 1/4');
  });
  it('zero denominator, non-integer and divide-by-zero-fraction → null', () => {
    expect(fractionAdd(1, 0, 1, 2)).toBeNull();
    expect(fractionAdd(1.5, 2, 1, 2)).toBeNull();
    expect(fractionDivide(1, 2, 0, 3)).toBeNull();
  });
});

describe('average / median-mode / standard deviation', () => {
  it('mean of 10,20,30,40,50 is 30', () => {
    expect(averageOf([10, 20, 30, 40, 50])).toEqual({ mean: 30, sum: 150, count: 5, min: 10, max: 50 });
  });
  it('mean of a single value is that value; empty → null', () => {
    expect(averageOf([7])?.mean).toBe(7);
    expect(averageOf([])).toBeNull();
  });
  it('median of 4,8,6,5,3,6,9 is 6 and mode is 6', () => {
    const r = medianModeOf([4, 8, 6, 5, 3, 6, 9]);
    expect(r?.median).toBe(6);
    expect(r?.modes).toEqual([6]);
    expect(r?.sorted).toEqual([3, 4, 5, 6, 6, 8, 9]);
  });
  it('even count median averages the middle two; no repeats → no mode', () => {
    const r = medianModeOf([1, 2, 3, 4]);
    expect(r?.median).toBe(2.5);
    expect(r?.modes).toEqual([]);
  });
  it('two-way tie gives two modes', () => {
    expect(medianModeOf([1, 1, 2, 2, 3])?.modes).toEqual([1, 2]);
  });
  it('SD of 2,4,4,4,5,5,7,9: population ≈ 2, sample ≈ 2.13809', () => {
    const r = standardDeviationOf([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(r?.mean).toBe(5);
    expect(r?.populationSd).toBe(2);
    expect(r?.populationVariance).toBe(4);
    expect(r?.sampleSd).toBeCloseTo(2.13809, 5);
  });
  it('single value: sample SD is null, population SD is 0', () => {
    const r = standardDeviationOf([5]);
    expect(r?.populationSd).toBe(0);
    expect(r?.sampleSd).toBeNull();
    expect(standardDeviationOf([])).toBeNull();
  });
});

describe('ratio / proportion / percentage change', () => {
  it('12:18 simplifies to 2 : 3', () => {
    expect(simplifyRatio(12, 18)).toEqual({ a: 2, b: 3, text: '2 : 3' });
  });
  it('zero term → null', () => {
    expect(simplifyRatio(0, 5)).toBeNull();
    expect(simplifyRatio(4, 0)).toBeNull();
  });
  it('3:4 = 9:x → x = 12', () => {
    expect(solveRatio(3, 4, 9)).toBe(12);
    expect(solveProportion(3, 4, 9)).toBe(12);
    expect(solveRatio(0, 4, 9)).toBeNull();
  });
  it('200 → 250 is +25%; 200 → 150 is −25%; same value is 0%', () => {
    expect(percentageChange(200, 250)).toEqual({ change: 50, percent: 25, direction: 'increase' });
    expect(percentageChange(200, 150)).toEqual({ change: -50, percent: -25, direction: 'decrease' });
    expect(percentageChange(200, 200)?.direction).toBe('same');
    expect(percentageChange(0, 100)).toBeNull();
  });
});

describe('roots / powers / logs', () => {
  it('sqrt(64)=8, cbrt(64)=4; negative has no real sqrt but a real cbrt', () => {
    expect(sqrtCbrt(64)).toEqual({ sqrt: 8, cbrt: 4 });
    expect(sqrtCbrt(-8)).toEqual({ sqrt: null, cbrt: -2 });
    expect(sqrtCbrt(0)).toEqual({ sqrt: 0, cbrt: 0 });
  });
  it('2^10 = 1024 with an expanded step; 5^0 = 1; 2^-2 = 0.25', () => {
    expect(powerOf(2, 10)?.result).toBe(1024);
    expect(powerOf(2, 10)?.steps[0]).toContain('2 × 2');
    expect(powerOf(5, 0)?.result).toBe(1);
    expect(powerOf(2, -2)?.result).toBe(0.25);
    expect(powerOf(2, 1001)).toBeNull();
    expect(powerOf(10, 400)).toBeNull();
  });
  it('log10(100)=2, ln(e)=1, log2(8)=3; invalid base/value → null', () => {
    expect(logarithmOf(100, 10)?.log).toBe(2);
    expect(logarithmOf(Math.E, Math.E)?.ln).toBe(1);
    expect(logarithmOf(8, 2)?.log).toBe(3);
    expect(logarithmOf(0, 10)).toBeNull();
    expect(logarithmOf(-5, 10)).toBeNull();
    expect(logarithmOf(10, 1)).toBeNull();
    expect(logarithmOf(10, 0)).toBeNull();
  });
});

describe('quadratic / linear equations', () => {
  it('x²−3x+2=0 → roots 2 and 1', () => {
    const r = solveQuadratic(1, -3, 2);
    expect(r?.nature).toBe('two-real');
    expect(r?.discriminant).toBe(1);
    expect(r?.roots.map((x) => x.re).sort()).toEqual([1, 2]);
  });
  it('x²−2x+1=0 → one repeated root 1', () => {
    const r = solveQuadratic(1, -2, 1);
    expect(r?.nature).toBe('one-real');
    expect(r?.roots[0].re).toBe(1);
  });
  it('x²+1=0 → complex roots ±i, labelled honestly', () => {
    const r = solveQuadratic(1, 0, 1);
    expect(r?.nature).toBe('complex');
    expect(r?.roots[0]).toEqual({ re: 0, im: 1 });
    expect(r?.roots[1]).toEqual({ re: 0, im: -1 });
  });
  it('a=0 → null', () => {
    expect(solveQuadratic(0, 2, 1)).toBeNull();
  });
  it('2x+3 = x+7 → x=4', () => {
    const r = solveLinear(2, 3, 1, 7);
    expect(r?.kind).toBe('unique');
    expect(r?.x).toBe(4);
  });
  it('2x+3 = 2x+3 → infinite; 2x+3 = 2x+5 → none', () => {
    expect(solveLinear(2, 3, 2, 3)?.kind).toBe('infinite');
    expect(solveLinear(2, 3, 2, 5)?.kind).toBe('none');
  });
});

describe('area / volume', () => {
  it('rectangle 10×5 = 50; circle r=7 ≈ 153.93804; triangle 8×5 = 20', () => {
    expect(areaOf('rectangle', { length: 10, width: 5 })?.area).toBe(50);
    expect(areaOf('circle', { radius: 7 })?.area).toBeCloseTo(153.93804, 5);
    expect(areaOf('triangle', { base: 8, height: 5 })?.area).toBe(20);
  });
  it('square 6 = 36; parallelogram 9×4 = 36; trapezium (6+10)/2×5 = 40; ellipse π×5×3', () => {
    expect(areaOf('square', { side: 6 })?.area).toBe(36);
    expect(areaOf('parallelogram', { base: 9, height: 4 })?.area).toBe(36);
    expect(areaOf('trapezium', { a: 6, b: 10, height: 5 })?.area).toBe(40);
    expect(areaOf('ellipse', { a: 5, b: 3 })?.area).toBeCloseTo(47.12389, 5);
  });
  it('non-positive or missing dims → null', () => {
    expect(areaOf('circle', { radius: 0 })).toBeNull();
    expect(areaOf('circle', { radius: -3 })).toBeNull();
    expect(areaOf('rectangle', { length: 10 })).toBeNull();
  });
  it('cube 5 = 125; cuboid 6×4×10 = 240; cylinder r=3 h=10 ≈ 282.743339', () => {
    expect(volumeOf('cube', { side: 5 })?.volume).toBe(125);
    expect(volumeOf('cuboid', { length: 6, width: 4, height: 10 })?.volume).toBe(240);
    expect(volumeOf('cylinder', { radius: 3, height: 10 })?.volume).toBeCloseTo(282.743339, 5);
  });
  it('sphere r=3 ≈ 113.097336; cone r=3 h=10 ≈ 94.24778; pyramid 6×4×10 = 80', () => {
    expect(volumeOf('sphere', { radius: 3 })?.volume).toBeCloseTo(113.097336, 5);
    expect(volumeOf('cone', { radius: 3, height: 10 })?.volume).toBeCloseTo(94.24778, 5);
    expect(volumeOf('pyramid', { length: 6, width: 4, height: 10 })?.volume).toBe(80);
    expect(volumeOf('sphere', { radius: -1 })).toBeNull();
  });
});

describe('pythagoras / triangle / circle', () => {
  it('3-4-5 triangle: missing c = 5, missing a from b=4 c=5 is 3', () => {
    expect(pythagoras(3, 4, null)?.value).toBe(5);
    expect(pythagoras(null, 4, 5)?.value).toBe(3);
    expect(pythagoras(3, null, 5)?.value).toBe(4);
  });
  it('hypotenuse shorter than a leg → null; two missing → null', () => {
    expect(pythagoras(null, 6, 5)).toBeNull();
    expect(pythagoras(3, null, null)).toBeNull();
    expect(pythagoras(3, 4, 5)).toBeNull();
  });
  it('SSS 3-4-5 → angles 36.8699°, 53.1301°, 90°', () => {
    const r = solveTriangle({ a: 3, b: 4, c: 5 });
    expect(r?.C).toBe(90);
    expect(r?.A).toBeCloseTo(36.8699, 4);
    expect(r?.B).toBeCloseTo(53.1301, 4);
  });
  it('SAS a=3 b=4 C=90 → c=5; ASA A=30 B=60 c=5 → a=2.5, b≈4.330127', () => {
    const sas = solveTriangle({ a: 3, b: 4, C: 90 });
    expect(sas?.c).toBe(5);
    const asa = solveTriangle({ A: 30, B: 60, c: 5 });
    expect(asa?.a).toBe(2.5);
    expect(asa?.b).toBeCloseTo(4.330127, 5);
    expect(asa?.C).toBe(90);
  });
  it('impossible triangle (1,2,10) → null; angles summing past 180 → null', () => {
    expect(solveTriangle({ a: 1, b: 2, c: 10 })).toBeNull();
    expect(solveTriangle({ A: 100, B: 100, c: 5 })).toBeNull();
    expect(solveTriangle({ a: 3 })).toBeNull();
  });
  it('circle r=7: diameter 14, circumference ≈ 43.982297, area ≈ 153.93804', () => {
    const r = circleFromRadius(7);
    expect(r?.diameter).toBe(14);
    expect(r?.circumference).toBeCloseTo(43.982297, 5);
    expect(r?.area).toBeCloseTo(153.93804, 5);
    expect(circleFromDiameter(14)?.radius).toBe(7);
    expect(circleFromCircumference(2 * Math.PI * 7)?.radius).toBe(7);
    expect(circleFromRadius(0)).toBeNull();
    expect(circleFromRadius(-2)).toBeNull();
  });
});

describe('primes / factors / lcm-hcf', () => {
  it('isPrime: 2, 97 prime; 1, 4, 100 not prime', () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(97)).toBe(true);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(100)).toBe(false);
    expect(isPrime(1.5)).toBe(false);
  });
  it('primeCheck(97): prime, prev 89, next 101; primeCheck(2): no previous prime', () => {
    expect(primeCheck(97)).toEqual({ value: 97, isPrime: true, prevPrime: 89, nextPrime: 101 });
    expect(primeCheck(2)?.prevPrime).toBeNull();
    expect(primeCheck(2)?.nextPrime).toBe(3);
    expect(primeCheck(-1)).toBeNull();
    expect(primeCheck(1.5)).toBeNull();
  });
  it('factors of 60: 12 factors; prime factorization 2² × 3 × 5', () => {
    const r = factorOf(60);
    expect(r?.factors).toEqual([1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]);
    expect(r?.primeFactorization).toEqual([
      { prime: 2, exponent: 2 },
      { prime: 3, exponent: 1 },
      { prime: 5, exponent: 1 },
    ]);
  });
  it('factorOf(1) has one factor and no prime factors; 0 → null', () => {
    expect(factorOf(1)?.factors).toEqual([1]);
    expect(factorOf(1)?.primeFactorization).toEqual([]);
    expect(factorOf(0)).toBeNull();
  });
  it('LCM/HCF of 12,18,24 → LCM 72, HCF 6; single number → null', () => {
    expect(lcmHcfOf([12, 18, 24])).toEqual({ lcm: 72, hcf: 6, count: 3 });
    expect(lcmHcfOf([12])).toBeNull();
    expect(lcmHcfOf([12, 0])).toBeNull();
    expect(lcmHcfOf([12, 18.5])).toBeNull();
  });
});

describe('factorial / permutation-combination', () => {
  it('0! = 1, 5! = 120, 10! = 3628800', () => {
    expect(factorialOf(0)).toBe(1);
    expect(factorialOf(5)).toBe(120);
    expect(factorialOf(10)).toBe(3628800);
    expect(factorialOf(-1)).toBeNull();
    expect(factorialOf(171)).toBeNull();
    expect(factorialOf(5.5)).toBeNull();
  });
  it('10P3 = 720, 10C3 = 120; r > n → null', () => {
    expect(permComb(10, 3)).toEqual({ nPr: 720, nCr: 120 });
    expect(permComb(5, 5)).toEqual({ nPr: 120, nCr: 1 });
    expect(permComb(5, 0)).toEqual({ nPr: 1, nCr: 1 });
    expect(permComb(3, 5)).toBeNull();
    expect(permComb(-1, 0)).toBeNull();
  });
});

describe('probability', () => {
  it('1/6 ≈ 0.166667 (16.666667%), complement ≈ 0.833333', () => {
    const r = probabilityOf(1, 6);
    expect(r?.probability).toBeCloseTo(0.166667, 6);
    expect(r?.percent).toBeCloseTo(16.666667, 5);
    expect(r?.complement).toBeCloseTo(0.833333, 6);
  });
  it('0/total = 0, total/total = 1; favourable > total → null; total 0 → null', () => {
    expect(probabilityOf(0, 6)?.probability).toBe(0);
    expect(probabilityOf(6, 6)?.probability).toBe(1);
    expect(probabilityOf(7, 6)).toBeNull();
    expect(probabilityOf(1, 0)).toBeNull();
    expect(probabilityOf(1.5, 6)).toBeNull();
  });
  it('AND 0.5×0.5 = 0.25; OR 0.5+0.5−0.25 = 0.75; out-of-range → null', () => {
    expect(probabilityAnd(0.5, 0.5)).toBe(0.25);
    expect(probabilityOr(0.5, 0.5)).toBe(0.75);
    expect(probabilityAnd(1.2, 0.5)).toBeNull();
    expect(probabilityOr(0.5, -0.1)).toBeNull();
  });
});

describe('base conversion / arithmetic', () => {
  it('1010₂ = 10₁₀ = 12₈ = A₁₆', () => {
    expect(convertBase('1010', 2)).toEqual({ decimal: 10, binary: '1010', octal: '12', hex: 'A' });
    expect(convertBase('FF', 16)?.decimal).toBe(255);
    expect(convertBase('777', 8)?.decimal).toBe(511);
  });
  it('invalid digits → null; hex is case-insensitive', () => {
    expect(convertBase('102', 2)).toBeNull();
    expect(convertBase('89', 8)).toBeNull();
    expect(convertBase('ff', 16)?.decimal).toBe(255);
    expect(convertBase('', 10)).toBeNull();
  });
  it('1010₂ + 1100₂ = 10110₂ (22); 1100₂ − 1010₂ = 10₂ (2); negative result → null', () => {
    expect(baseArithmetic('1010', '1100', 'add', 2)?.decimal).toBe(22);
    expect(baseArithmetic('1010', '1100', 'add', 2)?.binary).toBe('10110');
    expect(baseArithmetic('1100', '1010', 'subtract', 2)?.decimal).toBe(2);
    expect(baseArithmetic('1010', '1100', 'subtract', 2)).toBeNull();
  });
});

describe('matrices', () => {
  const a: number[][] = [[1, 2], [3, 4]];
  const b: number[][] = [[5, 6], [7, 8]];
  it('add: [[6,8],[10,12]]; subtract: [[-4,-4],[-4,-4]]', () => {
    expect(matrixAdd(a, b)).toEqual([[6, 8], [10, 12]]);
    expect(matrixSubtract(a, b)).toEqual([[-4, -4], [-4, -4]]);
  });
  it('multiply: [[19,22],[43,50]]', () => {
    expect(matrixMultiply(a, b)).toEqual([[19, 22], [43, 50]]);
  });
  it('determinant of [[1,2],[3,4]] is −2; 3x3 [[1,2,3],[4,5,6],[7,8,9]] is 0', () => {
    expect(matrixDeterminant(a)).toBe(-2);
    expect(matrixDeterminant([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).toBe(0);
    expect(matrixDeterminant([[1, 2, 3]])).toBeNull();
  });
  it('inverse of [[1,2],[3,4]] is [[-2,1],[1.5,-0.5]]; singular matrix has no inverse', () => {
    expect(matrixInverse(a)).toEqual([[-2, 1], [1.5, -0.5]]);
    expect(matrixInverse([[1, 2], [2, 4]])).toBeNull();
  });
  it('3x3 inverse: [[2,0,0],[0,2,0],[0,0,2]]⁻¹ is 0.5 on the diagonal', () => {
    expect(matrixInverse([[2, 0, 0], [0, 2, 0], [0, 0, 2]])).toEqual([
      [0.5, 0, 0],
      [0, 0.5, 0],
      [0, 0, 0.5],
    ]);
  });
  it('mismatched sizes → null', () => {
    expect(matrixAdd(a, [[1, 2, 3], [4, 5, 6], [7, 8, 9]])).toBeNull();
    expect(matrixMultiply(a, [[1]])).toBeNull();
  });
});
