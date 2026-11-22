// Eduvelto — class stats writer (fix/read-usage, 22 Nov 2026).
//
// Writes the loader-maintained stats docs (one per class level) that the
// dashboard + class index read instead of the whole book/quiz lists.
// Single writer — writes BOTH halves at once, no merge needed.
//
// WHEN TO RUN: right after the ~14:00 Dhaka quota reset, when the 50k
// daily reads are fresh — NEVER in the evening after a day of testing.
// Cost: ~1,623 live reads (609 books + 1,014 quizzes listed) + 5 writes.
// The stats docs are what ACTIVATES the read-reduction fix live: until
// they exist, the deployed dashboard falls back to the old full-list
// fetch (same reads as before). Run this once after deploying the fix,
// then the loaders keep stats fresh on every full re-run.
//
// PLACEMENT (zero rules change): docs live in `leaderboardSnapshots` as
// `classStats-<slug>` (see scripts/build-class-stats.mjs). Write needs a
// moderator (owner) identity — the Firebase CLI login on this machine.
//
// Auth: reuses the Firebase CLI login already on this machine
// (~/.config/configstore/firebase-tools.json + the CLI's own OAuth
// client). The refresh token / client secret are read at runtime and
// NEVER printed or written anywhere. The access token lives only in memory.
//
// Usage:
//   node scripts/write-class-stats.mjs [--dry-run] [--emulator [host:port]] [--log <path>]
//   --dry-run : list + aggregate + print the 5 stats docs, write nothing.
//   --emulator: write to a local Firestore EMULATOR (default 127.0.0.1:8080)
//               instead of live Firestore — verification only, never live.

import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateClassStats, writeStatsHalf } from './build-class-stats.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const DEFAULT_REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const DEFAULT_LOG_PATH = join(__dirname, 'write-class-stats-log.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const emuIdx = args.indexOf('--emulator');
const EMULATOR_HOST = emuIdx >= 0 ? (args[emuIdx + 1] && !args[emuIdx + 1].startsWith('--') ? args[emuIdx + 1] : '127.0.0.1:8080') : null;
const logIdx = args.indexOf('--log');
const LOG_PATH = logIdx >= 0 ? args[logIdx + 1] : DEFAULT_LOG_PATH;
const REST = EMULATOR_HOST
  ? `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  : DEFAULT_REST;

// ---------------------------------------------------------------------------
// Firestore REST value encoding (same shape as load-library-content.mjs)
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
  const token = EMULATOR_HOST ? 'owner' : await getAccessToken();
  const res = await fetch(`${REST}${path}`, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retryAuth && !EMULATOR_HOST) {
    accessToken = null;
    return fsFetch(path, { method, body, retryAuth: false });
  }
  return res;
}

async function listAll(collection) {
  let out = [];
  let pageToken = '';
  do {
    const url = `/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fsFetch(url);
    if (!res.ok) throw new Error(`LIST ${collection} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = await res.json();
    out = out.concat(j.documents ?? []);
    pageToken = j.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const t0 = Date.now();
  console.log(DRY_RUN ? 'DRY RUN — listing only, writing nothing.' : (EMULATOR_HOST ? `EMULATOR ${EMULATOR_HOST} — writing stats to the emulator.` : 'LIVE — writing stats to production Firestore.'));
  const bookDocs = await listAll('books');
  const quizDocs = await listAll('quizzes');
  const books = bookDocs.map((d) => ({
    educationType: dec(d.fields.educationType) ?? '',
    classLevel: dec(d.fields.classLevel) ?? '',
    department: dec(d.fields.department) ?? '',
    questionCount: dec(d.fields.questionCount) ?? 0,
    chapterCount: dec(d.fields.chapterCount) ?? 0,
  }));
  const quizzes = quizDocs.map((d) => ({
    id: d.name.split('/').pop(),
    title: dec(d.fields.title) ?? '',
    educationType: dec(d.fields.educationType) ?? '',
    classLevel: dec(d.fields.classLevel) ?? '',
    department: dec(d.fields.department) ?? '',
    questionCount: dec(d.fields.questionCount) ?? 0,
  }));
  console.log(`LISTED: ${books.length} books + ${quizzes.length} quizzes (${books.length + quizzes.length} reads).`);
  const stats = aggregateClassStats(books, quizzes);
  for (const s of stats) {
    console.log(`  ${s.slug}: books=${s.bookCount} quizzes=${s.quizCount} totalQ=${s.totalQuestions} chapters=${s.totalChapters} subjects=${s.subjects.length}`);
  }
  if (DRY_RUN) {
    console.log('DRY RUN complete — nothing written.');
    return;
  }
  const results = {};
  for (const stat of stats) {
    results[stat.slug] = await writeStatsHalf({ fsFetch, enc, dec }, stat, 'both');
    console.log(`STATS: ${stat.slug} ${results[stat.slug]}`);
  }
  const summary = {
    at: new Date().toISOString(),
    emulator: EMULATOR_HOST ?? null,
    booksListed: books.length,
    quizzesListed: quizzes.length,
    readsSpent: books.length + quizzes.length,
    results,
    elapsedSec: Math.round((Date.now() - t0) / 1000),
  };
  writeFileSync(LOG_PATH, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
