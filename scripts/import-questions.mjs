// Eduvelto — Question-bank importer (Day 3, 7-day sprint).
//
// Imports the sprint draft JSON files into Firestore as DRAFTS ONLY
// (reviewStatus 'NEEDS-REVIEW', verified:false, never 'Published').
// Nothing in this script can write a verified/published question.
//
//   node scripts/import-questions.mjs [--dry-run] [--live --confirm-live]
//     [--stream job|admission|academic] [--only <relative-path>]
//     [--root <sprint-dir>] [--emulator <host:port>] [--report <path>]
//
// Modes:
//   --dry-run (DEFAULT): validate everything, print + report what WOULD
//     be imported. Writes NOTHING to Firestore and needs no emulator.
//   --live: requires BOTH --live AND --confirm-live. Writes ONLY to the
//     draft collections (jobQuestionDrafts / admissionQuestionDrafts /
//     academicQuestionDrafts) on the FIRESTORE EMULATOR (default
//     127.0.0.1:8080, same as scripts/backup-firestore.mjs). There is NO
//     production path in this script: --production is refused, and a
//     non-loopback emulator host is refused.
//
// Input: ~/workspace/eduorbit/sprint-1week-2026-11-25/
//   job-questions-drafts/, admission-questions-drafts/,
//   academic-questions-drafts/ (+ ID-NAMESPACES.md registry).
//
// Normalisation (ID-NAMESPACES.md "Schema variants") — three answer-key
// spellings, all normalised to canonical `correct_index`:
//   canonical: correct_index
//   K (DU/GST/RU admission): correctOptionIndex (+ correctAnswer text)
//   I (Bank/Primary expansion): correct_answer_index (+ correct_answer text)
// A question whose alias answer TEXT disagrees with options[correct_index]
// is REJECTED (never silently fixed).
//
// Missing headers: 33 files (24 K-files + 9 I-files) carry no `header`.
// The script synthesises a NEEDS-REVIEW header at import time from the
// file-level fields (exam/subject/sources) + the worker resolved from the
// ID registry. Source files on disk are NEVER modified.
//
// Validation (scripts/build_questions.py + scripts/check_bank.py rules):
//   - exactly 4 options; correct_index an integer in 0..3
//   - non-empty question + explanation; non-empty options
//   - a source citation present (syllabus_source | source |
//     source_reference | file-level sources) — missing = REJECT
//   - no banned phrase anywhere in question/explanation
//     (previous year / board question / competitor names / verified
//     claims — full list in BANNED below)
//   - no exact-duplicate question text (normalised) across the whole
//     import; no ID collision (same ID, different question)
//   - ID prefix must be registered in ID-NAMESPACES.md — an
//     unregistered prefix refuses the whole FILE (never imports it)
//   - generic stems ("Choose the correct sentence" etc.) count as
//     duplicates only when their option sets also match (check_bank.py)
// Invalid items are REJECTED with a reason in the report — never
// silently dropped, never auto-fixed.
//
// NOTE on fact_reference: build_questions.py requires it, but the K
// (500 qs) and I (1000 qs) variants carry only `source`, no
// fact_reference. Rejecting all 1,500 would make the import useless,
// and the Bank Keeper treats K/I as importable after normalisation.
// So a missing fact_reference is a WARNING (counted + listed per file),
// not a rejection. A missing source citation of ANY kind is a rejection.
//
// Firestore shape: the draft doc mirrors the canonical central-bank
// question (src/lib/jobCentralBank.ts) but stays a draft:
//   questionId, stream, exam, subject, topic, difficulty, question,
//   options [{letter, text}], correctAnswer (letter), correctText,
//   explanation, source {type:'original-practice', reference},
//   factReference, tags, examMappings, verificationStatus:'draft',
//   status:'draft', reviewStatus:'NEEDS-REVIEW', verified:false,
//   verifiedBy:null, verifiedAt:null, importedFrom, importedAt,
//   header {status:'NEEDS-REVIEW', worker, source} (synthesised when absent).
// The answer key lives ON the draft doc (it is not student-readable:
// draft collections are admin-only in firestore.rules — the student
// projection is built only after review + publish, as in
// scripts/load-quizzes.mjs).
//
// Connection: Firestore REST against the emulator, exactly like
// scripts/backup-firestore.mjs / migrate-central-bank-v2.mjs. No
// firebase-admin dependency is added (the repo has none; REST is the
// established convention here) and no service-account file is read.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_SPRINT_ROOT = resolve(
  REPO_ROOT, '..', 'sprint-1week-2026-11-25',
);
const PROJECT_ID = 'eduvelto';
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';

// Draft-only collections. NEVER jobQuestions / the live central bank.
const DRAFT_COLLECTIONS = {
  job: 'jobQuestionDrafts',
  admission: 'admissionQuestionDrafts',
  academic: 'academicQuestionDrafts',
};

const STREAM_DIRS = {
  job: 'job-questions-drafts',
  admission: 'admission-questions-drafts',
  academic: 'academic-questions-drafts',
};

// Files that are indexes/reports, not question files.
const SKIP_FILES = new Set([
  'shared-bank-index.json',
  'master-bank-index.json',
  'bank-check-report.json',
]);

const BANNED = [
  'previous year', 'বিগত সালের প্রশ্ন', 'board question', 'বোর্ড প্রশ্ন',
  '10minute', 'ten minute', 'biddabari', 'uttoron', 'confidence',
  'verified question', 'যাচাইকৃত প্রশ্ন',
];

// Generic stems: same text is NOT a duplicate unless options also match.
const GENERIC_STEMS = new Set([
  'choose the correct sentence',
  'choose the correct sentence.',
  'choose the correct sentence:',
  'choose the correct answer',
  'which sentence is correct',
  'which one is correct',
  'নিচের কোনটি সঠিক',
  'নিচের কোন বাক্যটি সঠিক',
  'সঠিক বাক্যটি কোনটি',
]);

const LETTERS = ['A', 'B', 'C', 'D'];

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const opt = (f) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};

if (has('--production')) {
  console.error('ERROR: --production is not supported by this script. Drafts go to the emulator only.');
  process.exit(1);
}
const LIVE = has('--live');
const CONFIRM_LIVE = has('--confirm-live');
if (LIVE && !CONFIRM_LIVE) {
  console.error('ERROR: --live refuses to run without --confirm-live. Re-run with both flags, or use --dry-run (default).');
  process.exit(1);
}
const DRY_RUN = !LIVE;
const STREAM_FILTER = opt('--stream');
if (STREAM_FILTER && !STREAM_DIRS[STREAM_FILTER]) {
  console.error(`ERROR: --stream must be one of: ${Object.keys(STREAM_DIRS).join(', ')}`);
  process.exit(1);
}
const ONLY_FILE = opt('--only');
const SPRINT_ROOT = resolve(opt('--root') ?? DEFAULT_SPRINT_ROOT);
const REPORT_PATH = opt('--report');
const EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? opt('--emulator') ?? DEFAULT_EMULATOR_HOST;
if (LIVE && !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(EMULATOR_HOST)) {
  console.error(`ERROR: --live writes to the emulator only; refusing non-loopback host ${EMULATOR_HOST}.`);
  process.exit(1);
}
const REST_BASE = `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ---------------------------------------------------------------------------
// ID registry (ID-NAMESPACES.md)
// ---------------------------------------------------------------------------

function parseRegistry(root) {
  const path = join(root, 'ID-NAMESPACES.md');
  let text;
  try {
    text = readFileSync(path, 'utf-8');
  } catch {
    console.error(`ERROR: cannot read ID registry: ${path}`);
    process.exit(1);
  }
  // Backticked prefix patterns, e.g. `JOBQ-D###`, `ADMQ-DU###`,
  // `CQ-1112-###`, `ACAD-C3-*`. `#` = one digit, `*` = any run.
  const patterns = [];
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const tok = m[1].trim();
    if (!/^[A-Z0-9]+-[A-Z0-9#*…-]+$/.test(tok) || !tok.includes('#') && !tok.includes('*')) continue;
    if (tok.includes('…')) continue; // range shorthand, handled below
    // `#` = one digit, but a registered range may run past the width
    // (JOBQ-G001–G1000, JOBQ-H001–H1078, JOBQ-I/J001–I/J1000): a run of
    // `#` therefore matches 1–4 digits, never an arbitrary width.
    const reSrc = '^' + tok.replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === '*' ? '.*' : `\\${c}`)).replace(/#+/g, (m) => `\\d{1,${Math.max(m.length, 4)}}`) + '$';
    patterns.push({ raw: tok, re: new RegExp(reSrc) });
  }
  // Range shorthand `ACAD-C3-*` … `ACAD-C8-*`: class prefixes C3..C8.
  patterns.push({ raw: 'ACAD-C[3-8]-*', re: /^ACAD-C[3-8]-.+$/ });
  // Numeric canonical prefixes with no letter: JOBQ-#### / ACAD-####.
  patterns.push({ raw: 'JOBQ-####', re: /^JOBQ-\d{4}$/ });
  patterns.push({ raw: 'ACAD-####', re: /^ACAD-\d{4}$/ });
  return { patterns, isRegistered: (id) => patterns.some((p) => p.re.test(id)) };
}

// Worker label for a registered ID, from the registry tables (best effort;
// falls back to the prefix itself when the table gives no worker name).
function workerForId(id, registryText) {
  const m = registryText.match(new RegExp(`\\b${id.replace(/\d+$/, '')}[^|]*\\|\\s*([^|]+?)\\s*\\|`, ''));
  return m ? m[1].trim().replace(/\s+/g, ' ') : null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

function listJsonFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.json') && !SKIP_FILES.has(e.name)) out.push(p);
    }
  };
  if (statSync(dir, { throwIfNoEntry: false })) walk(dir);
  return out.sort();
}

function bannedHit(text) {
  const blob = String(text ?? '').toLowerCase();
  return BANNED.find((b) => blob.includes(b.toLowerCase())) ?? null;
}

// Normalise one question's answer key. Returns { correctIndex } or an error.
function normaliseAnswerKey(q) {
  const aliasText = q.correctAnswer ?? q.correct_answer ?? null;
  if (Number.isInteger(q.correct_index)) {
    if (aliasText != null && Array.isArray(q.options)
      && q.options[q.correct_index] !== undefined
      && String(q.options[q.correct_index]) !== String(aliasText)) {
      return { error: `answer-text mismatch: correct_index=${q.correct_index} points at ${JSON.stringify(q.options[q.correct_index])} but answer text is ${JSON.stringify(aliasText)}` };
    }
    return { correctIndex: q.correct_index, variant: 'canonical' };
  }
  for (const [field, variant] of [['correctOptionIndex', 'K'], ['correct_answer_index', 'I']]) {
    if (Number.isInteger(q[field])) {
      if (aliasText != null && Array.isArray(q.options)
        && q.options[q[field]] !== undefined
        && String(q.options[q[field]]) !== String(aliasText)) {
        return { error: `answer-text mismatch: ${field}=${q[field]} points at ${JSON.stringify(q.options[q[field]])} but answer text is ${JSON.stringify(aliasText)}` };
      }
      return { correctIndex: q[field], variant };
    }
  }
  return { error: 'no answer key: missing correct_index / correctOptionIndex / correct_answer_index' };
}

function sourceCitation(q, fileLevelSources) {
  return q.syllabus_source ?? q.source ?? q.source_reference
    ?? (Array.isArray(fileLevelSources) ? fileLevelSources.join('; ') : fileLevelSources)
    ?? q.examPattern?.source ?? null;
}

// ---------------------------------------------------------------------------
// Firestore REST (emulator only; used by --live only)
// ---------------------------------------------------------------------------

const toValue = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
  }
  return { stringValue: String(v) };
};

async function fsFetch(path, init) {
  const res = await fetch(`${REST_BASE}${path}`, init);
  return res;
}

async function docExists(collection, id) {
  const res = await fsFetch(`/${collection}/${encodeURIComponent(id)}`);
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`GET ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return true;
}

async function createDoc(collection, id, doc) {
  const res = await fsFetch(`/${collection}?documentId=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, toValue(v)])) }),
  });
  if (!res.ok) throw new Error(`POST ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const registry = parseRegistry(SPRINT_ROOT);
  const registryText = readFileSync(join(SPRINT_ROOT, 'ID-NAMESPACES.md'), 'utf-8');

  const report = {
    mode: DRY_RUN ? 'dry-run' : 'live',
    sprintRoot: SPRINT_ROOT,
    generatedAt: new Date().toISOString(),
    totals: { filesSeen: 0, filesParsed: 0, filesUnparseable: 0, questionsSeen: 0, valid: 0, rejected: 0, wouldImport: 0, imported: 0, skippedExisting: 0 },
    perStream: {},
    perFile: [],
    rejections: [],
    warnings: [],
    unparseableFiles: [],
    headersAdded: 0,
    variants: { canonical: 0, K: 0, I: 0 },
  };
  for (const s of Object.keys(STREAM_DIRS)) {
    report.perStream[s] = { files: 0, questions: 0, valid: 0, rejected: 0, headersAdded: 0 };
  }

  const seenText = new Map(); // normalised question (+options for generic stems) -> id
  const seenIds = new Map(); // id -> normalised question text

  const streams = STREAM_FILTER ? [STREAM_FILTER] : Object.keys(STREAM_DIRS);
  // --only restricts to ONE file: resolve its stream from its directory
  // (never run the same file once per stream).
  let onlyStream = null;
  let onlyPath = null;
  if (ONLY_FILE) {
    onlyPath = resolve(SPRINT_ROOT, ONLY_FILE);
    onlyStream = Object.entries(STREAM_DIRS).find(([, d]) => onlyPath.includes(`/${d}/`))?.[0] ?? null;
    if (!onlyStream) {
      console.error(`ERROR: --only path must sit under one of: ${Object.values(STREAM_DIRS).join(', ')}`);
      process.exit(1);
    }
  }
  const activeStreams = onlyStream ? [onlyStream] : streams;
  for (const stream of activeStreams) {
    const dir = join(SPRINT_ROOT, STREAM_DIRS[stream]);
    const files = onlyPath ? [onlyPath] : listJsonFiles(dir);
    for (const file of files) {
      const rel = relative(SPRINT_ROOT, file);
      report.totals.filesSeen += 1;
      report.perStream[stream].files += 1;
      const fileRow = { file: rel, stream, questions: 0, valid: 0, rejected: 0, headerAdded: false, errors: [] };
      let data;
      try {
        data = JSON.parse(readFileSync(file, 'utf-8'));
      } catch (e) {
        report.totals.filesUnparseable += 1;
        report.unparseableFiles.push({ file: rel, error: String(e.message ?? e) });
        fileRow.errors.push(`unparseable JSON: ${e.message}`);
        report.perFile.push(fileRow);
        continue;
      }
      report.totals.filesParsed += 1;
      const questions = Array.isArray(data) ? data : (data.questions ?? []);
      const header = !Array.isArray(data) ? (data.header ?? data.meta ?? null) : null;
      // File-level sources for K/I files (du-*.json carries `sources`).
      const fileSources = data.sources ?? data.examPattern?.sources ?? null;
      // Header synthesis: K/I files carry no `header` (they carry `meta` /
      // `fileStatus` instead). Synthesise NEEDS-REVIEW at import time.
      let effectiveHeader = header;
      if (!header || !/NEEDS-REVIEW/i.test(String(header.status ?? ''))) {
        const firstQ = questions[0] ?? {};
        effectiveHeader = {
          status: 'NEEDS-REVIEW — DRAFT ONLY. Not verified, not published, not imported.',
          exam: data.exam ?? firstQ.exam ?? stream,
          subject: data.subject ?? firstQ.subject ?? null,
          unit: data.unit ?? firstQ.unit ?? null,
          worker: null, // filled per-question from the ID registry
          source: fileSources ?? sourceCitation(firstQ, null) ?? null,
          rule: 'NEEDS-REVIEW header added at import (source file had none). Teacher review required before any use.',
        };
        fileRow.headerAdded = true;
        report.headersAdded += 1;
        report.perStream[stream].headersAdded += 1;
      }

      for (const q of questions) {
        report.totals.questionsSeen += 1;
        report.perStream[stream].questions += 1;
        fileRow.questions += 1;
        const qid = q.id ?? q.questionId ?? '?';
        const where = `${rel}#${qid}`;
        const reject = (reason) => {
          report.totals.rejected += 1;
          report.perStream[stream].rejected += 1;
          fileRow.rejected += 1;
          report.rejections.push({ file: rel, stream, id: qid, question: String(q.question ?? '').slice(0, 120), reason });
        };

        // (5) ID prefix must be registered.
        if (qid === '?' || !registry.isRegistered(qid)) {
          reject(`unregistered ID prefix: ${qid} is not in ID-NAMESPACES.md — file refused for this question`);
          continue;
        }
        // ID collision: same ID, different question.
        const qNorm = norm(q.question);
        if (seenIds.has(qid) && seenIds.get(qid) !== qNorm) {
          reject(`ID collision: ${qid} already used for a different question`);
          continue;
        }
        // (3) Validation — exactly 4 options.
        if (!Array.isArray(q.options) || q.options.length !== 4
          || q.options.some((o) => typeof o !== 'string' || !o.trim())) {
          reject(`bad options: expected exactly 4 non-empty options, got ${Array.isArray(q.options) ? q.options.length : typeof q.options}`);
          continue;
        }
        // (1) Normalise the answer key.
        const key = normaliseAnswerKey(q);
        if (key.error) { reject(key.error); continue; }
        if (!Number.isInteger(key.correctIndex) || key.correctIndex < 0 || key.correctIndex > 3) {
          reject(`bad correct index: ${key.correctIndex} (must be 0..3)`);
          continue;
        }
        report.variants[key.variant] += 1;
        // Non-empty question + explanation.
        if (!q.question || !String(q.question).trim()) { reject('empty question text'); continue; }
        if (!q.explanation || !String(q.explanation).trim()) { reject('empty explanation'); continue; }
        // Source citation required.
        const citation = sourceCitation(q, fileSources);
        if (!citation || !String(citation).trim()) { reject('missing source citation (syllabus_source / source / source_reference)'); continue; }
        if (!q.fact_reference && !q.factReference) {
          report.warnings.push({ file: rel, id: qid, warning: 'missing fact_reference (source citation present; see script header note)' });
        }
        // Banned phrases.
        const banned = bannedHit(`${q.question} ${q.explanation}`);
        if (banned) { reject(`banned phrase: ${JSON.stringify(banned)}`); continue; }
        // Verified-claim guard: never import anything labelled verified.
        if (q.status && String(q.status).toUpperCase() !== 'NEEDS-REVIEW') {
          reject(`status is ${JSON.stringify(q.status)}, not NEEDS-REVIEW`);
          continue;
        }
        if (q.verified === true || q.isVerified === true) {
          reject('question claims verified:true — drafts must never be verified');
          continue;
        }
        // Exact-duplicate rejection (generic stems need matching options too).
        const dupKey = GENERIC_STEMS.has(qNorm)
          ? `${qNorm} || ${[...q.options].map(norm).sort().join('|')}`
          : qNorm;
        if (seenText.has(dupKey)) {
          reject(`exact duplicate of ${seenText.get(dupKey)}`);
          continue;
        }
        seenText.set(dupKey, qid);
        seenIds.set(qid, qNorm);

        // Valid — build the canonical draft doc.
        const worker = workerForId(qid, registryText);
        const doc = {
          questionId: qid,
          stream,
          exam: q.exam ?? data.exam ?? null,
          subject: q.subject ?? data.subject ?? null,
          subjectSlug: q.subjectSlug ?? null,
          unit: q.unit ?? data.unit ?? null,
          topic: q.topic ?? null,
          difficulty: q.difficulty ?? 'medium',
          questionType: 'mcq',
          question: q.question,
          options: q.options.map((text, i) => ({ letter: LETTERS[i], text })),
          correctAnswer: LETTERS[key.correctIndex],
          correctText: q.options[key.correctIndex],
          correct_index: key.correctIndex,
          explanation: q.explanation,
          source: { type: 'original-practice', reference: String(citation) },
          factReference: q.fact_reference ?? q.factReference ?? null,
          tags: Array.isArray(q.tags) ? q.tags : [],
          examMappings: q.exam ? [String(q.exam)] : [],
          verificationStatus: 'draft',
          status: 'draft',
          reviewStatus: 'NEEDS-REVIEW',
          verified: false,
          verifiedBy: null,
          verifiedAt: null,
          header: { ...effectiveHeader, worker },
          importedFrom: rel,
          importedAt: new Date().toISOString(),
        };

        report.totals.valid += 1;
        report.perStream[stream].valid += 1;
        fileRow.valid += 1;

        if (DRY_RUN) {
          report.totals.wouldImport += 1;
          continue;
        }
        // --live: emulator only, draft collections only.
        const collection = DRAFT_COLLECTIONS[stream];
        try {
          if (await docExists(collection, qid)) {
            report.totals.skippedExisting += 1;
            report.warnings.push({ file: rel, id: qid, warning: `already exists in ${collection} — skipped, not overwritten` });
            continue;
          }
          await createDoc(collection, qid, doc);
          report.totals.imported += 1;
        } catch (e) {
          reject(`live write failed: ${e.message}`);
          // Undo the valid count: a failed write is not an import.
          report.totals.valid -= 1;
          report.perStream[stream].valid -= 1;
          fileRow.valid -= 1;
        }
      }
      report.perFile.push(fileRow);
    }
  }

  // Per-class/subject roll-up (from valid questions only — recomputed
  // from perFile would lose subject granularity, so count from rejections
  // complement: valid per file is the roll-up unit).
  report.perSubject = {};
  for (const row of report.perFile) {
    if (row.valid) report.perSubject[`${row.stream}:${basename(row.file)}`] = row.valid;
  }

  const total = report.totals;
  console.log(`\nEduvelto question-bank import — ${report.mode.toUpperCase()}`);
  console.log(`Sprint root: ${SPRINT_ROOT}`);
  console.log(`Files: ${total.filesSeen} seen, ${total.filesParsed} parsed, ${total.filesUnparseable} unparseable`);
  console.log(`Questions: ${total.questionsSeen} seen, ${total.valid} valid, ${total.rejected} rejected`);
  console.log(DRY_RUN
    ? `Would import: ${total.wouldImport} (nothing written — dry-run)`
    : `Imported: ${total.imported} into draft collections, ${total.skippedExisting} already-existed (skipped)`);
  console.log(`Headers synthesised (files without one): ${report.headersAdded}`);
  console.log(`Answer-key variants: canonical=${report.variants.canonical} K=${report.variants.K} I=${report.variants.I}`);
  for (const [s, p] of Object.entries(report.perStream)) {
    console.log(`  ${s}: ${p.files} files, ${p.questions} qs, ${p.valid} valid, ${p.rejected} rejected, ${p.headersAdded} headers added`);
  }
  if (report.unparseableFiles.length) {
    console.log('\nUNPARSEABLE FILES:');
    for (const f of report.unparseableFiles) console.log(`  - ${f.file}: ${f.error}`);
  }
  const byReason = {};
  for (const r of report.rejections) byReason[r.reason.split(':')[0]] = (byReason[r.reason.split(':')[0]] ?? 0) + 1;
  if (Object.keys(byReason).length) {
    console.log('\nREJECTIONS BY REASON:');
    for (const [reason, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${reason}`);
  }
  console.log(`Warnings (missing fact_reference etc.): ${report.warnings.length}`);

  if (REPORT_PATH) {
    const out = resolve(REPORT_PATH);
    writeFileSync(out, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\nFull report written to: ${out}`);
  }
  if (total.filesUnparseable > 0 || total.rejected > 0) {
    console.log('\nNOTE: rejections are listed in the report — nothing was silently dropped.');
  }
  return 0;
}

process.exitCode = await main();
