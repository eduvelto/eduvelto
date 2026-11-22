/**
 * Eduvelto Job Preparation — Step 4 closure unit tests (ChatGPT
 * consultation fold-in, 22 Nov 2026).
 *
 * Covers the P0/P1 fixes that live in pure frontend code, against the
 * REAL APIs in jobProfile.ts / jobMode.ts (read 22 Nov 2026 — do not
 * assume the summary's paraphrase):
 *  (1) one canonical taxonomy — JOB_CATEGORIES (10) / TARGET_EXAM_SLUGS
 *      (14 incl. it-professional) / JOB_EXAMS (13 built hubs — the
 *      it-professional hub arrives in Step 5) / SELECTABLE_TARGET_EXAMS
 *      (13);
 *  (2) localStorage account isolation — there is NO authenticated
 *      localStorage cache at all (signed-in students use Firestore
 *      only); the ONLY browser keys are the three anonymous ones
 *      (eduvelto-job-anonymous-*), written/read while signed out;
 *  (3) draft import candidates — FIELD PRESENCE semantics: a field
 *      PRESENT in the profile (even as [] or null — an explicit
 *      "decided") is never a candidate; only ABSENT fields are offered;
 *  (4) mode/onboarding matrix — Advanced + jobOnboarded false SHOWS
 *      the onboarding but NEVER resets the mode;
 *  (5) null-vs-0 goal semantics + integer-only clamps.
 *
 * Runs under plain node (no jsdom installed): a window.localStorage
 * stub stands in for the browser store. Run with `npm run test:unit`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  JOB_CATEGORIES,
  JOB_CATEGORY_SLUGS,
  TARGET_EXAM_SLUGS,
  SELECTABLE_TARGET_EXAMS,
  jobCategoryOfExam,
  jobCategoryHubs,
  sanitizeEnrolledCategories,
  isTargetExamSlug,
  profileJobPreferences,
  draftImportCandidates,
  validateJobTaxonomy,
  writeAnonymousJobDraft,
  readAnonymousJobDraft,
  clearAnonymousJobDraft,
  EMPTY_JOB_DRAFT,
  clampDailyGoalQuestions,
  clampDailyGoalMinutes,
  shouldShowJobOnboarding,
  type JobLocalDraft,
} from '../jobProfile';
import { JOB_EXAMS } from '../jobExams';
import { resolveJobMode } from '../jobMode';
import type { UserProfile } from '../profile';

/* ------------------------------------------------------------------ */
/* window.localStorage stub (node has no window)                       */
/* ------------------------------------------------------------------ */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  keys(): string[] {
    return [...this.store.keys()];
  }
}
const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = {
  localStorage: storage,
};

beforeEach(() => {
  storage.clear();
});

/** WCAG relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastVsWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/** Minimal profile; Job fields are added per test — keys that are NOT
 * in the overrides are genuinely ABSENT (draft-import semantics are
 * field-presence based). */
function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    displayName: 'Test Student',
    email: 'test@example.com',
    role: 'student',
    ...overrides,
  } as UserProfile;
}

const DRAFT: JobLocalDraft = {
  enrolledCategories: ['govt', 'bank'],
  targetExam: 'bcs',
  dailyGoalQuestions: 20,
  dailyGoalMinutes: 45,
};

describe('canonical taxonomy (ChatGPT P1 — one source of truth)', () => {
  it('has exactly 10 categories, all with unique slugs matching JOB_CATEGORY_SLUGS', () => {
    expect(JOB_CATEGORIES).toHaveLength(10);
    expect(JOB_CATEGORY_SLUGS).toHaveLength(10);
    const slugs = JOB_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(10);
    expect([...slugs].sort()).toEqual([...JOB_CATEGORY_SLUGS].sort());
    for (const c of JOB_CATEGORIES) {
      expect(c.bn.trim().length).toBeGreaterThan(0);
      expect(c.en.trim().length).toBeGreaterThan(0);
      expect(c.hubSlugs.length).toBeGreaterThan(0);
    }
  });

  it('TARGET_EXAM_SLUGS has exactly 14 slugs incl. it-professional', () => {
    expect(TARGET_EXAM_SLUGS).toHaveLength(14);
    expect(new Set(TARGET_EXAM_SLUGS).size).toBe(14);
    expect(TARGET_EXAM_SLUGS).toContain('it-professional');
    expect(TARGET_EXAM_SLUGS).toContain('bcs');
    expect(TARGET_EXAM_SLUGS).toContain('bank');
    expect(TARGET_EXAM_SLUGS).toContain('primary-teacher');
    expect(TARGET_EXAM_SLUGS).toContain('ntrca');
  });

  it('JOB_EXAMS has the 13 built hubs — it-professional is NOT built yet (Step 5)', () => {
    expect(JOB_EXAMS).toHaveLength(13);
    const slugs = JOB_EXAMS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(13);
    expect(slugs).not.toContain('it-professional');
    for (const slug of slugs) {
      expect((TARGET_EXAM_SLUGS as readonly string[]).includes(slug)).toBe(true);
    }
  });

  it('every exam slug belongs to exactly one category', () => {
    for (const slug of TARGET_EXAM_SLUGS) {
      const cat = jobCategoryOfExam(slug);
      expect(cat).toBeDefined();
      const inCategory = JOB_CATEGORIES.find((c) => c.slug === cat);
      expect(inCategory).toBeDefined();
      expect(inCategory!.hubSlugs).toContain(slug);
      const claimants = JOB_CATEGORIES.filter((c) => c.hubSlugs.includes(slug));
      expect(claimants).toHaveLength(1);
    }
  });

  it('selectable target exams are the 13 built hubs (it-professional excluded until Step 5)', () => {
    expect(SELECTABLE_TARGET_EXAMS).toHaveLength(13);
    expect(SELECTABLE_TARGET_EXAMS).not.toContain('it-professional');
    expect([...SELECTABLE_TARGET_EXAMS].sort()).toEqual(
      JOB_EXAMS.map((e) => e.slug).sort(),
    );
    expect(isTargetExamSlug('it-professional')).toBe(true);
    expect(isTargetExamSlug('nasa-exam')).toBe(false);
  });

  it('every category accent has AA contrast (≥ 4.5:1) against white text', () => {
    for (const c of JOB_CATEGORIES) {
      expect(/^#[0-9a-fA-F]{6}$/.test(c.accent)).toBe(true);
      expect(contrastVsWhite(c.accent)).toBeGreaterThanOrEqual(4.5);
    }
    // The IT accent is pinned explicitly (Step 4 report §14).
    expect(JOB_CATEGORIES.find((c) => c.slug === 'it-professional')?.accent).toBe('#1E3A5F');
  });

  it('jobCategoryHubs returns the hubs of one category only', () => {
    expect(jobCategoryHubs('bcs-bpsc')).toEqual(['bcs', 'bpsc-non-cadre']);
    expect(jobCategoryHubs('defence-police')).toEqual(['defence']);
    expect(jobCategoryHubs('nope')).toEqual([]);
  });

  it('validateJobTaxonomy reports ONLY the known Step 5 gap (it-professional hub not built)', () => {
    expect(validateJobTaxonomy()).toEqual([
      "exam 'it-professional' has no hub in JOB_EXAMS",
    ]);
  });
});

describe('localStorage account isolation (ChatGPT P0)', () => {
  it('an anonymous draft touches ONLY the three anonymous keys — no global draft, no profile cache', () => {
    writeAnonymousJobDraft(DRAFT);
    expect(readAnonymousJobDraft()).toEqual(DRAFT);
    expect(storage.keys().sort()).toEqual(
      [
        'eduvelto-job-anonymous-categories',
        'eduvelto-job-anonymous-daily-goal',
        'eduvelto-job-anonymous-target-exam',
      ].sort(),
    );
  });

  it('clearing the anonymous draft leaves nothing behind', () => {
    writeAnonymousJobDraft(DRAFT);
    clearAnonymousJobDraft();
    expect(readAnonymousJobDraft()).toEqual(EMPTY_JOB_DRAFT);
    expect(storage.keys()).toEqual([]);
  });

  it('the legacy global key eduvelto-job-draft is IGNORED (never read as a draft)', () => {
    storage.setItem(
      'eduvelto-job-draft',
      JSON.stringify({ enrolledCategories: ['bank'], targetExam: 'bank' }),
    );
    expect(readAnonymousJobDraft()).toEqual(EMPTY_JOB_DRAFT);
  });

  it('corrupt anonymous-draft JSON reads as the empty draft, never throws', () => {
    storage.setItem('eduvelto-job-anonymous-categories', '{not json');
    expect(readAnonymousJobDraft()).toEqual(EMPTY_JOB_DRAFT);
  });

  it('anonymous-draft categories are sanitised on read (invalid slugs dropped, dupes removed)', () => {
    writeAnonymousJobDraft({
      enrolledCategories: ['bank', 'nasa', 'bank'],
      targetExam: null,
      dailyGoalQuestions: null,
      dailyGoalMinutes: null,
    });
    expect(readAnonymousJobDraft()?.enrolledCategories).toEqual(['bank']);
  });

  it('a partial anonymous write touches only the named keys', () => {
    writeAnonymousJobDraft({ targetExam: 'bcs' });
    expect(readAnonymousJobDraft()).toEqual({
      enrolledCategories: [],
      targetExam: 'bcs',
      dailyGoalQuestions: null,
      dailyGoalMinutes: null,
    });
    expect(storage.keys()).toEqual(['eduvelto-job-anonymous-target-exam']);
  });
});

describe('draft import candidates (ChatGPT P0 — field PRESENCE wins, profile authoritative)', () => {
  it('offers the whole draft when every Job field is ABSENT from the profile', () => {
    expect(draftImportCandidates(makeProfile(), DRAFT)).toEqual(DRAFT);
  });

  it('offers only the ABSENT fields — a present field (even null) is never a candidate', () => {
    const profile = makeProfile({
      enrolledCategories: ['bank'],
      targetExam: 'bank',
      dailyGoalQuestions: 30,
      dailyGoalMinutes: null, // present-but-null = decided, not a candidate
    });
    expect(draftImportCandidates(profile, DRAFT)).toBeNull();
  });

  it('offers the absent fields when some are present', () => {
    const profile = makeProfile({ dailyGoalQuestions: 30 });
    expect(draftImportCandidates(profile, DRAFT)).toEqual({
      enrolledCategories: ['govt', 'bank'],
      targetExam: 'bcs',
      dailyGoalQuestions: null,
      dailyGoalMinutes: 45,
    });
  });

  it('offers nothing (null) when there is no profile (signed out — nothing to import into)', () => {
    expect(draftImportCandidates(null, DRAFT)).toBeNull();
  });

  it('offers nothing when the draft itself is empty', () => {
    expect(draftImportCandidates(makeProfile(), EMPTY_JOB_DRAFT)).toBeNull();
  });

  it('a profile goal of 0 counts as SET (the draft value is not offered over it)', () => {
    const profile = makeProfile({ dailyGoalQuestions: 0 });
    const offer = draftImportCandidates(profile, DRAFT);
    expect(offer?.dailyGoalQuestions).toBeNull();
    expect(offer?.dailyGoalMinutes).toBe(45);
  });
});

describe('mode / onboarding matrix (ChatGPT P1)', () => {
  it('Advanced + jobOnboarded false SHOWS onboarding and leaves the mode untouched', () => {
    const profile = makeProfile({ jobMode: 'advanced', jobOnboarded: false });
    expect(shouldShowJobOnboarding(profile, false)).toBe(true);
    expect(profile.jobMode).toBe('advanced');
  });

  it('matrix: beginner/advanced/missing mode × onboarded/not', () => {
    expect(shouldShowJobOnboarding(makeProfile({ jobMode: 'beginner', jobOnboarded: false }), false)).toBe(true);
    expect(shouldShowJobOnboarding(makeProfile({ jobMode: 'beginner', jobOnboarded: true }), false)).toBe(false);
    expect(shouldShowJobOnboarding(makeProfile({ jobMode: 'advanced', jobOnboarded: false }), false)).toBe(true);
    expect(shouldShowJobOnboarding(makeProfile({ jobMode: 'advanced', jobOnboarded: true }), false)).toBe(false);
    expect(shouldShowJobOnboarding(makeProfile({ jobOnboarded: false }), false)).toBe(true);
    expect(shouldShowJobOnboarding(makeProfile({ jobOnboarded: true }), false)).toBe(false);
  });

  it('signed-out (null profile) never sees the onboarding; forceOpen always shows it', () => {
    expect(shouldShowJobOnboarding(null, false)).toBe(false);
    expect(shouldShowJobOnboarding(makeProfile({ jobOnboarded: true }), true)).toBe(true);
  });

  it('resolveJobMode: only exactly "advanced" is advanced; anything else is beginner', () => {
    expect(resolveJobMode('advanced')).toBe('advanced');
    expect(resolveJobMode('beginner')).toBe('beginner');
    expect(resolveJobMode(undefined)).toBe('beginner');
    expect(resolveJobMode(null)).toBe('beginner');
    expect(resolveJobMode('ADVANCED')).toBe('beginner');
  });
});

describe('profile preferences + goal clamps (null-vs-0, duplicates, decimals)', () => {
  it('profileJobPreferences defaults an absent profile to empty/undecided', () => {
    expect(profileJobPreferences(null)).toEqual(EMPTY_JOB_DRAFT);
  });

  it('profileJobPreferences keeps an explicit 0 goal (never coerces to null)', () => {
    const prefs = profileJobPreferences(
      makeProfile({ dailyGoalQuestions: 0, dailyGoalMinutes: 0 }),
    );
    expect(prefs.dailyGoalQuestions).toBe(0);
    expect(prefs.dailyGoalMinutes).toBe(0);
  });

  it('profileJobPreferences turns a decimal / string / boolean goal into null, never a floored value', () => {
    const prefs = profileJobPreferences(
      makeProfile({ dailyGoalQuestions: 12.5 as never, dailyGoalMinutes: '30' as never }),
    );
    expect(prefs.dailyGoalQuestions).toBeNull();
    expect(prefs.dailyGoalMinutes).toBeNull();
  });

  it('sanitizeEnrolledCategories dedupes, preserves order, drops unknown slugs', () => {
    expect(sanitizeEnrolledCategories(['bank', 'nasa', 'bank', 'govt', 'bank'])).toEqual([
      'bank',
      'govt',
    ]);
    expect(sanitizeEnrolledCategories(null)).toEqual([]);
  });

  it('clampDailyGoalQuestions: integers 0–500 only', () => {
    expect(clampDailyGoalQuestions(0)).toBe(0);
    expect(clampDailyGoalQuestions(500)).toBe(500);
    expect(clampDailyGoalQuestions(12.5)).toBeNull();
    expect(clampDailyGoalQuestions('30')).toBeNull();
    expect(clampDailyGoalQuestions(true)).toBeNull();
    expect(clampDailyGoalQuestions(-1)).toBeNull();
    expect(clampDailyGoalQuestions(501)).toBeNull();
    expect(clampDailyGoalQuestions(null)).toBeNull();
  });

  it('clampDailyGoalMinutes: integers 0–600 only', () => {
    expect(clampDailyGoalMinutes(0)).toBe(0);
    expect(clampDailyGoalMinutes(600)).toBe(600);
    expect(clampDailyGoalMinutes(45.75)).toBeNull();
    expect(clampDailyGoalMinutes(601)).toBeNull();
  });
});
