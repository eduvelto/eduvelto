// Eduvelto — circularHistory (Step 15): the per-field audit
// trail for circulars (ChatGPT's circularHistory; Gemini's
// subcollection auditLogs ADAPTED to this top-level collection so
// the admin queue can read recent changes across ALL circulars in
// one query).
//
// One doc per sensitive change, append-only: never updated, never
// deleted (the rules enforce that). The admin-action audit (who
// approved / published / returned) already lives in adminActions
// (job-content-* actions, zero new rules); this collection is the
// FIELD-level trail — what changed, old → new, from which source,
// and why (note).
//
// DEPLOY-BLOCKED: this collection's rules are written and
// emulator-verified in this step but cannot deploy until the
// public-ID rules refactor frees ~4,992 compiled bytes (see
// firestore.rules). Until then, writes are denied by the live
// rules and jobAdminCirculars.ts treats a failed history write
// as "pending" (the admin action still completes; the
// adminActions entry is the audit that landed).

import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';

export type CircularHistoryField =
  | 'applicationDeadline'
  | 'officialUrl'
  | 'applyUrl'
  | 'totalPosts'
  | 'reviewStatus'
  | 'examDate'
  | 'applicationStartDate'
  // Duplicate / relationship records (ChatGPT: store duplicate
  // relationships explicitly — never auto-delete either record).
  // newValue carries the related circular's doc ID.
  | 'duplicateOf'
  | 'correctionOf'
  | 'extensionOf'
  | 'relatedTo';

export interface CircularHistoryEntry {
  docId: string;
  circularId: string;
  fieldChanged: CircularHistoryField;
  previousValue: string | null;
  newValue: string | null;
  sourceId: string | null;
  changedBy: string;
  changedAtMillis: number | null;
  note: string | null;
}

export interface NewCircularHistoryEntry {
  circularId: string;
  fieldChanged: CircularHistoryField;
  previousValue: string | null;
  newValue: string | null;
  /** Official source document / notice behind the change. */
  sourceId: string | null;
  changedBy: string;
  note: string | null;
}

export function circularHistoryFromStored(docId: string, data: Record<string, unknown>): CircularHistoryEntry | null {
  if (typeof data.circularId !== 'string' || data.circularId.length === 0) return null;
  if (typeof data.fieldChanged !== 'string') return null;
  if (typeof data.changedBy !== 'string' || data.changedBy.length === 0) return null;
  const toMillis = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'object') {
      const o = v as { toMillis?: unknown; seconds?: unknown };
      if (typeof o.toMillis === 'function') {
        const m = (o as { toMillis(): unknown }).toMillis();
        return typeof m === 'number' ? m : null;
      }
      if (typeof o.seconds === 'number') return (o.seconds as number) * 1000;
    }
    return null;
  };
  return {
    docId,
    circularId: data.circularId as string,
    fieldChanged: data.fieldChanged as CircularHistoryField,
    previousValue: (data.previousValue as string | null) ?? null,
    newValue: (data.newValue as string | null) ?? null,
    sourceId: (data.sourceId as string | null) ?? null,
    changedBy: data.changedBy as string,
    changedAtMillis: toMillis(data.changedAt),
    note: (data.note as string | null) ?? null,
  };
}

/** Validate a history entry client-side (mirrors the rules
 * allowlist + field enum). Returns problem strings. */
export function validateCircularHistoryEntry(data: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const allowed = ['circularId', 'fieldChanged', 'previousValue', 'newValue', 'sourceId', 'changedBy', 'changedAt', 'note'];
  for (const k of Object.keys(data)) {
    if (!allowed.includes(k)) problems.push(`circularHistory: unexpected key '${k}'`);
  }
  const fields: string[] = [
    'applicationDeadline', 'officialUrl', 'applyUrl', 'totalPosts', 'reviewStatus',
    'examDate', 'applicationStartDate', 'duplicateOf', 'correctionOf', 'extensionOf', 'relatedTo',
  ];
  if (typeof data.fieldChanged !== 'string' || !fields.includes(data.fieldChanged as string)) {
    problems.push('circularHistory: fieldChanged must be one of the audited fields');
  }
  if (typeof data.circularId !== 'string' || (data.circularId as string).length === 0) {
    problems.push('circularHistory: circularId must be a non-empty string');
  }
  if (typeof data.changedBy !== 'string' || (data.changedBy as string).length === 0) {
    problems.push('circularHistory: changedBy must be a non-empty string');
  }
  if (data.note !== null && data.note !== undefined && typeof data.note !== 'string') {
    problems.push('circularHistory: note must be a string or null');
  }
  if (typeof data.note === 'string' && (data.note as string).length > 1000) {
    problems.push('circularHistory: note must be at most 1000 characters');
  }
  return problems;
}

export async function addCircularHistoryEntry(entry: NewCircularHistoryEntry): Promise<string> {
  const firestore = db;
  if (!firestore) throw new Error('Firestore is not available.');
  const data: Record<string, unknown> = {
    circularId: entry.circularId,
    fieldChanged: entry.fieldChanged,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    sourceId: entry.sourceId,
    changedBy: entry.changedBy,
    changedAt: serverTimestamp(),
    note: entry.note,
  };
  const problems = validateCircularHistoryEntry(data);
  if (problems.length > 0) throw new Error(problems[0]);
  const ref = await addDoc(collection(firestore, 'circularHistory'), data);
  return ref.id;
}

/** Newest-first history for one circular (moderator read).
 * Returns [] when the rules are not live yet (denied) — the
 * caller shows the honest "no history yet" state. */
export async function listCircularHistory(circularId: string): Promise<CircularHistoryEntry[]> {
  const firestore = db;
  if (!firestore) return [];
  try {
    const snap = await getDocs(
      query(collection(firestore, 'circularHistory'), where('circularId', '==', circularId), limit(50)),
    );
    const out: CircularHistoryEntry[] = [];
    for (const d of snap.docs) {
      const e = circularHistoryFromStored(d.id, d.data() as Record<string, unknown>);
      if (e !== null) out.push(e);
    }
    out.sort((a, b) => (b.changedAtMillis ?? -1) - (a.changedAtMillis ?? -1));
    return out;
  } catch {
    return [];
  }
}
