/**
 * Eduvelto — Central Question Bank migration (v1 → v2, 24 Nov 2026).
 *
 * Migrates the 35 live BCS English questions + 13 bundles + 13 keys
 * into the central-bank schema (design-central-bank.md §5), and seeds
 * the new collections (jobSubjects 23, jobChapters 3, jobTopics 13
 * English, jobPassages 1, jobExamSelectionRules 7, examQuestionPools,
 * jobQuestionBankStats, jobBankCoverage; historicalQuestions stays
 * EMPTY by design — 0 previous-year questions exist).
 *
 * PREPARED, NOT RUN: this script is the migration plan + the tool
 * that will run it. NOTHING here writes to a live database:
 *   - default / --dry-run --backup <file>: builds the full plan
 *     from the BACKUP JSON file and writes the dry-run report to
 *     team/migrate-central-bank-v2-dryrun-YYYY-MM-DD.json. No
 *     Firestore contact at all — this is the mode the build runs.
 *   - --apply --emulator [host:port]: preflight → apply → read-back
 *     verify against a local Firestore EMULATOR only (loopback +
 *     probe, same fail-closed guards as the Step 5/6/7 importers).
 *     There is NO live code path: --live/--prod/--production/
 *     --firestore flags are refused outright, production
 *     credentials in the environment refuse the run, and the
 *     emulator is re-probed immediately before the first write.
 *   - --rollback <backup-file> --emulator [host:port]: restores the
 *     35 question docs from the backup (old field shape) + deletes
 *     the newly seeded collections + restores the reading bundle to
 *     version 1, then re-runs the Phase-0 checks.
 *
 * Migration principles (§5.1): additive first, renames second; NO
 * content change to the 35 questions' text, options or answers —
 * the ONLY content-adjacent change is the passage de-inlining
 * (§1.4/§5.3, default: de-inline): the 3 reading questions'
 * `question` becomes stem-only and `passageId` points at the shared
 * `jobPassages/bcs-eng-passage-01`. The reading bundle is rebuilt
 * with bundleVersion 1 → 2; attempts keep working because they bind
 * to bundleVersion (§5.6) and question/bundle doc IDs never change.
 * Schema migration does NOT bump `version` (no content change);
 * `schemaVersion: 2` records it. Idempotent: re-running detects
 * `schemaVersion: 2` and skips migrated docs; pool generation
 * replaces pool docs wholesale (they are derived, never hand-edited).
 *
 * Pure functions are exported for the unit tests (see
 * scripts/migrate-central-bank-v2.d.mts). The lib-side validator is
 * validateCentralBankQuestion (src/lib/jobCentralBank.ts); the
 * script's validateMigratedQuestion mirrors it, and the migration
 * test cross-checks every migrated doc against BOTH — a drift
 * between the two fails the test, not the migration.
 *
 * REST pattern follows scripts/load-library-content.mjs (Bearer
 * 'owner' against the emulator bypasses rules — the same mechanism
 * the library loader uses; the live OAuth path is NOT present here).
 * The auth header is built by concatenation ('Bearer ' + 'owner'):
 * a literal 'Bearer <token>' string must never be written into a
 * file (tooling redaction lesson, 22 Nov 2026).
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emulatorTargetProblem, probeEmulator } from './apply-job-seed.mjs';
import { liveFlagProblem, productionCredentialsProblem } from './apply-job-question-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const DEFAULT_BACKUP_PATH = resolve(__dirname, '../../backups/eduvelto-backup-20261124-014508.json');
const SEED_PATH = resolve(__dirname, '../team/central-bank-seed.json');

/** Bank config version (mirror of JOB_QUESTION_CONFIG_VERSION). */
export const MIGRATION_CONFIG_VERSION = '2026-11-22.1';
/** Schema version stamped on migrated docs. */
export const MIGRATION_SCHEMA_VERSION = 2;
/** Syllabus version for the verified 50th BCS pattern (§3.1). */
export const BCS_SYLLABUS_VERSION = '50th-bcs-2025-12-09';
/** The 3 reading questions sharing one passage. */
export const READING_QUESTION_IDS = ['bcs-eng-033', 'bcs-eng-034', 'bcs-eng-035'];
/** Shared passage doc ID. */
export const READING_PASSAGE_ID = 'bcs-eng-passage-01';
/** Passage text — verbatim from src/lib/publicBcsEnglish.ts
 * PUBLIC_BCS_READING_PASSAGE (and verbatim inside the backup's
 * inlined reading questions). The dry-run test asserts all three
 * copies agree. */
export const READING_PASSAGE_TEXT = 'Rahim is a school teacher in a small village. Every morning he walks two kilometres to reach his school. His students love him because he explains every lesson with simple examples. He believes that education can change the life of a poor child. In the evening, he teaches the village children for free.';
/** Owner UID — the English verifier (live verifiedBy on all 35). */
export const OWNER_VERIFIER_UID = 'nczNklmktsVrxg43UzcgdSm6v0j2';
/** The verified English topic list (canonical IDs) — the only
 * verified topic list in the system (§2.2). */
export const VERIFIED_ENGLISH_TOPICS = [
  'english__grammar__tense', 'english__grammar__voice', 'english__grammar__narration',
  'english__grammar__preposition', 'english__grammar__right-form-of-verbs',
  'english__grammar__conditionals', 'english__grammar__articles',
  'english__vocabulary__synonym', 'english__vocabulary__antonym',
  'english__vocabulary__spelling', 'english__vocabulary__idiom',
  'english__vocabulary__one-word-substitution', 'english__comprehension__reading',
];
/** Canonical subject map for the 23 exam-scoped subjects (§2.1). */
export const CANONICAL_SUBJECT_FOR_EXAM_SCOPED = {
  'bcs__bangla': 'bangla', 'bcs__english': 'english',
  'bcs__bangladesh-affairs': 'bangladesh-affairs',
  'bcs__international-affairs': 'international-affairs',
  'bcs__geography': 'geography', 'bcs__general-science': 'general-science',
  'bcs__computer-ict': 'ict', 'bcs__mathematical-reasoning': 'mathematical-reasoning',
  'bcs__mental-ability': 'mental-ability', 'bcs__ethics': 'ethics',
  'bank__bangla': 'bangla', 'bank__english': 'english', 'bank__math': 'math',
  'bank__general-knowledge': 'general-knowledge', 'bank__computer': 'ict',
  'primary-teacher__bangla': 'bangla', 'primary-teacher__english': 'english',
  'primary-teacher__math-science': 'math-science',
  'primary-teacher__general-knowledge': 'general-knowledge',
  'ntrca__bangla': 'bangla', 'ntrca__english': 'english', 'ntrca__math': 'math',
  'ntrca__general-knowledge': 'general-knowledge',
};
/** Exam keys the bank accepts in examMappings (§1.3). */
export const CENTRAL_BANK_EXAM_KEYS = [
  'bcs', 'bank', 'bank-senior-officer', 'bank-assistant-director',
  'primary-teacher', 'ntrca', 'grade_11_20',
];
/** Top-level fields a v2 doc carries that a v1 doc does not (the
 * rollback deletes exactly these from the 35). */
export const V2_ONLY_FIELDS = [
  'questionId', 'subtopicId', 'questionType', 'question', 'correctAnswer',
  'examMappings', 'syllabusMappings', 'verificationStatus', 'isActive',
  'origin', 'tags', 'passageId', 'duplicateHashV2', 'stemHash',
  'duplicateCandidates', 'duplicateReview', 'reviewContentPassed',
  'schemaVersion', 'legacyId',
];
/** Top-level fields a v1 doc carries that a v2 doc must not. */
export const V1_ONLY_FIELDS = [
  'examSlug', 'chapterId', 'bundleId', 'isPreviousYear', 'sourceUrl',
  'questionText', 'correctLetter',
];

/* ------------------------------------------------------------------ */
/* Hash v2 (§4.2) — JS mirror of src/lib/jobCentralBank.ts            */
/* ------------------------------------------------------------------ */

export function cyrb53Hex(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';
export function foldBanglaDigits(text) {
  return text.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

export function normalizeCentralBankText(text) {
  return foldBanglaDigits(text.normalize('NFKC'))
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLowerCase();
}

export function stemHashFor(stem) {
  return cyrb53Hex(normalizeCentralBankText(stem));
}

export function correctTextFor(question) {
  return question.options.find((o) => o.letter === question.correctAnswer)?.text ?? '';
}

export function duplicateHashV2For(args) {
  const sortedOptions = args.options
    .map((o) => normalizeCentralBankText(o.text))
    .sort();
  const correctText = correctTextFor(args);
  const input = `${normalizeCentralBankText(args.question)}|${args.subjectId}|${sortedOptions.join('|')}|${normalizeCentralBankText(correctText)}`;
  return cyrb53Hex(input);
}

/* ------------------------------------------------------------------ */
/* Passage de-inlining (§1.4)                                          */
/* ------------------------------------------------------------------ */

export function extractPassageStem(questionText, passageText) {
  const prefix = `Read the following passage and answer the question:\n\n"${passageText}"\n\n`;
  if (!questionText.startsWith(prefix)) return null;
  const stem = questionText.slice(prefix.length);
  return stem.length > 0 ? stem : null;
}

/* ------------------------------------------------------------------ */
/* Field map (§5.2) — one legacy doc → one v2 doc                     */
/* ------------------------------------------------------------------ */

/** Canonical topic ID: drop the exam prefix segment. */
export function canonicalTopicIdFor(examScopedTopicId) {
  const parts = String(examScopedTopicId).split('__');
  if (parts.length < 3 || parts.some((p) => p.length === 0)) return null;
  return parts.slice(1).join('__');
}

/**
 * Migrate one legacy (v1) question doc to the v2 schema. Returns
 * `{ doc, problems }` — problems is empty on success. The v1 doc
 * must be a BCS English Batch 1 doc (the only live questions); any
 * other examSlug/subject is a problem, never silently mapped.
 * No content change: text, options and answers are byte-identical
 * except the 3 reading questions, whose `question` becomes the
 * stem (de-inlined) with `passageId` set.
 */
export function migrateLegacyQuestionToV2(legacy, opts = {}) {
  const problems = [];
  const passageText = opts.passageText ?? READING_PASSAGE_TEXT;
  const id = legacy.id;
  if (typeof id !== 'string' || !/^bcs-eng-[0-9]{3}$/.test(id)) {
    problems.push(`migrate: unexpected legacy id '${String(id)}' (expected bcs-eng-NNN)`);
    return { doc: null, problems };
  }
  if (legacy.examSlug !== 'bcs') {
    problems.push(`migrate: ${id} has examSlug '${String(legacy.examSlug)}' (expected 'bcs')`);
    return { doc: null, problems };
  }
  const subjectId = CANONICAL_SUBJECT_FOR_EXAM_SCOPED[legacy.subjectId];
  if (!subjectId) {
    problems.push(`migrate: ${id} has unknown subjectId '${String(legacy.subjectId)}'`);
    return { doc: null, problems };
  }
  const topicId = canonicalTopicIdFor(legacy.topicId);
  if (!topicId) {
    problems.push(`migrate: ${id} has malformed topicId '${String(legacy.topicId)}'`);
    return { doc: null, problems };
  }
  const isReading = READING_QUESTION_IDS.includes(id);
  let question = legacy.questionText;
  let passageId = null;
  if (isReading) {
    const stem = extractPassageStem(legacy.questionText, passageText);
    if (stem === null) {
      problems.push(`migrate: ${id} is a reading question but its text does not match the de-inline shape — refusing to guess`);
      return { doc: null, problems };
    }
    question = stem;
    passageId = READING_PASSAGE_ID;
  }
  if (legacy.isPreviousYear !== false || legacy.examYear !== null) {
    problems.push(`migrate: ${id} looks like a previous-year question (isPreviousYear/examYear set) — the migration only handles original-practice Batch 1`);
    return { doc: null, problems };
  }
  const verificationStatus =
    legacy.status === 'published' && legacy.reviewStatus === 'Published' ? 'verified' : 'draft';
  const doc = {
    questionId: id,
    subjectId,
    topicId,
    subtopicId: null,
    difficulty: legacy.difficulty,
    questionType: 'mcq',
    question,
    options: legacy.options.map((o) => ({ letter: o.letter, text: o.text })),
    correctAnswer: legacy.correctLetter,
    explanation: legacy.explanation,
    whyWrong: legacy.whyWrong ?? null,
    examMappings: ['bcs'],
    syllabusMappings: {
      bcs: {
        subjectId: legacy.subjectId,
        chapterId: legacy.chapterId,
        topicId: legacy.topicId,
        syllabusVersion: BCS_SYLLABUS_VERSION,
        syllabusTopicId: topicId,
        verified: true,
      },
    },
    verificationStatus,
    isActive: true,
    origin: 'admin-practice',
    source: {
      type: 'original-practice',
      reference: 'owner-verified BCS English Batch 1, 22 Nov 2026',
      url: null,
    },
    examYear: null,
    tags: [subjectId, topicId, 'bcs', 'batch:bcs-english-batch1'],
    passageId,
    duplicateHash: legacy.duplicateHash,
    duplicateHashV2: duplicateHashV2For({
      question, subjectId, options: legacy.options, correctAnswer: legacy.correctLetter,
    }),
    stemHash: stemHashFor(question),
    duplicateOf: legacy.duplicateOf ?? null,
    duplicateCandidates: null,
    duplicateReview: null,
    authorId: legacy.authorId ?? null,
    verifiedBy: legacy.verifiedBy ?? null,
    verifiedAt: legacy.verifiedAt ?? null,
    reviewerId: legacy.reviewerId ?? null,
    reviewContentPassed: false,
    version: legacy.version,
    configVersion: legacy.configVersion ?? MIGRATION_CONFIG_VERSION,
    schemaVersion: MIGRATION_SCHEMA_VERSION,
    status: legacy.status,
    reviewStatus: legacy.reviewStatus,
    createdBy: legacy.createdBy ?? null,
    createdAt: legacy.createdAt ?? null,
    updatedAt: legacy.updatedAt ?? null,
    legacyId: id,
    rejectionReason: legacy.rejectionReason ?? null,
  };
  return { doc, problems };
}

/* ------------------------------------------------------------------ */
/* validateMigratedQuestion — JS mirror of validateCentralBankQuestion */
/* ------------------------------------------------------------------ */

function isNonEmptyString(v, max) {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

/** Validate a migrated v2 doc (same rules as the lib validator;
 * the migration test cross-checks every doc against both). */
export function validateMigratedQuestion(doc) {
  const problems = [];
  const label = 'jobQuestions(v2)';
  if (typeof doc.questionId !== 'string' || !/^(bcs-eng-[0-9]{3}|q_[a-z-]+_[0-9]{4})$/.test(doc.questionId)) {
    problems.push(`${label}: questionId '${String(doc.questionId)}' must match bcs-eng-NNN or q_<subject>_<seq4>`);
  }
  for (const legacy of V1_ONLY_FIELDS) {
    if (legacy in doc) problems.push(`${label}: legacy field '${legacy}' must not be present on a v2 doc`);
  }
  const canonicalSubjects = Object.values(CANONICAL_SUBJECT_FOR_EXAM_SCOPED);
  if (!canonicalSubjects.includes(doc.subjectId)) {
    problems.push(`${label}: subjectId '${String(doc.subjectId)}' is not a canonical bank subject`);
  }
  if (typeof doc.topicId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/.test(doc.topicId)) {
    problems.push(`${label}: topicId must look like {subject}__{chapter}__{topic}`);
  } else if (typeof doc.subjectId === 'string' && !doc.topicId.startsWith(`${doc.subjectId}__`)) {
    problems.push(`${label}: topicId '${doc.topicId}' must start with subjectId '${doc.subjectId}__'`);
  }
  if (doc.subtopicId !== null && !isNonEmptyString(doc.subtopicId, 200)) {
    problems.push(`${label}: subtopicId must be a non-empty string ≤200 or null`);
  }
  if (!['easy', 'medium', 'hard'].includes(doc.difficulty)) {
    problems.push(`${label}: difficulty must be easy/medium/hard`);
  }
  if (doc.questionType !== 'mcq') problems.push(`${label}: questionType must be 'mcq'`);
  if (!isNonEmptyString(doc.question, 2000)) {
    problems.push(`${label}: question must be a non-empty string ≤2000 chars`);
  }
  if (!Array.isArray(doc.options) || doc.options.length !== 4) {
    problems.push(`${label}: options must be exactly 4`);
  } else {
    const letters = ['A', 'B', 'C', 'D'];
    const seen = new Set();
    doc.options.forEach((o, i) => {
      if (!o || typeof o !== 'object' || o.letter !== letters[i]) {
        problems.push(`${label}: options[${i}].letter must be '${letters[i]}'`);
      }
      if (!isNonEmptyString(o?.text, 1000)) {
        problems.push(`${label}: options[${i}].text must be a non-empty string ≤1000 chars`);
      } else {
        const norm = normalizeCentralBankText(o.text);
        if (seen.has(norm)) problems.push(`${label}: options[${i}].text duplicates another option`);
        seen.add(norm);
      }
    });
  }
  if (!['A', 'B', 'C', 'D'].includes(doc.correctAnswer)) {
    problems.push(`${label}: correctAnswer must be one of A/B/C/D`);
  }
  if (!isNonEmptyString(doc.explanation, 2000)) {
    problems.push(`${label}: explanation is required (≤2000 chars)`);
  }
  if (!Array.isArray(doc.examMappings)) {
    problems.push(`${label}: examMappings must be a list`);
  } else {
    for (const key of doc.examMappings) {
      if (!CENTRAL_BANK_EXAM_KEYS.includes(key)) {
        problems.push(`${label}: examMappings contains '${String(key)}', not an allowed exam key`);
      }
    }
    if (typeof doc.syllabusMappings !== 'object' || doc.syllabusMappings === null || Array.isArray(doc.syllabusMappings)) {
      problems.push(`${label}: syllabusMappings must be a map`);
    } else {
      const mapKeys = Object.keys(doc.syllabusMappings).sort();
      const mappingKeys = [...new Set(doc.examMappings)].sort();
      if (mapKeys.join(',') !== mappingKeys.join(',')) {
        problems.push(`${label}: examMappings keys (${mappingKeys.join(',')}) != syllabusMappings keys (${mapKeys.join(',')})`);
      }
      for (const [examKey, e] of Object.entries(doc.syllabusMappings)) {
        if (!e || typeof e !== 'object' || Array.isArray(e)) {
          problems.push(`${label}: syllabusMappings.${examKey} must be a map`);
          continue;
        }
        if (!isNonEmptyString(e.subjectId, 200)) problems.push(`${label}: syllabusMappings.${examKey}.subjectId is required`);
        if (!isNonEmptyString(e.topicId, 200)) problems.push(`${label}: syllabusMappings.${examKey}.topicId is required`);
        if (!isNonEmptyString(e.syllabusVersion, 200)) problems.push(`${label}: syllabusMappings.${examKey}.syllabusVersion is required`);
        if (e.syllabusTopicId !== doc.topicId) problems.push(`${label}: syllabusMappings.${examKey}.syllabusTopicId must equal the canonical topicId`);
        if (typeof e.verified !== 'boolean') problems.push(`${label}: syllabusMappings.${examKey}.verified must be a boolean`);
      }
    }
  }
  const derived =
    doc.status === 'published' && doc.reviewStatus === 'Published'
      ? 'verified'
      : doc.reviewStatus === 'Under Review' && doc.reviewContentPassed === true
        ? 'reviewed'
        : 'draft';
  if (!['draft', 'reviewed', 'verified'].includes(doc.verificationStatus)) {
    problems.push(`${label}: verificationStatus must be draft/reviewed/verified`);
  } else if (doc.verificationStatus !== derived) {
    problems.push(`${label}: verificationStatus '${String(doc.verificationStatus)}' != derived '${derived}'`);
  }
  if (typeof doc.isActive !== 'boolean') problems.push(`${label}: isActive must be a boolean`);
  if (doc.origin !== 'admin-practice') {
    problems.push(`${label}: migrated Batch 1 origin must be 'admin-practice', got '${String(doc.origin)}'`);
  }
  if (!doc.source || typeof doc.source !== 'object' || doc.source.type !== 'original-practice'
    || !isNonEmptyString(doc.source.reference, 500)) {
    problems.push(`${label}: source must be {type: 'original-practice', reference, url?}`);
  }
  if (doc.examYear !== null && doc.examYear !== undefined) {
    problems.push(`${label}: examYear must be null unless origin is verified-previous`);
  }
  if (!Array.isArray(doc.tags)) {
    problems.push(`${label}: tags must be a list`);
  } else {
    for (const tag of doc.tags) {
      const ok =
        canonicalSubjects.includes(tag) ||
        tag === doc.topicId ||
        CENTRAL_BANK_EXAM_KEYS.includes(tag) ||
        /^batch:[a-z0-9-]+$/.test(tag) ||
        ['general-practice', 'previous-year', 'disputed', 'outdated'].includes(tag);
      if (!ok) problems.push(`${label}: tag '${tag}' is not in the controlled vocabulary`);
    }
  }
  if (!isNonEmptyString(doc.duplicateHash, 200)) {
    problems.push(`${label}: duplicateHash is required (≤200 chars)`);
  }
  if (typeof doc.duplicateHashV2 !== 'string' || !/^[0-9a-f]{16}$/.test(doc.duplicateHashV2)) {
    problems.push(`${label}: duplicateHashV2 must be 16 hex chars`);
  }
  if (doc.stemHash !== null && doc.stemHash !== undefined
    && (typeof doc.stemHash !== 'string' || !/^[0-9a-f]{16}$/.test(doc.stemHash))) {
    problems.push(`${label}: stemHash must be 16 hex chars or null`);
  }
  if (doc.verificationStatus === 'verified') {
    if (typeof doc.verifiedBy !== 'string' || doc.verifiedBy.length === 0) {
      problems.push(`${label}: verified questions need verifiedBy`);
    }
    if (doc.verifiedAt === null || doc.verifiedAt === undefined) {
      problems.push(`${label}: verified questions need verifiedAt`);
    }
  }
  if (!Number.isInteger(doc.version) || doc.version < 1) {
    problems.push(`${label}: version must be an integer ≥1`);
  }
  if (!isNonEmptyString(doc.configVersion, 100)) {
    problems.push(`${label}: configVersion is required (≤100 chars)`);
  }
  if (doc.status !== 'draft' && doc.status !== 'published') {
    problems.push(`${label}: status must be draft/published`);
  }
  if ((doc.status === 'published') !== (doc.reviewStatus === 'Published')) {
    problems.push(`${label}: status published ⟺ reviewStatus Published`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Pools / stats / coverage — JS mirrors of the lib (cross-checked    */
/* by the migration test against src/lib/jobBankSelection.ts +        */
/* src/lib/jobBankStats.ts on the migrated 35)                        */
/* ------------------------------------------------------------------ */

const POOL_CHUNK_SIZE = 200;

function isPoolEligibleJs(q, examKey, poolKind) {
  if (!q.isActive) return false;
  if (!q.examMappings.includes(examKey)) return false;
  if (q.tags.includes('disputed')) return false;
  if (poolKind === 'scored') {
    if (q.verificationStatus !== 'verified') return false;
    if (q.syllabusMappings[examKey]?.verified !== true) return false;
    return true;
  }
  return q.verificationStatus === 'verified' || q.verificationStatus === 'reviewed';
}

export function buildExamQuestionPoolsJs(questions, examId, scoringConfigVersion, generatedAt) {
  const pools = [];
  const groups = new Map();
  for (const q of questions) {
    for (const kind of ['scored', 'practice']) {
      if (!isPoolEligibleJs(q, examId, kind)) continue;
      const key = `${q.subjectId}|${q.topicId}|${q.difficulty}|${kind}`;
      if (!groups.has(key)) {
        groups.set(key, { subjectId: q.subjectId, topicId: q.topicId, difficulty: q.difficulty, kind, ids: [] });
      }
      groups.get(key).ids.push(q.questionId);
    }
  }
  const sorted = [...groups.values()].sort((a, b) =>
    `${a.subjectId}|${a.topicId}|${a.difficulty}|${a.kind}`.localeCompare(
      `${b.subjectId}|${b.topicId}|${b.difficulty}|${b.kind}`,
    ),
  );
  for (const group of sorted) {
    const ids = [...group.ids].sort();
    const chunkCount = Math.max(1, Math.ceil(ids.length / POOL_CHUNK_SIZE));
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunk = ids.slice(chunkIndex * POOL_CHUNK_SIZE, (chunkIndex + 1) * POOL_CHUNK_SIZE);
      pools.push({
        poolId: `pool__${examId}__${group.kind}__${group.subjectId}__${group.topicId}__${group.difficulty}__${chunkIndex}`,
        examId,
        subjectId: group.subjectId,
        topicId: group.topicId,
        difficulty: group.difficulty,
        poolKind: group.kind,
        questionIds: chunk,
        chunkIndex,
        chunkCount,
        generatedAt,
        bankVersion: '2026-11-24.1',
        selectionRulesVersion: scoringConfigVersion,
        eligibleCount: ids.length,
      });
    }
  }
  return pools;
}

export function computeBankStatsJs(questions, opts = {}) {
  const stats = {
    total: questions.length, verified: 0, reviewed: 0, draft: 0,
    active: 0, inactive: 0, perExam: {}, perSubject: {}, perTopic: {},
    difficulty: { easy: 0, medium: 0, hard: 0 }, difficultyBySubject: {},
    multiExamCount: 0, multiExamShare: 0, disputedCount: 0, outdatedCount: 0,
    aiGeneratedCount: 0, aiGeneratedVerifiedCount: 0,
    previousYearCount: 0, previousYearWithProofCount: 0,
    calculatedAt: opts.calculatedAt ?? new Date().toISOString(),
    bankVersion: opts.bankVersion ?? '2026-11-24.1',
  };
  for (const q of questions) {
    if (q.verificationStatus === 'verified') stats.verified += 1;
    else if (q.verificationStatus === 'reviewed') stats.reviewed += 1;
    else stats.draft += 1;
    if (q.isActive) stats.active += 1; else stats.inactive += 1;
    for (const exam of q.examMappings) {
      const row = stats.perExam[exam] ?? { verified: 0, reviewed: 0, draft: 0 };
      if (q.verificationStatus === 'verified') row.verified += 1;
      else if (q.verificationStatus === 'reviewed') row.reviewed += 1;
      else row.draft += 1;
      stats.perExam[exam] = row;
    }
    const subj = stats.perSubject[q.subjectId] ?? { total: 0, verified: 0 };
    subj.total += 1;
    if (q.verificationStatus === 'verified') subj.verified += 1;
    stats.perSubject[q.subjectId] = subj;
    const topic = stats.perTopic[q.topicId] ?? { total: 0, verified: 0 };
    topic.total += 1;
    if (q.verificationStatus === 'verified') topic.verified += 1;
    stats.perTopic[q.topicId] = topic;
    stats.difficulty[q.difficulty] += 1;
    const diffSubj = stats.difficultyBySubject[q.subjectId] ?? { easy: 0, medium: 0, hard: 0 };
    diffSubj[q.difficulty] += 1;
    stats.difficultyBySubject[q.subjectId] = diffSubj;
    if (q.examMappings.length >= 2) stats.multiExamCount += 1;
    if (q.tags.includes('disputed')) stats.disputedCount += 1;
    if (!q.isActive) stats.outdatedCount += 1;
    if (q.origin === 'ai-generated-practice') {
      stats.aiGeneratedCount += 1;
      if (q.verificationStatus === 'verified') stats.aiGeneratedVerifiedCount += 1;
    }
    if (q.origin === 'verified-previous') {
      stats.previousYearCount += 1;
      if (q.source.url) stats.previousYearWithProofCount += 1;
    }
  }
  stats.multiExamShare = stats.total > 0 ? Math.round((stats.multiExamCount / stats.total) * 1000) / 10 : 0;
  return stats;
}

export function computeCoverageJs(questions, rules, verifiedTopics, opts = {}) {
  const lastCalculated = opts.lastCalculated ?? new Date().toISOString();
  return rules.subjectWeights.map((w) => {
    const inScope = questions.filter(
      (q) => q.subjectId === w.subjectId && q.examMappings.includes(rules.examId),
    );
    const verified = inScope.filter((q) => q.verificationStatus === 'verified');
    const reviewed = inScope.filter((q) => q.verificationStatus === 'reviewed');
    const draft = inScope.filter((q) => q.verificationStatus === 'draft');
    const topics = verifiedTopics[w.subjectId];
    const hasVerifiedTopicList = Array.isArray(topics);
    const perTopicVerified = new Map();
    for (const q of verified) {
      perTopicVerified.set(q.topicId, (perTopicVerified.get(q.topicId) ?? 0) + 1);
    }
    const missingTopics = [];
    const thinTopics = [];
    let coveragePct = null;
    if (hasVerifiedTopicList) {
      let covered = 0;
      for (const topicId of topics) {
        const n = perTopicVerified.get(topicId) ?? 0;
        if (n === 0) missingTopics.push(topicId);
        else {
          covered += 1;
          if (n <= 2) thinTopics.push(topicId);
        }
      }
      coveragePct = topics.length > 0 ? Math.round((covered / topics.length) * 1000) / 10 : null;
    }
    return {
      examId: rules.examId, subjectId: w.subjectId, target: w.questions,
      verified: verified.length, reviewed: reviewed.length, draft: draft.length,
      coveragePct, missingTopics, thinTopics, hasVerifiedTopicList, lastCalculated,
    };
  });
}

/* ------------------------------------------------------------------ */
/* buildMigrationPlan — Phase 0 + Phase 1 (pure, backup-driven)        */
/* ------------------------------------------------------------------ */

/**
 * Build the full migration plan from a parsed backup + the seed.
 * Returns `{ plan, report, problems }`. `problems` non-empty means
 * the migration must NOT run (preflight failure). The plan is pure
 * data — no Firestore contact.
 */
export function buildMigrationPlan(backup, seed, opts = {}) {
  const problems = [];
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const data = backup.data ?? {};
  const legacyQuestions = data.jobQuestions ?? [];
  const bundles = data.jobQuestionBundles ?? [];
  const keys = data.jobQuestionKeys ?? [];

  // Phase 0 — counts + IDs.
  if (!Array.isArray(legacyQuestions) || legacyQuestions.length !== 35) {
    problems.push(`preflight: jobQuestions count is ${Array.isArray(legacyQuestions) ? legacyQuestions.length : 'not-a-list'} (expected 35)`);
  }
  const expectedIds = Array.from({ length: 35 }, (_, i) => `bcs-eng-${String(i + 1).padStart(3, '0')}`);
  const legacyById = new Map(legacyQuestions.map((q) => [q.id, q]));
  for (const id of expectedIds) {
    if (!legacyById.has(id)) problems.push(`preflight: backup is missing question '${id}'`);
  }
  if (bundles.length !== 13) problems.push(`preflight: jobQuestionBundles count is ${bundles.length} (expected 13)`);
  if (keys.length !== 13) problems.push(`preflight: jobQuestionKeys count is ${keys.length} (expected 13)`);

  // Phase 0 — no attempt/session/receipt history to rewrite (§5.6).
  const historyCollections = Object.keys(data).filter((c) => /attempt|session|receipt/i.test(c));
  for (const c of historyCollections) {
    const docs = data[c];
    if (Array.isArray(docs) && docs.length > 0) {
      problems.push(`preflight: collection '${c}' has ${docs.length} docs referencing attempts/sessions — the migration plan does not cover rewriting them; abort and report to the coordinator`);
    }
  }

  // Phase 0 — bundle partition + key match (§4.5 re-check).
  const bundleById = new Map(bundles.map((b) => [b.id, b]));
  const keyById = new Map(keys.map((k) => [k.id, k]));
  const partitioned = bundles.flatMap((b) => b.sourceQuestionIds ?? []);
  const uniquePartitioned = new Set(partitioned);
  if (partitioned.length !== 35 || uniquePartitioned.size !== 35) {
    problems.push(`preflight: bundle partition is not exact (embedded ${partitioned.length}, unique ${uniquePartitioned.size}, expected 35)`);
  }
  for (const id of uniquePartitioned) {
    if (!legacyById.has(id)) problems.push(`preflight: bundle embeds unknown question '${id}'`);
  }
  for (const b of bundles) {
    const key = keyById.get(b.id);
    if (!key) {
      problems.push(`preflight: bundle '${b.id}' has no key doc`);
      continue;
    }
    const answers = key.answers ?? [];
    if (answers.length !== (b.questionCount ?? b.questions?.length ?? -1)) {
      problems.push(`preflight: key '${b.id}' answers (${answers.length}) != bundle questionCount`);
    }
    for (const a of answers) {
      const q = legacyById.get(a.questionId);
      if (!q) {
        problems.push(`preflight: key '${b.id}' answers unknown question '${a.questionId}'`);
        continue;
      }
      if (a.correctLetter !== q.correctLetter) {
        problems.push(`preflight: key '${b.id}' correctLetter mismatch for '${a.questionId}'`);
      }
      const correctText = q.options.find((o) => o.letter === q.correctLetter)?.text ?? '';
      if (a.correctText !== correctText) {
        problems.push(`preflight: key '${b.id}' correctText mismatch for '${a.questionId}'`);
      }
    }
    for (const bq of b.questions ?? []) {
      const q = legacyById.get(bq.questionId);
      if (q && (bq.questionText !== q.questionText
        || JSON.stringify(bq.options) !== JSON.stringify(q.options)
        || bq.topicId !== q.topicId)) {
        problems.push(`preflight: bundle '${b.id}' drifts from the bank on '${bq.questionId}'`);
      }
    }
  }

  // Phase 1 — migrate + validate every question.
  const migrated = [];
  const perQuestionDiff = [];
  for (const legacy of legacyQuestions) {
    if (legacy.schemaVersion === MIGRATION_SCHEMA_VERSION) {
      problems.push(`preflight: question '${legacy.id}' already carries schemaVersion 2 — re-running the migration over an applied backup is refused; use --rollback first`);
      continue;
    }
    const { doc, problems: mp } = migrateLegacyQuestionToV2(legacy);
    if (mp.length > 0) {
      problems.push(...mp);
      continue;
    }
    const vp = validateMigratedQuestion(doc);
    if (vp.length > 0) {
      problems.push(...vp.map((p) => `migrate ${legacy.id}: ${p}`));
      continue;
    }
    migrated.push(doc);
    perQuestionDiff.push({
      id: legacy.id,
      added: V2_ONLY_FIELDS.filter((f) => f in doc),
      removed: V1_ONLY_FIELDS.filter((f) => f in legacy),
      questionChanged: READING_QUESTION_IDS.includes(legacy.id),
      passageId: doc.passageId,
      duplicateHashV2: doc.duplicateHashV2,
      stemHash: doc.stemHash,
    });
  }

  // Phase 0 — duplicate re-check (§4.5): 0 exact; 1 stem pair (keep).
  const hashGroups = new Map();
  const stemGroups = new Map();
  for (const doc of migrated) {
    hashGroups.set(doc.duplicateHashV2, [...(hashGroups.get(doc.duplicateHashV2) ?? []), doc.questionId]);
    stemGroups.set(doc.stemHash, [...(stemGroups.get(doc.stemHash) ?? []), doc.questionId]);
  }
  const exactDuplicates = [...hashGroups.entries()].filter(([, ids]) => ids.length > 1);
  if (exactDuplicates.length > 0) {
    problems.push(`preflight: ${exactDuplicates.length} exact duplicate group(s) by duplicateHashV2 — abort`);
  }
  const stemCollisions = [...stemGroups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([hash, ids]) => ({ stemHash: hash, questionIds: ids }));
  const duplicateReport = {
    exactDuplicates: 0,
    stemCollisions,
    decisions: stemCollisions.map((c) => ({
      questionIds: c.questionIds,
      class: 'near-stem',
      decision: 'keep',
      reason: 'Same stem, different target word/options — the stem collision is harmless here; naming the target word in the stem would risk giving the answer away (fixes.md O1, agreed).',
    })),
  };

  // Selection rules — validate sums (§3.3).
  const selectionRules = seed.jobExamSelectionRules ?? {};
  for (const [examKey, rule] of Object.entries(selectionRules)) {
    if (rule.totalQuestions !== null) {
      const sum = (rule.subjectWeights ?? []).reduce((a, w) => a + w.questions, 0);
      if (sum !== rule.totalQuestions) {
        problems.push(`preflight: selection rule '${examKey}' weights sum (${sum}) != totalQuestions (${rule.totalQuestions})`);
      }
    }
  }

  // Pools (BCS only — the only exam with questions), stats, coverage.
  const bcsRule = selectionRules.bcs;
  const pools = bcsRule
    ? buildExamQuestionPoolsJs(migrated, 'bcs', bcsRule.scoringConfigVersion, generatedAt)
    : [];
  const stats = computeBankStatsJs(migrated, { calculatedAt: generatedAt });
  // Per-exam stats docs (§6.1: 'global' + one doc per exam key).
  const statsByExam = {};
  for (const [examKey, rule] of Object.entries(selectionRules)) {
    if (rule.totalQuestions === null) continue;
    statsByExam[examKey] = computeBankStatsJs(
      migrated.filter((q) => q.examMappings.includes(examKey)),
      { calculatedAt: generatedAt },
    );
  }
  const verifiedTopics = { english: VERIFIED_ENGLISH_TOPICS };
  const coverage = {};
  for (const [examKey, rule] of Object.entries(selectionRules)) {
    if (rule.totalQuestions === null) continue;
    coverage[examKey] = computeCoverageJs(migrated, rule, verifiedTopics, { lastCalculated: generatedAt });
  }

  // Reading bundle rebuild (§5.3, default: de-inline).
  const readingBundle = bundleById.get('topic__bcs__english__comprehension__reading');
  let readingBundleRebuild = null;
  if (readingBundle) {
    const migratedById = new Map(migrated.map((d) => [d.questionId, d]));
    readingBundleRebuild = {
      bundleId: readingBundle.id,
      bundleVersionFrom: readingBundle.bundleVersion ?? 1,
      bundleVersionTo: (readingBundle.bundleVersion ?? 1) + 1,
      keyUnchanged: true,
      questions: (readingBundle.sourceQuestionIds ?? []).map((qid, i) => {
        const m = migratedById.get(qid);
        return {
          n: i + 1,
          questionId: qid,
          topicId: m?.topicId ?? null,
          subjectId: m?.subjectId ?? null,
          questionText: m?.question ?? null,
          options: m?.options ?? null,
          difficulty: m?.difficulty ?? null,
          passageId: m?.passageId ?? null,
        };
      }),
    };
  } else {
    problems.push('preflight: reading bundle topic__bcs__english__comprehension__reading is missing');
  }

  const plan = {
    questions: migrated.map((doc) => ({ id: doc.questionId, doc })),
    passages: seed.jobPassages ?? {},
    subjects: seed.jobSubjects ?? {},
    chapters: seed.jobChapters ?? {},
    topics: seed.jobTopics ?? {},
    selectionRules,
    pools,
    stats,
    statsByExam,
    coverage,
    readingBundleRebuild,
  };
  const report = {
    generatedAt,
    backupFile: opts.backupFile ?? null,
    counts: {
      questions: migrated.length,
      bundles: bundles.length,
      keys: keys.length,
      subjects: Object.keys(plan.subjects).length,
      chapters: Object.keys(plan.chapters).length,
      topics: Object.keys(plan.topics).length,
      passages: Object.keys(plan.passages).length,
      selectionRules: Object.keys(selectionRules).length,
      pools: pools.length,
      poolIdsByExam: { bcs: pools.length },
      coverageRows: Object.values(coverage).reduce((a, rows) => a + rows.length, 0),
      statsDocs: 1 + Object.keys(statsByExam).length,
    },
    perQuestionDiff,
    duplicateReport,
    stats,
    statsByExam,
    coverage,
    readingBundleRebuild,
    problems,
  };
  return { plan, report, problems };
}

/* ------------------------------------------------------------------ */
/* REST (emulator only — same pattern as apply-job-seed.mjs)           */
/* ------------------------------------------------------------------ */

function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Number.isInteger(v)) return { integerValue: String(v) };
  if (typeof v === 'number') return { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  const fields = {};
  for (const [k, val] of Object.entries(v)) fields[k] = enc(val);
  return { mapValue: { fields } };
}

function dec(f) {
  if (!f) return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return parseInt(f.integerValue, 10);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('nullValue' in f) return null;
  if ('timestampValue' in f) return f.timestampValue;
  if ('arrayValue' in f) return (f.arrayValue.values ?? []).map(dec);
  if ('mapValue' in f) {
    const out = {};
    for (const [k, v] of Object.entries(f.mapValue.fields ?? {})) out[k] = dec(v);
    return out;
  }
  return undefined;
}

/** Backup timestamp ({__type:'timestamp',millis} or ISO string) → Date. */
export function backupTimestampToDate(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v);
  if (typeof v === 'object' && v.__type === 'timestamp' && Number.isInteger(v.millis)) {
    return new Date(v.millis);
  }
  return null;
}

/** Convert backup-shaped values (timestamp objects) to Dates, recursively. */
export function toFirestoreFields(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v !== null && typeof v === 'object' && v.__type === 'timestamp') {
      out[k] = backupTimestampToDate(v);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item !== null && typeof item === 'object' ? toFirestoreFields(item) : item,
      );
    } else if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
      out[k] = toFirestoreFields(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function fsFetch(rest, path, { method = 'GET', body = null } = {}) {
  const res = await fetch(`${rest}${path}`, {
    method,
    headers: { Authorization: 'Bearer ' + 'owner', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function getDoc(rest, collection, id) {
  const res = await fsFetch(rest, `/${collection}/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const out = {};
  for (const [k, v] of Object.entries(data.fields ?? {})) out[k] = dec(v);
  return out;
}

async function listCollection(rest, collection, pageSize = 400) {
  const docs = [];
  let pageToken = null;
  for (;;) {
    const qs = `?pageSize=${pageSize}` + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
    const res = await fsFetch(rest, `/${collection}${qs}`);
    if (res.status === 404) return docs;
    if (!res.ok) throw new Error(`GET ${collection} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    for (const d of data.documents ?? []) {
      const id = d.name.split('/').pop();
      const out = { id };
      for (const [k, v] of Object.entries(d.fields ?? {})) out[k] = dec(v);
      docs.push(out);
    }
    pageToken = data.nextPageToken ?? null;
    if (!pageToken) break;
  }
  return docs;
}

async function createDoc(rest, collection, id, fields) {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, enc(v)])) };
  const res = await fsFetch(rest, `/${collection}?documentId=${encodeURIComponent(id)}`, { method: 'POST', body });
  if (!res.ok) throw new Error(`POST ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function patchDoc(rest, collection, id, fields) {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, enc(v)])) };
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fsFetch(rest, `/${collection}/${id}?${mask}`, { method: 'PATCH', body });
  if (!res.ok) throw new Error(`PATCH ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/** Delete top-level fields: PATCH with an empty body and a mask
 * listing the fields (Firestore deletes masked fields absent from
 * the body). */
async function patchDeleteFields(rest, collection, id, fieldNames) {
  if (fieldNames.length === 0) return;
  const mask = fieldNames.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fsFetch(rest, `/${collection}/${id}?${mask}`, { method: 'PATCH', body: { fields: {} } });
  if (!res.ok) throw new Error(`PATCH-delete ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function deleteDoc(rest, collection, id) {
  const res = await fsFetch(rest, `/${collection}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function usage() {
  return [
    'Usage:',
    '  node scripts/migrate-central-bank-v2.mjs --dry-run [--backup <path>] [--report <path>]',
    '      Build the plan from the BACKUP JSON file and write the dry-run report.',
    '      No Firestore contact at all (default mode).',
    '  node scripts/migrate-central-bank-v2.mjs --apply --emulator [host:port] [--backup <path>] [--audit <path>]',
    '      Preflight → apply → read-back verify against a local Firestore EMULATOR only.',
    '      The --backup file must be dated TODAY (fresh pre-migration snapshot).',
    '  node scripts/migrate-central-bank-v2.mjs --rollback <backup-file> --emulator [host:port] [--audit <path>]',
    '      Restore the 35 question docs from the backup + delete the newly seeded collections.',
    '',
    'EMULATOR ONLY for --apply/--rollback. There is no live target: --live/--prod/',
    '--production/--firestore flags are refused, and production credentials in the',
    'environment refuse the run.',
  ].join('\n');
}

function argValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx < 0 || idx + 1 >= args.length || args[idx + 1].startsWith('--')) return null;
  return args[idx + 1];
}

function dateOfFile(path) {
  try {
    return statSync(path).mtime.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

async function runDryRun(args) {
  const backupPath = argValue(args, '--backup') ?? DEFAULT_BACKUP_PATH;
  const reportPath = argValue(args, '--report')
    ?? resolve(__dirname, `../team/migrate-central-bank-v2-dryrun-${new Date().toISOString().slice(0, 10)}.json`);
  let backup;
  try {
    backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  } catch (e) {
    console.error(`Cannot read backup '${backupPath}': ${e.message}`);
    return 2;
  }
  let seed;
  try {
    seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  } catch (e) {
    console.error(`Cannot read seed '${SEED_PATH}': ${e.message}`);
    return 2;
  }
  const { plan, report, problems } = buildMigrationPlan(backup, seed, { backupFile: backupPath });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`Dry-run report: ${reportPath}`);
  console.log(`Questions migrated: ${report.counts.questions} (bundles ${report.counts.bundles}, keys ${report.counts.keys})`);
  console.log(`Seeded: ${report.counts.subjects} subjects, ${report.counts.chapters} chapters, ${report.counts.topics} topics, ${report.counts.passages} passage(s), ${report.counts.selectionRules} selection rules, ${report.counts.pools} pools, ${report.counts.coverageRows} coverage rows`);
  console.log(`Exact duplicates: ${report.duplicateReport.exactDuplicates}; stem collisions: ${report.duplicateReport.stemCollisions.length} (recorded keep)`);
  console.log(`Stats: ${report.stats.verified} verified / ${report.stats.total} total; multi-exam ${report.stats.multiExamCount}; disputed ${report.stats.disputedCount}`);
  if (problems.length > 0) {
    console.error(`PROBLEMS (${problems.length}) — migration must NOT run:`);
    for (const p of problems) console.error(`  - ${p}`);
    return 2;
  }
  console.log('Dry-run OK — no problems. Nothing was written to Firestore.');
  return 0;
}

async function runApply(args) {
  const backupPath = argValue(args, '--backup') ?? DEFAULT_BACKUP_PATH;
  const auditPath = argValue(args, '--audit')
    ?? resolve(__dirname, `../team/migrate-central-bank-v2-apply-audit-${new Date().toISOString().slice(0, 10)}.json`);
  const emuIdx = args.indexOf('--emulator');
  if (emuIdx < 0) {
    console.error('REFUSED: --apply writes to a Firestore EMULATOR only. Pass --emulator [host:port]. There is no live target.');
    return 2;
  }
  const emuHost = args[emuIdx + 1] && !args[emuIdx + 1].startsWith('--') ? args[emuIdx + 1] : '127.0.0.1:8080';
  const targetProblem = emulatorTargetProblem(emuHost);
  if (targetProblem) {
    console.error(targetProblem);
    return 2;
  }
  // Fresh backup required (dated today).
  const backupDate = dateOfFile(backupPath);
  const today = new Date().toISOString().slice(0, 10);
  if (backupDate !== today) {
    console.error(`REFUSED: the pre-migration backup '${backupPath}' is dated ${backupDate ?? 'missing'} — take a fresh backup today (${today}) before applying.`);
    return 2;
  }
  const rest = `http://${emuHost}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  if (!(await probeEmulator(rest))) {
    console.error(`REFUSED: '${emuHost}' does not answer like a Firestore emulator.`);
    return 2;
  }
  let backup;
  try {
    backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  } catch (e) {
    console.error(`Cannot read backup '${backupPath}': ${e.message}`);
    return 2;
  }
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  const { plan, report, problems } = buildMigrationPlan(backup, seed, { backupFile: backupPath });
  if (problems.length > 0) {
    console.error(`PREFLIGHT FAILED (${problems.length}) — refusing to apply:`);
    for (const p of problems) console.error(`  - ${p}`);
    return 2;
  }
  // Preflight against the emulator: counts + IDs must match the backup.
  const liveQuestions = await listCollection(rest, 'jobQuestions');
  const liveBundles = await listCollection(rest, 'jobQuestionBundles');
  const liveKeys = await listCollection(rest, 'jobQuestionKeys');
  if (liveQuestions.length !== 35 || liveBundles.length !== 13 || liveKeys.length !== 13) {
    console.error(`PREFLIGHT FAILED: emulator has jobQuestions=${liveQuestions.length}, bundles=${liveBundles.length}, keys=${liveKeys.length} (expected 35/13/13).`);
    return 2;
  }
  // Re-probe immediately before the first write (seed-convention guard).
  if (!(await probeEmulator(rest))) {
    console.error('REFUSED: emulator probe failed immediately before the first write.');
    return 2;
  }
  const now = new Date();
  const written = { subjects: 0, chapters: 0, topics: 0, passages: 0, selectionRules: 0, pools: 0, stats: 0, coverage: 0, questions: 0, bundles: 0 };
  const writeNew = async (collection, id, fields) => {
    const existing = await getDoc(rest, collection, id);
    if (existing) {
      await patchDoc(rest, collection, id, toFirestoreFields(fields));
    } else {
      await createDoc(rest, collection, id, toFirestoreFields(fields));
    }
  };
  // Phase 2 — new collections first.
  for (const [id, doc] of Object.entries(plan.subjects)) { await writeNew('jobSubjects', id, doc); written.subjects += 1; }
  for (const [id, doc] of Object.entries(plan.chapters)) { await writeNew('jobChapters', id, doc); written.chapters += 1; }
  for (const [id, doc] of Object.entries(plan.topics)) { await writeNew('jobTopics', id, doc); written.topics += 1; }
  for (const [id, doc] of Object.entries(plan.passages)) { await writeNew('jobPassages', id, doc); written.passages += 1; }
  for (const [id, doc] of Object.entries(plan.selectionRules)) { await writeNew('jobExamSelectionRules', id, doc); written.selectionRules += 1; }
  for (const pool of plan.pools) { await writeNew('examQuestionPools', pool.poolId, pool); written.pools += 1; }
  await writeNew('jobQuestionBankStats', 'global', plan.stats); written.stats += 1;
  for (const [examKey, examStats] of Object.entries(plan.statsByExam)) {
    await writeNew('jobQuestionBankStats', examKey, examStats); written.stats += 1;
  }
  for (const [examKey, rows] of Object.entries(plan.coverage)) {
    for (const row of rows) {
      await writeNew('jobBankCoverage', `${row.examId}__${row.subjectId}`, row); written.coverage += 1;
    }
    void examKey;
  }
  // Phase 2 — migrate the 35, one batch per topic bundle (13 batches).
  const legacyById = new Map((backup.data.jobQuestions ?? []).map((q) => [q.id, q]));
  const bundlesByTopic = new Map();
  for (const b of backup.data.jobQuestionBundles ?? []) {
    bundlesByTopic.set(b.id, b.sourceQuestionIds ?? []);
  }
  for (const [, ids] of bundlesByTopic) {
    for (const qid of ids) {
      const entry = plan.questions.find((q) => q.id === qid);
      if (!entry) throw new Error(`apply: no migrated doc for '${qid}'`);
      const fields = { ...toFirestoreFields(entry.doc), updatedAt: now };
      await patchDoc(rest, 'jobQuestions', qid, fields);
      const legacy = legacyById.get(qid) ?? {};
      const stale = V1_ONLY_FIELDS.filter((f) => f in legacy);
      await patchDeleteFields(rest, 'jobQuestions', qid, stale);
      written.questions += 1;
    }
  }
  // Phase 2 — rebuild the reading bundle (bundleVersion +1, key unchanged).
  const rb = plan.readingBundleRebuild;
  const bundleDoc = await getDoc(rest, 'jobQuestionBundles', rb.bundleId);
  if (!bundleDoc) throw new Error(`apply: reading bundle '${rb.bundleId}' is missing in the emulator`);
  await patchDoc(rest, 'jobQuestionBundles', rb.bundleId, {
    questions: rb.questions,
    bundleVersion: rb.bundleVersionTo,
    updatedAt: now,
  });
  written.bundles += 1;
  // Phase 3 — read-back verification.
  const verifyProblems = [];
  const afterQuestions = await listCollection(rest, 'jobQuestions');
  if (afterQuestions.length !== 35) verifyProblems.push(`read-back: jobQuestions=${afterQuestions.length} (expected 35)`);
  for (const entry of plan.questions) {
    const live = await getDoc(rest, 'jobQuestions', entry.id);
    if (!live) {
      verifyProblems.push(`read-back: question '${entry.id}' is missing`);
      continue;
    }
    if (live.schemaVersion !== MIGRATION_SCHEMA_VERSION) {
      verifyProblems.push(`read-back: question '${entry.id}' schemaVersion is ${String(live.schemaVersion)} (expected 2)`);
    }
    const legacy = legacyById.get(entry.id);
    if (legacy && live.question !== undefined) {
      const expected = READING_QUESTION_IDS.includes(entry.id)
        ? extractPassageStem(legacy.questionText, READING_PASSAGE_TEXT)
        : legacy.questionText;
      if (live.question !== expected) verifyProblems.push(`read-back: question '${entry.id}' text changed`);
    }
    if (legacy && JSON.stringify(live.options) !== JSON.stringify(legacy.options)) {
      verifyProblems.push(`read-back: question '${entry.id}' options changed`);
    }
    if (legacy && live.correctAnswer !== legacy.correctLetter) {
      verifyProblems.push(`read-back: question '${entry.id}' answer changed`);
    }
    const vp = validateMigratedQuestion({ ...live, questionId: entry.id });
    if (vp.length > 0) verifyProblems.push(...vp.map((p) => `read-back ${entry.id}: ${p}`));
  }
  const audit = {
    appliedAt: now.toISOString(),
    backupFile: backupPath,
    written,
    readBackProblems: verifyProblems,
    dryRunReport: report,
  };
  writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');
  console.log(`Apply audit: ${auditPath}`);
  console.log(`Written: ${JSON.stringify(written)}`);
  if (verifyProblems.length > 0) {
    console.error(`READ-BACK FAILED (${verifyProblems.length}):`);
    for (const p of verifyProblems) console.error(`  - ${p}`);
    return 2;
  }
  console.log('Apply OK — read-back verification passed (35 questions, same texts/options/answers).');
  return 0;
}

async function runRollback(args) {
  const backupPath = argValue(args, '--rollback');
  const auditPath = argValue(args, '--audit')
    ?? resolve(__dirname, `../team/migrate-central-bank-v2-rollback-audit-${new Date().toISOString().slice(0, 10)}.json`);
  const emuIdx = args.indexOf('--emulator');
  if (emuIdx < 0) {
    console.error('REFUSED: --rollback writes to a Firestore EMULATOR only. Pass --emulator [host:port]. There is no live target.');
    return 2;
  }
  const emuHost = args[emuIdx + 1] && !args[emuIdx + 1].startsWith('--') ? args[emuIdx + 1] : '127.0.0.1:8080';
  const targetProblem = emulatorTargetProblem(emuHost);
  if (targetProblem) {
    console.error(targetProblem);
    return 2;
  }
  const rest = `http://${emuHost}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  if (!(await probeEmulator(rest))) {
    console.error(`REFUSED: '${emuHost}' does not answer like a Firestore emulator.`);
    return 2;
  }
  let backup;
  try {
    backup = JSON.parse(readFileSync(backupPath, 'utf8'));
  } catch (e) {
    console.error(`Cannot read backup '${backupPath}': ${e.message}`);
    return 2;
  }
  const legacyQuestions = backup.data.jobQuestions ?? [];
  const restored = [];
  for (const legacy of legacyQuestions) {
    const { id, ...fields } = legacy;
    const live = await getDoc(rest, 'jobQuestions', id);
    if (!live) {
      console.error(`rollback: question '${id}' is missing in the emulator — cannot restore`);
      continue;
    }
    // Restore the old field shape; delete every v2-only field.
    await patchDoc(rest, 'jobQuestions', id, toFirestoreFields(fields));
    await patchDeleteFields(rest, 'jobQuestions', id, V2_ONLY_FIELDS.filter((f) => f in live));
    restored.push(id);
  }
  // Delete the newly seeded collections (all new — nothing pre-existing is lost).
  const deleted = {};
  for (const collection of ['examQuestionPools', 'jobQuestionBankStats', 'jobBankCoverage', 'jobExamSelectionRules', 'jobPassages', 'jobTopics', 'jobChapters', 'jobSubjects']) {
    const docs = await listCollection(rest, collection);
    deleted[collection] = 0;
    for (const d of docs) {
      await deleteDoc(rest, collection, d.id);
      deleted[collection] += 1;
    }
  }
  // Restore the reading bundle to version 1 (backup copy, wholesale).
  const readingBundle = (backup.data.jobQuestionBundles ?? []).find(
    (b) => b.id === 'topic__bcs__english__comprehension__reading',
  );
  if (readingBundle) {
    const { id, ...fields } = readingBundle;
    await patchDoc(rest, 'jobQuestionBundles', id, toFirestoreFields(fields));
  }
  // Re-run the Phase-0 checks.
  const afterQuestions = await listCollection(rest, 'jobQuestions');
  const afterBundles = await listCollection(rest, 'jobQuestionBundles');
  const afterKeys = await listCollection(rest, 'jobQuestionKeys');
  const checkProblems = [];
  if (afterQuestions.length !== 35) checkProblems.push(`rollback check: jobQuestions=${afterQuestions.length} (expected 35)`);
  if (afterBundles.length !== 13) checkProblems.push(`rollback check: bundles=${afterBundles.length} (expected 13)`);
  if (afterKeys.length !== 13) checkProblems.push(`rollback check: keys=${afterKeys.length} (expected 13)`);
  for (const q of afterQuestions) {
    if (q.schemaVersion === MIGRATION_SCHEMA_VERSION) {
      checkProblems.push(`rollback check: question '${q.id}' still carries schemaVersion 2`);
    }
  }
  const audit = {
    rolledBackAt: new Date().toISOString(),
    backupFile: backupPath,
    restored,
    deleted,
    checkProblems,
  };
  writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');
  console.log(`Rollback audit: ${auditPath}`);
  console.log(`Restored ${restored.length} questions; deleted ${JSON.stringify(deleted)}`);
  if (checkProblems.length > 0) {
    console.error(`ROLLBACK CHECK FAILED (${checkProblems.length}):`);
    for (const p of checkProblems) console.error(`  - ${p}`);
    return 2;
  }
  console.log('Rollback OK — the bank is back on the v1 shape.');
  return 0;
}

async function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    return 0;
  }
  const liveProblem = liveFlagProblem(args);
  if (liveProblem) {
    console.error(liveProblem);
    return 2;
  }
  const credProblem = productionCredentialsProblem();
  if (credProblem) {
    console.error(credProblem);
    return 2;
  }
  if (args.includes('--rollback')) return runRollback(args);
  if (args.includes('--apply')) return runApply(args);
  return runDryRun(args);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv).then((code) => {
    process.exitCode = code;
  });
}
