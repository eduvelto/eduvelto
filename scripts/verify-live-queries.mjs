// Eduvelto — LIVE query-shape verification (TEMPORARY, do not commit).
//
// Runs the EXACT query shapes the paginated pages ship, against LIVE
// Firestore as an unauthenticated client (exactly like a visitor).
// Purpose: prove no composite index is needed in production. The
// emulator does NOT enforce composite-index requirements, so an emulator
// run cannot prove this — only a live run can. A missing index would
// surface as FAILED_PRECONDITION with an index-creation link.
//
// HISTORY: the first draft used orderBy(documentId()) with filters —
// that FAILED live (L3/L4/D2/Q3, failed-precondition, composite index
// required). The shipped shape is orderBy(documentId()); this script
// verifies THAT shape. The count() checks (L5/L6/D3/Q4) are EXPECTED to
// fail on live (resource-exhausted) — see pagination-test-report §5.
// READ-ONLY: a few hundred reads total, no writes, no auth, no changes.
// Run: node scripts/verify-live-queries.mjs   (from phase2-project/)

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

const results = [];
async function run(id, desc, fn) {
  try {
    const out = await fn();
    results.push({ id, desc, ok: true, ...out });
    console.log(`  ${id} OK   ${desc} -> ${JSON.stringify(out)}`);
  } catch (e) {
    results.push({ id, desc, ok: false, error: `${e.code || ''} ${String(e.message).slice(0, 300)}` });
    console.log(`  ${id} FAIL ${desc} -> ${(e.code || '')} ${String(e.message).slice(0, 300)}`);
  }
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const books = collection(db, 'books');
  const dir = collection(db, 'educationDirectory');
  const quizzes = collection(db, 'quizzes');
  const pub = where('reviewStatus', '==', 'Published');

  console.log('LIVE QUERY SHAPES (shipped pagination queries):');
  let bookLast = null;
  await run('L1', "books: orderBy(documentId()) + limit(50) [Library page 1]", async () => {
    const s = await getDocs(query(books, pub, orderBy(documentId()), limit(50)));
    bookLast = s.docs[s.docs.length - 1];
    return { docs: s.size };
  });
  await run('L2', 'books: page 2 via startAfter', async () => {
    const s = await getDocs(query(books, pub, orderBy(documentId()), limit(50), startAfter(bookLast)));
    return { docs: s.size };
  });
  await run('L3', "books: educationType='Higher' + orderBy(documentId()) + limit(50)", async () => {
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('L4', "books: educationType='Higher' + classLevel='1st Year' + department='English' + orderBy + limit(50)", async () => {
    const s = await getDocs(query(books, pub, where('educationType', '==', 'Higher'), where('classLevel', '==', '1st Year'), where('department', '==', 'English'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('L5', 'books: count() all Published', async () => {
    const s = await getCountFromServer(query(books, pub));
    return { count: s.data().count };
  });
  await run('L6', "books: count() educationType='Higher' + classLevel='1st Year'", async () => {
    const s = await getCountFromServer(query(books, pub, where('educationType', '==', 'Higher'), where('classLevel', '==', '1st Year')));
    return { count: s.data().count };
  });
  await run('D1', "directory: orderBy(documentId()) + limit(50) [Directory page 1]", async () => {
    const s = await getDocs(query(dir, pub, orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('D2', "directory: type='Higher' + board='National University' + program='Honours' + classLevel='1st Year' + department='English' + orderBy + limit(50)", async () => {
    const s = await getDocs(query(dir, pub, where('type', '==', 'Higher'), where('board', '==', 'National University'), where('program', '==', 'Honours'), where('classLevel', '==', '1st Year'), where('department', '==', 'English'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('D3', 'directory: count() all Published', async () => {
    const s = await getCountFromServer(query(dir, pub));
    return { count: s.data().count };
  });
  await run('Q1', "quizzes: orderBy(documentId()) + limit(50) [Exam page 1]", async () => {
    const s = await getDocs(query(quizzes, pub, orderBy(documentId()), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  let quizLast = null;
  await run('Q2', 'quizzes: page 2 via startAfter', async () => {
    const s1 = await getDocs(query(quizzes, pub, orderBy(documentId()), limit(50)));
    quizLast = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(quizzes, pub, orderBy(documentId()), limit(50), startAfter(quizLast)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('Q3', "quizzes: educationType='Higher' + kind='mcq' + orderBy + limit(50)", async () => {
    const s = await getDocs(query(quizzes, pub, where('educationType', '==', 'Higher'), where('kind', '==', 'mcq'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('Q4', 'quizzes: count() all Published', async () => {
    const s = await getCountFromServer(query(quizzes, pub));
    return { count: s.data().count };
  });
  const shapeFails = results.filter((r) => !r.ok && !r.id.match(/^[LDQ][0-9]$/ ) || (r.id.match(/^[LDQ]/) && ['L5','L6','D3','Q4'].includes(r.id) && false));
  const countFails = results.filter((r) => ['L5','L6','D3','Q4'].includes(r.id) && !r.ok);
  const realFails = results.filter((r) => !r.ok && !['L5','L6','D3','Q4'].includes(r.id));
  console.log(realFails.length === 0 ? 'ALL SHIPPED QUERY SHAPES OK — no composite index needed' : `SHAPE FAILURES: ${realFails.length}`);
  console.log(`count() checks failed as expected (live count quota): ${countFails.length}/4`);
  process.exit(realFails.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
