/**
 * MFA CLAIM PROBE (temporary — delete before final commit).
 * Question: can @firebase/rules-unit-testing carry the
 * firebase.sign_in_second_factor claim into request.auth.token.firebase?
 * If the WITH-MFA test passes, the Team system's MFA-gated sector writes
 * are testable in the emulator. If it fails, the claim does not propagate
 * and the MFA allow-path must be verified with a real MFA account.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'eduvelto-rules-test';
const FIRESTORE_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
let env: RulesTestEnvironment;

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'team-admin-1'), {
      displayName: 'Team Admin',
      email: 'team@example.com',
      role: 'student',
      language: 'bn',
      isActive: true,
    });
    await setDoc(doc(db, 'adminAssignments', 'team-admin-1'), {
      userId: 'team-admin-1',
      displayName: 'Team Admin',
      email: 'team@example.com',
      sectors: { 'community-moderation': { permissions: ['view', 'moderate'] } },
      status: 'active',
      expiresAt: null,
      assignedBy: 'nczNklmktsVrxg43UzcgdSm6v0j2',
      assignedAt: new Date(),
      updatedAt: new Date(),
      note: 'probe',
    });
    await setDoc(doc(db, 'posts', 'post-1'), {
      authorId: 'student-1',
      title: 'Probe post',
      body: 'Probe body.',
      reviewStatus: 'Under Review',
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: FIRESTORE_PORT },
  });
  await seed();
}, 120000);

afterAll(async () => {
  await env.cleanup();
});

const asTeamNoMfa = () => env.authenticatedContext('team-admin-1').firestore();
const asTeamMfa = () =>
  env
    .authenticatedContext('team-admin-1', {
      firebase: { sign_in_provider: 'password', sign_in_second_factor: 'phone' },
    } as never)
    .firestore();

describe('MFA claim probe', () => {
  it('sector write WITHOUT MFA is DENIED', async () => {
    await assertFails(
      updateDoc(doc(asTeamNoMfa(), 'posts', 'post-1'), { reviewStatus: 'Published' }),
    );
  }, 120000);
  it('sector write WITH MFA claim is ALLOWED', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeamMfa(), 'posts', 'post-1'), { reviewStatus: 'Published' }),
    );
  }, 120000);
});
