/**
 * Forced app update — Firestore rules tests for config/appVersion
 * (owner brief 22 Nov 2026).
 *
 * RUN: npm run test:rules -- emulator-tests/rules-app-version.test.ts
 * (or the full suite: npm run test:rules). Emulator only, never live.
 * The emulator loads firestore.rules from firebase.json at startup — no
 * `rules:` option (see emulator-tests/rules.test.ts header for why).
 */
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test';
let env: RulesTestEnvironment;

const RULES_TEXT = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
if (!RULES_TEXT.includes('config/{docId}')) {
  throw new Error('firestore.rules has no config/appVersion section.');
}

const VALID = {
  latestVersion: '0.2.0',
  minVersion: '0.2.0',
  releaseNotes: 'নতুন চ্যাপ্টার যোগ হয়েছে।',
  downloadUrl: '/install',
  updatedAt: serverTimestamp(),
};

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'admin-1'), {
      displayName: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'owner-1'), {
      displayName: 'Owner',
      email: 'owner@example.com',
      role: 'owner',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'users', 'student-1'), {
      displayName: 'Student One',
      email: 'student1@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    // NOTE: config/appVersion is NOT seeded — the av0 tests create it
    // (create is the only path where a missing updatedAt can fail, since
    // on update the existing timestamp stays in the post-write doc).
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const unauth = () => env.unauthenticatedContext().firestore();
const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();

describe('config/appVersion rules', () => {
  it('av0a: admin CANNOT create appVersion without a real timestamp', async () => {
    const { updatedAt: _t, ...noTimestamp } = VALID;
    await assertFails(setDoc(doc(asAdmin(), 'config', 'appVersion'), noTimestamp));
  });

  it('av0b: admin CAN create appVersion with valid fields', async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), 'config', 'appVersion'), { ...VALID }));
  });

  it('av1: signed-out visitor CAN read appVersion (gate runs before sign-in)', async () => {
    await assertSucceeds(getDoc(doc(unauth(), 'config', 'appVersion')));
  });

  it('av2: signed-out visitor CANNOT read any other config doc', async () => {
    await assertFails(getDoc(doc(unauth(), 'config', 'other')));
  });

  it('av3: student CAN read appVersion', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'config', 'appVersion')));
  });

  it('av4: student CANNOT write appVersion', async () => {
    await assertFails(
      updateDoc(doc(asStudent1(), 'config', 'appVersion'), { latestVersion: '9.9.9' }),
    );
  });

  it('av5: admin CAN update appVersion with valid fields', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'config', 'appVersion'), {
        latestVersion: '0.3.0',
        minVersion: '0.2.0',
        updatedAt: serverTimestamp(),
      }),
    );
    // Restore the seeded values for the tests below.
    await updateDoc(doc(asAdmin(), 'config', 'appVersion'), { ...VALID });
  });

  it('av6: owner CAN update appVersion with an https download URL', async () => {
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'config', 'appVersion'), {
        downloadUrl: 'https://eduvelto.com/install',
        updatedAt: serverTimestamp(),
      }),
    );
    await updateDoc(doc(asOwner(), 'config', 'appVersion'), { ...VALID });
  });

  it('av7: admin CANNOT write a malformed version', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'config', 'appVersion'), {
        latestVersion: '1.2.3.4',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(asAdmin(), 'config', 'appVersion'), {
        latestVersion: 'v0.2.0',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('av8: admin CANNOT write an extra key', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'config', 'appVersion'), {
        // @ts-expect-error — deliberately invalid payload for the rules test
        hacked: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('av9: admin CANNOT write a non-path download URL', async () => {
    await assertFails(
      updateDoc(doc(asAdmin(), 'config', 'appVersion'), {
        downloadUrl: 'javascript:alert(1)',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('av10: admin CANNOT delete appVersion', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'config', 'appVersion')));
  });

  it('av11: admin CANNOT write any other config doc', async () => {
    await assertFails(setDoc(doc(asAdmin(), 'config', 'other'), { ...VALID }));
  });
});
