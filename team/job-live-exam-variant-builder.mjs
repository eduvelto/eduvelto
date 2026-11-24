// Eduvelto — Job Preparation Live Exam variant builder
// (design-live-exam-dashboard.md §3.9 + §6 item 5).
//
// DRY-RUN ONLY. This script NEVER writes to Firestore (live or
// emulator) and never contacts the network. It reads a Firestore
// backup JSON (the same file the central-bank migration reads),
// computes the honest eligibility ladder per exam (full /
// partial / none — §2.3), and, for any exam that reaches the
// ladder, builds 5 shared variants with the §3.3 algorithm run
// on NEUTRAL history (every candidate unseen → weight 10 → a
// stratified uniform draw without replacement, per subject ×
// difficulty slice, crypto-random).
//
// Output: a counts report per exam/subject/difficulty + the
// ladder verdict. With --out <path>, the built variant
// manifests (question IDs ONLY — never text, options, answers
// or explanations; asserted before writing) are written to a
// local JSON file for a Moderator to review and create through
// the admin flow. Without --out, only the report is printed.
//
// THE HONEST POSITION TODAY (24 Nov 2026): the bank holds 35
// questions, all BCS English Language. No exam reaches the
// ladder — every exam is "none" (BCS fails on 9 empty subjects;
// every other exam has 0 verified topics). So this script
// reports the gap and builds NOTHING. That is the correct
// outcome, not a failure: a variant must never be built from
// an unverified topic or a borrowed subject.
//
// Usage:
//   node team/job-live-exam-variant-builder.mjs --dry-run [--backup <path>] [--out <path>]
//   (no --apply mode exists on purpose — variants are created
//   by a Moderator, never by a script against the database)
//
// Verified pattern table — source: JOB_RULES_CONFIGS
// (src/lib/jobExams.ts) as fixed by the pattern-fix branch;
// canonical subject keys from JOB_BANK_SUBJECTS
// (src/lib/jobContent.ts). If a pattern changes, update this
// table in the same commit as the config change.
// Verified topics — source: the 13-topic BCS English list
// (job-mcq-count-evidence/mock-set-designation.md). Only BCS
// English topics are verified today; every other exam's
// verified-topic set is EMPTY by design (NCTB-first: never
// label unverified content as verified). Add a topic here only
// when it has been verified for that exam.

import { randomInt } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BACKUP_PATH = resolve(__dirname, '../../backups/eduvelto-backup-20261124-014508.json');
const VARIANTS_PER_EXAM = 5;
const DIFFICULTY_MIX = { easy: 30, medium: 55, hard: 15 }; // DEFAULT_DIFFICULTY_DISTRIBUTION

/** Verified full patterns: exam → { total, subjects: { canonicalSubject: quota } }. */
const VERIFIED_PATTERNS = {
  bcs: {
    total: 200,
    subjects: {
      bangla: 30,
      english: 30,
      'bangladesh-affairs': 25,
      'international-affairs': 25,
      geography: 10,
      'general-science': 15,
      ict: 15,
      'mathematical-reasoning': 20,
      'mental-ability': 15,
      ethics: 15,
    },
  },
  bank: {
    total: 100,
    subjects: { bangla: 25, english: 25, math: 20, 'general-knowledge': 20, ict: 10 },
  },
  'bank-senior-officer': {
    total: 100,
    subjects: {
      english: 20,
      bangla: 20,
      math: 20,
      'financial-banking': 10,
      'analytical-skills': 20,
      ict: 10,
    },
  },
  'bank-assistant-director': {
    total: 100,
    subjects: {
      english: 20,
      bangla: 20,
      math: 20,
      'financial-banking': 10,
      'analytical-skills': 20,
      ict: 10,
    },
  },
  'primary-teacher': {
    total: 90,
    subjects: { bangla: 25, english: 25, 'math-science': 20, 'general-knowledge': 20 },
  },
  ntrca: {
    total: 100,
    subjects: { bangla: 25, english: 25, math: 25, 'general-knowledge': 25 },
  },
};

/** Verified topics per exam, as canonical topic IDs
 * (`english__grammar__tense` — the exam prefix stripped).
 * Only BCS English is verified today. */
const VERIFIED_TOPICS = {
  bcs: new Set([
    'english__grammar__tense',
    'english__grammar__voice',
    'english__grammar__narration',
    'english__grammar__articles',
    'english__grammar__preposition',
    'english__grammar__conditionals',
    'english__grammar__right-form-of-verbs',
    'english__vocabulary__synonym',
    'english__vocabulary__antonym',
    'english__vocabulary__idiom',
    'english__vocabulary__one-word-substitution',
    'english__vocabulary__spelling',
    'english__comprehension__reading',
  ]),
  bank: new Set(),
  'bank-senior-officer': new Set(),
  'bank-assistant-director': new Set(),
  'primary-teacher': new Set(),
  ntrca: new Set(),
};

const CANONICAL_SUBJECTS = new Set([
  'bangla',
  'english',
  'math',
  'general-knowledge',
  'bangladesh-affairs',
  'international-affairs',
  'general-science',
  'ict',
  'mental-ability',
  'geography',
  'ethics',
  'mathematical-reasoning',
  'math-science',
  'analytical-skills',
  'financial-banking',
]);

const EXAM_SCOPED_TO_CANONICAL = {
  bcs__bangla: 'bangla',
  bcs__english: 'english',
  'bcs__bangladesh-affairs': 'bangladesh-affairs',
  'bcs__international-affairs': 'international-affairs',
  bcs__geography: 'geography',
  'bcs__general-science': 'general-science',
  'bcs__computer-ict': 'ict',
  'bcs__mathematical-reasoning': 'mathematical-reasoning',
  'bcs__mental-ability': 'mental-ability',
  bcs__ethics: 'ethics',
  bank__bangla: 'bangla',
  bank__english: 'english',
  bank__math: 'math',
  'bank__general-knowledge': 'general-knowledge',
  bank__computer: 'ict',
  'primary-teacher__bangla': 'bangla',
  'primary-teacher__english': 'english',
  'primary-teacher__math-science': 'math-science',
  'primary-teacher__general-knowledge': 'general-knowledge',
  ntrca__bangla: 'bangla',
  ntrca__english: 'english',
  ntrca__math: 'math',
  'ntrca__general-knowledge': 'general-knowledge',
};

/** Mirror of jobRepetition.examDifficultyTargets: largest
 * remainder on the 30/55/15 mix, ties broken by band order. */
function examDifficultyTargets(totalQuestions) {
  const d = DIFFICULTY_MIX;
  const total = d.easy + d.medium + d.hard;
  const exact = [(totalQuestions * d.easy) / total, (totalQuestions * d.medium) / total, (totalQuestions * d.hard) / total];
  const floors = exact.map((e) => Math.floor(e));
  let assigned = floors[0] + floors[1] + floors[2];
  const order = [0, 1, 2].sort((a, b) => exact[b] - floors[b] - (exact[a] - floors[a]) || a - b);
  let k = 0;
  while (assigned < totalQuestions) {
    floors[order[k % 3]] += 1;
    assigned += 1;
    k += 1;
  }
  return { easy: floors[0], medium: floors[1], hard: floors[2] };
}

/** Canonical subject for a bank question doc (legacy backup
 * shape: exam-scoped subjectId; v2 shape: already canonical). */
function canonicalSubjectOf(q) {
  if (typeof q.subjectId !== 'string') return null;
  if (CANONICAL_SUBJECTS.has(q.subjectId)) return q.subjectId;
  return EXAM_SCOPED_TO_CANONICAL[q.subjectId] ?? null;
}

/** Canonical topic for a bank question doc: strip the leading
 * exam segment (`bcs__english__grammar__tense` →
 * `english__grammar__tense`). */
function canonicalTopicOf(q) {
  if (typeof q.topicId !== 'string') return null;
  const parts = q.topicId.split('__');
  if (parts.length < 2) return null;
  return parts.slice(1).join('__');
}

/** Fisher–Yates shuffle with crypto randomness (mirrors the
 * neutral-history draw in jobRepetition.selectLiveExamSet:
 * every candidate weight 10, so the weighted draw is uniform
 * without replacement). */
function shuffled(ids) {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Build one variant: per subject × difficulty slice, take the
 * quota from the shuffled eligible IDs. Never duplicates, never
 * borrows across subjects. Returns { ids, shortfall }. */
function buildVariant(eligibleBySlice, pattern) {
  const ids = [];
  let shortfall = 0;
  for (const [subject, quota] of Object.entries(pattern.subjects)) {
    const targets = examDifficultyTargets(quota);
    for (const band of ['easy', 'medium', 'hard']) {
      const pool = eligibleBySlice[subject]?.[band] ?? [];
      const take = shuffled(pool).slice(0, targets[band]);
      ids.push(...take);
      shortfall += targets[band] - take.length;
    }
  }
  return { ids, shortfall };
}

/** A pool/variant doc may carry IDs ONLY — any text, option,
 * answer or explanation field is a leak and refuses the build
 * (mirrors jobQuestionPools.verifyPoolDocsContainIdsOnly). */
function assertIdsOnly(doc, label) {
  const forbidden = ['questionText', 'options', 'correctLetter', 'correctText', 'explanation'];
  for (const f of forbidden) {
    if (Object.prototype.hasOwnProperty.call(doc, f)) {
      throw new Error(`${label}: forbidden field '${f}' — pool docs carry IDs only`);
    }
  }
  if (!Array.isArray(doc.questionIds)) throw new Error(`${label}: questionIds must be a list`);
  if (doc.questionIds.length > 200) throw new Error(`${label}: ${doc.questionIds.length} IDs exceeds the 200 cap`);
  if (new Set(doc.questionIds).size !== doc.questionIds.length) {
    throw new Error(`${label}: duplicate question IDs`);
  }
}

function parseArgs(argv) {
  const opts = { backup: DEFAULT_BACKUP_PATH, out: null, dryRun: true };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--backup') opts.backup = resolve(argv[++i]);
    else if (argv[i] === '--out') opts.out = resolve(argv[++i]);
    else if (argv[i] === '--dry-run') opts.dryRun = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node team/job-live-exam-variant-builder.mjs --dry-run [--backup <path>] [--out <path>]');
      console.log('  Dry-run only. Never writes to Firestore. --out writes variant manifests (IDs only) to a local JSON file.');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const backup = JSON.parse(readFileSync(opts.backup, 'utf8'));
  const questions = backup.data?.jobQuestions ?? [];
  if (!Array.isArray(questions)) throw new Error('backup has no data.jobQuestions list');

  // Eligible = published + canonical subject known + topic
  // verified for THAT exam (topic verification is per exam —
  // a BCS-verified English topic is not a Bank-verified one).
  const published = questions.filter((q) => q.status === 'published');
  console.log(`backup: ${opts.backup}`);
  console.log(`questions in backup: ${questions.length} (${published.length} published)`);

  const report = { generatedAt: new Date().toISOString(), backup: opts.backup, exams: {}, variants: {} };
  let builtAny = false;

  for (const [examSlug, pattern] of Object.entries(VERIFIED_PATTERNS)) {
    const verifiedTopics = VERIFIED_TOPICS[examSlug] ?? new Set();
    const eligibleBySlice = {};
    let eligibleTotal = 0;
    const perSubject = {};
    for (const [subject, quota] of Object.entries(pattern.subjects)) {
      const byBand = { easy: [], medium: [], hard: [] };
      for (const q of published) {
        if (canonicalSubjectOf(q) !== subject) continue;
        const topic = canonicalTopicOf(q);
        if (!topic || !verifiedTopics.has(topic)) continue;
        if (q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard') {
          byBand[q.difficulty].push(q.id);
        }
      }
      eligibleBySlice[subject] = byBand;
      const count = byBand.easy.length + byBand.medium.length + byBand.hard.length;
      eligibleTotal += count;
      perSubject[subject] = { quota, eligible: count, easy: byBand.easy.length, medium: byBand.medium.length, hard: byBand.hard.length };
    }
    // Ladder (§2.3): full = 100% of every subject quota;
    // partial = ≥50% of total AND every subject ≥1 eligible.
    const subjects = Object.entries(pattern.subjects);
    const full = subjects.every(([s, q]) => perSubject[s].eligible >= q);
    const partial =
      !full &&
      eligibleTotal >= Math.ceil(pattern.total / 2) &&
      subjects.every(([s]) => perSubject[s].eligible >= 1);
    const ladder = full ? 'full' : partial ? 'partial' : 'none';
    report.exams[examSlug] = { total: pattern.total, eligible: eligibleTotal, ladder, perSubject };
    console.log(`\n${examSlug}: ${eligibleTotal}/${pattern.total} eligible → ${ladder.toUpperCase()}`);
    for (const [subject, row] of Object.entries(perSubject)) {
      console.log(`  ${subject}: quota ${row.quota}, eligible ${row.eligible} (easy ${row.easy} / medium ${row.medium} / hard ${row.hard})`);
    }
    if (ladder === 'none') {
      console.log(`  → no variants buildable (ladder: none — see the gap above; never build from unverified topics)`);
      continue;
    }
    builtAny = true;
    const variants = [];
    for (let v = 1; v <= VARIANTS_PER_EXAM; v += 1) {
      const { ids, shortfall } = buildVariant(eligibleBySlice, pattern);
      const doc = { poolId: `pool__${examSlug}__full__variant${v}`, questionIds: ids };
      assertIdsOnly(doc, `${examSlug} variant ${v}`);
      variants.push({ variant: v, questionCount: ids.length, shortfall, questionIds: ids });
      console.log(`  variant ${v}: ${ids.length} questions${shortfall > 0 ? ` (shortfall ${shortfall} — partial set, labelled as such)` : ''}`);
    }
    report.variants[examSlug] = variants;
  }

  if (!builtAny) {
    console.log('\nRESULT: no exam reaches the ladder — no variants built. The question bank must grow with VERIFIED questions first (455 missing for one full mock per main exam).');
  } else if (opts.out) {
    writeFileSync(opts.out, JSON.stringify(report, null, 2));
    console.log(`\nVariant manifests (IDs only) written to ${opts.out} — for Moderator review; this script never writes to Firestore.`);
  } else {
    console.log('\nRESULT: variants built in memory only (no --out given, nothing written).');
  }
}

main();
