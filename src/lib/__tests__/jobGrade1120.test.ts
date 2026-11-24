/**
 * Eduvelto Job Preparation — Grades 11–20 hub unit tests
 * (design-grades-written-previous-admin.md §7 steps 1–2).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  GRADE_11_20_CONFIGS,
  grade1120ConfigsForFamily,
  grade1120ConfigCanDriveScoredMock,
  jobExamBySlug,
  jobPatternStatus,
} from '../jobExams';
import {
  GRADE_11_20_POST_FAMILIES,
  grade1120FamilyBySlug,
  grade1120GradeBandOf,
  grade1120VerificationLabel,
  grade1120AvailableFilterValues,
  filterGrade1120Directory,
  GRADE_11_20_EMPTY_FILTERS,
  GRADE_11_20_STAGES_NOT_VERIFIED,
  GRADE_11_20_EMPTY_RESULTS,
  grade1120PreparationLinks,
} from '../jobGrade1120';

const JOB_EXAMS_SRC = readFileSync(
  fileURLToPath(new URL('../jobExams.ts', import.meta.url)),
  'utf8',
);
const GRADE_11_20_SRC = readFileSync(
  fileURLToPath(new URL('../jobGrade1120.ts', import.meta.url)),
  'utf8',
);

describe('grade-11-20 hub slug (design §1.1)', () => {
  it('exists in JOB_EXAMS with the exact design wording', () => {
    const def = jobExamBySlug('grade-11-20');
    expect(def).toBeDefined();
    expect(def?.bn).toBe('সরকারি চাকরি (১১–২০ গ্রেড)');
    expect(def?.en).toBe('Government Jobs (Grades 11–20)');
    expect(def?.fullBn).toBe('সরকারি চাকরি প্রস্তুতি — ১১তম থেকে ২০তম গ্রেড');
    expect(def?.fullEn).toBe('Government Job Preparation — Grades 11–20');
    expect(def?.orgBn).toBe('বিভিন্ন মন্ত্রণালয়, অধিদপ্তর ও সংস্থা');
    expect(def?.orgEn).toBe('Various ministries, departments and organisations');
    expect(def?.stepsBn).toBe('বিজ্ঞপ্তি অনুযায়ী');
    expect(def?.stepsEn).toBe('As per circular');
    expect(def?.officialUrl).toBeNull();
    expect(def?.tier).toBe(3);
    expect(def?.scopeStatus).toBe('defined');
  });

  it('accent is AA for white text (≥ 4.5:1, measured)', () => {
    const def = jobExamBySlug('grade-11-20');
    const hex = def?.accent ?? '';
    const lum = (h: string): number => {
      const c = h.replace('#', '');
      const f = (i: number): number => {
        const v = parseInt(c.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
    };
    const contrast = 1.05 / (lum(hex) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it('has no verified pattern of its own', () => {
    expect(jobPatternStatus('grade-11-20')).toBe('not_verified');
  });
});

describe('Grade1120ExamConfig (design §1.4)', () => {
  it('GRADE_11_20_CONFIGS starts GRADE_11_20_EMPTY_FILTERS — zero configs until a source is verified', () => {
    expect(GRADE_11_20_CONFIGS).toEqual([]);
    for (const f of GRADE_11_20_POST_FAMILIES) {
      expect(grade1120ConfigsForFamily(f.slug)).toEqual([]);
    }
  });

  it('only a verified config may drive a scored mock', () => {
    const base = {
      configId: 'oa-typist__x-2020',
      postFamilySlug: 'office-assistant-typist',
      postFamilyBn: 'অফিস সহকারী-কাম-কম্পিউটার মুদ্রাক্ষরিক',
      postFamilyEn: 'Office Assistant-cum-Computer Typist',
      authorityId: 'x',
      authorityBn: 'কর্তৃপক্ষ',
      authorityEn: 'Authority',
      gradeRange: null,
      source: { type: 'gazette' as const, title: 'Gazette', url: null, publicationDate: null },
      verifiedAt: null,
      verifiedBy: null,
      applicableCircular: null,
      stages: [],
      scoringConfigVersion: 'v1',
      patternLabel: 'verified',
    };
    expect(grade1120ConfigCanDriveScoredMock({ ...base, verificationStatus: 'verified' })).toBe(true);
    expect(grade1120ConfigCanDriveScoredMock({ ...base, verificationStatus: 'partially-verified' })).toBe(false);
    expect(grade1120ConfigCanDriveScoredMock({ ...base, verificationStatus: 'not-verified' })).toBe(false);
  });

  it('the 2026 draft standardisation figures appear NOWHERE in the hub/config code', () => {
    // The draft proposal (100 written + 50 viva for Grades 11–12;
    // 60 + 40 for 13–16; 25 + 25 for 17–20) must not be implemented
    // — not in code, not in a config, not in UI copy. The only
    // allowed mention is this test + the prohibition comment itself.
    for (const src of [JOB_EXAMS_SRC, GRADE_11_20_SRC]) {
      expect(src).not.toContain('100+50');
      expect(src).not.toContain('60+40');
      expect(src).not.toContain('25+25');
      expect(src).not.toMatch(/100 written \+ 50 viva/i);
      expect(src).not.toMatch(/60 written \+ 40 viva/i);
      expect(src).not.toMatch(/25 written \+ 25 viva/i);
    }
  });
});

describe('post families (design §1.3)', () => {
  it('has exactly the 6 first-release families, in priority order', () => {
    expect(GRADE_11_20_POST_FAMILIES.map((f) => f.slug)).toEqual([
      'office-assistant-typist',
      'computer-operator',
      'data-entry-operator',
      'office-support-staff',
      'accounts-assistant',
      'stenographer',
    ]);
  });

  it('every family is not-verified in release 1', () => {
    for (const f of GRADE_11_20_POST_FAMILIES) {
      expect(f.verificationStatus).toBe('not-verified');
    }
  });

  it('office-support-staff has no practical block (E-2)', () => {
    const f = grade1120FamilyBySlug('office-support-staff');
    expect(f?.practicalSkill).toBe('none');
  });

  it('data-entry-operator and office-support-staff offer no written block', () => {
    expect(grade1120FamilyBySlug('data-entry-operator')?.offers.written).toBe(false);
    expect(grade1120FamilyBySlug('office-support-staff')?.offers.written).toBe(false);
    expect(grade1120FamilyBySlug('office-assistant-typist')?.offers.written).toBe(true);
  });

  it('unknown slug returns undefined', () => {
    expect(grade1120FamilyBySlug('driver')).toBeUndefined();
  });
});

describe('verification labels (design §1.5 — exact wording)', () => {
  it('verified label', () => {
    const l = grade1120VerificationLabel('verified');
    expect(l.chipBn).toBe('যাচাইকৃত');
    expect(l.chipEn).toBe('Verified');
    expect(l.meaningBn).toContain('অফিসিয়াল গেজেট');
  });

  it('partially-verified label', () => {
    const l = grade1120VerificationLabel('partially-verified');
    expect(l.chipBn).toBe('আংশিক যাচাইকৃত');
    expect(l.meaningBn).toContain('কিছু তথ্য যাচাই হয়েছে, কিছু হয়নি');
  });

  it('not-yet-verified label', () => {
    const l = grade1120VerificationLabel('not-verified');
    expect(l.chipBn).toBe('এখনো যাচাই হয়নি');
    expect(l.meaningBn).toContain('কোনো নির্ভরযোগ্য সরকারি সূত্র এখনো পাওয়া যায়নি');
    expect(l.meaningEn).toContain('No authoritative government source');
  });

  it('stages line for not-verified families', () => {
    expect(GRADE_11_20_STAGES_NOT_VERIFIED.bn).toBe('ধাপ বিজ্ঞপ্তি অনুযায়ী — এখনো যাচাই হয়নি');
    expect(GRADE_11_20_STAGES_NOT_VERIFIED.en).toBe('Stages follow the circular — not yet verified');
  });
});

describe('post directory filters (design §1.6)', () => {
  it('empty filters return all 6 families', () => {
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, GRADE_11_20_EMPTY_FILTERS)).toHaveLength(6);
  });

  it('free text matches Bn name, En name and keywords, case-insensitive', () => {
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, query: 'মুদ্রাক্ষরিক' }).map((f) => f.slug)).toEqual([
      'office-assistant-typist',
    ]);
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, query: 'STENOGRAPHER' }).map((f) => f.slug)).toEqual([
      'stenographer',
    ]);
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, query: 'cashier' }).map((f) => f.slug)).toEqual([
      'accounts-assistant',
    ]);
  });

  it('skill filter narrows to the matching practical skill', () => {
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, skill: 'typing' }).map((f) => f.slug)).toEqual([
      'office-assistant-typist',
      'data-entry-operator',
    ]);
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, skill: 'shorthand' }).map((f) => f.slug)).toEqual([
      'stenographer',
    ]);
  });

  it('family filter picks one family', () => {
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, family: 'computer-operator' })).toHaveLength(1);
  });

  it('grade band: every family is unstated in release 1 (E-9 — never forced into a band)', () => {
    for (const f of GRADE_11_20_POST_FAMILIES) expect(grade1120GradeBandOf(f)).toBe('unstated');
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, gradeBand: '11-12' })).toHaveLength(0);
    expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, gradeBand: 'unstated' })).toHaveLength(6);
  });

  it('exam-type filter never excludes a not-verified family silently', () => {
    for (const t of ['written-only', 'written-practical', 'written-viva'] as const) {
      expect(filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, { ...GRADE_11_20_EMPTY_FILTERS, examType: t })).toHaveLength(6);
    }
  });

  it('no filter value can appear empty: verified-config values are empty in release 1', () => {
    const v = grade1120AvailableFilterValues();
    expect(v.gradeBands).toEqual([]);
    expect(v.authorities).toEqual([]);
    expect(v.skills).toEqual([]);
  });

  it('empty-results copy is exact', () => {
    expect(GRADE_11_20_EMPTY_RESULTS.bn).toBe(
      'এই খোঁজে কোনো পদ পাওয়া যায়নি — ফিল্টার কমিয়ে আবার চেষ্টা করুন।',
    );
    expect(GRADE_11_20_EMPTY_RESULTS.en).toBe(
      'No post matches this search — loosen the filters and try again.',
    );
  });

  it('preparation links: a missing kind is a muted null, never a dead link', () => {
    const links = grade1120PreparationLinks(grade1120FamilyBySlug('office-support-staff')!);
    expect(links.find((l) => l.key === 'written')?.href).toBeNull();
    expect(links.find((l) => l.key === 'mcq')?.href).toBe('/jobs/common');
    const typist = grade1120PreparationLinks(grade1120FamilyBySlug('office-assistant-typist')!);
    expect(typist.find((l) => l.key === 'written')?.href).toBe('/jobs/grade-11-20/written');
  });
});
