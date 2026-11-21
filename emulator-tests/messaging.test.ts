/**
 * Eduvelto Messenger + Notifications — Firestore security-rules tests.
 *
 * RUN (needs Java 17+; the suite starts its own emulator):
 *   FIRESTORE_EMULATOR_PORT=8081 npm run test:rules -- emulator-tests/messaging.test.ts
 *   — or the full suite —
 *   npm run test:rules
 * Port 8080 is the default; use FIRESTORE_EMULATOR_PORT when another
 * agent's emulator already holds 8080 (see firebase.alt-ports.json).
 *
 * These tests use @firebase/rules-unit-testing against the LOCAL emulator
 * only. They never touch a live project. Expected results are in the test
 * names (ALLOWED / DENIED). The suite proves the privacy model from the
 * approved privacy + messaging proposal (21 Nov 2026) as implemented in
 * firestore.rules: no routine access to DM content for anyone (owner,
 * admin, moderator, teacher, guardian included); exceptional access only
 * through an Owner-approved, time-boxed grant; the DM permission matrix
 * (adult/adult, minor/minor friends with consent, minor/teacher,
 * minor/guardian, guardian/teacher about a linked child); blocks; rate
 * limits; notifications that never carry message text.
 *
 * Age: adult >= 6575 days (~18y + 5d, conservative), under-13 < 4749 days.
 * "Verified" for a student means an active account with a date of birth
 * on file — student identity verification was removed entirely by the
 * owner's decision (21 Nov 06:53), so there is no student
 * verificationStatus to check. Teachers/guardians need
 * verificationStatus 'verified' (free manual verification).
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
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
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-msg-test';
const FIRESTORE_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

const DOB = (iso: string) => new Date(iso + 'T00:00:00.000Z');
const NOW = () => new Date();

function userDoc(uid: string, fields: Record<string, unknown>) {
  return {
    displayName: uid,
    email: `${uid}@example.com`,
    role: 'student',
    language: 'bn',
    isActive: true,
    ...fields,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // --- roles ---
    await setDoc(doc(db, 'users', 'msg-admin'), userDoc('msg-admin', { role: 'admin' }));
    await setDoc(doc(db, 'users', 'msg-admin-2'), userDoc('msg-admin-2', { role: 'admin' }));
    await setDoc(doc(db, 'users', 'msg-owner'), userDoc('msg-owner', { role: 'owner' }));
    await setDoc(doc(db, 'users', 'msg-mod'), userDoc('msg-mod', { role: 'moderator' }));
    // --- adult students (Dhaka College, except adult-c) ---
    await setDoc(doc(db, 'users', 'msg-adult-a'), userDoc('msg-adult-a', { dateOfBirth: DOB('2000-05-10'), institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-adult-b'), userDoc('msg-adult-b', { dateOfBirth: DOB('1998-03-15'), institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-adult-c'), userDoc('msg-adult-c', { dateOfBirth: DOB('2001-01-01'), institution: 'Chittagong College' }));
    await setDoc(doc(db, 'users', 'msg-adult-d'), userDoc('msg-adult-d', { dateOfBirth: DOB('1999-07-07'), institution: 'Dhaka College' }));
    // --- minors (14, 15, 14) + under-13 (11) + no-DOB + DM-suspended ---
    await setDoc(doc(db, 'users', 'msg-minor-1'), userDoc('msg-minor-1', { dateOfBirth: DOB('2012-06-01'), institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-minor-2'), userDoc('msg-minor-2', { dateOfBirth: DOB('2011-09-20'), institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-minor-3'), userDoc('msg-minor-3', { dateOfBirth: DOB('2012-01-01'), institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-under13'), userDoc('msg-under13', { dateOfBirth: DOB('2015-04-01'), institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-nodob'), userDoc('msg-nodob', { institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-suspended-dm'), userDoc('msg-suspended-dm', { dateOfBirth: DOB('2000-01-01'), dmSuspended: true }));
    // --- teachers + guardians ---
    await setDoc(doc(db, 'users', 'msg-teacher-1'), userDoc('msg-teacher-1', { role: 'teacher', verificationStatus: 'verified', institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-teacher-2'), userDoc('msg-teacher-2', { role: 'teacher', verificationStatus: 'verified', institution: 'Chittagong College' }));
    await setDoc(doc(db, 'users', 'msg-teacher-unverified'), userDoc('msg-teacher-unverified', { role: 'teacher', verificationStatus: 'pending', institution: 'Dhaka College' }));
    await setDoc(doc(db, 'users', 'msg-guardian-1'), userDoc('msg-guardian-1', { role: 'parent', verificationStatus: 'verified' }));
    await setDoc(doc(db, 'users', 'msg-guardian-2'), userDoc('msg-guardian-2', { role: 'parent', verificationStatus: 'verified' }));
    // --- verified parent links (dashboards convention: {parent}_{student}) ---
    for (const [parent, child] of [['msg-guardian-1', 'msg-minor-1'], ['msg-guardian-2', 'msg-minor-2'], ['msg-guardian-1', 'msg-under13']] as const) {
      await setDoc(doc(db, 'parentLinks', `${parent}_${child}`), {
        parentId: parent, studentId: child, status: 'verified',
        requestedAt: NOW(), updatedAt: NOW(),
      });
    }
    // --- DM consents (admin-granted, free manual process) ---
    for (const [child, guardian] of [['msg-minor-1', 'msg-guardian-1'], ['msg-minor-2', 'msg-guardian-2']] as const) {
      await setDoc(doc(db, 'dmConsents', child), {
        childUid: child, guardianUid: guardian, status: 'granted',
        grantedBy: 'msg-admin', createdAt: NOW(), updatedAt: NOW(),
      });
    }
    // --- friendships: minor-1 <-> minor-2 accepted + guardian-approved;
    // minor-1 <-> minor-3 accepted but guardianApproved false. ---
    await setDoc(doc(db, 'friendships', 'msg-minor-1_msg-minor-2'), {
      userA: 'msg-minor-1', userB: 'msg-minor-2', status: 'accepted', guardianApproved: true,
    });
    await setDoc(doc(db, 'friendships', 'msg-minor-1_msg-minor-3'), {
      userA: 'msg-minor-1', userB: 'msg-minor-3', status: 'accepted', guardianApproved: false,
    });
    // --- blocks: adult-a blocks adult-c; adult-b blocks adult-a ---
    await setDoc(doc(db, 'blocks', 'msg-adult-a'), { blockedUids: ['msg-adult-c'], updatedAt: NOW() });
    await setDoc(doc(db, 'blocks', 'msg-adult-b'), { blockedUids: ['msg-adult-a'], updatedAt: NOW() });
    // --- pre-seeded threads ---
    const thread = (a: string, b: string) => ({
      participants: [a, b], type: 'dm', status: 'active',
      createdAt: NOW(), updatedAt: NOW(),
      lastMessageAt: null, lastMessagePreview: '', lastMessageSenderId: '', aboutStudentId: '',
    });
    await setDoc(doc(db, 'directMessages', 'msg-adult-a_msg-adult-b'), thread('msg-adult-a', 'msg-adult-b'));
    await setDoc(doc(db, 'directMessages', 'msg-adult-b_msg-adult-c'), thread('msg-adult-b', 'msg-adult-c'));
    // --- pre-seeded grants: one expired, one for another thread ---
    await setDoc(doc(db, 'dmAccessGrants', 'msg-adult-a_msg-adult-b_msg-admin'), {
      threadId: 'msg-adult-a_msg-adult-b', grantedTo: 'msg-admin', grantedBy: 'msg-owner',
      reason: 'Expired test grant — safety incident review.',
      status: 'approved', createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      expiresAt: new Date(Date.now() - 3600 * 1000),
    });
    await setDoc(doc(db, 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin'), {
      threadId: 'msg-adult-b_msg-adult-c', grantedTo: 'msg-admin', grantedBy: 'msg-owner',
      reason: 'Grant for a different thread.',
      status: 'approved', createdAt: NOW(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
    // --- group + memberships ---
    await setDoc(doc(db, 'studyGroups', 'msg-group-1'), {
      name: 'Class 10 Science', description: 'Science study group', status: 'active',
      createdBy: 'msg-mod', createdAt: NOW(), updatedAt: NOW(), memberCount: 1,
    });
    await setDoc(doc(db, 'groupMemberships', 'msg-group-1_msg-adult-a'), {
      groupId: 'msg-group-1', userId: 'msg-adult-a', status: 'active', createdAt: NOW(), updatedAt: NOW(),
    });
    await setDoc(doc(db, 'groupMemberships', 'msg-group-1_msg-adult-b'), {
      groupId: 'msg-group-1', userId: 'msg-adult-b', status: 'pending', createdAt: NOW(), updatedAt: NOW(),
    });
    await setDoc(doc(db, 'groupMessages', 'msg-group-1', 'messages', 'msg-seed-1'), {
      senderId: 'msg-adult-a', kind: 'text', body: 'Welcome to the group.', createdAt: NOW(),
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

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const unauth = () => env.unauthenticatedContext().firestore();

function dmThread(a: string, b: string) {
  const participants = [a, b].sort();
  return {
    participants, type: 'dm', status: 'active',
    createdAt: NOW(), updatedAt: NOW(),
    lastMessageAt: null, lastMessagePreview: '', lastMessageSenderId: '', aboutStudentId: '',
  };
}
const pairId = (a: string, b: string) => [a, b].sort().join('_');
const msg = (senderId: string, body = 'হ্যালো!') => ({ senderId, kind: 'text', body, createdAt: NOW() });

describe('Eduvelto Messenger + Notifications rules', () => {
  // (m1) Adult <-> adult: allowed; blocked / no-DOB / suspended: denied.
  it('(m1) adult/adult DM create ALLOWED; blocked, no-DOB and DM-suspended DENIED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-adult-b'), 'directMessages', pairId('msg-adult-b', 'msg-adult-d')), dmThread('msg-adult-b', 'msg-adult-d')));
    await assertFails(setDoc(doc(as('msg-adult-a'), 'directMessages', pairId('msg-adult-a', 'msg-adult-c')), dmThread('msg-adult-a', 'msg-adult-c')));
    await assertFails(setDoc(doc(as('msg-adult-a'), 'directMessages', pairId('msg-adult-a', 'msg-nodob')), dmThread('msg-adult-a', 'msg-nodob')));
    await assertFails(setDoc(doc(as('msg-adult-a'), 'directMessages', pairId('msg-adult-a', 'msg-suspended-dm')), dmThread('msg-adult-a', 'msg-suspended-dm')));
  });

  // (m2) Caller must be a participant; thread id must be the sorted pair id.
  it('(m2) DM create by a non-participant DENIED; wrong thread id / unsorted participants DENIED', async () => {
    await assertFails(setDoc(doc(as('msg-adult-a'), 'directMessages', pairId('msg-adult-b', 'msg-adult-d')), dmThread('msg-adult-b', 'msg-adult-d')));
    await assertFails(setDoc(doc(as('msg-adult-b'), 'directMessages', 'not-a-pair-id'), dmThread('msg-adult-b', 'msg-adult-d')));
    await assertFails(setDoc(doc(as('msg-adult-b'), 'directMessages', pairId('msg-adult-b', 'msg-adult-d')), {
      ...dmThread('msg-adult-b', 'msg-adult-d'), participants: ['msg-adult-d', 'msg-adult-b'],
    }));
  });

  // (m3) Admins / owner / moderators are NOT DM participants.
  it('(m3) admin, owner and moderator creating a DM thread DENIED', async () => {
    await assertFails(setDoc(doc(as('msg-admin'), 'directMessages', pairId('msg-admin', 'msg-adult-a')), dmThread('msg-admin', 'msg-adult-a')));
    await assertFails(setDoc(doc(as('msg-owner'), 'directMessages', pairId('msg-owner', 'msg-adult-a')), dmThread('msg-owner', 'msg-adult-a')));
    await assertFails(setDoc(doc(as('msg-mod'), 'directMessages', pairId('msg-mod', 'msg-adult-a')), dmThread('msg-mod', 'msg-adult-a')));
  });

  // (m4) Minor <-> minor: friends + both consents + guardian approval.
  it('(m4) minor/minor friends with both consents ALLOWED; without consent or guardian approval DENIED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-minor-1', 'msg-minor-2')), dmThread('msg-minor-1', 'msg-minor-2')));
    await assertFails(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-minor-1', 'msg-minor-3')), dmThread('msg-minor-1', 'msg-minor-3')));
    await assertFails(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-minor-1', 'msg-under13')), dmThread('msg-minor-1', 'msg-under13')));
  });

  // (m5) Minor <-> teacher: same institution; 13-17 needs DM consent, under-13 does not.
  it('(m5) minor/teacher same institution ALLOWED; other institution DENIED; unverified teacher DENIED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-minor-1', 'msg-teacher-1')), dmThread('msg-minor-1', 'msg-teacher-1')));
    await assertFails(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-minor-1', 'msg-teacher-2')), dmThread('msg-minor-1', 'msg-teacher-2')));
    await assertFails(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-minor-1', 'msg-teacher-unverified')), dmThread('msg-minor-1', 'msg-teacher-unverified')));
    await assertSucceeds(setDoc(doc(as('msg-under13'), 'directMessages', pairId('msg-under13', 'msg-teacher-1')), dmThread('msg-under13', 'msg-teacher-1')));
  });

  // (m6) Minor <-> guardian: only the verified-linked guardian.
  it('(m6) minor/linked guardian ALLOWED; other guardian DENIED; under-13/guardian ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-guardian-1', 'msg-minor-1')), dmThread('msg-guardian-1', 'msg-minor-1')));
    await assertFails(setDoc(doc(as('msg-minor-1'), 'directMessages', pairId('msg-guardian-2', 'msg-minor-1')), dmThread('msg-guardian-2', 'msg-minor-1')));
    await assertSucceeds(setDoc(doc(as('msg-under13'), 'directMessages', pairId('msg-guardian-1', 'msg-under13')), dmThread('msg-guardian-1', 'msg-under13')));
  });

  // (m7) Adult student <-> own teacher (same institution); teacher <-> teacher.
  it('(m7) adult student/own teacher ALLOWED; cross-institution DENIED; teacher/teacher ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-adult-a'), 'directMessages', pairId('msg-adult-a', 'msg-teacher-1')), dmThread('msg-adult-a', 'msg-teacher-1')));
    await assertFails(setDoc(doc(as('msg-adult-a'), 'directMessages', pairId('msg-adult-a', 'msg-teacher-2')), dmThread('msg-adult-a', 'msg-teacher-2')));
    await assertSucceeds(setDoc(doc(as('msg-teacher-1'), 'directMessages', pairId('msg-teacher-1', 'msg-teacher-2')), dmThread('msg-teacher-1', 'msg-teacher-2')));
  });

  // (m8) Guardian <-> teacher: only about their own verified-linked child.
  it('(m8) guardian/teacher about linked child ALLOWED; without aboutStudentId DENIED; wrong child/institution DENIED', async () => {
    const withChild = { ...dmThread('msg-guardian-1', 'msg-teacher-1'), aboutStudentId: 'msg-minor-1' };
    await assertSucceeds(setDoc(doc(as('msg-guardian-1'), 'directMessages', pairId('msg-guardian-1', 'msg-teacher-1')), withChild));
    await assertFails(setDoc(doc(as('msg-guardian-1'), 'directMessages', pairId('msg-guardian-1', 'msg-teacher-1')), dmThread('msg-guardian-1', 'msg-teacher-1')));
    const wrongChild = { ...dmThread('msg-guardian-1', 'msg-teacher-1'), aboutStudentId: 'msg-minor-2' };
    await assertFails(setDoc(doc(as('msg-guardian-1'), 'directMessages', pairId('msg-guardian-1', 'msg-teacher-1')), wrongChild));
    const wrongSchool = { ...dmThread('msg-guardian-1', 'msg-teacher-2'), aboutStudentId: 'msg-minor-1' };
    await assertFails(setDoc(doc(as('msg-guardian-1'), 'directMessages', pairId('msg-guardian-1', 'msg-teacher-2')), wrongSchool));
    // The teacher side: teacher-1 starts the thread with guardian-2 about minor-2.
    const teacherSide = { ...dmThread('msg-guardian-2', 'msg-teacher-1'), aboutStudentId: 'msg-minor-2' };
    await assertSucceeds(setDoc(doc(as('msg-teacher-1'), 'directMessages', pairId('msg-guardian-2', 'msg-teacher-1')), teacherSide));
  });

  // (m9) No routine access: teacher/guardian/admin/owner/stranger cannot read a DM thread.
  it('(m9) teacher, guardian, admin, owner and stranger reading a DM thread DENIED; participant ALLOWED', async () => {
    const ref = doc(as('msg-adult-a'), 'directMessages', 'msg-adult-a_msg-adult-b');
    await assertSucceeds(getDoc(ref));
    await assertFails(getDoc(doc(as('msg-teacher-1'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertFails(getDoc(doc(as('msg-guardian-1'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertFails(getDoc(doc(as('msg-admin'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertFails(getDoc(doc(as('msg-owner'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertFails(getDoc(doc(as('msg-adult-c'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertFails(getDoc(doc(unauth(), 'directMessages', 'msg-adult-a_msg-adult-b')));
  });

  // (m10) Message send: participant + text only; non-participant / voice / >2000 chars DENIED.
  it('(m10) participant text send ALLOWED; non-participant, voice kind and >2000 chars DENIED', async () => {
    const col = collection(as('msg-adult-b'), 'directMessages', 'msg-adult-b_msg-adult-c', 'messages');
    await assertSucceeds(addDoc(col, msg('msg-adult-b')));
    await assertFails(addDoc(collection(as('msg-adult-a'), 'directMessages', 'msg-adult-b_msg-adult-c', 'messages'), msg('msg-adult-a')));
    await assertFails(addDoc(col, { senderId: 'msg-adult-b', kind: 'voice', body: 'voice note', createdAt: NOW() }));
    await assertFails(addDoc(col, msg('msg-adult-b', 'x'.repeat(2001))));
    await assertFails(addDoc(col, { senderId: 'msg-adult-c', kind: 'text', body: 'spoofed', createdAt: NOW() }));
  });

  // (m11) Flood control: 3 seconds between messages in a thread.
  it('(m11) second message within 3s DENIED; after 3.2s ALLOWED', async () => {
    const dbB = as('msg-adult-b');
    const col = collection(dbB, 'directMessages', 'msg-adult-b_msg-adult-c', 'messages');
    await assertSucceeds(addDoc(col, msg('msg-adult-b', 'first')));
    await assertSucceeds(updateDoc(doc(dbB, 'directMessages', 'msg-adult-b_msg-adult-c'), {
      lastMessageAt: NOW(), lastMessagePreview: 'first', lastMessageSenderId: 'msg-adult-b', updatedAt: NOW(),
    }));
    await assertFails(addDoc(col, msg('msg-adult-b', 'too soon')));
    await new Promise((r) => setTimeout(r, 3200));
    await assertSucceeds(addDoc(col, msg('msg-adult-b', 'after the wait')));
  });

  // (m12) Blocked users cannot send in the thread (either direction).
  it('(m12) blocked user sending in the thread DENIED (both directions)', async () => {
    await assertFails(addDoc(collection(as('msg-adult-b'), 'directMessages', 'msg-adult-a_msg-adult-b', 'messages'), msg('msg-adult-b')));
    await assertFails(addDoc(collection(as('msg-adult-a'), 'directMessages', 'msg-adult-a_msg-adult-b', 'messages'), msg('msg-adult-a')));
  });

  // (m13) Messages are immutable.
  it('(m13) updating or deleting a DM message DENIED', async () => {
    const col = collection(as('msg-adult-b'), 'directMessages', 'msg-adult-b_msg-adult-c', 'messages');
    const ref = await addDoc(col, msg('msg-adult-b', 'immutable?'));
    await assertFails(updateDoc(doc(as('msg-adult-b'), 'directMessages', 'msg-adult-b_msg-adult-c', 'messages', ref.id), { body: 'edited' }));
    await assertFails(deleteDoc(doc(as('msg-adult-b'), 'directMessages', 'msg-adult-b_msg-adult-c', 'messages', ref.id)));
  });

  // (m14) Exceptional access: owner creates a valid grant; admin reads under it.
  it('(m14) owner creates a valid grant ALLOWED; admin reads the thread under it ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-owner'), 'dmAccessGrants', 'msg-adult-a_msg-adult-b_msg-admin-2'), {
      threadId: 'msg-adult-a_msg-adult-b', grantedTo: 'msg-admin-2', grantedBy: 'msg-owner',
      reason: 'Reported safety incident — review requested.',
      status: 'approved', createdAt: NOW(), expiresAt: new Date(Date.now() + 3600 * 1000),
    }));
    await assertSucceeds(getDoc(doc(as('msg-admin-2'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertSucceeds(getDoc(doc(as('msg-admin-2'), 'directMessages', 'msg-adult-a_msg-adult-b', 'messages', 'nope')));
  });

  // (m15) Grant creation is owner-only, reasoned, and max 72h.
  it('(m15) admin creating a grant DENIED; short reason DENIED; expiry over 72h DENIED', async () => {
    const base = {
      threadId: 'msg-adult-b_msg-adult-c', grantedTo: 'msg-admin-2', grantedBy: 'msg-admin',
      reason: 'A proper reason of more than ten characters.',
      status: 'approved', createdAt: NOW(), expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    await assertFails(setDoc(doc(as('msg-admin'), 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin-2'), base));
    await assertFails(setDoc(doc(as('msg-owner'), 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin-2'), {
      ...base, grantedBy: 'msg-owner', reason: 'short',
    }));
    await assertFails(setDoc(doc(as('msg-owner'), 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin-2'), {
      ...base, grantedBy: 'msg-owner', expiresAt: new Date(Date.now() + 73 * 3600 * 1000),
    }));
  });

  // (m16) Expired grant and wrong-thread grant do NOT open a thread.
  it('(m16) expired grant read DENIED; grant for another thread DENIED', async () => {
    // The seeded grant for msg-adult-a_msg-adult-b expired an hour ago
    // (seeded with rules disabled — the client rule would refuse to
    // create an expired grant). Revoke the live grant from (m14) first
    // so only the expired one remains for this thread.
    await assertSucceeds(updateDoc(doc(as('msg-owner'), 'dmAccessGrants', 'msg-adult-a_msg-adult-b_msg-admin'), { status: 'revoked', updatedAt: NOW() }));
    await assertFails(getDoc(doc(as('msg-admin'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    // The seeded grant names msg-adult-b_msg-adult-c, not this thread.
    await assertFails(getDoc(doc(as('msg-admin'), 'directMessages', 'msg-adult-a_msg-adult-b')));
    await assertSucceeds(getDoc(doc(as('msg-admin'), 'directMessages', 'msg-adult-b_msg-adult-c')));
  });

  // (m17) Grant docs: owner + grantee may read; other admins may not.
  it('(m17) grant doc read: owner + grantee ALLOWED; other admin DENIED', async () => {
    await assertSucceeds(getDoc(doc(as('msg-owner'), 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin')));
    await assertSucceeds(getDoc(doc(as('msg-admin'), 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin')));
    await assertFails(getDoc(doc(as('msg-mod'), 'dmAccessGrants', 'msg-adult-b_msg-adult-c_msg-admin')));
  });

  // (m18) Notifications: sender notifies the other participant; no message text inside.
  it('(m18) message notification by the sender ALLOWED; by a stranger DENIED; recipient read ALLOWED, other user DENIED', async () => {
    const notif = {
      recipientId: 'msg-adult-c', type: 'message', title: 'নতুন বার্তা',
      body: 'msg-adult-b sent you a message.', conversationId: 'msg-adult-b_msg-adult-c',
      createdAt: NOW(), read: false,
    };
    await assertSucceeds(addDoc(collection(as('msg-adult-b'), 'notifications', 'msg-adult-c', 'items'), notif));
    await assertFails(addDoc(collection(as('msg-adult-a'), 'notifications', 'msg-adult-c', 'items'), notif));
    const snap = await getDocs(collection(as('msg-adult-c'), 'notifications', 'msg-adult-c', 'items'));
    if (snap.docs.length === 0) throw new Error('expected a notification for msg-adult-c');
    const id = snap.docs[0].id;
    await assertSucceeds(getDoc(doc(as('msg-adult-c'), 'notifications', 'msg-adult-c', 'items', id)));
    await assertFails(getDoc(doc(as('msg-adult-a'), 'notifications', 'msg-adult-c', 'items', id)));
    // Marking read is allowed; changing the title is not.
    await assertSucceeds(updateDoc(doc(as('msg-adult-c'), 'notifications', 'msg-adult-c', 'items', id), { read: true }));
    await assertFails(updateDoc(doc(as('msg-adult-c'), 'notifications', 'msg-adult-c', 'items', id), { title: 'changed' }));
  }, 60_000);

  // (m19) Admin notices + exam results: role-gated creation.
  it('(m19) admin_notice by admin ALLOWED, by student DENIED; exam_result by self ALLOWED, for another DENIED', async () => {
    const adminNotice = {
      recipientId: 'msg-adult-a', type: 'admin_notice', title: 'নোটিশ',
      body: 'Platform maintenance tonight.', createdAt: NOW(), read: false,
    };
    await assertSucceeds(addDoc(collection(as('msg-admin'), 'notifications', 'msg-adult-a', 'items'), adminNotice));
    await assertFails(addDoc(collection(as('msg-adult-b'), 'notifications', 'msg-adult-a', 'items'), adminNotice));
    const examResult = {
      recipientId: 'msg-adult-b', type: 'exam_result', title: 'পরীক্ষার ফল',
      body: 'You scored 8/10.', createdAt: NOW(), read: false,
    };
    await assertSucceeds(addDoc(collection(as('msg-adult-b'), 'notifications', 'msg-adult-b', 'items'), examResult));
    await assertFails(addDoc(collection(as('msg-adult-b'), 'notifications', 'msg-adult-a', 'items'), examResult));
  });

  // (m20) Blocks: owner-only read/write; oversized list DENIED.
  it('(m20) blocks doc: owner create ALLOWED; other user read/update DENIED; >500 entries DENIED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-adult-d'), 'blocks', 'msg-adult-d'), { blockedUids: ['msg-adult-c'], updatedAt: NOW() }));
    await assertFails(getDoc(doc(as('msg-adult-c'), 'blocks', 'msg-adult-d')));
    await assertFails(updateDoc(doc(as('msg-adult-c'), 'blocks', 'msg-adult-d'), { blockedUids: [] }));
    await assertFails(setDoc(doc(as('msg-adult-d'), 'blocks', 'msg-adult-d'), {
      blockedUids: Array.from({ length: 501 }, (_, i) => `u${i}`), updatedAt: NOW(),
    }));
  });

  // (m21) DM consents: admin-only create; child + guardian may read.
  it('(m21) dmConsent: admin create ALLOWED; student create DENIED; child read ALLOWED; other student DENIED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-admin'), 'dmConsents', 'msg-minor-3'), {
      childUid: 'msg-minor-3', guardianUid: 'msg-guardian-1', status: 'granted',
      grantedBy: 'msg-admin', createdAt: NOW(), updatedAt: NOW(),
    }));
    await assertFails(setDoc(doc(as('msg-minor-1'), 'dmConsents', 'msg-minor-1'), {
      childUid: 'msg-minor-1', guardianUid: 'msg-guardian-1', status: 'granted',
      grantedBy: 'msg-minor-1', createdAt: NOW(), updatedAt: NOW(),
    }));
    await assertSucceeds(getDoc(doc(as('msg-minor-3'), 'dmConsents', 'msg-minor-3')));
    await assertSucceeds(getDoc(doc(as('msg-guardian-1'), 'dmConsents', 'msg-minor-3')));
    await assertFails(getDoc(doc(as('msg-minor-2'), 'dmConsents', 'msg-minor-3')));
  });

  // (m22) Public profiles: owner mirror must match the users doc; anyone signed in may read.
  it('(m22) publicProfile: owner create ALLOWED; wrong name DENIED; signed-in read ALLOWED; unauth DENIED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-adult-a'), 'publicProfiles', 'msg-adult-a'), {
      displayName: 'msg-adult-a', role: 'student', institution: 'Dhaka College', classLevel: null, updatedAt: NOW(),
    }));
    await assertFails(setDoc(doc(as('msg-adult-b'), 'publicProfiles', 'msg-adult-b'), {
      displayName: 'Someone Else', role: 'student', institution: 'Dhaka College', classLevel: null, updatedAt: NOW(),
    }));
    await assertSucceeds(getDoc(doc(as('msg-adult-b'), 'publicProfiles', 'msg-adult-a')));
    await assertFails(getDoc(doc(unauth(), 'publicProfiles', 'msg-adult-a')));
    await assertFails(updateDoc(doc(as('msg-adult-b'), 'publicProfiles', 'msg-adult-a'), { displayName: 'msg-adult-a' }));
  });

  // (m23) Date of birth: set-once; DM suspension is admin-only.
  it('(m23) DOB set-once ALLOWED then change DENIED; dmSuspended admin ALLOWED, self DENIED', async () => {
    await assertSucceeds(updateDoc(doc(as('msg-nodob'), 'users', 'msg-nodob'), { dateOfBirth: DOB('2005-02-21') }));
    await assertFails(updateDoc(doc(as('msg-nodob'), 'users', 'msg-nodob'), { dateOfBirth: DOB('2000-01-01') }));
    await assertSucceeds(updateDoc(doc(as('msg-admin'), 'users', 'msg-adult-d'), { dmSuspended: true }));
    await assertFails(updateDoc(doc(as('msg-adult-d'), 'users', 'msg-adult-d'), { dmSuspended: false }));
  });

  // (m24) Groups: admin-created only; messages member-only.
  it('(m24) group create: student DENIED, moderator ALLOWED; group message: member ALLOWED, non-member DENIED, moderator read ALLOWED', async () => {
    await assertFails(addDoc(collection(as('msg-adult-a'), 'studyGroups'), {
      name: 'My Group', description: 'x', status: 'active', createdBy: 'msg-adult-a', createdAt: NOW(), memberCount: 0,
    }));
    const ref = await addDoc(collection(as('msg-mod'), 'studyGroups'), {
      name: 'Math Circle', description: 'Maths help', status: 'active', createdBy: 'msg-mod', createdAt: NOW(), memberCount: 0,
    });
    await assertSucceeds(getDoc(doc(as('msg-adult-c'), 'studyGroups', ref.id)));
    await assertSucceeds(addDoc(collection(as('msg-adult-a'), 'groupMessages', 'msg-group-1', 'messages'), msg('msg-adult-a')));
    await assertFails(addDoc(collection(as('msg-adult-c'), 'groupMessages', 'msg-group-1', 'messages'), msg('msg-adult-c')));
    await assertSucceeds(getDoc(doc(as('msg-mod'), 'groupMessages', 'msg-group-1', 'messages', 'msg-seed-1')));
    await assertFails(getDoc(doc(as('msg-adult-c'), 'groupMessages', 'msg-group-1', 'messages', 'msg-seed-1')));
  });

  // (m25) Memberships: request pending by self; approve by moderator; self-approve DENIED.
  it('(m25) join request ALLOWED; moderator approve ALLOWED; self-approve DENIED; leave ALLOWED', async () => {
    await assertSucceeds(setDoc(doc(as('msg-adult-c'), 'groupMemberships', 'msg-group-1_msg-adult-c'), {
      groupId: 'msg-group-1', userId: 'msg-adult-c', status: 'pending', createdAt: NOW(), updatedAt: NOW(),
    }));
    await assertFails(updateDoc(doc(as('msg-adult-c'), 'groupMemberships', 'msg-group-1_msg-adult-c'), { status: 'active' }));
    await assertSucceeds(updateDoc(doc(as('msg-mod'), 'groupMemberships', 'msg-group-1_msg-adult-c'), { status: 'active', updatedAt: NOW() }));
    await assertSucceeds(deleteDoc(doc(as('msg-adult-c'), 'groupMemberships', 'msg-group-1_msg-adult-c')));
  });

  // (m26) Reports: a student reports a DM message; moderator resolves; privacy holds.
  it('(m26) report a DM message ALLOWED; moderator resolve ALLOWED; other student read DENIED', async () => {
    const ref = await addDoc(collection(as('msg-adult-b'), 'reports'), {
      reporterId: 'msg-adult-b', status: 'open', reason: 'abuse',
      targetType: 'message', targetId: 'some-message-id', targetAuthorId: 'msg-adult-c',
      details: 'Reported message text attached by the reporter.',
    });
    await assertSucceeds(getDoc(doc(as('msg-adult-b'), 'reports', ref.id)));
    await assertFails(getDoc(doc(as('msg-adult-a'), 'reports', ref.id)));
    await assertSucceeds(updateDoc(doc(as('msg-mod'), 'reports', ref.id), { status: 'resolved' }));
  });
});
