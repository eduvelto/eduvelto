// Clearable number inputs — regression test (26 Nov 2026).
//
// Owner report (07:41, 26 Nov 2026): the last character of the
// পূর্ণমান (Full Marks) and সময় (মিনিট) (Time) fields in the Question
// Paper Generator setup form could not be deleted — backspace on a
// single remaining digit did nothing.
//
// Root cause: the controlled inputs committed on every keystroke with
// `Math.max(min, Number(e.target.value) || min)`. Clearing the field
// makes `Number('')` === `0`, and `0 || min` === `min`, so the value
// snapped straight back to the minimum and the input never showed
// empty. Fix: `commitClearableNumber` returns `undefined` for empty /
// non-numeric text (commit nothing, keep the field clearable) and the
// `ClearableNumberInput` keeps the raw text in a draft while editing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { commitClearableNumber } from '../clearableNumber';

const GENERATOR_SRC = readFileSync(
  resolve(__dirname, '../../pages/QuestionPaperGeneratorPage.tsx'),
  'utf8',
);

describe('commitClearableNumber', () => {
  it('empty / whitespace commits nothing (field stays clearable)', () => {
    expect(commitClearableNumber('', 1)).toBeUndefined();
    expect(commitClearableNumber('   ', 5)).toBeUndefined();
  });

  it('non-numeric text commits nothing', () => {
    expect(commitClearableNumber('abc', 1)).toBeUndefined();
    expect(commitClearableNumber('1a', 1)).toBeUndefined();
  });

  it('a valid number commits as-is', () => {
    expect(commitClearableNumber('100', 1)).toBe(100);
    expect(commitClearableNumber('60', 5)).toBe(60);
    expect(commitClearableNumber('0', 0)).toBe(0);
  });

  it('below the minimum clamps up to the minimum', () => {
    expect(commitClearableNumber('0', 1)).toBe(1);
    expect(commitClearableNumber('3', 5)).toBe(5);
    expect(commitClearableNumber('-5', 1)).toBe(1);
  });

  it('above the maximum clamps down to the maximum', () => {
    expect(commitClearableNumber('999', 1, 35)).toBe(35);
    expect(commitClearableNumber('35', 1, 35)).toBe(35);
  });

  it('a decimal floors to an integer', () => {
    expect(commitClearableNumber('12.7', 1)).toBe(12);
  });

  it('the old snap-back behaviour is gone: empty no longer yields the minimum', () => {
    // The bug: Math.max(1, Number('') || 1) === 1 and
    // Math.max(5, Number('') || 5) === 5 — the field could never clear.
    expect(commitClearableNumber('', 1)).not.toBe(1);
    expect(commitClearableNumber('', 5)).not.toBe(5);
  });
});

describe('QuestionPaperGeneratorPage uses clearable number inputs', () => {
  it('the setup Full Marks and Time fields use ClearableNumberInput', () => {
    // The পূর্ণমান and সময় (মিনিট) inputs must go through the
    // clearable component, not a raw <input type="number"> with a
    // snap-back onChange.
    expect(GENERATOR_SRC).toContain('value={setup.totalMarks}');
    expect(GENERATOR_SRC).toContain('value={setup.timeMinutes}');
    const totalMarksBlock = GENERATOR_SRC.slice(
      GENERATOR_SRC.indexOf('value={setup.totalMarks}') - 200,
      GENERATOR_SRC.indexOf('value={setup.totalMarks}') + 200,
    );
    const timeBlock = GENERATOR_SRC.slice(
      GENERATOR_SRC.indexOf('value={setup.timeMinutes}') - 200,
      GENERATOR_SRC.indexOf('value={setup.timeMinutes}') + 200,
    );
    expect(totalMarksBlock).toContain('ClearableNumberInput');
    expect(timeBlock).toContain('ClearableNumberInput');
  });

  it('no numeric setup/edit input still uses the snap-back pattern', () => {
    // Any remaining `Number(e.target.value) || <min>` onChange would
    // reintroduce the cannot-delete-last-character bug. The only
    // allowed mention is the doc comment explaining the old bug.
    const codeWithoutComments = GENERATOR_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(
      /\/\/.*$/gm,
      '',
    );
    expect(codeWithoutComments).not.toContain('Number(e.target.value)');
  });
});
