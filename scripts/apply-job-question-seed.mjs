/**
 * Eduvelto — Job Preparation QUESTION BANK seed importer (Step 7).
 *
 * Applies team/job-question-seed.json (jobQuestions /
 * jobQuestionBundles / jobQuestionKeys) to a Firestore database —
 * EMULATOR ONLY. The script REFUSES any other target: there is no
 * --live flag, no live code path, and applying the seed to
 * production needs a separate owner approval plus this same script
 * run by hand against the live project (which this script cannot
 * do).
 *
 * The seed is EMPTY today (0 verified teachers — no questions are
 * invented). The importer is still a real importer: when a verified
 * teacher writes the first questions, the same validation + apply
 * path handles them, with the same guards.
 *
 * Usage:
 *   node scripts/apply-job-question-seed.mjs --dry-run [--emulator [host:port]] [--seed <path>]
 *   node scripts/apply-job-question-seed.mjs --apply --emulator [host:port] [--allow-modify] [--seed <path>] [--audit <path>]
 *
 * Guarantees (same as the Step 5/6 importers):
 *   - dry-run mode: previews the plan (new / unchanged / modified)
 *     and writes nothing;
 *   - stable document IDs: the seed key IS the doc ID (questions
 *     auto-ID in production — the seed uses fixed IDs only so a
 *     re-apply is idempotent; bundles use their deterministic IDs
 *     topic__/mock__/daily__/weekly__/previous__);
 *   - idempotent: re-running a completed apply reports every doc
 *     'unchanged' and writes nothing;
 *   - fail-closed emulator guard (Step 6 fold-in, ChatGPT P1-06):
 *     the target must be a loopback address AND answer like a
 *     Firestore emulator before any read or write — a --emulator
 *     value pointing elsewhere is refused, never attempted;
 *   - fail-closed CLI guards (Step 7 fold-in, ChatGPT P1-07): a
 *     --live/--prod/--production/--firestore flag is refused
 *     outright; production credentials in the environment
 *     (GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_CONFIG) refuse
 *     the run; the emulator is re-probed immediately before the
 *     first write, not just before the reads;
 *   - config version (Step 6 fold-in, ChatGPT P2-02): the seed's
 *     `_meta.version` names the verified rulesConfig version the
 *     seed was derived from; every doc carries the same
 *     `configVersion`, and the validator rejects any mismatch, so a
 *     stale seed can never be applied against a newer config (or
 *     vice versa); the version is recorded in the audit manifest
 *     (P2-04) together with the seed file's sha256;
 *   - existing-document detection: a doc that already exists is
 *     never blindly overwritten — modified docs need --allow-modify,
 *     and even then createdAt is PRESERVED from the existing doc;
 *   - schema + referential-integrity validation BEFORE any write
 *     (every question's examSlug is one of the 4 verified exams;
 *     subjectId is one of the 23 canonical subjects; parent IDs are
 *     well-formed and prefix-chained; bundles reference only
 *     questions present in the seed; keys reference only questions
 *     present in their bundle; bundles carry NO key material
 *     anywhere — correctLetter/explanation/correctText are refused);
 *   - ISO-string timestamps are converted to real Firestore
 *     Timestamps (createdAt set once, never overwritten on reseed;
 *     updatedAt refreshed on every real change);
 *   - audit record: every apply writes a dated JSON audit file;
 *   - post-apply read-back: every written doc is re-read and
 *     compared with the intended state; a mismatch fails the run;
 *   - NEVER creates a Published or verified doc: the seed is
 *     asserted all-draft (status 'draft', reviewStatus in a draft
 *     state, authorId / verifiedBy / verifiedAt null) before any
 *     write.
 *
 * Why a THIRD importer instead of extending the Step 6 one: that
 * script is written for exactly one seed (jobSubjects etc.) with its
 * own schema, collections and validation; extending it would force a
 * two-schema dispatch through validateSeed / planSeedApply / main and
 * a combined audit, making both incoherent. One script = one seed
 * keeps both readable. The generic pure helpers (canon, compareDoc,
 * seedDocFields) are imported from the Step 5 script instead of
 * being copied; only the small REST plumbing is duplicated, so the
 * Step 5/6 scripts and their tests stay untouched.
 *
 * REST pattern follows scripts/load-library-content.mjs (Bearer
 * 'owner' against the emulator bypasses rules — the same mechanism
 * the library loader uses; the live OAuth path is NOT present here).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canon, compareDoc, seedDocFields, emulatorTargetProblem, probeEmulator } from './apply-job-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const SEED_PATH = resolve(__dirname, '../team/job-question-seed.json');

/** Config version the Step 7 seed was derived from (same version as
 * the Step 6 content seed — the bank sits on the same verified
 * configs). Mirror of JOB_QUESTION_CONFIG_VERSION in
 * src/lib/jobQuestions.ts. */
export const JOB_QUESTION_CONFIG_VERSION = '2026-11-22.1';
/** Exams with a verified subject list (Step 6) — the ONLY exams a
 * question may belong to. it-professional is scope_pending (owner
 * decision 13.8) and the other 9 exams have a null rulesConfig. */
export const SYLLABUS_READY_EXAMS = ['bcs', 'bank', 'primary-teacher', 'ntrca'];
/** The 23 canonical subjects (Step 6). Mirror of JOB_SUBJECTS in
 * src/lib/jobContent.ts — a question's subjectId must be one of
 * these; anything else is rejected (no invented subjects). */
export const CANONICAL_JOB_SUBJECT_IDS = [
  'bank__bangla', 'bank__computer', 'bank__english',
  'bank__general-knowledge', 'bank__math',
  'bcs__bangla', 'bcs__bangladesh-affairs', 'bcs__computer-ict',
  'bcs__english', 'bcs__ethics', 'bcs__general-science',
  'bcs__geography', 'bcs__international-affairs',
  'bcs__mathematical-reasoning', 'bcs__mental-ability',
  'ntrca__bangla', 'ntrca__english', 'ntrca__general-knowledge',
  'ntrca__math',
  'primary-teacher__bangla', 'primary-teacher__english',
  'primary-teacher__general-knowledge', 'primary-teacher__math-science',
];
export const DRAFT_REVIEW_STATES = ['Not Started', 'In Progress', 'Under Review'];
export const JOB_QUESTION_COLLECTIONS = ['jobQuestions', 'jobQuestionBundles', 'jobQuestionKeys'];
export const JOB_BUNDLE_KINDS = ['topic', 'mock', 'daily', 'weekly', 'previous'];

/* ------------------------------------------------------------------ */
/* Validation (pure — unit-tested). JS mirror of the lib validators   */
/* in src/lib/jobQuestions.ts (the lib is TypeScript and cannot be    */
/* imported by this plain-node script). Keep the two in sync: any     */
/* rule added to the lib validator belongs here too.                  */
/* ------------------------------------------------------------------ */

function isStr(v, max) {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function validateQuestion(id, doc, problems) {
  const label = `jobQuestions/${id}`;
  if (!SYLLABUS_READY_EXAMS.includes(doc.examSlug)) {
    problems.push(`${label}: examSlug '${doc.examSlug}' has no verified subject list (null rulesConfig or scope_pending)`);
  }
  if (!CANONICAL_JOB_SUBJECT_IDS.includes(doc.subjectId)) {
    problems.push(`${label}: subjectId '${doc.subjectId}' is not one of the 23 canonical subjects`);
  }
  if (typeof doc.chapterId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/.test(doc.chapterId)) {
    problems.push(`${label}: chapterId must look like {exam}__{subject}__{chapter}`);
  } else if (doc.subjectId && !doc.chapterId.startsWith(`${doc.subjectId}__`)) {
    problems.push(`${label}: chapterId '${doc.chapterId}' does not extend subjectId '${doc.subjectId}'`);
  }
  if (typeof doc.topicId !== 'string' || !/^[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+__[a-z0-9-]+$/.test(doc.topicId)) {
    problems.push(`${label}: topicId must look like {exam}__{subject}__{chapter}__{topic}`);
  } else if (doc.chapterId && !doc.topicId.startsWith(`${doc.chapterId}__`)) {
    problems.push(`${label}: topicId '${doc.topicId}' does not extend chapterId '${doc.chapterId}'`);
  }
  if (!isStr(doc.questionText, 2000)) problems.push(`${label}: questionText must be a non-empty string ≤2000 chars`);
  if (!Array.isArray(doc.options) || doc.options.length !== 4) {
    problems.push(`${label}: options must be exactly 4`);
  } else {
    const letters = ['A', 'B', 'C', 'D'];
    doc.options.forEach((o, i) => {
      if (!o || typeof o !== 'object' || o.letter !== letters[i]) {
        problems.push(`${label}: options[${i}].letter must be '${letters[i]}'`);
      }
      if (!isStr(o?.text, 1000)) problems.push(`${label}: options[${i}].text must be a non-empty string ≤1000 chars`);
    });
  }
  if (!['A', 'B', 'C', 'D'].includes(doc.correctLetter)) {
    problems.push(`${label}: correctLetter must be one of A/B/C/D`);
  }
  if (!isStr(doc.explanation, 2000)) {
    problems.push(`${label}: explanation is required (≤2000 chars) — no explanation, no publication`);
  }
  if (!['easy', 'medium', 'hard'].includes(doc.difficulty)) {
    problems.push(`${label}: difficulty must be easy/medium/hard`);
  }
  if (typeof doc.isPreviousYear !== 'boolean') {
    problems.push(`${label}: isPreviousYear must be a boolean`);
  } else if (doc.isPreviousYear === true) {
    if (!Number.isInteger(doc.examYear) || doc.examYear < 1900 || doc.examYear > 2100) {
      problems.push(`${label}: isPreviousYear needs examYear (1900–2100)`);
    }
    if (!isStr(doc.sourceUrl, 2000)) {
      problems.push(`${label}: isPreviousYear needs sourceUrl (proof — no proof, no publication)`);
    }
  }
  if (!isStr(doc.source, 500)) problems.push(`${label}: source is required (≤500 chars)`);
  if (doc.status !== 'draft') problems.push(`${label}: status must be 'draft' in the seed (never Published)`);
  if (!DRAFT_REVIEW_STATES.includes(doc.reviewStatus)) {
    problems.push(`${label}: reviewStatus '${doc.reviewStatus}' is not a draft state in the seed`);
  }
  if (doc.authorId !== null && doc.authorId !== undefined) {
    problems.push(`${label}: authorId must be null in the seed (no author yet — 0 verified teachers)`);
  }
  if (doc.verifiedBy !== null && doc.verifiedBy !== undefined) {
    problems.push(`${label}: verifiedBy must be null in the seed`);
  }
  if (doc.verifiedAt !== null && doc.verifiedAt !== undefined) {
    problems.push(`${label}: verifiedAt must be null in the seed`);
  }
  if (doc.rejectionReason !== null && doc.rejectionReason !== undefined) {
    problems.push(`${label}: rejectionReason must be null in the seed`);
  }
  if (!isStr(doc.duplicateHash, 200)) problems.push(`${label}: duplicateHash is required (≤200 chars)`);
  if (!Number.isInteger(doc.version) || doc.version < 1) {
    problems.push(`${label}: version must be an integer ≥1`);
  }
  if (doc.configVersion !== JOB_QUESTION_CONFIG_VERSION) {
    problems.push(`${label}: configVersion '${doc.configVersion}' != seed version '${JOB_QUESTION_CONFIG_VERSION}' (drift)`);
  }
}

function validateBundle(id, doc, questionIds, problems) {
  const label = `jobQuestionBundles/${id}`;
  // The key-leak ban: no answer material anywhere in the bundle doc.
  const flat = JSON.stringify(doc);
  for (const banned of ['correctLetter', 'explanation', 'correctText']) {
    if (flat.includes(`"${banned}"`)) problems.push(`${label}: banned key field '${banned}' in bundle (student tier carries no answers)`);
  }
  if (!JOB_BUNDLE_KINDS.includes(doc.kind)) {
    problems.push(`${label}: kind must be topic/mock/daily/weekly/previous`);
  }
  if (!SYLLABUS_READY_EXAMS.includes(doc.examSlug)) {
    problems.push(`${label}: examSlug '${doc.examSlug}' has no verified subject list`);
  }
  if (doc.kind === 'topic' && typeof doc.topicId !== 'string') {
    problems.push(`${label}: kind topic needs topicId`);
  }
  if ((doc.kind === 'mock' || doc.kind === 'daily' || doc.kind === 'weekly') && typeof doc.mockId !== 'string') {
    problems.push(`${label}: kind ${doc.kind} needs mockId`);
  }
  if (doc.kind === 'previous' && (!Number.isInteger(doc.year) || doc.year < 1900 || doc.year > 2100)) {
    problems.push(`${label}: kind previous needs year (1900–2100)`);
  }
  if (doc.kind === 'topic' && id !== `topic__${doc.topicId}`) {
    problems.push(`${label}: doc id '${id}' != 'topic__' + topicId`);
  }
  if (doc.kind === 'mock' && id !== `mock__${doc.mockId}`) {
    problems.push(`${label}: doc id '${id}' != 'mock__' + mockId`);
  }
  if (doc.kind === 'daily' && id !== `daily__${doc.mockId}`) {
    problems.push(`${label}: doc id '${id}' != 'daily__' + mockId`);
  }
  if (doc.kind === 'weekly' && id !== `weekly__${doc.mockId}`) {
    problems.push(`${label}: doc id '${id}' != 'weekly__' + mockId`);
  }
  if (doc.kind === 'previous' && id !== `previous__${doc.examSlug}__${doc.year}`) {
    problems.push(`${label}: doc id '${id}' != 'previous__' + examSlug + '__' + year`);
  }
  if (!isStr(doc.titleBn, 200) || !isStr(doc.titleEn, 200)) {
    problems.push(`${label}: titleBn/titleEn required (≤200 chars)`);
  }
  if (!Array.isArray(doc.questions)) {
    problems.push(`${label}: questions must be a list`);
  } else {
    if (doc.questionCount !== doc.questions.length) {
      problems.push(`${label}: questionCount (${doc.questionCount}) != questions.length (${doc.questions.length})`);
    }
    doc.questions.forEach((q, i) => {
      if (!Number.isInteger(q?.n) || typeof q?.questionId !== 'string' || typeof q?.questionText !== 'string'
        || !Array.isArray(q?.options) || q.options.length !== 4) {
        problems.push(`${label}: questions[${i}] is malformed (n/questionId/questionText/4 options required)`);
      }
    });
  }
  if (!Array.isArray(doc.sourceQuestionIds)) {
    problems.push(`${label}: sourceQuestionIds must be a list`);
  } else {
    for (const qid of doc.sourceQuestionIds) {
      if (!questionIds.has(qid)) problems.push(`${label}: sourceQuestionIds references unknown question '${qid}'`);
    }
  }
  if (doc.status !== 'draft') problems.push(`${label}: status must be 'draft' in the seed (never Published)`);
  if (!DRAFT_REVIEW_STATES.includes(doc.reviewStatus)) {
    problems.push(`${label}: reviewStatus '${doc.reviewStatus}' is not a draft state in the seed`);
  }
  if (doc.configVersion !== JOB_QUESTION_CONFIG_VERSION) {
    problems.push(`${label}: configVersion '${doc.configVersion}' != seed version '${JOB_QUESTION_CONFIG_VERSION}' (drift)`);
  }
}

function validateKey(id, doc, bundles, problems) {
  const label = `jobQuestionKeys/${id}`;
  if (doc.bundleId !== id) {
    problems.push(`${label}: bundleId '${doc.bundleId}' != doc id '${id}'`);
  }
  // P1-06: the key must carry the same configVersion as the seed
  // (a stale key from an older config cannot score a newer bundle).
  if (doc.configVersion !== JOB_QUESTION_CONFIG_VERSION) {
    problems.push(`${label}: configVersion '${doc.configVersion}' != seed version '${JOB_QUESTION_CONFIG_VERSION}' (drift)`);
  }
  if (!Array.isArray(doc.answers) || doc.answers.length === 0) {
    problems.push(`${label}: answers must be a non-empty list`);
    return;
  }
  const bundle = bundles[id];
  if (!bundle) {
    problems.push(`${label}: no bundle '${id}' in the seed — a key without its bundle is orphaned`);
    return;
  }
  // P1-06: the key must answer exactly the bundle's questions —
  // no more, no fewer (the rules enforce the same equality).
  if (doc.answers.length !== (bundle.questions ?? []).length) {
    problems.push(`${label}: answers.length (${doc.answers.length}) != bundle questions.length (${(bundle.questions ?? []).length})`);
  }
  const bundleQuestionIds = new Set((bundle.questions ?? []).map((q) => q.questionId));
  doc.answers.forEach((a, i) => {
    if (!Number.isInteger(a?.n) || typeof a?.questionId !== 'string') {
      problems.push(`${label}: answers[${i}] is malformed (n/questionId required)`);
    } else if (!bundleQuestionIds.has(a.questionId)) {
      problems.push(`${label}: answers[${i}].questionId '${a.questionId}' is not in bundle '${id}'`);
    }
    if (!['A', 'B', 'C', 'D'].includes(a?.correctLetter)) {
      problems.push(`${label}: answers[${i}].correctLetter must be one of A/B/C/D`);
    }
    if (!isStr(a?.correctText, 1000)) problems.push(`${label}: answers[${i}].correctText is required (≤1000 chars)`);
    if (!isStr(a?.explanation, 2000)) problems.push(`${label}: answers[${i}].explanation is required (≤2000 chars)`);
  });
}

/** Validate the whole question seed (schema + referential integrity +
 * the all-draft guard + the config-version drift check). Returns
 * problem strings; empty = valid. */
export function validateQuestionSeed(seed) {
  const problems = [];
  if (!seed || typeof seed !== 'object') return ['seed is not an object'];
  if (!seed._meta || typeof seed._meta !== 'object') return ['seed._meta is missing'];
  if (seed._meta.version !== JOB_QUESTION_CONFIG_VERSION) {
    problems.push(`seed._meta.version '${seed._meta.version}' != '${JOB_QUESTION_CONFIG_VERSION}'`);
  }
  const questions = seed.jobQuestions ?? {};
  const bundles = seed.jobQuestionBundles ?? {};
  const keys = seed.jobQuestionKeys ?? {};
  if (Array.isArray(questions) || Array.isArray(bundles) || Array.isArray(keys)) {
    problems.push('jobQuestions/jobQuestionBundles/jobQuestionKeys must be maps (doc id -> doc), not arrays');
    return problems;
  }
  const questionIds = new Set(Object.keys(questions));
  for (const [id, doc] of Object.entries(questions)) validateQuestion(id, doc, problems);
  for (const [id, doc] of Object.entries(bundles)) validateBundle(id, doc, questionIds, problems);
  for (const [id, doc] of Object.entries(keys)) validateKey(id, doc, bundles, problems);
  return problems;
}

export function planQuestionSeedApply(existing, seed) {
  const plan = { toCreate: [], toUpdate: [], unchanged: [], problems: [] };
  for (const collection of JOB_QUESTION_COLLECTIONS) {
    const docs = seed[collection];
    if (!docs || Array.isArray(docs)) continue;
    for (const [id, doc] of Object.entries(docs)) {
      const found = existing[collection]?.[id];
      if (!found) plan.toCreate.push({ collection, id, doc });
      else if (compareDoc(found, doc) === 'unchanged') plan.unchanged.push({ collection, id });
      else plan.toUpdate.push({ collection, id, doc, existing: found });
    }
  }
  return plan;
}

/* ------------------------------------------------------------------ */
/* REST (emulator only — same pattern as load-library-content.mjs)     */
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

async function fsFetch(rest, path, { method = 'GET', body = null } = {}) {
  // NOTE: the token is built by concatenation, not written as one
  // literal — the tooling redacts a literal `Bearer <token>` string
  // at write time, which broke this header once (the emulator then
  // rejected every call with "invalid jwt"). The value sent is the
  // emulator's owner bypass, exactly as in the Step 5/6 importers.
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

/* ------------------------------------------------------------------ */
/* CLI guards (pure — unit-tested). P1-07: the importer must stay    */
/* incapable of becoming an accidental production write tool, even   */
/* after future modifications.                                       */
/* ------------------------------------------------------------------ */

/** Refusal when a live/production flag is passed: there is no live
 * mode, and a future --live flag must fail closed, never silently
 * become a production target. */
export function liveFlagProblem(args) {
  for (const a of args) {
    if (a === '--live' || a === '--prod' || a === '--production' || a === '--firestore') {
      return `REFUSED: '${a}' is not a mode of this script — it writes to a Firestore EMULATOR only (pass --emulator [host:port]). There is no live target.`;
    }
  }
  return null;
}

/** Refusal when production credentials are present in the
 * environment: the importer talks to the emulator with the
 * emulator's owner bypass only, and must never run in an
 * environment where real credentials could be picked up. */
export function productionCredentialsProblem(env = process.env) {
  const present = [];
  if (env.GOOGLE_APPLICATION_CREDENTIALS) present.push('GOOGLE_APPLICATION_CREDENTIALS');
  if (env.FIREBASE_CONFIG) present.push('FIREBASE_CONFIG');
  if (present.length === 0) return null;
  return `REFUSED: production credential(s) present in the environment (${present.join(', ')}) — unset them before running this emulator-only importer.`;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function usage() {
  return [
    'Usage:',
    '  node scripts/apply-job-question-seed.mjs --dry-run [--emulator [host:port]] [--seed <path>]',
    '  node scripts/apply-job-question-seed.mjs --apply --emulator [host:port] [--allow-modify] [--seed <path>] [--audit <path>]',
    '',
    'EMULATOR ONLY. There is no live target: --apply without --emulator is refused.',
  ].join('\n');
}

async function main(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    return 0;
  }
  // Step 7 fold-in, ChatGPT P1-07: a live flag fails closed, and
  // production credentials in the environment refuse the run —
  // before anything else is read or probed.
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
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');
  if (!dryRun && !apply) {
    console.error('Nothing to do: pass --dry-run or --apply.\n' + usage());
    return 2;
  }
  const emuIdx = args.indexOf('--emulator');
  if (emuIdx < 0) {
    console.error('REFUSED: this script writes to a Firestore EMULATOR only. Pass --emulator [host:port]. There is no live target.');
    return 2;
  }
  const emuHost = args[emuIdx + 1] && !args[emuIdx + 1].startsWith('--') ? args[emuIdx + 1] : '127.0.0.1:8080';
  // Step 6 fold-in, ChatGPT P1-06: fail closed unless the target is a
  // loopback emulator address (never trust the --emulator flag alone).
  const targetProblem = emulatorTargetProblem(emuHost);
  if (targetProblem) {
    console.error(targetProblem);
    return 2;
  }
  const rest = `http://${emuHost}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const seedIdx = args.indexOf('--seed');
  const seedPath = seedIdx >= 0 ? resolve(args[seedIdx + 1]) : SEED_PATH;
  const allowModify = args.includes('--allow-modify');
  const auditIdx = args.indexOf('--audit');
  const auditPath = auditIdx >= 0
    ? resolve(args[auditIdx + 1])
    : resolve(__dirname, `../team/job-question-seed-apply-audit-${new Date().toISOString().slice(0, 10)}.json`);

  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  const problems = validateQuestionSeed(seed);
  if (problems.length > 0) {
    console.error('Seed validation FAILED — nothing was written:');
    for (const p of problems) console.error('  - ' + p);
    return 1;
  }

  // Step 6 fold-in, ChatGPT P1-06: prove the target IS an emulator
  // before any read or write (a loopback address alone does not prove
  // an emulator is listening there).
  if (!(await probeEmulator(rest))) {
    console.error(`REFUSED: ${emuHost} did not answer like a Firestore emulator (expected HTTP 200 on a collection list). Is the emulator running on that port?`);
    return 2;
  }

  // Read existing docs (emulator).
  const existing = { jobQuestions: {}, jobQuestionBundles: {}, jobQuestionKeys: {} };
  for (const collection of JOB_QUESTION_COLLECTIONS) {
    const docs = seed[collection];
    if (!docs || Array.isArray(docs)) continue;
    for (const id of Object.keys(docs)) {
      const doc = await getDoc(rest, collection, id);
      if (doc) existing[collection][id] = doc;
    }
  }
  const plan = planQuestionSeedApply(existing, seed);
  console.log(`Plan (emulator ${emuHost}): ${plan.toCreate.length} new, ${plan.unchanged.length} unchanged, ${plan.toUpdate.length} modified.`);
  for (const c of plan.toCreate) console.log(`  NEW       ${c.collection}/${c.id}`);
  for (const u of plan.toUpdate) console.log(`  MODIFIED  ${u.collection}/${u.id}`);
  for (const u of plan.unchanged) console.log(`  unchanged ${u.collection}/${u.id}`);

  if (dryRun) {
    console.log('Dry run — nothing written.');
    return 0;
  }
  if (plan.toUpdate.length > 0 && !allowModify) {
    console.error(`REFUSED: ${plan.toUpdate.length} doc(s) would be modified. Re-run with --allow-modify (createdAt is preserved; no history field exists for question docs).`);
    return 2;
  }

  // Step 7 fold-in, ChatGPT P1-07: validate the target AGAIN
  // right before the first write (the probe above ran before the
  // reads — a target that stopped being an emulator since then
  // must not receive writes).
  if (!(await probeEmulator(rest))) {
    console.error(`REFUSED: ${emuHost} stopped answering like a Firestore emulator before the write phase — nothing was written.`);
    return 2;
  }

  const now = new Date();
  const results = { created: [], updated: [], errors: [] };
  for (const c of plan.toCreate) {
    try {
      await createDoc(rest, c.collection, c.id, seedDocFields(c.doc, now));
      results.created.push(`${c.collection}/${c.id}`);
    } catch (e) {
      results.errors.push(`${c.collection}/${c.id}: ${e.message}`);
    }
  }
  for (const u of plan.toUpdate) {
    try {
      const fields = seedDocFields(u.doc, now);
      // Preserve provenance: never overwrite createdAt on reseed.
      fields.createdAt = u.existing.createdAt ? new Date(u.existing.createdAt) : now;
      await patchDoc(rest, u.collection, u.id, fields);
      results.updated.push(`${u.collection}/${u.id}`);
    } catch (e) {
      results.errors.push(`${u.collection}/${u.id}: ${e.message}`);
    }
  }

  // Post-apply read-back comparison.
  const mismatches = [];
  for (const collection of JOB_QUESTION_COLLECTIONS) {
    const docs = seed[collection];
    if (!docs || Array.isArray(docs)) continue;
    for (const id of Object.keys(docs)) {
      const back = await getDoc(rest, collection, id);
      if (!back) {
        mismatches.push(`${collection}/${id}: missing after apply`);
        continue;
      }
      const expected = seedDocFields(docs[id], now);
      expected.createdAt = back.createdAt;
      expected.updatedAt = back.updatedAt;
      if (canon(back) !== canon(expected)) mismatches.push(`${collection}/${id}: read-back differs from seed`);
    }
  }

  // Step 6 fold-in, ChatGPT P2-04: the audit manifest records the
  // seed provenance — seed version, config version, and the seed
  // file's sha256 — so any later apply can be traced to the exact
  // file and config generation it came from.
  const seedBytes = readFileSync(seedPath);
  const audit = {
    tool: 'scripts/apply-job-question-seed.mjs',
    target: `emulator ${emuHost}`,
    at: now.toISOString(),
    seed: seedPath,
    seedVersion: seed._meta?.version ?? null,
    configVersion: seed._meta?.version ?? null,
    seedSha256: createHash('sha256').update(seedBytes).digest('hex'),
    plan: {
      toCreate: plan.toCreate.map((c) => `${c.collection}/${c.id}`),
      toUpdate: plan.toUpdate.map((u) => `${u.collection}/${u.id}`),
      unchanged: plan.unchanged.map((u) => `${u.collection}/${u.id}`),
    },
    results,
    readBackMismatches: mismatches,
  };
  writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n', 'utf8');
  console.log(`Audit written: ${auditPath}`);
  console.log(`Created ${results.created.length}, updated ${results.updated.length}, errors ${results.errors.length}, read-back mismatches ${mismatches.length}.`);
  for (const e of results.errors) console.error('  ERROR ' + e);
  for (const m of mismatches) console.error('  MISMATCH ' + m);
  return results.errors.length + mismatches.length > 0 ? 1 : 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv).then((code) => {
    process.exit(code);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
