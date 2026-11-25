/**
 * Eduvelto JSON backup / restore (client-side, owner only).
 *
 * EXPORT (owner clicks Export in the admin dashboard):
 *   1. Pre-flight: count every collection first and show the cost
 *      ("~N reads, X% of today's 50,000") — the owner confirms.
 *   2. App reads each selected collection, paginated (500 docs/page).
 *   3. It builds JSON file(s) with a metadata header and downloads
 *      them to the owner's device. One file up to 10,000 docs; above
 *      that, one file per collection (a single giant JSON would freeze
 *      the phone tab — and the reads are already paid for).
 *   4. The file never leaves the owner's device unless the owner sends it.
 *
 * RESTORE — READ THIS FIRST (review 20 Nov 2026: NOT SAFE as a
 * client-side feature, so the dashboard does NOT offer a client
 * restore button):
 *   - Client-side restore CANNOT recreate deleted documents: `set` on
 *     a missing doc is judged as `create` by the rules, and the create
 *     rules were written for normal app use (author-only, draft-only,
 *     pending-only). Restoring a deleted published lesson, another
 *     user's plan, or a deleted report FAILS under the rules.
 *   - Timestamps are preserved in the file as {__type:'timestamp'}
 *     markers and revived on restore; other types (GeoPoint) likewise.
 *   - A restore NEVER deletes anything: restoring an old backup over
 *     a live database makes a hybrid (old docs overwritten, newer docs
 *     kept). It is not a rollback.
 *   - THE ONLY FULL RESTORE PATH: Firebase console export/import, or
 *     an Admin-SDK script (Cloud Function / developer-run) that
 *     bypasses the rules deliberately and validates the file. The
 *     dashboard's Backup page shows those steps instead of a button.
 *   - restoreBackup() below is kept for the Admin-SDK path and for
 *     small, same-day overwrites only. It validates the file first,
 *     whitelists collections, stops on quota errors (no doomed retries),
 *     and reports per-document failures.
 *
 * WHAT IS IN THE FILE — and what is NOT:
 *   - Included: every top-level collection the owner can list-read
 *     (84 — see BACKUP_COLLECTIONS; 76 in Step 18 staging + 5 that
 *     joined at the Step 18 merge: counters + the four Step 15
 *     admin collections = 81, then +2 at the forced-app-update
 *     merge (`appVersion` + `config`), +1 at the homepage-redesign
 *     merge (`newsletterSubscribers`), 24 Nov 2026).
 *     `settings` is read doc-by-doc (features + ads) because the rules
 *     have no collection-level match for it (Step 18, F-2). `config` is
 *     read doc-by-doc too (appVersion): its read rule is
 *     `docId == 'appVersion'`, so a list/count over the collection is
 *     denied the same way (unbound wildcard) — see DOC_BY_DOC below.
 *   - NOT included: `follows` + `directMessages` — the owner cannot
 *     list-read them under the rules, so only the scripted/REST export
 *     and the console export see them (Step 18, F-3 + exclusions).
 *   - NOT included: sub-collections (users/{uid}/quizAttempts,
 *     posts/{id}/comments, questions/{id}/answers, ...). They are
 *     listed in the file's metadata so the owner is never misled.
 *     The console export is the only route that sees everything.
 *
 * HONEST QUOTA COST:
 * - Export reads count against the 50,000 Firestore reads/day quota.
 * - Restore writes count against the 20,000 Firestore writes/day quota.
 *   Do exports off-peak. A full export of a large database can itself
 *   exhaust a day's reads — the pre-flight count exists for exactly
 *   that reason. Refuse/advise splitting when the estimate is >50%.
 * - Client-side export can ONLY export data the owner's account is
 *   allowed to read under the security rules.
 * - Backups are MANUAL ONLY — there is no automatic backup on Spark.
 *   If the owner never clicks Export, there is no backup at all.
 * - Backup + recovery must be TESTED before launch on disposable test
 *   data: export → delete test data (via emulator/console/Admin SDK —
 *   the client cannot delete users) → restore → verify counts +
 *   content match (timestamp-aware comparison).
 */

import {
  GeoPoint,
  Timestamp,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { recordReads, recordWrites } from './usage';

export const BACKUP_VERSION = 1;
export const BACKUP_PAGE_SIZE = 500; // max docs per read page
export const RESTORE_BATCH_SIZE = 500; // Firestore writeBatch max
/** Above this many docs, export one file per collection (not one giant file). */
export const BACKUP_SINGLE_FILE_MAX_DOCS = 10_000;

export interface BackupMetadata {
  app: 'Eduvelto';
  backupVersion: number;
  exportedAt: string; // ISO timestamp
  exportedBy: string; // owner UID (or 'unknown')
  collections: Record<string, number>; // collection path -> document count
  /** Honest scope note: sub-collections are NOT in this file. */
  subcollectionsIncluded: false;
}

export interface BackupFile {
  metadata: BackupMetadata;
  data: Record<string, DocumentData[]>; // collection path -> documents ({id, ...fields})
}

// Collections included in a full backup. Never add a collection holding
// credentials or secrets here — there are none in Firestore by design.
export const BACKUP_COLLECTIONS: string[] = [
  'users',
  'educationDirectory',
  'books',
  'chapters',
  'lessons',
  'quizzes',
  'posts',
  'questions',
  // Added 22 Nov 2026 (pre-export full check: the whole Job question
  // bank + quiz keys were silently missing from every backup).
  'jobQuestions',
  'jobQuestionBundles',
  'jobQuestionKeys',
  'quizKeys',
  'reports',
  'moderationQueue',
  'teacherVerifications',
  'studyPlans',
  'progressSummaries',
  // Added 22 Nov 2026 (pre-export full check: user bookmarks + progress
  // were silently missing from every backup).
  'bookmarks',
  'progress',
  'socialPosts',
  'studyGroups',
  'institutionPages',
  'notices',
  'games',
  'achievements',
  'certificates',
  'opportunities',
  'careerPaths',
  // Added 22 Nov 2026 (pre-export full check: the health directory
  // collections were silently missing from every backup).
  'diseases',
  'facilities',
  'medicines',
  // Added 20 Nov 2026 (review: the audit log + settings + social +
  // rewards data were silently missing from every backup).
  'adminActions',
  'settings',
  'socialProfiles',
  'friendships',
  'groupMemberships',
  'competitions',
  'leaderboardSnapshots',
  'parentLinks',
  'parentInvites',
  'giftCatalogue',
  'giftRedemptions',
  'partnerships',
  'rewardBalances',
  // Added 23 Nov 2026 (public user IDs: the allocation counter
  // `counters/publicUserIds` must be in every backup, or a restore
  // would re-issue already-assigned IDs).
  'counters',
  // Added 23 Nov 2026 (Step 14: the circulars collection must be
  // in every backup, or the published circulars are lost).
  'circulars',
  // Added 24 Nov 2026 (homepage redesign: the footer newsletter
  // subscribers list must be in every backup, or the subscriber
  // addresses are lost).
  'newsletterSubscribers',
  // Added 25 Nov 2026 (Phase 3: the donations collection must be
  // in every backup, or the Supporters Wall + every donor record
  // is lost. Public-read under the rules, so the client export
  // covers it.)
  'donations',
  // Added 25 Nov 2026 (Phase 3: the orders collection must be in
  // every backup, or the ৳149 suggestion-PDF orders are lost.
  // Owner/admin-read under the rules, so the client export
  // covers it.)
  'orders',
  // Added 23 Nov 2026 (Step 15: the admin collections — reports,
  // corrections, the per-field audit trail and the approved-domain
  // list — must be in every backup, or the verification history
  // and the student reports are lost).
  'jobReports',
  'jobCorrections',
  'circularHistory',
  'approvedDomains',
  // Added 23 Nov 2026 (Step 18: the Job taxonomy + mock-definition
  // collections were silently missing from every backup. Empty live
  // today, but the next published exam/subject/lesson/mock would be
  // lost — the same MF1 hole, one step later).
  'jobCategories',
  'jobExams',
  'jobSubjects',
  'jobChapters',
  'jobTopics',
  'jobLessons',
  'jobExamDefinitions',
  'jobQuestionSetManifests',
  // Added 24 Nov 2026 (Central Bank: the seven new collections
  // must be in every backup, or the bank + its selection rules +
  // pools + stats + history are lost — the same MF1 hole, one
  // step later. examQuestionPools is moderator-read (owner is a
  // moderator under the rules), so the client export covers it.)
  'jobPassages',
  'jobExamSelectionRules',
  'examQuestionPools',
  'jobQuestionBankStats',
  'jobBankCoverage',
  'topicAnalytics',
  'historicalQuestions',
  // Added 24 Nov 2026 (Job Preparation System: written system +
  // 11–20 configs + model tests — the five new collections must be
  // in every backup, or the written questions/submissions/feedback,
  // the verified 11–20 configs and the published model tests are
  // lost. All five are owner/moderator-readable under the rules, so
  // the client export covers them; writtenSubmissions reads are
  // owner-or-moderator, and the owner is a moderator.)
  'writtenQuestions',
  'writtenSubmissions',
  'writtenFeedback',
  'modelTests',
  'grade1120Configs',
  // Added 23 Nov 2026 (Step 18: the NU admission content store.
  // Empty live today (the NU seed was never applied), but the same
  // silent-loss risk the moment a moderator publishes NU content).
  'nuSubjects',
  'nuChapters',
  'nuTopics',
  'nuLessons',
  'nuQuestions',
  'nuQuestionBundles',
  'nuQuestionKeys',
  'nuQuestionDraftKeys',
  'nuExamConfigs',
  'nuCircularConfigs',
  'nuCalendarEvents',
  'nuFacts',
  'nuGroups',
  'nuInstitutions',
  'nuNotices',
  'nuPublications',
  'nuCorrections',
  'nuReports',
  'nuReviews',
  // Added 23 Nov 2026 (Step 18: admin/contact/health records that
  // hold real user data and were missing from every backup).
  'teacherChangeRequests',
  'contactMessages',
  'doctors',
  'supportMessages',
  // Added 23 Nov 2026 (forced app update: the single config/appVersion
  // doc — latest/min version — must be in every backup, or a restore
  // would silently drop the forced-update gate. Read doc-by-doc, like
  // settings: the read rule is docId == appVersion, so a list/count
  // over the collection is denied — see DOC_BY_DOC below.)
  'config',
  // Added 25 Nov 2026 (Question Paper Generator MVP, Milestone 2.5:
  // the per-teacher monthly usage counter, the TrxID Pro orders and
  // the typo/error reports must be in every backup, or the quota
  // history, paid-order audit trail and verification reports are
  // lost. Rules live in firestore.rules (branch only, not deployed).)
  'qpgUsage',
  'qpgProOrders',
  'qpgReports',
  'qpgBoards',
  'qpgContributions',
  'qpgContributorStats',
  'qpgCustomOrders',
];

/**
 * Root collections DELIBERATELY excluded from backups (Step 18).
 * Every top-level collection in firestore.rules must be in
 * BACKUP_COLLECTIONS or here — the drift test in
 * src/lib/__tests__/backup.test.ts enforces it, so a new collection
 * cannot silently fall outside coverage. An exclusion needs a reason,
 * not just a name.
 */
export const BACKUP_EXCLUSIONS: Record<string, string> = {
  // 10-minute authorization tokens: worthless after expiry, and the
  // same facts live in the attempt doc. Backing them up would only
  // preserve dead keys.
  jobReceipts: 'Ephemeral 10-minute answer-key authorization token; content duplicated in the attempt doc.',
  quizReceipts: 'Ephemeral 10-minute answer-key authorization token; content duplicated in the attempt doc.',
  nuReceipts: 'Ephemeral 10-minute answer-key authorization token; content duplicated in the attempt doc.',
  // Transient per-exam lock, recreated on demand; holds no user data.
  jobExamUserLocks: 'Transient exam lock, recreated on demand; holds no user content.',
  // The owner CANNOT list-read this collection under the rules
  // (participant-only read). A client export is impossible — the only
  // complete path is the console export or the Admin-SDK/REST script.
  directMessages: 'Owner cannot list-read under the rules (participant-only); client export impossible — console/Admin-SDK only.',
  // F-3 (Step 18, emulator-proved): the follows read rule is
  // follower-only — `allow read: if signedIn() &&
  // resource.data.followerId == uid()` — with no staff tail, so an
  // owner list/count query is denied and a client export throws.
  // Granting the owner read over everyone's follow graph is a privacy
  // decision for the owner, NOT a testing step to take silently — so
  // follows stays out of the client list until he decides (a rules
  // tail `|| isAdmin()` is the one-line fix, if he wants it). The
  // data is NOT lost: the scripted/REST export reads it fine.
  follows: 'Owner cannot list-read under the rules (follower-only read, no staff tail); client export impossible — console/Admin-SDK only.',
  // Owner 2FA records (23 Nov 2026, staging): login history + salted
  // backup-code hashes. The client export cannot list the collection
  // (list denied by design — only the owner's own doc is readable, by
  // ID) and the doc ID is the owner's UID, so it cannot join the
  // static DOC_BY_DOC list. Subcollections are not backed up by design
  // (subcollectionsIncluded: false), so the backup-code hashes are NOT
  // in any backup file: after a full restore the owner regenerates
  // backup codes (old ones stop working) — recorded in
  // team/2fa-preparation-2026-11-23.md. No plaintext code is ever
  // stored anywhere, so there is nothing secret to lose.
  ownerSecurity: 'Owner-only 2FA records (login history + salted backup-code hashes). Client cannot list the collection and the doc ID is the owner UID; subcollections are not backed up by design — regenerate backup codes after a restore.',
};

/**
 * Collections the CLIENT cannot list-read, which the scripted REST
 * exporter still covers (it reads with the owner CLI token, bypassing
 * the rules). The parity test asserts the script exports exactly
 * BACKUP_COLLECTIONS + these — no more, no less.
 */
export const BACKUP_CLIENT_UNREADABLE: string[] = ['directMessages', 'follows'];

/**
 * Collections that WILL exist soon, on other branches — NOT in this
 * list yet, because adding one before its rules match exists would
 * BREAK the export (a list query on an unmatched collection is
 * denied, and buildBackup throws on the first denied collection).
 * The drift test asserts these are still absent, so the note cannot
 * go stale: whoever merges the branch must move the name into
 * BACKUP_COLLECTIONS and delete it here, or the suite goes red.
 */
export const BACKUP_KNOWN_PENDING: Record<string, string> = {
  // Emptied at the Step 18 merge (23 Nov 2026): all five pending
  // collections — jobReports, jobCorrections, circularHistory,
  // approvedDomains (Step 15, live) and counters (public user IDs,
  // live) — have joined BACKUP_COLLECTIONS above, so none is pending
  // any more. The map is kept (empty) so a future pending collection
  // has a place to be recorded with its reason.
};

/** Firestore values do not survive JSON as-is — mark them so restore can revive them. */
function serialiseValue(v: unknown): unknown {
  if (v instanceof Timestamp) return { __type: 'timestamp', millis: v.toMillis() };
  if (v instanceof GeoPoint) {
    return { __type: 'geopoint', latitude: v.latitude, longitude: v.longitude };
  }
  if (Array.isArray(v)) return v.map(serialiseValue);
  if (typeof v === 'object' && v !== null) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = serialiseValue(val);
    }
    return out;
  }
  return v;
}

function reviveValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(reviveValue);
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    if (o.__type === 'timestamp' && typeof o.millis === 'number') {
      return Timestamp.fromMillis(o.millis);
    }
    if (
      o.__type === 'geopoint' &&
      typeof o.latitude === 'number' &&
      typeof o.longitude === 'number'
    ) {
      return new GeoPoint(o.latitude, o.longitude);
    }
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(o)) out[k] = reviveValue(val);
    return out;
  }
  return v;
}

/**
 * settings is a special case (Step 18, finding F-2, emulator-proved):
 * the rules have only single-doc matches (/settings/features and
 * /settings/ads) — no collection-level match — so a list/count query
 * over the settings collection is DENIED even for the owner, and a
 * plain buildBackup() throws on it. The two docs are therefore read
 * by ID. If a third settings doc ever ships, add its ID here AND a
 * rules match for it, or the export silently omits it.
 */
export const SETTINGS_DOC_IDS: string[] = ['features', 'ads'];

/**
 * config is the same shape (forced app update, 23 Nov 2026): the rules
 * have one match, /config/{docId}, with `allow read: if
 * docId == 'appVersion'`. In a list/count query the {docId} wildcard is
 * unbound (null), so `null == 'appVersion'` errors and the whole
 * list/count is denied — the exact failure the old combined counters
 * `allow read` had (Step 18, Option A). The single doc is therefore
 * read by ID, like settings. Only `appVersion` can ever exist — the
 * create/update rules restrict writes to that docId.
 */
export const CONFIG_DOC_IDS: string[] = ['appVersion'];

/** Collections that must be read doc-by-doc (no list/count allowed under the rules). */
const DOC_BY_DOC: Record<string, string[]> = {
  settings: SETTINGS_DOC_IDS,
  config: CONFIG_DOC_IDS,
};

async function readDocsById(db: Firestore, path: string, ids: string[]): Promise<DocumentData[]> {
  const docs: DocumentData[] = [];
  for (const id of ids) {
    const snap = await getDoc(doc(db, path, id));
    if (!snap.exists()) continue;
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(snap.data())) data[k] = serialiseValue(v);
    docs.push({ id: snap.id, ...data });
  }
  return docs;
}

async function readCollectionPaged(
  db: Firestore,
  path: string,
  onProgress?: (read: number) => void,
): Promise<DocumentData[]> {
  const docs: DocumentData[] = [];
  let last: QueryDocumentSnapshot<DocumentData> | null = null;
  for (;;) {
    const q: Query<DocumentData> =
      last === null
        ? query(collection(db, path), orderBy('__name__'), limit(BACKUP_PAGE_SIZE))
        : query(
            collection(db, path),
            orderBy('__name__'),
            startAfter(last),
            limit(BACKUP_PAGE_SIZE),
          );
    const snap: QuerySnapshot<DocumentData> = await getDocs(q);
    for (const d of snap.docs) {
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(d.data())) data[k] = serialiseValue(v);
      docs.push({ id: d.id, ...data });
    }
    onProgress?.(snap.docs.length);
    if (snap.docs.length < BACKUP_PAGE_SIZE) break;
    last = snap.docs[snap.docs.length - 1];
  }
  return docs;
}

export interface BackupPreflight {
  perCollection: Array<{ path: string; count: number }>;
  total: number;
  /** Estimated reads as % of the 50,000/day Spark quota. */
  readsPercent: number;
}

/**
 * Count first, export second (review cost F2): show the owner the cost
 * before a single document is read. 45 count queries ≈ 45 reads.
 */
export async function getBackupPreflight(
  db: Firestore,
  collections: string[] = BACKUP_COLLECTIONS,
): Promise<BackupPreflight> {
  const perCollection: Array<{ path: string; count: number }> = [];
  let total = 0;
  for (const path of collections) {
    const docIds = DOC_BY_DOC[path];
    if (docIds) {
      // No list/count allowed for this collection (see DOC_BY_DOC):
      // count by reading the known docs, never by a denied count query.
      const docs = await readDocsById(db, path, docIds);
      perCollection.push({ path, count: docs.length });
      total += docs.length;
      continue;
    }
    const snap = await getCountFromServer(collection(db, path));
    const count = snap.data().count;
    perCollection.push({ path, count });
    total += count;
  }
  recordReads(collections.length);
  return { perCollection, total, readsPercent: (total / 50_000) * 100 };
}

/** Build the backup object. Throws if Firestore is not connected. */
export async function buildBackup(
  db: Firestore,
  exportedBy: string,
  collections: string[] = BACKUP_COLLECTIONS,
  onProgress?: (collectionPath: string, read: number) => void,
): Promise<BackupFile> {
  const data: Record<string, DocumentData[]> = {};
  const counts: Record<string, number> = {};
  for (const path of collections) {
    const docIds = DOC_BY_DOC[path];
    const docs =
      docIds !== undefined
        ? await readDocsById(db, path, docIds)
        : await readCollectionPaged(db, path, (n) => {
            recordReads(n);
            onProgress?.(path, n);
          });
    if (docIds !== undefined) recordReads(docs.length);
    data[path] = docs;
    counts[path] = docs.length;
  }
  return {
    metadata: {
      app: 'Eduvelto',
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy,
      collections: counts,
      subcollectionsIncluded: false,
    },
    data,
  };
}

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download the backup. Filename carries date + time + doc count, so two
 * exports on the same day never overwrite each other (review finding 10).
 * Above 10,000 docs: one file per collection (review finding 6).
 */
export function downloadBackup(backup: BackupFile): void {
  const total = Object.values(backup.metadata.collections).reduce((a, b) => a + b, 0);
  const d = backup.metadata.exportedAt;
  const stamp = `${d.slice(0, 10)}-${d.slice(11, 13)}${d.slice(14, 16)}`;
  if (total <= BACKUP_SINGLE_FILE_MAX_DOCS) {
    downloadJson(`eduvelto-backup-${stamp}-${total}docs.json`, backup);
    return;
  }
  for (const [path, docs] of Object.entries(backup.data)) {
    downloadJson(`eduvelto-backup-${stamp}-${path}-${docs.length}docs.json`, {
      metadata: { ...backup.metadata, collections: { [path]: docs.length } },
      data: { [path]: docs },
    });
  }
}

export interface BackupValidation {
  ok: boolean;
  errors: string[];
}

/** Validate a parsed backup file before any write happens. */
export function validateBackup(parsed: unknown): BackupValidation {
  const errors: string[] = [];
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, errors: ['Backup file is not a JSON object.'] };
  }
  const file = parsed as Partial<BackupFile>;
  if (file.metadata?.app !== 'Eduvelto') errors.push('metadata.app is not "Eduvelto".');
  if (file.metadata?.backupVersion !== BACKUP_VERSION) {
    errors.push(`Unsupported backupVersion (expected ${BACKUP_VERSION}).`);
  }
  if (!file.metadata?.exportedAt || Number.isNaN(new Date(file.metadata.exportedAt).getTime())) {
    errors.push('metadata.exportedAt is missing or not a valid date.');
  }
  if (!file.metadata?.collections || typeof file.metadata.collections !== 'object') {
    errors.push('metadata.collections is missing.');
  }
  if (!file.data || typeof file.data !== 'object') {
    errors.push('data is missing.');
  } else {
    for (const [path, count] of Object.entries(file.metadata?.collections ?? {})) {
      if (!BACKUP_COLLECTIONS.includes(path)) {
        errors.push(`Unknown collection "${path}" — not in the backup allowlist.`);
        continue;
      }
      const docs = file.data[path];
      const actual = Array.isArray(docs) ? docs.length : -1;
      if (actual !== count) {
        errors.push(`Collection "${path}": header says ${count} docs, file has ${actual}.`);
      }
      if (Array.isArray(docs)) {
        const ids = new Set<string>();
        for (const item of docs) {
          const id = (item as { id?: unknown } | null)?.id;
          if (typeof id !== 'string' || id.length === 0) {
            errors.push(`Collection "${path}": a document has no valid id.`);
            break;
          }
          if (ids.has(id)) {
            errors.push(`Collection "${path}": duplicate id "${id}".`);
            break;
          }
          ids.add(id);
        }
      }
    }
    for (const path of Object.keys(file.data)) {
      if (!BACKUP_COLLECTIONS.includes(path)) {
        errors.push(`Unknown collection "${path}" in data — not in the backup allowlist.`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export interface RestoreReport {
  collection: string;
  attempted: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export interface RestoreResult {
  reports: RestoreReport[];
  /** True when the restore stopped early (quota) — the database is PARTIAL. */
  stoppedEarly: boolean;
  stoppedReason?: string;
  skippedUnknownCollections: string[];
}

function isQuotaError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('resource-exhausted') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}

/**
 * Restore a validated backup. Writes in batches of max 500.
 * - Validates FIRST (a caller that forgets validation cannot write
 *   unchecked data — review finding 9).
 * - Only allowlisted collections are restored; anything else is skipped
 *   and reported, never written (a crafted file cannot target
 *   adminActions/settings/users-role this way).
 * - Stops on the FIRST quota error instead of hammering the quota with
 *   doomed batches (review cost F3) — the result says exactly where it
 *   stopped, and the owner resumes tomorrow after the quota resets.
 * - Per-document failures are reported by id (a failed batch no longer
 *   hides which documents are missing — review finding 3).
 * - Timestamps/GeoPoints are revived from their markers (review finding 5).
 * NOTE: this cannot recreate DELETED documents under the client rules
 * (see the module header) — that is why the dashboard offers console /
 * Admin-SDK restore instead of this function.
 */
export async function restoreBackup(
  db: Firestore,
  backup: BackupFile,
  collections?: string[],
): Promise<RestoreResult> {
  const validation = validateBackup(backup);
  if (!validation.ok) {
    throw new Error(`invalid-backup: ${validation.errors.join(' | ')}`);
  }
  const requested = collections ?? Object.keys(backup.data);
  const skippedUnknownCollections = requested.filter((c) => !BACKUP_COLLECTIONS.includes(c));
  const targets = requested.filter((c) => BACKUP_COLLECTIONS.includes(c));
  const reports: RestoreReport[] = [];
  let stoppedEarly = false;
  let stoppedReason: string | undefined;
  for (const path of targets) {
    const docs = backup.data[path] ?? [];
    const report: RestoreReport = {
      collection: path,
      attempted: docs.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };
    for (let i = 0; i < docs.length && !stoppedEarly; i += RESTORE_BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + RESTORE_BATCH_SIZE);
      let inBatch = 0;
      for (const item of chunk) {
        const { id, ...fields } = item as { id: string } & DocumentData;
        if (typeof id !== 'string' || id.length === 0) {
          report.failed += 1;
          report.errors.push(`Document without a valid id skipped (index ${i}).`);
          continue;
        }
        const revived: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(fields)) revived[k] = reviveValue(v);
        batch.set(doc(db, path, id), revived, { merge: false });
        inBatch += 1;
      }
      try {
        await batch.commit();
        recordWrites(inBatch);
        report.succeeded += inBatch;
      } catch (err) {
        report.failed += inBatch;
        report.errors.push(`Batch starting at index ${i} failed: ${String(err)}`);
        if (isQuotaError(err)) {
          stoppedEarly = true;
          stoppedReason = `Write quota hit at collection "${path}", batch starting index ${i}: ${report.succeeded} of ${docs.length} docs in this collection restored. Resume tomorrow after the quota resets — do not re-run from scratch.`;
        }
      }
    }
    reports.push(report);
    if (stoppedEarly) break;
  }
  return { reports, stoppedEarly, stoppedReason, skippedUnknownCollections };
}
