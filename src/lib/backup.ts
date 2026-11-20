/**
 * EduOrbit JSON backup / restore (client-side, admin only).
 *
 * EXPORT (admin clicks Export in the admin dashboard):
 *   1. App reads each collection, paginated (500 docs per page).
 *   2. It builds ONE JSON file with a metadata header and downloads it
 *      to the admin's device.
 *   3. The file never leaves the admin's device unless the admin sends it.
 *
 * RESTORE (admin uploads the JSON in the dashboard):
 *   1. App validates the schema + per-collection counts.
 *   2. It writes documents back in batches of max 500 (Firestore limit),
 *      respecting the write quota.
 *   3. It reports per-collection success / failure.
 *
 * HONEST QUOTA COST:
 * - Export reads count against the 50,000 Firestore reads/day quota.
 * - Restore writes count against the 20,000 Firestore writes/day quota.
 *   Do exports off-peak and paginated; a full export of a large database
 *   can itself exhaust a day's reads. Never export at peak hours.
 * - Client-side export can ONLY export data the admin's account is allowed
 *   to read under the security rules. Anything the rules hide from the
 *   admin is not in the backup. The Firebase console manual export is the
 *   second route (console → Firestore → Export), and it is the only route
 *   that sees everything.
 * - Backup + recovery must be TESTED before launch on disposable test data:
 *   export → delete test data → restore → verify counts + content match.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  startAfter,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';

export const BACKUP_VERSION = 1;
export const BACKUP_PAGE_SIZE = 500; // max docs per read page
export const RESTORE_BATCH_SIZE = 500; // Firestore writeBatch max

export interface BackupMetadata {
  app: 'EduOrbit';
  backupVersion: number;
  exportedAt: string; // ISO timestamp
  exportedBy: string; // admin UID (or 'unknown')
  collections: Record<string, number>; // collection path -> document count
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
];

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
        ? query(collection(db, path), limit(BACKUP_PAGE_SIZE))
        : query(collection(db, path), startAfter(last), limit(BACKUP_PAGE_SIZE));
    const snap: QuerySnapshot<DocumentData> = await getDocs(q);
    for (const d of snap.docs) {
      docs.push({ id: d.id, ...d.data() });
    }
    onProgress?.(snap.docs.length);
    if (snap.docs.length < BACKUP_PAGE_SIZE) break;
    last = snap.docs[snap.docs.length - 1];
  }
  return docs;
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
    const docs = await readCollectionPaged(db, path, (n) => onProgress?.(path, n));
    data[path] = docs;
    counts[path] = docs.length;
  }
  return {
    metadata: {
      app: 'EduOrbit',
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy,
      collections: counts,
    },
    data,
  };
}

/** Download the backup as one JSON file to the admin's device. */
export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = backup.metadata.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `eduorbit-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
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
  if (file.metadata?.app !== 'EduOrbit') errors.push('metadata.app is not "EduOrbit".');
  if (file.metadata?.backupVersion !== BACKUP_VERSION) {
    errors.push(`Unsupported backupVersion (expected ${BACKUP_VERSION}).`);
  }
  if (!file.metadata?.exportedAt) errors.push('metadata.exportedAt is missing.');
  if (!file.metadata?.collections || typeof file.metadata.collections !== 'object') {
    errors.push('metadata.collections is missing.');
  }
  if (!file.data || typeof file.data !== 'object') {
    errors.push('data is missing.');
  } else if (file.metadata?.collections) {
    for (const [path, count] of Object.entries(file.metadata.collections)) {
      const actual = Array.isArray(file.data[path]) ? file.data[path].length : -1;
      if (actual !== count) {
        errors.push(`Collection "${path}": header says ${count} docs, file has ${actual}.`);
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

/**
 * Restore a validated backup. Writes in batches of max 500.
 * Timestamps stored as strings in JSON are written back as strings — a
 * restore of timestamp fields needs the admin to confirm the field types
 * afterwards (Firestore Timestamps do not survive JSON round-trip).
 * Returns a per-collection success/failure report.
 */
export async function restoreBackup(
  db: Firestore,
  backup: BackupFile,
  collections?: string[],
): Promise<RestoreReport[]> {
  const reports: RestoreReport[] = [];
  const targets = collections ?? Object.keys(backup.data);
  for (const path of targets) {
    const docs = backup.data[path] ?? [];
    const report: RestoreReport = {
      collection: path,
      attempted: docs.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };
    for (let i = 0; i < docs.length; i += RESTORE_BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + RESTORE_BATCH_SIZE);
      for (const item of chunk) {
        const { id, ...fields } = item as { id: string } & DocumentData;
        if (typeof id !== 'string' || id.length === 0) {
          report.failed += 1;
          report.errors.push('Document without a valid id skipped.');
          continue;
        }
        batch.set(doc(db, path, id), fields, { merge: false });
      }
      try {
        await batch.commit();
        report.succeeded += chunk.length;
      } catch (err) {
        report.failed += chunk.length;
        report.errors.push(`Batch starting at index ${i} failed: ${String(err)}`);
      }
    }
    reports.push(report);
  }
  return reports;
}
