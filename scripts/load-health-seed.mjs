// Eduvelto — Health seed loader (Phase 2, Health v1).
//
// Loads scripts/health-seed.json into live Firestore (project "eduvelto"):
//   medicines/{id}   — 24 common medicines (no dosage amounts, ever)
//   diseases/{id}    — 20 common diseases
//   facilities/{id}  — 4 public hospitals (seed only, source noted)
// Every doc is written as reviewStatus "Under Review" and STAYS there:
// nothing is ever marked Published by this loader — a qualified
// professional must review health content before it is published.
//
// Auth: reuses the Firebase CLI login already on this machine
// (~/.config/configstore/firebase-tools.json + the CLI's own OAuth client),
// the same pattern as scripts/load-library-content.mjs. The refresh token
// / client secret are read at runtime and NEVER printed or written anywhere.
// The access token lives only in memory.
//
// RE-RUNNABLE: document IDs come from the JSON `id` fields, so re-running
// after the seed is edited updates the same docs in place (create-or-patch).
// Safe to re-run any time.
//
// Usage:
//   node scripts/load-health-seed.mjs [--dry-run]
//   --dry-run : read the seed, print the plan, write nothing.

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(__dirname, 'health-seed.json');
const PROJECT_ID = 'eduvelto';
const REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Firestore REST value encoding
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Auth (CLI login, in-memory only)
// ---------------------------------------------------------------------------
let accessToken = null;
async function getAccessToken() {
  if (accessToken) return accessToken;
  const store = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
  const refreshToken = store.tokens?.refresh_token;
  if (!refreshToken) throw new Error('No refresh_token in the Firebase CLI configstore — run `firebase login` first.');
  const require = createRequire(import.meta.url);
  const api = require(join(__dirname, '..', 'node_modules', 'firebase-tools', 'lib', 'api.js'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: api.clientId(),
      client_secret: api.clientSecret(),
    }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(body).slice(0, 200)}`);
  accessToken = body.access_token;
  return accessToken;
}

async function fsFetch(path, { method = 'GET', body = null, retryAuth = true } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${REST}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retryAuth) {
    accessToken = null;
    return fsFetch(path, { method, body, retryAuth: false });
  }
  return res;
}

async function getDoc(collection, id) {
  const res = await fsFetch(`/${collection}/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const out = {};
  for (const [k, v] of Object.entries(data.fields ?? {})) out[k] = dec(v);
  return out;
}

// Create-or-patch a document. reviewStatus is FORCED to "Under Review":
// this loader never publishes health content.
async function upsertDoc(collection, id, fields) {
  const doc = { ...fields, reviewStatus: 'Under Review' };
  const existing = await getDoc(collection, id);
  const body = { fields: Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, enc(v)])) };
  if (!existing) {
    const res = await fsFetch(`/${collection}?documentId=${encodeURIComponent(id)}`, { method: 'POST', body });
    if (!res.ok) throw new Error(`POST ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return 'created';
  }
  const mask = Object.keys(doc).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fsFetch(`/${collection}/${id}?${mask}`, { method: 'PATCH', body });
  if (!res.ok) throw new Error(`PATCH ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return 'updated';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  const plan = [
    ['medicines', seed.medicines ?? []],
    ['diseases', seed.diseases ?? []],
    ['facilities', seed.facilities ?? []],
  ];
  const total = plan.reduce((s, [, rows]) => s + rows.length, 0);
  console.log(`PLAN: ${total} health docs (all reviewStatus "Under Review", never Published):`);
  for (const [coll, rows] of plan) console.log(`  - ${coll}: ${rows.length}`);
  if (DRY_RUN) {
    console.log('DRY RUN complete — nothing written.');
    return;
  }
  const now = new Date();
  let created = 0;
  let updated = 0;
  for (const [coll, rows] of plan) {
    for (const row of rows) {
      const { id, ...fields } = row;
      if (!id) throw new Error(`Missing id in ${coll} row: ${JSON.stringify(row).slice(0, 120)}`);
      // Safety: a medicine row must never carry a dosage amount.
      if (coll === 'medicines' && /\d+\s*(mg|ml)\b/i.test(JSON.stringify(fields))) {
        throw new Error(`REFUSED: medicine ${id} appears to carry a dosage amount — remove it first.`);
      }
      const res = await upsertDoc(coll, id, { ...fields, createdAt: now, updatedAt: now });
      if (res === 'created') created++;
      else updated++;
    }
    console.log(`  ${coll}: done`);
  }
  console.log(`DONE: ${created} created, ${updated} updated — all "Under Review".`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
