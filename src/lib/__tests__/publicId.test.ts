// Unit tests for the public user IDs (owner order 22 Nov 2026):
// format/parse round-trip + the backfill assignment (registration
// order, smallest unused numbers, counter seed). No Firestore, no
// emulator — pure functions only.
import { describe, expect, it } from 'vitest';
import {
  assignMissingPublicIds,
  formatPublicId,
  parsePublicId,
  PUBLIC_ID_COUNTER_DOC_ID,
  PUBLIC_ID_PREFIX,
} from '../publicId';

describe('formatPublicId', () => {
  it('pads to 4 digits from 1', () => {
    expect(formatPublicId(1)).toBe('eduvelto0001');
    expect(formatPublicId(2)).toBe('eduvelto0002');
    expect(formatPublicId(42)).toBe('eduvelto0042');
    expect(formatPublicId(999)).toBe('eduvelto0999');
    expect(formatPublicId(1234)).toBe('eduvelto1234');
  });
  it('grows past 9999 without truncation', () => {
    expect(formatPublicId(10000)).toBe('eduvelto10000');
  });
});

describe('parsePublicId', () => {
  it('parses the canonical form', () => {
    expect(parsePublicId('eduvelto0001')).toBe(1);
    expect(parsePublicId('eduvelto0042')).toBe(42);
    expect(parsePublicId('eduvelto1234')).toBe(1234);
    expect(parsePublicId('eduvelto10000')).toBe(10000);
  });
  it('rejects non-canonical forms', () => {
    expect(parsePublicId('eduvelto01')).toBeNull(); // too short
    expect(parsePublicId('eduvelto00001')).toBeNull(); // too long for 1
    expect(parsePublicId('eduvelto0000')).toBeNull(); // zero is not a user
    expect(parsePublicId('EDUVELTO0001')).toBeNull();
    expect(parsePublicId('eduvelto')).toBeNull();
    expect(parsePublicId('eduveltoabcd')).toBeNull();
    expect(parsePublicId('')).toBeNull();
    expect(parsePublicId('eduvelto0001 ')).toBeNull();
  });
  it('round-trips through format', () => {
    for (const n of [1, 2, 9, 10, 99, 100, 999, 1000, 9999, 10000]) {
      expect(parsePublicId(formatPublicId(n))).toBe(n);
    }
  });
});

describe('assignMissingPublicIds', () => {
  it('assigns in registration order, owner first', () => {
    const { assignments, next } = assignMissingPublicIds([
      { uid: 'u3', createdAtMillis: 3000 },
      { uid: 'u1', createdAtMillis: 1000 },
      { uid: 'u2', createdAtMillis: 2000 },
      { uid: 'u4', createdAtMillis: 4000 },
    ]);
    expect(assignments).toEqual([
      { uid: 'u1', publicIdNumber: 1 },
      { uid: 'u2', publicIdNumber: 2 },
      { uid: 'u3', publicIdNumber: 3 },
      { uid: 'u4', publicIdNumber: 4 },
    ]);
    expect(next).toBe(5);
  });
  it('keeps existing numbers and fills the smallest gaps', () => {
    const { assignments, next } = assignMissingPublicIds([
      { uid: 'u1', createdAtMillis: 1000, publicIdNumber: 1 },
      { uid: 'u2', createdAtMillis: 2000 },
      { uid: 'u3', createdAtMillis: 3000, publicIdNumber: 5 },
      { uid: 'u4', createdAtMillis: 4000 },
    ]);
    expect(assignments).toEqual([
      { uid: 'u2', publicIdNumber: 2 },
      { uid: 'u4', publicIdNumber: 3 },
    ]);
    expect(next).toBe(6);
  });
  it('puts users without createdAt last, uid order', () => {
    const { assignments } = assignMissingPublicIds([
      { uid: 'u-b', createdAtMillis: null },
      { uid: 'u1', createdAtMillis: 1000 },
      { uid: 'u-a', createdAtMillis: null },
    ]);
    expect(assignments).toEqual([
      { uid: 'u1', publicIdNumber: 1 },
      { uid: 'u-a', publicIdNumber: 2 },
      { uid: 'u-b', publicIdNumber: 3 },
    ]);
  });
  it('returns next=1 with no users and no assignments when all have numbers', () => {
    expect(assignMissingPublicIds([])).toEqual({ assignments: [], next: 1 });
    const done = assignMissingPublicIds([
      { uid: 'u1', createdAtMillis: 1000, publicIdNumber: 1 },
      { uid: 'u2', createdAtMillis: 2000, publicIdNumber: 2 },
    ]);
    expect(done).toEqual({ assignments: [], next: 3 });
  });
  it('ignores invalid existing numbers (0, negative, non-integer)', () => {
    const { assignments, next } = assignMissingPublicIds([
      { uid: 'u1', createdAtMillis: 1000, publicIdNumber: 0 },
      { uid: 'u2', createdAtMillis: 2000, publicIdNumber: -3 },
      { uid: 'u3', createdAtMillis: 3000, publicIdNumber: 2.5 },
    ]);
    expect(assignments).toEqual([
      { uid: 'u1', publicIdNumber: 1 },
      { uid: 'u2', publicIdNumber: 2 },
      { uid: 'u3', publicIdNumber: 3 },
    ]);
    expect(next).toBe(4);
  });
});

describe('counter identity', () => {
  it('uses the documented counter document', () => {
    expect(PUBLIC_ID_PREFIX).toBe('eduvelto');
    expect(PUBLIC_ID_COUNTER_DOC_ID).toBe('publicUserIds');
  });
});
