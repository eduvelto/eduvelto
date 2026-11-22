// Backfill scripted public user IDs (owner order 22 Nov 2026:
// "sobar id hobe eduvelto0001 thake" — everyone's ID runs
// sequentially from eduvelto0001).
//
// Assigns `publicIdNumber` to every users doc that lacks one, in
// REGISTRATION order (createdAt ascending; users without createdAt go
// last), then seeds the counter `counters/publicUserIds` { next } to
// one past the highest number in use. Users that already have a valid
// number keep it; the missing ones get the smallest unused positive
// integers. Idempotent — re-running assigns only the still-missing.
//
// Runs with the OWNER's Firebase CLI token via Firestore REST, so the
// rules apply: it needs the public-ID rules change deployed (users
// owner-update allowlist + counters match) — until then --apply fails
// with permission-denied. The dry-run only READS (owner can read all
// users), so it works as soon as the quota allows.
//
// DO NOT RUN while the daily Firestore quota is exhausted (HTTP 429
// stop) — the reads are tiny (4 users now) but any live read is
// forbidden until the quota resets (~14:00 Dhaka).
//
//   node scripts/backfill-public-ids.mjs [--dry-run] [--apply]
//   --dry-run : print the assignment table + counter value, write nothing (default)
//   --apply   : write the assignments + seed/update the counter
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

const PROJECT_ID = 'eduvelto';
const REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;

let accessToken = null;
async function getAccessToken() {
  if (accessToken) return accessToken;
  const store = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
  const refreshToken = store.tokens?.refresh_token;
  if (!refreshToken) throw new Error('No refresh_token in the Firebase CLI configstore');
  const require = createRequire(import.meta.url);
  const api = require('/home/hatch/workspace/eduorbit/phase2-project-deploy-main/node_modules/firebase-tools/lib/api.js');
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
  if (!body.access_token) throw new Error('Token exchange failed (no access_token returned)');
  accessToken = body.access_token;
  return accessToken;
}

async function fsFetch(path, { method = 'GET', body = null } = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${REST}${path}`, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(`Firestore ${method} ${path} -> HTTP ${res.status} ${b?.error?.status ?? ''} ${b?.error?.message ?? ''}`);
  }
  return res.json();
}

function dec(v) {
  if (v === undefined || v === null) return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  return null;
}

async function listUsers() {
  const users = [];
  let pageToken;
  for (;;) {
    const qs = new URLSearchParams({ pageSize: '500', orderBy: '__name__' });
    if (pageToken) qs.set('pageToken', pageToken);
    const body = await fsFetch(`/users?${qs.toString()}`);
    for (const d of body.documents ?? []) {
      const uid = d.name.split('/').pop();
      const f = d.fields ?? {};
      const createdAt = 'createdAt' in f ? dec(f.createdAt) : null;
      const n = 'publicIdNumber' in f ? dec(f.publicIdNumber) : null;
      users.push({
        uid,
        email: 'email' in f ? dec(f.email) : '',
        displayName: 'displayName' in f ? dec(f.displayName) : '',
        createdAtMillis: typeof createdAt === 'number' && Number.isFinite(createdAt) ? createdAt : null,
        publicIdNumber: typeof n === 'number' && Number.isInteger(n) && n >= 1 ? n : null,
      });
    }
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return users;
}

// Same assignment logic as src/lib/publicId.ts assignMissingPublicIds
// (the script is plain JS and cannot import the TS module).
function assignMissing(users) {
  const used = new Set();
  for (const u of users) if (u.publicIdNumber != null) used.add(u.publicIdNumber);
  const missing = users.filter((u) => u.publicIdNumber == null);
  missing.sort((a, b) => {
    if (a.createdAtMillis == null && b.createdAtMillis == null) return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0;
    if (a.createdAtMillis == null) return 1;
    if (b.createdAtMillis == null) return -1;
    if (a.createdAtMillis !== b.createdAtMillis) return a.createdAtMillis - b.createdAtMillis;
    return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0;
  });
  const assignments = [];
  let candidate = 1;
  for (const u of missing) {
    while (used.has(candidate)) candidate += 1;
    assignments.push({ uid: u.uid, publicIdNumber: candidate });
    used.add(candidate);
    candidate += 1;
  }
  let max = 0;
  for (const n of used) if (n > max) max = n;
  return { assignments, next: max + 1 };
}

async function main() {
  const users = await listUsers();
  console.log(`users: ${users.length} (already numbered: ${users.filter((u) => u.publicIdNumber != null).length})`);
  const { assignments, next } = assignMissing(users);
  for (const a of assignments) {
    const u = users.find((x) => x.uid === a.uid);
    console.log(`  ${u?.displayName ?? ''} <${u?.email ?? ''}> -> eduvelto${String(a.publicIdNumber).padStart(4, '0')}`);
  }
  console.log(`counter next: ${next}`);
  if (DRY_RUN) {
    console.log(`DRY-RUN: wrote nothing. Re-run with --apply to write ${assignments.length} assignment(s) + seed the counter.`);
    return;
  }
  for (const a of assignments) {
    await fsFetch(`/users/${a.uid}?updateMask.fieldPaths=publicIdNumber`, {
      method: 'PATCH',
      body: { fields: { publicIdNumber: { integerValue: String(a.publicIdNumber) } } },
    });
    console.log(`  wrote users/${a.uid} publicIdNumber=${a.publicIdNumber}`);
  }
  // Seed or update the counter.
  let counterExists = true;
  try {
    await fsFetch('/counters/publicUserIds');
  } catch (e) {
    if (/404/.test(e.message)) counterExists = false;
    else throw e;
  }
  const now = new Date().toISOString();
  if (counterExists) {
    await fsFetch('/counters/publicUserIds?updateMask.fieldPaths=next&updateMask.fieldPaths=updatedAt', {
      method: 'PATCH',
      body: { fields: { next: { integerValue: String(next) }, updatedAt: { timestampValue: now } } },
    });
    console.log(`  updated counters/publicUserIds next=${next}`);
  } else {
    await fsFetch('/counters?documentId=publicUserIds', {
      method: 'POST',
      body: { fields: { next: { integerValue: String(next) }, updatedAt: { timestampValue: now } } },
    });
    console.log(`  created counters/publicUserIds next=${next}`);
  }
  console.log(`APPLIED: ${assignments.length} assignment(s), counter next=${next}`);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
