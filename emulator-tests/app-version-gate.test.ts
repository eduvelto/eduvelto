/**
 * Forced app update — gate end-to-end test (owner brief 22 Nov 2026).
 *
 * Seeds config/appVersion in the emulator, then reads it back with the
 * REAL app code path (fetchAppVersionConfig → getDocFromServer) using a
 * plain unauthenticated Firestore SDK client — exactly what the app does
 * on load — and asserts the gate decision. This proves the read path +
 * decision work against a real Firestore, not just the pure functions.
 *
 * RUN: npm run test:rules -- emulator-tests/app-version-gate.test.ts
 * Emulator only, never live. No browser is involved: the visual block
 * screen itself is covered by src/components/AppVersionGate.test.tsx
 * (renderToStaticMarkup) — a browser click-through is still owed and is
 * recorded as NOT verified in the report.
 */
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import {
  APP_VERSION,
  checkAppVersion,
  fetchAppVersionConfig,
} from '../src/lib/appVersion';

const PROJECT_ID = 'eduvelto-rules-test';
const PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
let env: RulesTestEnvironment;
let rawApp: FirebaseApp;
let rawDb: Firestore;

async function seedConfig(latestVersion: string, minVersion: string): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'config', 'appVersion'), {
      latestVersion,
      minVersion,
      releaseNotes: 'পরীক্ষার নোট।',
      downloadUrl: '/install',
      updatedAt: serverTimestamp(),
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: PORT },
  });
  rawApp = initializeApp({ projectId: PROJECT_ID }, 'gate-test');
  rawDb = getFirestore(rawApp);
  connectFirestoreEmulator(rawDb, '127.0.0.1', PORT);
}, 300000);

afterAll(async () => {
  await deleteApp(rawApp);
  await env.cleanup();
});

describe('app version gate (real SDK read)', () => {
  it('g1: minVersion ABOVE the bundled version → blocked, download is /install', async () => {
    await seedConfig('9.9.9', '9.9.9');
    const cfg = await fetchAppVersionConfig(rawDb);
    expect(cfg).not.toBeNull();
    expect(cfg?.latestVersion).toBe('9.9.9');
    expect(cfg?.downloadUrl).toBe('/install');
    expect(checkAppVersion(cfg, APP_VERSION)).toBe('blocked');
  });

  it('g2: latest newer but minVersion met → update-available', async () => {
    await seedConfig('0.2.0', '0.1.0');
    const cfg = await fetchAppVersionConfig(rawDb);
    expect(checkAppVersion(cfg, APP_VERSION)).toBe('update-available');
  });

  it('g3: bundled version meets latest → current', async () => {
    await seedConfig('0.1.0', '0.1.0');
    const cfg = await fetchAppVersionConfig(rawDb);
    expect(checkAppVersion(cfg, APP_VERSION)).toBe('current');
  });
});
