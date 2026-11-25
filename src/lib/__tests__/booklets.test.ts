// Eduvelto — suggestion-booklet tests (Phase 3, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// Guards the three products/ booklets:
// - the BCS booklet's 35 questions match the owner-verified
//   PUBLIC_BCS_ENGLISH_QUESTIONS EXACTLY (id, text, 4 options,
//   correct letter) — no transcription drift, no added question,
//   no SAMPLE-batch question smuggled in;
// - no booklet claims a guaranteed outcome ("100% কমন" /
//   "নিশ্চিত কমন" / "guaranteed" appear nowhere);
// - every booklet carries the not-for-sale notice and marks
//   verified vs draft inside;
// - Primary + Honours carry NO practice questions at all, and
//   Honours carries NO marks split.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PUBLIC_BCS_ENGLISH_QUESTIONS } from '../publicBcsEnglish';

const PRODUCTS = resolve(__dirname, '../../../products');

function read(name: string): string {
  return readFileSync(resolve(PRODUCTS, name), 'utf8');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

interface ParsedQuestion {
  id: string;
  topic: string;
  answer: string;
  text: string;
  options: Array<{ letter: string; text: string }>;
  ansLine: string;
}

function parseBcsQuestions(html: string): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];
  const articleRe =
    /<article class="q" data-id="([^"]+)" data-topic="([^"]+)" data-answer="([A-D])">([\s\S]*?)<\/article>/g;
  let m: RegExpExecArray | null;
  while ((m = articleRe.exec(html)) !== null) {
    const body = m[4];
    const text = decodeEntities(/<span class="qtext">([\s\S]*?)<\/span>/.exec(body)?.[1] ?? '');
    const options = [...body.matchAll(/<li data-letter="([A-D])">([\s\S]*?)<\/li>/g)].map((o) => ({
      letter: o[1],
      text: decodeEntities(o[2]),
    }));
    const ansLine = /<p class="ans">সঠিক উত্তর: ([A-D])<\/p>/.exec(body)?.[1] ?? '';
    out.push({ id: m[1], topic: m[2], answer: m[3], text, options, ansLine });
  }
  return out;
}

const FORBIDDEN = [
  '১০০% কমন',
  '100% কমন',
  '100% common',
  'নিশ্চিত কমন',
  'guaranteed',
  'Guaranteed',
  'নিশ্চিতভাবে আসবে',
];

describe('booklets — shared honesty rules', () => {
  const files = [
    'bcs-preliminary-suggestion.html',
    'primary-teacher-suggestion.html',
    'honours-quick-guide.html',
  ];
  it.each(files)('%s claims no guaranteed outcome', (file) => {
    const html = read(file);
    for (const s of FORBIDDEN) expect(html, `${file} contains forbidden claim ${s}`).not.toContain(s);
  });

  it.each(files)('%s carries the not-for-sale notice + verified/draft marking', (file) => {
    const html = read(file);
    expect(html).toContain('এখনো বিক্রির জন্য প্রস্তুত নয়');
    expect(html).toContain('কী যাচাইকৃত, কী খসড়া');
    expect(html).toContain('যাচাইকৃত');
    expect(html).toContain('খসড়া');
  });

  it.each(files)('%s is a standalone print-ready HTML document', (file) => {
    const html = read(file);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('@page');
    expect(html).toContain('Save as PDF');
  });
});

describe('BCS booklet — 35 verified English questions, verbatim', () => {
  const html = read('bcs-preliminary-suggestion.html');
  const parsed = parseBcsQuestions(html);

  it('contains exactly the 35 verified questions, in order, no more', () => {
    expect(parsed).toHaveLength(35);
    expect(parsed.map((q) => q.id)).toEqual(PUBLIC_BCS_ENGLISH_QUESTIONS.map((q) => q.id));
  });

  it('every question text, option and correct letter matches the verified source', () => {
    for (let i = 0; i < PUBLIC_BCS_ENGLISH_QUESTIONS.length; i += 1) {
      const want = PUBLIC_BCS_ENGLISH_QUESTIONS[i];
      const got = parsed[i];
      expect(got.text, `${want.id} text`).toBe(want.questionText);
      expect(got.topic, `${want.id} topic`).toBe(want.topic);
      expect(got.answer, `${want.id} answer`).toBe(want.correctLetter);
      expect(got.ansLine, `${want.id} answer line`).toBe(want.correctLetter);
      expect(got.options, `${want.id} options`).toEqual(
        want.options.map((o) => ({ letter: o.letter, text: o.text })),
      );
    }
  });

  it('carries the verified pattern (200 marks, 2h, −0.50) and the reading passage', () => {
    expect(html).toContain('২০০');
    expect(html).toContain('০.৫০');
    expect(html).toContain('Rahim is a school teacher in a small village');
    expect(html).toContain('BPSC');
  });

  it('excludes the SAMPLE literature batch (owner review pending)', () => {
    expect(html).toContain('SAMPLE');
    expect(html).toContain('রাখা হয়নি');
    expect(parsed.map((q) => q.id).some((id) => id.includes('lit'))).toBe(false);
  });

  it('does not label the practice questions as previous-year questions', () => {
    expect(html).toContain('এগুলোকে বিগত বছরের প্রশ্ন হিসেবে দাবি করা হয় না');
  });
});

describe('Primary booklet — verified pattern, zero questions', () => {
  const html = read('primary-teacher-suggestion.html');

  it('carries the verified DPE 2025 pattern', () => {
    expect(html).toContain('৯০');
    expect(html).toContain('−০.২৫');
    expect(html).toContain('পাস নম্বর');
    expect(html).toContain('৪৫');
    expect(html).toContain('ভাইভা');
    expect(html).toContain('২০২৫');
  });

  it('contains no practice question at all', () => {
    expect(parseBcsQuestions(html)).toHaveLength(0);
    expect(html).toContain('একটিও প্রশ্ন নেই');
  });
});

describe('Honours booklet — verified routine, zero questions, no marks split', () => {
  const html = read('honours-quick-guide.html');

  it('carries all 8 papers with codes and dates', () => {
    for (const code of ['231101', '231103', '231105', '231107', '231109', '231111', '231113', '231115']) {
      expect(html).toContain(code);
    }
    expect(html).toContain('Elizabethan');
    expect(html).toContain('Victorian Poetry');
    expect(html).toContain('Introduction to Linguistics');
    expect(html).toContain('২৫ নভেম্বর ২০২৬');
    expect(html).toContain('৭ জানুয়ারি ২০২৭');
  });

  it('writes NO marks split (Part B unverified)', () => {
    expect(html).toContain('নম্বর-বণ্টন');
    expect(html).toContain('লেখা হয়নি');
    expect(parseBcsQuestions(html)).toHaveLength(0);
  });
});
