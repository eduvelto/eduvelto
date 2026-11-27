// Lab Test Result Checker — engine + data tests (27 Nov 2026).
//
// Guards the interpreter in src/lib/healthTests.ts: boundary values,
// unit conversions, age/sex-specific ranges, unknown-slug fallback,
// and the data contract (every test has a range + 2-3 dated sources).
import { describe, it, expect } from 'vitest';
import {
  LAB_TESTS,
  LAB_PANELS,
  SYMPTOM_FINDER,
  convertUnit,
  interpretTest,
  labHistoryToCsv,
  labTestById,
  labTrendFor,
  searchLabTests,
  testsForSymptom,
} from '../../healthTests';

describe('lab test catalogue', () => {
  it('has 37 tests with unique ids', () => {
    expect(LAB_TESTS.length).toBe(37);
    const ids = LAB_TESTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every test bn/en copy, a range, sources and a check date', () => {
    for (const t of LAB_TESTS) {
      expect(t.nameBn.trim().length, `${t.id} nameBn`).toBeGreaterThan(0);
      expect(t.nameEn.trim().length, `${t.id} nameEn`).toBeGreaterThan(0);
      expect(t.measuresBn.trim().length, `${t.id} measuresBn`).toBeGreaterThan(0);
      expect(t.measuresEn.trim().length, `${t.id} measuresEn`).toBeGreaterThan(0);
      expect(t.rangeTextBn.trim().length, `${t.id} rangeTextBn`).toBeGreaterThan(0);
      expect(t.rangeTextEn.trim().length, `${t.id} rangeTextEn`).toBeGreaterThan(0);
      expect(t.sources.length, `${t.id} sources (need 2-3)`).toBeGreaterThanOrEqual(2);
      expect(t.sourceDate, `${t.id} sourceDate`).toBe('2026-11-27');
      expect(t.questionsBn.length, `${t.id} questionsBn`).toBeGreaterThanOrEqual(2);
      expect(t.questionsEn.length, `${t.id} questionsEn`).toBeGreaterThanOrEqual(2);
      expect(t.redFlagBn.trim().length, `${t.id} redFlagBn`).toBeGreaterThan(0);
      expect(t.repeatBn.trim().length, `${t.id} repeatBn`).toBeGreaterThan(0);
    }
  });

  it('gives every numeric test bands that cover all values with no gaps', () => {
    for (const t of LAB_TESTS.filter((x) => x.kind === 'numeric')) {
      for (const [age, sex] of [
        [undefined, undefined],
        [30, 'male'],
        [30, 'female'],
        [65, 'male'],
        [65, 'female'],
      ] as const) {
        const bands = t.bandsFor ? t.bandsFor(age, sex) : (t.bands ?? []);
        expect(bands.length, `${t.id} bands`).toBeGreaterThan(0);
        expect(bands[0].min, `${t.id} first band min`).toBeUndefined();
        expect(bands[bands.length - 1].max, `${t.id} last band max`).toBeUndefined();
        for (let i = 1; i < bands.length; i += 1) {
          expect(bands[i].min, `${t.id} band ${i} touches previous max`).toBe(bands[i - 1].max);
        }
        // Spot-check coverage: extreme values must match a band.
        for (const v of [-100, 0, 1, 100000]) {
          const hit = bands.some(
            (b) => (b.min === undefined || v >= b.min) && (b.max === undefined || v < b.max),
          );
          expect(hit, `${t.id} value ${v}`).toBe(true);
        }
      }
    }
  });

  it('gives every categorical test at least two categories', () => {
    for (const t of LAB_TESTS.filter((x) => x.kind === 'categorical')) {
      expect((t.categories ?? []).length, t.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('puts every test in a known panel, and every panel has a test', () => {
    const panelIds = new Set(LAB_PANELS.map((p) => p.id));
    for (const t of LAB_TESTS) expect(panelIds.has(t.panel), t.id).toBe(true);
    for (const p of LAB_PANELS) {
      expect(LAB_TESTS.some((t) => t.panel === p.id), p.id).toBe(true);
    }
  });

  it('searches by bn/en name, short name and keyword', () => {
    expect(searchLabTests('hba1c').map((t) => t.id)).toContain('hba1c');
    expect(searchLabTests('সুগার').map((t) => t.id)).toEqual(
      expect.arrayContaining(['fbs', 'rbs', 'hba1c']),
    );
    expect(searchLabTests('TSH').map((t) => t.id)).toContain('tsh');
    expect(searchLabTests('ডেঙ্গু').map((t) => t.id)).toContain('dengue-ns1');
    expect(searchLabTests('zzzz-no-match')).toEqual([]);
    expect(searchLabTests('').length).toBe(37);
  });
});

describe('interpretTest — diabetes boundaries (ADA 2025/2026)', () => {
  it('FBS: 99 normal, 100 prediabetes, 126 diabetes range, 54/53 critical', () => {
    expect(interpretTest({ testId: 'fbs', value: 99 }).band).toBe('normal');
    expect(interpretTest({ testId: 'fbs', value: 100 }).band).toBe('high');
    expect(interpretTest({ testId: 'fbs', value: 100 }).labelEn).toMatch(/prediabetes/i);
    expect(interpretTest({ testId: 'fbs', value: 125 }).band).toBe('high');
    expect(interpretTest({ testId: 'fbs', value: 126 }).band).toBe('high');
    expect(interpretTest({ testId: 'fbs', value: 126 }).labelEn).toMatch(/diabetes/i);
    expect(interpretTest({ testId: 'fbs', value: 54 }).band).toBe('low');
    expect(interpretTest({ testId: 'fbs', value: 53 }).band).toBe('critical');
    expect(interpretTest({ testId: 'fbs', value: 53 }).redFlag).toBe(true);
    expect(interpretTest({ testId: 'fbs', value: 250 }).band).toBe('critical');
  });

  it('HbA1c: 5.6 normal, 5.7 prediabetes, 6.5 diabetes range', () => {
    expect(interpretTest({ testId: 'hba1c', value: 5.6 }).band).toBe('normal');
    expect(interpretTest({ testId: 'hba1c', value: 5.7 }).band).toBe('high');
    expect(interpretTest({ testId: 'hba1c', value: 6.4 }).band).toBe('high');
    expect(interpretTest({ testId: 'hba1c', value: 6.5 }).band).toBe('high');
    expect(interpretTest({ testId: 'hba1c', value: 6.5 }).labelEn).toMatch(/diabetes/i);
  });

  it('OGTT: 139 normal, 140 IGT, 200 diabetes range; RBS: 200 diabetes range', () => {
    expect(interpretTest({ testId: 'ogtt', value: 139 }).band).toBe('normal');
    expect(interpretTest({ testId: 'ogtt', value: 140 }).band).toBe('high');
    expect(interpretTest({ testId: 'ogtt', value: 200 }).labelEn).toMatch(/diabetes/i);
    expect(interpretTest({ testId: 'rbs', value: 199 }).band).toBe('high');
    expect(interpretTest({ testId: 'rbs', value: 200 }).labelEn).toMatch(/diabetes/i);
  });
});

describe('interpretTest — age/sex-specific ranges', () => {
  it('haemoglobin: male 13 normal / 12.9 low; female 12 normal / 11.9 low', () => {
    expect(interpretTest({ testId: 'hemoglobin', value: 13, sex: 'male' }).band).toBe('normal');
    expect(interpretTest({ testId: 'hemoglobin', value: 12.9, sex: 'male' }).band).toBe('low');
    expect(interpretTest({ testId: 'hemoglobin', value: 12, sex: 'female' }).band).toBe('normal');
    expect(interpretTest({ testId: 'hemoglobin', value: 11.9, sex: 'female' }).band).toBe('low');
    expect(interpretTest({ testId: 'hemoglobin', value: 6.9 }).band).toBe('critical');
  });

  it('creatinine: male 1.35 normal / 1.36 high; female 1.04 normal / 1.05 high', () => {
    expect(interpretTest({ testId: 'creatinine', value: 1.35, sex: 'male' }).band).toBe('normal');
    expect(interpretTest({ testId: 'creatinine', value: 1.36, sex: 'male' }).band).toBe('high');
    expect(interpretTest({ testId: 'creatinine', value: 1.04, sex: 'female' }).band).toBe('normal');
    expect(interpretTest({ testId: 'creatinine', value: 1.05, sex: 'female' }).band).toBe('high');
  });

  it('HDL: male 40 normal / 39 low; female 50 normal / 49 low', () => {
    expect(interpretTest({ testId: 'hdl', value: 40, sex: 'male' }).band).toBe('normal');
    expect(interpretTest({ testId: 'hdl', value: 39, sex: 'male' }).band).toBe('low');
    expect(interpretTest({ testId: 'hdl', value: 50, sex: 'female' }).band).toBe('normal');
    expect(interpretTest({ testId: 'hdl', value: 49, sex: 'female' }).band).toBe('low');
  });

  it('ESR: under-50 male 15 normal / 16 high; over-50 female 30 normal / 31 high', () => {
    expect(interpretTest({ testId: 'esr', value: 15, age: 30, sex: 'male' }).band).toBe('normal');
    expect(interpretTest({ testId: 'esr', value: 16, age: 30, sex: 'male' }).band).toBe('high');
    expect(interpretTest({ testId: 'esr', value: 30, age: 65, sex: 'female' }).band).toBe('normal');
    expect(interpretTest({ testId: 'esr', value: 31, age: 65, sex: 'female' }).band).toBe('high');
    expect(interpretTest({ testId: 'esr', value: 100 }).band).toBe('critical');
  });

  it('TSH: 4.0 normal, 4.01 high; platelets 150000 normal, 149999 low, 49999 critical', () => {
    expect(interpretTest({ testId: 'tsh', value: 4.0 }).band).toBe('normal');
    expect(interpretTest({ testId: 'tsh', value: 4.01 }).band).toBe('high');
    expect(interpretTest({ testId: 'platelets', value: 150000 }).band).toBe('normal');
    expect(interpretTest({ testId: 'platelets', value: 149999 }).band).toBe('low');
    expect(interpretTest({ testId: 'platelets', value: 49999 }).band).toBe('critical');
    expect(interpretTest({ testId: 'wbc', value: 4000 }).band).toBe('normal');
    expect(interpretTest({ testId: 'wbc', value: 3999 }).band).toBe('low');
  });
});

describe('unit conversion', () => {
  it('glucose: 126 mg/dL = 7 mmol/L and back', () => {
    expect(convertUnit(126, 'glucose', 'mg/dL', 'mmol/L')).toBeCloseTo(7, 5);
    expect(convertUnit(7, 'glucose', 'mmol/L', 'mg/dL')).toBeCloseTo(126, 5);
    expect(convertUnit(100, 'glucose', 'mg/dL', 'mg/dL')).toBe(100);
  });

  it('cholesterol: 200 mg/dL ≈ 5.17 mmol/L; creatinine 1 mg/dL = 88.4 µmol/L; bilirubin 1 mg/dL = 17.1 µmol/L', () => {
    expect(convertUnit(200, 'cholesterol', 'mg/dL', 'mmol/L')).toBeCloseTo(5.17, 2);
    expect(convertUnit(1, 'creatinine', 'mg/dL', 'µmol/L')).toBeCloseTo(88.4, 5);
    expect(convertUnit(88.4, 'creatinine', 'µmol/L', 'mg/dL')).toBeCloseTo(1, 5);
    expect(convertUnit(1, 'bilirubin', 'mg/dL', 'µmol/L')).toBeCloseTo(17.1, 5);
    expect(convertUnit(5, 'glucose', 'mg/dL', 'kg')).toBeNull();
  });

  it('interprets an entered mmol/L value after converting (FBS 7 mmol/L → high)', () => {
    const r = interpretTest({ testId: 'fbs', value: 7, unit: 'mmol/L' });
    expect(r.band).toBe('high');
    expect(r.valueInPrimaryUnit).toBeCloseTo(126, 5);
    expect(r.primaryUnit).toBe('mg/dL');
  });

  it('rejects an unrecognised unit instead of guessing', () => {
    const r = interpretTest({ testId: 'fbs', value: 100, unit: 'kg' });
    expect(r.labelEn).toMatch(/not recognised/i);
  });
});

describe('interpretTest — categorical + fallback', () => {
  it('urine protein: Negative normal, Trace normal, 2+ high', () => {
    expect(interpretTest({ testId: 'urine-protein', categoryValue: 'Negative' }).band).toBe('normal');
    expect(interpretTest({ testId: 'urine-protein', categoryValue: 'Trace' }).band).toBe('normal');
    expect(interpretTest({ testId: 'urine-protein', categoryValue: '2+' }).band).toBe('high');
  });

  it('dengue NS1 positive is high + red flag; negative is normal', () => {
    const pos = interpretTest({ testId: 'dengue-ns1', categoryValue: 'Positive' });
    expect(pos.band).toBe('high');
    expect(pos.redFlag).toBe(true);
    expect(interpretTest({ testId: 'dengue-ns1', categoryValue: 'Negative' }).band).toBe('normal');
  });

  it('HBsAg positive is high + red flag; blood group A+ is informational normal', () => {
    expect(interpretTest({ testId: 'hbsag', categoryValue: 'Positive' }).redFlag).toBe(true);
    const bg = interpretTest({ testId: 'blood-group', categoryValue: 'A+' });
    expect(bg.band).toBe('normal');
    expect(bg.meaningEn).toMatch(/A positive/i);
  });

  it('unknown slug falls back to not-found; missing value prompts for one', () => {
    const r = interpretTest({ testId: 'not-a-test', value: 5 });
    expect(r.found).toBe(false);
    expect(r.labelEn).toMatch(/not found/i);
    expect(interpretTest({ testId: 'fbs' }).labelEn).toMatch(/Enter a value/i);
    expect(labTestById('nope')).toBeUndefined();
  });
});

describe('symptom finder + history helpers', () => {
  it('every symptom maps to real tests', () => {
    expect(SYMPTOM_FINDER.length).toBeGreaterThanOrEqual(8);
    for (const s of SYMPTOM_FINDER) {
      expect(s.testIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.testIds) expect(labTestById(id), `${s.id} -> ${id}`).toBeDefined();
      expect(testsForSymptom(s.id).length, s.id).toBe(s.testIds.length);
    }
    expect(testsForSymptom('no-such-symptom')).toEqual([]);
  });

  it('builds a CSV of history entries and a per-test trend', () => {
    const entries = [
      { id: 'a', testId: 'fbs', value: 90, unit: 'mg/dL', band: 'normal' as const, date: '2026-11-20' },
      { id: 'b', testId: 'fbs', value: 130, unit: 'mg/dL', band: 'high' as const, date: '2026-11-27' },
      { id: 'c', testId: 'tsh', value: 2, unit: 'mIU/L', band: 'normal' as const, date: '2026-11-25' },
    ];
    const csv = labHistoryToCsv(entries);
    expect(csv.split('\n')[0]).toBe('date,test,value,unit,band');
    expect(csv).toContain('Fasting Blood Sugar,130,mg/dL,high');
    const trend = labTrendFor(entries, 'fbs');
    expect(trend.map((e) => e.id)).toEqual(['a', 'b']);
  });
});
