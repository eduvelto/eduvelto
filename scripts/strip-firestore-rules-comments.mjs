// strip-firestore-rules-comments.mjs
//
// Deploy-time helper: Firestore rules sources have a 256 KiB deploy
// limit (firebaserules API: "Total size of sources must be smaller
// than 262144"). The commented firestore.rules source passed that
// limit at the Step 9 merge (281,422 bytes, ~104 KB of it comments),
// so the deploy artifact is a comment-stripped copy of the same file.
//
// The source file in git KEEPS its comments (they document every rule);
// only the deployed artifact is stripped. The strip is verified by
// running the full emulator rules suite (npm run test:rules, 1004
// tests) against the stripped file before deploying, which proves the
// stripped rules are functionally identical.
//
// Usage:
//   node scripts/strip-firestore-rules-comments.mjs [input] [output]
//   Defaults: input = firestore.rules, output = firestore.rules.stripped
//   The stripper is string-aware: a `//` inside a quoted string is
//   NOT treated as a comment start. The source must not contain
//   /* */ block comments (it does not, checked 22 Nov 2026).
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2] || 'firestore.rules';
const output = process.argv[3] || 'firestore.rules.stripped';

const src = readFileSync(input, 'utf8');
const out = [];

for (const line of src.split('\n')) {
  let result = '';
  let inSingle = false;
  let inDouble = false;
  let i = 0;
  let cut = false;
  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1] || '';
    if (!inSingle && !inDouble && ch === '/' && next === '/') {
      cut = true;
      break;
    }
    if (ch === '\\' && (inSingle || inDouble) && i + 1 < line.length) {
      result += line.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    result += ch;
    i += 1;
  }
  void cut;
  const trimmed = result.trimEnd();
  if (trimmed.trim() === '') continue; // drop blank / comment-only lines
  out.push(trimmed);
}

const stripped = out.join('\n') + '\n';
writeFileSync(output, stripped, 'utf8');
const bytes = Buffer.byteLength(stripped, 'utf8');
console.log(`stripped ${input} -> ${output}: ${bytes} bytes (limit 262144, headroom ${262144 - bytes})`);
if (bytes >= 262144) {
  console.error('ERROR: stripped rules still exceed the 256 KiB deploy limit.');
  process.exit(1);
}
