// Eduvelto — General Mock Exam bundle-cache tests (Day 5).
//
// Covers: cache-key format (bundle id + version), round-trip
// save/load, stale-version invalidation (a republished bundle
// is never served stale), explicit invalidation + full clear,
// and the key guarantee — the cached record holds questions +
// options only, never answer material. Runs in the node test
// environment (no IndexedDB / sessionStorage), so it exercises
// the in-memory fallback backend through the same public API
// the runner uses.

import { describe, it, expect } from 'vitest';
import {
  buildMockBundleCacheRecord,
  clearMockExamCache,
  invalidateMockBundle,
  loadCachedMockBundle,
  mockBundleCacheKey,
  saveMockBundle,
} from '../mockExamCache';

function bundleInput(version = 1) {
  return {
    docId: 'topic__bcs__english',
    bundleVersion: version,
    titleBn: 'ইংরেজি',
    titleEn: 'English',
    examSlug: 'bcs',
    questions: [
      {
        n: 1,
        questionId: 'bcs-eng-001',
        topicId: 'bcs__english__grammar__tense',
        subjectId: 'bcs__english',
        questionText: 'Q1?',
        options: [
          { letter: 'A', text: 'a' },
          { letter: 'B', text: 'b' },
        ],
        difficulty: 'easy',
        // Key material that must NEVER reach the cache, even if a
        // caller hands it over by mistake.
        correctLetter: 'A',
        correctText: 'a',
        explanation: 'because',
        key: { answers: [{ n: 1, correctLetter: 'A' }] },
      },
    ],
  };
}

describe('mockBundleCacheKey', () => {
  it('includes bundle id and version', () => {
    expect(mockBundleCacheKey('topic__bcs__english', 1)).toBe(
      'mock-exam-bundle:topic__bcs__english:v1',
    );
    expect(mockBundleCacheKey('topic__bcs__english', 2)).not.toBe(
      mockBundleCacheKey('topic__bcs__english', 1),
    );
  });
});

describe('buildMockBundleCacheRecord — never stores keys', () => {
  it('strips correctLetter / correctText / explanation / key', () => {
    const record = buildMockBundleCacheRecord(bundleInput());
    expect(record).not.toBeNull();
    const json = JSON.stringify(record);
    expect(json).not.toContain('correctLetter');
    expect(json).not.toContain('correctText');
    expect(json).not.toContain('because');
    expect(json).not.toContain('answers');
    expect(record?.questions[0].questionText).toBe('Q1?');
    expect(record?.questions[0].options).toHaveLength(2);
    expect(record?.cacheKey).toBe('mock-exam-bundle:topic__bcs__english:v1');
  });
  it('returns null when no question is usable', () => {
    expect(buildMockBundleCacheRecord({ ...bundleInput(), questions: [] })).toBeNull();
    expect(
      buildMockBundleCacheRecord({
        ...bundleInput(),
        questions: [{ n: 1, questionId: 'x', questionText: 'Q?', options: [{ letter: 'A', text: 'a' }] }],
      }),
    ).toBeNull();
  });
  it('keeps only well-formed options', () => {
    const record = buildMockBundleCacheRecord({
      ...bundleInput(),
      questions: [
        {
          n: 1,
          questionId: 'q1',
          topicId: 't',
          subjectId: 's',
          questionText: 'Q?',
          options: [
            { letter: 'A', text: 'a' },
            { letter: 'Z', text: 'bad' },
            { letter: 'B', text: 'b' },
          ],
          difficulty: 'easy',
        },
      ],
    });
    expect(record).toBeNull();
  });
});

describe('save/load — re-attempt reuse without re-read', () => {
  it('round-trips the same generation', async () => {
    await clearMockExamCache();
    const record = buildMockBundleCacheRecord(bundleInput(3));
    expect(record).not.toBeNull();
    await saveMockBundle(record!);
    const loaded = await loadCachedMockBundle('topic__bcs__english', 3);
    expect(loaded?.bundleVersion).toBe(3);
    expect(loaded?.questions[0].questionId).toBe('bcs-eng-001');
    expect(loaded?.questions[0]).not.toHaveProperty('correctLetter');
  });
  it('a different version is a miss (stale cache invalidated)', async () => {
    await clearMockExamCache();
    await saveMockBundle(buildMockBundleCacheRecord(bundleInput(1))!);
    expect(await loadCachedMockBundle('topic__bcs__english', 2)).toBeNull();
    // The v1 entry is untouched by the v2 miss.
    expect(await loadCachedMockBundle('topic__bcs__english', 1)).not.toBeNull();
  });
  it('unknown bundle is a miss', async () => {
    await clearMockExamCache();
    expect(await loadCachedMockBundle('topic__nope', 1)).toBeNull();
  });
});

describe('invalidateMockBundle / clearMockExamCache', () => {
  it('drops one generation only', async () => {
    await clearMockExamCache();
    await saveMockBundle(buildMockBundleCacheRecord(bundleInput(1))!);
    await saveMockBundle(buildMockBundleCacheRecord(bundleInput(2))!);
    await invalidateMockBundle('topic__bcs__english', 1);
    expect(await loadCachedMockBundle('topic__bcs__english', 1)).toBeNull();
    expect(await loadCachedMockBundle('topic__bcs__english', 2)).not.toBeNull();
  });
  it('clears everything', async () => {
    await saveMockBundle(buildMockBundleCacheRecord(bundleInput(1))!);
    await clearMockExamCache();
    expect(await loadCachedMockBundle('topic__bcs__english', 1)).toBeNull();
  });
});
