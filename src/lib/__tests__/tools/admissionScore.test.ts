// Admission Score Calculator — unit tests. Every expected value is
// hand-computed from the official circulars (DU 2026-27; Medical
// MBBS/BDS 2026-27, DGME circular 25 Nov 2026).
import { describe, it, expect } from 'vitest';
import {
  calculateAdmissionScore,
  meritBandForPercent,
  parseGpaInput,
  parseTestScoreInput,
} from '../../tools/admissionScore';

describe('calculateAdmissionScore — Dhaka University (GPA = SSC x 2 + HSC x 2, max 20; merit out of 120)', () => {
  it('SSC 5.00 + HSC 5.00 + test 75 -> GPA 20, merit 95/120', () => {
    // 5x2 + 5x2 = 20; 75 + 20 = 95.
    expect(
      calculateAdmissionScore({ system: 'du', sscGpa: 5, hscGpa: 5, testScore: 75 }),
    ).toEqual({
      sscPart: 10,
      hscPart: 10,
      gpaScore: 20,
      maxGpaScore: 20,
      meritScore: 95,
      maxMerit: 120,
      penalty: 0,
      meritPercent: 79.17,
      meritBand: 'competitive',
    });
  });

  it('SSC 4.50 + HSC 4.00 + test 80 -> GPA 17, merit 97/120', () => {
    // 4.5x2 + 4x2 = 9 + 8 = 17; 80 + 17 = 97.
    const result = calculateAdmissionScore({ system: 'du', sscGpa: 4.5, hscGpa: 4, testScore: 80 });
    expect(result.gpaScore).toBe(17);
    expect(result.sscPart).toBe(9);
    expect(result.hscPart).toBe(8);
    expect(result.meritScore).toBe(97);
    expect(result.maxMerit).toBe(120);
  });

  it('no test score -> GPA score only, merit null', () => {
    const result = calculateAdmissionScore({ system: 'du', sscGpa: 5, hscGpa: 5, testScore: null });
    expect(result.gpaScore).toBe(20);
    expect(result.meritScore).toBeNull();
    expect(result.meritPercent).toBeNull();
    expect(result.meritBand).toBeNull();
  });
});

describe('calculateAdmissionScore — Medical MBBS/BDS (GPA = SSC x 8 + HSC x 12, max 100; merit out of 200)', () => {
  it('SSC 5.00 + HSC 5.00 -> GPA 100', () => {
    // 5x8 + 5x12 = 40 + 60 = 100.
    const result = calculateAdmissionScore({ system: 'medical', sscGpa: 5, hscGpa: 5, testScore: null });
    expect(result.sscPart).toBe(40);
    expect(result.hscPart).toBe(60);
    expect(result.gpaScore).toBe(100);
    expect(result.maxGpaScore).toBe(100);
  });

  it('SSC 5.00 + HSC 5.00 + test 70 -> merit 170/200', () => {
    // 100 + 70 = 170.
    const result = calculateAdmissionScore({ system: 'medical', sscGpa: 5, hscGpa: 5, testScore: 70 });
    expect(result.meritScore).toBe(170);
    expect(result.maxMerit).toBe(200);
    expect(result.penalty).toBe(0);
    expect(result.meritPercent).toBe(85);
    expect(result.meritBand).toBe('strong');
  });

  it('second-timer -3 -> 167/200', () => {
    // 100 + 70 - 3 = 167.
    const result = calculateAdmissionScore({
      system: 'medical',
      sscGpa: 5,
      hscGpa: 5,
      testScore: 70,
      secondTimer: true,
    });
    expect(result.meritScore).toBe(167);
    expect(result.penalty).toBe(3);
  });

  it('admitted last session -5, both penalties together -8', () => {
    // 100 + 70 - 5 = 165; both flags -> 100 + 70 - 8 = 162.
    const one = calculateAdmissionScore({
      system: 'medical',
      sscGpa: 5,
      hscGpa: 5,
      testScore: 70,
      admittedLastSession: true,
    });
    expect(one.meritScore).toBe(165);
    expect(one.penalty).toBe(5);
    const both = calculateAdmissionScore({
      system: 'medical',
      sscGpa: 5,
      hscGpa: 5,
      testScore: 70,
      secondTimer: true,
      admittedLastSession: true,
    });
    expect(both.meritScore).toBe(162);
    expect(both.penalty).toBe(8);
  });

  it('penalty flags are ignored for DU', () => {
    const result = calculateAdmissionScore({
      system: 'du',
      sscGpa: 5,
      hscGpa: 5,
      testScore: 75,
      secondTimer: true,
      admittedLastSession: true,
    });
    expect(result.penalty).toBe(0);
    expect(result.meritScore).toBe(95);
  });

  it('partial GPA: SSC 4.00 + HSC 4.50 -> 32 + 54 = 86', () => {
    // 4x8 = 32; 4.5x12 = 54; total 86.
    const result = calculateAdmissionScore({ system: 'medical', sscGpa: 4, hscGpa: 4.5, testScore: null });
    expect(result.sscPart).toBe(32);
    expect(result.hscPart).toBe(54);
    expect(result.gpaScore).toBe(86);
  });
});

describe('validation — GPA > 5 and negative values are rejected', () => {
  it('GPA above 5 throws', () => {
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: 5.01, hscGpa: 5, testScore: null })).toThrow(/sscGpa/);
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: 5, hscGpa: 6, testScore: null })).toThrow(/hscGpa/);
  });

  it('negative GPA throws', () => {
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: -1, hscGpa: 5, testScore: null })).toThrow(/sscGpa/);
    expect(() => calculateAdmissionScore({ system: 'medical', sscGpa: 5, hscGpa: -0.5, testScore: null })).toThrow(/hscGpa/);
  });

  it('test score outside 0-100 throws', () => {
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: 5, hscGpa: 5, testScore: 101 })).toThrow(/testScore/);
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: 5, hscGpa: 5, testScore: -1 })).toThrow(/testScore/);
  });

  it('non-finite values throw', () => {
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: Number.NaN, hscGpa: 5, testScore: null })).toThrow(/sscGpa/);
    expect(() => calculateAdmissionScore({ system: 'du', sscGpa: 5, hscGpa: 5, testScore: Number.NaN })).toThrow(/testScore/);
  });

  it('zero GPAs are valid: GPA 0, merit equals the test score', () => {
    const result = calculateAdmissionScore({ system: 'du', sscGpa: 0, hscGpa: 0, testScore: 50 });
    expect(result.gpaScore).toBe(0);
    expect(result.meritScore).toBe(50);
  });
});

describe('meritBandForPercent — rough guidance thresholds', () => {
  it('80%+ strong, 60%+ competitive, below 60% needs improvement', () => {
    expect(meritBandForPercent(100)).toBe('strong');
    expect(meritBandForPercent(80)).toBe('strong');
    expect(meritBandForPercent(79.99)).toBe('competitive');
    expect(meritBandForPercent(60)).toBe('competitive');
    expect(meritBandForPercent(59.99)).toBe('needs-improvement');
    expect(meritBandForPercent(0)).toBe('needs-improvement');
  });
});

describe('parseGpaInput / parseTestScoreInput — empty / bad input paths', () => {
  it('empty means "not entered yet": null value, not invalid', () => {
    expect(parseGpaInput('')).toEqual({ value: null, invalid: false });
    expect(parseGpaInput('   ')).toEqual({ value: null, invalid: false });
    expect(parseTestScoreInput('')).toEqual({ value: null, invalid: false });
  });

  it('valid values parse', () => {
    expect(parseGpaInput('5.00')).toEqual({ value: 5, invalid: false });
    expect(parseGpaInput('4.5')).toEqual({ value: 4.5, invalid: false });
    expect(parseTestScoreInput('75')).toEqual({ value: 75, invalid: false });
    expect(parseTestScoreInput('0')).toEqual({ value: 0, invalid: false });
  });

  it('GPA above 5 or negative is invalid', () => {
    expect(parseGpaInput('5.01')).toEqual({ value: null, invalid: true });
    expect(parseGpaInput('6')).toEqual({ value: null, invalid: true });
    expect(parseGpaInput('-1')).toEqual({ value: null, invalid: true });
    expect(parseGpaInput('abc')).toEqual({ value: null, invalid: true });
  });

  it('test score above 100 or negative is invalid', () => {
    expect(parseTestScoreInput('101')).toEqual({ value: null, invalid: true });
    expect(parseTestScoreInput('-5')).toEqual({ value: null, invalid: true });
    expect(parseTestScoreInput('abc')).toEqual({ value: null, invalid: true });
  });
});
