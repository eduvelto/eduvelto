// Eduvelto — Job circulars + notifications (Step 14) rules tests.
//
// (r1–r2) READ: published circulars are public (guest reads
// them, and the published list query returns only published
// docs); drafts are moderator-only — a student cannot read
// one, and a draft list query is denied.
// (r3–r6) WRITE: only moderators create/update, within the
// §2.18 22-key allowlist, with reviewStatus in the enum.
// (r7) UNPUBLISH: a moderator can flip a published circular
// to 'rejected' — after that a guest can no longer read it.
// (r8) DELETE: there is NO delete rule by design (a wrong
// circular is unpublished via reviewStatus='rejected';
// delete comes with Step 15 admin) — delete fails for
// moderator AND student alike.
// (i15) REAL-CONTENT E2E: seed one published verified
// circular (BCS, deadline 15 Dec 2026 18:00 Dhaka), one
// draft, one published closed circular (Primary, deadline
// 10 Nov 2026). Read back through the RULES-CHECKED guest
// list query (the exact shape listPublishedCirculars runs),
// then derive notifications + calendar events from the
// STORED docs: exactly one deadline reminder (BCS, 5 days
// out, normal priority) and calendar events only from the
// verified published circulars — never from the draft.
//
// Run with `npm run test:rules` (whole emulator-tests/ directory).
//
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { circularFromStored, type JobCircular } from '../src/lib/jobCirculars';
import { buildCalendarEvents } from '../src/lib/jobCalendar';
import { deriveJobNotifications } from '../src/lib/jobNotifications';

const PROJECT_ID = 'eduvelto-rules-test-step14-circulars';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('match /circulars/{circularId}')) {
  throw new Error('firestore.rules does not contain the Step 14 circulars match.');
}
if (!RULES_TEXT.includes("in ['draft', 'in-review', 'verified', 'published', 'rejected']")) {
  throw new Error('firestore.rules does not contain the Step 14 reviewStatus enum.');
}

/** Fixed "now" for the E2E: 10 Dec 2026, 12:00 Asia/Dhaka. */
const NOW_MS = Date.UTC(2026, 11, 10, 6, 0, 0);
const TS = (ms: number) => Timestamp.fromMillis(ms);

function circularDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    examSlug: 'bcs',
    postTitleBn: '৪৭তম বিসিএস — সাধারণ ক্যাডার',
    postTitleEn: '47th BCS — General Cadre',
    circularNumber: '47',
    publishedDate: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    applicationDeadline: TS(Date.UTC(2026, 11, 15, 12, 0, 0)), // 18:00 Dhaka
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক ডিগ্রি; বয়স ও বিস্তারিত যোগ্যতা মূল বিজ্ঞপ্তিতে দেখুন।',
    eligibilitySummaryEn: 'Bachelor degree; see the original circular for age and full eligibility.',
    officialUrl: 'https://bpsc.gov.bd/circular/47',
    applyUrl: 'https://bpsc.teletalk.com.bd',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    reviewStatus: 'published',
    verifiedBy: 'moderator-1',
    verifiedAt: TS(Date.UTC(2026, 11, 5, 6, 0, 0)),
    examDate: TS(Date.UTC(2027, 0, 10, 6, 0, 0)),
    applicationStartDate: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    authorId: 'moderator-1',
    createdAt: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    updatedAt: TS(Date.UTC(2026, 11, 5, 6, 0, 0)),
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['moderator-1', 'moderator'],
      ['moderator-2', 'moderator'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'circulars', 'circ-bcs-verified'), circularDoc({}));
    await setDoc(
      doc(db, 'circulars', 'circ-bank-draft'),
      circularDoc({
        examSlug: 'bank',
        postTitleBn: 'ব্যাংক অফিসার — খসড়া',
        postTitleEn: 'Bank Officer — draft',
        reviewStatus: 'draft',
        verifiedBy: null,
        verifiedAt: null,
        officialUrl: 'https://example-bank.gov.bd/circular/draft',
        applyUrl: null,
      }),
    );
    // Verified (not published) circular for r7: authored by
    // moderator-1, verified by moderator-2. r7 publishes it via
    // the honest path, then unpublishes it. Seeded 'verified' so
    // the r1/i15 published-list assertions (exactly 2 published
    // docs) are unaffected.
    await setDoc(
      doc(db, 'circulars', 'circ-r7'),
      circularDoc({
        examSlug: 'bank',
        postTitleBn: 'ব্যাংক অফিসার — যাচাইকৃত',
        postTitleEn: 'Bank Officer — verified',
        reviewStatus: 'verified',
        verifiedBy: 'moderator-2',
        verifiedAt: TS(Date.UTC(2026, 11, 5, 6, 0, 0)),
        officialUrl: 'https://example-bank.gov.bd/circular/verified',
        applyUrl: null,
      }),
    );
    await setDoc(
      doc(db, 'circulars', 'circ-primary-closed'),
      circularDoc({
        examSlug: 'primary-teacher',
        postTitleBn: 'প্রাথমিক শিক্ষক নিয়োগ — ২০২৬',
        postTitleEn: 'Primary Teacher Recruitment — 2026',
        circularNumber: '2026/114',
        applicationDeadline: TS(Date.UTC(2026, 10, 10, 12, 0, 0)), // 10 Nov, past
        examDate: TS(Date.UTC(2026, 11, 20, 6, 0, 0)),
        totalPosts: 5000,
        officialUrl: 'https://dpe.gov.bd/circular/2026-114',
        applyUrl: 'https://dpe.teletalk.com.bd',
      }),
    );
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES_TEXT, host: '127.0.0.1', port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080) },
  });
  await seed();
}, 120000);

afterAll(async () => {
  await env?.clearFirestore();
  await env?.cleanup();
});

const asGuest = () => env.unauthenticatedContext().firestore();
const asStudent = (uid = 'student-1') => env.authenticatedContext(uid).firestore();
const asModerator = (uid = 'moderator-1') => env.authenticatedContext(uid).firestore();

/** The published-circulars list query, in the exact shape
 * listPublishedCirculars runs it (one == filter, limit 15). */
function listPublishedAs(db: ReturnType<typeof asGuest>) {
  return getDocs(
    query(collection(db, 'circulars'), where('reviewStatus', '==', 'published'), limit(15)),
  );
}

describe('Step 14 circulars read rules (r1–r2)', () => {
  it('r1: a guest reads a published circular', async () => {
    const snap = await assertSucceeds(getDoc(doc(asGuest(), 'circulars', 'circ-bcs-verified')));
    expect(snap.exists()).toBe(true);
  });

  it('r1: the guest published list returns only the 2 published docs', async () => {
    const snap = await assertSucceeds(listPublishedAs(asGuest()));
    expect(snap.docs.map((d) => d.id).sort()).toEqual(['circ-bcs-verified', 'circ-primary-closed']);
  });

  it('r2: a student cannot read a draft circular', async () => {
    await assertFails(getDoc(doc(asStudent(), 'circulars', 'circ-bank-draft')));
  });

  it('r2: a student draft list query is denied', async () => {
    await assertFails(
      getDocs(query(collection(asStudent(), 'circulars'), where('reviewStatus', '==', 'draft'), limit(15))),
    );
  });
});

describe('Step 14 circulars write rules (r3–r8)', () => {
  it('r3: a moderator creates a valid draft circular', async () => {
    await assertSucceeds(
      setDoc(doc(asModerator(), 'circulars', 'circ-r3'), circularDoc({ reviewStatus: 'draft' })),
    );
  });

  it('r4: a student cannot create a circular', async () => {
    await assertFails(
      setDoc(doc(asStudent(), 'circulars', 'circ-r4'), circularDoc({ reviewStatus: 'draft' })),
    );
  });

  it('r5: a moderator create with a bad reviewStatus is denied', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'circulars', 'circ-r5'), circularDoc({ reviewStatus: 'bogus' })),
    );
  });

  it('r6: a moderator create with an extra key is denied', async () => {
    await assertFails(
      setDoc(doc(asModerator(), 'circulars', 'circ-r6'), circularDoc({ salary: '৳50,000' })),
    );
  });

  it('r7: a moderator unpublishes (reviewStatus=rejected) and the guest can no longer read it', async () => {
    // Publish first via the honest path: circ-r7 is verified and
    // authored by moderator-1, so moderator-2 (not the author)
    // publishes it. Creating it already-published through the
    // rules is denied since the k15d no-self-publication fix, so
    // the setup can no longer use a direct published create.
    await assertSucceeds(
      updateDoc(doc(asModerator('moderator-2'), 'circulars', 'circ-r7'), { reviewStatus: 'published' }),
    );
    await assertSucceeds(getDoc(doc(asGuest(), 'circulars', 'circ-r7')));
    const db = asModerator();
    await assertSucceeds(updateDoc(doc(db, 'circulars', 'circ-r7'), { reviewStatus: 'rejected' }));
    await assertFails(getDoc(doc(asGuest(), 'circulars', 'circ-r7')));
  });

  it('r8: delete is denied for moderator and student alike (no delete rule by design)', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'circulars', 'circ-bcs-verified')));
    await assertFails(deleteDoc(doc(asStudent(), 'circulars', 'circ-bcs-verified')));
  });
});

describe('i15: published circulars → notifications + calendar (real stored docs)', () => {
  it('reads only published docs, derives one reminder + verified-only calendar events', async () => {
    const snap = await assertSucceeds(listPublishedAs(asGuest()));
    const circulars: JobCircular[] = [];
    for (const d of snap.docs) {
      const c = circularFromStored(d.id, d.data());
      expect(c).not.toBeNull();
      if (c) circulars.push(c);
    }
    expect(circulars.map((c) => c.docId).sort()).toEqual(['circ-bcs-verified', 'circ-primary-closed']);

    const notifications = deriveJobNotifications({
      circulars,
      todayDailyMock: null,
      thisWeekWeeklyMock: null,
      attempts: [],
      examSlugs: ['bcs'],
      nowMs: NOW_MS,
    });
    // Deadline 15 Dec, now 10 Dec → 5 days out: the early
    // (≤7d) window, normal priority. The closed Primary
    // circular produces no reminder.
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe('circular-deadline:circ-bcs-verified');
    expect(notifications[0].priority).toBe('normal');
    expect(notifications[0].link).toBe('/jobs/circulars/circ-bcs-verified');

    const events = buildCalendarEvents({ circulars, mocks: [] });
    // BCS: deadline + exam date. Primary (closed): its deadline
    // + exam date still exist as events (the page filters to
    // upcoming). The draft contributes nothing.
    expect(events.map((e) => e.id).sort()).toEqual(
      [
        'circular-deadline:circ-bcs-verified',
        'circular-deadline:circ-primary-closed',
        'circular-exam:circ-bcs-verified',
        'circular-exam:circ-primary-closed',
      ].sort(),
    );
    expect(events.every((e) => e.isConfirmed)).toBe(true);
    expect(events.some((e) => e.id.includes('circ-bank-draft'))).toBe(false);
  });
});
