/**
 * Eduvelto Job Preparation — Step 5 unit tests (Job Categories and
 * Exam Structure, 22 Nov 2026).
 *
 * Covers:
 *  (1) the 10 category groups (jobCategoryGroups) — order 1–10, 14
 *      exams, each exam in exactly one group;
 *  (2) the machine-readable rulesConfig (Step 3 §2.2) — the 4 verified
 *      exams only, exact figures, subject lists summing to
 *      questionCount, cross-checked against EXAM_PATTERNS (Bangla-digit
 *      marks converted); BCS is the 50th syllabus split (v2), Bank's
 *      −0.25 is verified (v1);
 *  (3) the IT hub def (Step 2 §2.9 — scope undecided, no pattern);
 *  (4) the Firestore seed (team/job-categories-exams-seed.json) —
 *      schema-validated AND deep-matched against the canonical
 *      frontend config, so seed and code cannot drift apart.
 *
 * Runs under plain node: `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  JOB_EXAMS,
  EXAM_KEYS,
  VERIFIED_EXAM_KEYS,
  VIRTUAL_EXAM_KEYS,
  isExamKey,
  isVirtualExamKey,
  EXAM_PATTERNS,
  JOB_RULES_CONFIGS,
  JOB_PATTERN_STATUS,
  jobRulesConfig,
  jobExamBySlug,
  jobPatternStatus,
  jobApplicableCycle,
  jobExamSyllabusReady,
  isDraftJobReviewStatus,
  JOB_DRAFT_REVIEW_STATES,
  JOB_REVIEW_STATES,
} from '../jobExams';
import {
  JOB_CATEGORIES,
  SELECTABLE_TARGET_EXAMS,
  jobCategoryOfExam,
  jobCategoryGroups,
} from '../jobProfile';

/** Bangla-digit string ('৩৫') → number (35). */
function bnToNum(s: string): number {
  return Number(
    s
      .split('')
      .map((d) => '০১২৩৪৫৬৭৮৯'.indexOf(d))
      .join(''),
  );
}

const SEED_PATH = fileURLToPath(
  new URL('../../../team/job-categories-exams-seed.json', import.meta.url),
);
const SEED = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as {
  jobCategories: Record<string, Record<string, unknown>>;
  jobExams: Record<string, Record<string, unknown>>;
};

describe('category groups (Step 5 — Step 2 §0.4/§2.1)', () => {
  it('has 10 groups in order 1–10, covering all 15 exams exactly once', () => {
    const groups = jobCategoryGroups();
    expect(groups).toHaveLength(10);
    expect(groups.map((g) => g.category.slug)).toEqual(JOB_CATEGORIES.map((c) => c.slug));
    const allSlugs = groups.flatMap((g) => g.exams.map((e) => e.slug));
    expect(allSlugs).toHaveLength(15);
    expect(new Set(allSlugs).size).toBe(15);
    expect([...allSlugs].sort()).toEqual(JOB_EXAMS.map((e) => e.slug).sort());
  });

  it('group 2 (govt) holds 5 hubs; group 9 (it-professional) holds 1', () => {
    const groups = jobCategoryGroups();
    expect(groups[1].exams.map((e) => e.slug)).toEqual([
      'ministries',
      'dgfood',
      'cag',
      'bfsa',
      'grade-11-20',
    ]);
    expect(groups[8].exams.map((e) => e.slug)).toEqual(['it-professional']);
    expect(groups[0].exams.map((e) => e.slug)).toEqual(['bcs', 'bpsc-non-cadre']);
  });

  it('every group’s exams match its category’s hubSlugs, in order', () => {
    for (const g of jobCategoryGroups()) {
      expect(g.exams.map((e) => e.slug)).toEqual(g.category.hubSlugs);
    }
  });
});

describe('rulesConfig (Step 5 — Step 3 §2.2, verified figures only)', () => {
  it('exists for exactly the 4 verified exams; null for the other 10', () => {
    const withConfig = JOB_EXAMS.map((e) => e.slug).filter((s) => jobRulesConfig(s) !== null);
    expect(withConfig.sort()).toEqual(['bank', 'bcs', 'ntrca', 'primary-teacher']);
    expect(jobRulesConfig('it-professional')).toBeNull();
    expect(jobRulesConfig('dgfood')).toBeNull();
    expect(jobRulesConfig('ministries')).toBeNull();
    expect(jobRulesConfig('nasa-exam')).toBeNull();
  });

  it('carries the exact Step 3 §2.2 verified figures', () => {
    expect(JOB_RULES_CONFIGS.bcs).toMatchObject({
      questionCount: 200,
      timeMinutes: 120,
      marksPerQuestion: 1,
      negativeMarking: 0.5,
      provisionalNegativeMarking: null,
      negativeMarkingVerified: true,
      // 50th BCS syllabus (BPSC, 9 Dec 2025) — official PDF read
      // directly 24 Nov 2026; v1 was the pre-50th split.
      scoringConfigVersion: 'v2',
      patternVerifiedAt: '2026-11-24',
      passMark: null,
      passPercent: null,
      patternLabel: 'verified',
      patternStatus: 'verified',
      applicableCycle: null,
    });
    expect(JOB_RULES_CONFIGS.bank).toMatchObject({
      questionCount: 100,
      timeMinutes: 60,
      marksPerQuestion: 1,
      // −0.25 VERIFIED 24 Nov 2026 (Combined 11 Bank Officer
      // Circular 115/2025 + Bangladesh Bank AD Notice HRD-1
      // No. 38/2026, 4 May 2026) — it now drives scoring.
      negativeMarking: 0.25,
      provisionalNegativeMarking: null,
      negativeMarkingVerified: true,
      scoringConfigVersion: 'v1',
      patternVerifiedAt: '2026-11-24',
      passMark: null,
      passPercent: null,
      patternLabel: 'verified',
      patternStatus: 'verified',
      applicableCycle: null,
    });
    expect(JOB_RULES_CONFIGS['primary-teacher']).toMatchObject({
      questionCount: 90,
      timeMinutes: 90,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      provisionalNegativeMarking: null,
      negativeMarkingVerified: true,
      // −0.25 citation fixed 24 Nov 2026: Jan 2026 DPE exam notice /
      // admit card (the Rules do not specify the rate).
      patternVerifiedAt: '2026-11-24',
      passMark: 45,
      passPercent: 50,
      patternLabel: 'verified',
      patternStatus: 'verified',
      applicableCycle: null,
    });
    expect(JOB_RULES_CONFIGS.ntrca).toMatchObject({
      questionCount: 100,
      timeMinutes: 60,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      provisionalNegativeMarking: null,
      negativeMarkingVerified: true,
      passMark: 40,
      passPercent: 40,
      patternLabel: 'last-verified-18th',
      patternStatus: 'last_verified',
      applicableCycle: '18th',
    });
  });

  it('a verified config never carries an unverified penalty in negativeMarking (P1-4)', () => {
    for (const cfg of Object.values(JOB_RULES_CONFIGS)) {
      if (cfg.negativeMarkingVerified === false) {
        expect(cfg.negativeMarking).toBeNull();
      }
      if (cfg.patternStatus === 'verified') {
        expect(cfg.negativeMarkingVerified).toBe(true);
      }
    }
  });

  it('every subject list sums to questionCount', () => {
    for (const cfg of Object.values(JOB_RULES_CONFIGS)) {
      const sum = cfg.subjects.reduce((a, r) => a + r.marks, 0);
      expect(sum).toBe(cfg.questionCount);
      expect(cfg.subjects.length).toBeGreaterThan(0);
      for (const row of cfg.subjects) {
        expect(Number.isInteger(row.marks)).toBe(true);
        expect(row.marks).toBeGreaterThan(0);
      }
    }
  });

  it('subject lists match EXAM_PATTERNS row-for-row (names + marks)', () => {
    for (const [slug, cfg] of Object.entries(JOB_RULES_CONFIGS)) {
      const pattern = EXAM_PATTERNS[slug];
      expect(pattern).toBeDefined();
      expect(cfg.subjects).toHaveLength(pattern!.rows.length);
      pattern!.rows.forEach((row, i) => {
        expect(cfg.subjects[i].nameBn).toBe(row.subjectBn);
        expect(cfg.subjects[i].nameEn).toBe(row.subjectEn);
        expect(cfg.subjects[i].marks).toBe(bnToNum(row.marks));
      });
    }
  });
});

describe('IT hub def (Step 5 — Step 2 §2.9, scope undecided)', () => {
  it('exists with tier 3, no official URL, the #1E3A5F accent triple, no pattern, no rulesConfig', () => {
    const def = jobExamBySlug('it-professional');
    expect(def).toBeDefined();
    expect(def!.tier).toBe(3);
    expect(def!.officialUrl).toBeNull();
    expect(def!.accent).toBe('#1E3A5F');
    expect(def!.accentSoft).toBe('#E8EDF3');
    expect(def!.accentDeep).toBe('#152A45');
    expect(def!.stepsBn).toBe('বিজ্ঞপ্তি অনুযায়ী');
    expect(EXAM_PATTERNS['it-professional']).toBeUndefined();
    expect(jobRulesConfig('it-professional')).toBeNull();
    expect(jobCategoryOfExam('it-professional')).toBe('it-professional');
  });

  it('is scope_pending, not selectable, and NOT syllabus-ready (Step 5 closure, P1-5)', () => {
    const def = jobExamBySlug('it-professional')!;
    expect(def.scopeStatus).toBe('scope_pending');
    expect(jobPatternStatus('it-professional')).toBe('scope_pending');
    expect(jobApplicableCycle('it-professional')).toBeNull();
    expect(SELECTABLE_TARGET_EXAMS).not.toContain('it-professional');
    expect(jobExamSyllabusReady('it-professional')).toBe(false);
  });
});

describe('pattern status + applicable cycle (Step 5 closure, P1-3/P1-8)', () => {
  it('every exam has exactly one pattern status; null configs are explained, never silent', () => {
    expect(jobPatternStatus('bcs')).toBe('verified');
    expect(jobPatternStatus('bank')).toBe('verified');
    expect(jobPatternStatus('primary-teacher')).toBe('verified');
    expect(jobPatternStatus('ntrca')).toBe('last_verified');
    expect(jobPatternStatus('it-professional')).toBe('scope_pending');
    for (const slug of ['dgfood', 'bpsc-non-cadre', 'cag', 'bfsa', 'others', 'ministries', 'defence', 'autonomous', 'private-ngo']) {
      expect(jobPatternStatus(slug)).toBe('not_verified');
    }
    // Unknown slugs fail closed — never 'verified' by default.
    expect(jobPatternStatus('nasa-exam')).toBe('not_verified');
    // The no-config map covers exactly the 10 exams without a config.
    expect(Object.keys(JOB_PATTERN_STATUS).sort()).toEqual(
      JOB_EXAMS.map((e) => e.slug)
        .filter((s) => jobRulesConfig(s) === null)
        .sort(),
    );
  });

  it('applicableCycle is set only where the pattern is tied to a cycle (NTRCA 18th)', () => {
    expect(jobApplicableCycle('ntrca')).toBe('18th');
    for (const slug of JOB_EXAMS.map((e) => e.slug).filter((s) => s !== 'ntrca')) {
      expect(jobApplicableCycle(slug)).toBeNull();
    }
  });

  it('scopeStatus is defined for 14 exams, scope_pending for IT only', () => {
    const defined = JOB_EXAMS.filter((e) => e.scopeStatus === 'defined');
    expect(defined).toHaveLength(14);
    expect(JOB_EXAMS.filter((e) => e.scopeStatus === 'scope_pending').map((e) => e.slug)).toEqual([
      'it-professional',
    ]);
    for (const def of defined) expect(jobExamSyllabusReady(def.slug)).toBe(true);
  });
});

describe('status vs reviewStatus (Step 5 closure, P1-1)', () => {
  it('isDraftJobReviewStatus accepts exactly the three draft workflow states', () => {
    expect(JOB_DRAFT_REVIEW_STATES).toEqual(['Not Started', 'In Progress', 'Under Review']);
    expect(JOB_REVIEW_STATES).toEqual([
      'Not Started',
      'In Progress',
      'Under Review',
      'Published',
    ]);
    for (const state of JOB_REVIEW_STATES) {
      expect(isDraftJobReviewStatus(state)).toBe(state !== 'Published');
    }
  });

  it('rejects Published, unknown, missing and non-string states', () => {
    expect(isDraftJobReviewStatus('Published')).toBe(false);
    expect(isDraftJobReviewStatus('draft')).toBe(false); // the §3.3 literal — no such enum value
    expect(isDraftJobReviewStatus('')).toBe(false);
    expect(isDraftJobReviewStatus('not started')).toBe(false);
    expect(isDraftJobReviewStatus(undefined)).toBe(false);
    expect(isDraftJobReviewStatus(null)).toBe(false);
    expect(isDraftJobReviewStatus(0)).toBe(false);
    expect(isDraftJobReviewStatus({})).toBe(false);
  });
});

describe('seed JSON (Step 5 — team/job-categories-exams-seed.json, disk only)', () => {
  it('holds 10 categories + 15 exams', () => {
    expect(Object.keys(SEED.jobCategories)).toHaveLength(10);
    expect(Object.keys(SEED.jobExams)).toHaveLength(15);
  });

  it('category docs match the canonical JOB_CATEGORIES (order 1–10, hubs, accents, status active)', () => {
    JOB_CATEGORIES.forEach((cat, i) => {
      const doc = SEED.jobCategories[cat.slug];
      expect(doc).toBeDefined();
      expect(doc).toMatchObject({
        nameBn: cat.bn,
        nameEn: cat.en,
        order: i + 1,
        hubSlugs: cat.hubSlugs,
        accent: cat.accent,
        accentSoft: cat.accentSoft,
        accentDeep: cat.accentDeep,
        descriptionBn: cat.descriptionBn,
        descriptionEn: cat.descriptionEn,
        status: 'active',
      });
    });
    const orders = Object.values(SEED.jobCategories).map((d) => d.order as number);
    expect([...orders].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('exam docs match the canonical JOB_EXAMS + category + draft status', () => {
    for (const def of JOB_EXAMS) {
      const doc = SEED.jobExams[def.slug];
      expect(doc).toBeDefined();
      expect(doc).toMatchObject({
        slug: def.slug,
        nameBn: def.bn,
        nameEn: def.en,
        fullBn: def.fullBn,
        fullEn: def.fullEn,
        orgBn: def.orgBn,
        orgEn: def.orgEn,
        stepsBn: def.stepsBn,
        stepsEn: def.stepsEn,
        officialUrl: def.officialUrl,
        categoryId: jobCategoryOfExam(def.slug),
        tier: def.tier,
        accent: def.accent,
        accentSoft: def.accentSoft,
        accentDeep: def.accentDeep,
        status: 'draft',
        reviewStatus: 'Not Started',
        rulesConfigHistory: [],
        syllabusSource: null,
        // Step 5 closure, P1-3/P1-5/P1-8: every null config is
        // explained by patternStatus; IT is scope_pending.
        patternStatus: jobPatternStatus(def.slug),
        applicableCycle: jobApplicableCycle(def.slug),
        scopeStatus: def.scopeStatus,
      });
    }
  });

  it('seed Bank config carries the VERIFIED −0.25 penalty (24 Nov 2026 audit)', () => {
    const bank = SEED.jobExams.bank.rulesConfig as Record<string, unknown>;
    expect(bank.negativeMarking).toBe(0.25);
    expect(bank.provisionalNegativeMarking).toBeNull();
    expect(bank.negativeMarkingVerified).toBe(true);
    expect(bank.patternStatus).toBe('verified');
    expect(bank.scoringConfigVersion).toBe('v1');
    expect(bank.patternVerifiedAt).toBe('2026-11-24');
  });

  it('seed rulesConfig equals JOB_RULES_CONFIGS for the 4 verified exams, null for the rest', () => {
    for (const def of JOB_EXAMS) {
      const doc = SEED.jobExams[def.slug];
      if (def.slug in JOB_RULES_CONFIGS) {
        expect(doc.rulesConfig).toEqual(JOB_RULES_CONFIGS[def.slug]);
      } else {
        expect(doc.rulesConfig).toBeNull();
      }
    }
  });
});

describe('central bank exam keys (§1.2)', () => {
  it('EXAM_KEYS is the 7 canonical keys (6 verified + grade_11_20 virtual)', () => {
    expect(EXAM_KEYS).toEqual([
      'bcs', 'bank', 'bank-senior-officer', 'bank-assistant-director',
      'primary-teacher', 'ntrca', 'grade_11_20',
    ]);
    expect(VERIFIED_EXAM_KEYS).toEqual([
      'bcs', 'bank', 'bank-senior-officer', 'bank-assistant-director',
      'primary-teacher', 'ntrca',
    ]);
    expect(VIRTUAL_EXAM_KEYS).toEqual(['grade_11_20']);
  });
  it('grade_11_20 is virtual: no JOB_EXAMS entry and no rulesConfig entry', () => {
    expect(isVirtualExamKey('grade_11_20')).toBe(true);
    expect(isVirtualExamKey('bcs')).toBe(false);
    expect(jobExamBySlug('grade_11_20')).toBeUndefined();
    expect(jobRulesConfig('grade_11_20')).toBeNull();
    expect('grade_11_20' in JOB_RULES_CONFIGS).toBe(false);
    expect(isExamKey('grade_11_20')).toBe(true);
    expect(isExamKey('dgfood')).toBe(false);
  });
  it('the verified keys are exactly the keys with a JOB_RULES_CONFIGS entry', () => {
    expect(VERIFIED_EXAM_KEYS.slice().sort()).toEqual(Object.keys(JOB_RULES_CONFIGS).sort());
  });
});
