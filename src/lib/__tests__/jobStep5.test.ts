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
 *      marks converted), Bank's negative-marking flag false;
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
  EXAM_PATTERNS,
  JOB_RULES_CONFIGS,
  jobRulesConfig,
  jobExamBySlug,
} from '../jobExams';
import {
  JOB_CATEGORIES,
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
  it('has 10 groups in order 1–10, covering all 14 exams exactly once', () => {
    const groups = jobCategoryGroups();
    expect(groups).toHaveLength(10);
    expect(groups.map((g) => g.category.slug)).toEqual(JOB_CATEGORIES.map((c) => c.slug));
    const allSlugs = groups.flatMap((g) => g.exams.map((e) => e.slug));
    expect(allSlugs).toHaveLength(14);
    expect(new Set(allSlugs).size).toBe(14);
    expect([...allSlugs].sort()).toEqual(JOB_EXAMS.map((e) => e.slug).sort());
  });

  it('group 2 (govt) holds 4 hubs; group 9 (it-professional) holds 1', () => {
    const groups = jobCategoryGroups();
    expect(groups[1].exams.map((e) => e.slug)).toEqual([
      'ministries',
      'dgfood',
      'cag',
      'bfsa',
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
      negativeMarkingVerified: true,
      passMark: null,
      passPercent: null,
      patternLabel: 'verified',
    });
    expect(JOB_RULES_CONFIGS.bank).toMatchObject({
      questionCount: 100,
      timeMinutes: 60,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      // Circular-dependent: "usually 0.25" — flag stays false.
      negativeMarkingVerified: false,
      passMark: null,
      passPercent: null,
      patternLabel: 'verified',
    });
    expect(JOB_RULES_CONFIGS['primary-teacher']).toMatchObject({
      questionCount: 90,
      timeMinutes: 90,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      negativeMarkingVerified: true,
      passMark: 45,
      passPercent: 50,
      patternLabel: 'verified',
    });
    expect(JOB_RULES_CONFIGS.ntrca).toMatchObject({
      questionCount: 100,
      timeMinutes: 60,
      marksPerQuestion: 1,
      negativeMarking: 0.25,
      negativeMarkingVerified: true,
      passMark: 40,
      passPercent: 40,
      patternLabel: 'last-verified-18th',
    });
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
});

describe('seed JSON (Step 5 — team/job-categories-exams-seed.json, disk only)', () => {
  it('holds 10 categories + 14 exams', () => {
    expect(Object.keys(SEED.jobCategories)).toHaveLength(10);
    expect(Object.keys(SEED.jobExams)).toHaveLength(14);
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
      });
    }
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
