/**
 * Eduvelto Job Preparation — Central Bank migration dry-run tests
 * (design-central-bank.md §10 step 16).
 *
 * Migration dry-run against the BACKUP JSON (never live): the §5.2
 * field map applied to all 35 (texts/options/answers byte-identical,
 * v2 hashes distinct, 0 exact duplicates, bundle partition still
 * exact, keys still match). The test also cross-checks the script's
 * JS mirrors against the lib (hashes, pools, stats, coverage,
 * selection rules, topics) so a drift between the two fails here,
 * not at migration time.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  buildMigrationPlan,
  migrateLegacyQuestionToV2,
  validateMigratedQuestion,
  duplicateHashV2For as scriptHashV2,
  stemHashFor as scriptStemHash,
  extractPassageStem as scriptExtractStem,
  READING_PASSAGE_TEXT,
  READING_PASSAGE_ID,
  MIGRATION_SCHEMA_VERSION,
} from '../../../scripts/migrate-central-bank-v2.mjs';
import {
  validateCentralBankQuestion,
  duplicateHashV2For as libHashV2,
  stemHashFor as libStemHash,
  extractPassageStem as libExtractStem,
} from '../jobCentralBank';
import { computeBankStats, computeCoverage } from '../jobBankStats';
import { buildExamQuestionPools, jobExamSelectionRulesFor } from '../jobBankSelection';
import { JOB_ENGLISH_TOPICS } from '../jobContent';
import { JOB_SUBJECTS } from '../jobContent';
import { PUBLIC_BCS_ENGLISH_QUESTIONS, PUBLIC_BCS_READING_PASSAGE } from '../publicBcsEnglish';
import type { CentralBankQuestion } from '../jobCentralBank';

const BACKUP_PATH = fileURLToPath(
  new URL('../../../../backups/eduvelto-backup-20261124-014508.json', import.meta.url),
);
const SEED_PATH = fileURLToPath(
  new URL('../../../team/central-bank-seed.json', import.meta.url),
);
const TOPICS_PATH = fileURLToPath(
  new URL('../../../team/job-topics-english.json', import.meta.url),
);

/** The 15-question BCS English mock set (mock-set-designation.md). */
const MOCK_SET_15 = [
  'bcs-eng-001', 'bcs-eng-004', 'bcs-eng-009', 'bcs-eng-010', 'bcs-eng-011',
  'bcs-eng-012', 'bcs-eng-013', 'bcs-eng-017', 'bcs-eng-020', 'bcs-eng-022',
  'bcs-eng-025', 'bcs-eng-027', 'bcs-eng-029', 'bcs-eng-031', 'bcs-eng-034',
];
const SPARE_20 = [
  'bcs-eng-002', 'bcs-eng-003', 'bcs-eng-005', 'bcs-eng-006', 'bcs-eng-007',
  'bcs-eng-008', 'bcs-eng-014', 'bcs-eng-015', 'bcs-eng-016', 'bcs-eng-018',
  'bcs-eng-019', 'bcs-eng-021', 'bcs-eng-023', 'bcs-eng-024', 'bcs-eng-026',
  'bcs-eng-028', 'bcs-eng-030', 'bcs-eng-032', 'bcs-eng-033', 'bcs-eng-035',
];

interface BackupDoc {
  id: string;
  [key: string]: unknown;
}

function loadAll() {
  const backup = JSON.parse(readFileSync(BACKUP_PATH, 'utf8')) as {
    data: Record<string, BackupDoc[]>;
  };
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as Record<string, unknown>;
  const topics = JSON.parse(readFileSync(TOPICS_PATH, 'utf8')) as Record<string, unknown>;
  const { plan, report, problems } = buildMigrationPlan(backup, seed, {
    generatedAt: '2026-11-24T00:00:00.000Z',
    backupFile: BACKUP_PATH,
  });
  return { backup, seed, topics, plan, report, problems };
}

function migratedDocs(plan: Record<string, unknown>): CentralBankQuestion[] {
  return (plan.questions as Array<{ id: string; doc: CentralBankQuestion }>).map((q) => q.doc);
}

describe('migration dry-run against the backup (§5.2)', () => {
  it('(mg1) the plan builds with zero problems', () => {
    const { problems, report } = loadAll();
    expect(problems).toEqual([]);
    const counts = report.counts as Record<string, number>;
    expect(counts.questions).toBe(35);
    expect(counts.bundles).toBe(13);
    expect(counts.keys).toBe(13);
    expect(counts.subjects).toBe(23);
    expect(counts.chapters).toBe(3);
    expect(counts.topics).toBe(13);
    expect(counts.passages).toBe(1);
    expect(counts.selectionRules).toBe(7);
  });
  it('(mg2) every migrated doc passes BOTH validators (script + lib)', () => {
    const { plan } = loadAll();
    for (const doc of migratedDocs(plan)) {
      expect(validateMigratedQuestion(doc as unknown as Record<string, unknown>)).toEqual([]);
      expect(validateCentralBankQuestion(doc as unknown as Record<string, unknown>)).toEqual([]);
    }
  });
  it('(mg3) texts, options and answers are byte-identical (except the 3 de-inlined stems)', () => {
    const { backup, plan } = loadAll();
    const legacyById = new Map(
      (backup.data.jobQuestions as BackupDoc[]).map((q) => [q.id, q]),
    );
    const onDiskById = new Map(PUBLIC_BCS_ENGLISH_QUESTIONS.map((q) => [q.id, q]));
    for (const doc of migratedDocs(plan)) {
      const legacy = legacyById.get(doc.questionId)!;
      expect(doc.options).toEqual(legacy.options);
      expect(doc.correctAnswer).toBe(legacy.correctLetter);
      expect(doc.explanation).toBe(legacy.explanation);
      expect(doc.version).toBe(1);
      expect(doc.schemaVersion).toBe(MIGRATION_SCHEMA_VERSION);
      expect(doc.legacyId).toBe(doc.questionId);
      if (['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035'].includes(doc.questionId)) {
        // De-inlined stem == the on-disk source's stem-only text.
        expect(doc.question).toBe(onDiskById.get(doc.questionId)!.questionText);
        expect(doc.passageId).toBe(READING_PASSAGE_ID);
      } else {
        expect(doc.question).toBe(legacy.questionText);
        expect(doc.passageId).toBeNull();
      }
    }
  });
  it('(mg4) the field map is exactly §5.2 (canonical keys, mappings, origin, tags)', () => {
    const { plan } = loadAll();
    const doc = migratedDocs(plan).find((d) => d.questionId === 'bcs-eng-001')!;
    expect(doc.subjectId).toBe('english');
    expect(doc.topicId).toBe('english__grammar__tense');
    expect(doc.subtopicId).toBeNull();
    expect(doc.questionType).toBe('mcq');
    expect(doc.examMappings).toEqual(['bcs']);
    expect(doc.syllabusMappings.bcs).toEqual({
      subjectId: 'bcs__english',
      chapterId: 'bcs__english__grammar',
      topicId: 'bcs__english__grammar__tense',
      syllabusVersion: '50th-bcs-2025-12-09',
      syllabusTopicId: 'english__grammar__tense',
      verified: true,
    });
    expect(doc.verificationStatus).toBe('verified');
    expect(doc.isActive).toBe(true);
    expect(doc.origin).toBe('admin-practice');
    expect(doc.source).toEqual({
      type: 'original-practice',
      reference: 'owner-verified BCS English Batch 1, 22 Nov 2026',
      url: null,
    });
    expect(doc.examYear).toBeNull();
    expect(doc.tags).toEqual(['english', 'english__grammar__tense', 'bcs', 'batch:bcs-english-batch1']);
    expect(doc.authorId).toBeNull();
    expect(doc.verifiedBy).toBe('nczNklmktsVrxg43UzcgdSm6v0j2');
    expect(doc.configVersion).toBe('2026-11-22.1');
  });
  it('(mg5) v2 hashes are distinct across all 35, and script == lib', () => {
    const { plan } = loadAll();
    const v2Hashes = new Set<string>();
    const stemHashes = new Set<string>();
    for (const doc of migratedDocs(plan)) {
      v2Hashes.add(doc.duplicateHashV2);
      stemHashes.add(doc.stemHash!);
      expect(doc.duplicateHashV2).toBe(
        libHashV2({
          question: doc.question,
          subjectId: doc.subjectId,
          options: doc.options,
          correctAnswer: doc.correctAnswer,
        }),
      );
      expect(doc.duplicateHashV2).toBe(
        scriptHashV2({
          question: doc.question,
          subjectId: doc.subjectId,
          options: doc.options,
          correctAnswer: doc.correctAnswer,
        }),
      );
      expect(doc.stemHash).toBe(libStemHash(doc.question));
      expect(doc.stemHash).toBe(scriptStemHash(doc.question));
    }
    expect(v2Hashes.size).toBe(35);
    expect(stemHashes.size).toBe(34);
  });
  it('(mg6) 0 exact duplicates; the only stem collision is 026/027, recorded KEEP', () => {
    const { report } = loadAll();
    const dup = report.duplicateReport as {
      exactDuplicates: number;
      stemCollisions: Array<{ questionIds: string[] }>;
      decisions: Array<{ questionIds: string[]; decision: string }>;
    };
    expect(dup.exactDuplicates).toBe(0);
    expect(dup.stemCollisions).toHaveLength(1);
    expect(dup.stemCollisions[0].questionIds).toEqual(['bcs-eng-026', 'bcs-eng-027']);
    expect(dup.decisions[0].decision).toBe('keep');
  });
  it('(mg7) the bundle partition is still exact and the keys still match', () => {
    const { backup, problems } = loadAll();
    expect(problems).toEqual([]);
    const bundles = backup.data.jobQuestionBundles as BackupDoc[];
    const partitioned = bundles.flatMap((b) => b.sourceQuestionIds as string[]);
    expect(partitioned).toHaveLength(35);
    expect(new Set(partitioned).size).toBe(35);
    const keys = backup.data.jobQuestionKeys as BackupDoc[];
    expect(keys).toHaveLength(13);
    for (const key of keys) {
      const bundle = bundles.find((b) => b.id === key.id)!;
      expect((key.answers as unknown[]).length).toBe(bundle.questionCount);
    }
  });
  it('(mg8) the passage text agrees in all three copies (script, lib, backup inline)', () => {
    const { backup } = loadAll();
    expect(READING_PASSAGE_TEXT).toBe(PUBLIC_BCS_READING_PASSAGE.text);
    const q33 = (backup.data.jobQuestions as BackupDoc[]).find((q) => q.id === 'bcs-eng-033')!;
    expect(q33.questionText as string).toContain(READING_PASSAGE_TEXT);
    expect(libExtractStem(q33.questionText as string, PUBLIC_BCS_READING_PASSAGE.text)).toBe(
      'How does Rahim go to school?',
    );
    expect(scriptExtractStem(q33.questionText as string, READING_PASSAGE_TEXT)).toBe(
      'How does Rahim go to school?',
    );
  });
  it('(mg9) the reading bundle rebuilds 1 → 2 with stem-only questions + passageId; the key is unchanged', () => {
    const { plan, backup } = loadAll();
    const rebuild = plan.readingBundleRebuild as {
      bundleId: string;
      bundleVersionFrom: number;
      bundleVersionTo: number;
      keyUnchanged: boolean;
      questions: Array<{ questionId: string; questionText: string; passageId: string | null }>;
    };
    expect(rebuild.bundleId).toBe('topic__bcs__english__comprehension__reading');
    expect(rebuild.bundleVersionFrom).toBe(1);
    expect(rebuild.bundleVersionTo).toBe(2);
    expect(rebuild.keyUnchanged).toBe(true);
    expect(rebuild.questions.map((q) => q.questionId)).toEqual(['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035']);
    for (const q of rebuild.questions) {
      expect(q.passageId).toBe(READING_PASSAGE_ID);
      expect(q.questionText).not.toContain('Rahim is a school teacher');
    }
    const backupKey = (backup.data.jobQuestionKeys as BackupDoc[]).find(
      (k) => k.id === 'topic__bcs__english__comprehension__reading',
    )!;
    expect((backupKey.answers as Array<{ correctLetter: string }>).map((a) => a.correctLetter)).toEqual(['D', 'A', 'B']);
  });
  it('(mg10) the 15-Q mock set and the 20 spares are all in the BCS scored pools (§12.4)', () => {
    const { plan } = loadAll();
    const pools = plan.pools as Array<{ poolKind: string; questionIds: string[] }>;
    const scoredIds = new Set(
      pools.filter((p) => p.poolKind === 'scored').flatMap((p) => p.questionIds),
    );
    expect(scoredIds.size).toBe(35);
    for (const id of [...MOCK_SET_15, ...SPARE_20]) {
      expect(scoredIds.has(id)).toBe(true);
    }
    expect(MOCK_SET_15).toHaveLength(15);
    expect(SPARE_20).toHaveLength(20);
  });
  it('(mg11) script pools == lib pools on the migrated 35', () => {
    const { plan } = loadAll();
    const docs = migratedDocs(plan);
    const libPools = buildExamQuestionPools(docs, jobExamSelectionRulesFor('bcs')!, {
      generatedAt: '2026-11-24T00:00:00.000Z',
    });
    const scriptPools = plan.pools as Array<Record<string, unknown>>;
    expect(scriptPools).toEqual(libPools);
  });
  it('(mg12) script stats/coverage == lib stats/coverage on the migrated 35', () => {
    const { plan, report } = loadAll();
    const docs = migratedDocs(plan);
    const libStats = computeBankStats(docs, { calculatedAt: '2026-11-24T00:00:00.000Z' });
    expect(report.stats).toEqual(libStats);
    const libCoverage = computeCoverage(
      docs,
      jobExamSelectionRulesFor('bcs')!,
      { english: JOB_ENGLISH_TOPICS.map((t) => t.topicId) },
      { lastCalculated: '2026-11-24T00:00:00.000Z' },
    );
    expect((report.coverage as Record<string, unknown>).bcs).toEqual(libCoverage);
  });
  it('(mg13) re-running over an already-migrated doc is refused (idempotency)', () => {
    const { backup, seed } = loadAll();
    const mutated = JSON.parse(JSON.stringify(backup)) as typeof backup;
    (mutated.data.jobQuestions as BackupDoc[])[0].schemaVersion = 2;
    const { problems } = buildMigrationPlan(mutated, seed, { generatedAt: '2026-11-24T00:00:00.000Z' });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join(' ')).toContain('already carries schemaVersion 2');
  });
  it('(mg14) a single-question migration matches the lib field map', () => {
    const { backup } = loadAll();
    const legacy = (backup.data.jobQuestions as BackupDoc[]).find((q) => q.id === 'bcs-eng-026')!;
    const { doc, problems } = migrateLegacyQuestionToV2(legacy as unknown as Record<string, unknown>);
    expect(problems).toEqual([]);
    expect(doc!.question).toBe('Choose the correctly spelled word.');
    expect(doc!.correctAnswer).toBe('A');
    expect(doc!.topicId).toBe('english__vocabulary__spelling');
  });
});

describe('seed cross-checks (team/central-bank-seed.json)', () => {
  it('(mg15) seed selection rules == lib rules for all 7 keys', () => {
    const { seed } = loadAll();
    const rules = seed.jobExamSelectionRules as Record<string, Record<string, unknown>>;
    expect(Object.keys(rules).sort()).toEqual([
      'bank', 'bank-assistant-director', 'bank-senior-officer', 'bcs',
      'grade_11_20', 'ntrca', 'primary-teacher',
    ]);
    for (const [key, rule] of Object.entries(rules)) {
      const lib = jobExamSelectionRulesFor(key)!;
      expect(rule.totalQuestions).toBe(lib.totalQuestions);
      expect(rule.durationMinutes).toBe(lib.durationMinutes);
      expect(rule.negativeMarking).toBe(lib.negativeMarking);
      expect(rule.verificationStatus).toBe(lib.verificationStatus);
      expect(rule.subjectWeights).toEqual(lib.subjectWeights);
      expect(rule.syllabusVersion).toBe(lib.syllabusVersion);
      expect(rule.scoringConfigVersion).toBe(lib.scoringConfigVersion);
    }
  });
  it('(mg16) seed stats/coverage == the dry-run computed values', () => {
    const { seed, report } = loadAll();
    expect(seed.jobQuestionBankStats).toEqual({
      global: report.stats,
      ...(report.statsByExam as Record<string, unknown>),
    });
    const seedCoverage = seed.jobBankCoverage as Record<string, Record<string, unknown>>;
    expect(Object.keys(seedCoverage)).toHaveLength(35);
    const coverage = report.coverage as Record<string, Array<Record<string, unknown>>>;
    for (const rows of Object.values(coverage)) {
      for (const row of rows) {
        expect(seedCoverage[`${row.examId}__${row.subjectId}`]).toEqual(row);
      }
    }
  });
  it('(mg17) seed topics == the verified English list (13 topics, live counts)', () => {
    const { seed, topics } = loadAll();
    const seedTopics = seed.jobTopics as Record<string, Record<string, unknown>>;
    expect(Object.keys(seedTopics)).toHaveLength(13);
    for (const t of JOB_ENGLISH_TOPICS) {
      const doc = Object.values(seedTopics).find((d) => d.canonicalTopicId === t.topicId)!;
      expect(doc.publishedQuestionCount).toBe(t.count);
    }
    expect(topics.jobTopics).toEqual(seedTopics);
    expect(Object.keys(seed.jobSubjects as Record<string, unknown>)).toHaveLength(23);
    expect(Object.keys(JOB_SUBJECTS)).toEqual(['bcs', 'bank', 'primary-teacher', 'ntrca']);
  });
  it('(mg18) historicalQuestions starts EMPTY by design (0 previous-year questions)', () => {
    const { seed } = loadAll();
    expect(seed.historicalQuestions).toEqual({});
  });
});
