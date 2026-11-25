// National Live Exam merit list — pure tests (no Firestore).
// The snapshot read itself is one getDoc on the already
// public-read leaderboardSnapshots collection; ranking +
// parsing are pure and tested here.
import { describe, expect, it } from 'vitest';
import {
  LIVE_MERIT_COLLECTION,
  LIVE_MERIT_KIND,
  formatMeritTime,
  liveMeritDocId,
  parseLiveMeritSnapshot,
  rankLiveExamEntries,
} from '../liveExamMerit';

describe('liveMeritDocId', () => {
  it('reuses leaderboardSnapshots with a liveMerit- prefix', () => {
    expect(LIVE_MERIT_COLLECTION).toBe('leaderboardSnapshots');
    expect(liveMeritDocId('daily__2026-11-26')).toBe('liveMerit-daily__2026-11-26');
  });

  it('refuses an unsafe exam id instead of building a bad doc path', () => {
    expect(() => liveMeritDocId('../x')).toThrow(/unsafe examId/);
    expect(() => liveMeritDocId('a/b')).toThrow(/unsafe examId/);
    expect(() => liveMeritDocId('')).toThrow(/unsafe examId/);
  });
});

describe('rankLiveExamEntries — competition ranking', () => {
  it('sorts by score desc, then faster time, and shares ranks on equal score+time', () => {
    const ranked = rankLiveExamEntries([
      { name: 'রহিম', score: 80, totalMarks: 100, timeSeconds: 1500 },
      { name: 'করিম', score: 90, totalMarks: 100, timeSeconds: 1700 },
      { name: 'সালমা', score: 90, totalMarks: 100, timeSeconds: 1500 },
      { name: 'জামাল', score: 90, totalMarks: 100, timeSeconds: 1500 },
      { name: 'নিলা', score: 70, totalMarks: 100, timeSeconds: 900 },
    ]);
    // Equal score + equal time share rank 1; display order inside
    // the tie is Bangla alphabetical (জামাল before সালমা).
    expect(ranked.map((e) => [e.name, e.score, e.timeSeconds, e.rank])).toEqual([
      ['জামাল', 90, 1500, 1],
      ['সালমা', 90, 1500, 1],
      ['করিম', 90, 1700, 3],
      ['রহিম', 80, 1500, 4],
      ['নিলা', 70, 900, 5],
    ]);
  });

  it('puts an unrecorded time last on equal scores, and drops invalid rows', () => {
    const ranked = rankLiveExamEntries([
      { name: 'ক', score: 50, timeSeconds: null },
      { name: 'খ', score: 50, timeSeconds: 600 },
      { name: '', score: 99 },
      { name: 'গ', score: -1 },
      { name: 'ঘ', score: Number.NaN },
      { name: 'ঙ', score: 40, timeSeconds: -5 },
    ]);
    expect(ranked.map((e) => e.name)).toEqual(['খ', 'ক']);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it('keeps totalMarks/time nullable and trims names', () => {
    const [entry] = rankLiveExamEntries([{ name: '  মিতা  ', score: 10 }]);
    expect(entry).toMatchObject({ name: 'মিতা', rank: 1, totalMarks: null, timeSeconds: null });
  });
});

describe('parseLiveMeritSnapshot', () => {
  it('parses a liveMerit doc and re-ranks its entries (stored rank is not trusted)', () => {
    const list = parseLiveMeritSnapshot('daily__2026-11-26', {
      kind: LIVE_MERIT_KIND,
      entries: [
        { name: 'করিম', score: 80, totalMarks: 100, timeSeconds: 1500, rank: 1 },
        { name: 'রহিম', score: 90, totalMarks: 100, timeSeconds: 1500, rank: 2 },
      ],
      updatedAt: '2026-11-26T12:00:00.000Z',
    })!;
    expect(list.examId).toBe('daily__2026-11-26');
    expect(list.entries.map((e) => [e.name, e.rank])).toEqual([
      ['রহিম', 1],
      ['করিম', 2],
    ]);
    expect(list.updatedAtMillis).toBe(Date.parse('2026-11-26T12:00:00.000Z'));
  });

  it('accepts a Firestore-Timestamp-like updatedAt', () => {
    const list = parseLiveMeritSnapshot('x', {
      kind: 'liveMerit',
      entries: [{ name: 'ক', score: 1 }],
      updatedAt: { toDate: () => new Date('2026-11-26T10:00:00.000Z') },
    })!;
    expect(list.updatedAtMillis).toBe(Date.parse('2026-11-26T10:00:00.000Z'));
  });

  it('returns null for a classStats doc, a missing doc, or no usable entries', () => {
    expect(parseLiveMeritSnapshot('x', { kind: 'classStats', entries: [{ name: 'ক', score: 1 }] })).toBeNull();
    expect(parseLiveMeritSnapshot('x', null)).toBeNull();
    expect(
      parseLiveMeritSnapshot('x', { kind: 'liveMerit', entries: [{ name: '', score: 1 }] }),
    ).toBeNull();
    expect(parseLiveMeritSnapshot('x', { kind: 'liveMerit' })).toBeNull();
  });
});

describe('formatMeritTime', () => {
  it('renders mm:ss in Bangla and English, and — with no time', () => {
    expect(formatMeritTime(754, 'bn')).toBe('১২:৩৪');
    expect(formatMeritTime(754, 'en')).toBe('12:34');
    expect(formatMeritTime(null, 'bn')).toBe('—');
  });
});
