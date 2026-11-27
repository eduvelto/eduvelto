import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  generatePassword,
  passwordStrength,
  randomInt,
  randomInts,
  shuffleFair,
  makeFairQueue,
} from '../../tools/passwordRandom';

describe('generatePassword', () => {
  it('respects the exact length', () => {
    expect(generatePassword({ length: 16 })).toHaveLength(16);
    expect(generatePassword({ length: 8 })).toHaveLength(8);
  });
  it('contains at least one char from every enabled set', () => {
    for (let i = 0; i < 50; i += 1) {
      const pw = generatePassword({ length: 12 });
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^A-Za-z0-9]/);
    }
  });
  it('avoidAmbiguous removes 0O1lI|', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generatePassword({ length: 20, avoidAmbiguous: true })).not.toMatch(/[0O1lI|]/);
    }
  });
  it('rejects bad options', () => {
    expect(() => generatePassword({ length: 7 })).toThrow(/8-64/);
    expect(() => generatePassword({ lower: false, upper: false, digits: false, symbols: false })).toThrow(
      /at least one character set/,
    );
  });
  it('uses secure randomness, never Math.random in code (comments excluded)', () => {
    const src = readFileSync(new URL('../../tools/passwordRandom.ts', import.meta.url), 'utf8');
    const code = src
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    expect(code).not.toMatch(/Math\.random/);
  });
});

describe('passwordStrength', () => {
  it('rates 123456 as 0 with a common-password reason', () => {
    const r = passwordStrength('123456');
    expect(r.score).toBe(0);
    expect(r.issues.join(' ')).toMatch(/common/);
  });
  it('rates a mixed 12-char password at least Good', () => {
    expect(passwordStrength('Tr0ub4dor&3x').score).toBeGreaterThanOrEqual(3);
  });
  it('rates a 20-char random-style password as Strong', () => {
    expect(passwordStrength('aB3$kL9#qW2&zX8!pR4').score).toBe(4);
  });
  it('flags sequences and short passwords', () => {
    expect(passwordStrength('abcd1234').issues.join(' ')).toMatch(/sequence/);
    expect(passwordStrength('abc').issues.join(' ')).toMatch(/8 characters/);
  });
  it('empty password gets no score', () => {
    expect(passwordStrength('').score).toBe(0);
  });
});

describe('random numbers / fair pick', () => {
  it('randomInt stays in range over 1000 draws', () => {
    for (let i = 0; i < 1000; i += 1) {
      const n = randomInt(1, 10);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });
  it('randomInts unique mode never repeats and respects bounds', () => {
    const nums = randomInts(5, 1, 5, true);
    expect([...nums].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(() => randomInts(6, 1, 5, true)).toThrow(/only 5 exist/);
  });
  it('min > max throws', () => {
    expect(() => randomInt(10, 1)).toThrow(/bigger than max/);
  });
  it('shuffleFair keeps the multiset and handles Bangla names', () => {
    const names = ['রহিম', 'করিম', 'সালমা', 'আরিফ'];
    const shuffled = shuffleFair(names);
    expect([...shuffled].sort()).toEqual([...names].sort());
    expect(shuffled.join('')).not.toContain('�');
  });
  it('fair queue covers everyone exactly once before repeating', () => {
    const queue = makeFairQueue(['a', 'b', 'c']);
    expect([...queue].sort()).toEqual(['a', 'b', 'c']);
  });
});
