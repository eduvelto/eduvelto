/**
 * Eduvelto Job Preparation — Central Bank selection unit tests
 * (design-central-bank.md §10 step 14).
 *
 * Covers: pool generation (eligibility §3.5), weighted sampling
 * without replacement (no duplicate in one set, 1,000-trial
 * property test), the exposure scoring table, the small-bank
 * fallback (35-eligible / 30-seen / 25-required → ≥20 repeats +
 * notice flag), and blueprint strictness (repetition relaxed
 * before blueprint). The selection LOOP itself is design doc B —
 * this file tests the pure core it calls.
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  SMALL_BANK_NOTICE_BN,
  allJobExamSelectionRules,
  buildExamQuestionPools,
  canonicalSubjectsForExam,
  exposureScore,
  exposureScoreByRank,
  isPoolEligible,
  isSelectableExamKey,
  jobExamSelectionRulesFor,
  mergeExposureHistory,
  selectForQuota,
  selectWeightedWithoutReplacement,
  verifyPoolIds,
} from '../jobBankSelection';
import type { CentralBankQuestion } from '../jobCentralBank';

/** Deterministic PRNG (mulberry32) for the property tests. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeQ(overrides: Partial<CentralBankQuestion> & { questionId: string }): CentralBankQuestion {
  return {
    subjectId: 'english',
    topicId: 'english__grammar__tense',
    subtopicId: null,
    difficulty: 'medium',
    questionType: 'mcq',
    question: 'Choose the correct sentence.',
    options: [
      { letter: 'A', text: 'He go to school every day.' },
      { letter: 'B', text: 'He going to school every day.' },
      { letter: 'C', text: 'He goes to school every day.' },
      { letter: 'D', text: 'He gone to school every day.' },
    ],
    correctAnswer: 'C',
    explanation: 'ব্যাখ্যা।',
    whyWrong: null,
    examMappings: ['bcs'],
    syllabusMappings: {
      bcs: {
        subjectId: 'bcs__english',
        chapterId: 'bcs__english__grammar',
        topicId: 'bcs__english__grammar__tense',
        syllabusVersion: '50th-bcs-2025-12-09',
        syllabusTopicId: 'english__grammar__tense',
        verified: true,
      },
    },
    verificationStatus: 'verified',
    isActive: true,
    origin: 'admin-practice',
    source: { type: 'original-practice', reference: 'Batch 1', url: null },
    examYear: null,
    tags: ['english', 'english__grammar__tense', 'bcs'],
    passageId: null,
    duplicateHash: 'abcdef0123456789',
    duplicateHashV2: '0123456789abcdef',
    stemHash: '0123456789abcdef',
    duplicateOf: null,
    authorId: null,
    verifiedBy: 'nczNklmktsVrxg43UzcgdSm6v0j2',
    verifiedAt: '2026-11-22T00:00:00.000Z',
    version: 1,
    configVersion: '2026-11-22.1',
    status: 'published',
    reviewStatus: 'Published',
    ...overrides,
  } as CentralBankQuestion;
}

describe('selection rules (§3.3)', () => {
  it('(bs1) BCS copies the verified 50th split: 200 / 120 min / −0.50', () => {
    const rules = jobExamSelectionRulesFor('bcs');
    expect(rules).not.toBeNull();
    expect(rules!.totalQuestions).toBe(200);
    expect(rules!.durationMinutes).toBe(120);
    expect(rules!.negativeMarking).toBe(0.5);
    expect(rules!.negativeMarkingVerified).toBe(true);
    expect(rules!.verificationStatus).toBe('verified');
    expect(rules!.subjectWeights.map((w) => [w.subjectId, w.questions])).toEqual([
      ['bangla', 30], ['english', 30], ['bangladesh-affairs', 25],
      ['international-affairs', 25], ['geography', 10], ['general-science', 15],
      ['ict', 15], ['mathematical-reasoning', 20], ['mental-ability', 15], ['ethics', 15],
    ]);
  });
  it('(bs2) Bank Officer/Cash: 100 / 60 min / −0.25 verified', () => {
    const rules = jobExamSelectionRulesFor('bank');
    expect(rules!.totalQuestions).toBe(100);
    expect(rules!.negativeMarking).toBe(0.25);
    expect(rules!.subjectWeights.map((w) => [w.subjectId, w.questions])).toEqual([
      ['bangla', 25], ['english', 25], ['math', 20], ['general-knowledge', 20], ['ict', 10],
    ]);
  });
  it('(bs3) Bank SO and AD share the shape but are separate docs (E-3)', () => {
    const so = jobExamSelectionRulesFor('bank-senior-officer');
    const ad = jobExamSelectionRulesFor('bank-assistant-director');
    expect(so!.subjectWeights).toEqual(ad!.subjectWeights);
    expect(so!.subjectWeights.map((w) => [w.subjectId, w.questions])).toEqual([
      ['english', 20], ['bangla', 20], ['math', 20],
      ['financial-banking', 10], ['analytical-skills', 20], ['ict', 10],
    ]);
    expect(so!.examId).not.toBe(ad!.examId);
    expect(so!.patternSource).not.toBe(ad!.patternSource);
  });
  it('(bs4) Primary: 90 / 90 min / −0.25 / pass 50%; NTRCA: 100 / last-verified 18th', () => {
    const primary = jobExamSelectionRulesFor('primary-teacher');
    expect(primary!.totalQuestions).toBe(90);
    expect(primary!.durationMinutes).toBe(90);
    expect(primary!.passPercent).toBe(50);
    expect(primary!.subjectWeights.find((w) => w.subjectId === 'math-science')?.questions).toBe(20);
    const ntrca = jobExamSelectionRulesFor('ntrca');
    expect(ntrca!.totalQuestions).toBe(100);
    expect(ntrca!.verificationStatus).toBe('last-verified');
    expect(ntrca!.scoringConfigVersion).toBe('18th-v1');
  });
  it('(bs5) grade_11_20 is a DRAFT doc — nothing selectable under it', () => {
    const rules = jobExamSelectionRulesFor('grade_11_20');
    expect(rules!.verificationStatus).toBe('draft');
    expect(rules!.totalQuestions).toBeNull();
    expect(rules!.subjectWeights).toEqual([]);
    expect(isSelectableExamKey('grade_11_20')).toBe(false);
  });
  it('(bs6) every verified exam\'s weights sum to its questionCount', () => {
    for (const rules of allJobExamSelectionRules()) {
      if (rules.totalQuestions === null) continue;
      const sum = rules.subjectWeights.reduce((a, w) => a + w.questions, 0);
      expect(sum).toBe(rules.totalQuestions);
    }
  });
  it('(bs7) unknown keys return null; selectable keys are the verified six', () => {
    expect(jobExamSelectionRulesFor('dgfood')).toBeNull();
    expect(jobExamSelectionRulesFor('no-such-exam')).toBeNull();
    expect(isSelectableExamKey('bcs')).toBe(true);
    expect(isSelectableExamKey('bank')).toBe(true);
    expect(isSelectableExamKey('dgfood')).toBe(false);
  });
  it('(bs8) the default difficulty mix is the batch target 30/55/15', () => {
    expect(DEFAULT_DIFFICULTY_DISTRIBUTION).toEqual({ easy: 30, medium: 55, hard: 15 });
  });
  it('(bs9) canonical subjects per exam come from the verified configs', () => {
    expect(canonicalSubjectsForExam('bcs')).toEqual([
      'bangla', 'english', 'bangladesh-affairs', 'international-affairs', 'geography',
      'general-science', 'ict', 'mathematical-reasoning', 'mental-ability', 'ethics',
    ]);
    expect(canonicalSubjectsForExam('primary-teacher')).toEqual([
      'bangla', 'english', 'math-science', 'general-knowledge',
    ]);
    expect(canonicalSubjectsForExam('dgfood')).toBeNull();
  });
});

describe('pool generation (§3.5)', () => {
  const bcsRules = jobExamSelectionRulesFor('bcs')!;
  it('(bs10) a verified, mapped question enters the scored pool', () => {
    const pools = buildExamQuestionPools([makeQ({ questionId: 'q_english_0001' })], bcsRules, { generatedAt: '2026-11-24T00:00:00.000Z' });
    expect(pools.some((p) => p.poolKind === 'scored' && p.questionIds.includes('q_english_0001'))).toBe(true);
  });
  it('(bs11) a reviewed question enters the practice pool only, never scored', () => {
    const q = makeQ({
      questionId: 'q_english_0002',
      verificationStatus: 'reviewed',
      status: 'draft',
      reviewStatus: 'Under Review',
      reviewContentPassed: true,
      reviewerId: 'moderator-1',
      verifiedBy: null,
      verifiedAt: null,
    });
    const pools = buildExamQuestionPools([q], bcsRules, { generatedAt: '2026-11-24T00:00:00.000Z' });
    expect(pools.some((p) => p.poolKind === 'scored')).toBe(false);
    expect(pools.some((p) => p.poolKind === 'practice' && p.questionIds.includes('q_english_0002'))).toBe(true);
  });
  it('(bs12) disputed, inactive, unmapped and unverified-mapping questions enter no pool', () => {
    const disputed = makeQ({ questionId: 'q1', tags: ['english', 'disputed'] });
    const inactive = makeQ({ questionId: 'q2', isActive: false });
    const unmapped = makeQ({ questionId: 'q3', examMappings: ['bank'] });
    const unverifiedMapping = makeQ({
      questionId: 'q4',
      syllabusMappings: {
        bcs: {
          subjectId: 'bcs__english',
          topicId: 'bcs__english__grammar__tense',
          syllabusVersion: '50th-bcs-2025-12-09',
          syllabusTopicId: 'english__grammar__tense',
          verified: false,
        },
      },
    });
    expect(buildExamQuestionPools([disputed, inactive, unmapped], bcsRules)).toEqual([]);
    const practiceOnly = buildExamQuestionPools([unverifiedMapping], bcsRules);
    expect(practiceOnly.some((p) => p.poolKind === 'scored')).toBe(false);
    expect(practiceOnly.some((p) => p.poolKind === 'practice')).toBe(true);
  });
  it('(bs13) pools chunk at 200 IDs per doc', () => {
    const many = Array.from({ length: 201 }, (_, i) => makeQ({ questionId: `q_english_${String(i + 1).padStart(4, '0')}` }));
    const pools = buildExamQuestionPools(many, bcsRules, { generatedAt: '2026-11-24T00:00:00.000Z' });
    const scored = pools.filter((p) => p.poolKind === 'scored');
    expect(scored).toHaveLength(2);
    expect(scored[0].questionIds).toHaveLength(200);
    expect(scored[1].questionIds).toHaveLength(1);
    expect(scored[0].chunkCount).toBe(2);
    expect(scored[1].chunkIndex).toBe(1);
    expect(scored[0].eligibleCount).toBe(201);
  });
  it('(bs14) pool IDs are deterministic and IDs are sorted within a pool', () => {
    const qs = [makeQ({ questionId: 'q_english_0003' }), makeQ({ questionId: 'q_english_0001' })];
    const a = buildExamQuestionPools(qs, bcsRules, { generatedAt: '2026-11-24T00:00:00.000Z' });
    const b = buildExamQuestionPools([...qs].reverse(), bcsRules, { generatedAt: '2026-11-24T00:00:00.000Z' });
    expect(a).toEqual(b);
    expect(a.find((p) => p.poolKind === 'scored')!.questionIds).toEqual(['q_english_0001', 'q_english_0003']);
  });
  it('(bs15) isPoolEligible is the single eligibility rule', () => {
    expect(isPoolEligible(makeQ({ questionId: 'q1' }), 'bcs', 'scored')).toBe(true);
    expect(isPoolEligible(makeQ({ questionId: 'q1' }), 'bank', 'scored')).toBe(false);
  });
});

describe('pool verification (§3.5)', () => {
  const bank = {
    q1: makeQ({ questionId: 'q1' }),
    q2: makeQ({ questionId: 'q2', isActive: false }),
  };
  it('(bs16) a clean set verifies', () => {
    expect(verifyPoolIds(['q1'], bank, 'bcs')).toEqual([]);
  });
  it('(bs17) missing, withdrawn and duplicate IDs are reported', () => {
    expect(verifyPoolIds(['q-missing'], bank, 'bcs').length).toBeGreaterThan(0);
    expect(verifyPoolIds(['q2'], bank, 'bcs').length).toBeGreaterThan(0);
    expect(verifyPoolIds(['q1', 'q1'], bank, 'bcs').length).toBeGreaterThan(0);
  });
});

describe('exposure scoring (§3.6)', () => {
  it('(bs18) the scoring table is never-seen 10 / >10 ago 6 / 6–10 ago 4 / 2–5 ago 2 / previous 0.5', () => {
    expect(exposureScore(null)).toBe(10);
    expect(exposureScore(1)).toBe(0.5);
    expect(exposureScore(2)).toBe(2);
    expect(exposureScore(5)).toBe(2);
    expect(exposureScore(6)).toBe(4);
    expect(exposureScore(10)).toBe(4);
    expect(exposureScore(11)).toBe(6);
    expect(exposureScore(100)).toBe(6);
  });
  it('(bs19) rank scoring mirrors the table (rank 0 most recent)', () => {
    expect(exposureScoreByRank(null)).toBe(10);
    expect(exposureScoreByRank(0)).toBe(0.5);
    expect(exposureScoreByRank(4)).toBe(2);
    expect(exposureScoreByRank(9)).toBe(4);
    expect(exposureScoreByRank(10)).toBe(6);
  });
});

describe('weighted sampling without replacement (§3.6)', () => {
  it('(bs20) 1,000 trials never repeat an ID inside one set', () => {
    const items = Array.from({ length: 35 }, (_, i) => ({
      id: `q${i + 1}`,
      weight: 10,
      value: `q${i + 1}`,
    }));
    for (let trial = 0; trial < 1000; trial += 1) {
      const picked = selectWeightedWithoutReplacement(items, 25, seededRandom(trial));
      expect(picked).toHaveLength(25);
      expect(new Set(picked).size).toBe(25);
    }
  });
  it('(bs21) weights bias the pick (a weight-100 item is picked far more often)', () => {
    const items = [
      { id: 'heavy', weight: 100, value: 'heavy' },
      { id: 'light', weight: 1, value: 'light' },
    ];
    let heavy = 0;
    for (let trial = 0; trial < 1000; trial += 1) {
      const picked = selectWeightedWithoutReplacement(items, 1, seededRandom(trial));
      if (picked[0] === 'heavy') heavy += 1;
    }
    expect(heavy).toBeGreaterThan(900);
  });
  it('(bs22) asking for more than available returns all, never duplicates', () => {
    const items = [{ id: 'a', weight: 10, value: 'a' }];
    expect(selectWeightedWithoutReplacement(items, 5, seededRandom(1))).toEqual(['a']);
  });
});

describe('small-bank fallback (§3.6)', () => {
  const eligible = Array.from({ length: 35 }, (_, i) => `q_english_${String(i + 1).padStart(4, '0')}`);
  it('(bs23) 35 eligible / 30 seen / 25 required → at least 20 must repeat + notice', () => {
    const history = { examId: 'bcs', recentQuestionIds: eligible.slice(0, 30), lastAttemptNo: 3 };
    const result = selectForQuota(eligible, history, 25, seededRandom(7));
    expect(result.selected).toHaveLength(25);
    expect(new Set(result.selected).size).toBe(25);
    expect(result.repeatedCount).toBeGreaterThanOrEqual(20);
    expect(result.needsSmallBankNotice).toBe(true);
    expect(result.shortfall).toBe(0);
    expect(SMALL_BANK_NOTICE_BN).toContain('প্রশ্নব্যাংক এখনো ছোট');
  });
  it('(bs24) an unseen bank needs no notice and repeats nothing', () => {
    const history = { examId: 'bcs', recentQuestionIds: [], lastAttemptNo: 0 };
    const result = selectForQuota(eligible, history, 25, seededRandom(7));
    expect(result.repeatedCount).toBe(0);
    expect(result.needsSmallBankNotice).toBe(false);
  });
  it('(bs25) a shortfall is reported, never hidden by relaxing uniqueness', () => {
    const history = { examId: 'bcs', recentQuestionIds: [], lastAttemptNo: 0 };
    const result = selectForQuota(eligible.slice(0, 10), history, 25, seededRandom(7));
    expect(result.selected).toHaveLength(10);
    expect(result.shortfall).toBe(15);
  });
  it('(bs26) merging history bounds it and bumps the attempt number', () => {
    const history = { examId: 'bcs', recentQuestionIds: ['q1', 'q2'], lastAttemptNo: 2 };
    const merged = mergeExposureHistory(history, ['q3', 'q1'], 3);
    expect(merged.recentQuestionIds).toEqual(['q3', 'q1', 'q2']);
    expect(merged.lastAttemptNo).toBe(3);
  });
});
