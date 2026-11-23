#!/usr/bin/env node
// Step 16 preview verification BY CONTENT (not HTTP 200 alone).
// Usage: node team/verify-step16-preview.mjs <preview-url>
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PREVIEW = process.argv[2] || 'https://eduvelto--step16-viva-career-1vqa9cfv.web.app';
const DIST = path.join(__dirname, '..', 'dist');
const md5 = (buf) => createHash('md5').update(buf).digest('hex');

let pass = 0, fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${detail}`); }
}

(async () => {
  // 1. Routes 200.
  const routes = ['/', '/jobs', '/jobs/viva', '/jobs/career', '/jobs/cv', '/jobs/bcs', '/jobs/circulars'];
  for (const r of routes) {
    const res = await fetch(PREVIEW + r);
    check(`route ${r} 200`, res.status === 200, `got ${res.status}`);
  }
  // 2. Main bundle md5 = dist.
  const html = await (await fetch(PREVIEW + '/')).text();
  const m = html.match(/\/assets\/index-[^"]+\.js/);
  check('index.html references a main bundle', !!m);
  const bundleName = m[0].split('/').pop();
  const liveBundle = Buffer.from(await (await fetch(PREVIEW + m[0])).arrayBuffer());
  const distBundle = fs.readFileSync(path.join(DIST, 'assets', bundleName));
  check(`main bundle ${bundleName} md5 = dist`, md5(liveBundle) === md5(distBundle));
  const bundleText = liveBundle.toString('utf8');
  // 3. Guide page chunk md5 = dist (find the chunk containing the disclaimer).
  const chunks = fs.readdirSync(path.join(DIST, 'assets')).filter((f) => f.endsWith('.js') && f !== bundleName);
  let guideChunk = null;
  for (const c of chunks) {
    const t = fs.readFileSync(path.join(DIST, 'assets', c), 'utf8');
    if (t.includes('কাগজপত্রের চেকলিস্ট')) { guideChunk = c; break; }
  }
  check('guide chunk found in dist', !!guideChunk);
  let guideText = '';
  if (guideChunk) {
    const live = Buffer.from(await (await fetch(`${PREVIEW}/assets/${guideChunk}`)).arrayBuffer());
    const dist = fs.readFileSync(path.join(DIST, 'assets', guideChunk));
    check(`guide chunk ${guideChunk} md5 = dist`, md5(live) === md5(dist));
    guideText = live.toString('utf8');
  }
  // 4. New Step 16 strings present across the LIVE chunks. The guide page
  //    is lazy-loaded, so its strings live in the guide chunk; the hub
  //    card string lives in the hub chunk; the /jobs section strings live
  //    in the jobs chunk. Check the union of all four live chunks.
  const findChunk = (needle) => {
    for (const c of chunks) {
      const t = fs.readFileSync(path.join(DIST, 'assets', c), 'utf8');
      if (t.includes(needle)) return c;
    }
    return null;
  };
  const hubChunk = findChunk('ভাইভা প্রস্তুতি পড়ুন');
  const jobsChunk = findChunk('ভাইভা, ক্যারিয়ার ও CV');
  check('hub chunk found in dist', !!hubChunk);
  check('jobs chunk found in dist', !!jobsChunk);
  let unionText = bundleText + guideText;
  for (const c of [hubChunk, jobsChunk]) {
    if (!c) continue;
    const live = Buffer.from(await (await fetch(`${PREVIEW}/assets/${c}`)).arrayBuffer());
    const dist = fs.readFileSync(path.join(DIST, 'assets', c));
    check(`chunk ${c} md5 = dist`, md5(live) === md5(dist));
    unionText += live.toString('utf8');
  }
  const mustHave = [
    'ভাইভা ও ইন্টারভিউ', 'ক্যারিয়ার গাইডলাইন', 'সিভি ও রিজিউমে',
    'কাগজপত্রের চেকলিস্ট', 'নিজের পরিচয়ের খসড়া',
    'প্রস্তুতির উপকরণ — অনলাইন ভাইভা নয়', 'চাকরির নিশ্চয়তা দেয় না',
    'সাধারণ শিক্ষামূলক ও প্রস্তুতিমূলক নির্দেশনা', 'মনে রাখুন',
    'ভাইভা প্রস্তুতি পড়ুন', 'দুটি নমুনা কাঠামো',
  ];
  for (const s of mustHave) check(`string present (live chunks): ${s}`, unionText.includes(s));
  // 5. Prohibited NU phrasing: 0 in the live bundle, guide, hub, jobs chunks.
  const prohibited = ['আবেদন চলছে', 'এখনই আবেদন করুন', 'শেষ তারিখ সামনে', '২০২৬–২৭ ভর্তি পরীক্ষা নিশ্চিত', 'পরীক্ষার তারিখ ঘোষণা হয়েছে'];
  for (const s of prohibited) check(`prohibited 0: ${s}`, !unionText.includes(s));
  // 6. sameAs exactly 3 URLs — extract the JSON-LD sameAs array
  //    (minified key is unquoted: sameAs:[...]).
  const sameAsMatch = bundleText.match(/sameAs:\s*\[([^\]]+)\]/);
  check('sameAs array found', !!sameAsMatch);
  if (sameAsMatch) {
    const urls = [...sameAsMatch[1].matchAll(/https:\/\/[^"\\,]+/g)].map((m) => m[0]);
    check('sameAs exactly 3 URLs', urls.length === 3, `found ${urls.length}: ${urls.join(', ')}`);
  }
  // 7. No prohibited Step 16 claims IN THE GUIDE CHUNK. (The main bundle
  //    legitimately contains 'ভাইভার নম্বর' / '১৯তম' as pre-existing
  //    honesty NEGATIONS in jobExams.ts — 'ভাইভার নম্বর এখানে লেখা হয়নি',
  //    '১৯তম পরীক্ষার ধরন এখানে লেখা হয়নি' — so they are scoped here.
  //    'নিশ্চিত প্রশ্নের তালিকা' is NOT checked: the disclaimer itself
  //    negates it — '...বা নিশ্চিত প্রশ্নের তালিকা নয়'.)
  const step16Bad = ['ভাইভার নম্বর', '১৯তম', 'যাচাইকৃত ভাইভা'];
  for (const s of step16Bad) check(`no Step 16 bad claim (guide chunk): ${s}`, !guideText.includes(s));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
