// Eduvelto — Job & Admission Prep tests (owner order 28 Nov 2026,
// 10:23). Guards the honest scope: verified patterns only, no
// guessed negative marking, no full mock where verified questions
// do not cover the syllabus, and a Recent & Most Repeated
// collection that holds ONLY the 208 bundled verified questions —
// the 35 BCS English Batch-1 questions plus the 173 verified 46th
// BCS Preliminary PYQs, published to the bundle 28 Nov 2026.
// Nothing unverified is ever faked into the count.

import { describe, expect, it } from 'vitest';
import {
  ADMISSION_STRUCTURE,
  BANK_STATE,
  RECENT_REPEATED_COUNT,
  RECENT_REPEATED_QUESTIONS,
  SYLLABUS_MOCK_EXAMS,
  admissionUnitByRoute,
  bnDigits,
  bundledVerifiedCount,
  syllabusMockPlan,
} from '../jobAdmissionPrep';
import {
  PUBLIC_BCS_PYQ_QUESTIONS,
  PUBLIC_BCS_PYQ_SUBJECTS,
  publicBcsPyqCountBySubject,
} from '../publicBcsPyq';

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
    // Bundled verified pool: 35 Batch-1 English + 173 46th BCS PYQs.
    expect(bundledVerifiedCount('bcs', 'English Language & Literature')).toBe(66);
    expect(bundledVerifiedCount('bcs', 'Bangla Language & Literature')).toBe(31);
    expect(bundledVerifiedCount('bcs', 'Bangladesh Affairs')).toBe(29);
    expect(bundledVerifiedCount('bcs', 'International Affairs')).toBe(19);
    expect(bundledVerifiedCount('bcs', 'Computer & ICT')).toBe(15);
    expect(bundledVerifiedCount('bcs', 'General Science')).toBe(14);
    expect(bundledVerifiedCount('bcs', 'Ethics, Values & Good Governance')).toBe(10);
    expect(bundledVerifiedCount('bcs', 'Geography, Environment & Disaster Management')).toBe(9);
    expect(bundledVerifiedCount('bcs', 'Mathematical Reasoning')).toBe(8);
    expect(bundledVerifiedCount('bcs', 'Mental Ability')).toBe(7);
    expect(bundledVerifiedCount('bank', 'Bangla')).toBe(0);
    expect(bundledVerifiedCount('primary-teacher', 'Bangla')).toBe(0);
    expect(bundledVerifiedCount('ntrca', 'Bangla')).toBe(0);
    const bcs = syllabusMockPlan('bcs')!;
    // Every BCS subject now has verified questions — but several are
    // still below their marks (e.g. International 19 < 25, Math
    // 8 < 20), so no full mock is publishable.
    expect(bcs.subjects.filter((s) => s.hasNoVerifiedQuestions)).toHaveLength(0);
    expect(bcs.subjects.find((s) => s.nameEn === 'English Language & Literature')!.verifiedAvailable).toBe(66);
    expect(bcs.subjects.find((s) => s.nameEn === 'International Affairs')!.verifiedAvailable).toBe(19);
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

describe('bnDigits (28 Nov 2026)', () => {
  it('converts Western digits to Bengali digits, keeping the decimal point', () => {
    expect(bnDigits(0)).toBe('০');
    expect(bnDigits(35)).toBe('৩৫');
    expect(bnDigits(1208)).toBe('১২০৮');
    expect(bnDigits('0.50')).toBe('০.৫০');
    expect(bnDigits(200)).toBe('২০০');
  });
});

describe('Recent & Most Repeated collection (28 Nov 2026)', () => {
  it('holds exactly the 208 bundled verified questions — 35 Batch-1 English + 173 46th BCS PYQs', () => {
    expect(RECENT_REPEATED_COUNT).toBe(208);
    expect(RECENT_REPEATED_QUESTIONS).toHaveLength(208);
    for (const r of RECENT_REPEATED_QUESTIONS) {
      expect(r.examEn).toMatch(/^(BCS|46th BCS Preliminary)$/);
      expect(r.question.questionText.length).toBeGreaterThan(0);
      expect(r.question.options).toHaveLength(4);
      expect(r.question.explanation.length).toBeGreaterThan(0);
      // The correct letter must point at one of the four options.
      expect(['A', 'B', 'C', 'D']).toContain(r.question.correctLetter);
    }
    const ids = new Set(RECENT_REPEATED_QUESTIONS.map((r) => r.question.id));
    expect(ids.size).toBe(208);
    // Batch 1: 35, no exam year recorded — never guessed.
    const batch1 = RECENT_REPEATED_QUESTIONS.filter((r) => r.question.id.startsWith('bcs-eng-'));
    expect(batch1).toHaveLength(35);
    for (const r of batch1) {
      expect(r.examEn).toBe('BCS');
      expect(r.year).toBeNull();
      expect(r.subtopic).toBeUndefined();
    }
    // PYQs: 173, recorded year 2024, each with its bank topic.
    const pyq = RECENT_REPEATED_QUESTIONS.filter((r) => r.question.id.startsWith('PYQ-BCS46-'));
    expect(pyq).toHaveLength(173);
    for (const r of pyq) {
      expect(r.examEn).toBe('46th BCS Preliminary');
      expect(r.year).toBe(2024);
      expect(r.subtopic).toBeTruthy();
    }
  });

  it('the PYQ bundle file holds exactly the 173 verified questions, per subject', () => {
    expect(PUBLIC_BCS_PYQ_QUESTIONS).toHaveLength(173);
    expect(PUBLIC_BCS_PYQ_SUBJECTS).toHaveLength(10);
    const total = PUBLIC_BCS_PYQ_SUBJECTS.reduce((sum, s) => sum + s.count, 0);
    expect(total).toBe(173);
    for (const s of PUBLIC_BCS_PYQ_SUBJECTS) {
      // The table count must match the questions actually in the file.
      expect(publicBcsPyqCountBySubject(s.subject)).toBe(s.count);
    }
    const ids = new Set(PUBLIC_BCS_PYQ_QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(173);
    const qnos = PUBLIC_BCS_PYQ_QUESTIONS.map((q) => q.paperQno).sort((a, b) => a - b);
    expect(qnos[0]).toBe(2);
    expect(qnos[qnos.length - 1]).toBe(200);
    expect(new Set(qnos).size).toBe(173);
    for (const q of PUBLIC_BCS_PYQ_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(q.explanation.length).toBeGreaterThan(0);
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('bank state is reported as the brief states it — and the 173 PYQs ARE now in the bundle count', () => {
    expect(BANK_STATE.jobVerified).toBe(1208);
    expect(BANK_STATE.jobNeedsReview).toBe(3568);
    expect(BANK_STATE.admissionVerified).toBe(0);
    expect(BANK_STATE.admissionPyq).toBe(0);
    expect(BANK_STATE.bcs46thPyqInBank).toBe(173);
    // The collection count is the bundle count: 35 Batch-1 + 173 PYQs.
    expect(RECENT_REPEATED_COUNT).toBe(35 + BANK_STATE.bcs46thPyqInBank);
  });
});
