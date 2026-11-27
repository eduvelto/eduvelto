import { describe, it, expect } from 'vitest';
import { generateLorem } from '../../tools/loremIpsum';

describe('generateLorem', () => {
  it('starts with Lorem ipsum and has the requested paragraphs', () => {
    const text = generateLorem({ paragraphs: 2, sentencesPerParagraph: 2 });
    expect(text.startsWith('Lorem ipsum dolor sit amet')).toBe(true);
    expect(text.split('\n\n')).toHaveLength(2);
  });
  it('is stable and deterministic', () => {
    expect(generateLorem({ paragraphs: 1, sentencesPerParagraph: 3 })).toBe(generateLorem({ paragraphs: 1, sentencesPerParagraph: 3 }));
  });
});
