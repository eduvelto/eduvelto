// Eduvelto — referral leaderboard sort unit tests (28 Nov 2026).
//
// Proves sortReferralsByCount ranks by visitor count desc, ties by
// most recent visit, then by code — the same ordering the Firestore
// query (orderBy count desc) returns. Run with `npm run test:unit`.
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { sortReferralsByCount, type ReferralRow } from '../referralLeaderboard';

const row = (code: string, count: number, lastSeenMs: number | null): ReferralRow => ({
  code,
  name: code,
  count,
  lastSeen: lastSeenMs === null ? null : Timestamp.fromMillis(lastSeenMs),
});

describe('sortReferralsByCount', () => {
  it('ranks highest visitor count first', () => {
    const out = sortReferralsByCount([
      row('AAAAAA', 2, 1000),
      row('BBBBBB', 9, 1000),
      row('CCCCCC', 5, 1000),
    ]);
    expect(out.map((r) => r.code)).toEqual(['BBBBBB', 'CCCCCC', 'AAAAAA']);
  });

  it('breaks count ties by most recent visit, then by code', () => {
    const out = sortReferralsByCount([
      row('BBBBBB', 5, 1000),
      row('AAAAAA', 5, 2000),
      row('CCCCCC', 5, 2000),
    ]);
    expect(out.map((r) => r.code)).toEqual(['AAAAAA', 'CCCCCC', 'BBBBBB']);
  });

  it('does not mutate the input and handles an empty list', () => {
    const input = [row('AAAAAA', 1, 1000)];
    expect(sortReferralsByCount(input)).not.toBe(input);
    expect(sortReferralsByCount([])).toEqual([]);
  });
});
