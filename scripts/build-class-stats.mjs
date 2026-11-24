// Eduvelto — class stats aggregation (fix/read-usage, 22 Nov 2026).
//
// PURE module (no Firestore, no auth): given the in-memory book + quiz
// lists, build one loader-maintained stats doc per class level. The
// dashboard + class index read ONE stats doc (1 read) instead of
// counting/reading hundreds of books + quizzes per visit.
//
// PLACEMENT (zero rules change — the compiled-rules margin is only
// ~1,138 bytes, so no new match may be added): stats docs live in
// `leaderboardSnapshots` as `classStats-<slug>` with `kind:
// 'classStats'`. That collection's rule is already `allow read: if
// true; allow write: if isModerator();` — public read, moderator-only
// write, no field validation, and NO client code lists it (only
// src/lib/backup.ts lists it for backup), so a stats doc can never
// leak into a list UI. The client reads it by exact doc id only
// (src/lib/classStats.ts). `leaderboardSnapshots` is already in
// BACKUP_COLLECTIONS, so stats docs are backed up with everything else.
//
// Stats docs carry ONLY aggregates + quiz titles — no questions, no
// answer keys — so public read is safe. A guest sees the quiz COUNT
// (e.g. "199 tests — sign in") but the quiz LIST stays signed-in-only.
//
// Two writers, one doc — MERGE semantics: the library loader owns the
// book half, the quiz loader owns the quiz half. Each PATCHes only its
// own fields (see writeClassStats in the loader scripts); the `subjects`
// array is read-merge-written so neither half clobbers the other's
// per-subject counts. Loaders run sequentially, never concurrently.
// The standalone scripts/write-class-stats.mjs writes BOTH halves at
// once (single writer, no merge needed).
//
// Usage: node scripts/build-class-stats.mjs   (self-test with fixtures)
// Imported by: scripts/load-library-content.mjs, scripts/load-quizzes.mjs,
//   scripts/write-class-stats.mjs

export const CLASS_STATS_COLLECTION = 'leaderboardSnapshots';

/** Dashboard levels, mirroring CLASS_LEVELS in src/lib/classLevels.ts. */
export const CLASS_LEVEL_GROUPS = [
  { slug: 'class-1-5', educationType: null, classLevels: [] },
  { slug: 'class-6-8', educationType: null, classLevels: [] },
  { slug: 'class-9-10', educationType: 'SSC', classLevels: ['SSC'] },
  { slug: 'hsc', educationType: 'HSC', classLevels: ['HSC'] },
  {
    slug: 'honours-masters',
    educationType: 'Higher',
    classLevels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  },
  {
    slug: 'technical',
    educationType: 'Technical',
    classLevels: ['Ssc Vocational', 'Hsc Vocational', 'Bmt'],
  },
  {
    slug: 'madrasa',
    educationType: 'Madrasa',
    classLevels: ['Alim', 'Dakhil', 'Fazil', 'Kamil'],
  },
];

export function classStatsDocId(slug) {
  return `classStats-${slug}`;
}

/** Strip the " — MCQ পরীক্ষা / লিখিত পরীক্ষা" suffix (mirrors bookTitleOf in src/lib/exams.ts). */
export function quizDisplayTitle(title) {
  return String(title ?? '').replace(/ — (MCQ পরীক্ষা|লিখিত পরীক্ষা)$/, '');
}

function emptySubject(name) {
  return { name, bookCount: 0, questionCount: 0, chapterCount: 0, quizCount: 0 };
}

/**
 * Aggregate books + quizzes into one stats doc per level.
 * books:   [{ educationType, classLevel, department, questionCount, chapterCount }]
 * quizzes: [{ id, title, educationType, classLevel, department, questionCount }]
 * Returns: [{ slug, educationType, classLevels, bookCount, quizCount,
 *   totalQuestions, totalChapters, totalQuizQuestions,
 *   subjects: [{ name, bookCount, questionCount, chapterCount, quizCount }],
 *   quizTitles: { [quizId]: displayTitle }, updatedAt }]
 * Levels with no books/quizzes get honest zero counts (their dashboards
 * show "not ready yet" from the stats doc instead of a full-list fetch).
 */
export function aggregateClassStats(books, quizzes) {
  const now = new Date().toISOString();
  return CLASS_LEVEL_GROUPS.map((g) => {
    const inLevel = (b) =>
      g.educationType !== null &&
      b.educationType === g.educationType &&
      g.classLevels.includes(b.classLevel);
    const levelBooks = (books ?? []).filter(inLevel);
    const levelQuizzes = (quizzes ?? []).filter(inLevel);
    const subjects = new Map();
    for (const b of levelBooks) {
      const name = b.department || b.subject || '';
      if (!name) continue;
      const s = subjects.get(name) ?? emptySubject(name);
      s.bookCount += 1;
      s.questionCount += b.questionCount ?? 0;
      s.chapterCount += b.chapterCount ?? 0;
      subjects.set(name, s);
    }
    for (const q of levelQuizzes) {
      const name = q.department || q.subject || '';
      if (!name) continue;
      const s = subjects.get(name) ?? emptySubject(name);
      s.quizCount += 1;
      subjects.set(name, s);
    }
    const quizTitles = {};
    for (const q of levelQuizzes) quizTitles[q.id] = quizDisplayTitle(q.title);
    return {
      slug: g.slug,
      educationType: g.educationType,
      classLevels: [...g.classLevels],
      bookCount: levelBooks.length,
      quizCount: levelQuizzes.length,
      totalQuestions: levelBooks.reduce((s, b) => s + (b.questionCount ?? 0), 0),
      totalChapters: levelBooks.reduce((s, b) => s + (b.chapterCount ?? 0), 0),
      totalQuizQuestions: levelQuizzes.reduce((s, q) => s + (q.questionCount ?? 0), 0),
      subjects: [...subjects.values()].sort((a, b) => a.name.localeCompare(b.name)),
      quizTitles,
      updatedAt: now,
    };
  });
}

/** Book-half fields only (library loader PATCH). Quiz-half fields are left untouched. */
export function bookHalfFields(stat) {
  return {
    slug: stat.slug,
    educationType: stat.educationType,
    classLevels: stat.classLevels,
    bookCount: stat.bookCount,
    totalQuestions: stat.totalQuestions,
    totalChapters: stat.totalChapters,
    updatedAt: stat.updatedAt,
  };
}

/** Quiz-half fields only (quiz loader PATCH). Book-half fields are left untouched. */
export function quizHalfFields(stat) {
  return {
    slug: stat.slug,
    educationType: stat.educationType,
    classLevels: stat.classLevels,
    quizCount: stat.quizCount,
    totalQuizQuestions: stat.totalQuizQuestions,
    quizTitles: stat.quizTitles,
    updatedAt: stat.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// REST write helper (used by the loaders + scripts/write-class-stats.mjs).
// fsFetch / enc / dec are injected — every loader already defines them
// with the same shape (load-library-content.mjs, load-quizzes.mjs).
//
// One doc per level in `leaderboardSnapshots` (see placement note above).
// `half` is 'book' | 'quiz' | 'both': a half-PATCH touches ONLY that
// half's fields; the `subjects` array is read-merge-written so neither
// half clobbers the other's per-subject counts. A missing doc is created
// with the written half's real values and the other half's zeros.
// Single set — NO draft->publish dance: leaderboardSnapshots allows
// moderator write outright (isModerator() covers owner/admin/moderator).
// ---------------------------------------------------------------------------
export async function writeStatsHalf({ fsFetch, enc, dec }, stat, half) {
  const docId = classStatsDocId(stat.slug);
  const coll = CLASS_STATS_COLLECTION;
  const getRes = await fsFetch(`/${coll}/${docId}`);
  let existing = null;
  if (getRes.status === 404) existing = null;
  else if (!getRes.ok) throw new Error(`GET ${coll}/${docId} -> HTTP ${getRes.status}`);
  else {
    const data = await getRes.json();
    existing = {};
    for (const [k, v] of Object.entries(data.fields ?? {})) existing[k] = dec(v);
  }
  const now = new Date().toISOString();
  // Merge subjects: keep the other half's counts from the existing doc.
  const mergedSubjects = new Map();
  for (const s of existing?.subjects ?? []) {
    mergedSubjects.set(s.name, { ...s });
  }
  for (const s of stat.subjects) {
    const cur = mergedSubjects.get(s.name) ?? {
      name: s.name, bookCount: 0, questionCount: 0, chapterCount: 0, quizCount: 0,
    };
    if (half === 'book' || half === 'both') {
      cur.bookCount = s.bookCount;
      cur.questionCount = s.questionCount;
      cur.chapterCount = s.chapterCount;
    }
    if (half === 'quiz' || half === 'both') cur.quizCount = s.quizCount;
    mergedSubjects.set(s.name, cur);
  }
  const subjects = [...mergedSubjects.values()].sort((a, b) => a.name.localeCompare(b.name));
  const common = {
    kind: 'classStats',
    slug: stat.slug,
    educationType: stat.educationType,
    classLevels: stat.classLevels,
    subjects,
    updatedAt: now,
  };
  const bookFields = {
    bookCount: stat.bookCount,
    totalQuestions: stat.totalQuestions,
    totalChapters: stat.totalChapters,
  };
  const quizFields = {
    quizCount: stat.quizCount,
    totalQuizQuestions: stat.totalQuizQuestions,
    quizTitles: stat.quizTitles,
  };
  if (!existing) {
    const full = {
      ...common,
      ...(half === 'quiz' ? { bookCount: 0, totalQuestions: 0, totalChapters: 0 } : bookFields),
      ...(half === 'book' ? { quizCount: 0, totalQuizQuestions: 0, quizTitles: {} } : quizFields),
    };
    const body = { fields: Object.fromEntries(Object.entries(full).map(([k, v]) => [k, enc(v)])) };
    const res = await fsFetch(`/${coll}?documentId=${encodeURIComponent(docId)}`, { method: 'POST', body });
    if (!res.ok) throw new Error(`POST ${coll}/${docId} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return 'created';
  }
  const patch = {
    ...common,
    ...(half === 'book' || half === 'both' ? bookFields : {}),
    ...(half === 'quiz' || half === 'both' ? quizFields : {}),
  };
  const body = { fields: Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, enc(v)])) };
  const mask = Object.keys(patch).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fsFetch(`/${coll}/${docId}?${mask}`, { method: 'PATCH', body });
  if (!res.ok) throw new Error(`PATCH ${coll}/${docId} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return 'updated';
}

// ---------------------------------------------------------------------------
// Self-test (node scripts/build-class-stats.mjs)
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const books = [
    { educationType: 'Higher', classLevel: '1st Year', department: 'English', questionCount: 38, chapterCount: 4 },
    { educationType: 'Higher', classLevel: '2nd Year', department: 'English', questionCount: 20, chapterCount: 2 },
    { educationType: 'Higher', classLevel: '1st Year', department: 'Bangla', questionCount: 10, chapterCount: 1 },
    { educationType: 'SSC', classLevel: 'SSC', department: 'Science', questionCount: 5, chapterCount: 1 },
  ];
  const quizzes = [
    { id: 'q1', title: 'Book A — MCQ পরীক্ষা', educationType: 'Higher', classLevel: '1st Year', department: 'English', questionCount: 12 },
    { id: 'q2', title: 'Book B — লিখিত পরীক্ষা', educationType: 'Higher', classLevel: '2nd Year', department: 'English', questionCount: 8 },
    { id: 'q3', title: 'Book C — MCQ পরীক্ষা', educationType: 'SSC', classLevel: 'SSC', department: 'Science', questionCount: 12 },
  ];
  const stats = aggregateClassStats(books, quizzes);
  const assert = (cond, msg) => {
    if (!cond) {
      console.error(`FAIL: ${msg}`);
      process.exit(1);
    }
  };
  const hons = stats.find((s) => s.slug === 'honours-masters');
  assert(hons.bookCount === 3, 'honours bookCount 3');
  assert(hons.quizCount === 2, 'honours quizCount 2');
  assert(hons.totalQuestions === 68, 'honours totalQuestions 68');
  assert(hons.totalChapters === 7, 'honours totalChapters 7');
  assert(hons.totalQuizQuestions === 20, 'honours totalQuizQuestions 20');
  assert(hons.subjects.find((s) => s.name === 'English').bookCount === 2, 'English bookCount 2');
  assert(hons.subjects.find((s) => s.name === 'English').quizCount === 2, 'English quizCount 2');
  assert(hons.subjects.find((s) => s.name === 'Bangla').quizCount === 0, 'Bangla quizCount 0');
  assert(hons.quizTitles.q1 === 'Book A', 'quizTitles strips MCQ suffix');
  assert(hons.quizTitles.q2 === 'Book B', 'quizTitles strips written suffix');
  const ssc = stats.find((s) => s.slug === 'class-9-10');
  assert(ssc.bookCount === 1 && ssc.quizCount === 1, 'ssc 1/1');
  const empty = stats.find((s) => s.slug === 'class-1-5');
  assert(empty.bookCount === 0 && empty.quizCount === 0 && empty.subjects.length === 0, 'empty level zeros');
  assert(classStatsDocId('honours-masters') === 'classStats-honours-masters', 'doc id');
  console.log('build-class-stats self-test: PASS (5 levels aggregated)');
}
