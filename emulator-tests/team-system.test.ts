/**
 * Admin & Management Team System — emulator rules tests (owner brief 21 Nov 08:31).
 *
 * Covers: owner-only assignment CRUD, the 12-sector / 10-permission enums,
 * multi-sector powers, MFA-gated sector writes (both sides — this file
 * FOLDS IN the mfa-probe cases; the probe file is deleted after this lands),
 * suspension / expiry / removal, audit-log immutability + scoped reads,
 * DM + private-data denial, and the owner-protection invariants.
 *
 * Order matters: tests run sequentially in file order and share seeded
 * state. Deny-before-allow where an allow mutates shared docs (posts,
 * teacherVerifications). Every test gets a 120s timeout: cold-emulator
 * Firestore ops take ~2s each in this sandbox, far longer under load.
 *
 * Honest note (test A6): the per-sector applicability matrix lives in
 * src/lib/adminTeam.ts (owner-side UI/validation). The rules enforce only
 * the GLOBAL sector/permission enums — so a direct Firestore call by the
 * OWNER with a non-applicable permission (e.g. community-moderation +
 * 'publish') SUCCEEDS at the rules level. That is not a privilege
 * escalation: only the Owner UID can write assignments at all, and the
 * owner already holds every power. The matrix prevents owner mistakes
 * in the dashboard, not attacker escalation.
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
  collection,
  addDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'eduvelto-rules-test';
const FIRESTORE_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
const OWNER_UID = 'nczNklmktsVrxg43UzcgdSm6v0j2';
let env: RulesTestEnvironment;

const PAST = new Date(Date.now() - 60 * 60 * 1000);

function userDoc(displayName: string, email: string, role: string) {
  return { displayName, email, role, language: 'bn', isActive: true, createdAt: new Date() };
}

function assignment(
  userId: string,
  displayName: string,
  sectors: Record<string, { permissions: string[] }>,
  extra: Record<string, unknown> = {},
) {
  return {
    userId,
    displayName,
    email: `${userId}@example.com`,
    sectors,
    status: 'active',
    expiresAt: null,
    assignedBy: OWNER_UID,
    assignedAt: new Date(),
    updatedAt: new Date(),
    note: 'seed',
    ...extra,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const users: Array<[string, ReturnType<typeof userDoc>]> = [
      [OWNER_UID, userDoc('Owner', 'owner@example.com', 'owner')],
      ['team-admin-1', userDoc('Team Admin 1', 'team-admin-1@example.com', 'student')],
      ['team-admin-2', userDoc('Team Admin 2', 'team-admin-2@example.com', 'teacher')],
      ['team-admin-3', userDoc('Team Admin 3', 'team-admin-3@example.com', 'student')],
      ['team-suspended', userDoc('Team Suspended', 'team-suspended@example.com', 'student')],
      ['team-expired', userDoc('Team Expired', 'team-expired@example.com', 'student')],
      ['team-sec', userDoc('Team Security', 'team-sec@example.com', 'student')],
      ['team-reports', userDoc('Team Reports', 'team-reports@example.com', 'student')],
      ['team-support', userDoc('Team Support', 'team-support@example.com', 'student')],
      ['team-ai', userDoc('Team AI', 'team-ai@example.com', 'student')],
      ['team-student', userDoc('Team Student Mgmt', 'team-student@example.com', 'student')],
      ['student-1', userDoc('Student One', 'student-1@example.com', 'student')],
      ['student-2', userDoc('Student Two', 'student-2@example.com', 'student')],
      ['teacher-1', userDoc('Teacher One', 'teacher-1@example.com', 'teacher')],
      ['new-admin-1', userDoc('New Admin', 'new-admin-1@example.com', 'student')],
    ];
    for (const [uid, data] of users) await setDoc(doc(db, 'users', uid), data);

    const assignments: Array<[string, ReturnType<typeof assignment>]> = [
      ['team-admin-1', assignment('team-admin-1', 'Team Admin 1', {
        'community-moderation': { permissions: ['view', 'moderate'] },
        examination: { permissions: ['view', 'create'] },
      })],
      ['team-admin-2', assignment('team-admin-2', 'Team Admin 2', {
        'teacher-management': { permissions: ['view', 'approve'] },
      })],
      ['team-admin-3', assignment('team-admin-3', 'Team Admin 3', {
        'community-moderation': { permissions: ['view', 'moderate'] },
      })],
      ['team-suspended', assignment('team-suspended', 'Team Suspended', {
        'community-moderation': { permissions: ['view', 'moderate'] },
      }, { status: 'suspended' })],
      ['team-expired', assignment('team-expired', 'Team Expired', {
        'community-moderation': { permissions: ['view', 'moderate'] },
      }, { expiresAt: PAST })],
      ['team-sec', assignment('team-sec', 'Team Security', {
        'security-monitoring': { permissions: ['view', 'view-reports'] },
      })],
      ['team-reports', assignment('team-reports', 'Team Reports', {
        'reports-analytics': { permissions: ['view', 'view-reports'] },
      })],
      ['team-support', assignment('team-support', 'Team Support', {
        'user-support': { permissions: ['view'] },
      })],
      ['team-ai', assignment('team-ai', 'Team AI', {
        'ai-management': { permissions: ['view', 'edit'] },
      })],
      ['team-student', assignment('team-student', 'Team Student Mgmt', {
        'student-management': { permissions: ['view'] },
      })],
    ];
    for (const [uid, data] of assignments) await setDoc(doc(db, 'adminAssignments', uid), data);

    for (const [id, authorId] of [['post-1', 'student-1'], ['post-2', 'student-1'], ['post-3', 'student-1'], ['post-4', 'student-1']] as const) {
      await setDoc(doc(db, 'posts', id), {
        authorId, title: `Post ${id}`, body: 'Body.', reviewStatus: 'Under Review',
      });
    }
    await setDoc(doc(db, 'teacherVerifications', 'tv-1'), {
      userId: 'teacher-1', fullName: 'Teacher One', institution: 'Test College', status: 'pending',
    });
    await setDoc(doc(db, 'teacherVerifications', 'tv-2'), {
      userId: 'teacher-1', fullName: 'Teacher One', institution: 'Test College', status: 'pending',
    });
    await setDoc(doc(db, 'directMessages', 'dm-1'), {
      participants: ['student-1', 'teacher-1'], createdAt: new Date(),
    });
    await setDoc(doc(db, 'directMessages', 'dm-1', 'messages', 'msg-1'), {
      senderId: 'student-1', body: 'Hello.', createdAt: new Date(),
    });
    await setDoc(doc(db, 'users', 'student-1', 'quizAttempts', 'att-1'), {
      quizId: 'q-1', answers: [], score: 0, totalMarks: 10, percentage: 0, markingStatus: 'pending', createdAt: new Date(),
    });
    await setDoc(doc(db, 'adminActions', 'act-1'), {
      actorId: OWNER_UID, action: 'admin-assigned', details: 'seed', targetId: 'team-admin-1', createdAt: new Date(),
    });
    await setDoc(doc(db, 'adminActions', 'act-2'), {
      actorId: OWNER_UID, action: 'feature-enabled', details: 'seed', targetId: 'features', createdAt: new Date(),
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

const db = (uid: string | null, mfa = false) => {
  if (uid === null) return env.unauthenticatedContext().firestore();
  if (!mfa) return env.authenticatedContext(uid).firestore();
  return env
    .authenticatedContext(uid, {
      firebase: { sign_in_provider: 'password', sign_in_second_factor: 'phone' },
    } as never)
    .firestore();
};
const asOwner = () => db(OWNER_UID);
const asTeam1 = (mfa = false) => db('team-admin-1', mfa);
const asTeam2 = (mfa = false) => db('team-admin-2', mfa);
const asTeam3 = (mfa = false) => db('team-admin-3', mfa);

const newAssignmentDoc = (
  userId: string,
  sectors: Record<string, { permissions: string[] }>,
) => ({
  userId,
  displayName: userId === 'new-admin-1' ? 'New Admin' : 'Student Two',
  email: `${userId}@example.com`,
  sectors,
  status: 'active',
  expiresAt: null,
  assignedBy: OWNER_UID,
  assignedAt: new Date(),
  updatedAt: new Date(),
  note: 'test',
});

// ---------------------------------------------------------------------------
// A. Assignment CRUD — owner only
// ---------------------------------------------------------------------------
describe('A. assignment CRUD', () => {
  it('A1 owner creates a multi-sector assignment', async () => {
    await assertSucceeds(
      setDoc(doc(asOwner(), 'adminAssignments', 'new-admin-1'), newAssignmentDoc('new-admin-1', {
        'guardian-management': { permissions: ['view'] },
        'user-support': { permissions: ['view'] },
      })),
    );
  }, 120000);

  it('A2 non-owner cannot create an assignment', async () => {
    await assertFails(
      setDoc(doc(asTeam1(), 'adminAssignments', 'student-2'), newAssignmentDoc('student-2', {
        'guardian-management': { permissions: ['view'] },
      })),
    );
  }, 120000);

  it('A3 owner cannot create an assignment for the Owner UID', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'adminAssignments', OWNER_UID), {
        ...newAssignmentDoc(OWNER_UID, { 'guardian-management': { permissions: ['view'] } }),
        userId: OWNER_UID,
      }),
    );
  }, 120000);

  it('A4 invented sector is rejected', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'adminAssignments', 'student-2'), newAssignmentDoc('student-2', {
        'invented-sector': { permissions: ['view'] },
      })),
    );
  }, 120000);

  it('A5 invented permission is rejected', async () => {
    await assertFails(
      setDoc(doc(asOwner(), 'adminAssignments', 'student-2'), newAssignmentDoc('student-2', {
        'guardian-management': { permissions: ['fly'] },
      })),
    );
  }, 120000);

  it('A6 non-applicable permission is ALLOWED by rules (UI-only matrix — owner-only write, see header)', async () => {
    // community-moderation + 'publish' is outside the adminTeam.ts matrix,
    // but the rules enforce only the global enums. Only the Owner UID can
    // write assignments, so this cannot escalate anyone: the owner already
    // holds every power. The matrix prevents owner mistakes in the UI.
    await assertSucceeds(
      setDoc(doc(asOwner(), 'adminAssignments', 'student-2'), newAssignmentDoc('student-2', {
        'community-moderation': { permissions: ['publish'] },
      })),
    );
    const snap = await getDoc(doc(asOwner(), 'adminAssignments', 'student-2'));
    if (!snap.exists()) throw new Error('assignment not created');
  }, 120000);

  it('A7 owner updates assignment sectors', async () => {
    await assertSucceeds(
      updateDoc(doc(asOwner(), 'adminAssignments', 'new-admin-1'), {
        sectors: { 'guardian-management': { permissions: ['view', 'approve'] } },
        updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('A8 admin cannot edit their OWN assignment (no self-grant)', async () => {
    await assertFails(
      updateDoc(doc(asTeam1(), 'adminAssignments', 'team-admin-1'), {
        sectors: {
          'community-moderation': { permissions: ['view', 'moderate', 'delete'] },
          examination: { permissions: ['view', 'create'] },
        },
        updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('A9 owner deletes an assignment; admin cannot delete their own', async () => {
    await assertFails(deleteDoc(doc(asTeam1(), 'adminAssignments', 'team-admin-1')));
    await assertSucceeds(deleteDoc(doc(asOwner(), 'adminAssignments', 'new-admin-1')));
  }, 120000);

  it('A10 assignment reads: owner all, self only, others denied', async () => {
    await assertSucceeds(getDoc(doc(asOwner(), 'adminAssignments', 'team-admin-1')));
    await assertSucceeds(getDoc(doc(asTeam1(), 'adminAssignments', 'team-admin-1')));
    await assertFails(getDoc(doc(asTeam1(), 'adminAssignments', 'team-admin-2')));
    await assertFails(getDoc(doc(db('student-1'), 'adminAssignments', 'team-admin-1')));
  }, 120000);
});

// ---------------------------------------------------------------------------
// B. Multi-sector powers + MFA gate (folds in the mfa-probe cases)
// ---------------------------------------------------------------------------
describe('B. sector powers + MFA', () => {
  it('B1 sector write WITHOUT MFA is DENIED (probe case 1)', async () => {
    await assertFails(
      updateDoc(doc(asTeam1(false), 'posts', 'post-1'), { reviewStatus: 'Published', updatedAt: new Date() }),
    );
  }, 120000);

  it('B2 sector write WITH MFA claim is ALLOWED (probe case 2)', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeam1(true), 'posts', 'post-1'), { reviewStatus: 'Published', updatedAt: new Date() }),
    );
  }, 120000);

  it('B3 wrong-sector admin with MFA cannot approve a teacher application', async () => {
    await assertFails(
      updateDoc(doc(asTeam1(true), 'teacherVerifications', 'tv-2'), {
        status: 'verified',
        checkedBy: 'team-admin-1',
        reason: 'Institution confirmed by phone.',
        checks: { identity: true, institution: true, subject: true, adult: true },
        updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('B4 teacher-management admin WITHOUT MFA cannot approve', async () => {
    await assertFails(
      updateDoc(doc(asTeam2(false), 'teacherVerifications', 'tv-1'), {
        status: 'verified',
        checkedBy: 'team-admin-2',
        reason: 'Institution confirmed by phone.',
        checks: { identity: true, institution: true, subject: true, adult: true },
        updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('B5 teacher-management admin WITH MFA approves', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeam2(true), 'teacherVerifications', 'tv-1'), {
        status: 'verified',
        checkedBy: 'team-admin-2',
        reason: 'Institution confirmed by phone.',
        checks: { identity: true, institution: true, subject: true, adult: true },
        updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('B6 sector delete WITHOUT MFA is denied', async () => {
    await assertFails(deleteDoc(doc(asTeam1(false), 'posts', 'post-2')));
  }, 120000);
});

// ---------------------------------------------------------------------------
// C. Suspension / expiry / removal
// ---------------------------------------------------------------------------
describe('C. suspension, expiry, removal', () => {
  it('C1 suspended assignment cannot write even with MFA', async () => {
    await assertFails(
      updateDoc(doc(db('team-suspended', true), 'posts', 'post-2'), {
        reviewStatus: 'Published', updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('C2 expired assignment cannot write even with MFA', async () => {
    await assertFails(
      updateDoc(doc(db('team-expired', true), 'posts', 'post-3'), {
        reviewStatus: 'Published', updatedAt: new Date(),
      }),
    );
  }, 120000);

  it('C3 removal revokes immediately: publish works, owner deletes, publish fails', async () => {
    await assertSucceeds(
      updateDoc(doc(asTeam3(true), 'posts', 'post-4'), {
        reviewStatus: 'Published', updatedAt: new Date(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(asOwner(), 'adminAssignments', 'team-admin-3')));
    await assertFails(
      updateDoc(doc(asTeam3(true), 'posts', 'post-4'), {
        reviewStatus: 'Under Review', updatedAt: new Date(),
      }),
    );
  }, 120000);
});

// ---------------------------------------------------------------------------
// D. Audit log — append-only, scoped reads
// ---------------------------------------------------------------------------
describe('D. audit log', () => {
  it('D1 sector admin can log their own allowed action', async () => {
    await assertSucceeds(
      addDoc(collection(asTeam1(), 'adminActions'), {
        actorId: 'team-admin-1',
        action: 'moderation-approved',
        details: 'post-1',
        targetId: 'post-1',
        createdAt: new Date(),
      }),
    );
  }, 120000);

  it('D2 sector admin cannot log as someone else', async () => {
    await assertFails(
      addDoc(collection(asTeam1(), 'adminActions'), {
        actorId: 'team-admin-2',
        action: 'moderation-approved',
        details: 'post-1',
        targetId: 'post-1',
        createdAt: new Date(),
      }),
    );
  }, 120000);

  it('D3 invented audit action is rejected', async () => {
    await assertFails(
      addDoc(collection(asTeam1(), 'adminActions'), {
        actorId: 'team-admin-1',
        action: 'invented-action',
        details: 'x',
        targetId: 'post-1',
        createdAt: new Date(),
      }),
    );
  }, 120000);

  it('D4 audit entries are immutable — update and delete fail even for the owner', async () => {
    await assertFails(updateDoc(doc(asOwner(), 'adminActions', 'act-1'), { details: 'tampered' }));
    await assertFails(deleteDoc(doc(asOwner(), 'adminActions', 'act-1')));
  }, 120000);

  it('D5 owner reads the full log; scoped sectors read only their sets', async () => {
    await assertSucceeds(getDoc(doc(asOwner(), 'adminActions', 'act-1')));
    await assertSucceeds(getDoc(doc(asOwner(), 'adminActions', 'act-2')));
    // security-monitoring: admin-assigned IS in its set, feature-enabled is NOT.
    await assertSucceeds(getDoc(doc(db('team-sec'), 'adminActions', 'act-1')));
    await assertFails(getDoc(doc(db('team-sec'), 'adminActions', 'act-2')));
    // reports-analytics: feature-enabled IS in its set.
    await assertSucceeds(getDoc(doc(db('team-reports'), 'adminActions', 'act-2')));
    // a sector admin with no audit scope cannot read the log at all.
    await assertFails(getDoc(doc(asTeam1(), 'adminActions', 'act-1')));
  }, 120000);
});

// ---------------------------------------------------------------------------
// E. DM + private-data denial
// ---------------------------------------------------------------------------
describe('E. DM and private-data denial', () => {
  it('E1 no admin can read a DM thread they are not a participant of', async () => {
    await assertFails(getDoc(doc(asTeam1(), 'directMessages', 'dm-1')));
    await assertFails(getDoc(doc(db('team-support'), 'directMessages', 'dm-1')));
    await assertFails(getDoc(doc(db('team-support'), 'directMessages', 'dm-1', 'messages', 'msg-1')));
  }, 120000);

  it('E2 even the OWNER cannot read DMs via the rules (no routine access)', async () => {
    await assertFails(getDoc(doc(asOwner(), 'directMessages', 'dm-1')));
  }, 120000);

  it('E3 a participant CAN read their own DM thread (positive control)', async () => {
    await assertSucceeds(getDoc(doc(db('student-1'), 'directMessages', 'dm-1')));
  }, 120000);

  it('E4 user docs: user-managing sectors read, other sectors denied', async () => {
    await assertSucceeds(getDoc(doc(db('team-student'), 'users', 'student-1')));
    await assertFails(getDoc(doc(db('team-ai'), 'users', 'student-1')));
    await assertFails(getDoc(doc(asTeam1(), 'users', 'student-1')));
  }, 120000);

  it('E5 quiz attempts: examination view reads, other sectors denied', async () => {
    await assertSucceeds(getDoc(doc(asTeam1(), 'users', 'student-1', 'quizAttempts', 'att-1')));
    await assertFails(getDoc(doc(asTeam2(), 'users', 'student-1', 'quizAttempts', 'att-1')));
  }, 120000);
});
