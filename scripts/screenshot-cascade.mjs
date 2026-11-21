// Eduvelto — V-2 E2E + screenshots for the cascading Directory filters.
// Drives the headless Chromium shell over CDP (same pattern as
// scripts/screenshot-dashboards.mjs). Public page — no login needed.
//
// PREREQUISITES (in order):
//   1. Emulator running on 8180/9199 with the D-2 load (609 books).
//   2. Emulator build: VITE_USE_FIREBASE_EMULATORS=1
//      VITE_FIRESTORE_EMULATOR_PORT=8180 VITE_AUTH_EMULATOR_PORT=9199
//      npm run build
//   3. Preview server: npx vite preview --port 4173 --strictPort
//
// RUN: node scripts/screenshot-cascade.mjs [preview-base] [out-dir]
// Defaults: http://127.0.0.1:4173 and
//   ~/workspace/eduorbit/team/cascading-filter-screenshots
//
// Checks (printed, exit 1 on failure): card counts + step-bar states at
// every cascade step, search results, and the empty state — all against
// the emulator data (which mirrors the live inventory).

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = resolve(process.argv[3] ?? `${os.homedir()}/workspace/eduorbit/team/cascading-filter-screenshots`);
mkdirSync(OUT, { recursive: true });

const SHELL = `${os.homedir()}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PROFILE = '/tmp/shot-cascade-profile';
const DEBUG_PORT = 9223;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: res, reject: rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  async waitForEvent(method, timeoutMs = 30000) {
    const start = Date.now();
    for (;;) {
      const i = this.events.findIndex((e) => e.method === method);
      if (i >= 0) return this.events.splice(i, 1)[0];
      if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${method}`);
      await sleep(100);
    }
  }
}

async function getJson(path) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}${path}`);
      if (res.ok) return await res.json();
    } catch { /* not up yet */ }
    await sleep(500);
  }
  throw new Error(`CDP endpoint ${path} never came up`);
}

const failures = [];
function check(id, cond, detail) {
  const ok = !!cond;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${id} — ${detail}`);
  if (!ok) failures.push(id);
}

const child = spawn(SHELL, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1280,900',
  'about:blank',
], { stdio: 'ignore' });

try {
  const version = await getJson('/json/version');
  const browserWs = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { browserWs.onopen = res; browserWs.onerror = rej; });
  const browser = new Cdp(browserWs);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const page = browser;
  await page.send('Page.enable', {}, sessionId);
  await page.send('Runtime.enable', {}, sessionId);

  async function navigate(url) {
    await page.send('Page.navigate', { url }, sessionId);
    await page.waitForEvent('Page.loadEventFired', 30000);
    // Cold first load (Firestore SDK init + first emulator query) can
    // take >10s; poll until the first result cards render (or 30s).
    for (let i = 0; i < 60; i++) {
      const n = await evalJs(`document.querySelectorAll('a[href^="/library/"]').length`);
      if (n > 0) break;
      await sleep(500);
    }
    await sleep(500);
  }

  async function evalJs(expression) {
    const { result } = await page.send(
      'Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true },
      sessionId,
    );
    if (result.exceptionDetails) throw new Error(`page JS error: ${JSON.stringify(result.exceptionDetails).slice(0, 500)}`);
    return result.value;
  }

  // Current Directory state: result-card count, showing text, step-bar.
  async function state() {
    return evalJs(`(() => {
      const cards = document.querySelectorAll('a[href^="/library/"]').length;
      const showing = [...document.querySelectorAll('p')].map((p) => p.textContent).find((t) => t.includes('দেখাচ্ছি') || t.includes('Showing') || t.includes('খুঁজছি') || t.includes('Searching')) || '';
      const steps = [...document.querySelectorAll('.ev-cascade-step')].map((li) => li.textContent.trim() + '|' + (li.className.includes('--done') ? 'done' : li.className.includes('--active') ? 'active' : 'disabled'));
      const selects = [...document.querySelectorAll('#cascade-stream,#cascade-level,#cascade-class,#cascade-group')].map((s) => s.id + '=' + s.value + (s.disabled ? '(disabled)' : ''));
      const empty = document.body.innerText.includes('কিছু পাওয়া যায়নি') || document.body.innerText.includes('No results');
      return { cards, showing, steps, selects, empty };
    })()`);
  }

  async function setSelect(id, value) {
    await evalJs(`(() => {
      const el = document.querySelector('#${id}');
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return el.value;
    })()`);
    await sleep(3000);
  }

  async function setSearch(value) {
    await evalJs(`(() => {
      const el = document.querySelector('#cascade-search');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return el.value;
    })()`);
    await sleep(3000);
  }

  async function shot(name, width, height, mobile) {
    await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile }, sessionId);
    await sleep(1500);
    const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
    const file = resolve(OUT, name);
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`  wrote ${file} (${Math.round(Buffer.from(data, 'base64').length / 1024)} KB)`);
  }

  // ---- desktop 1280 ----
  console.log('== desktop: /directory initial ==');
  await navigate(`${BASE}/directory`);
  let s = await state();
  check('D-init-cards', s.cards === 50, `50 cards on page 1, got ${s.cards} (${s.showing})`);
  check('D-init-steps', s.steps.length === 5 && s.steps[0].endsWith('active'), `5 steps, step 1 active: ${JSON.stringify(s.steps)}`);
  check('D-init-level-disabled', s.selects[1]?.includes('(disabled)'), `level select disabled: ${JSON.stringify(s.selects)}`);
  await shot('01-directory-initial-desktop.png', 1280, 900, false);

  console.log('== desktop: stream=general ==');
  await setSelect('cascade-stream', 'general');
  s = await state();
  check('D-general-cards', s.cards === 50, `general page 1 = 50 cards, got ${s.cards}`);
  check('D-general-steps', s.steps[0].endsWith('done') && s.steps[1].endsWith('active'), `step 1 done, step 2 active: ${JSON.stringify(s.steps)}`);
  await shot('02-stream-general-desktop.png', 1280, 900, false);

  console.log('== desktop: level=Secondary ==');
  await setSelect('cascade-level', 'Secondary');
  s = await state();
  check('D-secondary-cards', s.cards === 26, `Secondary = 26 cards, got ${s.cards} (${s.showing})`);
  check('D-secondary-class-enabled', !s.selects[2]?.includes('(disabled)'), `class select enabled: ${JSON.stringify(s.selects)}`);
  await shot('03-level-secondary-desktop.png', 1280, 900, false);

  console.log('== desktop: class=SSC ==');
  await setSelect('cascade-class', 'SSC');
  s = await state();
  check('D-ssc-cards', s.cards === 26, `SSC = 26 cards, got ${s.cards}`);
  await shot('04-class-ssc-desktop.png', 1280, 900, false);

  console.log('== desktop: group=Science ==');
  await setSelect('cascade-group', 'Science');
  s = await state();
  check('D-science-cards', s.cards === 4, `SSC Science = 4 cards, got ${s.cards} (${s.showing})`);
  check('D-science-steps', s.steps.every((x) => x.endsWith('done')) || s.steps[4].endsWith('active'), `steps: ${JSON.stringify(s.steps)}`);
  await shot('05-group-science-desktop.png', 1280, 900, false);

  console.log('== desktop: search 231101 ==');
  await navigate(`${BASE}/directory`);
  await setSearch('231101');
  s = await state();
  check('D-search-code', s.cards === 1, `search 231101 = 1 card, got ${s.cards} (${s.showing})`);
  await shot('06-search-desktop.png', 1280, 900, false);

  console.log('== desktop: search empty ==');
  await setSearch('zzzqqq');
  s = await state();
  check('D-search-empty', s.cards === 0 && s.empty, `search zzzqqq = 0 cards + empty state, got ${s.cards}, empty=${s.empty}`);
  await shot('07-search-empty-desktop.png', 1280, 900, false);

  console.log('== desktop: madrasa collapse ==');
  await navigate(`${BASE}/directory`);
  await setSelect('cascade-stream', 'madrasa');
  s = await state();
  check('D-madrasa-steps', s.steps.length === 3, `madrasa shows 3 steps, got ${s.steps.length}: ${JSON.stringify(s.steps)}`);
  check('D-madrasa-cards', s.cards === 35, `madrasa = 35 cards, got ${s.cards}`);
  await setSelect('cascade-level', 'Dakhil');
  s = await state();
  check('D-dakhil-cards', s.cards === 10, `Dakhil = 10 cards, got ${s.cards}`);
  await shot('08-madrasa-desktop.png', 1280, 900, false);

  console.log('== desktop: higher 3rd Year English ==');
  await navigate(`${BASE}/directory`);
  await setSelect('cascade-stream', 'higher');
  await setSelect('cascade-level', 'Honours');
  await setSelect('cascade-class', '3rd Year');
  await setSelect('cascade-group', 'English');
  s = await state();
  check('D-higher-english', s.cards === 8, `Honours 3rd Year English = 8 cards, got ${s.cards}`);
  await shot('09-higher-english-desktop.png', 1280, 900, false);

  // ---- mobile 390 ----
  console.log('== mobile: initial ==');
  await navigate(`${BASE}/directory`);
  await shot('01-directory-initial-mobile.png', 390, 844, true);
  s = await state();
  check('M-init-cards', s.cards === 50, `mobile initial = 50 cards, got ${s.cards}`);

  console.log('== mobile: group Science result ==');
  await setSelect('cascade-stream', 'general');
  await setSelect('cascade-level', 'Secondary');
  await setSelect('cascade-class', 'SSC');
  await setSelect('cascade-group', 'Science');
  s = await state();
  check('M-science-cards', s.cards === 4, `mobile SSC Science = 4 cards, got ${s.cards}`);
  await shot('05-group-science-mobile.png', 390, 844, true);

  console.log('== mobile: search empty ==');
  await navigate(`${BASE}/directory`);
  await setSearch('zzzqqq');
  s = await state();
  check('M-search-empty', s.cards === 0 && s.empty, `mobile search empty: cards=${s.cards}, empty=${s.empty}`);
  await shot('07-search-empty-mobile.png', 390, 844, true);

  console.log('== mobile: madrasa ==');
  await navigate(`${BASE}/directory`);
  await setSelect('cascade-stream', 'madrasa');
  await setSelect('cascade-level', 'Dakhil');
  s = await state();
  check('M-dakhil-cards', s.cards === 10, `mobile Dakhil = 10 cards, got ${s.cards}`);
  await shot('08-madrasa-mobile.png', 390, 844, true);

  console.log(failures.length === 0 ? 'E2E: ALL CHECKS PASSED' : `E2E: ${failures.length} FAILED (${failures.join(', ')})`);
  if (failures.length) process.exitCode = 1;
} finally {
  child.kill();
}
