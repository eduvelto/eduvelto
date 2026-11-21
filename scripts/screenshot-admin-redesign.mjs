/**
 * Screenshot the redesigned Admin Panel from the emulator build
 * (DEV/STAGING ONLY — never run against live Firebase).
 *
 * Logs in as the seeded owner, captures the admin dashboard + the six
 * new admin pages in Bangla and English, desktop + mobile, then flips
 * the owner's language to 'en' via the Firestore emulator REST API
 * and re-shoots the key pages. Finally captures the signed-out access
 * gate from the live preview channel (through the egress forwarder).
 *
 * PREREQUISITES (in order):
 *   1. Emulators on 8083/9099 (firebase.dashboards.json).
 *   2. node scripts/seed-dashboard-screenshots.mjs
 *   3. Emulator build: VITE_USE_FIREBASE_EMULATORS=1
 *      VITE_FIRESTORE_EMULATOR_PORT=8083 VITE_AUTH_EMULATOR_PORT=9099
 *      npm run build
 *   4. Preview server: npx vite preview --port 4173 --strictPort
 *
 * RUN: node scripts/screenshot-admin-redesign.mjs
 */
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { startForwarder } from '../../i18n-shots-tmp/i18n-proxy.mjs';

const BASE = 'http://localhost:4173';
const LIVE = 'https://eduvelto--admin-redesign-7ofbv837.web.app';
const OUT = resolve(`${os.homedir()}/workspace/eduorbit/team/admin-redesign-screenshots`);
mkdirSync(OUT, { recursive: true });

const SHELL = `${os.homedir()}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PROFILE = '/tmp/shot-admin-profile';
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
    // Only match events that arrive AFTER this call starts — a stale
    // loadEventFired from an earlier navigation must not satisfy us.
    const startIndex = this.events.length;
    const start = Date.now();
    for (;;) {
      const i = this.events.findIndex((e, idx) => idx >= startIndex && e.method === method);
      if (i >= 0) return this.events.splice(i, 1)[0];
      if (Date.now() - start > timeoutMs) throw new Error(`timeout waiting for ${method}`);
      await sleep(100);
    }
  }
}

async function getJson(path, port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${path}`);
      if (res.ok) return await res.json();
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`CDP endpoint ${path} never came up`);
}

function launchChrome(extraArgs = []) {
  return spawn(SHELL, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900',
    ...extraArgs,
    'about:blank',
  ], { stdio: 'ignore' });
}

async function setOwnerLanguage(lang) {
  // The emulator REST API enforces the rules (unauthenticated reads are
  // denied), so flip the field the same way the seed script writes:
  // rules-unit-testing with security rules disabled.
  const env = await initializeTestEnvironment({
    projectId: 'eduvelto',
    firestore: { host: '127.0.0.1', port: 8083 },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'owner'), limit(1)));
    if (snap.empty) throw new Error('owner user not found in emulator');
    await updateDoc(doc(db, 'users', snap.docs[0].id), { language: lang });
  });
  await env.cleanup();
  console.log(`  owner language set to ${lang}`);
}

async function main() {
  const child = launchChrome();
  try {
    const version = await getJson('/json/version', DEBUG_PORT);
    const browserWs = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      browserWs.onopen = res;
      browserWs.onerror = rej;
    });
    const browser = new Cdp(browserWs);
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const page = browser;
    await page.send('Page.enable', {}, sessionId);
    await page.send('Runtime.enable', {}, sessionId);

    async function navigate(url) {
      await page.send('Page.navigate', { url }, sessionId);
      await page.waitForEvent('Page.loadEventFired', 30000);
      await sleep(4000);
      // Wait for React to mount (the bundle can be slow on first load).
      for (let i = 0; i < 20; i++) {
        const len = await evalJs('document.body ? document.body.innerText.length : 0').catch(() => 0);
        if (len > 50) break;
        await sleep(1000);
      }
    }

    async function evalJs(expression) {
      const { result } = await page.send(
        'Runtime.evaluate',
        { expression, awaitPromise: true, returnByValue: true },
        sessionId,
      );
      if (result.exceptionDetails) throw new Error(`page JS error: ${JSON.stringify(result.exceptionDetails)}`);
      return result.value;
    }

    async function login(email) {
      await navigate(`${BASE}/login`);
      // Poll for the form — React + the emulator auth state can be slow.
      let ok = 'no-form';
      for (let i = 0; i < 10 && ok === 'no-form'; i++) {
        ok = await evalJs(`(() => {
          const setVal = (el, v) => {
            const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          };
          const email = document.querySelector('input[type=email]');
          const pass = document.querySelector('input[type=password]');
          if (!email || !pass) return 'no-form';
          setVal(email, ${JSON.stringify(email)});
          setVal(pass, 'shot1234');
          document.querySelector('form button[type=submit]').click();
          return 'submitted';
        })()`);
        if (ok === 'no-form') await sleep(2000);
      }
      if (ok !== 'submitted') {
        const diag = await evalJs(`JSON.stringify({url: location.href, text: document.body.innerText.slice(0, 300), inputs: [...document.querySelectorAll('input')].map(i => i.type)})`);
        throw new Error(`login form not found for ${email}: ${ok} — page: ${diag}`);
      }
      await sleep(5000);
      console.log(`  logged in as ${email}, at ${await evalJs('location.pathname')}`);
    }

    async function logout() {
      await evalJs(`new Promise((res) => {
        try { localStorage.clear(); sessionStorage.clear(); } catch {}
        const req = indexedDB.deleteDatabase('firebaseLocalStorageDb');
        req.onsuccess = req.onerror = req.onblocked = () => res('done');
        setTimeout(() => res('timeout'), 3000);
      })`);
      await sleep(1000);
      await navigate(`${BASE}/login`);
    }

    async function shot(name, width, height, mobile) {
      await page.send(
        'Emulation.setDeviceMetricsOverride',
        { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile },
        sessionId,
      );
      await sleep(1500);
      const text = await evalJs('document.body.innerText.slice(0, 300)');
      const { data } = await page.send(
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: true },
        sessionId,
      );
      const file = resolve(OUT, name);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`  wrote ${file} (${Math.round(Buffer.from(data, 'base64').length / 1024)} KB)`);
      console.log(`  first text: ${JSON.stringify(text.slice(0, 160))}`);
    }

    async function shootPage(path, stem, mode) {
      await navigate(`${BASE}${path}`);
      await shot(`${stem}-${mode}-desktop1280.png`, 1280, 900, false);
      await shot(`${stem}-${mode}-mobile390.png`, 390, 844, true);
    }

    const PAGES = [
      { path: '/admin', stem: 'admin-dashboard' },
      { path: '/admin/jobs', stem: 'admin-jobs' },
      { path: '/admin/admissions', stem: 'admin-admissions' },
      { path: '/admin/analytics', stem: 'admin-analytics' },
      { path: '/admin/settings', stem: 'admin-settings' },
      { path: '/admin/content', stem: 'admin-content' },
      { path: '/admin/exams', stem: 'admin-exams' },
    ];

    console.log('== owner@shot.eduvelto — Bangla ==');
    await logout();
    await login('owner@shot.eduvelto');
    for (const p of PAGES) {
      console.log(`-- ${p.path} (bn) --`);
      await shootPage(p.path, p.stem, 'bn');
    }

    console.log('== owner language -> en ==');
    await setOwnerLanguage('en');
    await logout();
    await login('owner@shot.eduvelto');
    for (const p of PAGES.slice(0, 5)) {
      console.log(`-- ${p.path} (en) --`);
      await shootPage(p.path, p.stem, 'en');
    }

    console.log('Done (emulator shots).');
  } finally {
    child.kill('SIGKILL');
    try {
      execSync('rm -rf /tmp/shot-admin-profile');
    } catch {
      // ignore
    }
  }

  // --- Signed-out access gate from the live preview channel ---
  console.log('== live preview gate (signed out) ==');
  const forwarder = await startForwarder(3129);
  const child2 = launchChrome(['--proxy-server=http://127.0.0.1:3129', '--ignore-certificate-errors']);
  try {
    const version = await getJson('/json/version', DEBUG_PORT);
    const browserWs = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      browserWs.onopen = res;
      browserWs.onerror = rej;
    });
    const browser = new Cdp(browserWs);
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const page = browser;
    await page.send('Page.enable', {}, sessionId);
    await page.send('Runtime.enable', {}, sessionId);

    async function evalJs(expression) {
      const { result } = await page.send(
        'Runtime.evaluate',
        { expression, awaitPromise: true, returnByValue: true },
        sessionId,
      );
      if (result.exceptionDetails) throw new Error(`page JS error: ${JSON.stringify(result.exceptionDetails)}`);
      return result.value;
    }

    for (const mode of ['bn', 'en']) {
      await page.send('Page.navigate', { url: `${LIVE}/admin` }, sessionId);
      await browser.waitForEvent('Page.loadEventFired', 30000);
      await sleep(4000);
      await evalJs(`localStorage.setItem('eduvelto-language','${mode}'); 'ok'`);
      await page.send('Page.navigate', { url: `${LIVE}/admin` }, sessionId);
      await browser.waitForEvent('Page.loadEventFired', 30000);
      await sleep(4000);
      for (const [w, h, mobile, tag] of [[1280, 900, false, 'desktop1280'], [390, 844, true, 'mobile390']]) {
        await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile }, sessionId);
        await sleep(1200);
        const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
        const file = resolve(OUT, `admin-gate-${mode}-${tag}.png`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        console.log(`  wrote ${file}`);
      }
    }
  } finally {
    child2.kill('SIGKILL');
    forwarder.close();
    try {
      execSync('rm -rf /tmp/shot-admin-profile');
    } catch {
      // ignore
    }
  }
  console.log(`Done. Screenshots in ${OUT}`);
}

await main();
