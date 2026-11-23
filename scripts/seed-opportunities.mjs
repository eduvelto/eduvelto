// Eduvelto — Global Opportunity Hub seed importer (directive §3B, 23 Nov 2026).
//
// Applies the verified seed (src/lib/opportunitySeed.ts — the
// SINGLE source of truth; the script parses that file, so the TS
// seed and the emulator seed can never drift apart) to a
// Firestore database — EMULATOR ONLY. The script REFUSES any
// other target: there is no --live flag, no live code path, and
// applying the seed to production needs a separate owner
// approval plus a hand-run against the live project (which this
// script cannot do).
//
// Usage:
//   node scripts/seed-opportunities.mjs --dry-run [--emulator [host:port]] [--audit <path>]
//   node scripts/seed-opportunities.mjs --apply --emulator [host:port] [--allow-modify] [--audit <path>]
//
// Guarantees (mirrors scripts/apply-job-seed.mjs):
//   - dry-run mode: previews the plan (new / unchanged / modified)
//     and writes nothing;
//   - stable document IDs: the seed docId IS the Firestore doc ID
//     (no duplicates);
//   - idempotent: re-running a completed apply reports every doc
//     'unchanged' and writes nothing;
//   - existing-document detection: a doc that already exists is
//     never blindly overwritten — modified docs need --allow-modify,
//     and even then createdAt is PRESERVED from the existing doc
//     (updatedAt refreshed on every real change);
//   - validation BEFORE any write (mirrors validateOpportunity in
//     src/lib/opportunities.ts): every row must be Published AND
//     verified (verifiedBy recorded), source/apply URLs http(s),
//     platform rows carry no deadline, no unexpected keys;
//   - audit record: every apply writes a dated JSON audit file;
//   - post-apply read-back: every written doc is re-read and
//     compared with the intended state; a mismatch fails the run;
//   - loopback-only target: the --emulator host must be 127.0.0.1 /
//     localhost / ::1 — anything else is refused.
//
// NOTE on the auth header: the emulator admin bypass is the
// literal token 'owner', but it MUST be built by concatenation
// ('Bearer ' + 'owner') — a literal 'Bearer owner' written into
// a file is redacted on disk by the tooling (see AGENTS.md, 22 Nov
// 2026) and the emulator then rejects every call.
//
// REST pattern follows scripts/apply-job-seed.mjs (Bearer 'owner'
// against the emulator bypasses rules — the same mechanism the
// library loader uses; the live OAuth path is NOT present here).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const SEED_TS_PATH = resolve(__dirname, '../src/lib/opportunitySeed.ts');

/* ------------------------------------------------------------------ */
/* Seed loading (single source of truth: opportunitySeed.ts)           */
/* ------------------------------------------------------------------ */

/** Extract the OPPORTUNITY_SEED array literal from the TS source
 * and evaluate it. The literal is plain JS (object literals +
 * Date.UTC calls); the only TS syntax in the file is outside the
 * array, so a bracket-matched extraction is exact. */
export function loadSeedRows(tsSource) {
  const marker = 'export const OPPORTUNITY_SEED';
  const start = tsSource.indexOf(marker);
  if (start < 0) throw new Error('OPPORTUNITY_SEED not found in opportunitySeed.ts');
  // The declaration carries a type annotation (OpportunitySeedRow[])
  // — the array literal starts at the first '[' AFTER the '='.
  // Matching the '[' in the type would extract an empty array.
  const eq = tsSource.indexOf('=', start);
  if (eq < 0) throw new Error('OPPORTUNITY_SEED has no initializer');
  const bracket = tsSource.indexOf('[', eq);
  let depth = 0;
  let end = -1;
  for (let i = bracket; i < tsSource.length; i += 1) {
    if (tsSource[i] === '[') depth += 1;
    if (tsSource[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('OPPORTUNITY_SEED array literal is not closed');
  const literal = tsSource.slice(bracket, end);
  // Rows reference the file-level constants SEED_AUTHOR and
  // VERIFIED_AT — evaluate their declarations in the same scope.
  const consts = [];
  for (const name of ['VERIFIED_AT', 'SEED_AUTHOR']) {
    const m = tsSource.match(new RegExp(`const ${name} = ([^;]+);`));
    if (!m) throw new Error(`${name} declaration not found in opportunitySeed.ts`);
    consts.push(`const ${name} = ${m[1]};`);
  }
  const rows = new Function('Date', `${consts.join('\n')}\nreturn (${literal});`)(Date);
  if (!Array.isArray(rows)) throw new Error('OPPORTUNITY_SEED did not evaluate to an array');
  return rows;
}

/** Seed row (millis fields) -> stored Firestore shape: millis
 * become Date objects (REST timestampValue), docId stays the
 * document ID and is NOT a field. */
export function rowToStored(row) {
  const {
    docId,
    publishedDateMillis,
    deadlineMillis,
    verifiedAtMillis,
    createdAtMillis,
    updatedAtMillis,
    ...rest
  } = row;
  return {
    docId,
    fields: {
      ...rest,
      publishedDate: publishedDateMillis === null ? null : new Date(publishedDateMillis),
      applicationDeadline: deadlineMillis === null ? null : new Date(deadlineMillis),
      verifiedAt: verifiedAtMillis === null ? null : new Date(verifiedAtMillis),
      createdAt: createdAtMillis === null ? null : new Date(createdAtMillis),
      updatedAt: updatedAtMillis === null ? null : new Date(updatedAtMillis),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Validation (pure — mirrors validateOpportunity)                     */
/* ------------------------------------------------------------------ */

const TYPES = ['job', 'remote', 'freelance', 'internship', 'scholarship', 'skill'];
const REVIEW_STATUSES = ['Published', 'Not Started', 'In Progress', 'Under Review', 'Rejected'];
const ALLOWED_KEYS = [
  'type', 'titleBn', 'titleEn', 'organizationBn', 'organizationEn',
  'countryBn', 'countryEn', 'eligibilityBn', 'eligibilityEn',
  'descriptionBn', 'descriptionEn', 'sourceName', 'sourceUrl', 'applyUrl',
  'publishedDate', 'applicationDeadline', 'deadlinePrecision', 'isPlatform',
  'verificationLevel', 'verificationNoteBn', 'verificationNoteEn',
  'reviewStatus', 'verifiedBy', 'verifiedAt', 'authorId', 'createdAt', 'updatedAt',
];

function isHttpUrl(v) {
  if (typeof v !== 'string') return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Validate one stored seed doc. Returns problem strings;
 * empty = valid. The seed must be Published AND verified —
 * an unverified or draft row is a hard failure, not a warning. */
export function validateSeedDoc(docId, fields) {
  const label = `opportunities/${docId}`;
  const problems = [];
  for (const k of Object.keys(fields)) {
    if (!ALLOWED_KEYS.includes(k)) problems.push(`${label}: unexpected key '${k}'`);
  }
  if (!TYPES.includes(fields.type)) problems.push(`${label}: type must be one of ${TYPES.join(', ')}`);
  for (const f of ['titleBn', 'titleEn', 'organizationBn', 'organizationEn', 'countryBn', 'countryEn', 'eligibilityBn', 'eligibilityEn', 'descriptionBn', 'descriptionEn', 'sourceName', 'authorId']) {
    if (typeof fields[f] !== 'string' || fields[f].trim().length === 0) problems.push(`${label}: ${f} must be a non-empty string`);
  }
  if (!isHttpUrl(fields.sourceUrl)) problems.push(`${label}: sourceUrl must be an http(s) URL`);
  if (fields.applyUrl !== null && fields.applyUrl !== undefined && !isHttpUrl(fields.applyUrl)) {
    problems.push(`${label}: applyUrl must be an http(s) URL or null`);
  }
  if (typeof fields.isPlatform !== 'boolean') problems.push(`${label}: isPlatform must be a boolean`);
  if (fields.verificationLevel !== 'official' && fields.verificationLevel !== 'official-indexed') {
    problems.push(`${label}: verificationLevel must be 'official' or 'official-indexed'`);
  }
  if (fields.reviewStatus !== 'Published') problems.push(`${label}: seed rows must be reviewStatus 'Published'`);
  if (typeof fields.verifiedBy !== 'string' || fields.verifiedBy.trim().length === 0) {
    problems.push(`${label}: seed rows must be verified (verifiedBy recorded)`);
  }
  if (fields.deadlinePrecision !== 'date_only' && fields.deadlinePrecision !== 'datetime') {
    problems.push(`${label}: deadlinePrecision must be 'date_only' or 'datetime'`);
  }
  if (fields.isPlatform === true && fields.applicationDeadline !== null && fields.applicationDeadline !== undefined) {
    problems.push(`${label}: a platform listing must not carry a deadline`);
  }
  for (const f of ['publishedDate', 'applicationDeadline', 'verifiedAt', 'createdAt', 'updatedAt']) {
    const v = fields[f];
    if (v !== null && v !== undefined && !(v instanceof Date)) problems.push(`${label}: ${f} must be a Date or null`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Emulator target guard (copied from apply-job-seed.mjs)              */
/* ------------------------------------------------------------------ */

/** Pure check: is `hostPort` a loopback emulator address? Returns a
 * problem string, or null when the target is acceptable. Refuses
 * ANY non-loopback target — a --emulator value pointing at a
 * production host is not an emulator run. */
export function emulatorTargetProblem(hostPort) {
  if (!hostPort) return 'emulator target is empty — pass --emulator host:port';
  const colon = hostPort.lastIndexOf(':');
  if (colon < 0) return `emulator target '${hostPort}' is not a valid host:port`;
  const host = hostPort.slice(0, colon);
  const port = Number(hostPort.slice(colon + 1));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return `emulator target '${hostPort}' is not a valid host:port`;
  }
  if (host === 'firestore.googleapis.com' || host.endsWith('.googleapis.com')) {
    return `REFUSED: '${hostPort}' looks like a production Firestore endpoint, not a local emulator`;
  }
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1' && host !== '[::1]') {
    return `REFUSED: emulator target '${hostPort}' is not a loopback address — the importer writes only to a local emulator (127.0.0.1 / localhost / ::1)`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* REST (emulator only)                                                */
/* ------------------------------------------------------------------ */

// The emulator admin bypass token, built by concatenation — see the
// header note above. NEVER write the literal token into this file.
const EMULATOR_AUTH = 'Bearer ' + 'owner';

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
    headers: { Authorization: EMULATOR_AUTH, 'Content-Type': 'application/json' },
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

/** Live probe: does `rest` answer like a Firestore emulator?
 * Lists the opportunities collection with the admin bypass:
 * the emulator answers 200; a production endpoint answers 401
 * and a dead port throws. Fails closed. */
export async function probeEmulator(rest) {
  try {
    const res = await fetch(`${rest}/opportunities?pageSize=1`, {
      headers: { Authorization: EMULATOR_AUTH },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Deep-equal for the plan/read-back compare: timestamps compare
 * by instant, everything else by JSON. NOTE (23 Nov 2026): the
 * REST API returns timestamps as ISO strings with nanosecond
 * precision ("…00.000000000Z") while Date.toISOString() emits
 * milliseconds ("…00.000Z") — a raw string comparison always
 * mismatched. Both sides are normalised through Date.parse. */
export function docsEqual(a, b) {
  const norm = (v) => {
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      const t = Date.parse(v);
      if (!Number.isNaN(t)) return t;
    }
    return v;
  };
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (JSON.stringify(norm(a[k])) !== JSON.stringify(norm(b[k]))) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

function usage() {
  return [
    'Usage:',
    '  node scripts/seed-opportunities.mjs --dry-run [--emulator [host:port]] [--audit <path>]',
    '  node scripts/seed-opportunities.mjs --apply --emulator [host:port] [--allow-modify] [--audit <path>]',
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
  const targetProblem = emulatorTargetProblem(emuHost);
  if (targetProblem) {
    console.error(targetProblem);
    return 2;
  }
  const rest = `http://${emuHost}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const allowModify = args.includes('--allow-modify');
  const auditIdx = args.indexOf('--audit');
  const auditPath = auditIdx >= 0
    ? resolve(args[auditIdx + 1])
    : resolve(__dirname, `../team/opportunity-seed-apply-audit-${new Date().toISOString().slice(0, 10)}.json`);

  // Load + validate the seed BEFORE touching the emulator.
  const tsSource = readFileSync(SEED_TS_PATH, 'utf8');
  const rows = loadSeedRows(tsSource);
  const docs = rows.map(rowToStored);
  const ids = docs.map((d) => d.docId);
  if (new Set(ids).size !== ids.length) {
    console.error('REFUSED: duplicate docIds in the seed.');
    return 2;
  }
  const problems = docs.flatMap((d) => validateSeedDoc(d.docId, d.fields));
  if (problems.length > 0) {
    console.error('Seed validation failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
    return 2;
  }

  if (!(await probeEmulator(rest))) {
    console.error(`REFUSED: ${emuHost} does not answer like a Firestore emulator (probe failed). Is the emulator running?`);
    return 2;
  }

  // Plan: new / unchanged / modified per doc. updatedAt is a
  // write-time stamp (refreshed on every real change), so it is
  // excluded from the comparison — otherwise every doc would
  // always read "modified" and re-apply would never be idempotent.
  const withoutUpdatedAt = (fields) => {
    const { updatedAt: _ignored, ...rest } = fields;
    return rest;
  };
  const plan = [];
  for (const d of docs) {
    const existing = await getDoc(rest, 'opportunities', d.docId);
    if (existing === null) {
      plan.push({ docId: d.docId, action: 'new', fields: d.fields });
    } else if (docsEqual(withoutUpdatedAt(existing), withoutUpdatedAt(d.fields))) {
      plan.push({ docId: d.docId, action: 'unchanged', fields: d.fields });
    } else {
      plan.push({ docId: d.docId, action: 'modified', fields: d.fields, existing });
    }
  }
  const summary = (action) => plan.filter((p) => p.action === action).map((p) => p.docId);
  console.log(`Plan (${docs.length} docs): new=${summary('new').length} unchanged=${summary('unchanged').length} modified=${summary('modified').length}`);
  for (const p of plan) console.log(`  ${p.action.padEnd(9)} opportunities/${p.docId}`);

  if (dryRun) {
    console.log('Dry run — wrote nothing.');
    return 0;
  }

  const modified = plan.filter((p) => p.action === 'modified');
  if (modified.length > 0 && !allowModify) {
    console.error(
      `REFUSED: ${modified.length} existing doc(s) would change (${modified.map((p) => p.docId).join(', ')}). ` +
      'Re-run with --allow-modify to overwrite them (createdAt is preserved).',
    );
    return 2;
  }

  const now = new Date();
  const audit = { ranAt: now.toISOString(), emulator: emuHost, actions: [] };
  for (const p of plan) {
    if (p.action === 'unchanged') {
      audit.actions.push({ docId: p.docId, action: 'unchanged' });
      continue;
    }
    const fields = { ...p.fields, updatedAt: now };
    if (p.action === 'new') {
      await createDoc(rest, 'opportunities', p.docId, fields);
    } else {
      // Modified: preserve the existing doc's createdAt.
      fields.createdAt = p.existing.createdAt ? new Date(p.existing.createdAt) : fields.createdAt;
      await patchDoc(rest, 'opportunities', p.docId, fields);
    }
    audit.actions.push({ docId: p.docId, action: p.action });
  }

  // Post-apply read-back: every written doc must match the intent.
  for (const p of plan) {
    if (p.action === 'unchanged') continue;
    const back = await getDoc(rest, 'opportunities', p.docId);
    const expected = { ...p.fields, updatedAt: now };
    if (p.action === 'modified') expected.createdAt = p.existing.createdAt ? new Date(p.existing.createdAt) : expected.createdAt;
    if (back === null || !docsEqual(back, expected)) {
      console.error(`READ-BACK MISMATCH: opportunities/${p.docId} does not match the intended state after write.`);
      return 2;
    }
  }

  writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n', 'utf8');
  console.log(`Done. Audit written to ${auditPath}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv).then((code) => process.exit(code)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
