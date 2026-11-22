/**
 * Eduvelto unit tests — NU admission structure + admin seed flow
 * (NU-5; design doc §2, §5, §10, §15.1, §19.2.1–§19.2.2).
 * Pure functions only — no Firestore, no network.
 * Run: npx vitest run src/lib/__tests__/nuStructure.test.ts
 */
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  NU_DASHBOARD_ROUTE,
  NU_HUB_ROUTE,
  NU_HUB_TABS,
  NU_HUB_TAB_LABELS,
  NU_PROHIBITED_WORDINGS,
  NU_VERIFIED_NOTICE,
  NU_CALENDAR_EVENTS,
  isNuHubTab,
  nuAllCopyStrings,
  nuExamPattern,
  nuGroupSeeds,
  nuGroupSubjects,
  nuInstitutionSeed,
  nuSeedDocs,
  validateNuCircularConfigDoc,
  validateNuGroupDoc,
  validateNuInstitutionDoc,
} from '../nuStructure';
import {
  nuSeedDocMatches,
  nuSeedValueKey,
  validateNuSeedDoc,
  validateNuSeedSet,
} from '../nuAdmin';
import { nuFullMockConfigSeed, nuDailyMockConfigSeed, validateNuExamConfig } from '../nuExamConfig';
import { NU_GROUPS } from '../nuProfile';

describe('NU-5 seed set (design §19.2.1–§19.2.2)', () => {
  it('has exactly 7 docs: 1 institution + 3 groups + 2 exam configs + 1 circular', () => {
    const seeds = nuSeedDocs();
    expect(seeds).toHaveLength(7);
    const byCollection = (c: string) => seeds.filter((s) => s.collection === c).length;
    expect(byCollection('nuInstitutions')).toBe(1);
    expect(byCollection('nuGroups')).toBe(3);
    expect(byCollection('nuExamConfigs')).toBe(2);
    expect(byCollection('nuCircularConfigs')).toBe(1);
  });

  it('the whole seed set validates clean — every doc, zero problems', () => {
    expect(validateNuSeedSet()).toEqual([]);
    for (const seed of nuSeedDocs()) {
      expect(validateNuSeedDoc(seed)).toEqual([]);
    }
  });

  it('the full-mock config is the verified pattern: 100 / 60 min / 20+20+20+40 / no negative / pass 35 display-only', () => {
    const cfg = nuFullMockConfigSeed();
    expect(validateNuExamConfig(cfg)).toEqual([]);
    expect(cfg.totalQuestions).toBe(100);
    expect(cfg.durationSeconds).toBe(3600);
    expect(cfg.marking.negativeMarking).toBe(false);
    expect(cfg.passMark).toEqual({ value: 35, displayOnly: true });
    expect(cfg.sections).toEqual({
      bangla: 20,
      english: 20,
      generalKnowledge: 20,
      groupSubjects: 40,
      groupSubjectsDetail: null,
    });
    expect(cfg.vivaEnabled).toBe(false);
    expect(cfg.officialRankEnabled).toBe(false);
  });

  it('the daily-mock config is a draft: 25 MCQ / 25 minutes', () => {
    const cfg = nuDailyMockConfigSeed();
    expect(validateNuExamConfig(cfg)).toEqual([]);
    expect(cfg.examType).toBe('NU_DAILY');
    expect(cfg.totalQuestions).toBe(25);
    expect(cfg.durationSeconds).toBe(1500);
    expect(cfg.status).toBe('draft');
  });

  it('group seeds match the group definitions (accent, name, exam config, circular)', () => {
    const seeds = nuGroupSeeds();
    for (const g of NU_GROUPS) {
      const s = seeds[g.slug];
      expect(s.slug).toBe(g.slug);
      expect(s.nameBn).toBe(g.bn);
      expect(s.accentColor).toBe(g.accent);
      expect(s.institutionId).toBe('national-university');
      expect(s.examConfigId).toBe('nu-admission-full-2025-26-v1');
      expect(s.circularVersion).toBe('nu-2025-26-v1');
      expect(s.status).toBe('published');
      expect(validateNuGroupDoc(s)).toEqual([]);
    }
  });

  it('institution seed is National University, active, priority 1, official URL', () => {
    const inst = nuInstitutionSeed();
    expect(inst.slug).toBe('national-university');
    expect(inst.nameBn).toBe('জাতীয় বিশ্ববিদ্যালয়');
    expect(inst.officialUrl).toBe('https://www.nu.ac.bd/admissions');
    expect(inst.status).toBe('active');
    expect(inst.priority).toBe(1);
    expect(validateNuInstitutionDoc(inst)).toEqual([]);
  });
});

describe('NU-5 validators catch wrong values', () => {
  it('an 80-question full config is rejected', () => {
    const bad = { ...nuFullMockConfigSeed(), totalQuestions: 80 };
    expect(validateNuExamConfig(bad)).toContain('NU_ADMISSION totalQuestions must be 100');
  });

  it('a negative-marking config is rejected', () => {
    const bad = {
      ...nuFullMockConfigSeed(),
      marking: { correct: 1, incorrect: -0.5, unanswered: 0, negativeMarking: true },
    };
    expect(validateNuExamConfig(bad).join(' ')).toMatch(/negativeMarking/);
  });

  it('a non-null group-40 sub-split is rejected (Blocker B)', () => {
    const bad = {
      ...nuFullMockConfigSeed(),
      sections: { ...nuFullMockConfigSeed().sections, groupSubjectsDetail: { physics: 17 } },
    };
    expect(validateNuExamConfig(bad).join(' ')).toMatch(/groupSubjectsDetail must be null/);
  });

  it('a group with a bad slug is rejected', () => {
    const bad = { ...nuGroupSeeds().science, slug: 'arts' };
    expect(validateNuGroupDoc(bad).join(' ')).toMatch(/slug must be humanities\/science\/business/);
  });

  it('a circular config carrying an exam date is rejected (never announced)', () => {
    const bad = { ...nuSeedDocs().find((s) => s.collection === 'nuCircularConfigs')!.payload, examDate: '2026-04-25' };
    expect(validateNuCircularConfigDoc(bad).join(' ')).toMatch(/examDate must be null/);
  });

  it('a circular config with a non-official source is rejected', () => {
    const bad = { ...nuSeedDocs().find((s) => s.collection === 'nuCircularConfigs')!.payload, sourceType: 'blog' };
    expect(validateNuCircularConfigDoc(bad).join(' ')).toMatch(/official_circular/);
  });
});

describe('NU-5 exam pattern + group subjects (design §5.2–§5.3)', () => {
  it('pattern sections sum to the total: 20+20+20+40 = 100', () => {
    const p = nuExamPattern();
    expect(p.totalQuestions).toBe(100);
    expect(p.durationMinutes).toBe(60);
    expect(p.passMark).toBe(35);
    expect(p.sections.reduce((sum, s) => sum + s.marks, 0)).toBe(p.totalQuestions);
  });

  it('every group has the 3 common subjects + ONE group-40 block, never an invented split', () => {
    for (const g of NU_GROUPS) {
      const subjects = nuGroupSubjects(g.slug);
      expect(subjects).toHaveLength(4);
      expect(subjects.filter((s) => !s.isGroupBlock).map((s) => s.nameBn)).toEqual([
        'বাংলা',
        'ইংরেজি',
        'সাধারণ জ্ঞান',
      ]);
      const blocks = subjects.filter((s) => s.isGroupBlock);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].nameBn).toBe('শাখা-ভিত্তিক প্রশ্ন (৪০)');
    }
  });
});

describe('NU-5 prohibited wording (design §15.1)', () => {
  it('no forbidden phrase appears in any exported NU-5 copy string', () => {
    for (const copy of nuAllCopyStrings()) {
      for (const banned of NU_PROHIBITED_WORDINGS) {
        expect(copy).not.toContain(banned);
      }
    }
  });

  it('the verified notice carries the closed window, not an open one', () => {
    expect(NU_VERIFIED_NOTICE.applicationStatusBn).toBe('আবেদন শেষ');
    expect(NU_VERIFIED_NOTICE.applicationEndBn).toContain('৩১ ডিসেম্বর ২০২৫');
  });

  it('the calendar has only historical events — no exam-date event', () => {
    expect(NU_CALENDAR_EVENTS).toHaveLength(2);
    for (const e of NU_CALENDAR_EVENTS) {
      expect(e.stateBn).toContain('ইতিহাস');
    }
    expect(JSON.stringify(NU_CALENDAR_EVENTS)).not.toContain('২৫ এপ্রিল');
  });
});

describe('NU-5 routes + tabs (NU-Q6 final)', () => {
  it('dashboard route is /admissions/dashboard (NU-Q6)', () => {
    expect(NU_DASHBOARD_ROUTE).toBe('/admissions/dashboard');
    expect(NU_HUB_ROUTE).toBe('/admissions/national-university');
  });

  it('the hub has exactly 8 tabs', () => {
    expect(NU_HUB_TABS).toHaveLength(8);
    expect(NU_HUB_TABS).toEqual([
      'home',
      'groups',
      'practice',
      'mock-tests',
      'previous-questions',
      'results',
      'progress',
      'notices',
    ]);
    for (const tab of NU_HUB_TABS) {
      expect(NU_HUB_TAB_LABELS[tab].bn.length).toBeGreaterThan(0);
      expect(NU_HUB_TAB_LABELS[tab].en.length).toBeGreaterThan(0);
      expect(isNuHubTab(tab)).toBe(true);
    }
  });

  it('group slugs are NOT hub tabs (the static group routes rank above :tab)', () => {
    expect(isNuHubTab('science')).toBe(false);
    expect(isNuHubTab('humanities')).toBe(false);
    expect(isNuHubTab('business')).toBe(false);
    expect(isNuHubTab('xyz')).toBe(false);
  });
});

describe('NU-5 seed read-back comparison (nuAdmin)', () => {
  it('an identical live doc matches; a changed value differs; null never matches', () => {
    const seed = nuSeedDocs()[0];
    expect(nuSeedDocMatches(seed.payload, seed)).toBe(true);
    expect(nuSeedDocMatches({ ...seed.payload, priority: 2 }, seed)).toBe(false);
    expect(nuSeedDocMatches(null, seed)).toBe(false);
  });

  it('a Timestamp and the same moment as an ISO string compare equal', () => {
    const circular = nuSeedDocs().find((s) => s.collection === 'nuCircularConfigs')!;
    const live = {
      ...circular.payload,
      applicationStart: Timestamp.fromDate(new Date('2025-11-23T16:00:00+06:00')),
      applicationEnd: Timestamp.fromDate(new Date('2025-12-31T23:59:59+06:00')),
    };
    expect(nuSeedDocMatches(live, circular)).toBe(true);
    expect(nuSeedValueKey(Timestamp.fromMillis(1000))).toBe(nuSeedValueKey(new Date(1000).toISOString()));
  });
});
