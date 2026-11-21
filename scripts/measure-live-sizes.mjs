// Eduvelto — LIVE read-only measurement (TEMPORARY, do not commit).
//
// Measures the exact JSON payload a visitor's browser downloads when
// opening /library, /directory and /exam, using the PUBLIC web config
// as an UNAUTHENTICATED client (exactly like a real visitor).
// READ-ONLY: no writes, no deletes, no auth, no config changes.
// Run: node scripts/measure-live-sizes.mjs   (from phase2-project/)

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { writeFileSync } from 'node:fs';

const firebaseConfig = {
  apiKey: 'AIzaSyBWtzXrFraiHJsKjsO2YCr_BK7GYlLBkr8',
  authDomain: 'eduvelto.firebaseapp.com',
  projectId: 'eduvelto',
  storageBucket: 'eduvelto.firebasestorage.app',
  messagingSenderId: '781355434811',
  appId: '1:781355434811:web:87a77ac0d45bb9bc5a6d1e',
};

const byteLen = (s) => Buffer.byteLength(s, 'utf8');

async function measure(db, label, col, extraWhere = []) {
  const snap = await getDocs(query(collection(db, col), where('reviewStatus', '==', 'Published'), ...extraWhere));
  let bytes = 0;
  let maxDoc = 0;
  for (const d of snap.docs) {
    const b = byteLen(JSON.stringify({ id: d.id, ...d.data() }));
    bytes += b;
    if (b > maxDoc) maxDoc = b;
  }
  const out = { label, collection: col, docs: snap.size, bytes, mib: +(bytes / 1048576).toFixed(3), avgBytes: snap.size ? Math.round(bytes / snap.size) : 0, maxDocBytes: maxDoc };
  console.log(`${label}: ${out.docs} docs, ${out.bytes} bytes (${out.mib} MiB), avg ${out.avgBytes} B/doc, max ${out.maxDocBytes} B`);
  return out;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = {};
  results.books = await measure(db, 'LIVE books', 'books');
  results.directory = await measure(db, 'LIVE directory', 'educationDirectory');
  results.quizzes = await measure(db, 'LIVE quizzes', 'quizzes');
  // First 50 quizzes by doc-ID order — the size of exam-list page 1.
  const qSnap = await getDocs(query(collection(db, 'quizzes'), where('reviewStatus', '==', 'Published')));
  const sorted = qSnap.docs.map((d) => ({ id: d.id, bytes: byteLen(JSON.stringify({ id: d.id, ...d.data() })) })).sort((a, b) => a.id.localeCompare(b.id));
  const page1 = sorted.slice(0, 50).reduce((s, d) => s + d.bytes, 0);
  const page1Books = qSnap.docs.length; // unused, clarity
  results.quizPage1of50 = { docs: Math.min(50, sorted.length), bytes: page1, mib: +(page1 / 1048576).toFixed(3) };
  console.log(`LIVE quiz page 1 (first 50 by doc ID): ${page1} bytes (${results.quizPage1of50.mib} MiB)`);
  // First 50 books — library page 1 size.
  const bSnap = await getDocs(query(collection(db, 'books'), where('reviewStatus', '==', 'Published')));
  const bSorted = bSnap.docs.map((d) => ({ id: d.id, bytes: byteLen(JSON.stringify({ id: d.id, ...d.data() })) })).sort((a, b) => a.id.localeCompare(b.id));
  const bPage1 = bSorted.slice(0, 50).reduce((s, d) => s + d.bytes, 0);
  results.bookPage1of50 = { docs: Math.min(50, bSorted.length), bytes: bPage1, mib: +(bPage1 / 1048576).toFixed(3) };
  console.log(`LIVE book page 1 (first 50 by doc ID): ${bPage1} bytes (${results.bookPage1of50.mib} MiB)`);
  results.generatedAt = new Date().toISOString();
  writeFileSync('/tmp/live-sizes.json', JSON.stringify(results, null, 2));
  console.log('SAVED: /tmp/live-sizes.json');
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
