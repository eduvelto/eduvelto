// Eduvelto — D-2 verification: cascading-filter fields in the EMULATOR.
// Reads books + educationDirectory (+ chapter/lesson counts) from the local
// Firestore emulator (default 127.0.0.1:8180) and checks:
//   1. counts: 609 books, 609 directory rows, 2109 chapters, 2109 lessons.
//   2. every book/row carries stream/level/group, derived ONLY from the
//      legacy fields, matching src/lib/taxonomy.ts CASCADE_STREAMS.
//   3. per-stream totals: general 63, madrasa 35, technical 72, higher 439.
//   4. no fallback derivations (unknown educationType) and no missing fields.
// Emulator-only (Bearer owner). Never touches live Firestore.
//   node scripts/verify-emulator-cascade.mjs [host:port]

const HOST = process.argv[2] ?? '127.0.0.1:8180';
const BASE = `http://${HOST}/v1/projects/eduvelto/databases/(default)/documents`;

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

// MUST match scripts/load-library-content.mjs deriveCascadeFields and
// src/lib/taxonomy.ts CASCADE_STREAMS.
function expected(type, program, classLevel, department) {
  if (type === 'SSC') return { stream: 'general', level: 'Secondary', group: program };
  if (type === 'HSC') return { stream: 'general', level: 'Higher Secondary', group: program };
  if (type === 'Madrasa') return { stream: 'madrasa', level: program, group: program };
  if (type === 'Technical') return { stream: 'technical', level: program, group: program };
  if (type === 'Higher') return { stream: 'higher', level: program, group: department };
  return null;
}

async function listAll(collection) {
  const out = [];
  let pageToken = '';
  do {
    const url = `${BASE}/${collection}?pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer owner' } });
    if (!res.ok) throw new Error(`GET ${collection} -> HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    for (const doc of body.documents ?? []) {
      const fields = {};
      for (const [k, v] of Object.entries(doc.fields ?? {})) fields[k] = dec(v);
      fields._id = doc.name.split('/').pop();
      out.push(fields);
    }
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

async function main() {
  const books = await listAll('books');
  const dirs = await listAll('educationDirectory');
  const chapters = await listAll('chapters');
  const lessons = await listAll('lessons');
  console.log(`COUNTS: books=${books.length} directory=${dirs.length} chapters=${chapters.length} lessons=${lessons.length}`);

  const problems = [];
  const streamCounts = {};
  const levelCounts = {};
  for (const b of books) {
    const exp = expected(b.educationType, b.program, b.classLevel, b.department);
    if (!exp) { problems.push(`${b._id}: unknown educationType ${b.educationType}`); continue; }
    if (b.stream !== exp.stream || b.level !== exp.level || b.group !== exp.group) {
      problems.push(`${b._id}: stored (${b.stream}/${b.level}/${b.group}) != expected (${exp.stream}/${exp.level}/${exp.group})`);
    }
    if (b.reviewStatus !== 'Published') problems.push(`${b._id}: reviewStatus=${b.reviewStatus}`);
    streamCounts[b.stream] = (streamCounts[b.stream] ?? 0) + 1;
    levelCounts[`${b.stream}/${b.level}`] = (levelCounts[`${b.stream}/${b.level}`] ?? 0) + 1;
  }
  console.log('STREAM COUNTS (books):', JSON.stringify(streamCounts));
  console.log('LEVEL COUNTS (books):', JSON.stringify(levelCounts));

  const dirIds = new Set(dirs.map((d) => d._id));
  for (const b of books) if (!dirIds.has(b._id)) problems.push(`${b._id}: no educationDirectory row`);
  for (const d of dirs) {
    const exp = expected(d.type, d.program, d.classLevel, d.department);
    if (!exp) { problems.push(`dir ${d._id}: unknown type ${d.type}`); continue; }
    if (d.stream !== exp.stream || d.level !== exp.level || d.group !== exp.group) {
      problems.push(`dir ${d._id}: stored (${d.stream}/${d.level}/${d.group}) != expected (${exp.stream}/${exp.level}/${exp.group})`);
    }
    if (d.reviewStatus !== 'Published') problems.push(`dir ${d._id}: reviewStatus=${d.reviewStatus}`);
    if (d.bookId !== d._id) problems.push(`dir ${d._id}: bookId=${d.bookId}`);
  }
  // Published counts per stream in the directory must match books.
  const dirStreamCounts = {};
  for (const d of dirs) dirStreamCounts[d.stream] = (dirStreamCounts[d.stream] ?? 0) + 1;
  console.log('STREAM COUNTS (directory):', JSON.stringify(dirStreamCounts));

  const expectCounts = { books: 609, directory: 609, chapters: 2109, lessons: 2109 };
  const got = { books: books.length, directory: dirs.length, chapters: chapters.length, lessons: lessons.length };
  for (const [k, v] of Object.entries(expectCounts)) {
    if (got[k] !== v) problems.push(`count ${k}: got ${got[k]}, expected ${v}`);
  }
  const expectStreams = { general: 63, madrasa: 35, technical: 72, higher: 439 };
  for (const [s, v] of Object.entries(expectStreams)) {
    if (streamCounts[s] !== v) problems.push(`stream ${s}: got ${streamCounts[s] ?? 0}, expected ${v}`);
    if (dirStreamCounts[s] !== v) problems.push(`dir stream ${s}: got ${dirStreamCounts[s] ?? 0}, expected ${v}`);
  }

  if (problems.length === 0) {
    console.log('VERIFY OK: all counts match; every book + directory row carries the correct stream/level/group.');
  } else {
    console.log(`VERIFY FAIL: ${problems.length} problem(s):`);
    for (const p of problems.slice(0, 30)) console.log('  -', p);
    process.exit(1);
  }
}

main().catch((e) => { console.error('VERIFY ERROR:', e.message); process.exit(1); });
