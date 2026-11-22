// Eduvelto — Step 15 circular history unit tests.
//
// The history record is append-only: the validator rejects any
// entry without a field, a changed-by uid, or a circular id —
// and the rules deny updates/deletes on the collection entirely.
// The stored shape carries `changedAt` (a timestamp), not
// `changedAtMillis` — the client converts it on read.

import { describe, expect, it } from 'vitest';
import { validateCircularHistoryEntry } from '../jobCircularHistory';

function validEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    circularId: 'c1',
    fieldChanged: 'applicationDeadline',
    previousValue: '2026-12-15',
    newValue: '2026-12-20',
    sourceId: 'https://bpsc.gov.bd/notice/47b',
    changedBy: 'admin-1',
    changedAt: { seconds: 1765000000, nanoseconds: 0 },
    note: 'সময় বৃদ্ধির বিজ্ঞপ্তি',
    ...overrides,
  };
}

describe('validateCircularHistoryEntry', () => {
  it('a complete deadline-change entry is valid', () => {
    expect(validateCircularHistoryEntry(validEntry())).toHaveLength(0);
  });

  it('rejects a missing actor and a missing circular id', () => {
    const problems = validateCircularHistoryEntry(validEntry({ changedBy: '', circularId: '' }));
    expect(problems.length).toBe(2);
  });

  it('rejects an unknown field name', () => {
    const problems = validateCircularHistoryEntry(validEntry({ fieldChanged: 'madeUpField' }));
    expect(problems.length).toBe(1);
    expect(problems[0]).toMatch(/fieldChanged/);
  });

  it('rejects a note over 1000 characters and an unexpected key', () => {
    const problems = validateCircularHistoryEntry(validEntry({ note: 'x'.repeat(1001), changedAtMillis: 1 }));
    expect(problems.length).toBe(2);
    expect(problems.some((p) => p.includes('1000'))).toBe(true);
    expect(problems.some((p) => p.includes('changedAtMillis'))).toBe(true);
  });
});
