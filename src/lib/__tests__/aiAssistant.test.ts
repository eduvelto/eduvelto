// Unit tests — AI Life Assistant deterministic tools (./aiAssistant.ts).
// Pure functions only: no network, no AI, no Firestore.

import { describe, it, expect } from 'vitest';
import {
  ASSISTANT_TOOLS,
  calcBmi,
  calcCompoundInterest,
  calcEmi,
  calcPercentage,
  calcSimpleInterest,
  COMMON_PHRASES,
  convertCurrency,
  convertLength,
  convertTemperature,
  convertWeight,
  buildApplication,
  buildCv,
  buildDayPlan,
  buildEmail,
  buildLetter,
  buildStudyPlan,
  summarizeBudget,
} from '../aiAssistant';

describe('tool registry', () => {
  it('has unique ids and no tool needs login', () => {
    const ids = ASSISTANT_TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ASSISTANT_TOOLS.every((t) => t.needsLogin === false)).toBe(true);
    expect(ASSISTANT_TOOLS.map((t) => t.id)).toContain('chat');
    expect(ASSISTANT_TOOLS.map((t) => t.id)).toContain('calculator');
  });
});

describe('calcEmi', () => {
  it('computes a known EMI (100000 at 12% for 12 months ≈ 8885)', () => {
    const r = calcEmi(100000, 12, 12);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.emi).toBeCloseTo(8884.88, 0);
    expect(r.value.totalPayable).toBeCloseTo(r.value.emi * 12, 6);
    expect(r.value.totalInterest).toBeCloseTo(r.value.totalPayable - 100000, 6);
  });

  it('handles 0% interest as principal / months', () => {
    const r = calcEmi(12000, 0, 12);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.emi).toBe(1000);
    expect(r.value.totalInterest).toBe(0);
  });

  it('rejects negative principal and non-integer months', () => {
    expect(calcEmi(-100, 12, 12).ok).toBe(false);
    expect(calcEmi(10000, 12, 0).ok).toBe(false);
    expect(calcEmi(10000, 12, 12.5).ok).toBe(false);
  });
});

describe('interest + percentage', () => {
  it('simple interest: 10000 at 10% for 2 years = 2000', () => {
    const r = calcSimpleInterest(10000, 10, 2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.interest).toBe(2000);
    expect(r.value.total).toBe(12000);
  });

  it('compound interest exceeds simple interest for the same inputs', () => {
    const s = calcSimpleInterest(10000, 10, 2);
    const c = calcCompoundInterest(10000, 10, 2, 12);
    expect(s.ok && c.ok).toBe(true);
    if (!s.ok || !c.ok) return;
    expect(c.value.interest).toBeGreaterThan(s.value.interest);
    expect(c.value.total).toBeCloseTo(10000 * Math.pow(1 + 0.1 / 12, 24), 0);
  });

  it('percentage: 45 of 90 = 50%', () => {
    const r = calcPercentage(45, 90);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(50);
  });

  it('percentage rejects a zero total', () => {
    expect(calcPercentage(5, 0).ok).toBe(false);
  });
});

describe('calcBmi', () => {
  it('70kg / 170cm ≈ 24.22, Normal', () => {
    const r = calcBmi(70, 170);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.bmi).toBeCloseTo(24.22, 1);
    expect(r.value.categoryEn).toBe('Normal');
  });

  it('classifies underweight and obese', () => {
    const under = calcBmi(45, 175);
    expect(under.ok && under.value.categoryEn).toBe('Underweight');
    const obese = calcBmi(110, 165);
    expect(obese.ok && obese.value.categoryEn).toBe('Obese');
  });

  it('rejects zero weight', () => {
    expect(calcBmi(0, 170).ok).toBe(false);
  });
});

describe('converters', () => {
  it('length: 1 km = 1000 m; 1 mile ≈ 1609.34 m', () => {
    expect(convertLength(1, 'km', 'm')).toEqual({ ok: true, value: 1000 });
    const mile = convertLength(1, 'mile', 'm');
    expect(mile.ok && mile.value).toBeCloseTo(1609.344, 2);
  });

  it('weight: 1 kg = 1000 g; 1 lb ≈ 453.59 g', () => {
    expect(convertWeight(1, 'kg', 'g')).toEqual({ ok: true, value: 1000 });
    const lb = convertWeight(1, 'lb', 'g');
    expect(lb.ok && lb.value).toBeCloseTo(453.59237, 2);
  });

  it('temperature: 100°C = 212°F = 373.15K; 0°C = 32°F', () => {
    expect(convertTemperature(100, 'C', 'F')).toEqual({ ok: true, value: 212 });
    expect(convertTemperature(100, 'C', 'K')).toEqual({ ok: true, value: 373.15 });
    expect(convertTemperature(0, 'C', 'F')).toEqual({ ok: true, value: 32 });
    expect(convertTemperature(32, 'F', 'C')).toEqual({ ok: true, value: 0 });
  });

  it('temperature rejects below absolute zero', () => {
    expect(convertTemperature(-300, 'C', 'F').ok).toBe(false);
  });

  it('currency uses the user-entered rate and rejects a zero rate', () => {
    const r = convertCurrency(100, 122.5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(12250);
    expect(convertCurrency(100, 0).ok).toBe(false);
    expect(convertCurrency(100, -5).ok).toBe(false);
  });
});

describe('summarizeBudget', () => {
  it('adds expenses and computes the remainder + savings rate', () => {
    const r = summarizeBudget(50000, [
      { label: 'বাড়ি ভাড়া', amount: 15000 },
      { label: 'খাবার', amount: 12000 },
      { label: 'যাতায়াত', amount: 3000 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.totalExpenses).toBe(30000);
    expect(r.value.remaining).toBe(20000);
    expect(r.value.savingsRatePct).toBe(40);
    expect(r.value.overBudget).toBe(false);
  });

  it('flags over-budget months', () => {
    const r = summarizeBudget(20000, [{ label: 'খরচ', amount: 25000 }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.overBudget).toBe(true);
    expect(r.value.remaining).toBe(-5000);
  });

  it('rejects an unnamed expense', () => {
    expect(summarizeBudget(20000, [{ label: '  ', amount: 100 }]).ok).toBe(false);
  });
});

describe('buildDayPlan', () => {
  it('sorts tasks by time and drops empty rows', () => {
    const r = buildDayPlan([
      { time: '14:00', label: 'দুপুরের খাবার' },
      { time: '06:00', label: 'ফজরের নামাজ' },
      { time: '09:30', label: 'পড়া' },
      { time: '10:00', label: '   ' },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.count).toBe(3);
    expect(r.value.tasks.map((t) => t.time)).toEqual(['06:00', '09:30', '14:00']);
  });

  it('rejects a bad time format', () => {
    expect(buildDayPlan([{ time: '9:30', label: 'পড়া' }]).ok).toBe(false);
    expect(buildDayPlan([{ time: '25:00', label: 'পড়া' }]).ok).toBe(false);
  });
});

describe('document builders', () => {
  it('letter (Bangla) contains the sender, subject and body', () => {
    const r = buildLetter({
      senderName: 'রহিম উদ্দিন',
      senderAddress: 'কক্সবাজার',
      date: '২৩ নভেম্বর ২০২৬',
      recipientName: 'প্রধান শিক্ষক',
      recipientAddress: 'সরকারি উচ্চ বিদ্যালয়',
      subject: 'ছুটির আবেদন',
      body: 'আমি দুদিনের ছুটি চাই।',
      lang: 'bn',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toContain('রহিম উদ্দিন');
    expect(r.value).toContain('বিষয়: ছুটির আবেদন');
    expect(r.value).toContain('আমি দুদিনের ছুটি চাই।');
  });

  it('application (English) contains the purpose and closing', () => {
    const r = buildApplication({
      applicantName: 'Karim',
      applicantAddress: 'Dhaka',
      date: '23 Nov 2026',
      authorityName: 'The Manager',
      authorityAddress: 'ABC Ltd',
      purpose: 'Application for the post of Assistant',
      details: 'I have completed HSC and I am interested in this post.',
      lang: 'en',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toContain('Subject: Application for the post of Assistant');
    expect(r.value).toContain('Sincerely yours,');
  });

  it('email includes To, Subject and sender', () => {
    const r = buildEmail({
      to: 'office@example.com',
      subject: 'Leave request',
      greeting: 'Dear Sir,',
      body: 'I need one day of leave tomorrow.',
      closing: 'Thank you,',
      senderName: 'Karim',
      lang: 'en',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toContain('To: office@example.com');
    expect(r.value).toContain('Subject: Leave request');
    expect(r.value).toContain('Karim');
  });

  it('CV contains name, objective and sections', () => {
    const r = buildCv({
      name: 'Karim Uddin',
      phone: '01XXXXXXXXX',
      email: 'karim@example.com',
      address: 'Cox’s Bazar',
      objective: 'To work honestly and learn every day.',
      education: ['HSC, Science, 2022'],
      skills: ['MS Word', 'Bangla typing'],
      experience: [],
      lang: 'en',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toContain('Karim Uddin');
    expect(r.value).toContain('Objective');
    expect(r.value).toContain('HSC, Science, 2022');
  });

  it('builders reject missing required fields', () => {
    expect(
      buildLetter({
        senderName: '',
        senderAddress: '',
        date: '',
        recipientName: '',
        recipientAddress: '',
        subject: '',
        body: '',
        lang: 'bn',
      }).ok,
    ).toBe(false);
    expect(
      buildCv({
        name: '',
        phone: '',
        email: '',
        address: '',
        objective: '',
        education: [],
        skills: [],
        experience: [],
        lang: 'en',
      }).ok,
    ).toBe(false);
  });
});

describe('phrasebook + study plan', () => {
  it('phrasebook has Bangla + English for every entry', () => {
    expect(COMMON_PHRASES.length).toBeGreaterThanOrEqual(15);
    for (const p of COMMON_PHRASES) {
      expect(p.bn.trim().length).toBeGreaterThan(0);
      expect(p.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('study plan names the topic and says it is a template', () => {
    const r = buildStudyPlan('ভগ্নাংশ', 'bn');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toContain('ভগ্নাংশ');
    expect(r.value).toContain('পরিকল্পনার ছক');
    expect(buildStudyPlan('   ', 'bn').ok).toBe(false);
  });
});
