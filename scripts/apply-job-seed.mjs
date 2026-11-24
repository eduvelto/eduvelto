/**
 * Eduvelto — Job Preparation seed importer (Step 5 closure, P1-2).
 *
 * Applies team/job-categories-exams-seed.json (10 jobCategories + 15
 * jobExams) to a Firestore database — EMULATOR ONLY. The script
 * REFUSES any other target: there is no --live flag, no live code
 * path, and applying the seed to production needs a separate owner
 * approval plus this same script run by hand against the live project
 * (which this script cannot do).
 *
 * Usage:
 *   node scripts/apply-job-seed.mjs --dry-run [--emulator [host:port]] [--seed <path>]
 *   node scripts/apply-job-seed.mjs --apply --emulator [host:port] [--allow-modify] [--seed <path>] [--audit <path>]
 *
 * Guarantees (ChatGPT review P1-2):
 *   - dry-run mode: previews the plan (new / unchanged / modified)
 *     and writes nothing;
 *   - stable document IDs: the seed key IS the doc ID (no duplicates);
 *   - idempotent: re-running a completed apply reports every doc
 *     'unchanged' and writes nothing;
 *   - existing-document detection: a doc that already exists is
 *     never blindly overwritten — modified docs need --allow-modify,
 *     and even then createdAt + rulesConfigHistory are PRESERVED from
 *     the existing doc (a changed rulesConfig gets ONE appended
 *     history entry, changedBy 'seed-import', exactly as the rules
 *     require of an Admin write);
 *   - schema + referential-integrity validation BEFORE any write
 *     (every exam's categoryId exists; every category's hubSlugs are
 *     real exams; the 15 hubs appear exactly once; order 1–10);
 *   - ISO-string timestamps are converted to real Firestore
 *     Timestamps (createdAt set once, never overwritten on reseed;
 *     updatedAt refreshed on every real change);
 *   - audit record: every apply writes a dated JSON audit file;
 *   - post-apply read-back: every written doc is re-read and
 *     compared with the intended state; a mismatch fails the run;
 *   - NEVER creates a Published exam or a verified doc: the seed is
 *     asserted all-draft (status 'draft', reviewStatus in a draft
 *     state) before any write.
 *
 * REST pattern follows scripts/load-library-content.mjs (Bearer
 * 'owner' against the emulator bypasses rules — the same mechanism
 * the library loader uses; the live OAuth path is NOT present here).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const SEED_PATH = resolve(__dirname, '../team/job-categories-exams-seed.json');

export const JOB_CATEGORY_SLUGS = [
  'bcs-bpsc', 'govt', 'bank', 'primary-teacher', 'ntrca-teacher',
  'defence-police', 'autonomous', 'ngo-private', 'it-professional',
  'other-competitive',
];
export const JOB_EXAM_SLUGS = [
  'bcs', 'bank', 'primary-teacher', 'ntrca', 'dgfood', 'bpsc-non-cadre',
  'cag', 'bfsa', 'others', 'ministries', 'defence', 'autonomous',
  'private-ngo', 'it-professional', 'grade-11-20',
];
export const DRAFT_REVIEW_STATES = ['Not Started', 'In Progress', 'Under Review'];
export const PATTERN_STATUSES = [
  'verified', 'last_verified', 'not_verified', 'not_applicable', 'scope_pending',
];

/* ------------------------------------------------------------------ */
/* Validation (pure — unit-tested)                                     */
/* ------------------------------------------------------------------ */

/** Validate one rulesConfig map (mirrors firestore.rules
 * validJobRulesConfig, minus the timestamp type which the REST layer
 * handles). Returns problem strings; empty = valid. */
export function validateRulesConfig(cfg, label) {
  const problems = [];
  if (cfg === null || cfg === undefined) return problems;
  if (typeof cfg !== 'object' || Array.isArray(cfg)) return [`${label}: rulesConfig is not a map`];
  const int = (k) =>
    cfg[k] === null || cfg[k] === undefined || (Number.isInteger(cfg[k]) && cfg[k] >= 1);
  if (!int('questionCount')) problems.push(`${label}: questionCount must be a positive integer`);
  if (!int('timeMinutes')) problems.push(`${label}: timeMinutes must be a positive integer`);
  if (!int('marksPerQuestion')) problems.push(`${label}: marksPerQuestion must be a positive integer`);
  const neg = cfg.negativeMarking;
  if (neg !== null && neg !== undefined && (typeof neg !== 'number' || neg < 0)) {
    problems.push(`${label}: negativeMarking must be a non-negative number`);
  }
  if (typeof neg === 'number' && Number.isInteger(cfg.marksPerQuestion) && neg >= cfg.marksPerQuestion) {
    problems.push(`${label}: negativeMarking must be smaller than marksPerQuestion`);
  }
  const prov = cfg.provisionalNegativeMarking;
  if (prov !== null && prov !== undefined && (typeof prov !== 'number' || prov < 0)) {
    problems.push(`${label}: provisionalNegativeMarking must be a non-negative number`);
  }
  if (cfg.negativeMarkingVerified === false && neg !== null && neg !== undefined) {
    problems.push(`${label}: unverified penalty must not sit in negativeMarking (use provisionalNegativeMarking)`);
  }
  if (typeof cfg.negativeMarkingVerified !== 'boolean') {
    problems.push(`${label}: negativeMarkingVerified must be a boolean`);
  }
  if (cfg.passMark !== null && cfg.passMark !== undefined && (!Number.isInteger(cfg.passMark) || cfg.passMark < 0)) {
    problems.push(`${label}: passMark must be a non-negative integer`);
  }
  if (cfg.passPercent !== null && cfg.passPercent !== undefined && (!Number.isInteger(cfg.passPercent) || cfg.passPercent < 0 || cfg.passPercent > 100)) {
    problems.push(`${label}: passPercent must be an integer 0–100`);
  }
  if (cfg.subjects !== null && cfg.subjects !== undefined && !Array.isArray(cfg.subjects)) {
    problems.push(`${label}: subjects must be a list`);
  }
  if (Array.isArray(cfg.subjects)) {
    const sum = cfg.subjects.reduce((a, r) => a + (Number.isInteger(r?.marks) ? r.marks : 0), 0);
    if (Number.isInteger(cfg.questionCount) && sum !== cfg.questionCount) {
      problems.push(`${label}: subject marks sum (${sum}) != questionCount (${cfg.questionCount})`);
    }
  }
  if (cfg.patternLabel !== null && cfg.patternLabel !== undefined
      && !['verified', 'last-verified-18th', 'circular-based'].includes(cfg.patternLabel)) {
    problems.push(`${label}: patternLabel '${cfg.patternLabel}' is not a known value`);
  }
  if (cfg.patternStatus !== null && cfg.patternStatus !== undefined
      && !PATTERN_STATUSES.includes(cfg.patternStatus)) {
    problems.push(`${label}: patternStatus '${cfg.patternStatus}' is not a known value`);
  }
  if (cfg.patternStatus === 'verified' && cfg.negativeMarkingVerified === false) {
    problems.push(`${label}: patternStatus 'verified' cannot carry an unverified penalty`);
  }
  if (cfg.applicableCycle !== null && cfg.applicableCycle !== undefined && typeof cfg.applicableCycle !== 'string') {
    problems.push(`${label}: applicableCycle must be a string`);
  }
  return problems;
}

/** Validate the whole seed (schema + referential integrity + the
 * all-draft guard). Returns problem strings; empty = valid. */
export function validateSeed(seed) {
  const problems = [];
  if (!seed || typeof seed !== 'object') return ['seed is not an object'];
  const cats = seed.jobCategories ?? {};
  const exams = seed.jobExams ?? {};
  if (Object.keys(cats).length !== 10) problems.push(`expected 10 jobCategories, found ${Object.keys(cats).length}`);
  if (Object.keys(exams).length !== 15) problems.push(`expected 15 jobExams, found ${Object.keys(exams).length}`);
  const orders = [];
  for (const [id, doc] of Object.entries(cats)) {
    const label = `jobCategories/${id}`;
    if (typeof doc.nameBn !== 'string' || doc.nameBn.length === 0) problems.push(`${label}: nameBn missing`);
    if (typeof doc.nameEn !== 'string' || doc.nameEn.length === 0) problems.push(`${label}: nameEn missing`);
    if (!Number.isInteger(doc.order) || doc.order < 1 || doc.order > 10) problems.push(`${label}: order must be an integer 1–10`);
    orders.push(doc.order);
    if (!Array.isArray(doc.hubSlugs) || doc.hubSlugs.length === 0) problems.push(`${label}: hubSlugs must be a non-empty list`);
    for (const hub of doc.hubSlugs ?? []) {
      if (!JOB_EXAM_SLUGS.includes(hub)) problems.push(`${label}: hubSlugs lists unknown exam '${hub}'`);
    }
    if (!['active', 'inactive'].includes(doc.status)) problems.push(`${label}: status '${doc.status}' is not active/inactive`);
  }
  if (new Set(orders).size !== orders.length) problems.push('jobCategories: duplicate order values');
  if ([...orders].sort((a, b) => a - b).join(',') !== '1,2,3,4,5,6,7,8,9,10') {
    problems.push('jobCategories: orders are not exactly 1–10');
  }
  for (const [id, doc] of Object.entries(exams)) {
    const label = `jobExams/${id}`;
    if (doc.slug !== id) problems.push(`${label}: slug '${doc.slug}' != doc id '${id}'`);
    if (!JOB_CATEGORY_SLUGS.includes(doc.categoryId)) problems.push(`${label}: categoryId '${doc.categoryId}' is not a known category`);
    if (![1, 2, 3].includes(doc.tier)) problems.push(`${label}: tier must be 1, 2 or 3`);
    // All-draft guard: the seed must NEVER create a Published exam.
    if (doc.status !== 'draft') problems.push(`${label}: status must be 'draft' (seed never publishes)`);
    if (!DRAFT_REVIEW_STATES.includes(doc.reviewStatus)) {
      problems.push(`${label}: reviewStatus '${doc.reviewStatus}' is not a draft state (seed never publishes)`);
    }
    if (!PATTERN_STATUSES.includes(doc.patternStatus)) {
      problems.push(`${label}: patternStatus '${doc.patternStatus}' is not a known value`);
    }
    if (doc.applicableCycle !== null && doc.applicableCycle !== undefined && typeof doc.applicableCycle !== 'string') {
      problems.push(`${label}: applicableCycle must be a string`);
    }
    if (!['defined', 'scope_pending'].includes(doc.scopeStatus)) {
      problems.push(`${label}: scopeStatus '${doc.scopeStatus}' is not defined/scope_pending`);
    }
    if (!Array.isArray(doc.rulesConfigHistory)) problems.push(`${label}: rulesConfigHistory must be a list`);
    problems.push(...validateRulesConfig(doc.rulesConfig, label));
  }
  for (const slug of JOB_EXAM_SLUGS) {
    const owners = Object.values(cats).filter((c) => (c.hubSlugs ?? []).includes(slug));
    if (owners.length === 0) problems.push(`exam '${slug}' belongs to no category`);
    if (owners.length > 1) problems.push(`exam '${slug}' belongs to ${owners.length} categories`);
    if (!(slug in exams)) problems.push(`exam '${slug}' has no seed doc`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Planning (pure — unit-tested)                                       */
/* ------------------------------------------------------------------ */

/** Canonical JSON (sorted keys) for cheap equality checks. */
export function canon(v) {
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

/** Compare one existing doc against its seed doc, ignoring the
 * timestamp fields (createdAt/updatedAt change on every apply).
 * Returns 'unchanged' | 'modified'. */
export function compareDoc(existing, seedDoc) {
  const strip = (o) => {
    const c = { ...o };
    delete c.createdAt;
    delete c.updatedAt;
    return c;
  };
  return canon(strip(existing)) === canon(strip(seedDoc)) ? 'unchanged' : 'modified';
}

/** Plan an apply: for each seed doc, decide new / unchanged /
 * modified. `existing` is { collection: { id: doc } }. */
export function planSeedApply(existing, seed) {
  const plan = { toCreate: [], toUpdate: [], unchanged: [], problems: [] };
  for (const collection of ['jobCategories', 'jobExams']) {
    for (const [id, doc] of Object.entries(seed[collection] ?? {})) {
      const found = existing[collection]?.[id];
      if (!found) plan.toCreate.push({ collection, id, doc });
      else if (compareDoc(found, doc) === 'unchanged') plan.unchanged.push({ collection, id });
      else plan.toUpdate.push({ collection, id, doc, existing: found });
    }
  }
  return plan;
}

/** Convert a seed doc's ISO timestamp strings to Dates (Firestore
 * Timestamps on write). createdAt/updatedAt are set to `now` when the
 * seed carries no value; callers preserve an existing createdAt. */
export function seedDocFields(doc, now) {
  const out = { ...doc };
  out.createdAt = doc.createdAt ? new Date(doc.createdAt) : now;
  out.updatedAt = now;
  return out;
}

/** History entry the importer appends when a re-apply changes a
 * rulesConfig (mirrors the rules' history requirement). */
export function seedHistoryEntry({ before, after, now }) {
  return {
    changedAt: now,
    changedBy: 'seed-import',
    reason: 'Seed re-apply (apply-job-seed.mjs)',
    before: before ?? null,
    after: after ?? null,
    sourceCircular: null,
  };
}

/* ------------------------------------------------------------------ */
/* Emulator target guard (Step 6 fold-in, ChatGPT P1-06)              */
/* ------------------------------------------------------------------ */

/** Pure check: is `hostPort` a loopback emulator address? Returns a
 * problem string, or null when the target is safe. The importers
 * refuse ANY non-loopback target — a --emulator value pointing at a
 * production host (or any LAN/WAN address) is a live-write attempt,
 * not an emulator run. The old behaviour (any host:port accepted as
 * long as --emulator was passed) was a real foot-gun: the REST URL
 * is plain http://host/v1/projects/... and nothing verified the host
 * was an emulator at all. */
export function emulatorTargetProblem(hostPort) {
  if (typeof hostPort !== 'string' || hostPort.trim().length === 0) {
    return 'emulator target is empty — pass --emulator host:port';
  }
  let host = hostPort.trim();
  // IPv6 bracket form: [::1]:8080
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    if (end < 0) return `emulator target '${hostPort}' is not a valid host:port`;
    host = host.slice(1, end);
  } else {
    host = host.split(':')[0];
  }
  const lower = host.toLowerCase();
  if (lower === 'localhost' || lower === '::1') return null;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return null;
  if (lower.endsWith('googleapis.com') || lower.includes('firestore')) {
    return `REFUSED: '${hostPort}' looks like a production Firestore endpoint, not a local emulator`;
  }
  return `REFUSED: emulator target '${hostPort}' is not a loopback address — the importer writes only to a local emulator (127.0.0.1 / localhost / ::1)`;
}

/** Live probe: does `rest` answer like a Firestore emulator? Lists
 * the jobCategories collection with the emulator's admin bypass
 * (Bearer 'owner'): the emulator answers 200; a production endpoint
 * answers 401 (the token is not a real credential) and a dead port
 * throws. Fails closed — a probe failure refuses the run before any
 * read or write. NOTE: the probe lists a REAL collection, not the
 * database root or a made-up name — the emulator 404s the root and
 * 400s unknown collections even with the bypass, while a real
 * collection list is 200 when empty. */
export async function probeEmulator(rest) {
  try {
    const res = await fetch(`${rest}/jobCategories?pageSize=1`, {
      headers: { Authorization: 'Bearer owner' },
    });
    return res.ok;
  } catch {
    return false;
  }
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
  const res = await fetch(`${rest}${path}`, {
    method,
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
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
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function usage() {
  return [
    'Usage:',
    '  node scripts/apply-job-seed.mjs --dry-run [--emulator [host:port]] [--seed <path>]',
    '  node scripts/apply-job-seed.mjs --apply --emulator [host:port] [--allow-modify] [--seed <path>] [--audit <path>]',
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
    : resolve(__dirname, `../team/job-categories-exams-seed-apply-audit-${new Date().toISOString().slice(0, 10)}.json`);

  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  const problems = validateSeed(seed);
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
  const existing = { jobCategories: {}, jobExams: {} };
  for (const collection of ['jobCategories', 'jobExams']) {
    for (const id of Object.keys(seed[collection])) {
      const doc = await getDoc(rest, collection, id);
      if (doc) existing[collection][id] = doc;
    }
  }
  const plan = planSeedApply(existing, seed);
  console.log(`Plan (emulator ${emuHost}): ${plan.toCreate.length} new, ${plan.unchanged.length} unchanged, ${plan.toUpdate.length} modified.`);
  for (const c of plan.toCreate) console.log(`  NEW       ${c.collection}/${c.id}`);
  for (const u of plan.toUpdate) console.log(`  MODIFIED  ${u.collection}/${u.id}`);
  for (const u of plan.unchanged) console.log(`  unchanged ${u.collection}/${u.id}`);

  if (dryRun) {
    console.log('Dry run — nothing written.');
    return 0;
  }
  if (plan.toUpdate.length > 0 && !allowModify) {
    console.error(`REFUSED: ${plan.toUpdate.length} doc(s) would be modified. Re-run with --allow-modify (createdAt + rulesConfigHistory are preserved; a changed rulesConfig gets one appended history entry).`);
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
      // Preserve history; append ONE entry if the config changed.
      const oldHistory = Array.isArray(u.existing.rulesConfigHistory) ? u.existing.rulesConfigHistory : [];
      if (canon(u.existing.rulesConfig ?? null) !== canon(u.doc.rulesConfig ?? null)) {
        fields.rulesConfigHistory = [...oldHistory, seedHistoryEntry({ before: u.existing.rulesConfig ?? null, after: u.doc.rulesConfig ?? null, now })];
      } else {
        fields.rulesConfigHistory = oldHistory;
      }
      await patchDoc(rest, u.collection, u.id, fields);
      results.updated.push(`${u.collection}/${u.id}`);
    } catch (e) {
      results.errors.push(`${u.collection}/${u.id}: ${e.message}`);
    }
  }

  // Post-apply read-back comparison.
  const mismatches = [];
  for (const collection of ['jobCategories', 'jobExams']) {
    for (const id of Object.keys(seed[collection])) {
      const back = await getDoc(rest, collection, id);
      if (!back) {
        mismatches.push(`${collection}/${id}: missing after apply`);
        continue;
      }
      const expected = seedDocFields(seed[collection][id], now);
      if (collection === 'jobExams' && back.rulesConfigHistory !== undefined) {
        // History is append-only by design; compare everything else.
        expected.rulesConfigHistory = back.rulesConfigHistory;
      }
      expected.createdAt = back.createdAt;
      expected.updatedAt = back.updatedAt;
      if (canon(back) !== canon(expected)) mismatches.push(`${collection}/${id}: read-back differs from seed`);
    }
  }

  const audit = {
    tool: 'scripts/apply-job-seed.mjs',
    target: `emulator ${emuHost}`,
    at: now.toISOString(),
    seed: seedPath,
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
