// Eduvelto — National University admission: student-profile fields (NU-4,
// 22 Nov 2026; design doc team/nu-admission-audit-design-2026-11-22.md
// §6.3, §12.3, §19.2.15, §19.14 handover).
//
// The four NU fields on `users/{uid}`:
//   admissionTargetInstitution ('national-university' | null),
//   admissionTargetGroup ('humanities' | 'science' | 'business' | null),
//   admissionMode ('beginner' | 'advanced', absent = beginner),
//   admissionOnboarded (bool, absent = false).
//
// DECISIONS FINALISED IN NU-4 (design proposals adopted; owner questions
// stay open — see the NU-4 report):
//   * NU-Q5 — MODE IS SEPARATE: `admissionMode` is its own field, NOT
//     shared with Job's `jobMode`. A student can be Advanced in Job
//     preparation and Beginner in NU admission (new to it). If the owner
//     later chooses a shared mode, the migration is a one-field change.
//   * NU-Q7 — DAILY GOALS ARE SHARED: Job's `dailyGoalQuestions` /
//     `dailyGoalMinutes` are reused — NO NU-specific goal fields are
//     created here. (On main those Job fields do not exist yet; they
//     arrive with the Job Step 4 merge. Until then the NU profile simply
//     carries no daily goal.)
//   * Institution↔group consistency is APP-LEVEL, not rules-level
//     (Job Step 4 precedent, k27): a group without an institution is
//     invalid in the app (`validateNuProfileConsistency`), and the
//     ProfilePage clears the group when the institution is cleared.
//     The rules only enforce the per-field allowlists.
//   * NULL-vs-absent semantics (Job Step 4, BINDING): null/absent =
//     undecided; an explicitly cleared [] / null still wins over an
//     anonymous draft import (field presence, not truthiness).
//   * Students can NEVER create/submit/edit/publish questions or
//     answers — only Owner + approved Admin / Verified Teacher. That is
//     enforced in firestore.rules (§19.3), not here; this module only
//     ever writes the four profile fields above.
//
// LOCAL STORAGE — ACCOUNT ISOLATION (Job Step 4 ChatGPT P0, same fix):
//   * ANONYMOUS drafts only: `eduvelto-nu-anonymous-*` — written and
//     read ONLY while signed out. A signed-in student's profile is the
//     ONLY source of truth; nothing is ever written to localStorage
//     from a signed-in save, and the anonymous draft is NEVER read over
//     a signed-in profile.
//   * NO authenticated localStorage cache at all (the simpler
//     arrangement ChatGPT favoured for Job): signed-in students use the
//     Firestore profile.
//   * An anonymous draft becomes profile data ONLY through an EXPLICIT
//     import decision (draftImportCandidates + the ProfilePage prompt):
//     the student reviews the draft values and saves them through the
//     normal profile flow, or declines — the draft is cleared after
//     either resolution. Never auto-merge, never auto-restore stale
//     drafts. The import offer appears ONLY for profile fields that
//     are ABSENT from the document (field presence, not truthiness).

import type { UserProfile } from './profile';

/** The only institution in this release (design §12.3). New
 * institutions extend this allowlist — never a free-text value. */
export const NU_INSTITUTION_SLUGS = ['national-university'] as const;

export type NuInstitutionSlug = (typeof NU_INSTITUTION_SLUGS)[number];

/** The three NU admission groups (circular 20/11/2025 §3). */
export const NU_GROUP_SLUGS = ['humanities', 'science', 'business'] as const;

export type NuGroupSlug = (typeof NU_GROUP_SLUGS)[number];

export type AdmissionMode = 'beginner' | 'advanced';

export interface NuGroupDef {
  slug: NuGroupSlug;
  bn: string;
  en: string;
  /** Group accent (design §4 — reused Job hub colours; white text on
   * each passes WCAG AA as measured for Job). */
  accent: string;
  accentSoft: string;
  accentDeep: string;
  descriptionBn: string;
  descriptionEn: string;
}

export const NU_GROUPS: NuGroupDef[] = [
  {
    slug: 'humanities',
    bn: 'মানবিক শাখা',
    en: 'Humanities',
    accent: '#7E22CE',
    accentSoft: '#F3E8FB',
    accentDeep: '#581C87',
    descriptionBn: 'মানবিক শাখার ভর্তি প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও শাখা-ভিত্তিক প্রশ্ন।',
    descriptionEn: 'Humanities admission preparation — Bangla, English, general knowledge and group subjects.',
  },
  {
    slug: 'science',
    bn: 'বিজ্ঞান শাখা',
    en: 'Science',
    accent: '#1D4ED8',
    accentSoft: '#E7EDFC',
    accentDeep: '#1E3A8A',
    descriptionBn: 'বিজ্ঞান শাখার ভর্তি প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও শাখা-ভিত্তিক প্রশ্ন।',
    descriptionEn: 'Science admission preparation — Bangla, English, general knowledge and group subjects.',
  },
  {
    slug: 'business',
    bn: 'ব্যবসায় শিক্ষা শাখা',
    en: 'Business Studies',
    accent: '#15803D',
    accentSoft: '#E7F4EB',
    accentDeep: '#14532D',
    descriptionBn: 'ব্যবসায় শিক্ষা শাখার ভর্তি প্রস্তুতি — বাংলা, ইংরেজি, সাধারণ জ্ঞান ও শাখা-ভিত্তিক প্রশ্ন।',
    descriptionEn: 'Business Studies admission preparation — Bangla, English, general knowledge and group subjects.',
  },
];

export function isNuGroupSlug(value: unknown): value is NuGroupSlug {
  return typeof value === 'string' && (NU_GROUP_SLUGS as readonly string[]).includes(value);
}

export function isNuInstitutionSlug(value: unknown): value is NuInstitutionSlug {
  return (
    typeof value === 'string' && (NU_INSTITUTION_SLUGS as readonly string[]).includes(value)
  );
}

/** Anything that is not exactly 'advanced' reads as 'beginner' (default). */
export function resolveAdmissionMode(value: unknown): AdmissionMode {
  return value === 'advanced' ? 'advanced' : 'beginner';
}

export interface NuProfilePreferences {
  admissionTargetInstitution: NuInstitutionSlug | null;
  admissionTargetGroup: NuGroupSlug | null;
  admissionMode: AdmissionMode;
  admissionOnboarded: boolean;
}

export const EMPTY_NU_PREFERENCES: NuProfilePreferences = {
  admissionTargetInstitution: null,
  admissionTargetGroup: null,
  admissionMode: 'beginner',
  admissionOnboarded: false,
};

/**
 * App-level consistency (design §12.3 — rules do NOT enforce this, the
 * app does): a target group without a target institution is invalid;
 * an institution without a group is fine (group undecided). Returns
 * every problem — empty means consistent.
 */
export function validateNuProfileConsistency(prefs: {
  admissionTargetInstitution?: string | null;
  admissionTargetGroup?: string | null;
}): string[] {
  const problems: string[] = [];
  if (prefs.admissionTargetGroup != null && prefs.admissionTargetInstitution == null) {
    problems.push('admissionTargetGroup is set but admissionTargetInstitution is not');
  }
  return problems;
}

/** The signed-in profile's NU values, sanitized. NO draft is ever
 * mixed in here — the profile is the only source of truth for a
 * signed-in student. */
export function profileNuPreferences(profile: UserProfile | null): NuProfilePreferences {
  if (!profile) return { ...EMPTY_NU_PREFERENCES };
  return {
    admissionTargetInstitution: isNuInstitutionSlug(profile.admissionTargetInstitution)
      ? profile.admissionTargetInstitution
      : null,
    admissionTargetGroup: isNuGroupSlug(profile.admissionTargetGroup)
      ? profile.admissionTargetGroup
      : null,
    admissionMode: resolveAdmissionMode(profile.admissionMode),
    admissionOnboarded: profile.admissionOnboarded === true,
  };
}

/** Whether the first-time mode-choice screen should show (Job Step 4
 * mode/onboarding matrix, NU form):
 *   admissionMode missing + admissionOnboarded missing → show (Beginner)
 *   admissionMode missing + admissionOnboarded true   → hide (Beginner)
 *   Beginner + true → hide, Beginner selected
 *   Advanced + true → hide, Advanced selected
 *   Advanced + false → SHOW, with the existing Advanced preference
 *     intact — reopening must NEVER silently reset the mode.
 * forceOpen (the "show again" button) always shows. Signed-out
 * visitors never see it (profile null → false). */
export function shouldShowNuOnboarding(
  profile: {
    admissionMode?: 'beginner' | 'advanced' | null;
    admissionOnboarded?: boolean | null;
  } | null,
  forceOpen: boolean,
): boolean {
  if (!profile) return false;
  if (forceOpen) return true;
  return profile.admissionOnboarded !== true;
}

// ---------- anonymous local draft (signed-out visitors only) ----------

const ANON_INSTITUTION_KEY = 'eduvelto-nu-anonymous-institution';
const ANON_GROUP_KEY = 'eduvelto-nu-anonymous-group';
const ANON_MODE_KEY = 'eduvelto-nu-anonymous-mode';

export interface NuLocalDraft {
  admissionTargetInstitution: NuInstitutionSlug | null;
  admissionTargetGroup: NuGroupSlug | null;
  admissionMode: AdmissionMode | null;
}

export const EMPTY_NU_DRAFT: NuLocalDraft = {
  admissionTargetInstitution: null,
  admissionTargetGroup: null,
  admissionMode: null,
};

/** Read the ANONYMOUS draft (signed-out visitors only). Every value is
 * re-validated on read, so a hand-edited or stale localStorage entry
 * can never inject a bad slug or mode. */
export function readAnonymousNuDraft(): NuLocalDraft {
  try {
    const institutionRaw = window.localStorage.getItem(ANON_INSTITUTION_KEY);
    const groupRaw = window.localStorage.getItem(ANON_GROUP_KEY);
    const modeRaw = window.localStorage.getItem(ANON_MODE_KEY);
    return {
      admissionTargetInstitution: isNuInstitutionSlug(institutionRaw) ? institutionRaw : null,
      admissionTargetGroup: isNuGroupSlug(groupRaw) ? groupRaw : null,
      admissionMode: modeRaw === 'beginner' || modeRaw === 'advanced' ? modeRaw : null,
    };
  } catch {
    return { ...EMPTY_NU_DRAFT };
  }
}

/** Write the ANONYMOUS draft. Callers must ensure this runs ONLY while
 * signed out (ProfilePage never calls it while signed in). Invalid
 * values are dropped, never stored. */
export function writeAnonymousNuDraft(draft: Partial<NuLocalDraft>): void {
  try {
    if (draft.admissionTargetInstitution !== undefined) {
      if (isNuInstitutionSlug(draft.admissionTargetInstitution)) {
        window.localStorage.setItem(ANON_INSTITUTION_KEY, draft.admissionTargetInstitution);
      } else {
        window.localStorage.removeItem(ANON_INSTITUTION_KEY);
      }
    }
    if (draft.admissionTargetGroup !== undefined) {
      if (isNuGroupSlug(draft.admissionTargetGroup)) {
        window.localStorage.setItem(ANON_GROUP_KEY, draft.admissionTargetGroup);
      } else {
        window.localStorage.removeItem(ANON_GROUP_KEY);
      }
    }
    if (draft.admissionMode !== undefined) {
      if (draft.admissionMode === 'beginner' || draft.admissionMode === 'advanced') {
        window.localStorage.setItem(ANON_MODE_KEY, draft.admissionMode);
      } else {
        window.localStorage.removeItem(ANON_MODE_KEY);
      }
    }
  } catch {
    // Storage unavailable — the anonymous draft is a convenience only.
  }
}

/** Clear the anonymous draft — after an import is saved, or after the
 * student declines the import. Never leave a resolved draft behind. */
export function clearAnonymousNuDraft(): void {
  try {
    window.localStorage.removeItem(ANON_INSTITUTION_KEY);
    window.localStorage.removeItem(ANON_GROUP_KEY);
    window.localStorage.removeItem(ANON_MODE_KEY);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

/**
 * Explicit draft-import candidates (Job Step 4 ChatGPT P0 pattern).
 * For each NU field that is ABSENT from the signed-in profile document
 * AND has a value in the anonymous draft, the draft value is a
 * candidate for import. A field that is PRESENT in the profile — even
 * as null (an explicit "none yet" / "cleared") — is never a candidate:
 * the profile wins, and the student is never offered a stale value for
 * a field they already decided. Returns null when there is nothing to
 * import. The ProfilePage prompt shows these values for review; the
 * import itself goes through the normal profile save flow.
 */
export function draftImportCandidates(
  profile: UserProfile | null,
  draft: NuLocalDraft,
): NuLocalDraft | null {
  if (!profile) return null;
  const out: NuLocalDraft = { ...EMPTY_NU_DRAFT };
  let any = false;
  if (!('admissionTargetInstitution' in profile) && draft.admissionTargetInstitution != null) {
    out.admissionTargetInstitution = draft.admissionTargetInstitution;
    any = true;
  }
  if (!('admissionTargetGroup' in profile) && draft.admissionTargetGroup != null) {
    out.admissionTargetGroup = draft.admissionTargetGroup;
    any = true;
  }
  if (!('admissionMode' in profile) && draft.admissionMode != null) {
    out.admissionMode = draft.admissionMode;
    any = true;
  }
  return any ? out : null;
}
