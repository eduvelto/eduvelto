// Eduvelto — Job & Admission Prep tests (owner order 28 Nov 2026,
// 10:23). Guards the honest scope: verified patterns only, no
// guessed negative marking, no full mock where verified questions
// do not cover the syllabus, and a Recent & Most Repeated
// collection that holds ONLY the 35 bundled verified BCS English
// questions (the 173 46th BCS PYQs are in the Firestore bank, not
// the bundle — never faked into the count).

import { describe, expect, it } from 'vitest';
import {
  ADMISSION_STRUCTURE,
  BANK_STATE,
  RECENT_REPEATED_COUNT,
  RECENT_REPEATED_QUESTIONS,
  SYLLABUS_MOCK_EXAMS,
  admissionUnitByRoute,
  bundledVerifiedCount,
  syllabusMockPlan,
} from '../jobAdmissionPrep';

describe('admission structure (28 Nov 2026)', () => {
  it('covers DU Ka/Kha/Ga, Medical & Dental, BUET/CKRUET, GST A/B/C and Agriculture', () => {
    expect(ADMISSION_STRUCTURE.map((i) => i.slug)).toEqual([
      'du',
      'medical',
      'engineering',
      'gst',
      'agriculture',
    ]);
    const du = ADMISSION_STRUCTURE[0];
    expect(du.units.map((u) => u.slug)).toEqual(['ka', 'kha', 'ga']);
    expect(ADMISSION_STRUCTURE[1].units.map((u) => u.slug)).toEqual(['mbbs', 'bds']);
    expect(ADMISSION_STRUCTURE[2].units.map((u) => u.slug)).toEqual(['buet', 'ckruet']);
    expect(ADMISSION_STRUCTURE[3].units.map((u) => u.slug)).toEqual(['a', 'b', 'c']);
    expect(ADMISSION_STRUCTURE[4].units.map((u) => u.slug)).toEqual(['agriculture']);
  });

  it('every unit is subject-wise and its pattern is unverified — no marks, no timing, no questions invented', () => {
    for (const inst of ADMISSION_STRUCTURE) {
      for (const unit of inst.units) {
        expect(unit.subjectsBn.length).toBeGreaterThan(0);
        expect(unit.subjectsEn.length).toBe(unit.subjectsBn.length);
        expect(unit.patternStatus).toBe('unverified');
        expect(unit).not.toHaveProperty('marks');
        expect(unit).not.toHaveProperty('timeMinutes');
        expect(unit).not.toHaveProperty('questionCount');
      }
    }
    expect(admissionUnitByRoute('du', 'ka')?.unit.bn).toContain('ক ইউনিট');
    expect(admissionUnitByRoute('engineering', 'buet')?.unit.en).toContain('BUET');
    expect(admissionUnitByRoute('gst', 'b')?.unit.bn).toContain('B ইউনিট');
    expect(admissionUnitByRoute('nope', 'ka')).toBeNull();
    expect(admissionUnitByRoute('du', 'nope')).toBeNull();
  });
});

describe('syllabus-based exam engine (28 Nov 2026)', () => {
  it('BCS follows the verified 50th pattern — 200 marks, 120 min, −0.50, full split', () => {
    const plan = syllabusMockPlan('bcs')!;
    expect(plan.totalMarks).toBe(200);
    expect(plan.questionCount).toBe(200);
    expect(plan.timeMinutes).toBe(120);
    expect(plan.negativeMarking).toBe(0.5);
    expect(plan.negativeMarkingVerified).toBe(true);
    expect(plan.subjects).toHaveLength(10);
    const byName = new Map(plan.subjects.map((s) => [s.nameEn, s]));
    expect(byName.get('Bangla Language & Literature')!.marks).toBe(30);
    expect(byName.get('English Language & Literature')!.marks).toBe(30);
    expect(byName.get('Mathematical Reasoning')!.marks).toBe(20);
    // The owner's shorthand (Bangla 35, English 35) is NEVER the pattern.
    expect(byName.get('Bangla Language & Literature')!.marks).not.toBe(35);
  });

  it('Bank and Primary follow their verified patterns and verified negative marking', () => {
    const bank = syllabusMockPlan('bank')!;
    expect(bank.questionCount).toBe(100);
    expect(bank.timeMinutes).toBe(60);
    expect(bank.negativeMarking).toBe(0.25);
    expect(bank.negativeMarkingVerified).toBe(true);
    const primary = syllabusMockPlan('primary-teacher')!;
    expect(primary.questionCount).toBe(90);
    expect(primary.timeMinutes).toBe(90);
    expect(primary.negativeMarking).toBe(0.25);
    expect(primary.negativeMarkingVerified).toBe(true);
    expect(primary.totalMarks).toBe(90);
  });

  it('NTRCA resolves to the last-verified 18th pattern — the 19th is unresolved, never guessed', () => {
    const plan = syllabusMockPlan('ntrca')!;
    expect(plan.applicableCycle).toBe('18th');
    expect(plan.questionCount).toBe(100);
    expect(plan.timeMinutes).toBe(60);
    expect(plan.negativeMarking).toBe(0.25);
  });

  it('unknown exams return null — never a guessed pattern', () => {
    expect(syllabusMockPlan('defence')).toBeNull();
    expect(syllabusMockPlan('ministries')).toBeNull();
    expect(syllabusMockPlan('grade-11-20')).toBeNull();
    expect(syllabusMockPlan('not-an-exam')).toBeNull();
    expect(SYLLABUS_MOCK_EXAMS).toEqual(['bcs', 'bank', 'primary-teacher', 'ntrca']);
  });

  it('no full mock is publishable on verified questions alone', () => {
    for (const slug of SYLLABUS_MOCK_EXAMS) {
      const plan = syllabusMockPlan(slug)!;
      expect(plan.fullMockPossible, slug).toBe(false);
    }
    // Only BCS English has verified questions in the bundle.
    expect(bundledVerifiedCount('bcs', 'English Language & Literature')).toBe(35);
    expect(bundledVerifiedCount('bcs', 'Bangla Language & Literature')).toBe(0);
    expect(bundledVerifiedCount('bank', 'Bangla')).toBe(0);
    expect(bundledVerifiedCount('primary-teacher', 'Bangla')).toBe(0);
    expect(bundledVerifiedCount('ntrca', 'Bangla')).toBe(0);
    const bcs = syllabusMockPlan('bcs')!;
    expect(bcs.subjects.filter((s) => s.hasNoVerifiedQuestions)).toHaveLength(9);
    expect(bcs.subjects.find((s) => s.nameEn === 'English Language & Literature')!.verifiedAvailable).toBe(35);
  });

  it('the one runnable mock is the BCS English section: 30 Q, 18 min, −0.50', () => {
    const bcs = syllabusMockPlan('bcs')!;
    expect(bcs.sectionMock).toEqual({
      subjectNameEn: 'English Language & Literature',
      subjectNameBn: 'ইংরেজি ভাষা ও সাহিত্য',
      questionCount: 30,
      timeMinutes: 18,
      negativeMarking: 0.5,
    });
    for (const slug of ['bank', 'primary-teacher', 'ntrca']) {
      expect(syllabusMockPlan(slug)!.sectionMock, slug).toBeNull();
    }
  });
});

describe('Recent & Most Repeated collection (28 Nov 2026)', () => {
  it('holds exactly the 35 bundled verified BCS English questions — nothing else', () => {
    expect(RECENT_REPEATED_COUNT).toBe(35);
    expect(RECENT_REPEATED_QUESTIONS).toHaveLength(35);
    for (const r of RECENT_REPEATED_QUESTIONS) {
      expect(r.examEn).toBe('BCS');
      expect(r.question.questionText.length).toBeGreaterThan(0);
      expect(r.question.options).toHaveLength(4);
      // The published batch records no exam year — never guessed.
      expect(r.year).toBeNull();
    }
    const ids = new Set(RECENT_REPEATED_QUESTIONS.map((r) => r.question.id));
    expect(ids.size).toBe(35);
  });

  it('bank state is reported as the brief states it — and the 173 PYQs are NOT in the bundle count', () => {
    expect(BANK_STATE.jobVerified).toBe(1208);
    expect(BANK_STATE.jobNeedsReview).toBe(3568);
    expect(BANK_STATE.admissionVerified).toBe(0);
    expect(BANK_STATE.admissionPyq).toBe(0);
    expect(BANK_STATE.bcs46thPyqInBank).toBe(173);
    // The collection count (35) is the bundle count, not the bank's 173.
    expect(RECENT_REPEATED_COUNT).not.toBe(BANK_STATE.bcs46thPyqInBank);
  });
});
