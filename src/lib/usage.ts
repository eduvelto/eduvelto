/**
 * EduOrbit usage counters (client-side estimates).
 *
 * HONEST LIMIT, READ THIS FIRST:
 * These counters are ESTIMATES kept in this browser's localStorage. They
 * are NOT the quota. The authoritative numbers live in the Firebase
 * console usage tab (Project → Usage and billing / Firestore usage):
 *   - Firestore reads/day (limit 50,000), writes/day (20,000),
 *     deletes/day (20,000), stored data (1 GiB), egress/month (10 GiB)
 *   - Hosting transfer/day (360 MB), Hosting storage (10 GB)
 *   - Auth MAU (50,000)
 * A client-side counter can only see what THIS browser did; it cannot see
 * other users, and it resets if localStorage is cleared. Treat it as a
 * rough dashboard for the admin, never as proof the quota is safe.
 *
 * SEPARATE QUOTAS — DO NOT MIX THEM UP:
 * - Firebase Hosting transfer (360 MB/day) is the size of the APP FILES
 *   (JS/CSS/HTML) downloaded by visitors. It has nothing to do with
 *   database reads.
 * - Firestore network egress (10 GiB/month) is the size of DATABASE
 *   documents sent to clients. It is a different counter, on a different
 *   meter, in a different console tab.
 * They are separate quotas with separate counters. Hitting one does not
 * mean the other is hit, and fixing one does not fix the other.
 */

export type UsageKind = 'firestoreReads' | 'firestoreWrites' | 'firestoreDeletes';

export interface DailyUsage {
  date: string; // YYYY-MM-DD, local date
  firestoreReads: number;
  firestoreWrites: number;
  firestoreDeletes: number;
}

export const QUOTAS = {
  firestoreReadsPerDay: 50_000,
  firestoreWritesPerDay: 20_000,
  firestoreDeletesPerDay: 20_000,
  firestoreStorageGiB: 1,
  firestoreEgressGiBPerMonth: 10,
  hostingTransferMBPerDay: 360,
  hostingStorageGB: 10,
  authMau: 50_000,
} as const;

const STORAGE_KEY = 'eduorbit-usage-v1';

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function emptyUsage(date: string): DailyUsage {
  return { date, firestoreReads: 0, firestoreWrites: 0, firestoreDeletes: 0 };
}

function load(): DailyUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyUsage(todayKey());
    const parsed = JSON.parse(raw) as DailyUsage;
    // A new day starts a fresh counter (quotas reset daily).
    if (parsed.date !== todayKey()) return emptyUsage(todayKey());
    return parsed;
  } catch {
    return emptyUsage(todayKey());
  }
}

function save(u: DailyUsage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {
    // Storage full / unavailable: counters are best-effort only.
  }
}

/** Record n Firestore reads done by this browser today (estimate). */
export function recordReads(n = 1): DailyUsage {
  const u = load();
  u.firestoreReads += n;
  save(u);
  return u;
}

/** Record n Firestore writes done by this browser today (estimate). */
export function recordWrites(n = 1): DailyUsage {
  const u = load();
  u.firestoreWrites += n;
  save(u);
  return u;
}

/** Record n Firestore deletes done by this browser today (estimate). */
export function recordDeletes(n = 1): DailyUsage {
  const u = load();
  u.firestoreDeletes += n;
  save(u);
  return u;
}

/** Today's client-side estimate (this browser only). */
export function getTodayUsage(): DailyUsage {
  return load();
}

/** Usage as a percentage of the daily Spark quota (client-side estimate). */
export function usagePercentages(u: DailyUsage): Record<UsageKind, number> {
  return {
    firestoreReads: (u.firestoreReads / QUOTAS.firestoreReadsPerDay) * 100,
    firestoreWrites: (u.firestoreWrites / QUOTAS.firestoreWritesPerDay) * 100,
    firestoreDeletes: (u.firestoreDeletes / QUOTAS.firestoreDeletesPerDay) * 100,
  };
}

/** Where each authoritative number is read (for the admin dashboard). */
export const CONSOLE_SOURCES: Record<string, string> = {
  firestoreReads: 'Firebase console → Firestore Database → Usage tab (Reads/day)',
  firestoreWrites: 'Firebase console → Firestore Database → Usage tab (Writes/day)',
  firestoreDeletes: 'Firebase console → Firestore Database → Usage tab (Deletes/day)',
  firestoreStorage: 'Firebase console → Firestore Database → Usage tab (Stored data, 1 GiB)',
  firestoreEgress: 'Firebase console → Usage and billing → Firestore network egress (10 GiB/month)',
  hostingTransfer: 'Firebase console → Hosting → Usage tab (Transfer, 360 MB/day)',
  hostingStorage: 'Firebase console → Hosting → Usage tab (Storage, 10 GB)',
  authMau: 'Firebase console → Authentication → Users (MAU, 50,000)',
};
