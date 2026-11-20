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
 *   - Included: every top-level collection (36, incl. adminActions and
 *     settings — the audit log and the feature flags ARE backed up).
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
  'reports',
  'moderationQueue',
  'teacherVerifications',
  'studyPlans',
  'progressSummaries',
  'socialPosts',
  'studyGroups',
  'institutionPages',
  'notices',
  'games',
  'achievements',
  'certificates',
  'opportunities',
  'careerPaths',
  // Added 20 Nov 2026 (review: the audit log + settings + social +
  // rewards data were silently missing from every backup).
  'adminActions',
  'settings',
  'socialProfiles',
  'friendships',
  'follows',
  'groupMemberships',
  'competitions',
  'leaderboardSnapshots',
  'parentLinks',
  'parentInvites',
  'giftCatalogue',
  'giftRedemptions',
  'partnerships',
  'rewardBalances',
];

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
 * before a single document is read. 22 count queries ≈ 22 reads.
 */
export async function getBackupPreflight(
  db: Firestore,
  collections: string[] = BACKUP_COLLECTIONS,
): Promise<BackupPreflight> {
  const perCollection: Array<{ path: string; count: number }> = [];
  let total = 0;
  for (const path of collections) {
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
    const docs = await readCollectionPaged(db, path, (n) => {
      recordReads(n);
      onProgress?.(path, n);
    });
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
