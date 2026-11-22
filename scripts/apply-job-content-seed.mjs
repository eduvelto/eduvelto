/**
 * Eduvelto — Job Preparation CONTENT seed importer (Step 6).
 *
 * Applies team/job-content-seed.json (23 jobSubjects; jobChapters /
 * jobTopics / jobLessons empty) to a Firestore database — EMULATOR
 * ONLY. The script REFUSES any other target: there is no --live
 * flag, no live code path, and applying the seed to production needs
 * a separate owner approval plus this same script run by hand against
 * the live project (which this script cannot do).
 *
 * Usage:
 *   node scripts/apply-job-content-seed.mjs --dry-run [--emulator [host:port]] [--seed <path>]
 *   node scripts/apply-job-content-seed.mjs --apply --emulator [host:port] [--allow-modify] [--seed <path>] [--audit <path>]
 *
 * Guarantees (same as the Step 5 importer, scripts/apply-job-seed.mjs):
 *   - dry-run mode: previews the plan (new / unchanged / modified)
 *     and writes nothing;
 *   - stable document IDs: the seed key IS the doc ID
 *     (`{examSlug}__{subjectSlug}` — no duplicates);
 *   - idempotent: re-running a completed apply reports every doc
 *     'unchanged' and writes nothing;
 *   - existing-document detection: a doc that already exists is
 *     never blindly overwritten — modified docs need --allow-modify,
 *     and even then createdAt is PRESERVED from the existing doc
 *     (content docs carry no rulesConfigHistory — there is no config
 *     here to version);
 *   - schema + referential-integrity validation BEFORE any write
 *     (every subject's examSlug is one of the 4 verified exams; the
 *     doc ID matches examSlug + slug; orders 1..N contiguous per
 *     exam; marks sum to the exam's questionCount; every subject
 *     carries a syllabusSource);
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
 * Why a SECOND importer instead of extending apply-job-seed.mjs:
 * that script is written for exactly one seed (jobCategories +
 * jobExams) with its own schema, collections and rulesConfigHistory
 * handling; extending it would force a two-schema dispatch through
 * validateSeed / planSeedApply / main and a combined audit, making
 * the first importer incoherent. One script = one seed keeps both
 * readable. The generic pure helpers (canon, compareDoc,
 * seedDocFields) are imported from the Step 5 script instead of
 * being copied; only the small REST plumbing is duplicated, so the
 * Step 5 script and its tests stay untouched.
 *
 * REST pattern follows scripts/load-library-content.mjs (Bearer
 * 'owner' against the emulator bypasses rules — the same mechanism
 * the library loader uses; the live OAuth path is NOT present here).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canon, compareDoc, seedDocFields } from './apply-job-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const SEED_PATH = resolve(__dirname, '../team/job-content-seed.json');

/** Exams with a verified subject list (Step 6) — the ONLY exams a
 * subject may belong to. it-professional is scope_pending (owner
 * decision 13.8) and the other 9 exams have a null rulesConfig, so
 * subjects under any of them are rejected. Source of truth:
 * src/lib/jobExams.ts JOB_RULES_CONFIGS (questionCount per exam). */
export const SYLLABUS_READY_EXAMS = ['bcs', 'bank', 'primary-teacher', 'ntrca'];
export const JOB_CONTENT_QUESTION_COUNTS = {
  bcs: 200,
  bank: 100,
  'primary-teacher': 90,
  ntrca: 100,
};
export const DRAFT_REVIEW_STATES = ['Not Started', 'In Progress', 'Under Review'];
export const JOB_CONTENT_COLLECTIONS = ['jobSubjects', 'jobChapters', 'jobTopics', 'jobLessons'];

/* ------------------------------------------------------------------ */
/* Validation (pure — unit-tested)                                     */
/* ------------------------------------------------------------------ */

/** Validate the whole content seed (schema + referential integrity +
 * the all-draft guard). Returns problem strings; empty = valid. */
export function validateContentSeed(seed) {
  const problems = [];
  if (!seed || typeof seed !== 'object') return ['seed is not an object'];
  const subjects = seed.jobSubjects ?? {};
  if (typeof subjects !== 'object' || Array.isArray(subjects)) {
    return ['jobSubjects must be a map of doc id -> doc'];
  }
  if (Object.keys(subjects).length !== 23) {
    problems.push(`expected 23 jobSubjects, found ${Object.keys(subjects).length}`);
  }
  // The three deeper collections must be present and EMPTY in Step 6
  // (no verified chapter/topic/lesson lists exist — nothing invented).
  for (const collection of ['jobChapters', 'jobTopics', 'jobLessons']) {
    if (!Array.isArray(seed[collection])) {
      problems.push(`${collection} must be a list (empty in Step 6)`);
    } else if (seed[collection].length !== 0) {
      problems.push(`${collection} must be empty in Step 6 (no verified content yet), found ${seed[collection].length} doc(s)`);
    }
  }
  const perExam = {};
  for (const [id, doc] of Object.entries(subjects)) {
    const label = `jobSubjects/${id}`;
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
      problems.push(`${label}: doc is not a map`);
      continue;
    }
    if (!SYLLABUS_READY_EXAMS.includes(doc.examSlug)) {
      problems.push(`${label}: examSlug '${doc.examSlug}' has no verified subject list (null rulesConfig or scope_pending)`);
    }
    if (typeof doc.slug !== 'string' || doc.slug.length === 0) {
      problems.push(`${label}: slug missing`);
    } else if (id !== `${doc.examSlug}__${doc.slug}`) {
      problems.push(`${label}: doc id '${id}' != examSlug__slug ('${doc.examSlug}__${doc.slug}')`);
    }
    if (typeof doc.nameBn !== 'string' || doc.nameBn.length === 0) problems.push(`${label}: nameBn missing`);
    if (typeof doc.nameEn !== 'string' || doc.nameEn.length === 0) problems.push(`${label}: nameEn missing`);
    if (!Number.isInteger(doc.order) || doc.order < 1) problems.push(`${label}: order must be a positive integer`);
    if (!Number.isInteger(doc.marks) || doc.marks < 1) problems.push(`${label}: marks must be a positive integer`);
    if (typeof doc.syllabusSource !== 'string' || doc.syllabusSource.length === 0) {
      problems.push(`${label}: syllabusSource missing (every subject needs its official source)`);
    }
    // All-draft guard: the seed must NEVER create a Published or
    // verified subject (0 verified teachers — teacher review first).
    if (doc.status !== 'draft') problems.push(`${label}: status must be 'draft' (seed never publishes)`);
    if (!DRAFT_REVIEW_STATES.includes(doc.reviewStatus)) {
      problems.push(`${label}: reviewStatus '${doc.reviewStatus}' is not a draft state (seed never publishes)`);
    }
    if (doc.authorId !== null && doc.authorId !== undefined) {
      problems.push(`${label}: authorId must be null (no author yet)`);
    }
    if (doc.verifiedBy !== null && doc.verifiedBy !== undefined) {
      problems.push(`${label}: verifiedBy must be null (nothing verified yet)`);
    }
    if (doc.verifiedAt !== null && doc.verifiedAt !== undefined) {
      problems.push(`${label}: verifiedAt must be null (nothing verified yet)`);
    }
    if (doc.applicableCycle !== null && doc.applicableCycle !== undefined && typeof doc.applicableCycle !== 'string') {
      problems.push(`${label}: applicableCycle must be a string`);
    }
    if (SYLLABUS_READY_EXAMS.includes(doc.examSlug)) {
      (perExam[doc.examSlug] ??= []).push(doc);
    }
  }
  for (const examSlug of SYLLABUS_READY_EXAMS) {
    const list = perExam[examSlug] ?? [];
    const orders = list.map((d) => d.order).sort((a, b) => a - b);
    if (orders.join(',') !== Array.from({ length: list.length }, (_, i) => i + 1).join(',')) {
      problems.push(`exam '${examSlug}': orders are not exactly 1..${list.length}`);
    }
    const slugs = list.map((d) => d.slug);
    if (new Set(slugs).size !== slugs.length) {
      problems.push(`exam '${examSlug}': duplicate subject slug`);
    }
    const sum = list.reduce((a, d) => a + (Number.isInteger(d.marks) ? d.marks : 0), 0);
    if (sum !== JOB_CONTENT_QUESTION_COUNTS[examSlug]) {
      problems.push(`exam '${examSlug}': subject marks sum (${sum}) != questionCount (${JOB_CONTENT_QUESTION_COUNTS[examSlug]})`);
    }
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Planning (pure — unit-tested)                                       */
/* ------------------------------------------------------------------ */

/** Plan an apply: for each seed doc, decide new / unchanged /
 * modified. `existing` is { collection: { id: doc } }. The empty
 * collections (jobChapters / jobTopics / jobLessons) contribute no
 * docs in Step 6. */
export function planContentSeedApply(existing, seed) {
  const plan = { toCreate: [], toUpdate: [], unchanged: [], problems: [] };
  for (const collection of JOB_CONTENT_COLLECTIONS) {
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
    '  node scripts/apply-job-content-seed.mjs --dry-run [--emulator [host:port]] [--seed <path>]',
    '  node scripts/apply-job-content-seed.mjs --apply --emulator [host:port] [--allow-modify] [--seed <path>] [--audit <path>]',
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
  const rest = `http://${emuHost}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const seedIdx = args.indexOf('--seed');
  const seedPath = seedIdx >= 0 ? resolve(args[seedIdx + 1]) : SEED_PATH;
  const allowModify = args.includes('--allow-modify');
  const auditIdx = args.indexOf('--audit');
  const auditPath = auditIdx >= 0
    ? resolve(args[auditIdx + 1])
    : resolve(__dirname, `../team/job-content-seed-apply-audit-${new Date().toISOString().slice(0, 10)}.json`);

  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  const problems = validateContentSeed(seed);
  if (problems.length > 0) {
    console.error('Seed validation FAILED — nothing was written:');
    for (const p of problems) console.error('  - ' + p);
    return 1;
  }

  // Read existing docs (emulator).
  const existing = { jobSubjects: {}, jobChapters: {}, jobTopics: {}, jobLessons: {} };
  for (const collection of JOB_CONTENT_COLLECTIONS) {
    const docs = seed[collection];
    if (!docs || Array.isArray(docs)) continue;
    for (const id of Object.keys(docs)) {
      const doc = await getDoc(rest, collection, id);
      if (doc) existing[collection][id] = doc;
    }
  }
  const plan = planContentSeedApply(existing, seed);
  console.log(`Plan (emulator ${emuHost}): ${plan.toCreate.length} new, ${plan.unchanged.length} unchanged, ${plan.toUpdate.length} modified.`);
  for (const c of plan.toCreate) console.log(`  NEW       ${c.collection}/${c.id}`);
  for (const u of plan.toUpdate) console.log(`  MODIFIED  ${u.collection}/${u.id}`);
  for (const u of plan.unchanged) console.log(`  unchanged ${u.collection}/${u.id}`);

  if (dryRun) {
    console.log('Dry run — nothing written.');
    return 0;
  }
  if (plan.toUpdate.length > 0 && !allowModify) {
    console.error(`REFUSED: ${plan.toUpdate.length} doc(s) would be modified. Re-run with --allow-modify (createdAt is preserved; no history field exists for content docs).`);
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
  for (const collection of JOB_CONTENT_COLLECTIONS) {
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

  const audit = {
    tool: 'scripts/apply-job-content-seed.mjs',
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
