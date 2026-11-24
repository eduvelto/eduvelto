// Eduvelto — bilingual lesson answers (owner report 24 Nov 2026).
//
// The Class 9 English 1st Paper lesson "10 Short Questions" showed ONLY
// the Bangla answer for every English question, although the data
// carries both (verified in the 24 Nov backup:
// ssc-english-1st-paper--part-b, 10/10 questions with `answer` +
// `answerBn`). The reader picked `answerBn || answer`; this pins the
// rule: primary = the question's own language, Bangla = second line
// only when it exists and differs.
import { describe, expect, it } from 'vitest';
import { pickLessonAnswers } from '../lessonAnswers';
import type { LessonQuestion } from '../content';

function q(over: Partial<LessonQuestion>): LessonQuestion {
  return {
    n: 1,
    kind: 'short',
    label: 'Q1',
    question: 'What is skimming?',
    topic: '',
    options: [],
    correctLetter: '',
    correctText: '',
    answer: '',
    answerBn: '',
    explanation: '',
    ...over,
  };
}

describe('pickLessonAnswers (bilingual answers)', () => {
  it('bilingual English pack: English primary + Bangla second line', () => {
    const r = pickLessonAnswers(
      q({
        answer: 'Skimming is reading quickly to get the general idea of a text.',
        answerBn: 'স্কিমিং মানে মূল ভাব বোঝার জন্য দ্রুত পড়া।',
      }),
    );
    expect(r.primary).toContain('Skimming is reading quickly');
    expect(r.bangla).toContain('স্কিমিং মানে');
  });

  it('only English: primary only, no Bangla line', () => {
    const r = pickLessonAnswers(q({ answer: 'Only English.' }));
    expect(r.primary).toBe('Only English.');
    expect(r.bangla).toBe('');
  });

  it('only Bangla: falls back to Bangla as primary, no duplicate line', () => {
    const r = pickLessonAnswers(q({ answerBn: 'শুধু বাংলা।' }));
    expect(r.primary).toBe('শুধু বাংলা।');
    expect(r.bangla).toBe('');
  });

  it('identical answers: no duplicate Bangla line', () => {
    const r = pickLessonAnswers(q({ answer: 'Same.', answerBn: 'Same.' }));
    expect(r.primary).toBe('Same.');
    expect(r.bangla).toBe('');
  });

  it('no answer fields: falls back to correctText', () => {
    const r = pickLessonAnswers(q({ correctText: 'Option A' }));
    expect(r.primary).toBe('Option A');
    expect(r.bangla).toBe('');
  });

  it('nothing at all: both empty', () => {
    const r = pickLessonAnswers(q({}));
    expect(r.primary).toBe('');
    expect(r.bangla).toBe('');
  });
});
