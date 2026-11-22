// Eduvelto — unit tests for the auth-gating helpers (src/lib/gating.ts).
// Pure functions only: no Firebase, no emulator. Run with:
//   npx vitest run src/lib/gating.test.ts
import { describe, expect, it } from 'vitest';
import {
  canGuestReadChapter,
  canGuestReadLesson,
  isPermissionDeniedError,
  isPreviewDoc,
  loginWallCopy,
  type LoginWallKind,
} from './gating';

const KINDS: LoginWallKind[] = ['exam', 'result', 'chapter', 'lesson'];

describe('loginWallCopy', () => {
  it.each(KINDS)('kind %s has Bangla + English copy', (kind) => {
    const c = loginWallCopy(kind);
    expect(c.titleBn.length).toBeGreaterThan(0);
    expect(c.bodyBn.length).toBeGreaterThan(0);
    expect(c.titleEn.length).toBeGreaterThan(0);
    expect(c.bodyEn.length).toBeGreaterThan(0);
    // The wall always tells the visitor to sign in.
    expect(c.titleBn).toContain('লগইন');
    expect(c.bodyBn).toContain('লগইন');
  });

  it('exam wall says there is no guest exam', () => {
    const c = loginWallCopy('exam');
    expect(c.bodyBn).toContain('অতিথি হিসেবে পরীক্ষা দেওয়ার ব্যবস্থা নেই');
  });

  it('chapter/lesson walls mention the free preview chapter', () => {
    for (const kind of ['chapter', 'lesson'] as const) {
      expect(loginWallCopy(kind).bodyBn).toContain('প্রথম পাঠটি অতিথি হিসেবে পড়া যায়');
    }
  });
});

describe('isPreviewDoc', () => {
  it('is true only for an explicit isPreview === true', () => {
    expect(isPreviewDoc({ isPreview: true })).toBe(true);
  });

  it('is false for a missing field (every live chapter/lesson today)', () => {
    expect(isPreviewDoc({})).toBe(false);
    expect(isPreviewDoc(null)).toBe(false);
    expect(isPreviewDoc(undefined)).toBe(false);
  });

  it('is false for truthy non-true values (no loose truthiness)', () => {
    expect(isPreviewDoc({ isPreview: 1 })).toBe(false);
    expect(isPreviewDoc({ isPreview: 'true' })).toBe(false);
    expect(isPreviewDoc({ isPreview: false })).toBe(false);
  });
});

describe('canGuestReadChapter / canGuestReadLesson', () => {
  it('guests read preview chapters and lessons only', () => {
    expect(canGuestReadChapter({ isPreview: true })).toBe(true);
    expect(canGuestReadChapter({})).toBe(false);
    expect(canGuestReadLesson({ isPreview: true })).toBe(true);
    expect(canGuestReadLesson({})).toBe(false);
  });
});

describe('isPermissionDeniedError', () => {
  it('recognises a Firestore permission-denied error', () => {
    expect(isPermissionDeniedError({ code: 'permission-denied' })).toBe(true);
    expect(isPermissionDeniedError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' })).toBe(true);
  });

  it('rejects other failures (they are real errors, not the wall)', () => {
    expect(isPermissionDeniedError({ code: 'not-found' })).toBe(false);
    expect(isPermissionDeniedError({ code: 'unavailable' })).toBe(false);
    expect(isPermissionDeniedError(new Error('boom'))).toBe(false);
    expect(isPermissionDeniedError(null)).toBe(false);
    expect(isPermissionDeniedError(undefined)).toBe(false);
  });
});
