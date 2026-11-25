// Eduvelto — Firestore backup export (Day 1 script, 7-day master schedule).
//
// READ-ONLY EXPORT. This script NEVER writes to Firestore: it only issues
// GET (list) requests and writes JSON files to local disk. There is no
// delete, no set, no update anywhere in this file.
//
// Usage:
//   npm run backup                       # emulator (default 127.0.0.1:8080)
//   npm run backup -- --emulator 127.0.0.1:8080
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run backup
//   npm run backup -- --production       # LIVE Firestore — owner approval only
//   npm run backup -- --collections books,questions   # subset only
//   npm run backup -- --out-dir /path/to/backups      # default: <repo>/backups
//
// Output (per run):
//   backups/YYYY-MM-DD/<collection>.json   one file per collection
//   backups/YYYY-MM-DD/manifest.json      counts, timestamps, source, totals
// The backups/ directory is gitignored (see .gitignore) — a backup holds
// user data and must never be committed; share it by private link only.
//
// How it connects (reuses the repo's existing patterns — no new credentials):
//   * Emulator: plain REST against the local Firestore emulator, exactly
//     like scripts/verify-emulator-cascade.mjs and the --emulator mode of
//     scripts/load-library-content.mjs (default host 127.0.0.1:8080,
//     firebase.json emulators.firestore.port).
//   * Production (--production): the Firebase CLI login already on this
//     machine (~/.config/configstore/firebase-tools.json refresh token,
//     exchanged for an access token), exactly like
//     ~/workspace/eduorbit/backups/export-full-rest.mjs. No service-account
//     file is read, created or needed; no token is ever printed or logged.
//
// Collections (Day 1 brief): books, questions, syllabus, orders,
// donations, liveExams. These are the six named collections; use
// --collections to export a subset or any other collection by name.
//
// Quota honesty (Spark: 50,000 reads/day): every exported document costs
// one read. A full export of a large database can eat a big share of a
// day's quota — run exports off-peak, and prefer the emulator for tests.
//
// Exit code: 0 when every collection exported, 1 on any failure. A failed
// collection writes no file for that collection, and the manifest records
// the failure instead of pretending the export is complete.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = 'eduvelto';
const DEFAULT_COLLECTIONS = ['books', 'questions', 'syllabus', 'orders', 'donations', 'liveExams'];
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
const LIVE_REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const args = process.argv.slice(2);
const PRODUCTION = args.includes('--production');
const emuIdx = args.indexOf('--emulator');
const outIdx = args.indexOf('--out-dir');
const colIdx = args.indexOf('--collections');

const EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ??
  (emuIdx >= 0 && args[emuIdx + 1] && !args[emuIdx + 1].startsWith('--')
    ? args[emuIdx + 1]
    : emuIdx >= 0
      ? DEFAULT_EMULATOR_HOST
      : null);

if (PRODUCTION && EMULATOR_HOST) {
  console.error('ERROR: --production and --emulator/FIRESTORE_EMULATOR_HOST conflict. Pick one.');
  process.exit(1);
}

const HOST = PRODUCTION ? null : (EMULATOR_HOST ?? DEFAULT_EMULATOR_HOST);
const BASE = PRODUCTION
  ? LIVE_REST
  : `http://${HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const COLLECTIONS =
  colIdx >= 0 && args[colIdx + 1]
    ? args[colIdx + 1].split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_COLLECTIONS;

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const OUT_ROOT =
  outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : join(REPO_ROOT, 'backups');

// --- Firestore REST value decoding (same shape as verify-emulator-cascade.mjs) ---
function dec(f) {
  if (f === undefined || f === null) return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return parseInt(f.integerValue, 10);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('nullValue' in f) return null;
  if ('timestampValue' in f) return f.timestampValue;
  if ('bytesValue' in f) return f.bytesValue;
  if ('referenceValue' in f) return f.referenceValue;
  if ('geoPointValue' in f) return { latitude: f.geoPointValue.latitude, longitude: f.geoPointValue.longitude };
  if ('arrayValue' in f) return (f.arrayValue.values ?? []).map(dec);
  if ('mapValue' in f) {
    const out = {};
    for (const [k, v] of Object.entries(f.mapValue.fields ?? {})) out[k] = dec(v);
    return out;
  }
  return undefined;
}

// Production auth only: Firebase CLI refresh token -> access token.
// (Same approach as ~/workspace/eduorbit/backups/export-full-rest.mjs.
// The token lives in memory only and is never printed.)
async function getAccessToken() {
  const store = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
  const refreshToken = store.tokens?.refresh_token;
  if (!refreshToken) throw new Error('No refresh_token in the Firebase CLI configstore — run `firebase login` first');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iQErv5BtcGFpJf1WzUu4ZQ',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error('Token exchange failed (no access_token returned)');
  return body.access_token;
}

async function listCollection(collection, headers) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${collection}?pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GET ${collection} -> HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const body = await res.json();
    for (const d of body.documents ?? []) {
      const id = d.name.split('/').pop();
      const fields = {};
      for (const [k, v] of Object.entries(d.fields ?? {})) fields[k] = dec(v);
      docs.push({ id, ...fields });
    }
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return docs;
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`,
    iso: d.toISOString(),
  };
}

async function main() {
  const { date, time, iso } = stamp();
  const outDir = join(OUT_ROOT, date);
  mkdirSync(outDir, { recursive: true });

  const headers = PRODUCTION
    ? { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' }
    : { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

  console.log(`Firestore backup export — ${PRODUCTION ? 'PRODUCTION (live)' : `emulator ${HOST}`} — ${iso}`);
  console.log(`Collections: ${COLLECTIONS.join(', ')}`);
  console.log(`Output: ${outDir}/`);

  const manifest = {
    exportedAt: iso,
    source: PRODUCTION ? 'production' : `emulator:${HOST}`,
    projectId: PROJECT_ID,
    collections: {},
    totalDocs: 0,
    failures: [],
  };
  let failed = false;

  for (const collection of COLLECTIONS) {
    try {
      const docs = await listCollection(collection, headers);
      const file = join(outDir, `${collection}.json`);
      writeFileSync(file, JSON.stringify({ collection, exportedAt: iso, count: docs.length, docs }, null, 2));
      manifest.collections[collection] = { count: docs.length, file: `${collection}.json` };
      manifest.totalDocs += docs.length;
      console.log(`  ${collection}: ${docs.length} docs -> ${collection}.json`);
    } catch (err) {
      failed = true;
      manifest.failures.push({ collection, error: String(err.message ?? err) });
      console.error(`  ${collection}: FAILED — ${err.message}`);
    }
  }

  const manifestFile = join(outDir, 'manifest.json');
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  console.log(`Manifest: ${manifestFile}`);
  console.log(
    `Done: ${manifest.totalDocs} docs across ${Object.keys(manifest.collections).length}/${COLLECTIONS.length} collections` +
      (PRODUCTION ? ' (quota cost: 1 read per exported document)' : ' (emulator — no production quota used)'),
  );
  if (failed) {
    console.error('BACKUP INCOMPLETE — see manifest failures. Do not treat this as a full backup.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Backup failed: ${err.message}`);
  process.exit(1);
});
