// Eduvelto Firestore security-rules tests — Global Opportunity Hub
// (directive §3B, 23 Nov 2026).
//
// Proves the Phase 4 /opportunities rules already on main (no
// rules change in this branch):
//   read:   Published for everyone (signed-out included);
//           a draft only for a moderator.
//   create: moderator only, and ONLY with a draft reviewStatus
//           (a moderator can never create a Published listing
//           directly — publishing goes through update).
//   update: moderator only (this is how a draft becomes Published).
//   delete: Admin only.
// Plus: a suspended moderator loses every privilege, and
// /careerPaths reads follow the same Published-or-moderator rule.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory)
// or this file alone under `firebase emulators:exec`. Same
// conventions as rules-public-id.test.ts: the emulator loads
// firestore.rules from firebase.json at startup; own project id
// so it never shares data with the other suites.

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-opportunities';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}
if (!RULES_TEXT.includes('match /opportunities/{oppId}')) {
  throw new Error('firestore.rules has no /opportunities match block — the hub needs the Phase 4 rules.');
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['mod-1', 'moderator', {}],
      ['mod-suspended', 'moderator', { isActive: false }],
      ['student-1', 'student', {}],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
        ...extra,
      });
    }
    const opp = (reviewStatus: string) => ({
      type: 'job',
      titleBn: 'পরীক্ষামূলক সুযোগ',
      titleEn: 'Test Opportunity',
      organizationBn: 'পরীক্ষা সংস্থা',
      organizationEn: 'Test Organisation',
      countryBn: 'বাংলাদেশ',
      countryEn: 'Bangladesh',
      eligibilityBn: 'মূল বিজ্ঞপ্তিতে দেখুন',
      eligibilityEn: 'See the original notice',
      descriptionBn: 'বিবরণ',
      descriptionEn: 'Description',
      sourceName: 'Test Source',
      sourceUrl: 'https://example.gov.bd/notice',
      applyUrl: 'https://example.gov.bd/apply',
      publishedDate: serverTimestamp(),
      applicationDeadline: serverTimestamp(),
      deadlinePrecision: 'date_only',
      isPlatform: false,
      verificationLevel: 'official',
      verificationNoteBn: null,
      verificationNoteEn: null,
      reviewStatus,
      verifiedBy: 'mod-1',
      verifiedAt: serverTimestamp(),
      authorId: 'mod-1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'opportunities', 'published-1'), opp('Published'));
    await setDoc(doc(db, 'opportunities', 'draft-1'), opp('Under Review'));
    await setDoc(doc(db, 'opportunities', 'draft-publish'), opp('Under Review'));
    await setDoc(doc(db, 'opportunities', 'del-1'), opp('Published'));
    await setDoc(doc(db, 'opportunities', 'del-2'), opp('Published'));
    await setDoc(doc(db, 'careerPaths', 'path-published'), {
      titleBn: 'শিক্ষক',
      titleEn: 'Teacher',
      reviewStatus: 'Published',
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'careerPaths', 'path-draft'), {
      titleBn: 'খসড়া পথ',
      titleEn: 'Draft Path',
      reviewStatus: 'In Progress',
      createdAt: serverTimestamp(),
    });
  });
}

beforeAll(async () => {
  const hostVar = process.env.FIRESTORE_EMULATOR_HOST ?? '';
  const port = hostVar.includes(':')
    ? Number(hostVar.split(':').pop())
    : Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080);
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port },
  });
  await seed();
  // Loud seed check: a missing seed must fail here, not masquerade
  // as rules denials later (callerRole() errors when the caller's
  // users doc is missing, which looks like a rules failure).
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), 'users', 'mod-1'));
    if (!snap.exists()) throw new Error('seed failed: users/mod-1 missing in the emulator');
    const opp = await getDoc(doc(ctx.firestore(), 'opportunities', 'published-1'));
    if (!opp.exists()) throw new Error('seed failed: opportunities/published-1 missing in the emulator');
  });
}, 300000);

afterAll(async () => {
  await env.cleanup();
});

const asStudent = () => env.authenticatedContext('student-1').firestore();
const asMod = () => env.authenticatedContext('mod-1').firestore();
const asSuspendedMod = () => env.authenticatedContext('mod-suspended').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asUnauth = () => env.unauthenticatedContext().firestore();

function newOppPayload(reviewStatus: string) {
  return {
    type: 'scholarship',
    titleBn: 'নতুন সুযোগ',
    titleEn: 'New Opportunity',
    organizationBn: 'নতুন সংস্থা',
    organizationEn: 'New Organisation',
    countryBn: 'বাংলাদেশ',
    countryEn: 'Bangladesh',
    eligibilityBn: 'মূল বিজ্ঞপ্তিতে দেখুন',
    eligibilityEn: 'See the original notice',
    descriptionBn: 'বিবরণ',
    descriptionEn: 'Description',
    sourceName: 'New Source',
    sourceUrl: 'https://example.org/notice',
    applyUrl: 'https://example.org/apply',
    publishedDate: serverTimestamp(),
    applicationDeadline: serverTimestamp(),
    deadlinePrecision: 'date_only',
    isPlatform: false,
    verificationLevel: 'official',
    verificationNoteBn: null,
    verificationNoteEn: null,
    reviewStatus,
    verifiedBy: null,
    verifiedAt: null,
    authorId: 'mod-1',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

describe('opportunities — read', () => {
  it('(o1) anyone, signed-out included, can read a Published listing', async () => {
    await assertSucceeds(getDoc(doc(asUnauth(), 'opportunities', 'published-1')));
    await assertSucceeds(getDoc(doc(asStudent(), 'opportunities', 'published-1')));
  });

  it('(o2) a signed-in student can NOT read a draft listing', async () => {
    await assertFails(getDoc(doc(asStudent(), 'opportunities', 'draft-1')));
  });

  it('(o3) a signed-out user can NOT read a draft listing', async () => {
    await assertFails(getDoc(doc(asUnauth(), 'opportunities', 'draft-1')));
  });

  it('(o4) a moderator CAN read a draft listing', async () => {
    await assertSucceeds(getDoc(doc(asMod(), 'opportunities', 'draft-1')));
  });
});

describe('opportunities — create', () => {
  it('(o5) a moderator CAN create with a draft reviewStatus', async () => {
    await assertSucceeds(setDoc(doc(asMod(), 'opportunities', 'new-draft'), newOppPayload('Not Started')));
  });

  it('(o6) a moderator can NOT create a Published listing directly', async () => {
    await assertFails(setDoc(doc(asMod(), 'opportunities', 'new-published'), newOppPayload('Published')));
  });

  it('(o7) a student can NOT create a listing', async () => {
    await assertFails(setDoc(doc(asStudent(), 'opportunities', 'new-student'), newOppPayload('Not Started')));
  });

  it('(o8) a signed-out user can NOT create a listing', async () => {
    await assertFails(setDoc(doc(asUnauth(), 'opportunities', 'new-anon'), newOppPayload('Not Started')));
  });

  it('(o9) a suspended moderator can NOT create a listing', async () => {
    await assertFails(
      setDoc(doc(asSuspendedMod(), 'opportunities', 'new-suspended'), newOppPayload('Not Started')),
    );
  });
});

describe('opportunities — update and delete', () => {
  it('(o10) a moderator CAN update a draft (edit the title)', async () => {
    await assertSucceeds(updateDoc(doc(asMod(), 'opportunities', 'draft-1'), { titleEn: 'Edited Title' }));
  });

  it('(o11) a moderator CAN publish a draft via update (draft -> Published)', async () => {
    await assertSucceeds(
      updateDoc(doc(asMod(), 'opportunities', 'draft-publish'), { reviewStatus: 'Published' }),
    );
    // And the newly published doc is now publicly readable.
    await assertSucceeds(getDoc(doc(asUnauth(), 'opportunities', 'draft-publish')));
  });

  it('(o12) a student can NOT update a listing', async () => {
    await assertFails(updateDoc(doc(asStudent(), 'opportunities', 'draft-1'), { titleEn: 'Hacked' }));
  });

  it('(o13) an Admin CAN delete a listing', async () => {
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'opportunities', 'del-1')));
    const snap = await getDoc(doc(asAdmin(), 'opportunities', 'del-1'));
    expect(snap.exists()).toBe(false);
  });

  it('(o14) a moderator can NOT delete a listing', async () => {
    await assertFails(deleteDoc(doc(asMod(), 'opportunities', 'del-2')));
  });

  it('(o15) a student can NOT delete a listing', async () => {
    await assertFails(deleteDoc(doc(asStudent(), 'opportunities', 'del-2')));
  });
});

describe('careerPaths — read follows the same Published-or-moderator rule', () => {
  it('(o16) anyone can read a Published career path', async () => {
    await assertSucceeds(getDoc(doc(asUnauth(), 'careerPaths', 'path-published')));
  });

  it('(o17) a student can NOT read a draft career path; a moderator CAN', async () => {
    await assertFails(getDoc(doc(asStudent(), 'careerPaths', 'path-draft')));
    await assertSucceeds(getDoc(doc(asMod(), 'careerPaths', 'path-draft')));
  });
});
