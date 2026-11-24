/**
 * Eduvelto Job Preparation — Central Bank stats unit tests
 * (design-central-bank.md §10 step 15).
 *
 * Covers: all §7.1 metrics on a fixture bank (incl. the real 35 as
 * a fixture: 35 verified, 0 multi-exam, 0 disputed, English
 * coverage 13/13 topics), the coverage matrix, and the §6.3
 * analytics (Ft/Rt, priority score is NOT a probability — label
 * test, evidence levels A/B/C).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeBankStats, computeCoverage, computeTopicAnalytics, evidenceLevelFor, TOPIC_ANALYTICS_DISCLAIMER } from '../jobBankStats';
import { jobExamSelectionRulesFor } from '../jobBankSelection';
import { JOB_ENGLISH_TOPICS } from '../jobContent';
import { buildMigrationPlan } from '../../../scripts/migrate-central-bank-v2.mjs';
import type { CentralBankQuestion } from '../jobCentralBank';
import type { HistoricalQuestion } from '../jobHistory';

const BACKUP_PATH = fileURLToPath(
  new URL('../../../../backups/eduvelto-backup-20261124-014508.json', import.meta.url),
);
const SEED_PATH = fileURLToPath(
  new URL('../../../team/central-bank-seed.json', import.meta.url),
);

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

function migrated35(): CentralBankQuestion[] {
  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as Record<string, unknown>;
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as Record<string, unknown>;
  const { plan, problems } = buildMigrationPlan(backup, seed, { generatedAt: '2026-11-24T00:00:00.000Z' });
  expect(problems).toEqual([]);
  return (plan.questions as Array<{ id: string; doc: CentralBankQuestion }>).map((q) => q.doc);
}

describe('computeBankStats (§7.1)', () => {
  it('(st1) counts statuses, activity and difficulty on a mixed fixture', () => {
    const bank = [
      makeQ({ questionId: 'q1', difficulty: 'easy' }),
      makeQ({ questionId: 'q2', difficulty: 'hard', verificationStatus: 'reviewed', status: 'draft', reviewStatus: 'Under Review', reviewContentPassed: true, reviewerId: 'm1', verifiedBy: null, verifiedAt: null }),
      makeQ({ questionId: 'q3', verificationStatus: 'draft', status: 'draft', reviewStatus: 'Not Started', verifiedBy: null, verifiedAt: null }),
      makeQ({ questionId: 'q4', isActive: false }),
      makeQ({ questionId: 'q5', examMappings: ['bcs', 'bank'] }),
      makeQ({ questionId: 'q6', tags: ['english', 'disputed'] }),
    ];
    const stats = computeBankStats(bank, { calculatedAt: '2026-11-24T00:00:00.000Z' });
    expect(stats.total).toBe(6);
    expect(stats.verified).toBe(4);
    expect(stats.reviewed).toBe(1);
    expect(stats.draft).toBe(1);
    expect(stats.active).toBe(5);
    expect(stats.inactive).toBe(1);
    expect(stats.difficulty).toEqual({ easy: 1, medium: 4, hard: 1 });
    expect(stats.multiExamCount).toBe(1);
    expect(stats.disputedCount).toBe(1);
    expect(stats.outdatedCount).toBe(1);
    expect(stats.perExam.bcs.verified).toBe(4);
    expect(stats.perExam.bank.verified).toBe(1);
  });
  it('(st2) tracks the AI share and the previous-year proof separately', () => {
    const bank = [
      makeQ({ questionId: 'q1', origin: 'ai-generated-practice', source: { type: 'ai-generated', reference: 'ai-1', url: null } }),
      makeQ({ questionId: 'q2', origin: 'ai-generated-practice', source: { type: 'ai-generated', reference: 'ai-1', url: null }, verificationStatus: 'draft', status: 'draft', reviewStatus: 'Not Started', verifiedBy: null, verifiedAt: null }),
      makeQ({ questionId: 'q3', origin: 'verified-previous', source: { type: 'previous-year', reference: 'BCS 2023', url: 'https://bpsc.gov.bd/x' }, examYear: 2023 }),
      makeQ({ questionId: 'q4', origin: 'verified-previous', source: { type: 'previous-year', reference: 'BCS 2022', url: null }, examYear: 2022 }),
    ];
    const stats = computeBankStats(bank);
    expect(stats.aiGeneratedCount).toBe(2);
    expect(stats.aiGeneratedVerifiedCount).toBe(1);
    expect(stats.previousYearCount).toBe(2);
    expect(stats.previousYearWithProofCount).toBe(1);
  });
  it('(st3) the real 35: 35 verified, 0 multi-exam, 0 disputed, easy 10 / medium 19 / hard 6', () => {
    const stats = computeBankStats(migrated35(), { calculatedAt: '2026-11-24T00:00:00.000Z' });
    expect(stats.total).toBe(35);
    expect(stats.verified).toBe(35);
    expect(stats.reviewed).toBe(0);
    expect(stats.draft).toBe(0);
    expect(stats.multiExamCount).toBe(0);
    expect(stats.multiExamShare).toBe(0);
    expect(stats.disputedCount).toBe(0);
    expect(stats.outdatedCount).toBe(0);
    expect(stats.difficulty).toEqual({ easy: 10, medium: 19, hard: 6 });
    expect(stats.perSubject.english).toEqual({ total: 35, verified: 35 });
    expect(Object.keys(stats.perTopic)).toHaveLength(13);
    expect(stats.perExam.bcs.verified).toBe(35);
  });
});

describe('computeCoverage (§7.2)', () => {
  const englishTopics = JOB_ENGLISH_TOPICS.map((t) => t.topicId);
  it('(st4) the real 35: BCS English 13/13 topics = 100%, thin topics are the 2-question ones', () => {
    const rows = computeCoverage(
      migrated35(),
      jobExamSelectionRulesFor('bcs')!,
      { english: englishTopics },
      { lastCalculated: '2026-11-24T00:00:00.000Z' },
    );
    const english = rows.find((r) => r.subjectId === 'english')!;
    expect(english.target).toBe(30);
    expect(english.verified).toBe(35);
    expect(english.coveragePct).toBe(100);
    expect(english.missingTopics).toEqual([]);
    expect(english.thinTopics).toEqual([
      'english__grammar__articles',
      'english__vocabulary__antonym',
      'english__vocabulary__spelling',
      'english__vocabulary__one-word-substitution',
    ]);
    expect(english.hasVerifiedTopicList).toBe(true);
  });
  it('(st5) a subject with no verified topic list has coveragePct null, not 0', () => {
    const rows = computeCoverage(
      migrated35(),
      jobExamSelectionRulesFor('bcs')!,
      { english: englishTopics },
      { lastCalculated: '2026-11-24T00:00:00.000Z' },
    );
    const bangla = rows.find((r) => r.subjectId === 'bangla')!;
    expect(bangla.coveragePct).toBeNull();
    expect(bangla.hasVerifiedTopicList).toBe(false);
    expect(bangla.verified).toBe(0);
  });
  it('(st6) Bank English is 0% with all 13 topics missing (the list is verified, the questions are not there)', () => {
    const rows = computeCoverage(
      migrated35(),
      jobExamSelectionRulesFor('bank')!,
      { english: englishTopics },
      { lastCalculated: '2026-11-24T00:00:00.000Z' },
    );
    const english = rows.find((r) => r.subjectId === 'english')!;
    expect(english.coveragePct).toBe(0);
    expect(english.missingTopics).toHaveLength(13);
    expect(english.verified).toBe(0);
  });
});

describe('topic analytics (§6.3)', () => {
  const verifiedRecord = (year: number, n: number): HistoricalQuestion => ({
    historicalQuestionId: `H_BCS_${year}_${String(n).padStart(3, '0')}`,
    questionId: 'q_english_0001',
    examId: 'bcs',
    examYear: year,
    examPhase: 'preliminary',
    subjectId: 'english',
    topicId: 'english__grammar__tense',
    sourceType: 'official-paper',
    sourceReference: `BCS ${year} preliminary paper`,
    verificationStatus: 'Verified',
    verifiedAt: '2026-11-24T00:00:00.000Z',
    verifiedBy: 'moderator-1',
    auditTrail: [],
  });
  it('(st7) no verified records → evidence level C, zero frequency/recurrence', () => {
    const result = computeTopicAnalytics({
      examId: 'bcs',
      subjectId: 'english',
      topicId: 'english__grammar__tense',
      verifiedRecords: [],
      verifiedPaperCount: 0,
      syllabusScore: 80,
      currentRelevanceScore: 90,
      calculatedAt: '2026-11-24T00:00:00.000Z',
    });
    expect(result.totalOccurrences).toBe(0);
    expect(result.yearCoverage).toBe(0);
    expect(result.evidenceLevel).toBe('C');
    expect(result.preparationPriority).toBe(0.25 * 80 + 0.15 * 90);
  });
  it('(st8) three verified years → evidence level A; Ft and Rt are shown together', () => {
    const records = [
      verifiedRecord(2021, 1), verifiedRecord(2021, 2),
      verifiedRecord(2022, 1), verifiedRecord(2023, 1),
    ];
    const result = computeTopicAnalytics({
      examId: 'bcs',
      subjectId: 'english',
      topicId: 'english__grammar__tense',
      verifiedRecords: records,
      verifiedPaperCount: 3,
      syllabusScore: 80,
      currentRelevanceScore: 90,
      calculatedAt: '2026-11-24T00:00:00.000Z',
    });
    expect(result.totalOccurrences).toBe(4);
    expect(result.yearsCovered).toBe(3);
    expect(result.yearCoverage).toBe(100);
    expect(result.evidenceLevel).toBe('A');
  });
  it('(st9) the priority score is NOT a probability — the disclaimer says so', () => {
    expect(TOPIC_ANALYTICS_DISCLAIMER).toContain('নিশ্চয়তা');
    const result = computeTopicAnalytics({
      examId: 'bcs',
      subjectId: 'english',
      topicId: 'english__grammar__tense',
      verifiedRecords: [verifiedRecord(2023, 1)],
      verifiedPaperCount: 1,
      syllabusScore: 100,
      currentRelevanceScore: 100,
      calculatedAt: '2026-11-24T00:00:00.000Z',
    });
    expect(result.disclaimer).toBe(TOPIC_ANALYTICS_DISCLAIMER);
    expect(result.preparationPriority).toBeLessThanOrEqual(100);
    expect(result.evidenceLevel).toBe('B');
  });
  it('(st10) evidence levels: A needs ≥3 papers and ≥3 years; B needs ≥1 paper', () => {
    expect(evidenceLevelFor({ verifiedPaperCount: 0, yearsCovered: 0 })).toBe('C');
    expect(evidenceLevelFor({ verifiedPaperCount: 1, yearsCovered: 1 })).toBe('B');
    expect(evidenceLevelFor({ verifiedPaperCount: 3, yearsCovered: 2 })).toBe('B');
    expect(evidenceLevelFor({ verifiedPaperCount: 3, yearsCovered: 3 })).toBe('A');
  });
});
