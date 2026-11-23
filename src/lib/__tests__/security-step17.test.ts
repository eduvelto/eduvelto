// Eduvelto — Job Step 17 (Security Testing) unit tests.
//
// These are the parts of Step 17 that do NOT need the Firestore
// emulator: static tripwires that fail loudly if a security-relevant
// invariant regresses in source.
// - BACKUP_COLLECTIONS completeness: every top-level collection the
//   Job admin surface writes must be in the backup list, or a restore
//   silently loses it (the 22 Nov pre-export check already caught the
//   question bank + keys missing; Step 17 catches the Step 15 admin
//   collections the same way). Subcollections are NOT covered here:
//   the backup tool documents subcollectionsIncluded: false —
//   restoring user subcollections (quizAttempts, jobSessions,
//   nuAttempts) is an H4 / Step 18 gap, not a Step 17 one.
// - Google login removal holds: neither LoginPage nor RegisterPage
//   may call signInWithGoogle (the auth.tsx export itself is dead
//   code — no caller — and is left for a cleanup follow-up).
// - CSP fonts: firebase.json style-src must allow fonts.googleapis.com
//   (L5 fix, 22 Nov) so the Bangla fonts actually load.
// - H3 read-budget tripwire: the class dashboard must load books and
//   quizzes through the class-scoped listers (listBooksForClass /
//   listQuizzesForClass), never through an unscoped whole-collection
//   read. The numeric read-count regression lives in
//   emulator-tests/read-usage-measure.test.ts; this test is the
//   cheap static guard that the listers are still wired in.
// Run with `npm run test:unit`.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BACKUP_COLLECTIONS } from '../backup';

const ROOT = resolve(__dirname, '../../..');

describe('Step 17 — backup completeness (H4-adjacent)', () => {
  it('BACKUP_COLLECTIONS includes the Step 15 admin collections', () => {
    for (const name of ['jobReports', 'jobCorrections', 'circularHistory', 'approvedDomains']) {
      expect(BACKUP_COLLECTIONS).toContain(name);
    }
  });

  it('BACKUP_COLLECTIONS includes the Step 14 circulars collection', () => {
    expect(BACKUP_COLLECTIONS).toContain('circulars');
  });

  it('BACKUP_COLLECTIONS includes the Job question bank + keys', () => {
    for (const name of ['jobQuestions', 'jobQuestionBundles', 'jobQuestionKeys', 'quizKeys']) {
      expect(BACKUP_COLLECTIONS).toContain(name);
    }
  });

  it('BACKUP_COLLECTIONS has no duplicates', () => {
    expect(new Set(BACKUP_COLLECTIONS).size).toBe(BACKUP_COLLECTIONS.length);
  });
});

describe('Step 17 — Google login removal holds', () => {
  it('LoginPage and RegisterPage never call signInWithGoogle', () => {
    for (const page of ['LoginPage.tsx', 'RegisterPage.tsx']) {
      const src = readFileSync(resolve(ROOT, 'src/pages', page), 'utf8');
      expect(src).not.toContain('signInWithGoogle');
      expect(src).not.toContain('GoogleSignIn');
    }
  });
});

describe('Step 17 — CSP fonts (L5)', () => {
  it('firebase.json style-src allows fonts.googleapis.com', () => {
    const raw = readFileSync(resolve(ROOT, 'firebase.json'), 'utf8');
    const json = JSON.parse(raw) as { hosting?: { headers?: Array<{ headers?: Array<{ key: string; value: string }> }> } };
    const csp = json.hosting?.headers
      ?.flatMap((h) => h.headers ?? [])
      .find((h) => h.key === 'Content-Security-Policy')?.value;
    expect(csp).toBeDefined();
    expect(csp).toContain('fonts.googleapis.com');
  });
});

describe('Step 17 — H3 read-budget tripwire', () => {
  it('ClassDashboardPage loads books + quizzes through the class-scoped listers', () => {
    const src = readFileSync(resolve(ROOT, 'src/pages/ClassDashboardPage.tsx'), 'utf8');
    expect(src).toContain('listBooksForClass(');
    expect(src).toContain('listQuizzesForClass(');
    // No unscoped whole-collection read of books/quizzes in the page.
    expect(src).not.toMatch(/getDocs\(\s*collection\(\s*db,\s*['"]books['"]\s*\)\s*\)/);
    expect(src).not.toMatch(/getDocs\(\s*collection\(\s*db,\s*['"]quizzes['"]\s*\)\s*\)/);
  });
});
