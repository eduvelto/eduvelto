// Eduvelto — LIVE follow-up probes (TEMPORARY, do not commit).
// Tests candidate query shapes that might avoid composite indexes, and
// re-tests count() in isolation. READ-ONLY.

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter,
  getDocs, getCountFromServer, documentId,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBWtzXrFraiHJsKjsO2YCr_BK7GYlLBkr8',
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
  } catch (e) {
    console.log(`  ${id} FAIL ${desc} -> ${(e.code || '')} ${String(e.message).slice(0, 250)}`);
  }
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const books = collection(db, 'books');
  const pub = where('reviewStatus', '==', 'Published');

  console.log('PROBES:');
  await run('P1', 'count() books alone, first thing', async () => {
    const s = await getCountFromServer(query(books, pub));
    return { count: s.data().count };
  });
  await run('P2', 'count() books again (2nd call)', async () => {
    const s = await getCountFromServer(query(books, pub));
    return { count: s.data().count };
  });
  await run('T1a', "equality x2, NO orderBy, limit(50) [page 1]", async () => {
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('T1b', 'T1a page 2 via startAfter (no orderBy)', async () => {
    const s1 = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), limit(50)));
    const last = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), limit(50), startAfter(last)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('T1c', 'T1 3-page walk: unique ids?', async () => {
    const q = (c) => query(books, pub, where('educationType', '==', 'Higher'), limit(50), ...(c ? [startAfter(c)] : []));
    const p1 = await getDocs(q(null));
    const p2 = await getDocs(q(p1.docs[p1.docs.length - 1]));
    const p3 = await getDocs(q(p2.docs[p2.docs.length - 1]));
    const ids = [...p1.docs, ...p2.docs, ...p3.docs].map((d) => d.id);
    return { pages: [p1.size, p2.size, p3.size], unique: new Set(ids).size };
  });
  await run('T2', "equality x2 + orderBy(documentId()) + limit(50)", async () => {
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), orderBy(documentId()), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('T3', "equality x1 + orderBy(documentId()) + limit(50)", async () => {
    const s = await getDocs(query(books, pub, orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('T5', 'equality x3 (type+class+dept), NO orderBy, limit(50)', async () => {
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), where('classLevel', '==', '1st Year'), where('department', '==', 'English'), limit(50)));
    return { docs: s.size };
  });
  await run('T6', 'equality x2 (type+class), NO orderBy, limit(50)', async () => {
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), where('classLevel', '==', '1st Year'), limit(50)));
    return { docs: s.size };
  });
  await run('T7', "directory: equality x5, NO orderBy, limit(50)", async () => {
    const dir = collection(db, 'educationDirectory');
    const s = await getDocs(query(dir, pub, where('type', '==', 'Higher'), where('board', '==', 'National University'), where('program', '==', 'Honours'), where('classLevel', '==', '1st Year'), where('department', '==', 'English'), limit(50)));
    return { docs: s.size };
  });
  await run('T8', "quizzes: equality x2 (type+kind), NO orderBy, limit(50)", async () => {
    const qz = collection(db, 'quizzes');
    const s = await getDocs(query(qz, pub, where('educationType', '==', 'Higher'), where('kind', '==', 'mcq'), limit(50)));
    return { docs: s.size };
  });
  console.log('DONE');
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
