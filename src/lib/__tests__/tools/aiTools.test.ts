// Eduvelto — AI tools shared logic tests (28 Nov 2026, global batch item 2).
import { describe, expect, it } from 'vitest';
import {
  AI_SUMMARY_MAX_CHUNKS,
  AI_TEXT_MAX_CHARS,
  aiFailureText,
  chunkTextForAi,
  grammarPrompt,
  mathPrompt,
  pdfQaPrompt,
  pickRelevantChunks,
  resumePrompt,
  splitResumeOutput,
  summaryChunkPrompt,
  summaryCombinePrompt,
} from '../../tools/aiTools';
import { toBnDigits } from '../../aiQuota';
import { TOOLS_META } from '../../toolsMeta';

describe('chunkTextForAi', () => {
  it('returns one chunk for short text and none for blank text', () => {
    expect(chunkTextForAi('Hello world')).toEqual(['Hello world']);
    expect(chunkTextForAi('   ')).toEqual([]);
  });

  it('never exceeds the cap and keeps sentences together where possible', () => {
    const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} about Dhaka.`).join(' ');
    const chunks = chunkTextForAi(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(100);
    expect(chunks.join(' ')).toBe(text);
  });

  it('hard-splits a single over-long sentence', () => {
    const chunks = chunkTextForAi('x'.repeat(5000), 1500);
    expect(chunks).toHaveLength(4);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1500);
    expect(chunks.join('')).toBe('x'.repeat(5000));
  });

  it('splits on the Bangla danda too', () => {
    const text = 'প্রথম বাক্য। দ্বিতীয় বাক্য। তৃতীয় বাক্য।';
    expect(chunkTextForAi(text, 20).length).toBeGreaterThan(1);
  });
});

describe('pickRelevantChunks', () => {
  const text = [
    'The cat sat on the mat in Dhaka.',
    'Photosynthesis is how green plants make food from sunlight.',
    'The Padma Bridge connects the south of Bangladesh.',
  ].join(' ');

  it('picks the chunk containing the question words', () => {
    const picked = pickRelevantChunks(text, 'What is photosynthesis?', 1, 60);
    expect(picked).toHaveLength(1);
    expect(picked[0]).toContain('Photosynthesis');
  });

  it('falls back to the first chunk when nothing overlaps', () => {
    const picked = pickRelevantChunks(text, 'quantum entanglement', 1, 60);
    expect(picked).toHaveLength(1);
    expect(picked[0]).toContain('cat');
  });

  it('returns chunks in original order', () => {
    const picked = pickRelevantChunks(text, 'Dhaka Bangladesh bridge', 2, 60);
    expect(picked[0]).toContain('cat');
    expect(picked[1]).toContain('Padma Bridge');
  });
});

describe('aiFailureText', () => {
  it('covers all three failure kinds in both languages', () => {
    expect(aiFailureText({ kind: 'not-configured' }, 'bn')).toContain('সংযুক্ত নেই');
    expect(aiFailureText({ kind: 'not-configured' }, 'en')).toContain('not connected');
    // Owner rule 3c: quota-exhausted is the EXACT friendly message
    // (live registry count), never a red error. English UI keeps the
    // Bangla verbatim with a short gloss beneath it.
    const exactBn = `আজকের ফ্রি AI কোটা পূর্ণ হয়েছে, আগামীকাল আবার চেষ্টা করুন বা আমাদের ${toBnDigits(TOOLS_META.length)}টি অফলাইন টুল ব্যবহার করুন।`;
    expect(aiFailureText({ kind: 'quota-exhausted' }, 'bn')).toBe(exactBn);
    expect(aiFailureText({ kind: 'quota-exhausted' }, 'en')).toContain(exactBn);
    expect(aiFailureText({ kind: 'quota-exhausted' }, 'en')).toContain(
      `${TOOLS_META.length} offline tools`,
    );
    expect(
      aiFailureText(
        { kind: 'error', messageBn: 'বাংলা ত্রুটি', messageEn: 'English error' },
        'en',
      ),
    ).toBe('English error');
  });
});

describe('prompt builders', () => {
  it('summary prompts stay inside the 2000-char askAssistant limit with a full chunk', () => {
    const chunk = 'a'.repeat(AI_TEXT_MAX_CHARS);
    expect(summaryChunkPrompt(chunk, 'en').length).toBeLessThanOrEqual(2000);
    expect(summaryChunkPrompt(chunk, 'bn').length).toBeLessThanOrEqual(2000);
    expect(summaryCombinePrompt('b'.repeat(AI_TEXT_MAX_CHARS), 'en').length).toBeLessThanOrEqual(2000);
    expect(pdfQaPrompt('c'.repeat(AI_TEXT_MAX_CHARS), 'What?', 'en').length).toBeLessThanOrEqual(2000);
  });

  it('grammar prompt carries mode, language and text', () => {
    expect(grammarPrompt('She go to school.', 'correct', 'English')).toContain('Correct the grammar');
    expect(grammarPrompt('She go to school.', 'paraphrase', 'English')).toContain('Paraphrase');
    expect(grammarPrompt('আমি যাই।', 'correct', 'Bangla')).toContain('Bangla');
  });

  it('math prompt asks for steps and a final answer line', () => {
    const prompt = mathPrompt('2x + 6 = 14', 'en');
    expect(prompt).toContain('step by step');
    expect(prompt).toContain('final answer');
    expect(prompt).toContain('2x + 6 = 14');
  });

  it('resume prompt forbids inventing experience and defines the two sections', () => {
    const prompt = resumePrompt('Cashier wanted', 'Worked at a shop 2023-2025');
    expect(prompt).toContain('BULLETS:');
    expect(prompt).toContain('COVER LETTER:');
    expect(prompt).toContain('do not invent');
    expect(prompt).toContain('Cashier wanted');
  });

  it('caps the summary at a bounded number of chunks', () => {
    expect(AI_SUMMARY_MAX_CHUNKS).toBe(10);
  });
});

describe('splitResumeOutput', () => {
  it('splits on the COVER LETTER marker and strips the BULLETS marker', () => {
    const out = splitResumeOutput('BULLETS:\n- Did X\nCOVER LETTER:\nDear Hiring Manager,');
    expect(out.bullets).toBe('- Did X');
    expect(out.coverLetter).toBe('Dear Hiring Manager,');
  });

  it('accepts the Bangla cover-letter marker', () => {
    const out = splitResumeOutput('- Did X\nকভার লেটার:\nপ্রিয় নিয়োগকারী,');
    expect(out.bullets).toBe('- Did X');
    expect(out.coverLetter).toBe('প্রিয় নিয়োগকারী,');
  });

  it('returns the whole reply as the cover letter when markers are missing', () => {
    const out = splitResumeOutput('Some free-form reply without markers.');
    expect(out.bullets).toBe('');
    expect(out.coverLetter).toBe('Some free-form reply without markers.');
  });
});
