// Eduvelto — Phase 4 (25 Nov 2026, feature/ssg-bilingual-support):
// generate the compact homepage book-search index.
//
//   node scripts/build-book-search-index.mjs \
//     --books-file ~/workspace/eduorbit/backups/eduvelto-backup-20261124-014508.json \
//     [--out public/book-search-index.json]
//
// Reads the same backup shape the prerender accepts
// ({metadata, data:{books:[...]}}, {books:[...]}, or a bare array),
// keeps Published books only, and writes ONLY id + title +
// subject + classLevel per book — no chapter/question payloads,
// no lesson text, nothing login-gated. Output is
// { version: 1, generatedAt, count, entries }.
//
// The committed public/book-search-index.json is the fallback the
// client bundle ships with `npm run build` alone. The prerender
// (scripts/prerender.mjs) regenerates the same file into dist/
// from the book list it already loads, so a deploy always serves
// a fresh index. Regenerate the committed copy whenever the
// library changes materially (new books / retitles).
//
// Usage notes: never invent books — docs without id or title are
// skipped and counted; the script exits non-zero when the source
// yields zero books (an empty index would silently break search).

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function parseArgs(argv) {
  const args = { booksFile: null, out: 'public/book-search-index.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--books-file') args.booksFile = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!args.booksFile) {
    throw new Error(
      'No book source given. Use --books-file <path> (local fixture backup).',
    );
  }
  return args;
}

export function buildSearchIndexEntries(rawBooks) {
  const list = Array.isArray(rawBooks)
    ? rawBooks
    : (rawBooks?.data?.books ?? rawBooks?.books ?? []);
  const entries = [];
  let skipped = 0;
  for (const doc of list) {
    if (!doc || typeof doc.id !== 'string' || !doc.id || typeof doc.title !== 'string' || !doc.title) {
      skipped += 1;
      continue;
    }
    // Published only — drafts must never be searchable.
    if (doc.reviewStatus !== undefined && doc.reviewStatus !== 'Published') {
      skipped += 1;
      continue;
    }
    entries.push({
      id: doc.id,
      title: doc.title,
      subject: typeof doc.subject === 'string' ? doc.subject : '',
      classLevel: typeof doc.classLevel === 'string' ? doc.classLevel : '',
    });
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { entries, skipped };
}

export function buildSearchIndexFile(rawBooks, generatedAt = new Date().toISOString()) {
  const { entries, skipped } = buildSearchIndexEntries(rawBooks);
  return {
    file: {
      version: 1,
      generatedAt,
      count: entries.length,
      entries,
    },
    skipped,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = JSON.parse(readFileSync(args.booksFile, 'utf8'));
  const { file, skipped } = buildSearchIndexFile(data);
  if (file.count === 0) {
    throw new Error(`no books found in ${args.booksFile} — refusing to write an empty index`);
  }
  const outPath = join(process.cwd(), args.out);
  writeFileSync(outPath, `${JSON.stringify(file)}\n`, 'utf8');
  console.log(`Book search index: ${file.count} entries (skipped ${skipped}) -> ${args.out}`);
}

const isMain = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(`build-book-search-index FAILED: ${err.message}`);
    process.exit(1);
  }
}
