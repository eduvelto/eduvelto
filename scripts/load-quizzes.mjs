// Eduvelto — Exam/quiz builder (Phase 2, Step 4).
//
// Builds `quizzes` (student projection — NO answer key) + `quizKeys`
// (answer key, admin/moderator + receipt-gated read only) from the
// Published `lessons` already loaded into live Firestore by
// load-library-content.mjs (project "eduvelto").
//
//   quizzes/{bookId}--mcq            — MCQ exam, ≤30 questions
//   quizzes/{bookId}--written-{n}    — written exam, ≤26 questions each
//   quizKeys/{quizId}                — { quizId, answers: [{n, correctLetter, correctText}] }
//
// ANSWER-KEY PROTECTION (plan Step 4): the quiz document a student
// fetches during an exam contains NO correctLetter/correctText/answer.
// The key lives only in quizKeys, readable by students ONLY through the
// receipt-gated rule (firestore.rules: a fresh quizReceipts doc, created
// by the app at submit time). The app fetches the key only AFTER the
// student submits. HONEST LIMIT (no server on the free Spark plan):
// the receipt gate stops casual access; a determined user with console
// access could forge a receipt. True server-side verification needs a
// Cloud Function (Blaze) — flagged for Phase 3. The guarantees that DO
// hold: the quiz doc never carries the key, and the attempt is immutable
// after submit.
//
// Marks (NU exam pattern, documented assumption): MCQ = 1 mark each.
// Written: kind B (broad) / E (extra) = 10; SA / short = 1; kind Q
// (written, no options) by lesson part — A = 1, B = 5, C = 10.
//
// Auth: reuses the Firebase CLI login already on this machine (same as
// load-library-content.mjs). The refresh token is read at runtime and
// NEVER printed or written anywhere. The access token lives only in memory.
//
// RE-RUNNABLE: document IDs are deterministic, so re-running after the
// Step 2 load adds more books updates the same docs in place. Safe to
// re-run any time (e.g. after the remaining packs finish loading).
//
// Usage:
//   node scripts/load-quizzes.mjs [--dry-run] [--only <bookId>]
//   --dry-run : parse everything, print the plan, write nothing.
//   --only    : build quizzes for one book only, e.g. hons-231101

import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateClassStats, writeStatsHalf } from './build-class-stats.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'eduvelto';
const REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const LOG_PATH = join(__dirname, 'load-quizzes-log.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const ONLY_BOOK = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

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
  const token = await getAccessToken();
  const res = await fetch(`${REST}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retryAuth) {
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

async function getDoc(collection, id) {
  const res = await fsFetch(`/${collection}/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// Create as draft, then publish — the live rules require that two-step
// flow for client writes (same as load-library-content.mjs).
async function upsertPublished(collection, id, fields, publish) {
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, enc(v)])) };
  const existing = await getDoc(collection, id);
  if (!existing) {
    const res = await fsFetch(`/${collection}?documentId=${encodeURIComponent(id)}`, { method: 'POST', body });
    if (!res.ok) throw new Error(`POST ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    if (publish) await setReviewStatus(collection, id, 'Published');
    return 'created';
  }
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fsFetch(`/${collection}/${id}?${mask}`, { method: 'PATCH', body });
  if (!res.ok) throw new Error(`PATCH ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  if (publish) await setReviewStatus(collection, id, 'Published');
  return 'updated';
}

async function setReviewStatus(collection, id, status) {
  const body = { fields: { reviewStatus: enc(status), updatedAt: enc(new Date()) } };
  const res = await fsFetch(
    `/${collection}/${id}?updateMask.fieldPaths=reviewStatus&updateMask.fieldPaths=updatedAt`,
    { method: 'PATCH', body },
  );
  if (!res.ok) throw new Error(`PUBLISH ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ---------------------------------------------------------------------------
// Quiz building
// ---------------------------------------------------------------------------
const MCQ_PER_QUIZ = 30; // plan Step 4: ≤30 questions in the quiz document
const WRITTEN_PER_QUIZ = 26; // NU exam pattern: 10 + 8 + 8
const PART_MARKS = { A: 1, B: 5, C: 10 };

function writtenMarks(q, lessonPart) {
  if (q.kind === 'B' || q.kind === 'E') return 10;
  if (q.kind === 'SA' || q.kind === 'short') return 1;
  // Kind Q with no options: NU part structure (A = short 1, B = brief 5, C = broad 10).
  return PART_MARKS[(lessonPart || 'A').toUpperCase()] ?? 1;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const t0 = Date.now();
  const bookDocs = await listAll('books');
  const lessonDocs = await listAll('lessons');
  const books = new Map();
  for (const b of bookDocs) {
    const id = b.name.split('/').pop();
    books.set(id, {
      id,
      title: dec(b.fields.title) ?? id,
      subject: dec(b.fields.subject) ?? '',
      department: dec(b.fields.department) ?? '',
      classLevel: dec(b.fields.classLevel) ?? '',
      educationType: dec(b.fields.educationType) ?? '',
    });
  }
  // Group Published lessons by book, in part/set order.
  const byBook = new Map();
  for (const l of lessonDocs) {
    if (dec(l.fields.reviewStatus) !== 'Published') continue;
    const bookId = dec(l.fields.bookId);
    if (!bookId || (ONLY_BOOK && bookId !== ONLY_BOOK)) continue;
    const part = (dec(l.fields.part) ?? 'A').toString().toUpperCase();
    const set = dec(l.fields.set) ?? 1;
    const questions = dec(l.fields.questions) ?? [];
    if (!byBook.has(bookId)) byBook.set(bookId, []);
    byBook.get(bookId).push({ id: l.name.split('/').pop(), part, set, questions });
  }
  for (const lessons of byBook.values()) {
    lessons.sort((a, b) => a.part.localeCompare(b.part) || a.set - b.set || a.id.localeCompare(b.id));
    for (const l of lessons) l.questions.sort((a, b) => (a.n ?? 0) - (b.n ?? 0));
  }

  const plan = []; // { quizId, kind, bookId, questions, keyAnswers?, totalMarks, timeLimitMinutes }
  for (const [bookId, lessons] of byBook) {
    const mcq = [];
    const written = [];
    for (const l of lessons) {
      for (const q of l.questions) {
        const options = q.options ?? [];
        if (options.length >= 2 && q.correctLetter) {
          mcq.push({
            n: q.n, topic: q.topic ?? '', question: q.question,
            options: options.map((o) => ({ letter: o.letter, text: o.text })),
            marks: 1, lessonId: l.id,
            correctLetter: q.correctLetter, correctText: q.correctText ?? '',
          });
        } else if (options.length === 0 && q.question) {
          written.push({
            n: q.n, topic: q.topic ?? '', question: q.question,
            marks: writtenMarks(q, l.part), lessonId: l.id,
          });
        }
      }
    }
    const mcqChunks = chunk(mcq, MCQ_PER_QUIZ);
    mcqChunks.forEach((qs, i) => {
      plan.push({
        quizId: mcqChunks.length > 1 ? `${bookId}--mcq-${i + 1}` : `${bookId}--mcq`,
        kind: 'mcq', bookId,
        questions: qs,
        keyAnswers: qs.map((q) => ({ n: q.n, correctLetter: q.correctLetter, correctText: q.correctText })),
        totalMarks: qs.reduce((s, q) => s + q.marks, 0),
        timeLimitMinutes: 30,
      });
    });
    const writtenChunks = chunk(written, WRITTEN_PER_QUIZ);
    writtenChunks.forEach((qs, i) => {
      plan.push({
        quizId: writtenChunks.length > 1 ? `${bookId}--written-${i + 1}` : `${bookId}--written`,
        kind: 'written', bookId,
        questions: qs,
        keyAnswers: null,
        totalMarks: qs.reduce((s, q) => s + q.marks, 0),
        timeLimitMinutes: 180,
      });
    });
  }

  console.log(`Books with Published lessons: ${byBook.size}`);
  console.log(`Plan: ${plan.filter((p) => p.kind === 'mcq').length} MCQ quizzes, ${plan.filter((p) => p.kind === 'written').length} written quizzes, ${plan.reduce((s, p) => s + p.questions.length, 0)} questions total.`);
  if (DRY_RUN) {
    for (const p of plan.slice(0, 12)) {
      console.log(`  ${p.quizId} [${p.kind}] ${p.questions.length} Q, ${p.totalMarks} marks, ${p.timeLimitMinutes} min`);
    }
    if (plan.length > 12) console.log(`  ... and ${plan.length - 12} more`);
    return;
  }

  let created = 0, updated = 0, keyCreated = 0, keyUpdated = 0;
  const now = new Date();
  for (const p of plan) {
    const book = books.get(p.bookId) ?? { title: p.bookId, subject: '', department: '', classLevel: '', educationType: '' };
    const titleBn = p.kind === 'mcq' ? `${book.title} — MCQ পরীক্ষা` : `${book.title} — লিখিত পরীক্ষা`;
    const title = titleBn.length > 190 ? `${titleBn.slice(0, 187)}...` : titleBn;
    const quizFields = {
      title,
      bookId: p.bookId,
      subject: book.subject,
      department: book.department,
      classLevel: book.classLevel,
      educationType: book.educationType,
      kind: p.kind,
      questions: p.questions.map((q) => ({
        n: q.n, topic: q.topic, question: q.question,
        ...(q.options ? { options: q.options } : {}),
        marks: q.marks,
      })),
      questionCount: p.questions.length,
      totalMarks: p.totalMarks,
      timeLimitMinutes: p.timeLimitMinutes,
      reviewStatus: 'Under Review',
      createdAt: now,
      updatedAt: now,
    };
    const r = await upsertPublished('quizzes', p.quizId, quizFields, true);
    if (r === 'created') created++; else updated++;
    if (p.keyAnswers) {
      const kr = await upsertPublished('quizKeys', p.quizId, {
        quizId: p.quizId,
        answers: p.keyAnswers,
        updatedAt: now,
      }, false);
      if (kr === 'created') keyCreated++; else keyUpdated++;
    }
  }
  const summary = {
    at: new Date().toISOString(), dryRun: false, onlyBook: ONLY_BOOK,
    books: byBook.size, quizzes: plan.length,
    mcqQuizzes: plan.filter((p) => p.kind === 'mcq').length,
    writtenQuizzes: plan.filter((p) => p.kind === 'written').length,
    questions: plan.reduce((s, p) => s + p.questions.length, 0),
    quizzesCreated: created, quizzesUpdated: updated,
    keysCreated: keyCreated, keysUpdated: keyUpdated,
    elapsedSec: Math.round((Date.now() - t0) / 1000),
  };
  writeFileSync(LOG_PATH, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  // CLASS STATS (fix/read-usage): the QUIZ half of the per-level stats
  // docs (the library loader owns the book half). SKIPPED on --only
  // runs: a stats doc written from one book would publish wrong totals.
  if (!ONLY_BOOK) {
    try {
      const stats = aggregateClassStats(
        [],
        plan.map((p) => {
          const book = books.get(p.bookId) ?? {};
          return {
            id: p.quizId,
            title: p.kind === 'mcq' ? `${book.title ?? p.bookId} — MCQ পরীক্ষা` : `${book.title ?? p.bookId} — লিখিত পরীক্ষা`,
            educationType: book.educationType ?? '',
            classLevel: book.classLevel ?? '',
            department: book.department ?? '',
            questionCount: p.questions.length,
          };
        }),
      );
      for (const stat of stats) {
        const r = await writeStatsHalf({ fsFetch, enc, dec }, stat, 'quiz');
        console.log(`STATS: ${stat.slug} quiz half ${r} (quizzes=${stat.quizCount})`);
      }
    } catch (e) {
      console.error(`STATS FAILED: ${e.message} — quizzes are live; stats stay stale until the next full run.`);
    }
  } else {
    console.log('STATS SKIPPED: partial run (--only) — stats need a full run.');
  }
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
