// Eduvelto — site audit (Day 1 script, 7-day master schedule).
//
// Runs 5 automated checks and reports REAL results (nothing is hardcoded):
//   1. TypeScript & Vite production build integrity
//      (npx tsc --noEmit, then the full production build)
//   2. SEO meta tags, canonicals, hreflang, and sitemap coverage
//      (built dist/index.html + dist/sitemap.xml vs the key-page list)
//   3. Broken links & legacy URL redirects
//      (firebase.json redirect rules checked structurally + the key
//      canonical routes fetched from a local preview of the built site)
//   4. Firestore read-quota efficiency & bundle size
//      (built entry-chunk JS size vs the 200 KB budget; Firestore read
//      surface counted statically — this is a proxy, not a live quota
//      measurement, and the log says so)
//   5. Question accuracy & duplicate detection
//      (runs the bank checker at
//      ~/workspace/eduorbit/sprint-1week-2026-11-25/scripts/check_bank.py
//      when present, and reports its real counts)
//
// Usage:
//   npm run audit
//   npm run audit -- --skip-build        # skip check 1's production build
//   npm run audit -- --audit-log /path/to/AUDIT_LOG.md
//
// Results are printed to the console AND appended to AUDIT_LOG.md
// (default: ~/workspace/eduorbit/sprint-1week-2026-11-25/AUDIT_LOG.md).
// Exit code: 0 when no check FAILs, 1 when any check FAILs.
// This script only READS the site and the question bank; it never writes
// to Firestore and never deploys anything.

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, appendFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SKIP_BUILD = args.includes('--skip-build');
const logIdx = args.indexOf('--audit-log');
const AUDIT_LOG =
  logIdx >= 0 && args[logIdx + 1]
    ? args[logIdx + 1]
    : resolve(REPO_ROOT, '..', 'sprint-1week-2026-11-25', 'AUDIT_LOG.md');
const BANK_CHECKER = resolve(
  REPO_ROOT, '..', 'sprint-1week-2026-11-25', 'scripts', 'check_bank.py',
);
const BANK_REPORT = resolve(REPO_ROOT, '..', 'sprint-1week-2026-11-25', 'bank-check-report.json');

// Key canonical pages the sitemap and the preview check must cover.
// (bn canonicals; the sitemap lists each page in both bn and en.)
const KEY_PAGES = [
  '/', '/bn/jobs', '/bn/books', '/bn/jobs/bcs', '/bn/jobs/bank',
  '/bn/jobs/primary-teacher', '/bn/jobs/ntrca', '/bn/admissions',
  '/bn/about', '/bn/privacy-policy', '/bn/terms', '/bn/contact',
  '/bn/search', '/bn/class', '/bn/learn', '/bn/guides', '/bn/health',
];
const ENTRY_BUDGET_KB = 200;

const results = [];
function record(name, status, details) {
  results.push({ name, status, details });
  const icon = status === 'PASS' ? 'PASS' : status === 'WARN' ? 'WARN' : 'FAIL';
  console.log(`\n[${icon}] ${name}\n  ${details.replace(/\n/g, '\n  ')}`);
}

function run(cmd, argv, opts = {}) {
  try {
    const out = execFileSync(cmd, argv, { cwd: REPO_ROOT, encoding: 'utf8', timeout: 600_000, ...opts });
    return { ok: true, out: out ?? '' };
  } catch (err) {
    return { ok: false, out: (err.stdout ?? '') + (err.stderr ?? ''), code: err.status };
  }
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

// ---------------------------------------------------------------- check 1
function checkBuild() {
  const tsc = run('npx', ['tsc', '--noEmit']);
  if (!tsc.ok) {
    const errors = (tsc.out.match(/error TS\d+/g) ?? []).length;
    record('1. TypeScript & production build', 'FAIL',
      `tsc --noEmit failed (exit ${tsc.code}, ~${errors} TS errors).\n${tsc.out.split('\n').slice(0, 10).join('\n')}`);
    return;
  }
  if (SKIP_BUILD) {
    record('1. TypeScript & production build', 'PASS',
      'tsc --noEmit: 0 errors. Production build skipped (--skip-build).');
    return;
  }
  const build = run('npm', ['run', 'build']);
  if (!build.ok) {
    record('1. TypeScript & production build', 'FAIL',
      `tsc --noEmit: 0 errors, but the production build failed (exit ${build.code}).\n${build.out.split('\n').slice(-15).join('\n')}`);
    return;
  }
  record('1. TypeScript & production build', 'PASS',
    'tsc --noEmit: 0 errors. Production build (tsc -b && vite build) succeeded; dist/ written.');
}

// ---------------------------------------------------------------- check 2
function checkSeo() {
  const problems = [];
  const notes = [];
  const indexPath = join(REPO_ROOT, 'dist', 'index.html');
  if (!existsSync(indexPath)) {
    record('2. SEO meta / canonical / hreflang / sitemap', 'FAIL', 'dist/index.html missing — run the production build first.');
    return;
  }
  const html = readFileSync(indexPath, 'utf8');
  const has = (re) => re.test(html);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (!title) problems.push('no <title> in built index.html');
  if (!has(/name="description"/)) problems.push('no meta description in built index.html');
  if (!has(/property="og:title"/)) problems.push('no og:title in built index.html');
  if (!has(/property="og:description"/)) problems.push('no og:description in built index.html');
  if (!has(/property="og:image"/)) problems.push('no og:image in built index.html');
  if (!has(/rel="canonical"/)) notes.push('no static canonical in built index.html (SPA sets canonical per route at runtime — see src/lib/seo.ts)');
  // Runtime canonical/hreflang: the SPA sets these on route change.
  const seoTs = readFileSync(join(REPO_ROOT, 'src', 'lib', 'seo.ts'), 'utf8');
  if (!/canonical/.test(seoTs) || !/hreflang/.test(seoTs)) {
    problems.push('src/lib/seo.ts does not set canonical/hreflang');
  } else {
    notes.push('src/lib/seo.ts sets canonical + hreflang per route at runtime');
  }
  if (title) notes.push(`built <title>: "${title.slice(0, 80)}"`);

  const sitemapPath = join(REPO_ROOT, 'dist', 'sitemap.xml');
  let sitemapCount = 0;
  const missing = [];
  if (!existsSync(sitemapPath)) {
    problems.push('dist/sitemap.xml missing (prerender step did not emit it)');
  } else {
    const xml = readFileSync(sitemapPath, 'utf8');
    sitemapCount = (xml.match(/<loc>/g) ?? []).length;
    // The built sitemap lists BARE paths (https://eduvelto.com/jobs/bcs),
    // with bn/en/x-default hreflang alternates per URL — so a /bn key
    // page maps to its bare loc here.
    for (const page of KEY_PAGES) {
      const loc = page === '/' ? 'https://eduvelto.com/' : `https://eduvelto.com${page.replace(/^\/bn/, '')}`;
      if (!xml.includes(`<loc>${loc}</loc>`)) missing.push(page);
    }
    if (missing.length) problems.push(`sitemap missing key pages: ${missing.join(', ')}`);
    const hreflangBn = (xml.match(/hreflang="bn"/g) ?? []).length;
    const hreflangEn = (xml.match(/hreflang="en"/g) ?? []).length;
    if (hreflangBn !== sitemapCount || hreflangEn !== sitemapCount) {
      problems.push(`sitemap hreflang coverage incomplete: bn ${hreflangBn}/${sitemapCount}, en ${hreflangEn}/${sitemapCount}`);
    } else {
      notes.push(`sitemap hreflang alternates: bn + en on all ${sitemapCount} URLs`);
    }
    notes.push(`sitemap.xml: ${sitemapCount} URLs`);
  }
  record('2. SEO meta / canonical / hreflang / sitemap',
    problems.length ? 'FAIL' : 'PASS',
    [...problems, ...notes].join('\n'));
}

// ---------------------------------------------------------------- check 3
async function checkLinks() {
  const problems = [];
  const notes = [];
  const firebaseJson = JSON.parse(readFileSync(join(REPO_ROOT, 'firebase.json'), 'utf8'));
  const redirects = firebaseJson.hosting?.redirects ?? [];
  notes.push(`${redirects.length} redirect rules in firebase.json`);
  for (const r of redirects) {
    if (!r.source || !r.destination) problems.push(`redirect missing source/destination: ${JSON.stringify(r)}`);
    else if (r.source === r.destination) problems.push(`redirect loop (source == destination): ${r.source}`);
    else if (![301, 302].includes(r.type)) problems.push(`redirect with unexpected type ${r.type}: ${r.source}`);
    else if (!r.destination.startsWith('http') && !r.destination.startsWith('/bn') && !r.destination.startsWith('/en')) {
      problems.push(`redirect destination is not a /bn, /en or external URL: ${r.source} -> ${r.destination}`);
    }
  }
  // Live route check against a local preview of the built site. NOTE: vite
  // preview does NOT apply Firebase Hosting redirects, so legacy URLs are
  // verified structurally above (301 rules); the preview check proves the
  // canonical routes themselves return 200 instead of 404.
  // --port 0 lets vite pick a free port (other agents' preview servers may
  // already hold 4173); the actual port is parsed from vite's output.
  const preview = spawn(join(REPO_ROOT, 'node_modules', '.bin', 'vite'), ['preview', '--port', '0', '--strictPort'], { cwd: REPO_ROOT });
  let base = null;
  try {
    base = await new Promise((resolveReady, reject) => {
      const t = setTimeout(() => reject(new Error('preview server did not start in 30s')), 30_000);
      const onData = (d) => {
        const m = String(d).match(/Local:\s+(http:\/\/[^\s]+)/);
        if (m) { clearTimeout(t); resolveReady(m[1].replace(/\/$/, '')); }
      };
      preview.stdout.on('data', onData);
      preview.stderr.on('data', onData);
    });
    const bad = [];
    for (const page of KEY_PAGES) {
      try {
        const res = await fetch(`${base}${page}`, { redirect: 'manual' });
        if (res.status !== 200) bad.push(`${page} -> HTTP ${res.status}`);
      } catch (err) {
        bad.push(`${page} -> fetch error: ${err.message}`);
      }
    }
    if (bad.length) problems.push(`preview route failures:\n${bad.join('\n')}`);
    else notes.push(`preview: all ${KEY_PAGES.length} key routes return 200`);
  } catch (err) {
    problems.push(`could not start vite preview for the live route check: ${err.message}`);
  } finally {
    preview.kill('SIGTERM');
  }
  notes.push('Firebase 301/302 redirects verified structurally (vite preview does not apply Hosting rules); verify the 301s live after the next deploy.');
  record('3. Broken links & legacy redirects', problems.length ? 'FAIL' : 'PASS', [...problems, ...notes].join('\n'));
}

// ---------------------------------------------------------------- check 4
function checkBundleAndQuota() {
  const problems = [];
  const notes = [];
  const assetsDir = join(REPO_ROOT, 'dist', 'assets');
  if (!existsSync(assetsDir)) {
    record('4. Read-quota efficiency & bundle size', 'FAIL', 'dist/assets missing — run the production build first.');
    return;
  }
  const jsFiles = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  if (!jsFiles.length) {
    record('4. Read-quota efficiency & bundle size', 'FAIL', 'no JS chunks in dist/assets.');
    return;
  }
  const sizes = jsFiles.map((f) => {
    const buf = readFileSync(join(assetsDir, f));
    return { file: f, raw: buf.length, gzip: gzipSync(buf).length };
  }).sort((a, b) => b.gzip - a.gzip);
  const entry = sizes.find((s) => s.file.startsWith('index-')) ?? sizes[0];
  const totalGzip = sizes.reduce((n, s) => n + s.gzip, 0);
  notes.push(`JS chunks: ${jsFiles.length} files, total gzip ${kb(totalGzip)}`);
  notes.push(`largest chunk: ${entry.file} — raw ${kb(entry.raw)}, gzip ${kb(entry.gzip)} (budget: initial JS < ${ENTRY_BUDGET_KB} KB gzip)`);
  if (entry.gzip > ENTRY_BUDGET_KB * 1024) {
    problems.push(`entry chunk ${entry.file} gzip ${kb(entry.gzip)} exceeds the ${ENTRY_BUDGET_KB} KB budget`);
  }
  // Firestore read surface (static proxy, not a live quota measurement):
  // count the read call sites in src so a growing surface is visible.
  const grep = run('grep', ['-r', '--include=*.ts', '--include=*.tsx', '-o', '-E', 'getDocs|getDoc|getCountFromServer|onSnapshot', 'src']);
  const readSites = grep.ok ? (grep.out.match(/getDocs|getDoc|getCountFromServer|onSnapshot/g) ?? []).length : 0;
  notes.push(`Firestore read call sites in src (static count, proxy only): ${readSites} — live quota (50k reads/day Spark) is not measured by this check; watch it in the Firebase console after deploy.`);
  record('4. Read-quota efficiency & bundle size', problems.length ? 'FAIL' : 'PASS', [...problems, ...notes].join('\n'));
}

// ---------------------------------------------------------------- check 5
function checkBank() {
  if (!existsSync(BANK_CHECKER)) {
    record('5. Question accuracy & duplicate detection', 'WARN',
      `bank checker not found at ${BANK_CHECKER} — skipped (nothing to report).`);
    return;
  }
  const runResult = run('python3', [BANK_CHECKER], { cwd: resolve(REPO_ROOT, '..', 'sprint-1week-2026-11-25') });
  if (!existsSync(BANK_REPORT)) {
    record('5. Question accuracy & duplicate detection', 'FAIL',
      `bank checker ran (exit ${runResult.code ?? 0}) but wrote no bank-check-report.json. Output:\n${runResult.out.slice(0, 800)}`);
    return;
  }
  const report = JSON.parse(readFileSync(BANK_REPORT, 'utf8'));
  // Real report shape (check_bank.py): total_scanned, unique, issues,
  // warnings, id_collisions. Exact duplicates are issues whose text
  // starts with "EXACT duplicate".
  const issues = report.issues ?? [];
  const warnings = report.warnings ?? [];
  const exactDups = issues.filter((i) => String(i.issue ?? '').includes('EXACT duplicate')).length;
  const total = report.total_scanned ?? report.counts?.total ?? '?';
  const lines = [
    `bank checker: ${BANK_CHECKER.split('/').slice(-2).join('/')}`,
    `total questions scanned: ${total}`,
    `unique questions: ${report.unique ?? '?'}`,
    `exact duplicates: ${exactDups}`,
    `hard issues: ${Array.isArray(issues) ? issues.length : issues}`,
    `warnings (near-duplicates): ${Array.isArray(warnings) ? warnings.length : warnings}`,
    `ID collisions (same ID, different question): ${Array.isArray(report.id_collisions) ? report.id_collisions.length : report.id_collisions ?? '?'}`,
  ];
  if (Array.isArray(issues) && issues.length) lines.push(`first issues:\n${issues.slice(0, 5).map((i) => `  - ${i.file ?? ''}: ${i.issue ?? JSON.stringify(i)}`).join('\n')}`);
  record('5. Question accuracy & duplicate detection',
    Array.isArray(issues) && issues.length ? 'WARN' : 'PASS',
    lines.join('\n'));
}

// ---------------------------------------------------------------- main
async function main() {
  const startedAt = new Date().toISOString();
  console.log(`Eduvelto site audit — ${startedAt}\nRepo: ${REPO_ROOT}`);
  checkBuild();
  checkSeo();
  await checkLinks();
  checkBundleAndQuota();
  checkBank();

  const fails = results.filter((r) => r.status === 'FAIL').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  const passes = results.filter((r) => r.status === 'PASS').length;
  console.log(`\nSummary: ${passes} PASS, ${warns} WARN, ${fails} FAIL (of ${results.length} checks)`);

  const logLines = [
    `\n## Audit — ${startedAt}`,
    '',
    `Result: ${passes} PASS, ${warns} WARN, ${fails} FAIL (of ${results.length} checks).`,
    '',
    ...results.flatMap((r) => [`### ${r.name} — ${r.status}`, '', ...r.details.split('\n').map((l) => (l ? `  ${l}` : '')), '']),
  ];
  try {
    appendFileSync(AUDIT_LOG, logLines.join('\n'));
    console.log(`Audit log appended: ${AUDIT_LOG}`);
  } catch (err) {
    console.error(`WARNING: could not write audit log (${AUDIT_LOG}): ${err.message}`);
  }
  process.exit(fails ? 1 : 0);
}

main();
