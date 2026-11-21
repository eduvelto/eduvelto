// Eduvelto — Exam quiz measurement + emulator seed + pagination experiments
// (Test script — KEPT on the branch as the evidence for the pagination work.)
//
// Rebuilds the exact quiz documents scripts/load-quizzes.mjs builds, from
// the content packs (via the loader's own buildPlan), measures their JSON
// byte sizes (the reproducible proxy for Firestore egress), seeds them into
// the EMULATOR, and runs the candidate exam-pagination queries as an
// unauthenticated client. No live Firestore calls at all.

import { writeFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  documentId,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
} from 'firebase/firestore';
import { buildPlan } from '/tmp/loader-lib.mjs';

const PROJECT_ID = 'eduvelto';
const DRAFT_PACK_FILE = 'elizabethan-and-jacobean-drama-broad-extra-pack-01.md';
const MCQ_PER_QUIZ = 30;
const WRITTEN_PER_QUIZ = 26;
const PART_MARKS = { A: 1, B: 5, C: 10 };

function writtenMarks(q, lessonPart) {
  if (q.kind === 'B' || q.kind === 'E') return 10;
  if (q.kind === 'SA' || q.kind === 'short') return 1;
  return PART_MARKS[(lessonPart || 'A').toUpperCase()] ?? 1;
}
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const byteLen = (s) => Buffer.byteLength(s, 'utf8');

function buildQuizzes() {
  const { books } = buildPlan();
  console.log(`PLAN: ${books.length} books`);
  const byBook = new Map();
  for (const book of books) {
    const lessons = [];
    for (const { pack, part, setNo } of book.chapters) {
      if (pack.file === DRAFT_PACK_FILE) continue; // Draft lessons stay Draft
      const lessonId = `${book.bookId}--part-${part.letter.toLowerCase()}${setNo > 1 ? `-set${setNo}` : ''}`;
      lessons.push({ id: lessonId, part: part.letter.toUpperCase(), set: setNo, questions: part.questions });
    }
    lessons.sort((a, b) => a.part.localeCompare(b.part) || a.set - b.set || a.id.localeCompare(b.id));
    for (const l of lessons) l.questions.sort((a, b) => (a.n ?? 0) - (b.n ?? 0));
    byBook.set(book.bookId, { book, lessons });
  }
  const plan = [];
  for (const [bookId, { book, lessons }] of byBook) {
    const mcq = [];
    const written = [];
    for (const l of lessons) {
      for (const q of l.questions) {
        const options = q.options ?? [];
        if (options.length >= 2 && q.correctLetter) {
          mcq.push({
            n: q.n, topic: q.topic ?? '', question: q.question,
            options: options.map((o) => ({ letter: o.letter, text: o.text })),
            marks: 1,
          });
        } else if (options.length === 0 && q.question) {
          written.push({
            n: q.n, topic: q.topic ?? '', question: q.question,
            marks: writtenMarks(q, l.part),
          });
        }
      }
    }
    const mcqChunks = chunk(mcq, MCQ_PER_QUIZ);
    mcqChunks.forEach((qs, i) => {
      plan.push({
        quizId: mcqChunks.length > 1 ? `${bookId}--mcq-${i + 1}` : `${bookId}--mcq`,
        kind: 'mcq', bookId, questions: qs,
        totalMarks: qs.reduce((s, q) => s + q.marks, 0), timeLimitMinutes: 30,
      });
    });
    const writtenChunks = chunk(written, WRITTEN_PER_QUIZ);
    writtenChunks.forEach((qs, i) => {
      plan.push({
        quizId: writtenChunks.length > 1 ? `${bookId}--written-${i + 1}` : `${bookId}--written`,
        kind: 'written', bookId, questions: qs,
        totalMarks: qs.reduce((s, q) => s + q.marks, 0), timeLimitMinutes: 180,
      });
    });
  }
  // Attach book metadata + compute sizes exactly as the stored doc.
  const docs = plan.map((p) => {
    const { book } = byBook.get(p.bookId);
    const titleBn = p.kind === 'mcq' ? `${book.title} — MCQ পরীক্ষা` : `${book.title} — লিখিত পরীক্ষা`;
    const title = titleBn.length > 190 ? `${titleBn.slice(0, 187)}...` : titleBn;
    const fields = {
      title, bookId: p.bookId, subject: book.department, department: book.department,
      classLevel: book.yearLabel, educationType: book.eduType, kind: p.kind,
      questions: p.questions, questionCount: p.questions.length,
      totalMarks: p.totalMarks, timeLimitMinutes: p.timeLimitMinutes,
      reviewStatus: 'Published',
    };
    return { id: p.quizId, fields, bytes: byteLen(JSON.stringify({ id: p.quizId, ...fields })) };
  });
  docs.sort((a, b) => a.id.localeCompare(b.id));
  return docs;
}

async function main() {
  const docs = buildQuizzes();
  const totalBytes = docs.reduce((s, d) => s + d.bytes, 0);
  const totalQ = docs.reduce((s, d) => s + d.fields.questionCount, 0);
  console.log(`QUIZZES: ${docs.length} docs, ${totalQ} questions, total ${totalBytes} bytes (${(totalBytes / 1048576).toFixed(2)} MiB)`);
  const page1 = docs.slice(0, 50);
  const page1Bytes = page1.reduce((s, d) => s + d.bytes, 0);
  console.log(`PAGE 1 (first 50 by doc ID): ${page1Bytes} bytes (${(page1Bytes / 1048576).toFixed(2)} MiB)`);
  writeFileSync('/tmp/pagination-quiz-sizes.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    quizCount: docs.length, totalQuestions: totalQ, totalBytes,
    page1Bytes, pageSize: 50,
    perQuiz: docs.map((d) => ({ id: d.id, kind: d.fields.kind, questions: d.fields.questionCount, bytes: d.bytes })),
  }, null, 2));
  console.log('SIZES: /tmp/pagination-quiz-sizes.json');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8080 },
  });
  const now = new Date('2026-11-21T00:00:00Z');
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    let batch = writeBatch(db);
    let n = 0;
    const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0; };
    for (const d of docs) {
      batch.set(doc(db, 'quizzes', d.id), { ...d.fields, createdAt: now, updatedAt: now });
      if (++n >= 400) await flush();
    }
    await flush();
  });
  console.log('SEED DONE: quizzes written to emulator');

  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'test' });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const qCol = collection(db, 'quizzes');
  const qBase = [where('reviewStatus', '==', 'Published')];
  const bytesOf = (snap) => snap.docs.reduce((s, d) => s + byteLen(JSON.stringify({ id: d.id, ...d.data() })), 0);
  async function run(id, desc, fn) {
    try {
      const out = await fn();
      console.log(`  ${id} OK   ${desc} -> ${JSON.stringify(out)}`);
    } catch (e) {
      console.log(`  ${id} FAIL ${desc} -> ${(e.code || '')} ${String(e.message).slice(0, 200)}`);
    }
  }
  console.log('EXPERIMENTS (exams):');
  await run('E20', 'baseline: all Published quizzes, no limit', async () => {
    const s = await getDocs(query(qCol, ...qBase));
    return { docs: s.size, bytes: bytesOf(s), mib: +(bytesOf(s) / 1048576).toFixed(2) };
  });
  let last1 = null;
  await run('E21', "orderBy(documentId()) + limit(50) [page 1]", async () => {
    const s = await getDocs(query(qCol, ...qBase, orderBy(documentId()), limit(50)));
    last1 = s.docs[s.docs.length - 1];
    return { docs: s.size, bytes: bytesOf(s), mib: +(bytesOf(s) / 1048576).toFixed(2), firstId: s.docs[0]?.id };
  });
  await run('E22', 'page 2 via startAfter', async () => {
    const s = await getDocs(query(qCol, ...qBase, orderBy(documentId()), limit(50), startAfter(last1)));
    return { docs: s.size, bytes: bytesOf(s), firstId: s.docs[0]?.id };
  });
  await run('E23', '3 consecutive pages: unique + bytes', async () => {
    const q = (c) => query(qCol, ...qBase, orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    const p1 = await getDocs(q(null));
    const p2 = await getDocs(q(p1.docs[p1.docs.length - 1]));
    const p3 = await getDocs(q(p2.docs[p2.docs.length - 1]));
    const ids = [...p1.docs, ...p2.docs, ...p3.docs].map((d) => d.id);
    return { pages: [p1.size, p2.size, p3.size], unique: new Set(ids).size, bytesPerPage: [bytesOf(p1), bytesOf(p2), bytesOf(p3)] };
  });
  await run('E24', 'count() all Published quizzes', async () => {
    const s = await getCountFromServer(query(qCol, ...qBase));
    return { count: s.data().count };
  });
  await run('E25', "filter educationType=='Higher' + limit(50)", async () => {
    const s = await getDocs(query(qCol, ...qBase, where('educationType', '==', 'Higher'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('E26', 'FULL WALK quizzes: all pages, no loss, no duplicates', async () => {
    const q = (c) => query(qCol, ...qBase, orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    let cursor = null; const ids = []; let pages = 0; let bytes = 0;
    for (;;) { const snap = await getDocs(q(cursor)); pages++; ids.push(...snap.docs.map((d) => d.id)); bytes += bytesOf(snap); if (snap.size < 50) break; cursor = snap.docs[snap.docs.length - 1]; }
    return { pages, docs: ids.length, unique: new Set(ids).size, bytes, mib: +(bytes / 1048576).toFixed(2) };
  });
  await run('E27', 'single quiz by ID (exam-taking path)', async () => {
    const { getDoc, doc: docRef } = await import('firebase/firestore');
    const s = await getDoc(docRef(db, 'quizzes', 'hons-231101--mcq'));
    return { exists: s.exists(), bytes: s.exists() ? byteLen(JSON.stringify({ id: s.id, ...s.data() })) : 0 };
  });
  console.log('DONE');
  await testEnv.cleanup();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
