// Read-only live check: does config/appVersion exist? (Step 20 Phase 1, gate 0.2)
// GETs ONE document via Firestore REST using the Firebase CLI login on this
// machine. Token lives only in memory; prints the HTTP status only.
// Expected: 404 = doc absent = version gate failing open by design.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const PROJECT_ID = 'eduvelto';
const URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config/appVersion`;

const store = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
const require = createRequire(import.meta.url);
const api = require('/home/hatch/workspace/eduorbit/phase2-project/node_modules/firebase-tools/lib/api.js');
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: store.tokens?.refresh_token,
    client_id: api.clientId(),
    client_secret: api.clientSecret(),
  }),
});
const body = await res.json();
if (!body.access_token) throw new Error('Token exchange failed');
const doc = await fetch(URL, { headers: { Authorization: `Bearer ${body.access_token}` } });
console.log(`config/appVersion: HTTP ${doc.status}`);
