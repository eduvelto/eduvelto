/**
 * Eduvelto unit tests — NU admission scoring / merit / eligibility /
 * exam-config validation (NU-4; design doc §19.1.2–§19.1.3, §19.4,
 * §19.7.3). Pure functions only — no Firestore, no network.
 * Run: npx vitest run src/lib/__tests__/nuAdmission.test.ts
 */
import { describe, it, expect } from 'vitest';
import { calculateExamScore } from '../nuScoring';
import { calculateMeritEstimate, NU_PASS_MARK } from '../nuMerit';
import { validateAdmissionEligibility } from '../nuEligibility';
import {
  nuFullMockConfigSeed,
  validateNuExamConfig,
  NU_CIRCULAR_VERSION,
  NU_MERIT_CALCULATION_VERSION,
} from '../nuExamConfig';

describe('calculateExamScore (NU-4, §19.1.3)', () => {
  const config = nuFullMockConfigSeed();

  it('scores correct × 1; wrong and unanswered add nothing', () => {
    const r = calculateExamScore({ correct: 72, incorrect: 20, unanswered: 8 }, config);
    expect(r.score).toBe(72);
    expect(r.totalQuestions).toBe(100);
    expect(r.configVersion).toBe(1);
    expect(r.circularVersion).toBe(NU_CIRCULAR_VERSION);
  });

  it('a perfect paper scores 100 and an empty paper scores 0', () => {
    expect(calculateExamScore({ correct: 100, incorrect: 0, unanswered: 0 }, config).score).toBe(100);
    expect(calculateExamScore({ correct: 0, incorrect: 60, unanswered: 40 }, config).score).toBe(0);
  });

  it('counts that do not sum to totalQuestions throw', () => {
    expect(() => calculateExamScore({ correct: 50, incorrect: 20, unanswered: 10 }, config)).toThrow(
      /count-mismatch/,
    );
  });

  it('a config with negative marking throws — a Job penalty formula can never score an NU exam', () => {
    const bad = { ...config, marking: { ...config.marking, incorrect: -0.5, negativeMarking: true } };
    expect(() => calculateExamScore({ correct: 50, incorrect: 50, unanswered: 0 }, bad)).toThrow(
      /marking-mismatch/,
    );
  });

  it('a non-MCQ config throws', () => {
    const bad = { ...config, questionMode: 'WRITTEN' as never };
    expect(() => calculateExamScore({ correct: 50, incorrect: 50, unanswered: 0 }, bad)).toThrow(
      /not-mcq/,
    );
  });

  it('pass mark 35 is a comparison only, never a verdict', () => {
    expect(NU_PASS_MARK).toBe(35);
    // The scorer returns a number only — no pass/fail field exists.
    const r = calculateExamScore({ correct: 34, incorrect: 66, unanswered: 0 }, config);
    expect('passed' in r).toBe(false);
  });
});

describe('calculateMeritEstimate (NU-4, §19.7.3)', () => {
  it('exam + SSC×8 + HSC×12, parts shown separately', () => {
    const r = calculateMeritEstimate(80, 5.0, 5.0);
    expect(r.total).toBe(180);
    expect(r.examScore).toBe(80);
    expect(r.sscPart).toBe(40);
    expect(r.hscPart).toBe(60);
    expect(r.calculationVersion).toBe(NU_MERIT_CALCULATION_VERSION);
    expect(r.circularVersion).toBe(NU_CIRCULAR_VERSION);
    // Full marks everywhere reach the 200 ceiling.
    expect(calculateMeritEstimate(100, 5.0, 5.0).total).toBe(200);
  });

  it('rounds to two decimals', () => {
    const r = calculateMeritEstimate(72, 4.33, 4.67);
    expect(r.sscPart).toBe(34.64);
    expect(r.hscPart).toBe(56.04);
    expect(r.total).toBe(162.68);
  });

  it('zero exam and zero GPAs give zero', () => {
    expect(calculateMeritEstimate(0, 0, 0).total).toBe(0);
  });

  it('a GPA outside 0–5 throws', () => {
    expect(() => calculateMeritEstimate(80, 5.5, 5.0)).toThrow(/invalid-gpa/);
    expect(() => calculateMeritEstimate(80, 5.0, -0.1)).toThrow(/invalid-gpa/);
  });

  it('an unknown circular version throws instead of silently applying 2025-26 rules', () => {
    expect(() => calculateMeritEstimate(80, 5.0, 5.0, 'nu-2026-27-v1')).toThrow(
      /unknown-circular/,
    );
  });

  it('an exam score outside 0–100 throws', () => {
    expect(() => calculateMeritEstimate(101, 5.0, 5.0)).toThrow(/invalid-score/);
  });
});

describe('validateAdmissionEligibility (NU-4, §2.2)', () => {
  it('humanities meets: SSC 2022 4.0 + HSC 2024 4.5 (combined 8.5 ≥ 4.5)', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2022,
      sscGpa: 4.0,
      hscYear: 2024,
      hscGpa: 4.5,
    });
    expect(r.status).toBe('meets');
    expect(r.circularVersion).toBe(NU_CIRCULAR_VERSION);
  });

  it('science does-not-meet on combined GPA: 2.5 + 2.0 = 4.5 < 4.75', () => {
    const r = validateAdmissionEligibility({
      group: 'science',
      sscYear: 2023,
      sscGpa: 2.5,
      hscYear: 2025,
      hscGpa: 2.0,
    });
    expect(r.status).toBe('does-not-meet');
  });

  it('science does-not-meet when SSC GPA is below 2.25', () => {
    const r = validateAdmissionEligibility({
      group: 'science',
      sscYear: 2022,
      sscGpa: 2.0,
      hscYear: 2024,
      hscGpa: 5.0,
    });
    expect(r.status).toBe('does-not-meet');
  });

  it('business meets at exactly the threshold: 2.25 + 2.25 = 4.50', () => {
    const r = validateAdmissionEligibility({
      group: 'business',
      sscYear: 2023,
      sscGpa: 2.25,
      hscYear: 2025,
      hscGpa: 2.25,
    });
    expect(r.status).toBe('meets');
  });

  // NU-6 follow-up (a) — clause ১(ক) per-exam minimums, verified from
  // the circular PDF itself (memo 2026/3348). The code already encoded
  // them in NU-4; these tests pin them so a later change cannot
  // silently drop a minimum while the combined total still passes.
  it('humanities does-not-meet when SSC GPA is below the 2.0 minimum (combined 6.9 still passes)', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2022,
      sscGpa: 1.9,
      hscYear: 2024,
      hscGpa: 5.0,
    });
    expect(r.status).toBe('does-not-meet');
    expect(r.reasons.join(' ')).toContain('SSC GPA');
  });

  it('humanities does-not-meet when HSC GPA is below the 2.0 minimum (combined 6.9 still passes)', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2022,
      sscGpa: 5.0,
      hscYear: 2024,
      hscGpa: 1.9,
    });
    expect(r.status).toBe('does-not-meet');
    expect(r.reasons.join(' ')).toContain('HSC GPA');
  });

  it('humanities meets at the exact per-exam minimums: SSC 2.0 + HSC 2.5 = 4.50', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2023,
      sscGpa: 2.0,
      hscYear: 2025,
      hscGpa: 2.5,
    });
    expect(r.status).toBe('meets');
  });

  it('cannot-determine when the SSC year is outside 2022/2023', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2021,
      sscGpa: 5.0,
      hscYear: 2024,
      hscGpa: 5.0,
    });
    expect(r.status).toBe('cannot-determine');
  });

  it('cannot-determine when a GPA is missing or out of range', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2022,
      sscGpa: null,
      hscYear: 2024,
      hscGpa: 5.0,
    });
    expect(r.status).toBe('cannot-determine');
    const r2 = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2022,
      sscGpa: 5.0,
      hscYear: 2024,
      hscGpa: 6.0,
    });
    expect(r2.status).toBe('cannot-determine');
  });

  it('cannot-determine for an unknown circular version', () => {
    const r = validateAdmissionEligibility({
      group: 'humanities',
      sscYear: 2022,
      sscGpa: 5.0,
      hscYear: 2024,
      hscGpa: 5.0,
      circularVersion: 'nu-2026-27-v1',
    });
    expect(r.status).toBe('cannot-determine');
  });
});

describe('validateNuExamConfig (NU-4, §19.1.2)', () => {
  it('the verified 2025-26 full-mock seed validates clean', () => {
    expect(validateNuExamConfig(nuFullMockConfigSeed())).toEqual([]);
  });

  it('flags an 80-question mock, negative marking, a viva, and a wrong section split', () => {
    const bad = nuFullMockConfigSeed();
    (bad as { totalQuestions: number }).totalQuestions = 80;
    bad.marking = { correct: 1, incorrect: -0.25, unanswered: 0, negativeMarking: true };
    bad.vivaEnabled = true;
    bad.sections.bangla = 25;
    const problems = validateNuExamConfig(bad);
    expect(problems.length).toBeGreaterThanOrEqual(4);
    expect(problems.join(' ')).toMatch(/totalQuestions/);
    expect(problems.join(' ')).toMatch(/negativeMarking/);
    expect(problems.join(' ')).toMatch(/vivaEnabled/);
  });

  it('flags a non-null groupSubjectsDetail (Blocker B — sub-split unverified)', () => {
    const bad = nuFullMockConfigSeed();
    bad.sections.groupSubjectsDetail = { physics: 17, chemistry: 17, math: 6 };
    expect(validateNuExamConfig(bad).join(' ')).toMatch(/groupSubjectsDetail/);
  });

  it('flags a pass mark that is not display-only', () => {
    const bad = nuFullMockConfigSeed();
    bad.passMark = { value: 35, displayOnly: false };
    expect(validateNuExamConfig(bad).join(' ')).toMatch(/displayOnly/);
  });

  it('validates a daily config in its own bounds (20–30 Q, 20–30 min)', () => {
    const daily = {
      ...nuFullMockConfigSeed(),
      examType: 'NU_DAILY' as const,
      totalQuestions: 25,
      durationSeconds: 1500,
    };
    expect(validateNuExamConfig(daily)).toEqual([]);
    const badDaily = { ...daily, totalQuestions: 40 };
    expect(validateNuExamConfig(badDaily).join(' ')).toMatch(/NU_DAILY totalQuestions/);
  });
});
