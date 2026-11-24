// Pool-doc verifier — design-live-exam-dashboard.md §4.3:
// pool docs carry IDs only, never text / options / answers.
import { describe, expect, it } from 'vitest';
import { examQuestionPoolIdFor, verifyPoolDocsContainIdsOnly } from '../jobQuestionPools';

const GOOD_POOL = {
  poolId: 'pool__bank__scored__bangla__bangla-topic__easy__0',
  examId: 'bank',
  subjectId: 'bangla',
  topicId: 'bangla-topic',
  difficulty: 'easy',
  poolKind: 'scored',
  questionIds: ['q-001', 'q-002'],
  chunkIndex: 0,
  chunkCount: 1,
  generatedAt: '2026-11-24T00:00:00.000Z',
  bankVersion: '2026-11-24.1',
  selectionRulesVersion: 'v1',
  eligibleCount: 2,
};

describe('examQuestionPoolIdFor', () => {
  it('uses agent A’s pool-ID scheme (one scheme, everywhere)', () => {
    expect(examQuestionPoolIdFor('bank', 'scored', 'bangla', 'bangla-topic', 'easy', 0)).toBe(
      'pool__bank__scored__bangla__bangla-topic__easy__0',
    );
    expect(examQuestionPoolIdFor('bcs', 'practice', 'english', 'tense', 'hard', 2)).toBe(
      'pool__bcs__practice__english__tense__hard__2',
    );
  });
});

describe('verifyPoolDocsContainIdsOnly (§4.3)', () => {
  it('passes a clean pool doc', () => {
    expect(verifyPoolDocsContainIdsOnly([GOOD_POOL])).toEqual([]);
    expect(verifyPoolDocsContainIdsOnly([])).toEqual([]);
  });

  it('rejects question text, options, and answers in a pool doc', () => {
    for (const leak of ['questionText', 'options', 'correctLetter', 'correctText', 'explanation']) {
      expect(verifyPoolDocsContainIdsOnly([{ ...GOOD_POOL, [leak]: 'x' }]).length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown fields, duplicate IDs, and oversized chunks', () => {
    expect(
      verifyPoolDocsContainIdsOnly([{ ...GOOD_POOL, extraField: 1 }]).length,
    ).toBeGreaterThan(0);
    expect(
      verifyPoolDocsContainIdsOnly([{ ...GOOD_POOL, questionIds: ['q-001', 'q-001'] }]).length,
    ).toBeGreaterThan(0);
    expect(
      verifyPoolDocsContainIdsOnly([
        { ...GOOD_POOL, questionIds: Array.from({ length: 201 }, (_, i) => `q-${i}`) },
      ]).length,
    ).toBeGreaterThan(0);
    expect(verifyPoolDocsContainIdsOnly([{ ...GOOD_POOL, questionIds: 'not-a-list' }]).length).toBeGreaterThan(0);
    expect(verifyPoolDocsContainIdsOnly('not-a-list').length).toBeGreaterThan(0);
  });
});
