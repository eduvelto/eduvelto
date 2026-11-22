// Eduvelto — Job Step 15 admin rules tests.
//
// Covers the Step 15 rules delta on top of Step 14:
// (s1–s9) jobReports — student create (open, hyphenated reason
// enum), moderator triage, no student read of others' reports,
// no updates/deletes by students, guest cannot create.
// (k1–k5) jobCorrections — student create (pending, source
// required), moderator decide (accepted/rejected + reason ≥10),
// no student updates, delete never.
// (h1–h4) circularHistory — moderator create (append-only),
// student cannot create, NOBODY can update or delete.
// (d1–d5) approvedDomains — owner create/update/delete,
// moderator read-only, student/guest cannot read.
// (x1–x5) circulars delete (Admin-only) + the 3 new allowlist
// keys (verificationChecklist, reviewNote, lastEditedBy).
// (a1–a2) adminActions — 'job-content-deleted' is in the enum.
// (i16) REAL-CONTENT E2E: draft → in-review → verified (with
// checklist) → published; a student reports a wrong deadline on
// the published circular; a moderator decides it; the deadline
// change lands in circularHistory; the report never touched the
// circular's own fields.
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

const PROJECT_ID = 'eduvelto-rules-test-step15-admin';
let env: RulesTestEnvironment;

const RULES_PATH = resolve(__dirname, '../firestore.rules');
const RULES_TEXT = readFileSync(RULES_PATH, 'utf8');
if (!RULES_TEXT.includes('match /jobReports/{reportId}')) {
  throw new Error('firestore.rules does not contain the Step 15 jobReports match.');
}
if (!RULES_TEXT.includes('match /circularHistory/{historyId}')) {
  throw new Error('firestore.rules does not contain the Step 15 circularHistory match.');
}
if (!RULES_TEXT.includes('match /approvedDomains/{domainId}')) {
  throw new Error('firestore.rules does not contain the Step 15 approvedDomains match.');
}
if (!RULES_TEXT.includes("allow delete: if isAdmin();")) {
  throw new Error('firestore.rules does not contain the Step 15 circulars delete rule.');
}

const TS = (ms: number) => Timestamp.fromMillis(ms);
const NOW = Date.UTC(2026, 11, 10, 6, 0, 0);

function circularDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    examSlug: 'bcs',
    postTitleBn: '৪৭তম বিসিএস — সাধারণ ক্যাডার',
    postTitleEn: '47th BCS — General Cadre',
    circularNumber: '47',
    publishedDate: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    applicationDeadline: TS(Date.UTC(2026, 11, 15, 12, 0, 0)),
    deadlinePrecision: 'datetime',
    totalPosts: 100,
    eligibilitySummaryBn: 'স্নাতক ডিগ্রি; বয়স ও বিস্তারিত যোগ্যতা মূল বিজ্ঞপ্তিতে দেখুন।',
    eligibilitySummaryEn: 'Bachelor degree; see the original circular for age and full eligibility.',
    officialUrl: 'https://bpsc.gov.bd/circular/47',
    applyUrl: 'https://bpsc.teletalk.com.bd',
    copyStatus: 'link-only',
    copyTextExcerpt: null,
    reviewStatus: 'draft',
    verifiedBy: null,
    verifiedAt: null,
    examDate: TS(Date.UTC(2027, 0, 10, 6, 0, 0)),
    applicationStartDate: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    authorId: 'moderator-1',
    createdAt: TS(Date.UTC(2026, 11, 1, 6, 0, 0)),
    updatedAt: TS(Date.UTC(2026, 11, 5, 6, 0, 0)),
    verificationChecklist: null,
    reviewNote: null,
    lastEditedBy: 'moderator-1',
    ...overrides,
  };
}

function reportDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    reporterId: 'student-1',
    targetType: 'jobCircular',
    targetId: 'circ-published',
    targetAuthorId: 'moderator-1',
    reason: 'wrong-deadline',
    details: 'শেষ তারিখ ২০ ডিসেম্বর, ১৫ নয়',
    suggestedValue: '2026-12-20',
    evidenceUrl: 'https://bpsc.gov.bd/notice/47',
    status: 'open',
    priority: 'normal',
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: null,
    createdAt: TS(NOW),
    updatedAt: TS(NOW),
    ...overrides,
  };
}

function correctionDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    requesterId: 'student-1',
    targetType: 'jobCircular',
    targetId: 'circ-published',
    whatsWrong: 'শেষ তারিখ ভুল লেখা হয়েছে',
    proposedFix: 'শেষ তারিখ ২০ ডিসেম্বর ২০২৬',
    source: 'https://bpsc.gov.bd/notice/47',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: TS(NOW),
    updatedAt: TS(NOW),
    ...overrides,
  };
}

function historyDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    circularId: 'circ-published',
    fieldChanged: 'applicationDeadline',
    previousValue: '2026-12-15',
    newValue: '2026-12-20',
    sourceId: 'https://bpsc.gov.bd/notice/47b',
    changedBy: 'moderator-1',
    changedAt: TS(NOW),
    note: 'সময় বৃদ্ধির বিজ্ঞপ্তি',
    ...overrides,
  };
}

function domainDoc(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    domain: 'bpsc.gov.bd',
    organization: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    examSlugs: 'bcs',
    addedBy: 'owner-1',
    createdAt: TS(NOW),
    updatedAt: TS(NOW),
    ...overrides,
  };
}

async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [
      ['student-1', 'student'],
      ['student-2', 'student'],
      ['moderator-1', 'moderator'],
      ['admin-1', 'admin'],
      ['owner-1', 'owner'],
    ] as const) {
      await setDoc(doc(db, 'users', uid), {
        displayName: uid,
        email: `${uid}@example.com`,
        role,
        language: 'bn',
        isActive: true,
      });
    }
    await setDoc(doc(db, 'circulars', 'circ-published'), circularDoc({ reviewStatus: 'published', verifiedBy: 'moderator-1', verifiedAt: TS(Date.UTC(2026, 11, 5, 6, 0, 0)) }));
    await setDoc(doc(db, 'circulars', 'circ-draft'), circularDoc({ reviewStatus: 'draft' }));
    await setDoc(doc(db, 'jobReports', 'rep-seed'), reportDoc({}));
    await setDoc(doc(db, 'jobCorrections', 'cor-seed'), correctionDoc({}));
    await setDoc(doc(db, 'circularHistory', 'hist-seed'), historyDoc({}));
    await setDoc(doc(db, 'approvedDomains', 'dom-seed'), domainDoc({}));
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
const asAdmin = (uid = 'admin-1') => env.authenticatedContext(uid).firestore();
const asOwner = (uid = 'owner-1') => env.authenticatedContext(uid).firestore();

describe('Step 15 jobReports rules (s1–s9)', () => {
  it('s1: a student creates a valid open report', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'jobReports', 'rep-s1'), reportDoc({})));
  });

  it('s2: a student cannot create a report with a non-open status', async () => {
    await assertFails(setDoc(doc(asStudent(), 'jobReports', 'rep-s2'), reportDoc({ status: 'resolved' })));
  });

  it('s3: a student cannot create a report with an unknown reason', async () => {
    await assertFails(setDoc(doc(asStudent(), 'jobReports', 'rep-s3'), reportDoc({ reason: 'made-up' })));
  });

  it('s4: a student cannot create a report for someone else', async () => {
    await assertFails(
      setDoc(doc(asStudent(), 'jobReports', 'rep-s4'), reportDoc({ reporterId: 'student-2' })),
    );
  });

  it('s5: a moderator reads a report and lists open reports', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'jobReports', 'rep-seed')));
    const snap = await assertSucceeds(
      getDocs(query(collection(asModerator(), 'jobReports'), where('status', '==', 'open'), limit(25))),
    );
    expect(snap.docs.length).toBeGreaterThanOrEqual(1);
  });

  it('s6: a student reads their own report but not another student’s', async () => {
    await assertSucceeds(getDoc(doc(asStudent('student-1'), 'jobReports', 'rep-seed')));
    await assertFails(getDoc(doc(asStudent('student-2'), 'jobReports', 'rep-seed')));
  });

  it('s7: a moderator decides a report (open → resolved + note)', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'jobReports', 'rep-s7'), reportDoc({})));
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobReports', 'rep-s7'), {
        status: 'resolved',
        resolvedBy: 'moderator-1',
        resolvedAt: TS(NOW),
        resolutionNote: 'অফিসিয়াল উৎস যাচাই করে ঠিক করা হয়েছে।',
      }),
    );
  });

  it('s8: a student cannot update or delete a report', async () => {
    await assertFails(updateDoc(doc(asStudent(), 'jobReports', 'rep-seed'), { status: 'resolved' }));
    await assertFails(deleteDoc(doc(asStudent(), 'jobReports', 'rep-seed')));
    await assertFails(deleteDoc(doc(asModerator(), 'jobReports', 'rep-seed')));
  });

  it('s9: a guest cannot create a report', async () => {
    await assertFails(setDoc(doc(asGuest(), 'jobReports', 'rep-s9'), reportDoc({})));
  });
});

describe('Step 15 jobCorrections rules (k1–k5)', () => {
  it('k1: a student creates a valid pending correction', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'jobCorrections', 'cor-k1'), correctionDoc({})));
  });

  it('k2: a correction without a source is denied (evidence is required)', async () => {
    await assertFails(setDoc(doc(asStudent(), 'jobCorrections', 'cor-k2'), correctionDoc({ source: '' })));
  });

  it('k3: a moderator accepts a correction with a reason ≥10 chars', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'jobCorrections', 'cor-k3'), correctionDoc({})));
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'jobCorrections', 'cor-k3'), {
        status: 'accepted',
        decidedBy: 'moderator-1',
        decidedAt: TS(NOW),
        decisionReason: 'অফিসিয়াল উৎসের সাথে মিলেছে।',
      }),
    );
  });

  it('k4: a moderator cannot decide with a short reason', async () => {
    await assertSucceeds(setDoc(doc(asStudent(), 'jobCorrections', 'cor-k4'), correctionDoc({})));
    await assertFails(
      updateDoc(doc(asModerator(), 'jobCorrections', 'cor-k4'), {
        status: 'accepted',
        decidedBy: 'moderator-1',
        decidedAt: TS(NOW),
        decisionReason: 'ঠিক',
      }),
    );
  });

  it('k5: a student cannot update or delete a correction', async () => {
    await assertFails(updateDoc(doc(asStudent(), 'jobCorrections', 'cor-seed'), { status: 'accepted' }));
    await assertFails(deleteDoc(doc(asStudent(), 'jobCorrections', 'cor-seed')));
  });
});

describe('Step 15 circularHistory rules (h1–h4)', () => {
  it('h1: a moderator creates a history entry', async () => {
    await assertSucceeds(setDoc(doc(asModerator(), 'circularHistory', 'hist-h1'), historyDoc({})));
  });

  it('h2: a student cannot create a history entry', async () => {
    await assertFails(setDoc(doc(asStudent(), 'circularHistory', 'hist-h2'), historyDoc({})));
  });

  it('h3: nobody can update or delete a history entry (append-only)', async () => {
    await assertFails(updateDoc(doc(asModerator(), 'circularHistory', 'hist-seed'), { note: 'বদলে ফেলা হলো' }));
    await assertFails(deleteDoc(doc(asModerator(), 'circularHistory', 'hist-seed')));
    await assertFails(deleteDoc(doc(asAdmin(), 'circularHistory', 'hist-seed')));
  });

  it('h4: a moderator reads history; a student cannot', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'circularHistory', 'hist-seed')));
    await assertFails(getDoc(doc(asStudent(), 'circularHistory', 'hist-seed')));
  });
});

describe('Step 15 approvedDomains rules (d1–d5)', () => {
  it('d1: an owner creates a domain', async () => {
    await assertSucceeds(setDoc(doc(asOwner(), 'approvedDomains', 'dom-d1'), domainDoc({ domain: 'dpe.gov.bd' })));
  });

  it('d2: a moderator cannot create a domain', async () => {
    await assertFails(setDoc(doc(asModerator(), 'approvedDomains', 'dom-d2'), domainDoc({})));
  });

  it('d3: an owner suspends a domain by writing status (the Step 15 build fix)', async () => {
    await assertSucceeds(setDoc(doc(asOwner(), 'approvedDomains', 'dom-d3'), domainDoc({ domain: 'old.gov.bd' })));
    await assertSucceeds(updateDoc(doc(asOwner(), 'approvedDomains', 'dom-d3'), { status: 'deprecated', updatedAt: TS(NOW) }));
  });

  it('d4: a moderator reads a domain; a student and a guest cannot', async () => {
    await assertSucceeds(getDoc(doc(asModerator(), 'approvedDomains', 'dom-seed')));
    await assertFails(getDoc(doc(asStudent(), 'approvedDomains', 'dom-seed')));
    await assertFails(getDoc(doc(asGuest(), 'approvedDomains', 'dom-seed')));
  });

  it('d5: an owner deletes a domain; a moderator cannot', async () => {
    await assertSucceeds(setDoc(doc(asOwner(), 'approvedDomains', 'dom-d5'), domainDoc({ domain: 'wrong.gov.bd' })));
    await assertFails(deleteDoc(doc(asModerator(), 'approvedDomains', 'dom-d5')));
    await assertSucceeds(deleteDoc(doc(asOwner(), 'approvedDomains', 'dom-d5')));
  });
});

describe('Step 15 circulars delete + new keys (x1–x5)', () => {
  it('x1: an admin deletes a draft circular', async () => {
    await assertSucceeds(setDoc(doc(asModerator(), 'circulars', 'circ-x1'), circularDoc({})));
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'circulars', 'circ-x1')));
  });

  it('x2: a moderator (non-admin) cannot delete a circular', async () => {
    await assertFails(deleteDoc(doc(asModerator(), 'circulars', 'circ-draft')));
  });

  it('x3: a student cannot delete a circular', async () => {
    await assertFails(deleteDoc(doc(asStudent(), 'circulars', 'circ-draft')));
  });

  it('x4: a moderator updates a circular with the 3 new keys (checklist, reviewNote, lastEditedBy)', async () => {
    await assertSucceeds(
      updateDoc(doc(asModerator(), 'circulars', 'circ-draft'), {
        reviewStatus: 'in-review',
        verificationChecklist: {
          orgConfirmed: 'pass',
          sourceOpened: 'pass',
          postCountChecked: 'pass',
          openingDateChecked: 'pass',
          deadlineChecked: 'pass',
          applyLinkChecked: 'pass',
          amendmentsChecked: 'pass',
          notes: {},
          checkedBy: 'moderator-1',
          checkedAt: TS(NOW),
        },
        reviewNote: null,
        lastEditedBy: 'moderator-1',
      }),
    );
  });

  it('x5: a moderator update with a non-allowlist key is still denied', async () => {
    await assertFails(updateDoc(doc(asModerator(), 'circulars', 'circ-draft'), { salary: '৳50,000' }));
  });
});

describe('Step 15 adminActions enum (a1–a2)', () => {
  it('a1: an admin logs a circular delete', async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), 'adminActions', 'act-a1'), {
        actorId: 'admin-1',
        action: 'job-content-deleted',
        details: 'বিজ্ঞপ্তি মোছা হয়েছে',
        targetId: 'circ-x1',
        before: 'draft',
        after: null,
        reason: 'ভুলভাবে তৈরি ডকুমেন্ট',
        createdAt: TS(NOW),
      }),
    );
  });

  it('a2: an admin cannot log an unknown action', async () => {
    await assertFails(
      setDoc(doc(asAdmin(), 'adminActions', 'act-a2'), {
        actorId: 'admin-1',
        action: 'job-content-made-up',
        details: 'x',
        targetId: 'circ-x1',
        before: null,
        after: null,
        reason: 'x',
        createdAt: TS(NOW),
      }),
    );
  });
});

describe('i16: verification → publish → report → decide → history (real stored docs)', () => {
  it('the full admin loop runs on stored docs without touching the circular’s own fields', async () => {
    const mod = asModerator();
    const stu = asStudent();
    // Draft → in-review (submit).
    await assertSucceeds(setDoc(doc(mod, 'circulars', 'circ-i16'), circularDoc({ reviewStatus: 'draft' })));
    await assertSucceeds(
      updateDoc(doc(mod, 'circulars', 'circ-i16'), { reviewStatus: 'in-review', lastEditedBy: 'moderator-1' }),
    );
    // In-review → verified, with the complete checklist.
    await assertSucceeds(
      updateDoc(doc(mod, 'circulars', 'circ-i16'), {
        reviewStatus: 'verified',
        verifiedBy: 'moderator-1',
        verifiedAt: TS(NOW),
        verificationChecklist: {
          orgConfirmed: 'pass',
          sourceOpened: 'pass',
          postCountChecked: 'pass',
          openingDateChecked: 'pass',
          deadlineChecked: 'pass',
          applyLinkChecked: 'pass',
          amendmentsChecked: 'pass',
          notes: {},
          checkedBy: 'moderator-1',
          checkedAt: TS(NOW),
        },
        lastEditedBy: 'moderator-1',
      }),
    );
    // Verified → published.
    await assertSucceeds(updateDoc(doc(mod, 'circulars', 'circ-i16'), { reviewStatus: 'published' }));
    const published = await assertSucceeds(getDoc(doc(asGuest(), 'circulars', 'circ-i16')));
    expect(published.data()?.reviewStatus).toBe('published');
    // A student reports a wrong deadline — the report lands, the
    // circular is untouched.
    await assertSucceeds(setDoc(doc(stu, 'jobReports', 'rep-i16'), reportDoc({ targetId: 'circ-i16' })));
    const before = await assertSucceeds(getDoc(doc(mod, 'circulars', 'circ-i16')));
    expect(before.data()?.applicationDeadline).toEqual(TS(Date.UTC(2026, 11, 15, 12, 0, 0)));
    // A moderator decides the report.
    await assertSucceeds(
      updateDoc(doc(mod, 'jobReports', 'rep-i16'), {
        status: 'resolved',
        resolvedBy: 'moderator-1',
        resolvedAt: TS(NOW),
        resolutionNote: 'অফিসিয়াল উৎস যাচাই করে ঠিক করা হয়েছে।',
      }),
    );
    // The deadline change lands in circularHistory (append-only).
    await assertSucceeds(setDoc(doc(mod, 'circularHistory', 'hist-i16'), historyDoc({ circularId: 'circ-i16' })));
    const hist = await assertSucceeds(getDoc(doc(mod, 'circularHistory', 'hist-i16')));
    expect(hist.data()?.fieldChanged).toBe('applicationDeadline');
    expect(hist.data()?.newValue).toBe('2026-12-20');
    // The circular's own deadline is still the old one — only the
    // editor workflow (with reason + source) may change it.
    const after = await assertSucceeds(getDoc(doc(mod, 'circulars', 'circ-i16')));
    expect(after.data()?.applicationDeadline).toEqual(TS(Date.UTC(2026, 11, 15, 12, 0, 0)));
  });
});
