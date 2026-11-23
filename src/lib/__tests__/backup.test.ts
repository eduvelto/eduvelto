// Eduvelto — Backup / recovery (Step 18) unit tests.
//
// Coverage drift, backup-format validation, the friendlyAdminError
// known gap, UI safety invariants, and scripted-exporter parity.
//
// The emulator round-trip / authorization / pagination tests live in
// emulator-tests/backup-roundtrip.test.ts — this file covers only
// what is provable without Firestore.
//
// Run with `npm run test:unit`.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BACKUP_CLIENT_UNREADABLE,
  BACKUP_COLLECTIONS,
  BACKUP_EXCLUSIONS,
  BACKUP_KNOWN_PENDING,
  BACKUP_SINGLE_FILE_MAX_DOCS,
  BACKUP_VERSION,
  downloadBackup,
  validateBackup,
  type BackupFile,
} from '../backup';
import { friendlyAdminError } from '../admin';

const RULES_TEXT = readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8');
const ADMIN_BACKUP_PAGE = readFileSync(
  resolve(__dirname, '../../pages/AdminBackupPage.tsx'),
  'utf8',
);
const REST_EXPORTER_PATH = resolve(
  process.env.HOME ?? '~',
  'workspace/eduorbit/backups/export-full-rest.mjs',
);

/** Top-level collection matches in firestore.rules (first path segment). */
function rulesCollections(): Set<string> {
  const out = new Set<string>();
  for (const m of RULES_TEXT.matchAll(/^    match \/([A-Za-z]+)\/\{/gm)) out.add(m[1]);
  return out;
}

function makeValidFile(overrides: Partial<BackupFile> = {}): BackupFile {
  return {
    metadata: {
      app: 'Eduvelto',
      backupVersion: BACKUP_VERSION,
      exportedAt: new Date('2026-11-23T00:00:00.000Z').toISOString(),
      exportedBy: 'owner-uid',
      collections: { notices: 2, circulars: 0 },
      subcollectionsIncluded: false,
    },
    data: {
      notices: [
        { id: 'n1', title: 'Notice one', body: 'Body one', reviewStatus: 'Under Review' },
        { id: 'n2', title: 'Notice two', body: 'Body two', reviewStatus: 'Under Review' },
      ],
      circulars: [],
    },
    ...overrides,
  };
}

describe('Step 18 — BACKUP_COLLECTIONS coverage drift', () => {
  it('every rules collection is backed up or explicitly excluded (BRT-08)', () => {
    const rules = rulesCollections();
    expect(rules.size).toBeGreaterThan(50);
    const covered = new Set([...BACKUP_COLLECTIONS, ...Object.keys(BACKUP_EXCLUSIONS)]);
    const missing = [...rules].filter((c) => !covered.has(c)).sort();
    expect(missing).toEqual([]);
  });

  it('every list entry is a real rules collection — except settings (BRT-08)', () => {
    // settings has no collection-level match: only the single-doc
    // matches /settings/features and /settings/ads exist, so it is
    // exported doc-by-doc (see backup.ts DOC_BY_DOC). Any other
    // stale entry here is a bug, not a feature.
    const rules = rulesCollections();
    const stale = BACKUP_COLLECTIONS.filter((c) => c !== 'settings' && !rules.has(c)).sort();
    expect(stale).toEqual([]);
  });

  it('the list has no duplicates and no overlap with the exclusions', () => {
    expect(new Set(BACKUP_COLLECTIONS).size).toBe(BACKUP_COLLECTIONS.length);
    const overlap = BACKUP_COLLECTIONS.filter((c) => c in BACKUP_EXCLUSIONS);
    expect(overlap).toEqual([]);
  });

  it('every exclusion carries a reason (no bare names)', () => {
    for (const [name, reason] of Object.entries(BACKUP_EXCLUSIONS)) {
      expect(reason.length, `exclusion ${name} needs a reason`).toBeGreaterThan(20);
    }
  });

  it('KNOWN_PENDING entries are still absent — the note cannot go stale', () => {
    // When the owning branch merges (Step 15 admin, public user IDs),
    // it must move the name into BACKUP_COLLECTIONS and delete it here,
    // or this test goes red. That is the forcing function, by design.
    for (const name of Object.keys(BACKUP_KNOWN_PENDING)) {
      expect(BACKUP_COLLECTIONS, `${name} merged but still listed as pending`).not.toContain(name);
      expect(BACKUP_KNOWN_PENDING[name].length).toBeGreaterThan(20);
    }
  });
});

describe('Step 18 — validateBackup() fixtures (BRT-06, BRT-07)', () => {
  it('accepts a well-formed file', () => {
    const v = validateBackup(makeValidFile());
    expect(v).toEqual({ ok: true, errors: [] });
  });

  it('rejects a non-object file', () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup('not json').ok).toBe(false);
    expect(validateBackup([]).ok).toBe(false);
  });

  it('rejects an empty file', () => {
    const v = validateBackup({});
    expect(v.ok).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it('rejects a wrong app marker', () => {
    const f = makeValidFile();
    f.metadata.app = 'OtherApp' as never;
    const v = validateBackup(f);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toContain('Eduvelto');
  });

  it('rejects a missing or unsupported version', () => {
    const missing = makeValidFile();
    delete (missing.metadata as Partial<typeof missing.metadata>).backupVersion;
    expect(validateBackup(missing).ok).toBe(false);
    const wrong = makeValidFile();
    wrong.metadata.backupVersion = 99;
    const v = validateBackup(wrong);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toContain('Unsupported backupVersion');
  });

  it('rejects a missing or invalid exportedAt', () => {
    const f = makeValidFile();
    f.metadata.exportedAt = 'not-a-date';
    expect(validateBackup(f).ok).toBe(false);
  });

  it('rejects a missing collections header and missing data', () => {
    const f = makeValidFile();
    delete (f.metadata as Partial<typeof f.metadata>).collections;
    expect(validateBackup(f).ok).toBe(false);
    const g = makeValidFile();
    delete (g as Partial<BackupFile>).data;
    expect(validateBackup(g).ok).toBe(false);
  });

  it('rejects a header count that does not match the file (truncated doc array)', () => {
    const f = makeValidFile();
    f.metadata.collections.notices = 3; // file holds 2 — one doc lost
    const v = validateBackup(f);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toContain('notices');
  });

  it('rejects duplicate doc ids inside a collection', () => {
    const f = makeValidFile();
    f.data.notices.push({ id: 'n1', title: 'Dupe', body: 'x', reviewStatus: 'Under Review' });
    f.metadata.collections.notices = 3;
    const v = validateBackup(f);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toContain('duplicate');
  });

  it('rejects a document with no valid id', () => {
    const f = makeValidFile();
    (f.data.notices[0] as Record<string, unknown>).id = '';
    const v = validateBackup(f);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toContain('no valid id');
  });

  it('rejects an unknown collection in the header and in the data', () => {
    const f = makeValidFile();
    f.metadata.collections.evilCollection = 1;
    f.data.evilCollection = [{ id: 'e1' }];
    const v = validateBackup(f);
    expect(v.ok).toBe(false);
    expect(v.errors.join(' ')).toContain('evilCollection');
  });

  it('rejects a file whose data is not an object', () => {
    const v = validateBackup({ metadata: makeValidFile().metadata, data: 'nope' });
    expect(v.ok).toBe(false);
  });
});

describe('Step 18 — downloadBackup() file splitting', () => {
  const created: Array<{ href: string; download: string }> = [];
  const origDocument = (globalThis as Record<string, unknown>).document;
  const origCreateObjectURL = URL.createObjectURL.bind(URL);
  const origRevokeObjectURL = URL.revokeObjectURL.bind(URL);

  afterEach(() => {
    (globalThis as Record<string, unknown>).document = origDocument;
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
    created.length = 0;
  });

  function stubDom() {
    (globalThis as Record<string, unknown>).document = {
      createElement: () => {
        const el: Record<string, unknown> = {
          click: () => created.push({ href: el.href as string, download: el.download as string }),
        };
        return el;
      },
    };
    URL.createObjectURL = () => 'blob:fake';
    URL.revokeObjectURL = () => undefined;
  }

  it(`a file up to ${BACKUP_SINGLE_FILE_MAX_DOCS} docs downloads as one file`, () => {
    stubDom();
    const f = makeValidFile();
    downloadBackup(f);
    expect(created).toHaveLength(1);
    expect(created[0].download).toContain('2docs.json');
  });

  it(`a file over ${BACKUP_SINGLE_FILE_MAX_DOCS} docs downloads one file per collection`, () => {
    stubDom();
    const many = Array.from({ length: BACKUP_SINGLE_FILE_MAX_DOCS + 1 }, (_, i) => ({
      id: `n${i}`,
      title: 't',
      body: 'b',
      reviewStatus: 'Under Review',
    }));
    const f = makeValidFile({
      metadata: {
        ...makeValidFile().metadata,
        collections: { notices: many.length, circulars: 0 },
      },
      data: { notices: many, circulars: [] },
    });
    downloadBackup(f);
    expect(created).toHaveLength(2);
    expect(created.map((c) => c.download).join(' ')).toContain('notices');
    expect(created.map((c) => c.download).join(' ')).toContain('circulars');
  });
});

describe('Step 18 — friendlyAdminError known gap (NOT fixed here)', () => {
  it('a real FirebaseError shows the generic text, not the permission-denied text', () => {
    // KNOWN GAP (Step 18 finding F-1): the function matches on
    // error.message, but a FirebaseError carries the machine code in
    // error.code ('permission-denied') and a human sentence in
    // .message ('Missing or insufficient permissions.'). The
    // 'permission-denied' entry in the map is therefore dead for real
    // Firebase errors — the owner sees "কিছু একটা ভুল হয়েছে।" for a
    // quota/permission failure. Fix (follow-up): prefer error.code.
    const err = Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied',
    });
    const text = friendlyAdminError(err, 'bn');
    expect(text).toContain('কিছু একটা ভুল হয়েছে');
    expect(text).not.toContain('অনুমতি');
  });

  it('an error thrown with the exact message string does match the map', () => {
    // Proves the map itself works — only the lookup key is wrong.
    expect(friendlyAdminError(new Error('permission-denied'), 'bn')).toContain('অনুমতি');
  });
});

describe('Step 18 — UI safety invariants (static source checks, BRT-10)', () => {
  it('the Backup page has no restore button or restore handler', () => {
    expect(ADMIN_BACKUP_PAGE).not.toContain('restoreBackup');
    expect(ADMIN_BACKUP_PAGE).not.toContain('onClick={() => void runRestore');
    expect(ADMIN_BACKUP_PAGE).toContain('Restore বোতাম নেই');
    expect(ADMIN_BACKUP_PAGE).toContain('no Restore button');
  });

  it('export requires Step 1 preflight first', () => {
    expect(ADMIN_BACKUP_PAGE).toContain('if (!preflight) return;');
  });

  it('an over-half export requires typing EXPORT (overHalf gate)', () => {
    expect(ADMIN_BACKUP_PAGE).toContain("typedConfirm.trim().toUpperCase() === 'EXPORT'");
    expect(ADMIN_BACKUP_PAGE).toContain('readsPercent > 50');
    expect(ADMIN_BACKUP_PAGE).toContain('disabled={exporting || !typedOk}');
  });

  it('the page states the sub-collection limit honestly', () => {
    expect(ADMIN_BACKUP_PAGE).toContain('সাব-সংগ্রহ');
    expect(ADMIN_BACKUP_PAGE).toContain('NOT in this file');
  });
});

describe('Step 18 — scripted REST exporter parity (BRT-11)', () => {
  it('the script exports exactly BACKUP_COLLECTIONS + the client-unreadable ones — no drift', () => {
    const script = readFileSync(REST_EXPORTER_PATH, 'utf8');
    const m = script.match(/const COLLECTIONS = \[([\s\S]*?)\];/);
    expect(m, 'COLLECTIONS list not found in export-full-rest.mjs').not.toBeNull();
    const block = (m as RegExpMatchArray)[1]
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    const scriptList = [...block.matchAll(/'([A-Za-z]+)'/g)].map((x) => x[1]);
    // The script reads with the owner CLI token (rules bypassed), so it
    // also covers the two collections the client cannot list-read
    // (follows, directMessages) — and nothing else. The ephemeral
    // receipts/locks stay out of both lists.
    const expected = [...BACKUP_COLLECTIONS, ...BACKUP_CLIENT_UNREADABLE];
    expect([...scriptList].sort()).toEqual([...expected].sort());
  });

  it('the script writes the in-app BackupFile format', () => {
    const script = readFileSync(REST_EXPORTER_PATH, 'utf8');
    expect(script).toContain("app: 'Eduvelto'");
    expect(script).toContain('backupVersion: 1');
    expect(script).toContain('subcollectionsIncluded: false');
    expect(script).toContain('collections: counts');
  });

  it('the script decodes REST values with the same __type markers', () => {
    const script = readFileSync(REST_EXPORTER_PATH, 'utf8');
    // Extract the real dec() from the shipped script and run it.
    const start = script.indexOf('function dec(v) {');
    expect(start).toBeGreaterThan(-1);
    let depth = 0;
    let end = -1;
    for (let i = start; i < script.length; i++) {
      if (script[i] === '{') depth++;
      if (script[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    expect(end).toBeGreaterThan(start);
    const dec = new Function(`${script.slice(start, end)}; return dec;`)() as (
      v: unknown,
    ) => unknown;
    expect(dec({ timestampValue: '2026-11-23T00:00:00.000Z' })).toEqual({
      __type: 'timestamp',
      millis: Date.parse('2026-11-23T00:00:00.000Z'),
    });
    expect(dec({ geoPointValue: { latitude: 21.4, longitude: 92.0 } })).toEqual({
      __type: 'geopoint',
      latitude: 21.4,
      longitude: 92.0,
    });
    expect(dec({ integerValue: '42' })).toBe(42);
    expect(dec({ doubleValue: 1.5 })).toBe(1.5);
    expect(dec({ booleanValue: true })).toBe(true);
    expect(dec({ stringValue: 'x' })).toBe('x');
    expect(dec({ nullValue: null })).toBeNull();
    expect(dec({ arrayValue: { values: [{ stringValue: 'a' }, { integerValue: '2' }] } })).toEqual([
      'a',
      2,
    ]);
    expect(dec({ mapValue: { fields: { k: { stringValue: 'v' } } } })).toEqual({ k: 'v' });
    // Reference values survive as markers (reviveValue does NOT revive
    // them — documented parity gap: a restored doc keeps the marker map
    // instead of a DocumentReference. No live doc is known to use
    // reference fields; flagged as a follow-up, not hidden.)
    expect(dec({ referenceValue: 'projects/eduvelto/databases/(default)/documents/users/u1' })).toEqual({
      __type: 'reference',
      path: 'projects/eduvelto/databases/(default)/documents/users/u1',
    });
  });
});
