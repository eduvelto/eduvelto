/**
 * Eduvelto Firestore security-rules tests — NU admission, NU-5
 * (Institutions + groups + exam structure; design §19.2.1–§19.2.2,
 * §19.3.4, §19.13 Gate 2).
 *
 * Covers the admin seed flow's rule surface: who may write
 * nuInstitutions / nuGroups / nuExamConfigs / nuCircularConfigs
 * (Owner/Admin only), the value checks the rules enforce on those
 * writes (100-question full config, no negative marking, null
 * group-40 sub-split, daily ranges, group slug allowlist), public
 * reads of published docs vs draft docs, delete-denied, and the new
 * `nu-structure-applied` audit-log action.
 *
 * Same conventions as rules-nu4-admission-profiles.test.ts: the
 * emulator loads firestore.rules from firebase.json at startup; this
 * file only sanity-checks the file exists. Run with
 * `npm run test:rules` (runs the whole emulator-tests/ directory).
 * Uses its own project id so it never shares data with the other
 * suites when vitest runs files in parallel.
 */
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROJECT_ID = 'eduvelto-rules-test-nu5';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('rules_version')) {
  throw new Error(`firestore.rules at ${RULES_PATH} does not look like a rules file.`);
}

const FULL_CONFIG = {
  examType: 'NU_ADMISSION',
  questionMode: 'MCQ',
  totalQuestions: 100,
  durationSeconds: 3600,
  marking: { correct: 1, incorrect: 0, unanswered: 0, negativeMarking: false },
  passMark: { value: 35, displayOnly: true },
  sections: { bangla: 20, english: 20, generalKnowledge: 20, groupSubjects: 40, groupSubjectsDetail: null },
  meritCalculationEnabled: true,
  officialRankEnabled: false,
  vivaEnabled: false,
  circularVersion: 'nu-2025-26-v1',
  configVersion: 1,
  status: 'published',
};

const GROUP_DOC = {
  institutionId: 'national-university',
  slug: 'science',
  nameBn: 'বিজ্ঞান শাখা',
  accentColor: '#1D4ED8',
  examConfigId: 'nu-admission-full-2025-26-v1',
  eligibilitySummary: 'verified summary',
  circularVersion: 'nu-2025-26-v1',
  status: 'published',
};

const INSTITUTION_DOC = {
  nameBn: 'জাতীয় বিশ্ববিদ্যালয়',
  nameEn: 'National University',
  slug: 'national-university',
  type: 'public-university',
  status: 'active',
  officialUrl: 'https://www.nu.ac.bd/admissions',
  priority: 1,
};

const CIRCULAR_DOC = {
  academicSession: '2025-26',
  status: 'historical',
  sourceType: 'official_circular',
  sourceReference: 'memo 10(226)জাতী:বি:/রেজি:/অ্যাকা:/2026/3348',
  applicationStart: null,
  applicationEnd: null,
  examDate: null,
  eligibilityRulesVersion: 'v1',
  meritRulesVersion: 'v1',
};

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role, extra] of [
      ['admin-1', 'admin', {}],
      ['owner-1', 'owner', {}],
      ['student-1', 'student', {}],
      ['teacher-verified', 'teacher', { verificationStatus: 'verified' }],
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
    await setDoc(doc(db, 'nuExamConfigs', 'nu-full-pub'), FULL_CONFIG);
    await setDoc(doc(db, 'nuExamConfigs', 'nu-full-draft'), { ...FULL_CONFIG, status: 'draft' });
    await setDoc(doc(db, 'nuGroups', 'science'), GROUP_DOC);
    await setDoc(doc(db, 'nuGroups', 'humanities'), { ...GROUP_DOC, slug: 'humanities', nameBn: 'মানবিক শাখা' });
    await setDoc(doc(db, 'nuInstitutions', 'national-university'), INSTITUTION_DOC);
    await setDoc(doc(db, 'nuCircularConfigs', 'nu-2025-26'), CIRCULAR_DOC);
    await setDoc(doc(db, 'nuCircularConfigs', 'nu-draft'), {
      ...CIRCULAR_DOC,
      academicSession: '2026-27',
      status: 'draft',
      sourceReference: 'not yet verified',
    });
  });
}

const asStudent1 = () => env.authenticatedContext('student-1').firestore();
const asAdmin = () => env.authenticatedContext('admin-1').firestore();
const asOwner = () => env.authenticatedContext('owner-1').firestore();
const asTeacherVerified = () => env.authenticatedContext('teacher-verified').firestore();
const asSignedOut = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    // NOTE: no `rules:` option — see rules-nu4-admission-profiles.test.ts
    // (loadFirestoreRules fails with "http2 exception" in this
    // environment; the emulator loads firestore.rules from firebase.json
    // at startup instead).
    firestore: { host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 300000); // 300s: first Firestore ops on a cold emulator take ~2s each in this sandbox

afterAll(async () => {
  await env?.cleanup();
});

describe('NU-5: students and teachers can never write structure docs (n1–n8)', () => {
  it('n1: student creating a group is DENIED', async () => {
    await assertFails(setDoc(doc(asStudent1(), 'nuGroups', 'business'), { ...GROUP_DOC, slug: 'business' }));
  });
  it('n2: student updating a published group is DENIED', async () => {
    await assertFails(updateDoc(doc(asStudent1(), 'nuGroups', 'science'), { nameBn: 'বদলানো নাম' }));
  });
  it('n3: student creating an exam config is DENIED', async () => {
    await assertFails(setDoc(doc(asStudent1(), 'nuExamConfigs', 'nu-fake'), FULL_CONFIG));
  });
  it('n4: student creating an institution is DENIED', async () => {
    await assertFails(setDoc(doc(asStudent1(), 'nuInstitutions', 'other'), INSTITUTION_DOC));
  });
  it('n5: student creating a circular config is DENIED', async () => {
    await assertFails(setDoc(doc(asStudent1(), 'nuCircularConfigs', 'nu-fake'), CIRCULAR_DOC));
  });
  it('n6: verified teacher creating a group is DENIED (teachers write questions only)', async () => {
    await assertFails(
      setDoc(doc(asTeacherVerified(), 'nuGroups', 'business'), { ...GROUP_DOC, slug: 'business' }),
    );
  });
  it('n7: student deleting a group is DENIED', async () => {
    await assertFails(deleteDoc(doc(asStudent1(), 'nuGroups', 'science')));
  });
  it('n8: admin deleting a group is DENIED (structure docs are never deleted)', async () => {
    await assertFails(deleteDoc(doc(asAdmin(), 'nuGroups', 'science')));
  });
});

describe('NU-5: admin/owner apply the seed — valid writes allowed (n9–n14)', () => {
  it('n9: admin creates a valid group', async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), 'nuGroups', 'business'), { ...GROUP_DOC, slug: 'business', nameBn: 'ব্যবসায় শিক্ষা শাখা' }),
    );
  });
  it('n10: owner creates a valid institution', async () => {
    await assertSucceeds(setDoc(doc(asOwner(), 'nuInstitutions', 'nu-2'), { ...INSTITUTION_DOC, slug: 'nu-2' }));
  });
  it('n11: admin creates a valid full config', async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-full-2'), FULL_CONFIG));
  });
  it('n12: admin creates a valid daily config (25 Q / 25 min)', async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-daily-2'), {
        ...FULL_CONFIG,
        examType: 'NU_DAILY',
        totalQuestions: 25,
        durationSeconds: 1500,
        status: 'draft',
        sections: { bangla: 5, english: 5, generalKnowledge: 5, groupSubjects: 10, groupSubjectsDetail: null },
      }),
    );
  });
  it('n13: admin creates a valid historical circular config', async () => {
    await assertSucceeds(setDoc(doc(asAdmin(), 'nuCircularConfigs', 'nu-2025-26-b'), CIRCULAR_DOC));
  });
  it('n14: admin updates a published group’s eligibility summary', async () => {
    await assertSucceeds(
      updateDoc(doc(asAdmin(), 'nuGroups', 'humanities'), { eligibilitySummary: 'updated verified summary' }),
    );
  });
});

describe('NU-5: the rules reject wrong values even from an admin (n15–n22)', () => {
  it('n15: admin creating an 80-question full config is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-bad-80'), { ...FULL_CONFIG, totalQuestions: 80 }),
    );
  });
  it('n16: admin creating a negative-marking config is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-bad-neg'), {
        ...FULL_CONFIG,
        marking: { correct: 1, incorrect: -0.25, unanswered: 0, negativeMarking: true },
      }),
    );
  });
  it('n17: admin creating a config with a non-null group-40 sub-split is DENIED (Blocker B)', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-bad-split'), {
        ...FULL_CONFIG,
        sections: { ...FULL_CONFIG.sections, groupSubjectsDetail: { physics: 17 } },
      }),
    );
  });
  it('n18: admin creating a config with a viva is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-bad-viva'), { ...FULL_CONFIG, vivaEnabled: true }),
    );
  });
  it('n19: admin creating a config with ranking enabled is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-bad-rank'), { ...FULL_CONFIG, officialRankEnabled: true }),
    );
  });
  it('n20: admin creating a daily config with 10 questions is DENIED (range 20–30)', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuExamConfigs', 'nu-bad-daily'), {
        ...FULL_CONFIG,
        examType: 'NU_DAILY',
        totalQuestions: 10,
        durationSeconds: 1500,
        status: 'draft',
      }),
    );
  });
  it('n21: admin creating a group with a bad slug is DENIED', async () => {
    await assertFails(setDoc(doc(asAdmin(), 'nuGroups', 'arts'), { ...GROUP_DOC, slug: 'arts' }));
  });
  it('n22: admin creating a circular config with a non-official source is DENIED', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'nuCircularConfigs', 'nu-bad-src'), { ...CIRCULAR_DOC, sourceType: 'blog' }),
    );
  });
});

describe('NU-5: public reads — published yes, draft no (n23–n28)', () => {
  it('n23: signed-out visitor reads a published group', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'nuGroups', 'science')));
  });
  it('n24: signed-out visitor reads a published exam config', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'nuExamConfigs', 'nu-full-pub')));
  });
  it('n25: signed-out visitor reads the historical circular config', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'nuCircularConfigs', 'nu-2025-26')));
  });
  it('n26: signed-out visitor reads an active institution', async () => {
    await assertSucceeds(getDoc(doc(asSignedOut(), 'nuInstitutions', 'national-university')));
  });
  it('n27: signed-out visitor reading a DRAFT exam config is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'nuExamConfigs', 'nu-full-draft')));
  });
  it('n28: signed-out visitor reading a DRAFT circular config is DENIED', async () => {
    await assertFails(getDoc(doc(asSignedOut(), 'nuCircularConfigs', 'nu-draft')));
  });
});

describe('NU-5: the seed-apply audit action (n29–n32)', () => {
  const auditEntry = (actorId: string) => ({
    actorId,
    action: 'nu-structure-applied',
    details: 'NU structure seed applied: 7 docs',
    targetId: 'nu-structure-seed',
    createdAt: new Date(),
  });
  it('n29: admin logging nu-structure-applied is ALLOWED', async () => {
    await assertSucceeds(addDoc(collection(asAdmin(), 'adminActions'), auditEntry('admin-1')));
  });
  it('n30: owner logging nu-structure-applied is ALLOWED', async () => {
    await assertSucceeds(addDoc(collection(asOwner(), 'adminActions'), auditEntry('owner-1')));
  });
  it('n31: student logging nu-structure-applied is DENIED', async () => {
    await assertFails(addDoc(collection(asStudent1(), 'adminActions'), auditEntry('student-1')));
  });
  it('n32: admin logging it with a forged actorId is DENIED', async () => {
    await assertFails(addDoc(collection(asAdmin(), 'adminActions'), auditEntry('owner-1')));
  });
});
