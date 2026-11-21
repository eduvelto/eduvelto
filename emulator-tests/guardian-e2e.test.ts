/**
 * Eduvelto — guardian-linking END-TO-END tests (owner order 21 Nov 07:36).
 *
 * Runs the LIB functions (src/lib/guardian.ts, src/lib/admin.ts) against
 * the Firestore emulator with rules ENABLED — the same code paths the
 * UI calls. Each scenario uses its own guardian/child pair so tests
 * never share link state.
 *
 *   (e1) request → child confirm → admin approve → guardian reads the
 *        child's progress → guardian revokes → read denied again.
 *        Audit entries exist for EVERY step.
 *   (e2) request → child confirm → admin REJECTS with a reason.
 *   (e3) request → CHILD rejects (pending -> revoked).
 *   (e4) request → confirm → approve → ADMIN revokes.
 *   (e5) request with missing guardian info is refused by the lib.
 *   (e6) a non-admin deciding a link is refused (rules deny the batch).
 *   (e7) the WRONG child confirming is refused.
 *   (e8) teacher application carries post + institutionContact.
 *
 * RUN: FIRESTORE_EMULATOR_PORT=8083 npx vitest run emulator-tests/guardian-e2e.test.ts
 * (port must match the running emulator; the suite does NOT start one.)
 */
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import {
  requestParentLink,
  confirmParentLink,
  rejectParentLink,
  decideParentLink,
  revokeParentLink,
  getParentLink,
  parentLinkId,
} from '../src/lib/guardian';
import { submitTeacherApplication, getMyTeacherApplication } from '../src/lib/admin';

const PROJECT_ID = 'eduvelto-guardian-e2e';
let env: RulesTestEnvironment;

function as(uid: string): Firestore {
  return env.authenticatedContext(uid).firestore() as unknown as Firestore;
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const user = (uid: string, role: string, extra: Record<string, unknown> = {}) =>
      setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
        ...extra,
      });
    await user('admin-1', 'admin');
    await user('guardian-1', 'parent', { phone: '01700000001' });
    await user('guardian-2', 'parent', { phone: '01700000002' });
    await user('student-1', 'student', { educationType: 'general', classLevel: 'Class 5' });
    await user('student-2', 'student', { educationType: 'general', classLevel: 'Class 6' });
    await user('child-1', 'student', { educationType: 'general', classLevel: 'Class 5' });
    await user('child-2', 'student', { educationType: 'general', classLevel: 'Class 7' });
    await user('teacher-9', 'teacher', { verificationStatus: 'pending' });
    // One progress doc per child, for the link-gated read checks.
    for (const [id, uid] of [
      ['prog-student-1', 'student-1'],
      ['prog-student-2', 'student-2'],
      ['prog-child-1', 'child-1'],
      ['prog-child-2', 'child-2'],
    ] as const) {
      await setDoc(doc(db, 'progress', id), {
        userId: uid,
        subject: 'Mathematics',
        lessonsRead: 3,
        questionsAttempted: 12,
      });
    }
  });
}

/** Audit entries for one link, read with rules disabled (the harness
 * reading its own emulator data — adminActions reads are owner-only
 * in the rules, so no user context can list them). */
async function auditFor(linkId: string): Promise<Array<{ action: string; actorId: string }>> {
  let out: Array<{ action: string; actorId: string }> = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(
      query(collection(ctx.firestore(), 'adminActions'), where('targetId', '==', linkId)),
    );
    out = snap.docs.map((d) => ({ action: d.data().action as string, actorId: d.data().actorId as string }));
  });
  return out;
}

function auditActions(entries: Array<{ action: string }>): string[] {
  return entries.map((e) => e.action).sort();
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  // Hermetic runs: a previous run's links would make requestParentLink's
  // setDoc an UPDATE (denied) instead of a create.
  await env.clearFirestore();
  await seed();
}, 120000);

afterAll(async () => {
  await env.cleanup();
});

describe('guardian linking end-to-end (lib + rules)', () => {
  it('(e1) request → confirm → approve → read → guardian revokes → read denied', async () => {
    const linkId = parentLinkId('guardian-1', 'student-1');
    // 1. Guardian requests.
    const link = await requestParentLink(as('guardian-1'), 'guardian-1', 'student-1', {
      guardianDisplayName: 'Guardian One',
      relationship: 'Father',
      guardianContact: '01700000001',
      childDisplayName: 'Student One',
      childClassLevel: 'Class 5',
      childInstitution: 'Test School',
    });
    if (link.status !== 'pending') throw new Error(`expected pending, got ${link.status}`);
    // 2. Child confirms.
    await confirmParentLink(as('student-1'), linkId, 'student-1');
    if ((await getParentLink(as('student-1'), linkId))?.status !== 'confirmed') {
      throw new Error('expected confirmed after child confirmation');
    }
    // 3. Admin approves.
    await decideParentLink(as('admin-1'), 'admin-1', linkId, 'verified', 'Child confirmed; information matches.');
    if ((await getParentLink(as('guardian-1'), linkId))?.status !== 'verified') {
      throw new Error('expected verified after admin approval');
    }
    // 4. Guardian reads the linked child's progress.
    await assertSucceeds(getDoc(doc(as('guardian-1'), 'progress', 'prog-student-1')));
    // 5. Guardian revokes.
    await revokeParentLink(as('guardian-1'), linkId, 'guardian-1');
    if ((await getParentLink(as('guardian-1'), linkId))?.status !== 'revoked') {
      throw new Error('expected revoked after guardian revoke');
    }
    // 6. The read dies with the link.
    await assertFails(getDoc(doc(as('guardian-1'), 'progress', 'prog-student-1')));
    // 7. Every step left an audit entry.
    const actions = auditActions(await auditFor(linkId));
    for (const want of ['guardian-link-requested', 'guardian-link-confirmed', 'guardian-link-approved', 'guardian-link-revoked']) {
      if (!actions.includes(want)) throw new Error(`missing audit entry ${want}; have: ${actions.join(',')}`);
    }
  });

  it('(e2) request → confirm → admin REJECTS with a reason', async () => {
    const linkId = parentLinkId('guardian-2', 'student-2');
    await requestParentLink(as('guardian-2'), 'guardian-2', 'student-2', {
      guardianDisplayName: 'Guardian Two',
      relationship: 'Mother',
      guardianContact: '01700000002',
      childDisplayName: 'Student Two',
      childClassLevel: 'Class 6',
      childInstitution: 'Test School',
    });
    await confirmParentLink(as('student-2'), linkId, 'student-2');
    await decideParentLink(as('admin-1'), 'admin-1', linkId, 'rejected', 'Information did not match the school record.');
    const link = await getParentLink(as('guardian-2'), linkId);
    if (link?.status !== 'rejected') throw new Error(`expected rejected, got ${link?.status}`);
    if (!link?.decisionReason?.includes('school record')) throw new Error('decision reason not stored');
    await assertFails(getDoc(doc(as('guardian-2'), 'progress', 'prog-student-2')));
    const actions = auditActions(await auditFor(linkId));
    for (const want of ['guardian-link-requested', 'guardian-link-confirmed', 'guardian-link-rejected']) {
      if (!actions.includes(want)) throw new Error(`missing audit entry ${want}; have: ${actions.join(',')}`);
    }
  });

  it('(e3) request → CHILD rejects (pending -> revoked)', async () => {
    const linkId = parentLinkId('guardian-1', 'child-1');
    await requestParentLink(as('guardian-1'), 'guardian-1', 'child-1', {
      guardianDisplayName: 'Guardian One',
      relationship: 'Father',
      guardianContact: '01700000001',
      childDisplayName: 'Child One',
      childClassLevel: 'Class 5',
      childInstitution: 'Test School',
    });
    await rejectParentLink(as('child-1'), linkId, 'child-1');
    const link = await getParentLink(as('child-1'), linkId);
    if (link?.status !== 'revoked') throw new Error(`expected revoked, got ${link?.status}`);
    await assertFails(getDoc(doc(as('guardian-1'), 'progress', 'prog-child-1')));
    const actions = auditActions(await auditFor(linkId));
    if (!actions.includes('guardian-link-revoked')) throw new Error(`missing revoke audit; have: ${actions.join(',')}`);
  });

  it('(e4) request → confirm → approve → ADMIN revokes', async () => {
    const linkId = parentLinkId('guardian-2', 'child-2');
    await requestParentLink(as('guardian-2'), 'guardian-2', 'child-2', {
      guardianDisplayName: 'Guardian Two',
      relationship: 'Mother',
      guardianContact: '01700000002',
      childDisplayName: 'Child Two',
      childClassLevel: 'Class 7',
      childInstitution: 'Test School',
    });
    await confirmParentLink(as('child-2'), linkId, 'child-2');
    await decideParentLink(as('admin-1'), 'admin-1', linkId, 'verified', 'Child confirmed; information matches.');
    await assertSucceeds(getDoc(doc(as('guardian-2'), 'progress', 'prog-child-2')));
    await revokeParentLink(as('admin-1'), linkId, 'admin-1');
    if ((await getParentLink(as('admin-1'), linkId))?.status !== 'revoked') {
      throw new Error('expected revoked after admin revoke');
    }
    await assertFails(getDoc(doc(as('guardian-2'), 'progress', 'prog-child-2')));
    const actions = auditActions(await auditFor(linkId));
    for (const want of ['guardian-link-approved', 'guardian-link-revoked']) {
      if (!actions.includes(want)) throw new Error(`missing audit entry ${want}; have: ${actions.join(',')}`);
    }
  });

  it('(e5) request with missing guardian info is refused', async () => {
    await expect(
      requestParentLink(as('guardian-1'), 'guardian-1', 'student-1', {
        guardianDisplayName: '',
        relationship: 'Father',
        guardianContact: '',
        childDisplayName: 'Student One',
        childClassLevel: 'Class 5',
        childInstitution: 'Test School',
      }),
    ).rejects.toThrow('guardian-info-required');
  });

  it('(e6) a non-admin deciding a link is refused', async () => {
    // Fresh pair: guardian-1 + student-2 (no link yet in this suite).
    const linkId = parentLinkId('guardian-1', 'student-2');
    await requestParentLink(as('guardian-1'), 'guardian-1', 'student-2', {
      guardianDisplayName: 'Guardian One',
      relationship: 'Father',
      guardianContact: '01700000001',
      childDisplayName: 'Student Two',
      childClassLevel: 'Class 6',
      childInstitution: 'Test School',
    });
    await confirmParentLink(as('student-2'), linkId, 'student-2');
    await expect(
      decideParentLink(as('guardian-1'), 'guardian-1', linkId, 'verified', 'Guardian approving own link.'),
    ).rejects.toThrow();
  });

  it('(e7) the WRONG child confirming is refused', async () => {
    // Fresh pair: guardian-2 + student-1 (no link yet in this suite).
    const linkId = parentLinkId('guardian-2', 'student-1');
    await requestParentLink(as('guardian-2'), 'guardian-2', 'student-1', {
      guardianDisplayName: 'Guardian Two',
      relationship: 'Mother',
      guardianContact: '01700000002',
      childDisplayName: 'Student One',
      childClassLevel: 'Class 5',
      childInstitution: 'Test School',
    });
    await expect(confirmParentLink(as('student-2'), linkId, 'student-2')).rejects.toThrow('not-the-child');
  });

  it('(e8) teacher application carries post + institutionContact', async () => {
    await submitTeacherApplication(as('teacher-9'), 'teacher-9', {
      fullName: 'Teacher Nine',
      teachingLevel: 'Honours',
      subjects: ['English'],
      classes: ['3rd Year'],
      institution: 'Test College',
      post: 'Assistant Teacher',
      institutionContact: '01700000009',
      qualifications: 'M.A. English',
      experienceYears: 4,
      verificationReason: 'I teach English at Test College.',
      evidenceRef: '',
    });
    const app = await getMyTeacherApplication(as('teacher-9'), 'teacher-9');
    if (!app) throw new Error('application not found after submit');
    const extra = app.extra as Record<string, unknown>;
    if (extra.post !== 'Assistant Teacher') throw new Error(`post not stored: ${String(extra.post)}`);
    if (extra.institutionContact !== '01700000009') {
      throw new Error(`institutionContact not stored: ${String(extra.institutionContact)}`);
    }
    if (app.status !== 'pending') throw new Error(`expected pending, got ${app.status}`);
  });
});
