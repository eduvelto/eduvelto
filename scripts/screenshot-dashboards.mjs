/**
 * Screenshot the role dashboards from the emulator build (DEV/STAGING ONLY).
 *
 * Drives the headless Chromium shell over CDP with Node's built-in
 * WebSocket (no extra dependencies): logs in as each seeded screenshot
 * account, navigates to the dashboard, and captures a full-page PNG.
 *
 * PREREQUISITES (in order):
 *   1. Emulator running on 8083/9099 with the dashboard rules.
 *   2. node scripts/seed-dashboard-screenshots.mjs (creates the accounts).
 *   3. Emulator build: VITE_USE_FIREBASE_EMULATORS=1
 *      VITE_FIRESTORE_EMULATOR_PORT=8083 VITE_AUTH_EMULATOR_PORT=9099
 *      npm run build
 *   4. Preview server: npx vite preview --port 4173 --strictPort
 *
 * RUN: node scripts/screenshot-dashboards.mjs [preview-base] [out-dir]
 * Defaults: http://127.0.0.1:4173 and
 *   ~/workspace/eduorbit/team/dashboard-screenshots
 *
 * Shots: student + teacher + guardian dashboards (desktop 1280 + mobile
 * 390, full-page), child confirmation screen, admin guardian queue,
 * teacher application form.
 */
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4173';
const OUT = resolve(process.argv[3] ?? `${os.homedir()}/workspace/eduorbit/team/dashboard-screenshots`);
mkdirSync(OUT, { recursive: true });

const SHELL = `${os.homedir()}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PROFILE = '/tmp/shot-profile';
const DEBUG_PORT = 9222;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Minimal CDP client over one WebSocket. */
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
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`CDP endpoint ${path} never came up`);
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
    await sleep(4000); // React render + emulator reads (slow under contention)
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
    const ok = await evalJs(`(() => {
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
    if (ok !== 'submitted') throw new Error(`login form not found for ${email}: ${ok}`);
    await sleep(5000);
    const where = await evalJs('location.pathname');
    console.log(`  logged in as ${email}, at ${where}`);
  }

  async function logout() {
    // Firebase Auth persists the session in IndexedDB
    // (firebaseLocalStorageDb), NOT localStorage — clearing storage alone
    // leaves the previous user signed in, so /login redirects away and
    // the next login finds no form. Delete the Auth DB too.
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
    const text = await evalJs('document.body.innerText.slice(0, 400)');
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

  const shots = [
    { user: 'student@shot.eduvelto', path: '/student', name: 'student-dashboard', mobileName: 'student-dashboard-mobile' },
    { user: 'ssc@shot.eduvelto', path: '/student', name: 'ssc-student-dashboard', mobileName: 'ssc-student-dashboard-mobile' },
    { user: 'teacher@shot.eduvelto', path: '/teacher', name: 'teacher-dashboard', mobileName: 'teacher-dashboard-mobile' },
    { user: 'guardian@shot.eduvelto', path: '/guardian', name: 'guardian-dashboard', mobileName: 'guardian-dashboard-mobile' },
  ];
  for (const s of shots) {
    console.log(`== ${s.user} ${s.path} ==`);
    await logout();
    await login(s.user);
    await navigate(`${BASE}${s.path}`);
    await shot(`${s.name}-desktop.png`, 1280, 900, false);
    await shot(`${s.mobileName}.png`, 390, 844, true);
  }

  // Child confirmation screen (child2 has a PENDING request).
  console.log('== child2@shot.eduvelto /profile/guardian-links ==');
  await logout();
  await login('child2@shot.eduvelto');
  await navigate(`${BASE}/profile/guardian-links`);
  await shot('guardian-confirm-desktop.png', 1280, 900, false);

  // Admin guardian queue — AdminGuard is OWNER-ONLY, so the admin login
  // correctly captures the denial; the owner login captures the queue.
  console.log('== admin@shot.eduvelto /admin/guardians (expect: access denied) ==');
  await logout();
  await login('admin@shot.eduvelto');
  await navigate(`${BASE}/admin/guardians`);
  await shot('admin-guardians-desktop.png', 1280, 900, false);

  console.log('== owner@shot.eduvelto /admin/guardians ==');
  await logout();
  await login('owner@shot.eduvelto');
  await navigate(`${BASE}/admin/guardians`);
  await shot('owner-guardians-desktop.png', 1280, 900, false);

  // Teacher application form (teacher2 is pending, no application yet).
  console.log('== teacher2@shot.eduvelto /teacher/register ==');
  await logout();
  await login('teacher2@shot.eduvelto');
  await navigate(`${BASE}/teacher/register`);
  await shot('teacher-form-desktop.png', 1280, 900, false);

  // Admin dashboard + users list (owner only; AdminGuard is owner-only).
  // Added for the role-dashboards design restyle (stages 6–8).
  console.log('== owner@shot.eduvelto /admin ==');
  await logout();
  await login('owner@shot.eduvelto');
  await navigate(`${BASE}/admin`);
  await shot('admin-dashboard-desktop.png', 1280, 900, false);
  await shot('admin-dashboard-mobile.png', 390, 844, true);
  console.log('== owner@shot.eduvelto /admin/users ==');
  await navigate(`${BASE}/admin/users`);
  await shot('admin-users-desktop.png', 1280, 900, false);
  await shot('admin-users-mobile.png', 390, 844, true);

  console.log(`Done. Screenshots in ${OUT}`);
} finally {
  child.kill('SIGKILL');
  try {
    execSync('rm -rf /tmp/shot-profile');
  } catch {
    // ignore
  }
}
