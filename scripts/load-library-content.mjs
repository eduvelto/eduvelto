// Eduvelto — Library content loader (Phase 2, Step 2).
//
// Parses the Markdown question packs under ~/workspace/eduorbit/content/
// and loads them into live Firestore (project "eduvelto") as:
//   books/{bookId}            — one per paper code (variants merged as extra sets)
//   chapters/{bookId}--part-{a|b|c}[-set2]
//   lessons/{same id}         — one per chapter (body + structured questions)
//   educationDirectory/{bookId}
// Every doc is created as a draft ("Under Review") and then published
// ("Published") — the live security rules require that two-step flow for
// client writes. The 231101 broad/extra pack stays Draft on purpose (it
// proves drafts stay invisible to students).
//
// Auth: reuses the Firebase CLI login already on this machine
// (~/.config/configstore/firebase-tools.json + the CLI's own OAuth client).
// The refresh token / client secret are read at runtime and NEVER printed
// or written anywhere. The access token lives only in memory.
//
// RE-RUNNABLE: document IDs are deterministic (Honours = hons-{code},
// Madrasa = mad-{slug}, other = edu-{slug}), so re-running after a pack
// is edited updates the same docs in place (create-or-patch). Files the
// content agent modified in the last 2 minutes are skipped (still being
// written) and picked up by the next run. Safe to re-run any time.
//
// Usage:
//   node scripts/load-library-content.mjs [--dry-run] [--only <folder>]
//     [--limit <n>] [--verbose]
//   --dry-run : parse everything, print the plan, write nothing.
//   --only    : load only one content folder, e.g. honours-english-3rd-year
//   --limit   : load at most N packs (for a staged load).

import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = '/home/hatch/workspace/eduorbit/content';
const PROJECT_ID = 'eduvelto';
const REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const LOG_PATH = join(__dirname, 'load-library-content-log.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const ONLY_FOLDER = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const VERBOSE = args.includes('--verbose');

// ---------------------------------------------------------------------------
// Firestore REST value encoding
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

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getDoc(collection, id) {
  const res = await fsFetch(`/${collection}/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const out = {};
  for (const [k, v] of Object.entries(data.fields ?? {})) out[k] = dec(v);
  return out;
}

// Canonical JSON (sorted keys, Dates as ISO) for cheap equality checks.
function canon(v) {
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

// Create as draft, or PATCH only the fields that actually changed when the
// doc already exists. The target reviewStatus is applied in the same call.
// Returns 'created' | 'updated' | 'unchanged'. Re-runs are therefore cheap:
// unchanged docs cost one GET (a read) and zero writes.
async function upsertPublished(collection, id, fields, publish) {
  const target = publish ? 'Published' : 'Under Review';
  const now = new Date();
  const existing = await getDoc(collection, id);
  if (!existing) {
    const body = { fields: Object.fromEntries(Object.entries({ ...fields, reviewStatus: 'Under Review', createdAt: now, updatedAt: now }).map(([k, v]) => [k, enc(v)])) };
    const res = await fsFetch(`/${collection}?documentId=${encodeURIComponent(id)}`, { method: 'POST', body });
    if (!res.ok) throw new Error(`POST ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    if (publish) await setReviewStatus(collection, id, 'Published');
    return 'created';
  }
  const strip = (o) => { const c = { ...o }; delete c.createdAt; delete c.updatedAt; delete c.reviewStatus; return c; };
  const same = canon(strip(existing)) === canon(strip(fields));
  if (same && existing.reviewStatus === target) return 'unchanged';
  const patchFields = same
    ? { reviewStatus: target, updatedAt: now }
    : { ...fields, reviewStatus: target, updatedAt: now };
  const body = { fields: Object.fromEntries(Object.entries(patchFields).map(([k, v]) => [k, enc(v)])) };
  const mask = Object.keys(patchFields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await fsFetch(`/${collection}/${id}?${mask}`, { method: 'PATCH', body });
  if (!res.ok) throw new Error(`PATCH ${collection}/${id} -> HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
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
// Pack parsing
// ---------------------------------------------------------------------------
const DEPT_NAMES = {
  english: 'English', bangla: 'Bangla', economics: 'Economics',
  'political-science': 'Political Science', mathematics: 'Mathematics',
  accounting: 'Accounting', management: 'Management', history: 'History',
  'islamic-history': 'Islamic History & Culture', philosophy: 'Philosophy',
  sociology: 'Sociology', physics: 'Physics', chemistry: 'Chemistry',
  botany: 'Botany', zoology: 'Zoology',
};
const BN_DIGITS = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
function normDigits(s) { return s.replace(/[০-৯]/g, (d) => BN_DIGITS[d]); }

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

// Folder name -> curriculum placement. Honours folders are
// honours-{dept}-{1st|2nd|3rd|4th}-year; madrasa folders are
// madrasa-{alim|dakhil|fazil|kamil}; anything else falls back to a
// generic split (never crash on a new folder the content agent adds).
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
    return {
      type: 'Madrasa', board: 'Bangladesh Madrasa Education Board', program: level,
      deptSlug: 'madrasa', department: 'Madrasa', yearNum: 0, yearLabel: level,
    };
  }
  const hm2 = folderName.match(/^(hsc|ssc)-(.+)$/);
  if (hm2) {
    const stream = hm2[2].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      type: hm2[1].toUpperCase(), board: 'Board of Intermediate and Secondary Education',
      program: stream, deptSlug: hm2[2], department: stream,
      yearNum: 0, yearLabel: hm2[1].toUpperCase(),
    };
  }
  const tm = folderName.match(/^technical-(.+)$/);
  if (tm) {
    const prog = tm[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      type: 'Technical', board: 'Bangladesh Technical Education Board', program: prog,
      deptSlug: tm[1], department: prog, yearNum: 0, yearLabel: prog,
    };
  }
  const parts = folderName.split('-');
  const type = parts[0].toUpperCase();
  const rest = parts.slice(1).join(' ').replace(/\b\w/g, (c) => c.toUpperCase()) || folderName;
  return {
    type, board: '', program: rest, deptSlug: folderName,
    department: rest, yearNum: 0, yearLabel: rest,
  };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function detectLanguage(text) {
  const sample = text.slice(0, 20000);
  const bn = (sample.match(/[\u0980-\u09FF]/g) || []).length;
  const ar = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  if (bn > 200 && bn >= ar) return 'bn';
  if (ar > 200 && ar > bn) return 'ar';
  return 'en';
}

// Split a part's markdown into question blocks. A block starts at a line
// like **Q1. ...**, **SA3. ...**, **B2. ...**, **E5. ...** or **প্রশ্ন ৩. ...**
const Q_START = /^\*\*\s*(Q|SA|B|E|প্রশ্ন)\s*([0-9০-৯]+)\s*\.\s*(.*)$/;
const ANSWER_MARKERS = [
  { re: /^\*\*\s*Answer \(English\):\*\*\s*(.*)$/, field: 'answer' },
  { re: /^\*\*\s*উত্তর \(বাংলায়\):\*\*\s*(.*)$/, field: 'answerBn' },
  { re: /^-\s*\*\*\s*Correct answer:\s*([A-D])\)\s*(.*?)\s*\*\*\s*$/, field: 'correct' },
  { re: /^-\s*\*\*\s*সহজ বাংলা উত্তর:\*\*\s*(.*)$/, field: 'answerBn' },
  { re: /^-\s*\*\*\s*সহজ ব্যাখ্যা:\*\*\s*(.*)$/, field: 'explanation' },
  { re: /^\*\*\s*সহজ উত্তর:\*\*\s*(.*)$/, field: 'answer' },
  { re: /^\*\*\s*উত্তর:\*\*\s*(.*)$/, field: 'answer' },
];
const OPTION_RE = /^-\s*([A-D])\)\s*(.*)$/;

function parsePart(partText) {
  // Cut the trailing answer-key / notes / end-of-pack sections — they are
  // not questions and must not be glued onto the last answer.
  const lines = partText.split('\n');
  const cutAt = lines.findIndex((l) => /^##\s+(Answer key|Notes)/.test(l) || /^\*End of Pack/.test(l));
  const kept = (cutAt >= 0 ? lines.slice(0, cutAt) : lines).join('\n');
  const body = kept.trim();
  const questions = [];
  let current = null;
  let topic = '';
  let currentField = null;
  const push = () => { if (current) questions.push(current); current = null; currentField = null; };
  for (const rawLine of kept.split('\n')) {
    const line = rawLine.trim();
    if (!line || line === '---') continue;
    const topicM = line.match(/^##\s+(.+)$/);
    if (topicM) { topic = topicM[1].trim(); continue; }
    const qM = line.match(Q_START);
    if (qM) {
      push();
      const num = parseInt(normDigits(qM[2]), 10);
      const kind = qM[1] === 'প্রশ্ন' ? 'short' : qM[1];
      current = { n: num, kind, label: `${qM[1]}${normDigits(qM[2])}`, question: qM[3].replace(/\*\*$/, '').trim(), topic, options: [], correctLetter: '', correctText: '', answer: '', answerBn: '', explanation: '' };
      currentField = null;
      continue;
    }
    if (!current) continue; // preamble text inside the part (intro lines)
    let matched = false;
    for (const { re, field } of ANSWER_MARKERS) {
      const m = line.match(re);
      if (m) {
        matched = true;
        if (field === 'correct') {
          current.correctLetter = m[1];
          current.correctText = m[2];
          current.answer = m[2];
        } else {
          current[field] = m[1].trim();
        }
        currentField = field === 'correct' ? null : field;
        break;
      }
    }
    if (matched) continue;
    const optM = line.match(OPTION_RE);
    if (optM && !currentField) {
      current.options.push({ letter: optM[1], text: optM[2].trim() });
      continue;
    }
    // Continuation line of the current answer field (bullets, paragraphs).
    if (currentField) {
      const clean = line.replace(/^-\s+/, '');
      current[currentField] = current[currentField] ? `${current[currentField]}\n${clean}` : clean;
    }
  }
  push();
  return { body, questions };
}

function parsePack(filePath, folderName) {
  const text = readFileSync(filePath, 'utf8');
  const header = parseHeaderTable(text);
  // Course code (digits only — a value counts as a numeric code ONLY if
  // the whole value is digits; an identifier like
  // MADRASA-ALIM-ARABIC-1ST-PAPER must NOT be reduced to the digits inside
  // it), or the madrasa "Subject identifier" with its
  // "(subject + level — ...)" note stripped.
  const rawCode = (header['Course code'] || header['Subject identifier'] || '').split('(')[0].trim();
  const numCode = /^[0-9]+$/.test(normDigits(rawCode)) ? normDigits(rawCode) : '';
  // HSC/SSC/technical packs deliberately carry no official code (the pack
  // authors do not invent one): derive a stable identifier from level +
  // paper slug instead — never an invented numeric code.
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
  const { deptSlug, department, yearNum, yearLabel } = place;
  const credit = parseInt(normDigits(header.Credit || '').replace(/[^0-9]/g, ''), 10) || null;
  const marks = parseInt(normDigits(header.Marks || '').replace(/[^0-9]/g, ''), 10) || null;
  const isBangla = /^\*\*\s*প্রশ্ন/m.test(text);
  const isBilingual = /\*\*\s*উত্তর \(বাংলায়\):/.test(text) || /সহজ বাংলা উত্তর/.test(text) || /ব্যাখ্যা \(বাংলায়\)/.test(text);
  const language = detectLanguage(text);
  // First URL in the file (syllabus source); else the book's own library URL.
  const urlM = text.match(/https?:\/\/[^\s)>"']+/) || text.match(/(?:^|\s)([a-z0-9-]+\.[a-z]{2,}(?:\/[^\s)>"']*)?)/m);
  // Parts: split on "# Part X — ..." or "# ক/খ/গ-বিভাগ — ..." headings.
  const parts = [];
  const BN_PART = { 'ক': 'A', 'খ': 'B', 'গ': 'C' };
  const partRe = /^#\s+(?:Part\s+([A-C])\s*[—–-]\s*|([কখগ])-বিভাগ\s*[—–-]\s*)(.+)$/gm;
  const headings = [...text.matchAll(partRe)];
  for (let i = 0; i < headings.length; i++) {
    const letter = headings[i][1] || BN_PART[headings[i][2]];
    const heading = normDigits(headings[i][3].trim());
    const start = headings[i].index + headings[i][0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index : text.length;
    const partText = text.slice(start, end);
    const { body, questions } = parsePart(partText);
    const expectedM = heading.match(/(\d+)(?:টি)?\s*(?:Short|Brief|Broad|MCQ|short-answer|broad|extra|সংক্ষিপ্ত|সংক্ষেপ|বর্ণনামূলক)/i);
    parts.push({
      letter, heading, body, questions,
      expected: expectedM ? parseInt(expectedM[1], 10) : null,
    });
  }
  const totalQuestions = parts.reduce((s, p) => s + p.questions.length, 0);
  return {
    file: basename(filePath), folder: folderName, code, title, deptSlug, department,
    yearNum, yearLabel, credit, marks, isBangla, isBilingual, language,
    eduType: place.type, board: place.board, program: place.program,
    parts, totalQuestions,
    hash: createHash('md5').update(text).digest('hex').slice(0, 10),
    sourceUrl: urlM ? (urlM[0].startsWith('http') ? urlM[0] : `https://${urlM[0]}`) : null,
  };
}

// ---------------------------------------------------------------------------
// Build the load plan (dedupe by code; merge content variants as extra sets)
// ---------------------------------------------------------------------------
function buildPlan() {
  const folders = readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const packs = [];
  const skippedFresh = [];
  for (const folder of folders) {
    if (ONLY_FOLDER && folder !== ONLY_FOLDER) continue;
    const files = readdirSync(join(CONTENT_ROOT, folder)).filter((f) => f.endsWith('.md')).sort();
    for (const file of files) {
      const full = join(CONTENT_ROOT, folder, file);
      // The content agent is still writing packs: skip files modified in
      // the last 2 minutes so a half-written pack is never loaded.
      // A re-run picks them up once they are stable.
      const { mtimeMs } = statSync(full);
      if (Date.now() - mtimeMs < 120000) {
        skippedFresh.push(`${folder}/${file}`);
        continue;
      }
      packs.push(parsePack(full, folder));
    }
  }
  if (skippedFresh.length) {
    console.log(`SKIP: ${skippedFresh.length} pack(s) modified <2 min ago (still being written — re-run will pick them up):`);
    for (const s of skippedFresh.slice(0, 20)) console.log('  -', s);
  }
  // Group by code; within a code, group by content hash (variants).
  const byCode = new Map();
  for (const pack of packs) {
    if (!pack.code) { console.warn(`WARN: no course code in ${pack.folder}/${pack.file} — skipped`); continue; }
    if (!byCode.has(pack.code)) byCode.set(pack.code, []);
    byCode.get(pack.code).push(pack);
  }
  const books = [];
  for (const [code, variants] of [...byCode.entries()].sort()) {
    const byHash = new Map();
    for (const p of variants) {
      if (!byHash.has(p.hash)) byHash.set(p.hash, []);
      byHash.get(p.hash).push(p);
    }
    const first = variants[0];
    // Book ID: hons-{numeric code} for Honours, mad-{slug} for Madrasa,
    // {type}-{slug} otherwise (hsc-, ssc-, technical-). The type prefix is
    // stripped from the slug when the identifier already carries it, so
    // IDs never double up (hsc-bangla-1st-paper, not hsc-hsc-...).
    const typeSlug = slugify(first.eduType);
    const prefix = first.eduType === 'Higher' ? 'hons-' : first.eduType === 'Madrasa' ? 'mad-' : `${typeSlug}-`;
    const idSlug = /^\d+$/.test(code) ? code : slugify(code).replace(new RegExp(`^${typeSlug}-`), '');
    const bookId = `${prefix}${idSlug}`;
    const departments = [...new Set(variants.map((p) => p.department))];
    const deptSlugs = [...new Set(variants.map((p) => p.deptSlug))];
    const sourceFiles = variants.map((p) => `${p.folder}/${p.file}`);
    const book = {
      bookId, code, title: first.title, department: first.department, departments,
      deptSlugs, yearNum: first.yearNum, yearLabel: first.yearLabel,
      credit: first.credit, marks: first.marks,
      eduType: first.eduType, board: first.board, program: first.program,
      language: first.language, bilingual: first.isBilingual,
      sourceUrl: first.sourceUrl || `https://eduvelto.web.app/library/${bookId}`,
      sourceFiles, variants: [...byHash.values()].map((group) => ({
        setNo: 0, // filled below
        folders: group.map((p) => p.folder),
        packs: group,
      })),
    };
    // Assign set numbers: first hash group = set 1 (canonical), others = set 2, 3...
    book.variants.forEach((v, i) => { v.setNo = i + 1; });
    // Question count + chapters: one chapter per part per set.
    let questionCount = 0;
    const chapters = [];
    for (const variant of book.variants) {
      for (const pack of variant.packs) {
        for (const part of pack.parts) {
          questionCount += part.questions.length;
          chapters.push({ pack, part, setNo: variant.setNo });
        }
      }
    }
    book.questionCount = questionCount;
    book.chapterCount = chapters.length;
    book.chapters = chapters;
    books.push(book);
  }
  return { books, packCount: packs.length };
}

// ---------------------------------------------------------------------------
// Write one book (book + chapters + lessons + directory row)
// ---------------------------------------------------------------------------
const DRAFT_PACK_FILE = 'elizabethan-and-jacobean-drama-broad-extra-pack-01.md';

async function writeBook(book, log) {
  const now = new Date();
  const isDraftBook = false; // the book itself is Published; only its broad/extra chapters stay Draft
  const bookFields = {
    title: book.title,
    paperCode: book.code,
    educationType: book.eduType,
    board: book.board,
    program: book.program,
    classLevel: book.yearLabel,
    department: book.department,
    departments: book.departments,
    subject: book.department,
    sourceType: 'original-eduvelto',
    sourceUrl: book.sourceUrl,
    authors: ['Eduvelto'],
    publisher: 'Eduvelto',
    credit: book.credit,
    marks: book.marks,
    language: book.language,
    bilingual: book.bilingual,
    questionCount: book.questionCount,
    chapterCount: book.chapterCount,
    sourceFiles: book.sourceFiles,
    reviewStatus: 'Under Review',
    createdAt: now,
    updatedAt: now,
  };
  const res1 = await upsertPublished('books', book.bookId, bookFields, true);
  log.books[book.bookId] = { title: book.title, code: book.code, departments: book.departments, questionCount: book.questionCount, chapters: book.chapterCount, write: res1 };

  for (const { pack, part, setNo } of book.chapters) {
    const isDraftPart = pack.file === DRAFT_PACK_FILE;
    const chapterId = `${book.bookId}--part-${part.letter.toLowerCase()}${setNo > 1 ? `-set${setNo}` : ''}`;
    const title = setNo > 1 ? `${part.heading} — সেট ${setNo}` : part.heading;
    const chapterFields = {
      bookId: book.bookId, title, part: part.letter, set: setNo,
      order: (part.letter.charCodeAt(0) - 64) + (setNo - 1) * 10,
      questionCount: part.questions.length,
      reviewStatus: 'Under Review', createdAt: now, updatedAt: now,
    };
    await upsertPublished('chapters', chapterId, chapterFields, !isDraftPart);
    const lessonFields = {
      bookId: book.bookId, chapterId, title, part: part.letter, set: setNo,
      body: part.body.slice(0, 95000),
      questions: part.questions,
      questionCount: part.questions.length,
      reviewStatus: 'Under Review', createdAt: now, updatedAt: now,
    };
    await upsertPublished('lessons', chapterId, lessonFields, !isDraftPart);
    log.chapters[chapterId] = { bookId: book.bookId, title, questions: part.questions.length, status: isDraftPart ? 'Draft (Under Review)' : 'Published' };
  }

  const dirFields = {
    type: book.eduType, board: book.board, program: book.program,
    classLevel: book.yearLabel, department: book.department, departments: book.departments,
    subject: book.department, paperCode: book.code, paperTitle: book.title,
    bookId: book.bookId, title: book.title,
    reviewStatus: 'Under Review', createdAt: now, updatedAt: now,
  };
  await upsertPublished('educationDirectory', book.bookId, dirFields, true);
  log.directory[book.bookId] = { title: book.title, departments: book.departments };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { books, packCount } = buildPlan();
  const warnings = [];
  for (const book of books) {
    for (const { pack, part } of book.chapters) {
      if (part.expected !== null && part.questions.length !== part.expected) {
        warnings.push(`${pack.folder}/${pack.file} Part ${part.letter}: parsed ${part.questions.length}, expected ${part.expected}`);
      }
      if (part.questions.length === 0) warnings.push(`${pack.folder}/${pack.file} Part ${part.letter}: ZERO questions parsed`);
    }
    if (book.questionCount === 0) warnings.push(`BOOK ${book.bookId}: zero questions`);
  }
  const totalQuestions = books.reduce((s, b) => s + b.questionCount, 0);
  const totalChapters = books.reduce((s, b) => s + b.chapterCount, 0);
  const totalDocs = books.length * 2 + totalChapters * 2; // books+directory, chapters+lessons
  const totalWrites = totalDocs * 2; // create-or-patch + publish
  console.log(`PLAN: ${packCount} pack files -> ${books.length} books, ${totalChapters} chapters/lessons, ${totalQuestions} questions`);
  console.log(`PLAN: ~${totalDocs} documents, ~${totalWrites} writes (two-step draft->publish; quota 20,000/day)`);
  if (warnings.length) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const w of warnings.slice(0, 40)) console.log('  -', w);
  }
  const limited = LIMIT === Infinity ? books : books.slice(0, LIMIT);
  if (limited.length < books.length) console.log(`LIMIT: loading first ${limited.length} of ${books.length} books`);

  if (DRY_RUN) {
    for (const b of limited) console.log(`  DRY: ${b.bookId} | ${b.title} | ${b.departments.join(', ')} | ${b.yearLabel} | ${b.questionCount} Q, ${b.chapterCount} chapters`);
    console.log('DRY RUN complete — nothing written.');
    return;
  }

  const log = { generatedAt: new Date().toISOString(), books: {}, chapters: {}, directory: {}, warnings };
  let done = 0;
  const t0 = Date.now();
  // Simple worker pool (5 concurrent books).
  const CONCURRENCY = 5;
  let idx = 0;
  async function worker() {
    while (idx < limited.length) {
      const book = limited[idx++];
      try {
        await writeBook(book, log);
        done++;
        if (done % 10 === 0 || done === limited.length) {
          console.log(`  [${done}/${limited.length}] ${book.bookId} — ${book.title} (${book.questionCount} Q) — ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
        }
      } catch (e) {
        console.error(`  FAIL ${book.bookId}: ${e.message}`);
        log.books[book.bookId] = { ...log.books[book.bookId], error: e.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, limited.length) }, worker));
  const failed = Object.values(log.books).filter((b) => b.error).length;
  console.log(`DONE: ${done} books written, ${failed} failed, ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed.`);
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  console.log(`LOG: ${LOG_PATH}`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
