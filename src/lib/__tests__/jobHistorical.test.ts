/**
 * Eduvelto Job Preparation — historical-question unit tests
 * (design-grades-written-previous-admin.md §7 steps 10 + 13).
 *
 * Covers: H_<EXAM>_<YEAR>_<NNN> ids, uniqueness, the validator,
 * and the six-step import wizard gate (Publish blocked until the
 * verifier step passes, second eye, duplicate decision).
 */
import { describe, it, expect } from 'vitest';
import {
  historicalIdFor,
  checkHistoricalUniqueness,
  validateHistoricalQuestion,
  historicalImportPublishGate,
  historicalImportCurrentStep,
  HISTORICAL_IMPORT_STEPS,
  type HistoricalQuestion,
  type HistoricalImportState,
} from '../jobHistory';

function makeRecord(overrides: Partial<HistoricalQuestion> = {}): HistoricalQuestion {
  return {
    historicalQuestionId: 'H_BCS_2023_001',
    questionId: 'bcs-eng-001',
    examId: 'bcs',
    examYear: 2023,
    examPhase: 'preliminary',
    subjectId: 'bcs__english',
    topicId: 'tense',
    sourceType: 'official-paper',
    sourceReference: 'BCS 45th Preliminary Question Paper, 2023',
    verificationStatus: 'Verified',
    verifiedAt: '2026-11-24T00:00:00.000Z',
    verifiedBy: 'owner',
    patternTag: null,
    auditTrail: [],
    ...overrides,
  };
}

describe('historicalIdFor (§3.2 — H_<EXAM>_<YEAR>_<NNN>)', () => {
  it('formats the id', () => {
    expect(historicalIdFor('bcs', 2023, 1)).toBe('H_BCS_2023_001');
    expect(historicalIdFor('bank', 2025, 42)).toBe('H_BANK_2025_042');
    expect(historicalIdFor('grade-11-20', 2024, 7)).toBe('H_GRADE_11_20_2024_007');
  });

  it('rejects bad inputs', () => {
    expect(() => historicalIdFor('BCS', 2023, 1)).toThrow();
    expect(() => historicalIdFor('bcs', 1800, 1)).toThrow();
    expect(() => historicalIdFor('bcs', 2023, 0)).toThrow();
    expect(() => historicalIdFor('bcs', 2023, 1000)).toThrow();
  });
});

describe('uniqueness (§3.2 — no duplicate counting)', () => {
  it('flags a second record for the same (exam, year, phase, question)', () => {
    const problems = checkHistoricalUniqueness([makeRecord()], {
      ...makeRecord(),
      historicalQuestionId: 'H_BCS_2023_002',
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('already exists');
  });

  it('the same question in a DIFFERENT year is recurrence data, not a duplicate', () => {
    const problems = checkHistoricalUniqueness([makeRecord()], {
      ...makeRecord(),
      historicalQuestionId: 'H_BCS_2024_001',
      examYear: 2024,
    });
    expect(problems).toEqual([]);
  });

  it('flags a duplicate historicalQuestionId', () => {
    const problems = checkHistoricalUniqueness([makeRecord()], makeRecord());
    expect(problems.some((p) => p.includes('already exists'))).toBe(true);
  });
});

describe('validateHistoricalQuestion', () => {
  it('passes a valid Verified record', () => {
    expect(validateHistoricalQuestion(makeRecord() as unknown as Record<string, unknown>)).toEqual([]);
  });

  it('a Verified record needs verifiedBy + verifiedAt', () => {
    const problems = validateHistoricalQuestion({
      ...makeRecord(),
      verifiedBy: null,
      verifiedAt: null,
    } as unknown as Record<string, unknown>);
    expect(problems.some((p) => p.includes('verifiedBy'))).toBe(true);
    expect(problems.some((p) => p.includes('verifiedAt'))).toBe(true);
  });

  it('rejects a bad id shape and a missing source reference', () => {
    const problems = validateHistoricalQuestion({
      ...makeRecord(),
      historicalQuestionId: 'bad-id',
      sourceReference: '',
    } as unknown as Record<string, unknown>);
    expect(problems.some((p) => p.includes('historicalQuestionId'))).toBe(true);
    expect(problems.some((p) => p.includes('sourceReference'))).toBe(true);
  });

  it('patternTag must be a string or null', () => {
    const problems = validateHistoricalQuestion({
      ...makeRecord(),
      patternTag: 42,
    } as unknown as Record<string, unknown>);
    expect(problems.some((p) => p.includes('patternTag'))).toBe(true);
    expect(
      validateHistoricalQuestion({ ...makeRecord(), patternTag: 'samash-identify-type' } as unknown as Record<string, unknown>),
    ).toEqual([]);
  });
});

describe('import wizard gate (§3.3 — Publish blocked until verify passes)', () => {
  function baseState(overrides: Partial<HistoricalImportState> = {}): HistoricalImportState {
    return {
      completed: {
        source: true,
        transcribe: true,
        'historical-record': true,
        verify: true,
        'link-publish': false,
        correction: false,
      },
      authorUid: 'author-1',
      verifierUid: 'verifier-1',
      duplicateDecision: 'distinct',
      ...overrides,
    };
  }

  it('has six steps in order', () => {
    expect(HISTORICAL_IMPORT_STEPS).toEqual([
      'source',
      'transcribe',
      'historical-record',
      'verify',
      'link-publish',
      'correction',
    ]);
  });

  it('a complete, second-eye, decided import passes the gate', () => {
    expect(historicalImportPublishGate(baseState())).toEqual([]);
  });

  it('blocks Publish when the verify step is incomplete', () => {
    const problems = historicalImportPublishGate(
      baseState({ completed: { source: true, transcribe: true, 'historical-record': true } }),
    );
    expect(problems.some((p) => p.includes("'verify'"))).toBe(true);
  });

  it('blocks Publish when the verifier IS the author (second-eye rule)', () => {
    const problems = historicalImportPublishGate(baseState({ verifierUid: 'author-1' }));
    expect(problems.some((p) => p.includes('must not be the author'))).toBe(true);
  });

  it('blocks Publish with no verifier and no duplicate decision', () => {
    const problems = historicalImportPublishGate(
      baseState({ verifierUid: null, duplicateDecision: null }),
    );
    expect(problems.some((p) => p.includes('no verifier'))).toBe(true);
    expect(problems.some((p) => p.includes('duplicate decision'))).toBe(true);
  });

  it('current step is the first incomplete step', () => {
    expect(historicalImportCurrentStep(baseState())).toBe('link-publish');
    expect(
      historicalImportCurrentStep(baseState({ completed: { source: true } })),
    ).toBe('transcribe');
    expect(
      historicalImportCurrentStep(baseState({ completed: {} })),
    ).toBe('source');
  });
});
