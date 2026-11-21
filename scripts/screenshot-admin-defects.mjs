/**
 * Defect-fix verification shots for the admin redesign (DEV/STAGING ONLY).
 *
 * Verifies the two fixes from team/admin-redesign-report.md §4:
 *   (a) EN sidebar at 1280px — every section label fully visible
 *       (no ellipsis: label scrollWidth <= clientWidth), BN + EN.
 *   (b) Mobile top bar at 390px — search placeholder hidden (no
 *       truncated "Search"/"যেকো" text), BN + EN.
 * Plus the mobile drawer open-state (never screenshotted before).
 *
 * PREREQUISITES (in order):
 *   1. Emulators on 8083/9099 (firebase.dashboards.json), with
 *      JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true.
 *   2. node scripts/seed-dashboard-screenshots.mjs
 *   3. Emulator build: VITE_USE_FIREBASE_EMULATORS=1
 *      VITE_FIRESTORE_EMULATOR_PORT=8083 VITE_AUTH_EMULATOR_PORT=9099
 *      npm run build
 *   4. Preview server: npx vite preview --port 4173 --strictPort
 *
 * RUN: node scripts/screenshot-admin-defects.mjs
 * Writes team/admin-redesign-screenshots/defect-*.png + prints the
 * label measurements to stdout (the pass/fail evidence).
 */
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';

const BASE = 'http://localhost:4173';
const OUT = resolve(`${os.homedir()}/workspace/eduorbit/team/admin-redesign-screenshots`);
mkdirSync(OUT, { recursive: true });

const SHELL = `${os.homedir()}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PROFILE = '/tmp/shot-defects-profile';
const DEBUG_PORT = 9224;

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

    async function evalJs(expression) {
      const { result } = await page.send(
        'Runtime.evaluate',
        { expression, awaitPromise: true, returnByValue: true },
        sessionId,
      );
      if (result.exceptionDetails) throw new Error(`page JS error: ${JSON.stringify(result.exceptionDetails)}`);
      return result.value;
    }

    async function navigate(url) {
      await page.send('Page.navigate', { url }, sessionId);
      await page.waitForEvent('Page.loadEventFired', 30000);
      await sleep(4000);
      for (let i = 0; i < 20; i++) {
        const len = await evalJs('document.body ? document.body.innerText.length : 0').catch(() => 0);
        if (len > 50) break;
        await sleep(1000);
      }
    }

    async function login(email) {
      await navigate(`${BASE}/login`);
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
      if (ok !== 'submitted') throw new Error(`login form not found: ${ok}`);
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

    async function setMetrics(width, height, mobile) {
      await page.send(
        'Emulation.setDeviceMetricsOverride',
        { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile },
        sessionId,
      );
      await sleep(1200);
    }

    async function shot(name, beyondViewport) {
      const { data } = await page.send(
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: beyondViewport },
        sessionId,
      );
      const file = resolve(OUT, name);
      writeFileSync(file, Buffer.from(data, 'base64'));
      console.log(`  wrote ${file} (${Math.round(Buffer.from(data, 'base64').length / 1024)} KB)`);
    }

    // --- Defect (a): sidebar label measurements (ground truth) ---
    async function measureSidebarLabels() {
      return evalJs(`JSON.stringify([...document.querySelectorAll('.ev-admin-nav-label')].map((el) => ({
        text: el.textContent,
        scroll: el.scrollWidth,
        client: el.clientWidth,
        truncated: el.scrollWidth > el.clientWidth,
      })))`);
    }

    // --- Defect (b): top-bar search placeholder state ---
    async function measureSearch() {
      return evalJs(`JSON.stringify((() => {
        const input = document.querySelector('.ev-admin-search-input');
        if (!input) return { found: false };
        const cs = getComputedStyle(input, '::placeholder');
        return {
          found: true,
          placeholder: input.getAttribute('placeholder'),
          placeholderColor: cs.color,
          inputWidth: Math.round(input.getBoundingClientRect().width),
          topbarText: document.querySelector('.ev-admin-topbar').innerText.replace(/\\n/g, ' | ').slice(0, 120),
        };
      })())`);
    }

    // ===== Bangla first (seed default) =====
    console.log('== owner — Bangla ==');
    await logout();
    await login('owner@shot.eduvelto');

    console.log('-- /admin desktop 1280 (bn) --');
    await navigate(`${BASE}/admin`);
    await setMetrics(1280, 900, false);
    console.log('  sidebar labels (bn):', await measureSidebarLabels());
    await shot('defect-sidebar-bn-desktop1280.png', true);
    await shot('defect-sidebar-bn-desktop1280-viewport.png', false);

    console.log('-- /admin mobile 390 top bar (bn) --');
    await setMetrics(390, 844, true);
    console.log('  search (bn):', await measureSearch());
    await shot('defect-topbar-bn-mobile390.png', false);

    console.log('-- mobile drawer open (bn) --');
    await evalJs(`document.querySelector('.ev-admin-hamburger').click(); 'clicked'`);
    await sleep(1200);
    console.log('  drawer state:', await evalJs(`JSON.stringify({
      open: document.querySelector('.ev-admin-shell').className.includes('ev-admin-drawer-open'),
      sidebarTransform: getComputedStyle(document.querySelector('.ev-admin-sidebar')).transform,
    })`));
    await shot('defect-drawer-bn-mobile390.png', false);
    await evalJs(`document.querySelector('.ev-admin-hamburger').click(); 'closed'`);
    await sleep(800);

    // ===== English =====
    console.log('== owner language -> en ==');
    await setOwnerLanguage('en');
    await logout();
    await login('owner@shot.eduvelto');

    console.log('-- /admin desktop 1280 (en) --');
    await navigate(`${BASE}/admin`);
    await setMetrics(1280, 900, false);
    console.log('  sidebar labels (en):', await measureSidebarLabels());
    await shot('defect-sidebar-en-desktop1280.png', true);
    await shot('defect-sidebar-en-desktop1280-viewport.png', false);

    console.log('-- /admin mobile 390 top bar (en) --');
    await setMetrics(390, 844, true);
    console.log('  search (en):', await measureSearch());
    await shot('defect-topbar-en-mobile390.png', false);

    console.log('-- mobile drawer open (en) --');
    await evalJs(`document.querySelector('.ev-admin-hamburger').click(); 'clicked'`);
    await sleep(1200);
    console.log('  drawer state:', await evalJs(`JSON.stringify({
      open: document.querySelector('.ev-admin-shell').className.includes('ev-admin-drawer-open'),
      sidebarTransform: getComputedStyle(document.querySelector('.ev-admin-sidebar')).transform,
    })`));
    await shot('defect-drawer-en-mobile390.png', false);

    console.log('Done (defect shots).');
  } finally {
    child.kill('SIGKILL');
    try {
      execSync('rm -rf /tmp/shot-defects-profile');
    } catch {
      // ignore
    }
  }
  console.log(`Done. Screenshots in ${OUT}`);
}

await main();
