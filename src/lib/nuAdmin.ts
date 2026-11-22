// Eduvelto — National University admission: admin seed flow (NU-5,
// 22 Nov 2026; design doc §19.2.1–§19.2.2, §19.3.4, §19.13 Gate 2).
//
// The `nuExamConfigs` / `nuGroups` / `nuInstitutions` /
// `nuCircularConfigs` seed documents are applied ONLY through this
// admin flow — never by hand-applying the seed JSON to live, never by
// a script with admin credentials. The flow:
//   1. validates EVERY payload client-side first (a single bad doc
//      aborts the whole apply — no partial writes);
//   2. writes each doc with setDoc (Owner/Admin only — firestore.rules
//      enforces the values again, so a direct write cannot publish a
//      wrong config either);
//   3. writes ONE audit entry (`nu-structure-applied`) to the
//      append-only adminActions log;
//   4. reads every doc back and compares it to the seed (read-back
//      verification — the admin page shows matches / differs / missing).
//
// The hub UI does NOT read from Firestore (see lib/nuStructure.ts):
// it renders the verified facts from code until live docs exist and
// the read-back check confirms they match. `readNuStructure()` below
// exists for the admin page's verification display only.

import { doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { validateNuExamConfig } from './nuExamConfig';
import {
  nuSeedDocs,
  validateNuCircularConfigDoc,
  validateNuGroupDoc,
  validateNuInstitutionDoc,
  type NuSeedDoc,
} from './nuStructure';
import { logAdminAction } from './admin';

export const NU_STRUCTURE_APPLY_ACTION = 'nu-structure-applied';

/** Validate one seed doc against its collection's rules-mirror.
 * Returns every problem — empty means valid. */
export function validateNuSeedDoc(seed: NuSeedDoc): string[] {
  switch (seed.collection) {
    case 'nuInstitutions':
      return validateNuInstitutionDoc(seed.payload);
    case 'nuGroups':
      return validateNuGroupDoc(seed.payload);
    case 'nuExamConfigs':
      return validateNuExamConfig(seed.payload);
    case 'nuCircularConfigs':
      return validateNuCircularConfigDoc(seed.payload);
    default:
      return [`unknown collection ${String(seed.collection)}`];
  }
}

/** Validate the whole seed set. Empty = safe to apply. */
export function validateNuSeedSet(seeds: NuSeedDoc[] = nuSeedDocs()): string[] {
  const problems: string[] = [];
  for (const seed of seeds) {
    for (const p of validateNuSeedDoc(seed)) {
      problems.push(`${seed.collection}/${seed.docId}: ${p}`);
    }
  }
  return problems;
}

/** Convert seed payload values for Firestore: ISO date strings on the
 * circular config become Timestamps. Everything else is JSON-plain. */
export function nuSeedDocForWrite(seed: NuSeedDoc): Record<string, unknown> {
  const out: Record<string, unknown> = { ...seed.payload };
  if (seed.collection === 'nuCircularConfigs') {
    for (const key of ['applicationStart', 'applicationEnd']) {
      const v = out[key];
      if (typeof v === 'string' && v.length > 0) {
        out[key] = Timestamp.fromDate(new Date(v));
      }
    }
  }
  return out;
}

/** Normalize a value for comparison: Firestore Timestamps become
 * epoch millis; ISO strings become epoch millis; everything else is
 * compared as JSON. */
export function nuSeedValueKey(value: unknown): string {
  if (value instanceof Timestamp) return `ts:${value.toMillis()}`;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const ms = new Date(value).getTime();
    if (Number.isFinite(ms)) return `ts:${ms}`;
  }
  return JSON.stringify(value);
}

/** Deep-compare a live doc against its seed payload (timestamps
 * compared by millis, key order ignored). */
export function nuSeedDocMatches(live: Record<string, unknown> | null, seed: NuSeedDoc): boolean {
  if (live == null) return false;
  const expected = nuSeedDocForWrite(seed);
  const liveKeys = Object.keys(live).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (liveKeys.length !== expectedKeys.length) return false;
  for (const k of expectedKeys) {
    if (!liveKeys.includes(k)) return false;
    if (nuSeedValueKey(live[k]) !== nuSeedValueKey(expected[k])) return false;
  }
  return true;
}

export type NuSeedDocStatus = 'matches' | 'differs' | 'missing' | 'unreadable';

export interface NuSeedStatusRow {
  collection: string;
  docId: string;
  status: NuSeedDocStatus;
}

/**
 * Apply the whole seed set (Owner/Admin only — the rules enforce it).
 * Validates everything BEFORE writing anything. Returns the per-doc
 * read-back status after the write. Throws on validation failure or
 * on any write/audit failure — the caller shows the error and nothing
 * is reported as applied.
 */
export async function applyNuSeedDocs(db: Firestore): Promise<NuSeedStatusRow[]> {
  const seeds = nuSeedDocs();
  const problems = validateNuSeedSet(seeds);
  if (problems.length > 0) {
    throw new Error(`nu-seed-invalid: ${problems.join(' | ')}`);
  }
  for (const seed of seeds) {
    await setDoc(doc(db, seed.collection, seed.docId), nuSeedDocForWrite(seed));
  }
  await logAdminAction(
    db,
    NU_STRUCTURE_APPLY_ACTION,
    `NU structure seed applied: ${seeds.length} docs (nuInstitutions 1, nuGroups 3, nuExamConfigs 2, nuCircularConfigs 1) — circular nu-2025-26, config nu-2025-26-v1`,
    'nu-structure-seed',
  );
  return checkNuSeedStatus(db);
}

/** Read every seed doc back and compare it to the seed payload. */
export async function checkNuSeedStatus(db: Firestore): Promise<NuSeedStatusRow[]> {
  const rows: NuSeedStatusRow[] = [];
  for (const seed of nuSeedDocs()) {
    try {
      const snap = await getDoc(doc(db, seed.collection, seed.docId));
      if (!snap.exists()) {
        rows.push({ collection: seed.collection, docId: seed.docId, status: 'missing' });
      } else {
        rows.push({
          collection: seed.collection,
          docId: seed.docId,
          status: nuSeedDocMatches(snap.data() as Record<string, unknown>, seed) ? 'matches' : 'differs',
        });
      }
    } catch {
      rows.push({ collection: seed.collection, docId: seed.docId, status: 'unreadable' });
    }
  }
  return rows;
}

/**
 * Read the live NU structure docs (admin page verification display
 * ONLY — the hub UI never calls this; see the module header and
 * lib/nuStructure.ts). Returns the raw docs keyed by collection/docId,
 * or null for docs that do not exist.
 */
export async function readNuStructure(
  db: Firestore,
): Promise<Record<string, Record<string, unknown> | null>> {
  const out: Record<string, Record<string, unknown> | null> = {};
  for (const seed of nuSeedDocs()) {
    const key = `${seed.collection}/${seed.docId}`;
    try {
      const snap = await getDoc(doc(db, seed.collection, seed.docId));
      out[key] = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    } catch {
      out[key] = null;
    }
  }
  return out;
}
