// Eduvelto — Job Preparation dashboard data (Step 11).
//
// Firestore loaders for /jobs/dashboard. One-shot getDoc/getDocs
// only — NO onSnapshot (reconnect churn + read costs on unstable
// networks; Gemini). Bounded reads: at most 20 practice + 20 mock
// attempts, plus one published-bundle query per exam the student
// actually touches. The page says so when a list hits its cap, so
// a capped window is never presented as a lifetime total.
//
// NO new collections, NO new rules: attempts come from the Step
// 8/9 collections (owner-read rules already proven by the Step 10
// r-tests), bundles from the public published-bundle query, and
// achievements from the EXISTING users/{uid}/userAchievements
// collection (owner create, never update/delete — architecture
// §2.23). The jobNotifications collection is DEFERRED to Step 14
// (see team/job-step11-dashboard-2026-11-22.md): on this branch
// the compiled-rules margin is 1,138 bytes and a new match block
// would breach the 256,000-byte limit.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { attemptSummaryFromStored, type JobAttemptSummary } from './jobAnalysis';
import {
  listJobAttempts,
  listPublishedPracticeBundles,
  loadPracticeBundle,
} from './jobPractice';
import { listMockAttempts, loadPublishedMock } from './jobMock';
import type { PublishedBundleRef } from './jobDashboard';

/** Practice + mock attempts, newest first (one loader, one
 * merged list — the page never re-queries the same collection
 * per section). `capped` is true when either list hit its
 * limit, so the page can say the numbers cover the most recent
 * attempts rather than a lifetime total. */
export async function loadDashboardAttempts(
  uid: string,
): Promise<{ attempts: JobAttemptSummary[]; capped: boolean }> {
  const [practice, mocks] = await Promise.all([
    listJobAttempts(uid, 20),
    listMockAttempts(uid, 20),
  ]);
  const attempts = [
    ...practice.map((a) => attemptSummaryFromStored(a.docId, a)),
    ...mocks.map((a) => attemptSummaryFromStored(a.docId, a)),
  ].sort((a, b) => (b.submittedAtMillis ?? 0) - (a.submittedAtMillis ?? 0));
  return { attempts, capped: practice.length >= 20 || mocks.length >= 20 };
}

/** Published bundles for the exams given, reduced to the
 * fields the dashboard's link guard needs. Exams with no
 * published bundles map to []. */
export async function loadPublishedBundlesForExams(
  examSlugs: string[],
): Promise<Map<string, PublishedBundleRef[]>> {
  const out = new Map<string, PublishedBundleRef[]>();
  await Promise.all(
    examSlugs.map(async (slug) => {
      const bundles = await listPublishedPracticeBundles(slug);
      out.set(
        slug,
        bundles
          .filter((b) => b.questionCount > 0)
          .map((b) => ({ docId: b.docId, topicId: b.topicId ?? null, questionCount: b.questionCount, titleBn: b.titleBn })),
      );
    }),
  );
  return out;
}

/** Verify a practice bundle still exists and is usable before
 * the page renders a retry/resume link to it (ChatGPT: never
 * resume to deleted content). Null when missing or unusable. */
export async function verifyPracticeBundle(
  bundleId: string,
): Promise<{ docId: string } | null> {
  const bundle = await loadPracticeBundle(bundleId).catch(() => null);
  return bundle ? { docId: bundle.docId } : null;
}

/** Verify a mock attempt can be retaken: the attempt stores
 * the BARE mockId (full__{exam}__{n} for full mocks, a date for
 * daily, a week ID for weekly) while the page route takes the
 * jobMocks DOC ID. Try each candidate doc ID; the first
 * still-published mock wins, otherwise null and the page shows
 * only the result link — never a dead retry link. */
export async function verifyMockRetry(mockId: string): Promise<{ docId: string } | null> {
  const candidates = [mockId, `daily__${mockId}`, `weekly__${mockId}`];
  for (const docId of candidates) {
    const mock = await loadPublishedMock(docId).catch(() => null);
    if (mock) return { docId: mock.docId };
  }
  return null;
}

/** The student's earned achievement keys (existing collection,
 * owner-read — no new rule). */
export async function listUserAchievementKeys(uid: string): Promise<string[]> {
  const firestore = db;
  if (!firestore) return [];
  const snap = await getDocs(collection(firestore, 'users', uid, 'userAchievements'));
  return snap.docs.map((d) => d.id);
}

/** Persist achievements the student has earned but whose docs
 * do not exist yet. Deterministic IDs (the key itself), one
 * idempotent create each, best-effort: a failure here must
 * never break the dashboard — the card derives the same list
 * from the attempts anyway. */
export async function awardMissingJobAchievements(uid: string, keys: string[]): Promise<void> {
  const firestore = db;
  if (!firestore || keys.length === 0) return;
  for (const key of keys) {
    try {
      const ref = doc(firestore, 'users', uid, 'userAchievements', key);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { key, earnedAt: serverTimestamp() });
      }
    } catch {
      // Best-effort only (see the header): ignore.
    }
  }
}
