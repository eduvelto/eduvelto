// Eduvelto — AdSense Part 1 (public content, F1 fix) unit tests.
//
// The 35 BCS English questions are static public data, so the tests
// guard what matters most: the exact count, the shape (4 options
// A–D, exactly one correct letter matching an option), the category
// split (20 grammar / 12 vocabulary / 3 reading), no empty text, and
// every topicId being one of the 13 known topics. The two sample
// lessons are also guarded: 400–700 words each, with the draft label
// intact (never "verified"/"approved").

import { describe, expect, it } from 'vitest';
import {
  PUBLIC_BCS_CATEGORIES,
  PUBLIC_BCS_ENGLISH_QUESTIONS,
  PUBLIC_BCS_READING_PASSAGE,
  PUBLIC_BCS_TOPICS,
  publicBcsCategoryOf,
  publicBcsQuestionsFor,
  type PublicBcsTopic,
} from '../publicBcsEnglish';
import {
  PUBLIC_LESSONS,
  publicLessonWordCount,
} from '../publicLessons';

const KNOWN_TOPICS: PublicBcsTopic[] = [
  'tense',
  'voice',
  'narration',
  'preposition',
  'right-form-of-verbs',
  'conditionals',
  'articles',
  'synonym',
  'antonym',
  'spelling',
  'idiom',
  'one-word-substitution',
  'reading',
];

describe('public BCS English questions', () => {
  it('has exactly 35 questions', () => {
    expect(PUBLIC_BCS_ENGLISH_QUESTIONS).toHaveLength(35);
  });

  it('every question has 4 options A–D', () => {
    for (const q of PUBLIC_BCS_ENGLISH_QUESTIONS) {
      expect(q.options.map((o) => o.letter)).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('exactly one correct letter, matching an option', () => {
    for (const q of PUBLIC_BCS_ENGLISH_QUESTIONS) {
      expect(['A', 'B', 'C', 'D']).toContain(q.correctLetter);
      const letters = q.options.map((o) => o.letter);
      expect(letters).toContain(q.correctLetter);
      expect(letters.filter((l) => l === q.correctLetter)).toHaveLength(1);
    }
  });

  it('category counts are 20 grammar / 12 vocabulary / 3 reading, summing to 35', () => {
    const counts = {
      grammar: publicBcsQuestionsFor('grammar').length,
      vocabulary: publicBcsQuestionsFor('vocabulary').length,
      reading: publicBcsQuestionsFor('reading').length,
    };
    expect(counts).toEqual({ grammar: 20, vocabulary: 12, reading: 3 });
    expect(counts.grammar + counts.vocabulary + counts.reading).toBe(35);
  });

  it('no empty question text, options or explanations', () => {
    for (const q of PUBLIC_BCS_ENGLISH_QUESTIONS) {
      expect(q.id.trim()).not.toBe('');
      expect(q.questionText.trim()).not.toBe('');
      expect(q.explanation.trim()).not.toBe('');
      for (const o of q.options) {
        expect(o.text.trim()).not.toBe('');
      }
    }
  });

  it('every topicId is one of the 13 known topics, with the published counts', () => {
    const counts = new Map<string, number>();
    for (const q of PUBLIC_BCS_ENGLISH_QUESTIONS) {
      expect(KNOWN_TOPICS).toContain(q.topic);
      counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([...KNOWN_TOPICS].sort());
    const expected: Record<string, number> = {
      tense: 3,
      voice: 3,
      narration: 3,
      preposition: 3,
      'right-form-of-verbs': 3,
      conditionals: 3,
      synonym: 3,
      idiom: 3,
      reading: 3,
      articles: 2,
      antonym: 2,
      spelling: 2,
      'one-word-substitution': 2,
    };
    for (const [topic, count] of Object.entries(expected)) {
      expect(counts.get(topic)).toBe(count);
    }
    // The topic table agrees with the data.
    for (const t of PUBLIC_BCS_TOPICS) {
      expect(counts.get(t.topic)).toBe(t.count);
      expect(publicBcsCategoryOf(t.topic)).toBe(t.category);
    }
  });

  it('the reading passage exists and is used by the 3 reading questions', () => {
    expect(PUBLIC_BCS_READING_PASSAGE.text.trim()).not.toBe('');
    expect(PUBLIC_BCS_READING_PASSAGE.text).toContain('Rahim');
    expect(PUBLIC_BCS_READING_PASSAGE.usedBy).toEqual([
      'bcs-eng-033',
      'bcs-eng-034',
      'bcs-eng-035',
    ]);
    const reading = publicBcsQuestionsFor('reading');
    expect(reading.map((q) => q.id)).toEqual(
      PUBLIC_BCS_READING_PASSAGE.usedBy,
    );
  });

  it('category metadata sums to 35', () => {
    expect(PUBLIC_BCS_CATEGORIES).toHaveLength(3);
    expect(
      PUBLIC_BCS_CATEGORIES.map((c) => c.category).sort(),
    ).toEqual(['grammar', 'reading', 'vocabulary']);
  });
});

describe('public sample lessons', () => {
  it('has exactly the 2 lessons, 400–700 words each', () => {
    expect(PUBLIC_LESSONS.map((l) => l.slug).sort()).toEqual([
      'preposition',
      'tense',
    ]);
    for (const lesson of PUBLIC_LESSONS) {
      const words = publicLessonWordCount(lesson);
      expect(words).toBeGreaterThanOrEqual(400);
      expect(words).toBeLessThanOrEqual(700);
    }
  });

  it('each lesson has sections, examples and common mistakes', () => {
    for (const lesson of PUBLIC_LESSONS) {
      expect(lesson.introBn.length).toBeGreaterThanOrEqual(1);
      expect(lesson.sections.length).toBeGreaterThanOrEqual(3);
      expect(lesson.mistakesBn.length).toBeGreaterThanOrEqual(3);
      for (const s of lesson.sections) {
        expect(s.headingBn.trim()).not.toBe('');
        expect(s.bodyBn.length).toBeGreaterThanOrEqual(1);
        for (const p of s.bodyBn) expect(p.trim()).not.toBe('');
      }
    }
  });
});
