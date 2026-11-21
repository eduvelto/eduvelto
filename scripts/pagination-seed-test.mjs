// Eduvelto — Pagination seed + query-shape experiments (TEMPORARY test script).
//
// Seeds the Firestore EMULATOR with the 609 books + 609 directory rows
// (metadata parsed from the content packs with the SAME logic as
// scripts/load-library-content.mjs; counts taken from the loader's
// --dump-plan output), then runs the candidate pagination queries against
// the emulator as an UNAUTHENTICATED client (exactly like the real app)
// and reports which query shapes work WITHOUT a composite index.
//
// Read-only against live Firestore (no live calls at all). All writes go
// to the local emulator only. Delete this file before committing the branch.

import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  documentId,
} from 'firebase/firestore';

const CONTENT_ROOT = '/home/hatch/workspace/eduorbit/content';
const PLAN_PATH = '/tmp/pagination-plan.json';
const PROJECT_ID = 'eduvelto';

// ---- metadata parsing (copied logic from load-library-content.mjs) ----
const DEPT_NAMES = {
  english: 'English', bangla: 'Bangla', economics: 'Economics',
  'political-science': 'Political Science', mathematics: 'Mathematics',
  accounting: 'Accounting', management: 'Management', history: 'History',
  'islamic-history': 'Islamic History & Culture', philosophy: 'Philosophy',
  sociology: 'Sociology', physics: 'Physics', chemistry: 'Chemistry',
  botany: 'Botany', zoology: 'Zoology',
};
const BN_DIGITS = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
const normDigits = (s) => String(s).replace(/[০-৯]/g, (d) => BN_DIGITS[d]);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const BN_HEADER_KEYS = {
  'কোর্স কোড': 'Course code', 'পত্র': 'Paper', 'বর্ষ': 'Year',
  'বিশ্ববিদ্যালয়': 'University', 'ক্রেডিট': 'Credit', 'নম্বর': 'Marks',
  'বিষয়': 'Subject', 'স্তর': 'Level', 'প্যাক': 'Pack', 'প্রশ্ন': 'Questions',
  'অবস্থা': 'Status',
};
function parseHeaderTable(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|$/);
    if (m && m[1].trim() && !/^-+$/.test(m[1].trim()) && m[1].trim() !== 'Field' && m[1].trim() !== 'ক্ষেত্র') {
      const key = BN_HEADER_KEYS[m[1].trim()] || m[1].trim();
      out[key] = m[2].trim();
    }
  }
  return out;
}
function parseFolder(folderName) {
  const hm = folderName.match(/^honours-(.+)-(\d)(?:st|nd|rd|th)-year$/);
  if (hm) {
    const yearNum = parseInt(hm[2], 10);
    return {
      type: 'Higher', board: 'National University', program: 'Honours',
      deptSlug: hm[1], department: DEPT_NAMES[hm[1]] || hm[1],
      yearNum, yearLabel: `${yearNum}${['', 'st', 'nd', 'rd'][yearNum] || 'th'} Year`,
    };
  }
  const mm = folderName.match(/^madrasa-(alim|dakhil|fazil|kamil)$/);
  if (mm) {
    const level = mm[1][0].toUpperCase() + mm[1].slice(1);
    return { type: 'Madrasa', board: 'Bangladesh Madrasa Education Board', program: level, deptSlug: 'madrasa', department: 'Madrasa', yearNum: 0, yearLabel: level };
  }
  const hm2 = folderName.match(/^(hsc|ssc)-(.+)$/);
  if (hm2) {
    const stream = hm2[2].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { type: hm2[1].toUpperCase(), board: 'Board of Intermediate and Secondary Education', program: stream, deptSlug: hm2[2], department: stream, yearNum: 0, yearLabel: hm2[1].toUpperCase() };
  }
  const tm = folderName.match(/^technical-(.+)$/);
  if (tm) {
    const prog = tm[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { type: 'Technical', board: 'Bangladesh Technical Education Board', program: prog, deptSlug: tm[1], department: prog, yearNum: 0, yearLabel: prog };
  }
  const parts = folderName.split('-');
  const type = parts[0].toUpperCase();
  const rest = parts.slice(1).join(' ').replace(/\b\w/g, (c) => c.toUpperCase()) || folderName;
  return { type, board: '', program: rest, deptSlug: folderName, department: rest, yearNum: 0, yearLabel: rest };
}
function detectLanguage(text) {
  const sample = text.slice(0, 20000);
  const bn = (sample.match(/[\u0980-\u09FF]/g) || []).length;
  const ar = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  if (bn > 200 && bn >= ar) return 'bn';
  if (ar > 200 && ar > bn) return 'ar';
  return 'en';
}

function parsePackMeta(filePath, folderName) {
  const text = readFileSync(filePath, 'utf8');
  const header = parseHeaderTable(text);
  const rawCode = (header['Course code'] || header['Subject identifier'] || '').split('(')[0].trim();
  const numCode = /^[0-9]+$/.test(normDigits(rawCode)) ? normDigits(rawCode) : '';
  let code = numCode || rawCode;
  if (!code) {
    const stem = basename(filePath, '.md')
      .replace(/-(?:exam|mcq|broad-extra)-pack-01$/, '')
      .replace(/-pack-01$/, '');
    const levelPrefix = folderName.startsWith('technical-')
      ? folderName.toUpperCase()
      : folderName.split('-')[0].toUpperCase();
    code = `${levelPrefix}-${slugify(stem).toUpperCase()}`;
  }
  const title = (header.Paper || header.Subject || basename(filePath, '.md')).trim();
  const place = parseFolder(folderName);
  const credit = parseInt(normDigits(header.Credit || '').replace(/[^0-9]/g, ''), 10) || null;
  const marks = parseInt(normDigits(header.Marks || '').replace(/[^0-9]/g, ''), 10) || null;
  const isBilingual = /\*\*\s*উত্তর \(বাংলায়\):/.test(text) || /সহজ বাংলা উত্তর/.test(text) || /ব্যাখ্যা \(বাংলায়\)/.test(text);
  return {
    code, title, credit, marks, language: detectLanguage(text), isBilingual,
    eduType: place.type, board: place.board, program: place.program,
    department: place.department, deptSlug: place.deptSlug,
    yearNum: place.yearNum, yearLabel: place.yearLabel, folder: folderName,
  };
}

function buildBooks() {
  const plan = JSON.parse(readFileSync(PLAN_PATH, 'utf8'));
  const counts = new Map(plan.books.map((b) => [b.bookId, b]));
  const folders = readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const byCode = new Map();
  for (const folder of folders) {
    const files = readdirSync(join(CONTENT_ROOT, folder)).filter((f) => f.endsWith('.md')).sort();
    for (const file of files) {
      const meta = parsePackMeta(join(CONTENT_ROOT, folder, file), folder);
      if (!meta.code) continue;
      if (!byCode.has(meta.code)) byCode.set(meta.code, []);
      byCode.get(meta.code).push(meta);
    }
  }
  const books = [];
  for (const [code, variants] of [...byCode.entries()].sort()) {
    const first = variants[0];
    const typeSlug = slugify(first.eduType);
    const prefix = first.eduType === 'Higher' ? 'hons-' : first.eduType === 'Madrasa' ? 'mad-' : `${typeSlug}-`;
    const idSlug = /^\d+$/.test(code) ? code : slugify(code).replace(new RegExp(`^${typeSlug}-`), '');
    const bookId = `${prefix}${idSlug}`;
    const departments = [...new Set(variants.map((p) => p.department))];
    const c = counts.get(bookId);
    if (!c) { console.warn(`WARN: no plan counts for ${bookId} (code ${code})`); continue; }
    books.push({
      bookId, code, title: first.title, department: first.department, departments,
      yearLabel: first.yearLabel, credit: first.credit, marks: first.marks,
      eduType: first.eduType, board: first.board, program: first.program,
      language: first.language, bilingual: first.isBilingual,
      sourceUrl: `https://eduvelto.web.app/library/${bookId}`,
      questionCount: c.questionCount, chapterCount: c.chapterCount,
    });
  }
  return books;
}

// ---- seed + experiments ----
async function main() {
  const books = buildBooks();
  console.log(`SEED: ${books.length} books parsed from packs`);
  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/pagination-books.json', JSON.stringify(books, null, 2));
  console.log('BOOKS JSON: /tmp/pagination-books.json');
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
    for (const b of books) {
      batch.set(doc(db, 'books', b.bookId), {
        title: b.title, paperCode: b.code, educationType: b.eduType, board: b.board,
        program: b.program, classLevel: b.yearLabel, department: b.department,
        departments: b.departments, subject: b.department, sourceType: 'original-eduvelto',
        sourceUrl: b.sourceUrl, authors: ['Eduvelto'], publisher: 'Eduvelto',
        credit: b.credit, marks: b.marks, language: b.language, bilingual: b.bilingual,
        questionCount: b.questionCount, chapterCount: b.chapterCount,
        sourceFiles: [], reviewStatus: 'Published', createdAt: now, updatedAt: now,
      });
      batch.set(doc(db, 'educationDirectory', b.bookId), {
        type: b.eduType, board: b.board, program: b.program, classLevel: b.yearLabel,
        department: b.department, departments: b.departments, subject: b.department,
        paperCode: b.code, paperTitle: b.title, bookId: b.bookId, title: b.title,
        reviewStatus: 'Published', createdAt: now, updatedAt: now,
      });
      n += 2;
      if (n >= 400) await flush();
    }
    await flush();
  });
  console.log('SEED DONE: books + educationDirectory written to emulator');

  // ---- client-SDK experiments (unauthenticated, like the real app) ----
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'test' });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const booksCol = collection(db, 'books');
  const dirCol = collection(db, 'educationDirectory');
  const results = [];
  async function run(id, desc, fn) {
    try {
      const out = await fn();
      results.push({ id, desc, ok: true, ...out });
      console.log(`  ${id} OK   ${desc} -> ${JSON.stringify(out)}`);
    } catch (e) {
      results.push({ id, desc, ok: false, error: `${e.code || ''} ${e.message}`.slice(0, 300) });
      console.log(`  ${id} FAIL ${desc} -> ${(e.code || '')} ${String(e.message).slice(0, 200)}`);
    }
  }
  let page1Last = null;
  console.log('EXPERIMENTS:');
  await run('E0', 'baseline: all Published books, no limit', async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published')));
    return { docs: s.size };
  });
  await run('E1', 'limit(50), no orderBy', async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), limit(50)));
    page1Last = s.docs[s.docs.length - 1];
    return { docs: s.size, firstId: s.docs[0]?.id, lastId: page1Last?.id };
  });
  await run('E2', 'limit(50) + startAfter(page1 last doc)', async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), limit(50), startAfter(page1Last)));
    return { docs: s.size, firstId: s.docs[0]?.id, lastId: s.docs[s.docs.length - 1]?.id };
  });
  await run('E3', "orderBy(documentId()) + limit(50)", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('E4', "orderBy('classLevel') + limit(50) [emulator does NOT enforce indexes: passes here, FAILS live]", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), orderBy('classLevel'), limit(50)));
    return { docs: s.size };
  });
  await run('E5', "filter educationType=='Higher' + limit(50)", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('E6', "E5 + startAfter", async () => {
    const s1 = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), limit(50)));
    const last = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), limit(50), startAfter(last)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('E7', "filter type+classLevel + limit(50)", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), where('classLevel', '==', '1st Year'), limit(50)));
    return { docs: s.size };
  });
  await run('E8', "filter educationType + orderBy(documentId()) + limit(50)", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), orderBy(documentId()), limit(50)));
    return { docs: s.size };
  });
  await run('E9', 'count() all Published books', async () => {
    const s = await getCountFromServer(query(booksCol, where('reviewStatus', '==', 'Published')));
    return { count: s.data().count };
  });
  await run('E10', "count() educationType=='Higher'", async () => {
    const s = await getCountFromServer(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher')));
    return { count: s.data().count };
  });
  await run('E11', 'directory: limit(50) + startAfter', async () => {
    const s1 = await getDocs(query(dirCol, where('reviewStatus', '==', 'Published'), limit(50)));
    const last = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(dirCol, where('reviewStatus', '==', 'Published'), limit(50), startAfter(last)));
    return { page1: s1.size, page2: s.size, page2firstId: s.docs[0]?.id };
  });
  await run('E12', "directory: filter type=='Higher' + limit(50)", async () => {
    const s = await getDocs(query(dirCol, where('reviewStatus', '==', 'Published'), where('type', '==', 'Higher'), limit(50)));
    return { docs: s.size };
  });
  await run('E13', "orderBy(documentId()) + limit(50)", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50)));
    return { docs: s.size, firstId: s.docs[0]?.id };
  });
  await run('E14', "orderBy classLevel+department+title [emulator does NOT enforce indexes: passes here, FAILS live]", async () => {
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), orderBy('classLevel'), orderBy('department'), orderBy('title'), limit(50)));
    return { docs: s.size };
  });
  await run('E3b', "orderBy(documentId()) + limit(50) + startAfter (the shape we will ship)", async () => {
    const s1 = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50)));
    const last = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50), startAfter(last)));
    return { page1: s1.size, page2: s.size, page2firstId: s.docs[0]?.id, overlap: s.docs.some((d) => d.id === last.id) };
  });
  await run('E3c', "orderBy(documentId()) + filter educationType + limit(50) + startAfter", async () => {
    const q1 = query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), orderBy(documentId()), limit(50));
    const s1 = await getDocs(q1);
    const last = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), orderBy(documentId()), limit(50), startAfter(last)));
    return { page1: s1.size, page2: s.size, page2firstId: s.docs[0]?.id };
  });
  await run('E15', "count() type+classLevel filter", async () => {
    const s = await getCountFromServer(query(booksCol, where('reviewStatus', '==', 'Published'), where('educationType', '==', 'Higher'), where('classLevel', '==', '1st Year')));
    return { count: s.data().count };
  });
  await run('E16', "directory: orderBy(documentId()) + filter type + limit(50) + startAfter", async () => {
    const q1 = query(dirCol, where('reviewStatus', '==', 'Published'), where('type', '==', 'Higher'), orderBy(documentId()), limit(50));
    const s1 = await getDocs(q1);
    const last = s1.docs[s1.docs.length - 1];
    const s = await getDocs(query(dirCol, where('reviewStatus', '==', 'Published'), where('type', '==', 'Higher'), orderBy(documentId()), limit(50), startAfter(last)));
    return { page1: s1.size, page2: s.size, page2firstId: s.docs[0]?.id };
  });
  await run('E17', 'three consecutive pages: no overlap, sequential doc IDs', async () => {
    const q = (c) => query(booksCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    const p1 = await getDocs(q(null));
    const p2 = await getDocs(q(p1.docs[p1.docs.length - 1]));
    const p3 = await getDocs(q(p2.docs[p2.docs.length - 1]));
    const ids = [...p1.docs, ...p2.docs, ...p3.docs].map((d) => d.id);
    const sorted = [...ids].sort();
    return { pages: [p1.size, p2.size, p3.size], unique: new Set(ids).size, inDocIdOrder: JSON.stringify(ids) === JSON.stringify(sorted) };
  });
  await run('E18', 'FULL WALK books: all pages, no loss, no duplicates', async () => {
    const q = (c) => query(booksCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    let cursor = null; const ids = []; let pages = 0;
    for (;;) { const snap = await getDocs(q(cursor)); pages++; ids.push(...snap.docs.map((d) => d.id)); if (snap.size < 50) break; cursor = snap.docs[snap.docs.length - 1]; }
    return { pages, docs: ids.length, unique: new Set(ids).size };
  });
  await run('E19', 'FULL WALK directory: all pages, no loss, no duplicates', async () => {
    const q = (c) => query(dirCol, where('reviewStatus', '==', 'Published'), orderBy(documentId()), limit(50), ...(c ? [startAfter(c)] : []));
    let cursor = null; const ids = []; let pages = 0;
    for (;;) { const snap = await getDocs(q(cursor)); pages++; ids.push(...snap.docs.map((d) => d.id)); if (snap.size < 50) break; cursor = snap.docs[snap.docs.length - 1]; }
    return { pages, docs: ids.length, unique: new Set(ids).size };
  });
  // Distinct values actually present (for the taxonomy + order check).
  const all = await getDocs(query(booksCol, where('reviewStatus', '==', 'Published'), limit(50)));
  const p1 = all.docs.map((d) => d.data());
  console.log('PAGE1 sample (doc-ID order):', p1.slice(0, 3).map((b) => `${b.paperCode}/${b.classLevel}/${b.department}`).join(' | '));
  console.log('DONE');
  await testEnv.cleanup();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
