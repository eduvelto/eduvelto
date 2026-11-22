/**
 * Eduvelto unit tests — NU admission profile fields (NU-4; design doc
 * §6.3, §12.3, §19.2.15). Pure functions only — no Firestore, no
 * network. (localStorage-backed draft helpers are exercised only for
 * their no-crash / empty-draft behaviour here: vitest runs in node,
 * where window is undefined, and the helpers catch that.)
 * Run: npx vitest run src/lib/__tests__/nuProfile.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  NU_GROUPS,
  NU_GROUP_SLUGS,
  isNuGroupSlug,
  isNuInstitutionSlug,
  resolveAdmissionMode,
  profileNuPreferences,
  validateNuProfileConsistency,
  shouldShowNuOnboarding,
  readAnonymousNuDraft,
  draftImportCandidates,
  EMPTY_NU_DRAFT,
} from '../nuProfile';
import type { UserProfile } from '../profile';

function fakeProfile(patch: Partial<UserProfile>): UserProfile {
  return {
    displayName: 'Test',
    email: 'test@example.com',
    role: 'student',
    language: 'bn',
    ...patch,
  };
}

describe('NU taxonomy (NU-4, §4)', () => {
  it('has exactly the 3 verified groups, each with a distinct accent', () => {
    expect(NU_GROUP_SLUGS).toEqual(['humanities', 'science', 'business']);
    expect(NU_GROUPS.map((g) => g.slug)).toEqual(NU_GROUP_SLUGS);
    const accents = NU_GROUPS.map((g) => g.accent);
    expect(new Set(accents).size).toBe(3);
  });

  it('rejects unknown group / institution slugs', () => {
    expect(isNuGroupSlug('engineering')).toBe(false);
    expect(isNuGroupSlug(null)).toBe(false);
    expect(isNuInstitutionSlug('dhaka-university')).toBe(false);
    expect(isNuInstitutionSlug('national-university')).toBe(true);
  });
});

describe('resolveAdmissionMode + profileNuPreferences', () => {
  it('absent mode reads as beginner; only exact "advanced" is advanced', () => {
    expect(resolveAdmissionMode(undefined)).toBe('beginner');
    expect(resolveAdmissionMode(null)).toBe('beginner');
    expect(resolveAdmissionMode('Advanced')).toBe('beginner');
    expect(resolveAdmissionMode('advanced')).toBe('advanced');
  });

  it('sanitizes a profile with out-of-enum values back to undecided', () => {
    const prefs = profileNuPreferences(
      fakeProfile({
        admissionTargetInstitution: 'dhaka-university',
        admissionTargetGroup: 'engineering',
        admissionMode: 'expert' as never,
        admissionOnboarded: 'yes' as never,
      }),
    );
    expect(prefs.admissionTargetInstitution).toBeNull();
    expect(prefs.admissionTargetGroup).toBeNull();
    expect(prefs.admissionMode).toBe('beginner');
    expect(prefs.admissionOnboarded).toBe(false);
  });

  it('passes valid values through unchanged', () => {
    const prefs = profileNuPreferences(
      fakeProfile({
        admissionTargetInstitution: 'national-university',
        admissionTargetGroup: 'science',
        admissionMode: 'advanced',
        admissionOnboarded: true,
      }),
    );
    expect(prefs).toEqual({
      admissionTargetInstitution: 'national-university',
      admissionTargetGroup: 'science',
      admissionMode: 'advanced',
      admissionOnboarded: true,
    });
  });

  it('a null profile reads as empty preferences', () => {
    expect(profileNuPreferences(null)).toEqual({
      admissionTargetInstitution: null,
      admissionTargetGroup: null,
      admissionMode: 'beginner',
      admissionOnboarded: false,
    });
  });
});

describe('validateNuProfileConsistency (app-level, §12.3)', () => {
  it('a group without an institution is inconsistent', () => {
    expect(
      validateNuProfileConsistency({
        admissionTargetInstitution: null,
        admissionTargetGroup: 'science',
      }),
    ).toHaveLength(1);
  });

  it('an institution without a group is fine (group undecided)', () => {
    expect(
      validateNuProfileConsistency({
        admissionTargetInstitution: 'national-university',
        admissionTargetGroup: null,
      }),
    ).toEqual([]);
  });

  it('both set, or both unset, is consistent', () => {
    expect(
      validateNuProfileConsistency({
        admissionTargetInstitution: 'national-university',
        admissionTargetGroup: 'business',
      }),
    ).toEqual([]);
    expect(
      validateNuProfileConsistency({
        admissionTargetInstitution: null,
        admissionTargetGroup: null,
      }),
    ).toEqual([]);
  });
});

describe('shouldShowNuOnboarding (mode/onboarding matrix)', () => {
  it('shows on first sight (nothing handled yet), hides once handled', () => {
    expect(shouldShowNuOnboarding({}, false)).toBe(true);
    expect(shouldShowNuOnboarding({ admissionOnboarded: true }, false)).toBe(false);
  });

  it('shows again for an Advanced preference that was never confirmed — without resetting it', () => {
    expect(
      shouldShowNuOnboarding({ admissionMode: 'advanced', admissionOnboarded: false }, false),
    ).toBe(true);
  });

  it('forceOpen always shows; signed-out (null profile) never shows', () => {
    expect(shouldShowNuOnboarding({ admissionOnboarded: true }, true)).toBe(true);
    expect(shouldShowNuOnboarding(null, false)).toBe(false);
    expect(shouldShowNuOnboarding(null, true)).toBe(false);
  });
});

describe('anonymous draft (signed-out only)', () => {
  it('reads as empty when there is no window/localStorage', () => {
    expect(readAnonymousNuDraft()).toEqual(EMPTY_NU_DRAFT);
  });

  it('offers import only for fields ABSENT from the profile', () => {
    const draft = {
      admissionTargetInstitution: 'national-university' as const,
      admissionTargetGroup: 'science' as const,
      admissionMode: 'advanced' as const,
    };
    // All absent → all three are candidates.
    const all = draftImportCandidates(fakeProfile({}), draft);
    expect(all).toEqual(draft);
    // Institution present (even as null = explicitly cleared) → never a candidate for it.
    const partial = draftImportCandidates(
      fakeProfile({ admissionTargetInstitution: null }),
      draft,
    );
    expect(partial?.admissionTargetInstitution).toBeNull();
    expect(partial?.admissionTargetGroup).toBe('science');
    expect(partial?.admissionMode).toBe('advanced');
    // Nothing in the draft → nothing to import.
    expect(draftImportCandidates(fakeProfile({}), EMPTY_NU_DRAFT)).toBeNull();
    // No profile (signed out) → no import.
    expect(draftImportCandidates(null, draft)).toBeNull();
  });
});
