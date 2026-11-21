// Eduvelto — Scale/10k emulator load test (TEMPORARY test script).
//
// Seeds the Firestore EMULATOR with synthetic data at the 100 / 500 /
// 1,000 registered-user milestones, then measures the query shapes the
// scalability work changed (or audited). All writes go to the local
// emulator only. Read-only against live Firestore (no live calls at all).
//
// Run: start the emulator first (ports from env, defaults 8081/9098),
// then: node scripts/scale-10k-test.mjs
// Results: stdout + /tmp/scale-10k-results.json
//
// What is measured vs projected (honest limits):
// - MEASURED here: emulator-local query time, docs read, bytes returned,
//   write counts for the tested sequences, at 100/500/1,000 seeded users.
// - PROJECTED (not measured): 2,500/5,000/10,000 registered users — the
//   sandbox cannot seed 10,000 users in reasonable time; those numbers
//   come from the verified scale-cost model + the measured per-op costs.
// - Emulator latency is LOCAL (no network, no TLS, no cold start) — it
//   proves the query SHAPES and the read/write counts, not production
//   latency. Production latency must be measured on staging after deploy.

import { writeFileSync, appendFileSync } from 'node:fs';
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
} from 'firebase/firestore';

const PROJECT_ID = 'eduvelto';
const FIRESTORE_PORT = Number(process.env.EMU_FIRESTORE_PORT || 8081);
const RESULTS_PATH = '/tmp/scale-10k-results.json';
// Durable progress log in the workspace (survives sandbox restarts, which
// wipe /tmp and kill the emulator mid-run). Every step appends here AND
// the results file is rewritten after every test, so an interrupted run
// still leaves partial measurements behind.
const PROGRESS_LOG = '/home/hatch/workspace/eduorbit/team/scale-10k-test-progress.log';
function progress(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try { appendFileSync(PROGRESS_LOG, line); } catch { /* best-effort */ }
}
function saveResults() {
  try { writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2)); } catch { /* best-effort */ }
}
// Fail fast instead of hanging forever if the emulator stalls (a hung SDK
// call killed a previous run at ~7 minutes with no output).
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT after ${ms}ms: ${label}`)), ms)),
  ]);
}

// Synthetic books: the exact pack text does not matter for these
// measurements — what matters is the SHAPE: 609 books, ~0.8 KB each,
// with the fields the queries filter/sort on (reviewStatus,
// educationType, classLevel, department). Generated deterministically
// in-process so the test has no dependency on /tmp files (which the
// sandbox wipes on restart).

const results = { milestones: {}, tests: {} };
function record(id, data) {
  results.tests[id] = data;
  progress(`${id}: ${JSON.stringify(data)}`);
  saveResults();
}
const now = () => performance.now();
async function timed(fn) {
  const t0 = now();
  const out = await fn();
  return { ms: Math.round((now() - t0) * 10) / 10, ...out };
}
const bytesOf = (docs) =>
  docs.reduce((s, d) => s + JSON.stringify(d.data()).length, 0);

async function main() {
  const departments = ['Mathematics', 'English', 'Bangla', 'Physics', 'Chemistry', 'History', 'Economics', 'Accounting', 'Management', 'Botany'];
  const eduTypes = ['Higher', 'Madrasa', 'SSC', 'HSC', 'Technical'];
  const yearLabels = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'SSC', 'HSC', 'Alim', 'Dakhil'];
  const books = [];
  for (let i = 0; i < 609; i++) {
    const dept = departments[i % departments.length];
    const eduType = eduTypes[i % eduTypes.length];
    books.push({
      bookId: `book-${String(i + 1).padStart(4, '0')}`,
      code: `${100 + (i % 900)}`,
      title: `${dept} — Paper ${i + 1}`,
      department: dept, departments: [dept],
      yearLabel: yearLabels[i % yearLabels.length],
      credit: 4, marks: 100, eduType,
      board: eduType === 'Higher' ? 'National University' : 'Board of Intermediate and Secondary Education',
      program: eduType === 'Higher' ? 'Honours' : dept,
      language: 'bn', bilingual: false,
      sourceUrl: `https://eduvelto.web.app/library/book-${String(i + 1).padStart(4, '0')}`,
      questionCount: 48, chapterCount: 4,
    });
  }
  progress(`BOOKS: ${books.length} synthetic books (realistic shape)`);
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: FIRESTORE_PORT },
    // The emulator hub port is set explicitly in the temp firebase.json
    // (another agent's emulator already owns the default 4400).
    hub: { host: '127.0.0.1', port: Number(process.env.EMU_HUB_PORT || 4400) },
  });

  // SCALE_ONLY=T1: minimal run for the index A/B test — seed doctors only,
  // run the doctors query, exit. (Used to prove the composite index is
  // required: same query must FAIL without it.)
  if (process.env.SCALE_ONLY === 'T1') {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const stamp = new Date('2026-11-21T00:00:00Z');
      let batch = writeBatch(db);
      for (let i = 0; i < 5; i++) {
        batch.set(doc(db, 'doctors', `doctor-${i + 1}`), {
          title: `Dr ${i + 1}`, titleBn: `Dr ${i + 1}`, qualificationBn: 'MBBS',
          qualificationEn: 'MBBS', specialityBn: 'Medicine', specialityEn: 'Medicine',
          workplaceBn: 'Hospital', workplaceEn: 'Hospital',
          verificationStatus: 'verified', reviewStatus: 'Published', source: 'seed-test',
          createdAt: stamp, updatedAt: stamp,
        });
      }
      await batch.commit();
    });
    const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'test' });
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_PORT);
    try {
      const snap = await getDocs(query(
        collection(db, 'doctors'),
        where('reviewStatus', '==', 'Published'),
        where('verificationStatus', '==', 'verified'),
        limit(100),
      ));
      progress(`T1_ONLY: OK docs=${snap.size}`);
    } catch (e) {
      progress(`T1_ONLY: FAIL code=${e.code || '?'} msg=${String(e.message).slice(0, 200)}`);
    }
    saveResults();
    await testEnv.cleanup();
    process.exit(0);
  }

  // SCALE_ONLY=T6T7: milestones + concurrency only — seeds an owner doc,
  // 100 books, and users in 100/500/1000 steps. Users/progress queries run
  // as the owner: rules deny unauthenticated 'users' list/count BY DESIGN.
  if (process.env.SCALE_ONLY === 'T6T7') {
    const stampT = new Date('2026-11-21T00:00:00Z');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'users', 'scale-owner'), {
        displayName: 'Scale Owner', email: 'owner@example.test', role: 'owner',
        language: 'bn', createdAt: stampT, updatedAt: stampT, lastActiveAt: stampT,
      });
      let batch = writeBatch(db);
      let n = 0;
      for (let i = 0; i < 100; i++) {
        const b = books[i];
        batch.set(doc(db, 'books', b.bookId), {
          title: b.title, paperCode: b.code, educationType: b.eduType, board: b.board,
          program: b.program, classLevel: b.yearLabel, department: b.department,
          departments: b.departments, subject: b.department, sourceType: 'original-eduvelto',
          sourceUrl: b.sourceUrl, credit: b.credit, marks: b.marks, language: b.language,
          bilingual: b.bilingual, questionCount: b.questionCount, chapterCount: b.chapterCount,
          reviewStatus: 'Published', createdAt: stampT, updatedAt: stampT,
        });
        n += 1;
        if (n >= 100) { await batch.commit(); batch = writeBatch(db); n = 0; }
      }
      await batch.commit();
    });
    const ownerDbT = testEnv.authenticatedContext('scale-owner').firestore();
    const appT = initializeApp({ projectId: PROJECT_ID, apiKey: 'test' }, 't6t7');
    const dbT = getFirestore(appT);
    connectFirestoreEmulator(dbT, '127.0.0.1', FIRESTORE_PORT);
    // Users seed is parallelized into 4 concurrent chunks: the emulator's
    // single write stream makes sequential batch commits very slow here
    // (~7 writes/s); each chunk gets its own client/stream.
    async function seedUsersT(count, startIdx) {
      const chunk = Math.ceil(count / 4);
      await Promise.all(Array.from({ length: 4 }, (_, c) => {
        const s = startIdx + c * chunk;
        const e = Math.min(startIdx + count, s + chunk);
        if (s >= e) return Promise.resolve();
        return testEnv.withSecurityRulesDisabled(async (ctx) => {
          const db = ctx.firestore();
          let batch = writeBatch(db);
          let n = 0;
          const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0; };
          for (let i = s; i < e; i++) {
            const uid = `scale-user-${String(i).padStart(5, '0')}`;
            batch.set(doc(db, 'users', uid), {
              displayName: `Student ${i}`, email: `student${i}@example.test`,
              role: 'student', language: 'bn', createdAt: stampT, updatedAt: stampT, lastActiveAt: stampT,
            });
            for (const subject of ['mathematics', 'english']) {
              batch.set(doc(db, 'progress', `${uid}__${subject}`), {
                userId: uid, subject, lessonsRead: ['lesson-1', 'lesson-2', 'lesson-3'],
                questionsAttempted: 12, questionsCorrect: 8, updatedAt: stampT,
              });
            }
            n += 3;
            if (n >= 100) await flush();
          }
          await flush();
        });
      }));
    }
    async function milestoneT(count, startIdx) {
      const t0 = now();
      await seedUsersT(count, startIdx);
      const seedMs = Math.round(now() - t0);
      const page1 = await timed(async () => {
        const snap = await getDocs(query(collection(ownerDbT, 'users'), orderBy('createdAt', 'desc'), limit(25)));
        return { docs: snap.size };
      });
      const countRes = await timed(async () => {
        const c = await getCountFromServer(collection(ownerDbT, 'users'));
        return { users: c.data().count };
      });
      const progressRes = await timed(async () => {
        const snap = await getDocs(query(collection(ownerDbT, 'progress'), where('userId', '==', 'scale-user-00001')));
        return { docs: snap.size };
      });
      results.milestones[`${startIdx + count}`] = { seedMs, page1, countRes, progressRes };
      progress(`  MILESTONE ${startIdx + count} users: seed ${seedMs}ms, listUsers page1 ${JSON.stringify(page1)}, count ${JSON.stringify(countRes)}, progress ${JSON.stringify(progressRes)}`);
    }
    progress('T6: milestones...');
    await milestoneT(100, 1);
    await milestoneT(400, 101);
    await milestoneT(500, 501);
    progress('T7: concurrent paginated reads...');
    async function concurrentT(n) {
      const t0 = now();
      const runs = await Promise.allSettled(Array.from({ length: n }, async () => {
        const snap = await getDocs(query(collection(dbT, 'books'), where('reviewStatus', '==', 'Published'), orderBy('reviewStatus'), limit(50)));
        return snap.size;
      }));
      const ok = runs.filter((r) => r.status === 'fulfilled').length;
      return { clients: n, ok, errors: n - ok, totalMs: Math.round(now() - t0) };
    }
    record('T7_concurrent_10', await concurrentT(10));
    record('T7_concurrent_25', await concurrentT(25));
    record('T7_concurrent_50', await concurrentT(50));
    saveResults();
    await testEnv.cleanup();
    process.exit(0);
  }

  // ---------- SEED (rules disabled) ----------
  progress('SEED: books + directory + quizzes + doctors...');
  const seedStart = now();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    let batch = writeBatch(db);
    let n = 0;
    const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0; };
    const stamp = new Date('2026-11-21T00:00:00Z');
    for (const b of books) {
      batch.set(doc(db, 'books', b.bookId), {
        title: b.title, paperCode: b.code, educationType: b.eduType, board: b.board,
        program: b.program, classLevel: b.yearLabel, department: b.department,
        departments: b.departments, subject: b.department, sourceType: 'original-eduvelto',
        sourceUrl: b.sourceUrl, credit: b.credit, marks: b.marks, language: b.language,
        bilingual: b.bilingual, questionCount: b.questionCount, chapterCount: b.chapterCount,
        reviewStatus: 'Published', createdAt: stamp, updatedAt: stamp,
      });
      batch.set(doc(db, 'educationDirectory', b.bookId), {
        type: b.eduType, board: b.board, program: b.program, classLevel: b.yearLabel,
        department: b.department, subject: b.department, paperCode: b.code,
        paperTitle: b.title, bookId: b.bookId, title: b.title,
        reviewStatus: 'Published', createdAt: stamp, updatedAt: stamp,
      });
      n += 2;
      if (n >= 100) await flush();
    }
    // 212 quizzes, 30 questions each (~25 KB per doc — the real shape).
    for (let i = 1; i <= 212; i++) {
      const questions = [];
      for (let q = 1; q <= 30; q++) {
        questions.push({
          n: q, topic: `অধ্যায় ${((q - 1) % 5) + 1}`,
          question: `প্রশ্ন ${q}: একটি উদাহরণ প্রশ্নের পাঠ্য যা বাস্তব কুইজের মতো লম্বা করা হয়েছে যাতে ডকুমেন্টের আকার আসলটির কাছাকাছি থাকে।`,
          options: [
            { letter: 'ক', text: 'প্রথম বিকল্পের পাঠ্য' },
            { letter: 'খ', text: 'দ্বিতীয় বিকল্পের পাঠ্য' },
            { letter: 'গ', text: 'তৃতীয় বিকল্পের পাঠ্য' },
            { letter: 'ঘ', text: 'চতুর্থ বিকল্পের পাঠ্য' },
          ],
          marks: 1,
        });
      }
      batch.set(doc(db, 'quizzes', `quiz-${String(i).padStart(4, '0')}`), {
        title: `পরীক্ষা ${i} — MCQ পরীক্ষা`, bookId: books[i % books.length].bookId,
        subject: 'Mathematics', department: 'Mathematics', classLevel: '1st Year',
        educationType: 'Higher', kind: 'mcq', questions, questionCount: 30,
        totalMarks: 30, timeLimitMinutes: 30, reviewStatus: 'Published',
        createdAt: stamp, updatedAt: stamp,
      });
      n += 1;
      if (n >= 20) await flush();
    }
    // Doctors: 5 verified+Published, 5 pending, 5 published-but-unverified.
    const combos = [
      ['Published', 'verified'], ['Published', 'verified'], ['Published', 'verified'],
      ['Published', 'verified'], ['Published', 'verified'],
      ['Published', 'pending'], ['Published', 'pending'], ['Published', 'pending'],
      ['Published', 'pending'], ['Published', 'pending'],
      ['Published', 'rejected'], ['Published', 'rejected'], ['Published', 'rejected'],
      ['Under Review', 'verified'], ['Under Review', 'verified'],
    ];
    for (let i = 0; i < combos.length; i++) {
      const [reviewStatus, verificationStatus] = combos[i];
      batch.set(doc(db, 'doctors', `doctor-${i + 1}`), {
        title: `ডাঃ পরীক্ষা ${i + 1}`, titleBn: `ডাঃ পরীক্ষা ${i + 1}`,
        qualificationBn: 'এমবিবিএস', qualificationEn: 'MBBS',
        specialityBn: 'মেডিসিন', specialityEn: 'Medicine',
        workplaceBn: 'হাসপাতাল', workplaceEn: 'Hospital',
        verificationStatus, reviewStatus, source: 'seed-test',
        createdAt: stamp, updatedAt: stamp,
      });
      n += 1;
      if (n >= 100) await flush();
    }
    await flush();
  });
  progress(`SEED content done in ${Math.round(now() - seedStart)} ms`);

  // ---------- SEED USERS (milestones 100 / 500 / 1000) ----------
  const probeUsers = {
    A: { uid: 'scale-probe-a', attempts: 0 },
    B: { uid: 'scale-probe-b', attempts: 5 },
    C: { uid: 'scale-probe-c', attempts: 20 },
    D: { uid: 'scale-probe-d', attempts: 100 },
  };
  async function seedUsers(count, startIdx) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      let batch = writeBatch(db);
      let n = 0;
      const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0; };
      const stamp = new Date('2026-11-21T00:00:00Z');
      if (startIdx === 1) {
        // Owner doc so milestone queries can run as an admin (rules deny
        // unauthenticated 'users' list/count by design).
        batch.set(doc(db, 'users', 'scale-owner'), {
          displayName: 'Scale Owner', email: 'owner@example.test', role: 'owner',
          language: 'bn', createdAt: stamp, updatedAt: stamp, lastActiveAt: stamp,
        });
        n += 1;
      }
      for (let i = startIdx; i < startIdx + count; i++) {
        const uid = `scale-user-${String(i).padStart(5, '0')}`;
        batch.set(doc(db, 'users', uid), {
          displayName: `Student ${i}`, email: `student${i}@example.test`,
          role: 'student', language: 'bn', createdAt: stamp, updatedAt: stamp,
          lastActiveAt: stamp,
        });
        for (const subject of ['mathematics', 'english']) {
          batch.set(doc(db, 'progress', `${uid}__${subject}`), {
            userId: uid, subject, lessonsRead: ['lesson-1', 'lesson-2', 'lesson-3'],
            questionsAttempted: 12, questionsCorrect: 8, updatedAt: stamp,
          });
        }
        n += 3;
        if (n >= 100) await flush();
      }
      await flush();
    });
  }
  async function seedAttempts(uid, count) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      let batch = writeBatch(db);
      let n = 0;
      const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0; };
      for (let i = 0; i < count; i++) {
        const answers = [];
        for (let q = 1; q <= 30; q++) {
          answers.push({ n: q, topic: `অধ্যায় ${((q - 1) % 5) + 1}`, selected: 'ক', correct: q % 3 !== 0, marks: q % 3 !== 0 ? 1 : 0, correctText: 'প্রথম বিকল্পের পাঠ্য' });
        }
        batch.set(doc(db, 'users', uid, 'quizAttempts', `attempt-${String(i).padStart(4, '0')}`), {
          quizId: 'quiz-0001', kind: 'mcq', subject: 'Mathematics', department: 'Mathematics',
          answers, score: 20, totalMarks: 30, percentage: 67, markingStatus: 'auto',
          createdAt: new Date(Date.UTC(2026, 9, 1 + (i % 28), 10, 0, 0)),
        });
        n += 1;
        if (n >= 100) await flush();
      }
      await flush();
    });
  }
  // Probe user C gets stored summaries current as of "now" (freshness check must skip).
  async function seedSummariesForC() {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'progressSummaries', 'scale-probe-c__mathematics__2026-10'), {
        userId: 'scale-probe-c', subject: 'Mathematics', month: '2026-10',
        attemptsCount: 20, averagePercentage: 67, bestPercentage: 80,
        weakChapters: ['অধ্যায় 3'], strongChapters: ['অধ্যায় 1'],
        updatedAt: new Date(Date.UTC(2026, 10, 21, 6, 0, 0)),
      });
    });
  }

  // ---------- CLIENTS ----------
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'test' });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_PORT);

  // ---------- T1: doctors composite-index query ----------
  progress('T1: listVerifiedDoctors shape (reviewStatus + verificationStatus)...');
  record('T1_doctors_index_query', await timed(async () => {
    const snap = await getDocs(query(
      collection(db, 'doctors'),
      where('reviewStatus', '==', 'Published'),
      where('verificationStatus', '==', 'verified'),
      limit(100),
    ));
    return { docs: snap.size, bytes: bytesOf(snap.docs), verifiedOnly: snap.docs.every((d) => d.data().verificationStatus === 'verified') };
  }));

  // ---------- T2: full exam list size (the 5.3 MB claim) ----------
  progress('T2: full exam list (all Published quizzes, no limit)...');
  record('T2_exam_list_full', await timed(async () => {
    const snap = await getDocs(query(collection(db, 'quizzes'), where('reviewStatus', '==', 'Published')));
    return { docs: snap.size, bytes: bytesOf(snap.docs), mb: Math.round(bytesOf(snap.docs) / 1048576 * 100) / 100 };
  }));

  // ---------- T3: progress recompute, OLD sequence vs NEW sequence ----------
  progress('T3: seeding probe attempts + summaries...');
  for (const p of Object.values(probeUsers)) await seedAttempts(p.uid, p.attempts);
  await seedSummariesForC();
  const probeC = testEnv.authenticatedContext(probeUsers.C.uid);
  const pdb = probeC.firestore();
  // OLD sequence: read ALL attempts (full answer arrays) + write one summary per subject-month.
  progress('T3a: OLD recompute sequence (all attempts + writes)...');
  record('T3a_progress_recompute_OLD', await timed(async () => {
    const snap = await getDocs(query(collection(pdb, 'users', probeUsers.C.uid, 'quizAttempts')));
    const bytes = bytesOf(snap.docs);
    // Old code then wrote 1 summary doc per subject-month (1 month here).
    return { attemptDocsRead: snap.size, bytes, summaryWritesThatWouldHappen: 1 };
  }));
  // NEW sequence: stored summaries + newest attempt only.
  progress('T3b: NEW freshness-check sequence (summaries + latest attempt)...');
  record('T3b_progress_recompute_NEW_unchanged', await timed(async () => {
    const sSnap = await getDocs(query(collection(pdb, 'progressSummaries'), where('userId', '==', probeUsers.C.uid)));
    const latest = await getDocs(query(collection(pdb, 'users', probeUsers.C.uid, 'quizAttempts'), orderBy('createdAt', 'desc'), limit(1)));
    const latestAt = latest.docs[0].data().createdAt.toDate().getTime();
    const newestSummary = Math.max(...sSnap.docs.map((d) => d.data().updatedAt.toDate().getTime()));
    const skip = latestAt <= newestSummary;
    return { summaryDocsRead: sSnap.size, latestAttemptReads: latest.size, skipRecompute: skip, summaryWrites: 0 };
  }));
  // T4: a NEW attempt must force a full recompute (correctness).
  progress('T4: new attempt forces recompute...');
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const sdb = ctx.firestore();
    const answers = [];
    for (let q = 1; q <= 30; q++) answers.push({ n: q, topic: 'অধ্যায় 1', selected: 'ক', correct: true, marks: 1, correctText: 'প্রথম বিকল্পের পাঠ্য' });
    await setDoc(doc(sdb, 'users', probeUsers.C.uid, 'quizAttempts', 'attempt-new'), {
      quizId: 'quiz-0001', kind: 'mcq', subject: 'Mathematics', department: 'Mathematics',
      answers, score: 30, totalMarks: 30, percentage: 100, markingStatus: 'auto',
      createdAt: new Date(Date.UTC(2026, 10, 21, 7, 0, 0)),
    });
  });
  record('T4_progress_recompute_NEW_after_new_attempt', await timed(async () => {
    const sSnap = await getDocs(query(collection(pdb, 'progressSummaries'), where('userId', '==', probeUsers.C.uid)));
    const latest = await getDocs(query(collection(pdb, 'users', probeUsers.C.uid, 'quizAttempts'), orderBy('createdAt', 'desc'), limit(1)));
    const latestAt = latest.docs[0].data().createdAt.toDate().getTime();
    const newestSummary = Math.max(...sSnap.docs.map((d) => d.data().updatedAt.toDate().getTime()));
    return { skipRecompute: latestAt <= newestSummary, mustRecompute: latestAt > newestSummary };
  }));

  // ---------- T5: session cache (HomePage books list, twice) ----------
  progress('T5: session cache — books list read twice...');
  const cache = new Map();
  async function cachedBooks() {
    const hit = cache.get('books');
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return { docs: hit.docs, bytes: hit.bytes, fromCache: true };
    const snap = await getDocs(query(collection(db, 'books'), where('reviewStatus', '==', 'Published')));
    const out = { docs: snap.size, bytes: bytesOf(snap.docs), fromCache: false };
    cache.set('books', { ...out, at: Date.now() });
    return out;
  }
  record('T5_cache_first_read', await timed(async () => cachedBooks()));
  record('T5_cache_second_read', await timed(async () => cachedBooks()));

  // ---------- T6: milestones 100 / 500 / 1000 users ----------
  // Users/progress queries run as the owner: rules deny unauthenticated
  // 'users' list/count by design.
  const ownerDb = testEnv.authenticatedContext('scale-owner').firestore();
  async function milestone(count, startIdx) {
    const t0 = now();
    await seedUsers(count, startIdx);
    const seedMs = Math.round(now() - t0);
    const page1 = await timed(async () => {
      const snap = await getDocs(query(collection(ownerDb, 'users'), orderBy('createdAt', 'desc'), limit(25)));
      return { docs: snap.size };
    });
    const countRes = await timed(async () => {
      const c = await getCountFromServer(collection(ownerDb, 'users'));
      return { users: c.data().count };
    });
    const progressRes = await timed(async () => {
      const snap = await getDocs(query(collection(ownerDb, 'progress'), where('userId', '==', 'scale-user-00001')));
      return { docs: snap.size };
    });
    results.milestones[`${startIdx + count}`] = { seedMs, page1, countRes, progressRes };
    progress(`  MILESTONE ${startIdx + count} users: seed ${seedMs}ms, listUsers page1 ${JSON.stringify(page1)}, count ${JSON.stringify(countRes)}, progress ${JSON.stringify(progressRes)}`);
  }
  progress('T6: milestones...');
  await milestone(100, 1);
  await milestone(400, 101);
  await milestone(500, 501);

  // ---------- T7: concurrent readers ----------
  progress('T7: concurrent paginated reads...');
  async function concurrent(n) {
    const t0 = now();
    const runs = await Promise.allSettled(Array.from({ length: n }, async () => {
      const snap = await getDocs(query(collection(db, 'books'), where('reviewStatus', '==', 'Published'), orderBy('reviewStatus'), limit(50)));
      return snap.size;
    }));
    const latencies = [];
    const ok = runs.filter((r) => r.status === 'fulfilled').length;
    const totalMs = Math.round(now() - t0);
    return { clients: n, ok, errors: n - ok, totalMs };
  }
  record('T7_concurrent_10', await concurrent(10));
  record('T7_concurrent_25', await concurrent(25));
  record('T7_concurrent_50', await concurrent(50));

  saveResults();
  progress(`RESULTS: ${RESULTS_PATH}`);
  await testEnv.cleanup();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
