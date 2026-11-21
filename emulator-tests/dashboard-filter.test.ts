/**
 * Eduvelto — dashboard content-filter unit tests (Step 5).
 *
 * Pure-function tests for src/lib/academicProfile.ts — no emulator,
 * no network. They prove the profile → query-constraint mapping that
 * the dashboards rely on: a student's query is filtered by their
 * academic profile FIRST, and a profile with no usable academic fields
 * produces NO constraints (the UI shows the empty state, never an
 * unfiltered list of all 609 books).
 *
 * Run with the rules suite: npm run test:rules
 * (vitest runs every file under emulator-tests/).
 */
import { describe, it, expect } from 'vitest';
import {
  bookConstraintsForProfile,
  bookConstraintsForTeacher,
  bookTypesForProfile,
  profileMatchesBook,
} from '../src/lib/academicProfile';
import type { UserProfile } from '../src/lib/profile';

function student(over: Partial<UserProfile>): UserProfile {
  return {
    displayName: 'Test Student',
    email: 'test@example.com',
    role: 'student',
    language: 'bn',
    ...over,
  };
}

describe('dashboard content filtering (pure functions)', () => {
  it('Honours English 3rd Year → Higher + class + department + program + board', () => {
    const c = bookConstraintsForProfile(
      student({
        educationType: 'higher',
        classLevel: '3rd Year',
        department: 'English',
        program: 'Honours',
        board: 'National University',
      }),
    );
    expect(c).toEqual([
      { field: 'educationType', op: '==', value: 'Higher' },
      { field: 'classLevel', op: '==', value: '3rd Year' },
      { field: 'department', op: '==', value: 'English' },
      { field: 'program', op: '==', value: 'Honours' },
      { field: 'board', op: '==', value: 'National University' },
    ]);
  });

  it('general student → educationType in [SSC, HSC]', () => {
    const c = bookConstraintsForProfile(
      student({ educationType: 'general', classLevel: 'Class 10', department: 'Science' }),
    );
    expect(c[0]).toEqual({ field: 'educationType', op: 'in', value: ['SSC', 'HSC'] });
    expect(c).toContainEqual({ field: 'classLevel', op: '==', value: 'Class 10' });
    expect(c).toContainEqual({ field: 'department', op: '==', value: 'Science' });
  });

  it('unknown board value is NOT used as a filter (exact-match only)', () => {
    const c = bookConstraintsForProfile(
      student({ educationType: 'higher', classLevel: '3rd Year', board: 'Dhaka' }),
    );
    expect(c.some((x) => x.field === 'board')).toBe(false);
  });

  it('profile with no educationType → NO constraints (empty state, never unfiltered)', () => {
    expect(bookConstraintsForProfile(student({ educationType: null }))).toEqual([]);
    expect(bookConstraintsForProfile(student({}))).toEqual([]);
  });

  it("educationType 'other' → NO constraints", () => {
    expect(bookTypesForProfile('other')).toEqual([]);
    expect(bookConstraintsForProfile(student({ educationType: 'other' }))).toEqual([]);
  });

  it('madrasa / technical map 1:1', () => {
    expect(bookTypesForProfile('madrasa')).toEqual(['Madrasa']);
    expect(bookTypesForProfile('technical')).toEqual(['Technical']);
  });

  it('teacher: approved subjects/classes only; empty approval → no constraints', () => {
    expect(bookConstraintsForTeacher(['English'], ['3rd Year'], 'higher')).toEqual([
      { field: 'educationType', op: '==', value: 'Higher' },
      { field: 'classLevel', op: '==', value: '3rd Year' },
      { field: 'department', op: '==', value: 'English' },
    ]);
    expect(bookConstraintsForTeacher([], ['3rd Year'], 'higher')).toEqual([]);
    expect(bookConstraintsForTeacher(['English'], [], 'higher')).toEqual([]);
    expect(bookConstraintsForTeacher(['English'], ['3rd Year'], null)).toEqual([]);
  });

  it('teacher with several approved subjects → department in [...]', () => {
    const c = bookConstraintsForTeacher(['English', 'Bangla'], ['3rd Year', '4th Year'], 'higher');
    expect(c).toContainEqual({ field: 'classLevel', op: 'in', value: ['3rd Year', '4th Year'] });
    expect(c).toContainEqual({ field: 'department', op: 'in', value: ['English', 'Bangla'] });
  });

  it('profileMatchesBook: match / wrong department / wrong class / wrong board', () => {
    const profile = student({
      educationType: 'higher',
      classLevel: '3rd Year',
      department: 'English',
      program: 'Honours',
      board: 'National University',
    });
    const good = {
      educationType: 'Higher',
      classLevel: '3rd Year',
      department: 'English',
      program: 'Honours',
      board: 'National University',
    };
    expect(profileMatchesBook(profile, good)).toBe(true);
    expect(profileMatchesBook(profile, { ...good, department: 'Mathematics' })).toBe(false);
    expect(profileMatchesBook(profile, { ...good, classLevel: '4th Year' })).toBe(false);
    expect(profileMatchesBook(profile, { ...good, board: 'Dhaka University' })).toBe(false);
    expect(profileMatchesBook(profile, { ...good, educationType: 'SSC' })).toBe(false);
    // Unknown board on the profile is ignored (never blocks a match).
    const noBoard = student({ educationType: 'higher', classLevel: '3rd Year', department: 'English', board: 'Dhaka' });
    expect(profileMatchesBook(noBoard, { ...good, board: 'Rajshahi University' })).toBe(true);
  });

  it('profile with no educationType matches NOTHING (never wrong-class content)', () => {
    const profile = student({ educationType: null });
    expect(
      profileMatchesBook(profile, {
        educationType: 'Higher',
        classLevel: '3rd Year',
        department: 'English',
        program: 'Honours',
        board: 'National University',
      }),
    ).toBe(false);
  });
});
