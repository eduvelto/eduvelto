// Eduvelto — V-1 LIVE probes for the cascading-filter query shapes.
// READ-ONLY. Tests every distinct educationDirectory query the cascade
// (src/lib/content.ts cascadeToDirectoryFilters) can produce, against
// LIVE Firestore, with orderBy(documentId()) + limit(50) + startAfter
// pagination — the shapes the earlier probes (T1–T7) did NOT cover are:
//   - where('type', 'in', ['SSC','HSC']) (stream=general, level=All),
//     alone and with +program, with pagination;
//   - 4 equality filters + orderBy(documentId()) (Higher + program +
//     classLevel + department).
// Run: node scripts/probe-cascade-queries.mjs

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter,
  getDocs, documentId,
} from 'firebase/firestore';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// apiKey is public-by-design (see src/firebase-config.ts); read it from
// there instead of hardcoding a copy that can drift.
const __dirname = dirname(fileURLToPath(import.meta.url));
const configSrc = readFileSync(join(__dirname, '..', 'src', 'firebase-config.ts'), 'utf8');
const apiKey = configSrc.match(/apiKey:\s*'([^']+)'/)?.[1];
if (!apiKey) throw new Error('apiKey not found in src/firebase-config.ts');

const firebaseConfig = {
  apiKey,
  authDomain: 'eduvelto.firebaseapp.com',
  projectId: 'eduvelto',
  storageBucket: 'eduvelto.firebasestorage.app',
  messagingSenderId: '781355434811',
  appId: '1:781355434811:web:87a77ac0d45bb9bc5a6d1e',
};

async function run(id, desc, fn) {
  try {
    const out = await fn();
    console.log(`  ${id} OK   ${desc} -> ${JSON.stringify(out)}`);
    return { id, ok: true, out };
  } catch (e) {
    console.log(`  ${id} FAIL ${desc} -> ${(e.code || '')} ${String(e.message).slice(0, 250)}`);
    return { id, ok: false, error: `${e.code || ''} ${e.message}`.slice(0, 300) };
  }
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const dir = collection(db, 'educationDirectory');
  const pub = where('reviewStatus', '==', 'Published');
  const results = [];

  console.log('CASCADE PROBES (live, read-only):');
  results.push(await run('C0', 'no filters, page 1 (stream All)', async () => {
    const s = await getDocs(query(dir, pub, orderBy(documentId()), limit(50)));
    return { docs: s.size };
  }));
  results.push(await run('C1', "Higher + Honours + 3rd Year + English + orderBy(docId)", async () => {
    const s = await getDocs(query(dir, pub, where('type', '==', 'Higher'), where('program', '==', 'Honours'), where('classLevel', '==', '3rd Year'), where('department', '==', 'English'), orderBy(documentId()), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  }));
  results.push(await run('C2a', "type IN [SSC,HSC] + orderBy(docId), page 1", async () => {
    const s = await getDocs(query(dir, pub, where('type', 'in', ['SSC', 'HSC']), orderBy(documentId()), limit(50)));
    const types = new Set(s.docs.map((d) => d.data().type));
    return { docs: s.size, types: [...types].sort() };
  }));
  results.push(await run('C2b', 'C2 page 2 via startAfter (expect 13, all SSC/HSC)', async () => {
    const q = (c) => query(dir, pub, where('type', 'in', ['SSC', 'HSC']), orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    const p1 = await getDocs(q(null));
    const p2 = await getDocs(q(p1.docs[p1.docs.length - 1]));
    const ids = [...p1.docs, ...p2.docs].map((d) => d.id);
    const types = new Set([...p1.docs, ...p2.docs].map((d) => d.data().type));
    return { pages: [p1.size, p2.size], total: ids.length, unique: new Set(ids).size, types: [...types].sort() };
  }));
  results.push(await run('C3', "type IN [SSC,HSC] + program Science + orderBy(docId)", async () => {
    const s = await getDocs(query(dir, pub, where('type', 'in', ['SSC', 'HSC']), where('program', '==', 'Science'), orderBy(documentId()), limit(50)));
    const types = new Set(s.docs.map((d) => d.data().type));
    return { docs: s.size, types: [...types].sort() };
  }));
  results.push(await run('C5', "Madrasa + Dakhil + Dakhil + orderBy(docId)", async () => {
    const s = await getDocs(query(dir, pub, where('type', '==', 'Madrasa'), where('program', '==', 'Dakhil'), where('classLevel', '==', 'Dakhil'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  }));
  results.push(await run('C6', "Technical + Bmt + Bmt + orderBy(docId)", async () => {
    const s = await getDocs(query(dir, pub, where('type', '==', 'Technical'), where('program', '==', 'Bmt'), where('classLevel', '==', 'Bmt'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  }));
  results.push(await run('C7', "SSC + classLevel SSC + program Science + orderBy(docId)", async () => {
    const s = await getDocs(query(dir, pub, where('type', '==', 'SSC'), where('classLevel', '==', 'SSC'), where('program', '==', 'Science'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  }));
  results.push(await run('C8', "Higher + Honours + 1st Year + orderBy(docId), 2-page walk", async () => {
    const q = (c) => query(dir, pub, where('type', '==', 'Higher'), where('program', '==', 'Honours'), where('classLevel', '==', '1st Year'), orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    const p1 = await getDocs(q(null));
    const p2 = await getDocs(q(p1.docs[p1.docs.length - 1]));
    const p3 = await getDocs(q(p2.docs[p2.docs.length - 1]));
    const ids = [...p1.docs, ...p2.docs, ...p3.docs].map((d) => d.id);
    return { pages: [p1.size, p2.size, p3.size], total: ids.length, unique: new Set(ids).size };
  }));

  const failed = results.filter((r) => !r.ok);
  console.log(failed.length === 0 ? 'PROBES: ALL OK' : `PROBES: ${failed.length} FAILED (${failed.map((r) => r.id).join(', ')})`);
  if (failed.length) process.exit(1);
}

main().catch((e) => { console.error('PROBE ERROR:', e); process.exit(1); });
