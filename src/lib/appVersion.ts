// Eduvelto — forced app update (owner brief 22 Nov 2026, BINDING).
//
// There is NO native app yet (Android/iOS 0%) — the "app" users download
// is the PWA (Add to Home Screen). So the "download link" is the in-app
// /install page (DEFAULT_DOWNLOAD_URL) — never invent a Play Store / APK
// link. The PWA service worker auto-updates code on next visit, so
// enforcement is a version check on app load, not a store mechanism.
//
// How it works:
// - The owner publishes a new version from /admin/app-version, which
//   writes ONE doc: config/appVersion { latestVersion, minVersion,
//   releaseNotes, downloadUrl, updatedAt }. NO code/deploy is needed to
//   publish a version (no-code admin rule).
// - On every app load the app fetches that doc with getDocFromServer
//   (NEVER a cached read — a cached check would defeat the block) and
//   compares the bundled version (APP_VERSION) against it:
//     bundled < minVersion  → BLOCKED: full-screen "নতুন ভার্সন এসেছে"
//       screen, nothing else usable, one big download button.
//     minVersion <= bundled < latestVersion → non-blocking "আপডেট এসেছে"
//       notice bar.
//     bundled >= latestVersion → normal use.
// - FAIL OPEN, by design: no config doc yet, offline/unreachable, or a
//   malformed config NEVER blocks anyone — the user gets in and the
//   check re-runs when back online ('online' event). A typo in the admin
//   form must not lock every user out.
// - Escape hatches (the gate never blocks these — see AppVersionGate):
//   /install (the download destination), /login (sign in to reach the
//   admin fix), /admin/* (the owner must be able to lower minVersion).
//   Without them a too-high minVersion would be unfixable from the app.

import { doc, getDocFromServer, type Firestore } from 'firebase/firestore';

// Single source of truth for the bundled version — keep in step with
// package.json "version" (both are 0.1.0 today). The next real release
// bumps BOTH together; the owner publishes it via /admin/app-version.
export const APP_VERSION = '0.1.0';
export const APP_VERSION_DOC = 'appVersion';
export const DEFAULT_DOWNLOAD_URL = '/install';

export interface AppVersionConfig {
  latestVersion: string;
  minVersion: string;
  releaseNotes: string;
  downloadUrl: string;
  updatedAt: unknown;
}

/** Parse "x", "x.y" or "x.y.z" (digits only) into [major, minor, patch]. */
export function parseVersion(v: string): number[] | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
}

export function isValidVersion(v: string): boolean {
  return parseVersion(v) !== null;
}

/**
 * Compare two version strings: -1 if a < b, 0 if equal, 1 if a > b.
 * A malformed version compares EQUAL to anything (fail open — a bad
 * value in the config must never block users or force an update).
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

export type AppVersionStatus = 'current' | 'update-available' | 'blocked';

/**
 * Decide what the bundled version may do against a published config.
 * null config (nothing published yet) means 'current' — nothing to enforce.
 */
export function checkAppVersion(
  config: AppVersionConfig | null,
  currentVersion: string,
): AppVersionStatus {
  if (!config) return 'current';
  if (compareVersions(currentVersion, config.minVersion) < 0) return 'blocked';
  if (compareVersions(currentVersion, config.latestVersion) < 0) return 'update-available';
  return 'current';
}

/**
 * Fetch the published version config straight from the server (no local
 * cache). Returns null when no config is published yet OR when the stored
 * config is malformed (fail open). Throws only on transport errors
 * (offline / unreachable) — callers fail open on throw, too.
 */
export async function fetchAppVersionConfig(db: Firestore): Promise<AppVersionConfig | null> {
  const snap = await getDocFromServer(doc(db, 'config', APP_VERSION_DOC));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (typeof d.latestVersion !== 'string' || typeof d.minVersion !== 'string') return null;
  if (!isValidVersion(d.latestVersion) || !isValidVersion(d.minVersion)) return null;
  return {
    latestVersion: d.latestVersion,
    minVersion: d.minVersion,
    releaseNotes: typeof d.releaseNotes === 'string' ? d.releaseNotes : '',
    downloadUrl:
      typeof d.downloadUrl === 'string' && d.downloadUrl.length > 0
        ? d.downloadUrl
        : DEFAULT_DOWNLOAD_URL,
    updatedAt: d.updatedAt ?? null,
  };
}
